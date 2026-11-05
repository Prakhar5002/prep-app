window.PREP_SITE.registerTopic({
  id: "ai-vector-search",
  module: "ai",
  title: "Embeddings & Vector Search",
  estimatedReadTime: "45 min",
  tags: ["ai","embeddings","vector-search","pgvector","hnsw","ann","hybrid-search","bm25","rrf","rag"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Embeddings turn <strong>meaning into geometry</strong>; ANN indexes (HNSW / IVF / PQ) make "nearest" fast by trading a little recall — and production search adds <strong>hybrid keyword + RRF</strong>, <strong>in-query tenant/ACL filters</strong>, and a <strong>versioned re-embedding plan</strong>.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Embedding</strong> = fixed-length vector from a contrastively trained model; distance ≈ semantic dissimilarity; dimensions aren't individually meaningful.</li>
    <li><strong>Same model, same dims, both sides.</strong> Vectors from different models (or dimension settings) are incomparable — store <code>embed_model</code> on every row.</li>
    <li><strong>Metrics:</strong> for unit-length vectors cosine, dot and L2 rank identically (L2² = 2 − 2·cos) → use dot. Otherwise use what the model card says.</li>
    <li><strong>Exact</strong> search is O(N·d): fine to ~100k vectors and the ground truth for measuring ANN recall.</li>
    <li><strong>HNSW:</strong> layered graph; <code>M</code>, <code>ef_construction</code>, <code>ef_search</code> (runtime knob, pgvector default 40); best recall-per-ms, memory-hungry, deletes = tombstones.</li>
    <li><strong>IVF:</strong> k-means lists + <code>probes</code>; cheaper, needs training data, decays with drift. <strong>PQ / quantization:</strong> 4–64× smaller, lossy → over-fetch and re-score.</li>
    <li><strong>pgvector:</strong> opclass must match the operator (<code>&lt;=&gt;</code> cosine, <code>&lt;#&gt;</code> negative inner product, <code>&lt;-&gt;</code> L2); <code>ORDER BY</code> the operator ASC + <code>LIMIT</code>; <code>EXPLAIN</code> to confirm index use; halfvec for big dims.</li>
    <li><strong>Filtering trap:</strong> post-filtered ANN returns fewer than k rows for selective filters → iterative scans, partitions/namespaces, partial indexes, or exact scan of a small subset.</li>
    <li><strong>Tenant/ACL filter = authorization</strong>, from the verified token, inside the same query.</li>
    <li><strong>Hybrid:</strong> BM25 catches exact rare tokens, vectors catch paraphrase; fuse with <strong>RRF</strong> Σ 1/(60 + rank) — rank-based, no score calibration.</li>
    <li><strong>Sizing:</strong> 1536 × float32 = 6 KB/vector → 1M ≈ 6 GB raw (budget ~2× with pgvector HNSW); fewer dims, halfvec or quantization cut it. HNSW on 1M in RAM ≈ single-digit ms at 0.95–0.99 recall; a hosted embedding call ≈ 20–150 ms; embedding 1M chunks × 500 tokens is roughly a $10 job, not a $10k one.</li>
    <li><strong>Scores aren't calibrated</strong> — thresholds are per model and get re-tuned on every model change.</li>
    <li><strong>Re-embedding</strong> = blue/green: version → parallel index → dual-write → backfill → shadow-eval → flag cut-over → drop old.</li>
    <li>Start with pgvector; move to a dedicated engine for 100M+ vectors, heavy write/QPS, in-index filtering or built-in hybrid needs.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Post-filtering a shared ANN index by tenant:</strong> HNSW returns the global top <code>ef_search</code> candidates, most belong to other tenants, and a small customer silently gets 0–2 results — or another tenant's data if the app-side filter is ever skipped. Fix: filter inside the query from the auth context, plus iterative scans, per-tenant partitions/namespaces, or exact scan on small subsets.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Embeddings turn meaning into geometry; an ANN index like HNSW trades a little recall for big latency wins, and I tune ef_search against recall@k measured against brute force."</div>
  <div class="revision-say">"I run hybrid — BM25 for exact tokens like order IDs, vectors for paraphrase — fused with Reciprocal Rank Fusion, and tenant filters live inside the query because they're authorization, not ranking."</div>
  <div class="revision-say">"Every vector carries its model tag, because changing models means a full blue/green re-embed — vectors from different models aren't comparable."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What an embedding actually is</h3>
<p>An embedding model is a neural network (usually a transformer encoder) trained with a <strong>contrastive objective</strong>: given pairs that should match (a question and the passage that answers it, a caption and its image, two paraphrases), pull their vectors together; push unrelated pairs apart. After training on hundreds of millions of pairs, the model's output vector encodes "what this text is about" well enough that <em>distance ≈ semantic dissimilarity</em>.</p>
<ul>
  <li>The output has a fixed dimension <code>d</code> — commonly 384, 768, 1024, 1536 or 3072 — regardless of input length.</li>
  <li>Individual dimensions are <strong>not interpretable</strong> ("dimension 17 = sports" is a myth). Only relative positions mean anything.</li>
  <li>There's a max input length (e.g. ~8k tokens for OpenAI's v3 models at time of writing — check current docs). A whole 40-page PDF squashed into one vector becomes an average of everything = useful for nothing. That's why RAG <em>chunks</em> documents first (see <a href="#/topic/ai-rag">RAG</a>).</li>
  <li>Vectors are only comparable <strong>within the same model (and same dimension setting)</strong>. A vector from model A and one from model B live in unrelated spaces.</li>
</ul>

<h3>Why keyword search isn't enough</h3>
<p>Keyword search (BM25, Postgres full-text, Elasticsearch) matches <em>tokens</em>. It fails on vocabulary mismatch:</p>
<table>
  <thead><tr><th>User types</th><th>Document says</th><th>Keyword</th><th>Vector</th></tr></thead>
  <tbody>
    <tr><td>"cancel my booking"</td><td>"How to release a reserved meeting room"</td><td>miss</td><td>hit</td></tr>
    <tr><td>"app keeps logging me out"</td><td>"Session expiry and refresh token behaviour"</td><td>miss</td><td>hit</td></tr>
    <tr><td>"¿cómo reservo una sala?"</td><td>English booking guide</td><td>miss</td><td>hit (multilingual model)</td></tr>
  </tbody>
</table>

<h3>Why vector search isn't enough either</h3>
<table>
  <thead><tr><th>User types</th><th>Problem for vectors</th></tr></thead>
  <tbody>
    <tr><td>"error E1023"</td><td>Rare exact token; the vector for E1023 sits near E1024, E1032 … all "error-code-ish"</td></tr>
    <tr><td>"INV-2024-0042"</td><td>Identifiers have no semantic neighbourhood</td></tr>
    <tr><td>"rooms <em>without</em> a projector"</td><td>Embeddings handle negation poorly — "with" and "without projector" land close together</td></tr>
    <tr><td>"bookings after 15 March"</td><td>Numbers and dates are structured data → use a <code>WHERE</code> clause, not similarity</td></tr>
  </tbody>
</table>
<p>That's why mature systems run <strong>hybrid search</strong> (keyword + vector) and push structured constraints into <strong>filters</strong>.</p>

<h3>What vector search is used for</h3>
<ul>
  <li><strong>Semantic search</strong> over docs, tickets, products, help centres.</li>
  <li><strong>RAG retrieval</strong> — finding the passages an LLM should answer from (<a href="#/topic/ai-rag">RAG</a>).</li>
  <li><strong>Recommendations</strong> — "more like this" (item-to-item nearest neighbours).</li>
  <li><strong>De-duplication</strong> — near-duplicate tickets, listings, FAQ entries (cosine above a tuned threshold).</li>
  <li><strong>Clustering / topic discovery</strong> — k-means over embeddings of 50k call transcripts to find recurring complaint themes.</li>
  <li><strong>Classification</strong> — kNN against labelled examples, or embeddings as features for a classic model (<a href="#/topic/ai-predictive">Predictive Modeling</a>).</li>
  <li><strong>Semantic caching</strong> — reuse an LLM answer for a near-identical earlier question (carefully — see Examples).</li>
</ul>

<h3>Choosing an embedding model</h3>
<table>
  <thead><tr><th>Option</th><th>Examples (at time of writing)</th><th>Pros</th><th>Cons</th></tr></thead>
  <tbody>
    <tr><td>Hosted API</td><td>OpenAI <code>text-embedding-3-small</code> / <code>-large</code>, Cohere Embed, Voyage AI, Google</td><td>Zero ops, strong quality, batch APIs</td><td>Per-token cost, data leaves your VPC, vendor can deprecate models</td></tr>
    <tr><td>Open weights, self-hosted</td><td>BGE, E5, GTE, Nomic, all-MiniLM</td><td>Data stays in-house, no per-call cost, pin the version forever</td><td>You run GPUs/CPUs, scaling, monitoring</td></tr>
    <tr><td>Cloud-native</td><td>Models via AWS Bedrock / Vertex / Azure</td><td>Stays in your cloud account + IAM</td><td>Model menu varies by region — check current docs</td></tr>
  </tbody>
</table>
<p>Anthropic does not ship its own embedding model; its docs point to third-party providers such as Voyage AI (check current docs). Use the public MTEB leaderboard as a <em>shortlist</em>, then decide with an eval on <strong>your</strong> queries and documents — leaderboard rank rarely transfers 1:1 to a domain like legal contracts or call transcripts.</p>
<p>Selection criteria, in the order interviewers like to hear them: <strong>quality on your data</strong> → <strong>max input tokens</strong> → <strong>dimensions</strong> (storage + RAM) → <strong>multilingual</strong> needs → <strong>cost</strong> → <strong>data residency / compliance</strong> → <strong>latency</strong> → <strong>deprecation risk</strong> (a hosted model being retired forces a full re-embed).</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Meaning as geometry</h3>
<div class="diagram">
<pre>
              ▲                                 (imagine 1536 dims squashed to 2)
              │    ● "release a reserved room"
              │  ● "cancel my booking"          ← close: same intent
              │
              │                      ● "projector not working"
              │                    ● "HDMI no signal in room 4"
              │
              │  ● "refresh token expired"
              │ ● "app logs me out"
              └──────────────────────────────────────────────►
   query "how do I cancel a meeting?"  →  ★ lands near the booking cluster
</pre>
</div>

<h3>The two pipelines</h3>
<div class="diagram">
<pre>
 INDEX TIME (batch / on change)
 ──────────────────────────────
 source docs ─► clean + chunk ─► embed (model M, dims D) ─► store
                                                           { id, vector, text,
                                                             tenant_id, acl, doc_id,
                                                             embed_model = "M@D",
                                                             content_hash }
                                                           + ANN index (HNSW)
                                                           + keyword index (BM25/GIN)

 QUERY TIME (per request, ~50–300 ms budget)
 ───────────────────────────────────────────
 user query ─► embed with the SAME model M@D ─► ANN search  ─┐
            └───────────────► keyword search ───────────────┤─► fuse (RRF) ─► (rerank) ─► top k
                    filters: tenant_id, acl, date ──────────┘
</pre>
</div>

<h3>Distance metrics — three formulas, one ranking (if normalised)</h3>
<table>
  <thead><tr><th>Metric</th><th>Formula</th><th>Meaning</th><th>pgvector op</th></tr></thead>
  <tbody>
    <tr><td>Cosine similarity</td><td>a·b / (|a| |b|)</td><td>Angle only, ignores length. Range −1..1</td><td><code>&lt;=&gt;</code> returns cosine <em>distance</em> = 1 − cos</td></tr>
    <tr><td>Dot (inner) product</td><td>Σ aᵢ bᵢ</td><td>Angle × lengths. Bigger = more similar</td><td><code>&lt;#&gt;</code> returns the <em>negative</em> inner product (so ascending order works)</td></tr>
    <tr><td>Euclidean (L2)</td><td>√Σ (aᵢ − bᵢ)²</td><td>Straight-line distance</td><td><code>&lt;-&gt;</code></td></tr>
  </tbody>
</table>
<p>For unit-length vectors: <code>|a − b|² = 2 − 2·cos(a, b)</code> and <code>a·b = cos(a, b)</code>. All three give <strong>identical rankings</strong>, so pick the cheapest: <strong>dot product</strong> (no square root, no norm division). Most hosted text-embedding models return normalised vectors (OpenAI documents this for its embeddings) — but verify by checking that <code>|v| ≈ 1.0</code> on a sample.</p>
<p>When the vectors are <em>not</em> normalised, the choice matters: dot product rewards magnitude. Some recommender models encode popularity in the magnitude deliberately — there you <em>want</em> dot product. Rule: <strong>use the metric the model was trained with</strong> (the model card says).</p>

<h3>Exact vs approximate: the recall / latency knob</h3>
<div class="diagram">
<pre>
 recall@10
  1.00 ┤ ● exact (brute force)  ………………………………………………… but 300 ms at 10M vectors
  0.99 ┤          ●  HNSW ef_search=200
  0.97 ┤      ●  HNSW ef_search=80
  0.92 ┤   ●  HNSW ef_search=20
  0.80 ┤ ● IVF probes=1
       └──────────────────────────────────────────────► latency
          1 ms      5 ms      20 ms                    300 ms
</pre>
</div>
<p><strong>Recall@k</strong> = of the true k nearest neighbours (found by brute force), what fraction did the ANN index return? It is the single number you tune ANN parameters against. Note this is <em>index recall</em> ("did we find the mathematically nearest vectors?"), not <em>relevance</em> ("were they useful?") — two different evaluations.</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"A similarity of 0.82 means 82% relevant." No. Similarity scores are <strong>not calibrated</strong>: one model's "related" pairs sit around 0.3–0.5 while another's sit at 0.75–0.9, and the spread differs per query. Thresholds ("drop results below 0.7") must be tuned per model on labelled data — and re-tuned when you change models.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. Generating embeddings (server-side, batched, versioned)</h3>
<pre><code class="language-ts">// embeddings.ts — runs on your server. The API key never ships in the RN/web bundle.
import OpenAI from 'openai';

const openai = new OpenAI(); // reads OPENAI_API_KEY from the environment

export const EMBED_MODEL = 'text-embedding-3-small';
export const EMBED_DIMS = 1536;
export const MODEL_TAG = EMBED_MODEL + '@' + EMBED_DIMS; // stored next to every vector

const sleep = (ms: number) =&gt; new Promise((r) =&gt; setTimeout(r, ms));

async function withRetry&lt;T&gt;(fn: () =&gt; Promise&lt;T&gt;, attempts = 5): Promise&lt;T&gt; {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (err: any) {
      const retryable = err?.status === 429 || err?.status &gt;= 500;
      if (!retryable || i === attempts - 1) throw err;
      await sleep(Math.min(30_000, 500 * 2 ** i) + Math.random() * 250); // backoff + jitter
    }
  }
}

/** Embed up to ~100 texts per call (batching cuts per-request overhead and rate-limit pressure). */
export async function embedBatch(texts: string[]): Promise&lt;number[][]&gt; {
  const res = await withRetry(() =&gt;
    openai.embeddings.create({ model: EMBED_MODEL, input: texts, dimensions: EMBED_DIMS }),
  );
  // results carry an index; sort defensively so vector i matches text i
  return res.data.sort((a, b) =&gt; a.index - b.index).map((d) =&gt; d.embedding);
}

export const toPgVector = (v: number[]) =&gt; '[' + v.join(',') + ']';</code></pre>
<p>Notes an interviewer may probe:</p>
<ul>
  <li><strong>Asymmetric models.</strong> Some models (E5, Cohere, Voyage) want to know whether the input is a <em>query</em> or a <em>document</em> — via a prefix like <code>"query: "</code> or an <code>input_type</code> parameter. Getting this wrong quietly costs several points of recall. OpenAI's v3 models are used symmetrically.</li>
  <li><strong>The <code>dimensions</code> parameter</strong> (OpenAI v3 and other "Matryoshka" models) lets you request a shorter vector; the model was trained so the leading dims carry most of the signal. 512 dims instead of 1536 = 3× less storage for a small quality loss — measure it.</li>
  <li><strong>Batch APIs</strong> (offline, ~24h turnaround) are typically discounted for bulk re-embedding jobs — check current pricing.</li>
</ul>

<h3>2. What ANN approximates: brute force in 15 lines</h3>
<pre><code class="language-ts">function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i &lt; a.length; i++) s += a[i] * b[i];
  return s;
}

