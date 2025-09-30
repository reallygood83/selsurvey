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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
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

  // ❌ 절대 수정 금지 - 학생 이름 찾기 함수
  const getStudentName = (studentId: string) => {
    console.log('🔍 [getStudentName] 학생 이름 검색:', {
      찾는_studentId: studentId,
      전체_학생수: students.length,
      학생_ID_목록: students.map(s => ({ id: s.id, name: s.name, userId: s.userId }))
    });

    let student = students.find(s => s.id === studentId);

    if (!student) {
      student = students.find(s => s.userId === studentId);
      console.log('🔄 [getStudentName] userId로 재검색 결과:', student ? `찾음: ${student.name}` : '못찾음');
    }

    const result = student?.name || '알 수 없음';
    console.log('✅ [getStudentName] 최종 결과:', result, student ? `(${student.id})` : '(매칭 실패)');
    return result;
  };

  // ❌ 절대 수정 금지 - 질문 내용 가져오기 함수
  const getQuestionContent = (questionId: string, surveyId?: string): string => {
    console.log('🔍 [getQuestionContent] 질문 검색:', { questionId, surveyId });

    for (const survey of existingSurveys) {
      const question = survey.questions?.find(q => q.id === questionId);
      if (question) {
        console.log('✅ [getQuestionContent] 질문 찾음:', question.question);
        return question.question;
      }
    }

    const defaultQuestions: { [key: string]: string } = {
      'sa1': '오늘 나의 기분은 어떤가요?',
      'sa2': '오늘 나의 에너지는 어땠나요?',
      'sm1': '화가 난 적이 있나요?',
      'sm2': '슬픈 일이 있었나요?',
      'sm3': '걱정되거나 불안한 적이 있나요?',
      'so1': '친구들과 잘 지냈나요?',
      'so2': '선생님께 도움을 청한 적이 있나요?',
      'rd1': '오늘 한 일 중 가장 기억에 남는 것은?',
      'rd2': '내일은 무엇을 하고 싶나요?'
    };

    return defaultQuestions[questionId] || '질문 내용 없음';
  };

  // ❌ 절대 수정 금지 - AI 리포트 생성 함수
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

  // ❌ 절대 수정 금지 - 대시보드 데이터 로딩 함수
  const loadDashboardData = async () => {
    if (!user || !userProfile?.schoolInfo?.classCode) return;

    setLoading(true);
    try {
      const classData = await classService.getClassByCode(userProfile.schoolInfo.classCode);

      if (classData) {
        setClassInfo(classData);

        const studentsData = await studentService.getStudentsByClass(classData.classCode);
        setStudents(studentsData);

        console.log('📊 [Dashboard] 설문 응답 로드 시작:', {
          classCode: classData.classCode
        });

        const responsesData = await surveyService.getResponsesByClass(classData.classCode);
        console.log('📊 [Dashboard] 설문 응답 로드 완료:', {
          총응답수: responsesData.length,
          응답샘플: responsesData.slice(0, 3).map(r => ({
            id: r.id,
            studentId: r.studentId,
            timestamp: r.timestamp
          }))
        });

        setRecentResponses(responsesData.sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ).slice(0, 50));

        const surveysData = await surveyService.getSurveysByTeacher(user.uid);
        setExistingSurveys(surveysData);

        const today = new Date().toISOString().split('T')[0];
        const todayStart = new Date(today).getTime();
        const weekAgo = todayStart - (7 * 24 * 60 * 60 * 1000);

        const todayResponsesCount = responsesData.filter(r =>
          new Date(r.timestamp).getTime() >= todayStart
        ).length;

        const weekResponses = responsesData.filter(r =>
          new Date(r.timestamp).getTime() >= weekAgo
        );
        const uniqueStudentsThisWeek = new Set(weekResponses.map(r => r.studentId)).size;
        const weeklyParticipation = studentsData.length > 0
          ? Math.round((uniqueStudentsThisWeek / studentsData.length) * 100)
          : 0;

        const activeStudentsCount = new Set(
          responsesData
            .filter(r => new Date(r.timestamp).getTime() >= weekAgo)
            .map(r => r.studentId)
        ).size;

        setStats({
          totalStudents: studentsData.length,
          activeStudents: activeStudentsCount,
          todayResponses: todayResponsesCount,
          weeklyParticipation
        });
      }
    } catch (error) {
      console.error('대시보드 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">대시보드 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user || !userProfile || userProfile.role !== 'teacher') {
    router.push('/auth/login');
    return null;
  }

  if (!userProfile.schoolInfo?.classCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>반 정보가 없습니다</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              대시보드를 사용하려면 먼저 반을 생성해주세요.
            </p>
            <Button asChild className="w-full">
              <Link href="/teacher/class/create">
                <Plus className="w-4 h-4 mr-2" />
                반 만들기
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      {/* 사이드바 (데스크톱) */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 min-h-0 bg-white border-r">
          <div className="flex items-center h-16 px-6 bg-primary">
            <h1 className="text-lg font-semibold text-white">MindLog</h1>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
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
                  <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${item.current ? 'text-white' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t">
            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">학급 코드</p>
              <p className="font-mono font-bold text-primary">{classInfo?.classCode}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </div>
        </div>
      </div>

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
            <div className="w-6" />
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

        {/* 대시보드 내용 - 탭 구조로 재구성 */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">개요</span>
              </TabsTrigger>
              <TabsTrigger value="students" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">학생</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">활동</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">리포트</span>
              </TabsTrigger>
              <TabsTrigger value="manage" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">관리</span>
              </TabsTrigger>
            </TabsList>

            {/* 개요 탭 */}
            <TabsContent value="overview" className="space-y-6">
              {/* 통계 카드 */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                          활동 학생
                        </p>
                        <p className="text-2xl font-bold text-green-900">
                          {stats.activeStudents}
                        </p>
                        <p className="text-xs text-green-600">최근 7일</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                          <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm font-medium text-purple-600 mb-1">
                          오늘 응답
                        </p>
                        <p className="text-2xl font-bold text-purple-900">
                          {stats.todayResponses}
                        </p>
                        <p className="text-xs text-purple-600">건</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm font-medium text-orange-600 mb-1">
                          주간 참여율
                        </p>
                        <p className="text-2xl font-bold text-orange-900">
                          {stats.weeklyParticipation}%
                        </p>
                        <p className="text-xs text-orange-600">최근 7일</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 학급 전체 감정 개요 */}
              {recentResponses.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Activity className="w-5 h-5 mr-2 text-primary" />
                      학급 전체 감정 현황
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ClassMoodOverview
                      responses={recentResponses}
                      students={students}
                    />
                  </CardContent>
                </Card>
              )}

              {/* 학생별 감정 차트 */}
              {students.length > 0 && recentResponses.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <BarChart3 className="w-5 h-5 mr-2 text-primary" />
                      학생별 감정 추이
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StudentEmotionChart
                      students={students}
                      responses={recentResponses}
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* 학생 관리 탭 */}
            <TabsContent value="students" className="space-y-6">
              {/* 학생 초대 링크 */}
              {classInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Users className="w-5 h-5 mr-2 text-primary" />
                      학생 초대
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StudentInviteLink classCode={classInfo.classCode} />
                  </CardContent>
                </Card>
              )}

              {/* 학생 목록 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center text-lg">
                      <Users className="w-5 h-5 mr-2 text-primary" />
                      학생 목록 ({students.length}명)
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/teacher/students/manage">
                        관리
                      </Link>
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {students.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">아직 학생이 없습니다</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        학생들에게 초대 링크를 공유해주세요.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {students.map((student) => (
                        <Card key={student.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-white" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {student.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {recentResponses.filter(r => r.studentId === student.id || r.studentId === student.userId).length}개 응답
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 활동 내역 탭 */}
            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Activity className="w-5 h-5 mr-2 text-primary" />
                    최근 설문 응답 ({recentResponses.length}건)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentResponses.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">아직 응답이 없습니다</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        학생들이 설문에 응답하면 여기에 표시됩니다.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentResponses.slice(0, 10).map((response) => (
                        <div
                          key={response.id}
                          className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedResponse(response);
                            setResponseModalOpen(true);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">
                                  {getStudentName(response.studentId)}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {response.surveyType === 'daily' ? '일일설문' :
                                   response.surveyType === 'weekly' ? '주간설문' : '맞춤설문'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                {new Date(response.timestamp).toLocaleString('ko-KR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <Eye className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 리포트 탭 */}
            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <BarChart3 className="w-5 h-5 mr-2 text-primary" />
                    AI 분석 리포트 생성
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        리포트 유형
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setReportType('class')}
                          className={`p-4 border-2 rounded-lg text-center transition-all ${
                            reportType === 'class'
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Users className="w-6 h-6 mx-auto mb-2" />
                          <p className="font-medium">학급 전체</p>
                          <p className="text-xs text-gray-500 mt-1">전체 학생 분석</p>
                        </button>
                        <button
                          onClick={() => setReportType('student')}
                          className={`p-4 border-2 rounded-lg text-center transition-all ${
                            reportType === 'student'
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <User className="w-6 h-6 mx-auto mb-2" />
                          <p className="font-medium">개별 학생</p>
                          <p className="text-xs text-gray-500 mt-1">특정 학생 분석</p>
                        </button>
                      </div>
                    </div>

                    {reportType === 'student' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          분석할 학생 선택
                        </label>
                        <select
                          value={selectedStudentForReport}
                          onChange={(e) => setSelectedStudentForReport(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">학생을 선택하세요</option>
                          {students.map((student) => (
                            <option key={student.id} value={student.id}>
                              {student.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          시작일
                        </label>
                        <input
                          type="date"
                          value={reportDateRange.startDate}
                          onChange={(e) => setReportDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          종료일
                        </label>
                        <input
                          type="date"
                          value={reportDateRange.endDate}
                          onChange={(e) => setReportDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={generateReport}
                      disabled={generatingReport || (reportType === 'student' && !selectedStudentForReport)}
                      className="w-full"
                    >
                      {generatingReport ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          AI 분석 중...
                        </>
                      ) : (
                        <>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          리포트 생성
                        </>
                      )}
                    </Button>

                    {generatedReport && (
                      <div className="mt-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
                        <h3 className="text-lg font-semibold text-blue-900 mb-4">
                          {reportType === 'student' ? '개별 학생 분석 리포트' : '학급 전체 분석 리포트'}
                        </h3>
                        <div className="prose prose-sm max-w-none">
                          <div className="whitespace-pre-wrap text-gray-700">
                            {generatedReport.analysis || generatedReport.report}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => {
                            const reportText = generatedReport.analysis || generatedReport.report;
                            const blob = new Blob([reportText], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `리포트_${reportType}_${new Date().toISOString().split('T')[0]}.txt`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          리포트 다운로드
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 학생별 AI 분석 */}
              {students.length > 0 && recentResponses.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <User className="w-5 h-5 mr-2 text-primary" />
                    학생별 상세 분석
                  </h2>
                  <div className="grid gap-6 md:grid-cols-2">
                    {students.map((student) => {
                      const studentResponses = recentResponses.filter(
                        r => r.studentId === student.id || r.studentId === student.userId
                      );

                      if (studentResponses.length === 0) return null;

                      return (
                        <StudentAnalysisCard
                          key={student.id}
                          student={student}
                          responses={studentResponses}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* 관리 탭 */}
            <TabsContent value="manage" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center text-base">
                      <ClipboardList className="w-5 h-5 mr-2 text-primary" />
                      설문 관리
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      기존 설문을 수정하거나 삭제할 수 있습니다.
                    </p>
                    <Button asChild className="w-full">
                      <Link href="/teacher/surveys/manage">
                        설문 관리 페이지로
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center text-base">
                      <Users className="w-5 h-5 mr-2 text-primary" />
                      학생 관리
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      학생 정보를 수정하거나 관리할 수 있습니다.
                    </p>
                    <Button asChild className="w-full">
                      <Link href="/teacher/students/manage">
                        학생 관리 페이지로
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center text-base">
                      <Settings className="w-5 h-5 mr-2 text-primary" />
                      설정
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      프로필 및 학급 설정을 변경할 수 있습니다.
                    </p>
                    <Button asChild className="w-full" variant="outline">
                      <Link href="/teacher/settings">
                        설정 페이지로
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center text-base">
                      <FileText className="w-5 h-5 mr-2 text-primary" />
                      도움말
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      MindLog 사용 가이드를 확인하세요.
                    </p>
                    <Button asChild className="w-full" variant="outline">
                      <Link href="/help">
                        도움말 보기
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* 응답 상세 모달 */}
      {responseModalOpen && selectedResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">설문 응답 상세</h2>
              <button
                onClick={() => setResponseModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">학생</p>
                <p className="font-medium text-gray-900">
                  {getStudentName(selectedResponse.studentId)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">응답 시간</p>
                <p className="font-medium text-gray-900">
                  {new Date(selectedResponse.timestamp).toLocaleString('ko-KR')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">응답 내용</p>
                <div className="space-y-3">
                  {Object.entries(selectedResponse.answers).map(([questionId, answer]) => (
                    <div key={questionId} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        {getQuestionContent(questionId, selectedResponse.surveyId)}
                      </p>
                      <p className="text-sm text-gray-900">
                        {typeof answer === 'object' && answer !== null
                          ? JSON.stringify(answer)
                          : String(answer)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}