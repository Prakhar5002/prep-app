window.PREP_SITE.registerTopic({
  id: 'git-fundamentals',
  module: 'git',
  title: 'Git Fundamentals',
  estimatedReadTime: '22 min',
  tags: ['git', 'fundamentals', 'commits', 'staging', 'basics'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p><strong>Git</strong> is a <strong>distributed version control system</strong>: a tool that records snapshots of a project's files over time, so you can see history, undo mistakes, and let multiple people work on the same project without overwriting each other. "Distributed" means every clone of a project holds the <em>entire</em> history — not just the latest files, not a thin pointer back to a central server.</p>
<ul>
  <li><strong>The core loop:</strong> edit files → <code>git add</code> (stage the changes you want to keep) → <code>git commit</code> (save a permanent snapshot). You'll run this loop hundreds of times a day once it's second nature.</li>
  <li><strong>Three areas, one pipeline:</strong> your <strong>working tree</strong> (the files you're editing) → the <strong>staging area</strong> a.k.a. "the index" (a holding pen for what the <em>next</em> commit will contain) → the <strong>repository</strong> (the permanent, saved history of commits).</li>
  <li><strong>A commit is a snapshot, not a diff.</strong> Each commit records the full state of every tracked file at that point, plus a pointer to its parent commit(s), an author, a message, and a unique ID (a SHA hash). Git computes diffs on demand by comparing snapshots.</li>
  <li><strong>Staging exists so you can curate a commit.</strong> You don't have to commit every change in your working tree at once — you choose exactly what goes in, which is what makes clean, focused commit messages possible.</li>
  <li><strong>This is topic 1 of the Git module.</strong> Everything from here — branching, remotes, undoing mistakes, and eventually rebase, bisect, and recovery — builds on these three areas and the add → commit loop. Get this mental model solid before moving on.</li>
</ul>
<p><strong>Mantra:</strong> "Edit the working tree, stage what you want to keep, commit to save it permanently. Every clone has the full history."</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What version control is for</h3>
<p>Version control is just a system for tracking changes to a set of files over time. Without it, "keeping history" usually looks like a folder full of <code>report_final.docx</code>, <code>report_final_v2.docx</code>, <code>report_final_v2_ACTUALLY_FINAL.docx</code> — a manual, error-prone, un-searchable mess. Version control replaces that with a structured history that a tool understands and can query, compare, and roll back.</p>
<p>Concretely, version control gives you:</p>
<ul>
  <li><strong>History.</strong> Every saved change is recorded with who made it, when, and why (via a message). You can look at any past state of the project.</li>
  <li><strong>Undo.</strong> Made a mistake three days (or three months) ago? You can find the exact commit and see — or restore — what things looked like before.</li>
  <li><strong>Collaboration.</strong> Multiple people can work on the same project at once, each with their own copy, and later combine their changes.</li>
  <li><strong>Branching.</strong> You can try an experiment, or work on a feature, in isolation from the main line of work, without risking breaking anything until you're ready to combine it back. (Branching is its own topic later in this module — for now, know that Git is built to make this cheap.)</li>
</ul>

<h3>Distributed vs. centralized version control</h3>
<p>Older version control systems (like Subversion or CVS) were <strong>centralized</strong>: there was one server holding the "real" history, and your computer only held whatever single snapshot you'd checked out. To see history, browse old versions, or even see who changed a line, you had to talk to the server.</p>
<p>Git is <strong>distributed</strong>: when you <code>git clone</code> a project, you don't just download the current files — you download the <em>entire history</em>, every commit ever made (that's been pushed), onto your own machine. That has real consequences:</p>
<ul>
  <li><strong>You can work fully offline.</strong> Committing, browsing history, comparing old versions, creating branches — none of it needs a network connection. You only need the network to <em>synchronize</em> with other people's copies (which you'll do with <code>push</code>/<code>pull</code>, covered in the Remotes topic).</li>
  <li><strong>There's no single point of failure.</strong> If the central server (GitHub, GitLab, etc.) disappears, every clone still has the full history. Any clone can become the new "central" copy.</li>
  <li><strong>Every clone is a first-class, complete copy.</strong> There's no "read-only mirror" vs. "the real repo" distinction at the data level — just convention (a team agrees one remote, like GitHub, is where everyone pushes their work).</li>
</ul>

<h3>Why a staging area exists</h3>
<p>A natural question once you know "edit → commit" is the loop: why is there a separate staging step in between? Why not just commit whatever's currently changed?</p>
<p>The staging area (also called "the index") lets you <strong>curate</strong> exactly what goes into your next commit, independent of everything else you happen to have changed in your working tree. Concretely:</p>
<ul>
  <li>You fixed a bug <em>and</em> left some unrelated debug <code>console.log</code> lines in other files. Stage only the bug fix; commit it with a message describing the fix; leave the debug lines uncommitted for later.</li>
  <li>You changed five files but they represent two logically separate changes. Stage and commit the first change, then stage and commit the second — two clean commits instead of one messy one.</li>
  <li>You can even stage <em>part</em> of a single file's changes (covered in Mechanics below) — useful when one file has both a real fix and an unrelated formatting change mixed together.</li>
</ul>
<p>Skipping staging and always committing "everything that changed" works for tiny throwaway projects, but it's how commit history turns into an unreadable pile of unrelated changes bundled together. Staging is what makes commit history a <em>useful, readable</em> log instead of just "whatever happened to be true when I hit save."</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The three areas, as a pipeline</h3>
<p>Everything in day-to-day Git revolves around three areas your files move through, in order:</p>
<pre><code class="language-text">┌───────────────┐   git add    ┌────────────────┐  git commit  ┌──────────────┐
│  Working Tree │ ───────────► │  Staging Area  │ ───────────► │  Repository  │
│ (your files,  │              │  (the "index") │              │  (saved      │
│  as you edit  │              │  what the NEXT │              │   commits,   │
│  them)        │ ◄─────────── │  commit will   │              │   history)   │
└───────────────┘  git restore └────────────────┘              └──────────────┘
</code></pre>
<p><em>(The reverse arrow, <code>git restore</code>, is an undo command that copies content backwards — it's covered later, in the Undoing &amp; Everyday Fixes topic. Don't worry about it yet.)</em></p>
<ul>
  <li><strong>Working tree</strong> — the actual files on disk, in the state you're currently editing them. This is what your editor shows you.</li>
  <li><strong>Staging area (the index)</strong> — a snapshot-in-progress. When you run <code>git add &lt;file&gt;</code>, you're copying that file's current content into the staging area — telling Git "this is what I want in my next commit."</li>
  <li><strong>Repository</strong> — the permanent, saved history. When you run <code>git commit</code>, whatever is currently in the staging area gets sealed into a new, permanent commit and added to the repository's history.</li>
</ul>
<p>A file can be in different states across these three areas simultaneously — e.g. you edited a file further <em>after</em> staging it, so the working tree version and the staged version now differ. <code>git status</code> and <code>git diff</code> (both in Mechanics below) are how you inspect exactly that.</p>

<h3>What a commit actually is</h3>
<p>A commit is Git's fundamental unit of history. Each commit bundles together:</p>
<ul>
  <li><strong>A full snapshot</strong> of every tracked file's content at that point — not a diff. (Git is smart about storage internally, but conceptually, think "complete snapshot.")</li>
  <li><strong>A pointer to its parent commit(s)</strong> — the commit that came immediately before it. This is what links commits together into a history you can walk backwards through. A commit can have one parent (the normal case), zero parents (the very first commit in a repo), or two-or-more parents (a merge commit, covered later in this module).</li>
  <li><strong>Author and committer info</strong> — name, email, timestamp.</li>
  <li><strong>A commit message</strong> — the human-written explanation of what changed and why.</li>
  <li><strong>A unique ID — the SHA</strong> — a long hash (like <code>a1b2c3d4...</code>) computed from all of the above. Two commits can never accidentally share an ID; this is how Git refers to any commit unambiguously, and how it detects "have I already got this exact commit."</li>
</ul>
<p>Because each commit is an immutable snapshot pointing at its parent, the full history of a repo is really a chain (and sometimes a branching tree) of these snapshots — walk parent-to-parent and you're walking backwards through time.</p>

<h3>What <code>HEAD</code> means</h3>
<p><code>HEAD</code> is Git's answer to "where am I right now?" In the normal case, <code>HEAD</code> points at the tip (the most recent commit) of whatever branch you currently have checked out. When you make a new commit, <code>HEAD</code> — and the branch it points to — both move forward to the new commit.</p>
<p>You don't need branches to understand <code>HEAD</code> yet (that's the next topic) — for now, just know: <code>HEAD</code> always means "the commit I'd currently see if I looked at my working tree," and it's the reference point most commands use by default (e.g. <code>git diff</code> with no arguments compares your working tree against what's staged, and <code>git diff --staged</code> compares what's staged against <code>HEAD</code>).</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Starting a repository</h3>
<pre><code class="language-bash"># Turn the current directory into a Git repository (creates a hidden .git folder):
git init

# Or get a copy of an existing repository, history and all:
git clone &lt;url&gt;
git clone https://github.com/example/example-repo.git</code></pre>
<p><code>git init</code> starts a brand-new, empty repository right where you run it. <code>git clone</code> downloads an existing repository — including its <em>entire</em> history — into a new folder on your machine, and automatically sets up a connection back to where you cloned it from (covered in the Remotes topic).</p>
<p><strong>Note on branch names:</strong> Modern hosts (GitHub, GitLab) and Git installs with <code>init.defaultBranch</code> configured default a brand-new repo's first branch to <code>main</code> — but plain Git with no such config still falls back to the historical default, <code>master</code>. If your own <code>git init</code> shows <code>master</code> instead of <code>main</code>, that's why; run <code>git config --global init.defaultBranch main</code> to match the modern convention used in the examples below.</p>

<h3>Checking what's going on: <code>git status</code></h3>
<pre><code class="language-bash">git status</code></pre>
<p>This is the single most-run Git command. It tells you, in plain terms: which branch you're on, which files are staged and ready to commit, which files are modified but not yet staged, and which files Git doesn't know about at all (untracked). Run it constantly — before and after almost every other command, until reading its output is automatic.</p>

<h3>Staging changes: <code>git add</code></h3>
<pre><code class="language-bash"># Stage one specific file:
git add &lt;file&gt;
git add src/app.js

# Stage everything that's changed in the current directory and below:
git add .

# Stage multiple specific files:
git add src/app.js src/utils.js</code></pre>
<p><code>git add &lt;file&gt;</code> copies that file's current working-tree content into the staging area. It does <em>not</em> save anything permanently yet — it only marks "this is what I want in my next commit." You can keep editing the file afterwards; the staged copy won't change until you run <code>git add</code> on it again.</p>

<h3>Saving a snapshot: <code>git commit</code></h3>
<pre><code class="language-bash"># Commit whatever is currently staged, with an inline message:
git commit -m "Add user login form"

# Stage every already-tracked, modified file AND commit in one step
# (skips git add, but only for files Git already tracks — new files still need git add):
git commit -am "Fix typo in error message"</code></pre>
<p><code>git commit</code> seals whatever is currently in the staging area into a new, permanent commit. Write commit messages as if explaining the change to a teammate: what changed and why, not just "update" or "fix stuff."</p>

<h3>Looking at history: <code>git log</code></h3>
<pre><code class="language-bash"># Full history, most recent first:
git log

# One line per commit — much easier to scan:
git log --oneline

# One line per commit, with an ASCII graph of branches/merges:
git log --oneline --graph

# Show the last 5 commits only:
git log --oneline -5</code></pre>
<p><code>git log</code> walks the commit chain from <code>HEAD</code> backwards through parent pointers, printing each commit's SHA, author, date, and message. <code>--oneline</code> is the everyday version you'll reach for constantly; <code>--graph</code> becomes useful once branches are involved (next topic).</p>

<h3>Seeing exactly what changed: <code>git diff</code></h3>
<pre><code class="language-bash"># Compare working tree vs. staging area
# (i.e. "what have I changed that I haven't staged yet?"):
git diff

# Compare staging area vs. the last commit (HEAD)
# (i.e. "what am I about to commit?"):
git diff --staged

# Diff one specific file:
git diff src/app.js</code></pre>
<p>These two commands answer two different questions, and mixing them up is a common beginner confusion:</p>
<ul>
  <li><code>git diff</code> (no flags) → "what's changed in my working tree that isn't staged yet."</li>
  <li><code>git diff --staged</code> → "what's staged, that will actually go into my next commit."</li>
</ul>
<p>Run <code>git diff --staged</code> right before every <code>git commit</code> as a habit — it's your last chance to review exactly what you're about to save.</p>

<h3>Partial staging: <code>git add -p</code></h3>
<pre><code class="language-bash">git add -p
# or, to patch-stage one specific file:
git add -p src/app.js</code></pre>
<p>Sometimes a single file has two unrelated changes mixed together (say, a real bug fix plus some unrelated whitespace cleanup you did while you were in there). <code>git add -p</code> ("patch" mode) walks through the file's changes in small chunks ("hunks"), asking <code>y</code>/<code>n</code>/<code>s</code> (split further) for each one — letting you stage <em>part</em> of a file's changes while leaving the rest unstaged for a separate commit.</p>

<h3>Ignoring files: <code>.gitignore</code></h3>
<p>Some files should never be tracked by Git at all — build output, dependency folders, local secrets, OS clutter files. A <code>.gitignore</code> file, placed at the root of your repo, lists patterns for files Git should simply pretend don't exist (they won't show up in <code>git status</code>, and <code>git add .</code> will skip them).</p>
<pre><code class="language-bash"># .gitignore — one pattern per line
node_modules/
dist/
*.log
.env
.DS_Store</code></pre>
<p>Create it once per project, commit it (yes, the <code>.gitignore</code> file itself gets tracked), and everyone who clones the repo gets the same ignore rules automatically.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Worked Examples', html: `
<h3>Example 1 — Initialize a repo and make your first two commits</h3>
<pre><code class="language-bash">mkdir my-project && cd my-project
git init
# Output: Initialized empty Git repository in .../my-project/.git/

