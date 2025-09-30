// 설문 완료 페이지 - 긍정적 피드백과 다음 단계 안내
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home, Trophy, Lightbulb, Heart, BarChart3, Users, Star } from 'lucide-react';

const completionMessages = {
  daily: {
    title: '오늘의 감정 체크 완료! 🎉',
    message: '솔직한 마음을 나누어 주셔서 고마워요. 매일 조금씩 나누는 감정이 더 나은 내일을 만들어요.',
    emoji: '😊',
    color: 'from-blue-400 to-purple-500',
    nextSteps: [
      '내일도 기분을 체크해주세요',
      '힘든 일이 있으면 선생님께 이야기해주세요',
      '오늘 하루도 수고했어요!'
    ]
  },
  weekly: {
    title: '일주일 돌아보기 완료! 🌟',
    message: '한 주 동안의 소중한 경험을 정리해주셔서 감사해요. 이런 돌아보기가 성장의 첫걸음이에요.',
    emoji: '📝',
    color: 'from-green-400 to-blue-500',
    nextSteps: [
      '다음 주에도 새로운 도전해보세요',
      '친구들과 좋은 시간 보내세요',
      '어려운 일은 선생님과 상의해요'
    ]
  },
  monthly: {
    title: '한 달 성장 이야기 완료! 🌱',
    message: '한 달 동안의 성장을 되돌아봐주셔서 정말 대단해요! 선생님이 곧 분석 결과를 알려드릴게요.',
    emoji: '🌱',
    color: 'from-purple-400 to-pink-500',
    nextSteps: [
      '분석 결과를 확인해보세요 (2-3일 후)',
      '계속해서 감정 일기를 써보세요',
      '새로운 한 달의 목표를 세워보세요'
    ]
  }
};

export default function SurveyCompletePage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const surveyType = searchParams.get('type') as keyof typeof completionMessages;
  
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!user || userProfile?.role !== 'student') {
      router.push('/auth/login?role=student');
      return;
    }

    if (!surveyType || !completionMessages[surveyType]) {
      router.push('/student/dashboard');
      return;
    }

    // 완료 애니메이션 효과
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, [user, userProfile, router, surveyType]);

  if (!surveyType || !completionMessages[surveyType]) {
    return null;
  }

  const config = completionMessages[surveyType];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 relative overflow-hidden">
      {/* 컨페티 애니메이션 */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              {['🎉', '✨', '🌟', '🎊', '💫'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          {/* 메인 완료 카드 */}
          <Card className="relative overflow-hidden">
            {/* 배경 그라데이션 */}
            <div className={`absolute inset-0 bg-gradient-to-r ${config.color} opacity-10`}></div>
            
            <CardContent className="relative z-10 p-8 text-center">
              {/* 이모지와 제목 */}
              <div className="mb-6">
                <div className="text-6xl mb-4 animate-bounce">
                  {config.emoji}
                </div>
                <CardHeader className="p-0">
                  <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                    {config.title}
                  </CardTitle>
                </CardHeader>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {config.message}
                </p>
              </div>

              {/* 성취 배지 */}
              <Badge className={`inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r ${config.color} text-white font-medium mb-8 text-base`}>
                <Trophy className="w-4 h-4 mr-2" />
                설문 완료 달성!
              </Badge>

              {/* 다음 단계 안내 */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 mr-2" />
                    다음에는 이런 걸 해보세요
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {config.nextSteps.map((step, index) => (
                      <li key={index} className="flex items-center text-gray-700">
                        <Badge variant="secondary" className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-400 text-white text-xs rounded-full flex items-center justify-center mr-3 p-0">
                          {index + 1}
                        </Badge>
                        {step}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* 격려 메시지 */}
              <Card className="bg-gradient-to-r from-yellow-100 to-orange-100 mb-8">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-3">
                    <span className="text-2xl mr-2">🌈</span>
                    <span className="font-semibold text-gray-900">선생님의 응원</span>
                  </div>
                  <p className="text-gray-700 italic">
                    &ldquo;감정을 나누는 용기가 있는 여러분이 자랑스러워요. 
                    작은 변화들이 모여서 큰 성장을 만들어낸답니다!&rdquo;
                  </p>
                </CardContent>
              </Card>

              {/* 액션 버튼들 */}
              <div className="space-y-4">
                <Button
                  onClick={() => router.push('/student/dashboard')}
                  className={`w-full py-4 px-6 bg-gradient-to-r ${config.color} text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200`}
                  size="lg"
                >
                  <Home className="w-4 h-4 mr-2" />
                  대시보드로 돌아가기
                </Button>
                
                {surveyType !== 'monthly' && (
                  <Button
                    onClick={() => router.push('/student/dashboard')}
                    variant="outline"
                    className="w-full py-3 px-6 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                    size="lg"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    다른 설문 참여하기
                  </Button>
                )}
              </div>

              {/* 추가 정보 */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <Card className="p-4">
                    <CardContent className="p-0">
                      <BarChart3 className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                      <div className="text-sm text-gray-600">
                        내 응답은 안전하게<br />보관됩니다
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="p-4">
                    <CardContent className="p-0">
                      <Users className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <div className="text-sm text-gray-600">
                        선생님이 더 잘<br />도와드릴 수 있어요
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="p-4">
                    <CardContent className="p-0">
                      <Star className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                      <div className="text-sm text-gray-600">
                        계속 참여하면<br />더 성장해요
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 하단 추가 메시지 */}
          <Card className="mt-6 text-center">
            <CardContent className="p-4">
              <p className="text-sm text-gray-500 flex items-center justify-center">
                <Heart className="w-4 h-4 mr-2 text-pink-500" />
                소중한 시간을 내어 참여해주셔서 감사합니다
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}