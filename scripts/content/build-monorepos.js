window.PREP_SITE.registerTopic({
  id: 'build-monorepos',
  module: 'build',
  title: 'Monorepos',
  estimatedReadTime: '40 min',
  tags: ['monorepo', 'turborepo', 'nx', 'pnpm', 'yarn-workspaces', 'bazel', 'lerna', 'rush', 'changesets'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>A <strong>monorepo</strong> is one repository containing multiple related projects (apps, libraries, services). It's not "one repo for everything" dogma — it's a deliberate architecture for code that <em>actually shares</em> dependencies, types, or release coordination. The right tool depends on scale and language; the wrong tool wastes weeks.</p>
<ul>
  <li><strong>Why monorepos:</strong> shared types across apps, atomic refactors across packages, single CI graph, consistent tooling, easier dep management.</li>
  <li><strong>Why polyrepos:</strong> independent release cadence per team, isolation, smaller blast radius, no monorepo tooling tax.</li>
  <li><strong>The 2026 stack (JS/TS):</strong> <strong>pnpm workspaces</strong> (package layout) + <strong>Turborepo</strong> or <strong>Nx</strong> (task orchestration + caching) + <strong>Changesets</strong> (versioning + publishing).</li>
  <li><strong>Bigger scale:</strong> Bazel (Google), Buck2 (Meta), Pants (multi-language). Heavyweight; reach when language-polyglot or build at scale.</li>
  <li><strong>Core mechanics:</strong> workspace protocol (<code>workspace:*</code>), task pipeline (depends-on graph), remote cache (CI sharing), affected-packages detection, version + publish flow.</li>
  <li><strong>Sweet spot:</strong> 3–30 packages owned by one org with shared types / shared design system. Below 3 = overkill; above 30 = consider splitting orgs into per-team monorepos.</li>
  <li><strong>RN angle:</strong> Expo + Metro support pnpm workspaces; Metro symlink resolution + transformer config matter; native iOS/Android workspaces still single-app.</li>
</ul>
<p><strong>Mantra:</strong> "Monorepo for shared types and atomic refactors. pnpm + Turborepo for JS/TS. Cache aggressively. Publish via Changesets. Don't reach for Bazel until you actually have to."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What a monorepo actually is</h3>
<p>A single git repository containing multiple <em>packages</em> (each with its own <code>package.json</code>) that can depend on each other directly via the package manager's workspace protocol. Tooling on top (Turborepo, Nx) orchestrates builds + tests across the dependency graph.</p>

<h3>Why teams adopt monorepos</h3>
<table>
  <thead><tr><th>Pain in polyrepo</th><th>Monorepo answer</th></tr></thead>
  <tbody>
    <tr><td>Shared lib version drift across consumers</td><td>One source-of-truth version; consumers always on latest</td></tr>
    <tr><td>Atomic cross-cutting refactor (rename API across 5 services) = N PRs</td><td>One PR touches everything</td></tr>
    <tr><td>"Which version of @company/auth does each service use?"</td><td>One version, in this commit</td></tr>
    <tr><td>Type generation pipelines across repos</td><td>Direct TS imports between packages</td></tr>
    <tr><td>Inconsistent linting / Prettier / TS config across repos</td><td>One config, inherited by all packages</td></tr>
    <tr><td>CI duplication across repos</td><td>Single CI graph; reuse caches; affected-only builds</td></tr>
    <tr><td>Code discovery — "where's the user model?"</td><td>One <code>grep</code> away</td></tr>
  </tbody>
</table>

<h3>Why teams hate monorepos</h3>
<table>
  <thead><tr><th>Cost</th><th>Detail</th></tr></thead>
  <tbody>
    <tr><td>Tooling tax</td><td>Workspace, pipeline, cache, versioning all need configuration. Easy to misconfigure.</td></tr>
    <tr><td>CI complexity</td><td>"Test everything" doesn't scale; need affected-only detection.</td></tr>
    <tr><td>Coupled release cadence</td><td>Teams without coordination ship each other's bugs.</td></tr>
    <tr><td>Onboarding cost</td><td>Fresh dev faces a 10k-file repo; needs orientation.</td></tr>
    <tr><td>Build artifacts grow</td><td><code>node_modules</code> can be 5GB+ without pnpm; <code>dist/</code> output across packages.</td></tr>
    <tr><td>Tooling fragility</td><td>Editor performance, IDE indexing, lint rules — all stress-tested.</td></tr>
    <tr><td>Permission granularity</td><td>One repo → one access; can't restrict by team without git submodules tricks.</td></tr>
  </tbody>
</table>

<h3>The right mental shape</h3>
<p>Monorepo is right when packages <strong>actually share state</strong> — dep graph, type contracts, release lifecycle. It's wrong when teams have independent release cadence and shouldn't coordinate. "We work for the same company" isn't a reason; "we ship the same UI library across 5 apps" is.</p>

<h3>What "good monorepo" looks like</h3>
<ul>
  <li>Workspace protocol (<code>workspace:*</code>) for internal deps — never npm-style version pinning.</li>
  <li>Task pipeline with explicit dependencies (<code>build → test</code>; <code>build needs build of deps</code>).</li>
  <li>Remote cache shared between CI + devs — same hash hit hits cache across machines.</li>
  <li>Affected-only detection: only build / test packages that changed (transitively).</li>
  <li>Single TS config inherited; consistent ESLint / Prettier.</li>
  <li>Changesets for semver + changelog automation.</li>
  <li>Per-package README + ownership (CODEOWNERS).</li>
  <li>Onboarding doc: "where to look, how to add a package."</li>
</ul>

<h3>What "bad monorepo" looks like</h3>
<ul>
  <li>npm linked deps without workspace protocol — version drift inside the repo.</li>
  <li>"Run all tests on every PR" — 30-minute CI as the repo grows.</li>
  <li>No remote cache — every CI run rebuilds everything.</li>
  <li>Mixed package managers (npm + yarn + pnpm) across packages — phantom deps + lockfile chaos.</li>
  <li>Per-package TS config drift — same code lints differently in different packages.</li>
  <li>No version policy — packages drift across breaking changes silently.</li>
  <li>Internal-only packages published to public npm by accident.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>Monorepo anatomy (typical JS/TS)</h3>
<pre><code class="language-text">my-monorepo/
  package.json                    # root; private; workspaces config
  pnpm-workspace.yaml             # workspace declaration
  turbo.json (or nx.json)         # task pipeline config
  tsconfig.base.json              # shared TS config
  .changeset/                     # versioning artifacts

  apps/
    web/                          # @org/web
      package.json
      src/
    mobile/                       # @org/mobile (RN)
      package.json
      src/
    admin/                        # @org/admin

  packages/
    ui/                           # @org/ui — design system
      package.json
      src/
    auth/                         # @org/auth
    api-client/                   # @org/api-client (codegen-driven)
    config/                       # @org/config (eslint, tsconfig presets)
    utils/                        # @org/utils

  tools/
    scripts/                      # custom build / lint scripts
    eslint-config/
</code></pre>

<h3>The big four JS/TS tools</h3>
<table>
  <thead><tr><th>Tool</th><th>Niche</th><th>Strengths</th><th>Weaknesses</th></tr></thead>
  <tbody>
    <tr><td><strong>pnpm workspaces</strong></td><td>Package manager + workspace</td><td>Symlinked node_modules; strict deps; fast; disk-efficient via content-addressable store</td><td>No task orchestration; pair with Turborepo / Nx</td></tr>
    <tr><td><strong>Yarn workspaces (Berry)</strong></td><td>Same as pnpm; older choice</td><td>PnP mode (no node_modules); plugin ecosystem</td><td>PnP breaks some tools; less popular than pnpm in 2026</td></tr>
    <tr><td><strong>npm workspaces</strong></td><td>Built-in to npm 7+</td><td>Zero install; ubiquity</td><td>Slower than pnpm; less strict; no task pipeline</td></tr>
    <tr><td><strong>Turborepo</strong></td><td>Task runner + remote cache</td><td>Simple config; remote cache (Vercel-hosted free); zero-config affected-detection</td><td>Less powerful than Nx for complex graphs</td></tr>
    <tr><td><strong>Nx</strong></td><td>Task runner + dev infra + generators</td><td>Plugin ecosystem; codegen / generators; affected graph; cache; Nx Cloud (paid)</td><td>Heavier; opinionated; more concepts</td></tr>
    <tr><td><strong>Lerna</strong></td><td>Legacy versioning + publishing</td><td>Mature; well-known</td><td>Now thin layer over Nx; mostly superseded</td></tr>
    <tr><td><strong>Rush</strong></td><td>Microsoft's monorepo tool</td><td>Incremental builds; selective install; great for large org</td><td>Steep learning curve; smaller community</td></tr>
    <tr><td><strong>Changesets</strong></td><td>Semver + publishing flow</td><td>Lightweight; PR-based; works with any package manager + task runner</td><td>Manual changeset entries (intended)</td></tr>
  </tbody>
</table>

<h3>The polyglot heavyweights</h3>
<table>
  <thead><tr><th>Tool</th><th>Niche</th></tr></thead>
  <tbody>
    <tr><td>Bazel</td><td>Google-scale; multi-language; hermetic builds; remote execution. Used at Google, Uber, Stripe.</td></tr>
    <tr><td>Buck2</td><td>Meta's rewrite of Buck; Rust-implemented; fast incremental.</td></tr>
    <tr><td>Pants</td><td>Multi-language; Python-friendly.</td></tr>
    <tr><td>Please</td><td>Bazel-inspired; lighter.</td></tr>
  </tbody>
</table>
<p>Reach for these when: multi-language (Go + TS + Python in one repo), build complexity exceeds JS/TS tooling, or you have 1000+ packages.</p>

<h3>Workspace protocol</h3>
<p>Inside a monorepo, package A depends on package B via <code>workspace:*</code>:</p>
<pre><code class="language-json">{
  "name": "@org/web",
  "dependencies": {
    "@org/ui": "workspace:*",
    "@org/auth": "workspace:*",
    "react": "^18.2.0"
  }
}
</code></pre>

<p>The package manager symlinks <code>node_modules/@org/ui</code> → <code>../../packages/ui</code>. Edits in <code>packages/ui</code> show up live in <code>apps/web</code> with no install step.</p>

<h3>Task pipeline (Turborepo example)</h3>
<pre><code class="language-json">// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"],
      "cache": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": [],
      "cache": true
    },
    "lint": {
      "outputs": [],
      "cache": true
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
</code></pre>

<p><code>^build</code> means "build of all dependencies must run first." Turbo computes the dep graph and schedules tasks in topological order.</p>

<h3>Caching — the productivity multiplier</h3>
<table>
  <thead><tr><th>Cache layer</th><th>Effect</th></tr></thead>
  <tbody>
    <tr><td>Local cache</td><td>Re-running <code>turbo build</code> on same commit = instant (cache hit)</td></tr>
    <tr><td>Remote cache (Vercel / Nx Cloud / self-hosted)</td><td>CI build cached; PR rebuilds skip unchanged packages; dev pulls CI's cache</td></tr>
    <tr><td>Hash inputs</td><td>Source files + dep tree + env vars + tool versions → cache key</td></tr>
  </tbody>
</table>

<p>Realistic numbers: 10-package repo with shared UI lib. Without cache: full CI = 12 min. With remote cache: PR that only touches <code>apps/web</code> = 2 min (UI lib + other apps cached).</p>

<h3>Affected-only detection</h3>
<p>"What changed in this PR? Build only those packages + transitively-affected consumers."</p>
<pre><code class="language-bash">turbo run build --filter='...[origin/main]'
nx affected:build --base=origin/main
</code></pre>
<p>Saves CI time at scale; without it, every PR rebuilds the whole graph.</p>

<h3>Versioning + publishing — Changesets flow</h3>
<ol>
  <li>Engineer makes a change to <code>packages/ui</code>.</li>
  <li>Runs <code>pnpm changeset</code>; picks affected packages, semver bump (patch/minor/major), writes a release note.</li>
  <li>Commits the changeset markdown alongside their code change.</li>
  <li>PR merged.</li>
  <li>CI runs <code>changeset version</code> → bumps versions in <code>package.json</code>s + updates <code>CHANGELOG.md</code>.</li>
  <li>Either auto-merges that PR ("Version Packages") or a human reviews.</li>
  <li>Publish PR merged → CI runs <code>changeset publish</code> → npm publish for changed packages.</li>
</ol>

<h3>Internal-only packages</h3>
<pre><code class="language-json">{
  "name": "@org/internal-config",
  "private": true
}
</code></pre>
<p><code>"private": true</code> prevents accidental npm publish. Use for packages that should never leave the monorepo.</p>

<h3>Single TS config inheritance</h3>
<pre><code class="language-json">// tsconfig.base.json (root)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "strict": true,
    "skipLibCheck": true,
    "moduleResolution": "Bundler"
  }
}

// packages/ui/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
</code></pre>

<h3>Shared ESLint config</h3>
<pre><code class="language-json">// packages/eslint-config/index.js
module.exports = {
  extends: ['eslint:recommended', '@typescript-eslint/recommended'],
  rules: { /* ... */ },
};

// In each package:
// .eslintrc.cjs
module.exports = {
  extends: ['@org/eslint-config'],
};
</code></pre>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Setup: pnpm workspaces + Turborepo</h3>
<pre><code class="language-bash">mkdir my-monorepo &amp;&amp; cd my-monorepo
pnpm init

# Workspace config
echo "packages:
  - 'apps/*'
  - 'packages/*'" &gt; pnpm-workspace.yaml

# Turborepo
pnpm add -D -w turbo

# Initial structure
mkdir -p apps/web packages/ui
</code></pre>

<pre><code class="language-json">// package.json (root)
{
  "name": "monorepo-root",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "dev": "turbo run dev"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  },
  "packageManager": "pnpm@9.5.0"
}
</code></pre>

