# Linux Module (Beginner → Advanced) — Design Spec

**Date:** 2026-07-06
**Status:** Approved design, pending implementation plan
**Repo:** Prep-Site (static, offline-first study site; no build step; vanilla JS via `<script>` tags)

## 1. Goal

Add a new progressive **Linux** learning module — six beginner→advanced teaching topics
covering the practical Linux/CLI command set in depth, plus a seventh master **Command
Reference** topic that aggregates every command into one scannable cheat-sheet.

Success = a learner with no Linux background can start at topic 1 and reach practical
sysadmin/scripting competence by topic 6, with topic 7 as a fast lookup for any command.

## 2. Scope

**In scope**
- A new sidebar **module** ("Linux") in `_index.js`.
- Seven topic files under `scripts/content/linux-*.js`.
- Comprehensive coverage of the practical command set (the commands developers actually use),
  each taught with real invocations, common flags, and gotchas — NOT a dump of every binary.
- A "📋 Cheat Sheet" section in each of the 6 teaching topics.
- A 7th reference topic aggregating all commands into category tables.
- Generalizing the structural checker (`tools/verify-topics.mjs`) to validate the `linux` module.

**Out of scope**
- No practice-hub challenges (this is notes).
- No new site features (existing topic-rendering pipeline reused).
- No exhaustive man-page mirroring — coverage is the practical high-frequency toolkit.

## 3. Architecture & Integration

Follow the existing content pattern (same as the Redux and Git modules). Each topic is an
IIFE calling `window.PREP_SITE.registerTopic({...})`; the module list in `_index.js` drives
sidebar order and Prev/Next.

**Modify**
- `scripts/content/_index.js` — add a new module to `registry.modules`:
  ```js
  {
    id: "linux",
    title: "Linux",
    topics: [
      { id: "linux-fundamentals",         title: "Fundamentals & Navigation" },
      { id: "linux-files-permissions",    title: "Files, Permissions & Users" },
      { id: "linux-text-pipelines",       title: "Text Processing & Pipelines" },
      { id: "linux-processes-services",   title: "Processes, Jobs & Services" },
      { id: "linux-shell-scripting",      title: "Shell Scripting (Bash)" },
      { id: "linux-networking-sysadmin",  title: "Networking, Packages & Sysadmin" },
      { id: "linux-command-reference",    title: "Command Reference" },
    ],
  }
  ```
- `index.html` — add seven `<script src="scripts/content/linux-*.js">` tags among the content
  scripts (before `scripts/app.js`).
- `tools/verify-topics.mjs` — add `'linux'` to `TARGET_MODULES`; add the 6 teaching linux
  topics to `NEW_TOPICS` (full teaching-section check); add `linux-command-reference` to a new
  `REFERENCE_TOPICS` set that requires `tldr` first (collapsible:false) + at least 3 non-empty
  sections, but NOT the 6 teaching-section ids.

**Create** — seven topic files: `linux-fundamentals.js`, `linux-files-permissions.js`,
`linux-text-pipelines.js`, `linux-processes-services.js`, `linux-shell-scripting.js`,
`linux-networking-sysadmin.js`, `linux-command-reference.js`.

**No change** to the router, search, theme, or progress.

## 4. Topic Registration Shape

Each topic uses the site's standard shape (`module: 'linux'`):

```js
window.PREP_SITE.registerTopic({
  id: 'linux-fundamentals',
  module: 'linux',
  title: 'Fundamentals & Navigation',
  estimatedReadTime: '22 min',
  tags: ['linux', 'cli', 'shell', 'fundamentals'],
  sections: [ { id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `…` }, … ],
});
```

- Section `html` is raw trusted HTML; shell commands use `<pre><code class="language-bash">…</code></pre>`,
  inline `<code>`, tables via `<table>`. Command placeholders (`<file>`, `<dir>`) must be
  escaped `&lt;file&gt;`.
