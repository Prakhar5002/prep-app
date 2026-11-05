# Role-Switch Skills Content (Full Stack + FDE) — Design Spec

**Date:** 2026-11-05
**Status:** Decided by Claude on Prakhar's "ultrathink and DIY" hand-off — building directly
**Repo:** Prep-Site (static, offline-first, vanilla JS, no build step)

## 1. Intent

Prakhar is moving from React Native roles to **Full Stack (FE + BE)** and **Forward Deployed
Engineer (FDE)** roles. Phase 1 makes every skill on his resume's *AI/ML*, *APIs &
Architecture* and *Cloud & DevOps* cards a fully taught, interview-grade topic, so he can both
learn each one and defend it when an interviewer probes the resume.
Resume keywords:

- **AI / ML:** RAG, LLM Integrations, Conversational AI, Prompt Engineering, Call Scoring
  Systems, Predictive Modeling, Vector Search, OpenAI Realtime API, LiveKit
- **APIs & Architecture:** REST APIs, WebSockets, WebRTC, HLD, LLD, Event-Driven Systems,
  RBAC, Async Processing
- **Cloud & DevOps:** AWS Lambda, API Gateway, S3, SQS, RDS, CloudWatch, Cognito, Amplify,
  Firebase, CI/CD

Success = for every keyword, Prakhar can open one topic and go from zero to answering the
standard and the probing interview questions, with code he could write on a whiteboard.

## 2. Goals / non-goals / anti-goals

**Goals**
- Every keyword maps to a topic that teaches it in depth.
- Fill the gaps a strong interviewer will hit right next to those keywords (IAM under all of
  AWS, agents/tool use and evals next to LLM integrations, AuthN/AuthZ under RBAC, design
  patterns under LLD, an end-to-end AWS design case).
- Bias content toward what FDE / full-stack interviews actually test: building and shipping
  LLM features, integrating with messy customer systems, cost/latency/reliability trade-offs,
  and design questions ("design X on AWS", "design the classes for Y").

**Non-goals (phase 1)**
- No site features (role tracks, new Study Plan, spaced repetition). Content + registry only.
- No FDE-specific soft-skill module (customer discovery, scoping, demos, field debugging) —
  that is **phase 2**, proposed after this lands.
- No rewrites of existing topics.

**Anti-goals**
- Duplicating existing topics. Already covered and **not** re-authored: REST
  (`api-rest`), HLD (`bsd-framework`, `bsd-cases`, `sd-framework`), Async processing
  mechanics (`be-queues` — delivery semantics, DLQ, outbox, saga, SQS basics), the realtime
  decision tree (`api-realtime`), Prompt Engineering (`ai-prompts`). New topics go *deeper*
  or *sideways* and link back to these with `<a href="#/topic/<id>">`.
- Shallow "listicle" topics. Every topic must reach the bar of `rn-native-modules.js` /
  `js-closures.js`.
- Invented facts. AWS limits, pricing and API names drift; state numbers as "at time of
  writing / check current docs" when not certain, and never invent API method names.

## 3. Topic map (33 new topics → site 211 → 244)

