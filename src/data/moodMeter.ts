// 무드미터 감정 데이터
import { MoodOption } from '@/types';

export const moodOptions: MoodOption[] = [
  // 기쁨 계열 (Pleasant + High Energy)
  {
    id: 'ecstatic',
    emotion: '황홀해요',
    emoji: '🤩',
    energy: 'high',
    pleasantness: 'pleasant',
    color: '#FFD700',
    description: '아주 신나고 환상적인 기분이에요!'
  },
  {
    id: 'excited',
    emotion: '신나요',
    emoji: '😆',
    energy: 'high',
    pleasantness: 'pleasant',
    color: '#FF6B6B',
    description: '무언가 기대되고 들뜬 기분이에요!'
  },
  {
    id: 'energetic',
    emotion: '활기찬',
    emoji: '😊',
    energy: 'high',
    pleasantness: 'pleasant',
    color: '#4ECDC4',
    description: '에너지가 넘치고 활발한 기분이에요!'
  },
  
  // 평온 계열 (Pleasant + Low Energy)
  {
    id: 'peaceful',
    emotion: '평온해요',
    emoji: '😌',
    energy: 'low',
    pleasantness: 'pleasant',
    color: '#95E1D3',
    description: '마음이 차분하고 편안해요'
  },
  {
    id: 'grateful',
    emotion: '고마워요',
    emoji: '🥰',
    energy: 'low',
    pleasantness: 'pleasant',
    color: '#FFB6C1',
    description: '누군가에게 감사한 마음이 들어요'
  },
  {
    id: 'content',
    emotion: '만족해요',
    emoji: '😄',
    energy: 'low',
    pleasantness: 'pleasant',
    color: '#87CEEB',
    description: '지금 상황에 만족하고 있어요'
  },

  // 보통 (중립)
  {
    id: 'neutral',
    emotion: '보통이에요',
    emoji: '😐',
    energy: 'low',
    pleasantness: 'pleasant',
    color: '#DDD',
    description: '특별히 좋지도 나쁘지도 않은 평범한 기분이에요'
  },

  // 슬픔 계열 (Unpleasant + Low Energy)
  {
    id: 'sad',
    emotion: '슬퍼요',
    emoji: '😢',
    energy: 'low',
    pleasantness: 'unpleasant',
    color: '#6C7B95',
    description: '마음이 무겁고 슬픈 기분이에요'
  },
  {
    id: 'lonely',
    emotion: '외로워요',
    emoji: '😔',
    energy: 'low',
    pleasantness: 'unpleasant',
    color: '#9B9B9B',
    description: '혼자인 것 같고 외로운 기분이에요'
  },
  {
    id: 'tired',
    emotion: '피곤해요',
    emoji: '😴',
    energy: 'low',
    pleasantness: 'unpleasant',
    color: '#B19CD9',
    description: '몸과 마음이 지치고 피곤해요'
  },

  // 스트레스/분노 계열 (Unpleasant + High Energy)
  {
    id: 'angry',
    emotion: '화나요',
    emoji: '😠',
    energy: 'high',
    pleasantness: 'unpleasant',
    color: '#FF4757',
    description: '무언가 때문에 화가 나고 짜증이 나요'
  },
  {
    id: 'frustrated',
    emotion: '답답해요',
    emoji: '😤',
    energy: 'high',
    pleasantness: 'unpleasant',
    color: '#FF6B35',
    description: '일이 뜻대로 되지 않아 답답해요'
  },
  {
    id: 'worried',
    emotion: '걱정돼요',
    emoji: '😰',
    energy: 'high',
    pleasantness: 'unpleasant',
    color: '#FFA07A',
    description: '무언가가 걱정되고 불안해요'
  }
];

// 에너지 수준별 감정 그룹
export const moodsByEnergy = {
  high: moodOptions.filter(mood => mood.energy === 'high'),
  low: moodOptions.filter(mood => mood.energy === 'low')
};

// 긍정/부정별 감정 그룹
export const moodsByPleasantness = {
  pleasant: moodOptions.filter(mood => mood.pleasantness === 'pleasant'),
  unpleasant: moodOptions.filter(mood => mood.pleasantness === 'unpleasant')
};

// 무드미터 설명
export const moodMeterDescription = {
  title: '오늘의 기분은 어때요?',
  subtitle: '지금 느끼는 감정을 선택해주세요',
  instructions: [
    '자신의 마음을 잘 살펴보세요',
    '가장 가까운 감정을 골라주세요',
    '정답은 없어요, 솔직하게 표현하세요'
  ]
};