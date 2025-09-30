// 🔥 강화된 AI 상담 리포트 생성 API - 3단계 fallback 매칭 시스템
import { NextRequest, NextResponse } from 'next/server';
import { createGeminiInstance } from '@/lib/gemini';
import { selTemplates, selDomainDescriptions } from '@/data/selTemplates';
import { SurveyResponse } from '@/types';

// 🔥 핵심 개선: 3단계 Fallback 질문 매칭 시스템 (컴포넌트와 동일)
interface QuestionMatchResult {
  questionText: string;
  questionType: string;
  subCategory?: string;
  scaleLabels?: { min: string; max: string };
  options?: string[];
  matchStatus: 'exact' | 'grade-fallback' | 'cross-fallback' | 'not-found';
  sourceTemplate: string;
  confidence: number; // 0-100%
}

const findQuestionWithEnhancedFallback = (questionId: string, responseGrade: number): QuestionMatchResult => {
  console.log(`🔍 [API] 질문 매칭 시작: ID=${questionId}, 학년=${responseGrade}`);
  
  // 1단계: 정확한 학년 템플릿에서 매칭 시도
  const primaryTemplate = responseGrade <= 4 ? selTemplates[0] : selTemplates[1];
  let question = primaryTemplate.questions.find(q => q.id === questionId);
  
  if (question) {
    console.log(`✅ [API] 1단계 매칭 성공: ${primaryTemplate.title}`);
    return {
      questionText: question.question,
      questionType: question.type,
      subCategory: question.subCategory,
      scaleLabels: question.scaleLabels,
      options: question.options,
      matchStatus: 'exact',
      sourceTemplate: primaryTemplate.title,
      confidence: 100
    };
  }

  // 2단계: 다른 학년 템플릿에서 매칭 시도
  const secondaryTemplate = responseGrade <= 4 ? selTemplates[1] : selTemplates[0];
  question = secondaryTemplate.questions.find(q => q.id === questionId);
  
  if (question) {
    console.log(`⚠️ [API] 2단계 매칭 성공: ${secondaryTemplate.title} (크로스 매칭)`);
    return {
      questionText: question.question,
      questionType: question.type,
      subCategory: question.subCategory,
      scaleLabels: question.scaleLabels,
      options: question.options,
      matchStatus: 'cross-fallback',
      sourceTemplate: secondaryTemplate.title,
      confidence: 75
    };
  }

  // 3단계: 모든 템플릿에서 부분 매칭 시도 (ID 유사성 검사)
  for (const template of selTemplates) {
    const similarQuestion = template.questions.find(q => 
      q.id.startsWith(questionId.substring(0, 2)) || // 같은 영역 (sa, sm, soa, rs, rdm)
      q.id.includes(questionId.substring(0, 3))      // 더 세밀한 매칭
    );
    
    if (similarQuestion) {
      console.log(`⚠️ [API] 3단계 매칭 성공: ${template.title} (유사 ID: ${similarQuestion.id})`);
      return {
        questionText: `${similarQuestion.question} (유사 질문으로 매칭됨)`,
        questionType: similarQuestion.type,
        subCategory: similarQuestion.subCategory,
        scaleLabels: similarQuestion.scaleLabels,
        options: similarQuestion.options,
        matchStatus: 'grade-fallback',
        sourceTemplate: template.title,
        confidence: 50
      };
    }
  }

  // 4단계: 매칭 실패 - 최소한의 정보 제공
  console.log(`❌ [API] 매칭 실패: ${questionId}`);
  return {
    questionText: `질문 ID: ${questionId} (질문 내용을 찾을 수 없습니다)`,
    questionType: 'unknown',
    matchStatus: 'not-found',
    sourceTemplate: '매칭 실패',
    confidence: 0
  };
};

