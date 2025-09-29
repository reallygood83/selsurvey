// 교사 대시보드 - 학급 관리 및 학생 현황
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { classService, studentService, surveyService } from '@/lib/firestore';
import { ClassInfo, StudentProfile, SurveyResponse, Survey } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, CheckCircle, ClipboardList, TrendingUp, BookOpen, BarChart3, Eye, LogOut, Menu, X, Settings, FileText, Home, Plus, ChevronRight, Activity } from 'lucide-react';
import { StudentAnalysisCard } from '@/components/teacher/StudentAnalysisCard';
import { ClassMoodOverview } from '@/components/teacher/ClassMoodOverview';
import { StudentEmotionChart } from '@/components/teacher/StudentEmotionChart';
import { StudentInviteLink } from '@/components/teacher/StudentInviteLink';

export default function TeacherDashboardPage() {
  const { user, userProfile, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [recentResponses, setRecentResponses] = useState<SurveyResponse[]>([]);
  const [existingSurveys, setExistingSurveys] = useState<Survey[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    todayResponses: 0,
    weeklyParticipation: 0
  });

  useEffect(() => {
    if (user && userProfile?.role === 'teacher' && userProfile.schoolInfo?.classCode) {
      loadDashboardData();
    }
  }, [user, userProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboardData = async () => {
    if (!user || !userProfile?.schoolInfo?.classCode) return;

    setLoading(true);
    try {
      // 반 정보 로드
      const classData = await classService.getClassByCode(userProfile.schoolInfo.classCode);
      
      if (classData) {
        setClassInfo(classData);

        // 학생 목록 로드
        const studentsData = await studentService.getStudentsByClass(classData.classCode);
        setStudents(studentsData);

        // 최근 설문 응답 로드 - classCode 기반으로 직접 조회
        console.log('📊 [Dashboard] 설문 응답 로드 시작:', {
          classCode: classData.classCode
        });
        
        let allResponses: SurveyResponse[] = [];
        
        try {
          // classCode 기반으로 모든 설문 응답 조회
          allResponses = await surveyService.getResponsesByClass(classData.classCode);
          console.log(`✅ [Dashboard] 반별 설문 응답 조회 완료: ${allResponses.length}개`);
          
          // 추가 로그: 응답 데이터 구조 확인
          if (allResponses.length > 0) {
            console.log('📋 [Dashboard] 설문 응답 샘플:', {
              firstResponse: {
                id: allResponses[0].id,
                surveyType: allResponses[0].surveyType,
                studentId: allResponses[0].studentId,
                classCode: allResponses[0].classCode,
                submittedAt: allResponses[0].submittedAt
              }
            });
          }
          
          // 최근 10개만 선택
          setRecentResponses(allResponses.slice(0, 10));
        } catch (error) {
          console.error('❌ [Dashboard] 설문 응답 로드 오류:', error);
          setRecentResponses([]);
        }
        
        // 설문 목록도 로드 (기존 설문 관리를 위해)
        const surveysData = await surveyService.getSurveysByTeacher(user.uid);
        console.log('🔍 [Dashboard] 교사 설문 목록:', surveysData.length, '개');

        // 설문 목록을 상태에 저장 (이미 위에서 로드함)
        setExistingSurveys(surveysData);

        // 통계 계산
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const todayResponsesCount = allResponses.filter(response => 
          response.submittedAt.toDateString() === today.toDateString()
        ).length;

        const weeklyResponsesCount = allResponses.filter(response => 
          response.submittedAt >= weekAgo
        ).length;

        const activeStudentsCount = studentsData.filter(student => 
          student.lastResponseDate && 
          new Date(student.lastResponseDate).toDateString() === today.toDateString()
        ).length;

        setStats({
          totalStudents: studentsData.length,
          activeStudents: activeStudentsCount,
          todayResponses: todayResponsesCount,
          weeklyParticipation: studentsData.length > 0 
            ? Math.round((weeklyResponsesCount / studentsData.length) * 100) 
            : 0
        });
      }
    } catch (error) {
      console.error('대시보드 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || userProfile?.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">접근 권한이 없습니다</h2>
              <p className="text-muted-foreground">교사만 접근할 수 있는 페이지입니다.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 온보딩이 완료되지 않은 경우
  if (!userProfile.schoolInfo?.classCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">학급 설정이 필요합니다</h2>
              <p className="text-muted-foreground mb-4">
                대시보드를 사용하기 전에 학급 정보를 설정해주세요.
              </p>
              <Button asChild>
                <Link href="/teacher/onboarding">
                  학급 설정하기
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // 네비게이션 항목
  const navigation = [
    { name: '대시보드', href: '/teacher/dashboard', icon: Home, current: true },
    { name: '새 설문 만들기', href: '/teacher/surveys/create', icon: Plus },
    { name: '설문 관리', href: '/teacher/surveys/manage', icon: ClipboardList },
    { name: '학생 관리', href: '/teacher/students/manage', icon: Users },
    { name: '리포트 생성', href: '/teacher/reports', icon: BarChart3 },
    { name: '설정', href: '/teacher/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 사이드바 (모바일) */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex flex-col w-64 bg-white">
          <div className="flex items-center justify-between h-16 px-6 bg-primary">
            <h1 className="text-lg font-semibold text-white">SEL 플랫폼</h1>
            <button
              className="text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.current
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={`mr-3 h-5 w-5 ${item.current ? 'text-white' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t">
            <Button variant="outline" className="w-full" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </div>
        </div>
      </div>

      {/* 사이드바 (데스크톱) */}
      <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r">
          <div className="flex items-center h-16 px-6 bg-primary">
            <h1 className="text-lg font-semibold text-white">SEL 플랫폼</h1>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.current
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${item.current ? 'text-white' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {(userProfile?.displayName || userProfile?.email || 'T').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userProfile?.displayName || userProfile?.email?.split('@')[0] || '교사'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userProfile?.email}
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="lg:pl-64">
        {/* 모바일 헤더 */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between h-16 px-4 bg-white border-b">
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold">교사 대시보드</h1>
            <div className="w-6" /> {/* Spacer */}
          </div>
        </div>

        {/* 페이지 헤더 */}
        <div className="bg-white border-b px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">교사 대시보드</h1>
              {classInfo && (
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <span>{classInfo.schoolName}</span>
                  <ChevronRight className="mx-1 h-4 w-4" />
                  <span>{classInfo.grade}학년 {classInfo.className}</span>
                  <Badge variant="outline" className="ml-2 font-mono">
                    {classInfo.classCode}
                  </Badge>
                </div>
              )}
            </div>
            <div className="hidden sm:flex space-x-3">
              <Button asChild>
                <Link href="/teacher/surveys/create">
                  <Plus className="w-4 h-4 mr-2" />
                  새 설문
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* 대시보드 내용 */}
        <main className="p-4 sm:p-6 lg:p-8">
          {/* 통계 카드 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-blue-600 mb-1">
                      전체 학생 수
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {stats.totalStudents}
                    </p>
                    <p className="text-xs text-blue-600">명</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-green-600 mb-1">
                      오늘 참여 학생
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      {stats.activeStudents}
                    </p>
                    <p className="text-xs text-green-600">명</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-yellow-600 mb-1">
                      오늘 설문 응답
                    </p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {stats.todayResponses}
                    </p>
                    <p className="text-xs text-yellow-600">개</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-purple-600 mb-1">
                      주간 참여율
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {stats.weeklyParticipation}
                    </p>
                    <p className="text-xs text-purple-600">%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오늘의 학급 감정 현황 */}
          {classInfo && (
            <div className="mb-8">
              <ClassMoodOverview classCode={classInfo.classCode} />
            </div>
          )}

          {/* 학생별 감정 변화 분석 */}
          {classInfo && (
            <div className="mb-8">
              <StudentEmotionChart classCode={classInfo.classCode} />
            </div>
          )}

          {/* 반 정보 및 빠른 작업 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* 반 정보 */}
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  반 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {classInfo && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">반 코드</span>
                      <Badge variant="outline" className="font-mono font-bold text-blue-600 border-blue-200">
                        {classInfo.classCode}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">학교</span>
                      <span className="text-sm font-semibold">{classInfo.schoolName}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">학년/반</span>
                      <span className="text-sm font-semibold">
                        {classInfo.grade}학년 {classInfo.className}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-gray-600">생성일</span>
                      <span className="text-sm font-semibold">
                        {classInfo.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
                <div className="mt-6 pt-4 border-t">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/teacher/settings">
                      <Settings className="w-4 h-4 mr-2" />
                      반 설정 수정
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 빠른 작업 */}
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  빠른 작업
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto p-4 hover:bg-blue-50 transition-colors group"
                    asChild
                  >
                    <Link href="/teacher/surveys/create">
                      <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center mr-3">
                        <ClipboardList className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="text-sm font-semibold">일일 감정 체크 설문</div>
                        <div className="text-xs text-gray-500">학생들의 오늘 감정 상태 확인</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto p-4 hover:bg-green-50 transition-colors group" 
                    asChild
                  >
                    <Link href="/teacher/reports">
                      <div className="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center mr-3">
                        <BarChart3 className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="text-sm font-semibold">SEL 분석 리포트</div>
                        <div className="text-xs text-gray-500">AI 기반 학급 종합 분석</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto p-4 hover:bg-purple-50 transition-colors group" 
                    asChild
                  >
                    <Link href="/teacher/students/manage">
                      <div className="w-10 h-10 bg-purple-100 group-hover:bg-purple-200 rounded-lg flex items-center justify-center mr-3">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="text-sm font-semibold">학생 관리</div>
                        <div className="text-xs text-gray-500">학생 추가/삭제 및 설문 관리</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 학생 초대 링크 */}
          {classInfo && userProfile && (
            <div className="mb-8">
              <StudentInviteLink
                classCode={classInfo.classCode}
                schoolName={classInfo.schoolName}
                className={classInfo.className}
                grade={classInfo.grade}
              />
            </div>
          )}

          {/* 학생 SEL 분석 결과 */}
          <div id="student-analysis" className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">학생 SEL 분석 결과</h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/teacher/reports">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  전체 리포트
                </Link>
              </Button>
            </div>
          
            {students.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-200">
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">아직 참여한 학생이 없습니다</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      학생들에게 반 코드를 알려주거나 직접 추가해보세요
                    </p>
                    <div className="flex items-center justify-center space-x-2 mb-4">
                      <span className="text-sm text-gray-500">반 코드:</span>
                      <Badge variant="outline" className="font-mono text-base px-3 py-1">
                        {classInfo?.classCode}
                      </Badge>
                    </div>
                    <Button asChild>
                      <Link href="/teacher/students/manage">
                        <Plus className="w-4 h-4 mr-2" />
                        학생 직접 추가하기
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {students.map((student) => (
                  <StudentAnalysisCard
                    key={student.id}
                    student={student}
                    onViewDetails={(studentId) => {
                      // 학생 상세 분석 페이지로 이동
                      if (typeof window !== 'undefined') {
                        window.location.href = `/teacher/students/${studentId}`;
                      } else {
                        // SSR 환경에서는 Next.js 라우터 사용
                        router.push(`/teacher/students/${studentId}`);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 학생 목록 테이블 (요약) */}
          <Card className="mb-8 border-0 shadow-md">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  학생 목록 요약 ({students.length}명)
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/teacher/students/manage">
                    <Settings className="w-4 h-4 mr-2" />
                    관리
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {students.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">아직 참여한 학생이 없습니다</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    학생들에게 반 코드를 알려주거나 직접 추가해보세요
                  </p>
                  <Badge variant="outline" className="font-mono text-base px-3 py-1 mb-4">
                    {classInfo?.classCode}
                  </Badge>
                  <div>
                    <Button asChild>
                      <Link href="/teacher/students/manage">
                        <Plus className="w-4 h-4 mr-2" />
                        학생 직접 추가하기
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          이름
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          참여일
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          최근 응답
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          참여율
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          상태
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          분석
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-sm font-medium text-blue-600">
                                  {student.name.charAt(0)}
                                </span>
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {student.name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.joinedAt.toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.lastResponseDate 
                              ? student.lastResponseDate.toLocaleDateString()
                              : '응답 없음'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900">
                                {student.participationRate}%
                              </span>
                              <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full" 
                                  style={{ width: `${student.participationRate}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              variant={student.isActive ? "default" : "secondary"}
                              className={student.isActive ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-gray-100 text-gray-800"}
                            >
                              {student.isActive ? '활성' : '비활성'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              onClick={() => {
                                if (typeof window !== 'undefined') {
                                  window.location.href = `/teacher/students/${student.id}`;
                                } else {
                                  // SSR 환경에서는 Next.js 라우터 사용
                                  router.push(`/teacher/students/${student.id}`);
                                }
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              상세보기
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 기존 설문 */}
          <Card className="mb-8 border-0 shadow-md">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <ClipboardList className="w-5 h-5 mr-2" />
                  기존 설문
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/teacher/surveys/manage">
                    <Settings className="w-4 h-4 mr-2" />
                    관리
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {existingSurveys.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                    <ClipboardList className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">아직 생성된 설문이 없습니다</h3>
                  <p className="text-sm text-gray-500 mb-4">새로운 설문을 만들어 학생들의 감정 상태를 파악해보세요</p>
                  <Button asChild>
                    <Link href="/teacher/surveys/create">
                      <Plus className="w-4 h-4 mr-2" />
                      첫 번째 설문 만들기
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {existingSurveys.map((survey) => (
                    <div key={survey.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <ClipboardList className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {survey.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            질문 수: {survey.questions?.length || 0} | 
                            <Badge 
                              variant={survey.isActive ? "default" : "secondary"}
                              className={`ml-1 ${survey.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                            >
                              {survey.isActive ? '활성' : '비활성'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => {
                            if (typeof window !== 'undefined') {
                              const surveyUrl = `${window.location.origin}/shared?id=${survey.id}`;
                              navigator.clipboard.writeText(surveyUrl);
                              alert('설문 링크가 클립보드에 복사되었습니다!');
                            } else {
                              // SSR 환경에서는 기본 URL 사용
                              const surveyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://your-app-url.com'}/shared?id=${survey.id}`;
                              alert(`설문 링크: ${surveyUrl}`);
                            }
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          링크 복사
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 최근 활동 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  최근 설문 응답
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/teacher/surveys/manage">
                    전체 보기
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {recentResponses.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <Activity className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">아직 설문 응답이 없습니다</h3>
                  <p className="text-sm text-gray-500">학생들이 설문에 참여하면 여기에 표시됩니다</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentResponses.map((response) => (
                    <div key={response.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Activity className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {response.surveyType === 'daily' ? '일일 체크' : 
                             response.surveyType === 'weekly' ? '주간 설문' : '월간 설문'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {response.submittedAt.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-600">
                        응답 {response.responses.length}개
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}