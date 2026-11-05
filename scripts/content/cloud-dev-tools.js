window.PREP_SITE.registerTopic({
  id: "cloud-dev-tools",
  module: "cloud",
  title: "AWS Developer Tools (CodeCommit, CodeBuild, CodePipeline)",
  estimatedReadTime: "42 min",
  tags: ["aws","codecommit","codebuild","codepipeline","codedeploy","buildspec","cdk","ci-cd","blue-green","canary","github-actions"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline"><strong>CodePipeline orchestrates</strong> stages of actions, <strong>CodeBuild executes</strong> a buildspec in a fresh container, <strong>CodeDeploy shifts traffic</strong> with rollback, and <strong>CodeCommit or GitHub (via CodeConnections) is the source</strong> — glued by IAM roles and a KMS-encrypted S3 artifact bucket.</div>
  <h4>Key points</h4>
  <ul>
    <li>CodeCommit: Git with IAM auth (<code>git-remote-codecommit</code> preferred); closed to new customers in July 2024, later reopened by AWS — check current docs before choosing it.</li>
    <li><strong>CodeBuild</strong> = serverless build containers: a source, a (managed) image, a compute size, an IAM service role and a <code>buildspec.yml</code>; billed per build minute.</li>
    <li>buildspec 0.2: env (variables, parameter-store, secrets-manager, exported-variables) → phases install/pre_build/build/post_build → reports → artifacts → cache.</li>
    <li>post_build runs after a failed build — guard pushes on <code>CODEBUILD_BUILD_SUCCEEDING</code>.</li>
    <li>Sources: GitHub/GitLab/Bitbucket via <strong>CodeConnections</strong> (formerly CodeStar Connections), CodeCommit, S3 or ECR.</li>
    <li>Pipeline = stages → actions (parallel by <code>runOrder</code>) → artifacts in S3; V2 adds trigger filters, variables, and queued/parallel modes.</li>
    <li>Cross-account needs a customer-managed KMS key + bucket policy + deploy-role trust + <code>iam:PassRole</code>.</li>
    <li>CodeDeploy: EC2/on-prem in-place/blue-green with appspec hooks; Lambda canary/linear/all-at-once via weighted aliases; ECS blue/green via target-group switch; alarms → auto-rollback.</li>
    <li>Build once, promote the same artifact/image digest; tag by commit SHA.</li>
    <li>No long-lived keys: service roles for CodeBuild, OIDC for GitHub Actions.</li>
    <li>Pipelines are code (CDK / CloudFormation); CDK Pipelines self-mutate.</li>
    <li><strong>Why AWS-native:</strong> everything stays in your accounts (IAM roles not long-lived keys, private VPC access during builds, CloudTrail audit, cross-account deploys via roles). <strong>Why not:</strong> clunkier developer experience and a smaller ecosystem than GitHub Actions.</li>
    <li>Hybrid is normal: GitHub Actions for PR CI, CodePipeline/CodeDeploy for promotion.</li>
    <li>Low-traffic canaries need pre-traffic hooks; DB migrations need expand/contract.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Asserting CodeCommit's status from memory.</strong> It was closed to new customers in 2024 and later reopened — say that it changed, that you'd check current AWS docs, and that the source action is the only part of the pipeline that depends on the answer. The other classic trap: a "canary" with no alarms, which is just a slow all-at-once deploy.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"CodePipeline orchestrates, CodeBuild executes, CodeDeploy shifts traffic — and IAM roles plus a KMS-encrypted artifact bucket are what make it work across accounts."</div>
  <div class="revision-say">"I build once and promote the same artifact through staging and prod, with a manual gate and a canary whose alarms trigger automatic rollback."</div>
  <div class="revision-say">"I'd pick GitHub Actions with OIDC for developer experience, or CodePipeline when the customer needs everything inside their AWS accounts — and hybrids are fine."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What each service does</h3>
<table>
  <thead><tr><th>Service</th><th>Role in the pipeline</th><th>Unit of work</th><th>Billed by (at time of writing — check pricing page)</th></tr></thead>
  <tbody>
    <tr><td>CodeCommit</td><td>Source control (Git)</td><td>Repository</td><td>Active users per month, free tier for small teams</td></tr>
    <tr><td>CodeBuild</td><td>Run build/test/package commands in a fresh container</td><td>Build (one buildspec run)</td><td>Build minutes × compute type</td></tr>
    <tr><td>CodePipeline</td><td>Orchestrate stages, approvals, artifact hand-off</td><td>Pipeline execution</td><td>V1: per active pipeline/month; V2: per action-execution minute</td></tr>
    <tr><td>CodeDeploy</td><td>Roll out a revision with a deployment strategy + rollback</td><td>Deployment to a deployment group</td><td>Free for EC2/Lambda/ECS; per on-prem instance update</td></tr>
    <tr><td>CodeArtifact (related)</td><td>Private npm/PyPI/Maven registry, upstream proxy</td><td>Package version</td><td>Storage + requests</td></tr>
    <tr><td>CodeConnections (related)</td><td>OAuth-style app connection to GitHub/GitLab/Bitbucket</td><td>Connection</td><td>—</td></tr>
  </tbody>
</table>

<h3>Why teams pick the AWS-native stack</h3>
<ul>
  <li><strong>Identity:</strong> builds run with an IAM <em>service role</em>; deploys into other accounts assume cross-account roles. No AWS access keys stored in a third-party CI.</li>
  <li><strong>Network:</strong> CodeBuild can run inside your VPC to reach private RDS, internal package mirrors, or integration-test endpoints.</li>
  <li><strong>Compliance &amp; audit:</strong> every action is a CloudTrail event; approvals are recorded; artifacts are KMS-encrypted in S3.</li>
  <li><strong>Deployment strategies:</strong> CodeDeploy's Lambda canary/linear and ECS blue/green with alarms and automatic rollback are mature and "free" for those compute types.</li>
  <li><strong>Infrastructure as code:</strong> the whole pipeline is a CDK/CloudFormation resource, reviewed in PRs like any other code.</li>
</ul>

<h3>Why teams don't (or only partly)</h3>
<ul>
  <li>Developer experience: PR checks, logs and re-runs are nicer in GitHub Actions/GitLab CI; marketplace actions save time.</li>
  <li>CodeCommit lacks the PR/review/issue ecosystem of GitHub, and its availability change in 2024 pushed many teams to migrate away (check current status before choosing it).</li>
  <li>Multi-cloud or non-AWS targets fit a cloud-neutral CI better.</li>
</ul>

<h3>The common hybrid</h3>
<div class="diagram">
<pre>
 GitHub repo
   │  PR opened ─────────► GitHub Actions: lint, unit tests, type-check (fast feedback)
   │  merge to main
   ▼
 CodeConnections ─► CodePipeline (in tools account)
                       ├─ Build: CodeBuild (package, integration tests in VPC)
                       ├─ Deploy staging: CloudFormation/CDK (assume role in staging acct)
                       ├─ Manual approval
                       └─ Deploy prod: CodeDeploy canary + alarms (assume role in prod acct)
</pre>
</div>
<p>Alternative hybrid: GitHub Actions for everything, authenticating to AWS with <strong>OIDC</strong> (the <code>aws-actions/configure-aws-credentials</code> action assuming a role) — no stored keys — and calling CodeDeploy or <code>cdk deploy</code> from the workflow.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>1. Pipeline = stages of actions passing artifacts</h3>
<div class="diagram">
<pre>
 ┌──────── Source ───────┐   ┌──────── Build ─────────┐   ┌──── Approve ────┐   ┌──────── Deploy ─────────┐
 │ GitHub (connection)    │   │ CodeBuild project       │   │ Manual approval  │   │ CloudFormation / ECS /   │
 │ output: SourceArtifact ├──►│ input: SourceArtifact   ├──►│ (SNS notify)     ├──►│ CodeDeploy action        │
 └────────────────────────┘   │ output: BuildArtifact   │   └──────────────────┘   │ input: BuildArtifact     │
                              └─────────────────────────┘                          └──────────────────────────┘
          artifacts are zip files in the pipeline's S3 artifact bucket (KMS-encrypted)
</pre>
</div>
<ul>
  <li>Actions in the same stage with the same <code>runOrder</code> run in parallel; higher <code>runOrder</code> runs after.</li>
  <li>A stage runs one execution at a time. With the default <strong>superseded</strong> mode, a newer execution can replace an older one waiting to enter a stage; <strong>queued</strong> (V2) processes executions in order; <strong>parallel</strong> (V2) runs executions independently (useful for branch/PR pipelines).</li>
</ul>

<h3>2. Who assumes which role</h3>
<div class="diagram">
<pre>
 Tools account                                         Prod account
 ─────────────                                         ────────────
 CodePipeline service role ──assume──► CodeBuild service role (build, push to ECR)
          │
          └──assume──► "deploy role" in prod account (trust policy: tools account pipeline)
                              │
                              └─ passes ──► CloudFormation execution role (creates resources)
 Artifact bucket + KMS key: bucket policy and key policy must allow the prod deploy role to read!
</pre>
</div>
<p>Most "AccessDenied" pipeline failures are one of: the role trust policy, a missing <code>iam:PassRole</code>, or the artifact bucket/KMS key policy not granting the cross-account role.</p>

<h3>3. CodeBuild run lifecycle</h3>
<div class="diagram">
<pre>
 SUBMITTED → QUEUED → PROVISIONING (container from image) → DOWNLOAD_SOURCE
   → INSTALL → PRE_BUILD → BUILD → POST_BUILD → UPLOAD_ARTIFACTS → FINALIZING → COMPLETED
 (each phase runs the buildspec's commands; a failing command fails the phase)
</pre>
</div>
<p>Every build starts from a clean container — nothing persists unless you configure <strong>cache</strong> (S3 or local) or upload <strong>artifacts</strong>. With buildspec <code>version: 0.2</code>, all commands run in the same shell instance, so <code>cd</code> and exported variables persist from one command (and phase) to the next. (Version 0.1 ran each command in a separate shell — a reason old examples chain everything with <code>&amp;&amp;</code>.)</p>

<h3>4. CodeDeploy strategies at a glance</h3>
<table>
  <thead><tr><th>Compute</th><th>Strategies</th><th>Traffic switch mechanism</th><th>Lifecycle hooks</th></tr></thead>
  <tbody>
    <tr><td>EC2 / on-prem</td><td>In-place (AllAtOnce, HalfAtATime, OneAtATime, custom) or blue/green (new ASG)</td><td>Agent installs revision; ELB deregister/register</td><td>ApplicationStop, BeforeInstall, AfterInstall, ApplicationStart, ValidateService (scripts in <code>appspec.yml</code>)</td></tr>
    <tr><td>Lambda</td><td>Canary (e.g. 10% for 5 min), Linear (e.g. +10% every minute), AllAtOnce</td><td>Weighted alias between two versions</td><td>BeforeAllowTraffic, AfterAllowTraffic (validation Lambdas)</td></tr>
    <tr><td>ECS</td><td>Blue/green with canary / linear / all-at-once</td><td>ALB/NLB listener switches target groups (optional test listener)</td><td>BeforeInstall, AfterInstall, AfterAllowTestTraffic, BeforeAllowTraffic, AfterAllowTraffic</td></tr>
  </tbody>
</table>
<p>Note: Amazon ECS has since added its own built-in blue/green deployment option; whether you use that or CodeDeploy for ECS is worth checking against current AWS docs.</p>

<h3>5. Where generic CI/CD theory maps</h3>
<table>
  <thead><tr><th>Concept (see <a href="#/topic/cloud-cicd">CI/CD</a>)</th><th>AWS service / feature</th></tr></thead>
  <tbody>
    <tr><td>Trigger on push/PR/tag</td><td>CodePipeline V2 triggers with branch/path/tag filters; CodeBuild webhooks</td></tr>
    <tr><td>Build once, deploy many</td><td>One BuildArtifact / ECR image digest promoted through stages</td></tr>
    <tr><td>Secrets in CI</td><td>buildspec <code>env.secrets-manager</code> / <code>parameter-store</code>, service role permissions</td></tr>
    <tr><td>Gates / approvals</td><td>Manual approval action; stage conditions (V2 — check current docs)</td></tr>
    <tr><td>Progressive delivery</td><td>CodeDeploy canary/linear + alarms</td></tr>
    <tr><td>Rollback</td><td>CodeDeploy auto-rollback; CloudFormation stack rollback; pipeline stage rollback (V2)</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. CodeCommit — repos and authentication</h3>
<div class="callout warn">
  <div class="callout-title">Availability — read before choosing CodeCommit</div>
  <p>On 25 July 2024 AWS announced CodeCommit would no longer be available to <em>new</em> customers (accounts that hadn't used it could not create repositories), while existing customers continued as normal; AWS published migration guides to other Git providers. AWS subsequently revised that decision and announced the service was open again. Because this has changed more than once, <strong>check the current CodeCommit documentation / AWS blog for its status</strong> before recommending it, and be ready to discuss both "use it" and "migrate off it" in an interview.</p>
</div>
<pre><code class="language-bash"># Create a repo
aws codecommit create-repository --repository-name booking-api   --repository-description "Booking backend" --region ap-south-1

# Option A (recommended): git-remote-codecommit — uses your AWS CLI profile / SSO / role creds
pip install git-remote-codecommit
git clone codecommit::ap-south-1://dev-profile@booking-api

# Option B: the AWS CLI credential helper over HTTPS
git config --global credential.helper '!aws codecommit credential-helper $@'
git config --global credential.UseHttpPath true
git clone https://git-codecommit.ap-south-1.amazonaws.com/v1/repos/booking-api

# Option C: IAM user Git credentials (static username/password) or SSH public key on an IAM user
#           — works with any Git client but means long-lived credentials; avoid where possible.</code></pre>
<pre><code class="language-json">{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow",
      "Action": ["codecommit:GitPull", "codecommit:GitPush"],
      "Resource": "arn:aws:codecommit:ap-south-1:111122223333:booking-api" },
    { "Effect": "Deny",
      "Action": ["codecommit:GitPush", "codecommit:DeleteBranch", "codecommit:PutFile", "codecommit:MergeBranchesByFastForward"],
      "Resource": "arn:aws:codecommit:ap-south-1:111122223333:booking-api",
      "Condition": { "StringEqualsIfExists": { "codecommit:References": ["refs/heads/main"] } } }
  ]
}</code></pre>
<p>That second statement is the CodeCommit way to protect <code>main</code>: deny direct pushes to the branch via IAM, forcing changes through pull requests. Approval rule templates (required approvers) cover the review side. Triggers/notifications send events to SNS, Lambda or EventBridge.</p>

<h3>2. CodeBuild — project anatomy</h3>
<table>
  <thead><tr><th>Setting</th><th>Choices / notes</th></tr></thead>
  <tbody>
    <tr><td>Source</td><td>CodePipeline (artifact), GitHub/GitLab/Bitbucket, CodeCommit, S3, or none</td></tr>
    <tr><td>Environment image</td><td>AWS-managed standard images (multiple runtimes; pick versions via <code>runtime-versions</code>), or your own image from ECR / Docker Hub</td></tr>
    <tr><td>Compute</td><td>EC2-based containers (small → 2xlarge, ARM or x86, GPU), Lambda compute for fast short builds, or reserved capacity fleets (check current options)</td></tr>
    <tr><td>Privileged mode</td><td>Required to run the Docker daemon (building images)</td></tr>
    <tr><td>Service role</td><td>What the build can do in AWS: logs, artifact bucket, ECR push, secrets read</td></tr>
    <tr><td>VPC config</td><td>Subnets + security groups to reach private resources (needs NAT for internet)</td></tr>
    <tr><td>Timeout / queue timeout</td><td>Fail stuck builds instead of burning minutes</td></tr>
  </tbody>
</table>

<h3>3. buildspec.yml — a production Node example</h3>
<pre><code class="language-yaml">version: 0.2

env:
  shell: bash
  variables:
    NODE_ENV: "production"
  parameter-store:
    SENTRY_ORG: "/booking/ci/sentry-org"
  secrets-manager:
    NPM_TOKEN: "booking/ci/npm:token"          # secret-id:json-key
  exported-variables:
    - IMAGE_TAG                                # visible to later pipeline actions

phases:
  install:
    runtime-versions:
      nodejs: 20
    commands:
      - npm config set //registry.npmjs.org/:_authToken "$NPM_TOKEN"
      - npm ci --no-audit --prefer-offline
  pre_build:
    commands:
      - export IMAGE_TAG="$(echo "$CODEBUILD_RESOLVED_SOURCE_VERSION" | cut -c1-12)"
      - npm run lint
      - npm run typecheck
  build:
    commands:
      - npm test -- --ci --reporters=default --reporters=jest-junit
      - npm run build
  post_build:
    commands:
      - echo "Build finished with status $CODEBUILD_BUILD_SUCCEEDING for \${IMAGE_TAG}"

reports:
  unit-tests:
    files: ["junit.xml"]
    file-format: JUNITXML

artifacts:
  base-directory: dist
  files:
    - "**/*"
  name: booking-api-$IMAGE_TAG

cache:
  paths:
    - "/root/.npm/**/*"</code></pre>
<ul>
  <li><strong>Phases</strong> run in order; a non-zero exit fails the phase. <code>post_build</code> runs even if <code>build</code> failed (check <code>CODEBUILD_BUILD_SUCCEEDING</code>: 1 or 0), which is where people put notifications — and accidentally push images from failed builds.</li>
  <li><strong>Secrets</strong> come from Parameter Store / Secrets Manager at runtime using the service role, are masked in logs, and never live in the buildspec.</li>
  <li><strong>Useful built-in variables:</strong> <code>CODEBUILD_RESOLVED_SOURCE_VERSION</code> (commit id), <code>CODEBUILD_BUILD_NUMBER</code>, <code>CODEBUILD_SRC_DIR</code>, <code>CODEBUILD_BUILD_SUCCEEDING</code>, <code>AWS_REGION</code>.</li>
  <li><strong>Cache:</strong> S3 cache (shared across hosts, upload/download cost) or local cache modes (source, Docker layer, custom paths — best-effort, only when the same host is reused).</li>
</ul>

<h3>4. buildspec for a container image</h3>
<pre><code class="language-yaml">version: 0.2
env:
  variables:
    REPO_NAME: "booking-api"
phases:
  pre_build:
    commands:
      - ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
      - REGISTRY="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
      - aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$REGISTRY"
      - IMAGE_TAG=$(echo "$CODEBUILD_RESOLVED_SOURCE_VERSION" | cut -c1-12)
  build:
    commands:
      - docker build --pull -t "$REGISTRY/$REPO_NAME:$IMAGE_TAG" .
  post_build:
    commands:
      - |
        if [ "$CODEBUILD_BUILD_SUCCEEDING" = "1" ]; then
          docker push "$REGISTRY/$REPO_NAME:$IMAGE_TAG"
          printf '[{"name":"api","imageUri":"%s"}]' "$REGISTRY/$REPO_NAME:$IMAGE_TAG" &gt; imagedefinitions.json
        fi
artifacts:
  files:
    - imagedefinitions.json</code></pre>
<p><code>imagedefinitions.json</code> is what CodePipeline's standard ECS deploy action reads (container name → image URI). For CodeDeploy ECS blue/green, the action instead expects <code>imageDetail.json</code> plus an <code>appspec.yaml</code> and task definition template.</p>

<h3>5. CodePipeline in CDK (TypeScript)</h3>
<pre><code class="language-ts">import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';

export class BookingPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const source = new codepipeline.Artifact('Source');
    const built = new codepipeline.Artifact('Built');

    const build = new codebuild.PipelineProject(this, 'Build', {
      buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec.yml'),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      cache: codebuild.Cache.local(codebuild.LocalCacheMode.SOURCE, codebuild.LocalCacheMode.CUSTOM),
      timeout: cdk.Duration.minutes(20),
    });

    new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineType: codepipeline.PipelineType.V2,
      stages: [
        {
          stageName: 'Source',
          actions: [new actions.CodeStarConnectionsSourceAction({
            actionName: 'GitHub',
            owner: 'acme', repo: 'booking-api', branch: 'main',
            connectionArn: 'arn:aws:codeconnections:ap-south-1:111122223333:connection/abc',
            output: source,
          })],
        },
        {
          stageName: 'Build',
          actions: [new actions.CodeBuildAction({ actionName: 'Build', project: build, input: source, outputs: [built] })],
        },
        {
          stageName: 'DeployStaging',
          actions: [new actions.CloudFormationCreateUpdateStackAction({
            actionName: 'Deploy', stackName: 'booking-staging', adminPermissions: false,
            templatePath: built.atPath('template.yaml'),
          })],
        },
        {
          stageName: 'Approve',
          actions: [new actions.ManualApprovalAction({ actionName: 'PromoteToProd' })],
        },
      ],
    });
  }
}</code></pre>
<p>For CodeCommit as the source, swap in <code>actions.CodeCommitSourceAction({ actionName, repository, branch, output })</code>. CDK also offers a higher-level <strong>CDK Pipelines</strong> module (<code>aws-cdk-lib/pipelines</code>: <code>CodePipeline</code>, <code>ShellStep</code>, <code>CodePipelineSource.connection(...)</code>, <code>addStage</code>) that self-mutates — the pipeline updates itself when you change its definition. Connection ARN prefixes differ for older <code>codestar-connections</code> connections; copy the real ARN from the console.</p>

