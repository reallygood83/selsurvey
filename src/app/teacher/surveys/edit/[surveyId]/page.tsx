'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { surveyService } from '@/lib/firestore';
import { Survey, SurveyQuestion, SurveyType, SurveyOption } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Trash2, Save, X, AlertCircle } from 'lucide-react';

interface QuestionForm {
  id: string;
  text: string;
  type: 'text' | 'choice' | 'scale' | 'emotion';
  options?: SurveyOption[];
  isRequired: boolean;
}

export default function EditSurveyPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const surveyId = params?.surveyId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<SurveyType>('daily');
  const [isActive, setIsActive] = useState(false);
  const [questions, setQuestions] = useState<QuestionForm[]>([]);

  useEffect(() => {
    if (surveyId && user) {
      loadSurvey();
    }
  }, [surveyId, user]);

  const loadSurvey = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const surveyData = await surveyService.getSurvey(surveyId);
      if (!surveyData) {
        setError('설문을 찾을 수 없습니다.');
        return;
      }

      // 권한 확인
      if (surveyData.teacherId !== user?.uid) {
        setError('이 설문을 수정할 권한이 없습니다.');
        return;
      }

      setSurvey(surveyData);
      setTitle(surveyData.title);
      setDescription(surveyData.description || '');
      setType(surveyData.type);
      setIsActive(surveyData.isActive);
      
      // 기존 질문들을 폼 형식으로 변환
      const formQuestions: QuestionForm[] = surveyData.questions.map((q: SurveyQuestion, index: number) => ({
        id: q.id || `question-${index}`,
        text: q.question,
        type: q.type,
        options: q.options || [],
        isRequired: q.isRequired || false
      }));
      setQuestions(formQuestions);
    } catch (error) {
      console.error('설문 로딩 오류:', error);
      setError('설문을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    const newQuestion: QuestionForm = {
      id: `question-${Date.now()}`,
      text: '',
      type: 'text',
      options: [],
      isRequired: false
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: keyof QuestionForm, value: string | boolean | string[]) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
  };

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options = [...(updatedQuestions[questionIndex].options || []), { id: `option-${Date.now()}`, text: '', value: (updatedQuestions[questionIndex].options?.length || 0) + 1 }];
    setQuestions(updatedQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options = [...(updatedQuestions[questionIndex].options || [])];
      updatedQuestions[questionIndex].options![optionIndex] = { ...updatedQuestions[questionIndex].options![optionIndex], text: value };
      setQuestions(updatedQuestions);
    }
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options!.filter((_, index) => index !== optionIndex);
      setQuestions(updatedQuestions);
    }
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setError('설문 제목을 입력해주세요.');
      return false;
    }

    if (questions.length === 0) {
      setError('최소 하나 이상의 질문이 필요합니다.');
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        setError(`${i + 1}번째 질문의 내용을 입력해주세요.`);
        return false;
      }

      if (questions[i].type === 'choice' && (!questions[i].options || (questions[i].options && questions[i].options!.filter((opt: SurveyOption) => opt.text.trim() !== '').length < 2))) {
        setError(`${i + 1}번째 객관식 질문에는 최소 2개의 선택지가 필요합니다.`);
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const surveyQuestions: SurveyQuestion[] = questions.map((q: QuestionForm, index: number) => ({
        id: q.id,
        type: q.type,
        domain: 'selfAwareness', // Default domain
        question: q.text,
        grade: [1, 2, 3, 4, 5, 6], // Default to all grades
        options: q.type === 'choice' ? q.options?.filter((opt: SurveyOption) => opt.text.trim() !== '') : undefined,
        isRequired: q.isRequired,
        order: index + 1
      }));

      const updateData = {
        title: title.trim(),
        description: description.trim(),
        type,
        isActive,
        questions: surveyQuestions,
        updatedAt: new Date()
      };

      await surveyService.updateSurvey(surveyId, updateData);
      
      alert('설문이 성공적으로 업데이트되었습니다.');
      router.push('/teacher/surveys/manage');
    } catch (error) {
      console.error('설문 업데이트 오류:', error);
      setError('설문 업데이트 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
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

  if (error && !survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">오류 발생</h3>
          <p className="text-gray-500 mb-4">{error}</p>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">설문 수정</h1>
          <p className="text-gray-600">기존 설문의 내용을 수정합니다.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설문 제목 *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="설문 제목을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설문 설명
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="설문에 대한 설명을 입력하세요"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설문 유형
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as SurveyType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="daily">일별</option>
                    <option value="weekly">주별</option>
                    <option value="monthly">월별</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상태
                  </label>
                  <select
                    value={isActive ? 'active' : 'inactive'}
                    onChange={(e) => setIsActive(e.target.value === 'active')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">초안</option>
                    <option value="active">활성</option>
                    <option value="inactive">비활성</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">질문 목록</h2>
              <button
                onClick={addQuestion}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                질문 추가
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">아직 추가된 질문이 없습니다.</p>
                <button
                  onClick={addQuestion}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  첫 번째 질문 추가
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="p-4 border border-gray-200 rounded-md">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">질문 {index + 1}</span>
                      <button
                        onClick={() => removeQuestion(index)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          질문 내용 *
                        </label>
                        <input
                          type="text"
                          value={question.text}
                          onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="질문 내용을 입력하세요"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            질문 유형
                          </label>
                          <select
                            value={question.type}
                            onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="text">주관식</option>
                            <option value="choice">객관식</option>
                            <option value="rating">평점</option>
                            <option value="emotion">감정</option>
                          </select>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`required-${question.id}`}
                            checked={question.isRequired}
                            onChange={(e) => updateQuestion(index, 'isRequired', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`required-${question.id}`} className="ml-2 text-sm text-gray-700">
                            필수 응답
                          </label>
                        </div>
                      </div>

                      {question.type === 'choice' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            선택지
                          </label>
                          <div className="space-y-2">
                            {(question.options || []).map((option: SurveyOption, optionIndex: number) => (
                              <div key={optionIndex} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={option.text}
                                  onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder={`선택지 ${optionIndex + 1}`}
                                />
                                <button
                                  onClick={() => removeOption(index, optionIndex)}
                                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => addOption(index)}
                              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              + 선택지 추가
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
            <button
              onClick={() => router.push('/teacher/surveys/manage')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <X className="h-4 w-4" />
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}