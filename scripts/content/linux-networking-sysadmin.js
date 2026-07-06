window.PREP_SITE.registerTopic({
  id: 'linux-networking-sysadmin',
  module: 'linux',
  title: 'Networking, Packages & Sysadmin',
  estimatedReadTime: '32 min',
  tags: ['linux', 'networking', 'sysadmin', 'packages', 'ssh', 'devops'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>This is the "day-2 operations" topic: once you can navigate a filesystem, manage permissions, pipe text around, control processes, and script the shell, the last skill set is talking to <em>other</em> machines and keeping <em>this</em> machine healthy — networking, remote access, installing software, watching disk space, reading logs, and packing files up for transport.</p>
<ul>
  <li><strong>Networking basics:</strong> <code>ip a</code> / <code>ip r</code> tell you your machine's addresses and routes; <code>ss -tulpn</code> tells you what's listening on which ports; <code>ping</code>, <code>curl</code>/<code>wget</code>, and <code>dig</code>/<code>host</code>/<code>nslookup</code> let you test reachability, fetch data over HTTP, and query DNS.</li>
  <li><strong>Remote access & transfer:</strong> <code>ssh user@&lt;host&gt;</code> gives you an encrypted remote shell; <code>scp</code> and <code>rsync -avz</code> copy files over that same encrypted channel — <code>rsync</code> additionally only transfers what changed.</li>
  <li><strong>Package managers differ per distro, same three verbs everywhere:</strong> update the local index of what's available, install a package, remove a package. Debian/Ubuntu uses <code>apt</code>, Fedora/RHEL uses <code>dnf</code> (or the older <code>yum</code>), Arch uses <code>pacman</code>. Different spelling, identical job — covered with a full equivalence table below.</li>
  <li><strong>Disks, environment, logs, archives:</strong> <code>df -h</code>/<code>du -sh</code>/<code>lsblk</code>/<code>mount</code> for storage; <code>env</code>/<code>export</code>/<code>$PATH</code>/<code>~/.bashrc</code> vs <code>~/.profile</code> for how your shell environment is built; <code>journalctl</code> and <code>/var/log</code> for what happened and when; <code>tar</code>/<code>gzip</code>/<code>zip</code> for bundling and compressing files to move around.</li>
  <li><strong>This is the last hands-on Linux topic before the command reference.</strong> Everything here assumes you're already comfortable with the filesystem, permissions, pipelines, and processes from earlier topics — this one is about reaching outside a single machine and keeping it running.</li>
</ul>
<p><strong>Mantra:</strong> "Every server is just a machine you reach over SSH, every package manager does the same three things with different spelling, and every problem leaves a trace in a log somewhere."</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why this is the topic that turns "I know Linux commands" into "I can run a server"</h3>
<p>Everything in earlier topics happens on one machine, talking to files that already exist. Real infrastructure work is different: your code needs to run on a server you've never physically touched, talk to other services over a network, have its dependencies installed correctly, and keep running while you're asleep. That requires a distinct set of skills:</p>
<ul>
  <li><strong>Reaching a remote machine at all.</strong> Production servers, cloud VMs, and Raspberry Pis almost never have a screen attached. <code>ssh</code> is the door in — everything else (deploying code, reading logs, restarting a service) happens after you're through that door.</li>
  <li><strong>Moving things between machines.</strong> Once you're in, you need to get files there (a build artifact, a config file, a database dump) and back (logs, backups). <code>scp</code> and <code>rsync</code> are how that happens without touching a GUI file-transfer client.</li>
  <li><strong>Diagnosing "it doesn't work."</strong> "The server isn't responding" could mean the network is down, the wrong port is open, DNS is misconfigured, or the process crashed. <code>ping</code>, <code>ss</code>, <code>curl</code>, and <code>dig</code> are the tools that narrow "it doesn't work" down to a specific layer.</li>
  <li><strong>Installing software without a distro-specific tutorial every time.</strong> Every server needs packages installed — a database driver, a runtime, a monitoring agent — and the command for that depends entirely on which distro it's running. Knowing the shape (update → install → remove, and how to search) rather than memorizing one distro's exact spelling transfers everywhere.</li>
  <li><strong>Keeping the lights on.</strong> Disks fill up, environment variables go missing in a fresh shell, and something eventually breaks at 3am. <code>df</code>, <code>du</code>, <code>journalctl</code>, and <code>/var/log</code> are how you find out what happened — usually the first thing anyone does when paged.</li>
</ul>

<h3>Why package managers exist, and why there isn't just one</h3>
<p>Installing software by hand means downloading a binary, figuring out its dependencies, downloading <em>those</em>, and hoping nothing conflicts with what's already on the system. A <strong>package manager</strong> automates all of that: it keeps a local index of available packages and their dependencies, fetches from a trusted repository, resolves dependency chains automatically, and keeps a record of what's installed so it can cleanly remove things later. Every mainstream distro ships with one — but different distro families made different technical choices decades ago (different package file formats, different dependency-resolution engines), and those choices stuck. The practical result: the same three operations — refresh the index, install, remove — exist under different command names depending on the distro family. This module treats that as a pattern to recognize rather than three unrelated tools to memorize from scratch.</p>

<h3>Why remote work happens over SSH specifically</h3>
<p>Early remote-login tools (like <code>telnet</code> and <code>rsh</code>) sent everything — including your password — as plain, unencrypted text over the network, readable by anyone able to intercept the traffic. <strong>SSH</strong> ("Secure SHell") replaced them by encrypting the entire session and supporting public-key authentication that never sends a secret over the wire at all. Because <code>ssh</code> establishes a secure, authenticated channel, both <code>scp</code> and <code>rsync</code> are built to run <em>over</em> an SSH connection rather than invent their own transport security — one secure channel, reused for remote shells, file copies, and even port forwarding.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>A request to a remote machine has layers — know which one broke</h3>
<p>"The server isn't responding" can fail at several distinct layers, and the diagnostic tools each target one of them. Working top-down through this list is the single most useful troubleshooting habit in this whole topic:</p>
<pre><code class="language-text">Your machine                         The network                    Remote machine
─────────────                        ───────────                    ───────────────
Do I have an IP/route?      ip a / ip r
                                 │
Can I reach it at all?          ping &lt;host&gt;  ──────────────────►   (ICMP echo)
                                 │
Is a name resolving to an IP?   dig / host / nslookup  ─────────►   (DNS server)
                                 │
Is the right port open there?                                       ss -tulpn (run ON the remote host)
                                 │
Does the service answer HTTP?   curl -I &lt;url&gt;  ────────────────►   (web server / API)
</code></pre>
<p>Notice <code>ss</code> is the odd one out — it's not something you run <em>against</em> a remote host, it's something you run <em>on</em> a machine to see what's listening locally. When a teammate says "the API isn't responding," the useful sequence is: can I resolve the name (<code>dig</code>)? can I reach the host at all (<code>ping</code>)? is anything actually listening on that port <em>on the server itself</em> (<code>ss -tulpn</code>, over an SSH session)? does the HTTP layer respond (<code>curl -I</code>)? Each "no" tells you exactly which layer to fix.</p>

<h3>A package manager is three things wearing a trenchcoat</h3>
<p>Every package manager covered here is really three pieces bundled behind one command name: <strong>(1)</strong> a local index — a cached list of what packages exist and what versions, stored on your disk; <strong>(2)</strong> a remote repository — the actual server(s) hosting package files, trusted and configured ahead of time; and <strong>(3)</strong> a local database of what's currently installed, so the tool knows what it can safely remove or upgrade. "Updating" (in the <code>apt</code> sense) refreshes piece (1) from piece (2) — it does <em>not</em> by itself install anything newer; "installing" fetches a package from (2), resolves its dependencies against (1), and records the result in (3). Every distro's package manager does this same three-part dance; only the exact subcommand spelling changes.</p>

<h3><code>$PATH</code> is a search list, walked in order, first match wins</h3>
<p>When you type a bare command name like <code>python</code> or <code>node</code>, the shell doesn't magically know where that program lives — it walks the directories listed in the <code>PATH</code> environment variable, in order, left to right, and runs the first executable it finds with that name. This is exactly the same "ordered list, first match wins" idea as searching for a file — except here the shell is searching directories for a matching program name instead of you searching a directory listing with your eyes. It's why the same command name can silently mean two different programs on two different machines (or in two different shells on the same machine): whichever one is found first in <code>PATH</code> wins, and later matches are never even considered.</p>

<h3>Two logging worlds coexist: the journal, and plain text files</h3>
<p>Modern Linux distros using <strong>systemd</strong> (the init system that starts everything at boot — covered in the Processes & Services topic) keep a structured, binary, queryable log called <strong>the journal</strong>, read with <code>journalctl</code>. Alongside it, many applications (web servers, databases, cron, and older tools) still write their own plain-text log files under <strong>/var/log</strong>, readable with the same <code>cat</code>/<code>less</code>/<code>tail</code> tools from earlier topics. In practice you'll use both: <code>journalctl -u &lt;service&gt;</code> for anything managed by systemd, and <code>tail -f /var/log/&lt;something&gt;.log</code> for anything that logs to its own file. Neither one fully replaced the other — knowing which world a given piece of software logs to is half the battle when debugging.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Interfaces and routes: <code>ip a</code>, <code>ip r</code> (legacy: <code>ifconfig</code>, <code>route</code>)</h3>
<pre><code class="language-bash"># Show every network interface and its assigned IP address(es):
ip a
# (short for "ip address show" — ip addr / ip address also work)

# Show the routing table — which network(s) go through which interface,
# and which route is the default (used for anything not matched more specifically):
ip r
# (short for "ip route show")</code></pre>
<p><code>ip</code> is the modern tool (part of the <strong>iproute2</strong> package) for inspecting and configuring networking, and is what you'll find preinstalled on essentially every current distro. <code>ip a</code> answers "what IP address(es) does this machine have, on which interface(s)?" — look for <code>lo</code> (the loopback interface, always <code>127.0.0.1</code>) and something like <code>eth0</code>/<code>enp0s3</code>/<code>wlan0</code> for the real network connection. <code>ip r</code> answers "where does traffic actually go?" — the line marked <code>default via &lt;gateway-ip&gt;</code> is the route used for anything outside your local network.</p>
<div class="callout info">
  <div class="callout-title">Legacy equivalents you'll still see in older docs and scripts</div>
  <p><code>ifconfig</code> (interfaces) and <code>route</code> (routing table) — from the older <strong>net-tools</strong> package — did the same jobs before <code>iproute2</code> replaced them. They're deprecated and increasingly <em>not installed by default</em> on modern distros, but plenty of tutorials, scripts, and older sysadmins still reference them, so recognize <code>ifconfig</code> ≈ <code>ip a</code> and <code>route -n</code> ≈ <code>ip r</code> even if you always reach for the newer tool yourself.</p>
</div>

<h3>What's listening? <code>ss -tulpn</code> (legacy: <code>netstat</code>)</h3>
<pre><code class="language-bash">ss -tulpn</code></pre>
<p>Break down the flags individually: <code>-t</code> shows TCP sockets, <code>-u</code> shows UDP sockets, <code>-l</code> restricts the listing to sockets that are <em>listening</em> (waiting for incoming connections, rather than an already-established connection), <code>-p</code> shows the process (name and PID) that owns each socket, and <code>-n</code> shows numeric ports and addresses instead of resolving them to service/host names (faster, and avoids surprising DNS lookups). Together, <code>ss -tulpn</code> answers the single most common sysadmin question: "what's listening on this machine, and what process owns it?" — invaluable when a service fails to start because something else is already bound to its port. Root privileges (<code>sudo</code>) are usually needed to see the process name/PID for sockets owned by other users.</p>
<div class="callout info">
  <div class="callout-title">Legacy equivalent: <code>netstat</code></div>
  <p><code>netstat -tulpn</code> — same flags, same meaning — is the older tool <code>ss</code> was written to replace (also part of the deprecated net-tools package). <code>ss</code> is faster and is what current distros ship by default, but <code>netstat -tulpn</code> is common enough in older documentation and muscle memory that recognizing it is worthwhile even if you type <code>ss</code> yourself.</p>
</div>

<h3>Basic reachability: <code>ping</code></h3>
<pre><code class="language-bash"># Send ICMP echo requests to a host, printing a reply line each time one comes back;
# Ctrl+C to stop and print summary statistics:
ping &lt;host&gt;
ping 8.8.8.8
ping example.com

# Send a fixed number of pings and stop automatically:
ping -c 4 example.com</code></pre>
<p><code>ping</code> is the simplest possible reachability test: "is there anything alive at this address, and how long does a round trip take?" It tells you nothing about a specific service or port — only whether the network path to the host is up at all. Some hosts and firewalls deliberately block ICMP (the protocol <code>ping</code> uses) for security reasons, so "ping fails" doesn't always mean "host is down" — it can also mean "ping is blocked but the actual service is fine." <code>-c &lt;n&gt;</code> caps the number of pings sent instead of running until you interrupt it, which is the better default for scripts.</p>

<h3>Fetching over HTTP: <code>curl</code> and <code>wget</code></h3>
<pre><code class="language-bash"># Fetch a URL and print its body to the terminal:
curl &lt;url&gt;
curl https://example.com

# -I: fetch only the response HEADERS (a HEAD request) — no body at all;
# fast way to check status code, content type, server, etc.:
curl -I &lt;url&gt;

# -L: follow redirects (3xx responses) instead of stopping at the first one —
# curl does NOT follow redirects by default:
curl -L &lt;url&gt;

# -o: write the response body to a file instead of stdout:
curl -o &lt;file&gt; &lt;url&gt;
curl -o page.html https://example.com

# -X: set the HTTP method explicitly (GET is the default) — POST, PUT, DELETE, etc.:
curl -X POST &lt;url&gt;

# -H: add a custom request header (repeatable — pass -H multiple times for multiple headers):
curl -H "&lt;header-name&gt;: &lt;header-value&gt;" &lt;url&gt;
curl -X POST -H "Content-Type: application/json" &lt;url&gt;

# wget: simpler by default for straightforward downloads — saves to a local file
# named after the URL automatically, and resumes/retries more readily than curl:
wget &lt;url&gt;
wget https://example.com/file.tar.gz</code></pre>
<p><code>curl</code> is the general-purpose tool for talking to any URL from the command line — testing an API, downloading a file, or scripting an HTTP request as part of a larger pipeline. Its flags combine freely: checking whether an endpoint is up without downloading a large body is <code>curl -I &lt;url&gt;</code>; sending an authenticated POST with a JSON body is typically <code>curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer &lt;token&gt;" -d '...' &lt;url&gt;</code>. <code>wget</code> overlaps heavily with plain <code>curl &lt;url&gt; -o &lt;file&gt;</code> for the specific job of "download this file to disk" — it defaults to saving straight to a file (rather than dumping to the terminal), follows redirects by default, and is a common choice for scripted, unattended downloads and simple mirroring; <code>curl</code> is the better choice the moment you need fine control over headers, methods, or the request body.</p>

<h3>Remote shell access: <code>ssh</code></h3>
<pre><code class="language-bash"># Open an interactive shell on a remote machine, authenticating as &lt;user&gt;:
ssh &lt;user&gt;@&lt;host&gt;
ssh alice@203.0.113.10

# Use a specific private key file instead of the default (~/.ssh/id_rsa, id_ed25519, etc.):
ssh -i &lt;key-file&gt; &lt;user&gt;@&lt;host&gt;
ssh -i ~/.ssh/deploy_key alice@203.0.113.10

# Run a single command on the remote host and return, without staying logged in:
ssh &lt;user&gt;@&lt;host&gt; &lt;command&gt;
ssh alice@203.0.113.10 "df -h"</code></pre>
<p><code>ssh</code> ("Secure SHell") opens an encrypted, authenticated connection to a remote machine and drops you into a shell there — every command you type after that runs <em>on the remote machine</em>, not your own. Authentication is normally by <strong>key pair</strong> rather than password: you generate a private key (kept secret, never shared) and a matching public key (added to <code>~/.ssh/authorized_keys</code> on the server); the server challenges your client to prove it holds the private key without ever transmitting it. <code>-i &lt;key-file&gt;</code> tells <code>ssh</code> to use a specific private key instead of the defaults it checks automatically — common when managing several servers each with their own dedicated key. Rather than typing the full <code>user@host -i key</code> combination every time, <code>~/.ssh/config</code> lets you define a short alias (host nickname, user, key file, port) once and just type <code>ssh &lt;alias&gt;</code> afterward.</p>

<h3>Copying files to/from a remote machine: <code>scp</code>, <code>rsync -avz</code></h3>
<pre><code class="language-bash"># Copy a local file TO a remote machine:
scp &lt;local-file&gt; &lt;user&gt;@&lt;host&gt;:&lt;remote-path&gt;
scp build.zip alice@203.0.113.10:/home/alice/

# Copy a file FROM a remote machine back to your local machine:
scp &lt;user&gt;@&lt;host&gt;:&lt;remote-path&gt; &lt;local-destination&gt;
scp alice@203.0.113.10:/var/log/app.log ./app.log

# Copy a whole directory recursively:
scp -r &lt;local-dir&gt; &lt;user&gt;@&lt;host&gt;:&lt;remote-path&gt;

# rsync: sync a local directory to a remote one, transferring only what changed —
# -a (archive: recursive + preserve permissions/timestamps/symlinks), -v (verbose),
# -z (compress data in transit):
rsync -avz &lt;local-dir&gt;/ &lt;user&gt;@&lt;host&gt;:&lt;remote-path&gt;
rsync -avz ./dist/ alice@203.0.113.10:/var/www/app/</code></pre>
<p>Both tools move files over the same encrypted SSH channel as <code>ssh</code> itself — no separate protocol or credentials to configure, assuming SSH access already works. <code>scp</code> ("secure copy") is the simpler of the two: a straightforward, one-shot copy, closest in spirit to <code>cp</code> but across machines. <code>rsync</code> is the tool of choice for anything repeated — deploying an updated build, syncing a backup nightly — because it compares source and destination first and transfers only the differences (new or changed files), rather than re-sending everything every time; <code>-a</code> alone bundles the sensible defaults (recursive, preserving permissions/ownership/timestamps/symlinks) that you'd otherwise have to specify individually, <code>-v</code> prints what's being transferred, and <code>-z</code> compresses data on the wire, helpful over slow or metered links. The trailing slash on the source directory in the example above matters: <code>dist/</code> (with the slash) copies the <em>contents</em> of <code>dist</code> into the destination, while <code>dist</code> (no slash) would create a <code>dist</code> subdirectory inside the destination instead.</p>

<h3>DNS lookups: <code>dig</code>, <code>host</code>, <code>nslookup</code></h3>
<pre><code class="language-bash"># Full, detailed DNS query — shows the ANSWER section, query time, which
# DNS server responded, TTL, and more:
dig &lt;host&gt;
dig example.com

# Just the resolved IP address(es), nothing else:
dig +short &lt;host&gt;

# Quick, simple one-line lookup — less detail than dig, easier to read at a glance:
host &lt;host&gt;
host example.com

# Older, interactive-capable lookup tool — still preinstalled on many systems
# and familiar to anyone coming from Windows, where it's also available:
nslookup &lt;host&gt;</code></pre>
<p>All three answer the same underlying question — "what IP address does this domain name resolve to?" — with different amounts of detail. <code>dig</code> ("domain information groper") is the most detailed and the one favored for real troubleshooting: full sections for the question asked, the answer received, which name server answered, and timing — <code>dig +short</code> trims all of that down to just the IP when that's all you need. <code>host</code> is a deliberately terse, quick-glance tool for the common case. <code>nslookup</code> predates both and behaves slightly differently across systems (and is technically deprecated on some Linux distros in favor of <code>dig</code>/<code>host</code>), but remains widely available and widely used out of habit, especially by people who also work on Windows or macOS where it's a first-class tool.</p>

<h3>Package managers, by distro family</h3>
<p>Every package manager below performs the same three core actions — refresh the local package index, install a package, remove a package — under different names, plus a search command for finding a package when you don't know its exact name.</p>
<pre><code class="language-bash"># ── Debian / Ubuntu — apt (and the older apt-get / apt-cache) ──
sudo apt update                  # refresh the local package index from repositories
sudo apt install &lt;package&gt;       # install a package (and its dependencies)
sudo apt remove &lt;package&gt;        # remove a package (keep its config files)
apt search &lt;keyword&gt;             # search available packages by keyword

# ── Fedora / RHEL / CentOS — dnf (and the older, still-common yum) ──
sudo dnf install &lt;package&gt;       # dnf auto-refreshes its cache as needed — no separate "update index" step
sudo dnf remove &lt;package&gt;
dnf search &lt;keyword&gt;
sudo dnf upgrade                  # upgrade all installed packages to latest available
# yum uses the identical subcommands on older RHEL/CentOS systems:
sudo yum install &lt;package&gt;
sudo yum remove &lt;package&gt;

# ── Arch Linux — pacman ──
sudo pacman -Syu                 # sync repo metadata AND upgrade the whole system in one step
sudo pacman -S &lt;package&gt;         # install a package ("-S" = sync/install)
sudo pacman -R &lt;package&gt;         # remove a package
pacman -Ss &lt;keyword&gt;             # search available packages by keyword</code></pre>
<table>
  <thead><tr><th>Action</th><th>Debian/Ubuntu (<code>apt</code>)</th><th>Fedora/RHEL (<code>dnf</code>/<code>yum</code>)</th><th>Arch (<code>pacman</code>)</th></tr></thead>
  <tbody>
    <tr><td>Refresh package index</td><td><code>apt update</code></td><td>automatic (<code>dnf</code> refreshes as needed)</td><td><code>pacman -Sy</code> (bundled into <code>-Syu</code>)</td></tr>
    <tr><td>Install a package</td><td><code>apt install &lt;pkg&gt;</code></td><td><code>dnf install &lt;pkg&gt;</code> / <code>yum install &lt;pkg&gt;</code></td><td><code>pacman -S &lt;pkg&gt;</code></td></tr>
    <tr><td>Remove a package</td><td><code>apt remove &lt;pkg&gt;</code></td><td><code>dnf remove &lt;pkg&gt;</code> / <code>yum remove &lt;pkg&gt;</code></td><td><code>pacman -R &lt;pkg&gt;</code></td></tr>
    <tr><td>Search for a package</td><td><code>apt search &lt;kw&gt;</code></td><td><code>dnf search &lt;kw&gt;</code></td><td><code>pacman -Ss &lt;kw&gt;</code></td></tr>
    <tr><td>Upgrade everything</td><td><code>apt upgrade</code></td><td><code>dnf upgrade</code></td><td><code>pacman -Syu</code></td></tr>
  </tbody>
</table>
<p><code>apt</code> is the friendly, modern front-end Debian/Ubuntu users type day to day; <code>apt-get</code> and <code>apt-cache</code> are its older, more script-friendly ancestors (still used inside scripts and Dockerfiles for more stable/predictable output) and largely overlap with what <code>apt</code> now does in one combined tool. <code>dnf</code> ("Dandified YUM") is the modern successor to <code>yum</code> on Fedora/RHEL-family systems — same command shape, better dependency resolution — and is why you'll see both spellings depending on how old the system is. <code>pacman</code> stands apart syntactically: instead of separate word-like subcommands, it uses single-letter flags combined together (<code>-Syu</code> = sync + refresh + upgrade, all at once) — the most common Arch gotcha for people coming from <code>apt</code>/<code>dnf</code> is expecting three separate commands where Arch users habitually run one.</p>

<h3>Disks: <code>df -h</code>, <code>du -sh</code>, <code>lsblk</code>, <code>mount</code>/<code>umount</code></h3>
<pre><code class="language-bash"># Show free/used space per mounted filesystem, human-readable sizes:
df -h

# Show the total size of a directory (recursively summed), human-readable —
# without -s, du prints a line for every subdirectory instead of one summary total:
du -sh &lt;dir&gt;
du -sh /var/log

# List block devices (disks and their partitions) as a tree, with sizes and
# current mountpoints:
lsblk

# Attach a filesystem (a device, or a partition) to a directory in the tree
# so its contents become accessible there:
sudo mount &lt;device&gt; &lt;mountpoint&gt;
sudo mount /dev/sdb1 /mnt/usb

# Detach it again — always do this before physically removing external media:
sudo umount &lt;mountpoint&gt;
sudo umount /mnt/usb</code></pre>
<p><code>df</code> ("disk free") answers "how much space is left on each filesystem?" at the filesystem level. <code>du</code> ("disk usage") answers a different question — "how much space does this specific directory's contents actually take up?" — by walking the directory tree and summing file sizes; <code>-s</code> collapses that into a single total instead of a line per subdirectory, and is what you want almost every time. <code>lsblk</code> gives the physical picture — every disk and partition Linux knows about, and where (if anywhere) each one is currently mounted — the natural first stop before mounting or unmounting anything. <code>mount</code>/<code>umount</code> attach and detach a filesystem from the single directory tree (recall "everything is one tree, rooted at <code>/</code>" from the Fundamentals topic) — a freshly plugged-in USB drive or an extra disk isn't usable until it's mounted somewhere, and unmounting cleanly before removal avoids corrupting data still being written. Persistent, boot-time mounts are configured in <code>/etc/fstab</code> rather than run manually each time — worth knowing the name even if you rarely edit it directly.</p>

<h3>Environment and <code>PATH</code>: <code>env</code>, <code>export</code>, <code>echo $PATH</code>, <code>~/.bashrc</code> vs <code>~/.profile</code></h3>
<pre><code class="language-bash"># Print every environment variable currently set:
env

# Set an environment variable for the CURRENT shell only — child processes
# started from here will NOT inherit it:
MY_VAR=hello

# export: mark a variable so it IS inherited by any command/program launched
# from this shell from now on:
export MY_VAR=hello
export PATH="$PATH:/opt/mytool/bin"

# Print the PATH variable — a colon-separated, ordered list of directories
# the shell searches (in order, left to right) when you type a bare command name:
echo $PATH
# /usr/local/bin:/usr/bin:/bin:/home/alice/.local/bin</code></pre>
<p><code>env</code> with no arguments dumps the full current environment — useful for confirming a variable actually made it into a script's or program's environment. Plain <code>VAR=value</code> only exists in the current shell; <code>export VAR=value</code> additionally marks it to be copied into the environment of any program that shell launches afterward (a script run from that shell, for instance) — the difference between "I can see it" and "programs I start can see it too." <code>echo $PATH</code> shows the exact search list behind the mental model above: adding a directory temporarily is <code>export PATH="$PATH:/new/dir"</code> (appending, so existing matches still win) or <code>export PATH="/new/dir:$PATH"</code> (prepending, so the new directory is checked <em>first</em> and can override an existing command of the same name).</p>
<p><code>~/.bashrc</code> and <code>~/.profile</code> (or its bash-specific variant, <code>~/.bash_profile</code>) both configure your shell environment, but run at different times: <strong><code>~/.bashrc</code></strong> runs every time a new <em>interactive, non-login</em> bash shell starts — the everyday case of opening a new terminal window or tab on a machine you're already logged into. <strong><code>~/.profile</code></strong> (or <code>~/.bash_profile</code>) runs once, at <em>login</em> — logging into a text console, or starting a fresh session over SSH. Many distros' default <code>~/.bash_profile</code> simply sources <code>~/.bashrc</code> itself, which is why the distinction is easy to overlook for years — until you set something in <code>~/.bashrc</code>, expect it to apply over a fresh SSH connection, and find it silently doesn't, because that connection started a login shell that never read <code>.bashrc</code> at all.</p>

<h3>Logs: <code>journalctl</code>, <code>/var/log</code>, <code>tail -f</code></h3>
<pre><code class="language-bash"># Show the systemd journal (all services), most recent entries at the bottom:
journalctl

# Show logs for one specific systemd-managed service:
journalctl -u &lt;service&gt;
journalctl -u nginx

# Follow the journal live, like tail -f, for new entries as they happen:
journalctl -f

# Show only the most recent boot's logs:
journalctl -b

# Traditional plain-text logs still live here on most distros — browse with
# the same cat/less/tail tools covered in the Fundamentals topic:
ls /var/log
tail -f /var/log/syslog
tail -f /var/log/nginx/access.log</code></pre>
<p><code>journalctl</code> queries systemd's structured, binary journal — a single, searchable place covering every systemd-managed service's stdout/stderr and system-level events, without needing to know which log file (if any) a given service writes to. <code>-u &lt;service&gt;</code> filters to one unit, <code>-f</code> follows live exactly like <code>tail -f</code> does for a plain file, and <code>-b</code> scopes to the current boot — handy after a restart when you only care about "since it last came up." <code>/var/log</code> is the older, still very much alive convention: many applications (and the kernel itself, via <code>dmesg</code>) write directly to plain-text files there, which you read with the exact same <code>cat</code>/<code>less</code>/<code>tail -f</code> tools from the Fundamentals topic — no new syntax needed, just knowing where to point them.</p>

<h3>Archives: <code>tar</code>, <code>gzip</code>/<code>gunzip</code>, <code>zip</code>/<code>unzip</code></h3>
<pre><code class="language-bash"># Create (c) a gzip-compressed (z) archive, verbosely (v), to a file (f):
tar -czvf &lt;archive&gt;.tar.gz &lt;dir-or-files&gt;
tar -czvf backup.tar.gz projects/

# Extract (x) a gzip-compressed (z) archive, verbosely (v), from a file (f):
tar -xzvf &lt;archive&gt;.tar.gz
tar -xzvf backup.tar.gz

# List (t) the contents of a gzip-compressed (z) archive, verbosely (v),
# WITHOUT extracting anything — good for checking what's inside first:
tar -tzvf &lt;archive&gt;.tar.gz

# gzip: compress a single file in place (replaces it with file.gz);
# gunzip: decompress it back:
gzip &lt;file&gt;
gunzip &lt;file&gt;.gz

# zip: bundle AND compress multiple files/directories into one archive
# (-r for recursive, needed for directories); unzip: extract it:
zip -r &lt;archive&gt;.zip &lt;dir-or-files&gt;
unzip &lt;archive&gt;.zip</code></pre>
<p><code>tar</code> ("tape archive," a name left over from literal magnetic tape backups) bundles many files and directories into one file, preserving structure and permissions — but <code>tar</code> on its own doesn't compress anything, which is why <code>-z</code> (invoke gzip compression) is almost always combined with it. The three everyday letter combinations are <code>-czvf</code> to create, <code>-xzvf</code> to extract, and <code>-tzvf</code> to list contents without extracting — same base flags, only the first one (<code>c</code>/<code>x</code>/<code>t</code>) changes based on what you're doing; <code>-f</code> is what tells <code>tar</code> the very next argument is the archive's filename, which is why <code>f</code> is conventionally placed last in the combined flag string. <code>gzip</code>/<code>gunzip</code> compress and decompress exactly <em>one</em> file at a time (and replace it in place) — they have no concept of bundling multiple files together, which is precisely why the "bundle with <code>tar</code>, then compress the single resulting file with gzip" combo (<code>tar -czvf</code>) exists rather than gzip trying to do both jobs. <code>zip</code>/<code>unzip</code> take a different approach: <code>zip</code> natively bundles <em>and</em> compresses multiple files or whole directories (<code>-r</code>) into one archive in a single step, and — unlike <code>.tar.gz</code>, which is the Linux/macOS-native convention — <code>.zip</code> files open natively on Windows too, making <code>zip</code> the more portable choice when the archive needs to be opened by someone on a different OS.</p>

<h3>System info: <code>uname -a</code>, <code>hostnamectl</code></h3>
<pre><code class="language-bash"># Print kernel name, hostname, kernel release/version, and architecture, all at once:
uname -a

# Show (or, with a flag, set) the system's hostname, plus OS, kernel, and
# architecture details — the systemd-based tool for this:
hostnamectl</code></pre>
<p><code>uname -a</code> ("Unix name," all fields) is the fastest way to answer "what kernel and architecture am I actually running?" — useful when a downloaded binary or driver needs to match your exact platform. <code>hostnamectl</code> covers similar ground but is systemd's dedicated tool specifically for the machine's hostname — showing it, and (with <code>hostnamectl set-hostname &lt;name&gt;</code>) changing it persistently, replacing the older, more limited standalone <code>hostname</code> command.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Worked Examples', html: `
<h3>Example 1 — "The API isn't responding," diagnosed layer by layer</h3>
<pre><code class="language-bash"># Can I even resolve the name?
dig +short api.example.com
# 203.0.113.10

# Is the host reachable at the network level at all?
ping -c 4 api.example.com
# 4 packets transmitted, 4 received, 0% packet loss  ← network path is fine

# SSH in and check what's actually listening on that server:
ssh alice@api.example.com
ss -tulpn | grep 443
# (nothing printed — the process isn't listening on 443 at all!)

# Confirm from the outside with curl:
curl -I https://api.example.com
# curl: (7) Failed to connect ... Connection refused

# Root cause found: DNS is fine, the network path is fine, but the service
# process itself isn't running/listening — next step is journalctl, not
# more networking tools.
journalctl -u myapi -n 50
# ... shows the service crashed on startup 10 minutes ago ...</code></pre>
<p>This is the mental model from above applied directly: each tool ruled out exactly one layer — DNS, then raw reachability, then "is anything actually listening" — before landing on the real cause, which turned out to be one layer further in (the service itself) than any networking tool alone could show.</p>

<h3>Example 2 — Deploy a build to a server and watch it come up</h3>
<pre><code class="language-bash"># Sync the freshly built app to the server, transferring only what changed:
rsync -avz ./dist/ alice@203.0.113.10:/var/www/app/
# sending incremental file list
# index.html
# assets/main.js
# sent 1.2M bytes  received 42 bytes  ...

# SSH in and restart the service that serves it:
ssh alice@203.0.113.10
sudo systemctl restart myapp

# Watch its logs live to confirm it started cleanly:
journalctl -u myapp -f
# ... Started myapp.service
# ... listening on 0.0.0.0:8080

# Confirm from outside, in a separate terminal:
curl -I http://203.0.113.10:8080
# HTTP/1.1 200 OK</code></pre>
<p><code>rsync -avz</code> only sent the files that actually changed since the last deploy, <code>journalctl -u myapp -f</code> gave a live view of startup instead of guessing whether it worked, and the final <code>curl -I</code> is the same "check from the outside" step as Example 1 — confirming the deploy is actually reachable, not just that the process started.</p>

<h3>Example 3 — A disk-full alert, packaging up old logs before deleting them</h3>
<pre><code class="language-bash"># Confirm the alert: which filesystem is actually full?
df -h
# Filesystem  Size  Used  Avail  Use%  Mounted on
# /dev/sda1    50G   48G   1.2G   98%  /

# Find what's eating the space:
du -sh /var/log/*
# 40G   /var/log/app
# 1.1G  /var/log/nginx
# ...

# Don't just delete — archive first, in case anything's needed later:
tar -czvf /root/app-logs-2026-07.tar.gz /var/log/app/
# /var/log/app/
# /var/log/app/2026-06-01.log
# ...

# Verify the archive is valid and see what's in it, WITHOUT re-extracting:
tar -tzvf /root/app-logs-2026-07.tar.gz | head

# Now it's safe to clear the originals:
rm -rf /var/log/app/*.log

# Confirm space was reclaimed:
df -h</code></pre>
<p><code>df -h</code> confirmed which filesystem is the actual problem (not always the obvious one — <code>/var</code> is sometimes a separate mount from <code>/</code>), <code>du -sh</code> narrowed down which directory is responsible, and the archive-before-delete pattern with <code>tar -czvf</code> then <code>tar -tzvf</code> to double-check its contents is exactly the kind of caution worth having as a habit before any destructive cleanup on a production box.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '⚠️ Edge Cases', html: `
<h3><code>curl -I</code> vs. <code>curl -i</code> — one capital letter, very different behavior</h3>
<p>These look almost identical and are a classic source of confusion: <strong><code>-I</code></strong> (capital) sends a <code>HEAD</code> request and shows <em>only</em> the response headers — the body is never even fetched from the server. <strong><code>-i</code></strong> (lowercase) sends a normal <code>GET</code> (or whatever <code>-X</code> specifies) and prints the headers <em>in addition to</em> the full body — nothing is skipped. Reach for <code>-I</code> when you only care about status code/headers and want to avoid downloading a large body; reach for <code>-i</code> when you need to see both the headers and the actual response content together.</p>

<h3><code>ssh</code> key-based auth vs. password auth — and why key files need locked-down permissions</h3>
<p>Password authentication is simple but has downsides: the password (or a hash of it) has to be verified by the server, it's vulnerable to brute-force guessing over the network, and it has to be typed (or stored) somewhere for automation. Key-based authentication avoids both: your private key never leaves your machine, and proving you hold it is done through public-key cryptography rather than sending a secret over the wire. A common trip-up: SSH will refuse to use a private key file if its permissions are too open (readable/writable by anyone other than the owner) — private keys typically need to be <code>chmod 600</code> (owner read/write only) or SSH will reject them outright with a permissions warning, even if the key itself is perfectly valid.</p>

<h3><code>apt</code> vs. <code>dnf</code> vs. <code>pacman</code> — the "update" step means different things</h3>
<p>The word "update" is a trap across these three: <code>apt update</code> only refreshes the local package <em>index</em> — it does not upgrade a single installed package (that's a separate <code>apt upgrade</code>). <code>dnf</code> doesn't require a manual index-refresh step at all — it checks freshness automatically whenever you run an operation. <code>pacman -Syu</code> does both at once — refreshes the index (<code>y</code>) <em>and</em> upgrades every installed package (<code>u</code>) in a single command — which trips up people used to <code>apt</code>'s two-step habit, and running only <code>pacman -Sy</code> without the <code>u</code> (a "partial upgrade") is specifically discouraged on Arch because it can leave a system with inconsistent package versions.</p>

<h3><code>tar</code> flag order — why <code>f</code> almost always comes last</h3>
<p>In <code>tar -czvf archive.tar.gz files...</code>, the flags <code>c</code>/<code>x</code>/<code>t</code>, <code>z</code>, and <code>v</code> don't take an argument of their own — but <code>f</code> does (the archive filename immediately follows it). When flags are combined into one block like <code>-czvf</code>, whichever flag takes an argument needs its argument to appear right after the whole block — which is why <code>f</code> is conventionally placed <em>last</em> in the combined flags, immediately before the filename. Writing <code>-fczv archive.tar.gz</code> instead would make <code>tar</code> try to treat <code>czv</code> as part of the filename argument to <code>-f</code>, producing a confusing error — sticking to the <code>czvf</code>/<code>xzvf</code>/<code>tzvf</code> convention avoids the whole issue.</p>

<h3><code>df</code> and <code>du</code> can legitimately disagree</h3>
<p>It's easy to assume <code>df</code> (space free on a filesystem) and <code>du</code> (space used by a directory's files) are just two views of the same number, but they can genuinely diverge: a large file that's been deleted while a running process still has it open continues to occupy space as far as <code>df</code> is concerned (the space isn't released until every process closes it), even though it no longer shows up in any <code>du</code> total because it has no directory entry anymore. This is a classic "why is my disk full when <code>du</code> says everything only adds up to half of it?" scenario, usually solved by finding and restarting the process still holding the deleted file open.</p>

<h3><code>~/.bashrc</code> silently not applying over SSH</h3>
<p>Because non-interactive or non-login contexts (some SSH invocations, cron jobs, CI runners) may only read <code>~/.profile</code>/<code>~/.bash_profile</code> and skip <code>~/.bashrc</code> entirely (or the reverse, depending on exact configuration), a <code>PATH</code> addition or alias that works perfectly in a normal terminal can mysteriously "not exist" when the same command runs via <code>ssh host command</code> or inside a cron job. When something works interactively but not in a script or automated context, checking which of the two files actually ran is usually the fastest way to find the gap.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'cheat-sheet', title: '📋 Cheat Sheet', html: `
<table>
  <thead><tr><th>Command</th><th>Purpose</th><th>Key flags</th></tr></thead>
  <tbody>
    <tr><td><code>ip a</code></td><td>Show network interfaces and their IP addresses</td><td>legacy: <code>ifconfig</code></td></tr>
    <tr><td><code>ip r</code></td><td>Show the routing table / default gateway</td><td>legacy: <code>route -n</code></td></tr>
    <tr><td><code>ss -tulpn</code></td><td>Show listening sockets and owning processes</td><td><code>-t</code> TCP · <code>-u</code> UDP · <code>-l</code> listening only · <code>-p</code> process · <code>-n</code> numeric</td></tr>
    <tr><td><code>netstat -tulpn</code></td><td>Legacy equivalent of <code>ss -tulpn</code></td><td>superseded by <code>ss</code></td></tr>
    <tr><td><code>ping</code></td><td>Test basic reachability of a host (ICMP)</td><td><code>-c &lt;n&gt;</code> send N pings then stop</td></tr>
    <tr><td><code>curl</code></td><td>Fetch/send HTTP(S) requests from the command line</td><td><code>-I</code> headers only · <code>-L</code> follow redirects · <code>-o &lt;file&gt;</code> save to file · <code>-X &lt;verb&gt;</code> HTTP method · <code>-H</code> custom header</td></tr>
    <tr><td><code>wget</code></td><td>Download a file/URL straight to disk</td><td>follows redirects by default</td></tr>
    <tr><td><code>ssh</code></td><td>Open an encrypted remote shell</td><td><code>user@host</code> · <code>-i &lt;key-file&gt;</code> use a specific private key</td></tr>
    <tr><td><code>scp</code></td><td>Copy a file to/from a remote host over SSH</td><td><code>-r</code> recursive for directories</td></tr>
    <tr><td><code>rsync</code></td><td>Sync files to/from a remote host, transferring only diffs</td><td><code>-a</code> archive (perms/times/symlinks) · <code>-v</code> verbose · <code>-z</code> compress in transit</td></tr>
    <tr><td><code>dig</code></td><td>Detailed DNS lookup</td><td><code>+short</code> just the resolved IP</td></tr>
    <tr><td><code>host</code></td><td>Quick, terse DNS lookup</td><td>—</td></tr>
    <tr><td><code>nslookup</code></td><td>Older DNS lookup tool</td><td>still common out of habit / on other OSes</td></tr>
    <tr><td><code>apt</code> / <code>apt-get</code></td><td>Package manager — Debian/Ubuntu</td><td><code>update</code> refresh index · <code>install</code> · <code>remove</code> · <code>search</code></td></tr>
    <tr><td><code>dnf</code> / <code>yum</code></td><td>Package manager — Fedora/RHEL (yum = older)</td><td><code>install</code> · <code>remove</code> · <code>search</code> · auto-refreshes index</td></tr>
    <tr><td><code>pacman</code></td><td>Package manager — Arch Linux</td><td><code>-S</code> install · <code>-R</code> remove · <code>-Ss</code> search · <code>-Syu</code> refresh + full upgrade</td></tr>
    <tr><td><code>df -h</code></td><td>Show free/used space per filesystem</td><td><code>-h</code> human-readable sizes</td></tr>
    <tr><td><code>du -sh</code></td><td>Show total size of a directory's contents</td><td><code>-s</code> summarize · <code>-h</code> human-readable</td></tr>
    <tr><td><code>lsblk</code></td><td>List block devices (disks/partitions) as a tree</td><td>shows current mountpoints</td></tr>
    <tr><td><code>mount</code> / <code>umount</code></td><td>Attach / detach a filesystem to the directory tree</td><td>usually requires <code>sudo</code></td></tr>
    <tr><td><code>env</code></td><td>Print all current environment variables</td><td>—</td></tr>
    <tr><td><code>export</code></td><td>Set a variable so child processes inherit it</td><td><code>export VAR=value</code></td></tr>
    <tr><td><code>echo $PATH</code></td><td>Print the ordered, colon-separated command search list</td><td>first match wins</td></tr>
    <tr><td><code>~/.bashrc</code></td><td>Runs for every new interactive non-login shell</td><td>everyday new-terminal case</td></tr>
    <tr><td><code>~/.profile</code></td><td>Runs once at login (e.g. fresh SSH session)</td><td>often sourced from <code>~/.bash_profile</code></td></tr>
    <tr><td><code>journalctl</code></td><td>Query the systemd journal (unified service logs)</td><td><code>-u &lt;service&gt;</code> · <code>-f</code> follow · <code>-b</code> current boot</td></tr>
    <tr><td><code>/var/log</code></td><td>Traditional plain-text log directory</td><td>read with <code>cat</code>/<code>less</code>/<code>tail</code></td></tr>
    <tr><td><code>tail -f</code></td><td>Follow a growing log file live</td><td>Ctrl+C to stop</td></tr>
    <tr><td><code>tar -czvf</code></td><td>Create a gzip-compressed archive</td><td><code>c</code> create · <code>z</code> gzip · <code>v</code> verbose · <code>f</code> filename (last)</td></tr>
    <tr><td><code>tar -xzvf</code></td><td>Extract a gzip-compressed archive</td><td><code>x</code> extract</td></tr>
    <tr><td><code>tar -tzvf</code></td><td>List an archive's contents without extracting</td><td><code>t</code> list</td></tr>
    <tr><td><code>gzip</code> / <code>gunzip</code></td><td>Compress / decompress a single file in place</td><td>no bundling of multiple files</td></tr>
    <tr><td><code>zip</code> / <code>unzip</code></td><td>Bundle + compress multiple files/dirs, or extract</td><td><code>-r</code> recursive for directories</td></tr>
    <tr><td><code>uname -a</code></td><td>Print kernel name, version, and architecture</td><td>—</td></tr>
    <tr><td><code>hostnamectl</code></td><td>Show/set the system hostname and OS info</td><td>systemd-based; replaces plain <code>hostname</code></td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">How would you check what's listening on a given port on a Linux server?</div>
<div class="qa-a">
<p><code>ss -tulpn</code> is the modern answer: <code>-t</code>/<code>-u</code> show TCP and UDP sockets, <code>-l</code> restricts to listening sockets, <code>-p</code> shows the owning process and PID, and <code>-n</code> shows numeric ports instead of resolving names. You'd typically pipe it through <code>grep &lt;port&gt;</code> to check one specific port, e.g. <code>ss -tulpn | grep :443</code>. <code>netstat -tulpn</code> does the same thing with the same flags and is still common in older docs, but <code>ss</code> is faster and is what current distros ship by default. Root privileges are usually needed to see process names/PIDs for sockets owned by other users.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Why do different Linux distros use different package managers, and what's the equivalent of <code>apt install</code> on Fedora and Arch?</div>
<div class="qa-a">
<p>Different distro families made different technical choices about package formats and dependency resolution decades ago, and those choices persisted. Functionally they all do the same three things — refresh a local index, install, and remove — under different names: on Debian/Ubuntu it's <code>apt install &lt;pkg&gt;</code>, on Fedora/RHEL it's <code>dnf install &lt;pkg&gt;</code> (or the older <code>yum install &lt;pkg&gt;</code> on legacy systems), and on Arch it's <code>pacman -S &lt;pkg&gt;</code> — Arch's syntax stands out because it uses combined single-letter flags rather than separate subcommand words. Knowing that these are the same operation with different spelling matters more than memorizing any one distro's exact syntax.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Explain SSH key-based authentication and how it differs from password authentication.</div>
<div class="qa-a">
<p>You generate a key pair: a private key kept secret on your machine, and a matching public key copied to the server's <code>~/.ssh/authorized_keys</code> file. When you connect, the server challenges your client to prove it holds the matching private key using public-key cryptography — the private key itself is never transmitted over the network, unlike a password, which either has to be sent (or hashed and compared) every time and is vulnerable to interception or brute-forcing. A common gotcha: the private key file needs restrictive permissions (typically <code>chmod 600</code>, owner read/write only) — SSH will refuse to use it otherwise, even if the key itself is valid.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Walk through the <code>tar</code> flags for creating, extracting, and listing an archive.</div>
<div class="qa-a">
<p><code>tar -czvf archive.tar.gz &lt;files&gt;</code> creates (<code>c</code>) a gzip-compressed (<code>z</code>) archive verbosely (<code>v</code>) to the named file (<code>f</code>); <code>tar -xzvf archive.tar.gz</code> extracts (<code>x</code>) it the same way; and <code>tar -tzvf archive.tar.gz</code> lists (<code>t</code>) its contents without extracting anything — useful for checking what's inside before overwriting files. <code>tar</code> itself only bundles files together; the <code>z</code> flag is what invokes gzip compression on top. <code>f</code> is conventionally placed last in the combined flags because it takes an argument (the filename), which must immediately follow it.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between <code>df -h</code> and <code>du -sh</code>?</div>
<div class="qa-a">
<p><code>df -h</code> reports free and used space per <em>mounted filesystem</em> — the disk-level view. <code>du -sh &lt;dir&gt;</code> reports the total size of a specific directory's contents by walking it and summing file sizes — the directory-level view, and <code>-s</code> collapses that into one summary line instead of one per subdirectory. They can genuinely disagree: a deleted file still held open by a running process continues to consume space as far as <code>df</code> is concerned, even though it no longer appears in any <code>du</code> total since it has no remaining directory entry — a classic "disk full but <code>du</code> doesn't add up" debugging scenario.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between <code>~/.bashrc</code> and <code>~/.profile</code>?</div>
<div class="qa-a">
<p><code>~/.bashrc</code> runs for every new <em>interactive, non-login</em> bash shell — the everyday case of opening a new terminal window on a machine you're already logged into. <code>~/.profile</code> (or <code>~/.bash_profile</code>) runs once at <em>login</em> — a fresh console login or a new SSH session. Many distros' default login-shell config simply sources <code>.bashrc</code> from within <code>.bash_profile</code>, which is why the distinction is easy to miss — until something set only in <code>.bashrc</code> mysteriously doesn't apply over a fresh SSH connection or in a cron job, because that context started as a login (or non-interactive) shell that never read it.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">A teammate says "the server ran out of disk space overnight" — how do you investigate?</div>
<div class="qa-a">
<p>Start with <code>df -h</code> to confirm which filesystem is actually full (it isn't always <code>/</code> — <code>/var</code> is sometimes a separate mount). Then narrow down the cause with <code>du -sh</code> on likely directories (<code>/var/log</code> is a very common culprit, especially a runaway application log). Check <code>journalctl</code> and/or the relevant file under <code>/var/log</code> for anything unusual around the time the disk filled — a crash loop writing endless stack traces is a frequent root cause. Before deleting anything, it's good practice to archive with <code>tar -czvf</code> first, verify the archive with <code>tar -tzvf</code>, and only then remove the originals and re-check with <code>df -h</code> that space was actually reclaimed.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">When would you reach for <code>rsync</code> instead of <code>scp</code>?</div>
<div class="qa-a">
<p><code>scp</code> is a straightforward one-shot copy — fine for a single file or a one-time transfer. <code>rsync -avz</code> is the better choice for anything repeated, like deploying updated build output or syncing a backup regularly, because it compares source and destination first and transfers only what's changed, rather than re-sending everything on every run — meaningfully faster for large trees where most files haven't changed. <code>-a</code> bundles recursive copying with preserving permissions, timestamps, and symlinks; <code>-z</code> compresses data in transit, which helps over slower connections. Both ultimately run over the same encrypted SSH channel.</p>
</div>
</div>
`}

]});