<h3>Adding a package</h3>
<pre><code class="language-bash">mkdir -p packages/auth
cd packages/auth
pnpm init
</code></pre>

<pre><code class="language-json">// packages/auth/package.json
{
  "name": "@org/auth",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "lint": "eslint src"
  },
  "dependencies": {
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vitest": "^1.0.0"
  }
}
</code></pre>

<h3>Internal dependency</h3>
<pre><code class="language-json">// apps/web/package.json
{
  "name": "@org/web",
  "dependencies": {
    "@org/auth": "workspace:*",
    "@org/ui": "workspace:*",
    "next": "^14.0.0"
  }
}
</code></pre>

<pre><code class="language-bash">pnpm install
# Symlinks: apps/web/node_modules/@org/auth → ../../packages/auth
</code></pre>

<h3>Task pipeline configuration</h3>
<pre><code class="language-json">// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
</code></pre>

<p>Run:</p>
<pre><code class="language-bash">pnpm turbo run build              # build everything in topological order
pnpm turbo run test --filter=@org/auth   # only @org/auth + its deps
pnpm turbo run dev --filter=@org/web     # web + its deps in dev mode
</code></pre>

<h3>Affected-only on PR CI</h3>
<pre><code class="language-yaml"># .github/workflows/ci.yml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0  # need full history for diff
- run: pnpm install --frozen-lockfile
- run: pnpm turbo run build test lint --filter='...[origin/main]'
</code></pre>

