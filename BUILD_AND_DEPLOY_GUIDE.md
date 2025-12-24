# Build and Deploy Guide for Vagtplan

## Overview

Your app runs on users' phones, not on a server. You need to:
1. **Build** the app into installable files (IPA for iOS, APK/AAB for Android)
2. **Submit** to App Store (Apple) and Play Store (Google)
3. Users **download** and install from the stores

Your Firebase backend is already "hosted" in the cloud and will handle all the data.

## Prerequisites

### Required Accounts
- [ ] **Apple Developer Account** - $99/year (for App Store)
  - Sign up: https://developer.apple.com/programs/
  - Needed to publish iOS apps
- [ ] **Google Play Developer Account** - $25 one-time (for Play Store)
  - Sign up: https://play.google.com/console/signup
  - Needed to publish Android apps
- [ ] **Expo Account** - Free
  - Sign up: https://expo.dev/signup
  - Already have one if you created this project

### Required Tools
- [ ] Node.js and npm (already installed)
- [ ] Expo CLI (already installed)
- [ ] EAS CLI (will install below)

## Step 1: Install EAS CLI

EAS (Expo Application Services) will build your app in the cloud.

```bash
npm install -g eas-cli
```

Login to your Expo account:
```bash
eas login
```

## Step 2: Configure EAS Build

Initialize EAS in your project:
```bash
eas build:configure
```

This creates an `eas.json` file. Update it for production:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Step 3: Update app.json for Production

Your app.json is mostly ready, but verify these settings:

```json
{
  "expo": {
    "name": "Vagtplan",  // App name users see
    "slug": "vagtplan",
    "version": "1.0.0",  // Increment for each release
    "icon": "./assets/Logo.png",  // Must be 1024x1024 PNG
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.lincware.vagtplan",
      "buildNumber": "1"  // Add this, increment for each build
    },
    "android": {
      "package": "com.lincware.vagtplan",
      "versionCode": 1,  // Add this, increment for each build
      "adaptiveIcon": {
        "foregroundImage": "./assets/Logo.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

## Step 4: Prepare Icons and Splash Screen

### App Icon
- **Size**: 1024x1024 pixels
- **Format**: PNG with no transparency
- **Location**: `./assets/Logo.png`
- Your current icon should work if it's the right size

### Splash Screen
- **Size**: 1242x2436 pixels (or larger)
- **Format**: PNG
- **Location**: `./assets/splash-icon.png`

Check your current assets:
```bash
ls -la assets/
```

If icons need updating, you can use tools like:
- Canva
- Figma
- Adobe Illustrator
- Or hire a designer on Fiverr

## Step 5: Build for Android (Easiest to Start)

### Build APK for Testing
```bash
eas build --platform android --profile preview
```

This creates an APK you can install directly on Android phones for testing.

### Build AAB for Play Store
```bash
eas build --platform android --profile production
```

This creates an AAB (Android App Bundle) required by Google Play Store.

**What Happens:**
1. Code is uploaded to Expo's servers
2. Built in the cloud (takes 10-20 minutes)
3. Download link provided when done
4. Download the AAB file

## Step 6: Build for iOS (Requires Apple Developer Account)

### Prerequisites
You need to set up credentials:

```bash
eas credentials
```

Follow prompts to:
- Create iOS Distribution Certificate
- Create Provisioning Profile

### Build for App Store
```bash
eas build --platform ios --profile production
```

**What Happens:**
1. You'll be asked to select/create credentials
2. Code uploaded and built (takes 15-30 minutes)
3. Download link for IPA file provided

## Step 7: Submit to Google Play Store

### First Time Setup

1. **Go to Google Play Console**: https://play.google.com/console
2. **Create App**:
   - Click "Create app"
   - App name: "Vagtplan"
   - Default language: English (or Danish)
   - App/Game: App
   - Free/Paid: Free

3. **Complete Store Listing**:
   - App name: Vagtplan
   - Short description (80 chars): "Shift scheduling and workforce management"
   - Full description (4000 chars): Describe your app
   - App icon: 512x512 PNG
   - Screenshots: At least 2 screenshots per device type
   - Feature graphic: 1024x500 PNG

4. **Set Up App Content**:
   - Privacy Policy URL: (your hosted privacy policy)
   - App access: All functionality available without restrictions
   - Ads: No
   - Content rating: Complete questionnaire
   - Target audience: 13+
   - Data safety: Complete form about data collection

5. **Select Countries**: Choose where to distribute

6. **Upload AAB**:
   - Go to "Production" → "Create new release"
   - Upload the AAB file from EAS build
   - Add release notes
   - Review and roll out

### Using EAS Submit (Easier)
```bash
eas submit --platform android
```

Follow prompts to submit automatically.

## Step 8: Submit to Apple App Store

### First Time Setup

1. **Go to App Store Connect**: https://appstoreconnect.apple.com
2. **Create App**:
   - Click "My Apps" → "+" → "New App"
   - Platform: iOS
   - Name: Vagtplan
   - Primary Language: English
   - Bundle ID: com.lincware.vagtplan
   - SKU: com.lincware.vagtplan

3. **Complete App Information**:
   - Privacy Policy URL: (your hosted privacy policy)
   - Category: Business or Productivity
   - Age Rating: 4+
   - Copyright: 2024 Lincware

4. **Prepare for Submission**:
   - Screenshots (required for each device):
     - iPhone 6.7": 1290x2796 (at least 3)
     - iPhone 6.5": 1242x2688 (at least 3)
     - iPad Pro 12.9": 2048x2732 (at least 2)
   - App preview videos (optional but recommended)
   - Description (4000 chars)
   - Keywords (100 chars)
   - Support URL
   - Marketing URL (optional)

5. **Upload Build**:
   - Build uploads automatically via EAS
   - Or use Xcode Transporter with IPA file
   - Select build in App Store Connect
   - Add "What's New" text

6. **Submit for Review**:
   - Add App Review Information
   - Add contact info
   - Submit for review
   - Wait 1-3 days for approval

### Using EAS Submit (Easier)
```bash
eas submit --platform ios
```

Follow prompts to submit automatically.

## Step 9: Testing Before Submission

### Android Testing
1. **Download APK** from EAS build
2. **Install on Android device**:
   ```bash
   # If device connected via USB:
   adb install app.apk
   ```
3. **Test thoroughly**:
   - User registration and login
   - Create workspace
   - Add employees
   - Create shifts
   - Schedule management
   - Profile picture upload
   - All permissions and roles

### iOS Testing (TestFlight)
1. **Build with EAS** (production profile)
2. **Upload to App Store Connect**
3. **Add to TestFlight**:
   - Go to TestFlight tab
   - Add internal testers (up to 100)
   - Share link with testers
4. **Test on real devices** before submitting

## Step 10: Update Your App (Future Releases)

When you need to update:

1. **Update version numbers** in app.json:
   ```json
   {
     "version": "1.0.1",  // Semantic versioning
     "ios": {
       "buildNumber": "2"  // Increment
     },
     "android": {
       "versionCode": 2  // Increment
     }
   }
   ```

2. **Build new version**:
   ```bash
   eas build --platform all --profile production
   ```

3. **Submit update**:
   ```bash
   eas submit --platform all
   ```

## Common Commands Reference

```bash
# Build for testing
eas build --platform android --profile preview  # APK for Android
eas build --platform ios --profile development  # Development build

