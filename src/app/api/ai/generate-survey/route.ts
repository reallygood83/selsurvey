// GEMINI API를 활용한 SEL 설문 자동 생성 (고도화 버전)
import { NextRequest, NextResponse } from 'next/server';
import { createGeminiInstance } from '@/lib/gemini';
import { selDomainDescriptions } from '@/data/selTemplates';

export async function POST(request: NextRequest) {
  try {
    const { 
      prompt, 
      grade, 
      apiKey, 
      surveyType = 'SEL',
      questionCount = 12,
      focusAreas = [],
      includeOpenQuestions = true,
      difficulty = 'standard'
    } = await request.json();

    if (!prompt || !grade || !apiKey) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다. 설문 주제, 학년, API 키를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // API 키 유효성 검사
    if (!apiKey.startsWith('AIza') || apiKey.length < 20) {
      return NextResponse.json(
        { 
          error: '유효하지 않은 Gemini API 키입니다.',
          details: 'Google AI Studio에서 발급받은 올바른 API 키를 입력해주세요.',
          help: 'API 키 발급 방법: https://aistudio.google.com/app/apikey'
        },
        { status: 400 }
      );
    }

    // 사용자 제공 API 키로 Gemini 인스턴스 생성
    const model = createGeminiInstance(apiKey);

    // SEL 영역별 상세 정보 포함
    const selDomainsInfo = Object.entries(selDomainDescriptions).map(([key, value]) => 
      `${key} (${value.name}): ${value.description}`
    ).join('\n');

    // 학년별 맞춤 지침
    const gradeGuidelines = grade === '3-4' ? {
      language: '초등 3-4학년 수준의 쉽고 명확한 표현',
      situations: '구체적이고 일상적인 상황',
      concepts: '단순하고 직관적인 개념',
      questionLength: '짧고 간단한 문장 (15자 이내)',
      examples: '학교, 가족, 친구 관계 중심의 구체적 상황'
    } : {
      language: '초등 5-6학년 수준의 다소 복잡한 표현',
      situations: '추상적이고 심화된 상황',
      concepts: '복합적이고 심층적인 개념',
      questionLength: '상세하고 명확한 문장 (25자 이내)',
      examples: '미래 계획, 도덕적 판단, 복잡한 인간관계 포함'
    };

    // 고도화된 SEL 설문 생성 프롬프트
    const systemPrompt = `
당신은 초등학교 사회정서학습(SEL) 전문 연구자이자 상담심리사입니다. 
다음 지침에 따라 교육적으로 검증된 고품질 SEL 설문을 생성해주세요.

## SEL 5개 핵심 영역:
${selDomainsInfo}

## 학년별 맞춤 지침 (${grade}학년):
- 언어 수준: ${gradeGuidelines.language}
- 상황 설정: ${gradeGuidelines.situations}
- 개념 복잡도: ${gradeGuidelines.concepts}
- 질문 길이: ${gradeGuidelines.questionLength}
- 예시 중심: ${gradeGuidelines.examples}

## 설문 유형별 기준:
- **scale**: 5점 척도 (1=전혀 그렇지 않다, 2=그렇지 않다, 3=보통이다, 4=그렇다, 5=매우 그렇다)
- **multipleChoice**: 3-5개 현실적 선택지 (학생들이 실제로 선택할 수 있는 구체적 옵션)
- **emotion**: 감정 상태 선택 (😊기쁨, 😢슬픔, 😠화남, 😰불안, 😐평온, 🤗흥분, 😔우울, 😌만족)
- **text**: 주관식 서술 (선택적, 깊이 있는 자기성찰용)

## 품질 기준:
1. **교육적 타당성**: 각 질문이 해당 SEL 영역을 정확히 측정
2. **연령 적합성**: ${grade}학년 학생이 이해하고 답할 수 있는 수준
3. **문화적 적절성**: 한국 초등학교 환경에 맞는 상황과 표현
4. **리포트 활용성**: 개별 학생 상담 리포트 생성에 유용한 데이터 수집
5. **균형성**: 5개 SEL 영역을 고르게 다루며, 다양한 질문 유형 포함

## 필수 출력 형식 (JSON):
{
  "title": "구체적이고 매력적인 설문 제목 (예: 우리 반 마음 건강 체크)",
  "description": "학생과 학부모가 이해할 수 있는 설문 목적과 소요시간 안내",
  "estimatedTime": ${Math.max(8, Math.min(20, questionCount * 1.5))},
  "grade": "${grade}",
  "focusAreas": ["${focusAreas.length > 0 ? focusAreas.join('", "') : 'selfAwareness", "selfManagement", "socialAwareness", "relationshipSkills", "responsibleDecisionMaking'}"],
  "questions": [
    {
      "id": "q001",
      "question": "명확하고 구체적인 질문 내용",
      "type": "scale|multipleChoice|emotion|text",
      "options": ["선택지1", "선택지2", "..."] (multipleChoice, emotion 타입만 필수),
      "selDomain": "정확한 SEL 영역",
      "required": true|false,
      "subCategory": "세부 측정 영역 (예: 감정인식, 갈등해결)",
      "analysisWeight": 1-5 (리포트 분석 시 중요도)
    }
  ]
}

## 생성 요구사항:
- 총 질문 수: ${questionCount}개 (${includeOpenQuestions ? '주관식 2-3개 포함' : '객관식 위주'})
- SEL 영역 분배: ${focusAreas.length > 0 ? `중점 영역(${focusAreas.join(', ')}) 강화` : '5개 영역 균등 분배'}
- 난이도: ${difficulty} (쉬움/표준/어려움)
- 각 영역별 최소 2문항 보장
- 리포트 생성에 핵심적인 질문에는 analysisWeight 4-5 부여
- 모든 질문은 학생의 솔직한 응답을 유도할 수 있도록 구성

## 특별 지침:
${grade === '3-4' ? 
  '- 구체적이고 단순한 상황 중심\n- "나는..." 형태의 자기 보고식 질문\n- 일상생활 경험 기반 문항' : 
  '- 복합적이고 상황적 판단 필요한 문항\n- 자기성찰과 메타인지 능력 측정\n- 미래 지향적이고 가치관 관련 질문'
}`;

    const fullPrompt = `${systemPrompt}\n\n## 사용자 맞춤 요청:\n**주제**: ${prompt}\n**특별 요구사항**: ${surveyType !== 'SEL' ? surveyType : '표준 SEL 설문'}\n\n위 지침에 따라 교육현장에서 바로 사용할 수 있는 고품질 SEL 설문을 JSON 형식으로 생성해주세요.`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // JSON 부분만 추출 (더 정확한 파싱)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('올바른 JSON 형식의 응답을 받지 못했습니다.');
    }

    let generatedSurvey;
    try {
      generatedSurvey = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      throw new Error('생성된 설문 데이터의 형식이 올바르지 않습니다.');
    }

    // 데이터 검증 및 보완
    if (!generatedSurvey.questions || generatedSurvey.questions.length === 0) {
      throw new Error('생성된 설문에 질문이 없습니다.');
    }

    // 질문 ID 자동 생성 및 검증
    generatedSurvey.questions = generatedSurvey.questions.map((q: Record<string, unknown>, index: number) => ({
      ...q,
      id: q.id || `ai_q_${Date.now()}_${index + 1}`,
      required: q.required !== false, // 기본값 true
      analysisWeight: q.analysisWeight || 3,
      subCategory: q.subCategory || '일반',
      order: index + 1
    }));

    // SEL 영역 분포 검증
    const domainCounts = generatedSurvey.questions.reduce((acc: Record<string, number>, q: Record<string, unknown>) => {
      const domain = q.selDomain as string;
      acc[domain] = (acc[domain] || 0) + 1;
      return acc;
    }, {});

    console.log('생성된 설문 SEL 영역 분포:', domainCounts);

    // 최종 설문 데이터 구성
    const survey = {
      id: `ai-generated-${Date.now()}`,
      grade: grade,
      tags: ['AI생성', 'SEL', `${grade}학년`, surveyType, '맞춤형'],
      generatedAt: new Date().toISOString(),
      metadata: {
        promptUsed: prompt,
        questionCount: generatedSurvey.questions.length,
        domainDistribution: domainCounts,
        focusAreas: focusAreas,
        difficulty: difficulty
      },
      ...generatedSurvey
    };

    return NextResponse.json({ 
      success: true, 
      survey: survey,
      metadata: {
        generatedQuestions: survey.questions.length,
        selDistribution: domainCounts,
        estimatedTime: survey.estimatedTime
      }
    });

  } catch (error: unknown) {
    console.error('설문 생성 오류:', error);
    
    // 상세한 오류 정보 제공
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = errorMessage;
    let helpMessage = '';

    if (errorMessage.includes('API key')) {
      helpMessage = 'Google AI Studio에서 새로운 API 키를 발급받아 시도해주세요.';
    } else if (errorMessage.includes('JSON')) {
      helpMessage = 'AI 응답 형식에 문제가 있습니다. 다시 시도해주세요.';
    } else if (errorMessage.includes('quota')) {
      helpMessage = 'API 사용량 한도에 도달했습니다. 잠시 후 다시 시도해주세요.';
    }

    return NextResponse.json(
      { 
        error: '설문 생성 중 오류가 발생했습니다.',
        details: errorDetails,
        help: helpMessage,
        suggestion: '문제가 계속되면 더 간단한 주제로 다시 시도해보세요.'
      },
      { status: 500 }
    );
  }
}