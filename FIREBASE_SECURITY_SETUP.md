# Firebase Security Rules Setup Guide

## 🚨 CRITICAL: You MUST deploy these rules before releasing your app

## Step 1: Deploy Firestore Security Rules

1. **Open Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `vagtplan-d925e`
3. **Navigate to Firestore Database**:
   - Click on "Firestore Database" in the left sidebar
   - Click on the "Rules" tab at the top

4. **Copy and paste the rules from `firestore.rules`**:
   - Select all content from the `firestore.rules` file
   - Paste it into the Firebase Console rules editor
   - Click "Publish"

## Step 2: Deploy Storage Security Rules

1. **Still in Firebase Console**
2. **Navigate to Storage**:
   - Click on "Storage" in the left sidebar
   - Click on the "Rules" tab at the top

3. **Copy and paste the rules from `storage.rules`**:
   - Select all content from the `storage.rules` file
   - Paste it into the Firebase Console rules editor
   - Click "Publish"

## Step 3: Test Your Security Rules

After deploying, test the following scenarios:

### ✅ Should WORK:
- [x] User can create their own profile
- [x] User can read their own profile
- [x] User can create a workspace (becomes owner)
- [x] Workspace owner can add/remove employees
- [x] Workspace owner can manage roles and permissions
- [x] Workspace members can view workspace data
- [x] Users with `manage_schedule` permission can add/edit shifts
- [x] Users can leave a workspace (remove themselves from employees)

### ❌ Should FAIL:
- [ ] Unauthenticated users cannot read any data
- [ ] Users cannot read other users' profiles
- [ ] Users cannot read workspaces they're not a member of
- [ ] Members cannot delete workspaces (only owner can)
- [ ] Members without permissions cannot add employees
- [ ] Users cannot change workspace owner
- [ ] Users cannot upload files larger than 5MB

## Security Features Implemented

### 🔒 Firestore Rules

1. **Authentication Required**: All operations require user authentication
2. **Workspace Isolation**: Users can only access workspaces they own or are members of
3. **Role-Based Permissions**: Granular permissions for employees, roles, shifts, and schedules
4. **Data Validation**:
   - Workspace names: 1-100 characters
   - Usernames: 3-30 characters
   - Email validation
   - Shift hours: 0-24
   - Input sanitization

5. **Owner Protection**: Cannot change workspace owner
6. **Self-Service**: Users can leave workspaces without owner permission

### 🔒 Storage Rules

1. **Profile Pictures**: Users can only upload to their own directory
2. **File Size Limit**: Maximum 5MB per file
3. **File Type Validation**: Only image files allowed
4. **Public Read**: Profile pictures are publicly readable (needed for display)

## What These Rules Protect Against

✅ **Unauthorized Data Access**: Users cannot read data they shouldn't have access to
✅ **Data Tampering**: Users cannot modify workspaces they don't own
✅ **Privilege Escalation**: Members cannot grant themselves owner permissions
✅ **Data Injection**: Input validation prevents malicious data
✅ **Resource Exhaustion**: File size limits prevent storage abuse
✅ **Workspace Hijacking**: Owner cannot be changed after creation

## Important Notes

### Firebase API Keys
Your Firebase API key in `firebase.js` is **intentionally public** and safe to expose. Firebase uses security rules (not the API key) to protect your data. The API key only identifies your Firebase project.

However, you should:
1. ✅ Enable Firebase App Check (recommended)
2. ✅ Set up authorized domains in Firebase Console
3. ✅ Monitor usage in Firebase Console

### Additional Security Recommendations

1. **Enable Firebase App Check**:
   - Go to Firebase Console → App Check
   - Register your app
   - Enforce App Check for Firestore and Storage
   - This prevents API abuse from unauthorized sources

2. **Set Authorized Domains**:
   - Go to Firebase Console → Authentication → Settings
   - Add only your production domains
   - Remove localhost before production release

3. **Enable Audit Logging**:
   - Monitor Firebase Console → Usage & billing
   - Set up alerts for unusual activity

4. **Rate Limiting** (Optional but recommended):
   - Consider implementing rate limiting in Firebase Functions
   - Prevents abuse of write operations

## Testing the Rules Locally (Optional)

You can test these rules locally using the Firebase Emulator:

```bash
npm install -g firebase-tools
firebase login
firebase init emulators
firebase emulators:start
```

Then run your app against the local emulator to test security rules.

## Deployment Checklist

Before deploying to production:

- [ ] Firebase Security Rules deployed and tested
- [ ] Storage Security Rules deployed and tested
- [ ] Firebase App Check enabled (recommended)
- [ ] Authorized domains configured
- [ ] Usage monitoring set up
- [ ] Tested unauthorized access scenarios
- [ ] Verified role-based permissions work correctly
- [ ] Tested workspace member leave functionality

## Support

If you encounter issues with the security rules:

1. Check the Firebase Console → Firestore → Usage tab for denied requests
2. Enable debug logging to see which rules are failing
3. Review the Firebase documentation: https://firebase.google.com/docs/rules

## Next Steps

After deploying these security rules, you should:
1. Update app.json with proper production configuration
2. Add privacy policy and terms of service
3. Test the app thoroughly with the new security rules
4. Prepare for App Store submission
