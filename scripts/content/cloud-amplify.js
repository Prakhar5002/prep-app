window.PREP_SITE.registerTopic({
  id: "cloud-amplify",
  module: "cloud",
  title: "Amplify",
  estimatedReadTime: "38 min",
  tags: ["aws","amplify","amplify-gen2","appsync","dynamodb","cognito","s3","cdk","hosting","react-native","full-stack"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Amplify Gen 2 is <strong>CDK with opinions plus a typed client</strong>: <code>defineAuth</code> → Cognito, <code>defineData</code> → AppSync + DynamoDB, <code>defineStorage</code> → S3 with identity-pool IAM, <code>defineFunction</code> → Lambda. Great for fast CRUD/real-time apps; use escape hatches for the gaps and plain CDK when the gaps become the app.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Three separable pieces:</strong> the Gen 2 backend (TypeScript → CDK → CloudFormation), Hosting (Git CI/CD, CDN, SSR, previews), and client libraries (<code>aws-amplify</code> v6 modular, UI <code>Authenticator</code>), which also work against non-Amplify Cognito and S3.</li>
    <li><strong>The trade is speed and conventions vs control:</strong> a small team gets authenticated, real-time CRUD with file uploads in hours, with end-to-end types from schema to client, but pays with opinionated data modelling (DynamoDB per model behind GraphQL) and escape hatches once it leaves the happy path.</li>
    <li><strong>Gen 1 vs Gen 2:</strong> CLI + GraphQL directives + <code>amplify env</code> + DataStore, vs TypeScript + CDK + per-developer sandboxes + branch environments + <code>amplify_outputs.json</code>. There is no DataStore in Gen 2.</li>
    <li><strong>No markup on backend resources:</strong> you pay for Cognito, AppSync, DynamoDB, S3 and Lambda directly. Hosting is billed for builds, bandwidth and SSR.</li>
    <li><strong>Data</strong> = a table per model, generated CRUD and subscriptions, and auth rules enforced in AppSync resolvers (<code>owner</code>, <code>group</code>, <code>authenticated</code>, <code>publicApiKey</code>, <code>custom</code>).</li>
    <li><strong>list + filter = Scan</strong>, and <code>limit</code> applies before the filter, so you get empty pages and rising cost. Model access patterns with <code>secondaryIndexes</code>.</li>
    <li><strong>Invariants need custom mutations</strong> (Lambda), e.g. double-booking prevention with an overlap check plus a conditional transaction.</li>
    <li><strong>Writes that bypass AppSync don't fire subscriptions:</strong> <code>observeQuery</code> won't see them.</li>
    <li><strong>The data client returns <code>{ data, errors }</code></strong> rather than throwing, so always check <code>errors</code>.</li>
    <li><strong>Storage</strong> = identity-pool credentials + IAM policies from path rules; <code>{entity_id}</code> is the identity ID, not the user pool <code>sub</code>.</li>
    <li><strong>Escape-hatch ladder:</strong> define* props → <code>resources</code> (L2) → <code>cfnResources</code> (L1) → <code>createStack</code> (your CDK) → plain CDK. Watch for nested-stack cycles (<code>resourceGroupName</code>, <code>Stack.of()</code>).</li>
    <li><strong>Environments:</strong> sandbox per developer, branch = environment, optional PR previews, and secrets per branch. Mobile builds need per-environment <code>amplify_outputs.json</code> generated in CI.</li>
    <li><strong>Prod safety:</strong> auth changes can replace the user pool, API keys expire, and PITR, deletion protection and retain policies may need explicit setting. No console edits.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Treating generated CRUD as the backend.</strong> The client checks availability and then calls <code>create</code>, list screens filter instead of query, and the API key is left as the auth mode. That gives you double bookings, Scan-driven latency and cost, and a publicly writable model. Fix: <code>userPool</code> auth with explicit rules, secondary indexes for access patterns, and custom mutations for invariants.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Amplify Gen 2 is CDK with opinions. Each define call maps to a real AWS service in our account, so there's no proprietary runtime, and I can drop to CDK with escape hatches when I need something it doesn't model."</div>
  <div class="revision-say">"The lock-in isn't Amplify, it's the data layer: AppSync over DynamoDB-per-model. So I design access patterns with secondary indexes and put business invariants in custom mutations."</div>
  <div class="revision-say">"For a small team shipping CRUD with real-time features to web and React Native, it's the fastest path on AWS. For pipelines or a relational core, I'd use plain CDK and keep only the Amplify client libraries."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What each Amplify piece actually provisions</h3>
<table>
  <thead><tr><th>Amplify definition</th><th>Underlying AWS resources</th><th>What you'd hand-write without it</th></tr></thead>
  <tbody>
    <tr><td><code>defineAuth</code></td><td>Cognito user pool + app client + identity pool + IAM roles (auth / guest)</td><td>See <a href="#/topic/cloud-cognito">Cognito</a>: pool, clients, domain, identity pool, role mappings</td></tr>
    <tr><td><code>defineData</code></td><td>AppSync GraphQL API + one DynamoDB table per model + generated resolvers + auth rules; real-time subscriptions over WebSockets</td><td>AppSync schema, resolvers, tables, IAM, subscription filters</td></tr>
    <tr><td><code>defineStorage</code></td><td>S3 bucket + IAM policies on the identity-pool roles per path prefix</td><td>Bucket, CORS, per-user prefix policies (see <a href="#/topic/cloud-s3">S3</a>)</td></tr>
    <tr><td><code>defineFunction</code></td><td>Lambda (TypeScript bundled with esbuild) + role + typed env + secrets</td><td>NodejsFunction + env + Secrets Manager or SSM plumbing (see <a href="#/topic/cloud-lambda">Lambda</a>)</td></tr>
    <tr><td>Hosting</td><td>Managed build containers + CDN + SSR compute + certificates</td><td>GitHub Actions + S3 + CloudFront + Lambda@Edge + ACM</td></tr>
    <tr><td>Other categories</td><td>AI kit (Bedrock-backed conversations/generation), geo (Location Service), analytics/notifications (historically Pinpoint)</td><td>Direct service integrations</td></tr>
  </tbody>
</table>
<p>Pricing follows the same mapping. There is <strong>no Amplify markup on backend resources</strong>: you pay for Cognito MAUs, AppSync requests, DynamoDB, S3 and Lambda as if you'd built them yourself. Hosting is billed separately (build minutes, GB served, storage, SSR requests and duration; check current pricing). Note: categories built on Amazon Pinpoint (analytics, in-app messaging, push) are affected by Pinpoint's announced end of support, so check current docs before using them.</p>

<h3>Gen 1 vs Gen 2 (expect this question)</h3>
<table>
  <thead><tr><th></th><th>Gen 1 (CLI-driven)</th><th>Gen 2 (code-first, GA 2024)</th></tr></thead>
  <tbody>
    <tr><td>Authoring</td><td>Interactive CLI (<code>amplify add auth</code>, <code>amplify push</code>) generating CloudFormation + JSON in <code>amplify/backend</code></td><td>TypeScript files (<code>amplify/auth/resource.ts</code>…) composed in <code>amplify/backend.ts</code></td></tr>
    <tr><td>Engine</td><td>CLI-generated CloudFormation</td><td>AWS CDK (nested stacks)</td></tr>
    <tr><td>Data schema</td><td>GraphQL SDL with directives (<code>@model</code>, <code>@auth</code>)</td><td>TypeScript schema builder (<code>a.model()</code>) with end-to-end types to the client</td></tr>
    <tr><td>Dev loop</td><td>Shared cloud env, <code>amplify push</code>, mocking</td><td><strong>Per-developer cloud sandbox</strong> with hot-swap on save</td></tr>
    <tr><td>Environments</td><td><code>amplify env add/checkout</code></td><td><strong>Git branch = environment</strong> (+ PR previews)</td></tr>
    <tr><td>Extending</td><td>Overrides + custom CloudFormation/CDK resources</td><td>Full CDK: access L2/L1 constructs, add stacks</td></tr>
    <tr><td>Client config</td><td><code>aws-exports.js</code> / <code>amplifyconfiguration.json</code></td><td><code>amplify_outputs.json</code></td></tr>
    <tr><td>Offline sync</td><td>DataStore</td><td>Not carried over; bring your own offline layer</td></tr>
  </tbody>
</table>
<p>Gen 1 is still supported but new projects should start on Gen 2. Check current docs for Gen 1 → Gen 2 migration tooling, which is still evolving.</p>

<h3>Why teams choose it</h3>
<ul>
  <li><strong>Time to first feature:</strong> auth + typed CRUD API + real-time + file uploads + hosting with previews, mostly from config.</li>
  <li><strong>End-to-end types:</strong> change a model field and the React or RN client's types update. It feels like tRPC/Prisma for an AWS backend.</li>
  <li><strong>It's still AWS underneath:</strong> real Cognito, DynamoDB, S3 and Lambda in your account, with CDK escape hatches. No proprietary runtime to migrate off later.</li>
</ul>

<h3>Why teams outgrow it</h3>
<ul>
  <li><strong>The data model is opinionated:</strong> GraphQL over DynamoDB, a table per model, auto-generated resolvers. Relational queries, aggregations, reporting and complex transactions push you to custom resolvers, Lambdas or an SQL connection.</li>
  <li><strong>Business rules don't fit generated CRUD:</strong> "no double bookings" or "only cancel future bookings" need custom mutations (Lambda), and at that point you're writing a backend anyway.</li>
  <li><strong>Platform teams</strong> with their own CDK/Terraform conventions, multi-account landing zones, and REST/HTTP APIs behind API Gateway usually prefer plain CDK and only use the Amplify <em>client libraries</em>.</li>
</ul>

<h3>Amplify vs alternatives</h3>
<table>
  <thead><tr><th>Need</th><th>Good fit</th></tr></thead>
  <tbody>
    <tr><td>Small team, CRUD + auth + files + real-time, web and RN clients, ship this quarter</td><td><strong>Amplify Gen 2</strong></td></tr>
    <tr><td>Event-driven pipelines, SQS/Step Functions, relational core, REST APIs, multiple services</td><td><strong>CDK</strong> (or SST / Terraform), see <a href="#/topic/cloud-cicd">CI/CD &amp; IaC</a></td></tr>
    <tr><td>Mobile-first, real-time docs, minimal backend code, GCP is fine</td><td><a href="#/topic/cloud-firebase">Firebase</a></td></tr>
    <tr><td>Postgres-first BaaS</td><td>Supabase</td></tr>
    <tr><td>Next.js hosting with the best framework support</td><td>Vercel; Amplify Hosting if you want it in the AWS account</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Picture 1: from TypeScript files to running resources to a typed client</h3>
<div class="diagram">
<pre>
 amplify/                                   ampx sandbox  (your dev stack)
 ├── backend.ts      defineBackend({...}) ──► ampx pipeline-deploy (branch env in CI)
 ├── auth/resource.ts       defineAuth                 │
 ├── data/resource.ts       defineData (a.schema)      ▼  CDK synth
 ├── storage/resource.ts    defineStorage       CloudFormation (root + nested stacks)
 └── functions/x/resource.ts defineFunction            │
                                                       ▼
                    Cognito │ AppSync + DynamoDB │ S3 │ Lambda │ (+ your CDK)
                                                       │
                                     amplify_outputs.json (IDs, endpoints, regions;
                                                       │   no secrets)
                                                       ▼
 React / RN app:  Amplify.configure(outputs)
                  generateClient&lt;Schema&gt;() → client.models.Booking.list()  (typed!)
                  signIn(), uploadData(), getUrl()
</pre>
</div>

<h3>Picture 2: environments map to git</h3>
<div class="diagram">
<pre>
 developer laptop ── npx ampx sandbox ──► sandbox-&lt;user&gt; stack (ephemeral, hot-swap)
 branch "main"     ── Hosting build   ──► prod  backend + frontend
 branch "staging"  ── Hosting build   ──► staging backend + frontend
 pull request #42  ── preview (opt-in) ─► temporary backend + frontend, torn down on close
</pre>
</div>
<p>Every branch environment is a <em>separate</em> set of resources: its own user pool, tables and bucket. Data does not flow between them. A tester's account in staging doesn't exist in prod.</p>

<h3>Picture 3: the escape-hatch ladder</h3>
<div class="diagram">
<pre>
 Level 0  define* props            defineAuth({ loginWith: { email: true } })
 Level 1  L2 constructs            backend.storage.resources.bucket        (IBucket)
                                   backend.data.resources.tables['Booking'] (ITable)
                                   backend.myFn.resources.lambda             (IFunction)
 Level 2  L1 CloudFormation props  backend.auth.resources.cfnResources.cfnUserPool.policies = ...
 Level 3  your own CDK             const s = backend.createStack('Jobs'); new sqs.Queue(s, ...)
 Level 4  leave Amplify            plain CDK app; keep only the aws-amplify client libs
</pre>
</div>
<p>A healthy Amplify app lives mostly at levels 0–1 with a few level 2–3 additions. If most of <code>backend.ts</code> is level 2–3 code, you are paying the framework's costs without its benefits.</p>

<h3>Picture 4: what an authorization rule becomes</h3>
<div class="diagram">
<pre>
 a.model({...}).authorization(allow =&gt; [
   allow.owner(),                      → AppSync userPool auth + resolver checks owner field == caller
   allow.group('ADMINS'),              → resolver checks cognito:groups contains ADMINS
   allow.authenticated().to(['read']), → any signed-in user may get/list/subscribe
   allow.publicApiKey().to(['read']),  → API key auth mode (anyone holding the key)
 ])
</pre>
</div>
<p>Rules are enforced <strong>server-side in AppSync resolvers</strong>, not in the client. That's what makes it safe to call the API directly from a mobile app. Each rule maps to an AppSync <em>authorization mode</em> (user pool JWT, IAM via identity pool, API key, Lambda, OIDC).</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Amplify is a hosting service" or "Amplify is a BaaS like Firebase, so we're locked into Amplify." Neither is accurate. Hosting is one separable piece. The backend is ordinary AWS resources created by CDK, and the client library can talk to non-Amplify Cognito and S3. The real lock-in is the <em>data model</em> (AppSync + DynamoDB conventions and generated resolvers), not Amplify itself.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<p>API names below follow the Amplify Gen 2 docs at the time of writing. Gen 2 evolves quickly, so treat exact option names as "check current docs" and the concepts as stable.</p>

<h3>1. Bootstrapping and the dev loop</h3>
<pre><code class="language-bash"># New or existing frontend project
npm create amplify@latest            # adds amplify/ with backend.ts, auth/, data/

# Personal cloud sandbox: deploys, watches files, hot-swaps, writes amplify_outputs.json
npx ampx sandbox                     # needs AWS credentials (+ a one-time CDK bootstrap of the account/region)
npx ampx sandbox secret set GOOGLE_CLIENT_SECRET
npx ampx sandbox delete              # tears it down, DATA INCLUDED

# Generate client config for an existing branch environment (e.g. for a mobile build)
npx ampx generate outputs --app-id &lt;appId&gt; --branch main

# CI: deploy the backend for a branch (used inside amplify.yml or a custom pipeline)
npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID</code></pre>

<h3>2. The backend entry point</h3>
<pre><code class="language-ts">// amplify/backend.ts
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { createBooking } from './functions/create-booking/resource';

export const backend = defineBackend({ auth, data, storage, createBooking });
// Escape hatches and extra CDK go below (see §7)</code></pre>

<h3>3. Auth (Cognito)</h3>
<pre><code class="language-ts">// amplify/auth/resource.ts
import { defineAuth, secret } from '@aws-amplify/backend';
import { postConfirmation } from './post-confirmation/resource';

export const auth = defineAuth({
  loginWith: {
    email: true,                                   // becomes the pool's sign-in alias: a ONE-WAY door
    externalProviders: {
      google: {
        clientId: secret('GOOGLE_CLIENT_ID'),
        clientSecret: secret('GOOGLE_CLIENT_SECRET'),
        scopes: ['email', 'profile'],
      },
      callbackUrls: ['http://localhost:5173/', 'https://app.example.com/', 'myapp://callback/'],
      logoutUrls: ['http://localhost:5173/', 'https://app.example.com/', 'myapp://signout/'],
    },
  },
  multifactor: { mode: 'OPTIONAL', totp: true },
  groups: ['ADMINS', 'MEMBERS'],
  triggers: { postConfirmation },                  // Cognito Lambda trigger
  access: (allow) =&gt; [allow.resource(postConfirmation).to(['addUserToGroup'])],
});</code></pre>
<pre><code class="language-ts">// client (React or React Native)
import { signIn, signUp, confirmSignUp, signInWithRedirect, fetchAuthSession, getCurrentUser, signOut } from 'aws-amplify/auth';

await signUp({ username: email, password, options: { userAttributes: { email } } });
await confirmSignUp({ username: email, confirmationCode: code });
const { isSignedIn, nextStep } = await signIn({ username: email, password });
await signInWithRedirect({ provider: 'Google' });          // managed login, code + PKCE
const { tokens } = await fetchAuthSession();               // auto-refreshes; tokens.accessToken.toString()</code></pre>
<p>For drop-in UI there's <code>&lt;Authenticator&gt;</code> from <code>@aws-amplify/ui-react</code>, and the React Native equivalent from <code>@aws-amplify/ui-react-native</code> (wrap the app in <code>Authenticator.Provider</code> and read state with <code>useAuthenticator</code>). Token theory, groups and verification are in <a href="#/topic/cloud-cognito">Cognito</a>.</p>

<h3>4. Data (AppSync + DynamoDB)</h3>
<pre><code class="language-ts">// amplify/data/resource.ts
import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Todo: a.model({
    content: a.string().required(),
    done: a.boolean().default(false),
    priority: a.enum(['LOW', 'MEDIUM', 'HIGH']),
    projectId: a.id(),
    project: a.belongsTo('Project', 'projectId'),
  }).authorization((allow) =&gt; [allow.owner()]),

  Project: a.model({
    name: a.string().required(),
    todos: a.hasMany('Todo', 'projectId'),
  }).authorization((allow) =&gt; [allow.owner(), allow.group('ADMINS')]),
});

export type Schema = ClientSchema&lt;typeof schema&gt;;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    // apiKeyAuthorizationMode: { expiresInDays: 30 },   // only if you use allow.publicApiKey()
  },
});</code></pre>
<table>
  <thead><tr><th>Schema concept</th><th>What it generates</th></tr></thead>
  <tbody>
    <tr><td><code>a.model()</code></td><td>A DynamoDB table + GraphQL type + get/list/create/update/delete + onCreate/onUpdate/onDelete subscriptions</td></tr>
    <tr><td><code>hasMany</code> / <code>belongsTo</code> / <code>hasOne</code></td><td>Reference fields + resolvers that fetch related items (extra requests, so watch N+1 with deep selection sets)</td></tr>
    <tr><td><code>.secondaryIndexes(...)</code></td><td>A DynamoDB GSI + a generated <em>query</em> field: use for access patterns instead of filtering</td></tr>
    <tr><td><code>.identifier([...])</code></td><td>A custom primary key (composite keys) instead of the auto <code>id</code></td></tr>
    <tr><td><code>a.query()</code> / <code>a.mutation()</code> + <code>.handler(a.handler.function(fn))</code></td><td>A custom operation resolved by your Lambda (or a custom JS resolver)</td></tr>
    <tr><td><code>a.customType()</code>, <code>a.enum()</code>, <code>a.json()</code></td><td>Non-model types for nested data and return shapes</td></tr>
  </tbody>
