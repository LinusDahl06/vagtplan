# Phone Verification Setup

## Overview

Phone number verification has been added as an alternative to email verification. This is especially useful when email delivery is unreliable for certain custom domains.

## Features

- **Alternative verification method**: Users can choose to verify with SMS instead of email
- **6-digit SMS codes**: Simple and secure verification process
- **Resend functionality**: Users can request a new code if they don't receive it
- **Change number option**: Users can go back and enter a different phone number
- **Bilingual support**: Full English and Danish translations

## How It Works

1. **User signs up** with email and password
2. **Email verification screen** appears with option to verify via phone
3. **User clicks "Verify with Phone Number"** button
4. **Phone verification screen** appears
5. **User enters phone number** in international format (e.g., +1234567890)
6. **Firebase sends SMS** with 6-digit verification code
7. **User enters code** to verify
8. **Phone number is linked** to their account

## Important Notes

### Phone Number Format
- Phone numbers must include country code
- Format: `+[country code][number]` (e.g., `+4512345678` for Denmark, `+1234567890` for USA)
- No spaces, dashes, or parentheses

### Firebase Setup Required

#### 1. Enable Phone Authentication in Firebase Console
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable "Phone" provider
3. Add your app's SHA-256 fingerprint (for Android)
4. Add authorized domains

#### 2. Configure reCAPTCHA (Required)
Firebase uses reCAPTCHA to prevent abuse. The `expo-firebase-recaptcha` package handles this automatically.

**For iOS**: No additional setup required - works out of the box

**For Android**:
1. Add SHA-256 certificate fingerprint to Firebase project
2. Download new `google-services.json` and replace in project

To get SHA-256 fingerprint:
```bash
# For debug builds
cd android
./gradlew signingReport

# Look for SHA-256 under "Variant: debug"
```

#### 3. SMS Quota Limits
Firebase has the following SMS limits:

**Free tier (Spark Plan)**:
- **10 SMS per day** for phone verification
- Very limited for production use

**Paid tier (Blaze Plan)** - Required for production:
- First 10,000 verifications/month: Free
- After that: $0.01 per verification
- Much more suitable for real users

### Testing Phone Verification

#### Test Phone Numbers (No SMS sent)
You can add test phone numbers in Firebase Console for development:

1. Go to Firebase Console → Authentication → Sign-in method → Phone
2. Scroll to "Phone numbers for testing"
3. Add test numbers with test codes:
   - Phone: `+1 650-555-1234`
   - Code: `123456`

These numbers will skip SMS sending and use the test code you specify.

#### Real Testing
For real SMS testing before going live:
1. Upgrade to Blaze plan (pay-as-you-go)
2. Set a budget alert in Google Cloud Console
3. Test with your own phone numbers

## Security Considerations

### Rate Limiting
Firebase automatically rate limits phone verification requests to prevent abuse:
- Maximum attempts per number per day
- Maximum attempts per device per day
- Automatic blocking of suspicious patterns

### reCAPTCHA Protection
The invisible reCAPTCHA prevents bots from abusing the SMS service.

### Phone Number Privacy
- Phone numbers are linked to user accounts but not publicly visible
- Store phone numbers securely
- Don't share phone numbers with third parties

## User Flow

### Success Flow
```
Email Verification Screen
  ↓ (User clicks "Verify with Phone Number")
Phone Verification Screen
  ↓ (User enters phone number)
SMS sent with 6-digit code
  ↓ (User enters code)
Phone verified & linked to account
  ↓
User can access app
```

### Fallback Flow
```
Email Verification Screen
  ↓ (Email not delivered or user prefers phone)
Click "Verify with Phone Number"
  ↓ (Phone verification completes)
Account verified via phone
```

## Error Handling

The system handles various error cases:
- Invalid phone number format
- SMS delivery failures
- Invalid verification codes
- Phone number already in use
- Too many requests (rate limiting)
- SMS quota exceeded

All errors show user-friendly messages in the app's selected language.

## Cost Estimation

For a small to medium app:
- **Email verification**: Free (included in Firebase)
- **Phone verification**: $0.01 per verification after 10,000/month
- **Example**: 1,000 users/month = $0 (under free tier limit)
- **Example**: 15,000 users/month = $50/month (5,000 over limit)

## Recommendations

1. **For development**: Use test phone numbers
2. **For production**:
   - Start with email as primary method
   - Offer phone as alternative for delivery issues
   - Monitor SMS usage and costs
   - Set budget alerts in Google Cloud Console
3. **For scale**: Consider implementing your own SMS provider (Twilio, etc.) if costs become significant

## Files Modified/Created

### New Files
- `src/screens/PhoneVerificationScreen.js` - Phone verification UI component

### Modified Files
- `src/screens/EmailVerificationScreen.js` - Added phone verification option
- `src/i18n/locales/en.json` - English translations
- `src/i18n/locales/da.json` - Danish translations
- `package.json` - Added expo-firebase-recaptcha dependency

## Next Steps

1. Enable Phone Authentication in Firebase Console
2. Test with test phone numbers in development
3. Upgrade to Blaze plan when ready for production
4. Set up budget alerts in Google Cloud Console
5. Monitor usage and costs regularly
