'use client';

import { useEffect, useState } from 'react';
import { testFirebaseConnection, getFirebaseConfig, isFirebaseAvailable } from '@/lib/firebase';

export default function TestConnectionPage() {
  const [status, setStatus] = useState('Loading...');
  const [details, setDetails] = useState<any>({});

  useEffect(() => {
    const runConnectionTest = async () => {
      try {
        setStatus('Testing connection...');
        
        // 기본 네트워크 상태 확인
        const networkStatus = {
          online: navigator.onLine,
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
          timestamp: new Date().toISOString(),
        };

        // Firebase 설정 확인
        const firebaseConfig = getFirebaseConfig();
        const configStatus = {
          hasApiKey: !!firebaseConfig.apiKey,
          hasAuthDomain: !!firebaseConfig.authDomain,
          hasProjectId: !!firebaseConfig.projectId,
          hasStorageBucket: !!firebaseConfig.storageBucket,
          hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
          hasAppId: !!firebaseConfig.appId,
          projectId: firebaseConfig.projectId || 'NOT_SET',
        };

        // Firebase 연결 테스트
        const firebaseTest = await testFirebaseConnection();

        // Firestore 도메인 접근성 테스트
        const firestoreTest = await fetch('https://firestore.googleapis.com/v1/projects/test/databases/(default)/documents', {
          method: 'GET',
          mode: 'no-cors'
        }).then(() => true).catch(() => false);

        setDetails({
          network: networkStatus,
          firebaseConfig: configStatus,
          firebaseConnection: firebaseTest,
          firestoreAccessible: firestoreTest,
          sdkAvailable: isFirebaseAvailable(),
          pageLoadTime: performance.now(),
        });

        setStatus('Connection test completed');
      } catch (error) {
        setStatus('Connection test failed');
        setDetails({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    };

    runConnectionTest();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Firebase Connection Test</h1>
      <p><strong>Status:</strong> {status}</p>
      <pre>{JSON.stringify(details, null, 2)}</pre>
    </div>
  );
}