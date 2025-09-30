// 학급 전체 SEL 분석 리포트 생성 API
import { NextRequest, NextResponse } from 'next/server';
import { surveyService, studentService } from '@/lib/firestore';
import { SurveyResponse, StudentProfile } from '@/types';

// Claude AI API 설정
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

interface ClassReportRequest {
  classCode: string;
  startDate: string;
  endDate: string;
  includeIndividualInsights?: boolean;
}

interface ClassSELAnalysis {
  classOverview: {
    totalStudents: number;
    responseRate: number;
    avgResponsesPerStudent: number;
    activeParticipants: number;
  };
  domainAnalysis: {
    selfAwareness: {
      classAverage: number;
      distribution: { high: number; medium: number; low: number };
      trends: string;
      keyObservations: string[];
    };
    selfManagement: {
      classAverage: number;
      distribution: { high: number; medium: number; low: number };
      trends: string;
      keyObservations: string[];
    };
    socialAwareness: {
      classAverage: number;
      distribution: { high: number; medium: number; low: number };
      trends: string;
      keyObservations: string[];
    };
    relationshipSkills: {
      classAverage: number;
      distribution: { high: number; medium: number; low: number };
      trends: string;
      keyObservations: string[];
    };
    responsibleDecisionMaking: {
      classAverage: number;
      distribution: { high: number; medium: number; low: number };
      trends: string;
      keyObservations: string[];
    };
  };
  classInsights: {
    strengths: string[];
    challenges: string[];
    emergingPatterns: string[];
    concerningTrends: string[];
  };
  recommendations: {
    classroomStrategies: string[];
    individualSupport: string[];
    programSuggestions: string[];
    parentEngagement: string[];
  };
  studentsNeedingAttention: {
    name: string;
    concerns: string[];
    priority: 'high' | 'medium' | 'low';
  }[];
}

