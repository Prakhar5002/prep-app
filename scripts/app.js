/* ============================================================
   PREP SITE — App logic (router, sidebar, search, theme, progress)
   Depends on: window.PREP_SITE (from _index.js + topic files), window.Prism
   ============================================================ */
(function () {
  'use strict';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const store = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem('prep:' + key)) ?? fallback; }
      catch (e) { return fallback; }
    },
    set(key, val) {
      try { localStorage.setItem('prep:' + key, JSON.stringify(val)); } catch (e) {}
    }
  };

  const state = {
    studied: new Set(store.get('studied', [])),
    collapsedModules: new Set(store.get('collapsedModules', [])),
    currentTopicId: null
  };

  // ==========================================================
  // THEME
  // ==========================================================
  function initTheme() {
    const saved = store.get('theme', 'dark');
    document.documentElement.setAttribute('data-theme', saved);
    $('#themeToggle').addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      store.set('theme', next);
    });
  }

  // ==========================================================
  // SIDEBAR
  // ==========================================================
  function renderSidebar() {
    const nav = $('#sidebarNav');
    const registry = window.PREP_SITE.registry;
    const topicsById = window.PREP_SITE.topicsById;

    nav.innerHTML = registry.modules.map(mod => {
      const topicsHtml = mod.topics.map(t => {
        const topic = topicsById[t.id];
        const isReady = !!topic;
        const isStudied = state.studied.has(t.id);
        return `
          <a href="#/topic/${t.id}"
             class="nav-topic ${isStudied ? 'studied' : ''}"
             data-topic-id="${t.id}">
            <svg class="nav-topic-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span class="nav-topic-title">${escapeHtml(t.title)}</span>
            ${!isReady ? '<span class="nav-topic-tag coming">soon</span>' : ''}
          </a>
        `;
      }).join('');

      const isCollapsed = state.collapsedModules.has(mod.id);
      return `
        <div class="nav-module ${isCollapsed ? 'collapsed' : ''}" data-module-id="${mod.id}">
          <div class="nav-module-header">
            <span>${escapeHtml(mod.title)}</span>
            <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="nav-topics">${topicsHtml}</div>
        </div>
      `;
    }).join('');

    // Module collapse handlers
    $$('.nav-module-header', nav).forEach(header => {
      header.addEventListener('click', () => {
        const moduleEl = header.parentElement;
        const modId = moduleEl.dataset.moduleId;
        moduleEl.classList.toggle('collapsed');
        if (moduleEl.classList.contains('collapsed')) state.collapsedModules.add(modId);
        else state.collapsedModules.delete(modId);
        store.set('collapsedModules', Array.from(state.collapsedModules));
      });
    });

    // Close sidebar on mobile when a topic is picked
    $$('.nav-topic', nav).forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 900) closeSidebar();
      });
    });

    updateProgress();
  }

  function updateActiveNav(topicId) {
    $$('.nav-topic').forEach(link => {
      link.classList.toggle('active', link.dataset.topicId === topicId);
    });
  }

  function updateProgress() {
    const total = Object.keys(window.PREP_SITE.topicsById).length;
    const studied = Array.from(state.studied).filter(id => window.PREP_SITE.topicsById[id]).length;
    $('#progressCount').textContent = studied;
    $('#progressTotal').textContent = total;
    $('#progressFill').style.width = total ? ((studied / total) * 100) + '%' : '0%';
  }

  // ==========================================================
  // MOBILE SIDEBAR TOGGLE
  // ==========================================================
  function openSidebar() { $('#sidebar').classList.add('open'); }
  function closeSidebar() { $('#sidebar').classList.remove('open'); }
  function initSidebarToggle() {
    $('#menuToggle').addEventListener('click', () => {
      const sb = $('#sidebar');
      if (sb.classList.contains('open')) closeSidebar(); else openSidebar();
    });
    $('#sidebarOverlay').addEventListener('click', closeSidebar);
  }

  // ==========================================================
  // ROUTER
  // ==========================================================
  function parseRoute() {
    const hash = location.hash.slice(1);
    if (!hash || hash === '/' || hash === '') return { name: 'home' };
    const topicMatch = hash.match(/^\/topic\/([\w-]+)(?:#(.+))?$/);
    if (topicMatch) return { name: 'topic', topicId: topicMatch[1], anchor: topicMatch[2] };
    return { name: 'home' };
  }

  function route() {
    const r = parseRoute();
    if (r.name === 'home') renderHome();
    else if (r.name === 'topic') renderTopic(r.topicId, r.anchor);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // ==========================================================
  // HOME
  // ==========================================================
  function renderHome() {
    const reg = window.PREP_SITE.registry;
    const content = $('#content');
    state.currentTopicId = null;
    updateActiveNav(null);

    let totalReady = 0;
    let totalTopics = 0;
    reg.modules.forEach(m => {
      m.topics.forEach(t => {
        totalTopics++;
        if (window.PREP_SITE.topicsById[t.id]) totalReady++;
      });
    });

    const moduleCards = reg.modules.map(mod => {
      const ready = mod.topics.filter(t => window.PREP_SITE.topicsById[t.id]).length;
      const studied = mod.topics.filter(t => state.studied.has(t.id)).length;
      const pct = mod.topics.length ? (studied / mod.topics.length) * 100 : 0;
      return `
        <a href="#/topic/${mod.topics[0] ? mod.topics[0].id : ''}" class="home-card">
          <div class="home-card-title">${escapeHtml(mod.title)}</div>
          <div class="home-card-meta">${ready} / ${mod.topics.length} topics ready · ${studied} studied</div>
          <div class="home-card-progress"><div class="home-card-progress-fill" style="width:${pct}%"></div></div>
        </a>
      `;
    }).join('');

    content.innerHTML = `
      <div class="home-hero">
        <h1>Frontend Interview Prep</h1>
        <p>Extreme-depth notes for FAANG and mid-size product companies, mobile-focused. ${totalReady} of ${totalTopics} topics ready. Open any module below.</p>
      </div>
      <div class="home-grid">${moduleCards}</div>
    `;
    $('#tocList').innerHTML = '';
    document.title = 'Prep · FAANG + Mobile Frontend';
  }

  // ==========================================================
  // TOPIC RENDER
  // ==========================================================
  function renderTopic(topicId, anchor) {
    const topic = window.PREP_SITE.topicsById[topicId];
    const content = $('#content');
    state.currentTopicId = topicId;
    updateActiveNav(topicId);

    if (!topic) {
      content.innerHTML = `
        <div class="coming-soon">
          <h2>Coming soon</h2>
          <p>This topic hasn't been written yet. It's in the build queue.</p>
          <a href="#/">← Back home</a>
        </div>
      `;
      $('#tocList').innerHTML = '';
      document.title = 'Not ready · Prep';
      return;
    }

    const sectionsHtml = topic.sections.map((sec, idx) => {
      const collapsible = sec.collapsible !== false && idx > 0;
      return `
        <section class="section ${collapsible ? 'collapsible' : ''}" id="sec-${sec.id}">
          <div class="section-header">
            <h2 id="${sec.id}">
              ${sec.title}
              <a href="#/topic/${topicId}#${sec.id}" class="anchor-link" aria-label="Link to section">#</a>
            </h2>
            ${collapsible ? '<svg class="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>' : ''}
          </div>
          <div class="section-body">${sec.html}</div>
        </section>
      `;
    }).join('');

    // Find prev/next topics
    const reg = window.PREP_SITE.registry;
    const allTopics = [];
    reg.modules.forEach(m => m.topics.forEach(t => allTopics.push(t)));
    const currIdx = allTopics.findIndex(t => t.id === topicId);
    const prev = currIdx > 0 ? allTopics[currIdx - 1] : null;
    const next = currIdx >= 0 && currIdx < allTopics.length - 1 ? allTopics[currIdx + 1] : null;

    const navHtml = `
      <div class="topic-nav">
        ${prev ? `<a href="#/topic/${prev.id}" class="topic-nav-item">
          <span class="topic-nav-label">← Previous</span>
          <span class="topic-nav-title">${escapeHtml(prev.title)}</span>
        </a>` : '<div></div>'}
        ${next ? `<a href="#/topic/${next.id}" class="topic-nav-item next">
          <span class="topic-nav-label">Next →</span>
          <span class="topic-nav-title">${escapeHtml(next.title)}</span>
        </a>` : '<div></div>'}
      </div>
    `;

    const tagsHtml = (topic.tags || []).map(t => `<span class="topic-tag">${escapeHtml(t)}</span>`).join('');

    content.innerHTML = `
      <div class="topic-meta">
        <span class="topic-meta-module">${escapeHtml(topic.module)}</span>
        <span class="topic-meta-sep">·</span>
        <span class="topic-meta-time">${escapeHtml(topic.estimatedReadTime || '')}</span>
      </div>
      <h1 class="topic-title">${escapeHtml(topic.title)}</h1>
      <div class="topic-tags">${tagsHtml}</div>
      ${sectionsHtml}
      ${navHtml}
    `;

    // Section collapse handlers
    $$('.section.collapsible .section-header', content).forEach(header => {
      header.addEventListener('click', (e) => {
        if (e.target.closest('.anchor-link')) return;
        header.parentElement.classList.toggle('collapsed');
      });
    });

    // Syntax highlight code
    if (window.Prism) window.Prism.highlightAll(content);

    // Copy buttons for code blocks
    $$('pre', content).forEach(pre => {
      const btn = document.createElement('button');
      btn.className = 'code-copy';
      btn.textContent = 'Copy';
      btn.addEventListener('click', () => {
        const code = pre.querySelector('code').textContent;
        navigator.clipboard.writeText(code).then(() => {
          btn.textContent = '✓ Copied';
          btn.classList.add('copied');
          setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1500);
        });
      });
      pre.appendChild(btn);
    });

    // Build TOC
    buildTOC();

    // Update progress-toggle button active state
    const pt = $('#progressToggle');
    pt.classList.toggle('active', state.studied.has(topicId));

    document.title = `${topic.title} · Prep`;

    // Jump to anchor if provided
    if (anchor) {
      setTimeout(() => {
        const el = document.getElementById(anchor);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }

  // ==========================================================
  // TABLE OF CONTENTS (right rail)
  // ==========================================================
  function buildTOC() {
    const list = $('#tocList');
    const headings = $$('.content h2[id], .content h3[id]');
    list.innerHTML = headings.map(h => {
      const indent = h.tagName === 'H3' ? 'style="padding-left:12px"' : '';
      return `<li ${indent}><a href="#/topic/${state.currentTopicId}#${h.id}">${escapeHtml(h.textContent.replace('#', '').trim())}</a></li>`;
    }).join('');
    // Spy on scroll
    if (headings.length) initTOCSpy(headings);
  }

  let tocSpyObserver;
  function initTOCSpy(headings) {
    if (tocSpyObserver) tocSpyObserver.disconnect();
    tocSpyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          $$('#tocList a').forEach(a => {
            a.classList.toggle('active', a.getAttribute('href').endsWith('#' + id));
          });
        }
      });
    }, { rootMargin: '-80px 0px -70% 0px' });
    headings.forEach(h => tocSpyObserver.observe(h));
  }

  // ==========================================================
  // PROGRESS TOGGLE
  // ==========================================================
  function initProgressToggle() {
    $('#progressToggle').addEventListener('click', () => {
      const id = state.currentTopicId;
      if (!id) return;
      if (state.studied.has(id)) state.studied.delete(id);
      else state.studied.add(id);
      store.set('studied', Array.from(state.studied));
      $('#progressToggle').classList.toggle('active', state.studied.has(id));
      $$('.nav-topic').forEach(link => {
        link.classList.toggle('studied', state.studied.has(link.dataset.topicId));
      });
      updateProgress();
    });
  }

  // ==========================================================
  // SEARCH
  // ==========================================================
  let searchIndex = null;
  function buildSearchIndex() {
    const idx = [];
    const reg = window.PREP_SITE.registry;
    reg.modules.forEach(mod => {
      mod.topics.forEach(t => {
        const topic = window.PREP_SITE.topicsById[t.id];
        idx.push({
          type: 'topic',
          topicId: t.id,
          title: t.title,
          module: mod.title,
          tags: (topic?.tags || []).join(' '),
          ready: !!topic
        });
        if (topic) {
          topic.sections.forEach(sec => {
            idx.push({
              type: 'section',
              topicId: t.id,
              sectionId: sec.id,
              title: sec.title.replace(/[^\w\s:()-]/g, '').trim(),
              topicTitle: t.title,
              module: mod.title
            });
          });
        }
      });
    });
    searchIndex = idx;
  }

  function openSearch() {
    $('#searchModal').hidden = false;
    $('#searchInput').value = '';
    $('#searchInput').focus();
    runSearch('');
  }
  function closeSearch() { $('#searchModal').hidden = true; }

  function highlight(text, query) {
    if (!query) return escapeHtml(text);
    const re = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
    return escapeHtml(text).replace(re, '<mark>$1</mark>');
  }

  function runSearch(q) {
    const results = $('#searchResults');
    if (!searchIndex) buildSearchIndex();
    const query = q.trim().toLowerCase();

    let matches;
    if (!query) {
      matches = searchIndex.filter(e => e.type === 'topic').slice(0, 20);
    } else {
      matches = searchIndex.filter(e => {
        const hay = (e.title + ' ' + (e.module || '') + ' ' + (e.tags || '') + ' ' + (e.topicTitle || '')).toLowerCase();
        return hay.includes(query);
      }).slice(0, 30);
    }

    if (!matches.length) {
      results.innerHTML = `<div class="search-empty">No matches for "${escapeHtml(q)}"</div>`;
      return;
    }
    results.innerHTML = matches.map((m, i) => {
      const href = m.type === 'topic'
        ? `#/topic/${m.topicId}`
        : `#/topic/${m.topicId}#${m.sectionId}`;
      const meta = m.type === 'topic'
        ? `${m.module}${m.ready ? '' : ' · coming soon'}`
        : `${m.topicTitle} · ${m.module}`;
      return `
        <a href="${href}" class="search-result" data-idx="${i}">
          <div class="search-result-title">${highlight(m.title, query)}</div>
          <div class="search-result-meta">${highlight(meta, query)}</div>
        </a>
      `;
    }).join('');
    // Activate first
    const first = results.querySelector('.search-result');
    if (first) first.classList.add('active');
  }

  function initSearch() {
    $('#searchTrigger').addEventListener('click', openSearch);
    $('#searchBackdrop').addEventListener('click', closeSearch);
    $('#searchInput').addEventListener('input', (e) => runSearch(e.target.value));

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearch();
      } else if (e.key === '/' && !$('#searchModal').hidden === false &&
                 !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        openSearch();
      } else if (e.key === 'Escape' && !$('#searchModal').hidden) {
        closeSearch();
      }
    });

    // Arrow-key nav in results
    $('#searchInput').addEventListener('keydown', (e) => {
      const results = $$('#searchResults .search-result');
      if (!results.length) return;
      const current = results.findIndex(r => r.classList.contains('active'));
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        results[current]?.classList.remove('active');
        results[Math.min(current + 1, results.length - 1)].classList.add('active');
        results[Math.min(current + 1, results.length - 1)].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        results[current]?.classList.remove('active');
        results[Math.max(current - 1, 0)].classList.add('active');
        results[Math.max(current - 1, 0)].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const active = results[current] || results[0];
        if (active) {
          location.hash = active.getAttribute('href');
          closeSearch();
        }
      }
    });
  }

  // ==========================================================
  // MOBILE TOC FAB
  // ==========================================================
  function initTocFab() {
    const fab = $('#tocFab');
    fab.addEventListener('click', () => {
      const toc = $('#toc');
      if (toc.style.display === 'block') {
        toc.style.display = '';
      } else {
        toc.style.display = 'block';
        toc.style.position = 'fixed';
        toc.style.left = '0';
        toc.style.right = '0';
        toc.style.bottom = '0';
        toc.style.top = 'auto';
        toc.style.maxHeight = '60vh';
        toc.style.width = '100%';
        toc.style.zIndex = '25';
        toc.style.borderTop = '1px solid var(--border)';
        toc.style.borderLeft = 'none';
      }
    });
  }

  // ==========================================================
  // UTILITIES
  // ==========================================================
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ==========================================================
  // INIT
  // ==========================================================
  function init() {
    if (!window.PREP_SITE) {
      document.body.innerHTML = '<pre style="padding:20px">Failed to load content registry. Check scripts/content/_index.js</pre>';
      return;
    }
    initTheme();
    renderSidebar();
    initSidebarToggle();
    initProgressToggle();
    initSearch();
    initTocFab();

    window.addEventListener('hashchange', route);
    route();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
