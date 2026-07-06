# Redux Module (Beginner → Advanced) — Design Spec

**Date:** 2026-07-05
**Status:** Approved design, pending implementation plan
**Repo:** Prep-Site (static, offline-first study site; no build step; vanilla JS via `<script>` tags)

## 1. Goal

Add a dedicated, progressive **Redux** learning module to the notes side of the site —
a five-topic course that teaches Redux from absolute basics to advanced/production
depth. It complements (does not replace) the existing concise `state-redux.js`
deep-dive, which assumes prior knowledge.

Success = a learner with only React basics can start at topic 1 and, by topic 5,
understand modern Redux (RTK, RTK Query, middleware, testing, performance) to
interview/production depth, following the site's existing topic conventions.

## 2. Scope

**In scope**
- A new sidebar **module** ("Redux") registered in `scripts/content/_index.js`.
- Five ordered topic files under `scripts/content/redux-*.js`, each following the
  existing `registerTopic` convention and section style.
- Prev/Next threading across the five (the site's topic-nav already does this from
  registry order).
- Reciprocal cross-links between the new module and the existing `state-redux.js`.

**Out of scope**
- No practice-hub challenges (this is the notes course, not the drill bank).
- No change to the existing `state-redux.js` content beyond adding one cross-link line.
- No new site features (rendering/router/search unchanged — new topics use the
  existing topic-rendering pipeline).
- No build tooling; content is prose HTML in the standard section format.

## 3. Architecture & Integration

Follow the existing content pattern exactly. Each topic is a self-contained IIFE
calling `window.PREP_SITE.registerTopic({...})`; the module is a registry entry that
drives the sidebar.

**Modify**
- `scripts/content/_index.js` — add a new module object to `registry.modules`:
  ```js
  {
    id: "redux",
    title: "Redux",
    topics: [
      { id: "redux-core",            title: "Why Redux & Core Concepts" },
      { id: "redux-toolkit",         title: "Redux Toolkit (RTK)" },
      { id: "redux-rtk-query",       title: "RTK Query" },
      { id: "redux-middleware-async",title: "Middleware & Async" },
      { id: "redux-advanced-testing",title: "Advanced Patterns & Testing" },
    ],
  }
  ```
  Placement: adjacent to the existing State Management ("state-deep") module (before
  or after it) so related content sits together.
- `index.html` — add five `<script src="scripts/content/redux-*.js"></script>` tags
  alongside the other content `<script>` tags (before `scripts/app.js`).
- `scripts/content/state-redux.js` — add ONE cross-link line near its TL;DR pointing
  to the new module ("For a ground-up walkthrough, see the **Redux** module").

**Create** — five topic files:
`scripts/content/redux-core.js`, `redux-toolkit.js`, `redux-rtk-query.js`,
`redux-middleware-async.js`, `redux-advanced-testing.js`.

**No change** to the router, search, theme, progress system, or any other module.

## 4. Topic Registration Shape

Each file registers one topic in the site's standard shape (matching existing topics):

```js
window.PREP_SITE.registerTopic({
  id: 'redux-core',
  module: 'redux',                 // must match the module id in _index.js
  title: 'Why Redux & Core Concepts',
  estimatedReadTime: '20 min',
  tags: ['redux', 'state-management', 'fundamentals'],
  sections: [
    { id: 'tldr',              title: '🎯 TL;DR',                    collapsible: false, html: `…` },
    { id: 'what-why',          title: '🧠 What & Why',               html: `…` },
    { id: 'mental-model',      title: '🗺️ Mental Model',             html: `…` },
    { id: 'mechanics',         title: '⚙️ Mechanics',                html: `…` },
    { id: 'examples',          title: '🧪 Worked Examples',          html: `…` },
    { id: 'edge-cases',        title: '⚠️ Edge Cases',               html: `…` },
    { id: 'bugs-anti-patterns',title: '🐛 Bugs & Anti-Patterns',     html: `…` },
    { id: 'interview-patterns',title: '🎤 Interview Patterns',       html: `…` },
  ],
});
```

- Section `html` is raw trusted HTML (same as all existing topics). Code uses
  `<pre><code class="language-js">…</code></pre>` (Prism highlights it, Copy button
  applies automatically). Inline code uses `<code>`.
- Not every topic needs all eight sections; each uses the subset that fits, but every
  topic includes at least TL;DR, What & Why, Mental Model, Mechanics, Worked Examples,
  and Interview Patterns.
- The first section (`tldr`) is `collapsible: false` per site convention.

## 5. Topic Content Outline (beginner → advanced)

