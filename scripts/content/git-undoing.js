window.PREP_SITE.registerTopic({
  id: 'git-undoing',
  module: 'git',
  title: 'Undoing & Everyday Fixes',
  estimatedReadTime: '20 min',
  tags: ['git', 'undo', 'reset', 'revert', 'restore', 'amend', 'stash', 'fixes'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>Everyone breaks something in Git — that's not a problem, it's the normal cost of moving fast. What matters is knowing which <strong>undo tool</strong> fits which mistake. This topic covers the everyday toolbox: <code>restore</code>, <code>reset</code>, <code>revert</code>, <code>amend</code>, and <code>stash</code>.</p>
<ul>
  <li><strong><code>git restore &lt;file&gt;</code></strong> — throw away uncommitted edits to a file, going back to the last staged/committed version. <strong><code>git restore --staged &lt;file&gt;</code></strong> — unstage a file without losing the edit itself.</li>
  <li><strong><code>git reset</code></strong> — moves your branch's <code>HEAD</code> pointer, optionally taking the staging area and/or working tree with it. Three flavors — <code>--soft</code>, <code>--mixed</code> (the default), <code>--hard</code> — and the difference between them is the single most commonly tested Git question there is. Full table in Mental Model below.</li>
  <li><strong><code>git revert &lt;commit&gt;</code></strong> — undoes a commit's changes by creating a <em>brand-new</em> commit with the inverse diff. History isn't rewritten, so this is the <strong>only</strong> safe way to undo a commit that's already been pushed and shared.</li>
  <li><strong><code>git commit --amend</code></strong> — replaces your most recent commit with a new one (different message and/or different staged content). It's a rewrite, so — like <code>reset</code> — don't do it to a commit you've already pushed and others may have pulled.</li>
  <li><strong><code>git stash</code></strong> — shelves your uncommitted changes (staged and unstaged) so your working tree is clean, without committing anything, so you can switch tasks and bring them back later with <code>stash pop</code>.</li>
</ul>
<p><strong>The one split that matters most:</strong> <code>reset</code> and <code>amend</code> <em>rewrite local history</em> (safe only before you've pushed); <code>revert</code> <em>adds new history</em> (always safe, even on shared/pushed branches). When in doubt about a commit someone else might have, revert, don't reset.</p>
<p>This topic is about fixing mistakes you can still see — uncommitted edits, the last commit, a bad commit still in your log. If you've already lost a commit entirely (e.g. after a bad <code>reset --hard</code>) and need to dig it back out, that's a different, deeper toolkit — see <a href="#/topic/git-recovery">Recovery (reflog)</a>.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why "undo" isn't just one command</h3>
<p>In most editors, "undo" is a single button that steps backwards through a linear list of edits. Git can't offer that, because Git tracks three distinct areas at once (working tree, staging area, repository — see the Fundamentals topic), and a "mistake" can live in any one of them, or several simultaneously: an edit you haven't staged yet, something you staged but shouldn't have, an entire commit you already sealed, or even a commit you already pushed to a shared remote. Each of those needs a different fix, which is why Git gives you a small family of undo commands instead of one universal "undo."</p>
<p>The practical skill isn't memorizing every flag — it's correctly diagnosing <em>where</em> the mistake currently lives, so you reach for the tool that matches it instead of a bigger, more destructive hammer than the job needs.</p>

<h3>The split that decides everything: rewrite vs. add</h3>
<p>Once you look past the individual commands, undoing in Git falls into exactly two strategies:</p>
<ul>
  <li><strong>Rewriting existing history.</strong> <code>git reset</code> moves your branch pointer to a different commit (optionally dragging the staging area and working tree along with it). <code>git commit --amend</code> replaces the last commit with a new one entirely. Both make it as if the "undone" commit(s) never happened — the old commit(s) become unreachable from your branch. That's exactly what you want for mistakes only <em>you've</em> seen: a commit still sitting locally, not yet pushed.</li>
  <li><strong>Adding new history that cancels old history.</strong> <code>git revert</code> doesn't touch the past at all — it reads what a commit changed and creates a brand-new commit that applies the opposite change. The bad commit is still right there in the log (which is useful — it's an honest, visible record that something was tried and undone), but its effect is cancelled out going forward.</li>
</ul>
<p>Why does this split matter so much? Because once you've <code>git push</code>ed a commit, other people may have already fetched it, built on top of it, or based their own work on it. <strong>Rewriting history that other people already have creates a mismatch</strong> between your rewritten branch and their copy of the old one — the next time they try to pull or push, Git will complain, and reconciling the two histories is a genuinely painful, error-prone exercise (usually a forced push, which can silently discard a teammate's commits if done carelessly). Adding a revert commit has none of that risk: it's just a normal new commit that anyone can pull like any other.</p>
<p><strong>The rule of thumb this topic keeps coming back to:</strong> reset/amend for local, not-yet-shared mistakes; revert for anything already pushed or possibly seen by someone else. If you're not sure which situation you're in, treat it as shared and revert — the downside of an "unnecessary" revert commit is trivial compared to the downside of rewriting a branch out from under a teammate.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>Map every undo tool back to the three areas</h3>
<p>Recall the three areas from the Fundamentals topic: <strong>working tree</strong> (files on disk) → <strong>staging area</strong> (what the next commit will contain) → <strong>repository</strong> (sealed commit history). Every undo command in this topic is defined by exactly which of those three areas it touches:</p>
<ul>
  <li><code>git restore &lt;file&gt;</code> — touches the <strong>working tree</strong> only. Overwrites the file on disk with the staged (or last-committed, if nothing's staged) version.</li>
  <li><code>git restore --staged &lt;file&gt;</code> — touches the <strong>staging area</strong> only. Un-stages the file, copying it back out of the index from <code>HEAD</code>, but leaves your working-tree edit exactly as it was.</li>
  <li><code>git reset</code> — touches the repository's <code>HEAD</code> pointer always, and <em>optionally</em> the staging area and working tree too, depending on which flag you pass. This is the one command whose blast radius genuinely changes shape, so it gets its own table below.</li>
  <li><code>git revert</code> — touches only the repository, by <em>adding</em> a new commit. Never rewrites, never touches your working tree or staging area (beyond the normal "a new commit changed these files" effect) — <strong>unless the inverse patch doesn't apply cleanly</strong>, in which case, like <code>cherry-pick</code>, it can produce a merge conflict and leaves a conflicted, uncommitted working tree until you resolve it and run <code>git revert --continue</code> (or <code>git revert --abort</code>).</li>
  <li><code>git commit --amend</code> — touches the repository, replacing <code>HEAD</code> with a new commit built from the old one plus whatever's currently staged.</li>
  <li><code>git stash</code> — touches the working tree and staging area, temporarily moving both to a side storage area (a "stash"), independent of the commit history, so both come back clean.</li>
</ul>

<h3>The <code>git reset</code> table — memorize this exactly</h3>
<p><code>git reset [--soft | --mixed | --hard] [&lt;commit&gt;]</code> always moves the branch's <code>HEAD</code> pointer to <code>&lt;commit&gt;</code> (default target is <code>HEAD</code> itself if you omit it — usually you'll pass something like <code>HEAD~1</code> or a specific SHA). What differs between the three modes is how far the reset "reaches" past <code>HEAD</code>:</p>
<table>
<thead>
<tr><th>Mode</th><th><code>HEAD</code></th><th>Staging area (index)</th><th>Working tree</th><th>Net effect</th></tr>
</thead>
<tbody>
<tr>
<td><code>--soft</code></td>
<td>Moves</td>
<td>Untouched</td>
<td>Untouched</td>
<td>The commit(s) between the old and new <code>HEAD</code> vanish from history, but everything they changed shows up as <strong>staged</strong>, ready to re-commit (e.g. squash 3 commits into 1, or fix the message).</td>
</tr>
<tr>
<td><code>--mixed</code> <em>(default)</em></td>
<td>Moves</td>
<td>Reset to match new <code>HEAD</code></td>
<td>Untouched</td>
<td>The commit(s) vanish from history and are <strong>unstaged</strong> — the changes are still sitting in your working tree as ordinary edits, but nothing is staged. This is what plain <code>git reset</code> (no flags) does.</td>
</tr>
<tr>
<td><code>--hard</code></td>
<td>Moves</td>
<td>Reset to match new <code>HEAD</code></td>
<td>Reset to match new <code>HEAD</code></td>
<td>The commit(s), the staged changes, <em>and</em> the working-tree edits are all <strong>discarded</strong>. Whatever wasn't committed or stashed is gone. The single most dangerous everyday Git command.</td>
</tr>
</tbody>
</table>
<p>One memorable way to hold this table in your head: each mode reaches one step further than the last. <code>--soft</code> only moves the pointer. <code>--mixed</code> also updates the index to match. <code>--hard</code> also overwrites your actual files. If <code>--hard</code> ever surprises you by deleting work you needed, don't panic before checking <a href="#/topic/git-recovery">Recovery (reflog)</a> — the commit itself is very often still recoverable for a while, even though it's no longer reachable from any branch.</p>

<h3><code>reset</code> vs. <code>revert</code>, side by side</h3>
<table>
<thead>
<tr><th></th><th><code>git reset</code></th><th><code>git revert</code></th></tr>
</thead>
<tbody>
<tr><td>What it does</td><td>Moves the branch pointer backwards (or elsewhere)</td><td>Creates a new commit with the inverse changes</td></tr>
<tr><td>History</td><td>Rewritten — old commits become unreachable</td><td>Untouched — old commit stays in the log, forever visible</td></tr>
<tr><td>Safe after pushing?</td><td>No — rewrites shared history</td><td>Yes — this is exactly what it's designed for</td></tr>
<tr><td>Typical use</td><td>Cleaning up commits only you have seen, locally</td><td>Undoing a commit that's on a shared branch (or you're just not sure)</td></tr>
</tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Discarding or unstaging with <code>git restore</code></h3>
<pre><code class="language-bash"># Discard uncommitted working-tree edits to a file — back to the last staged
# version (or last commit, if nothing's staged):
git restore &lt;file&gt;
git restore src/app.js

# Unstage a file — keep the edit, just take it back out of the staging area:
git restore --staged &lt;file&gt;
git restore --staged src/app.js

# Both at once — fully reset a file to how HEAD has it, discarding
# both staged and unstaged changes:
git restore --staged --worktree &lt;file&gt;</code></pre>
<p><code>git restore</code> is the modern, purpose-built command for these two everyday moves (added in Git 2.23 to split apart what used to be overloaded onto <code>git checkout</code>). You'll still see the older forms constantly in existing docs, tutorials, and muscle memory — they do the same jobs:</p>
<pre><code class="language-bash"># Older equivalent of "git restore &lt;file&gt;" (discard working-tree changes):
git checkout -- &lt;file&gt;
git checkout -- src/app.js

# Older equivalent of "git restore --staged &lt;file&gt;" (unstage):
git reset HEAD &lt;file&gt;
git reset HEAD src/app.js</code></pre>
<p>Both pairs are functionally equivalent — <code>restore</code> is just clearer about intent (no risk of confusing it with the branch-switching <code>git checkout &lt;branch&gt;</code>, or the commit-rewinding <code>git reset &lt;commit&gt;</code> — same command names, very different behavior depending on what you hand them).</p>

<h3>Rewinding commits with <code>git reset</code></h3>
<pre><code class="language-bash">git reset --soft [&lt;commit&gt;]
git reset --mixed [&lt;commit&gt;]   # or just: git reset [&lt;commit&gt;] — --mixed is the default
git reset --hard [&lt;commit&gt;]

# Most common form — target the commit N steps back from HEAD:
git reset --soft HEAD~1     # undo last commit, keep changes staged
git reset --mixed HEAD~1    # undo last commit, keep changes unstaged
git reset --hard HEAD~1     # undo last commit, discard the changes entirely</code></pre>
<p>See the reset table in Mental Model above for exactly what each mode does to <code>HEAD</code>, the staging area, and the working tree. In practice, <code>--soft</code> and <code>--mixed</code> are common and low-risk (nothing is lost, just rearranged); <code>--hard</code> is the one to pause before running — always double-check <code>git status</code> and <code>git diff</code> first, since anything uncommitted at that point is gone the moment you hit enter.</p>

<h3>Undoing a commit safely with <code>git revert</code></h3>
<pre><code class="language-bash"># Create a new commit that undoes the changes from &lt;commit&gt;:
git revert &lt;commit&gt;
git revert a1b2c3d

# Revert without immediately opening a commit-message editor:
git revert --no-edit &lt;commit&gt;

# Revert the most recent commit:
git revert HEAD</code></pre>
<p><code>git revert</code> looks at the diff a commit introduced and applies the exact opposite of that diff as a new commit on top of your current history. Nothing is deleted or rewritten — the original (now-reverted) commit is still sitting in the log, and anyone who already pulled it is unaffected; they'll simply pull your new revert commit next, same as any other commit.</p>
<p><strong>Caveat:</strong> applying that inverse patch is still a patch application, so — just like <code>cherry-pick</code> — it can produce merge conflicts if the patch doesn't apply cleanly (e.g. the surrounding lines have since changed). When that happens, <code>revert</code> pauses mid-operation with a conflicted, uncommitted working tree: resolve the conflicts, stage the result, then run <code>git revert --continue</code> to finish (or <code>git revert --abort</code> to bail out entirely).</p>

<h3>Fixing the last commit with <code>git commit --amend</code></h3>
<pre><code class="language-bash"># Fix just the message of the last commit:
git commit --amend -m "Corrected commit message"

# Add a forgotten file / more changes to the last commit
# (stage them first, same as normal):
git add &lt;file&gt;
git commit --amend --no-edit</code></pre>
<p><code>--amend</code> doesn't edit the existing commit in place — it builds a brand-new commit (new SHA) from the old commit's parent, plus whatever is currently staged, and moves <code>HEAD</code> to point at it. The old commit becomes unreachable, exactly like a small, single-commit <code>reset</code>. That means the same rule applies: fine to amend a commit only you've seen; don't amend one you've already pushed and someone else might have pulled.</p>

<h3>Shelving work with <code>git stash</code></h3>
<pre><code class="language-bash"># Shelve all staged + unstaged changes, leaving a clean working tree:
git stash

# Same, with a descriptive label (helpful once you have more than one stash):
git stash push -m "WIP: half-done search filter"

# See what's stashed:
git stash list
# Output: stash@{0}: On main: WIP: half-done search filter
#         stash@{1}: WIP on main: f6e5d4c Add initial app.js

# Bring the most recent stash back AND remove it from the stash list:
git stash pop

# Bring it back but KEEP it in the stash list too (useful to apply to multiple branches):
git stash apply

# Bring back a specific, older stash by its index:
git stash pop stash@{1}</code></pre>
<p>Stashing doesn't create a commit — it's a separate, temporary storage area outside your normal history. It exists specifically for "I need a clean working tree <em>right now</em> to switch tasks (check out another branch, pull a hotfix, etc.), but I'm not ready to commit what I have." <code>pop</code> is what you'll reach for almost always; <code>apply</code> is the rarer case where you deliberately want the same stashed changes applied more than once.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Worked Examples', html: `
<h3>Example 1 — Unstage a file you added by mistake</h3>
<pre><code class="language-bash"># You meant to stage only app.js, but fat-fingered "git add ." and
# also staged a local config file you don't want to commit:
git status
# Output: Changes to be committed: app.js, local.config.js

git restore --staged local.config.js
git status
# Output: local.config.js is now back to "not staged" — app.js still staged.

git commit -m "Add search feature"</code></pre>
<p><code>local.config.js</code>'s edits are untouched on disk — only its staged-ness was undone. Nothing was lost.</p>

<h3>Example 2 — Discard a bad edit and undo the last commit, keeping the changes</h3>
<pre><code class="language-bash"># You've been experimenting in a file and it's now a mess you don't want at all:
git restore src/experiment.js
# File is back to its last committed/staged state — the messy edit is gone.

# Separately: you just committed, but realize it should've been two commits
# (or you want to reword it entirely). Undo the commit but keep the content staged:
git reset --soft HEAD~1
git status
# Output: Changes to be committed: (everything that was in that commit)

# Now split it into cleaner commits, or just recommit with a better message:
git commit -m "Add validation logic (was bundled wrong before)"</code></pre>

<h3>Example 3 — Safely undo a commit that's already been pushed</h3>
<pre><code class="language-bash"># You pushed a commit that broke something, and a teammate may have already pulled it.
# Resetting is off the table — revert instead:
git log --oneline -3
# a1b2c3d (HEAD -> main, origin/main) Add broken cache logic
# f6e5d4c Add search feature
# 9d8e7f6 Add README

git revert a1b2c3d
# Opens an editor with a default message like "Revert 'Add broken cache logic'"
# Creates a NEW commit that undoes a1b2c3d's changes.

git push
# Teammates just pull the new revert commit normally — no history conflict.</code></pre>

<h3>Example 4 — Amend a commit message, and stash to switch tasks urgently</h3>
<pre><code class="language-bash"># Typo in your last (not-yet-pushed) commit message:
git commit --amend -m "Fix off-by-one error in pagination"

# Mid-way through unrelated work, an urgent bug needs fixing on another branch:
git status
# Output: modified: src/list.js, src/utils.js (both unstaged, half-done)

git stash push -m "WIP: pagination refactor"
git status
# Output: working tree clean

git checkout main
# ...fix the urgent bug, commit, push...

git checkout feature/pagination
git stash pop
# Output: src/list.js and src/utils.js are back exactly as you left them.</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '⚠️ Edge Cases', html: `
<h3>"I ran <code>reset --hard</code> and lost work I actually needed"</h3>
<p><code>reset --hard</code> discards uncommitted staged and working-tree changes with no built-in undo for <em>those</em> — that part really is gone if it was never committed or stashed. But if what you lost was a <strong>commit</strong> (e.g. you reset past a commit you actually wanted), don't assume it's gone: Git generally keeps unreachable commits around for a while before actual garbage collection, and <code>git reflog</code> records where <code>HEAD</code> has been, including right before the reset. That full recovery workflow is its own topic — see <a href="#/topic/git-recovery">Recovery (reflog)</a> — but the short version is: stop making more changes, and check the reflog before assuming anything is permanently lost.</p>

<h3>Amending or resetting a commit you've already pushed</h3>
<p>Both <code>git commit --amend</code> and <code>git reset</code> (to an earlier commit) work by making your branch point at different commits than before — from a shared remote's perspective, that's rewriting history. If you've already pushed the commit(s) being rewritten, and there's any chance a teammate has fetched or pulled them, doing this creates a diverging history: your next <code>git push</code> will be rejected (non-fast-forward), and forcing it through (<code>git push --force</code>) can silently discard commits your teammate made on top of the version you're overwriting.</p>
<p>If the commit is already shared, reach for <code>git revert</code> instead — it adds a new commit rather than replacing an old one, so there's nothing to force-push and nothing for anyone else's copy to conflict with.</p>

<h3>Stash conflicts on <code>pop</code></h3>
<p>If your working tree has changed since you stashed (e.g. you pulled new commits, or edited the same lines the stash touches), <code>git stash pop</code> can produce merge conflicts, just like a merge. Git will mark the conflicting sections in the affected files — resolve them the same way you would any merge conflict, then stage the resolved files. One important gotcha: if a conflict occurs, Git does <em>not</em> automatically drop the stash afterward (unlike a clean pop) — it leaves the stash entry in place until you confirm the conflict is resolved and manually run <code>git stash drop</code>, so you don't lose the stashed work if the pop goes wrong.</p>

<h3>Amending doesn't just change the message — it's a new commit entirely</h3>
<p>A common misconception is that <code>--amend</code> edits a commit "in place." It doesn't — Git has no way to mutate an existing, sealed commit (that's what makes the SHA a reliable content hash). <code>--amend</code> creates a genuinely new commit object and points <code>HEAD</code> at it; the old commit still exists in the object database until garbage collected, just no longer reachable from any branch. This is why the same "don't do it after pushing" caution applies to <code>--amend</code> as to <code>reset</code>.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">What's the difference between <code>git reset --soft</code>, <code>--mixed</code>, and <code>--hard</code>?</div>
<div class="qa-a">
<p>All three move <code>HEAD</code> to the target commit; they differ in how far that reach extends. <code>--soft</code> moves only <code>HEAD</code> — the staging area and working tree are untouched, so whatever the undone commit(s) changed shows up as staged, ready to re-commit. <code>--mixed</code> (the default) also resets the staging area to match the new <code>HEAD</code>, so those changes end up unstaged in the working tree instead. <code>--hard</code> additionally overwrites the working tree itself, so the changes are discarded entirely — nothing staged, nothing modified on disk. <code>--hard</code> is the only one of the three that can destroy uncommitted work.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q"><code>git reset</code> vs. <code>git revert</code> — when do you use which?</div>
<div class="qa-a">
<p><code>reset</code> moves the branch pointer, which rewrites history — the "undone" commits become unreachable. That's safe when the commits are still purely local and nobody else could have them. <code>revert</code> creates a brand-new commit containing the inverse of a target commit's changes — history isn't rewritten, the original commit stays visible in the log. Because it adds rather than rewrites, <code>revert</code> is the only safe option once a commit has been pushed and possibly pulled by someone else. Rule of thumb: local and unpushed → reset is fine; already shared, or unsure → revert.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">How do you undo a commit that's already been pushed to a shared branch?</div>
<div class="qa-a">
<p><code>git revert &lt;commit&gt;</code>, then push the resulting revert commit normally. You specifically avoid <code>git reset</code> here, because resetting a pushed branch rewrites history your teammates may have already pulled — their next pull/push would diverge, and force-pushing to fix it risks silently dropping their commits. Revert sidesteps all of that by simply adding a new, ordinary commit that cancels the old one's effect.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">How do you fix a mistake in your last commit — wrong message, or a forgotten file?</div>
<div class="qa-a">
<p><code>git commit --amend</code>. For just the message: <code>git commit --amend -m "new message"</code>. For a forgotten file or change: stage it first with <code>git add</code>, then run <code>git commit --amend --no-edit</code> to fold it into the previous commit without touching the message. Under the hood this creates a new commit (new SHA) and points <code>HEAD</code> at it — the old commit becomes unreachable — so, same as <code>reset</code>, only amend commits you haven't pushed yet.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What does <code>git restore</code> do, and how does it relate to <code>git checkout -- &lt;file&gt;</code> / <code>git reset HEAD &lt;file&gt;</code>?</div>
<div class="qa-a">
<p><code>git restore &lt;file&gt;</code> discards uncommitted changes in the working tree, restoring the file from the staging area (or <code>HEAD</code>, if nothing's staged) — the modern equivalent of the older <code>git checkout -- &lt;file&gt;</code>. <code>git restore --staged &lt;file&gt;</code> unstages a file, copying it back from <code>HEAD</code> into the index while leaving the working-tree edit untouched — equivalent to the older <code>git reset HEAD &lt;file&gt;</code>. It was introduced to split those two distinct jobs out of the overloaded <code>git checkout</code>/<code>git reset</code> commands, which were also (confusingly) used for switching branches and rewinding commits.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between <code>git stash</code> and just committing your work-in-progress?</div>
<div class="qa-a">
<p>A stash isn't a commit — it's a separate shelf outside your normal history, meant for "I need my working tree clean right now, but I'm not ready to commit this." <code>git stash</code> pulls both staged and unstaged changes off the working tree and index; <code>git stash pop</code> reapplies the most recent one (and removes it from the stash list), while <code>git stash apply</code> reapplies it but keeps it in the list too, for applying to more than one branch. <code>git stash list</code> shows everything currently shelved. If a pop conflicts with changes made since the stash, Git leaves the stash entry in place until you resolve the conflict and explicitly <code>git stash drop</code> it.</p>
</div>
</div>
`}

]});
