window.PREP_SITE.registerTopic({
  id: 'wp-reorgs',
  module: 'workplace',
  title: 'Reorgs & Leadership Changes',
  estimatedReadTime: '35 min',
  tags: ['reorg', 'leadership-change', 'new-manager', 'restructure', 'transition', 'org-chart', 'survival'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>Reorgs are the most common career-shaping event after layoffs. They happen unpredictably (some companies reorg yearly, some quarterly), they reshape who you report to, what you work on, and what you've earned politically. Engineers who handle reorgs well treat them as <em>data</em> + <em>opportunity</em>; engineers who handle them poorly absorb the disruption as personal injury and never recover the half they lost.</p>
<ul>
  <li><strong>Reorgs are normal in tech.</strong> Mid-2020s: most teams experience 1+ reorg/year. Stability is the exception.</li>
  <li><strong>Don't take it personally.</strong> 90% of reorg decisions are about org-level structure, not you specifically.</li>
  <li><strong>Reset political capital.</strong> Old manager's reputation of you doesn't fully transfer. New manager has to be re-earned.</li>
  <li><strong>First 30 days with a new manager are critical.</strong> Establish 1:1 cadence, share working style, demonstrate value early.</li>
  <li><strong>Roadmap commitments may not transfer.</strong> Promises old PM made may be revisited; promises old manager made may be re-evaluated. Re-confirm in writing.</li>
  <li><strong>Promo timing usually slips.</strong> A reorg 6 months before your expected promo packet often pushes promo by 6-12 months. Plan for it.</li>
  <li><strong>Reorgs make some people survivors and some people winners.</strong> The difference is often political positioning, not technical merit.</li>
  <li><strong>Mobile / RN angle:</strong> mobile teams get moved around a lot in reorgs (org owners argue over who "owns mobile"). Have a clear story about your team's value.</li>
</ul>
<p><strong>Mantra:</strong> "Don't panic. Reset relationships. Re-confirm commitments in writing. Use reorgs to renegotiate scope. Plan for promo timing slippage."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>Types of reorg</h3>
<table>
  <thead><tr><th>Type</th><th>Description</th><th>Engineer impact</th></tr></thead>
  <tbody>
    <tr><td><strong>Manager change only</strong></td><td>Your manager leaves / moves; new manager takes over</td><td>Reset 1:1 relationship; everything else stable</td></tr>
    <tr><td><strong>Team merge / split</strong></td><td>Your team merges with another or splits</td><td>New peers, new roadmap; possibly new charter</td></tr>
    <tr><td><strong>Org-level reshuffle</strong></td><td>Multiple teams move under different VP / org</td><td>New leadership chain; possibly new strategy / priorities</td></tr>
    <tr><td><strong>Mission / charter change</strong></td><td>What your team owns changes substantively</td><td>You may be working on something new</td></tr>
    <tr><td><strong>Geography consolidation</strong></td><td>"All mobile is now in [city / office]"</td><td>Possibly relocate or change role</td></tr>
    <tr><td><strong>Functional reorg</strong></td><td>Mobile reports to platform vs. product, or vice versa</td><td>New strategic context</td></tr>
    <tr><td><strong>"Refocus" reorgs</strong></td><td>Often a euphemism for layoffs to follow</td><td>Read the signals carefully (see <a href="#" data-topic="wp-layoffs">Layoff Survival</a>)</td></tr>
    <tr><td><strong>Acquisition integration</strong></td><td>Acquired company being merged into acquirer's structure</td><td>Major upheaval: leveling, comp, culture</td></tr>
  </tbody>
</table>

<h3>Why reorgs happen</h3>
<table>
  <thead><tr><th>Driver</th><th>Pattern</th></tr></thead>
  <tbody>
    <tr><td>New senior leader</td><td>VP wants to "put their stamp on" the org structure (most common driver)</td></tr>
    <tr><td>Strategy shift</td><td>Company moving from growth to efficiency (or vice versa); structure reflects priorities</td></tr>
    <tr><td>Acquisition</td><td>Need to integrate acquired team</td></tr>
    <tr><td>Cost reduction</td><td>Reduce manager layers; widen spans of control</td></tr>
    <tr><td>Performance</td><td>Underperforming org gets reorganized; sometimes a precursor to layoffs</td></tr>
    <tr><td>Politics</td><td>Senior exec wins a turf battle; their org expands</td></tr>
    <tr><td>External signal</td><td>Wall Street rewards "efficiency moves"; company restructures publicly</td></tr>
  </tbody>
</table>
<p>Most reorgs have multiple drivers; the official narrative usually doesn't tell the whole story. Reading the actual driver helps predict what comes next.</p>

<h3>What reorgs reshape</h3>
<ul>
  <li><strong>Reporting chain.</strong> Who your manager is, who your skip is, who your director is.</li>
  <li><strong>Roadmap.</strong> New manager / PM may revisit what you're working on.</li>
  <li><strong>Headcount allocation.</strong> Who gets to hire, who's frozen.</li>
  <li><strong>Promo timing.</strong> Calibration cycles may delay; new manager may not yet have data on you.</li>
  <li><strong>Cross-team relationships.</strong> Partners may have moved too; need to rebuild.</li>
  <li><strong>Political capital.</strong> Old reputation doesn't fully transfer; you start with a partial bank balance.</li>
  <li><strong>Compensation.</strong> Rarely changed by reorg directly, but new leveling + retention possibilities arise.</li>
  <li><strong>Career narrative.</strong> "What I did at [company]" gets re-told as your context changes.</li>
</ul>

<h3>The political reality</h3>
<p>Reorgs aren't neutral. They create winners and losers based on political positioning, not just technical merit:</p>
<ul>
  <li><strong>Winners:</strong> closer to new leadership, on rising-stock projects, in growing areas, with mentor / sponsor in new structure.</li>
  <li><strong>Survivors:</strong> middle of the org, no major change, ride it out.</li>
  <li><strong>Losers:</strong> on de-prioritized projects, lost a sponsor in the move, in shrinking areas, manager who didn't survive the reorg.</li>
</ul>
<p>The skill: read the political map fast, position to be at least a survivor, ideally a winner.</p>

<h3>Why this is its own topic</h3>
<table>
  <thead><tr><th>Reason</th><th>Outcome</th></tr></thead>
  <tbody>
    <tr><td>Reorgs happen 1+ times/year for most engineers</td><td>You'll do this many times in a career; skill compounds</td></tr>
    <tr><td>Each reorg can shift career trajectory by 6-12 months</td><td>Cumulative impact across a career is years</td></tr>
    <tr><td>Reorgs surface promo / leveling questions</td><td>Often the right time to renegotiate level or comp</td></tr>
    <tr><td>Reorgs are precursors to layoffs ~30% of the time</td><td>Reading early signals matters</td></tr>
    <tr><td>Most engineers freeze during reorgs ("wait and see")</td><td>Engineers who act early often capture more value</td></tr>
  </tbody>
</table>

<h3>The mobile / RN angle</h3>
<p>Mobile teams get reorganized more than typical:</p>
<ul>
  <li><strong>"Where does mobile live?"</strong> Platform org? Product org? Per-product? Constantly debated.</li>
  <li><strong>RN-specific reorgs:</strong> teams that adopt or sunset RN often reorganize.</li>
  <li><strong>iOS / Android consolidation:</strong> some companies merge platform-specific teams into cross-platform; some unmerge.</li>
  <li><strong>App ownership disputes:</strong> when one app serves multiple business units, ownership may shift.</li>
  <li><strong>Mobile platform / infra teams</strong> get hit hard in efficiency-driven reorgs ("can we just have the product teams own their own mobile?").</li>
</ul>
<p>Practical implication: have a clear story about why your mobile work matters in business terms, not just technical terms. "We ship faster than [competitor]" is more persuasive in reorgs than "we have a clean state management pattern."</p>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The "reorg phases" model</h3>
<p>Most reorgs follow a predictable arc:</p>
<table>
  <thead><tr><th>Phase</th><th>Timeline</th><th>What's happening</th></tr></thead>
  <tbody>
    <tr><td><strong>1. Rumors</strong></td><td>Weeks before announcement</td><td>Hints in calendar invites, exec prep meetings, slack chatter; often denied</td></tr>
    <tr><td><strong>2. Announcement</strong></td><td>Day 0</td><td>Email or all-hands; high-level structure described</td></tr>
    <tr><td><strong>3. Translation</strong></td><td>Days 1-7</td><td>Manager 1:1s; what does it mean for me; team rosters circulated</td></tr>
    <tr><td><strong>4. Settling</strong></td><td>Weeks 1-4</td><td>New 1:1s; new processes; first new manager OKR cycle</td></tr>
    <tr><td><strong>5. Productivity dip</strong></td><td>Weeks 2-8</td><td>Output slows; everyone re-orienting; backlog grows</td></tr>
    <tr><td><strong>6. Re-baseline</strong></td><td>Months 2-3</td><td>New roadmap finalized; commitments re-set</td></tr>
    <tr><td><strong>7. New normal</strong></td><td>Months 3-6</td><td>People stop talking about the reorg; org runs in new shape</td></tr>
    <tr><td><strong>8. Next reorg</strong></td><td>9-15 months</td><td>Cycle repeats</td></tr>
  </tbody>
</table>

<h3>The "political map" mental model</h3>
<p>Within hours of a reorg announcement, sketch the new political map:</p>
<pre><code>     CEO / SVP
     /       \\
    VP_A     VP_B (your new VP)
     │        │
    Dir_X   Dir_Y (your new director)
     │        │
            Mgr_M (your new manager)
              │
            YOU + peers</code></pre>
<p>For each layer, ask:</p>
<ul>
  <li>Did this person come from the old org or new org?</li>
  <li>What are their reputation / priorities / known biases?</li>
  <li>What relationships do I have with them already?</li>
  <li>Who has their ear (their sponsor / influencer)?</li>
  <li>Are they on the rising-stock track or fighting fires?</li>
</ul>
<p>Within a week of the reorg, you should have answers. They shape your strategy.</p>

<h3>The "rising / falling stock" model</h3>
<p>Within the new org, certain projects / teams / leaders are rising; others falling. Read it.</p>
<table>
  <thead><tr><th>Rising signals</th><th>Falling signals</th></tr></thead>
  <tbody>
    <tr><td>New leadership endorses publicly</td><td>Not mentioned in announcement</td></tr>
    <tr><td>Headcount allocated</td><td>Headcount frozen / shrinking</td></tr>
    <tr><td>Strategic priority in new OKRs</td><td>Mentioned as "maintenance" or "wind-down"</td></tr>
    <tr><td>Sponsor at higher levels</td><td>Sponsor lost in reorg / left company</td></tr>
    <tr><td>Customer-facing / revenue-generating</td><td>Internal / cost-center</td></tr>
    <tr><td>Senior people moving toward it</td><td>Senior people moving away</td></tr>
  </tbody>
</table>
<p>Rising stock = good place to be. Falling stock = consider repositioning. Most engineers ride whichever stock they're on without examining; senior engineers actively assess.</p>

<h3>The "trust bank" reset</h3>
<p>You had political capital with your old manager / org. How much transfers to the new structure?</p>
<table>
  <thead><tr><th>Source</th><th>Transfer rate</th></tr></thead>
  <tbody>
    <tr><td>Code / artifacts you've shipped</td><td>~80% (visible work transfers; new manager can review)</td></tr>
    <tr><td>Old manager's verbal endorsement of you</td><td>~30-50% (some weight; depends on if old manager's reputation is high in new org)</td></tr>
    <tr><td>Reputation across cross-functional partners</td><td>~60% (PM, design relationships transfer; partners may have moved too)</td></tr>
    <tr><td>Calibration history (perf ratings)</td><td>~70% (data exists, but new manager may discount)</td></tr>
    <tr><td>Internal influence / informal authority</td><td>~30% (mostly resets; new context)</td></tr>
    <tr><td>Promo packet in flight</td><td>~50% (may need to be re-pitched)</td></tr>
  </tbody>
</table>
<p>Net: assume you're starting at 50-70% of where you were. The first 60-90 days should be heavy on rebuilding trust.</p>

<h3>The "renegotiate" window</h3>
<p>Reorgs open negotiation windows that don't exist in steady state:</p>
<ul>
  <li><strong>Scope:</strong> "What should I be working on now?" — new manager has to set this; you can influence.</li>
  <li><strong>Level:</strong> "I'm currently at X; given my scope is now Y, can we revisit?"</li>
  <li><strong>Promo case:</strong> If old manager was about to nominate you, push for it to carry forward.</li>
  <li><strong>Project assignment:</strong> "I'd like to lead [Z]; here's why I'm the right person."</li>
  <li><strong>Team move:</strong> Reorgs are when people change teams; if you wanted a different team, ask.</li>
</ul>
<p>The window is open ~30-90 days. After that, things lock back in. Use it.</p>

<h3>The "60-day signal-to-noise" rule</h3>
<p>For the first 60 days after a reorg:</p>
<ul>
  <li><strong>Don't quit reflexively.</strong> First 60 days are noisy; you're not seeing the new normal yet.</li>
  <li><strong>Don't make irreversible commitments.</strong> Big technical bets, headcount asks, public roadmap commitments — wait until things settle.</li>
  <li><strong>Do build relationships.</strong> 1:1s with new peers, manager, skip-level. This is the cheap window.</li>
  <li><strong>Do demonstrate value.</strong> New manager doesn't know you; ship something visible early.</li>
</ul>

<h3>The "no surprises" principle (still applies)</h3>
<p>Same as in stakeholder management — your new manager / leadership should never be surprised by news from anyone other than you. Especially in fragile reorg period:</p>
<ul>
  <li>Risks on your projects → flag early.</li>
  <li>Decisions you're considering → loop them.</li>
  <li>Things you're not happy about → bring to 1:1 before they hear from peers.</li>
</ul>

<h3>The "what's my story?" exercise</h3>
<p>Within 2 weeks of a reorg, you should be able to answer in 60 seconds:</p>
<ul>
  <li>What does my team own in the new structure?</li>
  <li>Why does that matter strategically?</li>
  <li>What am I personally working on?</li>
  <li>What's the visible outcome in 6-12 months?</li>
  <li>How does this ladder to the new VP / director's stated priorities?</li>
</ul>
<p>If you can't answer crisply, you have homework. Find your manager and ask. Senior engineers should walk into any meeting with new leadership able to give this story.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>The reorg-day playbook</h3>
<p>Hour 0-24:</p>
<ol>
  <li><strong>Read the announcement carefully.</strong> Multiple times. The wording matters.</li>
  <li><strong>Identify the structure.</strong> Sketch the new org chart. Save it.</li>
  <li><strong>Don't react publicly.</strong> No DMs venting; no Slack speculation. Anything you say will be remembered + may circulate.</li>
  <li><strong>Schedule a 1:1 with old manager (if departing) within the week.</strong> Ask: what's your read; what should I know; can you help with handoff narrative.</li>
  <li><strong>Schedule a 1:1 with new manager within 2 weeks.</strong> Even if they didn't ask. Don't wait for them to come to you.</li>
  <li><strong>Take stock.</strong> What's my situation? Up? Down? Sideways? What do I want from this reorg?</li>
</ol>

<h3>The first 1:1 with new manager</h3>
<p>This conversation shapes the next 6-12 months. Prep heavily.</p>
<pre><code>Recommended structure (45-60 min):

1. Their context (10 min)
   "What's your background? What's your sense of the org and our team?"
   Listen heavily. Take notes.

2. Your context (15 min)
   "Here's what I've been working on, what I'm proud of, what's
    in flight, where I think I'm going."
   Concrete: ship list, current projects, growth areas.

3. Their working style (10 min)
   "How do you like to work? 1:1 cadence, written vs. verbal,
    when to ping, when to wait?"
   Different managers have radically different prefs.

4. Your working style (5 min)
   "Here's how I work best. Heads-down deep work. Async-first.
    Weekly priority alignment."

5. Open questions / asks (10 min)
   "What's your read on the new direction for our team?"
   "Is there anything you want me to focus on first?"
   "Anything I can do to make your transition easier?"</code></pre>
<p>Also: read up on them before the meeting. LinkedIn, internal directory, any prior projects. Know who you're talking to.</p>

<h3>The 30/60/90-day plan</h3>
<p>For yourself (not just for managers):</p>
<table>
  <thead><tr><th>Timeline</th><th>Focus</th></tr></thead>
  <tbody>
    <tr><td>Days 1-30</td><td>Information. Build map of new org. 1:1 with new manager + 3-5 new peers / cross-functional partners. Understand new priorities.</td></tr>
    <tr><td>Days 30-60</td><td>Demonstrate. Ship something visible. Pick a problem the new manager would care about; solve it.</td></tr>
    <tr><td>Days 60-90</td><td>Negotiate. Scope conversations, level conversations, comp conversations as relevant. Build the next 6-month plan with new manager.</td></tr>
  </tbody>
</table>

<h3>Re-confirming commitments</h3>
<p>After a reorg, anything you "agreed to" with old PM / manager may be revisited. Defenses:</p>
<ul>
  <li><strong>Inventory commitments.</strong> Make a list: deliverables, dates, expected promo, equity refresher conversations, etc.</li>
  <li><strong>Re-raise with new owners.</strong> "Old PM agreed [X] would ship by [date]; want to confirm with you."</li>
  <li><strong>Get in writing.</strong> Email, doc, ticket. Verbal commitments evaporate in transitions.</li>
  <li><strong>Be ready for renegotiation.</strong> New manager may push back; have your case ready.</li>
</ul>

<h3>Your promo packet during reorg</h3>
<p>Promo timing is the most-affected part of a reorg. Patterns:</p>
<ul>
  <li><strong>Old manager nominated; reorg before calibration:</strong> push hard for nomination to carry. Send your packet to new manager + ask them to support.</li>
  <li><strong>Old manager hadn't formalized:</strong> rebuild case with new manager; expect 6-12 month delay.</li>
  <li><strong>New manager doesn't know you:</strong> their natural conservatism = won't put you up first cycle. Plan for 2 cycles.</li>
  <li><strong>Old packet contained projects under old org:</strong> may need to re-frame in new org's language.</li>
</ul>
<p>Practical move: write a "context doc" for new manager describing your work, scope, level case, recent perf history. Saves them time; gives you a fair shot.</p>

<h3>Cross-functional rebuilding</h3>
<p>Your old PM, designer, partner-team contacts may have all moved too. Re-establish:</p>
<ol>
  <li>List your old cross-functional relationships.</li>
  <li>Map: who's still in your orbit? Who moved?</li>
  <li>For new partners: schedule intro 1:1s within 4 weeks.</li>
  <li>For lost partners: brief asynchronous goodbye + offer to help going forward.</li>
  <li>For ongoing projects with old partners now in new org: explicit handoff conversations.</li>
</ol>

<h3>Reading the rumor mill</h3>
<p>Reorgs leak before they're announced. Signals:</p>
<ul>
  <li>Calendar holds with vague titles ("touchbase," "1:1 + 1") for execs.</li>
  <li>Manager 1:1s suddenly canceled or moved.</li>
  <li>Senior leaders stop committing to new projects.</li>
  <li>Hiring freezes "for review."</li>
  <li>HR holding "leadership offsites."</li>
  <li>Slack chatter about "structural changes coming."</li>
</ul>
<p>Don't gossip; do listen. Position yourself before the announcement when possible.</p>

<h3>If you don't like the reorg outcome</h3>
<p>Sometimes the new org isn't where you want to be. Options:</p>
<ol>
  <li><strong>Wait it out.</strong> 60-day rule. Many reorgs feel worse than they are; settle.</li>
  <li><strong>Internal transfer.</strong> If a different team in the company is better fit. Reorg is a natural moment to move.</li>
  <li><strong>Renegotiate scope within new team.</strong> Carve out work you actually want.</li>
  <li><strong>External search.</strong> If reorg signals are genuinely bad (project killed, manager bad, no growth path).</li>
</ol>
<p>Don't make irreversible decisions in week 1. Even if you're going to leave, planning the exit takes 1-3 months and benefits from clarity.</p>

<h3>Reorg as layoff precursor</h3>
<p>Sometimes a "reorg" is a soft layoff signal. Read carefully:</p>
<ul>
  <li>Hiring freezes coinciding with reorg.</li>
  <li>"Efficiency" / "focus" / "cost discipline" language.</li>
  <li>Unusually large org consolidations (multiple teams becoming one).</li>
  <li>Specific roles becoming unclear ("we'll figure out who does what").</li>
  <li>Senior managers leaving "to spend time with family."</li>
</ul>
<p>If signals are bad, treat it as a pre-layoff window. See <a href="#" data-topic="wp-layoffs">Layoff Survival</a>: build buffer, update resume, warm network. Plan for the worst case while hoping for the best.</p>

<h3>Talking to peers about reorg</h3>
<p>Peer conversations during reorg are tricky. Rules:</p>
<ul>
  <li><strong>Don't speculate.</strong> Especially about who might be on the way out.</li>
  <li><strong>Don't gossip about leadership.</strong> Will reach them; will reach your new manager.</li>
  <li><strong>Don't reveal your strategy.</strong> Your "I'm thinking about leaving" comment will travel.</li>
  <li><strong>Be supportive in 1:1s.</strong> Peers are anxious too. Listen more than talk.</li>
  <li><strong>Coordinate where useful.</strong> Joint asks (team carve-out, retention) sometimes work.</li>
</ul>

<h3>The "be useful early" pattern</h3>
<p>New manager has many fires. Be the engineer who removes a fire, not adds one:</p>
<ul>
  <li>Volunteer for the org-chart-mapping work no one wants.</li>
  <li>Offer to onboard the new PM / designer.</li>
  <li>Write the new team-charter doc (you have history; you can capture context).</li>
  <li>Identify and document the cross-functional relationships now in flux.</li>
  <li>Be the calm presence in standup that signals "stability is possible."</li>
</ul>
<p>This positions you as a senior contributor, not a survivor. Pays back in trust banked for next 6-12 months.</p>

<h3>Special case: your manager moved up / left</h3>
<p>If your manager became a director, left the company, or moved sideways without you, the dynamic changes:</p>
<ul>
  <li><strong>Old manager moved up:</strong> they may still sponsor you. Maintain the relationship; useful for future opportunities.</li>
  <li><strong>Old manager left for another company:</strong> they may want to hire you later. Stay in touch (LinkedIn, occasional 1:1).</li>
  <li><strong>Old manager moved sideways:</strong> mixed; depends on their political weight in new structure.</li>
  <li><strong>Old manager removed:</strong> note carefully; can be a reorg-pre-layoff signal.</li>
</ul>

<h3>Special case: you got moved into a different mission</h3>
<p>Sometimes a reorg drops you into a team / charter you didn't choose. Options:</p>
<ul>
  <li><strong>Stay and adapt.</strong> Sometimes the new mission is fine; give it 60 days.</li>
  <li><strong>Negotiate scope within new team.</strong> Carve work you can engage with.</li>
  <li><strong>Internal transfer to old / preferred area.</strong> Often allowed; ask.</li>
  <li><strong>External search.</strong> If new mission is fundamentally wrong fit.</li>
</ul>

<h3>The org-chart mapping ritual</h3>
<p>After every reorg, spend 30-60 minutes:</p>
<ol>
  <li>Draw the new org chart down to your level + 2 levels up.</li>
  <li>Annotate: who came from where; old org, new hire, etc.</li>
  <li>Note: who has a sponsor where, who you have rapport with, who's known to be good/difficult.</li>
  <li>Save as a private doc; update over the first 90 days as you learn more.</li>
</ol>
<p>This is intelligence work. It's worth the time.</p>
`
    },
    {
      id: 'examples',
      title: '🔍 Worked Examples',
      html: `
<h3>Example 1: Full reorg announcement, day 1</h3>
<p><strong>Setup:</strong> 9am email from CEO. New org structure. Your team merges with another; new manager is the other team's lead (you've worked with them at arm's length, never directly). New VP from outside the company.</p>

<p><strong>Day 1 actions:</strong></p>
<ol>
  <li><strong>Read the email twice.</strong> Note exact wording for your team's mission. Save the email + org chart.</li>
  <li><strong>Skip the Slack vent thread.</strong> Don't post; even reactions get noticed.</li>
  <li><strong>Slack to old manager:</strong> "Got the news. Want to chat in our 1:1 tomorrow about transition + handoff." Brief.</li>
  <li><strong>Slack to new manager:</strong> "Looking forward to working together. Excited to discuss in our first 1:1. Setting up time on your calendar this week / next."</li>
  <li><strong>Schedule 1:1.</strong> Book 30 min with new manager within 2 weeks.</li>
  <li><strong>Take stock privately.</strong> What's my situation? Project still live? Promo case still viable? New mission make sense to me?</li>
</ol>

<p><strong>Day 1 NOT to do:</strong></p>
<ul>
  <li>Don't send long emotional emails to anyone.</li>
  <li>Don't make big technical decisions.</li>
  <li>Don't quit / start interviewing without 60 days of data.</li>
  <li>Don't gossip.</li>
</ul>

<h3>Example 2: First 1:1 with new manager</h3>
<p><strong>Setup:</strong> Two weeks post-reorg. First 1:1 with new manager. They came from another team; don't know your work in detail.</p>

<p><strong>Pre-meeting prep:</strong></p>
<ul>
  <li>1-page doc: who you are, what you've shipped, current projects, growth direction.</li>
  <li>Read their LinkedIn + internal directory.</li>
  <li>Skim their last team's known work.</li>
  <li>Identify 3-4 questions to learn from them.</li>
</ul>

<p><strong>Meeting flow:</strong></p>
<pre><code>Manager: "Tell me about yourself."

You: [Walk through 1-page doc you brought.]
     "Here's who I am, ship list past 12 months, current focus,
      where I want to grow. Sent the doc Friday — happy to discuss
      anything in depth."

Manager: [Asks specific questions about projects.]
         [Asks about old manager / team dynamic.]

You: [Answer factually, don't bad-mouth anyone.]
     "Old manager and I worked well; I have my perf doc + ratings
      I can share if useful. Would be happy to set up a transition
      conversation between you two for context if useful."

Manager: "What about working style?"

You: "I'm async-first; deep work blocks in morning; weekly written
      status; flag risks early. Prefer 1:1s every 2 weeks unless
      something's heating up.

      How do you prefer to work?"

Manager: [Shares.]

You: "Two questions for you:
      1. What's your read on our team's mission post-reorg?
      2. Anything you want me focused on first 30 days?"

Manager: [Answers.]

You: [Note answers carefully. They're your operating instructions
      for the next 90 days.]</code></pre>

<p><strong>Outcome:</strong> Clear cadence; clear expectations; you've shown competence + initiative. New manager's mental file on you starts as "competent senior who handled the transition well."</p>

<h3>Example 3: Promo packet caught in reorg</h3>
<p><strong>Setup:</strong> Old manager had nominated you for senior staff. Calibration was 6 weeks away. Reorg moves you to new manager who doesn't know you.</p>

<p><strong>Bad: assume the promo carries forward.</strong> 80% chance the new manager doesn't push for it.</p>

<p><strong>Good: actively manage the handoff.</strong></p>
<pre><code>1. With old manager (final 1:1):
   "I want to make sure my promo case doesn't get lost. Three asks:
    a) Will you write a memo to new manager handing off your view
       of my case?
    b) Will you advocate at calibration if you're still in the room?
    c) Can you flag this to skip-level so they're aware?"

