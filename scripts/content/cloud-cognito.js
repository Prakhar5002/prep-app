window.PREP_SITE.registerTopic({
  id: "cloud-cognito",
  module: "cloud",
  title: "Cognito",
  estimatedReadTime: "40 min",
  tags: ["aws","cognito","auth","jwt","oauth2","oidc","saml","pkce","rbac","identity-pools","lambda-triggers"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">A <strong>user pool</strong> authenticates users and issues JWTs; an <strong>identity pool</strong> swaps those for temporary AWS credentials. Send the <strong>access token</strong> to APIs, verify it locally against the JWKS (iss, exp, token_use, client_id), and keep authorization decisions in your code and data layer.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>User pool</strong> = directory + OAuth2/OIDC server (sign-up/in, MFA, federation, triggers). <strong>Identity pool</strong> = token → IAM role → STS credentials for direct AWS calls (S3, IoT), including guests.</li>
    <li><strong>ID token</strong>: identity for the client, <code>aud</code> = client ID. <strong>Access token</strong>: scopes and groups for APIs, <code>client_id</code> and <strong>no aud</strong>. <strong>Refresh token</strong>: opaque, only for Cognito, kept in secure storage. Defaults are 1 h / 1 h / 30 days.</li>
    <li><strong>Verify:</strong> JWKS by <code>kid</code> → RS256 signature → <code>iss</code> → <code>exp</code> (with skew) → <code>token_use</code> → <code>client_id</code>/<code>aud</code>. Use <code>aws-jwt-verify</code> or <code>jose</code> at module scope. Invalid → 401, not allowed → 403.</li>
    <li><strong>Stateless means no instant revocation:</strong> sign-out and disable stop <em>refresh</em>. Mitigate with short access tokens, a DB disabled/tokenVersion check, and deny in pre-token-generation.</li>
    <li><strong>Flows:</strong> SRP for native screens, code + PKCE via managed login for social and SAML, client credentials for M2M. Public clients (mobile/SPA) have <strong>no secret</strong>. Never use the implicit grant.</li>
    <li><strong>Federation</strong> (Google, Apple, SAML, OIDC): the pool is the SP, attributes are mapped, users are created just in time, and your API sees normal pool tokens. Duplicate accounts need a linking policy.</li>
    <li><strong>Triggers</strong> run synchronously with a short timeout and retries: pre sign-up, post confirmation, <strong>pre token generation</strong> (custom claims and scopes, which also runs on refresh), custom auth, user migration. Keep them fast and idempotent.</li>
    <li><strong>RBAC:</strong> groups (<code>cognito:groups</code>) for coarse roles; DB permissions plus pointer claims (<code>tenantId</code>) for fine-grained access. Claims are snapshots until refresh.</li>
    <li><strong>API Gateway:</strong> the REST Cognito authorizer takes the ID token by default, or the access token with scopes. The HTTP API JWT authorizer checks issuer + audience. A Lambda authorizer covers custom logic. The handler still does resource-level checks.</li>
    <li><strong>Security traps:</strong> user-writable <code>custom:role</code>, tenant IDs from the query string, client secrets in apps, an <code>aud</code> check on access tokens, logged tokens.</li>
    <li><strong>Immutable</strong> after creation: sign-in aliases, case sensitivity, required attributes. Custom attributes can't be deleted. Password hashes <strong>can't be exported</strong>. Use <code>RETAIN</code>.</li>
    <li><strong>Ops:</strong> the default email sender is capped (use SES), SMS starts in the SNS sandbox, a custom domain needs an ACM cert in us-east-1, quotas are per API category, and a pool lives in one region.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Pointing generic JWT middleware at Cognito with <code>audience: clientId</code></strong>. Every access token fails (there's no <code>aud</code>), so the team disables the audience check and now accepts tokens from <em>any</em> app client in the pool, or switches to sending ID tokens. Fix: verify <code>token_use === 'access'</code> and check <code>client_id</code> against an allowlist (or use <code>aws-jwt-verify</code>, which does this for you).</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"The user pool proves who you are with JWTs; the identity pool is only for when the client needs AWS credentials directly. Most apps just need the user pool and a JWT check on the API."</div>
  <div class="revision-say">"I send the access token, verify signature, issuer, expiry, token_use and client_id locally, and keep access tokens short because stateless JWTs can't be revoked before they expire."</div>
  <div class="revision-say">"Cognito gives me identity and coarse groups. Tenancy and permissions come from claims I control via pre-token-generation and are enforced in the data layer, never from request parameters."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>The problem Cognito solves</h3>
<p>Every app needs sign-up, sign-in, password reset, email/phone verification, MFA, "Sign in with Google/Apple", enterprise SSO, token issuance and refresh, brute-force protection, and somewhere to store users securely. Building that yourself is a security liability. Cognito is the AWS-native answer. Its main selling points are that it's cheap at scale, it plugs straight into API Gateway authorizers and IAM, and the data stays in your AWS account.</p>

<h3>What a user pool gives you</h3>
<table>
  <thead><tr><th>Capability</th><th>Detail</th></tr></thead>
  <tbody>
    <tr><td>Directory</td><td>Users with standard attributes (email, phone, name…) + up to 50 <code>custom:</code> attributes; groups</td></tr>
    <tr><td>Sign-in APIs</td><td>SRP (password never sent), plain password, custom challenge flows, and newer passwordless options (email/SMS OTP, passkeys; check current docs and feature plan)</td></tr>
    <tr><td>OAuth 2.0 / OIDC server</td><td><code>/oauth2/authorize</code>, <code>/oauth2/token</code>, <code>/oauth2/userInfo</code>, <code>/logout</code>, <code>/oauth2/revoke</code> on a Cognito or custom domain; authorization code + PKCE, client credentials</td></tr>
    <tr><td>Hosted sign-in pages</td><td>"Hosted UI", now <strong>managed login</strong> with a branding editor (late 2024)</td></tr>
    <tr><td>Federation</td><td>Social (Google, Apple, Facebook, Amazon), SAML 2.0 and OIDC enterprise IdPs (Okta, Entra ID, Google Workspace…)</td></tr>
    <tr><td>MFA &amp; security</td><td>TOTP, SMS, email OTP; compromised-credential and adaptive-auth checks in the higher tier</td></tr>
    <tr><td>Lambda triggers</td><td>Hooks into sign-up, auth, token generation, messaging and migration</td></tr>
  </tbody>
</table>
<p><strong>Feature plans</strong> (since late 2024): <em>Lite</em>, <em>Essentials</em> (default for new pools) and <em>Plus</em> (threat protection). Pricing is per monthly active user with a free tier, and federated (SAML/OIDC) users are priced differently. The numbers and plan contents change, so check current pricing before you quote figures.</p>

<h3>Why teams pick Cognito</h3>
<ul>
  <li><strong>AWS-native:</strong> a built-in API Gateway authorizer, identity pools for direct S3/IoT access, IAM, CloudTrail, and IaC with CDK/CloudFormation/Amplify.</li>
  <li><strong>Cost at scale:</strong> MAU pricing is usually far below Auth0/Okta for consumer apps with many users.</li>
  <li><strong>Data residency:</strong> users live in a region you pick, in your account.</li>
</ul>

<h3>Why teams regret Cognito (say this honestly in interviews)</h3>
<ul>
  <li><strong>Immutable decisions:</strong> sign-in identifiers (username vs email/phone alias), username case sensitivity and required standard attributes can't be changed after the pool is created. Getting one wrong means a new pool and a user migration.</li>
  <li><strong>Password hashes can't be exported.</strong> Leaving Cognito means a forced reset or a lazy migration. That is real lock-in.</li>
  <li><strong>Multi-region:</strong> a user pool lives in one region. Cross-region DR needs your own design (check current docs for any newer replication features).</li>
  <li><strong>No inbound SCIM provisioning</strong> for enterprise deprovisioning at the time of writing, plus per-API request quotas, and trickier customization than Auth0 Actions or Clerk components.</li>
</ul>

<h3>Cognito vs alternatives</h3>
<table>
  <thead><tr><th></th><th>Cognito</th><th>Auth0 (Okta CIC)</th><th>Firebase Auth / Identity Platform</th><th>Clerk</th></tr></thead>
  <tbody>
    <tr><td>Best fit</td><td>AWS-centric backends, large consumer user bases</td><td>B2B SaaS with heavy enterprise SSO needs</td><td>Mobile-first apps on Firebase/GCP</td><td>React/Next.js apps wanting drop-in UI</td></tr>
    <tr><td>Cost at 1M MAU</td><td>Low</td><td>High</td><td>Low (paid tier for SAML/OIDC, MFA)</td><td>Medium</td></tr>
    <tr><td>Enterprise SSO</td><td>SAML/OIDC per pool; no SCIM</td><td>Strong (Organizations, SCIM)</td><td>Via Identity Platform</td><td>Yes (paid)</td></tr>
    <tr><td>Customization</td><td>Lambda triggers</td><td>Actions (JS) pipeline</td><td>Blocking functions</td><td>Webhooks, components</td></tr>
    <tr><td>AWS integration</td><td>Native (authorizers, identity pools)</td><td>Via JWT authorizer</td><td>Via JWT authorizer</td><td>Via JWT authorizer</td></tr>
    <tr><td>Exit cost</td><td>High (no hash export)</td><td>Medium</td><td>Lower (hash export with CLI)</td><td>Medium</td></tr>
  </tbody>
</table>
<p>Because any of these issue standard OIDC JWTs, your <em>API</em> code can stay provider-agnostic: verify against a JWKS URL and an issuer. That is the architecture point to make. For the protocol and RBAC fundamentals, see <a href="#/topic/api-auth-rbac">AuthN, AuthZ &amp; RBAC</a>. For the Firebase side, see <a href="#/topic/cloud-firebase">Firebase</a>.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Picture 1: user pool vs identity pool</h3>
<div class="diagram">
<pre>
  RN / web client
       │ 1. sign in (SRP / hosted UI / Google / SAML)
       ▼
 ┌───────────────────────┐   2. JWTs: ID + access + refresh
 │      USER POOL        │ ─────────────────────────────────┐
 │ directory + OIDC/OAuth│                                  │
 │ triggers, groups, MFA │                                  ▼
 └───────────────────────┘                     ┌─────────────────────────┐
                                               │  Your API (API GW +      │
     3a. Authorization: Bearer &lt;access token&gt; │  Lambda / Express)       │
     ─────────────────────────────────────────►│  verify JWT → RBAC       │
                                               └─────────────────────────┘
       │ 3b. (optional) "give me AWS creds for this token"
       ▼
 ┌───────────────────────┐   4. temp AWS credentials (STS, ~1h)
 │    IDENTITY POOL      │ ─────────────────────────────────┐
 │ token → IAM role map  │                                  ▼
 └───────────────────────┘                     S3 / IoT / Location APIs called
                                               DIRECTLY with SigV4 (IAM policy
                                               scoped by identity ID)
</pre>
</div>
<p>Most apps need only the user pool. Add an identity pool when the client must call AWS services directly (Amplify Storage uploads, IoT, Location) or you need guest access with IAM-scoped permissions.</p>

<h3>Picture 2: the three tokens</h3>
<table>
  <thead><tr><th></th><th>ID token</th><th>Access token</th><th>Refresh token</th></tr></thead>
  <tbody>
    <tr><td>Format</td><td>Signed JWT (RS256)</td><td>Signed JWT (RS256)</td><td>Opaque (encrypted, only Cognito can read it)</td></tr>
    <tr><td>Audience field</td><td><code>aud</code> = app client ID</td><td><strong>no <code>aud</code></strong>; <code>client_id</code> instead</td><td>n/a</td></tr>
    <tr><td><code>token_use</code></td><td><code>"id"</code></td><td><code>"access"</code></td><td>n/a</td></tr>
    <tr><td>Contains</td><td><code>sub</code>, <code>email</code>, <code>cognito:username</code>, <code>custom:*</code>, <code>cognito:groups</code></td><td><code>sub</code>, <code>username</code>, <code>scope</code>, <code>cognito:groups</code></td><td>-</td></tr>
    <tr><td>Who consumes it</td><td>The client app (show name/avatar)</td><td><strong>Your APIs</strong></td><td>Only Cognito's token endpoint</td></tr>
    <tr><td>Default / range</td><td>1 h / 5 min–1 day</td><td>1 h / 5 min–1 day</td><td>30 days / 60 min–10 years</td></tr>
  </tbody>
</table>
<pre><code class="language-json">// Decoded ACCESS token payload (illustrative)
{
  "sub": "8b3c1f0e-1a2b-4c5d-9e8f-0a1b2c3d4e5f",
  "cognito:groups": ["admins"],
  "iss": "https://cognito-idp.ap-south-1.amazonaws.com/ap-south-1_AbCdEf123",
  "client_id": "4h57kl2example",
  "origin_jti": "…",
  "token_use": "access",
  "scope": "openid email bookings-api/bookings.write",
  "auth_time": 1762329600,
  "exp": 1762333200,
  "iat": 1762329600,
  "jti": "…",
  "username": "8b3c1f0e-…"
}</code></pre>

<h3>Picture 3: authorization code + PKCE through managed login (mobile)</h3>
<div class="diagram">
<pre>
 RN app                        Cognito domain (managed login)          Your API
 ──────                        ──────────────────────────────          ────────
 make code_verifier (random)
 code_challenge = SHA256(verifier)
 open system browser ─────────► /oauth2/authorize?response_type=code
                                  &amp;client_id&amp;redirect_uri=myapp://callback
                                  &amp;code_challenge&amp;code_challenge_method=S256
                                  &amp;scope=openid email bookings-api/...
                                 user signs in (password / Google / SAML IdP)
 myapp://callback?code=XYZ ◄──── 302 redirect
 POST /oauth2/token ───────────► code + code_verifier (no client secret)
 ◄─────────────────────────────── id_token, access_token, refresh_token
 store refresh token in Keychain/Keystore
 GET /bookings  Authorization: Bearer &lt;access&gt; ──────────────────────► verify JWT
</pre>
</div>

<h3>Picture 4: layers of authorization</h3>
<div class="diagram">
<pre>
  Edge / gateway     → Is the token valid? Right issuer, client, scope?  (coarse, cheap)
  Handler / service  → Is THIS user allowed THIS action? (groups, roles, permissions)
  Data layer         → Only rows for this tenant/owner (WHERE tenant_id = :claim)
</pre>
</div>
<p>Cognito handles authentication and supplies the <em>inputs</em> to authorization (groups, claims, scopes). The authorization decisions themselves live in your code and data layer.</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Signing the user out revokes their tokens, so they can't call my API." Not for stateless verification. Your API checks signature and expiry locally and never asks Cognito, so an access token stays valid until <code>exp</code>. Sign-out and revocation stop <em>refresh</em>. That is why access tokens should be short-lived (5–15 minutes for sensitive apps), and why you add a server-side check (a "disabled" flag or token version in your DB) when you need instant lock-out.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. Creating a user pool in CDK (the decisions that matter)</h3>
<pre><code class="language-ts">import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';

const pool = new cognito.UserPool(this, 'Users', {
  userPoolName: 'bookings-prod',
  selfSignUpEnabled: true,
  signInAliases: { email: true },                 // IMMUTABLE after creation
  signInCaseSensitive: false,                     // IMMUTABLE after creation
  autoVerify: { email: true },
  standardAttributes: { email: { required: true, mutable: true } },
  customAttributes: {
    tenantId: new cognito.StringAttribute({ mutable: false }),   // custom attrs can't be deleted
  },
  passwordPolicy: { minLength: 12, requireLowercase: true, requireUppercase: true, requireDigits: true, requireSymbols: false },
  mfa: cognito.Mfa.OPTIONAL,
  mfaSecondFactor: { sms: false, otp: true },
  accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
  removalPolicy: RemovalPolicy.RETAIN,            // never let a stack delete your users
  // email: cognito.UserPoolEmail.withSES({...})  // default Cognito email is capped at a tiny daily volume
});

pool.addDomain('Domain', { cognitoDomain: { domainPrefix: 'acme-bookings' } });

const writeScope = new cognito.ResourceServerScope({ scopeName: 'bookings.write', scopeDescription: 'Create and cancel bookings' });
const api = pool.addResourceServer('Api', { identifier: 'bookings-api', scopes: [writeScope] });

// Public client for the RN app and SPA: NO secret (it would be extractable)
const appClient = pool.addClient('AppClient', {
  generateSecret: false,
  authFlows: { userSrp: true },
  oAuth: {
    flows: { authorizationCodeGrant: true },      // + PKCE; never implicit
    scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.resourceServer(api, writeScope)],
    callbackUrls: ['myapp://callback', 'https://app.example.com/auth/callback'],
    logoutUrls: ['myapp://signout', 'https://app.example.com/'],
  },
  accessTokenValidity: Duration.minutes(15),
  idTokenValidity: Duration.minutes(15),
  refreshTokenValidity: Duration.days(30),
  preventUserExistenceErrors: true,               // no "user not found" enumeration
  enableTokenRevocation: true,
  // writeAttributes: restrict which attributes users may change themselves (see Bugs #5)
});

new cognito.CfnUserPoolGroup(this, 'Admins', { userPoolId: pool.userPoolId, groupName: 'admins', precedence: 1 });
new cognito.CfnUserPoolGroup(this, 'Members', { userPoolId: pool.userPoolId, groupName: 'members', precedence: 10 });</code></pre>
<p>Prop names follow aws-cdk-lib v2, and newer releases add props such as the feature plan; check your version. The comments mark the interview-relevant points: which settings are <strong>immutable</strong>, why the mobile client has <strong>no secret</strong>, why the code grant is used <strong>with PKCE</strong>, and why <strong>RETAIN</strong> is set.</p>

<h3>2. Sign-in flows (native API vs OAuth)</h3>
<table>
  <thead><tr><th>Flow</th><th>How</th><th>Use when</th></tr></thead>
  <tbody>
    <tr><td><code>USER_SRP_AUTH</code></td><td>Secure Remote Password: the client proves it knows the password without sending it</td><td>Native sign-in screens (Amplify default)</td></tr>
    <tr><td><code>USER_PASSWORD_AUTH</code></td><td>Password sent over TLS to Cognito</td><td>Needed for the user-migration trigger; otherwise prefer SRP</td></tr>
    <tr><td><code>ADMIN_USER_PASSWORD_AUTH</code></td><td>Server-side, signed with IAM credentials</td><td>Trusted backends (BFF), tests</td></tr>
    <tr><td><code>REFRESH_TOKEN_AUTH</code></td><td>Refresh token → new ID/access tokens</td><td>Silent refresh</td></tr>
    <tr><td><code>CUSTOM_AUTH</code></td><td>Define/Create/Verify-auth-challenge triggers</td><td>Magic links, custom OTP, CAPTCHA steps</td></tr>
    <tr><td><code>USER_AUTH</code> (choice-based)</td><td>The user picks password, email/SMS OTP or passkey</td><td>Passwordless (newer; check current docs and plan)</td></tr>
    <tr><td>OAuth code + PKCE</td><td>Browser → managed login → code → <code>/oauth2/token</code></td><td>Social/SAML federation, the standard OIDC flow</td></tr>
    <tr><td>OAuth client credentials</td><td><code>client_id</code> + secret → access token with custom scopes</td><td>Machine-to-machine (service, cron, partner integration)</td></tr>
  </tbody>
</table>
<p>The native API returns <strong>challenges</strong> via <code>RespondToAuthChallenge</code>: <code>NEW_PASSWORD_REQUIRED</code> (admin-created users), <code>SOFTWARE_TOKEN_MFA</code>, <code>SMS_MFA</code>, <code>MFA_SETUP</code>, <code>CUSTOM_CHALLENGE</code> and others. Your UI is a state machine over these.</p>
<p>If an app client <em>has</em> a secret, every native call needs a <code>SECRET_HASH</code> = Base64(HMAC-SHA256(key = client secret, message = username + clientId)). That's fine on a server and a mistake on a phone.</p>
<pre><code class="language-bash"># Exchange the authorization code (public client: PKCE verifier instead of a secret)
curl -X POST https://acme-bookings.auth.ap-south-1.amazoncognito.com/oauth2/token \\
  -H 'Content-Type: application/x-www-form-urlencoded' \\
  -d grant_type=authorization_code \\
  -d client_id=$CLIENT_ID \\
  -d code=$CODE \\
  -d redirect_uri=myapp://callback \\
  -d code_verifier=$CODE_VERIFIER

# Machine-to-machine: client credentials with a custom scope
curl -X POST https://acme-bookings.auth.ap-south-1.amazoncognito.com/oauth2/token \\
  -u "$M2M_CLIENT_ID:$M2M_CLIENT_SECRET" \\
  -d grant_type=client_credentials \\
  -d scope=bookings-api/bookings.write</code></pre>

<h3>3. Verifying Cognito JWTs in Node</h3>
<p>The checklist: (1) parse the header and find the key by <code>kid</code> in <code>https://cognito-idp.&lt;region&gt;.amazonaws.com/&lt;poolId&gt;/.well-known/jwks.json</code>; (2) verify the RS256 signature; (3) <code>iss</code> equals the pool URL; (4) <code>exp</code> is in the future (allow a few seconds of clock skew); (5) <code>token_use</code> is what you expect; (6) <code>aud</code> (ID token) or <code>client_id</code> (access token) is one of <em>your</em> app clients; (7) then authorize on scopes, groups and claims.</p>
<pre><code class="language-ts">// Option A: AWS's purpose-built library (handles JWKS caching, kid rotation, Cognito specifics)
import { CognitoJwtVerifier } from 'aws-jwt-verify';

export const accessVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID!,
  tokenUse: 'access',
  clientId: [process.env.APP_CLIENT_ID!, process.env.ADMIN_CLIENT_ID!],   // multiple clients allowed
});

// Optional: pre-fetch the JWKS at cold start so the first request doesn't pay for it
accessVerifier.hydrate().catch((err) =&gt; console.error('jwks hydrate failed', err));

const claims = await accessVerifier.verify(token);   // throws on any failed check</code></pre>
<pre><code class="language-ts">// Option B: generic OIDC with jose (same code works for Auth0/Clerk/Firebase issuers)
import { createRemoteJWKSet, jwtVerify } from 'jose';

const REGION = process.env.AWS_REGION ?? 'ap-south-1';
const ISSUER = 'https://cognito-idp.' + REGION + '.amazonaws.com/' + process.env.USER_POOL_ID;
const JWKS = createRemoteJWKSet(new URL(ISSUER + '/.well-known/jwks.json'));  // module scope = cached
const CLIENT_IDS = new Set((process.env.APP_CLIENT_IDS ?? '').split(','));

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: ISSUER,
    algorithms: ['RS256'],
    clockTolerance: 5,                       // seconds of skew
  });
  // Access tokens have no "aud", so jose's audience option can't check the client. Do it by hand:
  if (payload.token_use !== 'access') throw new Error('expected an access token');
  if (!CLIENT_IDS.has(String(payload.client_id))) throw new Error('token from an unknown app client');
  return payload;
}</code></pre>
<p>Key rotation: Cognito publishes keys in the JWKS. Both libraries cache keys and refetch when they see an unknown <code>kid</code>, with a cooldown so attackers can't force a refetch on every request. Keep the verifier at <strong>module scope</strong> so warm Lambdas reuse the cache.</p>

