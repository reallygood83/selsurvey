// AI 상담 리포트 저장 API
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { AIReport } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      studentId, 
      teacherId, 
      studentName, 
      grade, 
      classCode, 
      reportData, 
      analysisDataSource 
    } = body;

    console.log('💾 AI 리포트 저장 API 호출됨:', {
      studentId,
      studentName,
      teacherId,
      isPersonalized: !!(reportData.uniqueProfile && reportData.strengthsFromData)
    });

    // 필수 데이터 검증
    if (!studentId || !teacherId || !studentName || !reportData) {
      return NextResponse.json(
        { error: '필수 데이터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 개인화된 리포트인지 확인
    const isPersonalized = !!(reportData.uniqueProfile && reportData.strengthsFromData);

    // AI 리포트 데이터 구성
    const aiReport: Omit<AIReport, 'id' | 'generatedAt'> = {
      studentId,
      teacherId,
      studentName,
      grade: grade || 5,
      classCode: classCode || '',
      
      // 개인화된 리포트 데이터
      uniqueProfile: reportData.uniqueProfile,
      strengthsFromData: reportData.strengthsFromData,
      concernsFromData: reportData.concernsFromData,
      personalizedStrategies: reportData.personalizedStrategies,
      classroomApproach: reportData.classroomApproach,
      parentGuidance: reportData.parentGuidance,
      specificGoals: reportData.specificGoals,
      evidenceQuotes: reportData.evidenceQuotes,
      
      // 기존 리포트 데이터 (호환성)
      summary: reportData.summary,
      strengths: reportData.strengths,
      concernAreas: reportData.concernAreas,
      recommendations: reportData.recommendations,
      classroomStrategies: reportData.classroomStrategies,
      parentSuggestions: reportData.parentSuggestions,
      nextSteps: reportData.nextSteps,
      
      // 메타데이터
      analysisDataSource: analysisDataSource || {
        responsesCount: 0,
        analysesCount: 0,
        period: '데이터 없음'
      },
      
      isPersonalized,
      version: '2.0' // 개인화 버전
    };

    // Firestore에 저장
    const docRef = await addDoc(collection(db, 'aiReports'), {
      ...aiReport,
      generatedAt: serverTimestamp()
    });

    console.log('✅ AI 리포트 저장 완료:', docRef.id);

    return NextResponse.json({
      success: true,
      reportId: docRef.id,
      isPersonalized,
      message: '리포트가 성공적으로 저장되었습니다.'
    });

  } catch (error) {
    console.error('❌ AI 리포트 저장 오류:', error);
    
    return NextResponse.json(
      { 
        error: '리포트 저장 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}