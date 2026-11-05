window.PREP_SITE.registerTopic({
  id: "cloud-rds",
  module: "cloud",
  title: "RDS (+ Aurora)",
  estimatedReadTime: "40 min",
  tags: ["aws","rds","aurora","postgres","rds-proxy","multi-az","read-replicas","pitr","iam-auth","secrets-manager","lambda","dynamodb"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">RDS is <strong>managed Postgres or MySQL where AWS runs the machine and you run the data</strong>: Multi-AZ for availability, replicas for reads, PITR into a new instance for recovery, and RDS Proxy plus a pool of one per Lambda environment for connections. Aurora buys shared storage, fast failover and elastic capacity. DynamoDB wins on simple key-value access at scale.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Engines:</strong> PostgreSQL, MySQL, MariaDB, SQL Server, Oracle and Db2 on an instance class you choose. Aurora is the AWS re-engineered MySQL/PostgreSQL-compatible engine: the same SQL on a distributed storage layer spread across three AZs.</li>
    <li><strong>Split of duties:</strong> AWS handles hardware, OS, patching, backups and failover plumbing. You handle schema, queries, indexes, connections, sizing, security groups, upgrades and restore testing.</li>
    <li><strong>Multi-AZ</strong> (classic): a synchronous standby that serves no reads, with automatic failover in about 1 to 2 minutes as DNS flips. <strong>Read replicas:</strong> asynchronous, readable, can lag, promoted manually, up to 15 (engine-dependent), cross-region capable.</li>
    <li><strong>Backups:</strong> retention up to 35 days, PITR to any second, <code>LatestRestorableTime</code> about 5 minutes behind. <strong>Restores create a new instance</strong>; set the parameter group, security groups and subnets explicitly. Manual snapshots outlive the instance. Test restores.</li>
    <li><strong>Parameter groups:</strong> create a custom one at creation (the default can't be edited). Static parameters need a reboot (<code>pending-reboot</code>).</li>
    <li><strong>Connections are the scarce resource:</strong> each Postgres connection is a process using memory. Postgres <code>max_connections</code> is about <code>DBInstanceClassMemory/9531392</code> (capped at 5,000). Lambda's environments plus bursts plus idle frozen sockets cause a storm. Fix with a pool of <code>max: 1</code> outside the handler, capped concurrency and RDS Proxy.</li>
    <li><strong>RDS Proxy:</strong> multiplexes per transaction, queues up to the borrow timeout, smooths failover, IAM in front and Secrets Manager behind, VPC-only. <strong>Pinning</strong> (SET, temp tables, locks) kills multiplexing, so watch the pinned metric and use <code>ALTER ROLE ... SET</code>.</li>
    <li><strong>IAM DB auth:</strong> 15-minute token checked only at connect, TLS required, <code>rds-db:connect</code> on <code>dbuser:db-…</code> or <code>prx-…/user</code>. <code>GRANT rds_iam</code> for direct connections. Mint a fresh token per new connection.</li>
    <li><strong>Secrets Manager:</strong> RDS-managed master password with automatic rotation. Single-user vs alternating-users strategies. Re-fetch and reconnect on <code>28P01</code>.</li>
    <li><strong>Encryption at rest</strong> only at creation (snapshot, encrypted copy, restore to fix). Enforce TLS with <code>rds.force_ssl</code> or proxy <code>RequireTLS</code>.</li>
    <li><strong>Aurora:</strong> a 6-way, 3-AZ shared volume, up to 15 replicas typically under 100 ms of lag, auto-growing storage, faster failover, cluster, reader and custom endpoints, Serverless v2 ACUs (can scale to 0 with resume latency), Global Database, cloning. Standard (pay per I/O) vs I/O-Optimized pricing.</li>
    <li><strong>Failover handling:</strong> retry the whole idempotent transaction on <code>57P01</code>, <code>08006</code>, <code>40001</code> and similar, discard dead connections, keep DNS TTLs short.</li>
    <li><strong>Scaling order:</strong> queries and indexes, then connections, then caching, then scale up, then replicas, then offloading, then sharding or Limitless.</li>
    <li><strong>Upgrades:</strong> Blue/Green switchover typically under a minute (logical replication, so freeze DDL). Extended Support surcharges hit out-of-support majors. Stopped instances restart after 7 days.</li>
    <li><strong>RDS vs DynamoDB:</strong> invariants, joins and ad-hoc queries vs key-value scale, HTTP access and no connection limits. Often you use both.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Treating Lambda like a long-running server against RDS</strong>: a pool of 10 opened per invocation, no proxy, no concurrency cap. A traffic burst creates thousands of connections, Postgres runs out of slots, and the API fails exactly when it's busiest. Fix: a module-scope pool with <code>max: 1</code>, RDS Proxy (watching pinning), and <code>MaximumConcurrency</code> or reserved concurrency so the DB sees a bounded number of clients.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Multi-AZ is for availability, read replicas are for read scale, and point-in-time restore into a new instance is how I recover from bad writes. Those are three different problems."</div>
  <div class="revision-say">"Lambda talks to Postgres through RDS Proxy with IAM auth and a pool of one per environment, and I cap concurrency upstream so the database always sees a bounded number of connections."</div>
  <div class="revision-say">"I'd choose Aurora over RDS when I need many low-lag replicas, fast failover, global reads or elastic capacity. For simple key-value access at huge scale, I'd put that path on DynamoDB and keep Postgres as the system of record."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What RDS is (and what it isn't)</h3>
<p>RDS is a managed service that provisions a database instance (a VM you don't log into), installs the engine, attaches storage (EBS-backed gp3 or io2 for RDS, the Aurora storage volume for Aurora), and runs operational chores for you. You connect with the normal driver (<code>pg</code>, <code>mysql2</code>, Prisma, Drizzle) over TCP to a DNS endpoint. SQL fundamentals (indexes, transactions, isolation, EXPLAIN) are in <a href="#/topic/be-databases">Databases</a>. This topic covers running that database on AWS.</p>

<h3>The responsibility split (interviewers ask this directly)</h3>
<table>
  <thead><tr><th>AWS manages</th><th>You still own</th></tr></thead>
  <tbody>
    <tr><td>Hardware, host OS, engine installation</td><td>Choosing engine version and instance class, and upgrading on time</td></tr>
    <tr><td>Minor-version patching in your maintenance window (if enabled)</td><td>Testing upgrades, planning major-version upgrades</td></tr>
    <tr><td>Automated backups, transaction logs, PITR mechanics</td><td>Retention settings, <strong>actually testing restores</strong>, cross-region copies for DR</td></tr>
    <tr><td>Replication and failover plumbing (Multi-AZ, replicas)</td><td>App retry and reconnect logic, read-after-write routing</td></tr>
    <tr><td>Storage durability, encryption implementation</td><td>Turning encryption on at creation, key policies, TLS enforcement</td></tr>
    <tr><td>Monitoring metrics emission</td><td>Alarms, slow-query analysis, index design, connection management</td></tr>
    <tr><td>Network placement options</td><td>VPC design, security groups, keeping the DB out of public subnets</td></tr>
  </tbody>
</table>

<h3>Why teams pick RDS Postgres for app backends</h3>
<ul>
  <li><strong>Relational integrity:</strong> foreign keys, unique constraints and <em>exclusion constraints</em> enforce invariants the app can't race around. Booking overlap is the classic example (shown in Examples).</li>
  <li><strong>Ad-hoc queries and reporting:</strong> product asks "bookings per floor per hour last month" and you write SQL instead of redesigning tables.</li>
  <li><strong>Ecosystem:</strong> ORMs, migrations, pgvector for embeddings (see <a href="#/topic/ai-vector-search">Embeddings &amp; Vector Search</a>), JSONB for semi-structured data.</li>
  <li><strong>Managed without lock-in at the SQL level:</strong> it's still Postgres, so you can dump and restore elsewhere.</li>
</ul>

<h3>When RDS is the wrong choice</h3>
<ul>
  <li><strong>Massive key-value scale with simple access patterns</strong> (sessions, device state, idempotency keys, millions of writes per second): DynamoDB scales horizontally with no connection limits.</li>
  <li><strong>Need for superuser, custom OS packages or unsupported extensions:</strong> self-managed on EC2, or RDS Custom (for some engines).</li>
  <li><strong>Very spiky or idle dev and test workloads:</strong> consider Aurora Serverless v2 (which can scale to zero in recent versions; check current docs) or a serverless Postgres provider.</li>
  <li><strong>Analytics over terabytes:</strong> a warehouse (Redshift, Athena on S3), not your OLTP primary.</li>
</ul>

<h3>Where it shows up in a typical stack</h3>
<p>In a meeting-room-booking platform: tablets and a mobile app call an API (<a href="#/topic/cloud-api-gateway">API Gateway</a> + <a href="#/topic/cloud-lambda">Lambda</a>). Bookings live in RDS Postgres, where an exclusion constraint stops double-booking. Lambdas connect through RDS Proxy with IAM auth, and a nightly job exports usage reports to <a href="#/topic/cloud-s3">S3</a>. In the AI case study (<a href="#/topic/cloud-serverless-case">Case Study: Serverless on AWS</a>), call scores and rubric versions live in Postgres, written by SQS-driven workers whose concurrency is capped to protect connections.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Picture 1: an RDS deployment in a VPC</h3>
<div class="diagram">
<pre>
 VPC 10.0.0.0/16
 ┌───────────────────────────────── private subnets (DB subnet group) ────────────────────────┐
 │  AZ-a                               AZ-b                               AZ-c                │
 │  ┌────────────────┐  synchronous   ┌────────────────┐                                     │
 │  │ PRIMARY        │ ─────────────► │ STANDBY        │  (Multi-AZ: not readable,            │
 │  │ db.m6g.large   │   replication  │ (hot spare)    │   promoted on failover)              │
 │  └───────┬────────┘                └────────────────┘                                     │
 │          │ asynchronous replication                                                       │
 │          └────────────────────────────────────────────────► ┌────────────────┐            │
 │                                                              │ READ REPLICA   │ readable,  │
 │                                                              │ own endpoint   │ may lag    │
 │                                                              └────────────────┘            │
 └────────────────────────────────────────────────────────────────────────────────────────────┘
  app ──► app-db.xxxx.ap-south-1.rds.amazonaws.com  (DNS points at whichever node is primary)
  security group: allow 5432 ONLY from the app / proxy security group. Never 0.0.0.0/0.
</pre>
</div>

<h3>Picture 2: Aurora separates compute from storage</h3>
<div class="diagram">
<pre>
   cluster endpoint (writer)        reader endpoint (DNS round-robin over replicas)
            │                                   │
   ┌────────▼───────┐   ┌────────────────┐   ┌──▼─────────────┐
   │ WRITER instance│   │ Replica 1      │   │ Replica 2      │   ... up to 15 replicas
   └────────┬───────┘   └───────┬────────┘   └───────┬────────┘
            │  sends only redo log records            │ read pages from the same volume
   ═════════▼═════════════════════▼═══════════════════▼══════════════
     ONE shared cluster volume: 6 copies across 3 AZs, quorum writes (4 of 6), quorum reads (3 of 6)
     grows automatically; replicas don't replay full data copies, so lag is typically under 100 ms
   ══════════════════════════════════════════════════════════════════
</pre>
</div>
<p>The key mental shift: in RDS each replica has <em>its own copy</em> of the data, built by replication. In Aurora all instances read the <em>same</em> storage volume. That's why Aurora replicas are cheap to add, lag less, and can be promoted quickly.</p>

<h3>Picture 3: the Lambda connection storm, and the fix</h3>
<div class="diagram">
<pre>
 WITHOUT a proxy                                   WITH RDS Proxy
 ─────────────────                                 ───────────────
 800 concurrent Lambda environments               800 Lambda environments
   × pool size 10 (copied from an Express app)      × pool size 1
 = up to 8,000 connection attempts                 = 800 client connections ──► PROXY
       │                                                                          │ multiplexes onto
       ▼                                                                          ▼ a bounded pool
 Postgres max_connections ≈ a few hundred          ~50-150 real DB connections ──► Postgres
 → "too many clients" / "remaining connection     (transactions borrow a connection,
   slots are reserved", memory pressure, and        return it at commit)
   frozen environments keep idle connections open
</pre>
</div>

<h3>An analogy that sticks</h3>
<p>RDS is a <strong>managed apartment</strong>: the landlord fixes the plumbing and takes nightly backups, but you choose the furniture (schema), and if you invite 5,000 guests (connections) the building's fire code (<code>max_connections</code>) still applies. RDS Proxy is the <strong>doorman</strong> who lets guests share a small number of seats.</p>

<div class="callout warn">
  <div class="callout-title">Common misconceptions</div>
  <p><strong>"Multi-AZ gives me read scaling."</strong> In the classic Multi-AZ instance deployment, the standby serves no traffic; it exists for failover. (The newer Multi-AZ <em>DB cluster</em> deployment has two readable standbys, and Aurora replicas are readable.) <strong>"Restoring a snapshot rolls my database back."</strong> No. Every restore creates a new instance with a new endpoint, and you then migrate data or repoint the app.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. Engines, instance classes, storage</h3>
<ul>
  <li><strong>Engines:</strong> PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, Db2, plus Aurora PostgreSQL and Aurora MySQL. Each has supported major versions with an end-of-standard-support date.</li>
  <li><strong>Instance classes:</strong>
    <ul>
      <li><code>db.t4g</code> and <code>db.t3</code> are burstable: cheap, but CPU credits run out under sustained load and then you're throttled. Watch <code>CPUCreditBalance</code>. Fine for dev, risky for prod.</li>
      <li><code>db.m*</code> is general purpose and <code>db.r*</code> is memory-optimised (Postgres loves RAM for its cache). Graviton (<code>g</code>) classes are usually the best price-performance.</li>
    </ul>
  </li>
  <li><strong>Storage:</strong> gp3 (baseline 3,000 IOPS and 125 MiB/s, with more provisionable independently of size) or io1/io2 for sustained high IOPS. Storage autoscaling grows up to <code>MaxAllocatedStorage</code>. <strong>You can't shrink allocated storage</strong>; shrinking means migrating to a new instance. After a storage modification you typically can't modify storage again for about 6 hours (check current docs).</li>
</ul>

<h3>2. Networking</h3>
<ul>
  <li>A <strong>DB subnet group</strong> lists private subnets in at least 2 AZs. Set <code>PubliclyAccessible=false</code>.</li>
  <li>The <strong>security group</strong> allows the DB port only from the app's or proxy's security group (SG-to-SG references, not CIDRs).</li>
  <li><strong>Lambda must run in the VPC</strong> to reach a private RDS instance or RDS Proxy. In-VPC Lambdas then need VPC endpoints or a NAT gateway to call AWS APIs like Secrets Manager, and NAT gateways have their own hourly and per-GB costs (see <a href="#/topic/cloud-aws-foundations">AWS Foundations &amp; IAM</a> for VPC basics).</li>
  <li>Human access: SSM Session Manager port forwarding through a bastion, or a VPN. Never a public endpoint "just for debugging".</li>
</ul>

<h3>3. High availability: Multi-AZ</h3>
<table>
  <thead><tr><th></th><th>Multi-AZ instance (classic)</th><th>Multi-AZ DB cluster</th><th>Aurora</th></tr></thead>
  <tbody>
    <tr><td>Standbys</td><td>1, synchronous, <strong>not readable</strong></td><td>2, semi-synchronous, readable</td><td>Replicas on shared storage, readable</td></tr>
    <tr><td>Typical failover</td><td>about 60 to 120 seconds</td><td>usually under about 35 seconds</td><td>usually tens of seconds or less (faster through RDS Proxy)</td></tr>
    <tr><td>Engines</td><td>All RDS engines</td><td>MySQL, PostgreSQL</td><td>Aurora MySQL, Aurora PostgreSQL</td></tr>
  </tbody>
</table>
<p>Numbers are typical, not guaranteed, so check current docs. <strong>What triggers failover:</strong> AZ or instance failure, storage failure, instance class modification, OS patching (applied to the standby first, then failover), or a manual <code>reboot --force-failover</code>.</p>
<p><strong>What the app sees:</strong> the endpoint DNS name is repointed to the new primary. In-flight transactions fail, and open connections break (<code>ECONNRESET</code>, <code>57P01 admin_shutdown</code>). The app must drop dead pool connections, reconnect, and <strong>retry whole idempotent transactions</strong>. Clients that cache DNS for a long time (classic JVM defaults) keep hitting the old IP. RDS Proxy hides most of this because clients stay connected to the proxy while it reconnects to the new primary.</p>

<h3>4. Read replicas</h3>
<ul>
  <li>Asynchronous replication, so replicas lag (watch <code>ReplicaLag</code>). Up to 15 replicas for MySQL, MariaDB and PostgreSQL at time of writing (engine-dependent, check docs). They can be cross-region (a DR and latency tool) and can be <strong>promoted</strong> to standalone primaries, which breaks replication.</li>
  <li>Each replica has its own endpoint, so your app routes reads. Aurora gives you a single load-balanced <strong>reader endpoint</strong>.</li>
  <li><strong>Read-after-write:</strong> a user creates a booking, the app redirects, the list is read from a replica, and the booking is "missing". Route reads that must see the user's own writes to the primary (for a session window, or for specific endpoints).</li>
  <li><strong>Postgres replica query conflicts:</strong> long queries on a replica can be cancelled ("canceling statement due to conflict with recovery") when vacuum on the primary removes rows they need. Tune <code>max_standby_streaming_delay</code> and <code>hot_standby_feedback</code> (the latter adds bloat on the primary), or run analytics elsewhere.</li>
</ul>
<table>
  <thead><tr><th></th><th>Multi-AZ standby</th><th>Read replica</th></tr></thead>
  <tbody>
    <tr><td>Purpose</td><td>Availability (automatic failover)</td><td>Read scaling, reporting, cross-region DR</td></tr>
    <tr><td>Replication</td><td>Synchronous</td><td>Asynchronous (lag)</td></tr>
    <tr><td>Serves reads</td><td>No (classic deployment)</td><td>Yes</td></tr>
    <tr><td>Failover</td><td>Automatic</td><td>Manual promotion</td></tr>
  </tbody>
</table>

<h3>5. Backups and point-in-time recovery</h3>
<ul>
  <li><strong>Automated backups:</strong> a daily snapshot in the backup window plus continuous transaction-log upload. Retention is 1 to 35 days (0 disables automated backups and PITR; don't do that in prod). <code>LatestRestorableTime</code> is typically within the last 5 minutes.</li>
  <li><strong>PITR</strong> restores to any second within retention, into a <strong>new instance</strong>. You choose the instance class, subnet group, security groups and parameter group at restore time. Forgetting these gives you defaults, which is a common incident-time mistake.</li>
  <li><strong>Manual snapshots</strong> persist until you delete them, even after the instance is deleted. Use them before risky migrations. Copy snapshots cross-region and cross-account (with AWS Backup) for disaster recovery and ransomware isolation. Encrypted snapshots need KMS key access in the target.</li>
  <li><strong>Restore performance:</strong> a new instance restored from a snapshot loads blocks from S3 lazily, so first-touch queries are slow until data is read. Warm it by reading tables (or check current docs for initialization options) before cutting over.</li>
  <li><strong>Deletion protection</strong> and a <strong>final snapshot</strong> on delete should be the default in IaC.</li>
  <li>Aurora adds <strong>Backtrack</strong> (Aurora MySQL only: rewind in place) and <strong>fast database cloning</strong> (copy-on-write clones in minutes, great for testing migrations on production-sized data).</li>
</ul>

<h3>6. Parameter groups and option groups</h3>
<ul>
  <li>Engine configuration lives in a <strong>DB parameter group</strong> (Aurora has cluster-level and instance-level groups). The default group can't be edited, so <strong>create a custom group at creation time</strong>. Switching an instance to a different group later requires a reboot.</li>
  <li><strong>Dynamic</strong> parameters apply immediately. <strong>Static</strong> ones show <code>pending-reboot</code> until the next reboot.</li>
  <li>Useful Postgres parameters:
    <ul>
      <li><code>log_min_duration_statement</code> (log slow queries);</li>
      <li><code>idle_in_transaction_session_timeout</code> (kill forgotten transactions that hold locks and block vacuum);</li>
      <li><code>statement_timeout</code> (better set per role);</li>
      <li><code>rds.force_ssl</code> (require TLS; newer Postgres versions on RDS default it on, check yours);</li>
      <li><code>shared_preload_libraries</code> with <code>pg_stat_statements</code> (typically preloaded on RDS; run <code>CREATE EXTENSION</code>).</li>
    </ul>
  </li>
  <li><strong>Option groups</strong> enable engine add-ons for MySQL, MariaDB, Oracle and SQL Server.</li>
</ul>

<h3>7. Connections, the Lambda problem, and RDS Proxy</h3>
<p><strong>Why connections are scarce:</strong> Postgres forks a backend process per connection, each using memory. RDS sets <code>max_connections</code> from instance memory. For RDS PostgreSQL the default is <code>LEAST({DBInstanceClassMemory/9531392}, 5000)</code>, roughly 100 on a 1 GiB class and a few thousand on large ones. Run <code>SHOW max_connections</code> to check yours. More connections than cores also means context switching, so a high limit isn't a free win.</p>
<p><strong>Why Lambda makes it worse:</strong></p>
<ul>
  <li>Each execution environment handles one request at a time and holds its own connections.</li>
  <li>Concurrency can jump to hundreds in seconds.</li>
  <li>Frozen (idle) environments keep their sockets open until they're reaped.</li>
  <li>Copying an Express-style pool of 10 into each function multiplies everything by 10.</li>
</ul>
<p>The mitigations, in order:</p>
<ol>
  <li><strong>Create the pool outside the handler with <code>max: 1</code></strong>, so warm invocations reuse it and each environment holds at most one connection.</li>
  <li><strong>Cap concurrency:</strong> <code>MaximumConcurrency</code> on SQS event source mappings (see <a href="#/topic/cloud-sqs">SQS</a>), and reserved concurrency for API functions if needed.</li>
  <li><strong>RDS Proxy</strong> between Lambda and the database.</li>
  <li><strong>Or avoid TCP entirely:</strong> the Aurora <strong>RDS Data API</strong> (HTTP, <code>@aws-sdk/client-rds-data</code>, available for Aurora Serverless v2 and provisioned Aurora on supported versions, so check docs), or DynamoDB for the hot path.</li>
</ol>
<h4>RDS Proxy in depth</h4>
<ul>
  <li><strong>What it does:</strong> keeps a warm pool of DB connections and <strong>multiplexes</strong> many client connections onto them, lending a DB connection per transaction. It queues clients when the pool is busy (up to <code>ConnectionBorrowTimeout</code>), and during failover it holds client connections and reconnects to the new writer. AWS cites substantially faster failover for proxied apps.</li>
  <li><strong>Auth:</strong> clients authenticate to the proxy with IAM tokens or a username and password. The proxy connects to the DB with credentials from <strong>Secrets Manager</strong> (one secret per DB user it can log in as). Newer releases add end-to-end IAM options, so check current docs.</li>
  <li><strong>Pinning:</strong> if a session changes state the proxy can't safely share, the client is <strong>pinned</strong> to one DB connection for the rest of the session and multiplexing is lost. Examples: <code>SET</code> statements, temporary tables, advisory locks, and some prepared-statement or protocol features, depending on engine. Watch <code>DatabaseConnectionsCurrentlySessionPinned</code>. Put settings at the role level (<code>ALTER ROLE ... SET statement_timeout</code>) instead of per session.</li>
  <li><strong>Knobs:</strong> <code>MaxConnectionsPercent</code> (share of <code>max_connections</code> the proxy may use; leave headroom for admin and migrations), <code>MaxIdleConnectionsPercent</code>, <code>ConnectionBorrowTimeout</code>, <code>RequireTLS</code>.</li>
  <li><strong>Endpoints:</strong> the default read/write endpoint, plus read-only endpoints for Aurora replicas.</li>
  <li><strong>Constraints:</strong> VPC-only (not publicly accessible), engine and version support varies, and it adds a little latency per round trip. It's billed per vCPU of the underlying instances (or per capacity unit for Aurora Serverless), so check current pricing.</li>
</ul>

<h3>8. Security: encryption, IAM auth, Secrets Manager</h3>
<ul>
  <li><strong>Encryption at rest</strong> (KMS) must be chosen <strong>at creation</strong>. To encrypt an existing unencrypted instance, snapshot it, copy the snapshot with encryption, restore, and cut over. Read replicas and snapshots inherit encryption.</li>
  <li><strong>In transit:</strong> require TLS (<code>rds.force_ssl=1</code>, or proxy <code>RequireTLS</code>). For direct connections, verify the server certificate with the RDS CA bundle (<code>global-bundle.pem</code>), and plan for CA rotations. RDS Proxy presents certificates that chain to Amazon's public roots, so the default Node trust store usually works.</li>
  <li><strong>IAM database authentication:</strong> the app calls <code>Signer.getAuthToken()</code> (<code>@aws-sdk/rds-signer</code>), a locally signed token valid for 15 minutes that is <em>used only at connect time</em>. It's sent as the password over TLS. The IAM policy grants <code>rds-db:connect</code> on <code>arn:aws:rds-db:REGION:ACCOUNT:dbuser:RESOURCE_ID/db_user</code>, where the resource ID is the instance's <code>db-…</code> ID or the proxy's <code>prx-…</code> ID. For direct IAM auth to Postgres, the DB role needs <code>GRANT rds_iam</code>, after which IAM auth takes precedence over its password. At very high new-connection rates, IAM auth adds overhead and can be throttled, which is another reason to pool.</li>
  <li><strong>Secrets Manager:</strong> RDS can manage the master password for you (<code>ManageMasterUserPassword</code>), rotating it automatically (7 days by default). For app users, rotation Lambdas use a <strong>single-user</strong> strategy (simple, with a brief window where old credentials fail) or an <strong>alternating-users</strong> strategy (two users flip-flop, so no failure window). Apps cache the secret, and <strong>must re-fetch it and reconnect on an auth failure</strong> (Postgres <code>28P01</code>). The Parameters and Secrets Lambda Extension offers a local caching endpoint.</li>
</ul>
<table>
  <thead><tr><th></th><th>IAM DB auth</th><th>Secrets Manager password</th></tr></thead>
  <tbody>
    <tr><td>Secret at rest</td><td>None: tokens are minted from the role's credentials</td><td>A rotated password</td></tr>
    <tr><td>Revocation</td><td>Remove the IAM permission</td><td>Rotate or disable the user</td></tr>
    <tr><td>Connect-rate limits</td><td>Yes, pool or proxy needed</td><td>No special limit</td></tr>
    <tr><td>Audit</td><td>CloudTrail plus IAM</td><td>CloudTrail on secret reads</td></tr>
    <tr><td>Good default</td><td>Lambda/ECS → RDS Proxy with IAM</td><td>Proxy → DB, legacy tools, BI users</td></tr>
  </tbody>
</table>

<h3>9. Aurora in depth</h3>
<ul>
  <li><strong>Storage:</strong> a cluster volume replicated 6 ways across 3 AZs in small segments, with quorum writes. It tolerates losing an AZ for writes, and losing an AZ plus a node for reads. It auto-grows to the engine's limit (historically 128 TiB; check current docs) and you pay for what's used.</li>
  <li><strong>Endpoints:</strong> cluster (writer), reader (DNS round-robin across replicas, so a pooled connection sticks to one replica; balance with many connections or a proxy), custom (a subset, such as "analytics replicas"), and instance endpoints.</li>
  <li><strong>Replicas:</strong> up to 15, with lag typically under 100 ms, and promotion tiers that control which one becomes writer on failover.</li>
  <li><strong>Aurora Serverless v2:</strong> capacity in ACUs (1 ACU is about 2 GiB of memory) that scales in fine increments within a min/max you set. It can mix with provisioned instances in one cluster. Recent versions support scaling to 0 ACUs (auto-pause), but resuming takes seconds, so it's not for latency-sensitive paths. It suits spiky, unpredictable and dev workloads. At steady high load, provisioned instances are often cheaper.</li>
  <li><strong>Global Database:</strong> cross-region storage-level replication with typically sub-second lag. Use it for regional DR and low-latency reads abroad, with managed switchover and failover.</li>
  <li><strong>Pricing configurations:</strong> <em>Standard</em> (instance plus storage plus per-I/O charges, about $0.20 per million requests at time of writing) vs <em>I/O-Optimized</em> (no I/O charges, higher instance and storage prices). If I/O is a large share of your bill, I/O-Optimized often wins. Check current pricing.</li>
  <li><strong>Newer options to know by name:</strong> Aurora Limitless Database (sharded writes) and Aurora DSQL (distributed, serverless SQL). Mention them as "I'd evaluate them", not as defaults, and check current docs.</li>
</ul>
<table>
  <thead><tr><th></th><th>RDS PostgreSQL</th><th>Aurora PostgreSQL</th></tr></thead>
  <tbody>
    <tr><td>Storage</td><td>EBS volume per instance; you size it</td><td>Shared, auto-growing cluster volume</td></tr>
    <tr><td>Replicas</td><td>Each has its own copy; seconds of lag possible</td><td>Share storage; lag typically under 100 ms</td></tr>
    <tr><td>Failover</td><td>About 1 to 2 minutes (classic Multi-AZ)</td><td>Usually faster</td></tr>
    <tr><td>Elastic capacity</td><td>Resize instance (brief disruption)</td><td>Serverless v2 ACUs</td></tr>
    <tr><td>Extras</td><td>Broader engine and version choice, simpler pricing</td><td>Cloning, Global Database, Backtrack (MySQL), custom endpoints</td></tr>
    <tr><td>Cost</td><td>Lower for small and steady workloads</td><td>Higher baseline; can win at scale or with I/O-Optimized</td></tr>
    <tr><td>Pick when</td><td>Small to medium app, cost-sensitive, standard HA is enough</td><td>Read-heavy at scale, strict RTO, global users, spiky load</td></tr>
  </tbody>
</table>

<h3>10. Scaling playbook (in the order a senior engineer reaches for it)</h3>
<ol>
  <li><strong>Find the expensive queries</strong> (<code>pg_stat_statements</code>, Performance Insights / CloudWatch Database Insights), then add indexes, fix N+1 queries and add pagination. This is usually a 10× win before spending money.</li>
  <li><strong>Fix connections</strong> (pool size 1 for Lambda, RDS Proxy, kill idle-in-transaction sessions).</li>
  <li><strong>Cache</strong> hot reads (ElastiCache, or CloudFront for public GETs; see <a href="#/topic/be-caching">Caching</a>).</li>
  <li><strong>Scale up</strong> (bigger or memory-optimised class). With Multi-AZ this is a brief failover-style disruption.</li>
  <li><strong>Read replicas / Aurora readers</strong> for read-heavy workloads, with read-after-write routing.</li>
  <li><strong>Move work off the primary:</strong> async writes through SQS, reporting on replicas or a warehouse, blobs in S3.</li>
  <li><strong>Write scaling beyond one primary:</strong> partitioning (Postgres native partitions help maintenance and pruning, not write capacity), then sharding by tenant, Aurora Limitless, or moving specific access patterns to DynamoDB.</li>
</ol>

<h3>11. Maintenance and upgrades</h3>
<ul>
  <li>The <strong>maintenance window</strong> is when minor-version upgrades (if auto minor upgrade is on) and OS patches are applied. With Multi-AZ the standby is patched first and then failed over to, so there's a short blip.</li>
  <li><strong>Major version upgrades</strong> (for example Postgres 15 to 16 or 17) can be done in place (with downtime) or with <strong>RDS Blue/Green Deployments</strong>. Blue/Green creates a synced "green" copy on the new version, you test against it, and switchover usually takes under a minute. For Postgres it relies on logical replication, so DDL during the window and some object types need care (check the docs' limitations list).</li>
  <li><strong>Extended Support:</strong> running a major version past its end of standard support automatically incurs extra per-vCPU-hour charges. Upgrade on schedule. It's a classic surprise line on the bill.</li>
  <li>A <strong>stopped</strong> instance restarts automatically after 7 days. Stopping isn't a long-term cost saver.</li>
</ul>

<h3>12. Monitoring</h3>
<ul>
  <li><strong>CloudWatch metrics:</strong> <code>CPUUtilization</code>, <code>FreeableMemory</code>, <code>DatabaseConnections</code>, <code>ReadIOPS</code> and <code>WriteIOPS</code>, <code>ReadLatency</code> and <code>WriteLatency</code>, <code>DiskQueueDepth</code>, <code>FreeStorageSpace</code>, <code>ReplicaLag</code>, <code>CPUCreditBalance</code> (t-classes). Proxy metrics include <code>ClientConnections</code>, <code>DatabaseConnections</code>, <code>DatabaseConnectionsCurrentlySessionPinned</code> and borrow latency.</li>
  <li><strong>Performance Insights</strong> (being folded into CloudWatch Database Insights, so check current docs) shows DB load by wait event and top SQL. It's the fastest way to tell "CPU-bound on one query" from "waiting on locks" or "waiting on I/O".</li>
  <li><strong>Enhanced Monitoring</strong> gives OS-level process and memory metrics.</li>
  <li>Export Postgres logs (slow queries, errors, deadlocks) to CloudWatch Logs. Alert design is covered in <a href="#/topic/cloud-cloudwatch">CloudWatch &amp; Observability</a>.</li>
</ul>

<h3>13. Cost mental model</h3>
<table>
  <thead><tr><th>Line item</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>Instance-hours</td><td>The big one, billed 24/7 whether busy or idle. Multi-AZ roughly doubles it. Reserved Instances or Savings Plans discount steady usage.</td></tr>
    <tr><td>Storage</td><td>GB-month, plus provisioned IOPS and throughput above the gp3 baseline</td></tr>
    <tr><td>Aurora I/O</td><td>Per million requests in the Standard configuration; none with I/O-Optimized</td></tr>
    <tr><td>Backups</td><td>Free up to 100% of provisioned storage in the region, then per GB-month. Manual snapshots count.</td></tr>
    <tr><td>Data transfer</td><td>Cross-AZ traffic between app and DB, and cross-region replication</td></tr>
    <tr><td>RDS Proxy</td><td>Per vCPU-hour of the target instances</td></tr>
    <tr><td>Extended Support</td><td>Per vCPU-hour surcharge on out-of-support majors</td></tr>
  </tbody>
</table>

<h3>14. RDS vs DynamoDB decision</h3>
<table>
  <thead><tr><th></th><th>RDS / Aurora (Postgres)</th><th>DynamoDB</th></tr></thead>
  <tbody>
    <tr><td>Model</td><td>Relational: joins, FKs, constraints, multi-table ACID</td><td>Key-value/document; design tables around known access patterns (single-table design)</td></tr>
    <tr><td>Queries</td><td>Ad-hoc SQL, aggregates, reporting</td><td>Get or query by key and index; scans are expensive</td></tr>
    <tr><td>Scale</td><td>Vertical plus read replicas; one writer</td><td>Horizontal, effectively unlimited if partition keys distribute well</td></tr>
    <tr><td>Connections</td><td>TCP, limited, needs pooling or a proxy</td><td>HTTPS API, no connection limits, ideal for Lambda</td></tr>
    <tr><td>Ops</td><td>Sizing, versions, maintenance windows, upgrades</td><td>Serverless, no versions or patching</td></tr>
    <tr><td>Cost shape</td><td>Pay for capacity 24/7 (Serverless v2 flexes)</td><td>Pay per request (on-demand) or provisioned; near zero when idle</td></tr>
    <tr><td>Transactions</td><td>Full ACID, isolation levels</td><td>Conditional writes; <code>TransactWriteItems</code> across a limited number of items</td></tr>
    <tr><td>Great for</td><td>Bookings with overlap constraints, billing, admin and reporting, evolving queries</td><td>Sessions, device state, idempotency keys, carts, high-scale per-key data</td></tr>
  </tbody>
</table>
<p>Real systems often use both: Postgres as the system of record, and DynamoDB for an idempotency table or per-device state. Data-model fundamentals are in <a href="#/topic/be-databases">Databases</a>.</p>

<h3>15. CLI cheat sheet</h3>
<pre><code class="language-bash"># what do I have, and is it healthy?
aws rds describe-db-instances \\
  --query "DBInstances[].{id:DBInstanceIdentifier,class:DBInstanceClass,engine:EngineVersion,multiAz:MultiAZ,status:DBInstanceStatus}"
aws rds describe-db-instances --db-instance-identifier app-prod --query "DBInstances[0].LatestRestorableTime"
aws rds describe-pending-maintenance-actions

# test failover (Multi-AZ instance) / Aurora failover
aws rds reboot-db-instance --db-instance-identifier app-prod --force-failover
aws rds failover-db-cluster --db-cluster-identifier app-aurora

# manual snapshot before a risky migration
aws rds create-db-snapshot --db-instance-identifier app-prod --db-snapshot-identifier app-prod-pre-migration-1105

# mint an IAM auth token by hand (debugging)
aws rds generate-db-auth-token --hostname "$PROXY_ENDPOINT" --port 5432 --username app_user --region ap-south-1</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1: Lambda → RDS Proxy with IAM auth, pool size 1</h3>
<pre><code class="language-ts">// db.ts: module scope, so it's reused across warm invocations of ONE execution environment
import { Pool } from 'pg';
import { Signer } from '@aws-sdk/rds-signer';

const host = process.env.DB_PROXY_ENDPOINT!;       // app-proxy.proxy-abc123.ap-south-1.rds.amazonaws.com
const signer = new Signer({ hostname: host, port: 5432, username: 'app_user', region: process.env.AWS_REGION });

export const pool = new Pool({
  host,
  port: 5432,
  user: 'app_user',
  database: 'app',
  password: () =&gt; signer.getAuthToken(),         // called per NEW connection; token only needs to be valid at connect
  ssl: { rejectUnauthorized: true },              // IAM auth requires TLS; never disable verification
  max: 1,                                         // an environment serves one request at a time
  connectionTimeoutMillis: 3_000,
  idleTimeoutMillis: 60_000,
  statement_timeout: 10_000,                      // a runaway query can't eat the whole Lambda timeout
});</code></pre>
<pre><code class="language-ts">// getRoomBookings.ts
import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { pool } from './db';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) =&gt; {
  const tenantId = String(event.requestContext.authorizer.jwt.claims['custom:tenantId']);
  const roomId = event.pathParameters?.roomId;
  const { rows } = await pool.query(
    'SELECT id, title, starts_at, ends_at FROM bookings ' +
    'WHERE tenant_id = $1 AND room_id = $2 AND ends_at &gt;= now() ORDER BY starts_at LIMIT 50',
    [tenantId, roomId],
  );
  return { statusCode: 200, body: JSON.stringify(rows) };
};</code></pre>
<p>The IAM policy on the function's role, scoped to one DB user through one proxy:</p>
<pre><code class="language-json">{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "rds-db:connect",
      "Resource": "arn:aws:rds-db:ap-south-1:111122223333:dbuser:prx-0123456789abcdef0/app_user"
    }
  ]
}</code></pre>
<p>Here the proxy authenticates the Lambda with IAM, then logs into Postgres as <code>app_user</code> using the password in the Secrets Manager secret registered with the proxy. Don't open a new connection per invocation, don't <code>pool.end()</code> at the end of the handler, and don't copy a pool size of 10 from a server app.</p>

<h3>Example 2: Secrets Manager credentials that survive rotation</h3>
<pre><code class="language-ts">import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { Pool } from 'pg';

const sm = new SecretsManagerClient({});
let pool: Pool | undefined;

async function buildPool(): Promise&lt;Pool&gt; {
  const res = await sm.send(new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ARN }));
  const { username, password } = JSON.parse(res.SecretString!);   // RDS-managed secrets hold username + password
  return new Pool({
    host: process.env.DB_HOST, port: 5432, database: 'app',
    user: username, password, max: 1,
    ssl: { rejectUnauthorized: true, ca: RDS_CA_BUNDLE },          // direct-to-instance: verify with the RDS CA bundle
  });
}

export async function query(sql: string, params: unknown[] = []) {
  pool ??= await buildPool();
  try {
    return await pool.query(sql, params);
  } catch (err) {
    if ((err as { code?: string }).code === '28P01') {             // invalid_password: rotated under us
      await pool.end().catch(() =&gt; {});
      pool = await buildPool();                                    // re-fetch the secret, reconnect once
      return pool.query(sql, params);
    }
    throw err;
  }
}</code></pre>
<p>With the alternating-users rotation strategy this retry is rarely needed, but keep it: it's what turns a rotation into a non-event instead of a 3 a.m. page.</p>

<h3>Example 3: retry whole transactions on failover and transient errors</h3>
<pre><code class="language-ts">import type { PoolClient } from 'pg';

const TRANSIENT = new Set([
  '57P01', '57P02', '57P03',          // admin_shutdown, crash_shutdown, cannot_connect_now (failover / restart)
  '08000', '08003', '08006',          // connection exceptions
  '40001', '40P01',                   // serialization_failure, deadlock_detected
  'ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED',
]);
const sleep = (ms: number) =&gt; new Promise((r) =&gt; setTimeout(r, ms));

export async function inTransaction&lt;T&gt;(work: (c: PoolClient) =&gt; Promise&lt;T&gt;, attempts = 4): Promise&lt;T&gt; {
  for (let i = 0; ; i++) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      client.release();
      return result;
    } catch (err) {
      await client.query('ROLLBACK').catch(() =&gt; {});
      client.release(true);                           // discard this connection: it may be dead
      const code = (err as { code?: string }).code ?? '';
      if (!TRANSIENT.has(code) || i &gt;= attempts - 1) throw err;
      await sleep(Math.min(2_000, 100 * 2 ** i) + Math.random() * 100);   // backoff + jitter
    }
  }
}</code></pre>
<p>Retry the <em>whole</em> transaction, never a single statement in the middle of one. Only do this for idempotent work, or work guarded by a unique key: a commit can succeed while the acknowledgement is lost to a failover.</p>

<h3>Example 4: read/write split with read-your-writes</h3>
<pre><code class="language-ts">const writer = makePool(process.env.DB_WRITER_ENDPOINT!);   // proxy default endpoint / cluster endpoint
const reader = makePool(process.env.DB_READER_ENDPOINT!);   // proxy read-only endpoint / Aurora reader endpoint

// After a user writes, pin their reads to the writer for a few seconds (lag window).
export function poolFor(req: { readOnly: boolean; lastWriteAt?: number }) {
  const recentlyWrote = req.lastWriteAt !== undefined &amp;&amp; Date.now() - req.lastWriteAt &lt; 5_000;
  return req.readOnly &amp;&amp; !recentlyWrote ? reader : writer;
}</code></pre>
<p>Carry <code>lastWriteAt</code> in a short-lived cookie or a client-side header from the mobile app. Two pools of size 1 per Lambda environment means up to 2 connections per environment, so budget for it.</p>

<h3>Example 5: infrastructure (CDK): Multi-AZ Postgres, proxy, least-privilege grant</h3>
<pre><code class="language-ts">import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

const engine = rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_16 });

