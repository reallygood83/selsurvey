// 학생 페이지 레이아웃 - 역할 기반 접근 제어
'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="student">
      {children}
    </ProtectedRoute>
  );
}