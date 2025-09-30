// SEL 기반 설문 템플릿 데이터 - 완전히 리팩토링된 버전
export interface SELQuestion {
  id: string;
  question: string;
  type: 'scale' | 'multipleChoice' | 'text' | 'emotion';
  options?: string[];
  scaleLabels?: { min: string; max: string }; // 척도형 질문의 최소/최대 라벨
  selDomain: 'selfAwareness' | 'selfManagement' | 'socialAwareness' | 'relationshipSkills' | 'responsibleDecisionMaking';
  grade: '3-4' | '5-6' | 'all';
  required: boolean;
  analysisWeight?: number; // 리포트 분석 시 가중치 (1-5)
  subCategory?: string; // 세부 카테고리 (리포트용)
}

export interface SELTemplate {
  id: string;
  title: string;
  description: string;
  grade: '3-4' | '5-6';
  estimatedTime: number; // 분
  questions: SELQuestion[];
  tags: string[];
}

// 3-4학년용 완전히 개선된 SEL 설문 템플릿
export const grade34Template: SELTemplate = {
  id: 'sel-grade-3-4',
  title: '3-4학년 사회정서학습(SEL) 종합 설문',
  description: '초등학교 3-4학년 학생들의 사회정서 발달 상태를 종합적으로 분석하는 설문입니다. 결과는 개별 학생 리포트로 제공됩니다.',
  grade: '3-4',
  estimatedTime: 15,
  tags: ['SEL', '사회정서학습', '초등', '3-4학년', '종합설문', '리포트생성'],
  questions: [
    // 자기인식 (Self-Awareness) 영역
    {
      id: 'sa1',
      question: '나는 내 기분이 어떤지 잘 알 수 있어요.',
      type: 'scale',
      scaleLabels: { min: '전혀 그렇지 않다', max: '매우 그렇다' },
      selDomain: 'selfAwareness',
      grade: '3-4',
      required: true,
      analysisWeight: 4,
      subCategory: '감정인식'
    },
    {
      id: 'sa2',
      question: '지금 이 순간 나의 기분을 선택해주세요.',
      type: 'emotion',
      options: ['😊 행복해요', '😢 슬퍼요', '😠 화가 나요', '😰 걱정돼요', '😐 그냥 그래요', '🤗 신나요', '😴 피곤해요', '😎 자신감 있어요'],
      selDomain: 'selfAwareness',
      grade: '3-4',
      required: true,
      analysisWeight: 5,
      subCategory: '현재감정상태'
    },
    {
      id: 'sa3',
      question: '나는 내가 잘하는 것이 무엇인지 알고 있어요.',
      type: 'scale',
      scaleLabels: { min: '전혀 모르겠다', max: '확실히 알고 있다' },
      selDomain: 'selfAwareness',
      grade: '3-4',
      required: true,
      analysisWeight: 3,
      subCategory: '자기이해'
    },
    {
      id: 'sa4',
      question: '내가 좋아하는 것과 싫어하는 것을 잘 알고 있어요.',
      type: 'scale',
      scaleLabels: { min: '전혀 모르겠다', max: '확실히 알고 있다' },
      selDomain: 'selfAwareness',
      grade: '3-4',
      required: true,
      analysisWeight: 3,
      subCategory: '선호인식'
    },

    // 자기관리 (Self-Management) 영역
    {
      id: 'sm1',
      question: '화가 날 때 나는 진정할 수 있어요.',
      type: 'scale',
      scaleLabels: { min: '전혀 못한다', max: '매우 잘한다' },
      selDomain: 'selfManagement',
      grade: '3-4',
      required: true,
      analysisWeight: 5,
      subCategory: '감정조절'
    },
    {
      id: 'sm2',
      question: '숙제나 할 일을 미루지 않고 해요.',
      type: 'scale',
      scaleLabels: { min: '항상 미룬다', max: '바로바로 한다' },
      selDomain: 'selfManagement',
      grade: '3-4',
      required: true,
      analysisWeight: 4,
      subCategory: '과제관리'
    },
    {
      id: 'sm3',
      question: '어려운 일이 있어도 포기하지 않으려고 노력해요.',
      type: 'scale',
      scaleLabels: { min: '쉽게 포기한다', max: '끝까지 노력한다' },
      selDomain: 'selfManagement',
      grade: '3-4',
      required: true,
      analysisWeight: 4,
      subCategory: '인내력'
    },
    {
      id: 'sm4',
      question: '화가 났을 때 어떻게 해요?',
      type: 'multipleChoice',
      options: ['깊게 숨을 쉬어요', '잠시 혼자 있어요', '어른에게 말해요', '친구와 이야기해요', '그냥 참아요', '소리를 지르거나 울어요'],
      selDomain: 'selfManagement',
      grade: '3-4',
      required: true,
      analysisWeight: 4,
      subCategory: '감정대처방법'
    },

    // 사회적 인식 (Social Awareness) 영역
    {
      id: 'soa1',
      question: '친구들의 기분을 잘 알아챌 수 있어요.',
      type: 'scale',
      scaleLabels: { min: '전혀 못한다', max: '매우 잘한다' },
      selDomain: 'socialAwareness',
      grade: '3-4',
      required: true,
      analysisWeight: 4,
      subCategory: '감정읽기'
    },
    {
      id: 'soa2',
      question: '다른 사람의 마음을 이해하려고 해요.',
      type: 'scale',
      scaleLabels: { min: '전혀 안한다', max: '항상 한다' },
      selDomain: 'socialAwareness',
      grade: '3-4',
      required: true,
      analysisWeight: 4,
      subCategory: '공감능력'
    },
    {
      id: 'soa3',
      question: '친구가 슬퍼하면 나도 같이 슬퍼져요.',
      type: 'scale',
      scaleLabels: { min: '전혀 그렇지 않다', max: '매우 그렇다' },
      selDomain: 'socialAwareness',
      grade: '3-4',
      required: true,
      analysisWeight: 3,
      subCategory: '정서공감'
    },
    {
      id: 'soa4',
      question: '친구가 도움이 필요해 보일 때를 알 수 있어요.',
      type: 'scale',
      scaleLabels: { min: '전혀 모르겠다', max: '잘 알 수 있다' },
      selDomain: 'socialAwareness',
      grade: '3-4',
      required: true,
      analysisWeight: 4,
      subCategory: '도움요청인식'
    },

    // 관계 기술 (Relationship Skills) 영역
    {
      id: 'rs1',
      question: '친구들과 잘 어울려서 놀 수 있어요.',
      type: 'scale',
      scaleLabels: { min: '전혀 못한다', max: '매우 잘한다' },
      selDomain: 'relationshipSkills',
      grade: '3-4',
      required: true,
      analysisWeight: 4,
      subCategory: '사회성'
    },
    {
      id: 'rs2',
      question: '친구와 싸웠을 때 먼저 사과할 수 있어요.',
      type: 'scale',
      scaleLabels: { min: '전혀 못한다', max: '항상 할 수 있다' },
      selDomain: 'relationshipSkills',
      grade: '3-4',
      required: true,
      analysisWeight: 5,
      subCategory: '갈등해결'
    },
    {
      id: 'rs3',
      question: '친구에게 도움이 필요할 때 도와줘요.',
      type: 'scale',
      scaleLabels: { min: '전혀 안한다', max: '항상 한다' },
      selDomain: 'relationshipSkills',
      grade: '3-4',
      required: true,
      analysisWeight: 4,
      subCategory: '도움주기'
    },
    {
      id: 'rs4',
      question: '새로운 친구를 사귀는 것이 어려워요.',
      type: 'scale',
      scaleLabels: { min: '전혀 어렵지 않다', max: '매우 어렵다' },
      selDomain: 'relationshipSkills',
      grade: '3-4',
      required: true,
      analysisWeight: 3,
      subCategory: '친구사귀기'
    },

    // 책임감 있는 의사결정 (Responsible Decision Making) 영역
    {
      id: 'rdm1',
      question: '무엇을 할지 결정하기 전에 생각해봐요.',
      type: 'scale',
      scaleLabels: { min: '전혀 안한다', max: '항상 한다' },
      selDomain: 'responsibleDecisionMaking',
      grade: '3-4',
      required: true,
      analysisWeight: 4,
      subCategory: '신중한판단'
    },
    {
      id: 'rdm2',
      question: '잘못한 일이 있으면 솔직하게 말해요.',
      type: 'scale',
      scaleLabels: { min: '전혀 안한다', max: '항상 한다' },
      selDomain: 'responsibleDecisionMaking',
      grade: '3-4',
      required: true,
      analysisWeight: 5,
      subCategory: '정직성'
    },
    {
      id: 'rdm3',
      question: '규칙을 잘 지켜요.',
      type: 'scale',
      scaleLabels: { min: '전혀 안지킨다', max: '항상 지킨다' },
      selDomain: 'responsibleDecisionMaking',
      grade: '3-4',
      required: true,
      analysisWeight: 3,
      subCategory: '규칙준수'
    },
    {
      id: 'rdm4',
      question: '다른 사람에게 상처를 주지 않으려고 노력해요.',
      type: 'scale',
      scaleLabels: { min: '전혀 생각 안한다', max: '항상 생각한다' },
      selDomain: 'responsibleDecisionMaking',
      grade: '3-4',
      required: true,
      analysisWeight: 4,
      subCategory: '타인배려'
    },

    // 자유 응답 - 리포트 생성용 질적 데이터
    {
      id: 'open1',
      question: '오늘 있었던 일 중에서 기분 좋았던 일이 있다면 써주세요.',
      type: 'text',
      selDomain: 'selfAwareness',
      grade: '3-4',
      required: false,
      analysisWeight: 3,
      subCategory: '긍정경험'
    },
    {
      id: 'open2',
      question: '친구나 선생님에게 하고 싶은 말이 있나요?',
      type: 'text',
      selDomain: 'relationshipSkills',
      grade: '3-4',
      required: false,
      analysisWeight: 2,
      subCategory: '소통욕구'
    },
    {
      id: 'open3',
      question: '학교에서 가장 어려운 점이 있다면 무엇인가요?',
      type: 'text',
      selDomain: 'selfManagement',
      grade: '3-4',
      required: false,
      analysisWeight: 4,
      subCategory: '어려움인식'
    }
  ]
};