# Build for production
eas build --platform android --profile production  # AAB for Play Store
eas build --platform ios --profile production     # IPA for App Store
eas build --platform all --profile production     # Both platforms

# Submit to stores
eas submit --platform android  # Submit to Play Store
eas submit --platform ios      # Submit to App Store
eas submit --platform all      # Submit to both

# Check build status
eas build:list

# View credentials
eas credentials

# Run locally (for development)
npm start
npx expo start
```

## Troubleshooting

### "Missing credentials"
```bash
eas credentials
```
Follow prompts to create iOS certificates and provisioning profiles.

### "Icon not found"
Ensure your icon is exactly 1024x1024 PNG and located at `./assets/Logo.png`

### "Build failed"
Check the build logs on expo.dev dashboard for specific errors.

### "App rejected by Apple"
Common reasons:
- Missing privacy policy
- Incomplete metadata
- Crashes on review device
- Guideline violations

Review feedback and resubmit.

## Costs Summary

### One-Time Costs
- Google Play Developer: $25
- Apple Developer: $99/year
- (Optional) Icon/design work: $5-50 on Fiverr

### Ongoing Costs
- Apple Developer: $99/year renewal
- Firebase: Free tier is generous, likely $0-25/month
- EAS Build: Free tier = 30 builds/month (usually enough)

## Timeline

- **First build**: 20-30 minutes
- **Google Play review**: Usually same day, up to 7 days
- **Apple App Store review**: 1-3 days (sometimes up to 1 week)
- **Total time to live**: 1-2 weeks from first submission

## Security Checklist Before Going Live

- [ ] Firebase Security Rules deployed
- [ ] All Firebase API keys in production
- [ ] Privacy Policy and Terms hosted publicly
- [ ] All placeholder text replaced
- [ ] Test account creation and login
- [ ] Test all major features
- [ ] Test on multiple devices
- [ ] Check app doesn't crash
- [ ] Verify data is properly secured
- [ ] Test with slow internet connection
- [ ] Test offline behavior

## Next Steps

1. **Install EAS CLI**: `npm install -g eas-cli`
2. **Sign up for developer accounts** (Apple & Google)
3. **Create production icons** (1024x1024)
4. **Run test build**: `eas build --platform android --profile preview`
5. **Test on device**
6. **Create production builds** when ready
7. **Submit to stores**

## Need Help?

- Expo Documentation: https://docs.expo.dev/
- EAS Build: https://docs.expo.dev/build/introduction/
- EAS Submit: https://docs.expo.dev/submit/introduction/
- App Store Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Play Store Policies: https://play.google.com/console/about/guides/

Good luck with your launch! 🚀
