// SEL 감정분석 플랫폼 타입 정의

// 사용자 역할
export type UserRole = 'teacher' | 'student';

// 학년
export type Grade = 1 | 2 | 3 | 4 | 5 | 6;

// SEL 영역
export type SELDomain = 
  | 'selfAwareness'
  | 'selfManagement' 
  | 'socialAwareness'
  | 'relationshipSkills'
  | 'responsibleDecisionMaking';

// 감정 상태 (이모지 기반)
export type EmotionType = 'happy' | 'sad' | 'angry' | 'worried' | 'neutral';

// 감정 강도
export type EmotionIntensity = 'low' | 'medium' | 'high';

// 무드미터 감정 옵션
export interface MoodOption {
  id: string;
  emotion: string;
  emoji: string;
  energy: 'high' | 'low';
  pleasantness: 'pleasant' | 'unpleasant';
  color: string;
  description: string;
}

// 일일 무드 기록
export interface DailyMood {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD 형식
  moodId: string;
  emotion: string;
  emoji: string;
  energy: 'high' | 'low';
  pleasantness: 'pleasant' | 'unpleasant';
  note?: string; // 선택적 메모
  submittedAt: Date;
}

// 설문 유형
export type SurveyType = 'daily' | 'weekly' | 'monthly' | 'custom' | 'template' | 'ai-generated';

// 설문 템플릿/정의
export interface Survey {
  id: string;
  title: string;
  description: string;
  type: SurveyType;
  grade: Grade[];
  questions: SurveyQuestion[];
  teacherId: string;
  classCode: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 설문 공유 (다중 학급 지원)
export interface SurveyShare {
  id: string;
  surveyId: string;       // 공유할 설문 ID
  classCode: string;      // 공유 대상 학급 코드
  teacherId: string;      // 공유한 교사 ID (권한 확인용)
  isActive: boolean;      // 해당 학급에서 활성화 여부
  sharedAt: Date;         // 공유 시작 시간
  endDate?: Date;         // 공유 종료 시간 (선택사항)
}

// 사용자 정보
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  schoolInfo?: SchoolInfo;
  encryptedGeminiApiKey?: string; // 🔐 암호화된 Gemini API 키 (Firebase 저장용)
  createdAt: Date;
  updatedAt: Date;
}

// 학교 정보
export interface SchoolInfo {
  schoolName: string;
  grade: Grade;
  className: string;
  classCode?: string; // 교사의 경우 생성, 학생의 경우 입력
  teacherId?: string; // 학생의 경우 소속 교사 ID
}

// 반 정보
export interface ClassInfo {
  id: string;
  classCode: string;
  teacherId: string;
  teacherName: string;
  schoolName: string;
  grade: Grade;
  className: string;
  year: number; // 학년도 (예: 2025)
  studentCount: number;
  students: string[]; // 학생 ID 배열
  createdAt: Date;
  isActive: boolean;
}

// 설문 문항
export interface SurveyQuestion {
  id: string;
  type: 'emotion' | 'scale' | 'choice' | 'text';
  domain: SELDomain;
  question: string;
  grade: Grade[]; // 적용 학년
  options?: SurveyOption[];
  isRequired: boolean;
  order: number;
}

// 설문 선택지
export interface SurveyOption {
  id: string;
  text: string;
  emoji?: string;
  value: number;
  image?: string;
}

// 설문 응답
export interface SurveyResponse {
  id: string;
  surveyId: string; // 🔥 중요: 설문 ID 필드 추가
  studentId: string;
  surveyType: SurveyType;
  responses: {
    questionId: string;
    answer: string | number | string[];
    domain: SELDomain;
  }[];
  submittedAt: Date;
  grade: Grade;
  classCode: string;
}

// SEL 점수
export interface SELScores {
  selfAwareness: number;
  selfManagement: number;
  socialAwareness: number;
  relationshipSkills: number;
  responsibleDecisionMaking: number;
}

// SEL 분석 결과
export interface SELAnalysis {
  id: string;
  studentId: string;
  analysisDate: Date;
  period: string; // "2024-03-W1" (주간), "2024-03" (월간)
  scores: SELScores;
  strengths: string[];
  growthAreas: string[];
  observations: string;
  recommendations: string[];
  emotionalPattern: string;
  supportStrategy: string;
  grade: Grade;
  classCode: string;
}

// 학생 프로필
export interface StudentProfile {
  id: string;
  userId: string;
  name: string;
  studentNumber?: number; // 🆕 학생 번호 (선택적, 1-99)
  grade: Grade;
  classCode: string;
  teacherId: string;
  joinedAt: Date;
  isActive: boolean;

