import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://*.google.com https://*.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: http:",
              "connect-src 'self' https://accounts.google.com https://*.google.com https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://firestore.googleapis.com https://gohard-9a1f4.firebaseapp.com https://gohard-9a1f4-default-rtdb.firebaseio.com",
              "frame-src 'self' https://accounts.google.com https://*.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'
          }
        ]
      }
    ];
  },
  // Google OAuth를 위한 도메인 허용
  images: {
    domains: ['lh3.googleusercontent.com', 'accounts.google.com'],
  },
  // Vercel 도메인을 위한 설정
  env: {
    NEXTAUTH_URL: 'https://sel-emotion-platform.vercel.app',
  },
  // 배포를 위한 간소화된 설정
};

export default nextConfig;
