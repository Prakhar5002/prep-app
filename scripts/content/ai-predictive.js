window.PREP_SITE.registerTopic({
  id: "ai-predictive",
  module: "ai",
  title: "Predictive Modeling",
  estimatedReadTime: "50 min",
  tags: ["ai","ml","predictive-modeling","scikit-learn","pandas","gradient-boosting","lightgbm","metrics","leakage","mlops","drift"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Predictive modeling = learn <strong>features → label</strong> from history using only what's <strong>known at prediction time</strong>; split by time, beat a baseline with gradient boosting, pick the metric and threshold from the <strong>cost of errors</strong>, then serve, monitor drift and retrain.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Frame first:</strong> unit of prediction, prediction time, precise label window, the action taken, and the cost of false positives vs false negatives.</li>
    <li><strong>Supervised</strong> (classification, regression, forecasting, ranking) needs labels; <strong>unsupervised</strong> (clustering, anomaly detection) doesn't but is harder to evaluate.</li>
    <li><strong>Most failures are data failures</strong> (leakage, random splits on time data, fuzzy label definitions, training/serving skew), not algorithm failures. <strong>Leakage</strong> = information unavailable at prediction time: post-outcome features, future-inclusive aggregates, preprocessing fit on all data, random splits on time data, the same entity in train and test.</li>
    <li><strong>Splits:</strong> train fits, validation tunes (hyperparameters, early stopping, threshold), test is touched once; <strong>time-based</strong> for nearly all product problems; group splits for unseen entities.</li>
    <li><strong>Metrics:</strong> precision (FP costly), recall (FN costly), F1, ROC-AUC (ranking), <strong>PR-AUC for rare positives</strong>, log loss/Brier for probability quality; MAE vs RMSE vs MAPE for regression. Accuracy lies on imbalanced data (meaningless on a 3%-positive problem); calibration matters when probabilities drive decisions.</li>
    <li><strong>Threshold</strong> = argmin of FP × cost_fp + FN × cost_fn — the same model gets different thresholds for different actions.</li>
    <li><strong>Overfitting:</strong> train ≫ validation. Fix with early stopping, fewer leaves, bigger leaves, subsampling, L1/L2, more data.</li>
    <li><strong>Gradient boosting</strong> = shallow trees added sequentially to fix residual errors; the tabular default (LightGBM, XGBoost, CatBoost, HistGradientBoosting; no scaling, interactions, NaN-native) — not deep learning, not an LLM. Random forest = bagged deep trees averaged.</li>
    <li><strong>Imbalance:</strong> right metric → class weights → threshold tuning → recalibrate.</li>
    <li><strong>Explain:</strong> permutation importance globally, SHAP per prediction — and a dominant feature is a leakage suspect.</li>
    <li><strong>Serve:</strong> batch first; online with timeout + rules fallback; one versioned pipeline artifact; shared feature definitions to avoid training/serving skew; shadow → canary → full.</li>
    <li><strong>Monitor:</strong> data checks, PSI per feature and on scores (&gt; ~0.25 = significant), performance once delayed labels arrive; retrain on schedule and on alerts; champion vs challenger.</li>
    <li><strong>Classic ML vs LLM:</strong> tabular at volume → GBM (cheap, fast, calibrated, explainable); unstructured or few labels → LLM; hybrid = LLM extracts features, GBM predicts.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Leakage dressed up as a great model:</strong> a random split or a feature computed after the outcome (or over future rows) gives ROC-AUC 0.97 offline and a flop in production. Fix: point-in-time features, time-based splits, transforms inside a <code>Pipeline</code> fitted on train only — and treat "too good" metrics or one dominant feature as a bug until proven otherwise.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Before choosing an algorithm I pin down the label, the prediction time and the action — every feature has to be something I'd actually know at that moment."</div>
  <div class="revision-say">"For tabular data I start with a baseline, then gradient boosting with early stopping on a time-based validation set, and I set the threshold from the cost of false positives versus false negatives."</div>
  <div class="revision-say">"Shipping includes monitoring: PSI on inputs and scores, performance once labels arrive, and retraining — and if the input is unstructured text, an LLM can extract features that a cheap GBM then predicts on."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>Vocabulary in one table</h3>
<table>
  <thead><tr><th>Term</th><th>Meaning</th><th>Example (meeting-room no-shows)</th></tr></thead>
  <tbody>
    <tr><td>Example / row</td><td>One unit you predict for</td><td>One booking</td></tr>
    <tr><td>Label / target</td><td>The outcome to predict</td><td><code>no_show</code> = nobody checked in within 10 min of start</td></tr>
    <tr><td>Feature</td><td>An input known at prediction time</td><td>Lead time, organiser's past no-show rate, recurring?, hour of day</td></tr>
    <tr><td>Prediction time</td><td>When the model runs</td><td>2 hours before the booking starts</td></tr>
    <tr><td>Parameters</td><td>Learned from data</td><td>The trees' split points and leaf values</td></tr>
    <tr><td>Hyperparameters</td><td>Chosen by you</td><td>Learning rate, number of leaves, number of trees</td></tr>
    <tr><td>Training / inference</td><td>Fitting the model / using it</td><td>Nightly retrain / scoring tomorrow's bookings</td></tr>
  </tbody>
</table>

<h3>Task types</h3>
<table>
  <thead><tr><th>Type</th><th>Output</th><th>Product examples</th></tr></thead>
  <tbody>
    <tr><td>Binary classification</td><td>P(yes)</td><td>No-show, churn, fraud, lead converts, ticket escalates</td></tr>
    <tr><td>Multiclass</td><td>One of N classes</td><td>Route a ticket to a team; intent of a call</td></tr>
    <tr><td>Regression</td><td>A number</td><td>Call duration, delivery ETA, deal size</td></tr>
    <tr><td>Forecasting</td><td>Numbers over future time</td><td>Room demand per floor per hour next week</td></tr>
    <tr><td>Ranking</td><td>An ordering</td><td>Which rooms / leads / articles to show first</td></tr>
    <tr><td>Clustering (unsupervised)</td><td>Groups</td><td>User segments; themes in call transcripts (with embeddings)</td></tr>
    <tr><td>Anomaly detection (often unsupervised)</td><td>"Unusual" score</td><td>Sudden spike in failed check-ins on one tablet</td></tr>
  </tbody>
</table>
<p>Supervised needs labelled history; unsupervised doesn't, but its output is harder to evaluate. In between, <strong>weak supervision</strong> (labels from rules or an LLM) is increasingly common — see "classic ML vs LLM" below.</p>

<h3>Why a full-stack / FDE engineer needs this</h3>
<ul>
  <li>Customers ask "can AI predict X?" weekly. You must scope it: is there a label, enough history, an action to take on the prediction?</li>
  <li>Data scientists often hand over a notebook; <em>you</em> build feature pipelines, serving, monitoring and the product surface.</li>
  <li>LLM hype makes "use GPT for it" the default suggestion; knowing when a 2 MB gradient-boosted model beats it is a senior signal.</li>
</ul>

<h3>When not to use ML at all</h3>
<ul>
  <li><strong>A rule works.</strong> "Release rooms with no check-in after 10 minutes" needs no model. Ship the rule, log outcomes, and you've started collecting labels.</li>
  <li><strong>No labels, no history.</strong> A rough rule of thumb: you want at least a few hundred examples of the rarer class before a classifier is worth it.</li>
  <li><strong>No action.</strong> A prediction nobody acts on is a dashboard number. Define the action (send a reminder, auto-release, prioritise a call-back) first.</li>
  <li><strong>Errors are unacceptable without human review</strong> — then the model is a ranking aid, not a decision maker.</li>
</ul>

<h3>Classic ML vs LLM — the decision</h3>
<table>
  <thead><tr><th>Dimension</th><th>Classic ML (e.g. gradient boosting)</th><th>LLM</th></tr></thead>
  <tbody>
    <tr><td>Natural input</td><td>Tabular: numbers, categories, aggregates</td><td>Unstructured text, documents, conversations, images</td></tr>
    <tr><td>Labels needed</td><td>Hundreds to millions</td><td>Zero to a few dozen examples in a prompt</td></tr>
    <tr><td>Cost per prediction</td><td>Microseconds of CPU — effectively free at scale</td><td>Per-token pricing; orders of magnitude more per prediction</td></tr>
    <tr><td>Latency</td><td>Sub-millisecond to a few ms</td><td>Hundreds of ms to seconds</td></tr>
    <tr><td>Probabilities</td><td>Can be measured and calibrated</td><td>Stated confidence is not calibrated</td></tr>
    <tr><td>Determinism / auditability</td><td>Deterministic; SHAP explanations</td><td>Can vary run to run; rationale text isn't a faithful explanation</td></tr>
    <tr><td>Numeric precision</td><td>Strong on numeric patterns within the training distribution</td><td>Weak at precise numeric regression over many columns</td></tr>
    <tr><td>Changing behaviour</td><td>Retrain on new data</td><td>Edit the prompt — fast iteration</td></tr>
  </tbody>
</table>
<p><strong>Hybrid patterns that win in practice:</strong></p>
<ul>
  <li><strong>LLM as feature extractor:</strong> an LLM reads each sales-call transcript and outputs structured fields (objections raised, next step agreed, sentiment); a GBM combines those with CRM numbers to predict conversion. This is how a call-scoring system feeds a predictive model.</li>
  <li><strong>Embeddings as features:</strong> text → embedding (see <a href="#/topic/ai-vector-search">Embeddings &amp; Vector Search</a>) → logistic regression or GBM. Cheap, strong text classifier when you have a few thousand labels.</li>
  <li><strong>LLM labels, small model serves:</strong> use an LLM to label 20k examples (spot-checked by humans), then train a cheap classifier that runs on every event.</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>The time-travel rule</h3>
<div class="diagram">
<pre>
 past ─────────────────────────────────────────────────────────────────────────► future
        │◄──────── feature window ────────►│                │◄── label window ──►│
        (organiser's bookings in last 90d)  │                (start … start+10min)
                                            ▲                ▲
                                     PREDICTION TIME     booking start
                                       (start − 2h)

 ✔ allowed: anything known at or before PREDICTION TIME
 ✘ leakage: "checked_in_at", "auto_released", "reminder_clicked" — produced AFTER it
 ✘ subtle:  "organiser no-show rate" computed over ALL bookings, including future ones
</pre>
</div>
<p>Every leakage bug is a violation of this picture. Ask of every feature: <em>"At prediction time, in production, would I have this exact value?"</em></p>

<h3>An ML system is mostly not the model</h3>
<div class="diagram">
<pre>
 ┌────────────┐ ┌──────────────┐ ┌─────────────┐ ┌───────┐ ┌──────────┐ ┌────────────┐
 │ data       │ │ label        │ │ feature     │ │ MODEL │ │ serving  │ │ monitoring │
 │ collection │ │ definition   │ │ pipelines   │ │ code  │ │ + API    │ │ + retrain  │
 └────────────┘ └──────────────┘ └─────────────┘ └───────┘ └──────────┘ └────────────┘
      large          small but         large         tiny       medium        medium
                     critical
</pre>
</div>
<p>The well-known "Hidden Technical Debt in Machine Learning Systems" paper (Sculley et al., 2015) made this point: model code is a small box surrounded by much larger data, serving and monitoring infrastructure — which is exactly the part a full-stack engineer owns.</p>

<h3>Under- vs over-fitting</h3>
<div class="diagram">
<pre>
 error
   │ ╲                                         ╱  validation error
   │  ╲                                     ╱
   │   ╲         sweet spot            ╱
   │    ╲_______    ▼          ____╱
   │            ╲________●____╱
   │                     ╲____________
   │                                  ╲_________  training error
   └──────────────────────────────────────────────► model complexity
     UNDERFIT (high bias)               OVERFIT (high variance)
     train ≈ val, both bad              train great, val much worse
</pre>
</div>

<h3>The confusion matrix (binary)</h3>
<div class="diagram">
<pre>
                         predicted NO-SHOW     predicted SHOWS UP
 actual NO-SHOW            TP (caught)            FN (missed)
 actual SHOWS UP           FP (false alarm)       TN

 precision = TP / (TP + FP)   "when I say no-show, how often am I right?"
 recall    = TP / (TP + FN)   "of all no-shows, how many did I catch?"
 F1        = harmonic mean of precision and recall
</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"The model is 97% accurate." If only 3% of bookings are no-shows, predicting "shows up" for everything is 97% accurate and completely useless. Report precision/recall at the operating threshold and PR-AUC — and always compare against a trivial baseline.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. Frame the problem before touching data</h3>
<ul>
  <li><strong>Unit:</strong> what is one row? (a booking, a user-week, a call)</li>
  <li><strong>Prediction time:</strong> when does the model run, and what is known then?</li>
  <li><strong>Label:</strong> precise definition and window ("no check-in within 10 minutes of start", not "didn't use the room"). Who decides edge cases — cancelled 5 minutes before start?</li>
  <li><strong>Action + cost of errors:</strong> what happens on a positive prediction, and what does a false positive vs false negative cost?</li>
  <li><strong>Baseline:</strong> what does the business do today, and what simple heuristic would we beat?</li>
</ul>

<h3>2. Features and leakage</h3>
<table>
  <thead><tr><th>Feature kind</th><th>Handling</th></tr></thead>
  <tbody>
    <tr><td>Numeric</td><td>Trees: use as-is. Linear models: scale; consider log for skewed amounts.</td></tr>
    <tr><td>Low-cardinality categorical</td><td>One-hot (linear) or native categorical support (LightGBM, CatBoost, HistGradientBoosting).</td></tr>
    <tr><td>High-cardinality categorical (user id, room id)</td><td>Target encoding <em>computed out-of-fold or from the past only</em>, frequency encoding, or historical aggregates per entity.</td></tr>
    <tr><td>Time</td><td>Hour, day-of-week, holiday flag, time since last event; cyclical sin/cos for linear models.</td></tr>
    <tr><td>Behavioural aggregates</td><td>"Past 90-day no-show rate", "bookings in last 7 days" — the strongest features, and the easiest to leak.</td></tr>
    <tr><td>Text</td><td>TF-IDF, embeddings, or LLM-extracted structured fields.</td></tr>
  </tbody>
</table>

<h4>Leakage types</h4>
<table>
  <thead><tr><th>Type</th><th>Example</th><th>Symptom / fix</th></tr></thead>
  <tbody>
    <tr><td>Target leakage</td><td><code>auto_released = true</code> as a feature for no-show</td><td>One feature dominates importance; drop anything produced by or after the outcome</td></tr>
    <tr><td>Temporal leakage</td><td>Aggregates over all history, including the future</td><td>Compute point-in-time (only rows before prediction time)</td></tr>
    <tr><td>Split leakage</td><td>Random split on time-series data: training on March to predict February</td><td>Split by time</td></tr>
    <tr><td>Preprocessing contamination</td><td>Scaler / target encoder / imputer fit on the full dataset</td><td>Fit transforms inside a <code>Pipeline</code> on train only</td></tr>
    <tr><td>Group leakage</td><td>The same user or the same call in train and test</td><td>Group-aware splits (GroupKFold) when predicting for new entities</td></tr>
    <tr><td>Duplicate leakage</td><td>Near-identical rows on both sides of the split</td><td>Dedupe before splitting</td></tr>
  </tbody>
</table>
<p>Red flags: offline metrics that look too good (ROC-AUC 0.99 on a messy human behaviour), one feature with overwhelming importance, or a big drop from offline to online performance.</p>

<h3>3. Splits and validation</h3>
<table>
  <thead><tr><th>Split</th><th>Use when</th></tr></thead>
  <tbody>
    <tr><td>Train / validation / test (e.g. 70/15/15)</td><td>Train fits; validation picks hyperparameters, threshold, early stopping; test is touched <em>once</em> for the final number.</td></tr>
    <tr><td>Time-based</td><td>Anything where the future is predicted from the past — which is nearly every product problem. Train on Jan–Jun, validate on Jul, test on Aug.</td></tr>
    <tr><td>Stratified</td><td>Rare positives; keeps the class ratio in each fold (when time order doesn't matter).</td></tr>
    <tr><td>Group (GroupKFold)</td><td>The model will meet unseen users/companies in production.</td></tr>
    <tr><td>k-fold cross-validation</td><td>Small data; average over k folds for a stabler estimate (use TimeSeriesSplit for temporal data).</td></tr>
  </tbody>
</table>

<h3>4. Metrics — and which to pick</h3>
<table>
  <thead><tr><th>Metric</th><th>What it measures</th><th>Use when</th><th>Trap</th></tr></thead>
  <tbody>
    <tr><td>Accuracy</td><td>% correct</td><td>Balanced classes, equal error costs</td><td>Meaningless when positives are rare</td></tr>
    <tr><td>Precision</td><td>TP / predicted positives</td><td>False positives are expensive (auto-releasing a room someone needs)</td><td>Easy to max by predicting few positives</td></tr>
    <tr><td>Recall</td><td>TP / actual positives</td><td>Misses are expensive (fraud, safety, screening)</td><td>Easy to max by predicting everything positive</td></tr>
    <tr><td>F1</td><td>Harmonic mean of P and R</td><td>One number when both matter similarly</td><td>Hides which side is failing; assumes equal weight</td></tr>
    <tr><td>ROC-AUC</td><td>P(random positive scored above random negative)</td><td>Threshold-free ranking quality, balanced-ish classes</td><td>Looks rosy with heavy imbalance (many easy negatives)</td></tr>
    <tr><td>PR-AUC (average precision)</td><td>Precision across recall levels</td><td>Rare positives — the honest summary</td><td>Baseline = positive rate, not 0.5</td></tr>
    <tr><td>Log loss / Brier</td><td>Quality of the probabilities</td><td>Probabilities drive decisions or are shown to users</td><td>Harder to explain to stakeholders</td></tr>
    <tr><td>MAE</td><td>Average absolute error</td><td>Regression; robust to outliers; in the target's units</td><td>Doesn't punish big misses extra</td></tr>
    <tr><td>RMSE</td><td>Root mean squared error</td><td>Big errors are disproportionately bad</td><td>Dominated by a few outliers</td></tr>
    <tr><td>MAPE</td><td>Mean absolute % error</td><td>Business-friendly % for forecasts</td><td>Explodes when actuals are near zero</td></tr>
    <tr><td>R²</td><td>Variance explained vs predicting the mean</td><td>Comparing regressors on the same data</td><td>Not comparable across datasets</td></tr>
  </tbody>
</table>
<p><strong>Thresholds are a business decision.</strong> The model outputs a probability; the threshold that turns it into an action should minimise expected cost: <code>cost = FP × cost_fp + FN × cost_fn</code>. A cheap action (a reminder push) tolerates a low threshold; an expensive one (auto-release the room) needs high precision.</p>

<h3>5. Overfitting and regularisation</h3>
<ul>
  <li><strong>Detect:</strong> training metric much better than validation; validation metric getting worse as you add trees; learning curves that don't converge.</li>
  <li><strong>Linear models:</strong> L2 (ridge) shrinks all weights — loss + λ·Σw²; L1 (lasso) drives some to exactly zero (feature selection) — loss + λ·Σ|w|.</li>
  <li><strong>Trees / boosting:</strong> limit depth or <code>num_leaves</code>, require more samples per leaf (<code>min_child_samples</code> / <code>min_samples_leaf</code>), lower the learning rate with more trees, row/column subsampling, L2 on leaf values, and <strong>early stopping</strong> on a validation set.</li>
  <li><strong>Data:</strong> more (and cleaner) data beats cleverer regularisation; fewer, better features beat hundreds of noisy ones.</li>
</ul>

<h3>6. Algorithms worth knowing</h3>
<table>
  <thead><tr><th>Model</th><th>Idea</th><th>Strengths</th><th>Weaknesses</th></tr></thead>
  <tbody>
    <tr><td>Linear / logistic regression</td><td>Weighted sum (→ sigmoid for probability)</td><td>Fast, interpretable, well-calibrated, great baseline</td><td>Needs feature engineering for non-linearity and interactions</td></tr>
    <tr><td>Decision tree</td><td>If/else splits on features</td><td>Readable</td><td>Overfits alone; unstable</td></tr>
    <tr><td>Random forest</td><td>Many deep trees on bootstrap samples, averaged (bagging)</td><td>Robust, little tuning</td><td>Bigger, slower to serve; usually a bit behind boosting</td></tr>
    <tr><td>Gradient boosting</td><td>Shallow trees added sequentially, each fixing the previous errors</td><td>Best-in-class on tabular data; handles missing values, mixed types, interactions</td><td>More hyperparameters; overfits without early stopping</td></tr>
    <tr><td>k-NN</td><td>Vote of the nearest labelled examples</td><td>No training; works with embeddings</td><td>Slow at scale without ANN; sensitive to scaling</td></tr>
    <tr><td>k-means</td><td>Assign points to k centroids</td><td>Simple segmentation</td><td>You choose k; spherical clusters</td></tr>
    <tr><td>Neural networks</td><td>Layers of learned transformations</td><td>Images, audio, text, very large data</td><td>On typical tabular data, usually no better than boosting and much more effort</td></tr>
  </tbody>
</table>

<h3>7. Gradient boosting in depth</h3>
<div class="diagram">
<pre>
 prediction = base  + η·tree₁(x)  + η·tree₂(x)  + … + η·treeₙ(x)        η = learning rate

 round 1: tree₁ fits the errors (gradients of the loss) of the base prediction
 round 2: tree₂ fits what is STILL wrong after tree₁
 …        stop when validation loss stops improving  (early stopping)
</pre>
</div>
<ul>
  <li><strong>Why it wins on tables:</strong> trees split on raw values (no scaling), capture interactions ("short lead time AND recurring meeting"), handle missing values natively, and are robust to irrelevant features. Benchmarks such as Grinsztajn et al. (2022), "Why do tree-based models still outperform deep learning on tabular data?", found tree ensembles remain the strongest default on medium-sized tabular datasets.</li>
  <li><strong>Key hyperparameters:</strong> <code>learning_rate</code> (0.03–0.1), number of trees (set high, let early stopping pick), <code>num_leaves</code> / <code>max_depth</code> (complexity), <code>min_child_samples</code> (leaf size), <code>subsample</code> / <code>colsample_bytree</code> (0.7–0.9), L2 on leaves.</li>
  <li><strong>Libraries:</strong> LightGBM (fast, leaf-wise growth, native categoricals), XGBoost (mature, widely deployed), CatBoost (strong categorical handling with less tuning), scikit-learn <code>HistGradientBoosting*</code> (no extra dependency, native NaN and categorical support).</li>
</ul>

<h3>8. Class imbalance</h3>
<ul>
  <li>Use PR-AUC and precision/recall at a threshold, not accuracy.</li>
  <li><strong>Class weights</strong> (<code>class_weight='balanced'</code> or <code>scale_pos_weight</code>) before resampling; oversampling methods such as SMOTE often add little for tree models.</li>
  <li><strong>Tune the threshold</strong> — usually the biggest lever.</li>
  <li>Reweighting distorts probabilities; <strong>re-check calibration</strong> if you display or threshold on them.</li>
</ul>

<h3>9. Explainability</h3>
<ul>
  <li><strong>Global:</strong> permutation importance (how much does the validation metric drop when a feature is shuffled) — more trustworthy than built-in split-count importance.</li>
  <li><strong>Local:</strong> SHAP values give each feature's contribution to a single prediction ("flagged mainly because of 2 no-shows in the last 30 days and a 7-day lead time"). <code>shap.TreeExplainer</code> is fast for tree ensembles.</li>
  <li>Explanations are also your best leakage detector: a suspicious top feature is a bug report.</li>
</ul>

<h3>10. Serving</h3>
<table>
  <thead><tr><th>Mode</th><th>How</th><th>Use when</th></tr></thead>
  <tbody>
    <tr><td>Batch</td><td>Scheduled job scores all entities, writes predictions to a table</td><td>Predictions needed per day/hour (tomorrow's bookings, weekly churn list). Simplest; start here.</td></tr>
    <tr><td>Online (request/response)</td><td>Model service behind an API, features fetched at request time</td><td>Needs the latest context (score a booking the moment it's created)</td></tr>
    <tr><td>Streaming</td><td>Consumer scores events off a queue/stream</td><td>Event-driven reactions (fraud on each transaction)</td></tr>
    <tr><td>Embedded / on-device</td><td>Export (e.g. ONNX, Core ML, TFLite) and run in-process or on the phone</td><td>Offline, ultra-low latency, privacy; check the converter supports your model type</td></tr>
  </tbody>
</table>
<ul>
  <li><strong>Package the whole pipeline</strong> (preprocessing + model) as one versioned artifact; record the training data snapshot, code commit, metrics and threshold next to it (a model registry such as MLflow, or a simple versioned S3 prefix + metadata table).</li>
  <li><strong>Training/serving skew:</strong> features computed one way in a pandas notebook and another way in the TypeScript API will silently diverge. Share the feature code, or compute features in one place (a SQL view / feature store) for both training and serving, and log served features to compare.</li>
  <li><strong>Roll out safely:</strong> shadow mode (score but don't act) → small percentage → full; keep the previous model one config change away.</li>
</ul>

<h3>11. Monitoring and drift</h3>
<table>
  <thead><tr><th>What drifts</th><th>Meaning</th><th>How you see it</th></tr></thead>
  <tbody>
    <tr><td>Data / covariate drift</td><td>Input distribution changes (new office opens, new booking flow)</td><td>PSI / KS test per feature vs the training window</td></tr>
    <tr><td>Prediction drift</td><td>Score distribution shifts</td><td>Mean score, % above threshold, PSI on scores</td></tr>
    <tr><td>Concept drift</td><td>The relationship changes: same features, different outcome (hybrid work changes no-show behaviour)</td><td>Only visible in performance once labels arrive</td></tr>
    <tr><td>Data quality</td><td>Nulls, unit changes, a broken upstream join</td><td>Schema/range/null-rate checks before scoring</td></tr>
  </tbody>
</table>
<p><strong>PSI</strong> (Population Stability Index) compares binned distributions: Σ (actual% − expected%) × ln(actual% / expected%). A common rule of thumb: below 0.1 stable, 0.1–0.25 worth a look, above 0.25 significant shift. <strong>Label delay</strong> matters: churn labels may take 30–90 days, so drift metrics are your early warning and performance metrics your confirmation. Retrain on a schedule <em>and</em> on alerts, compare challenger vs champion on the same recent window before promoting.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — No-show prediction, end to end (pandas + scikit-learn)</h3>
<p>Scenario: a meeting-room booking platform with check-in tablets wants to predict, two hours before start, which bookings will be no-shows — to send a "still need this room?" reminder.</p>
<pre><code class="language-python">import numpy as np
import pandas as pd

df = pd.read_parquet("bookings.parquet")    # one row per booking
# columns: booking_id, organiser_id, room_id, created_at, start_time, duration_min,
#          attendees, room_capacity, is_recurring, department, checked_in_at, cancelled_at

df = df[df["cancelled_at"].isna()].copy()   # cancelled bookings aren't no-shows: define the label carefully
df["no_show"] = (
    df["checked_in_at"].isna()
    | (df["checked_in_at"] &gt; df["start_time"] + pd.Timedelta(minutes=10))
).astype(int)

# ── Features known at prediction time (start − 2h) ──
df["lead_time_h"] = (df["start_time"] - df["created_at"]).dt.total_seconds() / 3600
df["hour"] = df["start_time"].dt.hour
df["dow"] = df["start_time"].dt.dayofweek
df["fill_ratio"] = df["attendees"] / df["room_capacity"]

# Point-in-time organiser history: only bookings BEFORE this one.
# (Stricter version: only bookings whose outcome was known at prediction time — see Edge Cases.)
df = df.sort_values(["organiser_id", "start_time"])
g = df.groupby("organiser_id")["no_show"]
df["org_prior_bookings"] = g.cumcount()
df["org_prior_noshow_rate"] = (g.cumsum() - df["no_show"]) / df["org_prior_bookings"].replace(0, np.nan)

FEATURES_NUM = ["lead_time_h", "hour", "dow", "duration_min", "attendees",
                "fill_ratio", "is_recurring", "org_prior_bookings", "org_prior_noshow_rate"]
FEATURES_CAT = ["department", "room_id"]

# ── Time-based split: train on the past, validate and test on the future ──
train = df[df["start_time"] &lt; "2026-06-01"]
val   = df[(df["start_time"] &gt;= "2026-06-01") &amp; (df["start_time"] &lt; "2026-08-01")]
test  = df[df["start_time"] &gt;= "2026-08-01"]
print(len(train), len(val), len(test), "positive rate:", round(train["no_show"].mean(), 3))</code></pre>

<pre><code class="language-python">from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OrdinalEncoder
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.impute import SimpleImputer
from sklearn.metrics import roc_auc_score, average_precision_score

X_cols = FEATURES_CAT + FEATURES_NUM
pre = ColumnTransformer([
    # unseen categories at serving time become NaN, which the model treats as missing
    ("cat", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=np.nan,
                           encoded_missing_value=np.nan), FEATURES_CAT),
    ("num", "passthrough", FEATURES_NUM),
])
model = Pipeline([
    ("pre", pre),
    ("gbm", HistGradientBoostingClassifier(
        learning_rate=0.05, max_iter=1000, max_leaf_nodes=31, min_samples_leaf=50,
        l2_regularization=1.0,
        categorical_features=[True] * len(FEATURES_CAT) + [False] * len(FEATURES_NUM),
        early_stopping=True, validation_fraction=0.1, n_iter_no_change=50,
        random_state=42)),
])
model.fit(train[X_cols], train["no_show"])

# ── Always compare with baselines ──
heuristic_val = val["org_prior_noshow_rate"].fillna(train["no_show"].mean())
logreg = Pipeline([("imp", SimpleImputer(strategy="median")), ("lr", LogisticRegression(max_iter=1000))])
logreg.fit(train[FEATURES_NUM], train["no_show"])

p_val = model.predict_proba(val[X_cols])[:, 1]
for name, scores in [("heuristic", heuristic_val),
                     ("logistic", logreg.predict_proba(val[FEATURES_NUM])[:, 1]),
                     ("gbm", p_val)]:
    print(name, "ROC-AUC", round(roc_auc_score(val["no_show"], scores), 3),
          "PR-AUC", round(average_precision_score(val["no_show"], scores), 3))
# PR-AUC baseline = the positive rate (e.g. 0.18), not 0.5 — report it alongside.</code></pre>
<p>Notes: <code>HistGradientBoostingClassifier</code> categorical features must have at most <code>max_bins</code> (255) categories — use a frequency-capped encoding or target statistics for very high-cardinality ids. The inner <code>early_stopping</code> uses a random slice of <em>train</em>; for strictly temporal validation, early-stop on the time-based validation set instead (LightGBM example below).</p>

<h3>Example 2 — LightGBM with native categoricals and early stopping on a time-based validation set</h3>
<pre><code class="language-python">import lightgbm as lgb

def as_lgb(frame: pd.DataFrame) -&gt; pd.DataFrame:
    X = frame[X_cols].copy()
    for c in FEATURES_CAT:      # pandas 'category' dtype → LightGBM treats it as categorical
        X[c] = pd.Categorical(X[c], categories=sorted(train[c].dropna().unique()))
    return X

clf = lgb.LGBMClassifier(
    n_estimators=5000, learning_rate=0.03, num_leaves=31, min_child_samples=50,
    subsample=0.8, subsample_freq=1, colsample_bytree=0.8, reg_lambda=1.0,
)
clf.fit(
    as_lgb(train), train["no_show"],
    eval_set=[(as_lgb(val), val["no_show"])],
    eval_metric="average_precision",
    callbacks=[lgb.early_stopping(200), lgb.log_evaluation(500)],
)
print("best iteration:", clf.best_iteration_)</code></pre>
<p>Fixing the category list from the training data matters: at serving time the same mapping must apply, and unseen categories must map to "missing" rather than a shifted code.</p>

<h3>Example 3 — Choose the threshold from business costs</h3>
<pre><code class="language-python">y_val = val["no_show"].to_numpy()

def best_threshold(y, p, cost_fp, cost_fn):
    ts = np.linspace(0.05, 0.95, 91)
    costs = [((p &gt;= t) &amp; (y == 0)).sum() * cost_fp + ((p &lt; t) &amp; (y == 1)).sum() * cost_fn for t in ts]
    i = int(np.argmin(costs))
    return ts[i], costs[i]

# Action A: send a reminder push. A false positive is a mildly annoying notification.
print("reminder threshold:", best_threshold(y_val, p_val, cost_fp=1, cost_fn=3))
# Action B: auto-release the room. A false positive kicks out a team that was coming.
print("auto-release threshold:", best_threshold(y_val, p_val, cost_fp=20, cost_fn=3))</code></pre>
<p>Same model, two very different thresholds — because the <em>action</em> changes the cost of a false positive. Pick the threshold on validation, then report final precision/recall on the untouched test set.</p>

<h3>Example 4 — Check calibration before showing probabilities</h3>
<pre><code class="language-python">from sklearn.calibration import calibration_curve
from sklearn.metrics import brier_score_loss

frac_pos, mean_pred = calibration_curve(y_val, p_val, n_bins=10, strategy="quantile")
for mp, fp in zip(mean_pred, frac_pos):
    print(f"predicted {mp:.2f}  →  observed {fp:.2f}")
print("Brier:", round(brier_score_loss(y_val, p_val), 4))
# If "predicted 0.40" bins show "observed 0.25", the scores rank well but over-state risk.
# Fix with sklearn's CalibratedClassifierCV (isotonic or sigmoid) fit on held-out data,
# especially after class weighting — then re-pick the threshold.</code></pre>

<h3>Example 5 — Catching leakage with a suspicious result</h3>
<pre><code class="language-python">from sklearn.inspection import permutation_importance

leaky_cols = X_cols + ["reminder_opened"]       # added by a well-meaning teammate
# ROC-AUC jumps from 0.78 to 0.97. Celebrate? No — investigate.
# reminder_opened is only known AFTER the reminder is sent, i.e. after prediction time,
# and only for bookings we already flagged. It encodes our own past predictions.

imp = permutation_importance(model, val[X_cols], y_val, scoring="average_precision",
                             n_repeats=5, random_state=0)
for name, score in sorted(zip(X_cols, imp.importances_mean), key=lambda t: -t[1])[:5]:
    print(f"{name:28s} {score:.4f}")
# A single feature with overwhelming importance is a bug report until proven otherwise.</code></pre>

<h3>Example 6 — Online serving with FastAPI (Python model service)</h3>
<pre><code class="language-python"># serve.py — run with: uvicorn serve:app --workers 2
import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel

ARTIFACT = joblib.load("models/no_show/2026-11-01/pipeline.joblib")   # preprocessing + model
META = {"model_version": "no_show@2026-11-01", "threshold": 0.42}

app = FastAPI()

class BookingFeatures(BaseModel):
    department: str | None
    room_id: str | None
    lead_time_h: float
    hour: int
    dow: int
    duration_min: int
    attendees: int
    fill_ratio: float
    is_recurring: int
    org_prior_bookings: int
    org_prior_noshow_rate: float | None

@app.post("/predict/no-show")
def predict(body: BookingFeatures):
    X = pd.DataFrame([body.model_dump()])
    p = float(ARTIFACT.predict_proba(X)[:, 1][0])
    return {"probability": p, "flag": p &gt;= META["threshold"], **META}

@app.get("/healthz")
def health():
    return {"ok": True, **META}</code></pre>
<pre><code class="language-ts">// Node API → model service. The model is an optimisation, so failure must degrade gracefully.
export async function noShowRisk(features: BookingFeatures): Promise&lt;{ probability: number | null; modelVersion?: string }&gt; {
  try {
    const res = await fetch(process.env.MODEL_URL + '/predict/no-show', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(features),
      signal: AbortSignal.timeout(150),          // tight budget: a GBM answers in milliseconds
    });
    if (!res.ok) throw new Error('model ' + res.status);
    const out = await res.json();
    await logPrediction({ ...features, ...out }); // served features + version → skew and drift analysis
    return { probability: out.probability, modelVersion: out.model_version };
  } catch {
    return { probability: null };                 // caller falls back to the rule-based behaviour
  }
}</code></pre>

<h3>Example 7 — Batch scoring job (often all you need)</h3>
<pre><code class="language-python"># score_tomorrow.py — scheduled hourly (cron / EventBridge / Airflow)
import joblib, pandas as pd, sqlalchemy as sa

engine = sa.create_engine(DB_URL)
pipe = joblib.load(MODEL_PATH)
upcoming = pd.read_sql(sa.text(FEATURES_SQL), engine, params={"from_h": 2, "to_h": 3})  # same SQL as training
upcoming["probability"] = pipe.predict_proba(upcoming[X_cols])[:, 1]
upcoming["model_version"] = MODEL_VERSION
upcoming[["booking_id", "probability", "model_version"]].to_sql(
    "no_show_predictions", engine, if_exists="append", index=False)</code></pre>
<p>Reusing the <em>same</em> feature SQL for training and scoring is the cheapest defence against training/serving skew.</p>

<h3>Example 8 — Drift monitoring with PSI</h3>
<pre><code class="language-python">def psi(expected: np.ndarray, actual: np.ndarray, bins: int = 10) -&gt; float:
    expected, actual = expected[~np.isnan(expected)], actual[~np.isnan(actual)]
    edges = np.unique(np.quantile(expected, np.linspace(0, 1, bins + 1)))
    edges[0], edges[-1] = -np.inf, np.inf
    e = np.histogram(expected, edges)[0] / len(expected)
    a = np.histogram(actual, edges)[0] / len(actual)
    e, a = np.clip(e, 1e-6, None), np.clip(a, 1e-6, None)
    return float(np.sum((a - e) * np.log(a / e)))

reference = train.sample(min(50_000, len(train)), random_state=0)   # training-time snapshot
last_week = load_served_features(days=7)                    # from the prediction log

report = {c: psi(reference[c].to_numpy(float), last_week[c].to_numpy(float)) for c in FEATURES_NUM}
report["score"] = psi(model.predict_proba(reference[X_cols])[:, 1], last_week["probability"].to_numpy())
alerts = {k: round(v, 3) for k, v in report.items() if v &gt; 0.25}
if alerts:
    notify("no_show model drift", alerts)                   # then: check upstream changes, retrain, compare</code></pre>

<h3>Example 9 — Hybrid: LLM-extracted features feeding a GBM</h3>
<p>A sales team scores calls with an LLM rubric (structured JSON per call: <code>pricing_discussed</code>, <code>objection_count</code>, <code>next_step_booked</code>, <code>sentiment</code>). To predict which deals close in 30 days:</p>
<ul>
  <li>LLM output becomes <strong>features</strong>, joined with CRM data (deal size, stage age, number of calls, industry).</li>
  <li>A GBM trained on 18 months of closed/lost deals predicts P(close). It runs nightly for thousands of open deals for effectively zero marginal cost.</li>
  <li>SHAP shows reps <em>why</em> a deal is at risk ("no next step booked on the last two calls").</li>
  <li>The LLM does what it's good at (reading messy conversation); the GBM does what it's good at (calibrated numeric prediction over structured signals). See <a href="#/topic/ai-llm-integration">LLM Integrations</a> for structured outputs.</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. "Prior" history that wasn't known yet</h3>
<p>The organiser's 10:00 booking is "before" the 11:00 one, but when you predict at 09:00 its outcome is unknown. Strict point-in-time features only count events whose outcome was known at prediction time — use an as-of join (<code>pd.merge_asof</code>) on outcome-known timestamps.</p>

<h3>2. Your model changes the labels</h3>
<p>Once reminders go out, people who would have no-showed cancel instead — the model's own action suppresses the outcome it predicts. Keep a small random hold-out with no intervention so you can still measure true performance and train future models.</p>

<h3>3. Label delay</h3>
<p>Churn or loan default labels arrive weeks or months later. You can't evaluate last week's model on last week's outcomes; rely on drift signals in the meantime and backfill performance when labels mature.</p>

<h3>4. Cold start</h3>
<p>A brand-new user or room has no history; aggregates are NaN. Trees handle missing values natively, but add "number of prior events" so the model can tell "no history" from "good history". Fall back to segment-level priors.</p>

<h3>5. Unseen categories at serving time</h3>
<p>A new department or room id appears. Encoders must map unknowns to "missing/other", never crash and never silently reuse another category's code.</p>

<h3>6. Very rare positives</h3>
<p>0.1% positives: a few hundred examples may be all you have. Use PR-AUC, group-aware CV for a stable estimate, class weights, and be honest about confidence intervals.</p>

<h3>7. Seasonality and regime changes</h3>
<p>Holidays, fiscal year-end, a return-to-office mandate. Validate on a window that includes similar periods; add calendar features; retrain after regime changes rather than trusting drift metrics alone.</p>

<h3>8. Feedback loops in ranking</h3>
<p>A lead-scoring model sends reps to high-score leads; low-score leads never get called and therefore never convert, "confirming" the model. Use exploration (some random allocation) and log what was shown.</p>

<h3>9. Proxy labels</h3>
<p>"Didn't check in on the tablet" ≠ "didn't use the room" if the tablet was offline. Audit a sample of labels; filter rows from periods with known data issues.</p>

<h3>10. Small data</h3>
<p>A few thousand rows: prefer simpler models (logistic regression, shallow boosting), k-fold CV, fewer features, and heavier regularisation. Variance between folds tells you how much to trust the number.</p>

<h3>11. Duplicated entities across splits</h3>
<p>Recurring meetings produce near-identical rows weekly. A random split puts copies on both sides and inflates metrics; time-based or group-based splits prevent it.</p>

<h3>12. Fairness and sensitive attributes</h3>
<p>Even without a protected attribute, proxies (department, location) can encode it. For consequential decisions (credit, hiring, pricing), measure performance and error rates per group and involve legal/compliance — in many jurisdictions this is regulated.</p>

<h3>13. Upstream unit or schema change</h3>
<p><code>duration</code> switches from minutes to seconds; predictions go haywire without any code change. Schema and range checks before scoring catch it; PSI alarms confirm it.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — random split on time-ordered data</h3>
<p><code>train_test_split(df, shuffle=True)</code> on bookings trains on the future to predict the past. Offline metrics look great, production disappoints. Split by time.</p>

<h3>Anti-pattern 2 — fitting preprocessing on the full dataset</h3>
<pre><code class="language-python">X = StandardScaler().fit_transform(df[cols])      # test statistics leak into training
X_train, X_test = train_test_split(X, ...)</code></pre>
<p>Put every transform inside a <code>Pipeline</code> fitted on the training data only.</p>

<h3>Anti-pattern 3 — reporting accuracy on imbalanced data</h3>
<p>"95% accurate" when 95% of rows are negative. Report PR-AUC and precision/recall at the operating threshold, next to the trivial baseline.</p>

<h3>Anti-pattern 4 — tuning on the test set</h3>
<p>Trying 50 hyperparameter configurations and picking the best test score turns the test set into a validation set; the reported number is optimistic. Tune on validation, touch test once.</p>

<h3>Anti-pattern 5 — no baseline</h3>
<p>A GBM at ROC-AUC 0.74 sounds fine until a one-line heuristic ("organiser's past no-show rate") scores 0.72. Always show the baseline; the delta is the model's value.</p>

<h3>Anti-pattern 6 — default threshold of 0.5</h3>
<p>0.5 is arbitrary, especially with class weighting or rare positives. Choose it from costs on validation.</p>

<h3>Anti-pattern 7 — notebook features re-implemented in the API</h3>
<p>The notebook computes "past 90-day rate" including today; the TypeScript service excludes it. Silent skew. Share one feature definition and log served features.</p>

<h3>Anti-pattern 8 — shipping without monitoring</h3>
<p>The model degrades for months after an upstream change and nobody notices. Minimum: input data checks, PSI on key features and scores, and performance once labels arrive — with an owner for the alerts.</p>

<h3>Anti-pattern 9 — deep learning first on a table</h3>
<p>A week building a neural net for 40 tabular columns that a tuned GBM beats in an afternoon. Start with a baseline, then boosting.</p>

<h3>Anti-pattern 10 — using an LLM for row-by-row numeric prediction</h3>
<p>Prompting an LLM with 30 columns of CRM numbers to "estimate churn probability" for 2M users: slow, expensive, uncalibrated, non-deterministic. Use classic ML; use the LLM for the unstructured parts.</p>

<h3>Anti-pattern 11 — unversioned model artifacts</h3>
<p><code>model.pkl</code> overwritten in place; nobody knows which data or code produced the model in production, and rollback is impossible. Version artifact + data snapshot + code commit + metrics + threshold.</p>

<h3>Anti-pattern 12 — trusting built-in feature importance alone</h3>
<p>Split-count importance favours high-cardinality features. Use permutation importance or SHAP, and treat a dominant feature as a possible leak.</p>

<h3>Anti-pattern 13 — the model as a single point of failure</h3>
<p>The booking API calls the model synchronously with no timeout; the model service restarts and bookings fail. Tight timeout, fallback to rules, or precomputed batch scores.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. Supervised vs unsupervised learning — give product examples.</div>
  <div class="qa-answer">
    <p>Supervised learns from labelled examples: predicting no-shows from past bookings where we know who showed up, or call duration from past calls. Unsupervised finds structure without labels: clustering users into segments, or clustering call-transcript embeddings to discover complaint themes, or anomaly detection on device telemetry. Supervised is easier to evaluate because there's a right answer; unsupervised output needs human judgement or a downstream metric to validate.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What is data leakage? Give examples and how you'd detect it.</div>
  <div class="qa-answer">
    <p>Leakage is when training features contain information that won't be available at prediction time, so offline metrics are inflated. Examples: a feature produced after the outcome (an "auto-released" flag for no-show prediction), aggregates computed over all history including the future, preprocessing fit on the full dataset, random splits on time-series data, and the same user on both sides of the split. Detection: metrics that are too good, one feature dominating permutation importance or SHAP, a large offline-to-online drop, and simply asking for every feature "would I have this exact value at prediction time in production?". Prevention: point-in-time feature computation, time-based splits and transforms inside a pipeline.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Your new model scores ROC-AUC 0.99 on the test set. What do you do?</div>
  <div class="qa-answer">
    <p>Assume a bug until proven otherwise — human behaviour is rarely that predictable. Check the split (time-based? duplicates across it?), check feature importance for a single dominant feature, trace how the top features are computed relative to prediction time, check whether the label is accidentally derivable from a feature, and compare against a simple baseline. Then validate on a fresh, later time window or in shadow mode before believing it.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Precision or recall — which matters more?</div>
  <div class="qa-answer">
    <p>It depends on the cost of each error type and the action taken. Fraud screening that sends cases to human review favours recall — a missed fraud is expensive, a false alarm costs a few minutes. Auto-releasing a booked room favours precision — wrongly kicking out a team is worse than an empty room. The same no-show model can drive a cheap action (a reminder, low threshold) and an expensive one (auto-release, high threshold). I'd put explicit costs on false positives and negatives and pick the threshold that minimises expected cost on validation data.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Why can ROC-AUC be misleading on imbalanced data?</div>
  <div class="qa-answer">
    <p>ROC-AUC uses the false-positive rate, whose denominator is all negatives. With 1% positives, there are so many easy negatives that even a model producing many false positives keeps a low FPR and a high AUC. Precision, by contrast, is directly hurt by those false positives. So for rare positives I report PR-AUC (whose baseline is the positive rate, not 0.5) plus precision and recall at the operating threshold.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Explain gradient boosting, and why it's the default for tabular data. How does it differ from a random forest?</div>
  <div class="qa-answer">
    <p>Boosting builds shallow trees sequentially; each new tree fits the errors (the gradient of the loss) of the current ensemble, and a learning rate scales its contribution, so the model improves step by step until validation loss stops improving. A random forest instead trains many deep trees independently on bootstrap samples and averages them — it reduces variance, while boosting reduces bias. Boosting wins on tables because trees need no scaling, capture non-linear interactions, handle missing values and mixed types, and with early stopping they're hard to beat; benchmark studies still find tree ensembles ahead of deep learning on typical tabular datasets. The cost is more hyperparameters and a tendency to overfit without early stopping.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How do you detect and fix overfitting in a boosted model?</div>
  <div class="qa-answer">
    <p>Detect it with a gap between training and validation metrics, or validation loss rising as trees are added. Fix it with early stopping on a proper (time-based) validation set, a lower learning rate with more trees, fewer leaves or a smaller max depth, larger minimum samples per leaf, row and column subsampling, L2 on leaf weights, and removing noisy or leaky features. More data helps more than any of these.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How would you deploy this model?</div>
  <div class="qa-answer">
    <p>First ask whether predictions are needed in real time. If a daily or hourly score is enough, a batch job that writes predictions to a table is simplest and most robust. If the score is needed when an event happens, run an online service (for example FastAPI with the pipeline loaded in memory) with a tight timeout and a rules fallback in the caller. Either way: one versioned artifact containing preprocessing + model, metadata (data snapshot, code commit, metrics, threshold), the same feature definitions for training and serving, logging of served features and scores, and a rollout through shadow mode to a canary before full traffic, with one-step rollback.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How do you monitor a model in production?</div>
  <div class="qa-answer">
    <p>Four layers: data quality checks before scoring (schema, nulls, ranges); input drift per key feature with PSI or KS against the training snapshot (PSI above ~0.25 is a common alert line); prediction drift (score distribution, share above threshold); and real performance once labels arrive, which can be delayed by weeks. Plus operational metrics: latency, error rate, fallback rate. Alerts go to an owner; retraining runs on a schedule and on alerts, and a challenger only replaces the champion after winning on the same recent window.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. When would you use classic ML instead of an LLM, and vice versa?</div>
  <div class="qa-answer">
    <p>Classic ML for structured, numeric prediction at volume with labelled history: it's orders of magnitude cheaper and faster per prediction, deterministic, calibratable and explainable with SHAP. An LLM when the input is unstructured text or conversation, labels are scarce, or the task changes often enough that editing a prompt beats retraining. Often both: the LLM turns transcripts or documents into structured features, and a gradient-boosted model makes the prediction; or the LLM labels data that trains a small classifier for high-volume serving.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. (FDE) A customer says: "Your model's predictions have got worse over the last month." How do you investigate?</div>
  <div class="qa-answer">
    <p>Make it concrete first: which metric, which segment, compared with what, and are labels mature for that period? Then check, in order: data pipeline health (nulls, schema or unit changes, a broken join — the most common cause), input drift per feature, whether their business changed (new office, new booking policy, a reorganisation), whether our own intervention changed the outcome distribution, and whether the model version or threshold changed. If it's genuine concept drift, retrain on recent data and compare against the current model on the same window before switching. Report back with the cause, the fix and the monitoring we've added so it's caught earlier next time.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. (FDE) A customer asks: "Can AI predict which meeting-room bookings will be no-shows?" They have three months of data. How do you scope it?</div>
  <div class="qa-answer">
    <p>Clarify the action (reminder vs auto-release) and its error costs; define the label precisely (no check-in within N minutes, excluding cancellations and tablet outages); fix the prediction time; and check data volume — three months may be enough if there are thousands of no-shows, but seasonality won't be covered. Ship a rule or simple heuristic first (organiser's past no-show rate) to deliver value and collect clean labels, then train a GBM with a time-based split and compare it with that baseline. Agree success criteria up front, for example "reduce idle booked-room hours by 15% without more than 2% wrongful releases", and keep a hold-out group to measure the real impact.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. How do you handle class imbalance?</div>
  <div class="qa-answer">
    <p>Start with the right metrics (PR-AUC, precision/recall at the threshold), then class weights or <code>scale_pos_weight</code>, then threshold tuning — usually the biggest lever. Resampling like SMOTE rarely helps tree models much and can distort the data. After reweighting, probabilities are no longer calibrated, so recalibrate if anyone consumes them as probabilities. And collect more positives if you can — sometimes by changing what you log.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You define label, unit and prediction time before talking about algorithms.</li>
    <li>You split by time and hunt leakage proactively.</li>
    <li>You compare against a simple baseline.</li>
    <li>You choose metrics and thresholds from business costs, and know PR-AUC vs ROC-AUC.</li>
    <li>You default to gradient boosting for tabular data and can explain why.</li>
    <li>You treat serving, skew, drift and delayed labels as part of the job.</li>
    <li>You can argue classic ML vs LLM with cost, latency and calibration — and propose hybrids.</li>
  </ul>
</div>
` },

  ]
});
