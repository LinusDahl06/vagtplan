# ScheduHub Production Build Guide

This guide will help you create production builds for both Android and iOS platforms.

## Prerequisites

1. **EAS CLI installed** (already done via `npm install -g firebase-tools`)
2. **Expo account** - Sign up at https://expo.dev if you haven't
3. **Google Play Console account** - For Android (required for AAB signing)
4. **Apple Developer account** - For iOS ($99/year)

---

## Step 1: Login to EAS

Open a new terminal window and run:

```bash
cd j:\Apps\vagtplan-new
npx eas-cli login
```

Enter your Expo credentials when prompted.

---

## Step 2: Configure EAS Project

If this is your first time building with EAS, you need to configure the project:

```bash
npx eas-cli build:configure
```

This will:
- Link your project to an Expo account
- Create or update `eas.json` configuration
- Set up your project for cloud builds

---

## Step 3: Build Android Production (AAB)

### Option A: Cloud Build (Recommended)

Build the Android App Bundle (AAB) for Google Play Store:

```bash
npx eas-cli build --platform android --profile production
```

**What happens:**
- EAS builds your app in the cloud
- Creates an AAB file optimized for Google Play Store
- Build typically takes 10-20 minutes
- You'll receive a download link when complete

**After build completes:**
1. Download the AAB file from the provided link
2. Move it to `j:\Apps\ScheduHub-Android\`
3. Rename it to something descriptive like `scheduhub-v1.0.0-production.aab`

### Option B: Local Build

If you prefer to build locally (requires Android Studio):

```bash
cd j:\Apps\vagtplan-new
npx expo run:android --variant release
```

The APK/AAB will be in:
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## Step 4: Build iOS Production (IPA)

### Option A: Cloud Build (Recommended)

Build the iOS IPA for App Store:

```bash
npx eas-cli build --platform ios --profile production
```

**Requirements:**
- Apple Developer account credentials
- EAS will prompt for:
  - Apple ID
  - App-specific password (create at appleid.apple.com)
  - Distribution certificate
  - Provisioning profile

**What happens:**
- EAS creates necessary certificates/profiles (or uses existing ones)
- Builds your app in the cloud
- Creates an IPA file ready for App Store
- Build typically takes 15-30 minutes

**After build completes:**
1. Download the IPA file from the provided link
2. Move it to `j:\Apps\ScheduHub-IOS\`
3. Rename it to something descriptive like `scheduhub-v1.0.0-production.ipa`

### Option B: Local Build (macOS only)

If you're on macOS with Xcode installed:

```bash
cd j:\Apps\vagtplan-new
npx expo run:ios --configuration Release
```

---

## Step 5: Verify Builds

### Android AAB Verification:

Check the AAB file details:
```bash
bundletool dump manifest --bundle=j:\Apps\ScheduHub-Android\scheduhub-v1.0.0-production.aab
```

### iOS IPA Verification:

The IPA should be signed with your Distribution certificate. You can verify by:
1. Right-click IPA → Get Info
2. Check file size (should be 20-50 MB typically)

---

## Alternative: Build Both Platforms Simultaneously

Build for both Android and iOS at once:

```bash
npx eas-cli build --platform all --profile production
```

---

## Troubleshooting

### "Not logged in" error
Run: `npx eas-cli login`

### "No project ID" error
Run: `npx eas-cli build:configure`

### Android build fails
- Check that `app.json` has correct `android.package`
- Ensure Firebase config is correct
- Check EAS build logs for specific errors

### iOS build fails
- Verify Apple Developer account is active ($99/year)
- Check that `ios.bundleIdentifier` matches your App Store Connect app
- Ensure you've created the app in App Store Connect first

### Firebase credentials
Make sure your `.env` file has all Firebase credentials set correctly.

---

## Build Output Locations

After downloading builds from EAS, organize them as follows:

**Android:**
```
j:\Apps\ScheduHub-Android\
├── scheduhub-v1.0.0-production.aab
└── README.md (with build notes)
```

**iOS:**
```
j:\Apps\ScheduHub-IOS\
├── scheduhub-v1.0.0-production.ipa
└── README.md (with build notes)
```

---

## Next Steps After Building

### For Android (Google Play Store):
1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app or select existing app
3. Navigate to **Release** → **Production**
4. Upload `scheduhub-v1.0.0-production.aab`
5. Complete store listing, content rating, pricing
6. Submit for review

### For iOS (App Store):
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create a new app or select existing app
3. Use **Transporter** app or **Xcode** to upload IPA
4. Complete app information, screenshots, pricing
5. Submit for review

---

## Build Status Monitoring

Check build status:
```bash
npx eas-cli build:list
```

View detailed build logs:
```bash
npx eas-cli build:view [BUILD_ID]
```

---

## Important Notes

1. **First-time builds** take longer as EAS sets up certificates
2. **Keep your credentials safe** - Don't commit them to Git
3. **Test builds** before submitting to stores
4. **Version numbers** should match in `app.json`:
   - `version`: "1.0.0"
   - `android.versionCode`: 1
   - `ios.buildNumber`: "1"

5. **Subscription products** must be set up in both stores before launch (see SUBSCRIPTION_SETUP_GUIDE.md)

---

## Quick Command Reference

```bash
# Login
npx eas-cli login

# Check who's logged in
npx eas-cli whoami

# Configure project
npx eas-cli build:configure

# Build Android only
npx eas-cli build --platform android --profile production

# Build iOS only
npx eas-cli build --platform ios --profile production

# Build both platforms
npx eas-cli build --platform all --profile production

# List all builds
npx eas-cli build:list

# Cancel a build
npx eas-cli build:cancel
```

---

## Support

If you encounter issues:
1. Check the [EAS Build documentation](https://docs.expo.dev/build/introduction/)
2. Review build logs carefully
3. Check Expo forums or Discord
4. Ensure all Firebase/Google/Apple credentials are correct
