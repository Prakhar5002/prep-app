window.PREP_SITE.registerTopic({
  id: 'rn-machine-coding',
  module: 'rn',
  title: 'Machine Coding (React Native)',
  estimatedReadTime: '50 min',
  tags: ['machine-coding', 'react-native', 'flatlist', 'forms', 'infinite-scroll', 'otp', 'live-coding', 'interview-build'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>A <strong>machine-coding round</strong> in a React Native interview is a 60–90 minute live build of a small, runnable feature. The interviewer is grading three things at once: <strong>can you ship a working thing</strong>, <strong>can you make principled architectural calls under time pressure</strong>, and <strong>can you talk through tradeoffs while typing</strong>.</p>
<ul>
  <li><strong>Most common asks:</strong> infinite-scroll feed, OTP input, autocomplete with debounce, swipe-to-delete row, image carousel, multi-step form, todo + offline persistence, pull-to-refresh, tabs, search.</li>
  <li><strong>Skeleton in 5 minutes:</strong> screen file → layout → state model → wire data → polish. Don't get stuck on styling early.</li>
  <li><strong>Default stack:</strong> Functional components + hooks, FlatList for any list, MMKV/AsyncStorage for persistence, React Query or a tiny <code>useFetch</code> for data, Reanimated for non-trivial animation.</li>
  <li><strong>Always demo:</strong> empty state, loading state, error state, golden path, edge case. If you don't show these, the interviewer assumes they don't work.</li>
  <li><strong>Always say:</strong> "If I had more time I would…" — testing, accessibility, retries, virtualization budget, theming. Naming gaps you didn't fill is worth points.</li>
</ul>
<p><strong>Mantra:</strong> "Working &gt; pretty &gt; clever. Narrate every tradeoff."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What is a React Native machine-coding round?</h3>
<p>Unlike DSA rounds (one function, one return value) or system design (whiteboard only, no code), machine coding is a <em>build</em>. You open an editor — usually a sandbox like Expo Snack, CodeSandbox, or a starter repo cloned to your machine — and produce a working feature in 60 to 90 minutes. The interviewer watches you type.</p>

<h3>Why companies run this round</h3>
<table>
  <thead><tr><th>What it tests</th><th>Why it matters on a mobile team</th></tr></thead>
  <tbody>
    <tr><td>Can you actually ship code, not just whiteboard it</td><td>Mobile teams ship many small features per sprint; throughput matters</td></tr>
    <tr><td>Do you reach for the right primitives (FlatList, Animated, hooks)</td><td>RN-specific knowledge separates a "knows React" candidate from a "knows React Native" one</td></tr>
    <tr><td>Architecture under pressure</td><td>Real on-call/feature work is also under pressure — interviewers want to see your defaults</td></tr>
    <tr><td>State of mind around edge cases</td><td>Mobile bugs hit one device, one OS, one network state — edge-case awareness is everything</td></tr>
    <tr><td>Communication while building</td><td>You'll explain decisions in PR review, design docs, and incident reviews</td></tr>
  </tbody>
</table>

<h3>How it differs from a web React machine-coding round</h3>
<ul>
  <li><strong>Touch first.</strong> Click handlers become <code>onPress</code>; hover doesn't exist; you must think long-press, swipe, pull-to-refresh.</li>
  <li><strong>Lists are the centerpiece.</strong> Many RN rounds are explicitly "build a feed / chat / inbox" because virtualized lists are where most performance bugs live in mobile apps.</li>
  <li><strong>Keyboard handling is mandatory.</strong> Forms, search, OTP — anything with input — needs <code>KeyboardAvoidingView</code>, dismiss-on-tap-outside, focus management. Web candidates routinely forget this.</li>
  <li><strong>Safe areas, not just margins.</strong> Notches, dynamic island, gesture bar — every screen must respect <code>useSafeAreaInsets</code>.</li>
  <li><strong>Native fluidity expected.</strong> Animation that runs on the JS thread feels janky immediately on devices. Reanimated worklets / <code>useNativeDriver</code> are interview-level table stakes.</li>
  <li><strong>Offline is a first-class state.</strong> "What if the network drops mid-fetch?" gets asked far more often on mobile.</li>
</ul>

<h3>What "complete" looks like in 60 minutes</h3>
<p>You won't finish "everything" — that's the point. Complete in this context means:</p>
<ol>
  <li>The <strong>golden path</strong> works end-to-end on a simulator/device.</li>
  <li>You handled <strong>at least three states</strong>: loading, error, empty.</li>
  <li>You named (in code or out loud) what you'd polish given more time: testing, accessibility, theming, performance budget, retries.</li>
  <li>The code reads cleanly: components have one job, no inline 50-line render trees, no "magic" without a comment.</li>
</ol>

<h3>What it is NOT</h3>
<ul>
  <li>Not "memorize 20 problems and pattern-match." Interviewers vary the problems. Skill compounds; trivia doesn't.</li>
  <li>Not "ship a polished design." If the design isn't given, default to a clean monochrome with adequate spacing.</li>
  <li>Not "use every library you know." Reaching for Redux + Zustand + Recoil + React Query in a 60-minute build is a red flag, not a green one.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The 5-phase build (60-min budget)</h3>
<table>
  <thead><tr><th>Phase</th><th>Time</th><th>Output</th></tr></thead>
  <tbody>
    <tr><td>1. Clarify scope</td><td>0–5 min</td><td>Bullet list of what's in / out, edge cases asked about, sample data shape</td></tr>
    <tr><td>2. Layout skeleton</td><td>5–15 min</td><td>Screen renders with hardcoded data, navigation if any, blank states</td></tr>
    <tr><td>3. Wire state &amp; data</td><td>15–35 min</td><td>Real fetching, real handlers, real persistence — feature works happy-path</td></tr>
    <tr><td>4. Edge cases</td><td>35–50 min</td><td>Error, empty, loading, offline, slow network, validation</td></tr>
    <tr><td>5. Polish &amp; narrate</td><td>50–60 min</td><td>Naming, dead-code cleanup, "if I had more time" list spoken</td></tr>
  </tbody>
</table>
<p>The single biggest mistake candidates make is spending 30 minutes in phase 2. <strong>Hardcode aggressively.</strong> A list of 5 fake messages renders the same UI shell as 50,000 from a real API.</p>

<h3>The "what state lives where" decision tree</h3>
<pre><code class="language-text">Is it a single component's UI state (open/closed, focused, hovered)?
  → useState in that component.

Is it shared across siblings on this screen?
  → Lift to nearest common parent. (Or useReducer if &gt;3 fields.)

Is it server data (lists, profiles, anything fetched)?
  → React Query, SWR, or your team's data layer. Never useState for fetched data.

Is it cross-screen (auth, theme, current user)?
  → Context or Zustand. Avoid Redux unless the team already uses it.

Is it persisted across app launches?
  → MMKV (preferred) or AsyncStorage. Layer it under a hook like useStoredValue.</code></pre>

<h3>The default RN component shapes</h3>
<table>
  <thead><tr><th>Need</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>Scrollable list of homogeneous items</td><td><code>FlatList</code> with <code>keyExtractor</code>, <code>renderItem</code>, <code>onEndReached</code></td></tr>
    <tr><td>Sectioned list</td><td><code>SectionList</code></td></tr>
    <tr><td>Heterogeneous static screen</td><td><code>ScrollView</code></td></tr>
    <tr><td>Form / multi-step</td><td><code>KeyboardAvoidingView</code> + controlled inputs + a tiny reducer</td></tr>
    <tr><td>Image-heavy gallery</td><td><code>FlatList</code> + <code>FastImage</code> (or Expo Image), pagination</td></tr>
    <tr><td>Bottom sheet / modal</td><td><code>@gorhom/bottom-sheet</code> or built-in <code>Modal</code></td></tr>
    <tr><td>Animated interaction</td><td>Reanimated 3 worklets + Gesture Handler</td></tr>
  </tbody>
</table>

<h3>The "interview architecture"</h3>
<p>For a 60-minute round, this folder layout reads professionally and lets you find code fast:</p>
<pre><code class="language-text">src/
  screens/
    FeedScreen.tsx          // top-level screen, owns layout
  components/
    PostCard.tsx            // dumb, prop-driven
    EmptyState.tsx
    ErrorState.tsx
  hooks/
    usePosts.ts             // owns fetching + pagination state
    useDebouncedValue.ts
  api/
    posts.ts                // fetch wrappers
  types/
    post.ts                 // Post interface
</code></pre>
<p>Don't over-fold for a tiny build — but having <code>screens/components/hooks</code> separation signals fluency. <em>One file</em> with everything is fine for a 30-min round; for 60+, split.</p>

<h3>The "narrate-as-you-type" mode</h3>
<p>Interviewers can't grade silent typing. State the intent of every non-trivial choice as you make it:</p>
<ul>
  <li>"I'll use FlatList instead of map+ScrollView so we get virtualization for free."</li>
  <li>"For now I'll inline the styles — if this grew I'd move to a styled-components or stylesheet split."</li>
  <li>"I'm extracting <code>usePosts</code> because the screen will get cluttered if I keep this in line."</li>
  <li>"This handler doesn't memoize — fine here because PostCard isn't memoized either, no win."</li>
</ul>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Pattern 1: Infinite-scroll feed (the canonical problem)</h3>
<pre><code class="language-tsx">// hooks/usePosts.ts
import { useState, useCallback, useEffect } from 'react';

type Post = { id: string; title: string; body: string };

export function usePosts() {
  const [posts, setPosts] = useState&lt;Post[]&gt;([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState&lt;Error | null&gt;(null);
  const [done, setDone] = useState(false);

  const loadMore = useCallback(async () =&gt; {
    if (loading || done) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(\`/api/posts?page=\${page}&size=20\`);
      const next: Post[] = await res.json();
      setPosts(prev =&gt; [...prev, ...next]);
      setPage(p =&gt; p + 1);
      if (next.length &lt; 20) setDone(true);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [page, loading, done]);

  useEffect(() =&gt; { loadMore(); }, []); // initial load
  return { posts, loadMore, loading, error, done };
}
</code></pre>

<pre><code class="language-tsx">// screens/FeedScreen.tsx
import { FlatList, ActivityIndicator, Text, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { PostCard } from '../components/PostCard';
import { EmptyState } from '../components/EmptyState';
import { usePosts } from '../hooks/usePosts';

export function FeedScreen() {
  const { posts, loadMore, loading, error, done } = usePosts();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () =&gt; {
    setRefreshing(true);
    // in real life: refetch from page 1; here for brevity:
    await new Promise(r =&gt; setTimeout(r, 800));
    setRefreshing(false);
  }, []);

  if (error && posts.length === 0) {
    return &lt;Text&gt;Couldn't load. Pull to retry.&lt;/Text&gt;;
  }

  return (
    &lt;FlatList
      data={posts}
      keyExtractor={(p) =&gt; p.id}
      renderItem={({ item }) =&gt; &lt;PostCard post={item} /&gt;}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      refreshControl={
        &lt;RefreshControl refreshing={refreshing} onRefresh={onRefresh} /&gt;
      }
      ListEmptyComponent={!loading ? &lt;EmptyState /&gt; : null}
      ListFooterComponent={loading && !done ? &lt;ActivityIndicator /&gt; : null}
    /&gt;
  );
}
</code></pre>

<h3>Pattern 2: OTP input (4–6 boxes, auto-advance, paste, backspace)</h3>
<pre><code class="language-tsx">import { useRef, useState } from 'react';
import { TextInput, View, StyleSheet, Keyboard } from 'react-native';

export function OtpInput({ length = 6, onComplete }: { length?: number; onComplete: (code: string) =&gt; void }) {
  const [values, setValues] = useState&lt;string[]&gt;(Array(length).fill(''));
  const refs = useRef&lt;Array&lt;TextInput | null&gt;&gt;([]);

  const set = (i: number, v: string) =&gt; {
    // handle paste of full code
    if (v.length &gt; 1) {
      const chars = v.replace(/\\D/g, '').slice(0, length).split('');
      const next = [...values];
      chars.forEach((c, idx) =&gt; { next[idx] = c; });
      setValues(next);
      const filled = next.findIndex(x =&gt; !x);
      if (filled === -1) {
        Keyboard.dismiss();
        onComplete(next.join(''));
      } else {
        refs.current[filled]?.focus();
      }
      return;
    }
    const next = [...values];
    next[i] = v;
    setValues(next);
    if (v && i &lt; length - 1) refs.current[i + 1]?.focus();
    if (next.every(Boolean)) {
      Keyboard.dismiss();
      onComplete(next.join(''));
    }
  };

  const onKeyPress = (i: number, key: string) =&gt; {
    if (key === 'Backspace' && !values[i] && i &gt; 0) {
      refs.current[i - 1]?.focus();
    }
  };

  return (
    &lt;View style={styles.row}&gt;
      {values.map((v, i) =&gt; (
        &lt;TextInput
          key={i}
          ref={(r) =&gt; { refs.current[i] = r; }}
          value={v}
          onChangeText={(t) =&gt; set(i, t)}
          onKeyPress={({ nativeEvent }) =&gt; onKeyPress(i, nativeEvent.key)}
          keyboardType="number-pad"
          maxLength={i === 0 ? length : 1}  // first box accepts paste
          style={styles.cell}
          textContentType="oneTimeCode"      // iOS auto-fill from SMS
          autoComplete="sms-otp"             // Android
        /&gt;
      ))}
    &lt;/View&gt;
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  cell: {
    width: 44, height: 56, borderWidth: 1, borderColor: '#888',
    borderRadius: 8, fontSize: 22, textAlign: 'center',
  },
});
</code></pre>
<p><strong>Key calls:</strong> <code>textContentType="oneTimeCode"</code> + <code>autoComplete="sms-otp"</code> = SMS auto-fill on both platforms; allowing paste in the first cell handles "user copies from email"; backspace logic prevents the dead-end where deleting forces them to tap-back manually.</p>

<h3>Pattern 3: Debounced search / autocomplete</h3>
<pre><code class="language-tsx">// hooks/useDebouncedValue.ts
import { useEffect, useState } from 'react';
export function useDebouncedValue&lt;T&gt;(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() =&gt; {
    const t = setTimeout(() =&gt; setDebounced(value), ms);
    return () =&gt; clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

// SearchScreen.tsx
function SearchScreen() {
  const [q, setQ] = useState('');
  const debounced = useDebouncedValue(q, 300);
  const [results, setResults] = useState&lt;Item[]&gt;([]);
  const [loading, setLoading] = useState(false);

  useEffect(() =&gt; {
    if (!debounced) { setResults([]); return; }
    const ctrl = new AbortController();
    setLoading(true);
    fetch(\`/api/search?q=\${encodeURIComponent(debounced)}\`, { signal: ctrl.signal })
      .then(r =&gt; r.json())
      .then(setResults)
      .catch(e =&gt; { if (e.name !== 'AbortError') console.warn(e); })
      .finally(() =&gt; setLoading(false));
    return () =&gt; ctrl.abort();
  }, [debounced]);

  return (
    &lt;&gt;
      &lt;TextInput value={q} onChangeText={setQ} autoCorrect={false} /&gt;
      &lt;FlatList data={results} keyExtractor={i =&gt; i.id} renderItem={...} /&gt;
    &lt;/&gt;
  );
}
</code></pre>
<p><strong>Crucial details:</strong> <code>AbortController</code> cancels in-flight requests when the user keeps typing — prevents stale results from overwriting fresh ones (the "race condition that ships to prod").</p>

<h3>Pattern 4: Swipe-to-delete row</h3>
<pre><code class="language-tsx">import Animated, { useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { View, Text, StyleSheet } from 'react-native';

const THRESHOLD = -100;

export function SwipeRow({ label, onDelete }: { label: string; onDelete: () =&gt; void }) {
  const tx = useSharedValue(0);
  const pan = Gesture.Pan()
    .onUpdate(e =&gt; { tx.value = Math.min(0, e.translationX); })
    .onEnd(() =&gt; {
      if (tx.value &lt; THRESHOLD) {
        tx.value = withSpring(-300, {}, () =&gt; runOnJS(onDelete)());
      } else {
        tx.value = withSpring(0);
      }
    });

  const style = useAnimatedStyle(() =&gt; ({ transform: [{ translateX: tx.value }] }));
  return (
    &lt;View style={styles.wrap}&gt;
      &lt;View style={styles.delBg}&gt;&lt;Text style={{ color: 'white' }}&gt;Delete&lt;/Text&gt;&lt;/View&gt;
      &lt;GestureDetector gesture={pan}&gt;
        &lt;Animated.View style={[styles.row, style]}&gt;&lt;Text&gt;{label}&lt;/Text&gt;&lt;/Animated.View&gt;
      &lt;/GestureDetector&gt;
    &lt;/View&gt;
  );
}
</code></pre>

<h3>Pattern 5: Multi-step form with validation</h3>
<pre><code class="language-tsx">type Step = 'profile' | 'address' | 'review';
type FormState = { name: string; email: string; street: string; city: string };

const initial: FormState = { name: '', email: '', street: '', city: '' };

function reducer(s: FormState, a: { type: 'set'; field: keyof FormState; value: string }) {
  return { ...s, [a.field]: a.value };
}

export function SignupForm() {
  const [step, setStep] = useState&lt;Step&gt;('profile');
  const [form, dispatch] = useReducer(reducer, initial);
  const errors = validate(step, form); // pure function below

  const canAdvance = Object.keys(errors).length === 0;
  const next = () =&gt; setStep(s =&gt; (s === 'profile' ? 'address' : s === 'address' ? 'review' : s));

  return (
    &lt;KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}&gt;
      {step === 'profile' && (
        &lt;&gt;
          &lt;LabeledInput label="Name" value={form.name} onChange={v =&gt; dispatch({ type: 'set', field: 'name', value: v })} error={errors.name} /&gt;
          &lt;LabeledInput label="Email" value={form.email} onChange={v =&gt; dispatch({ type: 'set', field: 'email', value: v })} error={errors.email} keyboardType="email-address" /&gt;
        &lt;/&gt;
      )}
      {/* ... address, review */}
      &lt;Button title={step === 'review' ? 'Submit' : 'Next'} disabled={!canAdvance} onPress={next} /&gt;
    &lt;/KeyboardAvoidingView&gt;
  );
}

function validate(step: Step, f: FormState): Partial&lt;Record&lt;keyof FormState, string&gt;&gt; {
  const e: any = {};
  if (step === 'profile') {
    if (!f.name.trim()) e.name = 'Required';
    if (!/^\\S+@\\S+\\.\\S+$/.test(f.email)) e.email = 'Invalid email';
  }
  if (step === 'address') {
    if (!f.street.trim()) e.street = 'Required';
    if (!f.city.trim()) e.city = 'Required';
  }
  return e;
}
</code></pre>

<h3>Pattern 6: Persisted todo list (offline-friendly)</h3>
<pre><code class="language-tsx">import { MMKV } from 'react-native-mmkv';
const storage = new MMKV();

type Todo = { id: string; text: string; done: boolean };
const KEY = 'todos.v1';

function loadTodos(): Todo[] {
  const raw = storage.getString(KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveTodos(t: Todo[]) {
  storage.set(KEY, JSON.stringify(t));
}

export function TodosScreen() {
  const [todos, setTodos] = useState&lt;Todo[]&gt;(loadTodos);
  // any state mutation goes through this:
  const update = (next: Todo[]) =&gt; { setTodos(next); saveTodos(next); };

  const add = (text: string) =&gt; update([{ id: String(Date.now()), text, done: false }, ...todos]);
  const toggle = (id: string) =&gt; update(todos.map(t =&gt; t.id === id ? { ...t, done: !t.done } : t));
  const remove = (id: string) =&gt; update(todos.filter(t =&gt; t.id !== id));
  // ... render
}
</code></pre>
<p><strong>Why MMKV:</strong> synchronous reads, ~30× faster than AsyncStorage on cold start, and the API is dead simple. Async-only candidates often forget how disruptive the AsyncStorage await chain is on app startup.</p>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: "Build a chat list" (full 60-minute walkthrough)</h3>
<p><strong>Prompt:</strong> "Build a chat list screen. Each row shows avatar, name, last message, time, and unread count. Tapping a row opens a detail screen. Long-press reveals delete. Pull to refresh, infinite scroll, online indicator on avatar."</p>

<h4>Phase 1 — Clarify (5 min)</h4>
<ul>
  <li>Real backend or hardcoded? → "I'll start hardcoded, swap to <code>fetch</code> at the end if time."</li>
  <li>Designs? → "If none, I'll go monochrome."</li>
  <li>Animations on delete? → "Spring out, then remove from list."</li>
  <li>Should unread count show 99+ for &gt;99? → Yes.</li>
  <li>Does long-press also surface other actions? → "Just delete for now; I'll structure for extension."</li>
</ul>

<h4>Phase 2 — Layout skeleton (5–15 min)</h4>
<pre><code class="language-tsx">type Chat = { id: string; name: string; avatar: string; lastMessage: string; ts: number; unread: number; online: boolean };

const MOCK: Chat[] = [
  { id: '1', name: 'Sara', avatar: 'https://i.pravatar.cc/150?u=1', lastMessage: 'On my way', ts: Date.now() - 60_000, unread: 3, online: true },
  // ...
];

function ChatRow({ chat, onPress, onLongPress }: { chat: Chat; onPress: () =&gt; void; onLongPress: () =&gt; void }) {
  return (
    &lt;Pressable onPress={onPress} onLongPress={onLongPress} style={styles.row}&gt;
      &lt;View&gt;
        &lt;Image source={{ uri: chat.avatar }} style={styles.avatar} /&gt;
        {chat.online && &lt;View style={styles.online} /&gt;}
      &lt;/View&gt;
      &lt;View style={{ flex: 1 }}&gt;
        &lt;Text style={styles.name} numberOfLines={1}&gt;{chat.name}&lt;/Text&gt;
        &lt;Text style={styles.preview} numberOfLines={1}&gt;{chat.lastMessage}&lt;/Text&gt;
      &lt;/View&gt;
      &lt;View style={{ alignItems: 'flex-end' }}&gt;
        &lt;Text style={styles.time}&gt;{formatTs(chat.ts)}&lt;/Text&gt;
        {chat.unread &gt; 0 && (
          &lt;View style={styles.badge}&gt;
            &lt;Text style={styles.badgeText}&gt;{chat.unread &gt; 99 ? '99+' : chat.unread}&lt;/Text&gt;
          &lt;/View&gt;
        )}
      &lt;/View&gt;
    &lt;/Pressable&gt;
  );
}
</code></pre>

<h4>Phase 3 — Wire state & data (15–35 min)</h4>
<pre><code class="language-tsx">export function ChatListScreen({ navigation }: any) {
  const [chats, setChats] = useState(MOCK);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState&lt;Chat | null&gt;(null);

  const onRefresh = async () =&gt; {
    setRefreshing(true);
    await new Promise(r =&gt; setTimeout(r, 600));
    setRefreshing(false);
  };

  const remove = (id: string) =&gt; setChats(prev =&gt; prev.filter(c =&gt; c.id !== id));

  return (
    &lt;&gt;
      &lt;FlatList
        data={chats}
        keyExtractor={c =&gt; c.id}
        renderItem={({ item }) =&gt; (
          &lt;ChatRow
            chat={item}
            onPress={() =&gt; navigation.navigate('ChatDetail', { id: item.id })}
            onLongPress={() =&gt; setConfirmDelete(item)}
          /&gt;
        )}
        refreshControl={&lt;RefreshControl refreshing={refreshing} onRefresh={onRefresh} /&gt;}
        ItemSeparatorComponent={() =&gt; &lt;View style={styles.sep} /&gt;}
      /&gt;
      &lt;ConfirmDeleteSheet chat={confirmDelete} onClose={() =&gt; setConfirmDelete(null)} onConfirm={(c) =&gt; { remove(c.id); setConfirmDelete(null); }} /&gt;
    &lt;/&gt;
  );
}
</code></pre>

<h4>Phase 4 — Edge cases (35–50 min)</h4>
<ul>
  <li>Empty state: <code>ListEmptyComponent</code> with "No chats yet."</li>
  <li>Long names / messages: <code>numberOfLines={1}</code> already added; verify Chinese / emoji rendering.</li>
  <li>Avatar fail: pass <code>onError</code> on <code>Image</code> to swap to initials placeholder.</li>
  <li>Time formatter: now &lt; 1m → "now"; today → "HH:MM"; yesterday → "Yesterday"; older → "MMM D".</li>
  <li>Unread &gt; 99 → "99+"; verified.</li>
</ul>

<h4>Phase 5 — Polish & narrate (50–60 min)</h4>
<p>Out loud, before the timer ends:</p>
<ul>
  <li>"FlatList virtualizes — should scale to thousands of rows. For 50,000+ I'd switch to FlashList."</li>
  <li>"Real app would put fetching in React Query so refresh is automatic across screens."</li>
  <li>"For accessibility I'd add <code>accessibilityLabel</code> like '<em>Sara, 3 unread, last message On my way</em>' on the row."</li>
  <li>"Online indicator is a hardcoded boolean now — production would come from a presence channel (WebSocket / SSE)."</li>
</ul>

<h3>Example 2: Image carousel with paging</h3>
<pre><code class="language-tsx">import { FlatList, Dimensions, Image, View } from 'react-native';
const { width } = Dimensions.get('window');

export function Carousel({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);
  return (
    &lt;View&gt;
      &lt;FlatList
        data={images}
        keyExtractor={u =&gt; u}
        renderItem={({ item }) =&gt; &lt;Image source={{ uri: item }} style={{ width, height: 240 }} /&gt;}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =&gt; {
          setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
      /&gt;
      &lt;View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8, gap: 6 }}&gt;
        {images.map((_, i) =&gt; (
          &lt;View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: i === index ? '#000' : '#ccc' }} /&gt;
        ))}
      &lt;/View&gt;
    &lt;/View&gt;
  );
}
</code></pre>

<h3>Example 3: Skeleton loader</h3>
<pre><code class="language-tsx">import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

export function Skeleton({ width, height }: { width: number; height: number }) {
  const op = useSharedValue(0.4);
  useEffect(() =&gt; {
    op.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, []);
  const style = useAnimatedStyle(() =&gt; ({ opacity: op.value }));
  return &lt;Animated.View style={[{ width, height, borderRadius: 8, backgroundColor: '#e5e5e5' }, style]} /&gt;;
}
</code></pre>

<h3>Example 4: "Like" button with optimistic update</h3>
<pre><code class="language-tsx">function LikeButton({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.liked);
  const [count, setCount] = useState(post.likeCount);

  const onPress = async () =&gt; {
    // optimistic
    const prev = { liked, count };
    setLiked(!liked);
    setCount(c =&gt; c + (liked ? -1 : 1));
    try {
      await fetch(\`/api/posts/\${post.id}/like\`, { method: liked ? 'DELETE' : 'POST' });
    } catch {
      // rollback
      setLiked(prev.liked);
      setCount(prev.count);
    }
  };

  return (
    &lt;Pressable onPress={onPress}&gt;
      &lt;Text&gt;{liked ? '♥' : '♡'} {count}&lt;/Text&gt;
    &lt;/Pressable&gt;
  );
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Always demo these states</h3>
<table>
  <thead><tr><th>State</th><th>How to surface</th></tr></thead>
  <tbody>
    <tr><td>Loading (initial)</td><td>Skeleton, ActivityIndicator, or shimmer placeholder</td></tr>
    <tr><td>Loading (more, paginated)</td><td><code>ListFooterComponent</code> with spinner</td></tr>
    <tr><td>Refreshing</td><td><code>RefreshControl</code> on FlatList</td></tr>
    <tr><td>Empty</td><td><code>ListEmptyComponent</code> with friendly copy + CTA</td></tr>
    <tr><td>Error</td><td>Inline message + Retry button; never just &lt;Text&gt;Error&lt;/Text&gt;</td></tr>
    <tr><td>Offline</td><td>Banner: "You're offline. Showing cached results."</td></tr>
    <tr><td>Slow network</td><td>Same as loading, but with cancel option after N seconds</td></tr>
  </tbody>
</table>

<h3>Keyboard, the silent killer</h3>
<ul>
  <li><strong>KeyboardAvoidingView</strong>: wrap forms; <code>behavior="padding"</code> on iOS, <code>"height"</code> on Android (or none, depending on screen).</li>
  <li><strong>Tap outside to dismiss</strong>: wrap content in a <code>Pressable</code> that calls <code>Keyboard.dismiss()</code>.</li>
  <li><strong>ScrollView with input</strong>: set <code>keyboardShouldPersistTaps="handled"</code>; otherwise tapping a result while typing dismisses without firing.</li>
  <li><strong>Auto-correct on email/usernames</strong>: turn it off (<code>autoCorrect={false}</code>, <code>autoCapitalize="none"</code>); Apple's autocorrect destroys email entry.</li>
  <li><strong>Return key behavior</strong>: <code>returnKeyType="next"</code> + <code>onSubmitEditing</code> to focus the next input — interview-grade polish.</li>
</ul>

<h3>FlatList traps</h3>
<ul>
  <li><strong>Missing keyExtractor</strong>: React falls back to index → reorders/deletes break.</li>
  <li><strong>Inline arrow functions in renderItem</strong>: cheap individually, but the FlatList itself re-renders on every parent state change. Fine for interview, name it for prod.</li>
  <li><strong>onEndReached called repeatedly</strong>: it fires multiple times near the bottom. Guard with <code>loading || done</code> in your fetcher.</li>
  <li><strong>Mixed item heights</strong>: skip <code>getItemLayout</code> unless heights are constant; otherwise scroll-to-index lies.</li>
  <li><strong>FlatList inside ScrollView</strong>: scroll inertia is broken; use <code>contentContainerStyle</code> on FlatList instead.</li>
</ul>

<h3>The race condition on every search box</h3>
<pre><code class="language-tsx">// User types "a" then "ab"
// Request 1 (a) goes out, takes 800ms
// Request 2 (ab) goes out, takes 200ms
// Without abort: results for "a" arrive AFTER results for "ab" → wrong list shown.
// FIX: AbortController in the cleanup, OR check that the response query still matches state.
</code></pre>

<h3>Image edge cases</h3>
<ul>
  <li><strong>No URL / 404</strong>: <code>onError</code> handler → fallback initials/placeholder.</li>
  <li><strong>Wrong aspect ratio</strong>: set <code>resizeMode="cover"</code> for avatars, <code>"contain"</code> for documents/screenshots.</li>
  <li><strong>Memory blow-up</strong>: full-resolution images in lists kill memory; request thumbnails or use FastImage with <code>priority="low"</code>.</li>
  <li><strong>Privacy</strong>: pre-signed S3 URLs expire — handle 403 like a 404.</li>
</ul>

<h3>Touch handling pitfalls</h3>
<ul>
  <li><strong>onPress fires on touch-end</strong>, not touch-start. Quick taps that move &gt;10px are interpreted as scroll, not press.</li>
  <li><strong>Hit slop</strong>: small targets need <code>hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}</code> to feel responsive.</li>
  <li><strong>Long-press conflicts with scroll</strong>: tune <code>delayLongPress</code> (default 500ms) if your list scrolls fast.</li>
  <li><strong>Double-tap protection</strong>: disable button on press, re-enable in finally.</li>
</ul>

<h3>Time/locale</h3>
<ul>
  <li><strong>Timestamps</strong>: server returns UTC; format with the device locale. <code>Intl.DateTimeFormat</code> works, but date-fns is the de-facto choice.</li>
  <li><strong>Relative time</strong>: write your own ("now", "5m", "2h", "Yesterday", "Mon", "Jan 5") — most apps don't need a full library.</li>
  <li><strong>Day boundaries</strong>: "yesterday" depends on the user's TZ, not the server's.</li>
</ul>

<h3>Safe areas and notches</h3>
<ul>
  <li>Wrap top-level screens in <code>SafeAreaView</code> or use <code>useSafeAreaInsets()</code> for fine control.</li>
  <li>Floating Action Buttons must avoid the gesture bar (~bottom 34pt iOS).</li>
  <li>Status bar: set color/style per screen; don't hardcode in App root.</li>
</ul>

<h3>Theming & dark mode</h3>
<ul>
  <li>Read <code>useColorScheme()</code> and ship at minimum a token map (<code>{ bg, text, border }</code>); don't hardcode hex.</li>
  <li>Test the empty state, error state, and disabled buttons in both themes — that's where most contrast bugs hide.</li>
</ul>

<h3>Network state</h3>
<ul>
  <li><code>@react-native-community/netinfo</code> → show offline banner.</li>
  <li>Don't show "Retry" if there's no connection — show "You're offline."</li>
  <li>Background fetches: cancel on screen blur (<code>useFocusEffect</code> with cleanup).</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: useEffect fetching without abort or guard</h3>
<pre><code class="language-tsx">// BAD — stale results, memory leak warnings, retried setState on unmounted component
useEffect(() =&gt; {
  fetch(url).then(r =&gt; r.json()).then(setData);
}, [url]);

// GOOD — abort + check we still care about this response
useEffect(() =&gt; {
  const ctrl = new AbortController();
  let alive = true;
  fetch(url, { signal: ctrl.signal })
    .then(r =&gt; r.json())
    .then(d =&gt; { if (alive) setData(d); })
    .catch(e =&gt; { if (e.name !== 'AbortError') setError(e); });
  return () =&gt; { alive = false; ctrl.abort(); };
}, [url]);
</code></pre>

<h3>Bug 2: index as key</h3>
<pre><code class="language-tsx">// BAD — when items reorder/insert, React reuses the wrong children
&lt;FlatList data={items} keyExtractor={(_, i) =&gt; String(i)} /&gt;

// GOOD — stable id from the data
&lt;FlatList data={items} keyExtractor={(item) =&gt; item.id} /&gt;
</code></pre>
<p>Symptom: input fields keep their text after delete; selected state jumps to the wrong row; animations apply to the wrong item.</p>

<h3>Bug 3: putting derived state in useState</h3>
<pre><code class="language-tsx">// BAD — falls out of sync with source
const [filtered, setFiltered] = useState(items);
useEffect(() =&gt; { setFiltered(items.filter(matchesQuery)); }, [items, query]);

// GOOD — compute it
const filtered = useMemo(() =&gt; items.filter(matchesQuery), [items, query]);
</code></pre>

<h3>Bug 4: forgetting the loading guard</h3>
<pre><code class="language-tsx">// BAD — onEndReached fires multiple times, double-paginates
&lt;FlatList onEndReached={loadMore} /&gt;
function loadMore() { fetch('/api/page/' + page).then(...) }

// GOOD
function loadMore() {
  if (loading || done) return;
  // ...
}
</code></pre>

<h3>Bug 5: setState inside render</h3>
<pre><code class="language-tsx">// BAD — infinite loop
function Comp() {
  setX(1);  // every render triggers this, every setX triggers a render
  // ...
}

// GOOD — once
useEffect(() =&gt; { setX(1); }, []);
</code></pre>

<h3>Bug 6: using async function as effect</h3>
<pre><code class="language-tsx">// BAD — TypeScript yells; the cleanup function position now holds a Promise
useEffect(async () =&gt; { ... }, []);

// GOOD — inner async
useEffect(() =&gt; {
  let alive = true;
  (async () =&gt; {
    const data = await fetchSomething();
    if (alive) setData(data);
  })();
  return () =&gt; { alive = false; };
}, []);
</code></pre>

<h3>Bug 7: every onPress recreates a child</h3>
<pre><code class="language-tsx">// In a FlatList of 1000 rows, this allocates 1000 closures per parent render:
renderItem={({ item }) =&gt; &lt;Row item={item} onPress={() =&gt; doThing(item.id)} /&gt;}

// In an interview this is fine — narrate that you'd memoize Row + use useCallback in prod.
</code></pre>

<h3>Bug 8: KeyboardAvoidingView without behavior on iOS</h3>
<pre><code class="language-tsx">// BAD on iOS — input gets covered
&lt;KeyboardAvoidingView style={{flex:1}}&gt;...&lt;/KeyboardAvoidingView&gt;

// GOOD — platform-aware
&lt;KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
  style={{flex: 1}}&gt;...
&lt;/KeyboardAvoidingView&gt;
</code></pre>

<h3>Bug 9: hardcoded width/height in flex layouts</h3>
<pre><code class="language-tsx">// BAD — fights flex, breaks on small phones
&lt;View style={{ width: 375, padding: 16 }}&gt;

// GOOD
&lt;View style={{ flex: 1, padding: 16 }}&gt;

// Need full screen width? Dimensions.get('window').width — but ALSO listen for rotation events.
</code></pre>

<h3>Bug 10: not memoizing FlatList renderItem references when items are heavy</h3>
<p>For a small interview problem you don't need this; for any list of memoized rows, inline arrows defeat memoization.</p>

<h3>Anti-pattern 1: reaching for Redux on day one</h3>
<p>For a 60-minute build with one screen, Redux + Sagas + a normalized store is overkill and signals that you don't know what's lighter. Default to <code>useState</code> + <code>useReducer</code> + Context. Mention Redux only when justified by cross-screen orchestration or you've inherited a Redux app.</p>

<h3>Anti-pattern 2: prop drilling 6 levels then claiming "we'll Context it later"</h3>
<p>If a value is consumed by the leaf and only the leaf, drill is fine. If 3+ siblings or descendants need it, lift to Context the moment it's clear.</p>

<h3>Anti-pattern 3: massive single component</h3>
<p>One <code>FeedScreen.tsx</code> with 500 lines, 12 states, 9 effects, and inline subcomponents. Before you go past ~150 lines, extract:</p>
<ul>
  <li>Each subcomponent (PostCard, EmptyState) → its own file.</li>
  <li>Each non-trivial effect → a custom hook.</li>
  <li>Each pure computation → a util.</li>
</ul>

<h3>Anti-pattern 4: inventing your own data layer</h3>
<p>Writing a "smart cache" with TTLs and dedupe in 60 minutes when React Query already exists. Use it. Or: keep it dumb and call <code>fetch</code> directly. Don't half-build a library.</p>

<h3>Anti-pattern 5: no naming, no comments, but six layers of HOCs</h3>
<p>Cleverness ≠ quality. The interviewer reads your code; abstractions that obscure the data flow lose points.</p>

<h3>Anti-pattern 6: ignoring the platform</h3>
<p>"It's the same as web React, right?" → instant red flag. RN-specific awareness shows in:</p>
<ul>
  <li>FlatList over <code>map</code>.</li>
  <li>Pressable over View+onTouchEnd.</li>
  <li><code>useNativeDriver</code> / Reanimated worklets for animations.</li>
  <li><code>onPress</code> not <code>onClick</code>; <code>TextInput</code> not <code>input</code>.</li>
  <li>Knowing <code>Image</code> needs <code>{ uri }</code> for remote and a static <code>require</code> for local.</li>
</ul>

<h3>Anti-pattern 7: silent failures</h3>
<p>Wrapping every async in <code>try/catch</code> with no UI surfacing — user sees nothing, taps again, breaks more. Always render an error UI, even if it's a one-liner.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '🎤 Interview Patterns',
      html: `
<h3>The 12 most common RN machine-coding prompts</h3>
<table>
  <thead><tr><th>Prompt</th><th>Skills tested</th></tr></thead>
  <tbody>
    <tr><td>Infinite-scroll feed</td><td>FlatList, pagination, loading/error/empty states, refresh</td></tr>
    <tr><td>Chat list with unread, long-press delete</td><td>List rendering, modals, gesture, formatting</td></tr>
    <tr><td>OTP input (4–6 boxes)</td><td>refs, focus management, paste, SMS auto-fill</td></tr>
    <tr><td>Autocomplete / search</td><td>Debounce, AbortController, race-condition awareness</td></tr>
    <tr><td>Multi-step form</td><td>Reducer, validation, KeyboardAvoidingView, navigation</td></tr>
    <tr><td>Image carousel with paging</td><td>Horizontal FlatList, paging, dots</td></tr>
    <tr><td>Pull-to-refresh + offline cache</td><td>RefreshControl, MMKV/AsyncStorage, NetInfo</td></tr>
    <tr><td>Swipe-to-delete row</td><td>Reanimated, Gesture Handler, list mutation</td></tr>
    <tr><td>Todo / shopping list</td><td>CRUD, persistence, optimistic UI</td></tr>
    <tr><td>Tabs + swipeable screens</td><td>react-navigation tab + material-top-tabs</td></tr>
    <tr><td>Live-updating counter / scoreboard</td><td>WebSocket, useEffect cleanup, re-render minimization</td></tr>
    <tr><td>Photo grid + detail view</td><td>FlatList numColumns, shared transition, FastImage</td></tr>
  </tbody>
</table>

<h3>The 60-minute opening monologue (memorize the shape)</h3>
<blockquote>
"Before I start, let me confirm scope. The feature is X. I'm going to assume: hardcoded data first, swap to fetch if time; monochrome styling unless you have a design; portrait only; iPhone 14 sized. I'll handle loading, error, and empty states; keyboard if any; offline if relevant. Three things I'd build for production but skip here unless you'd like otherwise: tests, theming, accessibility labels. Sound right?"
</blockquote>
<p>That sentence alone moves you from "junior" to "senior" in interviewer eyes.</p>

<h3>Where to type first</h3>
<ol>
  <li>Open the IDE, write the type for your domain object (<code>type Post = { id, title, body }</code>) — establishes contract.</li>
  <li>Write the screen file with hardcoded array, render once, get text on screen — proves the loop works.</li>
  <li>Extract one subcomponent (the list row) — proves you decompose.</li>
  <li>Add one state, one handler — proves you wire interactivity.</li>
  <li>Now go to the interesting part of the prompt.</li>
</ol>

<h3>"Talk while typing" cheat sheet</h3>
<table>
  <thead><tr><th>You're about to…</th><th>Say…</th></tr></thead>
  <tbody>
    <tr><td>Pick FlatList</td><td>"FlatList for virtualization — keeps memory bounded as the list grows"</td></tr>
    <tr><td>Add useState</td><td>"This is purely UI state, lives in the component"</td></tr>
    <tr><td>Add useEffect with fetch</td><td>"AbortController on cleanup so we don't race"</td></tr>
    <tr><td>Add useReducer</td><td>"More than 2–3 related fields, reducer keeps mutations in one place"</td></tr>
    <tr><td>Skip a polish item</td><td>"For prod I'd add X — here I'll note it and move on"</td></tr>
    <tr><td>Make a styling decision</td><td>"Inline for now, would extract to StyleSheet.create or a token map"</td></tr>
    <tr><td>Skip tests</td><td>"For tests I'd render the screen with mock data and assert on row count, then snapshot the empty state"</td></tr>
  </tbody>
</table>

<h3>Performance interview-isms (sprinkle these)</h3>
<ul>
  <li>"FlatList recycles rows; if rows are heavy I'd <code>React.memo</code> them and pass <code>extraData</code> only when needed."</li>
  <li>"For 10,000+ rows I'd switch to <strong>FlashList</strong> from Shopify — same API, ~5× perf."</li>
  <li>"For image-heavy grids, <strong>FastImage</strong> or Expo Image — they cache and decode off the JS thread."</li>
  <li>"For animations, <strong>Reanimated worklets</strong> — runs on the UI thread, no bridge round-trip."</li>
  <li>"For storage, <strong>MMKV</strong> — synchronous, ~30× faster than AsyncStorage."</li>
  <li>"For lists with re-renders I'd profile with the <strong>React DevTools Profiler</strong> and the new architecture's <strong>Hermes</strong> traces."</li>
</ul>

<h3>"If I had more time" — the close-out lines</h3>
<p>Read the room; pick 3–4 to mention:</p>
<ul>
  <li><strong>Tests:</strong> render-time test on the screen; snapshot of empty/error; integration on the happy path with a mocked fetch.</li>
  <li><strong>Accessibility:</strong> <code>accessibilityLabel</code>, <code>accessibilityRole</code> on all touchables; large text scaling check.</li>
  <li><strong>Internationalization:</strong> all strings via a t() function; date formatting via <code>Intl</code>.</li>
  <li><strong>Theming:</strong> tokens map; dark mode pass; high-contrast pass.</li>
  <li><strong>Resilience:</strong> exponential backoff retry; offline banner; queue-and-replay for writes.</li>
  <li><strong>Telemetry:</strong> screen view event, action events, perf timer for the first paint.</li>
  <li><strong>Performance:</strong> <code>getItemLayout</code> if heights constant; FlashList swap; image prefetch on appear.</li>
</ul>

<h3>What separates senior from staff</h3>
<table>
  <thead><tr><th>Senior signal</th><th>Staff+ signal</th></tr></thead>
  <tbody>
    <tr><td>Code is clean and works</td><td>Code is clean, works, AND extends without rewrite for the obvious follow-up ask</td></tr>
    <tr><td>Names loading/error/empty</td><td>Builds them as reusable shells; talks about the design system implication</td></tr>
    <tr><td>Picks FlatList</td><td>Articulates when FlashList wins and at what scale</td></tr>
    <tr><td>Avoids Redux</td><td>Articulates the cost model: re-render fan-out, devx tax, cross-screen state when justified</td></tr>
    <tr><td>Mentions a11y at the end</td><td>Bakes in <code>accessibilityLabel</code> as they go</td></tr>
    <tr><td>Catches their own bug</td><td>Predicts the bug before writing it ("this'll race on the third type — let me wire abort first")</td></tr>
  </tbody>
</table>

<h3>The "live debug" sub-skill</h3>
<p>If something doesn't render, narrate the diagnosis: "I expect 5 rows but see 0 — likely <code>data</code> is empty or <code>renderItem</code> returned null. Let me <code>console.log</code> length and the first item." Don't silently flail. Live debugging is graded too.</p>

<h3>The post-build Q&A</h3>
<ul>
  <li><em>"How would you scale this to 100k items?"</em> → FlashList; pagination + windowing; <code>getItemLayout</code>; image thumbnails not full-res.</li>
  <li><em>"What if the user's offline?"</em> → cached data via MMKV; banner; queue mutations; replay on reconnect.</li>
  <li><em>"How would you test it?"</em> → render with RTL + jest; mock fetch with msw or jest.mock; snapshot the empty state; integration test the pagination via <code>fireEvent.scroll</code>.</li>
  <li><em>"What's the worst bug you can imagine in this code?"</em> — name one. Race on duplicate calls. Wrong key extractor on reorder. Memory leak on unmount. Showing you can audit your own code.</li>
</ul>

<h3>Red flags to avoid in the round</h3>
<ul>
  <li>Silent typing for 10+ minutes.</li>
  <li>Refusing to clarify ("I'll just do whatever") — interviewers read this as inflexibility.</li>
  <li>Building the design before the logic.</li>
  <li>Shipping with no edge cases and saying "yeah it works" when it visibly errors on empty data.</li>
  <li>Reaching for libraries you can't explain — "I'd use Redux because it's the standard" is worse than "I'll use useState — for this size of state, Redux is overkill."</li>
  <li>Not running the code. Type-checking is not running.</li>
</ul>
`
    }
  ]
});