2. With new manager (first 1:1):
   "Heads up — old manager had nominated me for senior staff this
    cycle. Don't expect you to take that on faith — happy to walk
    you through the case. Here's my packet draft. What do you need
    from me to evaluate?"

3. With skip / director:
   "Quick FYI for context: old manager and I had been working toward
    senior staff this cycle. Want to make sure new manager has the
    context. Happy to share my packet if useful."

4. Write a comprehensive packet:
   - Scope evidence
   - Impact narrative
   - Peer endorsements (especially from peers who didn't move teams)
   - Project ledger</code></pre>

<p><strong>Outcome:</strong> 50% chance promo carries. 50% chance it slips one cycle. Either way, you've made the case + built relationship. The 50% slip is the cost of reorg, not of poor execution.</p>

<h3>Example 4: Renegotiating scope after reorg</h3>
<p><strong>Setup:</strong> Reorg moves you to a team owning a less interesting product area. You can stay quiet and absorb, or push for scope you'd prefer.</p>

<p><strong>Window action — first 60 days:</strong></p>
<pre><code>1:1 with new manager (week 4):

"Want to share thinking about my scope. The new charter looks
focused on [maintenance area X]. I'm strongest in / most excited
about [area Y]. Three things I'd love to discuss:

1. Is there room for me to lead [Y] within the new team?
2. If not, who currently owns [Y] in the new structure? Is a
   transfer something we'd consider?
3. Otherwise, can we carve out a project in [Y] adjacent space
   for me to drive over the next 6 months?

I'm committed to the team and excited to make it work; want to
make sure I'm contributing where my strengths are."</code></pre>

<p><strong>Outcome:</strong> Often manager finds something. Reorg is the natural negotiation moment; doors are open that wouldn't be in steady state. Worst case: nothing changes; best case: meaningfully better scope.</p>

<h3>Example 5: Reading reorg-as-layoff-signal</h3>
<p><strong>Setup:</strong> Reorg announcement. Specific signals:</p>
<ul>
  <li>Hiring frozen across the org.</li>
  <li>Wording: "doing more with less" + "operational efficiency."</li>
  <li>Two manager layers consolidated into one.</li>
  <li>Several recently-active projects suddenly "deprioritized."</li>
  <li>2 senior people "departing to pursue other opportunities" announced same week.</li>
</ul>

<p><strong>Read:</strong> reorg is structurally setting up for layoff. Likely cuts within 3-6 months.</p>

<p><strong>Action:</strong></p>
<ol>
  <li>Quietly run the layoff-prep checklist (see <a href="#" data-topic="wp-layoffs">Layoff Survival</a>).</li>
  <li>Make sure you're on visible projects (rising-stock).</li>
  <li>Build / refresh financial buffer.</li>
  <li>Refresh resume; warm 5-10 contacts in network.</li>
  <li>Do NOT panic / quit; just prepare.</li>
  <li>Continue executing well — best position whether you stay or are cut.</li>
</ol>

<h3>Example 6: Mobile team reorg into platform vs. product</h3>
<p><strong>Setup:</strong> Mobile platform team gets dissolved into per-product mobile teams. You were on platform; now you'll be embedded in a product team.</p>

<p><strong>Concerns:</strong></p>
<ul>
  <li>Your platform expertise less valued in product team.</li>
  <li>Career path for "mobile platform" engineer unclear.</li>
  <li>Cross-product mobile coordination breaks down.</li>
</ul>

<p><strong>Strategic responses:</strong></p>
<ul>
  <li><strong>Reframe your value.</strong> "I'm a senior mobile engineer with deep platform knowledge that benefits this product." Not "I'm a platform engineer who got moved."</li>
  <li><strong>Volunteer to be the cross-team mobile leader.</strong> If platform breaks down, someone has to coordinate; offer to be that person, formally or informally.</li>
  <li><strong>Network with other mobile engineers</strong> embedded in other products. Form an unofficial guild.</li>
  <li><strong>Push for an explicit "mobile lead" role</strong> in the new structure. Sometimes orgs need to rebuild what they dissolved.</li>
  <li><strong>If the mobile mission is genuinely gone</strong> — consider transferring to a more mobile-focused team or company.</li>
</ul>

<h3>Example 7: New skip-level meeting</h3>
<p><strong>Setup:</strong> New director schedules introductory 1:1 with you. 30 min.</p>

<p><strong>Prep:</strong></p>
<ul>
  <li>Read their internal bio + recent talks / posts.</li>
  <li>Have your 60-second story ready: what you do, what you're proud of, where you're going.</li>
  <li>Have one substantive question about org strategy.</li>
  <li>Have one ask (small) — give them a way to be helpful.</li>
</ul>

<p><strong>Conversation flow:</strong></p>
<pre><code>Director: "Tell me about yourself."

You: [60-second story; concrete projects + outcomes.]

Director: [Asks something or moves on.]

You: "I read [their recent post / mention]. The framing on [X]
     resonated. How does that connect to what you're thinking
     for our org?"

Director: [Talks about strategy.]

You: [Listen carefully. This is your leadership signal-reading.]

You: "One quick ask while we have time: [small specific ask, like
     intro to another senior leader or input on a doc].
     Wanted to make this useful for both of us, not just intro."

