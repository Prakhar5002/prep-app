window.PREP_SITE.registerTopic({
  id: 'ts-declaration',
  module: 'typescript',
  title: 'Declaration Files',
  estimatedReadTime: '35 min',
  tags: ['typescript', 'declaration-files', 'd-ts', 'ambient', 'modules', 'globals', 'definitelytyped', 'js-interop'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Declaration files</strong> (<code>.d.ts</code>) are pure type information — they describe the shape of code that already exists, without producing any JS. They are how TypeScript talks to JavaScript libraries, the DOM, Node, and the global scope.</p>
<ul>
  <li><strong>Three uses:</strong> describe a JS module you depend on, declare globals, or augment existing types.</li>
  <li><strong>Anatomy:</strong> only types, interfaces, <code>declare</code> statements, and re-exports. No runtime code.</li>
  <li><strong>Module declarations:</strong> <code>declare module "name"</code> tells TS what an importable module exports.</li>
  <li><strong>Ambient globals:</strong> <code>declare const FOO: string</code> at the top level adds a global TS knows about.</li>
  <li><strong>Module augmentation:</strong> reopen a third-party module's types to add fields (e.g., extending <code>Express.Request</code>).</li>
  <li><strong>DefinitelyTyped (<code>@types/*</code>):</strong> community-maintained <code>.d.ts</code> packages for libraries that ship as plain JS.</li>
  <li><strong>Triple-slash directives:</strong> <code>///&lt;reference&gt;</code> — usually unnecessary now; <code>tsconfig</code>'s <code>types</code>/<code>typeRoots</code> handles it.</li>
</ul>
<p><strong>Mantra:</strong> "<code>.d.ts</code> describes what's there. <code>.ts</code> creates it. Don't mix."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What is a declaration file?</h3>
<p>A file with the <code>.d.ts</code> extension that contains <em>only</em> type-level statements. The compiler reads it to understand the shape of values that exist somewhere outside this file — typically a third-party JS library, a browser global, a Node built-in, or another part of your own codebase that's pure JS.</p>

<p>Critical property: <strong><code>.d.ts</code> files emit nothing.</strong> They don't compile to JS. They are erased entirely after type checking. If you put runtime code in a <code>.d.ts</code>, the compiler will error.</p>

<h3>Why do they exist?</h3>
<table>
  <thead><tr><th>Scenario</th><th>How <code>.d.ts</code> solves it</th></tr></thead>
  <tbody>
    <tr><td>You depend on a JS library that has no types</td><td>Author or install <code>.d.ts</code> describing its API</td></tr>
    <tr><td>You depend on a JS library that has bad types</td><td>Module augment it; or override locally</td></tr>
    <tr><td>You read environment variables, globals injected by HTML, etc.</td><td>Declare them globally so TS recognizes them</td></tr>
    <tr><td>You ship a JS library yourself</td><td>Generate or hand-write <code>.d.ts</code> so consumers get types</td></tr>
    <tr><td>You import non-JS assets (images, JSON, css)</td><td>Declare modules for those file extensions</td></tr>
    <tr><td>You inject extra fields onto built-in objects (e.g., <code>req.user</code> in Express)</td><td>Module augmentation for the library's namespace</td></tr>
  </tbody>
</table>

<h3>The DefinitelyTyped ecosystem</h3>
<p>Most popular npm packages that don't ship their own types have community <code>.d.ts</code> packages on <a href="https://github.com/DefinitelyTyped/DefinitelyTyped" target="_blank" rel="noopener">DefinitelyTyped</a>, published as <code>@types/{name}</code>. Workflow:</p>
<pre><code class="language-bash">npm i lodash
npm i -D @types/lodash      # pulls in lodash.d.ts community types
</code></pre>
<p>If a package <em>does</em> ship its own types, the <code>"types"</code> or <code>"typings"</code> field in its <code>package.json</code> points to a <code>.d.ts</code> file. TS reads that automatically — no <code>@types</code> needed.</p>

<h3>Authoring vs consuming</h3>
<p>You'll spend most time as a <em>consumer</em>: installing <code>@types/*</code>, occasionally augmenting a module, occasionally declaring a global. Authoring <code>.d.ts</code> from scratch is a specialist task — most apps don't need it.</p>

<h3>Why declaration files matter even in pure-TS codebases</h3>
<ul>
  <li><strong>Building a library:</strong> tsc emits <code>.d.ts</code> alongside <code>.js</code> when <code>declaration: true</code>. Consumers depend on them.</li>
  <li><strong>Globals:</strong> Webpack's <code>process.env</code>, Vite's <code>import.meta.env</code>, Vitest's <code>describe/it</code> — all need ambient declarations.</li>
  <li><strong>Asset imports:</strong> <code>import img from "./logo.png"</code> needs a declaration that says "any <code>.png</code> import resolves to <code>string</code>".</li>
  <li><strong>Native modules in RN:</strong> when bridging to a hand-written native module, the <code>.d.ts</code> describes the JS-facing surface.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The two compiler models</h3>
<p>Before TS can resolve an import or a global, it needs to know whether it lives in:</p>
<ol>
  <li><strong>Module scope</strong> — exists if the file has any top-level <code>import</code> or <code>export</code>. Names are scoped to the file.</li>
  <li><strong>Global scope</strong> — files with no top-level <code>import</code>/<code>export</code>. Names are visible everywhere.</li>
</ol>
<p>This single distinction explains 90% of "why doesn't TS see my type?" mysteries:</p>
<pre><code class="language-ts">// foo.d.ts — this becomes a module file because of the export
export type Foo = string;

// foo.d.ts — this is global because there's no import/export
declare const FOO: string;
type Foo = string;     // global type

// To force global mode while having exports, use 'declare global':
export {};   // first, mark this as a module
declare global {
  const FOO: string;
  interface Window { myFlag: boolean }
}
</code></pre>

<h3>The <code>declare</code> keyword</h3>
<p><code>declare</code> means "this exists at runtime, but I'm only telling you about it here." Used inside <code>.d.ts</code> files, it's mandatory for top-level entities. Inside <code>.ts</code> files, it's how you talk about an external value without importing it.</p>
<pre><code class="language-ts">declare const VERSION: string;          // exists at runtime, type-only here
declare function init(): Promise&lt;void&gt;; // function exists, this is its signature
declare class Logger { log(msg: string): void; }
declare namespace MyLib { interface Options { url: string; } }
declare module "untyped-lib";           // the catch-all "trust me" import
declare module "*.png" { const src: string; export default src; }
</code></pre>

<h3>Three flavors of declaration files</h3>
<table>
  <thead><tr><th>Flavor</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td>Global declarations</td><td>"the page has a global function <code>gtag</code>"</td></tr>
    <tr><td>External module declarations</td><td>"<code>import x from 'lodash'</code> exports these things"</td></tr>
    <tr><td>Module augmentation</td><td>"<code>express</code> already has types; I'm adding a field to <code>Request</code>"</td></tr>
  </tbody>
</table>

<h3>How TS finds <code>.d.ts</code> files</h3>
<ol>
  <li>For each <code>import "X"</code>: look at the package's <code>"types"</code> field, then <code>node_modules/@types/X</code>, then walk parent directories.</li>
  <li>For globals: pick up any <code>.d.ts</code> reachable via the <code>tsconfig</code>'s <code>include</code> globs and the <code>types</code>/<code>typeRoots</code> options.</li>
  <li><code>typeRoots</code> defaults to <code>["./node_modules/@types"]</code>; override only when you have your own types directory.</li>
  <li><code>types</code> restricts which packages from <code>typeRoots</code> are auto-included — useful when too many <code>@types</code> are present and you want only specific ones.</li>
</ol>

<h3>The "ambient" terminology</h3>
<p>"Ambient" is just TS slang for "declared without an implementation." All entities in <code>.d.ts</code> files are ambient. <code>declare</code> in a <code>.ts</code> file is also ambient. The body — if any — is ignored.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Anatomy of a declaration file</h3>
<pre><code class="language-ts">// my-lib.d.ts

// Top-level types and interfaces — same syntax as .ts
export interface User {
  id: string;
  name: string;
}

// Functions — declare just the signature
export declare function greet(user: User): string;

// Classes — declare structure, no body
export declare class Logger {
  constructor(prefix: string);
  log(msg: string): void;
  static defaultPrefix: string;
}

// Constants
export declare const VERSION: string;

// Namespaces (legacy organization)
export declare namespace Config {
  interface Options { url: string; retries?: number }
  function load(): Options;
}

// Default export
declare const _default: { greet: typeof greet };
export default _default;
</code></pre>

<h3>Module declarations — for untyped imports</h3>
<pre><code class="language-ts">// types/some-jslib.d.ts

declare module "some-jslib" {
  export interface Options { verbose?: boolean }
  export function configure(opts: Options): void;
  export default function main(): Promise&lt;number&gt;;
}

// Now in your code:
import main, { configure } from "some-jslib";   // typed
</code></pre>

<h3>Wildcard module declarations — for assets</h3>
<pre><code class="language-ts">// assets.d.ts

declare module "*.png" {
  const src: string;
  export default src;
}
declare module "*.svg" {
  const src: string;
  export default src;
}
declare module "*.svg?react" {
  import * as React from "react";
  const Component: React.FC&lt;React.SVGProps&lt;SVGSVGElement&gt;&gt;;
  export default Component;
}
declare module "*.json" {
  const value: unknown;
  export default value;
}
declare module "*.css" {
  const styles: { readonly [key: string]: string };
  export default styles;
}

// Now usable:
import logo from "./logo.png";        // string
import data from "./data.json";        // unknown
import styles from "./Foo.module.css"; // { [k]: string }
</code></pre>

<h3>Globals — environment-injected values</h3>
<pre><code class="language-ts">// env.d.ts

declare const __APP_VERSION__: string;        // injected by Vite/Webpack DefinePlugin
declare const __DEV__: boolean;                // RN dev flag

// Vite's import.meta.env
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_FEATURE_FOO: "true" | "false";
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// process.env in Node — extending NodeJS.ProcessEnv
declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    NODE_ENV: "development" | "production" | "test";
  }
}
</code></pre>

<h3>Module augmentation — extending an existing module</h3>
<p>Add fields to a third-party module's types without forking it.</p>
<pre><code class="language-ts">// express-augment.d.ts

import "express";                      // import the module first

declare module "express" {
  interface Request {
    user?: { id: string; role: "admin" | "user" };
    requestId: string;
  }
}

// Now app code can use req.user as if it were declared in express itself.
</code></pre>

<h3>Global augmentation — adding to <code>Window</code>, <code>HTMLElement</code>, etc.</h3>
<pre><code class="language-ts">// global-augment.d.ts

export {};   // make this a module so we can use 'declare global'

declare global {
  interface Window {
    gtag?: (cmd: string, id: string, params: Record&lt;string, unknown&gt;) =&gt; void;
    __APP_BOOTED__?: boolean;
  }
}

// Now in any .ts file:
window.gtag?.("event", "click", { label: "buy" });   // typed
</code></pre>

<h3>Authoring a library's <code>.d.ts</code> output</h3>
<p>If you ship a TS library, set <code>declaration: true</code> in <code>tsconfig.json</code> and tsc will emit <code>.d.ts</code> alongside <code>.js</code>:</p>
<pre><code class="language-jsonc">// tsconfig.build.json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": false,
    "outDir": "dist"
  }
}

// package.json
{
  "main": "dist/index.js",
  "types": "dist/index.d.ts",       // or "typings"
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  }
}
</code></pre>

<h3>The <code>tsconfig</code> knobs</h3>
<table>
  <thead><tr><th>Option</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td><code>declaration</code></td><td>Emit <code>.d.ts</code> alongside JS output</td></tr>
    <tr><td><code>declarationMap</code></td><td>Source-map for <code>.d.ts</code> → original <code>.ts</code> (jump-to-definition into source)</td></tr>
    <tr><td><code>emitDeclarationOnly</code></td><td>Skip JS emission (you compile JS via Babel/SWC, types via tsc)</td></tr>
    <tr><td><code>typeRoots</code></td><td>Where to look for ambient packages — defaults to <code>node_modules/@types</code></td></tr>
    <tr><td><code>types</code></td><td>Whitelist which packages from <code>typeRoots</code> get auto-included</td></tr>
    <tr><td><code>skipLibCheck</code></td><td>Skip type-checking inside <code>.d.ts</code> files (much faster builds; recommended in apps)</td></tr>
    <tr><td><code>declarationDir</code></td><td>Separate output directory for declaration files</td></tr>
  </tbody>
</table>

<h3>Triple-slash directives (legacy)</h3>
<pre><code class="language-ts">/// &lt;reference path="../shared/types.d.ts" /&gt;
/// &lt;reference types="node" /&gt;
/// &lt;reference lib="dom" /&gt;
</code></pre>
<p>Pre-modules style. Almost never needed in modern TS — <code>tsconfig</code>'s <code>include</code>/<code>files</code>/<code>types</code> options handle it. The exception is when authoring a published <code>.d.ts</code> bundle that needs to pull in another typing dependency.</p>

<h3>The "rich" library declaration pattern (legacy UMD)</h3>
<pre><code class="language-ts">// my-lib.d.ts — old-style UMD library that works as &lt;script&gt; AND import
export = MyLib;
export as namespace MyLib;

declare namespace MyLib {
  interface Options { url: string }
  function init(opts: Options): void;
  const VERSION: string;
}

// Consumer:
import MyLib from "my-lib";        // module
const v = window.MyLib.VERSION;     // global (when included via &lt;script&gt;)
</code></pre>
<p>Modern libraries use ESM + types and skip this entirely.</p>

<h3>Type-only imports</h3>
<pre><code class="language-ts">// In .ts/.tsx code, use 'import type' to import types only.
// Never emits a runtime require/import.
import type { User } from "./user";
import type * as Express from "express";

// Or per-symbol:
import { type Request, json } from "express";   // 'json' is runtime; 'Request' is type-only
</code></pre>
<p>Critical when interop with bundlers that have side-effect imports — using <code>import type</code> guarantees zero runtime emission.</p>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Add types to an untyped npm package</h3>
<p>You install a package with no types and no <code>@types/...</code> on DefinitelyTyped.</p>
<pre><code class="language-ts">// types/legacy-tracker.d.ts (anywhere included by tsconfig)

declare module "legacy-tracker" {
  export interface TrackerOptions {
    siteId: string;
    debug?: boolean;
  }

  export interface Event {
    name: string;
    properties?: Record&lt;string, string | number | boolean&gt;;
  }

  export class Tracker {
    constructor(options: TrackerOptions);
    track(event: Event): Promise&lt;void&gt;;
    flush(): Promise&lt;void&gt;;
  }

  // optional default
  export default Tracker;
}
</code></pre>
<pre><code class="language-jsonc">// tsconfig.json — make sure the file is picked up
{
  "compilerOptions": {
    "typeRoots": ["./node_modules/@types", "./types"]
  },
  "include": ["src/**/*", "types/**/*.d.ts"]
}
</code></pre>
<pre><code class="language-ts">// usage
import Tracker from "legacy-tracker";
const t = new Tracker({ siteId: "abc" });
await t.track({ name: "click", properties: { btn: "buy" } });
</code></pre>

<h3>Example 2: Express request augmentation</h3>
<pre><code class="language-ts">// types/express-augment.d.ts

import "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: { id: string; role: "admin" | "user" };
    correlationId: string;
  }
}
</code></pre>
<pre><code class="language-ts">// usage in routes
import express from "express";
const app = express();
app.use((req, _res, next) =&gt; {
  req.correlationId = crypto.randomUUID();    // typed!
  next();
});

app.get("/me", (req, res) =&gt; {
  if (!req.user) return res.status(401).end();
  res.json({ id: req.user.id });
});
</code></pre>

<h3>Example 3: Asset imports for a Vite + RN-Web app</h3>
<pre><code class="language-ts">// vite-env.d.ts

/// &lt;reference types="vite/client" /&gt;

declare module "*.svg?react" {
  import * as React from "react";
  const Component: React.FC&lt;React.SVGProps&lt;SVGSVGElement&gt;&gt;;
  export default Component;
}

declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_FEATURE_BETA: string;
}
interface ImportMeta { readonly env: ImportMetaEnv; }
</code></pre>

