window.PREP_SITE.registerTopic({
  id: 'build-pm',
  module: 'Build Tooling',
  title: 'Package Managers',
  estimatedReadTime: '24 min',
  tags: ['build', 'package-manager', 'npm', 'yarn', 'pnpm', 'bun', 'lockfile', 'workspaces', 'semver'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>Package managers install dependencies, manage versions, and orchestrate scripts. Choice affects install speed, disk usage, and monorepo workflow.</p>
<ul>
  <li><strong>npm</strong> — bundled with Node. Mature, slowest install. Lockfile: <code>package-lock.json</code>.</li>
  <li><strong>Yarn</strong> — Facebook's pioneering pm. Yarn 1 (Classic) and Yarn 4 (Berry, modern). Faster than npm; PnP option for stricter dep resolution. Lockfile: <code>yarn.lock</code>.</li>
  <li><strong>pnpm</strong> — content-addressable global store; node_modules is symlinks. ~2× faster install, ~3× less disk. Lockfile: <code>pnpm-lock.yaml</code>. Default for many monorepos.</li>
  <li><strong>Bun</strong> — Zig-based, fastest install (often 5-30× over npm). Also a JS runtime + bundler. Lockfile: <code>bun.lockb</code> (binary).</li>
  <li><strong>Lockfile</strong> — pins exact resolved versions; commit it; <code>npm ci</code> / <code>pnpm install --frozen-lockfile</code> in CI.</li>
  <li><strong>Workspaces</strong> — monorepo support. npm 7+, Yarn, pnpm, Bun all support. pnpm has the strictest hoisting controls.</li>
  <li><strong>Semver</strong> — <code>^1.2.3</code> = compatible (1.x.x), <code>~1.2.3</code> = patch (1.2.x), <code>1.2.3</code> = exact.</li>
  <li><strong>npm scripts</strong> — package.json <code>"scripts"</code> + <code>"run-script"</code>. All managers run them.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>For new projects: <strong>pnpm</strong> (faster, less disk, strict). For monorepos: pnpm or Yarn workspaces. Use <code>npm ci</code> / <code>pnpm install --frozen-lockfile</code> in CI for deterministic installs. Commit your lockfile.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What a package manager does</h3>
<ol>
  <li><strong>Resolves dependencies</strong> — given a package, find versions that satisfy semver ranges of all packages.</li>
  <li><strong>Downloads</strong> from registry (npm.org or private).</li>
  <li><strong>Installs into <code>node_modules</code></strong> — physically (npm/yarn) or as symlinks (pnpm).</li>
  <li><strong>Locks versions</strong> in a lockfile — same versions every install.</li>
  <li><strong>Runs scripts</strong> — <code>install</code>, <code>build</code>, <code>test</code> hooks defined in package.json.</li>
  <li><strong>Manages workspaces</strong> — multi-package monorepo setups.</li>
</ol>

<h3>Why each PM exists</h3>
<ul>
  <li><strong>npm</strong>: original. Mature, ubiquitous, comes with Node. Performance lagged for years; npm 7+ closed the gap somewhat.</li>
  <li><strong>Yarn 1 (Classic)</strong>: 2016, faster install via parallelism + offline cache. Pioneered workspaces. Now in maintenance.</li>
  <li><strong>Yarn 4 (Berry)</strong>: rewrite, plugin-based, supports Plug'n'Play (no node_modules at all — strict resolution). Adoption split.</li>
  <li><strong>pnpm</strong>: content-addressable global store + symlinks → fast install + space-efficient. Strict by default (no phantom deps). Most-loved monorepo PM.</li>
  <li><strong>Bun</strong>: 2022. Zig implementation; very fast install. Also a JS runtime + bundler + test runner. Ecosystem still maturing.</li>
</ul>

<h3>Why pnpm is faster + saves space</h3>
<p>npm/yarn install duplicates packages across every project — same <code>react@18.2.0</code> takes 5MB in 100 projects. pnpm stores each version once globally (<code>~/.pnpm-store</code>) + symlinks into each project's <code>node_modules</code>. New projects install in seconds (just symlinks); disk usage 2-3× less.</p>

<h3>Why phantom deps matter</h3>
<p>npm/yarn flatten <code>node_modules</code> — your code can <code>require</code> a transitive dep that you didn't install. Works until that dep is removed by an upstream update; suddenly broken. pnpm prevents this — only direct deps are accessible. Catches the bug at install time.</p>

<h3>Why lockfiles are critical</h3>
<p>Without lockfile: <code>npm install</code> on different machines gets different versions (latest matching semver). Bug "only on my CI." Lockfile pins exact versions + integrity hashes. Every install — local + CI — produces identical <code>node_modules</code>. Always commit.</p>

<h3>Why workspaces</h3>
<p>Monorepo support: multiple packages in one repo, sharing dependencies + linked locally. Without workspaces: each package has its own <code>node_modules</code>; cross-package changes require <code>npm link</code> dance. Workspaces handle this automatically — install once at root, internal packages linked.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "node_modules layout" picture</h3>
<div class="diagram">
<pre>
 npm / Yarn 1 (flat hoisted):
 node_modules/
   react/                  ← direct dep
   react-dom/              ← direct dep
   lodash/                 ← transitive (hoisted by accident)
   debug/                  ← transitive
   ...

 pnpm (symlinks + content-addressable):
 node_modules/
   react → ../.pnpm/react@18.2.0/node_modules/react   ← symlink
   react-dom → ../.pnpm/react-dom@18.2.0/...          ← symlink
   .pnpm/
     react@18.2.0/node_modules/react/  ← actual files (single global instance)
     react-dom@18.2.0/...

 Yarn 4 with PnP (no node_modules):
   .pnp.cjs                ← runtime resolves modules from .yarn/cache</pre>
</div>

<h3>The "speed comparison"</h3>
<table>
  <thead><tr><th>PM</th><th>Cold install (typical app)</th><th>Hot install (cached)</th><th>Disk usage</th></tr></thead>
  <tbody>
    <tr><td>npm 10</td><td>30-60s</td><td>5-15s</td><td>Baseline</td></tr>
    <tr><td>Yarn 1</td><td>20-40s</td><td>5-10s</td><td>Same as npm</td></tr>
    <tr><td>Yarn 4 (Berry)</td><td>10-25s</td><td>2-5s</td><td>Smaller (cache)</td></tr>
    <tr><td>pnpm</td><td>10-25s</td><td>2-5s</td><td>~30% of npm</td></tr>
    <tr><td>Bun</td><td>2-10s</td><td>1-3s</td><td>~50% of npm</td></tr>
  </tbody>
</table>

<h3>The "semver" picture</h3>
<pre><code>"react": "^18.2.0"     → ≥18.2.0 &amp; &lt;19.0.0  (compatible)
"react": "~18.2.0"     → ≥18.2.0 &amp; &lt;18.3.0  (patch only)
"react": "18.2.0"      → exact
"react": "18.x"        → ≥18.0.0 &amp; &lt;19.0.0
"react": "*"           → any version
"react": "&gt;=18"        → at least 18

Lockfile pins resolved version regardless of range.</code></pre>

<h3>The "workspaces" picture</h3>
<div class="diagram">
<pre>
 my-monorepo/
   package.json              { "workspaces": ["packages/*"] }
   pnpm-workspace.yaml       (pnpm only)
   packages/
     utils/
       package.json          ({ "name": "@my/utils" })
     api/
       package.json          ({ "name": "@my/api", "dependencies": { "@my/utils": "workspace:*" } })
     web/
       package.json          ({ "dependencies": { "@my/api": "workspace:*", "react": "^18" } })
   node_modules/             ← shared installed deps</pre>
</div>

<h3>The "lockfile" picture</h3>
<pre><code class="language-yaml"># pnpm-lock.yaml (excerpt)
lockfileVersion: 9.0
importers:
  .:
    dependencies:
      react: 18.2.0
packages:
  /react@18.2.0:
    resolution: { integrity: sha512-... }
    dependencies:
      loose-envify: 1.4.0</code></pre>
<p>Every dep, version, integrity hash. Same install everywhere or it fails.</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"You can mix package managers on the same project." Don't. Each writes a different lockfile (<code>package-lock.json</code> vs <code>yarn.lock</code> vs <code>pnpm-lock.yaml</code>). Mixing produces inconsistent installs across team. Pick one, enforce via <code>"packageManager"</code> field + corepack.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>npm essentials</h3>
<pre><code class="language-bash">npm init -y                    # create package.json
npm install react              # install + add to dependencies
npm install -D vite            # devDependency
npm install -g typescript      # global (rare; prefer npx)
npm install                    # install from package.json + lockfile
npm ci                         # clean install — strict lockfile, faster, used in CI
npm update                     # update within semver ranges
npm outdated                   # show outdated deps
npm audit                      # security audit
npm run build                  # run script
npm exec tsx script.ts         # run a binary (alternative to npx)
npm view react                 # info about a package
npm whoami                     # current user
npm login                      # auth to registry
npm publish                    # publish your package</code></pre>

<h3>Yarn essentials</h3>
<pre><code class="language-bash"># Yarn 1 (Classic):
yarn install                   # or just: yarn
yarn add react
yarn add -D vite
yarn remove react
yarn upgrade
yarn run build                 # or: yarn build

# Yarn 4 (Berry):
yarn dlx tsx script.ts         # run a binary without installing globally
yarn workspaces foreach run build      # run build in all workspaces</code></pre>

<h3>pnpm essentials</h3>
<pre><code class="language-bash">npm install -g pnpm           # one-time

pnpm install                   # or: pnpm i
pnpm add react
pnpm add -D vite
pnpm add -w typescript         # add to root in workspace
pnpm remove react
pnpm update --interactive     # interactive update
pnpm run build                 # or: pnpm build
pnpm dlx tsx script.ts         # one-off run (like npx)

# Workspaces:
pnpm install --frozen-lockfile        # CI mode
pnpm -r build                          # run "build" in every workspace
pnpm -r --parallel build              # in parallel
pnpm --filter web build                # in specific workspace
pnpm --filter "...@my/utils" build    # in @my/utils + everything depending on it</code></pre>

<h3>Bun essentials</h3>
<pre><code class="language-bash">curl -fsSL https://bun.sh/install | bash    # install Bun

bun install
bun add react
bun add -d vite
bun run build
bun script.ts                  # run TS directly (Bun is also a runtime)
bun test                       # built-in test runner</code></pre>

<h3>Lockfile commands per CI</h3>
<pre><code class="language-bash">npm ci                                # npm
yarn install --immutable              # Yarn 4 (Berry)
yarn install --frozen-lockfile        # Yarn 1
pnpm install --frozen-lockfile        # pnpm
bun install --frozen-lockfile         # Bun</code></pre>
<p>All fail if lockfile would change — guarantees reproducibility.</p>

<h3>Workspaces config</h3>
<pre><code class="language-json">// npm / Yarn 1 — root package.json
{
  "workspaces": ["packages/*"]
}</code></pre>
<pre><code class="language-yaml"># pnpm — pnpm-workspace.yaml
packages:
  - "packages/*"
  - "apps/*"</code></pre>
<pre><code class="language-toml"># Bun — root package.json
{
  "workspaces": ["packages/*"]
}</code></pre>

<h3>Internal package references</h3>
<pre><code class="language-json">// packages/web/package.json
{
  "dependencies": {
    "@my/utils": "workspace:*",          // pnpm + Yarn workspaces
    "@my/api": "workspace:^"
  }
}</code></pre>
<p><code>workspace:*</code> means "use whatever version is in the workspace." Resolved to the actual version on publish.</p>

<h3>corepack — pin PM version</h3>
<pre><code class="language-json">// package.json
{
  "packageManager": "pnpm@9.0.0"
}</code></pre>
<pre><code class="language-bash">corepack enable                # ships with Node 16.10+
corepack prepare pnpm@9.0.0 --activate
# Now any "pnpm" command in this project uses 9.0.0</code></pre>

<h3>npm scripts patterns</h3>
<pre><code class="language-json">{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "lint": "eslint src --max-warnings=0",
    "format": "prettier --write src",
    "ci": "npm-run-all --parallel type-check lint test build",
    "prepare": "husky install",
    "preversion": "npm test",
    "postpublish": "git push origin --tags"
  }
}</code></pre>
<p>Lifecycle hooks: <code>preinstall</code>, <code>postinstall</code>, <code>prepublish</code>, <code>preversion</code>. Run automatically.</p>

<h3>Resolutions / overrides</h3>
<pre><code class="language-json">// npm 8+ overrides (force a transitive dep version)
{
  "overrides": {
    "lodash": "^4.17.21"
  }
}

// pnpm overrides
{
  "pnpm": {
    "overrides": {
      "lodash@&lt;4.17.21": "&gt;=4.17.21"
    }
  }
}

// Yarn 1 resolutions
{
  "resolutions": {
    "lodash": "^4.17.21"
  }
}</code></pre>
<p>Use to patch security vulns or force a single version when transitive deps disagree.</p>

<h3>npm audit + npm audit fix</h3>
<pre><code class="language-bash">npm audit                          # list vulnerabilities
npm audit fix                       # auto-fix where possible
npm audit fix --force               # fix even with breaking changes
npm audit --omit=dev                # skip dev deps
pnpm audit                          # equivalent
yarn audit</code></pre>

<h3>Private registries</h3>
<pre><code class="language-bash"># .npmrc (per project or per user)
@my-org:registry=https://npm.example.com/
//npm.example.com/:_authToken=xxx

# Now @my-org/* fetches from custom registry; everything else from npmjs.org</code></pre>

<h3>Publishing</h3>
<pre><code class="language-bash"># package.json
{
  "name": "@my/utils",
  "version": "1.2.3",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],            // what to ship in the tarball
  "publishConfig": {
    "access": "public"
  }
}

npm version patch              # bump version + git tag
npm publish                    # publish to registry</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — switch project from npm to pnpm</h3>
<pre><code class="language-bash">rm -rf node_modules package-lock.json
npm i -g pnpm
pnpm import                    # converts package-lock.json → pnpm-lock.yaml
pnpm install
# Done. Add packageManager field to lock the version.</code></pre>

<h3>Example 2 — pnpm workspace example</h3>
<pre><code># File structure
my-monorepo/
  pnpm-workspace.yaml          packages: [ "packages/*", "apps/*" ]
  package.json                 { "name": "monorepo", "private": true }
  packages/
    utils/
      package.json             { "name": "@my/utils", "version": "0.0.0" }
      src/index.ts
    api/
      package.json             {
                                 "name": "@my/api",
                                 "dependencies": { "@my/utils": "workspace:*" }
                               }
  apps/
    web/
      package.json             {
                                 "dependencies": {
                                   "@my/api": "workspace:*",
                                   "react": "^18"
                                 }
                               }</code></pre>
<pre><code class="language-bash">pnpm install                            # installs everything; symlinks @my/* internally
pnpm --filter web dev                   # runs web's dev script
pnpm -r --parallel test                 # runs test in every package in parallel</code></pre>

<h3>Example 3 — corepack lock PM version</h3>
<pre><code class="language-json">// package.json
{
  "packageManager": "pnpm@9.5.0"
}</code></pre>
<pre><code class="language-bash">corepack enable
# Now: pnpm in this project always uses 9.5.0
# Other team members + CI get the same version automatically</code></pre>

<h3>Example 4 — package.json scripts orchestration</h3>
<pre><code class="language-json">{
  "scripts": {
    "build": "vite build",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "lint": "eslint . --max-warnings=0",
    "ci": "npm-run-all --parallel type-check lint test build"
  }
}</code></pre>

<h3>Example 5 — install just dependencies, not devDependencies (CI prod build)</h3>
<pre><code class="language-bash">npm install --omit=dev
yarn install --production
pnpm install --prod
bun install --production</code></pre>

<h3>Example 6 — selective workspace command (pnpm)</h3>
<pre><code class="language-bash">pnpm --filter web... build           # build web + everything web depends on
pnpm --filter ...web build           # build everything that depends on web
pnpm --filter "@my/api^..." test     # test api + its dependencies (with caret)
pnpm --filter "[origin/main]" build  # build packages changed since main branch</code></pre>

<h3>Example 7 — lockfile-only update</h3>
<pre><code class="language-bash"># Update lockfile without touching package.json:
npm install --package-lock-only
pnpm install --lockfile-only
yarn install --mode=update-lockfile</code></pre>

<h3>Example 8 — security override</h3>
<pre><code class="language-json">{
  "name": "my-app",
  "overrides": {
    "qs": "^6.11.2"      // force-update transitive dep with CVE
  }
}</code></pre>

<h3>Example 9 — running a one-off command</h3>
<pre><code class="language-bash"># All equivalent:
npx create-vite@latest my-app
pnpm dlx create-vite@latest my-app
yarn dlx create-vite@latest my-app
bun x create-vite@latest my-app</code></pre>

<h3>Example 10 — package.json complete example</h3>
<pre><code class="language-json">{
  "name": "@my/utils",
  "version": "2.1.0",
  "description": "Utility functions",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    },
    "./package.json": "./package.json"
  },
  "sideEffects": false,
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup",
    "test": "vitest",
    "prepublishOnly": "npm run build"
  },
  "peerDependencies": {
    "react": "^18 || ^19"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.4.0"
  },
  "publishConfig": {
    "access": "public"
  },
  "engines": {
    "node": "&gt;=18.0.0"
  },
  "packageManager": "pnpm@9.0.0"
}</code></pre>