<h3>6. Driving pipelines and builds from the CLI</h3>
<pre><code class="language-bash">aws codepipeline start-pipeline-execution --name booking-pipeline
aws codepipeline get-pipeline-state --name booking-pipeline   --query 'stageStates[].{stage:stageName,status:latestExecution.status}'
aws codepipeline list-pipeline-executions --pipeline-name booking-pipeline --max-items 5

aws codebuild start-build --project-name booking-build   --source-version feature/payment-retry   --environment-variables-override name=RUN_E2E,value=true,type=PLAINTEXT
aws codebuild batch-get-builds --ids "booking-build:1a2b3c..." --query 'builds[0].phases[].[phaseType,phaseStatus]'

# Approve a manual approval action (token from get-pipeline-state)
aws codepipeline put-approval-result --pipeline-name booking-pipeline --stage-name Approve   --action-name PromoteToProd --token "$TOKEN" --result summary="QA ok",status=Approved</code></pre>

<h3>7. CodeDeploy — Lambda canary with automatic rollback (CDK)</h3>
<pre><code class="language-ts">import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

const fn = new lambda.Function(this, 'BookingFn', {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset('dist/booking'),
});
const alias = new lambda.Alias(this, 'Live', { aliasName: 'live', version: fn.currentVersion });

const errors = new cloudwatch.Alarm(this, 'LiveErrors', {
  metric: alias.metricErrors({ period: cdk.Duration.minutes(1) }),
  threshold: 5, evaluationPeriods: 1,
});

