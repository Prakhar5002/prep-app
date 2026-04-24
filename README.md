# Prep Site — FAANG + Mobile Frontend Interview Prep

Self-contained, offline-ready study website covering deep-dive notes for
React Native / mobile frontend interviews at FAANG and mid-size product companies.

## How to use

1. Keep this entire folder together — don't move individual files.
2. Open `index.html` in any modern browser:
   - **Desktop:** double-click `index.html` (Chrome/Safari/Firefox all work).
   - **Mobile/Tablet:** transfer the folder to your device (AirDrop, Dropbox, Google Drive, USB) and open `index.html` in the device browser.
3. Works entirely offline — no internet or server needed.

## Features

- **Sidebar navigation** — all 22 modules, collapsible.
- **Right-rail TOC** — jump to any section in the current topic.
- **cmd + K / ctrl + K** — full-text search across topics and sections.
- **Dark / light theme toggle** — top-right, persisted in localStorage.
- **Mark topics as studied** — progress tracked in localStorage, shown in sidebar.
- **Code syntax highlighting** — JS/TS support built-in.
- **Copy code** — hover a code block, click Copy.
- **Collapsible sections** — click any section header except TL;DR.
- **Prev/Next navigation** — at the bottom of every topic.
- **Mobile-friendly** — drawer sidebar, responsive layout.
- **Keyboard shortcuts:**
  - `⌘ K` or `Ctrl+K` — search
  - `/` — focus search (outside inputs)
  - `Esc` — close search
  - `↑` `↓` — navigate search results
  - `↵` — open result

## Current status (Phase 1)

- ✅ 5 topics complete: Execution Context, Scope & Scope Chain, Closures, `this` Keyword, Event Loop
- 🚧 Remaining: 17 modules, ~125 topics. Being added in Phase 2.
- 📝 Interview question files (JS, React, RN, SD, DSA): added in Phase 3, after notes complete.

## Folder structure

```
Prep-Site/
├── index.html              ← entry point (open this)
├── README.md               ← this file
├── styles/
│   └── app.css             ← Linear/Vercel dark-first theme
├── scripts/
│   ├── app.js              ← router, sidebar, search, theme, progress
│   └── content/
│       ├── _index.js       ← module/topic registry
│       ├── js-execution-context.js
│       ├── js-scope-chain.js
│       ├── js-closures.js
│       ├── js-this.js
│       └── js-event-loop.js
└── vendor/
    ├── prism.js            ← tiny offline JS syntax highlighter
    └── prism.css
```

## Editing content

Each topic file is a JS module registering a topic object:

```js
window.PREP_SITE.registerTopic({
  id: 'js-my-topic',
  module: 'JavaScript Deep',
  title: 'My Topic',
  estimatedReadTime: '20 min',
  tags: ['tag1', 'tag2'],
  sections: [
    { id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `<p>...</p>` },
    // ... more sections
  ]
});
```

Section `html` is raw HTML. Use inline `<code>` for inline code and
`<pre><code class="language-js">...</code></pre>` for code blocks.

Add the new file to `index.html` as `<script src="scripts/content/your-file.js"></script>`.
Register it in `_index.js` if adding a new topic; the registry drives navigation.

## Known limitations

- Search currently matches titles/tags only (not full-text body). Extending this
  in Phase 3.
- Spaced-repetition / quiz mode: not included; progress-only for now.
- Diagrams are ASCII. Could add SVG or Mermaid later.
# Prep-app