<h3>Example 11 — npm scripts pre/post hooks</h3>
<pre><code class="language-json">{
  "scripts": {
    "prebuild": "rm -rf dist",
    "build": "vite build",
    "postbuild": "echo 'Build complete'",
    "preversion": "npm test",
    "version": "echo 'Bumping version'",
    "postversion": "git push origin --tags"
  }
}
// Running 'npm run build' triggers prebuild → build → postbuild automatically.</code></pre>

<h3>Example 12 — managing peer dependencies</h3>
<pre><code class="language-json">{
  "peerDependencies": {
    "react": "^18 || ^19"
  },
  "peerDependenciesMeta": {
    "react": { "optional": false }
  }
}
// Tells consumers "you provide React, I depend on it"
// pnpm by default installs peer deps; npm/yarn historically didn't (npm 7+ does)</code></pre>

<h3>Example 13 — debugging install</h3>
<pre><code class="language-bash">npm install --verbose                  # detailed output
pnpm install --reporter=ndjson          # streaming JSON output
yarn install --verbose                  # Yarn

# What's in node_modules:
npm ls react                            # show installed react
pnpm why react                          # explain why react is installed
yarn why react

# Disk usage:
du -sh node_modules                     # how big
pnpm store status                       # global store info</code></pre>

<h3>Example 14 — locking Node version</h3>
<pre><code class="language-json">// package.json
{
  "engines": {
    "node": "&gt;=20.0.0",
    "pnpm": "&gt;=9.0.0"
  }
}</code></pre>
<pre><code># .nvmrc
20.10.0
# nvm use      ← reads .nvmrc, switches to that version</code></pre>

