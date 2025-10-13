'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronsUpDown, GraduationCap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { classService } from '@/lib/firestore';
import { ClassInfo } from '@/types';

interface ClassSelectorProps {
  currentClassId?: string;
  onClassChange: (classInfo: ClassInfo) => void;
  userId: string;
}

export function ClassSelector({ currentClassId, onClassChange, userId }: ClassSelectorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);

  useEffect(() => {
    loadClasses();
  }, [userId]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const teacherClasses = await classService.getClassesByTeacher(userId);

      // 활성화된 학급만 필터링하고 정렬
      const activeClasses = teacherClasses
        .filter(c => c.isActive)
        .sort((a, b) => {
          // 학년 -> 반 순으로 정렬
          if (a.grade !== b.grade) return a.grade - b.grade;
          return a.className.localeCompare(b.className);
        });

      setClasses(activeClasses);

      // 현재 선택된 학급 찾기
      const current = activeClasses.find(c => c.id === currentClassId) || activeClasses[0];
      if (current) {
        setSelectedClass(current);
      }
    } catch (error) {
      console.error('학급 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassSelect = (classInfo: ClassInfo) => {
    setSelectedClass(classInfo);
    setOpen(false);
    onClassChange(classInfo);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        <span className="text-sm text-gray-600">학급 로딩 중...</span>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <Button
        onClick={() => router.push('/teacher/classes/create')}
        variant="outline"
        className="gap-2"
      >
        <GraduationCap className="w-4 h-4" />
        학급 만들기
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[280px] justify-between bg-white hover:bg-gray-50 border-gray-300"
        >
          {selectedClass ? (
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span className="font-medium">{selectedClass.className}</span>
              <Badge variant="secondary" className="text-xs">
                {selectedClass.grade}학년
              </Badge>
            </div>
          ) : (
            <span className="text-gray-500">학급을 선택하세요</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="학급 검색..." />
          <CommandList>
            <CommandEmpty>학급을 찾을 수 없습니다.</CommandEmpty>
            <CommandGroup heading="활성 학급">
              {classes.map((classInfo) => (
                <CommandItem
                  key={classInfo.id}
                  value={`${classInfo.className} ${classInfo.grade}학년`}
                  onSelect={() => handleClassSelect(classInfo)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedClass?.id === classInfo.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    <div className="flex flex-col">
                      <span className="font-medium">{classInfo.className}</span>
                      <span className="text-xs text-gray-500">
                        {classInfo.schoolName} · {classInfo.grade}학년 · 학생 {classInfo.studentCount}명
                      </span>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
