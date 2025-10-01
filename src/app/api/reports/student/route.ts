// 개별 학생 SEL 분석 리포트 생성 API
import { NextRequest, NextResponse } from 'next/server';
import { surveyService, studentService } from '@/lib/firestore';
import { SurveyResponse, StudentProfile } from '@/types';

// Claude AI API 설정
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

interface StudentReportRequest {
  studentId: string;
  classCode: string;
  startDate: string;
  endDate: string;
  reportType: 'individual' | 'summary';
  // 새로운 응답 선택 모드
  responseSelectionMode?: 'single' | 'range' | 'all';
  responseId?: string; // single 모드일 때 사용
}

interface SELAnalysis {
  selfAwareness: {
    score: number;
    observations: string[];
    trends: string;
  };
  selfManagement: {
    score: number;
    observations: string[];
    trends: string;
  };
  socialAwareness: {
    score: number;
    observations: string[];
    trends: string;
  };
  relationshipSkills: {
    score: number;
    observations: string[];
    trends: string;
  };
  responsibleDecisionMaking: {
    score: number;
    observations: string[];
    trends: string;
  };
  overallInsights: string[];
  recommendations: string[];
  concerns: string[];
}

async function generateSELAnalysis(
  student: StudentProfile,
  responses: SurveyResponse[],
  dateRange: { start: Date; end: Date }
): Promise<SELAnalysis> {
  if (!CLAUDE_API_KEY) {
    throw new Error('Claude API key is not configured');
  }

  // 응답 데이터를 분석용 텍스트로 변환
  const analysisData = responses.map(response => ({
    date: response.submittedAt.toISOString().split('T')[0],
    type: response.surveyType,
    responses: response.responses.map(r => ({
      domain: r.domain,
      question: r.questionId,
      answer: r.answer
    }))
  }));

  const prompt = `당신은 SEL(Social-Emotional Learning) 전문 상담 교사입니다. 다음 학생의 설문 응답 데이터를 분석하여 종합적인 SEL 리포트를 작성해주세요.

**학생 정보:**
- 이름: ${student.name}
- 학년: ${student.grade}학년
- 분석 기간: ${dateRange.start.toLocaleDateString()} ~ ${dateRange.end.toLocaleDateString()}
- 응답 수: ${responses.length}개

**설문 응답 데이터:**
${JSON.stringify(analysisData, null, 2)}

**SEL 5개 영역별 분석을 다음 JSON 형식으로 작성해주세요:**

{
  "selfAwareness": {
    "score": 85,
    "observations": ["구체적 관찰 내용들"],
    "trends": "시간에 따른 변화 패턴"
  },
  "selfManagement": {
    "score": 75,
    "observations": ["구체적 관찰 내용들"],
    "trends": "시간에 따른 변화 패턴"
  },
  "socialAwareness": {
    "score": 80,
    "observations": ["구체적 관찰 내용들"],
    "trends": "시간에 따른 변화 패턴"
  },
  "relationshipSkills": {
    "score": 70,
    "observations": ["구체적 관찰 내용들"],
    "trends": "시간에 따른 변화 패턴"
  },
  "responsibleDecisionMaking": {
    "score": 90,
    "observations": ["구체적 관찰 내용들"],
    "trends": "시간에 따른 변화 패턴"
  },
  "overallInsights": [
    "전반적인 발달 상황에 대한 인사이트들"
  ],
  "recommendations": [
    "교사와 학부모를 위한 구체적인 지도 방안들"
  ],
  "concerns": [
    "주의깊게 관찰해야 할 영역들"
  ]
}

**분석 지침:**
1. 점수는 100점 만점으로 매기되, 학생의 연령과 발달 단계를 고려하세요
2. 시간에 따른 변화 패턴을 반드시 분석하세요
3. 구체적이고 실행 가능한 권장사항을 제시하세요
4. 우려사항은 건설적이고 해결 지향적으로 서술하세요
5. 전문적이지만 학부모가 이해할 수 있는 언어를 사용하세요

반드시 유효한 JSON 형식으로만 응답해주세요.`;

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      console.error('Claude API Error:', await response.text());
      throw new Error('Failed to generate AI analysis');
    }

    const data = await response.json();
    const analysisText = data.content[0].text;
    
    try {
      return JSON.parse(analysisText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', analysisText);
      throw new Error('Failed to parse AI analysis');
    }

  } catch (error) {
    console.error('Error generating SEL analysis:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      studentId,
      classCode,
      startDate,
      endDate,
      reportType,
      responseSelectionMode = 'all',  // 기본값: 전체 응답
      responseId
    }: StudentReportRequest = await request.json();

    console.log('🔍 [Student Report] 리포트 생성 요청:', {
      studentId,
      classCode,
      startDate,
      endDate,
      reportType,
      responseSelectionMode,
      responseId: responseId ? `${responseId.substring(0, 8)}...` : 'N/A'
    });

    // 날짜 범위 설정
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // 해당 날짜 끝까지 포함

    // 학생 정보 조회
    const students = await studentService.getStudentsByClass(classCode);
    const student = students.find(s => s.id === studentId || s.userId === studentId);

    if (!student) {
      return NextResponse.json(
        { error: '학생을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 응답 선택 모드에 따라 데이터 필터링
    let studentResponses: SurveyResponse[] = [];

    if (responseSelectionMode === 'single' && responseId) {
      // 1개 응답 모드: 특정 응답만 가져오기
      const allResponses = await surveyService.getResponsesByClass(classCode);
      const specificResponse = allResponses.find(r => r.id === responseId);

      if (!specificResponse) {
        return NextResponse.json(
          { error: '선택한 응답을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      studentResponses = [specificResponse];
      console.log('📊 [Student Report] 1개 응답 모드:', {
        responseId,
        submittedAt: specificResponse.submittedAt
      });

    } else if (responseSelectionMode === 'range') {
      // 기간 설정 모드: 날짜 범위 내 응답
      const allResponses = await surveyService.getResponsesByClass(classCode, start, end);
      studentResponses = allResponses.filter(response =>
        response.studentId === studentId || response.studentId === student.userId
      );
      console.log('📊 [Student Report] 기간 설정 모드:', {
        startDate,
        endDate,
        responsesFound: studentResponses.length
      });

    } else {
      // 전체 모드: 모든 응답
      const allResponses = await surveyService.getResponsesByClass(classCode);
      studentResponses = allResponses.filter(response =>
        response.studentId === studentId || response.studentId === student.userId
      );
      console.log('📊 [Student Report] 전체 응답 모드:', {
        totalResponses: studentResponses.length
      });
    }

    console.log('📊 [Student Report] 응답 데이터 최종:', {
      mode: responseSelectionMode,
      studentResponses: studentResponses.length
    });

    if (studentResponses.length === 0) {
      return NextResponse.json({
        error: '해당 기간에 설문 응답이 없습니다.',
        student: {
          name: student.name,
          grade: student.grade
        },
        period: {
          start: startDate,
          end: endDate
        },
        responseCount: 0
      }, { status: 200 });
    }

    // AI 분석 생성
    const analysis = await generateSELAnalysis(student, studentResponses, { start, end });

    const report = {
      student: {
        name: student.name,
        grade: student.grade,
        classCode: student.classCode
      },
      period: {
        start: startDate,
        end: endDate
      },
      responseCount: studentResponses.length,
      analysis: analysis,
      generatedAt: new Date().toISOString(),
      reportType: reportType
    };

    console.log('✅ [Student Report] 리포트 생성 완료:', {
      studentName: student.name,
      responseCount: studentResponses.length,
      overallInsightsCount: analysis.overallInsights.length,
      recommendationsCount: analysis.recommendations.length
    });

    return NextResponse.json(report);

  } catch (error) {
    console.error('❌ [Student Report] 리포트 생성 오류:', error);
    return NextResponse.json(
      { error: 'AI 리포트 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}