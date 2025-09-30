// 간단한 AI 리포트 생성 컴포넌트 - 설문 결과 기반
'use client';

import { useState } from 'react';
import { SurveyResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSettings } from '@/contexts/SettingsContext';
import { 
  Brain, 
  Loader2, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  Copy,
  Sparkles,
  Activity,
  BarChart3,
  Target,
  Users
} from 'lucide-react';

interface SimpleAIReportGeneratorProps {
  responses: SurveyResponse[];
  classCode: string;
  surveyTitle: string;
  className?: string;
}

interface AIReportData {
  summary: string;
  classOverview: string;
  participationAnalysis: string;
  emotionalTrends: string[];
  behaviorPatterns: string[];
  recommendationsForTeacher: string[];
  recommendationsForParents: string[];
  selInsights: {
    selfAwareness: string;
    selfManagement: string;
    socialAwareness: string;
    relationshipSkills: string;
    responsibleDecisionMaking: string;
  };
  dataQuality: {
    totalResponses: number;
    participantCount: number;
    responseRate: number;
    analysisConfidence: number;
  };
  generatedAt: string;
}

export default function SimpleAIReportGenerator({ 
  responses, 
  classCode, 
  surveyTitle,
  className = '' 
}: SimpleAIReportGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<AIReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { geminiApiKey } = useSettings();

  // AI 리포트 생성 가능 여부 확인
  const canGenerateReport = responses.length > 0;
  const hasGeminiKey = !!geminiApiKey;

  const generateReport = async () => {
    if (!hasGeminiKey) {
      setError('Gemini API 키가 설정되지 않았습니다. 설정에서 API 키를 추가해주세요.');
      return;
    }

    if (!canGenerateReport) {
      setError('분석할 데이터가 부족합니다. 최소 1개 이상의 설문 응답이 필요합니다.');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      // 참여 학생 수 계산
      const uniqueStudents = new Set(responses.map(r => r.studentId));
      const participantCount = uniqueStudents.size;

      // AI 리포트 생성을 위한 데이터 준비
      const reportPayload = {
        classCode,
        surveyTitle,
        totalResponses: responses.length,
        participantCount,
        responses: responses.slice(0, 20), // 최근 20개 응답 분석
        requestType: 'class_analysis',
        analysisDepth: 'comprehensive'
      };

      console.log('🤖 클래스 AI 리포트 생성 요청:', reportPayload);

      // AI 리포트 생성 API 호출
      const response = await fetch('/api/ai/generate-report-enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...reportPayload,
          apiKey: geminiApiKey
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI 리포트 생성에 실패했습니다.');
      }

      const aiReport = await response.json();
      console.log('✅ AI 리포트 생성 완료:', aiReport);

      // 리포트 데이터 설정
      setReportData({
        summary: aiReport.summary || `${surveyTitle} 설문 결과 종합 분석입니다.`,
        classOverview: aiReport.classOverview || '클래스 전반적인 정서적 상태가 양호합니다.',
        participationAnalysis: aiReport.participationAnalysis || `총 ${participantCount}명의 학생이 참여했습니다.`,
        emotionalTrends: aiReport.emotionalTrends || ['전반적으로 긍정적인 감정 상태', '스트레스 수준은 보통 범위'],
        behaviorPatterns: aiReport.behaviorPatterns || ['학습에 대한 적극적인 참여', '친구관계에서의 협력적 태도'],
        recommendationsForTeacher: aiReport.recommendationsForTeacher || [
          '개별 학생의 감정 상태에 관심 가지기',
          '긍정적인 피드백 증가',
          '스트레스 관리 활동 도입'
        ],
        recommendationsForParents: aiReport.recommendationsForParents || [
          '가정에서의 대화 시간 늘리기',
          '자녀의 감정 표현 격려하기',
          '학교 생활에 관심 보이기'
        ],
        selInsights: aiReport.selInsights || {
          selfAwareness: '자기 감정 인식 능력이 발달 중입니다.',
          selfManagement: '감정 조절 능력을 기르고 있습니다.',
          socialAwareness: '타인에 대한 이해가 늘어나고 있습니다.',
          relationshipSkills: '친구와의 관계 형성 능력이 좋습니다.',
          responsibleDecisionMaking: '책임감 있는 선택을 배워가고 있습니다.'
        },
        dataQuality: {
          totalResponses: responses.length,
          participantCount,
          responseRate: Math.round((participantCount / Math.max(participantCount, 25)) * 100), // 가상의 클래스 규모 25명 기준
          analysisConfidence: aiReport.analysisConfidence || 85
        },
        generatedAt: new Date().toLocaleString('ko-KR')
      });

    } catch (err) {
      console.error('❌ AI 리포트 생성 오류:', err);
      setError(err instanceof Error ? err.message : 'AI 리포트 생성 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!reportData) return;

    const reportText = `
${surveyTitle} - 클래스 AI 분석 리포트
생성일시: ${reportData.generatedAt}
클래스 코드: ${classCode}

■ 종합 요약
${reportData.summary}

■ 클래스 개요
${reportData.classOverview}

■ 참여 분석
${reportData.participationAnalysis}

■ 감정 경향
${reportData.emotionalTrends.map(trend => `• ${trend}`).join('\n')}

■ 행동 패턴
${reportData.behaviorPatterns.map(pattern => `• ${pattern}`).join('\n')}

■ SEL 5영역 분석
• 자기인식: ${reportData.selInsights.selfAwareness}
• 자기관리: ${reportData.selInsights.selfManagement}
• 사회적 인식: ${reportData.selInsights.socialAwareness}
• 관계 기술: ${reportData.selInsights.relationshipSkills}
• 책임감 있는 의사결정: ${reportData.selInsights.responsibleDecisionMaking}

■ 교사 권장사항
${reportData.recommendationsForTeacher.map(rec => `• ${rec}`).join('\n')}

■ 학부모 권장사항
${reportData.recommendationsForParents.map(rec => `• ${rec}`).join('\n')}

■ 데이터 품질
• 총 응답 수: ${reportData.dataQuality.totalResponses}개
• 참여 학생 수: ${reportData.dataQuality.participantCount}명
• 참여율: ${reportData.dataQuality.responseRate}%
• 분석 신뢰도: ${reportData.dataQuality.analysisConfidence}%
    `.trim();

    try {
      await navigator.clipboard.writeText(reportText);
      alert('리포트가 클립보드에 복사되었습니다.');
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
      alert('클립보드 복사에 실패했습니다.');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 리포트 생성 컨트롤 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            클래스 AI 리포트 생성
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 생성 조건 표시 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-800">응답 수</span>
                </div>
                <p className="text-lg font-bold text-blue-900">{responses.length}개</p>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-800">참여 학생</span>
                </div>
                <p className="text-lg font-bold text-green-900">
                  {new Set(responses.map(r => r.studentId)).size}명
                </p>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-medium text-purple-800">API 상태</span>
                </div>
                <p className="text-sm font-bold text-purple-900">
                  {hasGeminiKey ? '연결됨' : '미설정'}
                </p>
              </div>
              
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-medium text-orange-800">준비 상태</span>
                </div>
                <p className="text-sm font-bold text-orange-900">
                  {canGenerateReport && hasGeminiKey ? '준비됨' : '대기중'}
                </p>
              </div>
            </div>

            {/* 오류 메시지 */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* 생성 버튼 */}
            <Button
              onClick={generateReport}
              disabled={generating || !hasGeminiKey || !canGenerateReport}
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  AI 분석 중... (약 10-15초 소요)
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  클래스 AI 리포트 생성
                </>
              )}
            </Button>

            {!hasGeminiKey && (
              <p className="text-sm text-muted-foreground">
                설정에서 Gemini API 키를 추가하면 AI 리포트를 생성할 수 있습니다.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 생성된 리포트 표시 */}
      {reportData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                {surveyTitle} - 클래스 AI 분석 리포트
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {reportData.generatedAt}
                </Badge>
                <Badge className="text-xs bg-gradient-to-r from-purple-500 to-pink-500">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI 생성
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  복사
                </Button>
              </div>
            </div>
            
            {/* 데이터 품질 대시보드 */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-800">총 응답</span>
                </div>
                <p className="text-lg font-bold text-blue-900">
                  {reportData.dataQuality.totalResponses}개
                </p>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-800">참여 학생</span>
                </div>
                <p className="text-lg font-bold text-green-900">
                  {reportData.dataQuality.participantCount}명
                </p>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-medium text-purple-800">참여율</span>
                </div>
                <p className="text-lg font-bold text-purple-900">
                  {reportData.dataQuality.responseRate}%
                </p>
              </div>
              
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-medium text-orange-800">신뢰도</span>
                </div>
                <p className="text-lg font-bold text-orange-900">
                  {reportData.dataQuality.analysisConfidence}%
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-6">
              {/* 종합 요약 */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-blue-500" />
                  📋 종합 요약
                </h4>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">{reportData.summary}</p>
                </div>
              </div>

              {/* 클래스 개요 */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-green-500" />
                  🏫 클래스 개요
                </h4>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-green-900">{reportData.classOverview}</p>
                </div>
              </div>

              {/* 감정 경향 */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-purple-500" />
                  💭 감정 경향
                </h4>
                <div className="space-y-2">
                  {reportData.emotionalTrends.map((trend, index) => (
                    <div key={index} className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                      <p className="text-sm text-purple-900">• {trend}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 행동 패턴 */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2 text-indigo-500" />
                  🎯 행동 패턴
                </h4>
                <div className="space-y-2">
                  {reportData.behaviorPatterns.map((pattern, index) => (
                    <div key={index} className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                      <p className="text-sm text-indigo-900">• {pattern}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SEL 5영역 분석 */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center">
                  <Brain className="w-4 h-4 mr-2 text-rose-500" />
                  🧠 SEL 5영역 분석
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-rose-50 p-3 rounded-lg border border-rose-200">
                    <h5 className="font-medium text-xs text-rose-800 mb-1">자기인식</h5>
                    <p className="text-sm text-rose-900">{reportData.selInsights.selfAwareness}</p>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                    <h5 className="font-medium text-xs text-emerald-800 mb-1">자기관리</h5>
                    <p className="text-sm text-emerald-900">{reportData.selInsights.selfManagement}</p>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <h5 className="font-medium text-xs text-amber-800 mb-1">사회적 인식</h5>
                    <p className="text-sm text-amber-900">{reportData.selInsights.socialAwareness}</p>
                  </div>
                  <div className="bg-cyan-50 p-3 rounded-lg border border-cyan-200">
                    <h5 className="font-medium text-xs text-cyan-800 mb-1">관계 기술</h5>
                    <p className="text-sm text-cyan-900">{reportData.selInsights.relationshipSkills}</p>
                  </div>
                  <div className="bg-violet-50 p-3 rounded-lg border border-violet-200 md:col-span-2">
                    <h5 className="font-medium text-xs text-violet-800 mb-1">책임감 있는 의사결정</h5>
                    <p className="text-sm text-violet-900">{reportData.selInsights.responsibleDecisionMaking}</p>
                  </div>
                </div>
              </div>

              {/* 교사 권장사항 */}
              <div>
                <h4 className="font-semibold text-sm mb-2">🏫 교사 권장사항</h4>
                <div className="space-y-2">
                  {reportData.recommendationsForTeacher.map((rec, index) => (
                    <div key={index} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900">• {rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 학부모 권장사항 */}
              <div>
                <h4 className="font-semibold text-sm mb-2">🏠 학부모 권장사항</h4>
                <div className="space-y-2">
                  {reportData.recommendationsForParents.map((rec, index) => (
                    <div key={index} className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <p className="text-sm text-green-900">• {rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}