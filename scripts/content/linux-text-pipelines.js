window.PREP_SITE.registerTopic({
  id: 'linux-text-pipelines',
  module: 'linux',
  title: 'Text Processing & Pipelines',
  estimatedReadTime: '30 min',
  tags: ['linux', 'cli', 'shell', 'text-processing', 'grep', 'regex'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>Almost everything on a Linux system talks in <strong>plain text streams</strong> — a program reads a stream of bytes in, writes a stream of bytes out, and (separately) writes errors to a third stream. The shell lets you rewire those streams: send output to a file (<strong>redirection</strong>), or feed the output of one program straight into the input of the next (<strong>piping</strong>). A small set of tiny, single-purpose programs — <code>grep</code>, <code>sed</code>, <code>awk</code>, <code>sort</code>, <code>uniq</code>, <code>cut</code>, <code>tr</code>, and friends — each do one job on a text stream extremely well, and you compose them into pipelines to do real work.</p>
<ul>
  <li><strong>Three standard streams, numbered:</strong> every command has <strong>stdin</strong> (fd 0, input), <strong>stdout</strong> (fd 1, normal output), and <strong>stderr</strong> (fd 2, errors/diagnostics) — kept separate on purpose so you can capture results without capturing warnings, or vice versa.</li>
  <li><strong>Redirection</strong> (<code>&gt;</code>, <code>&gt;&gt;</code>, <code>&lt;</code>, <code>2&gt;</code>, <code>2&gt;&amp;1</code>, <code>&amp;&gt;</code>) wires a stream to a <em>file</em>. <strong>Piping</strong> (<code>|</code>) wires the stdout of one process directly to the stdin of the next, with no file in between.</li>
  <li><strong>Filters do one job each:</strong> <code>grep</code> searches, <code>sed</code> edits a stream line by line, <code>awk</code> does field-aware processing, <code>sort</code>/<code>uniq</code> order and dedupe/count, <code>cut</code>/<code>tr</code>/<code>paste</code>/<code>join</code>/<code>comm</code> slice and combine columns, and <code>xargs</code> turns a stream of lines into arguments for another command.</li>
  <li><strong>This is topic 3 of the Linux module.</strong> It assumes you can already navigate the filesystem (topic 1: Fundamentals & Navigation) and are comfortable with permissions and users (topic 2: Files, Permissions & Users). Later topics build on this: processes & jobs, shell scripting, and networking/sysadmin all lean heavily on piping commands together.</li>
</ul>
<p><strong>Mantra:</strong> "Everything is a stream of lines; redirection points a stream at a file, a pipe points it at the next program, and each small tool transforms the stream a little before passing it on."</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>The Unix philosophy: small tools, composed</h3>
<p>Linux's text-processing tools weren't designed as one giant do-everything program — they were designed around a philosophy summed up (by Doug McIlroy, who invented the pipe) roughly as: write programs that do one thing well; write programs to work together; write programs that handle text streams, because that's a universal interface. <code>grep</code> only searches. <code>sort</code> only sorts. <code>cut</code> only extracts columns. None of them alone is impressive — but chained together with pipes, they let you answer questions in one line of typing that would otherwise take a small custom program.</p>

<h3>Why this matters day to day</h3>
<ul>
  <li><strong>Logs are text.</strong> Application logs, web server access logs, system logs (<code>/var/log</code>) — almost all of it is plain text, one event per line. "How many requests failed in the last hour?" or "what are the 10 most frequent error messages?" are pipeline questions, answerable in seconds without opening a log viewer or writing a script.</li>
  <li><strong>It's everywhere, with no setup.</strong> <code>grep</code>, <code>sed</code>, <code>awk</code>, <code>sort</code>, and friends are preinstalled on essentially every Linux (and macOS) machine you'll ever SSH into. No package to install, no runtime to configure — just type the command.</li>
  <li><strong>It scales from one-liners to real scripts.</strong> The exact same pipelines you type interactively at a prompt are what you'll later drop into shell scripts (a later topic) and cron jobs — this topic is the vocabulary that shell scripting is built out of.</li>
  <li><strong>It's a near-universal interview topic.</strong> "Write a command to count how many times each IP address hits this log" or "find the most common word in this file" are classic exercises specifically because they test whether you understand streams, pipes, and a handful of core filters — not because anyone expects you to memorize obscure flags.</li>
</ul>

<h3>The stream model, in one sentence</h3>
<p>Every running program is handed three open connections by default — one to read from (stdin), and two to write to (stdout for normal results, stderr for errors/diagnostics) — and the shell's redirection and piping syntax exists entirely to let <em>you</em> decide, per command, where those three connections actually go: the keyboard/screen (the default), a file, <code>/dev/null</code> (a black hole, discussed below), or another program's stdin.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>Three numbered streams, not one</h3>
<p>Every process has three standard file descriptors open before it even starts, each with a small integer number:</p>
<table>
  <thead><tr><th>FD</th><th>Name</th><th>Default destination</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td><code>0</code></td><td>stdin</td><td>keyboard (your terminal)</td><td>input the program reads</td></tr>
    <tr><td><code>1</code></td><td>stdout</td><td>screen (your terminal)</td><td>normal output / results</td></tr>
    <tr><td><code>2</code></td><td>stderr</td><td>screen (your terminal)</td><td>errors, warnings, diagnostics</td></tr>
  </tbody>
</table>
<p>Note that stdout and stderr both default to <em>the same place</em> — your terminal screen — which is why beginners often don't notice they're separate streams at all: everything just appears to "print to the screen." They only become visibly distinct once you redirect one without the other, e.g. sending real output to a file while still seeing errors live in your terminal.</p>

<h3>Redirection: wiring a stream to a file</h3>
<p>Redirection operators splice one of these numbered streams onto a <em>file</em> instead of the terminal. Think of it as unplugging fd 1 (or fd 2, or fd 0) from the screen/keyboard and plugging it into a file on disk instead — the program itself never knows the difference; it just writes to "fd 1" and the shell decided in advance where that actually leads.</p>

<h3>Piping: wiring a stream to another process</h3>
<p>A pipe (<code>|</code>) does something similar, but instead of connecting stdout to a <em>file</em>, it connects the stdout of one process directly to the stdin of another — via an in-memory buffer the kernel manages, with no file ever touching disk. Both processes actually run <em>at the same time</em>: the second one can start consuming lines the first one produces before the first one has even finished. Chain enough pipes together (<code>cmd1 | cmd2 | cmd3</code>) and you've built an assembly line: each stage reads lines in, does one small transformation, and writes lines out, without ever needing to know what's upstream or downstream of it.</p>
<pre><code class="language-text">cmd1  ──stdout──▶  cmd2  ──stdout──▶  cmd3  ──stdout──▶  terminal
 (stdin: keyboard)  (stdin: cmd1's    (stdin: cmd2's
                      output)          output)
</code></pre>

<h3>"Filter" is the mental shape for almost every tool in this topic</h3>
<p>Nearly every command covered below fits the same shape: read lines from stdin (or a file given as an argument), transform or filter them somehow, write the result to stdout, one line at a time. Internalizing this "filter" shape is most of the battle — once you see <code>grep</code>, <code>sed</code>, <code>awk</code>, <code>sort</code>, <code>cut</code>, and <code>tr</code> as different flavors of the exact same "stream in, transformed stream out" idea, remembering which one to reach for becomes a question of "what transformation do I need," not "which obscure tool does this":</p>
<ul>
  <li><strong><code>grep</code></strong> — keep only lines matching a pattern (search).</li>
  <li><strong><code>sed</code></strong> — edit a stream line-by-line: substitute, delete (a "stream editor").</li>
  <li><strong><code>awk</code></strong> — split each line into fields and act on them; a small programming language in its own right.</li>
  <li><strong><code>sort</code> / <code>uniq</code></strong> — reorder lines; collapse or count adjacent duplicates.</li>
  <li><strong><code>cut</code> / <code>tr</code> / <code>paste</code> / <code>join</code> / <code>comm</code></strong> — column- and set-level operations: extract fields, translate characters, merge files side by side, relational-join or diff two sorted lists.</li>
  <li><strong><code>xargs</code></strong> — the odd one out: it doesn't transform text, it turns a stream of lines into <em>arguments</em> for a command that doesn't itself read from stdin.</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Redirecting stdout: <code>&gt;</code> and <code>&gt;&gt;</code></h3>
<pre><code class="language-bash"># Overwrite: create the file (or replace its contents) with this command's stdout:
&lt;command&gt; &gt; &lt;file&gt;
ls -l &gt; listing.txt

# Append: add this command's stdout to the end of the file, creating it if needed:
&lt;command&gt; &gt;&gt; &lt;file&gt;
echo "new entry" &gt;&gt; log.txt</code></pre>
<p><code>&gt;</code> truncates the target file to zero length first, then writes — so running it twice in a row leaves you with only the <em>second</em> run's output. <code>&gt;&gt;</code> never truncates; it seeks to the end and writes from there, which is why it's the one you want for logging or accumulating output across multiple runs.</p>

<h3>Redirecting stdin: <code>&lt;</code></h3>
<pre><code class="language-bash"># Feed a file's contents in as stdin, instead of the program reading it
# by filename (useful for commands, or comparisons, that only read stdin):
&lt;command&gt; &lt; &lt;file&gt;
sort &lt; names.txt</code></pre>
<p><code>&lt;</code> is used far less often than <code>&gt;</code> in practice, because most Unix text tools already accept a filename as an argument (<code>sort names.txt</code> works just as well as <code>sort &lt; names.txt</code>) — but it matters for the handful of commands or contexts where only stdin is accepted.</p>

<h3>Redirecting stderr: <code>2&gt;</code>, and combining streams with <code>2&gt;&amp;1</code> / <code>&amp;&gt;</code></h3>
<pre><code class="language-bash"># Send only stderr to a file, leaving stdout on the screen:
&lt;command&gt; 2&gt; errors.log

# Send stdout to one file and stderr to another, in the same command:
&lt;command&gt; &gt; out.log 2&gt; errors.log

# Send BOTH stdout and stderr into the same file (note the order — see
# Edge Cases below for why it must come after the "&gt; file"):
&lt;command&gt; &gt; combined.log 2&gt;&amp;1

# Bash shorthand for the same thing — redirect both streams to one file
# in a single operator (a bash/zsh extension, not available in plain sh):
&lt;command&gt; &amp;&gt; combined.log</code></pre>
<p><code>2&gt;</code> redirects fd 2 (stderr) on its own — handy when you want to watch a command's normal output live while quietly logging (or discarding) anything it complains about. <code>2&gt;&amp;1</code> means "make fd 2 point at whatever fd 1 currently points at" — it doesn't redirect to a file named <code>1</code>, it duplicates an existing file descriptor's target. <code>&amp;&gt;</code> is a convenience bash/zsh built specifically for the common case of wanting everything, output and errors alike, in one place.</p>

<h3>Discarding output: <code>/dev/null</code></h3>
<pre><code class="language-bash"># Throw away stdout entirely — /dev/null is a special file that
# silently discards anything written to it, and returns nothing (EOF)
# if you ever try to read from it:
&lt;command&gt; &gt; /dev/null

# Throw away stderr only — a very common way to silence expected/harmless
# warnings while still seeing real results:
&lt;command&gt; 2&gt; /dev/null

# Throw away everything, both streams — run a command purely for its
# side effects / exit status, with zero visible output:
&lt;command&gt; &gt; /dev/null 2&gt;&amp;1</code></pre>
<p><code>/dev/null</code> is a real device file that every Linux system has; writing to it always "succeeds" and simply throws the bytes away. It's the standard way to suppress output you don't care about without changing the command itself.</p>

<h3>Piping: <code>|</code></h3>
<pre><code class="language-bash"># Send the stdout of the left command straight into the stdin of the
# right command — no intermediate file:
&lt;command1&gt; | &lt;command2&gt;
cat access.log | grep "ERROR"

# Chain as many stages as you need:
&lt;command1&gt; | &lt;command2&gt; | &lt;command3&gt;
cat access.log | grep "ERROR" | wc -l</code></pre>
<p>A pipe only ever connects stdout to stdin — stderr from the left-hand command is <em>not</em> captured by the pipe and still goes straight to your terminal by default, which is exactly the separation of streams paying off: errors from an earlier stage don't silently get treated as data by a later one.</p>

<h3><code>tee</code>: split a stream to a file <em>and</em> keep it flowing</h3>
<pre><code class="language-bash"># Write the stream to a file AND pass it straight through to stdout
# (so you can both save it and keep piping it further, or watch it live):
&lt;command&gt; | tee &lt;file&gt;
ls -l | tee listing.txt | grep ".txt"

# Append instead of overwrite:
&lt;command&gt; | tee -a &lt;file&gt;</code></pre>
<p><code>tee</code> is named after a plumbing T-joint: the stream goes in one side and comes out <em>two</em> places — a file you name, and its own stdout, unchanged — which is exactly what a plain <code>&gt;</code> redirect can't do (a redirect only sends the stream to the file, ending the pipeline there). Reach for <code>tee</code> whenever you want to save intermediate output to a file <em>while still</em> continuing to pipe it, or watch it scroll by live.</p>

<h3>Basic regular expressions: the pattern language underneath <code>grep</code>/<code>sed</code>/<code>awk</code></h3>
<pre><code class="language-text">^        anchor: start of line          ^Error       lines starting with "Error"
$        anchor: end of line            \\.log$       lines ending in ".log"
.        any single character           a.c          "abc", "a1c", "a_c", ...
[...]    a character class              [0-9]        any one digit
[^...]   negated character class        [^0-9]       any one non-digit
*        zero or more of the previous   ab*c         "ac", "abc", "abbbc", ...
+        one or more (extended regex)   ab+c         "abc", "abbc" — NOT "ac"
?        zero or one (extended regex)   colou?r      "color" or "colour"
|        alternation (extended regex)   cat|dog      "cat" OR "dog"
{n}      exactly n repeats              [0-9]{3}     exactly 3 digits
{n,m}    between n and m repeats        [0-9]{2,4}   2 to 4 digits</code></pre>
<p>Plain (<strong>basic</strong>) regular expressions support anchors, character classes, and <code>*</code> out of the box; <code>+</code>, <code>?</code>, <code>|</code>, and <code>{n,m}</code> require either backslash-escaping (<code>\\+</code>, <code>\\?</code>) in basic mode, or switching to <strong>extended</strong> regular expressions — which is exactly what <code>grep -E</code> (below) and <code>awk</code>'s pattern matching give you unescaped.</p>

<h3><code>grep</code> — search a stream for matching lines</h3>
<pre><code class="language-bash"># Print every line containing the pattern:
grep &lt;pattern&gt; &lt;file&gt;
grep "ERROR" app.log

# Case-insensitive match:
grep -i &lt;pattern&gt; &lt;file&gt;
grep -i "error" app.log

# Invert: print lines that do NOT match:
grep -v &lt;pattern&gt; &lt;file&gt;
grep -v "DEBUG" app.log

# Prefix each match with its line number:
grep -n &lt;pattern&gt; &lt;file&gt;
grep -n "ERROR" app.log

# Recurse into every file under a directory:
grep -r &lt;pattern&gt; &lt;dir&gt;
grep -r "TODO" src/

# Extended regular expressions — use +, ?, |, {n,m} unescaped:
grep -E &lt;pattern&gt; &lt;file&gt;
grep -E "error|fail(ed)?" app.log

# Print only the matched portion of each line, not the whole line:
grep -o &lt;pattern&gt; &lt;file&gt;
grep -o "[0-9]\\{3\\}-[0-9]\\{4\\}" contacts.txt

# Print a count of matching LINES, not the matches themselves:
grep -c &lt;pattern&gt; &lt;file&gt;
grep -c "ERROR" app.log

# Fixed-string search — treat the pattern as literal text, no regex
# metacharacters interpreted at all:
grep -F &lt;string&gt; &lt;file&gt;
grep -F "a.b*c" data.txt</code></pre>
<p>Flags combine freely: <code>grep -rin "todo" src/</code> means "recursively, case-insensitively, with line numbers." <code>grep -c</code> is easy to misread — it counts <em>matching lines</em>, not the total number of matches on those lines (a line with the pattern twice still counts once).</p>

<h3><code>sed</code> — a "stream editor": transform a stream line by line</h3>
<pre><code class="language-bash"># Substitute the first match of a pattern on each line:
sed 's/&lt;old&gt;/&lt;new&gt;/' &lt;file&gt;
sed 's/foo/bar/' config.txt

# Substitute EVERY match on each line — the trailing "g" means "global"
# (without it, only the first match per line is replaced):
sed 's/&lt;old&gt;/&lt;new&gt;/g' &lt;file&gt;
sed 's/foo/bar/g' config.txt

# Delete every line matching a pattern:
sed '/&lt;pattern&gt;/d' &lt;file&gt;
sed '/^#/d' config.txt          # delete comment lines

# Edit the file IN PLACE — write the result back to the same file
# instead of just printing it to stdout:
sed -i 's/&lt;old&gt;/&lt;new&gt;/g' &lt;file&gt;
sed -i 's/foo/bar/g' config.txt

# In-place edit with an automatic backup — GNU sed writes the
# ORIGINAL content to &lt;file&gt;.bak before overwriting &lt;file&gt;:
sed -i.bak 's/foo/bar/g' config.txt</code></pre>
<p>Without <code>-i</code>, <code>sed</code> never touches the original file — it reads it, applies the substitution/deletion, and prints the <em>result</em> to stdout, leaving the file on disk unchanged (safe for testing a pattern before committing to it). <code>-i</code> makes the change permanent by writing back to the same file. The three pieces of <code>s/&lt;old&gt;/&lt;new&gt;/</code> — pattern, replacement, and optional trailing flags like <code>g</code> — are the core of <code>sed</code>'s substitute command; <code>/&lt;pattern&gt;/d</code> is the equally common "delete any line matching this" form.</p>

<h3><code>awk</code> — field-aware processing (a tiny language of its own)</h3>
<pre><code class="language-bash"># Print just the first whitespace-separated field of every line:
awk '{print $1}' &lt;file&gt;
awk '{print $1}' access.log

# Print multiple fields — $0 is the whole line, $1.. are fields, NF is
# the number of fields on the current line, NR is the current line number:
awk '{print $1, $3}' access.log
awk '{print NR, $0}' access.log   # number every line
awk '{print $NF}' access.log      # print the LAST field on each line

# Run an action only on lines matching a pattern (regex or expression):
awk '/&lt;pattern&gt;/ {print $1}' access.log
awk '$3 &gt; 100 {print $1}' stats.txt    # only lines where field 3 &gt; 100

# Use a custom field separator instead of whitespace — useful for CSV
# or colon-delimited files like /etc/passwd:
awk -F&lt;delim&gt; '{print $1}' &lt;file&gt;
awk -F: '{print $1}' /etc/passwd
awk -F',' '{print $2}' data.csv</code></pre>
<p><code>awk</code> automatically splits each input line into fields (by whitespace, by default) before you touch it — <code>$1</code>, <code>$2</code>, ... are those fields, <code>$0</code> is the entire original line, <code>NF</code> is how many fields the current line has, and <code>NR</code> is a running line counter. A pattern before the <code>{ }</code> block restricts which lines the action runs on, exactly like a built-in <code>grep</code> — this is what makes <code>awk</code> feel like a small language rather than just another filter.</p>

<h3><code>sort</code> — reorder lines</h3>
<pre><code class="language-bash"># Alphabetical (lexicographic) sort, ascending, the default:
sort &lt;file&gt;

# Numeric sort — treats each line as a number, not text
# (without -n, "9" sorts AFTER "10" because it compares character by character):
sort -n &lt;file&gt;
sort -n scores.txt

# Reverse the order (combine freely with -n: sort -rn):
sort -r &lt;file&gt;

# Sort by a specific field (column) instead of the whole line — fields
# are 1-based and whitespace-separated by default:
sort -k&lt;n&gt; &lt;file&gt;
sort -k2 data.txt          # sort by the 2nd field
sort -k2,2n data.txt       # sort by the 2nd field only, numerically

# Remove duplicate lines from the OUTPUT (sorts, then keeps only the
# first of each group of equal lines — works regardless of input order):
sort -u &lt;file&gt;
sort -u names.txt</code></pre>
<p><code>sort -n</code> matters constantly: a plain text sort puts <code>"10"</code> before <code>"9"</code> because it compares the characters <code>'1'</code> and <code>'9'</code> directly, never parsing either string as a number. <code>-k</code> lets you sort by one column of structured data (like the 2nd column of a log line) without disturbing the rest of the line's content. <code>sort -u</code> is subtly different from <code>uniq</code> (next): <code>sort -u</code> dedupes the <em>entire</em> input regardless of where duplicates originally sat, because <code>sort</code> reorders everything first.</p>

<h3><code>uniq -c</code> — collapse (and count) adjacent duplicate lines</h3>
<pre><code class="language-bash"># Collapse each run of adjacent identical lines into one, prefixed with
# how many times it occurred:
sort &lt;file&gt; | uniq -c

# Without a preceding sort, uniq only catches duplicates that are
# already NEXT to each other — non-adjacent duplicates are left alone:
uniq -c already-grouped.txt</code></pre>
<p>This is the single most important gotcha in this whole topic: <strong><code>uniq</code> only ever removes/counts <em>adjacent</em> duplicate lines</strong> — it has no memory of lines it saw earlier in the stream. That's exactly why <code>uniq -c</code> is almost always preceded by <code>sort</code>: sorting first guarantees every instance of a given line ends up next to every other instance, so <code>uniq -c</code> can count them all correctly.</p>

<h3><code>wc</code> — count lines, words, or bytes</h3>
<pre><code class="language-bash"># Count lines:
wc -l &lt;file&gt;
grep -c "ERROR" app.log     # equivalent count of matching lines
grep "ERROR" app.log | wc -l   # same result, via a pipeline

# Count words (whitespace-separated tokens):
wc -w &lt;file&gt;

# Count bytes:
wc -c &lt;file&gt;

# All three at once (the default, with no flag):
wc &lt;file&gt;
# prints: lines  words  bytes  filename</code></pre>
<p><code>wc -l</code> piped after a filter (<code>grep pattern file | wc -l</code>) is the standard idiom for "how many lines match?" — functionally the same result as <code>grep -c pattern file</code>, but the piped form generalizes to counting the output of <em>any</em> pipeline, not just a single <code>grep</code>.</p>

<h3><code>cut</code> — extract columns by a fixed delimiter</h3>
<pre><code class="language-bash"># Select field(s) by number, splitting on a delimiter you specify
# (default delimiter is TAB, not space — almost always override it):
cut -d&lt;delim&gt; -f&lt;n&gt; &lt;file&gt;
cut -d: -f1 /etc/passwd        # 1st colon-delimited field (username)
cut -d, -f2,4 data.csv          # 2nd and 4th comma-delimited fields
cut -d, -f1-3 data.csv           # a range: fields 1 through 3</code></pre>
<p><code>cut</code> is the lightweight option for well-formed, single-character-delimited data (CSV, <code>/etc/passwd</code>, colon/comma-separated fields) — reach for <code>awk</code> instead once the data is whitespace-separated with a variable number of spaces between fields (see Edge Cases below for exactly why).</p>

<h3><code>tr</code> — translate or delete characters (stdin only, no filenames)</h3>
<pre><code class="language-bash"># Translate every character in the first set to the corresponding
# character in the second set (classic use: case conversion):
tr &lt;set1&gt; &lt;set2&gt;
echo "Hello World" | tr 'a-z' 'A-Z'      # -> HELLO WORLD
tr 'a-z' 'A-Z' &lt; file.txt

# Delete every character found in the set, with no replacement:
tr -d &lt;chars&gt;
tr -d '0-9' &lt; file.txt          # strip all digits
echo "a,b,,c" | tr -d ','        # -> abc

# Squeeze runs of repeated characters down to a single instance:
tr -s &lt;chars&gt;
tr -s ' ' &lt; file.txt             # collapse multiple spaces into one</code></pre>
<p><code>tr</code> is unusual among these tools: it takes only character-set operands, never a filename — you must feed it a file via <code>&lt;</code> or a pipe, you can't just run <code>tr 'a-z' 'A-Z' file.txt</code> and expect it to open the file (it would instead try to treat <code>file.txt</code> as a third, invalid argument).</p>

<h3><code>paste</code> — merge lines of files side by side</h3>
<pre><code class="language-bash"># Merge corresponding lines of two files into one, separated by a TAB
# by default — line 1 of each file becomes one output line, and so on:
paste &lt;file1&gt; &lt;file2&gt;
paste names.txt scores.txt

# Use a custom delimiter instead of TAB:
paste -d&lt;delim&gt; &lt;file1&gt; &lt;file2&gt;
paste -d',' names.txt scores.txt</code></pre>
<p>Where <code>cat file1 file2</code> stacks two files vertically (file1's lines, then file2's lines), <code>paste file1 file2</code> combines them horizontally — line 1 from each side by side, then line 2, and so on. Handy for zipping together two parallel lists (names + scores, IDs + values) that were generated separately.</p>

<h3><code>join</code> — relational join on a common field</h3>
<pre><code class="language-bash"># Join two files on their first field wherever it matches — like a SQL
# INNER JOIN. BOTH files must already be sorted on the join field:
join &lt;file1&gt; &lt;file2&gt;
sort ids.txt -o ids.txt && sort names.txt -o names.txt
join ids.txt names.txt

# Use a custom field delimiter:
join -t&lt;delim&gt; &lt;file1&gt; &lt;file2&gt;
join -t',' ids.csv names.csv</code></pre>
<p><code>join</code> is exactly the SQL <code>JOIN</code> idea applied to two plain-text files: it looks for lines in each file that share the same value in the join field (field 1, by default) and outputs one combined line per match. The catch that trips people up every time: <code>join</code> assumes both inputs are <em>already sorted</em> on the join field — an unsorted input silently produces wrong or incomplete results rather than an error, so sort first.</p>

<h3><code>comm</code> — compare two sorted files line by line</h3>
<pre><code class="language-bash"># Three-column output by default: lines only in file1 | lines only in
# file2 | lines in BOTH. Both files must be sorted first:
comm &lt;file1&gt; &lt;file2&gt;
comm sorted-a.txt sorted-b.txt

# Suppress columns you don't want — -1 hides "only in file1", -2 hides
# "only in file2", -3 hides "in both":
comm -23 &lt;file1&gt; &lt;file2&gt;   # only lines unique to file1
comm -13 &lt;file1&gt; &lt;file2&gt;   # only lines unique to file2
comm -12 &lt;file1&gt; &lt;file2&gt;   # only lines common to both</code></pre>
<p><code>comm</code> is the set-comparison sibling of <code>join</code>: instead of combining rows on a key, it tells you which lines exist only on the left, only on the right, or on both — the classic "diff two sorted lists" tool. Same requirement as <code>join</code>: both files need to be sorted first, or the comparison is meaningless.</p>

<h3><code>xargs -I{}</code> — turn a stream of lines into arguments</h3>
<pre><code class="language-bash"># Take each line of input and append it as an argument to a command:
&lt;command-producing-lines&gt; | xargs &lt;command&gt;
echo "file1.txt file2.txt" | xargs rm

# Use -I to choose a placeholder and control WHERE the input goes in
# the command (not just tacked on at the end) — one invocation per line:
&lt;command-producing-lines&gt; | xargs -I{} &lt;command using {}&gt;
find . -name "*.tmp" | xargs -I{} rm {}
cat urls.txt | xargs -I{} curl -o {}.html {}</code></pre>
<p><code>xargs</code> exists because many commands (<code>rm</code>, <code>cp</code>, <code>mkdir</code>, <code>curl</code>...) take their targets as command-line <em>arguments</em>, not as a stream on stdin — so piping a list of filenames straight into them does nothing useful on its own. <code>xargs</code> bridges that gap by reading lines from stdin and using them to build and run another command. Without <code>-I</code>, it just appends the lines as trailing arguments (and may batch several per invocation for efficiency); with <code>-I{}</code>, you name a placeholder (<code>{}</code> is conventional but any string works) and it substitutes one line in for it per run — letting the input slot into the <em>middle</em> of a command, and letting you use it more than once in the same command line.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Worked Examples', html: `
<h3>Example 1 — Count how many ERROR lines are in a log file</h3>
<pre><code class="language-bash">grep "ERROR" app.log | wc -l
# 47

# Equivalent, single command (grep -c counts matching LINES directly):
grep -c "ERROR" app.log
# 47

# Case-insensitive, in case the log mixes "ERROR" and "Error":
grep -ic "error" app.log
# 52</code></pre>
<p>Two ways to the same number: pipe <code>grep</code>'s matching lines into <code>wc -l</code> to count them, or skip the pipe entirely with <code>grep -c</code>, which counts matching lines itself. The piped version is worth knowing because the same shape (<code>filter | wc -l</code>) works after <em>any</em> filter, not just <code>grep</code>.</p>

<h3>Example 2 — Top-N: find the 5 most frequent IP addresses hitting an access log</h3>
<pre><code class="language-bash">awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -5
#   842 203.0.113.9
#   601 203.0.113.44
#   399 198.51.100.2
#   210 198.51.100.7
#    88 192.0.2.15</code></pre>
<p>Read this pipeline stage by stage — it's the single most important pattern in this whole topic:</p>
<ol>
  <li><code>awk '{print $1}'</code> — pull out just the first whitespace-separated field of each line (the IP address, in a typical access log format).</li>
  <li><code>sort</code> — put all identical IPs next to each other, so duplicates become adjacent.</li>
  <li><code>uniq -c</code> — collapse each run of adjacent identical lines into one, prefixed with its count. (Remember: this step only works correctly <em>because</em> the previous <code>sort</code> made duplicates adjacent.)</li>
  <li><code>sort -rn</code> — sort the "count IP" lines numerically (<code>-n</code>) and in reverse (<code>-r</code>), so the highest counts come first.</li>
  <li><code>head -5</code> — keep only the top 5 lines.</li>
</ol>
<p>This exact <code>sort | uniq -c | sort -rn | head</code> tail end is worth memorizing outright — it's the standard idiom any time the question is "what are the most common values in this column?", regardless of what feeds into it.</p>

<h3>Example 3 — In-place edit: rename a config key across a file, safely</h3>
<pre><code class="language-bash"># First, DRY RUN — see what would change without touching the file
# (no -i, so sed just prints the result to the screen):
sed 's/max_connections/maxConnections/g' server.conf

# Happy with the preview? Now make it permanent, keeping a backup of
# the original just in case:
sed -i.bak 's/max_connections/maxConnections/g' server.conf
ls
# server.conf   server.conf.bak

diff server.conf.bak server.conf
# < max_connections = 100
# > maxConnections = 100</code></pre>
<p>Previewing a <code>sed</code> substitution without <code>-i</code> first, then re-running the identical command with <code>-i.bak</code> added, is a habit worth building: it costs nothing and gives you both a safety check and an automatic backup before an irreversible in-place edit.</p>

<h3>Example 4 — Compare two sorted user lists and join them with metadata</h3>
<pre><code class="language-bash"># active-users.txt and departed-users.txt are both sorted lists of usernames.
# Which users are on BOTH lists (an error condition worth flagging)?
comm -12 active-users.txt departed-users.txt
# blee
# jsmith

# user-emails.txt is "username email", sorted by username.
# Attach email addresses to everyone in active-users.txt:
join active-users.txt user-emails.txt
# ajones ajones@example.com
# blee blee@example.com
# jsmith jsmith@example.com</code></pre>
<p><code>comm -12</code> suppresses the "only in file1" and "only in file2" columns, leaving just the lines common to both files — a quick sanity check for overlap between two sets. <code>join</code> then takes one of those files and stitches in matching data from a second file by shared key, exactly like a lightweight relational join — provided (as always with <code>join</code> and <code>comm</code>) both inputs are pre-sorted on the field being compared.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '⚠️ Edge Cases', html: `
<h3><code>2&gt;&amp;1</code> order matters — a lot</h3>
<p>The shell processes redirections strictly left to right, and <code>2&gt;&amp;1</code> means "point fd 2 at whatever fd 1 <em>currently</em> points at" — not "keep them linked forever." That makes the order you write things in change the result completely:</p>
<pre><code class="language-bash"># CORRECT — both stdout and stderr end up in out.log:
# Step 1: fd 1 now points at out.log.
# Step 2: fd 2 is set to "wherever fd 1 points right now" — out.log.
command &gt; out.log 2&gt;&amp;1

# WRONG (probably not what you wanted) — stderr still goes to the
# terminal, only stdout ends up in out.log:
# Step 1: fd 2 is set to "wherever fd 1 points right now" — the terminal.
# Step 2: fd 1 is THEN redirected to out.log — but fd 2 was already
# locked onto the terminal in step 1, so it stays there.
command 2&gt;&amp;1 &gt; out.log</code></pre>
<p>The rule of thumb: redirect stdout to its final destination <em>first</em>, then say <code>2&gt;&amp;1</code> to have stderr follow it there. Reversed, stderr "follows" stdout's <em>old</em> destination (the terminal) instead of its new one.</p>

<h3>Unquoted globs can silently change what a pipeline sees</h3>
<p>Wildcards like <code>*</code> are expanded by the <em>shell</em> before the command ever runs, not by the command itself. That's usually what you want (<code>rm *.log</code> works because the shell hands <code>rm</code> a literal list of matching filenames) — but inside a pipeline it can bite you if a variable or pattern you expected to be treated literally happens to contain a shell metacharacter:</p>
<pre><code class="language-bash"># If the current directory happens to contain files, an UNQUOTED "*"
# in a grep pattern gets expanded by the shell into those filenames
# BEFORE grep ever sees it — not treated as a regex wildcard:
grep *.txt data.log      # shell may expand *.txt to actual filenames first

# Quote the pattern so the shell leaves it alone and grep gets the
# literal text (and its own regex engine) to work with:
grep "some.*pattern" data.log</code></pre>
<p>Rule of thumb: quote any pattern you pass to <code>grep</code>/<code>sed</code>/<code>awk</code> unless you specifically want the <em>shell</em> (not the tool) to expand it first.</p>

<h3><code>grep -F</code> for literal strings — faster, and immune to regex surprises</h3>
<p>Every character in a normal <code>grep</code> pattern that happens to also be a regex metacharacter (<code>.</code>, <code>*</code>, <code>[</code>, <code>^</code>, <code>$</code>, and more) is interpreted as regex syntax, not as that literal character. Searching for a literal string that contains any of these — a file path like <code>a.b.c</code>, a version number like <code>3.14</code>, an IP address — can silently match more (or less) than intended, because <code>.</code> means "any character," not a literal dot:</p>
<pre><code class="language-bash"># "3.14" as a REGEX also matches "3x14", "3-14", "3_14"... because "."
# means "any single character":
grep "3.14" versions.txt

# -F ("fixed strings") treats the whole pattern as literal text —
# no character is special, and it's also generally faster since grep
# skips the regex engine entirely:
grep -F "3.14" versions.txt</code></pre>
<p>Whenever the pattern is a literal string you typed out yourself (not a pattern with intentional wildcards), <code>-F</code> is both safer and quicker.</p>

<h3><code>awk</code> vs. <code>cut</code> on whitespace-separated data</h3>
<p><code>cut -d' '</code> splits strictly on every single occurrence of the delimiter — so a run of multiple consecutive spaces (extremely common in things like <code>ls -l</code> output or hand-aligned text) produces extra, <em>empty</em> fields, throwing off field numbers entirely. <code>awk</code>'s default field-splitting treats any run of whitespace (spaces and/or tabs) as a single separator, which handles ragged, human-formatted columns correctly:</p>
<pre><code class="language-bash"># A line with two spaces between columns breaks cut's field count —
# field 2 ends up EMPTY, and what you wanted is pushed to field 3:
echo "alice  25  engineer" | cut -d' ' -f2
# (empty)

# awk's default whitespace-splitting collapses the run of spaces
# automatically, so field 2 is exactly what you expect:
echo "alice  25  engineer" | awk '{print $2}'
# 25</code></pre>
<p>Reach for <code>cut</code> only when the delimiter is single-character and consistent (true CSV, colon-delimited <code>/etc/passwd</code>-style files); reach for <code>awk</code> the moment field widths or spacing are irregular.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'cheat-sheet', title: '📋 Cheat Sheet', html: `
<table>
  <thead><tr><th>Command</th><th>Purpose</th><th>Key flags</th></tr></thead>
  <tbody>
    <tr><td><code>&gt;</code></td><td>Redirect stdout to a file, overwriting it</td><td>truncates the file first</td></tr>
    <tr><td><code>&gt;&gt;</code></td><td>Redirect stdout to a file, appending</td><td>never truncates</td></tr>
    <tr><td><code>&lt;</code></td><td>Redirect a file's contents in as stdin</td><td>—</td></tr>
    <tr><td><code>2&gt;</code></td><td>Redirect stderr only, to a file</td><td>fd 2</td></tr>
    <tr><td><code>2&gt;&amp;1</code></td><td>Point stderr at wherever stdout currently points</td><td>order-sensitive — put after <code>&gt; file</code></td></tr>
    <tr><td><code>&amp;&gt;</code></td><td>Redirect both stdout and stderr to one file</td><td>bash/zsh extension, not POSIX sh</td></tr>
    <tr><td><code>/dev/null</code></td><td>Discard anything written to it</td><td>bottomless — writes always "succeed"</td></tr>
    <tr><td><code>|</code></td><td>Pipe: connect one command's stdout to the next command's stdin</td><td>does not carry stderr</td></tr>
    <tr><td><code>tee</code></td><td>Write a stream to a file AND pass it through unchanged</td><td><code>-a</code> append instead of overwrite</td></tr>
    <tr><td><code>grep</code></td><td>Print lines matching a pattern</td><td><code>-i</code> case-insensitive · <code>-v</code> invert · <code>-n</code> line numbers · <code>-r</code> recursive · <code>-E</code> extended regex · <code>-o</code> matched text only · <code>-c</code> count · <code>-F</code> fixed string</td></tr>
    <tr><td><code>sed</code></td><td>Stream-edit lines: substitute or delete</td><td><code>s/x/y/g</code> substitute (all with <code>g</code>) · <code>-i</code> edit in place · <code>/pat/d</code> delete matching lines</td></tr>
    <tr><td><code>awk</code></td><td>Field-aware processing / small pattern-action language</td><td><code>{print $1}</code> print field · <code>-F</code> field separator · <code>/pat/ {…}</code> conditional action · <code>NR</code>/<code>NF</code></td></tr>
    <tr><td><code>sort</code></td><td>Reorder lines</td><td><code>-n</code> numeric · <code>-r</code> reverse · <code>-k</code> sort by field · <code>-u</code> unique (sorts, then dedupes)</td></tr>
    <tr><td><code>uniq</code></td><td>Collapse adjacent duplicate lines</td><td><code>-c</code> prefix with count · requires pre-sorted input for non-adjacent duplicates</td></tr>
    <tr><td><code>wc</code></td><td>Count lines/words/bytes</td><td><code>-l</code> lines · <code>-w</code> words · <code>-c</code> bytes</td></tr>
    <tr><td><code>cut</code></td><td>Extract columns by a fixed delimiter</td><td><code>-d</code> delimiter · <code>-f</code> field number(s)/range</td></tr>
    <tr><td><code>tr</code></td><td>Translate, delete, or squeeze characters</td><td><code>-d</code> delete · <code>-s</code> squeeze repeats · stdin only, no filename args</td></tr>
    <tr><td><code>paste</code></td><td>Merge lines of files side by side</td><td><code>-d</code> custom delimiter (default TAB)</td></tr>
    <tr><td><code>join</code></td><td>Relational join of two files on a common field</td><td><code>-t</code> delimiter · <code>-1</code>/<code>-2</code> join field per file · both inputs must be sorted</td></tr>
    <tr><td><code>comm</code></td><td>Compare two sorted files: unique-to-1 / unique-to-2 / common</td><td><code>-1 -2 -3</code> suppress a column · both inputs must be sorted</td></tr>
    <tr><td><code>xargs</code></td><td>Turn stdin lines into arguments for another command</td><td><code>-I{}</code> placeholder, one invocation per line</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">What's the difference between stdout and stderr, and why does Linux keep them separate?</div>
<div class="qa-a">
<p><strong>stdout</strong> (fd 1) is a program's normal output — the actual results it's designed to produce. <strong>stderr</strong> (fd 2) is a separate channel reserved for errors, warnings, and diagnostics. They're kept separate so a script or pipeline can capture <em>real output</em> without accidentally also capturing (or losing) error messages — you can redirect stdout to a file to save results while stderr still prints live to your terminal for you to notice, or redirect stderr to a log file while piping stdout onward into the next stage of a pipeline. If they were merged into one stream by default, filtering "just the results" out of "results plus whatever went wrong" would be far harder.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between <code>&gt;</code> and <code>&gt;&gt;</code>, and between redirection and piping in general?</div>
<div class="qa-a">
<p><code>&gt;</code> redirects a stream to a file and <strong>overwrites</strong> it (truncates first); <code>&gt;&gt;</code> redirects to a file and <strong>appends</strong>, preserving whatever was already there. More broadly, redirection (<code>&gt;</code>, <code>&gt;&gt;</code>, <code>&lt;</code>, <code>2&gt;</code>) always wires a stream to a <em>file</em> on disk, while a pipe (<code>|</code>) wires the stdout of one process directly to the stdin of another <em>process</em> — no file involved, and both processes can run concurrently, with the second one consuming lines as the first produces them.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What does <code>2&gt;&amp;1</code> do, and why does <code>command &gt; file 2&gt;&amp;1</code> behave differently from <code>command 2&gt;&amp;1 &gt; file</code>?</div>
<div class="qa-a">
<p><code>2&gt;&amp;1</code> means "point file descriptor 2 (stderr) at whatever file descriptor 1 (stdout) currently points at" — it's a snapshot of a target, not a permanent link. The shell applies redirections left to right, so in <code>command &gt; file 2&gt;&amp;1</code>, stdout is pointed at <code>file</code> first, and <em>then</em> stderr is told to follow stdout — landing in <code>file</code> too. In <code>command 2&gt;&amp;1 &gt; file</code>, stderr is told to follow stdout <em>while stdout still points at the terminal</em>, and only afterward is stdout redirected to <code>file</code> — leaving stderr on the terminal and only stdout in the file. The fix is always to put <code>2&gt;&amp;1</code> last.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What are the different jobs of <code>grep</code>, <code>sed</code>, and <code>awk</code> — when do you reach for each?</div>
<div class="qa-a">
<p><code>grep</code> only searches — it filters a stream down to the lines that match a pattern (or, with <code>-v</code>, the lines that don't); it can't change a line's content. <code>sed</code> is a "stream editor" — it can do everything <code>grep</code> does plus actually transform lines: substitute text (<code>s/x/y/g</code>) or delete matching lines (<code>/pat/d</code>), still one line at a time. <code>awk</code> goes further still: it automatically splits each line into whitespace-separated fields (<code>$1</code>, <code>$2</code>, ...) and lets you write pattern-action logic against them — it's effectively a small programming language, and the right tool once you need field-aware logic (sums, comparisons, custom formatting) rather than just line-level search-and-replace. Rough rule: <code>grep</code> to find, <code>sed</code> to find-and-edit a whole line, <code>awk</code> once you need individual columns.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Walk through how you'd build a pipeline to find the 10 most common values in a column of a log file.</div>
<div class="qa-a">
<p>The standard idiom is <code>awk '{print $N}' file | sort | uniq -c | sort -rn | head -10</code>. Step by step: <code>awk '{print $N}'</code> extracts just the column of interest; <code>sort</code> groups identical values so they become adjacent; <code>uniq -c</code> collapses each run of adjacent duplicates into a single line prefixed with its count (this step only works because the values are now adjacent, thanks to the prior sort); a second <code>sort -rn</code> then orders those "count value" lines numerically and in reverse, so the highest counts come first; and <code>head -10</code> trims it down to the top 10. Interviewers are usually listening for whether you know <code>uniq -c</code> needs pre-sorted input — that's the detail that trips people up.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Why does <code>uniq -c</code> sometimes give the "wrong" counts, and how do you fix it?</div>
<div class="qa-a">
<p><code>uniq</code> only detects duplicates that are directly adjacent to each other in the stream — it has no memory of lines seen earlier. If the same value appears in several places scattered throughout an unsorted file, <code>uniq -c</code> reports each scattered occurrence as its own separate group of 1, instead of one combined count. The fix is always to <code>sort</code> the stream first so that every instance of a given value ends up next to every other instance, guaranteeing <code>uniq -c</code> sees them as one contiguous run.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q"><code>cut</code> vs. <code>awk</code> for extracting a column — which would you use, and why?</div>
<div class="qa-a">
<p><code>cut -d&lt;delim&gt; -f&lt;n&gt;</code> is the lighter-weight choice for cleanly delimited data with a single, consistent separator character — true CSV, or colon-delimited files like <code>/etc/passwd</code>. It breaks down on data with variable-width whitespace (multiple consecutive spaces), because it treats every single occurrence of the delimiter as a new field boundary, producing empty fields and shifting the column numbering. <code>awk</code>'s default field-splitting treats any run of whitespace as one separator, so <code>awk '{print $N}'</code> handles ragged, human-formatted text correctly where <code>cut</code> would not — making <code>awk</code> the safer default the moment the columns aren't perfectly single-character-delimited.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Why would you ever need <code>xargs</code> — why can't you just pipe filenames straight into a command like <code>rm</code>?</div>
<div class="qa-a">
<p>A pipe only connects one command's stdout to the next command's <em>stdin</em> — but many commands (<code>rm</code>, <code>cp</code>, <code>mkdir</code>, <code>curl</code>) don't read their targets from stdin at all; they expect them as command-line <em>arguments</em>. Piping a list of filenames into <code>rm</code> directly does nothing, because <code>rm</code> never looks at stdin for filenames. <code>xargs</code> bridges that gap: it reads lines from stdin and uses them to construct and run another command, appending them as arguments (or, with <code>-I{}</code>, substituting a placeholder anywhere in the command, once per input line) — e.g. <code>find . -name "*.tmp" | xargs -I{} rm {}</code> deletes every matched file even though <code>rm</code> itself never reads a stream.</p>
</div>
</div>
`}

]});
