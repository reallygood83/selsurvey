// 학생 설문 페이지 - SEL 기반 감정 및 사회정서 설문
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { surveyService, studentService } from '@/lib/firestore';
import { analyzeSELData } from '@/lib/gemini';
import { StudentProfile, SurveyResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, ArrowRight, X } from 'lucide-react';

// 설문 타입별 설정
const surveyConfigs = {
  daily: {
    title: '오늘의 기분은 어때요?',
    description: '간단한 감정 체크로 하루를 시작해봐요',
    estimatedTime: 2,
    icon: '😊'
  },
  weekly: {
    title: '이번 주 나의 감정 돌아보기',
    description: '일주일 동안의 감정과 경험을 정리해봐요',
    estimatedTime: 5,
    icon: '📝'
  },
  monthly: {
    title: '한 달간의 성장 이야기',
    description: '나의 변화와 성장을 되돌아보는 시간이에요',
    estimatedTime: 10,
    icon: '🌱'
  }
};

// 일일 설문 질문 (저학년용 이모지 기반)
const dailyQuestionsLower = [
  {
    id: 'mood',
    question: '지금 기분이 어때요?',
    type: 'emoji_scale',
    options: ['😢', '😟', '😐', '😊', '😄'],
    labels: ['매우 슬픔', '조금 슬픔', '보통', '기쁨', '매우 기쁨']
  },
  {
    id: 'energy',
    question: '오늘 힘이 얼마나 있나요?',
    type: 'emoji_scale',
    options: ['😴', '😑', '🙂', '😊', '🤗'],
    labels: ['매우 피곤', '조금 피곤', '보통', '활기참', '매우 활기참']
  },
  {
    id: 'friendship',
    question: '친구들과 어떻게 지냈나요?',
    type: 'emoji_scale',
    options: ['😭', '😞', '😐', '😊', '🥰'],
    labels: ['힘들었음', '조금 힘듦', '보통', '좋았음', '매우 좋음']
  }
];

// 일일 설문 질문 (고학년용 텍스트 기반)
const dailyQuestionsUpper = [
  {
    id: 'mood',
    question: '오늘 전반적인 기분은 어떤가요?',
    type: 'scale',
    min: 1,
    max: 5,
    labels: ['매우 나쁨', '나쁨', '보통', '좋음', '매우 좋음']
  },
  {
    id: 'stress',
    question: '오늘 스트레스는 얼마나 받았나요?',
    type: 'scale',
    min: 1,
    max: 5,
    labels: ['전혀 없음', '조금', '보통', '많이', '매우 많이']
  },
  {
    id: 'satisfaction',
    question: '오늘 하루에 얼마나 만족하나요?',
    type: 'scale',
    min: 1,
    max: 5,
    labels: ['매우 불만족', '불만족', '보통', '만족', '매우 만족']
  }
];

// 주간 설문 질문
const weeklyQuestions = [
  {
    id: 'weekMood',
    question: '이번 주 전반적인 기분은 어땠나요?',
    type: 'scale',
    min: 1,
    max: 5,
    labels: ['매우 힘들었음', '힘들었음', '보통', '좋았음', '매우 좋았음']
  },
  {
    id: 'schoolSatisfaction',
    question: '이번 주 학교생활은 어땠나요?',
    type: 'scale',
    min: 1,
    max: 5,
    labels: ['매우 힘들었음', '힘들었음', '보통', '좋았음', '매우 좋았음']
  },
  {
    id: 'friendshipQuality',
    question: '친구들과의 관계는 어땠나요?',
    type: 'scale',
    min: 1,
    max: 5,
    labels: ['매우 어려웠음', '어려웠음', '보통', '좋았음', '매우 좋았음']
  },
  {
    id: 'learningConfidence',
    question: '공부에 대한 자신감은 어떤가요?',
    type: 'scale',
    min: 1,
    max: 5,
    labels: ['전혀 없음', '부족함', '보통', '있음', '매우 많음']
  },
  {
    id: 'emotionControl',
    question: '화가 나거나 슬플 때 감정을 잘 조절했나요?',
    type: 'scale',
    min: 1,
    max: 5,
    labels: ['전혀 못함', '잘 못함', '보통', '잘함', '매우 잘함']
  }
];

