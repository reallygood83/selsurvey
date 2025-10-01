// AI 상담 리포트 목록 조회 API
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { AIReport } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const studentId = searchParams.get('studentId');
    const classCode = searchParams.get('classCode');
    const limitCount = parseInt(searchParams.get('limit') || '20');

    console.log('📋 AI 리포트 목록 조회 API 호출됨:', {
      teacherId,
      studentId,
      classCode,
      limitCount
    });

    // 기본 필터 조건 확인
    if (!teacherId && !studentId && !classCode) {
      return NextResponse.json(
        { error: '조회 조건이 필요합니다. (teacherId, studentId, classCode 중 최소 1개)' },
        { status: 400 }
      );
    }

    // Firestore 쿼리 구성 - 복합 인덱스 문제 해결
    const queryRef = collection(db, 'aiReports');

    // 조건이 1개만 있을 때는 단순 쿼리 (인덱스 불필요)
    const conditionCount = [teacherId, studentId, classCode].filter(Boolean).length;

    let querySnapshot;

    if (conditionCount === 1) {
      // 단일 조건 - 인덱스 불필요
      const queryConstraints = [];
      if (teacherId) queryConstraints.push(where('teacherId', '==', teacherId));
      if (studentId) queryConstraints.push(where('studentId', '==', studentId));
      if (classCode) queryConstraints.push(where('classCode', '==', classCode));

      const q = query(queryRef, ...queryConstraints);
      querySnapshot = await getDocs(q);
    } else {
      // 복합 조건 - 전체 컬렉션 가져와서 클라이언트에서 필터링
      querySnapshot = await getDocs(queryRef);
    }

    // 결과 데이터 변환
    const reports: AIReport[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reports.push({
        id: doc.id,
        ...data,
        generatedAt: data.generatedAt?.toDate() || new Date()
      } as AIReport);
    });

    // 클라이언트 측 필터링 (복합 조건일 때)
    let filteredReports = reports;
    if (conditionCount > 1) {
      filteredReports = reports.filter(report => {
        if (teacherId && report.teacherId !== teacherId) return false;
        if (studentId && report.studentId !== studentId) return false;
        if (classCode && report.classCode !== classCode) return false;
        return true;
      });
    }

    // 클라이언트 측 정렬 및 제한
    filteredReports.sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
    const limitedReports = filteredReports.slice(0, limitCount);

    console.log('✅ AI 리포트 목록 조회 완료:', {
      totalReports: limitedReports.length,
      personalizedCount: limitedReports.filter(r => r.isPersonalized).length,
      basicCount: limitedReports.filter(r => !r.isPersonalized).length
    });

    return NextResponse.json({
      success: true,
      reports: limitedReports,
      total: limitedReports.length,
      filters: { teacherId, studentId, classCode },
      metadata: {
        personalizedCount: limitedReports.filter(r => r.isPersonalized).length,
        basicCount: limitedReports.filter(r => !r.isPersonalized).length
      }
    });

  } catch (error) {
    console.error('❌ AI 리포트 목록 조회 오류:', error);
    
    return NextResponse.json(
      { 
        error: '리포트 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}