// 🔥 강화된 개인화 AI 상담 리포트 생성 프롬프트
const ENHANCED_PERSONALIZED_COUNSELING_PROMPT = `
당신은 초등학생의 사회정서학습(SEL) 전문 상담사입니다.
다음 학생의 실제 설문 응답을 세밀하게 분석하여 개별 맞춤형 상담 리포트를 작성해주세요.

## 🎯 핵심 분석 요구사항:
- **개별성 중심**: 이 학생만의 고유한 특성과 패턴을 찾아내세요
- **데이터 기반**: 실제 설문 응답 내용을 근거로 구체적 분석
- **질문-답변 완벽 매칭**: 학생의 답변과 질문 내용을 정확히 연결해서 분석
- **차별화**: 다른 학생과 구별되는 이 학생만의 특징 도출
- **매칭 품질 고려**: 질문 매칭 상태를 분석의 신뢰도에 반영

## 📊 데이터 품질 분석:
데이터 매칭 통계: {dataQualityStats}
질문-답변 매칭률: {matchingRate}%
매칭 신뢰도: {confidenceLevel}

## 📋 입력 데이터:
학생 기본정보: {studentInfo}
강화된 설문 응답들: {enhancedResponses}
SEL 영역별 질문 템플릿: {questionTemplates}
분석 기간: {period}

## 🔍 필수 분석 관점:
1. **실제 답변 내용 심층 분석**: 학생이 직접 작성한 응답에서 개성과 특성 추출
2. **질문 맥락 완벽 이해**: 각 질문의 의미와 학생 답변을 정확히 연결해서 해석
3. **매칭 품질 반영**: 정확 매칭 vs 크로스 매칭 vs 유사 매칭에 따른 신뢰도 차등 적용
4. **감정 패턴 분석**: 시간에 따른 감정 변화와 트리거 요인 분석
5. **SEL 영역별 강약점**: 5개 영역에서 이 학생만의 고유한 프로필 도출
6. **관계와 환경**: 친구관계, 학습환경에서의 개별적 특성

## 📝 출력 형식 (JSON):
{
  "dataQualityAssessment": {
    "matchingRate": 매칭률(숫자),
    "confidenceLevel": "높음|보통|낮음",
    "reliabilityNote": "데이터 품질에 대한 전문가 의견"
  },
  "uniqueProfile": "이 학생만의 고유한 특성과 개성을 실제 응답 근거로 4-5문장 서술 (매칭 품질 고려)",
  "strengthsFromData": [
    "실제 설문응답에서 드러난 구체적 강점 1 (정확한 질문-응답 인용 필수)",
    "실제 설문응답에서 드러난 구체적 강점 2 (정확한 질문-응답 인용 필수)",
    "실제 설문응답에서 드러난 구체적 강점 3 (정확한 질문-응답 인용 필수)"
  ],
  "concernsFromData": [
    "응답에서 나타난 관심영역 1 (구체적 질문 내용과 응답 내용 모두 인용)",
    "응답에서 나타난 관심영역 2 (구체적 질문 내용과 응답 내용 모두 인용)"
  ],
  "personalizedStrategies": [
    "이 학생의 특성에 맞춘 맞춤형 전략 1 (응답 근거 포함)",
    "이 학생의 특성에 맞춘 맞춤형 전략 2 (응답 근거 포함)",
    "이 학생의 특성에 맞춘 맞춤형 전략 3 (응답 근거 포함)"
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
    "질문: '[질문 내용]' → 학생 응답: '[실제 응답]' → 분석: [해석]",
    "질문: '[질문 내용]' → 학생 응답: '[실제 응답]' → 분석: [해석]",
    "질문: '[질문 내용]' → 학생 응답: '[실제 응답]' → 분석: [해석]"
  ],
  "qualityIndicators": {
    "analysisDepth": "심층|보통|표면적",
    "personalizationLevel": "매우개별화|개별화|일반적",
    "evidenceStrength": "강함|보통|약함"
  }
}

## 🚨 필수 준수사항:
- 반드시 실제 설문 응답 내용을 정확히 인용하고 분석 근거로 제시
- 질문 내용과 학생 답변을 모두 명시해서 연결고리 명확화
- 매칭률이 낮을 경우 분석 신뢰도를 솔직하게 표기
- 일반적인 조언이 아닌 이 학생만을 위한 맞춤형 내용
- 학생의 실제 말이나 표현을 적극 활용
- 데이터에서 도출되지 않은 추측이나 일반론 금지
- 매칭 실패나 크로스 매칭 질문은 신뢰도를 낮춰서 해석

반드시 JSON 형식으로만 응답하고, 이 학생만을 위한 개별화된 상담 리포트를 작성해주세요.
매칭 품질이 높을수록 더 구체적이고 신뢰할 수 있는 분석을 제공하세요.
`;