// Exact top-k for unit-length vectors (dot == cosine). O(N·d) per query.
function exactTopK(query: number[], items: { id: string; v: number[] }[], k = 10) {
  return items
    .map((it) =&gt; ({ id: it.id, score: dot(query, it.v) }))
    .sort((x, y) =&gt; y.score - x.score)
    .slice(0, k);
}
// 50k vectors × 1536 dims ≈ 77M multiply-adds ≈ tens of ms in V8 — fine for a prototype,
// an in-app offline index, or as the "ground truth" when you measure ANN recall.</code></pre>

<h3>3. ANN index families</h3>
<h4>HNSW — Hierarchical Navigable Small World (graph)</h4>
<div class="diagram">
<pre>
 Layer 2:  A ───────────────────────── K                 few nodes, long jumps
           │                           │
 Layer 1:  A ────── D ────────── H ─── K                 more nodes
           │        │            │     │
 Layer 0:  A─B─C─D─E─F─G─H─I─J─K─L─M─N                   EVERY vector, short links

 search(q): enter at the top layer → greedily hop to the neighbour closest to q →
            when no neighbour is closer, drop a layer → at layer 0 keep a candidate
            list of size ef_search, expand it, return the best k
</pre>
</div>
<ul>
  <li><strong>M</strong> — links per node (pgvector default 16). Higher = better recall, more memory, slower build.</li>
  <li><strong>ef_construction</strong> — candidate list size while building (default 64). Higher = better graph, slower build.</li>
  <li><strong>ef_search</strong> — candidate list size at query time (pgvector default 40). <em>The</em> runtime recall/latency knob; must be ≥ k.</li>
  <li>Strengths: best recall-at-speed for in-memory data, supports incremental inserts, no training step.</li>
  <li>Weaknesses: memory-hungry (vectors + links in RAM for good latency), slow builds at tens of millions, deletes leave tombstones that need vacuum/rebuild.</li>
