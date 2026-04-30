window.PREP_SITE.registerTopic({
  id: 'beh-stories',
  module: 'behavioral',
  title: 'Story Bank (10 stories)',
  estimatedReadTime: '40 min',
  tags: ['behavioral', 'story-bank', 'star', 'interview-prep', 'competencies', 'examples', 'mobile', 'react-native'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>A <strong>story bank</strong> is your prepared inventory of 8–12 incidents from your career, each tagged to multiple competencies. Behavioral interviews ask ~15 questions across a loop; with a well-built bank, every question has a story you can tell in 3 minutes.</p>
<ul>
  <li><strong>5–8 stories cover 90% of questions</strong> if each is tagged with 3–4 competencies.</li>
  <li><strong>Diversity matters more than count.</strong> One story per major theme (conflict, ownership, failure, complex tech, leadership, ambiguity, influence, working under pressure, mentorship, principled disagreement).</li>
  <li><strong>Recency matters.</strong> Stories from the last 3 years are easier to recall and more relevant. Older stories work if the lesson still applies.</li>
  <li><strong>Tag and rehearse.</strong> Each story has a tag matrix ("can answer Q1, Q3, Q7, Q12") and 5 follow-ups pre-rehearsed.</li>
  <li><strong>One signature story.</strong> Your "go-to" — most polished, most quantified, easy to expand or compress on demand.</li>
  <li><strong>Mobile candidates' edge:</strong> stories about device-specific bugs, native bridge issues, App Store rejections, performance investigations on real users translate uniquely well.</li>
  <li><strong>Update yearly.</strong> A bank gets stale; refresh stories from new work; retire old ones whose lessons you've outgrown.</li>
</ul>
<p><strong>This page provides 10 archetype stories</strong> tagged across 30 common questions — adapt them to your own experience. The shapes are real; the names, numbers, and details should be yours.</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What is a story bank?</h3>
<p>A list of work incidents, each prepared in STAR-L form, tagged with the behavioral competencies they answer. When the interviewer asks "tell me about a time you..." you mentally scan your bank for a fit, then tell the story.</p>

<h3>Why a bank, not a script?</h3>
<ul>
  <li><strong>Coverage.</strong> ~15 questions per loop × 4-5 rounds means 60+ potential prompts. You can't memorize 60 answers; you can recall 8 stories cued by competency.</li>
  <li><strong>Adaptability.</strong> Real interviews go off-script. A bank lets you pivot when your prepared answer doesn't fit the actual question.</li>
  <li><strong>Speed.</strong> Sub-second mental retrieval ("which story fits 'data-driven decision'?") beats real-time brainstorming.</li>
  <li><strong>Reduce repetition.</strong> Loops have multiple interviewers — having backup stories per competency prevents repeating the same incident verbatim.</li>
</ul>

<h3>Anatomy of a bank entry</h3>
<table>
  <thead><tr><th>Field</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td>Title</td><td>Internal label. "Chat memory leak fix" — easy to recall.</td></tr>
    <tr><td>Tags</td><td>Competencies it answers. "technical depth, ownership, data-driven."</td></tr>
    <tr><td>S</td><td>1-2 sentences of context.</td></tr>
    <tr><td>T</td><td>Your specific responsibility.</td></tr>
    <tr><td>A</td><td>5-8 bullets covering the action arc.</td></tr>
    <tr><td>R</td><td>Quantified outcome.</td></tr>
    <tr><td>L</td><td>Lasting lesson.</td></tr>
    <tr><td>Follow-ups</td><td>5 anticipated probes with concise answers.</td></tr>
    <tr><td>Adaptations</td><td>How to lean different versions for different questions.</td></tr>
  </tbody>
</table>

<h3>The 10 archetype themes</h3>
<table>
  <thead><tr><th>#</th><th>Theme</th><th>Probes</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>Complex technical investigation</td><td>Tech depth, ownership, persistence, data-driven thinking</td></tr>
    <tr><td>2</td><td>Disagreed with a senior person on a technical decision</td><td>Conflict resolution, courage, judgment, communication</td></tr>
    <tr><td>3</td><td>Project I led that I'd consider a failure</td><td>Self-awareness, learning, recovery, accountability</td></tr>
    <tr><td>4</td><td>Spotted a problem before it impacted users</td><td>Ownership, proactive thinking, dive-deep</td></tr>
    <tr><td>5</td><td>Influenced cross-functional partners without authority</td><td>Persuasion, stakeholder management, communication</td></tr>
    <tr><td>6</td><td>Made a major decision with incomplete data</td><td>Bias for action, judgment, learning</td></tr>
    <tr><td>7</td><td>Mentored a teammate or grew an underperformer</td><td>Leadership, empathy, develop-others</td></tr>
    <tr><td>8</td><td>Drove a long migration / large initiative</td><td>Scope, leadership, consistency, delivery</td></tr>
    <tr><td>9</td><td>Pivoted strategy mid-project</td><td>Adaptability, courage, judgment, focus</td></tr>
    <tr><td>10</td><td>Recovered from an incident / outage</td><td>Calm under pressure, ownership, customer focus, post-mortem rigor</td></tr>
  </tbody>
</table>

<h3>Why these 10?</h3>
<p>Empirically, this set covers ~95% of FAANG behavioral questions across loops we've seen, including Amazon's 16 LPs, Google's "Googleyness" rubric, Meta's values, and Apple's "innovation, simplicity, quality" themes. Once you have these 10, every interview question has at least one story that fits cleanly.</p>

<h3>What "good" looks like</h3>
<ul>
  <li>Each story has been told out loud at least 3 times.</li>
  <li>Each is timed at 2.5–3 minutes for the initial telling.</li>
  <li>Each has 5 follow-up probes prepared.</li>
  <li>Each is tagged with 3-4 competencies.</li>
  <li>You have at least 2 stories that can answer "conflict" and 2 for "failure" — common ones, often asked twice.</li>
  <li>You can articulate, for any story, what the lesson taught you that you still apply today.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The "tag matrix"</h3>
<p>Make a grid: stories down the left, competencies across the top. Cell value = strength of the story for that competency (high / medium / low). Goal: every column has at least 2 high-strength cells.</p>
<pre><code class="language-text">                   Conflict  Failure  Lead  Tech  Influence  Ambiguity  Pressure
1. Memory leak       L         L        L     H     L          M          M
2. GraphQL pushback  H         L        M     M     H          M          L
3. Flag system fail  L         H        M     H     L          H          M
4. Crash dashboard   L         L        H     M     H          M          L
5. PM scope creep    H         L        M     L     H          L          M
6. Rapid migration   M         L        H     H     M          H          H
7. Junior mentor     L         L        H     L     M          L          L
8. RN to native      M         M        H     H     M          H          M
9. Pivot to BFF      M         M        H     H     M          H          L
10. Outage at 3am    L         L        M     M     L          M          H

→ Conflict has 3 strong stories (2, 5, +backup)
→ Failure has only 1 strong (3) → write another
→ Pressure has only 1 strong (10) → write another
</code></pre>

<h3>The "story arc" mental model</h3>
<p>Every memorable STAR has a 3-act arc:</p>
<ol>
  <li><strong>Act 1 — The setup:</strong> the situation looked manageable but contained a hidden complication.</li>
  <li><strong>Act 2 — The complication:</strong> something went wrong / surprising / revealed itself.</li>
  <li><strong>Act 3 — The resolution:</strong> what you did, the outcome, what you learned.</li>
</ol>
<p>If your story has no Act 2 (no surprise, complication, conflict, pivot), it's a project description, not a story. Add a complication beat: "I expected X, but discovered Y."</p>

<h3>The "decision points" lens</h3>
<p>Strong Action sections feel like a path through a decision tree:</p>
<pre><code class="language-text">"I had two paths: A or B.
   I picked A because [reason tied to constraint].
   When I encountered [obstacle], I chose between A1 and A2.
   I picked A1 because [different reason].
   At the end, [outcome]."
</code></pre>
<p>List your story's decision points before delivering. If you have fewer than 2-3, the story is too thin.</p>

<h3>The "I-line" highlight</h3>
<p>For each story, mark in your draft which sentences are <em>specifically</em> about you (use I-line). Aim for 70-80% of the Action section to be I-lines. Re-write any section dominated by "we" until your slice is unambiguous.</p>

<h3>The "what would you do differently" beat</h3>
<p>Every story needs a real lesson. Two ways to make the lesson land:</p>
<ul>
  <li><strong>Tactical:</strong> "I now do X earlier in the project."</li>
  <li><strong>Strategic:</strong> "I now think about X as a team-design problem, not just a technical one."</li>
</ul>
<p>The strategic lesson signals seniority — you've abstracted from incident to principle.</p>

<h3>The "deferred details" pattern</h3>
<p>You can't fit every detail in 3 minutes. Save secondary detail for follow-ups:</p>
<ul>
  <li>"I optimized the bundle size; happy to go into the specific techniques if useful."</li>
  <li>"There were 3 rollback strategies; I picked X — we can discuss alternatives."</li>
</ul>
<p>This invites the interviewer to direct depth, signals you have more material, and keeps the main answer crisp.</p>

<h3>The "anti-archetype" for each theme</h3>
<table>
  <thead><tr><th>Theme</th><th>What NOT to pick</th></tr></thead>
  <tbody>
    <tr><td>Conflict</td><td>A petty argument over code style. Pick a substantive disagreement with stakes.</td></tr>
    <tr><td>Failure</td><td>"I worked too hard." Pick a real bad call.</td></tr>
    <tr><td>Leadership</td><td>"I helped someone." Pick something with measurable impact.</td></tr>
    <tr><td>Tech depth</td><td>"I learned a new framework." Pick something you debugged or designed.</td></tr>
    <tr><td>Ambiguity</td><td>"The ticket was unclear." Pick something with real strategic uncertainty.</td></tr>
    <tr><td>Pressure</td><td>"We had a tight deadline." Pick a real escalation or incident.</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>How to build your bank in one weekend</h3>
<ol>
  <li><strong>Saturday morning (90 min):</strong> List every project, incident, decision, conflict, and lesson from the last 3-5 years. ~30-50 entries. Don't filter yet.</li>
  <li><strong>Saturday afternoon (90 min):</strong> Cluster the entries by theme. Drop trivial ones. Identify the 8-12 strongest.</li>
  <li><strong>Sunday morning (3 hours):</strong> Draft a STAR-L for each. One page per story.</li>
  <li><strong>Sunday afternoon (2 hours):</strong> Rehearse out loud, time yourself, refine.</li>
  <li><strong>Following days:</strong> One mock interview per day; refine based on follow-up questions you didn't anticipate.</li>
</ol>

<h3>The bank entry template</h3>
<pre><code class="language-text">## Story: [Internal Title]
Tags: [3-5 competencies]
Recency: [year]
Strength: [high/medium]

S (Situation):
  - 2 sentences max. Stakes + context.

T (Task):
  - 1 sentence. Your specific responsibility.

A (Action):
  - 5-8 bullets, each starting with a verb.
  - Highlight at least 2 decision points.
  - Include 1 unexpected complication.
  - Use "I" not "we".

R (Result):
  - 1-2 quantified outcomes.
  - Optional: stakeholder reaction or downstream effect.

L (Learning):
  - 1-2 sentences. Tactical or strategic lesson.
  - How you apply it now.

Follow-ups:
  Q1: [anticipated probe]
    A: [60-second answer]
  Q2: ...
  Q3: ...
  Q4: ...
  Q5: ...

Adaptations:
  - For "conflict" question: emphasize [beat].
  - For "ownership" question: emphasize [beat].
  - For "data-driven" question: emphasize [beat].
</code></pre>

<h3>How to identify "strong" stories</h3>
<p>Score each candidate story on:</p>
<ul>
  <li><strong>Specificity:</strong> Can you quote actual numbers? Names? Dates?</li>
  <li><strong>Stakes:</strong> Was the outcome measurable and meaningful?</li>
  <li><strong>Decisions:</strong> Did <em>you</em> make 2-3 substantive choices?</li>
  <li><strong>Complication:</strong> Was there a surprise, pivot, or pushback?</li>
  <li><strong>Lesson:</strong> Did you actually learn something that's stuck?</li>
</ul>
<p>Stories scoring high on all five become bank entries. Stories with one weak axis can usually be strengthened by reframing.</p>

<h3>How to cover competency gaps</h3>
<p>Map your 10 stories against the 10 archetype themes. Gaps?</p>
<ul>
  <li><strong>Missing "leadership"?</strong> Look for: mentoring, RFC ownership, running a meeting, driving a tooling improvement.</li>
  <li><strong>Missing "conflict"?</strong> Look for: code review pushbacks, design doc disagreements, vendor selection debates.</li>
  <li><strong>Missing "ambiguity"?</strong> Look for: starting a new project, joining a new team, working with a non-technical stakeholder.</li>
  <li><strong>Missing "failure"?</strong> Look for: bad estimates, decisions you'd reverse, features that didn't move the metric.</li>
</ul>

<h3>How to rehearse</h3>
<ol>
  <li>Read the story aloud once at "natural" speed. Time it.</li>
  <li>If &gt; 4 min: identify cuts. Compress S, group A bullets.</li>
  <li>If &lt; 2 min: identify expansion beats. Add tradeoff narration, stakeholder beats.</li>
  <li>Re-record after edits. Listen back at 1× speed; flag filler ("um," "kind of," "you know").</li>
  <li>Practice 3 versions: 90s "elevator," 3min "default," 5min "deep dive."</li>
  <li>Mock interview with a friend. Have them ask 3 follow-ups.</li>
</ol>

<h3>Common follow-up question categories</h3>
<table>
  <thead><tr><th>Category</th><th>Examples</th></tr></thead>
  <tbody>
    <tr><td>Decision rationale</td><td>"Why did you choose X over Y?"</td></tr>
    <tr><td>Counterfactual</td><td>"What would you do differently?"</td></tr>
    <tr><td>Stakeholder reactions</td><td>"How did the team respond?"</td></tr>
    <tr><td>Measurement</td><td>"How did you know it worked?"</td></tr>
    <tr><td>Scope</td><td>"Was this you, or was it a team effort?"</td></tr>
    <tr><td>Hardest part</td><td>"What was the most difficult part?"</td></tr>
    <tr><td>Lessons applied</td><td>"Have you used that lesson since?"</td></tr>
    <tr><td>Generalization</td><td>"How does this approach apply to X?"</td></tr>
  </tbody>
</table>

<h3>How to keep the bank fresh</h3>
<ul>
  <li>Quarterly: review which stories you used in any interviews; refresh stale details.</li>
  <li>After major projects: write a 1-pager <em>at the time</em> — easier than recovering details a year later.</li>
  <li>After failures: write the lesson while it's fresh. The cleanest "what I learned" lines come from contemporaneous notes.</li>
  <li>Annually: prune. If a story is &gt; 3 years old and you have a newer one, replace it.</li>
</ul>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples (10 Archetype Stories)',
      html: `
<p>Each story below is generic enough to adapt; the structure is real. Replace specifics with your own experience.</p>

<h3>Story 1: Complex technical investigation — "Chat memory leak"</h3>
<p><strong>Tags:</strong> technical depth, ownership, data-driven thinking, persistence</p>
<pre><code class="language-text">[S] Our React Native chat app crashed for users on Android devices &lt;6GB RAM after ~2 hours of continuous use. Crash rate hit 2.1% of sessions; on Play Console it was the top user-perceived issue.

[T] I was the senior on the chat squad. I owned the investigation.

[A]
  - I instrumented memory traces using Android Studio's Memory Profiler at 5-min intervals during a scripted 90-min session.
  - I identified that our message-list virtualization wasn't releasing image cache entries when items scrolled out of the window.
  - I considered three fixes: bounded LRU on our cache, off-thread decoding, or replacing our Image component with FastImage.
  - I prototyped the bounded LRU first — smallest change. Memory stayed at 280MB instead of growing past 1GB, but scroll p95 fps regressed from 58 to 50.
  - I switched to FastImage with a smarter prefetch strategy. This gave bounded memory AND better scroll perf because of native-side caching.
  - I A/B tested the change at 5% rollout, watched for 2 days, then ramped to 100%.

[R] Crash rate dropped from 2.1% to 0.4% of sessions. Scroll fps p95 went from 50 → 58. Crash-free user rate +1.3pp.

[L] My initial hypothesis was that we had too many event listeners — I would have wasted a week without the heap dump. I now insist on at least one round of measurement before any "optimization" work.
</code></pre>

<h3>Story 2: Disagreed with senior — "GraphQL pushback"</h3>
<p><strong>Tags:</strong> conflict, courage, communication, data-driven</p>
<pre><code class="language-text">[S] Two months before our checkout launch, the backend lead proposed introducing GraphQL. We had a flat performance budget; adding net work was off-limits.

[T] As mobile lead, I was concerned about cold-start and bundle size. I had to push back without undermining her authority.

[A]
  - I built a small spike adding Apollo to our feature branch and measured: +180KB gzipped, +120ms first-paint on a P50 Android device.
  - I shared the data with her in a 1:1 — framed as "here are the constraints" not "no."
  - She had legitimate concerns: N+1 fetches and over-fetching on REST.
  - I proposed three options with tradeoffs: full GraphQL, custom REST endpoints aggregating mobile-shape data, or status quo.
  - I asked her what she most cared about — turned out it was the BFF problem, not GraphQL.
  - I drafted a 1-pager for the REST aggregation approach; we reviewed with the EM.
  - We agreed on REST for checkout, with "revisit GraphQL post-launch" in Q3 OKRs.

[R] Launched on time. Cold-start stayed at 1.6s P95 (target 1.7). BFF problem solved with 4 new endpoints. Six months later we revisited GraphQL with much clearer expectations.

[L] I waited about a week into the disagreement before bringing data. Earlier numbers would have shortened the friction. I now bring measurement to a disagreement within 24-48 hours instead of debating opinions.
</code></pre>

<h3>Story 3: Failure — "Built an in-house feature flag system"</h3>
<p><strong>Tags:</strong> failure, self-awareness, ambiguity, technical depth</p>
<pre><code class="language-text">[S] Two years ago, I proposed building an in-house feature flag system instead of buying LaunchDarkly. Our existing system was slow and lacked targeting.

[T] I was tech lead on the build.

[A]
  - I scoped 6 weeks. I underestimated three things: operational cost (auth, audit, multi-region replication), client rollout effort, and how much our PMs depended on targeting features I had marked "phase 2."
  - We shipped at week 12. Two weeks after launch, flag fetches added 80ms p99 to our hottest endpoint because I hadn't modeled the in-process cache layer correctly.
  - We rolled back to the old system for a week while I added the cache.
  - Six months later we paid for LaunchDarkly anyway because PMs needed targeting and the org didn't want me spending another quarter rebuilding.

[R] Direct cost: ~$200k of engineering time. Opportunity cost: a quarter we could have spent on user features. The lasting positive is the lesson.

[L] Two lessons. First, "buy vs build" for infra is rarely a 6-week decision; the long tail of operational work kills you. Second, I now write a "cost of ownership" section for any infra proposal — runtime, on-call, audits, growth. I've used that template on 4 proposals since and shipped "buy" on 2.
</code></pre>

<h3>Story 4: Spotted a problem — "Crash triage dashboard"</h3>
<p><strong>Tags:</strong> ownership, proactive, leadership, influence</p>
<pre><code class="language-text">[S] Our checkout team had recurring crashes during high-traffic events. Ownership was unclear — Backend, SRE, and Frontend each thought another team owned alerting.

[T] Nobody was assigned. I decided to take on visibility and triage even though it wasn't formally my job.

[A]
  - I built a dashboard joining Sentry crash data with Datadog APM traces, keyed by request ID.
  - The dashboard surfaced "at-the-time-of-crash" backend latency — a key context piece nobody had.
  - I scheduled a weekly 30-min triage with one volunteer from each of the three teams. I prepared the slides.
  - I didn't mandate fixes; I mandated visibility — "this issue is yours, this one is mine, this one needs investigation."
  - After 4 weeks, I proposed a RACI matrix. The teams adopted it.
  - The triage became a 15-min standing meeting integrated into all three teams' rituals.

[R] Crash rate during traffic events dropped from 1.4% to 0.3% over 2 quarters. The ownership confusion ended; the dashboard became standard for retros.

[L] "Going beyond scope" works best when you start with information, not authority. If I'd walked in saying "I'll own this," I'd have been the lone person doing the work; instead I made it joint responsibility through the dashboard.
</code></pre>

<h3>Story 5: Influencing without authority — "PM scope creep"</h3>
<p><strong>Tags:</strong> influence, stakeholder management, communication, conflict</p>
<pre><code class="language-text">[S] On an AI assistant feature, our PM kept adding scope mid-sprint, claiming each was "a small change." By week 4 we were 50% over budget.

[T] I needed to align on scope without damaging the relationship. She had to remain a long-term partner.

[A]
  - I avoided escalating. Asked her for a 30-min walk-through of the spec from her perspective — listened, didn't argue.
  - I learned she was getting late asks from her director and felt pressure to absorb them.
  - I proposed a "change request log": each new ask logged with estimated cost; reviewed every Monday; approve, defer, or reject.
  - I offered to attend her director's reviews so she had air cover saying "no" upstream.

[R] Sprint variance dropped from 50% to 8% over three sprints. The PM and I built strong trust — she still pings me 18 months later for prioritization input.

[L] Scope creep is usually a symptom of upstream pressure, not undisciplined PMs. Solving the upstream pressure was more effective than pushing back on individual asks.
</code></pre>

<h3>Story 6: Decision under ambiguity — "Rapid migration"</h3>
<p><strong>Tags:</strong> ambiguity, leadership, judgment, bias for action</p>
<pre><code class="language-text">[S] Our company acquired a smaller startup whose mobile app was on a deprecated framework. Leadership wanted us to "merge" the apps in a quarter, with no clear definition of "merge."

[T] I was assigned tech lead for the integration.

[A]
  - I started by listing the unknowns: their auth system, their data model, their CI/CD, their on-call. Each was a TBD.
  - I picked the highest-leverage unknown first — auth — and spent 1 week building a prototype that could authenticate against both systems.
  - I drafted a 1-pager outlining 3 paths: rebuild their app inside ours, run both apps in parallel, deprecate theirs. Each had distinct effort, risk, and user impact.
  - I socialized with leadership before committing; they preferred Path B (parallel) for risk reasons.
  - I broke Path B into 6 weekly milestones with clear go/no-go criteria.
  - At week 3 we hit a blocker on push notifications — their tokens couldn't be migrated. I escalated and we got an exception from product to ask users to re-enable.

[R] Both apps integrated in the quarter. 88% of acquired users migrated within 60 days. Crash rate during transition stayed under our 0.5% threshold.

[L] Reducing ambiguity early is more valuable than executing fast. The week I spent on the auth prototype saved us at least 4 weeks of misdirected work.
</code></pre>

<h3>Story 7: Mentorship — "Junior turning into senior"</h3>
<p><strong>Tags:</strong> leadership, develop-others, empathy, mentorship</p>
<pre><code class="language-text">[S] Our team hired a new-grad engineer who joined right before a major launch. Her first PRs took 4-5 review rounds; the team was getting frustrated.

[T] As senior on the team, I took her on as a 1:1 mentee.

[A]
  - I started with a 30-min observation: I watched her open a PR. The pattern: she'd write code, push, then the team's nits would land. She was firefighting, not anticipating.
  - I introduced a "pre-PR checklist" tailored to her work: edge cases, perf, accessibility, naming. Spent 30 min walking her through it.
  - We did 30-min weekly 1:1s focused on craft, not status.
  - I paired with her on 2 large PRs — she drove, I commented inline. She started anticipating the comments.
  - I also gave the team feedback: more substantive comments early in the PR, fewer "nit:" comments late.

[R] By month 3 her PR cycle dropped from 4-5 rounds to 1-2. Six months in she shipped a critical feature for the launch with minimal review burden. She's now mentoring the next new-grad.

[L] Most "underperforming junior" stories are actually feedback-loop problems. The bug wasn't her code; it was that the team's review style trained her to under-prepare. I now diagnose the system, not the individual.
</code></pre>

<h3>Story 8: Long migration — "RN to Native modules"</h3>
<p><strong>Tags:</strong> scope, leadership, consistency, delivery</p>
<pre><code class="language-text">[S] Our React Native app's bridge was bottlenecking 12 native modules. Migration to TurboModules was needed for the next major version.

[T] I was the staff engineer; I owned the migration plan.

[A]
  - I built a representative slice (1 module) to estimate per-module effort: ~3 weeks each. Total: 36 engineer-weeks against 24 weeks of capacity.
  - I drafted a phased plan: 4 modules in Q1, 5 in Q2, 3 in Q3.
  - I picked the easiest 4 modules first to build team confidence and codify our migration patterns.
  - I instituted weekly migration sync; each engineer presented their module's progress and blockers.
  - At week 6 we hit a snag: third-party library X hadn't migrated. I escalated to that library's maintainer, contributed a PR upstream, and unblocked us.
  - I documented patterns in a runbook; junior engineers picked up the last few modules without senior pairing.

[R] All 12 modules migrated by end of Q3. Zero production incidents during migration. Bridge call time dropped 40% on average.

[L] Long migrations succeed on consistency, not heroics. I now front-load the easy ones to establish patterns and team momentum.
</code></pre>

<h3>Story 9: Mid-project pivot — "BFF instead of GraphQL"</h3>
<p><strong>Tags:</strong> adaptability, judgment, courage, focus</p>
<pre><code class="language-text">[S] Three weeks into a quarter dedicated to introducing GraphQL across our mobile platform, I realized the actual bottleneck was something different.

[T] I was the tech lead. My job was to detect this and act.

[A]
  - During the GraphQL spike I had instrumented our REST endpoints. The data showed our biggest mobile latency wasn't over-fetching — it was waterfall calls (each screen made 6-8 sequential REST calls).
  - GraphQL would have helped, but at the cost of a quarter of migration. A simpler BFF that aggregated 6-8 calls into 1 would solve the actual pain in weeks.
  - I drafted a 1-pager for the leadership review proposing the pivot. Stated explicitly: "We made the wrong initial decision; here's the data; here's the new plan."
  - I expected pushback. Instead, the EM and PM agreed within 30 minutes.
  - I redirected the team within a week. We shipped the BFF in 7 weeks.

[R] Time to first meaningful render dropped 35% on home screen. Mobile p95 dropped from 1.8s to 1.1s. Cost: 0; we hadn't yet built any GraphQL code, just spike work.

[L] Pivoting is harder than committing — there's social cost. But waiting another month would have cost weeks of misdirected work. I now treat "I might be wrong" as a checkpoint at week 1, week 4, and week 8 of any quarter-long initiative.
</code></pre>

<h3>Story 10: Incident response — "Outage at 3am"</h3>
<p><strong>Tags:</strong> calm under pressure, ownership, customer focus, post-mortem rigor</p>
<pre><code class="language-text">[S] At 3am on a Saturday, I got paged: our app's login was returning 500 errors for ~40% of users. App Store reviews were flooding in.

[T] I was on-call. I was sole responder for the first 20 minutes.

[A]
  - I joined the incident channel, posted a public ETA (within 5 min: "investigating, will update at 3:25am").
  - I checked our standard playbook: most-recent deploy, error rate dashboards, dependency status pages.
  - Identified: a deploy 2 hours earlier had increased a JWT key rotation interval; old tokens were being rejected sooner than expected.
  - Rolled back the deploy via our standard rollback runbook (8 minutes from decision to recovery).
  - Verified login error rate dropped to baseline within 10 minutes.
  - Posted to the incident channel + status page: "Resolved. Root cause: token TTL change. Investigating mitigation."
  - Wrote the post-mortem at 9am. Identified that we had no canary on auth changes; proposed a guardrail.

[R] Total downtime: 38 minutes. ~12% of users affected during that window. We added a canary deploy for auth-related changes; that bug class hasn't recurred in 18 months.

[L] During the incident I felt panicked, but the playbook took over. The lesson wasn't about the technical fix — it was that having a rehearsed playbook was the difference between a 38-minute outage and a 3-hour one. I now insist that every team has and rehearses a runbook for their top 3 failure modes.
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>"My career has been mostly maintenance"</h3>
<p>Plenty of strong stories live in maintenance work: a bug you tracked across 3 systems, a refactor that unblocked a 5-person team, a deprecation you executed without breaking customers. Reframe maintenance as <em>care</em>; senior engineers value it.</p>

<h3>"All my projects are confidential"</h3>
<p>Anonymize. "A regulated B2B service" or "a consumer-facing iOS app with millions of MAU." Keep the structure; obscure the brand. Don't lie; just abstract.</p>

<h3>"I have great stories from 5 years ago, none recent"</h3>
<p>Pull recent ones harder. Recency signals current capability; old stories signal "I peaked." Even small recent incidents (an on-call rotation, a code review where you raised an issue) work better than a 5-year-old success.</p>

<h3>"My company doesn't share metrics"</h3>
<p>Use ranges and relative changes: "p95 dropped by roughly half"; "crash rate halved over a quarter"; "single-digit-percent revenue lift." Avoid absolute revenue / user numbers if your company would consider them sensitive.</p>

<h3>"My biggest project went well — it's not interesting"</h3>
<p>Then it's a dull story. Find the complication: a stakeholder disagreement mid-project, a tradeoff you weighed, a moment you almost made the wrong call. Smooth-sailing projects rarely make great stories; the texture is in the friction.</p>

<h3>"I'm a junior; I don't have leadership stories"</h3>
<p>Leadership ≠ formal management. Pick from:</p>
<ul>
  <li>Mentoring an intern.</li>
  <li>Driving a small initiative or hackathon project.</li>
  <li>Authoring an RFC.</li>
  <li>Running a recurring team sync, retro, or book club.</li>
  <li>Taking on a piece of work nobody else wanted.</li>
</ul>

<h3>"I'm a senior+; my stories all involve other people"</h3>
<p>Right — and your job is to extract <em>your slice</em>. The rubric grades you on what <em>you</em> contributed: decisions, conversations, tradeoffs you weighed, people you influenced. Even if 5 people delivered, your unique contribution is what's interviewable.</p>

<h3>"My current company has unusual culture / processes"</h3>
<p>Translate to language interviewers know. "We use OKRs" is universal; "we use the Spotify model" is debatable; "we have squad-driven priority weekly votes" needs explanation. Anchor unfamiliar terms in familiar concepts.</p>

<h3>"My target company is very different from where I work"</h3>
<p>Calibrate which stories you emphasize. A startup → big company transition values stories about scale, process, cross-org coordination. Big company → startup transition values stories about speed, autonomy, generalist work.</p>

<h3>"I had to leave a job under bad circumstances"</h3>
<p>Don't avoid the topic if asked. Be brief, professional, factual: "The team was reorganized; my role was eliminated." or "I had a values disagreement with leadership; I left amicably." Don't editorialize. Pivot to "what I learned and what I'm looking for next."</p>

<h3>"I have only one company on my resume"</h3>
<p>Fine; just slice your stories by year, project, or role transition. "When I joined I was a junior; by year 3 I was tech lead — let me tell you about a project from each phase."</p>

<h3>"I work in research / academia / freelance — different shape"</h3>
<p>Research = projects with deadlines, collaborations, presentations. Academia = teaching, mentoring, navigating bureaucracy. Freelance = client management, scoping, working alone with ambiguity. The competencies translate; just frame in language interviewers know.</p>

<h3>"My 'failure' story doesn't have a clean recovery"</h3>
<p>That's OK. The Result can be "we cut our losses" or "the project was cancelled." What matters is your reflection. Some failures don't get rescued; the lesson is what you do with that.</p>

<h3>"I tend to ramble"</h3>
<p>Time-rehearse. Set a 3-minute timer; deliver the story. Listen back. Cut whatever you'd cut if you read it as text. Repeat 5 times. Most ramblers can hit 3 minutes after 5 takes.</p>

<h3>"I'm worried I sound arrogant"</h3>
<p>The fix isn't to under-claim; it's to over-credit context. "The team made this possible by X; I specifically did Y." Specificity sounds confident; vague claims sound arrogant.</p>

<h3>"My English isn't native — I worry about clarity"</h3>
<p>Slow down 10%. Use shorter sentences. Use the words you know well; don't reach for synonyms you're unsure of. Interviewers grade content, not accent. Most multinationals have non-native interviewers themselves.</p>

<h3>"I get nervous and forget the details"</h3>
<p>Keep a 1-page bank summary in your line of sight (during phone or video). Use a notepad with the 10 story titles + key metrics. Don't read scripts; do glance for cues. Many candidates have this; few admit it.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: Same story for "conflict" and "leadership"</h3>
<p>Loop interviewers compare notes. If two of them hear the same incident, you appear thin. Have at least 2 distinct stories per major theme.</p>

<h3>Bug 2: "We" everywhere</h3>
<p>Re-read your draft. Count "we" vs "I" in the Action section. If "we" outnumbers "I" by &gt; 2:1, rewrite.</p>

<h3>Bug 3: Numbers without context</h3>
<p>"We reduced latency by 200ms" — from what to what? "We reduced p95 from 1.4s to 1.2s, a 14% improvement on a key user journey" is concrete. Always provide the baseline.</p>

<h3>Bug 4: Lessons that don't tie to behavior change</h3>
<p>"I learned that communication is important" — vague, unactionable. "I now write a 1-page proposal before any cross-team initiative because last time I skipped that step and ended up redoing the work" — specific, gradeable.</p>

<h3>Bug 5: Front-loading the most boring detail</h3>
<p>Don't open with "I joined the company in 2019, the team was 8 people, we used Java 8..." Lead with the stakes: "We were 6 weeks from launch with a 30% over-budget bundle size."</p>

<h3>Bug 6: Burying the conflict in a "leadership" story</h3>
<p>Interviewers ask "tell me about a conflict" because they want to <em>see the conflict</em>. Don't sand it down to "we had different opinions; we discussed." Show the friction; show how you handled it.</p>

<h3>Bug 7: Defending bad decisions</h3>
<p>If your story is about a failure, own the decision: "I underestimated the operational cost." Don't pivot to "the requirements weren't clear" or "the manager was rushed." Self-awareness scores higher than self-defense.</p>

<h3>Bug 8: Excessive jargon</h3>
<p>"I leveraged Kafka-based CDC into Flink streaming for a Pinot OLAP cube." → "I built a streaming pipeline for real-time analytics." If the interviewer wants depth, they'll ask. Lead with intent, not stack.</p>

<h3>Bug 9: Memorized delivery</h3>
<p>You can hear it. Practice the beats; don't memorize phrasing. Slight variation each time keeps it natural.</p>

<h3>Bug 10: Refusing to admit you don't know</h3>
<p>"I don't remember the exact number" or "I'd need to think about that" is honest and acceptable. Fabricating is worse — interviewers often probe specifically to test honesty.</p>

<h3>Anti-pattern 1: One-shot interview prep</h3>
<p>Cramming 10 stories the night before. Even strong stories sound rough delivered cold. Spread prep over 2 weeks.</p>

<h3>Anti-pattern 2: Identical bank for every company</h3>
<p>Different companies value different traits. Amazon LP-loop favors stories that map to specific principles; Meta values "move fast" stories; Google rewards cross-team thinking. Rebalance which stories you lead with per company.</p>

<h3>Anti-pattern 3: Grandiose framing</h3>
<p>"I single-handedly saved the company $10M." Even if true, this lands badly. Most interviewers prefer credible stories under-claimed than incredible stories over-claimed.</p>

<h3>Anti-pattern 4: Skipping rehearsal because "I know what happened"</h3>
<p>Knowing facts ≠ delivering them. Rehearse out loud. The first telling always rambles; the third lands clean.</p>

<h3>Anti-pattern 5: Refusing to retire stories</h3>
<p>You used to be a junior; that "first big project" story may not show senior signal. Retire it for senior interviews; replace with newer material.</p>

<h3>Anti-pattern 6: Treating follow-ups as adversarial</h3>
<p>"Why did you choose X over Y?" is interest, not interrogation. Welcome it. Most candidates feel attacked and shrink; the opposite move scores.</p>

<h3>Anti-pattern 7: Listing too many stories</h3>
<p>30 stories you've barely rehearsed beats 10 polished ones in volume but loses in delivery. Quality over quantity. 8-12 polished stories cover almost any loop.</p>

<h3>Anti-pattern 8: Forgetting to preview</h3>
<p>"Before I dive in — would it help if I gave you the 30-second version first?" This invites the interviewer to direct depth. Many love it.</p>

<h3>Anti-pattern 9: Not closing the loop</h3>
<p>End your story with the Result + Learning. Don't trail off ("...and yeah, that was that"). Land the plane: "The result was X; what I'd do differently is Y. Happy to go deeper on any part."</p>

<h3>Anti-pattern 10: Treating behavioral as an afterthought</h3>
<p>Many engineering candidates over-prep technical and under-prep behavioral. At staff+ levels, behavioral often decides the loop. Treat it as 1/3 of total prep, not 1/10.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '🎤 Interview Patterns',
      html: `
<h3>The story-to-question mapping</h3>
<p>Each of the 10 archetype stories above maps to multiple common questions:</p>
<table>
  <thead><tr><th>Story</th><th>Best fit for</th></tr></thead>
  <tbody>
    <tr><td>1. Memory leak</td><td>Complex tech, ownership, data-driven, persistence</td></tr>
    <tr><td>2. GraphQL pushback</td><td>Conflict, courage, communication, data-driven, influence</td></tr>
    <tr><td>3. Flag system fail</td><td>Failure, self-awareness, ambiguity, lessons-learned</td></tr>
    <tr><td>4. Crash dashboard</td><td>Ownership, proactive, leadership, influence, cross-functional</td></tr>
    <tr><td>5. PM scope creep</td><td>Stakeholder, conflict, communication, influence</td></tr>
    <tr><td>6. Rapid migration</td><td>Ambiguity, leadership, judgment, bias-for-action</td></tr>
    <tr><td>7. Junior mentor</td><td>Leadership, develop-others, empathy, mentorship</td></tr>
    <tr><td>8. RN to Native migration</td><td>Scope, leadership, consistency, delivery</td></tr>
    <tr><td>9. Pivot to BFF</td><td>Adaptability, judgment, courage, focus</td></tr>
    <tr><td>10. Outage at 3am</td><td>Pressure, ownership, customer, post-mortem</td></tr>
  </tbody>
</table>

<h3>Live coding warmups (verbal practice)</h3>
<ol>
  <li>Pick a story; deliver in 90 seconds (compress).</li>
  <li>Pick the same story; deliver in 5 minutes (expand with tradeoffs and decisions).</li>
  <li>Pick a story; have a friend ask 3 follow-ups; answer in &lt;60 seconds each.</li>
  <li>Pick a story; map it to 3 different question prompts.</li>
  <li>Record yourself; flag filler words and pacing.</li>
</ol>

<h3>The "loop pre-flight"</h3>
<ul>
  <li>Day before: read your bank summary; pick 5 priority stories for the loop.</li>
  <li>Morning of: brief warmup — deliver 2 stories aloud.</li>
  <li>Between rounds: note which stories you used; rotate to backups.</li>
  <li>After loop: write down which questions you got and which stories you used; refine for next loop.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Story diversity</td><td>Different incidents per question; not the same story restyled.</td></tr>
    <tr><td>Specificity</td><td>Names, numbers, decisions, dates.</td></tr>
    <tr><td>Self-awareness</td><td>You volunteer the lesson and how you've applied it.</td></tr>
    <tr><td>Decision-making</td><td>You explain why you chose A over B.</td></tr>
    <tr><td>Maturity</td><td>You frame conflict generously; you own failures.</td></tr>
    <tr><td>Pattern recognition</td><td>You can map the same story to multiple competencies on demand.</td></tr>
    <tr><td>Adaptability</td><td>You adjust depth based on interviewer cues.</td></tr>
    <tr><td>Closing</td><td>Every story ends with a clear Result + Lesson.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li><strong>Mobile-specific incident stories</strong> (App Store rejection, OS-version bug, native crash, ATT denial impact) carry unique weight at mobile-focused companies.</li>
  <li><strong>Stories about device fragmentation</strong> (Android OEM-specific bugs, iOS version transitions) signal mobile depth.</li>
  <li><strong>Stories about cross-platform decisions</strong> (RN vs native, code-share vs duplication) test mobile architectural judgment.</li>
  <li><strong>Stories about user-perceived performance</strong> (cold-start, scroll, animation) — mobile teams care about UX intensely.</li>
  <li><strong>Stories about release management</strong> (phased rollouts, crash-free user-rate gates, OTA updates) — less common in web but central in mobile.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"How many stories should I have?"</em> — 8-12. More than 12 is unrehearsable; fewer than 8 leaves gaps.</li>
  <li><em>"Should I write them down?"</em> — Yes, in a private doc. Bullet-point STAR-L. Don't memorize prose.</li>
  <li><em>"Can I tell the same story across two interviewers in the same loop?"</em> — Risky. Loops typically share notes. If you must repeat, flag: "I told this in a previous round, but happy to give a different angle." Better: have backups.</li>
  <li><em>"What if the interviewer says 'tell me a different example'?"</em> — Have a second story ready. The interviewer is testing depth.</li>
  <li><em>"How recent should stories be?"</em> — Last 3 years preferred. 5+ years means "I peaked" signal. Mix in at least one from the last 12 months.</li>
  <li><em>"What if my best stories are too senior for the role I'm applying for?"</em> — Edit. A staff-level story can be told as "I helped lead..." for a senior role; emphasis shifts from "drove" to "contributed substantially to."</li>
</ul>

<h3>"What I'd do day one prepping for a behavioral loop"</h3>
<ul>
  <li>Read this topic's worked examples for shape; don't copy.</li>
  <li>List 30 incidents from your career.</li>
  <li>Pick 10 strongest; tag with competencies.</li>
  <li>Draft STAR-L for each; one page per story.</li>
  <li>Time-rehearse each at 90s, 3min, 5min.</li>
  <li>Mock-interview 3 times; refine based on follow-ups.</li>
  <li>Build a 1-page bank summary you can glance at during phone screens.</li>
  <li>For target company: re-prioritize stories that map to their published values.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd add a 'follow-up answers' card per story with 5 anticipated probes."</li>
  <li>"I'd record myself on video and review for filler words and pacing."</li>
  <li>"I'd run mocks with engineers from target company tier (peer for senior, manager for staff+)."</li>
  <li>"I'd build a 'tag matrix' spreadsheet to confirm I have 2+ strong stories per competency."</li>
  <li>"I'd update the bank quarterly so it doesn't go stale between job searches."</li>
</ul>
`
    }
  ]
});
