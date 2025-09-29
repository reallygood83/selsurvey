// Firestore 데이터베이스 유틸리티 함수
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  limit, 
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  User, 
  ClassInfo, 
  StudentProfile, 
  SurveyResponse, 
  SELAnalysis, 
  SurveyQuestion,
  Survey,
  UserRole,
  Grade,
  DailyMood
} from '@/types';

// 컬렉션 이름 상수
const COLLECTIONS = {
  USERS: 'users',
  CLASSES: 'classes',
  STUDENTS: 'students',
  SURVEYS: 'surveys',
  SURVEY_RESPONSES: 'surveyResponses',
  SEL_ANALYSES: 'selAnalyses',
  SURVEY_QUESTIONS: 'surveyQuestions',
  TEACHER_REPORTS: 'teacherReports',
  PARENT_REPORTS: 'parentReports',
  DAILY_MOODS: 'dailyMoods'
} as const;

// 유틸리티 함수: Date를 Timestamp로 변환
const toTimestamp = (date: Date) => Timestamp.fromDate(date);
const fromTimestamp = (timestamp: Timestamp) => timestamp.toDate();

// 사용자 관련 함수
export const userService = {
  // 사용자 생성/업데이트
  async createOrUpdateUser(user: User): Promise<void> {
    const userRef = doc(db, COLLECTIONS.USERS, user.id);
    await setDoc(userRef, {
      ...user,
      createdAt: toTimestamp(user.createdAt),
      updatedAt: toTimestamp(user.updatedAt)
    }, { merge: true });
  },

  // 사용자 조회
  async getUser(userId: string): Promise<User | null> {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        ...data,
        createdAt: fromTimestamp(data.createdAt),
        updatedAt: fromTimestamp(data.updatedAt)
      } as User;
    }
    
    return null;
  },

  // 역할별 사용자 조회
  async getUsersByRole(role: UserRole): Promise<User[]> {
    const usersRef = collection(db, COLLECTIONS.USERS);
    const q = query(usersRef, where('role', '==', role));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: fromTimestamp(data.createdAt),
        updatedAt: fromTimestamp(data.updatedAt)
      } as User;
    });
  }
};

// 반 관리 함수
export const classService = {
  // 반 생성
  async createClass(classInfo: Omit<ClassInfo, 'id'>): Promise<string> {
    const classRef = collection(db, COLLECTIONS.CLASSES);
    const docRef = await addDoc(classRef, {
      ...classInfo,
      createdAt: toTimestamp(classInfo.createdAt)
    });
    return docRef.id;
  },

  // 반 조회 (반 코드로)
  async getClassByCode(classCode: string): Promise<ClassInfo | null> {
    const classRef = collection(db, COLLECTIONS.CLASSES);
    const q = query(classRef, where('classCode', '==', classCode), limit(1));
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: fromTimestamp(data.createdAt)
      } as ClassInfo;
    }
    
    return null;
  },

  // 교사별 반 조회
  async getClassesByTeacher(teacherId: string): Promise<ClassInfo[]> {
    const classRef = collection(db, COLLECTIONS.CLASSES);
    const q = query(classRef, where('teacherId', '==', teacherId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: fromTimestamp(data.createdAt)
      } as ClassInfo;
    });
  },

  // 반에 학생 추가
  async addStudentToClass(classId: string, studentId: string): Promise<void> {
    const classRef = doc(db, COLLECTIONS.CLASSES, classId);
    const classDoc = await getDoc(classRef);
    
    if (classDoc.exists()) {
      const classData = classDoc.data();
      const currentStudents = classData.students || [];
      
      if (!currentStudents.includes(studentId)) {
        await updateDoc(classRef, {
          students: [...currentStudents, studentId],
          studentCount: currentStudents.length + 1
        });
      }
    }
  },

  // 반에서 학생 제거
  async removeStudentFromClass(classId: string, studentId: string): Promise<void> {
    const classRef = doc(db, COLLECTIONS.CLASSES, classId);
    const classDoc = await getDoc(classRef);
    
    if (classDoc.exists()) {
      const classData = classDoc.data();
      const currentStudents = classData.students || [];
      const updatedStudents = currentStudents.filter((id: string) => id !== studentId);
      
      await updateDoc(classRef, {
        students: updatedStudents,
        studentCount: updatedStudents.length
      });
    }
  },

  // 반 코드 생성 (6자리 랜덤)
  generateClassCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
};

