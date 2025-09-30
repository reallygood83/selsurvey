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
import { Loader2, Users, CheckCircle, ClipboardList, TrendingUp, BookOpen, BarChart3, Eye, LogOut, Menu, X, Settings, FileText, Home, Plus, ChevronRight, Activity, MessageSquare, Download, Calendar, User } from 'lucide-react';
import { StudentAnalysisCard } from '@/components/teacher/StudentAnalysisCard';
import { ClassMoodOverview } from '@/components/teacher/ClassMoodOverview';
import { StudentEmotionChart } from '@/components/teacher/StudentEmotionChart';
import { StudentInviteLink } from '@/components/teacher/StudentInviteLink';

export default function TeacherDashboardPage() {
  const { user, userProfile, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [recentResponses, setRecentResponses] = useState<SurveyResponse[]>([]);
  const [existingSurveys, setExistingSurveys] = useState<Survey[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<'student' | 'class'>('class');
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<string>('');
  const [reportDateRange, setReportDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30일 전
    endDate: new Date().toISOString().split('T')[0] // 오늘
  });
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    todayResponses: 0,
    weeklyParticipation: 0
  });

  useEffect(() => {
    // AuthContext 로딩 중이면 기다림 (새로고침 시 로그아웃 방지)
    if (authLoading) {
      console.log('🔄 [TeacherDashboard] AuthContext 로딩 중...');
      return;
    }

    if (user && userProfile?.role === 'teacher' && userProfile.schoolInfo?.classCode) {
      console.log('✅ [TeacherDashboard] 교사 인증 확인됨:', {
        uid: user.uid,
        role: userProfile.role,
        classCode: userProfile.schoolInfo.classCode
      });
      loadDashboardData();
    }
  }, [user, userProfile, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // 학생 이름 찾기 함수 (ClassMoodOverview와 동일한 로직)
  const getStudentName = (studentId: string) => {
    console.log('🔍 [getStudentName] 학생 이름 검색:', {
      찾는_studentId: studentId,
      전체_학생수: students.length,
      학생_ID_목록: students.map(s => ({ id: s.id, name: s.name, userId: s.userId }))
    });
    
    // id로 먼저 검색
    let student = students.find(s => s.id === studentId);
    
    // id로 못찾으면 userId로 검색 (Firebase Auth UID)
    if (!student) {
      student = students.find(s => s.userId === studentId);
      console.log('🔄 [getStudentName] userId로 재검색 결과:', student ? `찾음: ${student.name}` : '못찾음');
    }
    
    const result = student?.name || '알 수 없음';
    console.log('✅ [getStudentName] 최종 결과:', result, student ? `(${student.id})` : '(매칭 실패)');
    return result;
  };

  // 질문 내용을 가져오는 함수
  const getQuestionContent = (questionId: string, surveyId?: string): string => {
    console.log('🔍 [getQuestionContent] 질문 검색:', { questionId, surveyId });
    
    // 모든 설문에서 해당 questionId를 가진 질문을 찾기
    for (const survey of existingSurveys) {
      const question = survey.questions?.find(q => q.id === questionId);
      if (question) {
        console.log('✅ [getQuestionContent] 질문 찾음:', question.question);
        return question.question;
      }
    }
    
    // 질문을 찾지 못한 경우 기본 질문들 확인
    const defaultQuestions: { [key: string]: string } = {
      'sa1': '오늘 나의 기분은 어떤가요?',
      'sa2': '지금 내 감정 상태를 가장 잘 표현한다면?',
      'sm1': '어려운 일이 있을 때 나는 어떻게 대처하나요?',
      'sm2': '화가 날 때 나는 보통 어떻게 하나요?',
      'soc1': '친구들의 기분을 잘 알아차리는 편인가요?',
      'soc2': '다른 사람이 도움이 필요할 때 알아차리나요?',
      'rel1': '친구들과 잘 어울리나요?',
      'rel2': '의견이 다를 때 어떻게 해결하나요?',
      'rdm1': '선택을 할 때 무엇을 가장 중요하게 생각하나요?',
      'rdm2': '문제가 생겼을 때 어떻게 해결하나요?'
    };
    
    const defaultQuestion = defaultQuestions[questionId];
    if (defaultQuestion) {
      console.log('✅ [getQuestionContent] 기본 질문 사용:', defaultQuestion);
      return defaultQuestion;
    }
    
    console.log('❌ [getQuestionContent] 질문을 찾을 수 없음');
    return `질문 (${questionId})`;
  };

  // AI 리포트 생성 함수
  const generateReport = async () => {
    console.log('🚀 [generateReport] 리포트 생성 시작:', {
      classInfo: classInfo ? `${classInfo.schoolName} ${classInfo.grade}학년 ${classInfo.className}` : '없음',
      user: user ? user.uid : '없음',
      reportType,
      selectedStudentForReport,
      studentsCount: students.length,
      recentResponsesCount: recentResponses.length,
      dateRange: reportDateRange
    });

    if (!classInfo || !user) {
      alert('학급 정보가 없습니다.');
      return;
    }

    if (reportType === 'student' && !selectedStudentForReport) {
      alert('분석할 학생을 선택해주세요.');
      return;
    }

    setGeneratingReport(true);
    setGeneratedReport(null);

    try {
      const endpoint = reportType === 'student' ? '/api/reports/student' : '/api/reports/class';
      const requestBody = reportType === 'student' 
        ? {
            studentId: selectedStudentForReport,
            classCode: classInfo.classCode,
            startDate: reportDateRange.startDate,
            endDate: reportDateRange.endDate,
            reportType: 'individual'
          }
        : {
            classCode: classInfo.classCode,
            startDate: reportDateRange.startDate,
            endDate: reportDateRange.endDate,
            includeIndividualInsights: true
          };

      console.log('🤖 [AI Report] 리포트 생성 요청:', {
        type: reportType,
        endpoint,
        requestBody
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '리포트 생성 중 오류가 발생했습니다.');
      }

      if (data.error && data.responseCount === 0) {
        alert(`${reportType === 'student' ? '해당 학생의' : '학급 전체'} 설문 응답이 없습니다.\n기간: ${reportDateRange.startDate} ~ ${reportDateRange.endDate}`);
        return;
      }

      setGeneratedReport(data);
      console.log('✅ [AI Report] 리포트 생성 완료:', data);

    } catch (error) {
      console.error('❌ [AI Report] 리포트 생성 오류:', error);
      alert(`리포트 생성 중 오류가 발생했습니다: ${error}`);
    } finally {
      setGeneratingReport(false);
    }
  };

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

  // authLoading이 끝날 때까지 로딩 화면 표시 (너무 빠른 권한 체크 방지)
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">인증 확인 중...</p>
        </div>
      </div>
    );
  }

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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            {authLoading ? '로그인 상태 확인 중...' : '대시보드 데이터 로딩 중...'}
          </p>
        </div>
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
            <h1 className="text-lg font-semibold text-white">MindLog</h1>
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
            <h1 className="text-lg font-semibold text-white">MindLog</h1>
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
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setReportModalOpen(true)}
                    className="flex items-center"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    AI 리포트
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/teacher/surveys/manage">
                      전체 보기
                    </Link>
                  </Button>
                </div>
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
                    <div 
                      key={response.id} 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-transparent hover:border-purple-200"
                      onClick={() => {
                        setSelectedResponse(response);
                        setResponseModalOpen(true);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Activity className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {getStudentName(response.studentId)} 
                            <span className="text-gray-400 ml-2">
                              ({response.surveyType === 'daily' ? '일일 체크' : 
                                response.surveyType === 'weekly' ? '주간 설문' : '월간 설문'})
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {response.submittedAt.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium text-gray-600">
                          응답 {response.responses.length}개
                        </div>
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* 설문 응답 상세보기 모달 */}
      {responseModalOpen && selectedResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {getStudentName(selectedResponse.studentId)}의 설문 응답
                </h2>
                <button
                  onClick={() => setResponseModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">설문 유형:</span>{' '}
                  {selectedResponse.surveyType === 'daily' ? '일일 체크' : 
                   selectedResponse.surveyType === 'weekly' ? '주간 설문' : '월간 설문'}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">제출 시간:</span>{' '}
                  {selectedResponse.submittedAt.toLocaleString()}
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">설문 응답 내용</h3>
                {selectedResponse.responses.map((response, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
                          {response.domain} 영역
                        </span>
                        <span className="text-xs text-gray-400">
                          #{index + 1}
                        </span>
                      </div>
                    </div>
                    <div className="text-gray-900">
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-700">질문:</span>
                        <div className="text-sm text-gray-900 mt-1 font-medium">
                          {getQuestionContent(response.questionId, selectedResponse.surveyId)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          ID: {response.questionId}
                        </div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <span className="text-sm font-medium text-blue-700">응답:</span>
                        <div className="text-blue-900 mt-1 font-medium">
                          {Array.isArray(response.answer) 
                            ? response.answer.join(', ')
                            : response.answer}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setResponseModalOpen(false)}
                  variant="outline"
                >
                  닫기
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI 리포트 생성 모달 */}
      {reportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  AI SEL 분석 리포트 생성
                </h2>
                <button
                  onClick={() => {
                    setReportModalOpen(false);
                    setGeneratedReport(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {!generatedReport ? (
                <div className="space-y-6">
                  {/* 리포트 유형 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">리포트 유형</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div 
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                          reportType === 'class' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-200'
                        }`}
                        onClick={() => setReportType('class')}
                      >
                        <div className="flex items-center mb-2">
                          <Users className="w-5 h-5 mr-2 text-purple-600" />
                          <span className="font-medium">학급 전체 분석</span>
                        </div>
                        <p className="text-sm text-gray-600">학급 전체의 SEL 발달 현황과 경향을 분석합니다</p>
                      </div>
                      <div 
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                          reportType === 'student' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-200'
                        }`}
                        onClick={() => setReportType('student')}
                      >
                        <div className="flex items-center mb-2">
                          <User className="w-5 h-5 mr-2 text-blue-600" />
                          <span className="font-medium">개별 학생 분석</span>
                        </div>
                        <p className="text-sm text-gray-600">특정 학생의 SEL 발달 과정을 심층 분석합니다</p>
                      </div>
                    </div>
                  </div>

                  {/* 학생 선택 (개별 분석 시) */}
                  {reportType === 'student' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">분석할 학생 선택</label>
                      <select
                        value={selectedStudentForReport}
                        onChange={(e) => setSelectedStudentForReport(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">학생을 선택하세요</option>
                        {students.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.name} ({student.grade}학년)
                          </option>
                        ))}
                      </select>
                      {/* 디버깅 정보 */}
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                        🔍 디버깅: 로드된 학생 수 {students.length}명 | 최근 응답 수 {recentResponses.length}개
                        {students.length > 0 && (
                          <div className="mt-1">
                            학생 목록: {students.slice(0, 3).map(s => s.name).join(', ')}
                            {students.length > 3 && ` 외 ${students.length - 3}명`}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 기간 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">분석 기간</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">시작일</label>
                        <input
                          type="date"
                          value={reportDateRange.startDate}
                          onChange={(e) => setReportDateRange(prev => ({
                            ...prev,
                            startDate: e.target.value
                          }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">종료일</label>
                        <input
                          type="date"
                          value={reportDateRange.endDate}
                          onChange={(e) => setReportDateRange(prev => ({
                            ...prev,
                            endDate: e.target.value
                          }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 생성 버튼 */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setReportModalOpen(false)}
                      disabled={generatingReport}
                    >
                      취소
                    </Button>
                    <Button
                      onClick={generateReport}
                      disabled={generatingReport}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {generatingReport ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          AI 분석 중...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          리포트 생성
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                // 생성된 리포트 표시
                <div className="space-y-6">
                  {/* 리포트 헤더 */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {reportType === 'student' 
                            ? `${generatedReport.student?.name} SEL 분석 리포트`
                            : `${classInfo?.className || '우리 학급'} SEL 종합 분석`
                          }
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          분석 기간: {reportDateRange.startDate} ~ {reportDateRange.endDate}
                          {reportType === 'student' && (
                            <span className="ml-4">응답 수: {generatedReport.responseCount}개</span>
                          )}
                          {reportType === 'class' && (
                            <span className="ml-4">
                              참여율: {generatedReport.responseMetrics?.responseRate}% 
                              ({generatedReport.responseMetrics?.totalResponses}개 응답)
                            </span>
                          )}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-white">
                        AI 분석 완료
                      </Badge>
                    </div>
                  </div>

                  {/* 학생 개별 리포트 */}
                  {reportType === 'student' && generatedReport.analysis && (
                    <div className="space-y-4">
                      {/* SEL 5영역 점수 */}
                      <div className="grid grid-cols-5 gap-4">
                        {Object.entries(generatedReport.analysis).slice(0, 5).map(([domain, data]: [string, any]) => (
                          <div key={domain} className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600 mb-1">
                              {data.score || 0}
                            </div>
                            <div className="text-xs text-gray-600">
                              {domain === 'selfAwareness' ? '자기인식' :
                               domain === 'selfManagement' ? '자기관리' :
                               domain === 'socialAwareness' ? '사회인식' :
                               domain === 'relationshipSkills' ? '관계기술' :
                               domain === 'responsibleDecisionMaking' ? '책임의식' : domain}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 종합 인사이트 */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">주요 인사이트</h4>
                        <ul className="space-y-1 text-sm text-blue-800">
                          {generatedReport.analysis.overallInsights?.map((insight: string, index: number) => (
                            <li key={index}>• {insight}</li>
                          ))}
                        </ul>
                      </div>

                      {/* 권장사항 */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-900 mb-2">지도 권장사항</h4>
                        <ul className="space-y-1 text-sm text-green-800">
                          {generatedReport.analysis.recommendations?.map((rec: string, index: number) => (
                            <li key={index}>• {rec}</li>
                          ))}
                        </ul>
                      </div>

                      {/* 주의사항 */}
                      {generatedReport.analysis.concerns?.length > 0 && (
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-yellow-900 mb-2">관심 영역</h4>
                          <ul className="space-y-1 text-sm text-yellow-800">
                            {generatedReport.analysis.concerns.map((concern: string, index: number) => (
                              <li key={index}>• {concern}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 학급 전체 리포트 */}
                  {reportType === 'class' && generatedReport.analysis && (
                    <div className="space-y-6">
                      {/* 학급 개요 */}
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {generatedReport.analysis.classOverview?.totalStudents}명
                          </div>
                          <div className="text-sm text-gray-600">전체 학생</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {generatedReport.analysis.classOverview?.activeParticipants}명
                          </div>
                          <div className="text-sm text-gray-600">참여 학생</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {generatedReport.analysis.classOverview?.responseRate}%
                          </div>
                          <div className="text-sm text-gray-600">참여율</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {generatedReport.analysis.classOverview?.avgResponsesPerStudent}개
                          </div>
                          <div className="text-sm text-gray-600">평균 응답</div>
                        </div>
                      </div>

                      {/* SEL 영역별 학급 평균 */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">SEL 영역별 학급 평균</h4>
                        <div className="space-y-3">
                          {generatedReport.analysis.domainAnalysis && Object.entries(generatedReport.analysis.domainAnalysis).map(([domain, data]: [string, any]) => (
                            <div key={domain} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="font-medium">
                                {domain === 'selfAwareness' ? '자기인식' :
                                 domain === 'selfManagement' ? '자기관리' :
                                 domain === 'socialAwareness' ? '사회인식' :
                                 domain === 'relationshipSkills' ? '관계기술' :
                                 domain === 'responsibleDecisionMaking' ? '책임의식' : domain}
                              </span>
                              <div className="flex items-center space-x-2">
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-purple-600 h-2 rounded-full"
                                    style={{ width: `${(data.classAverage || 0)}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium w-8">{data.classAverage || 0}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 학급 강점 */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-900 mb-2">학급 강점</h4>
                        <ul className="space-y-1 text-sm text-green-800">
                          {generatedReport.analysis.classInsights?.strengths?.map((strength: string, index: number) => (
                            <li key={index}>• {strength}</li>
                          ))}
                        </ul>
                      </div>

                      {/* 개선 영역 */}
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-yellow-900 mb-2">개선 영역</h4>
                        <ul className="space-y-1 text-sm text-yellow-800">
                          {generatedReport.analysis.classInsights?.challenges?.map((challenge: string, index: number) => (
                            <li key={index}>• {challenge}</li>
                          ))}
                        </ul>
                      </div>

                      {/* 교실 전략 권장사항 */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">교실 운영 전략</h4>
                        <ul className="space-y-1 text-sm text-blue-800">
                          {generatedReport.analysis.recommendations?.classroomStrategies?.map((strategy: string, index: number) => (
                            <li key={index}>• {strategy}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setGeneratedReport(null);
                        setReportModalOpen(false);
                      }}
                    >
                      닫기
                    </Button>
                    <Button
                      onClick={() => {
                        // TODO: PDF 다운로드 기능 구현
                        alert('PDF 다운로드 기능은 곧 추가될 예정입니다.');
                      }}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      PDF 다운로드
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}