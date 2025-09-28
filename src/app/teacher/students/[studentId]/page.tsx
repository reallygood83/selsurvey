'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { studentService, analysisService } from '@/lib/firestore';
import { StudentProfile, SELAnalysis } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  TrendingUp, 
  BarChart3, 
  MessageSquare,
  Target,
  Brain,
  Heart,
  Users,
  CheckCircle,
  Lightbulb,
  AlertCircle,
  Download,
  Loader2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface StudentDetailPageProps {
  params: { studentId: string };
}

export default function StudentDetailPage({ params }: StudentDetailPageProps) {
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [analyses, setAnalyses] = useState<SELAnalysis[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'1month' | '3months' | '6months' | 'all'>('3months');

  // SEL 영역별 아이콘 매핑
  const selIcons = {
    selfAwareness: Brain,
    selfManagement: CheckCircle,
    socialAwareness: Users,
    relationshipSkills: Heart,
    responsibleDecisionMaking: Lightbulb
  };

  // SEL 영역별 한국어 이름
  const selNames = {
    selfAwareness: '자기인식',
    selfManagement: '자기관리',
    socialAwareness: '사회적 인식',
    relationshipSkills: '관계 기술',
    responsibleDecisionMaking: '책임감 있는 의사결정'
  };

  // 점수에 따른 색상 결정
  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  // 점수에 따른 배경색 결정
  const getScoreBgColor = (score: number) => {
    if (score >= 4) return 'bg-green-50 border-green-200';
    if (score >= 3) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  useEffect(() => {
    if (currentUser && userProfile?.role === 'teacher') {
      loadStudentData();
    }
  }, [currentUser, userProfile, params.studentId]);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      // 학생 프로필 로드
      const studentData = await studentService.getStudentById(params.studentId);
      if (studentData) {
        setStudent(studentData);
        
        // SEL 분석 기록 로드
        const analysisData = await analysisService.getAnalysesByStudent(params.studentId);
        setAnalyses(analysisData);
      }
    } catch (error) {
      console.error('학생 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAnalyses = () => {
    if (selectedPeriod === 'all') return analyses;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (selectedPeriod) {
      case '1month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
    }
    
    return analyses.filter(analysis => analysis.analysisDate >= cutoffDate);
  };

  const getProgressData = () => {
    const filteredAnalyses = getFilteredAnalyses().slice(-6); // 최근 6개
    return filteredAnalyses.map((analysis, index) => ({
      date: analysis.analysisDate.toLocaleDateString(),
      selfAwareness: analysis.scores.selfAwareness,
      selfManagement: analysis.scores.selfManagement,
      socialAwareness: analysis.scores.socialAwareness,
      relationshipSkills: analysis.scores.relationshipSkills,
      responsibleDecisionMaking: analysis.scores.responsibleDecisionMaking,
      average: (
        analysis.scores.selfAwareness + 
        analysis.scores.selfManagement + 
        analysis.scores.socialAwareness + 
        analysis.scores.relationshipSkills + 
        analysis.scores.responsibleDecisionMaking
      ) / 5
    }));
  };

  const getRadarData = () => {
    if (!student?.recentAnalysis) return [];
    
    return [
      {
        domain: '자기인식',
        score: student.recentAnalysis.scores.selfAwareness,
        fullMark: 5
      },
      {
        domain: '자기관리',
        score: student.recentAnalysis.scores.selfManagement,
        fullMark: 5
      },
      {
        domain: '사회적 인식',
        score: student.recentAnalysis.scores.socialAwareness,
        fullMark: 5
      },
      {
        domain: '관계 기술',
        score: student.recentAnalysis.scores.relationshipSkills,
        fullMark: 5
      },
      {
        domain: '의사결정',
        score: student.recentAnalysis.scores.responsibleDecisionMaking,
        fullMark: 5
      }
    ];
  };

  if (!currentUser || userProfile?.role !== 'teacher') {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">학생을 찾을 수 없습니다</h2>
              <p className="text-muted-foreground mb-4">
                요청하신 학생의 정보를 찾을 수 없습니다.
              </p>
              <Button asChild>
                <Link href="/teacher/dashboard">
                  대시보드로 돌아가기
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressData = getProgressData();
  const radarData = getRadarData();

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="bg-background border-b">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <Link href="/teacher/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  대시보드로
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{student.name} 학생 분석</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  SEL 사회정서학습 상세 분석 리포트
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                리포트 다운로드
              </Button>
              <Button>
                <MessageSquare className="h-4 w-4 mr-2" />
                상담 메모 작성
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* 학생 기본 정보 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>학생 기본 정보</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">이름</p>
                  <p className="font-medium">{student.name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">참여일</p>
                  <p className="font-medium">{student.joinedAt.toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">참여율</p>
                  <p className="font-medium">{student.participationRate}%</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">총 응답 수</p>
                  <p className="font-medium">{student.totalResponses}개</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 기간 선택 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">SEL 분석 추이</h2>
          <div className="flex space-x-2">
            {[
              { value: '1month', label: '1개월' },
              { value: '3months', label: '3개월' },
              { value: '6months', label: '6개월' },
              { value: 'all', label: '전체' }
            ].map((period) => (
              <Button
                key={period.value}
                variant={selectedPeriod === period.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(period.value as string)}
              >
                {period.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 차트 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 진행 추이 차트 */}
          <Card>
            <CardHeader>
              <CardTitle>SEL 점수 변화 추이</CardTitle>
            </CardHeader>
            <CardContent>
              {progressData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[1, 5]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="average" 
                        stroke="#8884d8" 
                        strokeWidth={3}
                        name="평균"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="selfAwareness" 
                        stroke="#82ca9d" 
                        strokeWidth={2}
                        name="자기인식"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="selfManagement" 
                        stroke="#ffc658" 
                        strokeWidth={2}
                        name="자기관리"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  분석 데이터가 부족합니다
                </div>
              )}
            </CardContent>
          </Card>

          {/* 레이더 차트 */}
          <Card>
            <CardHeader>
              <CardTitle>현재 SEL 영역별 점수</CardTitle>
            </CardHeader>
            <CardContent>
              {student.recentAnalysis ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="domain" />
                      <PolarRadiusAxis domain={[0, 5]} />
                      <Radar
                        name="점수"
                        dataKey="score"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  최근 분석 결과가 없습니다
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 최근 분석 상세 정보 */}
        {student.recentAnalysis && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* SEL 영역별 점수 */}
            <Card>
              <CardHeader>
                <CardTitle>SEL 영역별 상세 점수</CardTitle>
                <p className="text-sm text-muted-foreground">
                  최근 분석: {student.recentAnalysis.analysisDate.toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(student.recentAnalysis.scores).map(([domain, score]) => {
                  const IconComponent = selIcons[domain as keyof typeof selIcons];
                  return (
                    <div key={domain} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <IconComponent className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {selNames[domain as keyof typeof selNames]}
                          </span>
                        </div>
                        <span className={`text-sm font-bold ${getScoreColor(score)}`}>
                          {score}/5
                        </span>
                      </div>
                      <Progress value={score * 20} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* 강점과 성장영역 */}
            <Card>
              <CardHeader>
                <CardTitle>강점 및 성장 영역</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 강점 */}
                <div>
                  <h4 className="text-sm font-medium text-green-600 mb-3">강점</h4>
                  <div className="space-y-2">
                    {student.recentAnalysis.strengths.map((strength, index) => (
                      <Badge key={index} variant="outline" className="text-green-700 border-green-200">
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* 성장영역 */}
                <div>
                  <h4 className="text-sm font-medium text-orange-600 mb-3">성장 필요 영역</h4>
                  <div className="space-y-2">
                    {student.recentAnalysis.growthAreas.map((area, index) => (
                      <Badge key={index} variant="outline" className="text-orange-700 border-orange-200">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 관찰사항 및 추천사항 */}
        {student.recentAnalysis && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>AI 분석 의견</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 주요 관찰사항 */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">주요 관찰사항</h4>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm">{student.recentAnalysis.observations}</p>
                </div>
              </div>

              {/* 감정 패턴 */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">감정 패턴</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm">{student.recentAnalysis.emotionalPattern}</p>
                </div>
              </div>

              {/* 지원 전략 */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">권장 지원 전략</h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm">{student.recentAnalysis.supportStrategy}</p>
                </div>
              </div>

              {/* 추천사항 */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">구체적 추천사항</h4>
                <div className="space-y-2">
                  {student.recentAnalysis.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 분석 기록 */}
        <Card>
          <CardHeader>
            <CardTitle>분석 기록 ({getFilteredAnalyses().length}개)</CardTitle>
          </CardHeader>
          <CardContent>
            {getFilteredAnalyses().length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">분석 기록이 없습니다</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  선택한 기간에 해당하는 분석 기록이 없습니다.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredAnalyses().reverse().map((analysis, index) => (
                  <div key={analysis.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {analysis.analysisDate.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        평균 점수: {(
                          (analysis.scores.selfAwareness + 
                           analysis.scores.selfManagement + 
                           analysis.scores.socialAwareness + 
                           analysis.scores.relationshipSkills + 
                           analysis.scores.responsibleDecisionMaking) / 5
                        ).toFixed(1)}/5
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {Object.entries(analysis.scores).map(([domain, score]) => (
                        <div key={domain} className={`text-center p-2 rounded border ${getScoreBgColor(score)}`}>
                          <div className="text-xs text-muted-foreground">
                            {selNames[domain as keyof typeof selNames]}
                          </div>
                          <div className={`text-sm font-bold ${getScoreColor(score)}`}>
                            {score}
                          </div>
                        </div>
                      ))}
                    </div>

                    {analysis.observations && (
                      <p className="text-sm text-muted-foreground">
                        {analysis.observations}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}