<h3>4. Federation: social, SAML, OIDC</h3>
<ul>
  <li>The user pool acts as the <strong>service provider / relying party</strong>. You register the IdP (SAML metadata URL or OIDC issuer + client), map IdP attributes to pool attributes (email, name, a groups attribute into a custom attribute), and enable the IdP on the app client.</li>
  <li>Federated users get a pool profile on first sign-in (JIT provisioning), with a username like <code>okta_jane@acme.com</code>, and the tokens your API sees look exactly like native ones. <strong>That is the big win: your API code doesn't change per IdP.</strong></li>
  <li><strong>IdP discovery:</strong> managed login can route by email domain (IdP identifiers), or your app can deep-link with <code>identity_provider=AcmeOkta</code>.</li>
  <li><strong>Account linking:</strong> a user who signed up with email+password and later uses "Sign in with Google" becomes a <em>second</em> user unless you link them (<code>AdminLinkProviderForUser</code>, typically from a pre-sign-up trigger before the federated profile is created).</li>
  <li>SAML supports SP-initiated sign-in by default. IdP-initiated sign-in is supported with extra configuration (check current docs).</li>
</ul>

<h3>5. Lambda triggers</h3>
<table>
  <thead><tr><th>Trigger</th><th>When it runs</th><th>Typical use</th></tr></thead>
  <tbody>
    <tr><td>Pre sign-up</td><td>Before a user is created (native, admin-create, or first federated sign-in)</td><td>Domain allowlists, auto-confirm, account linking</td></tr>
    <tr><td>Post confirmation</td><td>After sign-up confirmation (or forgot-password confirmation)</td><td>Create the app DB row, default group, welcome email</td></tr>
    <tr><td>Pre / post authentication</td><td>Around each sign-in</td><td>Block disabled tenants, audit logging</td></tr>
    <tr><td><strong>Pre token generation</strong></td><td>Every token issue <em>including refresh</em></td><td>Add <code>tenantId</code>/roles claims, adjust groups; V2 can customise the <em>access</em> token and scopes (requires a higher feature plan)</td></tr>
    <tr><td>Define / create / verify auth challenge</td><td>Custom auth flow</td><td>Magic link, custom OTP</td></tr>
    <tr><td>User migration</td><td>Sign-in or forgot-password for an unknown user</td><td>Lazy migration from a legacy user store</td></tr>
    <tr><td>Custom message / custom email &amp; SMS sender</td><td>Before sending codes</td><td>Branded templates, third-party email/SMS providers</td></tr>
  </tbody>
