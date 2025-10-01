'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Chrome, 
  AlertCircle, 
  Loader2, 
  CheckCircle2,
  Shield,
  GraduationCap,
  Heart,
  UserCheck,
  Sparkles
} from 'lucide-react';

type UserRole = 'teacher' | 'student' | null;

export default function LoginPage() {
  const { signInWithGoogle, loading, error, clearError, refreshProfile } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const router = useRouter();

  const handleRoleSelect = (role: 'teacher' | 'student') => {
    setSelectedRole(role);
    clearError();
  };

  const handleGoogleLogin = async (role: 'teacher' | 'student') => {
    if (!role) return;

    clearError();
    setIsAuthenticating(true);

    try {
      console.log('🔐 [LoginPage] 로그인 시작:', { role });
      await signInWithGoogle(role);

      console.log('✅ [LoginPage] 로그인 완료, 프로필 새로고침 중...');

      // ✅ 중요: 로그인 직후 최신 프로필 정보를 가져옴
      await refreshProfile();

      console.log('✅ [LoginPage] 프로필 새로고침 완료');

      // 교사 로그인 성공 후 리다이렉트
      if (role === 'teacher') {
        // ✅ 프로필에서 classCode 확인
        // refreshProfile() 완료 후 AuthContext의 userProfile이 업데이트됨
        // 하지만 React state 업데이트는 비동기이므로 직접 Firestore에서 확인
        const { getDoc, doc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        const { auth } = await import('@/lib/firebase');

        const currentUser = auth?.currentUser;
        if (!currentUser) {
          throw new Error('사용자 정보를 찾을 수 없습니다.');
        }

        const userRef = doc(db!, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const hasClassCode = userData?.schoolInfo?.classCode;

          console.log('🔍 [LoginPage] 학급 정보 확인:', {
            hasClassCode: !!hasClassCode,
            classCode: hasClassCode || '없음'
          });

          if (hasClassCode) {
            console.log('✅ [LoginPage] 기존 교사 → 대시보드로 이동');
            router.push('/teacher/dashboard');
          } else {
            console.log('🆕 [LoginPage] 신규 교사 → 온보딩으로 이동');
            router.push('/teacher/onboarding');
          }
        } else {
          // Firestore 문서가 없는 경우 (비정상 상황)
          console.warn('⚠️ [LoginPage] 사용자 문서 없음 → 온보딩으로 이동');
          router.push('/teacher/onboarding');
        }
      } else {
        // 학생은 대시보드로
        console.log('✅ [LoginPage] 학생 → 대시보드로 이동');
        router.push('/student/dashboard');
      }
    } catch (error) {
      console.error('❌ [LoginPage] 로그인 오류:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 역할별 카드 정보
  const roleCards = [
    {
      role: 'teacher' as const,
      title: '교사',
      subtitle: '선생님용 대시보드',
      description: '학생들의 사회정서학습(SEL) 상태를 체계적으로 모니터링하고 분석합니다',
      icon: GraduationCap,
      primaryColor: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-50',
      borderColor: 'border-blue-200',
      selectedBg: 'bg-blue-50',
      selectedBorder: 'border-blue-500',
      accentIcon: UserCheck
    },
    {
      role: 'student' as const,
      title: '학생',
      subtitle: '나만의 감정 공간',
      description: '안전한 환경에서 나의 감정을 기록하고 개인 맞춤 피드백을 받습니다',
      icon: Heart,
      primaryColor: 'bg-emerald-500',
      hoverColor: 'hover:bg-emerald-50',
      borderColor: 'border-emerald-200',
      selectedBg: 'bg-emerald-50',
      selectedBorder: 'border-emerald-500',
      accentIcon: Sparkles
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-emerald-800 bg-clip-text text-transparent">
                MindLog
              </h1>
              <p className="text-blue-600 font-medium text-sm mt-1">SEL 감정분석 플랫폼</p>
            </div>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
            학생들의 건강한 정서 발달을 위한 <span className="font-semibold text-blue-600">안전하고 신뢰할 수 있는</span> 교육 플랫폼
          </p>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <Alert className="mb-8 border-red-200 bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription>
              <div className="font-semibold text-red-800 mb-1">로그인 오류</div>
              <p className="text-red-700">{error}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* 역할 선택 */}
        <Card className="mb-8 border-gray-200 shadow-xl bg-white/70 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">사용자 유형을 선택해주세요</CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">
              선택하신 유형에 따라 최적화된 기능과 인터페이스를 제공합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid lg:grid-cols-2 gap-6">
              {roleCards.map((card) => {
                const Icon = card.icon;
                const AccentIcon = card.accentIcon;
                const isSelected = selectedRole === card.role;
                
                return (
                  <button
                    key={card.role}
                    onClick={() => handleRoleSelect(card.role)}
                    className={`group relative p-8 rounded-2xl border-2 transition-all duration-300 text-left transform hover:scale-[1.02] ${
                      isSelected
                        ? `${card.selectedBorder} ${card.selectedBg} shadow-xl`
                        : `${card.borderColor} bg-white/50 hover:bg-white/80 hover:shadow-lg`
                    }`}
                    disabled={loading}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                  >
                    {/* 선택 표시 */}
                    {isSelected && (
                      <div className="absolute top-4 right-4">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-6">
                      {/* 아이콘 */}
                      <div className={`relative p-4 rounded-xl ${
                        isSelected ? card.primaryColor : 'bg-gray-100 group-hover:bg-gray-200'
                      } transition-all duration-300`}>
                        <Icon className={`w-8 h-8 ${
                          isSelected ? 'text-white' : 'text-gray-600'
                        }`} />
                        {isSelected && (
                          <div className="absolute -top-1 -right-1">
                            <AccentIcon className="w-4 h-4 text-yellow-400" />
                          </div>
                        )}
                      </div>

                      {/* 내용 */}
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-gray-900 mb-2">{card.title}</h3>
                        <p className="text-blue-600 font-medium text-sm mb-3">{card.subtitle}</p>
                        <p className="text-gray-600 text-sm leading-relaxed">{card.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Google 로그인 */}
        <Card className="border-gray-200 shadow-xl bg-white/70 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Chrome className="w-6 h-6 text-blue-500" />
              <CardTitle className="text-xl">Google 계정으로 안전하게 로그인</CardTitle>
            </div>
            <CardDescription className="text-base">
              {selectedRole 
                ? (
                  <span className="font-semibold text-blue-600">
                    {selectedRole === 'teacher' ? '교사' : '학생'} 계정으로 로그인합니다
                  </span>
                )
                : (
                  <span className="text-amber-600 font-medium">
                    ⬆️ 먼저 사용자 유형을 선택해주세요
                  </span>
                )
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* 로딩 상태 */}
            {(loading || isAuthenticating) && (
              <div className="space-y-4 p-6 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="font-medium text-blue-800">
                    Google 인증 진행 중...
                  </span>
                </div>
                <p className="text-sm text-center text-blue-600">
                  잠시만 기다려주세요. 안전한 인증을 진행하고 있습니다.
                </p>
              </div>
            )}

            {/* Google 로그인 버튼 */}
            <Button
              onClick={() => selectedRole && handleGoogleLogin(selectedRole)}
              disabled={!selectedRole || loading || isAuthenticating}
              className={`w-full h-14 text-lg font-semibold transition-all duration-300 ${
                selectedRole 
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl hover:scale-[1.02]' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              variant="default"
            >
              {(loading || isAuthenticating) ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  인증 중...
                </>
              ) : (
                <>
                  <Chrome className="mr-3 h-6 w-6" />
                  Google로 로그인
                </>
              )}
            </Button>

            {/* 보안 안내 */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="font-medium">보안 인증 정보</span>
              </div>
              <div className="text-xs text-center text-gray-500 space-y-1">
                <p>• Google OAuth 2.0 보안 프로토콜 사용</p>
                <p>• 개인정보는 암호화되어 안전하게 보호됩니다</p>
                <p>• 교육부 개인정보보호 가이드라인 준수</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 푸터 */}
        <div className="text-center mt-10 space-y-2">
          <p className="text-sm text-gray-500">
            © 2025 MindLog - SEL 감정분석 플랫폼. 모든 권리 보유.
          </p>
          <p className="text-xs text-gray-400">
            학생들의 건강한 정서 발달을 위한 안전하고 신뢰할 수 있는 교육 플랫폼
          </p>
        </div>
      </div>
    </div>
  );
}