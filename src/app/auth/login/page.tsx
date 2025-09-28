'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthFlow } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Chrome, 
  Users, 
  BookOpen, 
  AlertCircle, 
  Loader2, 
  CheckCircle,
  Shield,
  Globe,
  RefreshCw
} from 'lucide-react';

type UserRole = 'teacher' | 'student' | null;

export default function LoginPage() {
  const { user } = useAuth();
  const { login, logout, isLoading, error: authError, isContentBlocked, clearError } = useAuthFlow();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [showContentBlockerWarning, setShowContentBlockerWarning] = useState(false);

  // Keyboard navigation support
  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  // Content blocker detection
  useEffect(() => {
    if (isContentBlocked) {
      setShowContentBlockerWarning(true);
    }
  }, [isContentBlocked]);

  const handleRoleSelect = (role: 'teacher' | 'student') => {
    setSelectedRole(role);
    clearError();
  };

  // Handle Google login with accessibility support
  const handleGoogleLogin = async (role: 'teacher' | 'student') => {
    if (!role) return;
    
    clearError();
    await login(role);
  };

  // Add isAuthenticating state for progress indication
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Show comprehensive troubleshooting guide
  const showTroubleshootingGuide = () => {
    alert(`🔧 로그인 문제 해결 가이드

1️⃣ 광고 차단기 비활성화
   • 브라우저 확장 프로그램에서 광고 차단기를 일시적으로 끄세요
   • 주로 uBlock Origin, AdBlock Plus 등이 영향을 줍니다

2️⃣ 팝업 차단 해제
   • 브라우저 주소창 오른쪽의 팝업 차단 아이콘을 클릭하여 허용
   • 또는 브라우저 설정 > 개인정보 및 보안 > 팝업 및 리디렉션에서 허용

3️⃣ 다른 브라우저 시도
   • Chrome 권장 (가장 높은 호환성)
   • Safari, Firefox, Edge도 지원

4️⃣ 시크릿 모드 사용
   • Ctrl+Shift+N (Windows) 또는 Cmd+Shift+N (Mac)
   • 확장 프로그램이 자동으로 비활성화됩니다

5️⃣ 네트워크 확인
   • 인터넷 연결이 정상적인지 확인
   • 회사/학교 네트워크의 방화벽일 수 있습니다

문제가 지속되면 관리자에게 문의하세요. 📧`);
  };

  const roleCards = [
    {
      role: 'teacher' as const,
      title: '선생님',
      description: '학생들의 감정 상태를 모니터링하고 분석합니다',
      icon: Users,
      color: 'blue',
      features: ['학생 감정 분석', '리포트 생성', '클래스 관리', '실시간 모니터링']
    },
    {
      role: 'student' as const,
      title: '학생',
      description: '나의 감정 상태를 기록하고 피드백을 받습니다',
      icon: BookOpen,
      color: 'green',
      features: ['감정 일기 작성', '피드백 받기', '진행 상황 추적', '개인화된 통계']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4" role="main" aria-label="로그인 페이지">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div 
              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center"
              role="img"
              aria-label="SEL 감정분석 플랫폼 로고"
            >
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">SEL 감정분석 플랫폼</h1>
          </div>
          <p className="text-gray-600 text-lg">감정 인식과 분석을 위한 안전한 공간</p>
        </div>

        {/* Content Blocker Warning */}
        {showContentBlockerWarning && (
          <Alert 
            className="mb-6 border-amber-200 bg-amber-50"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <div className="flex items-center justify-between">
                <span>콘텐츠 차단기가 감지되었습니다. 로그인에 문제가 있을 수 있습니다.</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={showTroubleshootingGuide}
                  className="ml-4 border-amber-300 text-amber-700 hover:bg-amber-100"
                  aria-label="문제 해결 방법 보기"
                >
                  해결 방법 보기
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {authError && (
          <Alert 
            className="mb-6 border-red-200 bg-red-50"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{authError}</AlertDescription>
          </Alert>
        )}

        {/* Role Selection */}
        <Card className="mb-6 border-gray-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">사용자 유형을 선택하세요</CardTitle>
            <CardDescription>당신의 역할에 맞는 기능을 제공합니다</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {roleCards.map((card) => {
                const Icon = card.icon;
                const isSelected = selectedRole === card.role;
                
                return (
                  <button
                    key={card.role}
                    onClick={() => handleRoleSelect(card.role)}
                    onKeyDown={(e) => handleKeyDown(e, () => handleRoleSelect(card.role))}
                    className={`p-6 rounded-lg border-2 transition-all duration-200 text-left ${
                      isSelected
                        ? `border-${card.color}-500 bg-${card.color}-50 shadow-md`
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    disabled={isLoading}
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`${card.title} 역할 선택`}
                    tabIndex={0}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        isSelected ? `bg-${card.color}-500` : 'bg-gray-100'
                      }`}>
                        <Icon className={`w-6 h-6 ${
                          isSelected ? 'text-white' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{card.title}</h3>
                        <p className="text-gray-600 text-sm mb-3">{card.description}</p>
                        <div className="space-y-1">
                          {card.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs text-gray-500">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex items-center">
                          <Badge variant="secondary" className={`bg-${card.color}-500 text-white`}>
                            선택됨
                          </Badge>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Google Login */}
        <Card className="border-gray-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>Google 계정으로 로그인</CardTitle>
            <CardDescription>
              {selectedRole 
                ? `${selectedRole === 'teacher' ? '선생님' : '학생'}으로 로그인합니다`
                : '사용자 유형을 먼저 선택하세요'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Loading Progress */}
            {isLoading && (
              <div className="space-y-2">
                <Progress value={isAuthenticating ? 75 : 25} className="w-full" />
                <p className="text-sm text-center text-gray-600">
                  {isAuthenticating ? 'Google 인증 진행 중...' : '로그인 준비 중...'}
                </p>
              </div>
            )}

            {/* Google Login Button */}
            <Button
              onClick={() => selectedRole && handleGoogleLogin(selectedRole)}
              disabled={!selectedRole || isLoading}
              className="w-full h-12 text-base font-medium"
              variant="default"
              aria-label={`${selectedRole === 'teacher' ? '선생님' : selectedRole === 'student' ? '학생' : ''}로 Google 계정으로 로그인`}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  로그인 중...
                </>
              ) : (
                <>
                  <Chrome className="mr-2 h-5 w-5" />
                  Google로 계속하기
                </>
              )}
            </Button>

            {/* Security Notice */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500" role="status">
              <Shield className="h-3 w-3" />
              <span>보안된 Google OAuth 2.0 인증</span>
            </div>

            <Separator />

            {/* Additional Help */}
            <div className="text-center space-y-2">
              <Button
                variant="link"
                size="sm"
                onClick={showTroubleshootingGuide}
                className="text-gray-600 hover:text-gray-800"
                aria-label="로그인 문제 해결 가이드 보기"
              >
                로그인 문제가 있으신가요?
              </Button>
              
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  <span>한국어 지원</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  <span>개인정보 보호</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 SEL 감정분석 플랫폼. 모든 권리 보유.</p>
        </div>
      </div>
    </div>
  );
}