const db = new rds.DatabaseInstance(this, 'AppDb', {
  engine,
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.M6G, ec2.InstanceSize.LARGE),
  vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
  multiAz: true,
  storageType: rds.StorageType.GP3,
  allocatedStorage: 100,
  maxAllocatedStorage: 500,                       // storage autoscaling ceiling
  storageEncrypted: true,                         // only possible at creation
  backupRetention: Duration.days(14),
  deletionProtection: true,
  removalPolicy: RemovalPolicy.SNAPSHOT,          // final snapshot if the stack deletes it
  credentials: rds.Credentials.fromGeneratedSecret('postgres'),   // master creds in Secrets Manager
  parameterGroup: new rds.ParameterGroup(this, 'AppPg16', {
    engine,
    parameters: {
      log_min_duration_statement: '500',          // ms
      idle_in_transaction_session_timeout: '60000',
    },
  }),
  enablePerformanceInsights: true,
});

// App user's own secret (create the role in SQL with this password; least privilege, not master)
const appUserSecret = new rds.DatabaseSecret(this, 'AppUserSecret', { username: 'app_user', masterSecret: db.secret });
appUserSecret.attach(db);

const proxy = db.addProxy('AppProxy', {
  secrets: [appUserSecret],
  vpc,
  iamAuth: true,                                  // clients must present IAM tokens
  requireTLS: true,
});
proxy.grantConnect(apiFn, 'app_user');            // rds-db:connect for that user via this proxy
proxy.connections.allowDefaultPortFrom(apiFn);    // SG rule: Lambda -&gt; proxy
// verify proxy -&gt; DB security-group rules in the synthesized template</code></pre>

