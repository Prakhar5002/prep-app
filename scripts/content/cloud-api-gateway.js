window.PREP_SITE.registerTopic({
  id: "cloud-api-gateway",
  module: "cloud",
  title: "API Gateway",
  estimatedReadTime: "42 min",
  tags: ["aws","api-gateway","http-api","rest-api","websocket","authorizers","jwt","cors","throttling","serverless"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">API Gateway is the managed front door that does <strong>TLS, routing, authentication, throttling and CORS</strong> before your code runs — <strong>default to HTTP API, choose REST for its exclusive features</strong>, and never hold a request open past the ~29–30 s integration timeout.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Integrations:</strong> usually Lambda, but also any HTTP endpoint, private services through a VPC link, or AWS services directly (SQS, Step Functions, DynamoDB).</li>
    <li><strong>REST (v1):</strong> usage plans + API keys, request validation, VTL, caching, WAF, private and edge endpoints, stage canaries — ~$3.50/M requests.</li>
    <li><strong>HTTP (v2):</strong> ~$1/M, lower latency, JWT authorizers, built-in CORS, auto-deploy, VPC link to ALB/NLB; no validation, caching, usage plans or direct WAF.</li>
    <li><strong>WebSocket:</strong> <code>$connect</code>/<code>$disconnect</code>/<code>$default</code> + routes by <code>$request.body.action</code>; push via <code>@connections</code>; 410 Gone = stale; 2 h max, 10 min idle.</li>
    <li><strong>Proxy contract:</strong> return <code>{ statusCode, headers, body: string }</code>; malformed or thrown → 502. Payload 1.0 (REST) vs 2.0 (HTTP): lower-cased headers, <code>cookies</code> array, <code>requestContext.http.method</code>, <code>authorizer.jwt.claims</code>.</li>
    <li><strong>Authorizers:</strong> IAM (service-to-service), Cognito (REST), JWT (HTTP, any OIDC), Lambda (custom; cached by identity source; return wildcard resources).</li>
    <li><strong>Status codes:</strong> 400 validation, 401 bad token, 403 deny/WAF/missing key/wrong REST path, 429 throttled, 500 config/permission, 502 bad Lambda response, 504 timeout.</li>
    <li><strong>Throttling:</strong> token bucket; account 10k RPS / 5k burst per region shared by all APIs; then stage/route; then usage plan per key. API keys are not auth.</li>
    <li><strong>CORS:</strong> browser-only; HTTP API config handles preflight; REST needs OPTIONS without auth, headers from Lambda, and gateway responses for 4XX/5XX.</li>
    <li><strong>Limits:</strong> 29 s REST timeout (raisable for regional/private), 30 s HTTP; 10 MB payload but 6 MB via Lambda; files via S3 presigned URLs.</li>
    <li><strong>Deployments:</strong> REST changes need a deployment to a stage; stage variables; canaries. HTTP auto-deploy, <code>$default</code> stage.</li>
    <li><strong>Custom domains:</strong> ACM cert in us-east-1 for edge, same region for regional; API mappings for <code>/v1</code>; disable the default endpoint.</li>
    <li><strong>Observability:</strong> access logs always; Latency − IntegrationLatency = gateway overhead; no full data tracing in prod.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Debugging the wrong layer.</strong> A "CORS error" is often a gateway 401/429/504 without CORS headers; a "random 403" is often a cached Lambda-authorizer policy scoped to one method; a REST "403 Missing Authentication Token" is often just a wrong path. Read the real status code and the access log first, then fix the layer that produced it.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"I default to an HTTP API with a JWT authorizer — cheaper and simpler — and move to REST only when I need usage plans, request validation, caching, WAF on the API or private endpoints."</div>
  <div class="revision-say">"The gateway authenticates and throttles; my handler still authorizes each object, and my Lambda concurrency caps protect the database, because gateway throttling only protects the edge."</div>
  <div class="revision-say">"Anything slower than the 29–30 second integration timeout becomes 202 plus a job ID, processed through SQS, with polling, WebSocket or push for completion."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What problem it solves</h3>
<p>A Lambda function is not reachable from the internet by itself. Something has to accept HTTPS on a stable domain, decide which function handles <code>POST /bookings</code>, reject requests without a valid token, stop a single client from sending 50,000 requests a minute, answer browser CORS preflights, and log every call. You could build that with a load balancer and middleware; API Gateway gives it to you as configuration, priced per request, scaling to zero.</p>

<h3>What it does for you</h3>
<table>
  <thead><tr><th>Concern</th><th>What API Gateway provides</th><th>What you would otherwise build</th></tr></thead>
  <tbody>
    <tr><td>TLS + domain</td><td>Managed certs via ACM, custom domains, base-path / API mappings</td><td>Load balancer, cert renewal</td></tr>
    <tr><td>Routing</td><td>Method + path routes, path parameters, greedy <code>{proxy+}</code></td><td>A router in every service</td></tr>
    <tr><td>Authentication</td><td>IAM, Cognito, JWT, custom Lambda authorizers — with caching</td><td>Middleware in every service</td></tr>
    <tr><td>Rate limiting</td><td>Account, stage, route/method and per-API-key throttles; quotas</td><td>Redis token buckets (see <a href="#/topic/lld-rate-limiter">Rate Limiter</a>)</td></tr>
    <tr><td>Validation</td><td>JSON Schema body and parameter validation (REST)</td><td>Validation code that still costs an invocation</td></tr>
    <tr><td>Observability</td><td>Access logs, execution logs, metrics, X-Ray (REST)</td><td>Logging middleware</td></tr>
    <tr><td>Edge security</td><td>WAF (REST), resource policies, private APIs, mTLS</td><td>A separate WAF / proxy layer</td></tr>
  </tbody>
</table>

<h3>Why the flavour choice matters</h3>
<p>REST APIs cost roughly 3.5× more per request than HTTP APIs at first-tier pricing (about $3.50 vs $1.00 per million in us-east-1 at time of writing — check current pricing). At 100 million requests a month that is the difference between roughly $350 and $100. HTTP APIs also add less latency. But HTTP APIs lack several REST features (usage plans, request validation, caching, direct WAF association, private endpoints). Interviewers like this question because it tests whether you choose by requirements or by habit.</p>

<h3>Where it sits in a typical mobile/web backend</h3>
<div class="diagram">
<pre>
 RN app / web dashboard
        │ HTTPS  api.example.com   (Authorization: Bearer &lt;Cognito access token&gt;)
        ▼
 API Gateway (HTTP API)  ── JWT authorizer validates token (no Lambda call)
        │ routes
        ├── POST /bookings        → Lambda create-booking
        ├── GET  /bookings/{id}   → Lambda get-booking
        ├── POST /uploads/url     → Lambda that returns an S3 presigned URL
        └── POST /reports         → Lambda that enqueues to SQS and returns 202
</pre>
</div>

<h3>When NOT to use it</h3>
<ul>
  <li><strong>Very high, steady RPS</strong> to containers: an Application Load Balancer's hourly + capacity-unit pricing usually wins.</li>
  <li><strong>Responses that take longer than the timeout</strong> or stream for minutes: use Lambda Function URLs with response streaming, an ALB, or an async pattern.</li>
  <li><strong>GraphQL with subscriptions:</strong> AppSync is purpose-built.</li>
  <li><strong>Large file uploads/downloads:</strong> never proxy bytes through the gateway — use presigned S3 URLs (see <a href="#/topic/cloud-s3">S3</a>).</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Picture 1 — the request pipeline (REST API, the most complete one)</h3>
<div class="diagram">
<pre>
 client
   │ HTTPS → custom domain (ACM cert) or default https://{api-id}.execute-api.{region}.amazonaws.com/{stage}
   ▼
 [ WAF web ACL ]            REST only (attached to the stage)                       → 403
   ▼
 [ resource policy ]        REST only: allow/deny by IP, VPC endpoint, account        → 403
   ▼
 [ throttling ]             usage plan (per API key) → method → stage → account      → 429
   ▼
 [ authorizer ]             IAM SigV4 | Cognito | Lambda (result cached by identity) → 401 / 403
   ▼
 [ request validation ]     REST only: required params + JSON Schema body            → 400
   ▼
 [ cache lookup ]           REST only, per stage; a hit returns immediately
   ▼
 [ integration request ]    proxy (pass event through) or VTL mapping template
   ▼
 BACKEND  Lambda | HTTP URL | AWS service action | VPC link → private ALB/NLB
   │      must answer within the integration timeout                              → 504
   ▼
 [ integration response → method response ]   (non-proxy only: map codes and bodies)
   ▼
 client     + one access-log line + metrics (Count, 4XX, 5XX, Latency, IntegrationLatency)
</pre>
</div>
<p>HTTP APIs are the same pipeline with fewer boxes: no WAF, no resource policy, no validation, no cache, no VTL — which is exactly why they are cheaper and faster.</p>

<h3>Picture 2 — whose fault is this status code?</h3>
<table>
  <thead><tr><th>Status</th><th>Usually means (at the gateway)</th></tr></thead>
  <tbody>
    <tr><td>400</td><td>Request validation failed (REST), or malformed request</td></tr>
    <tr><td>401</td><td>Missing or invalid token: JWT authorizer rejected it, or a Lambda authorizer threw exactly <code>Unauthorized</code></td></tr>
    <tr><td>403</td><td>Authorizer returned Deny, IAM signature denied, resource policy or WAF block, missing API key — <em>or, on REST, a path/method that does not exist</em> ("Missing Authentication Token")</td></tr>
    <tr><td>404</td><td>HTTP API: no route matched</td></tr>
    <tr><td>413</td><td>Payload over the 10 MB limit</td></tr>
    <tr><td>429</td><td>Throttled (account, stage, route, usage plan) or usage-plan quota exhausted</td></tr>
    <tr><td>500</td><td>Gateway-side config problem: authorizer crashed, API Gateway lacks permission to invoke the Lambda, bad mapping</td></tr>
    <tr><td>502</td><td>Lambda crashed or returned a malformed proxy response</td></tr>
    <tr><td>504</td><td>Integration timed out ("Endpoint request timed out")</td></tr>
  </tbody>
</table>
<p>Memorising this table turns "the API is broken" into a five-minute diagnosis: 4xx before the integration ran means the gateway rejected it; 502/504 means look at the backend.</p>

<h3>Picture 3 — WebSocket API</h3>
<div class="diagram">
<pre>
 client ──wss://──► API Gateway WebSocket API  (it holds the TCP connection; Lambda never does)
                       │
   connect             ├─ $connect     → Lambda: authenticate, store connectionId
   {"action":"sub"}    ├─ route by $request.body.action → "sub" route → Lambda
   anything else       ├─ $default     → Lambda
   close / timeout     └─ $disconnect  → Lambda: delete connectionId (best effort!)

 backend wants to push:
   Lambda ──POST https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/@connections/{connectionId}──► client
          (410 Gone = client already left → delete the record)
</pre>
</div>

<h3>Three hooks that make it stick</h3>
<ul>
  <li><strong>Gateway = bouncer + receptionist.</strong> The bouncer (auth, WAF, throttling) keeps bad requests out; the receptionist (routing, mapping) sends good ones to the right room. Neither does the actual work.</li>
  <li><strong>Every box before the integration is free work for your Lambda</strong> — and every request rejected there is an invocation you do not pay for.</li>
  <li><strong>The gateway has a stopwatch.</strong> Whatever happens behind it must finish within the integration timeout, or the client gets 504 while your function keeps running.</li>
</ul>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"API keys secure my API." API Gateway API keys are identifiers for usage plans — metering and throttling per client. They travel in a header, get embedded in apps and copied around, and are not validated cryptographically. Authenticate with IAM, JWTs or a Lambda authorizer; use API keys only on top, to attribute and limit usage.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. REST vs HTTP vs WebSocket APIs</h3>
<table>
  <thead><tr><th></th><th>REST API (v1)</th><th>HTTP API (v2)</th><th>WebSocket API</th></tr></thead>
  <tbody>
    <tr><td>Price (first tier, us-east-1, check docs)</td><td>~$3.50 / million requests</td><td>~$1.00 / million requests</td><td>~$1.00 / million messages + connection-minutes</td></tr>
    <tr><td>Endpoint types</td><td>Edge-optimized, regional, private (VPC-only)</td><td>Regional</td><td>Regional</td></tr>
    <tr><td>Auth</td><td>IAM, Cognito user pool, Lambda (TOKEN / REQUEST)</td><td>IAM, JWT (any OIDC issuer incl. Cognito), Lambda (simple or IAM-policy response)</td><td>IAM, Lambda authorizer on <code>$connect</code></td></tr>
    <tr><td>API keys + usage plans</td><td>Yes</td><td>No</td><td>No</td></tr>
    <tr><td>Request validation</td><td>Yes (JSON Schema draft 4)</td><td>No — validate in code</td><td>Model selection on routes</td></tr>
    <tr><td>Transformations</td><td>VTL mapping templates</td><td>Parameter mapping only (headers, query, path, status)</td><td>VTL</td></tr>
    <tr><td>Caching</td><td>Yes (per stage)</td><td>No</td><td>No</td></tr>
    <tr><td>WAF</td><td>Yes (on the stage)</td><td>Not directly (put CloudFront + WAF in front)</td><td>No</td></tr>
    <tr><td>CORS</td><td>Manual (OPTIONS method + headers + gateway responses)</td><td>Built-in configuration</td><td>n/a</td></tr>
    <tr><td>Deployment</td><td>Explicit deployments to stages; canary per stage</td><td>Auto-deploy option; <code>$default</code> stage</td><td>Explicit deployments</td></tr>
    <tr><td>Private integrations</td><td>VPC link (to NLB; check docs for newer targets)</td><td>VPC link to ALB, NLB, Cloud Map</td><td>VPC link</td></tr>
    <tr><td>Tracing</td><td>X-Ray</td><td>No native X-Ray (trace from the Lambda)</td><td>—</td></tr>
    <tr><td>Integration timeout</td><td>50 ms–29 s default; increase possible for regional/private</td><td>Up to 30 s</td><td>Up to 29 s per message</td></tr>
  </tbody>
</table>
<p><strong>Rule of thumb:</strong> start with an HTTP API. Move to REST when you need one of its exclusive features — usage plans for partner APIs, request validation, caching, WAF on the API itself, private VPC-only APIs, edge-optimized endpoints, VTL direct integrations, or stage canaries. Feature parity shifts over time, so check the current comparison page before deciding.</p>

<h3>2. Lambda proxy integration — the two event formats</h3>
<p>REST APIs use payload format 1.0; HTTP APIs default to 2.0 (1.0 is selectable). Same request, two shapes:</p>
<pre><code class="language-json">// Payload 1.0 (REST API)                       — GET /bookings/42?include=room
{
  "resource": "/bookings/{id}",
  "path": "/bookings/42",
  "httpMethod": "GET",
  "headers": { "Authorization": "Bearer eyJ...", "Accept": "application/json" },
  "multiValueHeaders": { "Accept": ["application/json"] },
  "queryStringParameters": { "include": "room" },
  "multiValueQueryStringParameters": { "include": ["room"] },
  "pathParameters": { "id": "42" },
  "requestContext": {
    "requestId": "c6af9ac6-7b61-11e6-9a41-93e8deadbeef",
    "stage": "prod",
    "identity": { "sourceIp": "203.0.113.10" },
    "authorizer": { "claims": { "sub": "a1b2c3", "cognito:groups": "admins" } }
  },
  "body": null,
  "isBase64Encoded": false
}

// Payload 2.0 (HTTP API)
{
  "version": "2.0",
  "routeKey": "GET /bookings/{id}",
  "rawPath": "/bookings/42",
  "rawQueryString": "include=room",
  "cookies": ["theme=dark"],
  "headers": { "authorization": "Bearer eyJ...", "accept": "application/json" },
  "queryStringParameters": { "include": "room" },
  "pathParameters": { "id": "42" },
  "requestContext": {
    "requestId": "JKJaXmPLvHcESHA=",
    "stage": "$default",
    "http": { "method": "GET", "path": "/bookings/42", "sourceIp": "203.0.113.10" },
    "authorizer": { "jwt": { "claims": { "sub": "a1b2c3" }, "scopes": null } }
  },
  "body": null,
  "isBase64Encoded": false
}</code></pre>
<table>
  <thead><tr><th></th><th>1.0</th><th>2.0</th></tr></thead>
  <tbody>
    <tr><td>Method</td><td><code>event.httpMethod</code></td><td><code>event.requestContext.http.method</code></td></tr>
    <tr><td>Headers</td><td>Original case; repeats in <code>multiValueHeaders</code></td><td>Lower-cased; repeated headers joined with commas</td></tr>
    <tr><td>Cookies</td><td>In the <code>Cookie</code> header</td><td>Separate <code>cookies</code> array</td></tr>
    <tr><td>Authorizer data</td><td><code>requestContext.authorizer.claims</code> (Cognito) or flat keys (Lambda)</td><td><code>requestContext.authorizer.jwt.claims</code> or <code>.authorizer.lambda</code></td></tr>
    <tr><td>Response</td><td>Must be <code>{ statusCode, headers?, body: string, isBase64Encoded? }</code></td><td>Same, plus <code>cookies</code>; or return a plain object/string and API Gateway infers 200 + JSON</td></tr>
  </tbody>
</table>
<p>Malformed responses — <code>body</code> as an object instead of a string, missing <code>statusCode</code>, non-string header values — produce a <strong>502</strong> ("Malformed Lambda proxy response" in REST execution logs).</p>

<h3>3. Letting API Gateway invoke the function</h3>
<p>The integration only works if the Lambda's resource-based policy allows <code>apigateway.amazonaws.com</code> to invoke it, scoped by source ARN (confused-deputy protection — see <a href="#/topic/cloud-aws-foundations">AWS Foundations &amp; IAM</a>). CDK and SAM add this automatically; with the CLI or console you may have to do it yourself, and forgetting it surfaces as a <strong>500</strong>.</p>
<pre><code class="language-bash">aws lambda add-permission --function-name create-booking \\
  --statement-id apigw-invoke-create-booking \\
  --action lambda:InvokeFunction \\
  --principal apigateway.amazonaws.com \\
  --source-arn "arn:aws:execute-api:ap-south-1:111111111111:a1b2c3/*/POST/bookings"</code></pre>

<h3>4. Non-proxy and direct AWS service integrations</h3>
<p>REST APIs can transform requests and responses with VTL mapping templates and call AWS service actions directly — no Lambda in the middle. The classic use is "accept a webhook and drop it on a queue":</p>
<pre><code class="language-text">Integration type : AWS service → SQS, action via path "111111111111/crm-webhooks", HTTP POST
Execution role   : apigw-to-sqs (sqs:SendMessage on that queue only)
Request header   : Content-Type = 'application/x-www-form-urlencoded'
Mapping template (application/json):
  Action=SendMessage&amp;MessageBody=$util.urlEncode($input.body)
Integration response 200 → method response 202</code></pre>
<p>HTTP APIs offer first-class integrations for a subset of services with simple parameter mapping (for example <code>SQS-SendMessage</code>, <code>EventBridge-PutEvents</code>, <code>StepFunctions-StartExecution</code>). Fewer moving parts and no cold starts — but no custom logic, so anything like HMAC signature verification still needs a Lambda.</p>

<h3>5. Authorizers</h3>
<table>
  <thead><tr><th>Type</th><th>Available on</th><th>How it works</th><th>Best for</th></tr></thead>
  <tbody>
    <tr><td><strong>IAM (SigV4)</strong></td><td>REST, HTTP, WebSocket</td><td>Caller signs the request with AWS credentials; the gateway evaluates IAM policies for <code>execute-api:Invoke</code></td><td>Service-to-service, internal tools, Cognito identity-pool clients</td></tr>
    <tr><td><strong>Cognito user pool authorizer</strong></td><td>REST</td><td>Validates a Cognito ID or access token; access tokens can be checked against OAuth scopes per method</td><td>Apps already on Cognito, REST APIs</td></tr>
    <tr><td><strong>JWT authorizer</strong></td><td>HTTP</td><td>Validates signature (JWKS from the issuer), <code>iss</code>, <code>aud</code> or <code>client_id</code>, expiry, optional scopes — no Lambda call</td><td>Any OIDC provider: Cognito, Auth0, Okta, Entra ID</td></tr>
    <tr><td><strong>Lambda authorizer</strong></td><td>REST (TOKEN or REQUEST), HTTP (REQUEST), WebSocket (<code>$connect</code>)</td><td>Your function inspects headers/query/context and returns an IAM policy (or, on HTTP APIs, a simple <code>isAuthorized</code> boolean) plus context</td><td>Custom tokens, API keys in a DB, multi-tenant lookups, legacy session cookies</td></tr>
  </tbody>
</table>
<ul>
  <li><strong>Caching:</strong> Lambda authorizer results are cached by identity source (REST default TTL 300 s, max 3600 s). Caching saves latency and cost, but the cached <em>policy</em> is reused for every method the same token calls — see Edge Case 3.</li>
  <li><strong>Context:</strong> values an authorizer returns (user ID, tenant ID, role) appear in <code>requestContext.authorizer</code> for the backend. Keep them flat strings/numbers/booleans.</li>
  <li><strong>Authorization still belongs in code.</strong> The gateway proves who the caller is and maybe their role; whether <em>this user may read booking 42</em> is an object-level check your handler must do. Broken object-level authorization is the top API security risk. See <a href="#/topic/api-auth-rbac">AuthN, AuthZ &amp; RBAC</a> and <a href="#/topic/cloud-cognito">Cognito</a>.</li>
</ul>

<h3>6. Throttling, usage plans and quotas</h3>
<p>Throttling uses a token bucket: <strong>rate</strong> = steady requests per second refilled, <strong>burst</strong> = bucket size for short spikes. Limits apply at several levels, and the most restrictive wins:</p>
<ol>
  <li><strong>Account, per region</strong> — 10,000 RPS steady with 5,000 burst by default (soft), shared across all REST, HTTP and WebSocket APIs in that region.</li>
  <li><strong>Stage / route / method</strong> — you set these; protect expensive endpoints and downstreams.</li>
  <li><strong>Per client</strong> (REST usage plans) — rate, burst and a daily/weekly/monthly quota per API key.</li>
</ol>
<pre><code class="language-bash"># HTTP API: default throttle for every route on the $default stage
aws apigatewayv2 update-stage --api-id a1b2c3 --stage-name '$default' \\
  --default-route-settings ThrottlingRateLimit=100,ThrottlingBurstLimit=200

# REST API: a partner tier = usage plan + key
aws apigateway create-usage-plan --name partner-basic \\
  --throttle burstLimit=20,rateLimit=10 \\
  --quota limit=100000,period=MONTH \\
  --api-stages apiId=abc123,stage=prod
aws apigateway create-api-key --name acme-corp --enabled
aws apigateway create-usage-plan-key --usage-plan-id PLAN_ID --key-id KEY_ID --key-type API_KEY</code></pre>
<p>Throttling is best-effort, not an exact counter, and it protects the gateway, not your database: if the backend can serve 50 RPS, set route limits accordingly <em>and</em> cap Lambda concurrency (see <a href="#/topic/cloud-lambda">AWS Lambda</a>). Clients should treat 429 as "back off with jitter and retry".</p>

<h3>7. CORS</h3>
<p>CORS is a browser rule: a web page from <code>https://app.example.com</code> may only read responses from another origin if the response carries the right <code>Access-Control-Allow-*</code> headers, and for non-simple requests (JSON bodies, <code>Authorization</code> header) the browser first sends an <code>OPTIONS</code> preflight. Native React Native apps on a device do not enforce CORS — which is why "it works on the phone but not on the web dashboard" is a CORS smell.</p>
<ul>
  <li><strong>HTTP API:</strong> configure <code>corsPreflight</code>; API Gateway answers preflights itself (no authorizer, no Lambda) and adds headers to responses, overriding whatever the integration returns.</li>
  <li><strong>REST API:</strong> you need an <code>OPTIONS</code> method (usually a mock integration, <em>without</em> an authorizer), the Lambda must return CORS headers itself under proxy integration, and <strong>gateway responses</strong> (<code>DEFAULT_4XX</code>, <code>DEFAULT_5XX</code>) must also carry them — otherwise a 401 or 429 from the gateway shows up in the browser as a CORS error.</li>
  <li>With credentials (cookies), <code>Access-Control-Allow-Origin</code> cannot be <code>*</code>; echo a specific allow-listed origin and add <code>Vary: Origin</code>.</li>
</ul>
<pre><code class="language-yaml"># REST API (CloudFormation/SAM): CORS headers on gateway-generated errors
GatewayResponse4xx:
  Type: AWS::ApiGateway::GatewayResponse
  Properties:
    RestApiId: !Ref PartnerApi
    ResponseType: DEFAULT_4XX
    ResponseParameters:
      gatewayresponse.header.Access-Control-Allow-Origin: "'https://app.example.com'"
      gatewayresponse.header.Access-Control-Allow-Headers: "'Content-Type,Authorization'"
GatewayResponse5xx:
  Type: AWS::ApiGateway::GatewayResponse
  Properties:
    RestApiId: !Ref PartnerApi
    ResponseType: DEFAULT_5XX
    ResponseParameters:
      gatewayresponse.header.Access-Control-Allow-Origin: "'https://app.example.com'"</code></pre>

<h3>8. Stages, deployments and versioning</h3>
<ul>
  <li><strong>REST:</strong> editing resources changes a draft; nothing is live until you create a <strong>deployment</strong> (an immutable snapshot) and point a <strong>stage</strong> (<code>dev</code>, <code>prod</code>) at it. Stages carry their own throttling, logging, caching, WAF and <strong>stage variables</strong> (e.g. integration URI <code>...:function:create-booking:&#36;{stageVariables.alias}</code> so each stage calls a different Lambda alias). A stage can run a <strong>canary</strong>: a percentage of traffic goes to a new deployment until you promote or roll back.</li>
  <li><strong>HTTP:</strong> stages with optional <strong>auto-deploy</strong>; the <code>$default</code> stage serves the API at the root URL. No stage canary — do gradual rollouts with Lambda alias weights (CodeDeploy).</li>
  <li><strong>Versioning:</strong> map one custom domain to several APIs or stages with base paths: <code>api.example.com/v1</code> → API A, <code>/v2</code> → API B. Strategy trade-offs in <a href="#/topic/api-versioning">API Versioning</a>.</li>
</ul>
<pre><code class="language-bash"># REST: ship the current draft to prod, with 10% canary traffic
aws apigateway create-deployment --rest-api-id abc123 --stage-name prod \\
  --description "bookings v42" \\
  --canary-settings percentTraffic=10.0,useStageCache=false</code></pre>

<h3>9. Request validation (REST)</h3>
<p>Attach a request validator and a JSON Schema (draft 4) model to a method; invalid requests get a 400 <em>before</em> any Lambda runs, so you do not pay for garbage. It is coarse (error messages are generic; customise them with the <code>BAD_REQUEST_BODY</code> gateway response) and it does not replace validation in code — the handler should still parse with a schema library because the gateway's checks are only as good as the model. On HTTP APIs, validation lives entirely in the function.</p>

<h3>10. Timeouts and payload limits</h3>
<ul>
  <li><strong>REST:</strong> integration timeout 50 ms to 29 s by default. Since 2024, regional and private REST APIs can request a higher timeout through Service Quotas, possibly in exchange for a lower account throttle — check current docs. Edge-optimized APIs stay at 29 s.</li>
  <li><strong>HTTP:</strong> up to 30 s, not raisable.</li>
  <li><strong>On timeout</strong> the client gets 504, but the Lambda keeps running to its own timeout, still billing and possibly committing side effects. Set the function timeout below the gateway's and make writes idempotent.</li>
  <li><strong>Payload:</strong> 10 MB through the gateway, but a Lambda integration is capped at 6 MB (and an ALB-to-Lambda integration at 1 MB). Files go through S3 presigned URLs, not the API.</li>
  <li><strong>Binary (REST):</strong> declare <code>binaryMediaTypes</code>; the Lambda returns base64 with <code>isBase64Encoded: true</code>, and the client must send a matching <code>Accept</code> header.</li>
</ul>

<h3>11. Custom domains</h3>
<ul>
  <li>Certificate from ACM: <strong>us-east-1</strong> for edge-optimized endpoints, <strong>the API's region</strong> for regional ones (HTTP APIs are always regional).</li>
  <li>Route 53 alias record → the API Gateway domain target. Use API mappings for base paths.</li>
  <li>Choose a TLS 1.2+ security policy; regional custom domains support <strong>mutual TLS</strong> with a truststore in S3 (B2B integrations).</li>
  <li><strong>Disable the default <code>execute-api</code> endpoint</strong> once the custom domain is live, or clients can bypass anything you put in front of the domain (CloudFront, WAF).</li>
</ul>
<pre><code class="language-bash">aws apigatewayv2 create-domain-name --domain-name api.example.com \\
  --domain-name-configurations CertificateArn=arn:aws:acm:ap-south-1:111111111111:certificate/abcd-1234,EndpointType=REGIONAL,SecurityPolicy=TLS_1_2
aws apigatewayv2 create-api-mapping --domain-name api.example.com \\
  --api-id a1b2c3 --stage '$default' --api-mapping-key v1</code></pre>

<h3>12. Caching (REST)</h3>
<p>A per-stage cache from 0.5 GB to 237 GB, billed per hour while enabled, default TTL 300 s (max 3600 s), keyed by method, path and the parameters you choose. Two traps: user-specific responses must include an identity parameter (or the <code>Authorization</code> header) in the cache key, and clients can bypass the cache with <code>Cache-Control: max-age=0</code> unless you require authorization for invalidation.</p>

<h3>13. WebSocket APIs</h3>
<ul>
  <li><strong>Routes:</strong> <code>$connect</code>, <code>$disconnect</code>, <code>$default</code>, plus custom routes chosen by a route selection expression such as <code>$request.body.action</code>.</li>
  <li><strong>Auth happens once, on <code>$connect</code></strong> (IAM or a Lambda REQUEST authorizer). Browsers cannot set custom headers on WebSocket handshakes, so tokens usually travel in the query string — keep them short-lived.</li>
  <li><strong>Pushing to clients:</strong> the backend calls the <code>@connections</code> management API with the connection ID (needs <code>execute-api:ManageConnections</code>). A 410 <code>GoneException</code> means the client is gone.</li>
  <li><strong>Limits (check docs):</strong> 2-hour maximum connection duration, 10-minute idle timeout, 128 KB messages (32 KB frames). Clients must heartbeat and reconnect.</li>
  <li><code>$disconnect</code> is best-effort — store connections with a TTL and clean up on 410.</li>
</ul>
<p>Protocol-level details (frames, ping/pong, scaling self-hosted sockets) live in <a href="#/topic/api-websockets">WebSockets Deep</a>.</p>

<h3>14. Logging, metrics and tracing</h3>
<ul>
  <li><strong>Access logs:</strong> one line per request in a format you define with <code>$context</code> variables. Always on in prod.</li>
  <li><strong>Execution logs (REST):</strong> verbose per-step logs, useful when debugging mappings and authorizers. Requires an account-level CloudWatch role. Do not leave full request/response data logging on in prod — it writes tokens and PII to logs.</li>
  <li><strong>Metrics:</strong> Count, 4XX, 5XX, Latency, IntegrationLatency (names differ slightly between REST and HTTP). <em>Latency minus IntegrationLatency</em> is the gateway's own overhead, including authorizers.</li>
</ul>
<pre><code class="language-json">{
  "requestId": "$context.requestId",
  "ip": "$context.identity.sourceIp",
  "method": "$context.httpMethod",
  "route": "$context.routeKey",
  "status": "$context.status",
  "latencyMs": "$context.responseLatency",
  "integrationLatencyMs": "$context.integrationLatency",
  "integrationError": "$context.integrationErrorMessage",
  "authorizerError": "$context.authorizer.error"
}</code></pre>
<p>An HTTP API access-log format; check the <code>$context</code> variable reference for your API type. More in <a href="#/topic/cloud-cloudwatch">CloudWatch &amp; Observability</a>.</p>

<h3>15. API Gateway vs the alternatives</h3>
<table>
  <thead><tr><th></th><th>API Gateway (HTTP)</th><th>ALB → Lambda/containers</th><th>Lambda Function URL</th><th>AppSync</th></tr></thead>
  <tbody>
    <tr><td>Pricing model</td><td>Per request</td><td>Per hour + capacity units</td><td>Free (Lambda cost only)</td><td>Per request + real-time minutes</td></tr>
    <tr><td>Auth</td><td>JWT, IAM, Lambda</td><td>OIDC/Cognito login on the listener (browser sessions)</td><td>IAM or none</td><td>Cognito, IAM, OIDC, API key, Lambda</td></tr>
    <tr><td>Throttling</td><td>Yes</td><td>No (WAF rate rules)</td><td>Only via Lambda concurrency</td><td>Yes</td></tr>
    <tr><td>Timeout</td><td>30 s</td><td>Configurable idle timeout</td><td>Up to Lambda's 15 min; streaming</td><td>30 s-class</td></tr>
    <tr><td>Lambda payload</td><td>6 MB</td><td>1 MB</td><td>6 MB (streaming larger)</td><td>—</td></tr>
    <tr><td>Best for</td><td>Most serverless REST APIs</td><td>High steady RPS, containers, long requests</td><td>Webhooks, internal tools, LLM streaming</td><td>GraphQL + subscriptions</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — HTTP API + Cognito JWT auth + CORS + custom domain (CDK)</h3>
<pre><code class="language-ts">import { Duration } from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpUserPoolAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';

const authorizer = new HttpUserPoolAuthorizer('UserPoolAuth', userPool, {
  userPoolClients: [appClient],              // becomes the allowed audience / client_id
});

const domain = new apigw.DomainName(this, 'ApiDomain', {
  domainName: 'api.example.com',
  certificate: acm.Certificate.fromCertificateArn(this, 'Cert', certArn),  // same region as the API
});

const api = new apigw.HttpApi(this, 'BookingsApi', {
  defaultAuthorizer: authorizer,             // every route authenticated unless overridden
  corsPreflight: {
    allowOrigins: ['https://app.example.com'],
    allowMethods: [apigw.CorsHttpMethod.GET, apigw.CorsHttpMethod.POST, apigw.CorsHttpMethod.DELETE],
    allowHeaders: ['authorization', 'content-type', 'idempotency-key'],
    maxAge: Duration.hours(1),
  },
  defaultDomainMapping: { domainName: domain, mappingKey: 'v1' },   // api.example.com/v1/...
  disableExecuteApiEndpoint: true,           // no bypassing the custom domain
});

api.addRoutes({
  path: '/bookings',
  methods: [apigw.HttpMethod.POST],
  integration: new HttpLambdaIntegration('CreateBooking', createBookingAlias),
});
api.addRoutes({
  path: '/bookings/{id}',
  methods: [apigw.HttpMethod.GET, apigw.HttpMethod.DELETE],
  integration: new HttpLambdaIntegration('BookingById', bookingByIdAlias),
});
api.addRoutes({
  path: '/health',
  methods: [apigw.HttpMethod.GET],
  integration: new HttpLambdaIntegration('Health', healthFn),
  authorizer: new apigw.HttpNoneAuthorizer(),   // explicitly public
});</code></pre>
<p>Integrations point at Lambda <strong>aliases</strong> so canary deploys and provisioned concurrency apply. The backend reads <code>event.requestContext.authorizer.jwt.claims.sub</code> and still checks that the caller owns the booking it asks for.</p>

<h3>Example 2 — REST partner API with Cognito auth, validation and a usage plan (SAM)</h3>
<pre><code class="language-yaml">Resources:
  PartnerApi:
    Type: AWS::Serverless::Api
    Properties:
      StageName: prod
      TracingEnabled: true
      MethodSettings:
        - ResourcePath: '/*'
          HttpMethod: '*'
          ThrottlingRateLimit: 100
          ThrottlingBurstLimit: 200
          MetricsEnabled: true
      Auth:
        DefaultAuthorizer: PartnerCognito
        Authorizers:
          PartnerCognito:
            UserPoolArn: !GetAtt PartnerUserPool.Arn   # machine clients: client-credentials flow
        ApiKeyRequired: true                           # identifies the partner for metering
        UsagePlan:
          CreateUsagePlan: PER_API
          Quota: { Limit: 100000, Period: MONTH }
          Throttle: { RateLimit: 50, BurstLimit: 100 }
      Models:
        CreateBooking:
          type: object
          required: [roomId, start, end]
          properties:
            roomId: { type: string, minLength: 1 }
            start:  { type: string, minLength: 20 }
            end:    { type: string, minLength: 20 }

  CreateBookingFn:
    Type: AWS::Serverless::Function
    Properties:
      Runtime: nodejs22.x
      Handler: index.handler
      CodeUri: dist/create-booking/
      Timeout: 10
      Events:
        Create:
          Type: Api
          Properties:
            RestApiId: !Ref PartnerApi
            Path: /bookings
            Method: post
            RequestModel:
              Model: CreateBooking
              Required: true
              ValidateBody: true                       # 400 before the Lambda runs</code></pre>

<h3>Example 3 — REST Lambda TOKEN authorizer that verifies Cognito JWTs</h3>
<pre><code class="language-ts">import type { APIGatewayTokenAuthorizerHandler, APIGatewayAuthorizerResult } from 'aws-lambda';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

// Created at init → the JWKS is downloaded once and cached across warm invocations.
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID!,
  tokenUse: 'access',
  clientId: process.env.APP_CLIENT_ID!,
});

export const handler: APIGatewayTokenAuthorizerHandler = async (event) =&gt; {
  const token = event.authorizationToken.replace(/^Bearer /i, '');
  try {
    const claims = await verifier.verify(token);
    const groups = (claims['cognito:groups'] ?? []) as string[];
    return policy(claims.sub, 'Allow', wildcard(event.methodArn), {
      userId: claims.sub,
      groups: groups.join(','),            // context values must be flat primitives
    });
  } catch {
    throw new Error('Unauthorized');       // exactly this message → 401; anything else → 500
  }
};

// arn:aws:execute-api:region:acct:apiId/stage/METHOD/path  →  .../apiId/stage/*/*
// A wildcard keeps the CACHED policy valid for every route this token calls.
function wildcard(methodArn: string): string {
  const [apiArn, stage] = methodArn.split('/');
  return apiArn + '/' + stage + '/*/*';
}

function policy(
  principalId: string,
  effect: 'Allow' | 'Deny',
  resource: string,
  context: Record&lt;string, string&gt;,
): APIGatewayAuthorizerResult {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{ Action: 'execute-api:Invoke', Effect: effect, Resource: resource }],
    },
    context,
  };
}</code></pre>
<p>For a plain Cognito token you would normally use the built-in authorizer instead; a Lambda authorizer earns its keep when you add custom logic — tenant lookup, a revocation list, mapping a legacy token. Fine-grained role checks are better done in the handler (or by returning only the routes this role may call, with caching tuned accordingly).</p>

