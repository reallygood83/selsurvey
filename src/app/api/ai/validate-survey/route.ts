// AI 설문 품질 검증 및 개선 제안 API
import { NextRequest, NextResponse } from 'next/server';
import { createGeminiInstance } from '@/lib/gemini';
import { selDomainDescriptions } from '@/data/selTemplates';

export async function POST(request: NextRequest) {
  try {
    const { survey, apiKey, validationType = 'comprehensive' } = await request.json();

    if (!survey || !apiKey) {
      return NextResponse.json(
        { error: '설문 데이터와 API 키가 필요합니다.' },
        { status: 400 }
      );
    }

    // API 키 유효성 검사
    if (!apiKey.startsWith('AIza') || apiKey.length < 20) {
      return NextResponse.json(
        { 
          error: '유효하지 않은 Gemini API 키입니다.',
          help: 'Google AI Studio에서 발급받은 올바른 API 키를 입력해주세요.'
        },
        { status: 400 }
      );
    }

    const model = createGeminiInstance(apiKey);

    // 설문 데이터 정리
    const surveyData = {
      title: survey.title,
      description: survey.description,
      grade: survey.grade,
      estimatedTime: survey.estimatedTime,
      questionCount: survey.questions?.length || 0,
      questions: survey.questions?.map((q: any, index: number) => ({
        id: q.id,
        order: index + 1,
        question: q.question,
        type: q.type,
        selDomain: q.selDomain,
        options: q.options || [],
        required: q.required,
        subCategory: q.subCategory || '',
        analysisWeight: q.analysisWeight || 3
      })) || []
    };

    // SEL 영역 분포 계산
    const domainDistribution = surveyData.questions.reduce((acc: any, q: any) => {
      acc[q.selDomain] = (acc[q.selDomain] || 0) + 1;
      return acc;
    }, {});

    // 질문 유형 분포 계산
    const typeDistribution = surveyData.questions.reduce((acc: any, q: any) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {});

    // SEL 영역별 정보
    const selDomainsInfo = Object.entries(selDomainDescriptions).map(([key, value]) => 
      `${key} (${value.name}): ${value.description}`
    ).join('\n');

    // 검증 프롬프트 생성
    const validationPrompt = `
당신은 초등학교 사회정서학습(SEL) 설문 전문가입니다. 다음 설문의 품질을 종합적으로 검증하고 개선안을 제시해주세요.

## 설문 정보:
제목: ${surveyData.title}
설명: ${surveyData.description}
대상: ${surveyData.grade}학년
예상 소요시간: ${surveyData.estimatedTime}분
총 질문 수: ${surveyData.questionCount}개

## SEL 영역 분포:
${Object.entries(domainDistribution).map(([domain, count]) => `${domain}: ${count}개`).join('\n')}

## 질문 유형 분포:
${Object.entries(typeDistribution).map(([type, count]) => `${type}: ${count}개`).join('\n')}

## SEL 영역 설명:
${selDomainsInfo}

## 설문 질문들:
${surveyData.questions.map((q: any) => 
  `Q${q.order}. [${q.selDomain}/${q.type}] ${q.question} ${q.options?.length ? `(선택지: ${q.options.length}개)` : ''}`
).join('\n')}

## 검증 항목:
1. **SEL 영역 균형성**: 5개 영역이 적절히 분배되었는가?
2. **연령 적합성**: ${surveyData.grade}학년 수준에 맞는 언어와 내용인가?
3. **질문 품질**: 명확하고 이해하기 쉬운 질문인가?
4. **측정 타당성**: 각 질문이 해당 SEL 영역을 정확히 측정하는가?
5. **응답 용이성**: 학생이 솔직하게 답할 수 있는 질문인가?
6. **설문 구조**: 전체적인 흐름과 논리성이 적절한가?
7. **소요시간**: 예상 시간이 적절한가?
8. **리포트 활용성**: 상담 리포트 생성에 유용한 데이터를 수집할 수 있는가?

## 응답 형식 (JSON):
{
  "overallScore": 85,  // 전체 점수 (0-100)
  "validationResults": {
    "selBalance": {
      "score": 80,
      "status": "good|warning|poor",
      "feedback": "구체적인 피드백",
      "suggestions": ["개선 제안1", "개선 제안2"]
    },
    "ageAppropriate": {
      "score": 90,
      "status": "good|warning|poor", 
      "feedback": "구체적인 피드백",
      "suggestions": ["개선 제안1"]
    },
    "questionQuality": {
      "score": 85,
      "status": "good|warning|poor",
      "feedback": "구체적인 피드백",
      "suggestions": ["개선 제안1", "개선 제안2"]
    },
    "measurementValidity": {
      "score": 88,
      "status": "good|warning|poor",
      "feedback": "구체적인 피드백", 
      "suggestions": ["개선 제안1"]
    },
    "responseEase": {
      "score": 92,
      "status": "good|warning|poor",
      "feedback": "구체적인 피드백",
      "suggestions": []
    },
    "surveyStructure": {
      "score": 87,
      "status": "good|warning|poor",
      "feedback": "구체적인 피드백",
      "suggestions": ["개선 제안1"]
    },
    "timeEstimate": {
      "score": 90,
      "status": "good|warning|poor",
      "feedback": "구체적인 피드백",
      "suggestions": []
    },
    "reportUtility": {
      "score": 85,
      "status": "good|warning|poor", 
      "feedback": "구체적인 피드백",
      "suggestions": ["개선 제안1", "개선 제안2"]
    }
  },
  "strengths": [
    "잘 설계된 부분1",
    "잘 설계된 부분2",
    "잘 설계된 부분3"
  ],
  "improvements": [
    {
      "priority": "high|medium|low",
      "category": "selBalance|ageAppropriate|questionQuality|etc",
      "issue": "문제점 설명",
      "solution": "구체적인 해결 방안",
      "exampleQuestion": "개선된 질문 예시 (필요한 경우)"
    }
  ],
  "recommendedActions": [
    "즉시 수정이 필요한 항목",
    "고려해볼 개선사항",
    "추가로 포함하면 좋을 요소"
  ]
}

각 항목에 대해 구체적이고 실용적인 피드백을 제공해주세요. 점수는 객관적 기준에 따라 정확히 산정하고, 개선 제안은 실제로 적용 가능한 것으로 해주세요.
`;

    // AI 검증 실행
    const result = await model.generateContent(validationPrompt);
    const response = await result.response;
    let text = response.text();

    // JSON 부분 추출
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('올바른 JSON 형식의 검증 결과를 받지 못했습니다.');
    }

    let validationResult;
    try {
      validationResult = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      throw new Error('검증 결과 데이터의 형식이 올바르지 않습니다.');
    }

    // 추가 분석 데이터 포함
    const enhancedResult = {
      ...validationResult,
      metadata: {
        surveyId: survey.id,
        validatedAt: new Date().toISOString(),
        validationType: validationType,
        domainDistribution: domainDistribution,
        typeDistribution: typeDistribution,
        questionCount: surveyData.questionCount,
        estimatedTime: surveyData.estimatedTime
      }
    };

    return NextResponse.json({ 
      success: true, 
      validation: enhancedResult
    });

  } catch (error: any) {
    console.error('설문 검증 오류:', error);
    
    let errorDetails = error.message;
    let helpMessage = '';

    if (error.message.includes('API key')) {
      helpMessage = 'API 키를 확인하고 다시 시도해주세요.';
    } else if (error.message.includes('JSON')) {
      helpMessage = 'AI 응답 형식에 문제가 있습니다. 다시 시도해주세요.';
    } else if (error.message.includes('quota')) {
      helpMessage = 'API 사용량 한도에 도달했습니다. 잠시 후 다시 시도해주세요.';
    }

    return NextResponse.json(
      { 
        error: '설문 검증 중 오류가 발생했습니다.',
        details: errorDetails,
        help: helpMessage
      },
      { status: 500 }
    );
  }
}