</table>
<p>Authorization rule cheat sheet (combine several per model; field-level rules exist too):</p>
<table>
  <thead><tr><th>Rule</th><th>Meaning</th></tr></thead>
  <tbody>
    <tr><td><code>allow.owner()</code></td><td>Creator owns the record (an owner field is added automatically)</td></tr>
    <tr><td><code>allow.ownerDefinedIn('createdBy')</code> / <code>allow.ownersDefinedIn('editors')</code></td><td>Owner(s) stored in your own field(s), so you can share with several users</td></tr>
    <tr><td><code>allow.group('ADMINS')</code> / <code>allow.groups([...])</code></td><td>Cognito group membership</td></tr>
    <tr><td><code>allow.authenticated()</code> / <code>allow.guest()</code></td><td>Any signed-in user / unauthenticated identity-pool guests</td></tr>
    <tr><td><code>allow.publicApiKey()</code></td><td>Anyone with the API key (keys <strong>expire</strong>, max 365 days)</td></tr>
    <tr><td><code>allow.custom()</code></td><td>Your Lambda authorizer decides</td></tr>
    <tr><td><code>.to(['read'])</code> etc.</td><td>Limit the rule to operations (create, read, update, delete, get, list, listen…)</td></tr>
  </tbody>
</table>
<pre><code class="language-ts">// client: typed CRUD, pagination, real-time
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