Director: [Hopefully says yes; if not, moves on.]</code></pre>

<p><strong>Why:</strong> 60-second story is the calibration data point director needs; substantive question shows you're paying attention; ask gives a concrete next step.</p>

<h3>Example 8: Six months post-reorg retrospective</h3>
<p><strong>Setup:</strong> 6 months after reorg. Time to assess.</p>

<p><strong>Self-questions:</strong></p>
<table>
  <thead><tr><th>Question</th><th>Action</th></tr></thead>
  <tbody>
    <tr><td>Am I trusted by new manager?</td><td>If yes, push for next-level work / promo. If no, work on it.</td></tr>
    <tr><td>Am I working on something interesting?</td><td>If no, renegotiate scope; might be late for the open window.</td></tr>
    <tr><td>Has team mission stabilized?</td><td>If no, more reorg may be coming; stay vigilant.</td></tr>
    <tr><td>Is my comp / level still appropriate?</td><td>If meaningfully behind market, time for a comp conversation or external interviewing.</td></tr>
    <tr><td>Cross-functional relationships rebuilt?</td><td>If no, schedule the missing 1:1s now.</td></tr>
    <tr><td>Promo packet rebuilt for new context?</td><td>If no, start now; need 6-12 months of new-org evidence for next cycle.</td></tr>
  </tbody>
