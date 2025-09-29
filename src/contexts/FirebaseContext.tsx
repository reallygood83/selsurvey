'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface FirebaseContextType {
  initialized: boolean;
  error: string | null;
  user: User | null;
  userProfile: any | null;
  loading: boolean;
}

const FirebaseContext = createContext<FirebaseContextType>({
  initialized: false,
  error: null,
  user: null,
  userProfile: null,
  loading: true,
});

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within FirebaseProvider');
  }
  return context;
};

interface FirebaseProviderProps {
  children: React.ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        // Firebase가 이미 초기화되었는지 확인
        if (db && auth) {
          console.log('✅ Firebase services are available');
          setInitialized(true);
          
          // 인증 상태 리스너 설정
          const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
              try {
                const userRef = doc(db, 'users', firebaseUser.uid);
                const userSnap = await getDoc(userRef);
                
                if (userSnap.exists()) {
                  setUser(firebaseUser);
                  setUserProfile(userSnap.data());
                } else {
                  setUser(firebaseUser);
                  setUserProfile(null);
                }
              } catch (profileError) {
                console.error('사용자 프로필 로드 오류:', profileError);
                setUser(firebaseUser);
                setUserProfile(null);
              }
            } else {
              setUser(null);
              setUserProfile(null);
            }
            setLoading(false);
          });

          return () => unsubscribe();
        } else {
          console.warn('⚠️ Firebase services not available. Please check your environment variables.');
          setError('Firebase services not available. Please check your .env.local file.');
          setLoading(false);
        }
      } catch (initError) {
        console.error('❌ Firebase 초기화 오류:', initError);
        setError(initError instanceof Error ? initError.message : 'Firebase 초기화 실패');
        setLoading(false);
      }
    };

    initializeFirebase();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Firebase 연결 오류</h3>
            <p className="text-sm text-gray-600 mb-4">
              애플리케이션을 초기화하는 중 문제가 발생했습니다.
            </p>
            <div className="bg-gray-50 rounded-md p-3 mb-4">
              <p className="text-xs text-gray-500 font-mono">{error}</p>
            </div>
            <div className="space-y-2 text-xs text-gray-500">
              <p>• .env.local 파일의 Firebase 설정을 확인해주세요</p>
              <p>• 개발 서버를 재시작해주세요</p>
              <p>• 인터넷 연결을 확인해주세요</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!initialized && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Firebase 연결 중...</p>
        </div>
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={{ initialized, error, user, userProfile, loading }}>
      {children}
    </FirebaseContext.Provider>
  );
};