<h3>Example 15 — exclude packages from a publish tarball</h3>
<pre><code class="language-json">{
  "files": ["dist", "README.md"]
}
// OR via .npmignore (similar to .gitignore)
// Verify what'll be published: npm pack --dry-run</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Multiple lockfiles in repo</h3>
<p>Both <code>package-lock.json</code> and <code>yarn.lock</code> committed. Each PM uses its own; results diverge. Pick one, delete others, document in README.</p>

<h3>2. Phantom dependencies</h3>
<p>Your code <code>require('debug')</code> works because <code>debug</code> was hoisted into root <code>node_modules</code> by an upstream dep. The upstream dep updates and stops using <code>debug</code> → your code breaks. pnpm's strict mode prevents; npm/Yarn allow.</p>

<h3>3. Lockfile churn</h3>
<p><code>npm install</code> re-resolves on each run, sometimes producing different lockfile order even without changes. <code>npm ci</code> doesn't modify; CI should always use <code>ci</code>. Yarn 4 + pnpm have more deterministic behavior.</p>

<h3>4. peerDependencies handling</h3>
<p>npm 7+ installs peer deps automatically. Older npm: warning only, manual install. Yarn 4 + pnpm install peers; pnpm warns on conflicting peers. Different behavior across PMs surfaces in monorepos.</p>