echo "# My Project" > README.md
git status
# Output shows README.md as an untracked file.

git add README.md
git status
# Output now shows README.md staged, ready to commit.

git commit -m "Add README"
# Output: [main (root-commit) a1b2c3d] Add README
#          1 file changed, 1 insertion(+)
# (See "master" instead of "main"? See the branch-naming note in Mechanics above.)

echo "console.log('hello');" > app.js
git add app.js
git commit -m "Add initial app.js"

git log --oneline
# f6e5d4c Add initial app.js
# a1b2c3d Add README</code></pre>
<p>Two commits, oldest at the bottom, newest (<code>f6e5d4c</code>, "Add initial app.js") at the top — that's the standard <code>git log</code> ordering, most recent first.</p>

<h3>Example 2 — Inspect what changed before committing</h3>
<pre><code class="language-bash"># You've been editing app.js for a while. Check in on things:
git status
# Output: modified: app.js (not staged)

# See exactly what changed, line by line:
git diff
# Output shows a unified diff: lines removed in red (-), added in green (+)

# Happy with it — stage it:
git add app.js

# Confirm what's actually about to be committed:
git diff --staged
# Same diff as before, but now it's diffing staged content vs. HEAD

# Commit, then review history:
git commit -m "Add error handling to app.js"
git log --oneline -3</code></pre>
<p>Notice <code>git diff</code> and <code>git diff --staged</code> can show <em>different</em> things if you keep editing after staging — that's the three-areas model from the Mental Model section in action.</p>

