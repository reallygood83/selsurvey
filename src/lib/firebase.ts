// Firebase 설정 및 초기화 - SSR 호환성
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase 설정
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase 앱 초기화 - 중복 초기화 방지
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase 서비스 초기화
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// 개발 환경에서 에뮬레이터 사용 (클라이언트 사이드에서만)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Auth 에뮬레이터 연결
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  } catch (error) {
    // 이미 연결되어 있거나 연결할 수 없는 경우 무시
  }

  // Firestore 에뮬레이터 연결
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (error) {
    // 이미 연결되어 있거나 연결할 수 없는 경우 무시
  }
}

// Google OAuth Provider 설정 - 향상된 보안
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
  display: 'popup',
  access_type: 'online'
});

// 환경별 설정 확인 (SSR 안전)
const isClientSide = typeof window !== 'undefined';
const currentDomain = isClientSide ? window.location.hostname : 'server-side';

// 허용된 도메인 목록
export const allowedDomains = [
  'localhost:3005',
  'localhost:3000', 
  'localhost',
  'gohard-9a1f4.firebaseapp.com',
  'goodmind-six.vercel.app'
];

// 개발 환경에서만 디버깅 로그 출력
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Firebase Auth 설정:', {
    apiKey: firebaseConfig.apiKey?.substring(0, 10) + '...',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    currentDomain
  });
}

export default app;