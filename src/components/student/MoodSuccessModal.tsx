'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MoodOption } from '@/types';
import { Sparkles, Heart, Star, ThumbsUp } from 'lucide-react';

interface MoodSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  mood: MoodOption;
  isUpdate: boolean;
}

// 응원 메시지 배열
const encouragementMessages = [
  "멋진 선택이에요! 😊",
  "용기 있는 친구에게 박수를! 👏",
  "감정을 나누는 건 정말 대단한 일이에요! ⭐",
  "오늘도 최고의 하루를 보내세요! 🌟",
  "당신의 솔직함이 빛나요! ✨",
  "감정을 표현하는 것은 성장의 시작이에요! 🌱",
  "정말 자랑스러워요! 💪",
  "함께라서 더 특별한 하루! 💖"
];

// 긍정적 기분에 대한 추가 메시지
const positiveMessages = [
  "이 좋은 기분이 계속 이어지길 바라요! 🌈",
  "행복한 에너지가 느껴져요! 💫",
  "멋진 하루를 보내고 있네요! 🎈",
  "이 기쁨을 친구들과 나눠봐요! 🎁"
];

// 어려운 기분에 대한 응원 메시지
const supportiveMessages = [
  "힘든 감정도 소중해요. 함께 극복해나가요! 🤗",
  "어려운 순간에도 솔직하게 표현해줘서 고마워요! 💙",
  "감정을 나누는 것은 용기있는 행동이에요! 🌟",
  "선생님과 친구들이 함께 있어요! 🫂"
];

export default function MoodSuccessModal({
  isOpen,
  onClose,
  mood,
  isUpdate
}: MoodSuccessModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [randomMessage, setRandomMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);

      // 기분에 따라 적절한 메시지 선택
      const baseMessage = encouragementMessages[
        Math.floor(Math.random() * encouragementMessages.length)
      ];

      let additionalMessage = '';
      if (mood.pleasantness === 'pleasant') {
        additionalMessage = positiveMessages[
          Math.floor(Math.random() * positiveMessages.length)
        ];
      } else {
        additionalMessage = supportiveMessages[
          Math.floor(Math.random() * supportiveMessages.length)
        ];
      }

      setRandomMessage(`${baseMessage} ${additionalMessage}`);

      // 애니메이션 효과를 위한 타이머
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, mood]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] overflow-hidden">
        {/* 배경 애니메이션 */}
        <div className="absolute inset-0 pointer-events-none">
          {showConfetti && (
            <>
              {/* 떨어지는 별들 */}
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-fall"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `-${Math.random() * 20}px`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 2}s`,
                  }}
                >
                  {i % 3 === 0 ? '⭐' : i % 3 === 1 ? '✨' : '🌟'}
                </div>
              ))}

              {/* 떠오르는 하트들 */}
              {[...Array(10)].map((_, i) => (
                <div
                  key={`heart-${i}`}
                  className="absolute animate-rise"
                  style={{
                    left: `${Math.random() * 100}%`,
                    bottom: `-20px`,
                    animationDelay: `${Math.random() * 1.5}s`,
                    animationDuration: `${3 + Math.random() * 2}s`,
                  }}
                >
                  💖
                </div>
              ))}
            </>
          )}
        </div>

        {/* 메인 콘텐츠 */}
        <div className="relative z-10">
          <DialogHeader className="space-y-4">
            {/* 큰 이모지 */}
            <div className="flex justify-center">
              <div className="text-8xl animate-bounce-slow">
                {mood.emoji}
              </div>
            </div>

            <DialogTitle className="text-center text-2xl font-bold">
              {isUpdate ? '기분이 업데이트되었어요!' : '기분이 저장되었어요!'}
            </DialogTitle>

            <DialogDescription className="text-center space-y-3">
              {/* 선택한 감정 표시 */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
                <p className="text-lg font-semibold text-purple-800">
                  {mood.emoji} {mood.emotion}
                </p>
                <p className="text-sm text-purple-600 mt-1">
                  {mood.description}
                </p>
              </div>

              {/* 응원 메시지 */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border-2 border-blue-200">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5 animate-pulse" />
                  <p className="text-sm text-blue-800 leading-relaxed">
                    {randomMessage}
                  </p>
                </div>
              </div>

              {/* 포인트 안내 */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <Heart className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                  <p className="text-xs text-yellow-800 font-medium">감정 공유</p>
                  <p className="text-xs text-yellow-600">+1 용기 포인트</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <Star className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-green-800 font-medium">매일 참여</p>
                  <p className="text-xs text-green-600">성장 중!</p>
                </div>
              </div>

              {/* 추가 팁 */}
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200 mt-3">
                <div className="flex items-start gap-2">
                  <ThumbsUp className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-700 text-left">
                    <strong>꿀팁:</strong> 매일 기분을 기록하면 내 감정 패턴을 알 수 있어요!
                    선생님도 여러분을 더 잘 이해할 수 있답니다. 😊
                  </p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>

          {/* 확인 버튼 */}
          <div className="mt-6 flex justify-center">
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-2 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 animate-pulse-slow"
            >
              좋아요! 👍
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* 커스텀 애니메이션 스타일 */}
      <style jsx global>{`
        @keyframes fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(500px) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes rise {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 1;
          }
          100% {
            transform: translateY(-500px) scale(1);
            opacity: 0;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-20px) scale(1.1);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }

        .animate-fall {
          animation: fall linear forwards;
        }

        .animate-rise {
          animation: rise linear forwards;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </Dialog>
  );
}
