// 강화된 학생 설문 응답 상세 표시 컴포넌트 - 3단계 fallback 매칭 시스템
'use client';

import { SurveyResponse, SELDomain } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { selTemplates, selDomainDescriptions } from '@/data/selTemplates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  Heart, 
  Users, 
  Brain, 
  Target, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Search,
  Info
} from 'lucide-react';

interface StudentResponseDetailEnhancedProps {
  responses: SurveyResponse[];
  className?: string;
}

// SEL 영역별 아이콘과 색상 매핑 (기존과 동일)
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

// 🔥 핵심 개선: 3단계 Fallback 질문 매칭 시스템
interface QuestionMatchResult {
  question: string;
  type: 'scale' | 'multipleChoice' | 'text' | 'emotion';
  options?: string[];
  scaleLabels?: { min: string; max: string };
  subCategory?: string;
  matchStatus: 'exact' | 'grade-fallback' | 'cross-fallback' | 'not-found';
  sourceTemplate: string;
  confidence: number; // 0-100%
}

const findQuestionWithFallback = (questionId: string, responseGrade: number): QuestionMatchResult => {
  console.log(`🔍 질문 매칭 시작: ID=${questionId}, 학년=${responseGrade}`);
  
  // 1단계: 정확한 학년 템플릿에서 매칭 시도
  const primaryTemplate = responseGrade <= 4 ? selTemplates[0] : selTemplates[1];
  let question = primaryTemplate.questions.find(q => q.id === questionId);
  
  if (question) {
    console.log(`✅ 1단계 매칭 성공: ${primaryTemplate.title}`);
    return {
      question: question.question,
      type: question.type,
      options: question.options,
      scaleLabels: question.scaleLabels,
      subCategory: question.subCategory,
      matchStatus: 'exact',
      sourceTemplate: primaryTemplate.title,
      confidence: 100
    };
  }

  // 2단계: 다른 학년 템플릿에서 매칭 시도
  const secondaryTemplate = responseGrade <= 4 ? selTemplates[1] : selTemplates[0];
  question = secondaryTemplate.questions.find(q => q.id === questionId);
  
  if (question) {
    console.log(`⚠️ 2단계 매칭 성공: ${secondaryTemplate.title} (크로스 매칭)`);
    return {
      question: question.question,
      type: question.type,
      options: question.options,
      scaleLabels: question.scaleLabels,
      subCategory: question.subCategory,
      matchStatus: 'cross-fallback',
      sourceTemplate: secondaryTemplate.title,
      confidence: 75
    };
  }

  // 3단계: 모든 템플릿에서 부분 매칭 시도 (ID 유사성 검사)
  for (const template of selTemplates) {
    const similarQuestion = template.questions.find(q => 
      q.id.startsWith(questionId.substring(0, 2)) || // 같은 영역 (sa, sm, soa, rs, rdm)
      q.id.includes(questionId.substring(0, 3))      // 더 세밀한 매칭
    );
    
    if (similarQuestion) {
      console.log(`⚠️ 3단계 매칭 성공: ${template.title} (유사 ID: ${similarQuestion.id})`);
      return {
        question: `${similarQuestion.question} (유사 질문으로 매칭됨)`,
        type: similarQuestion.type,
        options: similarQuestion.options,
        scaleLabels: similarQuestion.scaleLabels,
        subCategory: similarQuestion.subCategory,
        matchStatus: 'grade-fallback',
        sourceTemplate: template.title,
        confidence: 50
      };
    }
  }

  // 4단계: 매칭 실패 - 최소한의 정보 제공
  console.log(`❌ 매칭 실패: ${questionId}`);
  return {
    question: `질문 ID: ${questionId} (질문 내용을 찾을 수 없습니다)`,
    type: 'scale',
    matchStatus: 'not-found',
    sourceTemplate: '매칭 실패',
    confidence: 0
  };
};

// 매칭 상태에 따른 아이콘 및 색상
const getMatchStatusDisplay = (matchResult: QuestionMatchResult) => {
  switch (matchResult.matchStatus) {
    case 'exact':
      return {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        description: '정확 매칭',
        detail: '해당 학년 템플릿에서 발견'
      };
    case 'cross-fallback':
      return {
        icon: AlertTriangle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        description: '크로스 매칭',
        detail: '다른 학년 템플릿에서 발견'
      };
    case 'grade-fallback':
      return {
        icon: Search,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        description: '유사 매칭',
        detail: '유사한 질문으로 매칭됨'
      };
    case 'not-found':
      return {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        description: '매칭 실패',
        detail: '질문을 찾을 수 없음'
      };
  }
};

