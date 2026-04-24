window.PREP_SITE.registerTopic({
  id: 'react-ssr',
  module: 'React Deep',
  title: 'SSR / SSG / ISR / RSC',
  estimatedReadTime: '30 min',
  tags: ['react', 'ssr', 'ssg', 'isr', 'rsc', 'server-components', 'hydration', 'streaming', 'nextjs', 'remix'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>React renders can happen in three places: the <strong>client</strong> (CSR), the <strong>server at request time</strong> (SSR), or <strong>build time</strong> (SSG). Modern frameworks (Next.js, Remix) mix all three per route. React 18 added <strong>streaming SSR</strong> and <strong>React Server Components</strong> (RSC) that further blur the line.</p>
<ul>
  <li><strong>CSR</strong> — browser downloads JS, JS renders into an empty root. Fast to deploy, slow first paint, bad SEO unless you add prerender.</li>
  <li><strong>SSR</strong> — server renders HTML per request, client <em>hydrates</em> (attaches event handlers) to make it interactive. Fast first paint, fresh data, but heavier server cost.</li>
  <li><strong>SSG</strong> — pages pre-rendered to static HTML at build time. Fastest to serve (CDN), but content is frozen until the next build.</li>
  <li><strong>ISR (Incremental Static Regeneration)</strong> — Next.js hybrid: serve a cached static HTML, regenerate on a schedule or on demand in the background. Best of SSG speed + SSR freshness for most content.</li>
  <li><strong>RSC (React Server Components)</strong> — a new component type that runs only on the server, can read the DB directly, sends a serialized tree (not HTML) to the client. Client components (usual) are the interactive parts. Radically reduces client-bundle size.</li>
  <li><strong>Streaming SSR + Suspense</strong> — server flushes the shell immediately, streams slow regions when their data arrives. Selective hydration lets interactive parts come alive progressively.</li>
  <li><strong>Hydration</strong> is the "attach JS to existing DOM" step. If server HTML doesn't match client render, you get a hydration mismatch error.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Pick by data freshness need: static → SSG; personalized → SSR; mostly static with periodic updates → ISR. React 18/19 with RSC + streaming lets you mix all of these within a single page.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Client-side rendering (CSR)</h3>
<p>The default React experience before SSR became common. The server sends a nearly-empty HTML shell (<code>&lt;div id="root"/&gt;</code>) plus JS. JS executes, renders into the root. User sees spinner → content. Pros: simple, single backend, any CDN works. Cons: blank screen until JS loads (bad LCP), bad SEO for crawlers that don't execute JS, no content for users with JS disabled.</p>

<h3>Server-side rendering (SSR)</h3>
<p>On every request, a Node server calls <code>renderToString</code> / <code>renderToPipeableStream</code> with your App, producing HTML. The HTML includes real content. Browser paints immediately. Once JS loads, React <em>hydrates</em> — attaches event listeners to existing DOM, making it interactive. Pros: fast first paint, SEO-friendly, personalizable (per-user HTML). Cons: every request costs CPU, server scaling, hydration cost on client, potential hydration mismatches.</p>

<h3>Static site generation (SSG)</h3>
<p>At build time, run your React components with their data and emit HTML files for every route. Deploy to a CDN. Every user gets the cached HTML — no server render per request. Pros: fastest serve, trivial to scale, no backend needed at runtime. Cons: content frozen between builds; not suitable for per-user or fast-changing data.</p>

<h3>Incremental Static Regeneration (ISR)</h3>
<p>Next.js's hybrid. A page is served from cache (like SSG). If a request arrives and the cache entry is older than the revalidate interval, Next serves the stale HTML but triggers a regeneration in the background. The next request gets the fresh version. Also supports on-demand revalidation via webhooks. Perfect for CMS-driven content: near-static speed, near-realtime freshness.</p>

<h3>React Server Components (RSC)</h3>
<p>A new capability where components are marked "server" and run <strong>only on the server</strong>. They can directly <code>await</code> database queries, read filesystem, call services — no fetch, no state, no effects. The result is <em>not HTML</em> but a serialized tree of components with embedded client-component references. The client receives this payload, renders client components, and merges them into the overall tree.</p>
<p>Benefits:</p>
<ul>
  <li><strong>Zero client JS for server components</strong> — they don't ship to the browser at all. A big markdown renderer, a DB query helper, an SDK — none bloat the bundle.</li>
  <li><strong>Direct data access</strong> — no REST layer between RSC and the database for server-only needs.</li>
  <li><strong>Preserves client interactivity</strong> — "use client" directive marks boundaries where client components take over.</li>
  <li><strong>Works with streaming</strong> — RSC payloads stream progressively.</li>
</ul>

<h3>Streaming SSR</h3>
<p>Traditional SSR (<code>renderToString</code>) waits for the ENTIRE tree before sending any bytes. Slow queries block the whole page. Streaming SSR (<code>renderToPipeableStream</code>, <code>renderToReadableStream</code>) flushes the shell immediately, then streams Suspense boundary contents as data arrives. Requires <code>&lt;Suspense&gt;</code> boundaries to partition the tree.</p>

<h3>Hydration</h3>
<p>When the browser receives server-rendered HTML and the JS bundle loads, React walks the DOM and the component tree in parallel, attaching event listeners and state to existing DOM nodes instead of re-creating them. Hydration runs every component function (costing about as much as CSR does), but skips DOM operations. Gotcha: server HTML must match client render output, or you get a hydration warning/error.</p>

<h3>Selective hydration</h3>
<p>React 18 can prioritize hydration of parts the user interacts with. Clicking a button in an un-hydrated region prioritizes that subtree. Suspense boundaries can be hydrated independently, so slow-to-load regions don't block the rest.</p>

<h3>Why pick which strategy?</h3>
<ul>
  <li><strong>Marketing pages / docs / blog</strong> — SSG or ISR. Speed, SEO, cheap to serve.</li>
  <li><strong>Logged-in dashboards</strong> — SSR (for initial render) or CSR with a loading state.</li>
  <li><strong>E-commerce product pages</strong> — ISR (revalidate every few minutes or on stock change).</li>
  <li><strong>User-specific timelines</strong> — SSR (often with edge caching).</li>
  <li><strong>Single-app admin tools</strong> — CSR is fine; SEO doesn't matter, internal users tolerate the initial load.</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "where does render happen" picture</h3>
<div class="diagram">
<pre>
              BUILD TIME         REQUEST TIME         CLIENT
               (SSG)              (SSR/RSC)            (CSR)
  pages/
    blog/*    ──► HTML at build
    user/*                        ──► HTML per request
    app/*                                               ──► render in browser
    hybrid                        ──► shell + stream   ──► hydrate progressively
</pre>
</div>

<h3>The "first paint timeline" picture</h3>
<div class="diagram">
<pre>
  CSR:   [ HTML (empty) ][ JS download ][ JS execute ][ render ][ PAINT ]
         ^TTFB                                                   ^LCP (bad)

  SSR:   [ HTML (with content) — PAINT ][ JS download ][ hydrate ][ interactive ]
         ^TTFB                ^LCP (good)                           ^TTI

  Streaming SSR + Suspense:
         [ HTML shell — PAINT ][ HTML region 1 ][ HTML region 2 ]...
         ^TTFB                ^LCP for shell                    interactive per region
</pre>
</div>

<h3>The "RSC data flow" picture</h3>
<div class="diagram">
<pre>
  server component calls db.query()      ──► data
  server component renders JSX           ──► tree (plain data)
  framework serializes tree              ──► "flight" payload
  browser receives payload
  browser renders client components within the tree
  result: a hybrid tree, with interactivity islands
</pre>
</div>

<h3>The "use client" boundary</h3>
<pre><code class="language-js">// blog/page.js — Server Component (default)
import ClientCounter from './ClientCounter';
export default async function BlogPage() {
  const posts = await db.posts.findAll(); // runs on server
  return (
    &lt;main&gt;
      &lt;h1&gt;Posts&lt;/h1&gt;
      {posts.map(p =&gt; &lt;article key={p.id}&gt;{p.title}&lt;/article&gt;)}
      &lt;ClientCounter /&gt; {/* crosses into client-land */}
    &lt;/main&gt;
  );
}