</ul>

<h4>IVF — Inverted File index (clustering)</h4>
<div class="diagram">
<pre>
   k-means into "lists" (here 4 centroids):

      C1 ●  · ·  ·                 ● C2   · ·
        ·  ·                        ·  · ·
                       ★ q
      C3 ●  · ·                    ● C4  · · ·
         · ·                          ·

   probes = 2 → compare q with the 4 centroids, then scan ONLY the vectors in the
   2 nearest lists (C2, C4). Neighbours that sit in C3 are missed → recall &lt; 1.
</pre>
</div>
<ul>
  <li><strong>lists</strong> (nlist) — number of clusters; pgvector's README suggests about rows/1000 up to 1M rows and √rows above that.</li>
  <li><strong>probes</strong> (nprobe) — lists scanned per query (pgvector default 1 — usually too low); start around √lists.</li>
  <li>Strengths: fast build, smaller memory than HNSW, works well with compression (IVF-PQ).</li>
  <li>Weaknesses: needs representative data <em>before</em> building (centroids are trained); if the data distribution drifts (new tenant, new content type), recall decays until you rebuild.</li>
</ul>

<h4>PQ — Product Quantization (compression)</h4>
<div class="diagram">
<pre>
 1536-d float32 vector = 6,144 bytes
 [ d0..d15 | d16..d31 | ......... | d1520..d1535 ]     split into m = 96 sub-vectors
      │          │                       │
  codebook 1  codebook 2   .....    codebook 96           each: 256 centroids (k-means)
      │          │                       │
    [ 17 ]    [ 203 ]      .....       [ 88 ]             one byte per sub-vector
                                                           = 96 bytes  → 64× smaller
 distance(q, x) ≈ Σ lookup_table[j][code_j]   (precomputed per query → very fast)
</pre>
</div>
<ul>
  <li>Lossy: approximate distances → lower recall. Standard fix: <strong>over-fetch then re-score</strong> the top ~100 with full-precision vectors.</li>
  <li>Simpler cousins: <strong>scalar quantization</strong> (float32 → int8, 4×; or float16, 2×) and <strong>binary quantization</strong> (1 bit per dim, 32×, compare with Hamming distance, then re-score).</li>
  <li>Used when the corpus does not fit in RAM: hundreds of millions to billions of vectors (FAISS IVF-PQ, Milvus, managed engines). Disk-oriented graph indexes (DiskANN-style) attack the same problem by keeping the graph on SSD.</li>
</ul>

<table>
  <thead><tr><th></th><th>HNSW</th><th>IVF (flat)</th><th>IVF-PQ / quantized</th><th>Exact</th></tr></thead>
  <tbody>
    <tr><td>Recall at low latency</td><td>Best</td><td>Good (tune probes)</td><td>Lower; re-score fixes most</td><td>Perfect</td></tr>
    <tr><td>Memory</td><td>High</td><td>Medium</td><td>Very low</td><td>Vectors only</td></tr>
    <tr><td>Build</td><td>Slow, incremental OK</td><td>Fast, needs training data</td><td>Needs training</td><td>None</td></tr>
    <tr><td>Inserts / deletes</td><td>Inserts fine; deletes = tombstones</td><td>Fine until distribution drifts</td><td>Same as IVF</td><td>Trivial</td></tr>
    <tr><td>Reach for it when</td><td>Default for ≤ tens of millions in RAM</td><td>Memory-constrained, mostly static data</td><td>100M+ vectors, cost-driven</td><td>&lt; ~100k vectors, or a small filtered subset</td></tr>
  </tbody>
</table>

<h3>4. pgvector in practice</h3>
<pre><code class="language-sql">CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE chunks (
  id            text PRIMARY KEY,                 -- e.g. doc_id || ':' || chunk_no
  tenant_id     uuid        NOT NULL,
  doc_id        text        NOT NULL,
  content       text        NOT NULL,
  content_hash  text        NOT NULL,             -- skip re-embedding unchanged text
  embed_model   text        NOT NULL,             -- 'text-embedding-3-small@1536'
  embedding     vector(1536) NOT NULL,
  acl_groups    text[]      NOT NULL DEFAULT '{}',
  updated_at    timestamptz NOT NULL DEFAULT now(),
  tsv           tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED
);

