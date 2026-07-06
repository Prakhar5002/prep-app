/* PRACTICE HUB — renders the #/practice view. Stateless. */
(function () {
  window.PREP_SITE = window.PREP_SITE || {};
  var P = window.PREP_SITE;
  var esc = function (s) { return String(s).replace(/[&<>]/g, function (m) { return { '&':'&amp;','<':'&lt;','>':'&gt;' }[m]; }); };

  // In-memory view state (reset on every renderPractice call — stateless across reloads).
  var view = { track: 'js', category: 'all', difficulty: 'all', type: 'all', order: null };

  function catTitle(id) {
    var c = (P.practiceCategories || []).find(function (x) { return x.id === id; });
    return c ? c.title : id;
  }

  function catsForTrack(t) { return (P.practiceCategories || []).filter(function (c) { return (c.track || 'js') === t; }); }
  function distinct(arr) { var s = {}; arr.forEach(function (x) { s[x] = 1; }); return Object.keys(s); }

  function current() {
    var pool = (P.challenges || []).filter(function (c) { return (c.track || 'js') === view.track; });
    var list = P.filterChallenges(pool, view);
    if (view.order) {
      var byId = {}; list.forEach(function (c) { byId[c.id] = c; });
      list = view.order.map(function (id) { return byId[id]; }).filter(Boolean);
    }
    return list;
  }

  function typeLabel(t) {
    if (t === 'spot-the-bug') return 'spot the bug';
    if (t === 'deep-dive') return 'deep dive';
    if (t === 'scenario') return 'scenario';
    return 'predict output';
  }

  function fus(followups) {
    return '<ul class="pc-fu">' + (followups || []).map(function (f) {
      return '<li><span class="pc-fu-q">Q: ' + f.q + '</span> <span class="pc-fu-a">' + f.a + '</span></li>';
    }).join('') + '</ul>';
  }
  function sectionsHtml(type, a) {
    var rows;
    if (type === 'scenario') {
      rows = [['Approach', a.approach], ['What a senior checks first', a.seniorChecks], ['Model walkthrough', a.walkthrough]];
    } else {
      rows = [['Core answer', a.core], ['Deeper mechanism', a.mechanism], ['Tradeoffs & when it matters', a.tradeoffs]];
    }
    var html = rows.map(function (r) { return '<div class="pc-sec"><div class="pc-sec-label">' + r[0] + '</div><div class="pc-sec-body">' + r[1] + '</div></div>'; }).join('');
    html += '<div class="pc-sec"><div class="pc-sec-label">Follow-ups</div>' + fus(a.followups) + '</div>';
    if (type === 'deep-dive') html += '<div class="pc-sec pc-redflags"><div class="pc-sec-label">🚩 Red flags</div><div class="pc-sec-body">' + a.redFlags + '</div></div>';
    return html;
  }

  function cardHtml(c, n) {
    var isDeep = (c.type === 'deep-dive' || c.type === 'scenario');
    var codeBlock = isDeep ? '' : '<pre><code class="language-js">' + esc(c.code) + '</code></pre>';
    var answerInner = isDeep
      ? sectionsHtml(c.type, c.answer)
      : '<div class="pc-answer-label">' + (c.type === 'spot-the-bug' ? 'Fix' : 'Expected output') + '</div>' +
        '<pre><code class="language-js">' + esc(c.answer) + '</code></pre>' +
        '<div class="pc-why"><strong>Why:</strong> ' + esc(c.explanation) + '</div>';
    return '' +
      '<div class="pc-card" data-id="' + esc(c.id) + '">' +
        '<div class="pc-meta">#' + n + ' · ' + esc(catTitle(c.category)) +
          ' · <span class="pc-diff pc-diff-' + esc(c.difficulty) + '">' + esc(c.difficulty) + '</span>' +
          ' · ' + esc(typeLabel(c.type)) + '</div>' +
        '<div class="pc-prompt">' + esc(c.prompt) + '</div>' +
        codeBlock +
        '<button class="pc-reveal">Reveal answer ▾</button>' +
        '<div class="pc-answer" hidden>' +
          answerInner +
        '</div>' +
      '</div>';
  }

  function optionList(sel, items) {
    return items.map(function (it) {
      return '<option value="' + esc(it.v) + '"' + (sel === it.v ? ' selected' : '') + '>' + esc(it.t) + '</option>';
    }).join('');
  }

  function controlsHtml(count) {
    var cats = [{ v: 'all', t: 'All topics' }].concat(catsForTrack(view.track).map(function (c) { return { v: c.id, t: c.title }; }));
    var pool = (P.challenges || []).filter(function (c) { return (c.track || 'js') === view.track; });
    var diffVals = distinct(pool.map(function (c) { return c.difficulty; }));
    var diffOrder = view.track === 'rn' ? ['core','senior','staff'] : ['easy','medium','hard'];
    diffVals.sort(function (a, b) { return diffOrder.indexOf(a) - diffOrder.indexOf(b); });
    var diffLabel = view.track === 'rn' ? 'level' : 'difficulty';
    var diffs = [{ v: 'all', t: 'All ' + diffLabel }].concat(diffVals.map(function (d) { return { v: d, t: d }; }));
    var typeVals = distinct(pool.map(function (c) { return c.type; }));
    var typeName = { 'predict-output':'Predict output', 'spot-the-bug':'Spot the bug', 'deep-dive':'Deep dive', 'scenario':'Scenario' };
    var types = [{ v: 'all', t: 'All types' }].concat(typeVals.map(function (t) { return { v: t, t: typeName[t] || t }; }));
    var tab = function (t, label) { return '<button class="pc-track' + (view.track === t ? ' active' : '') + '" data-track="' + t + '">' + label + '</button>'; };
    return '' +
      '<div class="pc-tracks">' + tab('js', 'JS Code Challenges') + tab('rn', 'RN Deep Dives') + '</div>' +
      '<div class="pc-controls">' +
        '<select id="pcCat">' + optionList(view.category, cats) + '</select>' +
        '<select id="pcDiff">' + optionList(view.difficulty, diffs) + '</select>' +
        '<select id="pcType">' + optionList(view.type, types) + '</select>' +
        '<button id="pcShuffle">🔀 Shuffle</button>' +
        '<button id="pcRevealAll">Reveal all</button>' +
        '<span class="pc-count">' + count + ' card' + (count === 1 ? '' : 's') + '</span>' +
      '</div>';
  }

  function paint(container) {
    var list = current();
    var trackTitle = view.track === 'rn' ? '🧠 RN Deep Dives' : '🏋️ JS Practice';
    container.innerHTML =
      '<h1 class="topic-title">' + trackTitle + '</h1>' +
      controlsHtml(list.length) +
      '<div class="pc-list">' + list.map(function (c, i) { return cardHtml(c, i + 1); }).join('') + '</div>';
    document.title = (view.track === 'rn' ? 'RN Deep Dives' : 'JS Practice') + ' · Prep';
    if (window.Prism) window.Prism.highlightAll(container);
    wire(container);
  }

  function wire(container) {
    var byId = function (id) { return container.querySelector('#' + id); };
    Array.prototype.forEach.call(container.querySelectorAll('.pc-track'), function (btn) {
      btn.addEventListener('click', function () {
        var t = btn.getAttribute('data-track');
        if (t === view.track) return;
        view.track = t; view.category = 'all'; view.difficulty = 'all'; view.type = 'all'; view.order = null;
        paint(container);
      });
    });
    byId('pcCat').addEventListener('change', function (e) { view.category = e.target.value; view.order = null; paint(container); });
    byId('pcDiff').addEventListener('change', function (e) { view.difficulty = e.target.value; view.order = null; paint(container); });
    byId('pcType').addEventListener('change', function (e) { view.type = e.target.value; view.order = null; paint(container); });
    byId('pcShuffle').addEventListener('click', function () {
      var ids = current().map(function (c) { return c.id; });
      for (var i = ids.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = ids[i]; ids[i] = ids[j]; ids[j] = t; }
      view.order = ids; paint(container);
    });
    var revealAllBtn = byId('pcRevealAll');
    revealAllBtn.addEventListener('click', function () {
      var cards = container.querySelectorAll('.pc-answer');
      var anyHidden = Array.prototype.some.call(cards, function (a) { return a.hidden; });
      Array.prototype.forEach.call(cards, function (a) { a.hidden = !anyHidden; });
      Array.prototype.forEach.call(container.querySelectorAll('.pc-reveal'), function (b) {
        b.textContent = anyHidden ? 'Hide answer ▴' : 'Reveal answer ▾';
      });
      revealAllBtn.textContent = anyHidden ? 'Hide all' : 'Reveal all';
    });
    // Per-card reveal (delegated).
    container.querySelector('.pc-list').addEventListener('click', function (e) {
      var btn = e.target.closest('.pc-reveal'); if (!btn) return;
      var ans = btn.nextElementSibling;
      ans.hidden = !ans.hidden;
      btn.textContent = ans.hidden ? 'Reveal answer ▾' : 'Hide answer ▴';
      var stillHidden = Array.prototype.some.call(container.querySelectorAll('.pc-answer'), function (a) { return a.hidden; });
      revealAllBtn.textContent = stillHidden ? 'Reveal all' : 'Hide all';
    });
  }

  P.renderPractice = function (container) {
    view = { track: 'js', category: 'all', difficulty: 'all', type: 'all', order: null }; // reset = stateless
    paint(container);
    var toc = document.getElementById('tocList'); if (toc) toc.innerHTML = '';
    document.title = 'JS Practice · Prep';
  };
})();
