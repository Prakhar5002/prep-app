window.PREP_SITE.registerTopic({
  id: 'mc-components',
  module: 'machine-coding',
  title: 'Component Library',
  estimatedReadTime: '50 min',
  tags: ['component-library', 'design-system', 'tokens', 'compound-components', 'polymorphic', 'a11y', 'forwardRef', 'props-api', 'theming'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>A <strong>component library round</strong> asks you to design and build a reusable component (or a small set) the way it would live in a design system. The grader is watching <strong>props API design</strong>, <strong>composition</strong>, <strong>accessibility</strong>, <strong>theming</strong>, and <strong>edge-case fluency</strong>. The "build a Button" prompt sounds trivial — they're really asking you to demonstrate every choice that separates a hobby project from a shipped library.</p>
<ul>
  <li><strong>The 12 components that come up most:</strong> Button, Input, Select, Checkbox, Radio, Switch, Modal, Drawer, Tooltip, Toast, Tabs, Accordion. Plus theming primitives (tokens, CSS variables).</li>
  <li><strong>The composition toolbox:</strong> compound components (<code>Tabs</code> + <code>Tabs.List</code>), polymorphic <code>as</code> prop, <code>forwardRef</code>, <code>cloneElement</code>, slots / render props, controlled-or-uncontrolled patterns.</li>
  <li><strong>Default API rules:</strong> small surface, sensible defaults, escape hatches (<code>className</code>, <code>style</code>, <code>...rest</code>, <code>ref</code>), consistent naming (<code>onSomething</code>, <code>isLoading</code>, variants as enums).</li>
  <li><strong>Always demo:</strong> variants, sizes, states (default, hover, active, disabled, focus, error), controlled + uncontrolled, dark mode, keyboard, screen reader.</li>
  <li><strong>Always close with:</strong> "If I had more time I would…" — Storybook stories, visual regression, RTL tests, animation refinement, theming layer.</li>
</ul>
<p><strong>Mantra:</strong> "Sensible defaults. Composable parts. Escape hatches everywhere. Accessibility is non-negotiable."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What is a component-library round?</h3>
<p>A subset of machine coding where the prompt is "design and build a <em>reusable</em> X." The signal is in the word <em>reusable</em> — you're not solving one screen, you're shipping a piece that will be used across an org by other devs you've never met.</p>

<h3>Why companies run this round</h3>
<table>
  <thead><tr><th>What it tests</th><th>Why it matters in production</th></tr></thead>
  <tbody>
    <tr><td>API design instincts</td><td>Bad APIs cost the org years; libraries are the contract surface for hundreds of features.</td></tr>
    <tr><td>Composition fluency</td><td>Real design systems are built from primitives, not monolithic components.</td></tr>
    <tr><td>Accessibility defaults</td><td>The library is the only place a11y can be enforced at scale.</td></tr>
    <tr><td>Theming &amp; tokens</td><td>Brand changes, dark mode, white-labels — handled at the library, not 1000 features.</td></tr>
    <tr><td>Edge-case awareness</td><td>Library code is the most-shared code; edge cases hit every consumer.</td></tr>
    <tr><td>TypeScript fluency</td><td>Library DX = props.d.ts. Bad types = unusable library.</td></tr>
  </tbody>
</table>

<h3>What "good" looks like</h3>
<ul>
  <li>You ask about scope: <em>"Are we building one Button or laying foundations for a library?"</em></li>
  <li>You design the props API <em>before</em> typing JSX. List variants, sizes, states.</li>
  <li>You introduce design tokens / CSS variables early — colours, spacing, radius — not hardcoded.</li>
  <li>You compose: <code>&lt;Modal&gt;</code> + <code>&lt;Modal.Header&gt;</code> + <code>&lt;Modal.Body&gt;</code> beats one mega-component with 30 props.</li>
  <li>You build a11y in: ARIA roles, keyboard nav, focus management, semantic HTML.</li>
  <li>You demo controlled and uncontrolled flows.</li>
  <li>You forward refs, spread <code>...rest</code>, accept <code>className</code>.</li>
  <li>You name what's missing for a real lib: stories, tests, docs, theming.</li>
</ul>

<h3>What "bad" looks like</h3>
<ul>
  <li>30 boolean props (<code>isPrimary</code>, <code>isSecondary</code>, <code>isDanger</code>) instead of <code>variant="primary|secondary|danger"</code>.</li>
  <li>No <code>className</code> escape hatch — consumers can't customize.</li>
  <li>Hardcoded colours and spacing instead of tokens.</li>
  <li>Uses <code>div onClick</code> for a Button — fails keyboard, screen reader.</li>
  <li>Refs blocked: <code>forwardRef</code> not used, breaks <code>focus()</code>, animations.</li>
  <li>One mega-component instead of compound parts.</li>
  <li>No type narrowing; <code>...props: any</code>.</li>
</ul>

<h3>The two-axis design grid</h3>
<p>For most components, ask yourself two questions before typing:</p>
<table>
  <thead><tr><th>Axis</th><th>Question</th><th>Outcome</th></tr></thead>
  <tbody>
    <tr><td>Customisation depth</td><td>How much can a consumer override visually?</td><td>props (shallow) → variants (medium) → slots / compound (deep)</td></tr>
    <tr><td>Behaviour ownership</td><td>Who owns the open / value state?</td><td>uncontrolled (component) or controlled (consumer) — best libraries support both</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The 5 layers of a component library</h3>
<pre><code class="language-text">┌─────────────────────────────┐
│  5. Patterns / Recipes      │  modal-on-form, drawer-on-mobile
├─────────────────────────────┤
│  4. Composed components     │  &lt;DataTable&gt;, &lt;DatePicker&gt; (built from below)
├─────────────────────────────┤
│  3. Primitives              │  &lt;Button&gt;, &lt;Input&gt;, &lt;Modal&gt;
├─────────────────────────────┤
│  2. Tokens / CSS variables  │  --color-primary, --spacing-md, --radius-sm
├─────────────────────────────┤
│  1. Theme provider          │  light / dark / brand
└─────────────────────────────┘
</code></pre>
<p>Most rounds focus on Layer 3, but the senior signal is naming all 5 and explaining how they connect.</p>

<h3>The props-API design checklist</h3>
<ol>
  <li><strong>Required vs optional:</strong> only require what's truly required (<code>onClick</code> on Button is optional — it might be a submit button).</li>
  <li><strong>Variants as union strings, not booleans.</strong> <code>variant: 'primary'|'ghost'|'danger'</code> beats three flags.</li>
  <li><strong>Sizes as enum.</strong> <code>size: 'sm'|'md'|'lg'</code>.</li>
  <li><strong>States as boolean.</strong> <code>isLoading</code>, <code>disabled</code>, <code>isFullWidth</code>.</li>
  <li><strong>Event handlers as <code>onSomething</code>.</strong> <code>onClick</code>, <code>onChange</code>, <code>onOpenChange</code>.</li>
  <li><strong>Always accept:</strong> <code>className</code>, <code>style</code>, <code>...rest</code>, <code>ref</code>.</li>
  <li><strong>Render escape hatches:</strong> <code>icon</code>, <code>leftSlot</code>, <code>rightSlot</code>, <code>renderItem</code>.</li>
  <li><strong>Default everything:</strong> <code>variant = 'primary'</code>, <code>size = 'md'</code>, <code>type = 'button'</code>.</li>
</ol>

<h3>Naming consistency rules</h3>
<table>
  <thead><tr><th>Pattern</th><th>Use</th><th>Don't</th></tr></thead>
  <tbody>
    <tr><td>Booleans</td><td><code>isLoading</code>, <code>isOpen</code></td><td><code>loading</code>, <code>open</code> ambiguous</td></tr>
    <tr><td>Events</td><td><code>onClick</code>, <code>onChange</code>, <code>onOpenChange</code></td><td><code>handleClick</code>, <code>onClickHandler</code></td></tr>
    <tr><td>Variants</td><td><code>variant</code>, <code>tone</code>, <code>intent</code></td><td><code>type</code> (collides with HTML)</td></tr>
    <tr><td>Sizes</td><td><code>size: 'sm' / 'md' / 'lg'</code></td><td><code>large={true}</code></td></tr>
    <tr><td>Slots</td><td><code>leftIcon</code>, <code>rightIcon</code></td><td><code>iconLeft</code> mid-word</td></tr>
  </tbody>
</table>

<h3>Composition patterns by use case</h3>
<table>
  <thead><tr><th>Pattern</th><th>When to use</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td>Plain props</td><td>Small surface, no internal structure exposed.</td><td><code>&lt;Button leftIcon={...} /&gt;</code></td></tr>
    <tr><td>Children</td><td>Free-form content area.</td><td><code>&lt;Card&gt;{anything}&lt;/Card&gt;</code></td></tr>
    <tr><td>Compound</td><td>Multiple parts must coordinate via shared state.</td><td><code>&lt;Tabs&gt;&lt;Tabs.List&gt;...&lt;/Tabs&gt;</code></td></tr>
    <tr><td>Render props / slots</td><td>Consumer needs to control rendering.</td><td><code>&lt;Combobox renderOption={fn} /&gt;</code></td></tr>
    <tr><td>Polymorphic <code>as</code></td><td>One component, multiple semantic tags.</td><td><code>&lt;Button as="a" href="..." /&gt;</code></td></tr>
    <tr><td>Headless + styled</td><td>Behaviour and styling decoupled.</td><td>Radix / Headless UI</td></tr>
  </tbody>
</table>

<h3>Controlled, uncontrolled, or both?</h3>
<p>Best library components support both. Pattern:</p>
<pre><code class="language-typescript">function useControllableState&lt;T&gt;({
  value,
  defaultValue,
  onChange,
}: {
  value?: T;
  defaultValue: T;
  onChange?: (next: T) =&gt; void;
}): [T, (next: T) =&gt; void] {
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;
  const set = (next: T) =&gt; {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };
  return [current, set];
}
</code></pre>
<p>Now <code>&lt;Switch /&gt;</code> works alone (uncontrolled), with <code>defaultChecked</code> (uncontrolled w/ initial), or with <code>checked + onChange</code> (controlled).</p>

<h3>Tokens before colours</h3>
<p>Hardcode <code>color: '#3b82f6'</code> in 50 places and a brand redesign costs 50 PRs. Tokens collapse this to one.</p>
<pre><code class="language-css">:root {
  --color-primary-50:  #eff6ff;
  --color-primary-500: #3b82f6;
  --color-primary-700: #1d4ed8;
  --color-text:        #111827;
  --color-bg:          #ffffff;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
[data-theme="dark"] {
  --color-text: #e5e7eb;
  --color-bg:   #0b0d10;
}
</code></pre>
<p>Components reference tokens, never raw values. Theme switches by toggling <code>data-theme</code> on <code>&lt;html&gt;</code>.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Anatomy of a primitive component (Button)</h3>
<pre><code class="language-typescript">type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes&lt;HTMLButtonElement&gt; {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isFullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef&lt;HTMLButtonElement, ButtonProps&gt;(
  ({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    isFullWidth = false,
    leftIcon,
    rightIcon,
    disabled,
    className,
    children,
    ...rest
  }, ref) =&gt; (
    &lt;button
      ref={ref}
      className={cx(
        'btn',
        \`btn--\${variant}\`,
        \`btn--\${size}\`,
        isFullWidth &amp;&amp; 'btn--full',
        isLoading &amp;&amp; 'btn--loading',
        className
      )}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...rest}
    &gt;
      {isLoading &amp;&amp; &lt;Spinner size="sm" /&gt;}
      {!isLoading &amp;&amp; leftIcon &amp;&amp; &lt;span className="btn__left"&gt;{leftIcon}&lt;/span&gt;}
      &lt;span className="btn__label"&gt;{children}&lt;/span&gt;
      {!isLoading &amp;&amp; rightIcon &amp;&amp; &lt;span className="btn__right"&gt;{rightIcon}&lt;/span&gt;}
    &lt;/button&gt;
  )
);
Button.displayName = 'Button';
</code></pre>

<h3>Why each choice</h3>
<ul>
  <li><strong><code>extends ButtonHTMLAttributes</code>:</strong> consumers get all native props (<code>type</code>, <code>onClick</code>, <code>aria-*</code>) for free.</li>
  <li><strong><code>forwardRef</code>:</strong> consumers can <code>focus()</code>, attach Reanimated, integrate with form libraries.</li>
  <li><strong><code>className</code> last in <code>cx</code>:</strong> consumer overrides win.</li>
  <li><strong><code>disabled || isLoading</code>:</strong> loading buttons must not be clickable.</li>
  <li><strong><code>aria-busy</code>:</strong> screen readers announce loading state.</li>
  <li><strong>Default <code>variant</code>:</strong> typing <code>&lt;Button&gt;Click&lt;/Button&gt;</code> just works.</li>
  <li><strong>No <code>onClick</code> required:</strong> button can be a form submit.</li>
</ul>

<h3>Polymorphic <code>as</code> prop</h3>
<pre><code class="language-typescript">type AsProp&lt;C extends ElementType&gt; = { as?: C };
type PropsToOmit&lt;C extends ElementType, P&gt; = keyof (AsProp&lt;C&gt; &amp; P);
type PolymorphicProps&lt;C extends ElementType, Props = {}&gt; =
  Props &amp; AsProp&lt;C&gt; &amp; Omit&lt;ComponentPropsWithoutRef&lt;C&gt;, PropsToOmit&lt;C, Props&gt;&gt;;

function Box&lt;C extends ElementType = 'div'&gt;({
  as,
  children,
  ...rest
}: PolymorphicProps&lt;C, { children?: ReactNode }&gt;) {
  const Component = as || 'div';
  return &lt;Component {...rest}&gt;{children}&lt;/Component&gt;;
}

// Usage:
&lt;Box as="a" href="/foo"&gt;link&lt;/Box&gt;       // a-tag props inferred
&lt;Box as={Link} to="/foo"&gt;link&lt;/Box&gt;      // RouterLink props inferred
</code></pre>

<h3>Compound components — Tabs example</h3>
<pre><code class="language-typescript">const TabsCtx = createContext&lt;{ value: string; setValue: (v: string) =&gt; void } | null&gt;(null);

export function Tabs({ value, defaultValue, onValueChange, children }: TabsProps) {
  const [v, setV] = useControllableState({ value, defaultValue: defaultValue ?? '', onChange: onValueChange });
  return &lt;TabsCtx.Provider value={{ value: v, setValue: setV }}&gt;{children}&lt;/TabsCtx.Provider&gt;;
}

Tabs.List = function TabsList({ children }: { children: ReactNode }) {
  return &lt;div role="tablist"&gt;{children}&lt;/div&gt;;
};

Tabs.Trigger = function TabsTrigger({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useContext(TabsCtx)!;
  const selected = ctx.value === value;
  return (
    &lt;button role="tab" aria-selected={selected} tabIndex={selected ? 0 : -1}
            onClick={() =&gt; ctx.setValue(value)}&gt;{children}&lt;/button&gt;
  );
};

Tabs.Panel = function TabsPanel({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useContext(TabsCtx)!;
  if (ctx.value !== value) return null;
  return &lt;div role="tabpanel"&gt;{children}&lt;/div&gt;;
};

// Usage:
&lt;Tabs defaultValue="home"&gt;
  &lt;Tabs.List&gt;
    &lt;Tabs.Trigger value="home"&gt;Home&lt;/Tabs.Trigger&gt;
    &lt;Tabs.Trigger value="profile"&gt;Profile&lt;/Tabs.Trigger&gt;
  &lt;/Tabs.List&gt;
  &lt;Tabs.Panel value="home"&gt;...&lt;/Tabs.Panel&gt;
  &lt;Tabs.Panel value="profile"&gt;...&lt;/Tabs.Panel&gt;
&lt;/Tabs&gt;
</code></pre>
<p>Why compound: consumers control <em>order</em>, <em>structure</em>, and <em>extra elements</em> between parts. They can wrap, conditionally render, or add layout — none of which a one-shot <code>tabs={[]}</code> prop allows.</p>

<h3>Controllable Modal with portal + focus trap</h3>
<pre><code class="language-typescript">interface ModalProps {
  isOpen?: boolean;          // controlled
  defaultOpen?: boolean;     // uncontrolled
  onOpenChange?: (open: boolean) =&gt; void;
  trigger?: ReactNode;       // optional uncontrolled trigger
  title: string;             // a11y label
  children: ReactNode;
}

export function Modal({ isOpen, defaultOpen, onOpenChange, trigger, title, children }: ModalProps) {
  const [open, setOpen] = useControllableState({
    value: isOpen,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  });
  const dialogRef = useRef&lt;HTMLDivElement&gt;(null);
  const triggerRef = useRef&lt;HTMLElement&gt;(null);

  useEffect(() =&gt; {
    if (!open) return;
    triggerRef.current = document.activeElement as HTMLElement;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) =&gt; { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () =&gt; {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    &lt;&gt;
      {trigger &amp;&amp; cloneElement(trigger as ReactElement, { onClick: () =&gt; setOpen(true) })}
      {open &amp;&amp; createPortal(
        &lt;div className="modal-backdrop" onClick={() =&gt; setOpen(false)}&gt;
          &lt;div ref={dialogRef} role="dialog" aria-modal="true" aria-label={title}
               tabIndex={-1} className="modal-dialog"
               onClick={e =&gt; e.stopPropagation()}&gt;
            {children}
          &lt;/div&gt;
        &lt;/div&gt;,
        document.body
      )}
    &lt;/&gt;
  );
}
</code></pre>

<h3>Theming with CSS custom properties + Provider</h3>
<pre><code class="language-typescript">type Theme = 'light' | 'dark';
const ThemeCtx = createContext&lt;{ theme: Theme; setTheme: (t: Theme) =&gt; void }&gt;({} as any);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useLocalStorage&lt;Theme&gt;('theme', 'light');
  useEffect(() =&gt; {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return (
    &lt;ThemeCtx.Provider value={{ theme, setTheme }}&gt;
      {children}
    &lt;/ThemeCtx.Provider&gt;
  );
}

export const useTheme = () =&gt; useContext(ThemeCtx);
</code></pre>

<h3>Variants utility (cva-style)</h3>
<pre><code class="language-typescript">type VariantConfig = {
  base: string;
  variants: Record&lt;string, Record&lt;string, string&gt;&gt;;
  defaults: Record&lt;string, string&gt;;
};

function cva(config: VariantConfig) {
  return (props: Record&lt;string, string&gt; = {}) =&gt; {
    const classes = [config.base];
    for (const [key, options] of Object.entries(config.variants)) {
      const value = props[key] ?? config.defaults[key];
      if (options[value]) classes.push(options[value]);
    }
    return classes.join(' ');
  };
}

const buttonClasses = cva({
  base: 'inline-flex items-center font-medium',
  variants: {
    variant: {
      primary:   'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
      ghost:     'bg-transparent hover:bg-gray-100',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4',
      lg: 'h-12 px-6 text-lg',
    },
  },
  defaults: { variant: 'primary', size: 'md' },
});

// Usage: buttonClasses({ variant: 'ghost', size: 'sm' })
</code></pre>

<h3>Accessibility primitives</h3>
<table>
  <thead><tr><th>Component</th><th>Required ARIA / behaviour</th></tr></thead>
  <tbody>
    <tr><td>Button</td><td>native <code>&lt;button&gt;</code>, focus visible, <code>aria-busy</code> when loading</td></tr>
    <tr><td>Input</td><td><code>&lt;label htmlFor&gt;</code>, <code>aria-invalid</code>, <code>aria-describedby</code> for errors</td></tr>
    <tr><td>Modal</td><td><code>role="dialog"</code>, <code>aria-modal</code>, focus trap, ESC closes, returns focus</td></tr>
    <tr><td>Tooltip</td><td><code>role="tooltip"</code>, shown on hover + focus, dismissed on ESC</td></tr>
    <tr><td>Tabs</td><td><code>role="tablist"</code> + <code>tab</code> + <code>tabpanel</code>, arrow keys, only active in tab order</td></tr>
    <tr><td>Toast</td><td><code>role="status"</code> or <code>aria-live="polite"</code>, dismissible</td></tr>
    <tr><td>Combobox</td><td><code>role="combobox"</code>, <code>aria-expanded</code>, <code>aria-activedescendant</code>, <code>aria-autocomplete</code></td></tr>
    <tr><td>Switch</td><td><code>role="switch"</code> or native checkbox, <code>aria-checked</code></td></tr>
  </tbody>
</table>

<h3>The <code>cx</code> / <code>clsx</code> helper</h3>
<pre><code class="language-typescript">function cx(...inputs: Array&lt;string | false | null | undefined&gt;) {
  return inputs.filter(Boolean).join(' ');
}
</code></pre>
<p>Tiny but ubiquitous. Don't reach for a dependency in a 60-min round.</p>

<h3>Exporting from the library</h3>
<pre><code class="language-typescript">// src/index.ts
export { Button } from './Button';
export type { ButtonProps } from './Button';
export { Tabs } from './Tabs';
export { Modal } from './Modal';
export { ThemeProvider, useTheme } from './theme';
// ...
</code></pre>
<p>Always export both runtime and types. Library consumers need the types for their own props plumbing.</p>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Input with label, error, helper text</h3>
<pre><code class="language-typescript">interface InputProps extends Omit&lt;React.InputHTMLAttributes&lt;HTMLInputElement&gt;, 'size'&gt; {
  label: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
}

export const Input = forwardRef&lt;HTMLInputElement, InputProps&gt;(
  ({ label, error, helperText, size = 'md', leftSlot, rightSlot, id, className, ...rest }, ref) =&gt; {
    const reactId = useId();
    const inputId = id ?? reactId;
    const helperId = \`\${inputId}-helper\`;
    const errorId = \`\${inputId}-error\`;
    return (
      &lt;div className={cx('field', \`field--\${size}\`, error &amp;&amp; 'field--error', className)}&gt;
        &lt;label htmlFor={inputId}&gt;{label}&lt;/label&gt;
        &lt;div className="field__control"&gt;
          {leftSlot &amp;&amp; &lt;span className="field__left"&gt;{leftSlot}&lt;/span&gt;}
          &lt;input
            id={inputId} ref={ref}
            aria-invalid={!!error || undefined}
            aria-describedby={cx(error ? errorId : null, helperText ? helperId : null) || undefined}
            {...rest} /&gt;
          {rightSlot &amp;&amp; &lt;span className="field__right"&gt;{rightSlot}&lt;/span&gt;}
        &lt;/div&gt;
        {helperText &amp;&amp; !error &amp;&amp; &lt;p id={helperId} className="field__helper"&gt;{helperText}&lt;/p&gt;}
        {error &amp;&amp; &lt;p id={errorId} className="field__error" role="alert"&gt;{error}&lt;/p&gt;}
      &lt;/div&gt;
    );
  }
);
Input.displayName = 'Input';
</code></pre>
<p>Notes: <code>useId</code> handles SSR-safe unique IDs; <code>aria-describedby</code> ties helper / error to the input; <code>role="alert"</code> announces validation errors immediately.</p>

<h3>Example 2: Toast system (provider + queue + portal)</h3>
<pre><code class="language-typescript">type ToastType = 'info' | 'success' | 'warning' | 'error';
interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

const ToastCtx = createContext&lt;{
  show: (msg: string, opts?: { type?: ToastType; duration?: number }) =&gt; number;
  dismiss: (id: number) =&gt; void;
}&gt;({} as any);

export const useToast = () =&gt; useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState&lt;Toast[]&gt;([]);
  const idRef = useRef(0);
  const timersRef = useRef(new Map&lt;number, ReturnType&lt;typeof setTimeout&gt;&gt;());

  const dismiss = useCallback((id: number) =&gt; {
    const t = timersRef.current.get(id);
    if (t) clearTimeout(t);
    timersRef.current.delete(id);
    setToasts(ts =&gt; ts.filter(x =&gt; x.id !== id));
  }, []);

  const show = useCallback((message: string, opts: { type?: ToastType; duration?: number } = {}) =&gt; {
    const id = ++idRef.current;
    const toast: Toast = {
      id,
      message,
      type: opts.type ?? 'info',
      duration: opts.duration ?? 4000,
    };
    setToasts(ts =&gt; [...ts, toast]);
    if (toast.duration &gt; 0) {
      timersRef.current.set(id, setTimeout(() =&gt; dismiss(id), toast.duration));
    }
    return id;
  }, [dismiss]);

  useEffect(() =&gt; () =&gt; { timersRef.current.forEach(clearTimeout); }, []);

  return (
    &lt;ToastCtx.Provider value={{ show, dismiss }}&gt;
      {children}
      {createPortal(
        &lt;div className="toast-region" aria-live="polite" aria-atomic="false"&gt;
          {toasts.map(t =&gt; (
            &lt;div key={t.id} className={\`toast toast--\${t.type}\`} role="status"&gt;
              {t.message}
              &lt;button aria-label="Dismiss" onClick={() =&gt; dismiss(t.id)}&gt;×&lt;/button&gt;
            &lt;/div&gt;
          ))}
        &lt;/div&gt;,
        document.body
      )}
    &lt;/ToastCtx.Provider&gt;
  );
}
</code></pre>
<p>Senior signals: timers cleaned up on dismiss, on unmount; <code>aria-live="polite"</code> for non-urgent updates; portal so toasts escape parent overflow; clear separation between queue (state) and presentation.</p>

<h3>Example 3: Tooltip (hover + focus, with positioning)</h3>
<pre><code class="language-typescript">interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delayMs?: number;
}

export function Tooltip({ content, children, side = 'top', delayMs = 300 }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef&lt;HTMLElement&gt;(null);
  const tipRef = useRef&lt;HTMLDivElement&gt;(null);
  const timeoutRef = useRef&lt;ReturnType&lt;typeof setTimeout&gt;&gt;();
  const id = useId();

  const show = () =&gt; {
    timeoutRef.current = setTimeout(() =&gt; setOpen(true), delayMs);
  };
  const hide = () =&gt; {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(false);
  };

  useEffect(() =&gt; {
    if (!open || !triggerRef.current || !tipRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const t = tipRef.current.getBoundingClientRect();
    const map = {
      top:    { top: r.top - t.height - 8, left: r.left + r.width / 2 - t.width / 2 },
      bottom: { top: r.bottom + 8,         left: r.left + r.width / 2 - t.width / 2 },
      left:   { top: r.top + r.height / 2 - t.height / 2, left: r.left - t.width - 8 },
      right:  { top: r.top + r.height / 2 - t.height / 2, left: r.right + 8 },
    };
    setCoords(map[side]);
  }, [open, side]);

  const trigger = cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: show, onMouseLeave: hide,
    onFocus: show,      onBlur: hide,
    'aria-describedby': open ? id : undefined,
  });

  return (
    &lt;&gt;
      {trigger}
      {open &amp;&amp; createPortal(
        &lt;div ref={tipRef} role="tooltip" id={id} className="tooltip"
             style={{ position: 'fixed', top: coords.top, left: coords.left }}&gt;
          {content}
        &lt;/div&gt;,
        document.body
      )}
    &lt;/&gt;
  );
}
</code></pre>
<p>Demos: hover, focus (Tab to button), ESC dismiss, four sides, viewport-edge fallback (next pass).</p>

<h3>Example 4: Combobox / Select with keyboard nav</h3>
<pre><code class="language-typescript">interface SelectProps&lt;T&gt; {
  options: { value: T; label: string }[];
  value?: T;
  defaultValue?: T;
  onChange?: (v: T) =&gt; void;
  placeholder?: string;
}

export function Select&lt;T&gt;({ options, value, defaultValue, onChange, placeholder = 'Select…' }: SelectProps&lt;T&gt;) {
  const [v, setV] = useControllableState&lt;T | undefined&gt;({ value, defaultValue, onChange });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef&lt;HTMLDivElement&gt;(null);
  useOnClickOutside(wrapRef, () =&gt; setOpen(false));
  const id = useId();

  const onKey = (e: KeyboardEvent&lt;HTMLDivElement&gt;) =&gt; {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive(i =&gt; Math.min(i + 1, options.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(i =&gt; Math.max(i - 1, 0)); }
    if (e.key === 'Enter' &amp;&amp; open) { setV(options[active].value); setOpen(false); }
    if (e.key === 'Escape') setOpen(false);
  };

  const selectedLabel = options.find(o =&gt; o.value === v)?.label ?? placeholder;

  return (
    &lt;div ref={wrapRef} className="select" onKeyDown={onKey}&gt;
      &lt;button type="button"
              role="combobox" aria-haspopup="listbox" aria-expanded={open}
              aria-controls={id}
              onClick={() =&gt; setOpen(o =&gt; !o)}&gt;{selectedLabel}&lt;/button&gt;
      {open &amp;&amp; (
        &lt;ul id={id} role="listbox" className="select__menu"&gt;
          {options.map((o, i) =&gt; (
            &lt;li key={String(o.value)} role="option"
                aria-selected={o.value === v}
                className={cx(i === active &amp;&amp; 'is-active')}
                onMouseEnter={() =&gt; setActive(i)}
                onClick={() =&gt; { setV(o.value); setOpen(false); }}&gt;
              {o.label}
            &lt;/li&gt;
          ))}
        &lt;/ul&gt;
      )}
    &lt;/div&gt;
  );
}
</code></pre>
<p>Generic <code>&lt;T&gt;</code> means consumers preserve their value type — <code>Select&lt;UserId&gt;</code> won't accept strings.</p>

<h3>Example 5: Switch (controlled-or-uncontrolled, fully a11y)</h3>
<pre><code class="language-typescript">interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) =&gt; void;
  label?: string;
  disabled?: boolean;
}

export const Switch = forwardRef&lt;HTMLButtonElement, SwitchProps&gt;(
  ({ checked, defaultChecked = false, onCheckedChange, label, disabled }, ref) =&gt; {
    const [c, setC] = useControllableState({
      value: checked,
      defaultValue: defaultChecked,
      onChange: onCheckedChange,
    });
    return (
      &lt;button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={c}
        aria-label={label}
        disabled={disabled}
        onClick={() =&gt; setC(!c)}
        className={cx('switch', c &amp;&amp; 'switch--on')}
      &gt;
        &lt;span className="switch__thumb" /&gt;
      &lt;/button&gt;
    );
  }
);
Switch.displayName = 'Switch';
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>The reusability trap</h3>
<p>Every prop you add is a contract you can't easily change. Defaults:</p>
<ul>
  <li>Don't add a prop until two consumers need it.</li>
  <li>Variants are union strings, not booleans (open-set vs closed-set).</li>
  <li>Always allow <code>className</code> + <code>...rest</code> as escape hatches; don't try to anticipate every override.</li>
  <li>Allow children where natural; avoid <code>title</code> + <code>subtitle</code> + <code>icon</code> + <code>action</code> as 4 props when 1 <code>children</code> + composition would do.</li>
</ul>

<h3>Controlled / uncontrolled gotchas</h3>
<table>
  <thead><tr><th>Bug</th><th>Cause</th><th>Fix</th></tr></thead>
  <tbody>
    <tr><td>Switch from uncontrolled to controlled mid-life</td><td>Passing <code>value</code> after initial render</td><td>Warn or pick mode at mount</td></tr>
    <tr><td>Defaults silently override</td><td><code>value={null}</code> read as "controlled" but blank</td><td>Treat <code>undefined</code> as uncontrolled</td></tr>
    <tr><td>onChange not called for default</td><td>Initial render doesn't fire onChange</td><td>Document; consumers shouldn't expect it</td></tr>
  </tbody>
</table>

<h3>Refs and ref forwarding</h3>
<ul>
  <li>Always wrap with <code>forwardRef</code> for components that map to a DOM node — consumers need to <code>focus()</code>, measure, scroll into view.</li>
  <li>For composite components (Tabs, Modal), forward ref to the most "addressable" element (the <code>tablist</code> or <code>dialog</code>).</li>
  <li>Use <code>useImperativeHandle</code> sparingly: exposes a public API like <code>{ open(), close(), focus() }</code>.</li>
  <li>Set <code>displayName</code> after <code>forwardRef</code> so React DevTools shows the right name.</li>
</ul>

<h3>SSR safety</h3>
<ul>
  <li>Don't access <code>window</code> / <code>document</code> in render. Wrap in <code>useEffect</code> or guard <code>typeof window !== 'undefined'</code>.</li>
  <li>Use <code>useId</code> (React 18+) for unique IDs that match between server and client.</li>
  <li>Portals require a target element — render <code>null</code> on server, mount in <code>useEffect</code>.</li>
  <li>Hydration mismatches: theme toggling can flash. Use <code>data-theme</code> on <code>&lt;html&gt;</code> set by an inline script before React boots.</li>
</ul>

<h3>RTL (right-to-left) and i18n</h3>
<ul>
  <li>Use logical CSS properties: <code>margin-inline-start</code> over <code>margin-left</code>.</li>
  <li>Mirror icons (chevron-right → chevron-left in RTL) automatically: <code>[dir="rtl"] .chevron { transform: scaleX(-1) }</code>.</li>
  <li>Date/number formatting via <code>Intl</code> — never hardcode separators.</li>
  <li>Strings must be props, never inlined; supports translation.</li>
</ul>

<h3>Theming edges</h3>
<ul>
  <li>Hardcoded colour values inside components break dark mode. Use tokens.</li>
  <li>Animations on <code>prefers-reduced-motion</code> — gate with a media query.</li>
  <li>System theme: respect <code>prefers-color-scheme</code> as the default; let user override.</li>
  <li>Dynamic accent colour (brand themes) — themeable via CSS custom properties at runtime.</li>
</ul>

<h3>Accessibility edges</h3>
<ul>
  <li>Focus visible only on keyboard, not mouse: <code>:focus-visible</code>, never <code>outline: none</code> alone.</li>
  <li>Form errors: announce with <code>role="alert"</code> or <code>aria-live="assertive"</code>; tie to input via <code>aria-describedby</code>.</li>
  <li>Loading states: <code>aria-busy</code> on container; spinners need <code>aria-label</code>.</li>
  <li>Modals: <code>aria-modal="true"</code> + focus trap + return focus.</li>
  <li>Tooltips: never put critical info in a tooltip — keyboard / mobile users may miss it.</li>
  <li>Colour-only meaning is forbidden — pair with text or icon.</li>
</ul>

<h3>Performance edges</h3>
<ul>
  <li>Long lists in <code>&lt;Select&gt;</code> — virtualize beyond ~200 options.</li>
  <li>Modal mount cost — defer heavy children behind an <code>isOpen</code> guard.</li>
  <li>Tooltip thrash on mousemove — debounce or use IntersectionObserver.</li>
  <li>Theme switch: avoid re-mounting; use CSS variables which the browser repaints in one pass.</li>
  <li>Memoize children when stable: pass <code>useCallback</code> handlers and stable refs.</li>
</ul>

<h3>Bundle size edges</h3>
<ul>
  <li>Tree-shake by exporting from index, not bundling all into one file.</li>
  <li>Side-effect-free imports: <code>"sideEffects": false</code> in package.json.</li>
  <li>Don't import Lodash whole; use <code>lodash-es/debounce</code>.</li>
  <li>Polyfill on demand — don't ship for IE11 if no consumer needs it.</li>
  <li>Icons: ship as separate components, not a giant sprite.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common library bugs</h3>
<ol>
  <li><strong>Hardcoded colours.</strong> Brand changes turn into 100-PR migrations. Use tokens.</li>
  <li><strong>30 boolean props.</strong> Should be variant union strings.</li>
  <li><strong><code>div onClick</code>.</strong> Loses keyboard, screen-reader, focus. Use <code>&lt;button&gt;</code>.</li>
  <li><strong>No <code>forwardRef</code>.</strong> Consumers can't <code>focus()</code> or attach refs.</li>
  <li><strong>Swallowing <code>className</code>.</strong> No escape hatch — consumers can't override.</li>
  <li><strong>Deep prop drilling instead of context.</strong> Compound components get unmaintainable.</li>
  <li><strong>Inline objects as default props.</strong> <code>options = []</code> creates a new array each render — breaks memo.</li>
  <li><strong>Setting state in render.</strong> Triggers infinite loop.</li>
  <li><strong>Missing cleanup in <code>useEffect</code>.</strong> Listeners / timers leak.</li>
  <li><strong>Hard-coded copy.</strong> "Submit", "Loading" — block i18n.</li>
  <li><strong>No keyboard support.</strong> Custom widgets without arrow / Enter / ESC handlers.</li>
  <li><strong>Re-implementing native.</strong> Custom checkbox missing <code>indeterminate</code>; custom select missing native form integration.</li>
</ol>

<h3>Anti-pattern: prop explosion</h3>
<pre><code class="language-typescript">// BAD
interface ButtonProps {
  isPrimary?: boolean;
  isSecondary?: boolean;
  isDanger?: boolean;
  isGhost?: boolean;
  isSmall?: boolean;
  isLarge?: boolean;
  isFullWidth?: boolean;
  isLoading?: boolean;
  // ... 22 more flags
}

// GOOD
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isFullWidth?: boolean;
  isLoading?: boolean;
}
</code></pre>

<h3>Anti-pattern: forbidden combinations</h3>
<p>Use TypeScript discriminated unions to forbid invalid prop combos:</p>
<pre><code class="language-typescript">type ButtonProps =
  | { variant: 'primary' | 'secondary' | 'ghost'; danger?: never }
  | { variant: 'danger'; danger: true };
// Now &lt;Button variant="primary" danger /&gt; is a type error.
</code></pre>

<h3>Anti-pattern: rendering children of unknown shape</h3>
<pre><code class="language-typescript">// BAD — what if children is a string? a fragment? null?
function Card({ children }) {
  return cloneElement(children, { className: 'card' });
}

// GOOD — wrap consistently
function Card({ children, className }) {
  return &lt;div className={cx('card', className)}&gt;{children}&lt;/div&gt;;
}
</code></pre>

<h3>Anti-pattern: hardcoded portal target</h3>
<pre><code class="language-typescript">// BAD — fails on SSR, breaks if root element is renamed
createPortal(node, document.getElementById('modal-root'))

// GOOD — fall back to body, defer to consumer if needed
createPortal(node, container ?? document.body)
</code></pre>

<h3>Anti-pattern: no <code>data-*</code> for testing</h3>
<p>Add <code>data-testid</code> support so consumer tests can target elements without depending on class names. Better yet: use semantic queries (role, label) and don't need testids at all.</p>

<h3>Anti-pattern: leaking internal state</h3>
<pre><code class="language-typescript">// BAD — callback fires on every keystroke
&lt;Input onChange={(e) =&gt; setQuery(e.target.value)} /&gt;
// Then debounce inside the consumer? That's the library's job.

// GOOD — library exposes both
&lt;SearchInput onSearch={setQuery} debounceMs={300} /&gt;
</code></pre>

<h3>Anti-pattern: blocking native form integration</h3>
<p>Custom <code>&lt;Select&gt;</code> built from <code>&lt;div&gt;</code>s won't submit with a form. Either use a hidden <code>&lt;input name=...&gt;</code> mirror, or use the native <code>&lt;select&gt;</code> for form scenarios.</p>

<h3>Anti-pattern: inconsistent event names</h3>
<table>
  <thead><tr><th>Bad</th><th>Good</th></tr></thead>
  <tbody>
    <tr><td><code>handleClick</code>, <code>onClickHandler</code>, <code>clickHandler</code></td><td><code>onClick</code></td></tr>
    <tr><td><code>onClose</code>, <code>onDismiss</code>, <code>onCancel</code> (mixed)</td><td>pick one and stick with it across the lib</td></tr>
    <tr><td><code>onChange</code> sometimes, <code>onValueChange</code> elsewhere</td><td>use <code>onValueChange</code> when the component owns more than the input value</td></tr>
  </tbody>
</table>

<h3>Anti-pattern: CSS-in-JS bloat in a 60-min round</h3>
<p>Don't pull in styled-components / emotion / vanilla-extract for an interview. Plain CSS or Tailwind classes ship faster. Talk about which you'd reach for in production and why.</p>

<h3>Anti-pattern: forgetting <code>type="button"</code></h3>
<pre><code class="language-html">&lt;!-- BAD — defaults to type="submit" inside a form, submits unexpectedly --&gt;
&lt;button onClick={...}&gt;Cancel&lt;/button&gt;

&lt;!-- GOOD --&gt;
&lt;button type="button" onClick={...}&gt;Cancel&lt;/button&gt;
</code></pre>
<p>Library Button must default <code>type</code> to <code>"button"</code>, not the HTML default of <code>"submit"</code>.</p>

<h3>Anti-pattern: no <code>displayName</code></h3>
<p><code>forwardRef</code> components show as "ForwardRef" in DevTools without an explicit <code>displayName</code>. Always set it.</p>

<h3>Anti-pattern: no escape hatch for custom rendering</h3>
<pre><code class="language-typescript">// BAD — can't render avatar / formatted text
&lt;Select options={[{ value: 1, label: 'foo' }]} /&gt;

// GOOD — slot for rendering
&lt;Select options={items} renderOption={(o) =&gt; &lt;Avatar user={o.user} /&gt;} /&gt;
</code></pre>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>The 60-minute component-library round playbook</h3>
<table>
  <thead><tr><th>Phase</th><th>Time</th><th>Output</th></tr></thead>
  <tbody>
    <tr><td>Clarify scope + audience</td><td>0–3 min</td><td>"Library or one-off?" "Web only?" "What's the design system context?"</td></tr>
    <tr><td>Design props API on paper / comments</td><td>3–10 min</td><td>Props interface, variants, sizes, slots.</td></tr>
    <tr><td>Skeleton + tokens</td><td>10–15 min</td><td>Renders with hardcoded variant + tokens defined.</td></tr>
    <tr><td>Variants + states</td><td>15–35 min</td><td>All variants + sizes + loading + disabled + error.</td></tr>
    <tr><td>A11y + keyboard</td><td>35–45 min</td><td>ARIA, focus, keyboard handlers.</td></tr>
    <tr><td>Demo / Storybook-style examples</td><td>45–55 min</td><td>Show variants in a runnable file.</td></tr>
    <tr><td>Walkthrough + closers</td><td>55–60 min</td><td>"If I had more time…"</td></tr>
  </tbody>
</table>

<h3>Clarifying questions to always ask</h3>
<ol>
  <li><em>"Is this for an existing design system or greenfield?"</em></li>
  <li><em>"Who are the consumers — internal app teams, external partners, OSS users?"</em></li>
  <li><em>"What variants and states do you expect — variant, size, loading, disabled, danger?"</em></li>
  <li><em>"Should this be polymorphic (<code>as</code> prop) or fixed?"</em></li>
  <li><em>"Controlled, uncontrolled, or both?"</em></li>
  <li><em>"Web only, or should it work in RN too?"</em></li>
  <li><em>"How much theming do we need — light/dark, brand variants?"</em></li>
  <li><em>"Are there existing primitives I should reuse — Box, Stack, Text?"</em></li>
</ol>
<p>Each one is a chance to surface a tradeoff worth grading.</p>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"Build a Button"</td><td>variant + size + states + forwardRef + native props extension</td></tr>
    <tr><td>"Build an Input"</td><td>label + error + helperText + aria-describedby + useId</td></tr>
    <tr><td>"Build a Modal"</td><td>portal + focus trap + ESC + scroll lock + controlled-or-uncontrolled</td></tr>
    <tr><td>"Build a Tooltip"</td><td>portal + positioning + hover + focus + ESC</td></tr>
    <tr><td>"Build a Select / Combobox"</td><td>combobox role + listbox + arrow keys + activedescendant</td></tr>
    <tr><td>"Build Tabs"</td><td>compound + tablist/tab/tabpanel + arrow keys</td></tr>
    <tr><td>"Build a Toast system"</td><td>provider + queue + portal + aria-live + auto-dismiss</td></tr>
    <tr><td>"Build a Drawer"</td><td>same as Modal + slide-in animation + side prop</td></tr>
    <tr><td>"Build an Accordion"</td><td>compound + button + region + aria-expanded + aria-controls</td></tr>
    <tr><td>"Build a Switch / Checkbox"</td><td>controlled-or-uncontrolled + role="switch" + aria-checked</td></tr>
    <tr><td>"Build a DatePicker"</td><td>composed: Input + Popover + Calendar grid + keyboard</td></tr>
    <tr><td>"Build a Theme system"</td><td>tokens + CSS variables + provider + data-theme attribute</td></tr>
  </tbody>
</table>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"Variant as a string literal union, not booleans — closes the set, makes refactors safe."</em></li>
  <li><em>"I'm forwarding refs because consumers may need to focus, animate, or attach observers."</em></li>
  <li><em>"This component is controllable: pass <code>value</code> for controlled, <code>defaultValue</code> for uncontrolled. Best of both."</em></li>
  <li><em>"Compound components for Tabs because consumers want to control structure — wrap, conditionally render, add layout between parts."</em></li>
  <li><em>"CSS variables for theming so dark mode is one data attribute, not a re-render."</em></li>
  <li><em>"Native button under the hood — keyboard, screen reader, focus, all free."</em></li>
  <li><em>"<code>aria-describedby</code> ties the helper text to the input — screen readers announce both."</em></li>
  <li><em>"<code>useId</code> for SSR-safe unique IDs."</em></li>
</ul>

<h3>Demo script</h3>
<ol>
  <li>Show all variants side by side.</li>
  <li>Show all sizes side by side.</li>
  <li>Demo states: default, hover, active, focus, disabled, loading, error.</li>
  <li>Demo controlled vs uncontrolled.</li>
  <li>Demo keyboard: Tab to focus, Enter / Space to activate, arrow keys for menus.</li>
  <li>Toggle dark mode via theme provider.</li>
  <li>Show <code>className</code> override working.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"Add Storybook stories for every variant."</em></li>
  <li><em>"Add visual regression tests with Chromatic / Playwright snapshots."</em></li>
  <li><em>"Add unit tests with RTL — keyboard interactions, ARIA roles, controlled/uncontrolled flows."</em></li>
  <li><em>"Add a11y tests with <code>jest-axe</code> in CI."</em></li>
  <li><em>"Build out the token layer with semantic tokens (intent.primary.bg) over raw scales."</em></li>
  <li><em>"Polymorphic <code>as</code> with proper TypeScript narrowing."</em></li>
  <li><em>"RTL support — logical CSS properties, mirrored icons."</em></li>
  <li><em>"Animation primitive integrated with prefers-reduced-motion."</em></li>
  <li><em>"Headless variant — separate behaviour hook + presentational shell."</em></li>
  <li><em>"Tree-shake-friendly exports + side-effect-free package.json flag."</em></li>
  <li><em>"Track usage with telemetry — which variants are popular?"</em></li>
  <li><em>"RN parity layer for the same primitives where it makes sense."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour they're tracking</th></tr></thead>
  <tbody>
    <tr><td>Props API design</td><td>Variant unions, defaults, escape hatches, naming consistency</td></tr>
    <tr><td>Composition</td><td>Compound vs monolithic; slots vs flags</td></tr>
    <tr><td>forwardRef discipline</td><td>Refs forwarded, displayName set</td></tr>
    <tr><td>A11y default</td><td>Did they reach for ARIA / keyboard without prompting?</td></tr>
    <tr><td>Theming</td><td>Tokens / CSS variables / provider — or hardcoded?</td></tr>
    <tr><td>TypeScript</td><td>Narrow types, generics, discriminated unions for invalid states</td></tr>
    <tr><td>Controlled-or-uncontrolled</td><td>Both modes supported cleanly</td></tr>
    <tr><td>Edge cases</td><td>SSR, RTL, disabled, loading, error, empty</td></tr>
    <tr><td>Restraint</td><td>Did they avoid prop explosion and over-abstraction?</td></tr>
    <tr><td>Production sense</td><td>Closers about Storybook, tests, visual regression</td></tr>
  </tbody>
</table>

<h3>Common red flags to avoid</h3>
<ul>
  <li>30 boolean props instead of variant unions.</li>
  <li>Using <code>div</code> with <code>onClick</code> for buttons or links.</li>
  <li>No keyboard support for custom widgets.</li>
  <li>No <code>forwardRef</code> on DOM-mapped components.</li>
  <li>Hardcoded colours / spacing.</li>
  <li>Library imports an animation lib for a 60-min build.</li>
  <li>One mega-component instead of compound parts.</li>
  <li>No <code>className</code> escape hatch.</li>
  <li>Mixing controlled state (parent owns) with internal state (component owns) for the same prop.</li>
  <li>Inline object literals as default props (re-creates each render).</li>
  <li>Skipping <code>aria-modal</code>, <code>aria-live</code>, <code>aria-describedby</code> where required.</li>
</ul>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN component libraries map almost 1:1: <code>Pressable</code> for Button (not <code>TouchableOpacity</code>), <code>Modal</code> built-in but limited (use react-native-modal for portal-like behaviour).</li>
  <li>Theming via context + StyleSheet (no CSS variables) — pre-compute styles per theme, switch via theme prop.</li>
  <li>Cross-platform shared lib: behaviour hooks (e.g., <code>useDisclosure</code>) live in shared, presentational layer per platform.</li>
  <li>A11y: <code>accessibilityRole</code>, <code>accessibilityState</code>, <code>accessibilityLabel</code> instead of ARIA attributes.</li>
  <li>Keyboard isn't usually a concern on mobile but TalkBack / VoiceOver are — the same focus management still matters.</li>
  <li>Animations: Reanimated worklets for 60fps; never animate with JS-driven Animated.</li>
</ul>

<h3>Deep questions interviewers ask after the build</h3>
<ul>
  <li><em>"How would you handle a brand redesign — change primary colour everywhere?"</em> — tokens.</li>
  <li><em>"How would you ship dark mode?"</em> — <code>data-theme</code> + CSS variables, no re-render.</li>
  <li><em>"How would you test this?"</em> — RTL for behaviour, <code>jest-axe</code> for a11y, Chromatic for visual.</li>
  <li><em>"What if a consumer needs to add a new variant?"</em> — polymorphic with <code>as</code>, or a render slot, or fork.</li>
  <li><em>"How would you support RTL?"</em> — logical CSS properties; mirrored icons via <code>[dir]</code> selector.</li>
  <li><em>"How would you handle controlled / uncontrolled correctly?"</em> — <code>useControllableState</code> hook.</li>
  <li><em>"What's your bundle size strategy?"</em> — named exports, side-effect-free, tree-shake-friendly.</li>
  <li><em>"How would you migrate consumers from v1 to v2?"</em> — codemods + deprecation warnings + parallel exports.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Memorise the props-API checklist (variant, size, states, slots, escape hatches, forwardRef).</li>
  <li>Build Button, Input, Modal, Tabs, Toast, Select once each from scratch.</li>
  <li>Memorise the <code>useControllableState</code> hook.</li>
  <li>Memorise the <code>cx</code> / <code>cva</code> helpers (tiny implementations).</li>
  <li>Memorise the ARIA roles / attributes for the 12 most common components.</li>
  <li>Practice the demo script: variants, sizes, states, dark mode, keyboard.</li>
  <li>Have 5 "if I had more time" closers locked in.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"I'd study Radix UI primitives — they're a masterclass in headless components."</li>
  <li>"I'd read the Reach UI / React Aria source for ARIA implementation patterns."</li>
  <li>"I'd practice a polymorphic <code>as</code> prop with proper TypeScript narrowing."</li>
  <li>"I'd build a tiny token system + theme provider end-to-end."</li>
  <li>"I'd record myself doing a Modal or Combobox round and watch for missed a11y."</li>
  <li>"I'd study the React Native Pressable + accessibilityRole API for cross-platform parity."</li>
</ul>

<h3>Machine Coding module summary</h3>
<p>This module pairs with <code>mc-patterns</code> (Core Patterns) and <code>rn-machine-coding</code> (RN-specific). Together they cover:</p>
<ul>
  <li><strong>Patterns:</strong> the 15 reusable building blocks (debounce, autocomplete, infinite scroll, modal, toast, OTP, form, carousel, drag, virtualization, theme).</li>
  <li><strong>Components:</strong> the 12 design-system primitives (Button, Input, Select, Modal, Tooltip, Tabs, Toast, Switch, Drawer, Combobox, Accordion, plus theming).</li>
  <li><strong>RN flavour:</strong> Pressable, FlatList, KeyboardAvoidingView, MMKV, Reanimated — same patterns, different primitives.</li>
</ul>
<p>Together: 60–90 minute live builds where you ship a working, reusable, accessible piece. Recognise the prompt → name the pattern → build the skeleton → demo all states → close with what's missing.</p>
`
    }
  ]
});
