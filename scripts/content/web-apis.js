window.PREP_SITE.registerTopic({
  id: 'web-apis',
  module: 'web',
  title: 'Browser APIs',
  estimatedReadTime: '50 min',
  tags: ['browser-apis', 'intersection-observer', 'mutation-observer', 'resize-observer', 'web-workers', 'fetch', 'permissions', 'web'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>Modern browsers ship dozens of platform APIs that solve real product problems. Senior frontend engineers reach for them before pulling in libraries: <strong>IntersectionObserver</strong> for scroll detection, <strong>ResizeObserver</strong> for element-size tracking, <strong>Web Workers</strong> for off-main-thread compute, <strong>Permissions API</strong> for microphone/camera/geolocation, <strong>Clipboard / Share / WebRTC / Web Push</strong> for OS-level integration. Knowing what's available saves bundle size and improves UX.</p>
<ul>
  <li><strong>Observers:</strong> IntersectionObserver (visibility), ResizeObserver (size), MutationObserver (DOM changes), PerformanceObserver (perf events).</li>
  <li><strong>Workers:</strong> Web Worker (background compute), Service Worker (proxy + offline), Shared Worker (cross-tab), Worklets (audio, paint).</li>
  <li><strong>fetch + AbortController</strong> as the modern HTTP API.</li>
  <li><strong>Streams API</strong> for chunked reading/writing.</li>
  <li><strong>Permissions API</strong> + specific feature APIs (geolocation, camera, microphone, clipboard, notifications).</li>
  <li><strong>Web Share, File System Access, WebRTC, Web Push, Web Speech, WebMIDI, WebUSB, WebHID</strong> — increasingly OS-level access.</li>
  <li><strong>WebAssembly</strong> for compute-heavy logic (image processing, decompression).</li>
  <li><strong>WebGPU</strong> for GPU compute / 3D rendering — newer than WebGL.</li>
</ul>
<p><strong>Mantra:</strong> "Reach for the platform first. Observers for tracking; workers for compute; permissions for access; streams for big data; WebAssembly for hot paths."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>The "platform first" philosophy</h3>
<p>Many libraries exist because their underlying APIs were missing in 2015. By 2026, the platform has filled most gaps: lazy loading is native, intersection / resize observers are universal, modern fetch covers most HTTP needs. Reach for libraries when you need ergonomics or polyfills, not because "browsers can't do that."</p>

<h3>The Observer family</h3>
<table>
  <thead><tr><th>Observer</th><th>Watches</th><th>Use case</th></tr></thead>
  <tbody>
    <tr><td>IntersectionObserver</td><td>Element entering / leaving viewport (or scroll container)</td><td>Lazy-load images, infinite scroll, sticky-header trigger, analytics impressions</td></tr>
    <tr><td>ResizeObserver</td><td>Element size changes</td><td>Container queries (pre-CSS), responsive component re-layouts</td></tr>
    <tr><td>MutationObserver</td><td>DOM tree changes</td><td>React to third-party DOM changes, watching for injected nodes</td></tr>
    <tr><td>PerformanceObserver</td><td>Performance entries (LCP, FCP, long tasks)</td><td>Web Vitals reporting, perf monitoring</td></tr>
  </tbody>
</table>

<h3>The Worker family</h3>
<table>
  <thead><tr><th>Worker</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td>Web Worker</td><td>Run JS on a background thread; main thread stays responsive</td></tr>
    <tr><td>Shared Worker</td><td>One worker shared across tabs of same origin</td></tr>
    <tr><td>Service Worker</td><td>Programmable network proxy + offline support + push notifications</td></tr>
    <tr><td>Audio Worklet</td><td>Audio processing on a dedicated thread</td></tr>
    <tr><td>Paint Worklet</td><td>Custom CSS painting (CSS Houdini)</td></tr>
  </tbody>
</table>

<h3>OS-level integrations</h3>
<table>
  <thead><tr><th>API</th><th>What it does</th></tr></thead>
  <tbody>
    <tr><td>Web Share</td><td>Native share sheet (mobile / macOS)</td></tr>
    <tr><td>Web Push + Notifications</td><td>Push notifications via service worker</td></tr>
    <tr><td>File System Access</td><td>Read / write user files (with permission)</td></tr>
    <tr><td>Clipboard API</td><td>Read / write clipboard (text + images)</td></tr>
    <tr><td>Permissions API</td><td>Query + request permissions</td></tr>
    <tr><td>Web Speech</td><td>Speech recognition + synthesis</td></tr>
    <tr><td>Geolocation</td><td>User location (with permission)</td></tr>
    <tr><td>WebRTC</td><td>Peer-to-peer audio/video/data</td></tr>
    <tr><td>WebUSB / WebHID / WebSerial / WebMIDI</td><td>Direct hardware access (Chrome-led)</td></tr>
    <tr><td>WebGPU</td><td>GPU compute + 3D rendering</td></tr>
    <tr><td>WebAssembly</td><td>Run compiled code at near-native speed</td></tr>
  </tbody>
</table>

<h3>Why interviewers ask</h3>
<ol>
  <li>Tests platform fluency — many candidates ship libraries when native APIs would do.</li>
  <li>Performance: workers, observers, streams all deliver perf wins.</li>
  <li>Tests "what's possible without libraries?" mindset.</li>
  <li>Mobile-relevance: many of these have RN equivalents.</li>
</ol>

<h3>What "good" looks like</h3>
<ul>
  <li>You reach for IntersectionObserver / ResizeObserver before scroll listeners.</li>
  <li>You move expensive compute to workers.</li>
  <li>You use Permissions API to query state before requesting.</li>
  <li>You cancel fetch with AbortController.</li>
  <li>You use streams for large files / responses.</li>
  <li>You know which APIs are universal vs cutting-edge.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>IntersectionObserver basics</h3>
<pre><code class="language-js">const observer = new IntersectionObserver((entries) =&gt; {
  entries.forEach((entry) =&gt; {
    if (entry.isIntersecting) {
      // entered viewport
      entry.target.classList.add('visible');
    } else {
      // left viewport
      entry.target.classList.remove('visible');
    }
  });
}, {
  root: null,            // viewport (default)
  rootMargin: '0px',     // expand / contract observation area
  threshold: 0.5,        // 0-1; fire when 50% visible
});

document.querySelectorAll('.card').forEach((c) =&gt; observer.observe(c));
</code></pre>

<h3>IntersectionObserver options</h3>
<table>
  <thead><tr><th>Option</th><th>Effect</th></tr></thead>
  <tbody>
    <tr><td>root</td><td>Element used as viewport; null = browser viewport</td></tr>
    <tr><td>rootMargin</td><td>CSS-like margin around root; "0px 0px -100px 0px" expands bottom inward</td></tr>
    <tr><td>threshold</td><td>0-1 or array; visibility ratio at which callback fires</td></tr>
  </tbody>
</table>

<h3>ResizeObserver basics</h3>
<pre><code class="language-js">const observer = new ResizeObserver((entries) =&gt; {
  for (const entry of entries) {
    const { width, height } = entry.contentRect;
    console.log(entry.target, width, height);
  }
});

observer.observe(element);

// Multiple elements
elements.forEach((el) =&gt; observer.observe(el));

// Stop
observer.unobserve(element);
observer.disconnect();
</code></pre>

<h3>MutationObserver basics</h3>
<pre><code class="language-js">const observer = new MutationObserver((mutations) =&gt; {
  for (const m of mutations) {
    if (m.type === 'childList') {
      m.addedNodes.forEach((n) =&gt; console.log('added', n));
    }
    if (m.type === 'attributes') {
      console.log(m.target, m.attributeName, m.oldValue);
    }
  }
});

observer.observe(targetNode, {
  childList: true,
  attributes: true,
  subtree: true,
  attributeOldValue: true,
});

observer.disconnect();
</code></pre>

<h3>PerformanceObserver basics</h3>
<pre><code class="language-js">const observer = new PerformanceObserver((list) =&gt; {
  for (const entry of list.getEntries()) {
    console.log(entry.entryType, entry);
  }
});

observer.observe({ type: 'largest-contentful-paint', buffered: true });
observer.observe({ type: 'layout-shift', buffered: true });
observer.observe({ type: 'longtask', buffered: true });
observer.observe({ type: 'first-input', buffered: true });
</code></pre>

<h3>Web Worker basics</h3>
<pre><code class="language-js">// main.js
const worker = new Worker(new URL('./work.js', import.meta.url), { type: 'module' });

worker.postMessage({ kind: 'compute', data: hugeArray });
worker.onmessage = (e) =&gt; useResult(e.data);
worker.onerror = (e) =&gt; console.error(e);

// work.js
self.onmessage = (e) =&gt; {
  if (e.data.kind === 'compute') {
    const result = doExpensive(e.data.data);
    self.postMessage(result);
  }
};
</code></pre>

<h3>fetch + AbortController</h3>
<pre><code class="language-js">const controller = new AbortController();
fetch('/api/x', { signal: controller.signal });

// Cancel
controller.abort();

// Timeout
const timeout = AbortSignal.timeout(5000);   // modern; AbortSignal helper
fetch('/api/x', { signal: timeout });
</code></pre>

<h3>Streams</h3>
<pre><code class="language-js">// Reading a streamed response
const response = await fetch('/big-file');
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  process(decoder.decode(value, { stream: true }));
}
</code></pre>

<h3>Permissions API</h3>
<pre><code class="language-js">// Query a permission
const status = await navigator.permissions.query({ name: 'geolocation' });
console.log(status.state);   // 'granted' | 'denied' | 'prompt'

// React to changes
status.onchange = () =&gt; console.log('Permission changed:', status.state);

// Request via the underlying API (each is different)
navigator.geolocation.getCurrentPosition(success, error);
navigator.mediaDevices.getUserMedia({ video: true });
Notification.requestPermission();
</code></pre>

<h3>Clipboard API</h3>
<pre><code class="language-js">// Write text
await navigator.clipboard.writeText('Hello');

// Read text (requires permission / user gesture on most browsers)
const text = await navigator.clipboard.readText();

// Write image
await navigator.clipboard.write([
  new ClipboardItem({ 'image/png': blob })
]);

// Read items
const items = await navigator.clipboard.read();
for (const item of items) {
  for (const type of item.types) {
    const blob = await item.getType(type);
    // ...
  }
}
</code></pre>

<h3>Web Share API</h3>
<pre><code class="language-js">if (navigator.share) {
  await navigator.share({
    title: 'Page title',
    text: 'Description',
    url: 'https://example.com',
    files: [file],   // optional
  });
}
</code></pre>

<h3>Geolocation</h3>
<pre><code class="language-js">navigator.geolocation.getCurrentPosition(
  (pos) =&gt; {
    const { latitude, longitude, accuracy } = pos.coords;
    console.log(latitude, longitude);
  },
  (err) =&gt; console.error(err),
  { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
);

// Watch
const watchId = navigator.geolocation.watchPosition(success, error);
navigator.geolocation.clearWatch(watchId);
</code></pre>

<h3>Notifications</h3>
<pre><code class="language-js">const permission = await Notification.requestPermission();
if (permission === 'granted') {
  new Notification('Hello', {
    body: 'World',
    icon: '/icon.png',
    tag: 'message',
    requireInteraction: false,
  });
}
</code></pre>

<h3>Web Speech (synthesis)</h3>
<pre><code class="language-js">const utterance = new SpeechSynthesisUtterance('Hello, world');
utterance.lang = 'en-US';
utterance.rate = 1.0;
speechSynthesis.speak(utterance);
</code></pre>

<h3>File System Access (Chrome / Edge)</h3>
<pre><code class="language-js">// Request user-picked file
const [fileHandle] = await window.showOpenFilePicker();
const file = await fileHandle.getFile();
const text = await file.text();

// Write
const writable = await fileHandle.createWritable();
await writable.write('Hello');
await writable.close();
</code></pre>

<h3>WebRTC overview</h3>
<p>P2P audio/video/data between browsers via STUN / TURN servers for NAT traversal. Used by video chat (Zoom, Google Meet web), real-time games. Complex setup; most teams use libraries (PeerJS, simple-peer) or services (Daily, LiveKit).</p>

<h3>WebAssembly</h3>
<pre><code class="language-js">const response = await fetch('/module.wasm');
const buffer = await response.arrayBuffer();
const { instance } = await WebAssembly.instantiate(buffer);
const result = instance.exports.add(2, 3);
</code></pre>
<p>For non-trivial use, compile from Rust / C++ / AssemblyScript with toolchains (wasm-pack, Emscripten).</p>

<h3>WebGPU</h3>
<p>Modern GPU API; replaces WebGL for new code. GPU compute (machine learning in browser) and 3D rendering. Universally available 2024+.</p>

<h3>The "feature detect" pattern</h3>
<pre><code class="language-js">if ('IntersectionObserver' in window) {
  // use IO
} else {
  // fallback: scroll listener
}

if (navigator.share) { /* ... */ }
if ('clipboard' in navigator) { /* ... */ }
if ('serviceWorker' in navigator) { /* ... */ }
</code></pre>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Lazy load images with IntersectionObserver</h3>
<pre><code class="language-js">const observer = new IntersectionObserver((entries) =&gt; {
  entries.forEach((entry) =&gt; {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      observer.unobserve(img);
    }
  });
});

document.querySelectorAll('img[data-src]').forEach(img =&gt; observer.observe(img));

// Note: native loading="lazy" is the modern preferred way; this is for custom logic.
</code></pre>

<h3>Infinite scroll</h3>
<pre><code class="language-tsx">function InfiniteList() {
  const [items, setItems] = useState&lt;Item[]&gt;([]);
  const [page, setPage] = useState(1);
  const sentinelRef = useRef&lt;HTMLDivElement&gt;(null);

  useEffect(() =&gt; {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver((entries) =&gt; {
      if (entries[0].isIntersecting) {
        loadPage(page).then((newItems) =&gt; {
          setItems((cur) =&gt; [...cur, ...newItems]);
          setPage(p =&gt; p + 1);
        });
      }
    }, { rootMargin: '200px' });

    observer.observe(sentinelRef.current);
    return () =&gt; observer.disconnect();
  }, [page]);

  return (
    &lt;&gt;
      {items.map(i =&gt; &lt;Item key={i.id} item={i} /&gt;)}
      &lt;div ref={sentinelRef} /&gt;
    &lt;/&gt;
  );
}
</code></pre>

<h3>Container query (pre-CSS) via ResizeObserver</h3>
<pre><code class="language-tsx">function useElementSize&lt;T extends HTMLElement&gt;() {
  const ref = useRef&lt;T&gt;(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() =&gt; {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) =&gt; {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(ref.current);
    return () =&gt; observer.disconnect();
  }, []);

  return [ref, size] as const;
}

function Card() {
  const [ref, { width }] = useElementSize&lt;HTMLDivElement&gt;();
  const isWide = width &gt; 400;
  return (
    &lt;div ref={ref} className={isWide ? 'wide' : 'narrow'}&gt;...&lt;/div&gt;
  );
}
</code></pre>

<h3>Watch for DOM injection (e.g., third-party widgets)</h3>
<pre><code class="language-js">const observer = new MutationObserver((mutations) =&gt; {
  for (const m of mutations) {
    m.addedNodes.forEach((node) =&gt; {
      if (node.nodeType === 1 &amp;&amp; node.classList?.contains('analytics-widget')) {
        cleanupAnalytics(node);
      }
    });
  }
});

observer.observe(document.body, { childList: true, subtree: true });
</code></pre>

<h3>Long task observer (perf monitoring)</h3>
<pre><code class="language-js">const longTaskObserver = new PerformanceObserver((list) =&gt; {
  for (const entry of list.getEntries()) {
    if (entry.duration &gt; 100) {
      reportToAnalytics({
        type: 'long-task',
        duration: entry.duration,
        name: entry.name,
      });
    }
  }
});
longTaskObserver.observe({ entryTypes: ['longtask'] });
</code></pre>

<h3>Web Worker for heavy compute</h3>
<pre><code class="language-js">// main.js
const worker = new Worker(new URL('./worker.js', import.meta.url));

worker.onmessage = (e) =&gt; {
  console.log('Result:', e.data);
};

worker.postMessage({ task: 'fibonacci', n: 40 });

// worker.js
self.onmessage = (e) =&gt; {
  if (e.data.task === 'fibonacci') {
    const result = fib(e.data.n);
    self.postMessage(result);
  }
};

function fib(n) {
  if (n &lt; 2) return n;
  return fib(n - 1) + fib(n - 2);
}
</code></pre>

<h3>Worker via comlink (ergonomic)</h3>
<pre><code class="language-bash">yarn add comlink
</code></pre>
<pre><code class="language-js">// worker.js
import * as Comlink from 'comlink';

const api = {
  add: (a, b) =&gt; a + b,
  fibonacci: fib,
};

Comlink.expose(api);

// main.js
import * as Comlink from 'comlink';
const worker = new Worker(new URL('./worker.js', import.meta.url));
const api = Comlink.wrap(worker);

const result = await api.fibonacci(40);
</code></pre>

<h3>Streams: read JSON line-by-line</h3>
<pre><code class="language-js">async function* lines(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      if (buf) yield buf;
      break;
    }
    buf += decoder.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf('\\n')) !== -1) {
      yield buf.slice(0, i);
      buf = buf.slice(i + 1);
    }
  }
}

