window.PREP_SITE.registerTopic({
  id: 'rn-navigation',
  module: 'React Native',
  title: 'Navigation',
  estimatedReadTime: '28 min',
  tags: ['react-native', 'navigation', 'react-navigation', 'stack', 'tab', 'drawer', 'deep-linking', 'expo-router'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>Navigation in React Native is not in the framework — it's a library. The standard choices in 2025:</p>
<ul>
  <li><strong>React Navigation (v7)</strong> — the most-used library. Comprehensive, JS-based with native primitives under the hood via <code>react-native-screens</code>. Stack / Tab / Drawer navigators.</li>
  <li><strong>Expo Router (v3+)</strong> — file-based routing on top of React Navigation. "Pages" = files. Feels like Next.js for mobile.</li>
  <li><strong>React Native Navigation (Wix)</strong> — fully native-driven navigation. Less popular now but still used where 100% native-thread navigation is required.</li>
</ul>
<p>Core concepts apply to all three:</p>
<ul>
  <li><strong>Navigators</strong> — containers that manage a stack of screens (Stack, Tab, Drawer, Modal).</li>
  <li><strong>Screens</strong> — the individual "pages" registered with a navigator.</li>
  <li><strong>Navigation state</strong> — the tree of active screens; serializable.</li>
  <li><strong>Params</strong> — data passed between screens (keep it small and serializable; deep-link parseable).</li>
  <li><strong>Linking</strong> — map URLs to navigation state for deep links, universal links, push notifications.</li>
  <li><strong>Typed navigation</strong> — with TypeScript, declare the param list per navigator so <code>navigate()</code> is type-checked.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Pick React Navigation by default. Use Expo Router if you want file-based routes and are already on Expo. Use Wix RNN only when you have a strong native-thread navigation requirement. Regardless, get the TypeScript types right from day 1 — untyped navigation is a common source of runtime bugs.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why navigation isn't built into RN</h3>
<p>Unlike the browser with its URL bar, mobile apps don't have a built-in navigation model. Different platforms prefer different patterns (iOS stack navigation, Android Fragments, bottom tabs, drawers). React Native ships the primitive (the Navigator container) but leaves the UX patterns to libraries.</p>

<h3>Why React Navigation is the default</h3>
<ul>
  <li><strong>Mature</strong> — 7 major versions, thousands of apps.</li>
  <li><strong>Complete</strong> — stack, tab, drawer, modal, bottom sheets, deep linking, state persistence, TypeScript types.</li>
  <li><strong>Native under the hood</strong> — with <code>react-native-screens</code>, individual screens are native views (UINavigationController on iOS, Fragment on Android). Gestures and transitions are native.</li>
  <li><strong>Flexible</strong> — mostly JS config, so custom transitions and layouts are easy.</li>
</ul>

<h3>Why Expo Router is worth considering</h3>
<p>File-based routing. Your directory structure maps to routes. Deep linking and universal links are automatic from the folder names. Layouts via <code>_layout.tsx</code> files. Feels like Next.js App Router for mobile. Good for teams already on Expo and building apps with conventional navigation.</p>

<h3>Why the old Wix RN Navigation lost mindshare</h3>
<p>RNN was fully native — each screen was a native view controller. Fastest navigation, but:</p>
<ul>
  <li>Harder to customize.</li>
  <li>Release behind RN core (upgrade pain).</li>
  <li>API diverges from modern JS patterns.</li>
</ul>
<p>With Fabric + react-native-screens, React Navigation now provides near-native perf for most apps, removing RNN's main advantage.</p>

<h3>Why deep linking is a first-class concern</h3>
<p>Apps receive URLs from: push notifications, email links (universal / app links on iOS/Android), QR codes, inter-app launches. The user taps a link → your app opens to the right screen. Requires:</p>
<ul>
  <li>URL → navigation state mapping (linking config).</li>
  <li>iOS: Universal Links configured with apple-app-site-association.</li>
  <li>Android: App Links via intent filters + Digital Asset Links.</li>
  <li>Handling the "cold start via link" case — app launches, must know where to go.</li>
</ul>
<p>React Navigation's <code>linking</code> prop covers all of this declaratively.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "navigator tree" picture</h3>
<div class="diagram">
<pre>
  &lt;NavigationContainer&gt;
      └── Root Stack
            ├── Auth (Stack, unauthenticated)
            │     ├── Login
            │     └── SignUp
            └── Main (Tab, authenticated)
                  ├── Home tab (Stack)
                  │     ├── Feed
                  │     └── Post details
                  ├── Search tab (Stack)
                  │     └── Search results
                  └── Profile tab (Stack)
                        ├── Profile
                        └── Settings
</pre>
</div>

<h3>The "navigation state" picture</h3>
<pre><code class="language-js">{
  index: 0,
  routes: [
    {
      name: 'Main',
      state: {
        index: 1,               // "Search" tab is active
        routes: [
          { name: 'Home', state: { index: 0, routes: [{name:'Feed'}] }},
          { name: 'Search', state: { index: 0, routes: [{name:'Results', params:{q:'a'}}] }},
        ]
      }
    }
  ]
}</code></pre>
<p>The whole tree is serializable JSON. React Navigation uses it for state persistence and deep link restoration.</p>

<h3>The "native screens" picture</h3>
<div class="diagram">
<pre>
  React Navigation (JS)      react-native-screens      Native
  ─────────────────────      ─────────────────────     ─────────────
  Stack.Navigator   ────►    Screen wrapper           UINavigationController (iOS)
  Stack.Screen               Native view per screen   Fragment (Android)
  Tab.Navigator     ────►    Screen + tab bar         UITabBarController
  Drawer.Navigator  ────►    Native drawer            DrawerLayout
</pre>
</div>
<p>This means transitions, gestures, and screen lifecycle are native — 60fps regardless of what React is doing.</p>

<h3>The "typed navigation" picture</h3>
<pre><code class="language-ts">type RootStackParamList = {
  Home: undefined;
  Post: { id: string };
  Profile: { userId: string };
};

type PostScreenProps = NativeStackScreenProps&lt;RootStackParamList, 'Post'&gt;;

function Post({ route, navigation }: PostScreenProps) {
  const { id } = route.params;  // typed as string
  navigation.navigate('Profile', { userId: 'x' }); // type-checked
}</code></pre>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Navigation params can hold anything." They're passed through navigation state which is serialized for persistence and deep links. Functions, class instances, large objects break persistence. Keep params small and JSON-serializable. For complex data, store in a cache keyed by id and pass only the id.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Installing React Navigation</h3>
<pre><code>npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
// For Expo: npx expo install the same
// Bare RN: add to Podfile + gradle via autolinking
npx pod-install  // iOS</code></pre>

<h3>Root setup</h3>
<pre><code class="language-tsx">import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator&lt;RootStackParamList&gt;();

function App() {
  return (
    &lt;SafeAreaProvider&gt;
      &lt;NavigationContainer&gt;
        &lt;Stack.Navigator&gt;
          &lt;Stack.Screen name="Home" component={Home} /&gt;
          &lt;Stack.Screen name="Post" component={Post} options={{ title: 'Post' }} /&gt;
        &lt;/Stack.Navigator&gt;
      &lt;/NavigationContainer&gt;
    &lt;/SafeAreaProvider&gt;
  );
}</code></pre>

<h3>Tabs and stacks composed</h3>
<pre><code class="language-tsx">const Tabs = createBottomTabNavigator&lt;TabParamList&gt;();
const HomeStack = createNativeStackNavigator&lt;HomeStackParamList&gt;();

function HomeStackNavigator() {
  return (
    &lt;HomeStack.Navigator&gt;
      &lt;HomeStack.Screen name="Feed" component={Feed} /&gt;
      &lt;HomeStack.Screen name="Post" component={Post} /&gt;
    &lt;/HomeStack.Navigator&gt;
  );
}

function App() {
  return (
    &lt;NavigationContainer&gt;
      &lt;Tabs.Navigator&gt;
        &lt;Tabs.Screen name="Home" component={HomeStackNavigator} /&gt;
        &lt;Tabs.Screen name="Search" component={SearchScreen} /&gt;
        &lt;Tabs.Screen name="Profile" component={ProfileScreen} /&gt;
      &lt;/Tabs.Navigator&gt;
    &lt;/NavigationContainer&gt;
  );
}</code></pre>

<h3>Navigation methods</h3>
<pre><code class="language-tsx">const navigation = useNavigation&lt;NavigationProp&lt;RootStackParamList&gt;&gt;();

navigation.navigate('Post', { id: '1' });
navigation.push('Post', { id: '2' });          // push even if already present
navigation.goBack();
navigation.pop(2);                             // pop 2 screens
navigation.popToTop();                         // back to the root of this stack
navigation.replace('Login');                   // replace current
navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
navigation.setParams({ headerTitle: 'New' });  // update current params
navigation.setOptions({ headerTitle: 'Dynamic' }); // update screen options</code></pre>

<h3>Reading params</h3>
<pre><code class="language-tsx">const route = useRoute&lt;RouteProp&lt;RootStackParamList, 'Post'&gt;&gt;();
const { id } = route.params;</code></pre>

<h3>Header options</h3>
<pre><code class="language-tsx">&lt;Stack.Screen
  name="Post"
  component={Post}
  options={({ route }) =&gt; ({
    title: \`Post \${route.params.id}\`,
    headerRight: () =&gt; &lt;Button title="Share" onPress={share} /&gt;,
    headerBackTitle: 'Back',
    headerShown: true,
    headerLargeTitle: true,    // iOS large title
  })}
/&gt;</code></pre>

<h3>Modals</h3>
<pre><code class="language-tsx">&lt;Stack.Navigator&gt;
  &lt;Stack.Group&gt;
    &lt;Stack.Screen name="Home" component={Home} /&gt;
    &lt;Stack.Screen name="Post" component={Post} /&gt;
  &lt;/Stack.Group&gt;
  &lt;Stack.Group screenOptions={{ presentation: 'modal' }}&gt;
    &lt;Stack.Screen name="Compose" component={Compose} /&gt;
    &lt;Stack.Screen name="Settings" component={Settings} /&gt;
  &lt;/Stack.Group&gt;
&lt;/Stack.Navigator&gt;</code></pre>
<p><code>presentation: 'modal'</code> (iOS: sheet) or <code>'formSheet'</code>, <code>'transparentModal'</code> for overlays.</p>

<h3>Deep linking configuration</h3>
<pre><code class="language-tsx">const linking = {
  prefixes: ['myapp://', 'https://myapp.com'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: { screens: { Feed: '', Post: 'post/:id' } },
          Profile: 'user/:userId',
        },
      },
      Login: 'login',
    },
  },
};

&lt;NavigationContainer linking={linking} fallback={&lt;Splash /&gt;}&gt;...&lt;/NavigationContainer&gt;</code></pre>
<p>Now <code>myapp://post/123</code> opens Post with <code>id: '123'</code>. Universal / App Links work the same with <code>https://myapp.com/post/123</code>.</p>

<h3>Expo Router basics</h3>
<pre><code>// file structure
app/
  _layout.tsx           // root layout
  index.tsx             // /
  (auth)/
    login.tsx           // /login
  (tabs)/
    _layout.tsx         // tab layout
    home.tsx            // /home
    profile.tsx         // /profile
  post/
    [id].tsx            // /post/:id</code></pre>
<pre><code class="language-tsx">// post/[id].tsx
import { useLocalSearchParams } from 'expo-router';
export default function Post() {
  const { id } = useLocalSearchParams&lt;{ id: string }&gt;();
  return &lt;View&gt;&lt;Text&gt;Post {id}&lt;/Text&gt;&lt;/View&gt;;
}</code></pre>

<h3>Authentication flow pattern</h3>
<pre><code class="language-tsx">function AppNavigator() {
  const { user } = useAuth();
  return (
    &lt;Stack.Navigator screenOptions={{ headerShown: false }}&gt;
      {user
        ? &lt;Stack.Screen name="Main" component={MainTabs} /&gt;
        : &lt;Stack.Screen name="Auth" component={AuthStack} /&gt;
      }
    &lt;/Stack.Navigator&gt;
  );
}
// Swapping the root screen on login/logout automatically resets the stack.</code></pre>

<h3>Nested hooks</h3>
<pre><code class="language-tsx">useFocusEffect(useCallback(() =&gt; {
  // runs when screen is focused
  const id = startPolling();
  return () =&gt; stopPolling(id);
}, [...]));

useIsFocused();  // boolean

// Listen to navigation events
useEffect(() =&gt; {
  const unsub = navigation.addListener('focus', () =&gt; {});
  return unsub;
}, [navigation]);</code></pre>

<h3>Analytics integration</h3>
<pre><code class="language-tsx">const navRef = useNavigationContainerRef();
const routeNameRef = useRef&lt;string&gt;();

&lt;NavigationContainer
  ref={navRef}
  onReady={() =&gt; { routeNameRef.current = navRef.getCurrentRoute()?.name; }}
  onStateChange={() =&gt; {
    const name = navRef.getCurrentRoute()?.name;
    if (routeNameRef.current !== name) {
      analytics.screen(name);
      routeNameRef.current = name;
    }
  }}
&gt;</code></pre>

<h3>State persistence</h3>
<pre><code class="language-tsx">const PERSIST_KEY = 'NAV_STATE_V1';

&lt;NavigationContainer
  onStateChange={(state) =&gt; AsyncStorage.setItem(PERSIST_KEY, JSON.stringify(state))}
  initialState={persistedState}
&gt;</code></pre>
<p>Useful on iOS state restoration. Be careful — serializable params required.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — typed stack</h3>
<pre><code class="language-ts">// types.ts
export type RootStackParamList = {
  Home: undefined;
  Post: { id: string };
  Profile: { userId: string; tab?: 'posts' | 'likes' };
};

// App.tsx
const Stack = createNativeStackNavigator&lt;RootStackParamList&gt;();
&lt;Stack.Navigator&gt;
  &lt;Stack.Screen name="Home" component={Home} /&gt;
  &lt;Stack.Screen name="Post" component={Post} /&gt;
  &lt;Stack.Screen name="Profile" component={Profile} /&gt;
&lt;/Stack.Navigator&gt;

// In Home.tsx
const nav = useNavigation&lt;NativeStackNavigationProp&lt;RootStackParamList&gt;&gt;();
nav.navigate('Post', { id: '1' });  // typed
// nav.navigate('Post', { wrong: true }); // compile error</code></pre>

<h3>Example 2 — bottom tabs with badges</h3>
<pre><code class="language-tsx">&lt;Tabs.Navigator
  screenOptions={({ route }) =&gt; ({
    tabBarIcon: ({ color, size }) =&gt; {
      const icons = { Home: 'home', Search: 'search', Profile: 'user' } as const;
      return &lt;Icon name={icons[route.name]} color={color} size={size} /&gt;;
    },
  })}
&gt;
  &lt;Tabs.Screen name="Home" component={HomeStack} options={{ tabBarBadge: unreadCount || undefined }} /&gt;
  &lt;Tabs.Screen name="Search" component={SearchStack} /&gt;
  &lt;Tabs.Screen name="Profile" component={ProfileStack} /&gt;
&lt;/Tabs.Navigator&gt;</code></pre>

<h3>Example 3 — modal presentation</h3>
<pre><code class="language-tsx">&lt;Stack.Navigator&gt;
  &lt;Stack.Group&gt;
    &lt;Stack.Screen name="Home" component={Home} /&gt;
  &lt;/Stack.Group&gt;
  &lt;Stack.Group screenOptions={{ presentation: 'modal' }}&gt;
    &lt;Stack.Screen name="Compose" component={Compose} /&gt;
  &lt;/Stack.Group&gt;
&lt;/Stack.Navigator&gt;
// From anywhere: navigation.navigate('Compose')</code></pre>

<h3>Example 4 — deep link from notification</h3>
<pre><code class="language-tsx">import messaging from '@react-native-firebase/messaging';

useEffect(() =&gt; {
  messaging().onNotificationOpenedApp((msg) =&gt; {
    const { link } = msg.data;  // e.g., "myapp://post/42"
    Linking.openURL(link);
  });
  messaging().getInitialNotification().then((msg) =&gt; {
    if (msg?.data?.link) Linking.openURL(msg.data.link);
  });
}, []);</code></pre>

<h3>Example 5 — header back button with custom behavior</h3>
<pre><code class="language-tsx">function Post() {
  const nav = useNavigation();
  useLayoutEffect(() =&gt; {
    nav.setOptions({
      headerLeft: () =&gt; &lt;Pressable onPress={() =&gt; nav.popToTop()}&gt;&lt;Text&gt;Home&lt;/Text&gt;&lt;/Pressable&gt;,
    });
  }, [nav]);
  return &lt;View /&gt;;
}</code></pre>

<h3>Example 6 — confirm-before-leave</h3>
<pre><code class="language-tsx">function EditForm() {
  const nav = useNavigation();
  const [dirty, setDirty] = useState(false);

  useEffect(() =&gt; {
    const beforeRemove = nav.addListener('beforeRemove', (e) =&gt; {
      if (!dirty) return;
      e.preventDefault();
      Alert.alert('Discard changes?', '', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () =&gt; nav.dispatch(e.data.action) },
      ]);
    });
    return beforeRemove;
  }, [nav, dirty]);

  // ...
}</code></pre>

<h3>Example 7 — nested typing</h3>
<pre><code class="language-ts">type RootStackParamList = { Main: NavigatorScreenParams&lt;TabParamList&gt;; Auth: undefined };
type TabParamList = { Home: NavigatorScreenParams&lt;HomeStackParamList&gt;; Profile: { userId: string } };
type HomeStackParamList = { Feed: undefined; Post: { id: string } };

// Deep navigate
nav.navigate('Main', { screen: 'Home', params: { screen: 'Post', params: { id: '1' } } });</code></pre>

<h3>Example 8 — linking with query params</h3>
<pre><code class="language-ts">const linking = {
  prefixes: ['myapp://'],
  config: {
    screens: {
      Search: 'search?q=:query',   // myapp://search?q=react
    },
  },
};</code></pre>

<h3>Example 9 — drawer navigator</h3>
<pre><code class="language-tsx">import { createDrawerNavigator } from '@react-navigation/drawer';
const Drawer = createDrawerNavigator();
&lt;Drawer.Navigator drawerContent={(props) =&gt; &lt;CustomDrawer {...props} /&gt;}&gt;
  &lt;Drawer.Screen name="Home" component={Home} /&gt;
  &lt;Drawer.Screen name="Settings" component={Settings} /&gt;
&lt;/Drawer.Navigator&gt;</code></pre>

<h3>Example 10 — conditional auth stack</h3>
<pre><code class="language-tsx">function Root() {
  const { status } = useAuth();
  if (status === 'loading') return &lt;Splash /&gt;;
  return (
    &lt;Stack.Navigator screenOptions={{ headerShown: false }}&gt;
      {status === 'unauthenticated'
        ? &lt;Stack.Screen name="Auth" component={AuthStack} /&gt;
        : &lt;Stack.Screen name="Main" component={MainTabs} /&gt;}
    &lt;/Stack.Navigator&gt;
  );
}</code></pre>

<h3>Example 11 — Expo Router file with layout</h3>
<pre><code class="language-tsx">// app/_layout.tsx
import { Stack } from 'expo-router';
export default function RootLayout() {
  return (
    &lt;Stack&gt;
      &lt;Stack.Screen name="index" options={{ title: 'Home' }} /&gt;
      &lt;Stack.Screen name="post/[id]" options={{ title: 'Post' }} /&gt;
    &lt;/Stack&gt;
  );
}

// app/post/[id].tsx
import { Link, useLocalSearchParams } from 'expo-router';
export default function Post() {
  const { id } = useLocalSearchParams&lt;{ id: string }&gt;();
  return &lt;Text&gt;Post {id}&lt;/Text&gt;;
}

// somewhere
&lt;Link href={{ pathname: '/post/[id]', params: { id: '1' } }}&gt;Open post 1&lt;/Link&gt;</code></pre>

<h3>Example 12 — gesture to go back (native stack)</h3>
<p>Native stack navigator enables iOS swipe-back by default. To disable:</p>
<pre><code class="language-tsx">&lt;Stack.Screen name="Post" options={{ gestureEnabled: false }} /&gt;</code></pre>

<h3>Example 13 — passing callbacks between screens (anti-pattern)</h3>
<pre><code class="language-tsx">// BAD — functions in params aren't serializable
nav.navigate('Edit', { onSave: (data) =&gt; save(data) });

// GOOD — return the result via a store or event bus
nav.navigate('Edit');
// In Edit screen, dispatch action on save; original screen listens.</code></pre>

<h3>Example 14 — lazy screen load</h3>
<pre><code class="language-tsx">&lt;Tabs.Navigator screenOptions={{ lazy: true, unmountOnBlur: false }}&gt;
  &lt;Tabs.Screen name="Settings" component={lazy(() =&gt; import('./Settings'))} /&gt;
&lt;/Tabs.Navigator&gt;</code></pre>

<h3>Example 15 — analytics per screen</h3>
<pre><code class="language-tsx">useFocusEffect(useCallback(() =&gt; {
  analytics.screen('Post', { id: route.params.id });
}, [route.params.id]));</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Functions and class instances in params break persistence</h3>
<p>Navigation state is serialized to JSON for persistence and deep-linking. Non-JSON values (functions, Maps, Sets, class instances) don't survive. Keep params primitive; store complex objects in a store and pass the id.</p>

<h3>2. Nested deep-link parsing</h3>
<p>Nested navigators require nested <code>screens</code> config. A typo in one level silently fails to match. Use the <code>getStateFromPath</code> debugger to verify.</p>

<h3>3. Back button behavior</h3>
<p>Android hardware back: React Navigation handles automatically via <code>BackHandler</code>. If you want custom behavior on a specific screen, use <code>useFocusEffect</code> + <code>BackHandler.addEventListener('hardwareBackPress', ...)</code>.</p>

<h3>4. Deep link during cold start</h3>
<p>If the app is launched from a link, <code>linking</code> config handles it — but you often need a splash/init period first. Use <code>fallback</code> prop on NavigationContainer to show a screen until linking resolves.</p>

<h3>5. Tab state resets on language change</h3>
<p>Rebuilding navigator because of localization causes state reset. Use i18n libraries that don't force a top-level re-render (or use <code>onStateChange</code> to persist).</p>

<h3>6. Modal over tabs</h3>
<p>A modal presented over a tab navigator should be in the ROOT stack, not inside a tab's stack. Otherwise the tab bar remains visible.</p>

<h3>7. useIsFocused doesn't re-render on re-focus</h3>
<p>Re-focus doesn't trigger re-render unless something depends on the focus. <code>useFocusEffect</code> is what you want for mount-like behavior on focus.</p>

<h3>8. Header height varies with notch</h3>
<p>Headers include safe area top automatically in native stack. If you customize, use <code>useHeaderHeight()</code> hook for measurements (for scroll offsets).</p>

<h3>9. Gestures and ScrollView interaction</h3>
<p>iOS swipe-back gesture competes with horizontal ScrollView. Disable gesture on screens with horizontal scrolls, or configure <code>gestureResponseDistance</code>.</p>

<h3>10. Re-mounting on tab switch</h3>
<p>By default, tab screens are <em>kept mounted</em>. <code>unmountOnBlur: true</code> unmounts on leave. Memory vs state tradeoff.</p>

<h3>11. navigate vs push</h3>
<p><code>navigate('X', params)</code>: if X is already in the stack, it pops back to it and updates params. <code>push('X', params)</code>: always adds a new instance on top.</p>

<h3>12. goBack vs popToTop vs reset</h3>
<p><code>goBack</code>: one back. <code>popToTop</code>: back to stack root. <code>reset</code>: replace entire navigation state (whole tree). Reset is nuclear; prefer goBack/popToTop when semantically correct.</p>

<h3>13. iOS state restoration</h3>
<p>iOS preserves navigation state across app backgrounding. React Navigation's state persistence integrates via <code>onStateChange</code> + <code>initialState</code>. Required for some compliance use cases.</p>

<h3>14. Expo Router's file naming conventions</h3>
<ul>
  <li><code>(group)</code> — route groups, no URL path impact; used for layouts.</li>
  <li><code>[param]</code> — dynamic segment.</li>
  <li><code>[...slug]</code> — catch-all.</li>
  <li><code>_layout.tsx</code> — layout for the current directory.</li>
  <li><code>+not-found.tsx</code> — 404-equivalent.</li>
</ul>

<h3>15. Navigation events can fire on unmounted components</h3>
<p>Listeners via <code>nav.addListener</code> must be unsubscribed in cleanup. <code>useFocusEffect</code> manages this for focus effects.</p>

<h3>16. TypeScript narrows params to union across screens</h3>
<p>A screen can declare <code>undefined</code> params, meaning it takes none. Nested navigators with mixed params need <code>NavigatorScreenParams&lt;T&gt;</code> to compose types.</p>

<h3>17. Replace vs reset auth state</h3>
<p>Post-login: <code>nav.reset({ index: 0, routes: [{ name: 'Main' }] })</code> clears the auth stack from history. If you <code>navigate</code> or <code>push</code>, the Login screen remains reachable with back.</p>

<h3>18. Screen options vs Navigator options</h3>
<p>Options at the Navigator level apply to all children. Screen-level options override. Conditional options via function form.</p>

<h3>19. Tab bar hidden on nested screens</h3>
<p>A nested Stack screen may want to hide the parent tab bar. Use <code>tabBarStyle: { display: 'none' }</code> on the specific screen via <code>useLayoutEffect</code> in the child.</p>

<h3>20. Expo Router + React Navigation APIs</h3>
<p>Expo Router is built on React Navigation; many hooks still work. But prefer Expo Router's own <code>useRouter</code>, <code>useLocalSearchParams</code>, <code>Link</code> for Expo Router-specific features.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — passing functions / instances as params</h3>
<p>Breaks state persistence and deep links. Use a store or event bus for callbacks.</p>

<h3>Anti-pattern 2 — huge objects in params</h3>
<p>Serialized every state change. Store big data in cache; pass id.</p>

<h3>Anti-pattern 3 — deep linking without verification</h3>
<p>Adding a link to <code>prefixes</code> but not testing cold start / background return / notification-open paths. All three should be covered.</p>

<h3>Anti-pattern 4 — inconsistent screen registration</h3>
<p>Spelling the screen name differently in Navigator vs navigate() call. TypeScript typing prevents this — set up types from day 1.</p>

<h3>Anti-pattern 5 — using navigate() when push() is intended</h3>
<p>navigate re-uses existing screens; push always adds. For a "next step" flow (wizard, detail drill), push is usually correct.</p>

<h3>Anti-pattern 6 — relying on screen state that doesn't persist</h3>
<p>Users rotate device or background the app; screen state can reset. Persist critical data (form drafts) to storage, not just component state.</p>

<h3>Anti-pattern 7 — not unsubscribing listeners</h3>
<p><code>nav.addListener</code> returns an unsubscribe — don't drop it. Memory leaks and double-firing bugs otherwise.</p>

<h3>Anti-pattern 8 — over-using reset()</h3>
<p>reset nukes history. Use it only for major state changes (login, logout). For ordinary navigation, goBack / popToTop is cleaner.</p>

<h3>Anti-pattern 9 — mixing React Navigation versions</h3>
<p>Each major version (v5 → v6 → v7) has breaking changes. Don't mix lib versions across the tree.</p>

<h3>Anti-pattern 10 — navigation in render or effect without cleanup</h3>
<pre><code class="language-tsx">useEffect(() =&gt; { nav.navigate('Other'); }, []);
// If effect runs multiple times (StrictMode, prop changes), it navigates repeatedly.</code></pre>

<h3>Anti-pattern 11 — modal over incorrect root</h3>
<p>Nesting a modal inside a tab's stack causes the tab bar to show. Modals belong in the root stack.</p>

<h3>Anti-pattern 12 — ignoring navigation events for analytics</h3>
<p>Using manual screen logs per screen — fragile. Centralize via <code>onStateChange</code> on NavigationContainer.</p>

<h3>Anti-pattern 13 — not using native stack</h3>
<p>Legacy <code>createStackNavigator</code> (JS stack) vs <code>createNativeStackNavigator</code> (native UINavigationController). Native is faster and feels more like the platform. Use native unless you need custom JS-animated transitions.</p>

<h3>Anti-pattern 14 — header customization via Stack.Navigator screenOptions instead of per-screen</h3>
<p>Global options hide the fact that one screen overrides. Prefer explicit per-screen options in its component via <code>useLayoutEffect</code>.</p>

<h3>Anti-pattern 15 — missing "beforeRemove" guard on dirty forms</h3>
<p>User edits a form, swipes back, loses changes. Add <code>beforeRemove</code> listener with a confirm prompt.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. What are the main navigation options in RN?</div>
  <div class="qa-answer">
    <p><strong>React Navigation</strong> (most popular): JS-orchestrated with <code>react-native-screens</code> for native screen primitives. Stack, Tab, Drawer.</p>
    <p><strong>Expo Router</strong>: file-based routes on top of React Navigation. Directory structure → routes. Great for Expo apps.</p>
    <p><strong>React Native Navigation (Wix)</strong>: fully native navigation. Maximum perf; less flexibility; less ecosystem today.</p>
    <p>Pick React Navigation by default; Expo Router if on Expo and prefer file-based.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Walk me through setting up a typed stack navigator.</div>
  <div class="qa-answer">
<pre><code class="language-ts">type RootStackParamList = { Home: undefined; Post: { id: string } };
const Stack = createNativeStackNavigator&lt;RootStackParamList&gt;();

&lt;Stack.Navigator&gt;
  &lt;Stack.Screen name="Home" component={Home} /&gt;
  &lt;Stack.Screen name="Post" component={Post} /&gt;
&lt;/Stack.Navigator&gt;

// In Home:
const nav = useNavigation&lt;NativeStackNavigationProp&lt;RootStackParamList&gt;&gt;();
nav.navigate('Post', { id: '1' });  // typed
</code></pre>
    <p>Benefits: autocomplete, compile-time checks on screen names and params.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. How does deep linking work?</div>
  <div class="qa-answer">
    <p>React Navigation's <code>linking</code> prop maps URLs to navigation state. Setup:</p>
    <ol>
      <li>Declare <code>prefixes</code> (<code>myapp://</code>, <code>https://myapp.com</code>) and <code>config.screens</code> mapping routes to paths.</li>
      <li>iOS: configure Universal Links via <code>apple-app-site-association</code> on your domain; add associated domains entitlement.</li>
      <li>Android: configure App Links via intent filters in AndroidManifest + Digital Asset Links.</li>
      <li>Handle cold start: NavigationContainer's <code>linking</code> takes care of parsing the initial URL.</li>
      <li>Handle push notifications: get URL from notification payload, call <code>Linking.openURL(url)</code>.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. navigate() vs push() vs replace() vs reset()?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>navigate(name, params)</strong> — go to a screen. If already in stack, pops back to it and updates params.</li>
      <li><strong>push(name, params)</strong> — adds a new instance on top of the stack, even if already present.</li>
      <li><strong>replace(name, params)</strong> — replaces the current screen (no back).</li>
      <li><strong>reset(state)</strong> — replaces the entire navigation state with a new tree. Nukes history.</li>
    </ul>
    <p>Use navigate for normal nav, push for drill-down flows, replace for login redirects, reset for auth transitions.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. How do you handle authentication state in navigation?</div>
  <div class="qa-answer">
    <p>Swap the root-level screen based on auth status:</p>
<pre><code class="language-tsx">&lt;Stack.Navigator&gt;
  {user
    ? &lt;Stack.Screen name="Main" component={MainTabs} /&gt;
    : &lt;Stack.Screen name="Auth" component={AuthStack} /&gt;}
&lt;/Stack.Navigator&gt;</code></pre>
    <p>When user logs in, <code>user</code> changes → the whole navigator re-renders with the different Screen registered → history is implicitly reset. Clean pattern.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. A user reports their back-swipe doesn't work on iOS. What do you check?</div>
  <div class="qa-answer">
    <ol>
      <li>Is <code>gestureEnabled: false</code> set on the screen? Remove if accidental.</li>
      <li>Are you using native stack navigator, not JS-stack? JS-stack has different gesture behavior.</li>
      <li>Is there a horizontal ScrollView / swipeable row at the edge? Adjust <code>gestureResponseDistance</code>.</li>
      <li>Is the screen a modal? <code>presentation: 'modal'</code> uses a different dismiss gesture (swipe down).</li>
      <li>Is <code>headerBackVisible: false</code> set? Doesn't disable gesture but often correlated.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How do you implement a "prevent navigation when form is dirty" pattern?</div>
  <div class="qa-answer">
<pre><code class="language-tsx">useEffect(() =&gt; {
  const unsub = nav.addListener('beforeRemove', (e) =&gt; {
    if (!dirty) return;
    e.preventDefault();
    Alert.alert('Discard changes?', '', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () =&gt; nav.dispatch(e.data.action) },
    ]);
  });
  return unsub;
}, [nav, dirty]);</code></pre>
    <p>Catches both back button and swipe-back. Store <code>dirty</code> state from form.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How do you pass data back from a screen to its parent?</div>
  <div class="qa-answer">
    <p>Three options, most to least preferred:</p>
    <ol>
      <li><strong>External store</strong> (Zustand, Redux, Jotai): child writes; parent reads via subscription. Always works, persists across reloads.</li>
      <li><strong>navigation.navigate() with params to the previous screen</strong>: <code>nav.navigate({ name: 'Parent', params: { result: 'x' }, merge: true })</code> — merges params back to the existing screen.</li>
      <li><strong>Callback in params</strong>: passing a function as a param. Easy but breaks persistence — avoid.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Stack vs Tab vs Drawer — when to use each?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Stack</strong>: for drill-down / wizard flows. Every navigate pushes, goBack pops.</li>
      <li><strong>Tab</strong>: 3-5 top-level sections visible simultaneously at the bottom. iOS pattern.</li>
      <li><strong>Drawer</strong>: many top-level options, revealed via swipe or hamburger. Android convention (though tabs have become standard).</li>
    </ul>
    <p>Common composition: Tab (top level) where each tab is a Stack (drill-downs within).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. What's Expo Router?</div>
  <div class="qa-answer">
    <p>A file-based routing library for Expo apps built on top of React Navigation. Your directory structure under <code>app/</code> maps to routes. <code>_layout.tsx</code> defines navigators at each level. Dynamic segments via <code>[param].tsx</code>. Includes automatic deep linking via file names. For teams used to Next.js App Router, the mental model is familiar. Requires Expo runtime — not a choice for bare RN apps.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. How do you handle a cold-start deep link?</div>
  <div class="qa-answer">
    <p>React Navigation's <code>linking</code> handles this automatically — the NavigationContainer reads the initial URL when it mounts. Your job: configure <code>linking</code> with <code>prefixes</code> and <code>config.screens</code>, and ensure iOS/Android manifests declare the scheme/universal-link domains.</p>
    <p>For notifications: listen with <code>messaging().getInitialNotification()</code> on Firebase or the equivalent, extract the URL, and call <code>Linking.openURL(url)</code> after the app is initialized.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. How do you do analytics per screen?</div>
  <div class="qa-answer">
<pre><code class="language-tsx">const routeNameRef = useRef&lt;string&gt;();
&lt;NavigationContainer
  onReady={() =&gt; { routeNameRef.current = navRef.getCurrentRoute()?.name; }}
  onStateChange={() =&gt; {
    const prev = routeNameRef.current;
    const next = navRef.getCurrentRoute()?.name;
    if (prev !== next) {
      analytics.screen(next, navRef.getCurrentRoute()?.params);
      routeNameRef.current = next;
    }
  }}
/&gt;</code></pre>
    <p>Centralized. No per-screen boilerplate.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. What's the lifecycle of a screen in a stack?</div>
  <div class="qa-answer">
    <p>Screens remain <strong>mounted</strong> while they're in the stack, even if not focused (i.e., screen underneath). Focus changes trigger <code>focus</code> and <code>blur</code> events but do not remount. Popping off stack = unmount. Pushing new screen on top does NOT unmount the one beneath.</p>
    <p>Implication: state, effects, listeners on the underneath screen keep running. Use <code>useFocusEffect</code> to pause/resume work based on focus.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. How do you implement a custom transition animation?</div>
  <div class="qa-answer">
    <p>Native stack supports some built-ins via <code>animation</code> prop ('default', 'fade', 'slide_from_right', 'none'). For custom, you generally either:</p>
    <ul>
      <li>Switch to JS stack (<code>@react-navigation/stack</code>) which supports arbitrary animated transitions via <code>cardStyleInterpolator</code>.</li>
      <li>Build the transition inside the screen using Reanimated + SharedElement libraries.</li>
    </ul>
    <p>Tradeoff: JS stack is less native-feeling; Reanimated gives control but more complexity.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. What are the common perf pitfalls in navigation?</div>
  <div class="qa-answer">
    <ul>
      <li>Keeping all tab screens mounted when they have heavy effects. Use <code>lazy: true</code> on tabs.</li>
      <li>Re-creating navigator configuration every render. Declare outside components.</li>
      <li>Passing huge objects as params.</li>
      <li>Non-memoized header buttons — <code>setOptions</code> every render.</li>
      <li>Mixing JS and native stacks unnecessarily. Native is faster.</li>
      <li>Deep-linking config regex that doesn't match expected paths — silent failure.</li>
    </ul>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You use React Navigation with native stack by default.</li>
    <li>You type your ParamList and use the typed navigation hooks.</li>
    <li>You configure linking for deep links, universal links, notification routing.</li>
    <li>You keep params small and serializable; store complex data externally.</li>
    <li>You know navigate / push / replace / reset and their semantics.</li>
    <li>You use <code>useFocusEffect</code>, <code>beforeRemove</code>, and navigation events correctly.</li>
    <li>You centralize screen analytics via <code>onStateChange</code>.</li>
    <li>You pick Expo Router when file-based routing fits and you're on Expo.</li>
  </ul>
</div>
`}

]
});