// 응답값을 해석하는 함수 (기존과 동일)
const interpretResponse = (answer: string | number | string[], domain: SELDomain) => {
  if (typeof answer === 'number') {
    if (answer >= 4) return { level: 'positive', emoji: '😊', description: '긍정적' };
    if (answer >= 3) return { level: 'neutral', emoji: '😐', description: '보통' };
    return { level: 'negative', emoji: '😟', description: '관심 필요' };
  }
  
  if (typeof answer === 'string') {
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

// 응답값을 표시 가능한 형태로 변환 (기존과 동일)
const formatAnswer = (answer: string | number | string[]) => {
  if (Array.isArray(answer)) {
    return answer.join(', ');
  }
  return String(answer);
};

export default function StudentResponseDetailEnhanced({ responses, className = '' }: StudentResponseDetailEnhancedProps) {
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

  // 📊 전체 응답의 매칭 통계 계산
  const totalQuestions = responses.reduce((acc, response) => acc + response.responses.length, 0);
  const matchingStats = responses.reduce((stats, response) => {
    response.responses.forEach(resp => {
      const matchResult = findQuestionWithFallback(resp.questionId, response.grade);
      stats[matchResult.matchStatus] = (stats[matchResult.matchStatus] || 0) + 1;
    });
    return stats;
  }, {} as Record<string, number>);

  const matchingRate = totalQuestions > 0 ? 
    ((matchingStats.exact || 0) + (matchingStats['cross-fallback'] || 0)) / totalQuestions * 100 : 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 📊 매칭 품질 요약 대시보드 */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <strong>질문 매칭 분석:</strong> 총 {totalQuestions}개 질문 중 {matchingRate.toFixed(1)}% 매칭 성공
            </div>
            <div className="flex space-x-2 text-xs">
              <span className="text-green-600">정확: {matchingStats.exact || 0}개</span>
              <span className="text-orange-600">크로스: {matchingStats['cross-fallback'] || 0}개</span>
              <span className="text-blue-600">유사: {matchingStats['grade-fallback'] || 0}개</span>
              <span className="text-red-600">실패: {matchingStats['not-found'] || 0}개</span>
            </div>
          </div>
        </AlertDescription>
      </Alert>

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
                  
                  // 🔥 핵심 개선: 강화된 질문 매칭
                  const matchResult = findQuestionWithFallback(resp.questionId, response.grade);
                  const matchDisplay = getMatchStatusDisplay(matchResult);
                  const MatchIcon = matchDisplay.icon;
                  
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
                              {matchResult.subCategory && (
                                <Badge variant="outline" className="text-xs">
                                  {matchResult.subCategory}
                                </Badge>
                              )}
                            </div>
                            
                            {/* 🔥 핵심: 매칭 상태 표시 */}
                            <div className="flex items-center space-x-2 mb-2">
                              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${matchDisplay.bgColor}`}>
                                <MatchIcon className={`w-3 h-3 ${matchDisplay.color}`} />
                                <span className={matchDisplay.color}>{matchDisplay.description}</span>
                                <span className="text-gray-600">({matchResult.confidence}%)</span>
                              </div>
                              {matchResult.sourceTemplate !== '매칭 실패' && (
                                <span className="text-xs text-gray-500">
                                  출처: {matchResult.sourceTemplate}
                                </span>
                              )}
                            </div>
                            
                            {/* 🔥 핵심: 강화된 질문 내용 표시 */}
                            <div className={`text-sm text-gray-700 font-medium mb-2 bg-white/70 p-3 rounded border ${
                              matchResult.matchStatus === 'not-found' ? 'border-red-200 bg-red-50' : 
                              matchResult.matchStatus === 'exact' ? 'border-green-200' :
                              'border-orange-200'
                            }`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-500 uppercase tracking-wide">질문</span>
                                <Badge 
                                  variant={
                                    matchResult.matchStatus === 'exact' ? 'default' :
                                    matchResult.matchStatus === 'not-found' ? 'destructive' :
                                    'secondary'
                                  }
                                  className="text-xs"
                                >
                                  ID: {resp.questionId}
                                </Badge>
                              </div>
                              <div className="mt-1">{matchResult.question}</div>
                              {matchResult.matchStatus !== 'exact' && (
                                <div className="mt-2 text-xs text-gray-500 italic">
                                  💡 {matchDisplay.detail}
                                </div>
                              )}
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
                          {typeof resp.answer === 'number' && matchResult.scaleLabels && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                <span>1점: {matchResult.scaleLabels.min}</span>
                                <span>5점: {matchResult.scaleLabels.max}</span>
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
                          {(matchResult.type === 'multipleChoice' || matchResult.type === 'emotion') && matchResult.options && (
                            <div className="mt-3 pt-2 border-t border-gray-100">
                              <div className="text-xs text-gray-500 mb-2">선택 가능했던 옵션들:</div>
                              <div className="flex flex-wrap gap-1">
                                {matchResult.options.map((option, optionIndex) => (
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