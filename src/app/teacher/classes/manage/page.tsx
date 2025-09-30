'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Plus,
  Users,
  Calendar,
  GraduationCap,
  Edit,
  Trash2,
  CheckCircle,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { classService } from '@/lib/firestore';
import { ClassInfo } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ClassesManagePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);
  const [deletingClass, setDeletingClass] = useState(false);
  const [switchingClass, setSwitchingClass] = useState<string | null>(null);

  // 학급 목록 불러오기
  useEffect(() => {
    if (!authLoading && user) {
      loadClasses();
    }
  }, [authLoading, user]);

  const loadClasses = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const teacherClasses = await classService.getClassesByTeacher(user.uid);

      // 최신순 정렬 (활성 반이 위로, 그 다음 최신 순)
      const sortedClasses = teacherClasses.sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      setClasses(sortedClasses);
    } catch (err) {
      console.error('학급 불러오기 오류:', err);
      setError('학급 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 활성 학급 전환
  const handleSwitchClass = async (classId: string) => {
    if (!user || switchingClass) return;

    try {
      setSwitchingClass(classId);
      await classService.switchActiveClass(user.uid, classId);
      await loadClasses(); // 목록 새로고침
    } catch (err) {
      console.error('학급 전환 오류:', err);
      setError('학급 전환에 실패했습니다.');
    } finally {
      setSwitchingClass(null);
    }
  };

  // 학급 수정 페이지로 이동
  const handleEditClass = (classId: string) => {
    router.push(`/teacher/classes/edit/${classId}`);
  };

  // 학급 삭제 확인 다이얼로그 열기
  const handleDeleteClick = (classId: string) => {
    setClassToDelete(classId);
    setDeleteDialogOpen(true);
  };

  // 학급 삭제 실행
  const handleDeleteConfirm = async () => {
    if (!classToDelete || deletingClass) return;

    try {
      setDeletingClass(true);
      await classService.deleteClass(classToDelete);
      await loadClasses(); // 목록 새로고침
      setDeleteDialogOpen(false);
      setClassToDelete(null);
    } catch (err) {
      console.error('학급 삭제 오류:', err);
      setError('학급 삭제에 실패했습니다.');
    } finally {
      setDeletingClass(false);
    }
  };

  // 학급 생성 페이지로 이동
  const handleCreateClass = () => {
    router.push('/teacher/classes/create');
  };

  // 학급 카드 렌더링
  const renderClassCard = (classInfo: ClassInfo) => {
    const isSwitching = switchingClass === classInfo.id;

    return (
      <Card
        key={classInfo.id}
        className={`relative overflow-hidden transition-all duration-300 ${
          classInfo.isActive
            ? 'border-emerald-500 shadow-lg bg-emerald-50/50'
            : 'hover:shadow-md'
        }`}
      >
        {classInfo.isActive && (
          <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-4 py-1 text-xs font-semibold flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            활성 학급
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                {classInfo.className}
              </CardTitle>
              <CardDescription className="mt-1 text-sm text-gray-600">
                {classInfo.schoolName} · {classInfo.grade}학년
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* 학급 정보 */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{classInfo.year}학년도</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">학생 {classInfo.studentCount}명</span>
              </div>
            </div>

            {/* 학급 코드 */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">학급 코드</div>
              <div className="text-lg font-mono font-bold text-blue-600">
                {classInfo.classCode}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-2 pt-2">
              {!classInfo.isActive && (
                <Button
                  onClick={() => handleSwitchClass(classInfo.id)}
                  disabled={isSwitching}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  {isSwitching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      전환 중...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4 mr-1" />
                      활성 학급으로 전환
                    </>
                  )}
                </Button>
              )}

              {classInfo.isActive && (
                <Button
                  onClick={() => router.push('/teacher/dashboard')}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="sm"
                >
                  <GraduationCap className="w-4 h-4 mr-1" />
                  대시보드로 이동
                </Button>
              )}

              <Button
                onClick={() => handleEditClass(classInfo.id)}
                variant="outline"
                size="sm"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <Edit className="w-4 h-4" />
              </Button>

              <Button
                onClick={() => handleDeleteClick(classInfo.id)}
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50"
                disabled={classInfo.isActive}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // 로딩 중
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">학급 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 로그인 필요
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">로그인이 필요합니다</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/auth/login')}>
              로그인하기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-emerald-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">학급 관리</h1>
              <p className="text-gray-600">
                여러 학급을 관리하고 활성 학급을 전환할 수 있습니다
              </p>
            </div>
            <Button
              onClick={handleCreateClass}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white shadow-lg"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              새 학급 만들기
            </Button>
          </div>

          {/* 안내 메시지 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">💡 학급 관리 안내</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>한 번에 하나의 학급만 활성화할 수 있습니다</li>
                <li>활성 학급은 대시보드와 설문에서 사용됩니다</li>
                <li>학급을 삭제하면 해당 학급의 학생들이 연결 해제됩니다</li>
                <li>활성 학급은 삭제할 수 없습니다 (먼저 다른 학급을 활성화하세요)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* 학급 목록 */}
        {classes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                아직 학급이 없습니다
              </h3>
              <p className="text-gray-600 mb-6">
                첫 학급을 만들어 학생들을 초대해보세요!
              </p>
              <Button
                onClick={handleCreateClass}
                className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white"
              >
                <Plus className="w-5 h-5 mr-2" />
                첫 학급 만들기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map(renderClassCard)}
          </div>
        )}

        {/* 삭제 확인 다이얼로그 */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>학급을 삭제하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                이 작업은 되돌릴 수 없습니다. 학급을 삭제하면:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>학급에 속한 학생들의 연결이 해제됩니다</li>
                  <li>학급 정보가 영구적으로 삭제됩니다</li>
                  <li>설문과 응답 데이터는 유지됩니다</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingClass}>
                취소
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deletingClass}
                className="bg-red-600 hover:bg-red-700"
              >
                {deletingClass ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    삭제 중...
                  </>
                ) : (
                  '삭제'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}