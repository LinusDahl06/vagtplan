# Testing Subscriptions - Quick Guide

## Current Status

The subscription payment system has been implemented, but **in-app purchases require native modules** that aren't available in Expo Go.

## How to Test

### Option 1: Test in Expo Go (Limited)

**What works:**
- ✅ The Subscription screen will load without crashing
- ✅ You can see all three subscription tiers
- ✅ The UI and layout are fully functional
- ✅ Downgrade to Basic tier works (free tier)

**What doesn't work:**
- ❌ Actual purchases (will show "not available" error)
- ❌ Product price loading from stores
- ❌ Restore purchases functionality

**To test in Expo Go:**
1. Open your app in Expo Go
2. Go to Settings → Manage Subscription
3. You'll see the three tiers but can't make real purchases
4. The upgrade buttons will show an error since the native module isn't available

### Option 2: Build Development Build (Recommended for Full Testing)

This creates a custom development app with native modules included.

**For Android:**

```bash
# Make sure Android emulator or device is connected
npx expo run:android
```

This will:
1. Build the app with native modules
2. Install it on your device/emulator
3. Start the Metro bundler
4. Enable full in-app purchase functionality

**For iOS:**

```bash
npx expo run:ios
```

**What works:**
- ✅ Everything works, including real purchases
- ✅ Product prices load from stores
- ✅ Purchase flow is functional
- ⚠️ **BUT** you need to set up products in store consoles first

### Option 3: Build Production APK for Real Device Testing

Build a production APK to test on actual devices with real store integration:

```bash
# Build APK for Android
npx eas build --platform android --profile preview

# After build completes, download and install the APK on your device
```

**For iOS:**
```bash
# Build for TestFlight
npx eas build --platform ios --profile preview
```

## Before You Can Accept Real Payments

You MUST configure subscription products in the stores first:

### Google Play Console Setup Required:

1. Go to Google Play Console → Monetize → Subscriptions
2. Create two products:
   - **Product ID:** `scheduhub_extended_monthly`
   - **Product ID:** `scheduhub_unlimited_monthly`
3. Set pricing for each
4. Activate the subscriptions

### App Store Connect Setup Required:

1. Go to App Store Connect → Your App → In-App Purchases
2. Create subscription group
3. Create two auto-renewable subscriptions:
   - **Product ID:** `scheduhub_extended_monthly`
   - **Product ID:** `scheduhub_unlimited_monthly`
4. Set pricing for each
5. Submit for review with your app

## Testing Flow

### In Development Build or Production Build:

1. **Open the app** (must be development build or production build, not Expo Go)
2. **Sign in** to your account
3. **Go to Settings** → Manage Subscription
4. **You should see:**
   - Three subscription tiers (Basic, Extended, Unlimited)
   - Your current tier highlighted
   - Upgrade buttons for other tiers

5. **Try upgrading:**
   - Click "Upgrade" on Extended or Unlimited
   - You'll see a confirmation showing the price (from store)
   - Click "Purchase"
   - The platform's payment sheet will appear
   - Complete the purchase
   - Your subscription tier should update automatically

6. **Test Restore Purchases (iOS mainly):**
   - Click the "Restore Purchases" button at the bottom
   - Any previous purchases will be restored
   - Your subscription tier will update to the highest tier found

### Testing with Sandbox Accounts:

**Google Play:**
1. Add test accounts in Google Play Console → Setup → License testing
2. Use these accounts to make test purchases
3. You won't be charged real money

**Apple App Store:**
1. Create sandbox testers in App Store Connect → Users and Access → Sandbox
2. Sign in with sandbox account on device
3. Make test purchases without real charges

## Current App Behavior

Since you haven't set up store products yet, when you try to purchase:

**In Expo Go:**
- Shows: "In-app purchases not available in this environment"

**In Development/Production Build (before store setup):**
- Shows: "This subscription is not available at the moment"
- This is because the product IDs don't exist in stores yet

**After Store Setup:**
- Full purchase flow works
- Real pricing is displayed
- Payments are processed through Google/Apple
- You receive money (minus 15-30% commission)

## Next Steps

1. ✅ Code is ready for subscriptions
2. ⏳ Set up products in Google Play Console (see [SUBSCRIPTION_SETUP_GUIDE.md](SUBSCRIPTION_SETUP_GUIDE.md))
3. ⏳ Set up products in App Store Connect (see [SUBSCRIPTION_SETUP_GUIDE.md](SUBSCRIPTION_SETUP_GUIDE.md))
4. ⏳ Build production APK/IPA
5. ⏳ Test with sandbox accounts
6. ⏳ Submit to stores
7. ✅ Start receiving payments!

## Summary

- **For UI testing:** Use Expo Go (limited, no real purchases)
- **For full testing:** Use `npx expo run:android` or build with EAS
- **For real payments:** Set up products in store consoles first
- **Product IDs are hardcoded** in `src/utils/subscriptionService.js` - they must match exactly in stores

The code is production-ready, but you need to complete the store configuration before users can actually purchase subscriptions.