<h3>Example 4 — HTTP API "simple response" authorizer for partner keys</h3>
<pre><code class="language-ts">import type { APIGatewayRequestAuthorizerEventV2 } from 'aws-lambda';
import { createHash } from 'node:crypto';

type Result = { isAuthorized: boolean; context?: Record&lt;string, string&gt; };

export const handler = async (event: APIGatewayRequestAuthorizerEventV2): Promise&lt;Result&gt; =&gt; {
  const presented = event.headers?.['x-partner-key'];
  if (!presented) return { isAuthorized: false };

  const keyHash = createHash('sha256').update(presented).digest('hex');   // store hashes, not keys
  const partner = await findPartnerByKeyHash(keyHash);                    // DynamoDB lookup
  if (!partner || partner.status !== 'active') return { isAuthorized: false };

  return { isAuthorized: true, context: { tenantId: partner.tenantId, plan: partner.plan } };
};
declare function findPartnerByKeyHash(h: string): Promise&lt;{ tenantId: string; plan: string; status: string } | undefined&gt;;</code></pre>
<p>Configure it with payload format 2.0 and simple responses enabled, identity source <code>$request.header.x-partner-key</code>, and a short result cache TTL. The backend reads <code>event.requestContext.authorizer.lambda.tenantId</code>. Unlike API Gateway API keys, these are your own revocable, hashed credentials.</p>