<h3>Example 6: least-privilege Postgres roles and "what is the DB doing?" queries</h3>
<pre><code class="language-sql">-- Run once as the master user. Role-level settings avoid per-session SET (which pins RDS Proxy sessions).
CREATE ROLE app_user LOGIN PASSWORD 'from-the-app-user-secret';
GRANT CONNECT ON DATABASE app TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER ROLE app_user SET statement_timeout = '10s';
ALTER ROLE app_user SET idle_in_transaction_session_timeout = '30s';

-- Direct IAM auth (no proxy) instead of a password:
-- CREATE ROLE report_user LOGIN; GRANT rds_iam TO report_user;

-- Top queries by total time
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
SELECT calls, round(mean_exec_time::numeric, 1) AS mean_ms,
       round(total_exec_time::numeric) AS total_ms, left(query, 80) AS query
FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;

-- Connection states: lots of 'idle in transaction' means leaked transactions holding locks
SELECT usename, state, count(*) FROM pg_stat_activity GROUP BY usename, state ORDER BY count(*) DESC;

-- Who is blocking whom?
SELECT pid, pg_blocking_pids(pid) AS blocked_by, wait_event_type, left(query, 60)
FROM pg_stat_activity WHERE cardinality(pg_blocking_pids(pid)) &gt; 0;</code></pre>

