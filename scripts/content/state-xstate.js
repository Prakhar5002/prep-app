window.PREP_SITE.registerTopic({
  id: 'state-xstate',
  module: 'state-deep',
  title: 'XState (State Machines)',
  estimatedReadTime: '40 min',
  tags: ['xstate', 'state-machines', 'finite-state-machine', 'fsm', 'statecharts', 'actors', 'react'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>XState</strong> is a JavaScript library for building <em>finite state machines</em> and <em>statecharts</em>. It's the right answer when your state has <strong>discrete modes</strong> with <strong>specific transitions</strong> — not just data, but a model of behavior. Think: form wizards, video player UIs, payment flows, retry-with-backoff, multi-step authentication.</p>
<ul>
  <li><strong>State machine = states + events + transitions.</strong> Each state defines which events it accepts and where they lead.</li>
  <li><strong>Statecharts = state machines + hierarchy + parallel regions + history.</strong> Harel's 1987 extension; XState implements this.</li>
  <li><strong>Why XState vs reducers?</strong> Reducers don't model the <em>shape</em> of behavior — every action runs from any state. Machines forbid invalid transitions at the type level.</li>
  <li><strong>"Make impossible states impossible."</strong> The phrase that sells statecharts. A "loading + error + success" combination shouldn't be representable.</li>
  <li><strong>Visualizable.</strong> XState's Visualizer renders your machine as a diagram; PMs and designers can review behavior.</li>
  <li><strong>Actors</strong> (XState v5+): each machine instance is an actor; actors compose to model entire systems.</li>
  <li><strong>When NOT to use:</strong> simple CRUD UIs, settings pages, lists. Overkill for state without distinct modes.</li>
  <li><strong>Learning curve</strong> is real. The mental model is foreign to most React devs; budget 2-3 days to be productive.</li>
</ul>
<p><strong>Mantra:</strong> "Discrete modes + specific transitions = state machine. Make illegal states unrepresentable. Visualize before coding."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What is a finite state machine?</h3>
<p>A computational model with a finite set of states. Exactly one state is active at a time. Events trigger transitions to other states. Some events are accepted only in certain states; others are ignored or forbidden.</p>

<h3>What is a statechart?</h3>
<p>An extension of finite state machines (David Harel, 1987) that adds:</p>
<ul>
  <li><strong>Hierarchy:</strong> states can contain sub-states.</li>
  <li><strong>Parallel regions:</strong> multiple state machines running concurrently.</li>
  <li><strong>History states:</strong> "go back to where we were before entering this region."</li>
  <li><strong>Guards:</strong> conditional transitions.</li>
  <li><strong>Actions:</strong> side effects on entry, exit, or transition.</li>
</ul>
<p>XState implements the SCXML-flavored version of statecharts.</p>

<h3>Why XState exists</h3>
<p>The problem: most app state is modeled as flags ("isLoading," "isError," "isOpen," "isAuthenticated"). With N flags, you have 2^N possible combinations — most of them invalid. Statecharts force you to enumerate the legal modes and the transitions between them.</p>

<pre><code class="language-text">// Without state machine — 4 booleans, 16 combinations:
{ isLoading: true, isError: true, isSuccess: false, hasData: false }
// what does this even mean? Is the loading? errored? both?

// With state machine — explicit states:
state: 'idle' | 'loading' | 'success' | 'error'
// 4 modes; transitions between them defined; impossible combinations gone.
</code></pre>

<h3>Where statecharts shine</h3>
<table>
  <thead><tr><th>Domain</th><th>Why a statechart</th></tr></thead>
  <tbody>
    <tr><td>Form wizards</td><td>Each step is a state; transitions defined; can't skip ahead.</td></tr>
    <tr><td>Video / audio players</td><td>play / pause / buffering / ended; specific events trigger specific transitions.</td></tr>
    <tr><td>Authentication flows</td><td>idle / submitting / 2FA-prompt / verifying / authenticated.</td></tr>
    <tr><td>Payment / checkout</td><td>cart → review → payment → 3DS → success / failed.</td></tr>
    <tr><td>Retry with backoff</td><td>attempting / waiting / succeeded / failed; transitions on timer events.</td></tr>
    <tr><td>WebSocket connections</td><td>connecting / open / closing / closed; specific events.</td></tr>
    <tr><td>Drag-and-drop</td><td>idle / picking-up / dragging / dropping; gesture events.</td></tr>
    <tr><td>Multi-step interactions with side effects</td><td>any flow with cleanup / setup per step.</td></tr>
  </tbody>
</table>

<h3>Where statecharts are overkill</h3>
<ul>
  <li>Pure data forms (settings, profile editing).</li>
  <li>Lists with simple filters.</li>
  <li>Single-screen dashboards reading server state.</li>
  <li>Components with &lt;3 distinct modes.</li>
</ul>

<h3>Why interviewers ask</h3>
<ol>
  <li>Tests architectural reasoning — distinguishing data state from behavioral state.</li>
  <li>Statecharts are gaining adoption in mid-size and enterprise frontend teams.</li>
  <li>The "make illegal states unrepresentable" mindset signals senior-level thinking.</li>
  <li>XState's actor model is increasingly relevant as apps grow more concurrent / async.</li>
</ol>

<h3>What "good" looks like</h3>
<ul>
  <li>You recognize statechart-shaped problems by their distinct modes and forbidden transitions.</li>
  <li>You don't reach for XState for simple data state.</li>
  <li>You name the states first, then the events, then the transitions — in that order.</li>
  <li>You use guards for conditional transitions, not nested if-else inside actions.</li>
  <li>You visualize the machine before coding it (XState's editor / Stately Studio).</li>
  <li>You know the distinction between data (context) and state (mode).</li>
  <li>For React: you use <code>useMachine</code> or <code>useActor</code> hooks; you don't manually orchestrate.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The 4 building blocks</h3>
<table>
  <thead><tr><th>Block</th><th>Role</th></tr></thead>
  <tbody>
    <tr><td><strong>States</strong></td><td>Named modes of the machine. Exactly one is "current."</td></tr>
    <tr><td><strong>Events</strong></td><td>Things that can happen. <code>{ type: 'SUBMIT', data }</code>.</td></tr>
    <tr><td><strong>Transitions</strong></td><td>Rules: "in state X, on event Y, go to state Z."</td></tr>
    <tr><td><strong>Context</strong></td><td>Extended data carried alongside states (form values, retry count, etc.).</td></tr>
  </tbody>
</table>

<h3>The simplest possible machine</h3>
<pre><code class="language-text">      ┌────────┐  TOGGLE  ┌────────┐
      │   off  │ ────────►│   on   │
      └────────┘          └───┬────┘
                              │
                              │ TOGGLE
                              ▼
                          [ off ]
</code></pre>
<pre><code class="language-js">import { createMachine } from 'xstate';

const toggleMachine = createMachine({
  id: 'toggle',
  initial: 'off',
  states: {
    off: { on: { TOGGLE: 'on' } },
    on:  { on: { TOGGLE: 'off' } },
  },
});
</code></pre>

<h3>Hierarchical states (substates)</h3>
<pre><code class="language-text">authMachine:
  unauthenticated
  authenticating
    submitting
    awaiting2fa
    verifying
  authenticated
</code></pre>
<p>The "authenticating" state has its own internal sub-machine. You enter "authenticating," go through sub-states, then exit to "authenticated" or back to "unauthenticated."</p>

<h3>Parallel regions</h3>
<pre><code class="language-text">videoPlayerMachine:
  type: 'parallel'
  states:
    playback:    // one region
      states: [ paused, playing, ended ]
    network:     // another region, independent
      states: [ idle, loading, ready, error ]
</code></pre>
<p>The video player tracks playback and network independently; both can be in any state simultaneously.</p>

<h3>Guards (conditional transitions)</h3>
<pre><code class="language-js">on: {
  SUBMIT: [
    { target: 'success', cond: 'isValid' },
    { target: 'error',   cond: 'isInvalid' },
  ]
}
</code></pre>
<p>Guards are pure functions; they decide which transition to take based on event + context.</p>

<h3>Actions (side effects)</h3>
<table>
  <thead><tr><th>Type</th><th>When fires</th></tr></thead>
  <tbody>
    <tr><td><code>entry</code></td><td>When entering a state</td></tr>
    <tr><td><code>exit</code></td><td>When leaving a state</td></tr>
    <tr><td>Transition action</td><td>On a specific event/transition</td></tr>
    <tr><td>invoke (services)</td><td>Async work tied to a state's lifetime</td></tr>
  </tbody>
</table>

<h3>Context = extended state</h3>
<p>States are <em>finite</em> (a small set of named modes). Context is <em>infinite</em> (any data: form values, retry count, error message). Context is updated via <code>assign()</code> action:</p>
<pre><code class="language-js">on: {
  RETRY: {
    target: 'submitting',
    actions: assign({ retryCount: (ctx) =&gt; ctx.retryCount + 1 }),
  }
}
</code></pre>

<h3>Invoke = async work</h3>
<pre><code class="language-js">states: {
  submitting: {
    invoke: {
      id: 'fetchUser',
      src: 'fetchUser',                    // a Promise-returning function
      onDone: { target: 'success', actions: assign({ user: (_, e) =&gt; e.data }) },
      onError: { target: 'error',   actions: assign({ error: (_, e) =&gt; e.data }) },
    }
  }
}
</code></pre>

<h3>Actors (XState v5+)</h3>
<p>Each machine instance is an "actor": something that can receive events and update over time. Multiple actors can run concurrently and communicate via events.</p>

<h3>The "modes vs data" rule</h3>
<p>Always ask: is this <em>data</em> (context) or <em>behavior</em> (state)? A counter going up and down is data. "User is paying / completed / cancelled" is state. Be explicit.</p>

<h3>The "draw it first" rule</h3>
<p>Before coding, draw the diagram (paper or Stately Studio). Statecharts read better as diagrams than as code; if you can't draw it, you don't understand it.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Installation</h3>
<pre><code class="language-bash">yarn add xstate @xstate/react
</code></pre>

<h3>Basic machine</h3>
<pre><code class="language-ts">import { createMachine, assign } from 'xstate';

interface Context {
  user: User | null;
  error: string | null;
}

type Event =
  | { type: 'FETCH'; id: string }
  | { type: 'RETRY' };

const machine = createMachine({
  id: 'user',
  initial: 'idle',
  context: { user: null, error: null } as Context,
  types: {} as { context: Context; events: Event },
  states: {
    idle: {
      on: { FETCH: 'loading' }
    },
    loading: {
      invoke: {
        src: 'fetchUser',
        input: ({ event }) =&gt; ({ id: event.id }),
        onDone: {
          target: 'success',
          actions: assign({ user: ({ event }) =&gt; event.output }),
        },
        onError: {
          target: 'error',
          actions: assign({ error: ({ event }) =&gt; String(event.error) }),
        },
      },
    },
    success: { type: 'final' },
    error: {
      on: { RETRY: 'loading' }
    },
  },
}, {
  actors: {
    fetchUser: fromPromise(async ({ input }) =&gt; {
      const r = await fetch(\`/api/users/\${input.id}\`);
      return r.json();
    }),
  },
});
</code></pre>

<h3>Using in React</h3>
<pre><code class="language-tsx">import { useMachine } from '@xstate/react';

function UserView() {
  const [state, send] = useMachine(machine);

  if (state.matches('idle')) return &lt;button onClick={() =&gt; send({ type: 'FETCH', id: 'u1' })}&gt;Load&lt;/button&gt;;
  if (state.matches('loading')) return &lt;Spinner /&gt;;
  if (state.matches('error')) return &lt;&gt;
    &lt;p&gt;Error: {state.context.error}&lt;/p&gt;
    &lt;button onClick={() =&gt; send({ type: 'RETRY' })}&gt;Retry&lt;/button&gt;
  &lt;/&gt;;
  if (state.matches('success')) return &lt;Profile user={state.context.user!} /&gt;;
  return null;
}
</code></pre>

<h3>Hierarchical states</h3>
<pre><code class="language-ts">const machine = createMachine({
  id: 'auth',
  initial: 'unauthenticated',
  states: {
    unauthenticated: {
      on: { LOGIN: 'authenticating' }
    },
    authenticating: {
      initial: 'submitting',
      states: {
        submitting: {
          invoke: { src: 'login', onDone: 'awaiting2fa', onError: '#auth.unauthenticated' }
        },
        awaiting2fa: {
          on: { VERIFY: 'verifying' }
        },
        verifying: {
          invoke: { src: 'verify2fa', onDone: '#auth.authenticated', onError: 'awaiting2fa' }
        },
      }
    },
    authenticated: {
      on: { LOGOUT: 'unauthenticated' }
    },
  }
});

// state.matches('authenticating')  → true if in any sub-state
// state.matches('authenticating.submitting') → true only if in that exact one
</code></pre>

<h3>Parallel states</h3>
<pre><code class="language-ts">const playerMachine = createMachine({
  id: 'player',
  type: 'parallel',
  states: {
    playback: {
      initial: 'paused',
      states: {
        paused: { on: { PLAY: 'playing' } },
        playing: { on: { PAUSE: 'paused', END: 'ended' } },
        ended: { on: { PLAY: 'playing' } },
      }
    },
    fullscreen: {
      initial: 'normal',
      states: {
        normal: { on: { FULLSCREEN: 'fs' } },
        fs: { on: { FULLSCREEN: 'normal' } },
      }
    }
  }
});

// state.matches({ playback: 'playing', fullscreen: 'fs' })
</code></pre>

<h3>Guards</h3>
<pre><code class="language-ts">const machine = createMachine({
  // ...
  on: {
    SUBMIT: [
      { target: 'success', guard: ({ context }) =&gt; context.value.length &gt; 0 },
      { target: 'error' }
    ]
  }
});

// Or named guards (testable, reusable):
{
  // ...
  on: { SUBMIT: { target: 'success', guard: 'isValid' } }
}, {
  guards: {
    isValid: ({ context }) =&gt; context.value.length &gt; 0
  }
}
</code></pre>

<h3>Actions on entry / exit / transition</h3>
<pre><code class="language-ts">states: {
  loading: {
    entry: 'logEntry',
    exit: 'logExit',
    on: {
      DONE: { target: 'success', actions: 'celebrate' }
    }
  }
}
// In options:
{
  actions: {
    logEntry: () =&gt; console.log('entered loading'),
    logExit: () =&gt; console.log('exited loading'),
    celebrate: () =&gt; analytics.track('done'),
  }
}
</code></pre>

<h3>Delayed transitions</h3>
<pre><code class="language-ts">states: {
  notification: {
    on: { SHOW: 'visible' }
  },
  visible: {
    after: { 3000: 'notification' }   // auto-dismiss after 3s
  }
}
</code></pre>

<h3>History states</h3>
<pre><code class="language-ts">states: {
  workspace: {
    initial: 'home',
    states: {
      home: { /* ... */ },
      profile: { /* ... */ },
      hist: { type: 'history' }   // remembers last sub-state
    }
  },
  modal: {
    on: { CLOSE: 'workspace.hist' }   // returns to wherever we were
  }
}
</code></pre>

<h3>Self-transitions vs internal transitions</h3>
<pre><code class="language-ts">states: {
  active: {
    entry: 'logEntry',
    on: {
      // External self-transition: exits and re-enters; logEntry fires again
      RESET: 'active',
      // Internal: stays in state; entry doesn't re-fire
      UPDATE: { actions: 'doUpdate' }
    }
  }
}
</code></pre>

<h3>Using actor model (XState v5)</h3>
<pre><code class="language-ts">import { createActor } from 'xstate';

const actor = createActor(machine);
actor.subscribe((snapshot) =&gt; console.log(snapshot.value));
actor.start();

actor.send({ type: 'FETCH', id: 'u1' });

// Each machine instance is an actor; actors can spawn child actors.
</code></pre>

<h3>Spawning child actors</h3>
<pre><code class="language-ts">import { spawn, fromPromise } from 'xstate';

const parentMachine = createMachine({
  // ...
  context: { childRefs: [] },
  on: {
    NEW_CHILD: {
      actions: assign({
        childRefs: ({ context, spawn }) =&gt; [
          ...context.childRefs,
          spawn(childMachine, { id: \`child-\${Date.now()}\` })
        ]
      })
    }
  }
});
</code></pre>

<h3>Visualizing</h3>
<p>Stately Studio (<a href="https://stately.ai/" target="_blank">stately.ai</a>) renders your machine as an interactive diagram. You can edit the diagram and export TypeScript / JS. Many teams design statecharts in Stately first, then implement.</p>

<h3>Testing</h3>
<pre><code class="language-ts">import { createActor } from 'xstate';

test('login flow', () =&gt; {
  const actor = createActor(machine);
  actor.start();

  expect(actor.getSnapshot().value).toBe('unauthenticated');

  actor.send({ type: 'LOGIN' });
  expect(actor.getSnapshot().value).toEqual({ authenticating: 'submitting' });

  // simulate fetch resolution by dispatching the internal event...
});

// Or use @xstate/test for model-based testing — auto-generates test cases from the chart.
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Form wizard (3-step signup)</h3>
<pre><code class="language-ts">const wizardMachine = createMachine({
  id: 'wizard',
  initial: 'profile',
  context: { name: '', email: '', address: '' },
  states: {
    profile: {
      on: {
        NEXT: { target: 'address', guard: 'profileFilled', actions: 'saveProfile' },
        UPDATE: { actions: assign((ctx, e) =&gt; ({ ...ctx, ...e.data })) },
      }
    },
    address: {
      on: {
        NEXT: { target: 'review', guard: 'addressFilled', actions: 'saveAddress' },
        BACK: 'profile',
        UPDATE: { actions: assign((ctx, e) =&gt; ({ ...ctx, ...e.data })) },
      }
    },
    review: {
      on: {
        SUBMIT: 'submitting',
        BACK: 'address',
      }
    },
    submitting: {
      invoke: {
        src: 'submit',
        input: ({ context }) =&gt; context,
        onDone: 'success',
        onError: 'review',   // back to review on failure
      }
    },
    success: { type: 'final' }
  }
}, {
  guards: {
    profileFilled: ({ context }) =&gt; !!context.name &amp;&amp; !!context.email,
    addressFilled: ({ context }) =&gt; !!context.address,
  }
});
</code></pre>

<h3>Example 2: Retry with exponential backoff</h3>
<pre><code class="language-ts">const retryMachine = createMachine({
  id: 'retry',
  initial: 'idle',
  context: { attempt: 0, lastError: null },
  states: {
    idle: { on: { START: 'attempting' } },
    attempting: {
      invoke: {
        src: 'request',
        onDone: 'success',
        onError: { target: 'waiting', actions: assign({ lastError: (_, e) =&gt; e.data }) },
      }
    },
    waiting: {
      after: {
        // exponential backoff: 1s, 2s, 4s, 8s
        DELAY: { target: 'attempting', actions: assign({ attempt: (c) =&gt; c.attempt + 1 }) },
      },
      always: { target: 'failed', guard: ({ context }) =&gt; context.attempt &gt;= 4 },
    },
    success: { type: 'final' },
    failed: { type: 'final' },
  }
}, {
  delays: {
    DELAY: ({ context }) =&gt; Math.pow(2, context.attempt) * 1000,
  }
});
</code></pre>

<h3>Example 3: Authentication with 2FA</h3>
<pre><code class="language-ts">const authMachine = createMachine({
  id: 'auth',
  initial: 'unauthenticated',
  context: { user: null, twoFactorRequired: false, error: null },
  states: {
    unauthenticated: {
      on: { LOGIN: 'submitting' }
    },
    submitting: {
      invoke: {
        src: 'login',
        onDone: [
          { target: 'awaiting2fa', guard: ({ event }) =&gt; event.output.requires2fa },
          { target: 'authenticated', actions: 'storeUser' }
        ],
        onError: { target: 'unauthenticated', actions: 'storeError' }
      }
    },
    awaiting2fa: {
      on: {
        VERIFY: 'verifying',
        CANCEL: 'unauthenticated',
      }
    },
    verifying: {
      invoke: {
        src: 'verify2fa',
        onDone: { target: 'authenticated', actions: 'storeUser' },
        onError: 'awaiting2fa'
      }
    },
    authenticated: {
      on: { LOGOUT: { target: 'unauthenticated', actions: 'clearUser' } }
    }
  }
});
</code></pre>

<h3>Example 4: Video player with parallel state</h3>
<pre><code class="language-ts">const playerMachine = createMachine({
  id: 'player',
  type: 'parallel',
  states: {
    playback: {
      initial: 'paused',
      states: {
        paused: { on: { PLAY: 'playing' } },
        playing: {
          on: { PAUSE: 'paused', END: 'ended' },
          invoke: { src: 'tickInterval' }    // emits TICK events
        },
        ended: { on: { PLAY: 'playing' } }
      }
    },
    sound: {
      initial: 'normal',
      states: {
        normal: { on: { MUTE: 'muted' } },
        muted: { on: { UNMUTE: 'normal' } }
      }
    },
    fullscreen: {
      initial: 'normal',
      states: {
        normal: { on: { FULLSCREEN: 'fs' } },
        fs: { on: { FULLSCREEN: 'normal' } }
      }
    }
  }
});

// state.matches({ playback: 'playing', sound: 'muted', fullscreen: 'fs' })
</code></pre>

<h3>Example 5: WebSocket connection lifecycle</h3>
<pre><code class="language-ts">const wsMachine = createMachine({
  id: 'ws',
  initial: 'disconnected',
  context: { socket: null, retryCount: 0 },
  states: {
    disconnected: {
      on: { CONNECT: 'connecting' }
    },
    connecting: {
      invoke: {
        src: 'connectSocket',
        onDone: { target: 'connected', actions: assign({ socket: (_, e) =&gt; e.data, retryCount: 0 }) },
        onError: 'reconnecting'
      }
    },
    connected: {
      on: {
        DISCONNECT: 'disconnected',
        SOCKET_ERROR: 'reconnecting'
      },
      invoke: {
        src: 'listenSocket',
        // listenSocket emits events for incoming messages
      }
    },
    reconnecting: {
      after: {
        2000: { target: 'connecting', actions: assign({ retryCount: (c) =&gt; c.retryCount + 1 }) }
      },
      always: { target: 'failed', guard: ({ context }) =&gt; context.retryCount &gt;= 5 }
    },
    failed: { /* terminal */ }
  }
});
</code></pre>

<h3>Example 6: Toast notification with auto-dismiss</h3>
<pre><code class="language-ts">const toastMachine = createMachine({
  id: 'toast',
  initial: 'hidden',
  context: { message: '', kind: 'info' },
  states: {
    hidden: { on: { SHOW: { target: 'visible', actions: 'storeMessage' } } },
    visible: {
      after: { 3000: 'dismissing' },
      on: { DISMISS: 'dismissing', SHOW: { target: 'visible', actions: 'storeMessage' } }
    },
    dismissing: {
      after: { 200: 'hidden' }   // animation duration
    }
  }
});
</code></pre>

<h3>Example 7: Drag and drop</h3>
<pre><code class="language-ts">const dndMachine = createMachine({
  id: 'dnd',
  initial: 'idle',
  context: { item: null, x: 0, y: 0 },
  states: {
    idle: {
      on: { POINTER_DOWN: { target: 'maybeDragging', actions: 'storeItem' } }
    },
    maybeDragging: {
      after: { 200: 'dragging' },        // long-press to begin drag
      on: {
        POINTER_UP: 'idle',
        POINTER_MOVE: { target: 'dragging', guard: 'movedFar' }
      }
    },
    dragging: {
      on: {
        POINTER_MOVE: { actions: 'updatePos' },
        POINTER_UP: { target: 'idle', actions: 'drop' }
      }
    }
  }
});
</code></pre>

<h3>Example 8: Multi-step purchase flow</h3>
<pre><code class="language-ts">const checkoutMachine = createMachine({
  id: 'checkout',
  initial: 'cart',
  context: { items: [], shipping: null, payment: null },
  states: {
    cart: {
      on: {
        REVIEW: { target: 'review', guard: 'cartNotEmpty' }
      }
    },
    review: {
      on: { CONTINUE: 'shipping', BACK: 'cart' }
    },
    shipping: {
      on: { CONTINUE: { target: 'payment', guard: 'shippingFilled' }, BACK: 'review' }
    },
    payment: {
      on: { SUBMIT: 'processing', BACK: 'shipping' }
    },
    processing: {
      invoke: {
        src: 'submitOrder',
        onDone: 'success',
        onError: 'payment'
      }
    },
    success: { type: 'final' }
  }
});
</code></pre>

<h3>Example 9: Search with debounce</h3>
<pre><code class="language-ts">const searchMachine = createMachine({
  id: 'search',
  initial: 'idle',
  context: { query: '', results: [] },
  states: {
    idle: {
      on: { TYPE: { target: 'debouncing', actions: assign({ query: (_, e) =&gt; e.value }) } }
    },
    debouncing: {
      after: { 300: 'searching' },
      on: { TYPE: { target: 'debouncing', actions: assign({ query: (_, e) =&gt; e.value }) } }   // reset
    },
    searching: {
      invoke: {
        src: 'search',
        input: ({ context }) =&gt; context.query,
        onDone: { target: 'idle', actions: assign({ results: (_, e) =&gt; e.output }) },
        onError: 'idle'
      }
    }
  }
});
</code></pre>

<h3>Example 10: Hierarchical with shared exits</h3>
<pre><code class="language-ts">const machine = createMachine({
  initial: 'app',
  states: {
    app: {
      initial: 'home',
      on: {
        // events handled at the parent level — work from any sub-state
        LOGOUT: '#auth.unauthenticated',
        OPEN_HELP: '.help'
      },
      states: {
        home: {},
        profile: {},
        settings: {},
        help: { on: { CLOSE: 'home' } }
      }
    },
    auth: {
      states: {
        unauthenticated: { on: { LOGIN: '#app' } }
      }
    }
  }
});
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>States vs context confusion</h3>
<p>Beginners try to model "current page index" as a state ("step1," "step2," "step3"). Pages that mostly differ in data are usually one state with context. States are for distinct <em>behaviors</em>, not distinct data.</p>

<h3>Forgetting to invoke services</h3>
<p>Beginner mistake: putting an async fetch inside an action. Actions are sync. Async work must use <code>invoke</code> (which has lifetime tied to the state).</p>

<h3>Self-transition vs internal action</h3>
<pre><code class="language-ts">// External self-transition (re-runs entry/exit):
on: { TICK: '.' }   // "go to current state again"

// Internal (entry/exit don't re-fire):
on: { TICK: { actions: 'doSomething' } }
</code></pre>

<h3>Final states inside hierarchy</h3>
<p>A "final" sub-state triggers <code>onDone</code> on the parent. Useful for sequences but easy to forget.</p>

<h3>State value shape</h3>
<pre><code class="language-ts">// Simple state
state.value === 'idle'

// Hierarchical:
state.value === { authenticating: 'submitting' }

// Parallel:
state.value === { playback: 'playing', sound: 'muted' }

// Always use state.matches() instead of comparing state.value directly:
state.matches('idle')                    // ✓
state.matches({ authenticating: 'submitting' })   // ✓
</code></pre>

<h3>useMachine vs useActor (v5)</h3>
<p><code>useMachine</code> creates an actor and manages it; <code>useActor</code> connects to an existing actor. Use <code>useMachine</code> for component-local; <code>useActor</code> for actors created/managed elsewhere.</p>

<h3>Stale closures in actions</h3>
<p>Actions referenced in machine config receive context+event as parameters; don't rely on outer-scope React state.</p>

<h3>Visualizer-only features</h3>
<p>The visualizer shows the chart; some XState features (like complex spawn() patterns) don't render cleanly. Don't write code that's hard to visualize unless necessary.</p>

<h3>Performance: too many actors</h3>
<p>Spawning hundreds of small actors is fine; spawning thousands hurts. Profile before scaling.</p>

<h3>Persisting machine state</h3>
<pre><code class="language-ts">// Save
const persisted = actor.getPersistedSnapshot();
storage.setItem('state', JSON.stringify(persisted));

// Restore
const restored = JSON.parse(storage.getItem('state'));
const actor = createActor(machine, { snapshot: restored });
actor.start();
</code></pre>

<h3>Concurrent rendering</h3>
<p>XState integrates via <code>useSyncExternalStore</code>; safe under React 18 concurrent rendering.</p>

<h3>Type narrowing</h3>
<pre><code class="language-tsx">// state.matches doesn't narrow context types
if (state.matches('success')) {
  state.context.user;   // still User | null
}
// Use a type guard or a getter
</code></pre>

<h3>Don't model purely async data</h3>
<p>"Loading user data" — could be a state machine (idle / loading / success / error), but if all you want is request lifecycle, React Query handles it without ceremony.</p>

<h3>Events vs actions confusion</h3>
<p>Events are inputs to the machine (something that happened). Actions are outputs (side effects to run). Naming should reflect this: events as past-tense or imperative ("CLICKED", "SUBMIT"), actions as imperative ("logClick", "saveData").</p>

<h3>Order of entry actions in hierarchy</h3>
<p>Entering <code>app.profile.edit</code> from outside fires entry actions for <code>app</code>, <code>profile</code>, <code>edit</code> in that order. Exit actions fire in reverse on leaving. Order matters for setup/teardown.</p>

<h3>Spawn cleanup</h3>
<p>Spawned actors need to be stopped when no longer needed; otherwise leak. Use <code>stopChild</code> action or rely on parent state lifecycle.</p>

<h3>after delays under app backgrounding (mobile)</h3>
<p>JS timers pause/throttle when the app backgrounds; <code>after</code> delays may fire later than expected. For exact timing, schedule via native APIs and send events to the machine.</p>

<h3>Multiple guards on same event</h3>
<pre><code class="language-ts">on: {
  SUBMIT: [
    { target: 'a', guard: 'cond1' },
    { target: 'b', guard: 'cond2' },
    { target: 'c' }   // fallback if no guard matches
  ]
}
</code></pre>
<p>Order matters; first matching transition wins.</p>

<h3>Sending events before actor starts</h3>
<p><code>actor.send</code> before <code>actor.start()</code> is queued; events fire on start.</p>

<h3>State explosion</h3>
<p>If your chart has 50 states and 200 transitions, the diagram is unreadable. Decompose into multiple machines / actors. The complexity is real; statecharts visualize it but don't reduce it.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: Modeling data as states</h3>
<pre><code class="language-ts">// BAD — every counter value is a state
states: {
  zero: {}, one: {}, two: {}, ...   // ❌
}

// GOOD — one state, count in context
context: { count: 0 },
states: { active: {} }
</code></pre>

<h3>Bug 2: Async work inside an action</h3>
<pre><code class="language-ts">// BAD — actions are sync
on: {
  SUBMIT: { actions: async () =&gt; await api.submit() }   // ❌
}

// GOOD — use invoke
states: {
  submitting: {
    invoke: { src: 'submit', onDone: 'success', onError: 'error' }
  }
}
</code></pre>

<h3>Bug 3: Comparing state.value as string</h3>
<pre><code class="language-ts">// BAD
if (state.value === 'authenticating') ...   // fails for hierarchical { authenticating: 'submitting' }

// GOOD
if (state.matches('authenticating')) ...
</code></pre>

<h3>Bug 4: Forgetting initial state</h3>
<p>Every state with sub-states needs an <code>initial</code> field; otherwise XState throws.</p>

<h3>Bug 5: Action that mutates context</h3>
<pre><code class="language-ts">// BAD
actions: ({ context }) =&gt; { context.count++; }

// GOOD
actions: assign({ count: ({ context }) =&gt; context.count + 1 })
</code></pre>

<h3>Bug 6: Self-transition to non-final sub-state</h3>
<pre><code class="language-ts">// External self-transition: re-enters; can re-spawn invoked services
states: {
  loading: {
    invoke: { src: 'fetch', ... },
    on: { RETRY: 'loading' }   // re-enters; cancels previous invoke, starts new
  }
}
</code></pre>
<p>Subtle but powerful: external self-transition is how you "retry" by re-invoking.</p>

<h3>Bug 7: Spawned actor leaks</h3>
<pre><code class="language-ts">// Spawned, never stopped
context: { ref: spawn(machine) }
// On state exit, ref still alive → memory leak

// FIX — stop on exit
exit: 'stopRef',
actions: { stopRef: stopChild('ref') }
</code></pre>

<h3>Bug 8: Visualizer drift</h3>
<p>Stately Studio diagram out of sync with code. Treat one as source of truth (usually the code; export the diagram as documentation).</p>

<h3>Bug 9: Over-using context</h3>
<p>Every form field in context, all actions writing to context. Smells like a giant reducer with extra steps. Consider whether all those fields are truly machine state vs separate data.</p>

<h3>Bug 10: Final states without onDone consumer</h3>
<p>You marked a state final; nothing listens for the parent's onDone. Either add an onDone handler or rethink the design.</p>

<h3>Anti-pattern 1: Statechart for a CRUD form</h3>
<p>Settings page with a save button and validation. State: idle / saving / saved. That's three states; useState is fine. Don't import XState.</p>

<h3>Anti-pattern 2: One mega-machine for the whole app</h3>
<p>Hierarchical / parallel everything; the diagram is illegible. Decompose into multiple actors, one per feature.</p>

<h3>Anti-pattern 3: Hiding business logic in actions</h3>
<p>The diagram is clean but actions are 100-line functions doing complex work. Push business logic to services / guards / reducers; keep actions tight.</p>

<h3>Anti-pattern 4: Mixing XState and Redux</h3>
<p>Both manage state; using both creates two mental models. Pick one per project (or per feature, with clear boundaries).</p>

<h3>Anti-pattern 5: Skipping the visualizer</h3>
<p>The single biggest XState benefit is visual. Always run the chart through Stately Studio at least once before shipping.</p>

<h3>Anti-pattern 6: Missing tests</h3>
<p>State machines are eminently testable: walk every transition path, assert state changes. Use <code>@xstate/test</code> for model-based testing.</p>

<h3>Anti-pattern 7: Putting persistent server state in machines</h3>
<p>Server data (lists, cached entities) belongs in React Query / RTK Query. Machines model behavior; servers hold data. Don't conflate.</p>

<h3>Anti-pattern 8: Ignoring TypeScript types</h3>
<p>XState v5 has excellent TS support. Define your event union; let TS narrow events in transitions.</p>

<h3>Anti-pattern 9: Complex actor hierarchies for simple cases</h3>
<p>Spawning a hierarchy of 5 actors when one machine would do is overengineering. Start simple.</p>

<h3>Anti-pattern 10: Not learning the visualizer</h3>
<p>Stately Studio (the editor) is a powerful authoring tool. Skipping it means you debug XState by reading the chart in code — much slower.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '🎤 Interview Patterns',
      html: `
<h3>The 12 questions worth rehearsing</h3>
<table>
  <thead><tr><th>Question</th><th>One-liner</th></tr></thead>
  <tbody>
    <tr><td><em>What's a finite state machine?</em></td><td>A model with discrete states, events, and transitions; one state active at a time.</td></tr>
    <tr><td><em>State machine vs statechart?</em></td><td>Statecharts add hierarchy, parallel regions, history, guards, actions.</td></tr>
    <tr><td><em>When use XState?</em></td><td>When state has discrete modes with specific allowed transitions; not for simple data.</td></tr>
    <tr><td><em>What's "make impossible states impossible"?</em></td><td>Eliminating combinations like "loading + error" by enumerating real states.</td></tr>
    <tr><td><em>States vs context?</em></td><td>States are finite modes; context is unbounded data carried alongside.</td></tr>
    <tr><td><em>Actions vs services?</em></td><td>Actions are sync side effects; services (invoke) are async work tied to state lifetime.</td></tr>
    <tr><td><em>What's a guard?</em></td><td>A pure predicate gating a transition.</td></tr>
    <tr><td><em>What's the actor model?</em></td><td>Each machine instance is an autonomous unit that receives events and may spawn children.</td></tr>
    <tr><td><em>How do you visualize?</em></td><td>Stately Studio renders the chart as a diagram.</td></tr>
    <tr><td><em>How do you test?</em></td><td>Walk transitions; assert state changes. <code>@xstate/test</code> for model-based.</td></tr>
    <tr><td><em>Performance considerations?</em></td><td>State changes are cheap; many actors are fine; profile if scaling beyond hundreds.</td></tr>
    <tr><td><em>When NOT to use XState?</em></td><td>Simple CRUD, lists, settings, single-flag state.</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li>Build a toggle machine.</li>
  <li>Build a fetch lifecycle machine (idle/loading/success/error/retry).</li>
  <li>Build an authentication machine with 2FA branching.</li>
  <li>Build a video player with parallel playback + sound regions.</li>
  <li>Build a wizard with three steps and back-navigation.</li>
  <li>Add retry-with-backoff via <code>after</code> + <code>guard</code>.</li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>Beginner models a counter as states 0,1,2... — should be context with one state.</li>
  <li>Async fetch inside <code>actions</code> — should be inside <code>invoke</code>.</li>
  <li>Comparing <code>state.value</code> as a string for a hierarchical state — use <code>state.matches</code>.</li>
  <li>Mutating context directly — use <code>assign</code>.</li>
  <li>Spawned actor never stopped — memory leak.</li>
  <li>Statechart used for a settings form — likely overkill.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Recognizing the shape</td><td>You volunteer "this looks like a state machine" when it actually is.</td></tr>
    <tr><td>Discriminating data from behavior</td><td>You know what goes in states vs context.</td></tr>
    <tr><td>Hierarchy / parallelism awareness</td><td>You can name when to use them.</td></tr>
    <tr><td>Visualization habit</td><td>You volunteer "I'd diagram this first."</td></tr>
    <tr><td>Honest tool selection</td><td>You don't reach for XState on simple problems.</td></tr>
    <tr><td>Async fluency</td><td>You use invoke; you handle onDone/onError; you tie services to state lifetime.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li><strong>Form wizards / onboarding flows</strong> map cleanly to statecharts.</li>
  <li><strong>Native bridge state</strong> (camera permissions, location services) — request → granted → denied → settings → granted.</li>
  <li><strong>WebSocket / live data</strong> connection lifecycle — perfect statechart shape.</li>
  <li><strong>App lifecycle</strong> (foreground / background / suspended) interacts with timers; XState's <code>after</code> may need pause/resume on background.</li>
  <li><strong>In-app purchase flow</strong> — picker → confirm → processing → succeeded / failed / refunded.</li>
  <li><strong>Animation sequences</strong> — start → playing → paused → finished.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"Why use a state machine over a switch reducer?"</em> — A reducer doesn't model which actions are valid in which state. The machine forbids "DISCONNECT in disconnected" implicitly; a reducer would just handle it as a no-op.</li>
  <li><em>"What's the difference between <code>after</code> and <code>setTimeout</code>?"</em> — <code>after</code> is tied to state lifetime; if the state exits, the timer is cancelled. setTimeout fires regardless; you have to track and clear it manually.</li>
  <li><em>"How do you persist machine state?"</em> — <code>actor.getPersistedSnapshot()</code> serializes; restore by passing <code>{ snapshot }</code> on creation. State machines are inherently snapshot-friendly.</li>
  <li><em>"How are actors different from generators / sagas?"</em> — Actors have addresses (you send to them); generators yield. Actors model concurrent entities; sagas describe sequential side-effect flows. Both useful; different shapes.</li>
  <li><em>"Why aren't more teams using XState?"</em> — Learning curve. Most React devs aren't familiar with statecharts. The wins come on complex behavioral state; simpler state has cheaper alternatives.</li>
</ul>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Audit which features have complex behavioral state (multi-step flows, retry logic, real-time connections).</li>
  <li>Identify any mega-reducers or boolean-flag state that's a hidden state machine.</li>
  <li>Diagram the most complex flow in Stately Studio; share with the team.</li>
  <li>Pick one high-leverage flow to migrate to XState as a proof of value.</li>
  <li>Set up @xstate/test for model-based testing.</li>
  <li>Document "when to use XState vs Zustand / React Query / useReducer" for the team.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd add @xstate/test and write model-based tests for our top 3 flows."</li>
  <li>"I'd integrate Stately Studio into our design review process so PMs review state machines before we build."</li>
  <li>"I'd create reusable machine factories for common patterns (retry-with-backoff, debounced fetch)."</li>
  <li>"I'd add tooling to auto-export machine diagrams into our design docs."</li>
  <li>"I'd persist key actors to disk so we can resume long-running flows after app restart."</li>
</ul>
`
    }
  ]
});
