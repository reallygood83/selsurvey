// 학생 회원가입 페이지 (초대 링크 전용)
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { classService, studentService } from '@/lib/firestore';
import { StudentProfile, ClassInfo } from '@/types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  CheckCircle, 
  Info, 
  UserPlus, 
  Users,
  BookOpen,
  AlertCircle,
  School,
  GraduationCap,
  Chrome
} from 'lucide-react';

export default function StudentRegisterPage() {
  const { signInWithGoogle, user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classCode, setClassCode] = useState('');
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [studentName, setStudentName] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // URL에서 classCode 파라미터 가져오기
  useEffect(() => {
    const codeFromUrl = searchParams.get('classCode');
    if (codeFromUrl) {
      setClassCode(codeFromUrl);
      // 자동으로 반 정보 확인
      verifyClassCode(codeFromUrl);
    }
  }, [searchParams]);

  const verifyClassCode = async (code: string) => {
    if (code.length !== 6) {
      setError('반 코드는 6자리여야 합니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const foundClass = await classService.getClassByCode(code);
      
      if (!foundClass) {
        setError('존재하지 않는 반 코드입니다. 다시 확인해주세요.');
        setClassInfo(null);
      } else if (!foundClass.isActive) {
        setError('비활성화된 반입니다. 선생님께 문의해주세요.');
        setClassInfo(null);
      } else {
        setClassInfo(foundClass);
        setError(null);
      }
    } catch (error) {
      console.error('반 코드 확인 오류:', error);
      setError('반 코드 확인 중 오류가 발생했습니다.');
      setClassInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsAuthenticating(true);
    
    try {
      await signInWithGoogle('student');
    } catch (error) {
      console.error('구글 로그인 오류:', error);
      setError('구글 로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleJoinClass = async () => {
    if (!user || !userProfile || !classInfo) {
      setError('로그인 정보 또는 반 정보를 확인할 수 없습니다.');
      return;
    }

    if (!studentName.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 학생 프로필 생성
      const studentProfile: Omit<StudentProfile, 'id'> = {
        userId: user.uid,
        name: studentName.trim(),
        grade: classInfo.grade,
        classCode: classInfo.classCode,
        teacherId: classInfo.teacherId,
        joinedAt: new Date(),
        isActive: true,
        responseHistory: [],
        analysisHistory: [],
        totalResponses: 0,
        participationRate: 0
      };

      // Firestore에 학생 프로필 저장
      const studentId = await studentService.createStudentProfile(studentProfile);

      // 반에 학생 추가
      await classService.addStudentToClass(classInfo.id, studentId);

      // 사용자 프로필에 학교 정보 업데이트
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        'schoolInfo.schoolName': classInfo.schoolName,
        'schoolInfo.grade': classInfo.grade,
        'schoolInfo.className': classInfo.className,
        'schoolInfo.classCode': classInfo.classCode,
        'schoolInfo.teacherId': classInfo.teacherId
      });

      // 학생 대시보드로 리다이렉트
      router.push('/student/dashboard');
      
    } catch (error) {
      console.error('반 참여 오류:', error);
      setError('반 참여에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 로딩 중
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // 이미 로그인된 학생이면서 이미 반에 참여한 경우
  if (user && userProfile?.role === 'student' && userProfile.schoolInfo?.classCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg text-center">
            <CardTitle className="text-xl font-semibold flex items-center justify-center">
              <CheckCircle className="w-6 h-6 mr-2" />
              이미 참여 중
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                이미 반에 참여하고 있습니다.
              </p>
              <Button onClick={() => router.push('/student/dashboard')}>
                대시보드로 이동
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
              <School className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-emerald-800 bg-clip-text text-transparent">
                반 참여하기
              </h1>
              <p className="text-blue-600 font-medium text-sm mt-1">학생 회원가입 및 반 참여</p>
            </div>
          </div>
        </div>

        {/* 반 정보 (확인된 경우) */}
        {classInfo && (
          <Card className="mb-6 border-0 shadow-xl bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="text-lg font-semibold flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                초대받은 반 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-600 mb-1">학교</span>
                  <span className="text-base font-semibold text-gray-900 flex items-center">
                    <School className="w-4 h-4 mr-2 text-blue-500" />
                    {classInfo.schoolName}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-600 mb-1">학년/반</span>
                  <span className="text-base font-semibold text-gray-900 flex items-center">
                    <GraduationCap className="w-4 h-4 mr-2 text-green-500" />
                    {classInfo.grade}학년 {classInfo.className}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-600 mb-1">담임선생님</span>
                  <span className="text-base font-semibold text-gray-900 flex items-center">
                    <Users className="w-4 h-4 mr-2 text-purple-500" />
                    {classInfo.teacherName}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-600 mb-1">반 코드</span>
                  <Badge variant="outline" className="font-mono text-sm px-3 py-1 bg-blue-100 text-blue-800 border-blue-200 w-fit">
                    {classInfo.classCode}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 오류 메시지 */}
        {error && (
          <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 font-medium">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* 메인 카드 */}
        <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
          <CardContent className="p-8">
            {!user ? (
              // 로그인하지 않은 경우
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <UserPlus className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">SEL 플랫폼에 오신 것을 환영합니다!</h2>
                  <p className="text-gray-600 mb-6">
                    {classInfo ? 
                      `${classInfo.schoolName} ${classInfo.grade}학년 ${classInfo.className}에 참여하려면 먼저 구글 계정으로 로그인해주세요.` :
                      '먼저 구글 계정으로 로그인 후 반에 참여해주세요.'
                    }
                  </p>
                </div>

                {/* Google 로그인 버튼 */}
                <Button
                  onClick={handleGoogleLogin}
                  disabled={isAuthenticating}
                  className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                >
                  {isAuthenticating ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      구글 계정으로 로그인 중...
                    </>
                  ) : (
                    <>
                      <Chrome className="mr-3 h-6 w-6" />
                      구글 계정으로 로그인하고 반 참여하기
                    </>
                  )}
                </Button>
              </div>
            ) : (
              // 로그인한 경우
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <UserPlus className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    환영합니다, {userProfile?.displayName}님!
                  </h2>
                  <p className="text-gray-600">
                    반에 참여하기 위해 이름을 입력해주세요.
                  </p>
                </div>

                <Separator />

                {/* 이름 입력 */}
                <div className="space-y-2">
                  <Label htmlFor="studentName" className="text-base font-medium">
                    실명 입력 *
                  </Label>
                  <Input
                    id="studentName"
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="학교에서 사용하는 실제 이름을 입력해주세요"
                    className="h-12 text-base"
                  />
                  <p className="text-sm text-gray-500">
                    선생님이 확인할 수 있도록 학교에서 사용하는 실제 이름을 입력해주세요.
                  </p>
                </div>

                {/* 반 참여 버튼 */}
                <Button
                  onClick={handleJoinClass}
                  disabled={!studentName.trim() || loading || !classInfo}
                  className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      반 참여 중...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-3 h-6 w-6" />
                      {classInfo ? `${classInfo.grade}학년 ${classInfo.className} 참여하기` : '반 참여하기'}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* 안내 메시지 */}
            <div className="mt-8 bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm">
                  <h3 className="font-semibold text-blue-800 mb-2">참여 안내</h3>
                  <ul className="text-blue-700 space-y-1">
                    <li>• 구글 계정으로 안전하게 로그인합니다</li>
                    <li>• 실명을 정확히 입력해주세요</li>
                    <li>• 개인정보는 안전하게 보호됩니다</li>
                    <li>• 언제든지 선생님께 문의할 수 있습니다</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}