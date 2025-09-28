'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { moodOptions, moodMeterDescription } from '@/data/moodMeter';
import { moodService } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { DailyMood, MoodOption } from '@/types';
import { CalendarDays, Heart, MessageCircle } from 'lucide-react';

export default function MoodMeter() {
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [note, setNote] = useState('');
  const [todayMood, setTodayMood] = useState<DailyMood | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingToday, setIsLoadingToday] = useState(true);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // 오늘의 기분 로드
  useEffect(() => {
    const loadTodayMood = async () => {
      if (!user) return;
      
      try {
        const mood = await moodService.getTodayMood(user.uid);
        setTodayMood(mood);
        if (mood) {
          const moodOption = moodOptions.find(option => option.id === mood.moodId);
          setSelectedMood(moodOption || null);
          setNote(mood.note || '');
        }
      } catch (error) {
        console.error('오늘의 기분 로드 실패:', error);
      } finally {
        setIsLoadingToday(false);
      }
    };

    loadTodayMood();
  }, [user]);

  // 기분 저장 또는 업데이트
  const handleSaveMood = async () => {
    if (!selectedMood || !user) return;

    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const moodData = {
        studentId: user.uid,
        date: today,
        moodId: selectedMood.id,
        emotion: selectedMood.emotion,
        emoji: selectedMood.emoji,
        energy: selectedMood.energy,
        pleasantness: selectedMood.pleasantness,
        note: note.trim() || '',
        submittedAt: new Date()
      };

      if (todayMood) {
        // 기존 기분 업데이트
        await moodService.updateTodayMood(user.uid, {
          moodId: selectedMood.id,
          emotion: selectedMood.emotion,
          emoji: selectedMood.emoji,
          energy: selectedMood.energy,
          pleasantness: selectedMood.pleasantness,
          note: note.trim() || ''
        });
        toast({
          title: "기분이 업데이트되었습니다! 😊",
          description: `오늘의 기분: ${selectedMood.emoji} ${selectedMood.emotion}`,
        });
      } else {
        // 새로운 기분 저장
        const moodId = await moodService.saveDailyMood(moodData);
        setTodayMood({ ...moodData, id: moodId });
        toast({
          title: "오늘의 기분이 저장되었습니다! 🎉",
          description: `${selectedMood.emoji} ${selectedMood.emotion} - ${selectedMood.description}`,
        });
      }
    } catch (error) {
      console.error('기분 저장 실패:', error);
      toast({
        title: "저장에 실패했습니다",
        description: "다시 시도해주세요.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingToday) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            오늘의 기분
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 제목 및 설명 */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Heart className="h-6 w-6 text-pink-500" />
            {moodMeterDescription.title}
          </CardTitle>
          <CardDescription className="text-lg">
            {moodMeterDescription.subtitle}
          </CardDescription>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {moodMeterDescription.instructions.map((instruction, index) => (
              <Badge key={index} variant="secondary" className="text-sm">
                {instruction}
              </Badge>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* 현재 저장된 기분 표시 */}
      {todayMood && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CalendarDays className="h-5 w-5" />
              오늘 선택한 기분
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl">{todayMood.emoji}</div>
              <div>
                <p className="font-medium text-lg">{todayMood.emotion}</p>
                <p className="text-sm text-gray-600">
                  {moodOptions.find(m => m.id === todayMood.moodId)?.description}
                </p>
                {todayMood.note && (
                  <p className="text-sm text-gray-600 mt-2 italic">
                    &ldquo;{todayMood.note}&rdquo;
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 무드미터 선택 */}
      <Card>
        <CardHeader>
          <CardTitle>
            {todayMood ? '기분 변경하기' : '오늘의 기분 선택하기'}
          </CardTitle>
          <CardDescription>
            가장 가까운 감정을 선택해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {moodOptions.map((mood) => (
              <button
                key={mood.id}
                onClick={() => setSelectedMood(mood)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                  selectedMood?.id === mood.id
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{
                  backgroundColor: selectedMood?.id === mood.id 
                    ? `${mood.color}20` 
                    : 'transparent'
                }}
              >
                <div className="text-center space-y-2">
                  <div className="text-3xl">{mood.emoji}</div>
                  <div className="font-medium text-sm">{mood.emotion}</div>
                  <div className="text-xs text-gray-600 leading-tight">
                    {mood.description}
                  </div>
                  <div className="flex justify-center gap-1">
                    <Badge 
                      variant="outline" 
                      className="text-xs px-1 py-0"
                      style={{ borderColor: mood.color }}
                    >
                      {mood.energy === 'high' ? '활발' : '차분'}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className="text-xs px-1 py-0"
                      style={{ borderColor: mood.color }}
                    >
                      {mood.pleasantness === 'pleasant' ? '긍정' : '부정'}
                    </Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 선택된 기분에 대한 메모 */}
      {selectedMood && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              기분에 대해 더 말해주세요 (선택사항)
            </CardTitle>
            <CardDescription>
              {selectedMood.emoji} {selectedMood.emotion} - {selectedMood.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="오늘 이런 기분이 든 이유나 하고 싶은 말을 자유롭게 적어보세요..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[100px]"
              maxLength={500}
            />
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                {note.length}/500자
              </p>
              <Button 
                onClick={handleSaveMood}
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    저장 중...
                  </>
                ) : (
                  todayMood ? '기분 업데이트' : '기분 저장하기'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}