<h3>Example 3 — Ignore a build directory</h3>
<pre><code class="language-bash"># You've been running a build tool that generates a dist/ folder full of output.
git status
# Output: dist/ shows up as a pile of untracked files — noise you don't want to commit.

# Create .gitignore and add a pattern for it:
echo "dist/" >> .gitignore

git status
# dist/ no longer appears at all — Git is ignoring it.

git add .gitignore
git commit -m "Ignore build output directory"</code></pre>
<p>From now on, anything under <code>dist/</code> is invisible to <code>git status</code> and <code>git add .</code> — exactly as intended. If <code>dist/</code> had already been committed <em>before</em> you added it to <code>.gitignore</code>, see the "already-tracked files" edge case below — <code>.gitignore</code> alone won't remove it.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '⚠️ Edge Cases', html: `
<h3>"I added a file to .gitignore but Git is still tracking it"</h3>
<p><code>.gitignore</code> only stops Git from noticing <em>new, untracked</em> files that match its patterns — it does nothing for files Git is <em>already</em> tracking (i.e. that have been committed at least once). If you commit a file and only later add it to <code>.gitignore</code>, it stays tracked and keeps showing up in status/diffs.</p>
<pre><code class="language-bash"># Stop tracking the file, but keep it on disk:
git rm --cached &lt;file&gt;
git rm --cached secrets.env

