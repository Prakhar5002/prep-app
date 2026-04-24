/* Minimal JS/JSX/TS syntax highlighter — offline, no dependencies.
   Exposes global `Prism.highlightAll(root)` and `Prism.highlight(code, lang)`.
   Handles: keywords, strings, template literals, comments, numbers, regex,
   functions, classes, operators, punctuation, booleans.
   Not as comprehensive as full PrismJS but good enough for interview notes. */
(function () {
  const KEYWORDS = new Set([
    'break','case','catch','class','const','continue','debugger','default',
    'delete','do','else','enum','export','extends','false','finally','for',
    'function','if','implements','import','in','instanceof','interface',
    'let','new','null','of','package','private','protected','public','return',
    'static','super','switch','this','throw','true','try','typeof','undefined',
    'var','void','while','with','yield','async','await','from','as','type',
    'readonly','keyof','never','any','unknown','string','number','boolean',
    'symbol','object','Record','Promise','Array','Map','Set','WeakMap','WeakSet'
  ]);
  const BUILTINS = new Set([
    'console','document','window','globalThis','Object','Array','String',
    'Number','Boolean','Symbol','Date','Math','JSON','Error','RegExp',
    'Proxy','Reflect','Promise','Map','Set','WeakMap','WeakSet','Function',
    'Intl','React','useState','useEffect','useRef','useMemo','useCallback',
    'useContext','useReducer','useLayoutEffect','useImperativeHandle',
    'useTransition','useDeferredValue','useSyncExternalStore','useId',
    'setTimeout','setInterval','clearTimeout','clearInterval','queueMicrotask',
    'requestAnimationFrame','cancelAnimationFrame','fetch','AbortController'
  ]);

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function highlightJs(code) {
    // Work on escaped HTML; replace tokens with <span class="token ...">
    const tokens = [];
    let i = 0;
    const len = code.length;

    function peek(n = 0) { return code[i + n]; }
    function advance(n = 1) { const s = code.slice(i, i + n); i += n; return s; }

    while (i < len) {
      const c = code[i];
      const c2 = code[i] + (code[i + 1] || '');

      // Line comment
      if (c2 === '//') {
        let j = i;
        while (i < len && code[i] !== '\n') i++;
        tokens.push({ type: 'comment', value: code.slice(j, i) });
        continue;
      }
      // Block comment
      if (c2 === '/*') {
        let j = i;
        i += 2;
        while (i < len && code.slice(i, i + 2) !== '*/') i++;
        if (i < len) i += 2;
        tokens.push({ type: 'comment', value: code.slice(j, i) });
        continue;
      }
      // String single or double
      if (c === '"' || c === "'") {
        const quote = c;
        let j = i++;
        while (i < len && code[i] !== quote) {
          if (code[i] === '\\') i++;
          i++;
        }
        i++;
        tokens.push({ type: 'string', value: code.slice(j, i) });
        continue;
      }
      // Template literal
      if (c === '`') {
        let j = i++;
        while (i < len && code[i] !== '`') {
          if (code[i] === '\\') i++;
          i++;
        }
        i++;
        tokens.push({ type: 'string', value: code.slice(j, i) });
        continue;
      }
      // Number
      if (/[0-9]/.test(c)) {
        let j = i;
        while (i < len && /[0-9.xbBn_A-Fa-f]/.test(code[i])) i++;
        tokens.push({ type: 'number', value: code.slice(j, i) });
        continue;
      }
      // Identifier / keyword
      if (/[A-Za-z_$]/.test(c)) {
        let j = i;
        while (i < len && /[A-Za-z0-9_$]/.test(code[i])) i++;
        const word = code.slice(j, i);
        let type = 'identifier';
        if (KEYWORDS.has(word)) type = 'keyword';
        else if (word === 'true' || word === 'false') type = 'boolean';
        else if (BUILTINS.has(word)) type = 'builtin';
        else if (/^[A-Z]/.test(word)) type = 'class-name';
        else {
          // Function call detection
          let k = i;
          while (k < len && /\s/.test(code[k])) k++;
          if (code[k] === '(') type = 'function';
        }
        tokens.push({ type, value: word });
        continue;
      }
      // Operators & punctuation
      if (/[{}()\[\];,]/.test(c)) {
        tokens.push({ type: 'punctuation', value: c });
        i++;
        continue;
      }
      if (/[+\-*/%=<>!&|^~?:]/.test(c)) {
        let j = i;
        while (i < len && /[+\-*/%=<>!&|^~?:]/.test(code[i])) i++;
        tokens.push({ type: 'operator', value: code.slice(j, i) });
        continue;
      }
      // Default (whitespace etc.)
      tokens.push({ type: 'text', value: c });
      i++;
    }

    return tokens.map(t => {
      const escaped = escapeHtml(t.value);
      if (t.type === 'text' || t.type === 'identifier') return escaped;
      return `<span class="token ${t.type}">${escaped}</span>`;
    }).join('');
  }

  const Prism = {
    highlight(code, lang) {
      if (lang === 'js' || lang === 'javascript' || lang === 'ts' || lang === 'typescript' || lang === 'jsx' || lang === 'tsx') {
        return highlightJs(code);
      }
      return escapeHtml(code);
    },
    highlightAll(root) {
      root = root || document;
      root.querySelectorAll('pre > code').forEach(codeEl => {
        if (codeEl.dataset.highlighted) return;
        const classList = Array.from(codeEl.classList);
        const langClass = classList.find(c => c.startsWith('language-'));
        const lang = langClass ? langClass.replace('language-', '') : 'js';
        const rawText = codeEl.textContent;
        codeEl.innerHTML = Prism.highlight(rawText, lang);
        codeEl.dataset.highlighted = '1';
      });
    }
  };

  window.Prism = Prism;
})();
