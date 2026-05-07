window.PREP_SITE.registerTopic({
  id: 'git-bisect',
  module: 'git',
  title: 'Bisect for Bug Hunting',
  estimatedReadTime: '30 min',
  tags: ['git', 'bisect', 'debugging', 'regression', 'binary-search', 'workflow'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><code>git bisect</code> is binary search over commit history. When a regression appears between two known points (e.g., "worked at v3.4, broken at v3.5"), bisect locates the exact commit that introduced it in O(log N) steps. For a 1000-commit range, that's ~10 checkouts. Done right, bisect transforms a "needle in haystack" debugging session into a methodical 20-30 minute exercise.</p>
<ul>
  <li><strong>Bisect requires a "good" and "bad" commit.</strong> Bisect walks the history between them, asking you to test each point.</li>
  <li><strong>Bisect requires a clear test.</strong> "Is this commit good or bad?" must have an unambiguous answer; flaky tests destroy bisect.</li>
  <li><strong>Manual bisect:</strong> you check out each commit, test, mark good or bad. Git picks the next midpoint.</li>
  <li><strong>Automated bisect (<code>git bisect run &lt;script&gt;</code>):</strong> bisect runs your script at each commit; script's exit code (0 = good, 1 = bad, 125 = skip) drives the search. Run, walk away, return to the answer.</li>
  <li><strong>Bisect needs bisectable history.</strong> Each commit should compile + pass basic tests. Commits in feature branches that don't compile (WIP, etc.) break bisect — squash them before merge.</li>
  <li><strong>Bisect is most useful for "regression" debugging</strong> — bug existed before your work, you want to find when it was introduced.</li>
  <li><strong>Mobile / RN context:</strong> bisect is invaluable when "the app crashes only on iOS 16" or "scroll is laggy on Android 13" — find the commit, ship the fix.</li>
  <li><strong>For complex, slow, or hard-to-test bugs:</strong> bisect requires upfront investment to make tests fast/automated; pays back enormously.</li>
</ul>
<p><strong>Mantra:</strong> "Find a good commit. Find a bad commit. Define the test. Run bisect. Skip commits that won't build. Automate when possible. Reset when done."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>The bisect mental model</h3>
<p>Imagine your commit history as a sorted list (chronologically). Some commit is the "first bad" commit — one where the bug appears. Before it: all good. After it: all bad (or at least, contains the bad).</p>
<pre><code>Commits:    A B C D E F G H I J K L M
States:     G G G G G G G G B B B B B
                              ^
                              First bad commit (I)</code></pre>
<p>Linear search would test 8 commits to find I. Binary search tests log₂(13) ≈ 4 commits. Bisect is binary search.</p>

<h3>Why bisect is critical</h3>
<table>
  <thead><tr><th>Without bisect</th><th>With bisect</th></tr></thead>
  <tbody>
    <tr><td>Read code, guess at cause, hours of investigation</td><td>10-20 commit checkouts, find exact change</td></tr>
    <tr><td>"It started happening sometime last month"</td><td>"It started in commit abc1234 by [author] on [date]"</td></tr>
    <tr><td>Cannot debug regressions in unfamiliar code</td><td>Find regression even in code you've never seen</td></tr>
    <tr><td>Best for "I think I changed something"</td><td>Best for "this used to work; what broke it?"</td></tr>
  </tbody>
</table>

<h3>When bisect shines</h3>
<ul>
  <li><strong>Regressions:</strong> "Tests were passing in v3.4; failing in v3.5."</li>
  <li><strong>Performance regressions:</strong> "App launch was 1.2s; now it's 2.5s."</li>
  <li><strong>Behavioral changes:</strong> "The button used to be blue; now it's green."</li>
  <li><strong>Crash bugs:</strong> "App crashes on this specific OS version after some update."</li>
  <li><strong>Test flakes:</strong> Sometimes; usually not bisectable directly because flakes aren't deterministic.</li>
  <li><strong>Memory regressions:</strong> If you have a measurement script.</li>
</ul>

<h3>When bisect doesn't help</h3>
<ul>
  <li><strong>"Always-broken" bugs.</strong> No good commit exists.</li>
  <li><strong>Non-deterministic bugs.</strong> Bisect needs reproducible test; if 30% of runs pass, you mark wrong commits.</li>
  <li><strong>External-state-dependent bugs.</strong> Bug depends on database state, server state, OS version, etc. — fix requires controlling those.</li>
  <li><strong>Bugs that span multiple commits.</strong> Maybe commit A introduced an off-by-one and commit B exposed it. Bisect finds B; you still need investigation for A.</li>
</ul>

<h3>Why bisect requires "bisectable history"</h3>
<p>Bisect's value depends on each commit being testable. If your history has commits that don't even compile (WIP commits, half-done refactors), bisect lands on them and you must <code>git bisect skip</code> — losing efficiency.</p>
<p>Hence: senior engineers value clean, atomic commits. Each commit should:</p>
<ul>
  <li>Compile.</li>
  <li>Pass basic tests.</li>
  <li>Be a logical unit.</li>
  <li>Have a good message.</li>
</ul>
<p>This is one of the strongest arguments for interactive rebase before push (see <a href="#" data-topic="git-rebase">Rebase</a>).</p>

<h3>The mobile / RN context</h3>
<p>Bisect is especially powerful for mobile because:</p>
<ul>
  <li><strong>OS-version-specific bugs</strong> are common; bisect finds them quickly even when you can't reproduce on your dev device.</li>
  <li><strong>Performance regressions</strong> ("launch is 30% slower") that would take days to investigate manually.</li>
  <li><strong>Native build issues</strong> ("Pods.lock changed in some commit and now Xcode fails") often best found via bisect.</li>
  <li><strong>Crash regressions</strong> in production — start with the release tag and bisect against last-good tag.</li>
</ul>

<h3>The cost of bisect</h3>
<p>Not free:</p>
<ul>
  <li>Each step: checkout, build, test. Mobile builds can be 1-5 minutes.</li>
  <li>Need a clear test. Sometimes writing the test takes longer than the bisect.</li>
  <li>If automated, the script must be reliable.</li>
</ul>
<p>For 100 commits and a 3-min test, manual bisect is ~7 steps × 4 min ≈ 30 minutes. For 1000 commits, ~10 steps × 4 min ≈ 40 minutes. Not free, but radically better than guesswork on large ranges.</p>

<h3>Bisect's intellectual lineage</h3>
<p>The same idea appears in many domains:</p>
<ul>
  <li>Binary search in algorithms.</li>
  <li>"Divide and conquer" debugging.</li>
  <li>Bisection method in numerical analysis.</li>
  <li>"Eat the elephant one bite at a time" in incident response.</li>
</ul>
<p>Internalize the principle: when you have a sorted (or quasi-sorted) space and a yes/no test, binary search is your friend.</p>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The "good and bad" frame</h3>
<p>Bisect requires you to define:</p>
<ul>
  <li><strong>Good:</strong> a commit where the bug is NOT present.</li>
  <li><strong>Bad:</strong> a commit where the bug IS present.</li>
  <li><strong>Test:</strong> a deterministic way to ask "is this commit good or bad?"</li>
</ul>
<p>The test is the load-bearing piece. If your test is wrong (false positives or negatives), bisect leads you to the wrong commit. Often you discover halfway through that your test isn't quite right; reset and start over.</p>

<h3>The "automation calculus"</h3>
<p>Manual vs. automated bisect:</p>
<table>
  <thead><tr><th>Factor</th><th>Manual</th><th>Automated</th></tr></thead>
  <tbody>
    <tr><td>Test writing time</td><td>Low (just test in your head)</td><td>Medium-high (need a script)</td></tr>
    <tr><td>Time per step</td><td>Whatever your test takes</td><td>Whatever your script takes</td></tr>
    <tr><td>Reliability</td><td>You can spot-check; subtle bugs may bias</td><td>Deterministic; no human error</td></tr>
    <tr><td>Re-run cost</td><td>Re-run from scratch</td><td>Just re-run the script</td></tr>
    <tr><td>Best for</td><td>1-time, slow tests, hard to script</td><td>Repeatable, slow but scriptable, possible re-runs</td></tr>
  </tbody>
</table>
<p>Heuristic: if test takes &lt; 30 seconds, manual is fine. If test takes &gt; 1 minute or you'll bisect repeatedly, write a script.</p>

<h3>The "skip" pattern</h3>
<p>Some commits in your history can't be tested:</p>
<ul>
  <li>Don't compile (broken intermediate state).</li>
  <li>Test infrastructure not yet present.</li>
  <li>Native deps mismatched.</li>
</ul>
<p>For these: <code>git bisect skip</code>. Bisect picks an adjacent commit instead. Skipping too many commits in a row degrades bisect to linear-ish; if your branch has many unbisectable commits, you have a process problem (see <a href="#" data-topic="git-rebase">Rebase</a> for clean-history practices).</p>

<h3>The "test from scratch" discipline</h3>
<p>Subtle gotcha: when you check out an old commit, <em>build artifacts and dep state may be wrong</em>. If you don't reset:</p>
<ul>
  <li>Old commit may "compile" because of cached artifacts that match newer code.</li>
  <li>Test may pass with newer dep versions still installed.</li>
  <li>Native modules may be at the wrong version.</li>
</ul>
<p>Mitigation:</p>
<ul>
  <li><code>git clean -fdx</code> between checkouts (DESTRUCTIVE; understand it).</li>
  <li>Reinstall deps (<code>yarn install</code>, <code>pod install</code>).</li>
  <li>Clear caches (<code>rm -rf node_modules .next dist build</code>).</li>
  <li>Build fresh.</li>
</ul>
<p>This makes each bisect step take longer but ensures correctness.</p>

<h3>The "first bad" vs. "first good" distinction</h3>
<p>Default bisect finds the <em>first bad</em> commit (the introducer). But sometimes you want the inverse: "find the first commit that <em>fixed</em> a bug." Use <code>git bisect</code> with reversed <code>good</code>/<code>bad</code> labels (or use <code>--term-old</code> / <code>--term-new</code> for clarity):</p>
<pre><code>git bisect start --term-old broken --term-new fixed
git bisect fixed   # current commit has the fix
git bisect broken  # known-broken commit
# Then bisect; mark each tested commit as 'fixed' or 'broken'</code></pre>

<h3>The "scope of bisect" model</h3>
<p>Bisect doesn't tell you <em>why</em> a commit broke things; it tells you <em>which</em> commit. After bisect:</p>
<ul>
  <li><code>git show &lt;sha&gt;</code> to see the change.</li>
  <li>Read it carefully — sometimes the bug is non-obvious in the diff.</li>
  <li>Often the cause is small (one-line change) and obvious in retrospect.</li>
  <li>Sometimes the cause requires further investigation (e.g., commit reformatted code; the "real" bug is a few lines deep).</li>
</ul>

<h3>The "bisect for performance" extension</h3>
<p>Bisect supports any test, including performance:</p>
<pre><code># Test: is build time &gt; 30 seconds?
# Wrap your build in a timing script:
#!/bin/bash
TIME=$(./build.sh 2&gt;&amp;1 | grep "Total time" | awk '{print $3}')
if [ "$TIME" -lt 30 ]; then
  exit 0  # good
else
  exit 1  # bad (slow)
fi

git bisect start
git bisect bad  # current
git bisect good v3.4
git bisect run ./check_build_time.sh</code></pre>

<h3>The "bisect across releases" pattern</h3>
<p>Common usage: "We released v3.5 last week. Customer reports bug. Was this in v3.4? Let's bisect."</p>
<pre><code>git bisect start
git bisect bad HEAD          # current dev (or v3.5 tag)
git bisect good v3.4         # v3.4 tag
# Bisect walks ~50-100 commits between v3.4 and v3.5
git bisect run ./test.sh

# Result: "abc1234 is the first bad commit"
# Now you know:
# - which commit
# - which PR introduced it
# - which engineer to ping for context</code></pre>

<h3>Avoiding the "false positive" trap</h3>
<p>If your test is too lenient, you mark a buggy commit as good. Bisect leads you astray.</p>
<ul>
  <li>Verify your test on the known-good and known-bad endpoints first.</li>
  <li>If test passes on known-bad, the test is wrong.</li>
  <li>If test fails on known-good, the test is wrong.</li>
  <li>Always validate the boundary before running bisect.</li>
</ul>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Manual bisect — the basic flow</h3>
<pre><code># Start bisect:
git bisect start

# Mark the current commit as bad (it has the bug):
git bisect bad

# Mark a known-good commit (e.g., last release tag):
git bisect good v3.4

# Git checks out a commit halfway between. Test it:
# ... build, run, observe ...

# If commit is good (bug not present):
git bisect good

# If commit is bad (bug present):
git bisect bad

# If commit is unbuildable / can't tell:
git bisect skip

# Repeat until git outputs:
# &lt;sha&gt; is the first bad commit
# commit ...

# When done, return to where you started:
git bisect reset</code></pre>

<h3>Automated bisect — the powerful flow</h3>
<pre><code># Write a test script that exits 0 (good) or 1 (bad) or 125 (skip):
# Example: ./test_for_bug.sh
#!/bin/bash
set -e

# Reinstall deps if needed:
yarn install --frozen-lockfile || exit 125
# (125 = skip; test can't run)

# Run the specific test that exposes the bug:
npm test -- --testNamePattern="my regression test"
# If test exits 0, the bug is NOT present (good)
# If test exits non-zero, the bug IS present (bad)

# Then drive bisect:
git bisect start
git bisect bad HEAD
git bisect good v3.4
git bisect run ./test_for_bug.sh

# Walk away. Come back to:
# &lt;sha&gt; is the first bad commit
# commit author / message / details

git bisect reset</code></pre>

<h3>Picking good and bad commits</h3>
<pre><code># Good = where bug is NOT present:
# - Last known-good release tag (v3.4)
# - A commit a teammate confirmed worked
# - HEAD~50 if bug appeared "recently"

# Bad = where bug IS present:
# - Current HEAD (most common)
# - A specific tag where bug was first observed
# - The commit that triggered an alert / report

# Tighter range = faster bisect:
# 100 commits = ~7 steps
# 1000 commits = ~10 steps
# 10000 commits = ~14 steps</code></pre>

<h3>Skip patterns</h3>
<pre><code># Skip a single commit:
git bisect skip

# Skip a range of commits (from a known-broken merge / WIP series):
git bisect skip A^..B

# Skip multiple specific commits:
git bisect skip &lt;sha1&gt; &lt;sha2&gt;

# After many skips, bisect may say:
# "There are only 'skipped' commits left to test."
# This means: skipped commits could contain the bug, but you can't test them.
# Investigate manually or fix the unbuildable state.</code></pre>

<h3>Bisect log and replay</h3>
<pre><code># See the bisect history:
git bisect log

# Output:
# git bisect start
# git bisect bad HEAD
# git bisect good v3.4
# git bisect good a1b2c3d  # tested manually, was good
# git bisect bad d4e5f6a   # tested manually, was bad
# ...

# Save log for later:
git bisect log &gt; my_bisect.log

# Replay it (e.g., on different machine or after fresh start):
git bisect replay my_bisect.log</code></pre>

<h3>Custom good/bad terms</h3>
<pre><code># Use clearer labels for confusing cases:
git bisect start --term-new=slow --term-old=fast

git bisect slow HEAD       # current is slow
git bisect fast v3.4       # v3.4 was fast

# At each step:
git bisect slow            # this commit is slow
git bisect fast            # this commit is fast
# Same as good/bad but more meaningful for performance bisects</code></pre>

<h3>Bisect with build / dep changes</h3>
<pre><code># Mobile / RN bisect with native deps:

# Test script that handles deps:
#!/bin/bash
set -e

# Always start fresh:
git clean -fdx
yarn install --frozen-lockfile || exit 125
cd ios && pod install || exit 125
cd ..

# Build (slow but necessary):
yarn ios:build || exit 125

# Run the bug-detection test:
yarn test:e2e -- --grep "my-bug-test" || exit 1

exit 0

# Now run:
git bisect start
git bisect bad HEAD
git bisect good v3.4
git bisect run ./bisect_mobile.sh

# Each step: ~3-5 min. 10 steps = ~50 min. Worth it for hard bugs.</code></pre>

<h3>Bisect with multiple "first bad" commits</h3>
<pre><code># If multiple commits introduced the bug independently:
git bisect visualize       # show remaining candidate commits

# After bisect finds one bad commit, the other may still exist.
# Re-run bisect from a different starting point to find the other.</code></pre>

<h3>Practical bisect script for tests</h3>
<pre><code>#!/bin/bash
# bisect_test.sh
# Usage: git bisect run ./bisect_test.sh

# Defensive: skip if the build itself can't run
yarn install --frozen-lockfile || exit 125
yarn build || exit 125

# Run targeted test (don't run full suite — too slow):
yarn jest path/to/specific/test.test.ts \\
  --testNamePattern="my regression test"

# jest exits 0 on pass, 1 on fail, &gt;1 on error
# We want: pass = good (exit 0), fail = bad (exit 1)
EXIT=$?
if [ $EXIT -eq 0 ]; then
  exit 0
elif [ $EXIT -eq 1 ]; then
  exit 1
else
  exit 125  # something else broke; skip
fi</code></pre>

<h3>Bisect for runtime performance</h3>
<pre><code>#!/bin/bash
# Test if cold start is &gt; 2s

# Run app, measure cold start
yarn build:release
START_TIME=$(yarn measure:cold-start | grep "ms" | awk '{print $2}')

if [ "$START_TIME" -lt 2000 ]; then
  exit 0  # good (fast)
else
  exit 1  # bad (slow)
fi</code></pre>

<h3>Aborting and restarting bisect</h3>
<pre><code># Bail out of current bisect (return to where you started):
git bisect reset

# Or reset to specific commit:
git bisect reset &lt;sha&gt;

# Aborting mid-bisect doesn't lose progress; you can replay from log:
git bisect log &gt; bisect.log
git bisect reset
# (later)
git bisect start
git bisect replay bisect.log</code></pre>

<h3>Bisect on a specific path</h3>
<pre><code># Limit bisect to commits affecting a path:
git bisect start -- src/components/Login.tsx
git bisect bad HEAD
git bisect good v3.4
# Bisect only walks commits that modified Login.tsx</code></pre>

<h3>Useful aliases</h3>
<pre><code># In ~/.gitconfig:
[alias]
  bs = bisect start
  bg = bisect good
  bb = bisect bad
  bk = bisect skip
  br = bisect run
  bt = bisect reset
  bv = bisect visualize</code></pre>
`
    },
    {
      id: 'examples',
      title: '🔍 Worked Examples',
      html: `
<h3>Example 1: Manual bisect for a UI regression</h3>
<p><strong>Setup:</strong> The login button used to be blue; now it's green. v3.4 had blue; v3.5 has green. Bisect to find the offending commit.</p>

<pre><code># Identify endpoints:
# Good: v3.4 (blue button)
# Bad: HEAD on main (green button)
# Range: ~80 commits between

git bisect start
git bisect bad HEAD
git bisect good v3.4

# Git: "Bisecting: 40 revisions left to test after this (roughly 5 steps)"
# Checks out commit at midpoint.

# Build and run app:
yarn ios

# Look at button. Green or blue?
# Green → bad
git bisect bad

# Git: "Bisecting: 20 revisions left to test"
# New commit checked out. Build and run:
yarn ios

# Blue → good
git bisect good

# Continue ~5 more steps...

# Eventually:
# "abc1234 is the first bad commit
# commit abc1234
# Author: [name]
# Date:   ...
#
#     Update theme tokens"

# Look at the change:
git show abc1234

# Diff shows:
# -primary: '#2196F3',  // blue
# +primary: '#4CAF50',  // green

# Found it! Theme update accidentally changed primary color.

# Reset:
git bisect reset</code></pre>

<h3>Example 2: Automated bisect for a unit test regression</h3>
<p><strong>Setup:</strong> A specific unit test (<code>auth.test.ts &gt; refresh token flow</code>) used to pass; now fails. Bisect.</p>

<pre><code># Write the bisect script:
cat &gt; bisect_auth.sh &lt;&lt; 'EOF'
#!/bin/bash
set -e
yarn install --frozen-lockfile &gt; /dev/null 2&gt;&amp;1 || exit 125
yarn jest auth.test.ts --testNamePattern="refresh token flow" --silent
EOF
chmod +x bisect_auth.sh

# Verify on endpoints:
git checkout v3.4
./bisect_auth.sh
echo $?  # should be 0 (good)

git checkout main
./bisect_auth.sh
echo $?  # should be 1 (bad)

# Run bisect:
git bisect start
git bisect bad main
git bisect good v3.4
git bisect run ./bisect_auth.sh

# Walk away. Come back to:
# "abc1234 is the first bad commit
# commit abc1234
# Author: [name]
#
#     Refactor auth client"

# Inspect:
git show abc1234 -- src/auth/

# Diff: removed the cookie-clear logic before token refresh.
# Now refresh sends old cookie; server rejects.

# Fix (separate work; bisect's job is done):
git bisect reset
# ... open PR with fix that restores cookie-clear ...</code></pre>

<h3>Example 3: Bisect across release branches</h3>
<p><strong>Setup:</strong> Customer reports a bug in v3.5. v3.4 didn't have it. Find the commit.</p>

<pre><code>git fetch --tags

git bisect start
git bisect bad v3.5.0
git bisect good v3.4.0

# Bisect ~40 commits between releases:
git bisect run ./test_for_bug.sh

# Result:
# "f1e2d3c is the first bad commit
# Author: [name]
# Date: 2 weeks ago
#
#     Update API client for new auth contract"

# Review the change:
git show f1e2d3c

# Confirms: API client change broke this specific user flow.
# Action: revert or hotfix.

git bisect reset

# Cherry-pick the fix to release/v3.5 (see git-cherry).</code></pre>

<h3>Example 4: Bisect with skipped commits</h3>
<p><strong>Setup:</strong> Bisect range includes a series of WIP commits that don't compile.</p>

<pre><code>git bisect start
git bisect bad HEAD
git bisect good v3.4

# Step 1: builds, test passes (good)
git bisect good

# Step 2: WIP commit, doesn't compile
yarn build
# Error: cannot find module 'NewLogger'
git bisect skip

# Step 3: another WIP, doesn't compile
git bisect skip

# Step 4: builds; test fails (bad)
git bisect bad

# Step 5: builds; test passes (good)
git bisect good

# Continue...

# Eventually:
# "Bisect found between &lt;goodSha&gt; and &lt;badSha&gt;:
#  &lt;skippedSha1&gt;
#  &lt;skippedSha2&gt;
#  &lt;testedSha&gt;
# Cannot conclude reliably; one of these may be first bad."

# Manual investigation:
# - Look at &lt;skippedSha1&gt;'s description; was it relevant?
# - If skipped commits are clearly unrelated (refactors of different module),
#   the answer is likely the &lt;testedSha&gt;.

git bisect reset</code></pre>

<p><strong>Lesson:</strong> WIP commits in shared history hurt bisect. Squash them before merge.</p>

<h3>Example 5: Bisect for performance regression</h3>
<p><strong>Setup:</strong> App cold start time was 1.2s in v3.4; is now 2.5s in v3.5.</p>

<pre><code># Write performance test script:
cat &gt; bisect_cold_start.sh &lt;&lt; 'EOF'
#!/bin/bash
set -e
yarn install --frozen-lockfile &gt; /dev/null 2&gt;&amp;1 || exit 125
yarn build:release || exit 125

# Measure cold start (run 3 times, take median):
TIMES=()
for i in 1 2 3; do
  T=$(yarn measure:cold-start 2&gt;&amp;1 | grep -oP "\\d+ms" | grep -oP "\\d+")
  TIMES+=($T)
done

# Median:
MEDIAN=$(echo "\${TIMES[@]}" | tr ' ' '\\n' | sort -n | sed -n '2p')

echo "Cold start: \${MEDIAN}ms"

# Threshold: 1700ms (between 1.2s good and 2.5s bad)
if [ \$MEDIAN -lt 1700 ]; then
  exit 0  # good
else
  exit 1  # bad
fi
EOF
chmod +x bisect_cold_start.sh

# Run bisect:
git bisect start --term-old=fast --term-new=slow
git bisect slow v3.5.0
git bisect fast v3.4.0
git bisect run ./bisect_cold_start.sh

# Result:
# "ghi9012 is the first slow commit
# Author: [name]
#
#     Add startup analytics
#
# Adds analytics SDK init synchronously in App.tsx"

# Inspect:
git show ghi9012
# Confirms: analytics SDK is loaded synchronously, blocking startup.

# Fix: defer analytics init to post-launch idle time.

git bisect reset</code></pre>

<h3>Example 6: Bisect that hits noisy / flaky tests</h3>
<p><strong>Setup:</strong> Bisect script runs an integration test that's flaky (~80% pass rate when working).</p>

<p><strong>Bad:</strong> just run once. Bisect picks wrong commits when test flakes.</p>

<p><strong>Good:</strong> retry the test multiple times to reduce flakiness:</p>
<pre><code>#!/bin/bash
# Retry-aware bisect script

yarn install --frozen-lockfile || exit 125
yarn build || exit 125

# Run test 5 times; require 4/5 passes to mark good
PASSES=0
for i in 1 2 3 4 5; do
  if yarn test:e2e --grep "my test"; then
    PASSES=$((PASSES + 1))
  fi
done

if [ $PASSES -ge 4 ]; then
  exit 0  # good
elif [ $PASSES -le 1 ]; then
  exit 1  # bad
else
  exit 125  # skip; ambiguous
fi</code></pre>

<p><strong>Better:</strong> fix the flaky test first. Bisecting on flake is unreliable.</p>

<h3>Example 7: Bisect on a long-running production bug</h3>
<p><strong>Setup:</strong> Production crash report shows a stack trace pointing to <code>Cache.invalidate()</code>. Last known-good build was 6 months ago. ~2000 commits since.</p>

<pre><code># Endpoints:
git bisect start
git bisect bad HEAD              # crash on current
git bisect good v3.0.0           # 6 months ago, no crash

# 2000 commits = log₂(2000) ≈ 11 steps
# Each step: ~5 min build = ~55 min total

git bisect run ./crash_repro.sh

# After 55 minutes:
# "abc1234 is the first bad commit
# Author: [name]
# Date: 4 months ago
#
#     Refactor cache invalidation to support TTL"

# Confirms hypothesis: this commit added bug 4 months ago.
# Customer impact: limited because crash only triggers on edge case.
# Fix: write the fix targeting v3.0+ commit chain.

git bisect reset</code></pre>

<h3>Example 8: Bisect that surfaces an unrelated issue</h3>
<p><strong>Setup:</strong> Bisecting for crash. Mid-bisect, encounter a commit that doesn't compile due to broken refactor (which was later fixed).</p>

<pre><code># Step 5 of bisect: commit doesn't compile
git bisect skip

# Step 6: builds; test passes
git bisect good

# Step 7: builds; test fails
git bisect bad

# ... continue ...

# Eventually find first bad commit AND notice that the
# unbuildable commits (you skipped) suggest a process issue:
# "We had broken commits in main for a few hours."

# Action items:
# 1. Fix the immediate bug.
# 2. Raise process issue: how did broken commits land in main?
#    (Missing CI? Force-pushed? Bypassed reviews?)
# 3. Add CI gate to prevent.</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>The "first bad" is a merge commit</h3>
<p>Bisect lands on a merge commit. The merge itself didn't introduce the bug; one of its parents' branches did.</p>
<pre><code>git show &lt;merge-sha&gt;
# Shows the merge resolution; may not show real bug

# Inspect parents:
git log --oneline &lt;merge-sha&gt;~1..&lt;merge-sha&gt;~2

# Or bisect within the merged-in branch:
git bisect start
git bisect bad &lt;merge-sha&gt;
git bisect good &lt;merge-sha&gt;~1   # the parent that was on main</code></pre>

<h3>Bisect across a rebase</h3>
<p>If history was rebased, commit SHAs you remember may be gone:</p>
<ul>
  <li>Old SHAs in your reflog locally; not on remote.</li>
  <li>Find equivalent commits by searching content / message.</li>
  <li>If working in a rebase-heavy team, bisect from named tags / branches, not specific SHAs.</li>
</ul>

<h3>Bisect on submodule changes</h3>
<p>Each commit may reference a different submodule SHA. Bisect's <code>git checkout</code> doesn't auto-update submodules:</p>
<pre><code># In your bisect script, sync submodules:
git submodule update --init --recursive

# Without this, you may be testing wrong submodule code.</code></pre>

<h3>Bisect when build artifacts cache</h3>
<p>If your test runner caches build artifacts, an old commit may "compile" using cached output from a newer commit. False results.</p>
<pre><code># Always clean before testing in bisect script:
git clean -fdx -e .env  # remove untracked files except .env

# Or:
rm -rf node_modules dist build .next
yarn install --frozen-lockfile

# Slow but correct.</code></pre>

<h3>Bisect with environment-dependent bugs</h3>
<p>Bug appears only with specific:</p>
<ul>
  <li>OS version (iOS 16, Android 13).</li>
  <li>Locale (de-DE).</li>
  <li>Server response (specific user account).</li>
  <li>Time zone.</li>
</ul>
<p>Bisect script must reproduce the environment:</p>
<pre><code>#!/bin/bash
# Force locale
export LC_ALL=de_DE.UTF-8

# Use specific iOS simulator
yarn ios -- --simulator="iPhone 14 (iOS 16.4)"

# Use specific test user / data
TEST_USER=12345 yarn test:e2e</code></pre>

<h3>Bisect across breaking dependency upgrades</h3>
<p>If commits include a major dep upgrade (React 17 → 18; Node 18 → 20):</p>
<ul>
  <li>Old commits before upgrade may not run with new Node.</li>
  <li>New commits after upgrade may not run with old Node.</li>
</ul>
<p>Strategies:</p>
<ul>
  <li>Use <code>nvm</code> / <code>fnm</code> to switch Node version per commit.</li>
  <li>Bisect script reads <code>.nvmrc</code> and switches Node.</li>
  <li>Or limit bisect range to commits within one Node version.</li>
</ul>

<h3>Bisect on too-large ranges</h3>
<p>10000+ commits between good and bad. Theoretically log₂(10000) ≈ 14 steps; practically:</p>
<ul>
  <li>Build infra may have changed; old commits may not build with current tools.</li>
  <li>Skipped commits accumulate.</li>
</ul>
<p>Strategy: narrow the range first by manual binary search at higher granularity (which week was good? which day?), then bisect within that range.</p>

<h3>Bisect when good and bad are reversed</h3>
<p>You marked things wrong; bisect is heading to the wrong area:</p>
<pre><code># Look at the log; identify the wrong mark:
git bisect log

# Reset and start over with corrected marks:
git bisect reset
git bisect start
# ... (re-do with correct labels)</code></pre>

<h3>Bisect on a non-linear history</h3>
<p>Heavy merge-commit history makes bisect awkward. Bisect picks midpoint commits; merge commits cause "this commit's diff" to be ambiguous.</p>
<ul>
  <li>Linear history: bisect is clean.</li>
  <li>Merge-heavy: bisect may land on merges; investigate parents.</li>
</ul>
<p>Argument for squash-merge / rebase-merge workflows: bisect-friendliness.</p>

<h3>Bisect during active development</h3>
<p>While bisecting, don't make new commits or run heavy operations. Bisect is a stateful operation in your repo:</p>
<ul>
  <li>HEAD is detached on each bisect step.</li>
  <li>New commits during bisect become orphans.</li>
  <li>Use a separate worktree (see <a href="#" data-topic="git-worktrees">Worktrees</a>) for active dev.</li>
</ul>

<h3>Bisect on a force-pushed branch</h3>
<p>If a branch was force-pushed, old SHAs may not exist on remote. Bisect locally if you have the reflog; otherwise impossible.</p>

<h3>Bisect when you accidentally mark the wrong commit</h3>
<p>You called <code>git bisect good</code> but the commit was actually bad. Bisect now searches the wrong half.</p>
<pre><code># Check the log:
git bisect log

# Reset and replay with corrections:
git bisect log &gt; bisect.log
# Edit bisect.log to fix the wrong line
git bisect reset
git bisect replay bisect.log</code></pre>

<h3>Mobile-specific: bisect with device-only bugs</h3>
<p>Some bugs only manifest on real devices (sensor data, push notifications, biometrics). Simulator bisect won't reproduce.</p>
<ul>
  <li>Connect device, build to device at each bisect step.</li>
  <li>Slow but necessary for device-specific bugs.</li>
  <li>Sometimes: bisect on simulator first to narrow range; verify final result on device.</li>
</ul>

<h3>Bisect for crashes that need full app session</h3>
<p>Some crashes only happen after extended app use. Bisect script must simulate / reproduce:</p>
<pre><code># Long-running test:
#!/bin/bash
yarn build
# Run app for 5 minutes simulating user actions
yarn e2e:simulation --duration=300 --check-crash

# Each bisect step: 5+ minutes. Total 10 steps = 50+ min.
# Worth it for hard-to-reproduce production crashes.</code></pre>
`
    },
    {
      id: 'bugs',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Anti-pattern: bisecting without verifying endpoints</h3>
<p><strong>Looks like:</strong> Mark good and bad without confirming bug actually appears at bad and disappears at good.</p>
<p><strong>Why bad:</strong> If your assumptions are wrong, bisect leads to wrong commit. Hours wasted.</p>
<p><strong>Fix:</strong> Test on both endpoints first. Run your bisect script against good (should exit 0) and bad (should exit 1). Confirm before starting.</p>

<h3>Anti-pattern: flaky tests in bisect</h3>
<p><strong>Looks like:</strong> Bisect script uses a 70%-pass-rate test.</p>
<p><strong>Why bad:</strong> Each step has 30% chance of misclassifying; bisect compounds errors. Final result may be wrong.</p>
<p><strong>Fix:</strong> Stabilize the test before bisecting. Or run multiple times per step + require majority.</p>

<h3>Anti-pattern: not cleaning between commits</h3>
<p><strong>Looks like:</strong> Skip <code>git clean -fdx</code> + dep reinstall; rely on whatever's in node_modules.</p>
<p><strong>Why bad:</strong> Build artifacts and dep state from previous step contaminate current step. False results.</p>
<p><strong>Fix:</strong> Always clean + reinstall. Slow but correct.</p>

<h3>Anti-pattern: bisecting without writing the test first</h3>
<p><strong>Looks like:</strong> "I'll know the bug when I see it" — manual bisect with no precise test.</p>
<p><strong>Why bad:</strong> Halfway through, you realize the test was inconsistent. Reset, restart.</p>
<p><strong>Fix:</strong> Write the test (manual checklist or automated script) before starting bisect.</p>

<h3>Anti-pattern: not skipping unbuildable commits</h3>
<p><strong>Looks like:</strong> Commit doesn't compile; engineer marks it as bad to "move on."</p>
<p><strong>Why bad:</strong> Misleads bisect; final result may be wrong.</p>
<p><strong>Fix:</strong> Use <code>git bisect skip</code>. If many skips, address root cause (broken commits in history).</p>

<h3>Anti-pattern: forgetting <code>git bisect reset</code></h3>
<p><strong>Looks like:</strong> Bisect ends; engineer continues working from detached HEAD; gets confused.</p>
<p><strong>Why bad:</strong> Commits made in detached state are easily lost.</p>
<p><strong>Fix:</strong> Always <code>git bisect reset</code> when done. Returns to original branch.</p>

<h3>Anti-pattern: bisecting massive ranges blindly</h3>
<p><strong>Looks like:</strong> Run bisect from year-old tag with no narrowing.</p>
<p><strong>Why bad:</strong> Many steps; old commits may not build with current infra; high frustration.</p>
<p><strong>Fix:</strong> Narrow first via manual checkpoints (works in v3.4? v3.4.5? v3.4.5+15 commits?). Bisect within smaller range.</p>

<h3>Anti-pattern: relying on bisect to find non-determinism</h3>
<p><strong>Looks like:</strong> Use bisect to find which commit "made the test flaky."</p>
<p><strong>Why bad:</strong> Test is non-deterministic; bisect's premise of "is this commit good or bad" doesn't hold.</p>
<p><strong>Fix:</strong> Stabilize test; investigate root cause separately. Bisect for deterministic regressions only.</p>

<h3>Anti-pattern: skipping CI / verification on bisect-found fix</h3>
<p><strong>Looks like:</strong> Bisect found commit; engineer reverts it without further investigation.</p>
<p><strong>Why bad:</strong> Reverting may break something else. Or the commit's intent is correct but its implementation has a bug — fix the implementation, not revert.</p>
<p><strong>Fix:</strong> Bisect identifies; you investigate. Read the diff, understand intent, fix correctly.</p>

<h3>Anti-pattern: using bisect for code archaeology</h3>
<p><strong>Looks like:</strong> Use bisect to find "when was this function added?"</p>
<p><strong>Why bad:</strong> Bisect is overkill; <code>git log -p &lt;file&gt;</code> or <code>git log -S &lt;function-name&gt;</code> is simpler.</p>
<p><strong>Fix:</strong> Right tool for the job. Bisect is for "when did behavior X change?" not "when did line Y appear?"</p>

<h3>Anti-pattern: not parallelizing</h3>
<p><strong>Looks like:</strong> Bisect runs sequentially on one machine; takes hours.</p>
<p><strong>Why bad:</strong> Wasted time; bisect is inherently sequential, but parallel investigation could test multiple commits manually.</p>
<p><strong>Fix:</strong> For very expensive tests, sometimes pre-test multiple commits manually in separate worktrees. Worktrees + remote build cluster = fast bisect.</p>

<h3>Anti-pattern: bisect on a branch you don't own</h3>
<p><strong>Looks like:</strong> Bisect on shared release branch; checkout creates detached HEAD on remote-tracked branch.</p>
<p><strong>Why bad:</strong> If you accidentally push or commit, mess up shared branch.</p>
<p><strong>Fix:</strong> Bisect locally on a temporary branch, or in a separate worktree.</p>

<h3>Anti-pattern: ignoring the commit after found</h3>
<p><strong>Looks like:</strong> Bisect found commit; engineer fixes the symptom without reading the original commit.</p>
<p><strong>Why bad:</strong> Original commit's intent / context is valuable; the bug may not be where you think.</p>
<p><strong>Fix:</strong> <code>git show &lt;sha&gt;</code> + read commit message + look at PR description / linked issues. Understand intent before fixing.</p>

<h3>Anti-pattern: not documenting the bisect</h3>
<p><strong>Looks like:</strong> Bisect found culprit; fix shipped; no record of the investigation.</p>
<p><strong>Why bad:</strong> Future engineers asking "why does this code look this way" have no context.</p>
<p><strong>Fix:</strong> Reference the bisect-found commit in the fix's commit message / PR description. "Bisected to abc1234, which introduced X behavior. This change reverts that." Future archaeology helped.</p>

<h3>Anti-pattern: bisect as the first response</h3>
<p><strong>Looks like:</strong> Bug reported; immediately bisect.</p>
<p><strong>Why bad:</strong> Sometimes a quick read of recent commits / hypothesis-testing finds it faster.</p>
<p><strong>Fix:</strong> Try low-cost investigation first. Bisect is the heavy hammer for when investigation runs out of leads.</p>
`
    },
    {
      id: 'interview',
      title: '🎤 Interview Patterns',
      html: `
<h3>"Have you used <code>git bisect</code>?"</h3>
<p>Common at senior+ interviews. Tests practical Git skill + debugging methodology.</p>

<pre><code>"Yes, regularly. It's binary search over commit history — given a
known-good and known-bad commit, it walks the range in O(log N) to
find the first commit that introduced a regression.

The key disciplines:
1. Define the test precisely. 'Is this commit good or bad?' must
   have an unambiguous answer.
2. Verify endpoints first — confirm bug doesn't exist at good and
   does at bad.
3. Skip unbuildable commits (don't mark them).
4. Automate via 'git bisect run &lt;script&gt;' when test is scriptable.

I used it last month to find a perf regression. Cold start was
1.2s in v3.4 and 2.5s in v3.5. Wrote a script that measured median
cold start across 3 runs; bisected over ~80 commits. Found a
commit that synchronously initialized analytics. ~50 minutes
including the build time per step."</code></pre>

<h3>"Walk me through using bisect"</h3>
<pre><code>"Step by step:

1. Identify the bug. Have a precise repro.

2. Identify a known-good commit (last release tag, or a teammate's
   confirmed-working commit).

3. Identify a known-bad commit (current HEAD, or where bug was
   first observed).

4. Verify endpoints: test at good (should pass), test at bad
   (should fail). If wrong, my mental model is off; reset.

5. Run:
   git bisect start
   git bisect bad &lt;bad-sha&gt;
   git bisect good &lt;good-sha&gt;

6. Git checks out a midpoint. I test, mark good or bad.

7. Repeat. Each step halves the range.

8. After log₂(N) steps, Git outputs 'X is the first bad commit.'

9. git show X to see the change. Investigate.

10. git bisect reset to return to where I started.

For automation: write a script that exits 0 (good), 1 (bad), or
125 (skip). Use 'git bisect run script.sh'. Walk away while it
runs."</code></pre>

<h3>"What's a non-trivial bisect you've done?"</h3>
<p>Senior+ behavioral. Wants concrete + thoughtful.</p>

<pre><code>"Production crash report came in last quarter — only on iOS 16,
only when users had biometrics enabled, only after a session
timeout. Stack trace pointed to authentication code but didn't
identify the actual cause.

Endpoints: v3.5 (no crash) to v3.6 (crash). ~120 commits.

The challenge: reproducing required iOS 16 + biometric simulator
+ session-timeout flow. Manual reproduction took 2-3 minutes per
attempt; automation needed.

What I did:
1. Wrote an XCTest that simulated the conditions: enabled
   biometrics in simulator config, expired session token,
   triggered the auth flow.
2. Wrapped it in a bisect script that built + ran the test +
   exited 0/1.
3. Ran 'git bisect run' — about 7 steps × 4 min = 30 min.
4. Found commit: 'Refactor session refresh to use Keychain.'
5. Read the commit. The refactor moved Keychain access to a
   dispatch_async without ensuring the queue had main-thread-
   accessible Keychain context.
6. Fix was a one-line change.

Lessons: writing the bisect script took longer than the bisect
itself, but it was repeatable for verification + would have been
useful for similar bugs. Built it into our test suite afterwards
as a regression test."</code></pre>

<h3>"What happens if bisect lands on a commit that doesn't compile?"</h3>
<pre><code>"git bisect skip. Bisect picks an adjacent commit. If many in a
row need skipping, bisect's efficiency degrades.

If skipped commits cluster in a known-broken series (someone
landed WIP commits to main), the answer is process: shouldn't
have unbuildable commits in the searchable history. We'd address
that separately by enforcing CI gates or pre-commit hooks.

In a pinch, sometimes I'll fix the unbuildable state in a
detached HEAD and continue, but that's hacky."</code></pre>

<h3>"How do you bisect a flaky test?"</h3>
<pre><code>"You don't, really. Bisect requires deterministic test outcomes.
Flake at 30% means 30% of bisect steps misclassify; the result is
unreliable.

If the test is the bug being investigated:
1. Stabilize the test first. Find the source of flakiness.
2. Then bisect: 'when did the flakiness become acceptable rate?'

If the test is incidentally flaky but the bug isn't:
1. Run test multiple times per bisect step (e.g., 5 runs;
   majority decides).
2. Or use a different test that doesn't flake.

Bisecting with retries works but is slow. Stabilizing the test
is the better investment."</code></pre>

<h3>"What's the difference between bisect and just looking at the diff?"</h3>
<pre><code>"Bisect is a search tool over many commits; diff is one-commit
inspection.

If I changed something locally and broke a test, I'd just look at
my own diff. Fast.

If a bug exists across 100+ commits I didn't write, looking at
each diff is slow. Bisect narrows to the specific commit; then I
look at that one diff.

The two complement each other. Bisect identifies; diff explains."</code></pre>

<h3>"How does bisect interact with merge commits?"</h3>
<pre><code>"Bisect walks the commit graph, including merges. A merge commit
combines two branches; if the bug enters via the merged-in branch,
bisect may identify the merge commit as 'first bad.'

The merge itself usually didn't cause the bug — one of the
incoming commits did. So I'd bisect within the merged-in branch
to find the actual cause.

This is one reason teams favor squash-merge or rebase-merge:
linear history makes bisect's 'first bad' answer immediately
actionable. Branchy history requires more investigation."</code></pre>

<h3>"How do you decide whether to use bisect?"</h3>
<pre><code>"Three questions:

1. Is the bug a regression? Did it work before, break later? If
   yes, bisect is great.

2. Can I write a deterministic test? If yes, bisect is great. If
   the bug is non-deterministic or environment-dependent, harder.

3. How big is the search space? &lt;10 commits, just look at each.
   100+, bisect saves time. 1000+, definitely bisect.

If those three line up, I bisect. Otherwise, hypothesis-driven
debugging — read recent commits, form theories, test theories."</code></pre>

<h3>Common follow-ups</h3>
<table>
  <thead><tr><th>Question</th><th>What they're checking</th></tr></thead>
  <tbody>
    <tr><td>"What's <code>git bisect run</code>?"</td><td>Knowing the automation form</td></tr>
    <tr><td>"What does exit code 125 mean?"</td><td>Skip; commit is unbuildable</td></tr>
    <tr><td>"What's <code>git bisect log</code>?"</td><td>Save / replay state</td></tr>
    <tr><td>"How do you handle bisect on submodules?"</td><td><code>git submodule update --recursive</code> in the script</td></tr>
    <tr><td>"What about bisect across a Node version change?"</td><td>nvm/fnm in script; or limit range</td></tr>
    <tr><td>"How do you write a bisect-able test?"</td><td>Deterministic; fast; targeted</td></tr>
  </tbody>
</table>

<h3>The 30-second mantra</h3>
<p><em>"Bisect is binary search over history. Verify endpoints first. Skip unbuildable commits. Automate when test is scriptable. Reset when done. Bisect identifies; you investigate. Squash-merge for bisect-friendly history."</em></p>
<p>Bisect is the difference between "I'll spend a day investigating this" and "I'll find this by lunch." It's the most senior-engineer-flavored Git skill — used rarely but with huge leverage.</p>
`
    }
  ]
});
