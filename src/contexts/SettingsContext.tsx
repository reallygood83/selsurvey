'use client';

// 설정 컨텍스트 - Gemini API 키 및 기타 사용자 설정 관리
import React, { createContext, useContext, useEffect, useState } from 'react';

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
  const [geminiApiKey, setGeminiApiKeyState] = useState<string | null>(null);
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [language, setLanguageState] = useState<'ko' | 'en'>('ko');
  const [mounted, setMounted] = useState(false);

  // 컴포넌트 마운트 시 localStorage에서 설정 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedApiKey = localStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY);
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark';
      const savedLanguage = localStorage.getItem(STORAGE_KEYS.LANGUAGE) as 'ko' | 'en';

      if (savedApiKey) {
        setGeminiApiKeyState(savedApiKey);
      }
      if (savedTheme) {
        setThemeState(savedTheme);
      }
      if (savedLanguage) {
        setLanguageState(savedLanguage);
      }
      
      setMounted(true);
    }
  }, []);

  // Gemini API 키 설정
  const setGeminiApiKey = (key: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, key);
      setGeminiApiKeyState(key);
    }
  };

  // Gemini API 키 삭제
  const removeGeminiApiKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.GEMINI_API_KEY);
      setGeminiApiKeyState(null);
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

  // 마운트 전에는 로딩 상태로 처리
  if (!mounted) {
    return (
      <SettingsContext.Provider value={value}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
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