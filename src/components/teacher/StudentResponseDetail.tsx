// 학생 설문 응답 상세 표시 컴포넌트
'use client';

import { SurveyResponse, SELDomain } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { selTemplates, selDomainDescriptions } from '@/data/selTemplates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Heart, 
  Users, 
  Brain, 
  Target, 
  Calendar,
  Smile,
  Meh,
  Frown
} from 'lucide-react';

interface StudentResponseDetailProps {
  responses: SurveyResponse[];
  className?: string;
}

// SEL 영역별 아이콘과 색상 매핑
const SEL_DOMAIN_CONFIG = {
  selfAwareness: {
    name: '자기인식',
    icon: Brain,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  selfManagement: {
    name: '자기관리', 
    icon: Target,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  socialAwareness: {
    name: '사회적 인식',
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  relationshipSkills: {
    name: '관계 기술',
    icon: Heart,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200'
  },
  responsibleDecisionMaking: {
    name: '책임감 있는 의사결정',
    icon: MessageSquare,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  }
};

// 설문 응답값을 해석하는 함수
const interpretResponse = (answer: string | number | string[], domain: SELDomain) => {
  if (typeof answer === 'number') {
    // 숫자형 응답 (1-5 척도)
    if (answer >= 4) return { level: 'positive', emoji: '😊', description: '긍정적' };
    if (answer >= 3) return { level: 'neutral', emoji: '😐', description: '보통' };
    return { level: 'negative', emoji: '😟', description: '관심 필요' };
  }
  
  if (typeof answer === 'string') {
    // 문자열 응답
    const lowerAnswer = answer.toLowerCase();
    if (lowerAnswer.includes('좋') || lowerAnswer.includes('행복') || lowerAnswer.includes('즐거')) {
      return { level: 'positive', emoji: '😊', description: '긍정적' };
    }
    if (lowerAnswer.includes('나쁘') || lowerAnswer.includes('슬프') || lowerAnswer.includes('화나')) {
      return { level: 'negative', emoji: '😟', description: '관심 필요' };
    }
    return { level: 'neutral', emoji: '😐', description: '보통' };
  }
  
  return { level: 'neutral', emoji: '😐', description: '응답 있음' };
};

// 응답값을 표시 가능한 형태로 변환 (객체 처리 추가 - React Error #31 수정)
const formatAnswer = (answer: any): string => {
  // 문자열이나 숫자는 그대로 변환
  if (typeof answer === 'string') return answer;
  if (typeof answer === 'number') return String(answer);

  // 배열은 각 요소를 재귀적으로 변환 후 결합
  if (Array.isArray(answer)) {
    return answer.map(item => formatAnswer(item)).join(', ');
  }

  // 객체는 text 속성 추출 (multiple-choice 응답 처리)
  if (answer && typeof answer === 'object') {
    if ('text' in answer) return String(answer.text);
    if ('value' in answer) return String(answer.value);
  }

  // 최후 수단: 문자열로 변환
  return String(answer);
};

// 질문 ID로 실제 질문 텍스트 찾기
const findQuestionText = (questionId: string, grade: number): string => {
  // 학년에 맞는 템플릿 선택
  const template = grade <= 4 ? selTemplates[0] : selTemplates[1];
  
  // 질문 ID로 질문 찾기
  const question = template.questions.find(q => q.id === questionId);
  
  if (question) {
    return question.question;
  }
  
  // 질문을 찾을 수 없는 경우 기본 메시지
  return `질문 ID: ${questionId} (질문 내용을 찾을 수 없습니다)`;
};

// 질문 타입과 선택지 정보 가져오기
const getQuestionDetails = (questionId: string, grade: number) => {
  const template = grade <= 4 ? selTemplates[0] : selTemplates[1];
  const question = template.questions.find(q => q.id === questionId);
  
  if (!question) {
    return { 
      question: `질문 ID: ${questionId}`, 
      type: 'scale', 
      options: null,
      scaleLabels: null,
      subCategory: null
    };
  }
  
  return {
    question: question.question,
    type: question.type,
    options: question.options || null,
    scaleLabels: question.scaleLabels || null,
    subCategory: question.subCategory || null
  };
};

export default function StudentResponseDetail({ responses, className = '' }: StudentResponseDetailProps) {
  if (responses.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>아직 설문 응답이 없습니다</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {responses.map((response, index) => (
        <Card key={response.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary" />
                설문 응답 #{responses.length - index}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={
                    response.surveyType === 'daily' ? 'default' :
                    response.surveyType === 'weekly' ? 'secondary' : 
                    'outline'
                  }
                >
                  {response.surveyType === 'daily' && '일일 체크'}
                  {response.surveyType === 'weekly' && '주간 설문'}
                  {response.surveyType === 'monthly' && '월간 종합'}
                  {response.surveyType === 'custom' && '맞춤 설문'}
                  {response.surveyType === 'template' && '템플릿'}
                  {response.surveyType === 'ai-generated' && 'AI 생성'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {format(response.submittedAt, 'M월 d일 HH:mm', { locale: ko })}
                </span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {/* 응답 개요 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-muted-foreground">
                  총 응답 수: <span className="font-medium text-foreground">{response.responses.length}개</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  학년: <span className="font-medium text-foreground">{response.grade}학년</span>
                </div>
              </div>

              {/* SEL 영역별 응답 */}
              <div className="space-y-4">
                {response.responses.map((resp, respIndex) => {
                  const domainConfig = SEL_DOMAIN_CONFIG[resp.domain as keyof typeof SEL_DOMAIN_CONFIG];
                  const interpretation = interpretResponse(resp.answer, resp.domain);
                  const IconComponent = domainConfig.icon;
                  
                  // 🔥 핵심 개선: 질문 세부 정보 가져오기
                  const questionDetails = getQuestionDetails(resp.questionId, response.grade);
                  
                  return (
                    <div 
                      key={respIndex}
                      className={`p-4 rounded-lg border ${domainConfig.bgColor} ${domainConfig.borderColor}`}
                    >
                      {/* 질문 제목과 SEL 영역 */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-2 flex-1">
                          <IconComponent className={`w-5 h-5 mt-0.5 ${domainConfig.color}`} />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`font-medium text-sm ${domainConfig.color}`}>
                                {domainConfig.name}
                              </span>
                              {questionDetails.subCategory && (
                                <Badge variant="outline" className="text-xs">
                                  {questionDetails.subCategory}
                                </Badge>
                              )}
                            </div>
                            {/* 🔥 핵심: 실제 질문 내용 표시 */}
                            <div className="text-sm text-gray-700 font-medium mb-2 bg-white/70 p-2 rounded border">
                              <span className="text-xs text-gray-500 uppercase tracking-wide">질문</span>
                              <div className="mt-1">{questionDetails.question}</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-2">
                          <span className="text-lg">{interpretation.emoji}</span>
                          <Badge 
                            variant={
                              interpretation.level === 'positive' ? 'default' :
                              interpretation.level === 'negative' ? 'destructive' :
                              'secondary'
                            }
                            className="text-xs"
                          >
                            {interpretation.description}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* 응답 내용 */}
                      <div className="mt-3">
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">학생 응답</div>
                        <div className="bg-white p-3 rounded border border-gray-300 shadow-sm">
                          <span className="text-sm font-medium text-gray-900">
                            {formatAnswer(resp.answer)}
                          </span>
                          
                          {/* 척도형 응답일 경우 상세 정보 표시 */}
                          {typeof resp.answer === 'number' && questionDetails.scaleLabels && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                <span>1점: {questionDetails.scaleLabels.min}</span>
                                <span>5점: {questionDetails.scaleLabels.max}</span>
                              </div>
                              <Progress 
                                value={(resp.answer / 5) * 100} 
                                className="h-3"
                              />
                              <div className="text-center mt-1">
                                <span className="text-xs font-medium text-gray-600">
                                  {resp.answer}/5점
                                </span>
                              </div>
                            </div>
                          )}

                          {/* 선택형 응답일 경우 선택지 정보 표시 */}
                          {(questionDetails.type === 'multipleChoice' || questionDetails.type === 'emotion') && questionDetails.options && (
                            <div className="mt-3 pt-2 border-t border-gray-100">
                              <div className="text-xs text-gray-500 mb-2">선택 가능했던 옵션들:</div>
                              <div className="flex flex-wrap gap-1">
                                {questionDetails.options.map((option, optionIndex) => (
                                  <Badge 
                                    key={optionIndex}
                                    variant={formatAnswer(resp.answer) === option ? "default" : "outline"}
                                    className="text-xs"
                                  >
                                    {option}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* 구분선 (마지막이 아닌 경우) */}
              {index < responses.length - 1 && (
                <Separator className="my-4" />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}