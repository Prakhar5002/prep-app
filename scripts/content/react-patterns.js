window.PREP_SITE.registerTopic({
  id: 'react-patterns',
  module: 'React Deep',
  title: 'Advanced Patterns',
  estimatedReadTime: '30 min',
  tags: ['react', 'patterns', 'compound-components', 'render-props', 'hoc', 'controlled', 'uncontrolled', 'headless'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>Advanced React patterns are reusable techniques for building flexible, composable components. Each solves a specific problem:</p>
<ul>
  <li><strong>Compound components</strong> — related pieces that share state via context (<code>&lt;Tabs&gt;&lt;Tab&gt;</code>). User composes children; parent orchestrates.</li>
  <li><strong>Render props / function-as-child</strong> — a component whose output is determined by a function passed in. Pre-hooks way to share stateful logic.</li>
  <li><strong>Higher-Order Components (HOCs)</strong> — a function that wraps a component and returns a new one. Decorator pattern. Largely replaced by hooks.</li>
  <li><strong>Custom hooks</strong> — the modern way to share stateful logic. Simple, composable, no wrapper hell.</li>
  <li><strong>Controlled vs uncontrolled</strong> — who owns the value: parent (controlled) or the component itself (uncontrolled). Each has tradeoffs.</li>
  <li><strong>Headless components</strong> — logic with zero styling, exposed via hooks or render props. Libraries: Radix, Headless UI, React Aria.</li>
  <li><strong>State reducer pattern</strong> — caller can intercept and override state transitions. Gives consumers fine control without forking.</li>
  <li><strong>Slot pattern</strong> — named regions parents fill with arbitrary children (like <code>children</code> but multiple). Common in layout libraries.</li>
  <li><strong>Forward refs + imperative handles</strong> — exposing DOM or methods from a composite component.</li>
  <li><strong>Error boundaries</strong> — catch render/lifecycle errors in a subtree.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Patterns are tools for composition. Start simple (props + children). Reach for compound components when related pieces share state. Reach for custom hooks when behavior is reusable across unrelated UIs. Avoid HOCs unless you have a specific reason — hooks almost always beat them.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why patterns matter</h3>
<p>Well-chosen patterns separate "reusable across 50 places" components from "works for this one use case." They also reveal component APIs — a <code>Select</code> built with compound components reads like HTML (<code>&lt;Select&gt;&lt;Option/&gt;&lt;/Select&gt;</code>); the same thing built with a <code>options</code> prop forces callers to pack their data into a specific shape.</p>

<h3>The "composition over configuration" principle</h3>
<p>Two ways to expose flexibility:</p>
<ul>
  <li><strong>Configuration:</strong> a single component with many props (<code>&lt;Dialog title="x" body="y" footer={[...]} showClose /&gt;</code>). Simple but inflexible — every new variation adds a prop.</li>
  <li><strong>Composition:</strong> a container + slots/children (<code>&lt;Dialog&gt;&lt;Header/&gt;&lt;Body/&gt;&lt;Footer/&gt;&lt;/Dialog&gt;</code>). Callers arrange the pieces they need.</li>
</ul>
<p>Composition scales better: new usages don't need the component to grow. Libraries like Radix prove the extreme of this — their <code>Tabs</code> is 9 sub-components that you assemble.</p>

<h3>Why compound components exist</h3>
<p>Consider a <code>Tabs</code> widget. The <code>Tab</code> and <code>TabPanel</code> need to know which tab is active. You could pass <code>activeIndex</code> as a prop everywhere, but consumers would have to manually wire it. Compound components solve this: the parent (<code>Tabs</code>) puts state into a context; children (<code>Tab</code>, <code>TabPanel</code>) read it implicitly. Callers just compose.</p>

<h3>Why hooks replaced HOCs and render props</h3>
<p>Before hooks, sharing stateful logic required either:</p>
<ul>
  <li><strong>HOCs:</strong> <code>withUser(Comp)</code>. Problem: wrapper hell (deeply nested trees), named clashes, hard to type with generics, prop collisions.</li>
  <li><strong>Render props:</strong> <code>&lt;UserLoader&gt;{user =&gt; ...}&lt;/UserLoader&gt;</code>. Problem: deeply nested JSX, verbose, re-renders the whole tree on any change.</li>
</ul>
<p>Hooks: <code>const user = useUser();</code>. No wrapping, no tree depth, composable, typed.</p>

<h3>Controlled vs uncontrolled — who owns state?</h3>
<p>A form input's value could be:</p>
<ul>
  <li><strong>Controlled:</strong> parent holds the value via <code>useState</code> and passes <code>value</code>/<code>onChange</code>. Parent is the source of truth.</li>
  <li><strong>Uncontrolled:</strong> the DOM holds the value; parent reads it via ref or on submit. The component itself is a self-contained box.</li>
</ul>
<p>Controlled is more flexible (parent can override, validate, debounce). Uncontrolled is cheaper (no re-render per keystroke) and simpler for self-contained widgets. Form libraries like React Hook Form use uncontrolled inputs by default for performance.</p>

<h3>Why headless components</h3>
<p>Most UI logic — keyboard navigation in a menu, focus management in a dialog, accessibility attributes, scroll locking — is universal. Styling, however, is per-app. Headless libraries (Radix, Headless UI, React Aria) ship the logic and accessibility; you ship the CSS. Separation of concerns: your design system stays yours; the hard bits are handled.</p>

<h3>Why state reducer?</h3>
<p>A Downshift-style combobox has opinions about "when input is focused, open the menu." Sometimes that's wrong for a specific app. The state reducer pattern lets the caller intercept any state transition and modify it, giving 99% of built-in behavior and 1% of custom escape hatches without forking the component.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "children as the API" picture</h3>
<pre><code class="language-tsx">// Instead of this:
&lt;Menu items={[
  { label: 'Cut', icon: 'scissors', onClick: cut },
  { label: 'Copy', icon: 'copy', onClick: copy },
]} /&gt;

// Do this:
&lt;Menu&gt;
  &lt;MenuItem onSelect={cut}&gt;&lt;Icon name="scissors"/&gt;Cut&lt;/MenuItem&gt;
  &lt;MenuItem onSelect={copy}&gt;&lt;Icon name="copy"/&gt;Copy&lt;/MenuItem&gt;
&lt;/Menu&gt;</code></pre>
<p>The second reads like HTML and extends naturally to dividers, submenus, arbitrary content. The first explodes into a mega-prop the moment you need a submenu.</p>

<h3>The "shared state via context" picture</h3>
<div class="diagram">
<pre>
&lt;Tabs value={active} onChange={setActive}&gt;
   │ provides context { active, setActive }
   ├── &lt;TabList&gt;
   │      └── &lt;Tab value="home"/&gt;   reads context: isActive = active === 'home'
   │      └── &lt;Tab value="about"/&gt;
   └── &lt;TabPanels&gt;
          └── &lt;TabPanel value="home"/&gt; reads context: visible = active === 'home'
</pre>
</div>

<h3>The "controlled/uncontrolled dual API" picture</h3>
<pre><code class="language-tsx">// Controlled: parent provides value+onChange
&lt;Input value={v} onChange={setV} /&gt;
// Uncontrolled: component owns state; parent reads via ref or defaults
&lt;Input defaultValue="hi" ref={inputRef} /&gt;</code></pre>
<p>A well-designed input supports both. Pattern: inside the component, if <code>value</code> is provided (not undefined), treat it as controlled; otherwise fall back to internal state.</p>

<h3>The "headless" picture</h3>
<pre><code class="language-tsx">// Headless hook — no UI
const { getRootProps, getToggleProps, getMenuProps, getItemProps, isOpen } =
  useDropdown({ items });

return (
  &lt;div {...getRootProps()}&gt;
    &lt;button {...getToggleProps()}&gt;{isOpen ? 'Close' : 'Open'}&lt;/button&gt;
    {isOpen &amp;&amp; (
      &lt;ul {...getMenuProps()}&gt;
        {items.map((it, i) =&gt; &lt;li key={it.id} {...getItemProps({ item: it, index: i })}&gt;{it.label}&lt;/li&gt;)}
      &lt;/ul&gt;
    )}
  &lt;/div&gt;
);</code></pre>
<p>Your JSX and CSS, their keyboard nav / a11y / focus management.</p>

<h3>The "HOC vs hook" picture</h3>
<div class="diagram">
<pre>
  HOC:   withAuth(withTheme(withFeatureFlag(Comp)))
          └─ 3 wrapper fibers in the tree, 3 prop passes

  Hook:  const auth = useAuth();
         const theme = useTheme();
         const flag  = useFeatureFlag();
         └─ 3 hook calls, 0 extra fibers
</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Patterns are framework-specific best practices to memorize." They're vocabulary for communicating and composing. Use the one that minimizes the API surface for the problem. Don't apply a pattern to a problem that doesn't have it.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Compound components via context</h3>
<pre><code class="language-tsx">const TabsCtx = createContext&lt;{active: string; setActive: (v:string)=&gt;void} | null&gt;(null);
function useTabs() {
  const ctx = useContext(TabsCtx);
  if (!ctx) throw new Error('Tabs components must be inside &lt;Tabs&gt;');
  return ctx;
}

export function Tabs({ defaultValue, children }: { defaultValue: string; children: React.ReactNode }) {
  const [active, setActive] = useState(defaultValue);
  const value = useMemo(() =&gt; ({ active, setActive }), [active]);
  return &lt;TabsCtx.Provider value={value}&gt;&lt;div role="tablist"&gt;{children}&lt;/div&gt;&lt;/TabsCtx.Provider&gt;;
}

export function Tab({ value, children }: { value: string; children: React.ReactNode }) {
  const { active, setActive } = useTabs();
  return &lt;button role="tab" aria-selected={active === value} onClick={() =&gt; setActive(value)}&gt;{children}&lt;/button&gt;;
}

export function Panel({ value, children }: { value: string; children: React.ReactNode }) {
  const { active } = useTabs();
  if (active !== value) return null;
  return &lt;div role="tabpanel"&gt;{children}&lt;/div&gt;;
}

// Usage:
&lt;Tabs defaultValue="home"&gt;
  &lt;Tab value="home"&gt;Home&lt;/Tab&gt;
  &lt;Tab value="about"&gt;About&lt;/Tab&gt;
  &lt;Panel value="home"&gt;Home content&lt;/Panel&gt;
  &lt;Panel value="about"&gt;About content&lt;/Panel&gt;
&lt;/Tabs&gt;</code></pre>

<h3>Render props</h3>
<pre><code class="language-tsx">type MouseProps = { children: (pos: { x: number; y: number }) =&gt; React.ReactNode };
function Mouse({ children }: MouseProps) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() =&gt; {
    const onMove = (e: MouseEvent) =&gt; setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove);
    return () =&gt; window.removeEventListener('mousemove', onMove);
  }, []);
  return children(pos);
}
// Usage:
&lt;Mouse&gt;{({ x, y }) =&gt; &lt;p&gt;{x},{y}&lt;/p&gt;}&lt;/Mouse&gt;
// Hook equivalent (preferred today): const pos = useMousePosition();</code></pre>

