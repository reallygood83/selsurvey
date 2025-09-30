// 특정 AI 상담 리포트 조회 API
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { AIReport } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const { reportId } = params;

    console.log('📄 AI 리포트 상세 조회 API 호출됨:', { reportId });

    if (!reportId) {
      return NextResponse.json(
        { error: '리포트 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // Firestore에서 문서 조회
    const docRef = doc(db, 'aiReports', reportId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: '리포트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 데이터 변환
    const data = docSnap.data();
    const report: AIReport = {
      id: docSnap.id,
      ...data,
      generatedAt: data.generatedAt?.toDate() || new Date()
    } as AIReport;

    console.log('✅ AI 리포트 상세 조회 완료:', {
      reportId: report.id,
      studentName: report.studentName,
      isPersonalized: report.isPersonalized,
      version: report.version
    });

    return NextResponse.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('❌ AI 리포트 상세 조회 오류:', error);
    
    return NextResponse.json(
      { 
        error: '리포트 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}