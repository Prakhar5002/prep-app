window.PREP_SITE.registerTopic({
  id: 'git-cherry',
  module: 'git',
  title: 'Cherry-Pick',
  estimatedReadTime: '30 min',
  tags: ['git', 'cherry-pick', 'hotfix', 'backport', 'release-branch', 'workflow'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>Cherry-pick takes a commit (or range of commits) from one branch and applies it to another. It's the surgical tool for "I want this specific change over there." Senior engineers use it constantly: hotfixing release branches, propagating critical fixes, salvaging work from abandoned branches, building release trains.</p>
<ul>
  <li><strong>Cherry-pick replays a commit's diff</strong> on top of the current branch and creates a new commit with a new SHA but the same content (and usually message).</li>
  <li><strong>Use case 1 (most common):</strong> hotfix on main → cherry-pick to active release branch (mobile v3.5 in production while main is on v3.6 dev).</li>
  <li><strong>Use case 2:</strong> teammate's PR has a fix you need; cherry-pick before their PR merges.</li>
  <li><strong>Use case 3:</strong> rescue a commit from an abandoned branch.</li>
  <li><strong>Mark cherry-picked commits</strong> with <code>-x</code> to add a "(cherry picked from commit ...)" line; aids future archeology.</li>
  <li><strong>Cherry-picking creates duplicate work,</strong> not branch reconciliation. The picked commit and its source remain separate; if you later merge / rebase, Git may detect duplication or may leave both as separate commits.</li>
  <li><strong>Conflicts in cherry-pick are common</strong> when source and target branches have diverged significantly.</li>
  <li><strong>Mobile / RN context:</strong> cherry-pick is your primary hotfix workflow when you have a release branch in production and main on a newer dev cycle.</li>
</ul>
<p><strong>Mantra:</strong> "Cherry-pick is surgical. Use <code>-x</code> to record provenance. Resolve conflicts carefully. Test after picking. Don't cherry-pick the same fix twice."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What cherry-pick does</h3>
<p>Mechanically, <code>git cherry-pick &lt;sha&gt;</code>:</p>
<ol>
  <li>Computes the diff between the cherry-picked commit and its parent.</li>
  <li>Applies that diff to the current HEAD.</li>
  <li>Creates a new commit on the current branch with the same author, message (optionally with a "cherry picked from" footer), but a new SHA.</li>
</ol>

<pre><code>Before:
   main:    A---B---C---D---E
   release: A---B---F

cherry-pick D from release:
   main:    A---B---C---D---E
   release: A---B---F---D' (new commit, same content as D)</code></pre>

<h3>Why cherry-pick exists</h3>
<p>Some integrations need surgical precision. You don't want to merge — that pulls everything. You don't want to rebase — that doesn't apply here (different histories). You want exactly this one change, applied in this specific place.</p>
<table>
  <thead><tr><th>Scenario</th><th>Why cherry-pick</th></tr></thead>
  <tbody>
    <tr><td>Hotfix to release branch</td><td>Main has 50 unrelated changes; you only want the fix</td></tr>
    <tr><td>Backport critical fix</td><td>Active major version + LTS branch both need it; cherry-pick to LTS</td></tr>
    <tr><td>Pull a single change from a peer's PR</td><td>You need their fix now; their PR isn't merging for a week</td></tr>
    <tr><td>Salvage from abandoned branch</td><td>Branch will be deleted; one commit is still useful</td></tr>
    <tr><td>Test a single change in isolation</td><td>Try the change without rest of the branch's context</td></tr>
    <tr><td>Move work between unrelated branches</td><td>Code moved to wrong branch; rescue without restructuring</td></tr>
  </tbody>
</table>

<h3>The mobile / RN context</h3>
<p>Cherry-pick is the canonical mobile-team hotfix workflow:</p>
<pre><code>Timeline:
- v3.5.0 in App Store (live)
- main has progressed to v3.6 development
- Critical crash found in v3.5

Process:
1. Fix on main (or on a hotfix branch off the v3.5 tag).
2. Cherry-pick fix to release/v3.5 branch.
3. Tag v3.5.1.
4. Build, ship to App Store / Play Store.
5. Verify fix is also in main (it is, since you started there).</code></pre>

<p>Variations:</p>
<ul>
  <li>Some teams: fix on hotfix branch, cherry-pick to <em>both</em> main and release.</li>
  <li>Some teams: fix on release, cherry-pick to main.</li>
  <li>Either works; team should pick a default.</li>
</ul>

<h3>Cherry-pick vs. merge vs. rebase</h3>
<table>
  <thead><tr><th></th><th>Merge</th><th>Rebase</th><th>Cherry-pick</th></tr></thead>
  <tbody>
    <tr><td>Brings what?</td><td>All of branch B's commits since divergence</td><td>Replays current branch on B's history</td><td>One specific commit (or range)</td></tr>
    <tr><td>Creates what?</td><td>1 merge commit</td><td>N new commits replacing N old</td><td>1 new commit per pick</td></tr>
    <tr><td>History?</td><td>Branchy</td><td>Linear</td><td>Linear; the picked commit is duplicated</td></tr>
    <tr><td>Use when?</td><td>Integrating whole branch</td><td>Catching up local with main</td><td>Surgical: just this one thing</td></tr>
  </tbody>
</table>

<h3>The cherry-pick "shadow" problem</h3>
<p>When you cherry-pick a commit from branch A to branch B, both branches now contain "the same change" but as different commits with different SHAs. Future operations may see these as unrelated:</p>
<ul>
  <li><strong>Merge after cherry-pick:</strong> may show no conflict (Git detects identical change), or may show a conflict you have to resolve manually.</li>
  <li><strong>Bisect across the picked commit:</strong> bisect on each branch sees the change at different points.</li>
  <li><strong>Future cherry-picks:</strong> may try to re-apply changes that are already there.</li>
</ul>
<p>Recommendation: use <code>-x</code> flag (records "cherry picked from &lt;source-sha&gt;" in the commit message) so future engineers can trace provenance.</p>

<h3>Why this is a senior-level skill</h3>
<table>
  <thead><tr><th>Rookie usage</th><th>Senior usage</th></tr></thead>
  <tbody>
    <tr><td>Cherry-pick when copy-paste would work</td><td>Cherry-pick to preserve attribution + history</td></tr>
    <tr><td>Cherry-pick massive ranges (effectively duplicating branches)</td><td>Cherry-pick narrow, justified picks; otherwise merge</td></tr>
    <tr><td>Cherry-pick + force-push without testing</td><td>Cherry-pick + test + manual verification</td></tr>
    <tr><td>Forget to use -x</td><td>Always -x for cross-branch picks; track provenance</td></tr>
    <tr><td>Cherry-pick the same fix twice (forget it's already there)</td><td>Track via <code>git log --grep="cherry picked from"</code></td></tr>
    <tr><td>Surprised by conflicts</td><td>Anticipate: "main has refactored this code, conflict expected"</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The "diff replay" model</h3>
<p>Cherry-pick is essentially: "Compute commit X's diff (X minus its parent). Apply that diff to current HEAD. Make a new commit." Internalize:</p>
<ul>
  <li>Cherry-pick is about the <em>diff</em>, not the absolute file content.</li>
  <li>If the diff applies cleanly to current HEAD, no conflict.</li>
  <li>If current HEAD's surrounding code has changed, conflicts.</li>
  <li>The new commit's content is determined by HEAD + diff, not by source commit's content.</li>
</ul>

<h3>The "duplicate vs. integrate" decision</h3>
<p>Before cherry-picking, ask: do I want this change to exist in both places independently, or do I want to integrate the source branch?</p>
<ul>
  <li><strong>Duplicate (cherry-pick):</strong> Specific surgical changes; release-branch hotfixes; backports.</li>
  <li><strong>Integrate (merge):</strong> Pulling in many related changes; updating from main; integrating a feature.</li>
</ul>
<p>If you find yourself cherry-picking 10+ commits from the same branch, consider whether merge would be cleaner.</p>

<h3>The "provenance trail" mental model</h3>
<p>Every cherry-pick should be a self-documenting artifact. With <code>-x</code>:</p>
<pre><code>Original commit (on main):
  abc1234 Fix offline sync race condition

After cherry-pick to release/v3.5:
  def5678 Fix offline sync race condition

  (cherry picked from commit abc1234)</code></pre>
<p>Now anyone looking at <code>def5678</code> can trace back to the original. <code>git log --grep="cherry picked from abc1234"</code> finds all places this commit was picked.</p>

<h3>The "test after pick" discipline</h3>
<p>Cherry-pick is a re-apply, not a copy. The picked commit's diff plus the current branch's surrounding code may produce different behavior than the original commit did. Always:</p>
<ol>
  <li>Cherry-pick.</li>
  <li>Run tests on the receiving branch.</li>
  <li>Manually verify the fix works in the receiving context.</li>
  <li>Then push.</li>
</ol>
<p>Common failure: cherry-picking a fix that depended on infrastructure / other commits not present on the target branch. Tests pass on source, fail on target. Don't trust the pick to "just work."</p>

<h3>The "range cherry-pick" pattern</h3>
<p>You can cherry-pick a range of commits in one go:</p>
<pre><code>git cherry-pick A..B    # picks commits AFTER A through B (exclusive A, inclusive B)
git cherry-pick A^..B   # picks commits A through B (inclusive both)</code></pre>
<p>Use case: "branch had 5 sequential commits I need; pick all of them together." Like rebase, range cherry-pick replays each one and may need conflict resolution at each step.</p>

<h3>The "cherry-pick a merge commit" gotcha</h3>
<p>Cherry-picking a merge commit is ambiguous: which parent's diff do you want?</p>
<pre><code>git cherry-pick -m 1 &lt;merge-sha&gt;
# -m 1: relative to the first parent
# -m 2: relative to the second parent
# Git refuses without -m on merge commits.</code></pre>
<p>Almost always: <code>-m 1</code> means "the changes that were merged in." Test before assuming.</p>

<h3>The "conflict shape" model</h3>
<p>Conflicts in cherry-pick happen when:</p>
<ul>
  <li>Source diff modified lines that target has changed differently.</li>
  <li>Source diff references files renamed on target.</li>
  <li>Source diff applies to code that was deleted on target.</li>
  <li>Source diff conflicts with a different fix that target already had.</li>
</ul>
<p>The last is critical: if target already has a (different) fix for the same problem, blindly cherry-picking can <em>regress</em> the target. Always test.</p>

<h3>Cherry-pick safety levels</h3>
<table>
  <thead><tr><th>Situation</th><th>Safety</th></tr></thead>
  <tbody>
    <tr><td>Source and target diverged hours ago; trivial change</td><td>Safe; minimal conflict risk</td></tr>
    <tr><td>Source and target diverged days; isolated module</td><td>Usually safe; test</td></tr>
    <tr><td>Source and target diverged weeks; fix in heavily-changed area</td><td>Risky; expect conflicts; verify manually</td></tr>
    <tr><td>Cross-version backport (v3.4 ← v3.6 fix)</td><td>Risky; the area may have refactored heavily</td></tr>
    <tr><td>Cherry-picking a chain of related commits separately</td><td>Risky; subsequent picks may depend on earlier ones being there</td></tr>
  </tbody>
</table>

<h3>The "rerun the test plan" mental model</h3>
<p>For each cherry-pick, mentally run the test plan from the original PR. Did all those tests run on the new branch? Should they?</p>
<ul>
  <li>Unit tests: usually rerun automatically on PR.</li>
  <li>Integration tests: may need explicit triggering.</li>
  <li>Manual QA: likely needed for hotfixes.</li>
  <li>Smoke tests: critical for release branches before tagging.</li>
</ul>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Basic cherry-pick</h3>
<pre><code># Pick a single commit:
git cherry-pick &lt;sha&gt;

# Pick with provenance recorded:
git cherry-pick -x &lt;sha&gt;
# Adds "(cherry picked from commit &lt;sha&gt;)" to commit message

# Pick a range of commits (after A through B, inclusive of B):
git cherry-pick A..B

# Pick a range, inclusive of A:
git cherry-pick A^..B

# Pick multiple specific commits:
git cherry-pick &lt;sha1&gt; &lt;sha2&gt; &lt;sha3&gt;

# Pick but don't auto-commit (let me edit first):
git cherry-pick -n &lt;sha&gt;       # --no-commit
# Now changes are staged; modify, then commit manually

# Pick and edit the commit message:
git cherry-pick -e &lt;sha&gt;

# Pick a merge commit (specify parent):
git cherry-pick -m 1 &lt;merge-sha&gt;</code></pre>

<h3>Resolving conflicts during cherry-pick</h3>
<pre><code># Conflict happens; Git stops:
# 1. git status   — see conflicted files
# 2. Edit each file (resolve &lt;&lt;&lt; / === / &gt;&gt;&gt; markers)
# 3. git add &lt;file&gt;
# 4. git cherry-pick --continue
# Or:
git cherry-pick --abort     # bail out, restore pre-pick state
git cherry-pick --skip      # skip this commit (rare; verify)

# Tools:
git mergetool               # opens configured merge tool</code></pre>

<h3>Picking from another branch / remote</h3>
<pre><code># Make sure you have the source commit:
git fetch origin

# Pick from origin's branch:
git cherry-pick origin/main~3   # 3 commits ago on origin/main

# Pick by SHA from a specific branch:
git cherry-pick &lt;sha&gt;           # SHAs are global; just need the object

# If you don't have the commit locally:
git fetch origin &lt;branch&gt;
git cherry-pick &lt;sha&gt;</code></pre>

<h3>The hotfix workflow</h3>
<pre><code># Setup: production is on v3.5; main is on v3.6 dev
# Critical bug found in v3.5; fix is small, identifiable.

# Step 1: Fix on main (or hotfix branch)
git checkout main
git checkout -b hotfix/payment-crash
# ... make fix ...
git add .
git commit -m "Fix crash in payment flow when user has no saved cards

Stripe SDK changed null-handling semantics in v8.x; we were
calling .charge() on undefined when the user had never saved
a card. Added explicit nil-check.

Refs: incident #2034"

# Step 2: Open PR, get review, merge to main
# (or skip PR for true emergency, but always with team's policy)

# Step 3: Cherry-pick to release branch
git checkout release/v3.5
git cherry-pick -x &lt;merge-or-fix-sha&gt;

# Step 4: Run tests on release branch
npm test
# (Or your equivalent; run full suite, not just affected file)

# Step 5: Tag release
git tag v3.5.1
git push origin release/v3.5 v3.5.1

# Step 6: Build, ship via App Store / Play Store

# Step 7: Verify the fix is in main (it is, since you started there)
# Confirm with: git log main --grep="payment-crash"</code></pre>

<h3>Cherry-pick from a peer's open PR</h3>
<pre><code># Peer has fix in PR #1234; you need it now (e.g., it unblocks your work)
# but their PR is in review and won't merge for a few days.

# Step 1: Fetch their branch
git fetch origin pull/1234/head:pr-1234
# (GitHub-specific syntax for PRs)

# Step 2: Identify the specific commit you want
git log pr-1234 --oneline

# Step 3: Cherry-pick
git checkout my-branch
git cherry-pick -x &lt;sha-from-pr-1234&gt;

# Step 4: Document in your PR
# Add comment: "Cherry-picked &lt;sha&gt; from PR #1234 (will be removed
#  when #1234 merges; tracking)"</code></pre>

<h3>Range cherry-pick with conflicts</h3>
<pre><code># Pick 5 commits, may conflict on some:
git cherry-pick A^..B

# Hits conflict on commit 3 of 5:
# Resolve as above. Continue:
git cherry-pick --continue

# May hit conflict on commit 4. Resolve. Continue.

# Track progress:
ls .git/sequencer/      # sequencer state (during multi-pick)
cat .git/sequencer/todo # remaining picks

# Abort whole sequence:
git cherry-pick --abort
# Aborts all subsequent picks; rolls back to pre-sequence state</code></pre>

<h3>Avoiding duplicate cherry-picks</h3>
<pre><code># Check if a commit has already been picked into a branch:
git log &lt;branch&gt; --grep="cherry picked from &lt;source-sha&gt;"

# If you used -x consistently, all picks are searchable.

# Find all picks on a branch:
git log &lt;branch&gt; --grep="cherry picked from" --oneline

# Tools like:
git cherry main release/v3.5
# Lists commits in main not yet in release/v3.5
# (heuristic: detects identical patches; useful but imperfect)</code></pre>

<h3>Cherry-pick with custom commit message</h3>
<pre><code># Pick but don't commit; you can edit, then commit:
git cherry-pick -n &lt;sha&gt;
# Make any tweaks needed
git commit -m "Hotfix v3.5.1: critical payment crash

Backport of abc1234 from main. Stripe SDK null-handling.
QA verified by [tester]. Smoke tests pass.

(cherry picked from commit abc1234)"

# Or with -x but customizing message:
git cherry-pick -x -e &lt;sha&gt;</code></pre>

<h3>Cherry-pick across remotes / forks</h3>
<pre><code># From upstream (canonical) repo into your fork:
git remote add upstream &lt;canonical-url&gt;
git fetch upstream

# Pick from upstream:
git cherry-pick &lt;upstream-sha&gt;
git push origin my-branch

# Pick into someone else's PR (rare; collaborator workflow):
git fetch origin
git checkout pr-branch
git cherry-pick &lt;fix-sha&gt;
git push origin pr-branch
# (You need push access to their PR branch)</code></pre>

<h3>Cherry-pick reverting a change</h3>
<pre><code># Sometimes you want to "un-cherry-pick" — revert the picked commit:
git revert &lt;cherry-picked-sha&gt;
# Creates a new "Revert ..." commit on current branch.

# Or: reset before push if you haven't pushed yet:
git reset --hard HEAD~1</code></pre>

<h3>The <code>git cherry</code> command (different from cherry-pick!)</h3>
<pre><code># git cherry is a query tool, not an action.
# Lists commits on local branch not yet upstream:
git cherry main feature
# Shows: + abc1234 Add feature X
#        + def5678 Add feature Y

# Commits prefixed:
#  + : not in upstream
#  - : equivalent commit IS in upstream (already cherry-picked or merged)

# Useful for seeing which commits to cherry-pick:
git cherry release/v3.5 main
# Lists commits in main not yet in release/v3.5</code></pre>

<h3>Useful aliases</h3>
<pre><code># In ~/.gitconfig:
[alias]
  cp = cherry-pick
  cpx = cherry-pick -x
  cpc = cherry-pick --continue
  cpa = cherry-pick --abort
  picked = log --grep="cherry picked from" --oneline</code></pre>
`
    },
    {
      id: 'examples',
      title: '🔍 Worked Examples',
      html: `
<h3>Example 1: Mobile hotfix to release branch</h3>
<p><strong>Setup:</strong> v3.5.0 in App Store. Crash report shows iOS 16 users hitting NPE on logout. Fix is small.</p>

<pre><code># 1. Reproduce + fix on main (or branched off the v3.5 tag)
git checkout main
git pull
git checkout -b hotfix/logout-crash
# ... write fix ...
# ... write test for the fix ...
git add .
git commit -m "Fix NPE on logout for iOS 16 users

The session manager's logout flow was calling completion handler
on a deallocated reference when the app had been backgrounded
during logout. Captured by weak ref now.

Refs: crash report #4521 (~2.3% of iOS 16 sessions affected)"

# 2. Open PR, code review, merge to main
# (For real emergency, may go through expedited path; check team policy)

# 3. Get the merge SHA
git checkout main
git pull
git log -1 --oneline
# abc1234 Fix NPE on logout for iOS 16 users (#3456)

# 4. Cherry-pick to release branch
git checkout release/v3.5
git pull
git cherry-pick -x abc1234

# 5. Verify
npm test
# (or fastlane test, or your suite)

# 6. Manual smoke test:
# - Build for iOS 16 simulator
# - Reproduce the original crash scenario
# - Confirm fix works

# 7. Tag and ship
git tag -a v3.5.1 -m "Hotfix: NPE on logout for iOS 16"
git push origin release/v3.5 v3.5.1

# 8. Notify team in incident channel:
"v3.5.1 tagged with logout crash fix. Submitting to App Store
expedited review now. Original commit on main: abc1234.
Picked into release: &lt;new-sha&gt;."</code></pre>

<h3>Example 2: Cherry-pick with conflict</h3>
<p><strong>Setup:</strong> Picking a fix from main onto release/v3.4 (an older release). The fix touches code that was refactored on main but not on v3.4.</p>

<pre><code>git checkout release/v3.4
git cherry-pick -x abc1234

# Output:
# error: could not apply abc1234... Fix race in cache invalidation
# hint: After resolving the conflicts, mark them with
# hint: "git add &lt;paths&gt;" or "git rm &lt;paths&gt;"
# hint: and commit the result with "git commit"

# Inspect:
git status
# Unmerged paths:
#   src/cache/InvalidationManager.ts

# Open InvalidationManager.ts:
&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD
function invalidate(key: string) {
  cache.delete(key);
  notifyListeners(key);
}
=======
async function invalidate(key: string) {
  await acquireLock(key);
  try {
    cache.delete(key);
    notifyListeners(key);
  } finally {
    releaseLock(key);
  }
}
&gt;&gt;&gt;&gt;&gt;&gt;&gt; abc1234... Fix race in cache invalidation

# The fix uses async + lock; v3.4's code is sync.
# Question: does v3.4's invalidate even need this fix?
#   - Check: does v3.4 have concurrent access to cache?
#   - Test: write a test for the race in v3.4

# Decision: v3.4 doesn't have async invalidation; race doesn't apply.
# Therefore: cherry-pick is NOT NEEDED for v3.4.

# Abort:
git cherry-pick --abort

# Document in incident notes:
"abc1234 not backported to v3.4 — race condition only exists in
async invalidation flow added in v3.5. v3.4 unaffected."</code></pre>

<p><strong>Lesson:</strong> always understand the fix in the target branch's context. Blind cherry-picks are dangerous.</p>

<h3>Example 3: Cherry-picking from a peer's open PR</h3>
<p><strong>Setup:</strong> Peer has PR #1234 with a fix you need now; their PR is days from merging.</p>

<pre><code># Fetch the PR (GitHub):
git fetch origin pull/1234/head:pr-1234

# Look at it:
git log pr-1234 --oneline

# 9a8b7c6 Add tests for retry logic
# 5d4e3f2 Refactor APIClient
# 1g2h3i4 Fix retry on 503 errors        ← This is what I want

# Cherry-pick the fix:
git checkout my-feature-branch
git cherry-pick -x 1g2h3i4

# Document in PR description:
# "Includes cherry-pick of [fix sha] from #1234 (cherry-pick will
# be removed when #1234 lands; otherwise duplicate commit)"

# When #1234 lands:
git checkout my-feature-branch
git rebase main   # main now has the original fix; my pick is duplicate
# Git often detects duplicates and skips; if not, manually:
git rebase -i main
# Drop the cherry-picked commit since the original is now in main</code></pre>

<h3>Example 4: Salvaging from an abandoned branch</h3>
<p><strong>Setup:</strong> Engineer left the company. They had a branch <code>feature/X</code> with 8 commits. Most are abandoned, but commit 3 is a useful refactor we want.</p>

<pre><code>git fetch origin
git log origin/feature/X --oneline
# h7g6f5e Add tests
# d3c2b1a WIP - try approach 2
# 9o8n7m6 Refactor logger to support structured logging   ← keep
# 5l4k3j2 WIP - approach 1
# 1i0h9g8 Stub
# ...

# Cherry-pick just commit 3:
git checkout main
git checkout -b salvage/structured-logging
git cherry-pick -x 9o8n7m6

# Test, polish, open PR.
# Credit original author in commit message (with -e to edit):
git commit --amend
# Add: "Originally by [Name] in feature/X branch (now archived).
#       Salvaged because the structured logging refactor is useful
#       independently of the rest of feature/X."</code></pre>

<h3>Example 5: Range cherry-pick</h3>
<p><strong>Setup:</strong> Three sequential commits on main implement a needed change. You want all three on release/v3.5.</p>

<pre><code># Identify the range:
git log main --oneline
# abc1234 (HEAD -&gt; main) Add API contract validation
# def5678 Add validation library
# ghi9012 Add types for validation
# jkl3456 (older commit, not wanted)

# Cherry-pick range (after jkl3456 through abc1234):
git checkout release/v3.5
git cherry-pick -x jkl3456..abc1234

# Or specifying inclusive start:
git cherry-pick -x ghi9012^..abc1234

# Picks all 3 commits in order. May conflict on some; resolve as you go.</code></pre>

<h3>Example 6: Cherry-picking a merge commit</h3>
<p><strong>Setup:</strong> You want the changes that came in via PR #5678's merge commit.</p>

<pre><code>git log --oneline --graph
# *   merge-sha Merge pull request #5678 from feature/X
# |\\
# | * commit-A ...
# | * commit-B ...
# |/
# * earlier-commit ...

# Try cherry-picking merge:
git cherry-pick &lt;merge-sha&gt;
# Error: refusing to cherry-pick a merge

# Specify which parent's diff to use:
git cherry-pick -m 1 -x &lt;merge-sha&gt;
# -m 1: changes from second parent vs. first parent (i.e., what was merged)

# Verify the result is what you expected:
git diff HEAD~1 HEAD
# Should match the diff that PR #5678 added.</code></pre>

<p><strong>Often easier:</strong> cherry-pick the individual commits A and B instead of the merge. Cleaner provenance.</p>

<h3>Example 7: Detecting already-picked commits</h3>
<p><strong>Setup:</strong> You're not sure if a fix has already been backported to release/v3.5.</p>

<pre><code># Method 1: search by message
git log release/v3.5 --grep="cherry picked from abc1234"

# Method 2: git cherry
git cherry release/v3.5 main
# Outputs:
# + def5678 Some commit (not in release)
# - ghi9012 Already picked / equivalent in release
# + jkl3456 Some other commit (not in release)

# Method 3: git log --grep on commit message
# (works only if you used -x)
git log release/v3.5 --grep="payment-crash"

# Method 4: git diff between branches for specific files
git diff release/v3.5 main -- path/to/affected/file.ts</code></pre>

<h3>Example 8: Custom cherry-pick with message rewrite</h3>
<p><strong>Setup:</strong> Picking a fix into release branch; you want the commit message to clearly mark this as a backport.</p>

<pre><code>git cherry-pick -x -e abc1234

# Editor opens with:
"Original commit message here

(cherry picked from commit abc1234)"

# Edit to:
"[v3.5 backport] Fix offline sync race condition

Backport of abc1234 from main. v3.5 needs this fix because
~5% of users on v3.5.x are seeing data corruption in offline
mode.

QA: verified on iOS 16, Android 13.
Approved-by: [release manager]

(cherry picked from commit abc1234)"

# Save. Commit happens with new message.</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Cherry-picking a commit that depends on earlier commits</h3>
<p>If commit B builds on commit A, cherry-picking only B may fail or produce broken code:</p>
<ul>
  <li>Conflict on B because target doesn't have A's changes.</li>
  <li>Or: pick succeeds but code is broken (compile errors, missing functions, etc.).</li>
</ul>
<p>Solution: cherry-pick A first, then B. Or pick the range A^..B. Or merge instead.</p>

<h3>Cherry-picking touches files renamed on target</h3>
<p>If source has <code>auth/oldName.ts</code> but target renamed it to <code>auth/newName.ts</code>:</p>
<ul>
  <li>Git's rename detection sometimes catches this; sometimes doesn't.</li>
  <li>Conflict: "deleted by us, modified by them."</li>
  <li>Solution: manually move the diff to the renamed file before <code>git add</code>.</li>
</ul>

<h3>Cherry-picking generated / lockfile changes</h3>
<p>Lockfiles (Podfile.lock, yarn.lock, package-lock.json) often conflict on cherry-pick because target's lockfile state differs:</p>
<ul>
  <li>Solution 1: cherry-pick the source change, then regenerate the lockfile on target (run <code>yarn install</code>, <code>pod install</code>, etc.). Don't try to merge lockfile conflicts.</li>
  <li>Solution 2: <code>.gitattributes</code> with <code>merge=ours</code> for lockfiles in shared branches.</li>
</ul>

<h3>Cherry-pick of a fix that references an issue tracker</h3>
<p>If commit message has "Fixes #1234" and you cherry-pick to a different repo / project:</p>
<ul>
  <li>The issue reference may not apply (different bug tracker).</li>
  <li>Or: re-using the message creates a misleading link.</li>
</ul>
<p>Solution: edit the message during pick (<code>git cherry-pick -e</code>) to clarify backport context.</p>

<h3>Sequential picks that should be one logical unit</h3>
<p>You're picking commits A, B, C that together implement a feature. Each individual pick may produce an "intermediate" state that doesn't compile / fails tests:</p>
<ul>
  <li>Solution 1: pick all three, then test only after the final one.</li>
  <li>Solution 2: squash A+B+C into one commit on source first, then cherry-pick the squashed commit.</li>
  <li>Solution 3: cherry-pick range with --no-commit, then make a single combined commit.</li>
</ul>

<h3>The "already merged" detection</h3>
<p>If you cherry-pick a commit whose changes are already in the target (perhaps via a different commit), Git may say "nothing to commit":</p>
<pre><code>git cherry-pick abc1234
# On branch release/v3.5
# Your branch is up to date with 'origin/release/v3.5'.
# nothing to commit, working tree clean
# The previous cherry-pick is now empty, possibly due to conflict resolution.
# If you wish to commit it anyway, use:
#     git commit --allow-empty</code></pre>
<p>Usually correct response: <code>git cherry-pick --skip</code> (don't create empty commit).</p>

<h3>Cherry-pick during interactive rebase</h3>
<p>You can use <code>exec git cherry-pick &lt;sha&gt;</code> in an interactive rebase to insert a cherry-pick mid-rebase:</p>
<pre><code>git rebase -i HEAD~5

# In editor:
pick a1b2c3d Existing commit 1
exec git cherry-pick -x &lt;sha-from-elsewhere&gt;
pick d4e5f6a Existing commit 2
...

# This injects the picked commit between a1b2c3d and d4e5f6a.</code></pre>

<h3>Cherry-pick failures during sequencer (range pick)</h3>
<p>When picking A^..B and one commit conflicts:</p>
<pre><code># Sequencer state lives in .git/sequencer/
# todo file shows remaining picks

# Resolve current conflict:
git add &lt;files&gt;
git cherry-pick --continue

# Or skip current commit:
git cherry-pick --skip

# Or abort entire sequence:
git cherry-pick --abort

# Or quit sequencer but keep what's done:
git cherry-pick --quit</code></pre>

<h3>The "cherry-pick into a stale branch" problem</h3>
<p>You're picking into a branch that hasn't been updated in months. The target may be missing prerequisites for the fix:</p>
<ul>
  <li>Picked fix may compile but not work (feature flag from another commit).</li>
  <li>Picked fix may rely on a dep version target doesn't have.</li>
  <li>Picked fix's tests may not exist on target.</li>
</ul>
<p>Always: full test run + manual verification on stale branch picks.</p>

<h3>Picking commits with binary diffs</h3>
<p>Cherry-picks of commits that change images, fonts, or other binaries usually work fine — Git replays the binary blob. But:</p>
<ul>
  <li>Large binaries make the pick slow.</li>
  <li>Lockfile-style binary conflicts can't be resolved by merging — must regenerate.</li>
</ul>

<h3>Empty commits from cherry-pick</h3>
<p>Sometimes a cherry-pick produces an empty commit (the change is already applied, or the diff doesn't apply meaningfully):</p>
<pre><code># Default: Git skips empty commits.
# Force commit even if empty:
git cherry-pick --keep-empty &lt;sha&gt;

# Useful if you want to record the attempt for tracking.</code></pre>

<h3>Cherry-pick rolling back</h3>
<p>You realized the cherry-pick was wrong. Recovery:</p>
<pre><code># Before push:
git reset --hard HEAD~1   # removes the picked commit

# After push (already shared):
git revert &lt;cherry-picked-sha&gt;
# Creates a "Revert ..." commit; safe for shared history</code></pre>

<h3>Cherry-pick chain across multiple branches</h3>
<p>Critical fix that needs to be in main + 3 release branches:</p>
<pre><code># Pick into each:
for branch in main release/v3.4 release/v3.5 release/v3.6; do
  git checkout $branch
  git cherry-pick -x &lt;original-sha&gt;
  npm test || break
  git push origin $branch
done

# Better: scripted with explicit verification at each step.
# Even better: codified in CI / release tooling for hotfix workflow.</code></pre>

<h3>The "fix that becomes obsolete" trap</h3>
<p>You cherry-pick a fix into release/v3.5. Later, the original commit on main is reverted because it broke something else. Your pick is still on release/v3.5.</p>
<ul>
  <li>Solution 1: revert the pick on release/v3.5 too.</li>
  <li>Solution 2: leave it (if release/v3.5 doesn't have the breakage that caused the revert on main).</li>
  <li>Either way: track via incident notes.</li>
</ul>

<h3>Mobile-specific: cherry-picking native dep changes</h3>
<p>Cherry-picking a commit that bumps a native dependency (Stripe SDK, Firebase) requires:</p>
<ul>
  <li>Pick the source code change.</li>
  <li>Re-run <code>pod install</code> / <code>yarn install</code> to regenerate lockfiles for target.</li>
  <li>Verify the dep exists in target's allowed version range.</li>
  <li>Test on both iOS and Android since dep behavior may differ.</li>
</ul>
`
    },
    {
      id: 'bugs',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Anti-pattern: cherry-pick without -x</h3>
<p><strong>Looks like:</strong> Pick commit; don't record source.</p>
<p><strong>Why bad:</strong> Future archeology can't trace the pick. Duplicate-pick prevention harder.</p>
<p><strong>Fix:</strong> Always <code>-x</code> for cross-branch picks. Alias <code>git cpx = cherry-pick -x</code>.</p>

<h3>Anti-pattern: cherry-pick instead of merge</h3>
<p><strong>Looks like:</strong> 15 sequential cherry-picks of commits from feature/X to main.</p>
<p><strong>Why bad:</strong> Effectively merging without the merge. Loses branch boundary; conflicts repeat per-commit; no clear "feature integrated" point.</p>
<p><strong>Fix:</strong> If picking many commits from same branch, just merge.</p>

<h3>Anti-pattern: not testing after cherry-pick</h3>
<p><strong>Looks like:</strong> Cherry-pick, push, ship without test run.</p>
<p><strong>Why bad:</strong> Pick may have compiled but not work in target context.</p>
<p><strong>Fix:</strong> Full test suite + manual verification after every cherry-pick.</p>

<h3>Anti-pattern: cherry-pick to "skip" a fix you owe</h3>
<p><strong>Looks like:</strong> Hotfix is small and urgent; just cherry-pick to release branch and call it done. Forget to merge it (or equivalent) to main.</p>
<p><strong>Why bad:</strong> Main loses the fix. Next release regresses.</p>
<p><strong>Fix:</strong> Always ensure fix is in main + all currently-supported release branches. Track explicitly.</p>

<h3>Anti-pattern: cherry-pick chain without documenting</h3>
<p><strong>Looks like:</strong> Pick into 4 branches; no record of which branches got it.</p>
<p><strong>Why bad:</strong> Next engineer can't easily verify coverage.</p>
<p><strong>Fix:</strong> Track in incident / release notes which branches received the pick.</p>

<h3>Anti-pattern: blindly resolving conflicts</h3>
<p><strong>Looks like:</strong> Cherry-pick conflicts; you click "use ours" or "use theirs" without understanding.</p>
<p><strong>Why bad:</strong> Wrong resolution = silent regression.</p>
<p><strong>Fix:</strong> Read both sides. Understand what target's code is doing. Manually merge to correct intent.</p>

<h3>Anti-pattern: cherry-pick when revert was right answer</h3>
<p><strong>Looks like:</strong> Bug found in main; you cherry-pick the bug-introducing commit's fix from a future branch.</p>
<p><strong>Why bad:</strong> Often easier to revert the bad commit than to backport an unproven fix.</p>
<p><strong>Fix:</strong> Compare cost: revert vs. cherry-pick. For unproven fixes, revert often safer.</p>

<h3>Anti-pattern: cherry-pick a merge commit without -m</h3>
<p><strong>Looks like:</strong> <code>git cherry-pick &lt;merge-sha&gt;</code>; Git refuses; engineer adds <code>-m 1</code> without checking.</p>
<p><strong>Why bad:</strong> -m 1 vs. -m 2 picks different parents' diffs. Wrong choice = wrong code.</p>
<p><strong>Fix:</strong> Understand what -m 1 / -m 2 means for the specific merge. Often easier to pick the individual commits, not the merge.</p>

<h3>Anti-pattern: cherry-pick rebases / amends post-pick</h3>
<p><strong>Looks like:</strong> Pick commit; force-push to release branch with new SHA.</p>
<p><strong>Why bad:</strong> Release branches are usually shared. Force-push damages others' work.</p>
<p><strong>Fix:</strong> If you need to fix the picked commit, write a new commit, don't amend.</p>

<h3>Anti-pattern: picking commits that bundle unrelated changes</h3>
<p><strong>Looks like:</strong> Source commit has the fix you want + a refactor + a typo fix; you pick all three.</p>
<p><strong>Why bad:</strong> Pulls unrelated risk into release branch.</p>
<p><strong>Fix:</strong> Cherry-pick with --no-commit; manually de-stage unwanted parts; commit only the fix.</p>

<h3>Anti-pattern: forgetting to push the pick</h3>
<p><strong>Looks like:</strong> Pick locally, run tests, switch branches, forget to push.</p>
<p><strong>Why bad:</strong> Pick exists only locally; release branch doesn't have it.</p>
<p><strong>Fix:</strong> Workflow: pick → test → push → tag. Push immediately after test.</p>

<h3>Anti-pattern: cherry-picking from rebase-rewritten history</h3>
<p><strong>Looks like:</strong> The commit you want has new SHAs because someone rebased the source branch.</p>
<p><strong>Why bad:</strong> The original SHA may not exist anymore.</p>
<p><strong>Fix:</strong> Look up the equivalent commit in the new history (search by message, by content). Or use <code>git reflog</code> on the source if you have it locally.</p>

<h3>Anti-pattern: cherry-pick to bypass code review</h3>
<p><strong>Looks like:</strong> Pick changes from a branch that didn't go through PR.</p>
<p><strong>Why bad:</strong> Skips review; ships unreviewed code.</p>
<p><strong>Fix:</strong> Even hotfix picks go through expedited review (1 reviewer, fast turnaround) — never zero review.</p>

<h3>Anti-pattern: re-cherry-picking the same fix</h3>
<p><strong>Looks like:</strong> Don't realize fix is already in target; pick again; create duplicate or empty commit.</p>
<p><strong>Why bad:</strong> History noise; possible bugs from doubled changes.</p>
<p><strong>Fix:</strong> Always check first: <code>git log target --grep="cherry picked from &lt;source-sha&gt;"</code>.</p>

<h3>Anti-pattern: cherry-pick as a copy/paste replacement</h3>
<p><strong>Looks like:</strong> Engineer doesn't understand what cherry-pick does; uses it for things copy-paste would handle (e.g., copying code patterns within same branch).</p>
<p><strong>Why bad:</strong> Cherry-pick is for moving commits across branches; not for code re-use.</p>
<p><strong>Fix:</strong> Understand the model. For code re-use, use abstraction / shared modules.</p>
`
    },
    {
      id: 'interview',
      title: '🎤 Interview Patterns',
      html: `
<h3>"Explain cherry-pick"</h3>
<p>Often follows rebase/merge questions. Strong answer connects to use cases.</p>
<pre><code>"Cherry-pick takes a specific commit from one branch and applies
its diff on top of the current branch, creating a new commit with
the same content but a different SHA.

The canonical use case is hotfixing release branches. If main is
on the dev cycle for v3.6 but production is running v3.5, a fix
on main needs to be backported to release/v3.5. Cherry-pick is
the surgical tool — bring this one fix without merging all of
main into the release.

Other uses: pulling a single fix from a peer's open PR, salvaging
work from an abandoned branch, building release trains.

I always use -x to record provenance: 'cherry picked from
&lt;source-sha&gt;' lets future engineers trace the backport."</code></pre>

<h3>"How does cherry-pick differ from merge?"</h3>
<pre><code>"Merge integrates a whole branch — all of its commits since
divergence — and creates a merge commit with two parents. The
result is branchy history.

Cherry-pick takes one specific commit (or range) and applies its
diff. Result: linear history with a new commit on the current
branch.

Choice depends on intent. Merge says 'integrate everything.'
Cherry-pick says 'just this one thing.' For hotfix workflows on
release branches, cherry-pick is usually right because you only
want the fix, not all of main."</code></pre>

<h3>"How do you handle a cherry-pick conflict?"</h3>
<pre><code>"Same flow as merge / rebase conflict at first — git status,
edit conflicted files, git add, git cherry-pick --continue.

The thing I always check carefully: is the target branch's
context similar enough that the picked diff makes sense? If the
target has refactored the surrounding code heavily, blindly
applying the source diff could regress the target.

Sometimes the answer is: don't cherry-pick. The fix doesn't apply
to this branch because the bug doesn't exist here, or the bug
needs a different fix. Documenting that decision is as important
as making the pick when picking is correct."</code></pre>

<h3>"Walk me through your hotfix workflow"</h3>
<p>Senior interview question for production engineers.</p>
<pre><code>"Let's say production is v3.5 and main is on v3.6 dev cycle.
A critical bug is reported.

1. Verify the bug, get a stack trace, identify the fix.

2. Fix on main first — easier to develop with full velocity tooling.
   Open PR, expedited review (1 reviewer, fast).

3. Once merged to main, cherry-pick to release/v3.5:
   git checkout release/v3.5
   git cherry-pick -x &lt;merge-sha&gt;

4. Run full test suite on release/v3.5. Manual smoke test for
   the specific bug scenario.

5. Tag release: v3.5.1.

6. Build, ship to App Store / Play Store with expedited review
   request if critical.

7. Update incident docs: which branches got the fix, when it
   shipped, customer impact.

If the team has multiple supported release branches, the
cherry-pick scripts to each.

Key disciplines: -x for provenance; test after every pick; never
skip the manual verification on release branches."</code></pre>

<h3>"What if the cherry-pick conflicts because of a refactor?"</h3>
<pre><code>"Step back and think before resolving mechanically.

First question: does the bug even exist in the target branch? If
the refactor was on main and the target is older, maybe the bug
was introduced by the refactor and doesn't apply.

Second question: is there a cleaner fix for the target's
architecture? Sometimes the original fix is right for source's
post-refactor code but wrong for target's pre-refactor code.

Third question: is this fix worth backporting at all? If the cost
of resolving is high and the bug impact is moderate, sometimes
'no fix on this version, customer should upgrade' is the right
call.

Mechanical conflict resolution without context is dangerous. The
extra five minutes of analysis prevents silent regressions."</code></pre>

<h3>"What about cherry-picking a merge commit?"</h3>
<pre><code>"It's allowed but requires -m to specify which parent's diff to
use. -m 1 is usually 'the changes that came in via the merge'
relative to the receiving branch.

In practice I prefer to pick the individual commits that made up
the merge rather than the merge itself. Cleaner provenance:
'cherry picked from commit A' is unambiguous; '-m 1 from merge
sha' requires more context.

If the source branch was squash-merged, this isn't an issue —
there's just one commit to pick."</code></pre>

<h3>"How do you avoid double-picking?"</h3>
<pre><code>"Several mechanisms:

1. -x flag adds 'cherry picked from &lt;source-sha&gt;' to commit
   message; searchable.

2. git log target --grep='cherry picked from &lt;source-sha&gt;'
   finds prior picks.

3. git cherry source target (note: 'cherry', not 'cherry-pick')
   lists commits in source not yet equivalent in target.

4. Team convention: incident notes list which branches got the
   pick.

The key habit: check before picking. 30 seconds of git log saves
duplicate commits and the bugs they sometimes cause."</code></pre>

<h3>"When should you NOT cherry-pick?"</h3>
<pre><code>"Several cases:

1. When you want to integrate a whole feature: merge, don't
   cherry-pick 20 commits.

2. When the source commit depends on commits not in target:
   pick the dependencies first or pick a range.

3. When source and target have diverged so much that the diff
   doesn't make sense in target: write a fresh fix.

4. When the bug doesn't exist in target: just don't pick.

5. When the change is large and you're unsure of impact on
   target: prefer a separate PR with full review and tests.

6. When the source is a merge commit and you can pick the
   underlying individual commits: pick those instead."</code></pre>

<h3>"How do you decide source vs. target as the fix branch?"</h3>
<pre><code>"Two patterns, both valid:

Pattern A: fix on main, pick to release.
- Pros: develop with full tooling on main; easier review.
- Cons: another step to get fix to production.

Pattern B: fix on release branch, pick to main.
- Pros: fix is on production-shaped code from the start.
- Cons: release branches sometimes have older tooling /
  dependencies.

I default to Pattern A unless the bug is specifically tied to
release branch state (e.g., a v3.5-only API quirk). Team
preferences vary; the important thing is the team has a default
and follows it consistently."</code></pre>

<h3>Common follow-ups</h3>
<table>
  <thead><tr><th>Question</th><th>What they're checking</th></tr></thead>
  <tbody>
    <tr><td>"What's <code>git cherry</code>?"</td><td>Knowing it's the query tool, not the action</td></tr>
    <tr><td>"How do you cherry-pick a range?"</td><td><code>git cherry-pick A^..B</code></td></tr>
    <tr><td>"What if you cherry-pick the wrong commit?"</td><td>git reset HEAD~1 (before push) or git revert (after)</td></tr>
    <tr><td>"How do you ensure tests pass after pick?"</td><td>Run full suite + manual smoke; don't trust commit-only "compiles"</td></tr>
    <tr><td>"What's the difference between cherry-pick and patch?"</td><td>Cherry-pick is Git-native + records source; patch (diff/apply) is generic + no provenance</td></tr>
    <tr><td>"Can you undo a cherry-pick?"</td><td>git reset (pre-push) or git revert (post-push)</td></tr>
  </tbody>
</table>

<h3>The 30-second mantra</h3>
<p><em>"Cherry-pick is surgical: one commit's diff applied to current branch. Use -x to record provenance. Test after every pick. Don't pick what should be merged. Document which branches got the pick. The mobile hotfix workflow lives on cherry-pick."</em></p>
<p>Cherry-pick is one of those skills you don't appreciate until your first urgent production hotfix at 11pm on a Friday. Master it now; it's calmer that way.</p>
`
    }
  ]
});
