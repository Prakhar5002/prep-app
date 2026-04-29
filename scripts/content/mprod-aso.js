window.PREP_SITE.registerTopic({
  id: 'mprod-aso',
  module: 'mobile-prod',
  title: 'App Store Optimization',
  estimatedReadTime: '40 min',
  tags: ['aso', 'app-store-optimization', 'app-store-connect', 'play-console', 'keywords', 'screenshots', 'ratings', 'aso-tools', 'mobile-growth'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>ASO (App Store Optimization)</strong> is the practice of making your app discoverable in the App Store and Google Play, and converting browsers who land on your store page into installers. It is to mobile what SEO is to the web — but with a smaller surface, more visual emphasis, and faster feedback loops.</p>
<ul>
  <li><strong>Two halves.</strong> <em>Discovery</em>: get found through search/browse/recommendations. <em>Conversion</em>: turn the store page view into an install.</li>
  <li><strong>Discovery levers:</strong> app name, subtitle, keywords (iOS only — Android indexes the description), category, ratings volume + score, install velocity, country availability.</li>
  <li><strong>Conversion levers:</strong> icon, screenshots, preview video, short description (Android), subtitle (iOS), promotional text (iOS), localized listing.</li>
  <li><strong>Apple Search Ads</strong> for iOS, <strong>Google App Campaigns</strong> for Android — paid ASO. Often cheaper than Facebook/Google Display for installs.</li>
  <li><strong>Default tools:</strong> <strong>App Store Connect</strong> + <strong>Play Console</strong> for first-party data, <strong>AppFollow</strong> / <strong>Sensor Tower</strong> / <strong>data.ai (App Annie)</strong> / <strong>SplitMetrics</strong> for keyword research and competitive analysis.</li>
  <li><strong>A/B testing.</strong> Apple's <em>Product Page Optimization</em> tests 3 variants of icon/screenshots/preview against the original. Google's <em>Store Listing Experiments</em> tests text + visuals.</li>
  <li><strong>Ratings &amp; reviews.</strong> Both stores favor apps with higher ratings; ratings improve install conversion 5–15% per half-star. <em>Prompt smartly</em>; don't ask after a crash.</li>
  <li><strong>Localization is huge.</strong> Translated screenshots + descriptions can lift install rate 50–200% in target markets — single highest-leverage low-effort intervention.</li>
</ul>
<p><strong>Mantra:</strong> "Be findable. Look obvious. Show value in three seconds. Localize everything. Earn the rating prompt."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What is ASO, structurally?</h3>
<p>It's a discipline at the intersection of SEO, conversion-rate optimization, and product marketing — applied to two stores (App Store + Google Play) with their own ranking algorithms, indexing rules, and editorial behaviors.</p>

<table>
  <thead><tr><th>Surface</th><th>App Store (iOS)</th><th>Google Play (Android)</th></tr></thead>
  <tbody>
    <tr><td>App name</td><td>30 char</td><td>30 char</td></tr>
    <tr><td>Subtitle / short description</td><td>30 char (subtitle)</td><td>80 char (short description)</td></tr>
    <tr><td>Keywords field (indexed)</td><td>100 char comma-list (NOT visible to user)</td><td>None — full description indexed instead</td></tr>
    <tr><td>Description</td><td>4000 char (NOT indexed for search)</td><td>4000 char (INDEXED for search)</td></tr>
    <tr><td>Promotional text</td><td>170 char, editable without resubmission</td><td>None equivalent</td></tr>
    <tr><td>Icon</td><td>1024×1024</td><td>512×512 + adaptive icon assets</td></tr>
    <tr><td>Screenshots</td><td>3–10 per device class; 6.7" iPhone, 12.9" iPad mandatory</td><td>2–8 per device class</td></tr>
    <tr><td>Preview video</td><td>3 per device class, &le; 30s, no audio for autoplay</td><td>1 video, hosted on YouTube</td></tr>
    <tr><td>Localizations</td><td>40 languages</td><td>83 languages</td></tr>
  </tbody>
</table>

<h3>Why ASO matters</h3>
<ol>
  <li><strong>The funnel starts here.</strong> If users can't find or aren't convinced, the rest of your product work is moot.</li>
  <li><strong>~65% of iOS installs come from search.</strong> Apple Search Ads + organic ranks together dwarf paid ad networks for many categories.</li>
  <li><strong>~40% of Play installs come from organic browsing</strong> in addition to search; the explore tab is real.</li>
  <li><strong>It compounds.</strong> Higher install velocity → better ranking → more impressions → higher install velocity.</li>
  <li><strong>Lowest CAC channel.</strong> Organic installs cost $0 marginal; paid ASO is typically cheaper than Facebook/Google for similar quality.</li>
</ol>

<h3>The discovery model — Apple App Store</h3>
<p>Apple does not publish their algorithm. Empirically:</p>
<ul>
  <li><strong>App name</strong> contributes most heavily to search ranking. Subtitle next. Keywords field has weight but less than name. Description is not indexed.</li>
  <li><strong>Install volume + velocity</strong> over recent days/weeks (especially after a new release).</li>
  <li><strong>Ratings:</strong> volume + average. Higher counts dampen volatility; new apps with 50+ ratings rank similarly to the same apps with 5,000+ if ratings stay high.</li>
  <li><strong>Engagement after install:</strong> retention, opens, time-in-app — Apple has clearly tied this to category ranks since iOS 13ish.</li>
  <li><strong>Editorial featuring:</strong> "Apps We Love" placements drive massive bursts; relationship with App Store editors is its own art.</li>
</ul>

<h3>The discovery model — Google Play</h3>
<ul>
  <li><strong>Title + short description + full description</strong> all indexed for search; keyword density in description matters more than on iOS.</li>
  <li><strong>Install velocity + retention</strong> — Google explicitly considers retention curves.</li>
  <li><strong>Ratings volume + score</strong> — "perceptible" anchor effect: 4.0 → 4.5 lifts conversion noticeably.</li>
  <li><strong>Crash + ANR rate</strong> — apps over thresholds get demoted in search.</li>
  <li><strong>Update frequency</strong> — stale apps are deprioritized.</li>
  <li><strong>Editorial Play Editors' Choice</strong> drives feature-bursts.</li>
</ul>

<h3>The conversion model</h3>
<p>Same thing on both stores: a user lands on the page; you have ~3 seconds to answer "what is this and why should I install?" Decisions:</p>
<ul>
  <li>Icon — does it look polished? Stand out from category competition?</li>
  <li>Screenshots 1–3 — visible without scroll; carry the story.</li>
  <li>Subtitle / short description — one-line value prop.</li>
  <li>Preview video — autoplays; should hook in 1–2 seconds.</li>
  <li>Reviews / star count — social proof.</li>
  <li>Localized — feels native to the user.</li>
</ul>

<h3>What "good" looks like</h3>
<ul>
  <li>Name + subtitle/short-description carry the most-searched 1–2 keywords.</li>
  <li>iOS keywords field uses 95+ of 100 chars; comma-separated, no spaces, no plurals (Apple stems them).</li>
  <li>Screenshots tell a sequenced story (problem → solution → proof) with text overlays.</li>
  <li>First 3 screenshots show without scroll on iPhone 14/15 Pro.</li>
  <li>Localized in your top 3–5 markets. Translated screenshots, not just text.</li>
  <li>Ratings prompt fires after a positive moment, not on first launch.</li>
  <li>Promotional text (iOS) used to highlight time-sensitive promos without resubmission.</li>
  <li>Quarterly A/B tests on screenshot variants and store listing copy.</li>
  <li>Crash rate &lt; 1% and ANR rate &lt; 0.5% (Google's bad-behavior threshold).</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The two-funnel model</h3>
<pre><code class="language-text">DISCOVERY               CONVERSION                LIFECYCLE
  search rank             page view                 install
  category rank           store page                onboarding
  recommended             screenshots               retention
  featured                video                     monetization
       ↓                       ↓                          ↓
  IMPRESSION  ──→  PAGE VIEW  ──→  INSTALL  ──→  ACTIVE USER
</code></pre>

<h3>Where each lever applies</h3>
<table>
  <thead><tr><th>Lever</th><th>Affects</th></tr></thead>
  <tbody>
    <tr><td>App name</td><td>Discovery (heavily); conversion (moderately)</td></tr>
    <tr><td>Subtitle / short desc</td><td>Discovery (Android more); conversion (both)</td></tr>
    <tr><td>iOS keywords field</td><td>Discovery only</td></tr>
    <tr><td>Description</td><td>Discovery (Android only); conversion (both, secondary)</td></tr>
    <tr><td>Icon</td><td>Conversion + browse impressions</td></tr>
    <tr><td>Screenshots</td><td>Conversion (heavy)</td></tr>
    <tr><td>Preview video</td><td>Conversion (heavy when used)</td></tr>
    <tr><td>Ratings</td><td>Conversion + discovery</td></tr>
    <tr><td>Reviews (recent)</td><td>Conversion (signal of active development)</td></tr>
    <tr><td>Crash / ANR rate</td><td>Discovery (Android demotion)</td></tr>
    <tr><td>Retention</td><td>Discovery (both, especially Play)</td></tr>
    <tr><td>Update freshness</td><td>Discovery (Play); editorial (both)</td></tr>
  </tbody>
</table>

<h3>Keyword research mental model</h3>
<p>You're not picking what <em>you</em> think users search for. You pick keywords with three properties:</p>
<ol>
  <li><strong>Volume</strong> — enough users actually search this.</li>
  <li><strong>Relevance</strong> — your app actually delivers what they're looking for; otherwise you'll rank but not convert.</li>
  <li><strong>Difficulty</strong> — competition you can plausibly outrank.</li>
</ol>
<p>Tools (AppFollow, Sensor Tower, data.ai) score keywords on volume + difficulty. Sweet spot: high relevance, moderate-to-high volume, beatable difficulty.</p>

<h3>iOS keyword field anatomy</h3>
<pre><code class="language-text">Field (100 chars, separated by commas, no spaces):
  fitness,workout,yoga,strength,gym,exercise,abs,cardio,training,bodybuilding,run

Apple does NOT need plurals or word stems:
  ✓ "run" covers "runs", "running"
  ✗ Listing both wastes characters

Apple does NOT need words from your app name:
  If name is "FitLife: Workout Tracker", DO NOT put "fitlife" or "workout" in keywords.

DO NOT include competitor names:
  Apple may reject your build for trademark issues.

DO NOT include category words like "free" or "best":
  Apple discourages and may reject.
</code></pre>

<h3>Conversion psychology of screenshots</h3>
<p>Empirically (every team's A/B tests confirm):</p>
<ul>
  <li><strong>First screenshot</strong> bears 80% of the conversion lift weight.</li>
  <li><strong>Text overlay</strong> outperforms pure phone-mockups by 20–50%; users skim.</li>
  <li><strong>Show outcomes, not features.</strong> "Save 10 hours a week" beats "Drag-and-drop kanban."</li>
  <li><strong>Sequence the story</strong>: hook → problem → solution → proof → CTA.</li>
  <li><strong>Tall is better</strong>: portrait screenshots stack visually, easier to skim on a vertical scroll.</li>
  <li><strong>People in screenshots</strong> generally outperform pure UI mockups in lifestyle apps; avoid in B2B/utility.</li>
</ul>

<h3>Localization rules of thumb</h3>
<ul>
  <li>Test the top 5 markets first (US, JP, KR, DE, BR are common).</li>
  <li>Translate screenshots' text overlays, not just description.</li>
  <li>Hire a native speaker; machine translation fools nobody.</li>
  <li>Localize app name where word-of-mouth value matters; many apps keep brand name + localized subtitle.</li>
  <li>Asian markets often need very different visual style (denser, more colorful).</li>
</ul>

<h3>Ratings prompt strategy</h3>
<p>iOS limits app-initiated rating prompts to 3 per year per user via <code>SKStoreReviewController</code>. Spend them wisely:</p>
<ol>
  <li>Trigger after a <strong>positive moment</strong> — task completed, milestone reached, level beaten.</li>
  <li><strong>Don't ask after errors or crashes.</strong> Ever.</li>
  <li><strong>Don't ask on first launch.</strong> User has nothing to rate.</li>
  <li>Pre-prompt with a custom dialog: "Are you enjoying MyApp?" → if Yes, fire the OS rating prompt; if No, route them to a feedback form to quietly catch detractors.</li>
  <li>Track which prompts produce ratings; iterate timing.</li>
</ol>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Setting up store metadata — App Store Connect</h3>
<p><strong>App Information</strong> (versioned per release):</p>
<ul>
  <li>Name (30 char)</li>
  <li>Subtitle (30 char)</li>
  <li>Description (4000 char) — not indexed but visible</li>
  <li>Keywords (100 char) — comma-separated, hidden from users</li>
  <li>Promotional text (170 char) — editable without app submission</li>
  <li>Marketing URL, Support URL, Privacy Policy URL</li>
  <li>Category (primary + secondary)</li>
  <li>App Store Icon (1024×1024 RGB JPG/PNG, no alpha)</li>
  <li>App Previews (videos, 1–3 per device size class, 15–30s, no audio in first 3s for autoplay)</li>
  <li>Screenshots (3–10 per device size class)</li>
  <li>Localizations (40 languages)</li>
</ul>

<h3>Setting up store metadata — Play Console</h3>
<ul>
  <li>App Name (30 char)</li>
  <li>Short Description (80 char) — indexed</li>
  <li>Full Description (4000 char) — indexed</li>
  <li>Hi-res Icon (512×512)</li>
  <li>Adaptive Icon (foreground + background SVG/PNG)</li>
  <li>Feature Graphic (1024×500)</li>
  <li>Screenshots (2–8 per form factor: phone, 7" tab, 10" tab, Wear, TV)</li>
  <li>Promo Video (1, hosted on YouTube)</li>
  <li>Categorization (Category + Tags)</li>
  <li>Contact Details + Privacy Policy URL</li>
  <li>Translations (83 languages)</li>
</ul>

<h3>Keyword research workflow</h3>
<pre><code class="language-text">1. Brainstorm: what would a user type to find your app?
2. Expand: use AppFollow / Sensor Tower's keyword suggestions.
3. Score each: volume × relevance ÷ difficulty.
4. Map to fields:
     - Top 1–2 keywords → app name
     - Next 1 → subtitle / short description
     - Next ~10 → iOS keywords field (100 chars)
     - All long-tail → Android description body (with natural prose)
5. Track ranking weekly with the same tools.
6. Iterate quarterly.
</code></pre>

<h3>Apple Product Page Optimization (PPO)</h3>
<p>Apple's built-in A/B testing for store assets. You can run up to 3 treatments + 1 control:</p>
<ol>
  <li>Create a "Product Page" in App Store Connect.</li>
  <li>Configure variant assets: icon (with caveat — see below), screenshots, app preview videos.</li>
  <li>Set traffic split (e.g., 25/25/25/25).</li>
  <li>Launch.</li>
  <li>App Store Connect reports impressions and conversion rate per variant.</li>
  <li>Pick the winner; promote it to live.</li>
</ol>
<p><strong>Icon caveat:</strong> alternate icons in PPO must already be embedded in the binary as alternate icons. You can't ship arbitrary new icons just for the test.</p>

<h3>Custom Product Pages (CPP)</h3>
<p>Different from PPO. Lets you create up to 35 variants of your store page targeted at specific traffic sources (e.g., a Facebook ad URL routes to a CPP whose screenshots match the ad creative). No A/B; you allocate a CPP to each campaign URL. Boosts conversion on paid traffic significantly.</p>

<h3>Google Play Store Listing Experiments</h3>
<ol>
  <li>Play Console → Store Listing → Experiments.</li>
  <li>Create text experiment (title, short desc, description) OR graphic experiment (icon, screenshots, feature graphic).</li>
  <li>Pick languages, set traffic split.</li>
  <li>Run for 7+ days; Play computes statistical confidence.</li>
  <li>Apply winner.</li>
</ol>

<h3>Ratings prompt — iOS</h3>
<pre><code class="language-tsx">import { Platform } from 'react-native';
import * as StoreReview from 'expo-store-review';

async function maybePrompt() {
  if (await StoreReview.hasAction()) {
    StoreReview.requestReview();
  }
}

// Smart timing
function onTaskCompleted() {
  const success = positiveSession();
  const lastPrompt = await storage.get('lastRatingPrompt');
  const daysSince = lastPrompt ? (Date.now() - lastPrompt) / 86_400_000 : Infinity;

  if (success &amp;&amp; daysSince &gt; 90 &amp;&amp; userHasUsedAtLeast(5)) {
    showSoftPrompt();   // "Are you enjoying MyApp?" → if yes → maybePrompt()
    storage.set('lastRatingPrompt', Date.now());
  }
}
</code></pre>

<h3>Ratings prompt — Android (In-App Review API)</h3>
<pre><code class="language-tsx">import InAppReview from 'react-native-in-app-review';

if (InAppReview.isAvailable()) {
  await InAppReview.RequestInAppReview();
}
</code></pre>
<p>Both platforms throttle internally; you can't force-display.</p>

<h3>Apple Search Ads — basic setup</h3>
<ol>
  <li>App Store Connect → Apple Search Ads.</li>
  <li>Create a campaign: pick the country, set daily budget, max CPT.</li>
  <li>Pick keywords (or use Search Match — Apple picks for you initially).</li>
  <li>Targeting: device type, age, gender, customer type (new vs returning).</li>
  <li>Optional: Creative Sets — different screenshots per ad group.</li>
  <li>Track via App Analytics; calculate cost per install (CPI) and tap-through rate (TTR).</li>
</ol>
<p>Best practice: start with broad match + Search Match, harvest converting terms, build exact-match campaigns on those.</p>

<h3>Reviews — handling the ones you get</h3>
<ul>
  <li>Reply to every 1-star within 48 hours.</li>
  <li>Public reply visible to all readers — sets the tone for future visitors.</li>
  <li>Acknowledge → identify → fix in next release → return and update reply.</li>
  <li>Avoid defensive language; even "we hear you, we're shipping a fix in 2.4.1" reads professionally.</li>
</ul>

<h3>Editorial outreach</h3>
<p>Apple's "Apps We Love" team accepts pitches via the <a href="https://developer.apple.com/contact/app-store/" target="_blank">Featured by App Store</a> form. Pitch when:</p>
<ul>
  <li>You have a major launch / redesign with a clear story.</li>
  <li>Your app has visual distinctiveness.</li>
  <li>You can give Apple a 4-week notice to coincide with their editorial calendar.</li>
</ul>
<p>Google Play has analogous pitch path via your Play Console contact.</p>

<h3>Retention &amp; crash hygiene affecting ASO</h3>
<p>Crashes &gt; 1.09% perceptible (Google) → demotion. ANR &gt; 0.47% perceptible → demotion. Both stores weight retention; D7 retention bumps category ranking. <strong>Fix retention bugs and crashes before chasing keyword tweaks.</strong></p>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Optimizing the iOS keyword field</h3>
<pre><code class="language-text">App name (30): "Habitly: Daily Habit Tracker"
Subtitle (30): "Build streaks, log routines"
Keywords (100): journal,routine,reminder,morning,fitness,planner,checklist,goals,water,sleep,focus,gym

Reasoning:
  - "habit" already in name; don't repeat in keywords.
  - "tracker" in name; don't repeat.
  - Long-tail competitors (planner, journal, routine) — moderate volume, high relevance.
  - Domain-specific (water, sleep, gym, focus) — match user search intent.
  - Total: 95 chars used; 5 spare for next iteration.
</code></pre>

<h3>Example 2: Screenshot story arc</h3>
<pre><code class="language-text">Screenshot 1 (HOOK): "Build streaks that stick"
                     Visual: streak counter with glow effect
Screenshot 2 (PROBLEM): "Most habits fail in week 1"
                     Visual: chart of typical drop-off
Screenshot 3 (SOLUTION): "Start small. Win every day."
                     Visual: simple checkbox UI
Screenshot 4 (PROOF): "Over 5,000,000 streaks tracked"
                     Visual: world map with dots
Screenshot 5 (FEATURES): "Reminders. Stats. Insights."
                     Visual: 3-up screen mockups
Screenshot 6 (CTA): "Your best year starts here"
                     Visual: full-screen "Get Started"
</code></pre>

<h3>Example 3: Localization ROI snapshot</h3>
<pre><code class="language-text">Pre-localization (English-only):
  - Japan installs / month: 150
  - Conversion rate: 1.8%
  - Cost per install (paid): $4.30

After Japanese localization:
  - Translated: name, subtitle, description, all 6 screenshots, preview video text
  - Japan installs / month: 1,400  (9.3×)
  - Conversion rate: 5.4%
  - Cost per install (paid): $1.90  (-56%)

Cost: ~$1,200 one-time professional translation
Payback: under a month at the new install volume
</code></pre>

<h3>Example 4: A/B test on icon</h3>
<pre><code class="language-text">Hypothesis: "A flatter icon with bolder color converts higher than the gradient."
Setup: Apple PPO with 4 variants
  Control (gradient blue) — 25%
  Treatment A (flat blue) — 25%
  Treatment B (flat orange) — 25%
  Treatment C (flat green) — 25%

After 14 days, n = 60,000 impressions per variant:
  Control:    2.3% conversion
  Flat blue:  2.5% (+8%, p = 0.03)
  Flat orange: 2.7% (+15%, p = 0.001)  ← winner
  Flat green: 2.1% (-9%, p = 0.04)

Caveat: orange may attract a different user segment.
Validate retention by variant before fully promoting:
  Orange installs D7 retention: 31% (vs control 36%) → orange attracts curious-but-low-fit users.
  Decision: ship Flat blue (slight conversion lift, retention preserved) instead of Flat orange.
</code></pre>

<h3>Example 5: Smart ratings prompt</h3>
<pre><code class="language-tsx">function CompletedTaskScreen() {
  useEffect(() =&gt; {
    if (shouldAskForRating()) showRatingFlow();
  }, []);
}

function shouldAskForRating(): boolean {
  if (user.daysSinceInstall &lt; 7) return false;
  if (user.taskCompletions &lt; 3) return false;
  if (await storage.get('hasRatedRecently')) return false;
  if (await sessionFeedback.lastWasNegative()) return false;
  return true;
}

async function showRatingFlow() {
  const enjoying = await Alert.confirm({
    title: "Enjoying MyApp?",
    confirmText: "Yes!",
    cancelText: "Not really",
  });

  if (enjoying) {
    StoreReview.requestReview();   // OS rating prompt
    storage.set('hasRatedRecently', { ts: Date.now() });
  } else {
    nav.navigate('FeedbackForm');   // catch detractors privately
  }
}
</code></pre>

<h3>Example 6: Apple Search Ads Search Match harvest</h3>
<pre><code class="language-text">Week 1: Run a Search Match campaign at $1.50 max CPT.
        Apple matches your app to relevant queries automatically.

Week 2: Pull report.
        Top converting search terms:
          "habit tracker"  - 7 installs at $1.20 CPI
          "morning routine" - 4 installs at $1.40 CPI
          "streak app"     - 3 installs at $1.80 CPI

Week 3: Create a new "Exact Match Branded Terms" campaign.
        Add the high-converting terms as Exact match.
        Increase max CPT to outbid competitors.

Week 4: Reduce broad-match budget; broad campaign now exists only to discover new converting terms.
</code></pre>

<h3>Example 7: A description optimized for Google Play</h3>
<pre><code class="language-text">Short description (80):
  Build daily habits that stick. Track streaks, set reminders, achieve goals.

Description first paragraph (Google Play indexes this most):
  Habitly is the simple, beautiful habit tracker that helps you build morning
  routines, exercise consistently, drink more water, sleep better, and focus
  on what matters. Whether you want to start meditating, work out daily, or
  finally read more — Habitly turns big goals into a daily checklist that
  feels effortless.

Reasoning:
  - "habit tracker" — primary keyword
  - "morning routine", "exercise", "water", "sleep", "meditate", "workout", "read" — long-tail user-search terms
  - "checklist" — alternative search vocabulary
  - Natural prose; not stuffed; reads like a human paragraph
</code></pre>

<h3>Example 8: Product Page Optimization for paid traffic</h3>
<pre><code class="language-text">Marketing campaign: TikTok ads with "morning routine" creative
Custom Product Page (CPP) created:
  Same app icon and name
  Replaced first 3 screenshots with morning-routine-themed visuals matching the ad
  Custom subtitle: "Wake up. Win the day."

CPP URL given to TikTok ad system as the click destination.

Result: install conversion from TikTok traffic 1.4% → 3.1% (2.2×).
Default page conversion unchanged (organic traffic still sees default).
</code></pre>

<h3>Example 9: Reviews crisis recovery</h3>
<pre><code class="language-text">Day 0: ship 2.3.0 with a critical regression — sync occasionally drops data.
Day 0–3: 1-star reviews accumulate; rating drops 4.6 → 4.1.
Day 4: ship 2.3.1 with the fix.

Recovery actions:
  - Reply to every 1-star review explaining the fix is in 2.3.1.
  - Use Promotional Text (iOS) to highlight: "v2.3.1: critical sync fix shipped — thank you for your patience."
  - Trigger smart in-app rating flow (with Are-you-enjoying gate) for users on 2.3.1+.
  - Track rating trend daily; expect ~30 days to fully recover.
</code></pre>

<h3>Example 10: Quarterly ASO health review</h3>
<pre><code class="language-text">Metrics to review every quarter:
  - Top 10 keyword rankings (movement)
  - Page view → install conversion (overall and per traffic source)
  - Country-level install share (where to localize next)
  - Star rating + review velocity
  - Crash + ANR rates
  - Featured / editorial placements
  - Competitor visual + copy changes (screenshot competitive analysis)

Output: 1 page summary + 3 prioritized action items for next quarter.
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Apple keyword indexing nuances</h3>
<ul>
  <li>Apple stems plurals automatically — listing "run" covers "running"; listing both wastes characters.</li>
  <li>Apple removes common stopwords ("the", "and", "for") — don't waste them.</li>
  <li>Spaces between commas in iOS keywords field — may waste a character; use commas only.</li>
  <li>iOS 13+: Apple removes duplicate words across name, subtitle, and keywords field — listing the same word in multiple places does not stack ranking weight.</li>
  <li>Numbers count: "100 things" indexes "100" as a keyword.</li>
</ul>

<h3>Trademark issues</h3>
<p>Putting competitor or trademark names in your keywords or description can result in <strong>app rejection</strong>. Both stores enforce. Even if you slip through, the trademark holder can file a complaint and your listing gets pulled.</p>

<h3>Promotional text gotcha</h3>
<p>iOS Promotional text is editable without resubmission, BUT changing it doesn't trigger app review caching to reset. Sometimes the new text takes 24h to propagate.</p>

<h3>Screenshot sizing</h3>
<table>
  <thead><tr><th>iPhone</th><th>Required size</th></tr></thead>
  <tbody>
    <tr><td>6.7" (Pro Max)</td><td>1290 × 2796 (iPhone 14/15 Pro Max)</td></tr>
    <tr><td>6.5" (older Plus / Max)</td><td>1242 × 2688 or 1284 × 2778</td></tr>
    <tr><td>5.5"</td><td>1242 × 2208 — DEPRECATED but still required for older devices</td></tr>
    <tr><td>iPad 12.9"</td><td>2048 × 2732</td></tr>
  </tbody>
</table>
<p>Apple uses 6.7" as the default for most users; ship that one and you're 90% there. App Store may "auto-fill" smaller sizes by downscaling (App Store Connect &gt;= mid-2023).</p>

<h3>Preview video constraints</h3>
<ul>
  <li>iOS: max 30s, &le; 500MB; first 3s should be visually engaging without sound (autoplay is muted).</li>
  <li>iOS: cannot show real-world objects, only the app interface.</li>
  <li>iOS: no real device chrome / status bars in the actual recording.</li>
  <li>Google Play: 30s–2 min, hosted on YouTube; can include marketing footage.</li>
</ul>

<h3>iOS App Privacy details</h3>
<p>App Store Connect requires you to declare every category of data you collect (Identifiers, Diagnostics, Usage, etc.). Failing to update when you add a new SDK results in rejection on next submission. Audit quarterly.</p>

<h3>Country availability</h3>
<p>Apple defaults new apps to all 175 territories. You can disable in App Store Connect. Some regions block specific content (gambling, dating, regulated speech). Check before launching to avoid Apple-side rejections that look like "your app is not appropriate for X region."</p>

<h3>Age rating</h3>
<ul>
  <li>iOS uses Apple's age rating questionnaire (4+, 9+, 12+, 17+).</li>
  <li>Google uses IARC; you fill out a form, get region-specific ratings.</li>
  <li>Misleading rating (e.g., adult content marked 4+) → rejection or removal.</li>
</ul>

<h3>Editorial bans &amp; manual reviews</h3>
<p>Both stores have human reviewers. Common rejection reasons:</p>
<ul>
  <li>Misleading screenshots (showing features the app doesn't have).</li>
  <li>Excessive permissions without justification (camera, location).</li>
  <li>Spam / clone of another app.</li>
  <li>Privacy policy missing or inaccessible.</li>
  <li>App crashes during review.</li>
</ul>

<h3>Localization fallback</h3>
<p>Without localized assets, both stores fall back to English (or your primary language). For markets where users don't read English, this halves your conversion vs a localized listing.</p>

<h3>Update freshness signal</h3>
<p>Both stores deprioritize stale apps. Apple: less stark; Play: explicit. Even minor updates (bug fixes, dependency bumps) signal active development. Don't go &gt; 90 days without a release.</p>

<h3>Featuring is not transferable</h3>
<p>"We were featured on App Store" two years ago doesn't translate to current ranking. Editorial bursts are short-lived; sustained ranking depends on ongoing install velocity + retention.</p>

<h3>iOS Apple Privacy Nutrition Label changes</h3>
<p>Apple periodically changes what categories exist or how they're disclosed. New SDKs (Sentry, analytics tools) can shift your label. Audit privacy declarations after every dependency update.</p>

<h3>App Store Connect rate limits</h3>
<p>Apple rate-limits how often you can edit certain metadata fields. After ~3 changes per day, you may need to wait. Plan ASO experiments accordingly.</p>

<h3>Algorithm shifts</h3>
<p>Apple and Google occasionally re-tune ranking. Known recent shifts: Apple boosted retention weight in 2022; Google increased ANR penalty in 2021. Track ranking weekly; if a 30%+ drop appears suddenly, it's likely an algorithm change.</p>

<h3>Negative SEO via competitor reviews</h3>
<p>Some competitors hire fake reviewers to leave 1-star reviews on rivals. Both stores have reporting tools — file abuse reports with patterns of suspicious reviews. Apple takes 1–3 weeks to act.</p>

<h3>App removal &amp; appeal process</h3>
<p>If your app is removed for a policy violation, both stores have an appeal process via developer support. Average resolution: 1–4 weeks. Best prevention: read store guidelines before submitting.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: Keyword stuffing</h3>
<pre><code class="language-text">// BAD
description: "Best habit tracker, best routine, best planner, best journal, best fitness, best app..."

// Apple/Google's algorithm penalize repetition; humans bounce.
</code></pre>

<h3>Bug 2: Promo text used for time-insensitive content</h3>
<p>Promo text is a great place for "v2.4 launches Friday" or "spring sale 50% off." Wasting it on permanent value props is a missed lever.</p>

<h3>Bug 3: First screenshot generic</h3>
<pre><code class="language-text">// BAD — first screenshot is just a phone with the app's home screen
// User has 1 second to grasp what the app does. Generic UI doesn't communicate.

// GOOD — first screenshot has a tall text overlay: "Build streaks that stick"
// + the relevant UI element + visual flair
</code></pre>

<h3>Bug 4: Untranslated screenshots in major markets</h3>
<p>Description and metadata localized to Japanese; screenshots still in English. Conversion in Japan is half of what localized screenshots would deliver. Translate screenshots, not just text.</p>

<h3>Bug 5: Ratings prompt on first launch</h3>
<pre><code class="language-tsx">// BAD — user has nothing to rate; they decline; you've burned an iOS prompt slot
useEffect(() =&gt; { StoreReview.requestReview(); }, []);

// GOOD — fire after a positive moment
</code></pre>

<h3>Bug 6: Asking for rating after a crash</h3>
<p>User gets a crash dialog, dismisses, app shows "Rate us!" — the response is predictable. Always check session-quality signals before prompting.</p>

<h3>Bug 7: Hidden subtitle</h3>
<p>Subtitle fits 30 chars; teams often only fill 12 with a tagline. The remaining 18 chars are free real estate for ranking keywords. Fill them.</p>

<h3>Bug 8: Same screenshots for iPhone and iPad</h3>
<p>Lazy submission: just upscaling iPhone screenshots to iPad. Looks broken to iPad users. Either supply iPad-native screenshots OR opt out of iPad support.</p>

<h3>Bug 9: Forgetting to update screenshots after redesign</h3>
<p>You shipped a major UI overhaul. Store screenshots still show the old UI. Users install, see new UI, feel "bait-and-switched," leave 1-stars.</p>

<h3>Bug 10: Privacy policy URL 404</h3>
<p>Both stores require a working privacy policy URL. Bots check this. If your domain is down or the URL changed, your next submission gets rejected.</p>

<h3>Anti-pattern 1: ASO over product</h3>
<p>"We'll fix retention through better ASO." Won't work. ASO drives install volume; if retention is broken, install velocity drops, ranking collapses, and you've wasted budget. Fix retention first; ASO compounds.</p>

<h3>Anti-pattern 2: chasing keyword volume over relevance</h3>
<p>Ranking #1 for "free" gets you installs that don't activate, hurting retention and ranking long-term. Pick keywords your app actually serves.</p>

<h3>Anti-pattern 3: copying competitor screenshots</h3>
<p>"They're #1; let's clone their screenshots." You inherit their assumptions and miss your differentiation. Test your own variants.</p>

<h3>Anti-pattern 4: setting and forgetting</h3>
<p>ASO is iterative. Keywords shift, competitors copy, user search behavior evolves. Quarterly review is the minimum cadence.</p>

<h3>Anti-pattern 5: A/B test fatigue</h3>
<p>Running 5 simultaneous PPO tests so each variant gets too few impressions to power. Run one test at a time with clear hypothesis.</p>

<h3>Anti-pattern 6: ignoring reviews</h3>
<p>Reviews are visible product feedback. They surface real bugs, real UX confusion, real competitive comparisons. Read them weekly; reply publicly.</p>

<h3>Anti-pattern 7: localization without market research</h3>
<p>Translating everything into Japanese without understanding cultural messaging norms results in "translated but feels foreign." Hire a native marketing person, not just a translator.</p>

<h3>Anti-pattern 8: optimizing for installs alone</h3>
<p>The store metric is installs; the business metric is active users / revenue. ASO that brings low-quality installs hurts both. Track downstream metrics by traffic source.</p>

<h3>Anti-pattern 9: cycling through multiple icons quickly</h3>
<p>Icon changes break user habit ("which app is this on my home screen?"). Test changes; commit; don't iterate icons every 2 months.</p>

<h3>Anti-pattern 10: neglecting smaller markets</h3>
<p>You're laser-focused on US/UK. Brazil + Indonesia + Vietnam are growing 30%/year and have lower competition. Top 5 markets ≠ best 5 markets for you.</p>
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
    <tr><td><em>What is ASO?</em></td><td>Optimizing store discovery + page conversion to maximize organic install volume.</td></tr>
    <tr><td><em>What's iOS-vs-Android difference?</em></td><td>iOS has a hidden keywords field; Android indexes the description directly.</td></tr>
    <tr><td><em>How do you research keywords?</em></td><td>AppFollow / Sensor Tower / data.ai for volume + difficulty; pick relevance × volume ÷ difficulty.</td></tr>
    <tr><td><em>What converts on the page?</em></td><td>Icon, first 3 screenshots, video, subtitle, ratings.</td></tr>
    <tr><td><em>What's PPO?</em></td><td>Apple Product Page Optimization — built-in A/B testing for icon/screenshots/video.</td></tr>
    <tr><td><em>What's a CPP?</em></td><td>Custom Product Page on iOS — variants targeted at specific traffic sources.</td></tr>
    <tr><td><em>How do you ask for ratings?</em></td><td>After a positive moment; soft-prompt with "Are you enjoying?" first; route detractors to feedback.</td></tr>
    <tr><td><em>How does localization affect installs?</em></td><td>50–200% lift in target markets; translate screenshots not just text.</td></tr>
    <tr><td><em>What's Apple Search Ads?</em></td><td>Paid keyword bidding within the App Store; cheaper CPI than most networks for many categories.</td></tr>
    <tr><td><em>Why does crash rate affect ASO?</em></td><td>Both stores demote apps over thresholds (Google: 1.09%); also hurts retention which is a ranking signal.</td></tr>
    <tr><td><em>How long should a screenshot test run?</em></td><td>At least 7 days; both stores compute confidence; don't peek.</td></tr>
    <tr><td><em>What are common rejection reasons?</em></td><td>Misleading screenshots, missing privacy policy, excessive permissions, app crashes during review, trademark violations.</td></tr>
  </tbody>
</table>

<h3>Live design prompts</h3>
<ol>
  <li><em>"Design an ASO strategy for a new fitness app."</em>
    <ul>
      <li>Keyword research: identify top-5 high-relevance terms (workout, gym, exercise, fitness, personal trainer).</li>
      <li>Name + subtitle carry primary keywords.</li>
      <li>Screenshots tell value-prop story (problem → solution → proof).</li>
      <li>Localize top 5 markets after launch validation.</li>
      <li>Smart ratings prompts after workout completion (positive moment).</li>
      <li>Apple Search Ads with Search Match → harvest exact-match keywords.</li>
      <li>Quarterly PPO experiments on screenshots and icon.</li>
      <li>Reply to every 1-star review within 48h.</li>
    </ul>
  </li>
  <li><em>"How would you investigate a sudden 30% install drop?"</em>
    <ul>
      <li>Compare keyword rankings week-over-week — algorithm shift?</li>
      <li>Recent app update — did your screenshots / metadata change?</li>
      <li>New strong competitor in your category?</li>
      <li>Crash / ANR rate spike — Google demotion threshold breached?</li>
      <li>Featured placement ended — natural revert?</li>
      <li>Apple/Google App Privacy update flagged your app?</li>
      <li>Negative review spike — fake reviews or real issue?</li>
    </ul>
  </li>
  <li><em>"Optimize the store page for an enterprise B2B app."</em>
    <ul>
      <li>Different audience: decision-makers, not impulse-installers. Higher consideration time.</li>
      <li>Screenshots: feature-heavy, with text overlays explaining business outcomes.</li>
      <li>Description: long-form, lists integrations, security/compliance mentions (SOC 2, GDPR, HIPAA).</li>
      <li>Reviews from named companies (with permission) carry credibility.</li>
      <li>De-emphasize ratings count (B2B apps have fewer raters); emphasize quality of reviews.</li>
      <li>CPP for sales-funnel landing pages with industry-specific framing.</li>
    </ul>
  </li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>App's first screenshot is a generic UI mockup — replace with text-overlay value-prop.</li>
  <li>iOS keywords field has plurals ("runs, running, runner") — Apple stems; remove duplicates.</li>
  <li>Ratings prompt fires on first launch — burns the slot; defer to a positive moment.</li>
  <li>Description in Japanese, screenshots in English — translate visuals; conversion is bottlenecked there.</li>
  <li>App ranks #1 for "free" but D1 retention is 5% — wrong keyword targeting; chasing volume over fit.</li>
  <li>Screenshot still showing 1.0 UI after 3.0 redesign — major bait-and-switch trigger.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Funnel framing</td><td>You separate discovery from conversion explicitly.</td></tr>
    <tr><td>Keyword discipline</td><td>You volunteer "research with volume × relevance ÷ difficulty."</td></tr>
    <tr><td>Localization advocacy</td><td>You name it as the highest-leverage low-effort lever.</td></tr>
    <tr><td>A/B testing rigor</td><td>You name PPO/CPP and Play Store Listing Experiments.</td></tr>
    <tr><td>Smart ratings</td><td>You prompt after positive moments and gate detractors.</td></tr>
    <tr><td>ASO + product alignment</td><td>You say "fix retention/crash before chasing ASO."</td></tr>
    <tr><td>Quantitative</td><td>You quote effect sizes (e.g., "localization 50–200%, ratings 5-15% per half-star").</td></tr>
  </tbody>
</table>

<h3>Mobile-specific deep questions</h3>
<ul>
  <li><em>"What's the difference between PPO and CPP?"</em> — PPO is A/B testing; CPP is per-traffic-source variants without comparison.</li>
  <li><em>"Why doesn't Apple index the description?"</em> — Apple's design choice — keep search relevance tied to deliberate keyword selection (name, subtitle, keywords field). Helps short-attention users find what they want; less keyword-stuffing.</li>
  <li><em>"How would you measure ASO impact?"</em> — App Store Connect impressions → page views → installs funnel; Play Console acquisition reports; track keyword rank changes; per-keyword install attribution from Apple Search Ads.</li>
  <li><em>"What's the best timing for a major ASO update?"</em> — Coincide with a major app version release (review attention boost); avoid major holidays (review queues slow).</li>
  <li><em>"How do you measure the ROI of localization?"</em> — Pre/post install rate in target country; average revenue per user (sometimes localization attracts higher-value users); paid-traffic CPI drop.</li>
  <li><em>"How does retention feed ASO?"</em> — Both stores use retention as a ranking signal explicitly. D1/D7/D30 retention curves bump category ranks; poor retention triggers demotion.</li>
</ul>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Audit current keyword rankings (top 20) and identify quick wins.</li>
  <li>Review screenshots — does the first one communicate value in 1 second?</li>
  <li>Check localization coverage; identify top 3 markets to translate next.</li>
  <li>Review crash + ANR rates against store thresholds; investigate any breaches.</li>
  <li>Audit ratings prompt timing; ensure it fires after positive events.</li>
  <li>Read the last 100 reviews; build a list of frequent themes for the product team.</li>
  <li>Set up weekly tracking dashboard: keyword ranks, conversion rate, install velocity.</li>
  <li>Schedule a quarterly ASO experiment plan (PPO + Listing Experiments).</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd build a keyword-rank dashboard to track movement weekly and alert on sudden drops."</li>
  <li>"I'd run a localization experiment in the next 3 markets where competitor share is low and our installs are rising."</li>
  <li>"I'd set up Custom Product Pages for each major paid traffic source so creative matches the destination."</li>
  <li>"I'd add a ratings-prompt A/B test on timing (post-task vs post-week) to find the local maxima."</li>
  <li>"I'd build a competitor monitoring alert: when a top-3 competitor changes screenshots, we get notified within 24h."</li>
  <li>"I'd integrate App Store / Play data with our analytics warehouse to attribute installs to traffic sources end-to-end."</li>
</ul>
`
    }
  ]
});
