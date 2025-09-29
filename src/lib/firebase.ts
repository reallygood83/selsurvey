import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

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

// Connection retry configuration
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function for retry logic
async function retryOperation<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`${operationName} failed (attempt ${attempt}/${MAX_RETRY_ATTEMPTS}):`, error);
      if (attempt < MAX_RETRY_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
      }
    }
  }
  throw lastError;
}

try {
  // Only initialize if we have the minimum required configuration
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      console.log('✅ Firebase initialized successfully:', firebaseConfig.projectId);
    } else {
      app = getApp();
    }

    // Initialize Firebase services with retry logic
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Configure Firestore for better connection handling
    try {
      // Enable offline persistence for better reliability
      if (typeof window !== 'undefined') {
        retryOperation(async () => {
          await db.enableNetwork();
          console.log('✅ Firestore network enabled successfully');
        }, 'Enable Firestore network').catch(err => {
          console.warn('⚠️ Firestore network enable failed after retries:', err);
        });
      }
    } catch (err) {
      console.warn('⚠️ Firestore configuration error:', err);
    }

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

// Utility function for safe Firestore operations
export const safeFirestoreOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string = 'Firestore operation'
): Promise<T | null> => {
  try {
    if (!db) {
      console.warn(`⚠️ ${operationName}: Firestore not initialized`);
      return null;
    }
    return await retryOperation(operation, operationName);
  } catch (error) {
    console.error(`❌ ${operationName} failed:`, error);
    return null;
  }
};

// Export services with null fallbacks
export { auth, db, googleProvider, retryOperation, safeFirestoreOperation };
export default app;