### 3.1 `ai` — "AI / LLM Engineering" (1 → 11 topics)
| id | title | must cover |
|---|---|---|
| ai-prompts | Prompt Engineering | *(exists — unchanged)* |
| ai-llm-integration | LLM Integrations | provider APIs (messages, roles), SDKs, streaming (SSE) end-to-end into a UI, structured outputs / JSON schema, tool calling basics, tokens & context windows, cost + latency levers (model choice, prompt caching, batching), rate limits/retries/timeouts, provider abstraction + fallback, prompt-injection & PII, where the key lives (never in client) |
| ai-agents-tools | Agents, Tool Use & MCP | the agent loop, tool design (names, schemas, errors as results), multi-step planning, MCP (servers, tools/resources, transports), human-in-the-loop, stopping conditions, failure modes (loops, tool misuse), when NOT to use an agent (workflow vs agent) |
| ai-vector-search | Embeddings & Vector Search | what an embedding is, cosine/dot/L2, ANN indexes (HNSW, IVF, PQ) and recall/latency trade-off, pgvector vs managed (Pinecone, OpenSearch, etc.), metadata filtering, hybrid search (BM25 + vector, RRF), dimension/cost, re-embedding on model change |
| ai-rag | RAG (Retrieval-Augmented Generation) | ingestion pipeline, chunking strategies, retrieval → rerank → context assembly, citations/grounding, RAG vs fine-tuning vs long context, failure modes (bad chunks, lost-in-the-middle, stale index), advanced (query rewriting, HyDE, multi-hop/agentic RAG), evaluating RAG (retrieval recall, faithfulness) |
| ai-evals | LLM Evals & Guardrails | golden datasets, offline vs online evals, code-graded vs LLM-as-judge (and its biases), regression gating in CI, hallucination detection, input/output guardrails, observability/tracing of LLM calls, A/B of prompts |
| ai-conversational | Conversational AI | chatbot architectures (intent/slot vs LLM vs hybrid), conversation state & memory (window, summary, retrieval), multi-turn context management, turn-taking, handoff to human, text vs voice differences, safety/persona, measuring quality (containment, CSAT) |
| ai-realtime-voice | OpenAI Realtime API | speech-to-speech vs STT→LLM→TTS cascade, session/event model over WebSocket and WebRTC, ephemeral client tokens, VAD & turn detection, barge-in/interruption + truncation, function calling mid-conversation, audio formats, latency budget, cost; label API specifics "verify against current docs" |
| ai-livekit | LiveKit | SFU model, rooms/participants/tracks, access tokens & grants, client SDKs, LiveKit Agents framework (voice pipeline, plugins), telephony/SIP, egress/recording, self-host vs Cloud, scaling; tie to WebRTC topic |
| ai-call-scoring | Call Scoring Systems | end-to-end pipeline: recording → transcription + diarization → redaction → LLM rubric scoring → aggregation/dashboards; rubric design, structured scoring output, calibration vs human QA, async batch processing on queues, cost per call, re-scoring on rubric change |
| ai-predictive | Predictive Modeling | ML for engineers: supervised vs unsupervised, features & leakage, train/val/test, metrics (precision/recall/F1/ROC-AUC/RMSE) and which to pick, overfitting & regularisation, tree ensembles (gradient boosting) as default for tabular, serving & drift monitoring, classic ML vs LLM decision |

