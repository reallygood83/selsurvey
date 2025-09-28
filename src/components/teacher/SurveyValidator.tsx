'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  ShieldCheck,
  TrendingUp,
  Lightbulb,
  AlertCircle,
  Star,
  Target
} from 'lucide-react';

interface ValidationResult {
  overallScore: number;
  validationResults: {
    [key: string]: {
      score: number;
      status: 'good' | 'warning' | 'poor';
      feedback: string;
      suggestions: string[];
    };
  };
  strengths: string[];
  improvements: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    issue: string;
    solution: string;
    exampleQuestion?: string;
  }>;
  recommendedActions: string[];
  metadata?: {
    surveyId: string;
    validatedAt: string;
    domainDistribution: { [key: string]: number };
    typeDistribution: { [key: string]: number };
    questionCount: number;
    estimatedTime: number;
  };
}

interface SurveyValidatorProps {
  survey: any;
  apiKey: string;
  onValidationComplete?: (result: ValidationResult) => void;
}

export default function SurveyValidator({ survey, apiKey, onValidationComplete }: SurveyValidatorProps) {
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string>('');

  // 검증 카테고리 한국어 매핑
  const categoryNames: { [key: string]: string } = {
    selBalance: 'SEL 영역 균형성',
    ageAppropriate: '연령 적합성',
    questionQuality: '질문 품질',
    measurementValidity: '측정 타당성',
    responseEase: '응답 용이성',
    surveyStructure: '설문 구조',
    timeEstimate: '소요시간 적절성',
    reportUtility: '리포트 활용성'
  };

  // 상태별 아이콘 및 색상
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'poor':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'poor':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">높음</Badge>;
      case 'medium':
        return <Badge variant="secondary">보통</Badge>;
      case 'low':
        return <Badge variant="outline">낮음</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  // 설문 검증 실행
  const validateSurvey = async () => {
    if (!survey || !apiKey.trim()) {
      setError('설문 데이터와 API 키가 필요합니다.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ai/validate-survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          survey: survey,
          apiKey: apiKey,
          validationType: 'comprehensive'
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '설문 검증에 실패했습니다.');
      }

      setValidationResult(data.validation);
      onValidationComplete?.(data.validation);
      
    } catch (error: any) {
      console.error('설문 검증 오류:', error);
      setError(error.message || '설문 검증 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <ShieldCheck className="h-16 w-16 text-blue-500 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">설문 품질 검증 중...</h3>
              <p className="text-muted-foreground mb-4">
                AI가 SEL 설문의 품질을 종합적으로 분석하고 있습니다.
              </p>
              <div className="flex items-center justify-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  8개 항목 검증 중...
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>검증 오류:</strong> {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={validateSurvey}
            className="ml-2"
          >
            다시 시도
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!validationResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5" />
            <span>AI 설문 품질 검증</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            설문의 품질을 AI가 8개 항목으로 종합 분석하여 개선점을 제안합니다
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">설문 검증 준비</h3>
            <p className="text-muted-foreground mb-4">
              '{survey?.title || '설문'}'의 품질을 검증하시겠습니까?
            </p>
            <Button onClick={validateSurvey}>
              <ShieldCheck className="h-4 w-4 mr-2" />
              검증 시작하기
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 전체 점수 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5" />
              <span>설문 품질 검증 결과</span>
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(validationResult.overallScore)}`}>
              {validationResult.overallScore}점
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={validationResult.overallScore} className="h-3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {validationResult.metadata?.questionCount || 0}
                </div>
                <div className="text-sm text-muted-foreground">총 질문 수</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {validationResult.metadata?.estimatedTime || 0}분
                </div>
                <div className="text-sm text-muted-foreground">예상 소요시간</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {Object.keys(validationResult.metadata?.domainDistribution || {}).length}
                </div>
                <div className="text-sm text-muted-foreground">SEL 영역</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {Object.keys(validationResult.metadata?.typeDistribution || {}).length}
                </div>
                <div className="text-sm text-muted-foreground">질문 유형</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 세부 검증 결과 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>세부 검증 항목</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(validationResult.validationResults).map(([key, result]) => (
              <div key={key} className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{categoryNames[key] || key}</span>
                  </div>
                  <span className={`text-lg font-bold ${getScoreColor(result.score)}`}>
                    {result.score}
                  </span>
                </div>
                <p className="text-sm mb-3">{result.feedback}</p>
                {result.suggestions.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium opacity-75">개선 제안:</div>
                    {result.suggestions.map((suggestion, index) => (
                      <div key={index} className="text-xs opacity-75">
                        • {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 강점과 개선점 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 강점 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span>잘 설계된 부분</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validationResult.strengths.map((strength, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{strength}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 개선점 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span>개선 제안</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {validationResult.improvements.map((improvement, index) => (
                <div key={index} className="border-l-4 border-blue-200 pl-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{improvement.issue}</span>
                    {getPriorityBadge(improvement.priority)}
                  </div>
                  <p className="text-sm text-muted-foreground">{improvement.solution}</p>
                  {improvement.exampleQuestion && (
                    <div className="bg-blue-50 p-2 rounded text-xs">
                      <strong>예시:</strong> {improvement.exampleQuestion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 권장 조치사항 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-orange-500" />
            <span>권장 조치사항</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {validationResult.recommendedActions.map((action, index) => (
              <div key={index} className="flex items-start space-x-2">
                <Lightbulb className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{action}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 재검증 버튼 */}
      <div className="text-center">
        <Button variant="outline" onClick={validateSurvey}>
          <ShieldCheck className="h-4 w-4 mr-2" />
          다시 검증하기
        </Button>
      </div>
    </div>
  );
}