<h3>5. <code>node_modules</code> hoisting variations</h3>
<p>npm/Yarn hoist all deps to root. pnpm doesn't (uses <code>.pnpm/</code> + symlinks). Some libraries assume hoisted layout — they break under pnpm. Workaround: <code>public-hoist-pattern</code> in <code>.npmrc</code>.</p>

<h3>6. Optional dependencies</h3>
<pre><code class="language-json">{
  "optionalDependencies": {
    "fsevents": "^2.0.0"     // macOS-only; install if available, ignore if not
  }
}
// Useful for platform-specific deps</code></pre>

<h3>7. Dependency cycles</h3>
<p>A → B → A. npm/Yarn handle (each gets its own copy). pnpm warns + handles. Not great architecture but works.</p>

<h3>8. <code>.npmrc</code> precedence</h3>
<p>Project <code>.npmrc</code> overrides user (<code>~/.npmrc</code>) overrides global (<code>$PREFIX/etc/npmrc</code>). Specify proxies, registries, install behavior here.</p>

<h3>9. Yarn PnP (Plug'n'Play)</h3>
<p>Yarn 4 default: no <code>node_modules</code> at all. Resolution via <code>.pnp.cjs</code>. Faster, stricter. But: many tools (VSCode, ESLint, jest) need plugins to understand PnP. Some still don't. Disable with <code>nodeLinker: 'node-modules'</code>.</p>

