# Backend System Design (Deep) module: design

Date: 2026-11-11 · Status: **approved** by Prakhar 2026-11-11 · Site: Prep-Site (`prepv1.vercel.app`)

## 1. Intent

Prakhar is preparing for Full Stack and FDE roles. A friend who interviews backend engineers said
he mostly asks **system design questions and goes very, very deep**, and that he leans hard on
**back-of-the-envelope estimation**. Prakhar's own weak spot is the numbers: he **does not know
them by heart**. He also said he doesn't want to miss anything in his preparation.

What exists today is too thin for that kind of round:

- `bsd-framework` (Backend SD Framework) covers estimation in a few lines ("DAU × actions ÷
  86,400, peak ≈ 3× average").
- `bsd-cases` puts **all 8 cases in one topic**, with a page or two each and a short "Estimate"
  step.
- Distributed-systems building blocks (consistent hashing, quorums, consensus, consistency
  models, storage engines, clocks, probabilistic structures) show up only as passing mentions
  across other topics.

**Success:** Prakhar can sit in a deep backend SD round and:

1. produce the estimation numbers from memory, then turn them into design decisions out loud;
2. take any of the 16 classic cases at least 4–5 follow-up levels deep;
3. answer "why that and not X?" about the building blocks underneath;
4. refresh the numbers and key points in a 5-minute pre-interview skim.

## 2. Goals / non-goals / anti-goals

**Goals**

- A new sidebar module, **"System Design (Backend, Deep)"**, in the Core tier: 26 topics.
- A dedicated **Estimation & Numbers** topic, built for memorising.
- **One topic per case**, each at full depth, with a **drill-down ladder** of interviewer
  follow-ups.
- **8 building-block topics** for the theory deep interviewers probe.
- The Study Plan and Quick Revision updated to use all of it.

**Non-goals**

- Frontend system design (`sd-*`) and LLD (`lld-*`) are unchanged, apart from cross-links.
- Existing Backend Core topics (databases, caching, queues, outbox, sagas, idempotency,
  resilience) are not rewritten. The new topics link to them instead of repeating them.
- No new UI features beyond what is listed in §6.

**Anti-goals** (failure even if it technically works)

- **Breadth without depth:** a case that stops at a box diagram, or a ladder that is 2 levels
  deep. The whole point is depth.
- **Numbers without decisions:** estimation tables that never say what the result changes in
  the design.
- **Copy-paste sameness:** 16 cases that read as one template with the nouns swapped. Each case
  must go deep on what is *actually hard about that system*.
- **Made-up figures stated as fact:** reference numbers must be the commonly cited, defensible
  ones, presented as orders of magnitude (§4.1).

## 3. Topic map

**Module:** `backend-sd`, titled **"System Design (Backend, Deep)"**.

- **Registry:** group `core`, groupLabel `Core · Full Stack + FDE`. In `_index.js` it is placed
  **directly after `backend`**.
- **Sidebar:** `MODULE_META['backend-sd']` uses icon `layers` (or a new `network` icon), with
  name "System Design" and sub "Estimation · building blocks · 16 cases".
- **App code:** `moduleLetters['backend-sd'] = 'SD'`. The module letter for `system-design`
  (frontend) must not collide, so check it and use `'BD'` if needed.

Topic order inside the module:

| # | id | Title | Notes |
|---|----|-------|-------|
| 1 | `bsd-estimation` | Estimation & Numbers | **NEW**, see §4.1 |
| 2 | `bsd-framework` | Backend SD Framework | **MOVED** from `backend`. Content kept, plus cross-case patterns folded in (§5) |
| 3 | `bsd-bb-partitioning` | Partitioning & Consistent Hashing | NEW building block |
| 4 | `bsd-bb-replication` | Replication & Quorums | NEW |
| 5 | `bsd-bb-consistency` | Consistency Models, CAP & PACELC | NEW |
| 6 | `bsd-bb-consensus` | Consensus & Coordination | NEW |
| 7 | `bsd-bb-storage` | Storage Engines & Picking a Database | NEW |
| 8 | `bsd-bb-transactions` | Distributed Transactions, Time & IDs | NEW |
| 9 | `bsd-bb-probabilistic` | Probabilistic & Geo Structures | NEW |
| 10 | `bsd-bb-edge` | Edge & Traffic (DNS, CDN, LBs, Gateways) | NEW |
| 11 | `bsd-case-url-shortener` | URL Shortener | rewrite of old case 1, deep |
| 12 | `bsd-case-rate-limiter` | Distributed Rate Limiter | old case 2. LLD side lives in `lld-rate-limiter`, so link it and don't repeat the code |
| 13 | `bsd-case-news-feed` | News Feed (Twitter / Instagram) | old case 3 |
| 14 | `bsd-case-chat` | Chat (WhatsApp / Slack) | old case 4 |
| 15 | `bsd-case-ride-dispatch` | Ride Dispatch (Uber) | old case 5 |
| 16 | `bsd-case-notifications` | Notification System | old case 6. LLD side in `lld-notification` |
| 17 | `bsd-case-counter` | Distributed Counter (likes, views) | old case 7 |
| 18 | `bsd-case-payments` | Payment System | old case 8 |
| 19 | `bsd-case-video-streaming` | Video Streaming (YouTube) | NEW case |
| 20 | `bsd-case-file-sync` | File Storage & Sync (Dropbox) | NEW |
| 21 | `bsd-case-autocomplete` | Search Autocomplete | NEW |
| 22 | `bsd-case-web-crawler` | Web Crawler | NEW |
| 23 | `bsd-case-kv-store` | Distributed Key-Value Store | NEW. Ties the building blocks together |
| 24 | `bsd-case-ticket-booking` | Ticket Booking (BookMyShow) | NEW. LLD side in `lld-booking-system` |
| 25 | `bsd-case-job-scheduler` | Distributed Job Scheduler | NEW |
| 26 | `bsd-case-leaderboard` | Leaderboard / Top-K | NEW |

**Retired:** `bsd-cases` (file deleted, registry entry and `<script>` tag removed).

- Its useful cross-case material (the 12 common mistakes, hot-key / failure-mode /
  read-vs-write-path patterns, interview-day reframings, the final checklist) moves into
  `bsd-framework` (§5).
- Each old case's content is the **starting material** for its new case topic.
- **Backend Core changes:**
  - The `backend` module is retitled **"Backend"** (dropping "incl. System Design").
  - Its `MODULE_META` sub changes to "DBs · caching · queues · resilience".

## 4. Content spec

All topics follow the site's **7-section format** and house style. They are the same as in
`2026-11-05-role-skills-content-design.md` §4 and §8.3, and are summarised here so this document
stands alone:

- **File:** `scripts/content/<id>.js`, containing one
  `window.PREP_SITE.registerTopic({ id, module: 'backend-sd', title, estimatedReadTime, tags, sections })`.
- **Sections, in order:**
  - `revision` ⚡ Revision — Points to Remember (`collapsible:false`), then `what-why` 🧠,
    `mental-model` 🗺️, `mechanics` ⚙️, `examples` 🧪, `pitfalls` 🕳️ (Edge cases and Bugs &
    anti-patterns under `.pitfalls-part` labels), and finally `interview-qa` 🎤.
  - Topic-specific extra sections are allowed between `pitfalls` and `interview-qa`. The
    verifier only requires `revision` first and `interview-qa`.
- **Revision card:** 4 parts inside `.revision-card`: `.revision-oneline`, a Key points `<ul>`,
  `.revision-trap`, and 2–3 `.revision-say`.
- **HTML is a template literal.** No backticks and no `${` in authored HTML. Escape `<` `>` `&`
  inside code.
- **Markup blocks:** callouts are `div.callout.{info|note|insight|success|warn|danger}`. Diagrams
  are ASCII in `div.diagram > pre`. Q&A uses
  `div.qa-block > div.qa-question + div.qa-answer`. Tables are for trade-offs.
- **Cross-links:** use `<a href="#/topic/<id>">`. Link existing Backend Core and Backend Stack
  topics rather than re-teaching outbox, saga, idempotency, caching patterns or Kafka basics.
- Where it fits, use Prakhar's real work as worked examples, phrased generically. Examples: a
  meeting-room booking platform, an app on DigitalOcean with Postgres + R2/CDN, Lambda/SQS
  pipelines, RN clients.

### 4.1 `bsd-estimation`: Estimation & Numbers

This is the memorisation topic and the most important one in the module.

**Revision card (doubles as the "numbers card" in Quick Revision):** the ~10 numbers that matter
most, plus the method in one line.

**Sections (extra sections are allowed):**

1. **Numbers to know by heart**, as tables, each with a "why it matters" column:
   - **Latency ladder:**
     - L1 and main memory
     - SSD random read
     - HDD seek
     - round trips within a datacenter, cross-region and cross-continent
     - mutex lock, compressing 1 KB, reading 1 MB sequentially from memory / SSD / network
     - use orders of magnitude, consistent with the widely cited "latency numbers every
       programmer should know", updated for modern SSDs and networks
   - **Throughput per box,** as commonly cited ballparks stated as ranges with caveats:
     - a web/app server (simple JSON)
     - Postgres/MySQL (simple reads and writes)
     - Redis
     - a Kafka partition / broker
     - a Cassandra node
     - S3 request limits per prefix
     - a single NIC
   - **Sizes:**
     - char/int/UUID/timestamp
     - a tweet or post row, a chat message, a thumbnail, a photo, 1 minute of 720p/1080p video
     - an average web page
     - a DB row with index overhead
   - **Shortcuts:**
     - powers of two vs ten (KB → PB)
     - 1 day ≈ 86,400 s ≈ 10⁵ s
     - 1M req/day ≈ 12 req/s
     - peak ≈ 2–3× average
     - 80/20 for cache sizing
     - 3× for replication
   - **Availability:** the nines table (99.9% ≈ 8.8 h/year, and so on), plus serial vs parallel
     availability math.
2. **The method:** Users → DAU → actions/day → average QPS → peak QPS, split by read/write
   ratio. Then storage per day and per year (× replication), bandwidth in and out, cache memory
   for the hot set, and server/shard counts. Includes how to round aggressively and narrate it.
3. **Numbers → decisions:** a table of thresholds and the design move each one triggers. For
   example:
   - writes beyond what one primary can take → shard or buffer through a queue
   - hot set fits in RAM → cache it all
   - fan-out × followers too large → hybrid push/pull
   - p99 budget vs cross-region RTT → regional deployment
   - storage growth vs single-node limits
4. **Worked drills:** 12–15 full estimates with the math shown and the design call that follows.
   Cover at least Twitter, WhatsApp, YouTube uploads, URL shortener, payments, Uber location
   pings, a notification blast, a web crawler, a leaderboard and Dropbox.
5. **Self-test drills:** 10 prompts with the answer hidden until clicked (`.qa-block.qa-reveal`,
   see §6), so he can practise recall.
6. **Interview Q&A:** how interviewers push on estimates ("your number is off by 10×, does the
   design change?"), with model answers.

### 4.2 Building-block topics (`bsd-bb-*`)

Each one goes from intuition → mechanism → trade-offs → failure modes → "when would you pick
this?".

- **Required:** at least one trade-off table, at least one ASCII diagram, the real systems that
  use it (e.g. DynamoDB/Cassandra for leaderless, etcd/Consul for Raft), and 10–14 Q&A that go
  progressively deeper.

**Scope per topic:**

- **Partitioning:**
  - hash vs range vs directory partitioning
  - consistent hashing with virtual nodes, rebalancing, hot keys and celebrity mitigation
  - secondary indexes (local vs global), resharding without downtime
- **Replication:**
  - single-leader, multi-leader and leaderless replication
  - sync vs async
  - lag anomalies: read-your-writes, monotonic reads, consistent prefix
  - quorums (R + W > N), sloppy quorums and hinted handoff, read repair and anti-entropy
    (Merkle trees)
  - failover and split brain
- **Consistency:**
  - linearizability → sequential → causal → eventual, explained in plain words with examples
  - CAP explained correctly (it only applies during a partition), and PACELC
  - tunable consistency, and what "strong consistency" costs in latency
- **Consensus:**
  - why consensus is needed, Raft intuition (terms, leader election, log replication, commit),
    Paxos in one paragraph
  - etcd/ZooKeeper use cases
  - distributed locks, leases, fencing tokens, and why Redlock is debated
  - leader election patterns
- **Storage engines:**
  - B-tree vs LSM-tree (memtable, SSTables, compaction, write and read amplification)
  - row vs column stores, and what WAL, indexes and covering indexes cost
  - a "picking a database" decision guide: relational, document, wide-column, KV, search,
    time-series, graph, object storage
- **Transactions, time & IDs:**
  - 2PC and its blocking problem, sagas (link to the existing topic), outbox (link)
  - why wall clocks lie; Lamport and vector clocks, HLC
  - Snowflake / ULID / UUIDv7 IDs and their sort-ability trade-offs
  - exactly-once as "at-least-once + idempotency"
- **Probabilistic & geo:**
  - Bloom filter (sizing, false-positive rate), HyperLogLog, count-min sketch
  - geohash vs quadtree vs S2/H3
  - where each one shows up in the cases
- **Edge & traffic:**
  - DNS (TTL, GeoDNS), CDN (push vs pull, cache keys, invalidation)
  - L4 vs L7 load balancers and balancing algorithms
  - reverse proxy vs API gateway, anycast, connection limits
  - TLS termination, sticky sessions and why to avoid them

### 4.3 Case topics (`bsd-case-*`)

Every case uses this section mapping:

| Section | Content for a case |
|---|---|
| `revision` | The design in one line, key decisions, the trap most candidates fall into, lines to say |
| `what-why` | Functional and non-functional requirements; **the clarifying questions to ask**, and how each answer changes the design |
| `mental-model` | **Full estimation** (QPS avg/peak, read:write, storage/yr, bandwidth, cache size, server/shard counts), with **each number tied to a decision**. Then API design and data model / schema |
| `mechanics` | High-level ASCII diagram, then **3–4 deep dives** on what is genuinely hard about *this* system (e.g. URL shortener: ID generation + hot links + analytics pipeline; chat: delivery guarantees + ordering + presence + multi-device sync) |
| `examples` | Scaling the design 10× and 100×: what breaks first and the fix, plus 1–2 variants the interviewer might switch to (e.g. "now make it global", "now add edits") |
| `pitfalls` | Failure modes (node, region, dependency down; thundering herd; hot keys), bottlenecks, and common candidate mistakes |
| `drill-down` 🪜 **Drill-down ladder** (extra section) | **3–4 ladders**, each **5 levels deep**: an opening question, then follow-ups that each push one level deeper ("why?", "what if it fails?", "what at 100×?"), each with a model answer. Uses `.qa-block` markup. Only each ladder's **opening question** carries `.qa-ladder-start` and is picked up by Quick Revision's self-test (follow-ups don't stand alone); every level must still be readable in sequence on the page |
| `interview-qa` | 8–12 further Q&A, including one FDE-flavoured scenario ("a customer reports X is slow / losing data: walk me through it") |

**Depth bar:**
- Each case runs ~40–60 KB and states concrete numbers.
- Each case links the building blocks it relies on (e.g. KV store → partitioning, replication,
  consistency, storage, probabilistic).
- Each case links its LLD twin where one exists.

**Distinctness bar:** each case's deep dives must be specific to that system. Don't repeat a
generic "add a cache, add a queue" section.

## 5. Changes to existing content

- **`bsd-framework`:**
  - Change `module` to `backend-sd`.
  - Fold in the cross-case material from `bsd-cases`. It goes in `examples` and `pitfalls`; a
    "Cross-case patterns" extra section is allowed.
  - Replace its short estimation bit with a 3-line summary linking to `bsd-estimation`.
  - Update its links to point at the individual case topics.
- **`bsd-cases`:** delete it.
  - Repoint every `#/topic/bsd-cases` link to the most relevant new case or to `bsd-framework`.
    Known links: `cloud-serverless-case.js` line 74, `lld-rate-limiter.js`, the Study Plan in `app.js`, and the 11-05
    spec, which is historical and stays as is.
  - **Router fallback:** `#/topic/bsd-cases` redirects to `bsd-framework`, so old bookmarks and
    Firestore `studied` ids don't break. A stale `studied` id has to be harmless (check
    progress counts).
- **`lld-framework`, `lld-rate-limiter`, `lld-notification`, `lld-booking-system`:** add a
  one-line cross-link to the matching HLD case.
- **`backend` module:** retitle it and update its `MODULE_META` sub (§3).

## 6. Integration

- **`scripts/content/_index.js`:**
  - Add the `backend-sd` module after `backend`.
  - Remove `bsd-framework` and `bsd-cases` from `backend`.
- **`index.html`:** 25 new `<script>` tags grouped together. Remove the `bsd-cases` tag.
- **`scripts/app.js`:** `moduleLetters`, `MODULE_META`, the `bsd-cases` redirect, and the
  Study Plan (§7).
- **Quick Revision:** no code change. The module appears automatically in the Core tier, and
  the `bsd-estimation` revision card is the numbers card.
  - Extend `questionsOf()` in `app.js` (~line 996, today it reads only `interview-qa`) so it
    also collects `.qa-ladder-start` questions from `drill-down`. *(My call.)*
- **New, small UI addition:** a `.qa-block.qa-reveal` variant where the answer is hidden until
  you click the question, for the estimation self-test drills. Build it with native
  `<details>`/`<summary>` plus a little CSS matching the existing `.qa-*` look, and check it in
  light and dark. This is the only new UI piece. *(My call.)*
- **`tools/verify-topics.mjs`:** it already covers every registry module. Add two checks:
  - a `drill-down` section on every `bsd-case-*` topic, with at least 15 `.qa-block`s
  - no remaining `bsd-cases` links
- **Verification before claiming done:**
  - `node --check` on every file
  - `node tools/verify-topics.mjs` → PASS
  - a headless-Chrome render of the module (light and dark), one case page, and Quick Revision
    filtered to this module, with no console errors
- **No commit or deploy until Prakhar asks.**

## 7. Study Plan (`renderPlan()` in `app.js`)

The plan stays at **40 days** (6 Nov – 15 Dec), at ~3 hrs/day.

- **Phase 4, "System Design: HLD + LLD",** grows from 7 to **9 days**.
  - Phase 5 (Frontend Polish) shrinks from 4 to 2 days. Its 4 days' content is compressed, and
    Mock #3 is kept.
  - Phase 4 schedule:
    - Day 1: `bsd-estimation` + `bsd-framework`
    - Days 2–3: the 8 building blocks, 4 per day. The heavy reading is the `mechanics` sections;
      skim the rest.
    - Days 4–8: 10 core cases, 2 per day, each followed by "redo one ladder out loud". The 10:
      URL shortener, rate limiter, news feed, chat, notifications, payments, KV store, ticket
      booking, video streaming, ride dispatch.
    - Day 9: LLD compressed: `lld-framework` + `lld-patterns` + `lld-lru-cache` +
      `lld-rate-limiter`, then Mock #2 (HLD + LLD).
  - **Displaced items (approved by Prakhar 2026-11-11):** Frontend System Design
    (`sd-framework`, `sd-cases`) moves into Phase 5, replacing part of the JS/React quick
    revision there. `lld-parking-lot`, `lld-booking-system` and `lld-notification` become
    **stretch** items in the Phase 6 final loop.
  - The remaining 6 cases (counter, file sync, autocomplete, crawler, job scheduler,
    leaderboard) are added as **"stretch"** items on the Phase 6 final-loop days.
- **Daily estimation warm-up:** from **12 Nov** onwards (today is day 6), append " · 10-min
  estimation drill: <drill name>" to the second column (`b`) of **every** remaining day. Cycle
  through the 12–15 worked drills in `bsd-estimation`. Repeating them on purpose is how the
  numbers stick. *(My call.)* The day date keys
  stay stable, so existing ticks in `prep-plan-done` are unaffected.
- **Header stats** (`planTopics.size`, totals) recompute automatically from the `T()` calls.

## 7a. Delivery in slices (approved)

Each slice is verified (§6) on its own. Prakhar decides when to commit and deploy each one.
Topics in the registry without a file yet show as "not written yet" in the verifier and are
left out of the registry until their slice lands, so the live site never links to a missing
topic.

1. **Slice 1:** `bsd-estimation`, the `backend-sd` module wiring, the `bsd-framework` move (`bsd-cases`
   stays, inside the new module, until Slice 3 so no case content disappears), the `qa-reveal` UI, the `questionsOf()`
   change, and the full Study Plan rework. The plan links only to topics that exist in this
   slice; Phase 4 rows link to later topics once those slices land.
2. **Slice 2:** the 8 `bsd-bb-*` building blocks.
3. **Slice 3:** `bsd-cases` retirement + redirect + cross-case fold-in into `bsd-framework`, and the 10 core cases in Phase 4 order (URL shortener, rate limiter, news feed,
   chat, notifications, payments, KV store, ticket booking, video streaming, ride dispatch).
4. **Slice 4:** the 6 stretch cases (counter, file sync, autocomplete, crawler, job
   scheduler, leaderboard).

## 8. Calls I made (Prakhar to check)

1. Module name and id: "System Design (Backend, Deep)" / `backend-sd`, placed right after
   Backend Core.
2. `bsd-cases` is retired rather than kept as an index, and redirects to `bsd-framework`.
3. The drill-down ladder is its own `drill-down` section, so it shows in the "On this page"
   menu, rather than living inside Interview Q&A.
4. The plan stays at 40 days: Phase 4 gets +2 days taken from Frontend Polish, 10 cases are
   core and 6 are stretch, and a 10-minute estimation warm-up runs daily from 12 Nov.
5. Reference throughput numbers are presented as ranges with caveats, not single "facts".

## 9. Left to the builder

- How to split authoring across agents (per-topic briefs off this spec are fine).
- The exact wording, ladder questions and worked-drill picks, within the bars above.
- The icon choice for the module.
- Exact `estimatedReadTime` per topic.
