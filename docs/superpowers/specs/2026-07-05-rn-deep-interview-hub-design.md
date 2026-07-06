# RN Deep Interview Hub — Design Spec

**Date:** 2026-07-05
**Status:** Approved design, pending implementation plan
**Repo:** Prep-Site (static, offline-first study site; no build step; vanilla JS via `<script>` tags)
**Builds on:** the JS Practice Hub (`docs/superpowers/specs/2026-07-05-js-practice-hub-design.md`), already shipped at `#/practice`.

## 1. Goal

Add a **very deep, senior/staff-level React Native interview-question bank** to the existing
practice hub, spanning all RN sub-topics. It goes materially deeper than the existing
per-topic "Interview Patterns" notes: each item coaches how a strong candidate actually
answers, not just the fact.

Success = the user can drill a large, interview-weighted bank of deep RN questions in the
same hub as the JS drills, reveal structured model answers, and trust every answer is
technically correct as of 2026.

## 2. Scope

**In scope**
- Generalize `#/practice` into two **tracks**: `JS Code Challenges` (existing 160) and `RN Deep Dives` (new).
- ~105 RN cards across 12 interview-weighted categories (see §6).
- A blend of formats: mostly `deep-dive` cards, a scenario-heavy `RN System Design` category, and a few RN `spot-the-bug` code cards where they fit.
- Structured multi-part revealed answers (see §5).
- Reuse of the hub's reveal / shuffle / stateless behavior and theme.

