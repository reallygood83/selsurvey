'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { surveyService } from '@/lib/firestore';
import { Survey } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, Edit, Eye, Users, Calendar, AlertCircle } from 'lucide-react';

export default function SurveyManagementPage() {
  const { currentUser, userProfile } = useAuth();
  const router = useRouter();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [surveyResponses, setSurveyResponses] = useState<Record<string, number>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadSurveys();
    }
  }, [currentUser]);

  const loadSurveys = async () => {
    try {
      setLoading(true);
      const teacherSurveys = await surveyService.getSurveysByTeacher(currentUser!.uid);
      setSurveys(teacherSurveys);

      // 각 설문의 응답 개수 조회
      const responseCounts: Record<string, number> = {};
      await Promise.all(
        teacherSurveys.map(async (survey) => {
          const count = await surveyService.getSurveyResponseCount(survey.id);
          responseCounts[survey.id] = count;
        })
      );
      setSurveyResponses(responseCounts);
    } catch (error) {
      console.error('설문 목록 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (surveyId: string) => {
    try {
      await surveyService.deleteSurvey(surveyId);
      setSurveys(surveys.filter(s => s.id !== surveyId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('설문 삭제 오류:', error);
      alert('설문 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleEdit = (surveyId: string) => {
    router.push(`/teacher/surveys/edit/${surveyId}`);
  };

  const handleView = (surveyId: string) => {
    router.push(`/teacher/surveys/view/${surveyId}`);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">설문을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">설문 관리</h1>
          <p className="text-gray-600">배포된 설문을 관리하고 응답 현황을 확인할 수 있습니다.</p>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">설문 목록</h2>
            <button
              onClick={loadSurveys}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              새로고침
            </button>
          </div>

          {surveys.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 설문이 없습니다</h3>
              <p className="text-gray-500 mb-4">새로운 설문을 생성해주세요.</p>
              <button
                onClick={() => router.push('/teacher/surveys/create')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                설문 생성하기
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {surveys.map((survey: Survey) => (
                <div key={survey.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{survey.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(survey.isActive)}`}>
                          {getStatusText(survey.isActive)}
                        </span>
                      </div>
                      
                      {survey.description && (
                        <p className="text-gray-600 mb-3">{survey.description}</p>
                      )}

                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>생성일: {formatDate(survey.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>응답 수: {surveyResponses[survey.id] || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">설문 유형:</span>
                          <span className="capitalize">
                            {survey.type === 'daily' ? '일별' : 
                             survey.type === 'weekly' ? '주별' : 
                             survey.type === 'monthly' ? '월별' : '기타'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleView(survey.id)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="상세 보기"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(survey.id)}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                        title="수정"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(survey.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {deleteConfirm === survey.id && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <h4 className="font-medium text-red-900">정말로 이 설문을 삭제하시겠습니까?</h4>
                      </div>
                      <p className="text-red-700 mb-4">
                        설문 "{survey.title}"을(를) 삭제하면 관련된 모든 응답도 함께 삭제됩니다. 
                        이 작업은 되돌릴 수 없습니다.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleDelete(survey.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                          삭제 확인
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/teacher/dashboard')}
            className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}