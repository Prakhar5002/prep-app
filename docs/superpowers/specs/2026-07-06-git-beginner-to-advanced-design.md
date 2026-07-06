# Git Track (Beginner → Advanced) — Design Spec

**Date:** 2026-07-06
**Status:** Approved design, pending implementation plan
**Repo:** Prep-Site (static, offline-first study site; no build step; vanilla JS via `<script>` tags)

## 1. Goal

Turn the existing advanced-only `git` module into a full **beginner → advanced** course by
adding four foundational topics ahead of the five existing power-user topics. A learner with
no Git background should be able to start at topic 1 and progress naturally into the advanced
material (rebase, cherry-pick, bisect, worktrees, recovery) that already exists.

Success = the `git` module reads as one continuous course (fundamentals → branching → remotes
→ everyday undo → advanced), following the site's existing topic conventions.

## 2. Scope

**In scope**
- Four new topic files added to the FRONT of the existing `git` module.
- Reordering the `git` module's `topics` array in `_index.js` so new topics precede the
  existing five.
- Four new `<script>` tags in `index.html`.
- One cross-link from `git-undoing` to the existing `git-recovery` topic.
- Generalizing the structural checker (`tools/verify-topics.mjs`) to also validate the new
  git topics.

**Out of scope**
- No changes to the five existing git topics' content (rebase/cherry/bisect/worktrees/recovery
  — audit-verified, left as the advanced tail). Reordering the registry list is not a content change.
- No practice-hub challenges (this is notes).
- No new site features (existing topic-rendering pipeline is reused).

## 3. Architecture & Integration

Follow the existing content pattern exactly. Each new topic is an IIFE calling
`window.PREP_SITE.registerTopic({...})`; the module list in `_index.js` drives sidebar order
and Prev/Next.

