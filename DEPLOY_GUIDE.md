# LiveJourney 배포 가이드

이 가이드는 LiveJourney 앱을 프로덕션 환경에 배포하는 방법을 설명합니다.

## 📋 배포 전 체크리스트

### 1. 데이터 정리
- [ ] localStorage의 모든 테스트 데이터 삭제
- [ ] Mock 데이터 생성 비활성화 확인
- [ ] 프로덕션 모드에서 자동 데이터 생성 비활성화 확인

### 2. 환경 변수 준비
- [ ] MongoDB Atlas 연결 문자열
- [ ] JWT Secret 키
- [ ] 소셜 로그인 API 키 (카카오, 구글, 네이버)
- [ ] 프론트엔드 URL
- [ ] 백엔드 URL

---

## 🗄️ 1단계: MongoDB Atlas 설정

### 1.1 MongoDB Atlas 계정 생성
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 접속
2. 무료 계정 생성 (M0 클러스터)
3. 클러스터 생성

### 1.2 데이터베이스 접근 설정
1. **Network Access** → **Add IP Address** → `0.0.0.0/0` (모든 IP 허용)
2. **Database Access** → **Add New Database User**
   - Username/Password 생성
   - 권한: `Atlas admin` 또는 `Read and write to any database`

### 1.3 연결 문자열 가져오기
1. **Connect** → **Connect your application**
2. Connection String 복사
   - 형식: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
3. 데이터베이스 이름 추가: `mongodb+srv://...@cluster0.xxxxx.mongodb.net/livejourney?retryWrites=true&w=majority`

---

## 🖥️ 2단계: 백엔드 배포

### 옵션 A: Railway 배포 (추천)

