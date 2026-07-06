window.PREP_SITE.registerTopic({
  id: 'linux-command-reference',
  module: 'linux',
  title: 'Command Reference',
  estimatedReadTime: '15 min',
  tags: ['linux', 'cli', 'reference', 'cheat-sheet'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>This is a <strong>reference</strong>, not a lesson — a single scannable lookup for every command taught across the six Linux teaching topics (Fundamentals &amp; Navigation, Files/Permissions/Users, Text Processing &amp; Pipelines, Processes/Jobs/Services, Shell Scripting, and Networking/Packages/Sysadmin). Nothing here is new; it's the same commands, flags, and examples from those topics, aggregated into one place organized by category instead of by lesson.</p>
<ul>
  <li><strong>How to use it:</strong> scan the category table for the command you half-remember, check its <em>Key flags</em> column for the specific option you need, and copy the <em>Example</em> column as a starting point. If you need the "why" behind a command — the mental model, the edge cases, the interview framing — that lives in the corresponding teaching topic, not here.</li>
  <li><strong>Six categories, one table each:</strong> 📁 File &amp; Navigation, 🔒 Permissions &amp; Users, ✂️ Text &amp; Pipelines, ⚙️ Processes &amp; Services, 📜 Shell Scripting, 🌐 Networking &amp; Packages.</li>
  <li><strong>Placeholders</strong> like <code>&lt;file&gt;</code>, <code>&lt;dir&gt;</code>, <code>&lt;pid&gt;</code>, or <code>&lt;pattern&gt;</code> in the Example column stand in for whatever you'd actually type — a real filename, process ID, or search term.</li>
</ul>
<p><strong>Mantra:</strong> "Don't memorize this page — memorize where to find it."</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'ref-files', title: '📁 File & Navigation', html: `
<table>
  <thead><tr><th>Command</th><th>Purpose</th><th>Key flags</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td><code>pwd</code></td><td>Print the absolute path of the current directory</td><td>—</td><td><code>pwd</code></td></tr>
    <tr><td><code>ls</code></td><td>List directory contents</td><td><code>-l</code> long format · <code>-a</code> include hidden · <code>-h</code> human-readable sizes · <code>-t</code> sort by mtime · <code>-R</code> recursive</td><td><code>ls -la &lt;dir&gt;</code></td></tr>
    <tr><td><code>cd</code></td><td>Change the current directory</td><td><code>~</code> home · <code>-</code> previous dir · <code>..</code> parent dir · no arg = home</td><td><code>cd &lt;dir&gt;</code></td></tr>
    <tr><td><code>mkdir</code></td><td>Create a new directory</td><td><code>-p</code> create missing parent dirs too</td><td><code>mkdir -p &lt;dir&gt;/&lt;subdir&gt;</code></td></tr>
    <tr><td><code>rmdir</code></td><td>Remove an empty directory</td><td>fails if not empty</td><td><code>rmdir &lt;dir&gt;</code></td></tr>
    <tr><td><code>touch</code></td><td>Create an empty file, or update a file's timestamp</td><td>—</td><td><code>touch &lt;file&gt;</code></td></tr>
    <tr><td><code>cp</code></td><td>Copy a file (or directory tree)</td><td><code>-r</code> recursive, required for directories</td><td><code>cp -r &lt;source-dir&gt; &lt;destination-dir&gt;</code></td></tr>
    <tr><td><code>mv</code></td><td>Move or rename a file/directory</td><td>same command does both move and rename</td><td><code>mv &lt;old-name&gt; &lt;new-name&gt;</code></td></tr>
    <tr><td><code>ln</code></td><td>Create a link to an existing file</td><td><code>-s</code> symbolic/soft link (points by path) · no flag = hard link (same inode)</td><td><code>ln -s &lt;target&gt; &lt;linkname&gt;</code></td></tr>
    <tr><td><code>rm</code></td><td>Delete a file (or directory tree)</td><td><code>-r</code> recursive · <code>-f</code> force, no prompts · <code>-rf</code> together = irreversible, no undo</td><td><code>rm -rf &lt;dir&gt;</code></td></tr>
    <tr><td><code>cat</code></td><td>Print an entire file's contents to the screen</td><td>best for short files</td><td><code>cat &lt;file&gt;</code></td></tr>
    <tr><td><code>less</code></td><td>Page through a file's contents interactively</td><td><code>/</code> search · <code>n</code> next match · <code>q</code> quit</td><td><code>less &lt;file&gt;</code></td></tr>
    <tr><td><code>more</code></td><td>Page through a file's contents, forward only</td><td>Space next page · <code>q</code> quit · superseded by <code>less</code></td><td><code>more &lt;file&gt;</code></td></tr>
    <tr><td><code>head</code></td><td>Show the first lines of a file</td><td><code>-n &lt;N&gt;</code> number of lines (default 10)</td><td><code>head -n 20 &lt;file&gt;</code></td></tr>
    <tr><td><code>tail</code></td><td>Show the last lines of a file</td><td><code>-n &lt;N&gt;</code> number of lines · <code>-f</code> follow live updates</td><td><code>tail -f &lt;file&gt;</code></td></tr>
    <tr><td><code>file</code></td><td>Identify a file's actual type by its content</td><td>—</td><td><code>file &lt;file&gt;</code></td></tr>
    <tr><td><code>stat</code></td><td>Show detailed file metadata (size, timestamps, inode)</td><td>—</td><td><code>stat &lt;file&gt;</code></td></tr>
    <tr><td><code>tree</code></td><td>Show a directory's contents as an indented tree</td><td>may need separate install</td><td><code>tree &lt;dir&gt;</code></td></tr>
    <tr><td><code>man</code></td><td>Open a command's full manual page</td><td><code>q</code> to quit</td><td><code>man &lt;command&gt;</code></td></tr>
    <tr><td><code>--help</code></td><td>Print a command's built-in quick option summary</td><td>append to almost any command</td><td><code>ls --help</code></td></tr>
    <tr><td><code>apropos</code></td><td>Search manual page descriptions by keyword</td><td>use when you don't know the command name</td><td><code>apropos "copy files"</code></td></tr>
    <tr><td><code>whatis</code></td><td>Print a command's one-line description</td><td>use when you already know the command name</td><td><code>whatis &lt;command&gt;</code></td></tr>
    <tr><td><code>which</code></td><td>Show the path to the program that would run</td><td>external commands only</td><td><code>which &lt;command&gt;</code></td></tr>
    <tr><td><code>type</code></td><td>Show how a command name resolves (builtin/alias/function/file)</td><td>more complete than <code>which</code></td><td><code>type cd</code></td></tr>
    <tr><td><code>history</code></td><td>List recently run commands, numbered</td><td>—</td><td><code>history</code></td></tr>
    <tr><td><code>clear</code></td><td>Clear the terminal screen</td><td>scrollback is preserved, just scrolled away</td><td><code>clear</code></td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'ref-permissions', title: '🔒 Permissions & Users', html: `
<table>
  <thead><tr><th>Command</th><th>Purpose</th><th>Key flags</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td><code>ls -l</code> / <code>ls -li</code></td><td>Show permissions, owner, group, size, date for each entry</td><td><code>-li</code> also shows inode number (hard-link count is already shown by plain <code>-l</code>)</td><td><code>ls -l &lt;file&gt;</code></td></tr>
    <tr><td><code>chmod</code></td><td>Change a file's read/write/execute permissions</td><td>numeric: <code>755</code>/<code>644</code>/<code>600</code> · symbolic: <code>u/g/o/a</code> + <code>+/-/=</code> + <code>r/w/x</code> · <code>-R</code> recursive</td><td><code>chmod 600 ~/.ssh/id_rsa</code></td></tr>
    <tr><td><code>umask</code></td><td>Show or set the default permission mask for new files/dirs</td><td>no arg = show current · e.g. <code>umask 022</code></td><td><code>umask 022</code></td></tr>
    <tr><td><code>chown</code></td><td>Change a file's owning user (and optionally group)</td><td><code>user:group</code> sets both · <code>-R</code> recursive</td><td><code>chown &lt;user&gt;:&lt;group&gt; &lt;file&gt;</code></td></tr>
    <tr><td><code>chgrp</code></td><td>Change a file's owning group only</td><td><code>-R</code> recursive</td><td><code>chgrp &lt;group&gt; &lt;file&gt;</code></td></tr>
    <tr><td><code>whoami</code></td><td>Print the current username</td><td>—</td><td><code>whoami</code></td></tr>
    <tr><td><code>id</code></td><td>Print UID, GID, and all group memberships</td><td>—</td><td><code>id</code></td></tr>
    <tr><td><code>groups</code></td><td>Print the group names a user belongs to</td><td>optional <code>&lt;user&gt;</code> arg for another user</td><td><code>groups &lt;user&gt;</code></td></tr>
    <tr><td><code>useradd</code></td><td>Create a new user account</td><td><code>-m</code> also create home directory · needs sudo</td><td><code>sudo useradd -m &lt;user&gt;</code></td></tr>
    <tr><td><code>usermod</code></td><td>Modify an existing user account</td><td><code>-aG &lt;group&gt;</code> append to a group (never omit <code>-a</code>)</td><td><code>sudo usermod -aG &lt;group&gt; &lt;user&gt;</code></td></tr>
    <tr><td><code>passwd</code></td><td>Set or change a user's password</td><td>no arg = your own · <code>&lt;user&gt;</code> = another (needs sudo)</td><td><code>sudo passwd &lt;user&gt;</code></td></tr>
    <tr><td><code>sudo</code></td><td>Run one command with root privileges</td><td><code>-i</code>/<code>-s</code> standing root shell · uses your own password</td><td><code>sudo apt update</code></td></tr>
    <tr><td><code>su</code></td><td>Switch to another user's (or root's) login shell</td><td><code>su -</code> switch to root · uses the target user's password</td><td><code>su -</code></td></tr>
    <tr><td><code>find</code></td><td>Recursively search a directory tree with filters</td><td><code>-name</code>/<code>-iname</code> · <code>-type f/d/l</code> · <code>-mtime ±N</code> · <code>-size ±N[kMG]</code> · <code>-exec ... {} \\;</code> or <code>+</code></td><td><code>find . -name "*.log" -mtime -7</code></td></tr>
    <tr><td><code>locate</code></td><td>Fast filename search against a prebuilt index</td><td>results may be stale until next <code>updatedb</code> run</td><td><code>locate nginx.conf</code></td></tr>
    <tr><td><code>updatedb</code></td><td>Rebuild the <code>locate</code> filename index</td><td>needs sudo · usually scheduled automatically</td><td><code>sudo updatedb</code></td></tr>
    <tr><td>Globs</td><td>Shell-expanded filename patterns</td><td><code>*</code> any chars · <code>?</code> one char · <code>[abc]</code>/<code>[0-9]</code> one of a set · <code>{a,b}</code> brace expansion (literal, not disk-matched)</td><td><code>ls *.txt</code></td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'ref-text', title: '✂️ Text & Pipelines', html: `
<table>
  <thead><tr><th>Command</th><th>Purpose</th><th>Key flags</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td><code>&gt;</code></td><td>Redirect stdout to a file, overwriting it</td><td>truncates the file first</td><td><code>ls -l &gt; listing.txt</code></td></tr>
    <tr><td><code>&gt;&gt;</code></td><td>Redirect stdout to a file, appending</td><td>never truncates</td><td><code>echo "entry" &gt;&gt; log.txt</code></td></tr>
    <tr><td><code>&lt;</code></td><td>Redirect a file's contents in as stdin</td><td>—</td><td><code>sort &lt; names.txt</code></td></tr>
    <tr><td><code>2&gt;</code></td><td>Redirect stderr only, to a file</td><td>fd 2</td><td><code>&lt;command&gt; 2&gt; errors.log</code></td></tr>
    <tr><td><code>2&gt;&amp;1</code></td><td>Point stderr at wherever stdout currently points</td><td>order-sensitive — put after <code>&gt; file</code></td><td><code>&lt;command&gt; &gt; out.log 2&gt;&amp;1</code></td></tr>
    <tr><td><code>&amp;&gt;</code></td><td>Redirect both stdout and stderr to one file</td><td>bash/zsh extension, not POSIX sh</td><td><code>&lt;command&gt; &amp;&gt; combined.log</code></td></tr>
    <tr><td><code>/dev/null</code></td><td>Discard anything written to it</td><td>bottomless — writes always "succeed"</td><td><code>&lt;command&gt; &gt; /dev/null 2&gt;&amp;1</code></td></tr>
    <tr><td><code>|</code></td><td>Pipe: connect one command's stdout to the next command's stdin</td><td>does not carry stderr</td><td><code>cat access.log | grep "ERROR"</code></td></tr>
    <tr><td><code>tee</code></td><td>Write a stream to a file AND pass it through unchanged</td><td><code>-a</code> append instead of overwrite</td><td><code>ls -l | tee listing.txt</code></td></tr>
    <tr><td><code>grep</code></td><td>Print lines matching a pattern</td><td><code>-i</code> case-insensitive · <code>-v</code> invert · <code>-n</code> line numbers · <code>-r</code> recursive · <code>-E</code> extended regex · <code>-o</code> matched text only · <code>-c</code> count · <code>-F</code> fixed string</td><td><code>grep -rin "todo" src/</code></td></tr>
    <tr><td><code>sed</code></td><td>Stream-edit lines: substitute or delete</td><td><code>s/x/y/g</code> substitute (all with <code>g</code>) · <code>-i</code> edit in place · <code>/pat/d</code> delete matching lines</td><td><code>sed -i 's/foo/bar/g' config.txt</code></td></tr>
    <tr><td><code>awk</code></td><td>Field-aware processing / small pattern-action language</td><td><code>{print $1}</code> print field · <code>-F</code> field separator · <code>/pat/ {…}</code> conditional action · <code>NR</code>/<code>NF</code></td><td><code>awk -F: '{print $1}' /etc/passwd</code></td></tr>
    <tr><td><code>sort</code></td><td>Reorder lines</td><td><code>-n</code> numeric · <code>-r</code> reverse · <code>-k</code> sort by field · <code>-u</code> unique (sorts, then dedupes)</td><td><code>sort -k2,2n data.txt</code></td></tr>
    <tr><td><code>uniq</code></td><td>Collapse adjacent duplicate lines</td><td><code>-c</code> prefix with count · requires pre-sorted input for non-adjacent duplicates</td><td><code>sort names.txt | uniq -c</code></td></tr>
    <tr><td><code>wc</code></td><td>Count lines/words/bytes</td><td><code>-l</code> lines · <code>-w</code> words · <code>-c</code> bytes</td><td><code>grep "ERROR" app.log | wc -l</code></td></tr>
    <tr><td><code>cut</code></td><td>Extract columns by a fixed delimiter</td><td><code>-d</code> delimiter · <code>-f</code> field number(s)/range</td><td><code>cut -d: -f1 /etc/passwd</code></td></tr>
    <tr><td><code>tr</code></td><td>Translate, delete, or squeeze characters</td><td><code>-d</code> delete · <code>-s</code> squeeze repeats · stdin only, no filename args</td><td><code>tr 'a-z' 'A-Z' &lt; file.txt</code></td></tr>
    <tr><td><code>paste</code></td><td>Merge lines of files side by side</td><td><code>-d</code> custom delimiter (default TAB)</td><td><code>paste -d',' names.txt scores.txt</code></td></tr>
    <tr><td><code>join</code></td><td>Relational join of two files on a common field</td><td><code>-t</code> delimiter · both inputs must be sorted</td><td><code>join ids.txt names.txt</code></td></tr>
    <tr><td><code>comm</code></td><td>Compare two sorted files: unique-to-1 / unique-to-2 / common</td><td><code>-1 -2 -3</code> suppress a column · both inputs must be sorted</td><td><code>comm -12 &lt;file1&gt; &lt;file2&gt;</code></td></tr>
    <tr><td><code>xargs</code></td><td>Turn stdin lines into arguments for another command</td><td><code>-I{}</code> placeholder, one invocation per line</td><td><code>find . -name "*.tmp" | xargs -I{} rm {}</code></td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'ref-processes', title: '⚙️ Processes & Services', html: `
<table>
  <thead><tr><th>Command</th><th>Purpose</th><th>Key flags</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td><code>ps aux</code></td><td>Snapshot of every process, BSD-style columns</td><td><code>%CPU</code>/<code>%MEM</code>/start time included</td><td><code>ps aux | grep node</code></td></tr>
    <tr><td><code>ps -ef</code></td><td>Snapshot of every process, System V-style columns</td><td>shows <code>PID</code>/<code>PPID</code> up front</td><td><code>ps -ef | grep nginx</code></td></tr>
    <tr><td><code>top</code></td><td>Live, auto-refreshing process view</td><td>sorted by CPU by default</td><td><code>top</code></td></tr>
    <tr><td><code>htop</code></td><td>Friendlier live process view</td><td>scrollable, colorized; may need install</td><td><code>htop</code></td></tr>
    <tr><td><code>pgrep</code></td><td>Find PIDs by name/pattern</td><td><code>-f</code> match full command line · <code>-l</code> include name</td><td><code>pgrep -f "manage.py runserver"</code></td></tr>
    <tr><td><code>kill</code></td><td>Send a signal to a PID (default: SIGTERM)</td><td><code>-9</code>/<code>-SIGKILL</code> · <code>-1</code>/<code>-HUP</code></td><td><code>kill -9 &lt;pid&gt;</code></td></tr>
    <tr><td><code>killall</code></td><td>Signal every process matching an exact NAME</td><td>Linux-specific meaning; differs on other Unixes</td><td><code>killall nginx</code></td></tr>
    <tr><td><code>pkill</code></td><td>Signal every process matching a pattern</td><td><code>-f</code> match full command line</td><td><code>pkill -f "manage.py runserver"</code></td></tr>
    <tr><td>Signals</td><td><code>SIGHUP</code>=1 reload/hangup · <code>SIGINT</code>=2 Ctrl-C · <code>SIGKILL</code>=9 uncatchable kill · <code>SIGTERM</code>=15 polite default</td><td>only <code>SIGKILL</code> and <code>SIGSTOP</code> can't be caught/trapped</td><td><code>kill -HUP &lt;pid&gt;</code></td></tr>
    <tr><td><code>cmd &amp;</code></td><td>Run a command in the background</td><td>shell returns a job number + PID</td><td><code>sleep 300 &amp;</code></td></tr>
    <tr><td><code>Ctrl-Z</code> / <code>jobs</code> / <code>fg</code> / <code>bg</code></td><td>Suspend, list, and resume shell jobs</td><td><code>%1</code> targets job number 1</td><td><code>fg %1</code></td></tr>
    <tr><td><code>nohup</code></td><td>Launch a command immune to SIGHUP from the start</td><td>output → <code>nohup.out</code> by default</td><td><code>nohup ./long-running-script.sh &amp;</code></td></tr>
    <tr><td><code>disown</code></td><td>Detach an already-running job from this shell</td><td><code>-a</code> disown all jobs</td><td><code>disown %1</code></td></tr>
    <tr><td><code>nice -n &lt;v&gt;</code></td><td>Launch a new process at a given niceness</td><td>-20 (highest priority) to 19 (lowest); default 0</td><td><code>nice -n 10 ./batch-report.sh</code></td></tr>
    <tr><td><code>renice -n &lt;v&gt; -p &lt;pid&gt;</code></td><td>Change niceness of a running process</td><td>negative values need root</td><td><code>renice -n 15 -p &lt;pid&gt;</code></td></tr>
    <tr><td><code>free -h</code></td><td>Show memory/swap usage, human-readable</td><td>—</td><td><code>free -h</code></td></tr>
    <tr><td><code>uptime</code></td><td>Show uptime, users, load averages</td><td>1/5/15-minute averages</td><td><code>uptime</code></td></tr>
    <tr><td><code>lsof</code></td><td>List open files for all processes</td><td><code>-i</code> network sockets · <code>-i :&lt;port&gt;</code> one port</td><td><code>lsof -i :8080</code></td></tr>
    <tr><td><code>systemctl start/stop/restart</code></td><td>Control a service right now</td><td>systemd-specific; not persisted across boot</td><td><code>sudo systemctl restart nginx</code></td></tr>
    <tr><td><code>systemctl enable</code></td><td>Make a service start on future boots</td><td>doesn't start it now · <code>--now</code> does both</td><td><code>sudo systemctl enable --now nginx</code></td></tr>
    <tr><td><code>systemctl status</code></td><td>Show state + recent logs for a service</td><td>first stop when a service misbehaves</td><td><code>systemctl status nginx</code></td></tr>
    <tr><td><code>journalctl -u &lt;svc&gt;</code></td><td>Show all logs for one systemd unit</td><td><code>-f</code> follow live · <code>-n &lt;N&gt;</code> last N lines</td><td><code>journalctl -u nginx -f</code></td></tr>
    <tr><td><code>crontab -e</code></td><td>Edit your recurring scheduled jobs</td><td>5 fields: min hour dom month dow · <code>-l</code> to list</td><td><code>30 2 * * * /home/alice/scripts/backup.sh</code></td></tr>
    <tr><td><code>at</code></td><td>Schedule a one-off job for a future time</td><td><code>atq</code> list queued · <code>atrm</code> remove</td><td><code>at 5pm</code></td></tr>
    <tr><td>systemd timers</td><td>systemd-native recurring scheduling</td><td><code>.timer</code> unit paired with a <code>.service</code> unit</td><td><code>systemctl enable --now &lt;name&gt;.timer</code></td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'ref-scripting', title: '📜 Shell Scripting', html: `
<table>
  <thead><tr><th>Command</th><th>Purpose</th><th>Key flags</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td><code>#!/usr/bin/env bash</code></td><td>Shebang — first line; picks bash from <code>PATH</code></td><td>only matters when run directly, e.g. <code>./script.sh</code></td><td><code>#!/usr/bin/env bash</code></td></tr>
    <tr><td><code>chmod +x</code></td><td>Make a script executable</td><td>required before <code>./script.sh</code> will run</td><td><code>chmod +x script.sh</code></td></tr>
    <tr><td><code>./script.sh</code></td><td>Run a script directly</td><td>needs <code>+x</code> and shebang; runs in a new child shell</td><td><code>./script.sh</code></td></tr>
    <tr><td><code>bash script.sh</code></td><td>Run a script with an explicit interpreter</td><td>no <code>+x</code>/shebang needed; still a new child shell</td><td><code>bash script.sh</code></td></tr>
    <tr><td><code>source</code> / <code>.</code></td><td>Run a script's commands in your CURRENT shell</td><td>only way to persist <code>cd</code>/vars afterward</td><td><code>source ./lib/common.sh</code></td></tr>
    <tr><td><code>name="value"</code></td><td>Assign a variable</td><td>no spaces around <code>=</code></td><td><code>count=3</code></td></tr>
    <tr><td><code>"$var"</code></td><td>Quoted expansion</td><td>expands, no word-splitting/glob — the safe default</td><td><code>rm "$file"</code></td></tr>
    <tr><td><code>'$var'</code></td><td>Literal (no expansion)</td><td>single quotes suppress ALL expansion</td><td><code>echo '$file'</code></td></tr>
    <tr><td><code>\${var}</code></td><td>Disambiguate a variable name</td><td>needed before concatenating text</td><td><code>echo "\${name}_backup.txt"</code></td></tr>
    <tr><td><code>\${var:-default}</code></td><td>Default value</td><td>yields default only if var is unset/empty; doesn't change var</td><td><code>echo "\${missing:-0}"</code></td></tr>
    <tr><td><code>$(command)</code></td><td>Command substitution — captures stdout</td><td>prefer over backticks</td><td><code>today=$(date +%Y-%m-%d)</code></td></tr>
    <tr><td><code>echo</code> / <code>printf</code></td><td>Print text</td><td><code>printf</code> is more predictable/exact; no auto newline</td><td><code>printf "Name: %s\\n" "$name"</code></td></tr>
    <tr><td><code>read -p</code></td><td>Read interactive input</td><td>pauses script, stores typed line in var</td><td><code>read -p "Enter your name: " username</code></td></tr>
    <tr><td><code>[ expr ]</code> / <code>test</code></td><td>POSIX test</td><td>same command; strict about quoting/spacing</td><td><code>if [ -f "myfile.txt" ]; then echo "exists"; fi</code></td></tr>
    <tr><td><code>[[ expr ]]</code></td><td>Bash test</td><td>safer with unquoted vars; supports <code>&amp;&amp;</code>/<code>||</code> inside</td><td><code>if [[ -f "$path" ]]; then echo "exists"; fi</code></td></tr>
    <tr><td>File tests</td><td><code>-f -d -e -r -w -x</code></td><td>regular file / directory / exists / readable / writable / executable</td><td><code>[[ -d "$path" ]]</code></td></tr>
    <tr><td>String tests</td><td><code>-z -n == !=</code></td><td>empty / non-empty / equal / not equal</td><td><code>[[ -z "$str" ]]</code></td></tr>
    <tr><td>Number tests</td><td><code>-eq -ne -lt -le -gt -ge</code></td><td>spelled out — <code>&lt;</code>/<code>&gt;</code> mean something else in <code>[ ]</code></td><td><code>[[ "$a" -lt "$b" ]]</code></td></tr>
    <tr><td><code>if/elif/else/fi</code></td><td>Conditional branching</td><td>branches on the exit code of the command after <code>if</code></td><td><code>if [[ -f "$config" ]]; then echo ok; fi</code></td></tr>
    <tr><td><code>case ... in ... esac</code></td><td>Multi-way branch</td><td>glob-style patterns; <code>;;</code> ends each branch; <code>*)</code> is catch-all</td><td><code>case "$1" in start) echo go;; esac</code></td></tr>
    <tr><td><code>for x in a b c; do ... done</code></td><td>Loop over a fixed list</td><td>list expanded once, before the loop starts</td><td><code>for f in *.txt; do echo "$f"; done</code></td></tr>
    <tr><td><code>while [[ cond ]]; do ... done</code></td><td>Loop while condition true</td><td>repeats while cond succeeds</td><td><code>while [[ "$count" -lt 5 ]]; do count=$((count+1)); done</code></td></tr>
    <tr><td><code>until [[ cond ]]; do ... done</code></td><td>Loop while condition false</td><td>mirror of <code>while</code></td><td><code>until [[ -f "$file" ]]; do sleep 1; done</code></td></tr>
    <tr><td><code>for ((i=0; i&lt;5; i++))</code></td><td>C-style numeric loop</td><td>bash extension; familiar numeric counting form</td><td><code>for ((i = 0; i &lt; 5; i++)); do echo "$i"; done</code></td></tr>
    <tr><td><code>name() { ...; }</code></td><td>Define a reusable function</td><td>called like any other command: <code>name arg1</code></td><td><code>greet() { echo "Hello, $1"; }</code></td></tr>
    <tr><td><code>local var="value"</code></td><td>Scope a variable to a function</td><td>without it, function variables leak to global scope</td><td><code>local person="$1"</code></td></tr>
    <tr><td><code>$0 $1 $2 ...</code></td><td>Script name / positional arguments</td><td><code>$0</code> = script path; <code>$1+</code> = positional args</td><td><code>echo "First arg: $1"</code></td></tr>
    <tr><td><code>"$@"</code></td><td>All args, safely</td><td>each arg as its own word — use for forwarding args</td><td><code>print_args "$@"</code></td></tr>
    <tr><td><code>"$*"</code></td><td>All args, joined</td><td>all args joined into ONE string</td><td><code>echo "$*"</code></td></tr>
    <tr><td><code>$#</code></td><td>Argument count</td><td>total number of positional arguments</td><td><code>while [[ $# -gt 0 ]]; do shift; done</code></td></tr>
    <tr><td><code>shift</code></td><td>Drop the first argument</td><td>renumbers remaining args down; standard for arg-loop parsing</td><td><code>shift 2</code></td></tr>
    <tr><td><code>$?</code></td><td>Last exit code</td><td>check immediately — overwritten by the next command</td><td><code>echo "Exit code: $?"</code></td></tr>
    <tr><td><code>exit N</code></td><td>End the script</td><td><code>0</code> = success, non-zero = failure, by convention</td><td><code>exit 1</code></td></tr>
    <tr><td><code>cmd1 &amp;&amp; cmd2</code></td><td>Run cmd2 only if cmd1 succeeded</td><td>lightweight inline alternative to <code>if</code></td><td><code>mkdir -p build &amp;&amp; cd build</code></td></tr>
    <tr><td><code>cmd1 || cmd2</code></td><td>Run cmd2 only if cmd1 failed</td><td>mirror of <code>&amp;&amp;</code></td><td><code>grep "ERROR" app.log || echo "No errors"</code></td></tr>
    <tr><td><code>set -euo pipefail</code></td><td>Fail-fast script defaults</td><td><code>-e</code> exit on error · <code>-u</code> error on unset var · <code>pipefail</code> catches mid-pipe failures</td><td><code>set -euo pipefail</code></td></tr>
    <tr><td><code>trap 'cmd' EXIT</code></td><td>Guaranteed cleanup</td><td>runs cmd on any exit — normal, error, or signal</td><td><code>trap 'rm -f "$tmpfile"' EXIT</code></td></tr>
    <tr><td><code>export VAR=value</code></td><td>Export to child processes</td><td>makes VAR visible to programs this shell launches</td><td><code>export PATH="$PATH:/opt/mytool/bin"</code></td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'ref-networking', title: '🌐 Networking & Packages', html: `
<table>
  <thead><tr><th>Command</th><th>Purpose</th><th>Key flags</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td><code>ip a</code></td><td>Show network interfaces and their IP addresses</td><td>legacy: <code>ifconfig</code></td><td><code>ip a</code></td></tr>
    <tr><td><code>ip r</code></td><td>Show the routing table / default gateway</td><td>legacy: <code>route -n</code></td><td><code>ip r</code></td></tr>
    <tr><td><code>ss -tulpn</code></td><td>Show listening sockets and owning processes</td><td><code>-t</code> TCP · <code>-u</code> UDP · <code>-l</code> listening only · <code>-p</code> process · <code>-n</code> numeric</td><td><code>ss -tulpn | grep :443</code></td></tr>
    <tr><td><code>netstat -tulpn</code></td><td>Legacy equivalent of <code>ss -tulpn</code></td><td>superseded by <code>ss</code></td><td><code>netstat -tulpn</code></td></tr>
    <tr><td><code>ping</code></td><td>Test basic reachability of a host (ICMP)</td><td><code>-c &lt;n&gt;</code> send N pings then stop</td><td><code>ping -c 4 example.com</code></td></tr>
    <tr><td><code>curl</code></td><td>Fetch/send HTTP(S) requests from the command line</td><td><code>-I</code> headers only · <code>-L</code> follow redirects · <code>-o &lt;file&gt;</code> save to file · <code>-X &lt;verb&gt;</code> HTTP method · <code>-H</code> custom header</td><td><code>curl -I https://example.com</code></td></tr>
    <tr><td><code>wget</code></td><td>Download a file/URL straight to disk</td><td>follows redirects by default</td><td><code>wget https://example.com/file.tar.gz</code></td></tr>
    <tr><td><code>ssh</code></td><td>Open an encrypted remote shell</td><td><code>user@host</code> · <code>-i &lt;key-file&gt;</code> use a specific private key</td><td><code>ssh -i ~/.ssh/deploy_key alice@203.0.113.10</code></td></tr>
    <tr><td><code>scp</code></td><td>Copy a file to/from a remote host over SSH</td><td><code>-r</code> recursive for directories</td><td><code>scp build.zip alice@203.0.113.10:/home/alice/</code></td></tr>
    <tr><td><code>rsync</code></td><td>Sync files to/from a remote host, transferring only diffs</td><td><code>-a</code> archive (perms/times/symlinks) · <code>-v</code> verbose · <code>-z</code> compress in transit</td><td><code>rsync -avz ./dist/ alice@203.0.113.10:/var/www/app/</code></td></tr>
    <tr><td><code>dig</code></td><td>Detailed DNS lookup</td><td><code>+short</code> just the resolved IP</td><td><code>dig +short example.com</code></td></tr>
    <tr><td><code>host</code></td><td>Quick, terse DNS lookup</td><td>—</td><td><code>host example.com</code></td></tr>
    <tr><td><code>nslookup</code></td><td>Older DNS lookup tool</td><td>still common out of habit / on other OSes</td><td><code>nslookup example.com</code></td></tr>
    <tr><td><code>apt</code> / <code>apt-get</code></td><td>Package manager — Debian/Ubuntu</td><td><code>update</code> refresh index · <code>install</code> · <code>remove</code> · <code>search</code></td><td><code>sudo apt install &lt;package&gt;</code></td></tr>
    <tr><td><code>dnf</code> / <code>yum</code></td><td>Package manager — Fedora/RHEL (<code>yum</code> = older)</td><td><code>install</code> · <code>remove</code> · <code>search</code> · auto-refreshes index</td><td><code>sudo dnf install &lt;package&gt;</code></td></tr>
    <tr><td><code>pacman</code></td><td>Package manager — Arch Linux</td><td><code>-S</code> install · <code>-R</code> remove · <code>-Ss</code> search · <code>-Syu</code> refresh + full upgrade</td><td><code>sudo pacman -Syu</code></td></tr>
    <tr><td><code>df -h</code></td><td>Show free/used space per filesystem</td><td><code>-h</code> human-readable sizes</td><td><code>df -h</code></td></tr>
    <tr><td><code>du -sh</code></td><td>Show total size of a directory's contents</td><td><code>-s</code> summarize · <code>-h</code> human-readable</td><td><code>du -sh /var/log</code></td></tr>
    <tr><td><code>lsblk</code></td><td>List block devices (disks/partitions) as a tree</td><td>shows current mountpoints</td><td><code>lsblk</code></td></tr>
    <tr><td><code>mount</code> / <code>umount</code></td><td>Attach / detach a filesystem to the directory tree</td><td>usually requires <code>sudo</code></td><td><code>sudo mount /dev/sdb1 /mnt/usb</code></td></tr>
    <tr><td><code>env</code></td><td>Print all current environment variables</td><td>—</td><td><code>env</code></td></tr>
    <tr><td><code>export</code></td><td>Set a variable so child processes inherit it</td><td><code>export VAR=value</code></td><td><code>export MY_VAR=hello</code></td></tr>
    <tr><td><code>echo $PATH</code></td><td>Print the ordered, colon-separated command search list</td><td>first match wins</td><td><code>echo $PATH</code></td></tr>
    <tr><td><code>~/.bashrc</code></td><td>Runs for every new interactive non-login shell</td><td>everyday new-terminal case</td><td><code># add aliases/PATH tweaks here</code></td></tr>
    <tr><td><code>~/.profile</code></td><td>Runs once at login (e.g. fresh SSH session)</td><td>often sourced from <code>~/.bash_profile</code></td><td><code># login-time environment setup</code></td></tr>
    <tr><td><code>journalctl</code></td><td>Query the systemd journal (unified service logs)</td><td><code>-u &lt;service&gt;</code> · <code>-f</code> follow · <code>-b</code> current boot</td><td><code>journalctl -u nginx -f</code></td></tr>
    <tr><td><code>/var/log</code></td><td>Traditional plain-text log directory</td><td>read with <code>cat</code>/<code>less</code>/<code>tail</code></td><td><code>tail -f /var/log/nginx/access.log</code></td></tr>
    <tr><td><code>tail -f</code></td><td>Follow a growing log file live</td><td>Ctrl+C to stop</td><td><code>tail -f /var/log/syslog</code></td></tr>
    <tr><td><code>tar -czvf</code></td><td>Create a gzip-compressed archive</td><td><code>c</code> create · <code>z</code> gzip · <code>v</code> verbose · <code>f</code> filename (last)</td><td><code>tar -czvf backup.tar.gz projects/</code></td></tr>
    <tr><td><code>tar -xzvf</code></td><td>Extract a gzip-compressed archive</td><td><code>x</code> extract</td><td><code>tar -xzvf backup.tar.gz</code></td></tr>
    <tr><td><code>tar -tzvf</code></td><td>List an archive's contents without extracting</td><td><code>t</code> list</td><td><code>tar -tzvf backup.tar.gz</code></td></tr>
    <tr><td><code>gzip</code> / <code>gunzip</code></td><td>Compress / decompress a single file in place</td><td>no bundling of multiple files</td><td><code>gzip &lt;file&gt;</code></td></tr>
    <tr><td><code>zip</code> / <code>unzip</code></td><td>Bundle + compress multiple files/dirs, or extract</td><td><code>-r</code> recursive for directories</td><td><code>zip -r archive.zip &lt;dir&gt;</code></td></tr>
    <tr><td><code>uname -a</code></td><td>Print kernel name, version, and architecture</td><td>—</td><td><code>uname -a</code></td></tr>
    <tr><td><code>hostnamectl</code></td><td>Show/set the system hostname and OS info</td><td>systemd-based; replaces plain <code>hostname</code></td><td><code>hostnamectl</code></td></tr>
  </tbody>
</table>
`}

]});