</table>

<p>This is when "reorg as opportunity" pays off — you've absorbed the disruption and now you're ready to capitalize on the new structure.</p>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Reorg back-to-back</h3>
<p>Some companies reorg every 6 months. The disruption compounds.</p>
<ul>
  <li><strong>Don't fully reset every cycle.</strong> Maintain core relationships across reorgs; don't burn bridges.</li>
  <li><strong>Develop "reorg veterans" patterns.</strong> Faster intake of new structure; less emotional churn.</li>
  <li><strong>Ask whether the company's reorg cadence is sustainable.</strong> If structurally chaotic, may be a signal about the company.</li>
  <li><strong>Promo timing in serial-reorg companies</strong> is brutal. Plan for 2-3x the nominal time-to-promo.</li>
</ul>

<h3>Manager removed mid-cycle</h3>
<p>Manager fired, demoted, or moved without warning. Often awkward.</p>
<ul>
  <li><strong>Don't gossip about the cause.</strong> Speculation gets back; speculative narratives stick.</li>
  <li><strong>Identify interim manager fast.</strong> Sometimes skip-level fills until permanent replacement.</li>
  <li><strong>Be cautious about commitments made by departing manager.</strong> Re-confirm with skip / interim.</li>
  <li><strong>Don't transfer loyalty wholesale.</strong> Keep your judgment; even if old manager was good, criticizing decision to remove them rarely helps you.</li>
