'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentInviteLink } from '@/components/teacher/StudentInviteLink';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Share2, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { classService } from '@/lib/firestore';

export default function InvitePage() {
  const router = useRouter();
  const { user, userProfile, authLoading } = useAuth();
  const [classInfo, setClassInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user || !userProfile || userProfile.role !== 'teacher') {
      router.push('/auth/login');
      return;
    }

    loadClassInfo();
  }, [user, userProfile, authLoading]);

  const loadClassInfo = async () => {
    try {
      if (!userProfile?.schoolInfo?.classCode) return;

      const data = await classService.getClassByCode(userProfile.schoolInfo.classCode);
      setClassInfo(data);
    } catch (error) {
      console.error('반 정보 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 헤더 */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="hover:bg-gray-50"
              >
                <Link href="/teacher/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  대시보드로
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-7 h-7 text-blue-600" />
                  학생 초대하기
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  학생들에게 반 참여 링크를 공유하세요
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 안내 카드 */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
              <Share2 className="w-5 h-5" />
              학생 초대 방법
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-blue-800">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  1
                </div>
                <p>아래 <strong>반 코드</strong> 또는 <strong>초대 링크</strong>를 복사하세요</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  2
                </div>
                <p>학생들에게 카카오톡, 문자, 이메일 등으로 공유하세요</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  3
                </div>
                <p>학생들이 링크를 클릭하거나 반 코드를 입력하면 자동으로 반에 참여됩니다</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 학생 초대 링크 컴포넌트 */}
        {classInfo && (
          <StudentInviteLink
            classCode={classInfo.classCode}
            schoolName={classInfo.schoolName}
            className={classInfo.className}
            grade={classInfo.grade}
          />
        )}

        {/* 추가 도움말 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-gray-600" />
              자주 묻는 질문
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Q. 학생이 링크를 열 수 없다고 해요</h3>
                <p className="text-sm text-gray-600">
                  반 코드를 직접 입력하는 방법을 안내해주세요. 학생 참여 페이지에서 반 코드 6자리를 입력하면 됩니다.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Q. 링크를 잘못 공유했어요</h3>
                <p className="text-sm text-gray-600">
                  반 코드는 변경할 수 없지만, 설정에서 반 정보를 수정하거나 새로운 반을 만들 수 있습니다.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Q. 몇 명까지 참여 가능한가요?</h3>
                <p className="text-sm text-gray-600">
                  제한 없이 학생들을 초대할 수 있습니다. 학급 단위로 관리하기 좋은 시스템입니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 하단 액션 버튼 */}
        <div className="mt-8 flex justify-center gap-3">
          <Button
            variant="outline"
            asChild
            className="hover:bg-gray-50"
          >
            <Link href="/teacher/dashboard">
              대시보드로 돌아가기
            </Link>
          </Button>
          <Button
            asChild
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Link href="/teacher/students/manage">
              <Users className="w-4 h-4 mr-2" />
              학생 관리
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}