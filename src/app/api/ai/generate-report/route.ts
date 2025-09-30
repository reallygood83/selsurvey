// AI 상담 리포트 생성 API
import { NextRequest, NextResponse } from 'next/server';
import { createGeminiInstance } from '@/lib/gemini';
import { selTemplates, selDomainDescriptions } from '@/data/selTemplates';

// 개인화된 AI 상담 리포트 생성 프롬프트
const PERSONALIZED_COUNSELING_PROMPT = `
당신은 초등학생의 사회정서학습(SEL) 전문 상담사입니다.
다음 학생의 실제 설문 응답을 세밀하게 분석하여 개별 맞춤형 상담 리포트를 작성해주세요.

## 🎯 핵심 분석 요구사항:
- **개별성 중심**: 이 학생만의 고유한 특성과 패턴을 찾아내세요
- **데이터 기반**: 실제 설문 응답 내용을 근거로 구체적 분석
- **질문-답변 매칭**: 학생의 답변과 질문 내용을 연결해서 분석
- **차별화**: 다른 학생과 구별되는 이 학생만의 특징 도출

## 입력 데이터:
학생 기본정보: {studentInfo}
상세 설문 응답들: {detailedResponses}
SEL 영역별 질문 템플릿: {questionTemplates}
분석 기간: {period}

## 필수 분석 관점:
1. **실제 답변 내용 분석**: 학생이 직접 작성한 응답에서 개성과 특성 추출
2. **질문 맥락 이해**: 각 질문의 의미와 학생 답변을 연결해서 해석
3. **감정 패턴 분석**: 시간에 따른 감정 변화와 트리거 요인 분석
4. **SEL 영역별 강약점**: 5개 영역에서 이 학생만의 고유한 프로필 도출
5. **관계와 환경**: 친구관계, 학습환경에서의 개별적 특성

## 출력 형식 (JSON):
{
  "uniqueProfile": "이 학생만의 고유한 특성과 개성을 실제 응답 근거로 3-4문장 서술",
  "strengthsFromData": [
    "실제 설문응답에서 드러난 구체적 강점 1 (응답 예시 포함)",
    "실제 설문응답에서 드러난 구체적 강점 2 (응답 예시 포함)",
    "실제 설문응답에서 드러난 구체적 강점 3 (응답 예시 포함)"
  ],
  "concernsFromData": [
    "응답에서 나타난 관심영역 1 (구체적 응답 내용 인용)",
    "응답에서 나타난 관심영역 2 (구체적 응답 내용 인용)"
  ],
  "personalizedStrategies": [
    "이 학생의 특성에 맞춘 맞춤형 전략 1",
    "이 학생의 특성에 맞춘 맞춤형 전략 2",
    "이 학생의 특성에 맞춘 맞춤형 전략 3"
  ],
  "classroomApproach": [
    "이 학생을 위한 교실 내 개별 접근법 1",
    "이 학생을 위한 교실 내 개별 접근법 2",
    "이 학생을 위한 교실 내 개별 접근법 3"
  ],
  "parentGuidance": [
    "이 학생의 특성을 고려한 가정 지원 방안 1",
    "이 학생의 특성을 고려한 가정 지원 방안 2",
    "이 학생의 특성을 고려한 가정 지원 방안 3"
  ],
  "specificGoals": [
    "이 학생을 위한 구체적 단기 목표 1",
    "이 학생을 위한 구체적 중기 목표 2",
    "이 학생을 위한 구체적 장기 목표 3"
  ],
  "evidenceQuotes": [
    "분석 근거가 된 학생 응답 인용 1",
    "분석 근거가 된 학생 응답 인용 2",
    "분석 근거가 된 학생 응답 인용 3"
  ]
}

## 필수 준수사항:
- 반드시 실제 설문 응답 내용을 인용하고 분석 근거로 제시
- 일반적인 조언이 아닌 이 학생만을 위한 맞춤형 내용
- 학생의 실제 말이나 표현을 적극 활용
- 데이터에서 도출되지 않은 추측이나 일반론 금지
- 질문과 답변의 맥락을 정확히 연결해서 해석

반드시 JSON 형식으로만 응답하고, 이 학생만을 위한 개별화된 상담 리포트를 작성해주세요.
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

    // 🔥 핵심 개선: 질문-답변 매칭 처리
    const enhanceResponsesWithQuestions = (responses: SurveyResponse[], grade: number) => {
      const template = grade <= 4 ? selTemplates[0] : selTemplates[1];
      
      return responses.map(response => ({
        ...response,
        responses: response.responses.map((resp) => {
          const question = template.questions.find(q => q.id === resp.questionId);
          return {
            ...resp,
            questionText: question?.question || `질문 ID: ${resp.questionId}`,
            questionType: question?.type || 'unknown',
            subCategory: question?.subCategory || null,
            scaleLabels: question?.scaleLabels || null,
            options: question?.options || null
          };
        })
      }));
    };

    const enhancedResponses = enhanceResponsesWithQuestions(responses || [], student.grade);

    // 학년에 맞는 질문 템플릿 선택
    const questionTemplate = student.grade <= 4 ? selTemplates[0] : selTemplates[1];

    // Gemini 모델 인스턴스 생성
    const geminiModel = createGeminiInstance(apiKey);

    // 🔥 핵심 개선: 개인화된 프롬프트 데이터 준비
    const promptData = PERSONALIZED_COUNSELING_PROMPT
      .replace('{studentInfo}', JSON.stringify({
        name: student.name,
        grade: student.grade,
        participationRate: student.participationRate,
        totalResponses: student.totalResponses,
        joinedDate: student.joinedAt
      }))
      .replace('{detailedResponses}', JSON.stringify(enhancedResponses))
      .replace('{questionTemplates}', JSON.stringify({
        templateInfo: questionTemplate,
        domainDescriptions: selDomainDescriptions
      }))
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

      // 🔥 핵심 개선: 생성된 리포트를 DB에 자동 저장
      try {
        const saveResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai-reports/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentId: student.id || student.userId,
            teacherId: student.teacherId,
            studentName: student.name,
            grade: student.grade,
            classCode: student.classCode,
            reportData,
            analysisDataSource: {
              responsesCount: responses?.length || 0,
              analysesCount: analyses?.length || 0,
              period: period || '최근 활동'
            }
          }),
        });

        if (saveResponse.ok) {
          const saveResult = await saveResponse.json();
          console.log('💾 리포트 DB 저장 성공:', saveResult.reportId);
          
          // 저장 성공 시 reportId 포함하여 응답
          return NextResponse.json({
            ...reportData,
            savedReportId: saveResult.reportId,
            isPersonalized: saveResult.isPersonalized
          });
        } else {
          console.warn('⚠️ 리포트 DB 저장 실패, 리포트는 정상 반환');
        }
      } catch (saveError) {
        console.warn('⚠️ 리포트 DB 저장 중 오류, 리포트는 정상 반환:', saveError);
      }
      
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