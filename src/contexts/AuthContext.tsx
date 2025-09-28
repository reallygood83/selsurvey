'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged, User, AuthError } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'teacher' | 'student' | null;
  createdAt: Date;
  lastLoginAt: Date;
  isActive: boolean;
  schoolInfo?: {
    schoolName: string;
    grade: number;
    className: string;
    classCode: string;
    teacherId: string;
  };
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticating: boolean;
  signInWithGoogle: (role: 'teacher' | 'student') => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Enhanced error handling with specific error messages
  const handleAuthError = useCallback((error: AuthError | Error): string => {
    console.error('Authentication error:', error);
    
    if (error.message?.includes('popup-blocked')) {
      return '팝업이 차단되었습니다. 브라우저에서 팝업을 허용해주세요.';
    }
    
    if (error.message?.includes('cancelled-popup-request')) {
      return '로그인이 취소되었습니다. 다시 시도해주세요.';
    }
    
    if (error.message?.includes('network-request-failed')) {
      return '네트워크 연결을 확인해주세요. 인터넷 연결이 불안정합니다.';
    }
    
    if (error.message?.includes('unauthorized-domain')) {
      return '이 도메인에서는 로그인할 수 없습니다. 관리자에게 문의해주세요.';
    }
    
    if (error.message?.includes('account-exists-with-different-credential')) {
      return '이미 다른 방식으로 가입된 계정입니다. 기존 로그인 방식을 사용해주세요.';
    }
    
    if (error.message?.includes('operation-not-allowed')) {
      return '구글 로그인이 비활성화되어 있습니다. 관리자에게 문의해주세요.';
    }
    
    // Content blocker specific errors
    if (error.message?.includes('ERR_BLOCKED_BY_CLIENT') || 
        error.message?.includes('ERR_BLOCKED_BY_CONTENT_BLOCKER') ||
        error.message?.includes('net::ERR_BLOCKED_BY_CONTENT_BLOCKER')) {
      return '콘텐츠 차단기(애드블록)가 구글 로그인을 방해하고 있습니다. 애드블록을 일시적으로 비활성화하거나 다른 브라우저를 사용해주세요.';
    }
    
    return '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }, []);

  // Create or update user profile in Firestore
  const createOrUpdateUserProfile = async (firebaseUser: User, role: 'teacher' | 'student'): Promise<UserProfile> => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    
    const now = new Date();
    
    if (userSnap.exists()) {
      // Update existing user
      const existingData = userSnap.data();
      const updatedProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || existingData.email || null,
        displayName: firebaseUser.displayName || existingData.displayName || null,
        photoURL: firebaseUser.photoURL || existingData.photoURL || null,
        role: existingData.role || role,
        createdAt: existingData.createdAt?.toDate() || now,
        lastLoginAt: now,
        isActive: true,
      };
      
      await setDoc(userRef, {
        ...updatedProfile,
        lastLoginAt: serverTimestamp(),
      }, { merge: true });
      
      return updatedProfile;
    } else {
      // Create new user
      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || null,
        displayName: firebaseUser.displayName || null,
        photoURL: firebaseUser.photoURL || null,
        role,
        createdAt: now,
        lastLoginAt: now,
        isActive: true,
      };
      
      await setDoc(userRef, {
        ...newProfile,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
      
      return newProfile;
    }
  };

  // Enhanced Google sign-in with better error handling
  const signInWithGoogle = async (role: 'teacher' | 'student'): Promise<void> => {
    try {
      setIsAuthenticating(true);
      setError(null);
      
      // Configure Google provider with enhanced settings
      googleProvider.setCustomParameters({
        prompt: 'select_account',
        access_type: 'online',
        include_granted_scopes: 'true',
        display: 'popup',
        hd: '*', // Allow any domain
      });
      
      // Attempt sign in with popup
      const result = await signInWithPopup(auth, googleProvider);
      
      if (result.user) {
        // Create or update user profile
        const profile = await createOrUpdateUserProfile(result.user, role);
        setUser(result.user);
        setUserProfile(profile);
        
        // Store role in localStorage for persistence
        localStorage.setItem('userRole', role);
      }
    } catch (error) {
      const errorMessage = handleAuthError(error as AuthError);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      localStorage.removeItem('userRole');
      setError(null);
    } catch (error) {
      const errorMessage = handleAuthError(error as AuthError);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user || !userProfile) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, updates, { merge: true });
      
      const updatedProfile = { ...userProfile, ...updates };
      setUserProfile(updatedProfile);
    } catch (error) {
      const errorMessage = handleAuthError(error as AuthError);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Clear error
  const clearError = (): void => {
    setError(null);
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Load user profile from Firestore
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const profileData = userSnap.data() as UserProfile;
            setUser(firebaseUser);
            setUserProfile(profileData);
          } else {
            // If no profile exists, create one with stored role or default
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
        const errorMessage = handleAuthError(error as AuthError);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [handleAuthError]);

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    error,
    isAuthenticating,
    signInWithGoogle,
    logout,
    clearError,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};