### 3.2 `cloud` — NEW module "Cloud & DevOps (AWS)" (12 topics)
| id | title | must cover |
|---|---|---|
| cloud-aws-foundations | AWS Foundations & IAM | regions/AZs/edge, accounts & Organizations, shared responsibility, IAM users/groups/roles/policies (JSON anatomy, evaluation logic, explicit deny), least privilege, STS/assume-role, VPC basics (subnets, SG vs NACL, NAT), pricing mental model, Well-Architected pillars |
| cloud-lambda | AWS Lambda | execution model & lifecycle, cold starts (and mitigations: provisioned concurrency, SnapStart, smaller bundles), concurrency & throttling, event sources (sync/async/poll), timeouts/memory/CPU coupling, layers, env vars & secrets, idempotency, when Lambda is the wrong tool |
| cloud-api-gateway | API Gateway | REST vs HTTP vs WebSocket APIs, Lambda proxy integration, authorizers (JWT/Cognito/Lambda), throttling & usage plans, CORS, stages/deployments, request validation, timeouts (29s-class limit), custom domains |
| cloud-s3 | S3 | buckets/objects/keys, storage classes & lifecycle, consistency, presigned URLs (upload/download from a client), bucket policies vs IAM vs ACLs, Block Public Access, encryption, versioning, events → Lambda, multipart upload, CloudFront in front |
| cloud-sqs | SQS (+ SNS / EventBridge) | standard vs FIFO, visibility timeout, long polling, DLQ & redrive, Lambda event-source mapping & partial batch failure, SNS fan-out, EventBridge rules, choosing SQS vs SNS vs EventBridge vs Kinesis; link to be-queues for generic semantics |
| cloud-rds | RDS (+ Aurora) | engines, Multi-AZ vs read replicas, backups/PITR, parameter groups, connection limits + RDS Proxy (the Lambda connection-storm problem), Aurora vs RDS, scaling, IAM DB auth, Secrets Manager rotation, RDS vs DynamoDB decision |
| cloud-cloudwatch | CloudWatch & Observability | logs/log groups/retention, Logs Insights queries, metrics & custom metrics (EMF), alarms & composite alarms, dashboards, X-Ray tracing, structured logging from Lambda, alert design that avoids noise |
| cloud-cognito | Cognito | user pools vs identity pools, tokens (ID/access/refresh) and JWT verification, hosted UI / OAuth flows, social/SAML federation, Lambda triggers, groups → RBAC, API Gateway authorizer integration, Cognito vs Auth0/Firebase Auth |
| cloud-amplify | Amplify | what Amplify is (Gen 2 code-first backend, hosting, libraries), auth/data/storage categories, hosting + CI previews, how it maps to underlying services, when to choose vs raw CDK, escape hatches |
| cloud-firebase | Firebase | Auth, Firestore data modelling & security rules, Realtime DB vs Firestore, Cloud Functions, FCM, Storage, emulators, pricing traps (reads), Firebase vs AWS decision |
| cloud-cicd | CI/CD & Infrastructure as Code | pipeline stages, GitHub Actions anatomy (workflows/jobs/matrix/cache/secrets/OIDC to AWS), Docker basics for CI, IaC (CDK, SAM, Terraform compared), environments & promotion, deploy strategies (blue/green, canary, feature flags), rollback, mobile CI (EAS/Fastlane) note |
| cloud-serverless-case | Case Study: Serverless on AWS | full interview walkthrough designing an LLM **call-scoring platform** on AWS (S3 upload via presigned URL → S3 event → SQS → Lambda transcription/scoring → RDS/DynamoDB → API Gateway + Cognito → CloudWatch alarms), with estimates, failure handling, cost, and trade-offs; ties together the AI + cloud modules |

