window.PREP_SITE.registerTopic({
  id: 'wp-layoffs',
  module: 'workplace',
  title: 'Layoff Survival & Recovery',
  estimatedReadTime: '40 min',
  tags: ['layoffs', 'rif', 'severance', 'job-search', 'unemployment', 'survivor', 'career', 'tech-cuts'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>Layoffs are no longer rare events; the 2022-2025 cycle made them routine in tech. Whether you're <strong>cut</strong>, <strong>survive</strong>, or <strong>see them coming</strong>, the same operational discipline applies: protect what you can control, take action with cool heads, don't let an event destroy your career or finances. Most layoff outcomes are decided in the weeks <em>before</em> the announcement (financial buffer, network, skills) — not in the panicked weeks after.</p>
<ul>
  <li><strong>Layoffs are usually not about you personally.</strong> They're org / team / cost decisions. Your performance can shift the odds; it rarely overrides the structural decision.</li>
  <li><strong>Three roles in a layoff:</strong> cut, survivor, manager-of-cuts. Each has its own playbook.</li>
  <li><strong>Cut: negotiate severance.</strong> You usually have leverage. The first offer is rarely the best. Get the offer in writing; consult an employment lawyer (1-2 hours, $300-500, well worth it).</li>
  <li><strong>Survivor: recalibrate.</strong> Workload jumps; trust drops; team you knew is gone. Layoff survivors burn out fastest. Treat survival as a stress event.</li>
  <li><strong>Pre-layoff (suspect cuts coming):</strong> 6-month financial buffer; updated resume; warm network; clear story; LinkedIn open to messages.</li>
  <li><strong>Post-cut: take 1-2 weeks before serious job search.</strong> Reset emotionally. Then run the job search as a project, not a panic.</li>
  <li><strong>Severance + reference + unemployment</strong> are negotiable items. Most engineers leave money + protections on the table by accepting first offer.</li>
  <li><strong>Don't burn bridges.</strong> Tech is small; today's manager who cut you may be tomorrow's reference, hiring manager, or peer.</li>
</ul>
<p><strong>Mantra:</strong> "It's not personal; it's structural. Build the buffer before you need it. Negotiate the severance. Take the recovery week. Run job search as a project. Don't burn bridges."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>The 2022-2025 layoff context</h3>
<p>Tech experienced unprecedented layoffs in 2022-2025: ~400K+ tech workers cut in 2022-2023 alone; recurring waves through 2024-2025. Most large-cap tech companies cut at least once; many cut 2-3 times. The "tech immunity" that engineers grew up assuming evaporated.</p>

<p>Specific patterns of this era:</p>
<ul>
  <li><strong>Stack-rank cuts</strong> (often called "performance" but performance only weakly correlated to who got cut).</li>
  <li><strong>Whole-team eliminations</strong> (entire products / orgs sunset).</li>
  <li><strong>"Strategic refocusing"</strong> as cover for cost-cutting.</li>
  <li><strong>Cuts during good earnings</strong> (Wall Street rewards efficiency moves).</li>
  <li><strong>Multi-wave cuts</strong> within the same company within months.</li>
  <li><strong>Visa-holder vulnerabilities</strong> exploited (60-day grace period in US for H-1B).</li>
  <li><strong>Public layoffs via email / Slack</strong> at scale; some without a 1:1.</li>
</ul>

<h3>Why this is its own topic</h3>
<table>
  <thead><tr><th>Reason</th><th>Outcome</th></tr></thead>
  <tbody>
    <tr><td>Layoffs hit ~30-50% of mid-career engineers in 2022-2025</td><td>You're more likely than not to face one in your career</td></tr>
    <tr><td>The first 7 days post-cut shape the next 6 months</td><td>Severance negotiation, paperwork, decisions</td></tr>
    <tr><td>Survivors face their own crisis</td><td>Doubled workload + lost trust + survivor's guilt</td></tr>
    <tr><td>Career narrative around layoff matters</td><td>How you talk about it in interviews shapes outcomes</td></tr>
    <tr><td>Financial decisions cascade for years</td><td>401(k), RSUs, healthcare, insurance — all decisions in days, consequences for years</td></tr>
    <tr><td>Most engineers haven't done this</td><td>Lived experience is scarce; advice from peers patchy</td></tr>
  </tbody>
</table>

<h3>The 3 layoff scenarios</h3>
<table>
  <thead><tr><th>Scenario</th><th>You</th><th>Playbook</th></tr></thead>
  <tbody>
    <tr><td>Cut</td><td>Receive notification</td><td>Negotiate severance; close out paperwork; recover; job search</td></tr>
    <tr><td>Survivor</td><td>Team / function impacted; you stay</td><td>Recalibrate workload; stabilize; decide stay vs go strategically</td></tr>
    <tr><td>Pre-layoff (suspect imminent)</td><td>Signals visible</td><td>Build buffer; update resume; warm network; reduce vulnerability</td></tr>
  </tbody>
</table>

<h3>What "good layoff handling" looks like</h3>
<ul>
  <li>Financial buffer (6 months) built before the layoff.</li>
  <li>Network kept warm via small consistent investment.</li>
  <li>Resume + LinkedIn updated quarterly; never stale.</li>
  <li>If cut: severance negotiated; paperwork reviewed; references locked.</li>
  <li>If cut: 1-2 weeks recovery before serious job search.</li>
  <li>Job search run as a project: pipeline, weekly metrics, defined timeline.</li>
  <li>Healthcare + insurance + retirement + immigration handled deliberately.</li>
  <li>Story for interviews: factual, neutral, not bitter.</li>
  <li>If survivor: explicit conversation with manager about workload + trajectory.</li>
</ul>

<h3>What "bad layoff handling" looks like</h3>
<ul>
  <li>No financial buffer; cut hits like a crisis.</li>
  <li>Network is cold; no recent conversations; cold-applying randomly.</li>
  <li>Stale resume; scrambling to update.</li>
  <li>Accept first severance offer; never negotiate.</li>
  <li>Sign paperwork without legal review.</li>
  <li>Begin job search Day 2 in panic mode.</li>
  <li>Lose healthcare without COBRA or alternatives planned.</li>
  <li>Burn bridges in last days (vent in Slack / email).</li>
  <li>Bitter story in interviews; signals risk to hiring managers.</li>
  <li>If survivor: silently absorb the doubled workload until burnout.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>Pre-layoff signals (suspect cuts coming)</h3>
<table>
  <thead><tr><th>Signal</th><th>Severity</th></tr></thead>
  <tbody>
    <tr><td>Hiring freeze</td><td>Mild — common in cycles</td></tr>
    <tr><td>Recruiting team gets laid off</td><td>Strong — recruiting cuts often precede engineering cuts</td></tr>
    <tr><td>Travel / events / perks cut</td><td>Mild — cost optimization</td></tr>
    <tr><td>Performance management ramping up</td><td>Strong — pre-PIP signals + stack-ranking prep</td></tr>
    <tr><td>Offsite / strategic-review meetings without engineers</td><td>Strong — restructure planning</td></tr>
    <tr><td>Skip-level / VP changes</td><td>Strong — new leader often reshapes team within 6 months</td></tr>
    <tr><td>Org chart consultancy / "transformation" projects</td><td>Strong — usually justifies cuts</td></tr>
    <tr><td>Earnings miss / industry downturn</td><td>Moderate — context matters</td></tr>
    <tr><td>Project / product getting shutdown</td><td>Severe — team typically cut after</td></tr>
    <tr><td>Manager unusually quiet / non-committal</td><td>Strong — they may know but can't say</td></tr>
    <tr><td>Slack rumors</td><td>Variable — usually trail the reality</td></tr>
  </tbody>
</table>

<p>If you see 3+ of these for 4+ weeks: prepare. Doesn't mean you're being cut; means the probability is non-trivial.</p>

<h3>The pre-layoff prep playbook</h3>
<table>
  <thead><tr><th>Activity</th><th>Target</th></tr></thead>
  <tbody>
    <tr><td>Financial buffer</td><td>6 months of expenses in cash / liquid</td></tr>
    <tr><td>Resume</td><td>Updated; impact-framed; 1-page senior format</td></tr>
    <tr><td>LinkedIn</td><td>Profile updated; "open to opportunities" toggle on</td></tr>
    <tr><td>Network</td><td>3-5 conversations / month with peers + recruiters; warm</td></tr>
    <tr><td>Skills</td><td>Honest gap audit — what's stale; brush up</td></tr>
    <tr><td>References</td><td>Identify 3 (current manager, peer, skip-level); confirm informally</td></tr>
    <tr><td>Severance research</td><td>Know your company's typical severance package; lawyer consultation if uncertain</td></tr>
    <tr><td>Visa status (if applicable)</td><td>Know your grace period + transfer options; consult immigration lawyer if needed</td></tr>
    <tr><td>Healthcare</td><td>Understand COBRA + marketplace alternatives; budget for them</td></tr>
    <tr><td>Equity / RSU</td><td>Know vesting schedule; understand what's at risk</td></tr>
  </tbody>
</table>

<h3>The cut-day playbook</h3>
<p>You receive notification. The first 24-48 hours:</p>
<ol>
  <li><strong>Pause.</strong> Don't sign anything. Don't accept verbally. "I appreciate the news; I'd like to take 24-48 hours to review."</li>
  <li><strong>Get the documents.</strong> Severance offer; separation agreement; all paperwork. In writing.</li>
  <li><strong>Don't immediately accept severance terms.</strong> They're often negotiable.</li>
  <li><strong>Don't badmouth in writing.</strong> Email; Slack; LinkedIn. Anywhere.</li>
  <li><strong>Make a list of what you need:</strong> personal files; contacts; references; any legitimately yours.</li>
  <li><strong>If the company is doing exit interviews / asks for cooperation:</strong> negotiate. Cooperation is leverage.</li>
</ol>

<h3>Severance negotiation</h3>
<p>Most severance offers are negotiable. Common levers:</p>
<table>
  <thead><tr><th>Lever</th><th>Asking</th></tr></thead>
  <tbody>
    <tr><td>Length</td><td>Standard offer is often 1-2 weeks per year of tenure; you can sometimes push to 4+ weeks per year</td></tr>
    <tr><td>Healthcare extension</td><td>Company-paid COBRA for 3-6 months</td></tr>
    <tr><td>Vesting acceleration</td><td>Cliff vests near; ask for vesting through next cliff date</td></tr>
    <tr><td>Outplacement services</td><td>Career coaching, resume help — often standard, sometimes negotiable to extend</td></tr>
    <tr><td>Bonus pro-ration</td><td>Pro-rated annual bonus through cut date</td></tr>
    <tr><td>Reference / recommendation</td><td>Specific written recommendation in addition to "neutral reference" default</td></tr>
    <tr><td>Mutual agreement / non-disparagement</td><td>You can sometimes negotiate clauses you find onerous out</td></tr>
  </tbody>
</table>

<p>How to negotiate:</p>
<ul>
  <li><strong>Do not threaten.</strong> Negotiate professionally. "I'd like to discuss the severance terms; I have a few asks."</li>
  <li><strong>Anchor high.</strong> Ask for more than you expect.</li>
  <li><strong>Provide rationale.</strong> "I've been here 5 years; the standard is 1 week per year; my ask is 2 weeks per year given the impact on my immigration timeline / my role's seniority."</li>
  <li><strong>Get it in writing.</strong> Verbal commitments evaporate.</li>
  <li><strong>Consult a lawyer.</strong> 1-2 hours, $300-500. They'll catch clauses (non-compete, non-solicit, mutual non-disparagement, IP claims) that may matter for years.</li>
</ul>

<h3>The 7-day post-cut plan</h3>
<table>
  <thead><tr><th>Day</th><th>Activity</th></tr></thead>
  <tbody>
    <tr><td>Day 1</td><td>Receive notification. Pause. Don't sign. Don't post.</td></tr>
    <tr><td>Day 2</td><td>Read all documents. Note negotiable items. Schedule lawyer consult.</td></tr>
    <tr><td>Day 3</td><td>Lawyer consult. Identify negotiation asks.</td></tr>
    <tr><td>Day 4</td><td>Send negotiation email; get response timing.</td></tr>
    <tr><td>Day 5-6</td><td>Receive negotiation response; sign final docs.</td></tr>
    <tr><td>Day 7+</td><td>Take 1-2 weeks of recovery. Don't job-search yet.</td></tr>
  </tbody>
</table>

<h3>The recovery week (or two)</h3>
<p>The temptation: start job search day 1. The trap: job search from a panicked state produces bad outcomes — hasty applications, poor interview performance, accepting suboptimal offers.</p>

<p>The recovery week is operational:</p>
<ul>
  <li>Sleep + exercise + hobbies first.</li>
  <li>Talk to family + close friends. Process emotionally.</li>
  <li>Tell your story to 2-3 trusted ears; refine the narrative.</li>
  <li>Start the financial calculations: runway, expenses, lifestyle adjustments.</li>
  <li>Update LinkedIn (basic update; deeper later).</li>
  <li>Tell your network you're open. Short messages, not long laments.</li>
  <li>Then — and only then — start the structured job search.</li>
</ul>

<h3>The job-search-as-project model</h3>
<table>
  <thead><tr><th>Activity</th><th>Cadence</th></tr></thead>
  <tbody>
    <tr><td>Pipeline targets</td><td>5-10 active processes at peak</td></tr>
    <tr><td>Outreach</td><td>3-5 per day; mix recruiters, peers, hiring managers</td></tr>
    <tr><td>Applications</td><td>Quality &gt; quantity; targeted</td></tr>
    <tr><td>Interviews</td><td>Schedule 2-4 per week max; protect prep time</td></tr>
    <tr><td>Prep blocks</td><td>2-3 hours per role before each interview</td></tr>
    <tr><td>Weekly review</td><td>Pipeline status, what's working, what's not, next week's plan</td></tr>
    <tr><td>Recovery</td><td>1-2 days off per week; sustainable cadence</td></tr>
  </tbody>
</table>

<p>Treat it as a project: defined hours, defined output, weekly retros. Avoid the "wake up, send 30 cold applications, feel terrible by 2 PM" pattern.</p>

<h3>The interview narrative for layoffs</h3>
<p>Hiring managers will ask about the layoff. Pattern:</p>
<pre><code class="language-text">"My team was impacted in [Month] as part of [Company]'s
restructuring. Specifically, [team / org] was sunset / merged
/ reduced. The decision was structural — not performance-based.

I'm using the time to [recover briefly] / [look at next move
deliberately]. I'm specifically interested in [type of role]
because [genuine reason]."

[1-2 sentences. Factual. Neutral. No bitterness. Move on to
the substance.]
</code></pre>

<p>Wrong: "They cut me even though I was top performer; the management was incompetent." Right: factual + brief + redirect to the future.</p>

<h3>Survivor playbook</h3>
<p>You weren't cut; the team was. Now:</p>
<ul>
  <li>Workload spike: portion of the cut team's work falls on you.</li>
  <li>Trust drop: leadership credibility hit; manager may be stressed.</li>
  <li>Survivor's guilt: relief mixed with sadness for cut colleagues.</li>
  <li>Increased anxiety about next round.</li>
  <li>Cynicism risk: "this place doesn't care about people."</li>
</ul>

<p>Playbook:</p>
<ol>
  <li><strong>Process the emotion.</strong> 1-2 days off if possible; reach out to cut colleagues with kindness.</li>
  <li><strong>Manage workload explicitly:</strong> "I can absorb X but not Y; what gets cut?" Don't silently absorb.</li>
  <li><strong>Re-evaluate stay vs go:</strong> not in panic; deliberately. The remaining role may be different from the role you signed up for.</li>
  <li><strong>Renegotiate scope / comp if appropriate:</strong> "I'm absorbing X new responsibilities; this is a different role; can we discuss compensation alignment?"</li>
  <li><strong>Build buffer:</strong> the next cut may include you; don't be unprepared.</li>
  <li><strong>Stay or go:</strong> some people stay through multiple waves; others use the first as their cue. Both are valid.</li>
</ol>

<h3>Manager doing the cuts</h3>
<p>If you're managing through layoffs (less common in this prep audience but worth knowing):</p>
<ul>
  <li>You usually don't choose who. The list comes from above.</li>
  <li>You execute the conversation. Specific, direct, kind.</li>
  <li>Process publicly: tell remaining team; address questions; show humanity.</li>
  <li>Help cut engineers: references, intros, keep door open.</li>
  <li>Recovery: managers carry significant trauma after layoffs; therapy, peer support.</li>
</ul>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>The financial buffer: how much, how to build</h3>
<table>
  <thead><tr><th>Buffer level</th><th>Months of expenses</th><th>What it buys you</th></tr></thead>
  <tbody>
    <tr><td>Minimum</td><td>3 months</td><td>Survival; pressure to take any job</td></tr>
    <tr><td>Standard</td><td>6 months</td><td>Time to find right job; negotiate; reset</td></tr>
    <tr><td>Strong</td><td>9-12 months</td><td>Real choice; sabbatical option; lifestyle continuity</td></tr>
    <tr><td>Exceptional</td><td>18+ months</td><td>Career pivot possible; fund retraining</td></tr>
  </tbody>
</table>

<p>Calculate your monthly expenses honestly (housing, food, healthcare, transportation, debt minimums, dependents). Multiply.</p>

<p>Building it:</p>
<ul>
  <li>Direct from comp: 10-20% saved aggressively until target.</li>
  <li>Bonus / RSU vests: large portion to buffer (not lifestyle creep).</li>
  <li>Liquid / accessible: savings, money market, treasuries — not 401(k) (penalties).</li>
  <li>Track separately: don't blur with general savings.</li>
</ul>

<h3>Network maintenance (low-effort, high-leverage)</h3>
<p>Most engineers neglect this until they need it. By then it's cold.</p>

<table>
  <thead><tr><th>Activity</th><th>Cadence</th></tr></thead>
  <tbody>
    <tr><td>Coffee / catch-up with old colleague</td><td>1-2 / month</td></tr>
    <tr><td>LinkedIn note to ex-coworker who moved</td><td>1 / month</td></tr>
    <tr><td>Recruiter conversation (even when not looking)</td><td>1 / month</td></tr>
    <tr><td>Conference / meetup attendance</td><td>1-2 / year</td></tr>
    <tr><td>Open-source contribution</td><td>Steady; visibility</td></tr>
    <tr><td>Tech-related side project / writing</td><td>Sporadic; signal</td></tr>
    <tr><td>Helping recruit for current company</td><td>Builds reciprocity</td></tr>
    <tr><td>Mentoring junior engineers (in + out of company)</td><td>1-2 / quarter; signal + relationship</td></tr>
  </tbody>
</table>

<p>The network you call when you need a job is not the one you build in 2 weeks; it's the one you build over years.</p>

<h3>Resume + LinkedIn — pre-layoff readiness</h3>
<p>Should always be current. Refresh quarterly:</p>
<ul>
  <li>Latest projects added with impact (numbers).</li>
  <li>Latest title / scope reflected.</li>
  <li>Skills updated.</li>
  <li>Senior format: 1 page if &lt;15 years; 2 pages max.</li>
  <li>"Open to opportunities" toggle on (recruiters can see; coworkers cannot).</li>
</ul>

<p>The week of a layoff is not when to update them.</p>

<h3>The lawyer consultation (worth every dollar)</h3>
<p>Find an employment lawyer who works with tech employees. Cost: $300-500 for 1-hour consultation. What they review:</p>
<ul>
  <li>Severance offer adequacy vs market norms for your role.</li>
  <li>Non-compete clauses (some states unenforceable; others crushing).</li>
  <li>Non-solicit (impacts your future hiring).</li>
  <li>IP / patent assignment language.</li>
  <li>Mutual non-disparagement (vs one-sided).</li>
  <li>Release of claims (giving up rights).</li>
  <li>State-specific employment protections.</li>
  <li>Visa-specific implications.</li>
  <li>Negotiation strategy.</li>
</ul>

<p>Most engineers skip this and lose more value than the consultation cost.</p>

<h3>Severance negotiation email template</h3>
<pre><code class="language-text">Subject: Severance discussion — [Your Name]

Hi [HR Contact / Manager],

Thank you for the [Date] notification. I've reviewed the severance
offer and I'd like to discuss a few items before signing.

1. **Severance length:** The offer is [X weeks]. Given my [N years]
   of tenure and the senior nature of my role, I'd ask for [Y weeks].

2. **Healthcare:** I'd ask for [N months] of company-paid COBRA
   given the medical issues / dependents in my situation.

3. **RSU vesting:** My next vest is [date]. I'd ask for vesting
   to continue through [date] given the timing of the layoff
   relative to the cliff.

4. **Reference:** I'd value a written recommendation from [manager
   name] in addition to the standard reference policy.

I appreciate your consideration of these items. I'd like to finalize
within [3-5 business days]. Happy to discuss on a call if helpful.

Thanks,
[Name]
</code></pre>

<p>Specific. Reasoned. Professional. Sent in writing for paper trail.</p>

<h3>Healthcare options post-layoff (US-centric)</h3>
<table>
  <thead><tr><th>Option</th><th>Tradeoffs</th></tr></thead>
  <tbody>
    <tr><td>COBRA (continue current)</td><td>Same coverage; you pay full premium (often $600-2000/mo for family); 18-month max; quick to start</td></tr>
    <tr><td>Marketplace (ACA)</td><td>Often cheaper; subsidies based on income (which dropped); plans vary</td></tr>
    <tr><td>Spouse / partner's plan</td><td>If available, often easiest + cheapest</td></tr>
    <tr><td>Short-term plans</td><td>Cheap but limited coverage; risky for chronic conditions</td></tr>
    <tr><td>Health share ministries</td><td>Cheap; not insurance technically; controversial</td></tr>
  </tbody>
</table>

<p>Don't let healthcare lapse. The day-of-cut: confirm last day of coverage; have plan B.</p>

<h3>Visa considerations (US H-1B specifically)</h3>
<ul>
  <li>60-day grace period from termination to find new sponsor / change status.</li>
  <li>Includes weekends; clock starts day of last paycheck.</li>
  <li>If unfound: leave US or change to dependent / student status.</li>
  <li>Severance can extend pay but doesn't extend grace period.</li>
  <li>Consult immigration lawyer immediately — same day if possible.</li>
  <li>Some companies offer immigration support post-layoff (negotiable).</li>
</ul>

<p>If on visa: pre-layoff prep matters extra. Buffer + network + applied warm leads before the cut.</p>

<h3>The interview narrative refinement</h3>
<p>Practice the layoff explanation aloud 5-10 times. Refine until:</p>
<ul>
  <li>Under 30 seconds.</li>
  <li>Factual, not emotional.</li>
  <li>No naming names of bad managers / colleagues.</li>
  <li>No "the company was bad" framing.</li>
  <li>Forward-looking: what you're seeking now.</li>
  <li>Honest about timeline (don't lie about cut dates; HR teams talk).</li>
</ul>

<h3>The recovery rituals</h3>
<table>
  <thead><tr><th>Phase</th><th>Activities</th></tr></thead>
  <tbody>
    <tr><td>Days 1-7</td><td>Process. Sleep. Exercise. Family. Don't apply yet.</td></tr>
    <tr><td>Days 7-14</td><td>Update materials. Tell network you're looking. Get warm intros.</td></tr>
    <tr><td>Weeks 3-8</td><td>Active interviewing. 2-4 per week. Weekly retros.</td></tr>
    <tr><td>Weeks 8-12</td><td>Offers + decisions. Negotiate.</td></tr>
    <tr><td>Throughout</td><td>Therapy / EAP if available. Honest conversations with partner about runway. Lifestyle adjustments if needed.</td></tr>
  </tbody>
</table>

<h3>Survivor: workload conversation with manager</h3>
<pre><code class="language-text">"Want to talk about workload after the cuts.

Before: I was on Project X (15 hrs/wk) + Project Y (20 hrs/wk).
Sustainable.

After: with [cut colleague] gone, I've inherited Z (estimated
15 hrs/wk). That puts me at 50 hrs/wk steady-state. Not
sustainable for &gt; 1 quarter.

Three options:

A. Defer / cut: drop Project Y; keep X + Z.
B. Hire backfill: how soon could we hire?
C. Distribute: split Z across remaining team.

I'd lean A — Y is less critical. Will need to communicate to
[stakeholders] about deprioritization.

What's your read?"
</code></pre>

<p>Make the structural impact of the cut visible. Don't silently absorb.</p>

<h3>Survivor: stay-or-go calculus</h3>
<table>
  <thead><tr><th>Stay if</th><th>Go if</th></tr></thead>
  <tbody>
    <tr><td>Workload renegotiated; sustainable</td><td>Workload doubled; manager dismissive</td></tr>
    <tr><td>Comp / role adjusted to match new responsibilities</td><td>Comp + role unchanged; you're a bargain</td></tr>
    <tr><td>Trust in leadership intact / repaired</td><td>Repeated layoffs; visible chaos</td></tr>
    <tr><td>Career trajectory still on path</td><td>Promo path closed; project area shutdown</td></tr>
    <tr><td>Vesting cliff / RSU near</td><td>No equity value; cash comp + market match</td></tr>
    <tr><td>Personal stability matters now</td><td>Risk tolerance + market opportunity high</td></tr>
  </tbody>
</table>

<p>"Stay" doesn't mean forever; it means stay deliberately while you make a long-term plan. "Go" doesn't mean immediately; it means start the search and choose the right next step.</p>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Pre-layoff prep (signs visible 6 weeks ago)</h3>
<pre><code class="language-text">Engineer notices: hiring freeze announced; recruiter team
laid off; offsite excluded engineers; manager's been quiet;
Slack rumors.

Probability of cut: ~30%. Action plan over 6 weeks:

Week 1-2:
- Audit financial buffer: 4 months in cash. Need 6. Stop
  RSU lifestyle creep; redirect cash to buffer.
- Update resume: 2 hours; impact + numbers; recent projects.
- LinkedIn: profile updated; toggle "open to opportunities."

Week 3-4:
- Outreach: 3 ex-coworkers ("how's [their company]? would
  love to catch up"). 2 recruiters who pinged in past 6 months
  ("happy to chat if relevant fit comes up").
- Check H-1B status (if applicable); know grace period mechanics.
- Read about COBRA + marketplace alternatives in advance.

Week 5-6:
- Identify 3 references; informally confirm willingness.
- Save personal files / contacts (legitimately; nothing IP).
- Take stock of skills: anything stale? Brush up on what
  external interviews would test.
- Write out the "if cut" interview narrative; practice 3x.

Outcome (week 7): not cut. Buffer is 6 months. Network warm.
Resume current. Ready if it happens; better positioned even
if it doesn't.
</code></pre>

<h3>Example 2: Day-of-cut handling</h3>
<pre><code class="language-text">Tuesday 10 AM: calendar invite "30 min discussion." Walks in;
HR + manager + severance documents.

Engineer (calmly): "I appreciate you telling me directly.
Let me take a few minutes to absorb. Can I take 24-48 hours
to review the documents before signing?"

Manager: "Yes. We'd like to finalize by Friday."

Engineer: "Understood. I'll be back to you by Thursday."

[Doesn't sign anything. Doesn't send angry email. Doesn't
post on LinkedIn.]

Tuesday afternoon:
- Read all docs carefully. Note: 2 weeks per year of tenure
  (8 weeks for 4-year tenure). COBRA paid for 1 month.
  Standard non-compete; 12-month non-solicit.
- Schedule lawyer consult Wednesday morning.
- Tell partner / family.

Wednesday morning lawyer consult ($400):
- Lawyer: "Severance is on the low end of market. Aim for 12
  weeks. COBRA: ask for 3 months. The non-compete is unenforceable
  in California — irrelevant. Non-solicit is enforceable; OK.
  No major flags otherwise."

Wednesday afternoon: send negotiation email.
- Ask: 12 weeks (was 8). 3 months COBRA (was 1). Written
  reference letter from manager.

Friday: company comes back. Counter: 10 weeks. 2 months COBRA.
Reference letter agreed.

Engineer: accepts. Signs Friday. Last day Friday.

Result: $4500 more in severance. 1 extra month healthcare.
Written reference (which actually matters in subsequent
interviews). All from a $400 lawyer call + a 24-hour pause.
</code></pre>

<h3>Example 3: 7-day post-cut</h3>
<pre><code class="language-text">Day 1 (Friday — last day):
- Sign final docs.
- Hand off transition cleanly. Don't burn bridges.
- Personal files saved (legitimately).
- Brief team. Don't dramatize.

Day 2 (Saturday):
- Sleep in. Walk. Dinner with partner. No laptop.

Day 3-7 (Sunday - Thursday):
- Process. Talk to friends + family. Honest with myself
  about how I'm feeling.
- Cancel weekly subscriptions / reduce expenses for runway.
- Apply for unemployment (if eligible).
- File COBRA paperwork or marketplace plan.
- LinkedIn update: title change to "open to opportunities";
  no melodrama; brief post: "After 4 great years at [company],
  my role was impacted by recent restructuring. Looking for
  my next senior IC role in [domain]; happy to connect."

Day 8 (next Friday):
- Coffee with old colleague (catch-up + soft ask for intros).
- Send 5 messages: 3 to ex-coworkers at target companies;
  2 to recruiters who pinged before.
- Open job-search project doc; track pipeline + retro.

Days 9-14: warm conversations. No active applications yet.
Setting up the network's awareness. Building target list.

Week 3+: applications start. Pipeline 5-8 active processes.
</code></pre>

<h3>Example 4: Weekly job-search retro</h3>
<pre><code class="language-text"># Week 4 retro

## Pipeline status
- Stripe: phone screen done; on-site next week
- Anthropic: applied; recruiter call scheduled
- Datadog: phone screen this week
- DoorDash: rejected (no feedback given)
- Linear: passed phone; on-site this week
- Vercel: applied; no response yet

## What worked this week
- Warm intro from [ex-coworker] to Linear hiring manager —
  fastest path; in 2 days.
- Practiced system design for 5 hrs; the Linear screen went well.

## What didn't
- Cold-applied to 6 unicorns; 0 responses.
- Behavioral round at DoorDash: they asked about layoff; I
  rambled. Need to tighten the narrative.

## Decisions
- Drop cold applications; they're net-negative on time.
- Refine layoff narrative; practice with [friend] before next
  behavioral round.
- Add 2 more warm intros via [other ex-coworker].

## Next week
- Stripe on-site (Wednesday).
- Linear on-site (Thursday).
- Datadog phone (Tuesday).
- Anthropic recruiter (Monday).
- 2 hrs system design prep (Sunday).
- 1 day off (Saturday).
</code></pre>

<p>Run as a project. Weekly review. Adjust based on signal.</p>

<h3>Example 5: The interview "what happened" answer</h3>
<pre><code class="language-text">Interviewer: "Why are you looking for a new role?"

Engineer: "My team was impacted in [Month]'s restructuring at
[Company]. The mobile platform org was reorganized; about 40%
of the team was reduced. The decision was structural — we'd
been part of an exploratory product area that the company
decided to sunset.

I'm taking the chance to look deliberately at next moves. I'm
specifically interested in roles where I can lead RN
architecture — that's where I've spent the last 3 years and
where I'd want to deepen.

Happy to dive into the work I shipped at [Company] if helpful."

[30 seconds. Factual. Forward-looking. Redirects to substance.]

Interviewer: "Got it. Tell me about the most impactful thing
you shipped there."

[And the conversation moves to the work.]
</code></pre>

<h3>Example 6: Survivor renegotiating workload</h3>
<pre><code class="language-text">[After 30% cut to mobile team. Engineer survived; absorbing
2 cut colleagues' projects.]

In 1:1 with manager:

Engineer: "Want to talk about the post-cut workload.

Before:
- Project A (my main): 25 hrs/wk
- Project B (secondary): 12 hrs/wk
- On-call rotation: 1 in 4 weeks

After:
- Project A: 25 hrs/wk
- Project B: 12 hrs/wk
- + Project C (from [cut colleague]): 18 hrs/wk
- On-call rotation: now 1 in 2 weeks

Total: 55 hrs/wk steady-state. Not sustainable.

Three options:
A. Cut Project B. Keep A + C.
B. Backfill: hire to absorb C. 12-week ramp.
C. Distribute C across other senior engineers.

I lean A. B is fine if the timing works. C is hard given
others are also stretched.

Also: with C added, my role is now bigger than my title.
Want to flag we should re-evaluate level + comp at next
cycle.

What's your read?"

Manager: "Let's go A. Communicate to [B's stakeholders]
this week. On comp / level — yes, valid; let's agenda
that for next 1:1."

[Silence-absorbing avoided. Workload renegotiated.
Comp conversation queued. Survivor avoids burning out.]
</code></pre>

<h3>Example 7: Survivor stay-or-go decision</h3>
<pre><code class="language-text">Engineer survived 2 layoff waves over 6 months. Workload
manageable but trust in leadership shaken. Considers leaving.

Stay-or-go matrix:

Stay favors:
- Comp is competitive ($400K total)
- Vesting cliff in 4 months ($150K at risk if leave early)
- Project area still has clear value
- Manager renegotiated workload
- Personal life = stable; partner's job stable; kid in school
- Healthcare strong

Go favors:
- 2 layoffs in 6 months — third is plausible
- Lost most of senior peers; team is junior now
- Skip-level changed twice; strategic direction unclear
- Promo trajectory unclear post-cut
- Market is mixed; fewer opportunities than 18 months ago

Decision: stay through vest cliff (4 months). Quietly run
job search in parallel during that period. After cliff,
either renew commitment or have offer in hand. Worst case:
leave on schedule with vested equity + mature search.

Outcome: at month 5, accepts offer at smaller-but-stable
company. Equity vested. Healthy transition.
</code></pre>

<h3>Example 8: Visa-holder rapid response</h3>
<pre><code class="language-text">[H-1B holder; cut Tuesday; 60-day grace period starts.]

Tuesday afternoon:
- Lawyer consult ($500). Confirms 60-day clock; transfer
  options; H-4 spouse status as backup.

Wednesday:
- LinkedIn post (calm, factual).
- Send 20+ outreach messages to ex-coworkers at companies
  that sponsor H-1B.
- Attend 1 in-person meetup (visibility).

Days 3-7:
- 5 phone screens scheduled.
- Talked to immigration lawyer about transfer process; 1-2
  weeks typical.
- Plan B: enroll in master's program (F-1) for backup status.

Days 8-21:
- Active interviewing. 3-4 per week.
- 2 offers within 30 days.
- Negotiated start date to maximize transfer process.

Day 45:
- New role started; H-1B transfer in process; counsel filed.

Outcome: stayed in US; new role; only 2 weeks of unemployment;
network was the key (warm intros bypass the long cold-application
funnels).

Note: this only worked because pre-cut, the engineer had:
- 6-month buffer (in case of failed search).
- Updated LinkedIn + resume.
- Warm network.
- Lawyer relationships.

Doing this from scratch in 60 days is high-risk.
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>"Performance-based" cut that's actually structural</h3>
<ul>
  <li>Many layoffs are framed as performance to reduce severance + WARN-Act exposure.</li>
  <li>Reality: real performance issues should have been managed via PIP, not layoff.</li>
  <li>Mitigation: ask for the specific performance reasons in writing. If they're vague, push back. The framing affects unemployment + future interviews.</li>
</ul>

<h3>Layoff while you're on PIP</h3>
<ul>
  <li>If on PIP and laid off: the PIP "concludes" without resolution.</li>
  <li>Severance may be reduced ("performance termination").</li>
  <li>Lawyer up: this is the highest-leverage situation for legal review.</li>
  <li>Sometimes companies prefer to convert PIP to layoff (cleaner termination); negotiate severance terms accordingly.</li>
</ul>

<h3>Layoff during medical leave / FMLA / pregnancy</h3>
<ul>
  <li>Federally protected categories: extra legal protections.</li>
  <li>Lawyer immediately. Document everything.</li>
  <li>Companies sometimes "include" protected workers in layoffs hoping they won't push back; pushback often gets significant settlement.</li>
</ul>

<h3>Severance ties to non-compete / non-solicit</h3>
<ul>
  <li>Some severance offers tie payment to ongoing non-compete (often 6-12 months).</li>
  <li>If your next role pays much higher than the severance, the non-compete is more valuable to negotiate down.</li>
  <li>State law varies wildly: California unenforceable; Texas strict; varies for tech roles specifically.</li>
  <li>Lawyer guidance is critical here.</li>
</ul>

<h3>Multiple cuts in same year</h3>
<ul>
  <li>Some companies cut twice per year in this era.</li>
  <li>If you survived round 1, your probability for round 2 may be elevated (e.g., your team got partially cut; remaining members evaluated).</li>
  <li>Don't assume "I'm safe now." Probability resets every cycle.</li>
</ul>

<h3>Cut while interviewing elsewhere</h3>
<ul>
  <li>You were planning to leave anyway; cut accelerates timeline.</li>
  <li>Severance is now applicable (vs nothing if you'd resigned).</li>
  <li>Negotiate as if cut; sign severance; finalize new role.</li>
  <li>Don't tell the new role about the layoff before offer signed (may affect their offer); afterward, factual is fine.</li>
</ul>

<h3>"We'll bring you back when things stabilize"</h3>
<ul>
  <li>Vague promises about rehiring rarely materialize.</li>
  <li>Treat the cut as final; don't wait around for the rehire.</li>
  <li>If they do reach out 6 months later: evaluate as a new job offer; don't return out of loyalty.</li>
</ul>

<h3>Equity / RSU complications</h3>
<ul>
  <li>Vested RSUs are yours (already paid in stock).</li>
  <li>Unvested RSUs typically forfeit.</li>
  <li>Negotiate: vesting acceleration to next cliff (e.g., 6-month cliff in 2 months; ask for "vesting through next cliff").</li>
  <li>Some companies have "good leaver" clauses that accelerate; check specifically.</li>
  <li>Stock options: typically 90 days to exercise after termination (this can require significant cash); some companies extend. Negotiate.</li>
</ul>

<h3>The "garden leave" vs immediate termination</h3>
<ul>
  <li>Some severance is "garden leave" — you remain on payroll but can't work; can't accept other employment.</li>
  <li>Pros: continued income; sometimes continued benefits.</li>
  <li>Cons: can't start new role until garden leave ends; can be 1-3 months.</li>
  <li>Negotiate: "I'd prefer immediate termination + lump sum severance" — especially if you have a fast next role.</li>
</ul>

<h3>Career narrative when you've been cut multiple times</h3>
<ul>
  <li>3 layoffs in 4 years can read poorly; even if not your fault.</li>
  <li>Mitigation: pick longer-tenure stories to lead; emphasize structural factors; have a coherent throughline.</li>
  <li>Consider focusing on stable companies for next role; recruiters notice patterns.</li>
</ul>

<h3>Older engineers facing layoffs</h3>
<ul>
  <li>Age discrimination is real even in tech (especially after ~50).</li>
  <li>Mitigation: emphasize current skills + recent projects; don't lead with "20 years experience" (signals "expensive + outdated").</li>
  <li>Network harder; warm intros bypass age-biased screening.</li>
  <li>Some shift to contracting / fractional CTO / advisor roles; less age-sensitive.</li>
</ul>

<h3>Layoff during personal crisis (illness, divorce, etc.)</h3>
<ul>
  <li>Compounds an already-bad situation.</li>
  <li>Get professional support: therapist, financial advisor, lawyer.</li>
  <li>If financial buffer is short: prioritize income > optimal-fit job; take any reasonable role; reset later.</li>
  <li>Be kind to yourself; the bandwidth for optimal decision-making is reduced.</li>
</ul>

<h3>Mobile / RN-specific dynamics</h3>
<ul>
  <li>Mobile teams often disproportionately impacted in cross-platform companies' "platform consolidation" cuts.</li>
  <li>Justification: "we'll just have web team build with React Native" or "we'll outsource mobile."</li>
  <li>Mitigation: specialize in cross-platform architecture (more durable than pure-iOS / pure-Android); maintain web-adjacent skills.</li>
  <li>Recovery: RN engineers can pivot to web React relatively quickly; broader skill base.</li>
</ul>

<h3>Geographic / immigration complications (India + other origins)</h3>
<ul>
  <li>Indian-origin engineers on H-1B in US: 60-day clock pressures; transfer essential.</li>
  <li>Indian-origin engineers in India layoffs: severance norms differ; less protection generally.</li>
  <li>Returning to India after US tenure: skills + comp generally translate well to senior roles.</li>
  <li>EU layoffs (especially Germany, France): much stronger employee protections; often higher severance + longer notice.</li>
</ul>

<h3>The "I want to take a break" decision</h3>
<ul>
  <li>If financial buffer permits, taking 3-6 months off after a layoff is valid.</li>
  <li>Recovery; travel; project; therapy; family time.</li>
  <li>Concern: longer gaps look worse on resumes. 6 months is fine; 12+ raises questions.</li>
  <li>If you take a break: have a coherent story ("recovering from burnout" / "took the time to skill up on X" / "family obligation"). Be honest in interviews.</li>
</ul>

<h3>Re-applying to former employer</h3>
<ul>
  <li>Some companies have "rehire eligibility" categories.</li>
  <li>If laid off "in good standing": you're often rehirable.</li>
  <li>If terminated for cause: typically not rehirable.</li>
  <li>Layoff usually = "in good standing"; clarify in writing if it matters.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common layoff mistakes</h3>
<ol>
  <li><strong>No financial buffer.</strong> Cut hits like crisis; forces bad decisions.</li>
  <li><strong>Cold network.</strong> Cold-applying when warm intros would 10× your hit rate.</li>
  <li><strong>Stale resume.</strong> Day-of update is panic; quarterly refresh prevents.</li>
  <li><strong>Signing severance immediately.</strong> Negotiable in nearly all cases.</li>
  <li><strong>Skipping lawyer review.</strong> $400 saves thousands.</li>
  <li><strong>Burning bridges day-of.</strong> Tech is small; today's manager = tomorrow's reference.</li>
  <li><strong>Posting bitter on LinkedIn.</strong> Signals risk to future hiring managers.</li>
  <li><strong>Job-searching from panic.</strong> Bad applications; weak interviews; suboptimal offers.</li>
  <li><strong>Ignoring healthcare gap.</strong> Coverage lapses; medical issue compounds crisis.</li>
  <li><strong>Visa-holder unprepared.</strong> 60-day clock; no transfer pipeline.</li>
  <li><strong>Survivor silently absorbing 2× workload.</strong> Burnout next; treating cut as "I'm OK now."</li>
  <li><strong>Bitter interview narrative.</strong> Hiring managers hear it; risk signal; offers go elsewhere.</li>
</ol>

<h3>Anti-pattern: signing immediately</h3>
<pre><code class="language-text">// BAD
HR: "Here's the severance offer; please sign."
You: "OK." [signs on the spot]

// GOOD
HR: "Here's the severance offer."
You: "I appreciate this. I'd like to take 24-48 hours to review
before signing. I'll get back to you by [day]."

[24-hour pause = lawyer time + negotiation prep + clearer head]
</code></pre>

<h3>Anti-pattern: burning bridges</h3>
<pre><code class="language-text">// BAD — last-day Slack message
"After 4 years of dedication, I was let go in a callous mass
email. The leadership at this company is incompetent. To my
former colleagues: get out while you can."

[Result: blocks future references, blocks future hiring at
the company, alienates ex-coworkers who could be intros,
makes you look unprofessional in any interview where someone
asks "how did your last role end?"]

// GOOD — dignified close
"After 4 great years at [Company], my role is being impacted
by recent restructuring. To my colleagues — thank you for the
collaboration; I've learned a lot. Excited to find my next
chapter. Reach out anytime."

[Result: bridges intact. Network active. Optionality preserved.]
</code></pre>

<h3>Anti-pattern: panic application spree</h3>
<pre><code class="language-text">// BAD
[Day after cut: 50 generic applications. 0 customization.
Same generic resume to all. Most rejected by ATS / recruiter.
Demoralizing. Self-esteem crash.]

// GOOD
[Days 1-7: recovery; no applications.
Days 8-14: warm conversations; intros; targeted outreach.
Day 14+: 5-10 quality targeted applications per week with
customized messaging + warm intros where possible.]

[Result: better hit rate; sustainable energy; better offers.]
</code></pre>

<h3>Anti-pattern: bitter interview narrative</h3>
<pre><code class="language-text">// BAD — 3 minutes of bitterness
"They cut me in a callous mass email after 4 years of
dedication. Leadership was incompetent. The team was great
but the company is dying. I'm bitter about how it ended;
I deserved better treatment. The work I did was high impact
but they didn't appreciate it."

[Hiring manager hears: this person carries grudges; will be
a problem hire; not a culture fit; risk; pass.]

// GOOD — 30 seconds, factual + forward
"My team was impacted in [Month]'s restructuring at [Company].
The mobile org was reorganized; about 40% of the team was
reduced. Decision was structural. I'm using the chance to
look deliberately at next steps; specifically interested in
roles leading RN architecture work. Happy to dive into the
work I shipped if helpful."

[Hiring manager hears: mature; resilient; forward-focused;
let's hear about the work.]
</code></pre>

<h3>Anti-pattern: skipping the lawyer</h3>
<pre><code class="language-text">// BAD
Engineer: "$400 lawyer? I'll just sign and move on."

[Misses: severance was negotiable to 50% more; non-compete is
unenforceable in their state but they followed it anyway,
turning down a great role; mutual non-disparagement was
one-sided so company can disparage but they can't speak up;
RSU acceleration was missed by 2 weeks of timing.]

[Cost of missing it: $20K+ in severance, $100K+ in
opportunity cost on the avoided role, $50K+ in unvested RSUs.]

// GOOD
Engineer pays $400 for 1 hour with employment lawyer.

Lawyer reviews docs:
- "Severance is below market for your tenure. Ask for X."
- "Non-compete is unenforceable in your state. Ignore it."
- "Mutual non-disparagement should be reciprocal."
- "RSU vesting cliff in 6 weeks; negotiate vest-through clause."

Engineer negotiates per advice. Gets ~$25K extra severance,
proper non-compete, vest-through clause, written reference.
ROI on the lawyer: 60×.
</code></pre>

<h3>Anti-pattern: silent survivor</h3>
<pre><code class="language-text">// BAD
[Survivor of cut. Workload doubled. Doesn't say anything;
"this is what we have to do for the company."]

[3 months later: burnout. Quits abruptly. Worst outcome for
both parties.]

// GOOD
[Day 7 post-cut, in 1:1 with manager:]
"I want to talk about post-cut workload. Specifically [data].
This is unsustainable. Three options [A, B, C]. I lean A.
What's your read?"

[Manager engaged with structural conversation; workload
renegotiated; survivor stays sustainable; org keeps the
talent.]
</code></pre>

<h3>Anti-pattern: ignoring healthcare</h3>
<pre><code class="language-text">// BAD
[Cut on the 15th of month. Last day = 28th. Coverage ends
that day. Engineer doesn't enroll in COBRA in time. 6 weeks
later: appendicitis. $40K bill, no coverage.]

// GOOD
[Day of cut: get exact end-of-coverage date in writing.
Day 7: file COBRA paperwork (or marketplace plan). Coverage
continuous.]
</code></pre>

<h3>Anti-pattern: visa unprepared</h3>
<pre><code class="language-text">// BAD
[H-1B holder. Cut Tuesday. Doesn't know about 60-day clock.
By day 30: just starting to apply. By day 50: only one phone
screen. By day 60: forced to leave US or change to dependent
status; spouse's job sponsors quickly but sub-optimal.]

// GOOD
[Pre-cut: aware of 60-day mechanics; 6-month buffer; warm
network at sponsoring companies; immigration lawyer relationship
established.]
[Day of cut: lawyer consult same day. Day 1: 20 outreach
messages. Day 7: 5 phone screens. Day 21: 2 offers. Day 30:
new role started; H-1B transfer initiated.]
</code></pre>

<h3>Anti-pattern: vague networking</h3>
<pre><code class="language-text">// BAD
[Mass message: "Hey, I was laid off; let me know if you hear
of anything." Sent to 100 LinkedIn contacts.]

[Result: most ignore; the few who reply have nothing specific
to offer; you've broadcast desperation.]

// GOOD
[Personal message to 20 specific contacts:]
"Hey [Name], hope you're well. Quick update: my role at
[Company] was impacted in last week's restructuring. I'm looking
for senior IC roles in [specific domain] — particularly RN
architecture leadership. Saw you're at [Their Company]; would
love to hear what's brewing on your team or any thoughts on
[adjacent companies]. Coffee in next 2 weeks?"

[Result: ~5-10 substantive responses; 1-2 warm intros; better
than 100 generic.]
</code></pre>

<h3>Anti-pattern: rejecting offers without negotiation</h3>
<p>Even in a buyer's market, most offers are negotiable. Pre-cut you'd negotiate; post-cut anxiety makes you accept the first offer. Don't. The first offer is rarely the best.</p>

<h3>Anti-pattern: hiding the layoff</h3>
<p>Some engineers try to hide the cut on LinkedIn / resume. Tech is small; word gets back. Better: factual, brief, forward-looking. The layoff itself isn't a stigma; how you handle it is.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common layoff-related interview prompts</h3>
<ol>
  <li>"Why are you looking for a new role?"</li>
  <li>"Tell me about your last job."</li>
  <li>"How did your last job end?"</li>
  <li>"What happened with [past company]?"</li>
  <li>"Walk me through your career."</li>
  <li>"Tell me about a time you faced a major setback."</li>
  <li>"What have you learned in the last 6 months?"</li>
  <li>"Why this role / why this company now?"</li>
</ol>

<h3>The 5-step framework for "tell me what happened"</h3>
<ol>
  <li><strong>State the fact</strong> — "I was impacted in [Month]'s layoffs at [Company]."</li>
  <li><strong>Frame it structurally</strong> — "It was a [team / org / function] reduction; not performance-based."</li>
  <li><strong>Show maturity</strong> — "I appreciate the experience; I'm using the time to look deliberately."</li>
  <li><strong>Forward-pivot</strong> — "I'm specifically looking for [type of role] because [genuine reason]."</li>
  <li><strong>Redirect to substance</strong> — "Happy to dive into the work I shipped there."</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"My approach to layoffs was operational — I built a 6-month buffer + kept network warm; the cut was disruptive but not catastrophic."</em></li>
  <li><em>"I treated the cut day as a process: paused 24-48 hours, lawyer-reviewed, negotiated severance, signed; then took a recovery week before serious search."</em></li>
  <li><em>"For interview narrative I keep it factual + forward — what was structural, what I learned, what I'm looking for next. Bitterness signals risk."</em></li>
  <li><em>"I ran the job search as a project — pipeline, weekly retros, defined hours, sustainable cadence. Panic-applying is how good engineers end up at suboptimal roles."</em></li>
  <li><em>"I negotiated severance on principle — first offer is rarely the best; specific asks with rationale convert ~50% to higher amounts."</em></li>
  <li><em>"For visa / healthcare / equity, I prioritized the time-sensitive items first — 60-day clock for H-1B, COBRA enrollment, RSU exercise window."</em></li>
  <li><em>"As a survivor I had the explicit workload conversation with my manager — silent absorption is the road to burnout."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Behavioral prompt</th><th>What they're really asking</th></tr></thead>
  <tbody>
    <tr><td>"Why are you looking?"</td><td>How do you frame setbacks; are you bitter; are you ready</td></tr>
    <tr><td>"How did the last job end?"</td><td>Are you a flight risk / drama risk; how mature is your processing</td></tr>
    <tr><td>"Major setback?"</td><td>Resilience; learning from adversity; structural thinking</td></tr>
    <tr><td>"Why this role now?"</td><td>Are you running TO something or just FROM</td></tr>
    <tr><td>"Walk me through career"</td><td>Coherent narrative; thoughtful trajectory</td></tr>
    <tr><td>"Last 6 months learnings"</td><td>Self-aware growth; not wasted time</td></tr>
  </tbody>
</table>

<h3>Demo script — "tell me what happened with your last role"</h3>
<pre><code class="language-text">"My team at [Company] was impacted in March's restructuring.
The mobile platform organization was reorganized; about 40%
of the engineering team was reduced. The decision was
structural — the company shifted strategy away from the
exploratory product area we were part of. It wasn't
performance-related.

I took a couple of weeks to recover and reset, and I'm
using the chance to look deliberately at next moves rather
than scrambling. I'm specifically interested in senior IC
roles where I can lead React Native architecture work —
that's where I've spent the last 3 years and where I'd
want to deepen the impact.

I shipped a passkeys auth migration there that reached 5M
users + dropped support tickets 22%. Happy to dive into
the work or talk about what I'd want to do next."
</code></pre>

<p>30 seconds. Factual. Forward. Pivots to substance. Hiring manager moves on satisfied.</p>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"I'd talk about how the survivor period informed my thinking on team resilience — what I'd watch for as a senior engineer."</em></li>
  <li><em>"I'd share the operational discipline I built — buffer, network, narrative — that I'd recommend to anyone in tech right now."</em></li>
  <li><em>"I could share the structured way I evaluated next-role criteria during the search."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Maturity</td><td>Not bitter; structural framing; forward-looking</td></tr>
    <tr><td>Operational thinking</td><td>Treats layoff as process; lawyer, severance, network</td></tr>
    <tr><td>Resilience</td><td>Recovered well; ready to be productive</td></tr>
    <tr><td>Self-awareness</td><td>Honest about timing + impact; not minimizing or dramatizing</td></tr>
    <tr><td>Coherent narrative</td><td>Career arc still makes sense; layoff is event, not derailment</td></tr>
    <tr><td>Risk profile</td><td>Not flight risk; not drama risk; not bitterness signal</td></tr>
    <tr><td>Specificity in next-role intent</td><td>Knows what they want; not "anything"</td></tr>
    <tr><td>Substance pivot</td><td>Quickly moves to the work + impact</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>Mobile platform teams have been disproportionately impacted in layoffs (cross-platform consolidation, "we'll just have web team build mobile").</li>
  <li>Frame: cross-platform RN expertise is a durable skill; pivot story to "I'm specifically interested in companies where mobile / RN is a growth investment."</li>
  <li>Mobile engineers can pivot to web React easier than to backend; broader job market.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"What did you learn from the layoff?"</em> — Operational lessons (buffer, network); team-resilience lessons; structural-vs-personal distinction; not "everyone should leave tech."</li>
  <li><em>"How did you support cut colleagues?"</em> — References, intros, kept in touch; standard humanity, framed as part of the senior IC role.</li>
  <li><em>"How do you decide stay vs go as a survivor?"</em> — Stay-or-go matrix: workload, comp, vesting, trajectory, personal stability, market — deliberate not panicked.</li>
  <li><em>"How would you advise a colleague being laid off?"</em> — Pause, lawyer, negotiate, recovery week, project-mode search, factual narrative.</li>
  <li><em>"What's your financial preparedness?"</em> — Buffer, awareness; not specific numbers but structure.</li>
  <li><em>"What if we have a layoff during your tenure?"</em> — Would handle as professionally as I did the last; don't expect immunity but expect to navigate.</li>
  <li><em>"What's the hardest decision you made post-layoff?"</em> — Specific story; tradeoffs; outcomes.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Calculate financial buffer; identify gap to 6 months; start filling.</li>
  <li>Update resume; LinkedIn; references list (informally confirmed).</li>
  <li>Send 3-5 warm-network messages this week; rebuild rust.</li>
  <li>If suspecting cuts: lawyer relationship; immigration lawyer if applicable.</li>
  <li>Practice the "what happened" answer aloud 3 times.</li>
  <li>Write the layoff narrative in 30 seconds; refine.</li>
  <li>Identify 5 target companies you'd want next; understand their hiring patterns.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read 'The Pathless Path' by Paul Millerd for career resilience framing."</li>
  <li>"Read your state's employment law summaries (or the EU equivalent)."</li>
  <li>"Maintain a 'wins file' — useful for resume + interview anchor under stress."</li>
  <li>"Build a relationship with an employment lawyer pre-need; you don't want to be searching for one in crisis."</li>
</ul>
`
    }
  ]
});
