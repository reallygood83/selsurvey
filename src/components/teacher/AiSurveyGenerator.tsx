'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  Settings, 
  Eye, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Brain,
  Target,
  Users,
  Heart,
  Lightbulb,
  Loader2,
  Wand2,
  FileText
} from 'lucide-react';
import { SELDomain } from '@/types';
import { selDomainDescriptions } from '@/data/selTemplates';

interface AiSurveyGeneratorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSurveyGenerated: (survey: any) => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  grade: '3-4' | '5-6';
  onGradeChange: (grade: '3-4' | '5-6') => void;
}

export default function AiSurveyGenerator({
  onSurveyGenerated,
  apiKey,
  onApiKeyChange,
  grade,
  onGradeChange
}: AiSurveyGeneratorProps) {
  const [step, setStep] = useState<'configure' | 'generating' | 'preview'>('configure');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [generatedSurvey, setGeneratedSurvey] = useState<any>(null);
  
  // 설문 설정
  const [prompt, setPrompt] = useState('');
  const [questionCount, setQuestionCount] = useState(12);
  const [difficulty, setDifficulty] = useState<'easy' | 'standard' | 'hard'>('standard');
  const [includeOpenQuestions, setIncludeOpenQuestions] = useState(true);
  const [focusAreas, setFocusAreas] = useState<SELDomain[]>([]);
  const [surveyType, setSurveyType] = useState('SEL');

  // SEL 영역 정보
  const selDomains = {
    selfAwareness: { name: '자기인식', icon: Brain, color: 'bg-blue-100 text-blue-700' },
    selfManagement: { name: '자기관리', icon: Target, color: 'bg-green-100 text-green-700' },
    socialAwareness: { name: '사회적 인식', icon: Users, color: 'bg-purple-100 text-purple-700' },
    relationshipSkills: { name: '관계 기술', icon: Heart, color: 'bg-pink-100 text-pink-700' },
    responsibleDecisionMaking: { name: '책임감 있는 의사결정', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-700' }
  };

  // 미리 정의된 프롬프트 예시
  const promptExamples = [
    {
      title: '학급 내 괴롭힘 예방',
      prompt: '학급 내 괴롭힘을 예방하고 친구 관계 개선을 위한 설문을 만들어주세요. 갈등 해결과 공감 능력에 중점을 두고 싶습니다.',
      focusAreas: ['socialAwareness', 'relationshipSkills'] as SELDomain[]
    },
    {
      title: '감정 조절 능력 측정',
      prompt: '학생들의 감정 조절 능력과 스트레스 관리 방법을 알아보는 설문을 제작해주세요. 화가 날 때의 대처법과 자기 진정 방법을 중점적으로 다루어주세요.',
      focusAreas: ['selfAwareness', 'selfManagement'] as SELDomain[]
    },
    {
      title: '협력과 팀워크',
      prompt: '협력 학습과 팀워크 향상을 위한 설문을 만들어주세요. 친구들과 함께 일할 때의 어려움과 해결 방법을 파악하고 싶습니다.',
      focusAreas: ['relationshipSkills', 'responsibleDecisionMaking'] as SELDomain[]
    },
    {
      title: '학습 동기와 목표 설정',
      prompt: '학생들의 학습 동기와 목표 설정 능력을 평가하는 설문을 제작해주세요. 자기주도학습과 인내력에 초점을 맞춰주세요.',
      focusAreas: ['selfManagement', 'responsibleDecisionMaking'] as SELDomain[]
    }
  ];

  // 진행률 시뮬레이션
  useEffect(() => {
    if (loading) {
      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);

      return () => clearInterval(timer);
    }
  }, [loading]);

  // AI 설문 생성
  const generateSurvey = async () => {
    if (!prompt.trim() || !apiKey.trim()) {
      alert('설문 주제와 API 키를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setStep('generating');
    setProgress(0);

    try {
      const response = await fetch('/api/ai/generate-survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          grade,
          apiKey,
          surveyType,
          questionCount,
          focusAreas,
          includeOpenQuestions,
          difficulty
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '설문 생성에 실패했습니다.');
      }

      setProgress(100);
      setGeneratedSurvey(data.survey);
      setStep('preview');
      
    } catch (error: unknown) {
      console.error('AI 설문 생성 오류:', error);
      alert(error instanceof Error ? error.message : '설문 생성 중 오류가 발생했습니다.');
      setStep('configure');
    } finally {
      setLoading(false);
    }
  };

  // 설문 사용하기
  const useSurvey = () => {
    if (generatedSurvey) {
      onSurveyGenerated(generatedSurvey);
    }
  };

  // SEL 영역 토글
  const toggleFocusArea = (domain: SELDomain) => {
    setFocusAreas(prev => 
      prev.includes(domain) 
        ? prev.filter(d => d !== domain)
        : [...prev, domain]
    );
  };

  // 예시 프롬프트 적용
  const applyExample = (example: typeof promptExamples[0]) => {
    setPrompt(example.prompt);
    setFocusAreas(example.focusAreas);
  };

  if (step === 'generating') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <Sparkles className="h-16 w-16 text-purple-500 animate-pulse" />
                <div className="absolute inset-0 animate-spin">
                  <Wand2 className="h-16 w-16 text-purple-300" />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">AI 설문 생성 중...</h3>
              <p className="text-muted-foreground mb-4">
                GEMINI AI가 {grade}학년에 맞는 전문적인 SEL 설문을 제작하고 있습니다.
              </p>
              <Progress value={progress} className="w-full max-w-md mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">
                {progress < 30 && '설문 주제 분석 중...'}
                {progress >= 30 && progress < 60 && 'SEL 영역별 질문 생성 중...'}
                {progress >= 60 && progress < 90 && '질문 품질 검증 중...'}
                {progress >= 90 && '최종 설문 구성 중...'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'preview' && generatedSurvey) {
    return (
      <div className="space-y-6">
        {/* 생성된 설문 정보 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>AI 설문 생성 완료</span>
              </CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setStep('configure')}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  다시 생성
                </Button>
                <Button onClick={useSurvey}>
                  <Eye className="h-4 w-4 mr-2" />
                  설문 사용하기
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{generatedSurvey.questions?.length || 0}</div>
                <div className="text-sm text-blue-700">생성된 질문 수</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{generatedSurvey.estimatedTime || 0}분</div>
                <div className="text-sm text-green-700">예상 소요 시간</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{grade}</div>
                <div className="text-sm text-purple-700">대상 학년</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">{generatedSurvey.title}</h4>
              <p className="text-muted-foreground">{generatedSurvey.description}</p>
              
              {generatedSurvey.focusAreas && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {generatedSurvey.focusAreas.map((area: SELDomain) => {
                    const domainInfo = selDomains[area];
                    const Icon = domainInfo?.icon;
                    return (
                      <Badge key={area} className={domainInfo?.color}>
                        {Icon && <Icon className="w-3 h-3 mr-1" />}
                        {domainInfo?.name}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 질문 미리보기 */}
        <Card>
          <CardHeader>
            <CardTitle>생성된 질문 미리보기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {generatedSurvey.questions?.map((question: Record<string, unknown>, index: number) => {
                const domainInfo = selDomains[question.selDomain as keyof typeof selDomains];
                const Icon = domainInfo?.icon;
                
                return (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">Q{index + 1}</span>
                      <Badge variant="outline" className="flex items-center space-x-1">
                        {Icon && <Icon className="w-3 h-3" />}
                        <span>{domainInfo?.name}</span>
                      </Badge>
                    </div>
                    <p className="font-medium mb-2">{question.question}</p>
                    
                    {question.type === 'scale' && (
                      <div className="text-sm text-muted-foreground">
                        📊 5점 척도 (1=전혀 그렇지 않다 ~ 5=매우 그렇다)
                      </div>
                    )}
                    
                    {question.type === 'multipleChoice' && question.options && (
                      <div className="text-sm text-muted-foreground">
                        <div>📋 객관식 ({question.options.length}개 선택지)</div>
                        <ul className="list-disc list-inside mt-1">
                          {question.options.slice(0, 3).map((option: string, i: number) => (
                            <li key={i}>{option}</li>
                          ))}
                          {question.options.length > 3 && <li>...</li>}
                        </ul>
                      </div>
                    )}
                    
                    {question.type === 'emotion' && (
                      <div className="text-sm text-muted-foreground">
                        😊 감정 선택 (이모지 기반)
                      </div>
                    )}
                    
                    {question.type === 'text' && (
                      <div className="text-sm text-muted-foreground">
                        ✍️ 주관식 서술
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* API 키 입력 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>AI 설정</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="api-key">GEMINI API 키</Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder="AIza..."
              className="font-mono"
            />
            {!apiKey && (
              <Alert className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>API 키가 필요합니다!</strong> Google AI Studio에서 무료로 발급받으세요: 
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline ml-1"
                  >
                    여기서 발급받기
                  </a>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div>
            <Label>대상 학년</Label>
            <Select value={grade} onValueChange={onGradeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3-4">3-4학년</SelectItem>
                <SelectItem value="5-6">5-6학년</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 빠른 시작 - 예시 프롬프트 */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 시작 - 예시 주제</CardTitle>
          <p className="text-sm text-muted-foreground">
            자주 사용되는 설문 주제로 빠르게 시작해보세요
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promptExamples.map((example, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => applyExample(example)}
              >
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">{example.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {example.prompt.slice(0, 80)}...
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {example.focusAreas.map(area => {
                      const domainInfo = selDomains[area];
                      const Icon = domainInfo?.icon;
                      return (
                        <Badge key={area} variant="secondary" className="text-xs">
                          {Icon && <Icon className="w-3 h-3 mr-1" />}
                          {domainInfo?.name}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 맞춤 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5" />
            <span>맞춤 AI 설문 생성</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 설문 주제 */}
          <div>
            <Label htmlFor="prompt">설문 주제 및 요청사항</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="예: 학급 내 친구 관계 개선을 위한 설문을 만들어주세요. 갈등 해결과 공감 능력에 중점을 둔 문항들을 포함해주세요."
              rows={4}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              구체적인 상황이나 측정하고 싶은 영역을 설명하면 더 정확한 설문이 생성됩니다
            </p>
          </div>

          {/* 고급 설정 */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>질문 수</Label>
                <Select value={questionCount.toString()} onValueChange={(v) => setQuestionCount(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8">8개 (간단)</SelectItem>
                    <SelectItem value="12">12개 (표준)</SelectItem>
                    <SelectItem value="16">16개 (상세)</SelectItem>
                    <SelectItem value="20">20개 (종합)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>난이도</Label>
                <Select value={difficulty} onValueChange={(v: 'easy' | 'standard' | 'hard') => setDifficulty(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">쉬움 (기본적인 질문)</SelectItem>
                    <SelectItem value="standard">표준 (일반적인 질문)</SelectItem>
                    <SelectItem value="hard">어려움 (심화 질문)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 중점 SEL 영역 */}
            <div>
              <Label>중점 SEL 영역 (선택사항)</Label>
              <p className="text-xs text-muted-foreground mb-3">
                특별히 강조하고 싶은 영역을 선택하세요. 선택하지 않으면 모든 영역을 균등하게 다룹니다.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(selDomains).map(([key, domain]) => {
                  const Icon = domain.icon;
                  const isSelected = focusAreas.includes(key as SELDomain);
                  
                  return (
                    <div 
                      key={key}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleFocusArea(key as SELDomain)}
                    >
                      <Checkbox 
                        checked={isSelected}
                        onChange={() => toggleFocusArea(key as SELDomain)}
                      />
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">{domain.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {selDomainDescriptions[key as keyof typeof selDomainDescriptions]?.description.slice(0, 30)}...
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 추가 옵션 */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="open-questions"
                checked={includeOpenQuestions}
                onCheckedChange={setIncludeOpenQuestions}
              />
              <Label htmlFor="open-questions" className="text-sm">
                주관식 질문 포함 (깊이 있는 자기성찰용)
              </Label>
            </div>
          </div>

          {/* 생성 버튼 */}
          <Separator />
          <Button 
            onClick={generateSurvey} 
            disabled={!prompt.trim() || !apiKey.trim() || loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                AI 설문 생성 중...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                AI 설문 생성하기
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}