window.PREP_SITE.registerTopic({
  id: 'git-recovery',
  module: 'git',
  title: 'Recovery (reflog etc.)',
  estimatedReadTime: '40 min',
  tags: ['git', 'reflog', 'recovery', 'lost-commits', 'reset', 'revert', 'gc', 'fsck'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>Git is mostly forgiving — almost any "I lost my work" panic has a recovery path, if you act quickly. The reflog is your safety net for local operations; <code>git fsck</code> finds dangling objects; revert + reset address shared-history changes. Senior engineers know the recovery toolkit cold, because the cost of <em>not</em> knowing is hours of redoing work or losing it forever.</p>
<ul>
  <li><strong>Reflog records every move of HEAD</strong> in your local repo. Lost a commit via reset / rebase / branch-delete? Reflog has it for ~90 days by default.</li>
  <li><strong>Most "destroyed" commits aren't gone</strong> — they're orphaned. Garbage collection eventually removes them; until then, they're recoverable.</li>
  <li><strong>Recovery patterns:</strong> <code>git reset --hard &lt;sha&gt;</code> to return to a state; <code>git cherry-pick</code> to extract a lost commit; <code>git checkout &lt;sha&gt; -- &lt;file&gt;</code> for file-level recovery.</li>
  <li><strong>For shared-history mistakes</strong> (force-pushed bad code, merged wrong branch): <code>git revert</code> creates an undoing commit. Don't try to rewrite shared history.</li>
  <li><strong>For lost work:</strong> reflog + cherry-pick. For lost branches: reflog + branch creation. For lost stashes: <code>git fsck --lost-found</code>.</li>
  <li><strong>The "I committed to wrong branch"</strong> recovery: cherry-pick to right branch, reset wrong branch.</li>
  <li><strong>The "I leaked a secret"</strong> recovery: rotate secret first, then scrub history with <code>git filter-repo</code> (in coordination with team).</li>
  <li><strong>Mobile / RN context:</strong> long builds make recovery especially valuable — losing 2 hours of work plus rebuild time hurts. Build the recovery muscle memory.</li>
</ul>
<p><strong>Mantra:</strong> "Don't panic. Reflog is your friend. Most things are recoverable for ~90 days. Reset for local; revert for shared. Push critical work somewhere remote for true safety."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>The Git "object permanence" mental model</h3>
<p>When you commit in Git, the commit object is stored in <code>.git/objects/</code> with a unique SHA-1 (or SHA-256). Once stored, the object is unchanged — content-addressable. Even when no branch / tag references it, the object remains until garbage collection.</p>
<p>This is the foundation of Git's recovery story: <em>most "destroyed" things are merely unreferenced</em>. They sit in the object database, unreachable through normal commands but recoverable via reflog or fsck.</p>

<h3>What can be recovered</h3>
<table>
  <thead><tr><th>Loss type</th><th>Recoverable?</th><th>Tool</th></tr></thead>
  <tbody>
    <tr><td>Commits "lost" via reset --hard</td><td>Yes (until GC)</td><td>reflog + reset</td></tr>
    <tr><td>Commits "lost" via rebase</td><td>Yes (until GC)</td><td>reflog + branch / cherry-pick</td></tr>
    <tr><td>Commits "lost" via amend</td><td>Yes (until GC)</td><td>reflog</td></tr>
    <tr><td>Branch deleted (with commits not on other branches)</td><td>Yes (until GC)</td><td>reflog + branch creation</td></tr>
    <tr><td>Stash dropped accidentally</td><td>Yes (until GC)</td><td>fsck --lost-found</td></tr>
    <tr><td>Force-pushed; remote overwrote local</td><td>Maybe</td><td>If you have local reflog; otherwise lost</td></tr>
    <tr><td>Uncommitted working tree changes lost via reset --hard</td><td>NO</td><td>Not recoverable; back up working tree</td></tr>
    <tr><td>Uncommitted changes lost via checkout overwriting</td><td>NO</td><td>Same; not recoverable</td></tr>
    <tr><td>Files in working tree deleted by OS / rm</td><td>If untracked: NO; if tracked + committed: yes</td><td>Various</td></tr>
  </tbody>
</table>
<p>The pattern: <strong>committed work is almost always recoverable</strong>; <strong>uncommitted work in working tree is fragile</strong>. The first habit is to commit (or stash) frequently — even WIP commits.</p>

<h3>What the reflog records</h3>
<p>Every operation that moves HEAD is logged in <code>.git/logs/HEAD</code> (the reflog):</p>
<table>
  <thead><tr><th>Operation</th><th>Reflog entry</th></tr></thead>
  <tbody>
    <tr><td>commit</td><td>"commit: &lt;message&gt;"</td></tr>
    <tr><td>checkout</td><td>"checkout: moving from X to Y"</td></tr>
    <tr><td>reset</td><td>"reset: moving to &lt;target&gt;"</td></tr>
    <tr><td>rebase</td><td>"rebase: ..." multiple entries per step</td></tr>
    <tr><td>merge</td><td>"merge &lt;branch&gt;: ..."</td></tr>
    <tr><td>pull</td><td>"pull: ..."</td></tr>
    <tr><td>amend</td><td>"commit (amend): &lt;message&gt;"</td></tr>
    <tr><td>cherry-pick</td><td>"cherry-pick: ..."</td></tr>
  </tbody>
</table>

<p>Each branch also has its own reflog at <code>.git/logs/refs/heads/&lt;branch&gt;</code>.</p>

<h3>Why it's local-only</h3>
<p>The reflog is per-repository. Pushing doesn't share reflogs. Cloning doesn't bring reflogs. This means:</p>
<ul>
  <li>Recovery only works on the machine where the operation happened.</li>
  <li>If you want true safety, push to remote (even a personal backup branch).</li>
  <li>Disk failure = reflog gone.</li>
</ul>

<h3>The garbage collection clock</h3>
<p>Git runs <code>git gc</code> periodically (auto-triggered after many operations). GC removes orphaned objects:</p>
<ul>
  <li>Default <code>gc.reflogExpire = 90 days</code> for reachable refs.</li>
  <li>Default <code>gc.reflogExpireUnreachable = 30 days</code> for unreachable.</li>
  <li>After expiry, objects are pruned.</li>
</ul>
<p>For most recovery: act within days, not months. For long-lost commits: maybe still there; check fast.</p>

<h3>The "shared history" recovery rule</h3>
<p>For local recovery (your machine, your unpushed work), reflog + reset are the tools. For shared history (commits already pushed and pulled by others), the rule changes:</p>
<ul>
  <li>You cannot rewrite shared history without breaking everyone.</li>
  <li>Recovery for shared mistakes = a new commit that undoes the bad one (<code>git revert</code>).</li>
  <li>"I want to make this never happened" is impossible for shared commits; only "make a new commit that fixes it" is realistic.</li>
</ul>

<h3>The mobile / RN angle</h3>
<p>Long mobile builds make Git mistakes more painful:</p>
<ul>
  <li>Lost 2 hours of work + 5 min build per attempt to re-create = hours of dread.</li>
  <li>Worktree state, simulator state, dep state all entangle with Git state.</li>
  <li>"I'll just rebuild from scratch" is much more expensive in mobile.</li>
</ul>
<p>Senior mobile engineers tend to:</p>
<ul>
  <li>Commit early and often (even WIP).</li>
  <li>Push to remote on personal backup branches before risky operations.</li>
  <li>Tag good states before rebases.</li>
  <li>Know reflog cold so 30-second recovery is reflexive.</li>
</ul>

<h3>The "panic stop" first move</h3>
<p>When something goes wrong:</p>
<ol>
  <li><strong>Stop.</strong> Don't make more changes. Each new operation can complicate recovery.</li>
  <li><strong>Don't run any commands you're unsure about.</strong> Especially destructive ones.</li>
  <li><strong>Identify the loss:</strong> Was it committed? Branched? Stashed? Working tree only?</li>
  <li><strong>Plan recovery</strong> using the right tool (below).</li>
  <li><strong>Act methodically.</strong> Test each step. Verify before proceeding.</li>
</ol>
<p>Most disasters are recoverable when handled calmly. The damage is usually done by panicked subsequent commands.</p>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The "where could this be?" framework</h3>
<p>When you can't find your work, ask: where could it possibly be?</p>
<table>
  <thead><tr><th>Possible location</th><th>How to look</th></tr></thead>
  <tbody>
    <tr><td>A branch you're not on</td><td><code>git branch --all</code>; <code>git log --oneline --all --grep="search"</code></td></tr>
    <tr><td>Reflog (orphaned commits)</td><td><code>git reflog</code> + <code>git log -g --grep="search"</code></td></tr>
    <tr><td>A stash</td><td><code>git stash list</code></td></tr>
    <tr><td>Remote branch you forgot about</td><td><code>git fetch --all</code>; <code>git branch -r</code></td></tr>
    <tr><td>Object store but no ref (orphaned by GC)</td><td><code>git fsck --lost-found</code></td></tr>
    <tr><td>Working tree on disk (uncommitted)</td><td>Just open the files</td></tr>
    <tr><td>Another worktree</td><td><code>git worktree list</code></td></tr>
    <tr><td>Lost forever (uncommitted, overwritten)</td><td>Can't recover from Git; check IDE local history / time machine / drive backups</td></tr>
  </tbody>
</table>

<h3>The "before / after" mental model</h3>
<p>Every Git operation moves your repo from state A to state B. Reflog records the transitions. To recover, find the state A and reset back to it.</p>
<pre><code>State A: HEAD at sha1
   ↓ (some operation, e.g., reset --hard sha-other)
State B: HEAD at sha2
   ↓ (oh no, I want sha1 back)
State C: HEAD at sha1 (after recovery)

git reflog:
HEAD@{0} sha2  → reset
HEAD@{1} sha1  → commit (or whatever was last)

git reset --hard HEAD@{1}    # goes back to A</code></pre>

<h3>The "ref vs. commit" distinction</h3>
<p>Two concepts often confused:</p>
<ul>
  <li><strong>Refs</strong> (branches, tags, HEAD) are pointers to commits.</li>
  <li><strong>Commits</strong> are the actual data.</li>
</ul>
<p>Deleting a ref doesn't delete commits. The commits remain (orphaned) in the object store. Recovery = creating a new ref that points to the orphan.</p>
<pre><code># Delete a branch:
git branch -D feature
# Branch ref is gone; commits are still there.

# Recover:
git reflog | grep feature
# Find the last commit on the branch:
# abc1234 HEAD@{42}: checkout: moving from feature to main

git branch feature abc1234
# Branch ref re-created, pointing to old commit.</code></pre>

<h3>The "what was HEAD doing?" model</h3>
<p>Reflog shows where HEAD has been. If you're recovering for a specific branch, look at the branch's reflog instead:</p>
<pre><code>git reflog HEAD              # HEAD's history (default git reflog)
git reflog feature           # feature branch's history

# Branch reflog shows ONLY moves of that branch's tip
# More targeted than HEAD's reflog</code></pre>

<h3>The "destructive vs. non-destructive" frame</h3>
<table>
  <thead><tr><th>Destructive (need recovery)</th><th>Non-destructive</th></tr></thead>
  <tbody>
    <tr><td><code>git reset --hard</code></td><td><code>git reset --soft / --mixed</code></td></tr>
    <tr><td><code>git checkout &lt;file&gt;</code> (overwrites uncommitted)</td><td><code>git checkout &lt;branch&gt;</code> (with clean state)</td></tr>
    <tr><td><code>git branch -D</code></td><td><code>git branch -d</code> (refuses if unmerged)</td></tr>
    <tr><td><code>git push --force</code></td><td><code>git push --force-with-lease</code> (still risky but safer)</td></tr>
    <tr><td><code>git rebase</code> (rewrites)</td><td><code>git merge</code> (creates new commit)</td></tr>
    <tr><td><code>git stash drop</code></td><td><code>git stash apply</code> (keeps stash)</td></tr>
    <tr><td><code>git clean -fdx</code></td><td>(no clean equivalent; always destructive)</td></tr>
  </tbody>
</table>

<h3>The "personal backup branch" pattern</h3>
<p>Before any risky operation, a senior move:</p>
<pre><code>git branch backup/$(date +%Y%m%d-%H%M%S)
# OR push to remote:
git push origin HEAD:backup/$(date +%Y%m%d-%H%M%S)

# Now do risky thing: rebase, filter-branch, etc.
# If it goes wrong:
git reset --hard backup/&lt;date&gt;</code></pre>
<p>Cheap insurance. The reflog covers most cases, but for true safety push to remote — survives disk failure, machine theft, OS reinstall.</p>

<h3>The "act fast" principle</h3>
<p>Recovery is time-bounded. Garbage collection eventually prunes orphans:</p>
<ul>
  <li>Default 30 days for unreachable.</li>
  <li>Auto-gc triggers periodically.</li>
  <li>Manual <code>git gc</code> can be aggressive.</li>
</ul>
<p>If you've lost something: recover in minutes / hours, not weeks. The longer you wait, the more likely auto-gc has cleaned up.</p>

<h3>The "communicate the recovery" principle</h3>
<p>If you've made a recovery that affects shared work:</p>
<ul>
  <li>Tell your team. They may have based work on the (now-recovered) state.</li>
  <li>Document in incident notes if production impact.</li>
  <li>Post-mortem the cause: how do we prevent next time?</li>
</ul>
<p>Recovery isn't only technical; the social layer matters.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>The reflog: read it</h3>
<pre><code># Show HEAD's reflog (most common):
git reflog
# Output:
# abc1234 HEAD@{0}: rebase finished: returning to refs/heads/feature
# def5678 HEAD@{1}: rebase: pick &lt;sha&gt;
# ghi9012 HEAD@{2}: rebase: checkout main
# jkl3456 HEAD@{3}: commit: My important work
# mno7890 HEAD@{4}: ... etc

# Show with timestamps:
git reflog --date=relative
# abc1234 HEAD@{2 minutes ago}: ...

git reflog --date=iso
# abc1234 HEAD@{2026-05-06 14:32:15 +0200}: ...

# Show all reflogs (all branches):
git reflog --all

# Show specific branch's reflog:
git reflog feature

# Search reflog by message:
git reflog | grep "search-term"

# Show diffs of recent reflog entries:
git log -g --oneline -10           # last 10 reflog entries
git log -g -p --grep="My work"     # full diff with grep</code></pre>

<h3>Recovery: lost commit (after reset --hard)</h3>
<pre><code># Scenario: did "git reset --hard HEAD~3"; lost 3 commits.

# Find them in reflog:
git reflog
# Look for a 'commit:' entry pre-reset.

# Reset back:
git reset --hard HEAD@{1}
# OR by SHA:
git reset --hard abc1234</code></pre>

<h3>Recovery: deleted branch</h3>
<pre><code># Scenario: deleted feature branch with unmerged commits.

# Find last commit on the branch:
git reflog | grep feature
# OR check all reflogs:
git reflog --all | grep feature
# Or:
git log -g --grep="feature"

# Re-create branch:
git branch feature &lt;last-sha-on-feature&gt;

# Verify:
git log feature --oneline

# Push if you want to restore on remote:
git push origin feature</code></pre>

<h3>Recovery: bad rebase</h3>
<pre><code># Scenario: rebased main onto feature; messed up resolutions.

# Reflog shows the pre-rebase state:
git reflog
# &lt;new-sha&gt; HEAD@{0}: rebase finished
# &lt;sha-during-rebase&gt; HEAD@{1}: rebase: pick X
# ...
# &lt;original-sha&gt; HEAD@{N}: commit: pre-rebase state

# Reset:
git reset --hard &lt;original-sha&gt;
# OR:
git reset --hard ORIG_HEAD
# (Git sets ORIG_HEAD to pre-rebase state during rebase)</code></pre>

<h3>Recovery: amended commit (lost the original)</h3>
<pre><code># Scenario: git commit --amend, but you wanted the original.

git reflog
# Look for a 'commit (amend):' entry; the entry just before is the original

# Reset to original:
git reset --hard HEAD@{1}
# (or whichever entry was the pre-amend commit)</code></pre>

<h3>Recovery: dropped stash</h3>
<pre><code># Scenario: git stash drop; want it back.

# Stash drops aren't in normal reflog, but objects exist as orphans.
git fsck --lost-found

# Output lists dangling commits:
# dangling commit abc1234
# dangling blob def5678
# dangling commit ghi9012  ← stashes look like commits

# Inspect each:
git show abc1234
git show ghi9012

# Recover by re-applying:
git stash apply &lt;sha-of-stash-commit&gt;
# OR convert to a branch:
git branch recovered-stash &lt;sha&gt;</code></pre>

<h3>Recovery: file-level (recover a deleted file from history)</h3>
<pre><code># Find when file existed:
git log --all --full-history -- path/to/file

# Recover at specific commit:
git checkout &lt;sha&gt; -- path/to/file
# (Stages it; commit when ready)

# Recover from previous commit:
git checkout HEAD~1 -- path/to/file</code></pre>

<h3>Recovery: shared bad commit (revert)</h3>
<pre><code># Scenario: bad commit pushed; others have pulled.

# DON'T rebase; that rewrites shared history.
# DO revert: create a new commit that undoes the bad one.

git revert &lt;bad-sha&gt;
# Creates a "Revert &lt;bad-sha&gt;" commit; safe to push.

git push origin main

# To revert multiple commits:
git revert &lt;sha1&gt;..&lt;sha2&gt;
# (Reverts each; can be one combined commit with --no-commit)

# Revert a merge commit (need to specify mainline):
git revert -m 1 &lt;merge-sha&gt;
# -m 1 keeps the side that was your branch before merge</code></pre>

<h3>Recovery: undoing a force-push</h3>
<pre><code># Scenario: git push --force overwrote remote; want old state back.

# If you still have it locally:
git reflog
# Find pre-force-push state, restore:
git reset --hard &lt;sha&gt;
git push --force-with-lease origin &lt;branch&gt;

# If only old remote state was correct (you pushed bad code):
# Get old state from someone who has it:
# - Teammate's local branch
# - CI build artifact
# - Another local clone

# Last resort: use Git internal data on remote:
# Some remotes (GitHub, GitLab) have admin tools to recover orphaned commits</code></pre>

<h3>Recovery: orphaned commits via fsck</h3>
<pre><code>git fsck --full --unreachable --no-reflogs

# Lists unreachable objects:
# unreachable commit abc1234
# unreachable blob def5678
# unreachable tree ghi9012

# Find ones that look like your work:
for sha in $(git fsck --unreachable --no-reflogs | awk '/commit/ {print $3}'); do
  git log -1 --format="%h %s" $sha
done

# Recover by branching:
git branch recovered-work &lt;sha&gt;</code></pre>

<h3>The "I committed to the wrong branch" recovery</h3>
<pre><code># Scenario: meant to commit to feature; committed to main.

# 1. From main, get the SHA of the bad commit:
git log -1 --oneline   # &lt;bad-sha&gt;

# 2. Cherry-pick to feature:
git checkout feature
git cherry-pick &lt;bad-sha&gt;

# 3. Reset main:
git checkout main
git reset --hard HEAD~1
# (or whichever offset rolls back the misplaced commit)

# If main was already pushed:
# - You shouldn't reset; you should:
git revert &lt;bad-sha&gt;
# - Then re-apply on feature (you already did via cherry-pick)
# - Net effect: bad commit on main is reverted; feature has it</code></pre>

<h3>The "I committed secrets" recovery</h3>
<pre><code># Step 1: ROTATE THE SECRET FIRST
# (changing history doesn't help; the secret is already public if pushed)

# Step 2: Decide scope
# - If unpushed: just amend / reset
# - If pushed: scrub history (coordinate with team)

# Unpushed:
git rm --cached path/to/secret
git commit --amend
echo "path/to/secret" &gt;&gt; .gitignore
git add .gitignore
git commit --amend --no-edit

# Pushed (heavyweight; coordinate):
# Use git-filter-repo (modern; preferred over filter-branch):
pip install git-filter-repo
git filter-repo --invert-paths --path path/to/secret

# Force-push to remote (everyone needs to re-clone):
git push origin --force --all

# Inform team to re-clone fresh.</code></pre>

<h3>Recovery: damaged repo</h3>
<pre><code># Scenario: corrupted .git directory; git commands fail.

# Try fsck:
git fsck --full

# Try to recover from remote:
mv repo repo-broken
git clone &lt;remote-url&gt; repo

# Salvage uncommitted work:
diff -r repo-broken/src repo/src  # see what was uncommitted
# Manually copy files</code></pre>

<h3>Pre-emptive: backup before risky operations</h3>
<pre><code># Tag current state:
git tag pre-rebase-$(date +%s)

# Branch current state:
git branch backup/pre-experiment

# Push to remote (true backup):
git push origin HEAD:refs/heads/backup/pre-experiment

# Now do risky thing.
# If it works:
git tag -d pre-rebase-...   # cleanup tag
git branch -D backup/pre-experiment

# If it fails:
git reset --hard backup/pre-experiment</code></pre>

<h3>Useful reflog & recovery aliases</h3>
<pre><code># In ~/.gitconfig:
[alias]
  rl = reflog
  rls = "!f() { git reflog --date=iso | head -$\\{1:-20\\}; }; f"
  recover = "!f() { git reset --hard HEAD@{$1}; }; f"  # git recover 1 = go back 1 reflog step
  oops = reset --hard HEAD@{1}                          # revert last destructive op
  fsck-lost = fsck --full --unreachable --no-reflogs

# Usage:
# git rl           - show reflog
# git oops         - undo the last destructive operation
# git recover 5    - go back 5 reflog steps</code></pre>
`
    },
    {
      id: 'examples',
      title: '🔍 Worked Examples',
      html: `
<h3>Example 1: "I did <code>git reset --hard HEAD~5</code>; my work is gone!"</h3>
<p><strong>Setup:</strong> 5 commits of work that took all morning. Reset by accident.</p>

<pre><code># Step 1: Check reflog (DON'T panic, DON'T touch anything else):
git reflog
# abc1234 HEAD@{0}: reset: moving to HEAD~5
# def5678 HEAD@{1}: commit: Final tweaks
# ghi9012 HEAD@{2}: commit: Add tests
# jkl3456 HEAD@{3}: commit: Implement feature
# mno7890 HEAD@{4}: commit: Stub out feature
# pqr1234 HEAD@{5}: commit: Initial work
# stu5678 HEAD@{6}: ... (5 reflog entries ago, this was where we were)

# Step 2: Reset back to before the destructive operation:
git reset --hard HEAD@{1}

# Step 3: Verify:
git log --oneline
# Five commits restored.

# Step 4: Push to remote so this can never happen again:
git push origin feature</code></pre>

<p><strong>Time:</strong> 30 seconds. <strong>Lesson:</strong> reflog and reset are your fastest recovery path.</p>

<h3>Example 2: "I deleted my feature branch"</h3>
<p><strong>Setup:</strong> Working on feature/X. Did <code>git checkout main && git branch -D feature/X</code> by reflex (you do this nightly for cleanup) — but feature/X had unmerged work.</p>

<pre><code># Step 1: Find the last commit on feature/X:
git reflog --all | grep feature/X
# Or search by content:
git log -g --grep="message-from-feature-X"

# You see:
# abc1234 HEAD@{0}: checkout: moving from feature/X to main
# def5678 HEAD@{1}: commit: My latest feature work

# Step 2: Re-create the branch at that SHA:
git branch feature/X def5678

# Step 3: Verify:
git log feature/X --oneline
git diff main feature/X

# Step 4: Push:
git push origin feature/X

# Step 5 (optional): Set up local "deletion gate"
# In ~/.gitconfig:
# [alias]
#   br-delete = "!f() { read -p 'Are you sure? (yes/no): ' yn; if [ \"$yn\" = \"yes\" ]; then git branch -D $1; fi; }; f"
# Now use: git br-delete feature/X (asks confirmation)</code></pre>

<h3>Example 3: "Bad rebase produced wrong code"</h3>
<p><strong>Setup:</strong> Rebased feature onto main; conflicts; resolved poorly. Realized after force-push that production behavior is broken.</p>

<pre><code># Step 1: Reflog shows the pre-rebase state:
git reflog
# &lt;current-bad&gt; HEAD@{0}: rebase finished
# ... rebase steps ...
# &lt;original-good&gt; HEAD@{N}: commit: pre-rebase commit

# Step 2: Reset to pre-rebase:
git reset --hard ORIG_HEAD
# (Git sets ORIG_HEAD before rebase; same as reflog target)

# Step 3: Verify:
git log --oneline
git diff origin/feature   # see what your local has vs. (bad) remote

# Step 4: You already force-pushed bad version. Decide:
# Option A: force-push the good version back (anyone who pulled bad version
#           will need to deal):
git push --force-with-lease origin feature

# Option B: a coworker has based work on the bad version; coordinate:
# - Communicate
# - Decide whether to fix forward or restore
# - If restore: everyone resets local feature to match new origin

# Step 5: Now do the rebase carefully (or merge instead):
git fetch origin
git merge origin/main   # or git rebase, with care this time
# Resolve conflicts properly; test

# Step 6: Push the corrected version:
git push origin feature</code></pre>

<h3>Example 4: "Stash drop accident"</h3>
<p><strong>Setup:</strong> Had stash@{0} with important WIP. Did <code>git stash drop</code>. Realized too late.</p>

<pre><code># Stash drops don't show in normal reflog, but the stash commit is orphaned:

# Find dangling commits:
git fsck --full --unreachable --no-reflogs

# Output includes:
# unreachable commit abc1234   ← could be your stash

# Inspect each:
git show abc1234

# When you find the stash:
# Option A: re-apply directly (stash format works):
git stash apply abc1234

# Option B: create a branch:
git branch recovered-wip abc1234
git checkout recovered-wip
# Now the work is on a real branch</code></pre>

<h3>Example 5: "I committed secrets to a public repo"</h3>
<p><strong>Setup:</strong> Committed <code>config/.env</code> with API keys; pushed to public GitHub repo. Realized 30 minutes later.</p>

<pre><code># STEP 0 (CRITICAL, IMMEDIATE): Rotate the leaked secrets.
# If they were API keys: revoke and create new ones.
# If passwords: change them.
# Assume the secrets are public; treat as compromised.

# STEP 1: Get team aligned (if shared repo):
# Tell teammates: "About to scrub history. Don't pull until I say."

# STEP 2: Scrub local history with git-filter-repo (preferred over filter-branch):
pip install git-filter-repo
git filter-repo --invert-paths --path config/.env --force

# STEP 3: Verify locally:
git log --all -- config/.env  # should be empty

# STEP 4: Force-push (everyone will need to re-clone):
git push origin --force --all
git push origin --force --tags

# STEP 5: Tell team:
"Force-pushed scrubbed history. Re-clone fresh; don't pull on
existing checkouts. Secrets [X, Y] were rotated; new values in
shared password manager."

# STEP 6: Add gitignore + pre-commit hook to prevent recurrence:
echo "config/.env" &gt;&gt; .gitignore
git add .gitignore
git commit -m "Ignore .env; add pre-commit secret scanning"

# Install secret scanner:
brew install gitleaks
# Add pre-commit hook to run gitleaks before each commit.</code></pre>

<p><strong>Critical:</strong> the scrub doesn't help if the secret was compromised. Rotation is the only true defense; scrub prevents future leaks.</p>

<h3>Example 6: "I committed to wrong branch"</h3>
<p><strong>Setup:</strong> Meant to commit to feature; committed to main. Not pushed yet.</p>

<pre><code># Step 1: From main, find SHA of the bad commit:
git log -1 --oneline
# abc1234 My feature work

# Step 2: Switch to feature, cherry-pick:
git checkout feature
git cherry-pick abc1234

# Step 3: Switch back to main, reset:
git checkout main
git reset --hard HEAD~1   # remove the misplaced commit

# Step 4: Verify:
git log main --oneline   # commit gone
git log feature --oneline   # commit present

# Step 5: Push:
git push origin feature
git push origin main   # only if main wasn't pushed previously
# If main was pushed: you'd need --force-with-lease, which is risky on main</code></pre>

<h3>Example 7: "Force-pushed by accident; teammate had unpushed work"</h3>
<p><strong>Setup:</strong> You pushed --force to feature/X. Teammate had unpushed local work based on feature/X; their next pull will be a mess.</p>

<pre><code># Step 1: Don't compound the problem. Don't push more.

# Step 2: Communicate with teammate immediately:
"Hey, I force-pushed to feature/X — overwrote some commits.
Don't pull yet; let me see if I can restore them."

# Step 3: Check your local reflog:
git reflog feature/X
# Find pre-force-push state:
# new-sha HEAD@{0}: push: forced update
# old-sha HEAD@{1}: ...

# Step 4: If your local has the old state, restore:
git checkout feature/X
git reset --hard old-sha
git push --force-with-lease origin feature/X

# Step 5: If you don't have the old state but teammate does:
"Can you push your local feature/X to backup branch?
git push origin feature/X:feature/X-backup-by-teammate"

# Step 6: Reconcile:
git fetch origin
# Merge or rebase your work on top of teammate's restored state:
git rebase origin/feature/X-backup-by-teammate
git push --force-with-lease origin feature/X

# Step 7: Post-mortem:
# - Always --force-with-lease, never --force.
# - Communicate before force-pushing shared branches.</code></pre>

<h3>Example 8: "I lost work after laptop crash"</h3>
<p><strong>Setup:</strong> Was deep in coding. Laptop crashed / restart. After reboot, can't find your work.</p>

<pre><code># Step 1: Check obvious places:
git status                  # uncommitted in working tree?
git log -10 --oneline       # recent commits there?
git stash list              # stashed?

# Step 2: Reflog:
git reflog --date=iso | head -50
# Look for entries from before the crash (timestamps).

# Step 3: If the crash happened mid-operation, may need to clean up:
# Check for in-progress states:
ls .git/MERGE_HEAD .git/REBASE_HEAD .git/CHERRY_PICK_HEAD 2&gt;/dev/null

# If any exist:
git status   # tells you what's in progress; --abort or --continue

# Step 4: Truly uncommitted work in working tree, lost forever from Git.
# Check IDE local history:
# - VS Code: View &gt; Timeline (per-file local history)
# - IntelliJ / Android Studio / Xcode: View &gt; Local History

# Check OS time machine / backup if configured.

# LESSON: Commit early and often; even WIP. Auto-save isn't enough.</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Reflog has been pruned</h3>
<p>If garbage collection ran (default 30 days for unreachable, 90 for reachable), the reflog entry may be gone:</p>
<pre><code>git reflog
# Doesn't show what you need

git fsck --lost-found
# Look for dangling objects matching your work

# If nothing: lost forever. Lesson learned.</code></pre>

<h3>Disk failure or repo corruption</h3>
<p>Reflog is on disk; disk failure = reflog gone. Mitigations:</p>
<ul>
  <li>Push critical work to remote regularly.</li>
  <li>Use cloud-synced repo locations (with care; Git on Dropbox is fragile).</li>
  <li>Backups: Time Machine, restic, etc.</li>
</ul>

<h3>Recovery from a "destroyed" .git</h3>
<p>If <code>.git</code> is gone but working tree exists, you have files but no history:</p>
<pre><code># Re-clone elsewhere:
git clone &lt;remote-url&gt; ../repo-fresh

# Copy your working tree changes over:
cp -r path/to/changed/files ../repo-fresh/path/to/changed/files

# Now you have history + your uncommitted changes; commit normally.</code></pre>

<h3>Conflicting recovery operations</h3>
<p>If multiple things went wrong (e.g., bad rebase + bad reset), reflog has many entries; navigation is harder:</p>
<ul>
  <li>Use timestamps: <code>git reflog --date=iso</code> to find specific time.</li>
  <li>Use messages: <code>git log -g --grep="search"</code> to find by commit message.</li>
  <li>Take it one step at a time; don't try to recover everything at once.</li>
</ul>

<h3>The "I want to undo a revert" case</h3>
<p>You did <code>git revert &lt;sha&gt;</code>; now want the original change back.</p>
<pre><code># Easy: revert the revert:
git revert HEAD

# Or, if not pushed yet:
git reset --hard HEAD~1
# (Removes the revert commit; original sha is "back")</code></pre>

<h3>Recovery in shallow clones</h3>
<p>Shallow clones (<code>--depth=1</code>) don't have full history. If you reset / rebase shallow clone, recovery to pre-shallow state may not be possible because earlier commits were never fetched.</p>
<ul>
  <li>Mitigation: <code>git fetch --unshallow</code> to deepen before risky operations.</li>
</ul>

<h3>Submodule recovery</h3>
<p>If you delete / break submodule, recovery involves:</p>
<pre><code># Remove submodule's directory:
rm -rf path/to/submodule

# Re-init from .gitmodules:
git submodule update --init --recursive path/to/submodule</code></pre>

<h3>The "I pushed binary garbage" case</h3>
<p>Accidentally committed a 500MB file; pushed; remote rejects (sometimes); team pulls 500MB:</p>
<ol>
  <li>Remove with <code>git filter-repo --path huge.bin --invert-paths</code>.</li>
  <li>Force-push (coordinate with team).</li>
  <li>Add to .gitignore.</li>
  <li>Configure pre-commit hook to refuse files &gt; some size.</li>
</ol>

<h3>The "lost work in detached HEAD"</h3>
<p>You committed in detached HEAD state; switched branches; commits are orphaned.</p>
<pre><code># Reflog still has them:
git reflog
# Look for the commit messages from detached state.

# Recover by branching:
git branch recovered-detached &lt;sha&gt;</code></pre>

<h3>The "lost stash via git stash clear"</h3>
<p><code>git stash clear</code> drops all stashes. Same recovery as drop:</p>
<pre><code>git fsck --unreachable --no-reflogs | grep commit
# Each may be a stash; inspect and recover.</code></pre>

<h3>The "lost work due to filesystem case sensitivity"</h3>
<p>On macOS (case-insensitive by default), <code>foo.ts</code> and <code>Foo.ts</code> are the same file. Git on Linux treats them as different. Pulling Linux repo on Mac may "lose" one of two files.</p>
<ul>
  <li>Solution: rename to unique names; commit; push.</li>
  <li>Or use case-sensitive volume on Mac.</li>
</ul>

<h3>The "merged garbage from upstream" case</h3>
<p>You pulled main; main had a bad commit you didn't realize; now your branch has it.</p>
<pre><code># If unpushed:
git reset --hard ORIG_HEAD   # before the pull
# Or:
git reflog
git reset --hard &lt;pre-pull-sha&gt;

# If pushed: revert the bad commit on your branch (creates a new commit).</code></pre>

<h3>The "I rebased main accidentally" case</h3>
<p>Rare but devastating. You're on main; ran <code>git rebase --onto &lt;...&gt;</code>; now main is wrong locally.</p>
<pre><code>git reflog main   # branch-specific reflog
# Find pre-rebase state of main; reset:
git reset --hard &lt;pre-rebase-main-sha&gt;</code></pre>

<h3>The "lost via clean -fdx"</h3>
<p><code>git clean -fdx</code> removes untracked files. Uncommitted work in untracked files = lost forever via Git.</p>
<ul>
  <li>Recovery: IDE local history; OS file recovery tools (varies wildly).</li>
  <li>Prevention: <code>-n</code> flag (dry run) first to see what would be deleted.</li>
</ul>

<h3>Recovery on forks / shared repos</h3>
<p>If the canonical repo is owned by someone else (open source, work fork):</p>
<ul>
  <li>You can't fix damage on origin/main; coordinate with maintainer.</li>
  <li>Local reflog of forks often has more recent state than the maintainer's.</li>
  <li>If you broke a shared branch via PR-merge action: revert PR via GitHub UI.</li>
</ul>

<h3>Recovery from interactive rebase done wrong</h3>
<p>Interactive rebase that drops too many commits / squashes wrong / etc.:</p>
<pre><code>git reflog
# Multiple entries from rebase steps
# Find pre-rebase state:
git reset --hard ORIG_HEAD
# OR: reset to the "checkout" entry that started the rebase:
# &lt;sha&gt; HEAD@{N}: rebase (start): checkout origin/main
# Use entry N+1 (just before that)</code></pre>

<h3>Mobile-specific: Xcode / build artifacts not backed up</h3>
<p>Some "lost work" is in build state — Xcode derived data, simulators, db state. These aren't in Git:</p>
<ul>
  <li>Test data / db state: re-seed.</li>
  <li>Xcode preferences / breakpoints: not committed; lost on machine wipe (consider dotfiles management).</li>
  <li>Simulator state: ephemeral; expect to recreate.</li>
</ul>
`
    },
    {
      id: 'bugs',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Anti-pattern: panicking and running more commands</h3>
<p><strong>Looks like:</strong> Lost work; immediately try every Git command you can think of.</p>
<p><strong>Why bad:</strong> Each operation can complicate recovery; some operations destroy reflog entries.</p>
<p><strong>Fix:</strong> Stop. Read. Plan. <code>git reflog</code> first; understand state before acting.</p>

<h3>Anti-pattern: not using --force-with-lease</h3>
<p><strong>Looks like:</strong> Always <code>git push --force</code>.</p>
<p><strong>Why bad:</strong> Overwrites teammates' work without warning. Their work goes to reflog only on their local machine — your force is destructive on remote.</p>
<p><strong>Fix:</strong> Default to <code>--force-with-lease</code>. Alias for safety.</p>

<h3>Anti-pattern: trusting only the reflog</h3>
<p><strong>Looks like:</strong> "Reflog has it; I'm safe."</p>
<p><strong>Why bad:</strong> Reflog is local; disk failure / OS reinstall = gone. GC eventually prunes.</p>
<p><strong>Fix:</strong> Push critical work to remote (even backup branch) for true safety.</p>

<h3>Anti-pattern: rewriting history that was published</h3>
<p><strong>Looks like:</strong> Force-push to main / shared branch to "fix" history.</p>
<p><strong>Why bad:</strong> Breaks everyone who pulled. Trust collapse.</p>
<p><strong>Fix:</strong> Use <code>git revert</code> for shared mistakes. Live with imperfect history if it's already public.</p>

<h3>Anti-pattern: not committing WIP</h3>
<p><strong>Looks like:</strong> Hours of work uncommitted; some operation overwrites it.</p>
<p><strong>Why bad:</strong> Uncommitted work is fragile. Most "I lost everything" stories are uncommitted.</p>
<p><strong>Fix:</strong> Commit WIP every 30-60 min. Squash before push (see <a href="#" data-topic="git-rebase">Rebase</a>). Even better: push to a backup branch.</p>

<h3>Anti-pattern: filter-branch / filter-repo without coordination</h3>
<p><strong>Looks like:</strong> Run <code>git filter-repo</code> on shared repo; force-push; team's local checkouts break.</p>
<p><strong>Why bad:</strong> Everyone's history is rewritten; they need to re-clone.</p>
<p><strong>Fix:</strong> Coordinate before. Inform; wait for window; force-push; tell team to re-clone.</p>

<h3>Anti-pattern: relying on GitHub UI for recovery</h3>
<p><strong>Looks like:</strong> "GitHub will have the old state."</p>
<p><strong>Why bad:</strong> Force-pushes overwrite remote; old state may be gone.</p>
<p><strong>Fix:</strong> Local reflog is your friend. Some platforms (GitHub) keep "events" you can browse via API but recovery there is harder.</p>

<h3>Anti-pattern: not rotating leaked secrets</h3>
<p><strong>Looks like:</strong> Scrub history; assume secret is "removed."</p>
<p><strong>Why bad:</strong> Secret may already be public via Git's distributed nature, mirrors, search engines.</p>
<p><strong>Fix:</strong> Rotate secret first. Always. Scrub is for preventing future leaks; doesn't undo past exposure.</p>

<h3>Anti-pattern: <code>git reset --hard</code> on dirty working tree</h3>
<p><strong>Looks like:</strong> Reset --hard while uncommitted changes are present.</p>
<p><strong>Why bad:</strong> Uncommitted changes are destroyed; not recoverable.</p>
<p><strong>Fix:</strong> Stash or commit first. <code>git status</code> before reset --hard, always.</p>

<h3>Anti-pattern: confusing <code>checkout</code>, <code>restore</code>, and <code>reset</code></h3>
<p><strong>Looks like:</strong> Use wrong command; lose work or don't get the result expected.</p>
<p><strong>Why bad:</strong> All three modify state in different ways.</p>
<p><strong>Fix:</strong> Memorize:</p>
<ul>
  <li><code>git checkout &lt;branch&gt;</code> — switch branch.</li>
  <li><code>git checkout &lt;sha&gt; -- &lt;file&gt;</code> — restore file from sha.</li>
  <li><code>git restore &lt;file&gt;</code> — discard uncommitted (modern syntax).</li>
  <li><code>git restore --staged &lt;file&gt;</code> — unstage.</li>
  <li><code>git reset HEAD~1</code> — move HEAD; soft / mixed / hard varies what it touches.</li>
</ul>

<h3>Anti-pattern: amend after push</h3>
<p><strong>Looks like:</strong> <code>git commit --amend</code> after pushing the original.</p>
<p><strong>Why bad:</strong> Now local + remote diverge; force-push needed; pulled by others creates mess.</p>
<p><strong>Fix:</strong> Amend only before push. After push: write a new "fix typo" commit.</p>

<h3>Anti-pattern: deleting branches without checking for merge</h3>
<p><strong>Looks like:</strong> <code>git branch -D feature</code> when feature has unmerged commits.</p>
<p><strong>Why bad:</strong> -D forces; commits orphaned. Recoverable for ~30 days but might be missed.</p>
<p><strong>Fix:</strong> Use <code>-d</code> (lowercase); refuses if unmerged. Use <code>-D</code> only when intentional.</p>

<h3>Anti-pattern: <code>git clean</code> without dry-run</h3>
<p><strong>Looks like:</strong> <code>git clean -fdx</code> without checking.</p>
<p><strong>Why bad:</strong> Removes untracked files including your IDE cache, .env, anything ignored.</p>
<p><strong>Fix:</strong> Always <code>git clean -fdxn</code> (dry-run) first. Verify list. Then run for real.</p>

<h3>Anti-pattern: trusting GC won't run</h3>
<p><strong>Looks like:</strong> "Reflog will keep my orphan forever."</p>
<p><strong>Why bad:</strong> Auto-GC triggers on operations; orphans expire.</p>
<p><strong>Fix:</strong> Recover quickly. If you suspect important work is in orphans, branch / tag immediately.</p>

<h3>Anti-pattern: making destructive changes on Friday</h3>
<p><strong>Looks like:</strong> Big rebase / filter-repo / force-push at 5pm Friday.</p>
<p><strong>Why bad:</strong> If something goes wrong, you can't reach teammates over weekend; whole team's Monday is broken.</p>
<p><strong>Fix:</strong> Schedule destructive operations early in the week, when team is around.</p>

<h3>Anti-pattern: ignoring "you have unpushed commits" warnings</h3>
<p><strong>Looks like:</strong> Tools (IDE Git plugin, status line) say "ahead 5"; you ignore.</p>
<p><strong>Why bad:</strong> Those 5 commits exist only locally. Disk failure = loss.</p>
<p><strong>Fix:</strong> Push regularly. Even to a personal backup branch if PR isn't ready.</p>

<h3>Anti-pattern: not having a recovery rehearsal</h3>
<p><strong>Looks like:</strong> First time using <code>reflog</code> is during an actual emergency.</p>
<p><strong>Why bad:</strong> Stress + unfamiliarity = errors. Compounds the disaster.</p>
<p><strong>Fix:</strong> Practice on a sandbox repo. Make and recover from each failure mode (reset, branch delete, stash drop, bad rebase). Build muscle memory.</p>
`
    },
    {
      id: 'interview',
      title: '🎤 Interview Patterns',
      html: `
<h3>"How do you recover lost work in Git?"</h3>
<p>Common at senior+ interviews. Tests practical Git fluency.</p>

<pre><code>"Almost any committed work is recoverable via the reflog —
.git/logs/HEAD records every move of HEAD locally. So:

- Lost commits via reset: git reflog, git reset --hard &lt;sha&gt;.
- Deleted branch: find the commits in reflog, git branch &lt;name&gt; &lt;sha&gt;.
- Bad rebase: git reset --hard ORIG_HEAD or reflog.
- Dropped stash: git fsck --lost-found, then git stash apply &lt;sha&gt;.
- Amended commit: reflog has the pre-amend version.

The key disciplines:
1. Don't panic. Don't run more commands.
2. Reflog first. Identify state.
3. Plan recovery. Test each step.

Reflog is local-only and pruned after 30-90 days, so I push
critical work to remote (even a backup branch) for true safety."</code></pre>

<h3>"What's the reflog?"</h3>
<pre><code>"It's a per-local-repo log of every move of HEAD: commits,
checkouts, resets, rebases, merges, etc. Each entry has a SHA, a
position number (HEAD@{0} = most recent), and a description of
what happened.

The killer feature: reflog includes orphaned commits — ones that
no branch/tag references anymore but are still in the object
database. So 'lost' work is usually recoverable via reflog.

Reflog only exists locally and persists ~30-90 days before
garbage collection. Push critical work for true durability."</code></pre>

<h3>"Difference between reset, revert, and checkout?"</h3>
<pre><code>"All three move you to a different state but in different ways:

- git reset moves HEAD (and optionally index + working tree).
  Modes: --soft (HEAD only), --mixed (HEAD + index), --hard
  (HEAD + index + working tree). Hard is destructive.

- git revert creates a new commit that undoes a previous commit.
  Doesn't change history. Safe for shared branches.

- git checkout (now split into git switch + git restore in
  modern Git) switches branches or restores files. Doesn't
  rewrite history.

Use reset for local 'go back to a state.' Use revert for
'undo this published change with a new commit.' Use checkout/
switch/restore for branch switching and file-level operations."</code></pre>

<h3>"Tell me about a time you had to recover Git work"</h3>
<p>Behavioral. They want a war story + lesson.</p>
<pre><code>"Force-pushed over a teammate's commit early in my career. Was
on a shared feature branch; had rebased my local; --force pushed;
it overwrote a fix they'd pushed that morning.

Recovery: their commit was in my local reflog from when I'd
fetched. I cherry-picked it into my branch, force-pushed (with
--force-with-lease this time), confessed, rebuilt the trust.

Took ~30 minutes including the apology DM and re-reviewing my
branch.

What I learned: --force-with-lease as default. Configured an
alias 'git fp = push --force-with-lease' so the safer default is
the easier command. Haven't repeated the mistake."</code></pre>

<h3>"What would you do if you committed secrets?"</h3>
<pre><code>"First and most important: rotate the secret. The history may be
public via mirrors, search engines, or any clone — assume it's
compromised regardless of whether you scrub.

Then, depending on scope:
- Unpushed: git rm --cached, amend the commit, add to .gitignore.
- Pushed: git filter-repo --invert-paths --path &lt;file&gt;, force-push,
  inform team to re-clone. Coordinate the timing with team to
  avoid breakage.

Long-term: pre-commit hooks (gitleaks, truffleHog) to prevent
recurrence; .gitignore aggressive; secrets manager for actual
secret storage."</code></pre>

<h3>"How does git fsck help with recovery?"</h3>
<pre><code>"git fsck checks the integrity of the object database. The
useful flag for recovery:

git fsck --full --unreachable --no-reflogs

Lists objects (commits, blobs, trees) that aren't reachable from
any ref AND aren't in any reflog. These are 'truly orphaned' but
still present until GC.

Use case: dropped stash, deleted branch with no reflog entry, etc.

Output:
unreachable commit abc1234
unreachable blob def5678

Inspect each (git show abc1234) to find your work; recover by
branching or cherry-picking."</code></pre>

<h3>"What does ORIG_HEAD do?"</h3>
<pre><code>"ORIG_HEAD is a ref that Git sets before potentially destructive
operations: rebase, merge, reset. It points to where HEAD was
before the operation.

So after a rebase:
git reset --hard ORIG_HEAD
restores the pre-rebase state. Same as digging through reflog,
but easier when the operation just finished.

ORIG_HEAD is overwritten by the next big operation, so it's a
short-term safety net."</code></pre>

<h3>"How do you prevent these problems?"</h3>
<pre><code>"Several layers:

1. Habits:
   - Commit WIP frequently (don't accumulate uncommitted hours).
   - Push to remote regularly (even personal backup branch).
   - --force-with-lease, never --force.
   - git status before destructive operations.
   - git clean --dry-run before clean.

2. Aliases for safer defaults:
   - git fp = push --force-with-lease
   - git oops = reset --hard HEAD@{1}

3. Pre-commit hooks:
   - Secret scanning (gitleaks).
   - Lint / test gates.
   - Refuse files &gt; size threshold.

4. Pre-emptive backup before risky ops:
   - git tag pre-rebase-$(date +%s)
   - git push origin HEAD:backup/work-in-progress

5. Practice:
   - Rehearse recovery on sandbox repo.
   - First time using reflog should not be during an emergency."</code></pre>

<h3>"Can you recover from a disk failure?"</h3>
<pre><code>"Only what was pushed to remote. Reflog is local-only; if disk
is gone, reflog is gone.

So strategies:
- Push to remote regularly. Even a 'backup/work-in-progress'
  branch is safer than local-only.
- Use cloud-synced repo with care (Git in Dropbox is fragile;
  newer setups like Git on iCloud Drive can corrupt).
- Time Machine / restic / Carbonite for whole-machine backup.

The best recovery is the one you don't need."</code></pre>

<h3>"What does <code>git reset --hard</code> do exactly?"</h3>
<pre><code>"Three things:
1. Moves HEAD (and current branch) to specified commit.
2. Updates the index (staging) to match that commit.
3. Updates the working tree to match.

The third part is destructive. Any uncommitted changes in
working tree are lost. The index changes are also lost.

The first two parts (HEAD and index) are recoverable via reflog.
The third (working tree) is not — those files weren't in Git.

So:
- Reset --hard &lt;sha&gt; with clean working tree: reversible via
  reflog.
- Reset --hard &lt;sha&gt; with uncommitted work: uncommitted work
  is gone forever from Git's perspective."</code></pre>

<h3>Common follow-ups</h3>
<table>
  <thead><tr><th>Question</th><th>What they're checking</th></tr></thead>
  <tbody>
    <tr><td>"How long does the reflog persist?"</td><td>30-90 days; configurable; pruned by gc</td></tr>
    <tr><td>"What's the difference between detached HEAD and a branch?"</td><td>Detached: HEAD points directly to a commit, no branch ref</td></tr>
    <tr><td>"Have you used <code>git filter-repo</code>?"</td><td>For history rewriting (secret removal, large file removal)</td></tr>
    <tr><td>"What's <code>git stash apply</code> vs <code>git stash pop</code>?"</td><td>apply = leave stash in stash list; pop = apply + drop</td></tr>
    <tr><td>"How would you recover a force-pushed branch?"</td><td>Local reflog if you have it; coordinate with team if not</td></tr>
    <tr><td>"What's the safest way to rebase a branch?"</td><td>Tag/branch first; rebase; verify; force-with-lease</td></tr>
  </tbody>
</table>

<h3>The 30-second mantra</h3>
<p><em>"Don't panic. Reflog has almost everything for ~30-90 days. Reset for local recovery; revert for shared. Push critical work to remote for durability. Practice recovery on a sandbox before the real emergency. Most disasters are recoverable when handled calmly."</em></p>
<p>Recovery skills are confidence skills. Engineers who know they can undo mistakes work boldly with Git; engineers who don't tip-toe and avoid useful operations. Build the muscle memory; the boldness compounds.</p>
`
    }
  ]
});
