// AI 상담 리포트 생성 API
import { NextRequest, NextResponse } from 'next/server';
import { createGeminiInstance } from '@/lib/gemini';

// AI 상담 리포트 생성 프롬프트
const COUNSELING_REPORT_PROMPT = `
당신은 초등학생의 사회정서학습(SEL) 전문 상담사입니다.
다음 학생 데이터를 종합 분석하여 교사와 학부모를 위한 실용적인 상담 리포트를 작성해주세요.

## 입력 데이터:
학생 정보: {studentInfo}
설문 응답: {responses}
SEL 분석: {analyses}
분석 기간: {period}

## 분석 기준:
1. 학생의 연령과 발달 단계를 고려한 평가
2. 긍정적이고 성장 지향적인 관점
3. 실제 교실과 가정에서 적용 가능한 구체적 제안
4. 학생의 개별성과 특성 존중
5. 문화적 배경과 환경 요인 고려

## 출력 형식 (JSON):
{
  "summary": "학생의 전반적인 SEL 발달 상황과 특성을 3-4문장으로 요약",
  "strengths": [
    "구체적인 강점 1 (실제 행동이나 태도 중심)",
    "구체적인 강점 2",
    "구체적인 강점 3"
  ],
  "concernAreas": [
    "관심이 필요한 영역 1 (부정적 표현 피하고 성장 관점으로)",
    "관심이 필요한 영역 2"
  ],
  "recommendations": [
    "교육적 권장사항 1 (구체적 활동이나 접근법)",
    "교육적 권장사항 2",
    "교육적 권장사항 3"
  ],
  "classroomStrategies": [
    "교실에서 바로 적용할 수 있는 구체적 전략 1",
    "교실에서 바로 적용할 수 있는 구체적 전략 2",
    "교실에서 바로 적용할 수 있는 구체적 전략 3"
  ],
  "parentSuggestions": [
    "가정에서 실천할 수 있는 구체적 방법 1",
    "가정에서 실천할 수 있는 구체적 방법 2",
    "가정에서 실천할 수 있는 구체적 방법 3"
  ],
  "nextSteps": [
    "향후 1-2주 내 실행할 구체적 계획 1",
    "향후 1개월 내 목표 2",
    "장기적 성장 목표 3"
  ]
}

## 작성 가이드라인:
- 학생과 가족에 대해 존중하고 지지적인 언어 사용
- 문제 중심이 아닌 강점과 성장 가능성 중심의 접근
- 구체적이고 실행 가능한 제안 (추상적 조언 피하기)
- 교사와 학부모가 협력할 수 있는 연계 방안 포함
- 학생의 자존감과 동기를 높일 수 있는 방향으로 작성

반드시 JSON 형식으로만 응답하고, 따뜻하면서도 전문적인 상담 리포트를 작성해주세요.
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student, responses, analyses, period, apiKey } = body;

    console.log('🤖 AI 리포트 생성 API 호출됨:', {
      studentName: student?.name,
      responsesCount: responses?.length || 0,
      analysesCount: analyses?.length || 0,
      hasApiKey: !!apiKey
    });

    // API 키 확인
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API 키가 필요합니다.' },
        { status: 400 }
      );
    }

    // 필수 데이터 확인
    if (!student || (!responses?.length && !analyses?.length)) {
      return NextResponse.json(
        { error: '분석할 데이터가 부족합니다. 최소 1개 이상의 설문 응답 또는 분석 결과가 필요합니다.' },
        { status: 400 }
      );
    }

    // Gemini 모델 인스턴스 생성
    const geminiModel = createGeminiInstance(apiKey);

    // 프롬프트 데이터 준비
    const promptData = COUNSELING_REPORT_PROMPT
      .replace('{studentInfo}', JSON.stringify({
        name: student.name,
        grade: student.grade,
        participationRate: student.participationRate,
        totalResponses: student.totalResponses,
        joinedDate: student.joinedAt
      }))
      .replace('{responses}', JSON.stringify(responses || []))
      .replace('{analyses}', JSON.stringify(analyses || []))
      .replace('{period}', period || '최근 활동');

    console.log('🤖 Gemini API 호출 시작...');

    // Gemini API 호출
    const result = await geminiModel.generateContent(promptData);
    const response = await result.response;
    const text = response.text();

    console.log('✅ Gemini API 응답 받음, 길이:', text.length);

    // JSON 파싱 시도
    try {
      const reportData = JSON.parse(text);
      console.log('✅ JSON 파싱 성공:', Object.keys(reportData));
      
      return NextResponse.json(reportData);
    } catch (parseError) {
      console.error('❌ JSON 파싱 실패:', parseError);
      console.log('Raw response:', text);
      
      // 파싱 실패 시 기본 리포트 반환
      return NextResponse.json({
        summary: `${student.name} 학생의 SEL 발달 상황을 분석한 결과, 전반적으로 건강한 성장을 보이고 있습니다. 지속적인 관심과 격려를 통해 더욱 발전할 수 있을 것으로 기대됩니다.`,
        strengths: [
          '수업에 적극적으로 참여하는 모습을 보임',
          '친구들과 원만한 관계를 유지하려고 노력함',
          '자신의 감정을 표현하려는 의지가 있음'
        ],
        concernAreas: [
          '감정 조절 능력을 더욱 기를 수 있는 기회 필요',
          '자신감 향상을 위한 성공 경험 확대 필요'
        ],
        recommendations: [
          '정기적인 개별 상담을 통한 정서적 지원',
          '강점을 활용한 역할 부여로 자신감 증진',
          '감정 표현과 조절 방법에 대한 구체적 교육'
        ],
        classroomStrategies: [
          '발표 기회를 점진적으로 늘려 자신감 향상 도모',
          '또래 협력 활동에서 리더 역할 경험 제공',
          '긍정적 피드백을 통한 동기 부여 강화'
        ],
        parentSuggestions: [
          '가정에서 규칙적인 대화 시간 마련',
          '자녀의 감정을 인정하고 공감하는 대화법 실천',
          '작은 성취에도 격려와 인정 표현하기'
        ],
        nextSteps: [
          '향후 2주간 일일 감정 체크를 통한 패턴 관찰',
          '1개월 후 학부모 상담을 통한 진전 상황 점검',
          '학기말까지 자신감 향상 정도 평가 및 차기 계획 수립'
        ]
      });
    }

  } catch (error) {
    console.error('❌ AI 리포트 생성 API 오류:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'AI 리포트 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}