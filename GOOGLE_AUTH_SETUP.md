# Google Authentication Setup Guide

## Current Status
✅ Code implementation complete
✅ Dependencies installed
⏳ Firebase Console configuration needed
⏳ OAuth Client IDs needed

---

## Step 1: Enable Google Sign-In in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **vagtplan-d925e**
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. Toggle **Enable**
6. Add your support email
7. Click **Save**

---

## Step 2: Get OAuth Client IDs

### For Web (Required)

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Find your web app or click **Add app** → **Web**
4. Click on **SDK setup and configuration**
5. Look for the **Web Client ID** (it looks like: `XXXXX-XXXXX.apps.googleusercontent.com`)

### For Android (Optional but recommended)

1. In Firebase Console, go to **Project Settings**
2. Find your Android app or add one
3. Download the `google-services.json` file
4. The client ID will be in the file, or visible in Firebase Console
5. Place `google-services.json` in your project root if needed

### For iOS (Optional but recommended)

1. In Firebase Console, go to **Project Settings**
2. Find your iOS app or add one
3. Download the `GoogleService-Info.plist` file
4. The iOS Client ID will be visible in Firebase Console
5. Place `GoogleService-Info.plist` in your project root if needed

---

## Step 3: Update the Google Auth Configuration

Open `src/utils/googleAuth.js` and replace the placeholder client IDs:

```javascript
const [request, response, promptAsync] = Google.useAuthRequest({
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com', // Optional
  androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com', // Optional
});
```

Replace with your actual client IDs from Firebase Console.

**Note:** The `webClientId` is the most important one for Expo/React Native apps.

---

## Step 4: Configure OAuth Consent Screen (If Needed)

If you're testing with external users (not just your Google account):

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select the same project (vagtplan-d925e)
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Choose **External** user type
5. Fill in the required fields:
   - App name: Schedule Manager (or your app name)
   - User support email: Your email
   - Developer contact: Your email
6. Add scopes (usually default ones are fine)
7. Add test users if in testing mode
8. Save and continue

---

## Step 5: Configure Expo app.json (If using Expo)

Add the following to your `app.json`:

```json
{
  "expo": {
    "scheme": "vagtplan",
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}
```

---

## Step 6: Test the Implementation

1. Start your development server:
   ```bash
   npm start
   ```

2. Test on your device/emulator:
   ```bash
   npm run android
   # or
   npm run ios
   ```

3. On the Login or Signup screen, tap "Continue with Google"
4. Select your Google account
5. Authorize the app
6. You should be signed in!

---

## Troubleshooting

### Error: "Developer Error" or "Invalid Client ID"
- Double-check your Web Client ID in `src/utils/googleAuth.js`
- Make sure Google Sign-In is enabled in Firebase Console
- Verify the Client ID matches exactly (no extra spaces)

### Error: "Redirect URI mismatch"
- In Google Cloud Console → APIs & Services → Credentials
- Click on your OAuth 2.0 Client ID
- Add authorized redirect URIs:
  - `https://auth.expo.io/@your-expo-username/vagtplan-new`
  - `exp://localhost:19000/--/`

### Error: "Network Error" or authentication not working
- Make sure you have internet connection
- Check if Firebase Authentication is enabled
- Verify Firebase API key is correct in `src/config/firebase.js`

### Users created via Google don't have username
- The system automatically generates a username from the email
- You can add a step to let users customize their username after Google sign-in

---

## How It Works

1. **User taps "Continue with Google"**
   - Opens Google's OAuth consent screen in a browser

2. **User authorizes the app**
   - Google returns an ID token

3. **App sends token to Firebase**
   - Firebase verifies the token with Google
   - Creates/signs in the user

4. **User data is stored**
   - Creates a document in Firestore under `users/{uid}`
   - Stores: name, email, username, photoURL, provider, createdAt

5. **User is logged in**
   - `onLogin` or `onSignup` callback is triggered
   - User can access the app

---

## Security Notes

⚠️ **Important:** Your Firebase API key is currently exposed in the code. This is normal for Firebase client apps, but make sure:

1. Enable Firebase Security Rules
2. Set up proper Authentication rules
3. Don't commit sensitive configuration files
4. Use environment variables in production

Example Firestore security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## Next Steps

- [ ] Get Web Client ID from Firebase Console
- [ ] Update `src/utils/googleAuth.js` with real Client IDs
- [ ] Test Google Sign-In on both Login and Signup screens
- [ ] Set up Firestore security rules
- [ ] Test user data is properly saved to Firestore
- [ ] Consider adding profile photo support
- [ ] Add ability to link Google account to existing email/password account

---

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify all Client IDs are correct
3. Make sure Google Sign-In is enabled in Firebase
4. Check that your Firebase project is in the correct billing plan (Spark/Blaze)
