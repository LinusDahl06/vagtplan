# Subscription System Updates - Summary

## Changes Made

### 1. Updated Subscription Limits

**Basic Tier** (Free):
- ❌ **OLD**: 1 workspace, 8 employees per workspace
- ✅ **NEW**: 1 workspace, **3 employees per workspace**

**Extended Tier** (Paid):
- Unchanged: 3 workspaces, 15 employees per workspace

**Unlimited Tier** (Paid):
- Unchanged: Unlimited workspaces & employees

### 2. Added Monthly & Annual Billing Options

Users can now choose between monthly and annual billing for paid tiers:

**Extended Tier Pricing**:
- **Monthly**: €15/month
- **Annual**: €150/year (€12.50/month - **17% savings**)

**Unlimited Tier Pricing**:
- **Monthly**: €35/month
- **Annual**: €360/year (€30/month - **14% savings**)

### 3. New Product IDs

You now need to create **4 subscription products** in Google Play Console and App Store Connect:

```
scheduhub_extended_monthly   - €15/month
scheduhub_extended_annual    - €150/year
scheduhub_unlimited_monthly  - €35/month
scheduhub_unlimited_annual   - €360/year
```

### 4. Updated User Experience

**When upgrading to a paid tier:**
1. User clicks "Upgrade" button
2. **NEW**: Dialog appears asking: "Select Billing Period"
   - Option 1: "Monthly - €15/month" (or €35 for Unlimited)
   - Option 2: "Annual - €150/year (€12.50/month)" (or €360/€30 for Unlimited)
3. User selects billing preference
4. Confirmation dialog shows final price
5. Platform payment sheet appears
6. Purchase is processed

**Subscription cards now show:**
- Tier name
- **NEW**: "From €12.50/month" (for annual pricing)
- **NEW**: "when billed annually" subtitle
- Features list
- Current usage

## Files Modified

### Core Files:
1. **src/utils/subscriptions.js**
   - Changed Basic tier: 8 → 3 employees
   - Added pricing info to SUBSCRIPTION_LIMITS

2. **src/utils/subscriptionService.js**
   - Added 4 product IDs (monthly + annual for each tier)
   - Updated PRODUCT_TO_TIER mapping
   - Added BILLING_PERIOD constants

3. **src/screens/SubscriptionScreen.js**
   - Added billing period selection flow
   - Added `handleBillingPeriodSelection()` function
   - Added `handlePurchaseWithPeriod()` function
   - Updated tier cards to show pricing
   - Added pricing display styles

### Translation Files:
4. **src/i18n/locales/en.json**
   - Added: selectBillingPeriod, chooseBillingPeriodMessage
   - Added: monthly, annual, from, perMonth, perYear, billedAnnually

5. **src/i18n/locales/da.json**
   - Danish translations for all new keys

### Documentation:
6. **SUBSCRIPTION_SETUP_GUIDE.md**
   - Updated to reflect 4 products (was 2)
   - Updated pricing to €15/€35 monthly and €150/€360 annual
   - Updated Basic tier to 3 employees
   - Added step-by-step for all 4 products

## What You Need to Do Next

### In Google Play Console:

Create **4 subscription products**:

1. **scheduhub_extended_monthly**
   - Price: €15.00
   - Billing period: 1 month

2. **scheduhub_extended_annual**
   - Price: €150.00
   - Billing period: 1 year

3. **scheduhub_unlimited_monthly**
   - Price: €35.00
   - Billing period: 1 month

4. **scheduhub_unlimited_annual**
   - Price: €360.00
   - Billing period: 1 year

### In App Store Connect:

Create the same **4 auto-renewable subscriptions** in the same subscription group.

## Revenue Breakdown

### Monthly Subscriptions:
- **Extended**: €15/month
  - After 15% commission: ~€12.75/month per user
  - After 30% commission: ~€10.50/month per user

- **Unlimited**: €35/month
  - After 15% commission: ~€29.75/month per user
  - After 30% commission: ~€24.50/month per user

### Annual Subscriptions:
- **Extended**: €150/year (€12.50/month equivalent)
  - After 15% commission: ~€127.50/year (~€10.63/month per user)
  - After 30% commission: ~€105/year (~€8.75/month per user)

- **Unlimited**: €360/year (€30/month equivalent)
  - After 15% commission: ~€306/year (~€25.50/month per user)
  - After 30% commission: ~€252/year (~€21/month per user)

### Annual vs Monthly (Your Revenue):
Encouraging users to choose annual billing gives them savings while you get:
- More predictable revenue
- Lower churn (committed for full year)
- Better lifetime value per customer

## Testing

The code is ready to use, but remember:
1. **In Expo Go**: Subscription screen works but purchases show "not available"
2. **In Development Build**: Full functionality with native modules
3. **After store setup**: Real purchases work with actual pricing

Run `npm start` to test the UI changes in Expo Go right now!

## Summary

✅ Basic tier now limits to 3 employees (was 8)
✅ Users can choose monthly or annual billing
✅ Annual billing offers 14-17% savings
✅ 4 product IDs configured in code
✅ All translations updated (English & Danish)
✅ Documentation updated
✅ Ready for store configuration

Next step: Set up the 4 products in Google Play Console and App Store Connect using the guide!
