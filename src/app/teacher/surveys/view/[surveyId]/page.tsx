'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { surveyService, classService } from '@/lib/firestore';
import { Survey, SurveyResponse, SurveyType, SurveyOption } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Users, Calendar, Clock, Eye, Edit, Trash2, AlertCircle } from 'lucide-react';

export default function SurveyViewPage() {
  const { currentUser, userProfile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const surveyId = params?.surveyId as string;

  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (surveyId && currentUser) {
      loadSurveyData();
    }
  }, [surveyId, currentUser]);

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
      if (surveyData.teacherId !== currentUser?.uid) {
        setError('이 설문을 조회할 권한이 없습니다.');
        return;
      }

      setSurvey(surveyData);

      // 응답 데이터 로드
      const responsesData = await surveyService.getResponsesByClass(surveyData.classCode);
      const surveyResponses = responsesData; // The responses are already filtered by survey type in the service
      setResponses(surveyResponses);

      // 클래스 정보 로드
      const classes = await classService.getClassesByTeacher(currentUser!.uid);
      const targetClass = classes.find((c: any) => c.code === surveyData.classCode);
      setClassInfo(targetClass);
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
                <p className="font-medium text-gray-900">{classInfo.name}</p>
                <p className="text-sm text-gray-600">클래스 코드: {classInfo.code}</p>
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

        {/* 응답 현황 */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">응답 현황</h2>
          {responses.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">아직 응답이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                <span className="font-medium text-gray-900">총 응답 수</span>
                <span className="text-lg font-bold text-blue-600">{responses.length}개</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {responses.slice(0, 10).map((response: SurveyResponse, index: number) => (
                  <div key={response.id} className="p-4 border border-gray-200 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">응답 {index + 1}</span>
                      <span className="text-xs text-gray-500">
                        {formatDate(response.submittedAt)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>학생 ID: {response.studentId}</p>
                      <p>응답 수: {response.responses ? response.responses.length : 0}개</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {responses.length > 10 && (
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    외 {responses.length - 10}개의 응답이 더 있습니다.
                  </p>
                </div>
              )}
            </div>
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