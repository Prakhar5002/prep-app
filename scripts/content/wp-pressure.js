window.PREP_SITE.registerTopic({
  id: 'wp-pressure',
  module: 'workplace',
  title: 'Pressure, Burnout & Recovery',
  estimatedReadTime: '45 min',
  tags: ['burnout', 'pressure', 'stress', 'on-call', 'pip', 'mental-health', 'recovery', 'imposter-syndrome'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>Pressure is the constant in tech work — deadlines, on-call, outages, perf cycles, layoffs, ambitious roadmaps. <strong>Pressure isn't the problem; sustained-pressure-without-recovery is.</strong> Burnout isn't "I'm tired this week." It's structural — it builds for months, takes months to recover, and the longer you ignore it the worse the damage. Most engineers learn this the hard way once. Senior engineers learn to <em>recognize the signal early</em> and <em>own the recovery</em> instead of waiting for the org to fix it (it won't).</p>
<ul>
  <li><strong>Burnout is structural, not emotional.</strong> Long-term mismatch between demands + recovery; cynicism, exhaustion, reduced efficacy. Recovery measured in months, not weekends.</li>
  <li><strong>Three burnout dimensions:</strong> emotional exhaustion, cynicism, reduced sense of accomplishment. (Maslach.)</li>
  <li><strong>Early warning signs:</strong> dread starting work; small tasks feel huge; sleep / appetite drift; cynicism about colleagues + product; weekend recovery insufficient by Sunday evening.</li>
  <li><strong>Pressure types are not equal:</strong> deadline pressure (acute, fixable); on-call pressure (cumulative); outage trauma (event-based); performance / promo pressure (long-running); layoff anxiety (structural); abusive manager (relational).</li>
  <li><strong>Recovery is owned by you,</strong> not your manager. Time off helps; structural change is required. "Push through" makes it worse.</li>
  <li><strong>Saying no</strong> is often the most important pressure-management skill. (See <code>wp-saying-no</code>.)</li>
  <li><strong>Imposter syndrome</strong> compounds pressure; senior engineers don't lack it — they recognize it.</li>
  <li><strong>Get help early.</strong> Therapist, EAP, doctor — not because something's "wrong with you," but because professionals navigate pressure faster than you alone.</li>
</ul>
<p><strong>Mantra:</strong> "Pressure is fine; sustained-pressure-without-recovery is not. Recognize early, own the recovery, change the structure if you need to. Burnout is not a weakness."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What burnout actually is (clinical definition)</h3>
<p>From Maslach + WHO ICD-11: burnout is an occupational phenomenon characterized by:</p>
<ol>
  <li><strong>Emotional exhaustion</strong> — depleted; can't summon energy for work; fatigue that sleep doesn't fix.</li>
  <li><strong>Depersonalization / cynicism</strong> — detached, negative about colleagues / customers / product; reduced engagement.</li>
  <li><strong>Reduced sense of personal accomplishment</strong> — feels like nothing you do matters; ineffective; questioning competence.</li>
</ol>

<p>It's structural, not a bad week. Months in development; months in recovery. A 3-day weekend doesn't fix it.</p>

<h3>What pressure is</h3>
<p>Pressure is the demands stacked on you minus the resources + recovery available. <strong>Healthy pressure</strong> peaks + recovers; <strong>unhealthy pressure</strong> never recovers. Engineers who burn out usually have months of unhealthy pressure they normalized.</p>

<h3>Why it's a senior-engineering topic, not a self-help topic</h3>
<table>
  <thead><tr><th>Reason</th><th>Outcome</th></tr></thead>
  <tbody>
    <tr><td>Burnout is the #1 reason senior engineers leave companies</td><td>Cost: lost domain knowledge, lost team velocity, recruiting cycle</td></tr>
    <tr><td>Burnt-out engineers ship worse code</td><td>Bug rate up; incidents up; review quality down</td></tr>
    <tr><td>Burnout is contagious in teams</td><td>Cynicism spreads; team collapse risk</td></tr>
    <tr><td>You'll mentor others through it</td><td>Senior IC role increasingly involves coaching peers in stress</td></tr>
    <tr><td>Layoff cycles compound it</td><td>2023-2025 era specifically: every survivor inherited 2× workload + 50% the cushion</td></tr>
    <tr><td>Recognizing it is a senior signal</td><td>Junior: "everyone's stressed." Senior: "the team has been on this trajectory for 8 weeks; we'll lose someone."</td></tr>
  </tbody>
</table>

<h3>The pressure types — different problems, different solutions</h3>
<table>
  <thead><tr><th>Pressure type</th><th>Shape</th><th>Solution shape</th></tr></thead>
  <tbody>
    <tr><td>Deadline (acute)</td><td>Spike; ends when deadline hits</td><td>Surge + recover. Sustainable if you actually recover after.</td></tr>
    <tr><td>On-call (cumulative)</td><td>Periodic; sleep disruption</td><td>Distribute across team; runbook noisy alerts; cap rotations.</td></tr>
    <tr><td>Outage trauma (event)</td><td>Acute; PTSD-like patterns possible</td><td>Postmortem; team support; sometimes brief leave.</td></tr>
    <tr><td>Performance / promo (long-running)</td><td>Months of "are you good enough"</td><td>Reframe to scope-building; stop year-end reconstruction; recover after cycles.</td></tr>
    <tr><td>Layoff anxiety (structural)</td><td>Months of "will I be cut"</td><td>Limited control; outcome-focused activities (job search, financial buffer).</td></tr>
    <tr><td>Abusive manager (relational)</td><td>Daily; chronic</td><td>Document + transfer / exit. Don't try to fix.</td></tr>
    <tr><td>Imposter syndrome (internal)</td><td>Constant; "I'm a fraud"</td><td>Reframe + therapy + experience.</td></tr>
    <tr><td>Toxic team (relational)</td><td>Chronic; multiple sources</td><td>Transfer / exit. Don't try to fix.</td></tr>
  </tbody>
</table>

<h3>What "managing pressure well" looks like</h3>
<ul>
  <li>You recognize early signals (sleep, mood, energy) and act before crisis.</li>
  <li>You distinguish "today is hard" from "this trajectory is unsustainable."</li>
  <li>You take real time off — not "vacation while answering Slack."</li>
  <li>You set hard limits on hours when it matters (no work after 8 PM during deadline crunch).</li>
  <li>You communicate openly with manager — not as complaint but as information.</li>
  <li>You exercise / sleep / eat at baseline levels even under pressure.</li>
  <li>You have at least one human outside work to talk to honestly.</li>
  <li>You see a therapist when warranted; reach out to EAP / doctor when sleep / mood drift.</li>
  <li>You leave when structural; don't try to "win" against bad systems.</li>
</ul>

<h3>What "managing pressure badly" looks like</h3>
<ul>
  <li>"I'll rest after this launch" (then the next one starts).</li>
  <li>Sleep falls below 6 hours / night for weeks; you tell yourself it's fine.</li>
  <li>You're cynical about colleagues you used to like.</li>
  <li>You work weekends regularly; you tell yourself it's a phase.</li>
  <li>Exercise / hobbies dropped 6 months ago; "I'll get back to it later."</li>
  <li>You snap at family / partners; tell yourself work-life balance is "later."</li>
  <li>You haven't taken &gt; 2 days off in 6+ months.</li>
  <li>You can't remember when you last felt genuinely rested.</li>
  <li>You quit suddenly with no plan because you "couldn't take it anymore."</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The pressure-recovery balance</h3>
<pre><code class="language-text">Healthy: Demands ≤ Resources + Recovery
Unhealthy: Demands &gt; Resources + Recovery (chronic)
Burnout: Unhealthy state sustained for months
</code></pre>

<p>Demands: workload, on-call, ambiguity, deadline density.<br>
Resources: support, autonomy, clear priorities, manager backup.<br>
Recovery: sleep, exercise, time off, hobbies, social.</p>

<p>You can't always reduce demands. You can almost always increase resources + recovery — but you have to be deliberate.</p>

<h3>The 3 burnout dimensions (Maslach)</h3>
<table>
  <thead><tr><th>Dimension</th><th>Self-check</th></tr></thead>
  <tbody>
    <tr><td>Emotional exhaustion</td><td>Do I feel drained at the end of every workday? Does sleep restore me?</td></tr>
    <tr><td>Cynicism / depersonalization</td><td>Am I more negative about colleagues / leadership / product than I was 6 months ago? Do I feel disconnected?</td></tr>
    <tr><td>Reduced accomplishment</td><td>Do I feel my work matters? Do I feel competent?</td></tr>
  </tbody>
</table>

<p>Two of three trending negative for 4+ weeks = burnout territory. All three for 8+ weeks = clinical-level concern; consider professional support.</p>

<h3>Early warning signs</h3>
<ul>
  <li>Sleep changes: trouble falling asleep, waking up too early, racing mind.</li>
  <li>Sunday-evening dread that doesn't lift Monday morning.</li>
  <li>Small tasks feel huge ("I can't even start the email").</li>
  <li>Cynicism about people you used to respect.</li>
  <li>Increased irritability with family / colleagues.</li>
  <li>Reduced creativity; everything feels mechanical.</li>
  <li>Physical: tension headaches, jaw clenching, gut issues.</li>
  <li>Reduced exercise + hobbies; "I'll get back to them later."</li>
  <li>Increased substance use (alcohol, caffeine) to cope.</li>
  <li>"Resigning to fantasy" — daydreaming about quitting / leaving the industry.</li>
</ul>

<p>One of these for a week = normal life. Multiple, sustained for 4+ weeks = warning. Multiple sustained for 8+ weeks = act now.</p>

<h3>The "this is fine" trap</h3>
<p>Engineers (especially senior ones) normalize escalating pressure:</p>
<ul>
  <li>"This is just a busy quarter."</li>
  <li>"I'll rest after this launch."</li>
  <li>"Everyone is working this hard."</li>
  <li>"It's not as bad as the last sprint."</li>
  <li>"I'm being paid well; can't complain."</li>
</ul>

<p>Each individually plausible. Together they delay recognition by months. <strong>Burnout doesn't announce itself; it normalizes.</strong> The discipline: at quarterly intervals, ask honestly if your baseline has shifted, regardless of what's going on this week.</p>

<h3>The on-call wrinkle</h3>
<p>On-call has unique stressors:</p>
<ul>
  <li>Sleep disruption; even a "quiet" rotation harms sleep quality from anticipation.</li>
  <li>Power dynamics — you can't be more than ~5 min away from your laptop.</li>
  <li>Trauma accumulation from incidents; especially severe outages stick.</li>
  <li>Unfair distribution: senior + reliable engineers get more rotations because they handle them well.</li>
</ul>

<p>Healthy on-call:</p>
<ul>
  <li>Rotation cap: max 1 in 4 weeks ideally; 1 in 2 is the limit.</li>
  <li>Compensated time-in-lieu after busy rotations.</li>
  <li>Runbook + alert hygiene — flaky alerts ruthlessly silenced.</li>
  <li>Clear escalation path; don't be alone.</li>
  <li>Post-rotation decompression scheduled.</li>
</ul>

<h3>Outage trauma is real</h3>
<ul>
  <li>Severe outages — major user impact, public visibility, leadership scrutiny — leave PTSD-like patterns.</li>
  <li>Sleep disruption for weeks; intrusive thoughts; avoidance of related code paths.</li>
  <li>Most teams are bad at supporting this; engineers struggle privately.</li>
  <li>Mitigation: blameless postmortems; explicit team support; sometimes brief leave; sometimes therapy.</li>
  <li>If you owned an outage that haunts you 3+ months later: get professional support. Don't macho through it.</li>
</ul>

<h3>The promo / perf pressure cycle</h3>
<ul>
  <li>4-12 months of "am I good enough" anxiety leading to perf review.</li>
  <li>Self-eval reconstruction; peer feedback uncertainty; calibration black-box.</li>
  <li>Outcome can be elating (promo) or devastating (not).</li>
  <li>Mitigation: see <code>wp-perf-promo</code> — quarterly snippets reduce reconstruction stress; explicit alignment reduces uncertainty.</li>
  <li>Recovery: take 2-4 days fully off after perf review delivery, regardless of outcome.</li>
</ul>

<h3>Layoff anxiety</h3>
<ul>
  <li>2023-2025 era: most large tech companies cut ≥ 10% of engineering at least once.</li>
  <li>Anxiety even for "safe" engineers who weren't cut.</li>
  <li>Survivor's guilt + increased workload + reduced trust in leadership.</li>
  <li>Mitigation: control what you can (financial buffer, network, skills); explicit conversations with manager on your status.</li>
  <li>(See <code>wp-layoffs</code>.)</li>
</ul>

<h3>The PIP (Performance Improvement Plan)</h3>
<ul>
  <li>Most companies' PIPs are ostensibly improvement plans; in practice, they're often the precursor to managed exit.</li>
  <li>If you're put on a PIP: assume the worst case is "I'm being managed out"; prepare for it.</li>
  <li>This doesn't mean you're a bad engineer; PIPs sometimes correlate to manager-fit, team-fit, role-fit, calibration-cycle, layoff-prep.</li>
  <li>Specific moves:
    <ul>
      <li>Document everything — manager's expectations, deliverables, weekly progress, manager feedback.</li>
      <li>Take it seriously, deliver hard, but also start a quiet job search.</li>
      <li>Talk to a lawyer / employment expert about severance + reference negotiation.</li>
      <li>Don't ruminate; this is structural, not personal.</li>
    </ul>
  </li>
</ul>

<h3>Imposter syndrome</h3>
<ul>
  <li>Persistent feeling of "I'm a fraud; they'll find out."</li>
  <li>Senior engineers don't lack it; they recognize it as a feeling, not data.</li>
  <li>Compounds with pressure — high stakes amplify the fraud-feeling.</li>
  <li>Mitigations:
    <ul>
      <li>Keep a "wins file" — concrete things you've shipped + impact + recognition. Refer when imposter rises.</li>
      <li>Talk about it openly — almost every senior engineer has felt it; talking about it normalizes.</li>
      <li>Therapy if it's interfering (e.g., turning down opportunities you'd otherwise take).</li>
      <li>Reframe: "I don't know X" is not "I'm a fraud"; it's "this is the boundary of my knowledge — I'll learn or ask."</li>
    </ul>
  </li>
</ul>

<h3>The toxic-team / abusive-manager case</h3>
<ul>
  <li>Some environments are structurally bad: bullying, public humiliation, sustained gaslighting, retaliation.</li>
  <li>You cannot fix this. Period.</li>
  <li>Mitigation: document; transfer or exit; do not try to "win."</li>
  <li>If immediate exit isn't possible (visa, financial), focus on stabilizing while you build the exit ramp. Therapy + EAP + financial buffer.</li>
</ul>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Quarterly self-check (15 min, alone with a notebook)</h3>
<pre><code class="language-text">## Quarterly self-check — Q2 2026

### Sleep
Average hours / night this quarter: ___
How does this compare to my baseline? (better / same / worse)
Does sleep restore me, or do I wake tired?

### Energy
End of typical workday: energized / neutral / depleted?
Weekend recovery: by Sunday evening, am I rested or dreading Monday?

### Cynicism
Am I more negative about colleagues / product / leadership than last quarter?
Specific example?

### Accomplishment
Do I feel my work matters?
Have I felt genuinely proud of something this quarter?

### Hobbies / exercise / social
Am I doing the things I used to do that recharge me?
What's slipped?

### Patterns
What's been the dominant pressure source this quarter?
What did I do to recover?
What's the trajectory — improving, stable, or worsening?

### Action
Based on above: am I in healthy / warning / red zone?
What ONE structural change would help most?
What ONE recovery activity will I commit to next month?
</code></pre>

<p>Do this quarterly. The ritual matters. Without it, you normalize whatever's happening.</p>

<h3>The "trajectory" question</h3>
<p>Most useful question: <em>"Is my baseline shifting?"</em></p>
<ul>
  <li>Not "is this week stressful?" — every week has stress.</li>
  <li>"Am I more tired / cynical / disengaged than 3 months ago?"</li>
  <li>"Did the last vacation actually restore me, or was I dreading return on day 1?"</li>
  <li>If trajectory is bad for 2 quarters running: structural problem; act.</li>
</ul>

<h3>The "boundary" practice</h3>
<p>Pressure-management requires explicit boundaries. Otherwise pressure expands to fill all available time.</p>

<table>
  <thead><tr><th>Boundary</th><th>Default</th><th>Crunch exception</th></tr></thead>
  <tbody>
    <tr><td>Work hours</td><td>9-6 with 1h lunch</td><td>9-8 max during sprint; recover after</td></tr>
    <tr><td>Slack on phone</td><td>Off after 7 PM + weekends</td><td>On for on-call only; pages get push, normal Slack doesn't</td></tr>
    <tr><td>Work email</td><td>Not on personal phone</td><td>Don't change; use laptop if needed</td></tr>
    <tr><td>Weekend work</td><td>Never default; explicit incident exception</td><td>Maybe Saturday morning during launch crunch; comp time after</td></tr>
    <tr><td>Vacation</td><td>Fully off; no Slack; phone in airplane mode</td><td>Don't make exceptions; it's the recovery mechanism</td></tr>
    <tr><td>1:1 with manager</td><td>No-late-night messaging</td><td>Even during crisis: "we'll talk Tuesday morning"</td></tr>
  </tbody>
</table>

<p>Setting boundaries publicly + early is easier than after they're crossed. "I'm offline after 7 PM unless I'm on-call" — said in your team chat in week 1 — sets the norm.</p>

<h3>The "structural change" lever</h3>
<p>If pressure is sustained, recovery alone won't fix it. Structural change is needed:</p>
<ul>
  <li><strong>Reduce scope:</strong> say no to a new project; renegotiate a deadline; cut a feature. (See <code>wp-saying-no</code>.)</li>
  <li><strong>Add support:</strong> request another engineer; ask for project manager support; escalate to skip-level on under-staffing.</li>
  <li><strong>Change role:</strong> different team, different scope, different manager. (Internal mobility.)</li>
  <li><strong>Take real time off:</strong> 2+ weeks; not 3-day weekend. Comes back to baseline.</li>
  <li><strong>Change job:</strong> if structural and the company won't change.</li>
</ul>

<p>"Push through" is rarely the answer. If you've been pushing through for 2+ months and it's not getting better, the structure is the problem.</p>

<h3>The conversation with manager</h3>
<p>Pressure-management requires manager involvement. Pattern:</p>
<pre><code class="language-text">"I want to surface something. The current pressure is unsustainable
for me. Specifically: I've been working 60+ hours for 6 weeks; I'm
not recovering on weekends; my work quality is dropping (here are
3 examples).

This isn't sustainable. Three options I see:

A. Reduce scope: cut [Project X] from this quarter.
B. Add help: bring on a contract engineer for [Project Y].
C. Push deadline: ship [Project Z] in Q3 instead of end of Q2.

I'd lean A. What can we do?"
</code></pre>

<p>Specific (not "I'm stressed"); data-driven (hours, examples); proposes solutions. Manager can act.</p>

<p>If manager dismisses: "this is the job," "everyone's busy" — that's a structural manager problem; consider transfer / exit.</p>

<h3>Recovery: short-cycle</h3>
<table>
  <thead><tr><th>Daily</th><th>Weekly</th></tr></thead>
  <tbody>
    <tr><td>7-9 hours sleep</td><td>2 days fully unplugged</td></tr>
    <tr><td>Move (walk, gym, stretch)</td><td>1 social activity</td></tr>
    <tr><td>1 meal away from screens</td><td>1 hobby / non-work pursuit</td></tr>
    <tr><td>10 min outdoors</td><td>Audit hours; trim if &gt; 50</td></tr>
  </tbody>
</table>

<p>These are baseline; not luxuries. If you can't do them, the structure is broken.</p>

<h3>Recovery: long-cycle</h3>
<table>
  <thead><tr><th>Quarterly</th><th>Annually</th></tr></thead>
  <tbody>
    <tr><td>1+ week vacation; off Slack entirely</td><td>2-3 weeks vacation</td></tr>
    <tr><td>Self-check (above)</td><td>Career check; transfer / role / company</td></tr>
    <tr><td>Trim commitments</td><td>Sabbatical if available</td></tr>
  </tbody>
</table>

<h3>Therapy / professional support</h3>
<ul>
  <li>Most large tech companies offer EAP (Employee Assistance Program): free counseling sessions; confidential.</li>
  <li>Therapy is not "for people with problems" — it's a tool for people in high-pressure roles.</li>
  <li>Cognitive Behavioral Therapy (CBT) is well-evidence for stress, anxiety, imposter feelings.</li>
  <li>Find a therapist who works with tech / professional clients; the framing matters.</li>
  <li>If sleep / mood drift past 8 weeks: see a doctor; medical issues compound.</li>
</ul>

<h3>The "wins file"</h3>
<p>For imposter syndrome + perf-cycle anxiety: a doc that lists concrete things you've done well.</p>
<pre><code class="language-text"># Wins file — Prakhar

## Shipped projects
- Passkeys auth: 5M users; 22% support reduction
- Search migration: 5× latency improvement; $300K/yr savings
- ...

## Recognition
- Skip-level cited cross-team coord in 1:1 (March 2026)
- Promo to L4 in 2024
- "Thanks for the catch" from [name] on the regression find
- ...

## Hard problems solved
- Memory leak in RN bridge that took 3 weeks to find
- Multi-region DB migration with zero downtime
- ...
</code></pre>

<p>Update monthly. Read when imposter feeling rises. Specific, factual; not "I'm great."</p>

<h3>The "outside-work" connection</h3>
<ul>
  <li>One human outside work you can talk to honestly. Therapist, friend, partner, sibling.</li>
  <li>If you can't think of anyone: that's the first thing to fix.</li>
  <li>Engineers who isolate — especially after burnout — recover slowest.</li>
</ul>

<h3>The "energy budget" model</h3>
<p>You have ~100 energy points each day. Different activities deplete + restore at different rates:</p>
<table>
  <thead><tr><th>Activity</th><th>Cost / restore</th></tr></thead>
  <tbody>
    <tr><td>Code review (typical)</td><td>-5</td></tr>
    <tr><td>Difficult code review (peer pushback)</td><td>-15</td></tr>
    <tr><td>Design doc writing</td><td>-10</td></tr>
    <tr><td>Cross-team meeting</td><td>-15</td></tr>
    <tr><td>1:1 with friend manager</td><td>-2</td></tr>
    <tr><td>1:1 with difficult manager</td><td>-15</td></tr>
    <tr><td>On-call page (3 AM)</td><td>-30 (next day)</td></tr>
    <tr><td>Outage incident</td><td>-50 (multi-day)</td></tr>
    <tr><td>Walk in nature</td><td>+15</td></tr>
    <tr><td>Workout</td><td>+20</td></tr>
    <tr><td>Hobby / non-work</td><td>+10</td></tr>
    <tr><td>Sleep (8 hrs)</td><td>Resets to ~100</td></tr>
    <tr><td>Sleep (5 hrs, anxious)</td><td>Resets to ~70</td></tr>
  </tbody>
</table>

<p>Track your day. If you keep finishing at 0 or negative, the system is broken; not your fault.</p>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Catching burnout early (week 4 of warning signs)</h3>
<pre><code class="language-text">Week 1: Friday, "exhausted but it's just been a tough sprint."
Week 2: Sunday-evening dread. "I'll feel better by Monday."
Week 3: Snapped at partner over something small. "Just stressed."
Week 4: Open the laptop. Stare at it. Can't start the email.

Quarterly self-check (which I forgot to do):
- Sleep: 5-6 hours / night for 4 weeks. Down from 7+ baseline.
- Energy: depleted by 11 AM. Can't focus.
- Cynicism: yes — I rolled my eyes in the last design review.
- Accomplishment: yes I ship, but it feels meaningless.

Three of three burnout dimensions trending. 4-week sustained.
This is warning zone, not red zone — but if I push through 4
more weeks, it's red zone.

Action plan:
1. Take 1 week PTO next month. Tell manager today.
2. Talk to manager: "I'm at unsustainable pressure. Three options
   to reduce: A, B, C. I lean A."
3. Re-baseline sleep. 8 hours target; phone out of bedroom.
4. Resume 3x/week walks (dropped 6 weeks ago).
5. Schedule EAP intake call.
6. Re-do self-check in 4 weeks.

Outcome (4 weeks later):
- PTO helped; back to baseline rest.
- Manager reduced scope (cut Project X from quarter).
- Sleep is back to 7 hours.
- Walks are back.
- EAP gave me CBT framing for the cynicism — useful.
- Trajectory: stable. Not perfect. Not red zone.
</code></pre>

<p>This is the senior-engineer move: <em>recognize trajectory + act</em>. Not "push through one more week."</p>

<h3>Example 2: The escalation that didn't go well</h3>
<pre><code class="language-text">[Engineer at week 12 of unsustainable pressure; multiple warning
signs; finally raised it.]

Engineer: "I'm not sustainable here. I'm working 70 hours; I'm not
sleeping; I'm not getting better."

Manager: "I hear you. We're all stretched. Can you push through
to launch? It's only 3 more weeks."

[3 weeks later, launch happens. Manager: "Great work team!" Then
the next launch starts.]

Engineer (4 weeks later): "I need to talk about workload. Last
launch I told you I wasn't sustainable; we said push through;
here we are again."

Manager: "Things are slower next quarter. Hang in there."

Engineer (after 8 more weeks): Quits abruptly. No transition plan.
Burnout-driven exit.

[What went wrong: vague initial message; manager interpreted
as 'tired but OK.' No specific data, no specific options. Manager
defaulted to 'push through' because that's the easiest answer.]
</code></pre>

<p>Compare to the right pattern:</p>
<pre><code class="language-text">Engineer: "Want to surface something specifically. Three pieces
of data:

1. I've worked 65+ hours / week for 8 of the last 10 weeks.
2. My sleep has averaged 5.5 hours; below my baseline.
3. Two specific quality drops: the QA escape on Tuesday and the
   missed coordination with web team on Friday.

This trajectory is unsustainable. Three options I see:

A. Cut scope: drop Project X from this quarter; ship in Q3 instead.
B. Bring help: contract engineer or pull from another team.
C. Reduce my coverage: I take 2 weeks off; team works without me;
   I come back at sustainable pace.

Doing nothing is not an option for me — I'll either get sick or
look for the exit.

What can we do? Decision needed by Friday."

Manager: [now has data, options, urgency, and 'either / or' framing.]
"OK. Let's go with A — cut Project X. Take next week off. We'll
re-plan Q3 when you're back."
</code></pre>

<p>Specific data + specific options + clear stakes. Manager can act.</p>

<h3>Example 3: Recovering from a severe outage</h3>
<pre><code class="language-text">[Engineer ran a deploy that caused 4-hour outage; 100K users
affected; CEO emailed about it; postmortem was public.]

Week 1: Functional but distracted. Replays the deploy in head
constantly.
Week 2: Sleep disrupted. Wakes up at 3 AM thinking about it.
Avoiding the part of the codebase involved.
Week 3: Cynical about the org's response (felt blamed).
Week 4: Snapping at colleagues. Can't focus.

Action plan:
- Talk to manager: "The outage is still affecting me. I'm having
  sleep + focus issues 4 weeks later. I want to flag it."
- EAP referral; therapist.
- Therapist: 6 sessions; CBT for the rumination + sleep hygiene.
- Manager: rotated me out of on-call for 2 months; assigned a
  different code area for a quarter.
- Skip-level + manager publicly emphasized blameless culture
  in next all-hands.

Outcome (3 months later): Sleep back to baseline. Confident in
the codebase again. Took the lessons (gave a tech talk on
deploy safety to the org). Healthier than before.
</code></pre>

<p>Outage trauma is real. Treating it as "just be tougher" is how engineers leave the industry.</p>

<h3>Example 4: PIP response</h3>
<pre><code class="language-text">[Engineer placed on PIP; manager: "you have 60 days to demonstrate
improvement on X, Y, Z."]

Week 1:
- Document the meeting in writing; email manager: "to confirm,
  you said the goals are X, Y, Z; success criteria are [specific];
  we'll review weekly. Did I capture that right?"
- Get the criteria explicit + written.
- Start a daily log: what I did; what I delivered; what feedback I
  got.
- Schedule weekly 1:1 with manager focused on PIP progress.

Week 1 also:
- Quietly update resume.
- Start filling pipeline (recruiter conversations).
- Build financial buffer awareness (how long can I afford no income?).
- Talk to therapist about it (it's a stressor; don't go through alone).

Week 2-8:
- Deliver hard against the criteria. Don't rush; quality matters.
- Send weekly written update to manager: "this week I did X, Y, Z;
  outcomes A, B, C; outstanding: D; would value your feedback."
- After each 1:1: send written summary of feedback received;
  "I heard you say X; I'll do Y in the next week."

Week 9-12:
- Mid-PIP review: ask explicitly "am I tracking? what's still
  missing?"
- If positive: continue. Take written confirmation.
- If negative: prepare for managed exit. Talk to lawyer.
  Negotiate severance + reference.

Outcomes can vary:
- ~30% PIPs end in successful improvement + retention.
- ~50% end in managed exit (severance + reference).
- ~20% end in messy termination.

Either way: documented + financial buffer + outside support
makes the outcome livable.
</code></pre>

<h3>Example 5: Managing on-call sustainability</h3>
<pre><code class="language-text">[Team of 4 engineers; on-call rotation = 1 in 4. After 6 months,
two engineers leave; team is now 2 + 1 in 2 rotation. Burnout
risk.]

Senior engineer (you): "Team's on-call is unsustainable post-cuts.
Three engineers left; we're 1 in 2 now. Pages last rotation
were 14 (typical: 5). I'm not getting useful sleep on rotation
weeks.

Three options:
A. Hire 2 engineers + restore 1-in-4 (12-week ramp).
B. Reduce alert noise: I spend 2 weeks cleaning up the [Service
   X] alerts; estimated 50% reduction in pages.
C. Borrow from sister team: 2 of their engineers join our rotation
   for 2 months while we hire.

Plan: B immediately; A in parallel. Skip C unless A slips.

What I need from you: protect my 2 weeks for B (no new urgent
projects); start the headcount paperwork for A this week."

Manager: "OK. Project Y can slip to Q3 to give you the time.
Headcount conversation today with HR."

[6 months later: team is 4 again; alerts are quiet; 1-in-4
rotation; sustainable.]
</code></pre>

<h3>Example 6: Imposter syndrome on a stretch role</h3>
<pre><code class="language-text">[Engineer just promoted to L5; week 2; everyone seems to know more
than them.]

Day 5: in design review; senior engineer raises a concern they
hadn't thought of. Engineer feels like a fraud.
Day 8: manager asks "what's your take on the architecture
direction?" Engineer freezes.
Day 12: 1:1 with manager. Engineer wants to refuse the new
project: "I don't think I'm ready."

Actions:
- Therapist (already had one): processes the imposter feeling.
  Reframe: "feeling unprepared on a new role's first month is
  universal; not data."
- Wins file: re-reads the recent shipped projects + recognition.
  "I've earned this seat."
- 1:1 with manager: "I want to flag I've been having imposter
  vibes. I'm not refusing the project; I'm just naming it. I'd
  value your read on what L5 should look like in the first 3
  months — would help me calibrate."
- Manager: "Most L5 engineers have this in the first 6 months.
  Here's what I see in you that justifies the promo: [3 things].
  Goal at 90 days: [specific]. We'll check at quarterly."

Outcome (3 months later): engineer ships the new project. Imposter
feeling didn't disappear (it never does), but it stopped driving
decisions. The L5 work is L5 work; they're doing it.
</code></pre>

<h3>Example 7: Setting boundaries during launch crunch</h3>
<pre><code class="language-text">[Big launch in 4 weeks. Team starting to drift to weekends.]

You (in team channel, week 1): "Heads up on my approach for the
next 4 weeks:

- I'll work 9-7 weekdays; some weekends if there's a real blocker.
- I'm off Slack 8 PM - 7 AM.
- I'm taking the weekend after launch fully off; recovery matters.

If you need urgent attention from me, page on PagerDuty (only for
real fires). For normal asks, async messages will get answered
the next morning.

Lmk if any conflicts; happy to discuss."

[Manager + team OK with it. Norm set in week 1.]

Week 3 (mid-crunch): you held the boundary. Other engineers
started doing similar. The team didn't burn out.

Week 5 (post-launch): everyone took 2-3 days off. Back to
sustainable pace.
</code></pre>

<p>Boundaries set publicly + early reduce friction. Set after they're crossed = harder.</p>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Pressure that's actually about you</h3>
<ul>
  <li>Sometimes your stress isn't proportional to the load. Anxiety, depression, life events bleeding in.</li>
  <li>Sign: peers seem fine in the same conditions; the problem is internal.</li>
  <li>Mitigation: therapy + medical evaluation. Not "everyone's stressed; suck it up." This is health, not character.</li>
</ul>

<h3>Pressure that's about life, not work</h3>
<ul>
  <li>Family illness, divorce, breakup, parent care, financial crisis — bleed into work pressure.</li>
  <li>Most companies offer some form of support (FMLA, leave of absence, EAP).</li>
  <li>Talk to manager early — "I'm dealing with [X]; here's what I think I can deliver; need flexibility on Y."</li>
  <li>Don't try to compartmentalize. It leaks anyway. Surface it; build accommodations.</li>
</ul>

<h3>"You're our top engineer; we need you"</h3>
<ul>
  <li>Compliment that locks you in.</li>
  <li>Translation: "your departure is too costly; we'll squeeze you to avoid it."</li>
  <li>Mitigation: "I appreciate that. The way to keep me long-term is to make this sustainable. Three things would help: [specific]." Frame irreplaceability as leverage for sustainability, not consent to overwork.</li>
</ul>

<h3>Workaholic culture as norm</h3>
<ul>
  <li>Some companies / teams genuinely expect 60+ hour weeks (typically high-growth, high-comp).</li>
  <li>Pressure isn't "abnormal"; it's the deal you signed up for.</li>
  <li>Mitigation: decide whether the deal still works. Comp + learning vs life cost. Honest answer; not "I'll figure it out later."</li>
  <li>If the deal doesn't work, it's not bad culture; it's culture mismatch. Plan exit.</li>
</ul>

<h3>Hidden expectation creep</h3>
<ul>
  <li>Hours expectations grew over months; nobody said "from now on we work 60-hour weeks." It just happened.</li>
  <li>Senior signal: notice the creep + name it. "Six months ago we worked 9-6; now we're at 9-9. Was this a deliberate decision? Should we keep it?"</li>
  <li>Doing this in a team channel makes it real for others. Most teams welcome the conversation when one person starts it.</li>
</ul>

<h3>Outage trauma compounding</h3>
<ul>
  <li>Multiple outages within months — even if individually manageable — accumulate.</li>
  <li>By outage 3 or 4, you're walking around hypervigilant.</li>
  <li>Mitigation: explicit conversation with manager about rotation off the high-stress system; therapist for processing; sometimes brief leave.</li>
  <li>Some engineers leave a team after a string of outages — that's a valid response; it's not failure.</li>
</ul>

<h3>"My team is fine, why am I struggling?"</h3>
<ul>
  <li>You compare to colleagues who seem fine; conclude you're weak.</li>
  <li>Reality: people hide it. Talk to them privately; you'll often find they're struggling too.</li>
  <li>Stress responses are individual; what destroys you may be tolerable for them, and vice versa.</li>
  <li>Don't measure yourself against others' visible behavior; measure against your own baseline.</li>
</ul>

<h3>Vacation that doesn't help</h3>
<ul>
  <li>You take 1 week off; come back exhausted; nothing restored.</li>
  <li>Reasons: 1 week is often too short for serious recovery (need 2+); checked Slack the whole time; backlog when you returned was crushing; underlying structural problem hadn't changed.</li>
  <li>Mitigation: 2+ weeks; phone in airplane mode; explicit "I will not respond" delegation to a covering engineer; structural change before / after vacation, not just the time off.</li>
</ul>

<h3>Sabbatical conversation</h3>
<ul>
  <li>Some companies offer sabbatical (1-3 months) at tenure (5+ years).</li>
  <li>If you're approaching burnout + you have it: take it. Plan + use it.</li>
  <li>Negotiate timing if you can; right after a launch is better than mid-crunch.</li>
  <li>If your company doesn't offer it but you're approaching crisis: a 1-3 month unpaid leave conversation is sometimes possible; depends on relationship + role.</li>
</ul>

<h3>"I quit my job and I'll figure it out"</h3>
<ul>
  <li>The "quit suddenly with no plan" exit pattern.</li>
  <li>Often comes after months of denial + suddenly cracking.</li>
  <li>Sometimes the right call. Sometimes a financial / career setback you regret.</li>
  <li>Mitigation: try to get a soft landing. 4-week notice; severance negotiation; LOA before quitting; transfer if possible. The exit can usually be made graceful even when the situation isn't.</li>
</ul>

<h3>Toxic team — not just a bad period</h3>
<ul>
  <li>Sustained bullying, undermining, public humiliation, retaliation.</li>
  <li>Difference from "tough team": directed at you specifically; multiple instances; doesn't respond to direct conversation.</li>
  <li>Mitigation: document. Transfer or exit. Don't try to fix. Don't waste years on a team that's structurally bad.</li>
</ul>

<h3>Specific to staff+ ICs</h3>
<ul>
  <li>Pressure shape changes at staff+ — fewer deadlines, more ambiguity, more political weight.</li>
  <li>Burnout risk: feeling that your decisions affect many people; analysis paralysis; being "the one who has to figure it out."</li>
  <li>Mitigation: explicit decision-making frameworks; scheduled "deep think" time; therapist familiar with senior leadership stress.</li>
</ul>

<h3>Specific to mobile / RN engineers</h3>
<ul>
  <li>App Store / Play Store rejection cycles add unique stress: external party, opaque criteria, rejected after weeks of work.</li>
  <li>Release cycles are less continuous than web; pressure builds toward release windows.</li>
  <li>Mitigation: explicit acknowledgment that this is a real stressor; planning around release windows; not letting one rejection define a quarter.</li>
</ul>

<h3>Specific to layoff-era engineering (2023-2025)</h3>
<ul>
  <li>Survivor's guilt; doubled workload; lost trust in leadership.</li>
  <li>Even if you weren't cut, the team you remember isn't there.</li>
  <li>Mitigation: explicit acknowledgment ("this is harder than before for real reasons"); financial buffer; outside-of-work network for honest conversations; quarterly self-check explicit on whether to stay or go.</li>
</ul>

<h3>Specific to India-based engineers reporting to US managers</h3>
<ul>
  <li>Time-zone overlap forces late-night calls; sleep disrupted.</li>
  <li>Less visibility in casual interactions; perf risk + isolation.</li>
  <li>Mitigation: explicit "no late calls except scheduled" boundary; over-communicate written; cultivate local peer network.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common pressure-handling mistakes</h3>
<ol>
  <li><strong>"I'll rest after this launch."</strong> Then the next launch starts.</li>
  <li><strong>Working through the warning signs.</strong> Sleep / mood / energy drift; you ignore.</li>
  <li><strong>Vague escalation.</strong> "I'm stressed" gets dismissed; specific data + options gets action.</li>
  <li><strong>"Vacation" with Slack on.</strong> Not actually time off; doesn't restore.</li>
  <li><strong>Comparing to peers.</strong> Their visible behavior is not their reality.</li>
  <li><strong>Trying to fix toxic environments.</strong> You can't. Transfer or exit.</li>
  <li><strong>Solo struggling.</strong> No therapist, no friend, no doctor when warranted.</li>
  <li><strong>Believing burnout = weakness.</strong> It's structural, not character.</li>
  <li><strong>Pushing through outage trauma.</strong> Real PTSD-like patterns; needs real recovery.</li>
  <li><strong>Quitting suddenly without plan.</strong> Damages career + finances.</li>
  <li><strong>Imposter syndrome driving decisions.</strong> Refusing opportunities you'd be great at.</li>
  <li><strong>"I'll deal with PIP myself."</strong> Don't go through alone; document, get advice, prepare for both outcomes.</li>
</ol>

<h3>Anti-pattern: "I'll rest after"</h3>
<pre><code class="language-text">// BAD — perpetually deferred recovery
"I'll rest after the launch."
"I'll rest after the perf cycle."
"I'll rest after the holidays."
"I'll rest after the next launch."

[18 months pass; recovery never happens; burnout collapse.]

// GOOD — recovery scheduled into the rhythm
After every launch: 2-3 days fully off, regardless of outcome.
After every perf cycle: 1 week fully off.
Quarterly: 1 week vacation (no Slack).
Annually: 2-3 weeks vacation.

Recovery is a default, not a reward.
</code></pre>

<h3>Anti-pattern: vague escalation</h3>
<pre><code class="language-text">// BAD
"I'm really stressed. Things are too much."

[Manager: "Yeah we're all stressed. Hang in there."]

// GOOD
"Three pieces of data: I worked 65+ hrs / week for 8 of last 10 weeks;
sleep down to 5.5 hrs; two specific quality drops [examples]. This
trajectory is unsustainable. Three options: A, B, C. I lean A.
What can we do?"

[Manager has data, options, must respond.]
</code></pre>

<h3>Anti-pattern: not-real vacation</h3>
<pre><code class="language-text">// BAD
"I'll take a week off, but I'll keep an eye on Slack."
"I'll respond to manager's pages but nothing else."
"I'll just be available for emergencies."

[Result: not restorative. Brain stays in work mode. Recovery
delayed.]

// GOOD
"I'm out next week. Phone in airplane mode for non-family.
Email + Slack auto-reply: 'I'll respond on [date]. For urgent:
[covering engineer].' Covering engineer briefed; manager OK
with it; emergency contact = my partner if true family
emergency."

[Result: actual recovery. Brain switches off. Comeback to
baseline.]
</code></pre>

<h3>Anti-pattern: hide the burnout</h3>
<pre><code class="language-text">// BAD — try to power through alone
[Months of warning signs. Don't tell anyone. Don't see therapist.
Don't talk to friend / partner. Pride blocks the conversation.]

[Outcome: collapse, abrupt quit, recovery takes 6+ months.]

// GOOD — name it; get support
- Therapist (or EAP).
- Doctor for sleep / mood evaluation.
- Manager (specific data + options).
- One trusted friend or family member who knows.

[Outcome: course-corrected before collapse; recovery on a
shorter cycle.]
</code></pre>

<h3>Anti-pattern: pushing through outage trauma</h3>
<pre><code class="language-text">// BAD — "I should be tougher"
[After major outage:
- Sleep disrupted 4 weeks; you don't talk about it.
- Avoid the codebase area; you don't tell anyone.
- Cynical + jumpy; you push it down.
- Manager doesn't know; doesn't accommodate.
- 6 months later: still affecting you.]

// GOOD — name it; get support
"The outage is still affecting me 4 weeks later — sleep, focus,
codebase avoidance. Want to flag and discuss accommodation."

[Manager rotates you off the affected area; therapist for
processing; team blameless culture reinforced; recovery in
8-12 weeks instead of 6+ months.]
</code></pre>

<h3>Anti-pattern: PIP shock</h3>
<pre><code class="language-text">// BAD — defensive, in denial
[On PIP. Frozen. Don't ask for specifics. Hope it goes away.
Don't update resume. Don't talk to lawyer. Don't tell family.
Take it personally instead of structurally.]

[Outcome: messy termination 60 days later; no severance
negotiated; mental health crash; financial stress.]

// GOOD — strategic + supported
[On PIP. Day 1:
- Document criteria in writing; confirm with manager.
- Daily log of work + feedback.
- Quietly update resume + start outreach.
- Talk to lawyer about severance + reference standard.
- Talk to therapist; do not go through alone.
- Family / partner: tell them; they need to know.

Day 30:
- Mid-PIP review; ask explicitly; document response.

Day 60:
- Either improvement + retention (with documented turnaround), or
- Managed exit with negotiated severance + reference + planned
  next step.]

[Both outcomes survivable; trauma is real but managed.]
</code></pre>

<h3>Anti-pattern: imposter syndrome refusal</h3>
<pre><code class="language-text">// BAD
[Offered tech-lead role on a high-impact project.]
"I don't think I'm ready. I'd rather not."

[6 months later: regret. Watched someone less capable take it
and grow into it.]

// GOOD
[Same offer.]
"I'm having imposter vibes about it; that's an internal feeling,
not a reason to say no. I'm taking it. What support would help
in the first 90 days?"

[Take the role; lean on senior peers + manager; ship; grow into
it. The imposter feeling doesn't disappear; it stops driving
decisions.]
</code></pre>

<h3>Anti-pattern: trying to fix a toxic team</h3>
<pre><code class="language-text">// BAD — believe you can change the system
[Bullying manager. Documented incidents. Confronted them
multiple times.]
"They're capable of change. Just need to be patient."

[18 months later: still bullying; you're broken; transferred
out finally. Lost 18 months.]

// GOOD — recognize structural; exit strategically
[Bullying manager. After 1-2 documented attempts:]
"This is structural. Document; transfer or exit; don't fix."

[Plan transfer / exit in 3-6 months. Use the time strategically;
don't burn yourself fixing what won't be fixed.]
</code></pre>

<h3>Anti-pattern: peer comparison</h3>
<pre><code class="language-text">// BAD
"Everyone else seems fine; I shouldn't be struggling. I'm weak."

// GOOD
"My experience is data; others' visible behavior is not data
on their internal experience. They might be hiding it; I
might have different stress capacity; the situation might
affect us differently. My signal is the only one I can reliably
read."

[Talking to peers privately, you'll often find they're struggling
too. Doesn't make it OK; does normalize it.]
</code></pre>

<h3>Anti-pattern: skipping the doctor</h3>
<p>Sleep / mood / energy drift past 8 weeks deserves medical evaluation. Sometimes it's stress; sometimes it's thyroid, depression, anxiety, sleep disorder, hormonal. Engineers wait too long; the medical evaluation often gives a treatable diagnosis.</p>

<h3>Anti-pattern: "I should be able to handle this"</h3>
<pre><code class="language-text">// BAD
[Pressure mounting; you isolate; don't ask for help; "I'm a
senior engineer; I should be able to handle this."]

// GOOD
"Senior engineer means I know when to ask for help, not that I
never need it. The pattern of asking for help early + recovering
is the senior pattern — not 'pushing through.'"
</code></pre>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Behavioral interview prompts that map here</h3>
<ol>
  <li>"Tell me about a time you handled a high-pressure situation."</li>
  <li>"Tell me about a time you made a difficult decision under stress."</li>
  <li>"How do you manage stress / burnout?"</li>
  <li>"Tell me about a time you had to say no to a request."</li>
  <li>"Tell me about a project that didn't go well."</li>
  <li>"How do you handle on-call?"</li>
  <li>"Tell me about a time you helped someone struggling."</li>
  <li>"How do you stay productive over the long-term?"</li>
</ol>

<h3>The 5-step framework for "tell me about a time you handled pressure"</h3>
<ol>
  <li><strong>Set the situation</strong> — pressure type (deadline / outage / on-call / promo). Specific.</li>
  <li><strong>Identify the constraint</strong> — what was the actual scarcity (time, people, info)?</li>
  <li><strong>Specific actions</strong> — what you did to manage scope, ask for support, set boundaries.</li>
  <li><strong>Outcome</strong> — concrete result + your sustainability after.</li>
  <li><strong>What you learned</strong> — early-warning signs you noticed; structural change you'd push next time.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"Pressure isn't the problem; sustained-pressure-without-recovery is. I distinguish acute spikes from unsustainable trajectories."</em></li>
  <li><em>"I do quarterly self-checks: sleep, energy, cynicism, accomplishment. Two of three trending bad for 4+ weeks = warning zone; act."</em></li>
  <li><em>"For escalation, I bring data + options to my manager — not just 'I'm stressed.' Specific data lets them act."</em></li>
  <li><em>"Recovery is on me, not my manager. Vacation is real-vacation; weekends count; sleep is non-negotiable."</em></li>
  <li><em>"For toxic environments — abusive manager, unsustainable expectations — I document + transfer / exit. I don't try to fix structural problems."</em></li>
  <li><em>"Imposter syndrome is a feeling, not data. I keep a wins file for evidence; therapy when it interferes with decisions."</em></li>
  <li><em>"Outage trauma is real. Severe outages need real recovery — sometimes therapy, sometimes time off, sometimes rotation off the affected system."</em></li>
  <li><em>"I get help early. Therapist + EAP + doctor — not because something's 'wrong with me,' but because professionals navigate pressure faster than I do alone."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Behavioral prompt</th><th>What they're really asking</th></tr></thead>
  <tbody>
    <tr><td>"Handle high-pressure"</td><td>Self-awareness + structural thinking + recovery</td></tr>
    <tr><td>"Difficult decision under stress"</td><td>Frameworks for deciding; not winging it</td></tr>
    <tr><td>"Manage burnout"</td><td>Recognition + recovery + structural change; not "push through"</td></tr>
    <tr><td>"Project didn't go well"</td><td>Self-awareness; learning; resilience</td></tr>
    <tr><td>"Help someone struggling"</td><td>Mentorship; team awareness; senior IC behaviors</td></tr>
    <tr><td>"Stay productive long-term"</td><td>Sustainable practices + boundaries</td></tr>
    <tr><td>"On-call experience"</td><td>Sustainability + alert hygiene + teamwork</td></tr>
  </tbody>
</table>

<h3>Demo script — "tell me about a time you handled pressure"</h3>
<pre><code class="language-text">"Last year I led a launch with a 4-week timeline that was
ambitious by 2x relative to scope. By week 2, my team was at
unsustainable hours.

Specifically: I noticed 3 signs — sleep drop on the team, sharp
team chat tone, and quality regressions in code reviews.

What I did:

1. Pulled the team for a 30-min retrospective: how is everyone
   actually doing? Got honest signals.

2. Wrote a 1-page brief to my manager with the actual data: hours
   logged, deadline math, two scope-reduction options, one ask
   for help. Recommended cutting 1 secondary feature to
   sustainable pace.

3. Set explicit team boundary: 'no Slack after 8 PM unless on
   PagerDuty.' Modeled it myself.

4. After launch (which shipped successfully with reduced scope):
   2 days off for everyone, fully unplugged. I went first to
   set the norm.

Outcome: launch shipped on time + working. Team didn't burn out;
two of the engineers told me later they'd been close to breaking.
We took the lessons to the next launch — built scope buffer + the
'no off-hours Slack' default — and that one was sustainable too.

What I learned: senior IC role is partly about recognizing
unsustainable trajectories on the team — not just for me — and
forcing the structural conversation. Pushing through is not
heroic; it's hidden cost the org pays in turnover later."
</code></pre>

<p>Notice: specific signals, specific actions, specific outcomes, structural learning.</p>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"I'd dive into the team-level conversation we had — how I framed it without sounding alarmist."</em></li>
  <li><em>"I'd talk about the trickier case where my manager pushed back on the scope reduction; how I made the case."</em></li>
  <li><em>"I'd share my self-check template; it's been useful for the engineers I mentor."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Self-awareness</td><td>Names own warning signs; not "I never get stressed"</td></tr>
    <tr><td>Structural thinking</td><td>Distinguishes acute from chronic; addresses structure</td></tr>
    <tr><td>Specific actions</td><td>Concrete behaviors, not vague "I managed it"</td></tr>
    <tr><td>Recovery discipline</td><td>Names recovery as part of pressure management</td></tr>
    <tr><td>Team awareness</td><td>Notices others' stress, not just own</td></tr>
    <tr><td>Manager engagement</td><td>Specific escalation; data + options</td></tr>
    <tr><td>Boundaries</td><td>Sets + holds them publicly + early</td></tr>
    <tr><td>Outside support</td><td>Mentions therapist / EAP / doctor where relevant; not solo struggle</td></tr>
    <tr><td>Resilience pattern</td><td>Bounces back from setbacks; learns; doesn't repeat</td></tr>
    <tr><td>Maturity</td><td>Frames burnout as structural, not weakness</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>App Store / Play Store rejection cycles add unique stress; release windows compound deadline pressure.</li>
  <li>Cross-platform RN engineers often serve multiple platforms' deadlines at once — coordinate or push back.</li>
  <li>Mobile teams in cross-platform companies often have higher on-call burden ("when push fails, mobile team gets paged").</li>
  <li>Specific mitigation: alert hygiene + clear escalation; mobile-platform-specific runbooks.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"How do you recognize burnout in yourself?"</em> — Specific signals (sleep, mood, cynicism); quarterly self-check; trajectory question; not just "feeling tired."</li>
  <li><em>"Tell me about a time you saw a teammate struggling."</em> — Pattern recognition (early signs); private conversation; offered support without forcing it; alerted manager if appropriate; respected privacy.</li>
  <li><em>"How do you decide between pushing through and pulling back?"</em> — Acute (push through; recover after) vs chronic (pull back; structural change). Trajectory question — am I improving, stable, or degrading?</li>
  <li><em>"Tell me about your hardest year."</em> — Vulnerability + framing + lessons; not bragging about hardship; specific structural changes you made.</li>
  <li><em>"How do you handle on-call?"</em> — Sustainability + alert hygiene + post-rotation recovery; not "I love being on-call."</li>
  <li><em>"What would you tell a junior engineer about avoiding burnout?"</em> — Trajectory awareness; recovery is part of the work; structural problems need structural fixes; ask for help early.</li>
  <li><em>"Tell me about a time you said no."</em> — Specific scoping + offering alternatives + maintaining relationship; not just "I refused."</li>
  <li><em>"How do you manage your energy?"</em> — Daily / weekly / quarterly rhythm; specific recovery activities; boundaries.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Run the quarterly self-check on yourself; honest answers.</li>
  <li>Identify your top pressure source + trajectory.</li>
  <li>Set or reset one boundary (Slack hours, weekend work, vacation in calendar).</li>
  <li>Schedule the next vacation now; book it.</li>
  <li>Identify 1 person outside work for honest conversations.</li>
  <li>If sleep / mood / energy is concerning: schedule a doctor + therapist appointment.</li>
  <li>If on PIP / abusive manager / toxic team: start the structural plan today (document, talk to lawyer, plan exit).</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read 'Burnout' by the Nagoski sisters for the structural framework."</li>
  <li>"Read 'Why We Sleep' by Matthew Walker for sleep + recovery basics."</li>
  <li>"Read 'The Body Keeps the Score' for trauma understanding (especially for engineers post-outage)."</li>
  <li>"Try a CBT self-help workbook; build the cognitive tools before you need them."</li>
  <li>"Audit your last 4 quarters honestly: was each sustainable? What changed?"</li>
</ul>
`
    }
  ]
});
