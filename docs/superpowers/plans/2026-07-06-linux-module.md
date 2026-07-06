# Linux Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new progressive "Linux" notes module — 6 beginner→advanced teaching topics (each with a Cheat Sheet) + a 7th master Command Reference topic.

**Architecture:** Seven vanilla-JS IIFE topic files register via `window.PREP_SITE.registerTopic`; a new `linux` module in `_index.js` drives the sidebar. The structural checker (`tools/verify-topics.mjs`) is generalized to validate the `linux` module, distinguishing teaching topics (full teaching-section check) from the reference topic (tldr + ≥3 sections). Accuracy is gated by expert review (commands/flags, no execution).

**Tech Stack:** Vanilla ES5/ES6 browser JS in IIFEs on `window.PREP_SITE`; existing Prism + theme; Node (ESM, `node:vm`) for the structural checker. No bundler/framework/test runner.

## Global Constraints

From the spec (`docs/superpowers/specs/2026-07-06-linux-module-design.md`). Every task implicitly includes these:

- **No build step.** Topic files load via `<script>` tags in `index.html`.
- **Registration pattern.** Each topic is an IIFE calling `window.PREP_SITE.registerTopic({ id, module, title, estimatedReadTime, tags, sections })`. `module: 'linux'`.
- **Topic ids (exact) + files:** `linux-fundamentals`, `linux-files-permissions`, `linux-text-pipelines`, `linux-processes-services`, `linux-shell-scripting`, `linux-networking-sysadmin`, `linux-command-reference` → files `scripts/content/<id>.js`.
- **Sections:** `{ id, title, html }` (+ `collapsible: false` on the first, `tldr`). `html` is raw trusted HTML; shell commands use `<pre><code class="language-bash">…</code></pre>`; inline `<code>`; tables via `<table>`. Command placeholders (`<file>`, `<dir>`, `<pid>`) MUST be escaped `&lt;file&gt;`.
- **Teaching topics (1–6):** must include section ids `tldr`, `what-why`, `mental-model`, `mechanics`, `examples`, `interview-patterns`, plus a `cheat-sheet` section (a `<table>`: command · purpose · key flags). `edge-cases` optional.
- **Reference topic (7, `linux-command-reference`):** `tldr` first (collapsible:false) + one `<table>` section per category with ids `ref-files`, `ref-permissions`, `ref-text`, `ref-processes`, `ref-scripting`, `ref-networking`. NO teaching sections. Aggregates only commands already taught in topics 1–6 (no new commands).
- **Command accuracy (verify every command + flag):** every command, flag, and example must be real and correct. Prefer modern tooling with legacy noted: `ip`/`ss` (mention legacy `ifconfig`/`netstat`), `systemctl`/`journalctl` (note systemd-specific), `#!/usr/bin/env bash`. Note package-manager distro differences: `apt`/`apt-get` (Debian/Ubuntu), `dnf`/`yum` (Fedora/RHEL), `pacman` (Arch). Bash examples follow safe practices (quote variables; `set -euo pipefail`).
- **No auto-commit / no auto-build.** Never run `git commit`/`git push`/build. End each task at verification; user commits manually on request.

---

## File Structure

**Modify:**
- `scripts/content/_index.js` — add the `linux` module to `registry.modules`.
- `index.html` — add 7 `linux-*.js` `<script>` tags among the content scripts (before `scripts/app.js`).
- `tools/verify-topics.mjs` — add `'linux'` to target modules; add the 6 linux teaching topics to the full-section set; add a reference-topic rule for `linux-command-reference`.

**Create:**
- `scripts/content/linux-fundamentals.js`, `linux-files-permissions.js`, `linux-text-pipelines.js`, `linux-processes-services.js`, `linux-shell-scripting.js`, `linux-networking-sysadmin.js`, `linux-command-reference.js`.

---

### Task 1: Add the linux module + generalize the checker (teaching vs reference)

**Files:**
- Modify: `scripts/content/_index.js`, `tools/verify-topics.mjs`

**Interfaces:**
- Produces: `linux` registry module (7 topics); `node tools/verify-topics.mjs` now validates redux + git + linux, with teaching-topic vs reference-topic section rules.

- [ ] **Step 1: Add the module to `_index.js`**