-- ANN index: the opclass MUST match the operator you query with
CREATE INDEX chunks_embedding_hnsw ON chunks
  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE INDEX chunks_tsv_gin   ON chunks USING gin (tsv);          -- keyword side of hybrid
CREATE INDEX chunks_tenant_ix ON chunks (tenant_id);

-- Query: ORDER BY the distance operator ASC + LIMIT is what lets the planner use the index
SET hnsw.ef_search = 80;          -- per session / SET LOCAL inside a transaction
SELECT id, content, 1 - (embedding &lt;=&gt; $1::vector) AS similarity
FROM chunks
WHERE tenant_id = $2
ORDER BY embedding &lt;=&gt; $1::vector
LIMIT 10;</code></pre>
<p>Operational notes (pgvector, at time of writing — check the README for your version):</p>
<ul>
  <li>Index builds are much faster when the graph fits in <code>maintenance_work_mem</code>; raise it for the build session, and use parallel maintenance workers on big tables. Build <em>after</em> bulk loading.</li>
  <li><code>vector</code> columns can be indexed up to 2,000 dims; <code>halfvec</code> (float16) up to 4,000 — so a 3072-dim model needs <code>halfvec</code> or a reduced <code>dimensions</code> setting to be indexed.</li>
  <li>Quantization options: index an expression cast to <code>halfvec</code> (2× smaller), or <code>binary_quantize(embedding)</code> into a <code>bit</code> index with Hamming distance, then re-rank the top candidates with full vectors.</li>
  <li>Always <code>EXPLAIN ANALYZE</code> your real query. If you see <code>Seq Scan</code> instead of <code>Index Scan using chunks_embedding_hnsw</code>, the index isn't being used (wrong opclass, <code>ORDER BY similarity DESC</code> instead of the operator, or the planner preferring a filter index).</li>
  <li>Managed Postgres (RDS/Aurora PostgreSQL, Supabase, Neon, Cloud SQL) ships pgvector, but versions lag — check which version your provider offers (see <a href="#/topic/cloud-rds">RDS</a>).</li>
</ul>

<h3>5. Metadata filtering — the production gotcha</h3>
<div class="diagram">
<pre>
 SELECT … WHERE tenant_id = 'acme' ORDER BY embedding &lt;=&gt; q LIMIT 10;   (acme = 1% of rows)

 POST-FILTER (what a plain ANN index does):
   HNSW walks the global graph, finds ef_search = 40 nearest overall
   → ~1% are acme → 0 or 1 rows returned instead of 10.   Silent. No error.

 PRE-FILTER:
   restrict to acme rows first, then exact-scan them → perfect recall,
   fast if acme is small (≤ ~10–50k rows), slow if acme is huge.

 FILTER-AWARE TRAVERSAL:
   the index keeps walking/expanding until it has k rows that pass the filter
   (pgvector ≥ 0.8 iterative scans; Qdrant/Weaviate/Pinecone filter in-index).
</pre>
</div>
<table>
  <thead><tr><th>Technique</th><th>How</th><th>Use when</th></tr></thead>
  <tbody>
    <tr><td>Iterative index scan</td><td><code>SET hnsw.iterative_scan = relaxed_order;</code> (pgvector 0.8+) — keeps scanning until LIMIT is satisfied, bounded by a max-tuples setting</td><td>Moderately selective filters</td></tr>
    <tr><td>Partial index</td><td><code>CREATE INDEX … WHERE tenant_id = '…'</code></td><td>A handful of very large tenants or categories</td></tr>
    <tr><td>Partitioning</td><td>Partition the table by tenant / region; an HNSW index per partition</td><td>Many tenants, strong isolation needs</td></tr>
    <tr><td>Namespaces / collections</td><td>One namespace per tenant (Pinecone), collection per tenant (Qdrant etc.)</td><td>Managed engines; hard tenant isolation</td></tr>
    <tr><td>Over-fetch</td><td>Ask for 200, filter, keep 10</td><td>Quick fix; still fails for very selective filters</td></tr>
    <tr><td>Exact scan on the subset</td><td>B-tree on the filter, no ANN</td><td>Filter leaves ≤ tens of thousands of rows — exact is fast and perfect</td></tr>
  </tbody>
</table>
<div class="callout danger">
  <div class="callout-title">Security, not just relevance</div>
  <p>The tenant / ACL filter is an <strong>authorization control</strong>. Derive <code>tenant_id</code> and the user's groups from the verified token on the server — never from a query parameter — and apply it in the same query as the similarity search. "We filter in the app afterwards" eventually leaks another customer's documents into an LLM prompt. See <a href="#/topic/ai-rag">RAG</a> for permission-aware retrieval.</p>
</div>

<h3>6. Hybrid search: BM25 + vectors, fused with RRF</h3>
<p><strong>BM25</strong> scores a document for a query by summing, over query terms, <em>IDF</em> (rare terms count more) × a <em>saturating term frequency</em> (the 10th occurrence of a word adds less than the 2nd; parameter k1 ≈ 1.2–2.0) with <em>length normalisation</em> (long docs don't win just for being long; b ≈ 0.75). It is great at exact tokens and rare words — exactly where vectors are weak.</p>
<p>The two retrievers produce scores on incomparable scales (BM25 is unbounded, cosine is −1..1), so don't add raw scores. <strong>Reciprocal Rank Fusion</strong> uses ranks only:</p>
<pre><code class="language-text">RRF(d) = Σ over retrievers r of  1 / (k + rank_r(d))        k = 60 (from the original RRF paper)

doc X: vector rank 1, keyword rank 8   → 1/61 + 1/68 = 0.0311
doc Y: vector rank 3, keyword absent   → 1/63         = 0.0159
doc Z: keyword rank 1, vector absent   → 1/61         = 0.0164
→ X first: being near the top of BOTH lists beats being #1 in one.</code></pre>
<pre><code class="language-sql">-- Hybrid in one Postgres round trip: $1 = query vector, $2 = tenant, $3 = raw query text
WITH semantic AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY embedding &lt;=&gt; $1::vector) AS rnk
  FROM chunks
  WHERE tenant_id = $2
  ORDER BY embedding &lt;=&gt; $1::vector
  LIMIT 50
),
keyword AS (
  SELECT c.id, ROW_NUMBER() OVER (ORDER BY ts_rank_cd(c.tsv, q) DESC) AS rnk
  FROM chunks c, websearch_to_tsquery('english', $3) q
  WHERE c.tenant_id = $2 AND c.tsv @@ q
  ORDER BY ts_rank_cd(c.tsv, q) DESC
  LIMIT 50
)
SELECT COALESCE(s.id, k.id) AS id,
       COALESCE(1.0 / (60 + s.rnk), 0) + COALESCE(1.0 / (60 + k.rnk), 0) AS rrf_score
FROM semantic s
FULL OUTER JOIN keyword k ON k.id = s.id
ORDER BY rrf_score DESC
LIMIT 10;</code></pre>
<p>Caveat: Postgres <code>ts_rank_cd</code> is <em>not</em> true BM25 (no IDF across the corpus). It's good enough for many apps; for real BM25 use OpenSearch/Elasticsearch, a BM25 extension for Postgres (e.g. ParadeDB — check current docs), or a managed engine with built-in hybrid. Alternative to RRF: min-max normalise both score lists and take a weighted sum (α·vector + (1−α)·keyword) — more tunable, but fragile when score distributions shift between queries.</p>

