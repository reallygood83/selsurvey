'use client';

import { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Key, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

export function GeminiApiKeySettings() {
  const { geminiApiKey, setGeminiApiKey, removeGeminiApiKey, isGeminiConfigured } = useSettings();
  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // API 키 유효성 검사
  const validateApiKey = (key: string): boolean => {
    return key.startsWith('AIza') && key.length >= 20;
  };

  // 🔐 API 키 저장 (Firestore 암호화 저장)
  const handleSave = async () => {
    if (!inputKey.trim()) {
      setMessage({ type: 'error', text: 'API 키를 입력해주세요.' });
      return;
    }

    if (!validateApiKey(inputKey)) {
      setMessage({ type: 'error', text: '유효하지 않은 Gemini API 키 형식입니다.' });
      return;
    }

    try {
      setMessage({ type: 'success', text: '암호화 및 저장 중...' });
      await setGeminiApiKey(inputKey); // 🆕 async 호출
      setIsEditing(false);
      setInputKey('');
      setMessage({ type: 'success', text: '✅ Gemini API 키가 안전하게 저장되었습니다! (Firestore 암호화 저장)' });

      // 5초 후 메시지 제거
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('API 키 저장 오류:', error);
      setMessage({ type: 'error', text: '❌ API 키 저장 중 오류가 발생했습니다. 다시 시도해주세요.' });
    }
  };

  // 🔐 API 키 삭제 (Firestore에서 제거)
  const handleRemove = async () => {
    if (typeof window !== 'undefined' && window.confirm('정말로 Gemini API 키를 삭제하시겠습니까?\nSEL 분석 기능을 사용할 수 없게 됩니다.')) {
      try {
        setMessage({ type: 'success', text: '삭제 중...' });
        await removeGeminiApiKey(); // 🆕 async 호출
        setMessage({ type: 'success', text: '✅ Gemini API 키가 안전하게 삭제되었습니다.' });
        setTimeout(() => setMessage(null), 5000);
      } catch (error) {
        console.error('API 키 삭제 오류:', error);
        setMessage({ type: 'error', text: '❌ API 키 삭제 중 오류가 발생했습니다.' });
      }
    }
  };

  // 편집 취소
  const handleCancel = () => {
    setIsEditing(false);
    setInputKey('');
    setMessage(null);
  };

  // 키 마스킹 함수
  const maskApiKey = (key: string) => {
    if (key.length < 8) return key;
    return key.substring(0, 8) + '*'.repeat(key.length - 12) + key.substring(key.length - 4);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Gemini API 키 설정
        </CardTitle>
        <CardDescription>
          SEL 분석 기능을 사용하기 위해 개인 Gemini API 키를 설정하세요.
          🔐 API 키는 AES-256 암호화되어 Firebase에 안전하게 저장되며, 모든 기기에서 동일하게 사용할 수 있습니다.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 상태 메시지 */}
        {message && (
          <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* 현재 상태 표시 */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
          <Shield className={`h-4 w-4 ${isGeminiConfigured ? 'text-green-600' : 'text-gray-400'}`} />
          <span className="text-sm font-medium">
            상태: {isGeminiConfigured ? (
              <span className="text-green-600">설정 완료</span>
            ) : (
              <span className="text-gray-500">미설정</span>
            )}
          </span>
        </div>

        {/* API 키 표시/입력 영역 */}
        {!isEditing && isGeminiConfigured ? (
          // 기존 키 표시
          <div className="space-y-3">
            <Label>현재 설정된 API 키</Label>
            <div className="flex items-center gap-2">
              <Input
                type={showKey ? 'text' : 'password'}
                value={showKey ? geminiApiKey! : maskApiKey(geminiApiKey!)}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => setIsEditing(true)} variant="outline">
                수정
              </Button>
              <Button onClick={handleRemove} variant="destructive">
                삭제
              </Button>
            </div>
          </div>
        ) : (
          // 새 키 입력 또는 편집
          <div className="space-y-3">
            <Label htmlFor="api-key">
              {isGeminiConfigured && isEditing ? '새 API 키' : 'Gemini API 키'}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIza..."
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!inputKey.trim()}>
                저장
              </Button>
              {isEditing && (
                <Button onClick={handleCancel} variant="outline">
                  취소
                </Button>
              )}
            </div>
          </div>
        )}

        {/* 도움말 정보 */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Gemini API 키 발급 방법:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Google AI Studio (aistudio.google.com)에 접속</li>
                <li>Google 계정으로 로그인</li>
                <li>좌측 메뉴에서 &ldquo;API keys&rdquo; 클릭</li>
                <li>&ldquo;Create API key&rdquo; 버튼 클릭</li>
                <li>생성된 API 키를 복사하여 입력</li>
              </ol>
              <p className="text-xs text-gray-600 mt-2">
                💡 API 키는 안전하게 관리하세요. 타인과 공유하지 마세요.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* 기능 설명 */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">SEL 분석 기능</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 학생 설문 응답 자동 분석</li>
            <li>• SEL 5개 영역별 발달 수준 평가</li>
            <li>• 개별 맞춤 피드백 생성</li>
            <li>• 교사용/학부모용 리포트 작성</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}