// 5-6학년용 완전히 개선된 SEL 설문 템플릿
export const grade56Template: SELTemplate = {
  id: 'sel-grade-5-6',
  title: '5-6학년 사회정서학습(SEL) 종합 설문',
  description: '초등학교 5-6학년 학생들의 사회정서 발달 상태를 종합적으로 분석하는 설문입니다. 결과는 개별 학생 리포트로 제공됩니다.',
  grade: '5-6',
  estimatedTime: 20,
  tags: ['SEL', '사회정서학습', '초등', '5-6학년', '종합설문', '리포트생성'],
  questions: [
    // 자기인식 (Self-Awareness) 영역
    {
      id: 'sa1',
      question: '나는 내 감정의 변화를 잘 알아차릴 수 있습니다.',
      type: 'scale',
      scaleLabels: { min: '전혀 그렇지 않다', max: '매우 그렇다' },
      selDomain: 'selfAwareness',
      grade: '5-6',
      required: true,
      analysisWeight: 4,
      subCategory: '감정인식'
    },
    {
      id: 'sa2',
      question: '현재 나의 감정 상태를 정확히 선택해주세요.',
      type: 'emotion',
      options: ['😊 기쁨', '😢 슬픔', '😠 분노', '😰 불안', '😐 평온', '🤗 흥분', '😔 우울', '😤 짜증', '😌 만족', '😟 걱정'],
      selDomain: 'selfAwareness',
      grade: '5-6',
      required: true,
      analysisWeight: 5,
      subCategory: '현재감정상태'
    },
    {
      id: 'sa3',
      question: '나는 내 강점과 약점을 잘 알고 있습니다.',
      type: 'scale',
      scaleLabels: { min: '전혀 모르겠다', max: '정확히 알고 있다' },
      selDomain: 'selfAwareness',
      grade: '5-6',
      required: true,
      analysisWeight: 4,
      subCategory: '자기이해'
    },
    {
      id: 'sa4',
      question: '스트레스를 받을 때 내 몸과 마음의 변화를 느낄 수 있습니다.',
      type: 'scale',
      scaleLabels: { min: '전혀 못느낀다', max: '명확히 느낀다' },
      selDomain: 'selfAwareness',
      grade: '5-6',
      required: true,
      analysisWeight: 4,
      subCategory: '스트레스인식'
    },
    {
      id: 'sa5',
      question: '내가 언제 행복하고 언제 스트레스를 받는지 알고 있습니다.',
      type: 'scale',
      scaleLabels: { min: '전혀 모르겠다', max: '정확히 안다' },
      selDomain: 'selfAwareness',
      grade: '5-6',
      required: true,
      analysisWeight: 3,
      subCategory: '감정패턴인식'
    },

    // 자기관리 (Self-Management) 영역
    {
      id: 'sm1',
      question: '화가 날 때 감정을 조절할 수 있는 방법을 알고 있습니다.',
      type: 'scale',
      scaleLabels: { min: '전혀 모르겠다', max: '여러 방법을 안다' },
      selDomain: 'selfManagement',
      grade: '5-6',
      required: true,
      analysisWeight: 5,
      subCategory: '감정조절'
    },
    {
      id: 'sm2',
      question: '목표를 세우고 꾸준히 노력합니다.',
      type: 'scale',
      scaleLabels: { min: '전혀 안한다', max: '항상 한다' },
      selDomain: 'selfManagement',
      grade: '5-6',
      required: true,
      analysisWeight: 4,
      subCategory: '목표관리'
    },
    {
      id: 'sm3',
      question: '어려운 상황에서도 침착함을 유지하려고 노력합니다.',
      type: 'scale',
      scaleLabels: { min: '전혀 안한다', max: '항상 노력한다' },
      selDomain: 'selfManagement',
      grade: '5-6',
      required: true,
      analysisWeight: 4,
      subCategory: '침착성'
    },
    {
      id: 'sm4',
      question: '스트레스를 해소하는 나만의 방법이 있습니다.',
      type: 'multipleChoice',
      options: ['운동하기', '음악 듣기', '친구와 대화', '혼자만의 시간', '취미활동', '잠자기', '게임하기', '특별한 방법이 없다'],
      selDomain: 'selfManagement',
      grade: '5-6',
      required: true,
      analysisWeight: 3,
      subCategory: '스트레스해소방법'
    },
    {
      id: 'sm5',
      question: '계획을 세워서 일을 체계적으로 진행할 수 있습니다.',
      type: 'scale',
      scaleLabels: { min: '전혀 못한다', max: '매우 잘한다' },
      selDomain: 'selfManagement',
      grade: '5-6',
      required: true,
      analysisWeight: 3,
      subCategory: '계획성'
    },

    // 사회적 인식 (Social Awareness) 영역
    {
      id: 'soa1',
      question: '다른 사람의 감정이나 기분을 잘 파악할 수 있습니다.',
      type: 'scale',
      scaleLabels: { min: '전혀 못한다', max: '매우 잘한다' },
      selDomain: 'socialAwareness',
      grade: '5-6',
      required: true,
      analysisWeight: 4,
      subCategory: '감정읽기'
    },
    {
      id: 'soa2',
      question: '다양한 관점에서 상황을 바라보려고 노력합니다.',
      type: 'scale',
      scaleLabels: { min: '전혀 안한다', max: '항상 노력한다' },
      selDomain: 'socialAwareness',
      grade: '5-6',
      required: true,
      analysisWeight: 4,
      subCategory: '관점이해'
    },
    {
      id: 'soa3',
      question: '다른 사람의 입장이 되어 생각해볼 수 있습니다.',
      type: 'scale',
      scaleLabels: { min: '전혀 못한다', max: '매우 잘한다' },
      selDomain: 'socialAwareness',
      grade: '5-6',
      required: true,
      analysisWeight: 5,
      subCategory: '역지사지'
    },
    {
      id: 'soa4',
      question: '사회의 다양성을 인정하고 존중합니다.',
      type: 'scale',
      scaleLabels: { min: '전혀 그렇지 않다', max: '매우 그렇다' },
      selDomain: 'socialAwareness',
      grade: '5-6',
      required: true,
      analysisWeight: 3,
      subCategory: '다양성존중'
    },

    // 관계 기술 (Relationship Skills) 영역
    {
      id: 'rs1',
      question: '친구들과의 갈등을 건설적으로 해결할 수 있습니다.',
      type: 'scale',
      scaleLabels: { min: '전혀 못한다', max: '매우 잘한다' },
      selDomain: 'relationshipSkills',
      grade: '5-6',
      required: true,
      analysisWeight: 5,
      subCategory: '갈등해결'
    },
    {
      id: 'rs2',
      question: '팀워크를 통해 협력하는 것을 좋아합니다.',
      type: 'scale',
      scaleLabels: { min: '전혀 좋아하지 않는다', max: '매우 좋아한다' },
      selDomain: 'relationshipSkills',
      grade: '5-6',
      required: true,
      analysisWeight: 4,
      subCategory: '협력성'
    },
    {
      id: 'rs3',
      question: '다른 사람의 의견을 경청하고 존중합니다.',
      type: 'scale',
      scaleLabels: { min: '전혀 안한다', max: '항상 한다' },
      selDomain: 'relationshipSkills',
      grade: '5-6',
      required: true,
      analysisWeight: 4,
      subCategory: '경청능력'
    },
    {
      id: 'rs4',
      question: '도움이 필요할 때 적절한 사람에게 요청할 수 있습니다.',
      type: 'scale',
      scaleLabels: { min: '전혀 못한다', max: '매우 잘한다' },
      selDomain: 'relationshipSkills',
      grade: '5-6',
      required: true,
      analysisWeight: 4,
      subCategory: '도움요청'
    },
    {
      id: 'rs5',
      question: '갈등이 생겼을 때 주로 어떻게 해결하나요?',
      type: 'multipleChoice',
      options: ['직접 대화로 해결', '시간을 두고 기다림', '다른 사람에게 도움 요청', '회피하거나 피함', '감정적으로 반응', '규칙이나 원칙에 따라 해결'],
      selDomain: 'relationshipSkills',
      grade: '5-6',
      required: true,
      analysisWeight: 4,
      subCategory: '갈등대처방법'
    },

    // 책임감 있는 의사결정 (Responsible Decision Making) 영역
    {
      id: 'rdm1',
      question: '결정을 내리기 전에 여러 가지 선택지를 고려합니다.',
      type: 'scale',
      scaleLabels: { min: '전혀 안한다', max: '항상 한다' },
      selDomain: 'responsibleDecisionMaking',
      grade: '5-6',
      required: true,
      analysisWeight: 4,
      subCategory: '신중한판단'
    },
    {
      id: 'rdm2',
      question: '내 행동이 다른 사람에게 미치는 영향을 생각합니다.',
      type: 'scale',
      scaleLabels: { min: '전혀 생각 안한다', max: '항상 생각한다' },
      selDomain: 'responsibleDecisionMaking',
      grade: '5-6',
      required: true,
      analysisWeight: 5,
      subCategory: '파급효과인식'
    },
    {
      id: 'rdm3',
      question: '윤리적으로 올바른 선택을 하려고 노력합니다.',
      type: 'scale',
      scaleLabels: { min: '전혀 안한다', max: '항상 노력한다' },
      selDomain: 'responsibleDecisionMaking',
      grade: '5-6',
      required: true,
      analysisWeight: 4,
      subCategory: '윤리적판단'
    },
    {
      id: 'rdm4',
      question: '실수했을 때 책임을 지고 해결방법을 찾습니다.',
      type: 'scale',
      scaleLabels: { min: '전혀 안한다', max: '항상 한다' },
      selDomain: 'responsibleDecisionMaking',
      grade: '5-6',
      required: true,
      analysisWeight: 5,
      subCategory: '책임감'
    },
    {
      id: 'rdm5',
      question: '최근 한 달 동안 가장 스트레스를 받았던 상황은 무엇인가요?',
      type: 'multipleChoice',
      options: ['학업/시험', '친구관계', '가족관계', '진로/미래', '외모/신체', '선생님과의 관계', '온라인 활동', '기타'],
      selDomain: 'responsibleDecisionMaking',
      grade: '5-6',
      required: true,
      analysisWeight: 3,
      subCategory: '스트레스요인'
    },

    // 자유 응답 - 리포트 생성용 질적 데이터
    {
      id: 'open1',
      question: '최근에 성장했다고 느끼는 부분이 있다면 자유롭게 써주세요.',
      type: 'text',
      selDomain: 'selfAwareness',
      grade: '5-6',
      required: false,
      analysisWeight: 3,
      subCategory: '성장인식'
    },
    {
      id: 'open2',
      question: '학교생활에서 개선되었으면 하는 점이나 바라는 점이 있나요?',
      type: 'text',
      selDomain: 'responsibleDecisionMaking',
      grade: '5-6',
      required: false,
      analysisWeight: 3,
      subCategory: '개선욕구'
    },
    {
      id: 'open3',
      question: '친구들과의 관계에서 가장 중요하다고 생각하는 것은 무엇인가요?',
      type: 'text',
      selDomain: 'relationshipSkills',
      grade: '5-6',
      required: false,
      analysisWeight: 3,
      subCategory: '관계가치관'
    }
  ]
};