// 클래스 전체 분석용 프롬프트
const CLASS_ANALYSIS_PROMPT = `
당신은 초등학생의 사회정서학습(SEL) 전문 상담사입니다.
다음 클래스의 설문 응답들을 종합 분석하여 클래스 전체의 SEL 상태와 교육적 지원 방안을 제시해주세요.

## 🎯 클래스 분석 요구사항:
- **전체 조망**: 클래스 전반의 정서적 분위기와 특성 파악
- **패턴 발견**: 공통적인 강점과 관심 영역 식별
- **개별 배려**: 다양한 학생들의 개별적 필요 고려
- **실행 가능성**: 교실에서 바로 적용 가능한 구체적 방안 제시

## 📊 클래스 정보:
클래스 코드: {classCode}
설문 제목: {surveyTitle}
참여 학생 수: {participantCount}명
총 응답 수: {totalResponses}개
분석 기간: {period}

## 📋 설문 응답 데이터:
{responsesData}

## 📝 출력 형식 (JSON):
{
  "summary": "클래스 전체의 SEL 상태에 대한 종합적 요약 (3-4문장)",
  "classOverview": "클래스의 전반적인 정서적 분위기와 특성 분석 (3-4문장)",
  "participationAnalysis": "학생들의 참여 양상과 응답 패턴 분석 (2-3문장)",
  "emotionalTrends": [
    "클래스에서 나타나는 주요 감정 경향 1",
    "클래스에서 나타나는 주요 감정 경향 2",
    "클래스에서 나타나는 주요 감정 경향 3"
  ],
  "behaviorPatterns": [
    "관찰되는 주요 행동 패턴 1",
    "관찰되는 주요 행동 패턴 2",
    "관찰되는 주요 행동 패턴 3"
  ],
  "selInsights": {
    "selfAwareness": "자기인식 영역의 클래스 전체 특성",
    "selfManagement": "자기관리 영역의 클래스 전체 특성",
    "socialAwareness": "사회적 인식 영역의 클래스 전체 특성",
    "relationshipSkills": "관계 기술 영역의 클래스 전체 특성",
    "responsibleDecisionMaking": "책임감 있는 의사결정 영역의 클래스 전체 특성"
  },
  "recommendationsForTeacher": [
    "교사를 위한 구체적 교실 지원 전략 1",
    "교사를 위한 구체적 교실 지원 전략 2",
    "교사를 위한 구체적 교실 지원 전략 3",
    "교사를 위한 구체적 교실 지원 전략 4"
  ],
  "recommendationsForParents": [
    "학부모들을 위한 가정 지원 방안 1",
    "학부모들을 위한 가정 지원 방안 2",
    "학부모들을 위한 가정 지원 방안 3"
  ],
  "analysisConfidence": 분석_신뢰도_점수(1-100)
}

## 🚨 필수 준수사항:
- 실제 설문 응답 데이터를 근거로 분석
- 클래스 전체의 특성에 초점을 맞춤
- 개별 학생을 특정하지 않고 전체적 경향 분석
- 교실에서 바로 실행 가능한 구체적 방안 제시
- 긍정적이고 건설적인 관점 유지

반드시 JSON 형식으로만 응답해주세요.
`;

