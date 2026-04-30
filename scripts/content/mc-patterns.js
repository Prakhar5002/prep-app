window.PREP_SITE.registerTopic({
  id: 'mc-patterns',
  module: 'machine-coding',
  title: 'Core Patterns',
  estimatedReadTime: '50 min',
  tags: ['machine-coding', 'patterns', 'debounce', 'throttle', 'modal', 'toast', 'infinite-scroll', 'autocomplete', 'otp', 'form'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>A <strong>machine-coding round</strong> is 60–90 minutes of live, runnable code building a small feature. The grader is watching three things simultaneously: <strong>can you ship a working thing</strong>, <strong>can you reach for the right primitives</strong>, and <strong>can you narrate tradeoffs while typing</strong>. Most asks collapse into ~15 reusable patterns — recognise the pattern, drop in your skeleton, polish.</p>
<ul>
  <li><strong>The 15 patterns that cover ~90% of asks:</strong> debounce / throttle, autocomplete, infinite scroll, virtualized list, modal + portal, toast queue, tooltip, tabs, accordion, OTP input, form with validation, image carousel, stopwatch / timer, drag-to-reorder, theme switcher.</li>
  <li><strong>The 5-minute skeleton:</strong> file scaffold → layout → state model → wire data → polish. Don't style first.</li>
  <li><strong>Default toolbox:</strong> functional components + hooks, <code>useReducer</code> for complex state, custom hooks (<code>useDebounce</code>, <code>useFetch</code>, <code>useOnClickOutside</code>), portals for floating UI, IntersectionObserver for infinite scroll.</li>
  <li><strong>Always demo five states:</strong> empty, loading, error, golden path, edge case. If you don't demo them, the grader assumes they don't work.</li>
  <li><strong>Always close with:</strong> "If I had more time I would…" — testing, accessibility, retries, virtualization, theming. Naming gaps shows seniority.</li>
</ul>
<p><strong>Mantra:</strong> "Working &gt; pretty &gt; clever. Skeleton in five minutes. Narrate every tradeoff."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What is a machine-coding round?</h3>
<p>Unlike DSA (one function, one return) or system design (whiteboard only), machine coding is a <em>build</em>. You open an editor — CodeSandbox, StackBlitz, or a starter repo — and produce a runnable feature in 60–90 minutes. The interviewer watches you type and asks questions throughout.</p>

<h3>Why companies run this round</h3>
<table>
  <thead><tr><th>What it tests</th><th>Why it matters in production</th></tr></thead>
  <tbody>
    <tr><td>Can you actually ship code, not just whiteboard it?</td><td>Throughput matters; teams ship many small features per sprint.</td></tr>
    <tr><td>Do you reach for the right primitives?</td><td>Knowing IntersectionObserver vs scroll listeners separates senior from junior.</td></tr>
    <tr><td>Architecture under pressure</td><td>Real on-call work is also under pressure — your defaults define quality.</td></tr>
    <tr><td>Edge-case awareness</td><td>Production bugs hit one user, one network, one device — naming edges is everything.</td></tr>
    <tr><td>Communication while building</td><td>You'll explain decisions in PR review, design docs, incident reviews.</td></tr>
  </tbody>
</table>

<h3>The recognise-the-pattern instinct</h3>
<p>Almost every prompt maps to one of ~15 building blocks. The senior signal is naming the pattern in the first 60 seconds: <em>"This is autocomplete with debounce + cancellation, the infinite-scroll variant. I'll start with a <code>useDebounce</code> hook plus an abortable fetch."</em></p>
<p>Once you've named it, you skip 10 minutes of "where do I start?" thinking and start typing the skeleton.</p>

<h3>What "good" looks like</h3>
<ul>
  <li>You name the pattern out loud within the first minute.</li>
  <li>You scaffold a runnable skeleton in 5–10 minutes (visible empty state on screen).</li>
  <li>You verbalise tradeoffs as you type: <em>"I'll use a controlled input here because we need to validate on every keystroke."</em></li>
  <li>You demo loading, error, empty, golden, edge — not just golden.</li>
  <li>You close with 3–5 "if I had more time" items: testing, a11y, retries, virtualization.</li>
  <li>Your component is reusable: clean props API, no hardcoded copy/colours.</li>
</ul>

<h3>What "bad" looks like</h3>
<ul>
  <li>15 minutes of CSS before any state is wired.</li>
  <li>Silent typing — interviewer can't grade you if they can't hear your reasoning.</li>
  <li>Skipping loading / error / empty states.</li>
  <li>One giant component with everything inline (no composition).</li>
  <li>Forgetting cleanup, leaking timers / listeners.</li>
  <li>Treating <code>any</code> / no types as "good enough."</li>
</ul>

<h3>Common prompts and their pattern</h3>
<table>
  <thead><tr><th>Prompt</th><th>Pattern</th></tr></thead>
  <tbody>
    <tr><td>"Build a search bar with autocomplete"</td><td>debounced input + abortable fetch + dropdown</td></tr>
    <tr><td>"Build an infinite-scrolling feed"</td><td>IntersectionObserver + paginated fetch + list</td></tr>
    <tr><td>"Build a modal / dialog"</td><td>portal + focus trap + backdrop click + ESC</td></tr>
    <tr><td>"Build a toast notifier"</td><td>queue + provider + auto-dismiss timer</td></tr>
    <tr><td>"Build a tabs component"</td><td>controlled state + ARIA roles + keyboard arrows</td></tr>
    <tr><td>"Build an OTP input"</td><td>refs array + auto-focus next + paste handler</td></tr>
    <tr><td>"Build a multi-step form"</td><td><code>useReducer</code> + step state + validation per step</td></tr>
    <tr><td>"Build an image carousel"</td><td>state index + transform translateX + arrow keys</td></tr>
    <tr><td>"Build a stopwatch"</td><td><code>setInterval</code> + start/pause/reset + cleanup</td></tr>
    <tr><td>"Build a drag-to-reorder list"</td><td>HTML5 DnD or Pointer events + index swap</td></tr>
    <tr><td>"Build a virtualized list"</td><td>windowing math + absolute-positioned items</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The 5-minute skeleton template</h3>
<p>Always run this loop, regardless of prompt:</p>
<pre><code class="language-text">1. File scaffold       (App.jsx, components/, hooks/)         ~30s
2. Static layout       (return JSX, no logic, hardcoded data)  ~2min
3. State model         (what state? where does it live?)       ~1min
4. Wire data           (events, fetches, derived state)        ~5min
5. Edge cases + polish (loading, error, empty, a11y)           rest of time
</code></pre>
<p>By minute 7, the grader should see <em>something</em> rendered on screen. Empty state with hardcoded data is fine — silence is not.</p>

<h3>State colocation rule</h3>
<ol>
  <li>Default to keeping state inside the component that uses it.</li>
  <li>Lift state up only when two siblings need to read or write it.</li>
  <li>Reach for context only when 3+ levels deep need the state.</li>
  <li>Reach for Redux / Zustand only when global + cross-route + persist.</li>
</ol>
<p>For machine coding, you almost never need step 3 or 4. Most rounds are 1–3 components — local state + lifting.</p>

<h3>Controlled vs uncontrolled inputs</h3>
<table>
  <thead><tr><th>Use</th><th>When</th></tr></thead>
  <tbody>
    <tr><td>Controlled (<code>value</code> + <code>onChange</code>)</td><td>You need to validate live, format as user types, or sync to other state.</td></tr>
    <tr><td>Uncontrolled (<code>ref</code> + <code>defaultValue</code>)</td><td>You only need the value at submit time. Cheaper, no re-render per keystroke.</td></tr>
  </tbody>
</table>

<h3>The data-flow pyramid</h3>
<p>Most machine coding components have this shape:</p>
<pre><code class="language-text">                  &lt;FeatureRoot /&gt;          owns state, owns fetches
                  /              \\
            &lt;Header /&gt;         &lt;Body /&gt;       presentational
                                |
                          &lt;ItemList /&gt;        memo-able list
                                |
                            &lt;Item /&gt;          memo-able row
</code></pre>
<p>Hold state high, render dumb children. This makes memoisation easy and the component reusable.</p>

<h3>The 3 derived-state mistakes</h3>
<ol>
  <li><strong>Storing what you can derive:</strong> if <code>fullName = firstName + lastName</code>, don't store <code>fullName</code> in state.</li>
  <li><strong>Mirroring props in state:</strong> if you ever do <code>useState(props.x)</code>, double-check you're not mirroring. Use the prop directly.</li>
  <li><strong>Computing in render every time:</strong> if the computation is expensive, wrap with <code>useMemo</code>; if it's free, don't.</li>
</ol>

<h3>The narration framework</h3>
<p>Senior candidates say things like:</p>
<ul>
  <li><em>"I'll start with the data shape — list of items each with id, label."</em></li>
  <li><em>"State lives in the parent because both Search and Results read it."</em></li>
  <li><em>"I'm using a controlled input because we debounce on every keystroke."</em></li>
  <li><em>"Cleanup matters here — I'll abort the previous fetch in the deps-changed branch."</em></li>
  <li><em>"For now I'll inline the styles; in a real codebase this lives in a design-system component."</em></li>
</ul>

<h3>Time budget for a 60-minute round</h3>
<table>
  <thead><tr><th>Phase</th><th>Budget</th><th>Output</th></tr></thead>
  <tbody>
    <tr><td>Clarify + name pattern</td><td>0–3 min</td><td>Pattern named, scope agreed.</td></tr>
    <tr><td>Skeleton</td><td>3–10 min</td><td>Empty render, file structure, types.</td></tr>
    <tr><td>Happy path</td><td>10–30 min</td><td>Golden flow works end-to-end.</td></tr>
    <tr><td>Edge cases</td><td>30–45 min</td><td>Loading, error, empty, slow network.</td></tr>
    <tr><td>Polish + a11y</td><td>45–55 min</td><td>Keyboard, ARIA, focus management.</td></tr>
    <tr><td>Q&amp;A + closers</td><td>55–60 min</td><td>Walk through, "if I had more time".</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Custom hook toolbox</h3>
<p>These ~6 hooks come up in almost every round. Memorise them — typing them in 60 seconds buys you minutes for the actual feature.</p>

<h4>useDebounce</h4>
<pre><code class="language-javascript">function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() =&gt; {
    const id = setTimeout(() =&gt; setDebounced(value), delay);
    return () =&gt; clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// Use:
const debouncedQuery = useDebounce(query, 300);
useEffect(() =&gt; { fetchResults(debouncedQuery); }, [debouncedQuery]);
</code></pre>

<h4>useThrottle (leading-edge)</h4>
<pre><code class="language-javascript">function useThrottle(value, limit = 200) {
  const [throttled, setThrottled] = useState(value);
  const last = useRef(Date.now());
  useEffect(() =&gt; {
    const now = Date.now();
    if (now - last.current &gt;= limit) {
      setThrottled(value);
      last.current = now;
      return;
    }
    const id = setTimeout(() =&gt; {
      setThrottled(value);
      last.current = Date.now();
    }, limit - (now - last.current));
    return () =&gt; clearTimeout(id);
  }, [value, limit]);
  return throttled;
}
</code></pre>

<h4>useFetch with abort + dedupe</h4>
<pre><code class="language-javascript">function useFetch(url) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  useEffect(() =&gt; {
    const ac = new AbortController();
    setState({ data: null, error: null, loading: true });
    fetch(url, { signal: ac.signal })
      .then(r =&gt; { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then(data =&gt; setState({ data, error: null, loading: false }))
      .catch(error =&gt; {
        if (error.name === 'AbortError') return;
        setState({ data: null, error, loading: false });
      });
    return () =&gt; ac.abort();
  }, [url]);
  return state;
}
</code></pre>

<h4>useOnClickOutside</h4>
<pre><code class="language-javascript">function useOnClickOutside(ref, handler) {
  useEffect(() =&gt; {
    const listener = e =&gt; {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler(e);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () =&gt; {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}
</code></pre>

<h4>useLocalStorage</h4>
<pre><code class="language-javascript">function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() =&gt; {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch { return initial; }
  });
  useEffect(() =&gt; {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);
  return [value, setValue];
}
</code></pre>

<h4>usePrevious</h4>
<pre><code class="language-javascript">function usePrevious(value) {
  const ref = useRef();
  useEffect(() =&gt; { ref.current = value; });
  return ref.current;
}
</code></pre>

<h3>Pattern 1 — Debounce vs throttle decision</h3>
<table>
  <thead><tr><th>Use</th><th>For</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td>Debounce</td><td>"Wait until user stops"</td><td>search input, resize, autosave on idle</td></tr>
    <tr><td>Throttle</td><td>"At most once every X ms"</td><td>scroll, mousemove, drag, analytics fire</td></tr>
  </tbody>
</table>

<h3>Pattern 2 — Modal with portal + focus trap</h3>
<pre><code class="language-javascript">// Render outside the DOM tree to avoid z-index/overflow issues.
function Modal({ isOpen, onClose, children }) {
  const ref = useRef(null);
  useEffect(() =&gt; {
    if (!isOpen) return;
    const handle = e =&gt; { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () =&gt; {
      document.removeEventListener('keydown', handle);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return ReactDOM.createPortal(
    &lt;div className="backdrop" onClick={onClose}&gt;
      &lt;div ref={ref} role="dialog" aria-modal="true" tabIndex={-1}
           className="dialog" onClick={e =&gt; e.stopPropagation()}&gt;
        {children}
      &lt;/div&gt;
    &lt;/div&gt;,
    document.body
  );
}
</code></pre>
<p>Edge cases: ESC closes, backdrop click closes, body scroll locks while open, focus moves to dialog, focus returns to trigger on close, screen readers announce role + label.</p>

<h3>Pattern 3 — Toast queue with provider</h3>
<pre><code class="language-javascript">const ToastCtx = createContext(null);
export const useToast = () =&gt; useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, opts = {}) =&gt; {
    const id = Date.now() + Math.random();
    setToasts(t =&gt; [...t, { id, msg, ...opts }]);
    setTimeout(() =&gt; {
      setToasts(t =&gt; t.filter(x =&gt; x.id !== id));
    }, opts.duration ?? 3000);
  }, []);
  return (
    &lt;ToastCtx.Provider value={push}&gt;
      {children}
      &lt;div className="toast-stack" aria-live="polite"&gt;
        {toasts.map(t =&gt; (
          &lt;div key={t.id} className="toast"&gt;{t.msg}&lt;/div&gt;
        ))}
      &lt;/div&gt;
    &lt;/ToastCtx.Provider&gt;
  );
}
</code></pre>

<h3>Pattern 4 — Infinite scroll with IntersectionObserver</h3>
<pre><code class="language-javascript">function useInfiniteScroll(loadMore, hasMore) {
  const sentinelRef = useRef(null);
  useEffect(() =&gt; {
    if (!hasMore) return;
    const obs = new IntersectionObserver(entries =&gt; {
      if (entries[0].isIntersecting) loadMore();
    }, { rootMargin: '200px' });
    if (sentinelRef.current) obs.observe(sentinelRef.current);
    return () =&gt; obs.disconnect();
  }, [loadMore, hasMore]);
  return sentinelRef;
}
</code></pre>
<p>Why IntersectionObserver beats <code>onScroll</code>: doesn't fire on every pixel, runs off the main thread, free rootMargin lookahead.</p>

<h3>Pattern 5 — Virtualized list (windowing)</h3>
<pre><code class="language-javascript">function VirtualList({ items, itemHeight = 40, height = 400 }) {
  const [scrollTop, setScrollTop] = useState(0);
  const startIdx = Math.floor(scrollTop / itemHeight);
  const visibleCount = Math.ceil(height / itemHeight) + 2;
  const endIdx = Math.min(startIdx + visibleCount, items.length);
  const visible = items.slice(startIdx, endIdx);
  return (
    &lt;div onScroll={e =&gt; setScrollTop(e.currentTarget.scrollTop)}
         style={{ height, overflow: 'auto', position: 'relative' }}&gt;
      &lt;div style={{ height: items.length * itemHeight, position: 'relative' }}&gt;
        {visible.map((item, i) =&gt; (
          &lt;div key={item.id}
               style={{
                 position: 'absolute',
                 top: (startIdx + i) * itemHeight,
                 height: itemHeight,
               }}&gt;{item.label}&lt;/div&gt;
        ))}
      &lt;/div&gt;
    &lt;/div&gt;
  );
}
</code></pre>

<h3>Pattern 6 — OTP input</h3>
<pre><code class="language-javascript">function OTP({ length = 6, onChange }) {
  const [values, setValues] = useState(Array(length).fill(''));
  const refs = useRef([]);
  const update = (i, v) =&gt; {
    if (!/^\\d?$/.test(v)) return;
    const next = [...values];
    next[i] = v;
    setValues(next);
    onChange(next.join(''));
    if (v &amp;&amp; i &lt; length - 1) refs.current[i + 1]?.focus();
  };
  const onKey = (i, e) =&gt; {
    if (e.key === 'Backspace' &amp;&amp; !values[i] &amp;&amp; i &gt; 0) refs.current[i - 1]?.focus();
  };
  const onPaste = e =&gt; {
    const pasted = e.clipboardData.getData('text').slice(0, length).split('');
    if (!pasted.every(c =&gt; /\\d/.test(c))) return;
    const next = Array(length).fill('').map((_, i) =&gt; pasted[i] ?? '');
    setValues(next);
    onChange(next.join(''));
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  };
  return (
    &lt;div className="otp"&gt;
      {values.map((v, i) =&gt; (
        &lt;input key={i} ref={el =&gt; (refs.current[i] = el)}
               value={v} maxLength={1}
               onChange={e =&gt; update(i, e.target.value)}
               onKeyDown={e =&gt; onKey(i, e)}
               onPaste={onPaste}
               inputMode="numeric" /&gt;
      ))}
    &lt;/div&gt;
  );
}
</code></pre>

<h3>Pattern 7 — Stopwatch / timer</h3>
<pre><code class="language-javascript">function Stopwatch() {
  const [ms, setMs] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() =&gt; {
    if (!running) return;
    const start = Date.now() - ms;
    const id = setInterval(() =&gt; setMs(Date.now() - start), 10);
    return () =&gt; clearInterval(id);
  }, [running]);
  // never store the start time in state — derive each tick from Date.now()
  // to survive tab throttling and missed intervals
  return (
    &lt;div&gt;
      &lt;div&gt;{(ms / 1000).toFixed(2)}s&lt;/div&gt;
      &lt;button onClick={() =&gt; setRunning(r =&gt; !r)}&gt;{running ? 'Pause' : 'Start'}&lt;/button&gt;
      &lt;button onClick={() =&gt; { setRunning(false); setMs(0); }}&gt;Reset&lt;/button&gt;
    &lt;/div&gt;
  );
}
</code></pre>

<h3>Pattern 8 — Tabs (controlled, accessible)</h3>
<pre><code class="language-javascript">function Tabs({ tabs, defaultIdx = 0 }) {
  const [idx, setIdx] = useState(defaultIdx);
  const onKey = e =&gt; {
    if (e.key === 'ArrowRight') setIdx(i =&gt; (i + 1) % tabs.length);
    if (e.key === 'ArrowLeft')  setIdx(i =&gt; (i - 1 + tabs.length) % tabs.length);
  };
  return (
    &lt;div&gt;
      &lt;div role="tablist" onKeyDown={onKey}&gt;
        {tabs.map((t, i) =&gt; (
          &lt;button key={t.id} role="tab"
                  aria-selected={i === idx} tabIndex={i === idx ? 0 : -1}
                  onClick={() =&gt; setIdx(i)}&gt;{t.label}&lt;/button&gt;
        ))}
      &lt;/div&gt;
      &lt;div role="tabpanel"&gt;{tabs[idx].content}&lt;/div&gt;
    &lt;/div&gt;
  );
}
</code></pre>

<h3>Pattern 9 — Form with validation (useReducer)</h3>
<pre><code class="language-javascript">const init = { values: { email: '', password: '' }, errors: {}, touched: {} };

function reducer(state, action) {
  switch (action.type) {
    case 'change':
      return { ...state, values: { ...state.values, [action.field]: action.value } };
    case 'blur':
      return { ...state, touched: { ...state.touched, [action.field]: true } };
    case 'errors':
      return { ...state, errors: action.errors };
    default: return state;
  }
}

function validate(values) {
  const errors = {};
  if (!/^\\S+@\\S+\\.\\S+$/.test(values.email)) errors.email = 'Invalid email';
  if (values.password.length &lt; 8) errors.password = 'Min 8 chars';
  return errors;
}

function LoginForm() {
  const [state, dispatch] = useReducer(reducer, init);
  const errs = validate(state.values);
  const submit = e =&gt; {
    e.preventDefault();
    dispatch({ type: 'errors', errors: errs });
    if (Object.keys(errs).length) return;
    // submit
  };
  return (
    &lt;form onSubmit={submit}&gt;
      &lt;input value={state.values.email}
             onChange={e =&gt; dispatch({ type: 'change', field: 'email', value: e.target.value })}
             onBlur={() =&gt; dispatch({ type: 'blur', field: 'email' })} /&gt;
      {state.touched.email &amp;&amp; errs.email &amp;&amp; &lt;span&gt;{errs.email}&lt;/span&gt;}
      {/* …password field same shape */}
      &lt;button&gt;Submit&lt;/button&gt;
    &lt;/form&gt;
  );
}
</code></pre>

<h3>Pattern 10 — Drag-to-reorder</h3>
<pre><code class="language-javascript">function Sortable({ items, onReorder }) {
  const dragIdx = useRef(null);
  return (
    &lt;ul&gt;
      {items.map((item, i) =&gt; (
        &lt;li key={item.id} draggable
            onDragStart={() =&gt; { dragIdx.current = i; }}
            onDragOver={e =&gt; e.preventDefault()}
            onDrop={() =&gt; {
              if (dragIdx.current === null || dragIdx.current === i) return;
              const next = [...items];
              const [moved] = next.splice(dragIdx.current, 1);
              next.splice(i, 0, moved);
              onReorder(next);
              dragIdx.current = null;
            }}&gt;{item.label}&lt;/li&gt;
      ))}
    &lt;/ul&gt;
  );
}
</code></pre>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Autocomplete with debounce + abort + cache</h3>
<p>The single most-asked machine-coding feature. Cover all three layers.</p>
<pre><code class="language-javascript">function Autocomplete({ fetcher }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const debounced = useDebounce(query, 300);
  const cache = useRef(new Map());

  useEffect(() =&gt; {
    if (!debounced) { setResults([]); return; }
    if (cache.current.has(debounced)) {
      setResults(cache.current.get(debounced));
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    fetcher(debounced, ac.signal)
      .then(data =&gt; {
        cache.current.set(debounced, data);
        setResults(data);
        setLoading(false);
      })
      .catch(err =&gt; {
        if (err.name !== 'AbortError') setLoading(false);
      });
    return () =&gt; ac.abort();
  }, [debounced, fetcher]);

  const onKey = e =&gt; {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i =&gt; Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(i =&gt; Math.max(i - 1, 0)); }
    if (e.key === 'Enter' &amp;&amp; results[active]) {
      setQuery(results[active].label);
      setResults([]);
    }
    if (e.key === 'Escape') setResults([]);
  };

  return (
    &lt;div className="autocomplete" role="combobox"
         aria-expanded={results.length &gt; 0} aria-haspopup="listbox"&gt;
      &lt;input value={query}
             onChange={e =&gt; { setQuery(e.target.value); setActive(-1); }}
             onKeyDown={onKey}
             aria-autocomplete="list"
             aria-activedescendant={active &gt;= 0 ? \`opt-\${active}\` : undefined} /&gt;
      {loading &amp;&amp; &lt;div className="loading"&gt;Searching…&lt;/div&gt;}
      {results.length &gt; 0 &amp;&amp; (
        &lt;ul role="listbox"&gt;
          {results.map((r, i) =&gt; (
            &lt;li key={r.id} id={\`opt-\${i}\`} role="option"
                aria-selected={i === active}
                onMouseEnter={() =&gt; setActive(i)}
                onClick={() =&gt; { setQuery(r.label); setResults([]); }}&gt;
              {r.label}
            &lt;/li&gt;
          ))}
        &lt;/ul&gt;
      )}
      {!loading &amp;&amp; debounced &amp;&amp; results.length === 0 &amp;&amp;
        &lt;div className="empty"&gt;No results&lt;/div&gt;}
    &lt;/div&gt;
  );
}
</code></pre>
<p>Demo states to show: empty input (no dropdown), loading, no-results, results, keyboard navigation, ESC dismisses, click selects, network error.</p>

<h3>Example 2: Infinite-scrolling feed with caching</h3>
<pre><code class="language-javascript">function useInfinitePaged(fetcher, pageSize = 20) {
  const [pages, setPages] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(() =&gt; {
    if (loading || !hasMore) return;
    setLoading(true);
    fetcher(page, pageSize)
      .then(items =&gt; {
        setPages(p =&gt; [...p, ...items]);
        setHasMore(items.length === pageSize);
        setPage(p =&gt; p + 1);
        setLoading(false);
      })
      .catch(err =&gt; { setError(err); setLoading(false); });
  }, [fetcher, page, pageSize, loading, hasMore]);

  useEffect(() =&gt; { loadMore(); }, []); // initial load
  return { pages, loadMore, loading, error, hasMore };
}

function Feed({ fetcher }) {
  const { pages, loadMore, loading, error, hasMore } = useInfinitePaged(fetcher);
  const sentinelRef = useInfiniteScroll(loadMore, hasMore);
  if (error) return &lt;div&gt;Failed: {error.message} &lt;button onClick={loadMore}&gt;Retry&lt;/button&gt;&lt;/div&gt;;
  return (
    &lt;div&gt;
      {pages.map(p =&gt; &lt;Card key={p.id} {...p} /&gt;)}
      {hasMore &amp;&amp; &lt;div ref={sentinelRef} className="sentinel"&gt;{loading ? 'Loading…' : ''}&lt;/div&gt;}
      {!hasMore &amp;&amp; &lt;div&gt;You're all caught up.&lt;/div&gt;}
    &lt;/div&gt;
  );
}
</code></pre>

<h3>Example 3: Multi-step form with validation</h3>
<pre><code class="language-javascript">const steps = [
  { id: 'name',    fields: ['firstName', 'lastName'] },
  { id: 'address', fields: ['street', 'city', 'zip'] },
  { id: 'review',  fields: [] },
];

const validators = {
  firstName: v =&gt; v ? null : 'Required',
  lastName:  v =&gt; v ? null : 'Required',
  street:    v =&gt; v ? null : 'Required',
  city:      v =&gt; v ? null : 'Required',
  zip:       v =&gt; /^\\d{5}$/.test(v) ? null : 'Must be 5 digits',
};

function MultiStepForm() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  const validateStep = () =&gt; {
    const errs = {};
    for (const f of steps[step].fields) {
      const e = validators[f]?.(values[f] ?? '');
      if (e) errs[f] = e;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () =&gt; { if (validateStep()) setStep(s =&gt; s + 1); };
  const prev = () =&gt; setStep(s =&gt; Math.max(0, s - 1));

  return (
    &lt;form onSubmit={e =&gt; { e.preventDefault(); if (validateStep()) submit(values); }}&gt;
      &lt;ProgressBar step={step} total={steps.length} /&gt;
      {step === 0 &amp;&amp; &lt;NameStep values={values} setValues={setValues} errors={errors} /&gt;}
      {step === 1 &amp;&amp; &lt;AddressStep values={values} setValues={setValues} errors={errors} /&gt;}
      {step === 2 &amp;&amp; &lt;Review values={values} /&gt;}
      &lt;div className="actions"&gt;
        {step &gt; 0 &amp;&amp; &lt;button type="button" onClick={prev}&gt;Back&lt;/button&gt;}
        {step &lt; steps.length - 1
          ? &lt;button type="button" onClick={next}&gt;Next&lt;/button&gt;
          : &lt;button type="submit"&gt;Submit&lt;/button&gt;}
      &lt;/div&gt;
    &lt;/form&gt;
  );
}
</code></pre>
<p>Why this scales: each step is a presentational component, validation is data-driven (extend by adding to <code>validators</code>), step list is config not code.</p>

<h3>Example 4: Image carousel with autoplay + arrow keys</h3>
<pre><code class="language-javascript">function Carousel({ images, autoplayMs = 0 }) {
  const [idx, setIdx] = useState(0);
  const next = () =&gt; setIdx(i =&gt; (i + 1) % images.length);
  const prev = () =&gt; setIdx(i =&gt; (i - 1 + images.length) % images.length);

  useEffect(() =&gt; {
    if (!autoplayMs) return;
    const id = setInterval(next, autoplayMs);
    return () =&gt; clearInterval(id);
  }, [autoplayMs, images.length]);

  useEffect(() =&gt; {
    const onKey = e =&gt; {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft')  prev();
    };
    document.addEventListener('keydown', onKey);
    return () =&gt; document.removeEventListener('keydown', onKey);
  }, []);

  return (
    &lt;div className="carousel" role="region" aria-roledescription="carousel"&gt;
      &lt;div className="track" style={{ transform: \`translateX(-\${idx * 100}%)\` }}&gt;
        {images.map((src, i) =&gt; (
          &lt;img key={i} src={src} alt="" loading={i === idx ? 'eager' : 'lazy'} /&gt;
        ))}
      &lt;/div&gt;
      &lt;button onClick={prev} aria-label="Previous"&gt;‹&lt;/button&gt;
      &lt;button onClick={next} aria-label="Next"&gt;›&lt;/button&gt;
      &lt;div className="dots"&gt;
        {images.map((_, i) =&gt; (
          &lt;button key={i} aria-current={i === idx} onClick={() =&gt; setIdx(i)} /&gt;
        ))}
      &lt;/div&gt;
    &lt;/div&gt;
  );
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Race conditions in async UIs</h3>
<p>The single most common machine-coding bug.</p>
<table>
  <thead><tr><th>Scenario</th><th>Symptom</th><th>Fix</th></tr></thead>
  <tbody>
    <tr><td>User types "ab" → "abc" quickly</td><td>"ab" results overwrite "abc" results</td><td>AbortController on cleanup</td></tr>
    <tr><td>Modal closes during fetch</td><td>setState on unmounted component warning</td><td>cleanup or check <code>isMounted</code></td></tr>
    <tr><td>Tab switches during scroll listener</td><td>Updates while invisible</td><td>Page Visibility API or pause logic</td></tr>
    <tr><td>Two clicks before first request returns</td><td>Duplicate requests, last one wins (or not)</td><td>Disable button during in-flight, cancel previous</td></tr>
  </tbody>
</table>

<h3>Empty / loading / error states</h3>
<p>Every async UI has at least these states. Show all of them in the demo.</p>
<table>
  <thead><tr><th>State</th><th>What to show</th></tr></thead>
  <tbody>
    <tr><td>Initial (no query)</td><td>Empty UI with hint text</td></tr>
    <tr><td>Loading (first time)</td><td>Skeleton or spinner</td></tr>
    <tr><td>Loading (refresh)</td><td>Inline indicator, keep old data visible</td></tr>
    <tr><td>Empty (query but zero results)</td><td>"No results for X. Try Y."</td></tr>
    <tr><td>Error</td><td>Message + retry button</td></tr>
    <tr><td>Partial / paginated end</td><td>"You're all caught up"</td></tr>
  </tbody>
</table>

<h3>Network edge cases</h3>
<ul>
  <li><strong>Offline:</strong> show cached data + "you're offline" banner; retry on reconnect via <code>online</code> event.</li>
  <li><strong>Slow 3G:</strong> show progressive loading skeletons; don't block the UI.</li>
  <li><strong>Flaky network:</strong> exponential backoff retry (e.g., 3 attempts, 1s/2s/4s).</li>
  <li><strong>Timeout:</strong> fetch with <code>AbortController</code> + setTimeout pattern.</li>
  <li><strong>HTTP error codes:</strong> handle 4xx (don't retry) vs 5xx (retry).</li>
</ul>

<h3>Keyboard + focus management</h3>
<ul>
  <li><strong>Modal:</strong> focus trap, focus moves to dialog on open, returns to trigger on close, ESC closes.</li>
  <li><strong>Autocomplete:</strong> arrow keys navigate, Enter selects, ESC closes, Tab respects flow.</li>
  <li><strong>Tabs:</strong> arrow keys switch tabs, only active tab is in tab order.</li>
  <li><strong>Form:</strong> Enter submits (unless multi-step where Enter advances), error fields receive focus.</li>
  <li><strong>OTP:</strong> auto-focus next on input, Backspace moves back, Cmd+V pastes full code.</li>
</ul>

<h3>Accessibility minimum bar</h3>
<ul>
  <li>Semantic HTML: <code>&lt;button&gt;</code> for clickables, not <code>&lt;div onClick&gt;</code>.</li>
  <li>Labels for all inputs (<code>&lt;label&gt;</code> or <code>aria-label</code>).</li>
  <li>Roles on custom widgets: dialog, listbox, tab, tabpanel, alert.</li>
  <li>Live regions for dynamic updates (<code>aria-live="polite"</code> for toasts).</li>
  <li>Visible focus styles — never <code>outline: none</code> without replacement.</li>
  <li>Colour contrast ≥ 4.5:1 for body text.</li>
</ul>

<h3>Mobile / touch edge cases (web)</h3>
<ul>
  <li>Tap delay (300ms): use <code>touchAction: manipulation</code> or modern viewport meta.</li>
  <li>Swipe vs scroll: distinguish via <code>touch-action: pan-y</code> on horizontal carousels.</li>
  <li>Virtual keyboard reflow: input focus shifts viewport; use <code>scrollIntoView</code> + safe-area-inset.</li>
  <li>Hover doesn't exist — never hide functionality behind hover-only.</li>
</ul>

<h3>Performance edges</h3>
<ul>
  <li><strong>Long lists (&gt;200 items):</strong> virtualize.</li>
  <li><strong>Frequent renders:</strong> <code>React.memo</code> + <code>useCallback</code> + stable refs.</li>
  <li><strong>Large images:</strong> lazy-load, <code>loading="lazy"</code>, <code>srcset</code>.</li>
  <li><strong>Animations during scroll:</strong> use transforms, not <code>top</code>/<code>left</code>.</li>
  <li><strong>Heavy computations:</strong> <code>useMemo</code>; consider Web Workers for &gt;100ms tasks.</li>
</ul>

<h3>Storage edge cases</h3>
<ul>
  <li><code>localStorage.getItem</code> can throw in Safari private mode — wrap in try/catch.</li>
  <li><code>JSON.parse</code> on malformed data throws — try/catch + fallback.</li>
  <li>Quota exceeded (5–10MB) — handle <code>QuotaExceededError</code>.</li>
  <li>Multi-tab sync: <code>storage</code> event fires only on other tabs, not the one writing.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 10 most common machine-coding bugs</h3>
<ol>
  <li><strong>Missing cleanup in useEffect.</strong> Timer/listener/observer keeps running after unmount → memory leak + stale state warnings.</li>
  <li><strong>Stale closure in setInterval / setTimeout.</strong> Captured value never updates. Use functional <code>setState(s =&gt; ...)</code> or refs.</li>
  <li><strong>Array index as key in dynamic lists.</strong> Wrong items animate, wrong inputs keep focus when reordering.</li>
  <li><strong>Inline objects/functions as memo deps.</strong> <code>{ a: 1 }</code> is a new reference each render — defeats <code>React.memo</code>.</li>
  <li><strong>Forgetting to abort fetches.</strong> Race condition: stale response overwrites fresh.</li>
  <li><strong>Mutating state directly.</strong> <code>state.push(x)</code> won't trigger re-render. Use <code>[...state, x]</code>.</li>
  <li><strong>Setting state in render.</strong> Infinite loop. Wrap in effect or event handler.</li>
  <li><strong>Missing keys in fragments.</strong> Use <code>&lt;React.Fragment key=...&gt;</code>, not <code>&lt;&gt;...&lt;/&gt;</code>, when keying.</li>
  <li><strong>Prop drilling 5 levels.</strong> Lift state, use context, or compose with children.</li>
  <li><strong>One huge component.</strong> Split: data layer, presentation layer, composed by parent.</li>
</ol>

<h3>Anti-pattern: setting state from props</h3>
<pre><code class="language-javascript">// BAD — mirroring props in state
function Bad({ initial }) {
  const [value, setValue] = useState(initial);
  // value won't update if initial changes
}

// GOOD — use the prop directly, only set state for local edits
function Good({ initial }) {
  const [edited, setEdited] = useState(null);
  const value = edited ?? initial; // use prop unless user edited
}
</code></pre>

<h3>Anti-pattern: deriving stored state</h3>
<pre><code class="language-javascript">// BAD — fullName drifts out of sync with first/last
const [first, setFirst] = useState('');
const [last, setLast] = useState('');
const [fullName, setFullName] = useState('');
useEffect(() =&gt; setFullName(\`\${first} \${last}\`), [first, last]);

// GOOD — derive in render
const [first, setFirst] = useState('');
const [last, setLast] = useState('');
const fullName = \`\${first} \${last}\`;
</code></pre>

<h3>Anti-pattern: swallowing errors silently</h3>
<pre><code class="language-javascript">// BAD — user sees blank screen, no idea why
fetch(url).then(r =&gt; r.json()).then(setData).catch(() =&gt; {});

// GOOD — surface the error, give recovery
fetch(url).then(r =&gt; {
  if (!r.ok) throw new Error(\`HTTP \${r.status}\`);
  return r.json();
}).then(setData).catch(setError);
</code></pre>

<h3>Anti-pattern: hardcoded strings everywhere</h3>
<p>"Loading…", "No results", "Error" all inlined. The reusable component instinct: accept these as props with sensible defaults.</p>
<pre><code class="language-javascript">function List({
  items, loading, error,
  emptyText = 'No items',
  loadingText = 'Loading…',
  errorText = 'Something went wrong',
}) { /* ... */ }
</code></pre>

<h3>Anti-pattern: useEffect with no deps for "run once"</h3>
<pre><code class="language-javascript">// BAD if you reference props/state inside — captured stale forever
useEffect(() =&gt; { fetchData(query); }, []); // query is stale

// GOOD — list deps honestly
useEffect(() =&gt; { fetchData(query); }, [query]);
</code></pre>

<h3>Anti-pattern: blocking main thread for long lists</h3>
<pre><code class="language-javascript">// BAD — re-renders 10k items each keystroke
&lt;input value={query} onChange={e =&gt; setQuery(e.target.value)} /&gt;
{items.filter(i =&gt; i.label.includes(query)).map(...)} // 10k filter

// GOOD — debounce + memo + virtualize
const debounced = useDebounce(query, 200);
const filtered = useMemo(() =&gt; items.filter(...), [debounced]);
&lt;VirtualList items={filtered} /&gt;
</code></pre>

<h3>Anti-pattern: forgetting controlled = e.target.value</h3>
<p>Controlled inputs need <code>value</code> + <code>onChange</code>. Putting <code>value</code> alone makes them read-only and React will warn loudly.</p>

<h3>Anti-pattern: <code>JSON.parse</code> + <code>localStorage</code> without guard</h3>
<pre><code class="language-javascript">// BAD — crash on first run or after schema change
const initial = JSON.parse(localStorage.getItem('cart'));

// GOOD — try/catch + fallback
let initial = [];
try { initial = JSON.parse(localStorage.getItem('cart')) ?? []; }
catch { /* corrupt, ignore */ }
</code></pre>

<h3>Anti-pattern: scroll listener for infinite scroll</h3>
<pre><code class="language-javascript">// BAD — fires every pixel, perf killer
window.addEventListener('scroll', () =&gt; {
  if (window.scrollY + window.innerHeight &gt;= document.body.scrollHeight) loadMore();
});

// GOOD — IntersectionObserver, off main thread, declarative
const obs = new IntersectionObserver(entries =&gt; {
  if (entries[0].isIntersecting) loadMore();
});
obs.observe(sentinelEl);
</code></pre>

<h3>Anti-pattern: reaching for state library too early</h3>
<p>Using Redux for a 2-component widget is a red flag. The senior signal is restraint: <em>"Local state is enough; if this grew to 5+ consumers I'd lift to context."</em></p>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>The 60-minute round playbook</h3>
<table>
  <thead><tr><th>Phase</th><th>Time</th><th>Goal</th></tr></thead>
  <tbody>
    <tr><td>Clarify scope</td><td>0–3 min</td><td>Confirm features, devices, constraints. Name the pattern.</td></tr>
    <tr><td>Skeleton</td><td>3–10 min</td><td>Empty UI rendered. File structure. Types.</td></tr>
    <tr><td>Happy path</td><td>10–30 min</td><td>Golden flow works.</td></tr>
    <tr><td>Edge cases</td><td>30–45 min</td><td>Loading, error, empty, slow network.</td></tr>
    <tr><td>Polish + a11y</td><td>45–55 min</td><td>Keyboard, ARIA, focus.</td></tr>
    <tr><td>Walkthrough + closers</td><td>55–60 min</td><td>"If I had more time…"</td></tr>
  </tbody>
</table>

<h3>Clarifying questions to always ask</h3>
<ol>
  <li><em>"Is this a single component or a small app?"</em></li>
  <li><em>"Do I need to mock the API or call a real one?"</em></li>
  <li><em>"Is mobile in scope, or desktop only?"</em></li>
  <li><em>"How important is accessibility / keyboard support?"</em></li>
  <li><em>"Should I write tests, or focus on the build?"</em></li>
  <li><em>"Should I use a UI library or build raw?"</em></li>
</ol>
<p>Even if the answer is "use your judgement," the questions signal seniority.</p>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Keyword in prompt</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"search", "filter as you type"</td><td>debounce + abortable fetch</td></tr>
    <tr><td>"feed", "infinite", "load more"</td><td>IntersectionObserver + paginated state</td></tr>
    <tr><td>"thousands of items", "long list"</td><td>virtualization (windowing)</td></tr>
    <tr><td>"dialog", "popup", "overlay"</td><td>portal + focus trap + ESC</td></tr>
    <tr><td>"notification", "toast", "alert"</td><td>provider + queue + auto-dismiss</td></tr>
    <tr><td>"OTP", "PIN", "verification code"</td><td>refs array + auto-advance + paste</td></tr>
    <tr><td>"step 1 of 3", "wizard"</td><td>useReducer + step state + per-step validate</td></tr>
    <tr><td>"swipe", "carousel", "slider"</td><td>transform translateX + arrow keys + touch</td></tr>
    <tr><td>"drag", "reorder", "rearrange"</td><td>HTML5 DnD or pointer events + index swap</td></tr>
    <tr><td>"countdown", "stopwatch"</td><td>setInterval + Date.now() + cleanup</td></tr>
    <tr><td>"theme", "dark mode"</td><td>context + localStorage + CSS variables</td></tr>
  </tbody>
</table>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"I'm choosing a controlled input here because we validate live; uncontrolled would be cheaper if we only needed the value at submit."</em></li>
  <li><em>"I'll keep state local for now; if a sibling needs it, I'll lift to the parent."</em></li>
  <li><em>"Debounce of 300ms — typical UX target. If the API is fast we could go to 150."</em></li>
  <li><em>"IntersectionObserver beats scroll listeners — runs off the main thread and supports rootMargin lookahead."</em></li>
  <li><em>"For 200+ items I'd virtualize; below that the perf wins don't justify the complexity."</em></li>
  <li><em>"I'm keeping cleanup in this effect because the timer would leak across unmounts."</em></li>
</ul>

<h3>Demo script (always do this)</h3>
<ol>
  <li>Walk through golden path live: click, type, see result.</li>
  <li>Trigger empty state: clear the input.</li>
  <li>Trigger loading: throttle network or show.</li>
  <li>Trigger error: pass a failing fetcher.</li>
  <li>Demo keyboard: arrow keys, Enter, ESC, Tab.</li>
  <li>Demo edge: very long input, special chars, paste.</li>
</ol>

<h3>The "if I had more time" closers</h3>
<p>Always end with 3–5. These show you know what you skipped on purpose.</p>
<ul>
  <li><em>"Add unit tests — RTL for the keyboard nav, jest-dom for ARIA."</em></li>
  <li><em>"Add error boundaries to recover from render errors."</em></li>
  <li><em>"Memoize the row component and add <code>useCallback</code> to the parent's onSelect."</em></li>
  <li><em>"Virtualize once the list exceeds 200 items."</em></li>
  <li><em>"Add Skeleton placeholders during loading instead of a spinner."</em></li>
  <li><em>"Theme via CSS custom properties + a context provider."</em></li>
  <li><em>"Persist drafts to localStorage with a debounced write."</em></li>
  <li><em>"Add retry with exponential backoff on network errors."</em></li>
  <li><em>"Add screen-reader live region for status updates."</em></li>
  <li><em>"Add E2E tests with Playwright for the golden flow."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour they're tracking</th></tr></thead>
  <tbody>
    <tr><td>Pattern recognition</td><td>Did they name the pattern in the first minute?</td></tr>
    <tr><td>Time management</td><td>Did they get to a runnable state by minute 10?</td></tr>
    <tr><td>State design</td><td>Is state colocated correctly? Anything mirrored or stored derivable?</td></tr>
    <tr><td>Cleanup hygiene</td><td>Do effects clean up? Are listeners removed?</td></tr>
    <tr><td>Edge case awareness</td><td>Did they demo loading / error / empty?</td></tr>
    <tr><td>Accessibility instincts</td><td>Did they reach for semantic HTML and ARIA without prompting?</td></tr>
    <tr><td>Communication</td><td>Were tradeoffs spoken, not silent?</td></tr>
    <tr><td>Restraint</td><td>Did they reach for the right tool, not the biggest one?</td></tr>
    <tr><td>Closers</td><td>Did they name what they'd improve given more time?</td></tr>
  </tbody>
</table>

<h3>Common red flags to avoid</h3>
<ul>
  <li>Silent typing for 5+ minutes.</li>
  <li>Building UI before wiring state.</li>
  <li>Forgetting to handle the loading state at all.</li>
  <li>Treating the API as guaranteed-success (no error path).</li>
  <li>Skipping cleanup; using <code>setInterval</code> with no clear.</li>
  <li>Reaching for Redux / global state for 2 components.</li>
  <li>Not running the code (claiming it works without verifying).</li>
  <li>Defensive over-engineering — abstractions for one caller.</li>
</ul>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN-specific machine coding lives in the <code>rn-machine-coding</code> topic — patterns there map to FlatList instead of virtualized list, KeyboardAvoidingView for forms, MMKV for storage, Reanimated for animations.</li>
  <li>The <em>patterns</em> stay the same: debounce, abort, infinite scroll, OTP, multi-step form. Only the primitive changes.</li>
  <li>If the prompt is web but interviewer is from a mobile team, mention RN equivalents naturally: <em>"On RN this would be FlatList with onEndReached."</em></li>
  <li>Touch interactions: tap not click, long-press, swipe, pull-to-refresh, safe-area insets.</li>
</ul>

<h3>Deep questions interviewers ask after the build</h3>
<ul>
  <li><em>"What would you change to support 1M items?"</em> — virtualize, server-side pagination, search index.</li>
  <li><em>"How would you test this?"</em> — RTL for behaviour, mock the fetcher, snapshot risky.</li>
  <li><em>"What's the worst race condition here?"</em> — name one and how you'd fix it.</li>
  <li><em>"What if the API is offline?"</em> — cache layer, optimistic UI, retry.</li>
  <li><em>"How would you make this re-usable?"</em> — accept fetcher / renderer as props; minimal config surface.</li>
  <li><em>"What about a11y?"</em> — semantic HTML, ARIA, keyboard, focus management, live regions.</li>
</ul>

<h3>"What I'd do day one prepping for machine-coding"</h3>
<ul>
  <li>Memorise the 6 custom hooks (useDebounce, useThrottle, useFetch, useOnClickOutside, useLocalStorage, usePrevious).</li>
  <li>Build each of the 15 patterns once on paper, twice on screen.</li>
  <li>Practice the 5-minute skeleton loop until it's automatic.</li>
  <li>Drill the demo script: empty, loading, error, golden, edge.</li>
  <li>Memorise 5 tradeoff narrations for live use.</li>
  <li>Have 5 "if I had more time" closers ready.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"I'd build a personal cheat-sheet of the 15 patterns with one-line implementations."</li>
  <li>"I'd record myself doing a 60-min round and watch for filler / silent gaps."</li>
  <li>"I'd practice the same prompt three times, getting faster each pass."</li>
  <li>"I'd pair with someone and trade prompts."</li>
  <li>"I'd memorise 3 minimal CSS snippets (modal backdrop, list, form) so styling never costs &gt; 30s."</li>
</ul>
`
    }
  ]
});