<h3>Example 4: Process env typing for a Node service</h3>
<pre><code class="language-ts">// types/env.d.ts

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    PORT?: string;
    DATABASE_URL: string;
    JWT_SECRET: string;
  }
}
</code></pre>
<p>Plus a runtime check at boot:</p>
<pre><code class="language-ts">function requireEnv(key: keyof NodeJS.ProcessEnv): string {
  const v = process.env[key];
  if (!v) throw new Error(\`Missing env: \${key}\`);
  return v;
}

const dbUrl = requireEnv("DATABASE_URL");
</code></pre>

<h3>Example 5: Globals injected by HTML</h3>
<pre><code class="language-html">&lt;!-- index.html --&gt;
&lt;script&gt;
  window.__BOOTSTRAP_DATA__ = {"user":{"id":"1","name":"Alice"}};
&lt;/script&gt;
</code></pre>
<pre><code class="language-ts">// global.d.ts

export {};
declare global {
  interface Window {
    __BOOTSTRAP_DATA__: {
      user: { id: string; name: string };
    };
  }
}
</code></pre>
<pre><code class="language-ts">// safe boot
const u = window.__BOOTSTRAP_DATA__.user;
console.log(u.name);
</code></pre>

<h3>Example 6: Authoring a typed library</h3>
<p>You're publishing <code>my-utils</code>. Source in <code>src/</code>, output in <code>dist/</code>.</p>
<pre><code class="language-ts">// src/index.ts
export type CmpResult = -1 | 0 | 1;
export function cmp&lt;T&gt;(a: T, b: T): CmpResult { return a &lt; b ? -1 : a &gt; b ? 1 : 0; }
</code></pre>
<pre><code class="language-jsonc">// tsconfig.build.json
{
  "compilerOptions": {
    "outDir": "dist",
    "declaration": true,
    "declarationMap": true,
    "module": "ESNext",
    "target": "ES2020",
    "moduleResolution": "Bundler"
  },
  "include": ["src/**/*"]
}
</code></pre>
<pre><code class="language-jsonc">// package.json
{
  "name": "my-utils",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": ["dist"]
}
</code></pre>
<p>Consumers get <code>cmp&lt;T&gt;(a: T, b: T): CmpResult</code> with full IntelliSense.</p>

<h3>Example 7: React Native — typed hand-rolled native module</h3>
<pre><code class="language-ts">// MyNative.d.ts

declare module "MyNative" {
  export type SyncResult = "ok" | "stale" | "error";

  export interface MyNativeAPI {
    sync(): Promise&lt;SyncResult&gt;;
    addListener(event: "progress", cb: (pct: number) =&gt; void): void;
    removeAllListeners(event: "progress"): void;
  }

  const MyNative: MyNativeAPI;
  export default MyNative;
}
</code></pre>
<pre><code class="language-ts">// usage
import MyNative from "MyNative";
const r = await MyNative.sync();   // SyncResult
</code></pre>

<h3>Example 8: Global test utilities (Jest)</h3>
<pre><code class="language-ts">// jest.d.ts (only needed if using globals: true and not pulling @types/jest)

declare const describe: (name: string, fn: () =&gt; void) =&gt; void;
declare const test: (name: string, fn: () =&gt; void | Promise&lt;void&gt;) =&gt; void;
declare const it: typeof test;
declare const expect: any;
declare const beforeEach: (fn: () =&gt; void) =&gt; void;
declare const afterEach: (fn: () =&gt; void) =&gt; void;
</code></pre>
<p>In practice you should always install <code>@types/jest</code>; this is just to illustrate the shape.</p>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>"My types aren't picked up"</h3>
<p>The most common <code>.d.ts</code> bug. Checklist:</p>
<ol>
  <li>Is the file matched by <code>include</code>? Run <code>tsc --listFiles</code> — if it's not in the list, fix the glob.</li>
  <li>Is it accidentally a module? A stray <code>export</code> at top level converts the file from global to module scope, hiding ambient declarations from the rest of the codebase.</li>
  <li>Conflict with <code>node_modules/@types</code>? Use <code>"types": ["node", "jest"]</code> in tsconfig to whitelist exactly which ambient packages are visible.</li>
  <li><code>skipLibCheck</code> off? Errors in unrelated <code>.d.ts</code> files will block compilation entirely.</li>
</ol>

<h3>Module vs global confusion</h3>
<pre><code class="language-ts">// types.d.ts
declare const FOO: string;            // global
type Helper = string;                  // global

export interface Foo {}                // <-- THIS turns the whole file into a module
                                       // and now FOO/Helper are not visible globally
</code></pre>
<p>Either keep the file global (no exports) or wrap globals with <code>declare global { ... }</code> after adding <code>export {}</code>.</p>

<h3>Module augmentation requires the original module to be a real module</h3>
<pre><code class="language-ts">// Won't work — "module" must already exist
declare module "i-just-made-this-up" {
  // ...
}
// → If the package isn't installed and isn't a string-literal module elsewhere, augmentation is meaningless
</code></pre>

<h3>Augmentation files must be reachable</h3>
<p>The augment file must be in the compilation. If it lives outside <code>include</code> globs, the augment never applies. Add it to <code>include</code> or import it from a file that is included.</p>

<h3>Wildcard <code>*.png</code> declarations don't apply during bundling</h3>
<p>The <code>.d.ts</code> tells TS what type the import resolves to — but the bundler still needs a loader (Webpack <code>file-loader</code>, Vite handles natively, RN handles via Metro). The declaration alone doesn't make the import work at runtime.</p>

<h3>Default export confusion in <code>.d.ts</code></h3>
<pre><code class="language-ts">// CommonJS-style — for libraries that use module.exports = something
declare module "old-lib" {
  function init(): void;
  export = init;     // <-- "this module IS this thing"
}

// Consumer must enable esModuleInterop or use:
import init = require("old-lib");
</code></pre>

<h3>Class augmentation has limits</h3>
<p>You can't augment a class declared elsewhere with new methods if the host language disallows it. Workarounds: declaration merging through interfaces (works for instance shape only, not new statics).</p>

<h3>Recursive type imports across <code>.d.ts</code> files</h3>
<p>Possible. But circular imports between modules can cause "is not a module" errors. Keep dependency graphs acyclic.</p>

<h3>Declaration emit drops type-only imports</h3>
<p>If <code>declaration: true</code> is on and your code uses a type-only import path that doesn't exist in the published bundle, the emitted <code>.d.ts</code> may reference a missing module. Make all type-only imports point at packages your consumers actually have.</p>

<h3>Ambient enums + isolatedModules</h3>
<pre><code class="language-ts">declare const enum Status { OK = 200, NotFound = 404 }   // legal in .d.ts
// But under isolatedModules: true, individual .ts files cannot reference const enums.
// Use a regular enum or, better, a 'as const' object.
</code></pre>

<h3><code>typeof</code> on a default export</h3>
<pre><code class="language-ts">// In .d.ts authoring:
declare const _default: { greet(name: string): string };
export default _default;

// Consumers:
import lib from "my-lib";
type Lib = typeof lib;   // works
</code></pre>

<h3>Triple-slash <code>reference</code> placement</h3>
<p>Triple-slash directives MUST appear at the top of the file, before any other content (including comments). Misplaced ones are silently ignored.</p>

<h3>Generated <code>.d.ts</code> is too "wide"</h3>
<p>tsc emits the inferred or annotated type of an export. If the export is <code>const x = { a: 1 }</code>, the emitted type is <code>{ a: number }</code>, not <code>{ a: 1 }</code>. Use <code>as const</code> or explicit annotations to publish narrower types.</p>

<h3>Conflict between local and library types</h3>
<p>If you locally augment <code>express</code> and the consumer also augments it, both apply (declaration merging unions them). Conflicts in field types raise errors. Coordinate with the team or namespace your additions.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: putting runtime code in <code>.d.ts</code></h3>
<pre><code class="language-ts">// foo.d.ts
export const VERSION = "1.0.0";    // ❌ "An implementation cannot be declared in ambient contexts"

// FIX
export declare const VERSION: string;
</code></pre>

<h3>Bug 2: forgetting <code>export {}</code> when using <code>declare global</code></h3>
<pre><code class="language-ts">// global.d.ts — global file, can't use 'declare global'
declare global { interface Window { foo: string } }   // ❌ — already global

// Either drop 'declare global':
interface Window { foo: string }     // declaration merging works in global file

// Or make the file a module first:
export {};
declare global { interface Window { foo: string } }
</code></pre>

<h3>Bug 3: stray export converting a globals file</h3>
<pre><code class="language-ts">// env.d.ts
declare const API_URL: string;
export type _ = unknown;       // ❌ this innocuous export hides API_URL globally
</code></pre>

<h3>Bug 4: augmenting the wrong module name</h3>
<pre><code class="language-ts">// Express's request type lives in 'express-serve-static-core', not 'express'
declare module "express" { interface Request { user?: User } }      // ❌ ineffective
declare module "express-serve-static-core" { interface Request { user?: User } }  // ✅
</code></pre>

<h3>Bug 5: emitting a <code>.d.ts</code> that imports from <code>node_modules</code> by absolute path</h3>
<p>Symptom: consumers get type errors like "cannot find module '/Users/x/node_modules/...'." Cause: a generated declaration referenced a path that only existed on the build machine. Fix by making sure everything you import in source is resolvable for consumers — i.e., is a real installed package.</p>

<h3>Bug 6: missing peer dep in published <code>.d.ts</code></h3>
<pre><code class="language-ts">// my-lib's .d.ts
import type { ComponentType } from "react";   // ❌ if 'react' is not a peer/dependency, consumer can't resolve
</code></pre>
<p>List <code>react</code> in <code>peerDependencies</code> and the consumer is responsible for installing it.</p>

<h3>Bug 7: same name in two <code>.d.ts</code> files merging unintentionally</h3>
<pre><code class="language-ts">// a.d.ts
interface User { id: string }
// b.d.ts
interface User { name: string }   // declaration-merges into one User { id; name }
</code></pre>
<p>Sometimes intended; often surprising. Use <code>type</code> aliases (don't merge) when merging is undesired.</p>

<h3>Bug 8: <code>declare module "*.png"</code> losing precedence</h3>
<p>If a Vite/Webpack-injected wildcard declaration conflicts with one in your project, the bundler-injected one usually wins because it's loaded earlier. Symptom: you typed <code>*.png</code> as <code>{ default: string }</code> but TS thinks it's <code>any</code>. Fix: align with the bundler's vendor types or remove your duplicate.</p>

<h3>Bug 9: shadowing a built-in lib</h3>
<pre><code class="language-ts">// Not recommended — overrides DOM types
declare const fetch: (url: string) =&gt; string;   // ❌ shadows the real fetch
</code></pre>

<h3>Bug 10: type-only import that becomes a runtime import</h3>
<pre><code class="language-ts">// 'import { Foo }' may be elided OR retained based on bundler settings
import { Foo } from "heavy-lib";

// Force type-only:
import type { Foo } from "heavy-lib";
</code></pre>
<p>With certain tsconfig + bundler combinations, "<code>import { Foo }</code>" can keep <code>heavy-lib</code> in the runtime bundle even if <code>Foo</code> is just a type. <code>import type</code> is the explicit fix.</p>

<h3>Anti-pattern 1: writing your own types for a popular library</h3>
<p>Before declaring <code>"some-popular-lib"</code> yourself, check <code>@types/some-popular-lib</code>. The community version is almost always more accurate.</p>

<h3>Anti-pattern 2: using <code>any</code> in your declared API</h3>
<pre><code class="language-ts">// Useless — gives consumers no help
declare module "tracker" {
  export function track(...args: any[]): any;
}
</code></pre>

<h3>Anti-pattern 3: declaring globals that should be parameters</h3>
<pre><code class="language-ts">// Global tempts misuse
declare const CURRENT_USER: User;

// Better: pass it explicitly through your composition root
</code></pre>

<h3>Anti-pattern 4: catch-all <code>declare module "*"</code></h3>
<pre><code class="language-ts">declare module "*";   // ❌ — any import is now any, all type safety gone
</code></pre>

<h3>Anti-pattern 5: editing <code>node_modules</code>'s <code>.d.ts</code> directly</h3>
<p>Augmentation exists for this reason. Local edits get blown away on reinstall and confuse teammates.</p>

<h3>Anti-pattern 6: parallel <code>.d.ts</code> + <code>.ts</code> for your own code</h3>
<p>Project source code should live in <code>.ts</code>. Don't hand-write a parallel <code>.d.ts</code> describing types that already exist in your <code>.ts</code> files — they'll drift.</p>

<h3>Anti-pattern 7: mixing <code>declare namespace</code> and <code>export</code></h3>
<p>Old-style namespaces and ESM exports can coexist but it's confusing. Pick one: namespaces for legacy global libs (UMD), modules everywhere else.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '🎤 Interview Patterns',
      html: `
<h3>The 10 questions worth rehearsing</h3>
<table>
  <thead><tr><th>Question</th><th>One-liner</th></tr></thead>
  <tbody>
    <tr><td><em>What is a <code>.d.ts</code> file?</em></td><td>A type-only declaration file that emits no JS; describes shapes for existing values.</td></tr>
    <tr><td><em>What's the difference between a module file and a global file?</em></td><td>Any top-level <code>import</code>/<code>export</code> makes it a module (file-scoped names). Otherwise it's global (visible everywhere).</td></tr>
    <tr><td><em>How does TS pick up <code>.d.ts</code> files?</em></td><td>Via <code>include</code> globs, <code>typeRoots</code>, <code>types</code>, and the <code>"types"</code> field of imported packages.</td></tr>
    <tr><td><em>What is <code>@types/*</code>?</em></td><td>DefinitelyTyped — community-maintained <code>.d.ts</code> packages for libraries that ship plain JS.</td></tr>
    <tr><td><em>How do you augment an existing module?</em></td><td>Use <code>declare module "name"</code> with an interface declaration that merges into the existing one.</td></tr>
    <tr><td><em>How do you add a property to the global <code>Window</code>?</em></td><td><code>export {}; declare global { interface Window { foo: string } }</code></td></tr>
    <tr><td><em>How do you type asset imports?</em></td><td><code>declare module "*.png" { const src: string; export default src; }</code></td></tr>
    <tr><td><em>What does <code>declare</code> mean?</em></td><td>"This exists at runtime, here's its type — emit nothing."</td></tr>
    <tr><td><em>When do you use <code>import type</code>?</em></td><td>To guarantee zero-cost imports — particularly for type-only references in bundles.</td></tr>
    <tr><td><em>How do you publish a TS library with types?</em></td><td>Set <code>declaration: true</code>, point <code>types</code> in <code>package.json</code> at the emitted <code>.d.ts</code>.</td></tr>
  </tbody>
</table>

<h3>Live-coding warmups</h3>
<ol>
  <li>Write <code>.d.ts</code> for an untyped npm package <code>tiny-color</code> that exports <code>parse(hex: string): RGB</code>.</li>
  <li>Augment Express's <code>Request</code> with a <code>userId: string</code>.</li>
  <li>Add an asset declaration so <code>import logo from "./logo.svg"</code> is typed as <code>string</code>.</li>
  <li>Declare typed <code>process.env</code> with three required keys.</li>
  <li>Add a global <code>Window.dataLayer</code> as <code>unknown[]</code>.</li>
</ol>

<h3>Spot the bug</h3>
<ul>
  <li><code>declare const VERSION = "1.0"</code> in a <code>.d.ts</code> — ambient context can't have an initializer; drop the value.</li>
  <li>A globals file with one <code>export type _ = unknown</code> that's silently turning the file into a module — remove the export or wrap with <code>declare global</code>.</li>
  <li>Augmenting <code>"express"</code> when the type lives in <code>"express-serve-static-core"</code> — fix the module name.</li>
  <li><code>declare module "*"</code> — disables all type safety.</li>
  <li>Asset wildcard returning <code>any</code> instead of <code>string</code> — explicit <code>const src: string; export default src;</code>.</li>
</ul>

<h3>Two-minute design prompts</h3>
<ul>
  <li><em>"Add types for an HTML-injected global config object."</em>
    <pre><code class="language-ts">export {};
declare global {
  interface Window {
    __CONFIG__: { apiUrl: string; flags: Record&lt;string, boolean&gt; };
  }
}</code></pre>
  </li>
  <li><em>"Type a hand-rolled native module that posts a message and listens for events."</em>
    <pre><code class="language-ts">declare module "MyNative" {
  type Event = { kind: "progress"; pct: number } | { kind: "done"; ok: boolean };
  export default {
    send(payload: { id: string }): Promise&lt;void&gt;,
    addListener(cb: (e: Event) =&gt; void): () =&gt; void,
  };
}</code></pre>
  </li>
  <li><em>"Augment React Navigation's RootStackParamList from a feature module."</em>
    <pre><code class="language-ts">declare global {
  namespace ReactNavigation {
    interface RootParamList {
      Profile: { userId: string };
      Settings: undefined;
    }
  }
}
export {};</code></pre>
  </li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Module vs global awareness</td><td>You correctly use <code>export {}</code> + <code>declare global</code> when needed.</td></tr>
    <tr><td>Use augmentation, not forking</td><td>You augment a third-party module instead of copying its types.</td></tr>
    <tr><td>Knows DefinitelyTyped first</td><td>You install <code>@types/X</code> before declaring your own.</td></tr>
    <tr><td>Library publish hygiene</td><td>You enable <code>declaration</code>, point <code>types</code> in <code>package.json</code>, list peer deps.</td></tr>
    <tr><td>Asset typing</td><td>You add wildcard module declarations and align with the bundler's loader behavior.</td></tr>
    <tr><td>Type-only imports</td><td>You use <code>import type</code> to keep types out of the runtime graph.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li><strong>RN's own types</strong> ship in <code>react-native</code>; no <code>@types/react-native</code> needed for current versions.</li>
  <li><strong>Native modules:</strong> hand-write a <code>.d.ts</code> for the JS-facing surface; new architecture (TurboModules) generates from a TS spec via codegen.</li>
  <li><strong>React Navigation:</strong> declaration merging via <code>ReactNavigation.RootParamList</code> gives global type-safe navigation.</li>
  <li><strong>Asset imports:</strong> Metro's <code>react-native</code> pre-configures <code>*.png</code>/<code>*.jpg</code>, but you may need declarations for SVG-as-component.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd narrow the module's type to exactly the surface we use, not the wide vendor types — keeps consumer tooltips clean."</li>
  <li>"I'd promote the env declaration into a runtime-validated parser (<code>zod</code>) so missing keys throw at boot, not at first use."</li>
  <li>"I'd add a CI check that <code>tsc --emitDeclarationOnly</code> succeeds on every PR — catches accidental type drift before publish."</li>
  <li>"I'd keep <code>skipLibCheck</code> on in apps but off in the library build to ensure my emitted <code>.d.ts</code> is internally consistent."</li>
</ul>
`
    }
  ]
});
