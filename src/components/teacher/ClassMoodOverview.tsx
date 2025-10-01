'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Heart, Users } from 'lucide-react';
import { moodService, studentService } from '@/lib/firestore';
import { DailyMood, StudentProfile } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ClassMoodOverviewProps {
  classCode: string;
}

export function ClassMoodOverview({ classCode }: ClassMoodOverviewProps) {
  const [todayMoods, setTodayMoods] = useState<DailyMood[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayMoods();
  }, [classCode]);

  const loadTodayMoods = async () => {
    if (!classCode) {
      console.log('🏫 [ClassMoodOverview] classCode가 없음');
      return;
    }

    console.log('🏫 [ClassMoodOverview] 학급 감정 데이터 로드 시작, classCode:', classCode);
    setLoading(true);
    
    try {
      console.log('🏫 [ClassMoodOverview] moodService.getClassTodayMoods 호출 중...');
      console.log('🏫 [ClassMoodOverview] studentService.getStudentsByClass 호출 중...');
      
      const [moods, studentsData] = await Promise.all([
        moodService.getClassTodayMoods(classCode),
        studentService.getStudentsByClass(classCode)
      ]);
      
      console.log('🏫 [ClassMoodOverview] 받은 무드 데이터:', moods.length, '개');
      console.log('🏫 [ClassMoodOverview] 받은 학생 데이터:', studentsData.length, '개');
      
      if (moods.length > 0) {
        console.log('🏫 [ClassMoodOverview] 무드 데이터 상세:');
        moods.forEach((mood, index) => {
          console.log(`  무드 ${index + 1}:`, mood);
        });
      }
      
      if (studentsData.length > 0) {
        console.log('🏫 [ClassMoodOverview] 학생 데이터 상세:');
        studentsData.forEach((student, index) => {
          console.log(`  학생 ${index + 1}:`, { 
            id: student.id, 
            name: student.name,
            classCode: student.classCode 
          });
        });
      }
      
      setTodayMoods(moods);
      setStudents(studentsData);
      
      console.log('✅ [ClassMoodOverview] 데이터 로드 완료');
    } catch (error) {
      console.error('❌ [ClassMoodOverview] 최근 학급 감정 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 학생 이름 찾기 함수
  const getStudentName = (studentId: string) => {
    console.log('🔍 [getStudentName] 학생 이름 검색:', {
      찾는_studentId: studentId,
      전체_학생수: students.length,
      학생_ID_목록: students.map(s => ({ id: s.id, name: s.name, userId: s.userId }))
    });
    
    // id로 먼저 검색
    let student = students.find(s => s.id === studentId);
    
    // id로 못찾으면 userId로 검색 (Firebase Auth UID)
    if (!student) {
      student = students.find(s => s.userId === studentId);
      console.log('🔄 [getStudentName] userId로 재검색 결과:', student ? `찾음: ${student.name}` : '못찾음');
    }
    
    const result = student?.name || '알 수 없음';
    console.log('✅ [getStudentName] 최종 결과:', result, student ? `(${student.id})` : '(매칭 실패)');
    return result;
  };

  // 감정별 통계
  const moodStats = todayMoods.reduce((acc, mood) => {
    const category = getMoodCategory(mood.energy, mood.pleasantness);
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  function getMoodCategory(energy: 'high' | 'low', pleasantness: 'pleasant' | 'unpleasant') {
    if (energy === 'high' && pleasantness === 'pleasant') return 'positive';
    if (energy === 'low' && pleasantness === 'pleasant') return 'calm';
    if (energy === 'high' && pleasantness === 'unpleasant') return 'negative';
    return 'tired';
  }

  function getCategoryColor(category: string) {
    switch (category) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'calm': return 'bg-blue-100 text-blue-800';
      case 'negative': return 'bg-red-100 text-red-800';
      case 'tired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            최근 학급 감정 현황
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

  return (
    <div className="space-y-6">
      {/* 감정 현황 요약 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            최근 학급 감정 현황
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            최신 데이터 기준 (오늘 또는 최근 24시간)
          </p>
        </CardHeader>
        <CardContent>
          {todayMoods.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium">아직 감정을 등록한 학생이 없습니다</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                학생들이 무드미터를 통해 감정을 등록하면 여기에 표시됩니다.
              </p>
            </div>
          ) : (
            <>
              {/* 감정 통계 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {Object.entries(moodStats).map(([category, count]) => (
                  <div key={category} className="text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getCategoryColor(category)} mb-2`}>
                      <span className="text-lg font-bold">{count}</span>
                    </div>
                    <p className="text-sm font-medium">{getCategoryName(category)}</p>
                  </div>
                ))}
              </div>

              {/* 개별 학생 감정 */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">개별 학생 감정 ({todayMoods.length}명)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {todayMoods.map((mood) => (
                    <div
                      key={mood.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      <div className="text-2xl">{mood.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {getStudentName(mood.studentId)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {mood.emotion}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(mood.submittedAt, 'HH:mm')}
                        </div>
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

              {/* 참여율 */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">오늘 감정 등록 참여</span>
                  <span className="font-medium">{todayMoods.length}명 참여</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 감정 분포 차트 (간단한 바 차트) */}
      {todayMoods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">감정 분포 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(moodStats).map(([category, count]) => {
                const percentage = Math.round((count / todayMoods.length) * 100);
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{getCategoryName(category)}</span>
                      <span className="text-muted-foreground">{count}명 ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          category === 'positive' ? 'bg-green-500' :
                          category === 'calm' ? 'bg-blue-500' :
                          category === 'negative' ? 'bg-red-500' :
                          'bg-gray-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}