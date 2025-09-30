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
  ArrowRight
} from 'lucide-react';
import { classService } from '@/lib/firestore';

interface ClassInfo {
  id: string;
  className: string;
  grade: string;
  year: number;
  studentCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function ClassesManagePage() {
  const router = useRouter();
  const { user, userProfile, authLoading } = useAuth();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !userProfile || userProfile.role !== 'teacher') {
      router.push('/auth/login');
      return;
    }
    loadClasses();
  }, [user, userProfile, authLoading]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      // TODO: Firebase에서 교사의 모든 학급 정보 가져오기
      // 임시 데이터
      const mockClasses: ClassInfo[] = [
        {
          id: '1',
          className: '5학년 1반',
          grade: '5학년',
          year: 2025,
          studentCount: 24,
          isActive: true,
          createdAt: '2025-03-01'
        },
        {
          id: '2',
          className: '4학년 2반',
          grade: '4학년',
          year: 2024,
          studentCount: 22,
          isActive: false,
          createdAt: '2024-03-01'
        }
      ];
      setClasses(mockClasses);

      // 활성 학급 찾기
      const active = mockClasses.find(c => c.isActive);
      if (active) setActiveClassId(active.id);
    } catch (error) {
      console.error('학급 정보 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = () => {
    router.push('/teacher/classes/create');
  };

  const handleSwitchClass = async (classId: string) => {
    try {
      // TODO: 활성 학급 전환 로직
      setActiveClassId(classId);
      // 대시보드로 리다이렉트
      router.push('/teacher/dashboard');
    } catch (error) {
      console.error('학급 전환 오류:', error);
    }
  };

  const handleEditClass = (classId: string) => {
    router.push(`/teacher/classes/edit/${classId}`);
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('정말 이 학급을 삭제하시겠습니까?\n학급의 모든 데이터가 삭제됩니다.')) {
      return;
    }
    try {
      // TODO: 학급 삭제 로직
      await loadClasses();
    } catch (error) {
      console.error('학급 삭제 오류:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">학급 관리</h1>
            <p className="text-gray-600">
              여러 학급을 관리하고, 연도별로 학급을 구성하세요
            </p>
          </div>
          <Button
            onClick={handleCreateClass}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            새 학급 만들기
          </Button>
        </div>
      </div>

      {/* 활성 학급 안내 */}
      {activeClassId && (
        <Card className="mb-6 border-l-4 border-l-green-500 bg-green-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-800">
                <span className="font-semibold">
                  {classes.find(c => c.id === activeClassId)?.className}
                </span>
                이(가) 현재 활성 학급입니다
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 학급 목록 */}
      {classes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              아직 생성된 학급이 없습니다
            </h3>
            <p className="text-gray-600 mb-6">
              새 학급을 만들어 학생들을 관리해보세요
            </p>
            <Button
              onClick={handleCreateClass}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              첫 학급 만들기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classInfo) => (
            <Card
              key={classInfo.id}
              className={`hover:shadow-lg transition-shadow ${
                classInfo.id === activeClassId ? 'ring-2 ring-green-500' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-xl">{classInfo.className}</CardTitle>
                  {classInfo.id === activeClassId && (
                    <Badge className="bg-green-500">활성</Badge>
                  )}
                </div>
                <CardDescription>
                  {classInfo.year}학년도
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <GraduationCap className="w-4 h-4" />
                    <span>{classInfo.grade}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>학생 {classInfo.studentCount}명</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>생성일: {classInfo.createdAt}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {classInfo.id !== activeClassId && (
                    <Button
                      onClick={() => handleSwitchClass(classInfo.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <ArrowRight className="w-4 h-4 mr-1" />
                      전환
                    </Button>
                  )}
                  <Button
                    onClick={() => handleEditClass(classInfo.id)}
                    variant="outline"
                    size="sm"
                    className={classInfo.id === activeClassId ? 'flex-1' : ''}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteClass(classInfo.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 안내 메시지 */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardContent className="py-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 학급 관리 안내</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• 여러 학급을 생성하고 관리할 수 있습니다</li>
            <li>• 연도가 바뀌면 새로운 학급을 만들어 학생들을 관리하세요</li>
            <li>• 한 번에 하나의 학급만 활성화할 수 있습니다</li>
            <li>• 활성 학급의 데이터만 대시보드에 표시됩니다</li>
            <li>• 비활성 학급의 데이터는 언제든지 다시 확인할 수 있습니다</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}