</table>
<p>Triggers run <strong>synchronously in the sign-in path</strong>. Cognito waits only a few seconds (about 5 at the time of writing) and may retry. A slow DB call in a trigger becomes failed sign-ins, so keep triggers fast and idempotent.</p>

<h3>6. Groups and claims for RBAC</h3>
<ul>
  <li>Groups appear in both tokens as <code>cognito:groups</code>. A group can also carry an IAM role (used by identity pools) and a precedence.</li>
  <li>Use groups for <strong>coarse roles</strong> (admin, member, support). For fine-grained permissions (per-room, per-project) or many tenants, keep roles and permissions in your DB and put only a stable pointer (<code>tenantId</code>, a role list) into the token via pre-token-generation.</li>
  <li>Claims are <strong>snapshots</strong>: add a user to "admins" and their current tokens don't change until the next refresh. For immediate effect, force a refresh on the client or check the DB for sensitive actions.</li>
  <li>Token size matters: hundreds of groups bloat every request header. See <a href="#/topic/api-auth-rbac">AuthN, AuthZ &amp; RBAC</a> for RBAC vs ABAC vs ReBAC modelling.</li>
</ul>

<h3>7. API Gateway integration</h3>
<table>
  <thead><tr><th>API type</th><th>Authorizer</th><th>Token expected</th><th>Claims in the Lambda event</th></tr></thead>
  <tbody>
    <tr><td>REST API</td><td>Cognito user pool authorizer</td><td>ID token by default; <strong>access token</strong> when OAuth scopes are set on the method</td><td><code>event.requestContext.authorizer.claims</code></td></tr>
    <tr><td>HTTP API</td><td>JWT authorizer (issuer = pool URL, audience = app client IDs)</td><td>Access or ID token (checks <code>aud</code> or <code>client_id</code>)</td><td><code>event.requestContext.authorizer.jwt.claims</code> (+ <code>.scopes</code>)</td></tr>
    <tr><td>Either</td><td>Lambda authorizer</td><td>Anything (verify yourself, e.g. with aws-jwt-verify)</td><td>Whatever context you return; results can be cached by TTL</td></tr>
  </tbody>
