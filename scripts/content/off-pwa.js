window.PREP_SITE.registerTopic({
  id: 'off-pwa',
  module: 'offline',
  title: 'PWA Manifest & Install',
  estimatedReadTime: '45 min',
  tags: ['pwa', 'manifest', 'web-app-manifest', 'install', 'beforeinstallprompt', 'icons', 'splash', 'tauri', 'twa'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>A <strong>Progressive Web App (PWA)</strong> is a web app that, on top of the regular browser experience, can be <em>installed</em> to the home screen, run in its own window without browser chrome, work offline (via Service Worker), receive push notifications, and feel like a native app. The minimum-viable trio: <strong>HTTPS</strong>, a <strong>Web App Manifest</strong> (a JSON file describing icon / name / display mode), and a <strong>Service Worker</strong> with a <code>fetch</code> handler.</p>
<ul>
  <li><strong>Manifest essentials:</strong> <code>name</code>, <code>short_name</code>, <code>icons</code> (192 + 512), <code>start_url</code>, <code>display</code> (<code>standalone</code> for app feel), <code>background_color</code>, <code>theme_color</code>.</li>
  <li><strong>Install prompt:</strong> Chrome / Edge fire <code>beforeinstallprompt</code> when criteria met; you decide when to call <code>.prompt()</code>. iOS Safari has no programmatic prompt — user must tap "Add to Home Screen" manually.</li>
  <li><strong>Display modes:</strong> <code>browser</code> (default), <code>minimal-ui</code>, <code>standalone</code> (no browser chrome — most "app-like"), <code>fullscreen</code>.</li>
  <li><strong>iOS quirks:</strong> Safari supports PWAs but has limited manifest support; relies on <code>apple-touch-icon</code> link tags + <code>apple-mobile-web-app-*</code> meta tags. Push notifications since iOS 16.4 (installed PWAs only).</li>
  <li><strong>Lighthouse PWA audit</strong> is the source-of-truth checklist: HTTPS, viewport, manifest, SW, offline, installability.</li>
  <li><strong>Beyond browser PWAs:</strong> Trusted Web Activities (Android — wrap PWA in APK for Play Store), Tauri / Capacitor (wrap web tech in native shell), Edge Side Panel apps.</li>
  <li><strong>RN angle:</strong> not a PWA, but the install / offline / push primitives map to native equivalents (App Store install, AsyncStorage / MMKV, FCM / APNs).</li>
</ul>
<p><strong>Mantra:</strong> "Manifest declares intent; Service Worker delivers behavior; Lighthouse keeps you honest. iOS gets a thinner version — design for that."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What "PWA" actually means</h3>
<p>A web app that meets a small set of criteria the browser uses to grant <em>app-like</em> capabilities: install to home screen, standalone window without URL bar, Service Worker for offline + push, file system access (in some browsers), background sync, app shortcuts, share targets.</p>

<h3>The minimum requirements</h3>
<table>
  <thead><tr><th>Requirement</th><th>Why</th></tr></thead>
  <tbody>
    <tr><td>HTTPS (or localhost)</td><td>Service Worker registration requires it; install prompts gated on it.</td></tr>
    <tr><td>Web App Manifest (<code>manifest.webmanifest</code> or <code>manifest.json</code>)</td><td>Declares name, icons, display mode, start URL.</td></tr>
    <tr><td>Service Worker with <code>fetch</code> handler</td><td>Browser checks for a registered SW that intercepts requests.</td></tr>
    <tr><td>Icons (at least 192px and 512px)</td><td>Home screen, splash screen, app switcher.</td></tr>
    <tr><td>Linked from HTML</td><td><code>&lt;link rel="manifest" href="/manifest.webmanifest"&gt;</code> in <code>&lt;head&gt;</code>.</td></tr>
  </tbody>
</table>

<h3>Why install matters</h3>
<table>
  <thead><tr><th>Stat</th><th>Source</th></tr></thead>
  <tbody>
    <tr><td>Installed PWAs see ~3× engagement vs browser visits</td><td>Pinterest, Starbucks, Twitter case studies</td></tr>
    <tr><td>Push notification opt-in higher when installed</td><td>Native-feeling app behavior signals trust</td></tr>
    <tr><td>~50% reduction in bounce rate for return visits</td><td>Splash + instant launch</td></tr>
    <tr><td>Discoverable in Play Store via Trusted Web Activity</td><td>Same as a native install funnel</td></tr>
    <tr><td>iOS Safari since 16.4 supports push for installed PWAs only</td><td>Apple's current stance: install or no push</td></tr>
  </tbody>
</table>

<h3>Why this matters in 2026</h3>
<ul>
  <li><strong>EU Digital Markets Act</strong> forces alternative app distribution channels; PWAs benefit indirectly.</li>
  <li><strong>Apple's iOS 17.4 mishap</strong> (briefly removed PWA support in EU) showed Apple's leverage; Apple reversed under pressure.</li>
  <li><strong>Capacitor / Tauri</strong> ecosystems make web → native straightforward; PWA-as-baseline is a realistic strategy.</li>
  <li><strong>Microsoft Store, Galaxy Store</strong> accept PWAs directly.</li>
  <li><strong>Play Store</strong> accepts Trusted Web Activities (TWAs) — PWA wrapped in a thin APK, indistinguishable from a native install.</li>
</ul>

<h3>What "good PWA" looks like</h3>
<ul>
  <li>Lighthouse PWA score 100.</li>
  <li>Installable on Chrome, Edge, Android Chrome, Samsung Internet automatically.</li>
  <li>iOS users see "Add to Home Screen" guidance with apple-specific meta tags.</li>
  <li>Splash screen branded, no flash of white.</li>
  <li>Standalone display: no browser chrome, looks like an app.</li>
  <li>Maskable icons used so Android adapts to system shape.</li>
  <li>Offline-capable (SW caches shell + offline page).</li>
  <li>Push notifications wired with VAPID keys + permission UX.</li>
  <li>App shortcuts in manifest for power users (long-press app icon → quick actions).</li>
  <li>Share target enabled — PWA appears in OS share sheet.</li>
  <li>Update flow surfaced: "New version available; refresh."</li>
</ul>

<h3>What "bad PWA" looks like</h3>
<ul>
  <li>Manifest missing required fields; install button silent.</li>
  <li>Single 192px PNG icon; looks blurry on launch.</li>
  <li>Hard-coded white splash; bad on dark devices.</li>
  <li>No SW or SW without <code>fetch</code> handler; not installable.</li>
  <li>iOS-specific tags missing; appears as default Safari icon.</li>
  <li>No push permission flow; or asks immediately on first visit.</li>
  <li>Standalone mode but app still navigates to external links inside the PWA frame.</li>
  <li>Update never surfaced; users stuck on stale code.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The Web App Manifest</h3>
<p>A JSON file the browser reads when the page loads (via <code>&lt;link rel="manifest"&gt;</code>). Declarative — no code runs.</p>

<pre><code class="language-json">{
  "name": "Prep Site",
  "short_name": "Prep",
  "description": "FAANG + RN interview prep",
  "start_url": "/?source=pwa",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0a0a0a",
  "theme_color": "#0a0a0a",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "categories": ["education", "productivity"],
  "shortcuts": [
    {
      "name": "Today's question",
      "url": "/today",
      "icons": [{ "src": "/icons/today.png", "sizes": "96x96" }]
    }
  ],
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  }
}
</code></pre>

<h3>Key fields</h3>
<table>
  <thead><tr><th>Field</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td><code>name</code></td><td>Full app name; shown on install prompt + splash.</td></tr>
    <tr><td><code>short_name</code></td><td>Home screen label; ≤ 12 chars.</td></tr>
    <tr><td><code>start_url</code></td><td>URL launched on app open. Use a query param (<code>?source=pwa</code>) for analytics.</td></tr>
    <tr><td><code>scope</code></td><td>URLs treated as "in-app." Outside scope opens in browser. Default <code>./</code>.</td></tr>
    <tr><td><code>display</code></td><td><code>browser</code> / <code>minimal-ui</code> / <code>standalone</code> / <code>fullscreen</code>. <code>standalone</code> is the typical "app feel."</td></tr>
    <tr><td><code>orientation</code></td><td>Lock to portrait / landscape; or <code>any</code>.</td></tr>
    <tr><td><code>background_color</code></td><td>Splash screen background. Should match initial app color.</td></tr>
    <tr><td><code>theme_color</code></td><td>UI chrome color (status bar, nav). Match brand.</td></tr>
    <tr><td><code>icons</code></td><td>Array of icon variants by size + purpose.</td></tr>
    <tr><td><code>shortcuts</code></td><td>Long-press app icon → quick actions menu (Android, Windows).</td></tr>
    <tr><td><code>share_target</code></td><td>Make the PWA appear in OS share sheet.</td></tr>
    <tr><td><code>protocol_handlers</code></td><td>Register a custom URL scheme.</td></tr>
    <tr><td><code>file_handlers</code></td><td>Register file extensions to open.</td></tr>
    <tr><td><code>categories</code></td><td>Hint for app store listings.</td></tr>
  </tbody>
</table>

<h3>Display modes</h3>
<table>
  <thead><tr><th>Mode</th><th>What user sees</th></tr></thead>
  <tbody>
    <tr><td><code>browser</code></td><td>Normal browser; URL bar, tabs, all chrome.</td></tr>
    <tr><td><code>minimal-ui</code></td><td>Minimal browser chrome — back button + URL display only.</td></tr>
    <tr><td><code>standalone</code></td><td>No browser chrome; looks like a native app. Status bar tinted by <code>theme_color</code>.</td></tr>
    <tr><td><code>fullscreen</code></td><td>Truly full screen; hides system UI. Use for games / immersive content.</td></tr>
    <tr><td><code>window-controls-overlay</code> (desktop)</td><td>App draws into the title bar area; advanced.</td></tr>
  </tbody>
</table>

<h3>Icons + maskable purpose</h3>
<p>Android adapts icons to the OEM's mask shape (circle, squircle, hexagon). A square icon gets clipped — corners disappear. Solution: <strong>maskable icon</strong> with the logo centered inside a "safe zone" (outer 20% may be cropped).</p>
<pre><code class="language-json">{
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
</code></pre>
<p>Tools: <code>maskable.app</code> previews how your icon will look across OEMs.</p>

<h3>iOS-specific tags (no manifest support for these)</h3>
<pre><code class="language-html">&lt;!-- in &lt;head&gt; --&gt;
&lt;link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png"&gt;
&lt;link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180.png"&gt;
&lt;meta name="apple-mobile-web-app-capable" content="yes"&gt;
&lt;meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"&gt;
&lt;meta name="apple-mobile-web-app-title" content="Prep"&gt;
&lt;meta name="theme-color" content="#0a0a0a"&gt;
</code></pre>
<p>iOS Safari ignores most of the manifest. These meta + link tags are how you control the iOS install experience.</p>

<h3>The install prompt</h3>
<table>
  <thead><tr><th>Browser</th><th>Install API</th></tr></thead>
  <tbody>
    <tr><td>Chrome (desktop + Android)</td><td>Fires <code>beforeinstallprompt</code> when criteria met. You call <code>.prompt()</code>. Auto-shows mini-infobar.</td></tr>
    <tr><td>Edge</td><td>Same as Chrome.</td></tr>
    <tr><td>Samsung Internet</td><td>Same.</td></tr>
    <tr><td>Firefox (desktop)</td><td>No automatic install; user must click address bar icon.</td></tr>
    <tr><td>Firefox Android</td><td>"Install" appears in main menu.</td></tr>
    <tr><td>Safari iOS</td><td>No programmatic prompt. User must Share → Add to Home Screen.</td></tr>
    <tr><td>Safari macOS (Sonoma+)</td><td>"Add to Dock" via File menu.</td></tr>
  </tbody>
</table>

<h3>Installability criteria (Chrome)</h3>
<ol>
  <li>Manifest with <code>name</code>, <code>short_name</code>, icons (≥ 192px + ≥ 512px), <code>start_url</code>, <code>display</code> in (<code>standalone</code>, <code>fullscreen</code>, <code>minimal-ui</code>).</li>
  <li>Service Worker registered with a <code>fetch</code> handler.</li>
  <li>Served over HTTPS.</li>
  <li>Page is visible to the user.</li>
  <li>User has interacted with the page (typically a click or significant time).</li>
</ol>

<h3>Lighthouse PWA audit</h3>
<table>
  <thead><tr><th>Check</th><th>Pass condition</th></tr></thead>
  <tbody>
    <tr><td>Web app manifest</td><td>Has all required fields</td></tr>
    <tr><td>Service Worker</td><td>Registered + handles fetch</td></tr>
    <tr><td>Offline ready</td><td>Loads while offline (responds with 200)</td></tr>
    <tr><td>Viewport meta</td><td>Set with width=device-width</td></tr>
    <tr><td>Apple touch icon</td><td>Present in head</td></tr>
    <tr><td>Themed splash screen</td><td>theme_color + background_color set</td></tr>
    <tr><td>Maskable icon</td><td>At least one icon with purpose maskable</td></tr>
    <tr><td>Content sized for viewport</td><td>No horizontal scroll; controls reachable</td></tr>
  </tbody>
</table>

<h3>The PWA → Native ladder</h3>
<table>
  <thead><tr><th>Step</th><th>What it gives you</th></tr></thead>
  <tbody>
    <tr><td>Just a website</td><td>Browser tab, no install</td></tr>
    <tr><td>+ Manifest</td><td>"Add to Home Screen" works</td></tr>
    <tr><td>+ Service Worker (with fetch)</td><td>Installable + offline</td></tr>
    <tr><td>+ Push, badging, share target</td><td>App-like</td></tr>
    <tr><td>Trusted Web Activity (Android)</td><td>Wrapped in APK; published to Play Store</td></tr>
    <tr><td>Capacitor / Tauri</td><td>Real native shell with full system access</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Bare-minimum PWA</h3>
<pre><code class="language-html">&lt;!-- index.html --&gt;
&lt;!DOCTYPE html&gt;
&lt;html lang="en"&gt;
&lt;head&gt;
  &lt;meta charset="UTF-8" /&gt;
  &lt;meta name="viewport" content="width=device-width, initial-scale=1.0" /&gt;
  &lt;title&gt;My PWA&lt;/title&gt;

  &lt;link rel="manifest" href="/manifest.webmanifest" /&gt;
  &lt;meta name="theme-color" content="#0058A3" /&gt;

  &lt;!-- iOS specific --&gt;
  &lt;meta name="apple-mobile-web-app-capable" content="yes" /&gt;
  &lt;meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" /&gt;
  &lt;meta name="apple-mobile-web-app-title" content="My PWA" /&gt;
  &lt;link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" /&gt;
&lt;/head&gt;
&lt;body&gt;
  &lt;div id="app"&gt;Hello&lt;/div&gt;
  &lt;script src="/app.js" defer&gt;&lt;/script&gt;
&lt;/body&gt;
&lt;/html&gt;
</code></pre>

<pre><code class="language-json">// /manifest.webmanifest
{
  "name": "My PWA",
  "short_name": "MyPWA",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0058A3",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
</code></pre>

<pre><code class="language-javascript">// /app.js — register SW
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () =&gt; {
    navigator.serviceWorker.register('/sw.js');
  });
}
</code></pre>

<pre><code class="language-javascript">// /sw.js — minimal fetch handler
self.addEventListener('install', e =&gt; e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', e =&gt; e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () =&gt; { /* even an empty handler counts for installability */ });
</code></pre>

<h3>Install prompt UX (Chrome / Edge / Android Chrome)</h3>
<pre><code class="language-javascript">let deferredPrompt;

window.addEventListener('beforeinstallprompt', (event) =&gt; {
  event.preventDefault(); // suppress mini-infobar
  deferredPrompt = event;
  showInstallButton();
});

function showInstallButton() {
  const btn = document.getElementById('install-btn');
  btn.hidden = false;
  btn.addEventListener('click', async () =&gt; {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('Install outcome:', outcome); // 'accepted' or 'dismissed'
    deferredPrompt = null;
    btn.hidden = true;
  });
}

window.addEventListener('appinstalled', () =&gt; {
  console.log('PWA installed');
  deferredPrompt = null;
  hideInstallButton();
  // Clean analytics: track install
  fetch('/api/track/install', { method: 'POST' });
});
</code></pre>

<h3>iOS install guidance</h3>
<pre><code class="language-javascript">function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) &amp;&amp; !window.MSStream;
}

function isInStandaloneMode() {
  return ('standalone' in navigator) &amp;&amp; (navigator).standalone;
}

if (isIOS() &amp;&amp; !isInStandaloneMode()) {
  showIOSInstallBanner({
    message: 'Tap the Share icon and choose "Add to Home Screen" to install.',
    icon: '/icons/share-ios.svg',
  });
}
</code></pre>

<h3>Detecting display mode</h3>
<pre><code class="language-javascript">function getDisplayMode() {
  const mqStandalone = window.matchMedia('(display-mode: standalone)');
  if (document.referrer.startsWith('android-app://')) return 'twa';
  if ((navigator).standalone || mqStandalone.matches) return 'standalone';
  return 'browser';
}
</code></pre>

<h3>App shortcuts (long-press menu)</h3>
<pre><code class="language-json">{
  "shortcuts": [
    {
      "name": "Today's question",
      "short_name": "Today",
      "description": "Open today's interview question",
      "url": "/today",
      "icons": [{ "src": "/icons/today-96.png", "sizes": "96x96" }]
    },
    {
      "name": "Bookmarks",
      "url": "/bookmarks",
      "icons": [{ "src": "/icons/bookmark-96.png", "sizes": "96x96" }]
    }
  ]
}
</code></pre>

<h3>Share target — appear in OS share sheet</h3>
<pre><code class="language-json">{
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        { "name": "image", "accept": ["image/*"] }
      ]
    }
  }
}
</code></pre>