// 월간 종합 설문 질문
const monthlyQuestions = [
  {
    id: 'selfAwareness',
    question: '나 자신의 감정을 얼마나 잘 알고 있나요?',
    type: 'scale',
    min: 1,
    max: 5,
    labels: ['전혀 모름', '잘 모름', '보통', '잘 앎', '매우 잘 앎']
  },
  {
    id: 'selfManagement',
    question: '화가 나거나 스트레스받을 때 감정을 잘 조절하나요?',
    type: 'scale',
    min: 1,
    max: 5,
    labels: ['전혀 못함', '잘 못함', '보통', '잘함', '매우 잘함']
  },
  {
    id: 'socialAwareness',
    question: '다른 사람의 감정을 얼마나 잘 이해하나요?',
    type: 'scale',
    min: 1,
    max: 5,
    labels: ['전혀 모름', '잘 모름', '보통', '잘 이해함', '매우 잘 이해함']
  },
  {
    id: 'relationshipSkills',
    question: '친구들과 좋은 관계를 맺고 유지하는 것이 얼마나 쉬운가요?',
    type: 'scale',
    min: 1,
    max: 5,
    labels: ['매우 어려움', '어려움', '보통', '쉬움', '매우 쉬움']
  },
  {
    id: 'responsibleDecisionMaking',
    question: '문제가 생겼을 때 올바른 선택을 하려고 노력하나요?',
    type: 'scale',
    min: 1,
    max: 5,
    labels: ['전혀 안함', '잘 안함', '보통', '노력함', '매우 노력함']
  },
  {
    id: 'helpSeeking',
    question: '도움이 필요할 때 어른이나 친구에게 도움을 요청하나요?',
    type: 'scale',
    min: 1,
    max: 5,
    labels: ['전혀 안함', '잘 안함', '보통', '자주 함', '항상 함']
  },
  {
    id: 'familyRelation',
    question: '가족과의 관계는 어떤가요?',
    type: 'scale',
    min: 1,
    max: 5,
    labels: ['매우 어려움', '어려움', '보통', '좋음', '매우 좋음']
  },
  {
    id: 'openText',
    question: '이번 달 가장 기억에 남는 일이나 느낀 점을 자유롭게 써주세요',
    type: 'text',
    placeholder: '자유롭게 써주세요...'
  }
];

