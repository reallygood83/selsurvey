// 교사 리포트 페이지 - SEL 분석 결과 및 상담 데이터 조회
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { classService, studentService, surveyService, analysisService } from '@/lib/firestore';
import { ClassInfo, StudentProfile, SurveyResponse, SELAnalysis } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, BarChart3, User, Brain, BookOpen, AlertCircle, FileText, MessageSquare } from 'lucide-react';
import StudentResponseDetail from '@/components/teacher/StudentResponseDetail';
import AIReportGenerator from '@/components/teacher/AIReportGenerator';

export default function TeacherReportsPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [studentAnalyses, setStudentAnalyses] = useState<SELAnalysis[]>([]);
  const [recentResponses, setRecentResponses] = useState<SurveyResponse[]>([]);

  useEffect(() => {
    if (!user || userProfile?.role !== 'teacher') {
      router.push('/auth/login?role=teacher');
      return;
    }

    loadTeacherData();
  }, [user, userProfile, router]);

  useEffect(() => {
    if (selectedClassId) {
      loadClassData(selectedClassId);
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentDetails(selectedStudent.id);
    }
  }, [selectedStudent]);

  const loadTeacherData = async () => {
    if (!user) return;

    try {
      const teacherClasses = await classService.getClassesByTeacher(user.uid);
      setClasses(teacherClasses);
      
      if (teacherClasses.length > 0) {
        setSelectedClassId(teacherClasses[0].id);
      }
    } catch (error) {
      console.error('교사 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClassData = async (classId: string) => {
    const classInfo = classes.find(c => c.id === classId);
    if (!classInfo) return;

    setSelectedClass(classInfo);

    try {
      const classStudents = await studentService.getStudentsByClass(classInfo.classCode);
      setStudents(classStudents);
      
      if (classStudents.length > 0) {
        setSelectedStudent(classStudents[0]);
      }
    } catch (error) {
      console.error('반 데이터 로드 오류:', error);
    }
  };

  const loadStudentDetails = async (studentId: string) => {
    try {
      // 학생의 분석 기록 조회
      const analyses = await analysisService.getAnalysesByStudent(studentId, 10);
      setStudentAnalyses(analyses);

      // 최근 설문 응답 조회 - studentId로 직접 조회 (훨씬 효율적)
      console.log('📊 [Reports] 학생 설문 응답 조회 시작:', {
        studentId: studentId,
        studentName: selectedStudent?.name
      });
      
      try {
        const studentResponses = await surveyService.getResponsesByStudent(studentId, 10);
        console.log(`✅ [Reports] 학생 응답 조회 완료: ${studentResponses.length}개`);
        
        setRecentResponses(studentResponses);
        
        // 디버깅용 로그: 응답 데이터 구조 확인
        if (studentResponses.length > 0) {
          console.log('📋 [Reports] 학생 응답 샘플:', {
            firstResponse: {
              id: studentResponses[0].id,
              surveyType: studentResponses[0].surveyType,
              studentId: studentResponses[0].studentId,
              classCode: studentResponses[0].classCode,
              submittedAt: studentResponses[0].submittedAt
            }
          });
        }
      } catch (error) {
        console.error('❌ [Reports] 학생 응답 조회 오류:', error);
        setRecentResponses([]);
      }
    } catch (error) {
      console.error('학생 상세 데이터 로드 오류:', error);
    }
  };


  const getSELDomainName = (domain: string) => {
    const domainNames = {
      selfAwareness: '자기인식',
      selfManagement: '자기관리',
      socialAwareness: '사회적 인식',
      relationshipSkills: '관계 기술',
      responsibleDecisionMaking: '책임감 있는 의사결정'
    };
    return domainNames[domain as keyof typeof domainNames] || domain;
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
              <CardTitle className="text-2xl font-bold mb-2">등록된 반이 없습니다</CardTitle>
              <p className="text-muted-foreground mb-4">먼저 반을 생성해주세요.</p>
              <Button onClick={() => router.push('/teacher/onboarding')}>
                반 생성하기
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
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/teacher/dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                대시보드
              </Button>
              <h1 className="text-2xl font-bold flex items-center">
                <BarChart3 className="w-6 h-6 mr-2" />
                SEL 분석 리포트
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 반 선택 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                반 선택
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="반을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classInfo) => (
                    <SelectItem key={classInfo.id} value={classInfo.id}>
                      {classInfo.grade}학년 {classInfo.className} ({classInfo.classCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 학생 목록 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  학생 목록
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {students.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      참여한 학생이 없습니다
                    </div>
                  ) : (
                    <div className="divide-y">
                      {students.map((student) => (
                        <Button
                          key={student.id}
                          variant="ghost"
                          onClick={() => setSelectedStudent(student)}
                          className={`w-full justify-start px-6 py-4 h-auto rounded-none ${
                            selectedStudent?.id === student.id ? 'bg-accent border-r-4 border-primary' : ''
                          }`}
                        >
                          <div className="text-left">
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-muted-foreground">
                              참여율: {student.participationRate}% | 총 응답: {student.totalResponses}회
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 선택된 학생 정보 - 탭 기반 인터페이스 */}
            <div className="lg:col-span-2">
              {selectedStudent ? (
                <div className="space-y-6">
                  {/* 학생 기본 정보 헤더 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        {selectedStudent.name} 학생 상세 정보
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">학년/반</div>
                          <div className="font-medium">{selectedStudent.grade}학년 {selectedClass?.className}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">참여 시작일</div>
                          <div className="font-medium">
                            {format(selectedStudent.joinedAt, 'yyyy년 M월 d일', { locale: ko })}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">총 응답 수</div>
                          <div className="font-medium">{selectedStudent.totalResponses}회</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">참여율</div>
                          <div className="font-medium">{selectedStudent.participationRate}%</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 탭 기반 상세 정보 */}
                  <Tabs defaultValue="responses" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="responses" className="flex items-center">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        설문 응답 ({recentResponses.length})
                      </TabsTrigger>
                      <TabsTrigger value="analysis" className="flex items-center">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        SEL 분석 ({studentAnalyses.length})
                      </TabsTrigger>
                      <TabsTrigger value="ai-report" className="flex items-center">
                        <Brain className="w-4 h-4 mr-2" />
                        AI 리포트
                      </TabsTrigger>
                    </TabsList>

                    {/* 설문 응답 탭 */}
                    <TabsContent value="responses" className="space-y-4">
                      <StudentResponseDetail 
                        responses={recentResponses}
                        className="mt-4"
                      />
                    </TabsContent>

                    {/* SEL 분석 탭 */}
                    <TabsContent value="analysis" className="space-y-4">
                      {studentAnalyses.length > 0 ? (
                        <div className="space-y-4">
                          {studentAnalyses.map((analysis, index) => (
                            <Card key={analysis.id}>
                              <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                  <span className="flex items-center">
                                    <BarChart3 className="w-5 h-5 mr-2" />
                                    SEL 분석 결과 #{studentAnalyses.length - index}
                                  </span>
                                  <Badge variant="secondary">
                                    {format(analysis.analysisDate, 'M월 d일', { locale: ko })}
                                  </Badge>
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-4">
                                  {Object.entries(analysis.scores).map(([domain, score]) => {
                                    const numScore = typeof score === 'number' ? score : 0;
                                    return (
                                      <div key={domain} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm font-medium">
                                            {getSELDomainName(domain)}
                                          </span>
                                          <Badge 
                                            variant={numScore >= 4.0 ? 'default' : numScore >= 3.0 ? 'secondary' : numScore >= 2.0 ? 'outline' : 'destructive'}
                                          >
                                            {numScore.toFixed(1)}
                                          </Badge>
                                        </div>
                                        <Progress value={(numScore / 5) * 100} className="h-2" />
                                      </div>
                                    );
                                  })}
                                </div>
                                
                                {analysis.recommendations && (
                                  <Card className="mt-6 bg-blue-50 border-blue-200">
                                    <CardContent className="pt-4">
                                      <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-2" />
                                        상담 권고사항
                                      </h4>
                                      <p className="text-sm text-blue-800">{analysis.recommendations}</p>
                                    </CardContent>
                                  </Card>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Card>
                          <CardContent className="py-8">
                            <div className="text-center text-muted-foreground">
                              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>아직 SEL 분석 결과가 없습니다</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    {/* AI 리포트 탭 */}
                    <TabsContent value="ai-report" className="space-y-4">
                      <AIReportGenerator
                        student={selectedStudent}
                        responses={recentResponses}
                        analyses={studentAnalyses}
                        className="mt-4"
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>학생을 선택하여 상세 정보를 확인하세요</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}