// 학생 관련 함수
export const studentService = {
  // 학생 프로필 생성
  async createStudentProfile(profile: Omit<StudentProfile, 'id'>): Promise<string> {
    const studentRef = collection(db, COLLECTIONS.STUDENTS);
    const docRef = await addDoc(studentRef, {
      ...profile,
      joinedAt: toTimestamp(profile.joinedAt),
      lastResponseDate: profile.lastResponseDate ? toTimestamp(profile.lastResponseDate) : null
    });
    return docRef.id;
  },

  // 학생 프로필 조회 (학생 ID 또는 사용자 ID로 조회)
  async getStudentProfile(idOrUserId: string): Promise<StudentProfile | null> {
    // 먼저 직접 ID로 조회 시도
    const studentRef = doc(db, COLLECTIONS.STUDENTS, idOrUserId);
    
    try {
      const studentSnap = await getDoc(studentRef);
      
      if (studentSnap.exists()) {
        const data = studentSnap.data();
        return {
          id: studentSnap.id,
          ...data,
          joinedAt: fromTimestamp(data.joinedAt),
          lastResponseDate: data.lastResponseDate ? fromTimestamp(data.lastResponseDate) : undefined
        } as StudentProfile;
      }
    } catch (error) {
      console.error('직접 ID 조회 오류:', error);
    }
    
    // 직접 ID로 찾을 수 없으면 사용자 ID로 조회
    return this.getStudentByUserId(idOrUserId);
  },

  // 반별 학생 조회
  async getStudentsByClass(classCode: string): Promise<StudentProfile[]> {
    const studentsRef = collection(db, COLLECTIONS.STUDENTS);
    const q = query(studentsRef, where('classCode', '==', classCode));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        joinedAt: fromTimestamp(data.joinedAt),
        lastResponseDate: data.lastResponseDate ? fromTimestamp(data.lastResponseDate) : undefined
      } as StudentProfile;
    });
  },

  // 사용자 ID로 학생 프로필 조회
  async getStudentByUserId(userId: string): Promise<StudentProfile | null> {
    const studentsRef = collection(db, COLLECTIONS.STUDENTS);
    const q = query(studentsRef, where('userId', '==', userId), limit(1));
    
    try {
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          joinedAt: fromTimestamp(data.joinedAt),
          lastResponseDate: data.lastResponseDate ? fromTimestamp(data.lastResponseDate) : undefined
        } as StudentProfile;
      }
    } catch (error) {
      console.error('사용자 ID로 조회 오류:', error);
      throw error;
    }
    
    return null;
  },

  // 학생 프로필에 분석 결과 추가
  async addAnalysisToStudent(studentId: string, analysis: SELAnalysis): Promise<void> {
    const studentRef = doc(db, COLLECTIONS.STUDENTS, studentId);
    const studentSnap = await getDoc(studentRef);
    
    if (studentSnap.exists()) {
      const studentData = studentSnap.data();
      const currentAnalyses = studentData.analysisHistory || [];
      
      // 새 분석 결과를 분석 기록에 추가
      const updatedAnalyses = [...currentAnalyses, analysis];
      
      // 학생 프로필 업데이트
      await updateDoc(studentRef, {
        analysisHistory: updatedAnalyses,
        lastResponseDate: toTimestamp(new Date()),
        totalResponses: (studentData.totalResponses || 0) + 1
      });
    }
  },

  // 학생 프로필 업데이트
  async updateStudentProfile(studentId: string, updates: Partial<StudentProfile>): Promise<void> {
    const studentRef = doc(db, COLLECTIONS.STUDENTS, studentId);
    const processedUpdates = { ...updates } as Record<string, unknown>;
    
    // Date 필드들을 Timestamp로 변환
    if (processedUpdates.joinedAt) {
      processedUpdates.joinedAt = toTimestamp(processedUpdates.joinedAt as Date);
    }
    if (processedUpdates.lastResponseDate) {
      processedUpdates.lastResponseDate = toTimestamp(processedUpdates.lastResponseDate as Date);
    }
    
    await updateDoc(studentRef, processedUpdates);
  },

  // 학생 삭제 (관련 데이터도 함께 삭제)
  async deleteStudent(studentId: string): Promise<void> {
    const batch = writeBatch(db);
    
    try {
      // 1. 학생의 설문 응답 삭제
      const responsesRef = collection(db, COLLECTIONS.SURVEY_RESPONSES);
      const responsesQuery = query(responsesRef, where('studentId', '==', studentId));
      const responsesSnapshot = await getDocs(responsesQuery);
      
      responsesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // 2. 학생의 SEL 분석 결과 삭제
      const analysesRef = collection(db, COLLECTIONS.SEL_ANALYSES);
      const analysesQuery = query(analysesRef, where('studentId', '==', studentId));
      const analysesSnapshot = await getDocs(analysesQuery);
      
      analysesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // 3. 학생의 무드 기록 삭제
      const moodsRef = collection(db, COLLECTIONS.DAILY_MOODS);
      const moodsQuery = query(moodsRef, where('studentId', '==', studentId));
      const moodsSnapshot = await getDocs(moodsQuery);
      
      moodsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // 4. 학생 프로필 삭제
      const studentRef = doc(db, COLLECTIONS.STUDENTS, studentId);
      batch.delete(studentRef);
      
      // 5. 반에서 학생 제거
      const studentDoc = await getDoc(studentRef);
      if (studentDoc.exists()) {
        const studentData = studentDoc.data();
        const classCode = studentData.classCode;
        
        if (classCode) {
          const classRef = collection(db, COLLECTIONS.CLASSES);
          const classQuery = query(classRef, where('classCode', '==', classCode));
          const classSnapshot = await getDocs(classQuery);
          
          if (!classSnapshot.empty) {
            const classDoc = classSnapshot.docs[0];
            const classData = classDoc.data();
            const students = classData.students || [];
            const updatedStudents = students.filter((id: string) => id !== studentId);
            
            batch.update(classDoc.ref, {
              students: updatedStudents,
              studentCount: updatedStudents.length
            });
          }
        }
      }
      
      // 배치 실행
      await batch.commit();
      console.log(`학생 ${studentId} 및 관련 데이터가 성공적으로 삭제되었습니다.`);
      
    } catch (error) {
      console.error('학생 삭제 중 오류:', error);
      throw new Error('학생 삭제에 실패했습니다.');
    }
  }
};

