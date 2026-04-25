window.PREP_SITE.registerTopic({
  id: 'perf-images-fonts',
  module: 'Frontend Performance',
  title: 'Images & Fonts',
  estimatedReadTime: '28 min',
  tags: ['performance', 'images', 'fonts', 'webp', 'avif', 'srcset', 'lazy-loading', 'font-display', 'subsetting'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>Images and fonts dominate the bytes a page loads — easily 70-90% on a typical site. Optimizing them is the single highest-leverage perf work after server response time.</p>
<ul>
  <li><strong>Image formats</strong>: AVIF (best compression) → WebP (broad support) → JPEG (universal). Use <code>&lt;picture&gt;</code> with type fallbacks, or a CDN with content negotiation.</li>
  <li><strong>Responsive images</strong>: <code>srcset</code> + <code>sizes</code> serve the right resolution per viewport. Don't ship desktop pixels to mobile.</li>
  <li><strong>Lazy loading</strong>: <code>loading="lazy"</code> for below-the-fold; <code>fetchpriority="high"</code> for the LCP image.</li>
  <li><strong>Dimensions</strong>: always specify <code>width</code>/<code>height</code> (or <code>aspect-ratio</code>) — prevents CLS.</li>
  <li><strong>Decoding</strong>: <code>decoding="async"</code> to avoid blocking main thread on first render.</li>
  <li><strong>Placeholders</strong>: blurhash / thumbhash / LQIP for instant feedback while the real image loads.</li>
  <li><strong>Font formats</strong>: WOFF2 only — best compression and broad support.</li>
  <li><strong>Font display</strong>: <code>font-display: swap</code> (FOUT) or <code>optional</code> (no swap, instant fallback).</li>
  <li><strong>Font preloading</strong>: <code>&lt;link rel="preload" as="font" crossorigin&gt;</code> to start fetching early.</li>
  <li><strong>Font subsetting</strong>: ship only the characters you need (Latin-1 + ext for English; subset CJK aggressively).</li>
  <li><strong>Variable fonts</strong>: one file for many weights/widths — saves bytes vs separate files.</li>
  <li><strong>Self-host</strong>: avoid third-party DNS / TLS overhead on critical fonts.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>For images: serve the right format, the right size, at the right priority — <code>&lt;picture&gt;</code> + <code>srcset</code> + <code>fetchpriority</code> + <code>loading</code>. For fonts: WOFF2, subsetted, preloaded, with <code>font-display: swap</code>. Most CWV wins live here.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why images dominate page weight</h3>
<p>The HTTP Archive's State of the Web reports image bytes as 50-70% of total page weight median across the top 1M sites. A hero image at full desktop resolution served unmodified to a 4G mobile user can single-handedly blow your LCP budget. Optimization plays:</p>
<ul>
  <li><strong>Format</strong>: WebP is ~25-30% smaller than JPEG; AVIF another 20-30% on top.</li>
  <li><strong>Resolution</strong>: serve per-device DPR — a 2x retina iPhone needs different pixels than a 1x desktop.</li>
  <li><strong>Compression</strong>: quality 75-85 is usually indistinguishable from quality 95 at 30% the size.</li>
  <li><strong>Lazy loading</strong>: don't fetch what's off-screen.</li>
  <li><strong>Priority</strong>: hero image is critical; thumbnails are not.</li>
</ul>

<h3>Why fonts surprise people</h3>
<p>A "free" Google Font dropped via CDN incurs: DNS lookup, TLS handshake, CSS download, font file download. That's 200-800ms before text renders correctly. Until then either:</p>
<ul>
  <li>Browser shows fallback (FOUT — flash of unstyled text), then swaps in the real font (visible reflow).</li>
  <li>Browser shows blank text (FOIT — flash of invisible text), then swaps when ready.</li>
</ul>
<p>Both feel broken on slow connections. Mitigations: preload, self-host, font-display, subset, fallback metric matching.</p>

<h3>Why <code>&lt;picture&gt;</code> + <code>srcset</code></h3>
<p>One image, many sources. The browser picks the best variant based on:</p>
<ul>
  <li>Format support (uses <code>type</code> in <code>&lt;source&gt;</code> to skip unsupported formats).</li>
  <li>Viewport width (uses <code>sizes</code> + <code>srcset</code> width descriptors).</li>
  <li>Device DPR.</li>
</ul>
<p>Result: an iPhone gets 800px AVIF; a desktop Chrome gets 1600px WebP; an old browser gets JPEG. All from one HTML.</p>

<h3>Why <code>fetchpriority</code></h3>
<p>Browsers have heuristics to prioritize critical resources, but they don't always know which image is the LCP. Marking the hero <code>fetchpriority="high"</code> ensures it leaves the gate first; below-the-fold thumbs marked <code>low</code> yield bandwidth. Net: ~10-30% LCP improvement on image-heavy pages.</p>

<h3>Why <code>font-display</code></h3>
<table>
  <thead><tr><th>Value</th><th>Behavior</th><th>When</th></tr></thead>
  <tbody>
    <tr><td><code>auto</code></td><td>UA default (often block-like)</td><td>Don't use</td></tr>
    <tr><td><code>block</code></td><td>Invisible up to 3s, then swap</td><td>Branded headers where exact font matters</td></tr>
    <tr><td><code>swap</code></td><td>Fallback immediately, swap when ready</td><td>Most cases — accept FOUT</td></tr>
    <tr><td><code>fallback</code></td><td>Brief invisible (~100ms) then fallback; swap if loaded within 3s</td><td>Compromise</td></tr>
    <tr><td><code>optional</code></td><td>Brief invisible; if not loaded fast, use fallback for the session</td><td>Best LCP — no swap reflow</td></tr>
  </tbody>
</table>

<h3>Why subsetting matters</h3>
<p>A full Inter font file (all weights + styles + scripts) is ~400-800KB. Most apps need Latin only. Subsetted to Latin-1 + Latin Extended → ~50-80KB. CJK fonts can be 3-10MB unsubsetted; meaningful subsetting requires per-page character analysis.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "image budget" picture</h3>
<div class="diagram">
<pre>
 Hero (LCP candidate)
   - high priority
   - preloaded
   - eager (default)
   - WebP/AVIF
   - srcset for DPR + viewport
   - dimensions for CLS

 Above-the-fold thumbnails
   - normal priority
   - default loading
   - smaller variants

 Below-the-fold
   - loading="lazy"
   - fetchpriority="low"
   - low-quality default; user scrolls → load real
</pre>
</div>

<h3>The "format pyramid"</h3>
<div class="diagram">
<pre>
              AVIF (newest, smallest)
                  │
                  ▼
              WebP (broad support)
                  │
                  ▼
              JPEG / PNG (universal)

 Use &lt;picture&gt; with &lt;source type="image/avif"&gt;, &lt;source type="image/webp"&gt;, &lt;img src="...jpg"&gt;
 Browser picks the first it supports.
</pre>
</div>

<h3>The "font loading flow"</h3>
<div class="diagram">
<pre>
 HTML parse
    │
    ▼
 CSS parse (sees @font-face)
    │
    ▼
 Font fetch starts (LATE — discoverable from CSS)
    │
    │
 (preload skips ahead — fetch starts in HTML parse phase)
    │
    ▼
 Font loaded → text re-renders with custom font

 With font-display: swap:
   render text with fallback first → swap on load (visible reflow)

 With font-display: optional:
   render with fallback. If font loads in ~100ms, use it; else session uses fallback.
</pre>
</div>

<h3>The "where bytes go" picture</h3>
<table>
  <thead><tr><th>Optimization</th><th>Impact on weight</th></tr></thead>
  <tbody>
    <tr><td>Format JPEG → WebP</td><td>~30% reduction</td></tr>
    <tr><td>Format WebP → AVIF</td><td>~25% reduction</td></tr>
    <tr><td>Compression q=95 → q=80</td><td>~50% reduction (visually similar)</td></tr>
    <tr><td>Resize 2400x → 1200x for mobile</td><td>~75% reduction</td></tr>
    <tr><td>Fonts unsubsetted → subsetted</td><td>50-90% reduction</td></tr>
    <tr><td>Variable font vs 4 weights</td><td>~50-60% reduction</td></tr>
  </tbody>
</table>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Lazy load everything." Lazy-loading the LCP image hurts. <code>loading="lazy"</code> is for below-the-fold only. Above-the-fold should be eager (default), and the LCP candidate explicitly marked <code>fetchpriority="high"</code>.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Picture element with format fallbacks</h3>
<pre><code class="language-html">&lt;picture&gt;
  &lt;source type="image/avif" srcset="/hero.avif" /&gt;
  &lt;source type="image/webp" srcset="/hero.webp" /&gt;
  &lt;img src="/hero.jpg" alt="Hero" width="1600" height="900" /&gt;
&lt;/picture&gt;</code></pre>

<h3>Responsive srcset (width descriptors)</h3>
<pre><code class="language-html">&lt;img
  src="/hero-800.webp"
  srcset="/hero-400.webp 400w,
          /hero-800.webp 800w,
          /hero-1200.webp 1200w,
          /hero-2400.webp 2400w"
  sizes="(max-width: 600px) 100vw,
         (max-width: 1200px) 50vw,
         800px"
  width="2400" height="1200" alt="Hero"
  fetchpriority="high"
  decoding="async" /&gt;</code></pre>
<p><code>sizes</code> tells the browser what slot the image occupies; combined with viewport width and DPR, browser picks the closest <code>srcset</code> entry.</p>

<h3>Density-based srcset (simpler)</h3>
<pre><code class="language-html">&lt;img src="/avatar.jpg"
     srcset="/avatar.jpg 1x, /avatar@2x.jpg 2x, /avatar@3x.jpg 3x"
     width="48" height="48" /&gt;</code></pre>
<p>Use when image size is fixed; the browser picks based on DPR.</p>

<h3>fetchpriority + loading</h3>
<pre><code class="language-html">&lt;!-- Hero / LCP candidate --&gt;
&lt;img src="hero.webp" fetchpriority="high" /&gt;

&lt;!-- Below the fold --&gt;
&lt;img src="thumb.webp" loading="lazy" decoding="async" fetchpriority="low" /&gt;</code></pre>

<h3>Aspect ratio / dimensions</h3>
<pre><code class="language-css">img {
  aspect-ratio: 16 / 9;
  width: 100%;
  height: auto;
}
/* Reserves layout space before image loads — no CLS. */</code></pre>

<h3>LQIP / blurhash / thumbhash placeholders</h3>
<pre><code class="language-html">&lt;!-- Inline blurry data URI as background --&gt;
&lt;div style="background-image: url('data:image/jpeg;base64,...20px-tall...')"&gt;
  &lt;img src="hero.webp" loading="lazy" /&gt;
&lt;/div&gt;</code></pre>
<pre><code class="language-jsx">// React with blurhash
import { Blurhash } from 'react-blurhash';
{!loaded &amp;&amp; &lt;Blurhash hash={hash} width={400} height={300} /&gt;}
&lt;img onLoad={() =&gt; setLoaded(true)} ... /&gt;</code></pre>

<h3>Image CDN with content negotiation</h3>
<pre><code class="language-html">&lt;img src="https://images.cdn.example.com/photos/abc?w=800&amp;auto=format" /&gt;
// CDN inspects Accept header, returns AVIF/WebP/JPEG accordingly
// width/quality computed dynamically — one URL per logical image</code></pre>
<p>Tools: Cloudinary, Imgix, Cloudflare Images, AWS Lambda@Edge with sharp.</p>

<h3>Modern image format detection in CSS</h3>
<pre><code class="language-css">@supports (background-image: image('image/avif', '/hero.avif')) {
  .hero { background-image: image('image/avif', '/hero.avif', '/hero.webp', '/hero.jpg'); }
}</code></pre>

<h3>SVG for icons</h3>
<p>Vector — scales to any size, tiny bytes. Inline for small icons (no HTTP); sprite + <code>&lt;use&gt;</code> for many icons.</p>

<h3>Font loading: WOFF2 + @font-face</h3>
<pre><code class="language-css">@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0020-007F, U+00A0-00FF;  /* Latin-1 only */
}</code></pre>
<p>Modern browsers all support WOFF2; older formats (TTF, EOT) are obsolete.</p>

<h3>Preloading critical fonts</h3>
<pre><code class="language-html">&lt;link
  rel="preload"
  as="font"
  href="/fonts/inter-regular.woff2"
  type="font/woff2"
  crossorigin /&gt;</code></pre>
<p><code>crossorigin</code> is required even for same-origin (font requests are anonymous CORS by default).</p>

<h3>Variable fonts</h3>
<pre><code class="language-css">@font-face {
  font-family: 'Inter';
  src: url('/fonts/InterVariable.woff2') format('woff2-variations');
  font-weight: 100 900;       /* range */
  font-style: oblique 0deg 12deg;
  font-display: swap;
}
.bold { font-weight: 700; }
.heavy { font-weight: 900; }
/* All weights served from one file. */</code></pre>

<h3>Subsetting</h3>
<pre><code># Tooling: glyphhanger, fonttools (pyftsubset)
npx glyphhanger --whitelist=US_ASCII,latin --formats=woff2 fonts/Inter.ttf
# Outputs Inter-subset.woff2 with only Latin glyphs</code></pre>

<h3>Fallback font metric matching</h3>
<pre><code class="language-css">@font-face {
  font-family: 'Inter Fallback';
  src: local('Arial');
  size-adjust: 107%;
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}
body { font-family: 'Inter', 'Inter Fallback', system-ui, sans-serif; }
/* Inter Fallback has metrics that match Inter — minimal layout shift on swap. */</code></pre>

<h3>Font Loading API</h3>
<pre><code class="language-js">document.fonts.ready.then(() =&gt; {
  document.body.classList.add('fonts-loaded');
});

const f = new FontFace('CustomFont', 'url(/font.woff2)');
await f.load();
document.fonts.add(f);</code></pre>

<h3>System font stack (zero-cost)</h3>
<pre><code class="language-css">font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
  Roboto, 'Helvetica Neue', Arial, sans-serif;
/* No download. Always available. Modern OS fonts are excellent. */</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — full hero pattern</h3>
<pre><code class="language-html">&lt;link rel="preload" as="image" href="/hero.avif" type="image/avif" fetchpriority="high" /&gt;

&lt;picture&gt;
  &lt;source type="image/avif"
          srcset="/hero-400.avif 400w, /hero-800.avif 800w, /hero-1600.avif 1600w"
          sizes="(max-width: 768px) 100vw, 1600px" /&gt;
  &lt;source type="image/webp"
          srcset="/hero-400.webp 400w, /hero-800.webp 800w, /hero-1600.webp 1600w"
          sizes="(max-width: 768px) 100vw, 1600px" /&gt;
  &lt;img
    src="/hero-1600.jpg"
    srcset="/hero-400.jpg 400w, /hero-800.jpg 800w, /hero-1600.jpg 1600w"
    sizes="(max-width: 768px) 100vw, 1600px"
    width="1600" height="900"
    alt="Hero illustration"
    fetchpriority="high"
    decoding="async" /&gt;
&lt;/picture&gt;</code></pre>

<h3>Example 2 — lazy-loaded thumbnail</h3>
<pre><code class="language-html">&lt;img
  src="/thumb.webp"
  width="120" height="120"
  alt=""
  loading="lazy"
  decoding="async"
  fetchpriority="low" /&gt;</code></pre>

<h3>Example 3 — Next.js Image component</h3>
<pre><code class="language-jsx">import Image from 'next/image';

&lt;Image
  src="/hero.jpg"
  alt="Hero"
  width={1600}
  height={900}
  priority         // sets fetchpriority=high + preload
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
  sizes="(max-width: 768px) 100vw, 1600px"
/&gt;</code></pre>
<p>Next.js handles AVIF/WebP automatic conversion at build / on-demand, generates srcset, applies <code>loading="lazy"</code> to non-priority images.</p>

<h3>Example 4 — picture with art direction</h3>
<pre><code class="language-html">&lt;picture&gt;
  &lt;!-- Cropped portrait for narrow viewports --&gt;
  &lt;source media="(max-width: 600px)" srcset="/hero-portrait.webp" /&gt;
  &lt;source media="(min-width: 601px)" srcset="/hero-landscape.webp" /&gt;
  &lt;img src="/hero-landscape.jpg" alt="..." width="1600" height="900" /&gt;
&lt;/picture&gt;</code></pre>

<h3>Example 5 — blurhash placeholder via React</h3>
<pre><code class="language-jsx">import { useState } from 'react';
import { Blurhash } from 'react-blurhash';

function Photo({ src, hash, width, height }) {
  const [loaded, setLoaded] = useState(false);
  return (
    &lt;div style={{ position: 'relative', width, height }}&gt;
      {!loaded &amp;&amp; &lt;Blurhash hash={hash} width={width} height={height} style={{ position: 'absolute' }} /&gt;}
      &lt;img
        src={src}
        width={width} height={height}
        loading="lazy" decoding="async"
        onLoad={() =&gt; setLoaded(true)}
        style={{ position: 'absolute', opacity: loaded ? 1 : 0, transition: 'opacity 0.2s' }}
      /&gt;
    &lt;/div&gt;
  );
}</code></pre>

<h3>Example 6 — font @font-face with Latin subset</h3>
<pre><code class="language-css">@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-latin-400.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0020-007F, U+00A0-00FF, U+0100-017F, U+0180-024F;
}
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-latin-700.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0020-007F, U+00A0-00FF, U+0100-017F, U+0180-024F;
}
body { font-family: 'Inter', system-ui, sans-serif; }</code></pre>

