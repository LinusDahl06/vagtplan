# Legal Documents Implementation Guide

## Documents Created

1. **PRIVACY_POLICY.md** - Comprehensive privacy policy covering:
   - Data collection and usage
   - Security measures
   - User rights (GDPR, CCPA compliant)
   - Third-party services
   - Data retention and deletion

2. **TERMS_OF_SERVICE.md** - Complete terms of service including:
   - Acceptable use policy
   - User responsibilities
   - Intellectual property
   - Liability disclaimers
   - Termination conditions

3. **LegalScreen.js** - In-app component to display legal documents

## Required Actions Before App Store Submission

### 1. Host Documents Publicly

You MUST host these documents on a publicly accessible website. Options:

**Option A: GitHub Pages (Free)**
1. Create a new repository or use existing one
2. Create a `docs` folder
3. Add `privacy.html` and `terms.html`
4. Enable GitHub Pages in repository settings
5. Your URLs will be: `https://yourusername.github.io/yourrepo/privacy.html`

**Option B: Your Own Website**
1. Create `/privacy` and `/terms` pages on your website
2. Make sure they're accessible without login

**Option C: Use a Privacy Policy Generator Service**
- termly.io (free tier available)
- freeprivacypolicy.com
- getterms.io

### 2. Update Placeholders

Replace these placeholders in ALL documents:

- `[your-email@example.com]` → Your actual support email
- `[Your Country/State]` → Your jurisdiction (e.g., "Denmark", "California, USA")
- `[Your Jurisdiction]` → Legal jurisdiction for disputes
- `https://your-website.com/privacy` → Actual privacy policy URL
- `https://your-website.com/terms` → Actual terms of service URL

### 3. Add Links to App Stores

When submitting to app stores, you'll need to provide these URLs:

**Apple App Store:**
- Privacy Policy URL: (required)
- Support URL: (required)

**Google Play Store:**
- Privacy Policy URL: (required)

### 4. Optional: Add In-App Access

You can add legal document links to your SettingsScreen:

```javascript
// Add this section to SettingsScreen.js after the Language Section:

{/* Legal Section */}
<View style={styles(theme).section}>
  <Text style={styles(theme).sectionTitle}>Legal</Text>

  <TouchableOpacity
    style={styles(theme).settingRow}
    onPress={() => Linking.openURL('https://yourwebsite.com/privacy')}
  >
    <View style={styles(theme).settingLeft}>
      <View style={styles(theme).settingIconContainer}>
        <Ionicons name="shield-checkmark" size={20} color={theme.primary} />
      </View>
      <View style={styles(theme).settingTextContainer}>
        <Text style={styles(theme).settingTitle}>Privacy Policy</Text>
        <Text style={styles(theme).settingDescription}>How we handle your data</Text>
      </View>
    </View>
    <Ionicons name="open-outline" size={20} color={theme.textSecondary} />
  </TouchableOpacity>

  <TouchableOpacity
    style={styles(theme).settingRow}
    onPress={() => Linking.openURL('https://yourwebsite.com/terms')}
  >
    <View style={styles(theme).settingLeft}>
      <View style={styles(theme).settingIconContainer}>
        <Ionicons name="document-text" size={20} color={theme.primary} />
      </View>
      <View style={styles(theme).settingTextContainer}>
        <Text style={styles(theme).settingTitle}>Terms of Service</Text>
        <Text style={styles(theme).settingDescription}>Terms and conditions</Text>
      </View>
    </View>
    <Ionicons name="open-outline" size={20} color={theme.textSecondary} />
  </TouchableOpacity>
</View>
```

And add the import:
```javascript
import { Linking } from 'react-native';
```

### 5. Add to Signup/Login Screens

Add acceptance checkbox to SignupScreen:

```javascript
// Add this before the signup button:
<View style={styles(theme).termsContainer}>
  <Text style={styles(theme).termsText}>
    By creating an account, you agree to our{' '}
    <Text
      style={styles(theme).termsLink}
      onPress={() => Linking.openURL('https://yourwebsite.com/terms')}
    >
      Terms of Service
    </Text>
    {' '}and{' '}
    <Text
      style={styles(theme).termsLink}
      onPress={() => Linking.openURL('https://yourwebsite.com/privacy')}
    >
      Privacy Policy
    </Text>
  </Text>
</View>
```

## Quick Hosting with GitHub Pages

### Step-by-Step:

1. **Create HTML files** from the markdown documents:

```html
<!-- privacy.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - Vagtplan</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 { color: #2c3e50; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; }
        a { color: #3498db; }
        .last-updated { color: #95a5a6; font-size: 14px; }
    </style>
</head>
<body>
    <!-- Paste converted HTML from PRIVACY_POLICY.md here -->
</body>
</html>
```

2. **Convert Markdown to HTML** using:
   - https://markdowntohtml.com/
   - Or use a local tool like `pandoc`

3. **Push to GitHub**:
```bash
git add docs/privacy.html docs/terms.html
git commit -m "Add legal documents"
git push
```

4. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: Deploy from branch
   - Branch: main, folder: /docs
   - Save

Your documents will be available at:
`https://yourusername.github.io/yourrepo/privacy.html`

## Legal Compliance Checklist

- [ ] Replace all placeholder text
- [ ] Have documents reviewed by a lawyer (recommended)
- [ ] Host documents on public URL
- [ ] Add URLs to app store listings
- [ ] Add "By signing up, you agree to..." text to signup
- [ ] Add links in app settings
- [ ] Test all links work correctly
- [ ] Keep documents updated as app changes
- [ ] Notify users of policy changes (email or in-app)

## Important Notes

### GDPR Compliance (EU users)
- ✅ Privacy policy explains data collection
- ✅ Users can delete their account/data
- ✅ Users can export their data (contact support)
- ✅ Legal basis for processing is established
- ⚠️ Consider adding cookie consent if you add web version
- ⚠️ Appoint a Data Protection Officer if required

### CCPA Compliance (California users)
- ✅ Privacy policy discloses data collection
- ✅ "Do not sell my data" (we don't sell data)
- ✅ Right to deletion implemented
- ✅ Non-discrimination clause included

### Children's Privacy (COPPA)
- ✅ App not targeted at children under 13
- ✅ Privacy policy states this clearly
- ⚠️ If children might use app, add parental consent

## Contact Information

Make sure you have:
- [ ] Valid support email address
- [ ] Email is monitored regularly
- [ ] Someone responsible for responding to privacy/legal requests
- [ ] Process for handling deletion requests (within 30 days)

## After Deployment

1. **Version Your Documents**:
   - Keep old versions archived
   - Document what changed
   - Notify users of significant changes

2. **Regular Reviews**:
   - Review annually
   - Update when adding new features
   - Update when laws change

3. **User Notifications**:
   - Email users about major changes
   - Show in-app notice for policy updates
   - Give users option to review before accepting

## Need Help?

Consider:
- Hiring a lawyer to review (recommended before launch)
- Using a legal document service (Termly, Rocket Lawyer)
- Consulting with a privacy expert for GDPR/CCPA compliance

## Files Created in This Project

```
vagtplan-new/
├── PRIVACY_POLICY.md          # Full privacy policy (template)
├── TERMS_OF_SERVICE.md         # Full terms of service (template)
├── LEGAL_IMPLEMENTATION_GUIDE.md  # This file
└── src/
    └── screens/
        └── LegalScreen.js      # In-app legal documents viewer
```
