// SEL 감정분석 플랫폼 메인 페이지
'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('🏠 메인 페이지 - 상태:', { 
      loading, 
      user: user?.email, 
      userProfile: userProfile?.role 
    });
    
    if (!loading && user && userProfile) {
      console.log('🚀 리다이렉트 실행 - 역할:', userProfile.role);
      // 사용자가 이미 로그인되어 있고 프로필이 있으면 적절한 대시보드로 리다이렉트
      if (userProfile.role === 'teacher') {
        console.log('👨‍🏫 교사 대시보드로 이동');
        router.push('/teacher/dashboard');
      } else if (userProfile.role === 'student') {
        console.log('👨‍🎓 학생 대시보드로 이동');
        router.push('/student/dashboard');
      } else {
        console.log('⚠️ 알 수 없는 역할:', userProfile.role);
        // 역할이 명확하지 않으면 로그인 페이지로 이동
        router.push('/auth/login');
      }
    }
  }, [user, userProfile, loading]); // router 제거

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">💚</span>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  SEL 감정분석 플랫폼
                </h1>
              </div>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/auth/login"
                className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                로그인
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex justify-center items-center gap-4 mb-8">
            <span className="text-6xl">🌱</span>
            <span className="text-6xl">💛</span>
            <span className="text-6xl">🌈</span>
          </div>
          <h2 className="text-5xl font-bold text-gray-800 sm:text-6xl leading-tight">
            마음을 키우는
          </h2>
          <h3 className="mt-3 text-5xl font-bold bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 bg-clip-text text-transparent sm:text-6xl leading-tight">
            SEL 감정분석 플랫폼
          </h3>
          <p className="mt-8 text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            <span className="text-emerald-600 font-semibold">사회정서학습(SEL)</span>을 통해 학생들의 건강한 감정 발달을 지원합니다.<br/>
            <span className="text-blue-600 font-semibold">교사는 학급의 감정 상태를 한눈에</span>, <span className="text-purple-600 font-semibold">학생들은 재미있는 무드미터로</span><br/>
            함께 만들어가는 따뜻한 학교 문화를 경험해보세요.
          </p>
          
          {/* 키워드 태그 */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
              🌱 감정 성장
            </span>
            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              💙 소통 증진
            </span>
            <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              🎯 맞춤 상담
            </span>
            <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
              📊 AI 분석
            </span>
          </div>
        </div>

        {/* 기능 소개 */}
        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-emerald-100">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-100 to-blue-100 rounded-full flex items-center justify-center mb-6">
                  <span className="text-3xl">👨‍🏫</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold bg-gradient-to-r from-emerald-700 to-blue-700 bg-clip-text text-transparent">교사 대시보드</h3>
                <p className="mt-3 text-gray-600 leading-relaxed">
                  학급 관리, 학생 현황 모니터링, 상담 데이터 분석을 한 곳에서 쉽고 직관적으로 관리할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-blue-100">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                  <span className="text-3xl">💝</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">감정 무드미터</h3>
                <p className="mt-3 text-gray-600 leading-relaxed">
                  재미있고 직관적인 무드미터로 학생들이 자신의 감정을 자연스럽게 표현하고 기록할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-purple-100">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-emerald-100 rounded-full flex items-center justify-center mb-6">
                  <span className="text-3xl">🤖</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold bg-gradient-to-r from-purple-700 to-emerald-700 bg-clip-text text-transparent">AI 감정 분석</h3>
                <p className="mt-3 text-gray-600 leading-relaxed">
                  Google Gemini AI를 활용하여 SEL 기반의 전문적인 감정 분석과 개별 맞춤 상담을 지원합니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA 버튼 */}
        <div className="mt-20 text-center">
          <div className="space-y-6 sm:space-y-0 sm:space-x-6 sm:flex sm:justify-center">
            <Link
              href="/auth/login?role=teacher"
              className="group w-full sm:w-auto flex justify-center items-center px-10 py-4 text-lg font-semibold rounded-2xl text-white bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <span className="mr-2">👨‍🏫</span>
              교사로 시작하기
              <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link
              href="/auth/login?role=student"
              className="group w-full sm:w-auto flex justify-center items-center px-10 py-4 text-lg font-semibold rounded-2xl text-emerald-700 bg-gradient-to-r from-emerald-50 to-blue-50 hover:from-emerald-100 hover:to-blue-100 border-2 border-emerald-200 hover:border-emerald-300 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <span className="mr-2">👨‍🎓</span>
              학생으로 참여하기
              <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-gradient-to-r from-emerald-50 to-blue-50 border-t border-emerald-100">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
              <span className="text-2xl">💚</span>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                SEL 감정분석 플랫폼
              </h3>
              <span className="text-2xl">💚</span>
            </div>
            <p className="text-gray-600 mb-2">&copy; 2024 SEL 감정분석 플랫폼. All rights reserved.</p>
            <p className="text-emerald-600 font-medium">🌱 사회정서학습을 통한 건강한 학교 문화 조성 🌱</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