**Modify**
- `scripts/content/_index.js` — reorder the existing `git` module's `topics` array to:
  ```js
  topics: [
    { id: "git-fundamentals", title: "Git Fundamentals" },
    { id: "git-branching",    title: "Branching & Merging" },
    { id: "git-remotes",      title: "Remotes & Collaboration" },
    { id: "git-undoing",      title: "Undoing & Everyday Fixes" },
    { id: "git-rebase",       title: "Rebase vs Merge" },        // existing
    { id: "git-cherry",       title: "Cherry-Pick" },            // existing
    { id: "git-bisect",       title: "Bisect for Bug Hunting" }, // existing
    { id: "git-worktrees",    title: "Worktrees" },              // existing
    { id: "git-recovery",     title: "Recovery (reflog etc.)" }, // existing
  ]
  ```
  (Keep the existing entries' exact titles; only add the four new ones at the front.)
- `index.html` — add four `<script src="scripts/content/git-*.js">` tags among the content
  scripts (before `scripts/app.js`).
- `tools/verify-topics.mjs` — generalize so it validates BOTH the `redux` and `git` modules'
  registered topics (structure + required sections), instead of hardcoding only `redux`.

**Create** — four topic files: `scripts/content/git-fundamentals.js`, `git-branching.js`,
`git-remotes.js`, `git-undoing.js`.

**No change** to: the five existing git topic files, the router, search, theme, or progress.

## 4. Topic Registration Shape

Each new topic uses the site's standard shape (`module: 'git'`, matching the existing git
topics' `module` value):

```js
window.PREP_SITE.registerTopic({
  id: 'git-fundamentals',
  module: 'git',
  title: 'Git Fundamentals',
  estimatedReadTime: '20 min',
  tags: ['git', 'fundamentals', 'commits', 'staging'],
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

- Section `html` is raw trusted HTML; shell/command snippets use `<pre><code class="language-bash">…</code></pre>`
  (Prism highlight + Copy button), inline uses `<code>`.
- Every new topic includes at least: `tldr`, `what-why`, `mental-model`, `mechanics`,
  `examples`, `interview-patterns` (`edge-cases` and/or `bugs-anti-patterns` optional).
  First section `tldr` is `collapsible: false`.

## 5. Topic Content Outline (beginner → advanced)

**Topic 1 — `git-fundamentals` — Git Fundamentals** (beginner)
What Git is (a distributed version-control system; every clone is a full repo with history);
the three areas — **working tree → staging area (index) → repository** — and how `add`/`commit`
move changes between them; `git init`, `git clone`; `git status`, `git diff` (unstaged vs
`--staged`), `git add`, `git commit -m`; what a commit is (snapshot + parent + SHA), `HEAD`;
`git log` (`--oneline`, `--graph`); `.gitignore`. Mechanics shows a from-nothing flow
(init → edit → add → commit → log). Motivates branching next.

**Topic 2 — `git-branching` — Branching & Merging** (beginner→intermediate)
Branches as movable pointers to commits; `git branch`, `git switch`/`git switch -c` (and the
older `git checkout -b`); deleting/renaming; **fast-forward vs 3-way merge** (with a diagram);
`git merge`; resolving a basic merge conflict (conflict markers, edit, `git add`, commit);
`git merge --abort`. Note `git switch`/`restore` are the modern verbs (Git 2.23+).

**Topic 3 — `git-remotes` — Remotes & Collaboration** (intermediate)
Remotes and `origin`; `git clone`, `git remote -v`, `git remote add`; `git fetch` vs
`git pull` (fetch = download only; pull = fetch + merge/rebase); `git push`, upstream/tracking
branches (`-u`), `git branch -vv`; the PR/MR collaboration flow (branch → push → PR → review →
merge); pull.rebase vs merge default. Cross-reference the advanced Rebase topic.

**Topic 4 — `git-undoing` — Undoing & Everyday Fixes** (intermediate)
`git restore` (working tree) / `git restore --staged` (unstage) vs the older
`git checkout --`/`git reset`; `git reset --soft|--mixed|--hard` (what each moves: HEAD /
index / working tree) with a clear table; `git revert` (safe, shared-history undo) vs reset;
`git commit --amend`; `git stash` (push/pop/list/apply). When to use which. **Cross-link to
`git-recovery`** (reflog) for recovering "lost" commits — this topic is the everyday layer,
`git-recovery` is the deep-recovery layer.

## 6. Correctness (accuracy)

Prose notes — no execution harness. Accuracy is gated by **expert review**, seeded with:
- Modern Git verbs: prefer `git switch`/`git restore` (Git 2.23+) while still teaching the
  `checkout` equivalents learners will encounter.
- Default branch is `main` in current Git/host defaults (note `master` legacy).
- `reset` soft/mixed/hard semantics (HEAD / index / working tree) must be exactly correct —
  this is the highest-risk table.
- `fetch` vs `pull`, fast-forward vs 3-way merge, `revert` vs `reset` framing must be correct.
- Every shown command must be a real, correct invocation (flags/behavior verified).
- Reviewer checks the four new topics for command correctness + consistency with the existing
  advanced git topics (no contradictions).

A structural check (`tools/verify-topics.mjs`, generalized to cover `git`) confirms each new
git topic registers with a unique id, `module: 'git'`, and the required sections — no execution.

## 7. Rollout Plan

Reviewable batches; nothing committed unless the user asks.

1. **Slice:** generalize `tools/verify-topics.mjs` to validate the `git` module; reorder the
   `git` module in `_index.js`; author `git-fundamentals` end-to-end; wire its `<script>` tag.
   User reviews the module's new ordering + topic-1 depth in the browser. **STOP for review.**
2. `git-branching`.
3. `git-remotes`.
4. `git-undoing` (+ the cross-link to `git-recovery`).
5. Final accuracy-review pass across the four new topics + structural check + browser pass
   (module ordered correctly, all four render, Prev/Next threads fundamentals → … → recovery,
   the undoing→recovery cross-link works).

Each content batch: author → structural check → accuracy review → fix → summarize.

## 8. Risks & Mitigations

- **Wrong git command semantics** (esp. the `reset` table, `fetch`/`pull`) → §6 expert-review
  gate seeded with the fact list; every command verified.
- **Breaking the existing advanced topics** → their files are untouched; only the registry
  `topics` order changes (additive at the front). Structural check + browser pass confirm all
  9 topics still resolve.
- **Duplication with existing advanced topics** → the four new topics are foundational and stop
  where the advanced ones begin (e.g. `git-undoing` covers reset/revert/stash and hands off to
  `git-recovery` for reflog; `git-remotes` hands off to the advanced Rebase topic). Cross-links,
  no overlap.
- **Modern-vs-legacy verbs confusion** → teach `switch`/`restore` as primary, `checkout` as the
  equivalent learners will see, explicitly.

## 9. Open Questions

None blocking. Section subsets per topic (which optional sections each uses) left to the author
within the §4 minimum; adjustable during review.
