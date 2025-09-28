# Firebase OAuth 설정 가이드

## 🚨 redirect_uri_mismatch 오류 해결 방법

이 오류는 Firebase Console에서 승인된 도메인 설정이 올바르지 않을 때 발생합니다.

## 📋 필수 설정 단계

### 1️⃣ Firebase Console 설정

1. **Firebase Console 접속**: https://console.firebase.google.com/
2. **프로젝트 선택**: `gohard-9a1f4`
3. **Authentication 메뉴**: 좌측 사이드바에서 "Authentication" 클릭
4. **Settings 탭**: 상단의 "Settings" 탭 클릭
5. **Authorized domains 섹션**: 스크롤 다운하여 "Authorized domains" 찾기

### 2️⃣ 승인된 도메인 추가

다음 도메인들을 모두 추가해야 합니다:

```
localhost
gohard-9a1f4.firebaseapp.com
goodmind-six.vercel.app
```

**추가 방법**:
1. "Add domain" 버튼 클릭
2. 각 도메인을 하나씩 입력
3. "Add" 버튼으로 확인

### 3️⃣ Google Cloud Console 설정 (필요한 경우)

만약 Firebase Console 설정만으로 해결되지 않으면:

1. **Google Cloud Console 접속**: https://console.cloud.google.com/
2. **프로젝트 선택**: `gohard-9a1f4`
3. **APIs & Services**: 좌측 메뉴에서 "APIs & Services" > "Credentials"
4. **OAuth 2.0 Client IDs**: 기존 OAuth 클라이언트 찾기
5. **Authorized redirect URIs**: 다음 URI들 추가:
   ```
   https://gohard-9a1f4.firebaseapp.com/__/auth/handler
   http://localhost:3005/__/auth/handler
   http://localhost:3000/__/auth/handler
   https://goodmind-six.vercel.app/__/auth/handler
   ```

## 🔍 현재 설정 확인

### Firebase 프로젝트 정보
- **Project ID**: `gohard-9a1f4`
- **Auth Domain**: `gohard-9a1f4.firebaseapp.com`
- **App ID**: `1:56675714521:web:df48bd210063f5ac5ac8c8`

### 오류 로그에서 확인된 정보
- **문제 URI**: `https://ohard-9a1f4.firebaseapp.com/__/auth/handler`
- **정상 URI**: `https://gohard-9a1f4.firebaseapp.com/__/auth/handler`

## ⚠️ 주의사항

1. **도메인 추가 후 저장**: 반드시 "Save" 버튼을 클릭하여 변경사항 저장
2. **변경사항 적용 시간**: 설정 변경 후 5-10분 정도 시간이 걸릴 수 있음
3. **브라우저 캐시**: 설정 변경 후 브라우저 캐시 및 쿠키 삭제 권장
4. **시크릿 모드 테스트**: 변경 후 브라우저 시크릿 모드에서 테스트

## 🚀 설정 완료 후 테스트

설정 완료 후 다음 단계로 테스트:

1. **브라우저 캐시 삭제**
2. **시크릿/프라이빗 모드**에서 앱 접속
3. **Google 로그인** 테스트
4. **다양한 도메인**에서 테스트 (localhost, Firebase Hosting, Vercel)

## 📞 추가 지원

만약 위 설정으로도 해결되지 않으면:
- Firebase Console의 "Support" 섹션 확인
- Google Cloud Console의 OAuth 설정 재검토
- 프로젝트 설정의 일관성 확인

---

**마지막 업데이트**: 2025-01-25
**작성자**: Claude Code Assistant