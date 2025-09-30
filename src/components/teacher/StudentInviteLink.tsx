// 학생 초대 링크 컴포넌트
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Copy, 
  Share2, 
  UserPlus, 
  QrCode,
  ExternalLink,
  CheckCircle,
  Mail,
  MessageSquare,
  Smartphone,
  Users,
  Link as LinkIcon,
  Info
} from 'lucide-react';

interface StudentInviteLinkProps {
  classCode: string;
  schoolName: string;
  className: string;
  grade: string;
}

export function StudentInviteLink({ classCode, schoolName, className, grade }: StudentInviteLinkProps) {
  const { userProfile } = useAuth();
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [shareSuccess, setShareSuccess] = useState(false);

  // 학생 회원가입 링크 생성
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL || 'https://selsurvey.vercel.app';
  const inviteUrl = `${baseUrl}/register/student?classCode=${classCode}`;
  const directJoinUrl = `${baseUrl}/join?class=${classCode}`;

  // 클립보드 복사 함수
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [type]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [type]: false }));
      }, 2000);
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
      // 폴백: 텍스트 선택
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      
      setCopiedStates(prev => ({ ...prev, [type]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [type]: false }));
      }, 2000);
    }
  };

  // 네이티브 공유 API 사용
  const shareInviteLink = async () => {
    const shareData = {
      title: `${schoolName} ${grade} ${className} 초대`,
      text: `SEL 감정 설문에 참여해주세요!\n\n학급: ${schoolName} ${grade} ${className}\n교사: ${userProfile?.displayName || '선생님'}\n\n아래 링크를 클릭하여 참여하세요:`,
      url: inviteUrl
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } else {
        // 폴백: 클립보드 복사
        await copyToClipboard(inviteUrl, 'share');
      }
    } catch (error) {
      console.error('공유 실패:', error);
      // 폴백: 클립보드 복사
      await copyToClipboard(inviteUrl, 'share');
    }
  };

  // 이메일 공유 텍스트 생성
  const emailSubject = encodeURIComponent(`${schoolName} ${grade} ${className} SEL 설문 초대`);
  const emailBody = encodeURIComponent(`안녕하세요!

SEL 감정 설문에 참여해주세요.

🏫 학급 정보:
• 학교: ${schoolName}
• 학년/반: ${grade} ${className}
• 교사: ${userProfile?.displayName || '선생님'}
• 반 코드: ${classCode}

📱 참여 방법:
아래 링크를 클릭하여 회원가입 후 참여하세요.
${inviteUrl}

또는 앱에서 직접 반 코드를 입력하세요: ${classCode}

감사합니다!`);

  // SMS/카카오톡 공유 텍스트
  const smsText = encodeURIComponent(`${schoolName} ${grade} ${className} SEL 설문 초대

반 코드: ${classCode}
링크: ${inviteUrl}

교사: ${userProfile?.displayName || '선생님'}`);

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="text-lg font-semibold flex items-center">
          <UserPlus className="w-5 h-5 mr-2" />
          학생 초대 링크
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* 성공 알림 */}
        {shareSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              초대 링크가 성공적으로 공유되었습니다!
            </AlertDescription>
          </Alert>
        )}

        {/* 학급 정보 요약 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center">
              <Users className="w-4 h-4 mr-2 text-blue-500" />
              학급 정보
            </h3>
            <Badge variant="secondary" className="font-mono text-xs px-2 py-1 bg-blue-100 text-blue-800 border-blue-200">
              {classCode}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">학교:</span>
              <span className="ml-2 font-medium text-gray-900">{schoolName}</span>
            </div>
            <div>
              <span className="text-gray-600">학년/반:</span>
              <span className="ml-2 font-medium text-gray-900">{grade} {className}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">담임:</span>
              <span className="ml-2 font-medium text-gray-900">{userProfile?.displayName || '선생님'}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* 빠른 공유 버튼들 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center">
            <Share2 className="w-4 h-4 mr-2 text-green-500" />
            빠른 공유
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {/* 네이티브 공유 */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={shareInviteLink}
              className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-blue-50 transition-colors group"
            >
              <Share2 className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">공유하기</span>
            </Button>

            {/* 링크 복사 */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => copyToClipboard(inviteUrl, 'url')}
              className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-green-50 transition-colors group"
            >
              {copiedStates.url ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform" />
              )}
              <span className="text-xs font-medium">
                {copiedStates.url ? '복사됨!' : '링크 복사'}
              </span>
            </Button>

            {/* 이메일 */}
            <Button 
              variant="outline" 
              size="sm"
              asChild
              className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-red-50 transition-colors group"
            >
              <a href={`mailto:?subject=${emailSubject}&body=${emailBody}`}>
                <Mail className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">이메일</span>
              </a>
            </Button>

            {/* SMS */}
            <Button 
              variant="outline" 
              size="sm"
              asChild
              className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-yellow-50 transition-colors group"
            >
              <a href={`sms:?body=${smsText}`}>
                <MessageSquare className="w-5 h-5 text-yellow-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">문자</span>
              </a>
            </Button>
          </div>
        </div>

        <Separator />

        {/* 초대 링크 정보 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center">
            <LinkIcon className="w-4 h-4 mr-2 text-purple-500" />
            초대 링크
          </h3>
          
          {/* 회원가입 링크 */}
          <div className="space-y-3">
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-blue-600 flex items-center">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  회원가입 링크
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(inviteUrl, 'register')}
                  className="h-6 px-2 text-blue-600 hover:bg-blue-50"
                >
                  {copiedStates.register ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-700 font-mono bg-gray-50 p-2 rounded border break-all">
                {inviteUrl}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                신규 학생이 회원가입과 동시에 반에 자동 가입됩니다.
              </p>
            </div>

            {/* 반 코드 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-purple-600">반 코드 (수동 입력)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(classCode, 'code')}
                  className="h-6 px-2 text-purple-600 hover:bg-purple-50"
                >
                  {copiedStates.code ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
              <div className="flex items-center justify-center">
                <Badge variant="outline" className="font-mono text-lg px-4 py-2 bg-purple-50 text-purple-800 border-purple-200">
                  {classCode}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                앱에서 '반 코드 입력'으로 직접 가입할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 사용 안내 */}
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-xs">
            <strong>사용 팁:</strong> 초대 링크를 클릭하면 학생들이 자동으로 반에 가입됩니다. 
            반 코드는 앱 내에서 직접 입력하는 방법입니다. 
            두 방법 모두 안전하게 사용할 수 있습니다.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}