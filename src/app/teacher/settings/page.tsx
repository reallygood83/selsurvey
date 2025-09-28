'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GeminiApiKeySettings } from '@/components/settings/GeminiApiKeySettings';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Palette, Globe, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function TeacherSettingsPage() {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();
  const { theme, setTheme, language, setLanguage } = useSettings();

  // Redirect if not authenticated or not a teacher
  useEffect(() => {
    if (!loading && (!user || userProfile?.role !== 'teacher')) {
      router.push('/auth/login');
    }
  }, [user, userProfile, loading, router]);

  // Show loading state while checking authentication
  if (loading || !user || userProfile?.role !== 'teacher') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }
  // Settings are already imported above

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/teacher/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                대시보드로
              </Button>
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">설정</h1>
          <p className="text-gray-600 mt-2">
            SEL 감정분석 플랫폼의 개인 설정을 관리하세요
          </p>
        </div>

        <div className="grid gap-8 max-w-4xl">
          {/* 사용자 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                사용자 정보
              </CardTitle>
              <CardDescription>
                현재 로그인된 계정 정보입니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">이름</Label>
                  <p className="text-gray-900">{userProfile?.displayName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">이메일</Label>
                  <p className="text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">역할</Label>
                  <p className="text-gray-900">
                    {userProfile?.role === 'teacher' ? '교사' : '학생'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">가입일</Label>
                  <p className="text-gray-900">
                    {userProfile?.createdAt ? 
                      new Date(userProfile.createdAt).toLocaleDateString('ko-KR') 
                      : '-'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gemini API 키 설정 */}
          <GeminiApiKeySettings />

          {/* 테마 및 언어 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                화면 설정
              </CardTitle>
              <CardDescription>
                테마와 언어를 설정하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 테마 설정 */}
              <div className="space-y-2">
                <Label htmlFor="theme">테마</Label>
                <Select value={theme} onValueChange={(value: 'light' | 'dark') => setTheme(value)}>
                  <SelectTrigger id="theme" className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">라이트 모드</SelectItem>
                    <SelectItem value="dark">다크 모드</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 언어 설정 */}
              <div className="space-y-2">
                <Label htmlFor="language" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  언어
                </Label>
                <Select value={language} onValueChange={(value: 'ko' | 'en') => setLanguage(value)}>
                  <SelectTrigger id="language" className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ko">한국어</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 플랫폼 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>플랫폼 정보</CardTitle>
              <CardDescription>
                SEL 감정분석 플랫폼에 대한 정보입니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="font-medium">버전</Label>
                  <p className="text-gray-600">v1.0.0</p>
                </div>
                <div>
                  <Label className="font-medium">개발자</Label>
                  <p className="text-gray-600">안양 박달초등학교</p>
                </div>
                <div>
                  <Label className="font-medium">기술 스택</Label>
                  <p className="text-gray-600">Next.js 14, Firebase, Gemini AI</p>
                </div>
                <div>
                  <Label className="font-medium">라이선스</Label>
                  <p className="text-gray-600">MIT License</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">
                  이 플랫폼은 학생들의 사회정서학습(SEL) 발달을 지원하기 위해 개발되었습니다.
                  개인정보는 안전하게 보호되며, 교육 목적으로만 사용됩니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default TeacherSettingsPage;