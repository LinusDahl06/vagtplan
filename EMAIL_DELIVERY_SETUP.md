# Email Delivery Setup Guide

## Issue
Some custom domain emails are not receiving verification/password reset emails from Firebase.

## Root Cause
Firebase's default email service has varying success with different email providers, especially custom domains.

## Solutions

### Solution 1: Configure Custom Email Templates (Quick Fix)

1. Go to Firebase Console → Authentication → Templates
2. For each template (Email verification, Password reset):
   - Click "Edit template"
   - Customize the sender name (use your app name: "ScheduHub")
   - Add a custom sender email if available
   - Save changes

### Solution 2: Custom SMTP Provider (Recommended for Production)

#### Using SendGrid (Free tier available):

1. **Sign up for SendGrid**
   - Go to sendgrid.com
   - Create a free account (100 emails/day free)

2. **Create API Key**
   - Go to Settings → API Keys
   - Create new API key with "Mail Send" permissions
   - Save the API key securely

3. **Set up Firebase Cloud Function**
   Create a Cloud Function to send emails using SendGrid:

   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools

   # Initialize Cloud Functions
   firebase init functions
   ```

4. **Install SendGrid in functions**
   ```bash
   cd functions
   npm install @sendgrid/mail
   ```

5. **Create email sending function** (functions/index.js):
   ```javascript
   const functions = require('firebase-functions');
   const sgMail = require('@sendgrid/mail');
   const admin = require('firebase-admin');

   admin.initializeApp();
   sgMail.setApiKey(functions.config().sendgrid.key);

   exports.sendVerificationEmail = functions.auth.user().onCreate(async (user) => {
     // Generate custom verification link
     const actionCodeSettings = {
       url: 'https://your-app.com/verify-email',
       handleCodeInApp: true,
     };

     const verificationLink = await admin.auth().generateEmailVerificationLink(
       user.email,
       actionCodeSettings
     );

     const msg = {
       to: user.email,
       from: 'noreply@scheduhub.com', // Your verified sender
       subject: 'Verify your ScheduHub account',
       html: `
         <h2>Welcome to ScheduHub!</h2>
         <p>Click the link below to verify your email:</p>
         <a href="${verificationLink}">Verify Email</a>
       `,
     };

     await sgMail.send(msg);
   });
   ```

6. **Set SendGrid API Key**
   ```bash
   firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
   ```

7. **Deploy Function**
   ```bash
   firebase deploy --only functions
   ```

### Solution 3: Alternative - AWS SES

AWS SES is another option with a generous free tier (62,000 emails/month).

### Solution 4: Custom Email Action Handler

Set up a custom email action handler page for your app:

1. Create a custom landing page for email actions
2. Configure in Firebase Console → Authentication → Templates
3. Use your own domain to handle verification links

## Temporary Workarounds

### For Development/Testing:

1. **Ask users to check spam folder**
   Add this to your email verification screen

2. **Add retry mechanism**
   Allow users to request verification email multiple times

3. **Add alternative verification**
   Consider phone number verification as backup

4. **Whitelist instructions**
   Provide users with instructions to whitelist Firebase emails

## Immediate Code Changes

Add better user feedback about email delivery issues:
