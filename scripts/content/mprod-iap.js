window.PREP_SITE.registerTopic({
  id: 'mprod-iap',
  module: 'mobile-prod',
  title: 'In-App Purchases',
  estimatedReadTime: '45 min',
  tags: ['iap', 'in-app-purchases', 'subscriptions', 'storekit', 'play-billing', 'revenuecat', 'receipt-validation', 'react-native'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>In-App Purchases (IAP)</strong> are how mobile apps charge users — for digital goods, subscriptions, consumables, and access to features. Apple and Google enforce that all <em>digital</em> purchases use their billing systems (StoreKit on iOS, Play Billing on Android). They take 15–30%; you live with it. Physical goods, ads, and many services route through normal payment processors.</p>
<ul>
  <li><strong>Three product types.</strong> <em>Consumable</em> (coins, lives — buy again), <em>non-consumable</em> (one-time unlock, lifetime), <em>auto-renewing subscription</em> (most revenue for most apps).</li>
  <li><strong>Always validate receipts on your server.</strong> Client-side validation is trivially bypassable; treat every device receipt as untrusted input.</li>
  <li><strong>Restore is mandatory.</strong> Apple rejects apps without a "Restore Purchases" affordance. Subscriptions must work after reinstall, fresh login, new device.</li>
  <li><strong>Default tools:</strong> <strong>RevenueCat</strong> (the de facto wrapper — handles receipts, server-to-server, entitlements, analytics; free up to $10k MTR), <strong>Apphud</strong>, <strong>Adapty</strong>, or roll-your-own with Apple/Google's SDKs and webhooks.</li>
  <li><strong>Subscription state is async.</strong> Renewals, cancellations, refunds happen on the server (S2S notifications). Don't trust the client view of "is this user active."</li>
  <li><strong>Pricing tiers.</strong> Apple/Google use price tier matrices; you don't pick arbitrary numbers. Localized pricing is automatic per country tier.</li>
  <li><strong>Family Sharing</strong> (iOS) and <strong>Family Library</strong> (Google) — non-consumable purchases share across the family by default unless disabled.</li>
  <li><strong>Tax + foreign-exchange handled by the platform.</strong> Net payout is in your developer account currency, after taxes withheld.</li>
</ul>
<p><strong>Mantra:</strong> "Server is truth. Client is hint. Validate every receipt. Subscribe to webhooks. Always offer Restore."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What is IAP, technically?</h3>
<p>A managed payment flow where the user enters their Apple ID / Google account password (or biometric), the platform charges their card, and your app gets a <em>receipt</em> — an opaque, signed blob proving the purchase happened. You translate that receipt into "this user has access to feature X" and persist it to your backend.</p>

<h3>The three product categories</h3>
<table>
  <thead><tr><th>Type</th><th>Apple term</th><th>Google term</th><th>Examples</th></tr></thead>
  <tbody>
    <tr><td>Consumable</td><td>Consumable</td><td>Inapp (consumable)</td><td>Coins, lives, gems, tickets</td></tr>
    <tr><td>Non-consumable</td><td>Non-Consumable</td><td>Inapp (non-consumable)</td><td>Lifetime unlock, ad removal, premium features</td></tr>
    <tr><td>Auto-renewing subscription</td><td>Auto-Renewable</td><td>Subscription</td><td>Monthly Pro, yearly streaming, premium tier</td></tr>
    <tr><td>Non-renewing subscription (rare)</td><td>Non-Renewing</td><td>(emulated)</td><td>Season pass, finite-duration access</td></tr>
  </tbody>
</table>

<h3>The 15/30% split</h3>
<ul>
  <li><strong>Apple:</strong> 30% of every purchase. Drops to 15% in year 2 of a subscription. Small-business program (&lt;$1M/year) gets 15% across the board.</li>
  <li><strong>Google:</strong> Mirror of Apple — 30% standard, 15% past year 1 of subs and for the small-business tier.</li>
  <li><strong>EU DMA changes (2024+):</strong> Apple now allows alternative payment processing in the EU with reduced commission (10/17%) plus a "Core Technology Fee."</li>
  <li><strong>South Korea, Netherlands:</strong> Local laws have forced reduced fees / alternative processing for specific app categories.</li>
</ul>

<h3>Why mobile IAP is harder than web payments</h3>
<table>
  <thead><tr><th>Problem</th><th>Mobile reality</th></tr></thead>
  <tbody>
    <tr><td>You cannot use Stripe</td><td>For digital goods you must use Apple/Google billing. Side-loading payment links can get you removed.</td></tr>
    <tr><td>Receipts are server-validated</td><td>You query Apple's <code>verifyReceipt</code> or Google's purchases API; never trust the client.</td></tr>
    <tr><td>Subscription state is async</td><td>S2S notifications fire on renew, cancel, refund — you must subscribe and process them.</td></tr>
    <tr><td>Restore is mandatory</td><td>Apple rejects apps without a working Restore button.</td></tr>
    <tr><td>Family Sharing</td><td>Non-consumables and subs share with family by default; verify your entitlement model.</td></tr>
    <tr><td>Sandbox is unstable</td><td>Apple's sandbox is famously flaky — testing renewals takes patience.</td></tr>
    <tr><td>Currency &amp; tax</td><td>You don't pick prices; you pick a "tier" and Apple/Google localize and tax.</td></tr>
  </tbody>
</table>

<h3>Why not roll your own?</h3>
<p>Most teams use <strong>RevenueCat</strong>, <strong>Apphud</strong>, or <strong>Adapty</strong>. Reasons:</p>
<ol>
  <li>Receipt validation is fiddly; getting it wrong means revenue loss or fraud.</li>
  <li>S2S notification handling for renewals, cancellations, grace periods, refunds, billing retries — full of edge cases.</li>
  <li>Cross-platform entitlement (same user on iOS + Android + web with shared subscription) requires a coordinated backend.</li>
  <li>Subscription analytics (LTV, churn, MRR) — these tools provide them out of the box.</li>
  <li>Tax compliance, refunds, country pricing — all surfaced.</li>
</ol>

<h3>What "good" looks like</h3>
<ul>
  <li>Every purchase results in a server-validated receipt persisted to your DB.</li>
  <li>Server is the source of truth: <code>SELECT entitlements FROM user_subs WHERE user_id = ? AND active = true</code>.</li>
  <li>S2S webhooks (Apple App Store Server Notifications, Google Real-Time Developer Notifications) drive entitlement updates.</li>
  <li>Restore Purchases works on a fresh install.</li>
  <li>Failed purchases never silently grant access (and never silently fail to grant access if they succeeded).</li>
  <li>UX shows pending state during the 1–10s the platform is processing.</li>
  <li>Sandbox + production paths are tested before release.</li>
  <li>Refund webhook revokes entitlement immediately.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The end-to-end flow</h3>
<pre><code class="language-text">USER TAPS BUY
   ↓
1. App calls native IAP API → platform UI sheet appears.
2. User authenticates (Touch ID / Face ID / password).
3. Platform charges, returns a receipt to the app.
4. App sends receipt to YOUR backend.
5. Backend posts receipt to Apple/Google for validation.
6. Backend stores entitlement in DB.
7. App reads entitlement from backend.
   ↓
LATER:
8. Apple/Google sends S2S notification on every renewal, cancel, refund.
9. Backend updates entitlement; pushes silent push to app to refresh.
</code></pre>

<h3>Subscription lifecycle states</h3>
<table>
  <thead><tr><th>State</th><th>Trigger</th><th>Entitled?</th></tr></thead>
  <tbody>
    <tr><td>Active</td><td>Purchase or successful renewal</td><td>Yes</td></tr>
    <tr><td>In trial</td><td>Free intro</td><td>Yes</td></tr>
    <tr><td>In grace period</td><td>Auto-renew failed; platform retries (1–60 days)</td><td>Yes (Apple grants ~16 days; Google ~30)</td></tr>
    <tr><td>On hold</td><td>Payment retries exhausted</td><td>No</td></tr>
    <tr><td>Cancelled (will not renew)</td><td>User cancelled before period end</td><td>Yes <em>until period end</em></td></tr>
    <tr><td>Expired</td><td>Period ended without renewal</td><td>No</td></tr>
    <tr><td>Refunded</td><td>User got a refund</td><td>No (immediately revoke)</td></tr>
    <tr><td>Paused (Google only)</td><td>User paused renewal</td><td>No (during pause)</td></tr>
  </tbody>
</table>

<h3>Receipts: opaque blobs of truth</h3>
<table>
  <thead><tr><th>Platform</th><th>Receipt format</th><th>Validation endpoint</th></tr></thead>
  <tbody>
    <tr><td>Apple StoreKit 2 (iOS 15+)</td><td>JWS-signed transaction</td><td>Verify via Apple's public keys (no network needed)</td></tr>
    <tr><td>Apple StoreKit 1</td><td>Base64 receipt blob</td><td>POST to <code>/verifyReceipt</code> (production or sandbox)</td></tr>
    <tr><td>Google Play Billing</td><td>Purchase token + product ID</td><td>POST to Play Developer API <code>purchases.subscriptions.get</code></td></tr>
  </tbody>
</table>

<h3>Why server validation is non-negotiable</h3>
<p>The client receipt is signed by Apple/Google but the <em>app</em> verifying it can be patched, the OS jailbroken, the receipt forged. Server validation queries Apple/Google directly — they are the source of truth. Always:</p>
<ol>
  <li>Client sends raw receipt to your backend.</li>
  <li>Backend posts to Apple/Google's verify endpoint with your shared secret.</li>
  <li>Apple/Google return the parsed, authoritative state.</li>
  <li>Backend updates your <code>user_subscriptions</code> table.</li>
  <li>Client reads entitlement from your backend on next request.</li>
</ol>

<h3>S2S webhooks — the real-time channel</h3>
<table>
  <thead><tr><th>Event</th><th>Apple</th><th>Google</th></tr></thead>
  <tbody>
    <tr><td>Renewal</td><td>DID_RENEW</td><td>SUBSCRIPTION_RENEWED</td></tr>
    <tr><td>Cancel</td><td>DID_CHANGE_RENEWAL_STATUS (autoRenewStatus=false)</td><td>SUBSCRIPTION_CANCELED</td></tr>
    <tr><td>Refund</td><td>REFUND</td><td>SUBSCRIPTION_REVOKED</td></tr>
    <tr><td>Billing fail</td><td>DID_FAIL_TO_RENEW</td><td>SUBSCRIPTION_ON_HOLD</td></tr>
    <tr><td>Grace</td><td>GRACE_PERIOD_EXPIRED</td><td>SUBSCRIPTION_IN_GRACE_PERIOD</td></tr>
    <tr><td>Recovered</td><td>DID_RECOVER</td><td>SUBSCRIPTION_RECOVERED</td></tr>
  </tbody>
</table>

<h3>Entitlement vs product</h3>
<ul>
  <li><strong>Product:</strong> the SKU you sell — <code>com.myapp.premium_monthly</code>, <code>com.myapp.premium_yearly</code>.</li>
  <li><strong>Entitlement:</strong> what feature unlocks — "premium," "ad_free," "pro_team."</li>
</ul>
<p>Multiple products can grant the same entitlement (monthly and yearly both unlock "premium"). RevenueCat's model embraces this; native APIs leave it to you.</p>

<h3>Test environments</h3>
<table>
  <thead><tr><th>Apple</th><th>Google</th></tr></thead>
  <tbody>
    <tr><td>Sandbox: real-world flow with test accounts. Subscriptions renew on accelerated clock (1 month = 5 minutes).</td><td>License Tester accounts: similar accelerated renewals.</td></tr>
    <tr><td>StoreKit configuration file in Xcode: simulator-friendly, no Apple round-trip — fastest dev loop.</td><td>Internal Testing track: closer to production behavior; useful for full receipt flow.</td></tr>
    <tr><td>TestFlight: production-like; users get TestFlight Apple ID.</td><td>Closed/Open Testing tracks: production billing in test mode.</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>RevenueCat (the recommended path) — RN setup</h3>
<pre><code class="language-bash">yarn add react-native-purchases
cd ios &amp;&amp; pod install
</code></pre>
<pre><code class="language-tsx">// iap/index.ts
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

export async function initIAP() {
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
  await Purchases.configure({
    apiKey: Platform.select({
      ios: process.env.RC_IOS_KEY,
      android: process.env.RC_ANDROID_KEY,
    })!,
    appUserID: null,   // null = anonymous; set on login
  });
}

export async function onLogin(userId: string) {
  const { customerInfo } = await Purchases.logIn(userId);
  return customerInfo.entitlements.active;
}

export async function onLogout() {
  await Purchases.logOut();
}

// Fetch products
export async function getOfferings() {
  return Purchases.getOfferings();
}

// Buy
export async function purchase(pkg: PurchasesPackage) {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo.entitlements.active['premium'];
  } catch (e: any) {
    if (e.userCancelled) return null;
    throw e;
  }
}

// Restore
export async function restore() {
  const { customerInfo } = await Purchases.restorePurchases();
  return customerInfo.entitlements.active['premium'];
}
</code></pre>

<h3>The paywall component</h3>
<pre><code class="language-tsx">function Paywall() {
  const [offerings, setOfferings] = useState&lt;PurchasesOffering | null&gt;(null);

  useEffect(() =&gt; {
    Purchases.getOfferings().then((o) =&gt; setOfferings(o.current));
  }, []);

  if (!offerings) return &lt;ActivityIndicator /&gt;;

  return (
    &lt;View&gt;
      {offerings.availablePackages.map((p) =&gt; (
        &lt;Pressable key={p.identifier} onPress={() =&gt; handleBuy(p)}&gt;
          &lt;Text&gt;{p.product.title}&lt;/Text&gt;
          &lt;Text&gt;{p.product.priceString}&lt;/Text&gt;   {/* localized */}
        &lt;/Pressable&gt;
      ))}
      &lt;Pressable onPress={restore}&gt;
        &lt;Text&gt;Restore Purchases&lt;/Text&gt;
      &lt;/Pressable&gt;
      &lt;Text style={{ fontSize: 11 }}&gt;
        Subscriptions auto-renew unless cancelled at least 24h before period end…
      &lt;/Text&gt;
    &lt;/View&gt;
  );
}
</code></pre>

<h3>Entitlement gate</h3>
<pre><code class="language-tsx">const [hasPremium, setHasPremium] = useState(false);

useEffect(() =&gt; {
  Purchases.addCustomerInfoUpdateListener((info) =&gt; {
    setHasPremium(!!info.entitlements.active['premium']);
  });
  Purchases.getCustomerInfo().then((info) =&gt; {
    setHasPremium(!!info.entitlements.active['premium']);
  });
}, []);

return hasPremium ? &lt;PremiumFeature /&gt; : &lt;Paywall /&gt;;
</code></pre>

<h3>Native StoreKit 2 (no wrapper) — iOS</h3>
<pre><code class="language-swift">import StoreKit

let products = try await Product.products(for: ["com.myapp.premium_monthly", "com.myapp.premium_yearly"])

// Buy
let result = try await products[0].purchase()
switch result {
  case .success(let verification):
    let transaction = try checkVerified(verification)
    await transaction.finish()
    // Send transaction.jwsRepresentation to your backend
  case .userCancelled, .pending:
    break
  @unknown default:
    break
}

// Listen for renewals
for await update in Transaction.updates {
  if let transaction = try? checkVerified(update) {
    // POST to backend
    await transaction.finish()
  }
}
</code></pre>

<h3>Native Google Play Billing — Android</h3>
<pre><code class="language-kotlin">val billingClient = BillingClient.newBuilder(context)
  .setListener(purchasesUpdatedListener)
  .enablePendingPurchases()
  .build()

billingClient.startConnection(...)

val params = QueryProductDetailsParams.newBuilder()
  .setProductList(listOf(
    QueryProductDetailsParams.Product.newBuilder()
      .setProductId("premium_monthly")
      .setProductType(BillingClient.ProductType.SUBS)
      .build()
  )).build()

val productDetails = billingClient.queryProductDetails(params)

val flowParams = BillingFlowParams.newBuilder()
  .setProductDetailsParamsList(listOf(/*...*/))
  .build()

billingClient.launchBillingFlow(activity, flowParams)
</code></pre>

<h3>Server-side receipt validation (Apple, Node)</h3>
<pre><code class="language-ts">// Express handler that the app POSTs to with the raw receipt
import fetch from 'node-fetch';

app.post('/iap/apple/validate', async (req, res) =&gt; {
  const { receipt } = req.body;
  const body = {
    'receipt-data': receipt,
    password: process.env.APPLE_SHARED_SECRET,
    'exclude-old-transactions': true,
  };

  // Try production first; fall back to sandbox if status === 21007
  let response = await fetch('https://buy.itunes.apple.com/verifyReceipt', {
    method: 'POST', body: JSON.stringify(body),
  }).then(r =&gt; r.json());
  if (response.status === 21007) {
    response = await fetch('https://sandbox.itunes.apple.com/verifyReceipt', {
      method: 'POST', body: JSON.stringify(body),
    }).then(r =&gt; r.json());
  }

  if (response.status !== 0) return res.status(400).json({ error: response.status });

  const latestReceipt = response.latest_receipt_info?.[0];
  await db.userSubs.upsert({
    user_id: req.user.id,
    product_id: latestReceipt.product_id,
    transaction_id: latestReceipt.transaction_id,
    expires_at: new Date(parseInt(latestReceipt.expires_date_ms)),
    auto_renew: response.pending_renewal_info?.[0]?.auto_renew_status === '1',
    raw: response,
  });

  res.json({ ok: true });
});
</code></pre>

<h3>Server-side receipt validation (Google, Node)</h3>
<pre><code class="language-ts">import { google } from 'googleapis';
const androidPublisher = google.androidpublisher('v3');

app.post('/iap/google/validate', async (req, res) =&gt; {
  const { packageName, productId, purchaseToken, type } = req.body;

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT!),
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });
  google.options({ auth });

  const result = type === 'subs'
    ? await androidPublisher.purchases.subscriptions.get({ packageName, subscriptionId: productId, token: purchaseToken })
    : await androidPublisher.purchases.products.get({ packageName, productId, token: purchaseToken });

  // Persist
  await db.userSubs.upsert({...});
  res.json({ ok: true });
});
</code></pre>

