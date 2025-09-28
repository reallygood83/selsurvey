// Gemini AI 설정 및 SEL 분석 프롬프트
import { GoogleGenerativeAI } from '@google/generative-ai';

// 사용자별 Gemini AI 인스턴스 생성 함수
export function createGeminiInstance(apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  return genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.3,
      topP: 0.8,
      maxOutputTokens: 2048,
    }
  });
}

// 기본 모델 (환경변수 사용) - 개발용
const defaultApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyARRqhuICxrAl917lhbk2OatZdsEgRpXxM';
export const model = createGeminiInstance(defaultApiKey);

// SEL 영역별 분석 프롬프트 템플릿
export const SEL_ANALYSIS_PROMPT = `
당신은 초등학생의 사회정서학습(SEL) 전문 분석가입니다. 
다음 설문 응답을 바탕으로 SEL 5개 영역의 발달 수준을 평가해주세요.

## 분석 기준:
- 발달 단계: 미숙(1-2점), 발달중(3점), 적절(4점), 우수(5점)
- 연령별 발달 기준 적용 (초등 {grade}학년)
- 문화적 배경 고려
- 개별 차이 인정
- 긍정적이고 건설적인 관점으로 분석

## SEL 5개 영역:
1. 자기인식 (Self-Awareness)
2. 자기관리 (Self-Management)
3. 사회적 인식 (Social Awareness)
4. 관계 기술 (Relationship Skills)
5. 책임감 있는 의사결정 (Responsible Decision-Making)

## 입력 데이터:
학생 정보: {studentInfo}
설문 응답: {responses}
이전 데이터: {previousData}

## 출력 형식 (JSON):
{
  "scores": {
    "selfAwareness": 점수(1-5),
    "selfManagement": 점수(1-5),
    "socialAwareness": 점수(1-5),
    "relationshipSkills": 점수(1-5),
    "responsibleDecisionMaking": 점수(1-5)
  },
  "strengths": ["강점 영역 1", "강점 영역 2"],
  "growthAreas": ["성장 필요 영역 1", "성장 필요 영역 2"],
  "observations": "구체적 관찰 내용 (100자 내외)",
  "recommendations": ["권장사항 1", "권장사항 2", "권장사항 3"],
  "emotionalPattern": "감정 패턴 분석 (50자 내외)",
  "supportStrategy": "지원 전략 (100자 내외)"
}

반드시 JSON 형식으로만 응답하고, 학생의 연령에 맞는 발달 수준을 고려하여 긍정적이고 건설적인 분석을 제공해주세요.
`;

// 교사용 리포트 생성 프롬프트
export const TEACHER_REPORT_PROMPT = `
당신은 초등학교 교사를 위한 SEL 리포트 작성 전문가입니다.
다음 학급 데이터를 바탕으로 교사용 종합 리포트를 작성해주세요.

## 입력 데이터:
학급 정보: {classInfo}
학생 데이터: {studentData}
기간: {period}

## 출력 형식 (JSON):
{
  "classOverview": {
    "totalStudents": 총 학생 수,
    "averageScores": {각 SEL 영역별 평균 점수},
    "classStrengths": ["학급 강점 1", "학급 강점 2"],
    "attentionAreas": ["관심 필요 영역 1", "관심 필요 영역 2"]
  },
  "studentSummaries": [
    {
      "studentId": "학생ID",
      "name": "학생명",
      "summary": "3줄 요약",
      "keyObservations": "주요 관찰사항",
      "classroomSupport": "교실 지원 방안"
    }
  ],
  "teachingRecommendations": [
    {
      "activity": "SEL 활동명",
      "description": "활동 설명",
      "targetArea": "대상 영역",
      "duration": "소요 시간"
    }
  ],
  "environmentSuggestions": ["환경 조성 방안 1", "환경 조성 방안 2"],
  "peerRelationshipStrategies": ["또래 관계 지원 전략 1", "또래 관계 지원 전략 2"]
}

교사가 실제 교실에서 바로 활용할 수 있는 구체적이고 실용적인 내용으로 작성해주세요.
`;

