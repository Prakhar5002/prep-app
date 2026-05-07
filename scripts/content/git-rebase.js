window.PREP_SITE.registerTopic({
  id: 'git-rebase',
  module: 'git',
  title: 'Rebase vs Merge',
  estimatedReadTime: '40 min',
  tags: ['git', 'rebase', 'merge', 'workflow', 'history', 'conflicts', 'branching'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>Rebase and merge are the two ways to integrate one branch into another. They produce different histories and have different consequences for collaboration. Senior engineers know not just <em>how</em> to use both but <em>when</em> each is correct, and have strong defaults that match their team's workflow.</p>
<ul>
  <li><strong>Merge preserves history; rebase rewrites it.</strong> Merge creates a "join" commit that links two branches; rebase replays your commits on top of another branch as if they were authored there.</li>
  <li><strong>Default rule:</strong> rebase your <em>local</em> work to keep history linear; merge into <em>shared</em> branches (main / develop) so the history of integration is preserved.</li>
  <li><strong>Never rebase a branch others have based work on.</strong> Rewriting history that's been pulled by others is the most common destructive Git mistake.</li>
  <li><strong>Interactive rebase (<code>git rebase -i</code>)</strong> is the most-used senior-IC Git skill: squash WIP commits, reorder, edit messages, drop garbage. Master it.</li>
  <li><strong>Conflicts are different in rebase vs. merge.</strong> Rebase replays one commit at a time and may make you resolve the same conflict repeatedly; merge resolves once.</li>
  <li><strong>"Rebase and merge"</strong> in PR UI = merge after rebase; "Squash and merge" collapses a feature branch into one commit; "Create merge commit" preserves true history. Pick a team default.</li>
  <li><strong>For mobile / RN:</strong> linear history makes <code>git bisect</code> work cleanly when hunting an OS-version-specific or device-specific bug — strong reason to favor rebase / squash workflows.</li>
  <li><strong>Recovery is always possible</strong> via reflog if you act fast — see <a href="#" data-topic="git-recovery">Recovery (reflog etc.)</a>.</li>
</ul>
<p><strong>Mantra:</strong> "Rebase your work; merge to integrate. Never rewrite shared history. Squash your WIP. Interactive rebase is your friend. Reflog saves you when you mess up."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>The two operations</h3>
<table>
  <thead><tr><th>Operation</th><th>What it does</th></tr></thead>
  <tbody>
    <tr><td><strong>Merge</strong></td><td>Creates a new commit that has two parents — the tip of your branch and the tip of the branch you merged. History records that "these branches diverged then joined."</td></tr>
    <tr><td><strong>Rebase</strong></td><td>Re-applies each commit from your branch on top of the target branch, creating new commits with new SHAs. History looks as if you'd developed from the new base all along.</td></tr>
  </tbody>
</table>

<h3>Visual comparison</h3>
<pre><code>Starting state:
   o---o---o (main)
        \\
         a---b---c (feature)

After 'git merge main' on feature:
   o---o---o-------(main)
        \\       \\
         a---b---c---M (feature; M is merge commit)

After 'git rebase main' on feature:
   o---o---o (main)
            \\
             a'---b'---c' (feature; a',b',c' are new commits)</code></pre>

<h3>Why histories matter</h3>
<p>Git history isn't just a record — it's a debugging tool, an audit trail, a code-archaeology surface. Different histories support different operations:</p>
<table>
  <thead><tr><th>History style</th><th>Easy operations</th><th>Hard operations</th></tr></thead>
  <tbody>
    <tr><td><strong>Linear</strong> (rebase-heavy)</td><td>git bisect, git log readability, blame, "what changed between Friday and now"</td><td>"Show me what was developed on the feature branch as a unit"</td></tr>
    <tr><td><strong>Branchy</strong> (merge-heavy)</td><td>"What was in PR #1234?", grouped feature work, true integration record</td><td>git bisect (multiple parents complicate it), log noise from merge commits</td></tr>
  </tbody>
</table>
<p>Most modern teams favor <em>mostly linear</em> history: rebase or squash within feature branches; merge commits at integration points so you can still tell what shipped together.</p>

<h3>Why "never rewrite shared history" is a hard rule</h3>
<p>When you rebase, you create new commits with new SHAs. Old commits remain in the reflog locally but are no longer part of the branch. Now consider:</p>
<pre><code>You:        a---b---c (origin/feature)
Teammate:   a---b---c---d---e (their local feature, branched off c)

You rebase feature onto main, force-push:
You:        a'---b'---c' (origin/feature; a,b,c are gone from origin)

Teammate pulls:
Teammate:   a---b---c---d---e
                     \\
                      a'---b'---c' (origin/feature)

Teammate now has both old (a,b,c) and new (a',b',c') versions.
git pull tries to merge them. Mess. Their PR is now polluted with
duplicate commits or weird merge resolutions.</code></pre>
<p>The rule: <strong>once you've pushed to a shared branch and others may have based work on it, do not rebase that branch.</strong> Either merge from then on, or coordinate explicitly with everyone affected.</p>

<h3>The four common workflows</h3>
<table>
  <thead><tr><th>Workflow</th><th>Pattern</th><th>Use case</th></tr></thead>
  <tbody>
    <tr><td><strong>Trunk-based, rebase-and-merge</strong></td><td>Short feature branches; rebase onto main; merge fast-forward</td><td>Small teams; CI/CD-heavy; frequent ships</td></tr>
    <tr><td><strong>Squash-and-merge</strong></td><td>Feature branches squashed to single commit on main</td><td>Most teams w/ PR review; easy revert; clean main history</td></tr>
    <tr><td><strong>Merge commits preserved</strong></td><td>Always merge; never rebase shared</td><td>Teams that want full history; complex multi-commit features</td></tr>
    <tr><td><strong>Git Flow</strong></td><td>develop / release / hotfix branches with merges</td><td>Release-train shops; dying out in modern tech but exists</td></tr>
  </tbody>
</table>

<h3>The mobile / RN context</h3>
<p>For mobile / RN teams, history shape directly affects debugging:</p>
<ul>
  <li><strong>git bisect</strong> on a release-bug becomes clean with linear history. With merge-heavy history, bisect navigates through merge commits awkwardly.</li>
  <li><strong>Cherry-picking hotfixes</strong> from main back to a release branch is much cleaner with squashed feature commits.</li>
  <li><strong>"What changed between v3.5 and v3.6 of the app?"</strong> is a question every release engineer asks; it's much easier with linear history.</li>
  <li><strong>Native code conflicts</strong> (Pods.lock, Gradle, build configs) often resolve more painfully in rebase than merge — be aware.</li>
</ul>

<h3>The cognitive cost of choice</h3>
<p>Teams that don't have a written "use rebase here / merge here" policy waste time:</p>
<ul>
  <li>Mid-PR debates about how to integrate.</li>
  <li>Inconsistent history shape (some PRs squashed, some merged).</li>
  <li>New hires confused.</li>
  <li>Hotfix flow ad-hoc.</li>
</ul>
<p>Pick a default; document it; deviate only with reason. The choice matters less than the consistency.</p>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The "commits as snapshots, not diffs" model</h3>
<p>Git stores commits as snapshots of the entire tree, not diffs. Each commit references its parent(s); the diff is computed on demand. This is critical for understanding rebase:</p>
<ul>
  <li>A "rebase" doesn't move commits — it creates new ones by replaying the diffs onto a new base.</li>
  <li>Old commits still exist (in the reflog) until garbage collection.</li>
  <li>The same diff replayed on a different base may produce conflicts (different surrounding code).</li>
</ul>

<h3>The "history graph" model</h3>
<p>Run <code>git log --graph --oneline --all</code> to see your repo's actual history graph. Internalize the pattern:</p>
<table>
  <thead><tr><th>Symbol</th><th>Meaning</th></tr></thead>
  <tbody>
    <tr><td><code>*</code></td><td>A commit</td></tr>
    <tr><td><code>|</code></td><td>Branch line (parent relationship)</td></tr>
    <tr><td><code>/</code> / <code>\\</code></td><td>Branch / merge point</td></tr>
    <tr><td>Multiple incoming arrows</td><td>Merge commit (multiple parents)</td></tr>
  </tbody>
</table>
<p>Linear history = single line of <code>*</code>s. Branchy = lots of <code>/</code> and <code>\\</code>. Reading these graphs is a basic Git skill — practice on real repos.</p>

<h3>The "who has it" question</h3>
<p>Before any history-rewriting operation, ask: <em>who else has this branch?</em></p>
<table>
  <thead><tr><th>Answer</th><th>Action</th></tr></thead>
  <tbody>
    <tr><td>Just me, local only</td><td>Rebase / squash / amend freely</td></tr>
    <tr><td>Just me, pushed but no PR yet</td><td>Rebase + force-push fine; nobody depends on this</td></tr>
    <tr><td>Pushed; PR open; nobody else has based work on it</td><td>Rebase + force-push fine but document in PR ("rebased; please re-review")</td></tr>
    <tr><td>Multiple people working on the branch</td><td>Don't rebase. Use merge.</td></tr>
    <tr><td>Released / tagged / production</td><td>Never rewrite. Ever.</td></tr>
  </tbody>
</table>

<h3>The "rebase as conversation" model</h3>
<p>Interactive rebase is a conversation between you and your past self. You're saying: "This is what the work would have looked like if I'd been more organized." Goals:</p>
<ul>
  <li>Each commit is a logical unit (one feature, one fix, one refactor).</li>
  <li>Each commit message explains <em>why</em>, not just <em>what</em>.</li>
  <li>Tests pass at every commit (so bisect works).</li>
  <li>No "WIP" / "fix typo" / "address review feedback" noise.</li>
</ul>
<p>The discipline: write WIP commits while developing; clean up before pushing for review.</p>

<h3>The conflict-handling mental model</h3>
<p>Both merge and rebase can conflict, but differently:</p>
<table>
  <thead><tr><th>Operation</th><th>Conflict pattern</th></tr></thead>
  <tbody>
    <tr><td><strong>Merge</strong></td><td>Conflicts surface once at the merge point. Resolve once, commit, done.</td></tr>
    <tr><td><strong>Rebase</strong></td><td>Conflicts surface at each commit being replayed. Same conflict can recur if multiple commits touch the same lines. Resolve N times.</td></tr>
  </tbody>
</table>
<p>This is why long-running feature branches against an active main are sometimes better merged: rebasing 30 commits where commit 5 conflicts with main means resolving the same conflict at commits 5, 6, 7, ... up to whoever last touched it. Use <code>git rerere</code> to remember resolutions.</p>

<h3>The "history is documentation" principle</h3>
<p>Future-you (or future-someone) will git-blame a line and read the commit message. Good histories are documentation:</p>
<ul>
  <li>Bad: "WIP", "fix", "more changes", "address PR comments".</li>
  <li>Good: "Add retry to API client; previously failed silently on 503s. See incident #1234."</li>
</ul>
<p>Interactive rebase before merge is your last chance to make history into documentation.</p>

<h3>The decision flowchart</h3>
<pre><code>Integrating branch X into branch Y:

Is Y my local branch with no shared history?
  YES → rebase or merge, your taste; no consequences
  NO  → continue

Is X about to become part of Y permanently (i.e., I'm "merging X into Y")?
  Squash strategy: squash-merge (one clean commit on Y)
  Linear strategy: rebase X onto Y, then fast-forward Y to X
  Preserve strategy: merge commit (--no-ff)
  Decide based on team's policy

Am I just bringing latest Y into X (catching up)?
  Is X shared with others?
    YES → merge Y into X
    NO  → rebase X onto Y (cleaner history)</code></pre>

<h3>"What does the team see in git log?"</h3>
<p>Mental check before any merge/rebase: imagine running <code>git log --oneline -20</code> after the operation. Does it tell a useful story?</p>
<ul>
  <li>"Add user dashboard / Add settings page / Fix nav crash" → useful.</li>
  <li>"Merge branch 'feature/x' / Merge branch 'feature/y' / Merge branch 'fix/z' / Merge branch 'feature/x' (again, after rebase)" → noise.</li>
  <li>"WIP / WIP / fix / WIP / address comments / final" → undisciplined.</li>
</ul>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Basic merge</h3>
<pre><code># On feature branch, bring in main:
git checkout feature
git merge main           # creates merge commit if histories diverged
git merge --ff-only main # only fast-forward; fail if would create merge commit
git merge --no-ff main   # always create a merge commit, even if FF would work
git merge --squash main  # take all changes as a single staged change; you commit</code></pre>

<h3>Basic rebase</h3>
<pre><code># On feature branch, replay commits on top of main:
git checkout feature
git rebase main          # standard rebase
git rebase --onto X Y Z  # advanced: rebase commits between Y..Z onto X
git rebase --interactive HEAD~5  # interactive: edit last 5 commits
git rebase --abort       # mid-rebase: throw away progress, return to start
git rebase --continue    # mid-rebase: after resolving conflicts, continue
git rebase --skip        # mid-rebase: skip the current commit (rare, careful)</code></pre>

<h3>Interactive rebase: the senior-IC superpower</h3>
<pre><code>git rebase -i HEAD~5

Opens editor with:
pick a1b2c3d Add basic auth
pick d4e5f6a WIP - add JWT
pick 7g8h9i0 fix typo
pick j1k2l3m Add JWT (real implementation)
pick n4o5p6q Add tests for auth

Reorder, change "pick" to one of:
  pick    p — use commit
  reword  r — use commit, but edit message
  edit    e — use commit, but stop for amending
  squash  s — combine with previous, merge messages
  fixup   f — combine with previous, discard this message
  drop    d — remove commit
  exec    x — run shell command after this commit

Save and close. Git replays each step.</code></pre>

<p><strong>Common patterns:</strong></p>
<pre><code># Squash all WIP into one clean commit:
pick a1b2c3d Add basic auth
fixup d4e5f6a WIP - add JWT
fixup 7g8h9i0 fix typo
fixup j1k2l3m Add JWT (real implementation)
fixup n4o5p6q Add tests for auth

Result: one commit "Add basic auth" with all changes.

# Reword commit messages:
reword a1b2c3d Add basic auth        →  "Implement JWT-based auth flow"

# Reorder commits (edit order in the file before saving):
pick d4e5f6a Add JWT
pick a1b2c3d Add basic auth          # was first; now applies after JWT</code></pre>

<h3>"Rebase onto" — surgical history rewriting</h3>
<p>The advanced form. Use when you want to take a slice of commits and replay them somewhere else.</p>
<pre><code>State:
   main: A---B---C
              \\
   topic:      D---E---F---G---H

You want to keep only F---G---H, but on top of main:

git rebase --onto main E topic
# meaning: take commits AFTER E, up to topic (HEAD), and replay onto main

Result:
   main: A---B---C
              \\
              D---E (orphan; will be GC'd unless tagged)
                   \\
                    F'---G'---H' (new topic)</code></pre>

<p>Use case: you started feature work on a stale base, and want to drop early commits or move work to a different base.</p>

<h3>Merge with strategy</h3>
<pre><code># Standard merge (recursive strategy):
git merge feature

# Resolve our way (keep current branch's version on conflict):
git merge -X ours feature

# Resolve their way (keep merging branch's version on conflict):
git merge -X theirs feature

# Drop merge entirely if conflicts:
git merge --abort

# Re-do merge for the same branches:
# (often needed after fixing problems in either branch)
git reset --merge ORIG_HEAD  # mid-conflict; abort and reset</code></pre>

<h3>Force-push: handle with care</h3>
<pre><code># After local rebase, you must force-push to update remote:
git push --force            # DANGEROUS: overwrites remote regardless
git push --force-with-lease # SAFER: fails if remote was updated by someone else
git push --force-with-lease=feature  # explicit branch
</code></pre>
<p><strong>Always use <code>--force-with-lease</code></strong>. <code>--force</code> alone overwrites teammate work without warning.</p>

<h3>Pull strategies</h3>
<pre><code># Default behavior of "git pull" varies; configure explicitly:
git config --global pull.rebase true   # always rebase on pull
git config --global pull.rebase false  # always merge on pull (default)
git config --global pull.ff only       # fail unless fast-forward possible

# Per-pull:
git pull --rebase   # one-time rebase pull
git pull --no-rebase  # one-time merge pull
git pull --ff-only  # fail if can't fast-forward</code></pre>

<p>Recommendation: <code>pull.rebase true</code> + <code>pull.ff only</code> + <code>git pull</code> by default. If the pull would create a merge commit, you'll be told and can decide.</p>

<h3>Resolving conflicts</h3>
<pre><code># During merge or rebase conflict:
# 1. git status              — shows conflicted files
# 2. Open each file, look for &lt;&lt;&lt;&lt;&lt;&lt;&lt; / ======= / &gt;&gt;&gt;&gt;&gt;&gt;&gt; markers
# 3. Edit to desired result
# 4. git add &lt;file&gt;          — mark resolved
# 5. git rebase --continue   — or git merge --continue
# 6. git status              — confirm clean

# Conflict-helper tools:
git mergetool              # opens configured merge tool (vimdiff, kdiff3, etc.)

# See "what's the conflict actually about":
git diff                   # shows in-progress merge state
git log --merge --oneline  # commits involved in merge

# rerere: remember conflict resolutions
git config --global rerere.enabled true
# Now Git remembers your conflict resolutions and re-applies them next time
# Useful for long-running rebases that hit the same conflict repeatedly</code></pre>

<h3>The "rebase as you go" workflow</h3>
<pre><code># While developing on feature branch:

# Day 1
git checkout -b feature
# ... work ...
git commit -m "WIP: stub out API client"

# Day 2
# Update from main:
git fetch origin
git rebase origin/main
# ... continue work ...
git commit -m "WIP: add retry logic"

# Day 3 (ready for PR)
git rebase -i HEAD~3   # squash WIP into clean commit
git rebase origin/main # one more update from main
git push --force-with-lease origin feature

# Open PR. Reviewer comments. Fix:
git commit --fixup &lt;commit-being-fixed&gt;
git rebase -i --autosquash origin/main  # auto-fixup positions the commit
git push --force-with-lease origin feature

# After approval, squash-merge or rebase-merge via PR UI.</code></pre>

<h3>The merge-strategy options on PR</h3>
<table>
  <thead><tr><th>Option</th><th>What it does</th><th>When</th></tr></thead>
  <tbody>
    <tr><td>Create merge commit</td><td>Always merges with --no-ff (creates a commit)</td><td>You want preserve-feature-branch boundary</td></tr>
    <tr><td>Squash and merge</td><td>Squashes all PR commits into one on main</td><td>Most common; clean main history; easy revert</td></tr>
    <tr><td>Rebase and merge</td><td>Replays each PR commit onto main as new commits</td><td>You want individual PR commits in main; linear history</td></tr>
  </tbody>
</table>

<h3>Tagged for safety</h3>
<pre><code># Before risky rebase, tag your starting point:
git tag pre-rebase-backup

# Now if you mess up:
git reset --hard pre-rebase-backup

# Delete tag when done:
git tag -d pre-rebase-backup</code></pre>

<h3>Aliases that save your hands</h3>
<pre><code># In ~/.gitconfig under [alias]:
lg = log --graph --pretty=format:'%C(yellow)%h%Creset -%C(red)%d%Creset %s %C(green)(%cr) %C(blue)&lt;%an&gt;%Creset' --abbrev-commit
co = checkout
br = branch
ri = rebase --interactive
rc = rebase --continue
ra = rebase --abort
fix = commit --fixup
amend = commit --amend --no-edit
fp = push --force-with-lease

# Now: git lg, git ri HEAD~5, git fp, etc.</code></pre>
`
    },
    {
      id: 'examples',
      title: '🔍 Worked Examples',
      html: `
<h3>Example 1: Cleaning up a feature branch before PR</h3>
<p><strong>Setup:</strong> You've been working on a feature for 3 days. Your commit log looks like this:</p>
<pre><code>git log --oneline
9a8b7c6 fix typo
5d4e3f2 address feedback from pairing
1g2h3i4 WIP
4j5k6l7 fix lint
8m9n0p1 actual fix for the auth bug
2q3r4s5 WIP try with cookies
6t7u8v9 begin work on auth bug</code></pre>

<p><strong>Goal:</strong> One clean commit "Fix auth bug: tokens not refreshing on session expiry" before pushing for review.</p>

<pre><code>git rebase -i HEAD~7

# Editor opens:
pick 6t7u8v9 begin work on auth bug
pick 2q3r4s5 WIP try with cookies
pick 8m9n0p1 actual fix for the auth bug
pick 4j5k6l7 fix lint
pick 1g2h3i4 WIP
pick 5d4e3f2 address feedback from pairing
pick 9a8b7c6 fix typo

# Change to:
pick 8m9n0p1 actual fix for the auth bug
fixup 6t7u8v9 begin work on auth bug
fixup 2q3r4s5 WIP try with cookies
fixup 4j5k6l7 fix lint
fixup 1g2h3i4 WIP
fixup 5d4e3f2 address feedback from pairing
fixup 9a8b7c6 fix typo

# Save. Then:
git commit --amend
# Edit message:
"Fix auth bug: tokens not refreshing on session expiry

Previously, expired tokens were detected but the refresh request
was sent without the renewed cookie, causing infinite 401 loops.
This change ensures the cookie jar is updated before retry.

See incident #2034."

git push --force-with-lease origin feature/auth-bug</code></pre>

<p><strong>Result:</strong> One commit. Clean. Documents the why. Ready for review.</p>

<h3>Example 2: Updating a long-running feature branch</h3>
<p><strong>Setup:</strong> Feature branch has been alive for 2 weeks. main has moved forward ~50 commits. You need to integrate.</p>

<p><strong>Option A: rebase (preferred for unshared work)</strong></p>
<pre><code>git checkout feature/big-thing
git fetch origin
git rebase origin/main

# Likely conflicts. For each:
# 1. git status
# 2. Edit conflicted files
# 3. git add &lt;file&gt;
# 4. git rebase --continue

# If you hit the same conflict at multiple commits, enable rerere:
git config rerere.enabled true
# Subsequent identical conflicts auto-resolve.

# After rebase complete:
git push --force-with-lease origin feature/big-thing</code></pre>

<p><strong>Option B: merge (preferred for shared / long-running)</strong></p>
<pre><code>git checkout feature/big-thing
git fetch origin
git merge origin/main

# Resolve conflicts once (not per-commit).
# Commit the merge.
git push origin feature/big-thing  # no force needed</code></pre>

<p><strong>When each:</strong></p>
<ul>
  <li>If you alone work on feature: rebase.</li>
  <li>If multiple engineers work on feature: merge.</li>
  <li>If conflicts are gnarly and there are many commits: merge (avoid replaying same conflict).</li>
</ul>

<h3>Example 3: Hotfix on a release branch</h3>
<p><strong>Setup:</strong> You're shipping app v3.5. Production bug found in v3.4. You need to:</p>
<ol>
  <li>Fix on the v3.4 release branch.</li>
  <li>Cut v3.4.1 hotfix.</li>
  <li>Get the fix forward into main and v3.5.</li>
</ol>

<pre><code># 1. Branch from v3.4 tag, fix, tag, ship:
git checkout -b hotfix/v3.4.1 v3.4.0
# ... fix the bug, commit ...
git commit -m "Fix crash on iOS 16 when refreshing during scroll"
git tag v3.4.1
git push origin hotfix/v3.4.1 v3.4.1

# 2. Merge fix into main:
git checkout main
git merge --no-ff hotfix/v3.4.1
git push origin main

# 3. If v3.5 is on a separate release branch:
git checkout release/v3.5
git cherry-pick &lt;hotfix-commit-sha&gt;
git push origin release/v3.5

# Or merge:
git merge --no-ff hotfix/v3.4.1
# (cherry-pick is cleaner for single-commit hotfixes)</code></pre>

<p>See <a href="#" data-topic="git-cherry">Cherry-Pick</a> for the cherry-pick variant.</p>

<h3>Example 4: Recovering from a bad rebase</h3>
<p><strong>Setup:</strong> You did <code>git rebase main</code> on feature, hit conflicts, resolved badly, force-pushed. Now production behavior is broken because you accidentally undid your fix.</p>

<pre><code># Step 1: Don't panic. Don't make more changes.

# Step 2: Find your previous state in reflog:
git reflog
# Output:
# abc1234 HEAD@{0}: rebase finished: returning to refs/heads/feature
# def5678 HEAD@{1}: rebase: pick &lt;sha&gt;
# ghi9012 HEAD@{2}: rebase: pick &lt;sha&gt;
# jkl3456 HEAD@{3}: rebase: checkout main
# mno7890 HEAD@{4}: commit: Fix the production bug   ← THIS is what I want
# ...

# Step 3: Reset to the pre-rebase state:
git reset --hard mno7890

# Step 4: Verify:
git log --oneline
# Confirm the fix is back.

# Step 5: Push (carefully, since you've already force-pushed once):
git push --force-with-lease origin feature
# If anyone pulled the broken version, they'll need to reset too.
# Tell them.</code></pre>

<p>See <a href="#" data-topic="git-recovery">Recovery (reflog etc.)</a> for the full recovery toolkit.</p>

<h3>Example 5: Splitting one commit into multiple</h3>
<p><strong>Setup:</strong> One commit contains two unrelated changes (auth fix + UI tweak). Reviewer asks you to separate them.</p>

<pre><code># Find the commit:
git log --oneline
# abc1234 Auth fix and UI tweak

# Interactive rebase:
git rebase -i abc1234^
# Use 'edit' instead of 'pick' for that commit:
edit abc1234 Auth fix and UI tweak

# Save. Git stops at the commit, leaves changes staged.
# Reset to undo the commit but keep the changes:
git reset HEAD^
# Now changes are unstaged. Stage selectively:
git add path/to/auth/files
git commit -m "Fix auth: handle 401 on stale tokens"

git add path/to/ui/files
git commit -m "Tweak login button spacing"

# Continue rebase:
git rebase --continue

# Push:
git push --force-with-lease origin feature</code></pre>

<h3>Example 6: When rebase is the wrong choice</h3>
<p><strong>Setup:</strong> You're working on a shared feature branch. Two other engineers have local commits based on the current tip.</p>

<p><strong>If you rebase shared/feature onto main and force-push:</strong></p>
<ul>
  <li>Their local commits now reference an obsolete parent.</li>
  <li>Their next pull tries to merge old + new histories. Mess.</li>
  <li>Their PRs based on the branch break.</li>
  <li>Trust collapses.</li>
</ul>

<p><strong>Right approach:</strong></p>
<pre><code>git checkout shared/feature
git merge origin/main   # not rebase
# Resolve conflicts. Commit.
git push origin shared/feature   # no force needed</code></pre>

<p>Default: rebase what you alone touch; merge what others touch.</p>

<h3>Example 7: Preserving a complex merge resolution</h3>
<p><strong>Setup:</strong> You merged two large branches. Conflict resolution took 2 hours. You want to ensure the resolution is preserved if you ever need to do this again.</p>

<pre><code># Enable rerere globally:
git config --global rerere.enabled true

# Now during your conflict resolution, Git remembers each:
# When you hit the same conflict in a future merge or rebase,
# Git auto-applies your prior resolution.

# Confirm a resolution was recorded:
ls .git/rr-cache/

# Manually save a current resolution:
git rerere

# Forget a bad resolution:
git rerere forget &lt;file&gt;</code></pre>

<h3>Example 8: The "rebase to test each commit independently" pattern</h3>
<p><strong>Setup:</strong> You want to ensure tests pass at every commit (so bisect works later).</p>

<pre><code>git rebase -i origin/main \\
  --exec "npm test"

# Git replays each commit, runs npm test after each.
# Stops on any failure. You can fix and continue.

# Or use --exec to run linting:
git rebase -i origin/main --exec "npm run lint"

# This is the "bisectable history" discipline. Senior-engineer move.</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Rebasing with tags</h3>
<p>Tags reference specific commit SHAs. After rebase, those SHAs are gone (replaced by new ones with same content but different metadata).</p>
<ul>
  <li><strong>Lightweight tags</strong> just dangle in space; reflog can find them.</li>
  <li><strong>Annotated tags</strong> may need to be recreated.</li>
  <li><strong>Released tags</strong> (e.g., <code>v3.4.0</code>) — never rebase past them. They're contracts with the world.</li>
</ul>

<h3>Rebasing with submodules</h3>
<p>Rebases that change submodule references can be tricky:</p>
<ul>
  <li>Each commit in the rebase may have a different submodule SHA.</li>
  <li>Submodule conflicts during rebase are common.</li>
  <li>Recommendation: minimize rebases on branches that touch submodule references; if you must, run <code>git submodule update --init --recursive</code> after every <code>--continue</code>.</li>
</ul>

<h3>Rebasing with binary files / large files / LFS</h3>
<p>Rebases of branches with large binary changes (PNGs, MP4s, lockfiles, native build artifacts) replay each commit, materializing each version. Slow.</p>
<ul>
  <li>For mobile / RN: <code>Pods.lock</code>, <code>Podfile.lock</code>, native build outputs accumulate.</li>
  <li>Use <code>.gitattributes</code> with <code>merge=ours</code> for files where rebase should "just keep mine":</li>
</ul>
<pre><code># .gitattributes
*.lock merge=ours
ios/Podfile.lock merge=ours

# Configure the strategy:
git config --global merge.ours.driver true</code></pre>

<h3>The "interrupted rebase" recovery</h3>
<p>Mid-rebase, your laptop crashes. Or you got distracted. Now what?</p>
<pre><code># Check status:
git status
# If "rebase in progress" appears:

# Continue if you've resolved conflicts:
git rebase --continue

# Abort if you want to bail:
git rebase --abort

# Skip the current commit (rare, careful):
git rebase --skip

# If status is confusing, look at the rebase state:
ls .git/rebase-merge/        # interactive rebase
ls .git/rebase-apply/        # standard rebase
# These dirs hold the rebase metadata; deletion + reflog reset = clean restart</code></pre>

<h3>Rebasing across renames / file moves</h3>
<p>Git's rename detection is heuristic. If you rebase across a major file rename:</p>
<ul>
  <li>Heuristic may miss the rename; you get "file deleted in main, modified in feature" conflicts.</li>
  <li>Use <code>git rebase -X find-renames=20%</code> to lower the threshold.</li>
  <li>For massive renames, sometimes merge is more reliable than rebase.</li>
</ul>

<h3>Rebasing with multiple remotes</h3>
<p>If you have a fork (origin = your fork; upstream = canonical repo), rebase target matters:</p>
<pre><code>git fetch upstream
git rebase upstream/main   # rebase against canonical, not your fork's main</code></pre>

<h3>Force-pushing during code review</h3>
<p>Force-pushing during open PR is generally fine (often required after rebase) but breaks reviewer flows:</p>
<ul>
  <li>GitHub / GitLab show "X force-pushed" notice; reviewers can sometimes diff between force-pushes.</li>
  <li>Rebase-only commits with no content change (just rebased onto fresh main) can confuse reviewers — note in PR description.</li>
  <li>If PR is mid-review, prefer adding "fixup" commits, then squash at merge time. Avoids force-push churn.</li>
</ul>

<h3>The "merge commit on rebase" surprise</h3>
<p>When you rebase a branch that includes its own merge commits, by default Git "linearizes" — merges are flattened. To preserve:</p>
<pre><code>git rebase --rebase-merges origin/main   # preserves merge commits in feature
# (formerly: --preserve-merges, deprecated)</code></pre>

<h3>Octopus merges</h3>
<p>Merging more than 2 branches at once. Rare and usually a sign of process problems.</p>
<pre><code>git merge feature1 feature2 feature3   # octopus
# Default strategy can't handle conflicts in octopus; use carefully.
# Don't octopus if any two branches have overlapping changes.</code></pre>

<h3>Rebasing onto an unrelated history</h3>
<p>Sometimes you want to graft a branch onto a totally different repo's history (e.g., monorepo migration).</p>
<pre><code>git rebase --root --onto &lt;target-sha&gt;
# Replays all commits in current branch onto target, ignoring original parent
# Use case: migrating a project into a monorepo, preserving history.</code></pre>

<h3>The "I rebased main accidentally" disaster</h3>
<p>You rebased <code>main</code> locally onto something else. You haven't pushed. Recovery:</p>
<pre><code>git reflog | grep main
# Find a 'commit:' or 'reset:' entry that's the pre-rebase main:
# abc1234 HEAD@{20}: commit: ... (this is pre-rebase main)

git reset --hard abc1234</code></pre>
<p>If you pushed: depending on policy, may have force-pushed bad main. Coordinate with team to recover; everyone needs to reset their local main.</p>

<h3>The "merging in a wrong direction" trap</h3>
<p>You meant <code>git merge feature</code> on main; instead did <code>git merge main</code> on feature. Now feature has main's commits but not the integration:</p>
<ul>
  <li>This is usually fine — feature now has main's stuff. Continue developing.</li>
  <li>If you don't want main's commits in feature: <code>git reset --hard ORIG_HEAD</code> (before pushing).</li>
</ul>

<h3>Rebase blowing up commit metadata</h3>
<p>Rebase changes commit SHAs but preserves author, timestamp, message. Other metadata (signatures, GPG signing) may not survive:</p>
<ul>
  <li>If your team requires GPG signing, configure <code>commit.gpgsign true</code> + <code>rebase.signoff true</code>.</li>
  <li>After rebase, verify with <code>git log --show-signature</code>.</li>
</ul>

<h3>The "rebase pulled in commits I didn't want" surprise</h3>
<p><code>git rebase main</code> assumes you want all of main's new commits as your base. If main has gone forward in ways you don't want:</p>
<pre><code># Rebase only onto a specific commit, not full main:
git rebase --onto &lt;target-sha&gt; &lt;old-base-sha&gt; &lt;branch&gt;</code></pre>

<h3>Rebasing on a branch you'll never merge back</h3>
<p>Sometimes you rebase a branch onto another, knowing the result will diverge permanently (experimental fork). Be aware:</p>
<ul>
  <li>Tag your starting point.</li>
  <li>Document the divergence.</li>
  <li>Don't accidentally fast-forward main from this branch later.</li>
</ul>

<h3>Mobile-specific: rebasing across native build config changes</h3>
<p>Mobile codebases have many native config files (Pods.lock, Gemfile.lock, build.gradle dependency hashes) that change frequently and cause rebase conflicts:</p>
<ul>
  <li>Many teams use <code>.gitattributes</code> with <code>merge=ours</code> for these files.</li>
  <li>Re-run <code>pod install</code> / <code>bundle install</code> after rebase to regenerate.</li>
  <li>Don't try to manually merge lockfile conflicts; regenerate.</li>
</ul>
`
    },
    {
      id: 'bugs',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Anti-pattern: rebasing shared branches</h3>
<p><strong>Looks like:</strong> Rebase a branch others have based work on; force-push.</p>
<p><strong>Why bad:</strong> Their commits reference now-orphaned SHAs. Their pull becomes a mess. Trust damage.</p>
<p><strong>Fix:</strong> Once shared, only merge into. If you must rebase, coordinate explicitly with everyone affected.</p>

<h3>Anti-pattern: <code>git push --force</code></h3>
<p><strong>Looks like:</strong> Use <code>--force</code> instead of <code>--force-with-lease</code>.</p>
<p><strong>Why bad:</strong> If teammate pushed in the meantime, their commits get silently overwritten.</p>
<p><strong>Fix:</strong> Always <code>--force-with-lease</code>. Alias <code>git fp</code> to it.</p>

<h3>Anti-pattern: WIP commits in main</h3>
<p><strong>Looks like:</strong> Squash-merge a PR that contains "WIP" commits in the squash result.</p>
<p><strong>Why bad:</strong> Main history reads like noise.</p>
<p><strong>Fix:</strong> Interactive rebase before merging. Clean commit messages on main.</p>

<h3>Anti-pattern: 50-commit feature PR with no squashing</h3>
<p><strong>Looks like:</strong> Long-lived feature branch merged with all WIP commits intact.</p>
<p><strong>Why bad:</strong> Reviewer can't follow; bisect noise; revert is 50 reverts.</p>
<p><strong>Fix:</strong> Squash before merge OR rebase to ~5-10 logical commits OR break into multiple PRs.</p>

<h3>Anti-pattern: merging without pulling first</h3>
<p><strong>Looks like:</strong> <code>git push</code> fails (remote has new commits); engineer does <code>git pull && git push</code> creating a merge bubble.</p>
<p><strong>Why bad:</strong> Merge bubbles in main from "I forgot to pull" history. Looks unprofessional.</p>
<p><strong>Fix:</strong> <code>git pull --rebase</code> by default. Or set <code>pull.rebase true</code>.</p>

<h3>Anti-pattern: amending public commits</h3>
<p><strong>Looks like:</strong> <code>git commit --amend</code> after pushing.</p>
<p><strong>Why bad:</strong> Same as rebasing shared history — others have the old commit.</p>
<p><strong>Fix:</strong> Only amend before pushing. After push, write a new commit "Fix typo from previous commit."</p>

<h3>Anti-pattern: ignoring conflicts and using --skip</h3>
<p><strong>Looks like:</strong> Hit conflict in rebase; can't figure out resolution; <code>git rebase --skip</code>.</p>
<p><strong>Why bad:</strong> The commit's changes are silently dropped. You may not realize until production.</p>
<p><strong>Fix:</strong> Resolve conflicts properly. <code>--skip</code> only when you've verified the commit's changes are no longer relevant.</p>

<h3>Anti-pattern: long-running feature branches</h3>
<p><strong>Looks like:</strong> Feature branch alive 3+ months; main has moved 200 commits.</p>
<p><strong>Why bad:</strong> Massive merge conflicts. Dependencies drift. Team forgets the feature exists.</p>
<p><strong>Fix:</strong> Break into smaller PRs. Use feature flags. Rebase weekly. Merge to main early and often even if not "done."</p>

<h3>Anti-pattern: committing dotfiles / IDE configs / OS files</h3>
<p><strong>Looks like:</strong> <code>.idea/</code>, <code>.DS_Store</code>, <code>*.swp</code>, IDE settings in commits.</p>
<p><strong>Why bad:</strong> Noise. Conflicts. Personal info leaks.</p>
<p><strong>Fix:</strong> <code>.gitignore</code> aggressively. Use a global gitignore for personal items: <code>git config --global core.excludesfile ~/.gitignore_global</code>.</p>

<h3>Anti-pattern: committing secrets</h3>
<p><strong>Looks like:</strong> API keys, .env files, certs in commits.</p>
<p><strong>Why bad:</strong> Once pushed, they're public history. Even after removal, the SHA contains them; rotate the secret.</p>
<p><strong>Fix:</strong> .gitignore. Pre-commit hooks (<code>git secrets</code>, <code>truffleHog</code>). If a secret leaks, rotate immediately + use <code>git filter-repo</code> to scrub.</p>

<h3>Anti-pattern: massive PRs with cosmetic + functional changes</h3>
<p><strong>Looks like:</strong> One PR has the bug fix + reformatting of 200 unrelated files.</p>
<p><strong>Why bad:</strong> Review impossible. Bisect impossible. Revert dangerous.</p>
<p><strong>Fix:</strong> Separate cosmetic / refactor PRs from functional changes. Land cosmetic first, then functional on top.</p>

<h3>Anti-pattern: not testing after rebase</h3>
<p><strong>Looks like:</strong> Rebase, force-push, ship — without re-running tests.</p>
<p><strong>Why bad:</strong> Conflicts may have introduced bugs that compile but don't work.</p>
<p><strong>Fix:</strong> Always run full test suite after rebase + before merging. CI usually catches this; don't skip CI.</p>

<h3>Anti-pattern: rebasing onto a moving target</h3>
<p><strong>Looks like:</strong> Rebase onto <code>main</code> while CI / fellow engineers are pushing to main.</p>
<p><strong>Why bad:</strong> By the time you finish, main has moved again. Repeat indefinitely.</p>
<p><strong>Fix:</strong> Rebase against a specific SHA (not <code>main</code>). Or rebase + push quickly. Or use a "merge queue" tool (Bors, Mergify).</p>

<h3>Anti-pattern: deleting branches without checking</h3>
<p><strong>Looks like:</strong> <code>git branch -D feature</code> when it had unmerged commits.</p>
<p><strong>Why bad:</strong> -D forces deletion; commits orphaned. Sometimes intentional, often accidental.</p>
<p><strong>Fix:</strong> Use <code>-d</code> (lowercase) which fails if unmerged. Use <code>-D</code> only when you're certain. Reflog is the recovery path.</p>

<h3>Anti-pattern: confusing <code>git reset</code> modes</h3>
<p><strong>Looks like:</strong> Use <code>--hard</code> when you meant <code>--soft</code>; lose work.</p>
<p><strong>Why bad:</strong> <code>--hard</code> discards working tree changes; recovery is via reflog (commits) but uncommitted changes are gone.</p>
<p><strong>Fix:</strong> Internalize the modes:</p>
<ul>
  <li><code>--soft</code>: move HEAD; staging + working tree intact.</li>
  <li><code>--mixed</code> (default): move HEAD + staging; working tree intact.</li>
  <li><code>--hard</code>: move HEAD + staging + working tree. Destructive.</li>
</ul>

<h3>Anti-pattern: not setting <code>rerere.enabled true</code></h3>
<p><strong>Looks like:</strong> Resolve the same merge conflict 5 times across rebases.</p>
<p><strong>Why bad:</strong> Wasted hours.</p>
<p><strong>Fix:</strong> <code>git config --global rerere.enabled true</code>. One-time setup, lifetime payoff.</p>

<h3>Anti-pattern: arguing about workflow in every PR</h3>
<p><strong>Looks like:</strong> Team has no documented Git workflow; every PR has a fresh debate about merge vs. rebase vs. squash.</p>
<p><strong>Why bad:</strong> Wastes time. Inconsistent history.</p>
<p><strong>Fix:</strong> Write a 1-page Git workflow doc for the team. Commit message style, branch naming, merge strategy. Reference in every onboarding.</p>
`
    },
    {
      id: 'interview',
      title: '🎤 Interview Patterns',
      html: `
<h3>"Explain rebase vs. merge"</h3>
<p>Common opener. Strong answer hits both mechanics + when to use which.</p>

<pre><code>"Both integrate one branch into another but produce different histories.

Merge creates a new commit with two parents — preserves the fact
that two branches diverged and joined. History records the
integration as a graph.

Rebase replays each of your commits on top of the target branch,
creating new commits with new SHAs. History looks linear, as if
you'd developed from the new base all along.

When to use which:
- Rebase when the work is yours alone and you want clean linear
  history before sharing.
- Merge when integrating a feature into a shared branch (main)
  and you want the integration to be visible.
- Never rebase a branch others have based work on — that
  rewrites their history and breaks them.

Most modern teams squash-merge feature branches into main:
linear history but each PR is a single commit, easy to revert."</code></pre>

<h3>"What does <code>git rebase -i</code> do?"</h3>
<pre><code>"Interactive rebase. Lets me edit a sequence of commits before
they're applied to the new base.

Operations available: pick (use), reword (edit message), edit
(stop for amending), squash (merge with previous, keep both
messages), fixup (merge with previous, drop message), drop
(remove), and exec (run shell command).

Most common use: cleaning up WIP commits before pushing for
review. I'll typically have 5-10 'WIP' commits during dev,
then squash them into 1-2 logical commits with proper messages
before opening the PR."</code></pre>

<h3>"How do you resolve a rebase conflict"</h3>
<pre><code>"Same as merge conflict at first — git shows you the &lt;&lt;&lt; / === /
&gt;&gt;&gt; markers, you edit to the desired result, git add, then
git rebase --continue.

Difference from merge: rebase replays one commit at a time, so
you may hit the same logical conflict multiple times if multiple
commits touch the same lines. Two solutions:
1. Enable rerere (rerere.enabled = true) so Git auto-applies
   the same resolution on subsequent identical conflicts.
2. If conflicts are extreme, abort and use merge instead — one
   resolution covers everything.

If I'm deep in a rebase and don't trust my resolution, I do
git rebase --abort, return to start, plan the integration more
carefully, and try again."</code></pre>

<h3>"What's the difference between <code>--force</code> and <code>--force-with-lease</code>?"</h3>
<pre><code>"--force overwrites the remote unconditionally — even if someone
else pushed in the meantime; their work gets blown away silently.

--force-with-lease checks that the remote is at the SHA you last
fetched. If someone else pushed, the push fails and you have a
chance to investigate.

Always use --force-with-lease. The only time I'd use --force is
if --force-with-lease fails for a reason I've verified is safe."</code></pre>

<h3>"How do you fix a commit you've already pushed?"</h3>
<pre><code>"Depends on whether others have pulled it.

If only me / pre-PR review: I rebase or amend, then force-push
with --force-with-lease. Note in PR if relevant.

If others may have based work on it (shared branch, post-merge
to main): I write a new commit that fixes the issue.
'Fix typo from abc1234' or 'Revert commit X due to Y, replaced
with Z'. Never rewrite shared history.

Even for my own PR, if there's been substantial review activity,
I sometimes prefer fixup commits + auto-squash on merge over
mid-review force-pushes — keeps the review threads attached to
the right code."</code></pre>

<h3>"Tell me about a Git mistake you've made"</h3>
<p>Senior interviews; tests humility + recovery skill.</p>

<pre><code>"Force-pushed over a teammate's commit early in my career. I'd
rebased my feature branch but didn't realize they'd pushed a fix
to it that morning. My push went through with --force; their
commit was orphaned.

Recovery: their commit was still in my reflog (from when I'd
fetched). I cherry-picked their commit, push --force-with-lease
to restore it, and confessed.

Lesson: --force-with-lease as default. Also: communicate before
force-pushing to a shared branch — even a quick 'about to rebase
shared/feature, anyone have unpushed work?' avoids this entirely.

Now I have an alias 'git fp' that maps to --force-with-lease;
making the safer behavior the default removes the temptation."</code></pre>

<h3>"What's your team's Git workflow?"</h3>
<p>Behavioral. They want to see you have a position + reasoning.</p>

<pre><code>"My current team uses trunk-based with squash-merge. Each PR is
a single commit on main, named for the PR number and title.
Reasoning:
- Easy revert (one commit per PR).
- Clean main history; bisect works cleanly.
- Doesn't punish engineers who develop in many small WIP commits.

Within feature branches, I personally rebase + interactive-rebase
before pushing. Squash-merge means individual feature commits
are lost on main, but it forces me to think about my work as a
unit.

For long-lived branches (release branches, long-running features),
we use merge instead of rebase — too many people involved to
safely rewrite history."</code></pre>

<h3>"Explain reflog"</h3>
<pre><code>"Reflog is a per-local-repo history of where HEAD has pointed.
Every commit, checkout, reset, rebase moves HEAD; reflog records
each move with a timestamp and a 'reason' (commit, rebase, reset,
etc.).

The killer feature: reflog includes orphaned commits — commits
that no branch / tag references anymore but are still in the
object database.

Most common use: 'I rebased and lost my work.' git reflog shows
the pre-rebase HEAD; git reset --hard &lt;sha&gt; restores it.

Reflog only exists in your local repo and only persists for ~90
days by default before garbage collection. So recovery has to
happen quickly. Push critical work to remote (even a personal
backup branch) for true safety."</code></pre>

<h3>"How do you maintain a clean Git history"</h3>
<pre><code>"A few habits:

1. Interactive rebase before push. Squash WIP into logical units.
2. Commit messages have a 50-char subject and a body explaining
   why. Reference issues / incidents.
3. Tests pass at every commit (use git rebase --exec to verify).
4. Don't commit unrelated changes together. One commit, one
   logical change.
5. Don't commit generated files, IDE configs, secrets.
6. Squash-merge PRs by default; team-level setting.
7. Keep feature branches short-lived (under a week).

The discipline pays back: bisect works, blame works, revert
works, code archeology is informative."</code></pre>

<h3>Common follow-ups</h3>
<table>
  <thead><tr><th>Question</th><th>What they're checking</th></tr></thead>
  <tbody>
    <tr><td>"Difference between fetch and pull?"</td><td>Whether you understand fetch is read-only, pull = fetch + merge/rebase</td></tr>
    <tr><td>"What's a fast-forward merge?"</td><td>When merging branch is a direct descendant of base; no merge commit needed</td></tr>
    <tr><td>"What does <code>git cherry-pick</code> do?"</td><td>See <a href="#" data-topic="git-cherry">Cherry-Pick</a></td></tr>
    <tr><td>"How do you find which commit broke a feature?"</td><td>See <a href="#" data-topic="git-bisect">Bisect</a></td></tr>
    <tr><td>"What if I committed to the wrong branch?"</td><td>Cherry-pick to right branch, reset wrong branch</td></tr>
    <tr><td>"How do you maintain a fork in sync with upstream?"</td><td>Fetch upstream, rebase / merge into your branches, push to fork</td></tr>
  </tbody>
</table>

<h3>The 30-second mantra</h3>
<p><em>"Rebase your local work for cleanliness; merge to integrate to shared branches. Never rewrite shared history. Interactive rebase is the senior-IC superpower. --force-with-lease, never --force. Reflog saves you when you mess up."</em></p>
<p>Git is one of the few skills that compounds across your entire career; the time you invest in mastering rebase, interactive rebase, and recovery patterns pays back every week for decades.</p>
`
    }
  ]
});
