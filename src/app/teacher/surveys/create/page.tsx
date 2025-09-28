'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { surveyService } from '@/lib/firestore';
import { Survey, SurveyQuestion, SurveyOption, SELDomain } from '@/types';
import { selTemplates, SELTemplate } from '@/data/selTemplates';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  ClipboardList,
  AlertCircle,
  Brain,
  Heart,
  Users,
  Lightbulb,
  Target,
  Sparkles,
  FileText,
  Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AiSurveyGenerator from '@/components/teacher/AiSurveyGenerator';
import { SurveyCreationGuide } from '@/components/teacher/SurveyCreationGuide';
import { TeacherTooltip, SELDomainTooltip, QuestionTypeTooltip, SurveyTooltip } from '@/components/teacher/TeacherTooltip';
import SurveyValidator from '@/components/teacher/SurveyValidator';

export default function CreateSurveyPage() {
  const { currentUser, userProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'template' | 'ai' | 'custom'>('template');
  const [aiGrade, setAiGrade] = useState<'3-4' | '5-6'>('3-4');
  const [userApiKey, setUserApiKey] = useState('');
  
  // 가이드 시스템 상태
  const [currentStep, setCurrentStep] = useState<'method' | 'template' | 'ai' | 'custom' | 'review'>('method');
  
  const [survey, setSurvey] = useState<Partial<Survey>>({
    title: '',
    description: '',
    type: 'custom',
    questions: [],
    isActive: false,
    classCode: userProfile?.schoolInfo?.classCode || ''
  });

  // SEL 영역 매핑
  const selDomains = {
    selfAwareness: { name: '자기인식', icon: Brain, color: 'bg-blue-100 text-blue-700' },
    selfManagement: { name: '자기관리', icon: Target, color: 'bg-green-100 text-green-700' },
    socialAwareness: { name: '사회적 인식', icon: Users, color: 'bg-purple-100 text-purple-700' },
    relationshipSkills: { name: '관계 기술', icon: Heart, color: 'bg-pink-100 text-pink-700' },
    responsibleDecisionMaking: { name: '책임감 있는 의사결정', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-700' }
  };

  // 질문 유형
  const questionTypes = {
    scale: '척도 (1-5점)',
    choice: '객관식',
    text: '주관식',
    emotion: '감정 선택'
  };

  const addQuestion = () => {
    const newQuestion: SurveyQuestion = {
      id: Date.now().toString(),
      type: 'scale',
      domain: 'selfAwareness',
      question: '',
      grade: [1, 2, 3, 4, 5, 6],
      options: [],
      isRequired: true,
      order: (survey.questions?.length || 0) + 1
    };

    setSurvey(prev => ({
      ...prev,
      questions: [...(prev.questions || []), newQuestion]
    }));
  };

  const updateQuestion = (questionId: string, updates: Partial<SurveyQuestion>) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions?.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      ) || []
    }));
  };

  const removeQuestion = (questionId: string) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions?.filter(q => q.id !== questionId) || []
    }));
  };

  const addOption = (questionId: string) => {
    updateQuestion(questionId, {
      options: [
        ...((survey.questions?.find(q => q.id === questionId)?.options) || []),
        { id: Date.now().toString(), text: '', value: 1 }
      ]
    });
  };

  const updateOption = (questionId: string, optionId: string, text: string) => {
    const question = survey.questions?.find(q => q.id === questionId);
    if (question) {
      const updatedOptions = question.options?.map((opt, index) => 
        opt.id === optionId ? { ...opt, text, value: index + 1 } : opt
      ) || [];
      updateQuestion(questionId, { options: updatedOptions });
    }
  };

  const removeOption = (questionId: string, optionId: string) => {
    const question = survey.questions?.find(q => q.id === questionId);
    if (question) {
      const updatedOptions = question.options?.filter(opt => opt.id !== optionId) || [];
      updateQuestion(questionId, { options: updatedOptions });
    }
  };

  const saveSurvey = async (publish: boolean = false) => {
    if (!survey.title || !survey.questions?.length) {
      alert('제목과 최소 1개의 질문이 필요합니다.');
      return;
    }

    if (!currentUser?.uid || !userProfile?.schoolInfo?.classCode) {
      alert('교사 정보 또는 반 정보가 없습니다. 로그인을 다시 확인해주세요.');
      return;
    }

    // 배포하기 전에 review 단계로 이동
    if (publish) {
      setCurrentStep('review');
    }

    setLoading(true);
    try {
      const surveyData: Omit<Survey, 'id'> = {
        ...survey as Survey,
        teacherId: currentUser.uid,
        classCode: userProfile.schoolInfo.classCode,
        isActive: publish,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await surveyService.createSurvey(surveyData);
      
      if (publish) {
        alert('설문이 성공적으로 배포되었습니다!');
      } else {
        alert('설문이 임시저장되었습니다.');
      }
      
      router.push('/teacher/dashboard');
    } catch (error) {
      console.error('설문 저장 오류:', error);
      alert('설문 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 탭 변경 시 스텝 업데이트
  const handleTabChange = (tab: 'template' | 'ai' | 'custom') => {
    setSelectedTab(tab);
    setCurrentStep(tab);
  };

  // 템플릿 로드 함수
  const loadTemplate = (template: SELTemplate) => {
    const convertedQuestions: SurveyQuestion[] = template.questions.map((q, index) => ({
      id: q.id,
      type: q.type === 'multipleChoice' ? 'choice' : q.type as SurveyQuestion['type'],
      domain: q.selDomain,
      question: q.question,
      grade: [1, 2, 3, 4, 5, 6],
      options: q.options?.map((opt, optIndex) => ({ 
        id: `${q.id}_opt_${optIndex}`, 
        text: opt, 
        value: optIndex + 1 
      })) || [],
      isRequired: q.required,
      order: index + 1
    }));

    setSurvey({
      title: template.title,
      description: template.description,
      type: 'template',
      questions: convertedQuestions,
      isActive: false,
      classCode: userProfile?.schoolInfo?.classCode || '',
      grade: template.grade === '3-4' ? [3, 4] : [5, 6]
    });
    setSelectedTab('custom');
    setCurrentStep('custom');
  };

  // 사용자 설정에서 API 키 로드
  useEffect(() => {
    const loadUserApiKey = async () => {
      try {
        // 사용자 프로필에서 API 키 가져오기 (실제로는 설정 페이지에서 관리)
        const storedKey = localStorage.getItem('gemini-api-key');
        if (storedKey) {
          setUserApiKey(storedKey);
        }
      } catch (error) {
        console.error('API 키 로드 오류:', error);
      }
    };
    
    if (currentUser) {
      loadUserApiKey();
    }
  }, [currentUser]);

  if (!currentUser || userProfile?.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">접근 권한이 없습니다</h2>
              <p className="text-muted-foreground">교사만 접근할 수 있는 페이지입니다.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="bg-background border-b">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <Link href="/teacher/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  대시보드로
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold">새 설문 만들기</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  학생들의 SEL 발달을 위한 맞춤형 설문을 제작하세요
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => saveSurvey(false)} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                임시저장
              </Button>
              <Button onClick={() => saveSurvey(true)} disabled={loading}>
                <Send className="h-4 w-4 mr-2" />
                배포하기
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* 설문 생성 가이드 */}
        <SurveyCreationGuide 
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          surveyData={{
            title: survey.title,
            questionCount: survey.questions?.length || 0,
            estimatedTime: Math.max(5, Math.ceil((survey.questions?.length || 0) * 1.5))
          }}
        />

        {/* 설문 생성 방식 선택 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>설문 생성 방식</CardTitle>
            <p className="text-sm text-muted-foreground">
              SEL 템플릿, AI 자동 생성, 또는 직접 제작 중 선택하세요
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 템플릿 사용 */}
              <Card className={`cursor-pointer transition-all ${selectedTab === 'template' ? 'ring-2 ring-primary' : ''}`} 
                    onClick={() => handleTabChange('template')}>
                <CardContent className="p-6 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-3 text-blue-500" />
                  <h3 className="font-semibold mb-2">SEL 템플릿</h3>
                  <p className="text-sm text-muted-foreground">
                    학년별 검증된 SEL 설문 템플릿 사용
                  </p>
                </CardContent>
              </Card>

              {/* AI 생성 */}
              <Card className={`cursor-pointer transition-all ${selectedTab === 'ai' ? 'ring-2 ring-primary' : ''}`} 
                    onClick={() => handleTabChange('ai')}>
                <CardContent className="p-6 text-center">
                  <Sparkles className="h-8 w-8 mx-auto mb-3 text-purple-500" />
                  <h3 className="font-semibold mb-2">AI 자동 생성</h3>
                  <p className="text-sm text-muted-foreground">
                    GEMINI AI로 맞춤형 설문 자동 생성
                  </p>
                </CardContent>
              </Card>

              {/* 직접 제작 */}
              <Card className={`cursor-pointer transition-all ${selectedTab === 'custom' ? 'ring-2 ring-primary' : ''}`} 
                    onClick={() => handleTabChange('custom')}>
                <CardContent className="p-6 text-center">
                  <Plus className="h-8 w-8 mx-auto mb-3 text-green-500" />
                  <h3 className="font-semibold mb-2">직접 제작</h3>
                  <p className="text-sm text-muted-foreground">
                    처음부터 직접 설문 문항 작성
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* 템플릿 선택 화면 */}
        {selectedTab === 'template' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>SEL 템플릿 선택</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                학년에 맞는 검증된 사회정서학습 설문 템플릿을 선택하세요
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {selTemplates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => loadTemplate(template)}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{template.title}</h3>
                        <p className="text-muted-foreground mt-1">{template.description}</p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Badge variant="secondary">{template.grade}학년</Badge>
                        <Badge variant="outline" className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{template.estimatedTime}분</span>
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {template.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      총 {template.questions.length}개 문항 포함
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {/* AI 생성 화면 */}
        {selectedTab === 'ai' && (
          <AiSurveyGenerator
            onSurveyGenerated={(generatedSurvey: { 
              questions: Array<{ 
                id: string; 
                type: 'scale' | 'emotion' | 'multipleChoice' | 'text'; 
                selDomain: string; 
                question: string; 
                options?: string[]; 
                required: boolean; 
              }>; 
              title: string; 
              description: string;
              grade: string;
            }) => {
              const convertedQuestions: SurveyQuestion[] = generatedSurvey.questions.map((q, index: number) => ({
                id: q.id,
                type: q.type === 'multipleChoice' ? 'choice' : q.type as 'emotion' | 'scale' | 'choice' | 'text',
                domain: q.selDomain as SELDomain,
                question: q.question,
                grade: [1, 2, 3, 4, 5, 6],
                options: q.options?.map((opt: string, optIndex: number) => ({ 
                  id: `${q.id}_opt_${optIndex}`, 
                  text: opt, 
                  value: optIndex + 1 
                })) || [],
                isRequired: q.required,
                order: index + 1
              }));

              setSurvey({
                title: generatedSurvey.title,
                description: generatedSurvey.description,
                type: 'ai-generated',
                questions: convertedQuestions,
                isActive: false,
                classCode: userProfile?.schoolInfo?.classCode || '',
                grade: generatedSurvey.grade === '3-4' ? [3, 4] : [5, 6]
              });

              setSelectedTab('custom');
              setCurrentStep('custom');
              alert('AI 설문이 성공적으로 생성되었습니다! 이제 필요에 따라 수정하실 수 있습니다.');
            }}
            apiKey={userApiKey}
            onApiKeyChange={(key: string) => {
              setUserApiKey(key);
              if (key.trim()) {
                localStorage.setItem('gemini-api-key', key);
              } else {
                localStorage.removeItem('gemini-api-key');
              }
            }}
            grade={aiGrade}
            onGradeChange={setAiGrade}
          />
        )}

        {/* 설문 편집 화면 (템플릿 로드 후 또는 직접 제작) */}
        {selectedTab === 'custom' && (
          <>
            {/* 기본 정보 */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ClipboardList className="h-5 w-5" />
                  <span>설문 기본 정보</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Label htmlFor="title">설문 제목 *</Label>
                    <SurveyTooltip type="title">
                      <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                        <AlertCircle className="h-3 w-3" />
                      </Button>
                    </SurveyTooltip>
                  </div>
                  <Input
                    id="title"
                    value={survey.title}
                    onChange={(e) => setSurvey(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="예: 2학기 학급 분위기 조사"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Label htmlFor="description">설문 설명</Label>
                    <SurveyTooltip type="description">
                      <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                        <AlertCircle className="h-3 w-3" />
                      </Button>
                    </SurveyTooltip>
                  </div>
                  <Textarea
                    id="description"
                    value={survey.description}
                    onChange={(e) => setSurvey(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="학생들에게 설문의 목적과 소요시간을 안내해주세요"
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Label>설문 유형</Label>
                    <TeacherTooltip 
                      content="일일: 매일 체크용 짧은 설문, 주간: 일주일 단위 평가, 월간: 한 달 단위 심화 분석"
                      type="info"
                    >
                      <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                        <AlertCircle className="h-3 w-3" />
                      </Button>
                    </TeacherTooltip>
                  </div>
                  <Select 
                    value={survey.type} 
                    onValueChange={(value) => setSurvey(prev => ({ ...prev, type: value as Survey['type'] }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">일일 체크</SelectItem>
                      <SelectItem value="weekly">주간 설문</SelectItem>
                      <SelectItem value="monthly">월간 설문</SelectItem>
                      <SelectItem value="custom">맞춤 설문</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* 질문 목록 */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>질문 구성 ({survey.questions?.length || 0}개)</CardTitle>
                  <Button onClick={addQuestion} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    질문 추가
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {survey.questions?.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium">질문이 없습니다</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      첫 번째 질문을 추가해보세요
                    </p>
                    <Button onClick={addQuestion} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      질문 추가
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {survey.questions?.map((question, index) => {
                      const domainInfo = selDomains[question.domain as keyof typeof selDomains];
                      const DomainIcon = domainInfo?.icon || Brain;
                      
                      return (
                        <div key={question.id} className="border rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg font-bold text-muted-foreground">
                                Q{index + 1}
                              </span>
                              <Badge className={domainInfo?.color}>
                                <DomainIcon className="w-3 h-3 mr-1" />
                                {domainInfo?.name}
                              </Badge>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeQuestion(question.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="space-y-4">
                            {/* 질문 텍스트 */}
                            <div>
                              <Label>질문 내용</Label>
                              <Textarea
                                value={question.question}
                                onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                                placeholder="학생들에게 물어보고 싶은 질문을 입력하세요"
                                className="mt-1"
                                rows={2}
                              />
                            </div>

                            {/* 질문 유형과 SEL 영역 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-center space-x-2 mb-2">
                                  <Label>질문 유형</Label>
                                  <QuestionTypeTooltip type={question.type as keyof typeof questionTypes}>
                                    <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                                      <AlertCircle className="h-3 w-3" />
                                    </Button>
                                  </QuestionTypeTooltip>
                                </div>
                                <Select 
                                  value={question.type} 
                                  onValueChange={(value) => updateQuestion(question.id, { type: value as SurveyQuestion['type'] })}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(questionTypes).map(([key, label]) => (
                                      <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <div className="flex items-center space-x-2 mb-2">
                                  <Label>SEL 영역</Label>
                                  <SELDomainTooltip domain={question.domain as keyof typeof selDomains}>
                                    <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                                      <AlertCircle className="h-3 w-3" />
                                    </Button>
                                  </SELDomainTooltip>
                                </div>
                                <Select 
                                  value={question.domain} 
                                  onValueChange={(value) => updateQuestion(question.id, { domain: value as SELDomain })}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(selDomains).map(([key, domain]) => {
                                      const Icon = domain.icon;
                                      return (
                                        <SelectItem key={key} value={key}>
                                          <div className="flex items-center space-x-2">
                                            <Icon className="w-4 h-4" />
                                            <span>{domain.name}</span>
                                          </div>
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* 객관식 옵션 */}
                            {question.type === 'choice' && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <Label>선택지</Label>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => addOption(question.id)}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    옵션 추가
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {question.options?.map((option, optionIndex) => (
                                    <div key={option.id} className="flex items-center space-x-2">
                                      <span className="text-sm text-muted-foreground w-6">
                                        {optionIndex + 1}.
                                      </span>
                                      <Input
                                        value={option.text}
                                        onChange={(e) => updateOption(question.id, option.id, e.target.value)}
                                        placeholder={`선택지 ${optionIndex + 1}`}
                                        className="flex-1"
                                      />
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => removeOption(question.id, option.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 척도 안내 */}
                            {question.type === 'scale' && (
                              <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-sm text-muted-foreground">
                                  📊 1점(전혀 그렇지 않다) ~ 5점(매우 그렇다)의 척도로 응답받습니다
                                </p>
                              </div>
                            )}

                            {/* 감정 선택 안내 */}
                            {question.type === 'emotion' && (
                              <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-sm text-muted-foreground">
                                  😊 기쁨, 😢 슬픔, 😠 화남, 😰 불안, 😐 평온 등의 감정으로 응답받습니다
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 설문 미리보기 */}
            {survey.questions && survey.questions.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>설문 미리보기</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-4 border-b">
                      <h3 className="text-xl font-bold">{survey.title || '설문 제목'}</h3>
                      {survey.description && (
                        <p className="text-sm text-muted-foreground mt-2">{survey.description}</p>
                      )}
                    </div>

                    {survey.questions.map((question, index) => (
                      <div key={question.id} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Q{index + 1}.</span>
                          <span>{question.question || '질문 내용을 입력하세요'}</span>
                          {question.isRequired && <span className="text-red-500">*</span>}
                        </div>
                        
                        {question.type === 'scale' && (
                          <div className="flex space-x-2 ml-6">
                            {[1, 2, 3, 4, 5].map(num => (
                              <div key={num} className="w-8 h-8 border rounded-full flex items-center justify-center text-sm">
                                {num}
                              </div>
                            ))}
                          </div>
                        )}

                        {question.type === 'choice' && (
                          <div className="ml-6 space-y-1">
                            {question.options?.map((option, optIndex) => (
                              <div key={option.id} className="flex items-center space-x-2">
                                <div className="w-4 h-4 border rounded"></div>
                                <span className="text-sm">{option.text || `선택지 ${optIndex + 1}`}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {question.type === 'text' && (
                          <div className="ml-6">
                            <div className="w-full h-20 border rounded-lg bg-muted/50"></div>
                          </div>
                        )}

                        {question.type === 'emotion' && (
                          <div className="flex space-x-2 ml-6">
                            {['😊', '😢', '😠', '😰', '😐'].map(emoji => (
                              <div key={emoji} className="w-10 h-10 border rounded-lg flex items-center justify-center text-lg">
                                {emoji}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI 설문 품질 검증 */}
            {survey.questions && survey.questions.length > 0 && survey.title && userApiKey && (
              <SurveyValidator
                survey={survey}
                apiKey={userApiKey}
                onValidationComplete={(result) => {
                  console.log('설문 검증 결과:', result);
                }}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}