new codedeploy.LambdaDeploymentGroup(this, 'Deploy', {
  alias,
  deploymentConfig: codedeploy.LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
  alarms: [errors],                         // alarm fires during shift → automatic rollback
  autoRollback: { failedDeployment: true, deploymentInAlarm: true },
});</code></pre>
<p>Every <code>cdk deploy</code> that changes the function publishes a new version; CodeDeploy shifts 10% of the <code>live</code> alias to it for 5 minutes, then 100% — or rolls back if the alarm fires. Clients (including mobile apps) always invoke the alias, never <code>$LATEST</code>.</p>

<h3>8. appspec.yml for EC2 in-place</h3>
<pre><code class="language-yaml">version: 0.0
os: linux
files:
  - source: /
    destination: /srv/booking-api
hooks:
  ApplicationStop:
    - location: scripts/stop.sh
      timeout: 60
  AfterInstall:
    - location: scripts/install_deps.sh
      timeout: 300
  ApplicationStart:
    - location: scripts/start.sh
      timeout: 60
  ValidateService:
    - location: scripts/healthcheck.sh     # curl localhost:3000/health; non-zero exit = failed deployment
      timeout: 120</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — Serverless booking backend (Lambda + S3 + SQS) for a mobile app</h3>
<p>Context: a meeting-room booking product. React Native apps and wall tablets call an API Gateway → Lambda backend; S3 stores floor-plan images; SQS buffers calendar-sync jobs. Goal: every merge to <code>main</code> reaches staging automatically; prod needs one approval and must be canary-safe because tablets are in every meeting room.</p>
<div class="diagram">
<pre>
 GitHub main ─► CodePipeline (tools account, V2, QUEUED mode)
   Source   : CodeConnections → SourceArtifact
   Build    : CodeBuild — npm ci, lint, unit tests (JUnit report), cdk synth → cdk.out artifact
   Staging  : CodeBuild "cdk deploy" assuming staging deploy role
              + CodeBuild integration tests (in VPC) against the staging API
   Approve  : manual approval (SNS → Slack) with link to test report
   Prod     : CodeBuild "cdk deploy" assuming prod role
              → Lambda functions shift via CodeDeploy canary 10% / 5 min
              → alarms: 5xx rate on API stage, Lambda errors, SQS DLQ depth &gt; 0
