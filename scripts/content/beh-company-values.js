window.PREP_SITE.registerTopic({
  id: 'beh-company-values',
  module: 'behavioral',
  title: 'Company Values (LPs etc.)',
  estimatedReadTime: '40 min',
  tags: ['behavioral', 'amazon-lp', 'leadership-principles', 'meta-values', 'google-googleyness', 'apple', 'microsoft', 'culture-fit'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>Most large tech companies publish an explicit set of <strong>cultural principles</strong> they hire against. Amazon famously codified 16 <strong>Leadership Principles</strong> (LPs); Meta has its values; Google has "Googleyness"; Microsoft has its growth-mindset rubric; Apple operates on principles even if less publicly documented. Behavioral interviewers literally <strong>map your answers to these principles</strong>.</p>
<ul>
  <li><strong>Amazon's LPs are the most prescriptive.</strong> The bar-raiser system explicitly grades each story against ≥1 LP. Knowing the LPs verbatim and tagging your stories accordingly is non-optional for Amazon loops.</li>
  <li><strong>Meta values:</strong> "Move Fast," "Be Bold," "Focus on Impact," "Be Open," "Build Awesome Things," and updated principles around live-by-impact and meta-mate care. Interviewers grade for "moves fast with discipline."</li>
  <li><strong>Google's "Googleyness":</strong> intellectual humility, comfort with ambiguity, evidence of bias for action, collaborative orientation. Less codified than Amazon but rigorously assessed.</li>
  <li><strong>Microsoft:</strong> growth mindset, customer-obsessed, diverse-and-inclusive, one-Microsoft (cross-team collaboration). The Satya-era reset is heavily emphasized.</li>
  <li><strong>Apple:</strong> "values" rather than "principles" — dive-deep on craft, intolerance for sloppiness, secrecy/discipline, customer experience as north star.</li>
  <li><strong>Mid-size and startups:</strong> often have published values too. Always read them before the loop. Map your stories.</li>
  <li><strong>Pattern:</strong> understand the values → tag your stories → use the language naturally (not as quotes) → ask thoughtful reverse questions about how they live the values.</li>
</ul>
<p><strong>Mantra:</strong> "Read the values. Tag your stories. Use the language. Ask reverse questions that show you've done the work."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What are "company values"?</h3>
<p>A short list of cultural principles a company uses to define how its people work. They're not just marketing — they show up in performance reviews, promo committees, hiring rubrics, and (for the most disciplined cultures) in everyday meetings. When you say "but that violates X," everyone knows what X means.</p>

<h3>Why companies publish them</h3>
<ol>
  <li><strong>Hiring filter.</strong> Cultural fit is harder to assess than technical skill. Codifying values gives interviewers a shared rubric.</li>
  <li><strong>Decision shorthand.</strong> Two engineers with conflicting preferences can resolve faster if both know the relevant principle ("Disagree and Commit," "Move Fast").</li>
  <li><strong>Identity.</strong> Values signal "this is the kind of company we are" to candidates, customers, and competitors.</li>
  <li><strong>Performance &amp; promotion.</strong> Most large tech companies tie performance reviews to value-aligned behavior; promo packets explicitly cite which principles you exemplified.</li>
</ol>

<h3>Why interviewers test against them</h3>
<p>Behavioral rounds aren't about whether you can <em>describe</em> a project — they're about whether your <em>style of operating</em> fits. A great engineer who makes unilateral decisions might thrive at one company and bounce at another. Values-rubric interviews test fit specifically.</p>

<h3>Why your prep changes per company</h3>
<p>The same story rated against different rubrics emphasizes different beats:</p>
<ul>
  <li>For Amazon's "Customer Obsession," lead with the customer-pain framing.</li>
  <li>For Meta's "Move Fast," lead with the velocity tradeoff.</li>
  <li>For Google's intellectual humility, lead with the moment you changed your mind.</li>
  <li>For Apple's quality bar, lead with the polish you fought for.</li>
</ul>
<p>The story is the same; the emphasis shifts.</p>

<h3>Why interviewers grade harshly when you misuse the language</h3>
<p>Quoting LPs verbatim ("This is a great example of Customer Obsession because...") sounds rehearsed. Demonstrating the principle through your behavior, naturally, is what they want. Don't <em>name</em> the principles; <em>embody</em> them.</p>

<h3>What "good" looks like</h3>
<ul>
  <li>You know the company's values verbatim before the loop.</li>
  <li>You can name 1-2 stories per major value.</li>
  <li>You use the value's <em>language</em> in your story (e.g., "I dove deeper" rather than "I investigated").</li>
  <li>You don't quote the values explicitly unless the interviewer asks.</li>
  <li>You ask reverse questions that show you understand <em>how</em> the company lives the values, not <em>that</em> they exist.</li>
  <li>You can articulate which values resonate with you and why — without memorized praise.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>Amazon — 16 Leadership Principles</h3>
<p>Amazon's LPs are the gold standard of codified values. Memorize them. They are:</p>
<ol>
  <li><strong>Customer Obsession</strong> — start with the customer and work backwards.</li>
  <li><strong>Ownership</strong> — long-term thinking; never say "that's not my job."</li>
  <li><strong>Invent and Simplify</strong> — innovate; reject "the way we've always done it."</li>
  <li><strong>Are Right, A Lot</strong> — strong judgment; seek diverse perspectives.</li>
  <li><strong>Learn and Be Curious</strong> — never done learning.</li>
  <li><strong>Hire and Develop the Best</strong> — raise the performance bar with every hire.</li>
  <li><strong>Insist on the Highest Standards</strong> — high bar for quality; defects don't get sent down the line.</li>
  <li><strong>Think Big</strong> — bold direction; communicate it widely.</li>
  <li><strong>Bias for Action</strong> — speed matters; many decisions are reversible.</li>
  <li><strong>Frugality</strong> — accomplish more with less.</li>
  <li><strong>Earn Trust</strong> — listen attentively; speak candidly; treat others respectfully.</li>
  <li><strong>Dive Deep</strong> — operate at all levels; stay connected to details.</li>
  <li><strong>Have Backbone; Disagree and Commit</strong> — challenge respectfully; commit fully once decided.</li>
  <li><strong>Deliver Results</strong> — focus on key inputs and deliver with the right quality, on time.</li>
  <li><strong>Strive to be Earth's Best Employer</strong> (added 2021).</li>
  <li><strong>Success and Scale Bring Broad Responsibility</strong> (added 2021).</li>
</ol>

<h3>How Amazon LPs are graded</h3>
<p>Amazon's bar-raiser system: each interviewer is assigned 2-3 LPs. They grade your stories against those specific LPs. After the loop, scores are aggregated. A "no hire" on any high-priority LP can sink the loop.</p>
<p>Implication: a 5-round Amazon loop will probe ~10-12 LPs. You need a story for almost every one.</p>

<h3>Meta values</h3>
<p>Meta's values shifted in 2022 to:</p>
<ul>
  <li><strong>Move Fast</strong> (with discipline; "move fast and break things" was retired).</li>
  <li><strong>Focus on Long-Term Impact</strong> (refined from "Focus on Impact").</li>
  <li><strong>Build Awesome Things.</strong></li>
  <li><strong>Live in the Future.</strong></li>
  <li><strong>Be Direct and Respect Your Colleagues.</strong></li>
  <li><strong>Meta, Metamates, Me.</strong> Care about the company, your team, then yourself.</li>
</ul>
<p>Behavioral grade emphasizes velocity-with-judgment. "I shipped X in 2 weeks but I sequenced the rollout to manage risk" lands strong.</p>

<h3>Google — "Googleyness"</h3>
<p>Less codified, but rubrics commonly include:</p>
<ul>
  <li><strong>Intellectual humility:</strong> changing your mind given new evidence; admitting "I don't know."</li>
  <li><strong>Comfort with ambiguity:</strong> driving forward when the problem is undefined.</li>
  <li><strong>Bias for action:</strong> shipping; iterating; not over-thinking.</li>
  <li><strong>Collaborative orientation:</strong> credit-sharing, cross-team work, mentoring.</li>
  <li><strong>User focus:</strong> caring about the actual person using the thing.</li>
  <li><strong>Conscientiousness:</strong> attention to craft, follow-through, reliability.</li>
</ul>
<p>Google interviewers also grade on "general cognitive ability" — not strictly behavioral, but it bleeds into how clearly you reason during behavioral answers.</p>

<h3>Microsoft</h3>
<p>Satya-era cultural reset emphasizes:</p>
<ul>
  <li><strong>Growth mindset:</strong> learn from failure; develop yourself and others.</li>
  <li><strong>Customer-obsessed:</strong> understand customers' real problems.</li>
  <li><strong>Diverse and inclusive:</strong> seek different perspectives; build for everyone.</li>
  <li><strong>One Microsoft:</strong> work as one company across product groups.</li>
  <li><strong>Make a difference:</strong> mission-driven; impact at scale.</li>
</ul>

<h3>Apple</h3>
<p>Less publicly codified; values inferred from internal culture and Tim Cook's public statements:</p>
<ul>
  <li><strong>Quality bar:</strong> ship when it's right, not when it's "done."</li>
  <li><strong>Craft at every layer:</strong> from hardware to software to retail.</li>
  <li><strong>Secrecy and discipline:</strong> need-to-know; tight project boundaries.</li>
  <li><strong>Integration:</strong> hardware + software + services as a single experience.</li>
  <li><strong>Customer-first:</strong> not "what is technically possible" but "what is right for the user."</li>
</ul>

<h3>Other notable</h3>
<table>
  <thead><tr><th>Company</th><th>Values emphasis</th></tr></thead>
  <tbody>
    <tr><td>Netflix</td><td>"Freedom &amp; Responsibility"; high judgment; candor; context not control</td></tr>
    <tr><td>Stripe</td><td>Move with urgency; technically rigorous; trust users with complexity</td></tr>
    <tr><td>Airbnb</td><td>"Be a host"; champion the mission; embrace the adventure</td></tr>
    <tr><td>Uber</td><td>(post-2017 reset) Build with heart; stand for safety; differences make us better</td></tr>
    <tr><td>Shopify</td><td>"Get shit done"; trust by default; thrive on change</td></tr>
  </tbody>
</table>

<h3>The "language" rule</h3>
<p>Each value has a vocabulary. Use it natively in your stories without quoting:</p>
<table>
  <thead><tr><th>Value</th><th>Language</th></tr></thead>
  <tbody>
    <tr><td>Amazon "Dive Deep"</td><td>"I traced this all the way back to..."; "I sat with the data for a week..."</td></tr>
    <tr><td>Amazon "Bias for Action"</td><td>"Decided within hours"; "shipped a small change before formalizing"</td></tr>
    <tr><td>Amazon "Customer Obsession"</td><td>"User reports surfaced..."; "the customer's actual problem was..."</td></tr>
    <tr><td>Meta "Move Fast"</td><td>"Two-week prototype"; "shipped to 1% within days"</td></tr>
    <tr><td>Google humility</td><td>"I had assumed X; the data showed Y; I changed my mind"</td></tr>
    <tr><td>Microsoft growth mindset</td><td>"What I learned"; "I now apply this to..."</td></tr>
  </tbody>
</table>

<h3>The "tagging" rule</h3>
<p>For each story in your bank, tag which values it best represents at each target company. Same story, different tags per company.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Pre-loop research checklist</h3>
<ol>
  <li>Read the company's published values (their careers / about / culture pages).</li>
  <li>Find their internal versions if leaked / discussed publicly (Levels.fyi, Glassdoor reviews, Blind threads, employee tweets).</li>
  <li>Find recent talks / interviews by their CEO, CTO, or VPE about culture.</li>
  <li>Read the team-specific information for the role you're interviewing for. Some teams have sub-cultures.</li>
  <li>Make a 1-pager mapping their values to your existing bank.</li>
  <li>Identify gaps — values you can't easily answer for. Develop a story or two specifically for those.</li>
</ol>

<h3>Story-to-value mapping (Amazon LP example)</h3>
<pre><code class="language-text">Story 1 (Memory leak):       Dive Deep, Are Right A Lot, Insist on Highest Standards
Story 2 (GraphQL pushback):  Have Backbone Disagree and Commit, Earn Trust, Are Right A Lot
Story 3 (Flag system fail):  Are Right A Lot (negative), Learn and Be Curious, Frugality
Story 4 (Crash dashboard):   Ownership, Bias for Action, Earn Trust
Story 5 (PM scope creep):    Earn Trust, Have Backbone, Deliver Results
Story 6 (Rapid migration):   Bias for Action, Think Big, Deliver Results
Story 7 (Junior mentor):     Hire and Develop the Best, Earn Trust
Story 8 (RN to Native):      Insist on Highest Standards, Deliver Results, Think Big
Story 9 (Pivot to BFF):      Are Right A Lot, Have Backbone, Bias for Action
Story 10 (3am outage):       Customer Obsession, Bias for Action, Dive Deep, Earn Trust

Coverage check: every LP has at least 1 story. ✓
Gaps: Frugality, Strive to be Earth's Best Employer — develop a story for each.
</code></pre>

<h3>How to use the language naturally</h3>
<table>
  <thead><tr><th>Avoid (quoting)</th><th>Prefer (natural)</th></tr></thead>
  <tbody>
    <tr><td>"This is a Customer Obsession story."</td><td>"The user reports made it clear we had a real problem."</td></tr>
    <tr><td>"I exhibited Bias for Action."</td><td>"I decided within an hour rather than waiting for the next steering meeting."</td></tr>
    <tr><td>"I was practicing Dive Deep."</td><td>"I sat with the data for two days before forming a hypothesis."</td></tr>
    <tr><td>"This was Have Backbone."</td><td>"I respectfully pushed back. I asked her: 'help me understand the constraint we're optimizing for.'"</td></tr>
  </tbody>
</table>

<h3>Reverse questions that signal you've done the work</h3>
<p>Generic reverse questions ("what's the team like?") are wasted opportunities. Value-anchored ones land:</p>
<ul>
  <li><em>"Amazon talks about 'Disagree and Commit.' Can you tell me about a time the team had a serious disagreement and how you got to the commit step?"</em></li>
  <li><em>"How does Meta balance 'Move Fast' with the 'with discipline' caveat? What's an example where you pulled back from speed for quality?"</em></li>
  <li><em>"Google's intellectual humility comes up a lot. When was a time you've changed your mind on something significant in this team?"</em></li>
  <li><em>"What's the most under-rated of Amazon's LPs in your day-to-day, in your opinion?"</em></li>
  <li><em>"Apple's quality bar is famous. What's something the team almost shipped but pulled back on for quality reasons?"</em></li>
</ul>

<h3>Avoiding common reverse-question traps</h3>
<ul>
  <li>Don't <em>quiz</em> the interviewer ("Can you name all 16 LPs?").</li>
  <li>Don't <em>brown-nose</em> ("These values are exactly what I've always believed.").</li>
  <li>Don't <em>challenge</em> the values aggressively ("Don't you think 'Move Fast' has caused harm?").</li>
  <li>Do ask <em>genuine</em> questions about how the team lives the values.</li>
</ul>

<h3>Per-company prep templates</h3>

<h4>Amazon</h4>
<ol>
  <li>Memorize all 16 LPs verbatim.</li>
  <li>Tag each of your 10 bank stories with 2-3 LPs.</li>
  <li>Confirm coverage: every LP should have at least 1 story.</li>
  <li>Develop dedicated stories for under-covered LPs (often Frugality, Strive to be Earth's Best Employer).</li>
  <li>For each interviewer round, identify the assigned LPs (often shared post-loop or inferable from question pattern).</li>
  <li>Plan your reverse question per round to align with that LP's spirit.</li>
</ol>

<h4>Meta</h4>
<ol>
  <li>Read the latest published values; note shifts (e.g., post-2022 the language tightened).</li>
  <li>Develop stories that emphasize velocity-with-discipline.</li>
  <li>Practice "Move Fast" stories where you actively traded off polish for speed and the result was right.</li>
  <li>Have a "long-term impact" story: a small change with outsized eventual leverage.</li>
  <li>For "Be Direct," practice giving and receiving direct feedback in your stories.</li>
</ol>

<h4>Google</h4>
<ol>
  <li>Don't over-rely on a published values list (less codified).</li>
  <li>Have stories that explicitly demonstrate intellectual humility — "I was wrong; here's how I learned."</li>
  <li>Have stories about driving in ambiguity.</li>
  <li>Show collaborative orientation in every story; over-credit teammates.</li>
  <li>For technical questions, demonstrate clear, structured reasoning.</li>
</ol>

<h4>Microsoft</h4>
<ol>
  <li>Lead with growth mindset framing in every story (especially failure stories).</li>
  <li>Tie your decisions back to customers' problems explicitly.</li>
  <li>Have at least one cross-team / cross-org story (One Microsoft).</li>
  <li>Demonstrate inclusivity in your stories (diverse perspectives, mentoring underrepresented colleagues).</li>
</ol>

<h4>Apple</h4>
<ol>
  <li>Quality bar stories — moments you fought for polish, refused to ship "good enough."</li>
  <li>Craft details — show the polish in how you describe your work.</li>
  <li>User-focused framing — "this would have annoyed users" matters more than "this would have been technically inelegant."</li>
  <li>Avoid braggadocio; understatement plays well.</li>
  <li>Don't expect public "values" coverage — interviewers infer alignment from how you operate.</li>
</ol>

<h3>For startups / mid-size companies</h3>
<ol>
  <li>Always read their values page.</li>
  <li>If they don't have one, infer from the founder's blog / podcast / Twitter.</li>
  <li>Ask in the loop: "How would you describe the team's values?" — answers tell you both what to emphasize and reveal alignment / mismatch.</li>
  <li>Don't assume FAANG-style behavioral rigor; some startups skip it; others (e.g., Stripe) are more rigorous than Amazon.</li>
</ol>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Same story, three companies — the GraphQL pushback</h3>

<h4>For Amazon (emphasizes Have Backbone, Are Right A Lot, Earn Trust):</h4>
<pre><code class="language-text">"... I respectfully challenged her proposal. I asked first what she was optimizing for — turned out it was the BFF problem, not GraphQL specifically. I had data showing the perf cost; she had data showing the engineering pain. We spent a week aligning before committing to REST endpoints. Once we committed, I drove the implementation without hedging."

[Embodies: Have Backbone (challenged respectfully), Are Right A Lot (sought her perspective; data-grounded), Earn Trust (didn't undermine her authority), Disagree and Commit (committed fully once decided)]
</code></pre>

<h4>For Meta (emphasizes Move Fast, Be Direct):</h4>
<pre><code class="language-text">"... I built the spike in 2 days, ran the numbers, and surfaced the finding directly: 'this is a real cost. Here's the data.' We pivoted to REST endpoints within the week. Two months later we had shipped checkout on the new architecture without losing the launch window."

[Embodies: Move Fast (2-day spike, week-long pivot), Be Direct (data-grounded confrontation, no hedging)]
</code></pre>

<h4>For Google (emphasizes intellectual humility, collaboration):</h4>
<pre><code class="language-text">"... My initial read was 'GraphQL is bad here.' But sitting with Priya for an hour, I realized her concern about N+1 fetches was completely valid — I had been dismissing it. I changed my framing from 'no GraphQL' to 'how do we solve the BFF problem,' which led us to a REST aggregation approach we both supported."

[Embodies: Intellectual humility (changed mind), Collaboration (sought perspective), User focus (BFF problem traced to user-facing latency)]
</code></pre>

<h3>Example 2: Same memory leak story, three lenses</h3>

<h4>Amazon "Dive Deep":</h4>
<pre><code class="language-text">"I instrumented the heap at 5-minute intervals. The first hypothesis was wrong — there was no event-listener leak. I went deeper, captured allocation stacks, and traced the actual leak to image cache entries that weren't being released by the FlatList virtualization layer."

[The act of going past surface diagnosis to the actual root cause IS Dive Deep.]
</code></pre>

<h4>Apple quality bar:</h4>
<pre><code class="language-text">"The naive fix dropped memory but regressed scroll fps from 58 to 50. I didn't ship that. I refused to take the perf cost. I went back, picked FastImage, integrated it carefully, and shipped a fix that gave us bounded memory AND better scroll perf — improving the user experience on both axes."

[The refusal to accept the regressed scroll performance, even though memory was technically fixed, IS Apple's quality bar.]
</code></pre>

<h4>Meta "Focus on Long-Term Impact":</h4>
<pre><code class="language-text">"I could have shipped a quick LRU cap and called it done. But I knew that if scroll perf regressed, the next 6 months would be patches on top of patches. I chose the deeper fix that solved both perf axes simultaneously, knowing the time investment would pay off in the next year of work."

[Trading short-term ship-faster for long-term cleaner architecture IS Focus on Long-Term Impact.]
</code></pre>

<h3>Example 3: Reverse questions — Amazon</h3>
<pre><code class="language-text">After a behavioral round at Amazon, when asked "any questions?":

"In your team, when there's a 'disagree and commit' moment, what does that look like operationally? Is the disagreement documented somewhere? Does the team revisit it after the commit?"

[Why it works:
- Shows you know the LP.
- Asks about how it's lived, not whether it exists.
- Opens the interviewer to a real story.
- Tests cultural authenticity: if they say 'we don't really do that here,' it's a real signal for you.]
</code></pre>

<h3>Example 4: Reverse questions — Meta</h3>
<pre><code class="language-text">"Meta talks about 'moving fast with discipline.' I'd love to hear an example from your team where the discipline part won — where you slowed down to do something right."

[Why it works:
- Inverts the cliché. Most candidates ask about speed; asking about the discipline angle shows nuance.
- Reveals if they have actual examples or just slogans.]
</code></pre>

<h3>Example 5: Reverse questions — Google</h3>
<pre><code class="language-text">"What's a recent decision your team made where the data initially pointed one way but you ultimately went a different direction?"

[Why it works:
- Probes intellectual humility AND data culture in one question.
- Hard to answer with platitudes — forces specifics.]
</code></pre>

<h3>Example 6: Story with multi-LP coverage (Amazon)</h3>
<pre><code class="language-text">[Crash dashboard story, Amazon-tuned]

[S] We had recurring crashes during high-traffic events. Backend, SRE, and Frontend each thought another team owned alerting.

[T] Nobody was assigned. I decided to take it on, even though it wasn't my role.

[A] I built a unified dashboard joining Sentry crash data with Datadog APM traces. I didn't ask permission first — I shipped a v1 in 2 days and shared it. ["Bias for Action," "Ownership"]

I scheduled a weekly triage with one volunteer per team. I prepared the slides. ["Earn Trust," "Hire and Develop the Best" — making others productive]

The dashboard surfaced data nobody had: at-the-time-of-crash backend latency, keyed by request ID. ["Dive Deep" — going below surface symptoms]

After 4 weeks I proposed a RACI matrix; the teams adopted it. The triage became a 15-min standing meeting. ["Insist on Highest Standards" — turning ad-hoc into process]

[R] Crash rate during traffic events dropped from 1.4% to 0.3% over 2 quarters. [Customer Obsession — measurable end-user impact]

[L] I learned that "going beyond scope" works best when you start with information, not authority. ["Earn Trust" — non-coercive influence]
</code></pre>

<h3>Example 7: Adapting tone to Apple</h3>
<pre><code class="language-text">[Same crash dashboard story, Apple-tuned, more understated]

"Our team had recurring crashes during traffic events. Ownership was unclear across three teams.

I built a small dashboard that combined our crash data with backend latency, keyed by request ID. The data made it obvious which crashes were ours, which were backend, which needed cross-team investigation.

I ran a weekly 30-minute triage. Quietly the ownership confusion dissolved. Crash rate dropped from 1.4% to 0.3% over two quarters.

The lesson I took was that good tooling — a clear, accurate signal — is sometimes more effective than reorganization."

[Notes:
- Less self-promoting.
- Lower verb-temperature ("ran" instead of "drove"; "quietly" rather than "transformed").
- Lesson is reflective and modest.
- Apple's tonal preference is craft + understatement.]
</code></pre>

<h3>Example 8: Mapping a "failure" story to Google</h3>
<pre><code class="language-text">[Flag system story, Google-tuned for intellectual humility]

"I proposed building an in-house feature flag system instead of buying. I had a gut feeling we could do it better; the build estimate was 6 weeks.

I was wrong on three axes. Operational cost was higher than I'd modeled, the rollout work was bigger than I'd scoped, and the targeting features I'd marked phase-2 were actually critical to PMs from day one.

We shipped at week 12. Two weeks after launch we hit a perf regression I'd missed in design. We rolled back for a week while I added the cache layer.

Six months later, we paid for LaunchDarkly anyway. The right call had been there all along; I missed it because I had too much confidence in my gut.

I now write a 'cost of ownership' analysis on every infra proposal — runtime, on-call, audits, growth. I've used that template on 4 proposals since; it's flipped 2 from build to buy."

[Embodies: Intellectual humility (admitting "my gut was wrong" not "my data was wrong"), evidence-driven correction, growth from failure.]
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>"The company's values feel performative"</h3>
<p>Some published values are aspirational rather than lived. You'll know within the first round. Adapt: lean into <em>your</em> values that align with the principles, not into specific phrasing. If the values feel hollow but the work is interesting, focus on the work.</p>

<h3>"My instincts conflict with their values"</h3>
<p>Don't fake fit. If you're applying to Amazon and "Bias for Action" feels uncomfortable, you'll be a bad employee there even if you get hired. Different cultures suit different people. Be honest with yourself.</p>

<h3>"They have no published values"</h3>
<p>Common at smaller companies and series-A startups. Infer from:</p>
<ul>
  <li>Founder's public writing / podcasts.</li>
  <li>Glassdoor / Blind reviews — patterns matter more than individual complaints.</li>
  <li>Asking in the loop: "How does the team make decisions when priorities conflict?"</li>
  <li>The hiring bar itself — what they emphasize in the job description.</li>
</ul>

<h3>"The interviewer doesn't seem to know the values"</h3>
<p>Some companies hire faster than they socialize culture. The interviewer might be 6 weeks in. Don't quote LPs at someone who doesn't know them; just embody the principles and let the rubric do its work.</p>

<h3>"The values are cringe / overused"</h3>
<p>"Customer Obsession" or "Move Fast" can feel like clichés outside their company context. Inside, they have specific operational meaning. Treat the language seriously even if it sounds tired; the rubric is real.</p>

<h3>"My background doesn't match their default profile"</h3>
<p>Bigger companies have profiles they expect (Amazon: senior engineers from large orgs; Google: PhDs / academic; Stripe: engineers with infra depth). If your background differs, double down on the values where you over-index. A non-traditional Amazon candidate with 5 strong "Ownership" stories can outscore a default-profile candidate.</p>

<h3>"They explicitly ask 'which LP / value resonates with you most?'"</h3>
<p>Pick one, give a real reason, tie it to a story:</p>
<pre><code class="language-text">"Are Right A Lot, because of the 'seek diverse perspectives' clause. The most valuable habit I've built recently is making myself talk to people whose default approach differs from mine before locking in a design. Specifically, last quarter when I was sure the answer was X, sitting down with our Backend lead got me to Y, which was right."

[Don't pick the most flattering one; pick one you can defend with specific evidence.]
</code></pre>

<h3>"They ask about a value I have a weak story for"</h3>
<p>Honesty plays. "I don't have a strong example of [value] from my last role. The reason is [context]. If I were operating in your team, here's how I'd approach it..." Then give a hypothetical that demonstrates understanding. Some interviewers prefer this to a fabricated story.</p>

<h3>"The reverse question I planned has been answered"</h3>
<p>Have backups. Always prepare 3 reverse questions per round; if one is preempted, you still have two. If both are preempted, ask: "Knowing what you know about my background, what's the area where you'd be most worried about my fit?" — bold, but signals self-aware.</p>

<h3>"My peer interviewers come from different cultures"</h3>
<p>If you're interviewing at a global company, your interviewers may have different cultural defaults. Stay consistent in your delivery; the values rubric is shared even if individual interviewers' styles vary.</p>

<h3>"I'm interviewing at multiple companies simultaneously"</h3>
<p>Tag each story per-company. Don't try to "merge" — leaning into Amazon's voice in a Google interview is jarring. Do separate prep sessions per target.</p>

<h3>"The values shift between teams within the company"</h3>
<p>Yes, especially Amazon (AWS vs Retail vs Devices have different feel) and Google (Search vs Cloud vs DeepMind). If you have a target team, find someone there and get a read on their internal flavor.</p>

<h3>"The interviewer admits they don't follow the values"</h3>
<p>Rare but happens. They may say: "Honestly, our team is more pragmatic than the values suggest." Adapt — they've told you the truth. Don't quote LPs back at them.</p>

<h3>"I get a values question that's a thinly veiled trap"</h3>
<p>Examples:</p>
<ul>
  <li>"Tell me about a time you took a bold action that backfired." (Bias for Action + Failure dual probe.)</li>
  <li>"Tell me about a time you sacrificed long-term thinking for short-term wins." (Tests judgment in real tradeoff.)</li>
</ul>
<p>Don't avoid the trap by hedging. Pick a real story; show your reasoning honestly; volunteer the lesson.</p>

<h3>"They ask me to rank the values"</h3>
<p>Rare but happens. Possible answer: "I think 'Customer Obsession' anchors the rest — without it, 'Bias for Action' is just speed for speed's sake. But in my day-to-day operating, 'Dive Deep' is what I lean on most because it's the prerequisite for credible decisions." Specific + reasoned + tied to behavior.</p>

<h3>"My reverse question reveals concerns about the team"</h3>
<p>Sometimes asking "tell me about a time the values clashed" surfaces uncomfortable answers. Listen carefully. The information is for both sides — you're evaluating them too.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: Quoting LPs verbatim</h3>
<p>"This is a great example of Customer Obsession because..." The interviewer wants to <em>infer</em> the principle from your story; quoting it back signals rehearsal. Embody the language; don't recite it.</p>

<h3>Bug 2: Forcing every story into a value</h3>
<p>"And so this also demonstrates Earn Trust... and Are Right A Lot... and Bias for Action..." Trying to cover too many LPs in one story dilutes each. Pick the 1-2 most natural fits and emphasize those.</p>

<h3>Bug 3: Memorized principles you can't operationalize</h3>
<p>You know the 16 LPs by heart but can't connect them to your work. Interviewers can tell. Do the actual mapping work — story by story, value by value.</p>

<h3>Bug 4: Mismatched tone</h3>
<p>Apple-tone stories at Amazon land flat (too understated); Amazon-tone at Apple lands aggressive (too self-promoting). Calibrate per company.</p>

<h3>Bug 5: Generic reverse questions</h3>
<p>"What's the team like?" wastes the chance. Anchor reverse questions in their values: "How does this team handle disagree-and-commit moments?"</p>

<h3>Bug 6: Picking the most "popular" value as your favorite</h3>
<p>"Customer Obsession is my favorite!" — every other candidate said the same. Pick something less obvious you can defend with specifics.</p>

<h3>Bug 7: Brown-nosing the values</h3>
<p>"These values are exactly what I've always believed. They're so meaningful." Sounds fake. Engage critically: "X resonates because of [specific reason], though I think Y can be tricky in practice when [scenario]."</p>

<h3>Bug 8: Bashing other companies' values</h3>
<p>"At [previous company] their values were just words; here they seem real." Even if true, this signals you'll bash this company too if you leave.</p>

<h3>Bug 9: Refusing to engage when values feel performative</h3>
<p>You sense the values are aspirational not lived. Don't shut down. Adapt: lean into your own principles that align in spirit. Don't fake belief; do show alignment.</p>

<h3>Bug 10: Ignoring values in the technical rounds</h3>
<p>Behavioral isn't only in the explicit "behavioral" round. Tech rounds also probe value-aligned behavior: "How would you handle X teammate disagreement?" mid-system-design. Stay value-aware throughout.</p>

<h3>Anti-pattern 1: Treating values as performance theater</h3>
<p>Memorizing LPs the night before, parroting them, and forgetting them after the offer. The values matter because they predict <em>your day-to-day experience</em>. If you don't actually operate that way, you'll struggle in the role.</p>

<h3>Anti-pattern 2: Using the same value-tag pack for every company</h3>
<p>Companies' values overlap but don't align perfectly. "Move fast" at Meta is not "Bias for Action" at Amazon (Meta de-emphasizes the "many decisions are reversible" caveat that Amazon stresses). Tune per company.</p>

<h3>Anti-pattern 3: Picking favorites without grounding</h3>
<p>"Bias for Action because I love getting things done." This is generic enthusiasm. "Bias for Action because I've been bitten twice by analysis paralysis on architecture decisions, and I now consciously force myself to pick a direction at week 2 even with imperfect data" — specific, defensible.</p>

<h3>Anti-pattern 4: Ignoring negative signals about culture</h3>
<p>The interviewer sighs when you ask about disagree-and-commit. Take note. Values mismatch shows up in interviews; trust your gut.</p>

<h3>Anti-pattern 5: Over-rotating on values during a tech-heavy role</h3>
<p>Some roles (deep IC at Google, principal at Apple) weight technical assessment heavily; behavioral is a hygiene check. Don't spend more on values prep than tech for these roles.</p>

<h3>Anti-pattern 6: Never reading the latest values</h3>
<p>Meta's values changed in 2022. Amazon added two LPs in 2021. Microsoft refined post-Satya. Read the current versions. Outdated framing dates you.</p>

<h3>Anti-pattern 7: Values that disagree with your ethics</h3>
<p>If a published value conflicts with your ethical stance (privacy, treatment of workers, etc.), engage honestly. "I have questions about how X plays out in practice" is fair. Pretending to align with something you reject sets up a bad employment.</p>

<h3>Anti-pattern 8: Skipping the company-specific tag pass</h3>
<p>If you're interviewing at 5 companies simultaneously, do 5 separate value-tag passes. The 30 minutes per company saves you lukewarm answers.</p>

<h3>Anti-pattern 9: Treating reverse questions as filler</h3>
<p>Reverse questions are graded too. Generic ones cost you signal; thoughtful ones add. Always have 3 prepared per round.</p>

<h3>Anti-pattern 10: Overprepping to the point of stiffness</h3>
<p>You read every Amazon LP article online, watched every Bezos talk, drilled every story 20 times. You arrive ready — but rigid. Real conversations diverge from prep. Practice flexibility too: tell stories with intentional improvisation.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '🎤 Interview Patterns',
      html: `
<h3>Per-company pre-loop checklist</h3>
<table>
  <thead><tr><th>Company</th><th>Pre-loop tasks</th></tr></thead>
  <tbody>
    <tr><td>Amazon</td><td>Memorize 16 LPs verbatim. Tag every story with 2-3 LPs. Confirm coverage. Develop dedicated stories for under-covered LPs.</td></tr>
    <tr><td>Meta</td><td>Read latest values. Lead with velocity-with-discipline. Develop "long-term impact" story. Practice "be direct" framing.</td></tr>
    <tr><td>Google</td><td>Practice intellectual humility framing in every story. Develop ambiguity stories. Over-credit collaborators.</td></tr>
    <tr><td>Microsoft</td><td>Lead with growth mindset in failure stories. Tie to customers explicitly. Have cross-team / cross-org examples.</td></tr>
    <tr><td>Apple</td><td>Quality-bar stories. Understated tone. User-focused framing. Avoid braggadocio.</td></tr>
    <tr><td>Netflix</td><td>High-judgment stories. Candor stories. Context-not-control narratives.</td></tr>
    <tr><td>Stripe</td><td>Technical rigor. Move-with-urgency stories. Trust-users-with-complexity examples.</td></tr>
    <tr><td>Mid-size / startup</td><td>Read founder's writing. Ask about values in the loop. Don't assume; verify.</td></tr>
  </tbody>
</table>

<h3>Live coding warmups (verbal practice)</h3>
<ol>
  <li>Pick a story; deliver it Amazon-tuned. Listen back.</li>
  <li>Same story, Apple-tuned. Note the tone shift.</li>
  <li>Same story, Google-tuned (humility-forward). Note.</li>
  <li>Same story, Meta-tuned (move-fast emphasis).</li>
  <li>Practice: "Which LP / value resonates with you most?" — pick one, explain in 60 seconds.</li>
  <li>Practice: a values-anchored reverse question per company.</li>
</ol>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Values awareness</td><td>You know their published values without prompting.</td></tr>
    <tr><td>Story-to-value mapping</td><td>Your stories naturally embody the principles.</td></tr>
    <tr><td>Language fluency</td><td>You use the company's vocabulary without quoting it.</td></tr>
    <tr><td>Tonal calibration</td><td>Apple-understated, Amazon-direct, Google-humble — matched to the room.</td></tr>
    <tr><td>Reverse questions</td><td>Anchored in values; show genuine curiosity about lived practice.</td></tr>
    <tr><td>Authentic alignment</td><td>You can defend why a value resonates with specific evidence.</td></tr>
    <tr><td>Honest engagement</td><td>You don't fake values you don't hold; you find genuine alignment.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>Mobile teams at FAANG often have sub-cultures: Apple's iOS team has Apple values <em>plus</em> hardware-software craft emphasis; Meta's mobile team has Meta values <em>plus</em> "ship to billions" reliability emphasis.</li>
  <li>Cross-platform decisions (RN vs native) test "Are Right A Lot" / intellectual humility especially well — the right answer depends on context.</li>
  <li>Release-management stories (phased rollout, crash-free user rate, OTA updates) intersect with "Customer Obsession" / "Insist on Highest Standards" / quality bar.</li>
  <li>Performance-on-real-devices stories intersect with "Dive Deep" / craft.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"How heavily are values weighted in the hire decision?"</em> — Amazon: very heavily, can sink a loop. Google: hygiene check unless red flags. Meta: weighted but technical bar dominates. Apple: tonal fit matters but is rarely the sole signal. Mid-size: variable; ask.</li>
  <li><em>"What if I disagree with a company's value?"</em> — Best to be honest with yourself early. If you fundamentally disagree with "Move Fast," Meta will be uncomfortable. Find a culture that fits your operating mode.</li>
  <li><em>"Are values updated based on the candidate?"</em> — No. Values are stable rubrics; what shifts is which stories you emphasize.</li>
  <li><em>"How do I find which LPs I'll be tested on?"</em> — Amazon often tells you; otherwise, the questions reveal the LP. After the loop, your recruiter may share the rubric for development feedback.</li>
  <li><em>"How do I tell if a company's values are real or performative?"</em> — Ask reverse questions probing daily lived practice. Look at retention data, Glassdoor ratings, leadership turnover. Talk to current employees on Blind / LinkedIn.</li>
</ul>

<h3>"What I'd do day one prepping for a values-heavy loop"</h3>
<ul>
  <li>Print the company's values; pin them where you can see during prep.</li>
  <li>Tag each story in your bank against each value.</li>
  <li>Identify gaps (values with no strong story); develop new stories.</li>
  <li>Practice three tones for one signature story: per the company you're targeting.</li>
  <li>Prepare 3 values-anchored reverse questions per round.</li>
  <li>Mock-interview with someone familiar with the company's culture.</li>
  <li>Read 3-4 current employee blog posts / talks for tonal context.</li>
  <li>Be ready for "which value resonates most?" with a defensible answer.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd interview a current employee at the target company about how the values play out day-to-day."</li>
  <li>"I'd record myself delivering one story per company tone and check that the calibration is right."</li>
  <li>"I'd write down 3 values-anchored reverse questions per round, then pick the freshest one based on what's already been discussed."</li>
  <li>"I'd build a per-company tag matrix — same story, different emphasized beats."</li>
  <li>"I'd review each company's most recent values updates (Meta 2022, Amazon 2021) so my framing reflects the current language, not the legacy version."</li>
</ul>

<h3>Behavioral module summary</h3>
<p>Across the three topics:</p>
<ul>
  <li><strong>STAR Framework</strong> — the scaffold for every answer.</li>
  <li><strong>Story Bank</strong> — the inventory you bring into the room.</li>
  <li><strong>Company Values</strong> — the rubric you map your stories to.</li>
</ul>
<p>Master all three; behavioral becomes a strength rather than a hurdle.</p>
`
    }
  ]
});