In `scripts/content/_index.js`, add to `registry.modules` (placement: after the `git` module is fine):
```js
    {
      id: "linux",
      title: "Linux",
      topics: [
        { id: "linux-fundamentals",        title: "Fundamentals & Navigation" },
        { id: "linux-files-permissions",   title: "Files, Permissions & Users" },
        { id: "linux-text-pipelines",      title: "Text Processing & Pipelines" },
        { id: "linux-processes-services",  title: "Processes, Jobs & Services" },
        { id: "linux-shell-scripting",     title: "Shell Scripting (Bash)" },
        { id: "linux-networking-sysadmin", title: "Networking, Packages & Sysadmin" },
        { id: "linux-command-reference",   title: "Command Reference" },
      ],
    },
```

- [ ] **Step 2: Generalize `tools/verify-topics.mjs`**

Read the current file (it validates `redux` + `git`). Make these edits:

(a) Add `'linux'` to `TARGET_MODULES`:
```js
const TARGET_MODULES = ['redux', 'git', 'linux'];
```
(b) Add the 6 linux TEACHING topics to `NEW_TOPICS` (do NOT add `linux-command-reference` here):
```js
const NEW_TOPICS = new Set([
  'redux-core', 'redux-toolkit', 'redux-rtk-query', 'redux-middleware-async', 'redux-advanced-testing',
  'git-fundamentals', 'git-branching', 'git-remotes', 'git-undoing',
  'linux-fundamentals', 'linux-files-permissions', 'linux-text-pipelines',
  'linux-processes-services', 'linux-shell-scripting', 'linux-networking-sysadmin',
]);
```
(c) Add a reference-topic set after `NEW_TOPICS`:
```js
const REFERENCE_TOPICS = new Set(['linux-command-reference']);
```
(d) In the per-topic validation loop, add a branch for reference topics (require tldr-first + ≥3 sections, NOT the teaching sections). Locate the block:
```js
    if (NEW_TOPICS.has(entry.id)) {
      const ids = t.sections.map(s => s.id);
      for (const req of REQUIRED) if (!ids.includes(req)) { console.log(`  ✗ ${entry.id}: missing section "${req}"`); failures++; }
      if (t.sections[0].id !== 'tldr' || t.sections[0].collapsible !== false) { console.log(`  ✗ ${entry.id}: first section must be tldr with collapsible:false`); failures++; }
      t.sections.forEach(s => { if (!nonEmpty(s.id) || !nonEmpty(s.title) || !nonEmpty(s.html)) { console.log(`  ✗ ${entry.id}: section "${s.id||'?'}" missing id/title/html`); failures++; } });
    }
```
and replace it with (adds the reference branch):
```js
    if (NEW_TOPICS.has(entry.id)) {
      const ids = t.sections.map(s => s.id);
      for (const req of REQUIRED) if (!ids.includes(req)) { console.log(`  ✗ ${entry.id}: missing section "${req}"`); failures++; }
      if (t.sections[0].id !== 'tldr' || t.sections[0].collapsible !== false) { console.log(`  ✗ ${entry.id}: first section must be tldr with collapsible:false`); failures++; }
      t.sections.forEach(s => { if (!nonEmpty(s.id) || !nonEmpty(s.title) || !nonEmpty(s.html)) { console.log(`  ✗ ${entry.id}: section "${s.id||'?'}" missing id/title/html`); failures++; } });
    } else if (REFERENCE_TOPICS.has(entry.id)) {
      if (t.sections[0].id !== 'tldr' || t.sections[0].collapsible !== false) { console.log(`  ✗ ${entry.id}: first section must be tldr with collapsible:false`); failures++; }
      if (t.sections.length < 3) { console.log(`  ✗ ${entry.id}: reference topic needs at least 3 sections`); failures++; }
      t.sections.forEach(s => { if (!nonEmpty(s.id) || !nonEmpty(s.title) || !nonEmpty(s.html)) { console.log(`  ✗ ${entry.id}: section "${s.id||'?'}" missing id/title/html`); failures++; } });
    }
```
(Leave the `✓`-line and the `(existing, registration only)` suffix logic as-is; a reference/new topic will print its ✓ when it passes.)

- [ ] **Step 3: Run the checker**