const client = generateClient&lt;Schema&gt;();

const { data: created, errors } = await client.models.Todo.create({ content: 'Ship it', priority: 'HIGH' });
if (errors) console.warn(errors);                  // GraphQL errors are RETURNED, not thrown

let nextToken: string | null | undefined;
do {
  const page = await client.models.Todo.list({ limit: 100, nextToken, selectionSet: ['id', 'content', 'done'] });
  render(page.data);
  nextToken = page.nextToken;
} while (nextToken);

const sub = client.models.Todo.observeQuery().subscribe({
  next: ({ items, isSynced }) =&gt; setTodos([...items]),   // initial snapshot + live updates
});
// later: sub.unsubscribe();</code></pre>
<p>Data can also front an existing SQL database (Postgres/MySQL) by generating a schema from it, or call HTTP endpoints from custom resolvers. Check current docs; this is the usual route when the "DynamoDB per model" shape doesn't fit.</p>

<h3>5. Storage (S3)</h3>
<pre><code class="language-ts">// amplify/storage/resource.ts
import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'appFiles',
  access: (allow) =&gt; ({
    'profile-pictures/{entity_id}/*': [
      allow.guest.to(['read']),
      allow.entity('identity').to(['read', 'write', 'delete']),   // only the owner identity
    ],
    'recordings/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write']),
      allow.groups(['ADMINS']).to(['read']),
    ],
  }),
});</code></pre>
<pre><code class="language-ts">// client
import { uploadData, getUrl } from 'aws-amplify/storage';

