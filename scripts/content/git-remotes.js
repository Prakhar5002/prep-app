window.PREP_SITE.registerTopic({
  id: 'git-remotes',
  module: 'git',
  title: 'Remotes & Collaboration',
  estimatedReadTime: '20 min',
  tags: ['git', 'remotes', 'collaboration', 'fetch', 'pull', 'push', 'pr'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>A <strong>remote</strong> is just another copy of your repository living somewhere else — most commonly a host like GitHub or GitLab. <strong><code>origin</code></strong> is nothing magical: it's simply the conventional name Git gives the remote you cloned from. Because every clone already has the full history (see the Fundamentals topic), collaborating is really just three operations for explicitly syncing two independent copies: <strong>fetch</strong>, <strong>pull</strong>, and <strong>push</strong>.</p>
<ul>
  <li><strong><code>git clone &lt;url&gt;</code></strong> downloads a repo's full history and automatically wires up a remote named <code>origin</code> pointing back at it.</li>
  <li><strong><code>git fetch</code> is look-only and always safe.</strong> It downloads any new commits from a remote and updates your <em>remote-tracking branches</em> (like <code>origin/main</code>) — it never touches your working tree or your local branches. You can fetch constantly with zero risk.</li>
  <li><strong><code>git pull</code> is <code>fetch</code> + integrate.</strong> It downloads, then immediately folds those changes into your <em>current</em> branch — fast-forwarding with no new commit if your branch hasn't moved, or creating a merge commit if both sides diverged (or replaying your commits on top with <code>git pull --rebase</code> instead). Unlike fetch, this does change your branch and your working tree.</li>
  <li><strong><code>git push</code></strong> uploads your local commits to update a branch on the remote. The very first push of a new branch needs <code>-u</code> (<code>git push -u origin &lt;branch&gt;</code>) to record the "upstream" tracking relationship, so plain <code>git push</code>/<code>git pull</code> know where to sync afterward.</li>
  <li><strong>The PR/MR workflow is how teams actually collaborate:</strong> create a branch → push it → open a pull/merge request → get it reviewed (and CI-checked) → merge into <code>main</code>. Nobody pushes straight to a shared <code>main</code> in a healthy team workflow.</li>
  <li><strong>A rejected push means the remote has commits you don't.</strong> The fix is always to fetch and integrate first (merge or rebase), then push again — <strong>never</strong> reach for a blind <code>--force</code>, which can silently erase a teammate's work.</li>
</ul>
<p><strong>Mantra:</strong> "Fetch is free and safe — it only looks. Pull mutates your branch. Push shares your work, and only if it's a fast-forward. When a push is rejected, integrate first; never force blindly."</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What a remote actually is</h3>
<p>Strip away the tooling and a "remote" is just two things Git stores for you: a <strong>name</strong> and a <strong>URL</strong>. That's it — a remote is a named pointer to another copy of the same repository, wherever that copy happens to live: a hosted service like GitHub or GitLab, a server your company runs, or even another folder on your own disk. Git has no special-cased understanding of "GitHub" — pushing and fetching work identically against any Git server.</p>
<p>When you run <code>git clone &lt;url&gt;</code>, Git does two things: it downloads the entire history into a new local repository, <em>and</em> it automatically creates a remote entry named <code>origin</code> pointing back at the URL you cloned from. <code>origin</code> is purely a naming convention — almost everyone uses it for "the main remote I cloned from and sync with" — but you could rename it, and a repo can have more than one remote (a common pattern when working with a forked repo: <code>origin</code> points at your fork, <code>upstream</code> points at the original project).</p>

<h3>Why fetch, pull, and push are three separate commands</h3>
<p>Git is distributed (see the Fundamentals topic): every clone is a fully independent, complete copy of the history. That independence is exactly why synchronization has to be an <em>explicit</em>, deliberate act — Git never reaches out to a remote on its own, so nothing about your local repository changes unless you tell it to. That's the whole reason fetch/pull/push exist as distinct commands instead of one "sync" button: each one makes a different, specific promise about what it will and won't touch.</p>
<ul>
  <li><strong><code>git fetch</code> promises: "I will only download."</strong> It downloads any commits and branches the remote has that you don't, and updates a special set of local bookmarks called <em>remote-tracking branches</em> (covered in Mental Model below) to reflect the remote's current state. It does <strong>not</strong> touch your working tree, your staging area, or any of your own local branches. This is precisely why it's safe to run <code>git fetch</code> constantly, at any point, with any amount of uncommitted work sitting around — it changes nothing you're currently working on.</li>
  <li><strong><code>git pull</code> promises: "I will download, then also merge it into what you're standing on."</strong> It's shorthand for <code>git fetch</code> immediately followed by integrating the fetched changes into your current branch — either a merge (creating a merge commit if histories diverged) or, with <code>--rebase</code>, replaying your local commits on top of the fetched ones instead. Because this step actually changes your current branch (and your working tree, if the merge/rebase succeeds), it can conflict with uncommitted work or with commits you already made — unlike fetch, pull is not risk-free.</li>
  <li><strong><code>git push</code> promises: "I will upload my commits — but only if it's safe."</strong> Git will only let a push complete if it's a <em>fast-forward</em>: the remote branch's history must be an ancestor of what you're pushing, meaning nobody else's work would be discarded. If the remote has commits you don't have (because a teammate pushed first, or your local history was rewritten), the push is rejected rather than silently overwriting anyone.</li>
</ul>

<h3>Why teams don't just push straight to <code>main</code></h3>
<p>Technically, nothing stops anyone with write access from committing directly to a shared branch and pushing. In practice, virtually every team instead uses a <strong>pull request / merge request (PR/MR) workflow</strong>: do your work on its own branch, push that branch, then open a PR asking for it to be merged into <code>main</code>. This buys a team three things a direct push doesn't: a place for teammates to <em>review</em> the change before it lands, a hook for automated checks (CI: tests, linting, builds) to run and block bad merges, and a paper trail of <em>why</em> a change happened, attached to the code itself instead of scattered across chat. Nearly every host (GitHub, GitLab, Bitbucket) and every default branch-protection setting is built around this shape — it's covered end-to-end in Mechanics below.</p>
<p><strong>Note on branch names:</strong> as in the Fundamentals topic, this topic uses <code>main</code> throughout as the default/shared branch name, matching the modern convention on GitHub, GitLab, and any repo with <code>init.defaultBranch</code> configured. Older repos and plain local Git installs may still default to <code>master</code> — same commands, different name.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>Three copies of "main," not two</h3>
<p>The single biggest source of confusion with Git remotes is treating "your branch" and "the remote's branch" as the only two things involved. There are actually <strong>three</strong>, and keeping them distinct is what makes fetch/pull/push click:</p>
<pre><code class="language-text">Your machine                                    The remote (e.g. GitHub)
─────────────                                    ─────────────────────────
main                                             main
 → your LOCAL branch.                             → the ACTUAL branch that
   Moves forward every time                         lives on the server.
   you commit (git commit).                         You never edit this
                                                     directly — only through
                                                     fetch / pull / push.

origin/main
 → a REMOTE-TRACKING branch.
   A read-only bookmark, stored
   locally, recording "where
   origin's main was, as of my
   last fetch/pull/push."
   git commit NEVER moves this —
   only network operations do.
</code></pre>
<p>Reading that back into the three commands:</p>
<ul>
  <li><strong><code>git fetch</code></strong> talks to the remote, discovers its <code>main</code> has moved, and updates your local <code>origin/main</code> bookmark to match — and stops there. Your own <code>main</code> and your working tree are untouched.</li>
  <li><strong><code>git merge origin/main</code></strong> (what <code>git pull</code> does under the hood, by default) folds the commits now visible via the updated <code>origin/main</code> bookmark into your local <code>main</code>. <code>git pull --rebase</code> does the same job differently: it replays your local <code>main</code>'s commits on top of <code>origin/main</code> instead of creating a merge commit.</li>
  <li><strong><code>git push</code></strong> goes the other direction: it asks the remote to move its actual <code>main</code> forward to match your local <code>main</code> — and only agrees to do so if that's a fast-forward for the remote.</li>
</ul>
<p>Because <code>origin/main</code> only ever updates via a network operation, it's genuinely useful as a "last known state of the remote" reference — e.g. <code>git log main..origin/main</code> shows commits that exist on the remote but not in your local branch yet, computed entirely offline from your last fetch, with no network call needed.</p>

<h3>Upstream / tracking: how a local branch knows which remote branch is "its" remote branch</h3>
<p>A local branch can be linked to a specific remote-tracking branch — this link is called its <strong>upstream</strong> (or "tracking branch"). Once <code>main</code> is set to track <code>origin/main</code>, commands default sensibly: plain <code>git pull</code> and plain <code>git push</code> (no arguments) know exactly which remote and branch to talk to, and <code>git status</code> can tell you "Your branch is 2 commits ahead of 'origin/main'." This link is set automatically when you clone (your default branch tracks <code>origin/&lt;default-branch&gt;</code>), or explicitly the first time you push a new branch with <code>git push -u origin &lt;branch&gt;</code>.</p>
<p><code>git branch -vv</code> is the command that surfaces this relationship directly — it lists every local branch alongside the remote-tracking branch it's tied to, and how many commits ahead/behind it currently is (see Mechanics below for sample output).</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Getting a remote in the first place: <code>git clone</code></h3>
<pre><code class="language-bash">git clone &lt;url&gt;
git clone https://github.com/example/example-repo.git</code></pre>
<p>Downloads the full history and automatically creates a remote named <code>origin</code> pointing at <code>&lt;url&gt;</code> — you don't need to run <code>git remote add</code> yourself after a clone.</p>

<h3>Inspecting and adding remotes: <code>git remote</code></h3>
<pre><code class="language-bash"># List configured remotes and their URLs (fetch + push, usually identical):
git remote -v

# Wire up a remote by hand — e.g. for a repo you started with git init
# locally and now want to connect to an empty repo you created on GitHub:
git remote add origin &lt;url&gt;
git remote add origin https://github.com/example/example-repo.git

# Add a second remote — common in the fork workflow, to track the
# original project separately from your own fork:
git remote add upstream &lt;url&gt;</code></pre>
<p>A repo isn't limited to one remote. <code>origin</code> is just the conventional name for "the primary one" — it carries no special behavior in Git itself.</p>

<h3>Downloading safely: <code>git fetch</code></h3>
<pre><code class="language-bash"># Download new commits/branches from origin, update origin/* bookmarks:
git fetch origin
# or, with only one remote configured, simply:
git fetch

# See what changed before touching your own branch:
git log main..origin/main --oneline
git diff main origin/main</code></pre>
<p><code>git fetch</code> never modifies your working tree or your local branches — it only updates remote-tracking branches like <code>origin/main</code>. That makes it the tool for "let me see what's new" without any risk of a surprise merge or conflict. Get in the habit of fetching often.</p>

<h3>Downloading and integrating: <code>git pull</code></h3>
<pre><code class="language-bash"># fetch + merge (creates a merge commit if histories diverged):
git pull

# fetch + rebase — replays your local commits on top of the fetched
# ones instead, keeping history linear (no merge commit):
git pull --rebase

# Make --rebase the default for every git pull, everywhere on this machine:
git config --global pull.rebase true

# ...or only for the current repo:
git config pull.rebase true</code></pre>
<p>With plain <code>git pull</code>, if your local branch and the remote branch have both moved since you last synced, Git creates a merge commit joining the two histories. <code>git pull --rebase</code> avoids that merge commit by moving your local commits to sit on top of the newly-fetched ones instead — the trade-offs between the two integration strategies (and when each is appropriate) are the entire subject of the advanced <strong>Rebase vs Merge</strong> topic; this topic only needs you to know both exist as a flag on <code>pull</code>.</p>

<h3>Sharing your work: <code>git push</code></h3>
<pre><code class="language-bash"># Push the current branch to its already-configured upstream:
git push

# First push of a brand-new local branch — also sets the upstream
# tracking relationship, so future git push/git pull need no args:
git push -u origin &lt;branch&gt;
git push -u origin feature/login-form</code></pre>
<p><code>-u</code> (short for <code>--set-upstream</code>) only needs to be run once per branch. After that, Git remembers that this local branch tracks <code>origin/feature/login-form</code>, and plain <code>git push</code> / <code>git pull</code> on that branch will target it automatically.</p>

<h3>Seeing tracking relationships: <code>git branch -vv</code></h3>
<pre><code class="language-bash">git branch -vv
# * main               a1b2c3d [origin/main]              Add login form
#   feature/login-form f6e5d4c [origin/feature/login-form: ahead 2] WIP</code></pre>
<p>Each line shows: the local branch, its latest commit, the remote-tracking branch it's set up to follow in <code>[brackets]</code>, and — when they differ — how many commits ahead/behind it is. A branch with no <code>[brackets]</code> at all has no upstream configured yet (it's never been pushed with <code>-u</code>, or was created purely locally).</p>

<h3>The PR/MR workflow, end to end</h3>
<pre><code class="language-bash"># 1. Start from an up-to-date main, cut a new branch for the work:
git checkout main
git pull
git checkout -b feature/login-form

# 2. Do the work, commit as usual (see the Fundamentals topic):
git add .
git commit -m "Add login form validation"

# 3. Push the branch, setting upstream on first push:
git push -u origin feature/login-form

# 4. Open a pull/merge request on the host (GitHub/GitLab/etc.),
#    comparing feature/login-form against main.
#    Teammates review, CI runs (tests, lint, build).

# 5. Once approved, merge via the host's UI (merge commit, squash,
#    or rebase-merge, per team convention) — then clean up locally:
git checkout main
git pull
git branch -d feature/login-form</code></pre>
<p>This is the shape nearly every team's collaboration follows: isolate work on a branch, push it, request review, merge only after checks pass. Nobody commits straight to a shared <code>main</code>.</p>

<h3>Rejected push: integrate first, never force blindly</h3>
<pre><code class="language-bash"># Push rejected because the remote has commits you don't:
git push
# ! [rejected]  main -> main (fetch first)
# error: failed to push some refs ... Updates were rejected because
# the remote contains work that you do not have locally.

# Fix: fetch, then integrate (merge or rebase), THEN push again:
git fetch origin
git merge origin/main        # or: git rebase origin/main
git push

# Shortcut for fetch+merge (or fetch+rebase) in one step:
git pull                     # or: git pull --rebase</code></pre>
<p>A rejected, non-fast-forward push is Git protecting a teammate's commits from being silently discarded — it is never a sign that something is broken, only that the remote moved since you last synced. The safe response is always to fetch and integrate first. Reaching for <code>git push --force</code> instead overwrites the remote branch unconditionally, discarding whatever commits are there — a real way to destroy a teammate's work on a shared branch. If you ever do need to intentionally overwrite a remote branch (e.g. after rewriting history on your <em>own</em> feature branch that no one else has pulled), prefer <code>git push --force-with-lease</code>: it refuses to push if the remote branch has moved since your last fetch — i.e. if someone else pushed in the meantime — aborting instead of clobbering their work. The full detail on rewriting history safely is covered in the advanced <strong>Rebase vs Merge</strong> topic.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Worked Examples', html: `
<h3>Example 1 — Clone, branch, push, open a PR</h3>
<pre><code class="language-bash">git clone https://github.com/example/example-repo.git
cd example-repo
# origin already configured, pointing at that URL.

git checkout -b feature/add-search
# ... edit files ...
git add .
git commit -m "Add search bar to header"

git push -u origin feature/add-search
# Output includes a link: "Create a pull request for 'feature/add-search' on GitHub"

# Open that link (or use the host's UI) to open the PR against main.
# A teammate reviews, CI runs, and it gets merged once approved.</code></pre>
<p>Notice the branch never touches <code>main</code> directly — the PR, not the push, is what eventually updates <code>main</code>.</p>

<h3>Example 2 — Keep a long-running branch up to date</h3>
<pre><code class="language-bash"># You've been on feature/add-search for a few days; main has moved on.
git fetch origin
git log feature/add-search..origin/main --oneline
# Shows the commits that landed on main since you branched off.

# Bring those changes into your branch — rebase to keep history linear:
git rebase origin/main
# (resolve any conflicts if they come up, then git rebase --continue)

# Or, if your team prefers merge commits over rebasing:
git merge origin/main

# Either way, push the result:
git push
# If you rebased, the branch's history changed, so a plain push here will
# be rejected (see Example 3) — you'd push with --force-with-lease instead,
# since this is your own feature branch and no one else has pulled it.</code></pre>

<h3>Example 3 — Reconcile a rejected push, the safe way</h3>
<pre><code class="language-bash">git push
# ! [rejected]  main -> main (fetch first)
# error: failed to push some refs to '...'
# hint: Updates were rejected because the remote contains work that
# hint: you do not have locally.

# Don't force. Fetch and see what's actually there first:
git fetch origin
git log main..origin/main --oneline
# a colleague's commit(s) show up here — that's what was blocking you

# Integrate, resolving any conflicts if they arise:
git pull --rebase
# (equivalent to: git fetch origin && git rebase origin/main)

# Now the push is a fast-forward from the remote's point of view:
git push</code></pre>
<p>The rejection itself was the safety mechanism working correctly — it stopped a push that would have discarded a colleague's commit. Fetching first turns "mysterious rejection" into "oh, Priya pushed 20 minutes ago" — and integrating before pushing again is the only step that changes.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '⚠️ Edge Cases', html: `
<h3>Rejected push (the remote is ahead of you)</h3>
<p>Covered in depth in Mechanics/Examples above, but worth restating as the single most common remote-related surprise: a non-fast-forward rejection means the remote branch has commits your local branch doesn't have a record of yet. The fix is always <strong>fetch, then integrate (merge or rebase), then push again</strong> — never <code>git push --force</code> on a branch anyone else might have pushed to or pulled from. If you deliberately need to overwrite history you're sure is safe to overwrite (typically your own feature branch, after a local rebase), use <code>git push --force-with-lease</code> instead — it aborts if the remote moved since your last fetch, rather than clobbering unconditionally.</p>

<h3>"Detached <code>origin/HEAD</code>" / confusion about the remote's default branch</h3>
<p><code>origin/HEAD</code> is a bookmark for "whichever branch the remote considers its default" (usually <code>origin/main</code>) — it's what <code>git clone</code> uses to decide which branch to check out for you. Occasionally it points at the wrong branch (e.g. after a repo's default branch was renamed on the host, like the industry-wide <code>master</code> → <code>main</code> migrations), which can make commands like <code>git branch -r</code> or some GUI tools look like they're missing a branch, or default-diffing against the wrong one:</p>
<pre><code class="language-bash"># Re-sync your local idea of the remote's default branch:
git remote set-head origin -a</code></pre>
<p>This doesn't move any real commits around — it just corrects a local pointer to match what the remote actually considers its default branch right now.</p>

<h3>"I committed straight to <code>main</code> locally and now I want it on a branch instead"</h3>
<p>Easy to do by accident, especially right after a clone (you're on <code>main</code> by default). As long as you haven't pushed yet, this is a purely local, low-stakes fix — move the commit(s) onto a new branch and rewind <code>main</code> to match the remote:</p>
<pre><code class="language-bash"># Create a branch AT your current position (keeps the commits):
git branch feature/oops-was-on-main

# Move main back to where origin/main is — no work is lost, it now
# lives on the new branch instead:
git reset --hard origin/main

# Continue working on the branch you just created:
git checkout feature/oops-was-on-main</code></pre>
<p>This only rewinds your <em>local</em> <code>main</code> — nothing has been pushed, so there's nothing to reconcile with anyone else. (If you'd already pushed those commits straight to a shared <code>main</code>, that's a different, higher-stakes situation — covered in the Undoing &amp; Everyday Fixes topic.)</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">What's the difference between <code>git fetch</code> and <code>git pull</code>?</div>
<div class="qa-a">
<p><code>git fetch</code> only downloads: it retrieves new commits/branches from a remote and updates your local remote-tracking branches (like <code>origin/main</code>), without touching your working tree or your own branches — it's always safe to run. <code>git pull</code> is <code>fetch</code> immediately followed by integrating those changes into your current branch: a merge (creating a merge commit if histories diverged) by default, or a rebase with <code>git pull --rebase</code>. Because pull actually changes your current branch and working tree, it can produce conflicts; fetch never can.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What is <code>origin</code>?</div>
<div class="qa-a">
<p><code>origin</code> is just the conventional name Git gives the remote you cloned from — it's automatically created by <code>git clone</code> and points at the URL you cloned. It has no special meaning to Git beyond being a name-to-URL mapping; a repo can have additional remotes (e.g. <code>upstream</code> in a fork workflow), and you could rename or remove <code>origin</code> if you wanted to.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What is a remote-tracking branch, and how is it different from a local branch?</div>
<div class="qa-a">
<p>A remote-tracking branch (like <code>origin/main</code>) is a read-only local bookmark recording "where the remote's branch was, as of my last fetch/pull/push." Only network operations (fetch, pull, push) ever move it — your everyday <code>git commit</code> never does. A local branch (like <code>main</code>) is yours to commit on and moves forward every time you commit. There are effectively three copies of "main" in play: your local branch, your local remote-tracking bookmark for it, and the actual branch living on the remote server — fetch syncs the bookmark to the server, push syncs the server to your local branch (if it's a fast-forward), and merge/rebase syncs your local branch to the bookmark.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What does it mean for a local branch to have an "upstream," and how do you set one?</div>
<div class="qa-a">
<p>The upstream (or tracking branch) is the specific remote-tracking branch a local branch is linked to — it's what lets plain <code>git push</code>/<code>git pull</code> (no arguments) know which remote and branch to sync with, and lets <code>git status</code> report how many commits ahead/behind you are. It's set automatically on clone for the default branch, or explicitly via <code>git push -u origin &lt;branch&gt;</code> the first time you push a new branch. <code>git branch -vv</code> shows every local branch's upstream and ahead/behind counts at a glance.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">How does a pull request / merge request workflow work, end to end?</div>
<div class="qa-a">
<p>Create a branch off an up-to-date <code>main</code>, do the work and commit normally, then push the branch (<code>git push -u origin &lt;branch&gt;</code>) — this uploads it without touching <code>main</code>. On the host (GitHub/GitLab/etc.), open a pull/merge request comparing that branch against <code>main</code>; teammates review the diff and leave comments, and CI runs automated checks (tests, linting, build). Once it's approved and checks pass, the PR gets merged into <code>main</code> (as a merge commit, a squash, or a rebase-merge, per team convention), and the feature branch is typically deleted. This is the standard shape almost every team uses instead of committing directly to a shared branch, because it adds a review gate and an automated-check gate before anything lands.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">How do you safely update a branch that other people are also pushing to?</div>
<div class="qa-a">
<p>Fetch first to see what's changed (<code>git fetch</code>, then optionally inspect with <code>git log main..origin/main</code>), then integrate those changes into your local branch via merge or rebase (or just run <code>git pull</code> / <code>git pull --rebase</code>, which does fetch+integrate in one step), resolving any conflicts that come up. Only push after that integration succeeds. If your push is rejected as non-fast-forward, that's this exact situation — the fix is the same: fetch, integrate, then push again, never a blind <code>--force</code>.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Why should you avoid <code>git push --force</code>, and what's <code>--force-with-lease</code> for?</div>
<div class="qa-a">
<p><code>git push --force</code> unconditionally overwrites the remote branch to match your local one, discarding any commits on the remote that aren't in your history — including a teammate's work you may not even know exists, if they pushed between your last fetch and now. <code>git push --force-with-lease</code> is the safer version: it only proceeds if the remote branch still points where your local remote-tracking branch (<code>origin/&lt;branch&gt;</code>) last saw it, and aborts instead of overwriting if someone else has pushed in the meantime. It's still only appropriate on branches you're sure aren't being actively shared (typically your own feature branch after a local rebase) — never on a shared branch like <code>main</code>. The mechanics of rewriting history safely are covered in depth in the advanced Rebase vs Merge topic.</p>
</div>
</div>
`}

]});
