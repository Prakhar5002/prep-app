/* Practice challenges — RN Deep Dives: State, Data & Offline */
(function () {
  var reg = window.PREP_SITE.registerChallenge;

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-data-local-context-external', track: 'rn', category: 'rn-state-data',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'You\'re deciding between component-local useState, React Context, and an external store like Zustand for a piece of shared state. What\'s the actual axis you should reason on, and why does Context specifically become a performance liability that local state and external stores don\'t share?',
    answer: {
      core: `The real axis isn't "how global does this data feel" — it's <strong>update frequency × consumer breadth</strong>. Context re-renders every component that reads any value from that <code>Provider</code> whenever the provider's value changes, with no built-in selector — fine for slow-changing config (theme, auth session) shared by many consumers, wrong for frequently-changing state (a dragged coordinate, an input value, a counter) shared across many components, since every update re-renders every consumer regardless of whether it actually reads the changed field. External stores like Zustand solve exactly this: consumers subscribe to a slice via a selector function, and only the components whose selected slice actually changed re-render.`,
      mechanism: `React Context propagation is a provider-driven push — every fiber below that calls <code>useContext</code> for that context re-renders on value change, and wrapping the consumer in <code>memo</code> does nothing to stop it, since context consumption bypasses the prop-equality check entirely. Zustand's <code>useStore(selector)</code> instead subscribes to the store's internal listener list directly, diffing the selector's return value with <code>Object.is</code> before triggering a re-render — entirely outside React's context-propagation mechanism. A common self-inflicted version of the Context problem: passing an inline object literal as a provider's <code>value</code> prop (<code>value={{ theme, toggleTheme }}</code>) creates a new reference every render of the parent, so every consumer re-renders whenever the provider component re-renders, even if <code>theme</code> itself didn't change — fixed only by memoizing the value object itself.`,
      tradeoffs: `Splitting one Context into several fine-grained providers "fixes" the re-render problem but reintroduces its own nesting/boilerplate cost, and still lacks a store's ability to read and write state outside of React entirely (an interceptor, an event handler) without a hook. The opposite mistake is real too: reaching for Zustand/Jotai for every remotely-shared value is its own smell — for slow-changing global config with a handful of consumers, Context is simpler and adds zero dependencies.`,
      followups: [
        { q: 'A teammate memoizes the consuming component with React.memo to stop context-driven re-renders — why doesn\'t that work?', a: 'memo only skips a re-render triggered by a parent re-rendering with unchanged props; it does nothing for a re-render triggered by a subscribed context value changing, since that path doesn\'t go through props at all — the component still re-renders whenever the nearest matching provider\'s value changes, memo or not.' },
        { q: 'Is Context ever the wrong tool even for genuinely slow-moving data?', a: 'Yes, if the provider\'s value prop is recreated as a fresh object/array literal on every render of the parent — even a value that\'s conceptually unchanged (same theme, same user) then reads as "changed" by reference, and every consumer re-renders on every parent render regardless of actual data stability, until the value itself is memoized.' }
      ],
      redFlags: `Calling Context "a state management solution" as if it substitutes for a store (no built-in selectors, no persistence, no devtools); putting frequently-changing per-render or per-frame state in Context and being surprised by the resulting re-render storm across every consumer.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-data-tanstack-query-model', track: 'rn', category: 'rn-state-data',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'TanStack Query v5 has staleTime and gcTime (renamed from cacheTime). What\'s the actual distinction between them, and what wiring does an RN app specifically need for the library\'s automatic refetching to work at all?',
    answer: {
      core: `<code>staleTime</code> governs whether cached data is still considered fresh enough to skip an automatic refetch — default <code>0</code>, meaning data is immediately stale and eligible for a background refetch on the next trigger. <code>gcTime</code> governs how long an <em>inactive</em> query's data stays in memory before being garbage-collected once nothing observes it — default 5 minutes. They answer different questions: "is this data still good enough to serve without refetching" versus "how long do we keep this around once no one's looking." The v4→v5 rename from <code>cacheTime</code> to <code>gcTime</code> exists specifically to stop people conflating the two — <code>gcTime</code> is a memory-retention knob, not a second freshness setting.`,
      mechanism: `Left untouched, a query refetches in the background (stale-while-revalidate) on mount, on the RN equivalent of window-focus, and on network reconnect — but neither of the last two exists for free on RN, since there's no browser <code>visibilitychange</code>/<code>online</code> event. TanStack Query's RN integration has to wire <code>focusManager.setEventListener</code> to <code>AppState</code>'s foreground event and <code>onlineManager.setEventListener</code> to <code>@react-native-community/netinfo</code>'s connectivity state — without that wiring, an app that "looks" correctly configured simply never refetches on app-foreground or reconnect. Separately, mutations and queries default to <code>networkMode: 'online'</code>, meaning a query attempted while genuinely offline pauses rather than firing and failing — it does not silently error, it waits.`,
      tradeoffs: `Setting <code>staleTime</code> high (even <code>Infinity</code>) for data that rarely changes — a user's own profile, app config — is a legitimate, common pattern that turns TanStack Query into a manual-invalidation cache instead of a polling one. Applying that same trick indiscriminately to genuinely volatile data (a live order's status) reintroduces the stale-data bugs a naive fetch-in-<code>useEffect</code> already had, just now hidden behind more machinery.`,
      followups: [
        { q: 'What does gcTime: 0 concretely do?', a: 'As soon as the last component observing that query key unmounts, the cached data for that key is garbage-collected almost immediately, so remounting shows a loading state again rather than instant stale-then-refresh — useful for one-off data that should never linger, harmful if applied broadly since it defeats caching entirely.' },
        { q: 'Why would a query silently never refetch when the app is foregrounded on a real device, despite looking correctly configured in code?', a: 'Because RN doesn\'t fire a browser-style visibilitychange/focus event on its own — if the app hasn\'t wired focusManager to AppState\'s change event, TanStack Query has no signal that the app was ever backgrounded and refocused, so refetch-on-focus never fires despite the query itself being configured correctly.' }
      ],
      redFlags: `Treating gcTime and staleTime as two names for the same post-rename concept (they answer different questions — freshness vs. memory retention); assuming TanStack Query's focus/reconnect refetching "just works" on RN without wiring focusManager/onlineManager to AppState/NetInfo.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-data-mmkv-vs-asyncstorage', track: 'rn', category: 'rn-state-data',
    difficulty: 'core', type: 'deep-dive',
    prompt: 'You need a local key-value store for user preferences and a small cache. Why would you reach for MMKV over AsyncStorage in 2026, and where does AsyncStorage remain the more defensible choice?',
    answer: {
      core: `MMKV is a JSI-backed native library exposing genuinely <strong>synchronous</strong> get/set calls — no Promise, no bridge round-trip — backed by memory-mapped files, and benchmarks roughly 30x faster than AsyncStorage for typical read/write workloads. AsyncStorage is inherently promise-based by contract — every read/write is at minimum a microtask round-trip, regardless of how fast its underlying native implementation has gotten.`,
      mechanism: `MMKV's synchronous API matters specifically when a value is needed <em>during render or before first paint</em> — reading a persisted theme, locale, or feature flag synchronously inside a store's initializer avoids the loading flash an async <code>AsyncStorage.getItem</code> would force you to gate behind a splash screen. <code>react-native-mmkv</code> v4 ships as a Nitro Module — JSI-based like the New Architecture's own TurboModules, but not exclusive to it: Nitro Modules run on both the old (bridge/Paper) and new architecture, so the synchronous-JSI benefit isn't gated behind a New Architecture migration. AsyncStorage's community package, by contrast, keeps its traditional async/Promise contract regardless of which architecture its underlying native implementation talks to.`,
      tradeoffs: `AsyncStorage remains the more defensible default when you need classic Expo Go compatibility without a custom dev client (MMKV requires a native module, so it isn't available in the plain Expo Go sandbox), when doing a low-risk incremental migration of an app whose data flows are already async and don't need the perf bump, or when the read set is small and infrequent enough (a handful of settings read once at startup) that reaching for MMKV would be premature optimization. MMKV earns its keep specifically when values are read synchronously and often — UI state, feature flags, per-render lookups, or as the backing storage engine for a Zustand/Jotai persist middleware.`,
      followups: [
        { q: 'Does MMKV\'s synchronous API mean every write is durably flushed to disk instantly?', a: 'Not necessarily with the same guarantee as an fsync on every call — MMKV batches its underlying mmap flush for performance, trading a small window of durability risk on an abrupt process kill for speed. That\'s an acceptable tradeoff for preferences and caches, but it\'s a reason to keep truly authoritative data server-side rather than treating local storage as the source of truth.' },
        { q: 'Can MMKV directly replace AsyncStorage as a redux-persist or zustand-persist storage engine?', a: 'Yes — both accept a custom storage adapter, and MMKV\'s synchronous get/set actually satisfies the persist interface more naturally than AsyncStorage\'s promise-based one, since no extra async wrapping is required at the adapter layer.' }
      ],
      redFlags: `Assuming AsyncStorage is deprecated or unusable in 2026 (it's still a fine, simpler default for many cases — especially Expo Go and low-frequency reads); reaching for MMKV inside classic Expo Go and expecting it to work without a custom dev build, since it isn't a JS-only library.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-data-offline-first-sync', track: 'rn', category: 'rn-state-data',
    difficulty: 'staff', type: 'deep-dive',
    prompt: 'Design the actual mechanism for "offline-first" in an RN app that lets a user submit an action — like sending a message — while offline, and have it reliably sync once connectivity returns. Not "catch the network error and show a toast."',
    answer: {
      core: `Offline-first means every locally-initiated write is applied to local state immediately (so the UI reflects success instantly) and queued as a pending mutation <em>persisted to disk</em>, not held only in memory — the app might be killed before connectivity returns. On reconnect, queued mutations replay against the server in order, each reconciled against the server's authoritative response, with conflicts resolved by an explicit, chosen policy rather than left to whichever request happens to land last.`,
      mechanism: `The mutation <code>networkMode</code> that actually produces this pause-before-attempting behavior is the <strong>default</strong>, <code>'online'</code> — not <code>'offlineFirst'</code>, despite the name. <code>'offlineFirst'</code> runs the mutation function immediately regardless of connectivity and only pauses on a <em>retry</em> after a failed attempt; since mutations default to <code>retry: 0</code>, a mutation fired while genuinely offline under <code>offlineFirst</code> just fails outright rather than queuing. Under the default <code>'online'</code> mode, a mutation attempted while offline is held in a paused state and never fires the network call at all. Combined with a persisted query/mutation cache (<code>persistQueryClient</code> plus an MMKV/AsyncStorage-backed persister) and an explicit call to <code>queryClient.resumePausedMutations()</code> on app start, a paused mutation actually survives an app restart and resumes once <code>onlineManager</code> reports back online, replayed in original order by default. One extra piece is required specifically for persistence: mutation functions aren't serializable, so a persisted, paused mutation needs its function pre-registered via <code>queryClient.setMutationDefaults()</code>, keyed by mutation key, so the rehydrated cache has a runnable function to resume rather than just inert data. That's the JS-side half only: because JS timers and even NetInfo listeners don't run while the app is fully killed (not just backgrounded), genuine background sync — syncing before the user even reopens the app — requires OS-level background execution: iOS <code>BGTaskScheduler</code> (surfaced via <code>expo-background-task</code> or a native module) and Android <code>WorkManager</code>. Neither is something in-app JS retry logic can substitute for.`,
      tradeoffs: `Last-write-wins conflict resolution is the pragmatic default for the overwhelming majority of RN apps' actual data (a completed to-do, an updated draft) — genuine operational-transform/CRDT-style merging is disproportionate engineering cost, justified only for real multi-user concurrent editing, not typical mobile CRUD. The harder-to-get-right piece isn't the merge algorithm, it's making the queue itself durable <em>and idempotent</em> — a mutation replayed twice because the app was killed mid-sync must not double-submit, which is why each queued mutation should carry a client-generated idempotency key the server can dedupe on, rather than relying on "we only ever sent it once" being reliably true.`,
      followups: [
        { q: 'Why isn\'t catching the fetch failure and retrying via a simple in-memory queue sufficient?', a: 'An in-memory queue is lost the moment the app process is killed — common on mobile, especially when a user swipes away the app while offline — so anything meant to survive that has to be written to persistent storage (an MMKV/AsyncStorage-backed persister), not held only in a JS array.' },
        { q: 'What\'s the concrete role of an idempotency key here?', a: 'It lets the server recognize and dedupe a mutation that got sent twice — once before a connectivity drop made the client think it failed, and once during automatic replay after reconnect. Without one, the naive retry-on-reconnect pattern can create duplicate records on the server even though the client behaved exactly as designed.' }
      ],
      redFlags: `Treating "offline support" as just catching network errors and showing a retry button (that's graceful degradation, not offline-first); assuming JS-level timers/queues survive a fully killed app process without OS-level background-task integration.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-data-optimistic-rollback', track: 'rn', category: 'rn-state-data',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'Walk through the actual mechanics of an optimistic update with TanStack Query mutations — toggling a "like" button that should feel instant — and the specific race condition a naive implementation misses.',
    answer: {
      core: `The correct sequence lives in <code>onMutate</code>: cancel any in-flight queries for the affected key (so a slower in-flight fetch can't overwrite your optimistic write later), snapshot the current cached value, then <code>setQueryData</code> to the new optimistic value immediately — all before the mutation's network request even resolves. <code>onError</code> restores the snapshot if the mutation actually fails; <code>onSettled</code> invalidates the query regardless of outcome so the client eventually converges on the server's real state.`,
      mechanism: `<pre><code class="language-js">useMutation({
  mutationFn: toggleLike,
  onMutate: async (postId) => {
    await queryClient.cancelQueries({ queryKey: ['post', postId] });
    const previous = queryClient.getQueryData(['post', postId]);
    queryClient.setQueryData(['post', postId], (old) => ({ ...old, liked: !old.liked }));
    return { previous };
  },
  onError: (err, postId, context) => {
    queryClient.setQueryData(['post', postId], context.previous);
  },
  onSettled: (data, error, postId) => {
    queryClient.invalidateQueries({ queryKey: ['post', postId] });
  },
})</code></pre>The <code>cancelQueries</code> call is the piece naive implementations skip. Without it, an already-in-flight background refetch (say, fired because staleTime ran out right before the user tapped) can resolve <em>after</em> your optimistic <code>setQueryData</code> write and silently clobber it with stale pre-mutation data — the like button appears to revert on its own for no visible reason.`,
      tradeoffs: `Optimistic updates are the right call for actions with a high success rate and low domain risk — like/unlike, marking read, reordering a list — where a rare rollback is a minor cosmetic flicker. They're the wrong call for actions with real consequences on failure — a payment, an irreversible delete — where an honest, brief loading state that's upfront about pending server confirmation is more trustworthy than an instant UI that then has to visibly un-happen.`,
      followups: [
        { q: 'Why snapshot the previous value in onMutate rather than just refetching in onError?', a: 'Restoring the captured snapshot directly is synchronous and precise. Falling back to a fresh refetch on error adds another network round trip and a brief flash back to a loading state before the corrected data arrives — and if that refetch itself fails, you\'re left with no rollback at all.' },
        { q: 'What does onSettled\'s invalidate actually protect against that onMutate/onError don\'t?', a: 'It guards against the optimistic write (or its rollback) having silently drifted from the server\'s true state for reasons the client can\'t detect on its own — another user\'s concurrent edit, a server-side side effect the optimistic update didn\'t model. Invalidate forces one real refetch to reconcile, regardless of whether the mutation looked like it succeeded or failed from the client\'s point of view.' }
      ],
      redFlags: `Implementing optimistic updates without cancelQueries first (a live race against an in-flight background refetch); using optimistic updates for high-stakes irreversible actions (payments, deletes) where an honest pending state is more appropriate than instant fake success.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-data-secure-storage', track: 'rn', category: 'rn-state-data',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'An RN app needs to persist an auth refresh token, a user\'s theme preference, and a large cached API response. Why shouldn\'t all three go through the same storage mechanism, and what is the secure-storage option actually backed by on each platform?',
    answer: {
      core: `These three values have genuinely different requirements. A refresh token demands OS-level, encrypted, access-controlled storage, since its compromise means account takeover; a theme preference is small, non-sensitive, and read constantly, so it wants fast synchronous access; a large cached API response is bulky and non-secret and shouldn't be crammed through a mechanism designed for small secrets. <code>expo-secure-store</code> (or <code>react-native-keychain</code>) targets the first case; MMKV/AsyncStorage target the second and third.`,
      mechanism: `On iOS, <code>expo-secure-store</code> writes into the <strong>Keychain</strong>, with the OS itself enforcing the configured accessibility level (by default requiring the device to be unlocked) independent of anything the app does. On Android, <code>expo-secure-store</code> is backed by the <strong>Android Keystore</strong> directly — it generates an AES/GCM key (falling back to an RSA-hybrid scheme on old API levels below 23) inside hardware-backed Keystore, uses that key to encrypt/decrypt the value itself, and writes the resulting ciphertext into an ordinary, non-encrypted <code>SharedPreferences</code> file. That's a meaningfully different mechanism from Android's own <code>EncryptedSharedPreferences</code> helper class — which <code>react-native-keychain</code> can optionally use instead, and which Google deprecated in April 2025, though it remains functional for apps already depending on it. Either way, the encryption key itself never leaves hardware-backed Keystore, which is the property that actually matters for security. That's a materially different security boundary than MMKV/AsyncStorage, which store values in the app's own sandboxed file storage — protected by iOS/Android app sandboxing, but not by a hardware-backed secure enclave.`,
      tradeoffs: `Secure-storage APIs come with real constraints that make them wrong for bulk data: <code>expo-secure-store</code> enforces a small per-key size limit (historically around 2048 bytes on iOS, since it's backed directly by Keychain items), and reads/writes are meaningfully slower than MMKV since they cross into OS-level encrypted storage rather than a fast mmap'd file. The correct architecture is secrets — refresh/access tokens, biometric-gated unlock keys — in secure storage, and everything else — preferences, feature flags, cached responses, session hints — in MMKV/AsyncStorage.`,
      followups: [
        { q: 'Is it acceptable to keep a short-lived access token in MMKV even if the refresh token is properly in secure storage?', a: 'That\'s a common, generally accepted pragmatic tradeoff, since the access token\'s short lifetime bounds the blast radius of a leak. The refresh token — the one that can mint new access tokens indefinitely — is the one that must never leave OS-backed secure storage, since its compromise has a much larger and longer-lived blast radius.' },
        { q: 'Does using expo-secure-store alone protect against a rooted or jailbroken device?', a: 'No — Keychain/Keystore protections assume OS integrity, and a rooted/jailbroken device can potentially bypass those guarantees. Secure storage is a baseline expectation, not a substitute for separate device-integrity/root-jailbreak detection if that\'s a real part of the app\'s threat model.' }
      ],
      redFlags: `Storing refresh tokens or any long-lived credential in MMKV/AsyncStorage "because it's faster" (that's app-sandboxed storage, not OS-enforced secure storage); trying to cram a large cached blob through expo-secure-store and hitting its per-key size ceiling.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-data-persisted-migration', track: 'rn', category: 'rn-state-data',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'Your app\'s persisted Zustand/Redux store has been through three shape changes across app versions — a renamed field, a restructured nested object, a removed slice. A user upgrades straight from version 1 to the current version. What actually has to happen for their persisted state not to corrupt or crash the app on launch?',
    answer: {
      core: `Persist middleware (Zustand's <code>persist</code>, redux-persist) exposes a <code>version</code> number and a <code>migrate</code> function specifically for this: on load, the persisted blob's stored version is compared to the current code's declared version, and if it's lower, <code>migrate(persistedState, storedVersion)</code> runs a chain of transforms to bring the old shape forward before it's ever handed to the store. It's not optional bookkeeping — it's the only thing standing between a clean upgrade and downstream code silently reading a shape that no longer matches its assumptions.`,
      mechanism: `<pre><code class="language-js">persist(storeCreator, {
  name: 'app-store',
  version: 4,
  migrate: (persisted, fromVersion) => {
    if (fromVersion < 2) persisted = renameField(persisted);
    if (fromVersion < 3) persisted = restructureNested(persisted);
    if (fromVersion < 4) persisted = dropRemovedSlice(persisted);
    return persisted;
  },
})</code></pre>Each conditional is a single, independently-testable step, so a user skipping several app versions at once (v1 straight to v4) still runs the full accumulated chain in order, rather than needing a special-cased "v1-to-v4" transform. Forgetting to bump <code>version</code> after a genuine shape change is the single most common way teams get this wrong — the stored version stays equal to the current one, <code>migrate</code> never runs, and mismatched old-shaped data is fed directly to code assuming the new shape, typically surfacing as a crash reading a property that no longer exists rather than an obvious "migration failed" error.`,
      tradeoffs: `The real discipline this needs is treating "did the persisted shape change" as a checklist item on every PR touching that store, since there's no compiler error connecting a TypeScript interface change to a forgotten version bump — it's a purely conventional, easy-to-skip step. Teams that skip bumping version because "most changes are additive and backward-compatible" are making a real bet, not a free pass — an additive required field that old persisted data lacks needs the same version+migrate treatment as a rename, just with a smaller transform.`,
      followups: [
        { q: 'What should migrate do if it encounters a shape it genuinely doesn\'t recognize — corrupted, or from an unhandled ancient version?', a: 'Fail safe by discarding to a known-good default state rather than guessing a migration and doubling down on a bad structure. A corrupted blob feeding a bad guess forward is worse than a clean reset the user barely notices for something like preferences.' },
        { q: 'How do you actually test migration paths, given they only run once per real user upgrade?', a: 'Seed the storage engine directly with hand-crafted "old shape" blobs at each historical version in a test, run the app\'s real migrate function against each, and assert the output matches the current shape — exercising the actual conditional chain rather than only manually verifying on one device upgraded by hand once.' }
      ],
      redFlags: `Changing a persisted store's shape without bumping the version number (migrate silently never runs); assuming "most users are on a recent version anyway" as a reason to skip handling multi-version jumps in a single migrate chain.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-data-hydration-startup', track: 'rn', category: 'rn-state-data',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'An app using a persisted Zustand store briefly renders default/empty state before flashing to the real persisted values on every cold start. What\'s actually happening, and how do you gate startup correctly?',
    answer: {
      core: `Persist middleware's rehydration is asynchronous by contract, even with a synchronous storage engine underneath — the store initializes with its declared defaults first, then asynchronously rehydrates from disk, and by default nothing in the render tree waits for that to finish. The first frame renders default state before the rehydrated values swap in.`,
      mechanism: `Zustand's <code>persist</code> middleware exposes <code>onRehydrateStorage</code> (a callback fired when rehydration starts/finishes) and a <code>persist.hasHydrated()</code> check specifically to gate render on. The correct pattern holds a splash screen (<code>expo-splash-screen</code>'s <code>preventAutoHideAsync</code> at app entry) or a loading gate until a <code>hasHydrated</code> flag flips true, then renders the real tree — mirroring exactly the same "read persisted state before mounting the real tree" pattern React Navigation's own state persistence requires for its <code>initialState</code>, for the identical underlying reason: the read is inherently async even when the diff feels instant.`,
      tradeoffs: `Switching the persist middleware's storage engine to MMKV can make the effective read fast enough that the flash becomes imperceptible in practice, but that's a performance mitigation, not a correctness fix — the middleware's rehydration lifecycle is still async by contract (it wraps even a synchronous call in a promise internally for a uniform API across engines), so code that renders before checking <code>hasHydrated</code> is still racing it structurally, it just usually wins that race with MMKV. Relying on "usually wins" rather than actually gating is the kind of bug that resurfaces the moment the app adds one more synchronous startup task ahead of it.`,
      followups: [
        { q: 'Is this the same underlying problem as React Navigation\'s own state-persistence gating?', a: 'Yes, structurally identical: an async read has to complete and be explicitly gated before the dependent tree renders, whether that tree is the navigator (React Navigation\'s initialState) or the whole app (a persisted store\'s hydration) — both need an isReady/hasHydrated boolean and a loading placeholder, not an assumption that the read finishes before first paint.' },
        { q: 'What breaks if you skip the loading gate entirely and let default state render first?', a: 'Any code that branches on persisted state at mount — "if the user is already onboarded, skip to the main app" — makes that decision against default/empty state on the very first render, which can mean flashing the onboarding screen to an already-onboarded returning user for one frame, or worse, firing side effects tied to that branch against the wrong initial condition.' }
      ],
      redFlags: `Assuming a synchronous-storage engine like MMKV makes rehydration synchronous end-to-end just because the underlying read is fast (the middleware's hydration lifecycle is still async by contract); branching startup logic (onboarding skip, auth redirect) on persisted state before confirming hasHydrated is true.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-data-choosing-at-scale', track: 'rn', category: 'rn-state-data',
    difficulty: 'staff', type: 'deep-dive',
    prompt: 'A team starting a new RN app asks you to just pick the state-management stack. What\'s the actual senior/staff-level answer, and what specific signals push you toward Zustand+TanStack Query versus Redux Toolkit(+RTK Query) versus Jotai?',
    answer: {
      core: `There isn't a universal winner — all three client-state options (with TanStack Query for server state layered in regardless, since that's a largely orthogonal choice) are production-grade in 2026. The right call is read off team size, need for enforced conventions and shared tooling, and the actual shape of the app's state — a few big slices versus many small independent atoms — not a feature-by-feature comparison.`,
      mechanism: `Zustand + TanStack Query is the pragmatic default for small-to-mid teams and most product apps: minimal boilerplate, no required provider wrapping, selector-based re-render control out of the box, and a clean separation of "client state" (Zustand) from "server state" (TanStack Query) that maps directly onto how most app data actually behaves. Redux Toolkit(+RTK Query) earns its extra ceremony specifically on larger, multi-team codebases, because of what that ceremony buys: enforced action/reducer conventions that keep many contributors consistent, mature time-travel debugging via Redux DevTools, and an established middleware ecosystem that ad hoc Zustand stores don't standardize by convention. Jotai fits best when state is naturally many small, independently-updating pieces that compose bottom-up — a form with dozens of interdependent computed fields, fine-grained UI state — exactly where a single big Zustand/Redux slice would force unrelated fields to share one update boundary.`,
      tradeoffs: `The actual staff-level failure mode isn't picking "the wrong one" in isolation — all three are viable — it's picking based on résumé-driven interest or defaulting to whatever the last team used, without checking it against this app's actual team size and state shape. That's how a five-person team ends up carrying Redux's ceremony as unjustified overhead, or a forty-person team lets an unstructured Zustand store sprawl into inconsistent per-feature conventions with no shared, reviewable devtools story.`,
      followups: [
        { q: 'Does choosing Zustand mean giving up devtools/time-travel debugging?', a: 'No — Zustand has its own Redux DevTools middleware integration giving comparable time-travel and action-log inspection. The real gap versus Redux Toolkit is enforced convention (Redux\'s reducer/action pattern is closer to structurally mandatory), not tooling access, since the devtools story itself is roughly comparable.' },
        { q: 'Is TanStack Query a replacement for the client store in any of these stacks?', a: 'No, regardless of which client store is chosen — TanStack Query specifically owns server state (cached, fetched, invalidatable async data), while the client store owns local/UI/derived state that has no server source of truth. Stuffing fetched server data into Zustand/Redux and hand-rolling caching and invalidation is the actual anti-pattern to push back on, not the choice of which client store sits beside TanStack Query.' }
      ],
      redFlags: `Picking a state library by team preference/familiarity alone without checking it against team size and state shape; hand-rolling server-state caching and invalidation inside a client store instead of using TanStack Query for that concern regardless of which client store is chosen.`
    }
  });

})();
