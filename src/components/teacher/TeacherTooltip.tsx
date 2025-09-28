'use client';

import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Info, Lightbulb, AlertTriangle } from 'lucide-react';

interface TeacherTooltipProps {
  children: React.ReactNode;
  content: string;
  type?: 'info' | 'tip' | 'warning' | 'help';
  side?: 'top' | 'right' | 'bottom' | 'left';
  maxWidth?: string;
}

const TOOLTIP_STYLES = {
  info: {
    icon: Info,
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    iconColor: 'text-blue-600'
  },
  tip: {
    icon: Lightbulb,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    iconColor: 'text-yellow-600'
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-orange-100 text-orange-800 border-orange-200',
    iconColor: 'text-orange-600'
  },
  help: {
    icon: HelpCircle,
    className: 'bg-purple-100 text-purple-800 border-purple-200',
    iconColor: 'text-purple-600'
  }
};

export function TeacherTooltip({ 
  children, 
  content, 
  type = 'info', 
  side = 'top',
  maxWidth = 'max-w-xs' 
}: TeacherTooltipProps) {
  const style = TOOLTIP_STYLES[type];
  const Icon = style.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          className={`${style.className} border ${maxWidth} p-3 rounded-lg shadow-lg`}
        >
          <div className="flex items-start space-x-2">
            <Icon className={`w-4 h-4 ${style.iconColor} flex-shrink-0 mt-0.5`} />
            <p className="text-sm leading-relaxed">{content}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// 미리 정의된 교육 관련 툴팁들
export const TEACHER_TOOLTIPS = {
  // SEL 관련
  selDomain: {
    selfAwareness: "학생이 자신의 감정, 생각, 가치관을 인식하고 이해하는 능력입니다. 예: '지금 내 기분이 어떤가요?'",
    selfManagement: "감정을 조절하고 목표를 설정하며 스트레스를 관리하는 능력입니다. 예: '화가 날 때 어떻게 진정시키나요?'",
    socialAwareness: "타인의 감정을 이해하고 사회적 상황을 파악하는 능력입니다. 예: '친구가 슬퍼보일 때 어떻게 해야 할까요?'",
    relationshipSkills: "건강한 관계를 형성하고 유지하며 갈등을 해결하는 능력입니다. 예: '친구와 의견이 다를 때 어떻게 대화하나요?'",
    responsibleDecisionMaking: "윤리적이고 건설적인 선택을 하며 결과를 고려하는 능력입니다. 예: '어려운 상황에서 어떤 선택을 하시겠나요?'"
  },
  
  // 질문 유형 관련
  questionType: {
    scale: "1점부터 5점까지의 척도로 답하는 문항입니다. 감정의 강도나 동의 정도를 측정할 때 사용해요.",
    choice: "여러 선택지 중 하나를 고르는 문항입니다. 명확한 선택이 필요한 질문에 적합해요.",
    text: "자유롭게 글로 답하는 문항입니다. 학생들의 생각이나 경험을 자세히 알고 싶을 때 사용해요.",
    emotion: "감정 이모지로 답하는 문항입니다. 어린 학생들도 쉽게 자신의 감정을 표현할 수 있어요."
  },
  
  // 설문 관련
  survey: {
    title: "학생들이 이해하기 쉽고 관심을 가질 수 있는 제목을 만들어주세요. 예: '우리 반 친구들과의 하루'",
    description: "설문의 목적과 소요시간을 간단히 설명해주세요. 학생들이 안심하고 참여할 수 있도록 도와줍니다.",
    estimatedTime: "학생들의 집중력을 고려하여 10-15분 이내로 설정하는 것을 추천해요.",
    required: "필수 문항은 꼭 필요한 것만 선택해주세요. 너무 많으면 학생들이 부담스러워할 수 있어요."
  },
  
  // AI 관련
  ai: {
    prompt: "구체적이고 명확한 상황을 입력하면 더 좋은 설문이 만들어져요. 예: '새 학기 적응을 위한 3학년용 설문'",
    validation: "AI가 생성한 설문의 적절성을 자동으로 검사합니다. 점수가 낮으면 수정을 권장해요.",
    questionCount: "학년이 낮을수록 문항 수를 줄이는 것이 좋아요. 3-4학년: 10-15문항, 5-6학년: 15-20문항 권장"
  },
  
  // 일반적인 도움말
  general: {
    classCode: "학생들이 설문에 참여할 때 입력하는 코드입니다. 학생들에게 정확히 알려주세요.",
    participation: "참여율이 낮다면 설문 시간이나 난이도를 조정해보세요. 학생들의 피드백도 들어보시는 것을 추천해요.",
    analysis: "SEL 분석 결과는 학생 개별 상담이나 학급 운영에 활용하시면 도움이 됩니다."
  }
};

// 특정 상황에 맞는 도움말 컴포넌트들
export function SELDomainTooltip({ domain, children }: { domain: keyof typeof TEACHER_TOOLTIPS.selDomain; children: React.ReactNode }) {
  return (
    <TeacherTooltip 
      content={TEACHER_TOOLTIPS.selDomain[domain]} 
      type="help"
      maxWidth="max-w-sm"
    >
      {children}
    </TeacherTooltip>
  );
}

export function QuestionTypeTooltip({ type, children }: { type: keyof typeof TEACHER_TOOLTIPS.questionType; children: React.ReactNode }) {
  return (
    <TeacherTooltip 
      content={TEACHER_TOOLTIPS.questionType[type]} 
      type="tip"
      maxWidth="max-w-sm"
    >
      {children}
    </TeacherTooltip>
  );
}

export function SurveyTooltip({ type, children }: { type: keyof typeof TEACHER_TOOLTIPS.survey; children: React.ReactNode }) {
  return (
    <TeacherTooltip 
      content={TEACHER_TOOLTIPS.survey[type]} 
      type="info"
      maxWidth="max-w-sm"
    >
      {children}
    </TeacherTooltip>
  );
}