const response = await fetch('/large.ndjson');
for await (const line of lines(response)) {
  const obj = JSON.parse(line);
  process(obj);
}
</code></pre>

<h3>Permissions check + request</h3>
<pre><code class="language-js">async function ensureCamera() {
  const status = await navigator.permissions.query({ name: 'camera' });
  if (status.state === 'granted') return true;
  if (status.state === 'denied') return false;
  // 'prompt' — request via getUserMedia
  try {
    await navigator.mediaDevices.getUserMedia({ video: true });
    return true;
  } catch {
    return false;
  }
}
</code></pre>

<h3>Clipboard with images</h3>
<pre><code class="language-js">// Write
const blob = new Blob([await canvas.convertToBlob()], { type: 'image/png' });
await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);

// Read pasted image
document.addEventListener('paste', async (e) =&gt; {
  for (const item of e.clipboardData.items) {
    if (item.type.startsWith('image/')) {
      const blob = item.getAsFile();
      // process blob
    }
  }
});
</code></pre>

<h3>Web Share with files</h3>
<pre><code class="language-js">async function share() {
  const file = new File(['Hello'], 'note.txt', { type: 'text/plain' });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Note' });
  }
}
</code></pre>

<h3>File System Access for export</h3>
<pre><code class="language-js">async function saveFile(content) {
  const handle = await window.showSaveFilePicker({
    suggestedName: 'export.json',
    types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
  });
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}
</code></pre>