<p>Only packages with changed source (or with changed dependency source) build / test.</p>

<h3>Remote cache (Vercel-hosted)</h3>
<pre><code class="language-bash"># Local
pnpm turbo login
pnpm turbo link

# CI
- run: pnpm turbo run build --token=\${{ secrets.TURBO_TOKEN }} --team=\${{ vars.TURBO_TEAM }}
</code></pre>

<p>Vercel hosts; free tier covers most teams. Self-host with <code>turbo-remote-cache</code> on S3 / Redis if needed.</p>

<h3>Changesets setup</h3>
<pre><code class="language-bash">pnpm add -D -w @changesets/cli
pnpm changeset init
</code></pre>

<pre><code class="language-json">// .changeset/config.json
{
  "$schema": "https://unpkg.com/@changesets/config@2.3.1/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@org/web", "@org/mobile", "@org/admin"]
}
</code></pre>

<p><code>ignore</code> lists apps that aren't published; only libraries get versioned.</p>

<h3>Engineer flow with Changesets</h3>
<pre><code class="language-bash"># After making changes
pnpm changeset
# → interactive prompt:
#   - which packages changed?
#   - patch / minor / major?
#   - what's the change description?
# → writes .changeset/some-name.md
git add .changeset
git commit -m "feat(ui): add Tooltip component"
git push
</code></pre>

<h3>CI publish flow</h3>
<pre><code class="language-yaml"># .github/workflows/release.yml
on:
  push:
    branches: [main]

