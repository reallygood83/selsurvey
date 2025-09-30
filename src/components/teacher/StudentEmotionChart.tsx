'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Heart, TrendingUp, Calendar, User } from 'lucide-react';
import { moodService, studentService } from '@/lib/firestore';
import { DailyMood, StudentProfile } from '@/types';
import { format, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';

interface StudentEmotionChartProps {
  classCode: string;
}

export function StudentEmotionChart({ classCode }: StudentEmotionChartProps) {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [studentMoods, setStudentMoods] = useState<DailyMood[]>([]);
  const [loading, setLoading] = useState(true);
  const [moodLoading, setMoodLoading] = useState(false);
  const [dateRange, setDateRange] = useState(7); // 기본 7일

  useEffect(() => {
    loadStudents();
  }, [classCode]);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentMoods(selectedStudent);
    }
  }, [selectedStudent, dateRange]);

  const loadStudents = async () => {
    if (!classCode) return;

    setLoading(true);
    try {
      const studentsData = await studentService.getStudentsByClass(classCode);
      setStudents(studentsData);
      
      // 첫 번째 학생을 기본 선택
      if (studentsData.length > 0) {
        setSelectedStudent(studentsData[0].id);
      }
    } catch (error) {
      console.error('학생 목록 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentMoods = async (studentId: string) => {
    setMoodLoading(true);
    try {
      // 학생 프로필에서 userId를 찾아서 무드 조회
      const student = students.find(s => s.id === studentId);
      if (!student) {
        console.error('학생을 찾을 수 없습니다:', studentId);
        setStudentMoods([]);
        return;
      }
      
      console.log('📊 [StudentEmotionChart] 학생 감정 데이터 로드:', {
        studentId: student.id,
        userId: student.userId,
        studentName: student.name
      });
      
      const moods = await moodService.getStudentMoods(student.userId, dateRange);
      setStudentMoods(moods);
    } catch (error) {
      console.error('학생 감정 데이터 로드 오류:', error);
      setStudentMoods([]);
    } finally {
      setMoodLoading(false);
    }
  };

  // 감정 카테고리 분류
  function getMoodCategory(energy: 'high' | 'low', pleasantness: 'pleasant' | 'unpleasant') {
    if (energy === 'high' && pleasantness === 'pleasant') return 'positive';
    if (energy === 'low' && pleasantness === 'pleasant') return 'calm';
    if (energy === 'high' && pleasantness === 'unpleasant') return 'negative';
    return 'tired';
  }

  function getCategoryColor(category: string) {
    switch (category) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'calm': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      case 'tired': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function getCategoryName(category: string) {
    switch (category) {
      case 'positive': return '긍정적';
      case 'calm': return '차분함';
      case 'negative': return '스트레스';
      case 'tired': return '피곤함';
      default: return category;
    }
  }

  // 감정 트렌드 분석
  const analyzeTrend = () => {
    if (studentMoods.length < 2) return null;
    
    const recent = studentMoods.slice(0, Math.min(3, studentMoods.length));
    const older = studentMoods.slice(Math.min(3, studentMoods.length));
    
    const recentPositive = recent.filter(mood => 
      getMoodCategory(mood.energy, mood.pleasantness) === 'positive'
    ).length;
    
    const olderPositive = older.filter(mood => 
      getMoodCategory(mood.energy, mood.pleasantness) === 'positive'
    ).length;
    
    const recentRatio = recent.length > 0 ? recentPositive / recent.length : 0;
    const olderRatio = older.length > 0 ? olderPositive / older.length : 0;
    
    if (recentRatio > olderRatio + 0.2) return 'improving';
    if (recentRatio < olderRatio - 0.2) return 'declining';
    return 'stable';
  };

  const trend = analyzeTrend();

  const getTrendIcon = () => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining': return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      default: return <Calendar className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTrendText = () => {
    switch (trend) {
      case 'improving': return '감정 상태가 개선되고 있어요';
      case 'declining': return '관심과 지원이 필요해요';
      default: return '안정적인 감정 상태를 유지하고 있어요';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            학생별 감정 변화
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedStudentProfile = students.find(s => s.id === selectedStudent);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            학생별 감정 변화 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 학생 선택 */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">학생 선택</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                {students.map((student) => (
                  <Button
                    key={student.id}
                    variant={selectedStudent === student.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStudent(student.id)}
                    className="text-xs"
                  >
                    <User className="w-3 h-3 mr-1" />
                    {student.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* 기간 선택 */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">분석 기간</label>
              <div className="flex gap-2 mt-2">
                {[7, 14, 30].map((days) => (
                  <Button
                    key={days}
                    variant={dateRange === days ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDateRange(days)}
                  >
                    {days}일
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 선택된 학생의 감정 분석 */}
      {selectedStudent && selectedStudentProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {selectedStudentProfile.name}님의 감정 분석
              </span>
              {trend && (
                <div className="flex items-center gap-2 text-sm">
                  {getTrendIcon()}
                  <span className="text-muted-foreground">{getTrendText()}</span>
                </div>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {format(subDays(new Date(), dateRange), 'M월 d일', { locale: ko })} ~ {format(new Date(), 'M월 d일', { locale: ko })} ({dateRange}일간)
            </p>
          </CardHeader>
          <CardContent>
            {moodLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : studentMoods.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">감정 기록이 없습니다</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  선택한 기간 동안 감정을 등록한 기록이 없습니다.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 감정 통계 */}
                <div>
                  <h4 className="text-sm font-medium mb-3">감정 분포</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['positive', 'calm', 'negative', 'tired'].map((category) => {
                      const count = studentMoods.filter(mood => 
                        getMoodCategory(mood.energy, mood.pleasantness) === category
                      ).length;
                      const percentage = studentMoods.length > 0 ? Math.round((count / studentMoods.length) * 100) : 0;
                      
                      return (
                        <div key={category} className="text-center">
                          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getCategoryColor(category)} mb-2`}>
                            <span className="text-lg font-bold">{count}</span>
                          </div>
                          <p className="text-sm font-medium">{getCategoryName(category)}</p>
                          <p className="text-xs text-muted-foreground">{percentage}%</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 최근 감정 기록 */}
                <div>
                  <h4 className="text-sm font-medium mb-3">최근 감정 기록</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {studentMoods.map((mood) => (
                      <div
                        key={mood.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                      >
                        <div className="text-2xl">{mood.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{mood.emotion}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(mood.submittedAt, 'M월 d일 EEEE HH:mm', { locale: ko })}
                          </div>
                          {mood.note && (
                            <div className="text-xs text-muted-foreground mt-1">
                              &ldquo;{mood.note}&rdquo;
                            </div>
                          )}
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getCategoryColor(getMoodCategory(mood.energy, mood.pleasantness))}`}
                        >
                          {getCategoryName(getMoodCategory(mood.energy, mood.pleasantness))}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}