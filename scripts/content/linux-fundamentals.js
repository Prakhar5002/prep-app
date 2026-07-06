window.PREP_SITE.registerTopic({
  id: 'linux-fundamentals',
  module: 'linux',
  title: 'Fundamentals & Navigation',
  estimatedReadTime: '24 min',
  tags: ['linux', 'cli', 'shell', 'fundamentals', 'filesystem'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p><strong>Linux</strong> is an operating system built around a small, fast <strong>kernel</strong> (the core program that talks to hardware, manages memory, and schedules processes) that gets bundled with a huge set of tools into a <strong>distribution</strong> ("distro" — Ubuntu, Debian, Fedora, Arch, and many more). You interact with all of it through a <strong>shell</strong> — a program that reads the commands you type and runs them.</p>
<ul>
  <li><strong>Kernel vs. distro vs. shell:</strong> the kernel is the engine; the distro is the whole car (kernel + package manager + default apps + configuration); the shell is the steering wheel — the text interface you use to drive the system. This module teaches you to drive from the shell.</li>
  <li><strong>"Everything is a file."</strong> Regular documents, directories, USB drives, your keyboard, even running processes — Linux represents almost everything as a file you can look at, read from, or write to, living somewhere in one single filesystem tree. That one idea explains a surprising number of Linux's design decisions.</li>
  <li><strong>You drive it from the shell.</strong> The shell (commonly <strong>bash</strong> or <strong>zsh</strong>) is a program that shows you a prompt, reads the line you type, and runs it as a command. Nearly everything in this module — and in real Linux work, from your laptop to a remote production server — happens by typing commands into a shell.</li>
  <li><strong>This is topic 1 of the Linux module — beginner start, zero assumptions.</strong> This topic covers navigating the filesystem and the small set of commands you'll use in literally every single session: <code>pwd</code>, <code>ls</code>, <code>cd</code>, creating/copying/moving/removing files, viewing file contents, and getting help. Later topics build on this: permissions & users, text processing & pipelines, processes & services, shell scripting, and networking/sysadmin.</li>
</ul>
<p><strong>Mantra:</strong> "Everything is a file, the filesystem is one tree rooted at <code>/</code>, and the shell is how you walk that tree and act on what you find."</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why learn the command line at all?</h3>
<p>If you've only ever used a computer through icons, windows, and menus (a "GUI" — graphical user interface), typing commands into a black box can feel like a step backwards. It isn't, and here's why it matters in practice:</p>
<ul>
  <li><strong>Speed.</strong> Once you know the commands, doing something in the terminal is often faster than clicking through several menus — especially for repetitive tasks (rename 200 files, find every file over 100MB, search inside thousands of files at once).</li>
  <li><strong>Scriptability.</strong> Anything you can type, you can save into a file and run again — and again, and on a schedule, and on ten servers at once. GUIs are built for one human clicking one thing at a time; the command line is built to be automated.</li>
  <li><strong>Remote servers have no GUI.</strong> The overwhelming majority of servers on the internet — the machines actually running websites, APIs, and databases — are Linux machines with no screen, no mouse, and no desktop attached. You connect to them remotely (commonly over SSH, covered in the Networking & Sysadmin topic) and the shell is the <em>only</em> way in. If you want to be a developer, DevOps engineer, or anyone who touches production systems, this isn't optional.</li>
  <li><strong>It's the universal layer.</strong> Docker containers, CI/CD pipelines, cloud VMs, Raspberry Pis, most of the world's supercomputers, and the majority of phones on Earth (Android's kernel is Linux) all run on Linux or something Linux-like. Learning the shell transfers almost everywhere.</li>
</ul>

<h3>Kernel, distro, and shell — three different things people lump together as "Linux"</h3>
<p>People say "I'm running Linux" to mean three different layers, and it's worth pulling them apart once, clearly:</p>
<ul>
  <li><strong>The kernel</strong> is the actual program called "Linux" — a piece of software, started by Linus Torvalds in 1991, that runs closest to the hardware. It manages memory, decides which running program gets the CPU next, talks to disks and network cards, and enforces the boundary between programs so one crashing app can't (normally) take down the whole machine. You almost never interact with the kernel directly.</li>
  <li><strong>A distribution ("distro")</strong> is the kernel <em>plus</em> everything needed to make it a usable operating system: a package manager (for installing software), a standard set of core utilities, default configuration, and often a desktop environment. <strong>Ubuntu</strong>, <strong>Debian</strong>, <strong>Fedora</strong>, and <strong>Arch Linux</strong> are all different distros — different packaging and defaults, but the same Linux kernel underneath (with distro-specific patches). This is why a command that works on Ubuntu might need a slightly different package-manager command on Fedora — noted where it matters, later in this module.</li>
  <li><strong>The shell</strong> is a program — itself just an ordinary piece of software running on top of the kernel — whose entire job is to read text you type, interpret it as a command, and run it. <strong>bash</strong> ("Bourne Again SHell") is the long-standing default on most Linux distros; <strong>zsh</strong> is a popular alternative (and is the default shell on modern macOS). They're similar enough day-to-day that everything in this module works the same in either, unless called out.</li>
</ul>
<p>So: the kernel is what "Linux" technically refers to, a distro is a full OS built around that kernel, and the shell is your day-to-day interface to it all. This module is about the shell — the layer you'll spend nearly all your time in.</p>

<h3>What a "terminal" actually is</h3>
<p>One more piece of vocabulary worth untangling: the <strong>terminal</strong> (or "terminal emulator") is just the window — the app that displays text and lets you type. The <strong>shell</strong> is the program running <em>inside</em> that window that actually understands your commands. You open a terminal app (on macOS: Terminal.app or iTerm2; on Ubuntu: GNOME Terminal; in this module we generically call it "the terminal") and it starts a shell (bash or zsh) for you automatically. In everyday speech people use "terminal" and "shell" interchangeably — that's fine; just know the terminal is the window and the shell is the interpreter running inside it.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>One tree, rooted at <code>/</code></h3>
<p>Where Windows has separate drive letters (<code>C:\\</code>, <code>D:\\</code>...), Linux has exactly <strong>one</strong> filesystem tree, and everything — every disk, every USB drive, every file, every directory — lives somewhere underneath a single top-level directory called <strong>root</strong>, written as a single forward slash: <code>/</code>. There is no "top of C: drive" separate from "top of D: drive" — there's just <code>/</code>, and everything branches out from it.</p>
<pre><code class="language-text">/                     ← the root of the entire filesystem
├── home/             ← personal directories, one per user
│   └── alice/         ← e.g. a user named "alice" — often shown as ~ for that user
├── etc/               ← system-wide configuration files (plain text)
├── var/               ← "variable" data that changes at runtime: logs, caches, spool files
├── usr/               ← installed programs and their supporting files (most of the OS lives here)
├── tmp/               ← temporary files; may be cleared automatically on reboot
└── bin/               ← essential command binaries (often a link into usr/bin on modern distros)
</code></pre>
<p>You don't need to memorize every directory under <code>/</code> today — just the shape of the idea: it's <em>one tree</em>, and a handful of top-level directories have well-known, conventional jobs. A few you'll bump into constantly:</p>
<ul>
  <li><code>/home</code> — where regular users' personal files live. Your account gets its own subdirectory here (e.g. <code>/home/alice</code>).</li>
  <li><code>/etc</code> — "et cetera": system and application configuration files, almost all plain text you can open and read.</li>
  <li><code>/var</code> — data that changes while the system runs: log files (<code>/var/log</code>), mail queues, caches.</li>
  <li><code>/usr</code> — the bulk of installed software and its supporting resources (this is <em>not</em> "user files" despite the name — that's a historical accident).</li>
  <li><code>/tmp</code> — scratch space for temporary files, shared by anyone and anything on the system.</li>
  <li><code>/bin</code> — essential, always-available command programs (<code>ls</code>, <code>cp</code>, <code>cat</code>, and friends physically live somewhere like here).</li>
</ul>

<h3>Absolute vs. relative paths</h3>
<p>A <strong>path</strong> is just an address that tells the shell where a file or directory is. There are two flavors:</p>
<ul>
  <li><strong>Absolute path</strong> — starts from <code>/</code> (the root) and spells out the full route, no matter where you currently are. Example: <code>/home/alice/projects/notes.txt</code> always refers to the exact same file, from anywhere.</li>
  <li><strong>Relative path</strong> — starts from <em>wherever you currently are</em> (your "current working directory," covered in Mechanics below). Example: if you're already sitting inside <code>/home/alice</code>, the relative path <code>projects/notes.txt</code> points at the same file as the absolute path above — but only <em>from that starting point</em>. From anywhere else, it means something different (or doesn't exist at all).</li>
</ul>
<p>Rule of thumb: absolute paths are unambiguous and safe in scripts and documentation; relative paths are shorter and convenient for everyday typing once you're already "near" the thing you want.</p>

<h3>The four special path shortcuts</h3>
<table>
  <thead><tr><th>Symbol</th><th>Means</th></tr></thead>
  <tbody>
    <tr><td><code>/</code></td><td>The root of the entire filesystem (when it starts a path), or a separator between directory names (when it appears in the middle, e.g. <code>home/alice</code>).</td></tr>
    <tr><td><code>.</code></td><td>The current directory — "right here." Mostly used when a command needs an explicit path, e.g. running a script in the current folder as <code>./script.sh</code>.</td></tr>
    <tr><td><code>..</code></td><td>The parent directory — "one level up" from wherever you currently are.</td></tr>
    <tr><td><code>~</code></td><td>Shorthand for <em>your</em> home directory (e.g. <code>~</code> expands to <code>/home/alice</code>). <code>~bob</code> means another user's home directory.</td></tr>
  </tbody>
</table>
<p>These four symbols show up constantly and combine freely: <code>~/projects</code> means "the <code>projects</code> folder inside my home directory"; <code>../sibling-folder</code> means "go up one level, then into <code>sibling-folder</code>"; <code>../../</code> means "up two levels."</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Where am I? <code>pwd</code></h3>
<pre><code class="language-bash">pwd</code></pre>
<p><code>pwd</code> ("print working directory") prints the absolute path of the directory you're currently sitting in. This is the single most useful orientation command — run it any time you're unsure where you are.</p>

<h3>What's here? <code>ls</code></h3>
<pre><code class="language-bash"># List the contents of the current directory:
ls

# Long listing: permissions, owner, size, modification date, one entry per line:
ls -l

# Include hidden files (dotfiles — anything starting with "."):
ls -a

# Human-readable file sizes (1.2K, 3.4M) instead of raw byte counts — combine with -l:
ls -lh

# Sort by modification time, newest first:
ls -t

# Recurse into subdirectories, listing everything below:
ls -R

# List a specific directory instead of the current one:
ls &lt;dir&gt;
ls /var/log</code></pre>
<p><code>ls</code> flags combine freely — <code>ls -la</code> ("list all, long format") is probably the single most-typed Linux command variant of all: every file including hidden ones, with permissions, owner, and size.</p>

<h3>Moving around: <code>cd</code></h3>
<pre><code class="language-bash"># Go into a directory (relative path):
cd &lt;dir&gt;
cd projects

# Go to an absolute path:
cd /var/log

# Go to your home directory — either of these works:
cd
cd ~

# Go up one level, to the parent directory:
cd ..

# Go back to whichever directory you were in immediately before this one:
cd -</code></pre>
<p><code>cd</code> ("change directory") is how you move through the tree. Run with no argument at all, it takes you home — a very common way to "get back to a known place." <code>cd -</code> is a handy toggle between your last two locations — e.g. jump into <code>/var/log</code> to check something, then <code>cd -</code> to instantly return to where you were.</p>

<h3>Creating things: <code>mkdir</code>, <code>touch</code></h3>
<pre><code class="language-bash"># Create a new, empty directory:
mkdir &lt;dir&gt;
mkdir notes

# Create nested directories in one shot, including any missing parent folders:
mkdir -p projects/2026/linux-notes

# Create a new, empty file (or update an existing file's "last modified" timestamp):
touch &lt;file&gt;
touch todo.txt</code></pre>
<p>Without <code>-p</code>, <code>mkdir a/b/c</code> fails if <code>a</code> doesn't already exist — <code>mkdir -p</code> creates every missing directory in the chain for you, and is the version you'll reach for almost every time. <code>touch</code> is most often used to quickly create an empty placeholder file, but its original purpose is exactly what the name says: it "touches" a file's modification timestamp, updating it to now, without changing its contents — that also works on existing files.</p>

<h3>Removing empty directories: <code>rmdir</code></h3>
<pre><code class="language-bash">rmdir &lt;dir&gt;
rmdir old-notes</code></pre>
<p><code>rmdir</code> only removes a directory if it's completely <em>empty</em> — it refuses (with an error) if anything is still inside. That safety makes it a good default when you specifically mean "delete this empty folder and nothing else." To remove a directory <em>with</em> contents, you need <code>rm -r</code> (below).</p>

<h3>Copying and moving: <code>cp</code>, <code>mv</code></h3>
<pre><code class="language-bash"># Copy a single file:
cp &lt;source&gt; &lt;destination&gt;
cp notes.txt notes-backup.txt

# Copy a directory and everything inside it (recursive — required for directories):
cp -r &lt;source-dir&gt; &lt;destination-dir&gt;
cp -r projects/ projects-backup/

# Move (or rename) a file or directory — same command does both:
mv &lt;source&gt; &lt;destination&gt;
mv notes.txt archive/notes.txt
mv oldname.txt newname.txt</code></pre>
<p><code>cp</code> without <code>-r</code> only works on individual files — pointing it at a directory fails with an error telling you to add <code>-r</code> ("recursive"). There is no separate "rename" command in Linux: <code>mv</code> does both moving <em>and</em> renaming, because internally they're the same operation — moving a file to a new path, whether that path is in a different directory or just has a different name in the same one.</p>

<h3>Linking files: <code>ln</code></h3>
<pre><code class="language-bash"># Create a symbolic (soft) link — a small pointer file that stores a path
# to the target:
ln -s &lt;target&gt; &lt;linkname&gt;
ln -s /var/log/app.log latest.log

# Create a hard link — a second directory entry for the exact same underlying
# file data (no -s flag):
ln &lt;target&gt; &lt;linkname&gt;
ln notes.txt notes-alias.txt</code></pre>
<p><code>ln</code> ("link") gives an existing file an additional name, without copying its data. A <strong>symbolic (soft) link</strong> — <code>ln -s &lt;target&gt; &lt;linkname&gt;</code> — is just a tiny file that stores the <em>path</em> to its target: it can point at a directory, can cross filesystems, shows up in <code>ls -l</code> with a <code>-&gt;</code> pointing at what it targets, and breaks (becomes a "dangling link") if that target is later moved, renamed, or deleted. A plain <strong>hard link</strong> — <code>ln &lt;target&gt; &lt;linkname&gt;</code>, no <code>-s</code> — is a second name for the exact same data on disk (the same inode): both names are equally "real," deleting either one leaves the file intact under the other name, but hard links only work within a single filesystem and can't target a directory. This is just the beginner-level intro — a later topic goes deeper into links and inodes.</p>

<h3>Deleting things: <code>rm</code></h3>
<pre><code class="language-bash"># Delete a single file:
rm &lt;file&gt;
rm old-notes.txt

# Delete a directory and everything inside it, recursively:
rm -r &lt;dir&gt;
rm -r old-project/

# Force deletion without confirmation prompts, and don't complain if the target
# doesn't exist — commonly combined with -r as "rm -rf":
rm -rf &lt;dir&gt;
rm -rf build/</code></pre>
<div class="callout danger">
  <div class="callout-title">⚠️ <code>rm -rf</code> is permanent — there is no undo, no Recycle Bin</div>
  <p>Unlike deleting a file in a desktop GUI, <code>rm</code> does <strong>not</strong> move anything to a trash can you can later restore from. It deletes the data immediately and (for practical purposes) irreversibly. <code>rm -rf</code> is especially dangerous because <code>-f</code> ("force") suppresses the confirmation prompts you'd otherwise get, and <code>-r</code> ("recursive") means it happily deletes an entire directory tree — including everything inside it — without a second warning. Double-check your path (especially that you're not accidentally in the wrong directory, or that a variable in a script isn't empty) before running it. When in doubt, run <code>pwd</code> and <code>ls</code> first to confirm exactly where you are and what you're about to delete.</p>
</div>

<h3>Viewing file contents: <code>cat</code>, <code>less</code>, <code>head</code>, <code>tail</code></h3>
<pre><code class="language-bash"># Dump an entire file's contents straight to the screen:
cat &lt;file&gt;
cat notes.txt

# Open a file in a scrollable pager — use arrow keys / Page Up/Down, "q" to quit:
less &lt;file&gt;
less /var/log/system.log

# Open a file in the older, simpler pager — Space for the next screen, "q" to quit:
more &lt;file&gt;
more /var/log/system.log

# Show just the first 10 lines of a file (the default):
head &lt;file&gt;

# Show a specific number of lines from the start:
head -n 20 &lt;file&gt;

# Show just the last 10 lines of a file (the default):
tail &lt;file&gt;

# Show a specific number of lines from the end:
tail -n 20 &lt;file&gt;

# Follow a file live — keep printing new lines as they're appended
# (the classic way to watch a log file update in real time; Ctrl+C to stop):
tail -f &lt;file&gt;
tail -f /var/log/system.log</code></pre>
<p><code>cat</code> ("concatenate") just prints — fine for short files, unusable for anything long since it all scrolls by at once. <code>less</code> is a <em>pager</em>: it shows one screenful at a time and lets you scroll, search (press <code>/</code> then type), and quit with <code>q</code>, without ever loading the whole file into memory — this makes it the right tool for huge files. <code>more</code> is <code>less</code>'s older, simpler ancestor: it only pages <em>forward</em> — Space for the next screen, <code>q</code> to quit — with no back-scrolling and no search. <code>less</code> was written as a superset of <code>more</code> (hence the joke name — "less is more"): it does everything <code>more</code> does, plus scrolling backward and searching, while still never loading the whole file into memory — so on any modern system, reach for <code>less</code> and treat <code>more</code> as the one you'll recognize but rarely choose on purpose. <code>head</code>/<code>tail</code> show just the start or end of a file — <code>tail -f</code> in particular is one of the most-used commands for anyone working with servers, since it lets you watch a log file grow in real time as new events happen.</p>

<h3>Identifying and inspecting files: <code>file</code>, <code>stat</code>, <code>tree</code></h3>
<pre><code class="language-bash"># Ask Linux to guess a file's type by inspecting its actual content
# (not just its extension):
file &lt;file&gt;
file notes.txt
file photo.jpg

# Show detailed metadata about a file: size, permissions, timestamps, inode number:
stat &lt;file&gt;
stat notes.txt

# Show a directory's contents as an indented tree (may need installing first —
# it's not always preinstalled; e.g. "sudo apt install tree" on Debian/Ubuntu):
tree &lt;dir&gt;
tree projects/</code></pre>
<p><code>file</code> is handy when you're not sure what kind of data a file actually holds (its extension can lie — a file named <code>report.txt</code> could secretly be a JPEG). <code>stat</code> gives you everything <code>ls -l</code> shows and more — exact timestamps, the numeric permission mode, and the inode number (the filesystem's internal ID for that file). <code>tree</code> gives a quick visual map of a directory's structure, which is exactly what was hand-drawn in the Mental Model section above — the real command produces that same shape.</p>

<h3>Getting help: <code>man</code>, <code>--help</code>, <code>apropos</code>, <code>whatis</code>, <code>which</code>/<code>type</code>, <code>history</code>, <code>clear</code></h3>
<pre><code class="language-bash"># Open the full manual page for a command (scrollable like less; "q" to quit):
man &lt;command&gt;
man ls

# Most commands also support a quick, built-in summary of their own options:
&lt;command&gt; --help
ls --help

# Search every manual page's short description for a keyword —
# useful when you don't know a command's name yet:
apropos &lt;keyword&gt;
apropos "copy files"

# Print just the one-line description of a command:
whatis &lt;command&gt;
whatis ls

# Show the full path to the program that would run for a given command name:
which &lt;command&gt;
which ls

# Show HOW a command name would be interpreted — a shell builtin, an alias,
# a function, or an external program on disk (more thorough than "which"):
type &lt;command&gt;
type cd
type ls

# Show your recently run commands, numbered:
history

# Clear the terminal screen (your scrollback isn't deleted, just scrolled out of view):
clear</code></pre>
<p><code>man</code> is the authoritative, in-depth reference for a command — every flag, every edge case — while <code>--help</code> is a much shorter, faster cheat-sheet built into the program itself. <code>apropos</code> and <code>whatis</code> both search the manual page database: <code>apropos</code> when you only know a rough keyword, <code>whatis</code> when you already know the exact command name and just want its one-line summary. <code>which</code> and <code>type</code> both answer "what actually runs when I type this?" — <code>type</code> is the more complete answer since some commands (like <code>cd</code>) are built directly into the shell and have no separate file on disk for <code>which</code> to find.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Worked Examples', html: `
<h3>Example 1 — Navigate and build out a small project tree</h3>
<pre><code class="language-bash">pwd
# /home/alice

cd ~
mkdir -p projects/linux-notes/drafts
cd projects/linux-notes
pwd
# /home/alice/projects/linux-notes

ls
# drafts

touch README.md drafts/day1.md
ls -la
# .            ..           README.md   drafts

cd drafts
pwd
# /home/alice/projects/linux-notes/drafts

cd ..
pwd
# /home/alice/projects/linux-notes

cd -
pwd
# /home/alice/projects/linux-notes/drafts (back where cd - toggled us to)</code></pre>
<p>Notice the pattern: <code>mkdir -p</code> created the whole <code>projects/linux-notes/drafts</code> chain in one command even though none of it existed yet, and <code>cd ..</code> / <code>cd -</code> are the two commands you'll use constantly to move up and toggle back.</p>

<h3>Example 2 — Inspect files before trusting them</h3>
<pre><code class="language-bash">ls -lh downloads/
# -rw-r--r-- 1 alice staff  1.2M Jul  4 09:11 mystery-file

file downloads/mystery-file
# downloads/mystery-file: JPEG image data, ...
# (the ".txt"-less name didn't tell you it was actually an image — file did)

stat downloads/mystery-file
#   File: downloads/mystery-file
#   Size: 1258291       Blocks: 2464       IO Block: 4096   regular file
# Access: ...
# Modify: 2026-07-04 09:11:02
#  Change: ...

cat notes/todo.txt
# (short file — fine to dump straight to the screen)

less notes/meeting-log.txt
# (much longer file — opens paginated; press "q" to exit when done)</code></pre>
<p><code>ls -lh</code> gave a quick size/date overview, <code>file</code> revealed the real content type despite the misleading name, <code>stat</code> gave the full metadata picture, and the choice between <code>cat</code> and <code>less</code> came down purely to file length — short and disposable vs. long and worth paging through.</p>

<h3>Example 3 — Watch a growing log file live</h3>
<pre><code class="language-bash"># First, check the last 20 lines to see recent activity:
tail -n 20 /var/log/app.log

# Now follow it live — new lines appear as the application writes them:
tail -f /var/log/app.log
# ... new log lines stream in here as they happen ...
# Ctrl+C to stop following and return to the prompt

# If the file is huge and you want to search/scroll through history instead:
less /var/log/app.log
# Inside less: press "/" then type a search term, Enter to jump to it,
# "n" to jump to the next match, "q" to quit</code></pre>
<p>This combination — a quick <code>tail -n</code> to orient, then <code>tail -f</code> to watch live, with <code>less</code> as the tool for after-the-fact searching — is exactly how developers and sysadmins keep an eye on running applications from the command line.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '⚠️ Edge Cases', html: `
<h3>"I ran <code>rm -rf</code> and now it's gone forever"</h3>
<p>This is worth repeating from Mechanics because it's the single most common beginner disaster: Linux has no built-in Recycle Bin/Trash for command-line deletes. <code>rm</code> (with or without <code>-r</code>/<code>-f</code>) removes the file immediately, and unless you have a separate backup or snapshot system in place, it's gone. Before running <code>rm -r</code> or <code>rm -rf</code> on anything, it's worth running <code>ls</code> on the exact same path first to confirm precisely what you're about to delete — and being extra careful with any path built from a variable in a script, since an empty or wrong variable can silently turn <code>rm -rf "$dir/"</code> into something far more destructive than intended.</p>

<h3>Filenames with spaces need quoting</h3>
<p>The shell normally uses spaces to separate one argument from the next — so a filename like <code>Meeting Notes.txt</code> looks, to the shell, like <em>two</em> separate arguments ("Meeting" and "Notes.txt") unless you tell it otherwise:</p>
<pre><code class="language-bash"># This breaks — the shell sees two arguments, not one filename:
cat Meeting Notes.txt

# Quote the whole filename so the shell treats it as one argument:
cat "Meeting Notes.txt"

# Alternative: escape just the space with a backslash:
cat Meeting\\ Notes.txt</code></pre>
<p>This trips up nearly every beginner at least once. The safe habit: wrap any path in double quotes whenever it might contain a space (or other special characters like <code>$</code>, <code>*</code>, or <code>&amp;</code>) — quoting a plain filename with no spaces is always harmless, so when unsure, quote it.</p>

<h3>Hidden files (dotfiles) don't show up in a plain <code>ls</code></h3>
<p>Any file or directory whose name starts with a dot (<code>.</code>) — like <code>.bashrc</code>, <code>.gitignore</code>, or <code>.config/</code> — is treated as "hidden" by convention. A plain <code>ls</code> skips them entirely; you need <code>ls -a</code> (or <code>-la</code> for the long format too) to see them. This isn't a security feature — it's just a decades-old convention to keep configuration and housekeeping files out of your way during everyday directory listings. Every directory also always contains two dotfile-style entries, <code>.</code> (itself) and <code>..</code> (its parent) — you'll see these appear at the top of an <code>ls -a</code> listing.</p>

<h3><code>cd</code> with no argument always goes home</h3>
<p>Typing <code>cd</code> alone, with nothing after it, is not an error and does not do nothing — it's shorthand for <code>cd ~</code>, taking you straight back to your home directory from wherever you were. This is intentional and extremely commonly used as a quick "reset to a known location" — especially useful if you've navigated somewhere deep and unfamiliar and just want to get back to solid ground.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'cheat-sheet', title: '📋 Cheat Sheet', html: `
<table>
  <thead><tr><th>Command</th><th>Purpose</th><th>Key flags</th></tr></thead>
  <tbody>
    <tr><td><code>pwd</code></td><td>Print the absolute path of the current directory</td><td>—</td></tr>
    <tr><td><code>ls</code></td><td>List directory contents</td><td><code>-l</code> long format · <code>-a</code> include hidden · <code>-h</code> human-readable sizes · <code>-t</code> sort by mtime · <code>-R</code> recursive</td></tr>
    <tr><td><code>cd</code></td><td>Change the current directory</td><td><code>~</code> home · <code>-</code> previous dir · <code>..</code> parent dir · no arg = home</td></tr>
    <tr><td><code>mkdir</code></td><td>Create a new directory</td><td><code>-p</code> create missing parent dirs too</td></tr>
    <tr><td><code>rmdir</code></td><td>Remove an empty directory</td><td>fails if not empty</td></tr>
    <tr><td><code>touch</code></td><td>Create an empty file, or update a file's timestamp</td><td>—</td></tr>
    <tr><td><code>cp</code></td><td>Copy a file (or directory tree)</td><td><code>-r</code> recursive, required for directories</td></tr>
    <tr><td><code>mv</code></td><td>Move or rename a file/directory</td><td>same command does both move and rename</td></tr>
    <tr><td><code>ln</code></td><td>Create a link to an existing file</td><td><code>-s</code> symbolic/soft link (points by path) · no flag = hard link (same inode)</td></tr>
    <tr><td><code>rm</code></td><td>Delete a file (or directory tree)</td><td><code>-r</code> recursive · <code>-f</code> force, no prompts · <code>-rf</code> together = irreversible, no undo</td></tr>
    <tr><td><code>cat</code></td><td>Print an entire file's contents to the screen</td><td>best for short files</td></tr>
    <tr><td><code>less</code></td><td>Page through a file's contents interactively</td><td><code>/</code> search · <code>n</code> next match · <code>q</code> quit</td></tr>
    <tr><td><code>more</code></td><td>Page through a file's contents, forward only</td><td>Space next page · <code>q</code> quit · superseded by <code>less</code></td></tr>
    <tr><td><code>head</code></td><td>Show the first lines of a file</td><td><code>-n &lt;N&gt;</code> number of lines (default 10)</td></tr>
    <tr><td><code>tail</code></td><td>Show the last lines of a file</td><td><code>-n &lt;N&gt;</code> number of lines · <code>-f</code> follow live updates</td></tr>
    <tr><td><code>file</code></td><td>Identify a file's actual type by its content</td><td>—</td></tr>
    <tr><td><code>stat</code></td><td>Show detailed file metadata (size, timestamps, inode)</td><td>—</td></tr>
    <tr><td><code>tree</code></td><td>Show a directory's contents as an indented tree</td><td>may need separate install</td></tr>
    <tr><td><code>man</code></td><td>Open a command's full manual page</td><td><code>q</code> to quit</td></tr>
    <tr><td><code>--help</code></td><td>Print a command's built-in quick option summary</td><td>append to almost any command</td></tr>
    <tr><td><code>apropos</code></td><td>Search manual page descriptions by keyword</td><td>use when you don't know the command name</td></tr>
    <tr><td><code>whatis</code></td><td>Print a command's one-line description</td><td>use when you already know the command name</td></tr>
    <tr><td><code>which</code></td><td>Show the path to the program that would run</td><td>external commands only</td></tr>
    <tr><td><code>type</code></td><td>Show how a command name resolves (builtin/alias/function/file)</td><td>more complete than <code>which</code></td></tr>
    <tr><td><code>history</code></td><td>List recently run commands, numbered</td><td>—</td></tr>
    <tr><td><code>clear</code></td><td>Clear the terminal screen</td><td>scrollback is preserved, just scrolled away</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">What's the difference between the Linux kernel, a Linux distribution, and a shell?</div>
<div class="qa-a">
<p>The <strong>kernel</strong> is the core program (started by Linus Torvalds in 1991) that manages hardware, memory, and process scheduling — you rarely touch it directly. A <strong>distribution</strong> ("distro") is a complete, installable operating system built around that kernel: it bundles the kernel with a package manager, core utilities, and default configuration (Ubuntu, Debian, Fedora, and Arch are all different distros sharing the same underlying kernel). The <strong>shell</strong> (bash, zsh, etc.) is a program that runs on top of all that and gives you a text interface to type commands into — it's how a human actually drives the system day to day.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between an absolute path and a relative path?</div>
<div class="qa-a">
<p>An absolute path always starts from the filesystem root, <code>/</code>, and fully specifies a location no matter where you currently are — e.g. <code>/home/alice/notes.txt</code>. A relative path is interpreted starting from your <em>current working directory</em> — e.g. <code>notes.txt</code> or <code>../notes.txt</code> only resolve to a specific file once you know where you're currently standing (find that with <code>pwd</code>). Absolute paths are unambiguous everywhere, which is why scripts and documentation tend to prefer them; relative paths are shorter and convenient for everyday interactive use.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What does <code>ls -la</code> show you, and what do the two flags each contribute?</div>
<div class="qa-a">
<p><code>-a</code> ("all") makes <code>ls</code> include hidden files — anything whose name starts with a dot, like <code>.bashrc</code> — which are skipped by default. <code>-l</code> ("long") switches to a detailed, one-entry-per-line format showing permissions, number of links, owner, group, size, and last-modified date for each entry, instead of just names. Combined, <code>ls -la</code> gives you the complete, detailed picture of a directory's contents, hidden files included — arguably the single most-run command variant in everyday Linux use.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">How do you get help on a Linux command you don't know?</div>
<div class="qa-a">
<p>Several tools, for different situations: <code>man &lt;command&gt;</code> opens the full manual page for a command you already know the name of; <code>&lt;command&gt; --help</code> gives a quicker, built-in summary of just its options; <code>apropos &lt;keyword&gt;</code> searches every manual page's short description when you only know roughly what you want to do but not the command's name; and <code>whatis &lt;command&gt;</code> prints just the one-line description once you know the exact name. In practice: reach for <code>--help</code> for a quick flag reminder, <code>man</code> for the full reference, and <code>apropos</code> when you're starting from a keyword instead of a command name.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What are <code>/etc</code> and <code>/var</code> for?</div>
<div class="qa-a">
<p><code>/etc</code> holds system-wide and application configuration files — almost all plain text, meant to be read (and sometimes edited) by administrators. <code>/var</code> ("variable") holds data that changes constantly while the system runs — most notably log files under <code>/var/log</code>, but also things like mail queues and caches. A rough mental split: <code>/etc</code> is "how things are configured," <code>/var</code> is "what's happened / what's accumulating while it runs."</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between <code>less</code> and <code>cat</code> for viewing a file?</div>
<div class="qa-a">
<p><code>cat</code> dumps a file's entire contents to the screen in one shot — fine for short files, but unusable for anything long since everything scrolls past at once with no way to go back. <code>less</code> is a pager: it displays one screenful at a time, lets you scroll up and down, search with <code>/</code>, and quit with <code>q</code> — and critically, it doesn't need to load the whole file into memory first, so it stays fast even on huge files (multi-gigabyte logs, for instance) where <code>cat</code> would flood the terminal.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between <code>more</code> and <code>less</code>?</div>
<div class="qa-a">
<p>Both are pagers, but <code>more</code> is the older and more limited of the two: it only pages <em>forward</em> (Space for the next screen, <code>q</code> to quit) and has no way to scroll backward or search. <code>less</code> was written as a superset of <code>more</code>'s functionality — the name is a play on "less is more" — adding backward scrolling and <code>/</code>-search on top of everything <code>more</code> does, while still never loading the whole file into memory. In practice <code>less</code> is the one you'll actually use day to day; <code>more</code> mostly survives as the historically-earlier tool you should recognize but rarely need to reach for.</p>
</div>
</div>
`}

]});