<h3>Example 5 — webhook ingestion straight into SQS (no Lambda)</h3>
<pre><code class="language-bash"># HTTP API first-class integration: POST /webhooks/crm → SQS SendMessage
aws apigatewayv2 create-integration --api-id a1b2c3 \\
  --integration-type AWS_PROXY \\
  --integration-subtype SQS-SendMessage \\
  --payload-format-version 1.0 \\
  --credentials-arn arn:aws:iam::111111111111:role/apigw-to-sqs \\
  --request-parameters '{"QueueUrl":"https://sqs.ap-south-1.amazonaws.com/111111111111/crm-webhooks","MessageBody":"$request.body"}'

aws apigatewayv2 create-route --api-id a1b2c3 \\
  --route-key 'POST /webhooks/crm' --target integrations/INTEGRATION_ID</code></pre>
<p>Absorbs bursts (the queue buffers, workers drain at their own pace — see <a href="#/topic/cloud-sqs">SQS</a>), no cold starts, cheaper. Trade-off: no code runs before enqueue, so verifying the sender's HMAC signature (computed over the raw body) must happen in the consumer — or put a small Lambda in front. HTTP API Lambda authorizers only see headers, query and context, not the body.</p>

<h3>Example 6 — the 202 Accepted pattern for slow work (LLM reports)</h3>
<pre><code class="language-ts">import { randomUUID } from 'node:crypto';
import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const sqs = new SQSClient({});
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// POST /reports → returns in ~100 ms, regardless of how long the LLM takes
export const startReport: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) =&gt; {
  const userId = event.requestContext.authorizer.jwt.claims.sub as string;
  const jobId = randomUUID();
  await ddb.send(new PutCommand({
    TableName: process.env.JOBS_TABLE!,
    Item: { jobId, userId, status: 'QUEUED', createdAt: Date.now() },
  }));
  await sqs.send(new SendMessageCommand({
    QueueUrl: process.env.REPORTS_QUEUE_URL!,
    MessageBody: JSON.stringify({ jobId, userId, input: JSON.parse(event.body ?? '{}') }),
  }));
  return {
    statusCode: 202,
    headers: { location: '/reports/' + jobId, 'content-type': 'application/json' },
    body: JSON.stringify({ jobId, status: 'QUEUED' }),
  };
};
// GET /reports/{id} → { status: 'QUEUED' | 'RUNNING' | 'DONE' | 'FAILED', resultUrl? }
// The worker Lambda (SQS-triggered, up to 15 min) updates the job row and stores output in S3.
// Clients poll with backoff, or get a WebSocket / push notification when status flips to DONE.</code></pre>
<p>More on async request patterns in <a href="#/topic/be-event-driven">Event-Driven Systems &amp; Async Processing</a>.</p>

