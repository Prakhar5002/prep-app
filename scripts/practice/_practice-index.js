/* ============================================================
   PRACTICE REGISTRY
   Defines practice categories and the registerChallenge API.
   Category files (js-*.js) register challenges by pushing here.
   ============================================================ */
(function () {
  window.PREP_SITE = window.PREP_SITE || {};
  var P = window.PREP_SITE;

  P.practiceCategories = [
    { id: 'js-arrays',         title: 'Arrays & Methods',        tier: 1 },
    { id: 'js-strings',        title: 'Strings & Manipulation',  tier: 1 },
    { id: 'js-async',          title: 'Async & Event Loop',      tier: 1 },
    { id: 'js-coercion',       title: 'Coercion & Edge Cases',   tier: 1 },
    { id: 'js-closures-scope', title: 'Closures & Scope',        tier: 1 },
    { id: 'js-objects',        title: 'Objects & References',    tier: 2 },
    { id: 'js-this',           title: 'this & Binding',          tier: 2 },
    { id: 'js-prototypes',     title: 'Prototypes & Inheritance',tier: 2 },
    { id: 'js-hoisting-tdz',   title: 'Hoisting & TDZ',          tier: 2 },
    { id: 'js-modules',        title: 'Modules (ESM/CJS)',       tier: 3 },
    { id: 'js-advanced',       title: 'Advanced (Proxy/Symbol/GC)', tier: 3 },
  ];

  P.challenges = P.challenges || [];

  var VALID_DIFF = { easy: 1, medium: 1, hard: 1 };
  var VALID_TYPE = { 'predict-output': 1, 'spot-the-bug': 1 };
  var catIds = {};
  P.practiceCategories.forEach(function (c) { catIds[c.id] = 1; });

  P.registerChallenge = function (c) {
    // Fail loud in dev if a challenge is malformed; harness relies on this too.
    if (!c || !c.id) throw new Error('registerChallenge: missing id');
    if (!catIds[c.category]) throw new Error('registerChallenge: bad category "' + c.category + '" for ' + c.id);
    if (!VALID_DIFF[c.difficulty]) throw new Error('registerChallenge: bad difficulty for ' + c.id);
    if (!VALID_TYPE[c.type]) throw new Error('registerChallenge: bad type for ' + c.id);
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
