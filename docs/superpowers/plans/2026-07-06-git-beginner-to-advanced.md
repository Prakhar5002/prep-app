# Git Track (Beginner → Advanced) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing advanced-only `git` module into a full beginner→advanced course by prepending 4 foundational topics (Fundamentals → Branching → Remotes → Undoing) ahead of the 5 existing advanced topics.

**Architecture:** Four new vanilla-JS IIFE topic files register via `window.PREP_SITE.registerTopic`; the `git` module's `topics` array in `_index.js` is reordered so the new topics precede the existing five. The existing `tools/verify-topics.mjs` structural checker is generalized to validate the new git topics (registration + required sections) alongside the redux ones. Accuracy is gated by expert review (git commands, no execution).

**Tech Stack:** Vanilla ES5/ES6 browser JS in IIFEs on `window.PREP_SITE`; existing Prism + theme; Node (ESM, `node:vm`) for the structural checker. No bundler/framework/test runner.

## Global Constraints

From the spec (`docs/superpowers/specs/2026-07-06-git-beginner-to-advanced-design.md`). Every task implicitly includes these:

- **No build step.** Topic files load via `<script>` tags in `index.html`.
- **Registration pattern.** Each new topic is an IIFE calling `window.PREP_SITE.registerTopic({ id, module, title, estimatedReadTime, tags, sections })`. `module: 'git'` (matches the existing git topics).
- **New topic ids (exact) + files:** `git-fundamentals` (`scripts/content/git-fundamentals.js`), `git-branching`, `git-remotes`, `git-undoing`.
- **Registry order:** the `git` module's `topics` array becomes: git-fundamentals, git-branching, git-remotes, git-undoing, git-rebase, git-cherry, git-bisect, git-worktrees, git-recovery. Keep the existing 5 entries' exact titles; only prepend the 4 new ones. Do NOT reorder/alter any other module.
- **Sections:** `{ id, title, html }` (+ `collapsible: false` on the first, `tldr`). `html` is raw trusted HTML. Command/shell snippets use `<pre><code class="language-bash">…</code></pre>`; inline `<code>`. Each NEW topic includes at least: `tldr`, `what-why`, `mental-model`, `mechanics`, `examples`, `interview-patterns` (`edge-cases`/`bugs-anti-patterns` optional).
- **Existing 5 git topics are NOT modified** (content untouched; only the registry order changes). NOTE: the existing git topics do NOT have an `interview-patterns` section — the checker must therefore only enforce required-sections on the NEW topics, not the whole module.
- **HTML-safety:** any literal `<...>` that isn't an intended HTML formatting tag must be escaped `&lt;`/`&gt;` (rare in git content, but e.g. `<branch>`, `<remote>` placeholders in command syntax must be `&lt;branch&gt;`).
- **Git accuracy facts (2026; every topic must respect; verify commands):** prefer modern verbs `git switch` / `git restore` (Git 2.23+) while also teaching the `git checkout` equivalents learners encounter; default branch is **`main`** (note `master` is legacy); `git reset --soft|--mixed|--hard` semantics = moves HEAD only / HEAD+index / HEAD+index+working-tree (this table must be exactly right); `git fetch` = download only, `git pull` = fetch + integrate (merge or rebase); fast-forward vs 3-way merge; `git revert` = new inverse commit (safe on shared history) vs `git reset` = moves branch pointer (rewrites local history); every shown command is a real, correct invocation.
- **Cross-link:** `git-undoing` links to the existing `git-recovery` (reflog) topic as the deep-recovery layer; `git-remotes` may reference the advanced Rebase topic. No content overlap with the existing advanced topics.
- **No auto-commit / no auto-build.** Never run `git commit`/`git push`/build. End each task at verification; user commits manually on request.

---

## File Structure

**Modify:**
- `scripts/content/_index.js` — reorder the `git` module's `topics` array (prepend 4 new).
- `index.html` — add 4 `git-*.js` `<script>` tags among the content scripts (before `scripts/app.js`).
- `tools/verify-topics.mjs` — generalize to validate the `redux` AND `git` modules; fully section-check only the explicit NEW topic ids.

**Create:**
- `scripts/content/git-fundamentals.js`, `git-branching.js`, `git-remotes.js`, `git-undoing.js`.

---

### Task 1: Generalize the checker + reorder the git module

**Files:**
- Modify: `tools/verify-topics.mjs`, `scripts/content/_index.js`

**Interfaces:**
- Produces: reordered `git` module (4 new ids first); `node tools/verify-topics.mjs` validates redux + git modules — new git topics show "pending" until authored, existing git topics show as registered (no section enforcement), redux topics unchanged.

