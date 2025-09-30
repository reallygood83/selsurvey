'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookOpen, Users, ClipboardList, BarChart3, Settings, HelpCircle, Zap, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ManualPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 헤더 */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="hover:bg-gray-50"
              >
                <Link href="/teacher/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  대시보드로
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-7 h-7 text-blue-600" />
                  사용자 매뉴얼
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  MindLog 시스템 완벽 활용 가이드
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 빠른 시작 가이드 */}
        <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-blue-900">
              <Zap className="w-6 h-6" />
              5분 만에 시작하기
            </CardTitle>
            <CardDescription className="text-blue-700">
              MindLog를 처음 사용하시나요? 이 가이드를 따라하면 5분 안에 첫 설문을 시작할 수 있습니다!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">학생 초대하기</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    사이드바에서 "학생 초대"를 클릭하여 반 코드 또는 링크를 학생들에게 공유하세요.
                  </p>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/teacher/invite">학생 초대 페이지로</Link>
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">첫 설문 만들기</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    "새 설문 만들기"에서 일일 감정 체크 설문을 생성하세요. AI가 자동으로 질문을 추천해줍니다.
                  </p>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/teacher/surveys/create">설문 만들기</Link>
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">학생 응답 확인하기</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    대시보드에서 실시간으로 학생들의 감정 상태와 응답을 확인하세요.
                  </p>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/teacher/dashboard">대시보드로</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 주요 기능 가이드 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* 설문 관리 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                설문 관리
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  설문 만들기
                </h4>
                <p className="text-sm text-gray-600 ml-6">
                  • 일일 감정 체크 설문 자동 생성<br />
                  • AI 기반 질문 추천 기능<br />
                  • 맞춤형 질문 직접 작성
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  설문 수정 및 삭제
                </h4>
                <p className="text-sm text-gray-600 ml-6">
                  • "설문 관리"에서 기존 설문 수정<br />
                  • 설문 복제로 빠른 생성<br />
                  • 불필요한 설문 삭제
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 학생 관리 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-purple-600" />
                학생 관리
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  학생 초대하기
                </h4>
                <p className="text-sm text-gray-600 ml-6">
                  • 반 코드 또는 링크로 간편 초대<br />
                  • 카카오톡/문자/이메일로 공유<br />
                  • 학생 자동 등록 시스템
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  학생 분석하기
                </h4>
                <p className="text-sm text-gray-600 ml-6">
                  • 개별 학생 감정 추이 확인<br />
                  • SEL 5대 영역 분석<br />
                  • AI 기반 종합 리포트
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 리포트 생성 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="w-5 h-5 text-green-600" />
                SEL 분석 리포트
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  AI 리포트 생성
                </h4>
                <p className="text-sm text-gray-600 ml-6">
                  • 학급 전체 SEL 분석<br />
                  • 개별 학생 맞춤 리포트<br />
                  • 교육적 권장사항 제공
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  SEL 5대 영역
                </h4>
                <p className="text-sm text-gray-600 ml-6">
                  • 자기인식 (Self-Awareness)<br />
                  • 자기관리 (Self-Management)<br />
                  • 사회적 인식 (Social Awareness)<br />
                  • 관계 기술 (Relationship Skills)<br />
                  • 책임 있는 의사결정
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="w-5 h-5 text-gray-600" />
                설정 관리
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  반 정보 수정
                </h4>
                <p className="text-sm text-gray-600 ml-6">
                  • 학교명, 학년, 반 이름 수정<br />
                  • 반 코드는 변경 불가<br />
                  • 프로필 정보 업데이트
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  알림 설정
                </h4>
                <p className="text-sm text-gray-600 ml-6">
                  • 학생 응답 알림<br />
                  • 일일 요약 리포트<br />
                  • 중요 이벤트 알림
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-blue-600" />
              자주 묻는 질문 (FAQ)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Q. SEL이란 무엇인가요?</h3>
                <p className="text-sm text-gray-600">
                  A. SEL(Social-Emotional Learning)은 사회정서학습으로, 학생들의 자기인식, 자기관리, 사회적 인식, 관계 기술, 책임 있는 의사결정 능력을 발달시키는 교육 접근법입니다. MindLog는 이 5가지 영역을 체계적으로 분석합니다.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Q. 학생 데이터는 안전한가요?</h3>
                <p className="text-sm text-gray-600">
                  A. 네, 모든 학생 데이터는 암호화되어 안전하게 저장됩니다. 개인정보는 교사와 해당 학생만 접근 가능하며, 제3자에게 공유되지 않습니다.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Q. 얼마나 자주 설문을 진행해야 하나요?</h3>
                <p className="text-sm text-gray-600">
                  A. 일일 감정 체크는 매일 진행을 권장하며, 주간 또는 월간 심화 설문은 필요에 따라 진행하시면 됩니다. 꾸준한 데이터 수집이 정확한 분석의 핵심입니다.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Q. AI 리포트는 어떻게 생성되나요?</h3>
                <p className="text-sm text-gray-600">
                  A. Google Gemini AI를 활용하여 학생들의 설문 응답을 분석하고, SEL 5대 영역에 대한 종합적인 평가와 교육적 권장사항을 제공합니다.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Q. 학생이 응답을 수정할 수 있나요?</h3>
                <p className="text-sm text-gray-600">
                  A. 설문 제출 후에는 수정이 불가능합니다. 이는 데이터의 일관성과 정확성을 유지하기 위함입니다. 학생들에게 신중하게 응답하도록 안내해주세요.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Q. 모바일에서도 사용 가능한가요?</h3>
                <p className="text-sm text-gray-600">
                  A. 네, MindLog는 완전 반응형으로 설계되어 스마트폰, 태블릿, PC에서 모두 최적화된 환경을 제공합니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 하단 액션 */}
        <div className="mt-8 flex justify-center gap-3">
          <Button
            variant="outline"
            asChild
            className="hover:bg-gray-50"
          >
            <Link href="/teacher/dashboard">
              대시보드로 돌아가기
            </Link>
          </Button>
          <Button
            asChild
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Link href="/teacher/invite">
              <Users className="w-4 h-4 mr-2" />
              학생 초대하기
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}