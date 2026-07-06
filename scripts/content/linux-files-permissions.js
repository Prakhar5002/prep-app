window.PREP_SITE.registerTopic({
  id: 'linux-files-permissions',
  module: 'linux',
  title: 'Files, Permissions & Users',
  estimatedReadTime: '26 min',
  tags: ['linux', 'permissions', 'chmod', 'users', 'security', 'find'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>Every file and directory on Linux has an <strong>owner</strong> (a user), a <strong>group</strong>, and three sets of <strong>read/write/execute</strong> permissions — one set each for the owner, the group, and everyone else. That's the entire permission model: three "who"s times three "what"s, nine bits total, and almost every access-control question on a Linux box comes down to reading or changing those bits.</p>
<ul>
  <li><strong>Everything is owned by someone.</strong> Every file has exactly one owning user and one owning group. <code>chown</code> changes the owner, <code>chgrp</code> changes the group, and <code>chmod</code> changes what each of the three "who" categories (owner/group/other) is allowed to do.</li>
  <li><strong>Permissions are just 9 bits (plus a few special ones).</strong> <code>rwx</code> for the owner, <code>rwx</code> for the group, <code>rwx</code> for everyone else — read as three numbers (0–7) in <code>chmod 755</code>, or as three letter-triplets in <code>ls -l</code>'s <code>-rwxr-xr-x</code>.</li>
  <li><strong>Root is the one account permissions don't apply to.</strong> The <code>root</code> user (UID 0) bypasses permission checks almost entirely. <code>sudo</code> is how ordinary users borrow root's power for a single command, safely and with an audit trail — which is why modern systems discourage logging in as root directly.</li>
  <li><strong>This is topic 2 of the Linux module.</strong> It builds directly on Topic 1 (navigation) and covers: reading and setting permissions, ownership, users/groups, <code>sudo</code>/<code>su</code>, symbolic vs. hard links (a deeper look than Topic 1's intro), and finding files with <code>find</code> and shell globs. Later topics build on this: text processing & pipelines, processes & services, shell scripting, and networking/sysadmin.</li>
</ul>
<p><strong>Mantra:</strong> "Owner, group, other — read, write, execute. Nine bits decide almost everything; root (and <code>sudo</code>) is the escape hatch."</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why does Linux bother with permissions at all?</h3>
<p>Linux was designed from day one as a <strong>multi-user</strong> system — many people (or many services) sharing one machine, at the same time, without being able to read each other's private files or accidentally (or maliciously) break each other's stuff. Permissions are the mechanism that makes that possible:</p>
<ul>
  <li><strong>Isolation between users.</strong> Your home directory's files aren't readable by other regular users by default — permissions are what actually enforces that, not just convention.</li>
  <li><strong>Protecting the system from users, and users from themselves.</strong> Core system files (under <code>/etc</code>, <code>/usr</code>, etc.) are owned by <code>root</code> and not writable by ordinary users — so a typo in a random script can't silently overwrite something critical to booting the machine.</li>
  <li><strong>Least privilege in practice.</strong> The same model that separates users from each other is what lets a web server process run as its own low-privilege user, unable to touch anything outside the one directory it needs — a core building block of production security.</li>
  <li><strong>It shows up constantly in real work.</strong> "Permission denied" is one of the most common errors any Linux user hits — a script that won't run, a file a deploy process can't write to, an SSH key that gets silently rejected because it's <em>too</em> readable. Understanding this model turns those from mysterious failures into two-second diagnoses.</li>
</ul>

<h3>Users, groups, and "everyone else"</h3>
<p>Every process and every file access happens <em>as</em> some user. Linux groups permission checks into exactly three buckets, checked in this order for every single file access:</p>
<ul>
  <li><strong>Owner (user)</strong> — the one specific user who owns the file. Almost always whoever created it, though ownership can be changed later with <code>chown</code>.</li>
  <li><strong>Group</strong> — one specific group the file belongs to. Every user belongs to at least one group (their primary group) and can belong to any number of additional (supplementary) groups.</li>
  <li><strong>Other</strong> — everyone else on the system: not the owner, and not a member of the owning group.</li>
</ul>
<p>When a user tries to access a file, Linux checks <strong>which one</strong> of those three buckets applies to them (owner &gt; group &gt; other, first match wins — it does <em>not</em> check "other" permissions just because a user happens to also fall in that category) and applies only that bucket's permissions. This is a common trip-up: if you're the owner of a file but your owner permissions are more restrictive than the group's, you're still bound by the (stricter) owner permissions — group and other never get consulted once "owner" matches.</p>

<h3>root: the account permissions don't apply to</h3>
<p>The <strong>root</strong> user (always user ID, or UID, <code>0</code>) is the traditional Linux superuser. Permission checks are, for almost all purposes, simply skipped for root — it can read, write, or execute any file, kill any process, and reconfigure anything on the system. This is powerful and dangerous in equal measure: there's no permission system left to save you from your own mistakes while acting as root, which is exactly why modern practice avoids logging in <em>as</em> root directly and instead uses <code>sudo</code> to grant root's power one command at a time (covered in Mechanics).</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>rwx × three — the whole permission model in one picture</h3>
<p>Every file and directory carries exactly nine permission bits, grouped into three triplets — one triplet per "who" bucket from What &amp; Why, each triplet made of the same three letters:</p>
<pre><code class="language-text">      owner     group     other
      r w x     r w x     r w x
      4 2 1     4 2 1     4 2 1
</code></pre>
<ul>
  <li><strong>r (read, value 4)</strong> — on a file: can view its contents. On a directory: can list its contents (<code>ls</code> the directory).</li>
  <li><strong>w (write, value 2)</strong> — on a file: can modify or truncate its contents. On a directory: can create, delete, or rename entries <em>inside</em> it — notably, deleting a file only requires write permission on its <em>containing directory</em>, not on the file itself.</li>
  <li><strong>x (execute, value 1)</strong> — on a file: can run it as a program/script. On a directory: can <code>cd</code> into it or access files inside it by name (sometimes called "search" permission for directories) — without <code>x</code> on a directory, even knowing a file's exact name inside it won't let you open it.</li>
</ul>
<p>Each triplet's three yes/no bits collapse into one digit 0–7 by adding up the values of whichever permissions are "on" — this is exactly where <code>chmod</code>'s numeric mode (<code>755</code>, <code>644</code>, etc.) comes from, unpacked fully in Mechanics.</p>

<h3>Reading permissions off <code>ls -l</code></h3>
<pre><code class="language-bash">ls -l notes.txt
# -rw-r--r-- 1 alice staff 1240 Jul  5 09:11 notes.txt</code></pre>
<p>Break the leading 10-character string into its pieces:</p>
<pre><code class="language-text">-   rw-   r--   r--
↑    ↑     ↑     ↑
type owner group other
</code></pre>
<ul>
  <li><strong>Position 1 — file type:</strong> <code>-</code> regular file, <code>d</code> directory, <code>l</code> symbolic link, and a few rarer types (<code>c</code> character device, <code>b</code> block device, <code>p</code> pipe, <code>s</code> socket).</li>
  <li><strong>Positions 2–4 — owner's rwx:</strong> here <code>rw-</code> — the owner (<code>alice</code>) can read and write, not execute.</li>
  <li><strong>Positions 5–7 — group's rwx:</strong> here <code>r--</code> — anyone in group <code>staff</code> can only read.</li>
  <li><strong>Positions 8–10 — other's rwx:</strong> here <code>r--</code> — everyone else can only read.</li>
</ul>
<p>The two names after the permission string (<code>alice staff</code>) are exactly the owning user and owning group those triplets apply to — matching the three-bucket model directly to the two names you see.</p>

<h3>umask: the "default permission subtractor"</h3>
<p>Newly created files and directories don't start from nothing — they start from a base (666 for files, 777 for directories) and the shell's <strong>umask</strong> subtracts bits from that base to decide the actual starting permissions. Think of umask as a mask of bits to <em>turn off</em>, not turn on — a umask of <code>022</code> (the common default) removes write permission for group and other, so a new file lands at <code>644</code> and a new directory at <code>755</code>. This is why every new file you create doesn't come out world-writable by accident.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Changing permissions: <code>chmod</code></h3>
<pre><code class="language-bash"># Numeric (absolute) mode — set the exact permission bits directly:
chmod &lt;mode&gt; &lt;file&gt;

# 755 = owner rwx (7), group r-x (5), other r-x (5) — the classic
# "executable/script or directory that anyone can use, only I can edit" mode:
chmod 755 deploy.sh

# 644 = owner rw- (6), group r-- (4), other r-- (4) — the classic
# "ordinary document, I can edit it, everyone else can just read it" mode:
chmod 644 notes.txt

# 600 = owner rw- (6), group --- (0), other --- (0) — "only I can
# read or write this, no one else, at all" — the standard mode for
# private keys, credentials, and similar secrets:
chmod 600 ~/.ssh/id_rsa

# Symbolic mode — adjust specific bits without touching the rest:
chmod u+x &lt;file&gt;      # add execute for the owner (u = "user"/owner)
chmod go-w &lt;file&gt;     # remove write for group and other
chmod a+r &lt;file&gt;      # add read for all three (a = "all")
chmod g+w,o-rwx &lt;file&gt; # combine multiple changes, comma-separated

# Recursively apply to a directory and everything inside it:
chmod -R 755 &lt;dir&gt;</code></pre>
<p><code>chmod</code> ("change mode") sets a file's permission bits, in one of two notations. <strong>Numeric mode</strong> (<code>755</code>, <code>644</code>, <code>600</code>...) sets all nine bits at once — each of the three digits is owner/group/other, and each digit is the sum of read (4) + write (2) + execute (1) for whichever of those you want on for that bucket; 7 = rwx (4+2+1), 5 = r-x (4+1), 4 = r-- , 6 = rw- (4+2), 0 = none. <strong>Symbolic mode</strong> (<code>u+x</code>, <code>go-w</code>, <code>a+r</code>...) instead adjusts specific bits relative to whatever they currently are, without needing to know or restate the rest: <code>u</code>/<code>g</code>/<code>o</code>/<code>a</code> pick who (user/owner, group, other, all), <code>+</code>/<code>-</code>/<code>=</code> pick add/remove/set-exactly, and <code>r</code>/<code>w</code>/<code>x</code> pick which bit. Symbolic mode is often preferred for one targeted tweak (e.g. "just make this one script executable" → <code>chmod u+x script.sh</code>, or more commonly <code>chmod +x script.sh</code> since <code>+x</code> with no letter defaults to affecting all three buckets in most implementations); numeric mode is preferred when you want to state the complete, exact permission set in one clear number.</p>

<h3>umask — controlling default permissions for new files</h3>
<pre><code class="language-bash"># Show the current umask:
umask
# 0022

# Set a new umask for the current shell session:
umask 027</code></pre>
<p><code>umask</code> with no argument prints the current mask; run with a value, it sets the mask for new files/directories created for the rest of that shell session (it's not persistent across sessions unless added to a shell startup file like <code>~/.bashrc</code>). A umask of <code>022</code> means "subtract write from group and other" from the base 666/777, landing new files at 644 and new directories at 755 — the near-universal default. A stricter umask like <code>027</code> (subtract WRITE only from group — execute stays untouched — and subtract everything, <code>rwx</code>, from other) is common on shared or security-sensitive systems, producing 640 files and 750 directories — note the directory result keeps group execute (<code>rwx r-x ---</code>) precisely because the group digit only ever subtracted write.</p>

<h3>Ownership: <code>chown</code>, <code>chgrp</code></h3>
<pre><code class="language-bash"># Change both owner and group in one command:
chown &lt;user&gt;:&lt;group&gt; &lt;file&gt;
chown alice:staff notes.txt

# Change just the owner, leave the group as-is:
chown &lt;user&gt; &lt;file&gt;
chown alice notes.txt

# Change just the group (chown also supports this via ":group"):
chgrp &lt;group&gt; &lt;file&gt;
chgrp staff notes.txt

# Recursively apply to a directory tree:
chown -R &lt;user&gt;:&lt;group&gt; &lt;dir&gt;</code></pre>
<p><code>chown</code> ("change owner") reassigns which user (and optionally which group, via the <code>user:group</code> form) owns a file. <code>chgrp</code> ("change group") does the narrower job of changing only the group. Both almost always require elevated privileges (<code>sudo</code>) unless you're changing a file you already own to a group you already belong to — an ordinary user generally can't hand their own files off to someone else's ownership, since that would let you dodge disk-quota or accountability rules by "gifting" files away.</p>

<h3>Who am I, and what can I do: <code>whoami</code>, <code>id</code>, <code>groups</code></h3>
<pre><code class="language-bash"># Print just the current username:
whoami

# Print full identity: UID, GID, and every group you belong to:
id
# uid=1000(alice) gid=1000(alice) groups=1000(alice),27(sudo),1001(staff)

# Print just the group names the current (or a given) user belongs to:
groups
groups &lt;user&gt;
groups bob</code></pre>
<p><code>whoami</code> is the quickest "who is running this shell" check. <code>id</code> gives the complete picture: your numeric user ID (UID), your primary group ID (GID), and the full list of every group you belong to (both primary and supplementary) — this is the command to reach for when debugging "why can't I access this file" permission puzzles, since it shows exactly which group memberships you actually have <em>right now</em> (a group added after your last login won't show up until you log in again, or run <code>newgrp</code>). <code>groups</code> is a narrower, friendlier-formatted version of just the group-name list.</p>

<h3>Managing users and groups: <code>useradd</code>, <code>usermod -aG</code>, <code>passwd</code></h3>
<pre><code class="language-bash"># Create a new user account (typically requires sudo/root):
useradd &lt;user&gt;
sudo useradd -m bob    # -m also creates their home directory

# Add an existing user to an additional (supplementary) group,
# WITHOUT removing them from groups they're already in:
usermod -aG &lt;group&gt; &lt;user&gt;
sudo usermod -aG docker bob

# Set or change a user's password (running it for yourself needs no
# sudo; changing someone else's does):
passwd
sudo passwd bob</code></pre>
<p><code>useradd</code> creates a new user account (on Debian/Ubuntu, the friendlier <code>adduser</code> wraps it with sane interactive defaults — <code>useradd</code> itself is the lower-level, more manual tool present on every distro). <code>usermod -aG &lt;group&gt; &lt;user&gt;</code> adds an existing user to one more group — the <code>-a</code> ("append") flag is critical and easy to forget: running <code>usermod -G &lt;group&gt; &lt;user&gt;</code> <em>without</em> <code>-a</code> replaces the user's <em>entire</em> supplementary group list with just the one group given, silently kicking them out of every other group they were in. <code>passwd</code> sets or changes a password — for your own account it just prompts for the current and new password; changing another user's requires <code>sudo</code>.</p>

<h3>Privilege escalation: <code>sudo</code>, <code>su</code></h3>
<pre><code class="language-bash"># Run a single command as root (prompts for YOUR OWN password, not root's):
sudo &lt;command&gt;
sudo apt update

# Get an interactive root shell for a whole session (use sparingly) —
# these two are NOT equivalent, see below:
sudo -i   # simulates a full LOGIN as root: resets env vars, cd's to
          # root's home directory, runs root's login/profile scripts
sudo -s   # just starts a shell as root, preserving YOUR OWN environment
          # variables and current working directory

# Switch user entirely — prompts for the TARGET user's password:
su &lt;user&gt;
su alice

# Switch to root specifically:
su -</code></pre>
<p><code>sudo</code> ("superuser do") runs a single command with root's privileges, then returns you to your normal account — it authenticates with <em>your own</em> password (not root's), checks a configuration file (<code>/etc/sudoers</code>) to confirm you're allowed to do this, and logs the action, which is why production and shared systems universally prefer it over shared root access. <code>sudo -i</code> and <code>sudo -s</code> both hand you a standing root shell instead of running just one command, but they are not interchangeable: <code>-i</code> ("simulate initial login") resets your environment variables to root's, changes your working directory to root's home, and runs root's login/profile scripts — behaving as if you'd logged in as root from scratch — while <code>-s</code> just starts a shell running as root but preserves your own environment variables and current working directory, doing nothing else "login"-like. <code>su</code> ("substitute/switch user") instead starts a whole new login shell as a different user — <code>su alice</code> switches to alice (prompting for <em>alice's</em> password), and <code>su -</code> (or <code>su root</code>) switches to root, dropping you into a full root shell that stays elevated until you explicitly <code>exit</code>. The practical difference that matters day to day: <code>sudo</code> is scoped to one command and audited per-use; <code>su</code>/<code>sudo -i</code> hands you a standing root shell with no per-command record, which is why the "one command at a time via sudo" pattern is the modern default and <code>su</code> to root is comparatively discouraged.</p>

<h3>Links, revisited: symbolic vs. hard, and inodes</h3>
<pre><code class="language-bash"># Symbolic (soft) link — a small separate file that stores a path
# to its target:
ln -s &lt;target&gt; &lt;linkname&gt;
ln -s /var/log/app.log latest.log

# Hard link — a second directory entry pointing at the exact same
# underlying data (same inode), no -s flag:
ln &lt;target&gt; &lt;linkname&gt;
ln report.txt report-alias.txt

# Plain "ls -l" already shows the hard-link count (the number just
# after the permission string); "-i" only ADDS the inode number:
ls -li report.txt
# 884531 -rw-r--r-- 2 alice staff 512 Jul 5 09:00 report.txt
#   ↑ inode, added by -i          ↑ link count (already in plain ls -l)</code></pre>
<p>Every file's actual data lives in a structure called an <strong>inode</strong> — metadata (owner, permissions, timestamps, and pointers to the data blocks on disk) that's separate from any particular <em>name</em>. A directory entry is just a name mapped to an inode number. A <strong>hard link</strong> (<code>ln</code>, no flag) creates a second name mapped to the <em>same inode</em> — both names are fully equal, neither is "the original," the file's data (and its link count, already visible in plain <code>ls -l</code> output, or via <code>stat</code>) only actually disappears once every hard-linked name pointing to that inode has been removed. A <strong>symbolic link</strong> (<code>ln -s</code>) is a completely different mechanism: it's its own separate inode whose "content" is just a stored path string pointing at the target — the kernel follows that path each time the link is accessed. This difference has real consequences: hard links only work within a single filesystem/partition (inodes are only unique per-filesystem) and can't point at a directory (to prevent filesystem-tree loops); symbolic links can cross filesystems freely and can point at directories, but break (become "dangling") the moment their target is moved, renamed, or deleted — because all they store is a path, with no awareness of whether anything still lives there.</p>

<h3>Finding files: <code>find</code></h3>
<pre><code class="language-bash"># Basic shape — search a starting path, filter with tests:
find &lt;path&gt; &lt;tests...&gt;

# Find by name (exact, case-sensitive):
find &lt;path&gt; -name &lt;pattern&gt;
find . -name "*.log"

# Find by name, case-insensitive:
find . -iname "*.LOG"

# Find by type — f = regular file, d = directory, l = symlink:
find &lt;path&gt; -type &lt;f|d|l&gt;
find /var/log -type f

# Find by modification time — "-mtime -7" = modified in the last 7 days,
# "-mtime +30" = modified more than 30 days ago:
find &lt;path&gt; -mtime &lt;±N&gt;
find . -mtime -7
find /tmp -mtime +30

# Find by size — "+" larger than, "-" smaller than
# (k/M/G suffixes for kilobytes/megabytes/gigabytes):
find &lt;path&gt; -size &lt;±N[kMG]&gt;
find . -size +100M

# Combine tests (implicit AND) and run an action on every match with -exec:
find . -name "*.tmp" -type f -exec rm {} \\;

# {} is replaced with each matched path; "\\;" ends the -exec command
# (runs the command once PER FILE). "+" instead of "\\;" batches many
# matches into fewer command invocations, closer to how xargs works:
find . -name "*.tmp" -exec rm {} +</code></pre>
<p><code>find</code> walks a directory tree recursively and filters what it finds using "tests" combined left to right: <code>-name</code>/<code>-iname</code> match filenames by glob pattern (the latter ignoring case), <code>-type</code> restricts to a specific kind of entry (<code>f</code> file, <code>d</code> directory, <code>l</code> symlink), <code>-mtime</code> filters by last-modified time in whole days (a bare number means exactly that many days ago; <code>-N</code> means "less than N days ago / more recent than"; <code>+N</code> means "more than N days ago / older than"), and <code>-size</code> filters by file size with the same <code>+</code>/<code>-</code> convention plus a unit suffix. <code>-exec &lt;command&gt; {} \\;</code> runs a command once for every single match, substituting <code>{}</code> with that match's path — simple but potentially slow for huge result sets since it launches one process per file; <code>-exec &lt;command&gt; {} +</code> instead batches as many matches as possible onto fewer command invocations, which is faster and is exactly the same idea <code>find ... | xargs &lt;command&gt;</code> achieves piping into a separate tool (xargs is covered properly in the Text Processing & Pipelines topic).</p>

<h3>Finding files by index: <code>locate</code>, <code>updatedb</code></h3>
<pre><code class="language-bash"># Search a prebuilt filename index instead of walking the disk live:
locate &lt;pattern&gt;
locate nginx.conf

# Rebuild that index manually (usually happens automatically via a
# scheduled job; needs sudo since it reads the whole filesystem):
sudo updatedb</code></pre>
<p><code>locate</code> answers "where is this file?" almost instantly by searching a prebuilt database of filenames rather than walking the live filesystem the way <code>find</code> does — dramatically faster on a large disk, at the cost of the results potentially being stale (a file created two minutes ago might not show up yet). <code>updatedb</code> is the command that rebuilds that database by scanning the filesystem; it's normally run automatically on a schedule (commonly once a day via cron, covered in the Processes & Services topic), and you'd only run it manually if you need up-to-the-minute results right now. Rule of thumb: reach for <code>locate</code> for a quick "I know roughly the filename, where is it" lookup; reach for <code>find</code> when you need to filter by type, time, size, or take an action on the results, or when you need results that are certainly current.</p>

<h3>Shell globs — pattern matching before a command ever runs</h3>
<pre><code class="language-bash"># * matches any sequence of characters (including none):
ls *.txt          # every file ending in .txt
rm draft*          # every file starting with "draft"

# ? matches exactly one character:
ls file?.txt       # file1.txt, file2.txt, fileA.txt — not file10.txt

# [abc] matches any ONE character from the set (or range, e.g. [0-9]):
ls file[123].txt   # file1.txt, file2.txt, file3.txt only
ls file[0-9].txt   # any single digit

# {a,b} (brace expansion) expands to multiple literal alternatives —
# technically a separate shell feature from globbing, but used alongside it:
cp file.{txt,bak}   # expands to: cp file.txt file.bak
mkdir -p project/{src,tests,docs}</code></pre>
<p>These patterns are expanded by the <strong>shell itself</strong>, before the command ever runs — <code>ls *.txt</code> never actually gives <code>ls</code> the literal string <code>*.txt</code>; the shell first replaces it with the real list of matching filenames, and <code>ls</code> only ever sees plain filenames as arguments. <code>*</code> and <code>?</code> and <code>[...]</code> are true globs, matched only against filenames that actually exist (a glob with no matches is typically left as the literal pattern text, or errors, depending on shell options); <code>{...}</code> brace expansion is different — it's pure text substitution that happens regardless of whether anything matching exists on disk, which is exactly why it's useful for generating multiple directories or filenames from a template in one shot, as in the <code>mkdir -p project/{src,tests,docs}</code> example above.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Worked Examples', html: `
<h3>Example 1 — Lock down a private SSH key correctly</h3>
<pre><code class="language-bash">ls -l ~/.ssh/id_rsa
# -rw-r--r-- 1 alice staff 2610 Jul  4 10:02 id_rsa
# (world-readable — SSH will actually REFUSE to use a key this open)

chmod 600 ~/.ssh/id_rsa
ls -l ~/.ssh/id_rsa
# -rw------- 1 alice staff 2610 Jul  4 10:02 id_rsa
# (owner rw-, group ---, other --- — exactly what SSH requires)

whoami
# alice
id
# uid=1000(alice) gid=1000(alice) groups=1000(alice),27(sudo)</code></pre>
<p>This is one of the most common real-world <code>chmod</code> uses: SSH clients actively check and reject private keys that are readable by anyone other than the owner, as a safety net against accidentally-shared credentials — <code>chmod 600</code> is the fix every time this error appears.</p>

<h3>Example 2 — Set up a shared project directory for a team</h3>
<pre><code class="language-bash">sudo mkdir /srv/project-x
sudo chown alice:devteam /srv/project-x
sudo chmod 770 /srv/project-x
sudo chmod g+s /srv/project-x
# setgid on a directory: new files/subdirs created inside inherit the
# directory's GROUP (devteam), not the creator's own primary group
ls -ld /srv/project-x
# drwxrws--- 2 alice devteam 4096 Jul  5 11:00 /srv/project-x

sudo usermod -aG devteam bob
groups bob
# bob : bob devteam

# bob logs out and back in (group membership refreshes on new login),
# then as bob:
touch /srv/project-x/notes.txt
ls -l /srv/project-x/notes.txt
# -rw-r--r-- 1 bob devteam 0 Jul  5 11:05 notes.txt</code></pre>
<p><code>chown alice:devteam</code> set both the owning user and the shared group in one step; <code>chmod 770</code> gave the owner and the whole group full access while locking everyone else out entirely (<code>rwx rwx ---</code>); <code>chmod g+s</code> set the directory's <strong>setgid</strong> bit (the <code>s</code> in <code>rws</code> for the group triplet), which makes every new file or subdirectory created inside inherit the directory's group (<code>devteam</code>) instead of the creator's own primary group — without setgid, bob's <code>notes.txt</code> would come out owned <code>bob:bob</code>, not <code>bob:devteam</code>; adding <code>bob</code> to <code>devteam</code> with <code>usermod -aG</code> (note the <code>-a</code>, so bob's other group memberships were preserved) let him work inside the directory without ever needing to be its owner.</p>

<h3>Example 3 — Track down and clean up old temp files with <code>find</code></h3>
<pre><code class="language-bash"># First, just LOOK — never run a destructive command blind:
find /tmp -type f -name "*.cache" -mtime +14
# /tmp/build-4471.cache
# /tmp/session-92a1.cache

# Confirm sizes before deciding whether they're worth clearing:
find /tmp -type f -name "*.cache" -mtime +14 -size +10M
# /tmp/build-4471.cache

# Only once satisfied with what matched, act on it:
find /tmp -type f -name "*.cache" -mtime +14 -exec rm {} \\;

# Verify they're gone:
find /tmp -type f -name "*.cache" -mtime +14
# (no output — nothing left matching)</code></pre>
<p>The pattern here — run the <code>find</code> with no <code>-exec</code> first to see exactly what would be affected, narrow the tests until the result looks right, and only <em>then</em> add <code>-exec</code> — is the standard safe way to use <code>find</code> for any destructive cleanup, for the same reason covered for <code>rm -rf</code> in Topic 1: there's no undo.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '⚠️ Edge Cases', html: `
<div class="callout danger">
  <div class="callout-title">⚠️ <code>chmod 777</code> is (almost) never the right fix</div>
  <p><code>chmod 777</code> — rwx for owner, group, <em>and</em> other — makes a file or directory fully readable, writable, and executable by literally anyone with any access to the machine at all. It's a common "quick fix" beginners reach for when they hit a permission error, because it always makes the error go away — but it does so by removing all access control, which on a shared system or an internet-facing server is a serious security hole (anyone who can reach the file can modify or replace it). The right fix is almost always narrower: figure out which specific bucket (owner/group/other) actually needs the access, and grant only that — e.g. the earlier <code>chmod 770</code> example gave a whole team full access without opening it to the rest of the world. Treat any <code>777</code> you encounter in the wild as worth a second look.</p>
</div>

<h3><code>sudo</code> vs. <code>su</code> — which to reach for</h3>
<p>Both grant elevated privileges, but they differ in scope and auditability, and mixing them up has real consequences. <code>sudo &lt;command&gt;</code> elevates just that one command, authenticating with the <em>caller's own</em> password, and (on most distros) logs every invocation to a system log — this is why it's the standard for day-to-day admin tasks and the only option generally allowed on managed/production servers. <code>su</code> (or <code>sudo -i</code>/<code>sudo -s</code>) instead drops you into a standing shell running fully as the target user (often root) until you explicitly exit — convenient for a long sequence of root commands, but with no per-command audit trail and an easy way to forget you're still elevated and run something destructive without the safety of sudo's per-command friction. Default assumption on any shared or production system: use <code>sudo &lt;command&gt;</code> per action; treat a standing root shell as something to open only when truly needed and exit as soon as possible.</p>

<h3>A symlink whose target has moved — the "dangling link"</h3>
<pre><code class="language-bash">ln -s /var/log/app.log latest.log
mv /var/log/app.log /var/log/app.log.old

ls -l latest.log
# lrwxrwxrwx 1 alice staff 16 Jul  5 09:00 latest.log -> /var/log/app.log
# (the link still exists and still POINTS at the old path...)

cat latest.log
# cat: latest.log: No such file or directory
# (...but the path it points to no longer exists — "dangling")</code></pre>
<p>Because a symbolic link only stores a path — never the actual data — moving, renaming, or deleting its target doesn't update or warn the link in any way; it silently becomes "dangling." <code>ls -l</code> on a dangling link still succeeds and still shows the arrow to the (now-missing) target, but many shells' <code>ls</code> highlight it in a different color and <code>ls -l</code>'s file-size/date columns describe the link itself, not the missing target. Any attempt to actually open, read, or execute through a dangling link fails with a "No such file or directory" error, even though <code>ls</code> shows the link itself existing perfectly fine. Contrast with a hard link: because a hard link points at the same inode rather than a path, moving or renaming the <em>original</em> name has zero effect on a hard-linked name elsewhere — this is the concrete, practical difference between the two link types from Mechanics, not just a theoretical one.</p>

<h3><code>find -exec</code> vs. piping into <code>xargs</code></h3>
<pre><code class="language-bash"># -exec with "\\;" — one command process launched PER matched file:
find . -name "*.log" -exec gzip {} \\;

# -exec with "+" — batches matches into fewer command invocations:
find . -name "*.log" -exec gzip {} +

# Piping into xargs — a separate tool, similar batching behavior to "+":
find . -name "*.log" | xargs gzip</code></pre>
<p><code>find ... -exec &lt;cmd&gt; {} \\;</code> is the simplest form but the slowest at scale: it starts a brand-new process for every single match, which is wasteful when there are thousands of matches. <code>-exec &lt;cmd&gt; {} +</code> (ending in <code>+</code> instead of <code>\\;</code>) fixes that by passing as many matched paths as will fit onto one command line, launching far fewer processes — functionally close to piping into <code>xargs</code>, which does the same batching but as a separate, more configurable tool (its own flags for parallelism, batch size, and handling filenames with spaces — covered properly in the Text Processing &amp; Pipelines topic). One correctness gotcha with piping to <code>xargs</code> in its plain form: filenames containing spaces or newlines can be split incorrectly, since <code>xargs</code> by default treats whitespace as a separator between arguments — <code>find ... -exec ... +</code> doesn't have this problem, since it never re-tokenizes filenames as text.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'cheat-sheet', title: '📋 Cheat Sheet', html: `
<table>
  <thead><tr><th>Command</th><th>Purpose</th><th>Key flags</th></tr></thead>
  <tbody>
    <tr><td><code>ls -l</code></td><td>Show permissions, owner, group, size, date for each entry (hard-link count is already included, right after the permission string)</td><td><code>-li</code> additionally shows the inode number (<code>-i</code>)</td></tr>
    <tr><td><code>chmod</code></td><td>Change a file's read/write/execute permissions</td><td>numeric: <code>755</code>/<code>644</code>/<code>600</code> · symbolic: <code>u/g/o/a</code> + <code>+/-/=</code> + <code>r/w/x</code> · <code>-R</code> recursive</td></tr>
    <tr><td><code>umask</code></td><td>Show or set the default permission mask for new files/dirs</td><td>no arg = show current · e.g. <code>umask 022</code></td></tr>
    <tr><td><code>chown</code></td><td>Change a file's owning user (and optionally group)</td><td><code>user:group</code> sets both · <code>-R</code> recursive</td></tr>
    <tr><td><code>chgrp</code></td><td>Change a file's owning group only</td><td><code>-R</code> recursive</td></tr>
    <tr><td><code>whoami</code></td><td>Print the current username</td><td>—</td></tr>
    <tr><td><code>id</code></td><td>Print UID, GID, and all group memberships</td><td>—</td></tr>
    <tr><td><code>groups</code></td><td>Print the group names a user belongs to</td><td>optional <code>&lt;user&gt;</code> arg for another user</td></tr>
    <tr><td><code>useradd</code></td><td>Create a new user account</td><td><code>-m</code> also create home directory · needs sudo</td></tr>
    <tr><td><code>usermod</code></td><td>Modify an existing user account</td><td><code>-aG &lt;group&gt;</code> append to a group (never omit <code>-a</code>)</td></tr>
    <tr><td><code>passwd</code></td><td>Set or change a user's password</td><td>no arg = your own · <code>&lt;user&gt;</code> = another (needs sudo)</td></tr>
    <tr><td><code>sudo</code></td><td>Run one command with root privileges</td><td><code>-i</code> standing root shell, full login simulation (resets env, cd's home) · <code>-s</code> standing root shell, keeps your env/cwd · uses your own password</td></tr>
    <tr><td><code>su</code></td><td>Switch to another user's (or root's) login shell</td><td><code>su -</code> switch to root · uses the target user's password</td></tr>
    <tr><td><code>ln</code></td><td>Create a link to an existing file</td><td><code>-s</code> symbolic (path-based, crosses filesystems) · no flag = hard link (same inode)</td></tr>
    <tr><td><code>find</code></td><td>Recursively search a directory tree with filters</td><td><code>-name</code>/<code>-iname</code> · <code>-type f/d/l</code> · <code>-mtime ±N</code> · <code>-size ±N[kMG]</code> · <code>-exec ... {} \\;</code> or <code>+</code></td></tr>
    <tr><td><code>locate</code></td><td>Fast filename search against a prebuilt index</td><td>results may be stale until next <code>updatedb</code> run</td></tr>
    <tr><td><code>updatedb</code></td><td>Rebuild the <code>locate</code> filename index</td><td>needs sudo · usually scheduled automatically</td></tr>
    <tr><td>Globs</td><td>Shell-expanded filename patterns</td><td><code>*</code> any chars · <code>?</code> one char · <code>[abc]</code>/<code>[0-9]</code> one of a set · <code>{a,b}</code> brace expansion (literal, not disk-matched)</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">What does <code>chmod 755</code> actually mean? Walk through the numbers.</div>
<div class="qa-a">
<p>Each of the three digits is one "who" bucket — owner, group, other, in that order — and each digit is the sum of read (4), write (2), and execute (1) for whichever of those are turned on in that bucket. <code>7</code> = 4+2+1 = <code>rwx</code> (owner gets full access), <code>5</code> = 4+1 = <code>r-x</code> (group can read and execute/enter, but not write), and the second <code>5</code> = <code>r-x</code> again for other. So <code>755</code> reads as "owner: read/write/execute; group: read/execute; other: read/execute" — the standard permission set for an executable script or a directory that everyone needs to use but only the owner should be able to modify. <code>644</code> (rw-, r--, r--) is the equivalent for an ordinary document, and <code>600</code> (rw-, ---, ---) locks a file down to the owner alone — the mode required for private SSH keys.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">When would you use <code>chmod</code>'s symbolic mode instead of numeric mode?</div>
<div class="qa-a">
<p>Numeric mode (<code>755</code>, <code>644</code>...) sets <em>all nine bits at once</em> — you have to know and restate the complete permission set you want, including bits you're not actually trying to change. Symbolic mode (<code>u+x</code>, <code>go-w</code>, <code>a+r</code>...) adjusts specific bits <em>relative</em> to whatever they currently are, without touching anything else — so <code>chmod +x script.sh</code> just adds execute permission and leaves every other bit exactly as it was, which is safer and clearer when you only want one targeted change and don't want to accidentally reset something else (like a group permission someone else set intentionally). Numeric mode is better when you want to state the complete, unambiguous permission set from scratch.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between <code>sudo</code> and <code>su</code>?</div>
<div class="qa-a">
<p><code>sudo &lt;command&gt;</code> runs a single command with root's (or another specified user's) privileges, authenticating with the <em>caller's own</em> password, then immediately returns to the normal user — and it's logged per-invocation, which is why it's the standard for auditable, day-to-day privileged actions. <code>su &lt;user&gt;</code> switches the entire shell session to that user (prompting for the <em>target</em> user's password), and stays elevated until an explicit <code>exit</code> — <code>su -</code> specifically switches to root. The practical trade-off: <code>sudo</code> is scoped and audited per command; <code>su</code>/<code>sudo -i</code> gives a standing elevated shell with no per-command record, which is why <code>sudo</code> per action is the modern default and direct root logins/<code>su</code> are comparatively discouraged on managed systems.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between a symbolic link and a hard link?</div>
<div class="qa-a">
<p>A hard link is a second directory entry (name) pointing at the exact same underlying inode as the original — both names are fully equal, there's no "original" and "copy," the data only actually disappears once every hard-linked name to that inode is removed, and it only works within a single filesystem and can't target a directory. A symbolic (soft) link is a different, separate file whose content is just a stored path string pointing at the target; the kernel follows that path each time the link is used, it can cross filesystems and can point at directories, but it breaks ("dangling link") the instant its target is moved, renamed, or deleted, since all it has is a path with no built-in awareness of whether that path still resolves to anything.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">How would you find all files larger than 100MB modified in the last week, and delete them?</div>
<div class="qa-a">
<p>Start by just looking, never acting blind: <code>find &lt;path&gt; -type f -size +100M -mtime -7</code> — <code>-type f</code> restricts to regular files, <code>-size +100M</code> filters to files over 100 megabytes, and <code>-mtime -7</code> filters to files modified within the last 7 days (the leading <code>-</code> means "less than," so "more recent than 7 days ago"). Once the listed results look correct, add an action: <code>find &lt;path&gt; -type f -size +100M -mtime -7 -exec rm {} \\;</code> — <code>{}</code> is replaced with each match's path, and <code>\\;</code> ends the per-file <code>-exec</code> invocation (or <code>+</code> at the end instead, to batch multiple matches into fewer <code>rm</code> invocations). The key interview point is the workflow, not just the syntax: always run the <code>find</code> without <code>-exec</code> first to confirm exactly what would be affected before attaching a destructive action.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Why does <code>usermod -aG &lt;group&gt; &lt;user&gt;</code> need the <code>-a</code> flag, specifically?</div>
<div class="qa-a">
<p><code>-G &lt;group&gt;</code> alone sets a user's <em>complete</em> supplementary group list to exactly what's given — so <code>usermod -G docker bob</code>, without <code>-a</code>, silently removes bob from every other group he was previously in and leaves him in <code>docker</code> alone. <code>-a</code> means "append": it adds the given group to bob's existing list without touching the rest. In practice, <code>usermod -aG</code> (append, group) is almost always the pair you want when the goal is "grant one additional group membership" — omitting <code>-a</code> is a classic, easy-to-miss way to accidentally revoke a user's other access while trying to grant new access.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Why might you avoid <code>chmod 777</code> even if it makes a permission error go away?</div>
<div class="qa-a">
<p><code>777</code> grants read, write, and execute to owner, group, <em>and</em> other — every single account on the machine (or, on a misconfigured internet-facing service, potentially every remote request that reaches the file) gets full read/write/execute access. It reliably "fixes" permission-denied errors because it removes all access control, not because it identifies the actual cause — the real fix is almost always to grant access to just the specific bucket (owner, or a specific group) that genuinely needs it, which is why <code>777</code> in a codebase or server configuration is a near-universal red flag during a security review.</p>
</div>
</div>
`}

]});
