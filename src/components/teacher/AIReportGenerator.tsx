// AI 상담 리포트 생성 컴포넌트
'use client';

import { useState } from 'react';
import { SurveyResponse, StudentProfile, SELAnalysis } from '@/types';
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
  Download,
  Copy,
  Sparkles,
  Activity,
  Shield,
  Target
} from 'lucide-react';
import ReportShareManager from './ReportShareManager';

interface AIReportGeneratorProps {
  student: StudentProfile;
  responses: SurveyResponse[];
  analyses: SELAnalysis[];
  className?: string;
}

interface AIReportData {
  // 새로운 개인화된 응답 구조
  uniqueProfile?: string;
  strengthsFromData?: string[];
  concernsFromData?: string[];
  personalizedStrategies?: string[];
  classroomApproach?: string[];
  parentGuidance?: string[];
  specificGoals?: string[];
  evidenceQuotes?: string[];
  
  // 기존 호환성을 위한 필드들 (fallback 데이터용)
  summary?: string;
  strengths?: string[];
  concernAreas?: string[];
  recommendations?: string[];
  classroomStrategies?: string[];
  parentSuggestions?: string[];
  nextSteps?: string[];
  generatedAt: string;
  
  // DB 저장 관련 메타데이터
  savedReportId?: string;
  isPersonalized?: boolean;
  
  // 📊 Enhanced: 데이터 품질 및 매칭 정보
  dataQuality?: {
    totalResponses: number;
    questionsMatched: number;
    matchingAccuracy: number;
    analysisConfidence: number;
    matchingIssues?: string[];
  };
  
  // 📈 Enhanced: AI 분석 메타데이터
  analysisMetadata?: {
    promptVersion: string;
    tokensUsed?: number;
    processingTime?: number;
    qualityScore?: number;
  };
}

