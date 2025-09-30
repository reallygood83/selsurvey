'use client';

import { useEffect, useState } from 'react';

export default function DebugEnvPage() {
  const [envVars, setEnvVars] = useState<Record<string, string>>({});

  useEffect(() => {
    // 클라이언트 사이드에서 환경 변수 확인
    const vars = {
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'undefined',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'undefined',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'undefined',
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'undefined',
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'undefined',
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'undefined',
      NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'undefined',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'undefined',
    };
    
    setEnvVars(vars);
    console.log('Environment variables:', vars);
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">환경 변수 디버깅</h1>
      
      <div className="space-y-4">
        {Object.entries(envVars).map(([key, value]) => (
          <div key={key} className="border p-4 rounded">
            <div className="font-mono text-sm">
              <strong>{key}:</strong>
            </div>
            <div className="mt-2 p-2 bg-gray-100 rounded font-mono text-xs break-all">
              {value === 'undefined' ? (
                <span className="text-red-600">❌ UNDEFINED</span>
              ) : (
                <span className="text-green-600">✅ {value.substring(0, 20)}...</span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h2 className="font-bold mb-2">디버깅 정보:</h2>
        <ul className="text-sm space-y-1">
          <li>• 브라우저 콘솔에서 전체 환경 변수 확인 가능</li>
          <li>• NEXT_PUBLIC_ 접두사가 있는 변수만 클라이언트에서 접근 가능</li>
          <li>• 서버 재시작 후에도 문제가 지속되면 .env.local 파일 확인 필요</li>
        </ul>
      </div>
    </div>
  );
}