<h3>Apple App Store Server Notifications (V2)</h3>
<pre><code class="language-ts">// Webhook URL configured in App Store Connect
app.post('/iap/apple/webhook', async (req, res) =&gt; {
  const { signedPayload } = req.body;
  // Verify JWS signature with Apple's public key
  const decoded = await verifyAppleJWS(signedPayload);

  switch (decoded.notificationType) {
    case 'DID_RENEW':
      await markRenewed(decoded);
      break;
    case 'EXPIRED':
      await markExpired(decoded);
      break;
    case 'REFUND':
      await revokeEntitlement(decoded);
      break;
    case 'DID_CHANGE_RENEWAL_STATUS':
      await updateAutoRenew(decoded);
      break;
  }

  res.status(200).end();
});
</code></pre>

<h3>Google Real-Time Developer Notifications</h3>
<p>Wired through Pub/Sub: Google publishes JSON to your topic; your service consumes the topic and updates DB. Same pattern: subscription_state_change → upsert.</p>

<h3>Restore Purchases</h3>
<pre><code class="language-tsx">async function handleRestore() {
  setRestoring(true);
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    if (customerInfo.entitlements.active['premium']) {
      Toast.show({ message: 'Premium restored.' });
    } else {
      Toast.show({ message: 'No active subscription found.' });
    }
  } finally {
    setRestoring(false);
  }
}
</code></pre>
<p>Apple <strong>requires</strong> a "Restore Purchases" button on every paywall. Without one, your app gets rejected during review.</p>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: A complete paywall</h3>
<pre><code class="language-tsx">function PremiumPaywall({ onPurchased }: { onPurchased: () =&gt; void }) {
  const [offering, setOffering] = useState&lt;PurchasesOffering | null&gt;(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() =&gt; {
    Purchases.getOfferings().then(o =&gt; setOffering(o.current));
  }, []);

  if (!offering) return &lt;ActivityIndicator /&gt;;

  const monthly = offering.monthly;
  const yearly = offering.annual;

  const buy = async (pkg: PurchasesPackage) =&gt; {
    setLoading(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      logEvent('iap_purchased', { product_id: pkg.product.identifier, price: pkg.product.price });
      if (customerInfo.entitlements.active['premium']) onPurchased();
    } catch (e: any) {
      if (!e.userCancelled) {
        Sentry.captureException(e);
        Toast.show({ message: 'Purchase failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    &lt;View&gt;
      &lt;Text style={styles.title}&gt;Go Premium&lt;/Text&gt;
      &lt;Bullet&gt;Unlimited matches&lt;/Bullet&gt;
      &lt;Bullet&gt;Ad-free&lt;/Bullet&gt;
      &lt;Bullet&gt;Priority support&lt;/Bullet&gt;

      {yearly &amp;&amp; (
        &lt;PricingTile
          title="Yearly (best value)"
          price={yearly.product.priceString}
          subtitle="2 months free"
          onPress={() =&gt; buy(yearly)}
          loading={loading}
        /&gt;
      )}
      {monthly &amp;&amp; (
        &lt;PricingTile
          title="Monthly"
          price={monthly.product.priceString}
          onPress={() =&gt; buy(monthly)}
        /&gt;
      )}

      &lt;Pressable onPress={async () =&gt; {
        setRestoring(true);
        try {
          const { customerInfo } = await Purchases.restorePurchases();
          if (customerInfo.entitlements.active['premium']) onPurchased();
          else Toast.show({ message: 'No active subscription found.' });
        } finally {
          setRestoring(false);
        }
      }}&gt;
        &lt;Text&gt;{restoring ? 'Restoring…' : 'Restore Purchases'}&lt;/Text&gt;
      &lt;/Pressable&gt;

      &lt;Text style={styles.legal}&gt;
        Subscriptions auto-renew unless cancelled at least 24h before the end of the current period.
        Manage in your account settings. By tapping Subscribe you agree to our Terms and Privacy Policy.
      &lt;/Text&gt;
    &lt;/View&gt;
  );
}
</code></pre>

<h3>Example 2: Server-side webhook for renewals</h3>
<pre><code class="language-ts">// /webhooks/apple
async function handleAppleNotification(notification: AppleNotification) {
  const transaction = decodeJWS(notification.signedTransactionInfo);
  const renewalInfo = decodeJWS(notification.signedRenewalInfo);

  await db.userSubs.update({
    where: { transaction_id: transaction.originalTransactionId },
    data: {
      expires_at: new Date(transaction.expiresDate),
      auto_renew: renewalInfo.autoRenewStatus === 1,
      product_id: transaction.productId,
      last_event: notification.notificationType,
      raw_payload: notification,
      updated_at: new Date(),
    },
  });

  // Optional: send a silent push to the device so the app refreshes entitlement
  await pushService.sendSilentPush(transaction.appAccountToken /* user id */, { kind: 'iap_refresh' });
}
</code></pre>

<h3>Example 3: Cross-platform consolidation</h3>
<pre><code class="language-text">User starts on iOS — buys Premium Monthly via App Store.
User installs the Android app, signs in with the same email.
User now has Premium on Android too because:
  - The iOS purchase was sent to your backend.
  - Backend stored entitlement = "premium" tied to user_id.
  - Android app reads entitlement from backend on login.
  - Apple bills the user once (iOS), Android side just unlocks features.

Caveat: Apple/Google enforce that you cannot sell "Android Premium" via Stripe and unlock iOS — the iOS unlock must come from an App Store purchase. But you can sell once and unlock both platforms IF the original purchase happens on each platform's billing system OR via web (in some cases).
</code></pre>

<h3>Example 4: Pending purchase (Google)</h3>
<pre><code class="language-tsx">// On Android, parents can require child purchases be approved → "pending"
// Don't grant entitlement until purchase resolves
useEffect(() =&gt; {
  const sub = Purchases.addCustomerInfoUpdateListener((info) =&gt; {
    if (info.entitlements.active['premium']) grantPremium();
  });
  return sub.remove;
}, []);
</code></pre>

<h3>Example 5: Refund flow</h3>
<pre><code class="language-text">User submits refund via App Store / Google Play.
Apple/Google sends webhook (REFUND / SUBSCRIPTION_REVOKED).
Server marks user.has_premium = false immediately.
Optional: send a silent push so the app refreshes its UI.
</code></pre>
<p>Don't wait for the next app launch to detect refunds — that's "stolen" usage time.</p>

<h3>Example 6: Promo codes</h3>
<pre><code class="language-tsx">// Apple Promo Codes for in-app purchase (App Store Connect → Subscriptions → Promo Codes)
// User redeems via App Store; the next purchase event reflects the promo.
// In RevenueCat, this is automatic; for native, you must look at offer-related fields in the receipt.
</code></pre>

<h3>Example 7: Free trial without payment-method</h3>
<pre><code class="language-text">Apple Introductory Offers:
  - Free Trial (e.g., 7 days)
  - Pay As You Go (reduced price for X period)
  - Pay Up Front (reduced flat fee for X period)

iOS sandbox replicates these on accelerated clock.
The offerEligibility heuristic: hasn't subscribed before in this group.
</code></pre>

<h3>Example 8: Family Sharing edge case</h3>
<pre><code class="language-text">User A buys "Premium Yearly" with Family Sharing enabled.
User A's family member B opens the app, signs in with their own user_id.
On B's device, StoreKit reports an active subscription transaction (from A).
RevenueCat treats both as entitled to "premium."

Implication: your DB now has two user_ids tied to one transaction.
Decide: do you want to grant entitlement to both? (RevenueCat default: yes.)
</code></pre>

<h3>Example 9: Non-consumable + multiple devices</h3>
<pre><code class="language-tsx">// User buys "Pro Pack" once on iPhone.
// They install on iPad with same Apple ID.
// On iPad, "Restore Purchases" returns the same transaction.
// Your backend already has the entitlement; iPad just reads it.
</code></pre>

<h3>Example 10: A/B-testing paywall design</h3>
<pre><code class="language-tsx">function Paywall() {
  const { config } = useExperiment('paywall_design');
  const variant = config.get('variant', 'control');

  if (variant === 'highlighted_yearly') return &lt;PaywallYearlyHighlight /&gt;;
  if (variant === 'monthly_first') return &lt;PaywallMonthlyFirst /&gt;;
  return &lt;PaywallControl /&gt;;
}

// Track conversion via the SAME 'iap_purchased' event so funnels by variant work.
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Sandbox vs production</h3>
<p>Apple's <code>verifyReceipt</code> with a sandbox receipt against production endpoint returns status <code>21007</code>; you must fall back to sandbox endpoint. Wrap as a try-prod-then-sandbox pattern. Ignoring this means TestFlight purchases never validate.</p>

<h3>Receipt size</h3>
<p>iOS receipts can be &gt; 100KB. If you store them raw, size up your DB column. Server should treat them as opaque blobs, not parse client-side.</p>

<h3>Pending and deferred (Google)</h3>
<p>Pending: parent approval, slow card. Deferred: legacy iOS Ask-to-Buy. Don't grant entitlement until status flips to <code>PURCHASED</code>. Listen for purchase updates on app start to catch ones that resolved while the app was closed.</p>

<h3>Multiple in-flight purchases</h3>
<p>User taps Buy twice rapidly. Two purchase flows fire. RevenueCat handles deduplication; native APIs don't always. Disable the button on tap; don't unblock until result.</p>

<h3>Refund of consumable</h3>
<p>iOS lets users refund <em>consumables</em> too. If they bought 1000 coins and got refunded, you must claw back. The webhook fires; revoke. Server is the only authority.</p>

<h3>Subscription upgrade / downgrade</h3>
<p>User upgrades from Monthly to Yearly:</p>
<ul>
  <li>iOS: prorated; the new sub starts with credit; the original is cancelled.</li>
  <li>Google: configurable proration mode (immediate, deferred, charge difference).</li>
</ul>
<p>The new transaction has a different <code>productId</code> but the same <code>originalTransactionId</code>. Track the latest active product per user.</p>

<h3>Family Sharing + per-user receipt</h3>
<p>Family member opens the app. StoreKit returns transaction tied to A. Your backend should map: <code>(originalTransactionId, appAccountToken)</code> — the latter is your user_id, the former is shared. Use <code>appAccountToken</code> when initiating purchase (StoreKit 2) so each family member's purchases tag with their own user_id.</p>

<h3>Cross-platform sub conflict</h3>
<p>User has iOS sub (renews via Apple). Same user signs in on Android. They tap "Subscribe" again. Now they have two active subs from two billing systems for the same entitlement. Your UI should:</p>
<ul>
  <li>Detect existing entitlement on login.</li>
  <li>Show "You're already subscribed via Apple. Manage in App Store."</li>
</ul>

<h3>Network blip during purchase</h3>
<p>Platform charged; app crashed before receipt sent to server. Recovery:</p>
<ol>
  <li>App restart: StoreKit 2's <code>Transaction.unfinished</code> / Play Billing's <code>queryPurchases</code> returns the unfinished transaction.</li>
  <li>App sends to backend.</li>
  <li>Backend validates and grants entitlement.</li>
  <li>App calls <code>finish()</code> to acknowledge.</li>
</ol>
<p>If you skip step 4, Apple/Google keep redelivering the transaction.</p>

<h3>Acknowledge / Finish (Google &amp; Apple)</h3>
<p>Google requires you to <code>acknowledgePurchase</code> within 3 days, or the purchase auto-refunds. Apple StoreKit 2 requires <code>transaction.finish()</code> to stop redelivery. <strong>Always</strong> acknowledge AFTER server confirms the entitlement was persisted — never before, or you risk granting access on a transient server failure.</p>

<h3>Currency conversion</h3>
<p>You set tier = "Tier 4" (~$4.99). Brazil sees R$24.90; Japan sees ¥600. Apple/Google convert. Net to you in your developer account currency, after their cut and local taxes. Don't try to display "your" price; show the localized one from the SDK.</p>

<h3>Tax behavior</h3>
<p>VAT, GST, sales tax are withheld at source. Your reports show net. Some regions are gross-of-tax (e.g., New York's tax is added to the price the user pays); some are net (Apple takes it out). Read each platform's tax docs.</p>

<h3>Free → paid migration</h3>
<p>If you change a paid feature to free, existing subscribers have no rebate path. Conversely, taking a free feature behind a paywall mid-cycle can trigger reviews/refund waves. Communicate clearly; honor active subs.</p>

<h3>Subscription groups (Apple)</h3>
<p>All subs in a group are mutually exclusive — user can only have one. Use a single group for monthly + yearly + lifetime. If you have unrelated tiers ("Pro" and "Family"), they go in different groups, and a user can have both.</p>

<h3>Sandbox renewals</h3>
<p>Sandbox accelerates: 1 year subscription in 1 hour; renews up to 6 times then stops. Real renewals on production never accelerate. Test the renewal handler in sandbox; verify in early production rollout.</p>

<h3>Country availability</h3>
<p>Some countries don't allow certain product types (e.g., gambling-adjacent). Some require specific local terms. Localize App Store Connect listings and pricing tiers per region.</p>

<h3>Outage / maintenance</h3>
<p>App Store goes down occasionally. Your purchase API should fail gracefully, not crash. Show a user-friendly retry; the next purchase attempt usually picks up.</p>

<h3>Receipt for an account on a different device</h3>
<p>User logs into their account on a colleague's iPhone. The Apple ID on that phone is the colleague's. StoreKit returns the colleague's transactions, not your user's. You must reconcile: the receipt's <code>originalTransactionId</code> tied to <code>appAccountToken</code> is the truth — not "what's on this phone."</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: Trusting client-only validation</h3>
<pre><code class="language-tsx">// BAD — checks the receipt locally, grants entitlement
const r = await Purchases.purchasePackage(pkg);
if (r.customerInfo.entitlements.active['premium']) {
  await db.localGrant.set('premium', true);   // device-local cache only
}
// User toggles offline mode, edits storage, crashes the SDK.
// They have premium without paying.

// GOOD — server confirms entitlement
const granted = await api.checkEntitlement(user.id);
if (granted) showPremium();
</code></pre>

<h3>Bug 2: Not falling back to sandbox</h3>
<pre><code class="language-ts">// BAD — TestFlight users always fail validation
fetch('https://buy.itunes.apple.com/verifyReceipt', ...)

// GOOD — try prod, on 21007 retry with sandbox
</code></pre>

<h3>Bug 3: Double-acknowledge race</h3>
<p>You acknowledge before the server confirms. Server fails. User has been charged but you've told Google "all good." User tries again — duplicate purchase. <strong>Always</strong> acknowledge after server-side success.</p>

<h3>Bug 4: Not handling refund webhook</h3>
<p>User got a refund. Webhook fires. Your handler 500s. They keep using premium. Always make the webhook handler idempotent and resilient; reply 200 only when state is durably written.</p>

<h3>Bug 5: <code>userCancelled</code> shown as error</h3>
<pre><code class="language-tsx">// BAD
try { await Purchases.purchasePackage(p); }
catch (e) { Sentry.captureException(e); }   // every cancel = noise

// GOOD
catch (e: any) {
  if (!e.userCancelled) Sentry.captureException(e);
}
</code></pre>

<h3>Bug 6: Localized price display by hand</h3>
<pre><code class="language-tsx">// BAD — math goes wrong; missing locale-specific symbols
&lt;Text&gt;${price.toFixed(2)} / month&lt;/Text&gt;

// GOOD
&lt;Text&gt;{product.priceString}&lt;/Text&gt;   // platform-localized
</code></pre>

<h3>Bug 7: Subscription gate without grace handling</h3>
<pre><code class="language-tsx">// BAD — kicks user out the millisecond billing fails
if (sub.status === 'active') showPremium();
else showPaywall();

// GOOD — respect grace + cancellation-but-still-paid
if (['active', 'in_grace_period', 'cancelled_until_period_end'].includes(sub.status)) {
  showPremium();
}
</code></pre>

<h3>Bug 8: Hardcoded product IDs</h3>
<pre><code class="language-tsx">// BAD
await Purchases.purchaseProduct('com.myapp.premium');

// GOOD — drive from server config so you can A/B-test pricing
const products = await api.fetchProductCatalog();
</code></pre>

<h3>Bug 9: Forgetting to call logIn / logOut on RevenueCat</h3>
<p>RevenueCat anonymous user gets entitlement. User signs into your app. You don't call <code>Purchases.logIn(userId)</code>. Now RevenueCat has anonymous entitlement; your DB has nothing tied to user_id. Restore on a fresh install fails.</p>

<h3>Bug 10: Treating webhooks as best-effort</h3>
<p>Webhook delivery isn't guaranteed (rare, but happens). Your nightly job should reconcile by polling for any sub whose <code>expires_at</code> is in the past with no matching renewal event.</p>

<h3>Anti-pattern 1: Hiding "Restore Purchases"</h3>
<p>Putting it 3 levels deep in Settings → users can't find it → support tickets. Surface on every paywall.</p>

<h3>Anti-pattern 2: Ambiguous trial messaging</h3>
<p>"Free 7 days" — but small print says "$9.99/month after." Apple/Google have rejected apps for unclear trial wording. State trial length and post-trial price loudly.</p>

<h3>Anti-pattern 3: A/B-testing prices on existing subscribers</h3>
<p>Existing subs are grandfathered at their original price. Don't expose them to new pricing in upgrade flows; it confuses and alienates them.</p>

<h3>Anti-pattern 4: Not testing in sandbox before release</h3>
<p>Subscription bugs surface only when renewals fire. By the time production users hit them, you've shipped a regression to all subs.</p>

<h3>Anti-pattern 5: Side-loading payment links</h3>
<p>Apple bans "Buy on the web for cheaper" links inside the app. EU DMA changes (2024+) allow this with conditions in the EU only. Outside those regions, this gets you removed from the store.</p>

<h3>Anti-pattern 6: Storing receipts client-side as the source of truth</h3>
<p>Lose phone, lose entitlement. Always sync to backend.</p>

<h3>Anti-pattern 7: One paywall fits all</h3>
<p>Offering monthly $9.99 to a budget-tier-country user gets you crickets. Localize, segment, A/B test.</p>

<h3>Anti-pattern 8: Forgetting auto-renew small print</h3>
<p>App Store guidelines require disclosing auto-renew terms inline at purchase, not just in the EULA. Missing this = rejection.</p>

<h3>Anti-pattern 9: Treating IAP analytics as separate from product analytics</h3>
<p>"What's the conversion rate from view-paywall → purchase?" requires the same event pipeline. Tag IAP events with the same user_id so funnels work.</p>

<h3>Anti-pattern 10: Going DIY on receipt validation when you don't have to</h3>
<p>RevenueCat's free tier covers most apps. You're trading a few hundred bucks at scale for entire categories of bugs you'd otherwise own. Most teams should not roll their own.</p>
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
    <tr><td><em>Why must digital purchases use IAP?</em></td><td>Apple/Google policy; physical/services may use other processors.</td></tr>
    <tr><td><em>What's the cut?</em></td><td>30% standard; 15% in year 2 of subs and small-business tier; reduced under EU DMA.</td></tr>
    <tr><td><em>Three product types?</em></td><td>Consumable, non-consumable, auto-renewing subscription.</td></tr>
    <tr><td><em>Why server-side validation?</em></td><td>Client receipts can be forged; Apple/Google are the only authority.</td></tr>
    <tr><td><em>What's an entitlement?</em></td><td>The feature you unlock; multiple products can grant the same entitlement.</td></tr>
    <tr><td><em>What are S2S notifications?</em></td><td>Real-time webhooks for renewals, cancels, refunds — drive your DB.</td></tr>
    <tr><td><em>Why is Restore Purchases mandatory?</em></td><td>Apple App Review rejects without it; users need it after reinstall / new device.</td></tr>
    <tr><td><em>Sandbox vs production?</em></td><td>Different endpoints; status 21007 means "this is a sandbox receipt."</td></tr>
    <tr><td><em>What's a grace period?</em></td><td>Window after billing fails when the user retains entitlement; OS retries the charge.</td></tr>
    <tr><td><em>What's RevenueCat for?</em></td><td>Wraps StoreKit + Play Billing, handles validation, webhooks, entitlements, analytics.</td></tr>
    <tr><td><em>Family Sharing implications?</em></td><td>Non-consumables and subs share by default; one transaction can entitle multiple users.</td></tr>
    <tr><td><em>How do you measure subscription health?</em></td><td>MRR, churn, trial-to-paid, refund rate, LTV — all server-derived.</td></tr>
  </tbody>
</table>

<h3>Live design prompts</h3>
<ol>
  <li><em>"Design the IAP system for a subscription-based fitness app."</em>
    <ul>
      <li>Products: monthly, yearly, lifetime (non-consumable).</li>
      <li>Free trial 7 days (Apple intro offer).</li>
      <li>Server: validate receipts, persist, webhook handlers, daily reconciliation cron.</li>
      <li>Entitlement: <code>premium</code> unlocks all features; check on every API call.</li>
      <li>Restore on fresh install or login.</li>
      <li>Webhook for refunds → revoke immediately.</li>
      <li>Cross-platform: iOS purchase grants Android premium via shared user_id.</li>
    </ul>
  </li>
  <li><em>"How would you build the receipt validation layer?"</em>
    <ul>
      <li>Endpoint <code>POST /iap/validate</code>.</li>
      <li>Client sends raw receipt + platform.</li>
      <li>Server posts to Apple/Google verify API.</li>
      <li>On 21007 fall back to sandbox.</li>
      <li>Persist in <code>user_subs</code> with all relevant fields.</li>
      <li>Webhook handler is idempotent; processes events in order.</li>
      <li>Daily reconciliation: any sub whose <code>expires_at &lt; now</code> with no renewal — query Apple/Google for current state.</li>
    </ul>
  </li>
  <li><em>"What if the server is down during purchase?"</em>
    <ul>
      <li>Apple/Google still charge; transaction is "unfinished."</li>
      <li>Don't <code>finish()</code> until your server confirms entitlement.</li>
      <li>On next launch, query <code>Transaction.unfinished</code> / <code>queryPurchases</code> and retry server validation.</li>
      <li>If repeatedly failing: alert user, queue for retry, escalate.</li>
    </ul>
  </li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>App grants premium based on local <code>customerInfo</code> only — server-side bypass possible.</li>
  <li>Always validates against production endpoint — TestFlight/sandbox users always fail.</li>
  <li>Restore button missing — App Store rejection.</li>
  <li>Refund webhook returns 500 on duplicate event ID — webhook handler must be idempotent.</li>
  <li>Subscription gate ignores grace period — kicks paying user out for 1 hour while card retries.</li>
  <li>App displays prices computed manually — wrong currency / locale; use <code>product.priceString</code>.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Server-truth discipline</td><td>You volunteer "server validates and is the source of truth" before being asked.</td></tr>
    <tr><td>Webhook fluency</td><td>You name S2S events and discuss idempotency.</td></tr>
    <tr><td>Restore + cross-platform</td><td>You include them in every paywall design without prompting.</td></tr>
    <tr><td>Tooling defense</td><td>You can defend RevenueCat vs DIY based on team size and operational readiness.</td></tr>
    <tr><td>Awareness of policy traps</td><td>You name Apple's billing requirement, alternative processors, EU DMA exception.</td></tr>
    <tr><td>Sandbox testing rigor</td><td>You volunteer testing renewals on accelerated clock before release.</td></tr>
    <tr><td>UX polish</td><td>You include trial disclosure, restore button, pending state, error handling.</td></tr>
  </tbody>
</table>

<h3>Mobile-specific deep questions</h3>
<ul>
  <li><em>"How do you handle a user who subscribes on iOS, then opens the Android app?"</em> — RevenueCat or your own backend keys entitlements to <code>user_id</code>; Android queries by user_id, finds the iOS entitlement, unlocks features without billing on Android.</li>
  <li><em>"What's <code>appAccountToken</code> for?"</em> — StoreKit 2 field you set when initiating a purchase to link the transaction to your user_id; survives Family Sharing.</li>
  <li><em>"Family Sharing — premium for free?"</em> — If enabled and not disabled per-product, family members share non-consumables and subs. RevenueCat treats both as entitled unless you explicitly disable Family Sharing for the SKU.</li>
  <li><em>"How do you reconcile a missed webhook?"</em> — Daily cron: find subs with stale state, query Apple/Google directly, refresh DB.</li>
  <li><em>"How do you handle changing prices for existing subscribers?"</em> — Apple's "subscription price change" flow (requires user consent for increases &gt; certain %). Google has analogous flow. Communicate clearly; existing subs grandfathered until they accept.</li>
  <li><em>"What metrics measure subscription health?"</em> — MRR, ARPU, churn, retention by cohort, trial-to-paid conversion, refund rate, recovery rate from billing fail.</li>
</ul>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Audit purchase flow: server validates? Webhook handlers running and idempotent? Restore tested?</li>
  <li>Verify sandbox + production paths both work end-to-end.</li>
  <li>Check refund handling — pull a sample refund webhook from logs, trace its path.</li>
  <li>Audit grace period handling — does the app hold premium during retry?</li>
  <li>Add monitoring: webhook lag, validation error rate, daily reconciliation discrepancies.</li>
  <li>Verify cross-platform entitlement reads from server, not local cache.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd add A/B testing on paywall variants and price points (intro offers vs flat trial)."</li>
  <li>"I'd add server-side analytics for trial → paid conversion to optimize trial length."</li>
  <li>"I'd integrate Sentry alerts for webhook failures and validation errors."</li>
  <li>"I'd build a 'win-back' offer flow for users who cancelled but haven't expired yet."</li>
  <li>"I'd add region-specific pricing experiments to find local maxima."</li>
  <li>"I'd add a 'subscription management' screen that deep-links to App Store / Play subscription settings."</li>
</ul>
`
    }
  ]
});