// 설문 응답 관련 함수
export const surveyService = {
  // 설문 템플릿 생성
  async createSurvey(survey: Omit<Survey, 'id'>): Promise<string> {
    const surveyRef = collection(db, COLLECTIONS.SURVEYS);
    const docRef = await addDoc(surveyRef, {
      ...survey,
      questions: survey.questions || [], // questions 필드가 비어있지 않도록 보장
      createdAt: toTimestamp(survey.createdAt),
      updatedAt: toTimestamp(survey.updatedAt)
    });
    return docRef.id;
  },

  // 설문 템플릿 조회
  async getSurvey(surveyId: string): Promise<Survey | null> {
    const surveyRef = doc(db, COLLECTIONS.SURVEYS, surveyId);
    const surveySnap = await getDoc(surveyRef);
    
    if (surveySnap.exists()) {
      const data = surveySnap.data();
      console.log('🔍 getSurvey - Raw Firestore data:', data);
      console.log('🔍 getSurvey - Questions field:', data.questions);
      console.log('🔍 getSurvey - Questions type:', typeof data.questions);
      console.log('🔍 getSurvey - Questions length:', data.questions?.length);
      
      const result = {
        id: surveySnap.id,
        ...data,
        questions: data.questions || [], // questions 필드가 없으면 빈 배열 반환
        createdAt: fromTimestamp(data.createdAt),
        updatedAt: fromTimestamp(data.updatedAt)
      } as Survey;
      
      console.log('🔍 getSurvey - Final result:', result);
      console.log('🔍 getSurvey - Final questions:', result.questions);
      return result;
    }
    
    return null;
  },

  // 교사별 설문 목록 조회
  async getSurveysByTeacher(teacherId: string): Promise<Survey[]> {
    try {
      const surveysRef = collection(db, COLLECTIONS.SURVEYS);
      // Query only by teacherId to avoid composite index requirement
      const q = query(surveysRef, where('teacherId', '==', teacherId));
      const snapshot = await getDocs(q);
      
      // Sort client-side by createdAt desc
      return snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            questions: data.questions || [], // questions 필드가 없으면 빈 배열 반환
            createdAt: fromTimestamp(data.createdAt),
            updatedAt: fromTimestamp(data.updatedAt)
          } as Survey;
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('getSurveysByTeacher 오류:', error);
      return [];
    }
  },

  // 설문 업데이트
  async updateSurvey(surveyId: string, updates: Partial<Survey>): Promise<void> {
    const surveyRef = doc(db, COLLECTIONS.SURVEYS, surveyId);
    const updateData = {
      ...updates,
      updatedAt: toTimestamp(new Date())
    };
    
    await updateDoc(surveyRef, updateData);
  },

  // 설문 삭제
  async deleteSurvey(surveyId: string): Promise<void> {
    const surveyRef = doc(db, COLLECTIONS.SURVEYS, surveyId);
    await deleteDoc(surveyRef);
  },

  // 설문의 응답 개수 조회
  async getSurveyResponseCount(surveyId: string): Promise<number> {
    try {
      const responsesRef = collection(db, COLLECTIONS.SURVEY_RESPONSES);
      const q = query(responsesRef, where('surveyId', '==', surveyId));
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('getSurveyResponseCount 오류:', error);
      return 0;
    }
  },

  // 학생이 참여할 수 있는 공유 설문 조회
  async getSharedSurveys(classCode: string): Promise<Survey[]> {
    try {
      const surveysRef = collection(db, COLLECTIONS.SURVEYS);
      // Query only by classCode to avoid composite index requirement
      const q = query(surveysRef, where('classCode', '==', classCode));
      const snapshot = await getDocs(q);
      
      // Filter client-side for active surveys and sort by createdAt
      return snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            questions: data.questions || [], // questions 필드가 없으면 빈 배열 반환
            createdAt: fromTimestamp(data.createdAt),
            updatedAt: fromTimestamp(data.updatedAt)
          } as Survey;
        })
        .filter(survey => survey.isActive === true)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('getSharedSurveys 오류:', error);
      // Fallback: return empty array on error
      return [];
    }
  },

  // 설문 응답 저장
  async saveSurveyResponse(response: Omit<SurveyResponse, 'id'>): Promise<string> {
    const responseRef = collection(db, COLLECTIONS.SURVEY_RESPONSES);
    const docRef = await addDoc(responseRef, {
      ...response,
      submittedAt: toTimestamp(response.submittedAt as Date)
    });
    return docRef.id;
  },

  // 설문 응답 생성 (alias for saveSurveyResponse)
  async createSurveyResponse(response: Omit<SurveyResponse, 'id'>): Promise<string> {
    return this.saveSurveyResponse(response);
  },

  // 학생별 설문 응답 조회
  async getResponsesByStudent(studentId: string, limitCount?: number): Promise<SurveyResponse[]> {
    try {
      const responsesRef = collection(db, COLLECTIONS.SURVEY_RESPONSES);
      // Query only by studentId to avoid composite index requirement
      const q = query(responsesRef, where('studentId', '==', studentId));
      const snapshot = await getDocs(q);
      
      // Sort client-side by submittedAt desc and apply limit if needed
      let responses = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          submittedAt: fromTimestamp(doc.data().submittedAt)
        } as SurveyResponse))
        .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
      
      // Apply limit if specified
      if (limitCount) {
        responses = responses.slice(0, limitCount);
      }
      
      return responses;
    } catch (error) {
      console.error('getResponsesByStudent 오류:', error);
      return [];
    }
  },

  // 학생 응답 조회 (alias for getResponsesByStudent)
  async getStudentResponses(studentId: string, limitCount?: number): Promise<SurveyResponse[]> {
    return this.getResponsesByStudent(studentId, limitCount);
  },

  // 반별 설문 응답 조회
  async getResponsesByClass(classCode: string, startDate?: Date, endDate?: Date): Promise<SurveyResponse[]> {
    const responsesRef = collection(db, COLLECTIONS.SURVEY_RESPONSES);
    // Query only by classCode to avoid composite index requirement
    const q = query(responsesRef, where('classCode', '==', classCode));
    
    const snapshot = await getDocs(q);
    
    // Filter client-side for date range if provided
    let responses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: fromTimestamp(doc.data().submittedAt)
    } as SurveyResponse));
    
    if (startDate && endDate) {
      responses = responses.filter(response => {
        const responseDate = response.submittedAt;
        return responseDate >= startDate && responseDate <= endDate;
      });
    }
    
    // Sort by submittedAt desc
    return responses.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  },

  // 특정 설문에 대한 응답 조회 (교사가 설문별로 응답 확인용)
  async getResponsesBySurvey(surveyId: string): Promise<SurveyResponse[]> {
    try {
      const responsesRef = collection(db, COLLECTIONS.SURVEY_RESPONSES);
      const q = query(responsesRef, where('surveyId', '==', surveyId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          submittedAt: fromTimestamp(doc.data().submittedAt)
        } as SurveyResponse))
        .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
    } catch (error) {
      console.error('getResponsesBySurvey 오류:', error);
      return [];
    }
  },

  // 🔍 디버깅용: 설문 응답 데이터 검증 함수
  async debugSurveyResponses(surveyId: string): Promise<{
    totalResponses: number;
    responsesWithSurveyId: number;
    sampleResponses: SurveyResponse[];
  }> {
    try {
      console.log('🔍 설문 응답 데이터 검증 시작:', surveyId);
      
      // 1. 전체 응답 컬렉션에서 해당 설문 ID 검색
      const responsesRef = collection(db, COLLECTIONS.SURVEY_RESPONSES);
      const allResponsesQuery = query(responsesRef);
      const allSnapshot = await getDocs(allResponsesQuery);
      
      // 2. surveyId 필드가 있는 응답 필터링
      const surveyIdQuery = query(responsesRef, where('surveyId', '==', surveyId));
      const surveyIdSnapshot = await getDocs(surveyIdQuery);
      
      const allResponses = allSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SurveyResponse[];
      
      const surveyIdResponses = surveyIdSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SurveyResponse[];
      
      console.log('📊 검증 결과:');
      console.log('- 전체 응답 수:', allResponses.length);
      console.log('- surveyId 필드가 있는 응답 수:', surveyIdResponses.length);
      console.log('- 샘플 응답 (첫 3개):', allResponses.slice(0, 3));
      
      return {
        totalResponses: allResponses.length,
        responsesWithSurveyId: surveyIdResponses.length,
        sampleResponses: allResponses.slice(0, 3)
      };
    } catch (error) {
      console.error('❌ 설문 응답 검증 오류:', error);
      return {
        totalResponses: 0,
        responsesWithSurveyId: 0,
        sampleResponses: []
      };
    }
  },

  // 특정 설문 응답 삭제
  async deleteSurveyResponse(responseId: string): Promise<void> {
    try {
      const responseRef = doc(db, COLLECTIONS.SURVEY_RESPONSES, responseId);
      await deleteDoc(responseRef);
      console.log(`설문 응답 ${responseId}가 성공적으로 삭제되었습니다.`);
    } catch (error) {
      console.error('설문 응답 삭제 중 오류:', error);
      throw new Error('설문 응답 삭제에 실패했습니다.');
    }
  },

  // 여러 설문 응답 일괄 삭제
  async deleteSurveyResponses(responseIds: string[]): Promise<void> {
    const batch = writeBatch(db);
    
    try {
      responseIds.forEach(responseId => {
        const responseRef = doc(db, COLLECTIONS.SURVEY_RESPONSES, responseId);
        batch.delete(responseRef);
      });
      
      await batch.commit();
      console.log(`${responseIds.length}개의 설문 응답이 성공적으로 삭제되었습니다.`);
    } catch (error) {
      console.error('설문 응답 일괄 삭제 중 오류:', error);
      throw new Error('설문 응답 일괄 삭제에 실패했습니다.');
    }
  }
};

