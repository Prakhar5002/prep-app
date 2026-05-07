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
    recents: store.get('recents', []), // array of topicIds, most-recent first, max 8
    currentTopicId: null
  };

  function pushRecent(topicId) {
    if (!topicId) return;
    state.recents = [topicId, ...state.recents.filter(id => id !== topicId)].slice(0, 8);
    store.set('recents', state.recents);
  }

  // Map module id → title (built from registry on demand)
  let moduleTitleCache = null;
  function moduleTitle(modId) {
    if (!moduleTitleCache) {
      moduleTitleCache = {};
      window.PREP_SITE.registry.modules.forEach(m => { moduleTitleCache[m.id] = m.title; });
    }
    return moduleTitleCache[modId] || modId || '';
  }

  // ==========================================================
  // THEME (default: dark)
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
  // READING PROGRESS BAR
  // ==========================================================
  function initReadingProgress() {
    const bar = $('#readingProgress');
    if (!bar) return;
    let raf = null;
    const update = () => {
      const doc = document.documentElement;
      const max = (doc.scrollHeight - window.innerHeight) || 1;
      const pct = Math.max(0, Math.min(100, (window.scrollY / max) * 100));
      bar.style.width = pct + '%';
      raf = null;
    };
    window.addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  // ==========================================================
  // TABLET RAIL (700-1024px) — module quick-jump
  // ==========================================================
  function renderRail() {
    const rail = $('#sidebarRail');
    if (!rail) return;
    const reg = window.PREP_SITE.registry;
    const topicsById = window.PREP_SITE.topicsById;

    const total = Object.keys(topicsById).length;
    const studied = Array.from(state.studied).filter(id => topicsById[id]).length;
    const overallPct = total ? (studied / total) * 100 : 0;

    const moduleLetters = {
      'js': 'JS', 'dsa': 'DS', 'react': 'Re', 'web': 'W', 'rn': 'RN',
      'typescript': 'TS', 'mobile-production': 'MP', 'offline': 'Of',
      'graphql': 'GQ', 'build': 'B', 'workplace': 'Wp', 'git': 'Gt',
      'ai': 'AI', 'backend': 'Be'
    };
    const letterFor = (m) => moduleLetters[m.id] || m.title.slice(0, 2);

    const buttons = reg.modules.map(mod => {
      const moduleStudied = mod.topics.filter(t => state.studied.has(t.id)).length;
      const modulePct = mod.topics.length ? (moduleStudied / mod.topics.length) * 100 : 0;
      const firstReady = mod.topics.find(t => topicsById[t.id]) || mod.topics[0];
      const href = firstReady ? `#/topic/${firstReady.id}` : '#/';
      return `
        <a href="${href}" class="rail-btn" data-module-id="${mod.id}" aria-label="${escapeHtml(mod.title)}">
          ${escapeHtml(letterFor(mod))}
          <span class="rail-tooltip">${escapeHtml(mod.title)} · ${moduleStudied}/${mod.topics.length}</span>
        </a>
      `;
    }).join('');

    rail.innerHTML = `
      <a href="#/" class="rail-btn" data-action="home" aria-label="Home">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span class="rail-tooltip">Home</span>
      </a>
      <div class="rail-divider"></div>
      ${buttons}
      <div class="rail-divider"></div>
      <div class="rail-progress" title="${studied}/${total} studied"><div class="rail-progress-fill" style="width:${overallPct}%"></div></div>
    `;

    updateRailActive();
  }

  function updateRailActive() {
    const topicId = state.currentTopicId;
    let activeModuleId = null;
    if (topicId) {
      const reg = window.PREP_SITE.registry;
      reg.modules.forEach(m => {
        if (m.topics.some(t => t.id === topicId)) activeModuleId = m.id;
      });
    }
    $$('.rail-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.moduleId === activeModuleId);
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
    updateRailActive();
    updateBottomNavState();
  }

  function updateProgress() {
    const total = Object.keys(window.PREP_SITE.topicsById).length;
    const studied = Array.from(state.studied).filter(id => window.PREP_SITE.topicsById[id]).length;
    const pct = total ? Math.round((studied / total) * 100) : 0;
    const elCount = $('#progressCount');
    const elTotal = $('#progressTotal');
    const elFill = $('#progressFill');
    if (elCount) elCount.textContent = studied;
    if (elTotal) elTotal.textContent = total;
    if (elFill) elFill.style.width = total ? ((studied / total) * 100) + '%' : '0%';
    const elPct = $('#progressPct');
    if (elPct) elPct.textContent = pct + '%';
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
  // HOME / DASHBOARD
  // ==========================================================
  function renderHome() {
    const reg = window.PREP_SITE.registry;
    const topicsById = window.PREP_SITE.topicsById;
    const content = $('#content');
    state.currentTopicId = null;
    updateActiveNav(null);

    // ----- aggregate stats -----
    let totalReady = 0;
    let totalTopics = 0;
    let totalStudied = 0;
    let modulesInProgress = 0;
    reg.modules.forEach(m => {
      let modStudied = 0;
      m.topics.forEach(t => {
        totalTopics++;
        if (topicsById[t.id]) totalReady++;
        if (state.studied.has(t.id)) { totalStudied++; modStudied++; }
      });
      if (modStudied > 0 && modStudied < m.topics.length) modulesInProgress++;
    });
    const overallPct = totalTopics ? Math.round((totalStudied / totalTopics) * 100) : 0;

    // ----- continue card (last visited topic that's still ready) -----
    const lastReadId = state.recents.find(id => topicsById[id]);
    const lastRead = lastReadId ? topicsById[lastReadId] : null;

    // ----- "up next" suggestion: next un-studied ready topic, prefer same module as last read -----
    const allTopicsFlat = [];
    reg.modules.forEach(m => m.topics.forEach(t => {
      if (topicsById[t.id]) allTopicsFlat.push({ ...t, moduleId: m.id, moduleTitle: m.title });
    }));
    let nextTopic = null;
    if (lastRead) {
      const sameModule = allTopicsFlat.filter(t => t.moduleId === lastRead.module);
      nextTopic = sameModule.find(t => !state.studied.has(t.id) && t.id !== lastReadId);
    }
    if (!nextTopic) {
      nextTopic = allTopicsFlat.find(t => !state.studied.has(t.id) && t.id !== lastReadId);
    }
    if (!nextTopic) nextTopic = allTopicsFlat[0]; // fallback

    // ----- arrow icon for cards -----
    const arrowSVG = `
      <span class="card-arrow" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </span>`;

    // ----- continue + up next -----
    let heroCardsHtml = '';
    if (lastRead) {
      heroCardsHtml += `
        <a href="#/topic/${lastRead.id}" class="continue-card">
          <div class="card-eyebrow">Continue where you left off</div>
          <div class="card-title">${escapeHtml(lastRead.title)}</div>
          <div class="card-meta">${escapeHtml(moduleTitle(lastRead.module))} · ${escapeHtml(lastRead.estimatedReadTime || '—')}</div>
          ${arrowSVG}
        </a>
      `;
    } else {
      // first-visit card: pick a starter
      const starter = nextTopic;
      if (starter) {
        heroCardsHtml += `
          <a href="#/topic/${starter.id}" class="continue-card">
            <div class="card-eyebrow">Start here</div>
            <div class="card-title">${escapeHtml(starter.title)}</div>
            <div class="card-meta">${escapeHtml(starter.moduleTitle)} · ${escapeHtml(topicsById[starter.id]?.estimatedReadTime || '—')}</div>
            ${arrowSVG}
          </a>
        `;
      }
    }
    if (nextTopic && nextTopic.id !== lastReadId) {
      heroCardsHtml += `
        <a href="#/topic/${nextTopic.id}" class="upnext-card">
          <div class="card-eyebrow">Up next</div>
          <div class="card-title">${escapeHtml(nextTopic.title)}</div>
          <div class="card-meta">${escapeHtml(nextTopic.moduleTitle)} · ${escapeHtml(topicsById[nextTopic.id]?.estimatedReadTime || '—')}</div>
          ${arrowSVG}
        </a>
      `;
    }

    // ----- recents list (excluding the one shown as Continue) -----
    const recentsHtml = state.recents
      .filter(id => topicsById[id] && id !== lastReadId)
      .slice(0, 6)
      .map(id => {
        const t = topicsById[id];
        return `
          <a href="#/topic/${id}" class="recent-item">
            <span class="recent-item-title">${escapeHtml(t.title)}</span>
            <span class="recent-item-meta">${escapeHtml(moduleTitle(t.module))}</span>
          </a>`;
      }).join('');

    // ----- module cards -----
    const moduleCards = reg.modules.map(mod => {
      const ready = mod.topics.filter(t => topicsById[t.id]).length;
      const studied = mod.topics.filter(t => state.studied.has(t.id)).length;
      const pct = mod.topics.length ? (studied / mod.topics.length) * 100 : 0;
      const firstReady = mod.topics.find(t => topicsById[t.id]) || mod.topics[0];
      const href = firstReady ? `#/topic/${firstReady.id}` : '#/';
      return `
        <a href="${href}" class="home-card">
          <div class="home-card-title">${escapeHtml(mod.title)}</div>
          <div class="home-card-meta">${ready} / ${mod.topics.length} topics · ${studied} studied</div>
          <div class="home-card-progress"><div class="home-card-progress-fill" style="width:${pct}%"></div></div>
          <span class="home-card-pct">${Math.round(pct)}%</span>
        </a>
      `;
    }).join('');

    teardownSectionProgress();

    content.innerHTML = `
      <div class="home-hero">
        <span class="home-greeting">Welcome back</span>
        <h1>Frontend Interview Prep <span class="grad">·</span> <span class="grad">at depth</span></h1>
        <p class="home-sub">Extreme-depth notes for FAANG and mid-size product companies, mobile-focused. ${totalReady} of ${totalTopics} topics ready, ${totalStudied} studied — pick up where you left off, or jump to a module.</p>
      </div>

      <div class="home-stats">
        <div class="home-stat">
          <div class="home-stat-label">Studied</div>
          <div class="home-stat-value">${totalStudied}<span class="pct">/${totalTopics}</span></div>
        </div>
        <div class="home-stat">
          <div class="home-stat-label">Progress</div>
          <div class="home-stat-value">${overallPct}<span class="pct">%</span></div>
        </div>
        <div class="home-stat">
          <div class="home-stat-label">Modules in&nbsp;progress</div>
          <div class="home-stat-value">${modulesInProgress}</div>
        </div>
        <div class="home-stat">
          <div class="home-stat-label">Topics ready</div>
          <div class="home-stat-value">${totalReady}</div>
        </div>
      </div>

      ${heroCardsHtml ? `<div class="home-hero-cards">${heroCardsHtml}</div>` : ''}

      ${recentsHtml ? `
        <div class="home-section-title">Recent <span class="count">last ${Math.min(6, state.recents.filter(id => topicsById[id] && id !== lastReadId).length)}</span></div>
        <div class="recent-list">${recentsHtml}</div>
      ` : ''}

      <div class="home-section-title">All modules <span class="count">${reg.modules.length}</span></div>
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
    if (topic) pushRecent(topicId);

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
        <span class="topic-meta-module">${escapeHtml(moduleTitle(topic.module))}</span>
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

    // Sticky section progress + mobile section auto-collapse
    initSectionProgress(topic);
    applyMobileSectionCollapse();

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
  // MOBILE BOTTOM NAV
  // ==========================================================
  function initBottomNav() {
    $$('.bottom-nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        if (action === 'modules') {
          e.preventDefault();
          openSidebar();
        } else if (action === 'search') {
          e.preventDefault();
          openSearch();
        } else if (action === 'studied') {
          e.preventDefault();
          if (state.currentTopicId) toggleStudied(state.currentTopicId);
        } else if (action === 'theme') {
          e.preventDefault();
          toggleTheme();
        }
        // 'home' is a real link, default action
      });
    });
    updateBottomNavState();
  }

  function updateBottomNavState() {
    const studiedBtn = document.querySelector('.bottom-nav-btn[data-action="studied"]');
    if (studiedBtn) {
      const isStudied = state.currentTopicId && state.studied.has(state.currentTopicId);
      studiedBtn.classList.toggle('active', !!isStudied);
      studiedBtn.style.opacity = state.currentTopicId ? '' : '0.4';
      studiedBtn.style.pointerEvents = state.currentTopicId ? '' : 'none';
    }
    const homeBtn = document.querySelector('.bottom-nav-btn[data-action="home"]');
    if (homeBtn) homeBtn.classList.toggle('active', !state.currentTopicId);
  }

  function toggleStudied(id) {
    if (!id) return;
    if (state.studied.has(id)) state.studied.delete(id);
    else state.studied.add(id);
    store.set('studied', Array.from(state.studied));
    const pt = $('#progressToggle');
    if (pt) pt.classList.toggle('active', state.studied.has(id));
    $$('.nav-topic').forEach(link => {
      link.classList.toggle('studied', state.studied.has(link.dataset.topicId));
    });
    updateProgress();
    updateBottomNavState();
    renderRail();
  }

  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    store.set('theme', next);
  }

  // ==========================================================
  // FOCUS MODE
  // ==========================================================
  function initFocusMode() {
    const saved = store.get('focusMode', false);
    if (saved) document.documentElement.classList.add('focus-mode');
    const btn = $('#focusToggle');
    if (btn) btn.addEventListener('click', toggleFocusMode);
  }
  function toggleFocusMode() {
    const on = document.documentElement.classList.toggle('focus-mode');
    store.set('focusMode', on);
  }

  // ==========================================================
  // KEYBOARD SHORTCUTS
  // ==========================================================
  function initKeyboard() {
    let lastG = 0;
    document.addEventListener('keydown', (e) => {
      // Don't trigger inside inputs
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag);
      if (isInput) return;

      // Ignore if any modal is up
      const searchOpen = !$('#searchModal').hidden;
      const kbdOpen = !$('#kbdModal').hidden;

      // Esc handled in respective modals
      if (e.key === 'Escape') {
        if (kbdOpen) closeKbdModal();
        return;
      }

      if (searchOpen || kbdOpen) return;

      const k = e.key;
      const lower = k.toLowerCase();

      if (k === '?') { e.preventDefault(); openKbdModal(); return; }
      if (lower === 't') { e.preventDefault(); toggleTheme(); return; }
      if (lower === 'f') { e.preventDefault(); toggleFocusMode(); return; }
      if (lower === 's') {
        if (state.currentTopicId) { e.preventDefault(); toggleStudied(state.currentTopicId); }
        return;
      }
      if (k === 'ArrowRight') { e.preventDefault(); navTopic(+1); return; }
      if (k === 'ArrowLeft')  { e.preventDefault(); navTopic(-1); return; }
      if (lower === 'j') { e.preventDefault(); navSection(+1); return; }
      if (lower === 'k') { e.preventDefault(); navSection(-1); return; }
      if (lower === 'g') {
        const now = Date.now();
        if (now - lastG < 600) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          lastG = 0;
        } else {
          lastG = now;
        }
        return;
      }
    });
  }

  function navTopic(delta) {
    if (!state.currentTopicId) return;
    const reg = window.PREP_SITE.registry;
    const topicsById = window.PREP_SITE.topicsById;
    const flat = [];
    reg.modules.forEach(m => m.topics.forEach(t => { if (topicsById[t.id]) flat.push(t.id); }));
    const idx = flat.indexOf(state.currentTopicId);
    const nextIdx = idx + delta;
    if (nextIdx >= 0 && nextIdx < flat.length) {
      location.hash = `#/topic/${flat[nextIdx]}`;
    }
  }

  function navSection(delta) {
    const headings = $$('.content section[id], .content h2[id]').filter(el => el.tagName === 'H2' || el.tagName === 'SECTION');
    const sections = $$('.content .section');
    if (!sections.length) return;
    // Find current section by viewport position
    const viewportTop = window.scrollY + 80;
    let curr = 0;
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].offsetTop <= viewportTop) curr = i;
    }
    const nextIdx = Math.max(0, Math.min(sections.length - 1, curr + delta));
    const target = sections[nextIdx];
    if (target) {
      // Auto-expand if collapsed
      target.classList.remove('mobile-collapsed', 'collapsed');
      const rect = target.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + rect.top - 70, behavior: 'smooth' });
    }
  }

  // ==========================================================
  // STICKY SECTION HEADER
  // ==========================================================
  let sectionObserver = null;
  function initSectionProgress(topic) {
    const bar = $('#sectionProgress');
    const label = $('#sectionProgressLabel');
    const count = $('#sectionProgressCount');
    const dotsWrap = $('#sectionProgressDots');
    if (!bar || !label || !count || !dotsWrap) return;

    if (sectionObserver) sectionObserver.disconnect();

    if (!topic || !topic.sections || !topic.sections.length) {
      bar.hidden = true;
      bar.classList.remove('show');
      document.body.classList.remove('has-section-progress');
      return;
    }
    bar.hidden = false;
    document.body.classList.add('has-section-progress');

    const sections = topic.sections;
    dotsWrap.innerHTML = sections.map((s, i) =>
      `<span class="section-progress-dot" data-i="${i}" data-id="sec-${s.id}" title="${escapeHtml(s.title)}"></span>`
    ).join('');

    // Click dot -> scroll to section
    $$('.section-progress-dot', dotsWrap).forEach(dot => {
      dot.addEventListener('click', () => {
        const id = dot.dataset.id;
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          window.scrollTo({ top: window.scrollY + rect.top - 100, behavior: 'smooth' });
        }
      });
    });

    const sectionEls = sections.map(s => document.getElementById('sec-' + s.id)).filter(Boolean);
    let activeIdx = 0;

    function setActive(i) {
      if (i < 0 || i >= sections.length) return;
      activeIdx = i;
      label.textContent = sections[i].title;
      count.textContent = (i + 1) + ' / ' + sections.length;
      $$('.section-progress-dot', dotsWrap).forEach((d, di) => {
        d.classList.toggle('current', di === i);
        d.classList.toggle('passed', di < i);
      });
    }

    setActive(0);

    sectionObserver = new IntersectionObserver((entries) => {
      // Pick the entry that is most visible at top of viewport
      let best = null;
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (!best || entry.boundingClientRect.top < best.boundingClientRect.top) best = entry;
        }
      });
      if (best) {
        const i = sectionEls.indexOf(best.target);
        if (i >= 0) setActive(i);
      }
    }, { rootMargin: '-72px 0px -55% 0px', threshold: 0 });
    sectionEls.forEach(el => sectionObserver.observe(el));

    // Show/hide bar based on scroll past hero
    let raf = null;
    const onScroll = () => {
      const titleEl = $('.topic-title');
      if (titleEl) {
        const r = titleEl.getBoundingClientRect();
        const passed = r.bottom < 60;
        bar.classList.toggle('show', passed);
      }
      raf = null;
    };
    window.addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(onScroll);
    }, { passive: true });
    onScroll();
  }

  function teardownSectionProgress() {
    const bar = $('#sectionProgress');
    if (bar) {
      bar.classList.remove('show');
      bar.hidden = true;
    }
    document.body.classList.remove('has-section-progress');
    if (sectionObserver) { sectionObserver.disconnect(); sectionObserver = null; }
  }

  // ==========================================================
  // KEYBOARD CHEATSHEET MODAL
  // ==========================================================
  function openKbdModal() { $('#kbdModal').hidden = false; }
  function closeKbdModal() { $('#kbdModal').hidden = true; }
  function initKbdModal() {
    $('#kbdToggle')?.addEventListener('click', openKbdModal);
    $('#kbdClose')?.addEventListener('click', closeKbdModal);
    $('#kbdBackdrop')?.addEventListener('click', closeKbdModal);
  }

  // ==========================================================
  // MOBILE DEFAULT-COLLAPSE for non-first sections
  // ==========================================================
  function applyMobileSectionCollapse() {
    if (window.innerWidth > 700) return;
    const sections = $$('.content .section');
    sections.forEach((s, i) => {
      if (i > 0 && s.classList.contains('collapsible')) {
        s.classList.add('mobile-collapsed');
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
    initReadingProgress();
    renderSidebar();
    renderRail();
    initSidebarToggle();
    initBottomNav();
    initProgressToggle();
    initSearch();
    initTocFab();
    initFocusMode();
    initKeyboard();
    initKbdModal();
    // Re-apply mobile section-collapse if user resizes
    window.addEventListener('resize', () => {
      // Don't run during topic load races
      if (state.currentTopicId) applyMobileSectionCollapse();
    });

    window.addEventListener('hashchange', route);
    route();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