// 학부모용 리포트 생성 프롬프트
export const PARENT_REPORT_PROMPT = `
당신은 학부모를 위한 자녀 SEL 발달 리포트 작성 전문가입니다.
다음 자녀 데이터를 바탕으로 학부모용 성장 리포트를 작성해주세요.

## 입력 데이터:
자녀 정보: {childInfo}
SEL 분석 결과: {selAnalysis}
성장 추이: {growthTrend}

## 출력 형식 (JSON):
{
  "childDevelopment": {
    "currentStatus": "현재 발달 상황 (긍정적 표현)",
    "monthlyChanges": "지난 달 대비 변화",
    "peerComparison": "또래 대비 위치 (민감하게 표현)"
  },
  "homeSupport": [
    {
      "method": "지원 방법",
      "description": "구체적 실천 방안",
      "example": "실제 예시"
    }
  ],
  "conversationTips": [
    {
      "situation": "대화 상황",
      "approach": "접근 방법",
      "sampleWords": "예시 대화"
    }
  ],
  "dailyActivities": [
    {
      "activity": "일상 활동",
      "selConnection": "SEL 연계 포인트",
      "implementation": "실행 방법"
    }
  ],
  "growthStory": {
    "meaningfulChanges": "의미있는 변화 사례",
    "childStrengths": "자녀의 강점",
    "encouragementMessage": "격려 메시지"
  }
}

학부모가 자녀를 이해하고 가정에서 실천할 수 있는 따뜻하고 구체적인 내용으로 작성해주세요.
`;

// Gemini AI 분석 함수 (사용자 API 키 지원)
export async function analyzeSELData(studentInfo: Record<string, unknown>, responses: Record<string, unknown>, previousData: Record<string, unknown> | null = null, userApiKey?: string) {
  try {
    // 사용자 API 키가 있으면 사용, 없으면 기본 모델 사용
    const geminiModel = userApiKey ? createGeminiInstance(userApiKey) : model;
    
    const prompt = SEL_ANALYSIS_PROMPT
      .replace('{grade}', String(studentInfo.grade))
      .replace('{studentInfo}', JSON.stringify(studentInfo))
      .replace('{responses}', JSON.stringify(responses))
      .replace('{previousData}', JSON.stringify(previousData));

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // JSON 파싱 시도
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      // 기본 분석 결과 반환
      return {
        scores: {
          selfAwareness: 3,
          selfManagement: 3,
          socialAwareness: 3,
          relationshipSkills: 3,
          responsibleDecisionMaking: 3
        },
        strengths: ["분석 진행 중"],
        growthAreas: ["분석 진행 중"],
        observations: "데이터 분석이 진행 중입니다.",
        recommendations: ["지속적인 관찰", "긍정적 격려", "개별 관심"],
        emotionalPattern: "분석 진행 중",
        supportStrategy: "개별 맞춤 지원 계획 수립 예정"
      };
    }
  } catch (error) {
    console.error('Gemini API 오류:', error);
    throw new Error('SEL 분석 중 오류가 발생했습니다.');
  }
}

// 교사용 리포트 생성 함수 (사용자 API 키 지원)
export async function generateTeacherReport(classInfo: Record<string, unknown>, studentData: Record<string, unknown>, period: string, userApiKey?: string) {
  try {
    const geminiModel = userApiKey ? createGeminiInstance(userApiKey) : model;
    
    const prompt = TEACHER_REPORT_PROMPT
      .replace('{classInfo}', JSON.stringify(classInfo))
      .replace('{studentData}', JSON.stringify(studentData))
      .replace('{period}', period);

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return JSON.parse(text);
  } catch (error) {
    console.error('교사 리포트 생성 오류:', error);
    throw new Error('교사 리포트 생성 중 오류가 발생했습니다.');
  }
}

// 학부모용 리포트 생성 함수 (사용자 API 키 지원)
export async function generateParentReport(childInfo: Record<string, unknown>, selAnalysis: Record<string, unknown>, growthTrend: Record<string, unknown>, userApiKey?: string) {
  try {
    const geminiModel = userApiKey ? createGeminiInstance(userApiKey) : model;
    
    const prompt = PARENT_REPORT_PROMPT
      .replace('{childInfo}', JSON.stringify(childInfo))
      .replace('{selAnalysis}', JSON.stringify(selAnalysis))
      .replace('{growthTrend}', JSON.stringify(growthTrend));

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return JSON.parse(text);
  } catch (error) {
    console.error('학부모 리포트 생성 오류:', error);
    throw new Error('학부모 리포트 생성 중 오류가 발생했습니다.');
  }
}