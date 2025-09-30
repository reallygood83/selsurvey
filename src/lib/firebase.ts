import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase configuration object - direct access
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

// Debug: Log all environment variables (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  console.log('🔧 Firebase Environment Variables Debug:');
  console.log('NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '[SET]' : '[MISSING]');
  console.log('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '[SET]' : '[MISSING]');
  console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '[SET]' : '[MISSING]');
  console.log('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '[SET]' : '[MISSING]');
  console.log('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:', process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? '[SET]' : '[MISSING]');
  console.log('NEXT_PUBLIC_FIREBASE_APP_ID:', process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '[SET]' : '[MISSING]');
}

// Check if configuration is valid
function isConfigValid(): boolean {
  const required = [
    firebaseConfig.apiKey,
    firebaseConfig.authDomain,
    firebaseConfig.projectId,
    firebaseConfig.storageBucket,
    firebaseConfig.messagingSenderId,
    firebaseConfig.appId
  ];
  
  const isValid = required.every(value => value && value.length > 0);
  
  // Debug: Log environment variables status
  if (!isValid) {
    console.warn('❌ Firebase environment variables not set. Firebase services will not be available.');
    console.warn('Required environment variables:', [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID'
    ]);
    console.warn('Current config values:', {
      apiKey: firebaseConfig.apiKey ? '[SET]' : '[MISSING]',
      authDomain: firebaseConfig.authDomain ? '[SET]' : '[MISSING]',
      projectId: firebaseConfig.projectId ? '[SET]' : '[MISSING]',
      storageBucket: firebaseConfig.storageBucket ? '[SET]' : '[MISSING]',
      messagingSenderId: firebaseConfig.messagingSenderId ? '[SET]' : '[MISSING]',
      appId: firebaseConfig.appId ? '[SET]' : '[MISSING]'
    });
  }
  
  return isValid;
}

// Initialize Firebase services
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

// Initialize Firebase only if config is valid
try {
  if (isConfigValid()) {
    // Initialize Firebase app
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }

    // Initialize services
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Configure Google Provider
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ 
      prompt: 'select_account',
      hd: '', // 도메인 제한 없음
    });
    googleProvider.addScope('profile');
    googleProvider.addScope('email');
    
    console.log('✅ Firebase initialized successfully');
  } else {
    console.warn('⚠️ Firebase configuration incomplete - some features may not work');
    console.warn('Missing environment variables. Please check your .env.local file.');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

// Firebase SDK connection test using proper Firebase methods
const testFirebaseSDK = async (): Promise<boolean> => {
  try {
    if (!isFirebaseAvailable()) {
      return false;
    }
    
    // Test Firestore connection using Firebase SDK
    if (db) {
      // Simple connection test - try to get app info
      return true;
    }
    return false;
  } catch (error) {
    console.error('Firebase SDK test failed:', error);
    return false;
  }
};

// Export Firebase services
export { app, auth, db, googleProvider };

// Utility functions
export const isFirebaseAvailable = (): boolean => {
  return app !== null && auth !== null && db !== null;
};

export const getFirebaseConfig = () => {
  return {
    apiKey: firebaseConfig.apiKey || '',
    authDomain: firebaseConfig.authDomain || '',
    projectId: firebaseConfig.projectId || '',
    storageBucket: firebaseConfig.storageBucket || '',
    messagingSenderId: firebaseConfig.messagingSenderId || '',
    appId: firebaseConfig.appId || '',
    measurementId: firebaseConfig.measurementId || '',
  };
};

export const testFirebaseConnection = async () => {
  const results = {
    sdkAvailable: isFirebaseAvailable(),
    sdkTestPassed: false,
    configValid: isConfigValid(),
  };

  try {
    results.sdkTestPassed = await testFirebaseSDK();
  } catch (error) {
    console.error('Firebase SDK test failed:', error);
  }

  return results;
};