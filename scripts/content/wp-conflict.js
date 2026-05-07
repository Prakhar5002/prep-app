window.PREP_SITE.registerTopic({
  id: 'wp-conflict',
  module: 'workplace',
  title: 'Conflict & Productive Disagreement',
  estimatedReadTime: '35 min',
  tags: ['conflict', 'disagreement', 'feedback', 'difficult-conversations', 'escalation', 'mediation', 'dac'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>Conflict at work is inevitable; <em>productive</em> conflict is not. Most engineers either suppress disagreement (avoid + smile) or detonate it (vent + escalate). Both fail. The goal is structured disagreement: name the issue cleanly, separate person from problem, work to a decision, commit to the outcome — even one you don't love.</p>
<ul>
  <li><strong>Disagreement is signal.</strong> Teams without disagreement are usually teams where people stopped speaking up. Silence is more dangerous than friction.</li>
  <li><strong>Separate person from problem.</strong> "I disagree with this design" ≠ "I disagree with you." Don't conflate.</li>
  <li><strong>Disagree-and-commit (DAC).</strong> Once a decision is made, even if you opposed it, you commit fully. Sandbagging or "I told you so" later is corrosive.</li>
  <li><strong>Most conflicts are about facts, framing, or values.</strong> Diagnose the type before responding. Different conflict types have different resolutions.</li>
  <li><strong>Escalation is a tool, not a weapon.</strong> Use it when peer-level resolution genuinely failed; don't use it as a power move.</li>
  <li><strong>Bad behavior (yelling, dismissiveness, exclusion) is a separate problem</strong> from disagreement. Address it directly or via manager — don't quietly tolerate.</li>
  <li><strong>Written disagreement aids resolution</strong> — forces precision and creates a record. Spoken disagreements drift, repeat, and create politics.</li>
  <li><strong>Mobile / RN angle:</strong> conflict often shows up between mobile and web/backend over priorities, constraints, "why is this slow." Educate + push back without burning relationships.</li>
</ul>
<p><strong>Mantra:</strong> "Diagnose the conflict type. Argue the problem, not the person. Push for decision in writing. Commit fully after the decision. Escalate only when peer-level genuinely failed."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>The conflicts engineers face</h3>
<table>
  <thead><tr><th>Conflict</th><th>Typical with</th><th>What it looks like</th></tr></thead>
  <tbody>
    <tr><td>Design / approach disagreement</td><td>Peer engineer</td><td>"Use approach A" vs. "Use approach B"</td></tr>
    <tr><td>Priority disagreement</td><td>PM, manager</td><td>"Ship feature X first" vs. "Pay down debt first"</td></tr>
    <tr><td>Quality / timeline disagreement</td><td>PM, manager</td><td>"Ship by Friday" vs. "Need 2 more weeks for testing"</td></tr>
    <tr><td>Scope disagreement</td><td>PM, designer</td><td>"This is in scope" vs. "Out of scope for v1"</td></tr>
    <tr><td>Code review disagreement</td><td>Reviewer or author</td><td>"Change this" vs. "It's fine"</td></tr>
    <tr><td>Cross-team dependency</td><td>Other team</td><td>"You build the API" vs. "Not our problem"</td></tr>
    <tr><td>Performance / perf review disagreement</td><td>Manager</td><td>"I'm at L5" vs. "You're a strong L4"</td></tr>
    <tr><td>Personality / style clash</td><td>Anyone</td><td>"X is rude / dismissive / hard to work with"</td></tr>
    <tr><td>Values / ethics disagreement</td><td>Org, leadership</td><td>"This product feature is harmful"</td></tr>
    <tr><td>Recognition / credit dispute</td><td>Peer, manager</td><td>"That was my work" / "You didn't credit me"</td></tr>
  </tbody>
</table>
<p>Each requires a different response shape. The first move is always: <em>diagnose what kind of conflict this is</em>.</p>

<h3>The three conflict types (Patrick Lencioni / common framings)</h3>
<table>
  <thead><tr><th>Type</th><th>Source</th><th>Example</th><th>Resolution</th></tr></thead>
  <tbody>
    <tr><td><strong>Fact-based</strong></td><td>Different information</td><td>"X is the right DB" vs. "Y has better latency for our use case"</td><td>Get more data; decide based on evidence</td></tr>
    <tr><td><strong>Framing-based</strong></td><td>Different mental models / priorities</td><td>"Optimize for ship speed" vs. "Optimize for maintainability"</td><td>Surface trade-offs; pick frame deliberately</td></tr>
    <tr><td><strong>Values-based</strong></td><td>Fundamental beliefs / interests</td><td>"This feature exploits users" vs. "It drives revenue"</td><td>Compromise hard; sometimes leadership decides; sometimes you walk</td></tr>
  </tbody>
</table>
<p>Most engineering conflicts are fact or framing. Most personal conflicts are values + style. Misdiagnosing fact-based as values-based (or vice versa) makes resolution impossible.</p>

<h3>Why suppression is bad</h3>
<p>Engineers often suppress disagreement: nod in meetings, complain in DMs, never raise concerns until project fails.</p>
<table>
  <thead><tr><th>Cost</th><th>Form</th></tr></thead>
  <tbody>
    <tr><td>Bad decisions ship</td><td>Wrong design / wrong priority because no one pushed back</td></tr>
    <tr><td>Resentment compounds</td><td>"They never listen" festers; eventually explodes</td></tr>
    <tr><td>Trust erodes</td><td>Teammates can't trust your "yes" — you might be silently disagreeing</td></tr>
    <tr><td>Information loss</td><td>Your dissenting view may be the right one; suppressed = lost</td></tr>
    <tr><td>Burnout</td><td>Disagreeing-but-complying is exhausting in volume</td></tr>
  </tbody>
</table>

<h3>Why detonation is also bad</h3>
<p>Other extreme: every disagreement becomes confrontation.</p>
<table>
  <thead><tr><th>Cost</th><th>Form</th></tr></thead>
  <tbody>
    <tr><td>Escalation fatigue</td><td>Manager / skip dragged into peer-level disputes constantly</td></tr>
    <tr><td>Reputation damage</td><td>Seen as combative, hard to work with</td></tr>
    <tr><td>Polarized teams</td><td>Sides form; productive collaboration breaks</td></tr>
    <tr><td>Wins-but-loses</td><td>Win the argument, lose the relationship; future asks harder</td></tr>
  </tbody>
</table>

<h3>Productive disagreement: the middle path</h3>
<p>The skill is: disagree clearly + early + in writing + with respect, then commit fully when decision goes against you. Explicitly:</p>
<ul>
  <li><strong>Clearly:</strong> not vague hedging; not bottling. Direct articulation of the disagreement.</li>
  <li><strong>Early:</strong> raise it when it can still affect the decision. Late dissent is sandbag.</li>
  <li><strong>In writing:</strong> precise, recorded, less subject to drift / misremembering.</li>
  <li><strong>With respect:</strong> argue the problem, not the person.</li>
  <li><strong>Committed after:</strong> when decision is made, you're part of executing it. No "I told you so."</li>
</ul>
<p>Amazon called this "Disagree and Commit"; many companies have copied. The principle is sound regardless of the brand.</p>

<h3>Why this matters at senior level</h3>
<p>Junior engineers are often graded on accommodation. Senior engineers are graded on judgment — including the judgment to disagree well. A senior who never disagrees is a senior who never adds dissent value to decisions, and is easy to mistake for a strong individual contributor with no leadership signal.</p>
<p>Promo packets at senior+ explicitly look for:</p>
<ul>
  <li>"Took unpopular technical positions and was right."</li>
  <li>"Disagreed productively with [PM/leadership/peer] and improved the outcome."</li>
  <li>"Held the line on [quality/scope/timeline] under pressure."</li>
</ul>
<p>None of these come from someone who suppresses or detonates.</p>

<h3>The mobile / RN angle</h3>
<p>Specific conflicts mobile engineers face:</p>
<ul>
  <li><strong>"Just ship it" vs. testing time.</strong> Mobile bugs in production are expensive (app review for hotfix). Push for testing, lose sometimes.</li>
  <li><strong>Web team velocity comparison.</strong> "Why is mobile so slow?" — educate without defensiveness.</li>
  <li><strong>RN vs. native debates.</strong> Constant. Stay technical, not tribal.</li>
  <li><strong>Cross-platform parity disputes.</strong> "iOS got the feature first; Android team is slow." Surface the actual constraints.</li>
  <li><strong>Backend disputes:</strong> "API isn't ready"; "Mobile takes too long to consume new APIs." Push for contracts upfront.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The "above-the-line / below-the-line" model</h3>
<p>Every interaction in conflict happens at one of two levels:</p>
<table>
  <thead><tr><th>Above-the-line</th><th>Below-the-line</th></tr></thead>
  <tbody>
    <tr><td>Curious; assumes good intent</td><td>Defensive; assumes bad intent</td></tr>
    <tr><td>Open to being wrong</td><td>Need to be right</td></tr>
    <tr><td>Focuses on problem</td><td>Focuses on person</td></tr>
    <tr><td>Asks questions to understand</td><td>Asks questions to win</td></tr>
    <tr><td>"What am I missing?"</td><td>"Why are they so dumb?"</td></tr>
    <tr><td>Acknowledges valid points</td><td>Doubles down</td></tr>
    <tr><td>Aims for outcome</td><td>Aims for points</td></tr>
  </tbody>
</table>
<p>You can feel where you are. Tight chest, defensive thoughts → below the line. Curious, open → above the line. The skill is noticing where you are and pulling yourself up when you've slipped down. Above-the-line conflict is productive; below-the-line conflict is corrosive.</p>

<h3>The "interests vs. positions" framework (from Getting to Yes)</h3>
<p>People stake out positions in conflict; the underlying interests often align even when positions don't.</p>
<table>
  <thead><tr><th>Position</th><th>Possible underlying interests</th></tr></thead>
  <tbody>
    <tr><td>"We must ship Friday."</td><td>Demo to investor; bonus tied to Q-end; promised customer; PM looks bad if slip</td></tr>
    <tr><td>"We need more testing time."</td><td>Avoid embarrassing bug; protect customer trust; perf review consequences if outage</td></tr>
    <tr><td>"Use database X."</td><td>Familiar with X; team owns X; X integrates with stack</td></tr>
    <tr><td>"Use database Y."</td><td>Y handles our scale; Y has features X lacks; Y is org-blessed</td></tr>
  </tbody>
</table>
<p>Disagreement at the position level is intractable ("Friday vs. not Friday"). At the interest level, often resolvable ("we both want a successful launch — can we ship Friday with reduced scope to lower risk?"). The first question of any conflict: <em>what do they actually need, beneath what they're saying?</em></p>

<h3>The "BATNA" model</h3>
<p>BATNA = Best Alternative To a Negotiated Agreement. In any conflict, both parties have a fallback if negotiation fails.</p>
<ul>
  <li><strong>Your BATNA:</strong> what you do if no agreement reached. (Escalate? Walk? Accept their position?)</li>
  <li><strong>Their BATNA:</strong> same question for them.</li>
</ul>
<p>The party with the better BATNA has more leverage. This is why "willingness to walk" is power even when you don't want to walk.</p>
<p>Application: before going into a hard conversation, identify your BATNA. If theirs is much stronger than yours, you're in a weak position — adjust expectations.</p>

<h3>The disagreement maturity ladder</h3>
<p>A loose model of where engineers are in their conflict skills:</p>
<table>
  <thead><tr><th>Level</th><th>Pattern</th></tr></thead>
  <tbody>
    <tr><td>1. Avoid</td><td>Stay silent; agree publicly; complain privately</td></tr>
    <tr><td>2. Vent</td><td>Express disagreement loudly; not constructive; relationship damage</td></tr>
    <tr><td>3. Argue</td><td>Direct disagreement, but more about winning than resolving</td></tr>
    <tr><td>4. Persuade</td><td>Make the case for your view; use data; can change others' minds</td></tr>
    <tr><td>5. Synthesize</td><td>Hold multiple views; surface trade-offs; help group find better solution</td></tr>
    <tr><td>6. Disagree-and-commit</td><td>Argue hard; once decision made, fully commit even if you lost</td></tr>
  </tbody>
</table>
<p>Most engineers are level 2-3. Senior engineers should be at level 4-5. Staff+ should be at level 6 fluently.</p>

<h3>The conflict-resolution funnel</h3>
<p>Most conflicts shouldn't escalate — they should resolve at the lowest possible level.</p>
<pre><code>1. Self-talk
    "Is this worth raising? Am I right?"
    50% of disagreements end here.

2. Direct conversation with peer
    "Can we talk about X?"
    30% of remaining end here.

3. Written disagreement (RFC, design doc comment, etc.)
    Forces precision; creates record.
    15% of remaining end here.

4. Bring in tech lead / facilitator
    Trusted third party helps
    structure decision.
    4% of remaining end here.

5. Manager / escalation
    When peer-level genuinely failed.
    1% of remaining end here.

6. Skip-level / org-level
    Reserved for major / cultural issues.
    Rare; uses major political capital.</code></pre>
<p>Skipping levels (going manager-first when you haven't talked to peer) damages relationships and reputation. Climbing the funnel slowly is the right move.</p>

<h3>The "30-day rule" for escalation</h3>
<p>Before escalating any conflict, ask: "If I let this go for 30 days, what happens?"</p>
<ul>
  <li><strong>Nothing meaningful:</strong> probably not worth escalating. Maybe not worth the conflict at all.</li>
  <li><strong>Customer harm / safety / serious project risk:</strong> escalate now.</li>
  <li><strong>Ongoing pattern of disrespect / bad behavior:</strong> escalate, but as part of broader feedback to manager.</li>
  <li><strong>I'm just frustrated:</strong> wait 24-48 hours, re-read, often resolves on its own.</li>
</ul>

<h3>The DAC (disagree-and-commit) framework</h3>
<p>The full sequence:</p>
<ol>
  <li><strong>Disagree explicitly.</strong> "I disagree with this approach. Here's why: [reason]. I think [alternative] would be better because [evidence]."</li>
  <li><strong>Argue cleanly.</strong> Make your case. Push hard. Bring data.</li>
  <li><strong>Listen actively.</strong> Receive others' arguments. Update if convinced.</li>
  <li><strong>Decision time.</strong> Either you persuade or you don't. Decision is made.</li>
  <li><strong>Commit publicly.</strong> If you lost, you commit. "I disagreed but team decided X. I'm in. Let's execute."</li>
  <li><strong>Don't sandbag.</strong> No malicious compliance. No "told you so" if it fails. You're owning the decision now.</li>
</ol>
<p>The hardest step is 5. Especially when you were right. The discipline is: opinions matter while the decision is open; execution matters once it's made. You don't get to keep relitigating after the door closes.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>The disagreement script</h3>
<p>For most engineering disagreements, this template works:</p>
<pre><code>1. Acknowledge their position.
   "I hear you're proposing X because Y."

2. State your disagreement clearly.
   "I disagree with X. Here's where I see it differently:
    [specific points]."

3. Propose alternative + reasoning.
   "I'd propose Z because [evidence, scenarios, costs]."

4. Acknowledge what you might be missing.
   "I might be missing — what do you see in X that I don't?"

5. Move to decision path.
   "Want to debate this in [forum]? Or pull in [tiebreaker]?"</code></pre>
<p>Why each step matters:</p>
<ul>
  <li>Acknowledging shows you've heard them — not just waiting your turn.</li>
  <li>Clear disagreement avoids hedging; everyone knows where you stand.</li>
  <li>Alternative gives them something to push back on — not just a no.</li>
  <li>Asking what you're missing is the above-the-line move; signals you might be wrong.</li>
  <li>Decision path keeps it from being endless.</li>
</ul>

<h3>The written disagreement</h3>
<p>For high-stakes disagreements, write it down. Forces precision. Creates record. Reduces drift.</p>
<pre><code>Subject: Pushing back on [decision]

I want to formally raise concern with [decision/proposal].

## My understanding of the proposal
[Restate to confirm we're discussing the same thing]

## My concern
[Specific concern, not "I don't like it"]

## Evidence / reasoning
[Data, prior incidents, comparable cases]

## What I'd propose instead
[Specific alternative]

## What I might be missing
[Steel-man their view — what makes their proposal good?]

## Decision request
[How should we resolve this? Tech lead vote? Manager call?
Pre-mortem to test both options?]</code></pre>
<p>Why this works:</p>
<ul>
  <li>Author has to think hard before writing — often resolves the disagreement before sending.</li>
  <li>Reader can engage with specifics, not vibes.</li>
  <li>Decision-maker has all sides clearly laid out.</li>
  <li>Decision and reasoning are durable; future-you can refer back.</li>
</ul>

<h3>The "argue then ask, ask then argue" pattern</h3>
<p>Most disagreements get stuck because both sides argue without asking. Better:</p>
<ul>
  <li><strong>Ask first:</strong> "Can you walk me through why you're proposing X? What's the strongest case for it?" Listen actually.</li>
  <li><strong>Argue second:</strong> "Now that I understand your view: here's where I see it differently."</li>
  <li><strong>Ask again:</strong> "What do you think of my counter? Where do you see weakness in my argument?"</li>
  <li><strong>Synthesize:</strong> "Here's where I think we still disagree; here's where I think we now agree."</li>
</ul>
<p>This rhythm prevents the "talking past each other" pattern that wastes hours.</p>

<h3>Resolving fact-based disagreements</h3>
<p>If the disagreement is about facts, get data:</p>
<ul>
  <li><strong>Build a prototype.</strong> A 2-day spike often resolves a week of design debate.</li>
  <li><strong>Run a benchmark.</strong> "I think X is faster" → measure.</li>
  <li><strong>Look at production data.</strong> "Users will hate this" → check actual user behavior on similar surfaces.</li>
  <li><strong>Read the docs / source.</strong> Half of "X library can't do Y" is wrong; check first.</li>
</ul>
<p>Engineers should default to evidence over assertion. "I think" → "let me find out" is the productive shift.</p>

<h3>Resolving framing-based disagreements</h3>
<p>If you and the other party have different priorities, neither is "wrong" — they're optimizing different functions. Path:</p>
<ul>
  <li><strong>Surface the frames.</strong> "I think you're optimizing for shipping speed; I'm optimizing for maintainability. Both are valid."</li>
  <li><strong>Identify the higher principle.</strong> Often there's a shared higher goal (customer outcome, team velocity over time) that resolves the framing dispute.</li>
  <li><strong>Pick a frame deliberately.</strong> Have leadership / DRI pick the frame for this decision.</li>
  <li><strong>Document the frame.</strong> So future similar decisions can default to the same.</li>
</ul>

<h3>Resolving values-based disagreements</h3>
<p>Hardest. Values aren't negotiable the way facts are. Options:</p>
<ul>
  <li><strong>Find the workable middle.</strong> Compromise on implementation that respects both values somewhat.</li>
  <li><strong>Defer to the DRI / leadership.</strong> Their values inform the call.</li>
  <li><strong>Disagree-and-commit (if you can).</strong> If the values disagreement isn't fundamental, commit and move on.</li>
  <li><strong>Walk.</strong> If the disagreement is fundamental (ethical line crossed), the answer may be to leave the team / company. Rare but real.</li>
</ul>

<h3>The "dispassionate restate" technique</h3>
<p>When a discussion gets heated, calmly restate both positions:</p>
<pre><code>"Let me restate to make sure I understand:

  Your view: X, because Y, optimizing for Z.
  My view: A, because B, optimizing for C.

The disagreement seems to be about [the framing / fact / value].

To resolve, we'd need [data / decision / alignment on priority]."</code></pre>
<p>This often deflates the heat. Both parties feel heard. The actual disagreement gets clearer. Sometimes one party realizes they don't actually disagree as much as they thought.</p>

<h3>Holding the line vs. yielding</h3>
<p>Knowing when to hold and when to yield:</p>
<table>
  <thead><tr><th>Hold the line</th><th>Yield gracefully</th></tr></thead>
  <tbody>
    <tr><td>Customer harm risk</td><td>Stylistic preferences</td></tr>
    <tr><td>Security / privacy violation</td><td>Approach you'd do differently but theirs works</td></tr>
    <tr><td>Major architectural debt</td><td>Naming, formatting, minor abstractions</td></tr>
    <tr><td>Promised quality bar broken</td><td>Disagreements you've already raised</td></tr>
    <tr><td>Reproducible bugs in production-bound code</td><td>Calls that aren't yours to make (PM domain)</td></tr>
  </tbody>
</table>
<p>The discipline: hold on the things that matter; yield freely on the things that don't. Engineers who hold on everything become "blockers." Engineers who yield on everything become invisible.</p>

<h3>How to escalate</h3>
<p>When peer-level resolution fails, escalation is appropriate. Mechanics:</p>
<ol>
  <li><strong>Try peer first.</strong> Document attempts.</li>
  <li><strong>Surface to your manager.</strong> Frame as "want your input on a decision I'm stuck on with [peer]." Don't position as "X is being unreasonable."</li>
  <li><strong>Manager may want to talk to peer's manager.</strong> Let them; don't go around them.</li>
  <li><strong>Be open to losing.</strong> Escalation isn't designed to give you the win — it's designed to get a decision.</li>
  <li><strong>Once decided, commit.</strong> The decision is now real even if you lost.</li>
</ol>
<p>Escalation is a tool with a cost. Each use depletes your manager's political capital + your reputation as a peer-level resolver. Use sparingly.</p>

<h3>Receiving disagreement</h3>
<p>Other side of the coin: how to handle when someone disagrees with <em>you</em>.</p>
<ul>
  <li><strong>Don't get defensive.</strong> Hard. Practice. Notice the impulse and pause.</li>
  <li><strong>Ask for specifics.</strong> "Help me understand where you'd do this differently."</li>
  <li><strong>Steel-man their argument.</strong> Restate it back stronger than they made it.</li>
  <li><strong>Acknowledge valid points.</strong> "You're right that X is a real concern."</li>
  <li><strong>Push back where you still disagree.</strong> "I still think Y because Z."</li>
  <li><strong>Update if convinced.</strong> Changing your mind is a strength, not weakness. Say so explicitly: "Okay, you've convinced me on A. Let me reconsider."</li>
</ul>

<h3>Bad behavior: a separate problem</h3>
<p>Sometimes "conflict" isn't disagreement — it's bad behavior. Yelling, public shaming, dismissiveness, exclusion, harassment. This isn't productive disagreement and shouldn't be handled like one:</p>
<ul>
  <li><strong>Address directly when safe.</strong> "When you [behavior], it [impact]. I need that to stop."</li>
  <li><strong>Document.</strong> Date, time, behavior, witnesses.</li>
  <li><strong>Loop manager.</strong> They have HR / process tools you don't.</li>
  <li><strong>Don't suffer in silence.</strong> Bad behavior tolerated continues. Don't try to "rise above."</li>
  <li><strong>For severe issues:</strong> HR, ombudsperson, legal. Skip manager if manager is the problem.</li>
</ul>
<p>The distinction matters: productive disagreement should be common and healthy; bad behavior should be rare and addressed firmly.</p>

<h3>Code review conflict</h3>
<p>Specific patterns:</p>
<ul>
  <li><strong>Reviewer pushes back on approach.</strong> Engage substantively. If you still disagree, say so explicitly. If you yield, do it cleanly.</li>
  <li><strong>Reviewer is nitpicking.</strong> Address what's substantive; push back on what's not. "This is style preference; I'd like to leave as-is."</li>
  <li><strong>Author keeps re-pushing same approach after blocking comment.</strong> Stop reviewing. Pull in third party. "We're at impasse; need [tech lead] to break tie."</li>
  <li><strong>Disagreement on test coverage.</strong> Concrete: "What's the failure mode you're worried about? Let me write a test for that specifically."</li>
</ul>

<h3>Mobile-specific conflict patterns</h3>
<table>
  <thead><tr><th>Conflict</th><th>Productive response</th></tr></thead>
  <tbody>
    <tr><td>"Mobile is so slow at shipping"</td><td>Educate on app review + version coverage. Concrete data: "Last release: 4 days review + 2 weeks for 80% adoption."</td></tr>
    <tr><td>"Why don't you just use [web framework approach]?"</td><td>Explain mobile constraint: native runtime, OS APIs, app sandbox. Don't dismiss.</td></tr>
    <tr><td>"iOS got the feature; Android team is dragging"</td><td>Diagnose actual cause: team load, code base differences, OS-specific issues. Don't blame Android team.</td></tr>
    <tr><td>RN vs. native debates</td><td>Stay technical. Concrete trade-offs for this codebase. Don't make it tribal.</td></tr>
    <tr><td>Backend "API isn't ready"</td><td>Pre-empt with API contract upfront; co-author OpenAPI spec.</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'examples',
      title: '🔍 Worked Examples',
      html: `
<h3>Example 1: Design disagreement with peer engineer</h3>
<p><strong>Setup:</strong> Peer proposes using a new state management library. You think the existing pattern is fine and the new lib is overkill.</p>

<p><strong>Bad — avoid:</strong> "Sure, whatever you want." Then build resentment as the new lib spreads.</p>

<p><strong>Bad — detonate:</strong> "This is dumb, we don't need a new library." Peer becomes defensive; turns political.</p>

<p><strong>Good — productive disagreement:</strong></p>
<pre><code>1:1 conversation:

"Want to push back on the new state lib proposal. Want to argue the
case before we commit.

My concern: it's a 3-month migration, learning curve for the team,
adds dependency. Existing pattern is working fine for our complexity.

What I think you might be solving for: easier mental model for new
hires? Performance? Something else I'm missing?

Could we do a 2-day spike to compare on a real screen? Then make
the call with data. If the spike shows clear wins, I'm in. If
not, let's stick with existing."</code></pre>

<p><strong>Outcome:</strong> Spike shows mild wins but not enough to justify migration. Decision: stick with existing for now; revisit if specific pain emerges. Peer feels heard; you feel heard; relationship intact; team avoided unnecessary work.</p>

<h3>Example 2: Priority disagreement with PM</h3>
<p><strong>Setup:</strong> PM wants you to ship a marketing-led feature next sprint. You think the team should pay down infrastructure debt that's been festering.</p>

<p><strong>Bad:</strong> Work the marketing feature reluctantly; complain to peers; debt grows.</p>

<p><strong>Good — written disagreement:</strong></p>
<pre><code>Email to PM:

Want to push back before we lock the next sprint plan.

Your proposal: ship marketing feature X.
My counter: prioritize infra debt Y.

Why I think Y > X this sprint:
1. Y has been blocking 30% of dev work for 6 weeks (3 separate
   incidents this quarter).
2. Y will compound — every month we don't fix, costs more.
3. X has clear business value but no hard date — could ship +1
   sprint with limited cost.

What I might be missing:
- Marketing campaign timing constraints I don't know about.
- Customer commitments tied to X.
- Strategic visibility for our team / roadmap.

Suggestion: 30-min meeting with you + EM to align on which is
higher priority this sprint. Happy to go either way after
discussion.</code></pre>

<p><strong>Outcome:</strong> Meeting happens. PM had marketing-side commitments you didn't know about. EM weighs in. Decision: ship X this sprint, prioritize Y next sprint. You commit; you don't relitigate.</p>

<h3>Example 3: Quality vs. timeline disagreement</h3>
<p><strong>Setup:</strong> Manager wants you to ship Friday. You think the code needs another week of testing.</p>

<p><strong>Productive response:</strong></p>
<pre><code>1:1 with manager:

"Want to flag concern about Friday ship.

Specifically: we have 4 untested edge cases in the offline sync
flow. In testing, 2 of 4 produced data corruption in unusual
scenarios.

If we ship Friday with these unaddressed, my estimate:
- 30% chance of customer-reported issue in week 1.
- If that happens, we'd need a hotfix release (3-7 days
  through app review) + customer support load.

If we slip 1 week to test:
- ~95% confident we ship clean.
- Cost: 1 week delay on dependent features.

I'd recommend slipping. But this is your call — you have context
on customer commitments + team load that I don't. Want to make
sure you have the eng-side picture before deciding."</code></pre>

<p><strong>Outcome:</strong> Manager either decides to slip (good) or to ship anyway with eyes open (also valid — you flagged risk; they own decision). Either way you're committed to executing the decision.</p>

<h3>Example 4: Disagreement gets escalated</h3>
<p><strong>Setup:</strong> Cross-team disagreement: your team owns mobile API consumer; their team owns the backend. They want to make a breaking API change for "consistency"; you say it'll break 30% of users still on app v3.</p>

<p><strong>Step 1 — direct conversation:</strong> Backend lead's view: "Your old app should be sunsetted." Your view: "App v3 still has 30% adoption per our metrics; sunsetting affects real users."</p>

<p><strong>Step 2 — written disagreement:</strong> You write a doc summarizing both positions. Their lead reads, holds firm.</p>

<p><strong>Step 3 — escalation:</strong></p>
<pre><code>Email to your manager (cc'd to peer team's manager):

Want to surface a cross-team disagreement we couldn't resolve at
peer level.

Decision needed: should backend make breaking change to API X?

Backend team's case (paraphrased): consistency, blocks future work,
30% on old app is "acceptable churn."

Mobile team's case: 30% of users on app v3; breaking change
affects them in ways they can't control (some can't update due
to OS / device). Customer support burden + bad UX.

Both sides have legitimate concerns. Need a leadership call on
priority: API consistency vs. user experience for slow-updating
cohort.

Options:
A. Make breaking change as proposed; accept user impact.
B. Versioned API: support both for 6 months until v3 adoption is
   <5%; then sunset.
C. Reshape the API change to be backwards-compatible.

Recommend B. But this is above peer level; need your call.</code></pre>

<p><strong>Outcome:</strong> Manager + peer manager align; pick B. You commit; backend team commits. Decision documented; everyone moves on.</p>

<p><strong>Note:</strong> The escalation worked because peer-level was tried first; both sides framed cleanly; written record; concrete options. Escalation that skips steps usually fails.</p>

<h3>Example 5: DAC after losing</h3>
<p><strong>Setup:</strong> You argued hard for approach A. Decision goes to approach B. You think B is wrong.</p>

<p><strong>Bad behaviors:</strong></p>
<ul>
  <li>Slow-walk implementation of B.</li>
  <li>Make snide comments in retros.</li>
  <li>Privately tell peers "I told them this would happen."</li>
  <li>"Forget" to test edge cases that would expose B's weakness.</li>
  <li>Wait for B to fail and say "I was right."</li>
</ul>

<p><strong>Good behaviors:</strong></p>
<ul>
  <li>Public commitment: "Decision is B; I'm executing."</li>
  <li>Bring same energy to B as you would have to A.</li>
  <li>If B starts to fail, surface early — not as "I was right" but as "we're seeing problems with B; here's a fix path."</li>
  <li>Document your dissent in writing; don't dwell on it verbally.</li>
  <li>Update your model: maybe B was right and you missed something.</li>
</ul>

<p><strong>Why it matters:</strong> Sandbagging gets noticed. Your "I told you so" lands as immature. The team that decides differently from you needs to trust you'll execute anyway. That trust is what gets you weight in future decisions.</p>

<h3>Example 6: Receiving harsh feedback</h3>
<p><strong>Setup:</strong> Senior peer gives you blunt feedback in a meeting: "Your design doc is unclear; I don't know what you're proposing."</p>

<p><strong>Bad reactions:</strong></p>
<ul>
  <li>Defensive: "It's clear; you didn't read carefully."</li>
  <li>Crumple: "Sorry, I'm not good at design docs."</li>
  <li>Counter-attack: "Well your last doc had problems too."</li>
</ul>

<p><strong>Good reaction:</strong></p>
<pre><code>"Thanks — that's useful. Can you tell me what specifically was
unclear? I want to understand which parts didn't land so I can fix
them.

[Listen.]

Got it. Will revise — let me share v2 by [date] and you can tell
me if it's better."</code></pre>

<p><strong>Why it works:</strong> Treats feedback as data. Asks for specifics. Doesn't take it personally. Leaves with a clear next step. The peer feels heard and respected — and is more likely to give honest feedback in the future.</p>

<h3>Example 7: Personality clash</h3>
<p><strong>Setup:</strong> A peer engineer is consistently dismissive in meetings — talks over you, "actually..."s your statements, takes credit for ideas. Not technically a fireable offense; deeply annoying.</p>

<p><strong>Bad:</strong> Stew silently; vent to other peers; eventually request team change.</p>

<p><strong>Good — direct first:</strong></p>
<pre><code>1:1 with the peer:

"Wanted to flag something — when I'm presenting an idea in
meetings and you jump in with 'actually...' or finish my sentence,
it makes it hard for me to get the idea fully out.

I'm sure it's not intentional, but it's a pattern — happened in
3 meetings this week. Could you give me space to finish before
jumping in? Happy to do the same for you."</code></pre>

<p><strong>If that doesn't change behavior:</strong></p>
<pre><code>1:1 with manager:

"Want to share a pattern with [peer] that I've been working on.
Tried direct conversation [date]; some improvement but pattern
recurring.

Specifically: dismissive interruption in cross-functional
meetings. Recent examples: [X, Y, Z].

Not asking you to do anything specific yet — wanted to share
what I'm working through. If it continues, I'd like to think
through next steps with you."</code></pre>

<p><strong>Why staged:</strong> Direct conversation respects the peer + might fix it. Manager loop creates record + gives them tools you don't have. Skipping to manager-first damages relationships unnecessarily.</p>

<h3>Example 8: Values disagreement (rare but real)</h3>
<p><strong>Setup:</strong> Your team is asked to build a feature that you believe meaningfully harms users (dark pattern, deceptive UI, privacy violation, etc.).</p>

<p><strong>Path:</strong></p>
<ol>
  <li><strong>Surface clearly in writing.</strong> Not "I don't like this"; "Here's the harm: [specific]. Here's why I think it crosses a line: [reasoning]."</li>
  <li><strong>Engage with leadership.</strong> Sometimes leadership genuinely doesn't see the harm; surface it can change minds.</li>
  <li><strong>Propose alternatives.</strong> "Here's a way to achieve the business goal without the harm."</li>
  <li><strong>If still proceeding:</strong> decide if you can disagree-and-commit. Some things are commit-able even when you disagree; some aren't.</li>
  <li><strong>If not commit-able:</strong> negotiate not working on this specific piece (move to a different project on team). Or escalate to skip / ethics committee.</li>
  <li><strong>Worst case:</strong> consider whether the team / org is the right fit. Voting with your feet is real and sometimes correct.</li>
</ol>

<p><strong>Note:</strong> This is rare. Most "ethical" disagreements at work are actually framing or values disagreements that can be resolved via discussion. Reserve "I quit over this" for genuinely values-violating territory.</p>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>The asymmetric power dynamic</h3>
<p>Disagreeing with someone several levels above you (skip, VP, CEO). Power asymmetry is real:</p>
<ul>
  <li><strong>Don't be casual.</strong> Disagreement here lands harder than peer-level.</li>
  <li><strong>Use written form.</strong> Lower emotional temperature; senior leader can read on their schedule.</li>
  <li><strong>Loop your manager.</strong> They may want to convey on your behalf.</li>
  <li><strong>Bring data, not vibes.</strong> Senior leaders are pattern-matchers; argue with evidence.</li>
  <li><strong>Be brief.</strong> 1-page max for written disagreement up.</li>
  <li><strong>Be careful what you escalate.</strong> Not every disagreement justifies disagreeing up to a VP.</li>
</ul>

<h3>The peer who never disagrees</h3>
<p>Some peers are conflict-avoidant; agree to everything publicly, then drift in execution. They're the "silent disagree, no commit" failure mode.</p>
<ul>
  <li><strong>Probe in 1:1s.</strong> "I noticed in the meeting you went along with X — did you have concerns?"</li>
  <li><strong>Welcome dissent explicitly.</strong> "I'm pretty sure my plan has flaws — what would you push back on?"</li>
  <li><strong>Make safety.</strong> Reward dissent publicly so they see it's safe.</li>
  <li><strong>Go in writing.</strong> Some people are more willing to dissent in async writing than in real-time meetings.</li>
</ul>

<h3>The peer who detonates everything</h3>
<p>Opposite problem: every meeting becomes confrontational; tactical disagreement on every detail; team can't make progress.</p>
<ul>
  <li><strong>Pre-align before meetings.</strong> Get their concerns out 1:1 before group setting.</li>
  <li><strong>Use written form.</strong> Slows them down; forces precision.</li>
  <li><strong>Set norms on disagree-and-commit.</strong> "We've got this decision; we may not all love it; we're committing."</li>
  <li><strong>Loop manager if pattern persists.</strong> Detonator behavior is a team performance issue.</li>
</ul>

<h3>Public disagreements</h3>
<p>Disagreeing with someone in front of others (meeting, demo, all-hands).</p>
<ul>
  <li><strong>Default: don't.</strong> Most disagreements are better in 1:1 / DM. Public disagreement embarrasses both sides.</li>
  <li><strong>Exceptions:</strong> public dissent is the norm in some forums (eng review, design review). Adjust to forum norms.</li>
  <li><strong>If you must disagree publicly:</strong> mild, technical, focused on the specific decision, not the person. "I'd push back on point X — here's an alternative."</li>
  <li><strong>Never make it personal in public.</strong> "Your design has issues" → fine in public; "You're wrong about this" → save for 1:1.</li>
</ul>

<h3>The conflict that's actually personal</h3>
<p>Sometimes a "design disagreement" is really an interpersonal grudge dressed up as technical dispute. Symptoms:</p>
<ul>
  <li>Disagreement on every PR, regardless of content.</li>
  <li>Disagreement that doesn't yield to data.</li>
  <li>Disagreement only between specific people, not in general.</li>
</ul>
<p>Path: address the personal layer separately. "We seem to disagree on a lot of decisions. Want to chat about how we work together?"</p>

<h3>The political disagreement</h3>
<p>Some disagreements aren't about the work — they're about org politics (territory, headcount, who gets credit). Defenses:</p>
<ul>
  <li><strong>Recognize when politics is at play.</strong> Symptom: disagreement intensity exceeds what the technical merits warrant.</li>
  <li><strong>Don't engage at the political level if you can avoid it.</strong> Stay technical; let the politicians fight politics.</li>
  <li><strong>Loop your manager.</strong> Cross-team political disputes are partially their job.</li>
  <li><strong>Document everything.</strong> Politics has a way of rewriting history.</li>
</ul>

<h3>Disagreement during high-stress moments</h3>
<p>Production incident; deadline crunch; layoff anxiety. Bad time for productive disagreement.</p>
<ul>
  <li><strong>Defer non-urgent disagreements.</strong> "Want to revisit this once we're past the incident."</li>
  <li><strong>Be more generous with interpretation.</strong> Stress makes everyone a worse version of themselves.</li>
  <li><strong>Don't make permanent decisions in temporary states.</strong> Big decisions made in the middle of an outage often get re-litigated later.</li>
</ul>

<h3>Disagreement with a friend</h3>
<p>Closer relationships make disagreement higher-stakes. Patterns:</p>
<ul>
  <li><strong>Acknowledge the relationship.</strong> "I want to disagree with you on this design but want to be clear it's not personal."</li>
  <li><strong>Same standard as anyone.</strong> Don't soften so much that the disagreement doesn't land.</li>
  <li><strong>Re-affirm afterward.</strong> "Glad we worked through that. Good talk."</li>
  <li><strong>Don't avoid disagreement to protect the friendship.</strong> Suppression poisons over time.</li>
</ul>

<h3>Cross-cultural disagreement norms</h3>
<p>Direct disagreement is more common in some cultures than others. US tech tends to be relatively direct. Japan, Korea, India often more indirect. EU varies.</p>
<ul>
  <li><strong>If you're a direct culture in an indirect culture:</strong> moderate. Use written; soften framing; let manager carry hard nos.</li>
  <li><strong>If you're indirect-default in direct culture:</strong> push yourself to disagree more clearly; the culture rewards it.</li>
  <li><strong>Calibrate per-person, not per-stereotype.</strong> Individual variation matters more than average culture.</li>
</ul>

<h3>The disagreement you should have had</h3>
<p>Sometimes you realize months later you should have pushed back on something. Recovery:</p>
<ul>
  <li><strong>Surface now if still relevant.</strong> "I should have pushed back on X earlier; want to revisit."</li>
  <li><strong>Don't dwell.</strong> One acknowledgment, then move on.</li>
  <li><strong>Calibrate going forward.</strong> Notice the pattern in your dissent style; adjust.</li>
</ul>

<h3>The disagreement that got personal</h3>
<p>A productive disagreement deteriorated into personal attack on either side. Recovery:</p>
<ul>
  <li><strong>Apologize cleanly</strong> for your part. "I went too far on Y; that wasn't constructive."</li>
  <li><strong>Don't demand reciprocal apology.</strong> Sometimes you get one; sometimes you don't.</li>
  <li><strong>Reset the working relationship.</strong> Schedule a non-charged 1:1 to reaffirm.</li>
  <li><strong>If pattern continues:</strong> escalate or limit interaction.</li>
</ul>

<h3>The "agree to disagree" trap</h3>
<p>Some teams use "agree to disagree" as a euphemism for "we never made a decision and now we have parallel implementations / inconsistent behavior."</p>
<ul>
  <li><strong>Don't accept "agree to disagree" on operational decisions.</strong> Force a call.</li>
  <li><strong>Save it for things that genuinely don't need consensus</strong> (style, taste, low-stakes opinions).</li>
  <li><strong>If you must agree-to-disagree, document.</strong> "We disagree on X; team picked Y; both views recorded."</li>
</ul>

<h3>Disagreeing in writing where the record persists</h3>
<p>Slack / email / docs are forever. Disagreements written there can be re-read by future hires, lawyers, leadership.</p>
<ul>
  <li><strong>Be professional, even in heat.</strong> Imagine your message in a deposition.</li>
  <li><strong>Don't make it personal in writing.</strong> Especially.</li>
  <li><strong>Use editing.</strong> Drafts > impulse posts.</li>
  <li><strong>Re-read before sending.</strong> Cool off if needed.</li>
</ul>
`
    },
    {
      id: 'bugs',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Anti-pattern: passive aggression</h3>
<p><strong>Looks like:</strong> Agree publicly, drag feet privately. Sigh in meetings. Slow PR reviews on people you disagree with.</p>
<p><strong>Why bad:</strong> Trust erodes. Coworkers see it. Pattern reads as immature.</p>
<p><strong>Fix:</strong> Direct, in-the-moment disagreement. If you can't be direct, that's a development area to work on.</p>

<h3>Anti-pattern: meeting silent, DM loud</h3>
<p><strong>Looks like:</strong> Don't disagree in the meeting; vent in DMs to peers afterward.</p>
<p><strong>Why bad:</strong> Decision was made without your input. Resentment compounds. Peers learn you're not honest in public.</p>
<p><strong>Fix:</strong> If you have a concern, raise it in the meeting (or in a follow-up). Disagreement post-meeting in private is too late.</p>

<h3>Anti-pattern: weaponizing escalation</h3>
<p><strong>Looks like:</strong> Lose a peer-level argument; immediately go to manager or skip without warning the peer.</p>
<p><strong>Why bad:</strong> Damages peer trust. Reads as immature / political. Manager less likely to side with you over time.</p>
<p><strong>Fix:</strong> If you're escalating, tell the peer first. "I'm going to surface this to my manager because we couldn't resolve at our level — wanted you to know."</p>

<h3>Anti-pattern: never updating your view</h3>
<p><strong>Looks like:</strong> Argue your position; new evidence comes; argue same position; just louder.</p>
<p><strong>Why bad:</strong> Reads as dogmatic. Loses credibility over time.</p>
<p><strong>Fix:</strong> "Okay, you've convinced me on X" — said sincerely, occasionally — is a strength, not weakness. Practice.</p>

<h3>Anti-pattern: "I told you so"</h3>
<p><strong>Looks like:</strong> Lost the argument 3 months ago; now plan is failing; bring it up at every retro.</p>
<p><strong>Why bad:</strong> Erodes the disagree-and-commit social contract. Makes future dissent harder for you (peers stop including you because they fear the gloat).</p>
<p><strong>Fix:</strong> If decision is failing, focus on fixing forward. Your dissent is documented; you don't need to point at it.</p>

<h3>Anti-pattern: relitigating closed decisions</h3>
<p><strong>Looks like:</strong> Decision made 6 weeks ago; in every retro / 1:1 you bring it up again.</p>
<p><strong>Why bad:</strong> Drag on team. Erodes "we make decisions and move on" norm.</p>
<p><strong>Fix:</strong> Reopen explicitly: "I want to revisit our X decision because [new evidence]. Are we open to that?" — or drop it.</p>

<h3>Anti-pattern: making disagreement personal</h3>
<p><strong>Looks like:</strong> "Your design is bad" → "You always over-engineer."</p>
<p><strong>Why bad:</strong> Person attacks the problem differently than design attacks. Person can't be fixed; design can.</p>
<p><strong>Fix:</strong> Always speak about the work / decision / artifact. "This design has X issue" not "you have X issue."</p>

<h3>Anti-pattern: emotional flooding</h3>
<p><strong>Looks like:</strong> Argument heats up; you can't think straight; keep arguing anyway.</p>
<p><strong>Why bad:</strong> Decisions made in flood are usually wrong. Things said in flood are often regretted.</p>
<p><strong>Fix:</strong> Notice the flood. "Let me come back to this tomorrow when I've had time to think." Disengage; cool down; return.</p>

<h3>Anti-pattern: hiding behind "the data"</h3>
<p><strong>Looks like:</strong> Use data selectively to win; ignore data that contradicts you.</p>
<p><strong>Why bad:</strong> Other party detects it. Trust in your data presentations drops.</p>
<p><strong>Fix:</strong> Steel-man the counter-data. "There's also data that says X — here's how I weigh it."</p>

<h3>Anti-pattern: never admitting you were wrong</h3>
<p><strong>Looks like:</strong> Decision goes against you; you were right; never come back to acknowledge "I was wrong about Y."</p>
<p><strong>Wait, this looks reversed?</strong> No — even when you "win," sometimes parts of your argument were wrong. Acknowledge those.</p>
<p><strong>Why bad:</strong> Reads as score-keeping rather than truth-seeking.</p>
<p><strong>Fix:</strong> "Looking back, I was wrong about X piece of my argument; right about Y." Specificity earns credibility.</p>

<h3>Anti-pattern: avoidance via preemptive surrender</h3>
<p><strong>Looks like:</strong> Yield on every disagreement before fully engaging. Become "easy to work with" by having no opinions.</p>
<p><strong>Why bad:</strong> Output reflects everyone else's views. Promo packets thin. Career stalls.</p>
<p><strong>Fix:</strong> Pick the disagreements that matter. Hold the line on those. Yield freely on lower-stakes.</p>

<h3>Anti-pattern: sandbagging the decision you opposed</h3>
<p><strong>Looks like:</strong> Lost argument; assigned to implement the chosen direction; do bare minimum; let it fail; be vindicated.</p>
<p><strong>Why bad:</strong> Career-limiting. Reputation-destroying. Eventually noticed.</p>
<p><strong>Fix:</strong> When you commit, commit. Bring same energy you'd have brought to your preferred approach.</p>

<h3>Anti-pattern: triangulating</h3>
<p><strong>Looks like:</strong> Disagree with A; complain about A to B and C; never address with A directly.</p>
<p><strong>Why bad:</strong> Toxic team dynamic. A finds out; trust collapses.</p>
<p><strong>Fix:</strong> Direct first. If you need to vent, vent to one trusted person briefly, then go direct.</p>

<h3>Anti-pattern: making every issue a hill to die on</h3>
<p><strong>Looks like:</strong> Every disagreement is "I might quit over this."</p>
<p><strong>Why bad:</strong> Real "I might quit" loses meaning. Boy who cried wolf.</p>
<p><strong>Fix:</strong> Reserve hill-to-die-on for actual ethics / line-crossing. Most disagreements aren't.</p>

<h3>Anti-pattern: never disagreeing with seniors</h3>
<p><strong>Looks like:</strong> Disagree with peers and juniors freely; clam up around senior staff or directors.</p>
<p><strong>Why bad:</strong> Senior decisions often have biggest impact; they need dissent more, not less. Also: career-limiting (senior leaders notice who pushes back well).</p>
<p><strong>Fix:</strong> Push yourself to dissent up at least once a quarter. Use written form. Keep it crisp + data-driven.</p>

<h3>Anti-pattern: arguing in public, conceding in private</h3>
<p><strong>Looks like:</strong> Concede in 1:1; then re-argue same position publicly.</p>
<p><strong>Why bad:</strong> Coworker feels played. Trust gone.</p>
<p><strong>Fix:</strong> Be consistent. If you really still disagree, say so in the 1:1.</p>

<h3>Anti-pattern: tolerating bad behavior as "just disagreement"</h3>
<p><strong>Looks like:</strong> Peer is yelling, dismissive, exclusionary; you frame it as "robust debate."</p>
<p><strong>Why bad:</strong> Bad behavior is not productive disagreement. Letting it slide normalizes it.</p>
<p><strong>Fix:</strong> Address bad behavior directly. Loop manager / HR if pattern persists. Don't conflate.</p>
`
    },
    {
      id: 'interview',
      title: '🎤 Interview Patterns',
      html: `
<h3>"Tell me about a time you disagreed with [PM / manager / peer]"</h3>
<p>Almost every senior+ interview asks this. They're checking: do you have spine + skill?</p>

<h4>Strong answer template</h4>
<ol>
  <li>Setup: situation, the disagreement.</li>
  <li>Stakes: why it mattered.</li>
  <li>Your approach: how you raised it, what evidence you brought.</li>
  <li>The conversation: how it went, what they said, what you said.</li>
  <li>Outcome: what got decided.</li>
  <li>If you lost: did you commit? Did the decision hold up?</li>
  <li>Reflection: what you'd do differently.</li>
</ol>

<h4>Example</h4>
<pre><code>"Last year, my PM wanted to ship a feature in a sprint I thought
was a week too short. I was concerned about a specific edge case
in offline sync — testing during prototype stage produced data
corruption in 2 of 4 scenarios.

The stakes: we were a customer-facing mobile app. A sync bug in
production would mean lost user data + a hotfix release through
app review.

How I raised it: written 1-pager to PM. Restated their goal
(launch by date X for a marketing campaign), my concern (offline
sync risk), evidence (2 of 4 test scenarios produced corruption),
and three options: ship as planned with risk; ship with reduced
scope; slip 1 week.

We met. PM had context I didn't — campaign timing was tied to
budget cycle that couldn't shift. We talked through the
risk/reward; landed on a reduced-scope ship that disabled
offline writes for the first week post-launch (mitigation), then
re-enabled in a follow-up release after extended testing.

Outcome: shipped on time; no production data issue; full
offline functionality enabled 2 weeks later. PM thanked me for
flagging early — they hadn't realized the risk.

What I'd do differently: I should have surfaced the risk a week
earlier when prototype testing first showed it. Surfacing late
forced an emergency negotiation; surfacing early would have been
calmer."</code></pre>

<h4>What interviewers want to hear</h4>
<ul>
  <li>You raised it explicitly (didn't suppress).</li>
  <li>You framed in writing or with data (not vibes).</li>
  <li>You proposed alternatives, not just objections.</li>
  <li>You listened (acknowledged context you didn't have).</li>
  <li>You didn't make it personal.</li>
  <li>You committed once decision was made.</li>
  <li>You can name what you'd do differently.</li>
</ul>

<h4>What sinks the answer</h4>
<ul>
  <li>"I was right, they were wrong, I told them so." (Combative.)</li>
  <li>"I just went along with it." (No spine.)</li>
  <li>"I escalated to my skip immediately." (Skipped peer-level.)</li>
  <li>"It got really emotional." (No control.)</li>
  <li>No reflection / no learning.</li>
</ul>

<h3>"How do you handle disagree-and-commit"</h3>
<pre><code>"I think DAC is the most important norm a team can have. The way I
practice it: argue hard while the decision is open — written, with
data, with alternatives. Once decision is made, I commit fully.

Specifically: I bring same energy to the chosen path as I would
have to my preferred one. I don't slow-walk; I don't say 'told you
so' if it fails; if it does fail, I focus on fixing forward, not
relitigating.

I also document my dissent at the time of the decision — not for
'I told you so' purposes, but so that if circumstances change, we
can revisit informedly. The dissent is logged; my commitment to
execute is total."</code></pre>

<h3>"Tell me about a time someone disagreed with you"</h3>
<p>Mirror question. Tests how you receive disagreement.</p>
<pre><code>"Junior on my team pushed back on a design pattern I'd proposed.
They thought it would create maintenance burden. My first reaction
was to defend — I'd thought it through.

I caught myself. Asked them to walk me through the specific
concern. They had a real point: the pattern worked for the current
case but locked us into a specific shape if we needed to extend it
in three predictable ways.

I updated the design to address their concern. Told them
explicitly: 'You changed my mind on X; thanks for pushing back.'

What I learned: my instinct to defend was bad. Best response to
disagreement is to ask for specifics first; defend only if I still
think they're wrong after understanding. Defaulting to ask
makes me a better engineer + signals to juniors that pushback is
welcome."</code></pre>

<h3>"How do you handle a difficult coworker"</h3>
<pre><code>"Depends on the difficulty. If it's a working-style mismatch, I try
direct conversation first — name the pattern, ask for what I need,
offer reciprocity. Most patterns improve with one clear conversation.

If it's bad behavior — yelling, dismissiveness, exclusion — I
address directly when safe. If pattern persists, I document and
loop my manager. I don't suffer in silence; tolerated bad behavior
continues.

If it's a values clash — we just see things differently — I find
the workable middle, push for written norms so we're not constantly
re-litigating, and try to keep our work areas separate where
possible.

I don't try to fix every coworker. Some relationships are
'professional and effective, but never close,' and that's fine."</code></pre>

<h3>"How do you decide when to escalate"</h3>
<pre><code>"Three criteria. First, is peer-level resolution genuinely
exhausted? Did I try direct conversation, written disagreement,
bringing in a tech lead? Skipping these damages relationships.

Second, what's the cost of not escalating? If letting the issue
go for 30 days has minor impact, often worth letting go. If it
materially affects customer / project / team, escalate.

Third, am I escalating to win or to get a decision? I escalate
to get a decision. I'm prepared to lose. If I'm escalating to
weaponize my manager into making the peer back down, I shouldn't
escalate.

When I do escalate, I tell the peer first. 'I want to surface this
to our managers because we couldn't resolve at our level' — not as
a threat, as a heads-up."</code></pre>

<h3>"Have you ever been wrong about a major disagreement"</h3>
<p>Important question; many candidates fumble.</p>
<pre><code>"Yes. Two years ago I argued strongly against adopting a new build
tool — I thought the migration cost wasn't justified. We adopted it
anyway after a leadership decision.

Three months in, I realized I'd been wrong. The build speed gain
was meaningfully larger than I'd projected; the migration was less
disruptive than I feared.

I went back to the lead who pushed for it: 'You were right about
this. I underweighted the speed gain and overweighted the migration
cost. Updating my mental model.'

What I learned: I'd anchored on migration cost too hard because I'd
been burned on a similar migration before. My pattern-match was
miscalibrated. Now when I argue against a change, I check: am I
seeing this case clearly, or am I fighting the last war?"</code></pre>

<p>This answer signals: self-awareness, ability to update, willingness to acknowledge being wrong publicly. All seniority signals.</p>

<h3>"How do you give negative feedback"</h3>
<pre><code>"Direct, specific, private, soon.

Direct: 'Want to flag something' — not buried in compliment
sandwich.
Specific: behavior + impact, not character. 'When you did X in
the meeting, it caused Y' — not 'you're disrespectful.'
Private: 1:1, not in public, unless the behavior was public and a
correction is needed in the same moment.
Soon: within a few days of the event, while details are fresh.
Both sides remember accurately.

I also check my motive — am I giving feedback to help them grow,
or to vent? If venting, I sit on it 24 hours. If still feels
worth saying, I give it; if not, let go."</code></pre>

<h3>"How do you receive negative feedback"</h3>
<pre><code>"Three things. First, listen without defending — even when my
instinct is to. I try to ask 'can you give me a specific example?'
to anchor on behavior, not vibes.

Second, separate signal from delivery. Sometimes feedback is
delivered badly but the underlying point is fair. I try to
extract the signal even from clumsy feedback.

Third, follow up. If the feedback is real, I work on it and check
back: 'You mentioned X last month; here's what I've been doing
differently. Is it landing?' Closes the loop, signals I took it
seriously."</code></pre>

<h3>The 30-second mantra</h3>
<p><em>"Argue the problem, not the person. Use writing for high-stakes. Disagree-and-commit. Escalate as a tool, not a weapon. Address bad behavior separately."</em></p>
<p>Productive disagreement is a senior-level skill that compounds. Engineers who never disagree become invisible; engineers who detonate become liabilities; engineers who disagree well become indispensable.</p>
`
    }
  ]
});
