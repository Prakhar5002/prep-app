window.PREP_SITE.registerTopic({
  id: 'wp-managing-up',
  module: 'workplace',
  title: 'Managing Up & 1:1s',
  estimatedReadTime: '40 min',
  tags: ['managing-up', 'one-on-ones', 'manager', 'communication', 'career', 'feedback'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>Your relationship with your manager is the single highest-leverage relationship in your career — they shape your scope, defend your packet in calibration, write your eval, decide your raise, and give (or block) the references that follow you. "Managing up" isn't politics; it's a skill that makes your manager's job easier and your career better. Engineers who treat 1:1s as status reports waste them; engineers who run 1:1s as their own meeting (with agenda + outcomes) compound advantage over years.</p>
<ul>
  <li><strong>1:1s are your meeting.</strong> Bring an agenda. Drive it. The manager's job is to be useful to you in that 30-60 min.</li>
  <li><strong>Don't status-update — surface.</strong> Status goes in async docs. 1:1 is for blockers, ambiguity, calibration, career, sensitive topics.</li>
  <li><strong>The 4 categories:</strong> Work-now (what's blocking?); Feedback (give + get); Career (where am I going?); Relationship (how's our rapport?).</li>
  <li><strong>Manage up = make their job easier.</strong> Give them context, summarize escalations, propose solutions not just problems, signal early when you'll miss a deadline.</li>
  <li><strong>Ask for what you want.</strong> "I want to be considered for the X project." "I want feedback on Y." Managers are bad mind-readers.</li>
  <li><strong>Disagreement is allowed (and required).</strong> Senior signal: pushing back productively in private; committing publicly when manager makes the call.</li>
  <li><strong>Calibration with your manager is a year-long thing,</strong> not a year-end conversation. Quarterly: "am I on track? what's missing?"</li>
  <li><strong>Bad managers are real;</strong> some can't be saved. Recognize early; plan exit / transfer if structural.</li>
</ul>
<p><strong>Mantra:</strong> "1:1 is your meeting. Surface, don't status-report. Give context, propose solutions. Ask for what you want. Calibrate quarterly. Disagree privately, commit publicly."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What managing up actually is</h3>
<p>"Managing up" is the practice of making your manager's job easier so they can be more effective for you. Not flattery. Not politics. Concrete behaviors:</p>
<ul>
  <li>Giving them context they don't have time to gather themselves.</li>
  <li>Summarizing complex situations into decisions.</li>
  <li>Surfacing problems with proposed solutions, not just complaints.</li>
  <li>Signaling early when something is at risk.</li>
  <li>Telling them what you want — promotion, project, feedback, support.</li>
  <li>Adjusting your communication style to theirs (data-driven? story-driven? written? verbal?).</li>
  <li>Defending their reputation outside the team (don't trash-talk your manager publicly; raise concerns to them privately).</li>
</ul>

<h3>Why it matters disproportionately</h3>
<table>
  <thead><tr><th>Manager controls / influences</th><th>Your career outcome</th></tr></thead>
  <tbody>
    <tr><td>Project assignment</td><td>What scope you build</td></tr>
    <tr><td>Calibration advocacy</td><td>Promotion + comp</td></tr>
    <tr><td>Performance review writing</td><td>Permanent record on you</td></tr>
    <tr><td>Skip-level access</td><td>Who knows you exist</td></tr>
    <tr><td>Internal mobility approval</td><td>Whether you can transfer</td></tr>
    <tr><td>References + reputation</td><td>Career years after you leave</td></tr>
    <tr><td>Air cover for risky bets</td><td>Whether you can experiment</td></tr>
    <tr><td>Day-to-day autonomy</td><td>How much your job sucks or rocks</td></tr>
  </tbody>
</table>

<h3>The 1:1 as the highest-leverage 30 minutes of your week</h3>
<p>Most engineers waste 1:1s. They report status (already async-visible), accept whatever topic the manager raises, and walk away with no decisions. Senior engineers run 1:1s like their own meeting — agenda, prepared, outcome-oriented.</p>

<h3>What "good 1:1 cadence" looks like</h3>
<ul>
  <li>Weekly or bi-weekly, 30-45 min; on the calendar; rarely cancelled.</li>
  <li>You bring agenda; manager adds their topics.</li>
  <li>Status updates happen async (in a doc, snippets, Slack).</li>
  <li>The 30 min covers: blockers + ambiguity + career + feedback + relationship.</li>
  <li>Each 1:1 has 1-3 things you want to leave with: a decision, a commitment, an info-share.</li>
  <li>Notes captured (yours or shared); commitments tracked over time.</li>
  <li>Quarterly: explicit "career check" 1:1, not just operational.</li>
</ul>

<h3>What "bad 1:1 cadence" looks like</h3>
<ul>
  <li>Cancelled 50% of the time; rescheduled into oblivion.</li>
  <li>30 minutes of "what are you working on?" — manager already knew from standups.</li>
  <li>You walk away thinking "we didn't decide anything."</li>
  <li>Career topic raised once a year, at perf review.</li>
  <li>Bad news ("project will slip 2 weeks") delivered via email instead of in 1:1.</li>
  <li>Disagreement bottled up; surfaces as resignation 6 months later.</li>
  <li>You don't know how your manager evaluates you until perf review.</li>
</ul>

<h3>The trust contract</h3>
<p>Good 1:1 relationships have a trust contract:</p>
<ul>
  <li><strong>You</strong>: surface bad news early. Don't blindside. Stay loyal in public; raise concerns in private.</li>
  <li><strong>Manager</strong>: shield you from politics where appropriate. Defend you in calibration. Tell you the truth (especially when uncomfortable).</li>
  <li><strong>Both</strong>: no surprises at perf review. No surprises in calibration. No surprises in promo decisions.</li>
</ul>

<p>If this contract isn't there, the 1:1 isn't fixing the relationship. The relationship is broken; address that or transfer / leave.</p>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The 4 categories of 1:1 topics</h3>
<table>
  <thead><tr><th>Category</th><th>Examples</th><th>Frequency</th></tr></thead>
  <tbody>
    <tr><td><strong>Work-now</strong></td><td>Blockers, ambiguity, prioritization conflicts, escalations</td><td>Most weeks</td></tr>
    <tr><td><strong>Feedback</strong></td><td>Asking for feedback on a project; giving feedback to manager</td><td>Quarterly minimum</td></tr>
    <tr><td><strong>Career</strong></td><td>Promo trajectory, what scope to build, internal mobility, comp</td><td>Quarterly explicit; touches in many 1:1s</td></tr>
    <tr><td><strong>Relationship</strong></td><td>How is the working dynamic? Are we aligned? Trust check</td><td>Occasional; raise when something's off</td></tr>
  </tbody>
</table>

<h3>The 30-minute structure</h3>
<pre><code class="language-text">5 min — Quick personal / human check-in
10-15 min — Your agenda (work-now blockers, decisions needed)
5-10 min — Manager's agenda (their priorities, escalations to discuss)
5 min — Career / forward-looking ("what should I focus on next quarter?")
2 min — Wrap: explicit commitments + next steps
</code></pre>

<h3>The agenda template</h3>
<pre><code class="language-text"># 1:1 — [date]

## Updates I want to flag
- [Project X is at risk; here's why; here's what I propose]
- [Y is going well; FYI]

## Things I want input on
- [Decision needed: A vs B for project Z]
- [Should I take on the new initiative?]

## Career
- [Quarterly check: how am I tracking?]
- [Want to discuss visibility for the X work]

## Feedback
- [Want your honest take on how the [Y] design review went]
- [Want to share feedback on [Z meeting / process]]

## Manager's topics
- [They add as needed]
</code></pre>

<p>Share this as a doc; both can edit; running history of 1:1s.</p>

<h3>Surfacing vs status-reporting</h3>
<table>
  <thead><tr><th>Status (don't bring to 1:1)</th><th>Surface (bring)</th></tr></thead>
  <tbody>
    <tr><td>"I shipped the migration."</td><td>"Migration shipped. The cutover had a 12-min outage. Here's the postmortem; I'd value your read."</td></tr>
    <tr><td>"I'm working on Y."</td><td>"Y is at risk. Two paths: cut scope, or pull in another engineer. I lean A; what do you think?"</td></tr>
    <tr><td>"Code review went well."</td><td>"Tension came up in code review with [name]; we resolved it but I want your read on whether I handled it right."</td></tr>
    <tr><td>"Standup happens daily."</td><td>(Don't mention. They know.)</td></tr>
  </tbody>
</table>

<p>Surface = something where the manager's input changes the outcome. Status = something the manager couldn't act on if they wanted.</p>

<h3>The "early warning" rule</h3>
<p>If you'll miss a deadline / commitment, the manager wants to know <strong>at the moment of becoming likely, not at the moment of failure</strong>.</p>
<table>
  <thead><tr><th>Bad</th><th>Good</th></tr></thead>
  <tbody>
    <tr><td>"I'll have it done Friday." (Friday: it's not done.)</td><td>"Tracking for Friday; one risk emerged this week — [risk]. Confidence: 70%. Worst case I'd need to slip to Monday."</td></tr>
    <tr><td>Skip the 1:1 the week before deadline</td><td>Use the 1:1 to flag risk + adjust plan</td></tr>
    <tr><td>Manager finds out from skip-level / partner team</td><td>Manager finds out from you, with proposed mitigation</td></tr>
  </tbody>
</table>

<p>Managers can recover from bad news told early. They cannot recover from being blindsided.</p>

<h3>Asking for what you want</h3>
<p>Managers can't read minds. The most underused 1:1 move:</p>

<table>
  <thead><tr><th>What you want</th><th>How to ask</th></tr></thead>
  <tbody>
    <tr><td>To be considered for a project</td><td>"I'd like to be considered for the X initiative when it spins up. What would I need to demonstrate first?"</td></tr>
    <tr><td>Promo</td><td>"My target this cycle is L5. What's the gap between where I am and where I'd need to be?"</td></tr>
    <tr><td>Feedback</td><td>"I'd like more pointed feedback. When something doesn't go great, I'd rather hear it than guess."</td></tr>
    <tr><td>Visibility</td><td>"How can I get my work in front of the broader org? Skip-level demo? Org-wide arch share?"</td></tr>
    <tr><td>Comp adjustment</td><td>(More involved; see <code>wp-comp</code>.)</td></tr>
    <tr><td>Time off / different schedule</td><td>"I'm planning to take 2 weeks in [month] for [reason]. Want to flag now to plan around it."</td></tr>
    <tr><td>Mentorship from a senior</td><td>"I'd benefit from a mentor at L6 / Staff. Can you connect me with [name] or someone in that range?"</td></tr>
  </tbody>
</table>

<p>If you don't ask, the answer is no by default. Asking gets you "no, here's why" or "yes, here's how" — both useful.</p>

<h3>Productive disagreement</h3>
<p>Disagreeing with your manager is required for a healthy relationship; how you do it matters.</p>

<table>
  <thead><tr><th>Bad</th><th>Good</th></tr></thead>
  <tbody>
    <tr><td>Email + cc the org with concerns</td><td>Raise privately first, in 1:1</td></tr>
    <tr><td>Stay silent in 1:1, complain to peers later</td><td>Bring it up directly: "I see this differently — can I share?"</td></tr>
    <tr><td>"This is a bad idea."</td><td>"Here's the concern I have. Here's the alternative I'd consider. What am I missing?"</td></tr>
    <tr><td>Refuse to execute after manager decides</td><td>Disagree privately; commit publicly. Once decision is made, execute fully.</td></tr>
    <tr><td>Re-raise in every 1:1</td><td>Raise once with full case. If they still decide otherwise, accept + execute. Re-raise only if new info emerges.</td></tr>
  </tbody>
</table>

<p>The senior-engineer move: <strong>strong opinions, weakly held.</strong> Have positions; voice them; let evidence change them; don't die on every hill.</p>

<h3>Adjusting to manager style</h3>
<table>
  <thead><tr><th>Manager type</th><th>Adjustment</th></tr></thead>
  <tbody>
    <tr><td>Data-driven</td><td>Bring numbers, dashboards, charts. Less narrative, more metrics.</td></tr>
    <tr><td>Story-driven</td><td>Bring narrative + customer impact. Numbers as supporting, not lead.</td></tr>
    <tr><td>Hands-off</td><td>Drive the agenda harder; they won't push you. Set explicit commitments.</td></tr>
    <tr><td>Hands-on / micromanager</td><td>Pre-empt with detailed updates; reduce their anxiety. (See <code>wp-conflict</code> if extreme.)</td></tr>
    <tr><td>Written-async preferring</td><td>Pre-share docs; 1:1 covers decisions, not exposition.</td></tr>
    <tr><td>Verbal-sync preferring</td><td>Talk it through; written followup if decision needs traceability.</td></tr>
    <tr><td>New to the team</td><td>Over-communicate context; they don't have history yet.</td></tr>
    <tr><td>Industry veteran</td><td>Lean on their pattern recognition; "have you seen this kind of problem before?"</td></tr>
  </tbody>
</table>

<h3>The "give your manager a win" move</h3>
<p>Your manager has goals + a manager of their own. When you can:</p>
<ul>
  <li>Frame your work in terms of their team-level goals.</li>
  <li>Highlight wins they can take to skip-level.</li>
  <li>Pre-empt issues that would surface to their boss negatively.</li>
  <li>Make their reporting easy: send them quotable bullets, not raw context.</li>
</ul>

<p>This isn't sycophancy; it's recognizing they're a professional with their own metrics. Make their job easier; they make yours easier.</p>

<h3>The 1-page brief skill</h3>
<p>Crucial for managing up at scale. When a complex situation arises, write a 1-page brief:</p>
<pre><code class="language-text"># Brief: [topic]

## TL;DR (3 sentences)
[The situation; the recommendation; the decision needed]

## Context
[Background; what happened]

## Options
- A: [trade-offs]
- B: [trade-offs]
- C: [trade-offs]

## My recommendation
[Which + why]

## What I need from you
[Specific decision / approval / escalation]
</code></pre>

<p>Send before the 1:1 (or async). Saves your manager 20 min of context-loading. Compounds trust.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Setting up the 1:1 cadence</h3>
<ul>
  <li><strong>Weekly</strong> if you're early in the relationship, on a high-stakes project, or new to the team.</li>
  <li><strong>Bi-weekly</strong> for steady-state senior IC + manager who knows your work.</li>
  <li><strong>30-45 min;</strong> 60 only if needed. 15 is too short for anything substantive.</li>
  <li><strong>Same day + time</strong> when possible — easier to defend on the calendar.</li>
  <li><strong>Reschedule, don't cancel.</strong> Skipping signals 1:1 isn't important.</li>
</ul>

<h3>The shared 1:1 doc</h3>
<pre><code class="language-text"># 1:1 — [Manager Name] / [Your Name]

## 2026-05-04
### My agenda
- [topic]
- [topic]

### Their agenda
- [topic]

### Notes / decisions
- [decision X; owner: ...; due: ...]
- [info shared: ...]

### Action items
- [ ] [you do X by Y]
- [ ] [manager does Z by W]

---

## 2026-04-27
[Last week's notes]

---

## 2026-04-20
[Two weeks ago]

---

## Standing topics (rotating)
- Career check (quarterly): next due [date]
- Skip-level intro (when ready)
</code></pre>

<p>Both edit; both add agenda items between meetings. Running history is invaluable: "you said X 6 weeks ago; how does that align with this decision now?"</p>

<h3>Pre-1:1 prep (10 min)</h3>
<ol>
  <li>Look at this week's project — what's at risk? what's blocking? what's a decision-pending?</li>
  <li>Anything from peers / cross-team I want to surface?</li>
  <li>Career: anything on this week's stack that affects promo or trajectory?</li>
  <li>Feedback: anything I want to give or get?</li>
  <li>Write 3-5 bullets in the shared doc.</li>
</ol>

<h3>The "what should I work on next?" question</h3>
<p>Underrated 1:1 move. Don't wait for assignment; propose:</p>
<pre><code class="language-text">"As Project A wraps next week, I want to think about next. Three options
on my radar:
- Project B: shipping; would round out my [domain] knowledge.
- Project C: greenfield; cross-team; promo-shaped if I led it.
- Project D: my favorite technically; smaller scope.

I'd lean C, with B as backup. Does that align with what you'd want me on?"
</code></pre>

<p>This frames you as someone who plans + has judgment. Better than waiting to be told.</p>

<h3>Quarterly career 1:1 (separate from operational)</h3>
<p>Once per quarter, dedicate a 1:1 explicitly to career. Agenda:</p>
<pre><code class="language-text">## Career check — Q2 2026

### Where am I?
[Summary: target level, current scope, behavioral feedback signals]

### Am I on track?
[Manager's read; not yours. Listen.]

### What's the gap to next?
[Concrete: "show cross-org scope" / "deeper technical leadership"]

### What's the H2 plan?
[2-3 specific things I'll do; outcomes to demonstrate]

### What support do I need from you?
[Project assignment, visibility opportunities, intros]
</code></pre>

<p>This is the meeting that prevents perf-review surprises.</p>

<h3>Giving feedback to manager</h3>
<p>Yes, you should. They benefit + it builds trust. Pattern:</p>
<pre><code class="language-text">"Can I share some feedback?"
[Wait for yes.]
"In the [meeting / situation], I noticed [specific behavior]. The
impact on me / the team was [concrete]. What I'd value going forward
is [specific change]."
</code></pre>

<p>Examples:</p>
<ul>
  <li>"In the design review yesterday, when you pushed back on Sarah's idea, the framing felt like 'this is wrong' rather than 'help me understand.' Sarah went quiet; I think you didn't hear her full reasoning. Going forward, asking 'why' before 'no' would help."</li>
  <li>"I noticed you've been reassigning my projects mid-stream a few times. It's hard for me to drive momentum when ownership is unclear. Could we talk about which are mine for the quarter and stick with that unless something major changes?"</li>
  <li>"The async messages on Friday at 10pm have been creating pressure even when you don't intend it. Could we move non-urgent stuff to Monday morning?"</li>
</ul>

<p>Specific behavior + concrete impact + actionable ask. Generic ("I wish you communicated more") doesn't change behavior.</p>

<h3>The "ask for explicit feedback" pattern</h3>
<p>Every quarter (or after every significant project):</p>
<pre><code class="language-text">"What's one thing I should keep doing? What's one thing I should
do differently?"
</code></pre>

<p>Specific, balanced, easy for them to answer. Way better than "how am I doing?" (which gets you "great!").</p>

<h3>When manager is bad at giving feedback</h3>
<p>Many managers are conflict-averse + give vague or no feedback. Force the issue:</p>
<ul>
  <li>"Specifically: I'd like to know if there are any concerns calibration peers might raise. I'd rather hear them now than at perf review."</li>
  <li>"On a scale of 1-5, how am I tracking to L5? What would be 1 thing to make it a 4 instead of a 3?"</li>
  <li>"What feedback have you heard from peers about me, even if it's small?"</li>
  <li>"If I were to lose ground in the next 6 months, what's the most likely way?"</li>
</ul>

<p>Don't accept "you're doing great." Senior-engineer move: <em>actively pull in negative feedback</em>. It's the only kind that improves you.</p>

<h3>Skip-level 1:1s</h3>
<ul>
  <li>Most companies allow / encourage skip-level 1:1s — meeting with your manager's manager.</li>
  <li>Cadence: quarterly is a good baseline.</li>
  <li>Purpose: be visible to skip-level; understand org-level priorities; build relationship for when calibration / mobility / reorg happens.</li>
  <li>Tell your manager you're doing it (not asking permission, just signaling). Don't surprise them.</li>
  <li>Don't trash-talk your manager in skip-level 1:1; even if they're bad. It poisons the relationship and makes you look unprofessional.</li>
  <li>Topics: org strategy, your work in context, big questions you're thinking about.</li>
</ul>

<h3>Recovering after a mistake</h3>
<pre><code class="language-text">[You shipped something with a bug; outage; missed deadline.]

In the 1:1:
"Wanted to talk about the [incident / miss] directly.

Here's what happened: [factual; no excuses].
Here's what I learned: [specific].
Here's what I'm changing: [specific behavior or process].
Here's what I'd value from you: [feedback / support / nothing /
permission to retry]."
</code></pre>

<p>Direct + no defensiveness + concrete change. Builds enormous trust over time. Most engineers either over-apologize (annoying) or hide (lethal).</p>

<h3>The "loyal in public, candid in private" rule</h3>
<ul>
  <li>In the team meeting / Slack channel / email: don't trash your manager's decision, even if you disagree.</li>
  <li>In the 1:1: tell them directly + privately.</li>
  <li>Once they decide: execute fully + publicly support.</li>
  <li>Disagreement reflects character; loyalty in public reflects professionalism. Senior engineers do both.</li>
</ul>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Strong 1:1 agenda</h3>
<pre><code class="language-text"># 1:1 — May 4, 2026

## Updates I want to flag
- Passkeys rollout: ahead of schedule; 30% adoption already (target was 25%).
  Will share metrics in our team meeting Tuesday.
- Search migration: hit a snag with index size; investigating; not at risk yet
  but heads-up. Decision in next 1-2 days.

## Things I want input on
- For the RN architecture RFC: I want to add the platform team as required
  reviewers. They've been resistant in past reviews. Recommendation: I draft
  the RFC, you intro me to their lead via email so I can request the review.
  OK with this approach?
- Q3 planning: my preference is to lead the cross-team auth-token-rotation
  initiative. It's promo-shaped + I have context. Alternative: take Project Y
  (smaller scope; closer to current work). I lean A. Your read?

## Career
- Quarterly check: am I on track for L5 this cycle? Anything calibration peers
  would object to today?

## Feedback
- Want your honest read on the design-review I led last Thursday. Felt like I
  drove it well but wasn't sure about the moment when [Name] pushed back.

## Your topics
[manager adds]
</code></pre>

<p><strong>What's strong:</strong> specific updates, concrete decisions needed, explicit asks, career check, feedback solicitation. Manager can prep.</p>

<h3>Example 2: Surfacing bad news the right way</h3>
<pre><code class="language-text">[In Tuesday 1:1, project deadline is Friday]

You: "Want to flag — confidence on Friday delivery dropped to ~60%. Two
risks emerged this week:

1. Indexing job is slower than expected on full data; might need 24h
   instead of 8h. We can run it Wednesday night to find out.

2. The web team's API is slipping; they may not have the new endpoint
   ready until Tuesday next week.

If both miss: realistic delivery is Wednesday next week.

Plan A: ship Friday, mock the web endpoint behind a flag. Web ships
later; we flip flag.
Plan B: hold the launch to Tuesday, full feature on day one.

I lean A — incremental over delay. But A creates more flag complexity
+ a coordination spot with web. Your call?"

Manager: "Go A. Make sure the flag fallback is rock-solid; we don't
want a half-broken UX visible to users. Loop me in on the web
team's commitment by EOD Wednesday."

You: "On it. I'll send a status update Friday with the actual
launch state."
</code></pre>

<p><strong>What's strong:</strong> early flag, two paths with tradeoffs, recommendation, explicit decision. Manager has clarity + decides quickly.</p>

<h3>Example 3: Asking for what you want</h3>
<pre><code class="language-text">You: "I want to flag career stuff. My target this cycle is L5.

Three asks:

1. The RN architecture initiative — I want to drive it as tech lead.
   Cross-team scope, multi-quarter, promo-shaped. Are you supportive
   of that being mine?

2. Visibility: I'd like to present at the org-wide engineering all-hands
   when the passkeys work hits a milestone. Can you nominate me when
   the slot opens?

3. A skip-level 1:1 with [VP] — I haven't had one yet. Could you intro?"

Manager: "Yes on #1 — let's confirm scope at next planning. Yes on #2 —
I'll flag with [comms lead]. On #3, sure; I'll send the email this
week."
</code></pre>

<p><strong>What's strong:</strong> three specific asks; manager can act on each; you walk away with explicit commitments.</p>

<h3>Example 4: Productive disagreement</h3>
<pre><code class="language-text">[Manager has decided team should pause RN refactor for Q3, focus on
features. You disagree.]

You: "Want to push back on the RN refactor pause. Hear me out.

Concern: the current architecture is slowing every feature by ~30%
per estimate. Q3 features will hit this same drag. Six months of
features without the refactor = 6 months of compound cost.

Counter: Q3 has the aggressive launch goal. Refactor delays features.

What I'd propose: parallel-track. I lead refactor for 30% of my time;
the rest of the team continues features full-speed. After Q3, refactor
either accelerates or wraps. Not blocking features; not deferring
the structural problem.

Will this work for you?"

Manager: "Hmm. Concern: 30% time still slows you on features. Show
me what the refactor scope looks like in 30% time over Q3. If the
proposal demonstrates feature velocity isn't impaired, I'll support
it."

You: "Got it. I'll write up the scope + plan by EOD Friday. We can
review at next 1:1."

[You write the doc; you've made the case; if manager still says no
at next 1:1, you accept + commit.]
</code></pre>

<p><strong>What's strong:</strong> specific concern, alternative proposal, anchored in business outcomes, accepts a hurdle to clear. Not "you're wrong"; "here's how I'd handle the concern."</p>

<h3>Example 5: Quarterly career check</h3>
<pre><code class="language-text">You: "Quarterly career 1:1 today. Three questions.

1. Am I on track for L5 this cycle?

2. If we ran calibration today, what's the strongest objection?

3. What 2-3 things in the next 2 quarters would close that gap?"

Manager: "Tracking. Calibration objection: cross-org scope. You've
delivered solidly within the team. Calibration peers in other orgs
will ask if you've shown influence beyond.

Next two quarters:
- Drive the RN architecture initiative; I want to see formal commits
  from 2+ partner teams.
- Author one design doc adopted across 3+ teams.
- Skip-level should know what you're doing — let's get you on the
  agenda for one of [VP]'s monthly tech demos."

You: "Clear. So the 6-month plan:
- RN architecture: cross-team commitments by Q3.
- Design doc with org-wide adoption by Q4.
- One skip-level demo by end of Q3.
Does that match what calibration would need?"

Manager: "That'd close the cross-org gap. Yes."

You: "Anything else? Behavioral feedback, peer signal worries?"

Manager: "Mentorship is solid. Push on technical leadership in
writing — your verbal communication is strong; written is good but
not yet what calibration looks for at L5. The design doc thing
helps both."

You: "Got it. I'll send a follow-up doc with this 6-month plan
captured + check progress monthly. Thanks for the candor."
</code></pre>

<p><strong>What's strong:</strong> concrete questions, specific answers, captured plan, mutual commitment. No surprises possible at year-end.</p>

<h3>Example 6: Feedback to a manager who's hands-off</h3>
<pre><code class="language-text">You: "Can I share some feedback?"

Manager: "Sure."

You: "I value how much autonomy you give me — that's been great. One
thing I'd find more useful: I'd love more pointed feedback when
something doesn't go great.

The Q1 incident postmortem — I felt good about it, but I never heard
back from you on whether the format / approach landed. I'd rather get
'this part was unclear; here's what I'd change' than the absence of
feedback.

Concrete ask: in our 1:1s, when I share work, can you give me at least
one specific 'change this' note, even on things that went well?"

Manager: "Fair. Yeah, I tend to assume 'no news is good news' — but
that's not actionable. I'll be more pointed. Push me on it if I drift."

You: "Will do. Thanks."
</code></pre>

<p><strong>What's strong:</strong> specific behavior, concrete ask, gives manager out (admit pattern + commit to change). Builds trust both ways.</p>

<h3>Example 7: Skip-level prep</h3>
<pre><code class="language-text"># Skip-level 1:1 prep — [VP Name]

## What I do (1-line)
Senior IC on the mobile platform team; tech lead on cross-platform
architecture; recently shipped passkeys auth.

## What I want them to know
- The RN architecture initiative is shaping; cross-team alignment
  is the focus.
- I'd value their pattern recognition on cross-org influence — they've
  driven similar at scale before.

## Topics I'd ask them
- "What's the org's bet for the next 12-18 months that I should be aware
  of as I shape my work?"
- "What does technical leadership look like at L6+ in this org from
  your view?"
- "What's a project you wish someone would pick up?"

## What I won't do
- Trash-talk my manager (I don't have those issues anyway).
- Ask for promo (skip-level isn't where that conversation happens).
- Surprise my own manager (I told them I'm doing this).
</code></pre>

<p><strong>What's strong:</strong> clear purpose, specific questions that show curiosity + ambition, awareness of what not to do.</p>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Manager who micromanages</h3>
<ul>
  <li>Wants daily updates; questions every decision; revises your work.</li>
  <li>Often: anxiety / under-pressure-from-above / new manager.</li>
  <li>Mitigation: pre-empt with detailed updates (reduce their need to ask). Schedule 15-min daily checkins for first 2 weeks; reduce as trust grows.</li>
  <li>Direct conversation: "I notice you're checking in often. Is there something specific worrying you about my work? Let's address it directly."</li>
  <li>If structural (won't change): plan exit / transfer.</li>
</ul>

<h3>Manager who is hands-off / absent</h3>
<ul>
  <li>Skips 1:1s; vague feedback; doesn't know your work.</li>
  <li>Mitigation: drive the cadence + agenda yourself. Send written updates they can absorb async. Make it easy for them to do their job.</li>
  <li>Force feedback: "I'd rather hear concerns now than at perf review."</li>
  <li>If structural: build skip-level + cross-team peer relationships so calibration isn't fully dependent on this manager's read.</li>
</ul>

<h3>Manager you don't trust</h3>
<ul>
  <li>Caught them lying / taking credit / shifting blame.</li>
  <li>Trust is hard to rebuild. Don't surface bad news the same way; build paper trails (written commitments).</li>
  <li>Cultivate relationships outside this manager (skip-level, peers).</li>
  <li>Plan transfer / exit. Don't try to "fix" a fundamentally untrustworthy manager.</li>
</ul>

<h3>New manager (you keep them)</h3>
<ul>
  <li>Reorg or transfer brings a new manager to your team.</li>
  <li>First 2 weeks: heavy context-sharing. Send the 1-page year-summary; project briefs; goal docs.</li>
  <li>First 1:1 agenda: "here's what I'm working on; here's what I value; here's what I want to talk about; what about you?"</li>
  <li>Be patient — they're 1 month into knowing you; calibration won't change overnight.</li>
</ul>

<h3>You report into a different new manager every 6-12 months</h3>
<ul>
  <li>Common at scale-stage / fast-growth / chaotic orgs.</li>
  <li>Each one needs the context-loading; calibration suffers.</li>
  <li>Mitigation: keep an evergreen "year in review" doc; update quarterly. New manager + calibration peers can pull from it.</li>
  <li>Build deep peer relationships — they'll vouch for you across manager changes.</li>
</ul>

<h3>Manager younger / less experienced than you</h3>
<ul>
  <li>Common for senior / staff IC roles.</li>
  <li>Don't be condescending. Don't pretend they're equal in skill if they're not.</li>
  <li>Frame: they have things to teach you (org dynamics, skip-level relationships, perf calibration knowledge). You have things to teach them (technical depth, history).</li>
  <li>1:1 should be a peer-collaboration, not a deference.</li>
</ul>

<h3>Manager who is a peer (you both report to same VP)</h3>
<ul>
  <li>Rare but happens at staff+ level — manager's manager is also somewhat your peer.</li>
  <li>Treat them as your manager in formal interactions; as a peer in technical ones.</li>
  <li>Calibration: your manager still owns your packet, but skip-level reads it directly + may form their own view. Don't surprise either.</li>
</ul>

<h3>Manager performing a layoff / RIF</h3>
<ul>
  <li>If you're leaving: ask explicitly about timeline, severance, references. Get details written.</li>
  <li>If you're staying but team is shrinking: ask about your project, your scope post-cuts, runway.</li>
  <li>Manager is also stressed; some can't share details (legal). Be respectful but specific in asks.</li>
  <li>(See <code>wp-layoffs</code>.)</li>
</ul>

<h3>Manager going on leave / sabbatical / leaving company</h3>
<ul>
  <li>Get pending decisions made before they leave (promo packet, project assignment, comp).</li>
  <li>Get a transition doc: who you report to, expectations, in-flight commitments.</li>
  <li>If they're leaving the company, ask for an honest reference + LinkedIn recommendation. Get it before they're out the door.</li>
</ul>

<h3>Skip-level dynamics gone wrong</h3>
<ul>
  <li>Skip-level shares your private feedback with your manager.</li>
  <li>Manager feels undermined; relationship damaged.</li>
  <li>Mitigation: never share with skip-level something you wouldn't share with your manager directly. If a topic is between you + manager, keep it there.</li>
  <li>Skip-level conversations are about org strategy + your visibility, not about your manager.</li>
</ul>

<h3>1:1s slowly losing structure</h3>
<ul>
  <li>You stopped bringing agenda; manager fills with status questions; both of you leave drained.</li>
  <li>Mitigation: re-set explicitly. "Hey, our 1:1s have drifted to status. Let's re-set: I'll bring an agenda; we focus on decisions + career." Most managers will agree (it makes their job easier).</li>
</ul>

<h3>You're the manager-of-managers / skip-level relationship</h3>
<ul>
  <li>Some staff+ ICs informally manage other ICs (mentorship, technical lead).</li>
  <li>The "managing up" toolkit applies to your influence-without-authority relationships too.</li>
  <li>Treat your own manager + skip-level the same way; over-communicate, surface, give context, ask for what you want.</li>
</ul>

<h3>Manager misreads you in calibration</h3>
<ul>
  <li>You worked hard on cross-team scope; manager reported "stayed in their lane" in calibration.</li>
  <li>You find out later (sometimes via skip-level or peer leak).</li>
  <li>This is a major signal: your communication of scope failed. Manager didn't see what you did.</li>
  <li>Recovery: stronger written artifacts (design docs, RFCs); skip-level visibility; peer endorsements from cross-team work; possibly a manager change is in order.</li>
</ul>

<h3>Mobile / RN-specific dynamics</h3>
<ul>
  <li>If your manager doesn't have mobile / RN background, they may misread the difficulty of mobile work ("just use the system component").</li>
  <li>Educate: send them iOS HIG / Material 3 docs; explain what's hard about RN architecture; cite the cross-platform tradeoffs.</li>
  <li>Frame work in cross-platform terms when possible — easier for non-mobile manager to recognize impact.</li>
</ul>

<h3>Geo-distributed dynamics (India ↔ US)</h3>
<ul>
  <li>Reporting to US-based manager from India: time-zone overlap is short; 1:1 quality matters disproportionately.</li>
  <li>Pre-write your agenda + key context in writing; manager can read async; sync time spent on decisions.</li>
  <li>Find at least one skip-level / cross-team peer in your time zone for daily collaboration; reduces over-reliance on the US-time-zone manager.</li>
  <li>For visibility: explicit + written, since you can't pop into hallway conversations.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common managing-up mistakes</h3>
<ol>
  <li><strong>Treating 1:1 as status report.</strong> Status is async; 1:1 is for surfacing.</li>
  <li><strong>No agenda.</strong> 1:1 drifts; nothing decided.</li>
  <li><strong>Cancelling 1:1s.</strong> Signals it's not important; relationship erodes.</li>
  <li><strong>Hiding bad news.</strong> Manager finds out from skip-level / partner; trust destroyed.</li>
  <li><strong>Asking "how am I doing?"</strong> Gets you "great"; learn nothing.</li>
  <li><strong>Not asking for what you want.</strong> Manager isn't a mind-reader; default is no.</li>
  <li><strong>Disagreeing in public, agreeing in private.</strong> Inverse of what works.</li>
  <li><strong>Re-litigating decisions endlessly.</strong> Disagree once; commit; move on.</li>
  <li><strong>Trash-talking manager to peers.</strong> Always gets back.</li>
  <li><strong>Trash-talking manager to skip-level.</strong> Looks like end-running; trust damaged both ways.</li>
  <li><strong>One-style communication.</strong> Same approach for data-driven vs story-driven manager.</li>
  <li><strong>Passive on career.</strong> "I'll let them notice" — they won't.</li>
</ol>

<h3>Anti-pattern: 1:1 as status report</h3>
<pre><code class="language-text">// BAD — 30 min of "what are you working on"
You: "I've been working on Project X. Made progress on the database
piece. Did some code review. Attended the design meeting."

Manager: "OK, sounds good. What's next?"

You: "Project Y next sprint. And I'll keep on Project X."

Manager: "OK. Anything else?"

You: "Not really."

[30 min wasted; nothing decided; both leave drained.]

// GOOD — 1:1 as decision/surface meeting
You: "Project X: database migration shipped Friday. One issue: query
plans regressed on the new schema. I have two options to address;
I want your input. [shows doc]"

Manager: "Hmm. Option B looks safer; concerned about A's complexity.
What's your read?"

You: "Agree. I'll go B; will be done by Wednesday. Will write up the
postmortem on the regression."

Manager: "Good. Project Y: I want to flag — VP is asking for it 2
weeks earlier than planned. Can you scope what fits?"

You: "I'll propose by Friday. If we hit the new date, we'd need to
cut [features X, Y]. Is that acceptable?"

Manager: "Yes. Loop me in by Friday."
</code></pre>

<h3>Anti-pattern: surprising your manager</h3>
<pre><code class="language-text">// BAD — Friday morning
You: "Hi, the launch can't ship today. The QA blocker just emerged."

Manager: [furious, surprised, didn't know] "Why is this just hitting
my desk now?? I told the VP we were shipping today."

[Trust crater. Manager looks bad to skip-level. You look bad in their
eyes for not flagging.]

// GOOD — Tuesday in 1:1
You: "Want to flag risk on Friday's launch. QA is finding issues with
[component]; I think we'll know by Wednesday whether it's a 1-day or
1-week fix. Confidence on Friday is now 50/50.

If it slips, options:
A. Ship Tuesday next week with full QA pass.
B. Ship Friday with [feature X] disabled via flag.

I lean A; the user-facing risk of B is real. But I want your call —
external commitments may force B."

Manager: "Tell the VP early — wait, let me. I need to manage that
side. You: spend the rest of this week getting QA blocker resolved.
We'll make the call Wednesday EOD."

[No surprise; manager has time to manage VP; everyone's prepared
for the worst case.]
</code></pre>

<h3>Anti-pattern: vague feedback request</h3>
<pre><code class="language-text">// BAD
You: "How am I doing?"

Manager: "Great! Keep up the good work."

[You learn nothing. Manager defaults to vague positive when no
specific frame given.]

// GOOD
You: "Two specific questions:

1. The design review I led last Thursday — what's one thing I should
   keep doing, and one thing I should do differently?

2. If calibration peers were assessing my work today, what's their
   strongest objection?"

Manager: "Design review: you facilitated well; the moment with [name]
was tense — next time, pause and ask 'help me understand your
concern' rather than refuting immediately. Calibration objection:
you've delivered solidly but cross-org scope is thin; the RN
initiative is your shot at that."

[You get specific, actionable feedback.]
</code></pre>

<h3>Anti-pattern: not asking</h3>
<pre><code class="language-text">// BAD — silently waiting
[Months pass; you assume the manager will assign you the cool project,
nominate you for visibility, raise comp. They don't. Why would they?
They don't know you want it.]

// GOOD
"I want to be tech-lead on the RN architecture initiative. Can you
back that?"

"I'd like to present at the org all-hands when passkeys hits 50%
adoption. Can you nominate me?"

"I haven't had a comp adjustment in 18 months. Can we discuss what
my market value looks like?"

[Specific asks. Manager responds yes / no / 'let me check.' Either
way, you have data.]
</code></pre>

<h3>Anti-pattern: disagree-in-public, agree-in-private</h3>
<pre><code class="language-text">// BAD
[In team meeting, you push back on manager's proposal aggressively.]
"I really don't think this is the right approach. We should X."

[In private 1:1 later:]
"Yeah, I see your point. I'll go with your call."

[You looked unprofessional in public; undermined manager publicly;
gained nothing in private.]

// GOOD
[In team meeting, manager proposes approach you have concerns about.]
You: "Want to flag a concern with the approach. Let me think through
it more and we can dig into it offline. For now, I'm OK proceeding;
I'll come prepared with my read in our 1:1."

[In 1:1:]
"Here's the concern I had on Tuesday's proposal..."

[You raised it; you didn't undermine in public; you committed to
a constructive private discussion.]
</code></pre>

<h3>Anti-pattern: complaining without proposing</h3>
<pre><code class="language-text">// BAD
You: "The on-call rotation is too heavy. It's burning everyone out."

Manager: "OK. What do you want me to do about it?"

[No specific ask; manager has 12 things to balance; without a proposal,
this stays a complaint.]

// GOOD
You: "On-call has been heavy. Three data points:
- Pages last rotation: 14 (typical: 5).
- Two of us are on PIPs from sleep.
- Most pages are from [service X] — flaky alerts, not real issues.

Proposal: I take 2 weeks to clean up [service X] alerts. We add a
runbook so the on-call doesn't escalate to me every time. After
that, rotations should be back to ~5 pages.

Cost: 2 weeks of my time on [Project Y]. Win: sustainable on-call.

Want to go this route?"

Manager: "Yes. Talk to me about Project Y deadline tradeoff."
</code></pre>

<h3>Anti-pattern: never asking for honest feedback</h3>
<pre><code class="language-text">// BAD — relying on perf review for feedback
[Year passes; perf review delivers "needs work on X"; you're shocked.]

// GOOD
[Quarterly:]
"I'd value the candid version: where am I weak that I should be
working on?"

[After every significant project:]
"What didn't land? What would you have done differently in my role?"

[After every milestone review:]
"What did I miss? Where did the design review go suboptimally?"

[Continuous calibration; no perf-review surprises.]
</code></pre>

<h3>Anti-pattern: trash-talking your manager</h3>
<pre><code class="language-text">// BAD — to peers
"My manager is incompetent. They missed the deadline because of
[their decision]."

// BAD — to skip-level in 1:1
"I'm having issues with my manager. They keep [doing X]."

[Both will get back to your manager. Trust nuked. Calibration
sabotaged. Reputation: 'the engineer who throws their manager under
the bus.']

// GOOD — peers: don't.
// GOOD — skip-level (only if structural / abusive):
"I want to flag a structural issue with how decisions are flowing
in our team. [Specific behavior, not personality]. I've raised it
with my manager directly twice without resolution. I'd value your
read on whether this is something you can help with or something
I should think about differently."

[Frame: behavior, not character. Actions taken. Specific ask.]
</code></pre>

<h3>Anti-pattern: not managing the relationship over time</h3>
<pre><code class="language-text">// BAD — assume the relationship will stay healthy on its own
[Year 1: great. Year 2: manager gets stressed; communication drifts;
1:1s go to status; you don't notice; year-end review is bad.]

// GOOD — proactive maintenance
[Quarterly: explicit "how's our working relationship" check.]
"Want to do a relationship check. From your side: what's working
well, what could be better between us? From my side: [your honest
read]."

[Catches issues before they fester. Builds long-term trust.]
</code></pre>

<h3>Anti-pattern: reducing your manager to "a manager"</h3>
<p>They're a person with their own pressures, goals, manager, anxieties. Treating them as a unit ("the manager") rather than a colleague erodes the relationship. Senior engineers manage up by understanding their manager's full situation — and adjusting accordingly.</p>

<h3>Anti-pattern: 1:1 only when something's wrong</h3>
<pre><code class="language-text">// BAD — manager only sees you in 1:1 when there's a problem
[Result: 1:1 = bad-news vibes; both dread it.]

// GOOD — mix
60% normal: surfacing decisions, career check, feedback both ways.
30% positive: wins, learnings, opportunities.
10% problems: real escalations.

[Result: 1:1 is a tool for the relationship, not a complaint hotline.]
</code></pre>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Behavioral interview prompts that map here</h3>
<ol>
  <li>"Tell me about your relationship with your manager."</li>
  <li>"Tell me about a time you disagreed with your manager."</li>
  <li>"How do you give feedback to leadership?"</li>
  <li>"Describe a time you had to deliver bad news."</li>
  <li>"How do you handle ambiguity in priorities?"</li>
  <li>"Tell me about a time you advocated for yourself."</li>
  <li>"Tell me about a time you had to manage up."</li>
  <li>"How do you build trust with new managers / leaders?"</li>
</ol>

<h3>The 5-step framework for "tell me about a time you managed up"</h3>
<ol>
  <li><strong>Set the situation</strong> — what was at stake; what was the manager's context.</li>
  <li><strong>Identify the gap</strong> — what wasn't working / what did they need.</li>
  <li><strong>What you did</strong> — specific actions; how you adjusted; what you proposed.</li>
  <li><strong>Outcome</strong> — concrete; what changed.</li>
  <li><strong>What you learned</strong> — self-aware reflection.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"I treat 1:1s as my meeting. I bring an agenda; we focus on decisions, blockers, and career."</em></li>
  <li><em>"My approach is 'no surprises' — I surface bad news the moment it becomes likely, not when it lands."</em></li>
  <li><em>"I disagree in private and commit in public. Once a decision is made, I execute fully even if I had concerns."</em></li>
  <li><em>"For complex situations, I write a 1-page brief — TL;DR, options, recommendation, decision needed. Saves my manager 20 min of context-loading."</em></li>
  <li><em>"I do quarterly career check-ins with explicit questions: am I on track? what's the gap? what's the H2 plan?"</em></li>
  <li><em>"I ask for what I want explicitly — projects, visibility, feedback, comp. Managers can't read minds."</em></li>
  <li><em>"I match my communication style to the manager's — data-driven gets numbers; story-driven gets narrative; written-async gets pre-shared docs."</em></li>
  <li><em>"I cultivate skip-level + cross-team peer relationships so my career isn't fully dependent on one manager's read."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Behavioral prompt</th><th>What they're really asking</th></tr></thead>
  <tbody>
    <tr><td>"Disagree with manager"</td><td>Productive disagreement; commit after decision</td></tr>
    <tr><td>"Manage up"</td><td>Initiative; making someone else's job easier; clear communication</td></tr>
    <tr><td>"Bad news to leadership"</td><td>Direct, early, with proposed mitigation</td></tr>
    <tr><td>"Advocate for yourself"</td><td>Specific, professional asks; not entitled</td></tr>
    <tr><td>"Build trust with leadership"</td><td>Track record of delivery + early bad news + commitment</td></tr>
    <tr><td>"Conflict with manager"</td><td>Resolved in private; outcome-focused; learning</td></tr>
    <tr><td>"New manager onboarding"</td><td>Proactive context-sharing; not waiting for them to ask</td></tr>
    <tr><td>"Career conversations"</td><td>Specific; quarterly; outcome-oriented</td></tr>
  </tbody>
</table>

<h3>Demo script — "tell me about a time you disagreed with your manager"</h3>
<pre><code class="language-text">"Last quarter my manager wanted to pause our RN refactor for 3 months
to focus on feature delivery. I disagreed.

Context: the current architecture was slowing every feature by ~30%
based on our estimates. Three months of pure features = three months
of compound cost.

What I did: in our 1:1, I proposed a parallel-track approach. I'd
spend 30% of my time on the refactor; the rest of the team would
ship features full-speed. After three months, we'd evaluate.

I didn't push it as 'you're wrong.' I framed: 'here's the concern
I'm seeing; here's the alternative; what am I missing?'

She pushed back: 'show me what 30% time delivers in 3 months on
the refactor scope.' I wrote up the scope + plan. We reviewed it
the next 1:1.

Outcome: she approved the parallel track. Three months in, we'd
shipped 80% of the refactor scope; feature velocity stayed within
~15% of normal. She told me later it was the right call.

What I learned: disagree privately, commit publicly. I had real
concerns; I voiced them; I proposed a path forward; I let evidence
make the case. Once she'd approved, I executed fully — and the
result validated the call."
</code></pre>

<p>Notice: situation, gap, specific actions, evidence-based, concrete outcome, self-aware. STAR pattern done right.</p>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"I'd talk about a tougher case where my manager and I genuinely couldn't agree, and how I escalated to skip-level after we'd exhausted private discussion."</em></li>
  <li><em>"I'd dive into how I built the same trust pattern with my manager's manager when reorgs put me reporting upstream."</em></li>
  <li><em>"I could share the 1-page brief format I use for complex topics."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Initiative</td><td>Drives the 1:1; brings agenda; doesn't wait</td></tr>
    <tr><td>Self-awareness</td><td>Knows their own communication patterns + adjusts</td></tr>
    <tr><td>No-surprises discipline</td><td>Bad news early; bad news with mitigation</td></tr>
    <tr><td>Productive disagreement</td><td>Disagrees professionally; commits after; lets evidence drive</td></tr>
    <tr><td>Asking for what they want</td><td>Explicit; not entitled; specific</td></tr>
    <tr><td>Trust-building</td><td>Long-term focus; not transactional</td></tr>
    <tr><td>Coaching mindset</td><td>Adjusts to manager style; treats them as person, not function</td></tr>
    <tr><td>Multi-source perspective</td><td>Skip-level + peers + cross-team, not single-manager dependent</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>If your manager isn't from a mobile background, educate them: cross-platform tradeoffs, App Store / Play Store cycles, native bridge complexity.</li>
  <li>Mobile teams in cross-platform companies often face "second-class" framing. Counter by linking work to cross-platform impact.</li>
  <li>Time-zone differences (India team / US manager): heavier reliance on async written context; agenda-doc + pre-share is even more critical.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"How do you handle a manager you don't trust?"</em> — Build paper trails (written commitments). Cultivate skip-level + cross-team relationships. Don't trash-talk publicly. Plan transfer / exit if structural.</li>
  <li><em>"What if your manager is a poor communicator?"</em> — Force the issue: explicit feedback questions; written follow-ups for verbal commitments; skip-level + peer endorsements as backup signal.</li>
  <li><em>"How do you give feedback to leadership?"</em> — "Can I share some feedback?" + ask permission + specific behavior + concrete impact + actionable ask. Not vague claims.</li>
  <li><em>"Tell me about a time you delivered bad news."</em> — Early, direct, with proposed mitigation. Don't soften; don't surprise; bring options.</li>
  <li><em>"How do you build trust quickly with a new manager?"</em> — 1-page year-summary + projects in flight + your goals + early proactive 1:1s + explicit "tell me how you like to be communicated to."</li>
  <li><em>"What's your approach to skip-level conversations?"</em> — Quarterly cadence; visibility for your work; org strategy understanding. Never trash-talking your manager. Don't ask for promo there. Tell your manager you're doing it.</li>
  <li><em>"How do you handle a hands-off manager?"</em> — Drive cadence + agenda; force feedback explicitly; build skip-level + peer signals so calibration isn't fully manager-dependent.</li>
  <li><em>"How do you handle a manager who micromanages?"</em> — Pre-empt with detail (reduce their need to ask); direct conversation about anxiety driving it; commit to milestones with self-status.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Set up a shared 1:1 doc with your manager.</li>
  <li>Bring an agenda to your next 1:1.</li>
  <li>Identify your manager's style (data vs story; written vs verbal); adjust.</li>
  <li>Schedule a quarterly career check.</li>
  <li>Write a 1-page brief for one complex topic this week — share before 1:1.</li>
  <li>Ask for one specific thing you want.</li>
  <li>Practice the "what's one thing to keep / one to change" feedback pattern.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read 'High Output Management' by Andy Grove for the manager's perspective on 1:1s."</li>
  <li>"Read 'Radical Candor' for feedback patterns."</li>
  <li>"Read 'The Manager's Path' by Camille Fournier — even as IC, the manager perspective sharpens managing-up skills."</li>
  <li>"Audit your last 5 1:1s — were they status reports or surfacing meetings? What would you change?"</li>
</ul>
`
    }
  ]
});
