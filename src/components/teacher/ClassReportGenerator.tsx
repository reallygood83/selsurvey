'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSettings } from '@/contexts/SettingsContext';
import { 
  Users, 
  Loader2, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  BarChart3,
  TrendingUp,
  Lightbulb,
  Target,
  Download,
  Copy,
  Mail
} from 'lucide-react';

interface ClassReportGeneratorProps {
  classCode: string;
  surveyTitle: string;
  responses: any[];
  participantCount: number;
  className?: string;
}

interface ClassReportData {
  summary: string;
  classOverview: string;
  participationAnalysis: string;
  emotionalTrends: string[];
  behaviorPatterns: string[];
  selInsights: {
    selfAwareness: string;
    selfManagement: string;
    socialAwareness: string;
    relationshipSkills: string;
    responsibleDecisionMaking: string;
  };
  recommendationsForTeacher: string[];
  recommendationsForParents: string[];
  analysisConfidence: number;
  dataQuality?: {
    totalResponses: number;
    participantCount: number;
    responseRate: number;
    analysisConfidence: number;
  };
  generatedAt: string;
  analysisType: string;
  isEnhanced: boolean;
}

export default function ClassReportGenerator({ 
  classCode, 
  surveyTitle, 
  responses, 
  participantCount,
  className = '' 
}: ClassReportGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<ClassReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { geminiApiKey } = useSettings();

  const canGenerateReport = responses.length > 0 && participantCount > 0;
  const hasGeminiKey = !!geminiApiKey;

  const generateClassReport = async () => {
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
      console.log('🏫 클래스 리포트 생성 요청:', {
        classCode,
        surveyTitle,
        responsesCount: responses.length,
        participantCount
      });

      const response = await fetch('/api/ai/generate-report-enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestType: 'class_analysis',
          classCode,
          surveyTitle,
          responses,
          totalResponses: responses.length,
          participantCount,
          apiKey: geminiApiKey
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '클래스 리포트 생성에 실패했습니다.');
      }

      const classReport = await response.json();
      console.log('✅ 클래스 리포트 생성 완료:', classReport);

      setReportData(classReport);

    } catch (err) {
      console.error('❌ 클래스 리포트 생성 오류:', err);
      setError(err instanceof Error ? err.message : '클래스 리포트 생성 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!reportData) return;

    const reportText = `
${classCode} 클래스 SEL 종합 분석 리포트
설문: ${surveyTitle}
생성일시: ${reportData.generatedAt}
참여 학생: ${participantCount}명

■ 클래스 종합 요약
${reportData.summary}

■ 클래스 개요
${reportData.classOverview}

■ 참여 분석
${reportData.participationAnalysis}

■ 주요 감정 경향
${reportData.emotionalTrends?.map(trend => `• ${trend}`).join('\n') || ''}

■ 행동 패턴
${reportData.behaviorPatterns?.map(pattern => `• ${pattern}`).join('\n') || ''}

■ SEL 영역별 분석
▸ 자기인식: ${reportData.selInsights?.selfAwareness || ''}
▸ 자기관리: ${reportData.selInsights?.selfManagement || ''}
▸ 사회적 인식: ${reportData.selInsights?.socialAwareness || ''}
▸ 관계 기술: ${reportData.selInsights?.relationshipSkills || ''}
▸ 책임감 있는 의사결정: ${reportData.selInsights?.responsibleDecisionMaking || ''}

■ 교사를 위한 권장사항
${reportData.recommendationsForTeacher?.map(rec => `• ${rec}`).join('\n') || ''}

■ 학부모를 위한 권장사항
${reportData.recommendationsForParents?.map(rec => `• ${rec}`).join('\n') || ''}

■ 분석 신뢰도: ${reportData.analysisConfidence}%
    `.trim();

    try {
      await navigator.clipboard.writeText(reportText);
      alert('클래스 리포트가 클립보드에 복사되었습니다.');
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
      alert('클립보드 복사에 실패했습니다.');
    }
  };

  const downloadReport = () => {
    if (!reportData) return;

    const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${classCode} 클래스 SEL 종합 분석 리포트</title>
    <style>
        body {
            font-family: 'Noto Sans KR', Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .content {
            padding: 30px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
            margin-bottom: 16px;
            font-size: 20px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
        }
        .stat-label {
            font-size: 14px;
            color: #64748b;
            margin-top: 4px;
        }
        .trend-item {
            background: #ecfdf5;
            border-left: 4px solid #10b981;
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 0 8px 8px 0;
        }
        .pattern-item {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 0 8px 8px 0;
        }
        .recommendation-item {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 0 8px 8px 0;
        }
        .sel-insight {
            background: #f3f4f6;
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 8px;
            border: 1px solid #d1d5db;
        }
        .sel-insight strong {
            color: #374151;
        }
        .footer {
            background: #f9fafb;
            padding: 20px 30px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${classCode} 클래스 SEL 종합 분석 리포트</h1>
            <p>설문: ${surveyTitle}</p>
            <p>생성일: ${reportData.generatedAt}</p>
        </div>
        
        <div class="content">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${participantCount}명</div>
                    <div class="stat-label">참여 학생 수</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${responses.length}개</div>
                    <div class="stat-label">총 응답 수</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${reportData.analysisConfidence}%</div>
                    <div class="stat-label">분석 신뢰도</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${reportData.dataQuality?.responseRate || 100}%</div>
                    <div class="stat-label">응답률</div>
                </div>
            </div>

            <div class="section">
                <h2>📊 클래스 종합 요약</h2>
                <p>${reportData.summary}</p>
            </div>

            <div class="section">
                <h2>🏫 클래스 개요</h2>
                <p>${reportData.classOverview}</p>
            </div>

            <div class="section">
                <h2>📈 참여 분석</h2>
                <p>${reportData.participationAnalysis}</p>
            </div>

            <div class="section">
                <h2>💙 주요 감정 경향</h2>
                ${reportData.emotionalTrends?.map(trend => 
                    `<div class="trend-item">• ${trend}</div>`
                ).join('') || ''}
            </div>

            <div class="section">
                <h2>🎯 행동 패턴</h2>
                ${reportData.behaviorPatterns?.map(pattern => 
                    `<div class="pattern-item">• ${pattern}</div>`
                ).join('') || ''}
            </div>

            <div class="section">
                <h2>🧠 SEL 영역별 분석</h2>
                <div class="sel-insight">
                    <strong>자기인식:</strong> ${reportData.selInsights?.selfAwareness || ''}
                </div>
                <div class="sel-insight">
                    <strong>자기관리:</strong> ${reportData.selInsights?.selfManagement || ''}
                </div>
                <div class="sel-insight">
                    <strong>사회적 인식:</strong> ${reportData.selInsights?.socialAwareness || ''}
                </div>
                <div class="sel-insight">
                    <strong>관계 기술:</strong> ${reportData.selInsights?.relationshipSkills || ''}
                </div>
                <div class="sel-insight">
                    <strong>책임감 있는 의사결정:</strong> ${reportData.selInsights?.responsibleDecisionMaking || ''}
                </div>
            </div>

            <div class="section">
                <h2>👩‍🏫 교사를 위한 권장사항</h2>
                ${reportData.recommendationsForTeacher?.map(rec => 
                    `<div class="recommendation-item">• ${rec}</div>`
                ).join('') || ''}
            </div>

            <div class="section">
                <h2>👨‍👩‍👧‍👦 학부모를 위한 권장사항</h2>
                ${reportData.recommendationsForParents?.map(rec => 
                    `<div class="recommendation-item">• ${rec}</div>`
                ).join('') || ''}
            </div>
        </div>
        
        <div class="footer">
            <p>이 리포트는 AI 기반 SEL 분석 시스템으로 생성되었습니다.</p>
            <p>분석 신뢰도: ${reportData.analysisConfidence}% | 생성 시간: ${new Date().toLocaleString('ko-KR')}</p>
        </div>
    </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${classCode}_클래스SEL리포트_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 클래스 리포트 생성 컨트롤 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            클래스 종합 SEL 분석 리포트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 클래스 정보 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{classCode}</div>
                <div className="text-xs text-muted-foreground">클래스 코드</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{participantCount}</div>
                <div className="text-xs text-muted-foreground">참여 학생</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{responses.length}</div>
                <div className="text-xs text-muted-foreground">총 응답</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round((responses.length / Math.max(participantCount, 1)) * 10) / 10}
                </div>
                <div className="text-xs text-muted-foreground">응답/학생</div>
              </div>
            </div>

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
                  (응답: {responses.length}개, 학생: {participantCount}명)
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
              onClick={generateClassReport}
              disabled={generating || !hasGeminiKey || !canGenerateReport}
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  클래스 분석 중...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  클래스 종합 리포트 생성
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 생성된 클래스 리포트 표시 */}
      {reportData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                {classCode} 클래스 종합 분석 리포트
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {new Date(reportData.generatedAt).toLocaleDateString('ko-KR')}
                </Badge>
                <Badge className="text-xs bg-gradient-to-r from-blue-500 to-purple-500">
                  신뢰도 {reportData.analysisConfidence}%
                </Badge>
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="w-4 h-4 mr-1" />
                  복사
                </Button>
                <Button variant="outline" size="sm" onClick={downloadReport}>
                  <Download className="w-4 h-4 mr-1" />
                  다운로드
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-6">
              {/* 클래스 개요 */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-blue-500" />
                  클래스 종합 요약
                </h4>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">{reportData.summary}</p>
                </div>
              </div>

              {/* 주요 감정 경향 */}
              <div>
                <h4 className="font-semibold text-sm mb-2">💙 주요 감정 경향</h4>
                <div className="space-y-2">
                  {reportData.emotionalTrends?.map((trend, index) => (
                    <div key={index} className="bg-green-50 p-2 rounded border border-green-200">
                      <p className="text-sm text-green-900">• {trend}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 행동 패턴 */}
              <div>
                <h4 className="font-semibold text-sm mb-2">🎯 행동 패턴</h4>
                <div className="space-y-2">
                  {reportData.behaviorPatterns?.map((pattern, index) => (
                    <div key={index} className="bg-purple-50 p-2 rounded border border-purple-200">
                      <p className="text-sm text-purple-900">• {pattern}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SEL 영역별 분석 */}
              <div>
                <h4 className="font-semibold text-sm mb-2">🧠 SEL 영역별 분석</h4>
                <div className="grid gap-3">
                  <div className="bg-gray-50 p-3 rounded border">
                    <strong className="text-sm">자기인식:</strong>
                    <p className="text-sm mt-1">{reportData.selInsights?.selfAwareness}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded border">
                    <strong className="text-sm">자기관리:</strong>
                    <p className="text-sm mt-1">{reportData.selInsights?.selfManagement}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded border">
                    <strong className="text-sm">사회적 인식:</strong>
                    <p className="text-sm mt-1">{reportData.selInsights?.socialAwareness}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded border">
                    <strong className="text-sm">관계 기술:</strong>
                    <p className="text-sm mt-1">{reportData.selInsights?.relationshipSkills}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded border">
                    <strong className="text-sm">책임감 있는 의사결정:</strong>
                    <p className="text-sm mt-1">{reportData.selInsights?.responsibleDecisionMaking}</p>
                  </div>
                </div>
              </div>

              {/* 교사 권장사항 */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center">
                  <Target className="w-4 h-4 mr-2 text-orange-500" />
                  교사를 위한 권장사항
                </h4>
                <div className="space-y-2">
                  {reportData.recommendationsForTeacher?.map((rec, index) => (
                    <div key={index} className="bg-orange-50 p-2 rounded border border-orange-200">
                      <p className="text-sm text-orange-900">• {rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 학부모 권장사항 */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center">
                  <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
                  학부모를 위한 권장사항
                </h4>
                <div className="space-y-2">
                  {reportData.recommendationsForParents?.map((rec, index) => (
                    <div key={index} className="bg-yellow-50 p-2 rounded border border-yellow-200">
                      <p className="text-sm text-yellow-900">• {rec}</p>
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