</ul>

<h3>You become a manager via reorg</h3>
<p>Sometimes reorg promotes you into management without you actively pursuing it.</p>
<ul>
  <li><strong>Decide if you want the role.</strong> Saying yes by default is a 5-year decision.</li>
  <li><strong>Negotiate timing.</strong> "I'd like to be acting manager for 6 months before deciding to formalize" is sometimes possible.</li>
  <li><strong>Don't lose your IC career capital.</strong> If you go to management and want to come back to IC later, plan it.</li>
</ul>

<h3>Your team got dissolved</h3>
<p>Worst-case structural reorg: your specific team / charter ceased to exist; engineers re-allocated to other teams.</p>
<ul>
  <li><strong>Negotiate where you go.</strong> Don't accept assignment; shop teams.</li>
  <li><strong>Use the moment for a new charter.</strong> Sometimes you can pitch yourself into a desired team / role.</li>
  <li><strong>Watch for layoff signals.</strong> Team-dissolution is sometimes followed by individual cuts.</li>
  <li><strong>Document team's work.</strong> Even if dissolved, the work shipped — it's still yours for promo / interview narratives.</li>
</ul>

<h3>You lose your sponsor</h3>
<p>Senior person who was advocating for you (mentor, skip, exec) leaves or moves out of the chain.</p>
<ul>
  <li><strong>Stay in touch with them.</strong> They're a future reference + potentially a future hire-in.</li>
  <li><strong>Build new sponsor relationships.</strong> Sponsor diversity matters; don't have a single point of failure.</li>
  <li><strong>Promo case may need rebuild.</strong> Sponsor's voice in calibration is gone; you need a new one.</li>