jobs:
  release:
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm turbo run build
      - uses: changesets/action@v1
        with:
          publish: pnpm changeset publish
          version: pnpm changeset version
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: \${{ secrets.NPM_TOKEN }}
</code></pre>

<p>The action either:</p>
<ul>
  <li>Opens / updates a "Version Packages" PR if there are pending changesets.</li>
  <li>Publishes if the previous PR is merged + lockfile shows version bumps.</li>
</ul>

<h3>RN with pnpm + Metro</h3>
<pre><code class="language-bash">pnpm add -D metro-resolver
</code></pre>

<pre><code class="language-javascript">// apps/mobile/metro.config.js
const path = require('path');
const { getDefaultConfig } = require('@react-native/metro-config');

const root = path.resolve(__dirname, '../..');
const config = getDefaultConfig(__dirname);

config.watchFolders = [root]; // watch monorepo root

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(root, 'node_modules'),
];

config.resolver.disableHierarchicalLookup = false;

module.exports = config;
</code></pre>

<p>Expo's <code>expo-yarn-workspaces</code> / <code>expo monorepo</code> docs cover this; pnpm usually works without extra config since pnpm v8.</p>

<h3>Nx alternative</h3>
<pre><code class="language-bash">npx create-nx-workspace@latest my-monorepo
</code></pre>

<p>Nx provides:</p>
<ul>
  <li>Task pipeline (similar to Turbo).</li>
  <li>Plugin system: <code>@nx/react</code>, <code>@nx/next</code>, <code>@nx/expo</code>, <code>@nx/node</code>.</li>
  <li>Generators: <code>nx g @nx/react:lib ui</code>.</li>
  <li>Affected: <code>nx affected:test --base=main</code>.</li>
  <li>Nx Cloud for remote cache + CI orchestration.</li>
</ul>

<h3>Migration from polyrepo to monorepo</h3>
<ol>
  <li>Pick the tools (pnpm + Turbo or Nx).</li>
  <li>Initialize the monorepo skeleton with <code>tsconfig.base.json</code> + ESLint + Prettier.</li>
  <li>Move repos one at a time using <code>git subtree</code> to preserve history:</li>
</ol>
<pre><code class="language-bash">git subtree add --prefix=apps/web https://github.com/org/web.git main
</code></pre>
<ol start="4">
  <li>Convert <code>npm</code>/<code>yarn</code> deps to <code>workspace:*</code> for in-repo links.</li>
  <li>Wire task pipeline.</li>
  <li>Set up Changesets for versioning.</li>
  <li>Smoke-test CI; tune affected detection.</li>
</ol>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Web + Mobile + shared UI</h3>
<pre><code class="language-text">my-monorepo/
  apps/
    web/         (Next.js)
    mobile/      (Expo)
  packages/
    ui/          (shared components — themed, both targets)
    api-client/  (codegen from GraphQL schema)
    config/      (eslint + tsconfig presets)
  package.json
  pnpm-workspace.yaml
  turbo.json
</code></pre>

<pre><code class="language-json">// packages/ui/package.json
{
  "name": "@org/ui",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./web": "./src/web.ts",
    "./native": "./src/native.ts"
  }
}
</code></pre>

<pre><code class="language-typescript">// apps/web/components/Button.tsx
import { Button } from '@org/ui/web';

// apps/mobile/screens/Home.tsx
import { Button } from '@org/ui/native';
</code></pre>

<p>Why this works: <code>exports</code> field lets both apps import the same package; web imports the React-DOM build, RN imports the React-Native build. Shared types via <code>./src/index.ts</code>.</p>

<h3>Example 2: Codegen-driven api-client package</h3>
<pre><code class="language-json">// packages/api-client/package.json
{
  "name": "@org/api-client",
  "scripts": {
    "build": "graphql-codegen --config codegen.ts &amp;&amp; tsc",
    "dev": "graphql-codegen --config codegen.ts --watch"
  }
}
</code></pre>

<pre><code class="language-json">// turbo.json — codegen runs before consumers' build
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
</code></pre>

<p>Now web + mobile both import generated typed hooks. Schema change → codegen runs → consumers re-build automatically.</p>

<h3>Example 3: Filter + affected on CI</h3>
<pre><code class="language-yaml"># .github/workflows/pr.yml
- run: pnpm install --frozen-lockfile
- run: pnpm turbo run build test lint --filter='...[origin/main]' \\
    --token=\${{ secrets.TURBO_TOKEN }} --team=\${{ vars.TURBO_TEAM }}
- run: pnpm turbo run e2e --filter='...[origin/main]'
</code></pre>

<p>PR touches only <code>apps/web</code> → only <code>@org/web</code> + its dep tree run. PR touches <code>packages/ui</code> → all consumers (web + mobile + admin) re-build.</p>

<h3>Example 4: Changesets release flow</h3>
<pre><code class="language-bash"># Engineer's flow
git checkout -b feat/new-tooltip
# ... changes packages/ui/src/Tooltip.tsx ...
pnpm changeset
# Select: @org/ui (minor)
# Description: Add Tooltip component with accessible API
git add .
git commit -m "feat(ui): add Tooltip component"
git push origin feat/new-tooltip
# PR opened, merged

# CI on main:
# 1. Detects unmerged changeset → opens "Version Packages" PR
# 2. PR contains: package.json bump (0.1.0 → 0.2.0), CHANGELOG.md update
# 3. Maintainer merges Version Packages PR
# 4. CI on main: detects no pending changesets → publishes @org/ui@0.2.0 to npm
</code></pre>

<h3>Example 5: Migrating two existing repos</h3>
<pre><code class="language-bash"># Initial state: org/web + org/auth (separate)
mkdir org-monorepo &amp;&amp; cd org-monorepo
git init
mkdir -p apps packages

