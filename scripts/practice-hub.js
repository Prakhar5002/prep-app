/* PRACTICE HUB — renders the #/practice view. Stateless. */
(function () {
  window.PREP_SITE = window.PREP_SITE || {};
  var P = window.PREP_SITE;
  var esc = function (s) { return String(s).replace(/[&<>]/g, function (m) { return { '&':'&amp;','<':'&lt;','>':'&gt;' }[m]; }); };

  // In-memory view state (reset on every renderPractice call — stateless across reloads).
  var view = { category: 'all', difficulty: 'all', type: 'all', order: null };

  function catTitle(id) {
    var c = (P.practiceCategories || []).find(function (x) { return x.id === id; });
    return c ? c.title : id;
  }

  function current() {
    var list = P.filterChallenges(P.challenges || [], view);
    if (view.order) {
      var byId = {}; list.forEach(function (c) { byId[c.id] = c; });
      list = view.order.map(function (id) { return byId[id]; }).filter(Boolean);
    }
    return list;
  }

  function typeLabel(t) { return t === 'spot-the-bug' ? 'spot the bug' : 'predict output'; }

  function cardHtml(c, n) {
    var answerLabel = c.type === 'spot-the-bug' ? 'Fix' : 'Expected output';
    return '' +
      '<div class="pc-card" data-id="' + esc(c.id) + '">' +
        '<div class="pc-meta">#' + n + ' · ' + esc(catTitle(c.category)) +
          ' · <span class="pc-diff pc-diff-' + esc(c.difficulty) + '">' + esc(c.difficulty) + '</span>' +
          ' · ' + esc(typeLabel(c.type)) + '</div>' +
        '<div class="pc-prompt">' + esc(c.prompt) + '</div>' +
        '<pre><code class="language-js">' + esc(c.code) + '</code></pre>' +
        '<button class="pc-reveal">Reveal answer ▾</button>' +
        '<div class="pc-answer" hidden>' +
          '<div class="pc-answer-label">' + answerLabel + '</div>' +
          '<pre><code class="language-js">' + esc(c.answer) + '</code></pre>' +
          '<div class="pc-why"><strong>Why:</strong> ' + esc(c.explanation) + '</div>' +
        '</div>' +
      '</div>';
  }

  function optionList(sel, items) {
    return items.map(function (it) {
      return '<option value="' + esc(it.v) + '"' + (sel === it.v ? ' selected' : '') + '>' + esc(it.t) + '</option>';
    }).join('');
  }

  function controlsHtml(count) {
    var cats = [{ v: 'all', t: 'All topics' }].concat((P.practiceCategories || []).map(function (c) { return { v: c.id, t: c.title }; }));
    var diffs = [{ v:'all',t:'All difficulty' },{ v:'easy',t:'Easy' },{ v:'medium',t:'Medium' },{ v:'hard',t:'Hard' }];
    var types = [{ v:'all',t:'All types' },{ v:'predict-output',t:'Predict output' },{ v:'spot-the-bug',t:'Spot the bug' }];
    return '' +
      '<div class="pc-controls">' +
        '<select id="pcCat">' + optionList(view.category, cats) + '</select>' +
        '<select id="pcDiff">' + optionList(view.difficulty, diffs) + '</select>' +
        '<select id="pcType">' + optionList(view.type, types) + '</select>' +
        '<button id="pcShuffle">🔀 Shuffle</button>' +
        '<button id="pcRevealAll">Reveal all</button>' +
        '<span class="pc-count">' + count + ' challenge' + (count === 1 ? '' : 's') + '</span>' +
      '</div>';
  }

  function paint(container) {
    var list = current();
    container.innerHTML =
      '<h1 class="topic-title">🏋️ JS Practice</h1>' +
      controlsHtml(list.length) +
      '<div class="pc-list">' + list.map(function (c, i) { return cardHtml(c, i + 1); }).join('') + '</div>';
    if (window.Prism) window.Prism.highlightAll(container);
    wire(container);
  }

  function wire(container) {
    var byId = function (id) { return container.querySelector('#' + id); };
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
    view = { category: 'all', difficulty: 'all', type: 'all', order: null }; // reset = stateless
    paint(container);
    var toc = document.getElementById('tocList'); if (toc) toc.innerHTML = '';
    document.title = 'JS Practice · Prep';
  };
})();
