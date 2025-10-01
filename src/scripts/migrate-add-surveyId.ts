// Firestore 데이터 마이그레이션: 기존 응답에 surveyId 필드 추가
// 실행 방법: npx ts-node src/scripts/migrate-add-surveyId.ts

import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

const COLLECTIONS = {
  SURVEY_RESPONSES: 'surveyResponses',
  SURVEYS: 'surveys',
};

// 템플릿 질문 ID 패턴인지 확인
function isTemplateQuestion(questionId: string): boolean {
  return /^(sa|sm|soa|rs|rdm)\d+$/.test(questionId);
}

// 커스텀 설문을 찾기 위해 questionIds 매칭
async function findMatchingSurvey(questionIds: string[]): Promise<string | null> {
  try {
    const surveysRef = collection(db, COLLECTIONS.SURVEYS);
    const snapshot = await getDocs(surveysRef);

    for (const surveyDoc of snapshot.docs) {
      const surveyData = surveyDoc.data();
      const surveyQuestionIds = surveyData.questions?.map((q: any) => q.id) || [];

      // 응답의 questionIds가 설문의 questionIds와 일치하는지 확인
      const matchCount = questionIds.filter(qid => surveyQuestionIds.includes(qid)).length;
      const matchRatio = matchCount / questionIds.length;

      // 80% 이상 매칭되면 해당 설문으로 간주
      if (matchRatio >= 0.8) {
        console.log(`  🔍 매칭된 설문 발견: ${surveyDoc.id} (${surveyData.title}) - 매칭률: ${Math.round(matchRatio * 100)}%`);
        return surveyDoc.id;
      }
    }

    return null;
  } catch (error) {
    console.error('❌ 설문 매칭 오류:', error);
    return null;
  }
}

async function migrateSurveyResponses() {
  try {
    console.log('🔄 surveyId 필드 마이그레이션 시작...');

    const responsesRef = collection(db, COLLECTIONS.SURVEY_RESPONSES);
    const snapshot = await getDocs(responsesRef);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let customMatchCount = 0;

    for (const responseDoc of snapshot.docs) {
      const data = responseDoc.data();

      // surveyId 필드가 이미 있으면 스킵
      if (data.surveyId) {
        skippedCount++;
        console.log(`⏭️  스킵 (surveyId 존재): ${responseDoc.id}`);
        continue;
      }

      try {
        let inferredSurveyId: string;

        // 응답의 questionIds 추출
        const questionIds = data.responses?.map((r: any) => r.questionId) || [];
        console.log(`\n🔍 처리 중: ${responseDoc.id}`);
        console.log(`  questionIds: ${questionIds.join(', ')}`);

        // 1. 템플릿 질문인지 확인
        const isTemplate = questionIds.some(isTemplateQuestion);

        if (isTemplate) {
          // 템플릿 질문 → surveyType 기반으로 surveyId 생성
          const surveyType = data.surveyType || 'daily';
          inferredSurveyId = `${surveyType}-survey`;
          console.log(`  ✅ 템플릿 질문 → surveyId: ${inferredSurveyId}`);
        } else {
          // 커스텀 질문 → Firestore에서 매칭되는 설문 찾기
          console.log(`  🔎 커스텀 질문 감지 → 설문 매칭 시도...`);
          const matchedSurveyId = await findMatchingSurvey(questionIds);

          if (matchedSurveyId) {
            inferredSurveyId = matchedSurveyId;
            customMatchCount++;
            console.log(`  ✅ 커스텀 설문 매칭 성공 → surveyId: ${inferredSurveyId}`);
          } else {
            // 매칭 실패 → 기본 surveyId 사용
            inferredSurveyId = data.surveyType ? `${data.surveyType}-survey` : 'unknown-survey';
            console.log(`  ⚠️  매칭 실패 → 기본 surveyId 사용: ${inferredSurveyId}`);
          }
        }

        // surveyId 필드 추가
        await updateDoc(doc(db, COLLECTIONS.SURVEY_RESPONSES, responseDoc.id), {
          surveyId: inferredSurveyId
        });

        updatedCount++;
        console.log(`  ✅ 업데이트 완료`);
      } catch (error) {
        errorCount++;
        console.error(`❌ 업데이트 실패: ${responseDoc.id}`, error);
      }
    }

    console.log('\n📊 마이그레이션 완료:');
    console.log(`- 총 문서 수: ${snapshot.size}`);
    console.log(`- 업데이트: ${updatedCount}`);
    console.log(`  - 커스텀 설문 매칭: ${customMatchCount}`);
    console.log(`- 스킵: ${skippedCount}`);
    console.log(`- 오류: ${errorCount}`);

  } catch (error) {
    console.error('❌ 마이그레이션 오류:', error);
    throw error;
  }
}

// 마이그레이션 실행
migrateSurveyResponses()
  .then(() => {
    console.log('✅ 마이그레이션 성공');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  });
