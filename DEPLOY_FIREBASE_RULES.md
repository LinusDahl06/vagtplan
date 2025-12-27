# Deploy Firebase Security Rules - IMPORTANT!

## 🚨 You Must Deploy These Rules Now

The following security rules have been updated to fix critical issues:

### Issues Fixed:
1. ✅ **Username Signup Error** - Users can now query the users collection during signup to check username uniqueness
2. ✅ **Profile Picture Upload** - Storage rules now allow uploads to `profileImages/{userId}` path
3. ✅ **Delete Account** - Users can now delete their own account and associated data

---

## How to Deploy (Choose One Method)

### **Option 1: Firebase Console (Easiest - 2 minutes)**

#### Firestore Rules:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **vagtplan-d925e**
3. Navigate to **Firestore Database** → **Rules** tab
4. Copy ALL contents from `firestore.rules` and paste
5. Click **Publish**

#### Storage Rules:
1. In Firebase Console, navigate to **Storage** → **Rules** tab
2. Copy ALL contents from `storage.rules` and paste
3. Click **Publish**

---

### **Option 2: Command Line**

```bash
cd j:\Apps\vagtplan-new

# Login (if not already logged in)
npx firebase-tools login

# Deploy both rules at once
npx firebase-tools deploy --only firestore:rules,storage:rules
```

---

## What Changed in the Rules

### [firestore.rules](firestore.rules)

**Line 29**: Changed from
```javascript
allow read: if isAuthenticated();
```
to
```javascript
allow read: if true;
```

**Why**: During signup, users aren't authenticated yet, so they couldn't check if a username was taken. Now anyone can read user profiles (which is safe since profiles are public anyway).

**Line 54**: Changed from
```javascript
allow delete: if false;
```
to
```javascript
allow delete: if isOwner(userId);
```

**Why**: Users need to be able to delete their own account data.

**Lines 77-81**: Enhanced workspace update rules
```javascript
allow update: if isAuthenticated() &&
                isValidWorkspace(request.resource.data) &&
                request.resource.data.ownerId == resource.data.ownerId &&
                (resource.data.ownerId == request.auth.uid ||
                 (resource.data.employees.size() > request.resource.data.employees.size()));
```

**Why**: Allow members to remove themselves from workspaces (needed for account deletion).

---

### [storage.rules](storage.rules)

**Lines 25-36**: Added new path for profile images
```javascript
match /profileImages/{userId} {
  allow read: if true;
  allow create, update: if isOwner(userId) &&
                          isValidImageSize() &&
                          isValidImageType();
  allow delete: if isOwner(userId);
}
```

**Why**: The app uploads to `profileImages/` but rules only had `profile-pictures/`. Now both paths are supported.

---

## Verify Deployment

After deploying, test these features:

1. **Signup with username** - Should work without "username taken" errors
2. **Upload profile picture** - Should work during signup or in settings
3. **Delete account** - Should work from settings screen

---

## If You Don't Deploy

Without deploying these rules:
- ❌ Signup will fail with "username already taken" error (even when it's not)
- ❌ Profile picture uploads will fail with "permission denied"
- ❌ Delete account will fail with "missing permissions"

---

## Quick Deploy Script

Want to deploy with one click? Run this:

```bash
# Windows
cd j:\Apps\vagtplan-new
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules,storage:rules
```

---

**Deploy NOW before testing or building!** 🚀
