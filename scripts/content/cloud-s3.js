window.PREP_SITE.registerTopic({
  id: "cloud-s3",
  module: "cloud",
  title: "S3",
  estimatedReadTime: "40 min",
  tags: ["aws","s3","object-storage","presigned-url","multipart-upload","cloudfront","iam","bucket-policy","lifecycle","encryption","event-notifications"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">S3 is a <strong>durable key-to-blob store, not a filesystem or database</strong>. Clients upload directly with short-lived presigned URLs for server-chosen keys, the bucket stays private behind CloudFront, lifecycle rules control cost, and S3 events feed SQS for idempotent async processing.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Model:</strong> bucket (regional, globally-unique name) → object (key, bytes up to 5 TB, metadata). Folders are only prefixes. No append, rename or locks. It is not a filesystem, database or CDN, but it is the AWS default for uploads, static assets, backups, logs, ML datasets and recordings.</li>
    <li><strong>Strong read-after-write</strong> for PUT, DELETE and LIST since Dec 2020. Concurrent writes are last-writer-wins unless you use unique keys or conditional writes (<code>If-None-Match</code>, <code>If-Match</code>).</li>
    <li><strong>Presigned URLs:</strong> a local SigV4 signature, valid up to 7 days but dead when the signing credentials expire. They carry the signer's permissions, can't be revoked individually, and signed headers (Content-Type) must match exactly.</li>
    <li><strong>PUT vs POST:</strong> PUT is simple, mobile-friendly and works per part for multipart, but can't enforce size. POST has a policy with <code>content-length-range</code> and suits browser forms.</li>
    <li><strong>Why presigned:</strong> the bytes never pass through API Gateway (10 MB payload cap) or Lambda (6 MB sync payload cap), so compute stays tiny and S3 absorbs the bandwidth.</li>
    <li><strong>Upload flow:</strong> API authorises → server-generated key → pending DB row → short URL → client PUT → HEAD/confirm → S3 event → SQS → idempotent worker validates magic bytes → <code>ready</code>.</li>
    <li><strong>Multipart:</strong> parts of 5 MiB to 5 GiB, at most 10,000 parts, required above 5 GB, recommended from about 100 MB. Always add the <code>AbortIncompleteMultipartUpload</code> lifecycle rule. Multipart ETag is not MD5.</li>
    <li><strong>Access:</strong> same account needs an identity OR bucket policy Allow; cross account needs both. Explicit Deny always wins. ACLs are disabled by default. Block Public Access goes on at account level.</li>
    <li><strong>ARN split:</strong> object actions use <code>bucket/*</code>, ListBucket uses <code>bucket</code>. Without ListBucket, a missing key returns 403, not 404.</li>
    <li><strong>Encryption:</strong> SSE-S3 is the default. SSE-KMS gives audit and revocation but every request becomes a KMS call, so enable Bucket Keys and grant <code>kms:Decrypt</code> to readers. Enforce TLS with <code>aws:SecureTransport</code>.</li>
    <li><strong>Versioning:</strong> can't be turned off, only suspended. Deletes add markers and old versions keep billing, so add noncurrent expiration. Object Lock gives WORM retention.</li>
    <li><strong>Storage classes</strong> have minimum durations (IA 30 days, Glacier IR and Flexible 90, Deep Archive 180), retrieval fees, and small-object penalties. Glacier Flexible and Deep Archive need a restore job.</li>
    <li><strong>Events:</strong> at-least-once, unordered (use <code>sequencer</code> per key), URL-encoded keys, an <code>s3:TestEvent</code> on setup. Use prefix filters to avoid recursion.</li>
    <li><strong>CloudFront + OAC</strong> for reads: S3 to CloudFront transfer is free, cheaper egress, caching, signed cookies for private content. Use hashed filenames instead of invalidations.</li>
    <li><strong>Performance:</strong> at least 3,500 writes and 5,500 reads per second per prefix, with automatic re-partitioning (503 SlowDown means back off and spread prefixes).</li>
    <li><strong>Cost:</strong> egress usually dominates storage, then requests. Lifecycle tiering and CloudFront are the levers.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Treating the presigned URL as the security boundary and trusting what the client uploads.</strong> The client picks the key, declares its own size and type, and the URL lives for days, which leads to overwritten files, oversized objects and leaked bearer links. Fix: the server chooses the key under the user's prefix, URLs expire in minutes, and you validate after upload (HEAD for size, magic bytes in the worker). Store the key, never the URL.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Clients never stream files through my API. The API authorises, picks the key and returns a five-minute presigned URL; the client uploads straight to S3, and an S3 event through SQS drives idempotent post-processing."</div>
  <div class="revision-say">"The bucket stays private with Block Public Access. Reads go through CloudFront with Origin Access Control, and per-user content uses signed cookies, which caches well and keeps egress cheap."</div>
  <div class="revision-say">"S3 events are at-least-once and unordered, so my consumer is idempotent on key plus ETag, and SQS in between gives me buffering, a DLQ and concurrency control."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What S3 actually is</h3>
<p>S3 (Simple Storage Service) is a regional, managed <strong>object store</strong> exposed over HTTPS. Every operation is an HTTP request such as <code>PUT /key</code>, <code>GET /key</code>, <code>HEAD /key</code>, <code>DELETE /key</code> or <code>GET /?list-type=2&amp;prefix=…</code>, signed with AWS Signature Version 4. The SDK and CLI are wrappers around those requests.</p>
<ul>
  <li><strong>Bucket</strong>: a container that lives in one region. The name is globally unique, 3 to 63 characters, lowercase, and DNS-compatible. Bucket names are visible in URLs, so don't put customer names in them.</li>
  <li><strong>Object</strong>: key (up to 1,024 bytes of UTF-8), data (0 bytes to 5 TB), system metadata (Content-Type, ETag, size, storage class), user metadata (<code>x-amz-meta-*</code>, about 2 KB), tags (up to 10, used for lifecycle and access conditions), and a version ID when versioning is on.</li>
  <li><strong>Key</strong>: an opaque string. <code>uploads/u_42/9f1c.jpg</code> is one flat key. The console draws folders by splitting on <code>/</code>, and the LIST API can group by a delimiter, but no directory object exists.</li>
</ul>

<h3>Why everyone uses it</h3>
<ul>
  <li><strong>Durability:</strong> designed for 99.999999999% (11 nines) durability. Standard-class data is stored across at least three Availability Zones.</li>
  <li><strong>No capacity planning:</strong> no disk to size and no servers. It scales to effectively unlimited objects, and you pay per GB-month, per request and per GB transferred out.</li>
  <li><strong>Integration hub:</strong> Lambda, Athena, Glue, CloudFront, Transcribe, Bedrock knowledge bases, RDS exports, CloudTrail and ALB logs all read from or write to S3.</li>
  <li><strong>Security model:</strong> IAM, bucket policies, KMS encryption, VPC endpoints, access logs and CloudTrail data events give you audit-grade control.</li>
</ul>

<h3>What S3 is NOT (the misuse list interviewers love)</h3>
<table>
  <thead><tr><th>Mistaken use</th><th>Why it breaks</th><th>Use instead</th></tr></thead>
  <tbody>
    <tr><td>A database</td><td>No queries, no secondary indexes, no partial updates. LIST is paginated (1,000 keys per page) and slow on huge prefixes.</td><td>Keep metadata (owner, status, size, key) in RDS or DynamoDB and the bytes in S3.</td></tr>
    <tr><td>A filesystem</td><td>No append (outside S3 Express One Zone), no rename (rename = copy + delete), no file locks, no partial overwrite.</td><td>EFS or EBS for POSIX workloads. Treat S3 objects as immutable.</td></tr>
    <tr><td>A CDN</td><td>Requests go to one region, first-byte latency is tens of ms, internet egress is expensive, and the website endpoint is HTTP only.</td><td>CloudFront in front of a private bucket.</td></tr>
    <tr><td>A message queue</td><td>Polling LIST for "new files" is slow and costly, and you miss nothing only if your logic is perfect.</td><td>S3 event notifications into SQS or EventBridge.</td></tr>
    <tr><td>A low-latency KV cache</td><td>Per-request latency and per-request pricing don't suit tiny hot objects.</td><td>ElastiCache or DynamoDB. S3 Express One Zone if you need very fast object access in one AZ.</td></tr>
  </tbody>
</table>

<h3>S3 vs the other AWS storage</h3>
<table>
  <thead><tr><th></th><th>S3</th><th>EBS</th><th>EFS</th></tr></thead>
  <tbody>
    <tr><td>Type</td><td>Object (HTTP API)</td><td>Block volume (one instance)</td><td>Shared NFS filesystem</td></tr>
    <tr><td>Access from Lambda</td><td>SDK calls</td><td>Not attachable</td><td>Mountable (VPC)</td></tr>
    <tr><td>Scale</td><td>Unlimited</td><td>Volume size</td><td>Elastic</td></tr>
    <tr><td>Typical use</td><td>Uploads, assets, backups, data lake</td><td>DB disks, OS volumes</td><td>Shared files for containers</td></tr>
    <tr><td>Price shape</td><td>Cheapest per GB + requests + egress</td><td>Provisioned GB (+IOPS)</td><td>Most expensive per GB</td></tr>
  </tbody>
</table>

<h3>Where it shows up in a typical mobile + serverless stack</h3>
<p>Picture an RN app with a support-ticket feature. Users attach photos, PDFs and screen recordings. A good design looks like this:</p>
<ul>
  <li>The app asks the API for an upload slot. A Lambda behind <a href="#/topic/cloud-api-gateway">API Gateway</a> checks the <a href="#/topic/cloud-cognito">Cognito</a> JWT, picks the key <code>tickets/&lt;ticketId&gt;/&lt;uuid&gt;.jpg</code>, and returns a presigned PUT URL that expires in a few minutes.</li>
  <li>The app uploads straight to S3, then the bucket's ObjectCreated event lands in an <a href="#/topic/cloud-sqs">SQS</a> queue. A worker Lambda validates the file type, generates a thumbnail, and marks the attachment <code>ready</code> in <a href="#/topic/cloud-rds">RDS</a>.</li>
  <li>Agents view attachments through CloudFront signed URLs, or presigned GETs for low-volume admin screens.</li>
  <li>A lifecycle rule deletes orphaned uploads after a day and moves old attachments to Standard-IA after 30 days.</li>
</ul>
<p>The same shape scales to the call-recording pipeline in <a href="#/topic/cloud-serverless-case">Case Study: Serverless on AWS</a>.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Picture 1: a giant, durable hash map with an HTTP front door</h3>
<div class="diagram">
<pre>
 bucket: acme-media-prod  (region ap-south-1)
 ┌─────────────────────────────────────────────────────────────┐
 │ key                                   → value (+ metadata)  │
 │ uploads/u_42/9f1c.jpg                 → 2.1 MB  image/jpeg  │
 │ uploads/u_42/9f1c.jpg  (version v2)   → 2.3 MB  (if versioned)
 │ thumbs/u_42/9f1c_256.jpg              → 18 KB               │
 │ recordings/2026/11/05/call_88.wav     → 41 MB  STANDARD_IA  │
 └─────────────────────────────────────────────────────────────┘
   "uploads/" is NOT a directory. It is the first 8 characters of some keys.
</pre>
</div>

<h3>Picture 2: the presigned upload flow (the one you'll draw in every interview)</h3>
<div class="diagram">
<pre>
  RN / web client         Your API (Lambda)              S3                 SQS → worker Lambda
  ───────────────         ─────────────────              ──                 ───────────────────
  POST /uploads  ───────► verify JWT, validate type/size
  {type, size}            key = server-chosen UUID
                          INSERT attachment(status=pending)
                          sign PUT URL (expires 5 min)
  ◄─────────── { url, key, headers }
  PUT url  (bytes) ─────────────────────────────────────► stores object
                                                          emits ObjectCreated ──► message
  POST /uploads/:key/complete ─► HEAD object (size, type)                         validate, thumbnail,
                                 status=uploaded                                   status=ready (idempotent)
</pre>
</div>
<p>The bytes skip your compute entirely. Your API spends a few milliseconds signing, and S3 absorbs the bandwidth. Signing is a local HMAC computation with the API's credentials. Creating a presigned URL makes no network call to S3 and does not check that the key or bucket exists.</p>

<h3>Picture 3: how an access decision is made</h3>
<div class="diagram">
<pre>
 request (principal, action, bucket/key, conditions)
     │
     ├─ Explicit Deny in ANY applicable policy (SCP, identity, bucket, endpoint)? ──► DENY
     │
     ├─ Block Public Access blocks this public grant? ─────────────────────────────► DENY
     │
     ├─ Same account:  identity policy Allow  OR  bucket policy Allow ─────────────► ALLOW
     ├─ Cross account: identity policy Allow  AND bucket policy Allow ─────────────► ALLOW
     │
     └─ otherwise ──────────────────────────────────────────────────────────────────► DENY (implicit)
   (ACLs: disabled by default on new buckets, "Bucket owner enforced". Leave them off.)
</pre>
</div>
<p>The general IAM evaluation logic (SCPs, permission boundaries, session policies) is in <a href="#/topic/cloud-aws-foundations">AWS Foundations &amp; IAM</a>. For S3, remember two things. Same-account access needs only one Allow, from the identity policy or the bucket policy. Cross-account access needs both.</p>

<h3>Picture 4: three dials on every bucket</h3>
<table>
  <thead><tr><th>Dial</th><th>Question it answers</th><th>Controls</th></tr></thead>
  <tbody>
    <tr><td><strong>Who</strong></td><td>Who may read or write which keys?</td><td>IAM policies, bucket policy, Block Public Access, access points, VPC endpoint policies, presigned URLs</td></tr>
    <tr><td><strong>How protected</strong></td><td>What if someone deletes, overwrites or steals data?</td><td>SSE-S3 or SSE-KMS, TLS-only policy, versioning, Object Lock, replication, MFA delete</td></tr>
    <tr><td><strong>How long / how cheap</strong></td><td>What happens to data over time?</td><td>Storage classes, lifecycle transitions and expirations, Intelligent-Tiering</td></tr>
  </tbody>
</table>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"To show user images in the app I'll make the bucket public." No. Keep the bucket private. Serve through CloudFront with Origin Access Control: CloudFront is the only principal allowed to read, so you get caching, HTTPS, a custom domain and lower egress cost. Add CloudFront signed URLs or cookies if the content is per-user. Public buckets are the classic data-leak headline, and Block Public Access exists to stop them.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. Keys, prefixes and request-rate scaling</h3>
<ul>
  <li>S3 supports at least <strong>3,500 PUT/COPY/POST/DELETE and 5,500 GET/HEAD requests per second per partitioned prefix</strong>. It partitions by key prefix automatically as load grows. A sudden spike can return <code>503 SlowDown</code> while it re-partitions, so retry with exponential backoff (the SDK does this).</li>
  <li>To spread very hot workloads, include a high-cardinality component early in the key (tenant ID, user ID, a hash). The old advice to add random hash prefixes for every bucket is outdated, since partitioning is automatic, but key design still matters at extreme rates.</li>
  <li>Design keys for <strong>lifecycle and IAM</strong>, not for browsing. <code>tmp/</code>, <code>uploads/</code>, <code>thumbs/</code> and <code>recordings/</code> become lifecycle filters, IAM resource ARNs and event filters.</li>
</ul>

<h3>2. Consistency and concurrency</h3>
<ul>
  <li><strong>Strong read-after-write</strong> (since Dec 2020): after a successful PUT or DELETE, any GET, HEAD or LIST reflects it. Older material about "eventual consistency for overwrites" is out of date.</li>
  <li><strong>No locking.</strong> Two clients PUT the same key at once and the later one wins, silently. With versioning on, both versions are kept.</li>
  <li><strong>Conditional writes</strong> (added 2024, check that your SDK version supports them): <code>IfNoneMatch: '*'</code> on PutObject fails with <code>412 Precondition Failed</code> if the key exists, which gives create-only semantics. <code>IfMatch: &lt;etag&gt;</code> gives optimistic concurrency for overwrites.</li>
  <li>The simplest fix is still to <strong>never overwrite</strong>: generate a new key (UUID) per upload and keep the "current" pointer in your database.</li>
</ul>

<h3>3. Storage classes</h3>
<table>
  <thead><tr><th>Class</th><th>For</th><th>Min storage duration</th><th>Retrieval</th><th>AZs</th></tr></thead>
  <tbody>
    <tr><td>Standard</td><td>Hot data, default</td><td>none</td><td>ms, no fee</td><td>≥3</td></tr>
    <tr><td>Intelligent-Tiering</td><td>Unknown or changing access patterns</td><td>none (small monitoring fee per object; objects under 128 KB are not auto-tiered)</td><td>ms for frequent/infrequent tiers</td><td>≥3</td></tr>
    <tr><td>Standard-IA</td><td>Infrequent but needs fast access</td><td>30 days, 128 KB min billable size</td><td>ms, per-GB fee</td><td>≥3</td></tr>
    <tr><td>One Zone-IA</td><td>Re-creatable infrequent data</td><td>30 days, 128 KB min</td><td>ms, per-GB fee</td><td>1</td></tr>
    <tr><td>Glacier Instant Retrieval</td><td>Archive read maybe quarterly, needs ms access</td><td>90 days</td><td>ms, higher per-GB fee</td><td>≥3</td></tr>
    <tr><td>Glacier Flexible Retrieval</td><td>Archives, restore in minutes to hours</td><td>90 days</td><td>Restore job: expedited (minutes), standard (hours), bulk (hours)</td><td>≥3</td></tr>
    <tr><td>Glacier Deep Archive</td><td>Compliance archives</td><td>180 days</td><td>Restore within about 12 hours (standard) or about 48 hours (bulk)</td><td>≥3</td></tr>
    <tr><td>Express One Zone</td><td>Very low latency, high request rate, one AZ ("directory buckets")</td><td>none</td><td>single-digit ms</td><td>1</td></tr>
  </tbody>
</table>
<p>Deleting or transitioning an object before its minimum duration still bills the remaining days. Glacier Flexible and Deep Archive also add about 40 KB of per-object overhead (index plus metadata), which makes millions of tiny objects expensive to archive. Bundle small files (tar or zip) before archiving. Durations and fees drift, so check current AWS docs.</p>

<h3>4. Lifecycle rules</h3>
<p>Rules are filtered by prefix, tag or size and run asynchronously, typically once a day. They can:</p>
<ul>
  <li><strong>Transition</strong> current or noncurrent versions to colder classes after N days.</li>
  <li><strong>Expire</strong> current versions (in a versioned bucket this adds a delete marker), permanently delete noncurrent versions after N days, and clean up expired delete markers.</li>
  <li><strong>Abort incomplete multipart uploads</strong> after N days. Put this on every bucket: uploaded parts are billed even though you can't see them in a normal listing.</li>
</ul>
<pre><code class="language-json">{
  "Rules": [
    {
      "ID": "expire-tmp-uploads",
      "Filter": { "Prefix": "tmp/" },
      "Status": "Enabled",
      "Expiration": { "Days": 1 }
    },
    {
      "ID": "abort-stale-multipart",
      "Filter": {},
      "Status": "Enabled",
      "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 7 }
    },
    {
      "ID": "recordings-tiering",
      "Filter": { "Prefix": "recordings/" },
      "Status": "Enabled",
      "Transitions": [
        { "Days": 30,  "StorageClass": "STANDARD_IA" },
        { "Days": 180, "StorageClass": "GLACIER" }
      ],
      "NoncurrentVersionExpiration": { "NoncurrentDays": 30 }
    }
  ]
}</code></pre>
<pre><code class="language-bash">aws s3api put-bucket-lifecycle-configuration \\
  --bucket acme-media-prod \\
  --lifecycle-configuration file://lifecycle.json</code></pre>

<h3>5. Access control: identity policy, bucket policy, ACLs, Block Public Access</h3>
<ul>
  <li><strong>Identity (IAM) policy</strong> is attached to a role or user and says "this principal may do X on these buckets". Use it for your own Lambdas and services.</li>
  <li><strong>Bucket policy</strong> is a resource policy on the bucket that says "these principals may do X here". Use it for cross-account access, service principals (CloudFront, S3 log delivery), and guardrails that apply to everyone, such as "deny non-TLS" or "deny unless from this VPC endpoint".</li>
  <li><strong>ACLs</strong> are legacy. New buckets default to Object Ownership = <em>Bucket owner enforced</em>, which disables ACLs. Leave it that way.</li>
  <li><strong>Block Public Access</strong> has four switches (BlockPublicAcls, IgnorePublicAcls, BlockPublicPolicy, RestrictPublicBuckets). They can be set per bucket and per account, and override any public grant. They are on by default for new buckets. Turn them on at the account level too.</li>
  <li><strong>Access points</strong> are named endpoints with their own policies, handy when a shared data bucket serves many apps with different permissions.</li>
</ul>
<p>The least-privilege policy for an API Lambda that only signs uploads and verifies them looks like this:</p>
<pre><code class="language-json">{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SignUploadsAndVerify",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::acme-media-prod/uploads/*"
    },
    {
      "Sid": "ListOnlyUploadsPrefix",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::acme-media-prod",
      "Condition": { "StringLike": { "s3:prefix": ["uploads/*"] } }
    }
  ]
}</code></pre>
<div class="callout warn">
  <div class="callout-title">The ARN gotcha everyone hits once</div>
  <p>Object actions (<code>s3:GetObject</code>, <code>s3:PutObject</code>, <code>s3:DeleteObject</code>) use the object ARN <code>arn:aws:s3:::bucket/*</code>. Bucket actions (<code>s3:ListBucket</code>, <code>s3:GetBucketLocation</code>) use the bucket ARN <code>arn:aws:s3:::bucket</code> with no <code>/*</code>. Mix them up and you get AccessDenied with a policy that "looks right". Also, without <code>s3:ListBucket</code>, a GET for a missing key returns <strong>403, not 404</strong>. S3 won't tell you a key doesn't exist unless you're allowed to list.</p>
</div>
<p>A presigned URL carries the <strong>signer's</strong> permissions. If the Lambda that signed the URL lacks <code>s3:PutObject</code> on that key, the URL is created without complaint and then fails with 403 when the client uses it.</p>

<h3>6. Encryption</h3>
<table>
  <thead><tr><th>Option</th><th>Keys managed by</th><th>When</th><th>Gotchas</th></tr></thead>
  <tbody>
    <tr><td><strong>SSE-S3</strong> (default since Jan 2023)</td><td>S3</td><td>Baseline for everything</td><td>No per-key audit or revocation</td></tr>
    <tr><td><strong>SSE-KMS</strong></td><td>KMS key (AWS-managed or customer-managed)</td><td>Compliance, CloudTrail audit of every decrypt, revoke access by key policy</td><td>Every GET/PUT calls KMS: cost plus KMS request quotas. Readers need <code>kms:Decrypt</code> too. Turn on <strong>S3 Bucket Keys</strong> to cut KMS calls dramatically.</td></tr>
    <tr><td>DSSE-KMS</td><td>KMS, two layers</td><td>Specific compliance regimes that require dual-layer encryption</td><td>Extra cost</td></tr>
    <tr><td>SSE-C</td><td>You send the key on every request</td><td>Rare; you manage keys outside AWS</td><td>Lose the key, lose the data. Presigning gets awkward.</td></tr>
    <tr><td>Client-side</td><td>You</td><td>Zero-trust of the provider</td><td>You own key management and can't use server-side processing</td></tr>
  </tbody>
</table>
<p>In transit, enforce TLS with a bucket policy that denies <code>aws:SecureTransport = false</code> (shown in Examples). Encryption at rest does not replace access control. A principal with <code>s3:GetObject</code> and <code>kms:Decrypt</code> gets plaintext.</p>

<h3>7. Versioning, delete markers, Object Lock</h3>
<ul>
  <li>A bucket starts <strong>unversioned</strong>. Once you enable versioning you can only <em>suspend</em> it; you can never return to unversioned.</li>
  <li>With versioning, an overwrite creates a new version, and a DELETE without a version ID adds a <strong>delete marker</strong> (the object looks gone, but older versions remain and still cost money). Deleting a specific version ID is permanent.</li>
  <li>This protects against accidental deletes, buggy overwrites and ransomware-style wipes. Pair it with a <code>NoncurrentVersionExpiration</code> rule or the bill keeps growing.</li>
  <li><strong>Object Lock</strong> (WORM, which requires versioning) has governance mode and compliance mode, plus legal holds. Use it for regulatory retention such as call recordings in financial services. In compliance mode, not even the root user can delete before the retention date.</li>
  <li><strong>Replication</strong> (cross-region CRR or same-region SRR) needs versioning on both buckets and applies to new objects. Existing objects need S3 Batch Replication.</li>
</ul>

<h3>8. Presigned URLs in depth</h3>
<p>A presigned URL is a normal S3 request URL with the SigV4 signature in the query string (<code>X-Amz-Algorithm</code>, <code>X-Amz-Credential</code>, <code>X-Amz-Date</code>, <code>X-Amz-Expires</code>, <code>X-Amz-SignedHeaders</code>, <code>X-Amz-Signature</code>, plus <code>X-Amz-Security-Token</code> when signed with temporary credentials). Anyone holding the URL can perform that one operation on that one key until it expires.</p>
<ul>
  <li><strong>Expiry:</strong> up to 7 days with SigV4. The URL also dies when the <em>signing credentials</em> expire. A URL signed by a Lambda role's temporary credentials can stop working well before its <code>expiresIn</code>. Keep upload URLs short-lived anyway: 5 to 15 minutes.</li>
  <li><strong>Signed headers:</strong> if you include <code>ContentType</code> when signing, the client must send exactly that <code>Content-Type</code> header or S3 returns <code>SignatureDoesNotMatch</code>.</li>
  <li><strong>PUT vs POST:</strong> a presigned PUT can't enforce a size range. A presigned POST (<code>@aws-sdk/s3-presigned-post</code>) carries a policy document with conditions such as <code>content-length-range</code> and <code>starts-with $Content-Type image/</code>, which S3 enforces.</li>
  <li><strong>Revocation:</strong> you can't revoke a single URL. You can delete the signer's access key or revoke the role's sessions, or add a bucket-policy deny on <code>s3:signatureAge</code>. That's why short expiry matters.</li>
</ul>
<table>
  <thead><tr><th></th><th>Presigned PUT</th><th>Presigned POST</th></tr></thead>
  <tbody>
    <tr><td>Client request</td><td><code>PUT url</code> with raw body</td><td><code>multipart/form-data</code> with fields + file</td></tr>
    <tr><td>Enforce max size</td><td>No (verify after upload)</td><td>Yes, <code>content-length-range</code></td></tr>
    <tr><td>Enforce content type</td><td>Exact match if signed</td><td>Exact or <code>starts-with</code></td></tr>
    <tr><td>Multipart (huge files)</td><td>Yes, presign each <code>UploadPart</code></td><td>No (single request, up to 5 GB)</td></tr>
    <tr><td>Best for</td><td>Mobile apps (simple binary PUT), large files</td><td>Browser forms, strict size limits</td></tr>
  </tbody>
</table>

<h3>9. Multipart upload</h3>
<ul>
  <li>The API sequence is <code>CreateMultipartUpload</code> → <code>UploadPart</code> × N (parallel, any order) → <code>CompleteMultipartUpload</code> with the list of <code>{PartNumber, ETag}</code>. Call <code>AbortMultipartUpload</code> on failure.</li>
  <li>Parts are 5 MiB to 5 GiB (the last part can be smaller), with at most 10,000 parts. A single PUT is capped at 5 GB, so anything larger <em>must</em> be multipart. AWS recommends multipart from about 100 MB.</li>
  <li>The benefits are parallel throughput, retrying one failed part instead of the whole file, and resume after an app restart if you keep the UploadId and completed ETags.</li>
  <li>The ETag of a multipart object is <strong>not</strong> the MD5 of the file. It is a hash of the part hashes plus <code>-N</code>. Don't use ETag as a content hash; use the additional checksum algorithms (CRC32, CRC32C, SHA-256 and others) when you need integrity checks.</li>
  <li>In Node, <code>@aws-sdk/lib-storage</code>'s <code>Upload</code> class handles chunking, concurrency and abort for server-side uploads and streams.</li>
</ul>

<h3>10. Event notifications</h3>
<ul>
  <li>Targets: SQS, SNS, Lambda, or EventBridge (one bucket-level switch sends <em>all</em> events to the default bus, where rules do richer filtering).</li>
  <li>Native notification filters only match a key prefix and a key suffix, and overlapping rules for the same event type are rejected. Use EventBridge for anything fancier.</li>
  <li>Semantics: <strong>at-least-once</strong>, usually delivered within seconds but sometimes a minute or more, and <strong>not ordered</strong>. Each record carries a <code>sequencer</code> value you can compare to order events for the <em>same key</em>.</li>
  <li>The key in the event is <strong>URL-encoded</strong> (spaces arrive as <code>+</code>). Decode it before calling GetObject.</li>
  <li>When you save a notification configuration that targets SQS, S3 sends an <code>s3:TestEvent</code> message. Your consumer must ignore it.</li>
  <li>The target's resource policy must allow S3 to send: an SQS queue policy, SNS topic policy or Lambda permission with principal <code>s3.amazonaws.com</code>, scoped by <code>aws:SourceArn</code> and <code>aws:SourceAccount</code>.</li>
</ul>
<pre><code class="language-json">{
  "QueueConfigurations": [
    {
      "Id": "uploads-to-queue",
      "QueueArn": "arn:aws:sqs:ap-south-1:111122223333:upload-events",
      "Events": ["s3:ObjectCreated:*"],
      "Filter": { "Key": { "FilterRules": [ { "Name": "prefix", "Value": "uploads/" } ] } }
    }
  ]
}</code></pre>

<h3>11. CloudFront in front of S3</h3>
<ul>
  <li><strong>Origin Access Control (OAC)</strong> is the current way to make a private bucket readable only by your distribution. It replaces the older Origin Access Identity (OAI), and works with SSE-KMS and all regions.</li>
  <li>Data transfer from S3 to CloudFront is free. You pay CloudFront's egress, which is usually cheaper than S3's direct internet egress, plus request fees. Cache hits never touch S3.</li>
  <li><strong>Per-user private content:</strong> CloudFront signed URLs (one file) or signed cookies (many files, such as an HLS video's segments), signed with a key in a CloudFront key group. These are distinct from S3 presigned URLs.</li>
  <li><strong>Cache busting:</strong> use content-hashed or versioned keys (<code>app.3f9a1c.js</code>) with long <code>Cache-Control</code> headers. Invalidations are for emergencies: a limited number of paths per month are free, then they cost money, and they take time to propagate.</li>
</ul>

<h3>12. CORS (browser uploads only)</h3>
<p>Browsers send a preflight <code>OPTIONS</code> before a cross-origin PUT. The bucket needs a CORS configuration. Native RN <code>fetch</code> doesn't enforce CORS, which is why "it works on the phone but not on web" is common.</p>
<pre><code class="language-json">{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://app.example.com"],
      "AllowedMethods": ["PUT", "POST", "GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}</code></pre>
<p><code>ExposeHeaders: ["ETag"]</code> is required for browser multipart uploads, because the client must read each part's ETag to complete the upload.</p>

<h3>13. Pricing mental model</h3>
<p>These are rough us-east-1 numbers at time of writing. They vary by region and change, so check the current S3 pricing page.</p>
<table>
  <thead><tr><th>Line item</th><th>Rough figure</th><th>What drives it</th></tr></thead>
  <tbody>
    <tr><td>Standard storage</td><td>about $0.023 per GB-month (first 50 TB)</td><td>Total bytes stored, including old versions and incomplete multipart parts</td></tr>
    <tr><td>Standard-IA / Glacier IR / Deep Archive</td><td>about $0.0125 / $0.004 / $0.001 per GB-month</td><td>Plus retrieval fees, minimum durations and transition request fees</td></tr>
    <tr><td>PUT, COPY, POST, LIST</td><td>about $0.005 per 1,000</td><td>Many tiny writes, chatty LIST loops</td></tr>
    <tr><td>GET</td><td>about $0.0004 per 1,000</td><td>Uncached reads</td></tr>
    <tr><td>Egress to internet</td><td>about $0.09 per GB (first tier)</td><td><strong>Usually the biggest bill.</strong> Downloads by users. Use CloudFront.</td></tr>
    <tr><td>KMS (SSE-KMS)</td><td>per 10,000 requests</td><td>Every object op without Bucket Keys</td></tr>
  </tbody>
</table>
<p>Worked example: 1 million uploads a month at 2 MB each is 2 TB a month of new data, about $46 a month for the first month's storage, growing as data accumulates. That's 1M PUTs, about $5. If each file is viewed 10 times uncached, that's 20 TB of egress, about $1,800. <strong>Storage is cheap; moving bytes out is not.</strong> CloudFront caching and lifecycle tiering are the two big levers.</p>

<h3>14. CLI cheat sheet</h3>
<pre><code class="language-bash"># High-level commands
aws s3 ls s3://acme-media-prod/uploads/ --recursive --human-readable --summarize
aws s3 cp ./report.pdf s3://acme-media-prod/tmp/report.pdf --sse aws:kms
aws s3 sync ./dist s3://acme-web-prod --delete --cache-control "public,max-age=31536000,immutable"
aws s3 presign s3://acme-media-prod/uploads/u_42/9f1c.jpg --expires-in 600   # GET only

# Low-level (s3api) commands
aws s3api put-public-access-block --bucket acme-media-prod \\
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-bucket-versioning --bucket acme-media-prod --versioning-configuration Status=Enabled
aws s3api put-bucket-cors --bucket acme-media-prod --cors-configuration file://cors.json
aws s3api put-bucket-notification-configuration --bucket acme-media-prod \\
  --notification-configuration file://notify.json
aws s3api head-object --bucket acme-media-prod --key uploads/u_42/9f1c.jpg
aws s3api list-multipart-uploads --bucket acme-media-prod        # find billed orphan parts
aws s3api list-object-versions --bucket acme-media-prod --prefix uploads/u_42/</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1: presigned PUT upload, end to end (API Lambda + RN client + confirm)</h3>
<p>The server owns the key, validates intent, records a pending row, and signs a short URL. The client only moves bytes.</p>
<pre><code class="language-ts">// api/createUpload.ts  (Lambda behind an HTTP API with a Cognito JWT authorizer)
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { db } from './db';

const s3 = new S3Client({});                         // region comes from AWS_REGION in Lambda
const BUCKET = process.env.UPLOAD_BUCKET!;
const MAX_BYTES = Number(process.env.MAX_UPLOAD_BYTES ?? 20_971_520); // config, not a hardcoded constant
const EXT_BY_TYPE: Record&lt;string, string&gt; = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf',
};

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) =&gt; {
  const userId = String(event.requestContext.authorizer.jwt.claims.sub);
  const { ticketId, contentType, size } = JSON.parse(event.body ?? '{}');

  const ext = EXT_BY_TYPE[contentType];
  if (!ext || typeof size !== 'number' || size &lt;= 0 || size &gt; MAX_BYTES) {
    return { statusCode: 400, body: JSON.stringify({ error: 'unsupported file' }) };
  }
  if (!(await db.ticketBelongsTo(ticketId, userId))) {
    return { statusCode: 403, body: JSON.stringify({ error: 'forbidden' }) };
  }

  // The SERVER picks the key: no path traversal, no overwriting someone else's file.
  const key = 'uploads/' + ticketId + '/' + randomUUID() + '.' + ext;
  await db.insertAttachment({ key, ticketId, userId, contentType, declaredSize: size, status: 'pending' });

  const url = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 300 },                               // 5 minutes
  );
  return {
    statusCode: 200,
    body: JSON.stringify({ key, url, headers: { 'Content-Type': contentType } }),
  };
};</code></pre>

<pre><code class="language-ts">// app/uploadAttachment.ts  (React Native)
export async function uploadAttachment(ticketId: string, fileUri: string, mime: string, size: number) {
  const slot = await api.post('/uploads', { ticketId, contentType: mime, size });

  // Turn the local file into a Blob. Fine for photos and PDFs; for big videos use a
  // native background uploader so the upload survives the app being backgrounded.
  const blob = await (await fetch(fileUri)).blob();

  const res = await fetch(slot.url, { method: 'PUT', headers: slot.headers, body: blob });
  if (!res.ok) {
    // S3 returns an XML error body: Code (SignatureDoesNotMatch, AccessDenied, ...) + details
    throw new Error('S3 upload failed ' + res.status + ': ' + (await res.text()));
  }
  await api.post('/uploads/complete', { key: slot.key });
  return slot.key;                                    // store the KEY, never the presigned URL
}</code></pre>

<pre><code class="language-ts">// api/completeUpload.ts: verify what actually landed in S3
import { HeadObjectCommand, DeleteObjectCommand, NotFound } from '@aws-sdk/client-s3';

export async function completeUpload(key: string, userId: string) {
  const row = await db.getAttachment(key);
  if (!row || row.userId !== userId) throw new HttpError(404);

  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    if ((head.ContentLength ?? 0) &gt; MAX_BYTES) {
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
      await db.markAttachment(key, 'rejected');
      throw new HttpError(413);
    }
    await db.markAttachment(key, 'uploaded', { size: head.ContentLength, etag: head.ETag });
  } catch (err) {
    if (err instanceof NotFound) throw new HttpError(409, 'object not uploaded yet');
    throw err;
  }
}</code></pre>
<p>The S3 event worker (Example 4) does deeper validation, such as magic bytes and image decoding, and is the source of truth for <code>ready</code>. The confirm call gives the UI fast feedback, and the event covers clients that crash before calling it.</p>

<h3>Example 2: presigned POST with an enforced size limit (browser form)</h3>
<pre><code class="language-ts">import { createPresignedPost } from '@aws-sdk/s3-presigned-post';

const { url, fields } = await createPresignedPost(s3, {
  Bucket: BUCKET,
  Key: key,
  Conditions: [
    ['content-length-range', 1, MAX_BYTES],          // S3 rejects anything outside this range
    ['starts-with', '$Content-Type', 'image/'],
  ],
  Fields: { 'Content-Type': contentType },
  Expires: 300,                                        // seconds
});
// return { url, fields } to the browser</code></pre>
<pre><code class="language-ts">// Browser
const form = new FormData();
Object.entries(fields).forEach(([k, v]) =&gt; form.append(k, v));
form.append('file', file);                             // the file field must come LAST
const res = await fetch(url, { method: 'POST', body: form }); // 204 by default on success</code></pre>

<h3>Example 3: private downloads (presigned GET with a friendly filename)</h3>
<pre><code class="language-ts">import { GetObjectCommand } from '@aws-sdk/client-s3';

const downloadUrl = await getSignedUrl(
  s3,
  new GetObjectCommand({
    Bucket: BUCKET,
    Key: row.key,
    ResponseContentDisposition: 'attachment; filename="invoice-' + row.invoiceNo + '.pdf"',
    ResponseContentType: 'application/pdf',
  }),
  { expiresIn: 60 },                                   // generate on demand, right before use
);</code></pre>
<p>For high-volume reads, such as avatars in a feed, presigned GETs make every URL unique and defeat caching. Use CloudFront: public-ish assets with a long cache and an unguessable key, or CloudFront signed cookies for per-user content.</p>

<h3>Example 4: S3 event → SQS → Lambda worker (idempotent thumbnailer)</h3>
<pre><code class="language-ts">// worker/onUpload.ts  (SQS event source mapping with ReportBatchItemFailures enabled)
import type { SQSEvent, SQSBatchResponse, S3EventRecord } from 'aws-lambda';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

export const handler = async (event: SQSEvent): Promise&lt;SQSBatchResponse&gt; =&gt; {
  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const msg of event.Records) {
    try {
      const body = JSON.parse(msg.body);
      if (body.Event === 's3:TestEvent') continue;     // sent once when the notification is configured
      for (const rec of (body.Records ?? []) as S3EventRecord[]) {
        await processObject(rec);
      }
    } catch (err) {
      console.error(JSON.stringify({ msg: 'upload_processing_failed', messageId: msg.messageId, err: String(err) }));
      batchItemFailures.push({ itemIdentifier: msg.messageId });
    }
  }
  return { batchItemFailures };
};

async function processObject(rec: S3EventRecord) {
  const bucket = rec.s3.bucket.name;
  // Keys arrive URL-encoded with '+' for spaces: replace first, then decode.
  const key = decodeURIComponent(rec.s3.object.key.replaceAll('+', ' '));
  const etag = rec.s3.object.eTag;

  // Idempotency: the same event can arrive twice, so skip work already done for this exact object content.
  const claimed = await db.claimProcessing(key, etag);  // UPDATE ... SET status='processing' WHERE key=$1 AND etag IS DISTINCT FROM $2
  if (!claimed) return;

  // Never trust the client's Content-Type: sniff the first bytes.
  const head = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key, Range: 'bytes=0-15' }));
  const magic = Buffer.from(await head.Body!.transformToByteArray());
  if (!looksLikeJpegOrPng(magic)) {
    await db.markAttachment(key, 'rejected', { reason: 'bad_magic_bytes' });
    return;                                            // permanent failure: don't retry
  }

  const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const input = Buffer.from(await obj.Body!.transformToByteArray());
  const thumb = await sharp(input).rotate().resize(256, 256, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer();

  // Write to a DIFFERENT prefix that the notification filter does not match: no recursion.
  const thumbKey = key.replace(/^uploads[/]/, 'thumbs/').replace(/[.][a-z]+$/, '_256.jpg');
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: thumbKey, Body: thumb, ContentType: 'image/jpeg' }));
  await db.markAttachment(key, 'ready', { thumbKey, etag });
}</code></pre>
<p>Why SQS in the middle rather than S3 → Lambda directly? You get a buffer during bursts, a DLQ for poison files, <code>MaximumConcurrency</code> to protect the database, and partial batch failure. Details are in <a href="#/topic/cloud-sqs">SQS (+ SNS / EventBridge)</a>.</p>

<h3>Example 5: huge files from a client, with presigned multipart</h3>
<pre><code class="language-ts">// Three small API endpoints; the client does the heavy lifting.
import {
  CreateMultipartUploadCommand, UploadPartCommand,
  CompleteMultipartUploadCommand, AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';

// 1) start
export async function startMultipart(key: string, contentType: string) {
  const { UploadId } = await s3.send(new CreateMultipartUploadCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }));
  return { uploadId: UploadId };
}

// 2) sign a batch of part URLs (sign lazily in batches; don't sign 10,000 up front)
export async function signParts(key: string, uploadId: string, partNumbers: number[]) {
  return Promise.all(partNumbers.map(async (n) =&gt; ({
    partNumber: n,
    url: await getSignedUrl(s3, new UploadPartCommand({ Bucket: BUCKET, Key: key, UploadId: uploadId, PartNumber: n }), { expiresIn: 3600 }),
  })));
}

// 3) complete (parts must be sorted by PartNumber)
export async function completeMultipart(key: string, uploadId: string, parts: { partNumber: number; etag: string }[]) {
  await s3.send(new CompleteMultipartUploadCommand({
    Bucket: BUCKET, Key: key, UploadId: uploadId,
    MultipartUpload: { Parts: parts.sort((a, b) =&gt; a.partNumber - b.partNumber).map((p) =&gt; ({ PartNumber: p.partNumber, ETag: p.etag })) },
  }));
}

export async function abortMultipart(key: string, uploadId: string) {
  await s3.send(new AbortMultipartUploadCommand({ Bucket: BUCKET, Key: key, UploadId: uploadId }));
}</code></pre>
<p>On the client: slice the file into 8 to 16 MB parts, PUT 3 to 6 parts in parallel, read the <code>ETag</code> response header of each (in the browser this needs <code>ExposeHeaders: ETag</code> in CORS), retry only failed parts, and persist <code>{uploadId, completed parts}</code> so the upload can resume. The lifecycle rule <code>AbortIncompleteMultipartUpload</code> is the safety net for clients that vanish.</p>

<h3>Example 6: server-side streaming upload (export a large CSV without buffering it in memory)</h3>
<pre><code class="language-ts">import { Upload } from '@aws-sdk/lib-storage';
import { PassThrough } from 'node:stream';

export async function exportBookingsCsv(tenantId: string) {
  const body = new PassThrough();
  const upload = new Upload({
    client: s3,
    params: { Bucket: BUCKET, Key: 'exports/' + tenantId + '/' + Date.now() + '.csv', Body: body, ContentType: 'text/csv' },
    queueSize: 4,                      // parts uploaded in parallel
    partSize: 8 * 1024 * 1024,         // 8 MiB parts (min 5 MiB)
    leavePartsOnError: false,          // abort on failure so orphan parts aren't billed
  });

  const done = upload.done();
  for await (const row of db.streamBookings(tenantId)) body.write(toCsvLine(row));
  body.end();
  await done;
}</code></pre>

<h3>Example 7: bucket policy for CloudFront OAC plus a TLS-only guardrail</h3>
<pre><code class="language-json">{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontOACRead",
      "Effect": "Allow",
      "Principal": { "Service": "cloudfront.amazonaws.com" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::acme-media-prod/thumbs/*",
      "Condition": {
        "StringEquals": { "AWS:SourceArn": "arn:aws:cloudfront::111122223333:distribution/E1ABCDEF2GHIJK" }
      }
    },
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": ["arn:aws:s3:::acme-media-prod", "arn:aws:s3:::acme-media-prod/*"],
      "Condition": { "Bool": { "aws:SecureTransport": "false" } }
    },
    {
      "Sid": "DenyOldPresignedSignatures",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": "arn:aws:s3:::acme-media-prod/*",
      "Condition": { "NumericGreaterThan": { "s3:signatureAge": "900000" } }
    }
  ]
}</code></pre>
<p>The third statement is a belt-and-braces cap: any presigned request whose signature is older than 15 minutes (the value is in milliseconds) is rejected, even if someone signed a 7-day URL by mistake. Normal SDK calls from your services are signed at request time, so a cap like this doesn't bother them. Check the current docs for exactly which request types the key applies to before relying on it.</p>

<h3>Example 8: SQS queue policy that lets the bucket publish events</h3>
<pre><code class="language-json">{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3ToSend",
      "Effect": "Allow",
      "Principal": { "Service": "s3.amazonaws.com" },
      "Action": "sqs:SendMessage",
      "Resource": "arn:aws:sqs:ap-south-1:111122223333:upload-events",
      "Condition": {
        "ArnEquals":    { "aws:SourceArn": "arn:aws:s3:::acme-media-prod" },
        "StringEquals": { "aws:SourceAccount": "111122223333" }
      }
    }
  ]
}</code></pre>
<p>If the queue uses SSE-KMS with a customer-managed key, that key's policy must also allow <code>s3.amazonaws.com</code> to <code>kms:GenerateDataKey</code> and <code>kms:Decrypt</code>. Otherwise the notification configuration saves but events silently never arrive.</p>

<h3>Example 9: static web app hosting (CI deploy)</h3>
<pre><code class="language-bash"># hashed assets: cache forever
aws s3 sync ./dist/assets s3://acme-web-prod/assets --cache-control "public,max-age=31536000,immutable"
# index.html: always revalidate, so a new deploy is picked up
aws s3 cp ./dist/index.html s3://acme-web-prod/index.html --cache-control "no-cache"
# only if something unhashed changed:
aws cloudfront create-invalidation --distribution-id E1ABCDEF2GHIJK --paths "/index.html"</code></pre>
<p>The pipeline around this (OIDC from GitHub Actions to an AWS role, environments, rollback) is covered in <a href="#/topic/cloud-cicd">CI/CD &amp; Infrastructure as Code</a>. <a href="#/topic/cloud-amplify">Amplify Hosting</a> packages the same S3 + CloudFront pattern for you.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. Presigned URL expires "early"</h3>
<p>The URL was signed with temporary role credentials (Lambda, ECS task role, assumed role) that expired before the URL's <code>expiresIn</code>. Keep upload URLs short and request a fresh one on retry. Don't cache them on the device.</p>

<h3>2. SignatureDoesNotMatch on some devices only</h3>
<p>Common causes:</p>
<ul>
  <li>The client sent a different <code>Content-Type</code> from the one that was signed (some Android libraries append <code>; charset=utf-8</code>, others default to <code>application/octet-stream</code>).</li>
  <li>An HTTP library re-encoded the URL (double-encoding <code>%2F</code> or spaces).</li>
  <li>The client added headers that were signed differently.</li>
</ul>
<p>S3's XML error body includes the <code>CanonicalRequest</code> and <code>StringToSign</code> it computed. Diff them against what you expected.</p>

<h3>3. SDK checksum defaults changed (2025)</h3>
<p>Newer AWS SDK versions compute request checksums (CRC32-family) by default. Some presigned-URL flows and third-party S3-compatible stores broke because checksum parameters ended up in the signed URL. If presigned uploads start failing after an SDK bump, look at the <code>requestChecksumCalculation</code> / <code>responseChecksumValidation</code> client settings (for example <code>'WHEN_REQUIRED'</code>). Check current SDK docs for exact behaviour.</p>

<h3>4. 403 when you expected 404</h3>
<p>The caller lacks <code>s3:ListBucket</code>, so S3 hides whether the key exists. Either grant ListBucket scoped to a prefix, or treat 403 on GET of a server-generated key as "not uploaded".</p>

<h3>5. Wrong region or endpoint</h3>
<p>Calling a bucket through the wrong regional endpoint gives <code>PermanentRedirect</code> or <code>AuthorizationHeaderMalformed</code> ("the region 'us-east-1' is wrong; expecting 'ap-south-1'"). Create the S3Client in the bucket's region, especially for presigning. A URL signed for the wrong region fails for the client.</p>

<h3>6. Concurrent overwrites lose data</h3>
<p>Two devices editing "profile.json" at the same key: the last writer wins, with no error. Use unique keys per write, conditional writes (<code>IfMatch</code> or <code>IfNoneMatch</code>), or keep the mutable document in a database.</p>

<h3>7. "Rename" and "move" are copy + delete</h3>
<p>CopyObject handles up to 5 GB in one call; bigger objects need multipart copy (<code>UploadPartCopy</code>). Renaming a "folder" of a million objects means a million copies and deletes. Design keys so you never need to rename: use IDs, not human names.</p>

<h3>8. Listing is not querying</h3>
<p>ListObjectsV2 returns at most 1,000 keys per call, in lexicographic (UTF-8 binary) order, with no filtering beyond prefix and delimiter. "Show the user's last 20 uploads" from LIST on a big prefix is slow and expensive. Keep an index in the database. For bulk analytics over keys, use S3 Inventory reports.</p>

<h3>9. Event duplicates, reordering and delete-before-create</h3>
<p>A fast overwrite and delete can deliver events out of order, and the same event can arrive twice. For per-key state machines, compare the event's <code>sequencer</code> (a hex string: left-pad the shorter one with zeros, then compare), or re-read the object's current state with HEAD before acting.</p>

<h3>10. Recursive trigger</h3>
<p>A Lambda triggered on <code>ObjectCreated</code> for the whole bucket writes its output into the same bucket, triggering itself, and the loop runs (and bills) until someone notices. Filter notifications by prefix and write outputs to another prefix or bucket. Lambda has recursive-loop detection for some event sources, but treat it as a safety net, not a design.</p>

<h3>11. Small objects and cold classes</h3>
<p>IA classes bill each object as at least 128 KB, and Glacier classes add per-object overhead, so moving 50 million 4 KB log lines to Glacier can cost more than leaving them in Standard. Also check whether lifecycle transitions are even applied to small objects (defaults have changed over time). Aggregate small files first.</p>

<h3>12. Glacier objects can't be GET directly</h3>
<p>Flexible Retrieval and Deep Archive objects need a <code>RestoreObject</code> job (minutes to 48 hours depending on class and tier), after which a temporary copy is readable for N days. A user-facing "download my old recording" button needs an async flow: request restore, notify when ready. Glacier Instant Retrieval is the exception, with millisecond access.</p>

<h3>13. Versioned bucket "deletes" don't free space</h3>
<p>A DELETE adds a delete marker, and all previous versions are still billed. Deleting a versioned bucket requires deleting every version and delete marker first. Use a lifecycle rule, or <code>list-object-versions</code> plus batch delete (up to 1,000 keys per <code>DeleteObjects</code> call).</p>

<h3>14. KMS throttling at scale</h3>
<p>With SSE-KMS and no Bucket Keys, every PUT and GET calls KMS. High-throughput jobs (Athena scans, mass thumbnailing) can hit KMS request-rate quotas and fail with throttling errors that look like S3 errors. Enable Bucket Keys, or use SSE-S3 where KMS isn't required.</p>

<h3>15. Browser vs native behaviour</h3>
<ul>
  <li>Browsers need bucket CORS. RN's native networking doesn't, so web fails while mobile works.</li>
  <li>On RN, reading a large file into a JS Blob uses memory. Large videos from low-end Android devices need a native, background-capable uploader and multipart.</li>
  <li>iOS kills foreground uploads shortly after the app is backgrounded unless they run in a background URL session.</li>
</ul>

<h3>16. CloudFront caches errors</h3>
<p>If the app requests a thumbnail before the worker has written it, CloudFront may cache the 403 or 404 for its error-caching TTL, so the image stays "broken" after it exists. Lower the error-caching minimum TTL for that behaviour, or only hand out the thumbnail URL once the DB says <code>ready</code>.</p>

<h3>17. Static website endpoint is HTTP-only</h3>
<p>The <code>s3-website</code> endpoint doesn't support HTTPS or OAC. For HTTPS SPAs, use a REST-endpoint origin with OAC, plus CloudFront error responses or a CloudFront Function to rewrite deep links to <code>/index.html</code>.</p>

<h3>18. ETag is not always MD5</h3>
<p>Multipart uploads produce ETags like <code>"9b2cf5...-12"</code>, and SSE-KMS objects don't have an MD5 ETag either. Dedup or integrity logic built on "ETag == MD5" breaks. Use S3's additional checksums or compute your own hash.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1: proxying file bytes through API Gateway and Lambda</h3>
<p>Base64-encoding a photo into a JSON body hits the 10 MB API Gateway payload cap and the 6 MB Lambda sync payload cap. It adds about 33% size overhead, burns Lambda GB-seconds on idle network waits, and risks the API Gateway integration timeout. <strong>Fix:</strong> presigned URLs. Your API handles metadata only.</p>

<h3>Anti-pattern 2: public bucket to serve user content</h3>
<p>Everything in the bucket is world-readable, forever cacheable by strangers, and outside audit. <strong>Fix:</strong> private bucket, Block Public Access at account level, CloudFront with OAC, and signed cookies or URLs for private content.</p>

<h3>Anti-pattern 3: letting the client choose the key</h3>
<p><code>POST /uploads { key: "avatars/" + userId + ".jpg" }</code> lets a malicious client overwrite someone else's avatar, or write into <code>../config/</code>-style prefixes your other code trusts. <strong>Fix:</strong> the server generates the key (UUID), scoped under a prefix derived from the authenticated identity.</p>

<h3>Anti-pattern 4: trusting client-declared type and size</h3>
<p>The client says <code>image/png, 200 KB</code> and uploads a 2 GB executable. <strong>Fix:</strong> presigned POST with <code>content-length-range</code>, or HEAD after upload. Sniff magic bytes in the worker. Never serve user uploads from your app's main origin with an executable content type (<code>text/html</code>), which is a stored-XSS vector.</p>

<h3>Anti-pattern 5: long-lived presigned URLs</h3>
<p>7-day URLs in emails, logs, analytics events and support tickets are bearer tokens to your customers' files. <strong>Fix:</strong> minutes, not days. Generate on demand at click time, and add an <code>s3:signatureAge</code> deny as a cap.</p>

<h3>Anti-pattern 6: storing presigned URLs in the database</h3>
<p>They expire, so the UI breaks a week later. <strong>Fix:</strong> store the key, and sign at read time.</p>

<h3>Anti-pattern 7: <code>"Action": "s3:*", "Resource": "*"</code></h3>
<p>One leaked Lambda credential can read every bucket in the account, including CloudTrail logs and backups. <strong>Fix:</strong> scope actions and resources to the bucket and prefix the function needs, using separate statements for bucket-level and object-level ARNs.</p>

<h3>Anti-pattern 8: triggering on the whole bucket and writing back into it</h3>
<p>This creates infinite recursion and a surprise bill. <strong>Fix:</strong> prefix filters, separate output prefix or bucket, and an alarm on the function's invocation count.</p>

<h3>Anti-pattern 9: S3 → Lambda directly for critical processing, no DLQ</h3>
<p>The async invocation retries a couple of times and then drops the event unless an on-failure destination or DLQ is configured. <strong>Fix:</strong> S3 → SQS (with DLQ) → Lambda with partial batch failure, or EventBridge with retries and a DLQ.</p>

<h3>Anti-pattern 10: no lifecycle rules</h3>
<p>Orphaned tmp uploads, incomplete multipart parts and noncurrent versions grow silently forever. <strong>Fix:</strong> every bucket gets at least an abort-multipart rule. Versioned buckets get noncurrent-version expiration, and tmp prefixes get expiration.</p>

<h3>Anti-pattern 11: using S3 LIST as an application query</h3>
<p>"Find all of user X's files" via LIST on a giant prefix is O(objects), paginated and slow. <strong>Fix:</strong> keep a metadata table keyed by owner. S3 holds the bytes.</p>

<h3>Anti-pattern 12: invalidating CloudFront on every deploy</h3>
<p>This costs money, takes time to propagate, and still races with caches. <strong>Fix:</strong> content-hashed filenames with immutable caching. Only <code>index.html</code> gets <code>no-cache</code>.</p>

<h3>Anti-pattern 13: hardcoding the bucket name and region in the mobile app</h3>
<p>You can't migrate buckets or regions without an app release, and you invite clients to call S3 directly. <strong>Fix:</strong> the app only ever receives URLs from the API.</p>

<h3>Anti-pattern 14: giving the mobile app IAM user access keys</h3>
<p>Long-term keys in an app binary get extracted within days. <strong>Fix:</strong> presigned URLs from your API, or Cognito identity pools issuing short-lived, per-user scoped credentials if the client must call S3 APIs directly (see <a href="#/topic/cloud-cognito">Cognito</a>).</p>

<h3>Anti-pattern 15: enabling ACLs to "fix" cross-account access</h3>
<p>Turning ACLs back on to grant another account access is a legacy model that's hard to audit. <strong>Fix:</strong> bucket policy granting the other account's role (and an identity policy on their side), with Object Ownership left as <em>Bucket owner enforced</em>.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. What is S3, and how is it different from a filesystem or a database?</div>
  <div class="qa-answer">
    <p>S3 is a regional, managed object store: a durable map from key to blob, exposed as HTTPS operations. It's designed for 11 nines of durability across multiple AZs and scales without capacity planning. Unlike a filesystem there's no append, rename, locking or partial write: objects are written whole, and "folders" are just key prefixes. Unlike a database there's no query or index beyond prefix listing. So the standard design keeps <strong>metadata in a database and bytes in S3</strong>, with the database row holding the key.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Design secure uploads of photos and videos (up to 2 GB) from a React Native app.</div>
  <div class="qa-answer">
    <ol>
      <li>The client calls <code>POST /uploads</code> with type, size and context (ticket ID). The API authenticates with a Cognito JWT, authorises (does this user own the ticket?), validates type and size against config, and generates the key server-side under a tenant or ticket prefix.</li>
      <li>It inserts a <code>pending</code> attachment row, then returns a presigned PUT URL (5 minutes) for small files. For large files it returns a multipart session: <code>CreateMultipartUpload</code> plus presigned part URLs signed in batches.</li>
      <li>The client uploads directly to S3: parts in parallel, retrying failed parts, resumable via the stored UploadId. It uses a native background uploader for big videos.</li>
      <li>An S3 ObjectCreated event goes to SQS, then a worker Lambda that is idempotent on (key, ETag). The worker validates magic bytes and real size, transcodes or thumbnails, and marks the row <code>ready</code>. A DLQ catches poison files.</li>
      <li>Reads go through CloudFront with OAC, plus signed URLs or cookies for private content.</li>
      <li>Guardrails: private bucket, BPA, TLS-only policy, SSE-S3 or SSE-KMS with Bucket Keys, lifecycle rules for tmp and incomplete multipart uploads, and an <code>s3:signatureAge</code> cap.</li>
    </ol>
    <p>Then say why: the bytes never touch API Gateway (10 MB) or Lambda (6 MB), compute stays tiny, and S3 absorbs the bandwidth.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Presigned PUT vs presigned POST: when do you use which?</div>
  <div class="qa-answer">
    <p>A presigned PUT is a URL for a raw binary PUT. It's simple for mobile clients and works per-part for multipart uploads, but it can't enforce a size range, and Content-Type is only enforced if you signed it. A presigned POST returns a URL plus form fields containing a signed policy document. S3 enforces conditions such as <code>content-length-range</code> and <code>starts-with $Content-Type image/</code>. It's single-request only (5 GB max) and multipart/form-data, which suits browsers. I default to PUT for mobile (with post-upload HEAD validation) and POST for web forms with strict limits.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Bucket policy vs IAM policy vs ACL. A partner account needs to read one prefix: what do you configure?</div>
  <div class="qa-answer">
    <p>IAM identity policies attach to my principals. Bucket policies are resource policies on the bucket, used for cross-account access, service principals and guardrails. ACLs are legacy and disabled by default (Bucket owner enforced). Within one account, an Allow in either the identity or the bucket policy is enough, unless an explicit Deny applies. <strong>Cross-account requires both sides</strong>. My bucket policy allows <code>arn:aws:iam::PARTNER:role/reader</code> to <code>s3:GetObject</code> on <code>bucket/exports/partner-x/*</code> and <code>s3:ListBucket</code> with an <code>s3:prefix</code> condition. Their admin grants that role the same actions in its identity policy. If the bucket uses a customer-managed KMS key, the key policy must also allow their role <code>kms:Decrypt</code>. That's the step people forget. For many consumers, I'd give each one an S3 Access Point with its own policy.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. What's S3's consistency model? What happens if two clients write the same key?</div>
  <div class="qa-answer">
    <p>Since December 2020, strong read-after-write consistency applies to all PUTs and DELETEs, and LIST reflects them immediately. There's still no locking. Concurrent PUTs to the same key resolve as last writer wins, and with versioning both versions are retained. To avoid lost updates: write immutable objects under unique keys and keep the pointer in a database, use conditional writes (<code>If-None-Match: *</code> for create-only, <code>If-Match</code> with an ETag for compare-and-swap), or keep mutable state in a database.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. You store 50 TB of call recordings that are hot for a week and audited rarely after that. Cut the cost.</div>
  <div class="qa-answer">
    <ul>
      <li>A lifecycle rule on <code>recordings/</code>: Standard for 30 days (Standard-IA's minimum duration), then Standard-IA or Glacier Instant Retrieval if auditors need instant playback. Glacier Flexible or Deep Archive after 6 to 12 months if restores in hours are acceptable.</li>
      <li>Check object sizes. Recordings are MBs, so the 128 KB minimum and the per-object archive overhead are irrelevant. For tiny transcript JSONs, bundle them or leave them in Standard.</li>
      <li>Account for minimum durations and retrieval fees. A bulk audit restore can cost real money, so model it.</li>
      <li>Intelligent-Tiering if access is genuinely unpredictable.</li>
      <li>Expire per the retention policy, use Object Lock only if regulation requires it, and expire noncurrent versions.</li>
      <li>Usually the bigger lever is egress: playback through CloudFront, and compress (Opus or AAC instead of WAV) at ingestion.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. What guarantees do S3 event notifications give? Why put SQS between S3 and Lambda?</div>
  <div class="qa-answer">
    <p>Events are at-least-once, typically delivered in seconds but occasionally slower, and not ordered. Duplicates happen, and events for the same key can arrive out of order (the <code>sequencer</code> field lets you order them per key). S3 → Lambda directly is an async invoke: a few retries, then the event is dropped unless an on-failure destination is configured, with no backpressure control. With SQS in the middle I get durable buffering through bursts and outages, a DLQ with redrive, batch processing with partial batch failure, and <code>MaximumConcurrency</code> on the event source mapping to protect downstream systems. Either way the consumer is idempotent, keyed on (bucket, key, ETag or versionId). EventBridge is the alternative when several consumers need content-based routing.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How do you serve private user images to a mobile feed fast and cheaply?</div>
  <div class="qa-answer">
    <p>Presigned GETs work for a handful of downloads, but every URL is unique, so nothing caches, and each image is a direct S3 request with S3 egress. For a feed I put CloudFront in front of the private bucket with Origin Access Control, so only the distribution can read. For per-user privacy I use CloudFront signed cookies (one cookie covers a path like <code>/u/42/*</code>) or signed URLs, issued by my API after auth. Assets use immutable content-addressed keys with long Cache-Control, so the device cache and edge cache both hit. S3 to CloudFront transfer is free, and CloudFront egress is cheaper than S3 direct. On RN, pair it with an image library that respects cache headers.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. SSE-S3 vs SSE-KMS: what do you pick, and what's the operational gotcha?</div>
  <div class="qa-answer">
    <p>SSE-S3 is the default and free. It's enough when the requirement is "encrypted at rest". SSE-KMS adds a key with its own policy, so access needs <code>kms:Decrypt</code> as well as S3 permissions. Every decrypt is logged in CloudTrail, and you can revoke access by changing the key policy. Customers in regulated industries often require a customer-managed key. The gotchas: every object request becomes a KMS request (cost, plus KMS rate quotas that throttle high-throughput jobs), which is fixed by <strong>S3 Bucket Keys</strong>. Cross-account readers and service principals (SNS, CloudFront OAC) also need key-policy grants, which is a frequent "it saves fine but reads fail" bug.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. FDE scenario: a customer says "uploads from our Android field app fail with 403 for some users; iOS and web are fine." Walk me through it.</div>
  <div class="qa-answer">
    <ol>
      <li><strong>Get the actual error body.</strong> S3 returns XML with a <code>Code</code>. Have the app log it, or reproduce on a customer device with a proxy. <code>SignatureDoesNotMatch</code>, <code>AccessDenied</code> and <code>Request has expired</code> point to very different causes.</li>
      <li><strong>SignatureDoesNotMatch:</strong> compare the returned <code>CanonicalRequest</code> with the signed headers. Usual Android suspects: the HTTP library adds <code>; charset=utf-8</code> to Content-Type, defaults to <code>application/octet-stream</code>, or re-encodes the URL. Fix by setting the header explicitly to the signed value, or by not signing Content-Type and validating server-side.</li>
      <li><strong>Expired:</strong> field users on slow networks queue uploads offline and retry hours later with a stale URL. Fix by requesting a fresh URL per attempt, never caching URLs. Also check whether the signer's role credentials expire early.</li>
      <li><strong>AccessDenied:</strong> check CloudTrail data events or server access logs for the request. Look for a bucket policy deny (TLS, <code>signatureAge</code>, VPC endpoint condition), a KMS key policy issue, or keys under a prefix the signer's role can't write.</li>
      <li><strong>Only some users:</strong> check whether file names with spaces or non-ASCII characters are involved (encoding). Check whether these are large videos, where a single PUT over 5 GB fails or uploads die when the app is backgrounded.</li>
      <li>Fix it, add structured logging of S3 error codes and a client-side metric, and write a one-paragraph root cause for the customer.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. A presigned URL for a sensitive file leaked into a public Slack channel. What's the blast radius, and what do you do?</div>
  <div class="qa-answer">
    <p>Anyone holding it can perform that one operation (GET) on that one key until it expires, or until the signing credentials stop being valid. You can't revoke one URL. Options, fastest first:</p>
    <ul>
      <li>If it was signed with an IAM user's access key, deactivate that key; every URL it signed dies.</li>
      <li>If it was signed with a role, revoke the role's active sessions (an IAM deny on tokens issued before now).</li>
      <li>Add a bucket-policy deny on <code>s3:signatureAge</code>, or a deny on that specific key.</li>
      <li>Move or re-key the object.</li>
    </ul>
    <p>Then check S3 access logs or CloudTrail data events to see whether it was fetched and by which IPs. Prevention: short expiry, generate at click time, never log full URLs (redact the query string), and cap with <code>s3:signatureAge</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. A batch job writing millions of objects gets 503 SlowDown. Why, and what do you change?</div>
  <div class="qa-answer">
    <p>S3 scales request capacity per partitioned prefix (at least 3,500 writes and 5,500 reads per second per prefix) and re-partitions automatically as load grows. A sudden ramp onto one prefix can briefly exceed current capacity. Fixes: retry with exponential backoff and jitter (the SDK does this, so make sure you aren't overriding it), ramp up gradually, and spread writes across multiple prefixes with a high-cardinality element early in the key (tenant, date-hour, hash). Batch small records into larger objects, which also helps cost. If SSE-KMS is on, check that the "throttling" isn't actually KMS, and enable Bucket Keys. For extreme small-object, low-latency workloads, consider S3 Express One Zone.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You say "metadata in the database, bytes in S3", and store keys, not URLs.</li>
    <li>You draw the presigned upload flow with a server-chosen key and post-upload validation.</li>
    <li>You know presigned PUT vs POST and that URLs can't be revoked individually.</li>
    <li>You keep buckets private and serve through CloudFront + OAC.</li>
    <li>You know the bucket ARN vs object ARN split and the 403-instead-of-404 behaviour.</li>
    <li>You treat events as at-least-once, unordered, URL-encoded, and put SQS in between.</li>
    <li>You mention lifecycle rules, minimum durations and that egress dominates cost.</li>
    <li>You mention SSE-KMS with Bucket Keys and the key-policy gotcha for cross-account access.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Presigned PUT, presigned POST or multipart: which size limits force each choice?</div>
  <div class="qa-answer">
    <p>A single PUT, presigned or not, is capped at 5 GB, and a presigned POST is also a single request with the same 5 GB ceiling. Anything larger <em>must</em> use multipart upload, and AWS recommends multipart from about 100 MB anyway because parts upload in parallel and failed parts can be retried, so the upload is resumable. Parts are 5 MiB to 5 GiB (the last one can be smaller), with at most 10,000 parts, and an object can be up to 5 TB. So: presigned PUT for small mobile uploads, presigned POST for browser forms that need <code>content-length-range</code> enforcement, and multipart with a presigned URL per <code>UploadPart</code> for big videos, always paired with the <code>AbortIncompleteMultipartUpload</code> lifecycle rule.</p>
  </div>
</div>
` },

  ]
});