// SEL 분석 관련 함수
export const analysisService = {
  // SEL 분석 결과 저장
  async saveAnalysis(analysis: Omit<SELAnalysis, 'id'>): Promise<string> {
    const analysisRef = collection(db, COLLECTIONS.SEL_ANALYSES);
    const docRef = await addDoc(analysisRef, {
      ...analysis,
      analysisDate: toTimestamp(analysis.analysisDate)
    });
    return docRef.id;
  },

  // 학생별 분석 결과 조회
  async getAnalysesByStudent(studentId: string, limit?: number): Promise<SELAnalysis[]> {
    try {
      const analysisRef = collection(db, COLLECTIONS.SEL_ANALYSES);
      // Query only by studentId to avoid composite index requirement
      const q = query(analysisRef, where('studentId', '==', studentId));
      const snapshot = await getDocs(q);
      
      // Sort client-side by analysisDate desc and apply limit if needed
      let analyses = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          analysisDate: fromTimestamp(doc.data().analysisDate)
        } as SELAnalysis))
        .sort((a, b) => b.analysisDate.getTime() - a.analysisDate.getTime());
      
      // Apply limit if specified
      if (limit) {
        analyses = analyses.slice(0, limit);
      }
      
      return analyses;
    } catch (error) {
      console.error('getAnalysesByStudent 오류:', error);
      return [];
    }
  },

  // 최신 분석 결과 조회
  async getLatestAnalysis(studentId: string): Promise<SELAnalysis | null> {
    const analyses = await this.getAnalysesByStudent(studentId, 1);
    return analyses.length > 0 ? analyses[0] : null;
  }
};