### 3.3 `lld` — NEW module "Low-Level Design (LLD)" (7 topics)
Code language: **TypeScript** (Prakhar's stack); mention that Java/C++ syntax maps 1:1.
| id | title | must cover |
|---|---|---|
| lld-framework | LLD Interview Framework | how LLD differs from HLD, the step-by-step method (requirements → entities → relationships → class diagram → interfaces → core flows → code → extensibility/concurrency), UML-lite notation in ASCII, composition vs inheritance, what interviewers grade; links to `design-solid-intro` |
| lld-patterns | Design Patterns for LLD | creational (Factory, Builder, Singleton + its pitfalls), structural (Adapter, Decorator, Facade, Proxy), behavioural (Strategy, Observer, State, Command, Chain of Responsibility, Template Method) — each with intent, TS code, and "which LLD problem uses it" |
| lld-parking-lot | Case: Parking Lot | full worked LLD solution following the framework |
| lld-lru-cache | Case: LRU Cache | hashmap + doubly linked list, O(1) ops, TTL/LFU extensions, thread-safety discussion |
| lld-rate-limiter | Case: Rate Limiter | token bucket / leaky bucket / fixed & sliding window as Strategy classes, per-key limits, distributed variant pointer to `bsd-cases` |
| lld-booking-system | Case: Meeting Room Booking | rooms/slots/bookings, conflict detection (interval overlap), concurrency & double-booking (locks, optimistic concurrency, DB constraints), cancellation, recurring bookings |
| lld-notification | Case: Notification Service | multi-channel (email/SMS/push) via Strategy, templates, preferences, retries/backoff, rate limiting, Observer for events, extensibility |

Each case topic keeps the standard 10 sections, but **Mechanics** walks the framework steps and
**Examples** holds the full code solution plus 1–2 follow-up extensions.

### 3.4 Additions to existing modules
| module | id | title | must cover |
|---|---|---|---|
| api-design | api-websockets | WebSockets Deep | handshake/upgrade, frames/opcodes, ping/pong, auth at connect, scaling (sticky sessions, Redis pub/sub adapter), Socket.IO vs ws, load-balancer idle timeouts, message ordering & acks, backpressure, API Gateway WebSocket APIs; link `api-realtime` |
| api-design | api-webrtc | WebRTC Deep | media/data channels, signalling (not in spec), SDP offer/answer, ICE/STUN/TURN and NAT types, mesh vs SFU vs MCU, simulcast/SVC, getStats debugging, security (DTLS-SRTP), mobile (react-native-webrtc) notes |
| api-design | api-auth-rbac | AuthN, AuthZ & RBAC | sessions vs JWT, OAuth2/OIDC flows (auth code + PKCE, client credentials), RBAC vs ABAC vs ReBAC, permission modelling (roles→permissions tables), enforcement points (gateway, middleware, row-level), multi-tenant isolation, admin/impersonation, audit logs |
| backend | be-event-driven | Event-Driven Systems & Async Processing | events vs commands, choreography vs orchestration, event schemas & versioning, event sourcing, CDC, eventual consistency & read-your-writes, async request patterns (202 Accepted + polling / webhooks / push), idempotent consumers, ordering; link `be-queues` and `be-architecture` for mechanics already covered |

## 4. House style (applies to every new topic)

- File: `scripts/content/<id>.js`, a single call:
  `window.PREP_SITE.registerTopic({ id, module: '<module id>', title, estimatedReadTime, tags: [...], sections: [...] });`
  `module` is the **module id** (`ai`, `cloud`, `lld`, `api-design`, `backend`).
- Exactly these 10 sections, in order, with these ids/titles:
  `tldr` 🎯 TL;DR (collapsible:false) · `what-why` 🧠 What & Why · `mental-model` 🗺️ Mental
  Model · `mechanics` ⚙️ Mechanics · `examples` 🧪 Examples · `edge-cases` 🕳️ Edge Cases ·
  `bugs-antipatterns` 🐛 Bugs & Anti-Patterns · `interview-patterns` 🎤 Interview Patterns ·
  `revision` ⚡ Revision — Points to Remember · `checklist` ✅ Interview Checklist
  (all but tldr `collapsible: true`).
- `html` is a template literal: **no backticks and no `${` inside authored HTML.** Escape
  `<`, `>`, `&` inside code as `&lt;` `&gt;` `&amp;`.
- Blocks: `<h3>`/`<h4>`, `<p>`, `<ul>`, `<table>`; code as
  `<pre><code class="language-ts|js|bash|json|yaml|sql|python|text">`; callouts
  `<div class="callout info|note|insight|success|warn|danger"><div class="callout-title">…</div><p>…</p></div>`;
  ASCII diagrams in `<div class="diagram"><pre>…</pre></div>`; Q&A in
  `<div class="qa-block"><div class="qa-question">Q1. …</div><div class="qa-answer"><p>…</p></div></div>`.
- **Interview Patterns:** 8–12 Q&A blocks, from the opener to senior-level probing follow-ups,
  plus at least one FDE-flavoured scenario ("a customer says X is slow/wrong — what do you do?").
- **Revision:** the 4-part standard inside `<div class="revision-card">`: In one line
  (`revision-oneline`) · Key points (`<ul>`) · Common trap (`revision-trap`) · Say this in the
  interview (2–3 `revision-say`). Distilled from the topic's own content.
- **Checklist:** last section; `<div class="callout success"><div class="callout-title">Can you
  answer these before moving on?</div><ul>` 5–6 "Can you …?" questions, questions only.
- Depth: ~35–60 KB per file, realistic production code (TypeScript/Node first; Python where the
  ecosystem is Python-first, e.g. predictive modelling), concrete numbers, trade-off tables.
- Cross-link related topics with `<a href="#/topic/<id>">Title</a>`.
- Where Prakhar's real work fits, use it as a worked example, phrased generically (meeting-room
  booking tablets, an app with Lambda/S3/SQS, RN mobile clients).
- Verification per file: `node --check`, plus a VM load that confirms it registers with 10
  non-empty sections in the right order.

## 5. Integration (done by the coordinator, not the authors)

- `scripts/content/_index.js`: grow `ai`; add `cloud` and `lld` modules (after `backend`, and
  `lld` right after `design`); append the api-design/backend topics in the order above.
