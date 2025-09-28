'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  Users, 
  Brain,
  Heart,
  Lightbulb,
  Target,
  FileText,
  Sparkles,
  Plus,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SurveyCreationGuideProps {
  currentStep: 'method' | 'template' | 'ai' | 'custom' | 'review';
  onStepChange: (step: 'method' | 'template' | 'ai' | 'custom' | 'review') => void;
  surveyData?: {
    title?: string;
    questionCount?: number;
    estimatedTime?: number;
  };
}

const SEL_DOMAINS = {
  selfAwareness: { name: '자기인식', icon: Brain, color: 'bg-blue-100 text-blue-700', description: '자신의 감정과 생각 인식' },
  selfManagement: { name: '자기관리', icon: Target, color: 'bg-green-100 text-green-700', description: '감정 조절과 목표 설정' },
  socialAwareness: { name: '사회적 인식', icon: Users, color: 'bg-purple-100 text-purple-700', description: '타인과 환경에 대한 이해' },
  relationshipSkills: { name: '관계 기술', icon: Heart, color: 'bg-pink-100 text-pink-700', description: '건강한 관계 형성과 유지' },
  responsibleDecisionMaking: { name: '책임감 있는 의사결정', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-700', description: '윤리적이고 건설적인 선택' }
};

const GUIDE_STEPS = [
  { 
    id: 'method', 
    title: '생성 방식 선택', 
    description: '어떤 방식으로 설문을 만들지 선택하세요',
    tips: '처음이시라면 SEL 템플릿을 추천드려요!'
  },
  { 
    id: 'template', 
    title: '템플릿 선택', 
    description: '학년에 맞는 검증된 설문 템플릿을 선택하세요',
    tips: '우리 반 학년에 맞는 템플릿을 선택해주세요'
  },
  { 
    id: 'ai', 
    title: 'AI 설문 생성', 
    description: 'AI가 자동으로 맞춤형 설문을 생성합니다',
    tips: '주제나 상황을 구체적으로 입력하면 더 좋은 설문이 만들어져요'
  },
  { 
    id: 'custom', 
    title: '설문 편집', 
    description: '설문 내용을 검토하고 필요시 수정하세요',
    tips: '질문이 너무 어렵거나 쉽다면 수정해보세요'
  },
  { 
    id: 'review', 
    title: '최종 검토', 
    description: '설문을 미리보고 학생들에게 배포하세요',
    tips: '미리보기로 학생 입장에서 한번 확인해보세요'
  }
];

export function SurveyCreationGuide({ currentStep, onStepChange, surveyData }: SurveyCreationGuideProps) {
  const [showHelp, setShowHelp] = useState(false);
  
  const currentStepIndex = GUIDE_STEPS.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / GUIDE_STEPS.length) * 100;
  const currentStepData = GUIDE_STEPS[currentStepIndex];

  const canGoNext = currentStepIndex < GUIDE_STEPS.length - 1;
  const canGoPrev = currentStepIndex > 0;

  const handleNext = () => {
    if (canGoNext) {
      const nextStep = GUIDE_STEPS[currentStepIndex + 1];
      onStepChange(nextStep.id as any);
    }
  };

  const handlePrev = () => {
    if (canGoPrev) {
      const prevStep = GUIDE_STEPS[currentStepIndex - 1];
      onStepChange(prevStep.id as any);
    }
  };

  return (
    <TooltipProvider>
      <Card className="mb-6 border-l-4 border-l-primary">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">설문 생성 가이드</CardTitle>
                <p className="text-sm text-muted-foreground">
                  단계별로 따라하시면 쉽게 설문을 만들 수 있어요
                </p>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHelp(!showHelp)}
                >
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>SEL 설문에 대한 도움말</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 진행률 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">진행률</span>
              <span className="text-sm text-muted-foreground">
                {currentStepIndex + 1} / {GUIDE_STEPS.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* 현재 단계 정보 */}
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>{currentStepData.title}</strong>: {currentStepData.description}
              {currentStepData.tips && (
                <div className="mt-1 text-sm">
                  💡 <em>{currentStepData.tips}</em>
                </div>
              )}
            </AlertDescription>
          </Alert>

          {/* 단계별 표시 */}
          <div className="flex items-center justify-between space-x-2 overflow-x-auto">
            {GUIDE_STEPS.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isUpcoming = index > currentStepIndex;

              return (
                <div key={step.id} className="flex items-center space-x-2 min-w-0">
                  <div className="flex flex-col items-center space-y-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        isCompleted
                          ? 'bg-green-100 text-green-700'
                          : isCurrent
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="text-xs text-center max-w-20 truncate">
                      {step.title}
                    </div>
                  </div>
                  {index < GUIDE_STEPS.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* 네비게이션 버튼 */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={!canGoPrev}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>이전 단계</span>
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canGoNext}
              className="flex items-center space-x-2"
            >
              <span>다음 단계</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* 설문 정보 요약 (편집 단계 이후) */}
          {surveyData && (currentStep === 'custom' || currentStep === 'review') && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                현재 설문 정보
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">제목:</span>
                  <p className="font-medium">{surveyData.title || '설문 제목 없음'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">질문 수:</span>
                  <p className="font-medium">{surveyData.questionCount || 0}개</p>
                </div>
                <div>
                  <span className="text-muted-foreground">예상 소요시간:</span>
                  <p className="font-medium flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {surveyData.estimatedTime || 0}분
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">상태:</span>
                  <Badge variant="outline" className="ml-1">
                    {currentStep === 'review' ? '검토 중' : '편집 중'}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* SEL 도움말 */}
          {showHelp && (
            <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
              <h4 className="font-medium mb-3 text-purple-800 flex items-center">
                <Brain className="w-4 h-4 mr-2" />
                SEL(사회정서학습)이란?
              </h4>
              <p className="text-sm text-purple-700 mb-4">
                학생들이 자신의 감정을 이해하고 관리하며, 타인과 건강한 관계를 맺고 
                책임감 있는 결정을 내리는 능력을 기르는 교육입니다.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(SEL_DOMAINS).map(([key, domain]) => {
                  const Icon = domain.icon;
                  return (
                    <div key={key} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-purple-100">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${domain.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-gray-900">{domain.name}</div>
                        <div className="text-xs text-gray-600">{domain.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}