</table>
<p>The gateway authorizer does <em>authentication plus coarse scope checks</em>. Your handler still does the per-resource authorization (is this booking in your tenant?). Watch for HTTP API claims that arrive as strings: array claims such as <code>cognito:groups</code> may come through stringified, so check the shape before you parse them. More in <a href="#/topic/cloud-api-gateway">API Gateway</a>.</p>

<h3>8. Identity pools: AWS credentials for clients</h3>
<ul>
  <li>Flow: the client sends its user pool ID token (or a Google/Apple/SAML token) to the identity pool → gets an <strong>identity ID</strong> → receives temporary credentials for the mapped IAM role (via STS <code>AssumeRoleWithWebIdentity</code> under the hood). IAM roles, trust policies and STS are covered in <a href="#/topic/cloud-aws-foundations">AWS Foundations &amp; IAM</a>.</li>
  <li><strong>Role mapping:</strong> a default authenticated role, an unauthenticated (guest) role, the role from the token (<code>cognito:preferred_role</code> from group IAM roles), or rules on claims.</li>
  <li><strong>Per-user scoping</strong> uses the IAM policy variable for the <em>identity ID</em> (not the user pool <code>sub</code>!). This is how Amplify Storage's "private/" prefixes work.</li>
  <li><strong>ABAC:</strong> map token claims (e.g. <code>tenantId</code>) to principal tags and write one policy using <code>aws:PrincipalTag/tenantId</code>.</li>
</ul>
<pre><code class="language-json">{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:PutObject", "s3:GetObject"],
    "Resource": "arn:aws:s3:::acme-recordings/private/&#36;{cognito-identity.amazonaws.com:sub}/*"
  }]
}</code></pre>
<p>The role's trust policy allows <code>sts:AssumeRoleWithWebIdentity</code> from the <code>cognito-identity.amazonaws.com</code> federated principal, conditioned on <code>cognito-identity.amazonaws.com:aud</code> = your identity pool ID and <code>amr</code> = <code>authenticated</code>. Many teams skip identity pools entirely and use <strong>presigned S3 URLs</strong> issued by an API, which keeps all authorization server-side (see <a href="#/topic/cloud-s3">S3</a>).</p>

