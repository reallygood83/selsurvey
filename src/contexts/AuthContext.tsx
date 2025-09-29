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
import { auth, db, googleProvider } from '@/lib/firebase';

// 사용자 프로필 타입
interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'teacher' | 'student';
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

  // 사용자 프로필 생성/업데이트
  const createOrUpdateUserProfile = async (firebaseUser: User, role: 'teacher' | 'student'): Promise<UserProfile> => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    
    const now = new Date();
    
    if (userSnap.exists()) {
      // 기존 사용자 업데이트
      const existingData = userSnap.data();
      const updatedProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: existingData.role || role,
        createdAt: existingData.createdAt?.toDate() || now,
        lastLoginAt: now,
      };
      
      await setDoc(userRef, {
        ...updatedProfile,
        lastLoginAt: serverTimestamp(),
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
        createdAt: now,
        lastLoginAt: now,
      };
      
      await setDoc(userRef, {
        ...newProfile,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
      
      return newProfile;
    }
  };

  // Google 로그인
  const signInWithGoogle = async (role: 'teacher' | 'student'): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      
      const result = await signInWithPopup(auth, googleProvider);
      
      if (result.user) {
        const profile = await createOrUpdateUserProfile(result.user, role);
        setUser(result.user);
        setUserProfile(profile);
        
        // 역할을 로컬 스토리지에 저장
        localStorage.setItem('userRole', role);
      }
    } catch (error: any) {
      console.error('Google 로그인 오류:', error);
      
      // 간단한 오류 메시지
      let errorMessage = '로그인 중 오류가 발생했습니다.';
      
      if (error.code === 'auth/popup-blocked') {
        errorMessage = '팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = '로그인 창이 닫혔습니다. 다시 시도해주세요.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = '네트워크 연결을 확인해주세요.';
      }
      
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      localStorage.removeItem('userRole');
    } catch (error) {
      console.error('로그아웃 오류:', error);
      setError('로그아웃 중 오류가 발생했습니다.');
    }
  };

  // 오류 메시지 제거
  const clearError = (): void => {
    setError(null);
  };

  // 인증 상태 리스너
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // 사용자 프로필 로드
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const profileData = userSnap.data() as UserProfile;
            setUser(firebaseUser);
            setUserProfile(profileData);
          } else {
            // 프로필이 없으면 기본 학생 역할로 생성
            const storedRole = localStorage.getItem('userRole') as 'teacher' | 'student' || 'student';
            const profile = await createOrUpdateUserProfile(firebaseUser, storedRole);
            setUser(firebaseUser);
            setUserProfile(profile);
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
  }, []);

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