// 모든 템플릿을 내보내기
export const selTemplates: SELTemplate[] = [grade34Template, grade56Template];

// SEL 영역별 설명 및 리포트 생성용 메타데이터
export const selDomainDescriptions = {
  selfAwareness: {
    name: '자기인식',
    description: '자신의 감정, 생각, 가치관, 강점과 약점을 이해하는 능력',
    icon: '🧠',
    reportWeight: 20, // 리포트에서의 가중치 (%)
    subCategories: ['감정인식', '현재감정상태', '자기이해', '선호인식', '스트레스인식', '감정패턴인식']
  },
  selfManagement: {
    name: '자기관리',
    description: '감정과 행동을 효과적으로 조절하고 목표를 달성하는 능력',
    icon: '⚖️',
    reportWeight: 25,
    subCategories: ['감정조절', '과제관리', '인내력', '감정대처방법', '목표관리', '침착성', '스트레스해소방법', '계획성']
  },
  socialAwareness: {
    name: '사회적 인식',
    description: '다른 사람의 관점을 이해하고 공감하며 다양성을 존중하는 능력',
    icon: '👥',
    reportWeight: 20,
    subCategories: ['감정읽기', '공감능력', '정서공감', '도움요청인식', '관점이해', '역지사지', '다양성존중']
  },
  relationshipSkills: {
    name: '관계 기술',
    description: '건강한 관계를 형성하고 유지하며 갈등을 해결하는 능력',
    icon: '🤝',
    reportWeight: 20,
    subCategories: ['사회성', '갈등해결', '도움주기', '친구사귀기', '협력성', '경청능력', '도움요청', '갈등대처방법']
  },
  responsibleDecisionMaking: {
    name: '책임감 있는 의사결정',
    description: '윤리적이고 건설적인 선택을 하고 그 결과에 책임지는 능력',
    icon: '🎯',
    reportWeight: 15,
    subCategories: ['신중한판단', '정직성', '규칙준수', '타인배려', '파급효과인식', '윤리적판단', '책임감', '스트레스요인']
  }
};

