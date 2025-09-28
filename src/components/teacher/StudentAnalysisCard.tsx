'use client';

import { useState } from 'react';
import { StudentProfile, SELAnalysis } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  TrendingUp, 
  Calendar, 
  BarChart3, 
  MessageSquare, 
  Target,
  Brain,
  Heart,
  Users,
  CheckCircle,
  Lightbulb
} from 'lucide-react';

interface StudentAnalysisCardProps {
  student: StudentProfile;
  onViewDetails: (studentId: string) => void;
}

export function StudentAnalysisCard({ student, onViewDetails }: StudentAnalysisCardProps) {
  // SEL 영역별 아이콘 매핑
  const selIcons = {
    selfAwareness: Brain,
    selfManagement: CheckCircle,
    socialAwareness: Users,
    relationshipSkills: Heart,
    responsibleDecisionMaking: Lightbulb
  };

  // SEL 영역별 한국어 이름
  const selNames = {
    selfAwareness: '자기인식',
    selfManagement: '자기관리',
    socialAwareness: '사회적 인식',
    relationshipSkills: '관계 기술',
    responsibleDecisionMaking: '책임감 있는 의사결정'
  };

  // 점수에 따른 색상 결정
  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  // 참여율에 따른 상태 뱃지
  const getParticipationBadge = (rate: number) => {
    if (rate >= 80) {
      return <Badge className="bg-green-100 text-green-800">우수</Badge>;
    } else if (rate >= 60) {
      return <Badge className="bg-yellow-100 text-yellow-800">보통</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">관심필요</Badge>;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{student.name}</CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>참여일: {student.joinedAt.toLocaleDateString()}</span>
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            {getParticipationBadge(student.participationRate)}
            <p className="text-sm text-muted-foreground mt-1">
              참여율 {student.participationRate}%
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 활동 통계 */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{student.totalResponses}</div>
            <div className="text-xs text-muted-foreground">총 응답</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {student.analysisHistory?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground">분석 횟수</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {student.lastResponseDate ? 
                Math.floor((new Date().getTime() - new Date(student.lastResponseDate).getTime()) / (1000 * 60 * 60 * 24))
                : '-'
              }
            </div>
            <div className="text-xs text-muted-foreground">일 전 응답</div>
          </div>
        </div>

        <Separator />

        {/* 최근 SEL 분석 결과 */}
        {student.recentAnalysis ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">최근 SEL 분석</span>
              <Badge variant="outline" className="text-xs">
                {student.recentAnalysis.analysisDate.toLocaleDateString()}
              </Badge>
            </div>

            {/* SEL 점수 미니 차트 */}
            <div className="space-y-2">
              {Object.entries(student.recentAnalysis.scores).map(([domain, score]) => {
                const IconComponent = selIcons[domain as keyof typeof selIcons];
                return (
                  <div key={domain} className="flex items-center space-x-3">
                    <div className="w-8 flex justify-center">
                      <IconComponent className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">
                          {selNames[domain as keyof typeof selNames]}
                        </span>
                        <span className={`text-xs font-medium ${getScoreColor(score)}`}>
                          {score}/5
                        </span>
                      </div>
                      <Progress value={score * 20} className="h-1" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 주요 관찰사항 */}
            {student.recentAnalysis.observations && (
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">주요 관찰사항</p>
                    <p className="text-sm line-clamp-2">{student.recentAnalysis.observations}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 강점과 성장영역 */}
            <div className="grid grid-cols-2 gap-3">
              {student.recentAnalysis.strengths.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-green-600">강점</p>
                  <div className="space-y-1">
                    {student.recentAnalysis.strengths.slice(0, 2).map((strength, index) => (
                      <Badge key={index} variant="outline" className="text-xs text-green-700 border-green-200">
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {student.recentAnalysis.growthAreas.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-orange-600">성장영역</p>
                  <div className="space-y-1">
                    {student.recentAnalysis.growthAreas.slice(0, 2).map((area, index) => (
                      <Badge key={index} variant="outline" className="text-xs text-orange-700 border-orange-200">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">아직 분석 결과가 없습니다</p>
            <p className="text-xs text-muted-foreground">학생이 설문에 참여하면 AI 분석이 시작됩니다</p>
          </div>
        )}

        <Separator />

        {/* 액션 버튼 */}
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onViewDetails(student.id)}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            상세 분석
          </Button>
          {student.recentAnalysis && (
            <Button variant="outline" size="sm">
              <Target className="w-4 h-4 mr-2" />
              지원 계획
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}