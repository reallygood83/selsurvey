// AI 상담 리포트 이력 관리 컴포넌트
'use client';

import { useState, useEffect } from 'react';
import { AIReport } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  FileText, 
  Clock, 
  User, 
  Download,
  Eye,
  Sparkles,
  Calendar,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface AIReportHistoryProps {
  teacherId: string;
  studentId?: string;
  classCode?: string;
  className?: string;
}

export default function AIReportHistory({ 
  teacherId, 
  studentId, 
  classCode,
  className = '' 
}: AIReportHistoryProps) {
  const [reports, setReports] = useState<AIReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<AIReport | null>(null);

  // 리포트 목록 로드
  const loadReports = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('teacherId', teacherId);
      if (studentId) params.append('studentId', studentId);
      if (classCode) params.append('classCode', classCode);
      params.append('limit', '50');

      const response = await fetch(`/api/ai-reports/list?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '리포트 조회에 실패했습니다.');
      }

      const data = await response.json();
      setReports(data.reports || []);
      
      console.log('📋 리포트 이력 로드 완료:', {
        totalReports: data.reports?.length || 0,
        personalizedCount: data.metadata?.personalizedCount || 0,
        basicCount: data.metadata?.basicCount || 0
      });

    } catch (err) {
      console.error('❌ 리포트 이력 로드 오류:', err);
      setError(err instanceof Error ? err.message : '리포트 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 특정 리포트 상세 조회
  const loadReportDetail = async (reportId: string) => {
    try {
      const response = await fetch(`/api/ai-reports/${reportId}`);
      
      if (!response.ok) {
        throw new Error('리포트 상세 조회에 실패했습니다.');
      }

      const data = await response.json();
      setSelectedReport(data.report);
      
    } catch (err) {
      console.error('❌ 리포트 상세 조회 오류:', err);
      alert('리포트 상세 조회 중 오류가 발생했습니다.');
    }
  };

  // 리포트 텍스트 다운로드
  const downloadReport = (report: AIReport) => {
    const isPersonalized = report.isPersonalized && report.uniqueProfile;
    
    const reportText = isPersonalized ? 
      // 개인화된 리포트 형식
      `${report.studentName} 학생 개인화 AI 상담 리포트
생성일시: ${format(report.generatedAt, 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}

■ 학생 고유 특성 프로필
${report.uniqueProfile}

■ 실제 응답 기반 강점
${report.strengthsFromData?.map(item => `• ${item}`).join('\n') || ''}

■ 관심 영역 (응답 근거)
${report.concernsFromData?.length ? report.concernsFromData.map(item => `• ${item}`).join('\n') : '• 특별한 관심 영역 없음'}

■ 맞춤형 지원 전략
${report.personalizedStrategies?.map(item => `• ${item}`).join('\n') || ''}

■ 교실 내 개별 접근법
${report.classroomApproach?.map(item => `• ${item}`).join('\n') || ''}

■ 가정 지원 방안
${report.parentGuidance?.map(item => `• ${item}`).join('\n') || ''}

■ 구체적 목표 설정
${report.specificGoals?.map(item => `• ${item}`).join('\n') || ''}

■ 분석 근거 (학생 응답 인용)
${report.evidenceQuotes?.map(item => `• ${item}`).join('\n') || ''}

---
분석 데이터 출처: ${report.analysisDataSource.period} (응답 ${report.analysisDataSource.responsesCount}개, 분석 ${report.analysisDataSource.analysesCount}개)
리포트 버전: ${report.version}
      `.trim()
    :
      // 기존 리포트 형식
      `${report.studentName} 학생 AI 상담 리포트
생성일시: ${format(report.generatedAt, 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}

■ 종합 요약
${report.summary}

■ 주요 강점
${report.strengths?.map(item => `• ${item}`).join('\n') || ''}

■ 관심 필요 영역
${report.concernAreas?.length ? report.concernAreas.map(item => `• ${item}`).join('\n') : '• 특별한 관심 영역 없음'}

■ 교육적 권장사항
${report.recommendations?.map(item => `• ${item}`).join('\n') || ''}

■ 교실 지원 전략
${report.classroomStrategies?.map(item => `• ${item}`).join('\n') || ''}

■ 학부모 제안사항
${report.parentSuggestions?.map(item => `• ${item}`).join('\n') || ''}

■ 향후 계획
${report.nextSteps?.map(item => `• ${item}`).join('\n') || ''}

---
분석 데이터 출처: ${report.analysisDataSource.period} (응답 ${report.analysisDataSource.responsesCount}개, 분석 ${report.analysisDataSource.analysesCount}개)
리포트 버전: ${report.version}
      `.trim();

    // 파일 다운로드
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.studentName}_AI상담리포트_${format(report.generatedAt, 'yyyyMMdd', { locale: ko })}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 컴포넌트 마운트 시 리포트 로드
  useEffect(() => {
    loadReports();
  }, [teacherId, studentId, classCode]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>리포트 이력을 불러오는 중...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            onClick={loadReports}
            className="mt-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 헤더 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              AI 상담 리포트 이력
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                총 {reports.length}개
              </Badge>
              <Badge variant="secondary">
                개인화 {reports.filter(r => r.isPersonalized).length}개
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadReports}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                새로고침
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 리포트 목록 */}
      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>아직 생성된 AI 리포트가 없습니다</p>
              <p className="text-sm mt-2">학생의 SEL 분석 페이지에서 AI 리포트를 생성해보세요.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-primary" />
                        <span className="font-semibold">{report.studentName}</span>
                        <Badge variant="outline" className="text-xs">
                          {report.grade}학년
                        </Badge>
                        {report.isPersonalized && (
                          <Badge className="text-xs bg-gradient-to-r from-purple-500 to-pink-500">
                            <Sparkles className="w-3 h-3 mr-1" />
                            개인화
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {format(report.generatedAt, 'MM월 dd일 HH:mm', { locale: ko })}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {report.analysisDataSource.period}
                      </div>
                      <div>
                        응답 {report.analysisDataSource.responsesCount}개
                      </div>
                      <div>
                        v{report.version}
                      </div>
                    </div>

                    {/* 개인화된 리포트인 경우 고유 특성 미리보기 */}
                    {report.isPersonalized && report.uniqueProfile && (
                      <div className="mt-2 p-2 bg-purple-50 rounded text-xs text-purple-800 border border-purple-200">
                        <strong>고유 특성:</strong> {report.uniqueProfile.substring(0, 80)}...
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadReportDetail(report.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      보기
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadReport(report)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      다운로드
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 선택된 리포트 상세 모달 (간단 구현) */}
      {selectedReport && (
        <Card className="mt-6 border-2 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                {selectedReport.studentName} 학생 리포트 상세
                {selectedReport.isPersonalized && (
                  <Badge className="ml-2 bg-gradient-to-r from-purple-500 to-pink-500">
                    <Sparkles className="w-3 h-3 mr-1" />
                    개인화
                  </Badge>
                )}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedReport(null)}
              >
                닫기
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {selectedReport.isPersonalized && selectedReport.uniqueProfile ? (
                <>
                  <div>
                    <h4 className="font-semibold mb-2">🎯 학생 고유 특성</h4>
                    <p className="text-sm bg-blue-50 p-3 rounded">{selectedReport.uniqueProfile}</p>
                  </div>
                  
                  {selectedReport.strengthsFromData && (
                    <div>
                      <h4 className="font-semibold mb-2">💪 실제 응답 기반 강점</h4>
                      <ul className="text-sm space-y-1">
                        {selectedReport.strengthsFromData.map((item, index) => (
                          <li key={index} className="bg-green-50 p-2 rounded">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedReport.evidenceQuotes && (
                    <div>
                      <h4 className="font-semibold mb-2">📋 분석 근거</h4>
                      <ul className="text-sm space-y-1">
                        {selectedReport.evidenceQuotes.map((quote, index) => (
                          <li key={index} className="bg-slate-50 p-2 rounded italic">"{quote}"</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <h4 className="font-semibold mb-2">종합 요약</h4>
                  <p className="text-sm bg-blue-50 p-3 rounded">{selectedReport.summary}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}