<h3>Example 7 — WebSocket live board for room-status tablets</h3>
<pre><code class="language-ts">import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

type WsEvent = {
  requestContext: {
    connectionId: string; routeKey: string;
    authorizer?: { siteId?: string };          // set by the $connect Lambda authorizer
  };
  body?: string;
};

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.CONNECTIONS_TABLE!;
// https://{api-id}.execute-api.{region}.amazonaws.com/{stage}
const mgmt = new ApiGatewayManagementApiClient({ endpoint: process.env.WS_CALLBACK_URL! });

export const onConnect = async (event: WsEvent) =&gt; {
  const siteId = event.requestContext.authorizer?.siteId ?? 'unknown';
  await ddb.send(new PutCommand({
    TableName: TABLE,
    Item: {
      pk: 'SITE#' + siteId,
      sk: 'CONN#' + event.requestContext.connectionId,
      ttl: Math.floor(Date.now() / 1000) + 2 * 60 * 60,   // max connection life; $disconnect is best-effort
    },
  }));
  return { statusCode: 200 };
};

export const onDisconnect = async (event: WsEvent) =&gt; {
  // a real table would also index connectionId → siteId; simplified here
  return { statusCode: 200 };
};

// Called from a DynamoDB stream / EventBridge rule when a booking changes.
export async function broadcast(siteId: string, message: unknown) {
  const res = await ddb.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: { ':pk': 'SITE#' + siteId },
  }));
  const data = Buffer.from(JSON.stringify(message));
  await Promise.allSettled((res.Items ?? []).map(async (item) =&gt; {
    const connectionId = String(item.sk).slice('CONN#'.length);
    try {
      await mgmt.send(new PostToConnectionCommand({ ConnectionId: connectionId, Data: data }));
    } catch (err) {
      if ((err as Error).name === 'GoneException') {                  // 410: client already left
        await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { pk: item.pk, sk: item.sk } }));
      } else {
        throw err;
      }
    }
  }));
}</code></pre>
<p>Client side (React Native tablet app): reconnect with exponential backoff on close, send a small heartbeat every few minutes to beat the 10-minute idle timeout, reconnect proactively before the 2-hour cap, and on every reconnect re-fetch current state over REST — pushes sent while disconnected are simply lost. The broadcasting Lambda needs <code>execute-api:ManageConnections</code> on the API's <code>@connections</code> ARN.</p>

