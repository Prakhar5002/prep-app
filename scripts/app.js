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

  // Section/heading titles in content carry a leading emoji (🧠 ⚙️ 🎤 …); the UI shows them plain.
  const plainTitle = (t) => String(t || '').replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, '').trim();

  // ==========================================================
  // THEME (default: light)
  // ==========================================================
  function initTheme() {
    const saved = store.get('theme', 'light');
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
      'ai': 'AI', 'backend': 'Be', 'backend-sd': 'SD', 'cloud': 'AW', 'lld': 'LD', 'backend-stack': 'BS', 'flutter': 'Fl'
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
  // SIDEBAR (v4, react.dev-style) — plain tier headings, modules as plain
  // expandable rows, topics as indented links, one highlight for "you are here".
  // ==========================================================
  const SB_GROUP_LABEL = { core: 'Core', support: 'Supporting', mobile: 'Mobile', later: 'Later' };
  const sbExpanded = new Set(); // modules the reader opened by hand (this session)
  const CHEV = '<svg class="rd-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>';
  const TICK = '<svg class="rd-tick" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-label="studied"><polyline points="20 6 9 17 4 12"/></svg>';

  // Sidebar module presentation: short name, one-line caption, line icon (24×24, stroke).
  const ICON = {
    sparkles: '<path d="M12 3l1.8 4.6L18.5 9.4l-4.7 1.8L12 16l-1.8-4.8L5.5 9.4l4.7-1.8z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
    server: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
    layers: '<path d="M12 3 2 8l10 5 10-5z"/><path d="m2 13 10 5 10-5"/>',
    network: '<rect x="9" y="3" width="6" height="5" rx="1.5"/><rect x="2.5" y="16" width="6" height="5" rx="1.5"/><rect x="15.5" y="16" width="6" height="5" rx="1.5"/><path d="M12 8v4M5.5 16v-4h13v4"/>',
    plug: '<path d="M9 2v5M15 2v5"/><path d="M6 7h12v4a6 6 0 0 1-12 0z"/><path d="M12 17v5"/>',
    cloud: '<path d="M17.5 19H7a5 5 0 1 1 1.1-9.9A6 6 0 0 1 19.6 11 4 4 0 0 1 17.5 19z"/>',
    boxes: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><path d="M17 13v8M13 17h8"/>',
    tree: '<circle cx="12" cy="5" r="2.2"/><circle cx="6" cy="19" r="2.2"/><circle cx="18" cy="19" r="2.2"/><path d="M12 7.2v4.3M12 11.5 6.8 17M12 11.5l5.2 5.5"/>',
    braces: '<path d="M8 3H7a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h1M16 3h1a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-1"/>',
    type: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 9h6M10 9v8M14.5 16.2c.4.5 1.1.8 1.9.8 1.1 0 1.9-.6 1.9-1.5 0-2-3.7-1.2-3.7-3.2 0-.9.8-1.5 1.8-1.5.7 0 1.3.3 1.7.7"/>',
    atom: '<circle cx="12" cy="12" r="1.6"/><ellipse cx="12" cy="12" rx="10" ry="4.2"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(120 12 12)"/>',
    layout: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M3 9h18M9 9v12"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/>',
    flask: '<path d="M9 3h6M10 3v6.5L4.6 18.2A1.8 1.8 0 0 0 6.1 21h11.8a1.8 1.8 0 0 0 1.5-2.8L14 9.5V3"/><path d="M7.5 15h9"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
    gauge: '<path d="M12 14l4-4"/><path d="M3.5 18a10 10 0 1 1 17 0"/>',
    bug: '<rect x="8" y="6" width="8" height="14" rx="4"/><path d="M9.5 6.5 8 4M14.5 6.5 16 4M4 11h4M16 11h4M4 17h4M16 17h4M12 10v10"/>',
    branch: '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="8" r="2"/><path d="M6 7v10M18 10c0 5-6 3-11.3 7.4"/>',
    terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M13 15h4"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0 5 5L21 13a6 6 0 0 1-7.8 1.6L6 21.8 2.2 18l7.2-7.2A6 6 0 0 1 11 3z"/>',
    workflow: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M6.5 10v4a3 3 0 0 0 3 3H14"/>',
    cycle: '<path d="M20 12a8 8 0 0 1-14.3 4.9M4 12A8 8 0 0 1 18.3 7.1"/><path d="M18.5 3v4.2h-4.2M5.5 21v-4.2h4.2"/>',
    graph: '<circle cx="12" cy="4.5" r="2"/><circle cx="4.5" cy="17" r="2"/><circle cx="19.5" cy="17" r="2"/><path d="M12 6.5 5.5 15.3M12 6.5l6.5 8.8M6.5 17h11"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
    phone: '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
    sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M10 10h4v4h-4zM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
    tablet: '<rect x="4" y="2.5" width="16" height="19" rx="2.5"/><path d="M11 18.5h2"/><path d="M12.5 7.5c.6-.7 1.5-1 2-1 .1.8-.2 1.5-.7 2"/>',
    feather: '<path d="M20.2 12.2a6 6 0 0 0-8.5-8.5L5 10.5V19h8.5z"/><path d="M16 8 2 22M17.5 15H9"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z"/>',
    pointer: '<path d="M9 11V4.5a1.5 1.5 0 0 1 3 0V10M12 9.5a1.5 1.5 0 0 1 3 0V11M15 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.2a6 6 0 0 1-4.3-1.8L4 16.6a1.6 1.6 0 0 1 2.2-2.3L9 16.5"/>',
    wave: '<path d="M2 12c2.5-6 5-6 7.5 0s5 6 7.5 0 3.5-4 5-2"/>',
    wifioff: '<path d="M2 2l20 20M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 5.2-2.7M19 12.9a10 10 0 0 0-2.1-1.6M2 8.8a15 15 0 0 1 4.2-2.6M22 8.8A15 15 0 0 0 11 4.6M12 20h.01"/>',
    shield: '<path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.5A6.5 6.5 0 0 1 21.5 20"/>',
    book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5zM4 21.5A2.5 2.5 0 0 1 6.5 19H20"/>'
  };
  const MODULE_META = {
    'ai':            { icon: 'sparkles', name: 'AI / LLM Engineering', sub: 'RAG · agents · evals · voice' },
    'backend':       { icon: 'server',   name: 'Backend Core', sub: 'DBs · caching · queues · resilience' },
    'backend-sd':    { icon: 'network',  name: 'System Design', sub: 'Numbers · blocks · 16 cases' },
    'backend-stack': { icon: 'layers',   name: 'Backend Stack', sub: 'Express · NestJS · SQL · Kafka' },
    'api-design':    { icon: 'plug',     name: 'API Design', sub: 'REST · WebSockets · WebRTC' },
    'cloud':         { icon: 'cloud',    name: 'Cloud & DevOps', sub: 'AWS · Firebase · CI/CD' },
    'lld':           { icon: 'boxes',    name: 'Low-Level Design', sub: 'Patterns · class-design cases' },
    'dsa':           { icon: 'tree',     name: 'DSA', sub: 'Patterns · trees · graphs · DP' },
    'js':            { icon: 'braces',   name: 'JavaScript', sub: 'Closures · event loop · async' },
    'typescript':    { icon: 'type',     name: 'TypeScript', sub: 'Generics · type-level tricks' },
    'react':         { icon: 'atom',     name: 'React', sub: 'Fiber · hooks · Next.js' },
    'system-design': { icon: 'layout',   name: 'FE System Design', sub: 'Framework · case studies' },
    'behavioral':    { icon: 'chat',     name: 'Behavioral', sub: 'STAR · story bank · values' },
    'testing':       { icon: 'flask',    name: 'Testing', sub: 'Jest · E2E · API tests' },
    'web':           { icon: 'globe',    name: 'Web Platform', sub: 'Rendering · network · security' },
    'design':        { icon: 'compass',  name: 'Design Principles', sub: 'SOLID, one by one' },
    'machine-coding':{ icon: 'keyboard', name: 'Machine Coding', sub: 'Components · patterns' },
    'performance':   { icon: 'gauge',    name: 'Performance', sub: 'Web vitals · bundles · memory' },
    'debugging':     { icon: 'bug',      name: 'Debugging', sub: 'DevTools · leaks · mobile' },
    'git':           { icon: 'branch',   name: 'Git', sub: 'Branching · rebase · recovery' },
    'linux':         { icon: 'terminal', name: 'Linux', sub: 'Shell · processes · networking' },
    'build':         { icon: 'wrench',   name: 'Build Tooling', sub: 'Bundlers · Babel · monorepos' },
    'state-deep':    { icon: 'workflow', name: 'State Management', sub: 'Redux · Zustand · XState' },
    'redux':         { icon: 'cycle',    name: 'Redux', sub: 'RTK · RTK Query · middleware' },
    'graphql':       { icon: 'graph',    name: 'GraphQL', sub: 'Schema · clients · caching' },
    'career':        { icon: 'briefcase',name: 'Career', sub: 'Resume · negotiation' },
    'rn':            { icon: 'phone',    name: 'React Native', sub: 'Architecture · perf · release' },
    'rncfg':         { icon: 'sliders',  name: 'RN Project & Config', sub: 'Metro · Babel · env builds' },
    'andr':          { icon: 'cpu',      name: 'Android Native', sub: 'Gradle · manifest · debugging' },
    'iosn':          { icon: 'tablet',   name: 'iOS Native', sub: 'Xcode · CocoaPods · signing' },
    'flutter':       { icon: 'feather',  name: 'Flutter', sub: 'Dart · widgets · state' },
    'mobile-prod':   { icon: 'rocket',   name: 'Mobile Production', sub: 'Crashes · analytics · push' },
    'mobile-ux':     { icon: 'pointer',  name: 'Mobile UX', sub: 'HIG · Material · gestures' },
    'animation':     { icon: 'wave',     name: 'Animation', sub: 'CSS · WAAPI · Reanimated' },
    'offline':       { icon: 'wifioff',  name: 'Offline & PWA', sub: 'Service workers · IndexedDB' },
    'eh':            { icon: 'shield',   name: 'Ethical Hacking', sub: 'Recon · exploitation · AD' },
    'workplace':     { icon: 'users',    name: 'Workplace', sub: 'Promo · managing up · conflict' }
  };
  function moduleIcon(m) {
    const meta = MODULE_META[m.id] || {};
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[meta.icon] || ICON.book}</svg>`;
  }

  function moduleOfTopic(topicId) {
    return window.PREP_SITE.registry.modules.find(m => m.topics.some(t => t.id === topicId)) || null;
  }
  function onTopicRoute() { return parseRoute().name === 'topic'; }

  function renderSidebar() {
    const nav = $('#sidebarNav');
    if (!nav) return;
    const reg = window.PREP_SITE.registry, byId = window.PREP_SITE.topicsById;
    const activeId = onTopicRoute() ? state.currentTopicId : null;
    const curMod = activeId ? moduleOfTopic(activeId) : null;

    let html = '', lastG = null;
    reg.modules.forEach(m => {
      if (m.group !== lastG) {
        html += `<h3 class="rd-grp">${escapeHtml(SB_GROUP_LABEL[m.group] || m.group || '')}</h3>`;
        lastG = m.group;
      }
      const isCur = curMod && curMod.id === m.id;
      const open = isCur || sbExpanded.has(m.id);
      html += `
        <div class="rd-mod${open ? ' open' : ''}" data-module-id="${m.id}">
          <button type="button" class="rd-item rd-modbtn tone-${m.group || 'core'}${isCur ? ' is-parent' : ''}" aria-expanded="${open}" title="${escapeHtml(m.title)}">
            <span class="rd-icon">${moduleIcon(m)}</span>
            <span class="rd-modtext">
              <span class="rd-modname">${escapeHtml((MODULE_META[m.id] || {}).name || m.title)}</span>
              ${(MODULE_META[m.id] || {}).sub ? `<span class="rd-modsub">${escapeHtml(MODULE_META[m.id].sub)}</span>` : ''}
            </span>${CHEV}
          </button>
          ${open ? `<div class="rd-children">${m.topics.map(t => {
            const active = t.id === activeId, studied = state.studied.has(t.id);
            return `<a href="#/topic/${t.id}" class="rd-item rd-child nav-topic${active ? ' active' : ''}${studied ? ' studied' : ''}" data-topic-id="${t.id}"${active ? ' aria-current="page"' : ''}>
                <span class="rd-label">${escapeHtml(t.title)}</span>${studied ? TICK : ''}${byId[t.id] ? '' : '<span class="nav-topic-tag coming">soon</span>'}
              </a>`;
          }).join('')}</div>` : ''}
        </div>`;
    });
    nav.innerHTML = html;

    $$('.rd-modbtn', nav).forEach(b => b.addEventListener('click', () => {
      const id = b.parentElement.dataset.moduleId;
      if (curMod && curMod.id === id) return; // the module you're reading in stays open
      if (sbExpanded.has(id)) sbExpanded.delete(id); else sbExpanded.add(id);
      renderSidebar();
    }));
    $$('.rd-child', nav).forEach(link => link.addEventListener('click', () => {
      if (window.innerWidth < 900) closeSidebar();
    }));
    updateProgress();
  }

  // Follow the reader: re-render so the current module is open and the topic highlighted.
  function updateActiveNav(topicId) {
    renderSidebar();
    setSpecialNavActive(null);
    const active = $('#sidebarNav .rd-child.active');
    if (active) active.scrollIntoView({ block: 'nearest' });
    updateRailActive();
    updateBottomNavState();
  }

  // Highlight one of the top links (Study Plan / Quick Revision / JS Practice) — or none.
  function setSpecialNavActive(id) {
    ['#navPracticeLink', '#navPlanLink', '#navReviseLink'].forEach(sel => {
      const l = $(sel); if (l) l.classList.toggle('active', sel === id);
    });
    if (id) $$('#sidebarNav .rd-child.active').forEach(l => { l.classList.remove('active'); l.removeAttribute('aria-current'); });
  }
  function setPracticeNavActive() { setSpecialNavActive('#navPracticeLink'); }
  function setReviseNavActive() { setSpecialNavActive('#navReviseLink'); }
  function setPlanNavActive() { setSpecialNavActive('#navPlanLink'); }

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
    if (hash === '/practice' || hash === '/practice/') return { name: 'practice' };
    if (hash === '/plan' || hash === '/plan/') return { name: 'plan' };
    if (hash === '/revise' || hash === '/revise/') return { name: 'revise' };
    const topicMatch = hash.match(/^\/topic\/([\w-]+)(?:#(.+))?$/);
    if (topicMatch) return { name: 'topic', topicId: topicMatch[1], anchor: topicMatch[2] };
    return { name: 'home' };
  }

  function route() {
    const r = parseRoute();
    if (r.name === 'home') renderHome();
    else if (r.name === 'topic') renderTopic(r.topicId, r.anchor);
    else if (r.name === 'practice') {
      window.PREP_SITE.renderPractice($('#content'));
      setPracticeNavActive();
    }
    else if (r.name === 'plan') {
      if (!guardPlanRoute()) return;
      renderPlan($('#content'));
      setPlanNavActive();
    }
    else if (r.name === 'revise') {
      renderRevise($('#content'));
      setReviseNavActive();
    }
    if (r.name !== 'revise') { const rl = $('#navReviseLink'); if (rl) rl.classList.remove('active'); }
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
    let prevHomeGroup = null;
    const moduleCards = reg.modules.map(mod => {
      const groupHead = (mod.group && mod.group !== prevHomeGroup)
        ? `<div class="home-group-label">${escapeHtml(mod.groupLabel || mod.group)}</div>` : '';
      prevHomeGroup = mod.group;
      const ready = mod.topics.filter(t => topicsById[t.id]).length;
      const studied = mod.topics.filter(t => state.studied.has(t.id)).length;
      const pct = mod.topics.length ? (studied / mod.topics.length) * 100 : 0;
      const firstReady = mod.topics.find(t => topicsById[t.id]) || mod.topics[0];
      const href = firstReady ? `#/topic/${firstReady.id}` : '#/';
      return groupHead + `
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
      <div class="home-grid">${moduleCards}</div>
    `;
    $('#tocList').innerHTML = '';
    document.title = 'Docs';
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
      document.title = 'Docs';
      return;
    }

    const sectionsHtml = topic.sections.map((sec, idx) => {
      const collapsible = sec.collapsible !== false && idx > 0;
      return `
        <section class="section ${collapsible ? 'collapsible' : ''}" id="sec-${sec.id}">
          <div class="section-header">
            <h2 id="${sec.id}">
              ${plainTitle(sec.title)}
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

    const tagsHtml = (topic.tags || []).slice(0, 6).map(t => `<span class="topic-tag">#${escapeHtml(t)}</span>`).join('');
    const tMod = moduleOfTopic(topicId);
    const tTier = tMod ? ({ core: 'Core', support: 'Supporting', mobile: 'Mobile', later: 'Later' }[tMod.group] || '') : '';

    content.innerHTML = `
      <div class="topic-meta topic-crumbs">
        ${tTier ? `<span class="crumb-tier">${escapeHtml(tTier)}</span><span class="crumb-sep" aria-hidden="true">/</span>` : ''}
        <span class="crumb-mod">${escapeHtml(tMod ? tMod.title : moduleTitle(topic.module))}</span>
        ${topic.estimatedReadTime ? `<span class="crumb-time">${escapeHtml(topic.estimatedReadTime)} read</span>` : ''}
      </div>
      <h1 class="topic-title">${escapeHtml(topic.title)}</h1>
      <div class="topic-tags">${tagsHtml}</div>
      ${sectionsHtml}
      ${navHtml}
    `;

    // Section collapse handlers — delegated on #content so DOM rewrites can't lose them
    if (!content._collapseDelegated) {
      content._collapseDelegated = true;
      content.addEventListener('click', (e) => {
        if (e.target.closest('.anchor-link')) return;
        const header = e.target.closest('.section.collapsible > .section-header');
        if (!header) return;
        const section = header.parentElement;
        const isHidden = section.classList.contains('collapsed') || section.classList.contains('mobile-collapsed');
        section.classList.remove('mobile-collapsed', 'collapsed');
        if (!isHidden) section.classList.add('collapsed');
      });
    }

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

    document.title = `${topic.title} · Docs`;

    // Jump to anchor if provided
    if (anchor) {
      setTimeout(() => {
        const el = document.getElementById(anchor) || document.getElementById('sec-' + anchor);
        if (el) {
          const sec = el.closest('.section');
          if (sec) sec.classList.remove('collapsed', 'mobile-collapsed');
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    }
  }

  // ==========================================================
  // ACCOUNTS + CROSS-DEVICE SYNC (Firebase)
  // Studied topics + Study Plan progress sync to users/{uid}.
  // ==========================================================
  let _authUser = null, _userUnsub = null, _fbDb = null, _syncTimer = null, _applyingRemote = false, _authMode = 'signin', _authResolved = false;

  function fbConfigured() {
    const c = window.PREP_FIREBASE_CONFIG;
    return !!(c && c.apiKey && c.projectId && !/REPLACE_ME/.test(c.apiKey) && typeof firebase !== 'undefined');
  }
  function fbInit() {
    if (!fbConfigured()) return false;
    try {
      if (!firebase.apps.length) firebase.initializeApp(window.PREP_FIREBASE_CONFIG);
      _fbDb = firebase.firestore();
      return true;
    } catch (e) { return false; }
  }
  function userRef() { return (_authUser && _fbDb) ? _fbDb.collection('users').doc(_authUser.uid) : null; }
  function localData() {
    return { studied: Array.from(state.studied), planDone: store.get('prep-plan-done', []) || [], revised: store.get('prep-revised', []) || [], updatedAt: Date.now() };
  }
  function pushUserData() {
    if (_applyingRemote) return;
    const ref = userRef(); if (!ref) return;
    clearTimeout(_syncTimer);
    _syncTimer = setTimeout(() => { ref.set(localData(), { merge: true }).catch(function () {}); }, 400);
  }
  function reRenderForSync() {
    renderSidebar(); updateProgress();
    const r = parseRoute();
    if (r.name === 'plan') { if (isPlanOwner()) renderPlan($('#content')); }
    else if (r.name === 'revise') renderRevise($('#content'));
    else if (r.name === 'topic' && state.currentTopicId) {
      const pt = $('#progressToggle'); if (pt) pt.classList.toggle('active', state.studied.has(state.currentTopicId));
      $$('.nav-topic[data-topic-id]').forEach(l => l.classList.toggle('studied', state.studied.has(l.dataset.topicId)));
    }
  }
  function applyRemote(data) {
    if (!data) return;
    _applyingRemote = true;
    if (Array.isArray(data.studied)) { state.studied = new Set(data.studied); store.set('studied', data.studied); }
    if (Array.isArray(data.planDone)) { store.set('prep-plan-done', migratePlanKeys(data.planDone)); }
    if (Array.isArray(data.revised)) { store.set('prep-revised', data.revised); }
    reRenderForSync();
    _applyingRemote = false;
  }
  function onLoggedIn(user) {
    _authUser = user;
    updateAuthUI();
    const ref = userRef(); if (!ref) return;
    ref.get().then(function (snap) {
      const remote = (snap && snap.exists) ? (snap.data() || {}) : {};
      // Merge local + remote once at login so nothing is lost.
      const mStudied = new Set([].concat(remote.studied || [], Array.from(state.studied)));
      const mPlan = new Set(migratePlanKeys([].concat(remote.planDone || [], store.get('prep-plan-done', []) || [])));
      const mRevised = new Set([].concat(remote.revised || [], store.get('prep-revised', []) || []));
      store.set('prep-revised', Array.from(mRevised));
      state.studied = mStudied; store.set('studied', Array.from(mStudied));
      store.set('prep-plan-done', Array.from(mPlan));
      ref.set({ studied: Array.from(mStudied), planDone: Array.from(mPlan), revised: Array.from(mRevised), updatedAt: Date.now() }, { merge: true }).catch(function () {});
      reRenderForSync();
      if (_userUnsub) { _userUnsub(); }
      _userUnsub = ref.onSnapshot(function (s) {
        if (s.metadata && s.metadata.hasPendingWrites) return; // ignore our own writes
        applyRemote(s.data());
      }, function () {});
    }).catch(function () {});
  }
  function onLoggedOut() {
    _authUser = null;
    if (_userUnsub) { _userUnsub(); _userUnsub = null; }
    updateAuthUI();
  }
  function updateAuthUI() {
    const btn = $('#authToggle'), initial = $('#authInitial');
    if (btn) {
      btn.classList.toggle('signed-in', !!_authUser);
      btn.title = _authUser ? ('Signed in as ' + (_authUser.email || 'your account')) : 'Sign in to sync your progress';
    }
    if (initial) initial.textContent = _authUser ? String((_authUser.email || '?').charAt(0)).toUpperCase() : '';
    renderPlanSyncBar();
  }
  function renderPlanSyncBar() {
    const el = document.getElementById('planSync');
    if (!el) return;
    if (!fbConfigured()) { el.innerHTML = '<span class="plan-sync-note">Sign-in sync isn\'t configured.</span>'; return; }
    if (_authUser) {
      el.innerHTML = '<span class="plan-sync-status">Synced ✓</span>' +
        '<span class="plan-sync-note">Saved to <b>' + escapeHtml(_authUser.email || 'your account') + '</b> — open on any device.</span>';
    } else {
      el.innerHTML = '<button type="button" class="plan-sync-btn" id="planSignin">Sign in to sync across devices</button>';
      const b = document.getElementById('planSignin');
      if (b) b.addEventListener('click', openAuthModal);
    }
  }
  function setAuthError(msg) {
    const e = $('#authError'); if (!e) return;
    if (msg) { e.textContent = msg; e.hidden = false; } else { e.textContent = ''; e.hidden = true; }
  }
  function openAuthModal() {
    const m = $('#authModal'); if (!m) return;
    const so = $('#authSignedOut'), si = $('#authSignedIn');
    if (_authUser) {
      if (so) so.hidden = true; if (si) si.hidden = false;
      const em = $('#authEmailShow'); if (em) em.textContent = _authUser.email || '';
      const av = $('#authAvatarBig'); if (av) av.textContent = String((_authUser.email || '?').charAt(0)).toUpperCase();
    } else {
      if (so) so.hidden = false; if (si) si.hidden = true;
      setAuthError('');
    }
    m.hidden = false;
  }
  function closeAuthModal() { const m = $('#authModal'); if (m) m.hidden = true; }
  function toggleAuthMode() {
    _authMode = _authMode === 'signin' ? 'signup' : 'signin';
    const isSignin = _authMode === 'signin';
    $('#authTitle').textContent = isSignin ? 'Sign in' : 'Create account';
    $('#authSubmit').textContent = isSignin ? 'Sign in' : 'Create account';
    $('#authSwitchText').textContent = isSignin ? 'New here?' : 'Already have an account?';
    $('#authSwitch').textContent = isSignin ? 'Create an account' : 'Sign in';
    setAuthError('');
  }
  function friendlyAuthError(err) {
    const c = (err && err.code) || '';
    if (c.indexOf('email-already-in-use') >= 0) return 'That email already has an account — try signing in instead.';
    if (c.indexOf('user-not-found') >= 0 || c.indexOf('wrong-password') >= 0 || c.indexOf('invalid-credential') >= 0) return 'Wrong email or password.';
    if (c.indexOf('weak-password') >= 0) return 'Password should be at least 6 characters.';
    if (c.indexOf('invalid-email') >= 0) return 'That email looks invalid.';
    if (c.indexOf('popup-closed') >= 0 || c.indexOf('cancelled-popup') >= 0) return 'Google sign-in was closed — try again.';
    if (c.indexOf('operation-not-allowed') >= 0) return 'This sign-in method isn\'t enabled in Firebase yet.';
    if (c.indexOf('network') >= 0) return 'Network error — check your connection.';
    return (err && err.message) || 'Something went wrong. Try again.';
  }
  function submitEmailAuth() {
    setAuthError('');
    const email = ($('#authEmail').value || '').trim();
    const pass = $('#authPassword').value || '';
    if (!email || pass.length < 6) { setAuthError('Enter an email and a password of at least 6 characters.'); return; }
    const auth = firebase.auth();
    const submit = $('#authSubmit'); if (submit) submit.disabled = true;
    const op = _authMode === 'signin'
      ? auth.signInWithEmailAndPassword(email, pass)
      : auth.createUserWithEmailAndPassword(email, pass);
    op.then(function () { closeAuthModal(); })
      .catch(function (err) { setAuthError(friendlyAuthError(err)); })
      .then(function () { if (submit) submit.disabled = false; });
  }
  function googleSignIn() {
    setAuthError('');
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(provider)
        .then(function () { closeAuthModal(); })
        .catch(function (err) { setAuthError(friendlyAuthError(err)); });
    } catch (e) { setAuthError('Google sign-in is unavailable.'); }
  }
  function initAuthUI() {
    const btn = $('#authToggle'); if (btn) btn.addEventListener('click', openAuthModal);
    const close = $('#authClose'); if (close) close.addEventListener('click', closeAuthModal);
    const bd = $('#authBackdrop'); if (bd) bd.addEventListener('click', closeAuthModal);
    const sw = $('#authSwitch'); if (sw) sw.addEventListener('click', function (e) { e.preventDefault(); toggleAuthMode(); });
    const form = $('#authForm'); if (form) form.addEventListener('submit', function (e) { e.preventDefault(); submitEmailAuth(); });
    const g = $('#authGoogle'); if (g) g.addEventListener('click', googleSignIn);
    const so = $('#authSignout'); if (so) so.addEventListener('click', function () { if (fbConfigured()) firebase.auth().signOut(); closeAuthModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAuthModal(); });
  }
  function initAuthAndSync() {
    initAuthUI();
    updatePlanVisibility();
    if (!fbInit()) {
      updateAuthUI();
      _authResolved = true;
      if (parseRoute().name === 'plan' && !isPlanOwner()) route();
      return;
    }
    // Safety net: if auth never reports (blocked/offline SDK), stop waiting so a non-owner isn't left on a blank #/plan.
    setTimeout(function () {
      if (_authResolved) return;
      _authResolved = true;
      if (parseRoute().name === 'plan' && !isPlanOwner()) route();
    }, 2500);
    firebase.auth().onAuthStateChanged(function (u) {
      if (u && !u.isAnonymous) onLoggedIn(u); else onLoggedOut();
      _authResolved = true;
      updatePlanVisibility();
      // Owner whose auth resolved after we bounced them off #/plan: restore it.
      if (_planRedirected && isPlanOwner() && parseRoute().name === 'home') { _planRedirected = false; location.hash = '#/plan'; return; }
      // Re-route if we're on #/plan and it wasn't rendered yet (or the user is no longer the owner).
      if (parseRoute().name === 'plan' && (!isPlanOwner() || !$('#content .plan'))) route();
    });
  }

  // ==========================================================
  // STUDY PLAN (40-day roadmap page, owner-only)
  // ==========================================================
  const PLAN_OWNER_EMAIL = 'pandey.prakhar5002@gmail.com';
  const PLAN_KEY = 'prep-plan-done';
  const PLAN_DAYS = 40;
  // MIGRATION ONLY: legacy ticks were keyed by ISO date counted from this start (6 Nov 2026).
  // Used solely to convert old 'YYYY-MM-DD' keys to 'day-N'. The page itself shows no dates.
  const PLAN_LEGACY_START = Date.UTC(2026, 10, 6);

  function isPlanOwner() {
    // Dev/test switch: localStorage 'prep:plan-owner-preview' = '1' shows the plan without signing in (headless tests).
    try { if (localStorage.getItem('prep:plan-owner-preview') === '1') return true; } catch (e) {}
    const em = _authUser && _authUser.email;
    return !!em && String(em).toLowerCase() === PLAN_OWNER_EMAIL.toLowerCase();
  }

  // Pure: legacy ISO keys -> day-N, drop out-of-range/unknown keys, de-dupe, sorted by day.
  function migratePlanKeys(keys) {
    const out = new Set();
    (Array.isArray(keys) ? keys : []).forEach(function (k) {
      let n = NaN;
      const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(k);
      const dm = /^day-(\d+)$/.exec(k);
      if (iso) n = Math.round((Date.UTC(+iso[1], +iso[2] - 1, +iso[3]) - PLAN_LEGACY_START) / 86400000) + 1;
      else if (dm) n = +dm[1];
      if (n >= 1 && n <= PLAN_DAYS) out.add(n);
    });
    return Array.from(out).sort(function (a, b) { return a - b; }).map(function (n) { return 'day-' + n; });
  }
  function normalizePlanStore() {
    const cur = store.get(PLAN_KEY, []) || [];
    const next = migratePlanKeys(cur);
    if (JSON.stringify(cur) !== JSON.stringify(next)) store.set(PLAN_KEY, next);
    return next;
  }
  window.PREP_SITE.migratePlanKeys = migratePlanKeys;

  // Show/hide every plan entry point for the current user.
  function updatePlanVisibility() {
    const owner = isPlanOwner();
    const nav = $('#navPlanLink'); if (nav) nav.hidden = !owner;
    $$('.kbd-row').forEach(function (r) { if (/Go to Study Plan/.test(r.textContent)) r.hidden = !owner; });
    $$('.auth-sub').forEach(function (el) {
      if (el.dataset.orig === undefined) el.dataset.orig = el.innerHTML;
      if (!/Study Plan/.test(el.dataset.orig)) return;
      el.innerHTML = owner ? el.dataset.orig : el.dataset.orig.replace(' &amp; Study Plan', '');
    });
  }
  // Auth may resolve after the first route: until it does, a non-owner on #/plan sees an empty page;
  // the auth listener then re-routes (owner -> plan renders, others -> redirected home).
  let _planRedirected = false;
  function authSettled() { return _authResolved || !fbConfigured(); }
  function guardPlanRoute() {
    if (isPlanOwner()) return true;
    if (!authSettled()) { const c = $('#content'); if (c) c.innerHTML = ''; return false; }
    _planRedirected = true; // remember the intended route so a late-resolving owner can be sent back
    location.replace('#/');
    return false;
  }

  function renderPlan(container) {
    normalizePlanStore(); // convert any legacy ISO-date ticks to day-N before reading

    // Topic link helper: T('be-kafka') → clickable topic title; titles come from the registry.
    const planTopics = new Set();
    const titleOf = (id) => {
      for (const m of window.PREP_SITE.registry.modules) { const t = m.topics.find(x => x.id === id); if (t) return t.title; }
      return id;
    };
    const T = (id, label) => {
      // Not registered yet (later slices): muted "soon" label; not linked, not counted.
      if (!window.PREP_SITE.topicsById[id]) return `<span class="plan-soon" title="Coming soon">${escapeHtml(label || titleOf(id))}</span>`;
      planTopics.add(id);
      return `<a class="plan-link" href="#/topic/${id}">${escapeHtml(label || titleOf(id))}</a>`;
    };
    const DRILLDOWN = '<b>Practice:</b> redo one drill-down ladder out loud';
    const QR = (label) => `<a class="plan-link" href="#/revise">Quick Revision</a> → ${label}`;

    const DATA = [
      { cls: 'p1', name: 'Backend Foundations', days: [
        [`<b>Backend:</b> ${T('be-fundamentals')} · ${T('api-rest')}`, '<b>DSA:</b> Arrays &amp; Strings + Hashing — 4 problems'],
        [`<b>Data:</b> ${T('be-databases')} · ${T('be-mysql')}`, '<b>SQL drill:</b> 6 problems from the MySQL topic (window functions, top-N per group)'],
        [`<b>Data:</b> ${T('be-mongodb')} · ${T('be-caching')}`, '<b>DSA:</b> Two Pointers + Sliding Window — 4 problems'],
        [`<b>Node:</b> ${T('be-express')} · ${T('be-nestjs')}`, '<b>Build:</b> start the running project — a small NestJS/Express CRUD API with validation + error handling'],
        [`<b>Auth:</b> ${T('api-auth-rbac')} · ${T('api-versioning')}`, '<b>Build:</b> add JWT auth + a role guard to your API'],
        [`<b>Async:</b> ${T('be-queues')} · ${T('be-event-driven')} · ${T('be-kafka')}`, '<b>DSA:</b> Stack &amp; Queue + Linked List — 4 problems'],
        [`<b>Realtime:</b> ${T('api-websockets')} · ${T('be-mqtt')} · ${T('test-api')}`, '<b>Build:</b> integration tests for your API (supertest + a test DB)'],
        [`<b>Ops:</b> ${T('be-architecture')} · ${T('be-resilience')} · ${T('be-observability')}`, `<b>Consolidate:</b> ${QR('Backend, Backend Stack, API Design')}`],
      ]},
      { cls: 'p2', name: 'Cloud &amp; DevOps (AWS)', days: [
        [`<b>AWS:</b> ${T('cloud-aws-foundations')}`, '<b>DSA:</b> Binary Search — 4 problems'],
        [`<b>Serverless:</b> ${T('cloud-lambda')} · ${T('cloud-api-gateway')}`, '<b>Build:</b> put your API behind Lambda + API Gateway (or sketch it in SAM/CDK)'],
        [`<b>Storage &amp; queues:</b> ${T('cloud-s3')} · ${T('cloud-sqs')}`, '<b>DSA:</b> Trees — traversals + recursion — 4 problems'],
        [`<b>Data &amp; ops:</b> ${T('cloud-rds')} · ${T('cloud-cloudwatch')}`, '<b>Practice:</b> write 3 Logs Insights queries + an alarm plan for your API'],
        [`<b>Auth &amp; BaaS:</b> ${T('cloud-cognito')} · ${T('cloud-amplify')} · ${T('cloud-firebase')}`, '<b>DSA:</b> BST + tree DP basics — 4 problems'],
        [`<b>Delivery:</b> ${T('cloud-cicd')} · ${T('cloud-dev-tools')}`, '<b>Build:</b> GitHub Actions pipeline for your API (test → deploy, OIDC to AWS)'],
        [`<b>Case:</b> ${T('cloud-serverless-case')} — whiteboard it end to end`, `<b>Consolidate:</b> ${QR('Cloud &amp; DevOps')}`],
      ]},
      { cls: 'p3', name: 'AI / LLM Engineering — the FDE core', days: [
        [`<b>LLM:</b> ${T('ai-prompts')} · ${T('ai-llm-integration')}`, '<b>Build:</b> a streaming chat endpoint with structured (JSON-schema) output'],
        [`<b>Agents:</b> ${T('ai-agents-tools')}`, '<b>Build:</b> give the chat 2 tools (function calling) and handle tool errors as results'],
        [`<b>Retrieval:</b> ${T('ai-vector-search')}`, '<b>DSA:</b> Heaps / top-K — 4 problems'],
        [`<b>RAG:</b> ${T('ai-rag')}`, '<b>Build:</b> mini RAG over your own notes — chunk → embed → retrieve → answer with citations'],
        [`<b>Quality:</b> ${T('ai-evals')}`, '<b>Build:</b> a 20-case golden set + LLM-as-judge for the RAG demo; record a baseline'],
        [`<b>Conversations:</b> ${T('ai-conversational')} · ${T('api-webrtc')}`, '<b>DSA:</b> Graphs — BFS / DFS — 4 problems'],
        [`<b>Voice:</b> ${T('ai-realtime-voice')} · ${T('ai-livekit')}`, "<b>Practice:</b> explain a voice agent's latency budget out loud, on a whiteboard"],
        [`<b>Your resume:</b> ${T('ai-call-scoring')} · ${T('ai-predictive')}`, '<b>Practice:</b> tell the call-scoring story in 90 s, then survive the deep-dive questions'],
        [`<b>Vision + review:</b> ${T('ai-computer-vision')} · ${QR('AI / LLM')}`, '<b>Mock #1:</b> AI system design — "design a support copilot for a customer"'],
      ]},
      { cls: 'p4', name: 'System Design — HLD + LLD', days: [
        [`<b>HLD:</b> ${T('bsd-estimation')} · ${T('bsd-framework')}`, '<b>Drill:</b> 3 worked drills from memory, then check the math'],
        [`<b>Building blocks:</b> ${T('bsd-bb-partitioning', 'Partitioning & Consistent Hashing')} · ${T('bsd-bb-replication', 'Replication & Quorums')} · ${T('bsd-bb-consistency', 'Consistency Models, CAP & PACELC')} · ${T('bsd-bb-consensus', 'Consensus & Coordination')}`, '<b>DSA:</b> Graphs — topological sort / union-find — 4 problems'],
        [`<b>Building blocks:</b> ${T('bsd-bb-storage', 'Storage Engines & Picking a Database')} · ${T('bsd-bb-transactions', 'Distributed Transactions, Time & IDs')} · ${T('bsd-bb-probabilistic', 'Probabilistic & Geo Structures')} · ${T('bsd-bb-edge', 'Edge & Traffic (DNS, CDN, LBs, Gateways)')}`, '<b>DSA:</b> Dynamic Programming (1D) — 4 problems'],
        [`<b>Cases:</b> ${T('bsd-case-url-shortener', 'URL Shortener')} · ${T('bsd-case-rate-limiter', 'Distributed Rate Limiter')}`, DRILLDOWN],
        [`<b>Cases:</b> ${T('bsd-case-news-feed', 'News Feed (Twitter / Instagram)')} · ${T('bsd-case-chat', 'Chat (WhatsApp / Slack)')}`, DRILLDOWN],
        [`<b>Cases:</b> ${T('bsd-case-notifications', 'Notification System')} · ${T('bsd-case-payments', 'Payment System')}`, DRILLDOWN],
        [`<b>Cases:</b> ${T('bsd-case-kv-store', 'Distributed Key-Value Store')} · ${T('bsd-case-ticket-booking', 'Ticket Booking (BookMyShow)')}`, DRILLDOWN],
        [`<b>Cases:</b> ${T('bsd-case-video-streaming', 'Video Streaming (YouTube)')} · ${T('bsd-case-ride-dispatch', 'Ride Dispatch (Uber)')}`, DRILLDOWN],
        [`<b>LLD:</b> ${T('lld-framework')} · ${T('lld-patterns')} · ${T('lld-lru-cache')} · ${T('lld-rate-limiter')}`, '<b>Mock #2:</b> one HLD + one LLD round, timed'],
      ]},
      { cls: 'p5', name: 'Frontend Polish (fast)', days: [
        [`<b>FE system design:</b> ${T('sd-framework')} · ${T('sd-cases')}; ${QR('JavaScript, TypeScript, React')}`, '<b>Machine coding:</b> typeahead with debounce, keyboard nav, loading/empty states'],
        [`<b>Full-stack:</b> ${T('react-nextjs')} · ${T('js-event-loop')} · ${T('web-security')}`, '<b>Mock #3:</b> full-stack coding round (API + UI), timed'],
      ]},
      { cls: 'p6', name: 'FDE Readiness &amp; Final Loop', days: [
        [`<b>Behavioral:</b> ${T('beh-star')} · ${T('beh-stories')} — write 8 STAR stories (customer, ambiguity, incident, shipped AI feature) <br><span class="plan-stretch">Stretch:</span> ${T('bsd-case-counter', 'Distributed Counter (likes, views)')} · ${T('bsd-case-file-sync', 'File Storage & Sync (Dropbox)')}`, '<b>DSA:</b> mixed timed set — 6 problems'],
        [`<b>FDE scenarios:</b> ${T('beh-company-values')} + answer every "a customer says…" question in the AI &amp; Backend Interview Q&amp;A <br><span class="plan-stretch">Stretch:</span> ${T('bsd-case-autocomplete', 'Search Autocomplete')} · ${T('bsd-case-web-crawler', 'Web Crawler')}`, '<b>Fix gaps</b> from mocks #1–#3'],
        [`<b>Mock #4:</b> full FDE loop — problem decomposition + build-a-demo + behavioral <br><span class="plan-stretch">Stretch:</span> ${T('bsd-case-job-scheduler', 'Distributed Job Scheduler')} · ${T('bsd-case-leaderboard', 'Leaderboard / Top-K')}`, '<b>Log &amp; fix</b> every question you fumbled'],
        [`<b>Full revision:</b> ${QR('Core tier, all modules')} <br><span class="plan-stretch">Stretch:</span> ${T('lld-parking-lot')} · ${T('lld-booking-system')} · ${T('lld-notification')}`, '<b>Re-solve</b> the 3 hardest DSA problems from scratch'],
        ['<b>Light day:</b> your 5 weakest Revision cards + rehearse the resume walkthrough', '<b>Rest</b> — sleep beats one more topic'],
      ]},
    ];

    const KEY = PLAN_KEY;
    const done = new Set(store.get(KEY, []) || []);
    let gi = 0;

    const phasesHtml = DATA.map((p, pi) => {
      const firstN = gi + 1;
      const rows = p.days.map(([a, b]) => {
        gi++;
        const n = gi;
        const key = 'day-' + n;
        const isDone = done.has(key);
        // Daily estimation warm-up from Day 7: Drill 1..14, cycling.
        const warm = n >= 7 ? ` · <b>Estimation:</b> <a class="plan-link" href="#/topic/bsd-estimation#examples">Drill ${((n - 7) % 14) + 1}</a>` : '';
        return `
          <label class="plan-day${isDone ? ' is-done' : ''}">
            <input type="checkbox" class="plan-cb" data-day="${key}"${isDone ? ' checked' : ''}>
            <span class="plan-box" aria-hidden="true"></span>
            <span class="plan-date"><span class="plan-dnum">Day ${n}</span></span>
            <span class="plan-dbody"><span class="plan-line">${a}</span><span class="plan-sub">${b}${warm}</span></span>
          </label>`;
      }).join('');
      return `
        <section class="plan-phase ${p.cls}">
          <div class="plan-phead">
            <span class="plan-ptag">Phase ${pi + 1}</span>
            <h2 class="plan-pname">${p.name}</h2>
            <span class="plan-pfocus">Days ${firstN}–${gi}</span>
          </div>
          <div class="plan-days">${rows}</div>
        </section>`;
    }).join('');

    const total = gi;

    container.innerHTML = `
      <div class="plan">
        <div class="topic-meta topic-crumbs"><span class="crumb-tier">Study Plan</span><span class="crumb-sep" aria-hidden="true">/</span><span class="crumb-mod">Full Stack + FDE</span><span class="crumb-time" id="planDayLine"></span></div>
        <h1 class="topic-title">${total}-Day Full Stack + FDE Plan</h1>
        <p class="plan-lede">A day-by-day plan to move from React Native to <strong>Full Stack</strong> and <strong>Forward Deployed Engineer</strong> roles. Go deep on what's new (backend, cloud, AI, design) and polish what you already know (JS, TypeScript, React) with Quick Revision. One project grows through the plan, from API to cloud to AI demo, so you finish with something to show. Every topic name links to its page.</p>

        <div class="plan-board">
          <div class="plan-stats">
            <div class="plan-stat"><span class="n">~${total * 3}</span><span class="l">total hours</span></div>
            <div class="plan-stat"><span class="n">${planTopics.size}</span><span class="l">topics</span></div>
            <div class="plan-stat"><span class="n">~45</span><span class="l">DSA problems</span></div>
            <div class="plan-stat"><span class="n">4</span><span class="l">mock interviews</span></div>
          </div>
          <div class="plan-prog-head"><span class="lab">Progress</span><span class="pct" id="planPct"></span></div>
          <div class="plan-track"><div class="plan-fill" id="planFill"></div></div>
          <div class="plan-sync" id="planSync"></div>
        </div>

        <div class="plan-method">
          <div class="plan-m"><span class="k">Daily rhythm</span><strong>~1.5h concept · ~1h build or DSA · ~30m revise</strong></div>
          <div class="plan-m"><span class="k">Learn vs polish</span><strong>Deep-read backend, cloud, AI and LLD; skim frontend with Quick Revision</strong></div>
          <div class="plan-m"><span class="k">FDE edge</span><strong>Build as you go: API → AWS → RAG demo with evals you can show</strong></div>
        </div>

        ${phasesHtml}

        <div class="plan-note"><strong>How to use it:</strong> each day is about 3 hours: read the concept topics (Revision card first, then the sections), then do the second line, which is DSA, a build step on your running project, or practice. Tick the day when done; ticks sync to your account. Consolidation days use <a class="plan-link" href="#/revise">Quick Revision</a>. From Day 7, every day also carries a 10-minute estimation warm-up (Drill 1 to 14, then repeat) so back-of-envelope math becomes automatic. Lines marked Stretch in Phase 6 are optional extra system-design cases, only if time allows. The four mocks are load-bearing, so after each one, fix the gaps before moving on. Fell behind? Skip a DSA line, never a build step or a mock.</div>
      </div>`;

    const toc = document.getElementById('tocList');
    if (toc) toc.innerHTML = '';

    function updatePlanProgress() {
      const d = new Set(store.get(KEY, []) || []);
      const pctN = total ? Math.round(d.size / total * 100) : 0;
      const fill = document.getElementById('planFill');
      const pct = document.getElementById('planPct');
      if (fill) fill.style.width = pctN + '%';
      if (pct) pct.textContent = d.size + ' / ' + total + ' days · ' + pctN + '%';
      // Current day = first unticked day. Nothing is ever marked late or overdue.
      let cur = 0;
      for (let n = 1; n <= total; n++) { if (!d.has('day-' + n)) { cur = n; break; } }
      $$('.plan-day', container).forEach((row, idx) => { row.classList.toggle('is-current', idx + 1 === cur); if (idx + 1 === cur) row.setAttribute('aria-current', 'step'); else row.removeAttribute('aria-current'); });
      const line = document.getElementById('planDayLine');
      if (line) line.textContent = cur ? 'Day ' + cur + ' of ' + total : 'All ' + total + ' days done';
    }
    $$('.plan-cb', container).forEach(cb => {
      cb.addEventListener('change', () => {
        const d = new Set(store.get(KEY, []) || []);
        const key = cb.dataset.day;
        const row = cb.closest('.plan-day');
        if (cb.checked) { d.add(key); row.classList.add('is-done'); }
        else { d.delete(key); row.classList.remove('is-done'); }
        store.set(KEY, [...d]);
        updatePlanProgress();
        pushUserData();
      });
    });
    updatePlanProgress();

    renderPlanSyncBar();

    if (window.Prism) window.Prism.highlightAll(container);
    document.title = 'Study Plan · Docs';
  }

  // ==========================================================
  // QUICK REVISION (#/revise) — only the ⚡ Revision card of each topic,
  // in sidebar order, filterable by tier / module, with a synced "revised" tick
  // and a collapsed questions-only self-test drawn from the topic's Interview Q&A.
  // ==========================================================
  function renderRevise(container) {
    const reg = window.PREP_SITE.registry;
    const byId = window.PREP_SITE.topicsById;
    const KEY = 'prep-revised';
    const FKEY = 'revise-filter';
    if (typeof teardownSectionProgress === 'function') teardownSectionProgress();

    const groups = [];
    reg.modules.forEach(m => {
      if (m.group && !groups.some(g => g.id === m.group)) groups.push({ id: m.group, label: m.groupLabel || m.group });
    });
    groups.push({ id: 'all', label: 'Everything' });

    const findSec = (topic, ids) => (topic.sections || []).find(s => ids.includes(s.id));
    const questionsOf = (topic) => {
      const tpl = document.createElement('template');
      const qa = findSec(topic, ['interview-qa', 'interview-patterns', 'interview']);
      const clean = (sel, root) => $$(sel, root)
        .map(el => el.textContent.replace(/^\s*Q\d+[.:)]\s*/, '').trim())
        .filter(q => q && !/^(expected answer|acceptable answer|solution|answer)$/i.test(q));
      if (qa) {
        tpl.innerHTML = qa.html;
        const qs = clean('.qa-question, .qa-q', tpl.content);
        // Drill-down ladders: only each ladder's opening question is a self-test item.
        const dd = findSec(topic, ['drill-down']);
        if (dd) {
          const t2 = document.createElement('template');
          t2.innerHTML = dd.html;
          qs.push(...clean('.qa-ladder-start .qa-question', t2.content));
        }
        if (qs.length) return qs.map(escapeHtml);
      }
      const cl = findSec(topic, ['checklist']);
      if (cl) { tpl.innerHTML = cl.html; return $$('li', tpl.content).map(li => li.innerHTML); }
      return [];
    };

    function draw() {
      const f = Object.assign({ group: 'core', modules: [], hideDone: false }, store.get(FKEY, {}) || {});
      if (!groups.some(g => g.id === f.group)) f.group = 'core';
      const revised = new Set(store.get(KEY, []) || []);
      const inGroup = reg.modules.filter(m => f.group === 'all' || m.group === f.group);
      const picked = (f.modules || []).filter(id => inGroup.some(m => m.id === id));
      const mods = picked.length ? inGroup.filter(m => picked.includes(m.id)) : inGroup;

      let total = 0, done = 0;
      const blocks = mods.map(mod => {
        const items = mod.topics.map(t => byId[t.id]).filter(t => t && findSec(t, ['revision']));
        total += items.length;
        const modDone = items.filter(t => revised.has(t.id)).length;
        done += modDone;
        const shown = f.hideDone ? items.filter(t => !revised.has(t.id)) : items;
        if (!shown.length) return '';
        const cards = shown.map(t => {
          const isDone = revised.has(t.id);
          const qs = questionsOf(t);
          const test = qs.length ? `
            <details class="revise-test">
              <summary>✅ Self-test · ${qs.length} question${qs.length > 1 ? 's' : ''}</summary>
              <ol>${qs.map(q => `<li>${q}</li>`).join('')}</ol>
            </details>` : '';
          return `
            <article class="revise-item${isDone ? ' is-done' : ''}" id="rv-${t.id}">
              <div class="revise-head">
                <h3 class="revise-title"><a href="#/topic/${t.id}">${escapeHtml(t.title)}</a></h3>
                <label class="revise-tick"><input type="checkbox" data-id="${t.id}"${isDone ? ' checked' : ''}><span>Revised</span></label>
              </div>
              ${findSec(t, ['revision']).html}
              ${test}
              <a class="revise-open" href="#/topic/${t.id}">Open full topic →</a>
            </article>`;
        }).join('');
        return `<section class="revise-mod"><h2 class="revise-mod-title">${escapeHtml(mod.title)} <span>${modDone} / ${items.length}</span></h2>${cards}</section>`;
      }).join('');

      const pct = total ? Math.round(done / total * 100) : 0;
      const groupChips = groups.map(g =>
        `<button type="button" class="revise-chip${g.id === f.group ? ' is-on' : ''}" data-group="${g.id}">${escapeHtml(g.label)}</button>`).join('');
      const modChips = inGroup.map(m =>
        `<button type="button" class="revise-chip small${picked.includes(m.id) ? ' is-on' : ''}" data-mod="${m.id}">${escapeHtml(m.title)}</button>`).join('');

      container.innerHTML = `
        <div class="revise">
          <div class="topic-meta"><span class="topic-meta-module">⚡ Revision cards only · ${total} topics in view</span></div>
          <h1 class="topic-title">Quick Revision</h1>
          <p class="plan-lede">Only the <strong>⚡ Revision</strong> card of each topic, in study order: one line, key points, the common trap, and what to say. Tick <strong>Revised</strong> as you go, and use <strong>Open full topic</strong> when a point doesn't land.</p>
          <div class="plan-board">
            <div class="plan-prog-head"><span class="lab">Revised</span><span class="pct">${done} / ${total} · ${pct}%</span></div>
            <div class="plan-track"><div class="plan-fill" style="width:${pct}%"></div></div>
            <div class="revise-filters">
              <div class="revise-chips">${groupChips}</div>
              <div class="revise-chips">${modChips}</div>
              <label class="revise-hide"><input type="checkbox" id="reviseHideDone"${f.hideDone ? ' checked' : ''}> Hide revised</label>
            </div>
          </div>
          ${blocks || '<p class="plan-lede">Everything in this view is revised. Untick <strong>Hide revised</strong> to see the cards again.</p>'}
        </div>`;

      $$('.revise-chip[data-group]', container).forEach(b => b.addEventListener('click', () => {
        store.set(FKEY, Object.assign(f, { group: b.dataset.group, modules: [] })); draw(); window.scrollTo({ top: 0 });
      }));
      $$('.revise-chip[data-mod]', container).forEach(b => b.addEventListener('click', () => {
        const id = b.dataset.mod;
        const next = picked.includes(id) ? picked.filter(x => x !== id) : picked.concat(id);
        store.set(FKEY, Object.assign(f, { modules: next })); draw();
      }));
      const hide = $('#reviseHideDone', container);
      if (hide) hide.addEventListener('change', () => { store.set(FKEY, Object.assign(f, { hideDone: hide.checked })); draw(); });
      $$('.revise-tick input', container).forEach(cb => cb.addEventListener('change', () => {
        const set = new Set(store.get(KEY, []) || []);
        if (cb.checked) set.add(cb.dataset.id); else set.delete(cb.dataset.id);
        store.set(KEY, Array.from(set));
        pushUserData();
        if (f.hideDone) { draw(); return; }
        cb.closest('.revise-item').classList.toggle('is-done', cb.checked);
        const all = $$('.revise-tick input', container);
        const n = all.filter(x => x.checked).length;
        const p = all.length ? Math.round(n / all.length * 100) : 0;
        const pctEl = $('.plan-prog-head .pct', container); if (pctEl) pctEl.textContent = n + ' / ' + all.length + ' · ' + p + '%';
        const fill = $('.plan-fill', container); if (fill) fill.style.width = p + '%';
        const sec = cb.closest('.revise-mod');
        if (sec) {
          const boxes = $$('.revise-tick input', sec);
          const span = $('.revise-mod-title span', sec);
          if (span) span.textContent = boxes.filter(x => x.checked).length + ' / ' + boxes.length;
        }
      }));

      const toc = document.getElementById('tocList');
      if (toc) toc.innerHTML = '';
      if (window.Prism) window.Prism.highlightAll(container);
    }

    draw();
    document.title = 'Quick Revision · Docs';
  }

  // ==========================================================
  // TABLE OF CONTENTS (right rail)
  // ==========================================================
  function buildTOC() {
    const list = $('#tocList');
    const headings = $$('.content h2[id], .content h3[id]');
    list.innerHTML = headings.map(h => {
      const indent = h.tagName === 'H3' ? 'style="padding-left:12px"' : '';
      return `<li ${indent}><a href="#/topic/${state.currentTopicId}#${h.id}">${escapeHtml(plainTitle(h.textContent.replace('#', '')))}</a></li>`;
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
      $$('.nav-topic[data-topic-id]').forEach(link => {
        link.classList.toggle('studied', state.studied.has(link.dataset.topicId));
      });
      updateProgress();
      pushUserData();
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

    // Close search when a result is tapped/clicked (delegated; results re-render on input)
    $('#searchResults').addEventListener('click', (e) => {
      if (e.target.closest('.search-result')) closeSearch();
    });

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
    const toc = $('#toc');
    if (!fab || !toc) return;

    // Create / fetch backdrop
    let backdrop = $('#tocBackdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'tocBackdrop';
      backdrop.className = 'toc-backdrop';
      document.body.appendChild(backdrop);
    }

    function openSheet() {
      toc.classList.add('toc-sheet-open');
      backdrop.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
    function closeSheet() {
      toc.classList.remove('toc-sheet-open');
      backdrop.classList.remove('show');
      document.body.style.overflow = '';
    }

    fab.addEventListener('click', () => {
      if (toc.classList.contains('toc-sheet-open')) closeSheet();
      else openSheet();
    });
    backdrop.addEventListener('click', closeSheet);

    // Close when a link is tapped
    toc.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link) closeSheet();
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
    $$('.nav-topic[data-topic-id]').forEach(link => {
      link.classList.toggle('studied', state.studied.has(link.dataset.topicId));
    });
    updateProgress();
    updateBottomNavState();
    renderRail();
    pushUserData();
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
    let gPending = 0;
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

      // "g" prefix → go-to navigation (g g = top, g h = home, g p = practice, g s = study plan, g r = quick revision)
      if (gPending && (Date.now() - gPending < 800)) {
        gPending = 0;
        let handled = true;
        if (lower === 'g') window.scrollTo({ top: 0, behavior: 'smooth' });
        else if (lower === 'h') location.hash = '#/';
        else if (lower === 'p') location.hash = '#/practice';
        else if (lower === 's') { if (isPlanOwner()) location.hash = '#/plan'; else handled = false; }
        else if (lower === 'r') location.hash = '#/revise';
        else handled = false;
        if (handled) { e.preventDefault(); return; }
        // otherwise fall through and treat this key as a normal shortcut
      }

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
      if (lower === 'g') { gPending = Date.now(); return; }
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
      `<span class="section-progress-dot" data-i="${i}" data-id="sec-${s.id}" title="${escapeHtml(plainTitle(s.title))}"></span>`
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
      label.textContent = plainTitle(sections[i].title);
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
    initAuthAndSync();
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
