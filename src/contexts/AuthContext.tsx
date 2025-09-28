'use client';

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback, 
  useRef 
} from 'react';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged, 
  User, 
  AuthError as FirebaseAuthError,
  UserCredential,
  GoogleAuthProvider 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// Enhanced type definitions for better type safety
interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'teacher' | 'student' | null;
  createdAt: Date;
  lastLoginAt: Date;
  isActive: boolean;
  loginMethod: 'google' | null;
  browserInfo?: {
    userAgent: string;
    language: string;
    platform: string;
  };
  schoolInfo?: {
    schoolName: string;
    grade: number;
    className: string;
    classCode: string;
    teacherId: string;
  };
}

interface AuthError {
  code: string;
  message: string;
  userFriendlyMessage: string;
  isRetryable: boolean;
  retryAfter?: number;
  fallbackMethod?: 'redirect' | 'manual';
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: AuthError | null;
  isAuthenticating: boolean;
  authMethod: 'popup' | 'redirect' | null;
  
  // Core auth methods
  signInWithGoogle: (role: 'teacher' | 'student', forceRedirect?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  
  // State management
  clearError: () => void;
  retryAuth: () => Promise<void>;
  
  // Profile management
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  
  // Utility methods
  getAuthCapabilities: () => AuthCapabilities;
  isContentBlockerDetected: () => boolean;
}

interface AuthCapabilities {
  canUsePopup: boolean;
  canUseRedirect: boolean;
  hasContentBlocker: boolean;
  isSSR: boolean;
  recommendedMethod: 'popup' | 'redirect';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

// Custom hook for browser capability detection
const useBrowserCapabilities = (): AuthCapabilities => {
  const [capabilities, setCapabilities] = useState<AuthCapabilities>({
    canUsePopup: false,
    canUseRedirect: true,
    hasContentBlocker: false,
    isSSR: true,
    recommendedMethod: 'redirect'
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const detectCapabilities = () => {
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isInAppBrowser = /FBAN|FBAV|Instagram|Line|WhatsApp|Telegram/.test(userAgent);
      
      // Content blocker detection
      const hasContentBlocker = document.querySelector('script[src*="googleads"]') === null ||
                               document.querySelector('script[src*="google-analytics"]') === null ||
                               !!window.navigator.userAgent.match(/adblock|ublock/i);

      // Popup capability detection
      const canUsePopup = !isIOS && !isInAppBrowser && !hasContentBlocker;
      
      setCapabilities({
        canUsePopup,
        canUseRedirect: true,
        hasContentBlocker,
        isSSR: false,
        recommendedMethod: canUsePopup ? 'popup' : 'redirect'
      });
    };

    // Run detection after a small delay to ensure DOM is ready
    const timer = setTimeout(detectCapabilities, 100);
    return () => clearTimeout(timer);
  }, []);

  return capabilities;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Core state
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authMethod, setAuthMethod] = useState<'popup' | 'redirect' | null>(null);
  
  // Refs for cleanup and state management
  const authStateListenerRef = useRef<(() => void) | null>(null);
  const lastAuthAttemptRef = useRef<{ method: string; timestamp: number; role: string } | null>(null);
  const retryCountRef = useRef(0);
  
  // Browser capabilities detection
  const capabilities = useBrowserCapabilities();

