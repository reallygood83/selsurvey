'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { surveyService, classService } from '@/lib/firestore';
import { Survey, SurveyResponse, SurveyType, SurveyOption, ClassInfo } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Users, Calendar, Clock, Eye, Edit, Trash2, AlertCircle, BarChart3, Bot, Brain, Heart } from 'lucide-react';
import StudentResponseDetailEnhanced from '@/components/teacher/StudentResponseDetailEnhanced';
import SimpleAIReportGenerator from '@/components/teacher/SimpleAIReportGenerator';
import SELDataDebugger from '@/components/teacher/SELDataDebugger';

export default function SurveyViewPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const surveyId = params?.surveyId as string;

  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'ai-report' | 'sel-analysis'>('list');

  useEffect(() => {
    if (surveyId && user) {
      loadSurveyData();
    }
  }, [surveyId, user]);

  const loadSurveyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 설문 정보 로드
      const surveyData = await surveyService.getSurvey(surveyId);
      if (!surveyData) {
        setError('설문을 찾을 수 없습니다.');
        return;
      }

      // 권한 확인
      if (surveyData.teacherId !== user?.uid) {
        setError('이 설문을 조회할 권한이 없습니다.');
        return;
      }

      setSurvey(surveyData);

      // 응답 데이터 로드
      const responsesData = await surveyService.getResponsesByClass(surveyData.classCode);
      const surveyResponses = responsesData; // The responses are already filtered by survey type in the service
      setResponses(surveyResponses);

      // 클래스 정보 로드
      const classes = await classService.getClassesByTeacher(user!.uid);
      const targetClass = classes.find((c: ClassInfo) => c.classCode === surveyData.classCode);
      setClassInfo(targetClass || null);
    } catch (error) {
      console.error('설문 데이터 로딩 오류:', error);
      setError('설문 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? '활성' : '비활성';
  };

  const getTypeText = (type: SurveyType) => {
    switch (type) {
      case 'daily':
        return '일별';
      case 'weekly':
        return '주별';
      case 'monthly':
        return '월별';
      default:
        return '기타';
    }
  };

  // 학생별 응답 그룹화
  const getStudentResponses = () => {
    const studentMap = new Map<string, SurveyResponse[]>();
    responses.forEach(response => {
      const studentId = response.studentId;
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, []);
      }
      studentMap.get(studentId)!.push(response);
    });
    return Array.from(studentMap.entries()).map(([studentId, responses]) => ({
      studentId,
      responses: responses.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
      latestResponse: responses[0]
    }));
  };

  const studentResponseGroups = getStudentResponses();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">설문 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">오류 발생</h3>
          <p className="text-gray-500 mb-4">{error || '설문을 찾을 수 없습니다.'}</p>
          <button
            onClick={() => router.push('/teacher/surveys/manage')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            설문 관리로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/teacher/surveys/manage')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            설문 관리로 돌아가기
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{survey.title}</h1>
              <p className="text-gray-600">{survey.description}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(survey.isActive)}`}>
                {survey.isActive ? '활성' : '비활성'}
              </span>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">총 응답 수</p>
                <p className="text-2xl font-bold text-gray-900">{responses.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">설문 유형</p>
                <p className="text-lg font-semibold text-gray-900">{getTypeText(survey.type)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">생성일</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(survey.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 클래스 정보 */}
        {classInfo && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">배포된 클래스</h2>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium text-gray-900">{classInfo.className}</p>
                <p className="text-sm text-gray-600">클래스 코드: {classInfo.classCode}</p>
              </div>
            </div>
          </div>
        )}

        {/* 질문 목록 */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">설문 질문</h2>
          <div className="space-y-4">
            {survey.questions.map((question, index) => (
              <div key={question.id} className="p-4 border border-gray-200 rounded-md">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900">
                    {index + 1}. {question.question}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                        {question.type === 'text' && '주관식'}
                        {question.type === 'choice' && '객관식'}
                        {question.type === 'scale' && '평점'}
                        {question.type === 'emotion' && '감정'}
                      </span>
                    {question.isRequired && (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
                        필수
                      </span>
                    )}
                  </div>
                </div>
                
                {question.type === 'choice' && question.options && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">선택지:</p>
                    <div className="space-y-1">
                      {question.options.map((option: SurveyOption, optionIndex: number) => (
                        <div key={optionIndex} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span className="text-sm text-gray-700">{option.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 응답 현황 및 상세 분석 */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">응답 현황 및 분석</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                학생 목록
              </button>
              <button
                onClick={() => setViewMode('detail')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'detail' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                disabled={!selectedStudent}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                상세 분석
              </button>
              <button
                onClick={() => setViewMode('ai-report')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'ai-report' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                disabled={responses.length === 0}
              >
                <Bot className="w-4 h-4 inline mr-2" />
                AI 리포트
              </button>
              <button
                onClick={() => setViewMode('sel-analysis')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'sel-analysis' 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                disabled={responses.length === 0}
              >
                <Heart className="w-4 h-4 inline mr-2" />
                SEL 분석
              </button>
            </div>
          </div>

          {responses.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">아직 응답이 없습니다.</p>
            </div>
          ) : (
            <>
              {/* 학생 목록 뷰 */}
              {viewMode === 'list' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                    <span className="font-medium text-gray-900">참여 학생 수</span>
                    <span className="text-lg font-bold text-blue-600">{studentResponseGroups.length}명</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {studentResponseGroups.map((studentGroup, index) => (
                      <div 
                        key={studentGroup.studentId} 
                        className={`p-4 border rounded-md cursor-pointer transition-all hover:shadow-md ${
                          selectedStudent === studentGroup.studentId 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedStudent(studentGroup.studentId)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">학생 #{index + 1}</span>
                          <span className="text-xs text-gray-500">
                            총 {studentGroup.responses.length}회 응답
                          </span>
                        </div>
                        <div className="text-sm text-gray-700">
                          <p>학생 ID: {studentGroup.studentId.substring(0, 8)}...</p>
                          <p className="text-xs text-gray-500 mt-1">
                            최근: {formatDate(studentGroup.latestResponse.submittedAt)}
                          </p>
                        </div>
                        {selectedStudent === studentGroup.studentId && (
                          <div className="mt-2 pt-2 border-t border-blue-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewMode('detail');
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              상세 분석 보기 →
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 상세 분석 뷰 */}
              {viewMode === 'detail' && selectedStudent && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-md">
                    <div>
                      <h3 className="font-medium text-gray-900">선택된 학생 상세 분석</h3>
                      <p className="text-sm text-gray-600">학생 ID: {selectedStudent}</p>
                    </div>
                    <button
                      onClick={() => setViewMode('list')}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      ← 목록으로 돌아가기
                    </button>
                  </div>
                  
                  <StudentResponseDetailEnhanced 
                    responses={studentResponseGroups.find(g => g.studentId === selectedStudent)?.responses || []}
                  />
                </div>
              )}

              {/* AI 리포트 뷰 */}
              {viewMode === 'ai-report' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-md">
                    <div className="flex items-center space-x-2">
                      <Brain className="w-5 h-5 text-purple-600" />
                      <h3 className="font-medium text-gray-900">AI 리포트 및 SEL 분석</h3>
                    </div>
                    <button
                      onClick={() => setViewMode('list')}
                      className="text-sm text-purple-600 hover:text-purple-800"
                    >
                      ← 목록으로 돌아가기
                    </button>
                  </div>
                  
                  <SimpleAIReportGenerator 
                    responses={responses}
                    classCode={survey.classCode}
                    surveyTitle={survey.title}
                  />
                </div>
              )}

              {/* SEL 분석 뷰 */}
              {viewMode === 'sel-analysis' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-md">
                    <div className="flex items-center space-x-2">
                      <Heart className="w-5 h-5 text-orange-600" />
                      <h3 className="font-medium text-gray-900">SEL 데이터 분석 및 검증</h3>
                    </div>
                    <button
                      onClick={() => setViewMode('list')}
                      className="text-sm text-orange-600 hover:text-orange-800"
                    >
                      ← 목록으로 돌아가기
                    </button>
                  </div>
                  
                  {/* SEL 분석은 학생이 선택되었을 때만 표시 */}
                  {selectedStudent ? (
                    <SELDataDebugger
                      student={{
                        id: selectedStudent,
                        userId: selectedStudent,
                        name: `학생 #${studentResponseGroups.findIndex(g => g.studentId === selectedStudent) + 1}`,
                        grade: responses.find(r => r.studentId === selectedStudent)?.grade || 1,
                        classCode: survey.classCode,
                        teacherId: user?.uid || '',
                        joinedAt: new Date(),
                        isActive: true,
                        responseHistory: studentResponseGroups.find(g => g.studentId === selectedStudent)?.responses || [],
                        analysisHistory: [],
                        totalResponses: studentResponseGroups.find(g => g.studentId === selectedStudent)?.responses.length || 0,
                        participationRate: 100
                      }}
                      responses={studentResponseGroups.find(g => g.studentId === selectedStudent)?.responses || []}
                      analyses={[]}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 mb-2">SEL 분석을 위해 학생을 선택해주세요</p>
                      <button
                        onClick={() => setViewMode('list')}
                        className="text-orange-600 hover:text-orange-800 font-medium"
                      >
                        학생 목록으로 이동하기 →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => router.push(`/teacher/surveys/edit/${surveyId}`)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Edit className="h-4 w-4" />
            수정하기
          </button>
          <button
            onClick={() => router.push('/teacher/surveys/manage')}
            className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            목록으로
          </button>
        </div>
      </div>
    </div>
  );
}