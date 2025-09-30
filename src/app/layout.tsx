import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FirebaseProvider } from '@/contexts/FirebaseContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { Toaster } from '@/components/ui/toaster';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SEL 감정분석 플랫폼 - 마음을 키우는 사회정서학습",
  description: "사회정서학습(SEL)을 통해 학생들의 건강한 감정 발달을 지원합니다. 교사는 학급의 감정 상태를 한눈에, 학생들은 재미있는 무드미터로 함께 만들어가는 따뜻한 학교 문화를 경험해보세요.",
  keywords: ["SEL", "사회정서학습", "감정분석", "무드미터", "학교", "교육", "학생 상담", "AI 분석"],
  authors: [{ name: "김문정", url: "https://sel-emotion-platform.vercel.app" }],
  creator: "김문정(박달초)",
  publisher: "박달초등학교",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://sel-emotion-platform.vercel.app",
    title: "SEL 감정분석 플랫폼 - 마음을 키우는 사회정서학습",
    description: "사회정서학습(SEL)을 통해 학생들의 건강한 감정 발달을 지원합니다. 교사는 학급의 감정 상태를 한눈에, 학생들은 재미있는 무드미터로 함께 만들어가는 따뜻한 학교 문화를 경험해보세요.",
    siteName: "SEL 감정분석 플랫폼",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SEL 감정분석 플랫폼 - 마음을 키우는 사회정서학습",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SEL 감정분석 플랫폼 - 마음을 키우는 사회정서학습",
    description: "사회정서학습(SEL)을 통해 학생들의 건강한 감정 발달을 지원합니다.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FirebaseProvider>
          <AuthProvider>
            <SettingsProvider>
              {children}
              <Toaster />
            </SettingsProvider>
          </AuthProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}