<h3>Example 8 — CORS handled in a REST proxy Lambda</h3>
<pre><code class="language-ts">const ALLOWED_ORIGINS = new Set(['https://app.example.com', 'http://localhost:8081']);

export function withCors(origin: string | undefined, res: { statusCode: number; body: string; headers?: Record&lt;string, string&gt; }) {
  const cors: Record&lt;string, string&gt; = origin &amp;&amp; ALLOWED_ORIGINS.has(origin)
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', Vary: 'Origin' }
    : {};
  return { ...res, headers: { ...(res.headers ?? {}), ...cors } };
}
// Every return path — success AND error — goes through withCors(event.headers.origin, ...).
// Gateway-generated errors (401/403/429/504) need the gateway responses shown in Mechanics §7.</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. "Missing Authentication Token" for a typo</h3>
<p>On REST APIs, calling a path or method that does not exist returns <strong>403 Missing Authentication Token</strong>, not 404. Before debugging auth, check the URL, the stage name in the path, and that the method exists and was deployed.</p>

<h3>2. 502 from a perfectly healthy Lambda</h3>
<p>The function ran fine but returned <code>body: { ok: true }</code> (an object), omitted <code>statusCode</code>, or set a header to a number. Proxy integrations require <code>body</code> to be a string. Under payload 2.0 a plain object is allowed — another reason the two formats confuse people.</p>