<h3>9. Limits and gotchas to quote carefully</h3>
<ul>
  <li><strong>Quotas</strong> apply per API category (user authentication, user creation, admin reads…) in requests per second, some adjustable. A load test or bulk import can hit <code>TooManyRequestsException</code>. Check Service Quotas.</li>
  <li><strong>Default email sender</strong> is capped at a very small daily volume (50/day at the time of writing). Production needs SES.</li>
  <li><strong>SMS</strong> goes through SNS, and new accounts start in the SMS sandbox with spend limits.</li>
  <li><strong>Custom domain</strong> for managed login needs an ACM certificate in <code>us-east-1</code> (it's fronted by CloudFront).</li>
  <li><strong>Up to 50 custom attributes</strong>, none can be removed, and required attributes are fixed at creation.</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1: Express (or Lambda) middleware with 401 vs 403 and RBAC</h3>
<pre><code class="language-ts">// src/auth/middleware.ts
import type { NextFunction, Request, Response } from 'express';
import { accessVerifier } from './verifier';   // CognitoJwtVerifier from Mechanics §3

export type AuthContext = { sub: string; groups: string[]; tenantId?: string; scopes: string[] };
declare global { namespace Express { interface Request { auth?: AuthContext } } }

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'missing_token' });
  try {
    const c = await accessVerifier.verify(token);
    req.auth = {
      sub: c.sub,
      groups: (c['cognito:groups'] as string[] | undefined) ?? [],
      tenantId: c.tenantId as string | undefined,          // added by pre-token-generation V2
      scopes: String(c.scope ?? '').split(' ').filter(Boolean),
    };
    return next();
  } catch {
    return res.status(401).json({ error: 'invalid_token' });   // never echo the reason to clients
  }
}

export const requireGroup = (...allowed: string[]) =&gt;
  (req: Request, res: Response, next: NextFunction) =&gt;
    req.auth?.groups.some((g) =&gt; allowed.includes(g)) ? next() : res.status(403).json({ error: 'forbidden' });

export const requireScope = (scope: string) =&gt;
  (req: Request, res: Response, next: NextFunction) =&gt;
    req.auth?.scopes.includes(scope) ? next() : res.status(403).json({ error: 'insufficient_scope' });

// routes
app.delete('/bookings/:id', authenticate, requireScope('bookings-api/bookings.write'), async (req, res) =&gt; {
  const booking = await db.bookings.findById(req.params.id);
  // Resource-level check: tenancy + ownership (or admin). The token alone can't answer this.
  if (!booking || booking.tenantId !== req.auth!.tenantId) return res.status(404).end();
  const isOwner = booking.createdBy === req.auth!.sub;
  if (!isOwner &amp;&amp; !req.auth!.groups.includes('admins')) return res.status(403).json({ error: 'forbidden' });
  await db.bookings.cancel(booking.id, { by: req.auth!.sub });
  res.status(204).end();
});</code></pre>
<p>401 = "I don't know who you are" (the client should refresh or sign in). 403 = "I know who you are, and no". Returning 404 for another tenant's resource avoids leaking that it exists.</p>

<h3>Example 2: Lambda behind an HTTP API JWT authorizer</h3>
<pre><code class="language-ts">import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise&lt;APIGatewayProxyResultV2&gt; =&gt; {
  // The signature, issuer, expiry and audience were already checked by API Gateway.
  const claims = event.requestContext.authorizer.jwt.claims;
  const sub = String(claims.sub);
  const tenantId = String(claims.tenantId ?? '');
  const groups = parseGroups(claims['cognito:groups']);   // may be an array OR a "[a b]" string

  if (!tenantId) return { statusCode: 403, body: JSON.stringify({ error: 'no_tenant' }) };
  const rooms = await db.rooms.list({ tenantId });          // tenant filter from the TOKEN, never from the query string
  return { statusCode: 200, body: JSON.stringify({ rooms, canManage: groups.includes('admins'), sub }) };
};

function parseGroups(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string') return v.replace(/^\\[|\\]$/g, '').split(/[ ,]+/).filter(Boolean);
  return [];
}</code></pre>

<h3>Example 3: Post-confirmation trigger (provision the app user) and pre-token-generation (add claims)</h3>
<pre><code class="language-ts">// post-confirmation.ts
import type { PostConfirmationTriggerHandler } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } from '@aws-sdk/client-cognito-identity-provider';

const cip = new CognitoIdentityProviderClient({});

export const handler: PostConfirmationTriggerHandler = async (event) =&gt; {
  // Also fires after "forgot password" confirmation, so skip that
  if (event.triggerSource !== 'PostConfirmation_ConfirmSignUp') return event;

  const { sub, email } = event.request.userAttributes;
  await db.users.upsert({ id: sub, email, tenantId: await resolveTenant(email) });   // idempotent: retries happen
  await cip.send(new AdminAddUserToGroupCommand({
    UserPoolId: event.userPoolId,
    Username: event.userName,
    GroupName: 'members',
  }));
  return event;   // ALWAYS return the event
};</code></pre>
<pre><code class="language-ts">// pre-token-generation.ts (V2 event: can customise the ACCESS token; check the current event shape)
export const handler = async (event: any) =&gt; {
  const user = await db.users.get(event.request.userAttributes.sub);   // keep this query FAST
  const roles: string[] = user?.roles ?? [];
  event.response = {
    claimsAndScopeOverrideDetails: {
      idTokenGeneration: { claimsToAddOrOverride: { tenantId: user?.tenantId ?? '' } },
      accessTokenGeneration: {
        claimsToAddOrOverride: { tenantId: user?.tenantId ?? '', roles: roles.join(' ') },
        scopesToAdd: roles.includes('admin') ? ['bookings-api/admin'] : [],
      },
    },
  };
  return event;
};</code></pre>
<p>Because pre-token-generation also runs on <strong>refresh</strong>, it is your hook to pick up role changes within one token lifetime, and to <em>deny</em> refresh for a deprovisioned user by throwing.</p>

<h3>Example 4: React Native sign-in and authenticated fetch (Amplify JS v6 auth library)</h3>
<pre><code class="language-ts">// auth.ts (Amplify v6 modular API; Gen 2 apps call Amplify.configure(outputs) instead)
import { Amplify } from 'aws-amplify';
import { signIn, confirmSignIn, fetchAuthSession, signOut } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

Amplify.configure({
  Auth: { Cognito: { userPoolId: 'ap-south-1_AbCdEf123', userPoolClientId: '4h57kl2example' } },
});

export async function login(email: string, password: string) {
  const { isSignedIn, nextStep } = await signIn({ username: email, password });   // SRP under the hood
  if (isSignedIn) return 'DONE';
  return nextStep.signInStep;    // e.g. CONFIRM_SIGN_IN_WITH_TOTP_CODE, CONFIRM_SIGN_UP …
}
export const submitMfa = (code: string) =&gt; confirmSignIn({ challengeResponse: code });

export async function apiFetch(path: string, init: RequestInit = {}, retried = false): Promise&lt;Response&gt; {
  const { tokens } = await fetchAuthSession();           // refreshes automatically when expired
  const access = tokens?.accessToken?.toString();
  if (!access) throw new Error('NOT_SIGNED_IN');
  const res = await fetch(API_URL + path, {
    ...init,
    headers: { ...(init.headers as Record&lt;string, string&gt;), Authorization: 'Bearer ' + access },
  });
  if (res.status === 401 &amp;&amp; !retried) {
    await fetchAuthSession({ forceRefresh: true });      // e.g. roles changed or the clock was off
    return apiFetch(path, init, true);                    // retry ONCE, never loop
  }
  return res;
}

Hub.listen('auth', ({ payload }) =&gt; {
  if (payload.event === 'tokenRefresh_failure') {
    // refresh token expired/revoked → send the user to the sign-in screen
    void signOut();
  }
});</code></pre>
<p>On RN, Amplify keeps tokens in a key-value store (AsyncStorage by default). For sensitive apps, plug in a Keychain/Keystore-backed store through the library's token-storage hook (check current docs for the exact API). The underlying RN rule is to keep the refresh token in secure storage, never plain AsyncStorage. See <a href="#/topic/cloud-amplify">Amplify</a> for the full client setup.</p>