# Pull web with history
git remote add web https://github.com/org/web.git
git fetch web
git read-tree --prefix=apps/web/ -u web/main
git commit -m "import org/web"

# Pull auth with history
git remote add auth https://github.com/org/auth.git
git fetch auth
git read-tree --prefix=packages/auth/ -u auth/main
git commit -m "import org/auth"

# Convert apps/web/package.json:
#   "@org/auth": "^1.2.3" → "@org/auth": "workspace:*"

pnpm install
pnpm turbo run build  # validates the migration
</code></pre>

<h3>Example 6: Per-package CODEOWNERS</h3>
<pre><code class="language-text"># .github/CODEOWNERS
/apps/web/        @org/web-team
/apps/mobile/     @org/mobile-team
/packages/ui/     @org/design-systems
/packages/auth/   @org/platform
/packages/api-client/   @org/platform @org/web-team
</code></pre>

<p>PRs touching <code>packages/ui</code> auto-request review from design-systems team. Cross-cutting PRs request multiple teams.</p>

<h3>Example 7: Selective package install (Rush-style)</h3>
<pre><code class="language-bash">pnpm install --filter=@org/web
# Only installs deps for @org/web + its workspace deps; skips other apps
</code></pre>

<p>Useful in CI when you only need to test one app.</p>

<h3>Example 8: Versioning policy — fixed vs independent</h3>
<pre><code class="language-json">// .changeset/config.json
{
  "fixed": [["@org/ui", "@org/ui-icons"]],   // both bump together
  "linked": [["@org/api-client", "@org/auth"]] // linked but bumped separately
}
</code></pre>

<table>
  <thead><tr><th>Mode</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Independent (default)</td><td>Each package bumps separately based on its changes</td></tr>
    <tr><td>Linked</td><td>Always at the same version when bumped — but only bumped when explicitly changed</td></tr>
    <tr><td>Fixed</td><td>Always bumped together; max bump applies to all</td></tr>
  </tbody>
</table>

<h3>Example 9: Detecting circular dependencies</h3>
<pre><code class="language-bash">pnpm add -D -w madge
pnpm madge --circular packages/

# Or via Turbo
pnpm turbo run build --dry=json | jq '.tasks[] | select(.dependents | length &gt; 0)'
</code></pre>