<h3>Example 7: why relational for a booking system (exclusion constraint)</h3>
<pre><code class="language-sql">CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE bookings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL,
  room_id    uuid NOT NULL,
  starts_at  timestamptz NOT NULL,
  ends_at    timestamptz NOT NULL,
  status     text NOT NULL DEFAULT 'confirmed',
  CHECK (ends_at &gt; starts_at),
  -- no two confirmed bookings for the same room may overlap, enforced by the DB even under races
  EXCLUDE USING gist (room_id WITH =, tstzrange(starts_at, ends_at) WITH &amp;&amp;) WHERE (status = 'confirmed')
);</code></pre>
<p>Two tablets booking the same room at the same instant: one insert succeeds and the other fails with <code>23P01 exclusion_violation</code>, which the API maps to <code>409 Conflict</code>. DynamoDB can't express "no overlapping intervals" natively, and you'd need slot-per-item modelling plus conditional writes. The full class design is in <a href="#/topic/lld-booking-system">Case: Meeting Room Booking</a>.</p>

<h3>Example 8: runbook: "someone ran a DELETE without a WHERE at 10:02 IST"</h3>
<pre><code class="language-bash"># 1) Pin the time from app or DB logs (10:02 IST = 04:32 UTC). Restore to just BEFORE it, into a NEW instance.
aws rds restore-db-instance-to-point-in-time \\
  --source-db-instance-identifier app-prod \\
  --target-db-instance-identifier app-prod-pitr-0431 \\
  --restore-time 2026-11-05T04:31:00Z \\
  --db-instance-class db.m6g.large \\
  --db-subnet-group-name app-private \\
  --vpc-security-group-ids sg-0abc1234def567890 \\
  --db-parameter-group-name app-pg16 \\
  --no-publicly-accessible