- `index.html`: one `<script>` tag per new file, grouped with its module.
- `scripts/app.js` `moduleLetters`: `'cloud': 'AW'`, `'lld': 'LD'`.
- `tools/verify-topics.mjs`: extend to cover the new modules/topics.
- No commit until Prakhar asks.

## 6. Phase 2 (proposed, not in this build)

An **FDE Playbook** module (what FDEs do, customer discovery & scoping, the "decomposition"
interview, building demos/POCs fast, deploying into customer environments, field debugging,
writing for customers) plus **role tracks** (curated Full Stack / FDE paths through existing
modules) and a refreshed Study Plan.

## 7. Addendum (2026-11-05, batch 2) — second skills list, duplicates skipped

Second list (39 items + Kafka, MQTT, AWS SQS, CloudWatch, Microsoft Clarity, OpenCV). Already
covered or already in batch 1, so **skipped**: Git, Unit Testing (`test-*`), RBAC, S3, Prompt
Engineering, REST, Async Processing, WebSockets, Lambda, API Gateway, RDS, SQS, CloudWatch,
Cognito, Firebase, Amplify, Serverless Architecture (`cloud-serverless-case`), Event-Driven,
CI/CD, HLD, LLD, WebRTC, RN Native Modules (`rn-native-modules`), Android Studio
(`andr-tools`), LLM Integrations, Vector Search, RAG, Conversational AI, OpenAI Realtime,
LiveKit, Predictive Modeling. (Kafka is only a sub-section of `be-queues` → gets a deep topic.)

**New module `backend-stack` — "Backend Stack (Node, DBs, Messaging)"**, placed after `backend`:
| id | title | must cover |
|---|---|---|
| be-express | Express.js Deep | app/router/middleware pipeline & ordering, async error handling (Express 4 vs 5), validation (zod), security middleware (helmet, cors, rate limit), project structure, streaming/uploads, testing with supertest, perf & graceful shutdown; link `be-fundamentals` |
| be-nestjs | NestJS (Advanced) | modules/providers/DI container & scopes, request lifecycle (middleware → guards → interceptors → pipes → handler → filters), custom decorators, guards for RBAC, dynamic modules, config, Prisma/TypeORM integration, microservices/queues (BullMQ), testing module, circular-dependency fixes |
| be-mysql | MySQL & SQL Deep | SQL fluency (joins, window functions, CTEs), InnoDB, B+tree indexes (clustered/secondary, covering, composite left-prefix), EXPLAIN, transactions & isolation levels (MVCC, gap locks, deadlocks), replication, pagination (keyset), MySQL vs Postgres, schema migrations without downtime |
| be-mongodb | MongoDB | document modelling (embed vs reference), indexes (compound/ESR rule, multikey, TTL), aggregation pipeline, transactions, read/write concerns, replica sets & sharding (shard key choice), Mongoose, MongoDB vs SQL decision |
| be-kafka | Kafka Deep | topics/partitions/offsets, producers (acks, idempotence, batching, keys→ordering), consumer groups & rebalancing, delivery semantics & exactly-once, retention/compaction, schema registry, DLQ patterns, Kafka vs SQS/RabbitMQ, KafkaJS code; link `be-queues`, `be-event-driven` |
| be-mqtt | MQTT & IoT Messaging | pub/sub over brokers, topics & wildcards, QoS 0/1/2, retained messages, LWT, persistent sessions, keep-alive, MQTT 5 features, brokers (Mosquitto, EMQX, AWS IoT Core), security (TLS, certs), MQTT vs WebSockets vs HTTP for devices/kiosks |