<h3>Example 7 — variable font</h3>
<pre><code class="language-css">@font-face {
  font-family: 'Inter';
  src: url('/fonts/InterVariable.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-display: swap;
}

h1 { font-weight: 800; }   /* uses variable axis */
.subtle { font-weight: 350; } /* fractional weight! */</code></pre>

<h3>Example 8 — preload + display: optional</h3>
<pre><code class="language-html">&lt;link rel="preload" as="font" type="font/woff2" href="/fonts/inter-400.woff2" crossorigin /&gt;</code></pre>
<pre><code class="language-css">@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-400.woff2') format('woff2');
  font-display: optional;   /* shows fallback if not loaded fast; no FOUT swap */
}</code></pre>

<h3>Example 9 — fallback metric matching</h3>
<pre><code class="language-css">/* Adjusted Arial to match Inter metrics */
@font-face {
  font-family: 'Inter Fallback';
  src: local('Arial');
  size-adjust: 107.40%;
  ascent-override: 90.20%;
  descent-override: 22.48%;
  line-gap-override: 0%;
}
body { font-family: 'Inter', 'Inter Fallback', sans-serif; }
/* When Inter loads, swap is nearly invisible — same line height, same widths. */</code></pre>

<h3>Example 10 — image CDN URL params</h3>
<pre><code class="language-jsx">function Img({ src, width, alt, priority }) {
  const url = (w, fmt) =&gt;
    \`https://cdn.example.com/\${src}?w=\${w}&amp;auto=format\${fmt ? '&amp;fm=' + fmt : ''}\`;
  return (
    &lt;picture&gt;
      &lt;source type="image/avif" srcset={\`\${url(400, 'avif')} 400w, \${url(800, 'avif')} 800w, \${url(1600, 'avif')} 1600w\`} /&gt;
      &lt;source type="image/webp" srcset={\`\${url(400, 'webp')} 400w, \${url(800, 'webp')} 800w, \${url(1600, 'webp')} 1600w\`} /&gt;
      &lt;img
        src={url(width)} alt={alt}
        srcSet={\`\${url(400)} 400w, \${url(800)} 800w, \${url(1600)} 1600w\`}
        sizes="(max-width: 768px) 100vw, 1600px"
        width={width} height={Math.round(width * 9/16)}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
      /&gt;
    &lt;/picture&gt;
  );
}</code></pre>

<h3>Example 11 — SVG icon sprite</h3>
<pre><code class="language-html">&lt;svg style="display:none"&gt;
  &lt;symbol id="i-search" viewBox="0 0 24 24"&gt; &lt;path d="..." /&gt; &lt;/symbol&gt;
  &lt;symbol id="i-close" viewBox="0 0 24 24"&gt; &lt;path d="..." /&gt; &lt;/symbol&gt;
&lt;/svg&gt;
&lt;svg width="24" height="24"&gt;&lt;use href="#i-search" /&gt;&lt;/svg&gt;
&lt;svg width="24" height="24"&gt;&lt;use href="#i-close" /&gt;&lt;/svg&gt;</code></pre>

<h3>Example 12 — measure font load timing</h3>
<pre><code class="language-js">document.fonts.ready.then(() =&gt; {
  performance.mark('fonts-ready');
  performance.measure('time-to-fonts', { start: 0, end: 'fonts-ready' });
});</code></pre>

<h3>Example 13 — system fonts only (zero font bytes)</h3>
<pre><code class="language-css">body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
/* Saves 30-300KB of font bytes. Trade-off: brand inconsistency across platforms. */</code></pre>

<h3>Example 14 — Cloudinary URL examples</h3>
<pre><code>https://res.cloudinary.com/demo/image/upload/q_auto,f_auto,w_800/sample.jpg
// q_auto → automatic compression
// f_auto → AVIF/WebP/JPEG based on Accept header
// w_800 → resize to 800px wide</code></pre>

<h3>Example 15 — Build-time image optimization (Vite plugin)</h3>
<pre><code class="language-js">// vite.config.ts
import { defineConfig } from 'vite';
import imagetools from 'vite-imagetools';

export default defineConfig({ plugins: [imagetools()] });

// Usage:
import HeroAvif from '/hero.jpg?format=avif&amp;w=800;1600&amp;as=srcset';
import HeroWebp from '/hero.jpg?format=webp&amp;w=800;1600&amp;as=srcset';
&lt;picture&gt;
  &lt;source srcSet={HeroAvif} type="image/avif" /&gt;
  &lt;source srcSet={HeroWebp} type="image/webp" /&gt;
  &lt;img src="/hero.jpg" /&gt;
&lt;/picture&gt;</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. AVIF support gaps</h3>
<p>AVIF has good but not universal support. Older Safari (≤16.0) and old Chrome on Linux have gaps. Always include WebP and JPEG fallbacks via <code>&lt;picture&gt;</code>.</p>

<h3>2. preload mismatch warns</h3>
<p>Preloading <code>as="image"</code> at one URL but the page uses a different URL → resource downloaded twice or warning in console. Preload exactly the resource the page will use.</p>

<h3>3. fetchpriority too many highs</h3>
<p>Marking 10 images <code>fetchpriority="high"</code> means none is actually prioritized. Use sparingly — usually just the LCP candidate.</p>

<h3>4. lazy-loaded image inside hidden parent</h3>
<p>Browsers wait until the image is in the viewport before fetching. If the parent is <code>display:none</code>, the image never loads. Once shown, it loads but with a delay. For tabs / accordions, consider eager loading once the user shows interest.</p>

<h3>5. SVG security</h3>
<p>SVGs from untrusted sources can include <code>&lt;script&gt;</code> — XSS risk. Sanitize via DOMPurify with SVG profile, or render via <code>&lt;img&gt;</code> (scripts disabled in img-loaded SVGs).</p>

<h3>6. CLS from image without dimensions</h3>
<p>An <code>&lt;img&gt;</code> without width/height has zero intrinsic size until loaded — content reflows. Always specify dimensions or use <code>aspect-ratio</code> CSS.</p>

<h3>7. Image decode on main thread</h3>
<p>Large images decode synchronously on the main thread by default during paint. For animation-sensitive screens, use <code>decoding="async"</code> + the <code>HTMLImageElement.decode()</code> API for explicit pre-decode.</p>

<h3>8. Font preload but unused warning</h3>
<p>Chrome warns if a preloaded font isn't used within ~3s. Caused by typos in URL or media-query-mismatched <code>@font-face</code>. Match the preload URL exactly.</p>

<h3>9. crossorigin attribute mismatch</h3>
<p>Font preload requires <code>crossorigin</code>. Missing → preload doesn't get used; browser re-fetches. Fonts use anonymous CORS by default.</p>

<h3>10. font-display: swap and CLS</h3>
<p>Swap from fallback to custom font causes layout shift if metrics differ. Use fallback metric matching (<code>size-adjust</code>, <code>ascent-override</code>) to minimize.</p>

<h3>11. font-display: optional may never load</h3>
<p>If the font doesn't load within ~100ms (a flaky network), the user sees only fallback for the entire session. Some users never see your branded font. Acceptable tradeoff for LCP-critical pages; not for design-heavy.</p>

<h3>12. Variable font support gaps in older browsers</h3>
<p>WOFF2 with variation axes works in modern browsers; old browsers fall back. Use <code>format('woff2-variations')</code> + a static fallback for legacy.</p>

<h3>13. Subsetting + dynamic content</h3>
<p>If you subset for Latin and a user types CJK in a comment, characters render as fallback. For UGC heavy pages, subset more conservatively or use <code>unicode-range</code> per font file with multiple fallbacks.</p>

<h3>14. Image CDN cache miss latency</h3>
<p>First request for a new size cold misses the CDN — full transformation latency (200-500ms). Pre-warm popular sizes in CI.</p>

<h3>15. Same-origin font without crossorigin</h3>
<p>Even same-origin fonts must declare <code>crossorigin</code> in the preload tag, since font requests use anonymous CORS. Surprises devs.</p>

<h3>16. Native lazy-loading thresholds</h3>
<p>Browsers vary in how far below-the-fold "lazy" actually lazies. Chrome traditionally was aggressive (~3000px ahead), now closer to 1250px. Test scroll behavior; supplement with IntersectionObserver if needed.</p>

<h3>17. Picture element fallback img doesn't accept srcset elsewhere</h3>
<pre><code class="language-html">&lt;picture&gt;
  &lt;source type="image/avif" srcset="..." /&gt;
  &lt;img src="..." srcset="..." sizes="..." /&gt;
  &lt;!-- The img's srcset is the JPEG fallback's responsive set; sizes here too --&gt;
&lt;/picture&gt;</code></pre>

<h3>18. Image priority on RSC / server components</h3>
<p>Next.js Image with <code>priority</code> sends <code>fetchpriority="high"</code> + <code>&lt;link rel="preload"&gt;</code>. Don't use on multiple images per page.</p>

<h3>19. SVG accessibility</h3>
<p>SVG icons need <code>role="img"</code> + <code>aria-label</code> if standalone, or <code>aria-hidden="true"</code> if decorative. Otherwise screen readers may announce a long path.</p>

<h3>20. Animated GIFs</h3>
<p>Inefficient. Convert to MP4 / WebM / animated WebP. <code>&lt;video autoplay loop muted playsinline&gt;</code> with MP4 is typically 5-20× smaller than the GIF, plus better controls.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — lazy-loading the LCP</h3>
<p><code>loading="lazy"</code> on the hero defers fetch → LCP suffers. Eager + <code>fetchpriority="high"</code> on the hero only.</p>

<h3>Anti-pattern 2 — single fixed-size image for all viewports</h3>
<p>Mobile downloads 2400px when 800px would suffice. Bandwidth + decode waste. Use <code>srcset</code>.</p>

<h3>Anti-pattern 3 — no dimensions on img</h3>
<p>CLS hits every image load. Always set width/height or aspect-ratio.</p>

<h3>Anti-pattern 4 — uncompressed PNG screenshots</h3>
<p>Marketing pages with 5MB PNG hero. Convert to WebP/AVIF + compress to ~80% quality.</p>

<h3>Anti-pattern 5 — Google Fonts at default settings</h3>
<p>No preload, no subset, font-display: auto. Self-host a subset with display: swap.</p>

<h3>Anti-pattern 6 — multiple weight files when variable would do</h3>
<p>4 weights × 2 styles = 8 files = many requests. Variable font: 1 file.</p>

<h3>Anti-pattern 7 — animated GIFs</h3>
<p>Convert to looping muted &lt;video&gt;. 10× smaller, better quality, consistent playback.</p>

<h3>Anti-pattern 8 — base64 in CSS for big images</h3>
<p>Inline images bloat CSS, blocking render. Reserve base64 for very small icons (&lt;1KB).</p>

<h3>Anti-pattern 9 — no fallback for AVIF</h3>
<p>An AVIF image fails on old Safari → broken icon. Always use <code>&lt;picture&gt;</code> with WebP / JPEG fallback.</p>

<h3>Anti-pattern 10 — <code>fetchpriority="high"</code> on every image</h3>
<p>Defeats prioritization. One or two highs per page max.</p>

<h3>Anti-pattern 11 — preloading non-critical fonts</h3>
<p>Preload competes with critical resources. Preload only fonts used above-the-fold.</p>

<h3>Anti-pattern 12 — font-display: block by default</h3>
<p>Text invisible until font loads. Bad for UX on slow connections. Default to <code>swap</code>.</p>

<h3>Anti-pattern 13 — shipping desktop and mobile images at same path</h3>
<pre><code>&lt;img src="/hero.jpg"/&gt;  &lt;!-- 4MB on mobile too --&gt;</code></pre>
<p>CDN with auto-format + auto-resize, or build-time variants.</p>

<h3>Anti-pattern 14 — manual cache busting via URL</h3>
<p>Long cache headers + filename hashing (e.g., <code>hero.abc123.jpg</code>) is the right approach. Don't append <code>?v=2</code> by hand on every deploy.</p>

<h3>Anti-pattern 15 — inline SVG everywhere</h3>
<p>Bloats HTML with the same icon paths repeated. Use a sprite or <code>&lt;use xlink:href&gt;</code>.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. How do you optimize images on the web?</div>
  <div class="qa-answer">
    <ol>
      <li>Modern formats — AVIF + WebP via <code>&lt;picture&gt;</code> with JPEG fallback.</li>
      <li>Responsive variants — <code>srcset</code> + <code>sizes</code> per viewport / DPR.</li>
      <li>Aggressive compression — quality 75-85.</li>
      <li>Dimensions specified — width/height or aspect-ratio (no CLS).</li>
      <li>LCP image: eager + <code>fetchpriority="high"</code> + preload.</li>
      <li>Below-the-fold: <code>loading="lazy"</code> + <code>fetchpriority="low"</code>.</li>
      <li>Async decode: <code>decoding="async"</code>.</li>
      <li>Placeholders: blurhash / LQIP for instant feedback.</li>
      <li>CDN with content negotiation: serves AVIF/WebP/JPEG per Accept header.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Explain srcset + sizes.</div>
  <div class="qa-answer">
    <p><code>srcset</code> lists candidate URLs with width descriptors (<code>img-800.jpg 800w</code>). <code>sizes</code> tells the browser how wide the image will be displayed at various viewports (<code>(max-width: 600px) 100vw, 800px</code>). Browser computes effective pixel size from sizes × DPR, picks the smallest srcset entry that's ≥ that target. Net: each user gets the smallest image that's still sharp on their screen.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. What's the difference between preload and prefetch?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>preload</strong>: high-priority, fetch immediately for current page (<code>as=...</code> tells browser the resource type).</li>
      <li><strong>prefetch</strong>: low-priority idle fetch, typically for next-page navigation.</li>
      <li>Use preload on critical above-the-fold resources (hero image, hero font); prefetch for likely follow-up routes.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Walk through font loading optimizations.</div>
  <div class="qa-answer">
    <ol>
      <li>Self-host (avoid third-party DNS/TLS).</li>
      <li>WOFF2 only.</li>
      <li>Subset to actually-used characters.</li>
      <li>Preload critical fonts: <code>&lt;link rel="preload" as="font" crossorigin&gt;</code>.</li>
      <li><code>font-display: swap</code> (or <code>optional</code> for stricter LCP).</li>
      <li>Variable fonts: one file vs many weight files.</li>
      <li>Match fallback metrics via <code>size-adjust</code> / <code>ascent-override</code> to reduce CLS on swap.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. font-display values?</div>
  <div class="qa-answer">
    <ul>
      <li><code>auto</code> — browser default, often block-like.</li>
      <li><code>block</code> — invisible up to 3s, then swap.</li>
      <li><code>swap</code> — fallback immediately, swap when ready (FOUT).</li>
      <li><code>fallback</code> — brief invisible, then fallback; swap if loaded within 3s.</li>
      <li><code>optional</code> — brief invisible; if not loaded fast, fallback for the session (no swap, no CLS).</li>
    </ul>
    <p>Default to <code>swap</code> for general use; <code>optional</code> if LCP is dominated by font load.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. fetchpriority — when do you use it?</div>
  <div class="qa-answer">
    <p>Override the browser's default priority heuristics. <code>high</code> for the LCP candidate (hero image); <code>low</code> for thumbnails or below-the-fold. Browsers prioritize stylesheets and fonts already; images need explicit help. Use sparingly — too many highs cancel out.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Why use a CDN for images?</div>
  <div class="qa-answer">
    <ul>
      <li>Geographic distribution — serve from POP near user, lower TTFB.</li>
      <li>Content negotiation — return AVIF/WebP/JPEG based on Accept header.</li>
      <li>On-the-fly resize — one source URL, dynamic dimensions.</li>
      <li>Caching — long TTL on edge.</li>
      <li>Bandwidth savings — automatic compression.</li>
    </ul>
    <p>Tools: Cloudinary, Imgix, Cloudflare Images, AWS / Vercel image optimization.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How do you avoid CLS from images?</div>
  <div class="qa-answer">
    <p>Always specify <code>width</code> and <code>height</code> attributes (browsers reserve aspect-ratio space). Or use CSS <code>aspect-ratio: 16/9; width: 100%; height: auto</code>. For variable images, use blurhash or LQIP placeholder to occupy space immediately.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. What are blurhash / thumbhash / LQIP?</div>
  <div class="qa-answer">
    <p>Tiny placeholder representations of an image:</p>
    <ul>
      <li><strong>LQIP (Low-Quality Image Placeholder)</strong>: a heavily compressed, tiny version (e.g., 20px tall, 70% quality) inlined as data URL.</li>
      <li><strong>Blurhash</strong>: ~30 character string encoding a blurry approximation; client decodes into canvas.</li>
      <li><strong>Thumbhash</strong>: similar to blurhash, smaller string, slightly better quality.</li>
    </ul>
    <p>Show placeholder instantly while the real image loads; fade in when ready. Improves perceived perf without bytes.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Why prefer variable fonts?</div>
  <div class="qa-answer">
    <p>One file contains a continuous range of weights/widths/styles via "axes." Common axes: weight, width, slant, optical size. Saves bytes vs. shipping separate files (e.g., 4 weights × 2 styles = 8 files, vs 1 variable file). Modern browsers all support WOFF2 with variations.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Subset Inter for an English-only app — how?</div>
  <div class="qa-answer">
<pre><code># Glyphhanger:
npx glyphhanger --whitelist=US_ASCII,latin,latin-ext --formats=woff2 fonts/Inter.ttf
# Outputs Inter-subset.woff2 with only Latin glyphs
# Original 800KB → subsetted 50-80KB</code></pre>
    <p>Or use the <code>fonttools</code> Python library (<code>pyftsubset</code>) for granular control. Critical for CJK fonts where unsubsetted = MB.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. SVG vs PNG vs WebP for icons?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>SVG</strong>: vector, scalable, tiny for simple shapes. Best for UI icons.</li>
      <li><strong>WebP</strong>: raster, smaller than PNG for photos. Use for actual photos.</li>
      <li><strong>PNG</strong>: legacy, large; reserve for transparency where WebP isn't supported.</li>
    </ul>
    <p>For icons: prefer SVG. For photos: WebP / AVIF.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. How would you measure font impact on LCP?</div>
  <div class="qa-answer">
    <ol>
      <li>Run Lighthouse / WebPageTest with throttling.</li>
      <li>Compare LCP with and without preload + display: swap.</li>
      <li>Inspect filmstrip: when does text render? When does font swap?</li>
      <li>Use <code>document.fonts.ready</code> + Performance.mark to log time-to-fonts in production RUM.</li>
      <li>Try <code>font-display: optional</code> to see lower-bound LCP (no font wait).</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Should I use system fonts only?</div>
  <div class="qa-answer">
    <p>If brand consistency isn't critical: yes. Modern OS fonts (San Francisco on iOS/macOS, Roboto on Android, Segoe UI on Windows) are excellent. Saves 30-300KB. Trade-off: different look across platforms. For consumer brands, custom font is part of identity. For dashboards / tools, system fonts are often better.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Walk me through the perfect hero image markup.</div>
  <div class="qa-answer">
<pre><code class="language-html">&lt;link rel="preload" as="image" href="/hero.avif" type="image/avif" fetchpriority="high" /&gt;

&lt;picture&gt;
  &lt;source type="image/avif" srcset="/hero-800.avif 800w, /hero-1600.avif 1600w" sizes="100vw" /&gt;
  &lt;source type="image/webp" srcset="/hero-800.webp 800w, /hero-1600.webp 1600w" sizes="100vw" /&gt;
  &lt;img src="/hero-1600.jpg"
       srcset="/hero-800.jpg 800w, /hero-1600.jpg 1600w" sizes="100vw"
       width="1600" height="900"
       alt="Hero image"
       fetchpriority="high"
       decoding="async" /&gt;
&lt;/picture&gt;</code></pre>
    <p>Format negotiation, responsive sizing, dimensions, priority, async decode, preload — all the levers pulled together.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You use <code>&lt;picture&gt;</code> with AVIF + WebP + JPEG fallbacks.</li>
    <li>You set <code>srcset</code> + <code>sizes</code> for responsive images.</li>
    <li>You always specify dimensions (or aspect-ratio).</li>
    <li>You mark the LCP with <code>fetchpriority="high"</code> + preload.</li>
    <li>You lazy-load below the fold.</li>
    <li>You self-host fonts in WOFF2, subsetted.</li>
    <li>You use <code>font-display: swap</code> or <code>optional</code>.</li>
    <li>You preload critical fonts with <code>crossorigin</code>.</li>
    <li>You match fallback font metrics to minimize CLS.</li>
    <li>You consider variable fonts and system fonts as alternatives.</li>
  </ul>
</div>
`}

]
});