  // Enhanced error handling with comprehensive error mapping
  const createAuthError = useCallback((originalError: FirebaseAuthError | Error | unknown): AuthError => {
    const errorCode = (originalError as { code?: string })?.code || 'unknown';
    const errorMessage = (originalError as { message?: string })?.message || 'Unknown error';
    
    console.error('🔥 Authentication Error:', { 
      code: errorCode, 
      message: errorMessage,
      stack: (originalError as { stack?: string })?.stack 
    });

    // Comprehensive error mapping
    const errorMap: Record<string, Partial<AuthError>> = {
      // Popup-related errors
      'auth/popup-blocked': {
        userFriendlyMessage: '팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용하거나 다른 방법으로 로그인해 보세요.',
        isRetryable: true,
        fallbackMethod: 'redirect'
      },
      'auth/popup-closed-by-user': {
        userFriendlyMessage: '로그인 창이 닫혔습니다. 다시 시도해 주세요.',
        isRetryable: true
      },
      'auth/cancelled-popup-request': {
        userFriendlyMessage: '로그인이 취소되었습니다. 다시 시도해 주세요.',
        isRetryable: true
      },
      
      // Network-related errors
      'auth/network-request-failed': {
        userFriendlyMessage: '네트워크 연결을 확인해 주세요. 인터넷 연결이 불안정합니다.',
        isRetryable: true,
        retryAfter: 3000
      },
      'auth/timeout': {
        userFriendlyMessage: '로그인 시간이 초과되었습니다. 다시 시도해 주세요.',
        isRetryable: true,
        retryAfter: 2000
      },
      
      // Account-related errors
      'auth/account-exists-with-different-credential': {
        userFriendlyMessage: '이미 다른 방식으로 가입된 계정입니다. 기존 로그인 방식을 사용해 주세요.',
        isRetryable: false
      },
      'auth/user-disabled': {
        userFriendlyMessage: '계정이 비활성화되었습니다. 관리자에게 문의해 주세요.',
        isRetryable: false
      },
      'auth/user-cancelled': {
        userFriendlyMessage: '로그인이 취소되었습니다.',
        isRetryable: true
      },
      
      // Configuration errors
      'auth/operation-not-allowed': {
        userFriendlyMessage: '구글 로그인이 비활성화되어 있습니다. 관리자에게 문의해 주세요.',
        isRetryable: false
      },
      'auth/unauthorized-domain': {
        userFriendlyMessage: '이 도메인에서는 로그인할 수 없습니다. 관리자에게 문의해 주세요.',
        isRetryable: false
      },
      'auth/configuration-not-found': {
        userFriendlyMessage: '로그인 설정에 문제가 있습니다. 관리자에게 문의해 주세요.',
        isRetryable: false
      },
      
      // Content blocker specific errors
      'ERR_BLOCKED_BY_CLIENT': {
        userFriendlyMessage: '광고 차단기가 로그인을 방해하고 있습니다. 광고 차단기를 일시적으로 비활성화하거나 다른 브라우저를 사용해 주세요.',
        isRetryable: true,
        fallbackMethod: 'redirect'
      }
    };

    // Check for content blocker interference
    if (errorMessage.includes('ERR_BLOCKED_BY_CLIENT') || 
        errorMessage.includes('ERR_BLOCKED_BY_CONTENT_BLOCKER') ||
        errorMessage.includes('net::ERR_BLOCKED_BY_CONTENT_BLOCKER') ||
        capabilities.hasContentBlocker) {
      return {
        code: 'content-blocker',
        message: errorMessage,
        userFriendlyMessage: '광고 차단기 또는 콘텐츠 차단기가 구글 로그인을 방해하고 있습니다. 차단기를 일시적으로 비활성화하거나 다른 브라우저를 사용해 주세요.',
        isRetryable: true,
        fallbackMethod: 'redirect'
      };
    }

    const errorDetails = errorMap[errorCode] || {};
    
    return {
      code: errorCode,
      message: errorMessage,
      userFriendlyMessage: errorDetails.userFriendlyMessage || '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      isRetryable: errorDetails.isRetryable ?? true,
      retryAfter: errorDetails.retryAfter,
      fallbackMethod: errorDetails.fallbackMethod
    };
  }, [capabilities.hasContentBlocker]);

