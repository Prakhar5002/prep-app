/* ============================================================
   PRACTICE REGISTRY
   Defines practice categories and the registerChallenge API.
   Category files (js-*.js) register challenges by pushing here.
   ============================================================ */
(function () {
  window.PREP_SITE = window.PREP_SITE || {};
  var P = window.PREP_SITE;

  P.practiceCategories = [
    { id: 'js-arrays',         title: 'Arrays & Methods',        tier: 1, track: 'js' },
    { id: 'js-strings',        title: 'Strings & Manipulation',  tier: 1, track: 'js' },
    { id: 'js-async',          title: 'Async & Event Loop',      tier: 1, track: 'js' },
    { id: 'js-coercion',       title: 'Coercion & Edge Cases',   tier: 1, track: 'js' },
    { id: 'js-closures-scope', title: 'Closures & Scope',        tier: 1, track: 'js' },
    { id: 'js-objects',        title: 'Objects & References',    tier: 2, track: 'js' },
    { id: 'js-this',           title: 'this & Binding',          tier: 2, track: 'js' },
    { id: 'js-prototypes',     title: 'Prototypes & Inheritance',tier: 2, track: 'js' },
    { id: 'js-hoisting-tdz',   title: 'Hoisting & TDZ',          tier: 2, track: 'js' },
    { id: 'js-modules',        title: 'Modules (ESM/CJS)',       tier: 3, track: 'js' },
    { id: 'js-advanced',       title: 'Advanced (Proxy/Symbol/GC)', tier: 3, track: 'js' },

    { id: 'rn-architecture',      title: 'New Architecture & Internals', tier: 1, track: 'rn' },
    { id: 'rn-performance',       title: 'Performance & Optimization',    tier: 1, track: 'rn' },
    { id: 'rn-system-design',     title: 'RN System Design',              tier: 1, track: 'rn' },
    { id: 'rn-native-modules',    title: 'Native Modules & Bridging',     tier: 2, track: 'rn' },
    { id: 'rn-animations',        title: 'Animations & Gestures',         tier: 2, track: 'rn' },
    { id: 'rn-navigation',        title: 'Navigation',                    tier: 2, track: 'rn' },
    { id: 'rn-lists',             title: 'Lists & Rendering',             tier: 2, track: 'rn' },
    { id: 'rn-state-data',        title: 'State, Data & Offline',         tier: 2, track: 'rn' },
    { id: 'rn-platform-apis',     title: 'Platform APIs & Permissions',   tier: 3, track: 'rn' },
    { id: 'rn-build-release',     title: 'Build, Release & CI/CD',        tier: 3, track: 'rn' },
    { id: 'rn-testing-debugging', title: 'Testing & Debugging',           tier: 3, track: 'rn' },
    { id: 'rn-styling',           title: 'Styling & Layout',              tier: 3, track: 'rn' },
  ];

  P.challenges = P.challenges || [];

  var VALID_TYPE = { 'predict-output':1, 'spot-the-bug':1, 'deep-dive':1, 'scenario':1 };
  var DIFF_BY_TRACK = { js: { easy:1, medium:1, hard:1 }, rn: { core:1, senior:1, staff:1 } };
  var catIds = {};
  P.practiceCategories.forEach(function (c) { catIds[c.id] = 1; });

  P.registerChallenge = function (c) {
    if (!c || !c.id) throw new Error('registerChallenge: missing id');
    if (c.track === undefined) c.track = 'js';               // default track
    if (c.track !== 'js' && c.track !== 'rn') throw new Error('registerChallenge: bad track for ' + c.id);
    if (!catIds[c.category]) throw new Error('registerChallenge: bad category "' + c.category + '" for ' + c.id);
    if (!VALID_TYPE[c.type]) throw new Error('registerChallenge: bad type for ' + c.id);
    if (!DIFF_BY_TRACK[c.track][c.difficulty]) throw new Error('registerChallenge: bad difficulty "' + c.difficulty + '" for ' + c.id);
    P.challenges.push(c);
  };

  // Pure filter used by the hub to narrow challenges by category/difficulty/type.
  P.filterChallenges = function (challenges, f) {
    f = f || {};
    return challenges.filter(function (c) {
      if (f.category && f.category !== 'all' && c.category !== f.category) return false;
      if (f.difficulty && f.difficulty !== 'all' && c.difficulty !== f.difficulty) return false;
      if (f.type && f.type !== 'all' && c.type !== f.type) return false;
      return true;
    });
  };
})();
