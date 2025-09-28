import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export interface UseAuthReturn {
  isLoading: boolean;
  error: string | null;
  isContentBlocked: boolean;
  login: (role: 'teacher' | 'student') => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  checkContentBlocker: () => Promise<boolean>;
}

export const useAuthFlow = (): UseAuthReturn => {
  const { signInWithGoogle, logout, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isContentBlocked, setIsContentBlocked] = useState(false);

  // Content blocker detection
  const checkContentBlocker = useCallback(async (): Promise<boolean> => {
    try {
      // Try to fetch Google Analytics (commonly blocked)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      await fetch('https://www.google-analytics.com/analytics.js', {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return false; // Not blocked
    } catch (error) {
      console.warn('Content blocker detected:', error);
      return true; // Likely blocked
    }
  }, []);

  // Check for content blocker on mount
  useEffect(() => {
    checkContentBlocker().then(setIsContentBlocked);
  }, [checkContentBlocker]);

  // Enhanced login with comprehensive error handling
  const login = useCallback(async (role: 'teacher' | 'student'): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check for content blocker before attempting login
      const blocked = await checkContentBlocker();
      if (blocked) {
        setIsContentBlocked(true);
        setError('콘텐츠 차단기가 감지되었습니다. 로그인을 위해 광고 차단기를 일시적으로 비활성화해 주세요.');
        return;
      }

      // Attempt Google login
      await signInWithGoogle(role);
      
      // Navigate based on role
      const targetPath = role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
      router.push(targetPath);
    } catch (error) {
      console.error('Login error:', error);
      setError('로그인 처리 중 예기치 않은 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [signInWithGoogle, router, checkContentBlocker]);

  // Enhanced logout
  const handleLogout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      setError('로그아웃 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [logout, router]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading: isLoading || authLoading,
    error,
    isContentBlocked,
    login,
    logout: handleLogout,
    clearError,
    checkContentBlocker,
  };
};

export default useAuthFlow;