<h3>3. Random 403s with a Lambda authorizer</h3>
<p>The authorizer returns a policy allowing only the <em>current</em> method ARN, and caching is on. The next call with the same token to a different route reuses the cached policy, which does not cover it → 403. Return a wildcard resource (or the full set of allowed routes), or disable caching.</p>

<h3>4. Cache serving one user's data to another</h3>
<p>REST caching keyed only on the path caches <code>GET /me</code> for the first caller. Include the identity (Authorization header or a user parameter) in the cache key for anything user-specific — or do not cache it.</p>

<h3>5. CORS error that is really a 401, 429 or 504</h3>
<p>Gateway-generated responses do not include your CORS headers unless you configure gateway responses (REST). The browser hides the real status and reports a CORS failure. Check the network tab's status code and the access log before touching CORS config.</p>

<h3>6. Preflight blocked by the authorizer</h3>
<p>On REST, if <code>OPTIONS</code> requires authorization, preflights (which never carry the token) fail. Leave <code>OPTIONS</code> unauthenticated. HTTP APIs with CORS configured answer preflights before auth.</p>

<h3>7. Cognito access tokens have no <code>aud</code></h3>
<p>Cognito ID tokens carry <code>aud</code>; access tokens carry <code>client_id</code> instead. HTTP API JWT authorizers accept either, matched against the configured audience list — so the "audience" must be the app client ID.</p>