**Out of scope**
- No progress tracking / spaced repetition (hub stays stateless — refresh resets).
- No changes to the 160 existing JS challenges or the JS category files' content.
- No new RN topic **notes** (this is the drill bank, not the notes; notes stay as-is).
- No machine-execution harness for RN content (see §7 — RN code doesn't run in Node; correctness is review-based).

## 3. Architecture & Integration

Additive changes to the shipped hub. New content files register through the **same**
`registerChallenge` API.

**Modify (existing hub files)**
- `scripts/practice/_practice-index.js`
  - Add a `track` field to every entry in `practiceCategories` (`'js'` for the 11 existing, `'rn'` for the 12 new). Append the 12 RN categories.
  - `registerChallenge` gains: default `track` to `'js'` when absent (keeps existing JS files valid), and validate `track ∈ {'js','rn'}`, `type ∈ {'predict-output','spot-the-bug','deep-dive','scenario'}`. Difficulty validation becomes track-aware: JS uses `{easy,medium,hard}`; RN uses `{core,senior,staff}`.
- `scripts/practice-hub.js`
  - Add a **track switcher** (two buttons/tabs: JS Code Challenges | RN Deep Dives). Active track defaults to `'js'`.
  - `view` state gains `track`. `current()` filters by active track first; the Topic filter lists only the active track's categories; the Difficulty filter shows the active track's level values; the Type filter shows types present in the active track.
  - Card rendering branches on `type`: `predict-output`/`spot-the-bug` render as today (code + answer). `deep-dive`/`scenario` render the structured multi-part answer (see §5) — no leading code block required, though a card may include code inside an answer section.
  - Switching track resets Topic/Difficulty/Type filters and shuffle order.
- `styles/practice.css`
  - Add styles for the track switcher and the deep-dive answer sections (section labels, spacing), using existing theme tokens (`--bg-elev`, `--fg`, `--fg-muted`, `--border`, `--accent`, `--green/--yellow/--red`).
- `index.html`
  - Add `<script>` tags for the 12 new `scripts/practice/rn-*.js` files, between the JS category tags and `practice-hub.js`.

**Create**
- `scripts/practice/rn-architecture.js`, `rn-performance.js`, `rn-system-design.js`, `rn-native-modules.js`, `rn-animations.js`, `rn-navigation.js`, `rn-lists.js`, `rn-state-data.js`, `rn-platform-apis.js`, `rn-build-release.js`, `rn-testing-debugging.js`, `rn-styling.js` — one file per RN category.

**No change** to: JS category files, the router (`#/practice` route already exists), the note topics, the studied-progress system, or search.

## 4. Data Model

Extends the existing `Challenge` shape. Two new optional structures for the deep formats.

```js
// Existing JS card (unchanged; track defaults to 'js'):
registerChallenge({ id, category, difficulty, type:'predict-output'|'spot-the-bug',
                    prompt, code, answer, explanation });

// New RN deep-dive card:
registerChallenge({
  id: 'rn-arch-why-new-arch',
  track: 'rn',
  category: 'rn-architecture',
  difficulty: 'senior',           // core | senior | staff
  type: 'deep-dive',
  prompt: 'Why does the New Architecture exist, and what actually breaks without it?',
  answer: {                        // structured, multi-part
    core: 'Crisp senior-level answer…',
    mechanism: 'How it works under the hood…',
    tradeoffs: 'Nuance / when it matters…',
    followups: [                   // interviewer's next questions
      { q: 'How does it affect cold-start?', a: 'Short answer…' },
      { q: 'What is bridgeless mode?', a: 'Short answer…' },
    ],
    redFlags: 'Common shallow/wrong answers to avoid…',
  },
  // no top-level `code`; code may appear as HTML inside any answer string.
});

// New RN scenario card:
registerChallenge({
  id: 'rn-sysdesign-offline-first',
  track: 'rn', category: 'rn-system-design', difficulty: 'staff', type: 'scenario',
  prompt: 'Design an offline-first RN app that syncs when connectivity returns.',
  answer: {
    approach: 'Framing / clarifying questions to ask…',
    seniorChecks: 'What a senior evaluates first…',
    walkthrough: 'The model design walkthrough…',
    followups: [ { q: '…', a: '…' } ],
  },
});

// RN spot-the-bug code card (reuses the string-answer shape, track 'rn'):
registerChallenge({ id, track:'rn', category, difficulty, type:'spot-the-bug',
                    prompt, code, answer /* string: the fix */, explanation });
```

Field rules:
- `track`: `'js'` (default) | `'rn'`.
- `difficulty`: JS → `easy|medium|hard`; RN → `core|senior|staff` (validated per track).
- `type`: `predict-output` | `spot-the-bug` | `deep-dive` | `scenario`.
- For `deep-dive`/`scenario`, `answer` is an **object** with the fields above; each string field is raw HTML (may contain `<pre><code>`, `<ul>`, inline `<code>`). `followups` is an array of `{q,a}`. `explanation` is unused for these types.
- For `predict-output`/`spot-the-bug`, `answer` stays a **string** (as today).
- All answer text is inserted as HTML (authored trusted content), matching how the existing note/section HTML works; the hub still `esc()`s the JS-card code/answer paths as it does now. Deep-dive HTML fields are rendered as-is (trusted, like `registerTopic` section HTML).

## 5. UX / Interaction

Single hub at `#/practice`, now track-aware.

```
🏋️ Practice
[ JS Code Challenges ]  [ RN Deep Dives ]         ← track switcher (active highlighted)
Topic:[All ▾]  Level:[All ▾]  Type:[All ▾]   [ 🔀 Shuffle ]  [ Reveal all ]   N cards
─────────────────────────────────────────────
#1 · New Architecture · Senior · deep dive
  Why does the New Architecture exist, and what breaks without it?
  [ Reveal answer ▾ ]
    → Core answer:        …
      Deeper mechanism:   …
      Tradeoffs:          …
      Follow-ups:
        • Q: … — A: …
        • Q: … — A: …
      🚩 Red flags:       …
```

- **Track switcher**: two tabs; clicking sets `view.track`, resets filters + shuffle, re-renders. The Difficulty filter relabels to "Level" and shows `core/senior/staff` for the RN track; the Topic filter shows the active track's categories; the count reflects the active track.
- **Reveal** (per-card + Reveal-all/Hide-all) reused. For deep-dive/scenario, reveal expands the structured sections with labeled headings.
- **Shuffle** reorders the filtered (active-track) list in memory.
- **Stateless** — refresh resets track/filters/reveals; no localStorage.
- Long answers: cards can be tall; the list renders the filtered set only, reveal builds answer HTML on first open (lazy) to keep initial paint light.
- Theme: reuse existing tokens; dark + light both correct.

## 6. RN Coverage & Weighting (interview-frequency-weighted, all sub-topics)

Categories (id → title, tier, ~count). RN difficulty ("level") spread per category should
skew senior with some core and some staff; not everything is staff.

| Tier | id | Title | ~Count |
|------|----|-------|--------|
| 1 | `rn-architecture` | New Architecture & Internals | ~12 |
| 1 | `rn-performance` | Performance & Optimization | ~12 |
| 1 | `rn-system-design` | RN System Design (scenarios) | ~12 |
| 2 | `rn-native-modules` | Native Modules & Bridging | ~9 |
| 2 | `rn-animations` | Animations & Gestures (Reanimated) | ~9 |
| 2 | `rn-navigation` | Navigation | ~9 |
| 2 | `rn-lists` | Lists & Rendering | ~9 |
| 2 | `rn-state-data` | State, Data & Offline | ~9 |
| 3 | `rn-platform-apis` | Native / Platform APIs & Permissions | ~6 |
| 3 | `rn-build-release` | Build, Release & CI/CD (EAS, OTA) | ~6 |
| 3 | `rn-testing-debugging` | Testing & Debugging | ~6 |
| 3 | `rn-styling` | Styling & Layout | ~6 |

**Total ≈ 105 cards.** `rn-system-design` is mostly `scenario` type; other categories are
mostly `deep-dive` with a few `spot-the-bug` code cards where a concrete snippet teaches
better (e.g. FlatList keyExtractor, useEffect cleanup, Reanimated worklet capture).

Current-as-of-2026 facts every card must respect (non-exhaustive): New Architecture is the
**default since RN 0.76** (legacy frozen); **Reanimated v4** (New-Arch-only, worklets in
`react-native-worklets`); **React Native DevTools** replaced Flipper; Remote JS Debugging
removed in 0.79; FlashList v2 (no `estimatedItemSize`); Hermes default; React Navigation v7;
Expo Router v5-era; EAS Build/Update for OTA (CodePush deprecated).

## 7. Correctness / Verification (the key difference)

RN conceptual answers **cannot be machine-verified** — there is no output to diff, and RN
code (FlatList, Reanimated worklets, native modules) does not run in Node. So the correctness
gate is **expert review against current RN reality**, the same rigor used in the content audit:

- After each category batch is authored, dispatch **reviewer agents** that fact-check every
  card: is the technical claim correct and current (2026)? Any outdated version/API/default?
  Does the "red flags" section correctly identify wrong answers? Are follow-up answers right?
- Reviewers use web verification for version-sensitive claims where useful.
- Findings (inaccuracy, outdated fact, misleading framing) are fixed before the batch is done.
- Lightweight automated checks still apply: a small Node "shape validator" (extending the
  existing harness) confirms every RN card has valid `track`/`category`/`difficulty`/`type`,
  the correct `answer` shape for its type (object-with-required-fields for deep-dive/scenario,
  string for code types), unique ids, and non-empty fields. This validator does NOT execute
  answers — it only checks structure.

## 8. Rollout Plan

Reviewable batches; nothing committed unless the user asks.

1. **Track infrastructure + vertical slice:** extend `_practice-index.js` (track field, RN
   categories, validation), `practice-hub.js` (track switcher + deep-dive/scenario rendering),
   `practice.css`, the shape validator, and author `rn-architecture` (~12 cards) end-to-end +
   wire its tag. User reviews the look/feel of the RN track. **STOP for review.**
2. **Rest of Tier 1:** `rn-performance`, `rn-system-design`.
3. **Tier 2:** native-modules, animations, navigation, lists, state-data.
4. **Tier 3:** platform-apis, build-release, testing-debugging, styling.
5. **Final fact-check pass** across all RN cards + full shape-validator run.

Each batch: author → shape-validate → expert-review for accuracy → fix → summarize.

## 9. Risks & Mitigations

- **Inaccurate/outdated RN claims** (no harness to catch them) → §7 expert-review gate on every
  batch, seeded with the 2026 fact list in §6.
- **Regressing the JS track** → `track` defaults to `'js'`; JS files unchanged; track filtering
  is additive. Shape validator + a manual check that the JS track still shows 160.
- **Data-model divergence** (string vs object `answer`) → the hub branches on `type`; the shape
  validator enforces the right shape per type so a mis-shaped card fails fast.
- **Long-page performance** with ~105 tall cards → filtered-set render + lazy answer build on
  first reveal (as today); acceptable at this scale.
- **Theme drift** → reuse existing CSS tokens; no new color literals.

## 10. Open Questions

None blocking. Section labels for deep-dive answers (Core / Deeper mechanism / Tradeoffs /
Follow-ups / Red flags) and scenario answers (Approach / Senior checks / Walkthrough /
Follow-ups) are fixed here; wording adjustable during review.
