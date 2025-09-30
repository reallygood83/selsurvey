// 학생 대시보드 - SEL 기반 개인 진행상황 및 설문 참여
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { surveyService, studentService } from '@/lib/firestore';
import { StudentProfile, SurveyResponse, SELAnalysis } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, LogOut, Target, FileText, BarChart3, Clock, Heart } from 'lucide-react';
import MoodMeter from '@/components/student/MoodMeter';

export default function StudentDashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [recentResponses, setRecentResponses] = useState<SurveyResponse[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<SELAnalysis | null>(null);
  const [availableSurveys, setAvailableSurveys] = useState<Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    estimatedTime: number;
    icon: string;
  }>>([]);

  useEffect(() => {
    // AuthContext 로딩 중이면 기다림 (새로고침 시 로그아웃 방지)
    if (authLoading) {
      console.log('🔄 [StudentDashboard] AuthContext 로딩 중...');
      return;
    }

    if (!user || userProfile?.role !== 'student') {
      console.log('❌ [StudentDashboard] 인증 실패 - 로그인 페이지로 리다이렉트:', { 
        user: !!user, 
        userRole: userProfile?.role 
      });
      router.push('/auth/login?role=student');
      return;
    }

    console.log('✅ [StudentDashboard] 학생 인증 확인됨:', { 
      uid: user.uid, 
      role: userProfile.role 
    });
    loadStudentData();
  }, [user, userProfile, router, authLoading]);

  const loadStudentData = async () => {
    if (!user || !userProfile) return;

    try {
      // 학생 프로필 정보 로드
      const profile = await studentService.getStudentProfile(user.uid);
      setStudentProfile(profile);

      if (profile) {
        // 최근 응답 내역 로드
        const responses = await surveyService.getStudentResponses(profile.id, 5);
        setRecentResponses(responses);

        // 최신 분석 결과 로드
        if (profile.analysisHistory && profile.analysisHistory.length > 0) {
          const latest = profile.analysisHistory[profile.analysisHistory.length - 1];
          setLatestAnalysis(latest);
        }

        // 사용 가능한 설문 조회 (오늘 아직 참여하지 않은 것들)
        const surveys = await getAvailableSurveys(profile);
        setAvailableSurveys(surveys);
      }
    } catch (error) {
      console.error('학생 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableSurveys = async (profile: StudentProfile) => {
    const today = new Date();
    const todayString = format(today, 'yyyy-MM-dd');
    
    // 오늘 이미 응답한 설문 확인
    const todayResponses = recentResponses.filter(response => 
      format(response.submittedAt, 'yyyy-MM-dd') === todayString
    );

    const surveys = [];

    // 교사가 공유한 설문 조회
    try {
      const sharedSurveys = await surveyService.getSharedSurveys(profile.classCode);
      
      // 아직 응답하지 않은 공유 설문만 추가
      for (const sharedSurvey of sharedSurveys) {
        const hasResponded = recentResponses.some(r => r.surveyId === sharedSurvey.id);
        if (!hasResponded) {
          surveys.push({
            id: sharedSurvey.id,
            title: sharedSurvey.title,
            description: sharedSurvey.description || '선생님이 공유한 설문입니다',
            type: 'shared',
            estimatedTime: 5,
            icon: '📋'
          });
        }
      }
    } catch (error) {
      console.error('공유 설문 조회 오류:', error);
    }

    // 일일 감정 체크 (매일 가능)
    const hasDaily = todayResponses.some(r => r.surveyType === 'daily');
    if (!hasDaily) {
      surveys.push({
        id: 'daily',
        title: '오늘의 기분은 어때요?',
        description: '간단한 감정 체크로 하루를 시작해요',
        type: 'daily',
        estimatedTime: 2,
        icon: '😊'
      });
    }

    // 주간 설문 (주 1회)
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const hasWeekly = recentResponses.some(r => 
      r.surveyType === 'weekly' && r.submittedAt >= weekAgo
    );
    if (!hasWeekly) {
      surveys.push({
        id: 'weekly',
        title: '이번 주 나의 감정 돌아보기',
        description: '일주일 동안의 감정과 경험을 정리해요',
        type: 'weekly',
        estimatedTime: 5,
        icon: '📝'
      });
    }

    // 월간 종합 설문 (월 1회)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const hasMonthly = recentResponses.some(r => 
      r.surveyType === 'monthly' && r.submittedAt >= monthAgo
    );
    if (!hasMonthly) {
      surveys.push({
        id: 'monthly',
        title: '한 달간의 성장 이야기',
        description: '나의 변화와 성장을 되돌아보는 시간',
        type: 'monthly',
        estimatedTime: 10,
        icon: '🌱'
      });
    }

    return surveys;
  };

  const getSELScoreColor = (score: number) => {
    if (score >= 4.0) return 'default';
    if (score >= 3.0) return 'secondary';
    if (score >= 2.0) return 'outline';
    return 'destructive';
  };

  const getSELScoreDescription = (score: number) => {
    if (score >= 4.0) return '매우 좋아요!';
    if (score >= 3.0) return '잘하고 있어요';
    if (score >= 2.0) return '조금 더 노력해봐요';
    return '함께 개선해봐요';
  };

  const handleSurveyStart = (surveyType: string, surveyId?: string) => {
    if (surveyType === 'shared' && surveyId) {
      // 공유 설문의 경우 설문 ID를 포함하여 라우팅
      router.push(`/student/survey/shared?id=${surveyId}`);
    } else {
      // 기본 설문 타입 (daily, weekly, monthly)
      router.push(`/student/survey/${surveyType}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            {authLoading ? '로그인 상태 확인 중...' : '데이터 로딩 중...'}
          </p>
        </div>
      </div>
    );
  }

  if (!studentProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">학생 정보를 찾을 수 없습니다</h2>
              <p className="text-muted-foreground mb-4">반 참여가 필요합니다.</p>
              <Button onClick={() => router.push('/student/join')}>
                반 참여하기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold">
                👋 안녕, {studentProfile.name}!
              </h1>
              <p className="text-sm text-muted-foreground">
                {studentProfile.grade}학년 {studentProfile.classCode}반
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/auth/login')}
            >
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 환영 섹션 */}
          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">오늘도 멋진 하루 보내고 있나요?</h2>
                  <p className="mt-2 text-purple-100">
                    감정을 나누고 성장하는 특별한 시간을 만들어봐요 ✨
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="text-6xl">🌟</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 무드미터 섹션 - 가장 우선적으로 배치 */}
          <div className="mb-6">
            <MoodMeter />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 왼쪽 컬럼 */}
            <div className="space-y-6">
              {/* 나의 SEL 점수 */}
              {latestAnalysis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      나의 마음 성장 점수
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(latestAnalysis.scores).map(([domain, score]) => {
                      const domainNames = {
                        selfAwareness: '나 자신 알기',
                        selfManagement: '감정 다스리기',
                        socialAwareness: '친구 이해하기',
                        relationshipSkills: '관계 맺기',
                        responsibleDecisionMaking: '올바른 선택하기'
                      };
                      
                      return (
                        <div key={domain} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {domainNames[domain as keyof typeof domainNames]}
                            </span>
                            <Badge variant={getSELScoreColor(score)}>
                              {score.toFixed(1)} {getSELScoreDescription(score)}
                            </Badge>
                          </div>
                          <Progress value={(score / 5) * 100} className="h-2" />
                        </div>
                      );
                    })}
                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="pt-4">
                        <p className="text-sm text-purple-700">
                          💡 <strong>선생님의 응원:</strong> {latestAnalysis.recommendations}
                        </p>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              )}

              {/* 오늘 할 수 있는 설문 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    오늘 참여할 수 있는 활동
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {availableSurveys.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="text-4xl mb-2">🎉</div>
                      <p className="text-muted-foreground">오늘 모든 활동을 완료했어요!</p>
                      <p className="text-sm text-muted-foreground mt-1">내일 다시 새로운 활동이 기다리고 있어요</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {availableSurveys.map((survey) => (
                        <Card key={survey.id} className="hover:bg-muted/50 transition-colors">
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="text-2xl mr-3">{survey.icon}</span>
                                <div>
                                  <h4 className="font-medium">{survey.title}</h4>
                                  <p className="text-sm text-muted-foreground">{survey.description}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                    <Clock className="w-3 h-3" />
                                    <p className="text-xs text-muted-foreground">
                                      예상 시간: {survey.estimatedTime}분
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <Button
                                onClick={() => handleSurveyStart(survey.type, survey.id)}
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                시작하기
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 오른쪽 컬럼 */}
            <div className="space-y-6">
              {/* 나의 참여 현황 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    나의 참여 현황
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {studentProfile.totalResponses}
                        </div>
                        <div className="text-sm text-blue-600">총 참여 횟수</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {studentProfile.participationRate}%
                        </div>
                        <div className="text-sm text-green-600">참여율</div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* 최근 활동 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    최근 활동
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentResponses.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="text-4xl mb-2">📝</div>
                      <p className="text-muted-foreground">아직 참여한 활동이 없어요</p>
                      <p className="text-sm text-muted-foreground mt-1">첫 번째 설문에 참여해보세요!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentResponses.slice(0, 5).map((response) => (
                        <Card key={response.id} className="bg-muted/30">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-sm">
                                  {response.surveyType === 'daily' && '일일 감정 체크'}
                                  {response.surveyType === 'weekly' && '주간 돌아보기'}
                                  {response.surveyType === 'monthly' && '월간 종합 설문'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {format(response.submittedAt, 'M월 d일 HH:mm', { locale: ko })}
                                </div>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                완료 ✅
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 응원 메시지 */}
              <Card className="bg-gradient-to-r from-green-400 to-blue-500 text-white border-none">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-5 h-5" />
                    <h3 className="text-lg font-bold">오늘의 응원</h3>
                  </div>
                  <p className="text-sm">
                    감정을 나누는 것은 용기 있는 일이에요. 
                    여러분의 솔직한 마음이 더 나은 내일을 만들어요!
                  </p>
                  <div className="mt-3 text-xs opacity-80">
                    &ldquo;작은 변화도 소중한 성장이에요&rdquo; ✨
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}