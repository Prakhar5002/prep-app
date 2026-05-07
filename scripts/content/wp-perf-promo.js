window.PREP_SITE.registerTopic({
  id: 'wp-perf-promo',
  module: 'workplace',
  title: 'Performance Reviews & Promo Narratives',
  estimatedReadTime: '45 min',
  tags: ['performance-review', 'promotion', 'calibration', 'self-eval', 'career', 'faang', 'narrative'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>Performance reviews and promotions look like an evaluation of your work; they're actually a <strong>narrative-construction exercise</strong> against a leveling rubric, decided in calibration meetings you don't attend. The work matters; how it's framed in your packet matters as much. Engineers who treat the perf cycle as "they'll see what I did" lose to peers who treat it as a written argument.</p>
<ul>
  <li><strong>Promotions are decided in calibration,</strong> not by your manager alone. Calibration = a room of managers comparing packets across orgs. Your manager <em>advocates</em>; you <em>give them the ammo</em>.</li>
  <li><strong>"Doing the job at the next level"</strong> is the bar — not "ready for next level." If you're not already doing it (visibly), you're not promoting.</li>
  <li><strong>Scope &gt; effort.</strong> Hours worked, lines shipped, tickets closed don't promote you. Scope (impact across teams / orgs / quarters) does.</li>
  <li><strong>The packet is a written argument:</strong> 3-5 highlight projects, each with concrete impact (numbers / dollars / users / latency / cost), peer testimonials, forward-looking trajectory.</li>
  <li><strong>Build the packet across the year,</strong> not in the last 2 weeks. Quarterly snippets beat last-minute reconstruction.</li>
  <li><strong>Manager alignment in advance.</strong> Surprises in calibration are how packets fail. Quarterly "am I on track?" check beats year-end "what went wrong?"</li>
  <li><strong>Common rejection reasons:</strong> scope too narrow, behaviors gap (collaboration / communication / mentorship), business impact unclear, peer signals weak, "ready" but not "doing it."</li>
  <li><strong>Recovery is real:</strong> "not ready" usually = 6-12 months, not "never." Don't take it as final; take it as feedback.</li>
</ul>
<p><strong>Mantra:</strong> "Build scope, document impact, align early, write the packet as an argument. Promotions are decided in rooms you're not in — give your manager the ammo to win."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What perf reviews actually are</h3>
<p>At FAANG and most large companies, perf review is a multi-stage process:</p>
<ol>
  <li><strong>Self-eval:</strong> you write up your year. Free-form or templated.</li>
  <li><strong>Peer feedback:</strong> 4-8 colleagues (you nominate; manager picks final list) write feedback.</li>
  <li><strong>Manager writes the eval</strong> based on your input + peer signals + their direct observation.</li>
  <li><strong>Calibration:</strong> manager defends your eval against peers' eval at a calibration meeting; ratings + promo decisions made <em>relative to peers across the org</em>.</li>
  <li><strong>Delivered:</strong> you get the rating, comp adjustment, promo decision.</li>
</ol>

<p>The thing most engineers miss: <strong>step 4 is where the decision actually happens, and you're not there</strong>. Your manager is your advocate. Their job is hard if your packet is weak; impossible if your packet contradicts itself.</p>

<h3>Why scope matters more than effort</h3>
<table>
  <thead><tr><th>What you might think matters</th><th>What actually matters</th></tr></thead>
  <tbody>
    <tr><td>Hours worked</td><td>Cross-team impact</td></tr>
    <tr><td>Lines of code</td><td>Quarterly business outcome moved</td></tr>
    <tr><td>Tickets closed</td><td>Bug-class eliminated; system simplified</td></tr>
    <tr><td>"I worked on a hard problem"</td><td>"This shipped, drove X metric by Y%, used by Z teams"</td></tr>
    <tr><td>Manager praise in 1:1</td><td>Skip-level recognition + peer testimonials</td></tr>
    <tr><td>"I was busy"</td><td>"I owned this end-to-end"</td></tr>
  </tbody>
</table>

<h3>The leveling ladder (typical FAANG / IC track)</h3>
<table>
  <thead><tr><th>Level</th><th>Scope</th><th>Behavior</th></tr></thead>
  <tbody>
    <tr><td>L3 / Junior</td><td>Bounded tasks; needs guidance</td><td>Learns; ships with help</td></tr>
    <tr><td>L4 / Mid</td><td>Owns features end-to-end</td><td>Independent execution; reasonable judgment</td></tr>
    <tr><td>L5 / Senior</td><td>Owns systems / projects across quarters</td><td>Mentors; sets direction within team; cross-team coordination</td></tr>
    <tr><td>L6 / Staff</td><td>Owns initiatives across teams; technical leader</td><td>Influences org-level decisions; multiplier on others</td></tr>
    <tr><td>L7 / Senior Staff / Principal</td><td>Owns strategy across orgs</td><td>Sets technical direction at the leadership level</td></tr>
  </tbody>
</table>

<p>Different companies use different naming (Meta E5/E6, Google L5/L6, Amazon SDE3/Senior SDE) but the shape is identical: <em>scope expands; behaviors expand; multiplier on others expands</em>.</p>

<h3>Why you have to write the argument yourself</h3>
<ul>
  <li>Your manager has 8-12 reports; can't track every detail.</li>
  <li>Calibration moves fast; only the headline-level argument survives.</li>
  <li>Cross-org comparison requires <em>concrete numbers</em>; vague descriptions lose.</li>
  <li>Your manager defends you alone in a room of 5-10 other managers; the packet is their ammo.</li>
  <li>Peer feedback can be inconsistent; the structured packet anchors interpretation.</li>
</ul>

<h3>What "good packet" looks like</h3>
<ul>
  <li>3-5 highlight projects (not 12); each is multi-quarter scope.</li>
  <li>Each highlight: title, scope, your role, business impact (numbers), behaviors demonstrated.</li>
  <li>Forward-looking section: trajectory, what you'll own next year.</li>
  <li>Behavioral evidence: collaboration, mentorship, technical leadership — with examples.</li>
  <li>Peer feedback aligned with your packet (same projects, same framing).</li>
  <li>No surprises for your manager; everything you wrote was previewed in 1:1s through the year.</li>
</ul>

<h3>What "weak packet" looks like</h3>
<ul>
  <li>Long list of small accomplishments; no signal on what matters most.</li>
  <li>Vague impact ("improved performance") without numbers.</li>
  <li>Effort-coded ("I worked hard on...") instead of outcome-coded.</li>
  <li>No cross-team / cross-org examples (locks you out of L5+).</li>
  <li>Behavioral gaps not addressed (peer feedback noted "could communicate better"; packet pretends it didn't).</li>
  <li>Peer feedback contradicts the packet narrative.</li>
  <li>Manager surprised by something at year-end.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The narrative is the product</h3>
<p>Your year produces work and produces a narrative about that work. Both ship. Engineers who ignore the narrative ("the work speaks for itself") lose to engineers who write it.</p>

<p>The narrative answers, in order:</p>
<ol>
  <li><strong>What was the most impactful thing you shipped?</strong> (one sentence)</li>
  <li><strong>What was the impact in numbers?</strong> (revenue / users / latency / cost / time saved)</li>
  <li><strong>What scope did you own?</strong> (just your team, multiple teams, cross-org)</li>
  <li><strong>What behaviors did you demonstrate?</strong> (technical leadership, mentorship, collaboration)</li>
  <li><strong>What's next?</strong> (forward-looking; reduces "ready" anxiety)</li>
</ol>

<h3>"Doing the job" vs "ready for the job"</h3>
<p>The single most-misunderstood promotion principle:</p>
<ul>
  <li><strong>"Ready for next level"</strong> = "if I gave them the responsibility, they'd handle it." (This is not enough.)</li>
  <li><strong>"Already doing the job at next level"</strong> = "they're already operating with that scope, that behavior, that outcome." <strong>This is the bar.</strong></li>
</ul>

<p>If you've never operated at next level, calibration won't promote you. The way to promote is to <em>act at next level for 6-12 months before formally getting it</em>. Yes, this means doing the harder work without the title. It's how it works.</p>

<h3>The 3 rejection categories</h3>
<table>
  <thead><tr><th>Rejection</th><th>Means</th><th>Recovery time</th></tr></thead>
  <tbody>
    <tr><td>"Scope is too narrow"</td><td>You haven't operated cross-team yet at next level</td><td>6-12 months; need bigger projects</td></tr>
    <tr><td>"Behaviors gap"</td><td>Peer feedback flagged collaboration / communication / mentorship issues</td><td>6-12 months; needs visible behavior change</td></tr>
    <tr><td>"Business impact unclear"</td><td>Couldn't tie work to business outcomes</td><td>3-6 months; needs reframing + better metrics</td></tr>
    <tr><td>"Peer signals weak"</td><td>Cross-team peers don't know what you did or didn't see leadership</td><td>6-12 months; needs visibility + collaboration</td></tr>
    <tr><td>"Not yet at next level (but trending)"</td><td>Doing the job sometimes; not consistently</td><td>3-6 months; tighten the consistency story</td></tr>
  </tbody>
</table>

<h3>The annual rhythm</h3>
<table>
  <thead><tr><th>Time</th><th>What to do</th></tr></thead>
  <tbody>
    <tr><td>Q1 (start of cycle)</td><td>Set goals with manager; ensure they're scoped to your target level</td></tr>
    <tr><td>Q1 mid</td><td>Confirm the project portfolio: which 3-5 are your "highlights"?</td></tr>
    <tr><td>Quarterly</td><td>Write a "snippet" — one paragraph per project: status, impact, learnings. Save in a personal doc.</td></tr>
    <tr><td>Mid-year (if checkpoint)</td><td>Mid-year review; explicit ask: "am I on track for promo?" Get specific gaps named.</td></tr>
    <tr><td>Q3 / Q4</td><td>Polish highlights. Stop starting new things; finish + measure existing.</td></tr>
    <tr><td>2-4 weeks before due</td><td>Write self-eval from snippets. Iterate with manager 2-3 times.</td></tr>
    <tr><td>Peer-feedback window</td><td>Nominate 4-6 peers strategically; brief them informally on what you'd value feedback on.</td></tr>
    <tr><td>Calibration</td><td>You're not in the room. Trust manager; don't pester.</td></tr>
    <tr><td>Delivery</td><td>Receive rating; ask 2 questions: "what specifically would make me promo-ready?" + "what should I focus on next?"</td></tr>
  </tbody>
</table>

<h3>Project portfolio: 3-5 highlights</h3>
<p>The right shape:</p>
<ul>
  <li><strong>1 anchor project:</strong> multi-quarter, large scope, clear impact. Your "what would I tell a stranger about my year?" answer.</li>
  <li><strong>2-3 supporting projects:</strong> show breadth + collaboration. Not "I did this alone"; "I led / contributed to."</li>
  <li><strong>1 stretch / forward-looking:</strong> shows trajectory. Maybe it's not finished yet; that's fine.</li>
</ul>

<p>Wrong shape: 12 small projects (signal: didn't focus). 1 huge project (signal: narrow). Anchor + breadth is the formula.</p>

<h3>Impact framing: outcome over effort</h3>
<p>Compare:</p>
<table>
  <thead><tr><th>Effort framing (weak)</th><th>Outcome framing (strong)</th></tr></thead>
  <tbody>
    <tr><td>"Implemented authentication for the new app."</td><td>"Designed + shipped auth flow used by 5M users; reduced auth-related support tickets by 40% in Q3."</td></tr>
    <tr><td>"Mentored junior engineers."</td><td>"Mentored 3 juniors, all of whom shipped their P0 quarterly goals; one promo'd to L4 mid-year."</td></tr>
    <tr><td>"Worked on infra improvements."</td><td>"Migrated payment service from monolith to microservice; reduced p99 latency from 800ms to 150ms; saved $200K/yr in compute."</td></tr>
    <tr><td>"Collaborated cross-team."</td><td>"Drove design review across mobile + web + platform teams to align RN architecture; eliminated 3 forks of shared code."</td></tr>
  </tbody>
</table>

<h3>The "behaviors" axis</h3>
<p>Promotion requires technical impact <strong>and</strong> behaviors. Behaviors at L5+ typically:</p>
<ul>
  <li>Technical leadership — set direction, not just execute.</li>
  <li>Mentorship — junior engineers explicitly cite you as a multiplier.</li>
  <li>Collaboration — cross-team peers vouch for your impact.</li>
  <li>Communication — written design docs, clear async, productive disagreement.</li>
  <li>Judgement — picked right projects, said no to wrong ones.</li>
  <li>Influence without authority — moved things you didn't formally own.</li>
</ul>

<p>Peer feedback maps to this axis. If 3 of 5 peers say "communicates well, mentors juniors," you're solid. If 2 of 5 hedge ("could communicate more clearly," "needs to share context better"), it's a behavioral flag and you'll lose calibration.</p>

<h3>The peer nomination game</h3>
<p>Most companies let you nominate peers; manager picks the final list. Strategy:</p>
<ul>
  <li><strong>Mix:</strong> 2-3 from your team, 2-3 cross-team. Cross-team peers signal scope.</li>
  <li><strong>Brief them informally:</strong> "I'd love your perspective on the X project; here's what I'd value feedback on" — not "please write something nice." Give them the project, the artifact, the timeline.</li>
  <li><strong>Avoid weakly-connected peers:</strong> if they don't know your work well, their feedback will be vague + harm you.</li>
  <li><strong>Don't pick only friends:</strong> calibration sees through it; signal is non-credible.</li>
  <li><strong>Include skip-level if appropriate:</strong> for L5+ promo, skip-level recognition is often required.</li>
</ul>

<h3>Manager alignment (no surprises)</h3>
<p>The single highest-leverage action: alignment with your manager throughout the year, not at year-end.</p>
<ul>
  <li><strong>Quarterly:</strong> "Here are my highlights this quarter. Are these tracking to my goal?"</li>
  <li><strong>Mid-year:</strong> "What's specifically blocking promo right now? What would I need to demonstrate?"</li>
  <li><strong>Pre-self-eval:</strong> "Here's my draft. What's missing? What's overstated? What concerns would calibration raise?"</li>
  <li><strong>Pre-calibration:</strong> "Anything I should add or change before you defend this?"</li>
</ul>

<p>This is not "asking for permission" — it's giving your manager the chance to course-correct before stakes are high. They'll appreciate it; the surprises will go down.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>The quarterly snippet doc</h3>
<p>Maintain a personal doc throughout the year. Format:</p>
<pre><code class="language-text"># 2026 Promo Snippets — Prakhar

## Q1
### Project: Auth Migration to Passkeys
- Role: Tech lead. Owned design + shipped Phase 1.
- Scope: Cross-team (mobile + web + identity service).
- Impact: 30% of new signups on passkeys; reduced password reset tickets by 22%; saved 4 FTE-quarters of support cost.
- Behaviors: Drove design doc + RFC review; mentored 1 L3 on the implementation.
- Numbers: 5M users on passkeys; 99.97% reliability over 90 days.
- Artifacts: [design doc link], [launch retro link], [metrics dashboard].
- Peer recognition: Sarah (web) called out the cross-team coord in our 1:1.

### Project: ...

## Q2
...
</code></pre>

<p>Update at the end of each quarter, in 30 minutes. By year-end, you have raw material for 4× the highlights you need.</p>

<h3>Self-eval template (FAANG-style)</h3>
<pre><code class="language-text">## What I delivered

### Highlight 1: [Title — single line description]
**Scope:** [Cross-team? Cross-org? Single-team feature? Quarter-long? Multi-quarter?]
**Role:** [Owner / Tech lead / Major contributor / Contributor]
**Impact:** [Concrete numbers — users, revenue, latency, cost, time saved, support deflected]
**Behaviors demonstrated:** [Technical leadership / Mentorship / Cross-team collab / Communication]
**Artifacts:** [Design doc, retro, dashboard, demo]

### Highlight 2: ...
### Highlight 3: ...

## Behaviors

### Technical leadership
[2-3 specific examples; not generic claims]

### Mentorship
[Names + outcomes; "mentored X, who shipped Y / promo'd to Z"]

### Collaboration
[Cross-team / cross-org examples]

### Communication
[Design docs written, RFCs led, async discussions facilitated]

## What I learned / what I'd do differently
[Self-aware reflection; not self-flagellating; not omitted]

## What's next
[Forward-looking; what scope you're targeting in the next cycle]
[This signals trajectory — important for promo decisions]
</code></pre>

<h3>Impact phrasing — bullet templates</h3>
<table>
  <thead><tr><th>Project type</th><th>Strong phrasing</th></tr></thead>
  <tbody>
    <tr><td>Performance work</td><td>"Reduced p99 latency from X to Y on N% of requests; saved $Z/yr in compute"</td></tr>
    <tr><td>Reliability</td><td>"Eliminated [bug class] from production; reduced incidents from N/quarter to 0; saved M FTE-hours of on-call"</td></tr>
    <tr><td>New feature</td><td>"Shipped feature X used by N users / N% of total; drove [metric] by Y%; aligned to OKR Z"</td></tr>
    <tr><td>Migration</td><td>"Migrated N services from old to new arch; eliminated M lines of legacy code; cut maintenance cost by Y%"</td></tr>
    <tr><td>Architecture</td><td>"Designed + drove [system] across N teams; design now used by M consumers; informed Q2 roadmap of teams X, Y, Z"</td></tr>
    <tr><td>Mentorship</td><td>"Mentored N engineers; M of them shipped their P0 goals; X promo'd to next level"</td></tr>
    <tr><td>Process</td><td>"Established [practice] across the team; reduced [metric] by N%; adopted by M peer teams"</td></tr>
  </tbody>
</table>

<h3>Common phrasing traps</h3>
<table>
  <thead><tr><th>Bad</th><th>Better</th></tr></thead>
  <tbody>
    <tr><td>"Worked on [project]"</td><td>"Owned [project] end-to-end" / "Tech-lead on [project]"</td></tr>
    <tr><td>"Improved performance"</td><td>"Reduced p99 latency from 800ms to 150ms"</td></tr>
    <tr><td>"Helped [team]"</td><td>"Drove [specific outcome] in collaboration with [team]"</td></tr>
    <tr><td>"Significant impact"</td><td>"Drove [metric] by [N%]"</td></tr>
    <tr><td>"Deep technical work"</td><td>"Designed + shipped [system] handling [N requests/sec]"</td></tr>
    <tr><td>"Growth mindset"</td><td>(skip; don't claim soft attributes; show them via examples)</td></tr>
    <tr><td>"Excellent communication"</td><td>(skip; let peers say it; you write the projects)</td></tr>
  </tbody>
</table>

<h3>The peer-nomination strategy</h3>
<table>
  <thead><tr><th>Slot</th><th>Pick</th><th>Why</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>Senior IC on your team who saw your day-to-day work</td><td>Validates execution + behaviors</td></tr>
    <tr><td>2</td><td>Cross-team senior IC who collaborated with you</td><td>Validates cross-team scope</td></tr>
    <tr><td>3</td><td>Junior engineer you mentored</td><td>Validates mentorship + multiplier behavior</td></tr>
    <tr><td>4</td><td>PM / EM you worked with closely</td><td>Validates business / product impact</td></tr>
    <tr><td>5</td><td>Skip-level peer or partner-team lead</td><td>Validates org-level scope (key for L5+)</td></tr>
  </tbody>
</table>

<p>Not friends-only; not all-team-only; not all-cross-team-only. Mix.</p>

<h3>Briefing your peers (the email)</h3>
<pre><code class="language-text">Subject: Perf review feedback — quick context

Hey [Name],

[Manager] is going to ask you for perf feedback on me. Wanted to give you
a bit of context to make it easier (and I'd love your honest perspective —
no need for it to be glowing).

Projects you saw most of this year:
- [Project A]: I led the design + shipped it. [link to doc]
- [Project B]: We collaborated on [specific part]. [link]

What I'd value feedback on most:
- [Specific behavior 1, e.g., cross-team coordination]
- [Specific behavior 2, e.g., technical depth]
- [Anything else honestly relevant]

Thanks — and please don't hesitate to share concerns; I'd rather hear
from you than have them surface in calibration.

— Prakhar
</code></pre>

<p>This isn't asking for nice things. It's giving the peer concrete material to write about — which makes their feedback specific (= credible) instead of vague ("Prakhar is great").</p>

<h3>Mid-year check-in script</h3>
<pre><code class="language-text">"I'd like to do a mid-year check on promo. Specifically:

1. Based on what I've delivered + behaviors so far, am I tracking to
   [target level] for this cycle?

2. If we ran calibration today, what would the strongest objection be?

3. What 2-3 things would I need to demonstrate in the next 2 quarters
   to close those gaps?"
</code></pre>

<p>Specific questions. Not "how am I doing?" (gets you generic feedback). The 2-3 specific gaps become your H2 plan.</p>

<h3>The "scope check" before each project</h3>
<p>Before saying yes to a project, ask: <em>does this support my promo case?</em></p>
<table>
  <thead><tr><th>Project type</th><th>Promo value</th></tr></thead>
  <tbody>
    <tr><td>Single-team feature, well-defined</td><td>Solid for L4 / Mid; insufficient for L5+</td></tr>
    <tr><td>Cross-team initiative; ambiguous; you'd lead</td><td>L5+ promo material</td></tr>
    <tr><td>Operational hardening (no shipped feature)</td><td>Hard to articulate as impact unless you can quantify reliability gains</td></tr>
    <tr><td>Tooling / infra used by other teams</td><td>Strong if you can show adoption + impact on those teams</td></tr>
    <tr><td>Bug fixes only</td><td>Necessary but not sufficient; you can't promo on bugfix</td></tr>
    <tr><td>Code review + mentorship only</td><td>Necessary for L5+; insufficient alone</td></tr>
  </tbody>
</table>

<p>Senior signal: turning down well-scoped tasks below your level when your manager has a project at-or-above your level. (See <code>wp-saying-no</code> for how to do this without burning bridges.)</p>

<h3>Reading the calibration outcome</h3>
<p>Common results:</p>
<table>
  <thead><tr><th>Result</th><th>What it means</th><th>What to do</th></tr></thead>
  <tbody>
    <tr><td>Promo'd</td><td>Calibration agreed</td><td>Celebrate. Reset clock for next level.</td></tr>
    <tr><td>"Strong / exceeds expectations" but no promo</td><td>You're doing the job, but org didn't have promo budget OR you're competing with stronger peer</td><td>Confirm rating + ask explicitly: "is the rating sufficient for next-cycle promo?" If yes, repeat year.</td></tr>
    <tr><td>"Not yet ready"</td><td>Specific gap (scope, behavior, impact)</td><td>Get the specific gap. Build a 6-month plan to close it.</td></tr>
    <tr><td>"Needs improvement"</td><td>Below current level; PIP risk</td><td>Take seriously. Different topic; see <code>wp-pressure</code>.</td></tr>
    <tr><td>"Solid; expected for level"</td><td>You're meeting expectations; no promo</td><td>If you wanted promo, this is a signal; ask why.</td></tr>
  </tbody>
</table>

<h3>The "ratings inflation / deflation" reality</h3>
<ul>
  <li>Most companies have rating distributions enforced via calibration. ~5-10% top, ~10-15% needs-improvement, rest in the middle.</li>
  <li>You can be doing genuinely great work and still get a "meets expectations" rating because the team had stronger peers.</li>
  <li>Doesn't mean the work was bad. Means you weren't in the top 10% <em>relative to peers</em>.</li>
  <li>Don't take it as personal. Take it as a relative ranking + specific feedback.</li>
</ul>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: A weak self-eval (annotated)</h3>
<pre><code class="language-text">## What I delivered

I worked on the new authentication system. We migrated from passwords to passkeys.
This was a big project and I learned a lot. I also helped with the migration of
the search service. I mentored some junior engineers on the team and they
appreciated my help. I tried to communicate well with the team.
</code></pre>

<p><strong>What's wrong:</strong></p>
<ul>
  <li>"Worked on" — passive; was I lead, contributor, observer?</li>
  <li>"Big project" — no scope quantification.</li>
  <li>"Learned a lot" — irrelevant; nobody's promoted for learning.</li>
  <li>"Helped with" — passive; what specifically?</li>
  <li>"Mentored some" — vague; how many? Outcomes?</li>
  <li>"Tried to communicate well" — claims a behavior without evidence; unsubstantiated soft-skill claim.</li>
  <li>No numbers anywhere. No artifacts. No business impact. No forward-looking.</li>
</ul>

<h3>Example 2: Same year, strong self-eval</h3>
<pre><code class="language-text">## What I delivered

### Highlight 1: Passkey Authentication Rollout (multi-quarter; tech lead)
**Scope:** Cross-team (Mobile RN, Web, Identity Service). 4 engineers + 2 designers.
**Role:** Tech lead. Owned design + drove implementation. Author of the RFC + design doc.
**Impact:**
- 30% of new signups now use passkeys (vs. 0 before).
- Reduced password-reset support tickets by 22% Q3 vs Q2 (saved ~4 FTE-quarters of support).
- 99.97% reliability over 90 days post-launch.
- Drove cross-team alignment via design review with 8 stakeholders.
**Behaviors:** Authored design doc that's now referenced by 2 other teams (auth model). Mentored L3 engineer who owned the iOS-specific path; she shipped her quarter goal + got positive feedback in her review.
**Artifacts:** [design doc] [launch retro] [metrics dashboard].

### Highlight 2: Search Service Migration (Q2-Q3; major contributor)
**Scope:** Single-team but cross-domain (search + indexing).
**Role:** Major contributor. Designed the indexer pipeline; co-led with senior engineer.
**Impact:**
- Reduced search latency p99 from 800ms to 150ms (5× improvement).
- Cut search infra cost from $40K/mo to $15K/mo ($300K/yr saving).
- Migrated 30M documents with zero downtime.
**Behaviors:** Wrote postmortem on the partial outage during cutover; doc cited in next quarter's reliability training.

### Highlight 3: Cross-Platform RN Architecture Initiative (Q4-ongoing; co-lead)
**Scope:** Cross-team (3 mobile teams, web, platform).
**Role:** Co-lead with senior platform engineer. Drove RFC for shared component library.
**Impact (in progress):**
- RFC approved; 2 of 3 mobile teams have committed to migration.
- Eliminating 3 forks of shared design system (~50% code duplication today).
- Q1 2027 milestone: first shared module shipped.
**Behaviors:** Built coalition across teams that historically had turf disputes. Skip-level cited this in their last 1:1 with my manager.

## Behaviors

### Technical leadership
Authored 3 design docs this year referenced by other teams (passkeys auth, search indexer, RN component library). Drove RFC reviews with 5+ stakeholders each.

### Mentorship
Mentored 2 L3 engineers (Sarah on iOS auth path; Raj on the search indexer). Both shipped their quarterly P0 goals. Sarah promo'd to L4 in mid-year cycle.

### Cross-team collaboration
Worked with web (auth integration), platform (search infra), design (passkeys flow), and 2 partner mobile teams (RN architecture).

### Communication
3 design docs (linked above). 2 RFCs (auth model, RN architecture). Co-facilitated 4 cross-team architecture reviews this year.

## What I'd do differently
The search service cutover had a 12-minute partial outage. In hindsight, the rollout
plan needed staged ramp + better fallback path. Postmortem is linked; took the
lessons into the passkey rollout, which had zero incidents.

## What's next
In 2027, I'm targeting:
- Lead the RN architecture initiative through to migration completion (Q2-Q3 milestone).
- Take ownership of the auth team's quarterly tech roadmap (currently shared with senior IC).
- Mentor 1-2 more engineers; goal: 1 promo to L4 in next cycle.
This trajectory aligns with operating at L5 scope consistently.
</code></pre>

<p><strong>What's strong:</strong></p>
<ul>
  <li>3 highlights, not 10. Anchor (passkeys) + breadth (search + RN architecture).</li>
  <li>Numbers everywhere (latency, cost, users, %).</li>
  <li>Role explicit (lead vs contributor).</li>
  <li>Behaviors demonstrated through specific examples, not claimed in adjectives.</li>
  <li>Honest about the cutover outage — credibility-builder.</li>
  <li>Forward-looking section signals trajectory.</li>
</ul>

<h3>Example 3: Briefing a peer for feedback</h3>
<pre><code class="language-text">Hey Sarah,

[Manager] will reach out for perf feedback on me soon. Quick context to
make it easier:

Projects we worked closely on:
- Passkeys rollout: I led design + cross-team coord; you owned the iOS path.
  [design doc]
- RN architecture RFC: we co-reviewed it in arch council.

What I'd value most honest feedback on:
- Did my design + RFC processes feel collaborative or top-down?
- Was the iOS handoff clear or did I leave gaps?
- Anything I could have done better in the cross-team coordination?

Please don't pull punches — calibration is the wrong place to discover
behavioral feedback. I'd much rather hear it now.

Thanks!
— Prakhar
</code></pre>

<p>Notice: gives Sarah specific projects + specific feedback areas. She'll write something specific instead of vague.</p>

<h3>Example 4: Mid-year check script</h3>
<pre><code class="language-text">In your 1:1 with manager, mid-year:

You: "I'd like to do a 30-min mid-year on promo trajectory. OK with
that?"

Manager: "Sure, send me your highlights so far."

[You send: a 1-page doc with the H1 highlights, in self-eval format.]

In the meeting:
You: "I'm targeting L5 for this cycle. Three questions:

1. Based on H1, am I on track?
2. If we calibrated today, what's the strongest objection to L5?
3. What 2-3 things in H2 would close that gap?"

Manager: "You're tracking. The biggest gap is cross-org scope — most of
your work has been within our org. Calibration peers will ask if you've
shown influence beyond the team. The RN architecture initiative is your
shot at that. Push for the cross-team adoption story by EOY."

You: "Got it. So my H2 plan is: drive RN initiative to formal commits
from 2+ partner teams, doc'd. Get explicit recognition from skip-level
on it. Anything else?"

Manager: "That's the big one. Also: behavioral signal. You're solid on
mentorship. Push on technical leadership — author one more high-impact
design doc that gets adopted org-wide, not just our team."
</code></pre>

<p>Now you have a specific H2 plan. No surprises at year-end.</p>

<h3>Example 5: Recovering from "not ready"</h3>
<pre><code class="language-text">After getting "not promo'd; not yet at L5" feedback:

You (in 1:1): "I'd like to understand the specific gaps and build a
6-month plan. What were the calibration objections?"

Manager: "Two main things. First, scope — your work has been within our
org; calibration wanted to see cross-org influence. Second, peer
feedback was solid but not strong; one peer noted you sometimes don't
share context broadly enough."

You: "OK. So plan:

1. Cross-org scope: take ownership of [specific cross-org initiative].
2. Communication / context-sharing: weekly architecture-share at the org
   meeting. Author one design doc per quarter that's reviewed across
   teams.

Goal: in 6 months, repackage these as the cross-org and behavior story
for next cycle. Will you support a re-look at promo in 6 months?"

Manager: "Yes. If we see those things, I'll re-pitch in the off-cycle
calibration."
</code></pre>

<p>Specific. Mutual commitment. 6-month milestone (not "we'll see at year-end"). This is how recovery actually works.</p>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>The "great manager" trap</h3>
<ul>
  <li>Manager loves you. 1:1s are warm. Says "you're killing it."</li>
  <li>Calibration: not promo'd. You're shocked.</li>
  <li>Reality: your manager + the calibration room are different audiences. Manager judging you locally; calibration comparing across the org.</li>
  <li>Mitigation: ask explicitly + specifically. "Where am I in the calibration distribution? What would calibration peers object to?" Verbal warmth ≠ promo lock.</li>
</ul>

<h3>Manager change mid-cycle</h3>
<ul>
  <li>New manager mid-cycle inherits you; doesn't know your work.</li>
  <li>They write the eval based on what they can see + what you tell them.</li>
  <li>Mitigation: 1-page "year-in-review" handoff doc to new manager early. Don't wait for review season.</li>
  <li>Schedule a focused 1:1 in their first 2 weeks: "here's what I'm working on, here's my goals, here's my trajectory."</li>
</ul>

<h3>Reorg mid-cycle</h3>
<ul>
  <li>Whole team moved; new org; new VP.</li>
  <li>Risk: your H1 work for old VP not visible to new VP; calibration weaker.</li>
  <li>Mitigation: explicit acknowledgment in self-eval ("I delivered X in old org under [old VP]; here's the artifact"). Get old manager to write a peer-style endorsement.</li>
</ul>

<h3>The "L5 in name only" problem</h3>
<ul>
  <li>You promo'd to L5 but tasks haven't grown. Manager still gives you L4-scoped work.</li>
  <li>Risk: next year's perf shows you doing L4 work; calibration says "operating below level" → comp adjustment risk.</li>
  <li>Mitigation: after promo, push immediately for L5-scope work. Decline politely down-scoped projects. (See <code>wp-saying-no</code>.)</li>
</ul>

<h3>The "you carried the team" problem</h3>
<ul>
  <li>You bailed out a struggling team; on-fire support; saved a launch.</li>
  <li>Calibration: "Solid execution; not promo'd; not enough independent leadership."</li>
  <li>Reality: firefighting work doesn't promo. You did the right thing for the team; it didn't help your case.</li>
  <li>Mitigation: balance firefighting with promo-shaped work. If your manager keeps calling you to fight fires, raise it directly: "I'm happy to help, but it's diluting my promo case. Can we plan around that?"</li>
</ul>

<h3>Calibration deflation</h3>
<ul>
  <li>Org-wide promo budget cut (common in 2023-2025 layoff era).</li>
  <li>Genuinely-strong cases get held over to next cycle.</li>
  <li>Mitigation: separate "rating" from "promo." If your rating is strong + manager confirms calibration agreed you were close, the next cycle is realistic. Don't quit on a single deflation.</li>
</ul>

<h3>"Behavioral" objection that's vague</h3>
<ul>
  <li>"Some peers wanted to see more communication."</li>
  <li>You ask: which peers? what specifically? Manager: "Confidential."</li>
  <li>Mitigation: get specific anyway. "Can you give me an example without naming the peer? Was it about pace, format, channel, frequency?" Convert vague objection into concrete behavior change.</li>
</ul>

<h3>Stack-ranking surprise</h3>
<ul>
  <li>Some companies stack-rank within calibration. Even if you'd be promo-ready in isolation, you may not be in the top N of your peer set.</li>
  <li>Mitigation: know if your company stack-ranks. If so, peer set size matters; competing against fewer / weaker peers helps. Internal mobility (moving to less-stacked team) is a real lever.</li>
</ul>

<h3>"Up-or-out" levels</h3>
<ul>
  <li>Some companies have "up-or-out" thresholds (e.g., Amazon historically L5 → L6 within X years).</li>
  <li>Below a level, the company expects continued growth; flat-line for too long can become a separation conversation.</li>
  <li>Mitigation: know your company's policy; if you're at risk of stagnation, don't sit at the bottom of a level for 3+ years.</li>
</ul>

<h3>The "promo against you" reality</h3>
<ul>
  <li>Sometimes a peer's strong case wins over yours — same level, you're both close, only one promo slot.</li>
  <li>This isn't about you doing badly; it's relative ranking.</li>
  <li>Mitigation: don't take it personally. Ask manager: "what was the differentiator?" Use that as next year's roadmap.</li>
</ul>

<h3>Mobile / RN-specific dynamics</h3>
<ul>
  <li>Mobile teams sometimes treated as second-class vs web / platform teams in cross-platform companies.</li>
  <li>Calibration peers may underweight mobile-specific impact ("how many users does iOS-only feature reach?").</li>
  <li>Mitigation: frame impact in cross-platform terms when possible. RN architecture work that benefits all platforms = cross-team scope. Pure-iOS / pure-Android features may need explicit business framing.</li>
</ul>

<h3>The "individual contributor at staff+ level" question</h3>
<ul>
  <li>Some companies expect IC L6/L7 to manage projects, lead initiatives, mentor heavily — bordering on EM responsibilities.</li>
  <li>If you don't want to lead heavily, L5 may be your ceiling at that company.</li>
  <li>Mitigation: clarify the IC ladder expectations at L6+ before targeting it. Some companies have a true "deep-IC" path (Meta, ex-Google IC track); others functionally require leadership behaviors at L6+.</li>
</ul>

<h3>Geography + remote dynamics</h3>
<ul>
  <li>Remote ICs often face calibration disadvantage vs in-office peers (less informal visibility, fewer skip-level brushes).</li>
  <li>Mitigation: aggressively over-communicate written; be present in important office days; cultivate skip-level + cross-team peer relationships explicitly.</li>
  <li>For India-based ICs reporting to US-based managers: time-zone overlap with senior leadership is a real lever; explicitly carve sync time in the overlap window.</li>
</ul>

<h3>The "I'll just job-hop for the level" calculation</h3>
<ul>
  <li>External offer at next level vs internal promo.</li>
  <li>External offer is faster (3-6 months vs 12-18) + often better comp.</li>
  <li>Internal promo signals stronger "ready" (vs external interview gaming).</li>
  <li>Mitigation: the optimal answer depends on your goals. External often wins on title + comp short-term; internal builds long-term reputation. Both are legitimate. (See <code>wp-comp</code>.)</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common perf-review mistakes</h3>
<ol>
  <li><strong>Writing the self-eval in 2 days at year-end.</strong> Reconstruction misses everything; snippets needed throughout the year.</li>
  <li><strong>Listing 12 small projects.</strong> Signal: didn't focus. 3-5 highlights win.</li>
  <li><strong>Effort framing.</strong> "Worked hard on X" doesn't promo; outcome framing does.</li>
  <li><strong>No numbers.</strong> "Significantly improved performance" is unmemorable; "p99 800ms → 150ms" is.</li>
  <li><strong>Claiming behaviors.</strong> "I have a growth mindset" is unpersuasive; specific examples are.</li>
  <li><strong>Inflating the role.</strong> "I led the project" when you were a contributor — peers will contradict; calibration kills.</li>
  <li><strong>Underselling.</strong> Listing the project but not the cross-team coordination you did. Describe scope explicitly.</li>
  <li><strong>Surprises for manager.</strong> If the eval contradicts what you discussed all year, manager's defense is weakened.</li>
  <li><strong>Vague peer feedback.</strong> "Prakhar is great to work with" doesn't help. Specific projects + specific behaviors do.</li>
  <li><strong>No forward-looking.</strong> Calibration wants to see trajectory; "what's next" matters.</li>
  <li><strong>Pestering manager during calibration.</strong> Manager needs to focus on the meeting; messages from you increase noise.</li>
  <li><strong>Taking "not promo'd" as final.</strong> Most "not yet" is 6-12 months, not "never." Get specifics; build plan.</li>
</ol>

<h3>Anti-pattern: claim-without-evidence</h3>
<pre><code class="language-text">// BAD — unverified claims
"I'm a strong communicator and excellent collaborator. I have a growth
mindset and I'm always pushing for excellence."

// GOOD — claims through evidence
"Authored 3 cross-team design docs this year (passkeys auth, search
indexer, RN architecture); each was reviewed by 5+ engineers across
3+ teams. Mentored 2 junior engineers; both shipped P0 goals; one
promoted to L4 in the mid-cycle."
</code></pre>

<h3>Anti-pattern: passive voice</h3>
<pre><code class="language-text">// BAD — passive; role unclear
"The authentication migration was completed. Cross-team coordination
was performed. The performance was improved by 30%."

// GOOD — active; role explicit
"Owned the auth migration end-to-end. Drove cross-team coordination
across 4 teams. Reduced authentication latency p99 from 250ms to
175ms (30%)."
</code></pre>

<h3>Anti-pattern: "we" without role clarification</h3>
<pre><code class="language-text">// BAD — were you lead or observer?
"We migrated the search service to a new arch. We reduced latency.
We saved cost."

// GOOD — explicit role
"As major contributor (working with senior engineer X), designed and
shipped the indexer pipeline. The team's overall migration reduced
latency and cost; my contribution was [specific component]."
</code></pre>

<h3>Anti-pattern: ignoring behavioral feedback</h3>
<pre><code class="language-text">// BAD — peer feedback flagged "context sharing"; self-eval ignores
[Self-eval makes no mention of communication / context sharing.]

// GOOD — acknowledge + show progress
"In mid-year feedback, I heard that I sometimes didn't share context
broadly enough. In H2 I started: weekly written team updates,
quarterly arch share at org-wide meeting, doc-first design proposals.
Outcome: 3 design docs adopted by other teams in H2; positive
follow-up in [name's] feedback."
</code></pre>

<h3>Anti-pattern: stretching the timeline</h3>
<pre><code class="language-text">// BAD — counts last year's work
"Shipped passkeys (Q4 last year through Q1 this year)."

// GOOD — own the current year scope
"Shipped passkeys in Q1 (work scoped + designed in late Q4 last year).
Subsequent rollout + adoption work in Q2-Q3."
// Honest about timeline; shows the relevant chunk for this cycle.
</code></pre>

<h3>Anti-pattern: scope inflation</h3>
<pre><code class="language-text">// BAD — calls a feature "cross-team initiative"
"Led cross-team initiative to add login button to mobile app."

// GOOD — proportional framing
"Owned login button addition for mobile app (1 sprint, single team).
Coordinated with web team (1 design review) for visual consistency."
</code></pre>

<p>Calibration peers see through inflation. Be honest; let real cross-team work speak.</p>

<h3>Anti-pattern: peer-feedback friend bombing</h3>
<pre><code class="language-text">// BAD — all 5 peer-feedback slots are close friends
[Manager picks final list; calibration sees a homogeneous set; signal weak.]

// GOOD — strategic mix
2 same-team senior peers
2 cross-team / partner-team peers
1 mentee (junior; specific outcomes)
+1 skip-level brushed contact, if appropriate
</code></pre>

<h3>Anti-pattern: comparison to peers</h3>
<pre><code class="language-text">// BAD — comparing yourself to specific peers
"I shipped more than [Name] this year and led harder projects. I
should have been promo'd; they were not."

// GOOD — keep it about you
[Don't compare in writing or in 1:1. Calibration handles peer
comparison; you have no visibility into others' packets. Focus on
your own scope + impact.]
</code></pre>

<h3>Anti-pattern: gaming the metric</h3>
<pre><code class="language-text">// BAD — chose easy/visible work over real-impact
[Avoided the hard infra work; took the visible feature project
because "it'll look good." Result: feature shipped; long-term tech
debt grew; calibration peers noticed.]

// GOOD — pick what's right; frame it well
[Took the hard infra work because it had higher long-term value;
spent extra effort framing the impact in business terms. Calibration
gave credit for judgment + execution.]
</code></pre>

<h3>Anti-pattern: not building the doc throughout the year</h3>
<pre><code class="language-text">// BAD — "I'll remember"
[At year-end: tries to reconstruct 12 months. Forgets the Q1 incident
postmortem; forgets the mentorship outcome; forgets the metrics for
Q2 launch.]

// GOOD — quarterly snippet doc
[End of each quarter: 30 min in a personal doc. Project, role, scope,
impact, behaviors, artifacts, notes. Year-end self-eval is
re-organization, not reconstruction.]
</code></pre>

<h3>Anti-pattern: silence on the bad stuff</h3>
<pre><code class="language-text">// BAD — pretends nothing went wrong
[Self-eval lists only successes. The Q2 outage (which everyone knows
about) is conspicuously absent. Calibration sees the omission.]

// GOOD — acknowledge + extract value
"The search service cutover had a 12-min partial outage; I owned the
postmortem and the doc is now part of our org-wide reliability
training. Took those lessons into the passkey rollout, which had
zero incidents."
</code></pre>

<p>Self-awareness in writing is a credibility builder; calibration trusts the rest of your eval more.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Behavioral interview prompts that map here</h3>
<ol>
  <li>"Tell me about a time you delivered impact above your level."</li>
  <li>"How do you measure your impact?"</li>
  <li>"Tell me about a time you didn't get promoted; what did you do?"</li>
  <li>"How do you decide which projects to take on?"</li>
  <li>"How do you build cross-team influence?"</li>
  <li>"Tell me about a project you owned end-to-end."</li>
  <li>"What's the most impactful thing you've shipped?"</li>
  <li>"How do you mentor / multiply other engineers?"</li>
</ol>

<h3>The 5-step framework for "tell me about your impact"</h3>
<ol>
  <li><strong>Pick the highlight</strong> — your strongest, most-quantifiable project.</li>
  <li><strong>Set the scope</strong> — team / org / cross-org? How long? How many people?</li>
  <li><strong>Describe your role</strong> — owner / lead / contributor (not "we").</li>
  <li><strong>Quantify the impact</strong> — numbers that map to business outcomes.</li>
  <li><strong>Frame the behaviors</strong> — design doc authored, RFC led, mentorship, cross-team collab.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"I built a quarterly snippet doc throughout the year so I had concrete examples + numbers ready."</em></li>
  <li><em>"My approach to scope is to ask 'will this support a promo case for the level I'm targeting?' If yes, take it. If no, I either decline or balance with another project that does."</em></li>
  <li><em>"For peer feedback, I brief my reviewers explicitly — give them the project artifacts and ask for honest feedback on specific behaviors. Vague feedback is what kills perfs."</em></li>
  <li><em>"I track impact in business terms — revenue, latency, user count, cost. 'Improved performance' isn't memorable; 'p99 800ms → 150ms' is."</em></li>
  <li><em>"My anchor highlight is one multi-quarter, cross-team project. Then 2-3 supporting projects for breadth, plus 1 forward-looking. Calibration peers can hold 3-5 things; not 12."</em></li>
  <li><em>"When I got 'not promo'd' once, I asked for specifics + built a 6-month plan with my manager. It wasn't 'never'; it was 'these specific gaps' — and they got closed."</em></li>
  <li><em>"I align with my manager quarterly on promo trajectory, not at year-end. Surprises are how packets fail."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Behavioral prompt</th><th>What they're really asking</th></tr></thead>
  <tbody>
    <tr><td>"Tell me about your impact"</td><td>Can you frame work in outcomes? Numbers?</td></tr>
    <tr><td>"How do you decide priorities?"</td><td>Senior judgment; do you align to strategy?</td></tr>
    <tr><td>"Tell me about a time you didn't promo"</td><td>Self-awareness + recovery + specific feedback handling</td></tr>
    <tr><td>"How do you build influence?"</td><td>Cross-team scope; non-authoritative leadership</td></tr>
    <tr><td>"Most impactful project?"</td><td>Anchor highlight; concrete numbers</td></tr>
    <tr><td>"How do you mentor?"</td><td>Multiplier behavior; specific outcomes for mentees</td></tr>
    <tr><td>"Cross-team collab?"</td><td>Coalition building; influence; conflict resolution</td></tr>
    <tr><td>"Difficult project?"</td><td>Judgment; ambiguity; what you learned</td></tr>
  </tbody>
</table>

<h3>Demo script — "tell me about your most impactful project"</h3>
<pre><code class="language-text">"Last year I owned the migration of our authentication system from
passwords to passkeys.

Scope: cross-team — mobile RN, web, and the platform identity service.
Roughly 4 engineers and 2 designers. Multi-quarter effort, Q1 through Q3.

Role: tech lead. I authored the RFC and design doc, drove the design
review across 8 stakeholders, and owned the implementation rollout.

Impact:
- 30% of new signups on passkeys within 90 days of launch.
- Reduced password-reset support tickets by 22% Q3 vs Q2 — saved
  approximately 4 FTE-quarters of support cost.
- 99.97% reliability over the first 90 days post-launch.
- The auth design pattern is now referenced by two adjacent teams
  for similar migrations.

Behaviors: this was my first time driving an RFC at this scope. I
mentored a junior engineer on the iOS-specific path; she shipped her
quarterly P0 goal and promo'd to L4 in the mid-cycle.

What I'd do differently: the rollout had a 12-minute outage during a
config change. I owned the postmortem; doc is now in the org-wide
reliability training. Took those lessons into the search service
migration the following quarter, which had zero incidents."
</code></pre>

<p>Notice: scope, role, numbers, behaviors, self-awareness, learning. Calibration patterns. Same story works in interviews.</p>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"I'd dive deeper into the cross-team coordination — managing the disagreement on auth model between mobile and platform teams."</em></li>
  <li><em>"I'd talk about the mid-rollout decision when we had to choose between expanding the rollout or pausing for the outage learnings."</em></li>
  <li><em>"I could share the design doc and metrics dashboard if that would help."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Outcome framing</td><td>Numbers + business impact, not effort</td></tr>
    <tr><td>Scope clarity</td><td>Names team / org / cross-org explicitly</td></tr>
    <tr><td>Role honesty</td><td>"I owned" / "I co-led" / "I contributed" — not blanket "we"</td></tr>
    <tr><td>Self-awareness</td><td>What didn't work; what they'd do differently</td></tr>
    <tr><td>Multiplier behavior</td><td>Mentorship outcomes; cross-team adoption of their work</td></tr>
    <tr><td>Forward-looking</td><td>Trajectory; "what I'm targeting next"</td></tr>
    <tr><td>Specific examples</td><td>Names of artifacts; metrics; concrete outcomes</td></tr>
    <tr><td>Behavioral evidence</td><td>Behaviors shown through examples, not claimed in adjectives</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN engineers benefit from framing impact across iOS + Android + web (cross-platform = cross-team scope by default).</li>
  <li>Cross-platform code unification (one component instead of three) is a strong impact narrative.</li>
  <li>Mobile-specific metrics (cold start, frame drops, crash rate, app size) are concrete + measurable.</li>
  <li>Be aware of the "mobile-as-second-class" dynamic; explicitly frame mobile work in business terms (DAU, conversion, retention) when calibration peers may underweight pure-mobile impact.</li>
  <li>App Store / Play Store milestones (release cycles, feature flag rollouts) are good anchors for "shipped" claims.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Start a quarterly snippet doc — even mid-cycle. Better late than at year-end.</li>
  <li>Identify the 3-5 highlight projects; verify each has measurable impact.</li>
  <li>Schedule a mid-year check-in with your manager; ask the 3 specific questions above.</li>
  <li>List the peer-feedback slots strategically — mix in-team / cross-team / mentee / partner-team.</li>
  <li>Read your company's leveling rubric; identify which behaviors map to which projects.</li>
  <li>Practice the impact-framing pattern: scope → role → numbers → behaviors.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read 'Staff Engineer' by Will Larson for the IC ladder mental model."</li>
  <li>"Read your company's leveling rubric end-to-end; map your projects to the behaviors."</li>
  <li>"Practice the 60-second impact pitch out loud; iterate until it's natural."</li>
  <li>"Ask a senior peer to review your draft self-eval before submission."</li>
</ul>
`
    }
  ]
});
