'use client';

// 설정 컨텍스트 - Gemini API 키 및 기타 사용자 설정 관리
import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { encryptApiKey, decryptApiKey } from '@/lib/crypto';
import { useAuth } from './AuthContext';

interface SettingsContextType {
  // Gemini API 설정
  geminiApiKey: string | null;
  setGeminiApiKey: (key: string) => void;
  removeGeminiApiKey: () => void;
  isGeminiConfigured: boolean;
  
  // 기타 설정들
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  language: 'ko' | 'en';
  setLanguage: (language: 'ko' | 'en') => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// 커스텀 훅
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// LocalStorage 키 상수
const STORAGE_KEYS = {
  GEMINI_API_KEY: 'sel_gemini_api_key',
  THEME: 'sel_theme',
  LANGUAGE: 'sel_language'
};

// SettingsProvider 컴포넌트
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth(); // 🆕 Firebase 사용자 정보 가져오기
  const [geminiApiKey, setGeminiApiKeyState] = useState<string | null>(null);
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [language, setLanguageState] = useState<'ko' | 'en'>('ko');
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 🔐 Firestore에서 암호화된 API 키 로드 및 복호화
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user) {
        setIsLoading(false);
        setMounted(true);
        return;
      }

      try {
        console.log('🔐 사용자 설정 로딩 시작:', user.uid);

        // Firestore에서 사용자 데이터 가져오기
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('📊 Firestore 데이터:', userData);

          // 암호화된 API 키가 있으면 복호화
          if (userData.encryptedGeminiApiKey) {
            try {
              const decryptedKey = await decryptApiKey(
                userData.encryptedGeminiApiKey,
                user.uid
              );
              setGeminiApiKeyState(decryptedKey);
              console.log('✅ API 키 복호화 성공');
            } catch (error) {
              console.error('❌ API 키 복호화 실패:', error);
              setGeminiApiKeyState(null);
            }
          } else {
            // 🔄 마이그레이션: LocalStorage에서 Firestore로 이동
            const localStorageKey = localStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY);
            if (localStorageKey) {
              console.log('🔄 LocalStorage에서 Firestore로 마이그레이션 시작...');
              await migrateApiKeyToFirestore(localStorageKey, user.uid);
            }
          }

          // 기타 설정 로드 (테마, 언어는 LocalStorage 유지)
          const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark';
          const savedLanguage = localStorage.getItem(STORAGE_KEYS.LANGUAGE) as 'ko' | 'en';
          if (savedTheme) setThemeState(savedTheme);
          if (savedLanguage) setLanguageState(savedLanguage);
        }
      } catch (error) {
        console.error('❌ 설정 로드 실패:', error);
      } finally {
        setIsLoading(false);
        setMounted(true);
      }
    };

    loadUserSettings();
  }, [user]);

  // 🔐 Gemini API 키 설정 (Firestore 암호화 저장)
  const setGeminiApiKey = async (key: string) => {
    if (!user) {
      console.error('❌ 로그인이 필요합니다');
      return;
    }

    try {
      console.log('🔐 API 키 암호화 및 저장 시작...');

      // 1. API 키 암호화
      const encryptedKey = await encryptApiKey(key, user.uid);
      console.log('✅ API 키 암호화 완료');

      // 2. Firestore에 암호화된 키 저장
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        encryptedGeminiApiKey: encryptedKey,
        updatedAt: new Date()
      });
      console.log('✅ Firestore에 저장 완료');

      // 3. 상태 업데이트
      setGeminiApiKeyState(key);

      // 4. LocalStorage에서 제거 (더 이상 필요 없음)
      localStorage.removeItem(STORAGE_KEYS.GEMINI_API_KEY);
      console.log('🗑️ LocalStorage 키 제거 완료');

    } catch (error) {
      console.error('❌ API 키 저장 실패:', error);
      throw error;
    }
  };

  // 🔐 Gemini API 키 삭제 (Firestore에서 제거)
  const removeGeminiApiKey = async () => {
    if (!user) {
      console.error('❌ 로그인이 필요합니다');
      return;
    }

    try {
      console.log('🗑️ API 키 삭제 시작...');

      // 1. Firestore에서 제거
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        encryptedGeminiApiKey: null,
        updatedAt: new Date()
      });
      console.log('✅ Firestore에서 삭제 완료');

      // 2. 상태 업데이트
      setGeminiApiKeyState(null);

      // 3. LocalStorage에서도 제거 (혹시 남아있을 수 있음)
      localStorage.removeItem(STORAGE_KEYS.GEMINI_API_KEY);

    } catch (error) {
      console.error('❌ API 키 삭제 실패:', error);
      throw error;
    }
  };

  // 🔄 LocalStorage에서 Firestore로 마이그레이션 함수
  const migrateApiKeyToFirestore = async (apiKey: string, userId: string) => {
    try {
      console.log('🔄 API 키 마이그레이션 시작...');

      // 1. API 키 암호화
      const encryptedKey = await encryptApiKey(apiKey, userId);

      // 2. Firestore에 저장
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        encryptedGeminiApiKey: encryptedKey,
        updatedAt: new Date()
      });

      // 3. 상태 업데이트
      setGeminiApiKeyState(apiKey);

      // 4. LocalStorage에서 제거
      localStorage.removeItem(STORAGE_KEYS.GEMINI_API_KEY);

      console.log('✅ 마이그레이션 완료!');
    } catch (error) {
      console.error('❌ 마이그레이션 실패:', error);
      // 실패 시 LocalStorage 키는 유지 (다음 로그인 시 재시도)
    }
  };

  // 테마 설정
  const setTheme = (newTheme: 'light' | 'dark') => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
      setThemeState(newTheme);
    }
  };

  // 언어 설정
  const setLanguage = (newLanguage: 'ko' | 'en') => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, newLanguage);
      setLanguageState(newLanguage);
    }
  };

  // Gemini API 키 설정 여부 확인
  const isGeminiConfigured = !!geminiApiKey;

  const value: SettingsContextType = {
    geminiApiKey,
    setGeminiApiKey,
    removeGeminiApiKey,
    isGeminiConfigured,
    theme,
    setTheme,
    language,
    setLanguage
  };

  // 🔄 로딩 중이거나 마운트 전에는 로딩 상태로 처리
  if (!mounted || isLoading) {
    return (
      <SettingsContext.Provider value={value}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            <p className="text-gray-600">설정을 불러오는 중...</p>
          </div>
        </div>
      </SettingsContext.Provider>
    );
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}