// 설문 문항 관리 함수
export const questionService = {
  // 설문 문항 조회 (학년별)
  async getQuestionsByGrade(grade: Grade, surveyType: 'daily' | 'weekly' | 'monthly'): Promise<SurveyQuestion[]> {
    try {
      const questionsRef = collection(db, COLLECTIONS.SURVEY_QUESTIONS);
      // Query only by grade to avoid composite index requirement
      const q = query(questionsRef, where('grade', 'array-contains', grade));
      const snapshot = await getDocs(q);
      
      // Sort client-side by order and apply survey type filter
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as SurveyQuestion))
        .sort((a, b) => a.order - b.order)
        .filter(q => q.type !== 'text' || surveyType !== 'daily'); // 일일 설문에서는 텍스트 문항 제외
    } catch (error) {
      console.error('getQuestionsByGrade 오류:', error);
      return [];
    }
  },

  // 모든 설문 문항 조회
  async getAllQuestions(): Promise<SurveyQuestion[]> {
    try {
      const questionsRef = collection(db, COLLECTIONS.SURVEY_QUESTIONS);
      // Query without orderBy to avoid composite index requirement
      const q = query(questionsRef);
      const snapshot = await getDocs(q);
      
      // Sort client-side by domain and order
      return snapshot.docs
        .map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as SurveyQuestion))
        .sort((a, b) => {
          if (a.domain !== b.domain) {
            return a.domain.localeCompare(b.domain);
          }
          return a.order - b.order;
        });
    } catch (error) {
      console.error('getAllQuestions 오류:', error);
      return [];
    }
  }
};

