window.PREP_SITE.registerTopic({
  id: 'wp-visibility',
  module: 'workplace',
  title: 'Visibility & Self-Promotion',
  estimatedReadTime: '35 min',
  tags: ['visibility', 'self-promotion', 'career', 'sponsor', 'network', 'brag-doc', 'narrative'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>The good engineer who is invisible underperforms the average engineer who is well-known. This isn't fair, but it's the system. Visibility is not bragging; it's the work of making sure your work is <em>knowable</em>. Decisions about your career — promo, scope, comp, retention — are made by people who don't see your code. They see your visibility artifacts: docs, talks, demos, peer endorsements, the "I shipped X" thread. Your job is to ensure those artifacts represent the value you create.</p>
<ul>
  <li><strong>Quiet excellence is invisible.</strong> If your work isn't visible, it doesn't exist for promo / comp / opportunity decisions.</li>
  <li><strong>Visibility ≠ self-promotion bombast.</strong> Best visibility is factual, helpful to others, and ladder-aligned to org goals.</li>
  <li><strong>Brag doc.</strong> Write down your wins as you go; otherwise they're forgotten by review time.</li>
  <li><strong>Narrative > list.</strong> A coherent story about your impact beats a 30-bullet shipped-features list.</li>
  <li><strong>Sponsors > mentors.</strong> Mentors give advice; sponsors advocate for you in rooms you're not in. Build sponsorship deliberately.</li>
  <li><strong>Internal visibility</strong> drives promo + scope. <strong>External visibility</strong> drives comp + future job offers. Both matter at different career stages.</li>
  <li><strong>Mobile / RN engineers face specific visibility challenges:</strong> often work in a smaller niche; need to actively pull mobile work into broader visibility.</li>
  <li><strong>The "halo" of high-visibility teams</strong> often outweighs individual performance. Choose teams with rising-stock when possible.</li>
</ul>
<p><strong>Mantra:</strong> "Do good work, then make it knowable. Maintain a brag doc. Build sponsors. Tell a coherent narrative. Pick visible teams. External presence at staff+."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>The "good work isn't enough" reality</h3>
<p>The engineering myth: do good work, get rewarded. Reality: do good work + make it visible, get rewarded.</p>
<p>Why visibility matters even when work is excellent:</p>
<ul>
  <li><strong>Reviewers can't see most of your work.</strong> Code review samples some; design docs sample some; output is invisible most of the time.</li>
  <li><strong>Calibration involves people who never met you.</strong> Senior managers from other teams vote on your level. They go on artifacts.</li>
  <li><strong>Memory decays.</strong> Things you shipped 6 months ago aren't fresh in anyone's mind by review time. You have to bring them back.</li>
  <li><strong>Comparison happens against visible others.</strong> If your peer is louder, even with weaker output, calibration may favor them.</li>
  <li><strong>Sponsors need ammunition.</strong> Your manager / mentor advocating for you needs concrete artifacts to point at.</li>
</ul>

<h3>The visibility spectrum</h3>
<table>
  <thead><tr><th>Level</th><th>Pattern</th><th>Career outcome</th></tr></thead>
  <tbody>
    <tr><td>Invisible</td><td>Heads-down only; never updates anyone</td><td>Underleveled; under-comped; first to be cut</td></tr>
    <tr><td>Quiet</td><td>Ships solid work; rare communication</td><td>Steady but slow career trajectory</td></tr>
    <tr><td>Healthy visibility</td><td>Regular updates; demos; brag doc; well-respected</td><td>Promoted at appropriate cadence; strong reputation</td></tr>
    <tr><td>Self-promotional</td><td>Excessive Slacks about own work; takes credit aggressively</td><td>Mixed; sometimes succeeds short-term, eventually backlash</td></tr>
    <tr><td>"All hat, no cattle"</td><td>High visibility, low actual output</td><td>Eventually exposed; reputation collapse</td></tr>
  </tbody>
</table>
<p>The target is "healthy visibility" — your work is fully visible because you've made it so, but the work is real.</p>

<h3>Internal vs. external visibility</h3>
<table>
  <thead><tr><th>Type</th><th>Drives</th><th>Mechanisms</th></tr></thead>
  <tbody>
    <tr><td><strong>Internal</strong></td><td>Promo, scope, retention bonus, internal mobility</td><td>Brag doc, demos, all-hands talks, internal docs, internal blog, hackathons</td></tr>
    <tr><td><strong>External</strong></td><td>Comp (via outside offers), future job opportunities, conference speaking, hiring power</td><td>Public blog, OSS contributions, conference talks, social media, books, podcasts</td></tr>
  </tbody>
</table>
<p>Junior engineers should focus 80% on internal. Senior+ engineers should add ~20-30% external. Staff+ should see external presence as part of the role.</p>

<h3>The mentor / sponsor distinction</h3>
<p>Critical and often confused:</p>
<table>
  <thead><tr><th>Mentor</th><th>Sponsor</th></tr></thead>
  <tbody>
    <tr><td>Gives advice</td><td>Spends political capital for you</td></tr>
    <tr><td>1:1 conversations</td><td>Mentions you in rooms you're not in</td></tr>
    <tr><td>Plenty of them; relationship is yours</td><td>Few of them; relationship is theirs (they sponsor; not you "ask for sponsorship")</td></tr>
    <tr><td>Helpful for skill growth</td><td>Decisive for promo / opportunities</td></tr>
    <tr><td>Can be anywhere in org / outside</td><td>Usually senior to you, in your reporting chain or close</td></tr>
    <tr><td>You ask "can I learn from you?"</td><td>You earn it; you don't ask "can you sponsor me?"</td></tr>
  </tbody>
</table>
<p>Engineers ask for mentors; rarely earn sponsors. Sponsors are senior people who privately decide your work is worth advocating for. The pattern: do visible, useful work; build relationship without asking for anything; eventually they sponsor or they don't.</p>

<h3>Why some engineers are over-rewarded</h3>
<p>Common observation: a peer with weaker output gets promoted faster. Why?</p>
<ul>
  <li>They're more visible — talks, docs, demos, Slack threads.</li>
  <li>They have a sponsor pushing for them.</li>
  <li>They picked the right project / team (rising-stock).</li>
  <li>They're better at the political layer (managing up, narrative).</li>
  <li>They're good at the specific high-leverage work that gets noticed (less code, more cross-team).</li>
</ul>
<p>None of this is magic; it's all learnable. The question isn't "why are they getting promoted" but "what are they doing differently that I'm not?"</p>

<h3>Why engineers under-do visibility</h3>
<table>
  <thead><tr><th>Reason</th><th>Why it's wrong</th></tr></thead>
  <tbody>
    <tr><td>"I don't want to brag"</td><td>Sharing concrete work isn't bragging; it's communication</td></tr>
    <tr><td>"My work speaks for itself"</td><td>It doesn't. People don't have time to read code.</td></tr>
    <tr><td>"It feels uncomfortable"</td><td>Discomfort is the pattern of building a new skill. Push through.</td></tr>
    <tr><td>"My manager will recognize my work"</td><td>Sometimes. Often not. Even if they do, calibration involves others who don't see you.</td></tr>
    <tr><td>"It seems performative"</td><td>It is — but performative communication is real communication. The sin is bad performances, not all performances.</td></tr>
    <tr><td>"I'm an introvert"</td><td>Many high-visibility engineers are introverts; written / async forms work great</td></tr>
    <tr><td>"Other people will be jealous"</td><td>Some will; most won't care; ignore the small minority</td></tr>
  </tbody>
</table>

<h3>The mobile / RN angle</h3>
<p>Mobile engineers face specific visibility challenges:</p>
<ul>
  <li><strong>Mobile work is "felt" by users but not by other engineers.</strong> Backend / infra peers may not understand what your work entailed.</li>
  <li><strong>Mobile orgs are smaller</strong> — fewer peers to amplify your work.</li>
  <li><strong>Mobile-specific accomplishments need translation.</strong> "Reduced app launch time by 40%" lands; "Refactored navigation stack to use type-safe routing" doesn't, without bridging.</li>
  <li><strong>Mobile is sometimes a less-prestigious org</strong> at companies whose primary product isn't mobile-first. Active visibility work is needed to overcome.</li>
  <li><strong>External mobile / RN community is a strong external visibility channel</strong> — mobile-specific conferences (App.js, RN London, FrontConf, etc.), OSS contributions to RN ecosystem.</li>
</ul>
<p>The cross-cutting move: bridge mobile work to product / business outcomes that anyone can understand.</p>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The "rooms you're not in" framework</h3>
<p>Every career-shaping decision happens in a meeting you're not in:</p>
<ul>
  <li>Calibration: managers from other teams discuss you.</li>
  <li>Promo committee: senior engineers vote on your packet.</li>
  <li>Headcount allocation: directors decide who gets to hire.</li>
  <li>Layoff decisions: leadership decides who stays.</li>
  <li>Project assignment: PMs / managers decide who leads what.</li>
  <li>Sponsorship: senior leaders advocate (or don't) for opportunities.</li>
</ul>
<p>Your visibility work is shaping what gets said in those rooms when your name comes up. The question to ask continuously: <em>if my name came up in a calibration meeting tomorrow, what would my manager say? My skip? A peer engineer who's heard my name? What artifacts can they point to?</em></p>
<p>If the answer is "they'd say nice things in general but couldn't point to specific impact," you have a visibility gap.</p>

<h3>The "quartile of visibility" model</h3>
<p>Within any team, engineers fall into quartiles by visibility:</p>
<table>
  <thead><tr><th>Quartile</th><th>Pattern</th><th>Career outcome</th></tr></thead>
  <tbody>
    <tr><td>Top 25%</td><td>Multiple visible artifacts; sponsor; clear narrative; ladder-aligned</td><td>Promoted on schedule; first picks of project / scope</td></tr>
    <tr><td>2nd quartile</td><td>Some visible work; respected but not advocated for</td><td>Promoted eventually; usually slow path</td></tr>
    <tr><td>3rd quartile</td><td>Solid output; quiet; manager knows but no one else does</td><td>Stagnant; under-leveled; perf reviews "meets expectations" that turn into PIP risk over time</td></tr>
    <tr><td>Bottom 25%</td><td>Invisible AND output low</td><td>First cut in layoffs; PIP / managed out</td></tr>
  </tbody>
</table>
<p>Most engineers are 2nd-3rd quartile. The career-shaping move is consistent execution toward 1st quartile.</p>

<h3>The "ladder alignment" principle</h3>
<p>Visibility is most effective when it ladders to org / company priorities. A visible project on a deprioritized area gets less weight than a visible project on a strategic area.</p>
<table>
  <thead><tr><th>Pattern</th><th>Visibility weight</th></tr></thead>
  <tbody>
    <tr><td>Strategic + visible + delivered</td><td>★★★★★ Promo packet gold</td></tr>
    <tr><td>Strategic + visible + slipped</td><td>★★★ Still helpful (showed scope, can explain)</td></tr>
    <tr><td>Strategic + invisible + delivered</td><td>★★ Wasted opportunity</td></tr>
    <tr><td>Off-strategy + visible + delivered</td><td>★ Weight depends on whether org values self-direction</td></tr>
    <tr><td>Off-strategy + invisible + delivered</td><td>★ Almost zero career value</td></tr>
  </tbody>
</table>
<p>Combine: pick strategic projects, ship them, make them visible. The trifecta.</p>

<h3>The "narrative arc" framework</h3>
<p>Listing 30 things you shipped is weaker than telling a coherent story.</p>
<table>
  <thead><tr><th>List form</th><th>Narrative form</th></tr></thead>
  <tbody>
    <tr><td>"Shipped feature A. Shipped feature B. Reviewed 50 PRs. Mentored 2 juniors. Fixed bug X. Built tool Y."</td><td>"This year I focused on raising mobile platform reliability. Shipped 3 reliability projects (A, B, C); built supporting tools (Y); mentored 2 juniors who now own pieces of it. Result: 40% reduction in mobile crashes; team is 2x faster on releases."</td></tr>
  </tbody>
</table>
<p>Same work; different impact. The narrative form is harder to write — requires retroactive sense-making — but it's how senior engineers communicate.</p>

<h3>The "humble + concrete" tone</h3>
<p>Effective visibility writing avoids two failure modes:</p>
<ul>
  <li><strong>Too humble:</strong> "I helped a bit on X." Reads as undersold; doesn't anchor your contribution.</li>
  <li><strong>Too boastful:</strong> "I single-handedly transformed the team." Reads as inflated; readers discount.</li>
</ul>
<p>The middle: <em>specific + concrete + accurate scope of your role.</em></p>
<table>
  <thead><tr><th>Bad</th><th>Better</th></tr></thead>
  <tbody>
    <tr><td>"I helped with the launch."</td><td>"I led the offline-mode subsystem of the launch — design, implementation, testing, rollout. ~6 weeks of focused work."</td></tr>
    <tr><td>"I revolutionized our deployment pipeline."</td><td>"I redesigned our deployment pipeline. Build time dropped 40%. Worked with [Y] who owned the runtime side."</td></tr>
    <tr><td>"Our team did great on Q3."</td><td>"Q3 we shipped X with 2x adoption vs. plan. I owned [my piece]; [team-member] owned [their piece]."</td></tr>
  </tbody>
</table>

<h3>The "credit accounting" model</h3>
<p>Engineers under-credit themselves; some over-credit themselves; both fail. Healthier model:</p>
<ul>
  <li><strong>Always credit collaborators by name.</strong> "I led X; [Y] handled the Z piece."</li>
  <li><strong>Be specific about your role.</strong> "I designed; [Y] implemented" vs. "I designed and implemented."</li>
  <li><strong>Credit upstream work.</strong> "Built on [previous engineer]'s framework."</li>
  <li><strong>Don't excessively self-credit.</strong> "I shipped X (with the team)" is better than "I led the whole effort and made the key decisions."</li>
</ul>
<p>Engineers who credit others get more credit themselves. Counter-intuitive but consistent.</p>

<h3>The "build sponsors" framework</h3>
<p>Sponsorship is earned through pattern, not asked. The pattern:</p>
<ol>
  <li><strong>Do consistently visible, valuable work</strong> in a senior leader's orbit.</li>
  <li><strong>Be useful to them.</strong> Solve a problem they care about; provide unique perspective; be calm in crisis.</li>
  <li><strong>Stay in their orbit.</strong> 1:1 occasionally; show up in their meetings; be a known quantity.</li>
  <li><strong>Communicate honestly.</strong> Don't oversell; don't undersell; senior people detect both.</li>
  <li><strong>Eventually,</strong> they advocate for you in rooms — without you asking. That's sponsorship.</li>
</ol>
<p>Trying to skip steps (asking for sponsorship cold; networking aggressively) usually backfires.</p>

<h3>The "external presence" calculus</h3>
<p>External visibility (blog, talks, OSS) has costs and benefits:</p>
<table>
  <thead><tr><th>Cost</th><th>Benefit</th></tr></thead>
  <tbody>
    <tr><td>Time (~10-30% of personal time for serious external work)</td><td>Higher comp via outside offers (visible engineers get inbound recruiting at premium)</td></tr>
    <tr><td>Risk of saying something wrong / cringey publicly</td><td>Stronger network — peers across companies</td></tr>
    <tr><td>Some companies frown on it</td><td>Future job options expand</td></tr>
    <tr><td>Social cost if peers see it as self-aggrandizing</td><td>Authority signal in your domain</td></tr>
  </tbody>
</table>
<p>For junior engineers, low-cost external (a blog, occasional GitHub contributions). For senior+, more deliberate (talks, books, OSS leadership). At staff+, often part of the role.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>The brag doc</h3>
<p>The single highest-leverage visibility tool. Mechanics:</p>
<pre><code>Format (use whatever doc tool, kept private):

# [Year] - [Your Name]

## Q1
### Projects
- [Project A]
  - Role: [your specific role]
  - Outcome: [measurable impact]
  - Visible artifacts: [link to PR / doc / talk]
  - Collaborators: [people, what they did]

### Other contributions
- [Mentoring, hiring, on-call, code review counts]

### Feedback received
- "[exact quote]" — from [person], on [project]

### Recognition
- [Awards, kudos, called-out moments]

## Q2
[Same structure]

## Q3
[...]

## Q4
[...]</code></pre>

<p><strong>Update cadence:</strong> Friday afternoon, 10 minutes/week. By review time, you have 50+ entries to draw from. Without this, you'll forget 80% of your year by the time you write your packet.</p>

<p><strong>Why it works:</strong></p>
<ul>
  <li>Forces you to articulate impact while it's fresh.</li>
  <li>Creates raw material for review packets, promo cases, resumes, narrative.</li>
  <li>Protects against memory decay.</li>
  <li>Builds confidence — you see your year of work clearly.</li>
</ul>

<h3>Internal visibility mechanisms</h3>
<table>
  <thead><tr><th>Mechanism</th><th>How</th><th>Who sees</th></tr></thead>
  <tbody>
    <tr><td>Demo at team meeting</td><td>5-minute walkthrough of your work</td><td>Team + manager</td></tr>
    <tr><td>Demo at all-hands / org-level</td><td>Recorded; circulated; high-impact</td><td>Whole org / leadership</td></tr>
    <tr><td>Design doc / RFC</td><td>Written, circulated, commented</td><td>Engineers; durable artifact</td></tr>
    <tr><td>Internal blog post</td><td>Long-form learning / war story</td><td>Engineers across teams; durable</td></tr>
    <tr><td>Tech talk / brown bag</td><td>30-min recorded session</td><td>Anyone interested in topic</td></tr>
    <tr><td>Status updates / weekly digest</td><td>Slack / email summary of team's wins</td><td>Stakeholders + leadership</td></tr>
    <tr><td>Cross-team office hours / consulting</td><td>Help other teams</td><td>Engineers across teams; builds reputation</td></tr>
    <tr><td>Hackathon / 20% projects</td><td>Visible side-project</td><td>Whole company</td></tr>
    <tr><td>Mentoring / hiring</td><td>Show up in eng panels</td><td>Hiring managers; senior eng</td></tr>
    <tr><td>Architecture review committee</td><td>Senior IC forum</td><td>Senior engineers across org</td></tr>
  </tbody>
</table>

<h3>Writing the "I shipped X" message</h3>
<p>When you ship something visible, send a Slack / email message. Template:</p>
<pre><code>Subject: 🚀 [Project Name] is live

Hey team,

Excited to share that [project] shipped today.

What it does: [1-sentence functional description]
Why it matters: [1-sentence business / user impact]
Numbers: [1-2 measurable outcomes — adoption, latency, revenue]
Credits: [people who contributed — name them]
Links: [PR, design doc, demo video, dashboard]

Happy to chat about how we built it — drop me a DM or [time slot
for office hours]. Onward to [next thing].</code></pre>

<p><strong>Why it works:</strong></p>
<ul>
  <li>Concrete (not vague self-praise).</li>
  <li>Credits collaborators (you're a generous engineer, not a credit-grabber).</li>
  <li>Numbers anchor the impact.</li>
  <li>Links provide depth for those who want.</li>
  <li>Forward-looking signals momentum.</li>
</ul>

<h3>The promo packet (when relevant)</h3>
<p>Different system per company; common structure:</p>
<ol>
  <li><strong>Self-narrative:</strong> 1-2 pages describing impact at next level, not current level.</li>
  <li><strong>Project ledger:</strong> Top 3-5 projects, with role, scope, outcome.</li>
  <li><strong>Peer endorsements:</strong> Quotes / structured feedback from cross-functional partners.</li>
  <li><strong>Manager case:</strong> Your manager writes their version.</li>
  <li><strong>Calibration:</strong> Senior leaders read all packets; vote on level.</li>
</ol>
<p>The brag doc is the source for the project ledger. Cross-functional partners need to be cultivated <em>before</em> you ask for endorsements (they need to remember you).</p>

<h3>Demos as visibility tool</h3>
<p>Demos are the highest-leverage 5 minutes you can spend on visibility. Mechanics:</p>
<ul>
  <li><strong>Pick a meaningful audience.</strong> Team demo is fine; org-level demo is better; cross-org is best.</li>
  <li><strong>Hook in 30 seconds.</strong> "Showing today: [feature], which [business impact]. Here's what it looks like: [show it]."</li>
  <li><strong>Show, don't tell.</strong> Live demo > screenshot > text description.</li>
  <li><strong>Credit team.</strong> "Built with [collaborators]."</li>
  <li><strong>Anticipate questions.</strong> "Common Qs: how did we [X]? Answer is in the design doc [link]."</li>
  <li><strong>Record.</strong> Async-watchable demos extend reach.</li>
</ul>

<h3>Talks and writing internally</h3>
<p>For senior+ engineers, internal talks are part of the job:</p>
<ul>
  <li><strong>Tech talks (30-60 min).</strong> Deep dive into a system / problem you solved.</li>
  <li><strong>Design reviews.</strong> Walkthroughs of major designs you led.</li>
  <li><strong>Post-mortems.</strong> Even when not your incident, presenting an analysis builds visibility.</li>
  <li><strong>Internal blog posts.</strong> Durable artifacts; people find them via search.</li>
  <li><strong>"Lessons learned" docs.</strong> Stuff you figured out that the next person can avoid.</li>
</ul>
<p>Aim for 1-2 substantive internal artifacts per quarter at senior level. More at staff+.</p>

<h3>External visibility mechanisms</h3>
<table>
  <thead><tr><th>Mechanism</th><th>Investment</th><th>Career payoff</th></tr></thead>
  <tbody>
    <tr><td>Personal blog (semi-regular posts)</td><td>Low-medium (1-2 hrs / post)</td><td>Medium — searchable presence</td></tr>
    <tr><td>OSS contributions (regular)</td><td>Medium (hours / week)</td><td>Medium-high — concrete artifact</td></tr>
    <tr><td>OSS maintainership</td><td>High</td><td>High — authority signal</td></tr>
    <tr><td>Conference talks</td><td>High (~40-80 hrs / talk)</td><td>High — strong external network builder</td></tr>
    <tr><td>Books</td><td>Very high (months-year)</td><td>Very high in domain; doesn't pay back monetarily</td></tr>
    <tr><td>Twitter / X / LinkedIn presence</td><td>Low (daily small effort)</td><td>Network builder; over time compounds</td></tr>
    <tr><td>Podcast appearances</td><td>Low (1-2 hrs)</td><td>Medium — niche reach</td></tr>
    <tr><td>Hackathons / OSS sprints</td><td>Low</td><td>Low-medium — concrete artifact</td></tr>
  </tbody>
</table>

<h3>The "minimum viable external presence"</h3>
<p>Even for engineers who don't want to be "online," some external presence pays back:</p>
<ul>
  <li>LinkedIn updated with current role, scope, recent shipped work.</li>
  <li>GitHub with at least some recent activity (PRs to OSS, side projects).</li>
  <li>Personal site or blog (even minimal) with 2-3 substantive posts about technical topics.</li>
  <li>Twitter / X handle following peers; occasional posts.</li>
</ul>
<p>This is the "discoverable" baseline. Without it, you don't exist to recruiters / future opportunities.</p>

<h3>Building sponsors</h3>
<p>Sequence:</p>
<ol>
  <li><strong>Identify potential sponsors.</strong> Senior leaders 2-3 levels above you, ideally in your reporting chain.</li>
  <li><strong>Get into their orbit.</strong> Volunteer for projects they care about; speak in their meetings; deliver value.</li>
  <li><strong>Be useful to them specifically.</strong> What's a problem they have that you can help with? Solve it.</li>
  <li><strong>Show up consistently.</strong> Reliability + competence = sponsor signal.</li>
  <li><strong>Don't ask for sponsorship.</strong> Ever. Either they sponsor or they don't; asking is an anti-pattern.</li>
  <li><strong>Maintain the relationship.</strong> Quarterly check-ins. Share updates. Listen.</li>
</ol>

<h3>The "manager managing your visibility" pattern</h3>
<p>Your manager is your first-line sponsor. Make their job easier:</p>
<ul>
  <li><strong>Send them artifacts they can forward.</strong> Demo recordings, ship messages, post-mortems.</li>
  <li><strong>Brief them before their meetings with their boss.</strong> "Want to give you a 30-second update on [my work] you can mention if it comes up."</li>
  <li><strong>Co-author the narrative.</strong> Don't make them figure out what you did; tell them.</li>
  <li><strong>Let them advocate for you.</strong> Don't end-run them to skip-level; route through them.</li>
</ul>

<h3>Mobile-specific visibility tactics</h3>
<ul>
  <li><strong>Demos in product reviews.</strong> Your work is visual; demo it to product / business stakeholders, not just engineering.</li>
  <li><strong>Mobile metrics dashboards.</strong> Crash rate, app size, launch time, engagement — share these widely; they're concrete and impressive when improved.</li>
  <li><strong>Translate mobile work for non-mobile audience.</strong> "Reduced launch time by 40%" travels; "Migrated nav stack to type-safe routing" doesn't.</li>
  <li><strong>Cross-team consultation.</strong> Be the mobile expert other teams can ping.</li>
  <li><strong>Mobile platform talks.</strong> Internal RN / iOS / Android talks are usually well-attended.</li>
  <li><strong>External mobile community.</strong> RN OSS contributions, mobile conferences (App.js, Chain React, RN London).</li>
</ul>
`
    },
    {
      id: 'examples',
      title: '🔍 Worked Examples',
      html: `
<h3>Example 1: Brag-doc entry</h3>
<p><strong>Setup:</strong> You shipped a major performance improvement in the mobile app.</p>

<p><strong>Bad entry:</strong></p>
<pre><code>- Worked on perf</code></pre>

<p><strong>Good entry:</strong></p>
<pre><code>### Mobile App Performance Initiative (Q2)
- Role: Tech lead. Designed approach, implemented core changes,
  coordinated with iOS and Android teams.
- Scope: Cold start time, list scroll performance, image loading.
- Outcome:
  - Cold start: 3.2s → 1.8s (P50), 5.1s → 2.4s (P95)
  - Scroll FPS: 45 → 58 (P50)
  - Day-1 retention: +1.2pp (statistically significant in A/B test)
- Visible artifacts:
  - Design doc: [link]
  - Demo at all-hands: [video link]
  - Internal blog post: [link]
  - Dashboard: [link]
- Collaborators:
  - [Y] - Android implementation
  - [Z] - iOS implementation
  - [PM] - prioritization, A/B test
- Recognition: callout in CTO's monthly note
- Feedback: "Best perf project we've shipped this year" — VP Eng</code></pre>

<p><strong>Why it works:</strong> Concrete numbers. Specific role. Credits collaborators. Visible artifacts linked. Recognition / feedback documented while fresh.</p>

<h3>Example 2: The "I shipped X" message</h3>
<p><strong>Setup:</strong> Your team just shipped a new offline mode in the mobile app.</p>

<p><strong>Bad version:</strong></p>
<pre><code>FYI we shipped offline mode</code></pre>

<p><strong>Good version:</strong></p>
<pre><code>🚀 Offline Mode is live for 100% of users

What it does: users can now read / queue actions while offline; syncs
automatically when they reconnect.

Why it matters: 30% of our sessions hit network errors at some point.
Offline mode means users don't lose work.

Numbers (week 1):
- 12% of sessions used offline functionality at least once
- 0 reported data loss issues
- App size impact: +1.2MB (acceptable, vs. 5MB budget)

Credits:
- [A] - sync engine design
- [B] - conflict resolution logic
- [C] - QA across both platforms
- [PM] - prioritization + customer research

Try it: airplane mode → use the app → reconnect.

Detail: [design doc link]
Demo: [3-min video link]
Office hours: Friday 2pm to walk through the architecture.

Onward to [next thing].</code></pre>

<p><strong>Why it works:</strong> Specific impact, not just shipping. Numbers. Credits explicit. Pointers for those who want depth. Forward-looking close.</p>

<h3>Example 3: Self-narrative for promo packet</h3>
<p><strong>Setup:</strong> Senior → senior staff promo. You need a 1-2 page narrative.</p>

<p><strong>Bad opener:</strong></p>
<pre><code>Over the past year I've shipped many features and contributed to
the team's success. I worked hard and I think I'm ready for the
next level.</code></pre>

<p><strong>Good opener:</strong></p>
<pre><code>This past year I've operated at senior staff scope, leading mobile
platform reliability work that affected the entire app. Highlights:

1. Reliability initiative
   Identified mobile crashes as the team's #1 customer pain point.
   Drove a 6-month effort across iOS, Android, and RN that reduced
   crash rate by 60% and unblocked 3 product launches that were
   stuck behind reliability concerns.

2. Mobile platform evolution
   Designed and led migration from old-pattern X to new-pattern Y,
   coordinating across 4 product teams. 9-month effort. Resulted in
   2x dev velocity in measurable metrics + reduced new-engineer
   onboarding from 4 weeks to 1.

3. Cross-org influence
   Co-authored mobile architecture rubric now used across all
   mobile teams. Mentored 3 senior engineers on architecture
   reviews. Now serving on architecture review committee.

The pattern: I identify high-leverage problems, build coalitions
across teams, and ship concrete improvements with measurable
outcomes. Each of these projects had impact beyond my immediate
team — typical of senior staff scope.

[Continue with detail per project, peer endorsements, plan for
next 12 months at next level.]</code></pre>

<p><strong>Why it works:</strong> Opens with scope claim. Concrete projects with measurable outcomes. Frames at next level (cross-team, mentoring, multi-quarter). Sets up the rest of the packet.</p>

<h3>Example 4: Building sponsor relationship over time</h3>
<p><strong>Setup:</strong> A director two levels above you runs a special initiative; you have light contact through occasional updates.</p>

<p><strong>Year 1 — get into orbit:</strong></p>
<ul>
  <li>Volunteer for a small task in their initiative.</li>
  <li>Send a useful 1-pager about a mobile concern relevant to their initiative.</li>
  <li>Attend their staff meetings as needed; speak briefly + concretely when relevant.</li>
</ul>

<p><strong>Year 2 — be useful:</strong></p>
<ul>
  <li>Take on a more substantial project under their initiative.</li>
  <li>Do exceptional work; document and share.</li>
  <li>Quarterly 1:1 — ask about their priorities; share relevant updates.</li>
</ul>

<p><strong>Year 3 — sponsorship emerges:</strong></p>
<ul>
  <li>Director mentions you to their peer when a senior IC opening arises.</li>
  <li>Director vouches for you in calibration.</li>
  <li>Director invites you to lead a higher-scope project.</li>
</ul>

<p><strong>Critical:</strong> at no point did you ask "will you sponsor me?" The sponsorship emerged from consistent value-delivery over time.</p>

<h3>Example 5: Translating mobile work to broader audience</h3>
<p><strong>Setup:</strong> You finished a major refactor of mobile state management. You want to share with broader engineering org.</p>

<p><strong>Engineer-only version:</strong></p>
<pre><code>"We migrated from Redux + thunks to a reactive store with selectors
and Suspense integration."</code></pre>

<p><strong>Broader-audience version (talk title + abstract):</strong></p>
<pre><code>Title: "Untangling Mobile State: How We Cut Bug Reports by 35%"

Abstract: Our mobile app's state management had grown organically
over 4 years. We had bugs that recurred, code that was hard to
test, and screens that loaded slower than they should. Over 6
months, we redesigned the state layer.

This talk covers:
- The specific patterns that caused our pain (with examples)
- The decision criteria for the new architecture
- Migration strategy that didn't require a stop-the-world rewrite
- Concrete results: 35% bug reduction, 18% faster screen loads,
  60% reduction in code duplication

Audience: anyone who works on apps with growing state complexity.
Mobile-specific but broadly applicable to client apps.</code></pre>

<p><strong>Why it works:</strong> Hooks with business outcome. Promises specific learnings. Anchors the technical content in observable results. Audience-broad (not "for the 5 RN engineers").</p>

<h3>Example 6: External blog post strategy</h3>
<p><strong>Setup:</strong> You want to start writing publicly. Decide what to post.</p>

<p><strong>Bad strategy:</strong> "I'll write about whatever I'm working on." Result: random posts; no discoverable theme; no compounding readership.</p>

<p><strong>Good strategy:</strong> Pick a theme; build authority over time.</p>
<pre><code>Theme: "Mobile platform engineering at scale"

Post sequence (over 6-12 months):
1. "How we measure mobile performance: the metrics we use and why"
2. "Cold start optimization: what worked, what didn't"
3. "Migrating large RN apps: a case study"
4. "Mobile observability: what we wish we'd built earlier"
5. "Type-safe navigation in RN: a deep dive"
6. "Building a mobile platform team: org and tech decisions"

Each post:
- Concrete numbers from real work (no generic advice).
- Lessons learned (vulnerability + signal).
- Clear takeaways for readers.
- Anchored in a real problem.</code></pre>

<p><strong>Why it works:</strong> Themed builds expertise. Each post drives traffic to others. Over time, you become "the [topic] person." Recruiters find you. Conferences reach out. Comp goes up.</p>

<h3>Example 7: Introvert-friendly visibility</h3>
<p><strong>Setup:</strong> You're an introverted engineer; talks and Slack-thread chatter feel exhausting.</p>

<p><strong>Strategy:</strong> Lean on async / written forms.</p>
<ul>
  <li><strong>Brag doc</strong> — solo work, async, durable.</li>
  <li><strong>Internal blog posts</strong> — written, not spoken; people read on their schedule.</li>
  <li><strong>Design docs</strong> — your authoring shows up in everyone's reviews.</li>
  <li><strong>Code review comments</strong> — substantive ones build reputation.</li>
  <li><strong>Office hours</strong> — 1:1 conversations are usually less draining than group dynamics.</li>
  <li><strong>Recorded demos</strong> — record once, share many times.</li>
  <li><strong>1:1 sponsor relationships</strong> — instead of social networking events.</li>
</ul>
<p>Visibility doesn't require being the loudest in the room. It requires being knowable. Async/written paths to knowability work great for introverts.</p>

<h3>Example 8: When you're under-recognized despite high output</h3>
<p><strong>Setup:</strong> You ship a lot. Manager and peers know you're solid. But promo isn't happening; calibration says "needs more impact" — but you ARE having impact.</p>

<p><strong>Diagnosis:</strong> Visibility gap. People don't have the artifacts to point at.</p>

<p><strong>Recovery plan:</strong></p>
<ol>
  <li><strong>Audit the past 6 months.</strong> List everything you shipped. Identify which were visible and which weren't.</li>
  <li><strong>Build retrospective artifacts.</strong> For invisible-but-important work, write the docs / demos / blog posts now. They count even retroactively.</li>
  <li><strong>Schedule a "visibility 1:1" with manager.</strong> "I want to make sure I'm visible at the right level. What artifacts can I produce that would help my next promo case?" Direct.</li>
  <li><strong>Pick the next 1-2 projects with visibility in mind.</strong> Strategic + visible.</li>
  <li><strong>Take 30 min/week for visibility maintenance.</strong> Brag doc, demo prep, blog post writing.</li>
  <li><strong>Identify potential sponsors.</strong> Get into their orbit deliberately.</li>
</ol>

<p>This is a 6-12 month investment. Most engineers under-recognized for output suffer in silence; the recovery is consistent visibility work.</p>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Cultural calibration of self-promotion</h3>
<p>What reads as "appropriate visibility" varies by culture and team. US tech is more visibility-permissive; some cultures (Japan, parts of EU, traditional enterprise) view it as inappropriate.</p>
<ul>
  <li><strong>If you're in a low-visibility culture:</strong> lean async / written / collaborative-credit. Avoid bragging-style updates.</li>
  <li><strong>If you're a low-visibility-default person in a high-visibility culture:</strong> push yourself slightly out of comfort. Practice; calibrate.</li>
  <li><strong>Watch peers.</strong> What level of visibility is rewarded vs. penalized in your specific environment.</li>
</ul>

<h3>The "tall poppy" problem</h3>
<p>Some teams / cultures have a strong norm against any individual standing out — "tall poppies get cut down." If you're in one:</p>
<ul>
  <li><strong>Visibility through team:</strong> "we shipped X" rather than "I shipped X."</li>
  <li><strong>Credit others heavily.</strong> Sometimes excessive credit deflects the tall-poppy reaction.</li>
  <li><strong>External visibility</strong> may be safer than internal in tall-poppy environments.</li>
  <li><strong>Consider whether the environment is right for you.</strong> Tall-poppy cultures cap senior engineers' careers.</li>
</ul>

<h3>Diversity and visibility friction</h3>
<p>Underrepresented engineers face double-binds in visibility:</p>
<ul>
  <li>If you self-promote, may be punished as "aggressive."</li>
  <li>If you don't, your work goes uncredited.</li>
</ul>
<p>Counter-strategies:</p>
<ul>
  <li><strong>Lean on artifacts</strong> over verbal claims (docs, demos, dashboards). Harder to dismiss.</li>
  <li><strong>Have allies amplify you.</strong> Allies who reference your work in meetings deflect "self-promotion" criticism.</li>
  <li><strong>Be cautious about credit-grabbing peers</strong> — document explicitly when you're the originator.</li>
  <li><strong>Find a sponsor who explicitly advocates.</strong> Senior champion can break through patterns.</li>
</ul>

<h3>"Quiet quitting" / disengaged season</h3>
<p>Sometimes you're going through a hard period; visibility takes a back seat.</p>
<ul>
  <li><strong>Don't blow up your reputation</strong> in a single bad quarter.</li>
  <li><strong>Maintain minimum visible output.</strong> 1 visible thing per quarter even at low engagement.</li>
  <li><strong>Don't overshare.</strong> "I'm struggling" in 1:1 with manager, fine. Public-Slack-thread venting, no.</li>
  <li><strong>Recover when you can.</strong> Post-recovery, double down on visibility for a few quarters.</li>
</ul>

<h3>The "quiet senior" who's actually high-impact</h3>
<p>Some engineers have genuine impact through quiet work — careful code review, mentoring, design reviews — that's invisible at scale.</p>
<ul>
  <li><strong>Document this work explicitly.</strong> "Reviewed 200 PRs. Mentored 3 engineers (here are their wins). Architecture reviews on 8 major projects."</li>
  <li><strong>Get peer endorsements.</strong> The juniors you mentored, the engineers whose reviews you raised quality on.</li>
  <li><strong>Frame as high-leverage glue work.</strong> Promo packets understand glue; just need to surface it.</li>
  <li><strong>Combine with one visible project per cycle.</strong> Doesn't have to be your main work; just needs to exist.</li>
</ul>

<h3>External visibility company restrictions</h3>
<p>Some companies have restrictive policies on external speaking / writing:</p>
<ul>
  <li>NDAs / IP agreements.</li>
  <li>Required PR-team approval for talks.</li>
  <li>Strict messaging guidelines for company-related content.</li>
</ul>
<p>Defenses:</p>
<ul>
  <li>Read your contract / company policy.</li>
  <li>Talk to PR / legal early about external content.</li>
  <li>For restrictive companies: focus on generic technical content; avoid company-specifics.</li>
  <li>Some companies offer formal advocate / DA programs that smooth the path.</li>
</ul>

<h3>The "manager takes credit" problem</h3>
<p>Some managers absorb their reports' work and present it as their own.</p>
<ul>
  <li><strong>Build artifacts that have your name on them.</strong> Design docs, demos, code attribution.</li>
  <li><strong>Get visibility outside your direct reporting chain.</strong> Skip-level recognition is harder for manager to suppress.</li>
  <li><strong>Cultivate cross-functional partners</strong> who see your work directly and can attest.</li>
  <li><strong>If pattern is severe:</strong> consider transferring or escalating. Bad managers cap your career.</li>
</ul>

<h3>The "team that doesn't ship" problem</h3>
<p>Some teams' work doesn't ship in visible ways — long-term research, infrastructure, deprecation. Visibility is harder.</p>
<ul>
  <li><strong>Define visible milestones</strong> within the work. "Phase 1 complete: X queries now sub-100ms."</li>
  <li><strong>Quantify impact upstream.</strong> "Migration enables [downstream team] to ship Y."</li>
  <li><strong>Internal talks about lessons learned.</strong> Even unfinished work has insights.</li>
  <li><strong>Document architectural artifacts.</strong> Even if not customer-facing, they're reviewable.</li>
  <li><strong>Consider whether team is right for next promo.</strong> Sometimes infra teams need stronger advocacy or a move.</li>
</ul>

<h3>"I'm an engineer, not a salesperson" objection</h3>
<p>Some engineers genuinely dislike visibility work. Rationalizations vs. reality:</p>
<ul>
  <li>"Engineers should be judged on engineering" — true; also, visibility is part of senior engineering.</li>
  <li>"I don't want to be a politician" — visibility ≠ politics. It's communication.</li>
  <li>"The system should reward quiet output" — it doesn't, and won't change in your career timeline.</li>
</ul>
<p>You can refuse to play the game; you'll pay for it in career velocity. The choice is yours but should be informed.</p>

<h3>Mistakes that ruin visibility</h3>
<p>Things that crater your reputation faster than slow growth helps it:</p>
<ul>
  <li>Public outburst / unprofessional behavior.</li>
  <li>Stolen credit (peers notice; reputation collapses).</li>
  <li>Over-claiming (peers correct; reputation collapses).</li>
  <li>Public undermining of leadership.</li>
  <li>Major missed commitment without communication.</li>
  <li>Ethical failures (deception, harassment, etc.).</li>
</ul>
<p>Visibility builds slowly; collapses fast. Risk-management on these matters.</p>

<h3>Visibility during PIP / perf risk</h3>
<p>If on PIP, visibility calculus is different:</p>
<ul>
  <li><strong>Focus visibility on the PIP criteria.</strong> Don't try to expand scope; demonstrate the specific things being asked.</li>
  <li><strong>Document your work obsessively.</strong> Every win recorded; defends against discounting.</li>
  <li><strong>Internal visibility only.</strong> Don't pour energy into external during PIP — focus on saving the role.</li>
  <li><strong>Quiet professionalism.</strong> Avoid drama; ship work; let output speak.</li>
</ul>

<h3>The transition between IC and management visibility</h3>
<p>If you switch from IC to manager (or back), visibility patterns change:</p>
<ul>
  <li><strong>IC visibility:</strong> things you shipped, technical reputation.</li>
  <li><strong>Manager visibility:</strong> team's outcomes, retention, hires, growth of reports.</li>
  <li><strong>Transition pitfall:</strong> as new manager, taking too much IC credit erodes team trust. As new IC after manager, lacking recent shipped artifacts.</li>
  <li><strong>Plan visibility for the role you're in.</strong> Different rubrics.</li>
</ul>
`
    },
    {
      id: 'bugs',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Anti-pattern: avoidance disguised as humility</h3>
<p><strong>Looks like:</strong> "I don't want to brag." Result: invisible work; under-leveled.</p>
<p><strong>Why bad:</strong> Humility is fine; being unknown is not. Sharing concrete work isn't bragging.</p>
<p><strong>Fix:</strong> Reframe — visibility is communication, not bragging. You're informing, not boasting.</p>

<h3>Anti-pattern: chronic over-claiming</h3>
<p><strong>Looks like:</strong> "I single-handedly solved X." Reality: 6 people worked on it.</p>
<p><strong>Why bad:</strong> Peers notice. Reputation flips from "high-output" to "credit-grabber" fast.</p>
<p><strong>Fix:</strong> Always credit collaborators. Be specific about your role. Generosity in attribution earns trust.</p>

<h3>Anti-pattern: quantity over quality of self-promotion</h3>
<p><strong>Looks like:</strong> Posts in Slack about every commit; daily "I shipped" updates.</p>
<p><strong>Why bad:</strong> Noise drowns signal. Peers tune out. Reputation as "the loud one" forms.</p>
<p><strong>Fix:</strong> Quality over quantity. Big-shipping moments only. 1-2 visible artifacts per month at senior level.</p>

<h3>Anti-pattern: visibility on small things, invisibility on big</h3>
<p><strong>Looks like:</strong> Long Slack post about a bug fix; nothing about the 6-month architecture project.</p>
<p><strong>Why bad:</strong> Confused signal about your scope.</p>
<p><strong>Fix:</strong> Visibility scaled to project. Big projects deserve big artifacts.</p>

<h3>Anti-pattern: vague impact claims</h3>
<p><strong>Looks like:</strong> "Improved performance significantly." "Made the codebase cleaner." "Better user experience."</p>
<p><strong>Why bad:</strong> Empty claims don't move calibration. Senior reviewers want numbers.</p>
<p><strong>Fix:</strong> Specific numbers. "P50 latency 200ms → 80ms." "Crash rate 1.2% → 0.5%." If you can't measure it, find a proxy.</p>

<h3>Anti-pattern: visibility without strategy alignment</h3>
<p><strong>Looks like:</strong> Lots of visibility on a project nobody at leadership cares about.</p>
<p><strong>Why bad:</strong> Visible but not impactful. Doesn't move career.</p>
<p><strong>Fix:</strong> Pick projects strategically. Align with org / leadership priorities. Visibility on strategic work pays back; on off-strategy work doesn't.</p>

<h3>Anti-pattern: skipping internal for external</h3>
<p><strong>Looks like:</strong> Active blog / Twitter; no internal visibility. Becomes "the engineer with the blog" with no internal traction.</p>
<p><strong>Why bad:</strong> Internal is what drives promo / scope at your current company. External without internal often reads as "more interested in personal brand than team."</p>
<p><strong>Fix:</strong> Internal first. External as supplement, not substitute.</p>

<h3>Anti-pattern: end-running your manager</h3>
<p><strong>Looks like:</strong> Going to skip-level / VP with your work, bypassing manager.</p>
<p><strong>Why bad:</strong> Damages manager relationship. Your manager is the most important sponsor; don't undermine them.</p>
<p><strong>Fix:</strong> Route through manager. Make their job easier, not harder. Skip-level visibility through them.</p>

<h3>Anti-pattern: networking without giving value</h3>
<p><strong>Looks like:</strong> Lots of "let's grab coffee" with senior people; nothing to offer in return.</p>
<p><strong>Why bad:</strong> Senior people detect time-takers. Reputation suffers.</p>
<p><strong>Fix:</strong> Bring value to the conversation — solved problem they care about, useful intel, sharp question. Networking is reciprocal.</p>

<h3>Anti-pattern: brag-doc neglect</h3>
<p><strong>Looks like:</strong> Don't track wins all year; scramble at perf review time; forget half of what you did.</p>
<p><strong>Why bad:</strong> Memory decay = lost credit. Review packet weak.</p>
<p><strong>Fix:</strong> Friday afternoon, 10 minutes/week. Tiny investment, huge payoff.</p>

<h3>Anti-pattern: humble-bragging</h3>
<p><strong>Looks like:</strong> "Just super tired after shipping the feature that caused 200% growth..."</p>
<p><strong>Why bad:</strong> Transparently performative. Worse than direct claim.</p>
<p><strong>Fix:</strong> Either share concretely or don't. Humble-brag reads as immature.</p>

<h3>Anti-pattern: chasing signal-of-success indicators rather than success</h3>
<p><strong>Looks like:</strong> Optimize for "looking like a senior engineer" — talks, blog posts, Twitter — over actually doing senior work.</p>
<p><strong>Why bad:</strong> Eventually exposed. "All hat, no cattle" reputation forms.</p>
<p><strong>Fix:</strong> Visibility supports work; doesn't replace it. Do the work first; make it knowable second.</p>

<h3>Anti-pattern: not investing in cross-functional relationships</h3>
<p><strong>Looks like:</strong> Engineer focuses purely on engineering; PM, design, partner teams barely know them.</p>
<p><strong>Why bad:</strong> Promo packets need cross-functional endorsements. Sponsors are often cross-functional.</p>
<p><strong>Fix:</strong> Quarterly 1:1 cadence with key cross-functional partners. Build relationships before you need them.</p>

<h3>Anti-pattern: visibility dies in mid-project</h3>
<p><strong>Looks like:</strong> Big announcement at kickoff; silence for 6 months; small note at finish.</p>
<p><strong>Why bad:</strong> Stakeholders forget. Project's visibility waxes and wanes.</p>
<p><strong>Fix:</strong> Mid-project demos, "lessons learned so far" posts, milestone callouts. Continuous, not just kickoff + finish.</p>

<h3>Anti-pattern: visibility through complaining</h3>
<p><strong>Looks like:</strong> Become "known" for being the engineer who complains in retros, on Slack, in 1:1s.</p>
<p><strong>Why bad:</strong> Negative visibility ≠ positive visibility. Reputation as "negative" forms.</p>
<p><strong>Fix:</strong> Visibility through positive contribution. Complaints, when needed, in low-visibility 1:1 channels.</p>

<h3>Anti-pattern: not maintaining external presence between job searches</h3>
<p><strong>Looks like:</strong> Update LinkedIn only when looking. Empty between.</p>
<p><strong>Why bad:</strong> No compounding network. Recruiters can't find you. Comp negotiations harder without external evidence of value.</p>
<p><strong>Fix:</strong> Minimum viable external presence (LinkedIn updated, GitHub active, occasional posts) maintained year-round. Costs little; pays back when needed.</p>

<h3>Anti-pattern: copy-paste visibility from peers</h3>
<p><strong>Looks like:</strong> See peer's strategy work; mimic without adapting.</p>
<p><strong>Why bad:</strong> Off-key. People notice when visibility doesn't match the actual engineer.</p>
<p><strong>Fix:</strong> Visibility approach should match your authentic style + actual work. Introvert + bottom-up engineer? Lean writing / docs. Extrovert + cross-team? Lean talks / demos.</p>

<h3>Anti-pattern: never asking for visibility help</h3>
<p><strong>Looks like:</strong> Try to manage visibility entirely solo.</p>
<p><strong>Why bad:</strong> Manager / mentor / sponsor can amplify you; you have to ask.</p>
<p><strong>Fix:</strong> "I want to make sure my work is visible at the right level. What artifacts / forums would help?" — direct conversation with manager.</p>
</p>
`
    },
    {
      id: 'interview',
      title: '🎤 Interview Patterns',
      html: `
<h3>"Tell me about a project you're proud of"</h3>
<p>Universal interview question. Tests: scope, impact, your role, communication.</p>

<h4>Strong answer template</h4>
<ol>
  <li>Setup: project, why it mattered, team composition.</li>
  <li>Your specific role: what you owned vs. what others owned.</li>
  <li>Hard decisions: technical or non-technical choices that mattered.</li>
  <li>Outcome: measurable results.</li>
  <li>Reflection: what you learned, what you'd do differently.</li>
</ol>

<h4>Example</h4>
<pre><code>"Last year I led the offline mode for our mobile app. Big project
because 30% of our sessions had connectivity issues; offline mode
unblocked a major source of customer pain.

My role: tech lead. I designed the sync engine architecture, owned
the conflict-resolution logic, coordinated with iOS and Android
implementers. PM owned scope; designer owned UX; I owned everything
between PRD and shipped.

The hardest decision was conflict resolution strategy. Three options:
LWW (simple but data loss in some cases), CRDT-based (correct but
complex), or domain-specific resolution per data type. We went with
domain-specific. I wrote a 12-page design doc that walked through
the trade-offs. Took 2 weeks of stakeholder review; the doc is
still referenced for similar decisions today.

Result: shipped on time. 12% of weekly sessions use offline.
Crash-related data loss reports went to zero. Day-1 retention
improved 1.2pp in A/B test.

What I'd do differently: I should have built the sync simulation
test harness earlier — I built it 3 months in, would have caught
2 architectural issues if I'd built it month 1.

Lesson: for distributed-system-flavored work, build the simulation
infrastructure first."</code></pre>

<h4>What this answer demonstrates</h4>
<ul>
  <li>Concrete scope and role.</li>
  <li>Numbers (30%, 12%, 1.2pp).</li>
  <li>Hard technical decision with reasoning.</li>
  <li>Cross-functional coordination.</li>
  <li>Self-aware reflection.</li>
  <li>Memorable: durable artifact (the doc) referenced as proof.</li>
</ul>

<h3>"What's your impact on the org been"</h3>
<p>Senior+ behavioral. Wants narrative impact, not list.</p>
<pre><code>"My impact has been on raising mobile platform reliability and
velocity. Three threads of work over the past 18 months:

1. Reliability: drove crash rate from 1.2% to 0.5%. Specific work:
   migrated to better crash reporting (saw issues we'd been blind
   to); led 4 specific reliability projects (memory leak in
   navigation, race in offline sync, image cache crash, push
   notification edge case).

2. Velocity: redesigned our build / release pipeline. Build time
   60s → 22s (median). Release cadence weekly → daily. Engineers
   ship 3x more frequently with same headcount.

3. Mobile architecture rubric: co-authored with senior staff.
   Now used across 4 mobile teams. Reduced architecture debate
   cycles in design reviews.

Each of these I led, but not alone — credited collaborators on
each. The pattern: I see high-leverage cross-cutting problems and
build coalitions to fix them.

If you want depth on any: happy to share design docs / dashboards.
Brought a 1-pager summary for context."</code></pre>

<h3>"What's been your most visible work"</h3>
<p>Less common but appears at staff+. Probes: do you understand visibility?</p>
<pre><code>"My most visible work has been the mobile reliability initiative.
Visibility came from a few channels:
- Internal blog post that got 200+ reads across the engineering org.
- Demo at the all-hands monthly meeting (recorded).
- The crash dashboard I built — VPs check it weekly.
- Quarterly business review where the impact was called out.

Less visible but I think more impactful: code review patterns I
established. Every PR in the mobile platform now goes through a
specific 5-step checklist. It's quiet work; high leverage. Not
in a single visible artifact but in a pattern that 8 engineers
follow.

I think about visibility as making my work knowable, not making
me known. The work has to be real first; visibility is the
communication layer."</code></pre>

<h3>"How do you build relationships with senior leaders"</h3>
<pre><code>"Slowly, through demonstrated value. Three patterns:

1. I volunteer for problems they care about. Not random networking —
   identify what's keeping a senior leader up; offer to help with a
   piece of it.

2. I do exceptional work and document it. Senior leaders are
   pattern-matching; consistent quality + documented artifacts
   build a reputation that compounds.

3. I keep things efficient. Senior leaders have no time for
   meandering meetings; brief, specific, useful conversations
   build trust.

I don't ask for sponsorship. Either it emerges from the pattern or
it doesn't. Asking cold is an anti-pattern."</code></pre>

<h3>"How do you get visibility for engineering work that's hard to see?"</h3>
<p>Particularly relevant for infra / platform / RN engineers.</p>
<pre><code>"Three techniques:

1. Quantify upstream impact. Infra work is invisible; downstream
   results aren't. 'Migration enabled team X to ship feature Y'
   makes my work visible through their outcome.

2. Build dashboards / metrics. Concrete numbers travel — crash
   rate, build time, latency, reliability. A dashboard that the
   org checks weekly is durable visibility.

3. Translate for non-technical audiences. 'Refactored navigation'
   doesn't travel. 'Cut nav-related bugs by 80%; reduced
   onboarding time for new engineers from 4 weeks to 1' does.

Mobile / platform engineers under-do this. The work is real;
the translation is the gap."</code></pre>

<h3>"What's your external presence like?"</h3>
<p>Common at staff+ for hire decisions. They check: are you known in your domain?</p>
<pre><code>"I keep an active blog with focus on mobile platform engineering.
Maybe 6-8 posts a year. Specific themes: performance optimization,
RN architecture at scale, mobile observability.

I've spoken at [conference X] and [conference Y]; participate in
the RN OSS community as a reviewer / occasional contributor.

LinkedIn / GitHub up to date.

I don't optimize for follower counts. The metric I care about: do
recruiters / peers find substantive technical content under my
name? Yes."</code></pre>

<h3>"How do you handle a peer taking credit for your work?"</h3>
<pre><code>"First, don't escalate quickly. Often it's miscommunication, not
malice. Direct conversation: 'Hey, in the meeting yesterday you
mentioned the X work as your project. I was the lead on it; want
to make sure that's clear going forward.'

Most peers correct after one conversation. If pattern persists:
artifacts. Make sure design docs, dashboards, ship messages have
me as named owner. Hard to dispute when artifacts attribute me.

If it's still continuing despite both of those: loop manager. Not
to escalate war; to surface pattern. Manager can mediate. Worst
case is reputation damage; need manager's view + support to
resolve."</code></pre>

<h3>Common follow-ups</h3>
<table>
  <thead><tr><th>Question</th><th>What they're checking</th></tr></thead>
  <tbody>
    <tr><td>"How do you maintain a brag doc?"</td><td>Whether you have one</td></tr>
    <tr><td>"How do you balance individual visibility with team?"</td><td>Senior maturity</td></tr>
    <tr><td>"Tell me about your most embarrassing technical mistake."</td><td>Vulnerability + reflection</td></tr>
    <tr><td>"What would your last manager say about you?"</td><td>Coachability + self-awareness</td></tr>
    <tr><td>"How do you approach new opportunities for visibility?"</td><td>Whether you're strategic</td></tr>
    <tr><td>"What's harder for you — visibility or shipping?"</td><td>Honest self-assessment</td></tr>
  </tbody>
</table>

<h3>The 30-second mantra</h3>
<p><em>"Maintain a brag doc. Tell a coherent narrative. Build sponsors slowly. Pick visible teams. Match visibility to scope. Internal first; external supplements. Visibility is communication, not bragging."</em></p>
<p>Engineers who treat visibility as part of senior engineering progress at a faster cadence than equivalently-skilled engineers who don't. The work is real; the visibility makes it knowable; together they build careers.</p>
`
    }
  ]
});
