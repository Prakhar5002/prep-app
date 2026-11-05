window.PREP_SITE.registerTopic({
  id: "cloud-aws-foundations",
  module: "cloud",
  title: "AWS Foundations & IAM",
  estimatedReadTime: "42 min",
  tags: ["aws","iam","sts","organizations","scp","vpc","security-groups","least-privilege","pricing","well-architected"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Every AWS action is a <strong>signed API call by a principal, in a region, inside an account</strong> — IAM evaluates it with <strong>default deny, explicit deny wins, cross-account needs both sides</strong>, and workloads get <strong>temporary role credentials, never long-lived keys</strong>.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Mantra:</strong> "Accounts isolate, IAM authorizes, VPCs connect, and every call is billed and logged." Debug in order: account/region → principal → which policy said no → network path.</li>
    <li><strong>Region → AZ → edge.</strong> Pick region by residency, latency, service availability, price; spread across 2+ AZs for HA; most resources are regional, IAM is global.</li>
    <li><strong>The account is the blast-radius boundary.</strong> Organizations + OUs + SCPs; management account holds no workloads; humans via IAM Identity Center.</li>
    <li><strong>Policy anatomy:</strong> Version 2012-10-17, Statement[Effect, Action, Resource, Condition], Principal only in resource/trust policies. One key's values = OR; multiple keys = AND.</li>
    <li><strong>Evaluation:</strong> explicit Deny anywhere → deny; SCP/RCP must permit; same account = identity OR resource allow; cross account = identity AND resource allow; boundaries and session policies cap.</li>
    <li><strong>Grant vs limit:</strong> identity, resource and trust policies grant; permissions boundaries, SCPs, RCPs and session policies only limit.</li>
    <li><strong>KMS key policies are authoritative</strong> — the usual cause of "S3 allows but still AccessDenied".</li>
    <li><strong>STS:</strong> AssumeRole (1h default, up to 12h, chained max 1h), AssumeRoleWithWebIdentity (OIDC: GitHub, Cognito), GetCallerIdentity first when debugging.</li>
    <li><strong>Confused deputy:</strong> ExternalId for third-party role assumption; SourceArn/SourceAccount for service principals.</li>
    <li><strong>Least privilege in practice:</strong> exact actions on exact ARNs, IaC grant helpers, per-function roles, Access Analyzer, watch <code>iam:PassRole</code>.</li>
    <li><strong>VPC:</strong> subnet = one AZ; public = IGW route; private = NAT egress; isolated = none; 5 reserved IPs per subnet; gateway endpoints for S3/DynamoDB are free.</li>
    <li><strong>SG vs NACL:</strong> SG stateful, allow-only, per ENI, can reference SGs; NACL stateless, allow+deny, per subnet, ordered.</li>
    <li><strong>Cost:</strong> compute + requests + storage + data transfer; ingress is free, egress is not; NAT per hour + per GB, cross-AZ per GB both ways, logs never expire by default. Budgets and tags on day one.</li>
    <li><strong>Well-Architected:</strong> Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, Sustainability.</li>
    <li><strong>Quotas are per account per region</strong> — check and raise them in every region you might fail over to.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Assuming one Allow is enough.</strong> Cross-account access needs the caller's identity policy <em>and</em> the resource policy to allow, an SSE-KMS bucket also needs the key policy to allow, and an SCP or explicit Deny anywhere silently overrides all of it. When debugging AccessDenied, check all four layers — principal, identity policy, resource/key policy, org guardrails — not just the one you edited.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"IAM is default-deny: an explicit deny anywhere wins, SCPs and boundaries only cap, and cross-account access needs both the caller's identity policy and the resource policy to agree."</div>
  <div class="revision-say">"Workloads never hold long-lived keys — Lambda wears an execution role, CI assumes a role through OIDC, and mobile clients get presigned URLs or Cognito identity-pool credentials."</div>
  <div class="revision-say">"For customer integrations I prefer assuming a role in their account with a per-customer ExternalId: they control one trust policy, revocation is one edit, and their CloudTrail shows exactly what we did."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What "foundations" actually covers</h3>
<p>Every AWS service you will defend in an interview sits on the same four layers. You rarely get asked "what is IAM?" directly — you get asked "your Lambda can't write to the bucket, why?" or "how would you give a customer's account access to our queue?", and the answer is always one of these layers.</p>
<table>
  <thead><tr><th>Layer</th><th>What it is</th><th>Why you care as a full-stack / FDE engineer</th></tr></thead>
  <tbody>
    <tr><td><strong>Global infrastructure</strong></td><td>Regions, AZs, edge locations</td><td>Latency for users, data-residency promises to customers, high availability design</td></tr>
    <tr><td><strong>Accounts &amp; Organizations</strong></td><td>Billing + security containers, grouped into OUs with SCP guardrails</td><td>Prod/dev isolation, per-customer deployments, "who pays for what"</td></tr>
    <tr><td><strong>IAM &amp; STS</strong></td><td>Principals, policies, roles, temporary credentials</td><td>Every <code>AccessDenied</code>, every cross-account integration, every CI deploy</td></tr>
    <tr><td><strong>Networking (VPC)</strong></td><td>Subnets, route tables, gateways, security groups, endpoints</td><td>Lambda reaching RDS, private APIs, NAT cost surprises, "it times out but no error"</td></tr>
    <tr><td><strong>Billing</strong></td><td>Per-use metering across many dimensions</td><td>Defending architecture cost; spotting the NAT / data-transfer / logging line items</td></tr>
  </tbody>
</table>

<h3>Why interviewers start here</h3>
<ul>
  <li><strong>It separates "used AWS" from "understands AWS".</strong> Clicking through the console to make an <code>AdministratorAccess</code> role is easy; explaining why a bucket policy alone is not enough when the bucket is KMS-encrypted is not.</li>
  <li><strong>FDE work is cross-account by nature.</strong> You deploy into, or integrate with, customer AWS accounts you do not control. Trust policies, ExternalId, SCPs that silently block you, and VPC endpoints are day-one problems.</li>
  <li><strong>Cost is a design constraint.</strong> "Serverless is cheap" stops being true the moment traffic hits a NAT Gateway or logs are retained forever. Senior candidates price their designs.</li>
</ul>

<h3>The shared responsibility model</h3>
<p>AWS is responsible for security <strong>of</strong> the cloud (hardware, hypervisor, facilities, the managed service software). You are responsible for security <strong>in</strong> the cloud (who can access what, how data is encrypted, how your code behaves). The line moves with how managed the service is:</p>
<table>
  <thead><tr><th>Concern</th><th>EC2 (IaaS)</th><th>RDS (managed DB)</th><th>Lambda (serverless)</th><th>S3 (managed storage)</th></tr></thead>
  <tbody>
    <tr><td>Physical / hypervisor</td><td>AWS</td><td>AWS</td><td>AWS</td><td>AWS</td></tr>
    <tr><td>OS patching</td><td><strong>You</strong></td><td>AWS</td><td>AWS</td><td>n/a</td></tr>
    <tr><td>Runtime / engine patching</td><td><strong>You</strong></td><td>AWS (you choose the maintenance window / version)</td><td>AWS for managed runtimes (you must move off deprecated runtimes)</td><td>n/a</td></tr>
    <tr><td>Network exposure</td><td><strong>You</strong> (SGs, subnets)</td><td><strong>You</strong> (SGs, public access flag)</td><td><strong>You</strong> (function URL auth, API Gateway auth, VPC)</td><td><strong>You</strong> (Block Public Access, bucket policy)</td></tr>
    <tr><td>IAM / who can access</td><td><strong>You</strong></td><td><strong>You</strong></td><td><strong>You</strong></td><td><strong>You</strong></td></tr>
    <tr><td>Data encryption choices</td><td><strong>You</strong></td><td><strong>You</strong></td><td><strong>You</strong></td><td><strong>You</strong> (SSE-S3 is default; SSE-KMS is your choice)</td></tr>
    <tr><td>Application code</td><td><strong>You</strong></td><td><strong>You</strong> (queries, schema)</td><td><strong>You</strong></td><td><strong>You</strong></td></tr>
  </tbody>
</table>
<p>Notice the bottom three rows never move: <strong>identity, data and code are always yours</strong>. That is why IAM is the foundation of every AWS conversation.</p>

<h3>When the simple setup is fine — and when it is not</h3>
<ul>
  <li><strong>Fine:</strong> a personal project in one account, one Identity Center user with MFA, a budget alarm, no long-lived keys.</li>
  <li><strong>Not fine:</strong> anything with customer data in the same account as developers' experiments. The first incident (a script run against the wrong environment, a leaked key with admin rights) costs more than setting up Organizations ever would.</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Picture 1 — the physical map</h3>
<div class="diagram">
<pre>
 AWS global
 ├── Region ap-south-1 (Mumbai)             ← you choose; most resources are regional
 │     ├── AZ aps1-az1 ─┐
 │     ├── AZ aps1-az2  ├─ separate power / cooling / network, low-ms links between them
 │     └── AZ aps1-az3 ─┘
 ├── Region us-east-1 (N. Virginia)          ← also hosts some "global" control planes
 │                                             (IAM, CloudFront certs, billing metrics)
 └── Edge locations (hundreds of PoPs)       ← CloudFront, Route 53, Global Accelerator

 Scope of common things:
   Global   : IAM users/roles/policies, Route 53 zones, CloudFront distributions
   Regional : Lambda, SQS, S3 buckets*, DynamoDB tables, API Gateway, Cognito pools, KMS keys
   Zonal    : subnets, EC2 instances, EBS volumes, a single RDS instance
   (* bucket NAMES are globally unique, but the bucket's data lives in one region)
</pre>
</div>

<h3>Picture 2 — accounts as buildings, Organizations as the campus</h3>
<div class="diagram">
<pre>
 Organization (management account: billing + org admin ONLY, no workloads)
 ├── OU: Security
 │     ├── log-archive        ← org-wide CloudTrail + Config land here, read-only for most
 │     └── security-tooling   ← GuardDuty / Security Hub delegated admin
 ├── OU: Workloads
 │     ├── OU: Prod   ── SCP: deny leaving approved regions, deny disabling CloudTrail
 │     │     └── app-prod
 │     └── OU: NonProd
 │           ├── app-staging
 │           └── app-dev
 └── OU: Sandbox      ── SCP: budget-capped experiments, no prod network access

 Humans → IAM Identity Center (SSO) → "permission set" → role in a target account
 Machines → their own role in their own account (+ cross-account assume-role if needed)
</pre>
</div>

<h3>Picture 3 — every API call is a signed request</h3>
<div class="diagram">
<pre>
 your code: s3.send(new GetObjectCommand(...))
      │  SDK finds credentials (env vars / SSO profile / role creds)
      │  signs the HTTPS request with SigV4 (access key id + secret + session token)
      ▼
 https://s3.ap-south-1.amazonaws.com/...
      │
      ├─► Authenticate: is the signature valid, are the creds unexpired?  → principal = role/ingest-worker
      ├─► Authorize:    evaluate every applicable policy (picture 4)       → Allow / Deny
      ├─► Execute:      do the work, meter it for billing
      └─► Record:       CloudTrail event (who, what, when, from where, result)
</pre>
</div>

<h3>Picture 4 — how IAM decides (simplified)</h3>
<div class="diagram">
<pre>
 Principal P calls action A on resource R
        │
        ▼
 (1) Explicit "Deny" in ANY applicable policy?  ──yes──►  DENY  (final, nothing overrides it)
        │ no
        ▼
 (2) Org SCPs (and RCPs) permit A in this account? ──no──►  DENY  (implicit)
        │ yes
        ▼
 (3) Same account : identity policy OR resource policy allows?
     Cross account: caller's identity policy AND resource's policy allow?
        │ no ────────────────────────────────────────────►  DENY  (implicit)
        │ yes
        ▼
 (4) Permissions boundary (if any) and session policy (if any) also allow?
        │ no ────────────────────────────────────────────►  DENY  (implicit)
        │ yes
        ▼
      ALLOW
</pre>
</div>
<p>The official flowchart has more nuance (for example, a resource policy that names a role <em>session</em> directly), but this version answers almost every interview and debugging question: <strong>deny beats allow, guardrails cap, and cross-account needs two yeses.</strong></p>

<h3>Three hooks that make it stick</h3>
<ul>
  <li><strong>A policy is a list of if-statements; a Deny is <code>return false</code>.</strong> Order of statements does not matter — evaluation is set logic, not top-to-bottom.</li>
  <li><strong>A role is a hat.</strong> It has no password. Anyone the role's trust policy trusts can put it on for a while (STS hands out temporary credentials) and take it off. Lambda wears its execution role; CI wears a deploy role; you wear an admin role for an hour.</li>
  <li><strong>The VPC is a floor plan inside the building.</strong> Subnets are rooms (each in one AZ), route tables are corridors, the Internet Gateway is the front door, NAT is a one-way exit, Security Groups are locks on each office door.</li>
</ul>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"I'll create an IAM user for the app and put the access key in an env file." That is a long-lived credential with no expiry and no device binding. Inside AWS, workloads should use roles (credentials appear automatically and rotate). Outside AWS, use federation: OIDC for CI, IAM Roles Anywhere for on-prem servers, Cognito for mobile clients, or a backend that hands out presigned URLs. An access key in a React Native bundle is public the moment the app ships.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. ARNs — how AWS names everything</h3>
<pre><code class="language-text">arn:partition:service:region:account-id:resource

arn:aws:lambda:ap-south-1:111111111111:function:score-call      (regional, account-scoped)
arn:aws:sqs:ap-south-1:111111111111:scoring-jobs
arn:aws:iam::111111111111:role/ingest-worker                     (IAM is global: no region)
arn:aws:s3:::call-recordings                                     (bucket: no region, no account)
arn:aws:s3:::call-recordings/tenant-42/*                         (objects inside the bucket)
arn:aws:sts::111111111111:assumed-role/ingest-worker/session-name (what CloudTrail shows)</code></pre>
<p>Two gotchas hide here: S3 bucket ARNs carry no account ID (so "allow <code>arn:aws:s3:::*</code>" means <em>every bucket on Earth</em> your principal can reach), and bucket-level actions (<code>s3:ListBucket</code>) target the bucket ARN while object actions (<code>s3:GetObject</code>) target <code>bucket/*</code>.</p>

<h3>2. Principals — who can make a call</h3>
<table>
  <thead><tr><th>Principal</th><th>Credentials</th><th>Use it for</th><th>Avoid because</th></tr></thead>
  <tbody>
    <tr><td>Root user</td><td>Email + password (+MFA)</td><td>Only the handful of root-only tasks (closing the account, some billing settings)</td><td>Unrestricted, cannot be limited by IAM policies in its own account. MFA it, no access keys, lock it away</td></tr>
    <tr><td>IAM user</td><td>Password and/or long-lived access keys</td><td>Legacy integrations that truly cannot federate</td><td>Long-lived secrets, manual rotation, sprawl</td></tr>
    <tr><td>IAM group</td><td>None (not a principal)</td><td>Attaching policies to many users</td><td>Cannot be named in a resource policy; groups cannot nest</td></tr>
    <tr><td>IAM role</td><td>Temporary STS creds via AssumeRole*</td><td>Every workload, every human (via Identity Center), cross-account access</td><td>—</td></tr>
    <tr><td>Federated identity</td><td>OIDC / SAML token exchanged for role creds</td><td>GitHub Actions, corporate SSO, Cognito identity pools</td><td>—</td></tr>
    <tr><td>Service principal</td><td>e.g. <code>lambda.amazonaws.com</code></td><td>Appears in trust and resource policies ("S3 may invoke this function")</td><td>Without SourceArn/SourceAccount conditions → confused deputy risk</td></tr>
  </tbody>
</table>

<h3>3. Policy JSON anatomy</h3>
<pre><code class="language-json">{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadTenantRecordings",
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::call-recordings/tenant-42/*",
      "Condition": {
        "Bool": { "aws:SecureTransport": "true" }
      }
    },
    {
      "Sid": "ListOnlyTenantPrefix",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::call-recordings",
      "Condition": { "StringLike": { "s3:prefix": ["tenant-42/*"] } }
    }
  ]
}</code></pre>
<ul>
  <li><strong>Version</strong> — always <code>"2012-10-17"</code> (the policy language version, not a date you update). The older version disables policy variables.</li>
  <li><strong>Effect</strong> — <code>Allow</code> or <code>Deny</code>.</li>
  <li><strong>Action / NotAction</strong> — <code>service:Operation</code>, wildcards allowed (<code>s3:Get*</code>). <code>NotAction</code> with <code>Allow</code> grants <em>everything except</em> the list — almost always a mistake. <code>NotAction</code> with <code>Deny</code> is a legitimate guardrail pattern.</li>
  <li><strong>Resource / NotResource</strong> — ARNs (wildcards allowed). Some actions do not support resource-level permissions and require <code>"*"</code> (check the service authorization reference).</li>
  <li><strong>Principal</strong> — only in <em>resource-based</em> policies and trust policies. Identity policies have no Principal (the principal is whoever the policy is attached to).</li>
  <li><strong>Condition</strong> — <code>{ operator: { key: value(s) } }</code>. Multiple values for one key = OR. Multiple keys or operators = AND. Separate statements are independent.</li>
</ul>

<h3>4. Policy types — who grants, who only limits</h3>
<table>
  <thead><tr><th>Type</th><th>Attached to</th><th>Can grant?</th><th>Typical use</th></tr></thead>
  <tbody>
    <tr><td>Identity-based (AWS managed, customer managed, inline)</td><td>User, group, role</td><td>Yes</td><td>"What can this role do?"</td></tr>
    <tr><td>Resource-based</td><td>S3 bucket, SQS queue, SNS topic, KMS key, Lambda function, Secrets Manager secret, ECR repo…</td><td>Yes, including cross-account (has a Principal)</td><td>"Who may touch this resource?"</td></tr>
    <tr><td>Trust policy</td><td>A role (a special resource policy)</td><td>Only <code>sts:AssumeRole*</code></td><td>"Who may wear this hat?"</td></tr>
    <tr><td>Permissions boundary</td><td>User or role</td><td>No — caps the maximum</td><td>Let developers create roles without escalating</td></tr>
    <tr><td>SCP (Organizations)</td><td>Root, OU or account</td><td>No — caps every principal in the account (not the management account)</td><td>Org guardrails: regions, protect audit logs</td></tr>
    <tr><td>RCP (Organizations)</td><td>Root, OU or account</td><td>No — caps access to resources in the account</td><td>Org-wide data perimeter (newer feature — check current docs for supported services)</td></tr>
    <tr><td>Session policy</td><td>Passed during AssumeRole</td><td>No — narrows that session</td><td>Scoped-down temporary creds per tenant/request</td></tr>
    <tr><td>S3 ACLs</td><td>Bucket / object</td><td>Yes (legacy)</td><td>Disable with Object Ownership "bucket owner enforced"</td></tr>
  </tbody>
</table>
<p>Prefer <strong>customer-managed</strong> policies over inline ones (reusable, versioned, visible). AWS-managed policies are good for learning what a job needs but are usually broader than least privilege.</p>

<h3>5. Evaluation in practice: same account vs cross account</h3>
<table>
  <thead><tr><th>Scenario</th><th>Identity policy</th><th>Resource policy</th><th>Result</th></tr></thead>
  <tbody>
    <tr><td>Same account</td><td>Allow</td><td>absent</td><td>Allow</td></tr>
    <tr><td>Same account</td><td>absent</td><td>Allow naming the role</td><td>Allow (union)</td></tr>
    <tr><td>Same account</td><td>Allow</td><td>Deny</td><td><strong>Deny</strong> (explicit deny wins)</td></tr>
    <tr><td>Cross account</td><td>Allow (caller's account)</td><td>absent</td><td><strong>Deny</strong> — the resource owner never agreed</td></tr>
    <tr><td>Cross account</td><td>absent</td><td>Allow naming the caller</td><td><strong>Deny</strong> — the caller's own account never granted it</td></tr>
    <tr><td>Cross account</td><td>Allow</td><td>Allow</td><td>Allow (unless an SCP, boundary or KMS key policy says no)</td></tr>
  </tbody>
</table>
<div class="callout note">
  <div class="callout-title">KMS is the exception that bites</div>
  <p>A KMS key's <strong>key policy</strong> is authoritative: if the key policy does not allow the account (or the principal) to use the key, no identity policy can make up for it. "S3 says Allow but I still get AccessDenied" on an SSE-KMS bucket is almost always a missing <code>kms:Decrypt</code> in the key policy or the caller's role.</p>
</div>

<h3>6. Condition keys worth knowing by heart</h3>
<table>
  <thead><tr><th>Key</th><th>What it checks</th><th>Classic use</th></tr></thead>
  <tbody>
    <tr><td><code>aws:PrincipalOrgID</code></td><td>Caller belongs to your Organization</td><td>"Any account in our org may read this bucket" without listing account IDs</td></tr>
    <tr><td><code>aws:SecureTransport</code></td><td>Request came over TLS</td><td>Deny plain-HTTP access to S3</td></tr>
    <tr><td><code>aws:SourceArn</code> / <code>aws:SourceAccount</code></td><td>Which resource/account a <em>service</em> is acting for</td><td>Confused-deputy protection: "S3 may invoke this Lambda, but only for my bucket"</td></tr>
    <tr><td><code>aws:SourceVpce</code> / <code>aws:SourceVpc</code></td><td>Request arrived through a VPC endpoint</td><td>"This bucket is only reachable from our VPC"</td></tr>
    <tr><td><code>aws:RequestedRegion</code></td><td>Region the call targets</td><td>SCP region lockdown</td></tr>
    <tr><td><code>aws:MultiFactorAuthPresent</code></td><td>Session was MFA-authenticated</td><td>Require MFA for destructive actions</td></tr>
    <tr><td><code>aws:PrincipalTag</code> / <code>aws:ResourceTag</code> / <code>aws:RequestTag</code></td><td>Tags on caller / resource / request</td><td>ABAC: access when the team tags match</td></tr>
    <tr><td><code>sts:ExternalId</code></td><td>Shared secret-ish value in AssumeRole</td><td>Third-party SaaS assuming a role in a customer account</td></tr>
  </tbody>
</table>

<h3>7. STS and temporary credentials</h3>
<p>STS (Security Token Service) turns "I am allowed to be X" into three values: <code>AccessKeyId</code>, <code>SecretAccessKey</code>, <code>SessionToken</code>, with an expiry. The APIs you should be able to name:</p>
<ul>
  <li><strong>AssumeRole</strong> — an AWS principal becomes a role (same or cross account). Default session 1 hour; the role's max session duration can be raised to 12 hours. <strong>Role chaining</strong> (a role assuming another role) is capped at 1 hour.</li>
  <li><strong>AssumeRoleWithWebIdentity</strong> — exchange an OIDC token (GitHub Actions, EKS service accounts, Cognito identity pools, Google) for role credentials.</li>
  <li><strong>AssumeRoleWithSAML</strong> — corporate IdP federation.</li>
  <li><strong>GetCallerIdentity</strong> — "who am I?" Requires no permissions; the first command of every debugging session.</li>
</ul>
<pre><code class="language-bash"># Who am I right now (account, ARN)?
aws sts get-caller-identity

# Assume a read-only role in the prod account for one hour
aws sts assume-role \\
  --role-arn arn:aws:iam::222222222222:role/ProdReadOnly \\
  --role-session-name prakhar-debug \\
  --duration-seconds 3600

# Better: let the CLI assume it for you via ~/.aws/config
#   [profile prod-ro]
#   role_arn       = arn:aws:iam::222222222222:role/ProdReadOnly
#   source_profile = sso-dev
aws s3 ls --profile prod-ro

# Humans: IAM Identity Center (successor to "AWS SSO")
aws configure sso            # one-time: start URL, SSO region, account, permission set
aws sso login --profile dev  # opens the browser, caches short-lived creds</code></pre>

<h3>8. How code finds credentials (SDK v3)</h3>
<p>The JavaScript SDK walks a default provider chain, roughly: environment variables → shared config/credentials files (including SSO profiles) → web-identity token file → container credentials (ECS/EKS) → EC2 instance metadata. In Lambda, the execution role's temporary credentials are injected as <code>AWS_ACCESS_KEY_ID</code> / <code>AWS_SECRET_ACCESS_KEY</code> / <code>AWS_SESSION_TOKEN</code> environment variables, which is why <code>new S3Client({})</code> "just works".</p>
<pre><code class="language-ts">import { S3Client } from '@aws-sdk/client-s3';
import { fromTemporaryCredentials } from '@aws-sdk/credential-providers';

// Inside Lambda / ECS / EC2: no keys anywhere — the default chain finds the role.
export const s3 = new S3Client({});

// Cross-account: assume a role that lives in the CUSTOMER's account.
// The provider caches the creds and refreshes them before they expire.
export const customerS3 = new S3Client({
  region: 'ap-south-1',
  credentials: fromTemporaryCredentials({
    params: {
      RoleArn: process.env.CUSTOMER_ROLE_ARN!,
      RoleSessionName: 'recording-ingest',
      ExternalId: process.env.CUSTOMER_EXTERNAL_ID, // agreed with the customer
      DurationSeconds: 3600,
    },
  }),
});</code></pre>
<p>On EC2, enforce <strong>IMDSv2</strong> (session-token-based metadata access). IMDSv1 let a server-side request forgery (SSRF) bug fetch the instance role's credentials with a single GET — the root cause of several well-known breaches.</p>

<h3>9. Least privilege, operationally</h3>
<ol>
  <li>Start from the job: list the exact API calls the code makes (the SDK commands you import are a good inventory).</li>
  <li>Scope resources to ARNs and prefixes, never <code>"*"</code> unless the action requires it.</li>
  <li>Add conditions where cheap: TLS, org ID, source VPC endpoint, tags.</li>
  <li>Use IaC "grant" helpers (CDK <code>bucket.grantRead(fn)</code>) so policies are generated, reviewed in diffs and deleted with the stack.</li>
  <li>Verify with <strong>IAM Access Analyzer</strong>: policy validation, external-access findings (what is shared outside your account/org), unused-access findings, and policy generation from CloudTrail activity.</li>
  <li>Watch for privilege-escalation actions: <code>iam:PassRole</code>, <code>iam:CreatePolicyVersion</code>, <code>iam:AttachRolePolicy</code>, <code>iam:PutRolePolicy</code>, <code>lambda:UpdateFunctionCode</code> on a function with a powerful role.</li>
</ol>

<h3>10. VPC basics</h3>
<div class="diagram">
<pre>
 VPC 10.0.0.0/16 (one region)
 ┌───────────────────────────────────────────────────────────────────┐
 │            AZ-a                              AZ-b                 │
 │  public   10.0.0.0/24  [ALB] [NAT]   public   10.0.1.0/24  [ALB]  │ ── 0.0.0.0/0 → Internet Gateway
 │  private  10.0.10.0/24 [Lambda ENIs] private  10.0.11.0/24 [ECS]  │ ── 0.0.0.0/0 → NAT Gateway
 │  isolated 10.0.20.0/24 [RDS primary] isolated 10.0.21.0/24 [RDS standby] ── no internet route
 │                                                                   │
 │  S3 / DynamoDB gateway endpoints attached to private route tables │ ── free, no NAT needed
 │  Interface endpoints (PrivateLink) for SQS, Secrets Manager, ...  │ ── hourly + per-GB
 └───────────────────────────────────────────────────────────────────┘
</pre>
</div>
<ul>
  <li><strong>CIDR:</strong> a VPC block between /16 and /28. Plan non-overlapping ranges up front — you cannot peer or connect VPCs whose CIDRs overlap (a real problem when integrating with a customer network).</li>
  <li><strong>Subnet = one AZ.</strong> AWS reserves 5 IPs in every subnet (first four and the last). Spread every tier across at least two AZs.</li>
  <li><strong>Public subnet</strong> = route table sends <code>0.0.0.0/0</code> to an Internet Gateway and resources have public IPs. <strong>Private subnet</strong> = outbound via a NAT Gateway (which sits in a public subnet). <strong>Isolated</strong> = no route out at all (databases).</li>
  <li><strong>VPC endpoints</strong> keep AWS API traffic off the internet: <em>gateway endpoints</em> (S3, DynamoDB only; free, route-table based) and <em>interface endpoints</em> (PrivateLink ENIs for most other services; billed per hour per AZ plus per GB).</li>
  <li><strong>Lambda in a VPC</strong> gets ENIs in your private subnets (AWS uses shared "Hyperplane" ENIs, so the old multi-second cold-start penalty is largely gone). It then has <em>no internet and no AWS API access</em> unless you add a NAT Gateway or endpoints. Only put Lambda in a VPC when it must reach VPC-only resources (RDS, ElastiCache).</li>
</ul>
<table>
  <thead><tr><th></th><th>Security Group</th><th>Network ACL</th></tr></thead>
  <tbody>
    <tr><td>Attached to</td><td>Network interface (instance, Lambda ENI, RDS, ALB)</td><td>Subnet</td></tr>
    <tr><td>State</td><td><strong>Stateful</strong> — return traffic automatically allowed</td><td><strong>Stateless</strong> — must allow return traffic (ephemeral ports 1024–65535) explicitly</td></tr>
    <tr><td>Rules</td><td>Allow only</td><td>Allow and Deny, numbered, first match wins</td></tr>
    <tr><td>Can reference</td><td>Other security groups ("allow 5432 from the Lambda SG")</td><td>CIDR ranges only</td></tr>
    <tr><td>Default</td><td>Deny all inbound, allow all outbound</td><td>Default NACL allows all</td></tr>
    <tr><td>Use for</td><td>Almost everything</td><td>Coarse subnet-level blocks (e.g. block a hostile CIDR)</td></tr>
  </tbody>
</table>

<h3>11. Pricing mental model</h3>
<table>
  <thead><tr><th>Dimension</th><th>Examples</th><th>Gotcha</th></tr></thead>
  <tbody>
    <tr><td>Compute time</td><td>Lambda GB-seconds, EC2/Fargate per second, RDS instance hours</td><td>Always-on things (RDS, NAT, provisioned concurrency) bill even at zero traffic</td></tr>
    <tr><td>Requests</td><td>API Gateway per million, S3 per 1,000 PUT/GET, SQS per million</td><td>Chatty designs (polling, tiny messages) multiply request cost</td></tr>
    <tr><td>Storage</td><td>S3 GB-month, EBS GB-month, CloudWatch Logs storage</td><td>Log groups default to "never expire"</td></tr>
    <tr><td>Data transfer</td><td>Internet egress per GB; cross-AZ per GB each direction; cross-region per GB</td><td>Ingress is free; egress is not. A chatty service talking across AZs pays twice</td></tr>
    <tr><td>Networking</td><td>NAT Gateway per hour + per GB processed; public IPv4 per hour; interface endpoints per hour</td><td>Routing S3 traffic through NAT instead of a free gateway endpoint</td></tr>
  </tbody>
</table>
<p>Rough us-east-1 numbers at time of writing (check current pricing): a NAT Gateway is about $0.045/hour plus about $0.045 per GB processed, so three NAT Gateways (one per AZ) cost roughly $100/month before a single byte flows. Cross-AZ transfer is about $0.01/GB in each direction. Public IPv4 addresses are billed per hour (about $0.005). Internet egress is tiered per GB after a monthly free allowance.</p>
<p>Controls: <strong>AWS Budgets</strong> with alerts on day one, <strong>cost allocation tags</strong> (<code>app</code>, <code>env</code>, <code>tenant</code>) activated in Billing, <strong>Cost Explorer</strong> grouped by service and usage type, and <strong>Savings Plans</strong> once a baseline is stable.</p>

<h3>12. Service quotas</h3>
<p>Almost every resource has a per-account, per-region quota. Most are <em>soft</em> (raise via Service Quotas; takes hours to days), some are <em>hard</em> (Lambda's 15-minute timeout). Examples you will meet: Lambda concurrent executions (1,000 by default per region; new accounts can start lower), API Gateway account throttle, VPCs per region, Elastic IPs. Check before a launch, not during it.</p>
<pre><code class="language-bash">aws service-quotas list-service-quotas --service-code lambda \\
  --query "Quotas[].{name:QuotaName,value:Value,adjustable:Adjustable}" --output table</code></pre>

<h3>13. The Well-Architected Framework</h3>
<table>
  <thead><tr><th>Pillar</th><th>The question an interviewer is really asking</th><th>Concrete practice</th></tr></thead>
  <tbody>
    <tr><td>Operational Excellence</td><td>How do you deploy, observe and recover?</td><td>IaC, small reversible deploys, runbooks, alarms on symptoms</td></tr>
    <tr><td>Security</td><td>Who can do what, and how would you know?</td><td>Least privilege, no long-lived keys, encryption, CloudTrail, GuardDuty</td></tr>
    <tr><td>Reliability</td><td>What happens when an AZ or dependency fails?</td><td>Multi-AZ, retries with backoff, DLQs, quotas checked, backups tested</td></tr>
    <tr><td>Performance Efficiency</td><td>Is the right resource type and size in use?</td><td>Right-size memory, caching, managed services, load testing</td></tr>
    <tr><td>Cost Optimization</td><td>Do you know what it costs and why?</td><td>Tags, budgets, lifecycle policies, Graviton, Savings Plans</td></tr>
    <tr><td>Sustainability</td><td>Are you wasting resources?</td><td>Scale to zero, efficient regions/instances, delete idle resources</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — least-privilege execution role, generated by CDK</h3>
<p>An upload-processing Lambda reads new recordings from one prefix and enqueues scoring jobs. With CDK "grant" helpers the policy is generated and scoped for you:</p>
<pre><code class="language-ts">import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

const recordings = new s3.Bucket(this, 'Recordings', {
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  enforceSSL: true,                         // adds a Deny for aws:SecureTransport=false
  encryption: s3.BucketEncryption.S3_MANAGED,
});
const jobs = new sqs.Queue(this, 'ScoringJobs');

const processor = new NodejsFunction(this, 'Processor', { entry: 'src/processor.ts' });
recordings.grantRead(processor, 'incoming/*');   // object reads only under incoming/
jobs.grantSendMessages(processor);               // SendMessage + the metadata calls it needs</code></pre>
<p>Roughly what lands on the execution role (exact action lists vary by CDK version):</p>
<pre><code class="language-json">{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject*", "s3:GetBucket*", "s3:List*"],
      "Resource": [
        "arn:aws:s3:::recordings-bucket-abc123",
        "arn:aws:s3:::recordings-bucket-abc123/incoming/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["sqs:SendMessage", "sqs:GetQueueAttributes", "sqs:GetQueueUrl"],
      "Resource": "arn:aws:sqs:ap-south-1:111111111111:ScoringJobs"
    }
  ]
}</code></pre>
<p>And the trust policy that lets Lambda wear the role (CDK writes this too):</p>
<pre><code class="language-json">{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "lambda.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}</code></pre>

<h3>Example 2 — cross-account read of a KMS-encrypted bucket</h3>
<p>Your worker role in account <strong>A (111111111111)</strong> must read recordings from a customer bucket in account <strong>B (222222222222)</strong> encrypted with SSE-KMS. Three policies must line up:</p>
<pre><code class="language-json">// (1) Account A — identity policy on role/recording-ingest
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::acme-call-recordings/*" },
    { "Effect": "Allow", "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::acme-call-recordings" },
    { "Effect": "Allow", "Action": "kms:Decrypt",
      "Resource": "arn:aws:kms:ap-south-1:222222222222:key/1111aaaa-22bb-33cc-44dd-555555eeeeee" }
  ]
}

// (2) Account B — bucket policy on acme-call-recordings
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "VendorIngestRead",
    "Effect": "Allow",
    "Principal": { "AWS": "arn:aws:iam::111111111111:role/recording-ingest" },
    "Action": ["s3:GetObject", "s3:ListBucket"],
    "Resource": ["arn:aws:s3:::acme-call-recordings", "arn:aws:s3:::acme-call-recordings/*"]
  }]
}

// (3) Account B — statement added to the KMS KEY policy
{
  "Sid": "VendorIngestDecrypt",
  "Effect": "Allow",
  "Principal": { "AWS": "arn:aws:iam::111111111111:role/recording-ingest" },
  "Action": "kms:Decrypt",
  "Resource": "*"
}</code></pre>
<p>Missing any one of the three → <code>AccessDenied</code>. An alternative that customers often prefer is <strong>role assumption</strong>: account B creates a role your account may assume (with an ExternalId), and grants that role access locally. Comparison:</p>
<table>
  <thead><tr><th></th><th>Resource-policy approach</th><th>Assume-a-role-in-their-account approach</th></tr></thead>
  <tbody>
    <tr><td>Who controls access</td><td>Split: their bucket + key policy, your role</td><td>Entirely the customer (one trust policy + their own role policy)</td></tr>
    <tr><td>Works for services without resource policies</td><td>No</td><td>Yes (anything the role can do)</td></tr>
    <tr><td>Audit trail in their CloudTrail</td><td>Your role ARN</td><td>Their role, with your session name</td></tr>
    <tr><td>Revocation</td><td>Edit two or three policies</td><td>Delete or edit one trust policy</td></tr>
    <tr><td>Object ownership of things you WRITE</td><td>Can be messy with ACLs enabled</td><td>Clean: objects are written by their own role</td></tr>
  </tbody>
</table>

<h3>Example 3 — third-party role with ExternalId (confused-deputy safe)</h3>
<p>Trust policy the customer creates in <em>their</em> account so your SaaS can assume it:</p>
<pre><code class="language-json">{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "AWS": "arn:aws:iam::111111111111:role/vendor-integration" },
    "Action": "sts:AssumeRole",
    "Condition": {
      "StringEquals": { "sts:ExternalId": "acme-7f3c9b2e" }
    }
  }]
}</code></pre>
<p>Your platform generates a unique ExternalId per customer and stores it. Without it, any other customer of yours could type <em>Acme's</em> role ARN into your UI and your platform (the "deputy") would happily assume it on their behalf.</p>

<h3>Example 4 — GitHub Actions deploys with OIDC, no stored keys</h3>
<pre><code class="language-json">{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::111111111111:oidc-provider/token.actions.githubusercontent.com"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
      "StringLike":   { "token.actions.githubusercontent.com:sub": "repo:acme-org/call-scoring:ref:refs/heads/main" }
    }
  }]
}</code></pre>
<pre><code class="language-yaml"># .github/workflows/deploy.yml (excerpt)
permissions:
  id-token: write      # lets the job request an OIDC token
  contents: read
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::111111111111:role/gha-deploy
          aws-region: ap-south-1
      - run: npx cdk deploy --require-approval never</code></pre>
<p>The <code>sub</code> condition is the security boundary: without it, <em>any</em> repository on GitHub could assume your deploy role. See <a href="#/topic/cloud-cicd">CI/CD &amp; Infrastructure as Code</a> for the full pipeline.</p>

<h3>Example 5 — SCP guardrails for the prod OU</h3>
<pre><code class="language-json">{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyOutsideApprovedRegions",
      "Effect": "Deny",
      "NotAction": ["iam:*", "organizations:*", "sts:*", "cloudfront:*", "route53:*", "support:*", "budgets:*"],
      "Resource": "*",
      "Condition": { "StringNotEquals": { "aws:RequestedRegion": ["ap-south-1", "us-east-1"] } }
    },
    {
      "Sid": "ProtectAuditTrail",
      "Effect": "Deny",
      "Action": ["cloudtrail:StopLogging", "cloudtrail:DeleteTrail", "cloudtrail:UpdateTrail"],
      "Resource": "*"
    },
    {
      "Sid": "NoLeavingTheOrg",
      "Effect": "Deny",
      "Action": "organizations:LeaveOrganization",
      "Resource": "*"
    }
  ]
}</code></pre>
<p>Note <code>Deny</code> + <code>NotAction</code>: "deny everything except global services outside these regions". The exempt list must include global services whose calls are routed through us-east-1, otherwise IAM and CloudFront break. SCPs never grant — accounts still need identity policies.</p>

<h3>Example 6 — ABAC: one policy for every team</h3>
<pre><code class="language-json">{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["secretsmanager:GetSecretValue"],
    "Resource": "*",
    "Condition": {
      "StringEquals": { "aws:ResourceTag/team": "&#36;{aws:PrincipalTag/team}" }
    }
  }]
}</code></pre>
<p>Callers tagged <code>team=scoring</code> can read secrets tagged <code>team=scoring</code>. New teams need tags, not new policies. The trade-off: whoever can change tags can change access, so lock down <code>TagResource</code> / <code>UntagResource</code>.</p>

<h3>Example 7 — permissions boundary so developers can create roles safely</h3>
<pre><code class="language-json">{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CreateRolesOnlyWithBoundary",
      "Effect": "Allow",
      "Action": ["iam:CreateRole", "iam:PutRolePolicy", "iam:AttachRolePolicy"],
      "Resource": "arn:aws:iam::111111111111:role/app-*",
      "Condition": {
        "StringEquals": { "iam:PermissionsBoundary": "arn:aws:iam::111111111111:policy/AppBoundary" }
      }
    },
    {
      "Sid": "PassOnlyAppRoles",
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "arn:aws:iam::111111111111:role/app-*"
    }
  ]
}</code></pre>
<p>Any role a developer creates is capped by <code>AppBoundary</code>, so they cannot mint themselves an admin role. Restricting <code>iam:PassRole</code> closes the other escalation path (creating a Lambda that runs as a powerful existing role).</p>

<h3>Example 8 — debugging AccessDenied, step by step</h3>
<pre><code class="language-bash"># 1. Which principal is the code ACTUALLY using? (wrong profile/role is the #1 cause)
aws sts get-caller-identity

# 2. Simulate the identity side (does not evaluate resource policies or SCPs fully)
aws iam simulate-principal-policy \\
  --policy-source-arn arn:aws:iam::111111111111:role/recording-ingest \\
  --action-names s3:GetObject kms:Decrypt \\
  --resource-arns arn:aws:s3:::acme-call-recordings/tenant-42/call-1.wav

# 3. Find the failing call in CloudTrail (errorCode AccessDenied, which ARN, which action)
aws cloudtrail lookup-events \\
  --lookup-attributes AttributeKey=EventName,AttributeValue=GetObject \\
  --max-results 20

# 4. Some services return an encoded reason — decode it
aws sts decode-authorization-message --encoded-message "PASTE_MESSAGE_HERE"</code></pre>
<p>Read the error text carefully: many services now say <em>which</em> policy type denied ("... because no identity-based policy allows...", "... with an explicit deny in a service control policy"). That one phrase tells you which of the four layers to fix.</p>

<h3>Example 9 — VPC for Lambda + RDS without paying NAT for S3</h3>
<pre><code class="language-ts">import * as ec2 from 'aws-cdk-lib/aws-ec2';

const vpc = new ec2.Vpc(this, 'Vpc', {
  maxAzs: 2,
  natGateways: 1,   // cost vs resilience: 1 NAT = single-AZ egress dependency
  subnetConfiguration: [
    { name: 'public',  subnetType: ec2.SubnetType.PUBLIC,              cidrMask: 24 },
    { name: 'app',     subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, cidrMask: 24 },
    { name: 'db',      subnetType: ec2.SubnetType.PRIVATE_ISOLATED,    cidrMask: 24 },
  ],
  gatewayEndpoints: {
    S3: { service: ec2.GatewayVpcEndpointAwsService.S3 },   // free; keeps S3 traffic off NAT
  },
});

const lambdaSg = new ec2.SecurityGroup(this, 'LambdaSg', { vpc });
const dbSg = new ec2.SecurityGroup(this, 'DbSg', { vpc, allowAllOutbound: false });
dbSg.addIngressRule(lambdaSg, ec2.Port.tcp(5432), 'Postgres from the Lambda SG only');</code></pre>
<p>Referencing a security group instead of a CIDR means "any ENI wearing <code>lambdaSg</code>", which keeps working as Lambda's ENIs come and go. See <a href="#/topic/cloud-rds">RDS (+ Aurora)</a> for the RDS Proxy piece.</p>

<h3>Example 10 — where is the money going?</h3>
<pre><code class="language-bash">aws ce get-cost-and-usage \\
  --time-period Start=2026-10-01,End=2026-11-01 \\
  --granularity MONTHLY \\
  --metrics UnblendedCost \\
  --group-by Type=DIMENSION,Key=SERVICE

# Then drill into usage types for the top service, e.g. "NatGateway-Bytes", "DataTransfer-Regional-Bytes"
aws ce get-cost-and-usage \\
  --time-period Start=2026-10-01,End=2026-11-01 \\
  --granularity MONTHLY --metrics UnblendedCost \\
  --filter '{"Dimensions":{"Key":"SERVICE","Values":["Amazon Elastic Compute Cloud - Compute","EC2 - Other"]}}' \\
  --group-by Type=DIMENSION,Key=USAGE_TYPE</code></pre>
<p>NAT Gateway and data transfer usually hide under "EC2 - Other", which is why people miss them.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. AZ names are shuffled per account</h3>
<p><code>us-east-1a</code> in your account may be a different physical AZ from <code>us-east-1a</code> in the customer's account. When coordinating cross-account (latency-sensitive peering, capacity), use AZ IDs (<code>use1-az1</code>).</p>

<h3>2. IAM is eventually consistent</h3>
<p>A role or policy created a moment ago may not be usable everywhere yet. Classic symptom: a deploy that creates a role and immediately a Lambda fails with "The role defined for the function cannot be assumed by Lambda". IaC tools retry; scripts need a short wait-and-retry.</p>

<h3>3. Deleting and recreating a role breaks resource policies</h3>
<p>Resource policies store the role's unique internal ID. Delete <code>role/recording-ingest</code> and recreate it with the same name, and the customer's bucket policy shows an <code>AROA...</code> ID instead of the ARN and no longer matches. The customer must re-save their policy.</p>

<h3>4. SCPs do not apply to the management account</h3>
<p>Nor to service-linked roles. Another reason to keep workloads out of the management account entirely.</p>

<h3>5. <code>Allow</code> + <code>NotAction</code> is a wide-open door</h3>
<p><code>{"Effect":"Allow","NotAction":"iam:*","Resource":"*"}</code> grants every action in every current <em>and future</em> service except IAM. Fine for a "PowerUser" pattern, catastrophic by accident.</p>

<h3>6. <code>ForAllValues</code> is true on an empty set</h3>
<p><code>ForAllValues:StringEquals</code> on a multi-valued key that is absent from the request evaluates to true. Pair it with a <code>Null</code> condition check, or use <code>ForAnyValue</code> when that is what you mean.</p>

<h3>7. <code>aws:SourceIp</code> does not see VPC endpoint traffic</h3>
<p>Requests through a VPC endpoint carry private IPs, so an IP allow-list silently fails. Use <code>aws:SourceVpce</code> / <code>aws:SourceVpc</code>. Calls that an AWS service makes on your behalf also do not carry your IP.</p>

<h3>8. The KMS key policy can veto everything</h3>
<p>Bucket policy allows, role allows, still denied → check the key policy and grants. Also, the default SSE-S3 encryption avoids this entirely for cases where you do not need customer-managed keys.</p>

<h3>9. Role chaining caps sessions at one hour</h3>
<p>A Lambda (already a role) assuming a customer role is role chaining. Even if the target role allows 12 hours, the session lasts at most 1 hour — long-running jobs must refresh (the SDK's <code>fromTemporaryCredentials</code> provider does this).</p>

<h3>10. "Global" services still live somewhere</h3>
<p>IAM's control plane, CloudFront's ACM certificates and billing metrics live in us-east-1. An SCP that blocks us-east-1 can break IAM changes; a CloudFront certificate requested in Mumbai will not appear in the distribution dropdown.</p>

<h3>11. Cross-AZ traffic is billed — in both directions</h3>
<p>A service in AZ-a calling a cache in AZ-b pays per GB each way. At high volume, AZ-aware routing or co-location matters. (High availability still wins over saving cents; just know the cost exists.)</p>

<h3>12. The default VPC has public subnets</h3>
<p>Every region ships a default VPC whose subnets auto-assign public IPs. Launching a database "quickly" there with a <code>0.0.0.0/0</code> security group rule is how databases end up on Shodan.</p>

<h3>13. NACLs are stateless</h3>
<p>Allowing inbound 443 on a NACL but forgetting outbound ephemeral ports (1024–65535) produces timeouts that look exactly like an application bug.</p>

<h3>14. Lambda in a VPC loses the internet</h3>
<p>Attach a function to private subnets and calls to third-party APIs or to AWS services (SQS, Secrets Manager) hang until timeout. Add a NAT Gateway or the relevant VPC endpoints — or reconsider whether the function needs the VPC at all.</p>

<h3>15. Quotas are per region</h3>
<p>Raising Lambda concurrency in ap-south-1 does nothing for your DR region. Pre-raise quotas in every region you would fail over to.</p>

<h3>16. Overlapping CIDRs block integrations</h3>
<p>If your VPC is <code>10.0.0.0/16</code> and the customer's is too, peering and Transit Gateway routing will not work. PrivateLink (exposing a service through an endpoint) sidesteps overlap and is the usual answer for vendor-to-customer connectivity.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — long-lived access keys in code, env files or apps</h3>
<p>Keys in a <code>.env</code> committed by accident, in a CI secret that never rotates, or — worst — inside a React Native bundle, where anyone can extract them with standard tooling. Fix: roles inside AWS, OIDC for CI, Cognito identity pools or backend-issued presigned URLs for mobile clients (see <a href="#/topic/cloud-s3">S3</a> and <a href="#/topic/cloud-cognito">Cognito</a>).</p>

<h3>Anti-pattern 2 — <code>"Action": "*", "Resource": "*"</code> on a workload role</h3>
<p>"We'll tighten it later" never happens. A code-injection bug in that Lambda now owns the account. Start narrow; widen with evidence from CloudTrail and Access Analyzer.</p>

<h3>Anti-pattern 3 — one account for everything</h3>
<p>Dev experiments, staging and prod customer data sharing one account means one leaked credential or one wrong <code>--profile</code> touches everything, and quotas are shared (a load test can throttle prod Lambdas).</p>

<h3>Anti-pattern 4 — using the root user day to day</h3>
<p>Root cannot be restricted by IAM in its own account. Enable MFA, delete root access keys, and use it only for root-only tasks.</p>

<h3>Anti-pattern 5 — shared IAM users</h3>
<p>"deploy-user" whose password five people know: no accountability in CloudTrail, no way to revoke one person. Use Identity Center with individual identities.</p>

<h3>Anti-pattern 6 — trust policies that trust too much</h3>
<p><code>"Principal": {"AWS": "*"}</code> without conditions, an OIDC trust without a <code>sub</code> condition, or trusting a whole account root when only one role needs access. The trust policy is the role's front door — review it like a firewall rule.</p>

<h3>Anti-pattern 7 — <code>iam:PassRole</code> on <code>"*"</code></h3>
<p>Lets a principal launch compute (Lambda, EC2, ECS task) running as <em>any</em> role, including admin ones. A classic privilege-escalation path in pentest reports.</p>

<h3>Anti-pattern 8 — <code>0.0.0.0/0</code> on database or SSH ports</h3>
<p>Security groups that open 5432/3306/22 to the world "temporarily". Use SG-to-SG references, SSM Session Manager instead of SSH, and keep databases in isolated subnets.</p>

<h3>Anti-pattern 9 — paying NAT for AWS traffic</h3>
<p>Private-subnet workloads pulling gigabytes from S3 through a NAT Gateway pay per GB processed. A free S3 gateway endpoint removes the line item.</p>

<h3>Anti-pattern 10 — no budget, no tags</h3>
<p>The first time anyone looks at cost is when the invoice arrives. Set a budget alarm on day one and tag resources by app, environment and (for SaaS) tenant.</p>

<h3>Anti-pattern 11 — CloudTrail off, or deletable by workload accounts</h3>
<p>Without an org-wide trail delivered to a locked-down log-archive account, incident response is guesswork — and an attacker's first move is to stop logging.</p>

<h3>Anti-pattern 12 — hard-coded account IDs and regions</h3>
<p>Strings like <code>arn:aws:sqs:us-east-1:1111...</code> scattered through code break the moment you add a staging account or a second region. Derive ARNs from IaC outputs or environment variables.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. Explain regions, Availability Zones and edge locations. How do you choose a region?</div>
  <div class="qa-answer">
    <p>A region is an independent geographic area (Mumbai, N. Virginia) with its own copies of services; most resources are regional. Each region has multiple AZs — physically separate data-centre groups with independent power and networking, connected by low-latency links — so you get high availability by spreading across two or more AZs in one region. Edge locations are a much larger set of points of presence used by CloudFront, Route 53 and Global Accelerator to serve and route traffic close to users.</p>
    <p>I choose a region by: data-residency or compliance requirements first (a customer contract may require in-country data), then latency to users, then service and feature availability (not every service or instance type launches everywhere), then price (it varies by region).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. IAM user vs group vs role vs policy — what's the difference, and which do you use for a Lambda?</div>
  <div class="qa-answer">
    <p>A <strong>user</strong> is a long-lived identity with a password and/or access keys. A <strong>group</strong> is just a bag of users for attaching policies — it is not a principal. A <strong>role</strong> is an identity with no long-term credentials; trusted principals assume it and get temporary STS credentials. A <strong>policy</strong> is the JSON document that grants or denies permissions, attached to an identity or a resource.</p>
    <p>A Lambda always uses a role — its <em>execution role</em>, whose trust policy allows <code>lambda.amazonaws.com</code> to assume it. The runtime injects the temporary credentials as environment variables and the SDK picks them up automatically. Humans should also use roles, via IAM Identity Center.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Walk me through how AWS decides whether a request is allowed.</div>
  <div class="qa-answer">
    <p>Default is deny. AWS gathers every applicable policy. If any contains an explicit Deny that matches, the answer is Deny — nothing overrides it. Then the organization's SCPs (and RCPs) must permit the action for that account. Then there must be an Allow: in the same account, either the identity policy or the resource policy is enough; across accounts, both the caller's identity policy and the resource's policy must allow. Finally, any permissions boundary or session policy must also allow it. So: <em>explicit deny wins, guardrails cap, and cross-account needs two yeses</em>. KMS adds a twist — the key policy must allow use of the key regardless.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Identity-based vs resource-based policies — when do you need a resource policy?</div>
  <div class="qa-answer">
    <p>Identity policies say what a principal can do; resource policies say who can touch a resource and include a <code>Principal</code>. Within one account, an identity policy is usually enough. You need a resource policy when (a) access is cross-account and you want the caller to use its own identity rather than assume a role, (b) an AWS service needs to act on the resource — S3 invoking a Lambda, SNS sending to SQS, EventBridge targeting a function — because services have no identity policy of their own, or (c) you want a resource-side guardrail such as "deny any request not over TLS" or "deny anything not from our org".</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. What is STS AssumeRole, and how do credentials end up in a Lambda?</div>
  <div class="qa-answer">
    <p>AssumeRole exchanges a trusted principal's identity for temporary credentials of a role: access key ID, secret and session token, default one hour (configurable up to 12 hours; chained roles max one hour). The role's trust policy decides who may call it. For Lambda, the service assumes the execution role on your behalf and puts the credentials in <code>AWS_ACCESS_KEY_ID</code>, <code>AWS_SECRET_ACCESS_KEY</code> and <code>AWS_SESSION_TOKEN</code>; the SDK's default provider chain reads them. Nothing is stored in code, and they rotate automatically. Variants: AssumeRoleWithWebIdentity for OIDC (GitHub Actions, Cognito identity pools) and AssumeRoleWithSAML for corporate SSO.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. What is the confused deputy problem, and how does AWS mitigate it?</div>
  <div class="qa-answer">
    <p>A confused deputy is a privileged party tricked into using its privileges for someone else. Two AWS forms: (1) <strong>third-party SaaS</strong> — your platform assumes roles in customer accounts; a malicious customer gives you <em>another</em> customer's role ARN. Mitigation: the customer's trust policy requires an <code>sts:ExternalId</code> that your platform generates uniquely per customer and never lets the customer choose. (2) <strong>Service principals</strong> — "S3 may invoke my function" without saying which bucket means someone else's bucket could trigger it. Mitigation: <code>aws:SourceArn</code> / <code>aws:SourceAccount</code> conditions in the resource policy.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How would you structure AWS accounts for a growing SaaS startup?</div>
  <div class="qa-answer">
    <p>AWS Organizations with a management account used only for billing and org administration. A Security OU with a log-archive account (org-wide CloudTrail and Config) and a security-tooling account. A Workloads OU split into Prod and NonProd, with separate accounts for prod, staging and dev — or per workload if teams are independent. A Sandbox OU with budget limits. SCPs on Prod to deny unapproved regions, deny disabling CloudTrail/GuardDuty, deny leaving the org. Humans sign in via IAM Identity Center with permission sets; CI deploys through OIDC roles per account. For enterprise customers demanding isolation, a dedicated account per customer is a supported pattern — the account becomes the tenant boundary.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Security group vs NACL?</div>
  <div class="qa-answer">
    <p>Security groups attach to network interfaces, are stateful (return traffic is automatically allowed), support only allow rules, and can reference other security groups. NACLs attach to subnets, are stateless (you must allow return traffic on ephemeral ports), support allow and deny, and are evaluated in rule-number order. I use security groups for almost everything — especially SG-to-SG references like "Postgres only from the Lambda SG" — and NACLs only for coarse subnet-level blocks.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. A Lambda in a private subnet must read from RDS, write to S3 and call a third-party HTTPS API. What networking do you need?</div>
  <div class="qa-answer">
    <p>RDS: same VPC, the RDS security group allows the DB port from the Lambda's security group. S3: a gateway VPC endpoint on the private route tables — free, and traffic stays on the AWS network. Third-party API: outbound internet requires a NAT Gateway in a public subnet (one per AZ for resilience, or one to save cost with a single-AZ dependency) and a <code>0.0.0.0/0</code> route to it from the private subnets. If it also calls Secrets Manager or SQS, either route through NAT or add interface endpoints (cost per hour per AZ — worth it at volume or for compliance). And I would question whether the function needs the VPC at all if RDS were not involved.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. How do you actually implement least privilege, not just say it?</div>
  <div class="qa-answer">
    <p>Inventory the API calls the code makes, grant exactly those actions on exact ARNs or prefixes, and add cheap conditions (TLS, org ID, VPC endpoint). Generate policies from IaC grant helpers so they are reviewed in pull requests and deleted with the stack. Use separate roles per function rather than one shared "backend role". Then verify continuously: IAM Access Analyzer for external-access and unused-access findings, CloudTrail-based policy generation to trim, permissions boundaries so developers cannot escalate, SCPs for org-wide limits. And watch the escalation-capable actions — <code>iam:PassRole</code>, policy-editing actions, and code updates on functions with powerful roles.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. (FDE) A customer says "your integration gets AccessDenied reading our recordings bucket, but we added your role to the bucket policy." What do you do?</div>
  <div class="qa-answer">
    <ol>
      <li><strong>Confirm the principal:</strong> log <code>sts get-caller-identity</code> from the worker — is it the role ARN they allowed, or a chained session or a different environment's role?</li>
      <li><strong>Get the exact error:</strong> the message often names the denying policy type (no identity-based policy, explicit deny in an SCP, resource policy).</li>
      <li><strong>Check our side:</strong> cross-account needs our identity policy to allow <code>s3:GetObject</code> on <em>their</em> bucket ARN too.</li>
      <li><strong>Check encryption:</strong> if the bucket uses SSE-KMS, their key policy must allow our role <code>kms:Decrypt</code>, and our role needs it as well.</li>
      <li><strong>Check their guardrails:</strong> an SCP or bucket policy deny on <code>aws:PrincipalOrgID</code> or <code>aws:SourceVpce</code> will block any outside principal regardless of the allow.</li>
      <li><strong>Check object ownership:</strong> if objects were uploaded by a third party with ACLs enabled, the bucket owner may not even own them.</li>
      <li><strong>Propose the durable fix:</strong> often switch to "assume a role in your account with an ExternalId" — one trust policy for them to manage, clean audit trail, easy revocation. Then write it down as a one-page setup guide so the next customer onboards without a call.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Our AWS bill doubled this month. Where do you look first?</div>
  <div class="qa-answer">
    <p>Cost Explorer grouped by service, then by usage type for the top movers, compared with the previous month. Usual suspects in serverless stacks: NAT Gateway bytes (hidden under "EC2 - Other"), data transfer (cross-AZ or internet egress, e.g. serving large files without CloudFront), CloudWatch Logs ingestion from verbose logging, a runaway retry loop or recursive trigger multiplying Lambda invocations, forgotten provisioned concurrency or RDS instances in a dev account, and unexpired S3 versions. Then fix the process: budgets with alerts, cost allocation tags so the next spike is attributable to an app and environment, and anomaly detection.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Our React Native app needs to upload files to S3. Can we ship an access key in the app with a tight policy?</div>
  <div class="qa-answer">
    <p>No. Anything in the bundle is public — the key would be extracted and used outside the app, never expires, and cannot be revoked per user. Two good options: (1) the backend authenticates the user and returns a short-lived <strong>presigned URL</strong> scoped to one object key and content type; the app PUTs directly to S3. (2) A <strong>Cognito identity pool</strong> exchanges the user's login token for temporary, per-user role credentials, with a policy using the identity ID as a prefix variable so each user can only write to their own folder. I default to presigned URLs because the server stays in control of keys, size and type.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You say "explicit deny wins" and "cross-account needs both sides" without prompting.</li>
    <li>You reach for roles and STS, never long-lived keys, for workloads, CI and mobile.</li>
    <li>You know KMS key policies can veto an otherwise-allowed S3 read.</li>
    <li>You can write a trust policy and an identity policy from memory and explain each element.</li>
    <li>You name ExternalId and SourceArn/SourceAccount as confused-deputy mitigations.</li>
    <li>You design multi-account with SCP guardrails and Identity Center.</li>
    <li>You can price a design: NAT, cross-AZ, egress, logs.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Write a Lambda execution role's trust policy and a least-privilege S3 identity policy with a condition.</div>
  <div class="qa-answer">
    <p>The trust policy says who may assume the role; for Lambda the principal is the service:</p>
    <pre><code class="language-json">{ "Version": "2012-10-17",
  "Statement": [{ "Effect": "Allow",
    "Principal": { "Service": "lambda.amazonaws.com" },
    "Action": "sts:AssumeRole" }] }</code></pre>
    <p>The identity policy grants exact actions on exact ARNs, with cheap conditions:</p>
    <pre><code class="language-json">{ "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::call-recordings/tenant-42/*",
      "Condition": { "Bool": { "aws:SecureTransport": "true" } } },
    { "Effect": "Allow", "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::call-recordings",
      "Condition": { "StringLike": { "s3:prefix": ["tenant-42/*"] } } } ] }</code></pre>
    <p>Note that object actions target <code>bucket/prefix/*</code> while <code>ListBucket</code> targets the bucket ARN and is narrowed with <code>s3:prefix</code>. Within one condition key, multiple values are OR; multiple keys are AND. In practice I generate these with IaC grant helpers (e.g. CDK <code>grantRead(fn, 'incoming/*')</code>) so they are reviewed in PRs.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q15. What does that NAT Gateway cost, and how do you keep the bill down?</div>
  <div class="qa-answer">
    <p>Rough us-east-1 numbers at time of writing (check current pricing): about $0.045/hour per NAT Gateway plus about $0.045 per GB processed, so three NAT Gateways, one per AZ, cost roughly $100/month before a single byte flows. Running one NAT saves money but adds a single-AZ dependency. The biggest avoidable cost is routing AWS traffic through NAT: add a free S3 (or DynamoDB) gateway endpoint so S3 reads don't pay per-GB processing, and consider interface endpoints (billed per hour per AZ plus per GB) for services like Secrets Manager or SQS at volume. And question whether the function needs to be in a VPC at all if it doesn't talk to RDS.</p>
  </div>
</div>
` },

  ]
});