<h3>8. Account throttle shared by every API in the region</h3>
<p>A load test or a runaway client on one API can consume the account-level 10,000 RPS budget and throttle unrelated production APIs. Set stage/route limits per API and keep load tests in a separate account.</p>

<h3>9. 504 while the work continues</h3>
<p>The gateway gave up, the Lambda did not. The client retries, and now there are two bookings. Function timeout below the gateway timeout, idempotency keys on writes, and async patterns for slow work.</p>

<h3>10. <code>{proxy+}</code> does not match the root</h3>
<p>On REST, a greedy <code>/{proxy+}</code> resource matches <code>/anything/below</code> but not <code>/</code> itself. Add an <code>ANY</code> method on the root resource too when fronting a whole framework app.</p>

<h3>11. Header casing and repeated values</h3>
<p>Payload 2.0 lower-cases header names and joins repeated headers with commas; 1.0 preserves case and gives arrays in <code>multiValueHeaders</code>. Code that reads <code>event.headers.Authorization</code> breaks when you migrate from REST to HTTP.</p>

<h3>12. Certificate in the wrong region</h3>
<p>An edge-optimized custom domain needs its ACM certificate in us-east-1; a regional one needs it in the API's region. The console dropdown simply will not show the certificate otherwise.</p>

<h3>13. The default endpoint is still open</h3>
<p>You put CloudFront and WAF in front of <code>api.example.com</code>, but <code>https://a1b2c3.execute-api...</code> still answers directly, bypassing both. Disable the default endpoint.</p>

<h3>14. REST changes not live</h3>
<p>You edited a method in the console, tested it in the console's test tool, and production still behaves the old way — because nothing was deployed to the stage.</p>

<h3>15. WebSocket <code>$disconnect</code> is not guaranteed</h3>
<p>Network drops can skip it. Connection tables fill with dead IDs unless you TTL records and delete on 410 <code>GoneException</code>.</p>

<h3>16. Authorizer context must be flat</h3>
<p>Returning nested objects or arrays in a REST Lambda authorizer's <code>context</code> fails the authorization (500). Serialize lists into strings.</p>

<h3>17. Binary responses come back as base64 text</h3>
<p>A REST API returning a PDF from Lambda shows garbage unless <code>binaryMediaTypes</code> includes the type, the Lambda sets <code>isBase64Encoded: true</code>, and the client's <code>Accept</code> header matches. Better: return a presigned S3 URL.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — API keys as authentication</h3>
<p>Shipping an API Gateway API key inside a mobile or web app and calling it "secured". Anyone can extract and replay it. Use real authentication (JWT, IAM, Lambda authorizer) and keep API keys for metering partner usage.</p>

<h3>Anti-pattern 2 — trusting the gateway for object-level authorization</h3>
<p>The JWT authorizer proves the caller is user A; the handler then returns <code>GET /bookings/42</code> even though booking 42 belongs to user B. Gateway authentication never replaces per-object checks in code.</p>

<h3>Anti-pattern 3 — holding requests open for slow work</h3>
<p>Synchronous LLM generation, report builds or video processing behind a 29–30 s limit: works in testing, 504s under real load. Use 202 + job ID, streaming via Function URLs, or WebSocket notifications.</p>

<h3>Anti-pattern 4 — choosing the flavour by habit</h3>
<p>REST for a simple JWT-protected CRUD API pays ~3.5× per request for features you do not use; HTTP for a partner API leaves you rebuilding usage plans, validation and WAF. Decide from the feature table.</p>

<h3>Anti-pattern 5 — no route-level throttling</h3>
<p>Every route inherits the account limit, so one expensive endpoint can be hammered into overloading the database or burning LLM credits. Set per-route limits and cap Lambda concurrency behind them.</p>

<h3>Anti-pattern 6 — permissive CORS</h3>
<p>Reflecting any <code>Origin</code> with <code>Allow-Credentials: true</code>, or <code>*</code> on authenticated APIs. Allow-list origins and add <code>Vary: Origin</code>.</p>

<h3>Anti-pattern 7 — business logic in VTL</h3>
<p>Mapping templates that branch, loop and reshape payloads become untestable, unversioned logic in a template language few people know. Keep VTL to thin glue; put logic in code.</p>

<h3>Anti-pattern 8 — full data tracing left on in prod</h3>
<p>REST execution logs with request/response data logging write bearer tokens and personal data into CloudWatch. Use access logs for production; enable full tracing briefly when debugging.</p>

<h3>Anti-pattern 9 — leaking internals in errors</h3>
<p>Returning <code>err.stack</code> or raw database errors to clients. Return a stable error code and the request ID; log the details.</p>

<h3>Anti-pattern 10 — authorizers that hit a database on every call with caching off</h3>
<p>Adds a Lambda invocation plus a DB query to every request. Use JWT authorizers where possible; when you need a Lambda authorizer, cache results with a TTL matched to how quickly revocation must take effect.</p>