<h3>HOC</h3>
<pre><code class="language-tsx">function withAuth&lt;P extends object&gt;(Component: React.ComponentType&lt;P &amp; { user: User }&gt;) {
  return function WithAuth(props: P) {
    const user = useAuth(); // or some context read
    if (!user) return &lt;Redirect to="/login"/&gt;;
    return &lt;Component {...props} user={user} /&gt;;
  };
}
// Usage: const ProtectedProfile = withAuth(Profile);</code></pre>
<p>HOCs are valid for route guards, feature flags, legacy codebases. For new code, usually a hook + wrapper component is clearer.</p>

<h3>Controlled / uncontrolled dual pattern</h3>
<pre><code class="language-tsx">type InputProps = {
  value?: string;                           // controlled if provided
  defaultValue?: string;                    // uncontrolled seed
  onChange?: (v: string) =&gt; void;
};
function Input({ value, defaultValue = '', onChange }: InputProps) {
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;
  return &lt;input value={current} onChange={(e) =&gt; {
    if (!isControlled) setInternal(e.target.value);
    onChange?.(e.target.value);
  }} /&gt;;
}</code></pre>

<h3>Slot pattern</h3>
<pre><code class="language-tsx">function Layout({ header, sidebar, children, footer }: {
  header: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    &lt;div className="layout"&gt;
      &lt;header&gt;{header}&lt;/header&gt;
      {sidebar &amp;&amp; &lt;aside&gt;{sidebar}&lt;/aside&gt;}
      &lt;main&gt;{children}&lt;/main&gt;
      {footer &amp;&amp; &lt;footer&gt;{footer}&lt;/footer&gt;}
    &lt;/div&gt;
  );
}
&lt;Layout header={&lt;Nav/&gt;} sidebar={&lt;Menu/&gt;} footer={&lt;Copyright/&gt;}&gt;
  &lt;Article/&gt;