aws rds wait db-instance-available --db-instance-identifier app-prod-pitr-0431

# 2) Extract only the lost rows from the restored copy...
psql "host=$RESTORE_HOST dbname=app user=admin sslmode=verify-full sslrootcert=global-bundle.pem" \\
  -c "COPY (SELECT * FROM bookings WHERE tenant_id = 'acme-tenant-id') TO STDOUT WITH CSV HEADER" &gt; lost_bookings.csv

# 3) ...and load them back into prod (staging table + INSERT ... ON CONFLICT DO NOTHING), then verify counts.
# 4) Delete the restored instance when done (or snapshot it for the post-mortem).</code></pre>
<p>Restoring a copy and surgically reinserting rows usually beats swapping the whole database, because every write since 10:02 stays intact. If you must swap: stop writes, restore, rename instances or repoint the endpoint (a DNS or config change), and accept losing writes after the restore point. Practise this before you need it.</p>

<h3>Example 9: major version upgrade with Blue/Green</h3>
<pre><code class="language-bash">aws rds create-blue-green-deployment \\
  --blue-green-deployment-name app-prod-pg-upgrade \\
  --source arn:aws:rds:ap-south-1:111122223333:db:app-prod \\
  --target-engine-version "$TARGET_PG_VERSION" \\
  --target-db-parameter-group-name app-pg-next