<h3>Notification with action</h3>
<pre><code class="language-js">// Service worker side
self.registration.showNotification('Message', {
  body: 'You have a new message',
  icon: '/icon-192.png',
  actions: [
    { action: 'reply', title: 'Reply' },
    { action: 'mute', title: 'Mute' }
  ],
  tag: 'msg-1',
  data: { url: '/messages/1' },
});

// Handle action click
self.addEventListener('notificationclick', (event) =&gt; {
  event.notification.close();
  if (event.action === 'reply') {
    // ...
  } else if (event.action === 'mute') {
    // ...
  } else {
    clients.openWindow(event.notification.data.url);
  }
});
</code></pre>

<h3>Battery API (deprecated in many)</h3>
<pre><code class="language-js">// Battery API was deprecated by browsers due to fingerprinting; treat as unavailable
if ('getBattery' in navigator) {
  const battery = await navigator.getBattery();
  console.log(battery.level, battery.charging);
}
</code></pre>

<h3>Network Information API</h3>
<pre><code class="language-js">if (navigator.connection) {
  const { effectiveType, downlink, rtt, saveData } = navigator.connection;
  // adapt UI
}
</code></pre>

<h3>Visibility API</h3>
<pre><code class="language-js">document.addEventListener('visibilitychange', () =&gt; {
  if (document.hidden) {
    pauseHeavyWork();
  } else {
    resumeHeavyWork();
  }
});
</code></pre>