&lt;/Layout&gt;</code></pre>

<h3>forwardRef + useImperativeHandle</h3>
<pre><code class="language-tsx">type TextareaHandle = { clear: () =&gt; void; focus: () =&gt; void };
const Textarea = forwardRef&lt;TextareaHandle, { placeholder?: string }&gt;(
  function Textarea({ placeholder }, ref) {
    const el = useRef&lt;HTMLTextAreaElement&gt;(null);
    useImperativeHandle(ref, () =&gt; ({
      clear: () =&gt; { if (el.current) el.current.value = ''; },
      focus: () =&gt; el.current?.focus(),
    }), []);
    return &lt;textarea ref={el} placeholder={placeholder} /&gt;;
  }
);
// Parent:
const t = useRef&lt;TextareaHandle&gt;(null);
&lt;button onClick={() =&gt; t.current?.clear()}&gt;Clear&lt;/button&gt;;</code></pre>

<h3>Error Boundary (class-based)</h3>
<pre><code class="language-tsx">class ErrorBoundary extends React.Component&lt;
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
&gt; {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: Error, info: React.ErrorInfo) {
    logToService(err, info);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}</code></pre>
<p>Error boundaries must be class components (as of React 19 — hooks version under discussion). They catch errors from: render, lifecycle, constructors of descendants. They do NOT catch: event handlers, async code, server-side rendering, errors in the boundary itself.</p>

<h3>State reducer pattern</h3>
<pre><code class="language-tsx">type Action = { type: 'toggle' } | { type: 'open' } | { type: 'close' };
type State = { open: boolean };

function defaultReducer(s: State, a: Action): State {
  switch (a.type) {
    case 'toggle': return { open: !s.open };
    case 'open':   return { open: true };
    case 'close':  return { open: false };
  }
}

function useDisclosure(
  initial = false,
  reducer: typeof defaultReducer = defaultReducer
) {
  const [state, dispatch] = useReducer(reducer, { open: initial });
  return { ...state, toggle: () =&gt; dispatch({ type: 'toggle' }),
           open: () =&gt; dispatch({ type: 'open' }),
           close: () =&gt; dispatch({ type: 'close' }) };
}

// Caller can intercept:
const myReducer = (s: State, a: Action): State =&gt; {
  if (a.type === 'close' &amp;&amp; hasUnsavedChanges) return s; // block close
  return defaultReducer(s, a);
};
const d = useDisclosure(false, myReducer);</code></pre>

<h3>Lazy + Suspense (code splitting)</h3>
<pre><code class="language-tsx">const Settings = lazy(() =&gt; import('./Settings'));
&lt;Suspense fallback={&lt;Spinner/&gt;}&gt;
  &lt;Settings/&gt;
&lt;/Suspense&gt;</code></pre>

<h3>Portals</h3>
<pre><code class="language-tsx">function Modal({ children }: { children: React.ReactNode }) {
  return createPortal(
    &lt;div role="dialog"&gt;{children}&lt;/div&gt;,
    document.getElementById('modal-root')!
  );
}
// DOM location is the portal target; React tree relationships (context, events) still bubble through the React tree.</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — compound Accordion</h3>
<pre><code class="language-tsx">const AccordionCtx = createContext&lt;string | null&gt;(null);
function Accordion({ defaultOpen, children }) {
  const [open, setOpen] = useState&lt;string | null&gt;(defaultOpen ?? null);
  return &lt;AccordionCtx.Provider value={{ open, setOpen }}&gt;{children}&lt;/AccordionCtx.Provider&gt;;
}
function Item({ id, children }) {
  const { open, setOpen } = useContext(AccordionCtx)!;
  const isOpen = open === id;
  return (
    &lt;div&gt;
      &lt;button onClick={() =&gt; setOpen(isOpen ? null : id)} aria-expanded={isOpen}&gt;
        {children[0]}
      &lt;/button&gt;
      {isOpen &amp;&amp; &lt;div&gt;{children[1]}&lt;/div&gt;}
    &lt;/div&gt;
  );
}
&lt;Accordion defaultOpen="a"&gt;
  &lt;Item id="a"&gt;&lt;span&gt;Section A&lt;/span&gt;&lt;p&gt;...&lt;/p&gt;&lt;/Item&gt;
  &lt;Item id="b"&gt;&lt;span&gt;Section B&lt;/span&gt;&lt;p&gt;...&lt;/p&gt;&lt;/Item&gt;