Run: `node tools/verify-topics.mjs`
Expected: `[redux]` and `[git]` blocks unchanged (all ✓ / existing as before); a new `[linux]` block where all 7 linux topics show `… not registered yet (pending)`; overall `✅ PASS`.

- [ ] **Step 4: Syntax-check**

Run: `node --check scripts/content/_index.js && node --check tools/verify-topics.mjs`
Expected: exit 0.

**Deliverable:** linux module registered (7 "coming soon" topics) + checker validates it with teaching/reference rules. No commit.

---

### Task 2: `linux-fundamentals` topic + wiring (the slice)

**Files:**
- Create: `scripts/content/linux-fundamentals.js`
- Modify: `index.html`

- [ ] **Step 1: Author `linux-fundamentals.js`**

Create the file as an IIFE. Look at `scripts/content/git-fundamentals.js` for house style/tone (it's the sibling "topic 1" for another CLI module). Skeleton:
```js
window.PREP_SITE.registerTopic({
  id: 'linux-fundamentals',
  module: 'linux',
  title: 'Fundamentals & Navigation',
  estimatedReadTime: '24 min',
  tags: ['linux', 'cli', 'shell', 'fundamentals', 'filesystem'],
  sections: [
    { id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `…` },
    { id: 'what-why', title: '🧠 What & Why', html: `…` },
    { id: 'mental-model', title: '🗺️ Mental Model', html: `…` },
    { id: 'mechanics', title: '⚙️ Mechanics', html: `…` },
    { id: 'examples', title: '🧪 Worked Examples', html: `…` },
    { id: 'edge-cases', title: '⚠️ Edge Cases', html: `…` },
    { id: 'cheat-sheet', title: '📋 Cheat Sheet', html: `…` },
    { id: 'interview-patterns', title: '🎤 Interview Patterns', html: `…` },
  ],
});
```
Content outline (beginner — assume zero Linux knowledge):
- **TL;DR:** what Linux is (kernel vs distro vs shell); everything-is-a-file; you drive it from the shell; the module goes beginner→advanced.
- **What & Why:** why the CLI (speed, scripting, remote servers); kernel/distro/shell distinction; what a terminal/shell is (bash/zsh).
- **Mental Model:** the filesystem as a single tree from `/` (with an ASCII tree of `/`, `/home`, `/etc`, `/var`, `/usr`, `/tmp`, `/bin`); absolute vs relative paths; `.`, `..`, `~`, `/`.
- **Mechanics:** commands in `<pre><code class="language-bash">`: `pwd`; `ls` (`-l`, `-a`, `-h`, `-t`, `-R`); `cd` (`~`, `-`, `..`); `mkdir -p`, `rmdir`, `touch`; `cp -r`, `mv`, `rm -r -f` (with a danger note); viewing `cat`, `less`, `head`/`tail` (`-n`, `-f`), `file`, `stat`, `tree`; help `man`, `--help`, `apropos`, `whatis`, `which`/`type`, `history`, `clear`. Escape any placeholders like `&lt;dir&gt;`.
- **Worked Examples:** navigate + create a project tree; inspect files; read a big file/log with less+tail -f.
- **Edge Cases:** `rm -rf` danger (no undo/no trash); spaces in filenames (quoting); hidden dotfiles; `cd` with no arg goes home.
- **Cheat Sheet:** a `<table>` — rows for each command above (command · purpose · key flags).
- **Interview Patterns:** 4–6 Q&A — "kernel vs distro vs shell?", "absolute vs relative path?", "what does `ls -la` show?", "how do you get help on a command?", "what is `/etc` / `/var` for?", "difference between `less` and `cat`?".

- [ ] **Step 2: Wire the script tag**

In `index.html`, add among the content `<script>` tags (before `scripts/app.js`):
```html
<script src="scripts/content/linux-fundamentals.js"></script>
```

- [ ] **Step 3: Structural check**

Run: `node tools/verify-topics.mjs`
Expected: in `[linux]`, `✓ linux-fundamentals: N sections`, the other 6 still `… pending`, overall `✅ PASS`. Fix any `✗`. Then `node --check scripts/content/linux-fundamentals.js`; `grep -c 'linux-fundamentals.js' index.html` → 1; `grep -noE '<[a-z]+>' scripts/content/linux-fundamentals.js` returns no raw command placeholders (must be `&lt;…&gt;`).

- [ ] **Step 4: Manual browser verification**

Open `index.html`. Verify: the **Linux** module appears with **Fundamentals & Navigation** first (others "coming soon"); the topic renders all sections incl. the Cheat Sheet table; command blocks highlighted with Copy; placeholders like `<dir>` show literally; both themes fine; Prev/Next present.

**Deliverable:** linux module + topic 1 live end-to-end. **STOP for user review of style/depth + cheat-sheet format before authoring the rest.** No commit.

---

### Tasks 3–7: Remaining teaching topics

Each task creates one `scripts/content/linux-<suffix>.js` using the same skeleton as Task 2 (its own id/title/tags, incl. the `cheat-sheet` section), authoring each section per the outline below, then adds its `<script>` tag to `index.html`, runs `node tools/verify-topics.mjs` (its topic shows `✓` with the teaching sections + cheat-sheet; overall `✅ PASS`), `node --check`s the file, and confirms no raw command placeholders (`grep -noE '<[a-z]+>' <file>`). No commit. Commands in `<pre><code class="language-bash">`; respect the Global Constraints command-accuracy facts (verify every flag; note distro/systemd specifics); match `linux-fundamentals` style.

### Task 3: `linux-files-permissions.js` — "Files, Permissions & Users"
Sections: tldr/what-why/mental-model/mechanics/examples/edge-cases/cheat-sheet/interview-patterns.
Commands + concepts: permission model (user/group/other × rwx; reading `ls -l`); `chmod` (numeric 755/644/600 + symbolic `u+x`/`go-w`/`a+r`), `umask`; ownership `chown user:group`, `chgrp`; users/groups `whoami`, `id`, `groups`, `useradd`/`usermod -aG`, `passwd`; privilege `sudo`, `su`, root; links `ln -s` (symbolic) vs hard links (`ln`) — inodes; finding `find <path> -name -type -mtime -size -exec`, `locate`/`updatedb`; globs (`*`, `?`, `[abc]`, `{a,b}`). Edge cases: chmod 777 danger; sudo vs su; symlink to a moved target (dangling); find `-exec` vs `xargs`. Interview Q&A on rwx numeric values, chmod symbolic, sudo vs su, symbolic vs hard links, find usage.

### Task 4: `linux-text-pipelines.js` — "Text Processing & Pipelines"
Commands + concepts: streams (stdin/stdout/stderr = fd 0/1/2); redirection `>`, `>>`, `2>`, `2>&1`, `&>`, `<`, `|`, `/dev/null`, `tee`; `grep` (`-i -v -n -r -E -o -c`), `sed 's/x/y/g'` + `-i` + delete `/pat/d`, `awk '{print $1}'`/patterns/`-F`; `sort` (`-n -r -k -u`), `uniq -c`, `wc -l/-w/-c`, `cut -d -f`, `tr`, `paste`, `join`, `comm`, `xargs` (`-I{}`); basic regex (anchors, classes, quantifiers). Examples: count log errors (grep|wc), top talkers (awk|sort|uniq -c|sort -rn|head), in-place edit (sed -i). Edge cases: `2>&1` order matters; unquoted globs in pipelines; `grep -F` for fixed strings; awk vs cut for whitespace. Interview Q&A on redirection, grep/sed/awk roles, building a pipeline, stderr vs stdout.

### Task 5: `linux-processes-services.js` — "Processes, Jobs & Services"
Commands + concepts: process/PID/PPID; `ps aux`/`ps -ef`, `top`/`htop`, `pgrep`/`pkill -f`; signals (SIGTERM 15, SIGKILL 9, SIGHUP 1, SIGINT 2) + `kill`/`kill -9`/`killall`; job control (`cmd &`, `Ctrl-Z`, `jobs`, `fg %1`, `bg`, `nohup`, `disown`); priority `nice -n`/`renice`; resources `free -h`, `uptime`, `lsof`, `lsof -i`; services (systemd) `systemctl start/stop/restart/enable/status <svc>`, `journalctl -u <svc>`/`-f`; scheduling `crontab -e` (5-field syntax), `at`, systemd timers (brief). Edge cases: SIGKILL can't be trapped/cleaned up; orphaned vs zombie processes; nohup vs disown; enable vs start. Interview Q&A on SIGTERM vs SIGKILL, backgrounding a job, checking why a service failed (journalctl), cron syntax.

### Task 6: `linux-shell-scripting.js` — "Shell Scripting (Bash)"
Commands + concepts: shebang `#!/usr/bin/env bash`, `chmod +x`, running (`./script.sh` vs `bash script.sh` vs `source`); variables & quoting (`"$x"` vs `'$x'`, `${var}`, `${var:-default}`), command substitution `$(...)`; I/O `echo`, `printf`, `read`; tests `[ ]`/`[[ ]]`/`test` (string/number/file tests `-f -d -z -n`), conditionals `if/elif/else`, `case`; loops `for x in …`, `while`, `until`, C-style `for ((...))`; functions + `local`; args `$0 $1 $@ $* $# shift`; exit codes `$?`, `exit N`, `&&`/`||`; robustness `set -euo pipefail`, `trap 'cleanup' EXIT`. A complete example script (args + validation + loop + function). Edge cases: unquoted `$var` word-splitting; `[ ]` vs `[[ ]]`; `set -e` gotchas; `$@` vs `$*` quoting. Interview Q&A on quoting, `set -euo pipefail`, exit codes, `[[ ]]` vs `[ ]`, functions.

### Task 7: `linux-networking-sysadmin.js` — "Networking, Packages & Sysadmin" (advanced)
Commands + concepts: networking `ip a`/`ip r` (legacy `ifconfig`/`route` noted), `ss -tulpn` (legacy `netstat`), `ping`, `curl` (`-I -L -o -X -H`)/`wget`, `ssh user@host`/`-i`/config, `scp`/`rsync -avz`, `dig`/`host`/`nslookup`; **package managers with distro notes**: `apt update`/`apt install`/`apt remove` (Debian/Ubuntu), `dnf install` (Fedora/RHEL), `pacman -S` (Arch); disks `df -h`, `du -sh`, `lsblk`, `mount`/`umount`; env & PATH `env`, `export`, `echo $PATH`, `~/.bashrc` vs `~/.profile`; logs `journalctl`, `/var/log/*`, `tail -f`; archives `tar -czvf`/`-xzvf`/`-tzvf`, `gzip`/`gunzip`, `zip`/`unzip`; system info `uname -a`, `hostnamectl`, `df`. Edge cases: `curl -I` (headers) vs `-i`; ssh key vs password; apt vs dnf vs pacman equivalence table; `tar` flag order. Interview Q&A on checking listening ports (ss), the package-manager-per-distro question, ssh key auth, tar create/extract.

---

### Task 8: `linux-command-reference.js` — "Command Reference" (built last)

**Files:**
- Create: `scripts/content/linux-command-reference.js`
- Modify: `index.html`

**Interfaces:** Consumes nothing from earlier tasks at runtime, but aggregates the commands taught in Tasks 2–7.

- [ ] **Step 1: Author the reference topic**

Create `scripts/content/linux-command-reference.js`. This is a REFERENCE, not a lesson — different structure:
```js
window.PREP_SITE.registerTopic({
  id: 'linux-command-reference',
  module: 'linux',
  title: 'Command Reference',
  estimatedReadTime: '15 min',
  tags: ['linux', 'cli', 'reference', 'cheat-sheet'],
  sections: [
    { id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `…how to use this reference…` },
    { id: 'ref-files',       title: '📁 File & Navigation',   html: `<table>…</table>` },
    { id: 'ref-permissions', title: '🔒 Permissions & Users', html: `<table>…</table>` },
    { id: 'ref-text',        title: '✂️ Text & Pipelines',    html: `<table>…</table>` },
    { id: 'ref-processes',   title: '⚙️ Processes & Services', html: `<table>…</table>` },
    { id: 'ref-scripting',   title: '📜 Shell Scripting',      html: `<table>…</table>` },
    { id: 'ref-networking',  title: '🌐 Networking & Packages',html: `<table>…</table>` },
  ],
});
```
Each category `<table>` has header row `Command | Purpose | Key flags | Example` and one row per command taught in the corresponding teaching topic(s). Cover the SAME commands taught in Tasks 2–7 (no new commands). Escape command placeholders in the Example column (`&lt;file&gt;`). Keep flags/examples consistent with what the teaching topics said.

- [ ] **Step 2: Wire the script tag**

Add to `index.html` (before `scripts/app.js`): `<script src="scripts/content/linux-command-reference.js"></script>`.

- [ ] **Step 3: Structural check**

Run: `node tools/verify-topics.mjs`
Expected: `✓ linux-command-reference: 7 sections` (tldr + 6 tables), overall `✅ PASS`. Then `node --check scripts/content/linux-command-reference.js`; `grep -noE '<[a-z]+>' scripts/content/linux-command-reference.js` shows no raw command placeholders.

**Deliverable:** the master Command Reference topic. No commit.

---

### Task 9: Final structural check + review pass

**Files:** none (verification only).

- [ ] **Step 1: Full structural check**

Run: `node tools/verify-topics.mjs`
Expected: `[linux]` block shows all 7 topics `✓` (6 teaching with teaching sections + cheat-sheet, the reference with tldr + 6 tables); `[redux]`/`[git]` unchanged; overall `✅ PASS`.

- [ ] **Step 2: Confirm files parse + tags wired + placeholders escaped**

Run: `for f in scripts/content/linux-*.js; do node --check "$f" || echo "FAIL $f"; done` (expect no FAIL). `grep -c 'scripts/content/linux-' index.html` (expect 7). `grep -rnoE '<(file|dir|pid|path|user|group|host|url|name|cmd|svc|pattern)>' scripts/content/linux-*.js` (expect nothing — all escaped).

- [ ] **Step 3: Final manual browser pass**

Open the site: the **Linux** module lists all 7 topics in order; each renders (teaching topics show their Cheat Sheet table; the reference shows 6 category tables); Prev/Next threads them fundamentals → … → command-reference; tables render legibly in both themes; search finds the new topics. Confirm no existing module regressed.

**Deliverable:** complete 7-topic Linux module, structurally valid and wired. Accuracy separately gated by the expert-review step in execution. No commit.

---

## Self-Review

**Spec coverage:**
- §3 Architecture (module, 7 topic files, script tags, generalized checker w/ reference rule) → Tasks 1, 2, 3–7, 8, 9. ✓
- §4 Registration shape (module 'linux', teaching sections + cheat-sheet, reference structure, first-section collapsible) → Task 1 checker enforces; Tasks 2–8 author. ✓
- §5 Topic outlines (7 topics, command inventories, cheat-sheets, reference tables) → Tasks 2–8 per-section command lists. ✓
- §6 Correctness (command/flag accuracy + distro notes + structural check teaching-vs-reference + expert review) → Global Constraints fact list; Task 1 checker; accuracy via SDD review. ✓
- §7 Rollout (module + fundamentals slice first, STOP, then 2–7, reference last, final) → Task ordering + explicit STOP at Task 2 + reference at Task 8. ✓
- §8 Risks (wrong flags, distro assumptions, reference drift, HTML-safety, checker false-fail) → Global Constraints + Task 1 reference-rule + Task 9 cross-check + placeholder greps. ✓

**Placeholder scan:** Content tasks carry per-topic command inventories + section outlines (the actual "what to cover"), not "TODO"; prose authored during execution + gated by structural-check + expert review; `…` in skeletons are author-fill markers. Infrastructure (checker edits, registry entry) shown in full. No "handle errors / similar to Task N" placeholders in code steps.

**Type consistency:** Topic ids, `module: 'linux'`, the `NEW_TOPICS`/`REFERENCE_TOPICS` sets in the checker, the teaching section ids + `cheat-sheet`, the reference section ids (`ref-*`), and the `registerTopic` fields are used identically across Task 1 (checker + registry), Tasks 2–8. File names match ids. The reference topic's section rules (tldr + ≥3) match its 7-section structure (tldr + 6 tables).

**Deviation note:** Standard TDD "commit each task" + execution tests are replaced by (a) the Node structural checker (registration + teaching/reference sections) and (b) expert accuracy review, because topics are prose (no runnable output) and per project rules must not auto-commit/build.