</pre>
</div>
<ul>
  <li><strong>Build once:</strong> the synthesised <code>cdk.out</code> from the Build stage is deployed to both staging and prod — no re-synth with different code.</li>
  <li><strong>Queued mode:</strong> merges arriving during a canary wait in order instead of superseding each other mid-promotion.</li>
  <li><strong>Mobile-specific:</strong> the API is versioned and backward compatible because old app versions stay installed for months; the canary's error alarm catches breaking changes that only old clients hit.</li>
</ul>

<h3>Example 2 — Pipeline triggers with filters (V2)</h3>
<pre><code class="language-yaml"># Fragment of a V2 pipeline declaration (CloudFormation-style) — field names: check current docs
Triggers:
  - ProviderType: CodeStarSourceConnection
    GitConfiguration:
      SourceActionName: GitHub
      Push:
        - Branches:
            Includes: ["main"]
          FilePaths:
            Excludes: ["docs/**", "mobile/**"]     # don't redeploy backend for app-only changes
        - Tags:
            Includes: ["v*"]</code></pre>
<p>Path filters matter in a monorepo (backend + RN app in one repo): mobile-only commits shouldn't redeploy Lambdas, and backend commits shouldn't kick off a mobile build pipeline.</p>

<h3>Example 3 — Migrating off CodeCommit to GitHub (mirror-then-switch)</h3>
<pre><code class="language-bash"># 1. Mirror everything (all branches, tags) — run from a machine with access to both
git clone --mirror codecommit::ap-south-1://ops@booking-api booking-api.git
cd booking-api.git
git remote add github git@github.com:acme/booking-api.git
git push --mirror github

