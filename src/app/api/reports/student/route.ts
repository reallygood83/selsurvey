// 개별 학생 SEL 분석 리포트 생성 API
import { NextRequest, NextResponse } from 'next/server';
import { surveyService, studentService } from '@/lib/firestore';
import { SurveyResponse, StudentProfile } from '@/types';

// Gemini AI API 설정
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

interface StudentReportRequest {
  studentId: string;
  classCode: string;
  startDate: string;
  endDate: string;
  reportType: 'individual' | 'summary';
  // 새로운 응답 선택 모드
  responseSelectionMode?: 'single' | 'range' | 'all';
  responseId?: string; // single 모드일 때 사용
  // 프론트엔드에서 이미 가져온 응답 데이터 (권한 문제 해결)
  responses?: SurveyResponse[];
  // Gemini API Key (사용자가 설정한 키)
  geminiApiKey: string;
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
  dateRange: { start: Date; end: Date },
  geminiApiKey: string
): Promise<SELAnalysis> {
  if (!geminiApiKey) {
    throw new Error('Gemini API key is not provided');
  }

  // 응답 데이터를 분석용 텍스트로 변환
  const analysisData = responses.map(response => {
    // submittedAt이 문자열이면 Date로 변환
    const submittedDate = typeof response.submittedAt === 'string'
      ? new Date(response.submittedAt)
      : response.submittedAt;

    return {
      date: submittedDate.toISOString().split('T')[0],
      type: response.surveyType,
      responses: response.responses.map(r => ({
        domain: r.domain,
        question: r.questionId,
        answer: r.answer
      }))
    };
  });

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
    // Gemini API 호출
    const apiUrl = `${GEMINI_API_URL}?key=${geminiApiKey}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      console.error('Gemini API Error:', await response.text());
      throw new Error('Failed to generate AI analysis');
    }

    const data = await response.json();
    const analysisText = data.candidates[0].content.parts[0].text;

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
      responseId,
      responses,  // 프론트엔드에서 전달받은 응답 데이터
      geminiApiKey  // 사용자가 설정한 Gemini API 키
    }: StudentReportRequest = await request.json();

    console.log('🔍 [Student Report] 리포트 생성 요청:', {
      studentId,
      classCode,
      startDate,
      endDate,
      reportType,
      responseSelectionMode,
      responseId: responseId ? `${responseId.substring(0, 8)}...` : 'N/A',
      responsesProvided: responses ? responses.length : 0
    });

    // 날짜 범위 설정
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // 해당 날짜 끝까지 포함

    // 학생 정보 조회 (클라이언트에서 전달받은 데이터 사용)
    let student: StudentProfile | undefined;
    let studentResponses: SurveyResponse[] = [];

    // 프론트엔드에서 이미 데이터를 가져왔으면 그것을 사용 (권한 문제 해결)
    if (responses && responses.length > 0) {
      console.log('✅ [Student Report] 프론트엔드에서 전달받은 응답 데이터 사용:', responses.length);
      studentResponses = responses;

      // 학생 정보는 응답 데이터에서 추출
      student = {
        id: studentId,
        name: responses[0].studentName || '알 수 없음',
        grade: '미정',
        classCode: classCode
      } as StudentProfile;
    } else {
      // 서버에서 직접 조회 (이전 방식 - 권한 오류 가능성)
      const students = await studentService.getStudentsByClass(classCode);
      student = students.find(s => s.id === studentId || s.userId === studentId);

      if (!student) {
        return NextResponse.json(
          { error: '학생을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      // 응답 선택 모드에 따라 데이터 필터링
      if (responseSelectionMode === 'single' && responseId) {
        const allResponses = await surveyService.getResponsesByClass(classCode);
        const specificResponse = allResponses.find(r => r.id === responseId);

        if (!specificResponse) {
          return NextResponse.json(
            { error: '선택한 응답을 찾을 수 없습니다.' },
            { status: 404 }
          );
        }

        studentResponses = [specificResponse];
      } else if (responseSelectionMode === 'range') {
        const allResponses = await surveyService.getResponsesByClass(classCode, start, end);
        studentResponses = allResponses.filter(response =>
          response.studentId === studentId || response.studentId === student.userId
        );
      } else {
        const allResponses = await surveyService.getResponsesByClass(classCode);
        studentResponses = allResponses.filter(response =>
          response.studentId === studentId || response.studentId === student.userId
        );
      }
    }

    console.log('📊 [Student Report] 응답 데이터 최종:', {
      mode: responseSelectionMode,
      studentResponses: studentResponses.length,
      studentName: student?.name
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
    const analysis = await generateSELAnalysis(student, studentResponses, { start, end }, geminiApiKey);

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
    console.error('❌ [Student Report] 오류 상세:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      {
        error: 'AI 리포트 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}