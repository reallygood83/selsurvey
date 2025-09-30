// 학생 반 참여 페이지 - 반 코드로 반 참여
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { classService, studentService } from '@/lib/firestore';
import { StudentProfile, ClassInfo } from '@/types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, Info, UserPlus } from 'lucide-react';

export default function StudentJoinPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classCode, setClassCode] = useState('');
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [studentName, setStudentName] = useState('');

  // 사용자 역할을 'student'로 업데이트
  const ensureStudentRole = async () => {
    if (user && userProfile && !userProfile.role && db) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          role: 'student'
        });
        console.log('✅ 사용자 역할을 student로 업데이트했습니다');
      } catch (error) {
        console.error('❌ 사용자 역할 업데이트 오류:', error);
      }
    }
  };

  // 사용자가 로드되면 role 확인 및 업데이트
  useEffect(() => {
    if (user && userProfile) {
      ensureStudentRole();
    }
  }, [user, userProfile]);

  // URL에서 class 파라미터 가져오기 (직접 참여 링크)
  useEffect(() => {
    const classFromUrl = searchParams?.get('class');
    if (classFromUrl) {
      setClassCode(classFromUrl);
      // 자동으로 반 정보 확인
      handleVerifyClassCode(classFromUrl);
    }
  }, [searchParams]);

  const handleClassCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setClassCode(value);
  };

  const handleVerifyClassCode = async (codeToVerify?: string) => {
    const codeToCheck = codeToVerify || classCode;
    
    console.log('🔍 반 코드 확인 시작:', codeToCheck);
    
    if (codeToCheck.length !== 6) {
      setError('반 코드는 6자리여야 합니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📡 classService.getClassByCode 호출 중...');
      const foundClass = await classService.getClassByCode(codeToCheck);
      console.log('🎯 반 검색 결과:', foundClass);
      
      if (!foundClass) {
        console.log('❌ 반을 찾을 수 없음');
        setError('존재하지 않는 반 코드입니다. 다시 확인해주세요.');
        setClassInfo(null);
      } else if (!foundClass.isActive) {
        console.log('🚫 비활성화된 반');
        setError('비활성화된 반입니다. 선생님께 문의해주세요.');
        setClassInfo(null);
      } else {
        console.log('✅ 반 정보 확인됨:', foundClass);
        setClassInfo(foundClass);
        setError(null);
      }
    } catch (error) {
      console.error('💥 반 코드 확인 오류:', error);
      setError('반 코드 확인 중 오류가 발생했습니다.');
      setClassInfo(null);
    } finally {
      setLoading(false);
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
      if (!db) {
        throw new Error('데이터베이스 연결이 없습니다.');
      }
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

  // 로그인하지 않은 경우 로그인 페이지로 이동
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CardTitle className="text-2xl font-bold mb-2">로그인이 필요합니다</CardTitle>
              <p className="text-muted-foreground mb-4">반에 참여하려면 먼저 로그인해주세요.</p>
              <Button 
                onClick={() => router.push('/register/student' + (classCode ? `?classCode=${classCode}` : ''))}
                className="w-full"
              >
                구글 계정으로 로그인하기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 교사 역할인 경우에만 접근 차단
  if (userProfile?.role === 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CardTitle className="text-2xl font-bold mb-2">접근 권한이 없습니다</CardTitle>
              <p className="text-muted-foreground">교사는 이 페이지에 접근할 수 없습니다.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            반 참여하기
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            선생님이 알려준 반 코드를 입력해주세요
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* 환영 메시지 */}
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <UserPlus className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-lg font-medium text-gray-900 mb-1">
                  안녕하세요, {userProfile?.displayName}님!
                </CardTitle>
                <p className="text-sm text-gray-600">
                  SEL 감정분석 플랫폼에 오신 것을 환영합니다. 먼저 반에 참여해주세요.
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

          {/* 반 코드 입력 */}
          <div className="space-y-6">
            <div>
              <Label htmlFor="classCode">
                반 코드 *
              </Label>
              <div className="mt-1 flex space-x-2">
                <Input
                  id="classCode"
                  type="text"
                  value={classCode}
                  onChange={handleClassCodeChange}
                  placeholder="ABC123"
                  maxLength={6}
                  className="flex-1 text-center text-lg font-mono tracking-widest"
                />
                <Button
                  type="button"
                  onClick={() => handleVerifyClassCode()}
                  disabled={classCode.length !== 6 || loading}
                  variant={classCode.length !== 6 || loading ? "secondary" : "default"}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      확인 중...
                    </>
                  ) : (
                    '확인'
                  )}
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                6자리 영문자와 숫자로 이루어진 코드입니다
              </p>
            </div>

            {/* 반 정보 표시 */}
            {classInfo && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <CardTitle className="text-sm font-medium text-blue-800 mb-2">
                        반 정보 확인됨
                      </CardTitle>
                      <div className="text-sm text-blue-700 space-y-1">
                        <p><strong>학교:</strong> {classInfo.schoolName}</p>
                        <p><strong>학년:</strong> {classInfo.grade}학년</p>
                        <p><strong>반:</strong> {classInfo.className}</p>
                        <p><strong>담임선생님:</strong> {classInfo.teacherName}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 이름 입력 (반 정보가 확인된 경우에만 표시) */}
            {classInfo && (
              <div>
                <label htmlFor="studentName" className="block text-sm font-medium text-gray-700">
                  이름 *
                </label>
                <div className="mt-1">
                  <Input
                    id="studentName"
                    type="text"
                    value={studentName}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setStudentName(newName);
                      console.log('👤 이름 입력 상세 정보:', {
                        inputValue: newName,
                        trimmedLength: newName.trim().length,
                        classInfo: classInfo ? 'O' : 'X',
                        loading: loading ? 'O' : 'X',
                        buttonDisabled: !newName.trim() || loading,
                        user: user ? 'O' : 'X',
                        userProfile: userProfile ? 'O' : 'X',
                        userRole: userProfile?.role || 'undefined'
                      });
                    }}
                    placeholder="실명을 입력해주세요"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  선생님이 확인할 수 있도록 실제 이름을 입력해주세요
                </p>
              </div>
            )}

            {/* 반 참여 버튼 */}
            {classInfo && (
              <div>
                <Button
                  type="button"
                  onClick={handleJoinClass}
                  disabled={!studentName.trim() || loading}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      반 참여 중...
                    </>
                  ) : (
                    '반 참여하기'
                  )}
                </Button>
                
                {/* 디버깅용 정보 - 확장 */}
                <div className="mt-2 text-xs text-gray-500 space-y-1">
                  <div>
                    <strong>버튼 상태:</strong> {(!studentName.trim() || loading) ? '비활성화' : '활성화'}
                  </div>
                  <div>
                    <strong>classInfo:</strong> {classInfo ? '✓ 확인됨' : '✗ 없음'} 
                    {classInfo && ` (${classInfo.className})`}
                  </div>
                  <div>
                    <strong>studentName:</strong> '{studentName}' ({studentName.trim().length}글자)
                  </div>
                  <div>
                    <strong>loading:</strong> {loading ? '✓' : '✗'}
                  </div>
                  <div>
                    <strong>user:</strong> {user ? '✓ 로그인됨' : '✗ 로그인안됨'}
                  </div>
                  <div>
                    <strong>userProfile:</strong> {userProfile ? '✓ 있음' : '✗ 없음'} 
                    {userProfile && ` (role: ${userProfile.role})`}
                  </div>
                </div>
              </div>
            )}

            {/* 안내 메시지 */}
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="pt-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-gray-400" />
                  </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-800">
                    반 코드를 모르시나요?
                  </h3>
                  <div className="mt-2 text-sm text-gray-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>담임선생님께 반 코드를 문의해주세요</li>
                      <li>반 코드는 영문자와 숫자 6자리입니다</li>
                      <li>대소문자는 구분하지 않습니다</li>
                    </ul>
                  </div>
                </div>
              </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}