# 2. Create a CodeConnections connection to GitHub (console handshake), then point
#    the pipeline's Source action at it (CDK: CodeStarConnectionsSourceAction).
# 3. Freeze pushes to CodeCommit (IAM deny GitPush), re-mirror once more, switch developers' remotes.
# 4. Recreate branch protection / required reviews in GitHub; port CodeCommit triggers to
#    GitHub webhooks or EventBridge rules.
# 5. Keep the CodeCommit repo read-only for a retention period, then archive.</code></pre>

<h3>Example 4 — GitHub Actions vs CodePipeline for the same job</h3>
<pre><code class="language-yaml"># .github/workflows/deploy.yml — GitHub Actions deploying to AWS via OIDC (no stored keys)
name: deploy
on:
  push:
    branches: [main]
permissions:
  id-token: write
  contents: read
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci &amp;&amp; npm test
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::111122223333:role/gha-deploy
          aws-region: ap-south-1
      - run: npx cdk deploy --require-approval never BookingStack</code></pre>
<table>
  <thead><tr><th></th><th>GitHub Actions</th><th>CodePipeline + CodeBuild</th></tr></thead>
  <tbody>
    <tr><td>PR feedback / DX</td><td>Excellent, inline in PRs</td><td>Basic; status via connection</td></tr>
    <tr><td>AWS auth</td><td>OIDC role (good), keys (bad)</td><td>Native IAM service roles</td></tr>
    <tr><td>Private VPC access</td><td>Self-hosted runners (you operate them)</td><td>Built-in VPC config</td></tr>
    <tr><td>Ecosystem</td><td>Huge marketplace</td><td>Smaller; you write shell</td></tr>
    <tr><td>Progressive deploys</td><td>DIY or call CodeDeploy</td><td>CodeDeploy actions built in</td></tr>
    <tr><td>Audit / compliance</td><td>GitHub audit log</td><td>CloudTrail, same account boundary as workloads</td></tr>
    <tr><td>Cost model</td><td>Runner minutes (free tier)</td><td>Build minutes + pipeline pricing</td></tr>
  </tbody>