<pre><code class="language-javascript">// Server side: handle POST /share
app.post('/share', upload.single('image'), (req, res) =&gt; {
  const { title, text, url } = req.body;
  // Process — maybe redirect to /compose?title=...&amp;url=...
  res.redirect(\`/compose?title=\${encodeURIComponent(title)}&amp;url=\${encodeURIComponent(url)}\`);
});
</code></pre>

<h3>Splash screen (Android + iOS)</h3>
<ul>
  <li><strong>Android:</strong> Auto-generated from <code>name</code> + <code>icons[512]</code> + <code>background_color</code>.</li>
  <li><strong>iOS:</strong> Static image; one per screen size. Painful — use a generator (e.g., <code>pwa-asset-generator</code>) to produce 8+ variants.</li>
</ul>

<pre><code class="language-html">&lt;!-- iOS splash variants in head --&gt;
&lt;link rel="apple-touch-startup-image"
      media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
      href="/splash/iphone-13.png" /&gt;
&lt;!-- ... 7 more for various devices --&gt;
</code></pre>

<h3>Trusted Web Activity (Android Play Store)</h3>
<p>Wrap your PWA in a thin Android APK; ship to Play Store. User installs from Play Store; app opens your PWA in a Chrome Custom Tab without browser chrome — looks identical to native.</p>
<table>
  <thead><tr><th>Tool</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td>Bubblewrap CLI</td><td>Generate TWA project from manifest</td></tr>
    <tr><td>PWABuilder</td><td>Microsoft web tool to generate TWA + Windows package</td></tr>
    <tr><td>Digital Asset Links</td><td>Server-side file proves PWA + APK ownership</td></tr>
  </tbody>
</table>
<pre><code class="language-bash">npx @bubblewrap/cli init --manifest https://my-pwa.com/manifest.webmanifest
npx @bubblewrap/cli build
# Upload .apk / .aab to Play Console
</code></pre>

<h3>Build pipeline integration</h3>
<table>
  <thead><tr><th>Tool</th><th>What it does</th></tr></thead>
  <tbody>
    <tr><td><code>vite-plugin-pwa</code></td><td>Generates manifest + Workbox SW; auto-injects link tags.</td></tr>
    <tr><td><code>workbox-webpack-plugin</code></td><td>Webpack plugin; wraps Workbox + manifest.</td></tr>
    <tr><td><code>next-pwa</code></td><td>Next.js plugin (community).</td></tr>
    <tr><td><code>@angular/service-worker</code></td><td>Angular built-in.</td></tr>
    <tr><td><code>workbox-cli</code></td><td>CLI to generate SW from a config.</td></tr>
  </tbody>
</table>

<pre><code class="language-typescript">// vite.config.ts
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'My PWA',
        short_name: 'MyPWA',
        theme_color: '#0058A3',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'icons/192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
});
</code></pre>

<h3>App badging (unread count on app icon)</h3>
<pre><code class="language-javascript">// Set badge with unread count
if ('setAppBadge' in navigator) {
  await navigator.setAppBadge(unreadCount);
}

// Clear
if ('clearAppBadge' in navigator) {
  await navigator.clearAppBadge();
}
</code></pre>
<p>Supported on Chromium-based browsers + Edge; not Safari (yet).</p>

<h3>File handlers</h3>
<pre><code class="language-json">{
  "file_handlers": [
    {
      "action": "/open-file",
      "accept": { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] }
    }
  ]
}
</code></pre>
<p>OS associates your PWA with file types; opening a PNG can launch your PWA. Limited support; experimental on Chromium.</p>

<h3>Protocol handlers</h3>
<pre><code class="language-json">{
  "protocol_handlers": [
    { "protocol": "web+myapp", "url": "/handle?url=%s" }
  ]
}
</code></pre>
<p>Register a custom URL scheme; <code>web+myapp://abc123</code> opens your PWA.</p>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Full PWA setup with vite-plugin-pwa</h3>
<pre><code class="language-typescript">// vite.config.ts
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'prompt', // surface update prompt to user
      includeAssets: ['favicon.ico', 'apple-touch-icon-180.png'],
      manifest: {
        name: 'Prep Site',
        short_name: 'Prep',
        description: 'FAANG + RN interview prep',
        theme_color: '#0a0a0a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/?source=pwa',
        icons: [
          { src: '/icons/192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Today', url: '/today', icons: [{ src: '/icons/today-96.png', sizes: '96x96' }] },
          { name: 'Bookmarks', url: '/bookmarks', icons: [{ src: '/icons/bookmark-96.png', sizes: '96x96' }] },
        ],
        share_target: {
          action: '/share',
          method: 'POST',
          params: { title: 'title', text: 'text', url: 'url' },
        },
      },
      workbox: {
        navigateFallback: '/offline.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\\/\\/api\\.example\\.com\\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', networkTimeoutSeconds: 3 },
          },
          {
            urlPattern: /\\.(png|jpg|webp|avif|svg|woff2)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'assets',
              expiration: { maxEntries: 200, maxAgeSeconds: 30 * 86400 },
            },
          },
        ],
      },
    }),
  ],
});
</code></pre>

<h3>Example 2: Install button + iOS guidance</h3>
<pre><code class="language-typescript">import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise&lt;void&gt;;
  userChoice: Promise&lt;{ outcome: 'accepted' | 'dismissed' }&gt;;
}

export function useInstallPrompt() {
  const [prompt, setPrompt] = useState&lt;BeforeInstallPromptEvent | null&gt;(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() =&gt; {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    setIsInstalled(window.matchMedia('(display-mode: standalone)').matches ||
                   (navigator).standalone);

    const handler = (e: Event) =&gt; {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () =&gt; {
      setIsInstalled(true);
      setPrompt(null);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () =&gt; {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const install = async () =&gt; {
    if (!prompt) return null;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    setPrompt(null);
    return choice.outcome;
  };

  return { canInstall: !!prompt, isInstalled, isIOS, install };
}

function InstallBanner() {
  const { canInstall, isInstalled, isIOS, install } = useInstallPrompt();

  if (isInstalled) return null;

  if (canInstall) {
    return (
      &lt;div className="banner"&gt;
        &lt;span&gt;Install Prep Site for offline access&lt;/span&gt;
        &lt;button onClick={install}&gt;Install&lt;/button&gt;
      &lt;/div&gt;
    );
  }

  if (isIOS) {
    return (
      &lt;div className="banner"&gt;
        Tap &lt;img src="/icons/ios-share.svg" alt="Share" /&gt; then
        &lt;strong&gt;Add to Home Screen&lt;/strong&gt; to install.
      &lt;/div&gt;
    );
  }

  return null;
}
</code></pre>

<h3>Example 3: Update prompt UX</h3>
<pre><code class="language-typescript">// using vite-plugin-pwa
import { useRegisterSW } from 'virtual:pwa-register/react';

function UpdatePrompt() {
  const { offlineReady: [offlineReady], needRefresh: [needRefresh], updateServiceWorker } =
    useRegisterSW({
      onRegistered() { console.log('SW registered'); },
      onRegisterError(err) { console.error('SW reg failed', err); },
    });

  if (offlineReady) {
    return &lt;Banner type="success" message="App ready to work offline." onDismiss={() =&gt; {}} /&gt;;
  }

  if (needRefresh) {
    return (
      &lt;Banner type="info"
              message="New version available."
              actions={[
                { label: 'Refresh', onPress: () =&gt; updateServiceWorker(true) },
                { label: 'Later', onPress: () =&gt; {} },
              ]} /&gt;
    );
  }

  return null;
}
</code></pre>

<h3>Example 4: Push notification setup (web)</h3>
<pre><code class="language-typescript">// page side: ask for permission + subscribe
async function subscribeUserToPush() {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  // Send subscription to backend
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sub),
  });
}

function urlBase64ToUint8Array(b64: string) {
  const padding = '='.repeat((4 - b64.length % 4) % 4);
  const raw = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(raw), c =&gt; c.charCodeAt(0));
}

// Trigger subscription only after user opt-in (e.g., button press)
document.getElementById('enable-notifications').addEventListener('click', async () =&gt; {
  const result = await Notification.requestPermission();
  if (result === 'granted') await subscribeUserToPush();
});
</code></pre>

<pre><code class="language-javascript">// sw.js: handle incoming push
self.addEventListener('push', (event) =&gt; {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Update', {
      body: data.body,
      icon: '/icons/192.png',
      badge: '/icons/badge-72.png',
      data: { url: data.url ?? '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) =&gt; {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
</code></pre>

<h3>Example 5: Trusted Web Activity for Play Store</h3>
<pre><code class="language-bash"># From the manifest URL of your live PWA
npx @bubblewrap/cli init --manifest https://prep-site.com/manifest.webmanifest

# Build APK / AAB
npx @bubblewrap/cli build

# Output: app-release-bundle.aab — upload to Play Console
</code></pre>
<pre><code class="language-json">// /.well-known/assetlinks.json — proves PWA + APK relationship
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.prepsite.twa",
    "sha256_cert_fingerprints": ["AB:CD:EF:..."]
  }
}]
</code></pre>

<h3>Example 6: Auto-pin app on first install (Edge sidebar)</h3>
<pre><code class="language-typescript">// Edge supports "side panel" PWA pinning
async function pinToSidePanel() {
  if ('sidebar' in navigator) {
    // Edge / Chromium experimental
    await (navigator).sidebar.pin('/sidebar', 'My PWA Sidebar');
  }
}
</code></pre>

<h3>Example 7: Telemetry on install funnel</h3>
<pre><code class="language-typescript">// Track all install funnel events
window.addEventListener('beforeinstallprompt', () =&gt; {
  analytics.track('pwa.install_prompt_eligible');
});

window.addEventListener('appinstalled', () =&gt; {
  analytics.track('pwa.installed');
});

// Display mode tells you if user is currently in PWA
const mode = window.matchMedia('(display-mode: standalone)').matches ? 'pwa' : 'browser';
analytics.identify({ display_mode: mode });
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>iOS Safari quirks</h3>
<ul>
  <li>Limited manifest support — most fields ignored. Use apple-* meta tags.</li>
  <li>No <code>beforeinstallprompt</code>; user must Share → Add to Home Screen.</li>
  <li>Push notifications since iOS 16.4 — only for installed PWAs.</li>
  <li>No Background Sync; no Periodic Sync.</li>
  <li>Storage eviction after ~7 days idle (unless installed).</li>
  <li>Standalone mode loses login session if user navigates to external link.</li>
  <li>Shared cookies between Safari + installed PWA — clearing Safari clears PWA.</li>
</ul>

<h3>The mini-infobar (Chrome)</h3>
<ul>
  <li>Chrome auto-shows a "Add to Home screen" infobar on Android when criteria met.</li>
  <li>Suppressing requires <code>e.preventDefault()</code> in <code>beforeinstallprompt</code>.</li>
  <li>Don't suppress without your own UI — users miss the install opportunity.</li>
</ul>

<h3>Re-prompting after dismissal</h3>
<ul>
  <li>Once user dismisses install prompt, browser won't re-fire <code>beforeinstallprompt</code> for ~3 months.</li>
  <li>Track in your analytics; you may need to ride out a re-engagement period.</li>
  <li>Don't pop install prompt on every visit; user fatigue.</li>
</ul>

<h3>Update detection</h3>
<ul>
  <li>SW must change byte-for-byte for the browser to consider it new.</li>
  <li>If your build hashes filenames but the SW is identical, no update detected.</li>
  <li>Inject a build timestamp / version comment into the SW for forced detection.</li>
</ul>

<h3>Standalone navigation</h3>
<ul>
  <li>Links inside scope navigate within the PWA.</li>
  <li>Links outside scope (e.g., external URLs) open in browser by default.</li>
  <li>To force external links to open in browser even within scope, use <code>target="_blank"</code> + check display mode.</li>
</ul>

<h3>Splash screen mismatch</h3>
<ul>
  <li>Manifest <code>background_color</code> shows during splash; if your initial paint is dark and background is white → flash.</li>
  <li>Match background to your initial paint color.</li>
  <li>iOS uses static splash images per device size — generate via <code>pwa-asset-generator</code>.</li>
</ul>

<h3>Icon adaptation</h3>
<ul>
  <li>Square icons get cropped on Android OEMs with non-square masks.</li>
  <li>Use maskable icons with safe zone (logo in center 80%).</li>
  <li>Test with maskable.app preview.</li>
</ul>

<h3>Scope changes between deploys</h3>
<ul>
  <li>Changing <code>scope</code> from <code>/</code> to <code>/app/</code> orphans installed users — their app launches a URL outside scope.</li>
  <li>Don't change scope post-install. Plan it once; live with it.</li>
</ul>

<h3>start_url with query params</h3>
<ul>
  <li><code>?source=pwa</code> tracks installs in analytics; users coming from PWA show up distinct from web.</li>
  <li>Don't put auth tokens in start_url; persists in install metadata.</li>
</ul>

<h3>App badging support</h3>
<ul>
  <li>Chromium browsers + Edge: yes.</li>
  <li>Safari: no (badge in dock for macOS standalone PWAs only).</li>
  <li>Always check feature: <code>'setAppBadge' in navigator</code>.</li>
</ul>

<h3>Push notification permission</h3>
<ul>
  <li>Don't request on first visit. Build trust first.</li>
  <li>Use a custom UI before triggering the browser prompt; user clicks "Enable" → then call <code>Notification.requestPermission()</code>.</li>
  <li>Once denied, you can't re-prompt; user must change in browser settings.</li>
  <li>iOS: only granted to installed PWAs.</li>
</ul>

<h3>TWA gotchas</h3>
<ul>
  <li>Digital Asset Links file (<code>/.well-known/assetlinks.json</code>) is mandatory; without it, TWA falls back to Custom Tab with browser chrome.</li>
  <li>Play Store policies still apply — content must comply.</li>
  <li>Updating the PWA updates the TWA's content; updating the APK requires Play Store release.</li>
  <li>Unique APK signing key per developer; rotate carefully.</li>
</ul>

<h3>Service Worker scope vs Manifest scope</h3>
<ul>
  <li>SW scope (defined by registration path) controls which fetches it intercepts.</li>
  <li>Manifest scope controls which URLs are "in app" for standalone display.</li>
  <li>They should match or SW scope ⊇ manifest scope.</li>
</ul>

<h3>Multi-origin / subdomain</h3>
<ul>
  <li>SW + manifest are origin-scoped. <code>app.example.com</code> and <code>www.example.com</code> are separate PWAs.</li>
  <li>If user has both installed, two icons appear.</li>
  <li>Consolidate to one origin if possible.</li>
</ul>

<h3>Browser storage clearing</h3>
<ul>
  <li>"Clear browsing data" wipes installed PWA data on Chrome / Edge.</li>
  <li>iOS Safari: clearing history clears PWA storage.</li>
  <li>Plan for: app boots fresh after user clears.</li>
</ul>

<h3>Lighthouse audit running on dev server</h3>
<ul>
  <li>Lighthouse PWA checks expect HTTPS; localhost is exempt but the production check is the real bar.</li>
  <li>Run against the deployed staging site; not your local dev server.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common PWA mistakes</h3>
<ol>
  <li><strong>Missing maskable icon.</strong> Android OEMs crop square icons; logo loses corners.</li>
  <li><strong>No iOS-specific tags.</strong> "Add to Home Screen" shows default Safari icon.</li>
  <li><strong>Hard-coded white splash.</strong> Flash on dark devices; brand suffers.</li>
  <li><strong>start_url without source param.</strong> No way to attribute PWA traffic.</li>
  <li><strong>Display mode set, but external links open in PWA frame.</strong> Confusing; no escape.</li>
  <li><strong>Auto-prompt for push on first visit.</strong> Bounce.</li>
  <li><strong>SW with no fetch handler.</strong> Not installable.</li>
  <li><strong>SW caches everything.</strong> Stale UI forever.</li>
  <li><strong>Manifest scope changed post-launch.</strong> Installed users orphaned.</li>
  <li><strong>Missing /offline.html.</strong> First network failure shows browser default.</li>
  <li><strong>Suppressing beforeinstallprompt without own UI.</strong> Users never see install option.</li>
  <li><strong>No update prompt.</strong> Users on stale build for weeks.</li>
</ol>

<h3>Anti-pattern: square-only icons</h3>
<pre><code class="language-json">// BAD — no maskable; cropped on Android
"icons": [
  { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" }
]

// GOOD — both regular and maskable
"icons": [
  { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
  { "src": "/icons/maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" }
]
</code></pre>

<h3>Anti-pattern: no iOS-specific tags</h3>
<pre><code class="language-html">&lt;!-- BAD — iOS shows Safari icon and "Untitled" --&gt;
&lt;link rel="manifest" href="/manifest.webmanifest" /&gt;

&lt;!-- GOOD — iOS reads these --&gt;
&lt;link rel="manifest" href="/manifest.webmanifest" /&gt;
&lt;link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" /&gt;
&lt;meta name="apple-mobile-web-app-capable" content="yes" /&gt;
&lt;meta name="apple-mobile-web-app-status-bar-style" content="default" /&gt;
&lt;meta name="apple-mobile-web-app-title" content="Prep" /&gt;
</code></pre>

<h3>Anti-pattern: bad splash background</h3>
<pre><code class="language-json">// BAD — splash flashes white before app loads dark
"background_color": "#ffffff", // app actually loads dark
"theme_color": "#0a0a0a"

// GOOD — match initial paint
"background_color": "#0a0a0a",
"theme_color": "#0a0a0a"
</code></pre>

<h3>Anti-pattern: prompt for push on first visit</h3>
<pre><code class="language-javascript">// BAD — visitor lands; immediately denied; can never re-ask
useEffect(() =&gt; {
  Notification.requestPermission(); // user has zero context
}, []);

// GOOD — earn the prompt
&lt;button onClick={async () =&gt; {
  // User has clicked an "Enable notifications" button
  const result = await Notification.requestPermission();
  if (result === 'granted') subscribeUserToPush();
}}&gt;Enable Notifications&lt;/button&gt;
</code></pre>

<h3>Anti-pattern: SW with no fetch handler</h3>
<pre><code class="language-javascript">// BAD — Chrome won't consider site installable
self.addEventListener('install', () =&gt; self.skipWaiting());
// missing fetch listener

// GOOD — even an empty fetch listener qualifies
self.addEventListener('install', () =&gt; self.skipWaiting());
self.addEventListener('fetch', () =&gt; { /* counts */ });
</code></pre>

<h3>Anti-pattern: changing scope mid-life</h3>
<p>Manifest <code>scope: "/"</code> on initial release; later changed to <code>scope: "/app/"</code> when site reorganized. Installed users now launch a URL outside scope; PWA opens in browser tab. Don't change scope; live with the original choice.</p>

<h3>Anti-pattern: install prompt without your own UI</h3>
<pre><code class="language-javascript">// BAD — suppress mini-infobar but never show prompt
window.addEventListener('beforeinstallprompt', (e) =&gt; {
  e.preventDefault();
  // ... never use deferredPrompt
});

// GOOD — show your own button at appropriate moment
window.addEventListener('beforeinstallprompt', (e) =&gt; {
  e.preventDefault();
  deferredPrompt = e;
  showInstallButton(); // visible UI; user clicks to install
});
</code></pre>

<h3>Anti-pattern: no offline page</h3>
<pre><code class="language-javascript">// BAD — first network failure → browser default error
// (no fallback in fetch handler)

// GOOD — cache offline.html in install; fallback in navigate handler
self.addEventListener('install', (e) =&gt; e.waitUntil(
  caches.open('shell').then(c =&gt; c.add('/offline.html'))
));
self.addEventListener('fetch', (e) =&gt; {
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() =&gt; caches.match('/offline.html')));
  }
});
</code></pre>

<h3>Anti-pattern: TWA without Digital Asset Links</h3>
<pre><code class="language-text">// BAD — TWA opens in Custom Tab with browser chrome (URL bar visible)
// fix: ship /.well-known/assetlinks.json proving PWA-APK ownership
</code></pre>

<h3>Anti-pattern: testing only locally</h3>
<p>Lighthouse PWA score on localhost is misleading; HTTPS check is bypassed. Run against staging URL to catch real issues.</p>

<h3>Anti-pattern: forgetting iOS splash images</h3>
<p>iOS Safari needs static splash images per device. Without them, the install shows a blank white screen during launch. Use <code>pwa-asset-generator</code> to produce 8+ device-specific splash variants.</p>

<h3>Anti-pattern: theme_color that doesn't match brand</h3>
<p>theme_color tints the status bar in standalone mode. Mismatched with app body = jarring transition. Pick a value that matches your top app bar color.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common PWA interview prompts</h3>
<ol>
  <li>What makes a web app a PWA?</li>
  <li>Walk me through the manifest fields and why each matters.</li>
  <li>How do you implement install prompt UX?</li>
  <li>Compare PWA vs native vs Trusted Web Activity for distribution.</li>
  <li>Why doesn't iOS support beforeinstallprompt?</li>
  <li>How do you handle PWA updates?</li>
  <li>Lighthouse PWA audit — what does it check?</li>
  <li>Tell me about a time you shipped or improved a PWA.</li>
</ol>

<h3>The 5-step framework for "make this a PWA"</h3>
<ol>
  <li><strong>Audit:</strong> HTTPS? Manifest? SW? Icons? iOS-specific tags?</li>
  <li><strong>Add manifest</strong> with required fields + maskable icon.</li>
  <li><strong>Add SW</strong> with at least a fetch handler + offline fallback.</li>
  <li><strong>Add iOS tags</strong> for splash + icon + status bar.</li>
  <li><strong>Add install + update UX</strong> — beforeinstallprompt + iOS guidance + update prompt.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"Manifest declares intent (icons, name, display); SW delivers behavior (offline, push); both required for installability."</em></li>
  <li><em>"Maskable icons because Android OEMs apply different mask shapes; logo needs to live in the safe zone."</em></li>
  <li><em>"iOS Safari ignores most of the manifest; relies on apple-touch-icon + apple-mobile-web-app-* meta tags. Plan for that — design parallel UX."</em></li>
  <li><em>"vite-plugin-pwa or workbox-webpack-plugin for the build pipeline; rolling your own manifest + Workbox config is bug-attractant."</em></li>
  <li><em>"beforeinstallprompt only fires once per user-eligibility cycle; suppress the mini-infobar AND show your own install button at the right moment."</em></li>
  <li><em>"Trusted Web Activity for Play Store distribution — PWA wrapped in thin APK with Digital Asset Links proving ownership; indistinguishable from native install."</em></li>
  <li><em>"Update flow: prompt the user; skipWaiting on confirm; controllerchange triggers reload. Silent updates can lose work."</em></li>
  <li><em>"Lighthouse PWA score 100 isn't the goal — installable + offline-capable + accessible is."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"installable web app"</td><td>Manifest + SW + icons + HTTPS</td></tr>
    <tr><td>"app feel"</td><td>display: standalone + theme_color + maskable icons</td></tr>
    <tr><td>"iOS install"</td><td>apple-touch-icon + apple-mobile-web-app-* tags + iOS splash images</td></tr>
    <tr><td>"Play Store"</td><td>Trusted Web Activity (Bubblewrap) + Digital Asset Links</td></tr>
    <tr><td>"share sheet integration"</td><td>share_target in manifest</td></tr>
    <tr><td>"long-press shortcuts"</td><td>shortcuts array in manifest</td></tr>
    <tr><td>"unread count badge"</td><td>navigator.setAppBadge (Chromium-only)</td></tr>
    <tr><td>"update available"</td><td>SW updatefound + skipWaiting + controllerchange + reload</td></tr>
    <tr><td>"offline"</td><td>SW with fetch + /offline.html fallback</td></tr>
    <tr><td>"push notifications"</td><td>VAPID + Notification.requestPermission + pushManager.subscribe</td></tr>
  </tbody>
</table>

<h3>Demo script</h3>
<ol>
  <li>Show manifest with key fields explained.</li>
  <li>Show SW with fetch handler + offline fallback.</li>
  <li>Show install button + iOS guidance pattern.</li>
  <li>Show update prompt UX.</li>
  <li>Run Lighthouse PWA audit on the deployed page.</li>
  <li>Talk distribution: PWA, TWA, Capacitor.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"Trusted Web Activity for Play Store distribution."</em></li>
  <li><em>"App badging via setAppBadge for unread count."</em></li>
  <li><em>"Periodic Sync for daily content prefetch on engaged installed users."</em></li>
  <li><em>"Web Share Target so the PWA appears in OS share sheet."</em></li>
  <li><em>"Lighthouse PWA + Performance budgets in CI."</em></li>
  <li><em>"iOS-specific splash images via pwa-asset-generator."</em></li>
  <li><em>"Push notification A/B testing for opt-in CTAs."</em></li>
  <li><em>"Telemetry on install funnel: prompt-shown, prompt-accepted, installed, retained 7-day."</em></li>
  <li><em>"Microsoft Store + Galaxy Store listings via PWABuilder."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Manifest fluency</td><td>Names key fields without prompting</td></tr>
    <tr><td>SW + fetch awareness</td><td>Knows fetch handler is required for installability</td></tr>
    <tr><td>iOS-specific knowledge</td><td>Names apple-* meta tags, no beforeinstallprompt, push since 16.4</td></tr>
    <tr><td>Maskable icon awareness</td><td>Doesn't ship square-only icons</td></tr>
    <tr><td>Install UX</td><td>Custom button + iOS guidance + dismiss handling</td></tr>
    <tr><td>Update flow</td><td>Surfaces updates to user, doesn't silent-replace</td></tr>
    <tr><td>Build tool fluency</td><td>vite-plugin-pwa / workbox-webpack-plugin / next-pwa</td></tr>
    <tr><td>Distribution awareness</td><td>TWA / Capacitor / PWABuilder for store listings</td></tr>
    <tr><td>Telemetry</td><td>Tracks install funnel + display mode in analytics</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN apps are not PWAs but the install / offline / push / share-target primitives all exist as native equivalents.</li>
  <li>For shared web + RN codebases: web ships as PWA (or TWA for Play); native ships as RN app.</li>
  <li>Capacitor wraps PWA in native shell with full system access — middle ground between PWA and RN.</li>
  <li>Tauri (Rust-based) and Electron (Chromium-based) for desktop PWA-as-app.</li>
  <li>iOS PWA support has been politically charged — Apple briefly removed it in EU (2024); reversed under DMA pressure. Don't bet a startup on iOS PWA push if alternatives matter.</li>
  <li>For high-stakes mobile-first products targeting both iOS + Android, native (RN / Flutter) is still the safer bet; PWA is great for web-first or cross-platform tools.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"What's the minimum to make a PWA installable?"</em> — HTTPS, manifest with name + icons + start_url + display, SW with a fetch handler, served over HTTPS.</li>
  <li><em>"Why are iOS PWAs limited?"</em> — Apple historically restricts web platform features to drive native App Store install (and App Store fees). iOS 16.4 added push for installed PWAs after years of pressure; manifest support remains thin.</li>
  <li><em>"How do you ship a PWA to the Play Store?"</em> — Trusted Web Activity via Bubblewrap; ship the resulting AAB; serve <code>/.well-known/assetlinks.json</code> proving APK-PWA ownership.</li>
  <li><em>"How do you handle install prompts without annoying users?"</em> — Suppress the mini-infobar with <code>preventDefault</code>; show your own install button at a contextually right moment (e.g., after the user has used the app for 30s); track dismissals; don't re-prompt for months.</li>
  <li><em>"How do PWA updates differ from native app updates?"</em> — PWA updates land instantly when the SW activates; native requires App Store / Play Store review + user-side update. PWA is faster but the user needs an explicit reload moment.</li>
  <li><em>"What's a maskable icon?"</em> — An icon designed to fit inside any mask shape (circle, squircle) the OS applies. The logo lives in the center 80% safe zone; outer 20% may be cropped. Tools: maskable.app.</li>
  <li><em>"How would you A/B test PWA install rate?"</em> — Two install prompt variants (CTA copy, timing, position); track via beforeinstallprompt eligibility + appinstalled fire; segment by entry source via start_url query param.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Build a tiny PWA with vite-plugin-pwa: manifest, SW, install button, iOS guidance.</li>
  <li>Run Lighthouse PWA audit; reach 100.</li>
  <li>Test install on Chrome, Edge, Android Chrome, iOS Safari (Add to Home Screen).</li>
  <li>Generate maskable icons + iOS splash images.</li>
  <li>Wire push notifications end to end.</li>
  <li>Read web.dev's PWA section for the canonical reference.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read PWABuilder docs — especially the Microsoft Store + Play Store packaging flow."</li>
  <li>"Read Bubblewrap source for TWA generation; understand the trust chain."</li>
  <li>"Build the same app as PWA + Capacitor + RN; compare DX and capabilities."</li>
  <li>"Read Pinterest / Twitter / Spotify case studies on PWA engagement metrics."</li>
</ul>

<h3>Offline & PWA module summary</h3>
<p>The complete Offline & PWA module covers:</p>
<ul>
  <li><strong>Service Workers Deep</strong> — lifecycle, 5 caching strategies, Workbox, push, kill-switch.</li>
  <li><strong>IndexedDB Strategies</strong> — schema, indexes, transactions, migrations, wrappers (idb / Dexie), encryption, multi-tab.</li>
  <li><strong>Background Sync</strong> — queue + retry pattern, idempotency keys, fallbacks for Safari / Firefox, Workbox plugin, dead letters.</li>
  <li><strong>PWA Manifest & Install</strong> (this topic) — manifest fields, install prompt UX, iOS guidance, Trusted Web Activity, Lighthouse audit.</li>
</ul>
<p>4 topics. Together they cover the full offline-first, installable web-app stack — what it takes to ship a real product that works without the network and feels like an app.</p>
`
    }
  ]
});
