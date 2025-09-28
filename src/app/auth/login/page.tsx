// 로그인 페이지 - 역할 선택 포함
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

function LoginContent() {
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'student' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signInWithGoogle, currentUser, userProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // URL 파라미터에서 role 가져오기
    const roleParam = searchParams.get('role');
    if (roleParam === 'teacher' || roleParam === 'student') {
      setSelectedRole(roleParam);
    }
  }, [searchParams]);

  useEffect(() => {
    console.log('🔐 로그인 페이지 - 상태:', { 
      currentUser: currentUser?.email, 
      userProfile: userProfile?.role 
    });
    
    // 이미 로그인된 사용자는 적절한 대시보드로 리다이렉트
    if (currentUser && userProfile) {
      console.log('🔄 로그인 페이지에서 리다이렉트 - 역할:', userProfile.role);
      if (userProfile.role === 'teacher') {
        console.log('👨‍🏫 로그인 페이지에서 교사 대시보드로 이동');
        router.push('/teacher/dashboard');
      } else {
        console.log('👨‍🎓 로그인 페이지에서 학생 대시보드로 이동');
        router.push('/student/dashboard');
      }
    }
  }, [currentUser, userProfile, router]);

  const handleGoogleLogin = async () => {
    if (!selectedRole) {
      setError('먼저 역할을 선택해주세요.');
      return;
    }

    console.log('🔑 Google 로그인 시작 - 선택된 역할:', selectedRole);
    setLoading(true);
    setError(null);

    try {
      await signInWithGoogle(selectedRole);
      console.log('✅ Google 로그인 성공 - 역할:', selectedRole);
      // AuthContext에서 자동으로 프로필 생성 및 역할 설정됨
      // useEffect에서 리다이렉트 처리
    } catch (error) {
      console.error('❌ 로그인 오류:', error);
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-gray-700">
            SEL 감정분석 플랫폼
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            플랫폼에 로그인
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            역할을 선택하고 Google 계정으로 로그인하세요
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 sm:px-10">
          <CardContent className="space-y-6">
            {/* 역할 선택 */}
            <div>
              <Label className="text-base font-medium text-gray-900">
                로그인 유형을 선택하세요
              </Label>
              <p className="text-sm leading-5 text-gray-500 mt-1">
                교사 또는 학생 중 해당하는 역할을 선택해주세요.
              </p>
              <RadioGroup 
                value={selectedRole || ''} 
                onValueChange={(value) => setSelectedRole(value as 'teacher' | 'student')}
                className="mt-4"
              >
                <Card className={`relative cursor-pointer transition-colors ${
                  selectedRole === 'teacher' 
                    ? 'border-primary bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}>
                  <CardContent className="flex items-center space-x-3 p-4">
                    <RadioGroupItem value="teacher" id="teacher" />
                    <div className="flex-1">
                      <Label htmlFor="teacher" className="text-sm font-medium cursor-pointer">
                        교사 (Teacher)
                      </Label>
                      <p className="text-sm text-gray-500">
                        학급 관리, 학생 모니터링, 상담 데이터 분석
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`relative cursor-pointer transition-colors ${
                  selectedRole === 'student' 
                    ? 'border-primary bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}>
                  <CardContent className="flex items-center space-x-3 p-4">
                    <RadioGroupItem value="student" id="student" />
                    <div className="flex-1">
                      <Label htmlFor="student" className="text-sm font-medium cursor-pointer">
                        학생 (Student)
                      </Label>
                      <p className="text-sm text-gray-500">
                        감정 설문 참여, 개인 상담 데이터 확인
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </RadioGroup>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Google 로그인 버튼 */}
            <Button
              onClick={handleGoogleLogin}
              disabled={!selectedRole || loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  로그인 중...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google로 로그인
                </>
              )}
            </Button>

            {/* 추가 정보 */}
            <div className="text-center text-sm text-muted-foreground">
              <p>계정이 없으신가요? Google 로그인 시 자동으로 계정이 생성됩니다.</p>
            </div>

            {/* 홈으로 돌아가기 */}
            <div className="text-center">
              <Link 
                href="/" 
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                ← 홈으로 돌아가기
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}