// 리포트 생성용 분석 가이드라인
export const reportAnalysisGuidelines = {
  scaleInterpretation: {
    1: { level: '매우 낮음', color: '#ef4444', description: '즉시 관심과 지원이 필요한 영역' },
    2: { level: '낮음', color: '#f97316', description: '개선이 필요한 영역' },
    3: { level: '보통', color: '#eab308', description: '평균적인 수준' },
    4: { level: '높음', color: '#22c55e', description: '잘 발달된 영역' },
    5: { level: '매우 높음', color: '#16a34a', description: '매우 우수한 영역' }
  },
  emotionMapping: {
    '😊': { category: 'positive', intensity: 'high', description: '긍정적이고 활발한 상태' },
    '😢': { category: 'negative', intensity: 'high', description: '슬픔이나 우울감' },
    '😠': { category: 'negative', intensity: 'high', description: '분노나 좌절감' },
    '😰': { category: 'negative', intensity: 'medium', description: '불안이나 걱정' },
    '😐': { category: 'neutral', intensity: 'low', description: '평온하거나 무관심' },
    '🤗': { category: 'positive', intensity: 'high', description: '흥분이나 기대감' },
    '😴': { category: 'neutral', intensity: 'low', description: '피로하거나 무기력' },
    '😎': { category: 'positive', intensity: 'medium', description: '자신감이나 만족감' }
  }
};