<h3>10. Bun + native modules</h3>
<p>Bun is mostly Node-compat but some packages with native add-ons (<code>node-gyp</code> deps) fail. Improving over time but verify your stack.</p>

<h3>11. Bun's binary lockfile</h3>
<p><code>bun.lockb</code> is binary — not human-readable, hard to diff. Pros: smaller, faster. Cons: code review can't see version changes. Convention: also commit <code>bun.lockb.txt</code> generated via <code>bun pm dump</code>.</p>

<h3>12. Workspace globbing</h3>
<p><code>"workspaces": ["packages/*"]</code> matches first level only. For deeper: <code>["packages/*/*"]</code>. pnpm allows YAML for clarity.</p>

<h3>13. Internal package not built before consumer runs</h3>
<p>In monorepo: <code>@my/utils</code> not built; <code>@my/web</code> imports it; runtime fails. Use Turborepo / Nx with <code>dependsOn</code> to enforce build order.</p>

<h3>14. Different Node versions in workspaces</h3>
<p>Each workspace can have its own <code>engines.node</code>, but actual Node version is one. Lock at root via <code>.nvmrc</code>; treat per-package <code>engines</code> as compatibility info.</p>

<h3>15. <code>npm install</code> with stale lockfile</h3>
<p>Lockfile says version X; package.json says ^Y where X doesn't satisfy Y. <code>npm install</code> rewrites lockfile (might bump). <code>npm ci</code> errors. Always <code>ci</code> in CI.</p>

