// 교사 온보딩 페이지 - 학교 정보 설정
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { classService } from '@/lib/firestore';
import { ClassInfo, Grade } from '@/types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, BookOpen, Info, CheckCircle } from 'lucide-react';

export default function TeacherOnboardingPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    schoolName: '',
    grade: '' as Grade | '',
    className: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGradeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      grade: parseInt(value) as Grade
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !userProfile) {
      setError('로그인 정보를 확인할 수 없습니다.');
      return;
    }

    if (!formData.schoolName.trim() || !formData.grade || !formData.className.trim()) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 반 코드 생성
      const classCode = classService.generateClassCode();
      
      // 반 정보 생성
      const classInfo: Omit<ClassInfo, 'id'> = {
        classCode,
        teacherId: user.uid,
        teacherName: userProfile.displayName || '교사',
        schoolName: formData.schoolName.trim(),
        grade: formData.grade,
        className: formData.className.trim(),
        studentCount: 0,
        students: [],
        createdAt: new Date(),
        isActive: true
      };

      // Firestore에 반 정보 저장
      const classId = await classService.createClass(classInfo);

      // 사용자 프로필에 학교 정보 업데이트
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        'schoolInfo.schoolName': formData.schoolName.trim(),
        'schoolInfo.grade': formData.grade,
        'schoolInfo.className': formData.className.trim(),
        'schoolInfo.classCode': classCode,
        'schoolInfo.teacherId': user.uid
      });

      // 교사 대시보드로 리다이렉트
      router.push('/teacher/dashboard');
      
    } catch (error) {
      console.error('온보딩 완료 오류:', error);
      setError('설정 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 로그인 중이거나 사용자 정보가 없으면 로딩 표시
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 온보딩 페이지는 최초 로그인 시 학급 생성을 위한 페이지이므로
  // role 체크를 하지 않습니다. Google 로그인만 되어 있으면 접근 가능합니다.

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            학급 정보 설정
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            학급 관리를 위한 기본 정보를 입력해주세요
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardContent className="py-8 px-4 sm:px-10">
          {/* 환영 메시지 */}
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg font-medium text-gray-900 mb-1">
                  환영합니다, {userProfile.displayName}님!
                </CardTitle>
                <p className="text-sm text-gray-600">
                  SEL 감정분석 플랫폼에 오신 것을 환영합니다. 학급 설정 후 바로 시작할 수 있습니다.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 에러 메시지 */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 학교명 */}
            <div className="space-y-2">
              <Label htmlFor="schoolName">학교명 *</Label>
              <Input
                id="schoolName"
                name="schoolName"
                type="text"
                required
                value={formData.schoolName}
                onChange={handleInputChange}
                placeholder="예: 서울초등학교"
              />
            </div>

            {/* 학년 */}
            <div className="space-y-2">
              <Label htmlFor="grade">담당 학년 *</Label>
              <Select value={formData.grade.toString()} onValueChange={handleGradeChange}>
                <SelectTrigger>
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
              <Label htmlFor="className">반 이름 *</Label>
              <Input
                id="className"
                name="className"
                type="text"
                required
                value={formData.className}
                onChange={handleInputChange}
                placeholder="예: 1반, 사랑반, 희망반"
              />
            </div>

            {/* 안내 메시지 */}
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="pt-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-800">
                      설정 완료 후 제공되는 기능
                    </h3>
                    <div className="mt-2 text-sm text-gray-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>고유한 반 코드 자동 생성</li>
                        <li>학생들의 반 참여를 위한 초대 시스템</li>
                        <li>SEL 기반 감정 설문 관리</li>
                        <li>학생별 상담 데이터 분석 대시보드</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 제출 버튼 */}
            <div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    설정 저장 중...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    학급 설정 완료
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