export default function StudentSurveyPage() {
  const { currentUser, userProfile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const surveyType = params.type as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string | number>>({});
  const [questions, setQuestions] = useState<Array<{
    id: string;
    question: string;
    type: string;
    options?: string[];
    labels?: string[];
    min?: number;
    max?: number;
    placeholder?: string;
  }>>([]);

  useEffect(() => {
    if (!currentUser || userProfile?.role !== 'student') {
      router.push('/auth/login?role=student');
      return;
    }

    loadStudentProfile();
  }, [currentUser, userProfile, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadStudentProfile = async () => {
    if (!currentUser) return;

    try {
      const profile = await studentService.getStudentProfile(currentUser.uid);
      if (!profile) {
        router.push('/student/join');
        return;
      }

      setStudentProfile(profile);
      setupQuestions(profile.grade);
    } catch (error) {
      console.error('학생 프로필 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupQuestions = (grade: number) => {
    switch (surveyType) {
      case 'daily':
        setQuestions(grade <= 3 ? dailyQuestionsLower : dailyQuestionsUpper);
        break;
      case 'weekly':
        setQuestions(weeklyQuestions);
        break;
      case 'monthly':
        setQuestions(monthlyQuestions);
        break;
      default:
        router.push('/student/dashboard');
    }
  };

  const handleAnswer = (questionId: string, answer: string | number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!studentProfile || !currentUser) return;

    setSubmitting(true);

    try {
      // 설문 응답 저장 - responses를 배열 형태로 변환
      const responsesArray = Object.entries(responses).map(([questionId, answer]) => ({
        questionId,
        answer,
        domain: 'selfAwareness' as const // 기본 SEL 도메인으로 설정
      }));

      const surveyResponse: Omit<SurveyResponse, 'id'> = {
        surveyId: `${surveyType}-survey`, // 기본 설문 ID
        studentId: studentProfile.id,
        surveyType: surveyType as 'daily' | 'weekly' | 'monthly',
        responses: responsesArray,
        submittedAt: new Date(),
        grade: studentProfile.grade,
        classCode: studentProfile.classCode
      };

      await surveyService.createSurveyResponse(surveyResponse);

      // 월간 설문인 경우 AI 분석 수행
      if (surveyType === 'monthly') {
        try {
          const previousResponses = await surveyService.getStudentResponses(studentProfile.id, 10);
          const analysisResult = await analyzeSELData(
            studentProfile as unknown as Record<string, unknown>,
            responses,
            previousResponses as unknown as Record<string, unknown>
          );

          // 분석 결과를 학생 프로필에 추가
          await studentService.addAnalysisToStudent(studentProfile.id, analysisResult);
        } catch (analysisError) {
          console.error('AI 분석 오류:', analysisError);
          // 분석 실패해도 설문 제출은 성공으로 처리
        }
      }

      // 성공 페이지로 이동
      router.push(`/student/survey/complete?type=${surveyType}`);
    } catch (error) {
      console.error('설문 제출 오류:', error);
      alert('설문 제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: {
    id: string;
    question: string;
    type: string;
    options?: string[];
    labels?: string[];
    min?: number;
    max?: number;
    placeholder?: string;
  }) => {
    const currentAnswer = responses[question.id];

    if (question.type === 'emoji_scale') {
      return (
        <div className="space-y-6">
          <div className="flex justify-center space-x-4">
            {question.options?.map((emoji: string, index: number) => (
              <button
                key={index}
                onClick={() => handleAnswer(question.id, index + 1)}
                className={`p-4 text-4xl border-2 rounded-full transition-all duration-200 ${
                  currentAnswer === index + 1 
                    ? 'border-purple-500 bg-purple-50 scale-110' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="flex justify-center space-x-4 text-xs text-gray-500">
            {question.labels?.map((label: string, index: number) => (
              <span key={index} className="text-center w-16">{label}</span>
            ))}
          </div>
        </div>
      );
    }

    if (question.type === 'scale') {
      return (
        <div className="space-y-6">
          <div className="flex justify-center space-x-2">
            {Array.from({ length: question.max || 5 }, (_, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(question.id, index + 1)}
                className={`w-12 h-12 rounded-full border-2 text-sm font-medium transition-all duration-200 ${
                  currentAnswer === index + 1
                    ? 'border-purple-500 bg-purple-500 text-white scale-110'
                    : 'border-gray-300 text-gray-600 hover:border-purple-300'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          {question.labels && (
            <div className="flex justify-between text-xs text-gray-500 px-4">
              <span>{question.labels[0]}</span>
              <span>{question.labels[question.labels.length - 1]}</span>
            </div>
          )}
        </div>
      );
    }

    if (question.type === 'text') {
      return (
        <Textarea
          value={currentAnswer || ''}
          onChange={(e) => handleAnswer(question.id, e.target.value)}
          placeholder={question.placeholder}
          className="h-32 resize-none"
        />
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!questions.length || !surveyConfigs[surveyType as keyof typeof surveyConfigs]) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-4">설문을 찾을 수 없습니다</h2>
            <Button
              onClick={() => router.push('/student/dashboard')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              대시보드로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const config = surveyConfigs[surveyType as keyof typeof surveyConfigs];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* 헤더 */}
      <header className="bg-background border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">{config.icon}</span>
              <div>
                <h1 className="text-xl font-bold">{config.title}</h1>
                <p className="text-sm text-muted-foreground">{config.description}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/student/dashboard')}
            >
              <X className="w-4 h-4 mr-2" />
              나중에 하기
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 진행률 */}
        <Card className="mb-8">
          <CardContent className="pt-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>질문 {currentQuestionIndex + 1} / {questions.length}</span>
              <span>{Math.round(progress)}% 완료</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* 질문 카드 */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {currentQuestion.question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderQuestion(currentQuestion)}
          </CardContent>
        </Card>

        {/* 네비게이션 버튼 */}
        <div className="flex justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            variant={currentQuestionIndex === 0 ? "secondary" : "outline"}
            size="lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            이전
          </Button>

          <Button
            onClick={handleNext}
            disabled={!responses[currentQuestion.id] || submitting}
            variant={currentQuestionIndex === questions.length - 1 ? "default" : "default"}
            size="lg"
            className={currentQuestionIndex === questions.length - 1 
              ? "bg-green-600 hover:bg-green-700" 
              : "bg-purple-600 hover:bg-purple-700"
            }
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                제출 중...
              </>
            ) : currentQuestionIndex === questions.length - 1 ? (
              '완료'
            ) : (
              <>
                다음
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}