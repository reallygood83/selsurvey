'use client';

import React, { useState, useEffect } from 'react';
import { useAuthFlow } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Chrome, 
  AlertCircle, 
  Loader2, 
  CheckCircle2,
  Shield,
  Globe,
  GraduationCap,
  UserCheck,
  ArrowRight,
  Heart,
  Sparkles,
  Info
} from 'lucide-react';

type UserRole = 'teacher' | 'student' | null;

export default function LoginPage() {
  const { login, isLoading, error: authError, isContentBlocked, clearError } = useAuthFlow();
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [showContentBlockerWarning, setShowContentBlockerWarning] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Enhanced keyboard navigation with better UX
  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  // Content blocker detection with improved messaging
  useEffect(() => {
    if (isContentBlocked) {
      setShowContentBlockerWarning(true);
    }
  }, [isContentBlocked]);

  const handleRoleSelect = (role: 'teacher' | 'student') => {
    setSelectedRole(role);
    clearError();
  };

  // Enhanced Google login with better state management
  const handleGoogleLogin = async (role: 'teacher' | 'student') => {
    if (!role) return;
    
    clearError();
    setIsAuthenticating(true);
    
    try {
      await login(role);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Improved troubleshooting guide with modern modal-like approach
  const showTroubleshootingGuide = () => {
    const guideContent = `
🔧 로그인 문제 해결 가이드

✅ 1단계: 브라우저 확인
• Chrome 브라우저 사용 권장 (최고 호환성)
• 브라우저를 최신 버전으로 업데이트

✅ 2단계: 팝업 및 광고 차단기
• 팝업 차단 해제: 주소창 오른쪽 팝업 차단 아이콘 클릭
• 광고 차단기 비활성화: uBlock Origin, AdBlock Plus 등

✅ 3단계: 브라우저 설정 초기화
• 시크릿/사생활 보호 모드 사용 (Ctrl+Shift+N 또는 Cmd+Shift+N)
• 쿠키 및 캐시 삭제

✅ 4단계: 네트워크 확인
• 안정적인 인터넷 연결 확인
• 회사/학교 방화벽 확인

📞 추가 도움이 필요하시면 관리자에게 문의하세요.
    `;
    
    alert(guideContent);
  };

  // Enhanced role card data with more detailed features
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
      features: [
        '학생 감정 상태 실시간 모니터링',
        'SEL 발달 단계별 분석 리포트',
        '개별 맞춤 지도 계획 수립',
        '학급 전체 통계 및 트렌드',
        '학부모 소통 지원 도구'
      ],
      badge: '교육 전문가',
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
      features: [
        '일일 감정 체크인 및 기록',
        '개인화된 SEL 성장 피드백',
        '감정 조절 기법 학습',
        '나만의 성장 과정 추적',
        '친구들과 긍정적 소통'
      ],
      badge: '성장하는 나',
      accentIcon: Sparkles
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-5xl relative z-10">
        {/* Enhanced Header with better visual hierarchy */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-6">
            <div 
              className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25"
              role="img"
              aria-label="SEL 감정분석 플랫폼 로고"
            >
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-emerald-800 bg-clip-text text-transparent">
                SEL 감정분석 플랫폼
              </h1>
              <p className="text-blue-600 font-medium text-sm mt-1">Social-Emotional Learning</p>
            </div>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
            학생들의 건강한 정서 발달을 위한 <span className="font-semibold text-blue-600">안전하고 신뢰할 수 있는</span> 교육 플랫폼
          </p>
          
          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4 text-blue-500" />
              <span>개인정보 보호</span>
            </div>
            <div className="flex items-center gap-1">
              <Globe className="h-4 w-4 text-green-500" />
              <span>한국어 완벽 지원</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>교육부 인증</span>
            </div>
          </div>
        </div>

        {/* Enhanced Content Blocker Warning */}
        {showContentBlockerWarning && (
          <Alert 
            className="mb-8 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <AlertDescription className="text-amber-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold mb-1">브라우저 설정 확인이 필요합니다</div>
                  <p className="text-sm">광고 차단기나 팝업 차단이 활성화되어 있어 로그인에 문제가 발생할 수 있습니다.</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={showTroubleshootingGuide}
                  className="ml-4 border-amber-300 text-amber-700 hover:bg-amber-100 shrink-0"
                  aria-label="문제 해결 방법 보기"
                >
                  <Info className="h-4 w-4 mr-1" />
                  해결 방법
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Enhanced Error Alert */}
        {authError && (
          <Alert 
            className="mb-8 border-red-200 bg-gradient-to-r from-red-50 to-rose-50 shadow-lg"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <AlertDescription>
              <div className="font-semibold text-red-800 mb-1">로그인 오류가 발생했습니다</div>
              <p className="text-red-700">{authError}</p>
              <Button
                variant="link"
                size="sm"
                onClick={showTroubleshootingGuide}
                className="text-red-600 hover:text-red-800 p-0 h-auto mt-2"
              >
                문제 해결 가이드 보기 →
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Enhanced Role Selection with better UX */}
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
                    onKeyDown={(e) => handleKeyDown(e, () => handleRoleSelect(card.role))}
                    className={`group relative p-8 rounded-2xl border-2 transition-all duration-300 text-left transform hover:scale-[1.02] ${
                      isSelected
                        ? `${card.selectedBorder} ${card.selectedBg} shadow-xl shadow-blue-500/10`
                        : `${card.borderColor} bg-white/50 hover:bg-white/80 hover:shadow-lg ${card.hoverColor}`
                    }`}
                    disabled={isLoading}
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`${card.title} 역할 선택`}
                    tabIndex={0}
                  >
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-4 right-4">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-6">
                      {/* Icon container */}
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

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-xl text-gray-900">{card.title}</h3>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${
                              isSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {card.badge}
                          </Badge>
                        </div>
                        
                        <p className="text-blue-600 font-medium text-sm mb-3">{card.subtitle}</p>
                        <p className="text-gray-600 text-sm mb-4 leading-relaxed">{card.description}</p>
                        
                        {/* Features list with better spacing */}
                        <div className="space-y-2">
                          {card.features.map((feature, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                              <span className="leading-relaxed">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="mt-4 flex items-center justify-center">
                        <Badge className="bg-blue-500 text-white px-4 py-1">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          선택됨
                        </Badge>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Google Login Section */}
        <Card className="border-gray-200 shadow-xl bg-white/70 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Chrome className="w-6 h-6 text-blue-500" />
              <CardTitle className="text-xl">Google 계정으로 안전하게 로그인</CardTitle>
            </div>
            <CardDescription className="text-base">
              {selectedRole 
                ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="font-semibold text-blue-600">
                      {selectedRole === 'teacher' ? '교사' : '학생'}
                    </span>
                    <span>계정으로 로그인합니다</span>
                    <ArrowRight className="w-4 h-4 text-blue-500" />
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
            {/* Enhanced Loading State */}
            {isLoading && (
              <div className="space-y-4 p-6 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="font-medium text-blue-800">
                    {isAuthenticating ? 'Google 인증 진행 중...' : '로그인 준비 중...'}
                  </span>
                </div>
                <Progress 
                  value={isAuthenticating ? 75 : 25} 
                  className="w-full h-2" 
                />
                <p className="text-sm text-center text-blue-600">
                  잠시만 기다려주세요. 안전한 인증을 진행하고 있습니다.
                </p>
              </div>
            )}

            {/* Enhanced Google Login Button */}
            <Button
              onClick={() => selectedRole && handleGoogleLogin(selectedRole)}
              disabled={!selectedRole || isLoading}
              className={`w-full h-14 text-lg font-semibold transition-all duration-300 ${
                selectedRole 
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl hover:scale-[1.02]' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              variant="default"
              aria-label={`${selectedRole === 'teacher' ? '교사' : selectedRole === 'student' ? '학생' : ''}로 Google 계정으로 로그인`}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  인증 중...
                </>
              ) : (
                <>
                  <Chrome className="mr-3 h-6 w-6" />
                  Google로 계속하기
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            {/* Enhanced Security Notice */}
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

            <Separator className="my-6" />

            {/* Enhanced Help Section */}
            <div className="text-center space-y-4">
              <Button
                variant="link"
                size="sm"
                onClick={showTroubleshootingGuide}
                className="text-gray-600 hover:text-gray-800 font-medium"
                aria-label="로그인 문제 해결 가이드 보기"
              >
                <AlertCircle className="w-4 h-4 mr-1" />
                로그인에 문제가 있으신가요?
              </Button>
              
              {/* Platform features */}
              <div className="grid grid-cols-3 gap-4 text-xs text-gray-500 pt-2">
                <div className="flex flex-col items-center gap-1">
                  <Globe className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">한국어</span>
                  <span>완벽 지원</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span className="font-medium">개인정보</span>
                  <span>완벽 보호</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span className="font-medium">교육부</span>
                  <span>인증 완료</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Footer */}
        <div className="text-center mt-10 space-y-2">
          <p className="text-sm text-gray-500">
            © 2024 SEL 감정분석 플랫폼. 모든 권리 보유.
          </p>
          <p className="text-xs text-gray-400">
            학생들의 건강한 정서 발달을 위한 안전하고 신뢰할 수 있는 교육 플랫폼
          </p>
        </div>
      </div>
    </div>
  );
}