</table>
<p>A useful middle ground exists: CodeBuild can host managed GitHub Actions runners (workflow jobs run on CodeBuild compute inside your account) — check current docs for setup.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<ul>
  <li><strong>Superseded executions:</strong> in the default mode, rapid merges can skip intermediate commits at a stage — fine for "deploy latest", surprising if you expected every commit to reach prod. Use queued mode or tag-based triggers when every release must be deployed.</li>
  <li><strong>Cross-account artifacts:</strong> the default AWS-managed S3 key cannot be shared cross-account. Cross-account pipelines need a customer-managed KMS key whose policy allows the target account roles (CDK's <code>crossAccountKeys: true</code> creates it).</li>
  <li><strong>Cross-region actions:</strong> each region used by an action needs an artifact bucket in that region (CDK creates "support stacks").</li>
  <li><strong>Docker Hub rate limits</strong> on base-image pulls from shared CodeBuild IPs — mirror base images to ECR (pull-through cache) instead of pulling anonymously.</li>
  <li><strong>CodeBuild in a VPC</strong> loses internet unless the subnets route through a NAT gateway — <code>npm ci</code> hangs, not fails fast. Put it in private subnets with NAT, or use VPC endpoints + an internal package mirror (CodeArtifact).</li>
  <li><strong>Local cache is best-effort:</strong> it only helps when builds land on the same host; don't design for a warm cache.</li>
  <li><strong>post_build on failure:</strong> it still runs — guard deploy/push steps on <code>CODEBUILD_BUILD_SUCCEEDING</code>.</li>
  <li><strong>Lambda canary with low traffic:</strong> 10% of near-zero traffic for 5 minutes may send zero requests to the new version; alarms see nothing and it "passes". Add a pre-traffic hook that invokes the new version, or use synthetic canaries.</li>
  <li><strong>Database migrations</strong> don't roll back with CodeDeploy. Use expand/contract migrations so old and new code both work during the shift.</li>
  <li><strong>Manual approvals expire</strong> after a time limit (seven days at time of writing — check docs); stale approvals fail the execution.</li>
  <li><strong>CodeCommit availability changes:</strong> automation that creates repos per tenant/project could break for accounts without existing usage — verify current status.</li>
</ul>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<table>
  <thead><tr><th>Anti-pattern</th><th>What goes wrong</th><th>Do instead</th></tr></thead>
  <tbody>
    <tr><td>AWS access keys as plaintext build env vars or in GitHub secrets</td><td>Leaked, never rotated, broad blast radius</td><td>Service roles (CodeBuild) or OIDC role assumption (GitHub Actions)</td></tr>
    <tr><td><code>AdministratorAccess</code> on the CodeBuild/CloudFormation roles</td><td>A malicious dependency in <code>npm ci</code> owns the account</td><td>Least privilege; separate build role from deploy role; deploy role scoped per account</td></tr>
    <tr><td>Rebuilding for each environment</td><td>Prod runs a binary nobody tested</td><td>Build once, promote the same artifact / image digest</td></tr>
    <tr><td>Deploying with <code>:latest</code> image tags</td><td>Non-reproducible, rollbacks pick the wrong image</td><td>Commit-SHA tags or digests</td></tr>
    <tr><td>Secrets echoed in buildspec commands</td><td>Secrets appear in CloudWatch logs</td><td><code>secrets-manager</code>/<code>parameter-store</code> env sections; avoid <code>set -x</code></td></tr>
    <tr><td>Pushing images in post_build unconditionally</td><td>Broken images published</td><td>Guard on <code>CODEBUILD_BUILD_SUCCEEDING</code></td></tr>
    <tr><td>Canary without alarms</td><td>Just a slow all-at-once deploy</td><td>Alarm on errors/latency/DLQ; auto-rollback on alarm</td></tr>
    <tr><td>Click-ops pipelines</td><td>Drift, no review, can't recreate</td><td>CDK/CloudFormation for pipelines, buildspec in repo</td></tr>
    <tr><td>One giant pipeline for a monorepo with no path filters</td><td>Mobile copy changes redeploy the backend</td><td>V2 trigger path filters or separate pipelines</td></tr>
    <tr><td>Long-lived IAM user Git credentials for CodeCommit</td><td>Static secrets on laptops</td><td><code>git-remote-codecommit</code> with SSO/role credentials</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. Explain CodeCommit, CodeBuild, CodePipeline and CodeDeploy in one breath.</div>
  <div class="qa-answer">
    <p>CodeCommit hosts Git repos with IAM auth; CodeBuild runs your buildspec in a fresh managed container; CodePipeline orchestrates stages of actions — source, build, approval, deploy — passing artifacts through S3; CodeDeploy rolls a revision out to EC2, ECS or Lambda with in-place, blue/green, canary or linear strategies and alarm-based rollback. Each is optional; GitHub is a common source via CodeConnections.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What's the status of CodeCommit — would you choose it for a new project?</div>
  <div class="qa-answer">
    <p>In July 2024 AWS closed it to new customers while supporting existing ones, and published migration guides; AWS later reversed that and reopened it. Because the status has moved, I'd check current AWS docs first. Then decide on merits: CodeCommit wins if everything must stay inside AWS accounts with IAM-only access; GitHub/GitLab win on PR workflow, ecosystem and hiring familiarity. Either way the pipeline design barely changes — only the source action does.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Walk me through a buildspec.</div>
  <div class="qa-answer">
    <p>Version 0.2; <code>env</code> for plain variables, Parameter Store and Secrets Manager values, and exported variables; <code>phases</code> install (runtime versions, dependencies), pre_build (login to ECR, compute tags, lint), build (test, compile, docker build), post_build (push, write deploy manifests — guarded on success because it runs even after failure); <code>reports</code> for test results; <code>artifacts</code> for files handed to the next stage; <code>cache</code> for dependency directories.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. How do artifacts move between stages, and what breaks cross-account?</div>
  <div class="qa-answer">
    <p>Each action writes output artifacts as zips into the pipeline's S3 artifact bucket; downstream actions declare them as inputs. Cross-account, the target account's role must be able to read that bucket and decrypt with its KMS key — which means a customer-managed key with a key policy granting those roles, plus a bucket policy. The default AWS-managed key can't be shared, which is the classic cross-account failure.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Compare deployment strategies CodeDeploy supports and when you'd use each.</div>
  <div class="qa-answer">
    <p>In-place (EC2): cheapest, but capacity drops during the rollout and rollback means redeploying the old version. Blue/green: stand up a new fleet or task set, shift traffic, keep the old one for instant rollback — costs double capacity briefly. Canary: a small slice (10%) for a bake period, then the rest — best risk/time trade-off for Lambda and ECS when you have alarms. Linear: equal increments over time — smoother but slower. All-at-once: dev/test only.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How do you keep secrets and credentials safe in these pipelines?</div>
  <div class="qa-answer">
    <p>No long-lived keys: CodeBuild uses its service role; GitHub Actions uses OIDC to assume a narrowly-scoped role. Secrets come from Secrets Manager/Parameter Store via the buildspec <code>env</code> section and are masked in logs. Separate roles for build vs deploy, deploy roles per target account with trust limited to the pipeline, and least-privilege policies so a compromised dependency during <code>npm ci</code> can't do much.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Superseded vs queued vs parallel execution modes?</div>
  <div class="qa-answer">
    <p>Superseded (default): a newer execution can replace an older one waiting at a stage boundary — fast to "latest", but some commits never reach later stages. Queued (V2): executions wait their turn and all go through in order — right when every release must deploy. Parallel (V2): executions run independently — good for per-branch or PR validation pipelines, not for shared environments.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. CodePipeline or GitHub Actions — how do you decide for a customer?</div>
  <div class="qa-answer">
    <p>Ask where the code lives, what compliance demands (all execution inside their AWS org? audit in CloudTrail?), whether builds need private VPC access, and what the team already knows. GitHub Actions with OIDC is usually fastest for teams on GitHub; CodePipeline/CodeBuild fit regulated teams or those needing VPC-internal builds and CodeDeploy strategies. Hybrid — Actions for PR CI, CodePipeline for promotion — is common and defensible.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How would you make a Lambda canary actually safe?</div>
  <div class="qa-answer">
    <p>Alarms on what users feel (5xx rate, latency p95, business errors, DLQ depth) wired to automatic rollback; a pre-traffic hook that invokes the new version with smoke tests, because low-traffic canaries may see zero real requests; backward-compatible API and expand/contract DB migrations so both versions can run together; and clients always calling the alias.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. FDE scenario: a customer says "our CodePipeline takes 25 minutes and the team is pushing to prod by hand instead". What do you do?</div>
  <div class="qa-answer">
    <p>Measure first: per-stage and per-phase timings from <code>get-pipeline-state</code> and CodeBuild phase durations. Typical wins: cache dependencies (S3 or local), ECR pull-through cache for base images, bigger compute for the build phase, running lint/unit/integration as parallel actions (same <code>runOrder</code>), skipping irrelevant changes with V2 path filters, moving fast checks to PR-time CI so the pipeline only promotes, and replacing fixed sleeps with health-check hooks. Then remove the manual path by giving them a fast, trusted route — an emergency hotfix lane through the same pipeline — and lock down direct prod access.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. A deploy action fails with AccessDenied in the prod account. How do you debug?</div>
  <div class="qa-answer">
    <p>Read which principal and action are denied (CloudTrail in both accounts). Check, in order: the deploy role's trust policy allows the pipeline role from the tools account; the pipeline role has <code>sts:AssumeRole</code> on it; <code>iam:PassRole</code> for the CloudFormation execution role; the artifact bucket policy and KMS key policy grant the prod role read/decrypt; and SCPs in the org aren't blocking the action or region. See <a href="#/topic/cloud-aws-foundations">AWS Foundations &amp; IAM</a> for policy evaluation order.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. How would you migrate a repository and its pipeline from CodeCommit to GitHub?</div>
  <div class="qa-answer">
    <p>First, state the status carefully: in July 2024 AWS closed CodeCommit to new customers while existing ones carried on, published migration guides, and later reopened the service, so check current docs. If the customer still wants GitHub, use mirror-then-switch: <code>git clone --mirror</code> from CodeCommit and <code>git push --mirror</code> to GitHub so every branch and tag comes across. Create a CodeConnections connection to GitHub and point the pipeline's Source action at it; the rest of the pipeline doesn't change.</p>
    <p>Then freeze pushes to CodeCommit with an IAM deny on <code>GitPush</code>, re-mirror once more, and switch developers' remotes. Recreate branch protection and required reviews in GitHub, port CodeCommit triggers to GitHub webhooks or EventBridge rules, and keep the old repo read-only for a retention period before archiving it.</p>
  </div>
</div>
` },

  ]
});
