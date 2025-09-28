'use client';

// 인증 컨텍스트 - Firebase Auth와 사용자 상태 관리
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { userService } from '@/lib/firestore';
import { User, UserRole } from '@/types';

interface AuthContextType {
  // 인증 상태
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  
  // 인증 함수
  signInWithGoogle: (role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  
  // 프로필 관리
  updateUserProfile: (profileData: Partial<User>) => Promise<void>;
  setUserRole: (role: UserRole) => Promise<void>;
  
  // 디버깅 및 개발 도구
  forceRoleUpdate: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 커스텀 훅
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// AuthProvider 컴포넌트
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Google 로그인
  const signInWithGoogle = async (role?: UserRole) => {
    console.log('🚀 로그인 시도 - 선택된 역할:', role);
    try {
      setLoading(true);
      
      // Content Blocker 감지 및 사용자 안내
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      // 기존 사용자 프로필 확인
      const existingProfile = await userService.getUser(firebaseUser.uid);
      console.log('📋 기존 프로필:', existingProfile);
      
      if (!existingProfile) {
        // 새 사용자인 경우 선택된 역할로 프로필 생성
        const newUserProfile: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || '사용자',
          photoURL: firebaseUser.photoURL || undefined,
          role: role || 'student', // 선택된 역할 사용, 기본값은 student
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        console.log('👤 신규 사용자 프로필 생성:', newUserProfile);
        await userService.createOrUpdateUser(newUserProfile);
        setUserProfile(newUserProfile);
      } else {
        // 기존 사용자의 경우 - 선택된 역할로 무조건 업데이트
        if (role) {
          const updatedProfile = {
            ...existingProfile,
            role: role,
            updatedAt: new Date()
          };
          console.log('🔄 기존 사용자 역할 강제 업데이트:', updatedProfile);
          await userService.createOrUpdateUser(updatedProfile);
          setUserProfile(updatedProfile);
        } else {
          console.log('✅ 기존 사용자 프로필 유지:', existingProfile);
          setUserProfile(existingProfile);
        }
      }
    } catch (error) {
      console.error('Google 로그인 오류:', error);
      
      // Content Blocker로 인한 오류 감지
      if (error instanceof Error) {
        if (error.message.includes('popup') || error.message.includes('blocked')) {
          throw new Error('팝업이 차단되었습니다. 브라우저의 팝업 차단 설정을 확인해주세요.');
        }
        if (error.message.includes('network')) {
          throw new Error('네트워크 오류가 발생했습니다. 광고 차단기를 비활성화하고 다시 시도해주세요.');
        }
      }
      
      throw new Error('로그인에 실패했습니다. 광고 차단기나 팝업 차단 설정을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃
  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('로그아웃 오류:', error);
      throw new Error('로그아웃에 실패했습니다.');
    }
  };

  // 사용자 프로필 업데이트
  const updateUserProfile = async (profileData: Partial<User>) => {
    if (!currentUser || !userProfile) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const updatedProfile: User = {
        ...userProfile,
        ...profileData,
        updatedAt: new Date()
      };

      await userService.createOrUpdateUser(updatedProfile);
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      throw new Error('프로필 업데이트에 실패했습니다.');
    }
  };

  // 사용자 역할 설정
  const setUserRole = async (role: UserRole) => {
    await updateUserProfile({ role });
  };

  // 강제 역할 업데이트 (디버깅용)
  const forceRoleUpdate = async (role: UserRole) => {
    if (!currentUser) {
      throw new Error('로그인이 필요합니다.');
    }

    console.log('🔧 강제 역할 업데이트:', role);
    const updatedProfile: User = {
      id: currentUser.uid,
      email: currentUser.email!,
      displayName: currentUser.displayName || '사용자',
      photoURL: currentUser.photoURL || undefined,
      role: role,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await userService.createOrUpdateUser(updatedProfile);
    setUserProfile(updatedProfile);
    console.log('✅ 강제 역할 업데이트 완료:', updatedProfile);
  };

  // 인증 상태 변화 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setLoading(true);
        console.log('🔄 인증 상태 변화 감지:', firebaseUser?.email);
        
        if (firebaseUser) {
          setCurrentUser(firebaseUser);
          
          // 사용자 프로필 로드
          const profile = await userService.getUser(firebaseUser.uid);
          console.log('👤 로드된 프로필:', profile);
          if (profile) {
            setUserProfile(profile);
            console.log('✅ 프로필 설정 완료 - 역할:', profile.role);
          }
        } else {
          console.log('❌ 로그아웃 상태');
          setCurrentUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('인증 상태 확인 오류:', error);
      } finally {
        setLoading(false);
        console.log('⏹️ 로딩 완료');
      }
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    signInWithGoogle,
    logout,
    updateUserProfile,
    setUserRole,
    forceRoleUpdate
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 인증이 필요한 컴포넌트를 감싸는 HOC
export function withAuth<T extends object>(Component: React.ComponentType<T>) {
  return function AuthenticatedComponent(props: T) {
    const { currentUser, loading } = useAuth();

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!currentUser) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full space-y-8 p-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">로그인이 필요합니다</h2>
              <p className="mt-2 text-gray-600">SEL 감정분석 플랫폼을 이용하려면 로그인해주세요.</p>
            </div>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// 역할별 접근 제어 HOC
export function withRole(allowedRoles: UserRole[]) {
  return function <T extends object>(Component: React.ComponentType<T>) {
    return function RoleBasedComponent(props: T) {
      const { userProfile, loading } = useAuth();

      if (loading) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          </div>
        );
      }

      if (!userProfile || !allowedRoles.includes(userProfile.role)) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900">접근 권한이 없습니다</h2>
              <p className="mt-2 text-gray-600">
                이 페이지에 접근할 권한이 없습니다.
              </p>
            </div>
          </div>
        );
      }

      return <Component {...props} />;
    };
  };
}