- **Teaching topics (1–6)** include at least: `tldr` (collapsible:false), `what-why`,
  `mental-model`, `mechanics`, `examples`, `interview-patterns`, plus a **`cheat-sheet`**
  section (a `<table>`: command · purpose · key flags). `edge-cases` optional.
- **Reference topic (7)** structure: `tldr` (collapsible:false) + one section per command
  category (`ref-files`, `ref-permissions`, `ref-text`, `ref-processes`, `ref-scripting`,
  `ref-networking`), each a `<table>` (command · one-line purpose · most-used flags · tiny
  example). No teaching sections.

## 5. Topic Content Outline (beginner → advanced)

Command inventory per topic (taught with flags/examples in Mechanics + Worked Examples, and
summarized in each topic's Cheat Sheet table):

**1. `linux-fundamentals` — Fundamentals & Navigation** (beginner)
What Linux is (kernel vs distro vs shell); the filesystem hierarchy (`/`, `/home`, `/etc`,
`/var`, `/usr`, `/tmp`, `/bin`); absolute vs relative paths, `.`/`..`/`~`. Commands: `pwd`,
`ls` (`-l -a -h -t -R`), `cd`, `cp` (`-r`), `mv`, `rm` (`-r -f`), `mkdir` (`-p`), `rmdir`,
`touch`, `cat`, `less`, `more`, `head`/`tail` (`-n`, `-f`), `file`, `stat`, `tree`, `ln`
(intro), help: `man`, `--help`, `apropos`, `whatis`, `which`, `type`, `history`, `clear`.

**2. `linux-files-permissions` — Files, Permissions & Users** (beginner→intermediate)
The permission model (user/group/other × rwx; how `ls -l` reads); `chmod` (numeric 755/644 +
symbolic `u+x`,`go-w`), `umask`; ownership `chown`/`chgrp`; users/groups (`whoami`, `id`,
`groups`, `useradd`/`usermod`, `passwd`), `sudo`/`su`/root; links `ln -s` (symbolic vs hard);
finding files `find` (`-name -type -mtime -exec`), `locate`; globs (`*`,`?`,`[...]`,`{}`).

**3. `linux-text-pipelines` — Text Processing & Pipelines** (intermediate)
Streams (stdin/stdout/stderr, fd 0/1/2); redirection (`>`,`>>`,`2>`,`&>`,`<`,`|`, `/dev/null`),
`tee`; `grep` (`-i -v -r -n -E -o`), `sed` (substitute/delete), `awk` (fields/patterns),
`sort` (`-n -r -k`), `uniq` (`-c`), `wc`, `cut`, `tr`, `paste`, `join`, `comm`, `xargs`;
basic regex.

**4. `linux-processes-services` — Processes, Jobs & Services** (intermediate)
Processes & PIDs; `ps` (`aux`, `-ef`), `top`/`htop`, `pgrep`/`pkill`; signals (SIGTERM/SIGKILL/
SIGHUP/SIGINT) + `kill`/`killall`; job control (`&`, `Ctrl-Z`, `jobs`, `fg`, `bg`, `nohup`,
`disown`); priority `nice`/`renice`; resource views `free`, `uptime`, `lsof`; services with
`systemd`/`systemctl` (`start/stop/enable/status`), `journalctl`; scheduling `cron`/`crontab`,
`at`, systemd timers (brief).

**5. `linux-shell-scripting` — Shell Scripting (Bash)** (intermediate→advanced)
Shebang (`#!/usr/bin/env bash`), running scripts, `chmod +x`; variables & quoting (`"$x"` vs
`'$x'`, `${var}`), command substitution `$(...)`; `echo`/`printf`/`read`; tests `[ ]`/`[[ ]]`/
`test`, conditionals `if/elif/else`, `case`; loops `for`/`while`/`until`; functions, args
(`$1`,`$@`,`$#`,`shift`), exit codes (`$?`, `exit`), `&&`/`||`; `set -euo pipefail`, `trap`;
`export`/`local`/`source`. Emphasize robust-script practices.

**6. `linux-networking-sysadmin` — Networking, Packages & Sysadmin** (advanced)
Networking: `ip a`/`ip r` (vs legacy `ifconfig`/`route`), `ss` (vs `netstat`), `ping`,
`curl`/`wget`, `ssh`/`scp`/`rsync`, `dig`/`host`; **package managers** with distro notes:
`apt`/`apt-get` (Debian/Ubuntu), `dnf`/`yum` (Fedora/RHEL), `pacman` (Arch); disks `df -h`,
`du -sh`, `lsblk`, `mount`/`umount`; env & `PATH` (`env`, `export`, `~/.bashrc`); logs
`journalctl`, `/var/log`; archives `tar` (`-czvf`/`-xzvf`), `gzip`/`gunzip`, `zip`; system
info `uname -a`, `uptime`, `df`.

**7. `linux-command-reference` — Command Reference** (all levels)
A master lookup. TL;DR explaining how to use it, then six category table sections
(File & Navigation, Permissions & Users, Text & Pipelines, Processes & Services, Shell
Scripting, Networking & Packages). Each table row: command · one-line purpose · most-used
flags · tiny example. Aggregates every command from topics 1–6 (no new commands beyond what
those topics teach — this is the consolidated cheat-sheet).

## 6. Correctness (accuracy)

Prose notes — no execution harness. Accuracy is gated by **expert review**, seeded with:
- Every command, flag, and example is real and correct (a wrong flag is the main risk).
- Modern tooling preferred with legacy noted: `ip`/`ss` (not just `ifconfig`/`netstat`),
  `systemctl` for services; `#!/usr/bin/env bash`.
- **Distro-neutral where possible**, explicitly noting package-manager differences
  (`apt` vs `dnf` vs `pacman`) and that some tools (`systemctl`, `journalctl`) are
  systemd-specific.
- Bash-scripting examples must be correct and follow safe practices (quote variables,
  `set -euo pipefail`).
- The reference topic's tables must match what the teaching topics actually taught (no
  contradictions in flags).

