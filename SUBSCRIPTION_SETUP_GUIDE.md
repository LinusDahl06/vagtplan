# ScheduHub Subscription Setup Guide

This guide walks you through setting up real paid subscriptions for ScheduHub on both Google Play Store and Apple App Store.

## Overview

ScheduHub uses the `expo-in-app-purchases` library to handle subscriptions across both platforms. The app has three subscription tiers:

- **Basic**: Free tier (1 workspace, 3 employees)
- **Extended**: Paid tier (3 workspaces, 15 employees)
  - Monthly: €15/month
  - Annual: €150/year (€12.50/month equivalent)
- **Unlimited**: Paid tier (unlimited workspaces & employees)
  - Monthly: €35/month
  - Annual: €360/year (€30/month equivalent)

## Important Product IDs

These IDs are configured in `src/utils/subscriptionService.js` and **must match exactly** what you set up in the stores:

```
EXTENDED_MONTHLY:   scheduhub_extended_monthly
EXTENDED_ANNUAL:    scheduhub_extended_annual
UNLIMITED_MONTHLY:  scheduhub_unlimited_monthly
UNLIMITED_ANNUAL:   scheduhub_unlimited_annual
```

---

## Google Play Store Setup

### Prerequisites
- Google Play Console account
- Your app must be created in the console
- Bundle ID: `com.lincware.scheduhub`

### Step 1: Access Monetization Setup

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your ScheduHub app
3. Navigate to **Monetize** → **Subscriptions** in the left sidebar

### Step 2: Create Extended Monthly Subscription

1. Click **Create subscription**
2. Fill in the details:

   **Product ID**: `scheduhub_extended_monthly`
   - ⚠️ This MUST match exactly - cannot be changed after creation

   **Name**: ScheduHub Extended (Monthly)

   **Description**:
   ```
   Upgrade to Extended plan for more workspaces and employees.
   - 3 workspaces
   - Up to 15 employees per workspace
   - All features included
   ```

3. Click **Continue to pricing**

### Step 3: Set Extended Monthly Pricing

1. Select your base country/region (e.g., Europe)
2. Set your price: **€15.00/month**
   - Google takes 15-30% commission (15% for first $1M annually, then 30%)
3. Set up other countries (Google will auto-convert or you can set custom prices)
4. Configure **Subscription renewal type**: Auto-renewing
5. Set **Billing period**: 1 month
6. Click **Continue** and **Activate**

### Step 4: Create Extended Annual Subscription

Repeat steps 2-3 with:

**Product ID**: `scheduhub_extended_annual`

**Name**: ScheduHub Extended (Annual)

**Pricing**: **€150.00/year** (€12.50/month equivalent - 17% savings)

**Billing period**: 1 year

### Step 5: Create Unlimited Monthly Subscription

**Product ID**: `scheduhub_unlimited_monthly`

**Name**: ScheduHub Unlimited (Monthly)

**Description**:
```
Get unlimited workspaces and employees with the Unlimited plan.
- Unlimited workspaces
- Unlimited employees per workspace
- All features included
- Priority support
```

**Pricing**: **€35.00/month**

**Billing period**: 1 month

### Step 6: Create Unlimited Annual Subscription

**Product ID**: `scheduhub_unlimited_annual`

**Name**: ScheduHub Unlimited (Annual)

**Pricing**: **€360.00/year** (€30/month equivalent - 14% savings)

**Billing period**: 1 year

### Step 7: Activate Subscriptions

1. Review all four subscription products
2. Click **Activate** for each one
3. Subscriptions must be active before users can purchase them

### Step 8: Set Up License Testing (Optional but Recommended)

Before launching, test with test accounts:

1. Go to **Setup** → **License testing**
2. Add test Gmail accounts
3. These accounts can make test purchases without being charged
4. You can also test subscription cancellation, renewal, etc.

---

## Apple App Store Setup

### Prerequisites
- Apple Developer Account ($99/year)
- App created in App Store Connect
- Bundle ID: `com.lincware.scheduhub`
- Agreements, Tax, and Banking information completed

### Step 1: Access In-App Purchases

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select **My Apps** → **ScheduHub**
3. Click **In-App Purchases** tab
4. Click the **+** button to create a new in-app purchase

### Step 2: Create Extended Subscription

1. Select **Auto-Renewable Subscription**
2. Click **Create**

3. Fill in subscription group (create new if first subscription):
   - **Subscription Group Reference Name**: ScheduHub Subscriptions
   - **Subscription Group Name** (user-facing): ScheduHub Plans

4. Fill in subscription details:

   **Product ID**: `scheduhub_extended_monthly`
   - ⚠️ Must match exactly - cannot be changed

   **Reference Name**: ScheduHub Extended Monthly

   **Subscription Duration**: 1 month

5. Add **Subscription Localizations**:
   - **Subscription Display Name**: ScheduHub Extended
   - **Description**:
   ```
   Upgrade to Extended plan for more workspaces and employees.
   - 3 workspaces
   - Up to 15 employees per workspace
   - All features included
   ```

