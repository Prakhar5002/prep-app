/* Practice challenges — RN Deep Dives: Build, Release & CI/CD */
(function () {
  var reg = window.PREP_SITE.registerChallenge;

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-build-eas-profiles', track: 'rn', category: 'rn-build-release',
    difficulty: 'senior', type: 'deep-dive',
    prompt: "Walk through eas.json build profiles — development, preview, production — and explain when a build should run in the cloud vs. locally, and why 'preview' and 'production' aren't just cosmetic labels.",
    answer: {
      core: `The three default profiles aren't naming conventions — each describes a genuinely different binary built from the same source: <code>development</code> bundles the dev client (debug menu, fast refresh hooks) and is never submitted anywhere; <code>preview</code> is a release-configured, internally-distributed build (installable directly on a device via a link/QR code, no store review) used for QA/stakeholder testing; <code>production</code> is the store-distribution build meant for <code>eas submit</code>. Confusing these — most commonly, submitting a dev-client build to a store, or trusting a "preview" build's behavior as identical to what ships — is the actual failure mode this structure exists to prevent.`,
      mechanism: `<pre><code class="language-json">{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview":     { "distribution": "internal" },
    "production":  { "autoIncrement": true }
  }
}
</code></pre>
Each profile can carry its own <code>android</code>/<code>ios</code> overrides (build type, env vars, resource class, credentials source) and profiles can <code>"extends"</code> another to inherit shared config and override just the deltas, instead of duplicating the whole block. <code>distribution: "internal"</code> produces an ad hoc (iOS, requires registered device UDIDs in the profile) or direct-install APK build meant for testers; <code>distribution: "store"</code> (production's implicit default) produces the binary shape a store actually accepts. Cloud builds run on Expo-managed macOS/Linux workers and handle credential storage for you; <code>eas build --local</code> runs the identical build steps on your own machine — used to debug a build failure without waiting in a cloud queue, or to satisfy a compliance policy that forbids sending source/credentials to a third party.`,
      tradeoffs: `Local builds hand back full control (and the full burden) of matching Xcode/Android SDK/NDK versions to what EAS's cloud image provides — a mismatch there reproduces "works on my machine" build failures that cloud builds sidestep by pinning a known-good toolchain. Internal distribution is fast to test with but isn't equivalent to production: a preview build often differs in bundling/optimization flags, so "it worked in preview" isn't proof it'll behave identically once actually store-distributed.`,
      followups: [
        { q: "Can a development-profile build ever safely reach an end user?", a: "No — it depends on expo-dev-client and ships debug tooling/menus; it should never be uploaded to a store or handed to a real user, only to developers/QA who need the dev-client debug surface." },
        { q: "What does a profile's \"extends\" field actually save you from?", a: "Duplicating shared config across profiles — a preview profile can extend production and override only distribution/env, so a later change to shared settings (say, resource class) doesn't need editing in multiple places and silently drifting out of sync." }
      ],
      redFlags: `Submitting an internal/dev-client build to the App Store or Play Console instead of a real production-profile build; assuming "preview" and "production" builds are behaviorally identical without checking whether bundling/env differences exist between the two profiles.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-build-ota-scope', track: 'rn', category: 'rn-build-release',
    difficulty: 'senior', type: 'deep-dive',
    prompt: "A team wants to ship a fix via EAS Update instead of a full store release. What can actually go out over OTA versus what requires a real store binary, and how does runtimeVersion enforce that boundary?",
    answer: {
      core: `OTA (EAS Update) can only ship changes reachable by re-executing JS against the SAME native shell: JS bundle diffs and static assets. Anything that changes the native surface — a new/updated native module, an RN or Expo SDK bump, an added permission or entitlement, a changed manifest/Info.plist — requires a real native rebuild and a new store (or internal) release; it structurally cannot go out as an update, regardless of how small the change feels. CodePush is not a live alternative for this in 2026 — Microsoft retired the hosted App Center CodePush service in March 2025, and EAS Update is the actively maintained successor most teams have migrated to.`,
      mechanism: `<code>runtimeVersion</code> is the enforced contract: a device only accepts an update whose runtimeVersion string matches the value embedded in its installed binary. Two common policies: <code>appVersion</code> derives runtimeVersion directly from <code>app.json</code>'s <code>version</code> field (simple, but blunt — see tradeoffs); <code>fingerprint</code> computes it from an actual hash of the native-relevant project surface, so it changes automatically when something native-affecting changes and stays stable otherwise, letting more genuinely-JS-only changes qualify for OTA.
<pre><code class="language-json">{
  "expo": {
    "runtimeVersion": { "policy": "fingerprint" }
  }
}
</code></pre>
If a JS update ships targeting a runtimeVersion no installed binary currently has, EAS Update simply never serves it to those devices — it doesn't crash or partially apply, it's silently ineligible until a matching binary exists.`,
      tradeoffs: `The <code>appVersion</code> policy is easy to reason about but imprecise: bumping <code>version</code> for a purely marketing reason (with zero native changes) needlessly invalidates OTA eligibility for a build that would've been perfectly compatible, forcing an unnecessary store release before further updates apply. The <code>fingerprint</code> policy is precise but depends on trusting the fingerprinting tool to actually catch every native-affecting change — a native dependency added through an untracked path could in principle slip through undetected.`,
      followups: [
        { q: "If someone accidentally publishes an OTA update containing a native module bump, what happens to users?", a: "Nothing breaks — the update's runtimeVersion won't match any installed binary's, so EAS Update simply never serves it to anyone; it's the safety mechanism working, not a bug needing a workaround." },
        { q: "Is CodePush a reasonable choice for a brand-new project in 2026?", a: "No — its hosted backend (App Center) was retired in March 2025; only a self-hosted, largely unmaintained OSS server remains, versus EAS Update's actively developed feature set (phased rollout, Hermes bytecode diffing) built for exactly this use case." }
      ],
      redFlags: `Describing EAS Update as able to ship "any code change" without the runtimeVersion caveat; recommending CodePush for a new project; assuming bumping app.json's version string alone constitutes a safety check against shipping native-incompatible JS under the appVersion policy.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-build-app-signing', track: 'rn', category: 'rn-build-release',
    difficulty: 'senior', type: 'deep-dive',
    prompt: "Compare what \"signing\" actually means for iOS vs. Android in a CI/EAS pipeline — certs/provisioning profiles on one side, keystore + Play App Signing on the other — and where each typically breaks.",
    answer: {
      core: `iOS signing is two paired artifacts, not one: a distribution certificate (private key + cert proving developer/org identity to Apple) and a provisioning profile (binds that cert to a specific bundle ID, entitlements list, and — for ad hoc distribution — a device UDID allowlist). Android needs a single upload keystore used to sign the AAB you submit — but under Play App Signing (the modern default), Google immediately re-signs that AAB with ITS OWN app-signing key before distributing to devices, meaning the certificate end-user devices actually trust is Google's, not the one in your keystore.`,
      mechanism: `EAS can generate and hold all of this for you (<code>eas credentials</code>), or a team can bring its own (an existing keystore, a fastlane-match-managed cert/profile pair). The single most common iOS rejection cause is a stale provisioning profile: adding a new capability (push notifications, associated domains, HealthKit) to the Xcode project without regenerating the profile leaves its entitlements list out of sync with what the app actually declares, which App Store Connect rejects at processing time — not at build time, so it surfaces late. On Android, Play App Signing changes the failure mode for a lost upload keystore: historically, losing your sole signing key meant permanently losing the ability to update that app identity; under Play App Signing, Google retains its own signing key regardless, and offers an account-verified upload-key-reset flow, so a lost upload keystore is recoverable rather than catastrophic.`,
      tradeoffs: `Letting EAS manage credentials removes an entire "who has the .p12 / keystore password" operational-risk category, at the cost of trusting Expo's infrastructure with production signing material — some compliance regimes require self-managed (BYO) credentials instead. Play App Signing has been effectively required for new Play Console apps since August 2021 (bundled with the App Bundle/AAB requirement) and is a net safety improvement (recoverable upload key), traded against no longer holding the final, device-trusted signing identity yourself.`,
      followups: [
        { q: "What silently breaks a provisioning profile without touching signing config directly?", a: "Adding a new entitlement/capability to the app (push, associated domains, etc.) without regenerating the profile — the profile's entitlements list and the app's actual entitlements must match exactly, and mismatch surfaces as an App Store Connect processing rejection, not a local build error." },
        { q: "If a team loses its Android upload keystore today, are they locked out of future updates forever?", a: "Not if enrolled in Play App Signing (the default for new apps) — Google's own app-signing key is what actually signs the distributed APK, so losing the upload key is recoverable via Google's account-verified reset flow, unlike the old signing-key-loss failure mode that made an app identity permanently unrecoverable." }
      ],
      redFlags: `Treating iOS "signing" as a single artifact instead of a cert+profile pair that must agree; assuming a lost Android keystore is automatically catastrophic without first checking Play App Signing enrollment; storing raw .p12/keystore files or passwords unencrypted in a repo instead of EAS-managed credentials or CI secrets.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-build-versioning-skew', track: 'rn', category: 'rn-build-release',
    difficulty: 'core', type: 'deep-dive',
    prompt: "What's the actual difference between an app's \"version\" and the platform build numbers (iOS buildNumber, Android versionCode), and how does a JS/native \"skew\" bug happen even when all three are set correctly?",
    answer: {
      core: `<code>version</code> (e.g. "2.4.0") is the human-facing marketing string shown in stores. <code>buildNumber</code> (iOS — a string, must strictly increase within a given version submitted to App Store Connect) and <code>versionCode</code> (Android — an integer, must strictly increase across every upload the app has EVER had) are machine identifiers each store uses purely to order/dedupe binaries. None of the three says anything about whether the JS bundle currently running matches the native code it was compiled against — that's a fully separate, EAS-Update-specific concern owned by <code>runtimeVersion</code>.`,
      mechanism: `A concrete skew: a team ships native binary 2.4.0 (versionCode 87, runtimeVersion "abc123" under the fingerprint policy), then publishes three OTA updates over following weeks. A user who installed 2.4.0 on day one but didn't reopen the app until update #3 shipped is still, underneath, only ever running against native code frozen at install time. If update #3's JS assumes a native capability that didn't exist in that exact binary (e.g. it calls a bridge method only added in a later native release the user never installed), the app misbehaves or crashes purely from JS/native mismatch — while version, buildNumber, and versionCode all look completely normal and correctly incrementing.`,
      tradeoffs: `EAS's <code>autoIncrement: true</code> can bump versionCode/buildNumber automatically per build so nobody forgets (the stores hard-reject a duplicate or lower code/number) — but that automation says nothing about JS/native compatibility; conflating "our build numbers are correctly incrementing" with "our OTA updates are safe" is exactly the gap that produces skew incidents.`,
      followups: [
        { q: "Can an Android versionCode ever be reused after an old release is pulled?", a: "No — Play Console tracks every versionCode ever uploaded across the app's entire history, including pulled or rejected releases, so a used code is retired permanently; iOS buildNumber is looser, only needing to increase within a single marketing version." },
        { q: "Does bumping app.json's \"version\" field automatically protect OTA compatibility?", a: "Only under the appVersion runtimeVersion policy — Expo's default and officially recommended policy — since that policy derives runtimeVersion directly from it. Under the fingerprint policy (officially labeled experimental — gaining adoption for its precision, but not the default), version and runtimeVersion are fully decoupled — bumping version does nothing to gate OTA eligibility." }
      ],
      redFlags: `Treating a versionCode/buildNumber bump as equivalent to "we've handled JS/native compatibility" (it only satisfies store upload-ordering rules); assuming a retired Android versionCode can be reused after a release is pulled from the store.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-build-16kb-target-sdk', track: 'rn', category: 'rn-build-release',
    difficulty: 'senior', type: 'deep-dive',
    prompt: "What is the Android 16 KB memory page-size requirement, why does it affect an RN app at all, and how is it different from Google Play's separate target-SDK-level deadline?",
    answer: {
      core: `Starting with Android 15, AOSP added support for devices configured to use a 16 KB (instead of the traditional 4 KB) memory page size — a kernel-level change that improves performance but breaks any prebuilt native library that hardcoded 4 KB-alignment assumptions. An RN app is affected because Hermes and essentially every third-party native module ship prebuilt <code>.so</code> files; if any of those — yours or a dependency's — weren't built 16 KB-aligned, the app can crash on 16 KB-page devices. This is a completely different axis from the target-SDK/API-level requirement, which mandates apps declare a sufficiently recent <code>targetSdkVersion</code> for continued search/install visibility — one is about binary memory-layout compatibility, the other is about the API/behavior surface the app has opted into.`,
      mechanism: `Google's timeline: new apps and updates needed 16 KB-page support starting November 1, 2025, with the deadline for existing-app updates extended in Play Console to May 31, 2026; separately, target API level policy requires new submissions/updates target Android 16 (API 36) by August 31, 2026, after which apps not meeting it become invisible to new users on devices running that OS version or newer. For an RN project, compliance means upgrading to an RN/Expo release whose prebuilt Hermes and NDK toolchain are already 16 KB-aligned (recent SDKs default to this), then auditing every native dependency individually for its own alignment status — a stale third-party library with no updated release is a genuine, not-fixable-by-you blocker until its maintainer ships a fix.`,
      tradeoffs: `This is a case where you cannot hit the deadline with JS/OTA work alone — it requires an actual native rebuild (new versionCode, new store submission) regardless of how much of the app's own code is unaffected, and if compliance is blocked by a third-party dependency, "we didn't cause this" doesn't stop the store from applying the deadline to your listing.`,
      followups: [
        { q: "Can 16 KB page-size compliance be fixed by shipping an EAS Update?", a: "No — it's purely a native-binary characteristic (how .so files are memory-aligned), entirely outside anything OTA can touch; it requires a real native rebuild and store submission, full stop." },
        { q: "How would a team actually check whether they're compliant today, rather than assuming it from their RN version?", a: "Google Play Console surfaces a pre-launch warning for uploaded builds containing non-16-KB-aligned native libraries, and Android Studio's APK analyzer can inspect a built .so's alignment directly — being on a \"recent enough\" RN version doesn't guarantee every third-party native dependency was rebuilt aligned." }
      ],
      redFlags: `Treating the 16 KB page-size requirement and the target-SDK-level requirement as the same deadline or mechanism (they're independently enforced, on different timelines, for different reasons); assuming an EAS Update can remediate a native alignment issue.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-build-submit-rollback', track: 'rn', category: 'rn-build-release',
    difficulty: 'staff', type: 'deep-dive',
    prompt: "Design a genuinely safe release strategy spanning EAS Submit's store rollout and EAS Update's OTA rollout — what does \"safe\" require at each layer, and what's the correct move when a bad release is already partway out?",
    answer: {
      core: `Safety at the store/native layer and the OTA layer are two distinct staged mechanisms that must BOTH be used deliberately — one does not substitute for the other. Play Console (driven via <code>eas submit</code>) supports a staged store-rollout percentage for a new binary; EAS Update independently supports its own rollout percentage on a single published update. A binary released via staged store rollout still needs its own OTA rollout staged separately once real traffic starts flowing to it — they are two different dials, not one.`,
      mechanism: `A defensible sequence: 1) submit the new binary at a low store-rollout percentage (e.g. 5-10%) and hold there long enough to watch crash-free-rate/ANR metrics in Play Console/App Store Connect; 2) only once the binary itself looks healthy, begin publishing OTA updates against its channel — ALSO staged (e.g. 1% for roughly an hour to catch boot-loop-class failures, then 10% for several hours watching crash reporting, then 100%); 3) if telemetry regresses at any OTA stage, the fix is NOT dropping the rollout percentage back toward zero — devices that already fetched and cached the bad bundle keep running it regardless of what the percentage says now — the actual fix is publishing a new update (often literally republishing the last known-good build) that outranks the bad one for every client, then investigating offline.`,
      tradeoffs: `This two-layer staged approach is slower than shipping 100% immediately at every step, and requires genuinely watching crash telemetry between stages rather than treating rollout percentage as a formality to click through — but it's the only structure that catches a native-binary problem before OTA compounds it on top, and separately catches an OTA-only problem without wrongly blaming (or needlessly re-submitting) the native binary.`,
      followups: [
        { q: "If a Play Store staged rollout at 20% shows a crash spike, what's the immediate action versus the OTA equivalent?", a: "On the store side: halt the staged rollout in Play Console, which stops offering the new APK/AAB to further users while existing installers keep running the previous version. On the OTA side there is no equivalent halt-and-revert — publishing a corrected/reverted update is the only real recovery, since devices that already applied the bad update are already running it." },
        { q: "Why doesn't setting an EAS Update rollout back to 0% count as a rollback?", a: "Rollout percentage only controls which new devices/sessions get offered the update going forward — it does nothing to devices that already fetched and applied it; those keep running the bad bundle until a newer update is published that supersedes it." }
      ],
      redFlags: `Assuming a Play Store staged-rollout halt also undoes an OTA update pushed to the same release (or vice versa) — they're independent mechanisms with independent state; attempting to "roll back" an EAS Update by lowering its rollout percentage instead of publishing a corrected update.`
    }
  });
})();
