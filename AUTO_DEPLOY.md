# 🚀 자동 배포 가이드

이 가이드는 **5분 안에** LiveJourney를 배포하는 방법을 안내합니다.

## 📋 사전 준비

1. **GitHub 저장소** 준비 (코드가 푸시되어 있어야 함)
2. **MongoDB Atlas** 계정 (무료)
3. **Vercel** 계정 (무료)
4. **Railway** 계정 (무료 크레딧 제공)

---

## 🎯 1단계: MongoDB Atlas 설정 (2분)

### 1.1 클러스터 생성
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 접속
2. "Build a Database" 클릭
3. "FREE" 플랜 선택
4. 클러스터 이름 입력 (예: `livejourney-cluster`)
5. "Create" 클릭

### 1.2 데이터베이스 사용자 생성
1. "Database Access" → "Add New Database User"
2. Username/Password 입력 (기억해두세요!)
3. "Add User" 클릭

### 1.3 네트워크 액세스 설정
1. "Network Access" → "Add IP Address"
2. "Allow Access from Anywhere" (0.0.0.0/0) 선택
3. "Confirm" 클릭

### 1.4 연결 문자열 복사
1. "Database" → "Connect"
2. "Connect your application" 선택
3. 연결 문자열 복사 (예: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/livejourney?retryWrites=true&w=majority`)

---

## 🚂 2단계: Railway에 백엔드 배포 (2분)

### 2.1 프로젝트 생성
1. [Railway](https://railway.app) 접속
2. "New Project" → "Deploy from GitHub repo"
3. 저장소 선택
4. "Add Service" → "Empty Service"

### 2.2 설정
1. Settings → "Root Directory" → `backend` 입력
2. Settings → "Start Command" → `npm start` 확인

### 2.3 환경 변수 설정
Settings → Variables에서 다음 추가:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/livejourney?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

**⚠️ 중요**: `FRONTEND_URL`은 아직 모르므로, 일단 임시로 설정하고 나중에 업데이트하세요.

### 2.4 배포 확인
1. "Deploy" 탭에서 배포 진행 상황 확인
2. 배포 완료 후 "Settings" → "Generate Domain" 클릭
3. 백엔드 URL 복사 (예: `https://livejourney-backend.railway.app`)

### 2.5 헬스 체크
브라우저에서 `https://your-backend-url.railway.app/health` 접속하여 확인

---

## 🌐 3단계: Vercel에 프론트엔드 배포 (1분)

### 3.1 프로젝트 생성
1. [Vercel](https://vercel.com) 접속
2. "Add New" → "Project"
3. GitHub 저장소 선택
4. "Import" 클릭

### 3.2 빌드 설정
- **Framework Preset**: Vite
- **Root Directory**: `web`
- **Build Command**: `npm run build` (자동 감지됨)
- **Output Directory**: `dist` (자동 감지됨)

### 3.3 환경 변수 설정
"Environment Variables"에서 추가:

```bash
VITE_API_URL=https://your-backend-url.railway.app
```

**⚠️ 중요**: Railway에서 복사한 백엔드 URL을 사용하세요.

### 3.4 배포
1. "Deploy" 클릭
2. 배포 완료 대기 (약 1-2분)
3. 프론트엔드 URL 확인 (예: `https://livejourney.vercel.app`)

---

## 🔄 4단계: 환경 변수 업데이트

### 4.1 Railway 업데이트
Railway → Settings → Variables에서:

```bash
FRONTEND_URL=https://your-frontend-url.vercel.app
```

Vercel에서 받은 프론트엔드 URL로 업데이트하세요.

### 4.2 Railway 재배포
Railway에서 "Redeploy" 클릭하여 변경사항 적용

---

## ✅ 5단계: 배포 확인

### 5.1 프론트엔드 확인
1. Vercel URL 접속
2. 앱이 정상적으로 로드되는지 확인
3. 콘솔에서 에러 확인

### 5.2 백엔드 확인
1. `https://your-backend-url.railway.app/health` 접속
2. JSON 응답 확인

### 5.3 통합 테스트
1. 프론트엔드에서 사진 업로드 테스트
2. 로그인 테스트 (소셜 로그인 설정된 경우)
3. 지도 기능 테스트

---

## 🔐 소셜 로그인 설정 (선택)

### 카카오
1. [Kakao Developers](https://developers.kakao.com) 접속
2. 앱 생성 → "플랫폼 추가" → "Web"
3. Redirect URI: `https://your-backend-url.railway.app/api/auth/kakao/callback`
4. Client ID/Secret 복사
5. Railway 환경 변수에 추가:
   ```bash
   KAKAO_CLIENT_ID=your-kakao-client-id
   KAKAO_CLIENT_SECRET=your-kakao-client-secret
   KAKAO_CALLBACK_URL=https://your-backend-url.railway.app/api/auth/kakao/callback
   ```

### 구글
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 프로젝트 생성 → "API 및 서비스" → "사용자 인증 정보"
3. OAuth 2.0 클라이언트 ID 생성
4. 승인된 리디렉션 URI: `https://your-backend-url.railway.app/api/auth/google/callback`
5. Railway 환경 변수에 추가:
   ```bash
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=https://your-backend-url.railway.app/api/auth/google/callback
   ```

---

## 🐛 문제 해결

### 백엔드 연결 실패
- MongoDB Atlas의 네트워크 액세스 확인
- Railway 환경 변수 `MONGODB_URI` 확인
- Railway 로그 확인: "Deploy" → "View Logs"

### 프론트엔드 API 호출 실패
- Vercel 환경 변수 `VITE_API_URL` 확인
- CORS 설정 확인 (Railway의 `FRONTEND_URL` 확인)
- 브라우저 콘솔에서 에러 확인

### 빌드 실패
- Railway/Vercel 로그 확인
- `package.json`의 `engines` 필드 확인
- Node.js 버전 확인 (18+ 필요)

---

## 📞 도움말

- **Railway 문서**: https://docs.railway.app
- **Vercel 문서**: https://vercel.com/docs
- **MongoDB Atlas 문서**: https://docs.atlas.mongodb.com

---

## ✨ 완료!

축하합니다! 이제 다른 사람들도 LiveJourney를 사용할 수 있습니다! 🎉

**다음 단계:**
- 사용자들에게 앱 URL 공유
- 피드백 수집
- 기능 개선