# run the test suite and smoke tests against the GREEN endpoint; freeze schema changes meanwhile
aws rds switchover-blue-green-deployment \\
  --blue-green-deployment-identifier "$BGD_ID" \\
  --switchover-timeout 300</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. Failover breaks pooled connections silently</h3>
<p>After failover, pooled sockets point at the dead primary. The first query on each fails and some drivers keep handing them out. Configure pool error handling (discard on error), validate connections, retry whole transactions, and respect DNS TTLs (JVM apps: set <code>networkaddress.cache.ttl</code> low). RDS Proxy keeps clients connected through failover.</p>

<h3>2. Read-after-write on replicas</h3>
<p>Async replication means a user's own write may be invisible on a replica for milliseconds to seconds, more under heavy write load or long transactions. Route reads of just-written data to the writer, or poll until visible.</p>

<h3>3. Queries cancelled on Postgres replicas</h3>
<p>"canceling statement due to conflict with recovery": vacuum on the primary removed row versions a long replica query needed. Options: raise <code>max_standby_streaming_delay</code> (which increases lag), enable <code>hot_standby_feedback</code> (bloats the primary), or run long analytics on a snapshot or clone or a warehouse.</p>

<h3>4. Storage full</h3>
<p>When <code>FreeStorageSpace</code> hits 0 the instance goes into <code>storage-full</code> and stops accepting writes. Storage autoscaling helps, but only up to <code>MaxAllocatedStorage</code>, and there are cooldowns between modifications. Common causes are runaway logs, bloat, or a stuck logical replication slot retaining WAL (check <code>pg_replication_slots</code>). Alarm well before it's full.</p>

<h3>5. Burstable credits exhausted</h3>
<p>A <code>db.t</code> instance runs fine for weeks, then a nightly job drains the CPU credits and every morning the API crawls. Look at <code>CPUCreditBalance</code>. Move to <code>m</code> or <code>r</code> classes for production.</p>

<h3>6. Restored instance with the wrong settings</h3>
<p>A PITR restore uses defaults unless you specify them: default parameter group (no slow-query logging, different timeouts), default security group, possibly a public subnet. Always pass parameter group, subnet group and security groups explicitly. Also remember lazy loading: the first queries are slow until blocks are fetched.</p>

<h3>7. Parameter change "did nothing"</h3>
<p>Static parameters wait in <code>pending-reboot</code>. Changing the instance's parameter group <em>itself</em> also needs a reboot. Check <code>describe-db-instances</code> for the parameter apply status.</p>

<h3>8. Encryption can't be toggled</h3>
<p>Unencrypted at creation means unencrypted forever for that instance. Migrating means snapshot, encrypted copy, restore, cutover. Cross-region copies of encrypted snapshots need a KMS key in the destination region.</p>

<h3>9. IAM tokens expire, connections don't</h3>
<p>A 15-minute token only matters at connect time, so existing connections keep working. But a pool that opens new connections later needs a <em>fresh</em> token each time. That's why <code>password</code> is a function in Example 1. Caching one token at cold start breaks after 15 minutes.</p>

<h3>10. RDS Proxy pinning erases the benefit</h3>
<p>An ORM issues <code>SET search_path</code> or <code>SET application_name</code> per session, every client gets pinned, and the proxy behaves like a 1:1 passthrough. The DB hits <code>max_connections</code> anyway. Check the pinning metric, move settings to role level or the connection string where supported, and consult the proxy's pinning conditions for your engine.</p>