&lt;/Accordion&gt;</code></pre>

<h3>Example 2 — render prop for mouse tracking</h3>
<pre><code class="language-tsx">function Mouse({ children }: { children: (p: { x: number; y: number }) =&gt; React.ReactNode }) {
  const [p, setP] = useState({ x: 0, y: 0 });
  useEffect(() =&gt; {
    const on = (e: MouseEvent) =&gt; setP({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', on);
    return () =&gt; window.removeEventListener('mousemove', on);
  }, []);
  return &lt;&gt;{children(p)}&lt;/&gt;;
}
&lt;Mouse&gt;{({ x, y }) =&gt; &lt;span&gt;{x},{y}&lt;/span&gt;}&lt;/Mouse&gt;</code></pre>

<h3>Example 3 — equivalent custom hook</h3>
<pre><code class="language-tsx">function useMouse() {
  const [p, setP] = useState({ x: 0, y: 0 });
  useEffect(() =&gt; {
    const on = (e: MouseEvent) =&gt; setP({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', on);
    return () =&gt; window.removeEventListener('mousemove', on);
  }, []);
  return p;
}
// Usage:
const { x, y } = useMouse();</code></pre>

<h3>Example 4 — HOC for auth</h3>
<pre><code class="language-tsx">function withAuth&lt;P extends object&gt;(C: React.ComponentType&lt;P&gt;) {
  return function Guarded(props: P) {
    const user = useContext(AuthCtx);
    if (!user) return &lt;Navigate to="/login"/&gt;;
    return &lt;C {...props} /&gt;;
  };
}
const Private = withAuth(Dashboard);</code></pre>

<h3>Example 5 — controlled + uncontrolled input</h3>
<pre><code class="language-tsx">function Input({ value, defaultValue = '', onChange }: {
  value?: string;
  defaultValue?: string;
  onChange?: (v: string) =&gt; void;
}) {
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = value !== undefined;
  const v = isControlled ? value : internal;
  return &lt;input value={v} onChange={(e) =&gt; {
    if (!isControlled) setInternal(e.target.value);
    onChange?.(e.target.value);
  }} /&gt;;
}</code></pre>

<h3>Example 6 — slot layout</h3>
<pre><code class="language-tsx">function Page({ nav, side, children }: { nav: React.ReactNode; side?: React.ReactNode; children: React.ReactNode }) {
  return (
    &lt;div className="page"&gt;
      &lt;header&gt;{nav}&lt;/header&gt;
      &lt;div className="body"&gt;
        {side &amp;&amp; &lt;aside&gt;{side}&lt;/aside&gt;}
        &lt;main&gt;{children}&lt;/main&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  );
}
&lt;Page nav={&lt;Nav/&gt;} side={&lt;Filters/&gt;}&gt;&lt;Results/&gt;&lt;/Page&gt;</code></pre>

<h3>Example 7 — imperative handle</h3>
<pre><code class="language-tsx">const Autocomplete = forwardRef&lt;{ reset: () =&gt; void }, {}&gt;((_, ref) =&gt; {
  const [q, setQ] = useState('');
  useImperativeHandle(ref, () =&gt; ({ reset: () =&gt; setQ('') }), []);
  return &lt;input value={q} onChange={(e) =&gt; setQ(e.target.value)} /&gt;;
});
const a = useRef&lt;{ reset: () =&gt; void }&gt;(null);
&lt;button onClick={() =&gt; a.current?.reset()}&gt;Clear&lt;/button&gt;</code></pre>

<h3>Example 8 — error boundary</h3>
<pre><code class="language-tsx">function App() {
  return (
    &lt;ErrorBoundary fallback={&lt;p&gt;Something went wrong. &lt;a href=""&gt;Retry&lt;/a&gt;&lt;/p&gt;}&gt;
      &lt;Router&gt;&lt;Routes/&gt;&lt;/Router&gt;
    &lt;/ErrorBoundary&gt;
  );
}</code></pre>

<h3>Example 9 — state reducer</h3>
<pre><code class="language-tsx">function useToggle(initial = false, reducer = (s, a) =&gt; a.type === 'toggle' ? !s : s) {
  const [on, dispatch] = useReducer(reducer, initial);
  return [on, () =&gt; dispatch({ type: 'toggle' })];
}
// Caller intercepts:
const myR = (s, a) =&gt; a.type === 'toggle' &amp;&amp; s ? s : !s; // prevent toggling off
const [on, toggle] = useToggle(false, myR);</code></pre>

<h3>Example 10 — headless dropdown via hook</h3>
<pre><code class="language-tsx">function useDropdown(items: string[]) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const toggleRef = useRef&lt;HTMLButtonElement&gt;(null);
  const menuRef = useRef&lt;HTMLUListElement&gt;(null);
  const onKeyDown = (e: React.KeyboardEvent) =&gt; {
    if (e.key === 'ArrowDown') setActive(i =&gt; Math.min(i + 1, items.length - 1));
    if (e.key === 'ArrowUp') setActive(i =&gt; Math.max(i - 1, 0));
    if (e.key === 'Escape') setOpen(false);
  };
  return {
    getToggleProps: () =&gt; ({ ref: toggleRef, onClick: () =&gt; setOpen(o =&gt; !o) }),
    getMenuProps: () =&gt; ({ ref: menuRef, role: 'listbox', onKeyDown }),
    getItemProps: (i: number) =&gt; ({ role: 'option', 'aria-selected': i === active, onMouseEnter: () =&gt; setActive(i) }),
    open, active,
  };
}</code></pre>

<h3>Example 11 — provider + hook pair</h3>
<pre><code class="language-tsx">const AuthCtx = createContext&lt;{ user: User | null; login: (u: User) =&gt; void; logout: () =&gt; void } | null&gt;(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState&lt;User | null&gt;(null);
  const value = useMemo(() =&gt; ({ user, login: setUser, logout: () =&gt; setUser(null) }), [user]);
  return &lt;AuthCtx.Provider value={value}&gt;{children}&lt;/AuthCtx.Provider&gt;;
}
export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth inside AuthProvider');
  return ctx;
}</code></pre>

<h3>Example 12 — portal modal</h3>
<pre><code class="language-tsx">function Modal({ children, onClose }: { children: React.ReactNode; onClose: () =&gt; void }) {
  const [el] = useState(() =&gt; document.createElement('div'));
  useEffect(() =&gt; {
    document.body.appendChild(el);
    return () =&gt; { document.body.removeChild(el); };
  }, [el]);
  return createPortal(
    &lt;div role="dialog" onClick={onClose}&gt;{children}&lt;/div&gt;,
    el
  );
}</code></pre>

<h3>Example 13 — event callbacks via props (inversion of control)</h3>
<pre><code class="language-tsx">function List({ items, onItemClick, renderItem }: {
  items: Item[];
  onItemClick?: (item: Item) =&gt; void;
  renderItem?: (item: Item) =&gt; React.ReactNode;
}) {
  return items.map((it) =&gt; (
    &lt;li key={it.id} onClick={() =&gt; onItemClick?.(it)}&gt;
      {renderItem ? renderItem(it) : it.title}
    &lt;/li&gt;
  ));
}</code></pre>

<h3>Example 14 — discriminated union for dual API</h3>
<pre><code class="language-tsx">type Props = { as: 'link', href: string } | { as: 'button', onClick: () =&gt; void };
function Clickable(p: Props) {
  if (p.as === 'link') return &lt;a href={p.href}&gt;...&lt;/a&gt;;
  return &lt;button onClick={p.onClick}&gt;...&lt;/button&gt;;
}</code></pre>

<h3>Example 15 — children as function (deprecated but illustrative)</h3>
<pre><code class="language-tsx">function Data&lt;T,&gt;({ url, children }: { url: string; children: (d: T | null, err: Error | null) =&gt; React.ReactNode }) {
  const [state, setState] = useState&lt;{ d: T | null; err: Error | null }&gt;({ d: null, err: null });
  useEffect(() =&gt; {
    fetch(url).then(r =&gt; r.json()).then(d =&gt; setState({ d, err: null })).catch(err =&gt; setState({ d: null, err }));
  }, [url]);
  return &lt;&gt;{children(state.d, state.err)}&lt;/&gt;;
}
// Better today: custom hook.</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Compound components with non-child elements</h3>
<p>A <code>&lt;Tabs&gt;</code> component that walks <code>children</code> to find <code>&lt;Tab&gt;</code> elements breaks if someone wraps <code>&lt;Tab&gt;</code> in a fragment or a HOC. Prefer context-based compound components (children read context, parent doesn't inspect children).</p>

<h3>2. Re-render cost of context in compound components</h3>
<p>Every state change in the parent re-renders all compound children. For tab switching with many tabs and panels, memoize panels or render only the active one.</p>

<h3>3. Controlled/uncontrolled switching warning</h3>
<p>If a component's <code>value</code> prop starts as <code>undefined</code> and then becomes a string, React warns: "A component is changing an uncontrolled input to be controlled." Always: either pass <code>value</code> from first render, or never.</p>

<h3>4. Error boundaries don't catch event-handler errors</h3>
<pre><code class="language-tsx">&lt;button onClick={() =&gt; { throw new Error('x'); }}&gt;...&lt;/button&gt;</code></pre>
<p>The error escapes to the global handler. Wrap handlers in try/catch if recovery is needed.</p>

<h3>5. Async errors in effects not caught</h3>
<pre><code class="language-tsx">useEffect(() =&gt; {
  fetch(url).then(() =&gt; { throw new Error('x'); });
}, []);</code></pre>
<p>Unhandled promise rejection — error boundary doesn't see it. Use <code>.catch</code> and setState to surface it in render, which the boundary then catches.</p>

<h3>6. Render prop + memoization conflict</h3>
<pre><code class="language-tsx">&lt;Mouse&gt;{({x, y}) =&gt; &lt;Expensive x={x} y={y}/&gt;}&lt;/Mouse&gt;</code></pre>
<p>New function every Mouse render → Expensive's props (children function) differ → can't bail out. Hooks avoid this entirely.</p>

<h3>7. forwardRef with generics</h3>
<pre><code class="language-tsx">// forwardRef erases the generic
const List = forwardRef&lt;HTMLUListElement, { items: T[] }&gt;(({ items }, ref) =&gt; ...);
// T is not inferable. Workaround: cast, or use a non-forwardRef component that accepts ref as prop.</code></pre>

<h3>8. HOC display name</h3>
<pre><code class="language-tsx">function withX&lt;P&gt;(C: React.ComponentType&lt;P&gt;) {
  function WithX(props: P) { ... }
  WithX.displayName = \`withX(\${C.displayName ?? C.name})\`;
  return WithX;
}
// Important for DevTools readability.</code></pre>

<h3>9. Portal + context</h3>
<p>Portal children still inherit context from the React tree, NOT from the DOM parent. If a modal needs a different theme, wrap the portal content in its own provider.</p>

<h3>10. Portals and event bubbling</h3>
<p>Events bubble through the React tree, not the DOM tree. Clicking inside a portal raises events on ancestors in the React tree (where <code>createPortal</code> was called), not the portal DOM target's ancestors.</p>

<h3>11. useImperativeHandle with missing deps</h3>
<pre><code class="language-tsx">useImperativeHandle(ref, () =&gt; ({ latest: value }), []);
// Closure captures initial value; ref.current.latest stays stale.
// Fix deps:
useImperativeHandle(ref, () =&gt; ({ latest: value }), [value]);</code></pre>

<h3>12. React.Children utilities are mostly legacy</h3>
<p>Avoid <code>React.Children.map</code>, <code>Children.toArray</code> for new code. They force children inspection, which breaks composition. Prefer context for implicit coordination.</p>

<h3>13. cloneElement's fragility</h3>
<pre><code class="language-tsx">React.cloneElement(child, { onClick: handler }); // overwrites any existing onClick</code></pre>
<p>Hard to debug when multiple layers clone. Most cases are better modeled with render props or context.</p>

<h3>14. Mixing controlled/uncontrolled in form libraries</h3>
<p>React Hook Form uses uncontrolled by default; Formik uses controlled. Mixing components of both types requires bridging with <code>Controller</code> in RHF.</p>

<h3>15. Layout shifts from slot changes</h3>
<p>A slot that optionally renders breaks layout on appearance. Reserve space (<code>min-height</code>) or animate transitions.</p>

<h3>16. Uncontrolled input with defaultValue that changes</h3>
<pre><code class="language-tsx">&lt;input defaultValue={user.name} /&gt;</code></pre>
<p><code>defaultValue</code> seeds only at mount. If <code>user</code> changes, the input doesn't update. Either switch to controlled, or <code>key</code> the input on user id to remount.</p>

<h3>17. HOC prop collision</h3>
<p><code>withAuth</code> passes a <code>user</code> prop; if the wrapped component also expects its own <code>user</code> prop from parent, they collide. Forces rename or careful prop typing.</p>

<h3>18. Compound component consumer mistake</h3>
<pre><code class="language-tsx">&lt;Tab value="home"&gt;...&lt;/Tab&gt; // outside Tabs — throws from useTabs</code></pre>
<p>Custom hook inside each piece should throw a helpful error: "Tab must be used inside Tabs."</p>

<h3>19. Testing render props</h3>
<p>Render prop components can be tricky to test because behavior is determined by the caller's fn. Test the observable outcome, not the inner function calls.</p>

<h3>20. Pattern overuse</h3>
<p>Compound component with 8 sub-components for a feature that's used once. Render prop for a value that could be a hook call. Etc. Patterns have costs — API surface, learning curve. Use when you have a reuse concern.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — compound component inspecting children</h3>
<pre><code class="language-tsx">React.Children.forEach(children, (c: any) =&gt; {
  if (c.type === Tab) { /* special logic */ }
});</code></pre>
<p>Breaks if children are wrapped (fragment, HOC, memo). Prefer context.</p>

<h3>Anti-pattern 2 — HOC around every component</h3>
<p>"Wrapper hell" was the exact problem hooks solved. Migrate to hooks for new code; leave HOCs for true decorator cases (route guards, analytics auto-tracking).</p>

<h3>Anti-pattern 3 — render prop that could be a hook</h3>
<pre><code class="language-tsx">&lt;Mouse&gt;{({x,y}) =&gt; &lt;Inner x={x} y={y}/&gt;}&lt;/Mouse&gt;
// vs
const {x,y} = useMouse();
&lt;Inner x={x} y={y}/&gt;</code></pre>
<p>Hook is simpler, cheaper (no extra fiber), easier to test.</p>

<h3>Anti-pattern 4 — prop drilling instead of a clean pattern</h3>
<pre><code class="language-tsx">&lt;Tabs active={i} setActive={setI}&gt;&lt;TabList active={i} setActive={setI}&gt;
  &lt;Tab index={0} active={i} setActive={setI}/&gt;...</code></pre>
<p>Compound components with context reduce this to: <code>&lt;Tabs defaultValue="a"&gt;&lt;Tab value="a"/&gt;&lt;/Tabs&gt;</code>.</p>

<h3>Anti-pattern 5 — always controlled</h3>
<p>Every input in every form demands <code>value</code>+<code>onChange</code>+state, causing re-renders per keystroke. For forms with many fields, uncontrolled (via React Hook Form or plain refs) is much cheaper.</p>

<h3>Anti-pattern 6 — forwardRef when a plain prop works</h3>
<pre><code class="language-tsx">// Overkill for simple cases
forwardRef((props, ref) =&gt; &lt;input ref={ref}/&gt;);
// If you control the component, just accept inputRef as a prop.</code></pre>
<p>forwardRef is for reusable library components. App components that pass ref around are usually fine with a prop.</p>

<h3>Anti-pattern 7 — error boundary swallowing silently</h3>
<pre><code class="language-tsx">componentDidCatch() { /* nothing */ }</code></pre>
<p>Errors get lost. Always log to Sentry/similar. Provide a "retry" button via state reset.</p>

<h3>Anti-pattern 8 — huge imperative handle API</h3>
<pre><code class="language-tsx">useImperativeHandle(ref, () =&gt; ({ open, close, validate, submit, reset, focus, scroll, ... }));</code></pre>
<p>Imperative APIs are escape hatches. If your component has a 10-method API, declarative design is breaking down. Refactor toward props-driven.</p>

<h3>Anti-pattern 9 — render prop children confused with normal children</h3>
<pre><code class="language-tsx">&lt;Mouse&gt;{pos =&gt; ...}&lt;/Mouse&gt;  // function as child</code></pre>
<p>Readers expect <code>children</code> to be JSX. A function is surprising. Document clearly or use a named prop (<code>render={fn}</code>).</p>

<h3>Anti-pattern 10 — slot naming that hides intent</h3>
<pre><code class="language-tsx">&lt;Card a={x} b={y} c={z}/&gt;</code></pre>
<p>Name slots for their role: <code>header</code>, <code>body</code>, <code>footer</code>.</p>

<h3>Anti-pattern 11 — multiple error boundaries with identical fallback</h3>
<p>Each boundary has its own fallback tree. If they're all the same, hoist to a single boundary.</p>

<h3>Anti-pattern 12 — conditional rendering inside JSX return instead of early return</h3>
<pre><code class="language-tsx">return &lt;div&gt;{auth ? &lt;App/&gt; : &lt;Login/&gt;}&lt;/div&gt;;
// Hard to read when it grows. Prefer early return.</code></pre>

<h3>Anti-pattern 13 — passing whole object when you need one field</h3>
<pre><code class="language-tsx">&lt;UserCard user={user}/&gt;  // fine if UserCard needs many fields
&lt;Avatar user={user}/&gt;    // if Avatar only needs user.avatarUrl, pass that</code></pre>
<p>Narrower props = more memoizable, easier to test, clearer intent.</p>

<h3>Anti-pattern 14 — mixing patterns unnecessarily</h3>
<pre><code class="language-tsx">// A compound component that ALSO uses a render prop AND an HOC...</code></pre>
<p>Pick one pattern. Stacking confuses readers and defeats benefits.</p>

<h3>Anti-pattern 15 — dead code from abandoned patterns</h3>
<p>Project went from HOC → render props → hooks but kept all three as you added features. Unify to hooks; delete the rest.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. What's a compound component?</div>
  <div class="qa-answer">
    <p>A pattern where a parent component exposes several sub-components (often as static properties) that work together via shared state — usually via context. Example: <code>&lt;Tabs&gt;&lt;Tab&gt;&lt;TabPanel&gt;</code>. The parent owns state, puts it in context; children read from context. Callers compose children freely — arbitrary styling, extra wrappers, no need to pass state through every level. Trade-off: requires the parent to be an ancestor; sub-components can't be used standalone.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Render props vs hooks — which and when?</div>
  <div class="qa-answer">
    <p>Hooks almost always win. They have the same power (share stateful logic) with less ceremony: no nested JSX tree, no function-as-child confusion, no new wrapper fiber. Render props survive in two niches: (1) components that genuinely need to produce JSX output parameterized by runtime values (data-driven rendering inside libraries), (2) legacy APIs you can't change. For new code, custom hooks.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. What's a Higher-Order Component? When is it still useful?</div>
  <div class="qa-answer">
    <p>A function taking a component and returning a new component that wraps it — <code>withAuth(Comp)</code>. The wrapped component gets extra props or behavior. Hooks replaced HOCs for most logic-sharing. HOCs remain useful for: route guards (redirect if unauthenticated), cross-cutting concerns where a wrapping component tag is meaningful (analytics, feature flags), decorating legacy class components, or libraries whose authors choose this API.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Controlled vs uncontrolled components?</div>
  <div class="qa-answer">
    <p><strong>Controlled</strong>: parent owns value via <code>useState</code>, passes <code>value</code>+<code>onChange</code>. Parent can read, modify, validate, debounce. More flexible; re-renders on every change.</p>
    <p><strong>Uncontrolled</strong>: the component (or the DOM) owns state; parent reads via ref or on submit. No re-renders per keystroke; simpler for self-contained widgets.</p>
    <p>Best practice for library components: support both. Check if <code>value</code> is passed → controlled; otherwise fall back to internal state with <code>defaultValue</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. What's a headless component?</div>
  <div class="qa-answer">
    <p>A component (or hook) that provides behavior, state, and accessibility but no styling or markup. The caller provides JSX and CSS. Libraries: Radix UI, Headless UI, React Aria. Benefits: your design system stays yours; focus management, keyboard navigation, ARIA, screen-reader support come for free. Trade-off: more code at call site vs picking a pre-styled library like Material UI.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Design a flexible Tabs component.</div>
  <div class="qa-answer">
    <p>Compound components with context:</p>
<pre><code class="language-tsx">const TabsCtx = createContext&lt;...&gt;(null);
function Tabs({ defaultValue, onChange, children }) {
  const [active, setActive] = useState(defaultValue);
  return &lt;TabsCtx.Provider value={{ active, setActive: (v) =&gt; { setActive(v); onChange?.(v); } }}&gt;{children}&lt;/TabsCtx.Provider&gt;;
}
function Tab({ value, children }) {
  const { active, setActive } = useContext(TabsCtx);
  return &lt;button role="tab" aria-selected={active === value} onClick={() =&gt; setActive(value)}&gt;{children}&lt;/button&gt;;
}
function Panel({ value, children }) {
  const { active } = useContext(TabsCtx);
  return active === value ? &lt;div role="tabpanel"&gt;{children}&lt;/div&gt; : null;
}</code></pre>
    <p>Add: keyboard navigation (arrow keys), roving tabindex, a controlled-mode via <code>value</code>/<code>onChange</code> props.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Explain error boundaries and their limitations.</div>
  <div class="qa-answer">
    <p>Error boundaries are class components implementing <code>static getDerivedStateFromError</code> or <code>componentDidCatch</code>. They catch errors thrown during render, lifecycle methods, and constructors of descendants. They do NOT catch: errors in event handlers, async code (Promises), server-side rendering, errors thrown in the boundary itself. For those, wrap handlers in try/catch, reject promises explicitly and surface in render, or use server-side error frameworks. Place boundaries to scope failure: a boundary per route, or per feature island.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. What's the state reducer pattern?</div>
  <div class="qa-answer">
    <p>A hook or component accepts a reducer function that processes every state transition. The caller can intercept and modify transitions without forking the component. Example: a <code>useCombobox</code> hook's default behavior closes the dropdown on blur, but a caller passes a custom reducer that keeps it open when certain keys are pressed. Popularized by Kent C. Dodds' Downshift library. Gives "extreme flexibility without unlimited props."</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. When would you use Portals?</div>
  <div class="qa-answer">
    <p>When the DOM location you want to render into is different from where the component sits in the React tree. Common cases: modals (render at <code>body</code>, above everything), tooltips (escape overflow:hidden ancestors), toasts (fixed-position container). React tree relationships (context, event bubbling) still flow through the React tree, not the DOM — so state and events behave as if the portal content were a normal child.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. What's forwardRef and when do you need it?</div>
  <div class="qa-answer">
    <p><code>forwardRef</code> lets a parent pass a ref through a custom component to the underlying DOM element (or an imperative handle). Without it, <code>&lt;MyInput ref={ref}/&gt;</code> gives a warning because function components don't accept refs directly. You need forwardRef when: (a) the component wraps a DOM element and callers want direct access (e.g., focus, scrollIntoView); (b) you expose an imperative API via <code>useImperativeHandle</code>. App components that can accept <code>inputRef</code> as a plain prop often don't need forwardRef.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Design a Dialog that a team can customize without forks.</div>
  <div class="qa-answer">
    <p>Use a compound component API: <code>&lt;Dialog&gt;&lt;Dialog.Trigger/&gt;&lt;Dialog.Overlay/&gt;&lt;Dialog.Content&gt;&lt;Dialog.Title/&gt;&lt;Dialog.Description/&gt;&lt;Dialog.Close/&gt;&lt;/Dialog.Content&gt;&lt;/Dialog&gt;</code>. Each subcomponent accepts all its DOM-element props (spread). Expose <code>open</code>/<code>onOpenChange</code> for controlled mode. Headless: no styling. Accessibility: focus trap, escape to close, aria-modal, restore focus on close. This is exactly how Radix Dialog is designed — callers assemble as they want.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Why use a slot pattern over children?</div>
  <div class="qa-answer">
    <p>When a layout has multiple distinct regions (<code>header</code>, <code>sidebar</code>, <code>main</code>, <code>footer</code>), you can't use <code>children</code> for all of them — <code>children</code> is one slot. Named prop slots (<code>&lt;Layout header={...} sidebar={...}&gt;{mainContent}&lt;/Layout&gt;</code>) let the parent compose multiple regions. Alternative: compound components (<code>&lt;Layout&gt;&lt;Header/&gt;&lt;Sidebar/&gt;&lt;Main/&gt;&lt;/Layout&gt;</code>) where order and uniqueness matter less. Slots give an explicit shape; compound gives flexible composition.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. What's the "inversion of control" principle in React?</div>
  <div class="qa-answer">
    <p>Expose the primitives; let callers compose. Instead of <code>&lt;List sortBy="date" filterFn={...} /&gt;</code> accepting a closed set of options, accept a <code>renderItem</code> function or let callers pass children. The component stays focused on its one job (rendering a list); callers own the decisions. Custom hooks are the ultimate inversion — the component is gone, you provide the state and let the caller do everything else.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. When does a pattern add value, and when is it noise?</div>
  <div class="qa-answer">
    <p>Patterns pay off when there's a real reuse concern or a complexity the pattern specifically addresses: tabs/menus/dialogs → compound components; form state → state reducer or React Hook Form; cross-cutting ambient data → context; route guards → HOC or hook + wrapper. Patterns are noise when the component is used once, or when the pattern's overhead (ceremony, learning curve) outweighs the benefit. Start simple; refactor to a pattern when the shape becomes clear.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. You're building a design system from scratch. What patterns do you reach for?</div>
  <div class="qa-answer">
    <ol>
      <li><strong>Compound components</strong> for complex widgets (Dialog, Select, Menu, Tabs, Accordion).</li>
      <li><strong>Controlled/uncontrolled dual API</strong> on inputs and disclosure widgets.</li>
      <li><strong>Spread DOM props</strong> on leaf elements (<code>&lt;Button {...rest}/&gt;</code>) so callers can pass native attributes.</li>
      <li><strong>forwardRef</strong> on components that render a DOM element, so callers can attach refs.</li>
      <li><strong>Polymorphic <code>as</code> prop</strong> on layout primitives (Box, Stack, Text).</li>
      <li><strong>Headless logic</strong> via hooks, let consumers style.</li>
      <li><strong>Slot or render prop escape hatches</strong> for non-standard content.</li>
      <li><strong>Strong TypeScript types</strong> with discriminated unions where applicable.</li>
      <li>Document each with examples; write Storybook stories.</li>
    </ol>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You prefer hooks over HOCs and render props for new logic sharing.</li>
    <li>You design compound components with context, not by inspecting children.</li>
    <li>You expose controlled AND uncontrolled modes on complex widgets.</li>
    <li>You reach for headless libraries (Radix, React Aria) when building design systems.</li>
    <li>You use portals for modals/tooltips/toasts.</li>
    <li>You wrap route trees in error boundaries.</li>
    <li>You use forwardRef on primitives that expose DOM references.</li>
    <li>You keep patterns proportional to complexity — not every component deserves one.</li>
  </ul>
</div>
`}

]
});