<h3>Example 5: FDE scenario, "our enterprise customer wants SSO with Entra ID / Okta"</h3>
<ol>
  <li><strong>Discovery:</strong> SAML or OIDC? Which attributes (email, name, groups)? Should all employees get access or only a group? How does deprovisioning work on their side?</li>
  <li><strong>Configure:</strong> add a SAML IdP to the pool from their metadata URL, give them your SP entity ID (<code>urn:amazon:cognito:sp:&lt;poolId&gt;</code>) and ACS URL (<code>https://&lt;domain&gt;/saml2/idpresponse</code>), map attributes (their groups attribute → <code>custom:idpGroups</code>), add an IdP identifier for their email domain, and enable the IdP on the app client.</li>
  <li><strong>Tenant mapping:</strong> in pre-token-generation, map "this IdP" → <code>tenantId</code>, and their groups → your roles. Don't trust a tenant ID typed into a form.</li>
  <li><strong>Deprovisioning gap:</strong> when someone leaves the customer, their IdP blocks new sign-ins, but an existing Cognito <em>refresh token</em> keeps minting tokens until it expires. Fix: short refresh validity for that client (e.g. 8–12 h), a pre-token-generation check against a deny-list, or an admin endpoint that calls <code>AdminUserGlobalSignOut</code>. Name the no-SCIM limitation explicitly.</li>
  <li><strong>Operate:</strong> watch for SAML certificate expiry on their side (set a reminder), document the test-user procedure, and log sign-in failures with IdP error codes.</li>
</ol>

<h3>Example 6: lazy migration from a legacy user table (user migration trigger)</h3>
<pre><code class="language-ts">import type { UserMigrationTriggerHandler } from 'aws-lambda';

export const handler: UserMigrationTriggerHandler = async (event) =&gt; {
  if (event.triggerSource === 'UserMigration_Authentication') {
    const legacy = await legacyDb.verifyPassword(event.userName, event.request.password);   // bcrypt compare
    if (!legacy) throw new Error('Bad username or password');
    event.response.userAttributes = { email: legacy.email, email_verified: 'true', 'custom:tenantId': legacy.tenantId };
    event.response.finalUserStatus = 'CONFIRMED';      // they keep their password: no forced reset
    event.response.messageAction = 'SUPPRESS';
    return event;
  }
  if (event.triggerSource === 'UserMigration_ForgotPassword') {
    const legacy = await legacyDb.findByEmail(event.userName);
    if (!legacy) throw new Error('User not found');
    event.response.userAttributes = { email: legacy.email, email_verified: 'true' };
    event.response.messageAction = 'SUPPRESS';
    return event;
  }
  throw new Error('Unsupported trigger');
};</code></pre>
<p>This needs <code>USER_PASSWORD_AUTH</code> enabled on the client during migration, because Cognito must see the plaintext password to hand it to the trigger. Active users move over as they sign in, and you bulk-import or force-reset the long tail later. The same pattern applies when moving <em>off</em> Cognito, in reverse, which is why the lack of hash export matters.</p>

<h3>Example 7: meeting-room tablets (shared devices, not people)</h3>
<p>A kiosk tablet outside a meeting room should not hold a human's 30-day refresh token. The options:</p>
<table>
  <thead><tr><th>Approach</th><th>Pros</th><th>Cons</th></tr></thead>
  <tbody>
    <tr><td>Shared "kiosk user" per site</td><td>Simple</td><td>One leaked password unlocks every tablet; no per-device revocation</td></tr>
    <tr><td>Client-credentials app client per device</td><td>Per-device scopes and revocation</td><td>Secret on the device is extractable; app-client count limits; M2M pricing</td></tr>
    <tr><td><strong>Device pairing: an admin approves a code, the API issues a device credential (stored in Keystore), narrow scopes (<code>room:R12 read, book-now</code>)</strong></td><td>Per-device revoke, least privilege, no human creds on the device</td><td>You own a small device-auth service (or use IoT certificates)</td></tr>
  </tbody>
</table>
<p>Humans who book <em>on</em> the tablet authenticate per action (badge, QR code on their phone) instead of staying signed in.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. Revoked or disabled user still calls the API</h3>
<p><code>AdminDisableUser</code>, <code>GlobalSignOut</code> and <code>RevokeToken</code> stop <em>refresh</em>, and Cognito's own APIs reject revoked access tokens. Your local JWT verifier doesn't call Cognito, so it keeps accepting the access token until <code>exp</code>. Mitigations: short access-token lifetimes, a DB "disabled/tokenVersion" check on sensitive routes, or an introspection-style Lambda authorizer with a small cache.</p>

<h3>2. Group or role changes "don't apply"</h3>
<p>Claims are frozen at issuance. The user must refresh, and the client may still hold a valid token for up to an hour. Force a refresh after role changes (<code>fetchAuthSession({ forceRefresh: true })</code>) or check the DB for privileged actions.</p>

<h3>3. Clock skew on devices</h3>
<p>Phones with a wrong clock make client-side "is it expired?" checks lie. Servers should allow a few seconds of skew, and clients should treat a 401 as "refresh and retry once" rather than trusting the local clock.</p>

<h3>4. Duplicate users across sign-in methods</h3>
<p>The same email registered natively and via Google produces two <code>sub</code>s and two app accounts. Decide the linking policy up front (pre-sign-up + <code>AdminLinkProviderForUser</code>) and key your DB on a stable internal user ID, not on the Cognito username.</p>

<h3>5. Email as username, then the email changes</h3>
<p>If your DB is keyed by email, an email change orphans data. Always key on <code>sub</code>. Also, until a changed email is verified, decide whether the old one still works for sign-in (there is a pool setting for keeping the original attribute active; check current docs).</p>

<h3>6. Immutable pool settings</h3>
<p>Sign-in aliases, case sensitivity and required attributes can't change. In IaC, changing them can trigger a <em>replacement</em> of the pool, meaning new IDs and no users. Use <code>RETAIN</code>, review IaC diffs for replacement, and treat pool config as a one-way door.</p>

<h3>7. Trigger timeouts and retries</h3>
<p>Cognito waits only a few seconds for a trigger and may retry, so a post-confirmation trigger can run twice. Make it idempotent (upsert) and fast. Heavy work (sending to CRM, provisioning) belongs on SQS.</p>

<h3>8. Circular dependency in IaC</h3>
<p>The trigger needs IAM permission on the pool (e.g. <code>AdminAddUserToGroup</code>), and the pool references the trigger. Referencing <code>pool.userPoolArn</code> in the trigger's policy can create a cycle. Use a constructed ARN pattern, or attach the policy after both exist.</p>

<h3>9. Token size and header limits</h3>
<p>Many groups or large custom claims push tokens to several KB. Some proxies and load balancers cap header sizes, and every request pays the bytes. Keep claims to pointers (tenantId, a role list) and look up the details server-side.</p>

<h3>10. User enumeration</h3>
<p>Without <code>preventUserExistenceErrors</code>, sign-in and forgot-password responses reveal whether an email is registered. Enable it, and make your own sign-up API equally vague.</p>

<h3>11. Admin-created users and FORCE_CHANGE_PASSWORD</h3>
<p><code>AdminCreateUser</code> users must set a new password on first sign-in (the <code>NEW_PASSWORD_REQUIRED</code> challenge), and their temporary password expires (default 7 days). A support ticket saying "invite link doesn't work after a week" is usually this.</p>

<h3>12. Access token has no email</h3>
<p>The access token carries <code>sub</code>/<code>username</code> and scopes, not profile attributes. Either call <code>/oauth2/userInfo</code>, add a claim via pre-token-generation V2, or look the user up by <code>sub</code>. Don't switch to sending the ID token to APIs just to get <code>email</code>.</p>

<h3>13. Identity ID is not the user pool sub</h3>
<p>The identity pool's identity ID (<code>region:guid</code>) differs from the user pool <code>sub</code>. S3 keys under <code>private/&lt;identityId&gt;/</code> can't be joined to your DB by <code>sub</code> unless you store the mapping.</p>

<h3>14. Regional outage and DR</h3>
<p>A user pool is regional. If that region's Cognito is impaired, sign-ins and refreshes fail, though already-issued access tokens keep verifying against cached JWKS. A multi-region design means a second pool plus migration or sync tooling. Know that this is a hard problem, not a checkbox.</p>

<h3>15. Hosted login redirect mismatches</h3>
<p>The <code>redirect_uri</code> must exactly match a configured callback URL, including the trailing slash and scheme. RN apps also need the custom scheme or universal link registered natively, and Android intent filters configured. A mismatch shows up as <code>redirect_mismatch</code>, or as the browser never returning to the app.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1: decoding instead of verifying</h3>
<pre><code class="language-ts">// ❌ Anyone can craft this payload: no signature check, no issuer, no expiry
const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());