6. Set up **Subscription Pricing**:
   - Select your base country (e.g., United States)
   - Set price (recommended: $4.99 - $9.99/month)
   - Apple takes 15-30% commission (15% for first year, then 30%; or 15% for subscriptions under $1M annually)
   - Add other countries or use auto-generated prices

7. Click **Save**

### Step 3: Create Unlimited Subscription

Repeat step 2 with these details:

**Product ID**: `scheduhub_unlimited_monthly`

**Reference Name**: ScheduHub Unlimited Monthly

**Subscription Display Name**: ScheduHub Unlimited

**Description**:
```
Get unlimited workspaces and employees with the Unlimited plan.
- Unlimited workspaces
- Unlimited employees per workspace
- All features included
- Priority support
```

**Pricing**: Set higher than Extended (recommended: $14.99 - $29.99/month)

### Step 4: Set Up Subscription Group

1. In the **Subscription Group**, configure:
   - **Subscription Ranking**: Drag to order (Basic → Extended → Unlimited)
   - This affects how they appear in the App Store

### Step 5: Submit for Review

1. Both subscriptions need to be **Ready to Submit**
2. They will be reviewed when you submit your app
3. Make sure to prepare:
   - Screenshot showing the subscription features
   - Description of what users get

### Step 6: Sandbox Testing (Required)

Before launching, test with sandbox accounts:

1. Go to **Users and Access** → **Sandbox Testers**
2. Click **+** to add testers
3. Create test Apple IDs (can be fake emails like `test1@example.com`)
4. On your iOS device:
   - Settings → App Store → Sandbox Account
   - Sign in with sandbox tester account
5. Install your app via TestFlight
6. Test purchasing subscriptions (you won't be charged)

---

## Testing Your Implementation

### Test on Android

1. Build your app for testing:
   ```bash
   npx eas build --platform android --profile preview
   ```

2. Install on a device or use internal testing track on Google Play

3. Add your Google account to License Testing list

4. Open the app and go to Subscriptions screen

5. Try purchasing Extended subscription

6. Verify:
   - Purchase flow works
   - Subscription tier updates in Firestore
   - UI shows current tier correctly

### Test on iOS

1. Build for TestFlight:
   ```bash
   npx eas build --platform ios --profile preview
   ```

2. Upload to TestFlight

3. Install on a device with sandbox tester account signed in

4. Test the same flow as Android

5. Test "Restore Purchases" button (important for iOS)

---

## Important Notes

### Commission Rates

**Google Play**:
- 15% for first $1M in revenue per year
- 30% after $1M

**Apple App Store**:
- 15% for first year of subscription OR if under $1M/year
- 30% for subscriptions after first year (above $1M/year)

### Subscription Management

**Google Play**:
- Users manage subscriptions in Google Play Store
- You can provide a link: `https://play.google.com/store/account/subscriptions`

**Apple App Store**:
- Users manage in Settings → [User] → Subscriptions
- Or via App Store → Profile → Subscriptions

### Server-Side Verification (Recommended for Production)

For production, you should verify purchases on a backend server:

1. When a purchase is made, send the purchase token to your server
2. Your server verifies with Google/Apple APIs
3. Only grant subscription access after verification
4. This prevents fraud and hacked purchases

**Current Implementation**: The app updates Firestore directly (client-side). This works but is less secure. Consider adding server-side verification before launch.

### Firestore Security Rules

Make sure your Firestore rules prevent users from manually changing their subscription tier:

```javascript
// In firestore.rules
match /users/{userId} {
  allow read: if request.auth.uid == userId;
  allow update: if request.auth.uid == userId
    && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['subscriptionTier', 'purchaseToken', 'lastPurchaseDate']);
}
```

This prevents users from editing subscription-related fields manually.

---

## Troubleshooting

### "Product not available" error
- Verify product IDs match exactly in code and store
- Ensure subscriptions are activated/published
- Wait up to 24 hours after creating products
- Check if app bundle ID matches

### Purchase not processing
- Check device logs for error messages
- Verify Firebase connection is working
- Ensure user is authenticated
- Test with sandbox/test accounts first

### "No products found" when loading
- Verify expo-in-app-purchases is properly installed
- Check that product IDs are correct
- Ensure subscriptions are active in the stores
- Test on actual device (not simulator for iOS)

---

## Next Steps

1. **Set up products in Google Play Console** (follow steps above)
2. **Set up products in App Store Connect** (follow steps above)
3. **Test thoroughly** with sandbox/test accounts
4. **Add server-side verification** (recommended)
5. **Update Firestore security rules** (prevent manual tier changes)
6. **Build production app** and submit to stores
7. **Monitor subscription metrics** in store consoles

---

## Additional Resources

- [Google Play Billing Documentation](https://developer.android.com/google/play/billing)
- [Apple In-App Purchase Documentation](https://developer.apple.com/in-app-purchase/)
- [Expo In-App Purchases Documentation](https://docs.expo.dev/versions/latest/sdk/in-app-purchases/)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review store console documentation
3. Check expo-in-app-purchases GitHub issues
4. Contact Google/Apple developer support for store-specific issues
