'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, ArrowLeft, AlertCircle } from 'lucide-react';
import { classService } from '@/lib/firestore';
import type { Grade, ClassInfo } from '@/types';

export default function EditClassPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;

  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const [schoolName, setSchoolName] = useState('');
  const [grade, setGrade] = useState<Grade | ''>('');
  const [className, setClassName] = useState('');
  const [year, setYear] = useState('');

  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 학급 정보 불러오기
  useEffect(() => {
    const loadClassInfo = async () => {
      if (!user || !classId) return;

      try {
        setLoading(true);
        setError(null);

        const classes = await classService.getClassesByTeacher(user.uid);
        const targetClass = classes.find(c => c.id === classId);

        if (!targetClass) {
          setError('학급을 찾을 수 없습니다.');
          return;
        }

        setClassInfo(targetClass);
        setSchoolName(targetClass.schoolName);
        setGrade(targetClass.grade);
        setClassName(targetClass.className);
        setYear(targetClass.year.toString());
      } catch (err) {
        console.error('학급 정보 불러오기 오류:', err);
        setError('학급 정보를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadClassInfo();
    }
  }, [user, classId, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !classId) {
      setError('로그인이 필요합니다.');
      return;
    }

    if (!schoolName.trim() || !grade || !className.trim() || !year) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      await classService.updateClass(classId, {
        schoolName: schoolName.trim(),
        grade: grade as Grade,
        className: className.trim(),
        year: parseInt(year),
      });

      router.push('/teacher/classes/manage');
    } catch (err) {
      console.error('학급 수정 오류:', err);
      setError('학급 수정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setUpdating(false);
    }
  };

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

  if (error && !classInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-emerald-50 to-blue-50 p-6">
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-red-600">오류</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">{error}</p>
              <Button onClick={() => router.push('/teacher/classes/manage')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                학급 관리로 돌아가기
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-emerald-50 to-blue-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/teacher/classes/manage')}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            학급 관리로 돌아가기
          </Button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">학급 정보 수정</h1>
          <p className="text-gray-600">
            학급 정보를 수정하세요
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* 학급 코드 정보 */}
        {classInfo && (
          <Card className="mb-6 shadow-lg bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">학급 코드</p>
                  <p className="text-2xl font-mono font-bold text-blue-900 mt-1">
                    {classInfo.classCode}
                  </p>
                </div>
                {classInfo.isActive && (
                  <div className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                    활성 학급
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 입력 폼 */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>학급 정보</CardTitle>
            <CardDescription>
              학급 정보를 수정해주세요. 학급 코드는 변경할 수 없습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 학교명 */}
              <div className="space-y-2">
                <Label htmlFor="schoolName">학교명</Label>
                <Input
                  id="schoolName"
                  type="text"
                  placeholder="예: 안양 박달초등학교"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  disabled={updating}
                  required
                />
              </div>

              {/* 학년 */}
              <div className="space-y-2">
                <Label htmlFor="grade">학년</Label>
                <Select
                  value={grade.toString()}
                  onValueChange={(value) => setGrade(parseInt(value) as Grade)}
                  disabled={updating}
                  required
                >
                  <SelectTrigger id="grade">
                    <SelectValue placeholder="학년을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1학년</SelectItem>
                    <SelectItem value="2">2학년</SelectItem>
                    <SelectItem value="3">3학년</SelectItem>
                    <SelectItem value="4">4학년</SelectItem>
                    <SelectItem value="5">5학년</SelectItem>
                    <SelectItem value="6">6학년</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 반 이름 */}
              <div className="space-y-2">
                <Label htmlFor="className">반 이름</Label>
                <Input
                  id="className"
                  type="text"
                  placeholder="예: 3반"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  disabled={updating}
                  required
                />
              </div>

              {/* 학년도 */}
              <div className="space-y-2">
                <Label htmlFor="year">학년도</Label>
                <Input
                  id="year"
                  type="number"
                  min="2020"
                  max="2099"
                  placeholder="예: 2025"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  disabled={updating}
                  required
                />
              </div>

              {/* 안내 메시지 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">💡 수정 안내</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>학급 코드는 변경할 수 없습니다</li>
                      <li>학급에 속한 학생 정보는 유지됩니다</li>
                      <li>활성 상태는 학급 관리 페이지에서 변경할 수 있습니다</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 제출 버튼 */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/teacher/classes/manage')}
                  disabled={updating}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={updating}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      수정 중...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      변경사항 저장
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}