'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Mail, 
  FileText, 
  Printer,
  Share2,
  Copy,
  CheckCircle,
  Loader2,
  AlertCircle,
  Users,
  Calendar
} from 'lucide-react';

interface ReportShareManagerProps {
  reportData: any;
  studentName: string;
  studentId: string;
  className?: string;
}

export default function ReportShareManager({ 
  reportData, 
  studentName, 
  studentId,
  className = '' 
}: ReportShareManagerProps) {
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [parentEmail, setParentEmail] = useState('');

  // HTML 리포트 생성
  const generateHTMLReport = () => {
    const isPersonalized = reportData.uniqueProfile && reportData.strengthsFromData;
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${studentName} 학생 SEL 상담 리포트</title>
    <style>
        body {
            font-family: 'Noto Sans KR', Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            max-width: 800px;
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
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
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
        .quality-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 16px;
        }
        .quality-high { background: #d1fae5; color: #065f46; }
        .quality-medium { background: #fef3c7; color: #92400e; }
        .quality-low { background: #fee2e2; color: #991b1b; }
        .strength-item {
            background: #ecfdf5;
            border-left: 4px solid #10b981;
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 0 8px 8px 0;
        }
        .concern-item {
            background: #fff7ed;
            border-left: 4px solid #f59e0b;
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 0 8px 8px 0;
        }
        .strategy-item {
            background: #f3f4f6;
            border-left: 4px solid #6366f1;
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 0 8px 8px 0;
        }
        .evidence-item {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 8px;
            font-style: italic;
        }
        .footer {
            background: #f9fafb;
            padding: 20px 30px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
        }
        .print-only {
            display: none;
        }
        @media print {
            .print-only { display: block; }
            body { background: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${studentName} 학생 SEL 상담 리포트</h1>
            <p>생성일: ${reportData.generatedAt || new Date().toLocaleDateString('ko-KR')}</p>
            ${reportData.dataQuality ? `
                <span class="quality-badge quality-${reportData.dataQuality.confidenceLevel === '높음' ? 'high' : reportData.dataQuality.confidenceLevel === '보통' ? 'medium' : 'low'}">
                    분석 신뢰도: ${reportData.dataQuality?.confidenceLevel || '보통'}
                </span>
            ` : ''}
        </div>
        
        <div class="content">
            ${isPersonalized ? `
                <div class="section">
                    <h2>🎯 학생 고유 특성 프로필</h2>
                    <p>${reportData.uniqueProfile}</p>
                </div>
                
                <div class="section">
                    <h2>💪 실제 응답 기반 강점</h2>
                    ${reportData.strengthsFromData.map((strength: string) => 
                        `<div class="strength-item">• ${strength}</div>`
                    ).join('')}
                </div>
                
                ${reportData.concernsFromData?.length ? `
                    <div class="section">
                        <h2>🔍 관심 영역</h2>
                        ${reportData.concernsFromData.map((concern: string) => 
                            `<div class="concern-item">• ${concern}</div>`
                        ).join('')}
                    </div>
                ` : ''}
                
                <div class="section">
                    <h2>🎯 맞춤형 지원 전략</h2>
                    ${reportData.personalizedStrategies?.map((strategy: string) => 
                        `<div class="strategy-item">• ${strategy}</div>`
                    ).join('') || ''}
                </div>
                
                <div class="section">
                    <h2>🏫 교실 내 개별 접근법</h2>
                    ${reportData.classroomApproach?.map((approach: string) => 
                        `<div class="strategy-item">• ${approach}</div>`
                    ).join('') || ''}
                </div>
                
                <div class="section">
                    <h2>🏠 가정 지원 방안</h2>
                    ${reportData.parentGuidance?.map((guidance: string) => 
                        `<div class="strategy-item">• ${guidance}</div>`
                    ).join('') || ''}
                </div>
                
                ${reportData.evidenceQuotes?.length ? `
                    <div class="section">
                        <h2>📋 분석 근거</h2>
                        ${reportData.evidenceQuotes.map((quote: string) => 
                            `<div class="evidence-item">${quote}</div>`
                        ).join('')}
                    </div>
                ` : ''}
            ` : `
                <div class="section">
                    <h2>종합 요약</h2>
                    <p>${reportData.summary}</p>
                </div>
                
                <div class="section">
                    <h2>주요 강점</h2>
                    ${reportData.strengths?.map((strength: string) => 
                        `<div class="strength-item">• ${strength}</div>`
                    ).join('') || ''}
                </div>
                
                ${reportData.concernAreas?.length ? `
                    <div class="section">
                        <h2>관심 필요 영역</h2>
                        ${reportData.concernAreas.map((concern: string) => 
                            `<div class="concern-item">• ${concern}</div>`
                        ).join('')}
                    </div>
                ` : ''}
                
                <div class="section">
                    <h2>교육적 권장사항</h2>
                    ${reportData.recommendations?.map((rec: string) => 
                        `<div class="strategy-item">• ${rec}</div>`
                    ).join('') || ''}
                </div>
            `}
        </div>
        
        <div class="footer">
            <p>이 리포트는 AI 기반 SEL 분석 시스템으로 생성되었습니다.</p>
            <p>추가 문의사항은 담임선생님께 연락해 주세요.</p>
            <div class="print-only">
                <p style="margin-top: 20px;">생성 시간: ${new Date().toLocaleString('ko-KR')}</p>
            </div>
        </div>
    </div>
</body>
</html>`;

    return htmlContent;
  };

  // PDF 다운로드
  const downloadAsPDF = async () => {
    const htmlContent = generateHTMLReport();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${studentName}_SEL리포트_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 이메일 전송
  const sendEmailToParent = async () => {
    if (!parentEmail) {
      setEmailStatus('이메일 주소를 입력해주세요.');
      return;
    }

    setEmailSending(true);
    setEmailStatus(null);

    try {
      const response = await fetch('/api/reports/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentEmail,
          studentName,
          reportData,
          reportHTML: generateHTMLReport()
        }),
      });

      if (response.ok) {
        setEmailStatus('이메일이 성공적으로 전송되었습니다.');
        setParentEmail('');
      } else {
        const error = await response.json();
        setEmailStatus(error.error || '이메일 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('이메일 전송 오류:', error);
      setEmailStatus('이메일 전송 중 오류가 발생했습니다.');
    } finally {
      setEmailSending(false);
    }
  };

  // 인쇄
  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateHTMLReport());
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  // 클립보드 복사 (기존 기능 개선)
  const copyToClipboard = async () => {
    const isPersonalized = reportData.uniqueProfile && reportData.strengthsFromData;
    
    const reportText = isPersonalized ? 
      `${studentName} 학생 개인화 SEL 상담 리포트
생성일시: ${reportData.generatedAt}

■ 학생 고유 특성 프로필
${reportData.uniqueProfile}

■ 실제 응답 기반 강점
${reportData.strengthsFromData?.map((item: string) => `• ${item}`).join('\n') || ''}

■ 관심 영역
${reportData.concernsFromData?.length ? reportData.concernsFromData.map((item: string) => `• ${item}`).join('\n') : '• 특별한 관심 영역 없음'}

■ 맞춤형 지원 전략
${reportData.personalizedStrategies?.map((item: string) => `• ${item}`).join('\n') || ''}

■ 교실 내 개별 접근법
${reportData.classroomApproach?.map((item: string) => `• ${item}`).join('\n') || ''}

■ 가정 지원 방안
${reportData.parentGuidance?.map((item: string) => `• ${item}`).join('\n') || ''}
      `.trim()
    :
      `${studentName} 학생 SEL 상담 리포트
생성일시: ${reportData.generatedAt}

■ 종합 요약
${reportData.summary}

■ 주요 강점
${reportData.strengths?.map((item: string) => `• ${item}`).join('\n') || ''}

■ 관심 필요 영역
${reportData.concernAreas?.length ? reportData.concernAreas.map((item: string) => `• ${item}`).join('\n') : '• 특별한 관심 영역 없음'}

■ 교육적 권장사항
${reportData.recommendations?.map((item: string) => `• ${item}`).join('\n') || ''}
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Share2 className="w-5 h-5 mr-2" />
            리포트 공유 및 다운로드
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 빠른 액션 버튼들 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                onClick={downloadAsPDF}
                variant="outline"
                className="flex items-center justify-center"
              >
                <Download className="w-4 h-4 mr-2" />
                HTML 다운로드
              </Button>
              
              <Button
                onClick={printReport}
                variant="outline"
                className="flex items-center justify-center"
              >
                <Printer className="w-4 h-4 mr-2" />
                인쇄
              </Button>
              
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="flex items-center justify-center"
              >
                <Copy className="w-4 h-4 mr-2" />
                텍스트 복사
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center justify-center"
                disabled
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF 변환
                <Badge variant="secondary" className="ml-2 text-xs">준비중</Badge>
              </Button>
            </div>

            {/* 이메일 전송 섹션 */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold text-sm mb-3 flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                학부모 이메일 전송
              </h4>
              
              <div className="space-y-3">
                <div>
                  <label htmlFor="parentEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    학부모 이메일 주소
                  </label>
                  <input
                    type="email"
                    id="parentEmail"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <Button
                  onClick={sendEmailToParent}
                  disabled={emailSending || !parentEmail}
                  className="w-full"
                >
                  {emailSending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      전송 중...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      이메일 전송
                    </>
                  )}
                </Button>
              </div>

              {/* 이메일 상태 메시지 */}
              {emailStatus && (
                <Alert className={`mt-3 ${emailStatus.includes('성공') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  {emailStatus.includes('성공') ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={emailStatus.includes('성공') ? 'text-green-800' : 'text-red-800'}>
                    {emailStatus}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* 리포트 정보 */}
            <div className="text-sm text-gray-600 border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">리포트 정보</p>
                  <p>학생: {studentName}</p>
                  <p>생성일: {reportData.generatedAt || new Date().toLocaleDateString('ko-KR')}</p>
                </div>
                <div>
                  <p className="font-medium">분석 품질</p>
                  {reportData.dataQuality && (
                    <>
                      <p>매칭률: {reportData.dataQuality.matchingRate}%</p>
                      <p>신뢰도: {reportData.dataQuality.confidenceLevel}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}