<h3>Anti-pattern 11 — one public URL per microservice</h3>
<p>Clients juggling a dozen <code>execute-api</code> hostnames. Put one custom domain in front and use API mappings (<code>/bookings</code>, <code>/users</code>, <code>/v2</code>).</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. REST API vs HTTP API vs WebSocket API — which do you pick?</div>
  <div class="qa-answer">
    <p>HTTP API by default for request/response APIs: cheaper (roughly $1 vs $3.50 per million at first-tier pricing), lower latency, native JWT authorizers, built-in CORS, auto-deploy. I pick REST when I need its exclusive features: API keys with usage plans and quotas for partners, request validation, response caching, WAF directly on the API, private VPC-only endpoints, edge-optimized endpoints, VTL transformations or stage canaries. WebSocket API when the server must push to clients over persistent connections — live dashboards, chat, status boards — with the caveat that connections are capped at two hours and time out after ten idle minutes.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Walk me through what happens to a request.</div>
  <div class="qa-answer">
    <p>TLS terminates at the gateway on the custom domain. On REST, WAF and the resource policy run first. Throttling checks the usage plan, method/stage limits and account limit — 429 if exceeded. The authorizer runs — IAM signature, Cognito/JWT validation, or a Lambda authorizer whose result may be cached — 401 or 403 on failure. REST then validates parameters and body against the model (400), checks the cache, and builds the integration request, either passing the whole event through (proxy) or transforming it with VTL. The backend has until the integration timeout to answer (504 otherwise); a malformed Lambda response is a 502. The response goes back with an access-log line and metrics. Everything before the integration costs the backend nothing.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. What is Lambda proxy integration, and what typically causes a 502?</div>
  <div class="qa-answer">
    <p>Proxy integration passes the full HTTP request — method, path, headers, query, body, authorizer context — to the Lambda as an event and passes the Lambda's returned object back as the HTTP response, with no mapping templates. The contract is the response shape: <code>statusCode</code>, optional headers, and a <code>body</code> string (base64 with <code>isBase64Encoded</code> for binary). A 502 almost always means the function threw an unhandled error or crashed, or returned something malformed — a body object instead of a string, a missing status code, non-string header values. REST uses payload format 1.0 and HTTP APIs default to 2.0, which differ in where the method, headers and authorizer claims live.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. How do you authenticate requests? Compare the authorizer options.</div>
  <div class="qa-answer">
    <p>For end users with Cognito or any OIDC provider, a <strong>JWT authorizer</strong> on an HTTP API: the gateway validates signature, issuer, audience/client ID, expiry and scopes itself — no Lambda, no extra cost. On REST, the <strong>Cognito user pool authorizer</strong> plays the same role. <strong>IAM auth</strong> (SigV4) for service-to-service calls and internal tools, since callers already have AWS credentials. A <strong>Lambda authorizer</strong> when the logic is custom: opaque tokens, partner keys stored hashed in a database, tenant resolution, revocation lists — with result caching to keep latency down. Whichever I use, authorization of specific objects stays in the handler.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Users report intermittent 403s that go away after a few minutes. You use a Lambda authorizer. What's happening?</div>
  <div class="qa-answer">
    <p>Classic authorizer-cache bug. The authorizer returns an IAM policy whose resource is the specific <code>methodArn</code> of the first call, and API Gateway caches that policy by token for the TTL (300 s by default on REST). The same user then calls a different route; the cached policy does not cover it, so 403 — until the cache entry expires. Fix: return a policy covering all routes the principal may call (often <code>apiId/stage/*/*</code>), and do fine-grained checks in the backend; or reduce/disable caching. I would confirm via execution logs showing the authorizer was not invoked for the failing call.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How does throttling work? Are API keys a security mechanism?</div>
  <div class="qa-answer">
    <p>Token bucket: a steady rate plus a burst capacity. Limits stack — account level per region (10,000 RPS, 5,000 burst by default, shared across all APIs), stage and route/method limits you configure, and on REST, per-client limits and quotas through usage plans tied to API keys. The most restrictive wins and the client gets 429. API keys are <em>not</em> security: they are plain identifiers for metering and throttling, easily extracted from clients. I always pair them with real authentication, and I treat gateway throttling as edge protection — the backend still needs concurrency caps and queues to protect databases.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. An endpoint generates an LLM report that takes 2–3 minutes. How do you expose it through API Gateway?</div>
  <div class="qa-answer">
    <p>Not synchronously — the integration timeout is around 29–30 seconds and the client would get a 504 while the work kept running. I return <strong>202 Accepted</strong> with a job ID and a <code>Location</code> header; the request handler writes a job row and enqueues to SQS; a worker Lambda (or Step Functions for multi-step work) does the generation and updates the row, storing the output in S3. The client polls <code>GET /reports/{id}</code> with backoff, or I push completion over a WebSocket API or a mobile push notification. If the requirement is to stream tokens as they generate, I would use a Lambda Function URL with response streaming rather than the gateway. Either way the worker is idempotent by job ID.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. The web dashboard reports CORS errors, but only on some requests, and the mobile app is fine. Why?</div>
  <div class="qa-answer">
    <p>CORS is enforced only by browsers, which is why the native app is unaffected. "Only some requests" usually means the failing ones are errors generated by API Gateway itself — 401 from the authorizer, 429 throttles, 504 timeouts — which do not carry the CORS headers my Lambda adds, so the browser reports a CORS failure instead of the real status. On REST I configure gateway responses (<code>DEFAULT_4XX</code>, <code>DEFAULT_5XX</code>) with the CORS headers, make sure <code>OPTIONS</code> is not behind the authorizer, and ensure every Lambda code path, including errors, sets the headers. On HTTP APIs, the built-in CORS configuration covers this. Then I look at the actual status in the access logs and fix that root cause.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. API Gateway vs Application Load Balancer vs Lambda Function URLs?</div>
  <div class="qa-answer">
    <p>API Gateway: per-request pricing, auth, throttling, usage plans, CORS, custom domains — the best default for serverless APIs with variable traffic. ALB: hourly plus capacity-unit pricing that becomes cheaper at high steady volume, configurable idle timeouts for longer requests, native fit for containers, but no per-client throttling and a 1 MB limit for Lambda targets. Function URLs: free beyond Lambda cost, up to the full 15-minute timeout and response streaming, but only IAM or no auth and no throttling beyond concurrency — good for webhooks, internal tools and LLM streaming, often behind CloudFront.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. How do you manage environments, versions and safe rollouts with API Gateway?</div>
  <div class="qa-answer">
    <p>Separate stages per environment at minimum, but I prefer separate AWS accounts per environment with the same IaC, so throttles and quotas are isolated too. Integrations target Lambda aliases, and Lambda deploys shift traffic gradually with CodeDeploy and alarm-based rollback. On REST, stage canaries can route a percentage to a new API deployment. For breaking API changes, I version behind one custom domain with API mappings (<code>/v1</code>, <code>/v2</code>) so old mobile app versions in the wild keep working while new ones move — important because mobile clients cannot be force-updated instantly.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. (FDE) A customer's integration with your API intermittently gets 429s and 504s during their nightly sync. What do you do?</div>
  <div class="qa-answer">
    <ol>
      <li><strong>Get the data:</strong> access logs filtered by their tenant/API key — status codes over time, latency and integration latency, request rate.</li>
      <li><strong>429s:</strong> which limit? Their usage-plan rate, a route limit, or the account limit (shared with other customers — a noisy-neighbour problem I must fix on my side). Check whether their client retries immediately, turning a spike into a storm.</li>
      <li><strong>504s:</strong> IntegrationLatency near the timeout means the backend is slow under their burst — often database contention or Lambda throttling from concurrency caps.</li>
      <li><strong>Short-term:</strong> agree a rate with them and ask for exponential backoff with jitter honouring 429; raise their plan temporarily if justified.</li>
      <li><strong>Structural:</strong> offer a bulk endpoint (accept a batch, return 202, process via SQS) so a nightly sync is a few requests instead of thousands; add per-tenant limits so one customer cannot exhaust the account budget; fix the slow query.</li>
      <li><strong>Close the loop:</strong> share a before/after chart and update the integration guide with the limits and retry policy.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Design real-time room-status updates for a fleet of wall-mounted tablets using API Gateway.</div>
  <div class="qa-answer">
    <p>A WebSocket API. On <code>$connect</code>, a Lambda authorizer validates a device token passed in the query string and returns the site ID; the connect handler stores the connection ID under that site in DynamoDB with a TTL. Booking changes emit events (a DynamoDB stream or EventBridge) to a broadcaster Lambda that queries connections for the affected site and calls <code>PostToConnection</code>, deleting IDs that return 410 Gone. Tablets heartbeat to beat the 10-minute idle timeout, reconnect with backoff (and before the 2-hour cap), and re-fetch full state over REST after every reconnect because missed pushes are not replayed. Scale concern: broadcasting to many connections per event is fan-out work — batch it, or move to a pub/sub service if fan-out grows large.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. How would you harden a public API Gateway endpoint?</div>
  <div class="qa-answer">
    <p>Default authorizer on every route with explicit, reviewed exceptions (health checks). TLS 1.2+ security policy on a custom domain, default endpoint disabled. Throttling per stage and route, per-client limits for partners, and backend concurrency caps. WAF with managed rule sets and rate-based rules (directly on REST, or CloudFront in front of HTTP APIs). Request validation where available plus schema validation in code. Object-level authorization in handlers. Least-privilege Lambda roles. Access logs with request IDs, alarms on 4xx/5xx rates and latency, no data tracing in prod, and error responses that never leak internals. For B2B, mutual TLS on the custom domain.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You choose REST vs HTTP from a feature list, and know the cost difference.</li>
    <li>You know the proxy response contract and what 401/403/429/502/504 mean at the gateway.</li>
    <li>You can explain the authorizer-cache 403 bug and the gateway-response CORS bug.</li>
    <li>You never hold requests open past the timeout — 202 + job ID, streaming, or WebSockets.</li>
    <li>You treat API keys as metering, not security, and keep object-level authorization in code.</li>
    <li>You protect downstreams with route throttles plus Lambda concurrency caps.</li>
  </ul>
</div>
` },

  ]
});