<p>Circular deps in a monorepo break Turbo's topological sort + tsc <code>references</code>. Catch in CI.</p>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Phantom dependencies (npm/yarn classic problem)</h3>
<ul>
  <li><strong>npm/yarn:</strong> hoist all deps to root <code>node_modules</code>; package A can <code>require('lib')</code> even if it's a transitive dep of B.</li>
  <li><strong>Result:</strong> works locally; breaks when published (lib not in package's own deps).</li>
  <li><strong>pnpm:</strong> doesn't hoist by default; strict resolution; phantom deps fail loudly.</li>
  <li>Use pnpm; or yarn Berry with PnP; or enforce <code>eslint-plugin-import</code> rules.</li>
</ul>

<h3>Mixed package managers</h3>
<ul>
  <li>Some packages have <code>package-lock.json</code>; others have <code>pnpm-lock.yaml</code>.</li>
  <li>Engineer A runs <code>npm install</code>; engineer B runs <code>pnpm install</code>; lockfiles diverge.</li>
  <li>Pin via <code>"packageManager"</code> field; preinstall hook rejects others.</li>
</ul>
<pre><code class="language-json">{
  "packageManager": "pnpm@9.5.0",
  "scripts": {
    "preinstall": "npx only-allow pnpm"
  }
}
</code></pre>

<h3>Cache invalidation surprises</h3>
<ul>
  <li>Turbo hashes inputs (source files + deps + env vars). Missing an input = stale cache.</li>
  <li>Common miss: env vars used at build time not declared in <code>globalEnv</code> / <code>env</code>.</li>
  <li>Symptom: build A succeeds locally; build B fails identically; cache says "hit."</li>
  <li>Declare every build-time env var explicitly.</li>
</ul>

<pre><code class="language-json">// turbo.json
{
  "tasks": {
    "build": {
      "env": ["NODE_ENV", "API_URL"]
    }
  },
  "globalEnv": ["NEXT_PUBLIC_*"]
}
</code></pre>

<h3>TS project references</h3>
<ul>
  <li>For incremental builds, <code>tsc -b</code> uses <code>tsconfig.json</code> with <code>references</code>.</li>
  <li>Each package's <code>tsconfig.json</code> declares <code>references</code> to its deps.</li>
  <li>Turbo + tsc references combine well — Turbo schedules; tsc reuses incremental output.</li>
  <li>Pain: keeping references in sync with package.json deps. Tools like <code>tsconfig-references-cli</code> auto-generate.</li>
</ul>

<h3>Internal package not published</h3>
<ul>
  <li>Apps depend on <code>@org/ui</code> via <code>workspace:*</code>; works in monorepo.</li>
  <li>If you publish the app standalone, <code>workspace:*</code> isn't a valid version.</li>
  <li>pnpm replaces with the actual version on publish (e.g., <code>"@org/ui": "0.2.0"</code>) — handled automatically.</li>
  <li>For apps that aren't published (web frontends), set <code>"private": true</code>.</li>
</ul>

<h3>Build artifacts in git</h3>
<ul>
  <li>Engineer accidentally commits <code>dist/</code> from one package; CI re-builds; diff noise.</li>
  <li>Add <code>**/dist</code>, <code>**/.next</code>, <code>**/build</code> to <code>.gitignore</code>.</li>
</ul>

<h3>Editor performance</h3>
<ul>
  <li>VSCode's TypeScript server indexes everything by default; 30+ packages = slow.</li>
  <li>Workspace files can scope the open editor to a subset.</li>
  <li>TS server + project references makes IntelliSense correct across packages.</li>
  <li>For huge monorepos, consider per-package VSCode workspaces or use Cursor / different IDE.</li>
</ul>

<h3>Lockfile churn</h3>
<ul>
  <li>Each PR touching <code>package.json</code> updates <code>pnpm-lock.yaml</code>; large diffs.</li>
  <li>Use <code>pnpm install --lockfile-only</code> on CI to verify lockfile matches; fail PRs that don't.</li>
  <li>Frozen lockfile in CI: <code>pnpm install --frozen-lockfile</code>.</li>
</ul>

<h3>Cross-package debugging</h3>
<ul>
  <li>Source maps need to point back to the original package's <code>src</code>, not <code>dist</code>.</li>
  <li>Bundlers (Vite, Metro, webpack) handle this if package <code>main</code> points to source files (<code>./src/index.ts</code>) instead of <code>./dist/index.js</code>.</li>
  <li>Tradeoff: source-as-main means consumers compile your TS; <code>./dist</code> ships pre-built.</li>
  <li>Modern pattern: <code>"exports"</code> field with both source + compiled outputs; consumers pick.</li>
</ul>

<h3>Releasing only some packages</h3>
<ul>
  <li>Some packages are public (npm); some private (internal-only).</li>
  <li>Changesets <code>ignore</code> field excludes apps from versioning.</li>
  <li><code>"private": true</code> in package.json prevents accidental publish.</li>
</ul>

<h3>RN-specific edges</h3>
<ul>
  <li>Metro bundler symlink resolution: pnpm's symlinked node_modules tripped older Metro versions.</li>
  <li>RN 0.72+ + Metro &gt;= 0.76 + pnpm &gt;= 8 = generally works without config.</li>
  <li>Babel must transform packages outside <code>node_modules</code>; configure <code>babel.config.js</code> with explicit transforms.</li>
  <li>Native modules: pod install via CocoaPods doesn't auto-detect monorepo; configure <code>react-native.config.js</code> with project paths.</li>
  <li>Expo SDK 49+ has first-class monorepo support; <code>expo-yarn-workspaces</code> deprecated in favor of native pnpm/yarn.</li>
</ul>

<h3>CI cost</h3>
<ul>
  <li>Without remote cache + affected: 30-min CI per PR at 20-package scale.</li>
  <li>With both: ~3-5 min for typical PRs.</li>
  <li>Cost of remote cache: free up to ~10GB on Vercel; self-hosted on S3 = pennies per month.</li>
</ul>

<h3>Branching strategy</h3>
<ul>
  <li>Trunk-based works best — long-lived branches accumulate cross-package changes that conflict.</li>
  <li>Feature flags + canary deploys per app, not per branch.</li>
  <li>Hotfix path: revert vs cherry-pick is clearer in a monorepo because you have one timeline.</li>
</ul>

<h3>When to split a monorepo</h3>
<ul>
  <li>3+ teams that don't coordinate releases anymore.</li>
  <li>Build time exceeds reasonable CI budget even with caching.</li>
  <li>One area has different security / compliance requirements.</li>
  <li>An open-source library shared with the world (extract to its own repo).</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common monorepo mistakes</h3>
<ol>
  <li><strong>No remote cache.</strong> Every CI run rebuilds; minutes wasted.</li>
  <li><strong>"Run all tests on every PR."</strong> Doesn't scale; need affected-only.</li>
  <li><strong>Mixed package managers.</strong> Lockfile chaos; phantom deps.</li>
  <li><strong>npm linked deps inside the repo.</strong> Use <code>workspace:*</code>.</li>
  <li><strong>Per-package TS configs drift.</strong> Same code lints differently.</li>
  <li><strong>Internal packages accidentally published.</strong> Mark <code>private: true</code>.</li>
  <li><strong>Missing env in cache inputs.</strong> Stale cache; mysterious build failures.</li>
  <li><strong>Circular deps between packages.</strong> Breaks topo sort; tsc references error.</li>
  <li><strong>Versioning ad-hoc, not Changesets.</strong> Changelogs drift; manual bumps lose context.</li>
  <li><strong>No CODEOWNERS.</strong> Cross-cutting PRs land without right reviewers.</li>
  <li><strong>One reviewer for the whole repo.</strong> Bottleneck; no team-specific knowledge.</li>
  <li><strong>Reaching for Bazel too early.</strong> JS/TS work fine with pnpm + Turbo; Bazel pays off only at very large scale.</li>
</ol>

<h3>Anti-pattern: shared-everything</h3>
<pre><code class="language-text">// BAD — every package imports @org/utils for everything
packages/utils/src/index.ts:
  export * from './date';
  export * from './currency';
  export * from './http';
  export * from './forms';
  // ...100 more

// One change in @org/utils → every consumer rebuilds
</code></pre>

<p>Better: granular packages (<code>@org/date-utils</code>, <code>@org/currency</code>). Changes scope to actual consumers.</p>

<h3>Anti-pattern: app code in packages/</h3>
<pre><code class="language-text">// BAD — packages/web-routes/ contains app-specific code
packages/
  web-routes/    # only used by apps/web; should live there

// GOOD — apps own their code
apps/
  web/
    src/routes/  # routes here, not extracted
</code></pre>

<h3>Anti-pattern: hoisting workaround</h3>
<pre><code class="language-bash"># BAD — disable pnpm strictness because tests fail
pnpm install --shamefully-hoist

# GOOD — fix the missing dep declarations
# Add the actual dep to the package's own package.json
</code></pre>

<h3>Anti-pattern: forced lockstep versioning</h3>
<pre><code class="language-json">// BAD — every package must bump together; minor change in icons → major bump on ui
"fixed": [["@org/ui", "@org/icons", "@org/auth", "@org/forms"]]
</code></pre>

<p>Use <code>fixed</code> only for tightly-coupled packages (e.g., <code>@org/ui</code> + its peer plugins). Independent versioning by default.</p>

<h3>Anti-pattern: missing turbo cache outputs</h3>
<pre><code class="language-json">// BAD — no outputs declared; Turbo can't cache
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}

