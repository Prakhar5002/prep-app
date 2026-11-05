window.PREP_SITE.registerTopic({
  id: "react-nextjs",
  module: "react",
  title: "Next.js (App Router)",
  estimatedReadTime: "45 min",
  tags: ["nextjs","app-router","server-components","server-actions","caching","revalidation","route-handlers","middleware","full-stack","vercel"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Next.js App Router = <strong>folders as routes, Server Components for reads, Server Actions for writes, <code>revalidate*</code> to tell the caches, Route Handlers for non-React clients, middleware for cheap gating</strong> — with caching defaults that changed in 15 and again in 16.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Full-stack framework:</strong> the <code>app/</code> folder is the router; reads in async Server Components, writes in Server Actions (<code>'use server'</code>), APIs in Route Handlers (<code>app/api/.../route.ts</code>), edge logic in middleware.</li>
    <li>Only <code>page.tsx</code> and <code>route.ts</code> make a segment public; <code>layout</code> persists, <code>template</code> remounts, <code>loading</code> = Suspense, <code>error</code> = client error boundary.</li>
    <li>Components are <strong>server by default</strong>; <code>'use client'</code> marks a module boundary — keep it at the leaves; pass server content into client components as <code>children</code>.</li>
    <li>Props crossing to the client must be serialisable and are visible in the HTML — return DTOs, not rows.</li>
    <li>Parallelise with <code>Promise.all</code>, stream slow parts with <code>&lt;Suspense&gt;</code>, dedupe per-request with React <code>cache()</code>.</li>
    <li>Four caches: request memoisation, Data Cache, Full Route Cache, Router Cache.</li>
    <li><strong>Next 13/14</strong> cached <code>fetch</code> by default. <strong>Next 15</strong> flipped it: fetch &amp; GET handlers uncached by default, async <code>cookies</code>/<code>headers</code>/<code>params</code>/<code>searchParams</code>, router cache page staleTime 0.</li>
    <li><strong>Next 16:</strong> Cache Components (<code>'use cache'</code>, <code>cacheLife</code>, <code>cacheTag</code>), middleware renamed to proxy — verify exact APIs against current docs. <strong>Version drift is the #1 interview trap:</strong> always name the version you mean.</li>
    <li>Server Actions are <strong>public POST endpoints</strong>: authN + authZ + zod every time; then revalidate; <code>redirect</code> throws so keep it out of try/catch.</li>
    <li>Route Handlers for mobile/partners/webhooks (raw body via <code>req.text()</code> for signatures).</li>
    <li>Auth in layers: middleware optimistic, DAL authoritative, action re-checks resource ownership.</li>
    <li>Self-host: <code>output: 'standalone'</code>, shared cache handler for multi-pod ISR, <code>NEXT_PUBLIC_*</code> baked at build.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Assuming caching behaviour from an older version</strong> — e.g. expecting <code>fetch</code> to be cached in Next 15 (it isn't), or expecting one <code>revalidateTag</code> to purge every self-hosted pod (it doesn't without a shared cache handler). Close second: protecting data only in middleware or a layout.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Server Components read, Server Actions write, and revalidateTag is how a mutation tells the caches what changed."</div>
  <div class="revision-say">"I treat every Server Action like a public POST handler — authenticate, authorise the specific resource, validate with zod — because that's what it is on the wire."</div>
  <div class="revision-say">"Caching defaults flipped in Next 15 and changed again in 16, so I state the version and check the docs rather than relying on what the framework did last year."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What Next.js App Router is</h3>
<p>Next.js is a React meta-framework by Vercel. The <strong>App Router</strong> (stable since 13.4, May 2023) replaced the older <strong>Pages Router</strong> (<code>pages/</code>, <code>getServerSideProps</code>, <code>getStaticProps</code>, <code>pages/api</code>). The App Router is built on <strong>React Server Components (RSC)</strong>, Suspense streaming and React 19 Actions. Both routers can coexist in one app during migration.</p>

<h3>Why a frontend/RN engineer moving to full stack should care</h3>
<ul>
  <li><strong>It collapses the BFF.</strong> In a classic SPA + Express setup you write an endpoint, a client fetch, loading state, error state and a cache (React Query) for every screen. In App Router, a Server Component <em>is</em> the endpoint + the render, and a Server Action <em>is</em> the mutation endpoint + the form handler.</li>
  <li><strong>FDE work is "ship a working internal tool by Friday".</strong> Admin consoles, customer dashboards, demo apps over a customer's API — Next gives auth, DB access, UI and deploy in one repo.</li>
  <li><strong>It is still a server.</strong> Everything you know from <a href="#/topic/be-express">Express.js Deep</a> about validation, authZ, idempotency and timeouts still applies — Next just hides the wiring.</li>
</ul>

<h3>Pages Router vs App Router</h3>
<table>
  <thead><tr><th>Concern</th><th>Pages Router (<code>pages/</code>)</th><th>App Router (<code>app/</code>)</th></tr></thead>
  <tbody>
    <tr><td>Default component type</td><td>Client (everything hydrates)</td><td>Server (zero JS unless <code>'use client'</code>)</td></tr>
    <tr><td>Data fetching</td><td><code>getServerSideProps</code> / <code>getStaticProps</code> per page</td><td><code>async</code> components at any level, <code>fetch</code> or direct DB</td></tr>
    <tr><td>Layouts</td><td><code>_app.tsx</code> + manual nesting</td><td>Nested <code>layout.tsx</code> that persist across navigation</td></tr>
    <tr><td>Loading / error UI</td><td>Manual</td><td>File conventions: <code>loading.tsx</code>, <code>error.tsx</code>, <code>not-found.tsx</code></td></tr>
    <tr><td>Mutations</td><td>API route + client fetch</td><td>Server Actions (plus route handlers)</td></tr>
    <tr><td>APIs</td><td><code>pages/api/*.ts</code> (Node req/res)</td><td><code>app/**/route.ts</code> (Web <code>Request</code>/<code>Response</code>)</td></tr>
    <tr><td>Streaming</td><td>Limited</td><td>Built in via Suspense</td></tr>
  </tbody>
</table>

<h3>When NOT to choose Next.js</h3>
<ul>
  <li><strong>Pure backend / many non-web clients</strong> — a mobile app + partner API with no web UI is better served by NestJS/Express (<a href="#/topic/be-nestjs">NestJS (Advanced)</a>). Route handlers work, but you lose DI, guards, interceptors and the module system.</li>
  <li><strong>Long-running or stateful work</strong> — websockets, queues consumers, cron-heavy jobs. Serverless functions have execution limits; put that in a worker service (see <a href="#/topic/be-queues">queues</a>).</li>
  <li><strong>A fully client-side app behind login</strong> with no SEO needs (internal dashboard, heavy canvas) — a Vite SPA is simpler and has fewer caching surprises.</li>
  <li><strong>Team unfamiliar with server/client boundaries</strong> and a deadline — the mental-model cost is real.</li>
</ul>

<div class="callout note">
  <div class="callout-title">How this maps to an RN mental model</div>
  <p>Think of a Server Component as a screen whose data loader runs on your backend and ships pre-rendered UI; a Client Component is a normal RN-style component with hooks. The <code>'use client'</code> line is like a "native boundary": below it, the code ships to the device.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>The "folder = URL" picture</h3>
<div class="diagram">
<pre>
app/
├── layout.tsx                 ← root layout (html, body) — wraps EVERYTHING
├── page.tsx                   ← "/"
├── (marketing)/               ← route group: organises, NOT in the URL
│   └── pricing/page.tsx       ← "/pricing"
├── (app)/
│   ├── layout.tsx             ← authed shell (sidebar) for everything below
│   └── rooms/
│       ├── page.tsx           ← "/rooms"
│       ├── loading.tsx        ← Suspense fallback for this segment
│       ├── error.tsx          ← error boundary ('use client')
│       └── [roomId]/
│           ├── page.tsx       ← "/rooms/r_42"
│           └── actions.ts     ← 'use server' mutations (not a route)
├── api/
│   └── bookings/route.ts      ← GET/POST "/api/bookings" (no UI)
└── middleware.ts (at project root / src) ← runs BEFORE routing
</pre>
</div>
<p>Only <code>page.tsx</code> and <code>route.ts</code> make a segment publicly reachable. Other files (components, actions, utils) can be colocated safely.</p>

<h3>The "two worlds" picture</h3>
<div class="diagram">
<pre>
   SERVER (Node / Edge)                          BROWSER
 ┌───────────────────────────────┐     ┌──────────────────────────────┐
 │ Server Components              │     │ Client Components ('use client')│
 │  - async, await DB / fetch     │     │  - useState, useEffect, events │
 │  - secrets OK, zero bundle KB  │     │  - hydrated, shipped as JS     │
 │  - cannot use hooks/events     │     │  - cannot import server-only   │
 │                                │ RSC │                                │
 │  renders → RSC payload ────────┼────►│ React reconciles + hydrates    │
 │                                │     │                                │
 │ Server Actions ('use server') ◄┼─────┤ form action / startTransition  │
 │  - POST under the hood         │     │                                │
 └───────────────────────────────┘     └──────────────────────────────┘
 Props crossing the arrow must be SERIALISABLE (no functions, class instances;
 Dates/Maps/Sets are supported by the RSC protocol, but plain JSON is safest).
</pre>
</div>

<h3>The "four caches" picture</h3>
<div class="diagram">
<pre>
 request ─► [1 Request memoisation]  same fetch()/cache() call deduped within ONE render
          ─► [2 Data Cache]          fetch results persisted across requests/deploys (server)
          ─► [3 Full Route Cache]    rendered HTML + RSC payload of STATIC routes (build/ISR)
 browser ─► [4 Router Cache]         RSC payloads of visited segments, in memory (client)

 revalidatePath / revalidateTag ── purge 2 + 3 (and router cache when called from a Server Action)
 router.refresh()                ── re-fetch current route from server (purges client 4 only)
</pre>
</div>

<h3>Caching defaults across versions</h3>
<table>
  <thead><tr><th>Behaviour</th><th>Next 13.4 / 14</th><th>Next 15</th><th>Next 16</th></tr></thead>
  <tbody>
    <tr><td><code>fetch()</code> in Server Components</td><td>Cached (<code>force-cache</code>) by default</td><td><strong>Not cached</strong> by default; opt in with <code>cache: 'force-cache'</code> or <code>next: { revalidate }</code></td><td>Same as 15 under the old model; with Cache Components enabled you cache via <code>'use cache'</code> (verify against current docs)</td></tr>
    <tr><td>GET Route Handlers</td><td>Static (cached) by default if no dynamic API used</td><td><strong>Dynamic</strong> by default; opt in with <code>export const dynamic = 'force-static'</code></td><td>Verify against current docs</td></tr>
    <tr><td>Client Router Cache for pages</td><td>Dynamic pages reused ~30 s, static ~5 min</td><td>Page segments <code>staleTime</code> 0 by default (layouts still reused; configurable via <code>experimental.staleTimes</code>)</td><td>Verify against current docs</td></tr>
    <tr><td><code>cookies()</code>, <code>headers()</code>, <code>params</code>, <code>searchParams</code></td><td>Synchronous</td><td><strong>Async</strong> (await them); sync access deprecated with warnings</td><td>Async; sync compatibility removed (verify)</td></tr>
    <tr><td>Request interception file</td><td><code>middleware.ts</code></td><td><code>middleware.ts</code></td><td><code>proxy.ts</code> (middleware deprecated/renamed — verify current runtime support)</td></tr>
    <tr><td>Partial Prerendering</td><td>Experimental (14)</td><td>Experimental / incremental opt-in</td><td>Folded into Cache Components (verify)</td></tr>
  </tbody>
</table>
<div class="callout warn">
  <div class="callout-title">How to talk about this table</div>
  <p>The 13/14 → 15 flips (uncached fetch, async request APIs, router cache staleTime 0) are well documented in the Next 15 upgrade guide. Next 16 specifics change quickly — in an interview, describe the <em>concept</em> ("explicit opt-in caching with a directive, tag-based invalidation") and say you would check the docs for exact flags.</p>
</div>

<h3>The "request lifecycle" picture</h3>
<div class="diagram">
<pre>
GET /rooms/r_42
  │
  ├─ middleware/proxy (matcher hit?) → redirect / rewrite / set header / continue
  │
  ├─ route resolution: app/(app)/layout → rooms/[roomId]/page
  │
  ├─ static & cached?  ── yes → serve Full Route Cache (HTML + RSC payload)
  │                    └─ no  → render on demand
  │                              layouts + page render in parallel
  │                              awaiting data → Suspense fallback streamed first
  │
  └─ browser: HTML paints, JS hydrates client islands,
              later navigations fetch only the RSC payload for changed segments
</pre>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. Routing &amp; special files</h3>
<table>
  <thead><tr><th>File / folder</th><th>Purpose</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td><code>page.tsx</code></td><td>UI for a route; makes the segment public</td><td>Receives <code>params</code>, <code>searchParams</code> (Promises in 15+)</td></tr>
    <tr><td><code>layout.tsx</code></td><td>Shared shell; <strong>persists</strong> across child navigations</td><td>Does not re-render on child nav; cannot read <code>searchParams</code></td></tr>
    <tr><td><code>template.tsx</code></td><td>Like layout but <strong>remounts</strong> on navigation</td><td>For enter animations, per-page effects</td></tr>
    <tr><td><code>loading.tsx</code></td><td>Wraps the page in <code>&lt;Suspense&gt;</code></td><td>Instant feedback while the segment streams</td></tr>
    <tr><td><code>error.tsx</code></td><td>Error boundary for the segment</td><td>Must be a Client Component; gets <code>error</code> + <code>reset</code></td></tr>
    <tr><td><code>not-found.tsx</code></td><td>Rendered on <code>notFound()</code></td><td></td></tr>
    <tr><td><code>route.ts</code></td><td>HTTP endpoint (GET/POST/…)</td><td>Cannot coexist with <code>page.tsx</code> in the same segment</td></tr>
    <tr><td><code>[id]</code>, <code>[...slug]</code>, <code>[[...slug]]</code></td><td>Dynamic, catch-all, optional catch-all</td><td><code>generateStaticParams</code> pre-builds known values</td></tr>
    <tr><td><code>(group)</code></td><td>Route group — organise, separate layouts</td><td>Not part of the URL</td></tr>
    <tr><td><code>@slot</code></td><td>Parallel routes (render two pages in one layout)</td><td>Dashboards, modals</td></tr>
    <tr><td><code>(.)photo</code></td><td>Intercepting routes</td><td>"Open as modal, deep-link as page"</td></tr>
  </tbody>
</table>

<pre><code class="language-ts">// app/(app)/rooms/[roomId]/page.tsx  — Next 15+ signature
type Props = { params: Promise&lt;{ roomId: string }&gt; };

export default async function RoomPage({ params }: Props) {
  const { roomId } = await params;          // Promise in 15+, plain object in 13/14
  const room = await getRoom(roomId);
  if (!room) notFound();                    // from 'next/navigation'
  return &lt;RoomDetails room={room} /&gt;;
}

export async function generateMetadata({ params }: Props) {
  const { roomId } = await params;
  const room = await getRoom(roomId);        // deduped with the page's call via cache()
  return { title: room ? room.name + ' · Rooms' : 'Room not found' };
}</code></pre>

<h3>2. Server vs Client Components — the rules</h3>
<ul>
  <li>Default is Server. Add <code>'use client'</code> at the <strong>top of a file</strong> to mark it — and everything it imports — as client code. It is a <em>boundary</em>, not a per-component flag.</li>
  <li>A Server Component can render a Client Component and pass serialisable props.</li>
  <li>A Client Component <strong>cannot import</strong> a Server Component, but it can receive one as <code>children</code> or another prop ("donut" pattern). That is how a client-side modal can wrap server-rendered content.</li>
  <li>Put <code>import 'server-only'</code> at the top of modules holding secrets/DB access; importing them from client code becomes a build error.</li>
  <li>Push <code>'use client'</code> to the <strong>leaves</strong>: a <code>LikeButton</code>, not the whole page.</li>
</ul>
<table>
  <thead><tr><th>Need</th><th>Server Component</th><th>Client Component</th></tr></thead>
  <tbody>
    <tr><td>Query DB / use secrets</td><td>Yes</td><td>No</td></tr>
    <tr><td><code>useState</code>, <code>useEffect</code>, event handlers</td><td>No</td><td>Yes</td></tr>
    <tr><td>Browser APIs (localStorage, window)</td><td>No</td><td>Yes (in effects)</td></tr>
    <tr><td>Contributes to JS bundle</td><td>No</td><td>Yes</td></tr>
    <tr><td>Context providers</td><td>No (can render a client provider)</td><td>Yes</td></tr>
  </tbody>
</table>

<h3>3. Data fetching</h3>
<pre><code class="language-ts">// Sequential (waterfall) — second await waits for first
const room = await getRoom(id);
const bookings = await getBookings(id);

// Parallel — start both, then await
const [room, bookings] = await Promise.all([getRoom(id), getBookings(id)]);

// Streaming — render the shell now, stream slow parts later
return (
  &lt;&gt;
    &lt;RoomHeader room={room} /&gt;
    &lt;Suspense fallback={&lt;BookingsSkeleton /&gt;}&gt;
      &lt;BookingsList roomId={id} /&gt;   {/* async component awaits its own data */}
    &lt;/Suspense&gt;
  &lt;/&gt;
);</code></pre>
<p><strong>Deduping non-fetch calls:</strong> wrap DB helpers in React's <code>cache()</code> so <code>generateMetadata</code>, the layout and the page can all call <code>getRoom(id)</code> and hit the DB once per request. That is <em>per-request memoisation</em>, not a persistent cache.</p>
<pre><code class="language-ts">import 'server-only';
import { cache } from 'react';
import { db } from './db';

export const getRoom = cache(async (id: string) =&gt; {
  return db.room.findUnique({ where: { id } });
});</code></pre>

<h3>4. Caching &amp; revalidation (the model, version-tagged)</h3>
<table>
  <thead><tr><th>Tool</th><th>What it does</th><th>Version notes</th></tr></thead>
  <tbody>
    <tr><td><code>fetch(url, { cache: 'force-cache' })</code></td><td>Store result in the Data Cache</td><td>Default in 13/14; explicit opt-in in 15+</td></tr>
    <tr><td><code>fetch(url, { cache: 'no-store' })</code></td><td>Always fresh; makes route dynamic</td><td>Effectively the default in 15+</td></tr>
    <tr><td><code>fetch(url, { next: { revalidate: 60 } })</code></td><td>Time-based ISR for that fetch</td><td>All App Router versions</td></tr>
    <tr><td><code>fetch(url, { next: { tags: ['rooms'] } })</code></td><td>Tag the cached entry</td><td>Pairs with <code>revalidateTag('rooms')</code></td></tr>
    <tr><td><code>export const revalidate = 60</code></td><td>Segment-level default revalidate period</td><td>Route segment config</td></tr>
    <tr><td><code>export const dynamic = 'force-dynamic'</code></td><td>Never statically render this segment</td><td>Route segment config</td></tr>
    <tr><td><code>unstable_cache(fn, keys, { tags, revalidate })</code></td><td>Cache a non-fetch function (DB query) in the Data Cache</td><td>Still prefixed "unstable"; superseded by <code>'use cache'</code> in 16 (verify)</td></tr>
    <tr><td><code>revalidatePath('/rooms')</code></td><td>Purge cached data/route for a path</td><td>Call from Server Action or Route Handler</td></tr>
    <tr><td><code>revalidateTag('rooms')</code></td><td>Purge every entry with that tag</td><td>In 16 the signature gained a cache-life profile argument and <code>updateTag</code> was added for read-your-writes in actions — verify against current docs</td></tr>
    <tr><td><code>'use cache'</code> + <code>cacheLife</code> / <code>cacheTag</code></td><td>Directive-based caching of components/functions</td><td>Next 16 Cache Components (experimental in 15 canary) — verify flag name</td></tr>
  </tbody>
</table>
<p><strong>What makes a route dynamic</strong> (rendered per request rather than at build): reading <code>cookies()</code>, <code>headers()</code>, <code>searchParams</code>, uncached data, or <code>connection()</code>. A single dynamic read in a layout makes every child page dynamic — a classic "why is my whole app SSR now?" surprise.</p>

<h3>5. Server Actions</h3>
<p>A function marked <code>'use server'</code> (file-level or inline in a Server Component). Next generates an ID and a POST endpoint for it; the client calls it by ID. Arguments and return values are serialised.</p>
<ul>
  <li><strong>They are public HTTP endpoints.</strong> Anyone can POST to them. Always: authenticate, authorise, validate input (zod), rate-limit if expensive.</li>
  <li>Used as <code>&lt;form action={createBooking}&gt;</code> they work <strong>before hydration</strong> (progressive enhancement).</li>
  <li>Pair with React 19 <code>useActionState</code> (form state + pending) and <code>useFormStatus</code> (pending inside a submit button), or <code>useOptimistic</code> for instant UI.</li>
  <li>After mutating: <code>revalidatePath</code>/<code>revalidateTag</code> then optionally <code>redirect()</code>. <code>redirect</code> works by <strong>throwing</strong> — never call it inside a <code>try</code> whose <code>catch</code> swallows errors.</li>
  <li>Next has built-in protections (Origin vs Host check on action POSTs, encrypted closure variables, unguessable non-deterministic action IDs, dead-code elimination of unused actions). These are defence in depth, <em>not</em> authZ.</li>
  <li>Default body size limit for actions is small (1 MB at time of writing; configurable via <code>serverActions.bodySizeLimit</code>) — large uploads belong in a route handler or a presigned S3 URL.</li>
</ul>

<h3>6. Route Handlers</h3>
<pre><code class="language-ts">// app/api/bookings/route.ts — Web Request/Response API
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get('roomId');
  // ... auth via bearer token for mobile clients
  return NextResponse.json({ items: [] });
}

export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json({ id: 'b_1' }, { status: 201 });
}</code></pre>
<p>Use them for: mobile apps / third-party consumers, webhooks (Stripe, Slack — needs raw body for signature verification: <code>await req.text()</code>), file streaming, OAuth callbacks, anything that is not "my own React UI mutating my own data" (that is a Server Action).</p>

<h3>7. Middleware (Next 16: proxy)</h3>
<ul>
  <li>One file at the project root (or <code>src/</code>), runs <strong>before</strong> the cache and routing on every matched request.</li>
  <li>Historically Edge runtime only (no Node APIs, no native DB drivers); Node runtime support arrived later (stable in 15.5 per release notes; default in 16's proxy — verify against current docs).</li>
  <li>Good for: redirect unauthenticated users (cookie presence/JWT signature check), locale detection, A/B rewrites, security headers, bot blocking.</li>
  <li>Bad for: DB queries, heavy work, being your <em>only</em> auth check. In March 2025 CVE-2025-29927 showed a crafted <code>x-middleware-subrequest</code> header could skip middleware entirely on self-hosted apps — anyone relying solely on middleware for authZ was exposed.</li>
</ul>

<h3>8. Rendering modes</h3>
<table>
  <thead><tr><th>Mode</th><th>When it happens</th><th>Trigger in App Router</th><th>Good for</th></tr></thead>
  <tbody>
    <tr><td>Static (SSG)</td><td>Build time</td><td>No dynamic APIs, cached data</td><td>Marketing, docs</td></tr>
    <tr><td>ISR</td><td>Build + background regeneration</td><td><code>revalidate</code> or on-demand <code>revalidate*</code></td><td>Catalogues, blogs, listings</td></tr>
    <tr><td>Dynamic (SSR)</td><td>Every request</td><td>cookies/headers/searchParams/uncached data</td><td>Personalised dashboards</td></tr>
    <tr><td>Streaming</td><td>Per request, progressive</td><td><code>loading.tsx</code> / <code>&lt;Suspense&gt;</code></td><td>Pages with one slow widget</td></tr>
    <tr><td>Partial Prerendering</td><td>Static shell + dynamic holes</td><td>Experimental flag (14/15), Cache Components (16) — verify</td><td>E-commerce product page with personalised cart</td></tr>
    <tr><td>Client-only island</td><td>Browser</td><td><code>'use client'</code> + effects / <code>dynamic(..., { ssr: false })</code> from a client file</td><td>Charts, maps, editors</td></tr>
  </tbody>
</table>
<p><code>next build</code> prints a legend marking each route static or dynamic — the fastest way to check your assumptions.</p>

<h3>9. Images, fonts, metadata</h3>
<ul>
  <li><code>next/image</code> — lazy loads, serves resized/modern formats, requires <code>width</code>/<code>height</code> (or <code>fill</code>) to prevent CLS; remote hosts must be allow-listed in <code>images.remotePatterns</code>. Use <code>priority</code> (renamed <code>preload</code> in 16 — verify) for the LCP image. Self-hosted optimisation needs <code>sharp</code> and CPU.</li>
  <li><code>next/font/google</code> / <code>next/font/local</code> — downloads fonts at build, self-hosts them, sets <code>size-adjust</code> fallbacks → no layout shift, no request to Google at runtime.</li>
  <li><code>export const metadata</code> or <code>generateMetadata</code> for title/OG tags; <code>opengraph-image.tsx</code>, <code>sitemap.ts</code>, <code>robots.ts</code> as file conventions.</li>
</ul>

<h3>10. Auth patterns</h3>
<table>
  <thead><tr><th>Layer</th><th>Job</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td>Middleware / proxy</td><td>Optimistic: "is there a session cookie?" → redirect to /login</td><td>Cheap, no DB</td></tr>
    <tr><td>Data Access Layer (DAL)</td><td>Authoritative: verify session, load user, check permission — next to every query</td><td><code>verifySession()</code> wrapped in <code>cache()</code></td></tr>
    <tr><td>Server Action / Route Handler</td><td>Re-check authZ for the specific resource</td><td>"Can this user cancel <em>this</em> booking?"</td></tr>
    <tr><td>UI</td><td>Hide buttons the user cannot use</td><td>UX only, never security</td></tr>
  </tbody>
</table>
<p>Libraries: Auth.js (NextAuth), Clerk, Better Auth, Supabase Auth, Cognito via Amplify. Session strategy (stateless JWT cookie vs DB session) trade-offs are in <a href="#/topic/api-auth-rbac">Auth &amp; RBAC</a>.</p>

<h3>11. Deploy: Vercel vs self-host</h3>
<table>
  <thead><tr><th></th><th>Vercel</th><th>Self-host (Docker / ECS / k8s / EC2)</th></tr></thead>
  <tbody>
    <tr><td>Setup</td><td>git push → preview URL per PR</td><td><code>output: 'standalone'</code> + Dockerfile + CI (see <a href="#/topic/cloud-cicd">CI/CD</a>)</td></tr>
    <tr><td>ISR / Data Cache</td><td>Managed, shared across regions</td><td>Filesystem per instance by default → inconsistent across pods unless you configure a shared <code>cacheHandler</code> (e.g. Redis)</td></tr>
    <tr><td>Image optimisation</td><td>Managed (billed)</td><td>Runs on your CPU (sharp) or use a loader to a CDN</td></tr>
    <tr><td>Middleware</td><td>Runs at edge</td><td>Runs in the Node server process</td></tr>
    <tr><td>Cost model</td><td>Per-usage; can spike with traffic</td><td>Fixed infra; ops burden on you</td></tr>
    <tr><td>Compliance / data residency</td><td>Region choice, but vendor-hosted</td><td>Full control — often required by enterprise FDE customers</td></tr>
    <tr><td>Other hosts</td><td colspan="2">OpenNext adapters target AWS Lambda / Cloudflare; Amplify Hosting and Netlify support Next with varying feature coverage — check the host's support matrix.</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<p>One feature, end to end: a <strong>meeting-room booking</strong> console (the web sibling of a tablet booking app). Users see rooms, book a slot, cancel a booking; the tablet app reads availability over a route handler. Written for Next 15 semantics (async request APIs, uncached fetch by default). Prisma is used for brevity; any DB client works.</p>

<h3>Example 1 — file layout</h3>
<pre><code class="language-text">src/
├── middleware.ts                       (proxy.ts on Next 16)
├── lib/
│   ├── db.ts                           Prisma client singleton
│   ├── session.ts                      encrypt/decrypt cookie session
│   └── dal.ts                          'server-only' data access + authZ
└── app/
    ├── layout.tsx
    ├── login/page.tsx
    ├── (app)/
    │   ├── layout.tsx                  authed shell
    │   └── rooms/
    │       ├── page.tsx                list rooms (Server Component)
    │       ├── loading.tsx
    │       ├── error.tsx
    │       └── [roomId]/
    │           ├── page.tsx            room + bookings (streamed)
    │           ├── actions.ts          createBooking / cancelBooking
    │           ├── BookingForm.tsx     'use client'
    │           └── BookingList.tsx     server + client cancel button
    └── api/
        ├── rooms/[roomId]/availability/route.ts   for tablets (bearer token)
        └── webhooks/calendar/route.ts             signature-verified webhook</code></pre>

<h3>Example 2 — Data Access Layer with auth next to the data</h3>
<pre><code class="language-ts">// src/lib/dal.ts
import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './db';
import { decrypt } from './session';

export const verifySession = cache(async () =&gt; {
  const token = (await cookies()).get('session')?.value;   // await: Next 15+
  const session = token ? await decrypt(token) : null;
  if (!session?.userId) redirect('/login');
  return { userId: session.userId as string, role: session.role as 'member' | 'admin' };
});

export const listRooms = cache(async () =&gt; {
  await verifySession();
  return db.room.findMany({
    select: { id: true, name: true, capacity: true },      // never ship whole rows to the client
    orderBy: { name: 'asc' },
  });
});

export const getRoomWithBookings = cache(async (roomId: string) =&gt; {
  await verifySession();
  return db.room.findUnique({
    where: { id: roomId },
    select: {
      id: true, name: true, capacity: true,
      bookings: {
        where: { endsAt: { gt: new Date() }, status: 'CONFIRMED' },
        select: { id: true, title: true, startsAt: true, endsAt: true, ownerId: true },
        orderBy: { startsAt: 'asc' },
      },
    },
  });
});</code></pre>

<h3>Example 3 — authed layout</h3>
<pre><code class="language-ts">// app/(app)/layout.tsx
import { verifySession } from '@/lib/dal';
import { Sidebar } from './Sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { role } = await verifySession();   // makes this subtree dynamic (reads cookies)
  return (
    &lt;div className="shell"&gt;
      &lt;Sidebar showAdmin={role === 'admin'} /&gt;
      &lt;main&gt;{children}&lt;/main&gt;
    &lt;/div&gt;
  );
}</code></pre>
<div class="callout warn">
  <div class="callout-title">Layouts are not a security boundary</div>
  <p>Layouts don't re-render on client navigation between sibling pages, and a page's data request can be made without the layout's check having run in the same render. Keep <code>verifySession()</code> in the DAL functions the pages call, not only in the layout.</p>
</div>

<h3>Example 4 — room page with streaming</h3>
<pre><code class="language-ts">// app/(app)/rooms/[roomId]/page.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getRoomWithBookings } from '@/lib/dal';
import { BookingForm } from './BookingForm';
import { BookingList } from './BookingList';
import { Utilisation } from './Utilisation';

export default async function RoomPage({ params }: { params: Promise&lt;{ roomId: string }&gt; }) {
  const { roomId } = await params;
  const room = await getRoomWithBookings(roomId);
  if (!room) notFound();

  return (
    &lt;section&gt;
      &lt;h1&gt;{room.name} (seats {room.capacity})&lt;/h1&gt;
      &lt;BookingForm roomId={room.id} /&gt;
      &lt;BookingList bookings={room.bookings} /&gt;
      &lt;Suspense fallback={&lt;p&gt;Loading utilisation…&lt;/p&gt;}&gt;
        &lt;Utilisation roomId={room.id} /&gt;   {/* slow analytics query streams in later */}
      &lt;/Suspense&gt;
    &lt;/section&gt;
  );
}</code></pre>

<h3>Example 5 — Server Actions: create &amp; cancel</h3>
<pre><code class="language-ts">// app/(app)/rooms/[roomId]/actions.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/dal';

const CreateBooking = z.object({
  roomId: z.string().min(1),
  title: z.string().trim().min(1).max(120),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
}).refine((v) =&gt; v.endsAt &gt; v.startsAt, { message: 'End must be after start', path: ['endsAt'] });

export type FormState = { ok: boolean; message?: string; fieldErrors?: Record&lt;string, string[]&gt; };

export async function createBooking(_prev: FormState, formData: FormData): Promise&lt;FormState&gt; {
  const { userId } = await verifySession();                 // 1. authN
  const parsed = CreateBooking.safeParse(Object.fromEntries(formData));   // 2. validate
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { roomId, title, startsAt, endsAt } = parsed.data;

  try {
    await db.$transaction(async (tx) =&gt; {                  // 3. business rule + write
      const clash = await tx.booking.findFirst({
        where: { roomId, status: 'CONFIRMED', startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
        select: { id: true },
      });
      if (clash) throw new Error('SLOT_TAKEN');
      await tx.booking.create({ data: { roomId, title, startsAt, endsAt, ownerId: userId, status: 'CONFIRMED' } });
    });
  } catch (e) {
    if (e instanceof Error &amp;&amp; e.message === 'SLOT_TAKEN') return { ok: false, message: 'That slot was just taken.' };
    throw e;                                                // unexpected → error.tsx
  }

  revalidatePath('/rooms/' + roomId);                      // 4. tell caches
  return { ok: true, message: 'Booked.' };
}

export async function cancelBooking(bookingId: string) {
  const { userId, role } = await verifySession();
  const booking = await db.booking.findUnique({ where: { id: bookingId }, select: { ownerId: true, roomId: true } });
  if (!booking) return { ok: false, message: 'Not found' };
  if (booking.ownerId !== userId &amp;&amp; role !== 'admin') {    // 5. resource-level authZ
    return { ok: false, message: 'Forbidden' };
  }
  await db.booking.update({ where: { id: bookingId }, data: { status: 'CANCELLED' } });
  revalidatePath('/rooms/' + booking.roomId);
  return { ok: true };
}</code></pre>
<p>Note the find-then-insert clash check inside a transaction is still racy under READ COMMITTED; the robust fix is a DB constraint (Postgres exclusion constraint on a time range) — see the edge cases.</p>

<h3>Example 6 — client form with <code>useActionState</code></h3>
<pre><code class="language-ts">// app/(app)/rooms/[roomId]/BookingForm.tsx
'use client';

import { useActionState } from 'react';           // React 19 (was useFormState in react-dom canary)
import { useFormStatus } from 'react-dom';
import { createBooking, type FormState } from './actions';

function Submit() {
  const { pending } = useFormStatus();            // must be inside the &lt;form&gt;
  return &lt;button disabled={pending}&gt;{pending ? 'Booking…' : 'Book'}&lt;/button&gt;;
}

export function BookingForm({ roomId }: { roomId: string }) {
  const [state, formAction] = useActionState&lt;FormState, FormData&gt;(createBooking, { ok: false });
  return (
    &lt;form action={formAction}&gt;
      &lt;input type="hidden" name="roomId" value={roomId} /&gt;
      &lt;input name="title" placeholder="Stand-up" required /&gt;
      &lt;input name="startsAt" type="datetime-local" required /&gt;
      &lt;input name="endsAt" type="datetime-local" required /&gt;
      {state.fieldErrors?.endsAt &amp;&amp; &lt;p role="alert"&gt;{state.fieldErrors.endsAt[0]}&lt;/p&gt;}
      {state.message &amp;&amp; &lt;p role="status"&gt;{state.message}&lt;/p&gt;}
      &lt;Submit /&gt;
    &lt;/form&gt;
  );
}</code></pre>
<p>The hidden <code>roomId</code> is user-controlled input — the action must still validate it and (if rooms are tenant-scoped) check the user may book that room.</p>

<h3>Example 7 — optimistic cancel</h3>
<pre><code class="language-ts">// app/(app)/rooms/[roomId]/BookingList.tsx
'use client';

import { useOptimistic, useTransition } from 'react';
import { cancelBooking } from './actions';

type Booking = { id: string; title: string; startsAt: Date; endsAt: Date };

export function BookingList({ bookings }: { bookings: Booking[] }) {
  const [optimistic, removeOptimistic] = useOptimistic(
    bookings,
    (current, removedId: string) =&gt; current.filter((b) =&gt; b.id !== removedId),
  );
  const [isPending, startTransition] = useTransition();

  return (
    &lt;ul aria-busy={isPending}&gt;
      {optimistic.map((b) =&gt; (
        &lt;li key={b.id}&gt;
          {b.title} · {b.startsAt.toLocaleTimeString()}
          &lt;button onClick={() =&gt; startTransition(async () =&gt; {
            removeOptimistic(b.id);
            const res = await cancelBooking(b.id);
            if (!res.ok) alert(res.message);              // revalidation restores the row
          })}&gt;Cancel&lt;/button&gt;
        &lt;/li&gt;
      ))}
    &lt;/ul&gt;
  );
}</code></pre>
<p>Date objects survive the RSC boundary, but <code>toLocaleTimeString()</code> on server vs browser can differ (timezone) → hydration mismatch. Format with an explicit <code>timeZone</code>, or format on the server and pass a string.</p>

<h3>Example 8 — route handler for the tablet app</h3>
<pre><code class="language-ts">// app/api/rooms/[roomId]/availability/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyDeviceToken } from '@/lib/device-auth';

export async function GET(req: NextRequest, ctx: { params: Promise&lt;{ roomId: string }&gt; }) {
  const device = await verifyDeviceToken(req.headers.get('authorization'));
  if (!device) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { roomId } = await ctx.params;
  if (device.roomId !== roomId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const now = new Date();
  const bookings = await db.booking.findMany({
    where: { roomId, status: 'CONFIRMED', endsAt: { gt: now } },
    select: { id: true, title: true, startsAt: true, endsAt: true },
    orderBy: { startsAt: 'asc' },
    take: 20,
  });
  return NextResponse.json(
    { roomId, generatedAt: now.toISOString(), bookings },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}</code></pre>
<p>Route handlers are the right surface for non-React clients: explicit status codes, explicit auth scheme (bearer, not cookies), stable JSON contract you can version (<a href="#/topic/api-versioning">API versioning</a>).</p>

<h3>Example 9 — webhook with tag revalidation</h3>
<pre><code class="language-ts">// app/api/webhooks/calendar/route.ts
import { revalidateTag } from 'next/cache';
import { verifySignature } from '@/lib/webhooks';

export async function POST(req: Request) {
  const raw = await req.text();                                   // raw body for HMAC
  if (!verifySignature(raw, req.headers.get('x-signature'))) {
    return new Response('bad signature', { status: 401 });
  }
  const event = JSON.parse(raw) as { type: string; roomId: string };
  // ... upsert external booking idempotently by event id
  revalidateTag('room:' + event.roomId);   // Next 16 may require a second profile arg — verify
  return new Response(null, { status: 204 });
}</code></pre>

<h3>Example 10 — middleware for optimistic gating</h3>
<pre><code class="language-ts">// src/middleware.ts   (Next 16: proxy.ts exporting a function named proxy — verify)
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC = ['/login', '/api/webhooks'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) =&gt; pathname.startsWith(p))) return NextResponse.next();

  const hasSession = req.cookies.has('session');      // presence only — no DB here
  if (!hasSession &amp;&amp; !pathname.startsWith('/api/')) {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  const res = NextResponse.next();
  res.headers.set('X-Frame-Options', 'DENY');
  return res;
}

export const config = {
  // skip static assets and image optimiser
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};</code></pre>

<h3>Example 11 — error boundary and loading</h3>
<pre><code class="language-ts">// app/(app)/rooms/error.tsx
'use client';
export default function Error({ error, reset }: { error: Error &amp; { digest?: string }; reset: () =&gt; void }) {
  return (
    &lt;div role="alert"&gt;
      &lt;p&gt;Something went wrong. Ref: {error.digest}&lt;/p&gt;   {/* digest maps to server logs */}
      &lt;button onClick={reset}&gt;Try again&lt;/button&gt;
    &lt;/div&gt;
  );
}

// app/(app)/rooms/loading.tsx
export default function Loading() {
  return &lt;p&gt;Loading rooms…&lt;/p&gt;;
}</code></pre>
<p>In production, server error messages are redacted to the client — only the <code>digest</code> is sent. Log it server-side so support can correlate.</p>

<h3>Example 12 — self-host with Docker</h3>
<pre><code class="language-text"># next.config.ts →  const config = { output: 'standalone' }; export default config;

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER node
CMD ["node", "server.js"]</code></pre>
<p>Remember: <code>NEXT_PUBLIC_*</code> vars are inlined at <em>build</em> time, so one image cannot serve UAT and PROD with different public values unless you read config at runtime on the server. For multiple replicas, configure a shared cache handler or accept per-pod ISR staleness.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. <code>redirect()</code> / <code>notFound()</code> inside try/catch</h3>
<p>Both work by throwing a special error. A blanket <code>catch (e) { return { error } }</code> swallows it and the redirect never happens. Call them <em>after</em> the try block, or rethrow (Next exposes <code>unstable_rethrow</code> for this — verify availability in your version).</p>

<h3>2. One dynamic read poisons the subtree</h3>
<p>Reading <code>cookies()</code> in the root layout makes every route dynamic, losing static/ISR. Move personalised bits into a small component under <code>&lt;Suspense&gt;</code> (and, with PPR/Cache Components, they become dynamic holes in a static shell).</p>

<h3>3. Stale UI after a mutation</h3>
<p>Forgetting <code>revalidatePath</code>/<code>revalidateTag</code> → the server cache serves the old version. Revalidating the wrong path is just as common: <code>revalidatePath('/rooms/[roomId]', 'page')</code> (literal dynamic segment + type) invalidates all room pages; <code>revalidatePath('/rooms/r_42')</code> only that one. Mutations from a <em>route handler</em> don't refresh the user's client router cache — the client needs <code>router.refresh()</code>.</p>

<h3>4. Upgrading 14 → 15 changes behaviour silently</h3>
<p>Pages relying on implicit fetch caching become dynamic and slower (or hit rate limits on third-party APIs). Audit with <code>next build</code> output and add explicit <code>cache</code>/<code>revalidate</code>. The official codemod (<code>npx @next/codemod</code>) handles async request APIs but not caching intent.</p>

<h3>5. Self-hosted multi-instance ISR</h3>
<p>Three pods each keep their own filesystem cache; <code>revalidateTag</code> on pod A doesn't purge pods B and C → users see different versions per request. Fix: a shared <code>cacheHandler</code> (Redis), or <code>no-store</code> for data that must be consistent.</p>

<h3>6. Serialisation across the boundary</h3>
<p>Passing a function, a class instance (Prisma Decimal, Mongo ObjectId), or a huge object to a Client Component fails or bloats the RSC payload. Map to plain DTOs. Passing a full user row also <strong>leaks fields</strong> (password hash, internal flags) into the HTML.</p>

<h3>7. Server Action closures</h3>
<p>Inline actions can close over server variables; Next encrypts these in the payload, but the values still round-trip through the client. Don't close over secrets; pass IDs and re-fetch.</p>

<h3>8. Double booking under concurrency</h3>
<p>Two users submit the same slot simultaneously; both "find no clash" and both insert. Enforce at the DB (Postgres <code>EXCLUDE USING gist (room_id WITH =, tstzrange(starts_at, ends_at) WITH &amp;&amp;)</code>, or a unique slot table in MySQL) and map the constraint error to a friendly message.</p>

<h3>9. Edge runtime limits</h3>
<p>Edge has no <code>fs</code>, no native modules, limited Node APIs; many DB drivers fail there. If a route or middleware needs the DB, use the Node runtime (<code>export const runtime = 'nodejs'</code> for route segments).</p>

<h3>10. Build-time DB access</h3>
<p>Static pages and <code>generateStaticParams</code> run during <code>next build</code>. If CI has no DB network access, the build fails — or worse, bakes empty data. Make those routes dynamic or provide a build-time data source.</p>

<h3>11. Hydration mismatch</h3>
<p>Dates, <code>Math.random()</code>, <code>window</code> checks, browser extensions mutating DOM. Covered in depth in <a href="#/topic/react-ssr">SSR, SSG, ISR &amp; RSC</a>; in Next, isolate with a client component that renders after mount, or <code>suppressHydrationWarning</code> on a single element (timestamps only).</p>

<h3>12. Large uploads via Server Actions</h3>
<p>Hit the body size limit and keep a function busy streaming bytes. Use a presigned S3 URL (client uploads directly) and send only the key to the action.</p>

<h3>13. <code>searchParams</code> in layouts</h3>
<p>Layouts don't receive <code>searchParams</code> (they don't re-render on query change). Read them in the page, or in a client component with <code>useSearchParams</code> (which needs a <code>&lt;Suspense&gt;</code> boundary for static rendering).</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>1. <code>'use client'</code> at the top of every page</h3>
<p>Throws away RSC: everything hydrates, data fetching moves back to effects, secrets risk leaking. Keep pages server; push client to leaf widgets.</p>

<h3>2. Middleware as the only auth check</h3>
<pre><code class="language-ts">// ❌ middleware decides everything; actions/pages trust it
export async function cancelBooking(id: string) {
  await db.booking.delete({ where: { id } });   // anyone who can POST can delete anything
}
// ✅ authN + resource authZ inside the action / DAL
export async function cancelBooking(id: string) {
  const { userId, role } = await verifySession();
  const b = await db.booking.findUnique({ where: { id }, select: { ownerId: true } });
  if (!b || (b.ownerId !== userId &amp;&amp; role !== 'admin')) throw new Error('Forbidden');
  await db.booking.update({ where: { id }, data: { status: 'CANCELLED' } });
}</code></pre>

<h3>3. Calling your own Route Handler from a Server Component</h3>
<pre><code class="language-ts">// ❌ extra HTTP hop, needs absolute URL, loses cookies, fails at build time
const res = await fetch('http://localhost:3000/api/rooms');
// ✅ call the function the route handler calls
const rooms = await listRooms();</code></pre>

<h3>4. Fetching in <code>useEffect</code> in App Router by default</h3>
<p>Re-creates the SPA waterfall (HTML → JS → fetch → render). Fetch in the Server Component; use client fetching (SWR/React Query) only for polling, infinite scroll, or client-driven filters.</p>

<h3>5. Trusting Server Action arguments</h3>
<p>TypeScript types are erased at runtime. <code>createBooking(input: Booking)</code> can be called with anything. Validate with zod on every action.</p>

<h3>6. Returning full DB rows to Client Components</h3>
<p>Everything passed as a prop is serialised into the page. Use <code>select</code> and DTOs. Consider React's <code>experimental_taintObjectReference</code> to block sensitive objects (experimental — verify).</p>

<h3>7. Over-revalidating</h3>
<p><code>revalidatePath('/', 'layout')</code> after every mutation purges the entire site cache → cache hit rate collapses, DB load spikes. Use tags scoped to the entity (<code>room:r_42</code>).</p>

<h3>8. Request waterfalls in nested layouts</h3>
<p>Layout awaits user, page awaits org, child awaits rooms — sequential. Start independent promises early (<code>Promise.all</code>), or pass promises down and <code>use()</code> them, and dedupe with <code>cache()</code>.</p>

<h3>9. Using <code>NEXT_PUBLIC_</code> for secrets</h3>
<p>Anything prefixed <code>NEXT_PUBLIC_</code> is inlined into client JS. API keys belong in server-only env vars accessed from server code.</p>

<h3>10. Ignoring the build legend</h3>
<p>Shipping without checking which routes are static vs dynamic. A "static" dashboard showing user A's data to user B (cached personalised page) is a real incident class — usually from reading auth from a client-side store while the server page is cached.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. What's the difference between a Server Component and a Client Component in Next.js?</div>
  <div class="qa-answer">
    <p>Server Components render only on the server: they can be <code>async</code>, read the DB and secrets, and ship zero JS — the client gets their output in the RSC payload. Client Components (<code>'use client'</code>) are pre-rendered to HTML on the server too, but then hydrate in the browser and can use state, effects and events. The directive marks a module boundary: everything imported below it is client code. I default to server and push client to the leaves.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Walk me through building "create booking" end to end.</div>
  <div class="qa-answer">
    <p>Page is a Server Component that calls a DAL function (<code>server-only</code>, wrapped in <code>cache()</code>, with <code>verifySession()</code> inside). The form is a small Client Component using <code>useActionState</code> bound to a <code>'use server'</code> action. The action: authenticate, validate with zod, check resource permission, write in a transaction (with a DB constraint for clashes), <code>revalidatePath</code>/<code>revalidateTag</code>, return a typed result or <code>redirect</code>. Tablets get a separate route handler with bearer auth. Middleware only redirects users without a session cookie.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Explain Next.js caching. What changed in Next 15?</div>
  <div class="qa-answer">
    <p>Four layers: request memoisation (dedupe within a render), Data Cache (persisted fetch results), Full Route Cache (static HTML + RSC payload), and the client Router Cache. In 13/14 <code>fetch</code> was cached by default and GET route handlers were static by default, which surprised many teams. Next 15 made fetch and GET handlers uncached by default, set the router cache staleTime for pages to 0, and made <code>cookies</code>/<code>headers</code>/<code>params</code> async. Next 16 moves toward explicit directive-based caching (<code>'use cache'</code>, <code>cacheLife</code>, <code>cacheTag</code>) — I'd confirm the exact flags against current docs.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Server Action or Route Handler — how do you choose?</div>
  <div class="qa-answer">
    <p>Server Action when my own React UI mutates my own data: progressive enhancement, no client fetch code, integrates with revalidation and the router. Route Handler when the caller isn't my React tree — a mobile app, a partner, a webhook, a cron — or when I need explicit HTTP semantics (status codes, raw body, streaming, CORS, versioned contract). Actions are POST-only and their IDs are build-specific, so they're not a public API.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Are Server Actions secure by default?</div>
  <div class="qa-answer">
    <p>No — they're HTTP endpoints anyone can call with any arguments. Next adds defence in depth (Origin check, encrypted closures, unguessable IDs, unused-action elimination), but authN, authZ, input validation and rate limiting are on me. I treat each action exactly like an Express POST handler.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Where should authentication live in a Next app?</div>
  <div class="qa-answer">
    <p>Layered. Middleware/proxy does optimistic checks (cookie present → otherwise redirect) because it runs on every request and must stay cheap. The authoritative check lives in a Data Access Layer next to the queries and is repeated in actions and route handlers with resource-level authZ. CVE-2025-29927 (middleware bypass via an internal header) is the concrete reason not to rely on middleware alone. Layouts aren't a boundary either — they don't re-run on every navigation.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. A page you expected to be static is rendering on every request. How do you debug?</div>
  <div class="qa-answer">
    <p>Check the <code>next build</code> route legend. Then look for dynamic triggers in that route <em>and its layouts</em>: <code>cookies()</code>, <code>headers()</code>, <code>searchParams</code>, uncached fetches (default in 15+), <code>dynamic = 'force-dynamic'</code>. Usually a root layout reads the session. Fix by isolating the personalised part under Suspense, or adding explicit caching to the fetches, or setting <code>revalidate</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How do you avoid waterfalls in the App Router?</div>
  <div class="qa-answer">
    <p>Kick off independent requests together with <code>Promise.all</code>; wrap slow, non-critical parts in <code>&lt;Suspense&gt;</code> so they stream; dedupe shared lookups with <code>cache()</code> so layout + page + metadata don't refetch; optionally pass a promise from a server parent to a client child and unwrap with <code>use()</code>. And avoid server → own API route → DB hops.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Vercel or self-host for an enterprise customer?</div>
  <div class="qa-answer">
    <p>Vercel if speed of delivery matters and data residency/compliance allow it: managed ISR, preview deploys, image optimisation. Self-host (standalone Docker on ECS/k8s) when the customer needs VPC isolation, existing AWS accounts, or fixed costs. Self-hosting costs: shared cache handler for ISR across replicas, image optimisation CPU, build-time <code>NEXT_PUBLIC_</code> config per environment, and you own patching (e.g. the middleware CVE fix was a version bump).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. FDE scenario: "After an admin edits a room, half our users still see the old name for minutes." What do you do?</div>
  <div class="qa-answer">
    <p>Reproduce and identify which cache. Questions: which Next version, Vercel or self-hosted, how many replicas? Checks: does the edit action call <code>revalidateTag</code>/<code>revalidatePath</code> for the right entity? Is the edit made via a route handler from another system (then the user's router cache isn't refreshed)? Is there a CDN in front with its own TTL? "Half the users" strongly suggests multiple self-hosted pods each with a local filesystem cache — <code>revalidate</code> only purged one. Fix: shared cache handler (Redis) or make that data uncached; short-term mitigation: lower <code>revalidate</code>. Then add a test/monitor that edits and reads back.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. FDE scenario: the customer's dashboard is slow (TTFB 3 s). Walk me through it.</div>
  <div class="qa-answer">
    <p>Measure first: server timing per data call, build legend (dynamic?), region of the function vs the DB (a function in us-east hitting a DB in Mumbai adds ~200 ms per round-trip, multiplied by sequential awaits). Common fixes: parallelise awaits, move the function region next to the DB, stream slow widgets behind Suspense so TTFB is just the shell, cache stable reference data with tags, add DB indexes, and avoid N+1 queries in nested components (batch with a loader or a single query).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Senior probe: what are the costs of the App Router model?</div>
  <div class="qa-answer">
    <p>Mental-model complexity (two component types, serialisation rules), caching behaviour that changed across majors, tight coupling to Next/Vercel conventions, harder testing of async Server Components (unit-test the DAL and actions; cover pages with E2E — see <a href="#/topic/test-e2e">E2E testing</a>), and ecosystem libraries that assume client-only React. Benefits: less client JS, colocated data and UI, progressive enhancement, one deploy. I'd pick it for content- and form-heavy full-stack apps, not for a pure API or a canvas-heavy SPA.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Sketch the app/ tree for a feature with an authed layout, a dynamic segment, loading and error UI, and an API route.</div>
  <div class="qa-answer">
    <p>Folders are URL segments, and only <code>page.tsx</code> or <code>route.ts</code> makes a segment public. A route group <code>(app)</code> holds the authed shell without adding to the URL; <code>[roomId]</code> is the dynamic segment (its <code>params</code> is a Promise in Next 15+); <code>loading.tsx</code> wraps the page in Suspense; <code>error.tsx</code> is the segment's error boundary and must be a Client Component; API endpoints live under <code>app/api/.../route.ts</code>, which can't coexist with a <code>page.tsx</code> in the same segment.</p>
    <pre><code class="language-text">app/
├── layout.tsx
├── login/page.tsx
├── (app)/
│   ├── layout.tsx              authed shell
│   └── rooms/
│       ├── page.tsx            list (Server Component)
│       ├── loading.tsx
│       ├── error.tsx           'use client'
│       └── [roomId]/
│           ├── page.tsx
│           ├── actions.ts      'use server'
│           └── BookingForm.tsx 'use client'
└── api/rooms/[roomId]/availability/route.ts</code></pre>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q14. Where does 'use client' go, and how can a Client Component still render server content?</div>
  <div class="qa-answer">
    <p><code>'use client'</code> goes at the top of a file and marks a module boundary: that file and everything it imports become client code shipped in the bundle. It isn't a per-component flag, so push it to the leaves (a <code>LikeButton</code>, not the whole page). A Client Component cannot import a Server Component, but it can receive one as <code>children</code> or another prop (the "donut" pattern), because the server renders that content and passes the result through. That is how a client-side modal or provider wraps server-rendered content. Props crossing the boundary must be serialisable.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q15. Write a Server Action that authenticates, validates, enforces ownership, writes and revalidates. Why must redirect not sit inside try/catch?</div>
  <div class="qa-answer">
    <p>Treat it like a public POST handler: (1) <code>verifySession()</code> for authN, (2) <code>safeParse</code> the input with zod and return field errors, (3) load the resource and check ownership/role for authZ, (4) write (in a transaction, ideally backed by a DB constraint), (5) <code>revalidatePath</code>/<code>revalidateTag</code> so caches see the change. <code>redirect()</code> and <code>notFound()</code> work by throwing a special error, so a blanket <code>catch (e) { return { error } }</code> swallows it and the redirect never happens; call them after the try block, or rethrow.</p>
    <pre><code class="language-ts">'use server';
export async function cancelBooking(bookingId: string) {
  const { userId, role } = await verifySession();
  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { ok: false, message: 'Not found' };
  if (booking.ownerId !== userId &amp;&amp; role !== 'admin') return { ok: false, message: 'Forbidden' };
  await db.booking.update({ where: { id: bookingId }, data: { status: 'CANCELLED' } });
  revalidatePath('/rooms/' + booking.roomId);
  return { ok: true };
}</code></pre>
  </div>
</div>
` },

  ]
});
