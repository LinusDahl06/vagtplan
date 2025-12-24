# Quick Start: Deploy Vagtplan to App Stores

## TL;DR - What You Need to Do

Your app doesn't need "hosting" - it runs on users' phones. You need to:
1. Build it into app files
2. Submit to App Store & Play Store
3. Users download from stores

## Prerequisites (Sign Up First)

1. **Google Play Developer Account** - $25 one-time
   - https://play.google.com/console/signup

2. **Apple Developer Account** - $99/year
   - https://developer.apple.com/programs/

3. **Expo Account** (Free)
   - https://expo.dev/signup

## Step 1: Install EAS CLI (2 minutes)

```bash
npm install -g eas-cli
eas login
```

Enter your Expo credentials.

## Step 2: Build Your App (20 minutes)

### For Android (Start Here - Easier)

```bash
# Build APK for testing on your phone
eas build --platform android --profile preview
```

Wait 10-20 minutes. You'll get a download link. Install the APK on your Android phone to test.

### For iOS (Need Apple Developer Account)

```bash
# Build for App Store
eas build --platform ios --profile production
```

Wait 15-30 minutes. You'll get an IPA file.

## Step 3: Test Your Build

### Android
1. Download the APK file
2. Transfer to your Android phone
3. Install and test thoroughly

### iOS
1. Upload to TestFlight (via App Store Connect)
2. Install on iPhone
3. Test thoroughly

## Step 4: Submit to Stores

### Google Play Store

1. Go to https://play.google.com/console
2. Create new app
3. Fill in:
   - App name: "Vagtplan"
   - Description
   - Screenshots (at least 2)
   - Privacy policy URL (must host publicly first!)
4. Upload the AAB file:
   ```bash
   eas build --platform android --profile production
   ```
5. Submit for review

### Apple App Store

1. Go to https://appstoreconnect.apple.com
2. Create new app
3. Fill in:
   - App name: "Vagtplan"
   - Description
   - Screenshots (need for multiple iPhone sizes)
   - Privacy policy URL
4. Build uploads automatically or use:
   ```bash
   eas submit --platform ios
   ```
5. Submit for review

## What Each Command Does

```bash
# Development - test on your device while coding
npx expo start

# Preview build - test full app on device
eas build --platform android --profile preview

# Production build - submit to stores
eas build --platform android --profile production
eas build --platform ios --profile production

# Submit to stores (after building)
eas submit --platform android
eas submit --platform ios
```

## Before You Submit - Critical!

- [ ] Host Privacy Policy & Terms publicly (GitHub Pages, your website)
- [ ] Update URLs in SettingsScreen.js
- [ ] Test the APK/IPA thoroughly
- [ ] Have screenshots ready (2+ for Android, 3+ per device for iOS)
- [ ] Create app description
- [ ] Verify Firebase Security Rules are deployed

## Timeline

- **Build time**: 10-30 minutes per platform
- **Google Play review**: Same day to 7 days
- **Apple review**: 1-3 days
- **Total**: 1-2 weeks to go live

## Costs

- Google Play: $25 one-time
- Apple: $99/year
- Firebase: $0-25/month (generous free tier)
- EAS Builds: Free (30 builds/month)

## Common First-Time Issues

**"Where do I host the privacy policy?"**
- GitHub Pages (free): https://pages.github.com/
- Or your own website
- See LEGAL_IMPLEMENTATION_GUIDE.md

**"How do I get screenshots?"**
- Run app on device or emulator
- Take screenshots
- Or use tools like Figma/Canva to make nice ones

**"Do I need a Mac for iOS?"**
- No! EAS builds in the cloud
- You need Apple Developer account ($99/year)
- For final testing, borrow an iPhone or use TestFlight

**"Can I test before submitting?"**
- Yes! Use preview builds
- Android: Install APK directly
- iOS: Use TestFlight (free beta testing)

## Full Documentation

For complete details, see:
- **BUILD_AND_DEPLOY_GUIDE.md** - Comprehensive guide
- **LEGAL_IMPLEMENTATION_GUIDE.md** - Privacy policy setup
- Expo docs: https://docs.expo.dev/

## Quick Commands Reference

```bash
# First time setup
npm install -g eas-cli
eas login
eas build:configure

# Build for testing
eas build -p android --profile preview

# Build for production
eas build -p android --profile production
eas build -p ios --profile production

# Submit to stores
eas submit -p android
eas submit -p ios

# Check build status
eas build:list
```

## Need Help?

1. Check BUILD_AND_DEPLOY_GUIDE.md for detailed steps
2. Expo Discord: https://chat.expo.dev/
3. Expo Forums: https://forums.expo.dev/

Ready to build? Start with:
```bash
eas build --platform android --profile preview
```

Good luck! 🚀