<h3>7. Dimensions, storage and cost</h3>
<table>
  <thead><tr><th>Dims</th><th>float32</th><th>float16 (halfvec)</th><th>binary (1 bit)</th><th>10M vectors, float32</th></tr></thead>
  <tbody>
    <tr><td>384</td><td>1.5 KB</td><td>768 B</td><td>48 B</td><td>~15 GB</td></tr>
    <tr><td>768</td><td>3 KB</td><td>1.5 KB</td><td>96 B</td><td>~31 GB</td></tr>
    <tr><td>1536</td><td>6 KB</td><td>3 KB</td><td>192 B</td><td>~61 GB</td></tr>
    <tr><td>3072</td><td>12 KB</td><td>6 KB</td><td>384 B</td><td>~123 GB</td></tr>
  </tbody>
</table>
<ul>
  <li>For HNSW latency the index should sit in RAM. 10M × 1536 float32 ≈ 61 GB of vectors in the index alone → a large instance. halfvec halves it with negligible recall loss for most text models.</li>
  <li><strong>Embedding cost</strong> = total tokens × price. 2M chunks × 400 tokens = 800M tokens; at a few cents per million tokens that's tens of dollars. The expensive part of re-embedding is usually <strong>time</strong> (rate limits) and <strong>reindex</strong> work, not the API bill.</li>
  <li><strong>Query cost</strong> = one tiny embedding call per search (or zero with a query-embedding cache) + DB time.</li>
</ul>

<h3>8. Re-embedding when the model changes</h3>
<p>New model = new vector space. You can't compare old document vectors with new query vectors, and you can't "convert" them. The migration is a blue/green deploy for data:</p>
<ol>
  <li><strong>Version everything:</strong> every row carries <code>embed_model</code> (model + dims). Queries filter on it.</li>
  <li><strong>Add the new column / table / index</strong> (<code>embedding_v2</code>, or a parallel <code>chunks_v2</code> table / new namespace).</li>
  <li><strong>Dual-write:</strong> new and updated chunks get both embeddings from now on.</li>
  <li><strong>Backfill</strong> old rows with a throttled job (batch API if available), idempotent and resumable by id range.</li>
  <li><strong>Shadow-evaluate:</strong> run your golden queries against both; compare recall@k / nDCG; also re-tune similarity thresholds (scores shift!).</li>
  <li><strong>Cut over</strong> query traffic behind a feature flag; keep the old index for rollback for a while.</li>
  <li><strong>Clean up:</strong> drop the old column + index, stop dual-writing.</li>
</ol>
<p>Triggers to re-embed: a better model, a vendor deprecation notice, a dims change, or a <em>chunking</em> change (new chunks need new vectors anyway).</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — Idempotent ingestion with content hashing</h3>
<pre><code class="language-ts">import { createHash } from 'node:crypto';
import { Pool } from 'pg';
import { embedBatch, toPgVector, MODEL_TAG } from './embeddings';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sha256 = (s: string) =&gt; createHash('sha256').update(s).digest('hex');

type ChunkIn = { id: string; tenantId: string; docId: string; content: string; aclGroups: string[] };

export async function upsertChunks(chunks: ChunkIn[]) {
  const withHash = chunks.map((c) =&gt; ({ ...c, hash: sha256(c.content) }));

  // Skip anything already embedded with the same text AND the same model
  const { rows } = await pool.query(
    'SELECT id, content_hash FROM chunks WHERE id = ANY($1) AND embed_model = $2',
    [withHash.map((c) =&gt; c.id), MODEL_TAG],
  );
  const seen = new Map(rows.map((r) =&gt; [r.id, r.content_hash]));
  const todo = withHash.filter((c) =&gt; seen.get(c.id) !== c.hash);

  for (let i = 0; i &lt; todo.length; i += 96) {
    const batch = todo.slice(i, i + 96);
    const vectors = await embedBatch(batch.map((c) =&gt; c.content));
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let j = 0; j &lt; batch.length; j++) {
        const c = batch[j];
        await client.query(
          'INSERT INTO chunks (id, tenant_id, doc_id, content, content_hash, embed_model, embedding, acl_groups) ' +
          'VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8) ' +
          'ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, content_hash = EXCLUDED.content_hash, ' +
          'embed_model = EXCLUDED.embed_model, embedding = EXCLUDED.embedding, ' +
          'acl_groups = EXCLUDED.acl_groups, updated_at = now()',
          [c.id, c.tenantId, c.docId, c.content, c.hash, MODEL_TAG, toPgVector(vectors[j]), c.aclGroups],
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
  return { embedded: todo.length, skipped: chunks.length - todo.length };
}</code></pre>
<p>Why it matters: a nightly re-sync of 200k unchanged chunks costs zero embedding calls. Deletions are a separate path: when a source doc disappears, delete its chunks by <code>doc_id</code> — otherwise search keeps returning ghosts.</p>

<h3>Example 2 — A tenant-safe semantic search endpoint</h3>
<pre><code class="language-ts">import express from 'express';
import { LRUCache } from 'lru-cache';
import { embedBatch, toPgVector, MODEL_TAG } from './embeddings';

const app = express();
const queryVecCache = new LRUCache&lt;string, number[]&gt;({ max: 10_000, ttl: 60 * 60 * 1000 });

app.get('/search', requireAuth, async (req, res, next) =&gt; {
  try {
    const q = String(req.query.q ?? '').trim().slice(0, 500);
    if (q.length &lt; 3) return res.json({ results: [] });

    const tenantId = req.user.tenantId;          // from the verified JWT, never from the client
    const key = q.toLowerCase();
    let qv = queryVecCache.get(key);
    if (!qv) { [qv] = await embedBatch([q]); queryVecCache.set(key, qv); }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET LOCAL hnsw.ef_search = 80');
      const { rows } = await client.query(
        'SELECT id, doc_id, left(content, 300) AS snippet, 1 - (embedding &lt;=&gt; $1::vector) AS similarity ' +
        'FROM chunks WHERE tenant_id = $2 AND embed_model = $3 ' +
        'ORDER BY embedding &lt;=&gt; $1::vector LIMIT 10',
        [toPgVector(qv), tenantId, MODEL_TAG],
      );
      await client.query('COMMIT');
      res.json({ results: rows });
    } finally {
      client.release();
    }
  } catch (err) { next(err); }
});</code></pre>
<p>On the RN client: debounce search-as-you-type (~300 ms) and only search once the query has 3+ characters — every keystroke would otherwise be an embedding call plus a DB query.</p>

<h3>Example 3 — RRF in application code (fusing any number of retrievers)</h3>
<pre><code class="language-ts">type Ranked = { id: string }[];

export function reciprocalRankFusion(lists: Ranked[], k = 60, topN = 10) {
  const scores = new Map&lt;string, number&gt;();
  for (const list of lists) {
    list.forEach((item, idx) =&gt; {
      const rank = idx + 1;
      scores.set(item.id, (scores.get(item.id) ?? 0) + 1 / (k + rank));
    });
  }
  return [...scores.entries()]
    .sort((a, b) =&gt; b[1] - a[1])
    .slice(0, topN)
    .map(([id, score]) =&gt; ({ id, score }));
}

// usage: const fused = reciprocalRankFusion([vectorHits, bm25Hits, titleHits]);</code></pre>
<p>Useful when retrievers live in different systems (vectors in Pinecone, keywords in OpenSearch) or when you add a third signal such as a title-only index or multiple query rewrites.</p>

<h3>Example 4 — Measure recall@k before tuning anything</h3>
<pre><code class="language-ts">// Compare HNSW results with exact results for a sample of real queries.
async function recallAtK(queryVecs: number[][], tenantId: string, k = 10, efSearch = 40) {
  let hits = 0;
  for (const qv of queryVecs) {
    const v = toPgVector(qv);
    const sql = 'SELECT id FROM chunks WHERE tenant_id = $2 ORDER BY embedding &lt;=&gt; $1::vector LIMIT ' + k;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET LOCAL hnsw.ef_search = ' + Number(efSearch));
      const ann = await client.query(sql, [v, tenantId]);
      await client.query('SET LOCAL enable_indexscan = off');   // forces exact (sequential) scan
      const exact = await client.query(sql, [v, tenantId]);
      await client.query('COMMIT');

      const truth = new Set(exact.rows.map((r) =&gt; r.id));
      hits += ann.rows.filter((r) =&gt; truth.has(r.id)).length;
    } finally {
      client.release();
    }
  }
  return hits / (queryVecs.length * k);
}
// Sweep efSearch over [20, 40, 80, 160] and plot recall vs p95 latency; pick the knee.</code></pre>