// ✅ Verify signature + iss + exp + token_use + client
const claims = await accessVerifier.verify(token);</code></pre>

<h3>Anti-pattern 2: sending the ID token to your API</h3>
<p>The ID token is meant for the client and has no scopes. API Gateway's REST Cognito authorizer accepts it by default, which is why this pattern spreads. Fix: send access tokens, enforce scopes, and add needed claims to the access token via pre-token-generation V2.</p>

<h3>Anti-pattern 3: using the <code>aud</code> check on access tokens</h3>
<p>Generic JWT middleware configured with <code>audience: clientId</code> rejects every Cognito access token (there is no <code>aud</code>), so someone "fixes" it by disabling audience checks entirely. That accepts tokens from <em>any</em> app client in the pool. Fix: check <code>client_id</code> explicitly.</p>

<h3>Anti-pattern 4: a client secret inside a mobile or SPA app</h3>
<p>Anything shipped in an APK, IPA or JS bundle is extractable. Fix: public clients without a secret, using the code grant with PKCE or SRP. Confidential clients only on servers.</p>

<h3>Anti-pattern 5: authorization data in user-writable attributes</h3>
<p>By default an app client may allow users to update their own attributes with their access token (<code>UpdateUserAttributes</code>). If <code>custom:role</code> or <code>custom:tenantId</code> is writable, a user can grant themselves admin. Fix: restrict the client's <code>writeAttributes</code> and keep authorization data immutable to users (or in your DB).</p>

<h3>Anti-pattern 6: trusting tenant IDs from the request</h3>
<pre><code class="language-ts">// ❌ GET /rooms?tenantId=t_other → cross-tenant read
const rooms = await db.rooms.list({ tenantId: req.query.tenantId });
// ✅ derive tenancy from the verified token, and filter in the data layer
const rooms = await db.rooms.list({ tenantId: req.auth!.tenantId });</code></pre>

<h3>Anti-pattern 7: implicit grant or long-lived access tokens</h3>
<p>Tokens in URL fragments leak via history and referrers, and a 24-hour access token defeats revocation. Fix: code + PKCE, 5–60 minute access tokens, and refresh tokens in secure storage.</p>

<h3>Anti-pattern 8: verifier constructed per request</h3>
<p>Creating a new verifier or JWKS fetcher inside the handler refetches keys every time. It's slow and can get you rate-limited. Fix: module scope plus <code>hydrate()</code> at cold start.</p>

<h3>Anti-pattern 9: one user pool per tenant by default</h3>
<p>This multiplies config drift and IaC, hits per-account pool quotas, and complicates shared sign-in. Fix: one pool with <code>tenantId</code> claims and per-tenant IdPs for enterprise SSO. Use separate pools only for hard isolation requirements (regulated tenants, different password policies).</p>

<h3>Anti-pattern 10: slow, non-idempotent triggers</h3>
<p>A post-confirmation trigger that calls three SaaS APIs synchronously leads to failed confirmations on timeout and duplicate CRM records on retry. Fix: upsert, enqueue the rest, and return fast.</p>

<h3>Anti-pattern 11: logging tokens</h3>
<p>Access logs that include <code>Authorization</code> headers turn your log store into a token store. Redact at the logger (see <a href="#/topic/cloud-cloudwatch">CloudWatch</a>).</p>