</ul>

<h3>The "fake" reorg</h3>
<p>Some reorgs are cosmetic — same people, same work, just renamed boxes on org chart.</p>
<ul>
  <li><strong>Don't over-react.</strong> If nothing real changed, nothing real changed.</li>
  <li><strong>Use the announcement as social cover</strong> to do nothing different.</li>
  <li><strong>Note the pattern.</strong> Companies that fake-reorg often have other dysfunctions.</li>
</ul>

<h3>Cross-org dependency you owned vanishes</h3>
<p>You were the contact / lead for a cross-org dependency. Reorg moves the other team's owner; new owner doesn't know you / doesn't prioritize you.</p>
<ul>
  <li><strong>Re-introduce yourself.</strong> Don't assume continuity.</li>
  <li><strong>Re-pitch the dependency's importance.</strong> New owner may not prioritize what old one did.</li>
  <li><strong>Loop your manager.</strong> Sometimes manager-level engagement needed to reset cross-org expectations.</li>
</ul>

<h3>Acquired into an acquirer's reorg</h3>
<p>You were acquired; now the acquirer is reorganizing including your acquired team.</p>
<ul>
  <li><strong>Acquired engineers face two transitions:</strong> acquisition itself + the subsequent reorg. Compounded.</li>
  <li><strong>Retention packages</strong> may have specific terms about role / team stability; check.</li>
  <li><strong>Leveling re-evaluation</strong> may favor or disfavor you; advocate carefully.</li>
  <li><strong>Cultural integration</strong> can fail post-reorg. If the acquirer culture isn't a fit, exit timing matters (vest cliffs, etc.).</li>
</ul>

<h3>Geography reorg</h3>
<p>Company decides "all of [function] moves to [city]." If you're not in that city:</p>
<ul>
  <li><strong>Negotiate remote.</strong> Sometimes possible; depends on culture + role.</li>
  <li><strong>Negotiate relocation.</strong> Get fully-paid + family-supported package, not just airfare.</li>
  <li><strong>Negotiate severance.</strong> If you can't / won't move, sometimes a severance package is offered.</li>
  <li><strong>Decide on values.</strong> Career vs. life-stage / family / location preferences. Reorg-driven moves are real career events.</li>
</ul>

<h3>Diversity / inclusion impact in reorgs</h3>
<p>Reorgs disproportionately affect underrepresented groups when:</p>
<ul>
  <li>Last-in-first-out cuts hit junior + diverse hires.</li>
  <li>Manager-changes unwind sponsor relationships that were carefully built.</li>
  <li>"Culture fit" of new leadership trends toward homogeneous patterns.</li>
</ul>
<p>If you observe pattern, surface to manager / HR / D&I lead. Reorgs can erode diversity gains; counter-pressure helps.</p>

<h3>The "rest and vest" reorg</h3>
<p>Sometimes you're moved into a less-active role / team where the comp continues but the work is reduced. Tempting in the short term; corrosive long-term.</p>
<ul>
  <li><strong>Don't drift into rest-and-vest.</strong> Your skills atrophy; future market value drops.</li>
  <li><strong>Use the time intentionally.</strong> If genuinely lower load, build something visible / learn a new area.</li>
  <li><strong>Time-box.</strong> Decide max 6-12 months; either re-engage or transition out.</li>
</ul>

<h3>Reorg reveals your manager was the only thing keeping you happy</h3>
<p>Sometimes a great manager is what made an otherwise-meh job tolerable. When they leave:</p>
<ul>
  <li><strong>Notice the realization.</strong> "It was the manager."</li>
  <li><strong>Decide:</strong> can the new situation work? Or was old manager structural support that's now gone?</li>
  <li><strong>Don't decide immediately.</strong> 60-day rule.</li>
  <li><strong>If structural answer is "this won't work without [manager]":</strong> plan exit deliberately.</li>
