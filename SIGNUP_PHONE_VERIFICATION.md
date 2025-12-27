# Signup with Phone Verification Choice

## Overview

The signup flow allows users to choose between email or phone verification after signing up. Phone number collection happens during the phone verification process, not during signup.

## New Features

### 1. Verification Choice Screen
- **Appears after signup** before any verification
- **Two verification options**:
  - Email verification (click link in email)
  - Phone verification (6-digit SMS code with phone number collection)
- **Clean UI** with card-based selection
- **Both options always available** regardless of data provided during signup

### 2. Phone Number Collection (in Phone Verification Screen)
- **Country picker** with flag and calling code selection
- **Format helper** showing the country code being used
- **International format** stored as `+[callingCode][number]`
- **Collected only when user chooses phone verification**
- **Linked to Firebase Auth** and saved to Firestore user document

## Signup Flow

### Updated Step Order
1. Username
2. Full Name
3. Email
4. Password
5. Profile Picture (optional - can skip)

### After Signup
1. User completes all signup steps
2. Account is created in Firebase
3. **Verification Choice Screen** appears
4. User selects Email or Phone verification
5. If phone selected:
   - Phone verification screen appears
   - User enters phone number with country code
   - SMS code is sent
   - User enters code to verify
6. If email selected:
   - Email verification screen appears
   - Verification email is sent
7. After verification, user can access the app

## User Experience

### Verification Choice Screen
```
┌──────────────────────────────────┐
│   Choose Verification Method     │
│   How would you like to verify   │
│   your account?                  │
│                                   │
│  ┌──────────────────────────┐   │
│  │ ✉️  Email Verification   │ → │
│  │ We'll send a verification│   │
│  │ link to your email       │   │
│  │ user@example.com         │   │
│  └──────────────────────────┘   │
│                                   │
│  ┌──────────────────────────┐   │
│  │ 📱  Phone Verification   │ → │
│  │ We'll send a 6-digit     │   │
│  │ code via SMS             │   │
│  └──────────────────────────┘   │
└──────────────────────────────────┘
```

### Phone Verification Screen (Phone Number Input)
```
┌─────────────────────────────────┐
│  Verify Your Phone              │
│  Enter your phone number to     │
│  receive a verification code    │
│                                  │
│  ┌──────┐  ┌─────────────────┐ │
│  │ 🇺🇸 +1│  │ Phone number    │ │
│  └──────┘  └─────────────────┘ │
│                                  │
│  Enter your number without       │
│  the country code +1             │
│                                  │
│  [     Send Code      →]        │
└─────────────────────────────────┘
```

## Technical Implementation

### Files Created
- `src/screens/VerificationChoiceScreen.js` - New verification choice UI
- `SIGNUP_PHONE_VERIFICATION.md` - This documentation

### Files Modified
- `src/screens/SignupScreen.js`
  - Removed phone number step from signup flow (now 5 steps instead of 6)
  - Added verification choice handlers
  - Shows verification choice screen after signup

- `src/screens/PhoneVerificationScreen.js`
  - Added phone number collection with country picker
  - Added phone number validation
  - Saves phone number to Firestore after verification
  - Links phone credential to Firebase Auth

- `src/screens/VerificationChoiceScreen.js`
  - Always shows both email and phone options
  - Removed phone number requirement

- `src/i18n/locales/en.json` - Added English translations:
  - Verification choice screen translations
  - Phone verification with country picker
  - Helper text with country code

- `src/i18n/locales/da.json` - Added Danish translations:
  - Verification choice screen translations
  - Phone verification with country picker
  - Helper text with country code

### Dependencies Added
- `react-native-country-picker-modal` - For country/calling code selection

### Data Structure

**User Document in Firestore:**
```javascript
{
  name: "John Doe",
  username: "johndoe",
  email: "john@example.com",
  phoneNumber: "+1234567890",  // NEW: null initially, populated when phone verification is completed
  photoURL: "https://...",
  subscriptionTier: "free",
  createdAt: "2025-01-15T10:30:00Z"
}
```

## Country Picker Features

- **Visual flag display** for selected country
- **Searchable list** of all countries
- **Alphabetic filter** for quick navigation
- **Calling code display** (e.g., +1, +45, +44)
- **Auto-selection** defaults to US (+1)

## Benefits

### For Users
1. **Choice** - Pick their preferred verification method
2. **Flexibility** - Phone number is optional
3. **Reliability** - Phone verification works when email delivery fails
4. **Familiar** - Country picker is standard in modern apps

### For Admin
1. **Better delivery rates** - Phone verification bypasses email spam filters
2. **User data** - Collect phone numbers for future features
3. **Reduced support** - Users with email issues have alternative
4. **Global ready** - International phone number support

## Important Notes

### Phone Number Storage
- Stored in international format: `+[calling code][number]`
- Example: US number `1234567890` → stored as `+11234567890`
- Example: Danish number `12345678` → stored as `+4512345678`
- Initially set to `null` in Firestore
- Populated when phone verification is completed

### Verification Method
- Choice is made AFTER account creation
- Both email and phone options are always available
- Phone number is collected during phone verification process
- Account exists but is not verified until user completes chosen method
- If user backs out without verifying, account is deleted

### Firebase Setup Required
For phone verification to work:
1. Enable Phone Authentication in Firebase Console
2. Upgrade to Blaze plan (phone verification requires paid plan for production)
3. Add test phone numbers for development
4. Configure reCAPTCHA settings

See [PHONE_VERIFICATION_SETUP.md](PHONE_VERIFICATION_SETUP.md) for detailed setup instructions.

## Future Enhancements

Possible improvements:
1. **Remember choice** - Save preferred verification method
2. **Phone number validation** - Real-time format checking
3. **Regional defaults** - Auto-detect country from IP
4. **Both verifications** - Require both email AND phone for extra security
5. **SMS costs tracking** - Monitor phone verification usage

## Testing Checklist

- [ ] Complete signup flow (5 steps)
- [ ] Verification choice screen appears after signup
- [ ] Choose email verification
- [ ] Choose phone verification
- [ ] Phone verification screen shows country picker
- [ ] Country picker opens and selects different countries
- [ ] Helper text shows correct calling code based on selected country
- [ ] Phone number validation works
- [ ] SMS code is sent successfully
- [ ] Code verification works
- [ ] Phone number saved to Firestore after verification
- [ ] Phone number linked to Firebase Auth
- [ ] Back button from verification choice deletes account
- [ ] Both options always available regardless of signup data
- [ ] Translations work in both languages

## Screenshots Needed

1. Verification choice screen with both options
2. Phone verification screen with phone number input and country picker
3. Country picker modal open
4. Phone verification screen with SMS code input