  // Browser info collection for enhanced debugging
  const getBrowserInfo = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData?.platform || navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      connectionType: (navigator as unknown as { connection?: { effectiveType?: string } }).connection?.effectiveType || 'unknown'
    };
  }, []);

  // Create or update user profile with enhanced data
  const createOrUpdateUserProfile = useCallback(async (
    firebaseUser: User, 
    role: 'teacher' | 'student'
  ): Promise<UserProfile> => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    
    const now = new Date();
    const browserInfo = getBrowserInfo();
    
    if (userSnap.exists()) {
      // Update existing user
      const existingData = userSnap.data();
      const updatedProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || existingData.email || null,
        displayName: firebaseUser.displayName || existingData.displayName || null,
        photoURL: firebaseUser.photoURL || existingData.photoURL || null,
        role: existingData.role || role,
        createdAt: existingData.createdAt instanceof Timestamp 
          ? existingData.createdAt.toDate() 
          : existingData.createdAt || now,
        lastLoginAt: now,
        isActive: true,
        loginMethod: 'google',
        browserInfo: browserInfo || existingData.browserInfo,
        schoolInfo: existingData.schoolInfo
      };
      
      await setDoc(userRef, {
        ...updatedProfile,
        lastLoginAt: serverTimestamp(),
        browserInfo
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
        loginMethod: 'google',
        browserInfo: browserInfo || undefined
      };
      
      await setDoc(userRef, {
        ...newProfile,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        browserInfo
      });
      
      return newProfile;
    }
  }, [getBrowserInfo]);

  // Popup-based authentication with enhanced error handling
  const attemptPopupAuth = useCallback(async (): Promise<UserCredential> => {
    // Configure provider for popup
    const popupProvider = new GoogleAuthProvider();
    popupProvider.setCustomParameters({
      prompt: 'select_account',
      access_type: 'online',
      include_granted_scopes: 'true',
      display: 'popup'
    });

    // Add popup-specific timeout
    const authPromise = signInWithPopup(auth, popupProvider);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('auth/timeout')), 30000);
    });

    return Promise.race([authPromise, timeoutPromise]);
  }, []);

  // Redirect-based authentication
  const attemptRedirectAuth = useCallback(async (role: 'teacher' | 'student'): Promise<void> => {
    // Store role for after redirect
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pendingRole', role);
      sessionStorage.setItem('authMethod', 'redirect');
    }

    // Configure provider for redirect
    const redirectProvider = new GoogleAuthProvider();
    redirectProvider.setCustomParameters({
      prompt: 'select_account',
      access_type: 'online',
      include_granted_scopes: 'true'
    });

    await signInWithRedirect(auth, redirectProvider);
  }, []);

  // Handle redirect result on page load
  const handleRedirectResult = useCallback(async (): Promise<void> => {
    if (typeof window === 'undefined') return;

    try {
      const result = await getRedirectResult(auth);
      const pendingRole = sessionStorage.getItem('pendingRole') as 'teacher' | 'student' | null;
      
      if (result?.user && pendingRole) {
        console.log('✅ Redirect authentication successful');
        
        // Create or update profile
        const profile = await createOrUpdateUserProfile(result.user, pendingRole);
        setUser(result.user);
        setUserProfile(profile);
        
        // Store role in localStorage for persistence
        localStorage.setItem('userRole', pendingRole);
        
        // Clear session storage
        sessionStorage.removeItem('pendingRole');
        sessionStorage.removeItem('authMethod');
        
        // Clear any existing errors
        setError(null);
      }
    } catch (error) {
      console.error('❌ Redirect result error:', error);
      const authError = createAuthError(error);
      setError(authError);
      
      // Clear session storage on error
      sessionStorage.removeItem('pendingRole');
      sessionStorage.removeItem('authMethod');
    }
  }, [createOrUpdateUserProfile, createAuthError]);

  // Main authentication method with smart fallback
  const signInWithGoogle = useCallback(async (
    role: 'teacher' | 'student', 
    forceRedirect: boolean = false
  ): Promise<void> => {
    if (isAuthenticating) {
      console.warn('⚠️ Authentication already in progress');
      return;
    }

    try {
      setIsAuthenticating(true);
      setError(null);
      
      // Store attempt info for retry logic
      lastAuthAttemptRef.current = {
        method: forceRedirect ? 'redirect' : capabilities.recommendedMethod,
        timestamp: Date.now(),
        role
      };

      const shouldUseRedirect = forceRedirect || 
                               !capabilities.canUsePopup || 
                               capabilities.hasContentBlocker ||
                               retryCountRef.current > 0;

      if (shouldUseRedirect) {
        console.log('🔄 Using redirect authentication');
        setAuthMethod('redirect');
        await attemptRedirectAuth(role);
        return; // Redirect will handle the rest
      } else {
        console.log('🪟 Using popup authentication');
        setAuthMethod('popup');
        const result = await attemptPopupAuth();
        
        if (result.user) {
          console.log('✅ Popup authentication successful');
          
          // Create or update user profile
          const profile = await createOrUpdateUserProfile(result.user, role);
          setUser(result.user);
          setUserProfile(profile);
          
          // Store role in localStorage for persistence
          if (typeof window !== 'undefined') {
            localStorage.setItem('userRole', role);
          }
          
          // Reset retry count on success
          retryCountRef.current = 0;
        }
      }
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      const authError = createAuthError(error);
      setError(authError);
      
      // Increment retry count
      retryCountRef.current += 1;
      
      // Auto-retry with fallback if applicable
      if (authError.isRetryable && authError.fallbackMethod && retryCountRef.current === 1) {
        console.log(`🔄 Auto-retrying with ${authError.fallbackMethod} method`);
        setTimeout(() => {
          signInWithGoogle(role, authError.fallbackMethod === 'redirect');
        }, authError.retryAfter || 2000);
      }
      
      throw authError;
    } finally {
      setIsAuthenticating(false);
    }
  }, [
    isAuthenticating, 
    capabilities, 
    createAuthError, 
    attemptPopupAuth, 
    attemptRedirectAuth, 
    createOrUpdateUserProfile
  ]);

  // Retry authentication with last parameters
  const retryAuth = useCallback(async (): Promise<void> => {
    if (!lastAuthAttemptRef.current) {
      throw new Error('No previous authentication attempt to retry');
    }

    const { role } = lastAuthAttemptRef.current;
    retryCountRef.current += 1;
    
    // Use opposite method for retry
    const useRedirect = authMethod === 'popup';
    await signInWithGoogle(role as 'teacher' | 'student', useRedirect);
  }, [authMethod, signInWithGoogle]);

  // Enhanced logout with complete cleanup
  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Sign out from Firebase
      await signOut(auth);
      
      // Clear state
      setUser(null);
      setUserProfile(null);
      setError(null);
      setAuthMethod(null);
      
      // Clear storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userRole');
        sessionStorage.removeItem('pendingRole');
        sessionStorage.removeItem('authMethod');
      }
      
      // Reset retry count
      retryCountRef.current = 0;
      lastAuthAttemptRef.current = null;
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      const authError = createAuthError(error);
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, [createAuthError]);

  // Update user profile with optimistic updates
  const updateUserProfile = useCallback(async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user || !userProfile) {
      throw new Error('No authenticated user to update');
    }
    
    try {
      // Optimistic update
      const optimisticProfile = { ...userProfile, ...updates };
      setUserProfile(optimisticProfile);
      
      // Update in Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, updates, { merge: true });
      
      console.log('✅ Profile updated successfully');
    } catch (error) {
      console.error('❌ Profile update error:', error);
      
      // Revert optimistic update
      setUserProfile(userProfile);
      
      const authError = createAuthError(error);
      setError(authError);
      throw authError;
    }
  }, [user, userProfile, createAuthError]);

  // Refresh user profile from Firestore
  const refreshUserProfile = useCallback(async (): Promise<void> => {
    if (!user) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const profileData = userSnap.data() as UserProfile;
        setUserProfile(profileData);
        console.log('✅ Profile refreshed successfully');
      }
    } catch (error) {
      console.error('❌ Profile refresh error:', error);
      const authError = createAuthError(error);
      setError(authError);
    }
  }, [user, createAuthError]);

  // Clear error state
  const clearError = useCallback((): void => {
    setError(null);
    retryCountRef.current = 0;
  }, []);

  // Get auth capabilities
  const getAuthCapabilities = useCallback((): AuthCapabilities => {
    return capabilities;
  }, [capabilities]);

  // Check if content blocker is detected
  const isContentBlockerDetected = useCallback((): boolean => {
    return capabilities.hasContentBlocker;
  }, [capabilities.hasContentBlocker]);

  // Auth state listener with enhanced error handling
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('🔧 Setting up auth state listener');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log('👤 User authenticated:', firebaseUser.uid);
          
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
          console.log('👤 User not authenticated');
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('❌ Auth state change error:', error);
        const authError = createAuthError(error);
        setError(authError);
      } finally {
        setLoading(false);
      }
    });

    authStateListenerRef.current = unsubscribe;
    return () => {
      unsubscribe();
      authStateListenerRef.current = null;
    };
  }, [createAuthError, createOrUpdateUserProfile]);

  // Handle redirect result on initial load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const wasRedirectAuth = sessionStorage.getItem('authMethod') === 'redirect';
    if (wasRedirectAuth) {
      handleRedirectResult();
    }
  }, [handleRedirectResult]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (authStateListenerRef.current) {
        authStateListenerRef.current();
      }
    };
  }, []);

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    error,
    isAuthenticating,
    authMethod,
    signInWithGoogle,
    logout,
    clearError,
    retryAuth,
    updateUserProfile,
    refreshUserProfile,
    getAuthCapabilities,
    isContentBlockerDetected
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Enhanced hook with better error handling
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Type exports for external use
export type { UserProfile, AuthError, AuthCapabilities };