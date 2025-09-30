'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup,
  signOut, 
  onAuthStateChanged, 
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseAvailable } from '@/lib/firebase';
import { SchoolInfo } from '@/types';

// 사용자 프로필 타입
interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'teacher' | 'student';
  schoolInfo?: SchoolInfo | null; // null도 허용
  createdAt: Date;
  lastLoginAt: Date;
}

// AuthContext 타입
interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: (role: 'teacher' | 'student') => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false); // 로그인 진행 중 플래그

  // 사용자 프로필 생성/업데이트
  const createOrUpdateUserProfile = async (firebaseUser: User, role: 'teacher' | 'student'): Promise<UserProfile> => {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    
    console.log('📝 사용자 프로필 문서 접근 시도:', {
      uid: firebaseUser.uid,
      role: role
    });
    
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    
    console.log('📄 기존 사용자 문서 확인:', {
      exists: userSnap.exists(),
      uid: firebaseUser.uid
    });
    
    const now = new Date();
    
    if (userSnap.exists()) {
      // 기존 사용자 업데이트
      const existingData = userSnap.data();

      // 중요: 사용자가 로그인 시 선택한 역할을 항상 사용합니다
      // 이전에는 기존 역할을 우선했지만, 사용자가 다른 역할로 로그인하면
      // 그 역할로 변경되어야 합니다 (예: 학생 → 교사로 전환)
      const updatedProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: role, // 로그인 시 선택한 역할을 항상 사용
        schoolInfo: existingData.schoolInfo || null,
        createdAt: existingData.createdAt?.toDate() || now,
        lastLoginAt: now,
      };

      console.log('📝 역할 업데이트:', {
        previousRole: existingData.role,
        newRole: role,
        willUpdate: existingData.role !== role
      });

      await setDoc(userRef, {
        ...updatedProfile,
        lastLoginAt: serverTimestamp(),
        schoolInfo: updatedProfile.schoolInfo || null, // undefined 대신 null 사용
      }, { merge: true });

      return updatedProfile;
    } else {
      // 새 사용자 생성
      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role,
        schoolInfo: null, // 명시적으로 null 설정
        createdAt: now,
        lastLoginAt: now,
      };
      
      await setDoc(userRef, {
        ...newProfile,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        schoolInfo: null, // Firestore에 명시적으로 null 저장
      });
      
      return newProfile;
    }
  };

  // Google 로그인 (Popup 방식 - CSP 문제 해결)
  const signInWithGoogle = async (role: 'teacher' | 'student'): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      setIsSigningIn(true); // 로그인 시작 플래그 설정

      console.log('🔐 Google 로그인 시도 시작:', { role, timestamp: new Date().toISOString() });

      if (!isFirebaseAvailable() || !auth || !googleProvider) {
        const errorMsg = '⚠️ Firebase services not available. Please check your environment variables.';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      console.log('🔐 Firebase 서비스 사용 가능, Popup 로그인 시도...');

      // Popup 방식 로그인 시도
      const result = await signInWithPopup(auth, googleProvider);

      console.log('🔐 Google 로그인 성공:', {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName
      });

      if (result && result.user) {
        // 로그인 성공 - 사용자 프로필 생성/업데이트
        console.log('🔐 사용자 프로필 생성/업데이트 시작...', {
          uid: result.user.uid,
          email: result.user.email,
          role: role
        });
        const profile = await createOrUpdateUserProfile(result.user, role);
        console.log('🔐 사용자 프로필 생성/업데이트 완료:', {
          uid: profile.uid,
          role: profile.role,
          schoolInfo: profile.schoolInfo
        });

        setUser(result.user);
        setUserProfile(profile);
        setIsSigningIn(false); // 로그인 완료 플래그 해제
      }
      
    } catch (error) {
      console.error('❌ Google 로그인 오류:', error);
      
      // 상세한 오류 메시지
      let errorMessage = '로그인 중 오류가 발생했습니다.';
      
      if (error && typeof error === 'object' && 'code' in error) {
        const authError = error as { code: string; message?: string };
        
        console.error('❌ Firebase Auth 오류 코드:', authError.code);
        console.error('❌ Firebase Auth 오류 메시지:', authError.message);
        
        if (authError.code === 'auth/network-request-failed') {
          errorMessage = '네트워크 연결을 확인해주세요.';
        } else if (authError.code === 'auth/cancelled-popup-request') {
          errorMessage = '로그인이 취소되었습니다. 다시 시도해주세요.';
        } else if (authError.code === 'auth/popup-blocked') {
          errorMessage = '팝업이 차단되었습니다. 브라우저 설정을 확인해주세요.';
        } else if (authError.code === 'auth/popup-closed-by-user') {
          errorMessage = '로그인 창이 닫혔습니다. 다시 시도해주세요.';
        } else if (authError.code.includes('cors')) {
          errorMessage = 'CORS 오류가 발생했습니다. 관리자에게 문의해주세요.';
        }
      }

      setError(errorMessage);
      setLoading(false);
      setIsSigningIn(false); // 오류 시에도 플래그 해제
      throw error;
    }
  };

  // 로그아웃
  const logout = async (): Promise<void> => {
    try {
      if (!auth) {
        throw new Error('Firebase Auth is not initialized');
      }
      
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      
      // 로그아웃 후 메인페이지로 리다이렉션
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('로그아웃 오류:', error);
      setError('로그아웃 중 오류가 발생했습니다.');
    }
  };

  // 오류 메시지 제거
  const clearError = (): void => {
    setError(null);
  };

  // 간단한 인증 상태 리스너
  useEffect(() => {
    if (!auth || !db) {
      console.warn('⚠️ Firebase services not available. Please check your environment variables.');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        // 로그인 진행 중이면 리스너 스킵 (signInWithGoogle에서 이미 처리)
        if (isSigningIn) {
          console.log('⏭️ 로그인 진행 중 - 리스너 스킵');
          return;
        }

        if (firebaseUser) {
          // 사용자 프로필 로드
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();

            // data.role이 없으면 리스너에서 프로필을 생성하지 않고 대기
            if (!data.role) {
              console.log('⏳ 프로필 역할 대기 중 - signInWithGoogle 완료 대기');
              return;
            }

            const profileData: UserProfile = {
              uid: data.uid || firebaseUser.uid,
              email: data.email || firebaseUser.email,
              displayName: data.displayName || firebaseUser.displayName,
              photoURL: data.photoURL || firebaseUser.photoURL,
              role: data.role,
              schoolInfo: data.schoolInfo || null,
              createdAt: data.createdAt?.toDate() || new Date(),
              lastLoginAt: data.lastLoginAt?.toDate() || new Date()
            };

            console.log('👤 사용자 프로필 로드:', {
              uid: profileData.uid,
              role: profileData.role,
              schoolInfo: profileData.schoolInfo
            });

            setUser(firebaseUser);
            setUserProfile(profileData);
          } else {
            // 프로필이 완전히 없으면 signInWithGoogle 완료 대기
            console.log('⏳ 프로필 문서 없음 - signInWithGoogle 완료 대기');
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('인증 상태 변경 오류:', error);
        setError('사용자 정보 로드 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isSigningIn]); // isSigningIn을 의존성에 추가

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    error,
    signInWithGoogle,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export type { UserProfile };