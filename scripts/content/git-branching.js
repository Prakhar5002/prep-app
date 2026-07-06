window.PREP_SITE.registerTopic({
  id: 'git-branching',
  module: 'git',
  title: 'Branching & Merging',
  estimatedReadTime: '24 min',
  tags: ['git', 'branching', 'merging', 'branches', 'conflicts', 'fast-forward'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p><strong>A branch is just a movable, lightweight pointer to a commit</strong> — nothing more. Creating a branch doesn't copy any files or history; Git drops a small named pointer next to whatever commit you're on, and that pointer automatically moves forward, one commit at a time, every time you commit while it's checked out. This is what makes branching in Git effectively free, unlike older tools where "branching" meant copying an entire codebase.</p>
<ul>
  <li><strong>Branch to isolate work.</strong> Start a new feature, try a risky refactor, or fix a bug — all on a separate pointer, away from <code>main</code> — so <code>main</code> stays stable and deployable while you work.</li>
  <li><strong><code>HEAD</code> tracks "where you are."</strong> <code>HEAD</code> normally points at whichever branch you currently have checked out. Switch branches, and <code>HEAD</code> — along with your entire working tree — moves to match.</li>
  <li><strong>Merging brings two lines of history back together.</strong> <code>git merge &lt;branch&gt;</code> combines the named branch's history into your current branch, one of two ways: a <strong>fast-forward</strong> (just slide the pointer forward, no new commit) or a <strong>3-way merge</strong> (create a new commit with two parents, because both branches moved independently).</li>
  <li><strong>Conflicts are a normal pause, not an error.</strong> When both branches changed the same lines, Git can't guess which version you want — it stops mid-merge, marks the disputed spots in the file, and waits for you to decide. Resolving one is a routine, learnable skill, not a crisis.</li>
  <li><strong>This is topic 2 of the Git module.</strong> It builds directly on the commit/staging model from Git Fundamentals. Everything here — pointers, <code>HEAD</code>, merge commits — is what remotes, rebase, and cherry-pick (later in this module) all manipulate.</li>
</ul>
<p><strong>Mantra:</strong> "A branch is a pointer, not a copy. Fast-forward just slides the pointer; a 3-way merge creates a new commit with two parents. A conflict is just a spot where Git needs your judgment, not a failure."</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why branch at all</h3>
<p>Without branches, everyone would have to work directly on one shared line of history — meaning half-finished features, experiments, and bug fixes would all sit mixed together, and any mistake would immediately affect everyone else pulling that history. Branches solve this by giving you an isolated line of commits to work in:</p>
<ul>
  <li><strong>Isolation.</strong> Work on a feature or fix without touching <code>main</code> until you're ready. If the experiment doesn't pan out, delete the branch — <code>main</code> was never at risk.</li>
  <li><strong>Parallel work.</strong> Multiple people (or just multiple tasks you're juggling yourself) can each have their own branch, developing independently, without stepping on each other's half-finished changes.</li>
  <li><strong>A stable release line.</strong> Teams keep <code>main</code> (or a release branch) in a state that's always deployable, and route all new work through short-lived feature branches that only join <code>main</code> once they're reviewed and working.</li>
  <li><strong>Cheap experiments.</strong> Because creating a branch is just writing one pointer (not copying files), you can spin one up to try something risky and throw it away in seconds if it doesn't work.</li>
</ul>

<h3>Why merging exists</h3>
<p>Isolation is only half the story — work done on a branch is only useful once it rejoins the rest of the project. <strong>Merging</strong> is how two lines of history come back together: it takes the changes introduced on one branch and folds them into another, producing a result that contains both branches' work.</p>
<p>Merging is what makes the branch-per-feature workflow practical end to end: branch off <code>main</code> to isolate a feature, do the work in as many commits as you like, then merge back into <code>main</code> once it's ready — and repeat, for every feature, indefinitely. Without a reliable way to merge, branching would just be a way to lose track of work, not organize it.</p>

<h3>Branches are pointers, not copies</h3>
<p>This is the single most important thing to internalize before the mechanics below make sense: a branch does not duplicate your project. <code>git branch feature-x</code> does not create a second copy of every file — it creates one new pointer (a few bytes, stored as a file under <code>.git/refs/heads/</code>) referencing whatever commit you were on. Your working tree doesn't change size, cloning doesn't get slower as you add branches, and switching between branches is fast because Git is just updating which commit's snapshot to check out, not copying folders around.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>A branch is a name for a commit; <code>HEAD</code> is a name for a branch</h3>
<p>Under the hood, a branch (e.g. <code>main</code>, <code>feature-x</code>) is nothing more than a file containing a single commit SHA — its "tip." When you commit while that branch is checked out, Git writes the new commit, then updates the branch's file to point at it. That's the entire mechanism.</p>
<p><code>HEAD</code> sits one level above that: in the normal case, <code>HEAD</code> doesn't hold a commit SHA directly — it holds the <em>name</em> of whichever branch is currently checked out (Git calls this a "symbolic reference"). So the chain is <code>HEAD → branch name → commit SHA</code>. Switching branches rewrites what <code>HEAD</code> points to; committing moves the branch (and, transitively, <code>HEAD</code>) forward to the new commit.</p>
<pre><code class="language-text">Before any branching — one branch, "main", pointing at the latest commit:

  C1 ── C2 ── C3
              ▲
             main  (HEAD → main)

Create a new branch here — just a second pointer at the SAME commit,
nothing is copied or duplicated:

  C1 ── C2 ── C3
              ▲▲
       main ──┘└── feature   (HEAD → feature, after switching to it)

Commit once on "feature" — only feature's pointer moves forward;
main stays exactly where it was:

  C1 ── C2 ── C3 ── C4
              ▲      ▲
            main   feature   (HEAD → feature)</code></pre>
<p>Every branch operation you'll do — creating, switching, deleting, merging — is really just reading or rewriting these small pointers. The commits themselves never move; only the labels pointing at them do.</p>

<h3>Fast-forward merge: no new commit needed</h3>
<p>A <strong>fast-forward</strong> merge is possible exactly when the branch you're merging <em>into</em> hasn't moved since the branch you're merging <em>from</em> split off — in other words, the current branch's tip is a direct ancestor of the other branch's tip. There's nothing to reconcile: Git just slides the current branch's pointer forward to match.</p>
<pre><code class="language-text">BEFORE — main hasn't moved since feature branched off:

  C1 ── C2 ── C3 ── C4 ── C5
              ▲            ▲
            main         feature

Run: git switch main && git merge feature

AFTER — fast-forward: main's pointer just slides up to C5.
No new commit is created; "feature" and "main" now point at the same commit:

  C1 ── C2 ── C3 ── C4 ── C5
                           ▲▲
                    main ──┘└── feature</code></pre>

<h3>3-way merge: both branches moved — a new merge commit is required</h3>
<p>A <strong>3-way merge</strong> happens when both branches have moved independently since they diverged — the current branch's tip is <em>not</em> an ancestor of the other branch's tip (and vice versa). A fast-forward is impossible: there's no single straight line to slide a pointer along. Git instead looks at three snapshots — the two branch tips, plus their common ancestor — and creates a brand-new <strong>merge commit</strong> with <em>two</em> parents, combining both histories.</p>
<pre><code class="language-text">BEFORE — main gained C6 while feature gained C4 and C5,
both branching from the same common ancestor, C3:

  C1 ── C2 ── C3 ── C6
              │      ▲
              │     main
              └── C4 ── C5
                         ▲
                       feature

Run: git switch main && git merge feature

AFTER — 3-way merge: a new merge commit M is created, with
TWO parents (C6 and C5). main now points at M; feature is untouched:

  C1 ── C2 ── C3 ── C6 ────── M
              │              /▲
              │             / main
              └── C4 ── C5 ─┘
                         ▲
                       feature</code></pre>
<p>The merge commit <code>M</code> is the only kind of commit with two parents (a normal commit has exactly one; the very first commit in a repo has zero). Following <em>either</em> parent pointer from <code>M</code> gets you back into real history — that's how <code>git log</code> can show you both branches' commits after a merge.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Listing and creating branches: <code>git branch</code></h3>
<pre><code class="language-bash"># List local branches (the current one is marked with *):
git branch

# List with each branch's latest commit summary:
git branch -v

# Create a new branch pointing at the current commit
# (this does NOT switch to it — you stay on your current branch):
git branch &lt;name&gt;
git branch feature-login</code></pre>
<p><code>git branch</code> with no arguments is purely informational. <code>git branch &lt;name&gt;</code> creates the pointer but deliberately doesn't move you onto it — for creating <em>and</em> switching in one step, see <code>switch -c</code> below.</p>

<h3>Switching branches: <code>git switch</code> (modern) vs. <code>git checkout</code> (older)</h3>
<pre><code class="language-bash"># Switch to an existing branch:
git switch &lt;name&gt;
git switch main

# Create a new branch AND switch to it in one step:
git switch -c &lt;name&gt;
git switch -c feature-login

# Older equivalents (still work everywhere, still extremely common in the wild):
git checkout &lt;name&gt;
git checkout -b &lt;name&gt;</code></pre>
<p>Git 2.23 introduced <code>git switch</code> (for branches) and <code>git restore</code> (for files) to split apart the older <code>git checkout</code> command, which had grown to do both jobs — switch branches <em>and</em> restore files — under one name, a frequent source of confusion for beginners. <code>git switch -c &lt;name&gt;</code> is the direct modern replacement for <code>git checkout -b &lt;name&gt;</code>; both create a branch at your current commit and move you onto it immediately. You'll see <code>checkout</code> constantly in older tutorials, Stack Overflow answers, and existing muscle memory — it still works exactly as before, so there's no need to "migrate" old habits, but reach for <code>switch</code> in anything you write from here on.</p>

<h3>Deleting and renaming branches</h3>
<pre><code class="language-bash"># Safe delete — refuses if the branch has commits not merged anywhere else:
git branch -d &lt;name&gt;
git branch -d feature-login

# Force delete — deletes regardless of merge status (can lose commits!):
git branch -D &lt;name&gt;

# Rename the branch you're currently on:
git branch -m &lt;new-name&gt;

# Rename a different branch without switching to it:
git branch -m &lt;old-name&gt; &lt;new-name&gt;</code></pre>
<p><code>-d</code> (lowercase) is a guardrail: Git checks whether every commit on that branch is already merged into the branch you're currently on (or its tracked upstream, if one is set) first, and refuses to delete it if not — protecting you from silently losing work. <code>-D</code> (uppercase) skips that check entirely; only reach for it when you're certain you don't need those commits (or you've already recorded the SHA some other way).</p>

<h3>Merging: <code>git merge</code></h3>
<pre><code class="language-bash"># Merge &lt;branch&gt; INTO whatever branch you currently have checked out:
git switch main
git merge &lt;branch&gt;
git merge feature-login

# Force a real merge commit even when a fast-forward would be possible:
git merge --no-ff &lt;branch&gt;

# Supply your own merge commit message instead of the auto-generated one:
git merge -m "Merge feature-login into main" &lt;branch&gt;</code></pre>
<p>Direction matters: <code>git merge feature-login</code>, run while <code>main</code> is checked out, folds <code>feature-login</code>'s commits into <code>main</code> — not the other way around. Git decides automatically whether a fast-forward is possible (see Mental Model above); <code>--no-ff</code> is how you opt out of that and force a merge commit to exist anyway, which some teams prefer because it leaves a clear, visible marker in history for exactly when and where a feature branch joined <code>main</code>, even for a change that could have fast-forwarded cleanly.</p>

<h3>Merge conflicts: when Git can't decide for you</h3>
<p>A fast-forward or a clean 3-way merge only happens when Git can automatically figure out the right combined result. If both branches changed the <em>same lines</em> of the <em>same file</em> in different ways, Git has no way to guess which version you want — it stops in the middle of the merge and asks you to resolve it by hand. This isn't a bug or a failure state; it's the expected, routine outcome whenever two people (or two branches) genuinely edited the same spot.</p>
<pre><code class="language-bash">git merge feature-login
# Auto-merging config.js
# CONFLICT (content): Merge conflict in config.js
# Automatic merge failed; fix conflicts and then commit the result.</code></pre>
<p>Git leaves the repository in a special "merging" state and edits the conflicted file(s) in place, inserting <strong>conflict markers</strong> around every disputed section:</p>
<pre><code class="language-text">&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD
const timeout = 30;
=======
const timeout = 60;
&gt;&gt;&gt;&gt;&gt;&gt;&gt; feature-login</code></pre>
<p>Reading this: everything between <code>&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD</code> and <code>=======</code> is what <em>your current branch</em> had at that spot; everything between <code>=======</code> and <code>&gt;&gt;&gt;&gt;&gt;&gt;&gt; feature-login</code> is what the <em>branch you're merging in</em> had. Nothing is lost — both versions are right there in the file, side by side, waiting for a decision.</p>
<p>Resolving a conflict is a manual, four-step routine:</p>
<ul>
  <li><strong>1. Open the file</strong> and find every block delimited by <code>&lt;&lt;&lt;&lt;&lt;&lt;&lt;</code> / <code>=======</code> / <code>&gt;&gt;&gt;&gt;&gt;&gt;&gt;</code> (a large conflict can have several, in different parts of the file, or across several files).</li>
  <li><strong>2. Edit it to the version you actually want</strong> — keep one side, keep the other, hand-write something that combines both, and <strong>delete all three marker lines</strong>. The file needs to end up as plain, valid code again, with no marker lines left in it.</li>
  <li><strong>3. Stage the resolved file</strong>, exactly like staging any other change: <code>git add &lt;file&gt;</code>. This is also how you tell Git "I've resolved this one" — a conflicted file that's still unstaged is still considered unresolved.</li>
  <li><strong>4. Commit</strong> with a plain <code>git commit</code> (no <code>-m</code> needed — Git opens your editor with a pre-filled merge commit message describing which branches were merged; you can accept it as-is, edit it, or still pass your own with <code>-m</code>).</li>
</ul>
<pre><code class="language-bash"># After hand-editing config.js to remove the conflict markers:
git add config.js
git commit
# Opens editor pre-filled with something like:
#   Merge branch 'feature-login' into main
# Save and close to complete the merge commit.</code></pre>
<p><code>git status</code> is your map during all of this — while a merge is in progress, it lists conflicted files under "Unmerged paths," and keeps telling you which ones still need <code>git add</code> before you can commit.</p>

<h3>Bailing out: <code>git merge --abort</code></h3>
<pre><code class="language-bash">git merge --abort</code></pre>
<p>If a conflict turns out to be more than you want to deal with right now — or you realize you merged the wrong branch entirely — <code>git merge --abort</code> cancels the in-progress merge and puts your working tree and branch back exactly how they were before you ran <code>git merge</code>. It's a full undo, but only while the merge is still unresolved and uncommitted; once you've completed the merge with <code>git commit</code>, <code>--abort</code> is no longer available (undoing a completed merge is a job for tools covered in the Undoing &amp; Everyday Fixes topic).</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Worked Examples', html: `
<h3>Example 1 — Feature branch, fast-forward merge</h3>
<pre><code class="language-bash"># Starting on main, create and switch to a feature branch in one step:
git switch -c feature-login
# Output: Switched to a new branch 'feature-login'

echo "function login() {}" > login.js
git add login.js
git commit -m "Add login function stub"
# main hasn't moved at all this whole time — it's still sitting
# at the commit feature-login branched off from.

# Switch back and merge:
git switch main
git merge feature-login
# Output: Updating a1b2c3d..f6e5d4c
#          Fast-forward
#          login.js | 1 +
#          1 file changed, 1 insertion(+)

git log --oneline --graph
# * f6e5d4c (HEAD -> main, feature-login) Add login function stub
# * a1b2c3d Add README</code></pre>
<p>Notice the log shows <code>main</code> and <code>feature-login</code> pointing at the <em>same</em> commit afterward, and there's no merge commit — exactly the fast-forward diagram from Mental Model above, played out with real commands.</p>

<h3>Example 2 — Divergent history, 3-way merge</h3>
<pre><code class="language-bash"># Branch off to work on navigation:
git switch -c feature-nav
echo "function nav() {}" > nav.js
git add nav.js
git commit -m "Add nav function stub"

# Meanwhile, switch back to main and commit something ELSE there too —
# main is no longer sitting still, so a fast-forward is no longer possible:
git switch main
echo "# Changelog" > CHANGELOG.md
git add CHANGELOG.md
git commit -m "Add changelog"

# Now merge feature-nav into main:
git merge feature-nav
# Output: Merge made by the 'ort' strategy.
#          nav.js | 1 +
#          1 file changed, 1 insertion(+)

git log --oneline --graph
# *   9f8e7d6 (HEAD -> main) Merge branch 'feature-nav'
# |\\
# | * c4d3e2f (feature-nav) Add nav function stub
# * | b2a1c0d Add changelog
# |/
# * f6e5d4c Add login function stub</code></pre>
<p>Because both branches had moved since they diverged, Git couldn't just slide a pointer — it created merge commit <code>9f8e7d6</code> with two parents (<code>b2a1c0d</code> on <code>main</code> and <code>c4d3e2f</code> on <code>feature-nav</code>), exactly matching the 3-way merge diagram above. The <code>--graph</code> flag is what makes this branching-and-rejoining visible in <code>git log</code>.</p>

<h3>Example 3 — Resolving a conflict end to end</h3>
<pre><code class="language-bash"># Two branches both edit the same line of config.js.
git switch -c feature-timeout
# Edit config.js: change "const timeout = 30;" to "const timeout = 60;"
git add config.js
git commit -m "Increase timeout to 60"

git switch main
# Edit config.js DIFFERENTLY: change "const timeout = 30;" to "const timeout = 45;"
git add config.js
git commit -m "Bump timeout to 45 for slow networks"

# Now merge — same line, two different edits, so Git can't auto-resolve:
git merge feature-timeout
# CONFLICT (content): Merge conflict in config.js
# Automatic merge failed; fix conflicts and then commit the result.

git status
# Output: both modified: config.js

# Open config.js — it now contains:
#   <<<<<<< HEAD
#   const timeout = 45;
#   =======
#   const timeout = 60;
#   >>>>>>> feature-timeout

# Decide on the right value (say, the larger one), edit the file to just:
#   const timeout = 60;
# and delete all three marker lines. Then:
git add config.js
git commit
# Editor opens pre-filled with "Merge branch 'feature-timeout'" — save and close.

git log --oneline --graph -3
# *   7a6b5c4 (HEAD -> main) Merge branch 'feature-timeout'
# |\\
# | * 3d2e1f0 (feature-timeout) Increase timeout to 60
# * | 8c9b0a1 Bump timeout to 45 for slow networks</code></pre>
<p>The end result is a normal merge commit, identical in shape to Example 2's — the conflict only changed <em>how you got there</em> (a manual edit in the middle), not the final structure of the history.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '⚠️ Edge Cases', html: `
<h3>Switching branches with uncommitted changes</h3>
<p>Git tries to carry uncommitted changes along when you switch, but only if doing so wouldn't overwrite something. If the file you've modified would come out differently on the target branch, <code>git switch</code> (and <code>git checkout</code>) refuses outright rather than silently discarding or merging your edits:</p>
<pre><code class="language-bash">git switch main
# error: Your local changes to the following files would be overwritten by checkout:
#         config.js
# Please commit your changes or stash them before you switch branches.</code></pre>
<p>Your options: commit the changes first (even as a rough "WIP" commit you clean up later), or temporarily shelve them without committing at all using <code>git stash</code> (a small holding area for uncommitted work, covered in the Undoing &amp; Everyday Fixes topic) — then switch, then reapply the stash later.</p>

<h3>Deleting a branch with unmerged commits</h3>
<pre><code class="language-bash">git branch -d experiment
# error: The branch 'experiment' is not fully merged.
# If you are sure you want to delete it, run 'git branch -D experiment'.</code></pre>
<p><code>git branch -d</code> is checking one specific thing: is this branch already merged into the branch you're currently on (or its tracked upstream, if one is set), so nothing would actually be lost? If not, it stops and tells you exactly how to force it — <code>git branch -D</code>. Treat that error as a genuine warning, not just an obstacle to bypass on autopilot: it means those commits currently exist <em>only</em> on this branch.</p>

<h3>"Detached HEAD" — checking out a commit instead of a branch</h3>
<p>Normally <code>HEAD</code> points at a branch name, which points at a commit. But if you check out a specific commit SHA directly (rather than a branch name), <code>HEAD</code> points straight at that commit instead — a state Git calls <strong>detached HEAD</strong>:</p>
<pre><code class="language-bash">git switch --detach f6e5d4c
# or the older form:
git checkout f6e5d4c
# Output: You are in 'detached HEAD' state...</code></pre>
<p>You can look around, and even make new commits, while detached — but no branch is following along. If you switch to another branch afterward without doing anything else, those new commits become unreachable from any branch name and are at real risk of eventually being garbage-collected. If you want to keep work made in detached HEAD, create a branch pointing at it <em>before</em> you switch away: <code>git switch -c &lt;name&gt;</code> while still detached turns your current position into a proper, named branch. (If you switch away first and forget, <code>git reflog</code> — covered in the Recovery topic — is usually how you find your way back.)</p>

<h3>Fast-forward vs. always creating a merge commit (<code>--no-ff</code>)</h3>
<p>A fast-forward is efficient — no extra commit, a perfectly linear history — but it also erases any visible trace that a separate branch ever existed; <code>git log</code> just shows a straight line of commits with no indication which ones were "the feature branch." Some teams deliberately prefer <code>git merge --no-ff</code> for every feature merge, specifically so that a merge commit always appears, giving <code>git log --graph</code> a clear, consistent marker for "this is where feature X joined main" even in cases that could have fast-forwarded cleanly. Neither approach is universally "correct" — it's a convention to agree on with your team, and one you'll see debated the same way as tabs-vs-spaces.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">What is a branch, really?</div>
<div class="qa-a">
<p>A branch is a lightweight, movable pointer to a single commit — stored as a small file (under <code>.git/refs/heads/</code>) holding that commit's SHA. It is not a copy of the project. Creating a branch just writes a new pointer at your current commit; committing while that branch is checked out moves the pointer forward to the new commit. <code>HEAD</code> is a further pointer, normally referencing whichever branch is currently checked out, which is how Git knows "where you are" and which branch to move forward on your next commit.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between a fast-forward merge and a 3-way merge?</div>
<div class="qa-a">
<p>A <strong>fast-forward</strong> happens when the branch you're merging into hasn't moved since the other branch diverged from it — its tip is a direct ancestor of the branch being merged in. There's nothing to reconcile, so Git just slides the pointer forward; no new commit is created. A <strong>3-way merge</strong> happens when both branches have moved independently since they diverged, so neither tip is an ancestor of the other. Git compares three snapshots — both tips plus their common ancestor — and creates a new merge commit with two parents that combines both histories. The name comes from those three snapshots being compared, not from having three parents.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">How do you resolve a merge conflict?</div>
<div class="qa-a">
<p>When Git can't automatically combine both branches' changes to the same lines of a file, it pauses the merge and inserts conflict markers — <code>&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD</code>, then your current branch's version, <code>=======</code>, then the incoming branch's version, then <code>&gt;&gt;&gt;&gt;&gt;&gt;&gt; branch-name</code> — directly into the affected file(s). You open the file, decide what the correct final content should be (one side, the other, or a hand-merged combination), delete all the marker lines, then run <code>git add &lt;file&gt;</code> to mark it resolved, and finally <code>git commit</code> to complete the merge with a (usually auto-filled) merge commit message. <code>git status</code> lists every conflicted file under "Unmerged paths" until it's staged. If it goes sideways, <code>git merge --abort</code> cancels the whole thing and restores the pre-merge state, as long as you haven't committed yet.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What is a merge commit, specifically?</div>
<div class="qa-a">
<p>It's an ordinary commit with one distinguishing feature: it has <em>two</em> (or, rarely, more) parent pointers instead of one. It's created automatically whenever <code>git merge</code> performs a 3-way merge (or whenever <code>--no-ff</code> forces one even if a fast-forward was possible). Its snapshot represents the combined result of both parent branches; walking either parent pointer from it leads into that branch's real history, which is why tools like <code>git log --graph</code> can render both branches' commits after a merge instead of losing one side.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q"><code>git switch</code> vs. <code>git checkout</code> — what's the difference, and which should you use?</div>
<div class="qa-a">
<p>They do overlapping jobs, but <code>checkout</code> is the older, overloaded command that handles both switching branches <em>and</em> restoring files to a previous state, depending on the arguments — a common source of beginner confusion. Git 2.23 split those two responsibilities into <code>git switch</code> (branches only) and <code>git restore</code> (files only). <code>git switch -c &lt;name&gt;</code> is the direct modern replacement for <code>git checkout -b &lt;name&gt;</code> — both create a branch at the current commit and move onto it. <code>checkout</code> still works exactly as before and is very common in existing docs and muscle memory, but <code>switch</code>/<code>restore</code> are the clearer, recommended commands for anything written today.</p>
</div>
</div>
`}

]});
