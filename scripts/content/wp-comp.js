window.PREP_SITE.registerTopic({
  id: 'wp-comp',
  module: 'workplace',
  title: 'Compensation Conversations',
  estimatedReadTime: '40 min',
  tags: ['compensation', 'salary', 'rsu', 'equity', 'negotiation', 'offers', 'tc', 'levels'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>Compensation is the most leveraged 30 minutes of any year of your career — and the part most engineers fumble. The difference between a "thanks, I'll take it" engineer and a "let me think and come back with a number" engineer over a 10-year career is often $500K-$2M+. The skills are not exotic. They are: knowing your worth, having data, asking for the offer in writing, never accepting on the call, knowing what's negotiable, and being willing to walk.</p>
<ul>
  <li><strong>Total comp = base + RSU + bonus + sign-on + perks.</strong> Most engineers focus on base; the RSU + sign-on are usually larger and equally negotiable.</li>
  <li><strong>Get the offer in writing</strong> before responding. Verbal offers are pre-negotiation theater.</li>
  <li><strong>Never accept on the call.</strong> "Thank you so much. Let me review with my partner / advisor and come back to you by [date]."</li>
  <li><strong>Levels.fyi is the floor of your data.</strong> Use it; supplement with peers, recruiters, and prior offers.</li>
  <li><strong>Negotiate based on competing offers, not feelings.</strong> "Another company offered me X" is the only counter-argument that reliably moves big numbers.</li>
  <li><strong>Negotiate base AND RSU AND sign-on.</strong> Don't just push base. Sign-on is the easiest to bump (one-time, doesn't affect ongoing payroll).</li>
  <li><strong>Comp at current company:</strong> the system is rigged against you. Annual raises rarely match market; promotions help; biggest jumps come from changing companies or competing offers.</li>
  <li><strong>Mobile / RN engineers:</strong> mid-2020s shortage of senior mobile engineers in many markets — leverage scarcity in negotiations.</li>
</ul>
<p><strong>Mantra:</strong> "Get it in writing. Never accept on the call. Have a number. Know the components. Be willing to walk. Document the deal in writing yourself."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What "compensation" actually means at FAANG / mobile-tier companies</h3>
<p>At big tech and well-funded startups, total comp ("TC") is a stack of components. Knowing the stack is the first step.</p>
<table>
  <thead><tr><th>Component</th><th>What it is</th><th>Negotiable?</th></tr></thead>
  <tbody>
    <tr><td><strong>Base salary</strong></td><td>Annual cash, paid biweekly / monthly</td><td>Yes, but bands are tighter than RSU</td></tr>
    <tr><td><strong>Annual bonus</strong></td><td>% of base, performance-modulated (e.g., 15% target × multiplier)</td><td>Target % usually fixed by level; multiplier is perf-driven</td></tr>
    <tr><td><strong>RSU grant</strong></td><td>Stock units vesting over 4 years (varies; cliff or no cliff)</td><td>Yes — often the most negotiable lever</td></tr>
    <tr><td><strong>Sign-on bonus</strong></td><td>One-time cash, often clawback if you leave in 1-2 yrs</td><td>Yes — easiest to bump (one-time = doesn't affect band)</td></tr>
    <tr><td><strong>Relocation</strong></td><td>One-time cash + tax gross-up; or services package</td><td>Yes — usually fixed bands by location</td></tr>
    <tr><td><strong>Refresher RSU</strong></td><td>Annual additional RSU grants tied to perf</td><td>Future, not negotiable at offer time</td></tr>
    <tr><td><strong>Benefits</strong></td><td>401(k) match, health, life, disability, ESPP</td><td>Standard; don't waste negotiation capital</td></tr>
    <tr><td><strong>Perks</strong></td><td>Snacks, gyms, transit, etc.</td><td>Don't negotiate</td></tr>
    <tr><td><strong>PTO / leave</strong></td><td>Days, parental, sabbatical eligibility</td><td>Sometimes (rare — usually fixed policy)</td></tr>
    <tr><td><strong>Title / level</strong></td><td>The actual level you're hired at</td><td>The most leveraged thing to negotiate</td></tr>
  </tbody>
</table>

<h3>Why the level matters more than the dollar</h3>
<p>Levels at large tech companies have wide bands. A senior (L5/E5/IC4 equivalent) hired at the bottom of band makes substantially less than the same role hired at the top. More importantly, your <em>next</em> raise, refresher, bonus, and promotion all reference your level — so a poor level decision compounds for years.</p>
<table>
  <thead><tr><th>Decision</th><th>Year 1 cost</th><th>5-year cost</th></tr></thead>
  <tbody>
    <tr><td>Accept L4 when offered (when L5 was possible)</td><td>~$50-80K TC delta</td><td>~$300-500K (incl. refreshers, promo timing)</td></tr>
    <tr><td>Accept low end of band L5 when top was negotiable</td><td>~$30-50K TC delta</td><td>~$150-250K compounding</td></tr>
    <tr><td>Accept first verbal offer with no counter</td><td>~$20-40K TC delta</td><td>~$100-200K</td></tr>
  </tbody>
</table>
<p>Compensation negotiation is the highest dollar-per-minute work an engineer can do. A 30-minute conversation can move $50K. An hour of preparation can be worth $200K.</p>

<h3>RSU: the part most engineers misunderstand</h3>
<p>RSUs (restricted stock units) are real money — but with caveats:</p>
<ul>
  <li><strong>Vesting schedule matters.</strong> Common: 4 years, monthly or quarterly after a 1-year cliff. Some companies are now front-loaded (33/33/22/12 or 25/25/25/25 with no cliff).</li>
  <li><strong>Stock price volatility.</strong> Your "$200K/year RSU" assumes today's price. Could be 50% lower (or higher) when it vests.</li>
  <li><strong>Tax: RSUs are taxed as income at vest.</strong> Companies usually withhold 22% (US federal default), but your real bracket might be 35%+ — so you may owe more at tax time.</li>
  <li><strong>Refresh grants matter.</strong> Year 5 you have no original grant left. Refresher grants from years 2/3/4 are what you live on. Companies under-grant refreshers vs. new hires; this is the "Year 4 cliff" engineers complain about.</li>
  <li><strong>Pre-IPO / private company RSUs:</strong> different beast (RSUs taxed at IPO, not vest, in many setups). Liquidity risk = real.</li>
</ul>

<h3>Why current-company comp lags</h3>
<p>Annual raises at most companies cap at 4-6%. Market for senior engineers grew 10-30% in good years. Math: if you stay 4 years without a promo or external offer, your TC is 20-40% behind market. This is the "loyalty tax."</p>
<p>Three ways to fix:</p>
<ol>
  <li><strong>Promotion.</strong> Real raise + level reset.</li>
  <li><strong>Equity refresher arms race.</strong> Your manager fights for your refresher size during calibration; depends on perf rating + flight risk perception.</li>
  <li><strong>Competing offer.</strong> The single biggest lever — interview elsewhere, get an offer, present it. Companies will often match or counter to retain. Politically risky in some cultures.</li>
</ol>

<h3>The mobile / RN angle</h3>
<p>Mid-2020s mobile market context:</p>
<ul>
  <li><strong>Senior mobile engineers are scarce.</strong> Many web-first companies struggle to hire. RN engineers with native iOS/Android familiarity are especially scarce.</li>
  <li><strong>Some companies pay a "mobile premium."</strong> Especially fintech / health / consumer-mobile-first products.</li>
  <li><strong>Cross-platform / generalist roles</strong> (RN engineers who can also do web React) are valued by companies trying to consolidate teams — often paid above pure mobile-only.</li>
  <li><strong>Smaller pool of comparable offers</strong> can hurt your negotiation ("the market for me is small") — counter by interviewing widely and including web/full-stack roles in your pipeline.</li>
</ul>

<h3>Why this is a topic engineers consistently fumble</h3>
<table>
  <thead><tr><th>Reason</th><th>Result</th></tr></thead>
  <tbody>
    <tr><td>"I don't want to seem greedy"</td><td>Leave $100K+ on table; recruiters see this and offer less to start</td></tr>
    <tr><td>"I should just be grateful for the offer"</td><td>Same as above; companies expect counter-offers</td></tr>
    <tr><td>"My current employer is fair"</td><td>Almost no current employer pays market without external pressure</td></tr>
    <tr><td>"Negotiating will damage the relationship"</td><td>Recruiters are trained to negotiate; this is normal business</td></tr>
    <tr><td>"I don't have data"</td><td>Levels.fyi, Blind, peers all have data; you didn't look</td></tr>
    <tr><td>"I'm bad at this"</td><td>It's a learnable skill; first time is awful, third time is muscle memory</td></tr>
    <tr><td>"They said it's their best offer"</td><td>It almost never is; "best" = "I'm hoping you accept this"</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The four hats in a comp negotiation</h3>
<p>Different people in the negotiation have different incentives. Knowing them shapes how you respond.</p>
<table>
  <thead><tr><th>Person</th><th>Their incentive</th><th>What they say vs. what they mean</th></tr></thead>
  <tbody>
    <tr><td><strong>Recruiter</strong></td><td>Close offers; targets and comp limits; bonus often tied to closing</td><td>"This is our best offer" = "this is what I'm authorized to give without escalating"</td></tr>
    <tr><td><strong>Hiring manager</strong></td><td>Get a good engineer for their team; usually has some band flexibility</td><td>"We really want you" = "I will fight for budget if needed"</td></tr>
    <tr><td><strong>Comp / HR</strong></td><td>Maintain pay band integrity; minimize comp inflation</td><td>"Outside our band" = "needs VP approval, not impossible"</td></tr>
    <tr><td><strong>You</strong></td><td>Maximize TC, minimize friction, get the role</td><td>The only person whose incentive is purely yours</td></tr>
  </tbody>
</table>

<h3>The "two prices" mental model</h3>
<p>Every negotiation has two prices in your head:</p>
<ul>
  <li><strong>Walk-away number:</strong> below this, you decline.</li>
  <li><strong>Target number:</strong> what you're aiming for.</li>
</ul>
<p>The recruiter has the same two numbers, mirrored:</p>
<ul>
  <li><strong>Their walk-away:</strong> above this, they pull the offer.</li>
  <li><strong>Their target:</strong> what they're aiming to close at.</li>
</ul>
<p>The negotiation is two parties trying to find each other's targets without revealing their own walk-away. The first to anchor (give a number) usually loses — except when you have data + a competing offer, in which case anchoring high is correct.</p>

<h3>The leverage stack</h3>
<p>Your leverage is the sum of these:</p>
<table>
  <thead><tr><th>Source</th><th>Strength</th></tr></thead>
  <tbody>
    <tr><td>Competing offer in writing</td><td>★★★★★ (the only thing that consistently moves big numbers)</td></tr>
    <tr><td>Verbal competing offer or "ongoing process"</td><td>★★★ (some, but recruiters know this can be bluffed)</td></tr>
    <tr><td>Current TC documentation (paystubs, RSU statement)</td><td>★★★ (anchors target above current)</td></tr>
    <tr><td>Levels.fyi data for role + level + location</td><td>★★ (general market evidence)</td></tr>
    <tr><td>Hiring manager strongly wanting you</td><td>★★★ (manager can fight for budget)</td></tr>
    <tr><td>Recruiter's pipeline pressure (Q-end deadlines)</td><td>★★ (recruiters want to close before quarter end)</td></tr>
    <tr><td>Your willingness to walk</td><td>★★★★ (must be real, not bluff)</td></tr>
    <tr><td>"I really need this job"</td><td>0 — actually negative leverage</td></tr>
  </tbody>
</table>
<p>Stack as much as you can. The single highest-leverage thing: a competing offer. Always be running ≥2 processes at once if you're job hunting.</p>

<h3>The "ZOPA" framework (zone of possible agreement)</h3>
<pre><code>Recruiter's max ($X)        ─┐
Recruiter's target            │  ZOPA
Your target                   │  (overlap = deal)
Your walk-away ($Y)         ─┘

If $Y > $X: no deal. You walk or they pull the offer.
If $Y < $X: deal exists. The negotiation finds the price within ZOPA.</code></pre>

<h3>The signaling game</h3>
<p>Every utterance signals. Some signals you want to send:</p>
<ul>
  <li>"I am thoughtful and informed about market rates."</li>
  <li>"I have other options."</li>
  <li>"I want this role, but not at any price."</li>
  <li>"I will be a great employee — but compensation is a separate conversation."</li>
</ul>
<p>Some signals to avoid:</p>
<ul>
  <li>"I really need a job." (Asymmetric leverage to them.)</li>
  <li>"I'll take whatever you offer." (Free money for them.)</li>
  <li>"Let me think about it" without timeline. (Looks indecisive.)</li>
  <li>"My current TC is X" if X is below market. (Anchors low.)</li>
  <li>"What's your range?" (Recruiters love this — they anchor first.)</li>
</ul>

<h3>The "first number" problem</h3>
<p>Whoever says the first number anchors the negotiation. Recruiters know this. They'll try to get your number first.</p>
<table>
  <thead><tr><th>What they say</th><th>What you say back</th></tr></thead>
  <tbody>
    <tr><td>"What are your salary expectations?"</td><td>"I'd like to see the full offer first — base, equity, bonus, sign-on. Then I can give you a thoughtful number."</td></tr>
    <tr><td>"What's your current TC?"</td><td>"I'd rather not share — I'm focused on what makes sense for this role and level. What's the band for this position?"</td></tr>
    <tr><td>"Give me a number; I'll see if we can get there."</td><td>"I'd be happy to discuss specifics once I see the full offer. What can you tell me about the band for this role?"</td></tr>
    <tr><td>"We need a number to move forward."</td><td>"I understand. Based on my research and competing processes, I'm targeting [high but justifiable number]. Where does that land for you?"</td></tr>
  </tbody>
</table>
<p>Note: in some US states (CA, NY, CO, WA, etc.), salary history bans + pay transparency laws have shifted the dynamic. Recruiter must give a band; you don't have to share current. Use this.</p>

<h3>The "drop-in-the-bucket" reality</h3>
<p>For a company hiring a senior engineer at FAANG scale, an extra $50K in offer over 4 years is rounding error in their P&L. For you, it's $50K. The asymmetry is huge — they have less to lose, you have more to gain. Use it. The recruiter is not going to walk away over $25K of sign-on. They might over $200K of TC delta, but rarely over a few percent.</p>

<h3>The "pre-mortem" mental exercise</h3>
<p>Before any comp conversation, imagine you accept the offer as given. Six months in, you find out a peer got $80K more. How do you feel?</p>
<ul>
  <li>"Resentful, would've negotiated harder" → negotiate harder now.</li>
  <li>"Fine — pay was strong" → maybe accept.</li>
  <li>"Furious, would consider leaving" → walk if you can't move the offer.</li>
</ul>
<p>This forces honest evaluation of what you actually want.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>The pre-negotiation checklist</h3>
<ol>
  <li><strong>Know your number.</strong> Walk-away + target. Write them down.</li>
  <li><strong>Have data.</strong> Levels.fyi for role/level/location, supplemented with peers / Blind / recruiter conversations.</li>
  <li><strong>Have alternatives.</strong> Ideally another offer in hand or in late-stage process.</li>
  <li><strong>Know what's negotiable.</strong> Base, sign-on, RSU, level, start date.</li>
  <li><strong>Know what's not.</strong> Benefits, perks, vacation policy (usually).</li>
  <li><strong>Have a script for "send me the offer in writing."</strong></li>
  <li><strong>Have a script for "let me think and come back."</strong></li>
  <li><strong>Know your tax + cost-of-living math</strong> (esp. for relocation).</li>
  <li><strong>Decide acceptance criteria upfront.</strong> Money, role, manager, growth, location — what matters and how much.</li>
</ol>

<h3>The standard offer-conversation flow</h3>
<pre><code>1. Recruiter calls. "Excited to extend an offer..."
   You: "Thank you so much! I'd love to see it in writing so I can review properly. Can you email it to me?"

2. Email arrives with offer.
   You: Read it. Don't respond immediately. Wait at least a few hours.

3. Reply in writing (email).
   You: Acknowledge, ask clarifying questions if needed,
        request time to review.
        "Thanks for sending. A few clarifying questions:
         [Q1, Q2, Q3]. I'll take the next [3-5] business days
         to review with my advisor and come back to you with
         a thoughtful response."

4. Use the time to:
   - Compare to your data
   - Check competing offers / process status
   - Calculate the actual TC over 4 years incl. vesting
   - Decide your counter

5. Counter via email (preferred) or call.
   You: Specific, justified, professional.
        "After review, here's where I'd need the offer to land:
         Base: $X (currently $X-30K)
         RSU: $Y (currently $Y-100K)
         Sign-on: $Z
         Reasoning: [competing offer at $W; market data; level-fit]"

6. Recruiter responds — yes, no, partial.
   - Yes: get updated offer in writing; decide.
   - Partial: counter again or accept.
   - No: decide whether to take or walk.

7. Final decision in writing.
   You: "Accepting offer at [terms in writing]. Looking forward
         to start date [date]."</code></pre>

<h3>Counter-offer templates</h3>
<pre><code>The competing-offer counter (strongest):
"Thanks for the offer. I'm enthusiastic about the role. To be
transparent, I have a competing offer from [Company] at:
 - Base: $X
 - RSU: $Y / 4yr
 - Sign-on: $Z
 - Total: $W
For me to choose [your company], I'd need:
 - Base: $X+ε
 - RSU: $Y+ε
 - Sign-on: $Z+ε
The role / team / mission here is the better fit for me; comp is
the variable. Let me know what's possible."

The market-data counter (without competing offer):
"Thanks for the offer. After reviewing market data for [role + level
+ location], comparable roles are landing at $X-Y total comp. I'd
like to ask whether we can move toward:
 - Base: [target]
 - RSU: [target]
 - Sign-on: [target]
This would put the offer in line with what I'm seeing for this level."

The level-mismatch counter:
"Looking at the offer and the role I'd be doing, I think this is
closer to a [higher level] scope. Can we revisit the level?
At my current company I'm doing [evidence: scope, projects, leadership].
A level adjustment would put the comp in line with the work."

The single-component counter (when overall is close):
"The offer is close to what I'm targeting. The one piece that's
short is sign-on / RSU. Could we move that to $X to close the gap?"</code></pre>

<h3>Specific lever: sign-on bonus</h3>
<p>Sign-on is the easiest knob to turn. Why:</p>
<ul>
  <li>One-time → doesn't affect ongoing payroll budget.</li>
  <li>Doesn't impact comp band → comp/HR happier.</li>
  <li>Often discretionary at recruiter / hiring manager level (no exec approval).</li>
  <li>Compensates for unvested equity at current employer (if you're leaving with unvested RSUs, this is the standard ask).</li>
</ul>
<p>Common ask: "I'm walking away from $80K of unvested RSU at my current company. Can sign-on cover that?" Often: yes.</p>

<h3>Specific lever: RSU</h3>
<p>RSU is usually the largest negotiation lever. Range of motion: 10-30% above initial offer is realistic at FAANG; sometimes more. Tactics:</p>
<ul>
  <li><strong>Anchor with competing-offer RSU values.</strong> "Other offer is $X RSU; can we match?"</li>
  <li><strong>Push for 4-year math.</strong> "Over 4 years, equity at current price is $X. I'd like to see $Y."</li>
  <li><strong>Ask about vesting schedule.</strong> Some companies will accelerate vesting (front-load) which is valuable on PV basis.</li>
  <li><strong>Ask about refreshers.</strong> "What's the typical refresher grant for this level?" — frame for ongoing TC, not just initial.</li>
</ul>

<h3>Specific lever: base salary</h3>
<p>Base bands are tighter. Range of motion: 5-15% typically. Why limited:</p>
<ul>
  <li>Affects payroll budget every year.</li>
  <li>Affects bonus calculation (% of base).</li>
  <li>Affects 401(k) match.</li>
  <li>Affects band integrity (peers in same role at same level).</li>
</ul>
<p>Don't ignore base — it's stable, it's pensionable, it's the floor — but don't expect huge movement.</p>

<h3>Specific lever: level</h3>
<p>The biggest lever. If you're getting offered L4 and you think you're an L5, push. Mechanics:</p>
<ul>
  <li><strong>Reframe the bar.</strong> "Looking at the role description, this looks like our [L5] scope. Can we discuss leveling?"</li>
  <li><strong>Use evidence.</strong> Past projects, scope, leadership, peer-level data. Speak to the rubric.</li>
  <li><strong>Be willing to do another loop.</strong> Many companies will offer to re-interview at higher level if you push and have data.</li>
  <li><strong>Be willing to walk.</strong> Down-leveling is the most common reason to decline a FAANG offer.</li>
</ul>

<h3>The "exploding offer" defense</h3>
<p>Some recruiters say "this offer expires in 48 hours." Strategies:</p>
<ul>
  <li><strong>Push back politely.</strong> "I need to give this proper consideration with my partner / advisor. Can we extend to a week?"</li>
  <li><strong>Most recruiters fold.</strong> Genuine 48-hour expirations are rare; usually it's a tactic.</li>
  <li><strong>If they don't fold:</strong> consider walking. An exploding offer is a sign of a company / recruiter that doesn't respect process. Bigger problems may follow.</li>
</ul>

<h3>Negotiating at your current company</h3>
<p>Three forms:</p>
<ol>
  <li><strong>Annual cycle.</strong> Limited — usually 3-7% raises capped by HR. Push at the margins; manager has some discretion.</li>
  <li><strong>Promotion.</strong> Real raise + level reset. The most reliable internal path. See <a href="#" data-topic="wp-perf-promo">Performance Reviews & Promo Narratives</a>.</li>
  <li><strong>Retention against competing offer.</strong> The biggest lever. Steps:</li>
</ol>
<pre><code>- Get a competing offer (real one, not bluffed).
- Bring to manager: "I have an offer from X. I'd prefer to stay,
  but the comp delta is significant. Can we close the gap?"
- Manager goes to HR / leadership for retention package.
- They come back with: matching, partial match, or "we can't."
- You decide.</code></pre>
<p><strong>Caveats:</strong></p>
<ul>
  <li>Your manager is now aware you'll consider leaving — affects future trust in some cultures.</li>
  <li>Retention packages are often equity-only, not base. Quality varies.</li>
  <li>Some companies have a strict "no counter" policy — they don't match, ever. Ask peers about culture before you bring an offer.</li>
  <li>If they match: be sure you actually want to stay. People who stay for the comp often regret it 6-12 months later.</li>
</ul>

<h3>The 4-year TC calculation</h3>
<p>Don't just compare year-1 TC. Compare 4-year TC, ideally with a sensitivity for stock price.</p>
<pre><code>Offer A: Year 1 = $400K, RSU vest = 25% / yr × 4
   4-yr TC (flat stock): $1,600K
   4-yr TC (-30% stock): $400K base path + (RSU × 0.7) ~ $1,300K

Offer B: Year 1 = $450K, RSU front-loaded 50/25/15/10
   Year 1: $250K + RSU × 0.5 (heavy front-load)
   Years 2-4 lower
   4-yr TC depends heavily on refresher grants

Always model out 4 years; refreshers can flip the comparison.</code></pre>

<h3>The "show me the numbers" demand</h3>
<p>Always insist on:</p>
<ul>
  <li>Written offer letter with all components.</li>
  <li>Exact RSU grant size in dollars (and # of shares + share price used).</li>
  <li>Vesting schedule (cliff, cadence).</li>
  <li>Sign-on details (timing, clawback if you leave early).</li>
  <li>Bonus % and target.</li>
  <li>Start date.</li>
  <li>Title and level.</li>
</ul>

<h3>The "after acceptance, before start" period</h3>
<ul>
  <li>Get the signed offer to your lawyer / advisor for review (esp. non-compete, IP assignment).</li>
  <li>Don't quit current job until counter-signed offer is in hand.</li>
  <li>Do start handoff at current company smoothly — your manager may be a future reference.</li>
  <li>Notice period: standard 2 weeks in US. Some companies have 4-week notice in offer; respect it both ways.</li>
</ul>

<h3>What to do if you accidentally accepted too fast</h3>
<p>Sometimes you accept on the call before realizing you could have negotiated. Recovery:</p>
<ol>
  <li><strong>Don't beat yourself up.</strong> Done is done; learn for next time.</li>
  <li><strong>If you have a competing offer come in after:</strong> "I've received another offer. I'd like to stay with [accepted company]. Can you revisit comp?" Some companies will bump; some won't. Worth asking.</li>
  <li><strong>Otherwise:</strong> ride this one out, plan the next negotiation properly.</li>
  <li><strong>Document the lesson.</strong> Write it down so you don't repeat.</li>
</ol>
`
    },
    {
      id: 'examples',
      title: '🔍 Worked Examples',
      html: `
<h3>Example 1: Initial offer at FAANG-tier company</h3>
<p><strong>Setup:</strong> Senior offer (L5/E5 equiv). Recruiter calls Tuesday afternoon.</p>

<p><strong>The call:</strong></p>
<pre><code>Recruiter: "Excited to extend an offer! Base $215K, sign-on $50K,
            RSU $600K over 4 years, 15% bonus target. Total ~$430K
            year 1. What do you think?"

You:       "That's exciting, thank you so much. Can you email me
            the formal offer letter so I can review it carefully?
            I want to talk it over with my partner and come back to
            you with a thoughtful response."

Recruiter: "Of course. When can we expect a response?"

You:       "Let me come back to you within 5 business days. Is
            that okay?"</code></pre>

<p><strong>Email arrives with formal offer. You:</strong></p>
<ul>
  <li>Compare to Levels.fyi: senior at this company is $400-550K TC. You're at $430K — middle of band.</li>
  <li>Check competing offer: you have a $470K offer from another tier-1 company.</li>
  <li>Calculate 4-year TC: ~$1.65M nominal.</li>
  <li>Decide target: $480K year 1.</li>
</ul>

<p><strong>Counter email:</strong></p>
<pre><code>Subject: Thoughts on the offer

Hi [Recruiter],

Thanks again for the offer. I'm genuinely excited about the role,
the team, and [specific thing about company]. I want to share where
I am to see if we can get to yes.

I have a competing offer from [Other Company] for $470K total comp
(detail: $225K base / $580K RSU / $60K sign-on / 18% bonus).

For me to feel great about [your company], I'd be looking for:
- Base: $225K
- RSU: $700K / 4yr
- Sign-on: $80K (covers ~$70K unvested at current company)
- Bonus target: same 15%

Total ~$485K year 1. The role here is the better fit; comp is
the deciding factor.

Happy to talk through this on a call if helpful. Otherwise, looking
forward to your response.

Thanks,
Prakhar</code></pre>

<p><strong>Outcome (typical):</strong> Recruiter goes to comp/manager. Comes back with: $222K base / $660K RSU / $75K sign-on. Total ~$465K. You accept (small concession) or push once more for sign-on. Net: ~$35K/year more than initial offer, $140K over 4 years, for ~3 hours of work.</p>

<h3>Example 2: Down-level concern</h3>
<p><strong>Setup:</strong> You're a Senior at current company (5 years post-undergrad). Offer comes in at L4 (mid-level) with comp adjusted accordingly. Comp delta from L5 is ~$100K/yr.</p>

<p><strong>Bad: accept and grind.</strong> 18 months later, peer at L5 is making $150K more, you're frustrated.</p>

<p><strong>Good: push leveling first.</strong></p>
<pre><code>Subject: Quick question on level before discussing comp

Hi [Recruiter],

Thanks for the offer. Before we discuss comp specifics, I want to
revisit the level.

Looking at [your company]'s public level guides and the role
description, I think this role is closer to a Senior [L5]:
- Scope: I'd be leading [X], which sounds like L5 scope per your
  rubric.
- Current role: I'm a Senior at [current], leading [project Y]
  with [team size / scope].
- Comparable peers: [examples].

Could we revisit the level? Happy to do another technical /
system-design loop at L5 if that helps the calibration.

Thanks,
Prakhar</code></pre>

<p><strong>Outcome:</strong> Half the time, they'll do a quick re-assessment and bump (they wanted you anyway). Half the time, they hold firm; you decide whether L4 is acceptable. Worst case: you lose nothing by asking.</p>

<h3>Example 3: Negotiating at current company (counter-offer)</h3>
<p><strong>Setup:</strong> You've been at current company 3 years. Comp is $370K. Market for your level is $450-500K. You have a written offer from another company at $480K.</p>

<p><strong>Bad: bring offer to manager and demand match.</strong> Triggers a "Prakhar is leaving" defensive response.</p>

<p><strong>Good: collaborative framing.</strong></p>
<pre><code>1:1 with manager:

"I want to share something with you and get your read.

I've been thinking about my long-term career here. You've been a great
manager and I want to stay. But I've also been getting interest
from other companies, and I have a written offer from [Company X] at
$480K total comp.

I'd prefer to stay at [current company]. The team is great, the work
is meaningful, my growth here has been strong. But the comp delta is
significant — about $110K/year — and I'd be making a big financial
decision to turn it down.

Is there room to close that gap on our side? I know the process
takes time and isn't guaranteed; I'm not threatening to leave, I'm
asking what's possible. I want to make this decision with full
information, and ideally with you advocating for me."</code></pre>

<p><strong>Outcome (typical):</strong> Manager goes to skip and HR. Comes back with: equity refresher of $200-400K, sometimes a base bump. Whether you stay depends on the gap. Be prepared either way.</p>

<p><strong>Risk to manage:</strong> Some managers / cultures hold this against you long-term. Read culture before you do this. If you're at a "if you bring an offer, you've already decided to leave" company, this strategy backfires.</p>

<h3>Example 4: Multiple offers — playing them off</h3>
<p><strong>Setup:</strong> Two written offers. A: $440K. B: $470K. You prefer A (better team / role).</p>

<p><strong>To A:</strong></p>
<pre><code>"I have a competing offer at $470K. I'd like to choose [A] — the
team and the work fit me better — but the gap is hard to ignore.
Can we close it?"</code></pre>

<p><strong>To B:</strong></p>
<pre><code>"You're currently the high offer. I'm trying to decide between you
and another company that's the better cultural / role fit. To make
this work for me, I'd need [either nothing or a small bump]."</code></pre>

<p><strong>Outcome:</strong> A often matches B (or splits the difference). You take A at $460K. Net: $20K more than initial A, $10K less than B nominal but better fit. Best of both.</p>

<h3>Example 5: The exploding offer</h3>
<p><strong>Setup:</strong> Recruiter calls Friday at 4pm: "We need a decision by Monday morning."</p>

<p><strong>Response:</strong></p>
<pre><code>"I appreciate the urgency. To give this the consideration it
deserves — discussing with my partner, comparing to other offers —
I'd need until [+5-7 business days]. Is that workable?

If timing is genuinely a hard constraint on your side, can you
help me understand why? In my experience, a few extra days is
usually fine for a senior decision."</code></pre>

<p><strong>Most likely outcome:</strong> They extend. They were testing.</p>
<p><strong>Edge case:</strong> They hold firm. Decision: walk, or accept under duress. Walking is often the right move — the message is "we don't trust your judgment to make a quick decision," which signals their culture.</p>

<h3>Example 6: Negotiating perks / non-cash items</h3>
<p><strong>When offer is at top of band and they "literally cannot move comp":</strong></p>
<ul>
  <li>Sign-on bonus (one-time, easier).</li>
  <li>Earlier start date / later start date (your preference).</li>
  <li>Title (free for them, can matter to you for future).</li>
  <li>Manager assignment (in larger orgs, you may have flexibility).</li>
  <li>Remote-work flexibility (if not standard).</li>
  <li>Relocation package size.</li>
  <li>Specific project / team commitment in writing.</li>
  <li>Vesting acceleration on equity (rare, but possible).</li>
</ul>

<p><strong>Email:</strong></p>
<pre><code>"Understood that base / RSU are at the top of band. Two non-comp
asks that would help me close:
1. Title: senior staff (one above what's in the offer) — better
   reflects role scope.
2. Sign-on: $30K (covers unvested at current).
Either of those workable?"</code></pre>

<h3>Example 7: Mobile / RN-specific market premium</h3>
<p><strong>Setup:</strong> You're a senior RN engineer. Web-first company is hiring you to start their mobile team.</p>

<pre><code>"For context: senior RN engineers with native iOS / Android
familiarity are scarce in this market — the typical RN-focused
senior comes in at $480-540K TC at comparable companies. Given that
this role specifically wants me to bootstrap your mobile practice
(which is more scope than a typical senior), I'd expect comp to
land toward the top of that range. My current asks:
- Base: $235K
- RSU: $700K / 4yr
- Sign-on: $100K
- Senior staff title (reflective of scope)"</code></pre>

<p><strong>Outcome:</strong> Smaller / web-first companies often have less calibration confidence on mobile, which means they're more flexible. The premium is real if you can articulate scarcity + scope.</p>

<h3>Example 8: When you accept and shouldn't have</h3>
<p><strong>Setup:</strong> You're nervous, the offer comes in lower than expected, you say "yes, I'll take it" on the phone in panic.</p>

<p><strong>Recovery move:</strong></p>
<pre><code>Email a few hours later:

"Following up on our call. Reflecting more carefully on the offer,
I realize I'd like to revisit a couple of components before
finalizing in writing. Specifically [X and Y]. I want to make
sure we both feel great about this. Can we have a 15-min call
tomorrow?"</code></pre>

<p>Verbal yes is not binding. The signed offer letter is. Most recruiters will accept a re-discussion, especially if you frame it as "I want to make sure I sign with full confidence."</p>

<h3>Example 9: When you should walk</h3>
<p>Walk-aways with examples:</p>
<ul>
  <li><strong>"This is the band, take it or leave it."</strong> No wiggle on level, sign-on, or anything else. Walk if the number doesn't work.</li>
  <li><strong>"We pulled the offer because you negotiated."</strong> Run. Company that pulls offers for normal negotiation is dysfunctional.</li>
  <li><strong>Verbal commitment doesn't match written.</strong> Walk; trust is broken at offer stage.</li>
  <li><strong>You're being pressured into accepting in &lt;48 hours with no flexibility.</strong> Walk.</li>
  <li><strong>Manager seems iffy in interviews + comp is mediocre.</strong> The manager you have is the job you have. Walk if both signals are bad.</li>
</ul>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Pre-IPO equity</h3>
<p>RSUs at private companies are different. Common structures:</p>
<ul>
  <li><strong>RSUs with double-trigger vesting:</strong> shares vest only on (a) time AND (b) liquidity event (IPO / acquisition). If no IPO, no liquidity, you may get nothing despite "vested."</li>
  <li><strong>Stock options (ISO/NSO):</strong> right to buy at strike price; have to exercise (= pay money) to get shares. Tax complexity around AMT for ISOs.</li>
  <li><strong>409A valuation:</strong> the price the company says shares are worth. May or may not reflect what they'll be worth at IPO.</li>
  <li><strong>Liquidity programs:</strong> some companies offer secondary sales (employees can sell some shares to investors before IPO). Ask.</li>
</ul>
<p>For pre-IPO offers: discount RSU value heavily. Probability of liquidity × time-to-liquidity × dilution risk = real expected value, often 20-50% of the headline number.</p>

<h3>Visa / immigration leverage and constraints</h3>
<p>If you're on H-1B / similar:</p>
<ul>
  <li><strong>Sponsorship matters more than $20K.</strong> Don't lose a sponsoring offer over comp pennies.</li>
  <li><strong>But sponsoring companies know you have constraints</strong> and may low-ball. Push back with data — visa status doesn't legally affect comp.</li>
  <li><strong>Green card sponsorship is itself comp.</strong> "Will you start GC immediately?" is a legitimate question. Each year of delay has compounding cost.</li>
  <li><strong>60-day rule (US H-1B):</strong> if laid off, you have 60 days to find another sponsor. Plan for this; build savings buffer (see <a href="#" data-topic="wp-layoffs">Layoff Survival</a>).</li>
</ul>

<h3>Internal transfer comp</h3>
<p>Moving to another team / org / location internally — comp adjustments:</p>
<ul>
  <li><strong>Most companies don't bump comp on internal transfer.</strong> "Same role, same level, same pay."</li>
  <li><strong>Some adjust for cost of living</strong> (esp. moves between high/low COL areas).</li>
  <li><strong>If new role is materially different scope:</strong> push for level review at transfer time.</li>
  <li><strong>Internal transfers are often comp-disadvantaged</strong> compared to external hires for the same role. The "internal mobility tax" is real.</li>
</ul>

<h3>Acquihire / acquisition comp</h3>
<p>If your company is being acquired:</p>
<ul>
  <li><strong>Retention packages</strong> are common for engineering staff. Read the terms — often vest over 2-3 years post-acquisition.</li>
  <li><strong>Equity acceleration</strong> on acquisition varies. Some plans have single-trigger (acquisition itself accelerates); most have double-trigger (acquisition + termination within X months).</li>
  <li><strong>You may be re-leveled</strong> in the acquirer's system. Push for clarity before acquisition closes.</li>
</ul>

<h3>Severance / exit packages</h3>
<p>See <a href="#" data-topic="wp-layoffs">Layoff Survival & Recovery</a> for full treatment. Key comp angles:</p>
<ul>
  <li>Severance is negotiable. First offer is rarely best.</li>
  <li>Equity acceleration on exit (rare, but ask).</li>
  <li>Bonus pro-ration for partial year.</li>
  <li>Reference + LinkedIn endorsement as part of exit terms.</li>
  <li>Healthcare continuation (COBRA cost coverage).</li>
</ul>

<h3>Internal calibration tax</h3>
<p>Once hired at a level, your comp is constrained by company calibration. Even if you over-perform, getting to top-of-band takes years (manager fights for you, but other peers are also fighting for slots). The implication: <em>negotiate hard at hire time</em>; you can't easily make up for low entry comp later.</p>

<h3>The "we pay top of market" claim</h3>
<p>Companies that say "we pay top of market" sometimes mean it; often don't. Verify with data. "Top of market" in their analysis might mean P50 of FAANG, which is below P75. Don't accept the claim; check the numbers.</p>

<h3>Taxes — multi-state and remote</h3>
<ul>
  <li><strong>Working remotely from a different state</strong> than your employer: your state taxes apply, sometimes both states. Plan for it.</li>
  <li><strong>RSU income is taxed in the state where you worked when they vested.</strong> Moves can complicate this.</li>
  <li><strong>International remote</strong> — entirely different game. Permanent establishment, employer tax obligations, your tax residency. Get a CPA.</li>
  <li><strong>Bonus / sign-on are taxed at supplemental withholding rates</strong> — often 22% federal, but your bracket is higher; you'll owe at year-end.</li>
</ul>

<h3>Equity refreshers — the "Year 4 cliff"</h3>
<p>Year 4 of your tenure: original RSU grant fully vested. New RSU income depends entirely on refreshers from years 2-3-4. Most companies under-grant refreshers vs. new hires (~30-50% of initial grant). So Year 5 TC is often noticeably below Year 1-4. Defenses:</p>
<ul>
  <li>Negotiate refresher size during perf reviews; especially as a senior, ask about it.</li>
  <li>Promotion = refresher reset.</li>
  <li>External offer = retention package, often equity-heavy = effectively a refresher.</li>
  <li>If none of the above: consider that staying past year 5 may be a comp downgrade.</li>
</ul>

<h3>Bonus structures vary wildly</h3>
<ul>
  <li><strong>Performance bonus:</strong> % of base × team multiplier × individual multiplier. Common at most companies.</li>
  <li><strong>Spot bonus / discretionary:</strong> ad-hoc; uncommon to factor into TC.</li>
  <li><strong>Profit sharing / company performance:</strong> variable based on company financials.</li>
  <li><strong>Cash + stock bonus mix:</strong> some companies pay bonus partially in stock.</li>
</ul>
<p>When comparing offers, normalize bonus assumptions (use "target" not "max").</p>

<h3>Negotiating when desperate</h3>
<p>If you're laid off, broke, or otherwise desperate, your leverage drops. Recovery:</p>
<ul>
  <li><strong>Don't telegraph desperation.</strong> Recruiter doesn't need to know your runway.</li>
  <li><strong>Get multiple offers.</strong> Even one competing offer is huge leverage.</li>
  <li><strong>Take the offer if it's adequate;</strong> don't push so hard you lose it. There's a non-zero chance recruiters walk if pushed past threshold and you have no alternatives.</li>
  <li><strong>Plan for next negotiation in 18 months</strong> — accept this round, prep for the next from a stronger position.</li>
</ul>

<h3>Cultural mismatch in negotiation styles</h3>
<p>Some cultures don't negotiate (Japan, parts of EU). Some negotiate everything (US). Some have salary transparency that constrains both sides. Adjust:</p>
<ul>
  <li>If you're from a low-negotiation culture moving to a high-negotiation culture, learn the norms — over-deferential here costs you money.</li>
  <li>If you're from a high-negotiation culture in a low-negotiation culture, calibrate down — aggressive negotiation can damage relationships.</li>
  <li>Pay-transparent cities (NYC, CA, CO, WA) require posted ranges — start with that.</li>
</ul>

<h3>Counter-offers from current company — when to accept</h3>
<p>Industry research suggests engineers who accept counter-offers stay only 6-12 months on average. Reasons it's risky:</p>
<ul>
  <li>The reasons you wanted to leave (besides comp) are usually still there.</li>
  <li>Your manager / company now sees you as a flight risk.</li>
  <li>You may be passed over for next promotion.</li>
</ul>
<p>That said: counter-offers can work if (a) the only reason you considered leaving was comp, and (b) the counter-offer fully addresses it, and (c) culture isn't punitive about counter-acceptances. Otherwise: take the new offer.</p>

<h3>Compounding effect of negotiating well over a career</h3>
<table>
  <thead><tr><th>Scenario</th><th>Year-1 TC</th><th>10-yr cumulative TC (assumes ~10% growth + same negotiation discipline)</th></tr></thead>
  <tbody>
    <tr><td>Accept all initial offers, never negotiate</td><td>$300K</td><td>~$4.8M</td></tr>
    <tr><td>Negotiate every offer +10%</td><td>$330K</td><td>~$5.3M (+$500K)</td></tr>
    <tr><td>Negotiate every offer +20% + change companies every 3 yrs</td><td>$360K + jumps</td><td>~$6.5M+ (+$1.7M)</td></tr>
  </tbody>
</table>
<p>This compounds because each negotiation anchors the next: your "current TC" becomes the data point for your next offer.</p>
`
    },
    {
      id: 'bugs',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Anti-pattern: accepting verbally on the call</h3>
<p><strong>Looks like:</strong> "Great, I'll take it!" said in the heat of excitement.</p>
<p><strong>Why bad:</strong> Locks in the recruiter's first offer; signals you'll accept anything; eliminates negotiation room.</p>
<p><strong>Fix:</strong> Default response: "Thank you so much! Can you send me the offer in writing? I'd like to review it carefully and come back to you within [N] days."</p>

<h3>Anti-pattern: revealing your current TC</h3>
<p><strong>Looks like:</strong> "I'm currently making $300K total."</p>
<p><strong>Why bad:</strong> Anchors the new offer at $300K + small bump, even if the role is worth $450K.</p>
<p><strong>Fix:</strong> "I'd rather not share — I'm focused on what makes sense for this role and level. What's your band for this role?" In states with salary history bans, you have legal protection.</p>

<h3>Anti-pattern: revealing your minimum acceptable</h3>
<p><strong>Looks like:</strong> "I really need at least $250K to make this work."</p>
<p><strong>Why bad:</strong> Locks them into offering $250K. They were maybe going to offer $300K.</p>
<p><strong>Fix:</strong> Don't share your floor. Anchor with target, not floor.</p>

<h3>Anti-pattern: over-justifying your counter</h3>
<p><strong>Looks like:</strong> Long paragraph about expenses, kids, market conditions, why you deserve more.</p>
<p><strong>Why bad:</strong> Defensive. Recruiter cares about market data + competing offers, not your personal finances.</p>
<p><strong>Fix:</strong> Brief, professional. "Here's where I need it to land. Here's why (data). Let me know what's possible."</p>

<h3>Anti-pattern: bluffing competing offers</h3>
<p><strong>Looks like:</strong> Lying about an offer you don't have.</p>
<p><strong>Why bad:</strong> Recruiters sometimes ask for proof. Caught lying = offer pulled. Even if not caught, your negotiation built on lies is fragile.</p>
<p><strong>Fix:</strong> If you don't have a competing offer, use market data + your worth. "Based on Levels.fyi data for this role + my background, I'd target $X."</p>

<h3>Anti-pattern: only negotiating base</h3>
<p><strong>Looks like:</strong> Push for $20K more base; ignore RSU and sign-on.</p>
<p><strong>Why bad:</strong> RSU and sign-on are usually the biggest movement areas. Base bands are tightest.</p>
<p><strong>Fix:</strong> Negotiate the whole package. Ask for movement on all components; let recruiter pick where they have flexibility.</p>

<h3>Anti-pattern: trusting "this is our best offer"</h3>
<p><strong>Looks like:</strong> Recruiter says it; you accept.</p>
<p><strong>Why bad:</strong> "Best offer" almost always means "what I'm authorized to give without escalating." There's usually a step beyond.</p>
<p><strong>Fix:</strong> Politely test. "I appreciate that. To make this work for me, I'd need [target]. Can you go back and see what's possible? If not, I understand."</p>

<h3>Anti-pattern: negotiating without data</h3>
<p><strong>Looks like:</strong> "I think I deserve more" with no supporting data.</p>
<p><strong>Why bad:</strong> Easy to dismiss. Sounds emotional, not informed.</p>
<p><strong>Fix:</strong> Levels.fyi numbers; competing offers; specific scope claims. Anchor on data, not sentiment.</p>

<h3>Anti-pattern: accepting an offer you can't honor</h3>
<p><strong>Looks like:</strong> Accept role / level you suspect is over your head; or accept salary that requires sacrifices you'll resent.</p>
<p><strong>Why bad:</strong> Either you fail in the role or burn out from comp resentment.</p>
<p><strong>Fix:</strong> Honest self-assessment before accepting. The first 6 months at a new company are hard regardless; don't make them harder with a misfit.</p>

<h3>Anti-pattern: negotiating the wrong things</h3>
<p><strong>Looks like:</strong> Pushing for an extra week of vacation when comp is way below market.</p>
<p><strong>Why bad:</strong> Wastes negotiation capital on small items while ignoring large ones.</p>
<p><strong>Fix:</strong> Sequence — comp first (largest dollar items), then perks if any room left.</p>

<h3>Anti-pattern: not getting things in writing</h3>
<p><strong>Looks like:</strong> "The recruiter promised me $X RSU" — but offer letter says less.</p>
<p><strong>Why bad:</strong> Verbal promises don't survive comp/HR. Once you sign, you have what's in writing.</p>
<p><strong>Fix:</strong> Anything you negotiate must appear in the final offer letter. Read carefully. If something's missing, push back before signing.</p>

<h3>Anti-pattern: negotiating after signing</h3>
<p><strong>Looks like:</strong> Signed offer, then trying to extract more.</p>
<p><strong>Why bad:</strong> You have no leverage. Damages relationship before day one.</p>
<p><strong>Fix:</strong> All negotiation happens before signing. Once signed, you commit.</p>

<h3>Anti-pattern: making the negotiation personal</h3>
<p><strong>Looks like:</strong> Frustration at the recruiter; treating it like a battle.</p>
<p><strong>Why bad:</strong> The recruiter isn't your enemy; they're a person doing their job. Bad vibes from negotiation poison your day-1 relationship.</p>
<p><strong>Fix:</strong> Keep it professional, warm, transactional. The recruiter wants you to take the offer; you're working with them, not against them.</p>

<h3>Anti-pattern: solo negotiation when stakes are high</h3>
<p><strong>Looks like:</strong> Major offer ($500K+ TC); negotiating without advice.</p>
<p><strong>Why bad:</strong> One-shot decision affects years of comp. Easy to make $50-100K mistakes solo.</p>
<p><strong>Fix:</strong> Talk to peers, mentors, even a comp negotiation coach for big offers. Some coaches charge $200-500 and routinely return $20-50K to their clients.</p>

<h3>Anti-pattern: comparing offers wrong</h3>
<p><strong>Looks like:</strong> "Offer A has $20K more base than B" without comparing equity, location, COL, taxes, growth.</p>
<p><strong>Why bad:</strong> Surface-level comparison; doesn't capture true 4-year value.</p>
<p><strong>Fix:</strong> 4-year TC modeled out. Cost of living adjustments. Career growth multipliers. Manager / team quality (worth thousands).</p>

<h3>Anti-pattern: emotional spending after a big offer</h3>
<p><strong>Looks like:</strong> Sign $500K offer; immediately upgrade lifestyle.</p>
<p><strong>Why bad:</strong> RSU price drops, layoffs happen, taxes are higher than expected — and now your fixed costs are locked in.</p>
<p><strong>Fix:</strong> Treat first 6 months as continuation of current lifestyle. Save aggressively. Adjust slowly once you've seen actual after-tax cash.</p>

<h3>Anti-pattern: never asking for refresher / promo comp</h3>
<p><strong>Looks like:</strong> Never bringing up comp during your tenure; assume system will fix itself.</p>
<p><strong>Why bad:</strong> System won't fix itself. Engineers who advocate for their comp during 1:1s and reviews get more refreshers + bumps.</p>
<p><strong>Fix:</strong> Once a year, in 1:1, raise the topic. "I've been here N years; my last comp adjustment was [date]. Looking at market data + my contributions, I think we should revisit. Can we work toward [target] in this cycle?"</p>
`
    },
    {
      id: 'interview',
      title: '🎤 Interview Patterns',
      html: `
<h3>Comp questions in initial recruiter screens</h3>
<p>Most interviews start with a recruiter screen; comp questions come up early. Standard playbook:</p>

<h4>"What are your salary expectations?"</h4>
<pre><code>Strong response:
"I'd like to learn more about the role and level before pinning a
number. What's the band for this role? Once I have that and have
done the technical loops, I can give a thoughtful response."</code></pre>

<h4>"What's your current TC?"</h4>
<pre><code>Strong response:
"I'd rather focus on what makes sense for this role. My current TC
isn't necessarily the right anchor — I'm looking at where the
market is for [role + level] right now. What's your band?"</code></pre>

<p>(Note: in CA, NY, CO, WA, etc., laws restrict employers from asking salary history. Use legal protection.)</p>

<h4>"We need a number to move forward in the process."</h4>
<pre><code>Strong response:
"I understand. Based on market data for this level (Levels.fyi shows
the range as $X-Y) and comparable processes I'm in, I'd target $Y-Z
total comp. Where does that land for you?"</code></pre>

<h4>"You're at the top of our band."</h4>
<pre><code>Strong response:
"Thanks for sharing. Two thoughts:
 1. Could we discuss a level adjustment? Looking at the role scope,
    it might be closer to [next level].
 2. If band is firm, what's the room on sign-on / RSU? Those are
    typically the most flexible parts of the package."</code></pre>

<h3>Behavioral interview: "Tell me about a comp negotiation"</h3>
<p>Less common in eng interviews but does come up at staff+ levels (managerial track) or in high-trust interviewers checking maturity.</p>

<h4>Strong answer template</h4>
<ol>
  <li>Setup: the offer / situation.</li>
  <li>Preparation: data, alternatives, target.</li>
  <li>The conversation: how you framed the counter, what you asked for.</li>
  <li>Outcome: what you got, what you walked away from.</li>
  <li>Reflection: what worked, what you'd do differently.</li>
</ol>

<pre><code>"When I joined [current company], the initial offer was $X total comp.
I'd done research on Levels.fyi and had a competing offer at $Y from
another company. I prepared a written counter that:
 - Acknowledged my excitement about the role.
 - Shared the competing offer with specifics.
 - Made a clear ask: a specific number across base, RSU, and sign-on.
 - Showed willingness to be flexible.

The recruiter went to comp / hiring manager and came back with about
80% of the way to my ask. We finalized at $X+15%, with RSU and
sign-on doing most of the work. Base moved minimally, which I expected.

The thing I'd do differently: I should have pushed harder on level. In
hindsight, the role I took on was closer to senior staff scope, but I
came in as senior. That cost me ~6 months of leveling delay."</code></pre>

<h3>"How do you think about compensation?"</h3>
<p>Sometimes asked in staff+ interviews to test maturity / framing.</p>
<pre><code>"I think of it as four-year TC including refreshers, not year-1.
Components: base for stability, RSU for upside, sign-on for transition
costs, bonus as variable. I weight RSU based on stock outlook and
liquidity. For pre-IPO, I discount equity heavily for liquidity risk.

For this role, I'd want to model it across 4 years and compare to
my alternatives — current company future trajectory, other offers.
The headline number is less important than the trajectory."</code></pre>

<h3>"What would make you accept this role?"</h3>
<p>Subtle comp question. Gives you a chance to share your priorities.</p>
<pre><code>"Three things in priority: the role / scope itself (this team and
charter look strong), the manager (got a great signal in our chat),
and comp at market for the level. If those three align, I'm in. We
can discuss specifics once I see the offer."</code></pre>

<h3>"Have you negotiated comp before?"</h3>
<p>Sometimes in manager interviews to check if you'll be a strong negotiator on behalf of your team.</p>
<pre><code>"Yes — I've negotiated three of my four moves. My approach: data first
(market rates, competing offers), specific ask (across components,
not just base), framed professionally (it's a business conversation,
not adversarial). I've usually moved offers 10-25% from initial. I
think this is also a manager skill — when I have direct reports, I
advocate the same way for their offers and refreshers."</code></pre>

<h3>"Do you have other offers?"</h3>
<p>Recruiter probe. Be honest about pipeline.</p>
<pre><code>"I'm in late-stage processes with [N companies], including one I
expect to extend an offer in [timeframe]. I want to make sure I'm
making this decision with full information."</code></pre>

<p>Don't oversell — recruiters can sometimes verify, and exaggerating reads as desperate. Specific without numbers.</p>

<h3>"What's your timeline?"</h3>
<pre><code>"I'd like to make a decision in the next [2-3 weeks]. I have other
processes finishing up; I want to do this fairly to all of them."</code></pre>

<p>Buys you time. Lets you align decision with other timelines.</p>

<h3>Self-prep checklist before any negotiation</h3>
<ul>
  <li>☐ Pulled Levels.fyi data for role + level + location.</li>
  <li>☐ Identified target number + walk-away number.</li>
  <li>☐ Listed competing offers / processes.</li>
  <li>☐ Calculated 4-year TC for current and prospective offers.</li>
  <li>☐ Identified non-comp factors (manager, team, growth, location) and weights.</li>
  <li>☐ Have responses ready for "current TC?" "expected number?" "best offer."</li>
  <li>☐ Have ask ready for written offer letter.</li>
  <li>☐ Identified 2-3 people I can run the offer past before responding (mentor, partner, peer).</li>
  <li>☐ Researched company-specific negotiation patterns (Glassdoor / Blind / Levels comments).</li>
  <li>☐ Prepared counter email template.</li>
</ul>

<h3>The 30-second mantra</h3>
<p><em>"Get the offer in writing. Never accept on the call. Anchor with data, not feelings. Negotiate the whole package. Be willing to walk."</em></p>
<p>Compensation is the highest-leverage 30 minutes of negotiation in your career. Treat it accordingly. Prepare. Take your time. The discomfort is temporary; the dollars compound for decades.</p>
`
    }
  ]
});