<h3>Page Visibility for analytics</h3>
<pre><code class="language-js">// More reliable than 'beforeunload' on mobile
document.addEventListener('visibilitychange', () =&gt; {
  if (document.visibilityState === 'hidden') {
    navigator.sendBeacon('/analytics', JSON.stringify({ type: 'session_end' }));
  }
});
</code></pre>

<h3>Wake Lock API</h3>
<pre><code class="language-js">// Prevent screen from sleeping during, e.g., a recipe app
let wakeLock;
async function keepAwake() {
  wakeLock = await navigator.wakeLock.request('screen');
}
async function release() {
  await wakeLock.release();
}
</code></pre>

<h3>Idle Detection (Chrome)</h3>
<pre><code class="language-js">const status = await IdleDetector.requestPermission();
if (status === 'granted') {
  const detector = new IdleDetector();
  detector.addEventListener('change', () =&gt; {
    console.log(detector.userState, detector.screenState);
  });
  await detector.start({ threshold: 60_000 });
}
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: View tracking via IntersectionObserver</h3>
<pre><code class="language-js">const seen = new Set();
const observer = new IntersectionObserver((entries) =&gt; {
  entries.forEach((entry) =&gt; {
    if (entry.isIntersecting) {
      const id = entry.target.dataset.id;
      if (!seen.has(id)) {
        seen.add(id);
        analytics.track('item_seen', { id });
      }
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.feed-item').forEach(item =&gt; observer.observe(item));
</code></pre>

<h3>Example 2: Sticky-on-scroll header (CSS sticky + IO for shadow)</h3>
<pre><code class="language-tsx">function Header() {
  const [scrolled, setScrolled] = useState(false);
  const sentinelRef = useRef&lt;HTMLDivElement&gt;(null);

  useEffect(() =&gt; {
    const observer = new IntersectionObserver(
      ([entry]) =&gt; setScrolled(!entry.isIntersecting),
      { threshold: 1.0 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () =&gt; observer.disconnect();
  }, []);

  return (
    &lt;&gt;
      &lt;div ref={sentinelRef} style={{ position: 'absolute', top: 0, height: 1 }} /&gt;
      &lt;header className={scrolled ? 'shadow' : ''}&gt;...&lt;/header&gt;
    &lt;/&gt;
  );
}
</code></pre>

<h3>Example 3: Animate-on-scroll</h3>
<pre><code class="language-tsx">function FadeIn({ children }) {
  const ref = useRef&lt;HTMLDivElement&gt;(null);
  const [visible, setVisible] = useState(false);

  useEffect(() =&gt; {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) =&gt; {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();   // one-shot
      }
    }, { threshold: 0.1 });
    observer.observe(ref.current);
    return () =&gt; observer.disconnect();
  }, []);

  return (
    &lt;div ref={ref} className={visible ? 'visible' : 'hidden'}&gt;
      {children}
    &lt;/div&gt;
  );
}
</code></pre>

<h3>Example 4: Image processing in Web Worker</h3>
<pre><code class="language-js">// worker.js
import { processImage } from './imageOps';

self.onmessage = async (e) =&gt; {
  const { imageData, filter } = e.data;
  const result = processImage(imageData, filter);
  self.postMessage(result, [result.data.buffer]);   // transfer ownership
};

// main.js
const worker = new Worker(new URL('./worker.js', import.meta.url));
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

worker.postMessage({ imageData, filter: 'blur' }, [imageData.data.buffer]);
worker.onmessage = (e) =&gt; {
  ctx.putImageData(e.data, 0, 0);
};
</code></pre>

<h3>Example 5: Page visibility for video</h3>
<pre><code class="language-js">document.addEventListener('visibilitychange', () =&gt; {
  if (document.hidden) {
    video.pause();
  } else {
    video.play();
  }
});
</code></pre>

<h3>Example 6: Permissions check for geolocation</h3>
<pre><code class="language-tsx">async function getLocation() {
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    if (status.state === 'denied') {
      throw new Error('Location permission denied; enable in settings.');
    }
    return new Promise&lt;GeolocationPosition&gt;((resolve, reject) =&gt; {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10_000 });
    });
  } catch (e) {
    console.error(e);
  }
}
</code></pre>

<h3>Example 7: Copy to clipboard with confirmation</h3>
<pre><code class="language-tsx">function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() =&gt; setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed', e);
    }
  }

  return (
    &lt;button onClick={copy}&gt;
      {copied ? 'Copied!' : 'Copy'}
    &lt;/button&gt;
  );
}
</code></pre>