</ul>
`
    },
    {
      id: 'bugs',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Anti-pattern: panic-quitting in week 1</h3>
<p><strong>Looks like:</strong> Reorg announced; you DM-resignations to peers within 24 hours.</p>
<p><strong>Why bad:</strong> Don't yet have the data. Maybe new role is fine. Maybe pre-emptive exit costs you a graceful transition.</p>
<p><strong>Fix:</strong> 60-day rule. Even if you're going to leave, plan it deliberately.</p>

<h3>Anti-pattern: public venting</h3>
<p><strong>Looks like:</strong> Slack/Twitter/Blind posts about how dumb the reorg is.</p>
<p><strong>Why bad:</strong> Will be screen-shotted. Will reach new manager. Will affect future references.</p>
<p><strong>Fix:</strong> Vent privately to 1-2 trusted friends only. Public channel is permanent.</p>

<h3>Anti-pattern: passive waiting</h3>
<p><strong>Looks like:</strong> Don't reach out to new manager; wait for them to come to you.</p>
<p><strong>Why bad:</strong> New manager has 6+ direct reports; will notice the proactive ones first.</p>
<p><strong>Fix:</strong> Schedule the 1:1. Send the context doc. Be the easy one.</p>

<h3>Anti-pattern: gossiping about leadership decisions</h3>
<p><strong>Looks like:</strong> "I think VP Y did this because they want to push out X..."</p>
<p><strong>Why bad:</strong> Specific speculations get repeated. Eventually reach VP. Speculations sometimes stick to you.</p>
<p><strong>Fix:</strong> Stay factual + curious. "Interesting structure; let's see how it plays out."</p>

<h3>Anti-pattern: bad-mouthing old manager / team to new manager</h3>
<p><strong>Looks like:</strong> Use the transition as a chance to vent about old situation.</p>
<p><strong>Why bad:</strong> New manager learns "this person bad-mouths." Even if old situation was bad, the signal you give is "I'm a complainer."</p>
<p><strong>Fix:</strong> Speak factually about what you did + what worked. If asked about old manager / team, brief + neutral. Never trash-talk.</p>

<h3>Anti-pattern: assuming old commitments hold</h3>
<p><strong>Looks like:</strong> Old manager promised promo / equity refresh / project — assume new manager will follow through.</p>
<p><strong>Why bad:</strong> New manager doesn't know; doesn't owe; doesn't have political capital to spend on something they didn't decide.</p>
<p><strong>Fix:</strong> Re-confirm everything. In writing. Politely.</p>

<h3>Anti-pattern: hiding from new leadership</h3>
<p><strong>Looks like:</strong> Try to "stay invisible" until things settle.</p>
<p><strong>Why bad:</strong> Invisible engineers don't get sponsored, promoted, or protected in next reorg.</p>
<p><strong>Fix:</strong> Be visible. Take a 1:1 with new skip; volunteer for a high-visibility task; ship something concrete.</p>

<h3>Anti-pattern: waiting too long for the renegotiation window</h3>
<p><strong>Looks like:</strong> 6 months in, decide to ask for level / scope / comp adjustment.</p>
<p><strong>Why bad:</strong> Window closed. Steady-state asks are harder than transition-state asks.</p>
<p><strong>Fix:</strong> First 30-90 days are open-window time. Ask now or accept the new normal.</p>

<h3>Anti-pattern: holding grudges across reorgs</h3>
<p><strong>Looks like:</strong> "X screwed me in the last reorg; I'll never trust them."</p>
<p><strong>Why bad:</strong> Tech is small; people come back into your orbit. Permanent grudges limit your network.</p>
<p><strong>Fix:</strong> Be professional with everyone, even those you don't trust. Manage interactions; don't burn bridges.</p>

<h3>Anti-pattern: defining yourself by your old team</h3>
<p><strong>Looks like:</strong> "I'm a [old platform] engineer" 6 months after team dissolved.</p>
<p><strong>Why bad:</strong> Org has moved on; clinging to old identity slows your re-positioning.</p>
<p><strong>Fix:</strong> Update your identity. "I led [X work] on [new team]" — present tense.</p>

<h3>Anti-pattern: status quo bias</h3>
<p><strong>Looks like:</strong> Push back on anything new; "we used to do it this way."</p>
<p><strong>Why bad:</strong> Reads as resistant / hard-to-change. New leadership wants to see flexibility.</p>
<p><strong>Fix:</strong> Engage with new approaches. Push back on specific decisions if needed; don't reflexively oppose change.</p>

<h3>Anti-pattern: trying to recreate old team in new context</h3>
<p><strong>Looks like:</strong> Try to recreate old norms / processes / culture wholesale in new team.</p>
<p><strong>Why bad:</strong> Doesn't fit new context. Often comes across as not-yet-onboarded.</p>
<p><strong>Fix:</strong> Bring the principles; don't impose the artifacts. New team will develop its own version.</p>

<h3>Anti-pattern: refusing to acknowledge reorg's impact</h3>
<p><strong>Looks like:</strong> "Nothing has changed for me." Project, manager, team all changed; pretend it didn't.</p>
<p><strong>Why bad:</strong> Self-deception. Doesn't position you for the renegotiation window.</p>
<p><strong>Fix:</strong> Honest assessment. Things did change. Now what?</p>

<h3>Anti-pattern: panicking and making bad decisions</h3>
<p><strong>Looks like:</strong> Take the first external offer. Or quit without a plan. Or commit to a stretch role you can't deliver.</p>
<p><strong>Why bad:</strong> Decisions made in fear are usually wrong. Six months later you regret.</p>
<p><strong>Fix:</strong> Reset emotionally before deciding. 60-day rule. Big decisions in calm states only.</p>

<h3>Anti-pattern: wishing the reorg "undone"</h3>
<p><strong>Looks like:</strong> Months in, still framing every challenge as "if only the reorg hadn't happened."</p>
<p><strong>Why bad:</strong> Stuck in the past. Doesn't help current situation.</p>
<p><strong>Fix:</strong> Reorg happened. Now what's the play? Acceptance + planning beats nostalgia.</p>

<h3>Anti-pattern: skipping cross-functional reset</h3>
<p><strong>Looks like:</strong> Focus on new manager only; ignore that PM, design, partner teams have also shifted.</p>
<p><strong>Why bad:</strong> Cross-functional partners are 50% of your work. Reset matters there too.</p>
<p><strong>Fix:</strong> List cross-functional contacts; schedule reset 1:1s with the most important.</p>

<h3>Anti-pattern: not updating your career narrative</h3>
<p><strong>Looks like:</strong> External resume / LinkedIn still describes your old team / role.</p>
<p><strong>Why bad:</strong> If you decide to look elsewhere in 6-12 months, your story is stale.</p>
<p><strong>Fix:</strong> Update narrative continuously. New scope, new accomplishments, new framing. Your future self benefits.</p>
`
    },
    {
      id: 'interview',
      title: '🎤 Interview Patterns',
      html: `
<h3>"Tell me about a time you adapted to a major change at work"</h3>
<p>Common at senior+ behavioral. Reorg = canonical example.</p>

<h4>Strong answer template</h4>
<ol>
  <li>Setup: the change (reorg, leadership change, mission change).</li>
  <li>Initial situation: what was disrupted; what you stood to lose.</li>
  <li>Your actions: how you stabilized, learned new context, repositioned.</li>
  <li>Result: where you ended up; what value you delivered.</li>
  <li>Reflection: what you learned about navigating change.</li>
</ol>

<h4>Example</h4>
<pre><code>"Last year my team — a mobile platform team I'd been on for 18
months — was dissolved as part of an org reorg. I'd been on track
for senior staff promotion. New structure embedded mobile engineers
into product teams; I was assigned to a product I didn't know.

The disruption: lost manager who'd been advocating for me; lost
peers who'd done the technical groundwork for my promo case;
mission shifted from platform infra to product features.

What I did over the first 90 days:
- Week 1: scheduled 1:1 with new manager; sent her a context doc
  about my history, current state, and growth direction.
- Week 2: had handoff conversations with old manager + peers about
  in-flight commitments.
- Weeks 3-4: 1:1s with new peers + cross-functional partners.
  Mapped the new dependency graph.
- Weeks 4-8: shipped a focused project that demonstrated value to
  new manager — picked something at intersection of my old skills
  + new team needs.
- Weeks 8-12: had explicit conversation with new manager about
  promo case; she requested a full packet, evaluated, and
  ultimately put me up the next cycle (about 4 months delay).

Outcome: promoted to senior staff one cycle later than originally
planned. Got broader scope in new role than I would have had on
old team. New manager became a strong sponsor.

What I learned: reorgs are reset events but also negotiation
windows. Engineers who panic lose ground; engineers who treat them
as opportunities often come out ahead. The 4-month promo delay
was painful, but the role-and-scope outcome was actually better."</code></pre>

<h4>What interviewers want to hear</h4>
<ul>
  <li>You didn't panic.</li>
  <li>You acted methodically (1:1s, context docs, ship visible work).</li>
  <li>You renegotiated explicitly when the window was open.</li>
  <li>You can hold long view (4-month delay vs. 5-year career).</li>
  <li>You can name a learning.</li>
</ul>

<h3>"How do you handle a new manager"</h3>
<pre><code>"Three things: build a relationship fast, share context proactively,
adapt to their style.

Specifically: I schedule a 1:1 within 2 weeks of them starting,
even if they don't ask. I send a 1-page context doc — who I am,
ship history, current focus, growth direction. In that first 1:1,
I ask their working style — sync vs. async, 1:1 cadence, when to
ping. And I ask what their priorities are first 30/60/90 days so I
can support them.

In the next 60 days I focus on shipping something visible — gives
them concrete data to evaluate me, not just my self-narrative.

I also adapt my own style. Same engineer can present differently
to different managers. Some want detail; some want headlines.
Reading the manager and adjusting is a senior-level skill."</code></pre>

<h3>"Tell me about a difficult organizational change"</h3>
<p>Variant on reorg question. Same structure.</p>
<pre><code>"Two years ago, our acquired company was integrated into the
acquirer's structure. The integration triggered three reorgs in
12 months. Engineering culture clashed; comp was re-leveled;
many original team members left.

I focused on three things during the chaos:
1. Maintain output. Continue shipping; quality of work is the
   one thing fully under my control.
2. Build relationships in new org. Invested deliberately in 1:1s
   with new peers + cross-functional partners.
3. Document everything. Decisions, commitments, agreements — all
   in writing, because verbal commitments evaporate in transitions.

After 12 months, I was one of the few originals still around;
came out with a strong reputation in the new structure. The
documentation discipline was the most important thing — I had
context that others lost in the transitions, which made me
indispensable in some discussions.

What I learned: in chaos, the boring discipline (1:1s, docs,
output) is what compounds. The dramatic moves (quitting, escalating,
politicking) often don't pan out."</code></pre>

<h3>"How do you stay productive when org structure is unstable"</h3>
<pre><code>"Three principles. First, focus on what you can control — code
quality, project execution, team relationships. Org structure
isn't yours; output is.

Second, lower the cost of change. Build modular code, document
decisions, write things down. So when leadership / team / scope
shifts, your context survives.

Third, treat change as data. Each reorg tells you something about
where the company is headed. Read the signals; adjust your
positioning. Don't fight the structure; understand it.

Practically: I keep a running 'org map' doc updated whenever I
hear of changes. Saves me 'wait what just happened' time when the
next change hits."</code></pre>

<h3>"What would you do in your first 30 days under a new VP"</h3>
<p>Common in staff+ interviews.</p>
<pre><code>"Three goals.

Week 1: information gathering. 1:1s with new VP, peer staff
engineers, key cross-functional leaders. Understand their priorities.
Ask: what's working, what's not, what would success in 6 months
look like.

Weeks 2-3: surface myself. Send VP a context doc — what my team
owns, what we shipped last 6 months, current bets, key risks.
Get on their calendar for a 30-min substantive conversation.

Weeks 3-4: ship a quick visible win. Something clean and aligned
to their stated priorities. Demonstrates I can execute; gives them
a calibration data point.

Throughout: don't over-commit. New VP will want to make changes;
some of those changes may de-prioritize work I've championed.
Stay flexible; don't anchor too hard on inherited plans."</code></pre>

<h3>"How do you decide whether to stay or leave after a reorg"</h3>
<pre><code>"60-day rule. Don't make irreversible decisions in week 1; the
data isn't there yet.

After 60-90 days, I assess against four criteria:
1. Is the new mission interesting / does it ladder to my growth?
2. Is the new manager / leadership someone I'd choose to work
   under?
3. Is the comp / level / promo path still on track?
4. Is the team's stock rising or falling?

If 3-4 of those are positive, stay. If 2 or fewer, plan exit
(deliberately, not impulsively).

Worth noting: 'wait it out' is sometimes the right call. Reorgs
settle; situations improve. But if the structural answer is
clearly bad after 90 days, ignoring that hurts long-term."</code></pre>

<h3>Common follow-ups</h3>
<table>
  <thead><tr><th>Question</th><th>What they're checking</th></tr></thead>
  <tbody>
    <tr><td>"How do you handle losing a sponsor?"</td><td>Adaptability + sponsor diversity awareness</td></tr>
    <tr><td>"Have you ever managed up to a new manager well?"</td><td>Self-management skills</td></tr>
    <tr><td>"How do you give context to incoming leadership?"</td><td>Can you write a 1-pager / 60-second pitch?</td></tr>
    <tr><td>"What's the first thing you do in a reorg?"</td><td>Whether you have a playbook or react</td></tr>
    <tr><td>"How do you protect team morale during reorg?"</td><td>Leadership signal (especially for staff+ / managerial)</td></tr>
    <tr><td>"What would make you leave a job?"</td><td>Self-awareness about deal-breakers</td></tr>
  </tbody>
</table>

<h3>The 30-second mantra</h3>
<p><em>"Don't panic. Read the structure. Reset relationships. Re-confirm commitments. Use the renegotiation window. 60-day rule on big decisions."</em></p>
<p>Reorgs are the most common career-shaping event after layoffs. Engineers who develop reorg muscle handle them with calm competence; engineers who don't lose months of momentum each time. Build the muscle.</p>
`
    }
  ]
});