// GOOD — outputs listed; Turbo caches them
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    }
  }
}
</code></pre>

<h3>Anti-pattern: circular package deps</h3>
<pre><code class="language-text">// BAD
packages/auth depends on @org/api-client
packages/api-client depends on @org/auth

// Symptom: tsc references error; turbo deadlock; runtime undefined imports
</code></pre>

<p>Solution: extract shared types into a third package (<code>@org/types</code>). Both depend on it; no cycle.</p>

<h3>Anti-pattern: secrets in turbo.json env</h3>
<pre><code class="language-json">// BAD — secrets become part of cache key; rotation invalidates everything
"env": ["AUTH_SECRET", "STRIPE_SECRET"]

// GOOD — runtime-only env not part of build hash
// secrets configured at deploy time; not at build time
</code></pre>

<h3>Anti-pattern: every package has its own tsconfig</h3>
<pre><code class="language-json">// BAD — strictness drifts; some packages pass; some fail same code
// (no shared base)

// GOOD — shared tsconfig.base.json; per-package extends
{
  "extends": "../../tsconfig.base.json"
}
</code></pre>

<h3>Anti-pattern: accidental publish</h3>
<pre><code class="language-json">// BAD — apps/web/package.json
{
  "name": "@org/web"
  // missing private; could be published
}

// GOOD
{
  "name": "@org/web",
  "private": true
}
</code></pre>

<h3>Anti-pattern: branch-based dev environments</h3>
<p>Each branch deploys its own stack including ephemeral DBs. With monorepo's atomic refactors, branch deploys break across packages — e.g., front-end on branch X expects API change on branch Y, but Y's DB schema isn't in branch X. Use feature flags + trunk-based instead.</p>

<h3>Anti-pattern: building everything in dev</h3>
<pre><code class="language-bash"># BAD — engineer working on web doesn't need to build mobile
pnpm turbo run dev

# GOOD — filter
pnpm turbo run dev --filter=@org/web...
</code></pre>

<p>The <code>...</code> means "this package + its dependencies." Web's UI deps build; mobile / admin don't.</p>

<h3>Anti-pattern: no per-package README</h3>
<p>Newcomers see <code>packages/</code> with 30 dirs; no idea what each does or who owns it. Each package needs a 5-line README explaining purpose + usage + owner.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common monorepo interview prompts</h3>
<ol>
  <li>When would you use a monorepo over polyrepos?</li>
  <li>Compare pnpm vs Yarn vs npm workspaces.</li>
  <li>Compare Turborepo vs Nx vs Lerna vs Bazel.</li>
  <li>How do you handle versioning + publishing in a monorepo?</li>
  <li>How do you keep CI fast as the repo grows?</li>
  <li>How do you migrate from polyrepo to monorepo?</li>
  <li>What's the workspace protocol and why does it matter?</li>
  <li>Tell me about a time you debugged a monorepo issue.</li>
</ol>

<h3>The 5-step framework for "design our monorepo"</h3>
<ol>
  <li><strong>Reasons to use one:</strong> shared types? atomic refactors? shared design system? release coordination? If yes to 2+, monorepo wins.</li>
  <li><strong>Pick the stack:</strong> pnpm (workspace) + Turbo or Nx (orchestration) + Changesets (versioning).</li>
  <li><strong>Define structure:</strong> apps/ + packages/ + tools/. Clear naming. Each package has a single purpose + owner.</li>
  <li><strong>Wire CI:</strong> remote cache + affected-only filter. PR CI &lt; 5 min on typical changes.</li>
  <li><strong>Set policies:</strong> CODEOWNERS, branch strategy (trunk-based), versioning policy (independent / linked / fixed), private vs public packages.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"Monorepo when packages actually share state — types, design system, release lifecycle. Polyrepos when teams have independent cadence."</em></li>
  <li><em>"pnpm + Turborepo by default for JS/TS — pnpm's strict resolution prevents phantom deps; Turbo's caching + affected detection scales the CI."</em></li>
  <li><em>"Changesets for versioning — PR-based; each engineer writes a changeset for their change; CI handles the bump + publish."</em></li>
  <li><em>"workspace:* for internal deps — never npm-style version pinning. pnpm replaces with real version on publish."</em></li>
  <li><em>"Remote cache shared between CI and devs — same hash hits cache across machines. Free tier covers most teams."</em></li>
  <li><em>"Affected-only on PR CI: <code>turbo run build --filter='...[origin/main]'</code>. PR touches one app → only that subtree builds."</em></li>
  <li><em>"Bazel only when JS/TS isn't the bottleneck — multi-language, very large scale, hermetic builds. For most teams, Turbo + pnpm wins."</em></li>
  <li><em>"For RN: Metro + pnpm work without extra config since RN 0.72 + Metro 0.76; older versions need <code>watchFolders</code> + <code>nodeModulesPaths</code>."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"shared design system across apps"</td><td>Monorepo with packages/ui</td></tr>
    <tr><td>"slow CI"</td><td>Remote cache + affected detection</td></tr>
    <tr><td>"version chaos"</td><td>Changesets + workspace:*</td></tr>
    <tr><td>"phantom deps"</td><td>pnpm strict mode</td></tr>
    <tr><td>"multi-language"</td><td>Bazel / Buck2 / Pants</td></tr>
    <tr><td>"types out of sync between web and mobile"</td><td>Monorepo with shared @org/types</td></tr>
    <tr><td>"engineer wants only their package's deps"</td><td><code>pnpm install --filter=...</code></td></tr>
    <tr><td>"release one package, not all"</td><td>Changesets independent versioning</td></tr>
    <tr><td>"how to enforce conventions"</td><td>Shared eslint-config + tsconfig.base + lint-staged</td></tr>
  </tbody>
