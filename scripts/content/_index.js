/* ============================================================
   CONTENT REGISTRY
   Defines all modules + their topics. Content files register
   themselves with detailed HTML by pushing to topicsById.
   ============================================================ */

window.PREP_SITE = window.PREP_SITE || {};
window.PREP_SITE.topicsById = window.PREP_SITE.topicsById || {};

window.PREP_SITE.registry = {
  modules: [
    {
      id: "js",
      title: "JavaScript Deep",
      topics: [
        { id: "js-execution-context", title: "Execution Context" },
        { id: "js-scope-chain", title: "Scope & Scope Chain" },
        { id: "js-closures", title: "Closures" },
        { id: "js-this", title: "this Keyword" },
        { id: "js-event-loop", title: "Event Loop" },
        { id: "js-hoisting-tdz", title: "Hoisting & TDZ" },
        { id: "js-prototypes", title: "Prototypes & Inheritance" },
        { id: "js-promises", title: "Promises & async/await" },
        { id: "js-advanced", title: "Advanced (Proxy, Symbol, Intl)" },
        { id: "js-memory-gc", title: "Memory & Garbage Collection" },
        { id: "js-modules", title: "Modules (ESM vs CJS)" },
      ],
    },
    {
      id: "dsa",
      title: "DSA",
      topics: [
        { id: "dsa-complexity", title: "Complexity Analysis" },
        { id: "dsa-arrays-strings", title: "Arrays & Strings" },
        { id: "dsa-two-pointers", title: "Two Pointers" },
        { id: "dsa-sliding-window", title: "Sliding Window" },
        { id: "dsa-hashing", title: "Hashing" },
        { id: "dsa-stack-queue", title: "Stack & Queue" },
        { id: "dsa-linked-list", title: "Linked List" },
        { id: "dsa-trees", title: "Trees" },
        { id: "dsa-graphs", title: "Graphs" },
        { id: "dsa-heaps", title: "Heaps" },
        { id: "dsa-trie", title: "Trie" },
        { id: "dsa-backtracking", title: "Backtracking" },
        { id: "dsa-dp", title: "Dynamic Programming" },
        { id: "dsa-greedy", title: "Greedy" },
        { id: "dsa-binary-search", title: "Binary Search" },
        { id: "dsa-bit", title: "Bit Manipulation" },
      ],
    },
    {
      id: "react",
      title: "React Deep",
      topics: [
        { id: "react-reconciliation", title: "Reconciliation & Fiber" },
        { id: "react-hooks", title: "Hooks Internals" },
        { id: "react-concurrent", title: "Concurrent React (18+)" },
        { id: "react-performance", title: "Performance" },
        { id: "react-state", title: "State Management" },
        { id: "react-ssr", title: "SSR / SSG / ISR / RSC" },
        { id: "react-testing", title: "Testing" },
        { id: "react-typescript", title: "TypeScript + React" },
        { id: "react-patterns", title: "Advanced Patterns" },
      ],
    },
    {
      id: "web",
      title: "Web Platform",
      topics: [
        { id: "web-html", title: "HTML" },
        { id: "web-rendering", title: "Rendering Pipeline" },
        { id: "web-cwv", title: "Core Web Vitals" },
        { id: "web-networking", title: "Networking (HTTP/TLS/CDN)" },
        { id: "web-security", title: "Security (XSS/CSRF/CSP)" },
        { id: "web-a11y", title: "Accessibility" },
        { id: "web-css", title: "CSS Deep" },
        { id: "web-storage", title: "Storage" },
        { id: "web-apis", title: "Browser APIs" },
      ],
    },
    {
      id: "rn",
      title: "React Native",
      topics: [
        { id: "rn-architecture", title: "Architecture (Bridge/Fabric/JSI)" },
        { id: "rn-components", title: "Core Components" },
        { id: "rn-navigation", title: "Navigation" },
        { id: "rn-state-data", title: "State & Data (MMKV/RQ)" },
        { id: "rn-styling", title: "Styling" },
        { id: "rn-animations", title: "Animations (Reanimated 3)" },
        { id: "rn-native-modules", title: "Native Modules" },
        { id: "rn-device-apis", title: "Device APIs & Permissions" },
        { id: "rn-performance", title: "Performance" },
        { id: "rn-build-release", title: "Build & Release" },
        { id: "rn-testing", title: "Testing" },
        { id: "rn-debugging", title: "Debugging" },
        { id: "rn-gotchas", title: "Common Gotchas" },
        { id: "rn-machine-coding", title: "Machine Coding" },
        { id: "rn-system-design", title: "Mobile System Design" },
      ],
    },
    {
      id: "typescript",
      title: "TypeScript",
      topics: [
        { id: "ts-type-system", title: "Type System Basics" },
        { id: "ts-generics", title: "Generics" },
        { id: "ts-conditional", title: "Conditional & Mapped Types" },
        { id: "ts-declaration", title: "Declaration Files" },
        { id: "ts-patterns", title: "Common Patterns" },
        { id: "ts-advanced", title: "Advanced Tricks" },
      ],
    },
    {
      id: "testing",
      title: "Testing",
      topics: [
        { id: "test-philosophy", title: "Testing Philosophy" },
        { id: "test-jest-rtl", title: "Jest + RTL Deep" },
        { id: "test-e2e", title: "E2E (Playwright/Detox/Maestro)" },
        { id: "test-mocking", title: "Mocking Strategies" },
        { id: "test-strategies", title: "Test Strategies" },
      ],
    },
    {
      id: "performance",
      title: "Frontend Performance",
      topics: [
        { id: "perf-crp", title: "Critical Rendering Path" },
        { id: "perf-cwv-deep", title: "Core Web Vitals Deep" },
        { id: "perf-images-fonts", title: "Images & Fonts" },
        { id: "perf-bundle-loading", title: "Bundle & Loading" },
        { id: "perf-runtime", title: "Runtime Performance" },
        { id: "perf-memory", title: "Memory Leaks" },
      ],
    },
    {
      id: "mobile-ux",
      title: "Mobile UX & Patterns",
      topics: [
        { id: "mux-ios-hig", title: "iOS Human Interface Guidelines" },
        { id: "mux-material", title: "Material Design 3" },
        { id: "mux-gestures", title: "Mobile Gestures" },
        { id: "mux-a11y", title: "Mobile Accessibility" },
      ],
    },
    {
      id: "mobile-prod",
      title: "Mobile Production",
      topics: [
        { id: "mprod-crash", title: "Crash Reporting" },
        { id: "mprod-analytics", title: "Analytics" },
        { id: "mprod-ab", title: "A/B Testing" },
        { id: "mprod-push", title: "Push Notifications" },
        { id: "mprod-iap", title: "In-App Purchases" },
        { id: "mprod-deep-link", title: "Deep Linking" },
        { id: "mprod-aso", title: "App Store Optimization" },
      ],
    },
    {
      id: "state-deep",
      title: "State Management Deep",
      topics: [
        { id: "state-redux", title: "Redux / RTK / RTK Query" },
        { id: "state-zustand-jotai", title: "Zustand & Jotai" },
        { id: "state-xstate", title: "XState (State Machines)" },
        { id: "state-server", title: "Server State (React Query)" },
        { id: "state-decision", title: "Decision Tree" },
      ],
    },
    {
      id: "animation",
      title: "Animation Deep",
      topics: [
        { id: "anim-css-js", title: "CSS vs JS Animation" },
        { id: "anim-waapi", title: "Web Animations API" },
        { id: "anim-flip", title: "FLIP Technique" },
        { id: "anim-reanimated", title: "Reanimated 3 Worklets" },
        { id: "anim-lottie", title: "Lottie & Complex Motion" },
      ],
    },
    {
      id: "api-design",
      title: "API Design",
      topics: [
        { id: "api-rest", title: "REST Principles" },
        { id: "api-graphql", title: "GraphQL Schema Design" },
        { id: "api-trpc", title: "tRPC / Type-Safe APIs" },
        { id: "api-realtime", title: "Realtime Decision Tree" },
        { id: "api-versioning", title: "Versioning & Rate Limiting" },
      ],
    },
    {
      id: "offline",
      title: "Offline & PWA",
      topics: [
        { id: "off-sw", title: "Service Workers Deep" },
        { id: "off-idb", title: "IndexedDB Strategies" },
        { id: "off-bg-sync", title: "Background Sync" },
        { id: "off-pwa", title: "PWA Manifest & Install" },
      ],
    },
    {
      id: "graphql",
      title: "GraphQL",
      topics: [
        { id: "gql-basics", title: "Basics" },
        { id: "gql-clients", title: "Client Libraries" },
        { id: "gql-caching", title: "Caching" },
        { id: "gql-advanced", title: "Advanced" },
      ],
    },
    {
      id: "debugging",
      title: "Debugging",
      topics: [
        { id: "dbg-chrome", title: "Chrome DevTools Mastery" },
        { id: "dbg-react", title: "React DevTools" },
        { id: "dbg-network", title: "Network & Performance" },
        { id: "dbg-memory", title: "Memory Leak Hunt" },
        { id: "dbg-mobile", title: "Mobile Debugging" },
      ],
    },
    {
      id: "machine-coding",
      title: "Machine Coding",
      topics: [
        { id: "mc-patterns", title: "Core Patterns" },
        { id: "mc-components", title: "Component Library" },
      ],
    },
    {
      id: "system-design",
      title: "Frontend System Design",
      topics: [
        { id: "sd-framework", title: "10-Step Framework" },
        { id: "sd-cases", title: "Case Studies" },
      ],
    },
    {
      id: "build",
      title: "Build Tooling",
      topics: [
        { id: "build-bundlers", title: "Bundlers (Webpack/Vite/Metro)" },
        { id: "build-compilers", title: "Compilers (Babel/SWC/tsc)" },
        { id: "build-optimizations", title: "Build Optimizations" },
        { id: "build-monorepos", title: "Monorepos" },
        { id: "build-pm", title: "Package Managers" },
      ],
    },
    {
      id: "behavioral",
      title: "Behavioral",
      topics: [
        { id: "beh-star", title: "STAR Framework" },
        { id: "beh-stories", title: "Story Bank (10 stories)" },
        { id: "beh-company-values", title: "Company Values (LPs etc.)" },
      ],
    },
    {
      id: "career",
      title: "Career & Soft Skills",
      topics: [
        { id: "car-resume", title: "Resume Optimization" },
        { id: "car-linkedin", title: "LinkedIn & Levels" },
        { id: "car-negotiation", title: "Salary Negotiation" },
        { id: "car-pacing", title: "Interview Pacing" },
        { id: "car-reverse-q", title: "Reverse Questions" },
      ],
    },
    {
      id: "git",
      title: "Git Deep",
      topics: [
        { id: "git-rebase", title: "Rebase vs Merge" },
        { id: "git-cherry", title: "Cherry-Pick" },
        { id: "git-bisect", title: "Bisect for Bug Hunting" },
        { id: "git-worktrees", title: "Worktrees" },
        { id: "git-recovery", title: "Recovery (reflog etc.)" },
      ],
    },
  ],
};

// Helper used by topic content files to register themselves
window.PREP_SITE.registerTopic = function (topic) {
  window.PREP_SITE.topicsById[topic.id] = topic;
};

window.CONTENT_REGISTRY = window.PREP_SITE.registry;