<h3>11. Borrow timeouts under load</h3>
<p>When all proxy-side DB connections are busy, clients wait up to <code>ConnectionBorrowTimeout</code>, then get an error. Lambda functions then time out instead of failing fast. Cap upstream concurrency, shorten transactions, and set the borrow timeout below the function timeout.</p>

<h3>12. In-VPC Lambda can't reach Secrets Manager</h3>
<p>Moving a function into the VPC to reach RDS removes its default internet path. Calls to Secrets Manager, S3 or SQS then hang until timeout. Add interface or gateway VPC endpoints (or a NAT gateway, at a cost).</p>

<h3>13. Secret rotation mid-flight</h3>
<p>With single-user rotation, there's a short window where the cached password is wrong. Apps that don't handle <code>28P01</code> fail until a cold start. Handle it (Example 2) or use alternating users.</p>

<h3>14. Aurora reader endpoint imbalance</h3>
<p>The reader endpoint balances by DNS at <em>connect</em> time. Long-lived pools can all land on one replica while others sit idle. Use RDS Proxy's reader endpoint, more connections with periodic recycling, or a smarter driver (AWS provides advanced JDBC and Node wrappers; check current docs).</p>

<h3>15. Serverless v2 scaling surprises</h3>
<p>Minimum ACUs set too low means a cold buffer cache after scale-down, so the first queries after quiet periods are slow. Auto-pause to 0 adds resume time measured in seconds. Max ACUs too low means CPU saturation during spikes. Size the minimum for your working set, and watch <code>ServerlessDatabaseCapacity</code> and <code>ACUUtilization</code>.</p>

<h3>16. Long transactions block everything</h3>
<p>An idle-in-transaction session (often an app bug: an HTTP call made inside a transaction) holds locks, blocks DDL migrations (which then queue <em>all</em> other queries behind their lock request), and prevents vacuum. Set <code>idle_in_transaction_session_timeout</code> and <code>lock_timeout</code> for migrations. More in <a href="#/topic/be-databases">Databases</a>.</p>

<h3>17. Extended Support surprise bill</h3>
<p>The major version passes end of standard support, and a per-vCPU-hour surcharge appears automatically on every instance and replica. Track engine EOL dates like dependency upgrades.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1: a new connection (or a 10-connection pool) per Lambda invocation</h3>
<p>Connecting inside the handler costs a TLS plus auth handshake every request, and leaks connections when <code>end()</code> is skipped. A pool of 10 per environment multiplies storms by 10. <strong>Fix:</strong> module-scope pool, <code>max: 1</code>, RDS Proxy, capped concurrency.</p>

<h3>Anti-pattern 2: publicly accessible database</h3>
<p><code>PubliclyAccessible=true</code> plus a security group open to <code>0.0.0.0/0</code> on 5432 "so the team can connect from laptops" means internet-wide credential stuffing against your DB. <strong>Fix:</strong> private subnets, SG-to-SG rules, and SSM port forwarding or a VPN for humans.</p>

<h3>Anti-pattern 3: master credentials in the app</h3>
<p>The app connects as the master user with the password in a plaintext environment variable or a committed <code>.env</code>. One leak gives full DDL rights. <strong>Fix:</strong> a least-privilege app role, credentials from Secrets Manager or IAM tokens, and master credentials managed by RDS and used only for admin.</p>

<h3>Anti-pattern 4: "Multi-AZ is our DR" / "replicas are our HA"</h3>
<p>Multi-AZ protects against an AZ or instance failure in one region, not against a bad <code>DELETE</code> (it replicates the delete instantly) or a regional outage. Replicas need manual promotion and may lag. <strong>Fix:</strong> Multi-AZ for HA, PITR and snapshots (cross-region and cross-account copies) for data recovery, cross-region replicas or Aurora Global Database for regional DR, with RPO and RTO written down.</p>

<h3>Anti-pattern 5: never testing a restore</h3>
<p>Backups that have never been restored are hopes, not backups. <strong>Fix:</strong> a scheduled restore drill (restore to a new instance, run checks, delete it), with the timing recorded as your measured RTO.</p>

<h3>Anti-pattern 6: running on the default parameter group</h3>
<p>You can't change it, so when you finally need slow-query logging or a timeout at 2 a.m., you also need a reboot to switch groups. <strong>Fix:</strong> custom parameter group from day one, in IaC.</p>

<h3>Anti-pattern 7: no deletion protection, skipped final snapshot</h3>
<p>A <code>cdk destroy</code> or Terraform refactor removes prod, and automated backups go with it. <strong>Fix:</strong> <code>deletionProtection: true</code>, <code>RemovalPolicy.SNAPSHOT</code>/<code>RETAIN</code>, and periodic manual or AWS Backup snapshots, which outlive the instance.</p>

<h3>Anti-pattern 8: buying hardware for unindexed queries</h3>
<p>Scaling to a huge instance because CPU is pegged, when one missing index or an N+1 loop is the cause. <strong>Fix:</strong> Performance Insights / Database Insights and <code>pg_stat_statements</code> first, then fix queries, then scale.</p>

<h3>Anti-pattern 9: per-session SET behind RDS Proxy</h3>
<p>The ORM sets the time zone, search path or <code>statement_timeout</code> per session, and every session gets pinned. <strong>Fix:</strong> role- or database-level settings (<code>ALTER ROLE ... SET</code>), and monitor the pinning metric.</p>

<h3>Anti-pattern 10: migrations on every cold start</h3>
<p>Each new Lambda environment runs <code>prisma migrate deploy</code> or similar. You get concurrent migrators, lock contention and slow cold starts. <strong>Fix:</strong> run migrations once per deploy in the CI/CD pipeline (a dedicated task or Lambda step) before shifting traffic (see <a href="#/topic/cloud-cicd">CI/CD</a>).</p>

<h3>Anti-pattern 11: holding a transaction across external calls</h3>
<p><code>BEGIN</code>, then calling the LLM or a payment API for 8 seconds, then <code>COMMIT</code>, means locks held, a pooled connection hogged, and a proxy connection borrowed the whole time. <strong>Fix:</strong> do the external call outside the transaction (or record intent and let an outbox or worker handle it).</p>

<h3>Anti-pattern 12: ignoring engine end-of-life</h3>
<p>Staying on an old major version "because it works" brings forced upgrades at inconvenient times and Extended Support surcharges. <strong>Fix:</strong> a yearly upgrade cadence using Blue/Green.</p>

<h3>Anti-pattern 13: picking Aurora or DynamoDB by reputation</h3>
<p>"Aurora is faster", so a tiny app pays a higher baseline. Or "DynamoDB scales", so a reporting-heavy relational domain gets twisted into single-table design. <strong>Fix:</strong> start from access patterns, consistency needs, scale and team skills, and justify the choice in one sentence.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. What does RDS manage for you, and what's still your job?</div>
  <div class="qa-answer">
    <p>AWS runs the hardware, OS and engine install, applies minor patches in my maintenance window, takes automated backups with transaction logs for point-in-time recovery, and operates replication and Multi-AZ failover. I still own the schema, indexes and query performance, connection management, sizing, parameter tuning, security groups and VPC placement, encryption choices at creation, major-version upgrades, and proving that restores work. The managed part is the undifferentiated ops. Data modelling and performance stay mine.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Multi-AZ vs read replicas: what does each give you?</div>
  <div class="qa-answer">
    <p>Multi-AZ is for availability: a synchronous standby in another AZ that takes over automatically on failure or maintenance. In the classic deployment it serves no reads, and failover takes about one to two minutes while DNS flips. Read replicas are for read scaling and reporting: asynchronous, readable, with their own endpoints. They can lag and need manual promotion, so they're also a cross-region DR tool. Neither protects against a bad <code>DELETE</code>; that's what PITR is for. The newer Multi-AZ DB cluster option and Aurora blur the line by having readable standbys with faster failover.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Why do Lambda functions overwhelm RDS, and how do you fix it?</div>
  <div class="qa-answer">
    <p>Postgres connections are processes with memory cost, and <code>max_connections</code> is in the hundreds to low thousands depending on instance memory. Lambda scales by adding execution environments. Each holds its own connection, a burst can create hundreds in seconds, idle frozen environments keep sockets open, and people often use a pool of 10 per environment. The result is "too many clients" errors and memory pressure. The fixes, layered:</p>
    <ul>
      <li>a pool created outside the handler with <code>max: 1</code>;</li>
      <li>capped concurrency (SQS <code>MaximumConcurrency</code>, reserved concurrency for APIs);</li>
      <li><strong>RDS Proxy</strong>, which multiplexes many client connections onto a small pool and smooths failovers;</li>
      <li>for Aurora, optionally the Data API over HTTP, or moving the hot key-value path to DynamoDB.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. How does RDS Proxy work, and what's "pinning"?</div>
  <div class="qa-answer">
    <p>The proxy keeps a warm pool of DB connections and lends one per transaction. Between transactions, a client's session doesn't hold a DB connection, so thousands of clients share dozens of connections. It queues clients when the pool is busy (up to the borrow timeout), authenticates clients with IAM or passwords while logging into the DB with Secrets Manager credentials, and during failover it holds client connections and reconnects to the new writer. Pinning happens when a session does something stateful the proxy can't reset or share, such as <code>SET</code>, temp tables, advisory locks, or some prepared-statement usage. That client is pinned to one DB connection for the rest of the session and multiplexing is gone. I watch <code>DatabaseConnectionsCurrentlySessionPinned</code>, and move session settings to <code>ALTER ROLE ... SET</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Aurora or plain RDS Postgres? When is Aurora worth the money?</div>
  <div class="qa-answer">
    <p>Aurora separates compute from a shared storage volume replicated six ways across three AZs. Replicas don't hold their own copy, so they're cheap to add, lag typically under 100 ms, and fail over faster. Storage auto-grows. Serverless v2 gives elastic capacity, and Global Database and fast cloning are strong extras. I pay for it when I need many read replicas, tight failover RTO, global reads or DR, spiky load (Serverless v2), or cheap production-sized clones for testing. For a small or medium app with steady load, plain RDS Postgres with Multi-AZ is cheaper and simpler. I'd also check the I/O profile: in Aurora Standard, I/O is billed per request, and I/O-Optimized removes that for a higher base price.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Someone ran <code>DELETE FROM bookings</code> without a WHERE at 10:02. Walk me through recovery.</div>
  <div class="qa-answer">
    <ol>
      <li><strong>Stop the bleeding:</strong> pause the job or user responsible if it's still running.</li>
      <li><strong>Pin the time</strong> from app logs or Postgres logs.</li>
      <li><strong>Point-in-time restore to a new instance</strong> at 10:01:00, explicitly setting subnet group, security groups and parameter group.</li>
      <li>When it's available, <strong>extract just the deleted rows</strong> (<code>COPY ... TO STDOUT</code>) and reinsert them into prod with <code>ON CONFLICT DO NOTHING</code>. Every write since 10:02 survives.</li>
      <li>Verify with counts and spot checks, then tell stakeholders.</li>
      <li>Delete the restored instance or keep a snapshot for the post-mortem.</li>
    </ol>
    <p>Swapping the whole database is the last resort, because it loses later writes. Prevention: least-privilege roles (the app user can't run mass deletes on some tables), <code>statement_timeout</code>, soft deletes for critical tables, reviewed migrations, and a practised restore drill so RTO is a number, not a guess.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How do you do a major Postgres version upgrade with minimal downtime?</div>
  <div class="qa-answer">
    <p>Use RDS Blue/Green Deployments. RDS creates a "green" copy on the new version, kept in sync from the "blue" production instance (logical replication for Postgres). I run the test suite and smoke tests against green, check extensions and query plans, and freeze schema changes, since DDL isn't replicated logically. Switchover typically takes under a minute: RDS blocks writes, waits for green to catch up, then swaps endpoints so the app keeps the same hostname. Before that, I take a manual snapshot, read the engine's upgrade notes, and test on a clone. The fallback is a classic in-place upgrade in a maintenance window, which means real downtime.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. IAM database authentication vs Secrets Manager: which do you use?</div>
  <div class="qa-answer">
    <p>Often both, at different hops. For Lambda or ECS connecting to RDS Proxy, I use IAM auth. The function mints a 15-minute token from its role (<code>@aws-sdk/rds-signer</code>), so no secret is stored in the app, and revocation is just an IAM policy change, scoped with <code>rds-db:connect</code> to one DB user. The proxy then logs into Postgres with a Secrets Manager credential that rotates automatically. For direct connections, IAM auth works too (<code>GRANT rds_iam</code>), but it has connection-rate overhead, so it needs pooling. Secrets Manager suits BI tools and legacy apps. With rotation, apps must re-fetch on <code>28P01</code>, or use the alternating-users strategy to avoid a failure window.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. RDS or DynamoDB for a meeting-room booking platform?</div>
  <div class="qa-answer">
    <p>For bookings I'd pick Postgres on RDS. The core invariant, "no overlapping confirmed bookings per room", is one exclusion constraint that holds under concurrent tablet requests. Reporting queries (utilisation per floor, no-shows) are ad hoc, and the domain is relational (tenants, buildings, rooms, users, recurring series). Scale is modest: thousands of rooms, not millions of writes per second. I'd still use DynamoDB for side concerns: an idempotency-key table for the booking API, or per-tablet device state and heartbeats, where access is by key and writes are high-frequency. If the interviewer pushes to 100× scale, I'd talk about sharding by tenant, or modelling time slots as items with conditional writes in DynamoDB, and the reporting pipeline that then becomes necessary.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. FDE scenario: "Our API gets slow every weekday around 9 a.m., and sometimes returns 500s." The database is RDS Postgres. How do you investigate?</div>
  <div class="qa-answer">
    <ol>
      <li><strong>Correlate on a timeline</strong> (CloudWatch): API latency and 5xx, Lambda concurrency and duration, RDS <code>CPUUtilization</code>, <code>DatabaseConnections</code>, <code>FreeableMemory</code>, <code>ReadLatency</code>, <code>DiskQueueDepth</code>, and <code>CPUCreditBalance</code> if it's a t-class.</li>
      <li><strong>Read the 500s</strong>: "too many clients" points to a connection storm at login rush, so fix with pool size 1, RDS Proxy and concurrency caps. "Canceling statement due to statement timeout" points to slow queries.</li>
      <li><strong>Performance Insights / Database Insights</strong>: is DB load CPU-bound on one query (missing index on the "today's bookings" query that everyone hits at 9), waiting on locks (a batch job or migration holding locks), or I/O-bound (cold cache, under-provisioned IOPS)?</li>
      <li>Check <strong>scheduled jobs</strong> (reports or syncs at 9 a.m.), <strong>CPU credits</strong> exhausted by an overnight job, and <strong>pending maintenance</strong>.</li>
      <li><strong>Fix</strong> the top offender (index, query rewrite, cache the hot read, move the job off-peak or to a replica, proxy plus pool, right instance class).</li>
      <li><strong>Prove the fix</strong> with the same graphs the next morning, and leave the customer with an alarm on <code>DatabaseConnections</code> and p95 latency, plus a short write-up.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. What happens to in-flight requests during a Multi-AZ failover, and how should the app behave?</div>
  <div class="qa-answer">
    <p>The primary becomes unreachable. Open transactions roll back (uncommitted work is lost, committed work is safe because replication was synchronous), and connections break. RDS promotes the standby and repoints the endpoint's DNS, typically within one to two minutes for the classic deployment. The app should:</p>
    <ul>
      <li>treat connection errors and <code>57P01</code>/<code>08006</code> as transient;</li>
      <li>discard broken pool connections;</li>
      <li>retry the <em>whole</em> transaction with backoff and jitter, only for idempotent work, because a commit's acknowledgement can be lost;</li>
      <li>use short DNS TTLs, not cached IPs;</li>
      <li>fail fast with good errors for the user instead of hanging.</li>
    </ul>
    <p>RDS Proxy shortens this window because clients stay connected to the proxy. I'd verify the behaviour by forcing a failover in staging (<code>reboot --force-failover</code>) during a load test.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Your writes outgrow a single primary. What are your options?</div>
  <div class="qa-answer">
    <p>First confirm it's really write capacity, not slow writes. Look for indexes that slow inserts, hot-row contention, lock waits, and huge transactions. Then batch writes (multi-row inserts, an async queue that coalesces updates). Then scale up: bigger instance, faster storage (provisioned IOPS), or Aurora's storage layer. Then reduce writes to the primary: move append-heavy telemetry to DynamoDB, Kinesis or S3, and keep Postgres for transactional state. Next, partition by tenant into multiple databases (application-level sharding with a routing table), or evaluate Aurora Limitless for managed sharding. Each step adds operational complexity, so I'd show the measurements that justify the next one rather than jumping to sharding.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You separate HA (Multi-AZ), read scale (replicas) and data recovery (PITR into a new instance).</li>
    <li>You explain the Lambda connection storm and fix it with a pool of 1, concurrency caps and RDS Proxy, and you know about pinning.</li>
    <li>You never put the master password in the app: IAM tokens to the proxy, Secrets Manager rotation behind it, re-fetch on <code>28P01</code>.</li>
    <li>You retry whole transactions on failover errors, and only idempotent ones.</li>
    <li>You compare Aurora and RDS with real reasons (shared storage, replica lag, failover, Serverless v2, I/O pricing).</li>
    <li>You choose RDS vs DynamoDB from access patterns and invariants, such as the exclusion-constraint booking example.</li>
    <li>You talk about restore drills, deletion protection, custom parameter groups and Blue/Green upgrades.</li>
  </ul>
</div>
` },

  ]
});
