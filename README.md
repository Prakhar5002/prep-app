# Prep App

An interactive technical interview-preparation workspace covering frontend, React Native, backend engineering, cloud, system design, and AI/LLM engineering.

<p align="center">
  <a href="https://prepv1.vercel.app/"><strong>Open the live app →</strong></a>
  &nbsp;·&nbsp;
  <a href="https://prakharpandeyy.vercel.app/">Portfolio</a>
</p>

## Overview

Prep App brings structured technical notes, topic navigation, revision material, and practice workflows into one browser-based study experience. The content is organized into learning domains and smaller modules so that a broad interview-preparation roadmap is easier to explore and work through.

## Highlights

- **Structured topic library** — organized learning domains spanning AI/LLM engineering, backend fundamentals and stack, API design, cloud and DevOps, system design, frontend, JavaScript, React, and mobile engineering.
- **Focused topic reader** — section navigation, a page table of contents, collapsible sections, reading progress, and previous/next topic navigation.
- **Search and keyboard navigation** — quickly find topics and move through the application with keyboard shortcuts.
- **Study tracking** — mark topics as studied and view progress across the library.
- **Study Plan and Quick Revision** — dedicated views to support planning and revisiting material.
- **Practice area** — JavaScript and React Native practice content, including question formats such as output prediction, bug spotting, deep dives, and scenarios.
- **Personalized reading experience** — light/dark theme, focus mode, and persisted local preferences.
- **Optional cross-device progress sync** — Firebase integration is available for syncing study progress when configured.

## Screenshots

See the live application for the latest interface and content:

- [Open Prep App](https://prepv1.vercel.app/)
- [View portfolio](https://prakharpandeyy.vercel.app/)

## Technical overview

| Area | Implementation |
| --- | --- |
| UI | HTML, CSS, and vanilla JavaScript |
| Content organization | Registry-driven topic and module structure |
| Navigation | Client-side hash-based routing |
| Study preferences and progress | Browser local storage |
| Optional cross-device sync | Firebase |
| Code highlighting | Prism.js |
| Content validation | Node.js verification script |

The application is intentionally lightweight: the current repository structure is a static web app and does not require a frontend bundling step to run locally.

## Application structure

```text
.
├── index.html
├── styles/
│   ├── app.css
│   └── practice.css
├── scripts/
│   ├── app.js
│   ├── firebase-config.js
│   ├── content/
│   │   ├── _index.js
│   │   └── topic content files
│   └── practice/
│       ├── _practice-index.js
│       └── practice content files
├── vendor/
│   ├── prism.js
│   └── prism.css
└── tools/
    └── verify-topics.mjs
```

## Run locally

No package installation or build command is required for the current static app.

1. Clone the repository:

   ```bash
   git clone https://github.com/Prakhar5002/prep-app.git
   cd prep-app
   ```

2. Open `index.html` in a modern browser, or serve the directory with any static HTTP server.

## Content validation

Run the repository's topic verification script with Node.js:

```bash
node tools/verify-topics.mjs
```

This script checks content registration and selected structural conventions. It is a content validation utility, not a full end-to-end test suite.

## Firebase sync configuration

Firebase is optional. The app can use local browser storage without configuring cross-device sync. To enable Firebase-backed sync, configure the Firebase project and ensure Firestore security rules enforce the intended authentication and access controls. Never rely on a client-side Firebase configuration value as an authorization boundary.

## Project status

The content registry represents the broader learning roadmap; it should not be interpreted as a claim that every planned topic is already complete. The available material continues to evolve as content is added.

## Author

Built by [Prakhar Pandey](https://prakharpandeyy.vercel.app/).

- [Portfolio](https://prakharpandeyy.vercel.app/)
- [GitHub](https://github.com/Prakhar5002)
