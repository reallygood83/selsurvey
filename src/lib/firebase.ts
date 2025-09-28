// Firebase 설정 및 초기화
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 초기화
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// 개발 환경에서 에뮬레이터 사용 (임시 비활성화)
// if (process.env.NODE_ENV === 'development') {
//   // 에뮬레이터가 이미 연결되지 않았다면 연결
//   try {
//     if (!auth.config.emulator) {
//       const { connectAuthEmulator } = require('firebase/auth');
//       connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
//     }
//   } catch (error) {
//     // 이미 연결되어 있거나 연결할 수 없는 경우 무시
//   }

//   try {
//     if (!db._delegate._databaseId.projectId.includes('demo-')) {
//       const { connectFirestoreEmulator } = require('firebase/firestore');
//       connectFirestoreEmulator(db, 'localhost', 8080);
//     }
//   } catch (error) {
//     // 이미 연결되어 있거나 연결할 수 없는 경우 무시
//   }
// }

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// 개발/프로덕션 환경별 허용 도메인 설정
const allowedDomains = [
  'localhost:3005',
  'localhost:3000', 
  'gohard-9a1f4.firebaseapp.com',
  'goodmind-six.vercel.app',  // 실제 Vercel 배포 도메인
  // 추가 도메인이 있다면 여기에 추가
];

console.log('🔧 Firebase 초기화 완료 - 현재 도메인:', window?.location?.hostname);

export default app;