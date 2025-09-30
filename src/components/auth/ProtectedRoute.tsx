// 역할 기반 접근 제어 컴포넌트
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: 'teacher' | 'student';
  requireSchoolInfo?: boolean; // 교사의 경우 학급 설정 필수 여부
}

export default function ProtectedRoute({
  children,
  requiredRole,
  requireSchoolInfo = false
}: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 로딩 완료 후 체크
    if (!loading) {
      console.log('🔒 ProtectedRoute 체크:', {
        hasUser: !!user,
        profileRole: userProfile?.role,
        requiredRole,
        hasSchoolInfo: !!userProfile?.schoolInfo
      });

      // 1. 로그인되지 않은 경우 → 로그인 페이지
      if (!user) {
        console.log('❌ 로그인 필요 → 로그인 페이지로 이동');
        router.push('/auth/login');
        return;
      }

      // 2. 프로필이 아직 로드되지 않은 경우 → 잠시 대기
      if (!userProfile) {
        console.log('⏳ 프로필 로딩 중...');
        return;
      }

      // 3. 역할이 일치하지 않는 경우 → 적절한 대시보드로 리다이렉트
      if (userProfile.role !== requiredRole) {
        console.log(`❌ 역할 불일치: ${userProfile.role} !== ${requiredRole}`);

        if (userProfile.role === 'teacher') {
          // 교사인데 학생 페이지 접근 시도
          console.log('👨‍🏫 교사 → 교사 대시보드로 리다이렉트');

          // 학급 정보가 있는지 확인
          if (userProfile.schoolInfo?.schoolName) {
            router.push('/teacher/dashboard');
          } else {
            // 학급 설정이 필요한 경우 온보딩으로
            router.push('/teacher/onboarding');
          }
        } else if (userProfile.role === 'student') {
          // 학생인데 교사 페이지 접근 시도
          console.log('👨‍🎓 학생 → 학생 대시보드로 리다이렉트');
          router.push('/student/dashboard');
        } else {
          // 알 수 없는 역할
          console.log('⚠️ 알 수 없는 역할 → 로그인 페이지로');
          router.push('/auth/login');
        }
        return;
      }

      // 4. 교사이고 학급 정보 필수인데 없는 경우 → 온보딩으로
      if (requiredRole === 'teacher' && requireSchoolInfo && !userProfile.schoolInfo?.schoolName) {
        console.log('⚠️ 학급 정보 필요 → 온보딩 페이지로 이동');
        router.push('/teacher/onboarding');
        return;
      }

      // 5. 모든 조건 통과 ✅
      console.log('✅ 접근 권한 확인 완료');
    }
  }, [user, userProfile, loading, requiredRole, requireSchoolInfo, router]);

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 로그인 안 됨
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CardTitle className="text-2xl font-bold">로그인이 필요합니다</CardTitle>
              <p className="mt-2 text-muted-foreground">
                이 페이지에 접근하려면 로그인이 필요합니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 프로필 로딩 대기
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">프로필 확인 중...</p>
        </div>
      </div>
    );
  }

  // 역할 불일치 (리다이렉트 대기 중)
  if (userProfile.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">리다이렉트 중...</p>
        </div>
      </div>
    );
  }

  // 학급 정보 필요 (온보딩으로 리다이렉트 대기)
  if (requiredRole === 'teacher' && requireSchoolInfo && !userProfile.schoolInfo?.schoolName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">학급 설정 페이지로 이동 중...</p>
        </div>
      </div>
    );
  }

  // 모든 조건 통과 → 렌더링
  return <>{children}</>;
}