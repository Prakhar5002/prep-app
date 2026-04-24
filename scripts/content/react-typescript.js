window.PREP_SITE.registerTopic({
  id: 'react-typescript',
  module: 'React Deep',
  title: 'TypeScript + React',
  estimatedReadTime: '26 min',
  tags: ['react', 'typescript', 'types', 'props', 'generics', 'discriminated-union', 'inference'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>TypeScript + React is the default stack for most modern frontends. The value isn't type annotations — it's <strong>structural correctness at the boundary between components</strong>: props have known shapes, events have known types, refs resolve to specific DOM elements, context has a non-undefined value.</p>
<ul>
  <li><strong>Component props</strong>: <code>type Props = { ... }</code> with <code>React.FC&lt;Props&gt;</code> OR <code>(props: Props) =&gt; JSX.Element</code>. The latter is preferred.</li>
  <li><strong>Children typing</strong>: <code>ReactNode</code> is the most permissive; <code>ReactElement</code> if you need to restrict to a single element.</li>
  <li><strong>Event handlers</strong>: <code>React.ChangeEvent&lt;HTMLInputElement&gt;</code>, <code>React.MouseEvent&lt;HTMLButtonElement&gt;</code>. Or use <code>React.ComponentProps</code> to borrow from a DOM element.</li>
  <li><strong>Refs</strong>: <code>useRef&lt;HTMLInputElement&gt;(null)</code> then <code>ref.current?.focus()</code>.</li>
  <li><strong>Generics</strong>: generic components (<code>&lt;T,&gt;(props: { items: T[] }) =&gt; ...</code>) for reusable patterns like selects and tables.</li>
  <li><strong>Discriminated unions</strong>: the idiomatic way to model loading / error / success states.</li>
  <li><strong>useState typing</strong>: <code>useState&lt;User | null&gt;(null)</code> when the initial value doesn't fully describe the shape.</li>
  <li><strong>Context</strong>: <code>createContext&lt;T | null&gt;(null)</code> + a hook that throws if null, giving callers a non-null type.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Let TypeScript <em>infer</em> what it can; explicitly annotate function signatures and exported types. Use discriminated unions instead of multiple booleans for state. Never sprinkle <code>any</code>; each <code>any</code> is a bug waiting to happen.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why TypeScript for React?</h3>
<p>React's component API is structural — props are objects. TypeScript's structural typing fits perfectly: given a <code>Props</code> type, the compiler verifies every call-site passes compatible data. Mistakes caught at compile time: wrong prop name, missing required field, wrong element type in events, null access on a ref that's only bound after mount.</p>

<h3>FC vs function signature</h3>
<p>React 18 docs recommend:</p>
<pre><code class="language-tsx">// Preferred
function Button(props: Props) { return &lt;button&gt;...&lt;/button&gt;; }
// Or
const Button = (props: Props) =&gt; ...;
// Avoid (as of 2024+)
const Button: React.FC&lt;Props&gt; = (props) =&gt; ...;</code></pre>
<p>Why avoid <code>React.FC</code>? It historically added implicit <code>children: ReactNode</code> (removed in React 18 types), doesn't support generics cleanly, and the plain function signature is simpler. Today it's mostly legacy.</p>

<h3>ReactNode vs ReactElement vs JSX.Element</h3>
<ul>
  <li><code>ReactNode</code> — anything JSX accepts: string, number, null, boolean, ReactElement, array of those. Use for <code>children</code>.</li>
  <li><code>ReactElement</code> — specifically <code>{ type, props, key }</code>. Use when you need a single concrete element (e.g., a prop that must be a rendered element).</li>
  <li><code>JSX.Element</code> — the return type of JSX expressions. Usually interchangeable with <code>ReactElement</code> in practice.</li>
</ul>

<h3>Why discriminated unions?</h3>
<p>Given three flags <code>isLoading</code>, <code>error</code>, <code>data</code>, your code has 2³ = 8 possible combinations — but only 3 are valid. TypeScript can't prevent <code>{ loading: true, data: 'x' }</code> if the type allows it. A discriminated union narrows to exactly the valid states:</p>
<pre><code class="language-ts">type State&lt;T&gt; =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error', error: Error }
  | { status: 'success', data: T };

// Consumer code:
if (state.status === 'success') { state.data; /* type narrows to T */ }
if (state.status === 'error')   { state.error; /* narrows to Error */ }</code></pre>

<h3>Why typed refs?</h3>
<p>A DOM ref might point to an <code>input</code> (has <code>.focus()</code>) or a <code>div</code> (doesn't). Typing the ref tells you which you have:</p>
<pre><code class="language-tsx">const ref = useRef&lt;HTMLInputElement&gt;(null);
ref.current?.focus(); // OK
ref.current?.nonexistentMethod(); // compile error</code></pre>

<h3>Why generics in components?</h3>
<p>A <code>&lt;Select&lt;T&gt;/&gt;</code> that's generic over its items' type:</p>
<pre><code class="language-tsx">type SelectProps&lt;T&gt; = {
  items: T[];
  onSelect: (item: T) =&gt; void;
  renderItem: (item: T) =&gt; React.ReactNode;
};
function Select&lt;T,&gt;(props: SelectProps&lt;T&gt;) { ... }

&lt;Select items={users} onSelect={u =&gt; ...} renderItem={u =&gt; u.name} /&gt;
// TypeScript infers T = User; onSelect's u is typed User.</code></pre>

<h3>Why strict mode?</h3>
<p><code>"strict": true</code> in tsconfig enables noImplicitAny, strictNullChecks, strictFunctionTypes, strictBindCallApply, alwaysStrict, strictPropertyInitialization, noImplicitThis, useUnknownInCatchVariables. Every flag prevents a real bug class. Strict mode is non-negotiable in production codebases.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "types are API contracts" picture</h3>
<p>The <code>Props</code> type for a component is its public API. Consumers read it like documentation: "this component needs an id, an optional onClick, and children." Changing props requires a versioned migration. Treat exported types as stable contracts.</p>

<h3>The "narrow and exhaustive" picture</h3>
<pre><code class="language-ts">function render(state: State&lt;User&gt;) {
  switch (state.status) {
    case 'idle':    return null;
    case 'loading': return &lt;Spinner/&gt;;
    case 'error':   return &lt;Err msg={state.error.message}/&gt;;
    case 'success': return &lt;Profile user={state.data}/&gt;;
    default: const _: never = state; return _; // exhaustiveness check
  }
}</code></pre>
<p>If someone adds a new status to the union and forgets a case, <code>never</code> assignment fails → compile error. Built-in exhaustiveness.</p>

<h3>The "inference waterfall" picture</h3>
<p>TypeScript infers from the bottom up. If a function's return type isn't annotated, TS computes it. If a variable's initializer is known, TS uses that type. Let inference work; only annotate when:</p>
<ul>
  <li>Function exported from a module (stabilizes the public API).</li>
  <li>Inference produces too-wide or too-narrow type (<code>[] as User[]</code>).</li>
  <li>A parameter has no initializer.</li>
</ul>

<h3>The "structural vs nominal" picture</h3>
<p>TypeScript is structural: two types with the same shape are interchangeable.</p>
<pre><code class="language-ts">type User = { id: number, name: string };
type Player = { id: number, name: string };
const u: User = { id: 1, name: 'Ada' };
const p: Player = u; // OK — same shape</code></pre>
<p>For nominal typing (prevent this), use branded types:</p>
<pre><code class="language-ts">type UserId = string &amp; { __brand: 'UserId' };
type PostId = string &amp; { __brand: 'PostId' };
// Now fn(userId: UserId) rejects a PostId at compile time.</code></pre>

<h3>The "utility types" picture</h3>
<p>Built-in utilities cover 90% of type transformations:</p>
<ul>
  <li><code>Partial&lt;T&gt;</code> — all properties optional.</li>
  <li><code>Required&lt;T&gt;</code> — all required.</li>
  <li><code>Readonly&lt;T&gt;</code> — all readonly.</li>
  <li><code>Pick&lt;T, K&gt;</code> — subset by keys.</li>
  <li><code>Omit&lt;T, K&gt;</code> — exclude keys.</li>
  <li><code>Record&lt;K, V&gt;</code> — object with keys K and values V.</li>
  <li><code>Exclude&lt;T, U&gt;</code> — filter a union.</li>
  <li><code>Extract&lt;T, U&gt;</code> — keep only U-compatible.</li>
  <li><code>ReturnType&lt;F&gt;</code>, <code>Parameters&lt;F&gt;</code> — pull from function types.</li>
  <li><code>NonNullable&lt;T&gt;</code> — strips null/undefined.</li>
</ul>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"TypeScript makes code safer at runtime." It doesn't. Types are erased at compile time. Runtime data (form inputs, API responses) is still untyped. Use a validator (Zod, Valibot) at boundaries to turn runtime JSON into typed data.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Component props</h3>
<pre><code class="language-tsx">type ButtonProps = {
  label: string;
  variant?: 'primary' | 'secondary';
  onClick?: () =&gt; void;
  disabled?: boolean;
  children?: React.ReactNode;
};

function Button({ label, variant = 'primary', onClick, disabled, children }: ButtonProps) {
  return &lt;button onClick={onClick} disabled={disabled}&gt;{label}{children}&lt;/button&gt;;
}</code></pre>

<h3>Spreading props onto DOM elements</h3>
<pre><code class="language-tsx">type InputProps = React.ComponentProps&lt;'input'&gt; &amp; { error?: string };
function Input({ error, ...rest }: InputProps) {
  return (&lt;&gt;
    &lt;input {...rest} /&gt;
    {error &amp;&amp; &lt;small&gt;{error}&lt;/small&gt;}
  &lt;/&gt;);
}
// Now &lt;Input type="number" min={0}/&gt; is fully typed from HTMLInputElement.</code></pre>

<h3>Polymorphic components (as prop)</h3>
<pre><code class="language-tsx">type BoxProps&lt;T extends React.ElementType&gt; = {
  as?: T;
  children?: React.ReactNode;
} &amp; Omit&lt;React.ComponentProps&lt;T&gt;, 'as' | 'children'&gt;;

function Box&lt;T extends React.ElementType = 'div'&gt;({ as, ...rest }: BoxProps&lt;T&gt;) {
  const Tag = as ?? 'div';
  return &lt;Tag {...rest} /&gt;;
}
// &lt;Box as="a" href="/x"&gt;Link&lt;/Box&gt;  ← href autocompletes
// &lt;Box as="button" onClick={...}&gt;Btn&lt;/Box&gt;</code></pre>

<h3>Event handlers</h3>
<pre><code class="language-tsx">function Form() {
  const onSubmit = (e: React.FormEvent&lt;HTMLFormElement&gt;) =&gt; {
    e.preventDefault();
    const data = new FormData(e.currentTarget); // currentTarget is typed HTMLFormElement
  };
  const onChange = (e: React.ChangeEvent&lt;HTMLInputElement&gt;) =&gt; {
    console.log(e.target.value);
  };
  const onClick = (e: React.MouseEvent&lt;HTMLButtonElement&gt;) =&gt; { ... };
}</code></pre>

<h3>Refs</h3>
<pre><code class="language-tsx">// DOM ref
const input = useRef&lt;HTMLInputElement&gt;(null);
useEffect(() =&gt; input.current?.focus(), []);

// Mutable "box" ref
const count = useRef(0);
count.current++; // number

// forwardRef
const FancyInput = forwardRef&lt;HTMLInputElement, { placeholder?: string }&gt;(
  function FancyInput({ placeholder }, ref) {
    return &lt;input ref={ref} placeholder={placeholder} /&gt;;
  }
);</code></pre>

<h3>useState</h3>
<pre><code class="language-tsx">// Inference works for primitives
const [n, setN] = useState(0);           // number
const [s, setS] = useState('');          // string
const [open, setOpen] = useState(false); // boolean

// Explicit generic when initial doesn't cover the shape
const [user, setUser] = useState&lt;User | null&gt;(null);
const [items, setItems] = useState&lt;Item[]&gt;([]);

// Discriminated state
type State = { status: 'idle' } | { status: 'loading' } | { status: 'ok', data: User };
const [state, setState] = useState&lt;State&gt;({ status: 'idle' });</code></pre>

<h3>useReducer</h3>
<pre><code class="language-tsx">type Action =
  | { type: 'inc' }
  | { type: 'add', payload: number }
  | { type: 'reset' };

function reducer(state: number, action: Action): number {
  switch (action.type) {
    case 'inc':   return state + 1;
    case 'add':   return state + action.payload;
    case 'reset': return 0;
    default: const _: never = action; return state;
  }
}</code></pre>

<h3>Context with non-null hook</h3>
<pre><code class="language-tsx">type AuthValue = { user: User; logout: () =&gt; void };
const AuthCtx = createContext&lt;AuthValue | null&gt;(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ...
  return &lt;AuthCtx.Provider value={value}&gt;{children}&lt;/AuthCtx.Provider&gt;;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
// Callers get a non-null AuthValue — no need to handle null case.</code></pre>

<h3>Generic components</h3>
<pre><code class="language-tsx">type ListProps&lt;T&gt; = {
  items: T[];
  getKey: (item: T) =&gt; string;
  renderItem: (item: T) =&gt; React.ReactNode;
};
function List&lt;T,&gt;(props: ListProps&lt;T&gt;) {
  return &lt;ul&gt;{props.items.map(i =&gt; &lt;li key={props.getKey(i)}&gt;{props.renderItem(i)}&lt;/li&gt;)}&lt;/ul&gt;;
}
// &lt;List items={users} getKey={u =&gt; u.id} renderItem={u =&gt; u.name}/&gt; // T=User inferred</code></pre>

<h3>Conditional props</h3>
<pre><code class="language-tsx">type Props =
  | { as: 'a', href: string }
  | { as: 'button', onClick: () =&gt; void };
// TS forces href when as='a' and onClick when as='button'.</code></pre>

<h3>TypeScript for useMemo / useCallback</h3>
<pre><code class="language-tsx">const sorted = useMemo(() =&gt; items.sort(cmp), [items]); // type inferred
const onClick = useCallback((id: string) =&gt; doIt(id), []); // param typed explicitly</code></pre>

<h3>Runtime validation at the boundary</h3>
<pre><code class="language-tsx">import { z } from 'zod';
const User = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});
type User = z.infer&lt;typeof User&gt;;

async function getUser(id: string): Promise&lt;User&gt; {
  const json = await fetch('/api/user/' + id).then(r =&gt; r.json());
  return User.parse(json); // throws if invalid; returns typed User otherwise
}</code></pre>

<h3>Tsconfig essentials</h3>
<pre><code class="language-json">{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}</code></pre>
<p><code>noUncheckedIndexedAccess</code> is particularly valuable: <code>arr[0]</code> becomes <code>T | undefined</code>, catching off-by-one bugs.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — basic typed component</h3>
<pre><code class="language-tsx">type BadgeProps = { label: string; color?: 'red' | 'blue' };
function Badge({ label, color = 'blue' }: BadgeProps) {
  return &lt;span style={{ background: color }}&gt;{label}&lt;/span&gt;;
}</code></pre>

<h3>Example 2 — children with JSX</h3>
<pre><code class="language-tsx">type CardProps = { title: string; children: React.ReactNode };
function Card({ title, children }: CardProps) {
  return &lt;div&gt;&lt;h2&gt;{title}&lt;/h2&gt;{children}&lt;/div&gt;;
}</code></pre>

<h3>Example 3 — event handlers typed</h3>
<pre><code class="language-tsx">function Search() {
  const [q, setQ] = useState('');
  const onChange = (e: React.ChangeEvent&lt;HTMLInputElement&gt;) =&gt; setQ(e.target.value);
  const onSubmit = (e: React.FormEvent&lt;HTMLFormElement&gt;) =&gt; { e.preventDefault(); ...; };
  return (&lt;form onSubmit={onSubmit}&gt;&lt;input value={q} onChange={onChange} /&gt;&lt;/form&gt;);
}</code></pre>

<h3>Example 4 — extending DOM props</h3>
<pre><code class="language-tsx">type ButtonProps = React.ComponentProps&lt;'button'&gt; &amp; { variant?: 'primary' | 'ghost' };
function Button({ variant = 'primary', className, ...rest }: ButtonProps) {
  return &lt;button className={\`btn btn-\${variant} \${className ?? ''}\`} {...rest} /&gt;;
}</code></pre>

<h3>Example 5 — generic list</h3>
<pre><code class="language-tsx">function ItemList&lt;T,&gt;({ items, keyFn, itemFn }: { items: T[], keyFn: (i:T)=&gt;string, itemFn: (i:T)=&gt;React.ReactNode }) {
  return &lt;ul&gt;{items.map(i =&gt; &lt;li key={keyFn(i)}&gt;{itemFn(i)}&lt;/li&gt;)}&lt;/ul&gt;;
}
&lt;ItemList items={users} keyFn={u =&gt; u.id} itemFn={u =&gt; u.name} /&gt;</code></pre>

<h3>Example 6 — discriminated union state</h3>
<pre><code class="language-tsx">type State&lt;T&gt; = { kind: 'loading' } | { kind: 'error', err: Error } | { kind: 'ok', data: T };
const [state, setState] = useState&lt;State&lt;User&gt;&gt;({ kind: 'loading' });
switch (state.kind) {
  case 'loading': return &lt;Spinner/&gt;;
  case 'error':   return &lt;p&gt;{state.err.message}&lt;/p&gt;;
  case 'ok':      return &lt;Profile user={state.data} /&gt;;
}</code></pre>

<h3>Example 7 — typed ref + forwardRef</h3>
<pre><code class="language-tsx">const MyInput = forwardRef&lt;HTMLInputElement, { label: string }&gt;(
  function MyInput({ label }, ref) {
    return (&lt;label&gt;{label}&lt;input ref={ref}/&gt;&lt;/label&gt;);
  }
);
function App() {
  const ref = useRef&lt;HTMLInputElement&gt;(null);
  return &lt;MyInput ref={ref} label="Name" /&gt;;
}</code></pre>

<h3>Example 8 — non-null context hook</h3>
<pre><code class="language-tsx">const Ctx = createContext&lt;User | null&gt;(null);
export function useUser(): User {
  const u = useContext(Ctx);
  if (!u) throw new Error('useUser must be inside provider');
  return u;
}</code></pre>

<h3>Example 9 — typed useReducer</h3>
<pre><code class="language-tsx">type State = { items: string[] };
type Action = { type: 'add', item: string } | { type: 'remove', index: number };
function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'add':    return { items: [...s.items, a.item] };
    case 'remove': return { items: s.items.filter((_, i) =&gt; i !== a.index) };
  }
}
const [state, dispatch] = useReducer(reducer, { items: [] });
dispatch({ type: 'add', item: 'x' });</code></pre>

<h3>Example 10 — Zod-validated API</h3>
<pre><code class="language-tsx">import { z } from 'zod';
const Post = z.object({ id: z.string(), title: z.string(), body: z.string() });
type Post = z.infer&lt;typeof Post&gt;;
async function getPost(id: string): Promise&lt;Post&gt; {
  const json = await fetch('/posts/' + id).then(r =&gt; r.json());
  return Post.parse(json);
}</code></pre>

<h3>Example 11 — polymorphic Box</h3>
<pre><code class="language-tsx">type BoxProps&lt;T extends React.ElementType = 'div'&gt; = {
  as?: T;
} &amp; Omit&lt;React.ComponentProps&lt;T&gt;, 'as'&gt;;

function Box&lt;T extends React.ElementType = 'div'&gt;({ as, ...rest }: BoxProps&lt;T&gt;) {
  const Tag = (as ?? 'div') as React.ElementType;
  return &lt;Tag {...rest} /&gt;;
}
// Usage:
&lt;Box as="a" href="/x"&gt;Link&lt;/Box&gt;
&lt;Box as="section" role="banner"&gt;...&lt;/Box&gt;</code></pre>

<h3>Example 12 — conditional props</h3>
<pre><code class="language-tsx">type Props =
  | { loading: true; data?: never }
  | { loading: false; data: User };
function View(p: Props) {
  if (p.loading) return &lt;Spinner/&gt;;
  return &lt;div&gt;{p.data.name}&lt;/div&gt;; // TS knows data is present here
}</code></pre>

<h3>Example 13 — typed HOC</h3>
<pre><code class="language-tsx">function withLogger&lt;P extends object&gt;(C: React.ComponentType&lt;P&gt;) {
  return function Logged(props: P) {
    useEffect(() =&gt; { console.log('mounted'); }, []);
    return &lt;C {...props} /&gt;;
  };
}</code></pre>

<h3>Example 14 — strictly typed RTK slice</h3>
<pre><code class="language-tsx">const todos = createSlice({
  name: 'todos',
  initialState: { byId: {} as Record&lt;string, Todo&gt;, ids: [] as string[] },
  reducers: {
    added(s, a: PayloadAction&lt;Todo&gt;) { s.byId[a.payload.id] = a.payload; s.ids.push(a.payload.id); },
    toggled(s, a: PayloadAction&lt;string&gt;) { const t = s.byId[a.payload]; if (t) t.done = !t.done; },
  }
});</code></pre>

<h3>Example 15 — ComponentProps for DOM type extraction</h3>
<pre><code class="language-tsx">type DivProps = React.ComponentProps&lt;'div'&gt;;
type ButtonProps = React.ComponentProps&lt;typeof MyButton&gt;; // steal MyButton's props</code></pre>

<h3>Example 16 — narrowing with custom type guards</h3>
<pre><code class="language-tsx">function isUser(x: unknown): x is User {
  return typeof x === 'object' &amp;&amp; x !== null &amp;&amp; 'id' in x &amp;&amp; 'name' in x;
}
const parsed: unknown = JSON.parse(raw);
if (isUser(parsed)) { parsed.name; } // narrowed to User</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. JSX expects JSX.Element or string, not <code>string | null</code> for children directly</h3>
<p><code>ReactNode</code> includes null/undefined/boolean which are safe to render (React skips them). If a child type is narrower, update to <code>ReactNode</code>.</p>

<h3>2. FC's children removed in React 18 types</h3>
<p>Before: <code>React.FC</code> implicitly included <code>children: ReactNode</code>. Now: you must declare <code>children</code> explicitly if used.</p>

<h3>3. Generic component and JSX confusion</h3>
<pre><code class="language-tsx">const F = &lt;T,&gt;(p: { v: T }) =&gt; &lt;div&gt;...&lt;/div&gt;;
// In .tsx, &lt;T&gt; looks like a JSX tag. Fix with trailing comma &lt;T,&gt; or constrained: &lt;T extends unknown&gt;.</code></pre>

<h3>4. Strict mode's noUncheckedIndexedAccess</h3>
<pre><code class="language-tsx">const u: User | undefined = users[0]; // with noUncheckedIndexedAccess
// Forces you to handle undefined; catches out-of-bounds bugs.</code></pre>

<h3>5. Narrowing after .filter(Boolean)</h3>
<pre><code class="language-tsx">const maybe: (string | undefined)[] = ['a', undefined, 'b'];
const defined = maybe.filter(Boolean); // type still (string | undefined)[]!
// Fix with a type predicate:
const defined = maybe.filter((x): x is string =&gt; x !== undefined);</code></pre>

<h3>6. React events vs native events</h3>
<p><code>React.ChangeEvent&lt;HTMLInputElement&gt;</code> is React's synthetic event, not the native <code>ChangeEvent</code>. They share shape but <code>React.*Event</code> is correct in handler types.</p>

<h3>7. useState with an object — generic needed</h3>
<pre><code class="language-tsx">// Inferred: { name: string } — then can't setState({ name: 'x', age: 1 })
const [user, setUser] = useState({ name: '' });
// Explicit:
const [user, setUser] = useState&lt;User&gt;({ name: '' });</code></pre>

<h3>8. useRef&lt;T&gt;(null) vs useRef&lt;T | null&gt;(null)</h3>
<p>For DOM refs, <code>useRef&lt;HTMLElement&gt;(null)</code> gives <code>RefObject&lt;HTMLElement&gt;</code> — ref.current typed <code>HTMLElement | null</code>. For mutable boxes you set yourself, <code>useRef&lt;T | null&gt;(null)</code> lets you assign. For <code>useRef&lt;T&gt;(initial)</code> (with non-null initial), current is always T.</p>

<h3>9. Context default is usually wrong</h3>
<pre><code class="language-tsx">const Ctx = createContext&lt;User&gt;({} as User); // lying to the type system
// Better: createContext&lt;User | null&gt;(null) + custom hook that throws.</code></pre>

<h3>10. Unions across union types are painful</h3>
<pre><code class="language-tsx">type A = { kind: 'x', v: number } | { kind: 'y', v: string };
type B = { kind: 'x', v: number } | { kind: 'z', v: boolean };
type AB = A | B; // v is number|string|boolean, narrowing breaks
// Fix: discriminate on additional tag, or normalize shapes.</code></pre>

<h3>11. Typing React.memo with generics</h3>
<p>React.memo doesn't preserve generics well. Use <code>forwardRef</code> + <code>memo</code> carefully; or don't memoize a generic component — inline the memo strategy.</p>

<h3>12. as const for enums without TS enums</h3>
<pre><code class="language-tsx">const STATUS = { idle: 'idle', ok: 'ok' } as const;
type Status = typeof STATUS[keyof typeof STATUS]; // 'idle' | 'ok'</code></pre>

<h3>13. JSX with capitalized variables</h3>
<pre><code class="language-tsx">const Tag = 'div';
&lt;Tag /&gt; // TS error — JSX expects a component, treats lowercase as host element
// Fix: cast
const Tag: React.ElementType = 'div';</code></pre>

<h3>14. useCallback deps type widening</h3>
<pre><code class="language-tsx">const cb = useCallback((id) =&gt; ..., []); // id is implicit any in strict mode
// Annotate:
const cb = useCallback((id: string) =&gt; ..., []);</code></pre>

<h3>15. Optional vs undefined</h3>
<pre><code class="language-tsx">type A = { x?: number };
type B = { x: number | undefined };
// Mostly interchangeable, BUT:
const a: A = {}; // OK
const b: B = {}; // ERROR — must explicitly set x: undefined</code></pre>

<h3>16. Prop drilling event types</h3>
<p>You can steal a component's event type via <code>Parameters&lt;typeof handler&gt;[0]</code> rather than re-specifying.</p>

<h3>17. React.ReactElement vs React.JSX.Element</h3>
<p>Mostly the same; the former is generic (<code>ReactElement&lt;P&gt;</code>), the latter is a fixed alias. Use ReactElement when you need to constrain a prop's element type.</p>

<h3>18. Template literal types can model strong string constraints</h3>
<pre><code class="language-tsx">type Hex = \`#\${string}\`;
const ok: Hex = '#fff'; const bad: Hex = 'red'; // error</code></pre>

<h3>19. "Types" vs "runtime schemas"</h3>
<p>A TypeScript type is erased at compile time — no validation at runtime. Use Zod/Valibot/Yup to validate JSON at the network boundary. <code>z.infer</code> bridges runtime schema to TS type.</p>

<h3>20. @types packages can lag</h3>
<p>If you use a newly-released library, <code>@types/...</code> might be missing features or wrong. Options: contribute upstream, augment types locally via <code>declare module</code>, or <code>@ts-expect-error</code> with a TODO link.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — any sprinkled everywhere</h3>
<pre><code class="language-tsx">function handle(e: any) { e.target.value }</code></pre>
<p>Each <code>any</code> defeats type safety. Prefer <code>unknown</code> with narrowing. <code>no-explicit-any</code> lint rule catches them.</p>

<h3>Anti-pattern 2 — casting with <code>as</code></h3>
<pre><code class="language-tsx">const user = json as User;</code></pre>
<p>Casts assert without verifying. If the JSON is malformed, downstream code crashes. Use Zod to validate; or write a type guard.</p>

<h3>Anti-pattern 3 — React.FC for new components</h3>
<p>Historical reasons only. Plain function signature is simpler and works with generics.</p>

<h3>Anti-pattern 4 — duplicating types from a library</h3>
<pre><code class="language-tsx">type ButtonProps = { onClick?: () =&gt; void, disabled?: boolean }; // recreated HTML attrs</code></pre>
<p>Use <code>React.ComponentProps&lt;'button'&gt;</code> and intersect.</p>

<h3>Anti-pattern 5 — context default of "fake" data</h3>
<pre><code class="language-tsx">createContext&lt;User&gt;({ name: '', id: '' });</code></pre>
<p>If no provider is mounted, consumers silently get the fake user. Use null + a hook that throws.</p>

<h3>Anti-pattern 6 — string unions repeated</h3>
<pre><code class="language-tsx">type A = 'x' | 'y' | 'z';
function f(a: 'x' | 'y' | 'z') { ... } // duplicated</code></pre>
<p>Extract the union; reuse. If the values are also needed at runtime, <code>as const</code> the array and derive the type.</p>

<h3>Anti-pattern 7 — passing <code>undefined</code> where a missing prop is expected</h3>
<pre><code class="language-tsx">// Works because { x?: T } allows missing, but TS without exactOptionalPropertyTypes accepts both.
&lt;C x={undefined} /&gt;  // with exactOptionalPropertyTypes, error
// Tighten tsconfig.</code></pre>

<h3>Anti-pattern 8 — over-specifying types on arrays</h3>
<pre><code class="language-tsx">const xs: string[] = ['a', 'b']; // unnecessary — TS infers string[]</code></pre>
<p>Let inference handle locals; annotate signatures.</p>

<h3>Anti-pattern 9 — type assertions to silence errors</h3>
<pre><code class="language-tsx">(props as any).doThing();</code></pre>
<p>Every such cast is a bug-in-waiting. Fix the types or refactor.</p>

<h3>Anti-pattern 10 — union of booleans for state</h3>
<pre><code class="language-tsx">const [loading, setLoading] = useState(false);
const [err, setErr] = useState&lt;Error | null&gt;(null);
const [data, setData] = useState&lt;User | null&gt;(null);</code></pre>
<p>Invalid states representable: loading + err + data all set. Use a discriminated union.</p>

<h3>Anti-pattern 11 — @ts-ignore without comment</h3>
<pre><code class="language-tsx">// @ts-ignore
dodgy();</code></pre>
<p>Use <code>@ts-expect-error</code> + a link to the issue, so when the underlying cause is fixed, TS tells you by failing "unexpected expect-error."</p>

<h3>Anti-pattern 12 — typing props with React types that include too much</h3>
<pre><code class="language-tsx">type Props = HTMLAttributes&lt;HTMLDivElement&gt;; // a LOT of attrs, pollutes IntelliSense</code></pre>
<p>Pick the specific attributes you actually support, or use <code>ComponentProps&lt;'div'&gt;</code> and <code>Pick</code>.</p>

<h3>Anti-pattern 13 — exporting only types without runtime schema</h3>
<p>API response types with no validation mean any malformed response crashes code that assumed the shape. Pair types with Zod/similar for anything crossing the network.</p>

<h3>Anti-pattern 14 — deeply nested Partial for updates</h3>
<pre><code class="language-tsx">function merge(state: State, patch: DeepPartial&lt;State&gt;) { ... }</code></pre>
<p>Ends in "everything is optional," breaks type safety. Prefer normalized state + explicit update actions.</p>

<h3>Anti-pattern 15 — readonly everywhere</h3>
<pre><code class="language-tsx">type Props = Readonly&lt;{ name: string, data: Readonly&lt;User[]&gt; }&gt;;</code></pre>
<p>React props are already treated as immutable by convention. Over-use of <code>Readonly</code> clutters types without adding value unless you've been bitten by mutation bugs.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. How do you type a React component's props?</div>
  <div class="qa-answer">
    <p>Create a <code>type</code> or <code>interface</code> and use it on the function parameter:</p>
<pre><code class="language-tsx">type Props = { label: string; onClick?: () =&gt; void };
function Button({ label, onClick }: Props) { return &lt;button onClick={onClick}&gt;{label}&lt;/button&gt;; }</code></pre>
    <p>Avoid <code>React.FC</code> — plain function signatures are preferred. For children, declare <code>children?: React.ReactNode</code> explicitly.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Why use a discriminated union for state?</div>
  <div class="qa-answer">
    <p>It restricts state to only valid combinations. Instead of independent flags (<code>loading</code>, <code>error</code>, <code>data</code>) allowing invalid states like <code>{loading: true, error: 'x', data: u}</code>, the union forces exactly one shape at a time. TypeScript narrows on the discriminant so your code always knows which fields are present. Bonus: exhaustiveness checking via <code>never</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. How do you type event handlers?</div>
  <div class="qa-answer">
<pre><code class="language-tsx">const onChange = (e: React.ChangeEvent&lt;HTMLInputElement&gt;) =&gt; { ... };
const onSubmit = (e: React.FormEvent&lt;HTMLFormElement&gt;) =&gt; { ... };
const onClick = (e: React.MouseEvent&lt;HTMLButtonElement&gt;) =&gt; { ... };</code></pre>
    <p>The generic parameter is the element type; it gives <code>e.currentTarget</code> the right type.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. How do you extend native DOM element props?</div>
  <div class="qa-answer">
<pre><code class="language-tsx">type ButtonProps = React.ComponentProps&lt;'button'&gt; &amp; { variant?: 'primary' };
function Button({ variant, ...rest }: ButtonProps) {
  return &lt;button {...rest} /&gt;;
}
// Now &lt;Button type="submit" onClick={...} variant="primary"&gt; all type-check.</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. How do you type a useState with a complex initial value?</div>
  <div class="qa-answer">
<pre><code class="language-tsx">// When TS can't infer the full shape from the initial value:
const [user, setUser] = useState&lt;User | null&gt;(null);
const [items, setItems] = useState&lt;Item[]&gt;([]);
// Inference is fine for primitives or when initial IS the full shape.</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How do you type a DOM ref?</div>
  <div class="qa-answer">
<pre><code class="language-tsx">const ref = useRef&lt;HTMLInputElement&gt;(null);
useEffect(() =&gt; ref.current?.focus(), []);</code></pre>
    <p><code>ref.current</code> is <code>HTMLInputElement | null</code> — use optional chaining. For forwardRef, provide both the ref type and props type.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How do you make a generic component?</div>
  <div class="qa-answer">
<pre><code class="language-tsx">function Select&lt;T,&gt;(props: {
  items: T[];
  onSelect: (item: T) =&gt; void;
  renderItem: (item: T) =&gt; React.ReactNode;
}) { ... }
// Usage: TS infers T from the items array.</code></pre>
    <p>Trailing comma in <code>&lt;T,&gt;</code> disambiguates from JSX in .tsx files.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How do you handle a React Context whose value might be missing?</div>
  <div class="qa-answer">
    <p>Create the context with <code>null</code> as default, and export a custom hook that throws if the context wasn't provided:</p>
<pre><code class="language-tsx">const Ctx = createContext&lt;Value | null&gt;(null);
export function useValue(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error('useValue must be used within Provider');
  return v;
}</code></pre>
    <p>Callers get a non-null type without having to handle null themselves.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. What's the difference between <code>unknown</code> and <code>any</code>?</div>
  <div class="qa-answer">
    <p><code>any</code> disables type checking — you can call anything on it, assign it to anything. <code>unknown</code> is the type-safe counterpart: it holds any value, but you can't use it until you narrow (type guard, instanceof, typeof check). Prefer <code>unknown</code> for "I don't know the type yet" — the compiler forces you to prove what it is before use. <code>any</code> is an escape hatch that papers over bugs.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Why use Zod (or similar) with TypeScript?</div>
  <div class="qa-answer">
    <p>TypeScript types are erased at compile time — at runtime, your JSON parse returns <code>any</code> and assuming it's shaped like your type is a lie. Zod is a schema library that defines the shape in runtime code AND gives you a TypeScript type via <code>z.infer</code>. Validation at boundaries (API, form submit, localStorage read) turns untyped data into typed data safely. If the server changes its shape, you get a loud parse error rather than a silent runtime bug.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Explain polymorphic components.</div>
  <div class="qa-answer">
    <p>A component that renders as a different HTML element depending on a prop — usually <code>as</code>. Typing them is tricky because the prop types change with <code>as</code>. The pattern:</p>
<pre><code class="language-tsx">type BoxProps&lt;T extends React.ElementType&gt; = {
  as?: T;
} &amp; Omit&lt;React.ComponentProps&lt;T&gt;, 'as'&gt;;

function Box&lt;T extends React.ElementType = 'div'&gt;({ as, ...rest }: BoxProps&lt;T&gt;) {
  const Tag = as ?? 'div';
  return &lt;Tag {...rest} /&gt;;
}</code></pre>
    <p>Usage: <code>&lt;Box as="a" href="/x" /&gt;</code> — <code>href</code> autocompletes. Libraries like Radix and MUI use this pattern heavily.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. What's exhaustiveness checking?</div>
  <div class="qa-answer">
    <p>Using <code>never</code> to ensure all cases of a discriminated union are handled. In the <code>default</code> branch, assign the variable to <code>never</code>: if every case is covered, the variable is narrowed to <code>never</code> and the assignment compiles. If a new case is added to the union without a handler, the variable's type includes the new case and the assignment fails. Catches missed cases at compile time.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. When should you NOT use TypeScript?</div>
  <div class="qa-answer">
    <p>Small scripts, quick prototypes, tiny personal projects where the setup cost outweighs the benefit. A one-off dashboard experiment, a data-science notebook, a 50-line automation script. Even there, modern tooling (Vite, Vitest) makes TS setup near-zero-cost, so the practical answer is "always use it in anything that'll live more than a week."</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. How do you handle a rapidly-changing library with poor types?</div>
  <div class="qa-answer">
    <ul>
      <li>Contribute types upstream to <code>@types/lib</code> via DefinitelyTyped.</li>
      <li>Augment types locally: <code>declare module 'lib' { ... }</code>.</li>
      <li>Wrap the library in a small typed facade; <code>any</code> inside, typed on the boundary.</li>
      <li>Use <code>@ts-expect-error</code> with a comment pointing to the tracking issue; removing the suppress when the upstream types land.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. What's <code>noUncheckedIndexedAccess</code>?</div>
  <div class="qa-answer">
    <p>A tsconfig flag that treats <code>arr[i]</code> as <code>T | undefined</code> instead of <code>T</code>. Without it, <code>arr[5]</code> is typed as the element type even though it might be out of bounds. With it, you're forced to handle the undefined case, catching off-by-one and empty-array bugs. Highly recommended in strict codebases, though it adds friction for obvious in-bounds accesses.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You reach for discriminated unions over flag soup.</li>
    <li>You use <code>React.ComponentProps&lt;'tag'&gt;</code> to compose DOM props.</li>
    <li>You know the <code>&lt;T,&gt;</code> trick for generic components in .tsx.</li>
    <li>You create context with null + non-null hook.</li>
    <li>You prefer <code>unknown</code> over <code>any</code>.</li>
    <li>You validate at boundaries with Zod / Valibot / similar.</li>
    <li>You turn on strict mode and noUncheckedIndexedAccess.</li>
    <li>You use exhaustiveness checks with <code>never</code>.</li>
  </ul>
</div>
`}

]
});
