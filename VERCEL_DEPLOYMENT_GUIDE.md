# Vercel 배포 가이드

## 환경변수 설정

Vercel Dashboard에서 다음 환경변수들을 설정해주세요:

### Firebase 설정 (이미 설정됨)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD7NMneq37ymtYc_s8o8DLyx3Vni0GVJE0
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gohard-9a1f4.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gohard-9a1f4
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gohard-9a1f4.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=56675714521
NEXT_PUBLIC_FIREBASE_APP_ID=1:56675714521:web:df48bd210063f5ac5ac8
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-TCM83PP1B5
```

### Gemini API 설정 (필수 - 직접 설정 필요)
```
NEXT_PUBLIC_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**Gemini API 키 발급 방법:**
1. https://aistudio.google.com/app/apikey 에 접속
2. Google 계정으로 로그인
3. "Create API Key" 클릭하여 새 API 키 생성
4. 생성된 키를 Vercel 환경변수에 설정

### 애플리케이션 설정
```
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
```

## Firebase 인증 도메인 설정

Firebase Console에서 인증 도메인을 추가해야 합니다:

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택 (gohard-9a1f4)
3. Authentication > Settings > Authorized domains
4. 다음 도메인들을 추가:
   - `your-vercel-domain.vercel.app` (실제 Vercel 도메인으로 교체)
   - `localhost` (개발용)

## 배포 순서

1. GitHub 저장소에 코드 푸시
2. Vercel에서 GitHub 저장소 연결
3. 환경변수 설정
4. Firebase 인증 도메인 추가
5. 배포 확인

## 주요 특징

- **Next.js 15.5.4** with Turbopack
- **Firebase Authentication** - 이메일/비밀번호, Google OAuth
- **Firestore Database** - 사용자 데이터 저장
- **Gemini AI** - 감정 분석 기능
- **Tailwind CSS** - 모던 UI 디자인
- **Radix UI** - 접근성 높은 컴포넌트

## 프로젝트 구조

```
src/
├── app/              # Next.js App Router
├── components/       # 재사용 가능한 컴포넌트
├── lib/             # 유틸리티 및 설정
└── types/           # TypeScript 타입 정의
```

## 문제 해결

- **환경변수 오류**: Vercel Dashboard에서 환경변수가 정확히 설정되었는지 확인
- **Firebase 오류**: Firebase Console에서 도메인이 승인되었는지 확인
- **Gemini API 오류**: API 키가 유효하고 할당량이 있는지 확인