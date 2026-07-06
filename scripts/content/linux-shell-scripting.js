window.PREP_SITE.registerTopic({
  id: 'linux-shell-scripting',
  module: 'linux',
  title: 'Shell Scripting (Bash)',
  estimatedReadTime: '30 min',
  tags: ['linux', 'bash', 'shell', 'scripting', 'automation'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>A <strong>shell script</strong> is just a text file full of the same commands you'd type at a prompt, saved so you can run the whole sequence again with one command instead of retyping it. Bash turns "things I did once" into "things that run the same way every time" — the entire point of automation.</p>
<ul>
  <li><strong>Every script starts with a shebang</strong> — <code>#!/usr/bin/env bash</code> on the first line — and needs <code>chmod +x script.sh</code> before you can run it as <code>./script.sh</code>. Running it as <code>bash script.sh</code> works without the executable bit or shebang at all; <code>source script.sh</code> (or <code>. script.sh</code>) is different again — it runs in your <em>current</em> shell instead of a new one, which is the only way a script can change your current directory or export variables into the shell you're typing in.</li>
  <li><strong>Quote your variables. Always.</strong> <code>"$var"</code> expands the variable and protects it from word-splitting and glob expansion; <code>'$var'</code> (single quotes) doesn't expand anything at all — it's a literal string. Forgetting to quote a variable that might contain a space, or might be empty, is the single most common source of shell script bugs, from silently-wrong behavior to accidentally deleting the wrong files.</li>
  <li><strong>Tests, conditionals, and loops give scripts logic.</strong> <code>[[ ]]</code> (bash's modern test) is generally safer than the POSIX <code>[ ]</code>/<code>test</code>; <code>if/elif/else</code> and <code>case</code> branch on those tests; <code>for</code>, <code>while</code>, and <code>until</code> repeat work. Functions with <code>local</code> variables let you package logic into reusable, non-leaking pieces.</li>
  <li><strong>Robustness is opt-in, not automatic.</strong> Bash's default behavior is forgiving to a fault — it keeps running after a command fails, silently treats an unset variable as an empty string, and ignores failures in the middle of a pipeline. <code>set -euo pipefail</code> at the top of a script turns all three of those off, which is why it's the near-universal first line of any script meant to be trusted. A <code>trap 'cleanup' EXIT</code> guarantees your cleanup code runs even when the script exits early because of that stricter behavior.</li>
  <li><strong>This is topic 5 of the Linux module.</strong> It builds directly on navigation, permissions, and text-processing/pipelines from earlier topics — a shell script is, at its core, just those same commands sequenced with variables, conditionals, and loops wrapped around them. It assumes you're comfortable with the basics and focuses on turning ad-hoc commands into a script you'd trust to run unattended.</li>
</ul>
<p><strong>Mantra:</strong> "Quote every variable, check every exit code, fail fast with <code>set -euo pipefail</code>, and clean up with <code>trap</code> — a script that fails loudly and safely beats one that fails silently and destructively."</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why write a script instead of just typing commands?</h3>
<p>You already know how to run individual commands interactively — that's everything the earlier Linux topics covered. A <strong>shell script</strong> is the next step: instead of typing a sequence of commands by hand every time, you save them into a file and run that file as a single unit. This matters for a few concrete reasons:</p>
<ul>
  <li><strong>Repeatability.</strong> A deploy process, a backup routine, a build step — anything you do more than once benefits from being written down exactly once, so it runs identically every time instead of depending on you remembering every flag correctly at 2am.</li>
  <li><strong>Composability with the rest of the system.</strong> Scripts can be scheduled (cron, systemd timers), triggered by CI/CD pipelines, called from other scripts, and wired into git hooks — none of which is possible with commands that only exist in your terminal history.</li>
  <li><strong>Shareability.</strong> A script is a file you can commit to version control, code-review, and hand to a teammate (or your future self) with confidence that it does exactly what it says, instead of a half-remembered sequence of manual steps in a wiki page.</li>
  <li><strong>It's still just bash.</strong> There's no new syntax to learn beyond what you already know from typing commands — scripting just adds variables, conditionals, loops, and functions around the same <code>ls</code>, <code>grep</code>, <code>cp</code>, and pipelines you already use.</li>
</ul>

<h3>Bash, sh, and "the shell" — which one is a script actually running in?</h3>
<p><strong>Bash</strong> ("Bourne Again SHell") is one specific shell program — the default on most Linux distros and the one this topic focuses on. <strong>sh</strong> historically refers to the older, more limited POSIX Bourne shell; on many modern Linux systems <code>/bin/sh</code> is actually a symlink to a smaller, stricter shell like <code>dash</code>, not bash — which matters because dash doesn't understand bash-only features like <code>[[ ]]</code> or arrays. This is exactly why every script in this topic starts with a shebang that pins it to bash specifically, rather than leaving it to whatever <code>/bin/sh</code> happens to point to on a given machine.</p>

<h3>What actually happens when a script "runs"</h3>
<p>A shell script is not compiled — it's read and executed line by line by whichever shell interprets it, exactly as if you'd typed each line at an interactive prompt (with the added ability to define variables, functions, and control flow that persist across those lines). This is why a syntax error later in a long script doesn't always stop earlier commands from having already run — bash generally parses a script top-to-bottom as it executes, not all at once ahead of time. It also explains why <em>which</em> program interprets your script matters: the exact same text file can behave differently depending on whether it's launched with <code>bash</code>, <code>sh</code>, or another shell — the shebang line (next section) is how a script pins down that choice for itself.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>A script is a sequence of expansions, then executions</h3>
<p>The mental model that makes bash scripting click: before bash runs a line, it first <strong>expands</strong> everything on that line — variables become their values, <code>$(...)</code> becomes the output of a command, <code>~</code> becomes your home directory, <code>*</code> becomes matching filenames — and only <em>then</em> does it split the result into words and run the command. Nearly every scripting bug traces back to a mismatch between what you expected that expansion step to produce and what it actually produced. Quoting (covered in Mechanics) is entirely about controlling that expansion step.</p>
<pre><code class="language-text">You write:      cp $file $dest
Bash expands:   cp   my file.txt   backup/     ← unquoted $file split into TWO words
Bash runs:      cp "my" "file.txt" "backup/"    ← cp sees 3 arguments, not 2 — breaks

You write:      cp "$file" "$dest"
Bash expands:   cp "my file.txt" "backup/"      ← quotes protect the spaces
Bash runs:      cp "my file.txt" "backup/"       ← cp sees 2 arguments — correct
</code></pre>

<h3>Three environments a variable can live in</h3>
<p>It helps to picture three concentric levels a piece of data can exist at, because scripts constantly move data between them:</p>
<ul>
  <li><strong>A shell variable</strong> — created with <code>name=value</code> — exists only inside the current shell (or script) and is invisible to any program that shell launches.</li>
  <li><strong>An environment variable</strong> — created with <code>export name=value</code> — is copied into every child process that shell launches (other scripts, programs) at the moment they start, but changes a child makes to its copy never flow back up to the parent.</li>
  <li><strong>A sourced definition</strong> — brought in with <code>source file.sh</code> (or the identical shorthand <code>. file.sh</code>) — runs that file's commands directly inside your <em>current</em> shell, as if you'd typed them yourself, rather than launching a separate child process. This is the only one of the three that can change your current shell's working directory, or define a function/variable that lingers in your interactive session after the file finishes.</li>
</ul>
<p>This is exactly why <code>./script.sh</code> can never <code>cd</code> you anywhere — it runs in a brand-new child shell process that disappears the moment the script ends, taking any directory change with it — while <code>source script.sh</code> runs in your actual shell and any <code>cd</code> inside it sticks.</p>

<h3>Every command leaves behind an exit code — that's how scripts make decisions</h3>
<p>Every single command that finishes — whether it's <code>ls</code>, <code>grep</code>, or your own function — leaves behind a small integer called its <strong>exit code</strong> (also called exit status): <code>0</code> means success, anything from <code>1</code> to <code>255</code> means some kind of failure, and the specific non-zero number is often meaningful (e.g. <code>grep</code> uses <code>1</code> specifically to mean "no match found," not an error). This one number is the entire foundation that <code>if</code>, <code>&amp;&amp;</code>, <code>||</code>, and <code>set -e</code> are built on — a script's control flow is, underneath, just a long chain of decisions based on these exit codes, covered fully in Mechanics below.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>The shebang: <code>#!/usr/bin/env bash</code></h3>
<pre><code class="language-bash">#!/usr/bin/env bash
echo "Hello from bash"</code></pre>
<p>The first line of a script — starting with <code>#!</code> ("shebang" or "hashbang") — tells the operating system which program should interpret the rest of the file when it's run directly (e.g. <code>./script.sh</code>). <code>#!/usr/bin/env bash</code> asks the system to find <code>bash</code> wherever it happens to be on the current <code>PATH</code>, which is more portable than hardcoding <code>#!/bin/bash</code> — some systems (notably macOS with Homebrew, or environments using a newer bash than the system default) install bash somewhere other than <code>/bin/bash</code>. The shebang line only matters when a script is run <em>directly</em> — if you run it as <code>bash script.sh</code>, you're already telling the system which interpreter to use, so the shebang is ignored (but should still be there, for documentation and for anyone who later runs it directly).</p>

<h3>Making a script executable: <code>chmod +x</code></h3>
<pre><code class="language-bash">chmod +x script.sh
./script.sh</code></pre>
<p>A freshly-written script file is just text — the filesystem needs to be told it's allowed to be <em>run</em> as a program, which is a separate permission bit from being readable or writable (covered in depth in the Files & Permissions topic). <code>chmod +x script.sh</code> adds the executable bit for everyone with read access; without it, <code>./script.sh</code> fails with "Permission denied" even though the file's contents are perfectly valid bash.</p>

<h3>Three ways to run a script — and why they behave differently</h3>
<pre><code class="language-bash"># 1. Direct execution — requires the executable bit AND a shebang.
#    Runs in a brand-new child shell process.
./script.sh

# 2. Explicit interpreter — works with NO executable bit and NO shebang needed;
#    you're telling the system which shell to use directly.
#    Also runs in a brand-new child shell process.
bash script.sh

# 3. Sourcing — runs the script's commands IN YOUR CURRENT SHELL, not a child.
#    The only one of the three that can change your current directory,
#    or export variables/functions into your interactive session.
source script.sh
. script.sh   # identical shorthand, works in every POSIX-compatible shell</code></pre>
<p>The distinction that trips people up most: <code>./script.sh</code> and <code>bash script.sh</code> both spawn a separate child process to run the script, so anything that process does to its own environment — <code>cd</code>-ing somewhere, setting a variable, exporting something — disappears the instant the script finishes, because that whole child process (and its environment) is thrown away. <code>source</code> (or its dot-shorthand) instead runs the script's lines directly in your current, already-running shell — exactly as if you'd typed them one at a time — so a <code>cd</code> inside a sourced script actually leaves you in that new directory afterward, and variables it sets remain set in your terminal. This is exactly why tools that need to modify your current shell (like activating a Python virtual environment, or reloading your <code>~/.bashrc</code>) are always <em>sourced</em>, never executed directly: <code>source venv/bin/activate</code>, not <code>./venv/bin/activate</code>.</p>

<h3>Variables and quoting</h3>
<pre><code class="language-bash"># Assignment — NO spaces around the "=" (this is not optional, it's a hard rule):
name="Alice"
count=3

# Reading a variable — the $ prefix retrieves its value:
echo $name

# \${} form — same value, but disambiguates where the variable name ends,
# which matters the moment you want to butt it up against other text:
echo "\${name}_backup.txt"     # Alice_backup.txt
echo "$name_backup.txt"       # WRONG — bash reads this as $name_backup (undefined), then .txt

# Default values — \${var:-default} yields "default" ONLY IF var is unset or empty,
# without permanently changing var itself:
echo "\${count:-0}"             # 3  (count is set, so the default is ignored)
echo "\${missing:-0}"           # 0  (missing is unset, so the default is used)

# Quoting — this is the single most important habit in this whole topic:
file="my report.txt"
echo "$file"      # my report.txt        — double quotes: variable IS expanded
echo '$file'       # $file                 — single quotes: NOTHING is expanded, literal text
echo $file          # my report.txt         — UNQUOTED: expanded, then WORD-SPLIT on spaces
                     #                          (looks fine printed, but breaks the instant this
                     #                           value is passed as an argument to another command)</code></pre>
<p>Double quotes (<code>"$var"</code>) expand the variable's value but protect it from being split into multiple words on whitespace and from having <code>*</code>/<code>?</code> glob-expanded against filenames — this is the default you should reach for almost everywhere. Single quotes (<code>'$var'</code>) suppress <em>all</em> expansion, including variable expansion — useful specifically when you want the literal characters, e.g. printing a template or an example command. Leaving a variable completely unquoted is the dangerous middle ground: bash still expands it, but then re-splits the result on whitespace and expands any <code>*</code>/<code>?</code> it finds — which is harmless for a variable you know is a single safe word, and a source of subtle, painful bugs for anything else (a filename with a space, an empty variable that silently vanishes instead of erroring, user input containing a stray <code>*</code>). <code>\${var}</code> (braces) is functionally identical to <code>$var</code> for retrieval, but is required whenever you need to immediately concatenate other text onto the variable name without bash misreading where the name ends — as in the <code>\${name}_backup.txt</code> example above.</p>

<h3>Command substitution: <code>$(...)</code></h3>
<pre><code class="language-bash"># Capture a command's stdout output into a variable:
today=$(date +%Y-%m-%d)
echo "Today is $today"

# Use it directly inline, without a variable:
echo "There are $(ls | wc -l) files here"

# The older backtick syntax means the same thing, but doesn't nest cleanly —
# $(...) is the modern, preferred form:
today=\`date +%Y-%m-%d\`   # works, but avoid in new scripts</code></pre>
<p><code>$(command)</code> runs <code>command</code> in a subshell, waits for it to finish, and substitutes whatever it printed to stdout (with a trailing newline stripped) right into the surrounding line — this is how scripts capture the result of one command to use as input to another. Prefer <code>$(...)</code> over the older backtick syntax (<code>\`command\`</code>): they're equivalent for simple cases, but <code>$(...)</code> nests inside other <code>$(...)</code> calls cleanly and is far more readable once anything gets even slightly complex.</p>

<h3>Output and input: <code>echo</code>, <code>printf</code>, <code>read</code></h3>
<pre><code class="language-bash"># echo — simplest way to print text, adds a trailing newline automatically:
echo "Deployment starting..."
echo "Count: $count"

# printf — more predictable for anything beyond a plain string: exact formatting,
# no surprises with leading dashes or escape sequences, no automatic newline
# (you add \\n yourself):
printf "Name: %s, Count: %d\\n" "$name" "$count"

# read — pauses the script and waits for the user to type a line, storing it
# in the named variable(s):
read -p "Enter your name: " username
echo "Hello, $username"

# read without -p (prompt shown separately), and reading multiple values at once:
echo "Enter width and height:"
read width height
echo "Area: $((width * height))"</code></pre>
<p><code>echo</code> is the everyday choice for simple messages, but its handling of things like leading <code>-</code> flags or backslash escapes varies subtly across shells and options, which is why anything that needs to be exact or portable reaches for <code>printf</code> instead — it takes an explicit format string (<code>%s</code> for a string, <code>%d</code> for an integer, and so on) and never adds anything you didn't ask for, including the newline. <code>read</code> is the standard way a script pauses to accept interactive input from whoever's running it, storing what they type into one or more variables.</p>

<h3>Tests: <code>[ ]</code>, <code>[[ ]]</code>, and <code>test</code></h3>
<pre><code class="language-bash"># All three of these lines do the same file-existence check:
if test -f "myfile.txt"; then echo "exists"; fi
if [ -f "myfile.txt" ]; then echo "exists"; fi
if [[ -f "myfile.txt" ]]; then echo "exists"; fi

# File tests:
[[ -f "$path" ]]     # true if path exists AND is a regular file
[[ -d "$path" ]]     # true if path exists AND is a directory
[[ -e "$path" ]]     # true if path exists at all (any type)
[[ -r "$path" ]]     # true if path is readable
[[ -w "$path" ]]     # true if path is writable
[[ -x "$path" ]]     # true if path is executable

# String tests:
[[ -z "$str" ]]      # true if str is empty (zero length)
[[ -n "$str" ]]      # true if str is NOT empty
[[ "$a" == "$b" ]]   # true if strings are equal
[[ "$a" != "$b" ]]   # true if strings are NOT equal

# Number tests — note the SPELLED-OUT operators, not <, >, ==:
[[ "$a" -eq "$b" ]]  # equal
[[ "$a" -ne "$b" ]]  # not equal
[[ "$a" -lt "$b" ]]  # less than
[[ "$a" -le "$b" ]]  # less than or equal
[[ "$a" -gt "$b" ]]  # greater than
[[ "$a" -ge "$b" ]]  # greater than or equal</code></pre>
<p><code>test</code>, <code>[ ]</code>, and <code>[[ ]]</code> all evaluate a condition and produce an exit code (0 for true, non-zero for false) that <code>if</code>/<code>while</code>/<code>&amp;&amp;</code>/<code>||</code> act on. <code>[ ]</code> is literally shorthand for the <code>test</code> command (it's the same program, just invoked with square-bracket syntax — the closing <code>]</code> is actually its final argument), which makes it POSIX-portable but strict about spacing and quoting: an unquoted empty variable inside <code>[ ]</code> can produce a confusing "unary operator expected" error. <code>[[ ]]</code> is a bash (and zsh/ksh) keyword built directly into the shell's parser rather than a separate command — it doesn't word-split or glob-expand unquoted variables inside it the way <code>[ ]</code> does, supports <code>&amp;&amp;</code>/<code>||</code>/pattern matching directly inside the brackets, and is generally the safer, more forgiving default in any script that doesn't need strict POSIX/<code>sh</code> portability. Number comparisons use spelled-out operator names (<code>-eq</code>, <code>-lt</code>, etc.) rather than <code>&lt;</code>/<code>&gt;</code>, because inside <code>[ ]</code> unescaped <code>&lt;</code>/<code>&gt;</code> are consumed by the shell itself as redirection operators before <code>test</code>/<code>[ ]</code> ever sees them — <code>[ "$a" &lt; "$b" ]</code> silently redirects the stdin of <code>[</code> from a file named after <code>$b</code>, rather than comparing anything. Only the escaped forms, <code>\\&lt;</code> and <code>\\&gt;</code>, reach <code>test</code> as literal characters and perform a byte-wise string comparison there. <code>[[ ]]</code> sidesteps the problem entirely: as a shell keyword rather than a separate command, it never treats <code>&lt;</code>/<code>&gt;</code> as redirection, so unescaped <code>&lt;</code>/<code>&gt;</code> inside <code>[[ ]]</code> directly perform a string comparison, e.g. <code>[[ "$a" &lt; "$b" ]]</code> — one more reason <code>[[ ]]</code> is the safer default.</p>

<h3>Conditionals: <code>if/elif/else</code>, <code>case</code></h3>
<pre><code class="language-bash">if [[ -f "$config" ]]; then
  echo "Config found"
elif [[ -f "$config.default" ]]; then
  echo "Using default config"
else
  echo "No config available" >&2
  exit 1
fi

# case — cleaner than a long if/elif chain when matching one value
# against several possible patterns:
case "$1" in
  start)
    echo "Starting service..."
    ;;
  stop)
    echo "Stopping service..."
    ;;
  restart|reload)
    echo "Restarting service..."
    ;;
  *)
    echo "Usage: $0 {start|stop|restart}" >&2
    exit 1
    ;;
esac</code></pre>
<p><code>if</code> runs the command right after it (conventionally a <code>[[ ]]</code> test, but it can be <em>any</em> command) and branches based on that command's exit code — <code>0</code> takes the <code>if</code> branch, anything else falls through to <code>elif</code>/<code>else</code>. <code>case</code> matches one value against a list of shell glob-style patterns (not full regex) — each branch ends with <code>;;</code>, <code>|</code> combines multiple patterns for one branch (as with <code>restart|reload</code> above), and <code>*)</code> conventionally acts as the catch-all "no match" fallback, matching the <code>default</code> case in other languages.</p>

<h3>Loops: <code>for</code>, <code>while</code>, <code>until</code>, C-style <code>for</code></h3>
<pre><code class="language-bash"># for-in — iterate over a fixed list of words:
for name in Alice Bob Carol; do
  echo "Hello, $name"
done

# for-in over files — the shell expands the glob BEFORE the loop starts:
for f in *.txt; do
  echo "Found: $f"
done

# while — repeat as long as the test succeeds (exit code 0):
count=0
while [[ "$count" -lt 5 ]]; do
  echo "Count is $count"
  count=$((count + 1))
done

# until — repeat as long as the test FAILS (the mirror image of while):
count=0
until [[ "$count" -ge 5 ]]; do
  echo "Count is $count"
  count=$((count + 1))
done

# C-style for ((...)) — for anyone coming from C/Java/JS, the familiar
# init; condition; increment form:
for ((i = 0; i < 5; i++)); do
  echo "i is $i"
done

# while read — the standard, safe way to process a file line by line:
while IFS= read -r line; do
  echo "Line: $line"
done < input.txt</code></pre>
<p><code>for...in</code> iterates over an explicit list of words or a glob expansion (<code>*.txt</code>) — the list is expanded fully <em>before</em> the loop's first iteration, so files added mid-loop won't be picked up. <code>while</code> keeps looping as long as its test keeps succeeding; <code>until</code> is its exact mirror image, looping as long as the test keeps <em>failing</em> — pick whichever reads more naturally for the condition at hand (checking "while the file doesn't exist yet" reads better as <code>until [[ -f "$file" ]]</code> than the double-negative <code>while</code> equivalent). The C-style <code>for ((init; condition; increment))</code> is a bash-specific extension useful for numeric counting when the boundaries aren't known ahead of time as a simple list. The <code>while IFS= read -r line; do ... done &lt; file</code> idiom is the standard, robust way to process a file line-by-line: <code>IFS=</code> (empty) stops <code>read</code> from trimming leading/trailing whitespace off each line, and <code>-r</code> stops it from treating backslashes in the input as escape sequences — both details matter for lines that aren't simple plain words.</p>

<h3>Functions and <code>local</code></h3>
<pre><code class="language-bash">greet() {
  local person="$1"          # local: scoped to this function only
  local greeting="Hello"
  echo "$greeting, $person!"
}

greet "Alice"                 # Hello, Alice!

is_valid_number() {
  local value="$1"
  if [[ "$value" =~ ^[0-9]+$ ]]; then
    return 0                   # success — "true" for a function
  else
    return 1                   # failure — "false" for a function
  fi
}

if is_valid_number "42"; then
  echo "42 is valid"
fi</code></pre>
<p>A bash function is just a named block of commands — defined with <code>name() { ... }</code>, called exactly like any other command by typing its name. <strong>Without</strong> <code>local</code>, every variable a function creates is <em>global</em> by default — it leaks out and can silently overwrite a same-named variable anywhere else in the script, which is one of the more surprising defaults for anyone coming from languages where function-local scope is automatic. <code>local varname="value"</code> explicitly scopes a variable to that function call only, and should be used for essentially every variable a function creates unless you specifically intend to modify something global. A function's "return value" in the exit-code sense comes from <code>return N</code> (0–255, following the same success/failure convention as every other command) — to return actual <em>data</em> (a string, a computed value), a function instead <code>echo</code>s it and the caller captures that output with <code>$(function_name ...)</code>, exactly like capturing any other command's output.</p>

<h3>Positional arguments: <code>$0 $1 $@ $* $# shift</code></h3>
<pre><code class="language-bash">#!/usr/bin/env bash
# Called as: ./deploy.sh production --force extra

echo "Script name: $0"      # ./deploy.sh
echo "First arg:   $1"      # production
echo "Second arg:  $2"      # --force
echo "Arg count:   $#"      # 3

echo "All args (\$@): $@"    # production --force extra
echo "All args (\$*): $*"    # production --force extra   (looks the same printed plainly)

# The $@ vs $* difference only shows up when EXPANDED IN QUOTES and passed on:
print_args() { for a in "$@"; do echo "  [$a]"; done; }
set -- "first arg" "second arg"
print_args "$@"    #   [first arg]        ← "$@" preserves each original arg as ITS OWN word
print_args "$*"    #   [first arg second arg]  ← "$*" joins everything into ONE word

# shift — drops $1 and renumbers everything else down by one, useful for
# processing arguments one at a time in a loop:
while [[ $# -gt 0 ]]; do
  echo "Processing: $1"
  shift
done</code></pre>
<p><code>$0</code> is the script's own invocation name/path; <code>$1</code>, <code>$2</code>, ... are the individual positional arguments the script was called with; <code>$#</code> is the total argument count. <code>$@</code> and <code>$*</code> both represent "all the arguments," and print identically in a plain unquoted <code>echo</code> — but they behave completely differently the moment they're quoted and re-passed to another command: <code>"$@"</code> expands to each argument as its own separately-quoted word (exactly preserving the original argument boundaries, including any spaces inside a single argument), while <code>"$*"</code> expands to a single string with all arguments joined together. <strong>Always use <code>"$@"</code></strong> (quoted) when forwarding arguments to another command — it's the only one of the two that survives arguments containing spaces intact. <code>shift</code> discards <code>$1</code> and shifts every remaining argument down by one position (so the old <code>$2</code> becomes the new <code>$1</code>), which is the standard way to loop through an unknown number of arguments one at a time.</p>

<h3>Exit codes: <code>$?</code>, <code>exit N</code>, <code>&amp;&amp;</code> / <code>||</code></h3>
<pre><code class="language-bash">grep "error" logfile.txt
echo "Exit code of grep was: $?"    # 0 = found a match, 1 = no match, 2 = an actual error

# exit N — end the SCRIPT immediately with a specific exit code
# (0 = success, non-zero = failure; convention, not enforced by the OS):
if [[ ! -f "$config" ]]; then
  echo "Missing config file" >&2
  exit 1
fi

# && — run the next command ONLY IF the previous one succeeded (exit 0):
mkdir -p build && cd build && echo "Ready to build"

# || — run the next command ONLY IF the previous one FAILED (non-zero exit):
grep "ERROR" app.log || echo "No errors found — good"

# Combined pattern — extremely common one-liner for "do X, and if it fails, bail":
cp important.conf backup.conf || { echo "Backup failed!" >&2; exit 1; }</code></pre>
<p><code>$?</code> holds the exit code of the <em>most recently completed</em> command — check it (or use the command directly in a condition) immediately after running something you care about, since running any other command in between overwrites it. <code>exit N</code> ends the entire script right there with exit code <code>N</code>, which becomes <code>$?</code> for whatever called the script. <code>&amp;&amp;</code> chains commands so each one only runs if the previous one succeeded — a lightweight inline alternative to a full <code>if</code> block for simple "do this, then that" sequences — while <code>||</code> is its mirror: the right side only runs if the left side <em>failed</em>, commonly used exactly as shown above to bail out immediately with a clear error message the moment something goes wrong.</p>

<h3>Robustness: <code>set -euo pipefail</code> and <code>trap</code></h3>
<pre><code class="language-bash">#!/usr/bin/env bash
set -euo pipefail

# -e:  exit the script immediately if ANY command fails (non-zero exit),
#      instead of bash's default of barreling ahead regardless.
# -u:  treat any REFERENCE to an unset variable as an error and exit,
#      instead of silently substituting an empty string.
# -o pipefail: make a pipeline's exit code reflect the FIRST command that
#      failed anywhere in the pipe, instead of only ever looking at the
#      exit code of the LAST command in the pipe.

trap 'echo "Cleaning up..."; rm -f "$tmpfile"' EXIT

tmpfile=$(mktemp)
echo "Working with $tmpfile"
# ... script body ...
# whether this script exits normally, exits via "set -e", or is Ctrl+C'd,
# the trap above still fires and removes the temp file.</code></pre>
<p>Bash's defaults are lenient in three specific ways that make scripts fragile: it keeps executing later lines even after an earlier command fails; it silently treats a typo'd or unset variable as an empty string rather than erroring; and in a pipeline (<code>a | b | c</code>), the pipeline's overall exit code is only ever <code>c</code>'s — meaning <code>a</code> can crash entirely and the pipeline still reports success. <code>set -e</code>, <code>set -u</code>, and <code>set -o pipefail</code> turn off each of those three defaults respectively, and <code>set -euo pipefail</code> combines all three onto one line — enabling it near the top of any script you actually want to trust is close to a universal best practice in modern bash. <code>trap 'command' EXIT</code> registers <code>command</code> to run automatically whenever the script exits — normally, via an explicit <code>exit</code>, via <code>set -e</code> aborting it, or via a signal like Ctrl+C — making it the standard way to guarantee cleanup (removing a temp file, releasing a lock) happens no matter <em>how</em> the script ends.</p>

<h3><code>export</code> and <code>source</code></h3>
<pre><code class="language-bash"># export — make a variable visible to CHILD PROCESSES this shell launches
# (without export, the variable is only visible to the current shell/script itself):
export API_URL="https://api.example.com"
./call-api.sh          # this script CAN see $API_URL, because it was exported

# source (or its dot shorthand) — run another file's commands in the
# CURRENT shell, commonly used to pull in shared variables/functions:
source ./lib/common.sh
# or:
. ./lib/common.sh

log_info "Loaded shared functions from common.sh"   # now available, defined in common.sh</code></pre>
<p><code>export</code> promotes a plain shell variable into an <em>environment</em> variable, which means every child process this shell subsequently launches receives a copy of it in its own environment — without <code>export</code>, a variable exists only inside the current shell/script and is invisible to anything it runs. <code>source file.sh</code> is the standard way one script shares reusable variables and functions with another: it reads and executes <code>file.sh</code>'s contents directly into the current shell (as covered in Mental Model above), so any functions or variables <code>file.sh</code> defines become immediately available to the sourcing script, no <code>export</code> needed since there's no child process involved at all.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Worked Examples', html: `
<h3>Example 1 — A complete, robust script: back up a directory</h3>
<pre><code class="language-bash">#!/usr/bin/env bash
set -euo pipefail

# --- usage / argument validation ---
if [[ $# -lt 1 ]]; then
  echo "Usage: $0 &lt;source-dir&gt; [dest-dir]" >&2
  exit 1
fi

src="$1"
dest="\${2:-backups}"     # default to "backups" if no second argument given

if [[ ! -d "$src" ]]; then
  echo "Error: source directory '$src' does not exist" >&2
  exit 1
fi

mkdir -p "$dest"

# --- function: build a timestamped archive name ---
make_archive_name() {
  local base_name
  base_name=$(basename "$src")
  echo "\${base_name}-$(date +%Y%m%d-%H%M%S).tar.gz"
}

archive_name=$(make_archive_name)
archive_path="$dest/$archive_name"

# --- cleanup on any exit (success, error, or Ctrl+C) ---
trap 'echo "Done."' EXIT

# --- do the work, looping over top-level items for a progress log ---
echo "Backing up '$src' to '$archive_path'..."
for item in "$src"/*; do
  echo "  including: $(basename "$item")"
done

if tar -czf "$archive_path" -C "$(dirname "$src")" "$(basename "$src")"; then
  echo "Backup succeeded: $archive_path"
else
  echo "Error: tar command failed" >&2
  exit 1
fi</code></pre>
<p>This single script touches nearly everything from Mechanics: a shebang and <code>set -euo pipefail</code> at the top; argument validation using <code>$#</code> and a default value with <code>\${2:-backups}</code>; a <code>[[ -d ]]</code> test with a proper error path; a function using <code>local</code> that returns data via <code>echo</code>; a <code>for</code> loop for a progress log; a <code>trap ... EXIT</code> for guaranteed cleanup messaging; and an <code>if</code> checking the real exit status of <code>tar</code> rather than assuming it worked. Notice every variable that could contain a space (<code>"$src"</code>, <code>"$dest"</code>, <code>"$archive_path"</code>) stays quoted throughout.</p>

<h3>Example 2 — Argument parsing with a <code>case</code>-based flag loop</h3>
<pre><code class="language-bash">#!/usr/bin/env bash
set -euo pipefail

verbose=false
output="out.txt"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -v|--verbose)
      verbose=true
      shift
      ;;
    -o|--output)
      output="$2"
      shift 2       # consumes BOTH the flag and its value
      ;;
    -h|--help)
      echo "Usage: $0 [-v|--verbose] [-o|--output &lt;file&gt;]"
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

echo "verbose=$verbose, output=$output"</code></pre>
<p>This is the standard hand-rolled pattern for parsing command-line flags in bash (before reaching for something heavier like <code>getopts</code>): a <code>while [[ $# -gt 0 ]]</code> loop paired with a <code>case</code> on <code>$1</code>, where each branch does its own <code>shift</code> (or <code>shift 2</code> for a flag that consumes a following value) to advance through the argument list, and a catch-all <code>*)</code> branch rejects anything unrecognized instead of silently ignoring it.</p>

<h3>Example 3 — Checking a command's success before trusting its output</h3>
<pre><code class="language-bash">#!/usr/bin/env bash
set -euo pipefail

url="https://example.com/health"

if response=$(curl -sf "$url"); then
  echo "Service is healthy: $response"
else
  status=$?
  echo "Health check failed (curl exit code: $status)" >&2
  exit 1
fi

# Same idea with a pipeline — pipefail is what makes this actually reliable:
if curl -sf "$url" | grep -q "ok"; then
  echo "Found 'ok' in the response"
else
  echo "'ok' not found, or curl itself failed" >&2
  exit 1
fi</code></pre>
<p>Capturing a command's output with <code>$(...)</code> directly inside an <code>if</code> is a compact way to both grab the result <em>and</em> branch on whether the command succeeded, in one step. The second block is exactly why <code>set -o pipefail</code> (bundled into <code>set -euo pipefail</code>) matters: without it, if <code>curl</code> failed entirely, the pipeline's exit code would still come only from <code>grep</code> — which would report "no match" rather than the real underlying problem, "curl itself never even connected."</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '⚠️ Edge Cases', html: `
<h3>Unquoted <code>$var</code> silently word-splits</h3>
<pre><code class="language-bash">file="my report.txt"
rm $file        # DANGEROUS: expands to  rm my report.txt
                # — bash sees TWO arguments, "my" and "report.txt",
                #   and tries (and fails, or worse, succeeds partially) to delete BOTH

rm "$file"       # correct — one argument, the actual filename</code></pre>
<p>This is the single most common real-world bash bug, and it gets more dangerous exactly where it matters most — inside an <code>rm</code>, <code>cp</code>, or <code>mv</code> command built from a variable. An unset or empty unquoted variable is just as dangerous in the other direction: <code>rm -rf "$dir"/*</code> where <code>$dir</code> is accidentally empty expands to <code>rm -rf /*</code>. If <code>$dir</code> was never assigned at all, that's exactly the kind of failure <code>set -u</code> is designed to catch — it errors out on the unset variable before it ever reaches <code>rm</code>. But <code>set -u</code> only fires on a truly <em>unset</em> variable: <code>dir=""</code> is still "set" (just to an empty string), so <code>set -u</code> stays silent and <code>rm -rf "$dir"/*</code> still silently expands to <code>rm -rf /*</code> unnoticed. Guard against that case explicitly — e.g. <code>: "\${dir:?dir must not be empty}"</code> or a plain <code>[[ -n "$dir" ]]</code> check — before anything destructive runs.</p>

<h3><code>[ ]</code> vs. <code>[[ ]]</code> — the same-looking condition can behave differently</h3>
<pre><code class="language-bash">name=""
if [ -z $name ]; then echo "empty"; fi     # BREAKS if $name were unset/multi-word —
                                             # unquoted expansion inside [ ] can vanish
                                             # entirely or split into multiple arguments,
                                             # producing a confusing syntax error

if [[ -z $name ]]; then echo "empty"; fi   # SAFE — [[ ]] doesn't word-split or glob-expand
                                             # unquoted variables inside it the same way</code></pre>
<p><code>[[ ]]</code> is more forgiving specifically about unquoted variables inside the brackets, which is why bash scripts (as opposed to strictly POSIX <code>/bin/sh</code> scripts) generally default to it — but the safe habit that works in <em>both</em> is the same one from Mechanics: quote the variable regardless, <code>[[ -z "$name" ]]</code>, and the distinction stops mattering as much.</p>

<h3><code>set -e</code> has surprising gaps — it doesn't catch everything</h3>
<pre><code class="language-bash">set -e
false && echo "unreachable"   # fine — set -e doesn't fire here; the "false" is part of
                                # a larger && expression whose overall failure is expected

if grep "x" file.txt; then     # ALSO fine — a command's failure inside an if/while/until
  echo "found"                  # CONDITION is expected and does not trigger set -e,
fi                               # even though grep failing is a real possibility here

result=$(false)                # this ONE does trigger set -e and exits the script —
echo "unreachable"               # command substitution failures ARE caught</code></pre>
<p><code>set -e</code>'s rule is specifically "exit if a <em>simple command</em>, standing on its own, fails" — but a command's exit code being consumed as part of a condition (<code>if</code>, <code>while</code>, <code>until</code>) or a boolean chain (<code>&amp;&amp;</code>, <code>||</code>) is considered "already handled," so <code>set -e</code> deliberately does not fire in those cases, on the reasoning that you clearly intended to check the result yourself. This is one of the most-cited "gotchas" in bash — the practical takeaway is that <code>set -e</code> is a safety net for the unexpected failures you <em>didn't</em> think to check, not a substitute for actually checking the ones you know might fail.</p>

<h3><code>$@</code> vs. <code>$*</code> — identical until they're quoted and forwarded</h3>
<pre><code class="language-bash">show() { printf '[%s] ' "$@"; echo; }

set -- "one two" three
show "$@"   # [one two] [three]     — each original argument preserved separately
show "$*"   # [one two three]        — all arguments joined into a single string
show $@      # [one] [two] [three]     — unquoted: word-split, losing the original grouping entirely</code></pre>
<p>All three look interchangeable in the simplest cases (single-word arguments, no special characters), which is exactly why this one bites people later, once a script is handed a real argument containing a space — always default to <code>"$@"</code> (quoted) when forwarding a script's own arguments on to another command.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'cheat-sheet', title: '📋 Cheat Sheet', html: `
<table>
  <thead><tr><th>Concept</th><th>Syntax</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>Shebang</td><td><code>#!/usr/bin/env bash</code></td><td>First line; picks bash from <code>PATH</code> instead of hardcoding <code>/bin/bash</code></td></tr>
    <tr><td>Make executable</td><td><code>chmod +x script.sh</code></td><td>Required before <code>./script.sh</code> will run</td></tr>
    <tr><td>Run: direct</td><td><code>./script.sh</code></td><td>Needs +x and shebang; runs in a new child shell</td></tr>
    <tr><td>Run: explicit interpreter</td><td><code>bash script.sh</code></td><td>No +x/shebang needed; still a new child shell</td></tr>
    <tr><td>Run: sourced</td><td><code>source script.sh</code> / <code>. script.sh</code></td><td>Runs in your CURRENT shell — only way to persist <code>cd</code>/vars afterward</td></tr>
    <tr><td>Assign variable</td><td><code>name="value"</code></td><td>No spaces around <code>=</code></td></tr>
    <tr><td>Quoted expansion</td><td><code>"$var"</code></td><td>Expands, no word-splitting/glob — the safe default</td></tr>
    <tr><td>Literal (no expansion)</td><td><code>'$var'</code></td><td>Single quotes suppress ALL expansion</td></tr>
    <tr><td>Disambiguate name</td><td><code>\${var}</code></td><td>Needed before concatenating text, e.g. <code>\${name}_x</code></td></tr>
    <tr><td>Default value</td><td><code>\${var:-default}</code></td><td>Yields default only if var is unset/empty; doesn't change var</td></tr>
    <tr><td>Command substitution</td><td><code>$(command)</code></td><td>Captures stdout; prefer over backticks</td></tr>
    <tr><td>Print</td><td><code>echo</code> / <code>printf</code></td><td><code>printf</code> is more predictable/exact; no auto newline</td></tr>
    <tr><td>Read input</td><td><code>read -p "prompt: " var</code></td><td>Pauses script, stores typed line in var</td></tr>
    <tr><td>Test (POSIX)</td><td><code>[ expr ]</code> / <code>test expr</code></td><td>Same command; strict about quoting/spacing</td></tr>
    <tr><td>Test (bash)</td><td><code>[[ expr ]]</code></td><td>Shell keyword; safer with unquoted vars; supports <code>&amp;&amp;</code>/<code>||</code> inside</td></tr>
    <tr><td>File tests</td><td><code>-f -d -e -r -w -x</code></td><td>regular file / directory / exists / readable / writable / executable</td></tr>
    <tr><td>String tests</td><td><code>-z -n == !=</code></td><td>empty / non-empty / equal / not equal</td></tr>
    <tr><td>Number tests</td><td><code>-eq -ne -lt -le -gt -ge</code></td><td>Spelled out — <code>&lt;</code>/<code>&gt;</code> mean something else in <code>[ ]</code></td></tr>
    <tr><td>Conditional</td><td><code>if / elif / else / fi</code></td><td>Branches on the exit code of the command after <code>if</code></td></tr>
    <tr><td>Multi-way branch</td><td><code>case ... in ... esac</code></td><td>Glob-style patterns; <code>;;</code> ends each branch; <code>*)</code> is catch-all</td></tr>
    <tr><td>Loop: list</td><td><code>for x in a b c; do ... done</code></td><td>List expanded once, before the loop starts</td></tr>
    <tr><td>Loop: condition true</td><td><code>while [[ cond ]]; do ... done</code></td><td>Repeats while cond succeeds</td></tr>
    <tr><td>Loop: condition false</td><td><code>until [[ cond ]]; do ... done</code></td><td>Repeats while cond FAILS — mirror of while</td></tr>
    <tr><td>Loop: C-style</td><td><code>for ((i=0; i<5; i++)); do ... done</code></td><td>Bash extension; familiar numeric counting form</td></tr>
    <tr><td>Function</td><td><code>name() { ...; }</code></td><td>Called like any other command: <code>name arg1</code></td></tr>
    <tr><td>Local variable</td><td><code>local var="value"</code></td><td>Without it, function variables leak to global scope</td></tr>
    <tr><td>Script name / args</td><td><code>$0 $1 $2 ...</code></td><td><code>$0</code> = script path; <code>$1+</code> = positional args</td></tr>
    <tr><td>All args (safe)</td><td><code>"$@"</code></td><td>Each arg as its own word — use this for forwarding args</td></tr>
    <tr><td>All args (joined)</td><td><code>"$*"</code></td><td>All args joined into ONE string</td></tr>
    <tr><td>Arg count</td><td><code>$#</code></td><td>Total number of positional arguments</td></tr>
    <tr><td>Drop first arg</td><td><code>shift</code> / <code>shift N</code></td><td>Renumbers remaining args down; standard for arg-loop parsing</td></tr>
    <tr><td>Last exit code</td><td><code>$?</code></td><td>Check immediately — overwritten by the next command</td></tr>
    <tr><td>End script</td><td><code>exit N</code></td><td><code>0</code> = success, non-zero = failure, by convention</td></tr>
    <tr><td>Run if success</td><td><code>cmd1 && cmd2</code></td><td>cmd2 runs only if cmd1's exit code was 0</td></tr>
    <tr><td>Run if failure</td><td><code>cmd1 || cmd2</code></td><td>cmd2 runs only if cmd1's exit code was non-zero</td></tr>
    <tr><td>Fail fast</td><td><code>set -euo pipefail</code></td><td><code>-e</code> exit on error · <code>-u</code> error on unset var · <code>pipefail</code> catches mid-pipe failures</td></tr>
    <tr><td>Guaranteed cleanup</td><td><code>trap 'cmd' EXIT</code></td><td>Runs cmd on any exit — normal, error, or signal</td></tr>
    <tr><td>Export to children</td><td><code>export VAR=value</code></td><td>Makes VAR visible to child processes this shell launches</td></tr>
    <tr><td>Load into current shell</td><td><code>source file.sh</code></td><td>Shares functions/vars without needing export</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">What's the difference between double quotes, single quotes, and no quotes around a bash variable?</div>
<div class="qa-a">
<p>Double quotes (<code>"$var"</code>) expand the variable to its value but keep that value as a single word — no splitting on internal whitespace and no glob expansion of <code>*</code>/<code>?</code> — which is why it's the safe default almost everywhere. Single quotes (<code>'$var'</code>) suppress expansion entirely; the characters <code>$var</code> are printed literally, which is useful when you actually want to show someone a variable reference rather than its value. No quotes at all (<code>$var</code>) still expands the variable, but then bash re-splits the result on whitespace and expands any glob characters it finds — which works fine for a value you're certain is a single safe word, but silently breaks (or, worse, does something unintended) the moment that value contains a space, is empty, or contains a special character like <code>*</code>.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What does <code>set -euo pipefail</code> actually do, and why put it at the top of nearly every script?</div>
<div class="qa-a">
<p>It's three separate options bundled onto one line. <code>-e</code> makes the script exit immediately the moment any simple command fails, instead of bash's default of plowing ahead regardless. <code>-u</code> makes referencing an unset variable an immediate error, instead of silently substituting an empty string (which can turn a typo'd variable name into a much bigger problem, especially inside a path). <code>-o pipefail</code> fixes a specific bash default where a pipeline's exit code only reflects its <em>last</em> command — with pipefail on, if any command anywhere in the pipe fails, the whole pipeline is considered failed. Together they convert bash's naturally forgiving, "keep going no matter what" default behavior into a strict, fail-fast one — which is what you want for anything beyond a quick throwaway one-liner, since a script that silently continues after a real failure can do a lot of damage before anyone notices.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">How do exit codes work, and how do <code>&amp;&amp;</code> / <code>||</code> use them?</div>
<div class="qa-a">
<p>Every command that finishes leaves behind an integer exit code: <code>0</code> conventionally means success, and any non-zero value (1–255) means some kind of failure, often with a command-specific meaning (e.g. <code>grep</code> uses 1 specifically for "no match found"). <code>$?</code> holds the most recent command's exit code and is overwritten by the very next command, so it needs to be checked (or used) immediately. <code>&amp;&amp;</code> chains a second command to run only if the first one's exit code was 0; <code>||</code> is the mirror — the second command runs only if the first one's exit code was non-zero. Both are effectively lightweight, inline versions of an <code>if</code> statement, and they're the mechanism <code>set -e</code> itself is built on.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between <code>[ ]</code> and <code>[[ ]]</code> in bash?</div>
<div class="qa-a">
<p><code>[ ]</code> is literally shorthand for the <code>test</code> command — a separate external/builtin program, not shell syntax — which makes it POSIX-portable (works in <code>sh</code>, <code>dash</code>, etc.) but strict: an unquoted variable that's empty or contains spaces inside <code>[ ]</code> can produce confusing "unary operator expected" errors or unintended word-splitting. <code>[[ ]]</code> is a keyword built directly into bash's (and zsh's/ksh's) parser — it doesn't word-split or glob-expand unquoted variables the same way, supports <code>&amp;&amp;</code>/<code>||</code> directly inside the brackets instead of needing separate <code>[ ]</code> expressions joined outside, and supports pattern and even <code>&lt;</code>/<code>&gt;</code> string comparisons safely. In any script that doesn't need strict <code>sh</code>-portability, <code>[[ ]]</code> is the safer, more ergonomic default — though quoting variables properly makes either one considerably safer.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">How do you write a bash function, and what does <code>local</code> actually do?</div>
<div class="qa-a">
<p>A function is defined as <code>name() { commands; }</code> and called exactly like any other command, with its own arguments available inside as <code>$1</code>, <code>$2</code>, etc. (separate from the script's own <code>$1</code>/<code>$2</code>). By default, any variable a function assigns is <em>global</em> — visible to, and capable of silently overwriting, a same-named variable anywhere else in the script — which is a surprising default for anyone used to automatic function-local scoping in other languages. <code>local varname="value"</code> explicitly scopes that variable to the current function call only, and is the habit to default to for essentially every variable a function creates. A function signals success/failure through <code>return N</code> (an exit code, 0–255), and returns actual data by <code>echo</code>-ing it, which the caller captures the same way it captures any command's output — with <code>$(function_name ...)</code>.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Why does <code>./script.sh</code> behave differently from <code>source script.sh</code> — for example, why can't a script <code>cd</code> your terminal somewhere?</div>
<div class="qa-a">
<p><code>./script.sh</code> (and equally <code>bash script.sh</code>) launches a brand-new child shell process to run the script; anything that process does to its own environment — changing directory, setting or exporting a variable — only affects that child process, and vanishes the instant the script finishes and the child process is torn down. <code>source script.sh</code> (or its shorthand <code>. script.sh</code>) instead runs the script's commands directly inside your <em>current, already-running</em> shell, exactly as if you'd typed each line yourself — so a <code>cd</code> inside a sourced script really does leave your terminal in that new directory afterward, and any variables or functions it defines remain available in your session. This is exactly why anything meant to modify your current shell — activating a Python virtualenv, reloading a shell config file — is always sourced, never executed directly.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between <code>"$@"</code> and <code>"$*"</code>, and why does it matter?</div>
<div class="qa-a">
<p>Unquoted, or printed plainly, they look identical — both represent "all the positional arguments." The difference only appears when each is quoted and then passed on to another command: <code>"$@"</code> expands to each original argument as its own separately-quoted word, exactly preserving argument boundaries (including any spaces inside a single argument); <code>"$*"</code> expands to a single string with every argument joined together, losing that original separation. In practice, <code>"$@"</code> is almost always what you want when forwarding a script's arguments to another command, since it's the only form that survives an argument containing a space without corrupting it.</p>
</div>
</div>
`}

]});