- [ ] **Step 1: Reorder the `git` module in `_index.js`**

In `scripts/content/_index.js`, replace the existing `git` module's `topics` array so the 4 new topics come first (keep the 5 existing entries with their exact current titles):

```js
      topics: [
        { id: "git-fundamentals", title: "Git Fundamentals" },
        { id: "git-branching",    title: "Branching & Merging" },
        { id: "git-remotes",      title: "Remotes & Collaboration" },
        { id: "git-undoing",      title: "Undoing & Everyday Fixes" },
        { id: "git-rebase", title: "Rebase vs Merge" },
        { id: "git-cherry", title: "Cherry-Pick" },
        { id: "git-bisect", title: "Bisect for Bug Hunting" },
        { id: "git-worktrees", title: "Worktrees" },
        { id: "git-recovery", title: "Recovery (reflog etc.)" },
      ],
```
(Match the existing entries' titles exactly to how they currently appear; only add the 4 new lines at the top.)

- [ ] **Step 2: Rewrite `tools/verify-topics.mjs` to be multi-module + new-topic-scoped**

Replace the whole file with this (generalizes the redux-only checker; fully section-checks only the explicit NEW topic ids, so the section-less existing git topics don't false-fail):

```js
// DEV ONLY — not referenced by index.html. Run: node tools/verify-topics.mjs
// Structural check for the progressive notes modules (redux, git):
//  - every registry topic in a target module resolves to a registered topic with the right module
//  - the NEW topics additionally must have the required sections (first = tldr, collapsible:false)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'scripts', 'content');

const TARGET_MODULES = ['redux', 'git'];
const NEW_TOPICS = new Set([
  'redux-core', 'redux-toolkit', 'redux-rtk-query', 'redux-middleware-async', 'redux-advanced-testing',
  'git-fundamentals', 'git-branching', 'git-remotes', 'git-undoing',
]);
const REQUIRED = ['tldr', 'what-why', 'mental-model', 'mechanics', 'examples', 'interview-patterns'];
const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;

const sandbox = { window: {}, document: {}, console };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
const load = (f) => vm.runInContext(fs.readFileSync(f, 'utf8'), sandbox, { filename: f });

let failures = 0;
load(path.join(contentDir, '_index.js')); // defines registry + registerTopic
// Load content files for the target modules (redux-*.js, git-*.js).
const prefixes = TARGET_MODULES.map(m => m + '-');
for (const f of fs.readdirSync(contentDir).filter(f => f.endsWith('.js') && prefixes.some(p => f.startsWith(p))).sort()) {
  try { load(path.join(contentDir, f)); }
  catch (err) { console.log(`✗ ${f}: ${err.message}`); failures++; }
}

const P = sandbox.window.PREP_SITE;
const byId = P.topicsById || {};

for (const modId of TARGET_MODULES) {
  const mod = (P.registry.modules || []).find(m => m.id === modId);
  if (!mod) { console.log(`✗ no "${modId}" module in registry`); failures++; continue; }
  console.log(`\n[${modId}]`);
  for (const entry of mod.topics) {
    const t = byId[entry.id];
    if (!t) { console.log(`  … ${entry.id}: not registered yet (pending)`); continue; }
    const before = failures;
    if (t.module !== modId) { console.log(`  ✗ ${entry.id}: module "${t.module}", expected "${modId}"`); failures++; }
    if (!nonEmpty(t.title)) { console.log(`  ✗ ${entry.id}: empty title`); failures++; }
    if (!Array.isArray(t.sections) || !t.sections.length) { console.log(`  ✗ ${entry.id}: no sections`); failures++; continue; }
    if (NEW_TOPICS.has(entry.id)) {
      const ids = t.sections.map(s => s.id);
      for (const req of REQUIRED) if (!ids.includes(req)) { console.log(`  ✗ ${entry.id}: missing section "${req}"`); failures++; }
      if (t.sections[0].id !== 'tldr' || t.sections[0].collapsible !== false) { console.log(`  ✗ ${entry.id}: first section must be tldr with collapsible:false`); failures++; }
      t.sections.forEach(s => { if (!nonEmpty(s.id) || !nonEmpty(s.title) || !nonEmpty(s.html)) { console.log(`  ✗ ${entry.id}: section "${s.id||'?'}" missing id/title/html`); failures++; } });
    }
    if (failures === before) console.log(`  ✓ ${entry.id}: ${t.sections.length} sections${NEW_TOPICS.has(entry.id) ? '' : ' (existing, registration only)'}`);
  }
}
console.log(failures === 0 ? '\n✅ PASS' : `\n❌ FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
```

- [ ] **Step 3: Run the checker**

Run: `node tools/verify-topics.mjs`
Expected: a `[redux]` block with all 5 redux topics `✓` (they're already authored), a `[git]` block where the 4 new topics show `… pending` and the 5 existing topics show `✓ … (existing, registration only)`, and overall `✅ PASS`.

- [ ] **Step 4: Syntax-check**

Run: `node --check scripts/content/_index.js && node --check tools/verify-topics.mjs`
Expected: exit 0, no output.

**Deliverable:** git module reordered (4 new "coming soon" topics at the top) + a checker that validates both modules. No commit.

---

### Task 2: `git-fundamentals` topic + wiring (the slice)

**Files:**
- Create: `scripts/content/git-fundamentals.js`
- Modify: `index.html`

- [ ] **Step 1: Author `git-fundamentals.js`**

Create `scripts/content/git-fundamentals.js` as an IIFE. Look at an existing topic (e.g. `scripts/content/git-rebase.js`) for the house style/tone. Skeleton:

```js
window.PREP_SITE.registerTopic({
  id: 'git-fundamentals',
  module: 'git',
  title: 'Git Fundamentals',
  estimatedReadTime: '22 min',
  tags: ['git', 'fundamentals', 'commits', 'staging', 'basics'],
  sections: [
    { id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `…` },
    { id: 'what-why', title: '🧠 What & Why', html: `…` },
    { id: 'mental-model', title: '🗺️ Mental Model', html: `…` },
    { id: 'mechanics', title: '⚙️ Mechanics', html: `…` },
    { id: 'examples', title: '🧪 Worked Examples', html: `…` },
    { id: 'edge-cases', title: '⚠️ Edge Cases', html: `…` },
    { id: 'interview-patterns', title: '🎤 Interview Patterns', html: `…` },
  ],
});
```

Content outline (beginner — assume zero Git knowledge):
- **TL;DR:** what Git is (distributed VCS — every clone is a full repo + history); the core loop edit → `add` → `commit`; the three areas (working tree / staging / repo); that this module goes from here to advanced (rebase/bisect/…).
- **What & Why:** version control's purpose (history, collaboration, undo/branching); distributed vs centralized (why every clone has full history); why staging exists (curate what goes into a commit).
- **Mental Model:** the three areas as a pipeline — **working tree → staging area (index) → repository** — with a small ASCII diagram; a commit = immutable snapshot + parent(s) + author/message, addressed by a SHA; `HEAD` = "where you are" (usually the tip of the current branch).
- **Mechanics:** a from-nothing flow in `<pre><code class="language-bash">`: `git init`; `git status`; `git add <file>` (use `&lt;file&gt;`); `git commit -m "msg"`; `git log --oneline --graph`; `git diff` (unstaged) vs `git diff --staged`; `git clone <url>`; `.gitignore` (what it does + a small example). Note `git add -p` for partial staging.
- **Worked Examples:** (1) initialize a repo and make the first two commits; (2) inspect what changed (`status`/`diff`/`log`); (3) ignore a build dir via `.gitignore`.
- **Edge Cases:** committed a file that should be ignored (already-tracked files aren't ignored — `git rm --cached`); empty commit; author identity not set (`git config user.name/email`); line-ending/`core.autocrlf` gotcha (brief).
- **Interview Patterns:** 4–6 Q&A — "what are the three areas?", "what's the difference between working tree, staging, and repo?", "what is a commit / what's in it?", "what does `git add` actually do?", "distributed vs centralized VCS?", "what is HEAD?".

Respect the Global Constraints git-accuracy facts. Escape command placeholders like `&lt;file&gt;`/`&lt;url&gt;`.

- [ ] **Step 2: Wire the script tag**

In `index.html`, add among the content `<script>` tags (before `scripts/app.js`):
```html
<script src="scripts/content/git-fundamentals.js"></script>
```

- [ ] **Step 3: Structural check**

Run: `node tools/verify-topics.mjs`
Expected: in the `[git]` block, `✓ git-fundamentals: N sections`, the other 3 new topics still `… pending`, existing 5 still `✓ (existing…)`, overall `✅ PASS`. Fix any `✗`. Then `node --check scripts/content/git-fundamentals.js` and `grep -c 'git-fundamentals.js' index.html` → 1.

- [ ] **Step 4: Manual browser verification**

Open `index.html`. Verify: the **Git** module now lists **Git Fundamentals** first (then the other new "coming soon" ones, then the existing advanced topics); the topic renders all sections; command blocks are highlighted with a Copy button; command placeholders like `<file>` display literally (not swallowed); Prev/Next present; both themes fine. Confirm the existing advanced git topics still open normally.

**Deliverable:** git module reordered + Fundamentals live end-to-end. **STOP for user review of ordering + topic-1 depth before authoring the other 3.** No commit.

---

### Tasks 3–5: Remaining foundational topics

Each task creates one `scripts/content/git-<suffix>.js` using the same skeleton as Task 2 (its own id/title/tags), authoring each section per the outline below, then adds its `<script>` tag to `index.html`, runs `node tools/verify-topics.mjs` (its topic shows `✓` with required sections; overall `✅ PASS`), and `node --check`s the file. No commit. Respect the Global Constraints git-accuracy facts; commands in `<pre><code class="language-bash">`; escape `&lt;placeholder&gt;`s.

### Task 3: `git-branching.js` — id `git-branching`, title "Branching & Merging"
- **TL;DR:** branches are cheap movable pointers to commits; create/switch; merge brings work together; conflicts are normal and resolvable.
- **What & Why:** why branch (isolate work, parallel features); why merging (integrate).
- **Mental Model:** a branch = a named pointer to a commit; `HEAD` follows the current branch; merging finds a common ancestor. ASCII before/after diagrams for fast-forward vs 3-way.
- **Mechanics:** `git branch`, `git switch <name>` / `git switch -c <name>` (modern) with the `git checkout -b` equivalent noted; `git branch -d`/`-D`, rename `git branch -m`; `git merge <branch>`; **fast-forward vs 3-way merge** explained; a merge conflict walkthrough (conflict markers `<<<<<<< ======= >>>>>>>` shown as escaped text, edit, `git add`, `git commit`); `git merge --abort`.
- **Worked Examples:** feature-branch flow (branch → commit → switch back → merge, fast-forward); a divergent 3-way merge; resolving a conflict end to end.
- **Edge Cases:** switching with uncommitted changes; deleting an unmerged branch (`-D`); "detached HEAD" (brief, points to worktrees/recovery); fast-forward vs `--no-ff`.
- **Interview Patterns:** "what is a branch really?", "fast-forward vs 3-way merge?", "how do you resolve a conflict?", "what is a merge commit?", "`switch` vs `checkout`?".

### Task 4: `git-remotes.js` — id `git-remotes`, title "Remotes & Collaboration"
- **TL;DR:** remotes are other copies of the repo (`origin`); `fetch`/`pull`/`push` sync; the PR flow is how teams collaborate.
- **What & Why:** collaboration model; why `fetch` is safe and `pull` mutates.
- **Mental Model:** local branch vs remote-tracking branch (`origin/main`) vs the remote's branch; upstream/tracking relationship.
- **Mechanics:** `git clone <url>`; `git remote -v` / `git remote add origin <url>`; `git fetch` (download only, updates `origin/*`) vs `git pull` (fetch + merge, or `--rebase`); `git push` / `git push -u origin <branch>`; `git branch -vv` (see tracking); `pull.rebase` config; the PR/MR workflow (branch → push → open PR → review → merge). Reference the advanced **Rebase vs Merge** topic for the integration strategy detail.
- **Worked Examples:** clone → branch → push → open PR; keep a branch up to date (`fetch` + merge/rebase); set upstream.
- **Edge Cases:** rejected push (remote ahead — fetch/integrate first, never blind `--force`; mention `--force-with-lease` and point to advanced topics); detached `origin/HEAD`; accidentally committing to `main` locally.
- **Interview Patterns:** "`fetch` vs `pull`?", "what is `origin`?", "what's a remote-tracking branch?", "how does a PR workflow work?", "how do you safely update a shared branch?".

### Task 5: `git-undoing.js` — id `git-undoing`, title "Undoing & Everyday Fixes"
- **TL;DR:** the everyday undo toolbox — `restore`, `reset`, `revert`, `amend`, `stash` — and which to reach for. (Deep recovery of "lost" commits lives in the **Recovery (reflog)** topic — link it.)
- **What & Why:** undo safely; the key split — rewriting local history (reset/amend) vs safe shared-history undo (revert).
- **Mental Model:** map each tool to the three areas it touches. A precise **`reset` table**: `--soft` = move HEAD only (changes stay staged); `--mixed` (default) = move HEAD + reset index (changes stay in working tree, unstaged); `--hard` = move HEAD + index + working tree (discards changes — dangerous).
- **Mechanics:** `git restore <file>` (discard working-tree changes) and `git restore --staged <file>` (unstage), with the older `git checkout -- <file>` / `git reset HEAD <file>` equivalents noted; `git reset --soft|--mixed|--hard [<commit>]`; `git revert <commit>` (creates an inverse commit — safe on pushed history); `git commit --amend` (fix the last commit — rewrites it, so not after pushing); `git stash` / `stash pop` / `stash list` / `stash apply`.
- **Worked Examples:** unstage a file; discard a bad edit; undo the last commit but keep changes (`reset --soft HEAD~1`); safely undo a pushed commit (`revert`); amend a commit message; stash to switch tasks.
- **Edge Cases:** `reset --hard` data loss (and that reflog can sometimes save you → link `git-recovery`); amend/reset after pushing (rewrites shared history — don't); stash conflicts on pop.
- **Interview Patterns:** "`reset` soft vs mixed vs hard?", "`reset` vs `revert` — when to use which?", "how do you undo a pushed commit?", "how do you fix the last commit?", "what does `restore` do?". **Add the cross-link** to `git-recovery` in TL;DR or Mechanics: `<a href="#/topic/git-recovery">Recovery (reflog)</a>`.

---

### Task 6: Final structural check + review pass

**Files:** none (verification only).

- [ ] **Step 1: Full structural check**

Run: `node tools/verify-topics.mjs`
Expected: `[git]` block shows the 4 new topics `✓ … N sections` and the 5 existing `✓ … (existing…)`, in the new order; `[redux]` still all `✓`; overall `✅ PASS`.

- [ ] **Step 2: Confirm files parse + tags wired**

Run: `for f in scripts/content/git-fundamentals.js scripts/content/git-branching.js scripts/content/git-remotes.js scripts/content/git-undoing.js; do node --check "$f" || echo "FAIL $f"; done` (expect no FAIL). Then `grep -c 'scripts/content/git-\(fundamentals\|branching\|remotes\|undoing\).js' index.html` (expect 4). Also confirm no swallowed placeholders: `grep -noE '<[a-z]+>' scripts/content/git-fundamentals.js scripts/content/git-branching.js scripts/content/git-remotes.js scripts/content/git-undoing.js` should return nothing that's a command placeholder (they must be `&lt;…&gt;`) — fix any raw ones.

- [ ] **Step 3: Final manual browser pass**

Open the site: the **Git** module lists all 9 topics in order (4 new → 5 advanced); each new topic renders fully; Prev/Next threads fundamentals → branching → remotes → undoing → rebase → … → recovery; the `git-undoing` → `git-recovery` cross-link works; search finds the new topics; both themes render. Confirm the 5 existing advanced topics are unchanged.

**Deliverable:** complete beginner→advanced git module (4 new + 5 existing), structurally valid and wired. Accuracy separately gated by the expert-review step in execution. No commit.

---

## Self-Review

**Spec coverage:**
- §3 Architecture (reorder module, new topic files, script tags, generalized checker) → Tasks 1, 2, 3–5, 6. ✓
- §4 Registration shape (module 'git', sections, first-section collapsible) → Task 1 checker enforces (new topics); Tasks 2–5 author. ✓
- §5 Topic outlines (4 topics beginner→intermediate, reset table, modern verbs) → Tasks 2–5 per-section outlines. ✓
- §6 Correctness (git fact list + structural check new-topic-scoped + expert review) → Global Constraints fact list; Task 1 checker; accuracy via SDD review. ✓
- §7 Rollout (reorder + fundamentals slice first, STOP, then 3, then final) → Task ordering + explicit STOP at Task 2. ✓
- §8 Risks (existing topics untouched, reset-table accuracy, modern vs legacy verbs) → Global Constraints + checker new-topic scoping (won't false-fail existing) + review. ✓

**Placeholder scan:** Content tasks carry per-section outlines, not "TODO"; prose authored during execution + gated by structural-check + expert review; `…` in skeletons are author-fill markers. Infrastructure (checker rewrite, registry reorder) shown in full. No "handle errors / similar to Task N" placeholders in code steps.

**Type consistency:** New topic ids (`git-fundamentals`, `git-branching`, `git-remotes`, `git-undoing`), `module: 'git'`, the `NEW_TOPICS` set in the checker, the required section ids, and the `registerTopic` fields are used identically across Task 1 (checker + reorder), Tasks 2–5. File names match ids. The checker's new-topic scoping matches the fact that existing git topics lack `interview-patterns`.

**Deviation note:** Standard TDD "commit each task" + execution tests are replaced by (a) the Node structural checker (registration + new-topic sections) and (b) expert accuracy review, because topics are prose (no runnable output) and per project rules must not auto-commit/build.