<h3>Example 8: Service worker push notification</h3>
<pre><code class="language-js">// Subscribe (in main page)
const reg = await navigator.serviceWorker.ready;
const sub = await reg.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: VAPID_PUBLIC_KEY,
});
fetch('/subscribe', { method: 'POST', body: JSON.stringify(sub) });

// Service worker handles incoming push
self.addEventListener('push', (event) =&gt; {
  const data = event.data?.json() ?? { title: 'Update', body: '' };
  event.waitUntil(
    self.registration.showNotification(data.title, { body: data.body })
  );
});
</code></pre>

<h3>Example 9: Streaming JSON parse</h3>
<pre><code class="language-js">// Process API stream of newline-delimited JSON
async function processStream(url) {
  const r = await fetch(url);
  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf('\\n')) !== -1) {
      const line = buf.slice(0, i);
      buf = buf.slice(i + 1);
      if (line.trim()) handleEntry(JSON.parse(line));
    }
  }
}
</code></pre>

<h3>Example 10: WebAssembly for image filter</h3>
<pre><code class="language-js">// Compile Rust → WASM → ship
const { instance } = await WebAssembly.instantiateStreaming(
  fetch('/filter.wasm')
);

const inputBytes = new Uint8Array(imageData.data.buffer);
const inputPtr = instance.exports.allocate(inputBytes.length);
new Uint8Array(instance.exports.memory.buffer, inputPtr, inputBytes.length).set(inputBytes);

instance.exports.gaussianBlur(inputPtr, imageData.width, imageData.height);

const result = new Uint8Array(instance.exports.memory.buffer, inputPtr, inputBytes.length).slice();
const newImageData = new ImageData(new Uint8ClampedArray(result), imageData.width);
ctx.putImageData(newImageData, 0, 0);
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>IntersectionObserver doesn't fire for hidden parents</h3>
<p>If an ancestor has display: none, the observed element is not laid out → IO doesn't trigger. Show the parent first; observe AFTER mount.</p>

<h3>ResizeObserver loop limit exceeded</h3>
<p>If your callback writes back to layout (changing element size), it can loop. Browsers throw "ResizeObserver loop limit exceeded" warning. Guard against unchanged sizes.</p>

<h3>MutationObserver records are batched</h3>
<p>Multiple DOM changes in the same microtask deliver one batch. Process all records, not just the first.</p>