<h3>16. Registry redirects + auth</h3>
<p>Private registry returns 302 to public registry — <code>_authToken</code> not sent. Configure registries explicitly per scope (<code>@my-org:registry</code>).</p>

<h3>17. Dependabot / Renovate</h3>
<p>Automated dep updates. Open many PRs; can be noisy. Configure grouping (group all React PRs, etc.) and ignore patterns.</p>

<h3>18. Major version bumps</h3>
<p><code>npm install lodash@latest</code> may bump from <code>^4.17</code> to <code>^5.0</code> if 5 exists. Read release notes; test thoroughly.</p>

<h3>19. <code>postinstall</code> scripts as security risk</h3>
<p>Malicious packages run code on install via <code>postinstall</code>. Use <code>--ignore-scripts</code> in CI for untrusted packages. Tools: socket.dev, Snyk to vet packages.</p>

<h3>20. <code>npm publish</code> 2FA</h3>
<p>Stronger auth (npm now requires for public packages). Configure with <code>npm profile enable-2fa auth-and-writes</code>. CI publishes need automation tokens with limited scope.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — committing node_modules</h3>
<p>Bloats repo, slow clones, merge conflicts. Always in <code>.gitignore</code>. Lockfile is enough for reproducibility.</p>

<h3>Anti-pattern 2 — no lockfile</h3>
<p>Different versions across machines + CI = "works on my machine." Always commit lockfile.</p>

<h3>Anti-pattern 3 — using <code>npm install</code> in CI</h3>
<p>Modifies lockfile. Use <code>npm ci</code> / <code>pnpm install --frozen-lockfile</code> for strict, fast, reproducible installs.</p>

<h3>Anti-pattern 4 — global installs as deps</h3>
<p>"Run <code>npm install -g typescript</code> first." Brittle. Add <code>typescript</code> as devDependency; team gets the right version automatically.</p>

<h3>Anti-pattern 5 — mixing PMs</h3>
<p>Half team uses npm, half uses Yarn. Different lockfiles drift. Pick one; enforce with <code>"packageManager"</code> field + corepack.</p>

<h3>Anti-pattern 6 — version range too loose</h3>
<p><code>"react": "*"</code> or <code>"react": "&gt;=18"</code>. Auto-bumps to incompatible versions. Stick to <code>^X.Y.Z</code>.</p>

<h3>Anti-pattern 7 — ignoring <code>npm audit</code></h3>
<p>Vulnerabilities in deps. Run <code>npm audit</code> in CI; fail on high severity. Or use Dependabot/Renovate.</p>

<h3>Anti-pattern 8 — too many dependencies</h3>
<p>200 packages for a small app. Each is a supply-chain risk + bundle size. Audit; prefer fewer, well-maintained deps.</p>

<h3>Anti-pattern 9 — <code>peerDependencies</code> ignored in apps</h3>
<p>Apps install peer deps explicitly — they're "consumers" not "libraries." Don't add libraries' peers as your peers.</p>

<h3>Anti-pattern 10 — unscoped public packages</h3>
<p>"Reserve" the name <code>foo</code> on npm without scoping. Most short names taken. Use <code>@your-org/foo</code> for libraries.</p>

<h3>Anti-pattern 11 — secrets in package.json</h3>
<p>API keys in <code>scripts</code> or <code>config</code>. Use <code>.env</code> files (in <code>.gitignore</code>) or CI secrets.</p>

<h3>Anti-pattern 12 — outdated lockfile rotted for months</h3>
<p>Security patches missed. Schedule weekly Dependabot or quarterly manual audit + update.</p>

<h3>Anti-pattern 13 — npm scripts as build pipeline</h3>
<p>30 sequential scripts via <code>&amp;&amp;</code> chains in package.json. Hard to maintain. Use a real build tool (Turborepo, Nx) or task runner (npm-run-all, Make).</p>

<h3>Anti-pattern 14 — <code>npm install</code> instead of <code>npm install --omit=dev</code> in production Docker</h3>
<p>Ships devDependencies into prod image. Bloats image, slows deploy. Always <code>--omit=dev</code> in production builds.</p>

<h3>Anti-pattern 15 — pinning all versions exactly</h3>
<p><code>"react": "18.2.0"</code> everywhere. Misses patch updates. Caret <code>^</code> is usually right; lockfile pins anyway.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. npm vs Yarn vs pnpm?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>npm</strong>: ubiquitous, mature, slowest. Default in Node.</li>
      <li><strong>Yarn 1 (Classic)</strong>: faster than npm, pioneered workspaces. Maintenance mode.</li>
      <li><strong>Yarn 4 (Berry)</strong>: rewrite, plugin-based, Plug'n'Play option. Tooling integration friction.</li>
      <li><strong>pnpm</strong>: content-addressable global store + symlinks. ~2× faster, ~3× less disk. Strict (no phantom deps). Default for modern monorepos.</li>
      <li><strong>Bun</strong>: fastest install (Zig). Also a runtime + bundler + test runner. Newer; ecosystem still maturing.</li>
    </ul>
    <p>Recommendation: pnpm for new projects, especially monorepos. Bun for greenfield experimentation.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What's a lockfile and why commit it?</div>
  <div class="qa-answer">
    <p>A lockfile pins exact resolved versions of every dep + transitive dep, with integrity hashes. <code>package-lock.json</code> (npm), <code>yarn.lock</code> (Yarn), <code>pnpm-lock.yaml</code> (pnpm), <code>bun.lockb</code> (Bun). Without it, <code>npm install</code> on different machines or different times produces different versions — "works on my machine" bug. Commit it; CI uses <code>npm ci</code> (or <code>--frozen-lockfile</code>) to install exactly what's locked.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. <code>npm install</code> vs <code>npm ci</code>?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>install</strong>: resolves package.json + lockfile; updates lockfile if drift exists. Slower. Use locally.</li>
      <li><strong>ci</strong> (clean install): requires lockfile + package.json in sync; fails if mismatched. Deletes <code>node_modules</code> first. Faster, stricter, deterministic. Use in CI.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. How does pnpm save disk space?</div>
  <div class="qa-answer">
    <p>pnpm uses a global content-addressable store at <code>~/.pnpm-store</code>. Each version of each package is stored once. Project <code>node_modules</code> contains symlinks (or hardlinks on copy-on-write filesystems) into this store. 100 projects all using <code>react@18.2.0</code> share one copy on disk. Disk usage 2-3× less than npm/Yarn.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. What are phantom dependencies?</div>
  <div class="qa-answer">
    <p>Code that <code>require</code>s a package not declared in your package.json — works because npm/Yarn hoisted that package into root node_modules from a transitive dep. When the upstream dep is updated and removes the dep, your code breaks. pnpm's strict layout prevents this — only direct deps are accessible. Catches the bug at install time instead of at upstream-update time.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Explain semver: <code>^1.2.3</code> vs <code>~1.2.3</code> vs <code>1.2.3</code>.</div>
  <div class="qa-answer">
    <ul>
      <li><strong><code>^1.2.3</code></strong>: ≥1.2.3 and &lt;2.0.0 — compatible (any minor / patch within major).</li>
      <li><strong><code>~1.2.3</code></strong>: ≥1.2.3 and &lt;1.3.0 — patch updates only.</li>
      <li><strong><code>1.2.3</code></strong>: exact, no updates.</li>
    </ul>
    <p>Default <code>npm install</code> writes <code>^</code>. Lockfile pins the actual resolved version regardless. Caret + lockfile is the usual recipe.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. What are workspaces?</div>
  <div class="qa-answer">
    <p>Monorepo support. Multiple packages in one repo share dependencies + are linked locally. Define in root package.json: <code>"workspaces": ["packages/*"]</code>. Internal packages reference each other via <code>"@my/utils": "workspace:*"</code> — resolved to the local checkout, not npm. <code>npm/yarn/pnpm install</code> at root installs all packages' deps. Tools like Turborepo / Nx orchestrate task runs.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. <code>dependencies</code> vs <code>devDependencies</code> vs <code>peerDependencies</code>?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>dependencies</strong>: required for runtime. Installed when consumers install your package.</li>
      <li><strong>devDependencies</strong>: only needed during development (test, build, lint). NOT installed transitively.</li>
      <li><strong>peerDependencies</strong>: consumer must provide. Used by libraries to declare "I work with React 18 — you bring it." Avoids multiple React copies in the bundle.</li>
      <li><strong>optionalDependencies</strong>: install if possible, ignore if fails (platform-specific).</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How does corepack help?</div>
  <div class="qa-answer">
    <p>corepack is bundled with Node 16.10+. It reads the <code>"packageManager"</code> field in package.json and ensures every developer + CI uses the exact same PM version. Saves the "you have pnpm 8, I have pnpm 9" debugging. Enable with <code>corepack enable</code>; pin with <code>"packageManager": "pnpm@9.0.0"</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. How would you debug a deps issue?</div>
  <div class="qa-answer">
    <ol>
      <li><code>npm ls package-name</code> / <code>pnpm why package-name</code> — explains the dependency chain.</li>
      <li>Check lockfile for actual resolved version.</li>
      <li>Look for duplicate versions (same package, different versions).</li>
      <li><code>npm dedupe</code> to consolidate.</li>
      <li>Use <code>overrides</code> / <code>resolutions</code> to force a specific version.</li>
      <li>Check peerDependency warnings for version mismatches.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. What's a postinstall script and why is it dangerous?</div>
  <div class="qa-answer">
    <p>A package.json script that runs automatically after install. Used legitimately for compiling native bindings or generating types. Dangerous because: malicious packages can run arbitrary code on your dev machine + CI. Mitigations: <code>--ignore-scripts</code> in CI for untrusted packages; supply-chain audit tools (socket.dev, Snyk); avoid suspicious packages; use lockfile + integrity hashes to detect tampering.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. How do you publish a private package?</div>
  <div class="qa-answer">
    <p>Two options:</p>
    <ul>
      <li><strong>Private npm registry</strong>: GitHub Packages, GitLab Package Registry, Verdaccio (self-host), npmjs.org private. Configure <code>.npmrc</code> with scope + auth token.</li>
      <li><strong>Direct from git</strong>: <code>"@my/utils": "github:my-org/utils#v1.2.3"</code>. No registry needed.</li>
    </ul>
    <p>For widely-used internal packages, a private registry is cleaner. For one-off, git URL works.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. What's <code>npm overrides</code>?</div>
  <div class="qa-answer">
    <p>npm 8.3+ feature to force-update transitive dependencies:</p>