**Other modules**
| module | id | title | must cover |
|---|---|---|---|
| react | react-nextjs | Next.js (App Router) | routing & layouts, Server vs Client Components, data fetching & caching/revalidation, Server Actions, route handlers, middleware, rendering modes, images/fonts, auth patterns, deploy (Vercel vs self-host); link `react-ssr` (don't repeat SSR theory). Verify version-specific APIs against current docs. |
| testing | test-api | API Testing | test pyramid for APIs, supertest integration tests, test DBs (testcontainers), contract testing (Pact), Postman/Newman in CI, schema validation, mocking third-party APIs (nock/msw), load testing (k6), testing auth/RBAC |
| ai | ai-computer-vision | Computer Vision & OpenCV | images as arrays, colour spaces, filtering/edges/thresholding, contours, feature detection, face detection → recognition pipeline (detect, align, embed, match), classical vs deep models, OpenCV in Python + on-device (Android/ML Kit) notes, performance, liveness/anti-spoofing basics |
| mobile-prod | mprod-clarity | Microsoft Clarity & Session Analytics | what Clarity gives (session recordings, heatmaps, rage/dead clicks, insights), web + React Native SDK setup, masking PII, custom tags/events, pairing with GA/Mixpanel, privacy/consent, using it to debug UX issues; link `mprod-analytics` |
| cloud | cloud-dev-tools | AWS Developer Tools (CodeCommit, CodeBuild, CodePipeline) | CodeCommit repos & IAM/git-remote-codecommit auth, CodeBuild buildspec, CodePipeline stages, CodeDeploy strategies, vs GitHub Actions; note CodeCommit's availability status changed in 2024–25 → "check current AWS docs" |

**New module `flutter` — "Flutter"**, placed after `iosn`:
| id | title | must cover |
|---|---|---|
| flutter-dart | Dart Essentials | types & sound null safety, classes/mixins/extensions, async (Future, Stream, async*), isolates, collections, records/patterns, Dart vs TS mental map |
| flutter-widgets | Widgets & Rendering | widget/element/render-object trees, Stateless vs Stateful lifecycle, BuildContext, keys, layout constraints ("constraints go down, sizes go up"), rendering pipeline & Impeller, performance (const, rebuild scope, DevTools) |
| flutter-state-arch | State, Navigation & Platform | setState → InheritedWidget → Provider/Riverpod/Bloc compared, navigation (Navigator 2 / go_router), platform channels & FFI, testing (unit/widget/integration), Flutter vs React Native decision |

## 8. Focus restructure (2026-11-05, approved in chat)

**Goal (Prakhar):** study the role-relevant topics without getting lost, keep the in-depth
explanations, and be able to cram before an interview without reading the whole site.

1. **Sidebar order in four tiers.** Each module in `_index.js` has `group` and `groupLabel`,
   and the sidebar and home grid show a label where the tier changes.
   - **Core · Full Stack + FDE:** AI, Backend, Backend Stack, API Design, Cloud, LLD, DSA, JS,
     TypeScript, React, Frontend System Design, Behavioral
   - **Supporting:** Testing, Web, SOLID, Machine Coding, Performance, Debugging, Git, Linux,
     Build, State, Redux, GraphQL, Career
   - **Mobile · current stack:** RN, RN Config, Android, iOS, Flutter, Mobile Prod, Mobile UX,
     Animation, Offline
   - **Later:** Ethical Hacking, Workplace

   The topic order inside each module is unchanged.
2. **⚡ Quick Revision page (`#/revise`, shortcut `g r`).**
   - Shows only each topic's ⚡ Revision card, in sidebar order.
   - Tier chips plus module chips to filter what's shown.
   - A "Revised" tick on each card, synced to Firestore as `revised`, and a "Hide revised" toggle.
   - Under each card, a collapsed questions-only self-test built from that topic's Interview Q&A.
   - An "Open full topic" link on each card.
3. **7-section topics (replaces the 10-section skeleton in §4).**
   - `revision` ⚡ Revision — Points to Remember (first, `collapsible:false`; TL;DR folded in)
   - `what-why` · `mental-model` · `mechanics` · `examples`
   - `pitfalls` 🕳️ Pitfalls (Edge Cases + Bugs & Anti-Patterns, each under a
     `.pitfalls-part` label)
   - `interview-qa` 🎤 Interview Q&A (old Interview section, plus answered Q&A blocks for any
     Checklist question it didn't already answer)
   - TL;DR and Checklist are removed.
   - Topic-specific extra sections (cheat sheets, reference tables, sd-cases, rn-gotchas) are
     kept in place.
   - Conversion is scripted: an agent writes only the new Revision card and the extra Q&A.
     Every other section is copied byte-for-byte, and the script verifies this after writing.