<h3>Example 5 — Pinecone with a namespace per tenant</h3>
<pre><code class="language-ts">import { Pinecone } from '@pinecone-database/pinecone';
// SDK method shapes change between major versions — check current docs before copying.

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const index = pc.index('kb-chunks');

export async function upsertForTenant(tenantId: string, items: { id: string; values: number[]; docType: string }[]) {
  await index.namespace(tenantId).upsert(
    items.map((i) =&gt; ({ id: i.id, values: i.values, metadata: { docType: i.docType, model: MODEL_TAG } })),
  );
}

export async function searchTenant(tenantId: string, vector: number[]) {
  const res = await index.namespace(tenantId).query({
    vector,
    topK: 10,
    filter: { docType: { $in: ['policy', 'faq'] }, model: { $eq: MODEL_TAG } },
    includeMetadata: true,
  });
  return res.matches;
}</code></pre>
<p>Namespaces give hard per-tenant partitioning (a query can't accidentally cross tenants) and make "delete everything for tenant X" a single operation — useful for offboarding and GDPR erasure.</p>

<h3>Example 6 — Near-duplicate detection (dedupe support tickets)</h3>
<pre><code class="language-sql">-- For a new ticket's vector $1, find likely duplicates opened in the last 7 days
SELECT id, title, 1 - (embedding &lt;=&gt; $1::vector) AS sim
FROM tickets
WHERE tenant_id = $2 AND created_at &gt; now() - interval '7 days'
ORDER BY embedding &lt;=&gt; $1::vector
LIMIT 5;
-- Show "possible duplicate" only when sim &gt;= a threshold tuned on ~200 labelled pairs
-- (e.g. pick the threshold that gives 95% precision on that set). Never copy a threshold from a blog.</code></pre>

<h3>Example 7 — Diversity with MMR (Maximal Marginal Relevance)</h3>
<pre><code class="language-ts">// Pick k results that are relevant to q but not redundant with each other.
// score(d) = λ·sim(q, d) − (1 − λ)·max over already-selected s of sim(d, s)
function mmr(q: number[], cands: { id: string; v: number[] }[], k = 5, lambda = 0.7) {
  const selected: typeof cands = [];
  const remaining = [...cands];
  while (selected.length &lt; k &amp;&amp; remaining.length) {
    let best = 0, bestScore = -Infinity;
    remaining.forEach((c, i) =&gt; {
      const redundancy = selected.length ? Math.max(...selected.map((s) =&gt; dot(c.v, s.v))) : 0;
      const score = lambda * dot(q, c.v) - (1 - lambda) * redundancy;
      if (score &gt; bestScore) { bestScore = score; best = i; }
    });
    selected.push(remaining.splice(best, 1)[0]);
  }
  return selected;
}</code></pre>
<p>When the corpus has five copies of the same FAQ, plain top-5 returns five copies. MMR trades a little relevance for coverage.</p>

<h3>Example 8 — Semantic cache for LLM answers (with guard rails)</h3>
<pre><code class="language-ts">// Reuse an earlier answer when a new question is a near-paraphrase.
async function cachedAnswer(tenantId: string, userGroups: string[], question: string) {
  const [qv] = await embedBatch([question]);
  const { rows } = await pool.query(
    "SELECT answer, 1 - (q_embedding &lt;=&gt; $1::vector) AS sim FROM answer_cache " +
    "WHERE tenant_id = $2 AND acl_key = $3 AND created_at &gt; now() - interval '1 day' " +
    "ORDER BY q_embedding &lt;=&gt; $1::vector LIMIT 1",
    [toPgVector(qv), tenantId, userGroups.slice().sort().join('|')],
  );
  if (rows[0] &amp;&amp; rows[0].sim &gt;= 0.95) return rows[0].answer;   // threshold tuned per model
  return null;
}</code></pre>
<p>Guard rails: scope the cache by tenant <em>and</em> permission set, keep a short TTL, and keep the threshold high — "cancel my booking" and "don't cancel my booking" can be 0.9 similar. Good for high-volume FAQ bots; dangerous for anything personalised.</p>

<h3>Example 9 — Worked scenario: natural-language room finder</h3>
<p>A meeting-room booking app wants "quiet room for 6 with a whiteboard near the cafeteria". Don't embed the whole request and hope:</p>
<ul>
  <li><strong>Structured constraints → filters:</strong> an LLM (with structured output — see <a href="#/topic/ai-llm-integration">LLM Integrations</a>) extracts <code>{ capacityMin: 6, equipment: ['whiteboard'] }</code> → SQL <code>WHERE</code>.</li>
  <li><strong>Fuzzy preferences → vector:</strong> "quiet, near the cafeteria" is matched against embedded room descriptions.</li>
  <li><strong>Availability → the booking system</strong>, never the vector store (it changes every minute).</li>
</ul>
<p>This "filter on facts, rank on meaning" split is the pattern behind most good semantic search features.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. Query / document asymmetry</h3>
<p>Short questions and long passages look different. Asymmetric models need the right prefix or <code>input_type</code> on <em>both</em> sides; forgetting it on queries silently degrades recall.</p>

<h3>2. Input longer than the model's limit</h3>
<p>Over the max tokens, some APIs error and some truncate silently — the tail of your document is simply not represented. Chunk to well under the limit; log token counts at ingestion.</p>

<h3>3. Very short or empty queries</h3>
<p>"hi", "?", "help" produce vectors that sit near generic content. Set a minimum length, route greetings elsewhere, or fall back to popular/featured results.</p>

<h3>4. Exact identifiers and codes</h3>
<p>Order numbers, SKUs, error codes, people's names: vectors find "similar-looking" codes, not the exact one. Hybrid search, or detect the pattern with a regex and do an exact lookup first.</p>

<h3>5. Negation and numbers</h3>
<p>"without a projector", "more than 10 people", "after March" — push these into structured filters; embeddings handle them badly.</p>

<h3>6. Highly selective filters</h3>
<p>A small tenant (0.1% of rows) on a shared HNSW index gets 0–2 results back with post-filtering. Iterative scans, partitions/namespaces, or exact scan of the subset.</p>

<h3>7. Deletes and updates in HNSW</h3>
<p>Deleted rows remain as tombstones in the graph until vacuum; heavy update churn degrades graph quality and bloats the index. Monitor index size vs row count; schedule <code>REINDEX CONCURRENTLY</code> for churn-heavy tables.</p>

<h3>8. IVF trained on yesterday's data</h3>
<p>Centroids learned when you had one tenant's documents don't fit after onboarding ten new ones; vectors pile into a few lists, recall falls. Rebuild IVF after major distribution changes.</p>

<h3>9. Mixed models in one index</h3>
<p>During a migration, rows embedded with model A and model B share a column. Without a <code>embed_model</code> filter, queries compare across spaces and return garbage that <em>looks</em> plausible.</p>

<h3>10. Non-normalised vectors with cosine vs inner-product opclass</h3>
<p>If you use the inner-product opclass for speed, the vectors must be unit length; otherwise long vectors win regardless of meaning. Normalise at write time or use cosine.</p>

<h3>11. Index dimension limits</h3>
<p>pgvector indexes cap the indexable dimension (2,000 for <code>vector</code>, 4,000 for <code>halfvec</code> at time of writing). A 3072-dim model won't index as plain <code>vector</code>. Use halfvec or the model's <code>dimensions</code> parameter.</p>

<h3>12. Duplicate-heavy corpora</h3>
<p>The same paragraph in 30 docs fills all top-k slots. Dedupe at ingestion by hash/near-dup, or use MMR at query time.</p>

<h3>13. Hubness</h3>
<p>In high dimensions some vectors are "near everything" and show up in many unrelated result lists (often boilerplate: legal footers, nav text). Strip boilerplate before embedding; inspect which ids appear most often across queries.</p>

<h3>14. Multilingual content</h3>
<p>An English-only model will cluster Hindi or Spanish text by script rather than meaning. Use a multilingual model, or translate queries — and evaluate per language.</p>

<h3>15. Thresholds drift between models</h3>
<p>A "0.8 = relevant" cut-off tuned on model A returns nothing (or everything) on model B. Thresholds are part of the migration checklist.</p>

<h3>16. Cold or serverless indexes</h3>
<p>Some serverless vector stores have higher first-query latency after idle periods or for rarely-hit namespaces. Measure p95/p99, not averages, and check current docs for the provider's behaviour.</p>

<h3>17. Index build on a live table</h3>
<p>A plain <code>CREATE INDEX</code> blocks writes; on large tables use <code>CREATE INDEX CONCURRENTLY</code> and expect builds of minutes to hours at tens of millions of rows. Plan it like a migration.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — no model version on the vector</h3>
<p>Six months later nobody knows which model produced which rows; a "small" model upgrade mixes spaces. Always store <code>embed_model</code> (+ dims) and filter on it.</p>

<h3>Anti-pattern 2 — the opclass doesn't match the query operator</h3>
<pre><code class="language-sql">CREATE INDEX ON chunks USING hnsw (embedding vector_l2_ops);
SELECT … ORDER BY embedding &lt;=&gt; $1 LIMIT 10;   -- cosine operator → index unused → Seq Scan</code></pre>
<p>Works in dev with 2k rows, times out in prod with 5M. <code>EXPLAIN</code> every vector query.</p>

<h3>Anti-pattern 3 — ordering by similarity instead of distance</h3>
<pre><code class="language-sql">ORDER BY 1 - (embedding &lt;=&gt; $1) DESC   -- an expression the index can't serve
ORDER BY embedding &lt;=&gt; $1              -- correct: the operator itself, ascending</code></pre>

<h3>Anti-pattern 4 — tenant filtering after the search</h3>
<p>Fetch top 10 globally, drop other tenants' rows in JS. Results are wrong (too few) <em>and</em> one bug away from a data leak. Filter in the query, with values from the auth context.</p>

<h3>Anti-pattern 5 — embedding API key in the mobile app</h3>
<p>Calling the embedding API directly from the RN client exposes the key in the bundle. Embed on the server; the client sends text.</p>

<h3>Anti-pattern 6 — embedding on every keystroke</h3>
<p>Search-as-you-type without debounce = an API call per character. Debounce, minimum length, cache query vectors.</p>

<h3>Anti-pattern 7 — a dedicated vector DB for 50k vectors</h3>
<p>A new service, a new bill, a sync pipeline and a consistency problem — for a dataset brute force handles in milliseconds. Start with pgvector (or even in-memory) and graduate when numbers demand it.</p>

<h3>Anti-pattern 8 — the vector store as source of truth</h3>
<p>Vector stores are derived indexes. Keep the canonical text and metadata in your primary DB (or object storage) so you can rebuild with a new model or chunker.</p>

<h3>Anti-pattern 9 — tuning by vibes</h3>
<p>Changing chunk size, model, or <code>ef_search</code> by eyeballing three queries. Build a small labelled set (50–200 real queries + relevant ids) and track recall@k / nDCG on every change.</p>

<h3>Anti-pattern 10 — copying similarity thresholds</h3>
<p>"Use 0.78" from a blog post about a different model. Thresholds are model- and domain-specific; tune them on labelled pairs.</p>

<h3>Anti-pattern 11 — embedding whole documents</h3>
<p>One vector per 30-page PDF averages everything into mush. Chunk by structure (see <a href="#/topic/ai-rag">RAG</a>).</p>

<h3>Anti-pattern 12 — re-embedding everything on every sync</h3>
<p>Without content hashing, a nightly job re-embeds the full corpus: wasted money, rate-limit storms, and index churn. Hash and skip unchanged chunks.</p>

<h3>Anti-pattern 13 — vector-only search for a product catalogue</h3>
<p>Users type exact model numbers; vectors return "similar" products. Hybrid with keyword, plus exact-match boosts.</p>

<h3>Anti-pattern 14 — forgetting deletes</h3>
<p>Source doc removed, chunks remain → the bot keeps citing a deleted policy. Propagate deletes by <code>doc_id</code>; periodically reconcile index vs source.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. What is an embedding, and why does vector search work?</div>
  <div class="qa-answer">
    <p>An embedding is a fixed-length vector produced by a model trained contrastively so that semantically related inputs land close together and unrelated ones far apart. Because meaning is encoded as position, "find relevant documents" becomes "find nearest vectors". It handles synonyms and paraphrase that keyword search misses, but it's weak on exact identifiers, negation and numbers — which is why I pair it with keyword search and structured filters.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Cosine, dot product or Euclidean — which do you use?</div>
  <div class="qa-answer">
    <p>The one the model was trained with. For unit-normalised vectors they're equivalent in ranking: dot equals cosine, and squared L2 equals 2 − 2·cosine. So with normalised vectors I use dot product (cheapest). If vectors aren't normalised, dot product also rewards magnitude, which some recommender models use intentionally to encode popularity — then cosine and dot give different answers and you follow the model card.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Explain HNSW and its parameters.</div>
  <div class="qa-answer">
    <p>A multi-layer proximity graph. Every vector is in layer 0; a random, exponentially shrinking subset is promoted to higher layers. Search enters at the top, greedily hops toward the query, descends when stuck, and at the bottom layer keeps a candidate list of size <code>ef_search</code>. <code>M</code> controls links per node (recall vs memory), <code>ef_construction</code> controls build quality vs build time, and <code>ef_search</code> is the runtime recall/latency knob. Strengths: excellent recall at low latency, incremental inserts. Costs: memory (it wants to be in RAM), slow builds at large scale, and deletes leave tombstones.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. HNSW vs IVF vs PQ — when would you pick each?</div>
  <div class="qa-answer">
    <p>HNSW is my default when the index fits in memory — best recall per millisecond, no training. IVF clusters vectors with k-means and scans only the nearest <code>probes</code> clusters; it builds faster and uses less memory, but needs representative data up front and degrades as the distribution drifts. PQ (and scalar/binary quantization) compresses vectors 4–64× so hundreds of millions fit in RAM; it loses precision, so I over-fetch and re-score the top candidates with full vectors. Rough rule: under ~100k exact search; up to tens of millions HNSW; beyond that, or when cost dominates, IVF-PQ or a disk-based graph index in a dedicated engine.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. pgvector or a dedicated vector database?</div>
  <div class="qa-answer">
    <p>If we already run Postgres, pgvector first: vectors live next to the relational data, joins and filters are SQL, transactions keep text and vector consistent, there's no sync pipeline, and backups/IAM are already solved. It's comfortable into the millions to low tens of millions with HNSW if the index fits in RAM. I'd move to a dedicated engine (Pinecone, OpenSearch, Qdrant, Weaviate, Milvus) for hundreds of millions of vectors, very high write or QPS rates that would contend with OLTP traffic, heavy filtered search needing in-index filtering, built-in hybrid/BM25, or a team that wants zero index ops. The cost of moving: a second datastore to keep in sync, plus eventual consistency between them.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Why hybrid search, and how does Reciprocal Rank Fusion work?</div>
  <div class="qa-answer">
    <p>Vectors catch paraphrase; BM25 catches exact rare tokens like product codes and names. Each fails where the other succeeds, so we run both and fuse. Their scores aren't comparable, so RRF ignores scores and uses ranks: each document gets Σ 1/(k + rank) over the lists it appears in, with k ≈ 60. A document ranked well in both lists beats one ranked first in only one. It needs no score calibration, which is why it's the common default; a weighted sum of normalised scores is an alternative if you want a tunable α.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How do you handle multi-tenant data in a vector index?</div>
  <div class="qa-answer">
    <p>Treat the tenant filter as authorization: derive it from the verified token server-side and apply it inside the similarity query. Then fix the recall problem: a plain ANN index post-filters, so a small tenant gets fewer than k results. Options: filter-aware traversal (pgvector iterative scans, in-index filtering in Qdrant/Pinecone), per-tenant partitions or namespaces (also gives clean offboarding and erasure), partial indexes for the few giant tenants, or exact scan when the tenant's subset is small. I'd add a test that asserts a query for tenant A can never return tenant B's ids.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How do you measure whether vector search is "good"?</div>
  <div class="qa-answer">
    <p>Two separate questions. <strong>Index recall</strong>: does the ANN index return the true nearest neighbours? Measure recall@k against brute force on a sample of real queries, and tune <code>ef_search</code>/probes against p95 latency. <strong>Retrieval relevance</strong>: are the nearest neighbours actually useful? Build a labelled set of real queries with the relevant document ids, and track hit rate / recall@k, MRR and nDCG. Changes to the model, chunking or hybrid weights are judged on that set, not on a demo query.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. We need to switch embedding models. Plan the migration.</div>
  <div class="qa-answer">
    <p>Vectors from different models are incomparable, so it's a full re-embed run as a blue/green migration: version every row with the model tag; add a parallel column/index or namespace; dual-write new content; backfill old content with a throttled, resumable job (batch API if available); evaluate both on the golden query set and re-tune thresholds; switch query traffic behind a flag; keep the old index for rollback; then drop it. I'd estimate cost as total tokens × price — usually small — and time as tokens divided by the rate limit, which is often the real constraint.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Estimate storage for 50M chunks with a 1536-dim model. What would you do about it?</div>
  <div class="qa-answer">
    <p>50M × 6 KB ≈ 300 GB of float32 vectors, and an HNSW index wants roughly that again in memory — too much for one comfortable Postgres box. Levers: request fewer dimensions (512 dims → ~100 GB), store halfvec (2×), binary or product quantization with re-scoring (10–30×+), partition by tenant so each index is smaller and only hot partitions stay in memory, or move to a dedicated engine with disk-based or quantized indexes. I'd prototype on a 1M sample to measure the recall impact of each lever before committing.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. (FDE) A customer says: "Search can't find invoice INV-2024-0042 but it's definitely indexed." What do you do?</div>
  <div class="qa-answer">
    <p>First confirm it's indexed: query the store by doc id and check it's under the right tenant, ACL and model tag. If it is, this is the classic identifier failure — embeddings don't preserve exact tokens, so the query vector lands near lots of other invoice-ish chunks. Fixes in order: add keyword/BM25 to make it hybrid; add a fast path that detects ID patterns with a regex and does an exact lookup; make sure the ID text survives chunking (it may sit in a header that got stripped). Then add this query to the regression set so it stays fixed.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. (FDE) Search latency jumped from 40 ms to 900 ms after onboarding a large customer. Where do you look?</div>
  <div class="qa-answer">
    <p><code>EXPLAIN ANALYZE</code> the real query first. Likely causes: the index no longer fits in memory (buffer cache misses → disk), the planner switched to a sequential scan because of a new filter combination, an iterative scan running to its tuple limit for a selective filter, or HNSW bloat from a large bulk load with updates. Fixes: more RAM or halfvec, a partition / partial index for the big tenant, tuning <code>ef_search</code> and iterative-scan limits, rebuilding the index after the bulk load, and running bulk ingestion off-peak so it doesn't compete with query traffic. Also check whether embedding-API latency rose rather than the DB.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. When is semantic caching of LLM answers safe?</div>
  <div class="qa-answer">
    <p>When answers are not personalised, the source data changes slowly, and a wrong cache hit is cheap — FAQ-style bots. Scope the cache by tenant and permission set, use a high, tuned similarity threshold (negations can still score 0.9), keep a short TTL, and invalidate on source changes. For anything account-specific or action-taking, I'd cache retrieval results or embeddings, not final answers.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You separate index recall (ANN vs exact) from retrieval relevance (labelled queries).</li>
    <li>You know metric equivalence for normalised vectors and default to the model's metric.</li>
    <li>You can explain HNSW's knobs and when IVF/PQ wins.</li>
    <li>You raise hybrid search and RRF without being asked.</li>
    <li>You treat tenant/ACL filters as authorization and know the post-filter recall trap.</li>
    <li>You version vectors with the model and have a re-embedding plan.</li>
    <li>You start with pgvector and can say exactly what would make you move off it.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Write a pgvector table, HNSW index and top-k query. Why might the index not be used?</div>
  <div class="qa-answer">
    <p>Store the text, <code>tenant_id</code>, <code>embed_model</code>, a <code>content_hash</code> and a <code>vector(1536)</code> column; build the ANN index with an opclass that matches the operator you will query with; then <code>ORDER BY</code> the distance operator ascending with a <code>LIMIT</code>, filtering by tenant inside the same query.</p>
    <pre><code class="language-sql">CREATE INDEX chunks_embedding_hnsw ON chunks
  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

SET hnsw.ef_search = 80;
SELECT id, content
FROM chunks
WHERE tenant_id = $2
ORDER BY embedding &lt;=&gt; $1::vector
LIMIT 10;</code></pre>
    <p>Run <code>EXPLAIN ANALYZE</code>: a <code>Seq Scan</code> instead of <code>Index Scan using chunks_embedding_hnsw</code> means the index is skipped. The usual causes are an opclass that doesn't match the operator (for example <code>vector_l2_ops</code> queried with the cosine operator <code>&lt;=&gt;</code>), ordering by a similarity expression like <code>1 - distance DESC</code> instead of the operator itself, or the planner preferring a filter index. It works in dev with 2k rows and times out in prod with millions, so explain every vector query. Also note <code>vector</code> indexes cap at 2,000 dims (use <code>halfvec</code> above that), and on a live table build with <code>CREATE INDEX CONCURRENTLY</code>.</p>
  </div>
</div>
` },

  ]
});
