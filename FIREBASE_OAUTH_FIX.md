# 🚨 URGENT: Firebase OAuth 설정 수정 가이드

## 현재 오류 상황
```
Error 400: redirect_uri_mismatch
redirect_uri=https://ohard-9a1f4.firebaseapp.com/__/auth/handler
```

## 🎯 즉시 수행해야 할 작업

### 1️⃣ Firebase Console - Authorized Domains 추가

**📍 Firebase Console 링크**: https://console.firebase.google.com/project/gohard-9a1f4/authentication/settings

**단계별 설정**:
1. 위 링크로 직접 이동 (gohard-9a1f4 프로젝트)
2. **Authentication** > **Settings** 탭
3. **Authorized domains** 섹션 찾기
4. **"Add domain"** 버튼 클릭
5. 다음 도메인들을 **하나씩** 추가:

```
localhost
gohard-9a1f4.firebaseapp.com  
goodmind-six.vercel.app
```

6. 각 도메인 추가 후 **"Save"** 버튼 클릭

### 2️⃣ Google Cloud Console - OAuth 설정 (필요시)

**📍 Google Cloud Console 링크**: https://console.cloud.google.com/apis/credentials?project=gohard-9a1f4

**단계별 설정**:
1. 위 링크로 직접 이동
2. **OAuth 2.0 Client IDs** 섹션에서 기존 클라이언트 찾기
3. 편집 아이콘 클릭
4. **"Authorized redirect URIs"** 섹션에 다음 URI들 추가:

```
https://gohard-9a1f4.firebaseapp.com/__/auth/handler
http://localhost:3005/__/auth/handler
http://localhost:3000/__/auth/handler
https://goodmind-six.vercel.app/__/auth/handler
```

5. **"Save"** 버튼 클릭

## ⚡ 설정 완료 후 테스트

### 즉시 테스트 방법:
1. **브라우저 시크릿 모드** 사용
2. https://goodmind-six.vercel.app 접속
3. Google 로그인 시도
4. 오류 없이 로그인되는지 확인

### 로컬 개발 테스트:
1. `npm run dev` 실행
2. http://localhost:3005 접속
3. Google 로그인 테스트

## 🕐 주의사항

- **설정 적용 시간**: 변경 후 5-10분 정도 소요될 수 있음
- **브라우저 캐시**: 설정 변경 후 캐시 삭제 권장
- **시크릿 모드**: 항상 시크릿/프라이빗 모드에서 테스트

## 📊 현재 프로젝트 정보

- **Firebase Project ID**: `gohard-9a1f4`
- **실제 배포 도메인**: `https://goodmind-six.vercel.app`
- **Firebase Auth Domain**: `gohard-9a1f4.firebaseapp.com`
- **로컬 개발 포트**: `localhost:3005`

## ❌ 오류 해결 확인

설정 완료 후 다음과 같은 로그가 나오면 성공:
```
✅ Google 로그인 성공 - 역할: teacher/student
```

오류가 계속 발생하면:
- Firebase Console에서 도메인이 정확히 추가되었는지 재확인
- Google Cloud Console OAuth 설정 재확인
- 브라우저 완전 재시작

---

**🚨 우선순위**: HIGH - 즉시 수행 필요
**예상 소요시간**: 10-15분
**마지막 업데이트**: 2025-01-25