  // SEL 관련 정보
  currentScores?: SELScores;
  recentAnalysis?: SELAnalysis;
  responseHistory: SurveyResponse[];
  analysisHistory: SELAnalysis[];

  // 통계 정보
  totalResponses: number;
  participationRate: number; // 참여율 (%)
  lastResponseDate?: Date;
}

// 교사 대시보드 데이터
export interface TeacherDashboard {
  classInfo: ClassInfo;
  students: StudentProfile[];
  classAverages: SELScores;
  participationStats: {
    totalStudents: number;
    activeStudents: number;
    dailyParticipation: number;
    weeklyParticipation: number;
  };
  recentResponses: SurveyResponse[];
  alerts: DashboardAlert[];
}

// 대시보드 알림
export interface DashboardAlert {
  id: string;
  type: 'attention' | 'improvement' | 'milestone';
  studentId?: string;
  studentName?: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: Date;
  isRead: boolean;
}

// 리포트 데이터
export interface TeacherReport {
  classOverview: {
    totalStudents: number;
    averageScores: SELScores;
    classStrengths: string[];
    attentionAreas: string[];
  };
  studentSummaries: {
    studentId: string;
    name: string;
    summary: string;
    keyObservations: string;
    classroomSupport: string;
  }[];
  teachingRecommendations: {
    activity: string;
    description: string;
    targetArea: SELDomain;
    duration: string;
  }[];
  environmentSuggestions: string[];
  peerRelationshipStrategies: string[];
  generatedAt: Date;
  period: string;
}

// 학부모 리포트
export interface ParentReport {
  childDevelopment: {
    currentStatus: string;
    monthlyChanges: string;
    peerComparison: string;
  };
  homeSupport: {
    method: string;
    description: string;
    example: string;
  }[];
  conversationTips: {
    situation: string;
    approach: string;
    sampleWords: string;
  }[];
  dailyActivities: {
    activity: string;
    selConnection: string;
    implementation: string;
  }[];
  growthStory: {
    meaningfulChanges: string;
    childStrengths: string;
    encouragementMessage: string;
  };
  generatedAt: Date;
  studentId: string;
  period: string;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 차트 데이터 타입
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}

// 시간별 트렌드 데이터
export interface TrendData {
  date: string;
  selfAwareness: number;
  selfManagement: number;
  socialAwareness: number;
  relationshipSkills: number;
  responsibleDecisionMaking: number;
}

// 설문 설정
export interface SurveyConfig {
  dailySurvey: {
    enabled: boolean;
    questions: string[]; // 질문 ID 배열
    scheduledTime: string; // "09:00"
  };
  weeklySurvey: {
    enabled: boolean;
    questions: string[];
    scheduledDay: number; // 0-6 (일-토)
    scheduledTime: string;
  };
  monthlySurvey: {
    enabled: boolean;
    questions: string[];
    scheduledDate: number; // 1-31
    scheduledTime: string;
  };
}

// 알림 설정
export interface NotificationSettings {
  emailNotifications: boolean;
  lowParticipationAlert: boolean;
  significantChangeAlert: boolean;
  weeklyReportDelivery: boolean;
  monthlyReportDelivery: boolean;
}

// 학교/반 설정
export interface ClassSettings {
  classInfo: ClassInfo;
  surveyConfig: SurveyConfig;
  notificationSettings: NotificationSettings;
  privacySettings: {
    shareWithParents: boolean;
    anonymizeData: boolean;
    dataRetentionPeriod: number; // 월 단위
  };
}

// AI 상담 리포트
export interface AIReport {
  id: string;
  studentId: string;
  teacherId: string;
  studentName: string;
  grade: Grade;
  classCode: string;
  
  // 개인화된 리포트 데이터
  uniqueProfile?: string;
  strengthsFromData?: string[];
  concernsFromData?: string[];
  personalizedStrategies?: string[];
  classroomApproach?: string[];
  parentGuidance?: string[];
  specificGoals?: string[];
  evidenceQuotes?: string[];
  
  // 기존 리포트 데이터 (호환성)
  summary?: string;
  strengths?: string[];
  concernAreas?: string[];
  recommendations?: string[];
  classroomStrategies?: string[];
  parentSuggestions?: string[];
  nextSteps?: string[];
  
  // 메타데이터
  analysisDataSource: {
    responsesCount: number;
    analysesCount: number;
    period: string;
  };
  
  generatedAt: Date;
  isPersonalized: boolean; // 개인화된 리포트인지 구분
  version: string; // 리포트 생성 버전
}