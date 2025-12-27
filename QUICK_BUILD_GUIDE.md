# Quick Build Guide - ScheduHub

## 🚀 Fastest Way to Build

### Step 1: Login to EAS (One-time)
```bash
cd j:\Apps\vagtplan-new
npx eas-cli login
```

### Step 2: Run Build Script
Double-click: `build-production.bat`

Or manually:
```bash
# Android only
npx eas-cli build --platform android --profile production

# iOS only
npx eas-cli build --platform ios --profile production

# Both platforms
npx eas-cli build --platform all --profile production
```

### Step 3: Download & Organize
After build completes, download files and move to:
- Android: `J:\Apps\ScheduHub-Android\scheduhub-v1.0.0-production.aab`
- iOS: `J:\Apps\ScheduHub-IOS\scheduhub-v1.0.0-production.ipa`

---

## 📁 Directory Structure

```
J:\Apps\
├── vagtplan-new\                    # Source code
│   ├── build-production.bat         # Build script
│   ├── BUILD_PRODUCTION.md          # Detailed guide
│   └── ...
├── ScheduHub-Android\               # Android builds
│   ├── README.md
│   └── scheduhub-v1.0.0-production.aab (after download)
└── ScheduHub-IOS\                   # iOS builds
    ├── README.md
    └── scheduhub-v1.0.0-production.ipa (after download)
```

---

## ⏱️ Build Times

- **Android AAB**: ~10-20 minutes
- **iOS IPA**: ~15-30 minutes
- **Both**: ~20-40 minutes

---

## ✅ Pre-Build Checklist

- [ ] Logged into EAS (`npx eas-cli login`)
- [ ] Firebase rules deployed
- [ ] All changes committed to git
- [ ] Version numbers updated in `app.json`
- [ ] Tested in development build
- [ ] `.env` file has all credentials

---

## 📤 After Building

### Upload to Google Play Store
1. [Google Play Console](https://play.google.com/console)
2. Create/select app
3. Release → Production → Create new release
4. Upload AAB from `ScheduHub-Android\`

### Upload to App Store
1. [App Store Connect](https://appstoreconnect.apple.com)
2. Use Transporter app to upload IPA from `ScheduHub-IOS\`
3. Complete app information
4. Submit for review

---

## 🔑 Required Credentials

### For Android:
- Expo account (free)
- Google Play Console account ($25 one-time)

### For iOS:
- Expo account (free)
- Apple Developer account ($99/year)

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Not logged in" | Run `npx eas-cli login` |
| Build fails | Check logs with `npx eas-cli build:list` |
| Can't download | Check EAS dashboard at expo.dev |
| AAB/IPA missing | Look in EAS build page for download link |

---

## 📞 Support Resources

- **Detailed Guide**: `BUILD_PRODUCTION.md`
- **Android README**: `../ScheduHub-Android/README.md`
- **iOS README**: `../ScheduHub-IOS/README.md`
- **Subscription Setup**: `SUBSCRIPTION_SETUP_GUIDE.md`
- **EAS Docs**: https://docs.expo.dev/build/introduction/

---

## 🎯 Quick Commands

```bash
# Check login status
npx eas-cli whoami

# List all builds
npx eas-cli build:list

# View specific build
npx eas-cli build:view [BUILD_ID]

# Cancel a build
npx eas-cli build:cancel

# Configure project (first time)
npx eas-cli build:configure
```

---

**Last Updated**: 2025-12-25
**App Version**: 1.0.0
**Build Profile**: production