**Topic 1 — `redux-core` — Why Redux & Core Concepts**
The problem Redux solves (shared state, prop-drilling, predictability); the primitives
from scratch — store, action, reducer, `dispatch`, single source of truth; immutability
& pure reducers (why, and what breaks without them); the unidirectional data-flow loop;
`useSelector`/`useDispatch` and `<Provider>`. Mechanics **hand-roll a ~15-line
`createStore`** (getState/dispatch/subscribe) so the mechanism is concrete before RTK
hides it. Ends by motivating RTK. Level: beginner.

**Topic 2 — `redux-toolkit` — Redux Toolkit (RTK)**
Why RTK is *the* standard (hand-written Redux is legacy boilerplate); `configureStore`
(defaults: thunk, devtools, immutability/serializability checks); `createSlice`
(Immer-powered "mutating" reducers, auto-generated action creators); `createAsyncThunk`
(pending/fulfilled/rejected); `createEntityAdapter` (normalized CRUD); selectors +
`createSelector` memoization; TypeScript setup (`RootState`, `AppDispatch`, typed hooks).
Level: intermediate.

**Topic 3 — `redux-rtk-query` — RTK Query**
Server-state caching built on RTK; `createApi`, `baseQuery`, endpoints (query vs
mutation), auto-generated hooks; the tag system (`providesTags`/`invalidatesTags`,
`LIST` tags for bulk invalidation); cache lifetime/`keepUnusedDataFor`; optimistic
updates (`onQueryStarted`/`updateQueryData`); when RTK Query vs TanStack Query.
Level: intermediate → advanced.

**Topic 4 — `redux-middleware-async` — Middleware & Async**
The middleware signature (`store => next => action`); thunks (already default) vs the
**listener middleware** (`createListenerMiddleware`) as the modern side-effect tool;
brief landscape (Saga/Observable — where they still fit, why most teams don't need
them); store enhancers vs middleware; common async patterns and pitfalls. Level: advanced.

**Topic 5 — `redux-advanced-testing` — Advanced Patterns & Testing**
Normalization (byId/allIds) and why; performance — selector memoization, `useSelector`
equality & re-render pitfalls, `shallowEqual`; code-splitting reducers / dynamic reducer
injection (`reducerManager` / `combineSlices`); migrating off legacy Redux (connect →
hooks, plain reducers → slices); testing — slices/thunks (pure, easy), RTK Query,
components with a real store (RTL `renderWithProviders`). Level: advanced.

## 6. Correctness (2026 accuracy)

Prose notes — no execution harness. Accuracy is gated by **expert review against 2026
reality**, seeded with these facts every topic must respect:
- **Redux Toolkit is the standard**; hand-written Redux (manual action types, switch
  reducers, `connect`) is legacy — teach it only as historical context in topic 1.
- Current majors: **Redux 5.x, Redux Toolkit 2.x, React-Redux 9.x** (verify with
  WebSearch where a version-specific claim is made).
- `createListenerMiddleware` is the modern built-in side-effect tool (not Sagas by default).
- `createSlice`'s Immer "mutation" is real Immer behavior (drafts), not actual mutation.
- RTK Query is the RTK-native server-cache; TanStack Query is the common alternative.
- TypeScript-first patterns (typed hooks, `RootState`/`AppDispatch`).
- Reviewer verifies each topic's claims, code samples compile-correct in principle,
  and cross-topic consistency.

A lightweight automated check confirms structure only: each topic **registers** (loads
under a `window` shim without error), has a unique `id`, `module: 'redux'`, and the
required sections — no execution of prose.

## 7. Rollout Plan

Reviewable batches; nothing committed unless the user asks.

1. **Slice:** register the `redux` module in `_index.js`, author `redux-core`
   end-to-end, wire its `<script>` tag, add the `state-redux.js` cross-link. User
   reviews the module's look/feel + topic-1 depth in the browser. **STOP for review.**
2. `redux-toolkit`.
3. `redux-rtk-query`.
4. `redux-middleware-async`.
5. `redux-advanced-testing`.
6. Final accuracy-review pass across all five topics + a structural load check +
   browser pass (module appears, all five topics render, Prev/Next threads them,
   cross-links work).

Each content batch: author → structural load check → accuracy review → fix → summarize.

## 8. Risks & Mitigations

- **Inaccurate/outdated Redux claims** → §6 expert-review gate seeded with the 2026 fact
  list; verify versions with WebSearch.
- **Duplication with `state-redux.js`** → the module is the pedagogical course; the note
  stays the concise reference; reciprocal cross-links, no copied sections.
- **Module not appearing / topic not loading** → structural load check (unique ids,
  `module: 'redux'`, script tags present in correct order) + browser pass in Task 1/final.
- **Over-long single topics** → five focused topics instead of one page; each stays in
  the site's normal topic length range.

## 9. Open Questions

None blocking. Section subsets per topic (which of the 8 standard sections each uses)
are left to the author within the §4 minimum; adjustable during review.