1. **Railway 계정 생성**
   - [Railway](https://railway.app) 접속
   - GitHub 계정으로 로그인

2. **프로젝트 생성**
   - **New Project** → **Deploy from GitHub repo**
   - `mvp1` 저장소 선택
   - `backend` 폴더 선택

3. **환경 변수 설정**
   - Railway 대시보드 → **Variables** 탭
   - 다음 변수 추가:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/livejourney?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=production
   PORT=5000
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   KAKAO_CLIENT_ID=your-kakao-client-id
   KAKAO_CLIENT_SECRET=your-kakao-client-secret
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   NAVER_CLIENT_ID=your-naver-client-id
   NAVER_CLIENT_SECRET=your-naver-client-secret
   ```

4. **배포 설정**
   - **Settings** → **Root Directory**: `backend`
   - **Start Command**: `npm start`
   - 자동 배포 활성화

5. **도메인 확인**
   - 배포 완료 후 생성된 URL 확인 (예: `https://livejourney-backend.railway.app`)

### 옵션 B: Render 배포

1. **Render 계정 생성**
   - [Render](https://render.com) 접속
   - GitHub 계정으로 로그인

2. **Web Service 생성**
   - **New** → **Web Service**
   - GitHub 저장소 연결
   - 설정:
     - **Root Directory**: `backend`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`

3. **환경 변수 설정** (Railway와 동일)

---

## 🌐 3단계: 프론트엔드 배포

### 옵션 A: Vercel 배포 (추천)

1. **Vercel 계정 생성**
   - [Vercel](https://vercel.com) 접속
   - GitHub 계정으로 로그인

2. **프로젝트 Import**
   - **Add New Project**
   - `mvp1` 저장소 선택
   - 설정:
     - **Framework Preset**: `Vite`
     - **Root Directory**: `web`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`

3. **환경 변수 설정**
   - **Settings** → **Environment Variables**
   - 다음 변수 추가:
   ```
   VITE_API_URL=https://your-backend-domain.railway.app
   ```

4. **배포**
   - **Deploy** 클릭
   - 배포 완료 후 URL 확인 (예: `https://livejourney.vercel.app`)

### 옵션 B: Netlify 배포

1. **Netlify 계정 생성**
   - [Netlify](https://netlify.com) 접속
   - GitHub 계정으로 로그인

2. **사이트 생성**
   - **Add new site** → **Import an existing project**
   - GitHub 저장소 선택
   - 설정:
     - **Base directory**: `web`
     - **Build command**: `npm run build`
     - **Publish directory**: `web/dist`

3. **환경 변수 설정**
   - **Site settings** → **Environment variables**
   - `VITE_API_URL` 추가

---

## 🔧 4단계: 소셜 로그인 설정

### 카카오 로그인
1. [카카오 개발자 콘솔](https://developers.kakao.com) 접속
2. **내 애플리케이션** → **앱 만들기**
3. **플랫폼 설정** → **Web 플랫폼 등록**
   - 사이트 도메인: `https://your-frontend-domain.vercel.app`
   - Redirect URI: `https://your-backend-domain.railway.app/api/auth/kakao/callback`
4. **제품 설정** → **카카오 로그인** 활성화
5. **REST API 키** 및 **Client Secret** 복사

### 구글 로그인
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 프로젝트 생성
3. **API 및 서비스** → **사용자 인증 정보**
4. **OAuth 2.0 클라이언트 ID** 생성
   - 승인된 리디렉션 URI: `https://your-backend-domain.railway.app/api/auth/google/callback`
5. **클라이언트 ID** 및 **클라이언트 보안 비밀번호** 복사

### 네이버 로그인
1. [네이버 개발자 센터](https://developers.naver.com) 접속
2. **애플리케이션 등록**
3. **Callback URL** 설정: `https://your-backend-domain.railway.app/api/auth/naver/callback`
4. **Client ID** 및 **Client Secret** 복사

---

## ✅ 5단계: 배포 후 확인

### 백엔드 확인
- [ ] `https://your-backend-domain.railway.app/health` 접속 → `{"status":"ok"}` 확인
- [ ] `https://your-backend-domain.railway.app/` 접속 → API 엔드포인트 목록 확인

### 프론트엔드 확인
- [ ] 메인 페이지 로드 확인
- [ ] 소셜 로그인 버튼 동작 확인
- [ ] 사진 업로드 기능 확인
- [ ] 지도 화면 동작 확인

### 기능 테스트
- [ ] 회원가입/로그인
- [ ] 사진 업로드
- [ ] 게시물 조회
- [ ] 지도에서 핀 클릭
- [ ] 뱃지 시스템
- [ ] 피드백 제출

---

## 🔒 보안 체크리스트

- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] 프로덕션 환경 변수가 GitHub에 노출되지 않았는지 확인
- [ ] JWT Secret이 강력한 랜덤 문자열인지 확인
- [ ] CORS 설정이 올바른지 확인
- [ ] 파일 업로드 크기 제한 설정 확인

---

## 🐛 문제 해결

### 백엔드 연결 오류
- MongoDB Atlas의 Network Access에서 IP 주소 확인
- 환경 변수 `MONGODB_URI` 확인
- 백엔드 로그 확인

### 프론트엔드 API 호출 오류
- `VITE_API_URL` 환경 변수 확인
- CORS 설정 확인
- 브라우저 콘솔 에러 확인

### 소셜 로그인 오류
- Redirect URI가 정확한지 확인
- 클라이언트 ID/Secret 확인
- 백엔드 환경 변수 확인

---

## 📞 지원

배포 중 문제가 발생하면:
1. 백엔드 로그 확인 (Railway/Render 대시보드)
2. 프론트엔드 빌드 로그 확인 (Vercel/Netlify 대시보드)
3. 브라우저 개발자 도구 콘솔 확인

---

## 🚀 빠른 배포 명령어

### 로컬 빌드 테스트
```bash
# 백엔드
cd backend
npm install
npm start

# 프론트엔드
cd web
npm install
npm run build
npm run preview
```

### 환경 변수 예시
```bash
# backend/.env.production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
NODE_ENV=production
FRONTEND_URL=https://livejourney.vercel.app
PORT=5000

# web/.env.production
VITE_API_URL=https://livejourney-backend.railway.app
```
