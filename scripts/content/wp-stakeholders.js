window.PREP_SITE.registerTopic({
  id: 'wp-stakeholders',
  module: 'workplace',
  title: 'Stakeholder Management',
  estimatedReadTime: '35 min',
  tags: ['stakeholders', 'pm', 'design', 'cross-functional', 'alignment', 'communication', 'product'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>Stakeholder management is what separates engineers who ship features from engineers who ship outcomes. At senior+ levels you have more stakeholders than calendar slots — PM, design, partner teams, leadership, customers, support, security, infra, legal — and the work fails not from coding but from <em>misalignment</em>: the wrong thing built, the right thing built but no one knew, the right thing built but the wrong people surprised.</p>
<ul>
  <li><strong>Stakeholder ≠ user.</strong> A stakeholder is anyone who can affect or is affected by your work. They include people who can block you (security, legal), accelerate you (infra, design), or judge you (manager, skip, exec).</li>
  <li><strong>Map them early.</strong> List every stakeholder before you start coding. Identify the deciders, the influencers, the consulted, the informed.</li>
  <li><strong>Communication budget is finite.</strong> You can't deeply update every stakeholder. Tier them — high-touch / medium-touch / async-only / FYI.</li>
  <li><strong>"Surprise" is the enemy.</strong> Stakeholders accept bad news 10x better than they accept being blindsided.</li>
  <li><strong>PM relationships are the highest-leverage stakeholder relationship</strong> for most ICs. Invest in it explicitly.</li>
  <li><strong>Design relationships</strong> are usually under-invested. Engineers and designers fix more product problems together than either does alone.</li>
  <li><strong>Async-by-default + sync-on-demand:</strong> push status to written; reserve meetings for decisions.</li>
  <li><strong>Mobile / RN angle:</strong> mobile teams are often "the bottleneck" in cross-functional projects (release cycles, app review). Stakeholder education about mobile constraints is part of the job.</li>
</ul>
<p><strong>Mantra:</strong> "Map stakeholders. Tier the touch. Communicate proactively. No surprises. Invest hardest in PM and design."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>Who counts as a stakeholder</h3>
<p>For any non-trivial project, the list of stakeholders is longer than engineers usually realize. A typical mobile feature might have:</p>
<table>
  <thead><tr><th>Role</th><th>Why a stakeholder</th></tr></thead>
  <tbody>
    <tr><td>PM</td><td>Owns roadmap; decides what ships; reports up</td></tr>
    <tr><td>Design</td><td>Owns UX; affected by your implementation choices</td></tr>
    <tr><td>Engineering manager</td><td>Owns your performance + team commitments</td></tr>
    <tr><td>Skip-level / director</td><td>Owns broader org; will hear about big issues</td></tr>
    <tr><td>Backend team</td><td>API dependency; their work blocks/unblocks you</td></tr>
    <tr><td>Other mobile teams</td><td>Code conflicts, shared frameworks, release coordination</td></tr>
    <tr><td>Security</td><td>Reviews of any auth, PII, API surface</td></tr>
    <tr><td>Legal / privacy</td><td>Anything user data, ToS, regional restrictions</td></tr>
    <tr><td>Support / CX</td><td>They handle user reports about your feature</td></tr>
    <tr><td>QA / release</td><td>Your work goes through their gate</td></tr>
    <tr><td>Marketing / GTM</td><td>If feature has launch component</td></tr>
    <tr><td>Data / analytics</td><td>Instrumentation, metrics for evaluation</td></tr>
    <tr><td>Customer success / sales</td><td>If feature is for enterprise customers</td></tr>
    <tr><td>Compliance / SOC / audit</td><td>For regulated industries</td></tr>
    <tr><td>Accessibility (a11y) team</td><td>Compliance + UX</td></tr>
    <tr><td>Internationalization (i18n)</td><td>If multi-region launch</td></tr>
  </tbody>
</table>
<p>Not all of these apply to every project. The skill is identifying which apply and engaging proportionally.</p>

<h3>Why stakeholder management is its own skill</h3>
<p>The stereotype: "I'll just build the thing; the rest is overhead." Reality:</p>
<ul>
  <li><strong>Half of senior-engineer time is communication.</strong> Reviews, syncs, docs, async updates. You can't ship complex work without it.</li>
  <li><strong>Stakeholders block.</strong> Security finding day-of-launch can cost you 6 weeks. Surprised PM kills a launch.</li>
  <li><strong>Stakeholders accelerate.</strong> A backend team that knows your needs early can ship the API before you need it. Surprise asks the day before launch get pushback.</li>
  <li><strong>Career is built through stakeholders.</strong> Promotion calibration cares about cross-functional perception, not just code.</li>
  <li><strong>Trust compounds.</strong> A track record of "Prakhar always tells me what's coming" earns you autonomy. The opposite gets you micromanaged.</li>
</ul>

<h3>The cost of bad stakeholder management</h3>
<table>
  <thead><tr><th>Failure mode</th><th>Symptoms</th><th>Cost</th></tr></thead>
  <tbody>
    <tr><td>"Surprise" launches</td><td>Stakeholder hears about feature day-of from someone else</td><td>Trust loss; future features delayed for "approval"</td></tr>
    <tr><td>Late dependency requests</td><td>Day before launch: "oh we need X from backend"</td><td>Backend team pushes back; launch slips</td></tr>
    <tr><td>Skipped reviews</td><td>Security / legal / a11y not engaged early</td><td>Day-of blockers; expensive rework</td></tr>
    <tr><td>Status void</td><td>No async updates; stakeholders fish for info</td><td>Repeated meetings just to get status</td></tr>
    <tr><td>Channel chaos</td><td>Updates in random Slack DMs, no canonical source</td><td>Misalignment; same questions repeated</td></tr>
    <tr><td>Bypassing the PM</td><td>Engineer talks to designer / executive without looping PM</td><td>PM blindsided; trust damage; project gets political</td></tr>
    <tr><td>Engineer-led product decisions</td><td>Engineer makes scope changes without PM</td><td>"Why did you build it that way?"; rework</td></tr>
  </tbody>
</table>

<h3>The PM relationship — most engineers under-invest</h3>
<p>Your PM is your single highest-leverage stakeholder. They:</p>
<ul>
  <li>Decide priorities for the team's roadmap.</li>
  <li>Translate engineering reality to leadership.</li>
  <li>Defend your team in cross-functional disputes.</li>
  <li>Influence your perf rating through their feedback.</li>
  <li>Are the gateway to most other stakeholders.</li>
</ul>
<p>Engineers often treat PM as "person who writes the spec" — passive. The strong move: treat PM as your closest collaborator. Weekly 1:1, shared doc, joint problem-solving. The PM-eng pair that operates as a unit ships 2x what disconnected pairs do.</p>

<h3>The design relationship — also under-invested</h3>
<p>Designers and engineers shipping together solve product problems neither solves alone. Strong patterns:</p>
<ul>
  <li><strong>Co-design from week 1.</strong> Don't wait for "final designs"; iterate together. Engineers spot constraints; designers spot UX gaps.</li>
  <li><strong>Shared language.</strong> Engineers learn enough design vocabulary; designers learn enough technical vocabulary.</li>
  <li><strong>Mutual respect on judgment calls.</strong> Engineer trusts designer on UX choices; designer trusts engineer on implementation costs.</li>
  <li><strong>Shared review.</strong> Engineer reviews designs; designer reviews implementation. Both should QA the live product before ship.</li>
</ul>

<h3>The leadership / exec stakeholder dynamic</h3>
<p>Different from peer stakeholders:</p>
<ul>
  <li><strong>They have less context</strong> than peers. Anything you tell them needs setup.</li>
  <li><strong>They optimize for different things</strong> — strategic alignment, business outcomes, risk to org.</li>
  <li><strong>They have less time.</strong> 1-page summaries beat 10-page docs.</li>
  <li><strong>They want to be informed, not surprised.</strong> Bad news first, with a plan.</li>
  <li><strong>They influence your career trajectory.</strong> Even one bad interaction with a director can cost you a level.</li>
</ul>

<h3>Why this is harder for engineers than for PMs</h3>
<ul>
  <li>Engineers are trained to optimize for technical correctness, not stakeholder satisfaction.</li>
  <li>Engineers under-value soft work ("not real work").</li>
  <li>Engineers default to async / silent work; many stakeholders default to sync / vocal.</li>
  <li>Engineers under-communicate ("the work speaks for itself") — it doesn't.</li>
</ul>
<p>The leveling-up move: explicitly treat stakeholder management as a deliverable, not overhead.</p>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The RACI matrix (lightweight version)</h3>
<p>For any project, classify stakeholders:</p>
<table>
  <thead><tr><th>Tier</th><th>Description</th><th>Engagement</th></tr></thead>
  <tbody>
    <tr><td><strong>R - Responsible</strong></td><td>Doing the work</td><td>Daily / async ping-pong</td></tr>
    <tr><td><strong>A - Accountable</strong></td><td>Final say; signs off (1 person)</td><td>Weekly sync + escalation channel</td></tr>
    <tr><td><strong>C - Consulted</strong></td><td>Two-way input expected</td><td>Standing review touch-points; consulted before decisions</td></tr>
    <tr><td><strong>I - Informed</strong></td><td>One-way updates</td><td>Email / doc updates; no expected response</td></tr>
  </tbody>
</table>
<p>Most stakeholder problems trace back to: not having an A (everyone defers / no decisions), too many Cs (death by consultation), or Cs not actually consulted (surprise at launch).</p>

<h3>The communication tier model</h3>
<p>You can't deeply engage 20 stakeholders. Tier them:</p>
<table>
  <thead><tr><th>Tier</th><th>Touch</th><th>Examples</th></tr></thead>
  <tbody>
    <tr><td><strong>1. High-touch</strong></td><td>Weekly 1:1s + ad-hoc</td><td>PM, design lead, manager</td></tr>
    <tr><td><strong>2. Medium-touch</strong></td><td>Bi-weekly check-in or async update</td><td>Backend lead, partner team, infra</td></tr>
    <tr><td><strong>3. Async-only</strong></td><td>Reads your status updates; engages when they have questions</td><td>Skip-level, security, support</td></tr>
    <tr><td><strong>4. FYI</strong></td><td>Sees launch; no project-time engagement</td><td>Adjacent teams, marketing, exec</td></tr>
  </tbody>
</table>
<p>Use the tiers to decide where to spend your stakeholder time. Tier-1 gets calendar; tier-4 gets a launch email.</p>

<h3>The "stakeholder map" exercise</h3>
<p>For any non-trivial project, before kickoff, draw a 2D map:</p>
<pre><code>            Influence (high)
                  ↑
                  │
   Manage closely │ Keep informed
   (PM, design,   │ (skip, exec,
    manager)      │  partner team
                  │  leads)
                  │
  ────────────────┼──────────────── Interest (high) →
                  │
   Monitor        │ Keep updated
   (security,     │ (other mobile
    a11y,         │  teams,
    legal —       │  support)
    only when     │
    relevant)     │
                  ↓
            Influence (low)</code></pre>
<p>Each quadrant gets a different engagement strategy. The biggest mistake: treating "low influence / low interest" stakeholders the same as "high / high."</p>

<h3>The "single source of truth" principle</h3>
<p>Stakeholders need ONE place to find the current state. Not Slack, not last meeting notes, not email. A canonical doc / dashboard / project page that:</p>
<ul>
  <li>Has the goal / scope.</li>
  <li>Has the current status (RAG: red/amber/green).</li>
  <li>Has the timeline.</li>
  <li>Has open risks.</li>
  <li>Is updated weekly.</li>
  <li>Is linked everywhere (Slack channel topic, calendar invites, email).</li>
</ul>
<p>If a stakeholder asks you a question that's answered in the doc, point to it. Train them. Eventually they self-serve and your meeting load drops.</p>

<h3>The "no surprises" rule</h3>
<p>The single most important norm: stakeholders should never be surprised by news from anyone other than you. Bad news, scope changes, slips, risk events — all of them should reach the relevant stakeholder from you, before they hear it from anyone else.</p>
<p>The order of badness:</p>
<ol>
  <li>Stakeholder hears bad news from you, with context. (Acceptable.)</li>
  <li>Stakeholder hears bad news from you with no plan. (Manageable.)</li>
  <li>Stakeholder hears bad news from someone else who heard it from you. (Trust damage.)</li>
  <li>Stakeholder hears bad news from a peer / customer / leadership. (Major trust damage.)</li>
  <li>Stakeholder discovers bad news themselves at launch. (Trust collapse.)</li>
</ol>

<h3>The "translation" mental model</h3>
<p>Different stakeholders need different framings of the same fact:</p>
<table>
  <thead><tr><th>Audience</th><th>Translation of "we need 2 more weeks"</th></tr></thead>
  <tbody>
    <tr><td>Engineer</td><td>"Found edge case in offline sync logic; rework required."</td></tr>
    <tr><td>PM</td><td>"Need to push launch by 2 weeks. Impact on dependent features: [X]. Mitigation: [Y]."</td></tr>
    <tr><td>Design</td><td>"Edge case found that affects [UX area]. Want to walk through implications?"</td></tr>
    <tr><td>Skip-level</td><td>"Project tracking 2 weeks behind; recoverable; revised launch [date]; no blockers to dependent OKR."</td></tr>
    <tr><td>Exec</td><td>"Q3 launch; on track for revised date; key risk addressed; will update at next staff meeting."</td></tr>
    <tr><td>Customer / external</td><td>"Launch in early Q3. Detail under embargo until [date]."</td></tr>
  </tbody>
</table>
<p>Same underlying fact; different vocabulary, depth, and emphasis. The skill: knowing the audience and re-framing on the fly.</p>

<h3>The "trust bank" model</h3>
<p>Every interaction with a stakeholder is a deposit or withdrawal in a metaphorical trust account.</p>
<table>
  <thead><tr><th>Deposit</th><th>Withdrawal</th></tr></thead>
  <tbody>
    <tr><td>Proactive update before they ask</td><td>Forgetting to update; them having to chase</td></tr>
    <tr><td>Hitting committed dates</td><td>Slipping with no warning</td></tr>
    <tr><td>Honest "I don't know yet, will know by Friday"</td><td>Vague "soon" / "should be okay"</td></tr>
    <tr><td>Owning a mistake without blame</td><td>Defensive / blame-shifting</td></tr>
    <tr><td>Saving a stakeholder time (concise updates)</td><td>Long rambling updates that hide signal</td></tr>
    <tr><td>Useful technical translation for non-engineer</td><td>Tech-jargon impenetrability</td></tr>
  </tbody>
</table>
<p>The bank balance dictates how much latitude you get for the next ask. High balance: "Sure, take the extra week, you've earned it." Low balance: "Why are you slipping again?"</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>The kickoff playbook</h3>
<p>Before code, before sprint zero, run a kickoff:</p>
<ol>
  <li><strong>Identify all stakeholders.</strong> Brainstorm the full list using the table above.</li>
  <li><strong>Apply RACI.</strong> One A. R(s) clear. Cs limited (3-5 max). Is broader.</li>
  <li><strong>Tier for communication.</strong> Tier 1-4 as above.</li>
  <li><strong>Set up the canonical doc.</strong> Goal, scope, milestones, risks. Link in calendar / Slack.</li>
  <li><strong>Set the cadence.</strong> Weekly status update day. Bi-weekly tier-2 syncs. Tier-1 1:1s.</li>
  <li><strong>Get explicit acceptance criteria from stakeholders.</strong> "What does done look like?" — get it in writing.</li>
  <li><strong>Identify dependencies + risks.</strong> Backend APIs, security review, design assets, etc. Each has an owner and a date.</li>
  <li><strong>Pre-mortem.</strong> "What's most likely to make this fail?" — walk through with team + key stakeholders.</li>
</ol>
<p>30-60 minutes of kickoff prevents weeks of rework.</p>

<h3>The weekly status update template</h3>
<p>Push to canonical doc + Slack thread + email digest if needed. Format:</p>
<pre><code># [Project Name] — Status [date]

**Status:** 🟢 On track / 🟡 At risk / 🔴 Blocked

## Progress this week
- [Concrete completed items]
- [Decisions made]

## Plan next week
- [What's getting worked on]
- [Decisions needed]

## Risks / blockers
- [Anything that might slip; owner + mitigation]

## Asks from stakeholders
- [Specific asks: "PM: confirm scope on X"; "Backend: ETA on API"]

## Open questions
- [Decisions that need input]

---
Next update: [date]</code></pre>
<p><strong>Why this format works:</strong></p>
<ul>
  <li>Status emoji is scannable in 2 seconds.</li>
  <li>Risk section forces honest signal.</li>
  <li>"Asks" is explicit — converts the doc from passive status into active project artifact.</li>
  <li>Same format week-to-week → stakeholders learn to skim quickly.</li>
</ul>

<h3>How to communicate slippage</h3>
<p>Slippage is the highest-stakes stakeholder communication. Rules:</p>
<ol>
  <li><strong>Communicate as soon as you know.</strong> Day-1 notice = recoverable. Week-3 notice = damage.</li>
  <li><strong>Lead with new estimate.</strong> Don't bury the headline. "Pushing launch from Mar 15 to Mar 29."</li>
  <li><strong>Cause in one sentence.</strong> Specific, factual, not defensive.</li>
  <li><strong>Mitigation / recovery plan.</strong> What you're doing now to limit further slip.</li>
  <li><strong>Impact on dependents.</strong> Other teams / features that count on you.</li>
  <li><strong>What you need from them.</strong> Decisions, resources, scope cuts.</li>
</ol>
<pre><code>Subject: [Project] - Launch slip 2 weeks - need decisions

TL;DR: Pushing launch from Mar 15 → Mar 29.

Cause: Discovered race condition in offline sync that affects ~5%
of users; fix requires schema change + migration. Found during
Stage 2 testing (good — would've been worse if found post-launch).

Plan:
- Eng: 1 week schema change + migration
- Eng: 4 days re-testing
- Buffer: 3 days

Impact on dependents:
- Marketing campaign: needs 2-week shift; talked to [GTM lead],
  workable.
- Data team integration: 1 week behind; minor.

Asks:
- Confirm Mar 29 launch is workable. (PM)
- Approve scope of schema change. (Backend lead)

Will send detailed update Friday.</code></pre>

<h3>Running effective stakeholder meetings</h3>
<p>Default meeting types:</p>
<table>
  <thead><tr><th>Meeting</th><th>Cadence</th><th>Purpose</th><th>Length</th></tr></thead>
  <tbody>
    <tr><td>Project standup (eng-only)</td><td>Daily / 3x/wk</td><td>Status, blockers</td><td>15 min</td></tr>
    <tr><td>Project sync (cross-functional)</td><td>Weekly</td><td>Decisions, alignment</td><td>30 min</td></tr>
    <tr><td>Eng-PM 1:1</td><td>Weekly</td><td>Roadmap, risks, mutual feedback</td><td>30 min</td></tr>
    <tr><td>Eng-design pairing</td><td>Bi-weekly</td><td>UX-implementation alignment</td><td>30 min</td></tr>
    <tr><td>Skip-level project review</td><td>Monthly</td><td>Status to leadership</td><td>15-30 min</td></tr>
    <tr><td>Cross-team coordination</td><td>As-needed</td><td>Dependencies, integrations</td><td>30 min</td></tr>
  </tbody>
</table>
<p>Rules for cross-functional meetings:</p>
<ul>
  <li><strong>Have a written agenda.</strong> Posted 24 hours ahead. No agenda = cancel.</li>
  <li><strong>Have an owner.</strong> Drives discussion, parks tangents, captures decisions.</li>
  <li><strong>Capture decisions in writing.</strong> Send notes within 24 hours; everyone re-reads to confirm.</li>
  <li><strong>End with action items.</strong> "Who does what by when."</li>
  <li><strong>Cancel when you can.</strong> If async would work, cancel and write a doc instead.</li>
</ul>

<h3>Pre-reading vs. live discussion</h3>
<p>For decisions: pre-read + 15-min discussion beats 60-min walk-through.</p>
<pre><code>Bad meeting:
"Let me walk you through the design..." (45 min)
"Any thoughts?" (5 min)
[no decision; another meeting needed]

Good meeting:
"Pre-read sent Tuesday. Decision needed: A vs. B."
[15 min: each side argues; vote; decision]
[5 min: action items, owners, dates]</code></pre>
<p>Push pre-reading hard. Stakeholders push back ("just walk me through"); train them anyway. Once they see one good 20-min meeting that replaces three 60-min ones, they convert.</p>

<h3>Stakeholder onboarding</h3>
<p>When a new stakeholder joins (new PM, new manager, new partner team), invest a one-time onboarding session:</p>
<ul>
  <li>Project context (1-pager).</li>
  <li>Current status, key risks.</li>
  <li>Who else is involved + their roles.</li>
  <li>Pointers to canonical docs.</li>
  <li>How they prefer to be communicated to (1:1 frequency, channel, response expectations).</li>
</ul>
<p>30 minutes of onboarding saves weeks of "wait, what's happening with X?" later.</p>

<h3>Managing up: keeping your manager informed</h3>
<p>Special case of stakeholder management. See <a href="#" data-topic="wp-managing-up">Managing Up & 1:1s</a> for full treatment. Stakeholder-specific patterns:</p>
<ul>
  <li><strong>Manager should never hear about your project from anyone else.</strong> If your skip mentions your project to your manager, your manager should already know everything they're hearing.</li>
  <li><strong>Cross-functional disputes</strong> get surfaced to your manager early — they may need to navigate it with peer manager.</li>
  <li><strong>Big asks from senior leadership</strong> get looped through your manager — protects you from drive-bys.</li>
</ul>

<h3>Negotiating with peer teams (dependencies)</h3>
<p>Dependencies are stakeholder problems wearing technical clothes. Patterns:</p>
<ul>
  <li><strong>Engage early.</strong> "We'll need API X by date Y" — say it 6 weeks out, not 2 weeks.</li>
  <li><strong>Make their life easy.</strong> Bring a written spec; don't make them write it. Suggest contract; they refine.</li>
  <li><strong>Have a fallback.</strong> What you'll do if their work doesn't land. Often forces priority for them; sometimes the right call.</li>
  <li><strong>Loop their manager / PM.</strong> Don't try to drive cross-team work entirely engineer-to-engineer.</li>
  <li><strong>Pay it back.</strong> When they need something from you, prioritize. Reciprocity matters.</li>
</ul>

<h3>Saying no to stakeholders</h3>
<p>See <a href="#" data-topic="wp-saying-no">Saying No & Scope Pushback</a>. Stakeholder-specific notes:</p>
<ul>
  <li>Stakeholders ask for scope additions constantly. Most should be politely deferred.</li>
  <li>"Can we just add this small thing?" → "Sure, here's what gets bumped." Always name the trade-off.</li>
  <li>Late-stage scope changes are especially expensive — push back with timeline impact.</li>
</ul>

<h3>Mobile / RN-specific stakeholder education</h3>
<p>Cross-functional partners often don't grok mobile constraints:</p>
<ul>
  <li><strong>App release cycle:</strong> "We can't deploy a hotfix instantly like web. App review = 1-7 days."</li>
  <li><strong>Version coverage:</strong> "Even after release, only 60% of users update in week 1; 95% in 4-6 weeks."</li>
  <li><strong>OS version testing:</strong> "Need to test on iOS 15-17, Android 9-14 in our user base."</li>
  <li><strong>Native vs. RN trade-offs:</strong> Some changes are RN; some need native. Educate when relevant.</li>
  <li><strong>Server-driven UI:</strong> Architectural lever to reduce app release dependency for content-heavy features.</li>
</ul>
<p>Frame these as "here are the constraints we work within" not "no, mobile can't." The shape of educating + offering alternatives = positive stakeholder dynamic.</p>

<h3>Documentation as stakeholder communication</h3>
<p>Good docs reduce stakeholder load:</p>
<ul>
  <li><strong>One-pager for the project.</strong> Goal, scope, current state — for skim audience.</li>
  <li><strong>Design doc.</strong> Tradeoffs, decisions, links — for engineers reviewing.</li>
  <li><strong>Launch plan.</strong> Phased rollout, monitoring, rollback — for ops + leadership.</li>
  <li><strong>Post-launch retro.</strong> What shipped, what didn't, what we learned — for org learning + your perf packet.</li>
</ul>
`
    },
    {
      id: 'examples',
      title: '🔍 Worked Examples',
      html: `
<h3>Example 1: New project kickoff</h3>
<p><strong>Setup:</strong> You're tech lead on a new mobile feature: redesigned home screen with personalized recommendations. ~3-month project. Cross-functional: design, ML, backend, marketing.</p>

<p><strong>Stakeholder map:</strong></p>
<table>
  <thead><tr><th>Role</th><th>Person</th><th>RACI</th><th>Tier</th></tr></thead>
  <tbody>
    <tr><td>Tech lead</td><td>You</td><td>R</td><td>—</td></tr>
    <tr><td>PM</td><td>X</td><td>A</td><td>1</td></tr>
    <tr><td>Design lead</td><td>Y</td><td>C</td><td>1</td></tr>
    <tr><td>ML team lead</td><td>Z</td><td>R (their part)</td><td>2</td></tr>
    <tr><td>Backend lead</td><td>W</td><td>R (their part)</td><td>2</td></tr>
    <tr><td>Eng manager</td><td>V</td><td>I</td><td>1</td></tr>
    <tr><td>Director</td><td>U</td><td>I</td><td>3</td></tr>
    <tr><td>Marketing lead</td><td>T</td><td>C (launch)</td><td>3</td></tr>
    <tr><td>Support lead</td><td>S</td><td>I</td><td>4</td></tr>
    <tr><td>Privacy / legal</td><td>R</td><td>C</td><td>3</td></tr>
    <tr><td>A11y team</td><td>Q</td><td>C</td><td>3</td></tr>
  </tbody>
</table>

<p><strong>Cadences set up:</strong></p>
<ul>
  <li>Weekly 30-min PM 1:1.</li>
  <li>Weekly 30-min cross-functional sync (PM, design, ML, backend, you).</li>
  <li>Monthly 15-min update with director (in PM's existing forum).</li>
  <li>Async weekly status update (Slack + canonical doc).</li>
  <li>Privacy + a11y reviews scheduled at design-freeze + code-complete points.</li>
</ul>

<p><strong>Pre-mortem outcomes:</strong></p>
<ul>
  <li>Risk: ML team late on rec service → fallback to popular-content service for v1.</li>
  <li>Risk: privacy review surprises → pre-engage privacy team in week 2.</li>
  <li>Risk: design-eng mismatch on "feel" → pair on prototype in week 1.</li>
</ul>

<h3>Example 2: The PM who wants daily status</h3>
<p><strong>Setup:</strong> New PM. Asks for daily status update. You're spending 30 min/day writing it.</p>

<p><strong>Bad:</strong> Resentfully comply. 2.5 hrs/wk gone.</p>

<p><strong>Good: renegotiate the cadence.</strong></p>
<pre><code>1:1 with PM:

"I want to make sure we're communicating well. Right now I'm doing
daily updates which is taking ~30 min/day.

I think we can do better with less time on both sides:
- I'll keep a canonical project doc updated continuously — you can
  glance any time.
- Weekly written status update covering progress, risks, asks.
- Slack DM me anytime if you need something specific.
- Our 1:1 is the place for deeper alignment.

Daily updates feel like overhead for both of us. Want to try this?"</code></pre>

<p><strong>Why:</strong> Doesn't refuse outright; offers an alternative; explains your reasoning; gives them control over the change. Works most of the time.</p>

<h3>Example 3: Surprise scope ask 2 weeks before launch</h3>
<p><strong>Setup:</strong> 2 weeks before launch. PM says: "Marketing wants us to add a new banner promoting Y. They need it for the campaign."</p>

<p><strong>Bad: silent grumble + work weekends.</strong></p>

<p><strong>Good: surface the trade-off.</strong></p>
<pre><code>"Talking through the banner ask:

Pros: marketing alignment, supports campaign.
Cons:
- 4 days of work (design + native + testing).
- We're 2 weeks out — adding work compresses our QA + soak time.
- Risk of regression on core launch is non-trivial.

Three options:
1. Drop banner; ship core launch on Mar 15.
2. Ship core on Mar 15; ship banner update on Mar 29 (separate
   release).
3. Push core launch to Mar 22 to include banner; risk of further slips.

Recommend option 2: gets the campaign covered without putting core
launch at risk. Want to bring marketing in to confirm?"</code></pre>

<p><strong>Why:</strong> Names trade-offs concretely. Recommends a path. Brings marketing into the decision (so PM doesn't have to advocate alone).</p>

<h3>Example 4: Director surprise question in a meeting</h3>
<p><strong>Setup:</strong> All-hands meeting. Director: "Hey, what's the status of [your project]?"</p>

<p><strong>Bad:</strong> Long technical ramble. Director glazes over. Asks PM later (PM doesn't know what you said).</p>

<p><strong>Good: 30-second crisp update.</strong></p>
<pre><code>"On track for [date], 🟢. Scope is locked. Two open risks: [X] and [Y];
[X] mitigation in progress this week, [Y] depends on partner team.
Detailed status in [doc link] for anyone who wants more."</code></pre>

<p><strong>Why:</strong> Status, date, risks, link. 30 seconds. Director satisfied; PM informed; doc link routes anyone who wants more.</p>

<p><strong>Pre-step:</strong> always have your "30-second status" rehearsed for any project you're leading. Senior engineers should be able to give it any time without prep.</p>

<h3>Example 5: Mobile constraints education</h3>
<p><strong>Setup:</strong> Web-team peer Slacks: "Why does the app launch take 6 weeks longer than the web one?"</p>

<p><strong>Bad:</strong> Defensive / curt response.</p>

<p><strong>Good: educational + concrete.</strong></p>
<pre><code>Great question — happy to share the constraints we work within.

Mobile launch timeline includes:
- Code complete: same as web (~2 weeks for our scope).
- Internal QA: 1 week (more devices to test than web).
- Beta release (TestFlight/Play): 1 week soak.
- App store review: 1-7 days each platform.
- Phased rollout to monitor crashes: 1-2 weeks.
- Even after rollout, only ~60% of users have updated in week 1.

For features that are time-sensitive, we can sometimes use
server-driven UI (no app release needed) — happy to chat about which
parts of the feature could go that route.

Genuinely useful question — want to put together a "how mobile
launches work" doc and send it around?</code></pre>

<p><strong>Why:</strong> Treats them as good-faith. Specific constraints. Offers an architectural alternative. Ends with a relationship-building offer.</p>

<h3>Example 6: Privacy-review-day blocker</h3>
<p><strong>Setup:</strong> Day before launch. Privacy team flags an issue with how you handle PII in analytics. Says no-go until fixed.</p>

<p><strong>Bad:</strong> Argue with privacy team, escalate to your manager, blame everyone.</p>

<p><strong>Good: triage + communicate.</strong></p>
<pre><code>Step 1: Understand the issue. 30-min meeting with privacy lead;
        understand the specifics; quantify fix time.

Step 2: Update stakeholders.

  Subject: Privacy issue blocks launch tomorrow

  Privacy review surfaced an issue with analytics PII handling on
  the new home screen. Specifically: [issue].

  Options:
  A. Fix + re-review (2-3 days).
  B. Disable analytics for v1 launch; ship as planned tomorrow;
     follow up.
  C. Roll back the home-screen change; ship rest of release.

  Recommend A: privacy concern is real and analytics is part of
  the launch story. 3-day delay is recoverable; B + C have
  bigger downstream costs.

  Need decision from PM + privacy by EOD; will work the fix
  starting tomorrow morning.

Step 3: Internally, post-mortem how privacy review came so late.
        Lesson: engage privacy at design-freeze, not pre-launch.</code></pre>

<p><strong>Why:</strong> Doesn't argue with privacy; treats their finding as data. Triages with options. Recommends one. Owns the post-mortem.</p>

<h3>Example 7: Skip-level meeting prep</h3>
<p><strong>Setup:</strong> Skip-level (director) wants a 30-min update on your project.</p>

<p><strong>Bad:</strong> Walk in cold; ramble through history.</p>

<p><strong>Good: prep + lead.</strong></p>
<pre><code>Pre-meeting prep:
- 1-page doc sent 24 hrs ahead with: goal, status, dates, risks,
  asks for them.
- Slides if helpful (sparingly).

Meeting structure:
0-5 min:    Status + key milestones (you talk; they listen).
5-15 min:   Risks + decisions / asks needed (their input).
15-25 min:  Open questions / discussion (their lead).
25-30 min:  Action items + next check-in (you summarize).

Goal: leave with clearer support, removed blockers, no surprises.</code></pre>

<p><strong>Why:</strong> Pre-read makes meeting efficient. Structure puts their value-add (decisions / influence) in the middle. Ends with crisp actions.</p>

<h3>Example 8: Recovering trust after a slip</h3>
<p><strong>Setup:</strong> Slipped a launch by 4 weeks; stakeholders frustrated. New project just kicking off.</p>

<p><strong>Recovery moves:</strong></p>
<ul>
  <li><strong>Acknowledge explicitly.</strong> "We slipped last project; here's what I'm doing differently this time."</li>
  <li><strong>Over-communicate early.</strong> Twice the frequency for first 2-3 weeks.</li>
  <li><strong>Set conservative dates.</strong> Beat them. Beat-by-1-week is much better than slip-by-1-week.</li>
  <li><strong>Document risks early + honestly.</strong> Show you're tracking what could go wrong.</li>
  <li><strong>Hit small commitments first.</strong> Quick wins to rebuild trust.</li>
</ul>
<p>Trust takes 2-3x longer to rebuild than it took to lose. But it does rebuild — execute well on a few cycles and you're back.</p>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>The mismatched-priority stakeholder</h3>
<p>Sometimes a stakeholder's priorities are explicitly different from yours. Example: marketing wants a feature shipped Tuesday for a campaign; eng quality wants 1 more week of testing.</p>
<p>Strategies:</p>
<ul>
  <li><strong>Surface the conflict</strong> upward. Don't try to resolve solo.</li>
  <li><strong>Quantify both sides.</strong> Marketing impact in revenue vs. engineering risk in regressions / customer harm.</li>
  <li><strong>Offer trade-offs.</strong> "Ship Tuesday with these compromises; ship Friday with these benefits."</li>
  <li><strong>Let leadership decide.</strong> Document the trade-off; their call. You execute.</li>
</ul>

<h3>The "always-pushing" stakeholder</h3>
<p>Some stakeholders push for everything: more scope, faster delivery, more meetings. Defenses:</p>
<ul>
  <li><strong>Don't reflexively yes.</strong> Each ask gets evaluated.</li>
  <li><strong>Use the "trade-off" frame.</strong> "Yes, here's what gets displaced."</li>
  <li><strong>Loop in your manager / their manager.</strong> Pattern of over-pushing should be visible.</li>
  <li><strong>Document.</strong> Written commitments in writing protect you.</li>
</ul>

<h3>The political / hostile stakeholder</h3>
<p>Sometimes a stakeholder actively works against you (peer who wants your project to fail, exec who's invested in alternative). Defenses:</p>
<ul>
  <li><strong>Document everything.</strong> Decisions in writing. Communications in email/Slack.</li>
  <li><strong>Don't engage emotionally.</strong> Stay professional, factual, data-driven.</li>
  <li><strong>Build allies.</strong> Other stakeholders who can vouch.</li>
  <li><strong>Loop your manager.</strong> Political problems are partially their job.</li>
  <li><strong>Be careful what you escalate.</strong> Frame it as "I want to make sure we're aligned" not "[X] is undermining me."</li>
</ul>

<h3>The new manager / new PM mid-project</h3>
<p>Stakeholder turnover is common. When it happens:</p>
<ul>
  <li><strong>Onboard them quickly.</strong> 1-page brief; 30-min walkthrough.</li>
  <li><strong>Re-confirm decisions.</strong> Things old manager / PM agreed to may not stick. Get new sign-off explicitly.</li>
  <li><strong>Re-establish cadence.</strong> Their preferred rhythm may differ.</li>
  <li><strong>Don't assume institutional memory.</strong> Re-explain context they don't have.</li>
</ul>

<h3>The senior leader who micromanages</h3>
<p>Some directors / VPs want deep involvement in feature-level decisions. Defenses:</p>
<ul>
  <li><strong>Pre-empt.</strong> If you push more updates / docs / status forward, they need to ask less.</li>
  <li><strong>Establish trust early.</strong> Hit small commitments; demonstrate competence.</li>
  <li><strong>Loop your manager.</strong> Over-involvement from skip-level is partly your manager's problem to manage.</li>
  <li><strong>Frame their input as input</strong>, not orders. "Thanks for the suggestion. Here's what we're considering. Recommend X for these reasons. Want to discuss?"</li>
</ul>

<h3>The "I just want updates" stakeholder who isn't really informed</h3>
<p>Some stakeholders ask for updates but never read them. Symptoms: same questions you've answered before; surprised by things in the doc; ask for re-summaries.</p>
<ul>
  <li><strong>Don't double down on more updates.</strong> They won't read more either.</li>
  <li><strong>Switch to in-person briefings</strong> if the stakeholder is high-influence.</li>
  <li><strong>Use very short summaries.</strong> 2 lines maximum for the highest tier.</li>
  <li><strong>Demote them to FYI tier</strong> if they're low-influence. Don't burn time updating people who don't engage.</li>
</ul>

<h3>The stakeholder who weaponizes urgency</h3>
<p>"This is critical, I need it tomorrow." But everything is critical, everything is tomorrow.</p>
<ul>
  <li><strong>Triage explicitly.</strong> "When you say critical, what's the actual deadline + what happens if it slips?"</li>
  <li><strong>Force ranking.</strong> "Of A, B, C, you marked all critical. Which is most critical?"</li>
  <li><strong>Manager-level conversation.</strong> If pattern continues, your manager handles it with their manager.</li>
</ul>

<h3>Cross-time-zone stakeholders</h3>
<p>Especially when teams are India-US, EU-US split:</p>
<ul>
  <li><strong>Async-first by default.</strong> Written status and docs work across time zones; meetings don't.</li>
  <li><strong>Establish overlap windows.</strong> 2-3 hours/day of mutual availability.</li>
  <li><strong>Be explicit about response expectations.</strong> "I'll respond to async questions within my next workday."</li>
  <li><strong>Rotate inconvenience.</strong> Don't always make one timezone do late nights.</li>
</ul>

<h3>Stakeholders in a different language / culture</h3>
<p>Multinational orgs have stakeholders in cultures with different communication norms.</p>
<ul>
  <li><strong>Direct vs. indirect:</strong> what reads as "professional" in one culture reads as "rude" in another. Adjust.</li>
  <li><strong>Hierarchy expectations:</strong> some cultures expect more deference to senior; others are flatter.</li>
  <li><strong>Meeting norms:</strong> some cultures decision-make in meetings; others post-meeting.</li>
  <li><strong>Written-language asymmetry:</strong> if you're a native English writer working with non-native readers, simplify language.</li>
</ul>

<h3>The customer-facing stakeholder</h3>
<p>Sometimes you have direct customer / external partner contact (rarer for ICs, common for staff+ in B2B). Special rules:</p>
<ul>
  <li><strong>Loop sales / customer-success on every interaction.</strong> They own the relationship.</li>
  <li><strong>Don't commit to roadmap.</strong> Even casual mentions ("yeah we'll add that") become commitments.</li>
  <li><strong>Don't share competitor / internal info.</strong> Especially names of partners / customers.</li>
  <li><strong>Take notes; share with internal team.</strong> Customer feedback is signal.</li>
</ul>

<h3>The "informal stakeholder" — peer engineer who'll judge your work</h3>
<p>Senior peers from other teams sometimes carry weight at calibration even though they're not RACI on your project. Stay friendly:</p>
<ul>
  <li>Solicit their input on hard design decisions.</li>
  <li>Acknowledge their expertise publicly.</li>
  <li>Reciprocate when they ask for input.</li>
  <li>Don't surprise them with criticism in cross-team forums.</li>
</ul>

<h3>The stakeholder who wants you to do their job</h3>
<p>Some PMs / designers will offload work onto eng — writing PRDs, making product decisions, doing usability testing. Push back politely:</p>
<ul>
  <li>"Happy to give technical input; the product decision is yours."</li>
  <li>"I can help validate; the test design is design's wheelhouse."</li>
  <li>"Want to walk through what good would look like and check we're aligned?"</li>
</ul>

<h3>When you ARE the bottleneck stakeholder</h3>
<p>Sometimes another team is waiting on you and you're slipping. Roles reverse — you're the difficult stakeholder. Apply same principles:</p>
<ul>
  <li>Communicate proactively.</li>
  <li>Don't surprise them with bad news.</li>
  <li>Offer alternatives / mitigations.</li>
  <li>Show effort to unblock.</li>
</ul>
`
    },
    {
      id: 'bugs',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Anti-pattern: silent stakeholder management</h3>
<p><strong>Looks like:</strong> Engineer heads-down for weeks; no updates; surfaces with "done" or "not done" only.</p>
<p><strong>Why bad:</strong> Stakeholders fly blind; can't help when you need help; surprised at outcomes.</p>
<p><strong>Fix:</strong> Weekly written status, even when nothing dramatic happened. Predictable rhythm builds trust.</p>

<h3>Anti-pattern: too many channels</h3>
<p><strong>Looks like:</strong> Some updates in Slack DM, some in email, some in meeting notes, some in Jira comments. No canonical source.</p>
<p><strong>Why bad:</strong> Stakeholders ask same questions repeatedly; misalignment; you waste time re-finding things.</p>
<p><strong>Fix:</strong> One canonical doc / dashboard. Other channels link to it. Trains stakeholders to self-serve.</p>

<h3>Anti-pattern: optimistic status</h3>
<p><strong>Looks like:</strong> "🟢 on track" up until the week of slippage. Then suddenly "🔴 delayed by 4 weeks."</p>
<p><strong>Why bad:</strong> Stakeholders learn your green isn't real green. They'll discount future status.</p>
<p><strong>Fix:</strong> Honest yellow. "Yellow because [risk] is open and could push us 1-2 weeks if not resolved by [date]."</p>

<h3>Anti-pattern: tech jargon to non-engineers</h3>
<p><strong>Looks like:</strong> "We're refactoring the state management layer to use a reactive store pattern with selectors..."</p>
<p><strong>Why bad:</strong> PM / exec / marketing don't follow. They tune out or worse, pretend to follow and miss key info.</p>
<p><strong>Fix:</strong> Translate. "We're cleaning up how the app remembers things between screens. Customer-visible benefit: faster, fewer bugs. Eng-internal change."</p>

<h3>Anti-pattern: "the work speaks for itself"</h3>
<p><strong>Looks like:</strong> "If I just do good work, stakeholders will know." Engineer doesn't communicate; assumes recognition.</p>
<p><strong>Why bad:</strong> Stakeholders don't have your context. They literally can't see most of what you do.</p>
<p><strong>Fix:</strong> Communicate work. Not bragging — informing. "Shipped X. Impact Y. Thanks to Z." See <a href="#" data-topic="wp-visibility">Visibility & Self-Promotion</a>.</p>

<h3>Anti-pattern: skipping the PM</h3>
<p><strong>Looks like:</strong> Engineer talks to designer, exec, customer success directly without PM. PM finds out later.</p>
<p><strong>Why bad:</strong> PM's authority undermined. They look uninformed. They become hostile.</p>
<p><strong>Fix:</strong> Loop PM on cross-functional convos. CC them on emails; mention in Slack threads. Default to "would PM want to be in this conversation?" — usually yes.</p>

<h3>Anti-pattern: dumping problems on stakeholders</h3>
<p><strong>Looks like:</strong> "We hit a problem; what should we do?" with no analysis.</p>
<p><strong>Why bad:</strong> Stakeholders aren't engineers; they need your synthesis. Asking them cold makes you look unprepared.</p>
<p><strong>Fix:</strong> Bring options + recommendation. "Hit problem X. Three paths: A, B, C. Recommend B because Y. Need your input on Z."</p>

<h3>Anti-pattern: fishing for approval</h3>
<p><strong>Looks like:</strong> Sending status updates that fish for praise rather than convey signal.</p>
<p><strong>Why bad:</strong> Erodes trust over time. Stakeholders learn updates aren't honest signal.</p>
<p><strong>Fix:</strong> Status updates are factual. Praise / recognition belong in different channels (perf reviews, manager 1:1s, your own reflection).</p>

<h3>Anti-pattern: meetings as status delivery</h3>
<p><strong>Looks like:</strong> 60-min meeting where you walk through what you've been doing.</p>
<p><strong>Why bad:</strong> Bad use of N people's time. Status doesn't need real-time.</p>
<p><strong>Fix:</strong> Async status; meetings reserved for decisions. Convert recurring "status" meetings to written updates.</p>

<h3>Anti-pattern: surprising stakeholders with good news</h3>
<p><strong>Looks like:</strong> Ship something stakeholder didn't know was coming. Even if positive, they're caught off guard.</p>
<p><strong>Why bad:</strong> Same trust issues as bad-news surprises. Stakeholder feels out of the loop.</p>
<p><strong>Fix:</strong> Big launches / changes get pre-communicated even when good. "Heads up — X launches Friday. Here's what to expect."</p>

<h3>Anti-pattern: long pre-reads no one reads</h3>
<p><strong>Looks like:</strong> 15-page design doc sent to 20 people; no one reads it.</p>
<p><strong>Why bad:</strong> Effort wasted. Decisions don't get made because no one read the input.</p>
<p><strong>Fix:</strong> 1-page TL;DR at top with everything important. Detail in appendices for those who want it. Most stakeholders only read the TL;DR.</p>

<h3>Anti-pattern: chasing closure in real-time</h3>
<p><strong>Looks like:</strong> Endless Slack thread trying to get a decision; 50 messages in.</p>
<p><strong>Why bad:</strong> Async tools used for sync work. Energy drain. No closure.</p>
<p><strong>Fix:</strong> If async exceeds 5 round trips without closure, schedule a 15-min sync. End with explicit decision in writing.</p>

<h3>Anti-pattern: complaining about stakeholders behind their back</h3>
<p><strong>Looks like:</strong> Vent to peers / manager about a difficult stakeholder; never raise it directly.</p>
<p><strong>Why bad:</strong> Word gets back. Reputation suffers. Underlying issue stays unfixed.</p>
<p><strong>Fix:</strong> Direct, professional 1:1 conversation. "Want to flag a pattern I'm seeing — when X happens, it makes Y harder. Can we work on it?"</p>

<h3>Anti-pattern: ignoring "low-tier" stakeholders</h3>
<p><strong>Looks like:</strong> Skip security review until day-of. Don't loop a11y team. Forget about i18n.</p>
<p><strong>Why bad:</strong> They become last-minute blockers. Your "low-tier" classification was wrong.</p>
<p><strong>Fix:</strong> Even low-tier stakeholders get pre-engaged for their part. Security review at design freeze, not pre-launch. A11y review with first prototype, not last build.</p>

<h3>Anti-pattern: assuming consensus when there isn't</h3>
<p><strong>Looks like:</strong> Meeting ended with no clear decision; you proceed assuming agreement; stakeholder raises objection later.</p>
<p><strong>Why bad:</strong> Wasted work; politics; relationship damage.</p>
<p><strong>Fix:</strong> Always end discussions with explicit written decision. "Decided X. Owner Y. Date Z. Disagree-and-commit anyone?"</p>

<h3>Anti-pattern: not knowing your DRI / decision-maker</h3>
<p><strong>Looks like:</strong> Multiple people give input; no clear decider; decisions get reopened.</p>
<p><strong>Why bad:</strong> Endless re-litigation; nothing ships; everyone exhausted.</p>
<p><strong>Fix:</strong> Identify A in RACI explicitly. Document. When decisions get reopened: "We decided X with [Y] as decision owner. To reopen, need Y to weigh in."</p>

<h3>Anti-pattern: copy-pasting all stakeholders on everything</h3>
<p><strong>Looks like:</strong> Every email CCs 15 people "to be safe."</p>
<p><strong>Why bad:</strong> Notification fatigue. People stop reading. Real signal lost in noise.</p>
<p><strong>Fix:</strong> Email exactly the people who need to act. CC the people who need to know. BCC if archival but not action. Most things are not for everyone.</p>
`
    },
    {
      id: 'interview',
      title: '🎤 Interview Patterns',
      html: `
<h3>"Tell me about working with cross-functional partners"</h3>
<p>Common at senior+ behavioral. They want: do you collaborate well, or are you a "code monkey" who needs PMs to hold your hand?</p>

<h4>Strong answer template</h4>
<ol>
  <li>Setup: project, team composition.</li>
  <li>Specific challenge: what was hard about the cross-functional dimension.</li>
  <li>Your actions: stakeholder mapping, communication patterns, escalation.</li>
  <li>Result: outcome of project + relationship state.</li>
  <li>Lesson: what you learned about cross-functional work.</li>
</ol>

<pre><code>"On the home-screen redesign project, I was tech lead with three
cross-functional partners — PM, design lead, ML team for
recommendations. Plus stakeholders we needed to engage at points:
privacy, a11y, marketing.

The challenge was alignment. Our first kickoff had everyone agreeing
in the room and disagreeing in private DMs the next day. Classic
politeness-doesn't-equal-alignment problem.

I did three things. First, I built a stakeholder map and tiered
engagement — PM and design got weekly 1:1s; ML and backend got
written async + bi-weekly sync; privacy and a11y got specific
review touch-points. Second, I established a single canonical doc
that I updated weekly with status, risks, decisions. Third, every
decision in a meeting got documented in writing within 24 hours
and circulated for confirmation — no implicit consensus.

Outcome: shipped on date with no surprise blockers. Privacy + a11y
review came back clean because we engaged them early. Director
told my manager 'it was the smoothest cross-functional launch
we've had this year.'

Lesson: alignment is an artifact, not an event. You build it
continuously through written communication, not by having one
good meeting."</code></pre>

<h3>"Tell me about a stakeholder who was difficult"</h3>
<p>They want: can you handle conflict without burning bridges?</p>

<pre><code>"PM on a previous project pushed for daily status updates. After two
weeks, I was spending an hour a day on status. My output was visibly
suffering.

Instead of grumbling or pushing back hard, I framed it as a mutual
problem. In our 1:1: 'Right now I'm spending an hour a day on
status. I think we can do better with less time on both sides —
canonical doc updated continuously, weekly written status, async
in Slack for anything urgent.' Walked through what each would
look like. Asked if they wanted to try it for two weeks.

PM agreed. After two weeks, they preferred the new model — they
could check the doc whenever, knew the rhythm, and didn't feel like
they were losing oversight.

Lesson: stakeholders ask for what they need, not always what works
best. If you push back on the form while honoring the underlying
need, often everyone's better off."</code></pre>

<h3>"How do you communicate with non-technical stakeholders"</h3>
<pre><code>"Translate, don't simplify. The story I tell exec/PM/marketing has
the same depth — different vocabulary.

For example, instead of 'we're refactoring our state management to
reactive selectors,' I say 'we're cleaning up how the app remembers
things between screens — fewer bugs, faster UI, customer-invisible
this quarter.'

Same fact, different surface. The skill is knowing the audience's
mental model and bridging.

Also: I default to writing for non-technical stakeholders.
Spoken explanations get lost; written ones can be re-read."</code></pre>

<h3>"How do you handle a stakeholder who blocks your work"</h3>
<pre><code>"First, understand why. Block could be: legitimate concern, lack of
context, mismatched priorities, personal politics. Different
responses for each.

For legitimate concern: address directly. 'You're worried about X;
here's our mitigation.'
For context: educate. 'Here's the constraint we're working within;
let me walk you through it.'
For priority mismatch: surface upward. Can't resolve at peer level
if leadership hasn't aligned priorities.
For politics: usually loop my manager. Cross-team political issues
are above my pay grade to solve solo.

What I don't do: bulldoze. Even if I 'win' the immediate fight, I
make a future enemy. The relationship matters more than this one
project."</code></pre>

<h3>"How do you give bad news"</h3>
<pre><code>"Lead with the headline, follow with cause + plan. Don't bury bad
news in paragraph 5.

Example template:
'Pushing launch from X to Y. Cause: discovered race condition.
Recovery plan: fix + retest, 2 weeks. Impact on dependents: minor.
What I need from you: confirm new launch is workable.'

That's it. Stakeholders prefer crisp bad news over rambling.

I also share early — as soon as I'm 70% sure something's slipping.
The cost of a false alarm is small; the cost of waiting until
certain is high. Stakeholders need lead time to react."</code></pre>

<h3>"How do you align stakeholders with conflicting priorities"</h3>
<p>Staff+ question. Tests system thinking.</p>
<pre><code>"Three steps:

1. Make conflicts visible. Not 'marketing wants X, eng wants Y' — but
   'shipping Tuesday optimizes for revenue impact $X; shipping Friday
   optimizes for risk avoidance $Y.' Numbers / business value force
   real comparison.

2. Surface to the right altitude. If conflict is between peer-level
   stakeholders, sometimes their managers need to align priorities.
   I don't try to play diplomat for things above my level.

3. Document the decision. Whoever decides — PM, director, joint
   decision — gets logged in writing. Reopens are explicit. No
   one gets to relitigate by saying 'I didn't agree.'

The actual alignment is mostly written. Meetings are for the rare
real-time decisions."</code></pre>

<h3>"Describe a project where stakeholder management was the hardest part"</h3>
<pre><code>"Cross-org platform migration last year. Eng work was tractable.
The hard part was 8 partner teams, each with their own roadmaps,
none of which prioritized our migration.

Stakeholder map: 8 partner team eng leads + 8 PMs + 4 directors
across orgs.

What worked:
- Director-level alignment first. Got our director to brief peer
  directors before I engaged eng leads. Created top-down support.
- Per-team migration plan. Treated each as separate project with
  separate timeline.
- Async-heavy. Doc per team. Weekly digest to all teams. Less
  meeting load on partners.
- Made their life easier. Wrote sample migration code so eng teams
  had less work.
- Visibility. Monthly demo / metrics dashboard so progress was
  social proof.

Outcome: 7 of 8 teams migrated on schedule. Last one was
de-prioritized due to their own reorg; we negotiated a 6-week delay.

Hardest project of my career; gave me a working model for
cross-org stakeholder management."</code></pre>

<h3>Common follow-ups</h3>
<table>
  <thead><tr><th>Question</th><th>What they're checking</th></tr></thead>
  <tbody>
    <tr><td>"How do you decide who's a stakeholder?"</td><td>Whether you have a framework</td></tr>
    <tr><td>"What's a mistake you made with stakeholders?"</td><td>Self-awareness, learning</td></tr>
    <tr><td>"How do you protect engineering time from stakeholder demands?"</td><td>Saying no skills (see <a href="#" data-topic="wp-saying-no">Saying No</a>)</td></tr>
    <tr><td>"What if a stakeholder repeatedly disrespects your time?"</td><td>Conflict handling, manager loop</td></tr>
    <tr><td>"How do you handle disagreement with a PM?"</td><td>Direct, productive disagreement</td></tr>
    <tr><td>"How do you scale this when you have 10 projects?"</td><td>Tier model, async, documentation</td></tr>
  </tbody>
</table>

<h3>The 30-second mantra</h3>
<p><em>"Map stakeholders. Tier the touch. One canonical source. No surprises. Document decisions. Invest hardest in PM and design."</em></p>
<p>Most projects fail at the seams between people, not within the code. Stakeholder management is the work that holds the seams together. It's not overhead — it's the job.</p>
`
    }
  ]
});
