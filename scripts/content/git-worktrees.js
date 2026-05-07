window.PREP_SITE.registerTopic({
  id: 'git-worktrees',
  module: 'git',
  title: 'Worktrees',
  estimatedReadTime: '25 min',
  tags: ['git', 'worktree', 'workflow', 'parallel-work', 'branches', 'productivity'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><code>git worktree</code> lets you check out multiple branches of the same repo into different directories simultaneously. Instead of stashing or branch-switching to context-switch, you keep a separate working directory per branch — each with its own checkout, build artifacts, and IDE state. Once you've used worktrees for parallel work / hotfixes / reviews, you don't go back.</p>
<ul>
  <li><strong>One repo, many checkouts.</strong> All worktrees share the <code>.git</code> directory (objects, refs); each has its own working tree at a different path.</li>
  <li><strong>Cheap to create</strong> — just creates a directory + a pointer in <code>.git/worktrees/</code>. No re-cloning.</li>
  <li><strong>Best uses:</strong> hotfix on release branch while feature work is in flight; reviewing PR while building locally; long-running build / test on main without freezing dev work.</li>
  <li><strong>Each worktree is a "real" checkout</strong> — has its own HEAD, can have its own uncommitted changes, can be rebased / committed independently.</li>
  <li><strong>One restriction:</strong> the same branch can only be checked out in one worktree at a time. Different branches in different worktrees, fine.</li>
  <li><strong>Mobile / RN context:</strong> worktrees are powerful for mobile because builds are slow + native deps are heavy. Avoid <code>pod install</code> + Xcode-cache invalidation when switching contexts.</li>
  <li><strong>Worktrees vs. multiple clones:</strong> worktrees share Git history; clones don't. Worktrees are faster to create + smaller on disk.</li>
  <li><strong>Cleanup matters.</strong> Use <code>git worktree remove</code>; don't just delete directories.</li>
</ul>
<p><strong>Mantra:</strong> "One repo, many checkouts. Use worktrees for parallel branches. Hotfixes don't disturb feature work. Same branch only in one worktree. Remove cleanly."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>The mental model: shared <code>.git</code>, separate working trees</h3>
<pre><code>~/repos/myproject/                    ← main worktree
├── .git/                              ← THE git directory
│   ├── objects/                        ← shared object store
│   ├── refs/                           ← shared refs
│   └── worktrees/
│       ├── hotfix-v3.5/                 ← metadata for second worktree
│       └── pr-review/                   ← metadata for third worktree
├── src/                               ← working tree (whatever branch is HEAD)
└── ...

~/repos/myproject-hotfix-v3.5/         ← second worktree, separate dir
├── .git                               ← FILE (not dir) pointing back to main .git
├── src/                               ← working tree (release/v3.5 checked out)
└── ...

~/repos/myproject-pr-review/           ← third worktree
├── .git                               ← FILE pointing back to main .git
├── src/                               ← working tree (someone's PR checked out)
└── ...</code></pre>

<h3>The problem worktrees solve</h3>
<p>Without worktrees, switching branches means:</p>
<ol>
  <li>Stash uncommitted changes (or commit WIP).</li>
  <li>Checkout new branch.</li>
  <li>Reinstall deps if package.json changed.</li>
  <li>Rebuild (mobile: re-pod-install, re-build, lose Xcode caches).</li>
  <li>Rerun tests / start servers.</li>
  <li>Do the new work.</li>
  <li>Commit / stash.</li>
  <li>Switch back.</li>
  <li>Reinstall deps again. Rebuild. Reseed.</li>
  <li>Restore stash. Continue.</li>
</ol>
<p>For mobile work, this is 10-30 minutes of context-switch overhead per round-trip.</p>

<p>With worktrees:</p>
<ol>
  <li>Create new worktree at <code>../myproject-hotfix</code>.</li>
  <li><code>cd ../myproject-hotfix</code>.</li>
  <li>Do work.</li>
  <li>Commit, push.</li>
  <li>Optionally: delete worktree.</li>
</ol>
<p>Original worktree is untouched. No stash, no rebuild, no context loss.</p>

<h3>Common scenarios</h3>
<table>
  <thead><tr><th>Scenario</th><th>Without worktrees</th><th>With worktrees</th></tr></thead>
  <tbody>
    <tr><td>Hotfix while in middle of feature</td><td>Stash, switch, fix, switch, restore</td><td>New worktree for hotfix; feature work untouched</td></tr>
    <tr><td>Reviewing teammate's PR locally</td><td>Stash, checkout PR, build, review</td><td>New worktree for PR; your branch untouched</td></tr>
    <tr><td>Long-running test / build</td><td>Tied up; can't dev</td><td>Worktree dedicated to running CI-like work</td></tr>
    <tr><td>Comparing two implementations</td><td>Switch back and forth manually</td><td>Both worktrees open in two windows</td></tr>
    <tr><td>Bisecting in detached HEAD</td><td>Detaches your work</td><td>Worktree for bisect; main work untouched</td></tr>
    <tr><td>Multi-repo development</td><td>One feature per repo at a time</td><td>Multiple branches across multiple repos open</td></tr>
  </tbody>
</table>

<h3>Worktrees vs. multiple clones</h3>
<table>
  <thead><tr><th></th><th>Multiple clones</th><th>Worktrees</th></tr></thead>
  <tbody>
    <tr><td>Setup</td><td>git clone (slow; full re-fetch)</td><td>git worktree add (fast; reuses .git)</td></tr>
    <tr><td>Disk usage</td><td>2× full repo</td><td>1× repo + working trees</td></tr>
    <tr><td>Object sharing</td><td>No; commits in one don't appear in other until push/fetch</td><td>Yes; commits visible across worktrees instantly</td></tr>
    <tr><td>Refs / branches</td><td>Each clone has its own</td><td>Shared; branch in worktree A is visible in B</td></tr>
    <tr><td>Use case</td><td>Truly separate environments (different remotes, different settings)</td><td>Same project, parallel branches</td></tr>
  </tbody>
</table>

<h3>The mobile / RN angle</h3>
<p>Mobile development has expensive context switches:</p>
<ul>
  <li><strong>Pod install / Gemfile / Bundler:</strong> 1-3 minutes when iOS deps change.</li>
  <li><strong>Gradle sync:</strong> 30-60 seconds; full Android rebuild can be 5+ minutes.</li>
  <li><strong>Xcode derived data + indexing:</strong> 30 seconds to re-index after branch switch.</li>
  <li><strong>Metro bundler cache:</strong> 30-60 seconds to rebuild bundle.</li>
  <li><strong>Simulator state:</strong> may need to reset between branches with different config.</li>
</ul>
<p>Each context switch can cost 5-10 minutes in mobile. Worktrees eliminate it. Senior mobile engineers tend to live in 2-4 worktrees simultaneously.</p>

<h3>Why this is a "senior" Git skill</h3>
<p>Many engineers never use worktrees because the basic <code>git clone</code> + <code>checkout</code> workflow is "good enough." Senior engineers, especially those working on:</p>
<ul>
  <li>Large monorepos with slow builds.</li>
  <li>Mobile / native code with heavy deps.</li>
  <li>Multiple production releases in parallel.</li>
  <li>Frequent code review of others' PRs.</li>
</ul>
<p>...find worktrees pay back daily.</p>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The "shared object store, separate index" model</h3>
<p>Git stores commits, trees, and blobs in <code>.git/objects/</code>. This object store is shared across worktrees — every worktree sees every commit. What's separate per-worktree:</p>
<ul>
  <li>HEAD (which branch / commit you're on).</li>
  <li>Index (staging area).</li>
  <li>Working tree (the files on disk).</li>
  <li>Some configs that worktrees can override.</li>
</ul>
<p>Result: a commit you make in one worktree is instantly visible to all other worktrees (via <code>git log</code>, etc.). They share history, just have different "current state" pointers.</p>

<h3>The "one branch, one worktree" rule</h3>
<p>You cannot check out the same branch in two worktrees simultaneously. If <code>feature/X</code> is in worktree A, worktree B trying to check out <code>feature/X</code> will fail.</p>
<p>Why: Git can't track which worktree's commits to apply if both modify the branch. Two HEAD pointers on one branch is undefined.</p>
<p>Workarounds:</p>
<ul>
  <li>Different branch in each worktree.</li>
  <li>Detached HEAD (no branch ref) in one worktree.</li>
  <li>Cherry-pick / merge between worktrees rather than parallel-edit one branch.</li>
</ul>

<h3>The "directory layout" decision</h3>
<p>Where to put worktrees? Common patterns:</p>
<table>
  <thead><tr><th>Layout</th><th>Pros</th><th>Cons</th></tr></thead>
  <tbody>
    <tr><td><code>~/repos/foo/</code> + <code>~/repos/foo-hotfix/</code></td><td>Simple; flat</td><td>Cluttered if many worktrees</td></tr>
    <tr><td><code>~/repos/foo/main/</code> + <code>~/repos/foo/hotfix/</code></td><td>Grouped per project</td><td>Need to "git init bare" or restructure</td></tr>
    <tr><td><code>~/repos/foo/.worktrees/hotfix/</code></td><td>Hidden subfolder; clean root</td><td>Some IDEs scan worktrees twice</td></tr>
    <tr><td><code>~/wt/foo-hotfix/</code> (separate top-level)</td><td>Dedicated workspace</td><td>Distance from main repo</td></tr>
  </tbody>
</table>
<p>Pick a convention; document it. Inconsistent worktree placement creates confusion.</p>

<h3>The "lifecycle" model</h3>
<ol>
  <li><strong>Create:</strong> <code>git worktree add &lt;path&gt; &lt;branch&gt;</code></li>
  <li><strong>Use:</strong> <code>cd &lt;path&gt;</code>, work normally — commit, push, etc.</li>
  <li><strong>Maintain:</strong> can be ignored for weeks; just sits there with state.</li>
  <li><strong>Remove:</strong> <code>git worktree remove &lt;path&gt;</code> (when work is committed and pushed).</li>
  <li><strong>Cleanup:</strong> <code>git worktree prune</code> if directory was deleted manually.</li>
</ol>

<h3>The "is this worktree clean?" mental check</h3>
<p>Before removing a worktree:</p>
<ul>
  <li>Are there uncommitted changes? <code>git status</code> in the worktree.</li>
  <li>Is the branch pushed? <code>git log @{u}..HEAD</code>.</li>
  <li>Is the worktree's branch about to be deleted from remote? Stash / cherry-pick / merge first.</li>
</ul>
<p>Removing a worktree is a quick, reversible if remote has the work; potentially destructive if local-only.</p>

<h3>The "main worktree" distinction</h3>
<p>The original repo (where you ran <code>git clone</code>) is the "main worktree." Some operations only work there:</p>
<ul>
  <li>Cannot remove the main worktree.</li>
  <li>Some Git operations affect <code>.git</code> directly (gc, repack); best run from main.</li>
  <li>Hooks live in main's <code>.git/hooks/</code>; shared by default.</li>
</ul>

<h3>The "linked worktree" pattern</h3>
<p>Worktrees other than main are called "linked worktrees." Their <code>.git</code> is a file (not directory) pointing to the metadata in main's <code>.git/worktrees/</code>.</p>
<p>Practical implication: if you delete the main repo, linked worktrees become orphaned; their <code>.git</code> file points nowhere. Don't delete main without first cleaning up linked worktrees.</p>

<h3>The "ignore patterns" gotcha</h3>
<p>Each worktree has its own working tree files but shares the same Git config. <code>.gitignore</code> is shared (committed to the repo). <code>.git/info/exclude</code> is per-repo (shared). Worktree-specific exclusions need <code>$GIT_DIR/worktrees/&lt;name&gt;/info/exclude</code>.</p>

<h3>The "config inheritance" model</h3>
<p>Per-worktree configs are limited. By default, <code>core.bare</code> and <code>core.worktree</code> are per-worktree; most others are shared. To make a config worktree-specific:</p>
<pre><code>git config --worktree my.setting value</code></pre>
<p>This affects only the current worktree.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Creating a worktree</h3>
<pre><code># Add worktree at &lt;path&gt; tracking &lt;branch&gt;:
git worktree add &lt;path&gt; &lt;branch&gt;

# Examples:
git worktree add ../myproject-hotfix release/v3.5
git worktree add /tmp/pr-review pr/1234

# Add worktree with a NEW branch (created from current HEAD):
git worktree add -b new-branch ../myproject-newfeature

# Add worktree with new branch from specific base:
git worktree add -b hotfix/payment-bug ../myproject-hotfix release/v3.5

# Add detached HEAD (no branch tracking):
git worktree add --detach ../myproject-bisect

# Add at specific commit (detached):
git worktree add --detach ../myproject-old &lt;sha&gt;</code></pre>

<h3>Listing worktrees</h3>
<pre><code>git worktree list

# Output:
# /Users/me/repos/foo                abc1234 [main]
# /Users/me/repos/foo-hotfix         def5678 [release/v3.5]
# /Users/me/repos/foo-pr             ghi9012 (detached HEAD)

# Verbose:
git worktree list --verbose

# Porcelain (machine-readable):
git worktree list --porcelain</code></pre>

<h3>Removing a worktree</h3>
<pre><code># Remove cleanly (must be clean: no uncommitted changes):
git worktree remove ../myproject-hotfix

# Force-remove (even if dirty):
git worktree remove --force ../myproject-hotfix
# CAREFUL: discards uncommitted changes in that worktree

# After deleting the directory manually, prune the metadata:
rm -rf ../myproject-hotfix
git worktree prune
# Cleans up .git/worktrees/ entries that no longer exist on disk</code></pre>

<h3>Moving a worktree</h3>
<pre><code>git worktree move ../old-path ../new-path
# Moves the worktree directory and updates Git metadata</code></pre>

<h3>Locking / unlocking worktrees</h3>
<pre><code># Lock to prevent accidental removal (e.g., on external drive):
git worktree lock ../myproject-archive --reason "release archive"

# Unlock:
git worktree unlock ../myproject-archive

# Locked worktrees won't be auto-pruned even if path is missing</code></pre>

<h3>Worktree metadata location</h3>
<pre><code># In main repo:
ls .git/worktrees/

# Each linked worktree has a subdir:
.git/worktrees/&lt;name&gt;/
├── HEAD              ← per-worktree HEAD
├── ORIG_HEAD
├── commondir         ← back-reference to main .git
├── gitdir            ← path to .git file in linked worktree
├── index             ← per-worktree staging
└── locked            ← present if locked</code></pre>

<h3>Common workflow: hotfix while feature work is in progress</h3>
<pre><code># State: working on feature/X with uncommitted changes
# Hotfix needed on release/v3.5

# Create hotfix worktree:
git worktree add -b hotfix/payment-bug ../myproject-hotfix release/v3.5

# Switch to it:
cd ../myproject-hotfix

# Mobile: install deps for this worktree's package.json:
yarn install
cd ios && pod install && cd ..

# Make the fix:
# ... edit, commit ...
git push origin hotfix/payment-bug

# Open PR, merge, ship via release process.

# When done:
cd ../myproject  # back to feature work
git worktree remove ../myproject-hotfix

# Or keep around if you'll iterate:
# (just leave it; small disk cost; instant access next time)</code></pre>

<h3>Common workflow: review someone's PR locally</h3>
<pre><code># Setup (assumes GitHub-style remote):
git fetch origin

# Create worktree for the PR:
git worktree add ../pr-1234 origin/feature/pr-branch

# Or for GitHub PR:
git fetch origin pull/1234/head:pr-1234
git worktree add ../pr-1234 pr-1234

# In worktree:
cd ../pr-1234
yarn install   # install deps as PR has them
yarn test      # run tests
# ... build, manually verify ...

# When review done:
cd ../myproject
git worktree remove ../pr-1234</code></pre>

<h3>Bisect in a worktree</h3>
<pre><code># Bisect detaches HEAD and may take many minutes.
# Don't do it on your main worktree if you have uncommitted work.

# Create dedicated worktree:
git worktree add --detach ../myproject-bisect

cd ../myproject-bisect
git bisect start
git bisect bad HEAD
git bisect good v3.4
git bisect run ./test.sh

# Found! Inspect:
git show &lt;sha&gt;
git bisect reset

# Cleanup:
cd ../myproject
git worktree remove ../myproject-bisect</code></pre>

<h3>Worktrees with submodules</h3>
<pre><code># Submodules are tricky; each worktree needs them initialized:
git worktree add ../myproject-feature feature-branch
cd ../myproject-feature
git submodule update --init --recursive

# Submodule storage location (depends on Git version):
# - Older: each worktree has its own submodule dir
# - Newer (2.5+): shared submodule dir; saves space</code></pre>

<h3>Worktree-specific gitignore</h3>
<pre><code># Per-worktree exclude file:
.git/worktrees/&lt;worktree-name&gt;/info/exclude

# Add patterns; they apply only in that worktree.
# Useful for: build artifacts, IDE config, workspace files
# specific to one worktree's purpose.</code></pre>

<h3>Useful aliases</h3>
<pre><code># In ~/.gitconfig:
[alias]
  wt = worktree
  wtl = worktree list
  wta = worktree add
  wtr = worktree remove
  wtp = worktree prune

# Now: git wta ../foo-hotfix release/v3.5
#      git wtl
#      git wtr ../foo-hotfix</code></pre>

<h3>Shell helpers</h3>
<pre><code># Function to create + cd into a worktree (zsh / bash):
function wta() {
  local path="$1"
  local branch="$2"
  git worktree add "$path" "$branch" &amp;&amp; cd "$path"
}

# Usage:
wta ../foo-hotfix release/v3.5

# Function to remove worktree + cd back to main:
function wtr() {
  local path="$1"
  cd "$(git rev-parse --show-toplevel)/.." # parent of current
  cd ./$(basename "$(git rev-parse --git-common-dir | xargs dirname)")
  git worktree remove "$path"
}</code></pre>

<h3>Worktree + IDE integration</h3>
<table>
  <thead><tr><th>IDE</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>VS Code</td><td>Open each worktree as separate window. Workspace folders feature handles multi-worktree views.</td></tr>
    <tr><td>Xcode</td><td>Each worktree should have its own derived data; configure in Xcode settings or use per-project derived data path.</td></tr>
    <tr><td>Android Studio / IntelliJ</td><td>Each worktree opens as separate project; .idea/ in each is independent.</td></tr>
    <tr><td>Vim / Emacs</td><td>Just <code>cd</code> and open. Per-buffer.</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'examples',
      title: '🔍 Worked Examples',
      html: `
<h3>Example 1: Mobile hotfix without disturbing feature work</h3>
<p><strong>Setup:</strong> You're 3 days into a feature branch. iOS Pods are installed; Xcode is indexed; simulator has test data. Crash report comes in for production v3.5.</p>

<pre><code># Without worktrees:
# 1. git stash
# 2. git checkout release/v3.5
# 3. yarn install (lockfile may differ)
# 4. cd ios && pod install (slow; reset of Pods)
# 5. open ios/MyApp.xcworkspace (re-index, ~30s)
# 6. Reset simulator (test data lost)
# 7. Make fix; build; verify
# 8. Commit, push, ship hotfix
# 9. Reverse all of the above to get back to feature
# Total: 30-60 min of overhead

# With worktrees:
git worktree add -b hotfix/login-crash ../myproject-hotfix release/v3.5
cd ../myproject-hotfix

# Install deps for this worktree's lockfile state:
yarn install
cd ios && pod install && cd ..

# Make fix; build; verify; ship.
git push origin hotfix/login-crash

# Original worktree (~/repos/myproject) still has:
# - Feature branch checked out
# - Pods state from feature
# - Xcode index
# - Simulator state
# - Uncommitted changes intact

# Done with hotfix:
cd ../myproject
git worktree remove ../myproject-hotfix

# Continue feature work where you left off.
# Total overhead: ~5 minutes (just the additional pod install).</code></pre>

<h3>Example 2: Reviewing a complex PR locally</h3>
<p><strong>Setup:</strong> Senior peer's PR is 30 files; you want to read code, run it, build, manually verify. PR has been open for a week.</p>

<pre><code># Fetch PR (GitHub):
git fetch origin pull/4567/head:pr-4567

# Create worktree:
git worktree add ../my-app-pr-4567 pr-4567

# Open in IDE:
code ../my-app-pr-4567

# In another terminal:
cd ../my-app-pr-4567
yarn install
yarn ios   # build and run
# Manually test the changes.

# Read code in IDE; leave comments on PR via GitHub.

# When done reviewing:
cd ../my-app
git worktree remove ../my-app-pr-4567

# Compare: without worktrees, you'd stash your work, checkout the
# PR, install / build / verify, then reverse it all. With worktrees,
# your own work was untouched the whole time.</code></pre>

<h3>Example 3: Long-running test suite without freezing dev</h3>
<p><strong>Setup:</strong> You want to run the full E2E test suite (45 min) for verification before shipping. You also want to keep coding.</p>

<pre><code># Create dedicated test worktree:
git worktree add ../my-app-e2e main
cd ../my-app-e2e
yarn install

# Start the test suite:
yarn test:e2e:full &gt; e2e-results.log 2&gt;&amp;1 &amp;

# Switch back to main worktree:
cd ../my-app

# Continue coding. Tests run in the background in the other
# worktree; results stream to e2e-results.log.

# Check periodically:
tail -f ../my-app-e2e/e2e-results.log

# Tests done; check results; cleanup:
cd ../my-app-e2e
# Verify success
cd ../my-app
git worktree remove ../my-app-e2e</code></pre>

<h3>Example 4: Comparing two implementations side-by-side</h3>
<p><strong>Setup:</strong> Considering two architectural approaches; want to see them side-by-side.</p>

<pre><code># Create worktree per approach:
git worktree add -b experiment/approach-a ../my-app-a main
git worktree add -b experiment/approach-b ../my-app-b main

# Implement approach A:
cd ../my-app-a
# ... code ...
git commit -am "Approach A: redux-based state"

# Implement approach B:
cd ../my-app-b
# ... code ...
git commit -am "Approach B: signals-based state"

# Open both in IDE windows; compare.
# Run benchmarks in each:
cd ../my-app-a && yarn benchmark
cd ../my-app-b && yarn benchmark

# Decide; merge winner; cleanup loser:
git worktree remove ../my-app-a   # if B wins
cd ../my-app
git branch -D experiment/approach-a   # delete the branch too
# Pick up approach B and continue
git checkout experiment/approach-b
git rebase main
# ... continue refining ...</code></pre>

<h3>Example 5: Bisect in worktree</h3>
<p><strong>Setup:</strong> Production crash; need to bisect ~150 commits. Each step is ~3-min build. Don't want to disturb your active feature work.</p>

<pre><code># Create dedicated bisect worktree:
git worktree add --detach ../my-app-bisect

cd ../my-app-bisect
yarn install
cd ios && pod install && cd ..

# Run bisect:
git bisect start
git bisect bad main
git bisect good v3.4
git bisect run ./bisect_test.sh

# Walk away. Come back to:
# "abc1234 is the first bad commit"
git show abc1234

# Take notes / open issue.
git bisect reset

# Cleanup:
cd ../my-app
git worktree remove ../my-app-bisect

# Original worktree is untouched throughout the bisect.</code></pre>

<h3>Example 6: Multiple parallel features</h3>
<p><strong>Setup:</strong> You're juggling 2 features for different sprints. Want to context-switch instantly.</p>

<pre><code>git worktree add ../my-app-feature-1 feature/login-redesign
git worktree add ../my-app-feature-2 feature/payment-revamp

# Each worktree fully set up:
cd ../my-app-feature-1
yarn install && cd ios && pod install && cd ..

cd ../my-app-feature-2
yarn install && cd ios && pod install && cd ..

# Now: switching between features is just cd. No re-install.

# When working on feature 1:
cd ../my-app-feature-1
yarn ios
# Develop.

# When PM asks status on feature 2:
cd ../my-app-feature-2
yarn ios
# Develop / demo.

# When sprint ends:
git worktree remove ../my-app-feature-1
# Or keep if work continues next sprint.</code></pre>

<h3>Example 7: Maintaining multiple release branches</h3>
<p><strong>Setup:</strong> You maintain 3 supported releases (v3.4 LTS, v3.5, v3.6 beta). Frequently backport fixes.</p>

<pre><code>git worktree add ../my-app-v3.4 release/v3.4
git worktree add ../my-app-v3.5 release/v3.5
git worktree add ../my-app-v3.6 release/v3.6

# When backporting a fix from main:
# Step 1: fix on main as usual
cd ../my-app
# ... fix, commit, push ...

# Step 2: backport to each release worktree:
cd ../my-app-v3.6
git pull
git cherry-pick -x &lt;fix-sha&gt;
yarn test  # or: ./run-release-tests.sh
git push

cd ../my-app-v3.5
git pull
git cherry-pick -x &lt;fix-sha&gt;
yarn test
git push

cd ../my-app-v3.4
git pull
git cherry-pick -x &lt;fix-sha&gt;
yarn test
git push

# Total: ~10 min for full multi-release backport.
# Without worktrees: 30+ min of branch switching + builds.</code></pre>

<h3>Example 8: Recovering after manual directory deletion</h3>
<p><strong>Setup:</strong> You manually <code>rm -rf</code>'d a worktree directory; Git still thinks it exists.</p>

<pre><code>git worktree list
# /Users/me/my-app                abc1234 [main]
# /Users/me/my-app-hotfix          def5678 [release/v3.5]    ← gone!

# Try to remove (will fail):
git worktree remove ../my-app-hotfix
# error: '../my-app-hotfix' is not a working tree

# Prune cleans up orphans:
git worktree prune

# Now:
git worktree list
# /Users/me/my-app                abc1234 [main]
# (clean)</code></pre>

<p><strong>Lesson:</strong> always use <code>git worktree remove</code>, but <code>git worktree prune</code> recovers from manual deletions.</p>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Worktree on a branch already checked out elsewhere</h3>
<p>Attempting to check out the same branch in two worktrees fails:</p>
<pre><code>git worktree add ../foo-2 feature/X
# fatal: 'feature/X' is already checked out at '/path/to/foo'</code></pre>
<p>Workarounds:</p>
<ul>
  <li>Use a different branch.</li>
  <li>Use detached HEAD: <code>git worktree add --detach ../foo-2 feature/X</code></li>
  <li>Force the operation (rare; risky): <code>git worktree add --force ../foo-2 feature/X</code> — generally avoid.</li>
</ul>

<h3>Branch deletion when checked out in worktree</h3>
<pre><code>git branch -d feature/X
# error: Cannot delete branch 'feature/X' checked out at '/path/to/foo-feature'</code></pre>
<p>Solution: remove or switch the worktree first, then delete the branch.</p>

<h3>Worktrees on shared filesystems</h3>
<p>Worktrees on network mounts (NFS, SMB) or external drives have caveats:</p>
<ul>
  <li>File-system-level operations may be slow.</li>
  <li>Locks and atomic operations may not behave as expected on some filesystems.</li>
  <li>Use <code>git worktree lock</code> to prevent accidental prune if path is sometimes unmounted.</li>
</ul>

<h3>Worktrees with hooks</h3>
<p>Hooks live in <code>.git/hooks/</code> in main worktree; shared by all linked worktrees by default.</p>
<ul>
  <li>Pre-commit / pre-push hooks run for commits made in any worktree.</li>
  <li>Worktree-specific hooks: set <code>core.hooksPath</code> per-worktree config.</li>
</ul>

<h3>Worktrees with LFS</h3>
<p>Git LFS files (large files via pointer) need to be fetched per-worktree:</p>
<pre><code>cd ../my-app-feature
git lfs pull   # fetch LFS objects for this worktree's checkout</code></pre>

<h3>Worktrees and submodules</h3>
<p>Submodules in worktrees can be tricky:</p>
<ul>
  <li>Each worktree may need <code>git submodule update --init --recursive</code> after creation.</li>
  <li>Older Git versions stored submodule data per-worktree (disk-heavy).</li>
  <li>Newer Git (2.5+) shares submodule storage; better.</li>
  <li>Switching submodule SHAs across worktrees can cause confusion; verify state with <code>git submodule status</code>.</li>
</ul>

<h3>Worktrees with .env / local config files</h3>
<p>Untracked files (.env, .vscode/settings.json) exist independently per-worktree:</p>
<ul>
  <li>Setting up a new worktree requires copying these in (or symlinking).</li>
  <li>Some teams check in <code>.env.example</code>; new worktrees copy.</li>
</ul>

<h3>Worktrees and CI</h3>
<p>CI runners typically clone fresh; worktrees are a local-developer tool. But:</p>
<ul>
  <li>Some CI optimization tools use worktrees internally to reduce clone time on caching workers.</li>
  <li>If your CI script does <code>git worktree</code> ops, ensure cleanup to avoid stale worktrees on shared runners.</li>
</ul>

<h3>Disk usage of worktrees</h3>
<p>Each worktree has:</p>
<ul>
  <li>The full working tree files (your repo's contents).</li>
  <li>Plus build artifacts (node_modules, build/, .next/, etc.).</li>
  <li>Plus IDE caches (.idea/, .vscode/).</li>
</ul>
<p>For large mobile codebases (200MB code + 1GB node_modules + 500MB Pods + 2GB Xcode build), each worktree is ~4GB. Three worktrees: 12GB. Manage accordingly.</p>

<h3>Stash and worktrees</h3>
<p>Stashes are global to the repo, not per-worktree:</p>
<pre><code>cd ../my-app-feature-1
git stash push -m "WIP feature 1"

cd ../my-app-feature-2
git stash list
# stash@{0}: On feature/X: WIP feature 1   ← visible here!
git stash apply  # CAREFUL: applying feature 1's stash to feature 2's worktree</code></pre>
<p>Be careful with stash + worktrees. Use stash names + check before applying.</p>

<h3>Branch checkouts in detached HEAD via worktree</h3>
<p><code>--detach</code> creates a worktree at a specific commit without a branch. New commits are orphaned unless you branch off.</p>
<pre><code>git worktree add --detach ../foo-historical &lt;old-sha&gt;
cd ../foo-historical
# Make changes
git commit -m "experimental"
# This commit is orphaned; not on any branch
# Save it:
git branch experimental-branch
# Now branch tracks the new commit</code></pre>

<h3>Worktree pruning automatically</h3>
<p>Git auto-prunes worktrees missing for &gt; <code>gc.worktreePruneExpire</code> (default 3 months):</p>
<pre><code>git config --global gc.worktreePruneExpire "1 month"
# Or never:
git config --global gc.worktreePruneExpire never</code></pre>

<h3>Worktree directory inside the main repo</h3>
<p>Putting a worktree inside the main repo's directory tree is allowed but causes issues:</p>
<ul>
  <li>Recursive directory issues (main worktree shows the linked worktree's files).</li>
  <li>Build / test scripts that walk the directory may pick up wrong files.</li>
  <li>Better: keep linked worktrees outside the main worktree.</li>
</ul>

<h3>Mobile-specific: Pods and worktrees</h3>
<p>Each iOS worktree needs its own <code>ios/Pods/</code>. Cannot share. Mitigation:</p>
<ul>
  <li>Use CocoaPods caching (<code>~/Library/Caches/CocoaPods</code>) — pods download once, install across worktrees fast.</li>
  <li>Don't symlink Pods between worktrees; can break Xcode.</li>
</ul>

<h3>Mobile-specific: Gradle builds</h3>
<p>Android builds with Gradle have <code>~/.gradle/caches/</code> shared across worktrees, but each worktree's <code>build/</code> is local. Re-build per worktree.</p>

<h3>Worktree config gotcha: <code>core.bare</code></h3>
<p>If main repo is bare, worktrees become primary working areas. Common in CI / remote-build setups:</p>
<pre><code># Setup:
git clone --bare https://github.com/.../foo.git foo.git
cd foo.git
git worktree add ../foo-main main
git worktree add ../foo-dev dev
# All work happens in linked worktrees; foo.git is just the object store</code></pre>
`
    },
    {
      id: 'bugs',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Anti-pattern: not removing finished worktrees</h3>
<p><strong>Looks like:</strong> Pile up 10+ worktrees over months; never remove.</p>
<p><strong>Why bad:</strong> Disk usage compounds. <code>git worktree list</code> output gets noisy.</p>
<p><strong>Fix:</strong> Remove worktrees when done. Or keep only "active" worktrees and recreate as needed.</p>

<h3>Anti-pattern: rm -rf worktree directory directly</h3>
<p><strong>Looks like:</strong> Delete worktree dir manually; Git still thinks it exists.</p>
<p><strong>Why bad:</strong> Stale entries in <code>.git/worktrees/</code>. <code>git worktree list</code> lies.</p>
<p><strong>Fix:</strong> Always <code>git worktree remove &lt;path&gt;</code>. If you must delete manually, run <code>git worktree prune</code> after.</p>

<h3>Anti-pattern: trying to check out same branch twice</h3>
<p><strong>Looks like:</strong> <code>git worktree add ../foo-2 feature/X</code> when feature/X is already checked out.</p>
<p><strong>Why bad:</strong> Operation fails; engineer confused.</p>
<p><strong>Fix:</strong> Use different branch in second worktree. Or detach: <code>git worktree add --detach</code>.</p>

<h3>Anti-pattern: symlinking node_modules between worktrees</h3>
<p><strong>Looks like:</strong> Engineer thinks "my deps are the same; symlink node_modules to avoid re-install."</p>
<p><strong>Why bad:</strong> If branches differ in dep versions, symlink causes wrong deps; subtle bugs. Native modules especially break.</p>
<p><strong>Fix:</strong> Each worktree gets its own <code>yarn install</code>. Use yarn's offline cache (or pnpm) for fast installs.</p>

<h3>Anti-pattern: doing destructive operations on shared <code>.git</code></h3>
<p><strong>Looks like:</strong> <code>git gc</code> or <code>git filter-repo</code> while another worktree is mid-work.</p>
<p><strong>Why bad:</strong> Object pruning while linked worktree references those objects = corruption.</p>
<p><strong>Fix:</strong> Run global Git operations only when all linked worktrees are clean / removed.</p>

<h3>Anti-pattern: worktree on branch about to be deleted</h3>
<p><strong>Looks like:</strong> Linked worktree's branch was deleted on remote; engineer surprised when next pull is weird.</p>
<p><strong>Why bad:</strong> Dangling branch; tracking is gone.</p>
<p><strong>Fix:</strong> Coordinate: don't delete branches that have linked worktrees. Or remove worktree first.</p>

<h3>Anti-pattern: deeply nested worktree paths</h3>
<p><strong>Looks like:</strong> Worktrees inside worktrees; 5 levels deep.</p>
<p><strong>Why bad:</strong> Confusion; pathing bugs.</p>
<p><strong>Fix:</strong> Flat or one-level-deep layout. Document team convention.</p>

<h3>Anti-pattern: copying secrets across worktrees</h3>
<p><strong>Looks like:</strong> <code>cp ../my-app/.env .</code> for each new worktree.</p>
<p><strong>Why bad:</strong> Secrets in multiple places; harder to rotate; risk of accidental commit.</p>
<p><strong>Fix:</strong> Use a shared secrets manager (1Password CLI, AWS Secrets, etc.). Or symlink with explicit knowledge.</p>

<h3>Anti-pattern: not updating dep state across worktrees</h3>
<p><strong>Looks like:</strong> Dep updated in one worktree; other worktrees still on old deps; mysterious test failures.</p>
<p><strong>Why bad:</strong> Each worktree has its own <code>node_modules</code>; out of sync.</p>
<p><strong>Fix:</strong> When pulling new commits in any worktree, run <code>yarn install</code> if package.json changed.</p>

<h3>Anti-pattern: confusion about which worktree is "main"</h3>
<p><strong>Looks like:</strong> Engineer forgets which is the original repo; tries to remove main worktree (fails).</p>
<p><strong>Why bad:</strong> Time wasted; worktree removal fails confusingly.</p>
<p><strong>Fix:</strong> <code>git worktree list</code> shows main first. Memorize / aliase. Or just always <code>cd</code> to the path you know is main.</p>

<h3>Anti-pattern: stash leakage</h3>
<p><strong>Looks like:</strong> Stash created in worktree A; engineer applies in worktree B by accident.</p>
<p><strong>Why bad:</strong> Wrong code applied to wrong context.</p>
<p><strong>Fix:</strong> Name your stashes clearly. <code>git stash list</code> shows source branch — read it before applying.</p>

<h3>Anti-pattern: ignoring auto-prune</h3>
<p><strong>Looks like:</strong> Lock + ignore worktrees on external drive; forget about them; auto-prune kicks in eventually.</p>
<p><strong>Why bad:</strong> Worktree gone; metadata gone; recovery requires re-create.</p>
<p><strong>Fix:</strong> <code>git worktree lock</code> for worktrees you intend to keep. Configure <code>gc.worktreePruneExpire</code>.</p>

<h3>Anti-pattern: heavy IDE usage in many worktrees</h3>
<p><strong>Looks like:</strong> 5 worktrees, each with full IDE / Xcode index loaded.</p>
<p><strong>Why bad:</strong> RAM exhaustion; slow machine; IDE crashes.</p>
<p><strong>Fix:</strong> Open IDE only in active worktree; close others. Or use lighter editors (vim, vscode-no-extensions) for the secondary worktrees.</p>

<h3>Anti-pattern: thinking worktrees solve all context-switch issues</h3>
<p><strong>Looks like:</strong> "Worktrees mean I never need to think about state again."</p>
<p><strong>Why bad:</strong> Database state, server state, simulator state, push-notification tokens — all are external to Git.</p>
<p><strong>Fix:</strong> Worktrees solve Git-state context switches. Other state still requires care.</p>

<h3>Anti-pattern: never using worktrees because "git stash works"</h3>
<p><strong>Looks like:</strong> Heavy stash usage; never tries worktree; stash conflicts on long-running stashes.</p>
<p><strong>Why bad:</strong> Stash works for short-term; long-term it's risky. Stashes can conflict when applied to drifted branches; large stashes become hard to manage.</p>
<p><strong>Fix:</strong> Try worktrees once. If you have multi-branch parallel work, the workflow improvement is real.</p>
`
    },
    {
      id: 'interview',
      title: '🎤 Interview Patterns',
      html: `
<h3>"Have you used <code>git worktree</code>?"</h3>
<p>Lower-frequency interview question; often signals the interviewer values workflow productivity.</p>

<pre><code>"Yes, regularly. Worktrees let me check out multiple branches of
the same repo into separate directories simultaneously, sharing
the same .git database.

Main use cases for me:
- Hotfix on release branch while feature work is in progress —
  no stashing.
- Reviewing a teammate's PR locally without disturbing my own
  branch's state.
- Long-running tests / builds in a dedicated worktree without
  blocking my main dev workflow.

For mobile work it's especially valuable because builds take
minutes — switching branches without worktrees means re-installing
Pods, re-indexing Xcode, etc., for every context switch."</code></pre>

<h3>"What's the difference between <code>worktree</code> and just cloning the repo twice?"</h3>
<pre><code>"Worktrees share .git — same object store, same refs. Cloning
twice gives you two independent repos with their own histories
that don't see each other until push/fetch.

Worktree advantages:
- Faster to create (no re-clone).
- Less disk usage (one copy of objects).
- Commits in one worktree visible immediately in others.

Clone advantages:
- Truly isolated environments (different remotes, different
  configs).
- Won't be affected by destructive operations on .git.

For 'I want parallel branches of the same project,' worktrees
win. For 'I want a sandbox to experiment with destructive Git
operations,' clone."</code></pre>

<h3>"How do you handle parallel work?"</h3>
<p>Behavioral / workflow question. Worktrees are a good answer.</p>
<pre><code>"Heavy worktree user. I usually have 2-4 worktrees active:
- Main branch checkout for general dev.
- Feature branch for current sprint work.
- Sometimes a third for hotfix or PR review as needed.

Each is a fully set-up environment — deps installed, IDE state,
build caches. Switching contexts is just cd; no stash, no rebuild.

For mobile, this saves me 10-20 minutes per context switch
because Pod install + Xcode re-index would otherwise be the
bottleneck.

When I'm done with a worktree, I git worktree remove it. If I'll
revisit the branch soon, I leave the worktree around for instant
re-entry."</code></pre>

<h3>"Tell me about a time worktrees saved you"</h3>
<pre><code>"Mid-feature branch with native code changes that took 20 min to
build. Production hotfix needed for v3.5. Without worktrees:

- git stash (lose my mental state)
- git checkout release/v3.5
- yarn install + pod install (5 min)
- xcode re-index (1 min)
- Make fix, build, ship
- Reverse all of the above to return to feature
- Total: 35-45 min interruption

With worktrees:
- git worktree add ../app-hotfix release/v3.5
- cd ../app-hotfix
- yarn install + pod install in NEW directory (still 5 min, but
  in a fresh dir, parallel to my feature build)
- Make fix, build, ship
- cd back to feature; my Xcode is still open, my simulator state
  is intact, my uncommitted changes are still there
- Total: 10 min interruption

Compounds across many hotfixes. Worktrees pay back daily for
me."</code></pre>

<h3>"What's the limitation on worktree branches?"</h3>
<pre><code>"Same branch can only be checked out in one worktree at a time.
If feature/X is checked out in worktree A, worktree B trying to
check out feature/X fails.

Workarounds:
- Different branch in worktree B.
- Detached HEAD: git worktree add --detach.
- If you really need parallel edits to the same branch (rare),
  consider whether you should fork into two branches.

Most usage is naturally one-branch-per-worktree, so this rarely
bites."</code></pre>

<h3>"How do you clean up worktrees?"</h3>
<pre><code>"Three patterns:

1. Clean removal: git worktree remove ../path.
   Works when worktree is clean. Removes directory + metadata.

2. Force removal: git worktree remove --force ../path.
   For worktrees with uncommitted changes you don't want.

3. Recover from manual deletion: rm -rf ../path,
   then git worktree prune.

I run git worktree prune occasionally to clean up orphans (e.g.,
external-drive worktrees that auto-pruned). It's safe; just
removes metadata for non-existent paths."</code></pre>

<h3>"What about worktrees on bare repos?"</h3>
<pre><code>"You can clone --bare and then use worktrees as your only working
checkouts. Setup:

  git clone --bare URL repo.git
  cd repo.git
  git worktree add ../repo-main main
  git worktree add ../repo-dev develop

The bare repo is just the object store; all dev happens in
worktrees.

This is sometimes preferred for: shared dev machines (multiple
worktrees per user), or CI setups where you want to control
checkout location explicitly.

For solo developer use, regular clone + worktrees is simpler."</code></pre>

<h3>"What's the relationship between worktrees and stash?"</h3>
<pre><code>"Stashes are global to the repo, not per-worktree. So a stash
created in worktree A is visible in worktree B.

Implication: care needed. If you git stash apply in the wrong
worktree, you may apply changes to the wrong branch.

I've largely replaced stash with worktrees for parallel work.
Stash is fine for 'I'll come back to this in 10 minutes' on the
same branch; for anything longer or branch-switching, worktrees
are better."</code></pre>

<h3>"Do you use worktrees in your team?"</h3>
<pre><code>"Personally yes; team adoption varies. Worktrees are a developer-
productivity tool, not a team policy thing — engineers either
discover them and adopt or don't.

I've documented my workflow in our team wiki for engineers who
want to try them. Especially valuable for mobile engineers
because of build times.

I don't push them on people; some engineers prefer stash + branch
switching, and that's fine. But for my own productivity, the
multi-worktree workflow is non-negotiable now."</code></pre>

<h3>Common follow-ups</h3>
<table>
  <thead><tr><th>Question</th><th>What they're checking</th></tr></thead>
  <tbody>
    <tr><td>"How are worktrees different from submodules?"</td><td>Worktrees = same repo, different checkouts. Submodules = nested repos.</td></tr>
    <tr><td>"What's your worktree directory layout?"</td><td>Sibling dirs vs. nested vs. dotfile patterns; opinion welcomed</td></tr>
    <tr><td>"Can you share a node_modules between worktrees?"</td><td>Technically yes via symlink; usually a bad idea (native modules break)</td></tr>
    <tr><td>"How do you pick when to use a worktree?"</td><td>Multi-day parallel branches; build-heavy work; review locally</td></tr>
    <tr><td>"What if disk space is a concern?"</td><td>Each worktree is full repo + deps; remove when done; consider sparse-checkout</td></tr>
  </tbody>
</table>

<h3>The 30-second mantra</h3>
<p><em>"One repo, many checkouts. Use worktrees for parallel branches. Hotfixes don't disturb feature work. Same branch only in one worktree. Remove cleanly. Pays back daily for build-heavy stacks like mobile."</em></p>
<p>Worktrees are one of those Git features that quietly transform your workflow once adopted. Many engineers don't know about them; the ones who do don't go back.</p>
`
    }
  ]
});