# Now that it's untracked again, .gitignore will apply to it going forward:
git commit -m "Stop tracking secrets.env"</code></pre>
<p><code>--cached</code> is the key flag here — plain <code>git rm</code> would delete the file from your working tree too, which usually isn't what you want.</p>

<h3>Empty commits</h3>
<p>By default, Git refuses to create a commit with no changes staged (it'll tell you "nothing to commit, working tree clean"). Occasionally you deliberately want a commit with no file changes — e.g. to trigger a CI pipeline, or to mark a point in history:</p>
<pre><code class="language-bash">git commit --allow-empty -m "Trigger CI rebuild"</code></pre>

<h3>"fatal: unable to auto-detect email address" / author identity not set</h3>
<p>Every commit needs an author name and email baked in. If you've never configured Git before, your very first <code>git commit</code> will fail with an error asking you to set these:</p>
<pre><code class="language-bash"># Set globally (applies to every repo on this machine):
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

# Or just for the current repo (overrides the global setting):
git config user.name "Your Name"
git config user.email "you@example.com"</code></pre>
<p>This is a one-time setup per machine (or per repo, if you use a different identity for work vs. personal projects).</p>

<h3>Line endings: <code>core.autocrlf</code></h3>
<p>Windows and Unix-like systems (macOS, Linux) historically use different characters to mark the end of a line in text files. If your team mixes operating systems, this can cause every line of a file to show as "changed" in a diff — purely because of line-ending differences, not actual content changes. Git has a setting to normalize this:</p>
<pre><code class="language-bash"># On Windows — convert to LF when committing, back to CRLF when checking out:
git config --global core.autocrlf true

# On macOS/Linux — convert to LF when committing, don't convert on checkout:
git config --global core.autocrlf input</code></pre>
<p>You likely won't need to touch this as a beginner, but if you ever see a diff where <em>every</em> line of an unchanged-looking file appears modified, this setting (or a mismatch of it across your team) is the usual suspect.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">What are the three areas in Git?</div>
<div class="qa-a">
<p>The <strong>working tree</strong> (your actual files, as you're editing them), the <strong>staging area</strong> / index (a holding pen for what your next commit will contain), and the <strong>repository</strong> (the permanent, saved commit history). Changes flow working tree → staging area (via <code>git add</code>) → repository (via <code>git commit</code>).</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between the working tree, the staging area, and the repository?</div>
<div class="qa-a">
<p>The working tree is what's currently on disk — the files you're editing right now, which may or may not match anything Git has recorded. The staging area holds a snapshot-in-progress: exactly what you've told Git, via <code>git add</code>, you want in your <em>next</em> commit — it can differ from both the working tree (if you kept editing after staging) and the last commit. The repository is the sealed, permanent history — every commit ever made, immutable once created. <code>git status</code> compares all three; <code>git diff</code> compares working tree vs. staged, <code>git diff --staged</code> compares staged vs. the last commit.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What is a commit, and what does it contain?</div>
<div class="qa-a">
<p>A commit is an immutable snapshot of the entire project's tracked files at a point in time, plus metadata: a pointer to its parent commit (or parents, for a merge commit; none, for the very first commit), an author and timestamp, a commit message, and a unique SHA hash identifying it. Because each commit points to its parent, the chain of commits forms the project's full history.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What does <code>git add</code> actually do?</div>
<div class="qa-a">
<p>It copies the current content of the specified file(s) from the working tree into the staging area — marking that content as "what should go into the next commit." It's not a permanent save by itself; it's a staging step. You can run <code>git add</code> multiple times on a file as you keep editing it, each time updating what's staged, until you're ready to <code>git commit</code>.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between a distributed and a centralized version control system?</div>
<div class="qa-a">
<p>In a centralized system (e.g. Subversion), one server holds the full history, and each developer's machine typically only has the currently checked-out snapshot — most operations (viewing history, diffing old versions) require talking to the server. In a distributed system like Git, every clone contains the <em>entire</em> project history, not just the current files. That means you can commit, browse history, and create branches fully offline, there's no single point of failure, and any clone could, in principle, become the new "central" copy.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What is <code>HEAD</code>?</div>
<div class="qa-a">
<p><code>HEAD</code> is Git's pointer to "where you currently are" — normally, the tip (most recent commit) of whichever branch you have checked out. When you make a new commit, both <code>HEAD</code> and the branch it's attached to move forward to point at that new commit. Many commands default to comparing against <code>HEAD</code> when you don't specify otherwise — e.g. <code>git diff --staged</code> compares the staging area against <code>HEAD</code>.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Why does Git have a staging area at all — why not just commit everything that changed?</div>
<div class="qa-a">
<p>The staging area lets you curate exactly what goes into a commit, separate from everything else you happen to have changed in your working tree at that moment. That's what makes it possible to split unrelated changes into separate, focused commits (or even stage just part of one file's changes, via <code>git add -p</code>), instead of every commit being an undifferentiated dump of "whatever was true when I hit save."</p>
</div>
</div>
`}

]});
