window.PREP_SITE.registerTopic({
  id: 'design-srp',
  module: 'design',
  title: 'S · Single Responsibility',
  estimatedReadTime: '13 min',
  tags: ['design', 'solid', 'oop', 'srp', 'clean-code'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p><strong>Single Responsibility Principle (SRP)</strong>, Robert C. Martin's original phrasing: <strong>"A class should have one, and only one, reason to change."</strong> The sharper, modern framing — from Martin's own later book, <em>Clean Architecture</em> — is that a module should be <strong>responsible to one actor</strong>: one person or stakeholder group who would ask for the same kind of change.</p>
<ul>
  <li><strong>It is not "one method per class."</strong> That's the single most common misconception about SRP — a class can, and usually should, have several methods, as long as all of them serve the same responsibility and the same actor.</li>
  <li><strong>"Reason to change" means axis of change, not literal edit count.</strong> A <code>UserService</code> that saves a user to a database <em>and</em> emails them <em>and</em> formats a UI row has three separate reasons to change, driven by three different groups of people — even if, today, it only exposes one public method.</li>
  <li><strong>The smell it fixes:</strong> the "god class" — one file that a backend team, a marketing team, and a UI team all have to edit, for entirely unrelated reasons, at entirely unrelated times.</li>
  <li><strong>The fix is almost always the same shape:</strong> extract each responsibility into its own small collaborator class, and let the original class shrink down to pure orchestration — calling those collaborators in the right order, owning none of their implementation detail itself.</li>
</ul>
<p><strong>Mantra:</strong> "If describing what a class does needs the word 'and,' it has more than one reason to change."</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Cohesion and coupling — the two ideas SRP is really about</h3>
<p><strong>Cohesion</strong> is how tightly the things inside one module belong together — do they all serve the same purpose, change for the same reasons, get touched by the same people? <strong>Coupling</strong> is how entangled one module's internals are with another's. Underneath the "reason to change" phrasing, SRP is a statement about both: keep <em>highly cohesive</em> code together, in one class, and keep genuinely <em>unrelated</em> responsibilities apart, so a change to one doesn't ripple into — or force re-testing of — the other.</p>

<h3>Why mixing responsibilities causes real damage</h3>
<p>When a single class quietly takes on multiple, unrelated responsibilities, three specific problems show up, and they compound as the codebase grows:</p>
<ul>
  <li><strong>Shotgun surgery.</strong> A conceptually small change — "update the welcome email's subject line" — ends up touching a class that also handles database persistence, so you're now re-reading, re-testing, and risking code you had no reason to think about for this change.</li>
  <li><strong>Fragile tests.</strong> A test for "does this method persist a user correctly" now also has to mock an SMTP client it doesn't care about, purely because that dependency happens to live in the same class. A change to the email logic can break persistence tests, and vice versa.</li>
  <li><strong>Ownership conflicts.</strong> If a backend team owns persistence and a growth team owns email copy, they're now both editing the same file for entirely unrelated reasons — exactly the "two actors, one class" situation the modern framing names directly.</li>
</ul>
<p>None of this is really about class size or line count. A 400-line class that does one cohesive thing for one actor can be perfectly fine; a 40-line class doing three unrelated things for three actors is the SRP violation.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>"One reason to change" → "one axis of change" → "one actor"</h3>
<p>Martin's original 2002 wording — "a class should have one, and only one, reason to change" — turned out to be ambiguous in practice: two developers could disagree endlessly about what counts as "one reason." In his 2017 book <em>Clean Architecture</em>, Martin sharpened it: a module should be responsible to <strong>one, and only one, actor</strong> — where "actor" means a person or group of people who would ask for the same category of change (a business stakeholder, a DBA, a compliance team, a UI/product team). Two responsibilities count as "the same reason to change" only if the exact same actor would be the one requesting a change to either of them.</p>

<h3>The one-sentence test</h3>
<p>A fast, practical way to apply this: try to describe what a class does in one sentence, without using the word <strong>"and."</strong> "This class saves a user to the database" — fine, one responsibility. "This class saves a user to the database <em>and</em> sends them a welcome email <em>and</em> formats their profile for display" — three "and"s, three actors, three reasons to change, one class. If your one-sentence description needs "and," that's the signal to extract collaborators (see Mechanics, below) — not necessarily to shrink the class's line count, but to separate what different people actually care about.</p>

<h3>What SRP is not</h3>
<p>SRP does not mean "one method per class," "small classes are always better," or "never exceed N lines." A class with five methods that all serve the exact same actor and the exact same responsibility is a perfectly good, SRP-compliant class. Size is a symptom you might sometimes notice — not the rule itself. Plenty of tiny classes still violate SRP if their few methods serve unrelated actors, and plenty of larger classes don't violate it at all.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>How to spot a violation</h3>
<ul>
  <li><strong>The one-sentence description needs "and."</strong> The single most reliable signal — see Mental Model above.</li>
  <li><strong>Persistence + business rules + presentation, bundled together.</strong> A near-universal pattern: a class that talks to a database, applies domain rules, <em>and</em> formats output (a UI row, an HTML fragment, a report string) all in the same place.</li>
  <li><strong>Unrelated constructor dependencies.</strong> If a class's constructor takes a database client, a notification client, <em>and</em> a formatting/templating dependency, that's usually three actors' worth of collaborators wired into one class.</li>
  <li><strong>Tests that need unrelated mocks.</strong> If testing "does the discount calculate correctly" requires mocking an email client that has nothing to do with discounts, the class under test is doing too much.</li>
  <li><strong>Churn for unrelated reasons.</strong> If a file's commit history shows edits tagged "fix email copy," "add DB column," and "restyle the profile row" all mixed together, that file is serving multiple actors.</li>
</ul>

<h3>The fix: extract collaborators, then orchestrate</h3>
<p>The fix is essentially always the same shape: pull each responsibility out into its own small, focused class (a <strong>collaborator</strong>), and let the original class shrink down to <strong>orchestration</strong> — calling the right collaborators, in the right order, and owning none of their implementation detail itself. The original class doesn't disappear; its job changes, from "does everything" to "coordinates the people who do."</p>
<p>Two things this fix is <em>not</em>: it's not "split every method into its own class" (see What SRP is not, above), and it's not "add an interface and a dependency-injection setup for every collaborator." That's Dependency Inversion — a separate, later principle in this module, worth reaching for once you actually need to swap an implementation or isolate a test, not a mandatory add-on to every SRP extraction.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples (before → after)', html: `
<h3>Before: one class, three actors</h3>
<pre><code class="language-typescript">class UserService {
  constructor(private db: Database, private smtp: SmtpClient) {}

  // Responsibility 1: persistence — the backend/DBA actor
  async registerUser(input: { name: string; email: string }): Promise&lt;User&gt; {
    const user = await this.db.query&lt;User&gt;(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [input.name, input.email]
    );

    // Responsibility 2: notifications — the marketing/comms actor
    await this.smtp.send({
      to: input.email,
      subject: 'Welcome!',
      body: \`Hi \${input.name}, thanks for signing up.\`,
    });

    return user;
  }

  // Responsibility 3: presentation formatting — the UI/product actor
  formatUserRow(user: User): string {
    return \`\${user.name} &lt;\${user.email}&gt; — joined \${user.createdAt.toLocaleDateString()}\`;
  }
}
</code></pre>
<p>Three separate actors have a stake in this one file: the backend/DBA team cares about the SQL and schema, the marketing/comms team cares about the email copy, and the UI/product team cares about how a user row renders. A change to any one of the three touches the same class — and a mistake introduced while tweaking the row-formatting method sits right next to, and risks, the logic that persists real user data.</p>

<h3>After: one collaborator per actor, the original class only orchestrates</h3>
<pre><code class="language-typescript">// Persistence — the backend/DBA actor
class UserRepository {
  constructor(private db: Database) {}

  async save(input: { name: string; email: string }): Promise&lt;User&gt; {
    return this.db.query&lt;User&gt;(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [input.name, input.email]
    );
  }
}

// Notifications — the marketing/comms actor
class WelcomeMailer {
  constructor(private smtp: SmtpClient) {}

  async sendWelcome(user: User): Promise&lt;void&gt; {
    await this.smtp.send({
      to: user.email,
      subject: 'Welcome!',
      body: \`Hi \${user.name}, thanks for signing up.\`,
    });
  }
}

// Presentation — the UI/product actor
class UserRowView {
  static format(user: User): string {
    return \`\${user.name} &lt;\${user.email}&gt; — joined \${user.createdAt.toLocaleDateString()}\`;
  }
}

// Orchestration only — no SQL, no email copy, no formatting logic of its own
class UserService {
  constructor(private repository: UserRepository, private mailer: WelcomeMailer) {}

  async registerUser(input: { name: string; email: string }): Promise&lt;User&gt; {
    const user = await this.repository.save(input);
    await this.mailer.sendWelcome(user);
    return user;
  }
}
</code></pre>
<p>Each class now answers to exactly one actor: change the schema or the SQL, touch only <code>UserRepository</code>; change the email copy, touch only <code>WelcomeMailer</code>; change how a row renders, touch only <code>UserRowView</code>. <code>UserService</code> is now describable in one sentence without an "and" — <em>"UserService registers a new user"</em> — even though, underneath, persistence and notification both still happen; orchestrating them, not implementing them, is now its whole job.</p>
<p>Notice what this refactor <em>didn't</em> do: it didn't introduce interfaces or a dependency-injection container for these three collaborators, and it didn't split <code>UserRepository</code> further just because it "could." That restraint is the YAGNI point from the previous topic — SRP is fully satisfied here without reaching for Dependency Inversion, which is a separate concern for a later topic in this module.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">What does SRP actually mean — and what's the "one method" misconception?</div>
<div class="qa-a">
<p>SRP means a class should have one reason to change — the modern framing, from Martin's <em>Clean Architecture</em>, is that it should be responsible to one actor (one stakeholder group that would request the same kind of change). It does <strong>not</strong> mean "one method per class." A class can have several methods and still fully satisfy SRP, as long as all of them serve the same responsibility and the same actor. The misconception usually comes from confusing "narrow scope" — which SRP does want — with "few methods," which it doesn't require at all.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">How do you recognize an SRP violation in a real codebase?</div>
<div class="qa-a">
<p>The fastest check: try to describe the class in one sentence without "and." Concretely, look for persistence, business rules, and presentation formatting bundled in the same class; constructor dependencies that don't relate to each other (a database client next to an SMTP client next to a template renderer); tests that need unrelated mocks to pass; and commit history showing the same file edited repeatedly for clearly unrelated reasons (a schema change, a copy change, a UI tweak).</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Is SRP the same thing as "separation of concerns"?</div>
<div class="qa-a">
<p>Closely related, but not identical. Separation of concerns is the older, broader architectural idea: split a system into distinct sections, each addressing a separate concern (e.g. presentation, business logic, and data access as separate layers). SRP applies that same idea specifically at the level of a single class or module's reason to change and responsible actor. A useful way to hold both: SRP is separation of concerns applied one level down, at class-design granularity rather than architectural-layer granularity.</p>
</div>
</div>
`}

]});