<h3>Anti-pattern 12: no RETAIN and no backup story</h3>
<p>A stack refactor deletes the pool, and every user is gone, with no way to restore password hashes. Fix: <code>RemovalPolicy.RETAIN</code> or deletion protection, a periodic attribute export, and treating the pool as stateful infrastructure like a database.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. What is the difference between a Cognito user pool and an identity pool?</div>
  <div class="qa-answer">
    <p>A user pool is the identity provider: a user directory plus an OAuth2/OIDC server that handles sign-up, sign-in, MFA and federation and issues JWTs (ID, access, refresh). An identity pool is a credentials broker: it takes a token from a user pool or another IdP (or none, for guests) and exchanges it for temporary AWS credentials for an IAM role. Use a user pool for "log users in and protect my API". Add an identity pool only when the client needs to call AWS services directly, like uploading to S3 with SigV4, with IAM policies scoped per identity.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. ID token vs access token vs refresh token: which goes where?</div>
  <div class="qa-answer">
    <p>The ID token describes the user (email, name, custom attributes, <code>aud</code> = client ID) and is for the client to display. The access token carries authorization context (scopes, <code>cognito:groups</code>, <code>client_id</code>, no <code>aud</code>) and is what the client sends as <code>Bearer</code> to APIs. The refresh token is opaque and long-lived, only sent to Cognito's token endpoint for new tokens, and stored in secure storage (Keychain/Keystore). The defaults are 1 h / 1 h / 30 days, and I'd shorten the access token for sensitive apps.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Walk me through verifying a Cognito JWT on a Node backend.</div>
  <div class="qa-answer">
    <p>Fetch and cache the pool's JWKS from <code>/.well-known/jwks.json</code> under the issuer URL. For each request: take the Bearer token, select the key by <code>kid</code>, verify the RS256 signature, check <code>iss</code> = <code>https://cognito-idp.&lt;region&gt;.amazonaws.com/&lt;poolId&gt;</code>, check <code>exp</code> with a little clock tolerance, check <code>token_use</code> = <code>access</code>, and check <code>client_id</code> is one of my app clients (for ID tokens it's <code>aud</code>). Then authorize from scopes, groups and claims, and do resource-level checks against the DB. In practice I use <code>aws-jwt-verify</code> at module scope with <code>hydrate()</code> at cold start, or <code>jose</code> with <code>createRemoteJWKSet</code> if I want the same code to work for any OIDC provider. Invalid token → 401, valid but not allowed → 403.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. An admin disables a user, but the user can still call the API for a while. Why, and what do you do?</div>
  <div class="qa-answer">
    <p>JWT verification is stateless. My API validates the signature and expiry locally and never asks Cognito, so the access token remains valid until <code>exp</code>. Disabling the user or a global sign-out stops refresh, not tokens already issued. Options, in rising cost: shorten access-token lifetime to 5–15 minutes; for sensitive actions, check a <code>disabled</code> flag or a <code>tokenVersion</code> in my DB (one cached lookup); put the check in a Lambda authorizer with a short cache TTL. I'd also make the refresh path fail fast by throwing from pre-token-generation for deny-listed users.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. How would you implement RBAC with Cognito?</div>
  <div class="qa-answer">
    <p>Coarse roles as Cognito groups, which arrive in <code>cognito:groups</code>. For anything richer (per-resource permissions, many tenants, custom roles) I'd keep roles → permissions in my database and add only pointers (<code>tenantId</code>, a role list) to the access token with a pre-token-generation trigger. Enforcement happens in layers: the gateway authorizer validates the token and coarse scopes, middleware checks role → permission, and the data layer filters by tenant and owner. Claims are snapshots, so after a role change I force a refresh or check the DB for privileged actions. Fuller modelling (RBAC vs ABAC, permission tables) is in <a href="#/topic/api-auth-rbac">AuthN, AuthZ &amp; RBAC</a>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Multi-tenant B2B SaaS: one user pool or one per tenant?</div>
  <div class="qa-answer">
    <table>
      <thead><tr><th>Model</th><th>Pros</th><th>Cons</th></tr></thead>
      <tbody>
        <tr><td>Shared pool + <code>tenantId</code> claim</td><td>One config, simple IaC, users can belong to tenants via your DB</td><td>Shared password policy and MFA settings; isolation is in your code</td></tr>
        <tr><td>Shared pool + per-tenant IdP (SAML/OIDC)</td><td>Enterprise SSO per customer, still one pool</td><td>IdP-to-tenant mapping logic; no SCIM</td></tr>
        <tr><td>Pool per tenant</td><td>Hard isolation, per-tenant policies</td><td>N pools to manage, quota limits, routing at sign-in, cross-tenant users are hard</td></tr>
      </tbody>
    </table>
    <p>My default is a shared pool, tenant from a trusted source (an IdP mapping or the DB via pre-token-generation, never from user input), with tenancy enforced in the data layer. I'd use a pool per tenant only for regulated customers that contractually need it.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How do API Gateway and Cognito work together?</div>
  <div class="qa-answer">
    <p>REST APIs have a native Cognito user pool authorizer. It validates the ID token by default, or the access token when you set OAuth scopes on the method, and passes claims at <code>requestContext.authorizer.claims</code>. HTTP APIs use a generic JWT authorizer configured with the pool's issuer URL and the app client IDs as audience, passing claims at <code>requestContext.authorizer.jwt.claims</code>. For custom logic (deny-lists, API keys plus JWT, non-Cognito tokens) there's a Lambda authorizer with result caching. In all cases the authorizer only proves the token is valid. Per-resource authorization still happens in the handler.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How should a React Native app sign users in with Cognito?</div>
  <div class="qa-answer">
    <p>Two valid paths. <strong>Native screens</strong> with SRP via the Amplify auth library: no browser hop and full UI control, but federation still needs the browser. <strong>Managed login</strong> via the system browser using the authorization code flow with PKCE: required for Google, Apple and SAML, and the most standard option, but it takes a redirect round-trip and native deep-link setup. Either way the app client is public (no secret), the refresh token goes in Keychain/Keystore-backed storage, the API client sends the access token, treats a 401 as "refresh once and retry", and on <code>tokenRefresh_failure</code> sends the user to sign in.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. What are Cognito Lambda triggers and what can go wrong with them?</div>
  <div class="qa-answer">
    <p>They're hooks Cognito calls synchronously during user lifecycle events: pre sign-up (allowlists, auto-confirm, linking), post confirmation (provision the DB user), pre token generation (custom claims and scopes, which also runs on refresh), the custom auth challenge triggers (magic links), user migration (lazy import), and custom messages and senders. Risks: they sit on the sign-in critical path with a short timeout and retries, so slow or non-idempotent code causes failed sign-ins and duplicate side effects. They can also create IaC circular dependencies, and an unhandled exception blocks every user. Keep them small and idempotent, push heavy work to SQS, and alarm on their errors.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. FDE scenario: a customer reports "users get randomly logged out, or see 401s about an hour after logging in." How do you debug it?</div>
  <div class="qa-answer">
    <p>One hour matches the default access-token lifetime, so I'd suspect the refresh path. Steps: (1) Reproduce with one user and capture the 401 response and the token's <code>exp</code>/<code>iat</code>. (2) Client side: is the app calling <code>fetchAuthSession()</code> before each request, or caching the token string at sign-in? Is the refresh token persisted, or lost on app restart (a storage misconfiguration)? Are concurrent requests racing several refreshes? (3) Server side: does the verifier reject valid tokens because of clock skew, or because a new app client ID isn't in the allowed list? (4) Cognito side: did someone set the refresh-token validity very low, enable revocation together with global sign-out on another device, or did a pre-token-generation trigger start failing (check its CloudWatch errors)? (5) Fix, then add a client metric for refresh failures and an alarm on trigger errors.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. How would you migrate 200k users from a legacy auth system into Cognito without forcing password resets?</div>
  <div class="qa-answer">
    <p>Use a lazy migration with the user-migration trigger. When an unknown user signs in, Cognito calls the trigger with the username and password (this requires <code>USER_PASSWORD_AUTH</code> on the client during the migration window). The trigger verifies against the legacy hash and returns attributes with <code>finalUserStatus: CONFIRMED</code>, so the user keeps their password. Forgot-password for unknown users works the same way. After a few months, bulk-import the remaining inactive users (CSV import) with a forced reset, then switch the client back to SRP. Plan for the immutable choices (sign-in alias, case sensitivity) before creating the pool, and key everything on an internal user ID, not the legacy one.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Cognito vs Auth0 vs Firebase Auth: how do you choose?</div>
  <div class="qa-answer">
    <p>Cognito: an AWS-native stack, large consumer user base, cost-sensitive, and a need for API Gateway authorizers or identity-pool IAM access. Accept immutable pool settings and no password-hash export. Auth0: B2B with heavy enterprise SSO, SCIM, organizations, and a polished admin experience, at a much higher price at scale. Firebase Auth: mobile-first apps on Firebase or GCP with great client SDKs. Regardless of choice, my APIs verify standard OIDC JWTs against a JWKS and issuer, so the provider is swappable at the API layer even if user migration is not.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Probing follow-up: "Why PKCE if there's no client secret anyway?"</div>
  <div class="qa-answer">
    <p>Because without a secret, an intercepted authorization code could be redeemed by anyone. On mobile, another app can register the same custom URL scheme and receive the redirect. PKCE binds the code to the instance that started the flow: the app sends <code>code_challenge = SHA256(verifier)</code> to <code>/authorize</code>, and only the holder of the original verifier can redeem the code at <code>/token</code>. It's mandatory practice for public clients, and recommended even for confidential ones.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You separate user pools (identity, JWTs) from identity pools (AWS credentials).</li>
    <li>You send access tokens to APIs and know they have <code>client_id</code>, not <code>aud</code>.</li>
    <li>You verify signature, iss, exp, token_use and client, and distinguish 401 from 403.</li>
    <li>You explain why stateless JWTs can't be revoked instantly and how you mitigate it.</li>
    <li>You enforce tenancy from claims in the data layer, never from request parameters.</li>
    <li>You know the immutable pool settings and the no-hash-export lock-in.</li>
    <li>You use PKCE and no client secret for mobile and SPA clients.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Walk me through setting up SAML SSO for an enterprise customer on Cognito. What's the deprovisioning gap?</div>
  <div class="qa-answer">
    <p><strong>Discovery:</strong> SAML or OIDC, which attributes (email, name, groups), whether all employees or only one group get access, and how deprovisioning works on their side. <strong>Configure:</strong> add a SAML IdP to the user pool from their metadata URL; give them the SP entity ID (<code>urn:amazon:cognito:sp:&lt;poolId&gt;</code>) and the ACS URL (<code>https://&lt;domain&gt;/saml2/idpresponse</code>); map their groups attribute to something like <code>custom:idpGroups</code>; add an IdP identifier for their email domain; and enable the IdP on the app client. The pool is the service provider, users are created just in time, and your API keeps seeing normal pool tokens.</p>
    <p><strong>Deprovisioning gap:</strong> when someone leaves, their IdP blocks new sign-ins, but an existing Cognito refresh token keeps minting tokens until it expires, and Cognito has no inbound SCIM. Mitigate with a short refresh-token validity for that client (for example 8 to 12 hours), a deny-list check in pre-token-generation (which also runs on refresh), or an admin endpoint that calls <code>AdminUserGlobalSignOut</code>. Operationally, track their SAML certificate expiry and log sign-in failures with the IdP error codes.</p>
  </div>
</div>
` },

  ]
});