const task = uploadData({
  path: ({ identityId }) =&gt; 'recordings/' + identityId + '/' + callId + '.m4a',
  data: fileBlob,
  options: {
    contentType: 'audio/mp4',
    onProgress: ({ transferredBytes, totalBytes }) =&gt; setPct(totalBytes ? transferredBytes / totalBytes : 0),
  },
});
const { path } = await task.result;                        // task.cancel() / pause() / resume() exist

const { url } = await getUrl({ path, options: { expiresIn: 900 } });   // presigned GET, 15 min</code></pre>
<p>How it works: the client gets temporary AWS credentials from the <strong>identity pool</strong> and calls S3 directly with SigV4. The path rules become IAM policies on the identity-pool roles, where <code>{entity_id}</code> becomes the caller's identity ID. Note that this is the identity pool's ID, not the user pool <code>sub</code>. Large uploads use multipart automatically. The alternative design, presigned URLs issued by your API, is covered in <a href="#/topic/cloud-s3">S3</a>.</p>

<h3>6. Functions (Lambda)</h3>
<pre><code class="language-ts">// amplify/functions/create-booking/resource.ts
import { defineFunction, secret } from '@aws-amplify/backend';

export const createBooking = defineFunction({
  name: 'create-booking',
  entry: './handler.ts',
  timeoutSeconds: 10,
  memoryMB: 512,
  environment: { SLOT_MINUTES: '15', WEBHOOK_SECRET: secret('BOOKING_WEBHOOK_SECRET') },
  resourceGroupName: 'data',   // deploy alongside the data stack to avoid circular stack deps
});</code></pre>
<pre><code class="language-ts">// amplify/functions/create-booking/handler.ts
import type { Schema } from '../../data/resource';
import { env } from '$amplify/env/create-booking';   // typed env vars generated by Amplify

export const handler: Schema['createBooking']['functionHandler'] = async (event) =&gt; {
  const { roomId, startsAt, endsAt, title } = event.arguments;
  const callerSub = (event.identity as { sub?: string } | null)?.sub;
  // ... business rules, conditional writes (see Examples) ...
};</code></pre>
<p>Functions can be custom resolvers (as above), Cognito triggers, scheduled jobs (a <code>schedule</code> option), or standalone Lambdas that you wire to anything via CDK. Secrets declared with <code>secret()</code> are set per branch in the Amplify console (or per sandbox via the CLI) and resolved at runtime, not baked into the bundle. Check current docs for the cold-start cost of that resolution.</p>

<h3>7. Escape hatches and custom CDK</h3>
<pre><code class="language-ts">// amplify/backend.ts (continued)
import { Duration, Stack } from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';

// L1 override: something defineAuth doesn't expose
const { cfnUserPool } = backend.auth.resources.cfnResources;
cfnUserPool.policies = {
  passwordPolicy: { minimumLength: 12, requireLowercase: true, requireUppercase: true, requireNumbers: true, requireSymbols: false },
};

// L2 access: grant a function direct table access + pass names via env
const tables = backend.data.resources.tables;
tables['Booking'].grantReadWriteData(backend.createBooking.resources.lambda);
tables['Room'].grantReadWriteData(backend.createBooking.resources.lambda);
backend.createBooking.addEnvironment('BOOKING_TABLE', tables['Booking'].tableName);
backend.createBooking.addEnvironment('ROOM_TABLE', tables['Room'].tableName);

// Your own CDK resources in a new stack
const jobs = backend.createStack('Jobs');
const dlq = new sqs.Queue(jobs, 'ScoreDlq', { retentionPeriod: Duration.days(14) });
const queue = new sqs.Queue(jobs, 'ScoreQueue', {
  visibilityTimeout: Duration.minutes(6),
  deadLetterQueue: { queue: dlq, maxReceiveCount: 5 },
});

// Expose extra values to clients via amplify_outputs.json → outputs.custom
backend.addOutput({ custom: { region: Stack.of(jobs).region } });</code></pre>
<p>Cross-stack references between Amplify's nested stacks and your stacks can create <strong>circular dependencies</strong> (for example, a bucket notification pointing at a queue in another stack whose policy references the bucket). The usual fixes are to create the resource in the same stack as its partner (<code>Stack.of(backend.storage.resources.bucket)</code>) or move a function into the data stack with <code>resourceGroupName</code>.</p>

<h3>8. Hosting and CI</h3>
<pre><code class="language-yaml"># amplify.yml (Gen 2 full-stack app)
version: 1
backend:
  phases:
    build:
      commands:
        - npm ci --cache .npm --prefer-offline
        - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
frontend:
  phases:
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - .npm/**/*
      - node_modules/**/*</code></pre>