// ClientCounter.js
'use client';
import { useState } from 'react';
export default function ClientCounter() {
  const [n, setN] = useState(0);
  return &lt;button onClick={() =&gt; setN(n+1)}&gt;{n}&lt;/button&gt;;
}</code></pre>
<p>Server components are the default. <code>'use client'</code> marks a component as client-side. Client components can import other client components; server components can import both.</p>

<h3>The "ISR revalidate" picture</h3>
<div class="diagram">
<pre>
  Request 1 (cache cold)  ──► generate HTML, store in CDN, serve
  Request 2 (cache fresh) ──► serve cached HTML
  ...
  Request N (cache stale) ──► serve STALE HTML, trigger background regen
  Request N+1 (after regen)──► serve FRESH HTML (cached again)
</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"SSR means no bundle on the client." No. SSR renders HTML AND ships the full client bundle so React can hydrate. Only RSC reduces the bundle — server components don't ship at all. SSR + RSC combined gives you smaller bundles <em>and</em> fast first paint.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>renderToString (legacy, non-streaming)</h3>
<pre><code class="language-js">import { renderToString } from 'react-dom/server';
const html = renderToString(&lt;App/&gt;);
res.send(\`&lt;!doctype html&gt;&lt;html&gt;&lt;body&gt;&lt;div id="root"&gt;\${html}&lt;/div&gt;&lt;/body&gt;&lt;/html&gt;\`);</code></pre>
<p>Synchronous, blocking, no Suspense support for data. Still useful for simple cases.</p>

<h3>renderToPipeableStream (Node streaming)</h3>
<pre><code class="language-js">import { renderToPipeableStream } from 'react-dom/server';
app.get('/', (req, res) =&gt; {
  const { pipe, abort } = renderToPipeableStream(&lt;App/&gt;, {
    bootstrapScripts: ['/main.js'],
    onShellReady() {
      res.status(200).setHeader('Content-Type', 'text/html');
      pipe(res);
    },
    onAllReady() { /* everything rendered, including slow Suspense boundaries */ },
    onError(err) { console.error(err); },
  });
  setTimeout(abort, 10_000); // safeguard
});</code></pre>

<h3>renderToReadableStream (Web/Edge)</h3>
<pre><code class="language-js">import { renderToReadableStream } from 'react-dom/server';
const stream = await renderToReadableStream(&lt;App/&gt;, { bootstrapScripts: ['/main.js'] });
return new Response(stream, { headers: { 'Content-Type': 'text/html' } });</code></pre>

<h3>hydrateRoot (client side of SSR)</h3>
<pre><code class="language-js">import { hydrateRoot } from 'react-dom/client';
hydrateRoot(document.getElementById('root'), &lt;App/&gt;);
// vs createRoot for pure CSR</code></pre>

<h3>Next.js app router (RSC-first)</h3>
<pre><code class="language-js">// app/posts/page.tsx — Server Component
export default async function Posts() {
  const posts = await db.posts.findMany();
  return posts.map(p =&gt; &lt;article key={p.id}&gt;{p.title}&lt;/article&gt;);
}

// app/posts/loading.tsx — shown while page streams in
export default function Loading() { return &lt;Spinner/&gt;; }

// app/posts/error.tsx — catches thrown errors
'use client';
export default function Error({ error, reset }) { return (&lt;div&gt;{error.message}&lt;button onClick={reset}&gt;Retry&lt;/button&gt;&lt;/div&gt;); }</code></pre>

<h3>Static generation (SSG) with Next.js</h3>
<pre><code class="language-js">// pages/blog/[slug].js (pages router)
export async function getStaticPaths() {
  return { paths: (await getAllSlugs()).map(s =&gt; ({ params: { slug: s } })), fallback: 'blocking' };
}
export async function getStaticProps({ params }) {
  return { props: { post: await getPost(params.slug) }, revalidate: 60 }; // ISR: 60-sec
}</code></pre>

<h3>Data fetching during server render</h3>
<p>RSC: just <code>await</code> directly in component body — it's server code.</p>
<pre><code class="language-js">export default async function Page() {
  const user = await getUser();
  return &lt;h1&gt;Hi, {user.name}&lt;/h1&gt;;
}</code></pre>
<p>Traditional SSR: use framework data loaders (<code>loader</code> in Remix, <code>getServerSideProps</code> in Next Pages Router). React 18 streaming allows <code>use</code> + Suspense to defer slow data while flushing the shell.</p>

<h3>Server Actions (React 19)</h3>
<pre><code class="language-jsx">// Server Action — runs on server when form submits
async function save(formData) {
  'use server';
  await db.insert(formData.get('title'));
  revalidatePath('/posts');
}
export default function NewPost() {
  return (
    &lt;form action={save}&gt;
      &lt;input name="title" /&gt;
      &lt;button&gt;Save&lt;/button&gt;
    &lt;/form&gt;
  );
}</code></pre>
<p>Eliminates the client-side fetch + API endpoint boilerplate. Works progressively (if JS is off, it's just a form POST).</p>

<h3>Hydration matchmaking</h3>
<p>React hydration compares server output to what it would render on the client. Mismatches cause errors. Common sources:</p>
<ul>
  <li>Using <code>Date.now()</code>, <code>Math.random()</code> differently on each side.</li>
  <li>Reading <code>window</code> in a component body (undefined on server).</li>
  <li>Dynamic content based on user locale/time zone (different server vs client).</li>
  <li>Hydration-time-only libraries modifying DOM before React attaches.</li>
</ul>
<p>Fix: <code>useEffect</code> for client-only logic, or mark subtrees as <code>suppressHydrationWarning</code>, or use <code>useSyncExternalStore</code> with proper server snapshots.</p>

<h3>Selective hydration + priority</h3>
<p>When JS loads, React starts hydrating. If a user clicks on a yet-to-be-hydrated region, React fast-paths that region's hydration. Under the hood: lanes assign priority to hydration work.</p>

<h3>Edge vs Node runtimes</h3>
<p>Next.js, Cloudflare, Vercel support edge runtimes (limited Node APIs, but globally distributed, faster TTFB). For RSC + streaming, stream APIs differ: <code>renderToReadableStream</code> for edge/Web, <code>renderToPipeableStream</code> for Node.</p>

<h3>Caching layers</h3>
<ul>
  <li><strong>Data cache</strong> (Next.js): memoizes <code>fetch()</code> responses inside the RSC render.</li>
  <li><strong>Full-route cache</strong>: HTML + RSC payload cached per route.</li>
  <li><strong>Router cache</strong> (client): caches navigated pages in memory for back/forward.</li>
  <li><strong>CDN</strong>: serves the cached HTML to all users.</li>
</ul>
<p>Understanding which cache is serving you is essential when content doesn't update as expected. <code>revalidatePath</code> / <code>revalidateTag</code> are your tools.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — minimal SSR server (Node)</h3>
<pre><code class="language-js">import express from 'express';
import { renderToPipeableStream } from 'react-dom/server';
import App from './App';
const app = express();
app.get('*', (req, res) =&gt; {
  const { pipe } = renderToPipeableStream(&lt;App url={req.url}/&gt;, {
    bootstrapScripts: ['/client.js'],
    onShellReady() { res.setHeader('Content-Type', 'text/html'); pipe(res); },
    onError(e) { console.error(e); },
  });
});</code></pre>

<h3>Example 2 — client hydration</h3>
<pre><code class="language-js">// client.js
import { hydrateRoot } from 'react-dom/client';
import App from './App';
hydrateRoot(document.getElementById('root'), &lt;App url={window.location.pathname} /&gt;);</code></pre>

<h3>Example 3 — RSC with direct DB access</h3>
<pre><code class="language-js">// app/products/page.tsx
export default async function Products() {
  const products = await db.product.findMany(); // runs on server only
  return products.map(p =&gt; &lt;ProductCard key={p.id} product={p} /&gt;);
}
// No fetch, no API route, no client JS for this logic.</code></pre>

<h3>Example 4 — Suspense-based streaming</h3>
<pre><code class="language-jsx">export default function Page() {
  return (
    &lt;Layout&gt;
      &lt;Header/&gt;                                  {/* renders + flushes immediately */}
      &lt;Suspense fallback={&lt;CardSkeleton/&gt;}&gt;
        &lt;FeaturedProduct/&gt;                        {/* might take 300ms — streams when ready */}
      &lt;/Suspense&gt;
      &lt;Suspense fallback={&lt;ListSkeleton/&gt;}&gt;
        &lt;RecentOrders/&gt;                           {/* might take 1s — streams later */}
      &lt;/Suspense&gt;
    &lt;/Layout&gt;
  );
}</code></pre>

<h3>Example 5 — ISR in Next.js App Router</h3>
<pre><code class="language-js">// app/blog/[slug]/page.tsx
export const revalidate = 60; // seconds
export default async function Post({ params }) {
  const post = await getPost(params.slug);
  return &lt;article&gt;{post.content}&lt;/article&gt;;
}
// First request: generates + caches. Subsequent: served from cache.
// After 60s: next request serves stale, regenerates in background.</code></pre>

<h3>Example 6 — on-demand revalidation</h3>
<pre><code class="language-js">// app/api/webhook/route.ts
import { revalidatePath } from 'next/cache';
export async function POST(req) {
  const body = await req.json();
  revalidatePath(\`/blog/\${body.slug}\`);
  return Response.json({ ok: true });
}
// Your CMS hits this when content changes → cache invalidated immediately.</code></pre>

<h3>Example 7 — Server Action for mutation</h3>
<pre><code class="language-jsx">// app/posts/actions.ts
'use server';
import { revalidatePath } from 'next/cache';
export async function createPost(formData: FormData) {
  const title = formData.get('title');
  await db.post.create({ data: { title } });
  revalidatePath('/posts');
}

// app/posts/new/page.tsx
import { createPost } from '../actions';
export default function New() {
  return (&lt;form action={createPost}&gt;
    &lt;input name="title" /&gt;
    &lt;button&gt;Create&lt;/button&gt;
  &lt;/form&gt;);
}</code></pre>

<h3>Example 8 — mixing server and client components</h3>
<pre><code class="language-jsx">// app/dashboard/page.tsx (Server Component)
import Chart from './Chart';
import Toolbar from './Toolbar';
export default async function Dashboard() {
  const stats = await db.stats.get();
  return (
    &lt;&gt;
      &lt;h1&gt;Dashboard&lt;/h1&gt;
      &lt;Toolbar/&gt;                       {/* Client Component: 'use client' */}
      &lt;Chart data={stats} /&gt;           {/* Client Component */}
    &lt;/&gt;
  );
}</code></pre>

<h3>Example 9 — passing server data to client components</h3>
<pre><code class="language-jsx">// parent (server) passes a Promise
import { getUser } from './data';
import UserProfile from './UserProfile';
export default function Page({ id }) {
  const userPromise = getUser(id);      // server starts the fetch
  return &lt;UserProfile userPromise={userPromise} /&gt;;
}

// UserProfile.tsx
'use client';
import { use } from 'react';
export default function UserProfile({ userPromise }) {
  const user = use(userPromise);        // suspends until resolved
  return &lt;div&gt;{user.name}&lt;/div&gt;;
}</code></pre>

<h3>Example 10 — hydration mismatch (and fix)</h3>
<pre><code class="language-jsx">// BAD
function Now() { return &lt;time&gt;{new Date().toLocaleTimeString()}&lt;/time&gt;; }
// Server renders at T1, client hydrates at T2 → mismatch warning.
// FIX: render a placeholder on server, update after mount.
function Now() {
  const [t, setT] = useState('');
  useEffect(() =&gt; setT(new Date().toLocaleTimeString()), []);
  return &lt;time&gt;{t}&lt;/time&gt;;
}</code></pre>

<h3>Example 11 — dynamic rendering in Next 14+</h3>
<pre><code class="language-js">// Forces SSR per request
export const dynamic = 'force-dynamic';
// Or use dynamic APIs (cookies(), headers()) that implicitly opt into dynamic rendering.</code></pre>

<h3>Example 12 — caching a fetch in RSC</h3>
<pre><code class="language-js">// By default, fetch() in Next RSC is cached
const res = await fetch('https://api.example.com/data'); // cached forever
// Opt out:
await fetch(url, { cache: 'no-store' });
// Time-based:
await fetch(url, { next: { revalidate: 60 } });
// Tag-based:
await fetch(url, { next: { tags: ['posts'] } });
// Then: revalidateTag('posts') to invalidate.</code></pre>

<h3>Example 13 — Remix loader / action</h3>
<pre><code class="language-js">// routes/post.$slug.tsx
export const loader = async ({ params }) =&gt; {
  const post = await getPost(params.slug);
  return json(post);
};
export const action = async ({ request }) =&gt; {
  const form = await request.formData();
  await savePost(form);
  return redirect('/posts');
};
export default function Post() {
  const post = useLoaderData();
  return &lt;Form method="post"&gt;...&lt;/Form&gt;;
}</code></pre>

<h3>Example 14 — progressive enhancement with Server Actions</h3>
<p>A form with <code>action={serverAction}</code> works even with JS disabled — the form POSTs to a hidden endpoint, the action runs, and the page reloads with updated data. When JS is on, React hijacks the submit to run it as an async operation without a full navigation.</p>

<h3>Example 15 — checking hydration cost</h3>
<pre><code class="language-js">// In DevTools: Performance panel → look for "Hydrate" mark
// Optimize by reducing component count, virtualizing lists, using RSC for static parts.</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Hydration mismatch on random IDs</h3>
<p>Math.random() on both sides produces different values. Use <code>useId</code> for stable cross-environment IDs.</p>

<h3>2. Hydration mismatch on locale-formatted dates</h3>
<p>Server's locale vs client's locale differ → different strings. Format on client only (<code>useEffect</code>) or use <code>Intl.DateTimeFormat</code> with explicit locale/timezone.</p>

<h3>3. useLayoutEffect on server</h3>
<p>React warns: "useLayoutEffect does nothing on the server." Either switch to <code>useEffect</code>, or use <code>useIsomorphicLayoutEffect</code> (a branch on <code>typeof window</code>).</p>

<h3>4. Large HTML payloads</h3>
<p>An SSR page embedding 10MB of data in <code>&lt;script&gt;</code> sent as inline JSON blocks rendering. Split into critical-above-fold vs stream-later (Suspense boundaries).</p>

<h3>5. Server components importing client hooks</h3>
<pre><code class="language-js">// app/page.tsx — Server Component
import { useState } from 'react'; // ERROR — hooks only in client components</code></pre>

<h3>6. Client components importing server-only modules</h3>
<pre><code class="language-js">'use client';
import db from 'server-only-db'; // leaks server code into client bundle</code></pre>
<p>Use <code>server-only</code> package or the 'server-only' marker to prevent accidental imports.</p>

<h3>7. Passing non-serializable props from server to client</h3>
<pre><code class="language-jsx">&lt;ClientComp callback={() =&gt; ...} /&gt; // error — function not serializable</code></pre>
<p>Server-to-client props must be JSON-serializable. For callbacks: use Server Actions.</p>

<h3>8. Conditional rendering based on <code>typeof window</code></h3>
<pre><code class="language-js">if (typeof window === 'undefined') return null;
// Branches server vs client render → hydration mismatch. Use useEffect for client-only.</code></pre>

<h3>9. React 18 streaming + legacy Node body parsing</h3>
<p>Some middleware buffers response → kills streaming benefits. Use streaming-aware frameworks (Next.js, Remix, Astro) rather than bolting onto Express.</p>

<h3>10. SSG with dynamic routes needs explicit paths</h3>
<pre><code class="language-js">// Next Pages router
export async function getStaticPaths() { return { paths: [...], fallback: 'blocking' }; }
// fallback: false | 'blocking' | true — affects behavior for not-yet-generated paths.</code></pre>

<h3>11. ISR revalidate happens on the next request</h3>
<p>If no one visits an expired page, it stays stale indefinitely. For predictable cache misses, pre-warm via cron jobs hitting the URL.</p>

<h3>12. Cold-start cost on edge functions</h3>
<p>First request after idle has higher latency. Warm-up depends on platform; some offer "keep warm" or provisioned concurrency.</p>

<h3>13. Cookies / headers require dynamic rendering</h3>
<pre><code class="language-js">import { cookies } from 'next/headers';
cookies(); // any usage forces dynamic rendering — can't be cached statically</code></pre>

<h3>14. Streaming can't set response headers after first flush</h3>
<p>Once bytes are sent, response headers (status, cookies) are locked. Set auth headers / redirects BEFORE starting to stream.</p>

<h3>15. SEO content in Suspense fallback</h3>
<p>Crawlers see the HTML as it streams. If SEO-critical content is in a lazy Suspense boundary, the crawler may index the fallback, not the real content — unless it waits. Put SEO content in the shell.</p>

<h3>16. Page-level 404 vs component-level 404</h3>
<p>Server component can call <code>notFound()</code> to abort rendering and return a 404 page. Client components can't — they can only render a 404 UI. For true 404 status codes, throw on the server.</p>

<h3>17. RSC payload vs HTML</h3>
<p>Navigating between routes on the client doesn't re-fetch HTML; it fetches the RSC payload (smaller, just data + tree). The initial load is HTML; subsequent client-navigations are payloads.</p>

<h3>18. Mutating from client components</h3>
<p>Via Server Actions (invoked through forms or <code>use</code>+promise). Direct fetch calls also work but lose the progressive-enhancement benefit.</p>

<h3>19. Hydration of portals</h3>
<p>Portals work under hydration. The portal target (e.g., <code>document.body</code>) must exist at hydration time; dynamic portals require careful sequencing.</p>

<h3>20. HTML entity encoding</h3>
<p>React escapes JSX text by default, so <code>&amp;</code> is rendered as <code>&amp;amp;</code>. In RSC, <code>dangerouslySetInnerHTML</code> still bypasses — same XSS rules apply.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — SSR that blocks on a slow API</h3>
<p>Don't make the whole page wait for a rare slow query. Use Suspense + streaming to send the shell first and stream the slow region later.</p>

<h3>Anti-pattern 2 — Using <code>use client</code> at the top of every file</h3>
<p>You lose RSC benefits (smaller bundles, server-side data access). Mark the LOWEST component that needs interactivity as client; keep parents server.</p>

<h3>Anti-pattern 3 — Fetching in every component independently</h3>
<p>Cascading awaits in child components produce a "request waterfall." Fetch data at the top (the page) in parallel, then pass down.</p>

<h3>Anti-pattern 4 — Server Component doing client-only work</h3>
<p>No <code>useState</code>, <code>useEffect</code>, event handlers, <code>localStorage</code>, <code>window</code>. Server components can't be interactive. If you need these, extract a client child.</p>

<h3>Anti-pattern 5 — Hydrating the entire page when only parts are interactive</h3>
<p>RSC lets you skip shipping components that don't need interactivity. A marketing landing page with one animated CTA can have zero JS for everything except the CTA.</p>

<h3>Anti-pattern 6 — Over-caching dynamic content</h3>
<pre><code class="language-js">// Next.js
await fetch(url); // cached forever by default
// User A's data shows up for User B. Use { cache: 'no-store' } or { next: { revalidate: ... } }.</code></pre>

<h3>Anti-pattern 7 — Under-caching static content</h3>
<p><code>export const dynamic = 'force-dynamic'</code> on every page = every request CPU. For genuinely static content, revalidate on webhook instead.</p>

<h3>Anti-pattern 8 — Using client components for data fetching in RSC world</h3>
<pre><code class="language-jsx">'use client';
export default function Posts() {
  const { data } = useQuery({...}); // loses RSC benefit; two networks round trips
}</code></pre>
<p>Prefer server component with direct <code>await</code>; use React Query on client only for interactive data.</p>

<h3>Anti-pattern 9 — Mixing getServerSideProps with client-side data libraries</h3>
<p>Double fetching. Let React Query consume the SSR result as hydrated state (<code>dehydrate</code> / <code>Hydrate</code>) rather than refetching on mount.</p>

<h3>Anti-pattern 10 — Large JSON preloaded in a script tag</h3>
<p>Kilobytes of inlined state block parsing. Split, stream, or move to separate endpoints that the client fetches.</p>

<h3>Anti-pattern 11 — Not configuring Suspense boundaries</h3>
<p>Without boundaries, your streaming SSR works like legacy SSR: waits for everything. Place boundaries around slow regions.</p>

<h3>Anti-pattern 12 — Ignoring hydration warnings</h3>
<p>"Hydration mismatch" surfaces real bugs. Browser fills in the mismatch silently but then re-renders the discrepant subtree — wasting the SSR work. Fix the source of the mismatch.</p>

<h3>Anti-pattern 13 — 500-line server components</h3>
<p>If everything is async-awaited in one component, the page can't stream anything until the slowest query finishes. Break into smaller components wrapped in Suspense.</p>

<h3>Anti-pattern 14 — Using dynamic(ssr: false) for non-SSR-safe code unnecessarily</h3>
<p>Opts out of SSR for a component AND its subtree. Only needed for truly browser-only code (chart libraries reading window on import). Wrapping too much degrades to CSR.</p>

<h3>Anti-pattern 15 — Trusting caching without invalidation</h3>
<p>ISR / Data Cache is powerful, but without <code>revalidateTag</code> / <code>revalidatePath</code> calls on writes, users see stale content indefinitely. Plan your invalidation strategy before going live.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. CSR vs SSR vs SSG — when do you pick each?</div>
  <div class="qa-answer">
    <p><strong>CSR</strong>: internal tools, dashboards behind auth where SEO doesn't matter and initial load tolerance is OK. Simplest deploy.</p>
    <p><strong>SSR</strong>: per-user content, SEO matters, content can't be pre-rendered (logged-in views, search results).</p>
    <p><strong>SSG</strong>: marketing pages, docs, blog — content is the same for every visitor and changes infrequently. Cheapest to serve.</p>
    <p><strong>ISR (Next.js)</strong>: content needs periodic updates but is shared across users — e-commerce, CMS-driven sites. Best default for most content sites.</p>
    <p>Modern frameworks let you mix per route; the choice isn't app-wide.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What is hydration?</div>
  <div class="qa-answer">
    <p>The process where React attaches event handlers and state to server-rendered DOM. The server produces HTML; the browser parses and paints. Then JS loads, and React walks the component tree alongside the existing DOM, hooking up listeners without re-creating nodes. Hydration is roughly as expensive as a CSR render (all component functions run) but does no DOM mutations. Gotcha: server output must match client-rendered output or you get a mismatch warning and React has to re-render the discrepant subtree.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Explain streaming SSR.</div>
  <div class="qa-answer">
    <p>Instead of waiting for the entire render, the server flushes HTML as parts become ready. Components can suspend (throw a promise) inside <code>&lt;Suspense&gt;</code> boundaries; the server emits the fallback HTML immediately and streams the real content when the data arrives, wrapping it in an inline <code>&lt;script&gt;</code> that swaps the placeholder. Clients can hydrate progressively — selective hydration lets interactive regions come alive as their JS loads, prioritizing whatever the user is interacting with. APIs: <code>renderToPipeableStream</code> (Node), <code>renderToReadableStream</code> (Web/Edge).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. What are React Server Components?</div>
  <div class="qa-answer">
    <p>Components that run <em>only on the server</em>. They can directly <code>await</code> database queries or external APIs, can't use state or effects or browser APIs, and their JS doesn't ship to the client. The server serializes the rendered tree (with client-component references preserved) into a "flight payload," which the client reads to build the final UI. Client interactivity is in <code>'use client'</code>-marked components. Benefits: smaller bundles, direct data access, no client fetch waterfalls for server-known data.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. What problem does ISR solve?</div>
  <div class="qa-answer">
    <p>SSG is fast but stale. SSR is fresh but slow (CPU per request). ISR gives you SSG's speed for the common case (serve cached HTML) and SSR's freshness where it matters (regenerate in background when stale, or on webhook). For a product page that needs to reflect inventory updates within a few minutes, ISR is ideal — serve from cache, periodically refresh.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. A user reports stale content on a Next.js site. How do you diagnose?</div>
  <div class="qa-answer">
    <ol>
      <li>What kind of page? SSG/ISR/SSR/RSC?</li>
      <li>Check the caching: <code>revalidate</code>, <code>fetch</code> cache options, full-route cache TTL, CDN headers.</li>
      <li>Is <code>revalidatePath</code>/<code>revalidateTag</code> being called on writes?</li>
      <li>Is the CDN serving an even older version than your app cache?</li>
      <li>Inspect the <code>x-vercel-cache</code>/CDN headers to see HIT/MISS/STALE.</li>
      <li>Fix: either reduce revalidate interval, wire on-demand revalidation, or mark the page dynamic if freshness is critical.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. What's the bundle impact of RSC?</div>
  <div class="qa-answer">
    <p>Components marked server don't ship at all. A page that was 400 KB because of a markdown renderer, a DB query library, a utility lib — can drop to 50 KB because all of that runs server-side. Only <code>'use client'</code> components and the React runtime ship. Big wins on LCP, TTI, INP.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. When do hydration mismatches occur and how do you fix them?</div>
  <div class="qa-answer">
    <p>When server-rendered HTML differs from what the client would produce on first render. Common causes: <code>Date.now()</code>, <code>Math.random()</code>, <code>typeof window</code> branches, locale-dependent formatting, third-party scripts modifying DOM before hydration. Fixes: (1) use <code>useId</code> for stable IDs; (2) render placeholder on server and update in <code>useEffect</code>; (3) use <code>suppressHydrationWarning</code> for tiny intentional mismatches (like timestamps); (4) use <code>useSyncExternalStore</code> with a matching server snapshot for external-store subscriptions.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. What's a Server Action?</div>
  <div class="qa-answer">
    <p>A function marked with <code>'use server'</code> that runs on the server but can be imported or referenced from client components. Typically wired to a form's <code>action</code> prop or called via a client event handler. Eliminates the client-fetch-to-API-route boilerplate, works without JS (progressive enhancement), and integrates with Next's revalidation. Under the hood: the framework generates an endpoint and serializes the call — you never write it manually.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. How does selective hydration improve responsiveness?</div>
  <div class="qa-answer">
    <p>Before 18, all of a page had to hydrate before any part was interactive. In 18, regions inside Suspense boundaries hydrate independently. If the user clicks on a yet-to-be-hydrated region, React prioritizes hydrating that region first. Net effect: users can interact with above-the-fold content even if below-the-fold is still hydrating.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Why does streaming require Suspense?</div>
  <div class="qa-answer">
    <p>Streaming needs markers to know "flush what's ready, leave a placeholder for what isn't." Suspense boundaries are those markers. Without them, the server still has to build the entire tree before emitting any HTML. More boundaries = more granular streaming.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. What's the difference between renderToString and renderToPipeableStream?</div>
  <div class="qa-answer">
    <p><code>renderToString</code>: synchronous, returns a complete HTML string. Doesn't support Suspense for data fetching. Blocks until everything renders.</p>
    <p><code>renderToPipeableStream</code>: returns a stream, calls your <code>onShellReady</code> when the shell is ready so you can start piping. Suspense-aware: flushes slow regions as they become ready. Use this for React 18+ apps.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Explain the Next.js app router caching layers.</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Request-level memoization</strong> — identical <code>fetch()</code> calls within a single render share one request.</li>
      <li><strong>Data Cache</strong> — persistent store of <code>fetch()</code> responses across renders; controlled via <code>cache</code>, <code>next.revalidate</code>, <code>next.tags</code>.</li>
      <li><strong>Full Route Cache</strong> — cached HTML + RSC payload for static routes.</li>
      <li><strong>Router Cache</strong> — in-memory cache of visited pages in the browser, used for back/forward nav.</li>
    </ul>
    <p>Invalidation: <code>revalidatePath(path)</code>, <code>revalidateTag(tag)</code>, or time-based via <code>next.revalidate</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. What's the tradeoff of edge runtime for SSR?</div>
  <div class="qa-answer">
    <p>Edge (Cloudflare Workers, Vercel Edge) runs globally, fast TTFB, low cold-start. But: limited Node APIs (no fs, limited crypto), smaller memory, shorter execution time, fewer native addons. Good for pages that only need fetch + render. Not good for heavy compute, full database drivers, file-based rendering. Often a hybrid: edge for latency-sensitive routes, Node for compute-heavy ones.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. What's the performance story of RSC + streaming?</div>
  <div class="qa-answer">
    <p>Combines: fast TTFB (stream shell immediately), small client JS (server-only components don't ship), progressive interactivity (selective hydration prioritizes user focus), fewer client fetches (server fetches directly from DB). Net: lower LCP, lower TTI, lower INP, smaller bundle. Tradeoff: requires a proper framework (Next.js, RSC-aware tooling); debugging is split between server and client runtimes.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You classify pages by rendering strategy and justify by freshness/SEO/perf.</li>
    <li>You explain hydration as "attach JS to server HTML" and call out mismatches.</li>
    <li>You know streaming SSR requires Suspense boundaries.</li>
    <li>You distinguish RSC (no client JS) from SSR (client bundle still ships).</li>
    <li>You mention ISR / revalidate patterns.</li>
    <li>You call out cache layers and invalidation.</li>
    <li>You understand Server Actions as a bridge between client UI and server mutations.</li>
  </ul>
</div>
`}

]
});