// 클래스 분석 처리 함수
async function handleClassAnalysis(
  responses: SurveyResponse[], 
  classCode: string, 
  surveyTitle: string, 
  totalResponses: number, 
  participantCount: number, 
  apiKey: string
) {
  try {
    console.log('🏫 클래스 분석 처리 시작:', { classCode, participantCount, totalResponses });

    // Gemini 모델 인스턴스 생성
    const geminiModel = createGeminiInstance(apiKey);

    // 응답 데이터 요약 (개인정보 제거)
    const anonymizedResponses = responses.map((response, index) => ({
      studentIndex: index + 1,
      submittedAt: response.submittedAt,
      grade: response.grade,
      surveyType: response.surveyType,
      responsesCount: response.responses.length,
      responses: response.responses.map(resp => ({
        domain: resp.domain,
        questionId: resp.questionId,
        answer: resp.answer
      }))
    }));

    // 프롬프트 데이터 준비
    const promptData = CLASS_ANALYSIS_PROMPT
      .replace('{classCode}', classCode)
      .replace('{surveyTitle}', surveyTitle)
      .replace('{participantCount}', participantCount.toString())
      .replace('{totalResponses}', totalResponses.toString())
      .replace('{period}', '최근 설문 기간')
      .replace('{responsesData}', JSON.stringify(anonymizedResponses.slice(0, 20))); // 최대 20개 응답

    console.log('🤖 클래스 분석용 Gemini API 호출 시작...');

    // Gemini API 호출
    const result = await geminiModel.generateContent(promptData);
    const response = await result.response;
    const text = response.text();

    console.log('✅ 클래스 분석 Gemini API 응답 받음, 길이:', text.length);

    // JSON 파싱 시도
    try {
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const reportData = JSON.parse(cleanedText);
      
      console.log('✅ 클래스 분석 JSON 파싱 성공:', Object.keys(reportData));

      return NextResponse.json({
        ...reportData,
        dataQuality: {
          totalResponses: responses.length,
          participantCount,
          responseRate: Math.round((participantCount / Math.max(participantCount, 25)) * 100),
          analysisConfidence: reportData.analysisConfidence || 85
        },
        generatedAt: new Date().toISOString(),
        analysisType: 'class_comprehensive',
        isEnhanced: true
      });
      
    } catch (parseError) {
      console.error('❌ 클래스 분석 JSON 파싱 실패:', parseError);
      
      // 기본 클래스 리포트 반환
      return NextResponse.json({
        summary: `${surveyTitle} 설문 결과, 클래스 전반적으로 건강한 정서 상태를 보이고 있습니다.`,
        classOverview: `총 ${participantCount}명의 학생이 참여한 설문에서 긍정적인 반응이 많이 나타났습니다.`,
        participationAnalysis: `${responses.length}개의 응답을 통해 학생들의 적극적인 참여를 확인할 수 있었습니다.`,
        emotionalTrends: [
          '전반적으로 긍정적인 감정 상태',
          '학습에 대한 호기심과 관심',
          '친구관계에서의 협력적 태도'
        ],
        behaviorPatterns: [
          '수업 참여에 적극적인 모습',
          '또래와의 원만한 관계 형성',
          '문제 해결에 대한 의지'
        ],
        selInsights: {
          selfAwareness: '자기 감정 인식 능력이 전반적으로 발달하고 있습니다.',
          selfManagement: '감정 조절과 스트레스 관리 능력을 기르고 있습니다.',
          socialAwareness: '타인에 대한 이해와 공감 능력이 성장하고 있습니다.',
          relationshipSkills: '친구들과의 관계 형성 능력이 좋은 편입니다.',
          responsibleDecisionMaking: '책임감 있는 선택을 배워가고 있는 단계입니다.'
        },
        recommendationsForTeacher: [
          '개별 학생의 강점을 발견하고 격려하기',
          '협력 학습 기회를 늘려 관계 기술 향상 도모',
          '감정 표현과 조절 방법에 대한 교육 제공',
          '긍정적 피드백을 통한 자신감 증진'
        ],
        recommendationsForParents: [
          '가정에서 자녀와의 대화 시간 늘리기',
          '학교 생활에 대한 관심과 격려 표현',
          '자녀의 감정을 인정하고 공감하는 태도'
        ],
        analysisConfidence: 80,
        dataQuality: {
          totalResponses: responses.length,
          participantCount,
          responseRate: Math.round((participantCount / Math.max(participantCount, 25)) * 100),
          analysisConfidence: 80
        },
        generatedAt: new Date().toISOString(),
        analysisType: 'class_comprehensive_fallback',
        isEnhanced: true,
        isFallback: true
      });
    }

  } catch (error) {
    console.error('❌ 클래스 분석 처리 오류:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student, responses, analyses, period, apiKey, requestType, classCode, surveyTitle, totalResponses, participantCount } = body;

    console.log('🤖 [Enhanced] AI 리포트 생성 API 호출됨:', {
      requestType: requestType || 'individual',
      studentName: student?.name,
      classCode,
      surveyTitle,
      responsesCount: responses?.length || 0,
      analysesCount: analyses?.length || 0,
      participantCount,
      hasApiKey: !!apiKey
    });

    // API 키 확인
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API 키가 필요합니다.' },
        { status: 400 }
      );
    }

    // 클래스 분석과 개별 분석 구분
    if (requestType === 'class_analysis') {
      // 클래스 분석인 경우
      if (!responses?.length) {
        return NextResponse.json(
          { error: '클래스 분석을 위한 설문 응답 데이터가 필요합니다.' },
          { status: 400 }
        );
      }
      return await handleClassAnalysis(responses, classCode, surveyTitle, totalResponses, participantCount, apiKey);
    }
    
    // 개별 학생 분석인 경우 (기존 로직)
    if (!student || (!responses?.length && !analyses?.length)) {
      return NextResponse.json(
        { error: '분석할 데이터가 부족합니다. 최소 1개 이상의 설문 응답 또는 분석 결과가 필요합니다.' },
        { status: 400 }
      );
    }

    // 🔥 핵심 개선: 강화된 질문-답변 매칭 처리
    const enhanceResponsesWithAdvancedMatching = (responses: SurveyResponse[], grade: number) => {
      let totalQuestions = 0;
      const matchingStats = {
        exact: 0,
        'cross-fallback': 0,
        'grade-fallback': 0,
        'not-found': 0
      };

      const enhancedResponses = responses.map(response => {
        const enhancedQuestionResponses = response.responses.map((resp) => {
          totalQuestions++;
          
          // 강화된 매칭 시스템 사용
          const matchResult = findQuestionWithEnhancedFallback(resp.questionId, grade);
          
          // 매칭 통계 업데이트
          matchingStats[matchResult.matchStatus]++;
          
          return {
            ...resp,
            questionText: matchResult.questionText,
            questionType: matchResult.questionType,
            subCategory: matchResult.subCategory,
            scaleLabels: matchResult.scaleLabels,
            options: matchResult.options,
            matchStatus: matchResult.matchStatus,
            sourceTemplate: matchResult.sourceTemplate,
            confidence: matchResult.confidence
          };
        });

        return {
          ...response,
          responses: enhancedQuestionResponses
        };
      });

      // 📊 데이터 품질 통계 계산
      const matchingRate = totalQuestions > 0 ? 
        ((matchingStats.exact + matchingStats['cross-fallback']) / totalQuestions * 100) : 0;
      
      const avgConfidence = totalQuestions > 0 ? 
        (responses.reduce((acc, response) => {
          return acc + response.responses.reduce((respAcc: number, resp) => {
            const matchResult = findQuestionWithEnhancedFallback(resp.questionId, grade);
            return respAcc + matchResult.confidence;
          }, 0);
        }, 0) / totalQuestions) : 0;

      const confidenceLevel = avgConfidence >= 85 ? '높음' : avgConfidence >= 60 ? '보통' : '낮음';

      console.log('📊 [Enhanced] 데이터 품질 분석:', {
        totalQuestions,
        matchingStats,
        matchingRate: matchingRate.toFixed(1) + '%',
        avgConfidence: avgConfidence.toFixed(1),
        confidenceLevel
      });

      return {
        enhancedResponses,
        dataQuality: {
          totalQuestions,
          matchingStats,
          matchingRate: matchingRate.toFixed(1),
          avgConfidence: avgConfidence.toFixed(1),
          confidenceLevel,
          qualityNote: matchingRate >= 80 ? 
            '높은 매칭률로 신뢰할 수 있는 분석이 가능합니다.' :
            matchingRate >= 60 ?
            '보통 수준의 매칭률로 해석에 주의가 필요합니다.' :
            '낮은 매칭률로 분석 결과의 신뢰도가 제한적일 수 있습니다.'
        }
      };
    };

    const { enhancedResponses, dataQuality } = enhanceResponsesWithAdvancedMatching(responses || [], student.grade);

    // 학년에 맞는 질문 템플릿 선택
    const questionTemplate = student.grade <= 4 ? selTemplates[0] : selTemplates[1];

    // Gemini 모델 인스턴스 생성
    const geminiModel = createGeminiInstance(apiKey);

    // 🔥 핵심 개선: 강화된 개인화 프롬프트 데이터 준비
    const promptData = ENHANCED_PERSONALIZED_COUNSELING_PROMPT
      .replace('{dataQualityStats}', JSON.stringify(dataQuality.matchingStats))
      .replace('{matchingRate}', dataQuality.matchingRate)
      .replace('{confidenceLevel}', dataQuality.confidenceLevel)
      .replace('{studentInfo}', JSON.stringify({
        name: student.name,
        grade: student.grade,
        participationRate: student.participationRate,
        totalResponses: student.totalResponses,
        joinedDate: student.joinedAt
      }))
      .replace('{enhancedResponses}', JSON.stringify(enhancedResponses))
      .replace('{questionTemplates}', JSON.stringify({
        templateInfo: questionTemplate,
        domainDescriptions: selDomainDescriptions
      }))
      .replace('{period}', period || '최근 활동');

    console.log('🤖 [Enhanced] Gemini API 호출 시작...');

    // Gemini API 호출
    const result = await geminiModel.generateContent(promptData);
    const response = await result.response;
    const text = response.text();

    console.log('✅ [Enhanced] Gemini API 응답 받음, 길이:', text.length);

    // JSON 파싱 시도
    try {
      // JSON 응답에서 코드 블록 제거 (```json 등)
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const reportData = JSON.parse(cleanedText);
      
      console.log('✅ [Enhanced] JSON 파싱 성공:', Object.keys(reportData));

      // 🔥 핵심 개선: 데이터 품질 정보 추가
      const enhancedReportData = {
        ...reportData,
        _metadata: {
          dataQuality,
          generatedAt: new Date().toISOString(),
          apiVersion: 'enhanced-v1.0',
          matchingAlgorithm: '3-stage-fallback'
        }
      };

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
            reportData: enhancedReportData,
            analysisDataSource: {
              responsesCount: responses?.length || 0,
              analysesCount: analyses?.length || 0,
              period: period || '최근 활동',
              dataQuality: dataQuality,
              version: 'enhanced'
            }
          }),
        });

        if (saveResponse.ok) {
          const saveResult = await saveResponse.json();
          console.log('💾 [Enhanced] 리포트 DB 저장 성공:', saveResult.reportId);
          
          // 저장 성공 시 reportId와 품질 정보 포함하여 응답
          return NextResponse.json({
            ...enhancedReportData,
            savedReportId: saveResult.reportId,
            isPersonalized: saveResult.isPersonalized,
            isEnhanced: true
          });
        } else {
          console.warn('⚠️ [Enhanced] 리포트 DB 저장 실패, 리포트는 정상 반환');
        }
      } catch (saveError) {
        console.warn('⚠️ [Enhanced] 리포트 DB 저장 중 오류, 리포트는 정상 반환:', saveError);
      }
      
      return NextResponse.json({
        ...enhancedReportData,
        isEnhanced: true
      });
      
    } catch (parseError) {
      console.error('❌ [Enhanced] JSON 파싱 실패:', parseError);
      console.log('Raw response:', text.substring(0, 500));
      
      // 🔥 개선된 기본 리포트 반환 (데이터 품질 정보 포함)
      return NextResponse.json({
        dataQualityAssessment: {
          matchingRate: parseFloat(dataQuality.matchingRate),
          confidenceLevel: dataQuality.confidenceLevel,
          reliabilityNote: `${dataQuality.qualityNote} (JSON 파싱 실패로 기본 리포트 제공)`
        },
        uniqueProfile: `${student.name} 학생의 SEL 발달 상황을 분석한 결과, 전반적으로 건강한 성장을 보이고 있습니다. 데이터 매칭률 ${dataQuality.matchingRate}%로 분석되었으며, 지속적인 관심과 격려를 통해 더욱 발전할 수 있을 것으로 기대됩니다.`,
        strengthsFromData: [
          '수업에 적극적으로 참여하는 모습을 보임',
          '친구들과 원만한 관계를 유지하려고 노력함',
          '자신의 감정을 표현하려는 의지가 있음'
        ],
        concernsFromData: [
          '감정 조절 능력을 더욱 기를 수 있는 기회 필요',
          '자신감 향상을 위한 성공 경험 확대 필요'
        ],
        personalizedStrategies: [
          '정기적인 개별 상담을 통한 정서적 지원',
          '강점을 활용한 역할 부여로 자신감 증진',
          '감정 표현과 조절 방법에 대한 구체적 교육'
        ],
        classroomApproach: [
          '발표 기회를 점진적으로 늘려 자신감 향상 도모',
          '또래 협력 활동에서 리더 역할 경험 제공',
          '긍정적 피드백을 통한 동기 부여 강화'
        ],
        parentGuidance: [
          '가정에서 규칙적인 대화 시간 마련',
          '자녀의 감정을 인정하고 공감하는 대화법 실천',
          '작은 성취에도 격려와 인정 표현하기'
        ],
        specificGoals: [
          '향후 2주간 일일 감정 체크를 통한 패턴 관찰',
          '1개월 후 학부모 상담을 통한 진전 상황 점검',
          '학기말까지 자신감 향상 정도 평가 및 차기 계획 수립'
        ],
        evidenceQuotes: [
          '데이터 매칭 제한으로 구체적 인용이 어려움',
          `총 ${dataQuality.totalQuestions}개 질문 중 ${dataQuality.matchingStats.exact}개 정확 매칭`,
          `분석 신뢰도: ${dataQuality.confidenceLevel} (${dataQuality.avgConfidence}점)`
        ],
        qualityIndicators: {
          analysisDepth: dataQuality.matchingRate >= '80' ? '심층' : '보통',
          personalizationLevel: dataQuality.confidenceLevel === '높음' ? '개별화' : '일반적',
          evidenceStrength: dataQuality.matchingRate >= '70' ? '보통' : '약함'
        },
        _metadata: {
          dataQuality,
          generatedAt: new Date().toISOString(),
          apiVersion: 'enhanced-v1.0-fallback',
          parseError: true
        },
        isEnhanced: true,
        isFallback: true
      });
    }

  } catch (error) {
    console.error('❌ [Enhanced] AI 리포트 생성 API 오류:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Enhanced AI 리포트 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.stack : undefined,
        isEnhanced: true
      },
      { status: 500 }
    );
  }
}