<ul>
  <li><strong>Branch deployments:</strong> connect <code>main</code> and <code>staging</code> and each gets its own backend and frontend. Pattern-based auto-branch detection (e.g. <code>feature/*</code>) is available.</li>
  <li><strong>PR previews:</strong> a temporary full-stack environment per pull request, torn down on close. Be careful enabling this on public repos, because anyone opening a PR could trigger a backend deploy (check current docs for safeguards).</li>
  <li><strong>Secrets and env vars</strong> per branch in the console. <code>secret()</code> values never appear in build logs or the bundle, but plain env vars do end up in the frontend build if your framework inlines them.</li>
  <li><strong>Custom domains</strong> with managed certificates, subdomain per branch, redirects and rewrites (SPA fallback to <code>/index.html</code>), password-protected branches for previews.</li>
  <li><strong>SSR:</strong> Next.js and some other frameworks run on managed compute. Support for new framework versions can lag behind framework-native hosts, so check the support matrix.</li>
  <li><strong>Mobile apps:</strong> there's no frontend to host. Deploy the backend from Amplify (a backend-only app) or from your own CI with <code>pipeline-deploy</code>, then generate <code>amplify_outputs.json</code> for each environment and bake it into the RN build (see <a href="#/topic/cloud-cicd">CI/CD &amp; IaC</a>).</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1: meeting-room booking backend (web admin + RN tablets)</h3>
<p>Requirements: admins manage rooms, signed-in staff see schedules, anyone can book a free slot, nobody can double-book, and cancellations follow rules (only future bookings, only by owner or admin). Generated CRUD can't enforce "no overlap", so writes go through <strong>custom mutations</strong> and reads use the generated API.</p>
<pre><code class="language-ts">// amplify/data/resource.ts
import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { createBooking } from '../functions/create-booking/resource';
import { cancelBooking } from '../functions/cancel-booking/resource';

const schema = a.schema({
  Room: a.model({
    name: a.string().required(),
    floor: a.integer(),
    capacity: a.integer(),
    version: a.integer().default(0),             // optimistic-concurrency counter
    bookings: a.hasMany('Booking', 'roomId'),
  }).authorization((allow) =&gt; [
    allow.authenticated().to(['read']),
    allow.group('ADMINS'),
  ]),

  Booking: a.model({
    roomId: a.id().required(),
    room: a.belongsTo('Room', 'roomId'),
    title: a.string().required(),
    startsAt: a.datetime().required(),
    endsAt: a.datetime().required(),
    status: a.enum(['CONFIRMED', 'CANCELLED']),
    createdBy: a.string(),
  })
  .secondaryIndexes((index) =&gt; [index('roomId').sortKeys(['startsAt'])])   // "bookings for room X by time"
  .authorization((allow) =&gt; [
    allow.authenticated().to(['read']),          // no generated create/update for normal users
    allow.group('ADMINS'),
  ]),

  createBooking: a.mutation()
    .arguments({ roomId: a.id().required(), title: a.string().required(), startsAt: a.datetime().required(), endsAt: a.datetime().required() })
    .returns(a.ref('Booking'))
    .authorization((allow) =&gt; [allow.authenticated()])
    .handler(a.handler.function(createBooking)),

  cancelBooking: a.mutation()
    .arguments({ bookingId: a.id().required() })
    .returns(a.ref('Booking'))
    .authorization((allow) =&gt; [allow.authenticated()])
    .handler(a.handler.function(cancelBooking)),
});

export type Schema = ClientSchema&lt;typeof schema&gt;;
export const data = defineData({ schema, authorizationModes: { defaultAuthorizationMode: 'userPool' } });</code></pre>
<pre><code class="language-ts">// amplify/functions/create-booking/handler.ts: conflict-safe write
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'node:crypto';
import type { Schema } from '../../data/resource';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const { BOOKING_TABLE, ROOM_TABLE } = process.env as Record&lt;string, string&gt;;   // set via escape hatch
const MAX_BOOKING_MS = 8 * 60 * 60 * 1000;

export const handler: Schema['createBooking']['functionHandler'] = async (event) =&gt; {
  const { roomId, title, startsAt, endsAt } = event.arguments;
  const sub = (event.identity as { sub?: string } | null)?.sub;
  if (!sub) throw new Error('Unauthorized');
  if (!(new Date(startsAt) &lt; new Date(endsAt))) throw new Error('Invalid time range');

  for (let attempt = 0; attempt &lt; 3; attempt++) {
    const room = (await ddb.send(new GetCommand({ TableName: ROOM_TABLE, Key: { id: roomId } }))).Item;
    if (!room) throw new Error('Room not found');

    // Candidates: bookings in this room starting before our end and not too far before our start.
    // The index name depends on what Amplify generated; check the table in the console.
    const windowStart = new Date(new Date(startsAt).getTime() - MAX_BOOKING_MS).toISOString();
    const { Items = [] } = await ddb.send(new QueryCommand({
      TableName: BOOKING_TABLE,
      IndexName: 'bookingsByRoomIdAndStartsAt',
      KeyConditionExpression: 'roomId = :r AND startsAt BETWEEN :from AND :to',
      ExpressionAttributeValues: { ':r': roomId, ':from': windowStart, ':to': endsAt },
    }));
    const overlaps = Items.some((b) =&gt; b.status !== 'CANCELLED' &amp;&amp; b.startsAt &lt; endsAt &amp;&amp; startsAt &lt; b.endsAt);
    if (overlaps) throw new Error('SLOT_TAKEN');

    const now = new Date().toISOString();
    const booking = {
      id: randomUUID(), roomId, title, startsAt, endsAt, status: 'CONFIRMED', createdBy: sub,
      createdAt: now, updatedAt: now, __typename: 'Booking',
    };
    try {
      // Bump the room's version in the SAME transaction: a concurrent booking for this room
      // read the same version, so exactly one of the two transactions succeeds.
      await ddb.send(new TransactWriteCommand({ TransactItems: [
        { Update: {
            TableName: ROOM_TABLE, Key: { id: roomId },
            UpdateExpression: 'SET #v = if_not_exists(#v, :zero) + :one',
            ConditionExpression: 'attribute_not_exists(#v) OR #v = :seen',
            ExpressionAttributeNames: { '#v': 'version' },
            ExpressionAttributeValues: { ':zero': 0, ':one': 1, ':seen': room.version ?? 0 },
        } },
        { Put: { TableName: BOOKING_TABLE, Item: booking, ConditionExpression: 'attribute_not_exists(id)' } },
      ] }));
      return booking as Schema['Booking']['type'];
    } catch (err) {
      if ((err as Error).name === 'TransactionCanceledException') continue;   // lost the race: re-check
      throw err;
    }
  }
  throw new Error('BUSY_TRY_AGAIN');
};</code></pre>
<p>Talking points: the overlap test is <code>a.start &lt; b.end &amp;&amp; b.start &lt; a.end</code>. DynamoDB can't express "no overlapping intervals" as a constraint, so a per-room version counter in a transaction serialises writers for that room (optimistic concurrency). With Postgres you'd use an exclusion constraint instead (see <a href="#/topic/cloud-rds">RDS</a> and <a href="#/topic/lld-booking-system">Case: Meeting Room Booking</a>). Index and attribute names depend on what Amplify generates, so verify them rather than guessing.</p>

<h3>Example 2: the RN tablet screen, live schedule and cancel</h3>
<pre><code class="language-ts">// RoomSchedule.tsx (React Native)
import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, Text } from 'react-native';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

type Booking = Schema['Booking']['type'];
const client = generateClient&lt;Schema&gt;();

export function RoomSchedule({ roomId }: { roomId: string }) {
  const [bookings, setBookings] = useState&lt;Booking[]&gt;([]);

  useEffect(() =&gt; {
    const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const sub = client.models.Booking.observeQuery({
      filter: {
        roomId: { eq: roomId },
        startsAt: { between: [dayStart.toISOString(), dayEnd.toISOString()] },
        status: { ne: 'CANCELLED' },
      },
    }).subscribe({
      next: ({ items }) =&gt; setBookings([...items].sort((a, b) =&gt; a.startsAt.localeCompare(b.startsAt))),
      error: (e) =&gt; console.warn('schedule subscription error', e),
    });
    return () =&gt; sub.unsubscribe();
  }, [roomId]);

  async function cancel(b: Booking) {
    const { errors } = await client.mutations.cancelBooking({ bookingId: b.id });
    if (errors?.length) Alert.alert('Could not cancel', errors[0].message);
  }

  return (
    &lt;FlatList
      data={bookings}
      keyExtractor={(b) =&gt; b.id}
      renderItem={({ item }) =&gt; (
        &lt;Pressable onLongPress={() =&gt; cancel(item)}&gt;
          &lt;Text&gt;{item.title}: {new Date(item.startsAt).toLocaleTimeString()}&lt;/Text&gt;
        &lt;/Pressable&gt;
      )}
    /&gt;
  );
}</code></pre>
<p>A trap hides in this pair of examples. <code>createBooking</code> writes to DynamoDB <em>directly</em> from Lambda, and AppSync subscriptions (which <code>observeQuery</code> relies on) only fire for mutations that pass through AppSync's <em>model</em> resolvers. The tablet will not see new bookings live. The fixes: a custom subscription tied to the custom mutation (Gen 2 supports subscriptions declared <code>.for()</code> a mutation; check current docs), or have the Lambda call the AppSync model mutation instead of writing the table. Raising this unprompted is a strong senior signal.</p>

<h3>Example 3: React Native setup checklist</h3>
<pre><code class="language-bash">npm i aws-amplify @aws-amplify/react-native \\
  @react-native-async-storage/async-storage @react-native-community/netinfo \\
  react-native-get-random-values
# optional UI
npm i @aws-amplify/ui-react-native react-native-safe-area-context
cd ios &amp;&amp; pod install</code></pre>
<pre><code class="language-ts">// index.js / App entry: configure ONCE, before any Amplify call
import { Amplify } from 'aws-amplify';
import outputs from './amplify_outputs.json';
Amplify.configure(outputs);</code></pre>
<ul>
  <li><code>@aws-amplify/react-native</code> includes native code, so with Expo use a development build rather than Expo Go. Check current docs for the required polyfill imports.</li>
  <li>Tokens persist in AsyncStorage by default. For sensitive apps, plug in Keychain/Keystore-backed storage through the auth token-storage hook.</li>
  <li><code>amplify_outputs.json</code> is <strong>per environment</strong>. Generate it in CI for each build profile (dev, staging, prod) instead of committing your personal sandbox's file.</li>
  <li>Social sign-in on RN uses the system browser and a custom URL scheme. The callback URLs in <code>defineAuth</code> must match exactly.</li>
</ul>

<h3>Example 4: adding an SQS pipeline that Amplify has no category for</h3>
<pre><code class="language-ts">// amplify/backend.ts: recordings uploaded via Amplify Storage feed a scoring worker
// (assumes a scoreCall function made with defineFunction and passed to defineBackend)
import { Duration, Stack } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

const bucket = backend.storage.resources.bucket;
const storageStack = Stack.of(bucket);             // same stack as the bucket: avoids a stack cycle

const dlq = new sqs.Queue(storageStack, 'ScoreDlq', { retentionPeriod: Duration.days(14) });
const queue = new sqs.Queue(storageStack, 'ScoreQueue', {
  visibilityTimeout: Duration.minutes(6),          // ≥ 6 × the worker's timeout
  deadLetterQueue: { queue: dlq, maxReceiveCount: 5 },
});
bucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.SqsDestination(queue), { prefix: 'recordings/' });

backend.scoreCall.resources.lambda.addEventSource(
  new SqsEventSource(queue, { batchSize: 5, reportBatchItemFailures: true }),
);
// + CloudWatch alarms on queue age and DLQ depth (see the CloudWatch topic)</code></pre>
<p>This is the honest picture: the app's "Amplify" parts are auth, data and storage, while the interesting backend is plain CDK living inside <code>backend.ts</code>. See <a href="#/topic/cloud-sqs">SQS</a>, <a href="#/topic/cloud-cloudwatch">CloudWatch</a> and the full design in <a href="#/topic/cloud-serverless-case">Case Study: Serverless on AWS</a>.</p>

<h3>Example 5: deploying the backend from GitHub Actions (mobile-only app)</h3>
<pre><code class="language-yaml">name: backend-deploy
on:
  push:
    branches: [main]
permissions:
  id-token: write          # OIDC to AWS, no long-lived keys
  contents: read
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::111122223333:role/github-amplify-deploy
          aws-region: ap-south-1
      - run: npx ampx pipeline-deploy --branch main --app-id &#36;{{ vars.AMPLIFY_APP_ID }}
      - run: npx ampx generate outputs --branch main --app-id &#36;{{ vars.AMPLIFY_APP_ID }} --out-dir apps/mobile
      # then: EAS / Fastlane build with the freshly generated amplify_outputs.json</code></pre>
<p>Check the current "custom pipelines" docs. The Amplify app still has to exist, with automatic builds turned off for that branch so two pipelines don't deploy at once.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. Auth changes that replace the user pool</h3>
<p>Changing immutable Cognito settings (switching <code>loginWith</code> from email to phone, changing required attributes) can make CloudFormation <em>replace</em> the user pool. In a sandbox that's harmless. In prod it means every user is gone. Review the deploy diff for replacements, and decide sign-in identifiers before launch. Background in <a href="#/topic/cloud-cognito">Cognito</a>.</p>

<h3>2. list + filter = Scan, and limit applies before the filter</h3>
<p><code>client.models.X.list({ filter })</code> on non-key fields becomes a DynamoDB <strong>Scan</strong> with a filter. <code>limit</code> caps items <em>read</em>, not items <em>returned</em>, so you can get empty pages with a non-null <code>nextToken</code>, slow screens, and read costs proportional to table size. Fix: model access patterns as <code>secondaryIndexes</code> and call the generated query field.</p>

<h3>3. Writes outside AppSync don't trigger subscriptions</h3>
<p>Lambda writing straight to DynamoDB, a migration script, or a console edit: <code>onCreate</code>/<code>observeQuery</code> subscribers never hear about it. Route writes through AppSync mutations, or publish a custom subscription.</p>

<h3>4. observeQuery loads everything that matches</h3>
<p>It pages through the full result set before reporting <code>isSynced</code>, then applies live updates. That's fine for "today's bookings for one room" and bad for "all orders". For large sets, use paginated queries plus targeted subscriptions.</p>

<h3>5. API keys expire</h3>
<p>Public read access via <code>allow.publicApiKey()</code> works until the key expires (configurable, max 365 days). Then the public site breaks on a random day. Track expiry and rotate in CI, or use guest (identity pool) access instead.</p>

<h3>6. Owners can reassign ownership</h3>
<p>With owner-based rules, an owner may be able to update the owner field itself and hand records to someone else, unless you restrict that field with field-level authorization. Check current docs for the default behaviour, and decide explicitly.</p>

<h3>7. Errors are returned, not thrown</h3>
<p>The data client resolves with <code>{ data, errors }</code>. A failed authorization or validation often gives <code>data: null</code> plus <code>errors</code>, and code that only uses <code>try/catch</code> silently renders nothing. Always check <code>errors</code>.</p>

<h3>8. Circular dependencies between nested stacks</h3>
<p>A function that's a data resolver and also needs table access, or a storage notification to a function that writes to data: CDK reports a cycle. Fixes: <code>resourceGroupName</code> to co-locate the function, create resources in the partner's stack via <code>Stack.of()</code>, or pass names through env instead of tokens.</p>

<h3>9. Sandbox vs branch data</h3>
<p>Each sandbox and branch has separate Cognito users and tables. "I can't log in on staging" is often a user created only in a sandbox. Seed scripts per environment are part of the setup, not an afterthought. <code>ampx sandbox delete</code> destroys sandbox data.</p>

<h3>10. Production data protection is not automatic</h3>
<p>Point-in-time recovery, deletion protection and retain policies on prod tables and buckets may need explicit escape-hatch settings. Turn them on for production branches and confirm in the console.</p>

<h3>11. Per-environment client config in mobile builds</h3>
<p>A web app on Amplify Hosting gets the right outputs at build time. An RN binary bakes in whatever <code>amplify_outputs.json</code> it was built with. A TestFlight build accidentally pointed at a developer's sandbox is a classic. Generate outputs per build profile in CI. OTA updates can carry a new config only if the JS bundle includes it.</p>

<h3>12. No DataStore in Gen 2</h3>
<p>Gen 1's offline-first DataStore isn't part of Gen 2. Offline support for an RN app means your own layer (cache persistence, an outbox of pending mutations, conflict rules). See <a href="#/topic/off-bg-sync">Background Sync</a> and <a href="#/topic/rn-state-data">RN State &amp; Data</a>.</p>

<h3>13. Relationship fetches and N+1</h3>
<p>A selection set like <code>['id', 'room.name', 'room.bookings.*']</code> fans out into many resolver calls and DynamoDB reads per item. Keep selection sets flat on list screens, and denormalise display fields (store <code>roomName</code> on the booking) when read paths dominate.</p>

<h3>14. AppSync and Lambda limits apply</h3>
<p>Custom resolvers run inside AppSync's request timeout (about 30 s at the time of writing) even if the Lambda allows 15 minutes. Long work (LLM scoring, transcoding) must be async: enqueue, return an ID, and notify through a subscription or polling.</p>

<h3>15. Console edits cause drift</h3>
<p>Changing a Cognito setting or table capacity in the console makes the next deploy fight or revert it. All changes go through <code>amplify/</code> code.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1: <code>allow.publicApiKey()</code> as the default</h3>
<p>Quickstarts use an API key so things "just work". In production that means anyone who extracts the key from your app bundle can read (or write) the model. Fix: <code>userPool</code> as the default mode, explicit per-model rules, and <code>publicApiKey</code> only on genuinely public, read-only data.</p>

<h3>Anti-pattern 2: business rules in the client</h3>
<pre><code class="language-ts">// ❌ client checks availability, then calls the generated create: two tablets race, double booking
const taken = (await client.models.Booking.list({ filter: { roomId: { eq: id } } })).data.some(overlaps);
if (!taken) await client.models.Booking.create(input);

// ✅ a custom mutation enforces the invariant server-side, atomically
await client.mutations.createBooking(input);</code></pre>

<h3>Anti-pattern 3: filtering instead of indexing</h3>
<p>Every list screen uses <code>list({ filter })</code>, so the bill and latency grow with table size. Fix: design access patterns up front (DynamoDB thinking) and add <code>secondaryIndexes</code>.</p>

<h3>Anti-pattern 4: ignoring <code>errors</code></h3>
<pre><code class="language-ts">// ❌ silently shows an empty list on an auth error
const { data } = await client.models.Room.list();
// ✅
const { data, errors } = await client.models.Room.list();
if (errors) { report(errors); showError(); }</code></pre>

<h3>Anti-pattern 5: editing resources in the AWS console</h3>
<p>This causes drift, surprise reverts and environments that differ. Fix: everything in <code>amplify/</code>, reviewed in PRs.</p>

<h3>Anti-pattern 6: no protection on production data</h3>
<p>No PITR, no deletion protection, and a refactor that renames a model, which in DynamoDB-per-model terms can mean a new table. Fix: enable PITR and deletion protection on prod, and treat model renames as migrations.</p>

<h3>Anti-pattern 7: secrets as plain environment strings</h3>
<p><code>environment: { OPENAI_KEY: 'sk-…' }</code> lands in git and the Lambda configuration. Fix: <code>secret('OPENAI_KEY')</code> set per branch or sandbox, or Secrets Manager via CDK.</p>

<h3>Anti-pattern 8: escape-hatch sprawl</h3>
<p>Two hundred lines of L1 overrides and custom stacks in <code>backend.ts</code> fighting the generated resources. At that point you have a CDK app with extra constraints. Fix: move the backend to plain CDK and keep the Amplify client libraries.</p>

<h3>Anti-pattern 9: <code>Amplify.configure</code> in the wrong place</h3>
<p>Calling it inside a component, conditionally, or after the first API call leads to "Auth UserPool not configured" errors and duplicate listeners. Fix: once, at the app entry, before rendering.</p>

<h3>Anti-pattern 10: one giant Amplify app for unrelated services</h3>
<p>A single schema and backend for the booking app, the analytics pipeline and the admin tools means slow deploys, shared blast radius and tangled auth rules. Fix: split along domain boundaries. Amplify for the CRUD app, CDK for the pipelines.</p>

<h3>Anti-pattern 11: long-running work in a resolver</h3>
<p>An LLM call or file processing inside a custom mutation times out at the AppSync limit, and the client retries, duplicating work. Fix: an async pattern with a queue, a job ID, and a status subscription or polling.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. What is AWS Amplify, really?</div>
  <div class="qa-answer">
    <p>Three separable things under one brand. The <strong>Gen 2 backend</strong>: TypeScript definitions (<code>defineAuth</code>, <code>defineData</code>, <code>defineStorage</code>, <code>defineFunction</code>) that compile through CDK into Cognito, AppSync + DynamoDB, S3 and Lambda in my account. <strong>Hosting</strong>: Git-based CI/CD and CDN for web apps with branch environments and PR previews. The <strong>client libraries</strong>: <code>aws-amplify</code> for auth, data and storage in React and React Native. I can use any piece alone. For example, I've used the Amplify auth library against a Cognito pool that was created with plain CDK.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Gen 1 vs Gen 2?</div>
  <div class="qa-answer">
    <p>Gen 1 was CLI-driven: interactive <code>amplify add</code> commands generating CloudFormation, a GraphQL SDL schema with <code>@model</code>/<code>@auth</code> directives, shared environments via <code>amplify env</code>, and DataStore for offline. Gen 2 is code-first TypeScript on top of CDK, with a TS schema builder that gives end-to-end types, per-developer cloud sandboxes with hot-swap, git branch = environment, <code>amplify_outputs.json</code>, and full CDK access for extensions. DataStore didn't carry over. New projects should use Gen 2. Gen 1 projects migrate deliberately, not as a drive-by.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. What does <code>defineData</code> create, and what are the trade-offs?</div>
  <div class="qa-answer">
    <p>An AppSync GraphQL API, one DynamoDB table per model, generated CRUD resolvers and subscriptions, and authorization enforced in the resolvers based on my rules. Benefits: zero-boilerplate typed CRUD, real-time out of the box, and serverless scaling and pricing. Trade-offs: it's DynamoDB, so I must design access patterns (secondary indexes) rather than filter ad hoc. Joins, aggregations and transactions across models need custom resolvers or Lambdas. Relationships can fan out into N+1 reads. And business invariants such as "no double booking" can't live in generated CRUD; they need custom mutations.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. How does authorization work in Amplify Data?</div>
  <div class="qa-answer">
    <p>Each model (and optionally each field) gets rules such as <code>allow.owner()</code>, <code>allow.group('ADMINS')</code>, <code>allow.authenticated().to(['read'])</code>, <code>allow.publicApiKey()</code> or <code>allow.custom()</code>. They compile to AppSync authorization modes (Cognito user pool JWT, IAM via identity pool, API key, Lambda, OIDC) plus resolver logic that checks owner fields and group claims. Enforcement is server-side, which is why a mobile app can call the API directly. Pitfalls: using an API key in production, owners being able to reassign ownership unless the owner field is protected, and needing custom mutations for rules beyond "who may touch this row".</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. How do you add something Amplify doesn't support?</div>
  <div class="qa-answer">
    <p>Escape hatches in <code>backend.ts</code>. Level 1: the generated L2 constructs, e.g. <code>backend.data.resources.tables['Booking'].grantReadWriteData(fn)</code> or <code>backend.storage.resources.bucket</code>. Level 2: L1 CloudFormation properties via <code>cfnResources</code>, e.g. a stricter Cognito password policy. Level 3: <code>backend.createStack('Jobs')</code> and any CDK construct, such as SQS queues, alarms, or Step Functions. Expose values to clients with <code>backend.addOutput</code>. Watch for circular dependencies between nested stacks. And if escape hatches dominate the file, that's the signal to move to plain CDK.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How do environments and deployments work in Gen 2?</div>
  <div class="qa-answer">
    <p>Locally, each developer runs <code>npx ampx sandbox</code>: a personal cloud stack that hot-swaps on save and writes <code>amplify_outputs.json</code>. In Hosting, each connected git branch is a full-stack environment. The build runs <code>ampx pipeline-deploy</code> for the backend and then builds the frontend against that branch's outputs. PR previews can spin up temporary environments. Secrets are set per branch or sandbox. For mobile-only apps, the same <code>pipeline-deploy</code> can run in GitHub Actions, followed by <code>ampx generate outputs</code> to bake the right config into each EAS or Fastlane build profile. Promotion to prod is a merge to <code>main</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. When would you NOT use Amplify?</div>
  <div class="qa-answer">
    <ul>
      <li>The core domain is relational (reporting, joins, transactions) and I'd be fighting DynamoDB-per-model. Use RDS/Postgres with an API I control.</li>
      <li>The backend is mostly pipelines and integrations (SQS, Step Functions, EventBridge, third-party webhooks) rather than CRUD.</li>
      <li>There's a platform team with established CDK/Terraform modules, multi-account landing zones and REST APIs behind API Gateway.</li>
      <li>I need fine control over every resource and the escape hatches would dominate.</li>
    </ul>
    <p>In those cases I'd use plain CDK and still happily use the Amplify <em>client libraries</em> for Cognito auth and S3 uploads.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. FDE scenario: a customer's Amplify app has a list screen that is slow, sometimes shows empty pages with a "load more" button, and their DynamoDB bill keeps rising. What's going on?</div>
  <div class="qa-answer">
    <p>That's the classic Scan-with-filter pattern. <code>list({ filter, limit })</code> on non-key attributes scans the table. <code>limit</code> applies to items read <em>before</em> the filter, so pages come back empty with a <code>nextToken</code>, and every page reads (and bills for) unrelated items, which grows with the table. Diagnosis: check the DynamoDB metrics (consumed read capacity, scanned count vs returned count) and the AppSync resolver logs. Fix: model the access pattern as a secondary index (e.g. <code>index('tenantId').sortKeys(['createdAt'])</code>), switch the screen to the generated query field, keep selection sets flat, and denormalise display fields if relationships fan out. Then explain to the customer why it happened and add a cost alarm.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How would you prevent double bookings in an Amplify Data app?</div>
  <div class="qa-answer">
    <p>Not with generated CRUD, and not with a client-side check, because two tablets race. I'd remove the generated create for normal users and expose a <code>createBooking</code> custom mutation backed by a Lambda. It queries the room's bookings in the window via a secondary index, checks overlap (<code>a.start &lt; b.end &amp;&amp; b.start &lt; a.end</code>), and commits with a DynamoDB transaction that also conditionally bumps a per-room version counter, so concurrent writers for the same room serialise. The loser retries or gets <code>SLOT_TAKEN</code>. With fixed slots, an alternative is one item per room-slot keyed by a composite identifier with a conditional put. With Postgres, an exclusion constraint does it in the database. I'd also remember that Lambda writes bypass AppSync subscriptions, so I'd publish via a custom subscription for live tablet updates.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. How does Amplify Storage decide who can access which file?</div>
  <div class="qa-answer">
    <p>The client gets temporary credentials from the Cognito <strong>identity pool</strong> and talks to S3 directly. The path rules in <code>defineStorage</code> (e.g. <code>'recordings/{entity_id}/*'</code> with <code>allow.entity('identity')</code>) compile into IAM policies on the authenticated and guest roles, where <code>{entity_id}</code> resolves to the caller's identity ID. So access control is IAM, enforced by S3. Trade-offs vs presigned URLs from an API: there's no server hop and multipart is built in, but authorization logic is limited to path patterns and groups, and the identity ID isn't the user pool <code>sub</code>, which matters when joining to your DB.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Probing follow-up: "Isn't Amplify lock-in?"</div>
  <div class="qa-answer">
    <p>Less than people think, and in a different place. The resources are standard AWS (Cognito, DynamoDB, S3, Lambda) in my account, defined by CDK, so infrastructure can be re-expressed in plain CDK and imported. The real coupling is (a) the <strong>data access layer</strong>: AppSync GraphQL plus the generated client, and DynamoDB table shapes with Amplify's conventions; and (b) <strong>Cognito</strong> itself, since password hashes can't be exported. A migration would keep the tables, put a new API in front, and move clients over gradually. It's a real project, but not a rewrite of the data.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Amplify Hosting vs Vercel vs S3 + CloudFront for a React or Next.js frontend?</div>
  <div class="qa-answer">
    <p>Static SPA with a need for full control and lowest cost: S3 + CloudFront via CDK. Next.js with the newest features and the best DX: Vercel, which builds Next.js. Requirement to keep everything in the AWS account (billing, compliance, IAM) or already on Amplify Gen 2 with branch-linked backends: Amplify Hosting, accepting that SSR framework-version support can lag. The decision drivers are framework feature support, preview-environment needs, data residency and billing consolidation, and who owns the infrastructure.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You split Amplify into backend (CDK), Hosting and client libraries, and map each <code>define*</code> to its AWS service.</li>
    <li>You can explain Gen 1 vs Gen 2 without hand-waving.</li>
    <li>You know list + filter is a Scan and design secondary indexes instead.</li>
    <li>You put invariants (double booking) in custom mutations, not the client.</li>
    <li>You use escape hatches confidently and know when to leave for plain CDK.</li>
    <li>You handle per-environment config for mobile builds and returned (not thrown) GraphQL errors.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. How do you set up a React Native app against per-environment Amplify outputs, and what are the Expo and token-storage caveats?</div>
  <div class="qa-answer">
    <p>Install <code>aws-amplify</code> and <code>@aws-amplify/react-native</code> with their peers (AsyncStorage, NetInfo, <code>react-native-get-random-values</code>), run <code>pod install</code>, and call <code>Amplify.configure(outputs)</code> once at the app entry before any Amplify call. <code>amplify_outputs.json</code> is <strong>per environment</strong>, so generate it in CI for each build profile (dev, staging, prod) with <code>ampx generate outputs</code> rather than committing your personal sandbox's file.</p>
    <p>Caveats: <code>@aws-amplify/react-native</code> contains native code, so with Expo you need a development build, not Expo Go (check current docs for the polyfill imports). Tokens persist in AsyncStorage by default; for sensitive apps, plug in Keychain/Keystore-backed storage through the auth token-storage hook. Social sign-in uses the system browser and a custom URL scheme, so the callback URLs in <code>defineAuth</code> must match exactly.</p>
  </div>
</div>
` },

  ]
});
