import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
// IMPORTANT: Firebase API keys are designed to be PUBLIC and are SAFE to expose in client code.
// They do NOT provide access to your data - they only identify your Firebase project.
// Security is enforced through Firebase Security Rules (see firestore.rules and storage.rules).
// Official documentation: https://firebase.google.com/docs/projects/api-keys
//
// Every mobile app includes these keys in the app bundle - they're meant to be public.
// The real security comes from:
// 1. Firebase Security Rules (CRITICAL - see firestore.rules)
// 2. Firebase Storage Rules (see storage.rules)
// 3. Proper authentication flows
// 4. Input validation
const firebaseConfig = {
  apiKey: "AIzaSyDgILLQvwsXnVYycwi-uwj8HxrkBcTQK5k",
  authDomain: "vagtplan-d925e.firebaseapp.com",
  projectId: "vagtplan-d925e",
  storageBucket: "vagtplan-d925e.firebasestorage.app",
  messagingSenderId: "844478119532",
  appId: "1:844478119532:web:e7db12185cf1f739842249",
  measurementId: "G-Z31D8BCBW9"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;