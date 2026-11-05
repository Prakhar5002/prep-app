window.PREP_SITE.registerTopic({
  id: "cloud-cicd",
  module: "cloud",
  title: "CI/CD & Infrastructure as Code",
  estimatedReadTime: "45 min",
  tags: ["ci-cd","github-actions","oidc","iac","cdk","sam","terraform","docker","deployment-strategies","eas","fastlane"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">CI/CD is <strong>small changes through automated gates, one immutable artifact promoted across environments</strong>, infrastructure reviewed as code, short-lived OIDC credentials, and progressive deploys that roll back on alarms.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>CI</strong> = every push and PR built, linted, type-checked and tested in a clean environment, so <code>main</code> is always releasable; <strong>continuous delivery</strong> = always deployable, human triggers prod; <strong>continuous deployment</strong> = automatic to prod.</li>
    <li><strong>Gates in cost order:</strong> install (cached) → lint/typecheck → unit tests → build once → deploy staging → smoke/e2e → approval → canary → full, with automatic rollback on alarms.</li>
    <li><strong>GitHub Actions:</strong> workflow (YAML in <code>.github/workflows/</code>, triggered by events) → jobs (fresh runners, parallel unless <code>needs</code>) → steps (<code>uses</code>/<code>run</code>); artifacts share outputs between jobs, caches only speed things up; environments add reviewers and scoped secrets.</li>
    <li><strong>OIDC to AWS:</strong> <code>id-token: write</code> → GitHub JWT → <code>AssumeRoleWithWebIdentity</code>; the trust policy pins <code>aud = sts.amazonaws.com</code> and an exact <code>sub</code> (repo + environment/branch). No stored keys.</li>
    <li><strong>Pipeline security:</strong> least-privilege <code>GITHUB_TOKEN</code>, actions pinned to SHAs, no <code>pull_request_target</code> with untrusted code, untrusted input via <code>env</code>.</li>
    <li><strong>Docker:</strong> multi-stage, lockfile-before-source layer order, non-root user, tag by git SHA / deploy by digest, match target CPU architecture.</li>
    <li><strong>IaC</strong> = cloud resources in reviewed, versioned code, not console clicks. CDK (TS → CloudFormation, grants, auto-rollback), SAM (serverless shorthand, <code>sam local</code>, built-in canaries), Terraform/OpenTofu (multi-cloud, state file you must lock and protect, no auto-rollback). Post the diff/plan on PRs; watch for "replace".</li>
    <li><strong>Environments:</strong> separate AWS accounts; build once, inject config per stage; ephemeral preview stacks per PR.</li>
    <li><strong>Strategies:</strong> rolling, blue/green, canary/linear (Lambda alias + CodeDeploy + alarms), feature flags (deploy ≠ release), shadow traffic.</li>
    <li><strong>Rollback</strong> = redeploy the previous immutable artifact or shift the alias back, and practise it. It needs the previous version to work on the current schema → <strong>expand → migrate → contract</strong>; never drop with the same release.</li>
    <li><strong>Deploy jobs:</strong> per-environment concurrency group, never cancel in progress.</li>
    <li><strong>Mobile:</strong> signing + store review + binaries that live on devices for months (no binary rollback) → staged rollouts, flags, forced-update floor, OTA (EAS Update) on matching runtime versions; EAS or Fastlane.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Calling it CI/CD while rebuilding per environment and storing an IAM user's keys in CI secrets.</strong> Prod then runs untested bytes and a leaked key never expires. Fix: build once and promote the artifact; federate CI to AWS with OIDC and a trust policy pinned to repo + environment.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"I build once and promote the same artifact through dev, staging and prod — only configuration changes between environments."</div>
  <div class="revision-say">"CI gets AWS access through OIDC: a short-lived GitHub token exchanged for role credentials, with the trust policy pinned to the repo and the prod environment, so there are no long-lived keys."</div>
  <div class="revision-say">"Prod deploys are canaries tied to alarms, and schema changes are expand–migrate–contract, so rolling back is always safe and usually automatic."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>The vocabulary, precisely</h3>
<table>
  <thead><tr><th>Term</th><th>Meaning</th><th>Interview nuance</th></tr></thead>
  <tbody>
    <tr><td>Continuous Integration</td><td>Merge small changes to the main branch often; each is built and tested automatically</td><td>It's a practice (short-lived branches, fast tests), not just "we have a CI server"</td></tr>
    <tr><td>Continuous Delivery</td><td>Every green build <em>can</em> go to production; a human decides when</td><td>Typical for regulated customers and mobile</td></tr>
    <tr><td>Continuous Deployment</td><td>Every green build <em>does</em> go to production automatically</td><td>Needs strong tests, progressive rollout and auto-rollback</td></tr>
    <tr><td>Infrastructure as Code</td><td>Cloud resources declared in versioned code, applied by a tool</td><td>Reproducible environments, reviewable infra, drift detection</td></tr>
    <tr><td>GitOps</td><td>Desired state lives in Git; an agent reconciles the cluster to it</td><td>Mostly a Kubernetes term (Argo CD, Flux)</td></tr>
  </tbody>
</table>

<h3>Why it matters: batch size is risk</h3>
<p>A release with 3 commits is easy to reason about and to roll back; a release with 300 is not. CI/CD exists to make each change small, verified and reversible. The industry's standard scorecard is the <strong>DORA metrics</strong>:</p>
<table>
  <thead><tr><th>Metric</th><th>Question it answers</th><th>What improves it</th></tr></thead>
  <tbody>
    <tr><td>Deployment frequency</td><td>How often do we ship to production?</td><td>Automation, small PRs, trunk-based development</td></tr>
    <tr><td>Lead time for changes</td><td>Commit → running in production, how long?</td><td>Fast pipelines, no manual handoffs</td></tr>
    <tr><td>Change failure rate</td><td>What share of deploys cause an incident?</td><td>Tests, canaries, feature flags</td></tr>
    <tr><td>Time to restore</td><td>How fast do we recover from a bad deploy?</td><td>One-click / automatic rollback, good alarms</td></tr>
  </tbody>
</table>

<h3>Why Infrastructure as Code</h3>
<ul>
  <li><strong>Reproducibility</strong> — dev, staging and prod are built from the same definitions, so "works in staging" means something.</li>
  <li><strong>Review</strong> — an IAM policy change shows up as a diff in a PR, not as a silent console click.</li>
  <li><strong>Recovery</strong> — you can recreate an environment (or a region) from code.</li>
  <li><strong>Ephemeral environments</strong> — spin up a full stack per pull request and tear it down on merge.</li>
  <li><strong>Least privilege by construction</strong> — CDK <code>grant*</code> methods generate scoped IAM instead of hand-written wildcards.</li>
</ul>

<h3>What interviewers probe (full-stack and FDE)</h3>
<ul>
  <li>"Walk me through your pipeline from PR to production." (stages, gates, time)</li>
  <li>"How does CI get credentials to AWS?" (OIDC, trust policy conditions)</li>
  <li>"How do you deploy safely and roll back? What about the database?"</li>
  <li>"CDK, SAM or Terraform — why?"</li>
  <li>FDE twist: "How would you deploy this into the <em>customer's</em> AWS account under their change control?"</li>
</ul>
<p>You have shipped with GitHub Actions and EAS — the goal here is to explain the <em>why</em> behind each step and defend trade-offs. Mobile release mechanics in depth live in <a href="#/topic/rn-build-release">Build &amp; Release</a>.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>The pipeline as a conveyor belt with gates</h3>
<div class="diagram">
<pre>
 PR opened ──► CI: install ─► lint ─► typecheck ─► unit tests ─► build ─► (preview env)
                                        │  required status checks + review
 merge to main ─────────────────────────▼
 build ONCE ─► artifact (zip / image@sha256 / cdk.out) ─► deploy DEV ─► deploy STAGING
                                                                            │
                                                         e2e + smoke tests ◄┘
                                                                            │ approval (environment rule)
                                                                            ▼
                                             deploy PROD: canary 10% ─► alarms quiet? ─► 100%
                                                                            │ alarm fires
                                                                            ▼
                                                        automatic rollback to previous version
</pre>
</div>
<p>Each gate is cheaper than the next: a lint failure costs seconds; a failure caught in staging costs minutes; a failure caught by a prod canary costs a few users; a failure that reaches everyone costs an incident. <strong>Fail fast, as early as possible.</strong></p>

<h3>Four principles that answer most questions</h3>
<ul>
  <li><strong>The artifact flows, the config varies.</strong> The exact bytes tested in staging are the bytes that run in prod. Environment-specific values come from parameters, environment variables or SSM/Secrets Manager — never from a rebuild.</li>
  <li><strong>The pipeline is a production system.</strong> It holds the most powerful credentials you have. Least privilege, pinned dependencies, protected branches and approvals apply to it just like to prod.</li>
  <li><strong>Deploy ≠ release.</strong> Deploying puts code on servers; releasing exposes behaviour to users. Feature flags let you deploy dark and release gradually, which makes deploys boring.</li>
  <li><strong>Desired state vs actual state.</strong> IaC declares desired state; the tool computes a plan/diff; apply converges actual state. <strong>Drift</strong> is when someone changes actual state behind the tool's back.</li>
</ul>

<h3>Environments as separate AWS accounts</h3>
<div class="diagram">
<pre>
 AWS Organization
  ├─ shared-services   ECR repos, artifact bucket, CI deploy roles' trust anchors
  ├─ dev               auto-deploy on every merge to main
  ├─ staging           auto-deploy after dev smoke tests pass
  └─ prod              manual approval + canary; console access read-only
</pre>
</div>
<p>Account boundaries are the strongest isolation AWS offers: a bug in a dev IAM policy cannot touch prod data, and per-account billing shows what each environment costs. See <a href="#/topic/cloud-aws-foundations">AWS Foundations &amp; IAM</a>.</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"We do CI/CD — we use GitHub Actions." The tool is incidental. If PRs live for two weeks, the build is redone per environment, deploys need a person on a call and nobody has rehearsed a rollback, you have automation but not CI/CD.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. Pipeline stages</h3>
<table>
  <thead><tr><th>Stage</th><th>Purpose</th><th>Typical tools</th><th>Budget</th></tr></thead>
  <tbody>
    <tr><td>Install</td><td>Reproducible dependencies</td><td><code>npm ci</code> with cache</td><td>&lt; 1 min with cache</td></tr>
    <tr><td>Static checks</td><td>Catch cheap errors first</td><td>ESLint, Prettier, <code>tsc --noEmit</code></td><td>&lt; 2 min</td></tr>
    <tr><td>Unit tests</td><td>Logic correctness</td><td>Jest / Vitest, coverage</td><td>&lt; 5 min, parallel shards</td></tr>
    <tr><td>Build</td><td>Produce the immutable artifact</td><td>esbuild, <code>cdk synth</code>, <code>docker build</code></td><td>&lt; 5 min</td></tr>
    <tr><td>Security</td><td>Dependency and image vulnerabilities, secrets</td><td>npm audit / Dependabot, Trivy / ECR scanning, secret scanning</td><td>Parallel with tests</td></tr>
    <tr><td>Deploy non-prod</td><td>Real cloud, real IAM</td><td>CDK / SAM / Terraform</td><td>Minutes</td></tr>
    <tr><td>Integration / e2e / smoke</td><td>Does the deployed system work?</td><td>API tests, Playwright, Detox/Maestro — see <a href="#/topic/test-e2e">E2E</a></td><td>&lt; 10 min</td></tr>
    <tr><td>Prod deploy</td><td>Progressive exposure</td><td>CodeDeploy canary, flags</td><td>10–30 min including bake time</td></tr>
    <tr><td>Verify</td><td>Watch SLOs, auto-rollback</td><td>CloudWatch alarms — see <a href="#/topic/cloud-cloudwatch">CloudWatch</a></td><td>Bake period</td></tr>
  </tbody>
</table>

<h3>2. GitHub Actions anatomy</h3>
<table>
  <thead><tr><th>Concept</th><th>What it is</th></tr></thead>
  <tbody>
    <tr><td>Workflow</td><td>A YAML file in <code>.github/workflows/</code></td></tr>
    <tr><td>Event / trigger</td><td><code>on:</code> push, pull_request, workflow_dispatch (manual), schedule (cron, UTC), release, workflow_call (reusable)</td></tr>
    <tr><td>Job</td><td>Runs on its own fresh runner VM; jobs run in parallel unless <code>needs:</code> orders them</td></tr>
    <tr><td>Step</td><td><code>uses:</code> an action (versioned code) or <code>run:</code> a shell command; steps share the job's filesystem</td></tr>
    <tr><td>Runner</td><td>GitHub-hosted (ubuntu, windows, macos) or self-hosted</td></tr>
    <tr><td>Artifact</td><td>Files uploaded by a run, downloadable by later jobs — the way jobs share build output</td></tr>
    <tr><td>Cache</td><td>Speed-up storage keyed by a hash (e.g. lockfile); may be evicted — never a source of truth</td></tr>
    <tr><td>Secret / variable</td><td>Encrypted values (masked in logs) vs plain config; scoped to repo, org or environment</td></tr>
    <tr><td>Environment</td><td>Named target (staging, prod) with protection rules: required reviewers, wait timer, branch restrictions, own secrets</td></tr>
    <tr><td>Expressions</td><td><code>&#36;{{ ... }}</code> reads contexts: <code>github</code>, <code>env</code>, <code>vars</code>, <code>secrets</code>, <code>matrix</code>, <code>needs</code>, <code>steps</code>, <code>inputs</code></td></tr>
  </tbody>
</table>

<pre><code class="language-yaml"># .github/workflows/ci.yml
name: ci
on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read                 # least privilege for the automatic GITHUB_TOKEN

concurrency:
  group: ci-&#36;{{ github.ref }}
  cancel-in-progress: true       # a new push to the same PR cancels the stale run

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15          # default is 360 — don't let a hung test burn 6 hours
    strategy:
      fail-fast: false
      matrix:
        node: [20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: &#36;{{ matrix.node }}
          cache: npm             # caches the npm download cache keyed on package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -- --coverage
      - uses: actions/upload-artifact@v4
        if: always()             # upload coverage even when tests fail
        with:
          name: coverage-node-&#36;{{ matrix.node }}
          path: coverage/

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build       # esbuild bundles each Lambda into dist/
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 14</code></pre>
<ul>
  <li>Steps pass values with <code>echo "version=1.4.2" &gt;&gt; "$GITHUB_OUTPUT"</code> and read them as <code>&#36;{{ steps.&lt;id&gt;.outputs.version }}</code>; jobs expose <code>outputs</code> to dependants via <code>needs</code>.</li>
  <li><strong>Script injection:</strong> never put untrusted text (PR title, branch name, issue body) directly into <code>run:</code> via <code>&#36;{{ github.event.pull_request.title }}</code> — it is pasted into the shell before execution. Pass it through <code>env:</code> and reference <code>"$TITLE"</code>.</li>
  <li><strong>Reusable workflows</strong> (<code>on: workflow_call</code>) share whole pipelines across repos; <strong>composite actions</strong> share a sequence of steps.</li>
  <li>Integration tests can start real dependencies as <code>services:</code> containers (Postgres, Redis) next to the job.</li>
</ul>

<h3>3. Secrets and OIDC federation to AWS</h3>
<div class="diagram">
<pre>
 GitHub Actions job  (permissions: id-token: write)
   │ 1. asks GitHub's OIDC provider for a signed JWT:
   │      iss = https://token.actions.githubusercontent.com
   │      aud = sts.amazonaws.com
   │      sub = repo:acme/booking-api:environment:prod
   ▼
 AWS STS  AssumeRoleWithWebIdentity(roleArn, JWT)
   │ 2. verifies the JWT signature against the registered IAM OIDC provider
   │ 3. evaluates the role's TRUST POLICY conditions on aud + sub
   ▼
 Temporary credentials (expire in about an hour) ─► cdk deploy / aws cli in the same job
</pre>
</div>
<p>Nothing long-lived is stored in GitHub, so there is no key to leak or rotate. The <strong>trust policy</strong> is where security lives:</p>
<pre><code class="language-json">{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::111122223333:oidc-provider/token.actions.githubusercontent.com"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "repo:acme/booking-api:environment:prod"
      }
    }
  }]
}</code></pre>
<ul>
  <li><code>sub</code> formats you will see: <code>repo:ORG/REPO:ref:refs/heads/main</code> (branch), <code>repo:ORG/REPO:environment:prod</code> (when the job declares an environment), <code>repo:ORG/REPO:pull_request</code>. Pinning to the <strong>prod environment</strong> means the role is only usable after the environment's required reviewers approve.</li>
  <li>Never use a bare wildcard like <code>repo:acme/*</code> on a prod role: any repo in the org (or any branch) could deploy to prod.</li>
  <li>The role's <em>permission</em> policy should be just enough to deploy. With CDK, a common pattern is to let the CI role only assume the <code>cdk-*</code> bootstrap roles.</li>
</ul>
<pre><code class="language-yaml">  deploy-prod:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: prod            # required reviewers + env secrets + sub = environment:prod
    concurrency:
      group: deploy-prod
      cancel-in-progress: false  # NEVER cancel a deploy halfway
    permissions:
      id-token: write            # allow this job to request the OIDC token
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::111122223333:role/gha-deploy-prod
          aws-region: ap-south-1
      - run: npx cdk deploy --all --require-approval never -c stage=prod</code></pre>
<pre><code class="language-ts">// The OIDC provider + deploy role, as CDK (deployed once per account)
import * as iam from 'aws-cdk-lib/aws-iam';

const provider = new iam.OpenIdConnectProvider(this, 'GitHubOidc', {
  url: 'https://token.actions.githubusercontent.com',
  clientIds: ['sts.amazonaws.com'],
  // thumbprint handling differs across CDK versions and AWS no longer
  // validates it for this provider — check current docs
});

const deployRole = new iam.Role(this, 'GhaDeployProd', {
  roleName: 'gha-deploy-prod',
  maxSessionDuration: Duration.hours(1),
  assumedBy: new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, {
    StringEquals: {
      'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
      'token.actions.githubusercontent.com:sub': 'repo:acme/booking-api:environment:prod',
    },
  }),
});
// CI only gets to assume the CDK bootstrap roles, which do the actual deploying
deployRole.addToPolicy(new iam.PolicyStatement({
  actions: ['sts:AssumeRole'],
  resources: ['arn:aws:iam::' + this.account + ':role/cdk-*'],
}));</code></pre>

<h3>4. Docker basics for CI</h3>
<pre><code class="language-text"># Dockerfile — multi-stage: build tools stay out of the runtime image
# syntax=docker/dockerfile:1
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci                                   # cached layer until the lockfile changes

FROM deps AS build
COPY . .
RUN npm run build &amp;&amp; npm prune --omit=dev

FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node                                     # do not run as root
EXPOSE 3000
CMD ["node", "dist/server.js"]</code></pre>
<ul>
  <li><strong>Layer order = cache efficiency.</strong> Copy the lockfile and install before copying source, so a code change doesn't reinstall dependencies.</li>
  <li><strong><code>.dockerignore</code></strong> <code>node_modules</code>, <code>.git</code>, <code>.env*</code>, <code>coverage</code> — smaller context, no leaked secrets.</li>
  <li><strong>Tag with the git SHA</strong> and deploy by digest (<code>image@sha256:...</code>). <code>latest</code> is not a version.</li>
  <li><strong>Match the CPU architecture</strong> of the target: an image built on an Apple Silicon laptop is arm64; a Lambda/ECS task configured as x86_64 fails with "exec format error".</li>
</ul>
<pre><code class="language-yaml">      - uses: aws-actions/amazon-ecr-login@v2
        id: ecr
      - uses: docker/setup-buildx-action@v3
      - uses: docker/build-push-action@v6
        with:
          context: .
          platforms: linux/arm64               # Graviton / Lambda arm64
          push: true
          tags: &#36;{{ steps.ecr.outputs.registry }}/booking-api:&#36;{{ github.sha }}
          cache-from: type=gha                 # reuse layers across CI runs
          cache-to: type=gha,mode=max</code></pre>

<h3>5. Infrastructure as Code: CDK, SAM, Terraform</h3>
<p><strong>CloudFormation</strong> sits under both CDK and SAM: it takes a template, computes a <em>change set</em>, applies it, and <strong>rolls the whole stack back automatically</strong> if any resource fails. CDK and SAM are two different ways of producing that template.</p>

<h4>CDK (TypeScript)</h4>
<pre><code class="language-ts">// lib/booking-stack.ts
import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

export interface BookingStackProps extends StackProps { stage: 'dev' | 'staging' | 'prod'; }

export class BookingStack extends Stack {
  constructor(scope: Construct, id: string, props: BookingStackProps) {
    super(scope, id, props);

    const dlq = new sqs.Queue(this, 'NotifyDlq', { retentionPeriod: Duration.days(14) });
    const queue = new sqs.Queue(this, 'NotifyQueue', {
      visibilityTimeout: Duration.seconds(180),        // at least 6x the consumer timeout
      deadLetterQueue: { queue: dlq, maxReceiveCount: 5 },
    });

    const apiFn = new NodejsFunction(this, 'ApiFn', {
      entry: 'src/api/handler.ts',                     // bundled with esbuild at synth time
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 512,
      timeout: Duration.seconds(10),
      environment: { QUEUE_URL: queue.queueUrl, STAGE: props.stage },
    });
    queue.grantSendMessages(apiFn);                    // scoped IAM generated for you

    const workerFn = new NodejsFunction(this, 'WorkerFn', {
      entry: 'src/worker/handler.ts',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
    });
    workerFn.addEventSource(new SqsEventSource(queue, { batchSize: 10, reportBatchItemFailures: true }));

    const api = new HttpApi(this, 'HttpApi');
    api.addRoutes({
      path: '/bookings', methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration('ApiIntegration', apiFn),
    });
  }
}

// bin/app.ts
const app = new App();
const stage = (app.node.tryGetContext('stage') ?? 'dev') as BookingStackProps['stage'];
new BookingStack(app, 'Booking-' + stage, {
  stage,
  env: { account: ACCOUNT_IDS[stage], region: 'ap-south-1' },
});</code></pre>
<ul>
  <li>Construct levels: <strong>L1</strong> (<code>Cfn*</code>, 1:1 with CloudFormation), <strong>L2</strong> (sensible defaults + <code>grant*</code> helpers), <strong>L3</strong> (patterns that wire several resources).</li>
  <li>Workflow: <code>cdk bootstrap</code> once per account/region → <code>cdk synth</code> → <code>cdk diff</code> (post it on the PR) → <code>cdk deploy</code>. <code>cdk watch</code> / hotswap are for dev only.</li>
  <li>Unit-test the synthesised template:</li>
</ul>
<pre><code class="language-ts">import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

test('queue has a DLQ and a safe visibility timeout', () =&gt; {
  const template = Template.fromStack(new BookingStack(new App(), 'T', { stage: 'prod' }));
  template.hasResourceProperties('AWS::SQS::Queue', { VisibilityTimeout: 180 });
  template.resourceCountIs('AWS::SQS::Queue', 2);
});</code></pre>

<h4>SAM (with a canary deployment built in)</h4>
<pre><code class="language-yaml">AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31          # SAM shorthand expands into CloudFormation
Globals:
  Function:
    Runtime: nodejs22.x
    Architectures: [arm64]
    Timeout: 10
Resources:
  BookingsFn:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: dist/bookings/
      Handler: index.handler
      AutoPublishAlias: live                    # publish a version + move alias 'live' each deploy
      DeploymentPreference:
        Type: Canary10Percent5Minutes           # 10% of traffic for 5 min, then 100%
        Alarms:
          - !Ref BookingsErrorsAlarm            # alarm in ALARM → CodeDeploy shifts back
      Events:
        Create:
          Type: HttpApi
          Properties:
            Path: /bookings
            Method: post
  BookingsErrorsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      Namespace: AWS/Lambda
      MetricName: Errors
      Dimensions:
        - Name: FunctionName
          Value: !Ref BookingsFn
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching</code></pre>
<p>SAM CLI: <code>sam build</code>, <code>sam local invoke</code> / <code>sam local start-api</code> (Docker-based local emulation), <code>sam deploy --guided</code>, <code>sam sync --watch</code> for fast dev iterations.</p>

<h4>Terraform / OpenTofu</h4>
<pre><code class="language-text"># main.tf
terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~&gt; 5.0" }   # pin a major; check current release
  }
  backend "s3" {
    bucket       = "acme-tf-state"
    key          = "booking/prod.tfstate"
    region       = "ap-south-1"
    encrypt      = true
    use_lockfile = true    # S3-native locking in newer Terraform; older setups use a DynamoDB lock table
  }
}

provider "aws" { region = "ap-south-1" }

resource "aws_sqs_queue" "notify_dlq" {
  name                      = "notify-dlq"
  message_retention_seconds = 1209600            # 14 days
}

resource "aws_sqs_queue" "notify" {
  name                       = "notify"
  visibility_timeout_seconds = 180
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.notify_dlq.arn
    maxReceiveCount     = 5
  })
}

resource "aws_lambda_function" "worker" {
  function_name    = "notify-worker"
  role             = aws_iam_role.worker.arn
  runtime          = "nodejs22.x"
  handler          = "index.handler"
  filename         = "dist/worker.zip"
  source_code_hash = filebase64sha256("dist/worker.zip")
  timeout          = 30
}

resource "aws_lambda_event_source_mapping" "worker_sqs" {
  event_source_arn        = aws_sqs_queue.notify.arn
  function_name           = aws_lambda_function.worker.arn
  batch_size              = 10
  function_response_types = ["ReportBatchItemFailures"]
}</code></pre>
<p>Terraform talks to AWS APIs directly and keeps its own <strong>state file</strong> mapping code to real resource IDs. State must be remote, encrypted and locked (two concurrent applies corrupt it), and it contains secrets in plain text — restrict access. <code>terraform plan</code> in the PR, <code>terraform apply</code> of that saved plan on merge.</p>

<table>
  <thead><tr><th></th><th>AWS CDK</th><th>AWS SAM</th><th>Terraform / OpenTofu</th></tr></thead>
  <tbody>
    <tr><td>Language</td><td>TypeScript, Python, Java, Go, C#</td><td>YAML (CloudFormation superset)</td><td>HCL</td></tr>
    <tr><td>Engine</td><td>CloudFormation</td><td>CloudFormation</td><td>Terraform core + providers calling APIs</td></tr>
    <tr><td>State</td><td>Managed by CloudFormation</td><td>Managed by CloudFormation</td><td>State file you store and lock</td></tr>
    <tr><td>Scope</td><td>AWS</td><td>AWS serverless</td><td>Multi-cloud + SaaS (GitHub, Cloudflare, Datadog...)</td></tr>
    <tr><td>Abstraction</td><td>High (L2/L3, grants, loops, types)</td><td>Medium (serverless shorthands)</td><td>Medium (modules)</td></tr>
    <tr><td>Local dev</td><td>Template unit tests; hotswap</td><td><code>sam local</code> emulation</td><td><code>plan</code>; Terratest</td></tr>
    <tr><td>Failure handling</td><td>Automatic stack rollback</td><td>Same + CodeDeploy traffic shifting</td><td>No auto-rollback: partial apply, then fix forward</td></tr>
    <tr><td>Speed</td><td>CloudFormation-paced</td><td>CloudFormation-paced</td><td>Usually faster</td></tr>
    <tr><td>Pick when</td><td>TS team, AWS-only, wants abstractions</td><td>Small serverless app, wants local emulation</td><td>Multi-cloud/SaaS, platform teams, customer standard</td></tr>
  </tbody>
</table>
<p>Licensing note: HashiCorp moved Terraform to the Business Source License in 2023; <strong>OpenTofu</strong> is the open-source fork with a compatible language. Pulumi is the "real programming language, multi-cloud" alternative.</p>

<h3>6. Environments and promotion</h3>
<ul>
  <li><strong>Build once, promote:</strong> the artifact (zip hash, image digest, <code>cdk.out</code>) produced from a commit is what every environment deploys.</li>
  <li><strong>Configuration per environment</strong> comes from CDK context/props, SSM Parameter Store, Secrets Manager or env vars. Frontends that bake config at build time either build per environment deliberately or fetch a runtime <code>config.json</code>.</li>
  <li><strong>GitHub environments</strong> provide required reviewers, wait timers, branch restrictions and environment-scoped secrets — and change the OIDC <code>sub</code>, which ties AWS access to the approval.</li>
  <li><strong>Ephemeral preview environments:</strong> deploy a stack named <code>Booking-pr-123</code> on PR open, destroy it on close. Great for reviewers and e2e tests; watch the cost and clean-up job.</li>
</ul>

<h3>7. Deployment strategies</h3>
<table>
  <thead><tr><th>Strategy</th><th>How</th><th>Rollback</th><th>Cost</th><th>Watch out for</th></tr></thead>
  <tbody>
    <tr><td>All at once / recreate</td><td>Replace everything</td><td>Redeploy old (slow)</td><td>Lowest</td><td>Downtime / full blast radius — dev only</td></tr>
    <tr><td>Rolling</td><td>Replace instances in batches</td><td>Roll the batches back</td><td>Low</td><td>Old and new run side by side → backward compatibility required</td></tr>
    <tr><td>Blue/green</td><td>Stand up a full new copy, switch traffic (LB, DNS, alias)</td><td>Instant switch back</td><td>2× during deploy</td><td>Shared database must suit both versions</td></tr>
    <tr><td>Canary</td><td>Small % first, watch metrics, then the rest</td><td>Fast, often automatic</td><td>Low</td><td>Needs good alarms and enough traffic for signal</td></tr>
    <tr><td>Linear</td><td>+N% every M minutes</td><td>Fast</td><td>Low</td><td>Slower total rollout</td></tr>
    <tr><td>Feature flags</td><td>Code deployed dark; enable per user/cohort/tenant</td><td>Flip the flag</td><td>Flag service</td><td>Flag debt; test both code paths — see <a href="#/topic/mprod-ab">A/B Testing</a></td></tr>
    <tr><td>Shadow / dark launch</td><td>Mirror real traffic to new version, discard responses</td><td>n/a</td><td>2× compute</td><td>Side effects (emails, charges) must be stubbed</td></tr>
  </tbody>
</table>
<p><strong>Lambda specifics:</strong> published versions are immutable; an <strong>alias</strong> points to a version and can split traffic by weight. CodeDeploy shifts the alias using configurations such as <code>Canary10Percent5Minutes</code>, <code>Linear10PercentEvery1Minute</code> or <code>AllAtOnce</code>, runs optional pre/post-traffic hook functions, and rolls back if a listed alarm fires. See <a href="#/topic/cloud-lambda">AWS Lambda</a>. <strong>Static frontends:</strong> content-hashed assets are immutable; only <code>index.html</code> changes, so rollback is re-pointing to the previous build (Amplify Hosting and similar platforms do this atomically).</p>

<h3>8. Rollback and database migrations</h3>
<ul>
  <li><strong>Roll back</strong> (redeploy previous artifact / shift alias back) when the problem is code. <strong>Roll forward</strong> (ship a fix) when data has already changed shape and going back would be worse.</li>
  <li>Rollback only works if version N−1 still runs against the current schema. That is what <strong>expand → migrate → contract</strong> guarantees:</li>
</ul>
<div class="diagram">
<pre>
 Release 1  EXPAND    ALTER TABLE bookings ADD COLUMN room_name text NULL;
                      code writes BOTH old join path and new column, still reads old
 Backfill             batched, idempotent, resumable UPDATE ... WHERE room_name IS NULL LIMIT 5000
 Release 2  MIGRATE   code reads the new column
 Release 3  CONTRACT  code stops using the old path; a later migration drops what's unused
 At every step, the previous release still works ─► rollback stays safe
</pre>
</div>
<ul>
  <li>Run migrations as an explicit pipeline step <em>before</em> the code deploy, with a lock so two pipelines can't migrate at once (<code>prisma migrate deploy</code>, Flyway, Knex, etc. — never a dev-mode migrate against prod).</li>
  <li>Never combine "drop/rename column" with the code change that stops using it.</li>
</ul>

<h3>9. Mobile CI/CD (EAS / Fastlane)</h3>
<table>
  <thead><tr><th>Concern</th><th>Backend</th><th>Mobile</th></tr></thead>
  <tbody>
    <tr><td>Who installs the release</td><td>You</td><td>The store, then each user, eventually</td></tr>
    <tr><td>Rollback</td><td>Shift traffic back in seconds</td><td>Impossible for binaries already installed — ship a fix, use OTA, halt a staged rollout</td></tr>
    <tr><td>Gate</td><td>Your alarms</td><td>Store review (hours to days)</td></tr>
    <tr><td>Signing</td><td>Rarely</td><td>Certificates, provisioning profiles, keystores — see <a href="#/topic/iosn-signing-release">iOS Signing</a> / <a href="#/topic/andr-signing-release">Android Signing</a></td></tr>
  </tbody>
</table>
<ul>
  <li><strong>EAS Build</strong> (cloud builds, managed credentials), <strong>EAS Submit</strong> (store upload), <strong>EAS Update</strong> (over-the-air JS/asset updates delivered to binaries with a matching <code>runtimeVersion</code>, via channels).</li>
  <li><strong>Fastlane</strong>: <code>match</code> (signing assets in an encrypted repo), <code>gym</code>/<code>build_app</code>, <code>pilot</code> (TestFlight), <code>supply</code> (Play) — free, local or any CI, more maintenance.</li>
  <li>macOS runners are needed for iOS builds and cost considerably more per minute than Linux — check current pricing; that is part of why teams use EAS or a self-hosted Mac.</li>
  <li>Use <strong>staged rollouts</strong> (Play percentage rollout, App Store phased release) plus feature flags and a remote "minimum supported version" so a bad binary can be contained.</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — PR to production for a serverless API (CDK + OIDC)</h3>
<pre><code class="language-yaml"># .github/workflows/deploy.yml
name: deploy
on:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npx cdk synth -c stage=prod -o cdk.out      # the artifact: templates + bundled assets
      - uses: actions/upload-artifact@v4
        with:
          name: cdk-out
          path: cdk.out/

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    concurrency:
      group: deploy-staging
      cancel-in-progress: false
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: &#36;{{ vars.STAGING_DEPLOY_ROLE_ARN }}
          aws-region: ap-south-1
      - run: npx cdk deploy Booking-staging -c stage=staging --require-approval never --outputs-file out.json
      - name: Smoke test
        run: |
          API_URL=$(jq -r '."Booking-staging".ApiUrl' out.json)
          npm run smoke -- --base-url "$API_URL"

  deploy-prod:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: prod                                   # pauses here for required reviewers
    concurrency:
      group: deploy-prod
      cancel-in-progress: false
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - uses: actions/download-artifact@v4
        with:
          name: cdk-out
          path: cdk.out/
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: &#36;{{ vars.PROD_DEPLOY_ROLE_ARN }}
          aws-region: ap-south-1
      - run: npx cdk deploy Booking-prod --app cdk.out --require-approval never   # deploy the SAME synth output</code></pre>
<p>Notes: staging deploys from source with a staging context while prod deploys the pre-synthesised <code>cdk.out</code>; for strict "build once", synthesise <em>all</em> stages in the build job and deploy each from <code>cdk.out</code> with <code>--app</code>. Role ARNs are <code>vars</code>, not secrets — they are not sensitive, and that keeps secrets for actual secrets.</p>

<h3>Example 2 — Show the infra diff on every PR</h3>
<pre><code class="language-yaml">  infra-diff:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
      pull-requests: write                # to comment on the PR
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: &#36;{{ vars.READONLY_DIFF_ROLE_ARN }}   # read-only role, PR-scoped sub
          aws-region: ap-south-1
      - run: npx cdk diff Booking-prod -c stage=prod 2&gt;&amp;1 | tee diff.txt
      - run: gh pr comment "$PR" --body-file diff.txt
        env:
          GH_TOKEN: &#36;{{ github.token }}
          PR: &#36;{{ github.event.number }}</code></pre>
<p>Reviewers now see "IAM policy statement added" or, crucially, "<strong>[-/+] replace</strong> AWS::RDS::DBInstance" before merge. The Terraform equivalent is posting <code>terraform plan</code> output and applying exactly that saved plan file on merge.</p>

<h3>Example 3 — A reusable workflow shared by many services</h3>
<pre><code class="language-yaml"># .github/workflows/node-service.yml  (in a shared "platform" repo)
on:
  workflow_call:
    inputs:
      working-directory: { type: string, required: true }
      node-version:      { type: string, default: '22' }

jobs:
  ci:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: &#36;{{ inputs.working-directory }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: &#36;{{ inputs.node-version }}
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test

# caller, in each service repo:
# jobs:
#   ci:
#     uses: acme/platform/.github/workflows/node-service.yml@v3
#     with:
#       working-directory: services/bookings</code></pre>
<p>One place to improve caching, security scanning or Node versions for every team. Version it with tags (<code>@v3</code>) like any library.</p>

<h3>Example 4 — Ephemeral preview stacks per PR</h3>
<pre><code class="language-yaml">on:
  pull_request:
    types: [opened, synchronize, reopened, closed]

jobs:
  preview:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    env:
      STACK: Booking-pr-&#36;{{ github.event.number }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: &#36;{{ vars.DEV_DEPLOY_ROLE_ARN }}
          aws-region: ap-south-1
      - if: github.event.action != 'closed'
        run: npx cdk deploy "$STACK" -c stage=dev -c prId=&#36;{{ github.event.number }} --require-approval never
      - if: github.event.action == 'closed'
        run: npx cdk destroy "$STACK" -c stage=dev -c prId=&#36;{{ github.event.number }} --force</code></pre>
<p>Use cheap settings in preview stacks (no NAT gateway, on-demand tables, short log retention) and a nightly sweeper that deletes stacks whose PR is closed — cleanup jobs fail sometimes.</p>

<h3>Example 5 — React Native release pipeline with EAS</h3>
<pre><code class="language-yaml">name: mobile
on:
  pull_request:
  push:
    tags: ['v*']

jobs:
  preview-update:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: &#36;{{ secrets.EXPO_TOKEN }}
      - run: npm ci
      - run: npx tsc --noEmit &amp;&amp; npm test
      - run: eas update --branch pr-&#36;{{ github.event.number }} --message "PR &#36;{{ github.event.number }}" --non-interactive

  store-release:
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: &#36;{{ secrets.EXPO_TOKEN }}
      - run: npm ci
      - run: eas build --platform all --profile production --non-interactive --auto-submit</code></pre>
<ul>
  <li>PRs get an OTA update on their own branch that QA opens in a dev/preview build — no store round trip.</li>
  <li>Tags build signed binaries in EAS's cloud (Linux runner is enough because the iOS build runs on EAS) and submit to TestFlight / Play internal track.</li>
  <li>OTA updates only reach binaries with the same <code>runtimeVersion</code>; adding a native module requires a new binary. A fingerprint-based runtime-version policy makes that automatic.</li>
</ul>

<h3>Example 6 — Auto-rollback for a Lambda API in CDK</h3>
<pre><code class="language-ts">import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

const alias = new lambda.Alias(this, 'Live', { aliasName: 'live', version: apiFn.currentVersion });

const errors = new cloudwatch.Alarm(this, 'LiveErrors', {
  metric: alias.metricErrors({ period: Duration.minutes(1) }),
  threshold: 1,
  evaluationPeriods: 2,
  treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
});

new codedeploy.LambdaDeploymentGroup(this, 'ApiDeploy', {
  alias,
  deploymentConfig: codedeploy.LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
  alarms: [errors],                       // ALARM during the canary → traffic shifts back automatically
});
// API Gateway integrates with the ALIAS, never with $LATEST</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. Pull requests from forks</h3>
<p><code>pull_request</code> runs from forks get no secrets and a read-only token — by design. <code>pull_request_target</code> runs in the base repo's context <em>with</em> secrets; checking out and running the fork's code there hands your secrets to a stranger. Never combine the two.</p>

<h3>2. OIDC "Not authorized to perform sts:AssumeRoleWithWebIdentity"</h3>
<p>Usually the <code>sub</code> doesn't match: adding <code>environment: prod</code> to a job changes <code>sub</code> from <code>...:ref:refs/heads/main</code> to <code>...:environment:prod</code>. Also check the job has <code>permissions: id-token: write</code> and that <code>aud</code> is <code>sts.amazonaws.com</code>.</p>

<h3>3. Cancelling a deploy midway</h3>
<p><code>cancel-in-progress: true</code> is great for CI, dangerous for deploys: killing the runner mid-CloudFormation leaves the stack updating with nobody watching, and the next deploy may queue behind it. Use a per-environment concurrency group without cancellation.</p>

<h3>4. Required checks stuck "pending"</h3>
<p>If a workflow is skipped by a <code>paths</code> filter, its required check never reports and the PR cannot merge. Run a lightweight always-on job, or do path detection inside the job instead of at the trigger.</p>

<h3>5. Resource replacement hidden in a refactor</h3>
<p>Renaming a CDK construct ID or changing an immutable property (a table's key, a DB's identifier) makes CloudFormation <strong>replace</strong> the resource — delete and recreate — which can wipe data. Read <code>cdk diff</code> for "replace", set <code>RemovalPolicy.RETAIN</code> on stateful resources, and enable stack termination protection in prod.</p>

<h3>6. UPDATE_ROLLBACK_FAILED</h3>
<p>A rollback can fail too, typically because someone deleted or changed a resource manually. You continue the rollback while skipping the broken resources, then reconcile — one more reason to block console writes in prod.</p>

<h3>7. Terraform lock stuck</h3>
<p>A cancelled apply leaves the state lock held. <code>terraform force-unlock</code> only after confirming no apply is actually running, or you corrupt state.</p>

<h3>8. Canary with no traffic</h3>
<p>At 3 a.m. a 10% canary on a low-traffic API gets zero requests, so error alarms stay quiet and the deploy "passes". Use synthetic canary traffic or a pre-traffic hook that exercises the new version.</p>

<h3>9. CPU architecture mismatch</h3>
<p>Native dependencies (sharp, bcrypt, Prisma engines) built on an arm64 Mac or an x86 runner must match the Lambda/ECS architecture. Build inside the target platform (Docker <code>--platform</code>, or bundle on a matching runner).</p>

<h3>10. Secrets that escape masking</h3>
<p>Masking matches the exact secret string. A secret that is base64-encoded, JSON-parsed or split across lines prints in clear text. Don't echo derived values; register them with <code>::add-mask::</code> if you must handle them.</p>

<h3>11. Cache restoring stale or poisoned content</h3>
<p>Broad <code>restore-keys</code> can restore an old <code>node_modules</code> that hides a lockfile problem. Cache downloads (npm cache), not install outputs, and key strictly on the lockfile hash.</p>

<h3>12. Scheduled workflows quietly stop</h3>
<p>Cron triggers run in UTC, can be delayed at busy times, and in public repos are disabled after a long period without repository activity. Don't hang a business-critical job on GitHub cron without monitoring it.</p>

<h3>13. CDK bootstrap missing in a new region/account</h3>
<p>The first deploy to a new region fails until <code>cdk bootstrap</code> creates the staging bucket and roles there; bootstrap stack versions must also satisfy the CDK version you use.</p>

<h3>14. Lambda alias + provisioned concurrency</h3>
<p>Provisioned concurrency is attached to an alias/version; during traffic shifting both versions need it or the canary half sees cold starts that look like a regression.</p>

<h3>15. Monorepo dependency changes</h3>
<p>A change in a shared <code>packages/types</code> must trigger CI for every service that imports it; naive path filters on <code>services/x/**</code> miss it. Use the workspace graph (Nx/Turborepo "affected") — see <a href="#/topic/build-monorepos">Monorepos</a>.</p>

<h3>16. OTA update that needs native code</h3>
<p>An EAS Update that imports a native module not in the installed binary crashes on launch. Runtime-version policies (fingerprint) and a pre-publish check prevent it; a quick republish of the previous update is the rollback.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — long-lived AWS keys in CI secrets</h3>
<p>An IAM user's access key stored in GitHub never expires, gets copied into other repos and leaks via logs or compromised actions. Use OIDC federation with short-lived role credentials.</p>

<h3>Anti-pattern 2 — over-broad OIDC trust</h3>
<p><code>StringLike sub: repo:acme/*</code> on a prod role lets any repo and any branch deploy production. Pin the repo <em>and</em> the environment or branch, and keep prod roles separate from dev roles.</p>

<h3>Anti-pattern 3 — building per environment</h3>
<p>Rebuilding for prod means prod runs bytes nobody tested (a dependency release in between is enough). Build once; inject config.</p>

<h3>Anti-pattern 4 — ClickOps in production</h3>
<p>A "quick fix" in the console creates drift; the next IaC deploy silently reverts it or fails. Make prod console access read-only and codify every change.</p>

<h3>Anti-pattern 5 — unpinned third-party actions</h3>
<p><code>uses: some/action@main</code> runs whatever is on that branch today with your secrets in reach. The 2025 <code>tj-actions/changed-files</code> compromise exposed secrets in many repos' logs this way. Pin to a full commit SHA and let Dependabot propose bumps.</p>

<h3>Anti-pattern 6 — deploying from laptops</h3>
<p><code>cdk deploy</code> with admin credentials from a developer machine: unreviewed, unreproducible, and the laptop holds prod keys. Every prod change goes through the pipeline.</p>

<h3>Anti-pattern 7 — canaries without alarms</h3>
<p>A canary that nothing watches is just a slower deploy. Wire error-rate, latency and business alarms to the deployment so it rolls back on its own.</p>

<h3>Anti-pattern 8 — migrations that break rollback</h3>
<p>Dropping or renaming a column in the same release as the code change. If that release is rolled back, the old code crashes against the new schema. Expand, migrate, contract.</p>

<h3>Anti-pattern 9 — gates that don't gate</h3>
<p><code>continue-on-error: true</code> sprinkled on tests, no required status checks, flaky tests re-run until green. The pipeline exists but stops nothing. Quarantine flaky tests visibly and fix them.</p>

<h3>Anti-pattern 10 — the 45-minute monolithic workflow</h3>
<p>Everything sequential, no caching, full e2e on every commit. Developers start batching changes to avoid waiting — exactly what CI is meant to prevent. Parallelise, cache, run "affected only", and move slow suites to merge or nightly.</p>

<h3>Anti-pattern 11 — mutable image tags</h3>
<p>Deploying <code>:latest</code> or <code>:prod</code> means you can't say what's running or roll back to "the previous one". Tag with the git SHA and deploy by digest.</p>

<h3>Anti-pattern 12 — one AWS account for everything</h3>
<p>Dev experiments share IAM, quotas and blast radius with prod. Use separate accounts per environment under AWS Organizations.</p>

<h3>Anti-pattern 13 — secrets in Terraform state or CDK context without protection</h3>
<p>Terraform state stores resource attributes, including generated passwords, in plain text. Lock down the state bucket, enable encryption, and prefer Secrets Manager-generated secrets referenced by ARN.</p>

<h3>Anti-pattern 14 — permanent feature flags</h3>
<p>Flags that never get removed multiply code paths and test combinations. Give every release flag an owner and an expiry.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. Walk me through the CI/CD pipeline you'd build for a TypeScript serverless API.</div>
  <div class="qa-answer">
    <p>On every PR: <code>npm ci</code> with cache, lint, typecheck, unit tests (parallel), <code>cdk synth</code> and a <code>cdk diff</code> posted to the PR, plus dependency and secret scanning; all required checks. On merge to main: build once (bundled Lambdas + <code>cdk.out</code>), deploy to dev then staging via OIDC roles, run API smoke and e2e tests, then a prod job gated by a GitHub environment with reviewers. Prod uses Lambda aliases with a CodeDeploy canary (10% for 5 minutes) tied to error and latency alarms, so it rolls back automatically. Migrations run as a separate locked step using expand/contract. Target: PR feedback under 10 minutes, merge to prod under an hour.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Continuous delivery or continuous deployment — which would you pick?</div>
  <div class="qa-answer">
    <p>Continuous deployment when the safety net is strong: good automated tests, progressive rollout, alarms that trigger rollback and feature flags for risky behaviour — then every merge reaching prod keeps batches small. Continuous delivery (a human approves prod) when customers require change control, when the system lacks good automated verification yet, or for mobile where store review is a manual gate anyway. Either way the pipeline and artifact are the same; only the final trigger differs.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. How do your GitHub Actions jobs get AWS credentials?</div>
  <div class="qa-answer">
    <p>OIDC federation. The job declares <code>permissions: id-token: write</code>; <code>aws-actions/configure-aws-credentials</code> requests a JWT from GitHub (issuer <code>token.actions.githubusercontent.com</code>, audience <code>sts.amazonaws.com</code>, subject like <code>repo:acme/api:environment:prod</code>) and calls <code>AssumeRoleWithWebIdentity</code>. AWS validates the signature against the IAM OIDC provider and the role's trust policy checks <code>aud</code> and <code>sub</code>. The job gets credentials that expire within about an hour. Nothing long-lived is stored, and binding <code>sub</code> to the prod environment ties AWS access to the environment's approval rule.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. CDK, SAM or Terraform — how do you choose?</div>
  <div class="qa-answer">
    <p>CDK when the team writes TypeScript and targets only AWS: real language, types, loops, <code>grant*</code> helpers for least-privilege IAM, and CloudFormation's automatic rollback. SAM for small serverless apps where local emulation (<code>sam local</code>) and built-in canary deploys matter more than abstraction. Terraform/OpenTofu when infrastructure spans clouds or SaaS (GitHub, Cloudflare, Datadog), when a platform team already standardised on it, or when a customer mandates it — accepting that you manage state and there's no automatic rollback. For an FDE, the customer's existing standard usually wins.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Compare blue/green, canary, rolling and feature flags.</div>
  <div class="qa-answer">
    <p>Rolling replaces instances in batches — cheap, but old and new run together so changes must be backward compatible. Blue/green stands up a full new copy and switches traffic at once — instant switch-back, double capacity during the deploy. Canary sends a small percentage first and watches metrics — limited blast radius, needs alarms and enough traffic. Feature flags work at the code level: deploy dark, release per tenant or cohort, roll back by flipping a flag without a deploy. In practice I combine a canary deploy (infrastructure safety) with flags (behaviour safety).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How do you roll back — and what about the database?</div>
  <div class="qa-answer">
    <p>Code rollback is redeploying the previous immutable artifact or shifting the Lambda alias / load balancer back — ideally automatic on alarm. It only works if the previous version runs against the current schema, so schema changes are expand → migrate → contract: add new structures in a backward-compatible way, backfill in batches, switch reads, and remove old structures in a later release. Destructive migrations never ship with the code that stops using the old structure. If data was already transformed irreversibly, I roll forward with a fix instead.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. The pipeline takes 40 minutes. How do you speed it up?</div>
  <div class="qa-answer">
    <ul>
      <li>Measure first: per-job and per-step timings.</li>
      <li>Cache dependency downloads; use <code>npm ci</code>; cache Docker layers (<code>type=gha</code>).</li>
      <li>Parallelise: lint, typecheck and test as separate jobs; shard tests.</li>
      <li>Only run what changed (Nx/Turborepo affected graph) in monorepos.</li>
      <li>Fail fast: cheap checks first; <code>timeout-minutes</code> on every job.</li>
      <li>Push slow e2e suites to post-merge or nightly with a small smoke set on PRs.</li>
      <li>Bigger runners for CPU-bound steps when cheaper than developer waiting time.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How do you secure the pipeline itself?</div>
  <div class="qa-answer">
    <p>Treat it as production: OIDC instead of stored keys, roles scoped per environment with tight <code>sub</code> conditions; default <code>GITHUB_TOKEN</code> permissions read-only and raised per job; third-party actions pinned to commit SHAs; no <code>pull_request_target</code> running untrusted code; untrusted inputs passed via <code>env</code> to avoid script injection; branch protection, required reviews and environment approvals for prod; secret scanning and dependency scanning; and audit logs of who approved which deployment.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. What is drift and how do you deal with it?</div>
  <div class="qa-answer">
    <p>Drift is when real infrastructure no longer matches the IaC definition — usually a console hotfix. It's dangerous because the next deploy may revert the fix or fail. Detect it with CloudFormation drift detection or a scheduled <code>terraform plan</code> that alerts on changes; resolve by either codifying the change or re-applying the code. Prevent it by making prod console access read-only (SCPs / permission sets) and routing every change through the pipeline, including an emergency "break-glass" path that is audited.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. How is CI/CD for a React Native app different?</div>
  <div class="qa-answer">
    <p>Code signing (certificates, profiles, keystores), store review as a gate, and no real rollback: installed binaries stay on devices. So the strategy is prevention and containment: thorough pre-release testing on TestFlight/internal tracks, staged rollouts you can halt, feature flags, a forced-update mechanism, and OTA updates (EAS Update) for JS-only fixes on the same runtime version. Tooling: EAS Build/Submit/Update or Fastlane (match, gym, pilot, supply) on CI; macOS runners only if you build iOS yourself.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. (FDE) The customer requires your product to be deployed into <em>their</em> AWS account, with no long-lived keys and every change approved by their change board. How?</div>
  <div class="qa-answer">
    <ol>
      <li><strong>Package the infra as a versioned release</strong>: a CDK app or Terraform module plus pinned artifacts (Lambda zips / image digests in a registry they can pull from).</li>
      <li><strong>Credentials</strong>: either their pipeline deploys it with their own OIDC role, or they create a cross-account deploy role that trusts our CI's role with an <code>ExternalId</code> and a permissions boundary they control. No IAM users.</li>
      <li><strong>Change approval</strong>: every release ships with release notes, the <code>cdk diff</code> / <code>terraform plan</code> against their environment, and a rollback plan; their board approves the plan, and we apply exactly that plan.</li>
      <li><strong>Environments</strong>: deploy to their staging account first, run our smoke tests there, then prod in their window.</li>
      <li><strong>Observability</strong>: alarms and dashboards are part of the stack, so their on-call sees the same signals we do.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. (FDE) After yesterday's release a customer reports intermittent 500s. What do you do?</div>
  <div class="qa-answer">
    <ol>
      <li><strong>Check impact and correlate with the deploy</strong>: error rate and latency by version/alias around the deploy time in CloudWatch.</li>
      <li><strong>Mitigate first</strong>: if the new version correlates, roll back (shift the alias / redeploy the previous artifact) or turn off the new feature flag — before root-causing.</li>
      <li><strong>Then diagnose</strong>: logs and traces for the failing requests (one tenant? one region? one endpoint?), the release diff, config changes, a migration that didn't run.</li>
      <li><strong>Fix forward</strong> with a test that reproduces it, and add the missing guard (an alarm that would have auto-rolled back, a contract test).</li>
      <li><strong>Communicate</strong>: acknowledge quickly, give the customer a timeline, and send a short post-incident summary.</li>
    </ol>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You describe gates in order of cost and say "build once, promote".</li>
    <li>You explain OIDC trust conditions instead of "we store the keys in secrets".</li>
    <li>You can compare CDK, SAM and Terraform and pick one for a stated context.</li>
    <li>You pair canaries with alarms and know Lambda alias traffic shifting.</li>
    <li>You make rollback safe with expand/contract migrations.</li>
    <li>You treat the pipeline as a production system (pinned actions, least privilege, no fork secrets).</li>
    <li>You know why mobile releases need staged rollouts, flags and OTA instead of rollback.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Sketch a GitHub Actions workflow with a test matrix, caching, an artifact hand-off and a gated prod job.</div>
  <div class="qa-answer">
    <p>A <code>test</code> job uses <code>strategy.matrix</code> (for example <code>node: [20, 22]</code>, <code>fail-fast: false</code>) and <code>actions/setup-node</code> with <code>cache: npm</code>, which caches downloads keyed on <code>package-lock.json</code>; it runs <code>npm ci</code>, lint, typecheck and tests, with a <code>timeout-minutes</code> so a hung test can't burn the 6-hour default. A <code>build</code> job (<code>needs: test</code>) builds once and uploads <code>dist/</code> with <code>actions/upload-artifact</code>.</p>
    <p>The <code>deploy-prod</code> job declares <code>environment: prod</code> (required reviewers, env secrets, and an OIDC <code>sub</code> of <code>environment:prod</code>), <code>permissions: id-token: write</code>, and a <code>concurrency</code> group with <code>cancel-in-progress: false</code> so a deploy is never cut off halfway. It downloads the same <code>dist</code> artifact, assumes the deploy role via <code>configure-aws-credentials</code>, and runs <code>cdk deploy</code>. Caches only speed things up; the artifact is what carries the build between jobs.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q14. Plan a column rename that stays safe to roll back at every step.</div>
  <div class="qa-answer">
    <p>Never rename in place, and never combine the rename or drop with the code change that stops using the old column. Use expand → migrate → contract across releases: <strong>Release 1 (expand)</strong> adds the new nullable column and the code writes both old and new while still reading the old; a <strong>backfill</strong> copies data in batched, idempotent, resumable updates (<code>... WHERE new_col IS NULL LIMIT 5000</code>); <strong>Release 2 (migrate)</strong> switches reads to the new column; <strong>Release 3 (contract)</strong> stops using the old one, and a later migration drops it.</p>
    <p>At every step the previous release still works against the current schema, so redeploying the old artifact stays safe. Migrations run as an explicit, locked pipeline step before the code deploy.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q15. What can EAS Update fix in a released mobile app, and what can't it?</div>
  <div class="qa-answer">
    <p>It can ship over-the-air JS and asset changes to installed binaries that have a matching <code>runtimeVersion</code>, via channels, which makes it the fast "rollback" for JS-only bugs (republishing the previous update is the rollback for a bad update). It cannot change native code: adding or upgrading a native module needs a new binary through the store, and an update that imports a native module missing from the installed binary crashes on launch. A fingerprint-based runtime-version policy and a pre-publish check prevent that. For everything else you rely on staged rollouts you can halt, feature flags and a forced-update floor.</p>
  </div>
</div>
` },

  ]
});
