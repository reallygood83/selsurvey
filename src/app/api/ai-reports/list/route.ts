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

    // Firestore 쿼리 구성
    const queryRef = collection(db, 'aiReports');
    const queryConstraints = [];

    // 조건별 필터 추가
    if (teacherId) {
      queryConstraints.push(where('teacherId', '==', teacherId));
    }
    if (studentId) {
      queryConstraints.push(where('studentId', '==', studentId));
    }
    if (classCode) {
      queryConstraints.push(where('classCode', '==', classCode));
    }

    // 정렬 및 제한
    queryConstraints.push(orderBy('generatedAt', 'desc'));
    queryConstraints.push(limit(limitCount));

    const q = query(queryRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);

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

    console.log('✅ AI 리포트 목록 조회 완료:', {
      totalReports: reports.length,
      personalizedCount: reports.filter(r => r.isPersonalized).length,
      basicCount: reports.filter(r => !r.isPersonalized).length
    });

    return NextResponse.json({
      success: true,
      reports,
      total: reports.length,
      filters: { teacherId, studentId, classCode },
      metadata: {
        personalizedCount: reports.filter(r => r.isPersonalized).length,
        basicCount: reports.filter(r => !r.isPersonalized).length
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