A structural check (`tools/verify-topics.mjs`, generalized to `linux`) confirms each topic
registers with `module:'linux'`, unique id, `tldr` first (collapsible:false); teaching topics
(1–6) must have the 6 teaching sections; the reference topic (7) must have `tldr` + ≥3 sections.

## 7. Rollout Plan

Reviewable batches; nothing committed unless the user asks.

1. **Slice:** add the `linux` module to `_index.js`; generalize `tools/verify-topics.mjs`
   (add `linux`, define teaching vs reference section rules); author `linux-fundamentals`
   end-to-end (incl. its Cheat Sheet); wire its `<script>` tag. User reviews the module +
   topic-1 depth/style + cheat-sheet format in the browser. **STOP for review.**
2. `linux-files-permissions`.
3. `linux-text-pipelines`.
4. `linux-processes-services`.
5. `linux-shell-scripting`.
6. `linux-networking-sysadmin`.
7. `linux-command-reference` (built last — aggregates commands from 1–6).
8. Final accuracy-review pass across all seven + structural check + browser pass (module
   ordered, all seven render, Prev/Next threads them, cheat-sheets + reference tables render).

Each content batch: author → structural check → accuracy review → fix → summarize.

## 8. Risks & Mitigations

- **Wrong command/flag** → §6 expert-review gate; every command + flag verified; reviewer
  cross-checks the reference tables against the teaching topics.
- **Distro assumptions** → explicitly note apt/dnf/pacman and systemd-specific tools.
- **Reference topic drift** (commands/flags disagreeing with teaching topics) → build topic 7
  last and have the final review cross-check it against topics 1–6.
- **HTML-safety** → escape command placeholders (`&lt;file&gt;`); large tables use `<table>`
  which the existing renderer/theme already supports.
- **Checker false-fail on the reference topic** (it lacks teaching sections) → the checker
  section-rules split teaching vs reference topics (§3, §6).

## 9. Open Questions

None blocking. Exact per-topic Cheat Sheet row counts and which optional sections each teaching
topic uses are left to the author within the §4 minimums; adjustable during review.
