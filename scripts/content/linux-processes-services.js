window.PREP_SITE.registerTopic({
  id: 'linux-processes-services',
  module: 'linux',
  title: 'Processes, Jobs & Services',
  estimatedReadTime: '26 min',
  tags: ['linux', 'processes', 'signals', 'systemd', 'cron', 'job-control'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>Every running program on Linux is a <strong>process</strong> — identified by a unique <strong>PID</strong> (process ID) and tracking who started it via its <strong>PPID</strong> (parent process ID). You inspect processes with <code>ps</code>/<code>top</code>/<code>htop</code>, find them by name with <code>pgrep</code>, and control them by sending <strong>signals</strong> — small numbered messages like <code>SIGTERM</code> ("please stop") or <code>SIGKILL</code> ("die now, no cleanup") — via <code>kill</code>, <code>killall</code>, or <code>pkill</code>.</p>
<ul>
  <li><strong>Job control</strong> lets one shell juggle multiple commands: run something in the background with <code>&amp;</code>, suspend a foreground command with <code>Ctrl-Z</code>, and manage the results with <code>jobs</code>, <code>fg</code>, and <code>bg</code>. <code>nohup</code> and <code>disown</code> both protect a background job from being killed when you log out — at different points in its lifecycle.</li>
  <li><strong>Priority</strong> (<code>nice</code>/<code>renice</code>) hints to the kernel's scheduler how eagerly a process should compete for CPU time — lower "niceness" means higher priority.</li>
  <li><strong>systemd</strong> is the process manager (PID 1) on essentially every modern Linux distro. It starts, stops, restarts, and supervises long-running background programs — <strong>services</strong> — via <code>systemctl</code>, and centralizes their logs so you can read them with <code>journalctl</code>.</li>
  <li><strong>Scheduling</strong> runs commands automatically without you being logged in: <code>cron</code> (via <code>crontab -e</code>) for recurring jobs on a fixed schedule, <code>at</code> for a one-off job at a specific future time, and systemd <strong>timers</strong> as the modern, systemd-native alternative to cron.</li>
  <li><strong>This is topic 4 of the Linux module</strong>, building on filesystem navigation, permissions, and text pipelines from earlier topics. Everything here is about what happens once a program is <em>running</em> — how to see it, talk to it, and keep it alive (or stop it) reliably.</li>
</ul>
<p><strong>Mantra:</strong> "Every process has a PID and a parent; signals are how you talk to it; systemd is how you keep it running without babysitting it yourself."</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why this matters beyond "my terminal froze"</h3>
<p>Every previous topic in this module was about files sitting still on disk. The moment you run a command, compile a program, or start a server, it stops being a file and becomes a <strong>process</strong> — a program actively executing, holding memory, and (usually) doing something you care about. Understanding processes is what turns "the app is stuck, I'll just close the window" into "I can see exactly what's running, why it's using 100% CPU, and how to stop it cleanly." Concretely, this knowledge shows up constantly:</p>
<ul>
  <li><strong>Diagnosing a hung or runaway program.</strong> <code>top</code>/<code>htop</code> and <code>ps</code> tell you which process is eating CPU or memory, and its PID lets you act on it directly.</li>
  <li><strong>Freeing up a port that "won't let go."</strong> <code>lsof -i</code> tells you exactly which process is bound to a port, so you can stop it instead of guessing.</li>
  <li><strong>Keeping servers and background workers alive.</strong> Real production services (web servers, databases, queue workers) don't run in a terminal you leave open — they run as <strong>systemd services</strong>, restarted automatically on crash or reboot.</li>
  <li><strong>Debugging "why did my service not start."</strong> <code>systemctl status</code> and <code>journalctl -u</code> are the very first two commands almost every Linux engineer reaches for when something fails in production.</li>
  <li><strong>Automating recurring work.</strong> Backups, cleanup scripts, and report generation are almost always driven by <code>cron</code> or systemd timers rather than a human remembering to run them.</li>
</ul>

<h3>The process model, in one paragraph</h3>
<p>When the kernel starts a program, it creates a process: a private slice of memory, a table of open files, and — critically — a numeric identity. Every process has a <strong>PID</strong> (process ID, unique at any given moment) and a <strong>PPID</strong> (parent process ID) recording which process started it. This forms a tree: the very first process the kernel starts at boot gets PID 1 (on nearly all modern distros, this is <strong>systemd</strong>) and every other process on the system is a descendant of it, directly or indirectly. When you run a command in your shell, your shell (itself a process) becomes that command's parent.</p>

<h3>Processes vs. services — two views of the same thing</h3>
<p>A "service" isn't a fundamentally different kind of thing from a "process" — it's a process that's expected to run continuously in the background (a web server, a database, a log shipper) rather than run once and exit (like <code>ls</code>). What's different is <em>how it's managed</em>: an ad-hoc process is whatever you happen to type into a shell and watch by hand; a service is registered with <strong>systemd</strong>, which starts it automatically at boot, restarts it if it crashes, and gives you a consistent set of commands (<code>systemctl</code>) to control it and a consistent place (<code>journalctl</code>) to read its logs — regardless of what the program itself does internally.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The process tree</h3>
<p>Just as the filesystem is one tree rooted at <code>/</code>, running processes form one tree rooted at PID 1:</p>
<pre><code class="language-text">PID 1  systemd                  ← started directly by the kernel at boot
├── PID 512  sshd                 ← systemd-managed service
├── PID 900  nginx                ← systemd-managed service
│   ├── PID 901  nginx (worker)   ← child of the nginx master process
│   └── PID 902  nginx (worker)
└── PID 2200  bash                ← your login shell
    └── PID 2350  ps aux          ← the command you just ran, child of your shell
</code></pre>
<p>Every process except PID 1 has exactly one parent. When a process finishes and its parent is still alive and paying attention, the parent "reaps" it and the entry disappears from the process table. If the parent dies <em>first</em>, the kernel automatically re-parents its children to PID 1 (systemd), which reaps them — this is why an "orphaned" process isn't dangerous by itself (see Edge Cases for what genuinely goes wrong).</p>

<h3>Process states — what a process is doing right now</h3>
<p>At any instant, a process is in one of a small number of states you'll see abbreviated in <code>ps</code>/<code>top</code> output:</p>
<ul>
  <li><strong>Running / runnable (R)</strong> — actively using the CPU, or ready to as soon as it's its turn.</li>
  <li><strong>Sleeping (S)</strong> — waiting for something (input, a timer, a network response) and using no CPU in the meantime. Most processes on an idle system are here.</li>
  <li><strong>Stopped (T)</strong> — paused entirely, not running and not waiting — this is exactly the state <code>Ctrl-Z</code> puts a foreground job into.</li>
  <li><strong>Uninterruptible sleep (D)</strong> — waiting on something the kernel won't let it be interrupted out of, most commonly disk/network I/O — unlike ordinary sleeping (S), a process stuck here can't even be killed with <code>SIGKILL</code> until the underlying I/O completes.</li>
  <li><strong>Zombie (Z)</strong> — already finished executing, but its exit status hasn't been collected by its parent yet, so a small table entry lingers. Covered in depth in Edge Cases.</li>
</ul>

<h3>Signals — the universal way to talk to a running process</h3>
<p>A <strong>signal</strong> is a small, numbered interrupt sent to a process asking it to do something — stop, reload configuration, terminate, or pause. It's deliberately simple: no data payload, just a number the receiving process (or the kernel, if the process doesn't handle it) reacts to. This is the mechanism underneath <code>kill</code>, <code>Ctrl-C</code>, <code>Ctrl-Z</code>, and how <code>systemctl stop</code> ultimately asks a service to shut down. The handful you'll use constantly:</p>
<table>
  <thead><tr><th>Signal</th><th>Number</th><th>Meaning</th><th>Can the process trap/ignore it?</th></tr></thead>
  <tbody>
    <tr><td><code>SIGHUP</code></td><td>1</td><td>"Hang up" — originally the terminal disconnecting; commonly repurposed by daemons to mean "reload your config"</td><td>Yes</td></tr>
    <tr><td><code>SIGINT</code></td><td>2</td><td>Interrupt — what <code>Ctrl-C</code> sends to the foreground process</td><td>Yes</td></tr>
    <tr><td><code>SIGKILL</code></td><td>9</td><td>Terminate immediately, unconditionally — the kernel does it directly, the process never gets a say</td><td>No — never</td></tr>
    <tr><td><code>SIGTERM</code></td><td>15</td><td>"Please terminate" — the polite, default request to shut down cleanly</td><td>Yes</td></tr>
  </tbody>
</table>
<p>The single most important distinction here is <code>SIGTERM</code> vs. <code>SIGKILL</code>: <code>SIGTERM</code> is a <em>request</em> a well-behaved process can catch, and use as its cue to close files, flush data to disk, and exit gracefully; <code>SIGKILL</code> is not a request at all — the kernel simply removes the process from existence, with zero opportunity for the process to clean up anything. Always try <code>SIGTERM</code> first; reach for <code>SIGKILL</code> only when a process is well and truly stuck and ignoring everything else.</p>

<h3>Job control — one shell, multiple commands</h3>
<p>Normally a shell runs one command in the <strong>foreground</strong>, blocking until it finishes, before showing you the next prompt. Job control is the shell's system for running multiple commands at once within a single session: send a command to the <strong>background</strong> with <code>&amp;</code> so the prompt returns immediately, or suspend an already-running foreground command with <code>Ctrl-Z</code> and decide afterward whether to resume it in the foreground (<code>fg</code>) or background (<code>bg</code>). The shell tracks these as numbered <strong>jobs</strong>, separate from (but related to) their PIDs.</p>

<h3>systemd as the process supervisor</h3>
<p>Think of <strong>systemd</strong> as a manager whose job is to keep a roster of long-running programs (services) alive according to rules you declare once: start this at boot, restart it automatically if it crashes, start it only after the network is up, and so on. You interact with that manager through <code>systemctl</code> (control the roster) and read what each service has logged through <code>journalctl</code> (systemd's own centralized, structured log store — you don't need to know where a particular service happens to write its log files).</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Viewing processes: <code>ps</code>, <code>top</code>, <code>htop</code>, <code>pgrep</code></h3>
<pre><code class="language-bash"># BSD-style syntax: every process, from every user, with a "user-oriented" column set:
ps aux

# UNIX/System V-style syntax: every process, full command lines, in a "-e"/"-f" column set:
ps -ef

# Live, auto-refreshing, full-screen view of every process, sorted by CPU usage by default:
top

# A friendlier, colorized rewrite of top — scrollable, mouse-clickable, searchable
# (may need installing first, e.g. "sudo apt install htop"):
htop

# Find PIDs by matching a process's name against a pattern:
pgrep &lt;name&gt;
pgrep nginx

# List the matching PIDs together with their names:
pgrep -l &lt;name&gt;

# Match against the FULL command line (including arguments), not just the process name —
# essential when the process name itself is generic, e.g. "python" or "node":
pgrep -f &lt;pattern&gt;
pgrep -f "manage.py runserver"</code></pre>
<p><code>ps aux</code> and <code>ps -ef</code> show the same underlying information in two historically different column layouts — <code>aux</code> columns include <code>%CPU</code>, <code>%MEM</code>, and start time with a BSD-style header; <code>-ef</code> shows <code>PID</code> and <code>PPID</code> up front in a System V-style layout, which makes it the more convenient of the two when you specifically want to trace parent/child relationships. Both are one-shot snapshots — <code>top</code> (and its nicer cousin <code>htop</code>) instead refresh continuously, making them the tool of choice when you're actively hunting for whatever is currently spiking CPU or memory. <code>pgrep</code> exists so you don't have to eyeball a <code>ps</code> listing and squint for a PID — it prints matching PIDs directly, ready to feed into <code>kill</code> or a script; <code>-f</code> is the flag you'll reach for constantly, since without it <code>pgrep</code> only matches the short process name, missing anything identified by its arguments instead.</p>

<h3>Signals and killing processes: <code>kill</code>, <code>kill -9</code>, <code>killall</code>, <code>pkill -f</code></h3>
<pre><code class="language-bash"># Send the default signal, SIGTERM (15) — ask a process to shut down cleanly:
kill &lt;pid&gt;

# Send a specific signal by number or name — SIGKILL (9), unconditional, uncatchable:
kill -9 &lt;pid&gt;
kill -SIGKILL &lt;pid&gt;

# Send SIGHUP (1) — classically "reload your configuration" for many daemons:
kill -1 &lt;pid&gt;
kill -HUP &lt;pid&gt;

# Kill every process whose NAME matches exactly (not a pattern search across args):
killall &lt;name&gt;
killall nginx

# Kill every process whose FULL COMMAND LINE matches a pattern — the pkill equivalent
# of "pgrep -f", handy for scripts and one-off cleanup where the plain name isn't unique:
pkill -f &lt;pattern&gt;
pkill -f "manage.py runserver"

# pkill also accepts a signal, same as kill:
pkill -9 -f &lt;pattern&gt;</code></pre>
<p><code>kill</code> despite the name doesn't necessarily kill anything — it sends a signal, and which signal decides what happens; with no flag at all it sends <code>SIGTERM</code>, the polite default. <code>kill -9</code> is the "nuclear option" people reach for once <code>kill</code> without a flag is ignored — but remember from the Mental Model that <code>SIGKILL</code> gives the target process zero chance to clean up, so use it only once you've genuinely given <code>SIGTERM</code> a chance and the process is still stuck. <code>killall</code> operates on a process <em>name</em> across every matching instance at once (careful: on some Unix variants — not Linux — <code>killall</code> means something totally different, "kill every process on the system," so double-check you're on Linux before relying on muscle memory). <code>pkill</code> is the signal-sending sibling of <code>pgrep</code>, sharing its <code>-f</code> full-command-line matching.</p>

<h3>Job control: <code>&amp;</code>, <code>Ctrl-Z</code>, <code>jobs</code>, <code>fg</code>, <code>bg</code>, <code>nohup</code>, <code>disown</code></h3>
<pre><code class="language-bash"># Start a command in the background — the shell prints a job number and PID,
# then immediately gives you back a prompt:
&lt;cmd&gt; &amp;
sleep 300 &amp;
# [1] 4821

# Suspend the CURRENT foreground job (sends it SIGTSTP, a catchable "pause" signal —
# not the same as SIGSTOP, which can't be caught or ignored at all):
# press Ctrl-Z while a foreground command is running

# List every job tracked by THIS shell session, with its job number and state:
jobs

# Bring a suspended or backgrounded job back to the foreground (blocks the shell again):
fg %1

# Resume a suspended job, but keep it running in the background (sends SIGCONT):
bg %1

# Launch a command immune to SIGHUP from the very start — it keeps running even if
# the terminal/session that launched it closes. Output redirects to nohup.out
# by default unless you redirect it yourself:
nohup &lt;cmd&gt; &amp;
nohup ./long-running-script.sh &amp;

# Remove an already-backgrounded job from THIS shell's job table, so it survives
# the shell exiting even though you didn't start it with nohup:
disown %1
disown -a   # disown every job at once</code></pre>
<p>Job numbers (<code>%1</code>, <code>%2</code>, ...) are local to one shell session and distinct from PIDs, which are global to the whole system — <code>fg</code>/<code>bg</code> take job numbers, <code>kill</code> takes a PID (or <code>%1</code> also works with <code>kill</code>, as a convenience). The reason <code>nohup</code> and <code>disown</code> both exist, and both seem to solve "don't let my job die when I log out," is that they intervene at different moments — see Edge Cases for exactly how they differ and when each one is actually necessary.</p>

<h3>Priority: <code>nice</code>, <code>renice</code></h3>
<pre><code class="language-bash"># Start a NEW process at a specific niceness. Range is -20 (highest priority,
# most eager for CPU) to 19 (lowest priority, most willing to yield). Default is 0.
# Negative values require root/sudo; ordinary users may only raise niceness (be nicer):
nice -n &lt;value&gt; &lt;cmd&gt;
nice -n 10 ./batch-report.sh
sudo nice -n -5 ./latency-sensitive-job

# Change the niceness of an ALREADY-RUNNING process, by PID:
renice -n &lt;value&gt; -p &lt;pid&gt;
renice -n 15 -p 4821</code></pre>
<p><code>nice</code> sets a process's scheduling priority hint at launch time — it doesn't guarantee an exact share of the CPU, it just tells the kernel's scheduler how eagerly this process should compete against others for CPU time when there's contention. A higher niceness number means the process is "nicer" to everyone else — i.e., <em>lower</em> actual priority — which is the single most common point of confusion: high nice value = low priority. <code>renice</code> is the same idea applied after the fact, targeting a PID that's already running instead of a fresh command line.</p>

<h3>Resource and connection inspection: <code>free</code>, <code>uptime</code>, <code>lsof</code></h3>
<pre><code class="language-bash"># Show total, used, and free memory (RAM and swap) in human-readable units:
free -h

# Show how long the system has been running, how many users are logged in,
# and the 1/5/15-minute load averages:
uptime

# List every open file for every process — "file" in the Linux sense includes
# regular files, directories, and network sockets:
lsof

# Narrow to network connections/sockets specifically — the classic way to answer
# "what process is holding this port open?":
lsof -i
lsof -i :8080
lsof -i tcp:443</code></pre>
<p><code>free -h</code> is the quickest way to sanity-check whether a machine is actually low on memory or just using it for disk cache (Linux aggressively uses "free" RAM for caching, which <code>free -h</code>'s "available" column accounts for). <code>uptime</code>'s load averages are a rough measure of how much work is queued for the CPU over the last 1, 5, and 15 minutes — a number consistently above your core count suggests the machine is overloaded. <code>lsof</code> ("list open files") is invaluable whenever a port is stubbornly "already in use" or a file can't be unmounted/deleted because something still has it open — <code>lsof -i :8080</code> immediately tells you the PID and command name bound to that port, which you can then feed straight into <code>kill</code>.</p>

<h3>Services: <code>systemctl</code></h3>
<pre><code class="language-bash"># Start a service right now (does NOT make it start automatically on future boots):
systemctl start &lt;svc&gt;
sudo systemctl start nginx

# Stop a running service right now:
systemctl stop &lt;svc&gt;
sudo systemctl stop nginx

# Stop then start again in one step — the normal way to apply a config change:
systemctl restart &lt;svc&gt;
sudo systemctl restart nginx

# Make a service start automatically at every future boot (does NOT start it now):
systemctl enable &lt;svc&gt;
sudo systemctl enable nginx

# Enable AND start in one command — the common combo when first setting a service up:
systemctl enable --now &lt;svc&gt;

# Show whether a service is active, since when, its PID, recent log lines,
# and whether it's enabled to start on boot:
systemctl status &lt;svc&gt;
systemctl status nginx</code></pre>
<p><code>systemctl</code> is (note: this is <strong>systemd-specific</strong> — other init systems like OpenRC or the older SysV init use different commands entirely, though systemd is the default on the large majority of modern distros including Ubuntu, Debian, Fedora, and RHEL). The load-bearing distinction is <strong>start vs. enable</strong>, covered in depth in Edge Cases: one affects right now, the other affects every future boot, and they're independent of each other.</p>

<h3>Reading service logs: <code>journalctl</code></h3>
<pre><code class="language-bash"># Show every log entry recorded for one specific systemd unit:
journalctl -u &lt;svc&gt;
journalctl -u nginx

# Follow a unit's logs live, the journalctl equivalent of "tail -f":
journalctl -u &lt;svc&gt; -f
journalctl -u nginx -f

# Combine with -e to jump to the end, or -n &lt;N&gt; to see just the last N lines:
journalctl -u nginx -n 50</code></pre>
<p><code>journalctl</code> reads from systemd's centralized structured log store (the "journal"), so <code>-u &lt;svc&gt;</code> works identically for any systemd-managed service regardless of where — or whether — that program also writes its own separate log files. This, together with <code>systemctl status</code>, is the standard first move whenever a service fails to start: <code>status</code> gives you the immediate summary and last few lines, <code>journalctl -u &lt;svc&gt;</code> gives you the full history to scroll or search through.</p>

<h3>Scheduling: <code>crontab -e</code>, <code>at</code>, systemd timers</h3>
<pre><code class="language-bash"># Open YOUR crontab in an editor to add/edit recurring scheduled jobs:
crontab -e

# List your current crontab without editing it:
crontab -l

# Each line is: minute hour day-of-month month day-of-week   command
#                (0-59) (0-23)   (1-31)     (1-12)  (0-7, both 0 and 7 = Sunday)
# Run a backup script every day at 2:30 AM:
30 2 * * * /home/alice/scripts/backup.sh

# Run every 15 minutes, any hour/day/month/weekday ("*" means "every"):
*/15 * * * * /home/alice/scripts/healthcheck.sh

# Run at 9:00 AM every Monday only:
0 9 * * 1 /home/alice/scripts/weekly-report.sh

# Schedule a ONE-OFF job for a specific future time (reads the command from
# stdin; type your command(s), then Ctrl-D to finish):
at &lt;time&gt;
at 5pm
at now + 1 hour
at 10:00 tomorrow

# List queued 'at' jobs / remove one by its job number:
atq
atrm &lt;job-number&gt;</code></pre>
<p>Cron's five fields, in order, are always minute, hour, day-of-month, month, day-of-week — a common gotcha is that day-of-month and day-of-week are both present, and when <em>both</em> are restricted (given a value other than <code>*</code>), standard Linux cron (Vixie-cron/cronie) always ORs them together, not ANDs: <code>0 0 1 * 1</code> runs at midnight on the 1st of the month <em>or</em> any Monday — not only when the 1st happens to fall on a Monday. If you only mean to restrict one of the two, leave the other as <code>*</code> to sidestep the OR behavior entirely. <code>at</code> is the tool for "run this once, at this specific future time" — the one-shot counterpart to cron's recurring schedule.</p>
<p><strong>systemd timers</strong> are the systemd-native alternative to cron: a <code>.timer</code> unit (defining the schedule, e.g. <code>OnCalendar=daily</code>) is paired with a same-named <code>.service</code> unit (defining what actually runs), and the timer is controlled with the same <code>systemctl enable --now &lt;name&gt;.timer</code> you'd use for any other service. The trade-off versus cron: timers integrate with the rest of systemd — you get the same logging via <code>journalctl -u &lt;name&gt;.timer</code> and dependency ordering — at the cost of more verbose setup (two unit files instead of one crontab line). Catch-up for a run missed while the machine was off is <em>not</em> automatic: it only happens if the <code>.timer</code> unit sets <code>Persistent=true</code>, which defaults to <code>false</code>, and even then it fires the missed job once on the next boot rather than once per interval that was missed. For a single personal cron job, <code>crontab -e</code> is usually still the faster path; for anything shipped as part of a systemd-managed service, a timer keeps everything in one consistent system.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Worked Examples', html: `
<h3>Example 1 — Find and stop a stuck process, gracefully then forcefully</h3>
<pre><code class="language-bash">ps aux | grep node
# alice   4821  98.0  2.1  ...   node server.js
# (98% CPU — clearly stuck)

pgrep -f "node server.js"
# 4821

kill 4821
# sends SIGTERM — the polite request

ps aux | grep 4821
# alice   4821  97.5  2.1  ...   node server.js
# (still running a few seconds later — it's ignoring SIGTERM)

kill -9 4821
# sends SIGKILL — unconditional, no cleanup possible

ps aux | grep 4821
# (no output — it's gone)</code></pre>
<p>This is the standard escalation path: identify the PID, ask nicely with plain <code>kill</code> (SIGTERM), give it a moment, and only reach for <code>kill -9</code> (SIGKILL) once it's clearly not responding — never skip straight to <code>-9</code> for a process you haven't tried terminating cleanly first, since that also skips any cleanup the process would otherwise have done (closing files, flushing writes, releasing locks).</p>

<h3>Example 2 — Background a long job, then detach it from the terminal</h3>
<pre><code class="language-bash">./long-running-backup.sh &amp;
# [1] 5120

jobs
# [1]+  Running    ./long-running-backup.sh &amp;

disown %1
# job removed from this shell's table — it will now survive this shell closing

exit
# (later, from a fresh terminal, confirm it's still alive)
ps aux | grep long-running-backup
# alice   5120  1.5  0.3  ...  ./long-running-backup.sh
# (still running, now reparented to PID 1)</code></pre>
<p>Note this only works because the job was <em>already</em> tolerant of losing its terminal by the time <code>disown</code> ran — if the script itself would have crashed on SIGHUP (some don't), you'd want <code>nohup ./long-running-backup.sh &amp;</code> from the very start instead. See Edge Cases for exactly when each tool is the right one.</p>

<h3>Example 3 — Diagnose why a systemd service won't start</h3>
<pre><code class="language-bash">sudo systemctl start myapp
# Job for myapp.service failed because the control process exited with error code.
# See "systemctl status myapp.service" and "journalctl -xe" for details.

systemctl status myapp
# ● myapp.service - My Application
#      Loaded: loaded (/etc/systemd/system/myapp.service; enabled)
#      Active: failed (Result: exit-code) since ...
#     Process: 6001 ExecStart=/opt/myapp/run.sh (code=exited, status=1/FAILURE)

journalctl -u myapp -n 50
# ... myapp.service: Failed to open config file /etc/myapp/config.yml: No such file or directory
# ... myapp.service: Main process exited, code=exited, status=1/FAILURE
# ... myapp.service: Failed with result 'exit-code'.

# Fix the underlying issue (create the missing config file), then:
sudo systemctl restart myapp
systemctl status myapp
# ● myapp.service - My Application
#      Active: active (running) since ...</code></pre>
<p>This is the exact sequence to reach for whenever a service fails: <code>systemctl start</code> (or a failed boot) surfaces the failure, <code>systemctl status</code> gives an immediate summary including the last few relevant log lines, and <code>journalctl -u &lt;svc&gt;</code> gives the full scrollable history when the summary alone isn't enough to pinpoint the cause.</p>

<h3>Example 4 — Schedule a recurring cleanup job with cron</h3>
<pre><code class="language-bash">crontab -e
# opens your crontab in the configured editor; add a line, save, quit

# Delete files older than 7 days from /tmp/app-cache every day at 3:15 AM:
15 3 * * * find /tmp/app-cache -type f -mtime +7 -delete

crontab -l
# 15 3 * * * find /tmp/app-cache -type f -mtime +7 -delete
# (confirms it was saved)</code></pre>
<p>Once saved, cron itself (a daemon started by systemd) runs this line every day at 3:15 regardless of whether you're logged in — the entire point of scheduling it this way instead of remembering to run it by hand.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '⚠️ Edge Cases', html: `
<h3><code>SIGKILL</code> can never be trapped, blocked, or cleaned up after</h3>
<p>Every other signal covered here — <code>SIGTERM</code>, <code>SIGINT</code>, <code>SIGHUP</code> — can be intercepted by a process's own code (a "signal handler") to run cleanup logic, or even ignored entirely. <code>SIGKILL</code> is special-cased by the kernel itself: it's delivered by removing the process from existence directly, bypassing the process's own code completely. This is exactly why it's the last resort, not the first: a database killed with <code>SIGTERM</code> gets a chance to flush its write cache to disk; the same database killed with <code>SIGKILL</code> does not, and may need to run crash recovery on its next start.</p>

<h3>Zombie process vs. orphan process — easy to mix up, genuinely different</h3>
<p>A <strong>zombie</strong> (state <code>Z</code> in <code>ps</code>) is a process that has already finished running, but whose exit status hasn't yet been read ("reaped") by its parent — it's not consuming CPU or memory beyond a small table entry, but it lingers until the parent calls the appropriate cleanup. A process that spawns many children and never reaps any of them accumulates zombies over time; this is a bug in the parent, not the zombie itself. An <strong>orphan</strong> is the opposite direction: a process whose <em>parent</em> died first, while the child is still very much alive and running. The kernel automatically re-parents orphans to PID 1 (systemd), which reaps them the instant they finish — so an orphan is generally harmless and self-resolving, while an accumulation of zombies is a sign of a genuine bug worth investigating (typically fixed on the parent's side, or by killing the parent so its zombies get reparented to systemd and reaped).</p>

<h3><code>nohup</code> vs. <code>disown</code> — same goal, different moment</h3>
<p>Both exist to answer "keep my background job running after I log out or close the terminal," and both work by dealing with <code>SIGHUP</code> (the signal a terminal/session sends to its children when it closes) — but they intervene at different points:</p>
<ul>
  <li><strong><code>nohup</code></strong> is applied when you <em>launch</em> the command — <code>nohup &lt;cmd&gt; &amp;</code> — and makes the process itself ignore <code>SIGHUP</code> for its entire life, plus redirects its output to <code>nohup.out</code> by default (since the terminal that would have displayed it may no longer exist). Use it whenever you know in advance you'll want a command to survive the session ending.</li>
  <li><strong><code>disown</code></strong> is applied <em>after the fact</em>, to a job that's already running in the background of the current shell — it simply removes that job from the shell's own job table so the shell doesn't send it <code>SIGHUP</code> when the shell itself exits. It doesn't touch the process's signal handling or its output — if the process wasn't already tolerant of <code>SIGHUP</code>, or was writing output to a now-gone terminal, <code>disown</code> alone won't fix that.</li>
</ul>
<p>Rule of thumb: reach for <code>nohup</code> before starting something you know is long-running; reach for <code>disown</code> when you forgot and the job is already backgrounded.</p>

<h3><code>systemctl enable</code> vs. <code>systemctl start</code> — "on boot" vs. "right now" are independent</h3>
<p>These two flags control two completely separate things, and mixing them up is one of the most common systemd mistakes:</p>
<ul>
  <li><code>systemctl start &lt;svc&gt;</code> runs the service <strong>right now</strong>, for this uptime only. If the machine reboots, it does <em>not</em> come back automatically.</li>
  <li><code>systemctl enable &lt;svc&gt;</code> creates the symlinks that make the service start automatically on <strong>every future boot</strong> — but it does not start it now; right after running just <code>enable</code>, the service is still not running until the next boot (or until you also run <code>start</code>).</li>
</ul>
<p>They're independent in both directions: a service can be started-but-not-enabled (runs now, won't survive a reboot — common for one-off manual testing), or enabled-but-not-started (will come up on the next boot, but isn't running yet). <code>systemctl enable --now &lt;svc&gt;</code> does both at once, which is what you want the overwhelming majority of the time when setting up a real service.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'cheat-sheet', title: '📋 Cheat Sheet', html: `
<table>
  <thead><tr><th>Command</th><th>Purpose</th><th>Key flags / notes</th></tr></thead>
  <tbody>
    <tr><td><code>ps aux</code></td><td>Snapshot of every process, BSD-style columns</td><td><code>%CPU</code>/<code>%MEM</code>/start time included</td></tr>
    <tr><td><code>ps -ef</code></td><td>Snapshot of every process, System V-style columns</td><td>shows <code>PID</code>/<code>PPID</code> up front</td></tr>
    <tr><td><code>top</code></td><td>Live, auto-refreshing process view</td><td>sorted by CPU by default</td></tr>
    <tr><td><code>htop</code></td><td>Friendlier live process view</td><td>scrollable, colorized; may need install</td></tr>
    <tr><td><code>pgrep</code></td><td>Find PIDs by name/pattern</td><td><code>-f</code> match full command line · <code>-l</code> include name</td></tr>
    <tr><td><code>kill</code></td><td>Send a signal to a PID (default: SIGTERM)</td><td><code>-9</code>/<code>-SIGKILL</code> · <code>-1</code>/<code>-HUP</code></td></tr>
    <tr><td><code>killall</code></td><td>Signal every process matching an exact NAME</td><td>Linux-specific meaning; differs on other Unixes</td></tr>
    <tr><td><code>pkill</code></td><td>Signal every process matching a pattern</td><td><code>-f</code> match full command line</td></tr>
    <tr><td>Signals</td><td><code>SIGHUP</code>=1 reload/hangup · <code>SIGINT</code>=2 Ctrl-C · <code>SIGKILL</code>=9 uncatchable kill · <code>SIGTERM</code>=15 polite default</td><td>only SIGKILL and SIGSTOP can't be caught/trapped</td></tr>
    <tr><td><code>cmd &amp;</code></td><td>Run a command in the background</td><td>shell returns a job number + PID</td></tr>
    <tr><td><code>Ctrl-Z</code></td><td>Suspend the current foreground job</td><td>sends SIGTSTP (catchable)</td></tr>
    <tr><td><code>jobs</code></td><td>List this shell's background/suspended jobs</td><td>—</td></tr>
    <tr><td><code>fg</code> / <code>bg</code></td><td>Resume a job in foreground / background</td><td><code>%1</code> targets job number 1</td></tr>
    <tr><td><code>nohup</code></td><td>Launch a command immune to SIGHUP from the start</td><td>output → <code>nohup.out</code> by default</td></tr>
    <tr><td><code>disown</code></td><td>Detach an already-running job from this shell</td><td><code>-a</code> disown all jobs</td></tr>
    <tr><td><code>nice -n &lt;v&gt;</code></td><td>Launch a new process at a given niceness</td><td>-20 (highest priority) to 19 (lowest); default 0</td></tr>
    <tr><td><code>renice -n &lt;v&gt; -p &lt;pid&gt;</code></td><td>Change niceness of a running process</td><td>negative values need root</td></tr>
    <tr><td><code>free -h</code></td><td>Show memory/swap usage, human-readable</td><td>—</td></tr>
    <tr><td><code>uptime</code></td><td>Show uptime, users, load averages</td><td>1/5/15-minute averages</td></tr>
    <tr><td><code>lsof</code></td><td>List open files for all processes</td><td><code>-i</code> network sockets · <code>-i :&lt;port&gt;</code> one port</td></tr>
    <tr><td><code>systemctl start/stop/restart</code></td><td>Control a service right now</td><td>systemd-specific; not persisted across boot</td></tr>
    <tr><td><code>systemctl enable</code></td><td>Make a service start on future boots</td><td>doesn't start it now · <code>--now</code> does both</td></tr>
    <tr><td><code>systemctl status</code></td><td>Show state + recent logs for a service</td><td>first stop when a service misbehaves</td></tr>
    <tr><td><code>journalctl -u &lt;svc&gt;</code></td><td>Show all logs for one systemd unit</td><td><code>-f</code> follow live · <code>-n &lt;N&gt;</code> last N lines</td></tr>
    <tr><td><code>crontab -e</code></td><td>Edit your recurring scheduled jobs</td><td>5 fields: min hour dom month dow · <code>-l</code> to list</td></tr>
    <tr><td><code>at</code></td><td>Schedule a one-off job for a future time</td><td><code>atq</code> list queued · <code>atrm</code> remove</td></tr>
    <tr><td>systemd timers</td><td>systemd-native recurring scheduling</td><td><code>.timer</code> unit paired with a <code>.service</code> unit</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">What's the difference between <code>SIGTERM</code> and <code>SIGKILL</code>, and which should you send first?</div>
<div class="qa-a">
<p><code>SIGTERM</code> (signal 15, the default for plain <code>kill</code>) is a polite <em>request</em> to terminate — a well-behaved process can catch it, run its own cleanup (closing files, flushing buffered writes, releasing locks), and exit on its own terms. <code>SIGKILL</code> (signal 9, <code>kill -9</code>) is not a request at all: the kernel removes the process from existence directly, and the process's own code never runs, so it gets zero chance to clean up. You should always try <code>SIGTERM</code> first and only escalate to <code>SIGKILL</code> once you've confirmed the process is genuinely unresponsive to it — skipping straight to <code>-9</code> risks corrupted state or lost data for anything that would otherwise have cleaned up gracefully.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Walk through what happens when you background a job with <code>&amp;</code> and then close your terminal.</div>
<div class="qa-a">
<p>Running <code>&lt;cmd&gt; &amp;</code> starts the process, returns control of the shell to you immediately, and registers it as a numbered job in that shell's job table. By default, if you close the terminal (or the shell session ends), the shell sends <code>SIGHUP</code> to every job it started, including backgrounded ones — which typically terminates them unless something intervenes. Two ways to prevent that: launch with <code>nohup &lt;cmd&gt; &amp;</code> from the start, which makes the process ignore <code>SIGHUP</code> for its whole life and redirects its output to <code>nohup.out</code>; or, for a job that's already running, run <code>disown %1</code>, which removes it from the shell's job table so the shell won't send it <code>SIGHUP</code> in the first place. They solve the same problem at different points in the job's life — <code>nohup</code> up front, <code>disown</code> after the fact.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">A systemd service fails to start. How do you find out why?</div>
<div class="qa-a">
<p>Start with <code>systemctl status &lt;svc&gt;</code> — it shows whether the unit is active/failed, the exit code of its main process, and the last several relevant log lines, which is often enough on its own. When you need more context, <code>journalctl -u &lt;svc&gt;</code> shows the complete log history for that specific unit from systemd's centralized journal (add <code>-f</code> to follow it live while you retry, or <code>-n 50</code> to see just the last 50 lines). This two-step check — <code>status</code> for the quick summary, <code>journalctl -u</code> for the full history — is the standard first move for any failing service, regardless of what the service itself actually does.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Explain cron syntax and give an example of running a job every day at 2:30 AM.</div>
<div class="qa-a">
<p>A crontab line has five time/date fields, in fixed order — minute (0-59), hour (0-23), day-of-month (1-31), month (1-12), day-of-week (0-7, where both 0 and 7 mean Sunday) — followed by the command to run. An asterisk in any field means "every value of this field." So <code>30 2 * * * /path/to/backup.sh</code> means minute 30, hour 2, every day of every month on every weekday — i.e., 2:30 AM daily. You edit your own crontab with <code>crontab -e</code> and can list it without editing via <code>crontab -l</code>. For jobs that need systemd integration (dependency ordering, consistent logging via <code>journalctl</code>) rather than a plain per-user schedule, a systemd timer paired with a service unit is the modern alternative.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between a zombie process and an orphan process?</div>
<div class="qa-a">
<p>A zombie is a process that has already <em>finished executing</em> but whose exit status hasn't yet been read by its parent, so a small entry lingers in the process table (shown as state <code>Z</code>) until the parent reaps it — it isn't consuming real resources, and a buildup of zombies points to a bug in the parent process not cleaning up after its children. An orphan is the reverse situation: the process is still very much alive and running, but its <em>parent</em> has already died; the kernel automatically re-parents it to PID 1 (systemd), which will reap it normally once it eventually finishes. In short: zombie = dead child, parent hasn't noticed yet; orphan = live child, parent is already gone.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q"><code>systemctl enable</code> vs. <code>systemctl start</code> — what's the difference, and why might you need both?</div>
<div class="qa-a">
<p><code>systemctl start &lt;svc&gt;</code> runs the service immediately, for the current uptime only — it does not persist across a reboot. <code>systemctl enable &lt;svc&gt;</code> configures the service to start automatically on every <em>future</em> boot, but by itself doesn't start it right now. They're independent: a service can be running-but-not-enabled (won't survive a reboot) or enabled-but-not-running (will come up next boot, but isn't up yet). When setting up a new service for real (not just testing), you typically want both, which is exactly what the combined shortcut <code>systemctl enable --now &lt;svc&gt;</code> does in one step.</p>
</div>
</div>
`}

]});
