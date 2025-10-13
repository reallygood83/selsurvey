// 교사용 학생 관리 페이지 - 학생 추가/삭제/설문 기록 관리
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { classService, studentService, surveyService } from '@/lib/firestore';
import { ClassInfo, StudentProfile, SurveyResponse, Grade } from '@/types';
import { ClassSelector } from '@/components/teacher/ClassSelector';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Users,
  UserPlus,
  UserMinus,
  Trash2,
  Eye,
  ArrowLeft,
  FileText,
  AlertTriangle,
  Edit2, // 🆕 편집 아이콘
  Check, // 🆕 확인 아이콘
  X, // 🆕 취소 아이콘
  ArrowUpDown, // 🆕 정렬 아이콘
  Hash // 🆕 번호 아이콘
} from 'lucide-react';
import { toast } from 'sonner';

interface StudentWithResponses extends StudentProfile {
  recentResponses: SurveyResponse[];
}

export default function StudentManagePage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [selectedClassInfo, setSelectedClassInfo] = useState<ClassInfo | null>(null); // 🆕 드롭다운에서 선택된 학급 정보 유지
  const [students, setStudents] = useState<StudentWithResponses[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentWithResponses | null>(null);
  const [showResponsesDialog, setShowResponsesDialog] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null); // 🆕 편집 중인 학생 ID
  const [editingNumber, setEditingNumber] = useState<string>(''); // 🆕 편집 중인 번호
  const [sortBy, setSortBy] = useState<'number' | 'name'>('number'); // 🆕 정렬 기준

  useEffect(() => {
    if (user && userProfile?.role === 'teacher') {
      loadStudentData();
    }
  }, [user, userProfile]);

  const loadStudentData = async (selectedClass?: ClassInfo) => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('데이터 로딩 시작...');

      // 선택된 학급이 있으면 사용, 없으면 이전에 선택된 학급 또는 활성 학급 로드
      let classData = selectedClass || selectedClassInfo;
      if (!classData) {
        classData = await classService.getActiveClass(user.uid);
      }

      console.log('반 데이터:', classData);

      if (classData) {
        setClassInfo(classData);
        setSelectedClassInfo(classData); // 🆕 선택된 학급 정보 저장

        // 학생 목록 로드
        const studentsData = await studentService.getStudentsByClass(classData.classCode);
        console.log('실제 학생 데이터:', studentsData);
        console.log('학생 수:', studentsData.length);
        
        // 각 학생의 최근 설문 응답 로드
        const studentsWithResponses = await Promise.all(
          studentsData.map(async (student) => {
            const responses = await surveyService.getResponsesByStudent(student.id, 5);
            return {
              ...student,
              recentResponses: responses
            };
          })
        );

        // 실제 데이터가 있으면 그대로 사용, 없으면 테스트 데이터 사용
        const finalStudents = studentsWithResponses.length > 0 ? studentsWithResponses : [
          {
            id: 'test1',
            userId: 'manual_test1',
            name: '테스트 학생1',
            grade: 1 as Grade,
            classCode: 'TEST001',
            teacherId: user.uid,
            joinedAt: new Date(),
            isActive: true,
            responseHistory: [],
            analysisHistory: [],
            totalResponses: 3,
            participationRate: 75,
            recentResponses: []
          },
          {
            id: 'test2',
            userId: 'manual_test2',
            name: '테스트 학생2',
            grade: 1 as Grade,
            classCode: 'TEST001',
            teacherId: user.uid,
            joinedAt: new Date(),
            isActive: true,
            responseHistory: [],
            analysisHistory: [],
            totalResponses: 5,
            participationRate: 90,
            recentResponses: []
          }
        ];
        
        console.log('최종 학생 데이터:', finalStudents);
        setStudents(finalStudents);
      } else {
        // 테스트용 더미 데이터 (UI 확인용)
        console.log('테스트용 더미 학생 데이터 로드');
        setClassInfo({
          id: 'test-class',
          classCode: 'TEST001',
          schoolName: '테스트 학교',
          grade: 1 as Grade,
          className: '1반',
          teacherId: user.uid,
          teacherName: '테스트 교사',
          students: ['test1', 'test2'],
          studentCount: 2,
          createdAt: new Date(),
          isActive: true
        });
        
        setStudents([
          {
            id: 'test1',
            userId: 'manual_test1',
            name: '테스트 학생1',
            grade: 1 as Grade,
            classCode: 'TEST001',
            teacherId: user.uid,
            joinedAt: new Date(),
            isActive: true,
            responseHistory: [],
            analysisHistory: [],
            totalResponses: 3,
            participationRate: 75,
            recentResponses: []
          },
          {
            id: 'test2',
            userId: 'manual_test2',
            name: '테스트 학생2',
            grade: 1 as Grade,
            classCode: 'TEST001',
            teacherId: user.uid,
            joinedAt: new Date(),
            isActive: true,
            responseHistory: [],
            analysisHistory: [],
            totalResponses: 5,
            participationRate: 90,
            recentResponses: []
          }
        ]);
      }
    } catch (error) {
      console.error('학생 데이터 로드 오류:', error);
      toast.error('학생 데이터를 불러오는 중 오류가 발생했습니다.');
      
      // 에러 발생 시에도 테스트 데이터 표시
      console.log('에러 발생 - 테스트용 더미 학생 데이터 로드');
      setClassInfo({
        id: 'test-class',
        classCode: 'TEST001',
        schoolName: '테스트 학교',
        grade: 1 as Grade,
        className: '1반',
        teacherId: user.uid,
        teacherName: '테스트 교사',
        students: ['test1', 'test2'],
        studentCount: 2,
        createdAt: new Date(),
        isActive: true
      });
      
      setStudents([
        {
          id: 'test1',
          userId: 'manual_test1',
          name: '테스트 학생1',
          grade: 1,
          classCode: 'TEST001',
          teacherId: user.uid,
          joinedAt: new Date(),
          isActive: true,
          responseHistory: [],
          analysisHistory: [],
          totalResponses: 3,
          participationRate: 75,
          recentResponses: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async () => {
    if (!user || !classInfo || !newStudentName.trim()) {
      toast.error('학생 이름을 입력해주세요.');
      return;
    }

    try {
      // 새 학생 프로필 생성
      const newStudentProfile = {
        userId: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 수동 추가 사용자 ID
        name: newStudentName.trim(),
        grade: classInfo.grade,
        classCode: classInfo.classCode,
        teacherId: user.uid,
        joinedAt: new Date(),
        isActive: true,
        responseHistory: [],
        analysisHistory: [],
        totalResponses: 0,
        participationRate: 0
      };

      const studentId = await studentService.createStudentProfile(newStudentProfile);
      
      // 반에 학생 추가
      await classService.addStudentToClass(classInfo.id, studentId);

      toast.success(`${newStudentName} 학생이 추가되었습니다.`);
      setNewStudentName('');
      setShowAddDialog(false);
      loadStudentData(); // 목록 새로고침
    } catch (error) {
      console.error('학생 추가 오류:', error);
      toast.error('학생 추가 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteStudent = async (student: StudentWithResponses) => {
    if (!user) return;

    try {
      // 학생의 모든 설문 응답 삭제
      const allResponses = await surveyService.getResponsesByStudent(student.id);
      for (const response of allResponses) {
        await surveyService.deleteSurveyResponse(response.id);
      }

      // 학생 프로필 삭제 (cascading delete 사용)
      await studentService.deleteStudent(student.id);

      toast.success(`${student.name} 학생이 삭제되었습니다.`);
      loadStudentData(); // 목록 새로고침
    } catch (error) {
      console.error('학생 삭제 오류:', error);
      toast.error('학생 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteResponse = async (responseId: string) => {
    try {
      // 설문 응답 삭제
      await surveyService.deleteSurveyResponse(responseId);
      
      toast.success('설문 기록이 삭제되었습니다.');
      loadStudentData(); // 목록 새로고침
    } catch (error) {
      console.error('설문 기록 삭제 오류:', error);
      toast.error('설문 기록 삭제 중 오류가 발생했습니다.');
    }
  };

  const viewStudentResponses = (student: StudentWithResponses) => {
    setSelectedStudent(student);
    setShowResponsesDialog(true);
  };

  // 🆕 번호 편집 시작
  const startEditingNumber = (student: StudentWithResponses) => {
    setEditingStudentId(student.id);
    setEditingNumber(student.studentNumber?.toString() || '');
  };

  // 🆕 번호 업데이트
  const handleUpdateNumber = async (studentId: string) => {
    try {
      const numberValue = editingNumber.trim() ? parseInt(editingNumber.trim()) : undefined;

      // 유효성 검사
      if (numberValue !== undefined && (numberValue < 1 || numberValue > 99)) {
        toast.error('번호는 1~99 사이여야 합니다.');
        return;
      }

      // Firestore 업데이트
      await studentService.updateStudentProfile(studentId, { studentNumber: numberValue });

      // 로컬 상태 업데이트
      setStudents(students.map(s =>
        s.id === studentId ? { ...s, studentNumber: numberValue } : s
      ));

      setEditingStudentId(null);
      setEditingNumber('');
      toast.success('번호가 업데이트되었습니다.');
    } catch (error) {
      console.error('번호 업데이트 오류:', error);
      toast.error('번호 업데이트에 실패했습니다.');
    }
  };

  // 🆕 번호 편집 취소
  const cancelEditingNumber = () => {
    setEditingStudentId(null);
    setEditingNumber('');
  };

  // 🆕 학생 정렬
  const sortedStudents = [...students].sort((a, b) => {
    if (sortBy === 'number') {
      // 번호순: 번호가 있는 학생 먼저, 같은 번호면 이름순
      if (a.studentNumber !== undefined && b.studentNumber === undefined) return -1;
      if (a.studentNumber === undefined && b.studentNumber !== undefined) return 1;
      if (a.studentNumber !== undefined && b.studentNumber !== undefined) {
        if (a.studentNumber !== b.studentNumber) {
          return a.studentNumber - b.studentNumber;
        }
      }
      return a.name.localeCompare(b.name, 'ko-KR');
    } else {
      // 이름순(가나다순)
      return a.name.localeCompare(b.name, 'ko-KR');
    }
  });

  // authLoading이 끝날 때까지 로딩 화면 표시 (너무 빠른 권한 체크 방지)
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!user || userProfile?.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">접근 권한이 없습니다</h2>
              <p className="text-muted-foreground">교사만 접근할 수 있는 페이지입니다.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="bg-background border-b">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            {/* 좌측: 제목 및 학급 선택 */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/teacher/dashboard">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    대시보드로
                  </Link>
                </Button>
                <h1 className="text-3xl font-bold">학생 관리</h1>
              </div>
              {user && (
                <ClassSelector
                  currentClassId={classInfo?.id}
                  onClassChange={(newClass) => {
                    console.log('📍 학급 변경:', newClass.className);
                    loadStudentData(newClass);
                  }}
                  userId={user.uid}
                />
              )}
            </div>

            {/* 우측: 학생 추가 버튼 */}
            <div className="flex space-x-4">
              <Button onClick={() => setShowAddDialog(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                학생 추가
              </Button>
            </div>
            
            {/* 학생 추가 모달 */}
            {showAddDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">새 학생 추가</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      반에 새로운 학생을 직접 추가합니다. 추가된 학생은 반 코드 없이도 시스템에 등록됩니다.
                    </p>
                  </div>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="student-name">학생 이름</Label>
                      <Input
                        id="student-name"
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        placeholder="학생의 실명을 입력하세요"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddStudent();
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      취소
                    </Button>
                    <Button onClick={handleAddStudent} disabled={!newStudentName.trim()}>
                      추가
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground truncate">
                    전체 학생 수
                  </p>
                  <p className="text-lg font-medium">
                    {students.length}명
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground truncate">
                    활성 학생
                  </p>
                  <p className="text-lg font-medium">
                    {students.filter(s => s.isActive).length}명
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground truncate">
                    총 설문 응답
                  </p>
                  <p className="text-lg font-medium">
                    {students.reduce((sum, s) => sum + s.totalResponses, 0)}개
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 학생 목록 */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">
                학생 목록 ({students.length}명)
              </CardTitle>
              {/* 🆕 정렬 버튼 */}
              <div className="flex gap-2">
                <Button
                  variant={sortBy === 'number' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('number')}
                >
                  <Hash className="w-4 h-4 mr-1" />
                  번호순
                </Button>
                <Button
                  variant={sortBy === 'name' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('name')}
                >
                  <ArrowUpDown className="w-4 h-4 mr-1" />
                  가나다순
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">아직 등록된 학생이 없습니다</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  학생 추가 버튼으로 새 학생을 등록하거나 학생들에게 반 코드를 알려주세요
                </p>
                {classInfo && (
                  <Badge variant="outline" className="font-mono mt-2">
                    반 코드: {classInfo.classCode}
                  </Badge>
                )}
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      {/* 🆕 번호 컬럼 */}
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        번호
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        이름
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        등록 방식
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        참여일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        설문 응답 수
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        참여율
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-border">
                    {sortedStudents.map((student) => (
                      <tr key={student.id} className="group hover:bg-muted/50">
                        {/* 🆕 번호 셀 (편집 가능) */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {editingStudentId === student.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="1"
                                max="99"
                                value={editingNumber}
                                onChange={(e) => setEditingNumber(e.target.value)}
                                className="w-16 h-8 text-sm"
                                placeholder="번호"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleUpdateNumber(student.id);
                                  } else if (e.key === 'Escape') {
                                    cancelEditingNumber();
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => handleUpdateNumber(student.id)}
                              >
                                <Check className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={cancelEditingNumber}
                              >
                                <X className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700">
                                {student.studentNumber || '-'}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                onClick={() => startEditingNumber(student)}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium">
                            {student.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={student.userId.startsWith('manual_') ? 'secondary' : 'default'}>
                            {student.userId.startsWith('manual_') ? '교사 추가' : '코드 참여'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {student.joinedAt.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {student.totalResponses}개
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {student.participationRate}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant={student.isActive ? "default" : "secondary"}
                            className={student.isActive ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                          >
                            {student.isActive ? '활성' : '비활성'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => viewStudentResponses(student)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              응답
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => {
                                if (typeof window !== 'undefined' && window.confirm(`정말로 ${student.name} 학생을 삭제하시겠습니까?\n\n삭제되는 데이터:\n• 학생 프로필 정보\n• 모든 설문 응답 기록 (${student.totalResponses}개)\n• SEL 분석 결과\n\n⚠️ 이 작업은 되돌릴 수 없습니다.`)) {
                                  handleDeleteStudent(student);
                                }
                              }}
                            >
                              <UserMinus className="w-4 h-4 mr-1" />
                              삭제
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* 학생 설문 응답 모달 */}
      {showResponsesDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                {selectedStudent?.name} 학생의 설문 응답
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                최근 설문 응답 내역과 개별 기록을 확인하고 관리할 수 있습니다.
              </p>
            </div>
            
            {selectedStudent && (
              <div className="space-y-4">
                {selectedStudent.recentResponses.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium">설문 응답이 없습니다</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      아직 제출된 설문 응답이 없습니다.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedStudent.recentResponses.map((response) => (
                      <Card key={response.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-medium">
                              {response.surveyType === 'daily' ? '일일 체크' : 
                               response.surveyType === 'weekly' ? '주간 설문' : 
                               response.surveyType === 'monthly' ? '월간 설문' : '사용자 설문'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              제출일: {response.submittedAt.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              응답 수: {response.responses.length}개
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600"
                            onClick={() => {
                              if (typeof window !== 'undefined' && window.confirm('이 설문 응답 기록을 삭제하시겠습니까? 삭제된 기록은 복구할 수 없습니다.')) {
                                handleDeleteResponse(response.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setShowResponsesDialog(false)}>
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}