// HTML 리포트 다운로드 컴포넌트
'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { StudentProfile } from '@/types';

interface ReportHTMLDownloaderProps {
  reportData: any;
  studentName: string;
  studentId: string;
  radarChartData?: {
    selfAwareness: number;
    selfManagement: number;
    socialAwareness: number;
    relationshipSkills: number;
    responsibleDecision: number;
  };
  comparisonData?: {
    classAverage: number;
    gradeAverage: number;
    previousMonth: number;
    currentMonth: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export default function ReportHTMLDownloader({
  reportData,
  studentName,
  radarChartData,
  comparisonData
}: ReportHTMLDownloaderProps) {

  const downloadHTML = () => {
    const htmlContent = generateHTMLReport();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${studentName}_SEL분석리포트_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateHTMLReport = () => {
    const isPersonalized = reportData.uniqueProfile && reportData.strengthsFromData;

    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${studentName} 학생 SEL 분석 리포트</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f9fafb;
      padding: 20px;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .header .meta {
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 40px;
    }

    /* 비교 분석 섹션 */
    .comparison-section {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 2px solid #0ea5e9;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 30px;
    }
    .comparison-title {
      font-size: 20px;
      font-weight: 700;
      color: #0c4a6e;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
    }
    .comparison-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }
    .comparison-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .comparison-card .label {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 8px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .comparison-card .value {
      font-size: 32px;
      font-weight: 700;
      color: #0ea5e9;
    }
    .comparison-card .subvalue {
      font-size: 14px;
      color: #64748b;
      margin-top: 4px;
    }
    .trend-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 8px;
    }
    .trend-up {
      background: #dcfce7;
      color: #166534;
    }
    .trend-down {
      background: #fee2e2;
      color: #991b1b;
    }
    .trend-stable {
      background: #f3f4f6;
      color: #4b5563;
    }

    /* 레이더 차트 */
    .chart-section {
      background: #f8fafc;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 30px;
    }
    .chart-container {
      max-width: 500px;
      margin: 0 auto;
    }
    .score-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
      margin-top: 20px;
    }
    .score-card {
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    .score-card.purple { background: #f3e8ff; color: #6b21a8; }
    .score-card.blue { background: #dbeafe; color: #1e40af; }
    .score-card.green { background: #dcfce7; color: #166534; }
    .score-card.orange { background: #ffedd5; color: #9a3412; }
    .score-card.pink { background: #fce7f3; color: #9f1239; }
    .score-card .label { font-size: 12px; font-weight: 600; }
    .score-card .value { font-size: 24px; font-weight: 700; margin-top: 5px; }

    /* 리포트 섹션 */
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      color: #1f2937;
    }
    .section-title .icon {
      margin-right: 10px;
      font-size: 20px;
    }
    .insight-box {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 15px;
    }
    .strength-box {
      background: #f0fdf4;
      border-left: 4px solid #22c55e;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    .concern-box {
      background: #fff7ed;
      border-left: 4px solid #f97316;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    .strategy-box {
      background: #faf5ff;
      border-left: 4px solid #a855f7;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    .quote-box {
      background: #f8fafc;
      border-left: 4px solid #64748b;
      padding: 15px;
      border-radius: 8px;
      font-style: italic;
      color: #475569;
      margin-bottom: 10px;
    }
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- 헤더 -->
    <div class="header">
      <h1>${studentName} 학생 SEL 분석 리포트</h1>
      <div class="meta">
        생성일시: ${reportData.generatedAt} |
        분석 유형: ${isPersonalized ? '개인화 분석' : '기본 분석'}
      </div>
    </div>

    <div class="content">
      ${comparisonData ? `
      <!-- 비교 분석 섹션 -->
      <div class="comparison-section">
        <div class="comparison-title">
          📊 비교 분석 (종합 SEL 점수)
        </div>
        <div class="comparison-grid">
          <div class="comparison-card">
            <div class="label">현재 점수</div>
            <div class="value">${comparisonData.currentMonth}</div>
            <div class="trend-badge trend-${comparisonData.trend}">
              ${comparisonData.trend === 'up' ? '↑ 상승' :
                comparisonData.trend === 'down' ? '↓ 하락' : '→ 유지'}
            </div>
          </div>
          <div class="comparison-card">
            <div class="label">지난 달</div>
            <div class="value">${comparisonData.previousMonth}</div>
            <div class="subvalue">
              ${comparisonData.currentMonth - comparisonData.previousMonth > 0 ? '+' : ''}${(comparisonData.currentMonth - comparisonData.previousMonth).toFixed(1)}점 변화
            </div>
          </div>
          <div class="comparison-card">
            <div class="label">학급 평균</div>
            <div class="value">${comparisonData.classAverage}</div>
            <div class="subvalue">
              ${comparisonData.currentMonth - comparisonData.classAverage > 0 ? '평균 이상 ↑' : '평균 이하 ↓'}
            </div>
          </div>
          <div class="comparison-card">
            <div class="label">학년 평균</div>
            <div class="value">${comparisonData.gradeAverage}</div>
            <div class="subvalue">
              ${comparisonData.currentMonth - comparisonData.gradeAverage > 0 ? '평균 이상 ↑' : '평균 이하 ↓'}
            </div>
          </div>
        </div>
      </div>
      ` : ''}

      ${radarChartData ? `
      <!-- 레이더 차트 섹션 -->
      <div class="chart-section">
        <h3 style="text-align: center; margin-bottom: 20px; color: #1f2937;">SEL 5개 영역 분석</h3>
        <div class="chart-container">
          <canvas id="radarChart"></canvas>
        </div>
        <div class="score-grid">
          <div class="score-card purple">
            <div class="label">자기인식</div>
            <div class="value">${radarChartData.selfAwareness}</div>
          </div>
          <div class="score-card blue">
            <div class="label">자기관리</div>
            <div class="value">${radarChartData.selfManagement}</div>
          </div>
          <div class="score-card green">
            <div class="label">사회인식</div>
            <div class="value">${radarChartData.socialAwareness}</div>
          </div>
          <div class="score-card orange">
            <div class="label">관계기술</div>
            <div class="value">${radarChartData.relationshipSkills}</div>
          </div>
          <div class="score-card pink">
            <div class="label">책임의식</div>
            <div class="value">${radarChartData.responsibleDecision}</div>
          </div>
        </div>
      </div>
      ` : ''}

      ${isPersonalized ? `
      <!-- 개인화된 리포트 -->
      <div class="section">
        <div class="section-title">
          <span class="icon">🎯</span>
          학생 고유 특성 프로필
        </div>
        <div class="insight-box">
          ${reportData.uniqueProfile}
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          <span class="icon">💪</span>
          실제 응답 기반 강점
        </div>
        ${reportData.strengthsFromData?.map((strength: string) => `
          <div class="strength-box">${strength}</div>
        `).join('') || ''}
      </div>

      ${reportData.concernsFromData?.length > 0 ? `
      <div class="section">
        <div class="section-title">
          <span class="icon">🔍</span>
          관심 영역 (응답 근거)
        </div>
        ${reportData.concernsFromData.map((concern: string) => `
          <div class="concern-box">${concern}</div>
        `).join('')}
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">
          <span class="icon">🎯</span>
          맞춤형 지원 전략
        </div>
        ${reportData.personalizedStrategies?.map((strategy: string) => `
          <div class="strategy-box">${strategy}</div>
        `).join('') || ''}
      </div>

      ${reportData.evidenceQuotes?.length > 0 ? `
      <div class="section">
        <div class="section-title">
          <span class="icon">📋</span>
          분석 근거 (학생 응답 인용)
        </div>
        ${reportData.evidenceQuotes.map((quote: string) => `
          <div class="quote-box">"${quote}"</div>
        `).join('')}
      </div>
      ` : ''}
      ` : `
      <!-- 기본 리포트 -->
      <div class="section">
        <div class="section-title">
          <span class="icon">📝</span>
          종합 요약
        </div>
        <div class="insight-box">
          ${reportData.summary}
        </div>
      </div>
      `}
    </div>

    <div class="footer">
      <p>이 리포트는 MindLog SEL 감정분석 플랫폼에서 AI 기반으로 생성되었습니다.</p>
      <p>생성일시: ${new Date().toLocaleString('ko-KR')}</p>
    </div>
  </div>

  ${radarChartData ? `
  <script>
    // 레이더 차트 생성
    const ctx = document.getElementById('radarChart').getContext('2d');
    new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['자기인식', '자기관리', '사회인식', '관계기술', '책임의식'],
        datasets: [{
          label: 'SEL 역량 점수',
          data: [
            ${radarChartData.selfAwareness},
            ${radarChartData.selfManagement},
            ${radarChartData.socialAwareness},
            ${radarChartData.relationshipSkills},
            ${radarChartData.responsibleDecision}
          ],
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(99, 102, 241, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(99, 102, 241, 1)',
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            min: 0,
            ticks: { stepSize: 20 },
            pointLabels: { font: { size: 14, weight: 'bold' } }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  </script>
  ` : ''}
</body>
</html>`;
  };

  return (
    <Button
      onClick={downloadHTML}
      variant="outline"
      className="w-full"
    >
      <Download className="w-4 h-4 mr-2" />
      HTML 리포트 다운로드
    </Button>
  );
}
