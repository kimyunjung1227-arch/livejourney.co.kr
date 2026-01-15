# 🗺️ LiveJourney - 실시간 여행 정보 공유 플랫폼

**사명**: 과거의 정보가 아닌, 지금 당신의 눈 앞에 펼쳐진 여정(Journey)을 가장 스마트하고 즐겁게 완성합니다.

지금 이 순간의 여행지 모습을 실시간으로 공유하고 탐험하세요! ✨

## ✨ 주요 기능

- 📸 **실시간 정보 공유** - 지금 이 순간의 여행지를 사진으로 공유
- 🗺️ **지도 기반 탐색** - 사진 핀으로 여행지를 한눈에 확인
- 🤖 **AI 자동 분류** - Google Vision AI가 자동으로 카테고리 분류
- 🏆 **뱃지 시스템** - 여행 기록에 따라 뱃지 획득
- 🔍 **스마트 검색** - 지역/카테고리별 필터링
- 📱 **부드러운 UX** - 네이티브 앱 수준의 스크롤 경험

## 🌐 웹 앱 배포하기

다른 사람들도 사용할 수 있도록 웹 앱을 배포하려면:

### 🚀 GitHub Pages 배포 (카페 회원 공유용) ⭐
📖 **[GITHUB_DEPLOY_GUIDE.md](./GITHUB_DEPLOY_GUIDE.md)** - GitHub Pages 배포 가이드
- 카페 회원들이 쉽게 접속할 수 있도록 GitHub Pages에 배포
- 무료로 사용 가능
- 자동 배포 지원

### 🚀 지금 바로 배포
📖 **[DEPLOY_NOW.md](./DEPLOY_NOW.md)** - 5분 빠른 배포 가이드 ⭐

### 📚 상세 가이드
- **[AUTO_DEPLOY.md](./AUTO_DEPLOY.md)** - 자동 배포 가이드 (단계별 상세 설명)
- **[QUICK_DEPLOY.md](./QUICK_DEPLOY.md)** - 빠른 배포 가이드
- **[DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)** - 전체 배포 가이드
- **[GITHUB_PAGES_SETUP.md](./GITHUB_PAGES_SETUP.md)** - GitHub Pages 설정 가이드

### 추천 배포 플랫폼
- **프론트엔드**: 
  - [GitHub Pages](https://pages.github.com) (무료, 카페 공유용) ⭐
  - [Vercel](https://vercel.com) (무료, 자동 배포)
- **백엔드**: [Railway](https://railway.app) (무료 티어 제공)
- **데이터베이스**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (무료 M0 클러스터)

### 배포 전 체크리스트
- [x] 프론트엔드 빌드 테스트 완료 ✅
- [x] 배포 설정 파일 준비 완료 ✅
- [x] GitHub Pages 배포 설정 완료 ✅
- [ ] MongoDB Atlas 설정
- [ ] Railway 백엔드 배포
- [ ] Vercel 프론트엔드 배포 (선택 사항)

---

## 🚀 빠른 시작

### 1. 환경 변수 설정

백엔드 폴더에 `.env` 파일을 생성하세요 (선택 사항):
```bash
cd backend
# ENV_SETUP.md 파일을 참고하여 .env 파일 생성
```

**소셜 로그인 API 키 설정**이 필요하면 `SOCIAL_LOGIN_SETUP_GUIDE.md`를 참고하세요.

### 2. 모바일 앱 실행 (메인)

#### 방법 A: Android Studio로 독립적인 네이티브 앱 실행 (권장)

**완전히 독립적인 앱으로 실행됩니다 (Expo Go 불필요!)**

```bash
# 배치 파일 실행
mobile\start.bat
# 또는
mobile\RUN_ANDROID_STUDIO.bat
```

그 다음 Android Studio에서 `Run` → `Run 'app'` 클릭

📖 **자세한 가이드**: [mobile/ANDROID_STUDIO_QUICK_START.md](./mobile/ANDROID_STUDIO_QUICK_START.md)

#### 방법 B: Expo Go로 빠르게 확인

```bash
cd mobile
npm install
npm start
```
→ Expo 개발 서버 시작 (Expo Go 앱 필요)

### 3. 웹 앱 실행 (개발 확인용)
```bash
cd web
npm install
npm run dev
```
→ http://localhost:5173 접속
⚠️ **주의**: 웹 앱은 개발 진행사항 확인용이며, 실제 서비스는 모바일 앱입니다.

### 4. 백엔드 서버 실행 (선택 사항)
```bash
cd backend
npm install
npm run dev
```
→ http://localhost:5000 에서 API 서버 실행

## 📱 배포하기

### 모바일 앱 배포 (메인)
- **Android**: `cd mobile && npm run android` (APK/AAB 생성)
- **iOS**: `cd mobile && npm run ios` (Mac만, IPA 생성)
- 자세한 배포 방법은 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) 참고

### 랜딩 페이지 배포
1. https://app.netlify.com/drop 접속
2. `landing-page` 폴더 업로드
3. 생성된 URL 공유

⚠️ **중요**: 웹 앱은 개발 확인용이므로 배포하지 않습니다.

## 🛠 기술 스택

- **Frontend**: React 18 + Tailwind CSS + Vite
- **Backend**: Node.js + Express + MongoDB
- **Mobile**: Expo + React Native
- **인증**: JWT + Passport.js
- **소셜 로그인**: Google OAuth 2.0, Kakao, Naver, Apple Sign In

## 📁 프로젝트 구조

```
mvp1/
├── mobile/           # 📱 모바일 앱 (메인 - 실제 서비스)
├── web/              # 💻 웹 앱 (개발 확인용)
├── backend/          # 🖥️ API 서버 (공통)
├── landing-page/     # 🌐 랜딩 페이지
└── assets/           # 공유 리소스
```

### 📱 모바일 앱 (메인)
- **React Native + Expo** 기반 네이티브 앱
- Android/iOS 스토어 배포 대상
- 실제 사용자를 위한 완성도 높은 서비스

### 💻 웹 앱 (개발 확인용)
- **React + Vite** 기반 웹 애플리케이션
- 개발 진행사항을 빠르게 확인하기 위한 도구
- 실제 사용자에게 배포하지 않음

자세한 내용은 [프로젝트 구조 가이드](./PROJECT_STRUCTURE.md)를 참고하세요.

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

- **[📁 프로젝트 구조](./PROJECT_STRUCTURE.md)** - 앱과 웹의 역할 구분
- [빠른 시작](./QUICK_START.md) - 개발 환경 설정
- [배포 가이드](./EASY_DEPLOY_GUIDE.md) - 무료 배포 방법
- [API 문서](./backend/API_DOCUMENTATION.md) - 백엔드 API
- [모바일 앱 README](./mobile/README.md) - 메인 앱 상세 정보
- [웹 앱 README](./web/README.md) - 개발 확인용 웹 앱 정보

## 📄 라이선스

MIT License

---

**🌟 피드백 환영합니다!**