<h3>PerformanceObserver only sees future entries by default</h3>
<p>Pass <code>buffered: true</code> to also see entries fired before observer registration.</p>

<h3>Web Worker scope</h3>
<p>Worker doesn't share globals with main. <code>document</code>, <code>window</code>, <code>localStorage</code> all undefined. Available: <code>self</code>, <code>fetch</code>, <code>postMessage</code>, IndexedDB, Cache API.</p>

<h3>Worker module type</h3>
<pre><code class="language-js">// Modern: ES module worker
new Worker(url, { type: 'module' });
// Allows import statements inside worker

// Classic: requires importScripts() instead
</code></pre>

<h3>Transferable objects</h3>
<p>To move (not copy) a typed array buffer across threads, use the second arg of postMessage:</p>
<pre><code class="language-js">worker.postMessage(data, [data.buffer]);   // transfer ownership; main thread loses access
</code></pre>

<h3>fetch ignores HTTP errors</h3>
<p><code>fetch</code> rejects only on network error. 4xx / 5xx resolve normally; check <code>response.ok</code>.</p>

<h3>AbortSignal in event listeners (modern)</h3>
<pre><code class="language-js">const controller = new AbortController();
window.addEventListener('scroll', handler, { signal: controller.signal });
controller.abort();   // removes listener
</code></pre>

<h3>Permissions API and "prompt"</h3>
<p>State 'prompt' means the user hasn't decided. To get a decision, call the underlying API (which may show the prompt). Permissions API doesn't trigger prompts itself.</p>

<h3>Clipboard requires user gesture</h3>
<p>writeText / readText must be called from a user gesture (click / keypress). Otherwise rejected. Background scripts can't use clipboard.</p>

<h3>Web Share availability</h3>
<p>Mobile (iOS, Android) and macOS. Not on Windows or Linux desktop browsers (mostly). Check <code>navigator.share</code>; provide fallback (manual copy URL).</p>

<h3>Notifications need HTTPS</h3>
<p>Notifications API requires secure context (HTTPS or localhost). Same for Service Worker, Push, geolocation, etc.</p>

<h3>WebRTC NAT traversal</h3>
<p>Direct P2P fails behind NAT. Need STUN (find public IP) and TURN (relay through server when STUN fails). TURN servers are bandwidth-expensive.</p>

<h3>WebAssembly memory</h3>
<p>WASM module has its own linear memory. Sharing data with JS requires copying or using shared memory (SharedArrayBuffer + appropriate headers).</p>

<h3>Service worker scope</h3>
<p>SW registered at <code>/sw.js</code> controls only <code>/</code> and below. Scope can be widened via <code>Service-Worker-Allowed</code> header.</p>

<h3>requestIdleCallback browser support</h3>
<p>Chrome / Firefox / Edge. Safari only since 16.4. Polyfill or fallback to setTimeout.</p>

<h3>Wake Lock API requires user interaction</h3>
<p>Like notifications, must be requested from a user gesture.</p>

<h3>Battery API removed</h3>
<p>Browsers removed access to battery info due to fingerprinting concerns. Treat as unavailable.</p>

<h3>WebUSB / WebHID Chrome-only</h3>
<p>Hardware APIs are Chromium-led; Firefox refuses to implement (security stance). Safari minimal. Don't depend in cross-browser code.</p>

<h3>OffscreenCanvas in workers</h3>
<p>Modern: render to canvas from a worker without main thread. Massive perf wins for game / graphic apps.</p>

<h3>Page lifecycle</h3>
<p>Browsers freeze backgrounded tabs (suspend timers, throttle setInterval). The "freeze" event fires; "resume" on return. Save state on freeze.</p>

<h3>BackgroundFetch (Chrome)</h3>
<p>Service worker can download large files in the background even when the tab is closed. Chrome-only currently.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: scroll listener instead of IntersectionObserver</h3>
<pre><code class="language-js">// BAD — fires on every scroll; even with throttle, expensive
window.addEventListener('scroll', () =&gt; {
  cards.forEach(c =&gt; {
    if (isVisible(c)) c.classList.add('visible');
  });
});

// GOOD
const io = new IntersectionObserver(...);
cards.forEach(c =&gt; io.observe(c));
</code></pre>

<h3>Bug 2: Forgetting to disconnect observer</h3>
<pre><code class="language-tsx">useEffect(() =&gt; {
  const obs = new IntersectionObserver(...);
  obs.observe(ref.current);
  // forgot return obs.disconnect()
}, []);
// Memory leak; observer holds references
</code></pre>

<h3>Bug 3: Heavy work in observer callback</h3>
<p>Observer callbacks run on the main thread. Doing layout-thrashing or 50ms+ work in them blocks rendering. Defer heavy work to rAF or worker.</p>

<h3>Bug 4: Blocking main thread with sync work</h3>
<pre><code class="language-js">// BAD — blocks for 5 seconds
const result = expensiveCompute(hugeData);

// GOOD — worker
worker.postMessage({ data: hugeData });
worker.onmessage = (e) =&gt; useResult(e.data);
</code></pre>

<h3>Bug 5: Forgetting AbortController on fetch</h3>
<pre><code class="language-tsx">useEffect(() =&gt; {
  fetch('/api/x').then(r =&gt; r.json()).then(setData);
  // component unmounts; setData on unmounted component
}, []);

// FIX
useEffect(() =&gt; {
  const c = new AbortController();
  fetch('/api/x', { signal: c.signal })
    .then(r =&gt; r.json())
    .then(setData)
    .catch(e =&gt; { if (e.name !== 'AbortError') throw e; });
  return () =&gt; c.abort();
}, []);
</code></pre>