async function generateClassSELAnalysis(
  students: StudentProfile[],
  responses: SurveyResponse[],
  dateRange: { start: Date; end: Date }
): Promise<ClassSELAnalysis> {
  if (!CLAUDE_API_KEY) {
    throw new Error('Claude API key is not configured');
  }

  // 학급 기본 통계 계산
  const activeStudents = new Set(responses.map(r => r.studentId)).size;
  const responseRate = students.length > 0 ? (activeStudents / students.length) * 100 : 0;
  const avgResponsesPerStudent = activeStudents > 0 ? responses.length / activeStudents : 0;

  // 학생별 응답 그룹화
  const studentResponseMap = new Map<string, SurveyResponse[]>();
  responses.forEach(response => {
    const key = response.studentId;
    if (!studentResponseMap.has(key)) {
      studentResponseMap.set(key, []);
    }
    studentResponseMap.get(key)!.push(response);
  });

  // 분석용 데이터 구성
  const analysisData = {
    classStats: {
      totalStudents: students.length,
      activeStudents,
      responseRate: Math.round(responseRate),
      avgResponsesPerStudent: Math.round(avgResponsesPerStudent * 10) / 10,
      totalResponses: responses.length
    },
    timespan: {
      start: dateRange.start.toISOString().split('T')[0],
      end: dateRange.end.toISOString().split('T')[0],
      duration: Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24))
    },
    responsesByDomain: {} as Record<string, unknown>,
    responsePatterns: [] as Record<string, unknown>[]
  };

  // 도메인별 응답 분석
  const domains = ['self-awareness', 'self-management', 'social-awareness', 'relationship-skills', 'responsible-decision-making'];
  domains.forEach(domain => {
    const domainResponses = responses.flatMap(r => 
      r.responses.filter(resp => resp.domain === domain)
    );
    
    analysisData.responsesByDomain[domain] = {
      totalResponses: domainResponses.length,
      averageScore: domainResponses.length > 0 
        ? domainResponses.reduce((sum, r) => sum + (typeof r.answer === 'number' ? r.answer : 3), 0) / domainResponses.length 
        : 0,
      responseDistribution: domainResponses.map(r => ({
        answer: r.answer,
        question: r.questionId
      }))
    };
  });

  // 학생별 참여 패턴
  studentResponseMap.forEach((studentResponses, studentId) => {
    const student = students.find(s => s.id === studentId || s.userId === studentId);
    if (student) {
      analysisData.responsePatterns.push({
        studentName: student.name,
        responseCount: studentResponses.length,
        domains: [...new Set(studentResponses.flatMap(r => r.responses.map(resp => resp.domain)))],
        timeRange: {
          first: studentResponses[0]?.submittedAt.toISOString().split('T')[0],
          last: studentResponses[studentResponses.length - 1]?.submittedAt.toISOString().split('T')[0]
        }
      });
    }
  });

  const prompt = `당신은 SEL(Social-Emotional Learning) 전문 교육 컨설턴트입니다. 다음 학급의 설문 응답 데이터를 종합 분석하여 학급 단위 SEL 리포트를 작성해주세요.

**학급 현황:**
${JSON.stringify(analysisData, null, 2)}

**다음 JSON 형식으로 종합적인 학급 SEL 분석을 작성해주세요:**

{
  "classOverview": {
    "totalStudents": ${analysisData.classStats.totalStudents},
    "responseRate": ${analysisData.classStats.responseRate},
    "avgResponsesPerStudent": ${analysisData.classStats.avgResponsesPerStudent},
    "activeParticipants": ${analysisData.classStats.activeStudents}
  },
  "domainAnalysis": {
    "selfAwareness": {
      "classAverage": 75,
      "distribution": { "high": 30, "medium": 50, "low": 20 },
      "trends": "시간에 따른 학급 전체 변화 패턴",
      "keyObservations": ["주요 관찰 내용들"]
    },
    "selfManagement": {
      "classAverage": 70,
      "distribution": { "high": 25, "medium": 55, "low": 20 },
      "trends": "시간에 따른 학급 전체 변화 패턴",
      "keyObservations": ["주요 관찰 내용들"]
    },
    "socialAwareness": {
      "classAverage": 80,
      "distribution": { "high": 35, "medium": 45, "low": 20 },
      "trends": "시간에 따른 학급 전체 변화 패턴",
      "keyObservations": ["주요 관찰 내용들"]
    },
    "relationshipSkills": {
      "classAverage": 72,
      "distribution": { "high": 28, "medium": 52, "low": 20 },
      "trends": "시간에 따른 학급 전체 변화 패턴",
      "keyObservations": ["주요 관찰 내용들"]
    },
    "responsibleDecisionMaking": {
      "classAverage": 78,
      "distribution": { "high": 32, "medium": 48, "low": 20 },
      "trends": "시간에 따른 학급 전체 변화 패턴",
      "keyObservations": ["주요 관찰 내용들"]
    }
  },
  "classInsights": {
    "strengths": ["학급의 강점 영역들"],
    "challenges": ["개선이 필요한 영역들"],
    "emergingPatterns": ["새롭게 나타나는 패턴들"],
    "concerningTrends": ["주의깊게 봐야할 경향들"]
  },
  "recommendations": {
    "classroomStrategies": ["교실에서 적용할 수 있는 전략들"],
    "individualSupport": ["개별 학생 지원 방안들"],
    "programSuggestions": ["추천 프로그램들"],
    "parentEngagement": ["학부모 참여 방안들"]
  },
  "studentsNeedingAttention": [
    {
      "name": "익명처리된 학생 표시 (예: 학생A)",
      "concerns": ["구체적 우려사항들"],
      "priority": "high"
    }
  ]
}

**분석 지침:**
1. 학급 전체의 SEL 발달 수준과 패턴을 종합적으로 분석하세요
2. 각 영역별 점수 분포와 평균을 현실적으로 산출하세요
3. 개별 학생 식별 정보는 절대 포함하지 말고 패턴과 경향에 집중하세요
4. 교사가 교실에서 바로 적용할 수 있는 구체적인 전략을 제시하세요
5. 학급 특성을 고려한 맞춤형 권장사항을 제공하세요
6. 주의가 필요한 학생은 익명화하여 표시하세요 (학생A, 학생B 등)

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
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      console.error('Claude API Error:', await response.text());
      throw new Error('Failed to generate class AI analysis');
    }

    const data = await response.json();
    const analysisText = data.content[0].text;
    
    try {
      return JSON.parse(analysisText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', analysisText);
      throw new Error('Failed to parse class AI analysis');
    }

  } catch (error) {
    console.error('Error generating class SEL analysis:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { classCode, startDate, endDate, includeIndividualInsights = false }: ClassReportRequest = await request.json();

    console.log('🏫 [Class Report] 학급 리포트 생성 요청:', {
      classCode,
      startDate,
      endDate,
      includeIndividualInsights
    });

    // 날짜 범위 설정
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // 학생 목록과 설문 응답 조회
    const [students, responses] = await Promise.all([
      studentService.getStudentsByClass(classCode),
      surveyService.getResponsesByClass(classCode, start, end)
    ]);

    console.log('📊 [Class Report] 데이터 조회 완료:', {
      totalStudents: students.length,
      totalResponses: responses.length,
      activeStudents: new Set(responses.map(r => r.studentId)).size
    });

    if (responses.length === 0) {
      return NextResponse.json({
        error: '해당 기간에 학급 설문 응답이 없습니다.',
        classCode,
        period: { start: startDate, end: endDate },
        totalStudents: students.length,
        responseCount: 0
      }, { status: 200 });
    }

    // AI 학급 분석 생성
    const analysis = await generateClassSELAnalysis(students, responses, { start, end });

    const report = {
      classInfo: {
        classCode,
        totalStudents: students.length,
        activeParticipants: new Set(responses.map(r => r.studentId)).size
      },
      period: {
        start: startDate,
        end: endDate,
        duration: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      },
      responseMetrics: {
        totalResponses: responses.length,
        avgResponsesPerStudent: students.length > 0 
          ? Math.round((responses.length / students.length) * 10) / 10 
          : 0,
        responseRate: students.length > 0 
          ? Math.round((new Set(responses.map(r => r.studentId)).size / students.length) * 100) 
          : 0
      },
      analysis,
      generatedAt: new Date().toISOString(),
      includeIndividualInsights
    };

    console.log('✅ [Class Report] 학급 리포트 생성 완료:', {
      classCode,
      totalStudents: students.length,
      responseCount: responses.length,
      recommendationsCount: analysis.recommendations.classroomStrategies.length,
      concerningStudents: analysis.studentsNeedingAttention.length
    });

    return NextResponse.json(report);

  } catch (error) {
    console.error('❌ [Class Report] 학급 리포트 생성 오류:', error);
    return NextResponse.json(
      { error: '학급 AI 리포트 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}