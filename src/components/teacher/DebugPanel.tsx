// 디버깅 및 시스템 상태 모니터링 패널
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bug, 
  Database, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Code, 
  Zap,
  FileText,
  Clock,
  Users
} from 'lucide-react';
import { SurveyResponse, StudentProfile, SELAnalysis } from '@/types';

interface DebugPanelProps {
  student?: StudentProfile | null;
  responses?: SurveyResponse[];
  analyses?: SELAnalysis[];
  className?: string;
}

interface SystemHealth {
  questionMatching: 'good' | 'warning' | 'error';
  dataIntegrity: 'good' | 'warning' | 'error';
  apiConnectivity: 'good' | 'warning' | 'error';
  performance: 'good' | 'warning' | 'error';
}

export default function DebugPanel({ 
  student, 
  responses = [], 
  analyses = [],
  className = '' 
}: DebugPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    questionMatching: 'good',
    dataIntegrity: 'good', 
    apiConnectivity: 'good',
    performance: 'good'
  });

  // 📊 데이터 품질 분석
  const analyzeDataQuality = () => {
    const analysis = {
      totalResponses: responses.length,
      responsesWithoutQuestions: 0,
      averageResponseTime: 0,
      missingFields: [] as string[],
      duplicateResponses: 0,
      recentActivity: responses.filter(r => 
        new Date().getTime() - new Date(r.submittedAt).getTime() < 7 * 24 * 60 * 60 * 1000
      ).length
    };

    // 질문 매칭 검사
    responses.forEach(response => {
      response.responses.forEach(resp => {
        if (!resp.questionId) {
          analysis.responsesWithoutQuestions++;
        }
      });
    });

    // 누락 필드 검사
    if (!student?.name) analysis.missingFields.push('student.name');
    if (!student?.grade) analysis.missingFields.push('student.grade');
    if (responses.length === 0) analysis.missingFields.push('responses');

    return analysis;
  };

  const dataQuality = analyzeDataQuality();

  // 🔍 시스템 상태 확인
  const checkSystemHealth = async () => {
    try {
      // API 연결성 테스트
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      setSystemHealth(prev => ({
        ...prev,
        apiConnectivity: response.ok ? 'good' : 'error',
        questionMatching: dataQuality.responsesWithoutQuestions > 0 ? 'warning' : 'good',
        dataIntegrity: dataQuality.missingFields.length > 0 ? 'warning' : 'good',
        performance: responses.length > 100 ? 'warning' : 'good'
      }));
    } catch (error) {
      setSystemHealth(prev => ({
        ...prev,
        apiConnectivity: 'error'
      }));
    }
  };

  const getStatusIcon = (status: 'good' | 'warning' | 'error') => {
    switch (status) {
      case 'good': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: 'good' | 'warning' | 'error') => {
    const variants = {
      good: 'default',
      warning: 'secondary', 
      error: 'destructive'
    } as const;
    
    const labels = {
      good: '정상',
      warning: '주의',
      error: '오류'
    };

    return (
      <Badge variant={variants[status]} className="text-xs">
        {labels[status]}
      </Badge>
    );
  };

  if (!expanded) {
    return (
      <Card className={`border-dashed border-2 border-gray-300 ${className}`}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bug className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-600">시스템 디버깅 패널</span>
              <Badge variant="outline" className="text-xs">
                개발자 도구
              </Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setExpanded(true)}
            >
              <Code className="w-4 h-4 mr-1" />
              열기
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 border-yellow-200 bg-yellow-50 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-yellow-900">
            <Bug className="w-5 h-5 mr-2" />
            시스템 디버깅 & 모니터링 패널
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={checkSystemHealth}
            >
              <Activity className="w-4 h-4 mr-1" />
              상태 확인
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setExpanded(false)}
            >
              닫기
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="health" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="health">시스템 상태</TabsTrigger>
            <TabsTrigger value="data">데이터 품질</TabsTrigger>
            <TabsTrigger value="performance">성능 지표</TabsTrigger>
            <TabsTrigger value="logs">로그 & 이벤트</TabsTrigger>
          </TabsList>

          {/* 시스템 상태 탭 */}
          <TabsContent value="health" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">질문 매칭</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(systemHealth.questionMatching)}
                    {getStatusBadge(systemHealth.questionMatching)}
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">데이터 무결성</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(systemHealth.dataIntegrity)}
                    {getStatusBadge(systemHealth.dataIntegrity)}
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API 연결성</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(systemHealth.apiConnectivity)}
                    {getStatusBadge(systemHealth.apiConnectivity)}
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">성능</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(systemHealth.performance)}
                    {getStatusBadge(systemHealth.performance)}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 데이터 품질 탭 */}
          <TabsContent value="data" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <div className="text-xs text-blue-600 font-medium">총 응답 수</div>
                <div className="text-lg font-bold text-blue-900">{dataQuality.totalResponses}</div>
              </div>
              
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <div className="text-xs text-green-600 font-medium">최근 7일 활동</div>
                <div className="text-lg font-bold text-green-900">{dataQuality.recentActivity}</div>
              </div>
              
              <div className="bg-orange-50 p-3 rounded border border-orange-200">
                <div className="text-xs text-orange-600 font-medium">매칭 실패</div>
                <div className="text-lg font-bold text-orange-900">{dataQuality.responsesWithoutQuestions}</div>
              </div>
            </div>

            {dataQuality.missingFields.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>누락된 필드:</strong> {dataQuality.missingFields.join(', ')}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* 성능 지표 탭 */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 p-3 rounded border border-purple-200">
                <div className="text-xs text-purple-600 font-medium">분석 결과 수</div>
                <div className="text-lg font-bold text-purple-900">{analyses.length}</div>
              </div>
              
              <div className="bg-indigo-50 p-3 rounded border border-indigo-200">
                <div className="text-xs text-indigo-600 font-medium">참여율</div>
                <div className="text-lg font-bold text-indigo-900">{student?.participationRate || 0}%</div>
              </div>
            </div>
            
            <Alert className="bg-blue-50 border-blue-200">
              <Zap className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>성능 팁:</strong> 100개 이상의 응답이 있을 때는 페이지네이션 사용을 권장합니다.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* 로그 & 이벤트 탭 */}
          <TabsContent value="logs" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">마지막 업데이트:</span>
                <span className="font-mono">{new Date().toLocaleString('ko-KR')}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">선택된 학생:</span>
                <span className="font-medium">{student?.name || '없음'}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <Database className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">로드된 데이터:</span>
                <span className="font-mono">응답 {responses.length}개, 분석 {analyses.length}개</span>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded border">
              <div className="text-xs font-medium text-gray-600 mb-2">디버그 정보 (JSON)</div>
              <pre className="text-xs font-mono text-gray-800 overflow-x-auto">
{JSON.stringify({
  student: student ? {
    id: student.id,
    name: student.name,
    grade: student.grade,
    totalResponses: student.totalResponses
  } : null,
  dataQuality,
  systemHealth
}, null, 2)}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}