<h3>Bug 6: Notifications without permission check</h3>
<pre><code class="language-js">// BAD — may throw or no-op silently
new Notification('Hello');

// GOOD
if (Notification.permission === 'granted') {
  new Notification('Hello');
} else if (Notification.permission !== 'denied') {
  Notification.requestPermission().then(p =&gt; {
    if (p === 'granted') new Notification('Hello');
  });
}
</code></pre>

<h3>Bug 7: clipboard without user gesture</h3>
<pre><code class="language-js">setTimeout(() =&gt; navigator.clipboard.writeText('x'), 1000);
// Rejected — not in user gesture context
</code></pre>

<h3>Bug 8: ResizeObserver causing infinite loop</h3>
<pre><code class="language-js">const obs = new ResizeObserver(([entry]) =&gt; {
  entry.target.style.height = entry.contentRect.width + 'px';   // triggers another resize
});
// FIX — guard or use rAF debounce
</code></pre>

<h3>Bug 9: PerformanceObserver missing buffered: true</h3>
<pre><code class="language-js">// BAD — misses LCP entries that already fired
new PerformanceObserver(...).observe({ type: 'largest-contentful-paint' });

// GOOD
new PerformanceObserver(...).observe({ type: 'largest-contentful-paint', buffered: true });
</code></pre>

<h3>Bug 10: Geolocation on insecure context</h3>
<p>Geolocation requires HTTPS (except localhost). On HTTP, the API silently fails or rejects.</p>

<h3>Anti-pattern 1: Pulling in libraries for native APIs</h3>
<p>react-intersection-observer is fine, but useEffect + native IO is just as easy and 0KB. Same for ResizeObserver, fetch, etc.</p>

<h3>Anti-pattern 2: Skipping feature detection</h3>
<p>Using cutting-edge API without checking. Old browsers throw. Always feature-detect.</p>

<h3>Anti-pattern 3: Worker for trivial work</h3>
<p>Worker setup overhead can outweigh benefit for small tasks. Profile before reaching for workers.</p>

<h3>Anti-pattern 4: Using window.fetch in workers</h3>
<p>Workers have their own fetch in <code>self</code>. Using <code>window.fetch</code> works in main but not in worker.</p>

<h3>Anti-pattern 5: Polling instead of observing</h3>
<p>setInterval to check element size = wasted cycles. Use ResizeObserver.</p>

<h3>Anti-pattern 6: Not cleaning up Notification handlers</h3>
<p>Notifications persist until clicked/dismissed. Tag-based replacement avoids notification spam:</p>
<pre><code class="language-js">new Notification('New message', { tag: 'msg' });
// Subsequent same-tag notifications replace, not accumulate
</code></pre>

<h3>Anti-pattern 7: Worker shared state via globals</h3>
<p>Each worker has its own scope. Don't try to share state via shared globals. Use postMessage or SharedArrayBuffer.</p>

<h3>Anti-pattern 8: Synchronous Image() preloading</h3>
<p><code>new Image()</code> doesn't block render but does fetch. If used to preload N images, they all fire at once. Use <code>&lt;link rel="preload"&gt;</code> or stagger loads.</p>

<h3>Anti-pattern 9: setInterval for sync work</h3>
<p>Drifts under load. Use rAF for animation; setInterval only for "heartbeat" use cases.</p>

