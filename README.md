# 🗺️ LiveJourney - 실시간 여행 정보 공유 플랫폼

지금 이 순간의 여행지 모습을 실시간으로 공유하고 탐험하세요! ✨

## ✨ 주요 기능

- 📸 **실시간 정보 공유** - 지금 이 순간의 여행지를 사진으로 공유
- 🗺️ **지도 기반 탐색** - 사진 핀으로 여행지를 한눈에 확인
- 🤖 **AI 자동 분류** - Google Vision AI가 자동으로 카테고리 분류
- 🏆 **뱃지 시스템** - 여행 기록에 따라 뱃지 획득
- 🔍 **스마트 검색** - 지역/카테고리별 필터링
- 📱 **부드러운 UX** - 네이티브 앱 수준의 스크롤 경험

## 🚀 빠른 시작

### 1. 환경 변수 설정

백엔드 폴더에 `.env` 파일을 생성하세요 (선택 사항):
```bash
cd backend
# ENV_SETUP.md 파일을 참고하여 .env 파일 생성
```

**소셜 로그인 API 키 설정**이 필요하면 `SOCIAL_LOGIN_SETUP_GUIDE.md`를 참고하세요.

### 2. 웹 앱 실행 (개발 모드)
```bash
cd web
npm install
npm run dev
```
→ http://localhost:3000 접속

### 3. 백엔드 서버 실행 (선택 사항)
```bash
cd backend
npm install
npm run dev
```
→ http://localhost:5000 에서 API 서버 실행

### 웹 앱 빌드 (배포용)
```bash
cd web
npm run build
```
→ `web/dist` 폴더에 빌드 파일 생성

## 📱 배포하기

자세한 배포 방법은 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) 참고

### 웹 배포 (5분)
1. https://app.netlify.com/drop 접속
2. `web/dist` 폴더 업로드
3. 생성된 URL 공유

### APK 배포 (10분)
1. 웹 배포 후 URL 복사
2. https://www.websitetoapk.com 에서 APK 생성
3. APK 다운로드 및 공유

## 🛠 기술 스택

- **Frontend**: React 18 + Tailwind CSS + Vite
- **Backend**: Node.js + Express + MongoDB
- **Mobile**: Expo + React Native
- **인증**: JWT + Passport.js
- **소셜 로그인**: Google OAuth 2.0, Kakao, Naver, Apple Sign In

## 📁 프로젝트 구조

```
mvp1/
├── web/              # 웹 앱 (메인)
├── backend/          # API 서버
├── app/              # 모바일 앱
└── assets/           # 공유 리소스
```

## 💰 포인트 시스템

| 활동 | 포인트 |
|------|--------|
| 회원가입 | 100P |
| 게시물 작성 | 50P |
| 댓글 작성 | 10P |
| 질문 답변 | 15P |

## 🎯 특징

- ✅ 완전한 반응형 (360px × 720px 프레임)
- ✅ 다크모드 지원
- ✅ 테스터 계정 바로 시작
- ✅ 각 게시물마다 다른 작성자/댓글

## 🔐 소셜 로그인 설정

소셜 로그인 기능을 사용하려면 각 플랫폼에서 API 키를 발급받아야 합니다:

1. **API 키 발급 방법**: `SOCIAL_LOGIN_SETUP_GUIDE.md` 참고
2. **환경 변수 설정**: `backend/ENV_SETUP.md` 참고
3. **API 키를 입력하면 자동으로 활성화됩니다** 🚀

**지원 플랫폼**:
- ✅ Google (OAuth 2.0)
- ✅ Kakao (카카오톡 로그인)
- ✅ Naver (네이버 아이디로 로그인)
- ✅ Apple (Sign in with Apple)

**API 키 없이도 사용 가능**: "테스터 계정으로 바로 체험하기" 버튼을 이용하세요!

## 📚 문서

- **[📖 통합 가이드](./PROJECT_GUIDE.md)** - 모든 정보가 여기에!
- [빠른 시작](./QUICK_START.md) - 개발 환경 설정
- [배포 가이드](./EASY_DEPLOY_GUIDE.md) - 무료 배포 방법
- [API 문서](./backend/API_DOCUMENTATION.md) - 백엔드 API

## 📄 라이선스

MIT License

---

**🌟 피드백 환영합니다!**
