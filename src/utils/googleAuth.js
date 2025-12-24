import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getDefaultSubscriptionTier } from './subscriptions';

// This is required for expo-web-browser
WebBrowser.maybeCompleteAuthSession();

// Google OAuth configuration
export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    // iOS Client ID (same as web for Expo managed workflow)
    iosClientId: '844478119532-ed55md7tl0baa1nnqpg0albu0pbtvgsfj.apps.googleusercontent.com',

    // Android Client ID (same as web for Expo managed workflow)
    androidClientId: '844478119532-ed55md7tl0baa1nnqpg0albu0pbtvgsfj.apps.googleusercontent.com',

    // Web Client ID - this is the most important one for Expo
    webClientId: '844478119532-ed55md7tl0baa1nnqpg0albu0pbtvgsfj.apps.googleusercontent.com',
  });

  return { request, response, promptAsync };
};

export const handleGoogleSignIn = async (response, onSuccess) => {
  if (response?.type === 'success') {
    const { id_token } = response.params;

    try {
      // Create Firebase credential with Google ID token
      const credential = GoogleAuthProvider.credential(id_token);

      // Sign in to Firebase with the credential
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      // Check if user document exists in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      // If user doesn't exist in Firestore, create their document
      if (!userDoc.exists()) {
        const nameParts = user.displayName?.split(' ') || ['User'];
        const firstName = nameParts[0];
        const username = user.email?.split('@')[0].toLowerCase() || 'user';

        await setDoc(userDocRef, {
          name: user.displayName || 'User',
          username: username,
          email: user.email,
          photoURL: user.photoURL,
          provider: 'google',
          subscriptionTier: getDefaultSubscriptionTier(),
          createdAt: new Date().toISOString()
        });
      }

      // Return user data for the app
      const userData = {
        id: user.uid,
        email: user.email,
        name: user.displayName || 'User',
        photoURL: user.photoURL,
        username: userDoc.exists() ? userDoc.data().username : user.email?.split('@')[0].toLowerCase()
      };

      onSuccess(userData);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      return { success: false, error: error.message };
    }
  } else if (response?.type === 'error') {
    console.error('Google Auth Error:', response.error);
    return { success: false, error: response.error };
  }

  return { success: false, error: 'Authentication cancelled or failed' };
};