<pre><code class="language-json">{
  "overrides": {
    "qs": "^6.11.2"      // any package depending on qs gets this version
  }
}</code></pre>
    <p>Used for security patches when upstream hasn't updated. pnpm has same feature; Yarn 1 calls it <code>resolutions</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. <code>npx</code> vs <code>pnpm dlx</code> vs <code>yarn dlx</code> vs <code>bun x</code>?</div>
  <div class="qa-answer">
    <p>All run a one-off binary without installing it globally. <code>npx create-vite@latest</code> downloads create-vite to a temp folder, runs it. Each PM has its equivalent. <code>npx</code> is the most universal; <code>pnpm dlx</code> caches more aggressively.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Pick a PM for a 50-developer monorepo with 30 packages. Justify.</div>
  <div class="qa-answer">
    <p><strong>pnpm</strong>:</p>
    <ul>
      <li>Fast install — critical with frequent CI runs.</li>
      <li>Disk efficient — 30 packages × symlinks vs 30 copies.</li>
      <li>Strict deps — catches phantom dep bugs early.</li>
      <li>Strong workspace support — filters, run-many, version unification.</li>
      <li>Lockfile is YAML — diffable, reviewable.</li>
    </ul>
    <p>Pair with Turborepo or Nx for task orchestration. Pin pnpm version via corepack. CI uses <code>--frozen-lockfile</code>.</p>
    <p>Yarn 4 also viable; npm 10 has improved but is still slower. Bun's monorepo support is maturing — promising for the future.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You pick pnpm by default for new projects + monorepos.</li>
    <li>You commit the lockfile and use <code>npm ci</code> / <code>--frozen-lockfile</code> in CI.</li>
    <li>You pin PM version via <code>"packageManager"</code> + corepack.</li>
    <li>You distinguish <code>dependencies</code> / <code>devDependencies</code> / <code>peerDependencies</code>.</li>
    <li>You set up workspaces correctly with <code>workspace:*</code>.</li>
    <li>You handle security with <code>npm audit</code> + <code>overrides</code>.</li>
    <li>You scope public packages (<code>@your-org/lib</code>).</li>
    <li>You use <code>--omit=dev</code> in production Docker images.</li>
    <li>You know about phantom deps and pnpm's strict layout.</li>
  </ul>
</div>
`}

]
});
