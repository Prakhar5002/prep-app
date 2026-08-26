window.PREP_SITE.registerTopic({
  id: 'iosn-signing-release',
  module: 'iOS Native (Deep)',
  title: 'Signing & Release',
  estimatedReadTime: '26 min',
  tags: ['ios', 'code-signing', 'certificate', 'provisioning-profile', 'app-id', 'bundle-identifier', 'entitlements', 'capabilities', 'archive', 'ipa', 'dsym', 'symbolication', 'testflight', 'app-store-connect', 'transporter', 'notarytool', 'altool', 'xcodebuild', 'exportoptions', 'eas', 'eas-build', 'eas-credentials', 'keychain', 'wwdr', 'csr', 'udid', 'marketing-version', 'build-number', 'expo'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>iOS code signing is Apple's trust chain: an app cannot launch on a device or reach the App Store unless it is cryptographically signed by a certificate Apple issued to your team, wrapped in a provisioning profile that Apple also issued. There is no sideloading of unsigned code — the OS refuses to run it.</p>
<p>Four pieces interlock, and every signing error is really a mismatch between them:</p>
<ul>
  <li><strong>Certificate</strong> — a public/private keypair proving "this team built it" (Apple Development for debug, Apple Distribution for release). The private key lives in your Keychain.</li>
  <li><strong>App ID</strong> — the registered bundle identifier (e.g. <code>com.workctrl.smartworks</code>) plus the Capabilities/entitlements it is allowed to use.</li>
  <li><strong>Provisioning profile</strong> — the glue: it bundles App ID + certificate(s) + entitlements + (for dev/ad-hoc) a list of device UDIDs, all signed by Apple.</li>
  <li><strong>Entitlements</strong> — the specific permissions the binary claims (push, keychain sharing, associated domains); they must be a subset of what the App ID and profile allow.</li>
</ul>
<p>Shipping is: set scheme to Release → <code>Product &gt; Archive</code> → Organizer → export/upload an <strong>.ipa</strong> → App Store Connect → TestFlight → review. Version (<code>MARKETING_VERSION</code>) is what humans see; build number must strictly increase for every upload.</p>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>A provisioning profile is a signed contract that says "this certificate may install this App ID with these entitlements on these devices." Certificate proves WHO, App ID declares WHAT, profile is Apple's signature saying "yes, this combination is allowed." Every signing error is one of those three disagreeing.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why code signing exists at all</h3>
<p>Apple's model is that only Apple decides what runs on iOS. Unlike Android (where you can <code>adb install</code> any self-signed APK), iOS refuses to launch a binary whose signature does not chain back to a certificate Apple issued. This gives Apple three things: <strong>attribution</strong> (every app traces to a paying developer account), <strong>tamper-evidence</strong> (the signature covers the binary + entitlements, so a modified app fails to launch), and <strong>gatekeeping</strong> (App Store review + revocable certificates). The tradeoff you feel as a developer is that you can never "just run" an app — the machinery below must line up first.</p>

<h3>The trust chain, top to bottom</h3>
<ul>
  <li><strong>Apple Root CA</strong> → signs the <strong>Apple Worldwide Developer Relations (WWDR) intermediate certificate</strong> → signs <strong>your certificate</strong> (Apple Development / Apple Distribution) → your certificate signs <strong>the app binary</strong>.</li>
  <li>At install/launch, iOS walks that chain: is the leaf cert valid, issued by WWDR, not expired, not revoked? Is there a provisioning profile that authorizes this App ID + these entitlements on this device? Only then does it run.</li>
</ul>
<p>This is why a stale WWDR cert in your Keychain, or an expired distribution certificate, breaks signing even though "nothing in your code changed" — a link in the chain went bad.</p>

<h3>Certificates: the WHO</h3>
<p>A certificate is an X.509 public key that Apple signed, paired with a private key that never leaves your machine (it is generated locally when you create the Certificate Signing Request, the <strong>CSR</strong>). Two families matter:</p>
<table>
  <thead><tr><th>Type</th><th>Purpose</th><th>Used for</th></tr></thead>
  <tbody>
    <tr><td><strong>Apple Development</strong></td><td>Run debug builds on registered devices</td><td>Local dev, device testing</td></tr>
    <tr><td><strong>Apple Distribution</strong></td><td>Sign release builds</td><td>App Store, Ad Hoc, Enterprise, TestFlight</td></tr>
  </tbody>
</table>
<p>Older accounts still see the split names "iOS App Development" and "iOS Distribution / App Store and Ad Hoc"; Apple unified them into "Apple Development" and "Apple Distribution." The critical fact: <strong>the certificate is only usable if you also have its private key</strong>. Lose the private key (new laptop, wiped Keychain) and the certificate is dead weight — you must revoke and reissue, or import a <code>.p12</code> backup that contains both cert + key.</p>

<h3>App ID: the WHAT</h3>
<p>An App ID registers a bundle identifier with Apple and declares which Capabilities it may use. Two flavours:</p>
<ul>
  <li><strong>Explicit App ID</strong> — e.g. <code>com.workctrl.smartworks</code>, matches exactly one app. Required for anything using push notifications, in-app purchase, App Groups, associated domains, or iCloud, because those bind to a concrete identifier.</li>
  <li><strong>Wildcard App ID</strong> — e.g. <code>com.workctrl.*</code>, matches many bundle IDs but <strong>cannot</strong> host most capabilities (no push, no App Groups). Fine for simple internal tools.</li>
</ul>

<h3>Provisioning profile: the GLUE</h3>
<p>A <code>.mobileprovision</code> file (a signed plist) is what actually authorizes an install. It bundles: the App ID, one or more certificates that are allowed to sign, the entitlements the app may claim, and — for Development and Ad Hoc — an explicit list of device UDIDs. Apple signs the whole thing, so it is tamper-proof. Profile types:</p>
<table>
  <thead><tr><th>Profile type</th><th>Certificate</th><th>Device list?</th><th>Distribution channel</th></tr></thead>
  <tbody>
    <tr><td><strong>Development</strong></td><td>Apple Development</td><td>Yes (registered UDIDs)</td><td>Xcode run on your devices</td></tr>
    <tr><td><strong>Ad Hoc</strong></td><td>Apple Distribution</td><td>Yes (up to 100/type/year)</td><td>Direct .ipa install, no store</td></tr>
    <tr><td><strong>App Store</strong></td><td>Apple Distribution</td><td>No</td><td>TestFlight + App Store Connect</td></tr>
    <tr><td><strong>Enterprise (In-House)</strong></td><td>Apple Distribution (Enterprise program)</td><td>No</td><td>Internal distribution, any device</td></tr>
  </tbody>
</table>

<h3>Devices &amp; UDIDs</h3>
<p>Every physical device you want to run a Development or Ad Hoc build on must have its <strong>UDID</strong> (Unique Device Identifier) registered in your account and included in the profile. The cap is 100 devices per device type (iPhone, iPad, etc.) per membership year; you can remove devices but the count only resets at renewal. App Store and Enterprise profiles do not embed device lists — that is why a TestFlight build reaches anyone, while an Ad Hoc build only reaches the UDIDs baked into its profile.</p>

<div class="callout note">
  <div class="callout-title">The four pieces as one sentence</div>
  <p>Your <strong>certificate</strong> (private key + Apple's signature) signs the binary; the <strong>App ID</strong> declares the bundle identifier and its allowed capabilities; the <strong>entitlements</strong> claim a subset of those; the <strong>provisioning profile</strong> is Apple's signed statement binding cert + App ID + entitlements + devices together. Break any bond and signing fails.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The trust chain</h3>
<div class="diagram">
<pre>
 Apple Root CA
     │ signs
     ▼
 WWDR Intermediate Certificate   (must be in your Keychain, unexpired)
     │ signs
     ▼
 Your leaf certificate           Apple Development  OR  Apple Distribution
   (public key + Apple signature) ── paired with ──►  PRIVATE KEY (Keychain only)
     │ signs
     ▼
 App binary + embedded.mobileprovision + entitlements
     │
     ▼
 iOS at launch: verify chain → check profile authorizes
                App ID + entitlements + (this UDID) → RUN or REFUSE
</pre>
</div>

<h3>How the four pieces snap together</h3>
<div class="diagram">
<pre>
        ┌─────────────────────────────────────────────┐
        │            PROVISIONING PROFILE             │  (.mobileprovision,
        │              signed by Apple                │   signed plist)
        │                                             │
        │   App ID: com.workctrl.smartworks           │◄── declares WHAT
        │   Certificates: [ Apple Distribution ]      │◄── who may sign
        │   Entitlements: aps-environment=production,  │◄── allowed perms
        │                 keychain-access-groups...   │
        │   Devices: (App Store = none)               │◄── who may install
        │   Expiry: 1 year (dev) / with cert (dist)   │
        └─────────────────────────────────────────────┘
                 ▲               ▲                ▲
                 │               │                │
        Registered App ID   Certificate +    Entitlements file
        + Capabilities      PRIVATE KEY       (App.entitlements)
        (developer portal)  (Keychain .p12)   MUST be subset of App ID caps
</pre>
</div>

<h3>Signing flow at build time</h3>
<div class="diagram">
<pre>
 Xcode / xcodebuild
   │
   ├─ pick CODE_SIGN_IDENTITY  (which cert: "Apple Distribution")
   ├─ pick PROVISIONING_PROFILE_SPECIFIER (which .mobileprovision)
   ├─ read *.entitlements  (must ⊆ profile entitlements)
   │
   ▼
 codesign --sign &lt;cert&gt; --entitlements App.entitlements MyApp.app
   │
   ▼
 embedded.mobileprovision copied into the .app
   │
   ▼
 .app packaged → Payload/ → zipped → MyApp.ipa
</pre>
</div>

<h3>Ship pipeline</h3>
<div class="diagram">
<pre>
 Scheme = Release
   │  Product &gt; Archive
   ▼
 .xcarchive (app + dSYMs)  ──►  Organizer
   │                              │ Distribute App
   │                              ├─ App Store Connect  → upload
   │                              ├─ Ad Hoc / Development → .ipa
   │                              └─ Enterprise         → .ipa
   ▼
 App Store Connect record (bundle ID, version, build#)
   │
   ├─ TestFlight (internal / external testers)
   └─ Submit for App Store review → Release
</pre>
</div>

<h3>Automatic vs Manual signing — the mental split</h3>
<ul>
  <li><strong>Automatic ("Automatically manage signing")</strong> — you pick a Team; Xcode creates/renews certs, App IDs, and Xcode-managed profiles for you behind the scenes. Great solo; opaque and non-reproducible on CI.</li>
  <li><strong>Manual</strong> — you explicitly choose a certificate and a named profile per build configuration. Verbose but deterministic — the only sane choice for CI and shared teams (and what Fastlane match / EAS emulate).</li>
</ul>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"The certificate contains everything needed to sign." No — the certificate is only the WHO. Without a matching provisioning profile that lists that certificate AND authorizes your App ID's entitlements on the target, the OS still refuses the install. People burn hours regenerating certificates when the actual fault is a profile that predates a new capability.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Step 0 — The CSR and your private key</h3>
<p>Everything starts with a Certificate Signing Request. In <strong>Keychain Access &gt; Certificate Assistant &gt; Request a Certificate From a Certificate Authority</strong>, macOS generates an RSA keypair locally: the <strong>private key stays in your login Keychain</strong>, and a <code>.certSigningRequest</code> file carrying the public key is produced. You upload the CSR to the developer portal; Apple signs it and hands back a <code>.cer</code>. Double-clicking the <code>.cer</code> re-unites it with the private key in Keychain. That pairing (cert + private key) is what can be exported as a <code>.p12</code> for backup or CI.</p>
<pre><code class="language-bash"># List signing identities actually usable on this machine (cert + private key present)
security find-identity -p codesigning -v

# Inspect the WWDR / leaf cert chain of a signed .app
codesign -dvvv --entitlements :- MyApp.app</code></pre>

<h3>Step 1 — Register the App ID + Capabilities</h3>
<p>In the Apple Developer portal (Certificates, Identifiers &amp; Profiles &gt; Identifiers), create an explicit App ID matching your bundle identifier, e.g. <code>com.workctrl.smartworks</code>, and tick the Capabilities the app needs (Push Notifications, Associated Domains, App Groups, etc.). Ticking a capability here is what makes the corresponding entitlement legal in a profile.</p>

<h3>Step 2 — Signing &amp; Capabilities tab (Xcode)</h3>
<p>Select the target &gt; <strong>Signing &amp; Capabilities</strong>. This one tab drives most of it:</p>
<ul>
  <li><strong>Team</strong> — the <code>DEVELOPMENT_TEAM</code> (a 10-char ID like <code>A1B2C3D4E5</code>).</li>
  <li><strong>Automatically manage signing</strong> — toggles <code>CODE_SIGN_STYLE</code> between <code>Automatic</code> and <code>Manual</code>.</li>
  <li><strong>+ Capability</strong> — adding, say, "Push Notifications" writes <code>aps-environment</code> into your <code>.entitlements</code> file, enables the capability on the App ID, and (in automatic mode) regenerates the profile to include it. All three move together — that is the key mental link.</li>
</ul>
<pre><code class="language-xml">&lt;!-- SmartWorks.entitlements — the binary's CLAIMED permissions --&gt;
&lt;?xml version="1.0" encoding="UTF-8"?&gt;
&lt;plist version="1.0"&gt;
&lt;dict&gt;
  &lt;key&gt;aps-environment&lt;/key&gt;
  &lt;string&gt;production&lt;/string&gt;
  &lt;key&gt;keychain-access-groups&lt;/key&gt;
  &lt;array&gt;&lt;string&gt;$(AppIdentifierPrefix)com.workctrl.smartworks&lt;/string&gt;&lt;/array&gt;
  &lt;key&gt;com.apple.developer.associated-domains&lt;/key&gt;
  &lt;array&gt;&lt;string&gt;applinks:app.workctrl.tech&lt;/string&gt;&lt;/array&gt;
&lt;/dict&gt;
&lt;/plist&gt;</code></pre>
<p>Rule to memorize: <strong>entitlements ⊆ App ID capabilities ⊆ profile.</strong> Claim an entitlement the App ID does not allow and you get "doesn't match the entitlements."</p>

<h3>Step 3 — The build settings that signing actually reads</h3>
<table>
  <thead><tr><th>Build setting</th><th>Meaning</th></tr></thead>
  <tbody>
    <tr><td><code>DEVELOPMENT_TEAM</code></td><td>Your 10-char Team ID</td></tr>
    <tr><td><code>CODE_SIGN_STYLE</code></td><td><code>Automatic</code> or <code>Manual</code></td></tr>
    <tr><td><code>CODE_SIGN_IDENTITY</code></td><td>Which certificate, e.g. "Apple Distribution"</td></tr>
    <tr><td><code>PROVISIONING_PROFILE_SPECIFIER</code></td><td>Profile name (manual signing) — prefer name over the raw UUID</td></tr>
    <tr><td><code>PRODUCT_BUNDLE_IDENTIFIER</code></td><td>Must equal the App ID</td></tr>
    <tr><td><code>MARKETING_VERSION</code></td><td>Human-facing version, e.g. 3.4.0 (CFBundleShortVersionString)</td></tr>
    <tr><td><code>CURRENT_PROJECT_VERSION</code></td><td>Build number (CFBundleVersion) — must strictly increase</td></tr>
  </tbody>
</table>

<h3>Step 4 — Where profiles live on disk</h3>
<p>Xcode-downloaded profiles sit in <code>~/Library/Developer/Xcode/UserData/Provisioning Profiles/</code> (older Xcode used <code>~/Library/MobileDevice/Provisioning Profiles/</code>). Each is a <code>.mobileprovision</code>. Peek inside:</p>
<pre><code class="language-bash"># Decode a profile to readable plist (it is CMS/PKCS7-signed)
security cms -D -i ~/Library/Developer/Xcode/UserData/Provisioning\\ Profiles/abc.mobileprovision

# Read specific keys
security cms -D -i profile.mobileprovision | plutil -extract Entitlements xml1 -o - -</code></pre>

<h3>Step 5 — Archive</h3>
<p>Set the scheme's Run/Archive configuration to <strong>Release</strong>, choose "Any iOS Device (arm64)" as the destination (you cannot archive against a simulator), then <strong>Product &gt; Archive</strong>. This produces a <code>.xcarchive</code> bundle containing the built <code>.app</code> plus its <strong>dSYM</strong> files, and opens it in the <strong>Organizer</strong> (Window &gt; Organizer).</p>

<h3>Step 6 — Export / distribute from the Organizer</h3>
<p>In the Organizer select the archive &gt; <strong>Distribute App</strong>, then pick a method:</p>
<ul>
  <li><strong>App Store Connect</strong> — upload for TestFlight + App Store (uses an App Store profile).</li>
  <li><strong>Ad Hoc</strong> — produce a signed <code>.ipa</code> for UDID-listed devices.</li>
  <li><strong>Development</strong> — a debug-signed <code>.ipa</code>.</li>
  <li><strong>Enterprise (In-House)</strong> — only for Apple Enterprise accounts, no device list.</li>
</ul>

<h3>Step 7 — Command-line export (CI)</h3>
<pre><code class="language-bash"># 1. Archive
xcodebuild -workspace SmartWorks.xcworkspace -scheme SmartWorks \\
  -configuration Release -destination 'generic/platform=iOS' \\
  -archivePath build/SmartWorks.xcarchive archive

# 2. Export .ipa using an ExportOptions.plist
xcodebuild -exportArchive \\
  -archivePath build/SmartWorks.xcarchive \\
  -exportOptionsPlist ExportOptions.plist \\
  -exportPath build/ipa</code></pre>
<pre><code class="language-xml">&lt;!-- ExportOptions.plist --&gt;
&lt;dict&gt;
  &lt;key&gt;method&lt;/key&gt;&lt;string&gt;app-store&lt;/string&gt;
  &lt;key&gt;teamID&lt;/key&gt;&lt;string&gt;A1B2C3D4E5&lt;/string&gt;
  &lt;key&gt;signingStyle&lt;/key&gt;&lt;string&gt;manual&lt;/string&gt;
  &lt;key&gt;provisioningProfiles&lt;/key&gt;
  &lt;dict&gt;
    &lt;key&gt;com.workctrl.smartworks&lt;/key&gt;
    &lt;string&gt;SmartWorks App Store&lt;/string&gt;
  &lt;/dict&gt;
  &lt;key&gt;uploadSymbols&lt;/key&gt;&lt;true/&gt;
&lt;/dict&gt;</code></pre>
<p>The <code>method</code> values are <code>app-store</code> (newer Xcode: <code>app-store-connect</code>), <code>ad-hoc</code>, <code>development</code>, <code>enterprise</code>.</p>

<h3>Step 8 — Upload the build</h3>
<p>Three routes reach App Store Connect:</p>
<ul>
  <li><strong>Xcode Organizer</strong> &gt; Distribute App &gt; Upload (does validation + upload).</li>
  <li><strong>Transporter.app</strong> — Apple's standalone drag-the-.ipa uploader; handy when the CI machine has no Xcode UI.</li>
  <li><strong>Command line</strong> — <code>xcrun altool</code> (legacy) or the current <code>xcrun notarytool</code> / <code>iTMSTransporter</code>; the App Store Connect API key (Issuer ID + Key ID + <code>.p8</code>) authenticates non-interactively.</li>
</ul>
<pre><code class="language-bash"># Modern upload with an App Store Connect API key
xcrun altool --upload-app -f build/ipa/SmartWorks.ipa -t ios \\
  --apiKey ABC123DEF4 --apiIssuer 12ab34cd-...   # keys in ~/.appstoreconnect/private_keys</code></pre>
<p>(<code>notarytool</code> is primarily for notarizing macOS apps; iOS App Store uploads go through altool / Transporter / Xcode, but the same API-key auth applies.)</p>

<h3>Step 9 — App Store Connect: version vs build number</h3>
<p>In App Store Connect you first create the <strong>app record</strong> bound to the registered bundle ID. Then two numbers govern every upload:</p>
<ul>
  <li><strong>Version</strong> (<code>MARKETING_VERSION</code> / CFBundleShortVersionString) — the marketing string users see, e.g. 3.4.0. Multiple builds can share one version.</li>
  <li><strong>Build number</strong> (<code>CURRENT_PROJECT_VERSION</code> / CFBundleVersion) — must be <strong>strictly greater</strong> than any prior upload for the same version, or App Store Connect rejects it with "The bundle version must be higher than the previously uploaded version."</li>
</ul>

<h3>Step 10 — TestFlight</h3>
<ul>
  <li><strong>Internal testers</strong> — up to 100 people on your team; builds appear almost immediately after processing, no App Review.</li>
  <li><strong>External testers</strong> — up to 10,000 via public link or email; the <em>first</em> build of a version needs a lightweight Beta App Review.</li>
  <li>Builds expire after 90 days. Every TestFlight build must have <strong>export compliance</strong> answered (encryption usage) — set <code>ITSAppUsesNonExemptEncryption</code> in Info.plist to skip the prompt.</li>
</ul>

<h3>Step 11 — dSYMs &amp; symbolication</h3>
<p>A <strong>dSYM</strong> (debug symbol file, one per binary + framework) is the mapping from stripped machine addresses back to file/line/function. Release builds strip symbols for size, so raw crash reports are just hex addresses — <strong>symbolication</strong> is re-applying the dSYM to make them human-readable. Each build has a unique <strong>UUID</strong>; the dSYM's UUID must match the binary's or symbolication fails silently.</p>
<pre><code class="language-bash"># Find a dSYM's UUID (must match the crashing binary)
dwarfdump --uuid MyApp.app.dSYM

# Manually symbolicate a .crash
xcrun atos -o MyApp.app.dSYM/Contents/Resources/DWARF/MyApp -arch arm64 -l 0x100000000 0x0000000100abcdef</code></pre>
<p>Bitcode (now deprecated/removed) used to make Apple recompile your binary, so you had to <strong>download dSYMs from App Store Connect</strong> afterward. For crash tooling, upload dSYMs to your reporter:</p>
<pre><code class="language-bash"># Crashlytics
./Pods/FirebaseCrashlytics/upload-symbols -gsp GoogleService-Info.plist -p ios MyApp.app.dSYM

# Sentry
sentry-cli debug-files upload --include-sources ./MyApp.app.dSYM</code></pre>
<p>This ties directly into the debugging topic: without matching dSYMs, production stack traces are unreadable addresses.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — First-time solo setup (automatic signing)</h3>
<pre><code class="language-text">1. Xcode &gt; Settings &gt; Accounts &gt; add Apple ID (your team).
2. Target &gt; Signing &amp; Capabilities &gt; tick "Automatically manage signing", pick Team.
3. Set PRODUCT_BUNDLE_IDENTIFIER = com.workctrl.smartworks.
4. Plug in an iPhone, trust it, select it as the run destination.
5. Cmd+R — Xcode silently creates a Development cert, registers the device UDID,
   creates an Xcode-managed Development profile, and installs the debug build.</code></pre>

<h3>Example 2 — Manual signing for CI</h3>
<pre><code class="language-text">CODE_SIGN_STYLE                 = Manual
DEVELOPMENT_TEAM                = A1B2C3D4E5
CODE_SIGN_IDENTITY              = Apple Distribution
PROVISIONING_PROFILE_SPECIFIER = SmartWorks App Store
# CI imports a .p12 (cert + private key) into a temporary keychain, and
# installs the matching .mobileprovision before xcodebuild archive.</code></pre>

<h3>Example 3 — Bumping the build number every upload</h3>
<pre><code class="language-bash"># CI auto-increments CFBundleVersion so App Store Connect never rejects a dup
agvtool new-version -all $(($(date +%s)))       # or a monotonically increasing CI build id
# MARKETING_VERSION stays 3.4.0; CFBundleVersion becomes 1699999999</code></pre>

<h3>Example 4 — Adding a capability</h3>
<pre><code class="language-text">Adding "Push Notifications" in Signing &amp; Capabilities does three things at once:
  (a) writes aps-environment into SmartWorks.entitlements,
  (b) enables Push on the com.workctrl.smartworks App ID in the portal,
  (c) regenerates the provisioning profile to include the new entitlement.
Miss (b) or (c) manually and you get: "doesn't match the entitlements".</code></pre>

<h3>Example 5 — Ad Hoc build for a QA device</h3>
<pre><code class="language-text">1. Get the tester's UDID (Finder/Xcode Devices, or apple.co/udid page).
2. Register the UDID in the portal &gt; Devices.
3. Regenerate the Ad Hoc profile so it includes that UDID.
4. Archive &gt; Distribute &gt; Ad Hoc &gt; export SmartWorks.ipa.
5. Tester installs via Apple Configurator / a distribution service.
   (New UDID not in the profile = "device not registered" install failure.)</code></pre>

<h3>Example 6 — ExportOptions.plist for Ad Hoc</h3>
<pre><code class="language-xml">&lt;dict&gt;
  &lt;key&gt;method&lt;/key&gt;&lt;string&gt;ad-hoc&lt;/string&gt;
  &lt;key&gt;teamID&lt;/key&gt;&lt;string&gt;A1B2C3D4E5&lt;/string&gt;
  &lt;key&gt;compileBitcode&lt;/key&gt;&lt;false/&gt;
  &lt;key&gt;stripSwiftSymbols&lt;/key&gt;&lt;true/&gt;
&lt;/dict&gt;</code></pre>

<h3>Example 7 — Inspecting what a profile actually authorizes</h3>
<pre><code class="language-bash">security cms -D -i SmartWorks_App_Store.mobileprovision &gt; profile.plist
plutil -p profile.plist | grep -E "AppIDName|application-identifier|aps-environment|ExpirationDate"
# Confirms App ID, entitlements, and expiry before you waste an archive on it</code></pre>

<h3>Example 8 — Backing up a certificate as .p12</h3>
<pre><code class="language-text">Keychain Access &gt; My Certificates &gt; select "Apple Distribution: WorkCtrl"
&gt; right-click &gt; Export &gt; save dist.p12 with a passphrase.
This bundles the CERT + PRIVATE KEY. Store it in a vault; without it, a new
Mac cannot sign release builds and you must revoke + reissue.</code></pre>

<h3>Example 9 — Symbolicating a production crash</h3>
<pre><code class="language-bash">dwarfdump --uuid MyApp.app.dSYM
# 8C6...  matches the crash report's binary UUID? then:
xcrun atos -o MyApp.app.dSYM/Contents/Resources/DWARF/MyApp -arch arm64 \\
  -l 0x102b40000 0x0000000102b6a1f4
# → -[BookingViewController cancelMeeting:] (BookingViewController.m:212)</code></pre>

<h3>Example 10 — Expo managed app (EAS Build), no Xcode signing by hand</h3>
<pre><code class="language-json">// app.json
{ "expo": {
  "ios": {
    "bundleIdentifier": "com.workctrl.smartworks",
    "buildNumber": "42"
  }
}}</code></pre>
<pre><code class="language-bash"># EAS provisions/reuses certs + profiles in the cloud, builds a signed .ipa
eas build -p ios --profile production
eas credentials            # inspect / rotate the managed cert + profile
eas submit -p ios --latest # uploads the .ipa to App Store Connect</code></pre>

<h3>Example 11 — Common CI keychain dance</h3>
<pre><code class="language-bash">security create-keychain -p "" build.keychain
security import dist.p12 -k build.keychain -P "$P12_PASSWORD" -T /usr/bin/codesign
security set-key-partition-list -S apple-tool:,apple: -k "" build.keychain
security list-keychains -s build.keychain
cp SmartWorks_App_Store.mobileprovision \\
   ~/Library/MobileDevice/Provisioning\\ Profiles/</code></pre>

<h3>Example 12 — Skipping the TestFlight encryption prompt</h3>
<pre><code class="language-xml">&lt;!-- Info.plist: declare non-exempt encryption up front --&gt;
&lt;key&gt;ITSAppUsesNonExemptEncryption&lt;/key&gt;
&lt;false/&gt;
&lt;!-- Otherwise every TestFlight build stalls on an export-compliance question --&gt;</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Expired WWDR intermediate</h3>
<p>Apple rotated the WWDR cert (the G4/G5 intermediates); an old one in your Keychain makes every signed build "untrusted" even though your leaf cert is fine. Fix: download and install the current Apple WWDR certificate, delete the expired one.</p>

<h3>2. Certificate expired but app still live</h3>
<p>Distribution certs last 1 year. An already-shipped App Store build keeps running (Apple re-signs at the store), but you cannot upload a new build until you reissue the certificate and regenerate the App Store profile.</p>

<h3>3. Lost private key on a new Mac</h3>
<p>The certificate downloaded from the portal is public-key only — useless without its private key. If you never exported the <code>.p12</code>, you must revoke the certificate and create a fresh CSR. Revoking a Development cert is harmless; revoking a Distribution cert can break other CI machines using it.</p>

<h3>4. Build number not incremented</h3>
<p>Re-uploading the same CFBundleVersion for a version is rejected: "bundle version must be higher." The marketing version can repeat; the build number cannot. Automate the bump.</p>

<h3>5. Wildcard App ID + push</h3>
<p>You cannot enable Push Notifications, App Groups, iCloud, or associated domains on a wildcard App ID. Switch to an explicit App ID and regenerate the profile.</p>

<h3>6. Entitlements superset of the profile</h3>
<p>If your <code>.entitlements</code> claims a capability the profile does not grant, codesign fails with "doesn't match the entitlements in your provisioning profile." The entitlements file must be a subset. Adding the capability in the portal + regenerating the profile fixes it.</p>

<h3>7. aps-environment: development vs production</h3>
<p>Push entitlement is <code>development</code> in dev profiles, <code>production</code> in App Store/Ad Hoc. A Development-signed build can only hit the sandbox APNs; a store build hits production APNs. Mixing tokens across environments silently fails to deliver.</p>

<h3>8. Device UDID cap reached</h3>
<p>100 devices per type per year. Removing a device frees a slot only for display; the annual count resets at membership renewal. Plan Ad Hoc distribution around this — or use TestFlight, which has no device list.</p>

<h3>9. Simulator vs device signing</h3>
<p>Simulator builds run x86_64/arm64 and are NOT code-signed (the simulator is not a real device). You cannot archive against a simulator destination — archives require "Any iOS Device (arm64)".</p>

<h3>10. Automatic signing on CI is flaky</h3>
<p>Automatic signing needs to talk to Apple and mutate the portal at build time — non-deterministic and prone to race conditions on shared runners. Use manual signing with pre-installed certs + profiles (Fastlane match, EAS, or a manual keychain import).</p>

<h3>11. Managed vs manual profile name drift</h3>
<p>Xcode-managed profiles are named like "iOS Team Provisioning Profile: *". If you hardcode <code>PROVISIONING_PROFILE_SPECIFIER</code> to that in manual mode, it breaks when Xcode regenerates it. Use your own named profiles for manual signing.</p>

<h3>12. dSYM UUID mismatch</h3>
<p>If the dSYM you upload does not match the exact build's binary UUID, crash reports stay un-symbolicated. Common when rebuilding without archiving the matching dSYM. Always keep the archive's dSYMs; verify with <code>dwarfdump --uuid</code>.</p>

<h3>13. Missing dSYMs for third-party frameworks</h3>
<p>Some prebuilt <code>.xcframework</code>s ship without dSYMs, so their frames stay opaque in crashes. Nothing you can do but ask the vendor; your own code still symbolicates.</p>

<h3>14. Bitcode aftermath</h3>
<p>Bitcode is deprecated and removed in current Xcode, but legacy projects may still toggle it. When enabled, App Store recompiled your binary, so the local dSYM did NOT match the shipped binary — you had to download dSYMs from App Store Connect. Disable bitcode to keep local dSYMs valid.</p>

<h3>15. Two-factor / App Store Connect API keys</h3>
<p>Apple IDs require 2FA, which breaks headless CI logins. Use an App Store Connect API key (Issuer ID + Key ID + <code>.p8</code>) for uploads and <code>eas submit</code> / Fastlane instead of username+password.</p>

<h3>16. Enterprise cert revocation</h3>
<p>Enterprise (In-House) builds install on any device with no UDID list, but Apple can revoke the enterprise certificate, instantly killing every installed copy. Never use Enterprise distribution for public apps — it violates the program terms.</p>

<h3>17. Provisioning profile expiry vs cert expiry</h3>
<p>Development profiles expire in 1 year; App Store profiles are tied to the distribution certificate's life. When the cert dies, the profile is invalid even if its own date looks fine. Regenerate both together.</p>

<h3>18. Team ID vs App ID Prefix</h3>
<p><code>$(AppIdentifierPrefix)</code> in keychain-access-groups usually equals your Team ID, but for migrated App IDs it can differ. Hardcoding the wrong prefix breaks Keychain sharing between your app and its extensions.</p>

<h3>19. App extensions need their own App ID + profile</h3>
<p>A notification service extension, share extension, or widget is a separate bundle ID (e.g. <code>com.workctrl.smartworks.widget</code>) needing its own App ID, entitlements, and profile. Forgetting the extension's signing breaks the whole archive.</p>

<h3>20. Clock skew / revoked cert false positives</h3>
<p>A device with a badly wrong clock, or a Mac that cannot reach Apple's OCSP servers, can report a valid cert as revoked/untrusted. Check date/time and network before assuming the certificate is actually bad.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — regenerating certs to fix a profile problem</h3>
<p>"Signing broke, let me revoke my certificate." Usually the fault is a stale profile that predates a capability. Revoking a shared Distribution cert breaks every teammate/CI machine. Diagnose the profile first.</p>

<h3>Anti-pattern 2 — automatic signing on shared CI</h3>
<p>Automatic signing mutates the portal at build time and is non-reproducible across runners. Use manual signing with vaulted <code>.p12</code> + pinned profiles (Fastlane match / EAS).</p>

<h3>Anti-pattern 3 — never exporting the .p12 backup</h3>
<p>One laptop holds the only copy of the distribution private key. Laptop dies → you cannot ship until you reissue and rebuild all CI. Export the <code>.p12</code> to a secrets vault on day one.</p>

<h3>Anti-pattern 4 — reusing the same build number</h3>
<p>Uploading without bumping CFBundleVersion gets rejected. Manually bumping is error-prone; automate it from the CI build id or a timestamp.</p>

<h3>Anti-pattern 5 — hand-editing entitlements without the App ID</h3>
<p>Pasting an entitlement into the file without enabling the capability on the App ID + profile produces "doesn't match the entitlements." Always change all three together (the Capabilities UI does this for you).</p>

<h3>Anti-pattern 6 — committing certificates/profiles to git</h3>
<p>Private keys and profiles in the repo are a security hole and rot fast. Store them in a secrets manager; on CI import them into a temporary keychain at build time.</p>

<h3>Anti-pattern 7 — shipping without matching dSYMs</h3>
<p>Production crash reports become unreadable hex. Upload dSYMs to Crashlytics/Sentry as a build step, and verify UUIDs match.</p>

<h3>Anti-pattern 8 — mixing dev and prod push tokens</h3>
<p>A sandbox (development) APNs token used against production APNs (or vice versa) silently fails. Keep <code>aps-environment</code> aligned with the build's distribution channel.</p>

<h3>Anti-pattern 9 — using Enterprise distribution for public apps</h3>
<p>It bypasses the store and works on any device — and violates program terms; Apple revokes the cert and bricks every install. Enterprise is for internal-only apps.</p>

<h3>Anti-pattern 10 — ignoring extension signing</h3>
<p>Archiving fails or the extension silently doesn't run because its separate bundle ID has no App ID/profile. Register and sign every embedded bundle.</p>

<h3>Anti-pattern 11 — leaving bitcode on with local dSYM assumptions</h3>
<p>App Store recompiled bitcode builds, invalidating local dSYMs; teams then wonder why symbolication is wrong. Disable bitcode (it is deprecated) and keep local dSYMs authoritative.</p>

<h3>Anti-pattern 12 — username/password on CI</h3>
<p>2FA breaks it and it is brittle. Use an App Store Connect API key (<code>.p8</code>).</p>

<h3>Anti-pattern 13 — hand-editing ios/ in an Expo prebuild app</h3>
<p>Signing tweaks made directly in <code>ios/</code> get wiped on the next <code>expo prebuild --clean</code>. Configure identifiers via <code>app.json</code>/config plugins and let EAS own credentials.</p>

<h3>Anti-pattern 14 — forgetting export compliance</h3>
<p>Every TestFlight build stalls on the encryption question. Set <code>ITSAppUsesNonExemptEncryption</code> in Info.plist so builds flow to testers immediately.</p>

<h3>Anti-pattern 15 — assuming the certificate is "everything"</h3>
<p>The most common conceptual bug: treating the certificate as self-sufficient. It is only the WHO — without a matching profile authorizing the App ID + entitlements + device, the install still fails.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. Why does iOS require code signing at all?</div>
  <div class="qa-answer">
    <p>Apple's security model is that only code whose signature chains back to an Apple-issued certificate may run — there is no unsigned sideloading like Android's <code>adb install</code>. It gives Apple attribution (every app maps to a paying account), tamper-evidence (the signature covers the binary + entitlements), and revocable gatekeeping. The cost is that you can never "just run" an app: a certificate, App ID, and provisioning profile must line up first.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Explain the four pieces: certificate, App ID, profile, entitlements.</div>
  <div class="qa-answer">
    <p>The <strong>certificate</strong> is the WHO — a keypair Apple signed, with the private key in your Keychain (Apple Development for debug, Apple Distribution for release). The <strong>App ID</strong> is the WHAT — the registered bundle identifier plus the Capabilities it may use. <strong>Entitlements</strong> are the specific permissions the binary claims, and must be a subset of the App ID's capabilities. The <strong>provisioning profile</strong> is Apple's signed contract binding cert + App ID + entitlements + (for dev/ad-hoc) device UDIDs together. Every signing error is two of these disagreeing.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. What exactly is inside a provisioning profile?</div>
  <div class="qa-answer">
    <p>A <code>.mobileprovision</code> is a CMS/PKCS7-signed plist containing: the App ID, the certificate(s) allowed to sign, the entitlements the app may claim, a device UDID list (Development and Ad Hoc only — App Store and Enterprise have none), a team identifier, and an expiry date. Apple signs the whole thing, so it is tamper-proof, and iOS reads the embedded copy at install/launch to decide whether to allow the app.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Development vs Distribution certificate, and the profile types?</div>
  <div class="qa-answer">
    <p>Apple Development certs sign debug builds you run on registered devices; Apple Distribution certs sign release builds. Profile types: <strong>Development</strong> (dev cert + UDIDs, Xcode run), <strong>Ad Hoc</strong> (dist cert + UDIDs, direct .ipa install), <strong>App Store</strong> (dist cert, no devices, TestFlight + store), and <strong>Enterprise/In-House</strong> (dist cert under the Enterprise program, no devices, internal-only). Ad Hoc and Development embed device lists; App Store and Enterprise do not.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Automatic vs manual signing — when do you use each?</div>
  <div class="qa-answer">
    <p>Automatic ("Automatically manage signing") lets Xcode create and renew certs, App IDs, and profiles from just a Team selection — great solo, but opaque and non-reproducible because it mutates the portal at build time. Manual signing pins a specific <code>CODE_SIGN_IDENTITY</code> and <code>PROVISIONING_PROFILE_SPECIFIER</code> per configuration — deterministic and the right choice for CI and shared teams. Tools like Fastlane match and EAS effectively do manual signing with vaulted credentials.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. What happens when you add a capability in Signing &amp; Capabilities?</div>
  <div class="qa-answer">
    <p>Three things move together: it writes the corresponding entitlement into your <code>.entitlements</code> file, enables that Capability on the App ID in the portal, and (in automatic mode) regenerates the provisioning profile to include the new entitlement. If any of those falls out of sync — say the profile predates the capability — codesign fails with "doesn't match the entitlements." Entitlements must be a subset of App ID capabilities, which the profile must grant.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Walk me through archiving and shipping a build.</div>
  <div class="qa-answer">
    <ol>
      <li>Set the scheme to Release and destination to "Any iOS Device (arm64)".</li>
      <li><code>Product &gt; Archive</code> produces a <code>.xcarchive</code> (app + dSYMs) in the Organizer.</li>
      <li>Distribute App &gt; pick a method (App Store Connect / Ad Hoc / Development / Enterprise), which signs and produces an <code>.ipa</code> or uploads directly.</li>
      <li>Upload via Organizer, Transporter, or <code>xcrun altool</code> with an App Store Connect API key.</li>
      <li>In App Store Connect the build appears under a version + build number; distribute via TestFlight, then submit for App Store review.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Version vs build number?</div>
  <div class="qa-answer">
    <p>Version is <code>MARKETING_VERSION</code> / CFBundleShortVersionString — the marketing string users see (3.4.0), and many builds can share it. Build number is <code>CURRENT_PROJECT_VERSION</code> / CFBundleVersion and must be strictly greater than any prior upload for that version, or App Store Connect rejects it with "bundle version must be higher." Teams automate the build-number bump from a CI build id or timestamp.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. What is TestFlight and how do internal vs external testers differ?</div>
  <div class="qa-answer">
    <p>TestFlight is Apple's beta distribution. Internal testers (up to 100 team members) get builds immediately after processing with no review. External testers (up to 10,000 via link/email) require a lightweight Beta App Review on the first build of each version. Builds expire after 90 days, and each needs export-compliance answered — set <code>ITSAppUsesNonExemptEncryption</code> to skip the prompt.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. What is a dSYM and why does it matter?</div>
  <div class="qa-answer">
    <p>A dSYM (debug symbol file) maps stripped machine addresses back to file/line/function. Release builds strip symbols for size, so crash reports are raw hex until you <strong>symbolicate</strong> them with the matching dSYM. Each build has a unique UUID that the dSYM must match (verify with <code>dwarfdump --uuid</code>). You upload dSYMs to Crashlytics/Sentry so production stack traces are readable — this is the release-side half of native crash debugging.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. "No profiles for 'com.x.app' were found" — how do you fix it?</div>
  <div class="qa-answer">
    <p>No profile exists for that bundle ID under the selected team. Fixes: confirm the App ID is registered, that <code>PRODUCT_BUNDLE_IDENTIFIER</code> exactly matches it, and the right Team is selected. In automatic mode let Xcode regenerate; in manual mode create/download the correct profile and set <code>PROVISIONING_PROFILE_SPECIFIER</code>. On CI, ensure the <code>.mobileprovision</code> is installed in the provisioning-profiles folder.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. "Provisioning profile doesn't include signing certificate" — cause?</div>
  <div class="qa-answer">
    <p>The certificate you are signing with is not among the certs the profile authorizes — often a reissued/renewed cert, or the profile lists a different distribution cert. Regenerate the profile so it includes the current certificate, or select a signing identity the profile already contains. Also verify the private key for that cert is present in the Keychain (<code>security find-identity -v -p codesigning</code>).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. A device install fails with "device not registered." Why?</div>
  <div class="qa-answer">
    <p>Development and Ad Hoc profiles embed an explicit UDID list; the target device's UDID is not in the profile. Register the UDID in the portal, regenerate the profile to include it, re-export the build. App Store and TestFlight have no device list, so this only affects direct dev/Ad Hoc installs, and the 100-device-per-type-per-year cap applies.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. How does signing differ for an Expo managed app?</div>
  <div class="qa-answer">
    <p>With EAS Build, Expo provisions and stores the certificate + provisioning profile in the cloud; <code>eas build -p ios --profile production</code> produces a signed <code>.ipa</code> without you touching Keychain or Xcode, and <code>eas submit</code> uploads it. You set <code>ios.bundleIdentifier</code> and <code>ios.buildNumber</code> in <code>app.json</code>, and manage credentials with <code>eas credentials</code>. You still need to understand certs/profiles/entitlements for when a build fails — and hand-edits to <code>ios/</code> get wiped by <code>expo prebuild --clean</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Your Mac died and you never backed up the distribution key. Now what?</div>
  <div class="qa-answer">
    <p>The certificate in the portal is public-key only, so it is unusable without the private key. If no <code>.p12</code> backup exists, revoke the distribution certificate and create a fresh CSR + certificate, then regenerate the App Store profile and update every CI machine. Already-shipped builds keep running (Apple re-signs at the store), but you cannot upload until reissued. The lesson: export the <code>.p12</code> (cert + key) to a vault on day one, or use EAS/Fastlane match so credentials live centrally.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You describe signing as a trust chain (Root CA → WWDR → your cert → binary), not magic.</li>
    <li>You can name the four pieces and say a profile binds cert + App ID + entitlements + devices.</li>
    <li>You know entitlements must be a subset of App ID capabilities the profile grants.</li>
    <li>You prefer manual signing (vaulted .p12 + pinned profiles) for CI over automatic.</li>
    <li>You explain version vs build number and that the build number must strictly increase.</li>
    <li>You distinguish Development / Ad Hoc / App Store / Enterprise profiles and their device lists.</li>
    <li>You tie dSYMs + UUID matching to readable production crash reports.</li>
    <li>You can diagnose the classic errors (no profile, cert not in profile, entitlements mismatch).</li>
    <li>You know EAS manages credentials in the cloud but still understand the underlying machinery.</li>
  </ul>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'revision', title: '⚡ Revision — Points to Remember', collapsible: true, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">iOS signing is a trust chain — a <strong>certificate</strong> proves WHO, an <strong>App ID</strong> declares WHAT, <strong>entitlements</strong> claim a subset of that, and a <strong>provisioning profile</strong> is Apple's signed contract binding them (plus devices) together; shipping is Archive → .ipa → App Store Connect → TestFlight → review, with the build number strictly increasing.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>No unsigned sideloading.</strong> iOS only runs binaries whose signature chains Apple Root CA → WWDR intermediate → your leaf cert → binary. A stale WWDR or expired cert breaks signing even with no code change.</li>
    <li><strong>Certificate = WHO.</strong> Apple Development (debug) vs Apple Distribution (release); the <strong>private key</strong> lives in Keychain and is generated by the <strong>CSR</strong>. Back it up as a <code>.p12</code> (cert + key) or a dead laptop means revoke + reissue.</li>
    <li><strong>App ID = WHAT.</strong> Explicit (<code>com.workctrl.smartworks</code>, required for push/App Groups/associated domains) vs wildcard (<code>com.x.*</code>, no such capabilities). Ticking a Capability here is what makes the entitlement legal.</li>
    <li><strong>Provisioning profile = the glue.</strong> A signed <code>.mobileprovision</code> bundling App ID + certificate(s) + entitlements + (Development/Ad Hoc only) device UDIDs + expiry. Types: Development, Ad Hoc, App Store, Enterprise/In-House.</li>
    <li><strong>Entitlements ⊆ App ID caps ⊆ profile.</strong> Claim more than the profile grants → "doesn't match the entitlements." <code>aps-environment</code> is <code>development</code> in dev, <code>production</code> in store/Ad Hoc.</li>
    <li><strong>Devices/UDIDs</strong> — 100 per type per year, embedded only in Development/Ad Hoc profiles; App Store + TestFlight have no device list.</li>
    <li><strong>Automatic vs Manual signing.</strong> Automatic = Xcode manages certs/App IDs/profiles from a Team (opaque, non-reproducible); Manual = pin <code>CODE_SIGN_IDENTITY</code> + <code>PROVISIONING_PROFILE_SPECIFIER</code> per config (deterministic, CI-friendly). Key settings: <code>DEVELOPMENT_TEAM</code>, <code>CODE_SIGN_STYLE</code>.</li>
    <li><strong>Archive → export.</strong> Scheme Release, "Any iOS Device (arm64)", <code>Product &gt; Archive</code> → <code>.xcarchive</code> (app + dSYMs) → Organizer → Distribute (App Store / Ad Hoc / Development / Enterprise) → <code>.ipa</code>. CLI: <code>xcodebuild archive</code> + <code>xcodebuild -exportArchive</code> with <code>ExportOptions.plist</code>.</li>
    <li><strong>App Store Connect.</strong> App record bound to the bundle ID; <strong>Version</strong> (<code>MARKETING_VERSION</code>/CFBundleShortVersionString) is what users see, <strong>build number</strong> (<code>CURRENT_PROJECT_VERSION</code>/CFBundleVersion) must strictly increase. Upload via Organizer, <strong>Transporter</strong>, or <code>xcrun altool</code>/<code>notarytool</code> with an App Store Connect API key.</li>
    <li><strong>TestFlight.</strong> Internal (≤100, instant, no review) vs external (≤10,000, first build needs Beta App Review); builds expire in 90 days; answer export compliance via <code>ITSAppUsesNonExemptEncryption</code>.</li>
    <li><strong>dSYM + symbolication.</strong> dSYM maps stripped addresses → file/line; each build's UUID must match (<code>dwarfdump --uuid</code>); upload dSYMs to Crashlytics/Sentry or production crashes stay raw hex.</li>
    <li><strong>Classic errors:</strong> "No profiles were found" (App ID/bundle-id/team mismatch), "profile doesn't include signing certificate" (reissued cert not in profile), "doesn't match the entitlements" (entitlement superset), expired cert/profile, wrong team.</li>
    <li><strong>Expo/EAS:</strong> <code>eas build -p ios --profile production</code> + <code>eas submit</code>; <code>eas credentials</code> manages certs/profiles in the cloud; <code>ios.bundleIdentifier</code>/<code>ios.buildNumber</code> in <code>app.json</code>; hand-edits to <code>ios/</code> get wiped on <code>expo prebuild --clean</code>.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Blaming the certificate for a profile fault.</strong> When signing breaks people revoke/regenerate the cert — but the usual cause is a provisioning profile that predates a capability, or a reissued cert the profile doesn't list. Diagnose the profile (decode it with <code>security cms -D</code>) before touching a shared Distribution certificate. And the certificate is never self-sufficient — without a matching profile authorizing the App ID + entitlements + device, the install still fails.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Signing is a trust chain: a certificate proves who built it, an App ID declares the bundle ID and its capabilities, entitlements claim a subset of those, and the provisioning profile is Apple's signed contract binding cert + App ID + entitlements + devices. Every signing error is two of those disagreeing."</div>
  <div class="revision-say">"To ship: scheme Release, Product &gt; Archive to an xcarchive with dSYMs, Distribute from the Organizer to produce an .ipa, upload to App Store Connect, then TestFlight and review. The build number must strictly increase even when the marketing version stays the same."</div>
  <div class="revision-say">"On Expo I use EAS — eas build and eas submit — and eas credentials keeps the cert and profile in the cloud, so I rarely touch Keychain, but I still understand certs, profiles, and entitlements for when a build breaks."</div>
</div>
`},

{ id: 'checklist', title: '✅ Interview Checklist', collapsible: true, html: `
<div class="callout success">
  <div class="callout-title">Can you answer these before moving on?</div>
  <ul>
    <li>Can you explain the iOS trust chain from Apple Root CA down to the signed binary, and why unsigned code won't run?</li>
    <li>Can you name the four pieces (certificate, App ID, entitlements, provisioning profile) and say exactly what each contributes?</li>
    <li>Can you list what a <code>.mobileprovision</code> bundles and how Development, Ad Hoc, App Store, and Enterprise profiles differ?</li>
    <li>Can you contrast automatic vs manual signing and say which you'd use on CI and why?</li>
    <li>Can you walk from <code>Product &gt; Archive</code> to a TestFlight build, including version vs build number?</li>
    <li>Can you diagnose "No profiles were found", "profile doesn't include signing certificate", and "doesn't match the entitlements"?</li>
    <li>Can you explain what a dSYM is, why UUIDs must match, and how EAS changes the signing story for an Expo app?</li>
  </ul>
</div>
`}

]
});