export default function AIReportGenerator({ 
  student, 
  responses, 
  analyses,
  className = '' 
}: AIReportGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<AIReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { geminiApiKey } = useSettings();

  // AI 리포트 생성 가능 여부 확인
  const canGenerateReport = responses.length > 0 || analyses.length > 0;
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
      // AI 리포트 생성을 위한 데이터 준비
      const reportPayload = {
        student: {
          name: student.name,
          grade: student.grade,
          participationRate: student.participationRate,
          totalResponses: student.totalResponses,
          joinedAt: student.joinedAt
        },
        responses: responses.slice(0, 10), // 최근 10개 응답
        analyses: analyses.slice(0, 5), // 최근 5개 분석
        period: '최근 활동 기록'
      };

      console.log('🤖 AI 리포트 생성 요청:', reportPayload);

      // 📈 Enhanced: AI 리포트 생성 API 호출 (향상된 엔드포인트 사용)
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

      // 📊 Enhanced: 개인화된 응답 구조 + 데이터 품질 정보 처리
      const reportDataToSave = {
        // 새로운 개인화된 필드들
        uniqueProfile: aiReport.uniqueProfile,
        strengthsFromData: aiReport.strengthsFromData,
        concernsFromData: aiReport.concernsFromData,
        personalizedStrategies: aiReport.personalizedStrategies,
        classroomApproach: aiReport.classroomApproach,
        parentGuidance: aiReport.parentGuidance,
        specificGoals: aiReport.specificGoals,
        evidenceQuotes: aiReport.evidenceQuotes,

        // Fallback: 기존 구조 지원 (AI가 기본 응답을 보낸 경우)
        summary: aiReport.summary || `${student.name} 학생의 종합 분석 결과입니다.`,
        strengths: aiReport.strengths || ['분석 진행 중'],
        concernAreas: aiReport.concernAreas || [],
        recommendations: aiReport.recommendations || ['지속적인 관찰과 격려'],
        classroomStrategies: aiReport.classroomStrategies || ['개별 맞춤 지원'],
        parentSuggestions: aiReport.parentSuggestions || ['가정에서의 관심과 격려'],
        nextSteps: aiReport.nextSteps || ['정기적인 상담 및 관찰'],

        // 📊 Enhanced: 데이터 품질 및 메타데이터 정보 추가
        dataQuality: aiReport.dataQuality,
        analysisMetadata: aiReport.analysisMetadata,
        savedReportId: aiReport.savedReportId,
        isPersonalized: aiReport.isPersonalized,

        generatedAt: new Date().toLocaleString('ko-KR')
      };

      // 💾 Firestore에 리포트 저장
      try {
        console.log('💾 리포트를 Firestore에 저장 중...');
        const saveResponse = await fetch('/api/ai-reports/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentId: student.id,
            teacherId: student.teacherId,
            studentName: student.name,
            grade: student.grade,
            classCode: student.classCode,
            reportData: reportDataToSave,
            analysisDataSource: {
              responsesCount: responses.length,
              analysesCount: analyses.length,
              period: '최근 활동 기록'
            }
          }),
        });

        if (saveResponse.ok) {
          const saveResult = await saveResponse.json();
          console.log('✅ 리포트 저장 완료:', saveResult.reportId);
          reportDataToSave.savedReportId = saveResult.reportId;
        } else {
          console.warn('⚠️ 리포트 저장 실패 (리포트는 화면에 표시됨)');
        }
      } catch (saveError) {
        console.error('❌ 리포트 저장 오류 (리포트는 화면에 표시됨):', saveError);
      }

      setReportData(reportDataToSave);

    } catch (err) {
      console.error('❌ AI 리포트 생성 오류:', err);
      setError(err instanceof Error ? err.message : 'AI 리포트 생성 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!reportData) return;

    // 🔥 개인화된 리포트가 있는 경우 새로운 형식 사용
    const isPersonalizedReport = reportData.uniqueProfile && reportData.strengthsFromData;
    
    const reportText = isPersonalizedReport ? 
      // 새로운 개인화된 리포트 형식
      `
${student.name} 학생 개인화 AI 상담 리포트
생성일시: ${reportData.generatedAt}

■ 학생 고유 특성 프로필
${reportData.uniqueProfile}

■ 실제 응답 기반 강점
${reportData.strengthsFromData?.map(item => `• ${item}`).join('\n') || ''}

■ 관심 영역 (응답 근거)
${reportData.concernsFromData?.length ? reportData.concernsFromData.map(item => `• ${item}`).join('\n') : '• 특별한 관심 영역 없음'}

■ 맞춤형 지원 전략
${reportData.personalizedStrategies?.map(item => `• ${item}`).join('\n') || ''}

■ 교실 내 개별 접근법
${reportData.classroomApproach?.map(item => `• ${item}`).join('\n') || ''}

■ 가정 지원 방안
${reportData.parentGuidance?.map(item => `• ${item}`).join('\n') || ''}

■ 구체적 목표 설정
${reportData.specificGoals?.map(item => `• ${item}`).join('\n') || ''}

■ 분석 근거 (학생 응답 인용)
${reportData.evidenceQuotes?.map(item => `• ${item}`).join('\n') || ''}
      `.trim()
    :
      // 기존 fallback 리포트 형식  
      `
${student.name} 학생 AI 상담 리포트
생성일시: ${reportData.generatedAt}

■ 종합 요약
${reportData.summary}

■ 주요 강점
${reportData.strengths?.map(item => `• ${item}`).join('\n') || ''}

■ 관심 필요 영역
${reportData.concernAreas?.length ? reportData.concernAreas.map(item => `• ${item}`).join('\n') : '• 특별한 관심 영역 없음'}

■ 교육적 권장사항
${reportData.recommendations?.map(item => `• ${item}`).join('\n') || ''}

■ 교실 지원 전략
${reportData.classroomStrategies?.map(item => `• ${item}`).join('\n') || ''}

■ 학부모 제안사항
${reportData.parentSuggestions?.map(item => `• ${item}`).join('\n') || ''}

■ 향후 계획
${reportData.nextSteps?.map(item => `• ${item}`).join('\n') || ''}
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
            AI 상담 리포트 생성
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 생성 조건 표시 */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                {hasGeminiKey ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm">
                  Gemini API 키 {hasGeminiKey ? '설정 완료' : '필요'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {canGenerateReport ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm">
                  분석 데이터 {canGenerateReport ? '충분' : '부족'} 
                  (응답: {responses.length}개, 분석: {analyses.length}개)
                </span>
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
                  AI 분석 중...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  AI 상담 리포트 생성
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
                {student.name} 학생 AI 상담 리포트
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {reportData.generatedAt}
                </Badge>
                {reportData.savedReportId && (
                  <Badge variant="secondary" className="text-xs">
                    💾 DB 저장됨
                  </Badge>
                )}
                {reportData.isPersonalized && (
                  <Badge className="text-xs bg-gradient-to-r from-purple-500 to-pink-500">
                    <Sparkles className="w-3 h-3 mr-1" />
                    개인화
                  </Badge>
                )}
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
            
            {/* 📊 Enhanced: 데이터 품질 대시보드 */}
            {reportData.dataQuality && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-800">응답 수</span>
                  </div>
                  <p className="text-lg font-bold text-blue-900">
                    {reportData.dataQuality.totalResponses}개
                  </p>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium text-green-800">매칭 정확도</span>
                  </div>
                  <p className="text-lg font-bold text-green-900">
                    {Math.round(reportData.dataQuality.matchingAccuracy * 100)}%
                  </p>
                </div>
                
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium text-purple-800">분석 신뢰도</span>
                  </div>
                  <p className="text-lg font-bold text-purple-900">
                    {Math.round(reportData.dataQuality.analysisConfidence * 100)}%
                  </p>
                </div>
                
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-medium text-orange-800">질문 매칭</span>
                  </div>
                  <p className="text-lg font-bold text-orange-900">
                    {reportData.dataQuality.questionsMatched}/{reportData.dataQuality.totalResponses}
                  </p>
                </div>
              </div>
            )}
            
            {/* 📊 Enhanced: 매칭 이슈 알림 */}
            {reportData.dataQuality?.matchingIssues && reportData.dataQuality.matchingIssues.length > 0 && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>데이터 품질 주의사항:</strong>
                  <ul className="mt-1 ml-4 list-disc text-sm">
                    {reportData.dataQuality.matchingIssues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardHeader>
          
          <CardContent>
            <div className="space-y-6">
              {/* 🔥 개인화된 리포트가 있는 경우 새로운 UI 표시 */}
              {reportData.uniqueProfile && reportData.strengthsFromData ? (
                <>
                  {/* 학생 고유 특성 프로필 */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-blue-500" />
                      🎯 학생 고유 특성 프로필
                    </h4>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900">{reportData.uniqueProfile}</p>
                    </div>
                  </div>

                  {/* 실제 응답 기반 강점 */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      💪 실제 응답 기반 강점
                    </h4>
                    <div className="space-y-2">
                      {reportData.strengthsFromData.map((strength, index) => (
                        <div key={index} className="bg-green-50 p-3 rounded-lg border border-green-200">
                          <p className="text-sm text-green-900">• {strength}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 관심 영역 (응답 근거) */}
                  {reportData.concernsFromData && reportData.concernsFromData.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2 text-orange-500" />
                        🔍 관심 영역 (응답 근거)
                      </h4>
                      <div className="space-y-2">
                        {reportData.concernsFromData.map((concern, index) => (
                          <div key={index} className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                            <p className="text-sm text-orange-900">• {concern}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 맞춤형 지원 전략 */}
                  {reportData.personalizedStrategies && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center">
                        <Brain className="w-4 h-4 mr-2 text-purple-500" />
                        🎯 맞춤형 지원 전략
                      </h4>
                      <div className="space-y-2">
                        {reportData.personalizedStrategies.map((strategy, index) => (
                          <div key={index} className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                            <p className="text-sm text-purple-900">• {strategy}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 교실 내 개별 접근법 */}
                  {reportData.classroomApproach && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">🏫 교실 내 개별 접근법</h4>
                      <div className="space-y-2">
                        {reportData.classroomApproach.map((approach, index) => (
                          <div key={index} className="bg-indigo-50 p-2 rounded border border-indigo-200">
                            <p className="text-sm text-indigo-900">• {approach}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 가정 지원 방안 */}
                  {reportData.parentGuidance && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">🏠 가정 지원 방안</h4>
                      <div className="space-y-2">
                        {reportData.parentGuidance.map((guidance, index) => (
                          <div key={index} className="bg-rose-50 p-2 rounded border border-rose-200">
                            <p className="text-sm text-rose-900">• {guidance}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 구체적 목표 설정 */}
                  {reportData.specificGoals && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">🎯 구체적 목표 설정</h4>
                      <div className="space-y-2">
                        {reportData.specificGoals.map((goal, index) => (
                          <div key={index} className="bg-emerald-50 p-2 rounded border border-emerald-200">
                            <p className="text-sm text-emerald-900">• {goal}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 분석 근거 (학생 응답 인용) */}
                  {reportData.evidenceQuotes && reportData.evidenceQuotes.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">📋 분석 근거 (학생 응답 인용)</h4>
                      <div className="space-y-2">
                        {reportData.evidenceQuotes.map((quote, index) => (
                          <div key={index} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <p className="text-sm text-slate-700 italic">"• {quote}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Fallback: 기존 UI 구조 (호환성 보장) */}
                  {/* 종합 요약 */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-blue-500" />
                      종합 요약
                    </h4>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900">{reportData.summary}</p>
                    </div>
                  </div>

                  {/* 주요 강점 */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      주요 강점
                    </h4>
                    <div className="space-y-2">
                      {reportData.strengths?.map((strength, index) => (
                        <div key={index} className="bg-green-50 p-2 rounded border border-green-200">
                          <p className="text-sm text-green-900">• {strength}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 관심 필요 영역 */}
                  {reportData.concernAreas && reportData.concernAreas.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2 text-orange-500" />
                        관심 필요 영역
                      </h4>
                      <div className="space-y-2">
                        {reportData.concernAreas.map((concern, index) => (
                          <div key={index} className="bg-orange-50 p-2 rounded border border-orange-200">
                            <p className="text-sm text-orange-900">• {concern}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 교육적 권장사항 */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center">
                      <Brain className="w-4 h-4 mr-2 text-purple-500" />
                      교육적 권장사항
                    </h4>
                    <div className="space-y-2">
                      {reportData.recommendations?.map((rec, index) => (
                        <div key={index} className="bg-purple-50 p-2 rounded border border-purple-200">
                          <p className="text-sm text-purple-900">• {rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 교실 지원 전략 */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">교실 지원 전략</h4>
                    <div className="space-y-2">
                      {reportData.classroomStrategies?.map((strategy, index) => (
                        <div key={index} className="bg-gray-50 p-2 rounded border">
                          <p className="text-sm">• {strategy}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 학부모 제안사항 */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">학부모 제안사항</h4>
                    <div className="space-y-2">
                      {reportData.parentSuggestions?.map((suggestion, index) => (
                        <div key={index} className="bg-gray-50 p-2 rounded border">
                          <p className="text-sm">• {suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 향후 계획 */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">향후 계획</h4>
                    <div className="space-y-2">
                      {reportData.nextSteps?.map((step, index) => (
                        <div key={index} className="bg-gray-50 p-2 rounded border">
                          <p className="text-sm">• {step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 리포트 공유 및 다운로드 기능 */}
      {reportData && (
        <ReportShareManager
          reportData={reportData}
          studentName={student.name}
          studentId={student.id}
        />
      )}
    </div>
  );
}