<h3>Anti-pattern 10: Treating BackgroundFetch as universal</h3>
<p>Chrome-only. For cross-browser, fall back to fetch + service worker.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '🎤 Interview Patterns',
      html: `
<h3>The 14 questions worth rehearsing</h3>
<table>
  <thead><tr><th>Question</th><th>One-liner</th></tr></thead>
  <tbody>
    <tr><td><em>What's IntersectionObserver?</em></td><td>Notifies when an element enters/leaves a viewport (or scrollable ancestor).</td></tr>
    <tr><td><em>What's ResizeObserver?</em></td><td>Notifies when an element's size changes; fires after layout.</td></tr>
    <tr><td><em>MutationObserver vs DOMNodeInserted?</em></td><td>MO is the modern, batched, performant API. DOMNodeInserted is deprecated.</td></tr>
    <tr><td><em>Web Worker vs Service Worker?</em></td><td>Web Worker: background compute thread. Service Worker: programmable network proxy + offline.</td></tr>
    <tr><td><em>How does AbortController work?</em></td><td>Provides a signal that operations subscribe to; calling abort() rejects in-flight operations.</td></tr>
    <tr><td><em>What's the Permissions API?</em></td><td>Query and react to permission state; doesn't request — underlying API does.</td></tr>
    <tr><td><em>Web Share use cases?</em></td><td>Native share sheet on mobile / macOS for sharing URLs, files, text.</td></tr>
    <tr><td><em>Streams API?</em></td><td>Read response bodies in chunks; process before download completes.</td></tr>
    <tr><td><em>WebAssembly purpose?</em></td><td>Run compiled C/C++/Rust at near-native speed; for compute-heavy logic.</td></tr>
    <tr><td><em>What's the Wake Lock API?</em></td><td>Prevent screen sleep during specific user activities.</td></tr>
    <tr><td><em>Page Visibility API?</em></td><td>Detect when tab is backgrounded; pause work; flush analytics.</td></tr>
    <tr><td><em>Cross-tab communication?</em></td><td>StorageEvent (passive), BroadcastChannel (active), SharedWorker (centralized).</td></tr>
    <tr><td><em>How would you offload compute?</em></td><td>Web Worker for general; OffscreenCanvas for rendering; WebAssembly for hot paths.</td></tr>
    <tr><td><em>What's WebGPU?</em></td><td>Modern GPU API; replaces WebGL; supports compute and 3D.</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li>Build infinite scroll with IntersectionObserver.</li>
  <li>Build a useElementSize hook with ResizeObserver.</li>
  <li>Set up a Web Worker for fibonacci compute.</li>
  <li>Add Page Visibility detection to pause animations.</li>
  <li>Write streaming JSON parse for large API responses.</li>
  <li>Add Wake Lock for a recipe-reader page.</li>
  <li>Set up service worker with cache-first strategy.</li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>scroll listener for visibility — should be IntersectionObserver.</li>
  <li>setInterval for size detection — should be ResizeObserver.</li>
  <li>fetch without abort — leaks setState on unmounted components.</li>
  <li>Notifications without permission check — silently fails.</li>
  <li>Heavy compute on main thread — should be worker.</li>
  <li>BackgroundFetch assumed universal — Chrome-only.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Platform-first instinct</td><td>You volunteer native APIs over libraries.</td></tr>
    <tr><td>Observer fluency</td><td>You know all four major observers and their use cases.</td></tr>
    <tr><td>Worker awareness</td><td>You know when to offload and how to use Comlink for ergonomics.</td></tr>
    <tr><td>Permission discipline</td><td>You query first, request via the underlying API.</td></tr>
    <tr><td>Cleanup hygiene</td><td>You disconnect observers, abort fetches, remove listeners.</td></tr>
    <tr><td>Feature detection</td><td>You always check before using cutting-edge APIs.</td></tr>
    <tr><td>Streaming awareness</td><td>You handle large responses incrementally.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN doesn't have most browser APIs — uses native equivalents.</li>
  <li><strong>Camera / mic / geolocation</strong> — react-native-permissions, expo-camera, expo-location.</li>
  <li><strong>Clipboard</strong> — @react-native-clipboard/clipboard.</li>
  <li><strong>Share</strong> — built-in <code>Share.share()</code>.</li>
  <li><strong>Background fetch</strong> — react-native-background-fetch / expo-background-fetch.</li>
  <li><strong>Workers</strong> — RN doesn't have web workers; use Reanimated worklets for UI thread or native module spawn for off-main.</li>
  <li><strong>WebView</strong> can use most browser APIs inside.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"How is IntersectionObserver more efficient than scroll listener?"</em> — IO runs in a separate compositor-related thread; doesn't fire per scroll event but per visibility change. Browser optimizes; debounces; never blocks main thread.</li>
  <li><em>"Why use Workers when fetch is async?"</em> — Async I/O happens off-thread, but the JS callback runs on main. Worker moves the entire computation off-thread; results post via message passing.</li>
  <li><em>"Why does Permissions API not actually request?"</em> — Separating "what's the state?" from "request" lets you check without interrupting the user. Status changes via the underlying API's flow.</li>
  <li><em>"What's the cost of WebAssembly?"</em> — Initial compilation; memory copy at boundary. Net positive for compute-heavy work; net negative for tiny operations.</li>
  <li><em>"How does Page Visibility differ from Document.hidden?"</em> — Same concept; Document.hidden is a property; visibilitychange is the event. Modern code uses both: listen for change, read hidden / visibilityState.</li>
</ul>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Audit scroll listeners; migrate to IntersectionObserver where applicable.</li>
  <li>Find heavy compute on main thread; consider workers.</li>
  <li>Verify fetch calls have AbortController for cleanup.</li>
  <li>Add Page Visibility for analytics flushing.</li>
  <li>Check if service worker would help offline support.</li>
  <li>Identify cutting-edge API usage; add feature detection / fallbacks.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd evaluate WebAssembly for our top 3 compute-heavy operations."</li>
  <li>"I'd use OffscreenCanvas for our chart rendering — moves to worker."</li>
  <li>"I'd add a Wake Lock for our recipe / instruction reader pages."</li>
  <li>"I'd build a unified worker pool with Comlink to avoid spawning workers per task."</li>
  <li>"I'd POC WebGPU for our heaviest visualizations to leverage GPU."</li>
</ul>

<h3>Module summary</h3>
<p>The Web Platform module covers:</p>
<ul>
  <li><strong>HTML</strong> — semantic structure, forms, meta, resource hints.</li>
  <li><strong>Rendering Pipeline</strong> — parse / style / layout / paint / composite; the 16ms budget.</li>
  <li><strong>Core Web Vitals</strong> — LCP / INP / CLS thresholds, real-user measurement.</li>
  <li><strong>Networking</strong> — HTTP versions, TLS, CDN, CORS, cookies, caching.</li>
  <li><strong>Security</strong> — XSS, CSRF, CSP, SRI, cookie flags, supply chain.</li>
  <li><strong>Accessibility</strong> — WCAG, semantic HTML, keyboard, screen readers, ARIA.</li>
  <li><strong>CSS Deep</strong> — cascade, modern layout, custom properties, container queries.</li>
  <li><strong>Storage</strong> — localStorage, IndexedDB, cookies, Cache API, OPFS.</li>
  <li><strong>Browser APIs</strong> (this topic) — observers, workers, permissions, streams, OS integrations.</li>
</ul>
<p>Together: the foundation any senior frontend engineer must internalize. Master the platform; libraries become optional helpers, not crutches.</p>
`
    }
  ]
});
