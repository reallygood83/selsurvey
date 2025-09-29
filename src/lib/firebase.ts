import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration with safe fallbacks
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Initialize Firebase services safely
let app = null;
let auth = null;
let db = null;
let googleProvider = null;

try {
  // Only initialize if we have the minimum required configuration
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      console.log('✅ Firebase initialized successfully:', firebaseConfig.projectId);
    } else {
      app = getApp();
    }

    // Initialize Firebase services
    auth = getAuth(app);
    db = getFirestore(app);

    // Configure Google Provider
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    googleProvider.addScope('profile');
    googleProvider.addScope('email');
  } else {
    console.warn('⚠️ Firebase environment variables not set. Firebase services will not be available.');
    console.warn('Required environment variables:', Object.keys(firebaseConfig));
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  // Don't throw - allow app to continue without Firebase
}

// Export services with null fallbacks
export { auth, db, googleProvider };
export default app;