</table>

<h3>Demo script</h3>
<ol>
  <li>Sketch directory layout (apps/ packages/ tools/).</li>
  <li>Show pnpm-workspace.yaml + workspace:* dep example.</li>
  <li>Show turbo.json with build / test pipeline + outputs.</li>
  <li>Show CI step using <code>--filter='...[origin/main]'</code>.</li>
  <li>Show Changesets flow: changeset → version PR → publish.</li>
  <li>Address remote cache + CODEOWNERS + private packages.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"Self-hosted remote cache on S3 + Redis for full control."</em></li>
  <li><em>"TS project references for incremental tsc builds."</em></li>
  <li><em>"Per-team CODEOWNERS + auto-assigned reviewers."</em></li>
  <li><em>"Per-package version policies via Changesets linked / fixed groups."</em></li>
  <li><em>"Generators (Nx) for new package scaffolding."</em></li>
  <li><em>"Branch-based deploy environments via vercel preview / Render preview."</em></li>
  <li><em>"Lint rule enforcing no cross-app imports — apps shouldn't import from each other."</em></li>
  <li><em>"Pre-commit hook running affected lint + tests only."</em></li>
  <li><em>"Lockfile diff CI check — fail PRs with unintended dep changes."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Decision instinct</td><td>Names when monorepo doesn't fit</td></tr>
    <tr><td>Tool fluency</td><td>pnpm + Turbo / Nx + Changesets named without prompting</td></tr>
    <tr><td>Cache understanding</td><td>Knows remote cache + affected + outputs</td></tr>
    <tr><td>Versioning policy</td><td>Changesets; independent vs linked vs fixed</td></tr>
    <tr><td>CI strategy</td><td>Filter + cache + frozen lockfile</td></tr>
    <tr><td>Migration awareness</td><td>git subtree / read-tree to preserve history</td></tr>
    <tr><td>RN awareness</td><td>Metro + pnpm config when relevant</td></tr>
    <tr><td>Restraint</td><td>Doesn't reach for Bazel without justification</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN apps in monorepos work with Metro + pnpm since RN 0.72 / Metro 0.76; older versions need <code>watchFolders</code> + <code>nodeModulesPaths</code>.</li>
  <li>Babel must transform packages outside <code>node_modules</code>; explicit transforms in <code>babel.config.js</code>.</li>
  <li>Native modules: <code>react-native.config.js</code> with project paths so CocoaPods + Gradle find linked native code.</li>
  <li>Expo SDK 49+ first-class pnpm support; <code>expo-yarn-workspaces</code> deprecated.</li>
  <li>EAS Build: works with monorepos; specify <code>cwd</code> in <code>eas.json</code>.</li>
  <li>Shared TS types between web + mobile = the highest-leverage monorepo win for RN teams.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"Why pnpm over npm?"</em> — Strict resolution prevents phantom deps; symlinked node_modules saves disk; faster installs via content-addressable store; better workspace ergonomics.</li>
  <li><em>"How does Turbo's cache work?"</em> — Hash inputs (source, deps, env, tool versions) → cache key; output stored locally + optionally remotely; cache hit → restore outputs without running task.</li>
  <li><em>"How do you prevent cross-team coupling?"</em> — Lint rule banning cross-app imports; CODEOWNERS for review gates; per-package contracts via TS types.</li>
  <li><em>"What's the workspace protocol?"</em> — <code>workspace:*</code> tells the package manager "use the linked workspace package, not npm." On publish, replaced with the real version.</li>
  <li><em>"How do you handle a breaking change in a shared package?"</em> — Major bump via Changesets; consumers update at their own pace if independent; or atomic refactor in same PR if monorepo lets you.</li>
  <li><em>"When would you split a monorepo?"</em> — Independent release cadence + non-coordinating teams + build time exceeds budget + different security boundaries.</li>
  <li><em>"What's wrong with <code>--shamefully-hoist</code>?"</em> — It re-introduces phantom deps. The right fix is to declare missing deps explicitly in package.json.</li>
  <li><em>"How do you scale CI past 30 packages?"</em> — Remote cache (Vercel / Nx Cloud / self-hosted) + affected-only filter + parallel task execution + fail-fast on lint / type-check.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Build a 4-package monorepo: web app + mobile app + shared UI + shared utils.</li>
  <li>Wire pnpm workspaces + Turborepo + remote cache.</li>
  <li>Set up Changesets; do a fake release.</li>
  <li>Write CI with affected-only filter.</li>
  <li>Compare to Nx by re-doing the same in Nx.</li>
  <li>Try with RN + Metro + Expo to feel the mobile-specific config.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read Vercel's Turborepo docs end to end + their kitchen-sink example."</li>
  <li>"Read Nx Cloud architecture docs for the more advanced cache + distribution model."</li>
  <li>"Try Bazel on a tiny multi-language repo to understand the heavyweight tradeoff."</li>
  <li>"Audit a real monorepo's turbo.json — find missing outputs / env declarations."</li>
</ul>
`
    }
  ]
});
