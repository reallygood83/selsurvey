// SEL 데이터 디버깅 및 검증 컴포넌트
'use client';

import { useState, useEffect } from 'react';
import { SurveyResponse, StudentProfile, SELAnalysis } from '@/types';
import { selTemplates } from '@/data/selTemplates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bug, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Database,
  Search,
  BarChart3
} from 'lucide-react';

interface SELDataDebuggerProps {
  student: StudentProfile;
  responses: SurveyResponse[];
  analyses: SELAnalysis[];
  className?: string;
}

interface QuestionMatchResult {
  questionId: string;
  found: boolean;
  questionText?: string;
  source?: string;
  domain?: string;
  type?: string;
}

interface DataValidationResult {
  totalResponses: number;
  matchedQuestions: number;
  unmatchedQuestions: number;
  matchRate: number;
  questionMatches: QuestionMatchResult[];
  domainDistribution: Record<string, number>;
  responseTypeDistribution: Record<string, number>;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export default function SELDataDebugger({
  student,
  responses,
  analyses,
  className = ''
}: SELDataDebuggerProps) {
  const [validationResult, setValidationResult] = useState<DataValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // 질문 매칭 검증 함수
  const validateQuestionMatching = () => {
    setIsValidating(true);
    
    console.log('🔍 SEL 데이터 검증 시작:', {
      studentName: student.name,
      grade: student.grade,
      responsesCount: responses.length,
      analysesCount: analyses.length
    });

    // 모든 응답에서 질문 ID 추출
    const allQuestionIds: string[] = [];
    const questionMatches: QuestionMatchResult[] = [];
    const domainDistribution: Record<string, number> = {};
    const responseTypeDistribution: Record<string, number> = {};

    responses.forEach(response => {
      response.responses.forEach(resp => {
        allQuestionIds.push(resp.questionId);
        
        // 도메인 분포 계산
        domainDistribution[resp.domain] = (domainDistribution[resp.domain] || 0) + 1;
        
        // 응답 타입 분포 계산
        const answerType = typeof resp.answer;
        responseTypeDistribution[answerType] = (responseTypeDistribution[answerType] || 0) + 1;
      });
    });

    // 각 질문 ID에 대해 매칭 검증
    const uniqueQuestionIds = [...new Set(allQuestionIds)];
    
    uniqueQuestionIds.forEach(questionId => {
      const matchResult = findQuestionInTemplates(questionId, student.grade);
      questionMatches.push(matchResult);
    });

    // 통계 계산
    const totalResponses = allQuestionIds.length;
    const matchedQuestions = questionMatches.filter(match => match.found).length;
    const unmatchedQuestions = questionMatches.filter(match => !match.found).length;
    const matchRate = totalResponses > 0 ? (matchedQuestions / uniqueQuestionIds.length) : 0;

    // 데이터 품질 평가
    let dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
    if (matchRate >= 0.9) dataQuality = 'excellent';
    else if (matchRate >= 0.7) dataQuality = 'good';
    else if (matchRate >= 0.5) dataQuality = 'fair';
    else dataQuality = 'poor';

    const result: DataValidationResult = {
      totalResponses,
      matchedQuestions: matchedQuestions * (totalResponses / uniqueQuestionIds.length),
      unmatchedQuestions: unmatchedQuestions * (totalResponses / uniqueQuestionIds.length),
      matchRate,
      questionMatches,
      domainDistribution,
      responseTypeDistribution,
      dataQuality
    };

    console.log('📊 SEL 데이터 검증 완료:', result);
    setValidationResult(result);
    setIsValidating(false);
  };

  // 질문 템플릿에서 찾기
  const findQuestionInTemplates = (questionId: string, grade: number): QuestionMatchResult => {
    // 1차: 해당 학년 템플릿
    const primaryTemplate = grade <= 4 ? selTemplates[0] : selTemplates[1];
    let question = primaryTemplate.questions.find(q => q.id === questionId);
    
    if (question) {
      return {
        questionId,
        found: true,
        questionText: question.question,
        source: `${grade <= 4 ? '3-4' : '5-6'}학년 템플릿`,
        domain: question.selDomain,
        type: question.type
      };
    }

    // 2차: 다른 학년 템플릿
    const fallbackTemplate = grade <= 4 ? selTemplates[1] : selTemplates[0];
    question = fallbackTemplate.questions.find(q => q.id === questionId);
    
    if (question) {
      return {
        questionId,
        found: true,
        questionText: question.question,
        source: `${grade <= 4 ? '5-6' : '3-4'}학년 템플릿 (fallback)`,
        domain: question.selDomain,
        type: question.type
      };
    }

    // 3차: 전체 검색
    for (const template of selTemplates) {
      question = template.questions.find(q => q.id === questionId);
      if (question) {
        return {
          questionId,
          found: true,
          questionText: question.question,
          source: '전체 템플릿 검색',
          domain: question.selDomain,
          type: question.type
        };
      }
    }

    return {
      questionId,
      found: false
    };
  };

  // 컴포넌트 마운트 시 자동 검증
  useEffect(() => {
    if (responses.length > 0) {
      validateQuestionMatching();
    }
  }, [responses]);

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'excellent': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'good': return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'fair': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'poor': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bug className="w-5 h-5 mr-2" />
            SEL 데이터 검증 및 디버깅
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {student.name} 학생 ({student.grade}학년) • 
                응답 {responses.length}개 • 분석 {analyses.length}개
              </div>
              <Button
                onClick={validateQuestionMatching}
                disabled={isValidating || responses.length === 0}
                size="sm"
              >
                {isValidating ? '검증 중...' : '다시 검증'}
              </Button>
            </div>

            {validationResult && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">개요</TabsTrigger>
                  <TabsTrigger value="questions">질문 매칭</TabsTrigger>
                  <TabsTrigger value="distribution">분포 분석</TabsTrigger>
                  <TabsTrigger value="recommendations">권장사항</TabsTrigger>
                </TabsList>

                {/* 개요 탭 */}
                <TabsContent value="overview" className="space-y-4">
                  <div className={`p-4 rounded-lg border ${getQualityColor(validationResult.dataQuality)}`}>
                    <div className="flex items-center space-x-2 mb-2">
                      {getQualityIcon(validationResult.dataQuality)}
                      <span className="font-semibold">
                        데이터 품질: {validationResult.dataQuality === 'excellent' ? '매우 좋음' :
                        validationResult.dataQuality === 'good' ? '좋음' :
                        validationResult.dataQuality === 'fair' ? '보통' : '개선 필요'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">총 응답 수</div>
                        <div className="font-medium">{validationResult.totalResponses}개</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">질문 매칭률</div>
                        <div className="font-medium">{(validationResult.matchRate * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">매칭된 질문</div>
                        <div className="font-medium text-green-600">
                          {Math.round(validationResult.matchedQuestions)}개
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">매칭 실패</div>
                        <div className="font-medium text-red-600">
                          {Math.round(validationResult.unmatchedQuestions)}개
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* 질문 매칭 탭 */}
                <TabsContent value="questions" className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center">
                      <Search className="w-4 h-4 mr-2" />
                      질문 ID 매칭 결과
                    </h4>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {validationResult.questionMatches.map((match, index) => (
                        <div 
                          key={index}
                          className={`p-3 rounded border ${
                            match.found 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              {match.found ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <Badge variant="outline" className="text-xs">
                                {match.questionId}
                              </Badge>
                              {match.domain && (
                                <Badge variant="secondary" className="text-xs">
                                  {match.domain}
                                </Badge>
                              )}
                            </div>
                            {match.source && (
                              <span className="text-xs text-muted-foreground">
                                {match.source}
                              </span>
                            )}
                          </div>
                          {match.questionText && (
                            <div className="text-sm text-gray-700 mt-1">
                              {match.questionText}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* 분포 분석 탭 */}
                <TabsContent value="distribution" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* SEL 도메인 분포 */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        SEL 영역별 응답 분포
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(validationResult.domainDistribution).map(([domain, count]) => (
                          <div key={domain} className="flex items-center justify-between text-sm">
                            <span>{domain}</span>
                            <Badge variant="outline">{count}개</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 응답 타입 분포 */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center">
                        <Database className="w-4 h-4 mr-2" />
                        응답 타입 분포
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(validationResult.responseTypeDistribution).map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between text-sm">
                            <span>{type === 'number' ? '숫자형' : type === 'string' ? '문자형' : type}</span>
                            <Badge variant="outline">{count}개</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* 권장사항 탭 */}
                <TabsContent value="recommendations" className="space-y-4">
                  <div className="space-y-3">
                    {validationResult.dataQuality === 'poor' && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          질문 매칭률이 50% 미만입니다. AI 리포트 생성 시 분석 품질이 제한될 수 있습니다.
                          설문 템플릿과 질문 ID 체계를 점검해주세요.
                        </AlertDescription>
                      </Alert>
                    )}

                    {validationResult.matchRate < 1.0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          일부 질문이 템플릿에서 매칭되지 않았습니다. 
                          {Math.round(validationResult.unmatchedQuestions)}개의 응답이 분석에서 제외될 수 있습니다.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">개선 방안</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• 설문 생성 시 템플릿의 질문 ID를 정확히 사용</li>
                        <li>• 커스텀 질문 추가 시 템플릿에 등록 후 사용</li>
                        <li>• 학년별 템플릿 적용 확인</li>
                        <li>• 주기적인 데이터 검증 실시</li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {!validationResult && responses.length === 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  분석할 설문 응답이 없습니다. 학생이 설문에 참여한 후 다시 확인해주세요.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}