// 배치 작업 유틸리티
export const batchService = {
  // 여러 문서 일괄 업데이트
  async batchUpdate(updates: { collection: string; id: string; data: Record<string, unknown> }[]): Promise<void> {
    const batch = writeBatch(db);
    
    updates.forEach(update => {
      const docRef = doc(db, update.collection, update.id);
      batch.update(docRef, update.data);
    });
    
    await batch.commit();
  },

  // 여러 문서 일괄 생성
  async batchCreate(creates: { collection: string; data: Record<string, unknown> }[]): Promise<void> {
    const batch = writeBatch(db);
    
    creates.forEach(create => {
      const docRef = doc(collection(db, create.collection));
      batch.set(docRef, create.data);
    });
    
    await batch.commit();
  }
};

// 무드미터 관련 함수
export const moodService = {
  // 일일 무드 저장
  async saveDailyMood(mood: Omit<DailyMood, 'id'>): Promise<string> {
    console.log('💾 [moodService] saveDailyMood 호출됨:', mood);
    console.log('💾 [moodService] Firebase db 상태:', !!db);
    console.log('💾 [moodService] 사용할 컬렉션:', COLLECTIONS.DAILY_MOODS);
    
    try {
      const moodRef = collection(db, COLLECTIONS.DAILY_MOODS);
      console.log('💾 [moodService] 컬렉션 참조 생성 완료');
      
      const docData = {
        ...mood,
        submittedAt: toTimestamp(mood.submittedAt as Date)
      };
      console.log('💾 [moodService] 저장할 문서 데이터:', docData);
      
      const docRef = await addDoc(moodRef, docData);
      console.log('✅ [moodService] 문서 저장 완료, ID:', docRef.id);
      console.log('✅ [moodService] 문서 경로:', docRef.path);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ [moodService] saveDailyMood 오류:', error);
      throw error;
    }
  },

  // 학생의 오늘 무드 조회
  async getTodayMood(studentId: string): Promise<DailyMood | null> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const moodRef = collection(db, COLLECTIONS.DAILY_MOODS);
    
    // 먼저 학생 ID로만 쿼리 (인덱스 필요 없음)
    const q = query(
      moodRef,
      where('studentId', '==', studentId)
    );
    
    const snapshot = await getDocs(q);
    
    // 클라이언트 측에서 오늘 날짜 필터링
    const todayMood = snapshot.docs.find(doc => {
      const data = doc.data();
      return data.date === today;
    });
    
    if (todayMood) {
      const data = todayMood.data();
      return {
        id: todayMood.id,
        ...data,
        submittedAt: fromTimestamp(data.submittedAt)
      } as DailyMood;
    }
    
    return null;
  },

  // 학생의 무드 기록 조회 (기간별)
  async getStudentMoods(studentId: string, days: number = 30): Promise<DailyMood[]> {
    const moodRef = collection(db, COLLECTIONS.DAILY_MOODS);
    
    // 먼저 학생 ID로만 쿼리 (인덱스 필요 없음)
    const q = query(
      moodRef,
      where('studentId', '==', studentId)
    );
    
    const snapshot = await getDocs(q);
    
    // 클라이언트 측에서 날짜 필터링
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    return snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          submittedAt: fromTimestamp(data.submittedAt)
        } as DailyMood;
      })
      .filter(mood => mood.date >= startDateStr)
      .sort((a, b) => b.date.localeCompare(a.date)); // 내림차순 정렬
  },

  // 반의 오늘 무드 조회 (교사용)
  async getClassTodayMoods(classCode: string): Promise<DailyMood[]> {
    console.log('🏫 [moodService] getClassTodayMoods 호출됨, classCode:', classCode);
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    console.log('🏫 [moodService] 조회할 날짜:', today);
    
    // 먼저 해당 반의 학생들을 조회
    const students = await studentService.getStudentsByClass(classCode);
    const userIds = students.map(s => s.userId); // studentId 대신 userId 사용
    
    console.log('🏫 [moodService] 반의 학생 수:', students.length);
    console.log('🏫 [moodService] 학생 UserIDs (Firebase Auth UIDs):', userIds);
    
    if (userIds.length === 0) {
      console.log('⚠️ [moodService] 반에 학생이 없음');
      return [];
    }
    
    const moodRef = collection(db, COLLECTIONS.DAILY_MOODS);
    const allMoods: DailyMood[] = [];
    
    console.log('🏫 [moodService] 전체 무드 문서 수 확인 중...');
    const allDocsQuery = query(moodRef);
    const allDocsSnapshot = await getDocs(allDocsQuery);
    console.log('🏫 [moodService] 전체 무드 문서 수:', allDocsSnapshot.size);
    
    if (allDocsSnapshot.size > 0) {
      console.log('🏫 [moodService] 일부 무드 문서 데이터 샘플:');
      allDocsSnapshot.docs.slice(0, 3).forEach((doc, index) => {
        console.log(`  문서 ${index + 1}:`, { id: doc.id, data: doc.data() });
      });
    }
    
    // Firestore 'in' 쿼리는 최대 10개까지이므로 배치로 처리
    for (let i = 0; i < userIds.length; i += 10) {
      const batch = userIds.slice(i, i + 10);
      console.log(`🏫 [moodService] 배치 ${Math.floor(i/10) + 1} 처리 중, 학생 UserIDs:`, batch);
      
      const q = query(
        moodRef,
        where('studentId', 'in', batch)
      );
      
      const snapshot = await getDocs(q);
      console.log(`🏫 [moodService] 배치 ${Math.floor(i/10) + 1} 쿼리 결과:`, snapshot.size, '개 문서');
      
      snapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`  배치 문서 ${index + 1}:`, { 
          id: doc.id, 
          studentId: data.studentId, 
          date: data.date,
          emotion: data.emotion 
        });
      });
      
      const batchMoods = snapshot.docs
        .filter(doc => {
          const isToday = doc.data().date === today;
          console.log(`    날짜 필터링: ${doc.data().date} === ${today} = ${isToday}`);
          return isToday;
        })
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            submittedAt: fromTimestamp(data.submittedAt)
          } as DailyMood;
        });
      
      console.log(`🏫 [moodService] 배치 ${Math.floor(i/10) + 1} 오늘 무드:`, batchMoods.length, '개');
      allMoods.push(...batchMoods);
    }
    
    console.log('🏫 [moodService] 최종 결과: 총', allMoods.length, '개의 오늘 무드');
    allMoods.forEach((mood, index) => {
      console.log(`  무드 ${index + 1}:`, {
        studentId: mood.studentId,
        emotion: mood.emotion,
        date: mood.date,
        emoji: mood.emoji
      });
    });
    
    return allMoods;
  },

  // 무드 업데이트 (당일 무드 수정)
  async updateTodayMood(studentId: string, moodUpdate: Partial<DailyMood>): Promise<void> {
    const existingMood = await this.getTodayMood(studentId);
    
    if (existingMood) {
      const moodRef = doc(db, COLLECTIONS.DAILY_MOODS, existingMood.id);
      const processedUpdate = { ...moodUpdate } as Record<string, unknown>;
      
      if (processedUpdate.submittedAt) {
        processedUpdate.submittedAt = toTimestamp(processedUpdate.submittedAt as Date);
      }
      
      await updateDoc(moodRef, processedUpdate);
    } else {
      // 오늘 무드가 없으면 새로 생성
      const today = new Date().toISOString().split('T')[0];
      const newMood: Omit<DailyMood, 'id'> = {
        studentId,
        date: today,
        moodId: moodUpdate.moodId || '',
        emotion: moodUpdate.emotion || '',
        emoji: moodUpdate.emoji || '',
        energy: moodUpdate.energy || 'low',
        pleasantness: moodUpdate.pleasantness || 'pleasant',
        note: moodUpdate.note,
        submittedAt: new Date()
      };
      
      await this.saveDailyMood(newMood);
    }
  }
};