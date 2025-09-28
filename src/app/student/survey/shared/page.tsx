// 학생용 공유 설문 참여 페이지
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { surveyService, studentService } from '@/lib/firestore';
import { Survey, StudentProfile, SurveyResponse, SurveyType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SharedSurveyPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const surveyId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // 설문 ID가 없으면 대시보드로 리다이렉트
    if (!surveyId) {
      router.push('/student/dashboard');
      return;
    }

    // 설문 데이터는 로그인 여부와 관계없이 로드
    loadSurveyData();
  }, [surveyId, currentUser, router]);

  const loadSurveyData = async () => {
    if (!surveyId) return;

    try {
      // 설문 데이터 먼저 로드
      const surveyData = await surveyService.getSurvey(surveyId);

      if (!surveyData) {
        toast.error('설문을 찾을 수 없습니다.');
        router.push('/student/dashboard');
        return;
      }

      console.log('설문 데이터 로드됨:', surveyData);
      console.log('질문 수:', surveyData.questions?.length || 0);
      console.log('질문 목록:', surveyData.questions);
      console.log('전체 설문 객체 구조:', JSON.stringify(surveyData, null, 2));
      
      // 질문 배열이 비어있거나 없는 경우에 대한 추가 로깅
      if (!surveyData.questions || surveyData.questions.length === 0) {
        console.error('⚠️ 설문에 질문이 없습니다!');
        console.log('설문 ID:', surveyId);
        console.log('설문 제목:', surveyData.title);
        console.log('질문 필드 값:', surveyData.questions);
      }

      setSurvey(surveyData);

      // 로그인된 사용자의 경우 학생 프로필도 로드
      if (currentUser) {
        try {
          const profileData = await studentService.getStudentProfile(currentUser.uid);
          setStudentProfile(profileData);
        } catch (error) {
          console.error('학생 프로필 로드 실패:', error);
          // 프로필 로드 실패해도 설문은 계속 진행 가능
        }
      }
    } catch (error) {
      console.error('설문 데이터 로드 오류:', error);
      toast.error('설문을 불러오는 중 오류가 발생했습니다.');
      router.push('/student/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    if (!survey || currentQuestion >= survey.questions.length - 1) return;
    setCurrentQuestion(prev => prev + 1);
  };

  const handlePrevious = () => {
    if (currentQuestion <= 0) return;
    setCurrentQuestion(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!survey) return;

    // 모든 필수 질문에 대한 응답 확인
    const requiredQuestions = survey.questions.filter(q => q.isRequired);
    const missingResponses = requiredQuestions.filter(q => !responses[q.id]);

    if (missingResponses.length > 0) {
      toast.error('모든 필수 질문에 답해주세요.');
      return;
    }

    setSubmitting(true);

    try {
      // 설문 응답 저장
      const surveyResponse: Omit<SurveyResponse, 'id'> = {
        surveyId: surveyId!, // 🔥 중요: 설문 ID 추가
        studentId: studentProfile?.id || 'anonymous',
        surveyType: 'custom' as SurveyType,
        responses: Object.entries(responses).map(([questionId, answer]) => {
          // 해당 질문을 찾아서 domain 정보 가져오기
          const question = survey.questions.find(q => q.id === questionId);
          return {
            questionId,
            answer,
            domain: question?.domain || 'selfAwareness'
          };
        }),
        submittedAt: new Date(),
        grade: studentProfile?.grade || survey.grade[0] || 1,
        classCode: studentProfile?.classCode || survey.classCode || ''
      };

      await surveyService.saveSurveyResponse(surveyResponse);

      toast.success('설문 응답이 완료되었습니다!');
      
      // 로그인된 사용자는 완료 페이지로, 비로그인 사용자는 감사 메시지 표시
      if (currentUser && studentProfile) {
        router.push('/student/survey/complete');
      } else {
        // 간단한 완료 메시지 표시 후 설문 페이지 유지
        toast.success('참여해주셔서 감사합니다!');
        setCurrentQuestion(0);
        setResponses({});
      }
    } catch (error) {
      console.error('설문 제출 오류:', error);
      toast.error('설문 제출 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">설문을 찾을 수 없습니다</h2>
              <p className="text-muted-foreground mb-4">설문 링크를 다시 확인해주세요.</p>
              <Button onClick={() => router.push('/student/dashboard')}>
                대시보드로 가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if survey has any questions
  if (!survey.questions || survey.questions.length === 0) {
    console.error('⚠️ 렌더링: 질문이 없는 설문', { survey, surveyId });
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">질문이 없습니다</h2>
              <p className="text-muted-foreground mb-4">이 설문에는 아직 질문이 등록되지 않았습니다.</p>
              <div className="text-xs text-gray-500 mb-4">
                디버깅 정보: 설문 ID {surveyId}
              </div>
              <Button onClick={() => router.push('/student/dashboard')}>
                대시보드로 가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = survey.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / survey.questions.length) * 100;
  const isLastQuestion = currentQuestion === survey.questions.length - 1;
  const currentResponse = responses[currentQ.id] || '';

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="bg-background border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold">{survey.title}</h1>
              <p className="text-sm text-muted-foreground">
                {survey.description}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/student/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              대시보드
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 진행률 */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">진행률</span>
                <Badge variant="secondary">
                  {currentQuestion + 1} / {survey.questions.length}
                </Badge>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>

          {/* 현재 질문 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-lg font-bold text-purple-600">
                  Q{currentQuestion + 1}
                </span>
                {currentQ.isRequired && (
                  <Badge variant="destructive" className="text-xs">
                    필수
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <h2 className="text-xl font-semibold">{currentQ.question}</h2>
              
              {currentQ.type === 'choice' && currentQ.options && (
                <RadioGroup
                  value={currentResponse}
                  onValueChange={(value) => handleResponseChange(currentQ.id, value)}
                >
                  <div className="space-y-3">
                    {currentQ.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.text} id={`option-${index}`} />
                        <Label 
                          htmlFor={`option-${index}`}
                          className="text-base cursor-pointer"
                        >
                          {option.emoji && <span className="mr-2">{option.emoji}</span>}
                          {option.text}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}

              {currentQ.type === 'text' && (
                <Textarea
                  placeholder="답변을 입력해주세요..."
                  value={currentResponse}
                  onChange={(e) => handleResponseChange(currentQ.id, e.target.value)}
                  className="min-h-[120px]"
                />
              )}

              {currentQ.type === 'scale' && (
                <RadioGroup
                  value={currentResponse}
                  onValueChange={(value) => handleResponseChange(currentQ.id, value)}
                >
                  <div className="grid grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <div key={score} className="text-center">
                        <RadioGroupItem 
                          value={score.toString()} 
                          id={`scale-${score}`}
                          className="mx-auto mb-2"
                        />
                        <Label 
                          htmlFor={`scale-${score}`}
                          className="text-sm cursor-pointer block"
                        >
                          {score}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>전혀 아니다</span>
                    <span>매우 그렇다</span>
                  </div>
                </RadioGroup>
              )}

              {currentQ.type === 'emotion' && currentQ.options && (
                <RadioGroup
                  value={currentResponse}
                  onValueChange={(value) => handleResponseChange(currentQ.id, value)}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {currentQ.options.map((option, index) => (
                      <div key={index} className="text-center">
                        <RadioGroupItem 
                          value={option.text} 
                          id={`emotion-${index}`}
                          className="sr-only"
                        />
                        <Label 
                          htmlFor={`emotion-${index}`}
                          className={`cursor-pointer block p-4 rounded-lg border-2 transition-colors ${
                            currentResponse === option.text
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="text-4xl mb-2">{option.emoji}</div>
                          <div className="text-sm font-medium">{option.text}</div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}
            </CardContent>
          </Card>

          {/* 네비게이션 버튼 */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              이전
            </Button>

            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                disabled={submitting || !responses[currentQ.id]}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    제출 중...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    완료
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={currentQ.isRequired && !responses[currentQ.id]}
              >
                다음
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}