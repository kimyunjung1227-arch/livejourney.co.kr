# 🚀 빠른 배포 가이드

이 가이드는 최소한의 단계로 LiveJourney를 배포하는 방법입니다.

## ⚡ 5분 배포 (Railway + Vercel)

### 1️⃣ MongoDB Atlas 설정 (2분)

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 접속 → 무료 계정 생성
2. **Create Cluster** → 무료 M0 선택 → 지역 선택 → 생성
3. **Database Access** → **Add New Database User**
   - Username: `livejourney`
   - Password: 강력한 비밀번호 생성 (복사해두기)
4. **Network Access** → **Add IP Address** → `0.0.0.0/0` (모든 IP 허용)
5. **Connect** → **Connect your application** → Connection String 복사
   - 예: `mongodb+srv://livejourney:password@cluster0.xxxxx.mongodb.net/livejourney?retryWrites=true&w=majority`

### 2️⃣ 백엔드 배포 (Railway) (2분)

1. [Railway](https://railway.app) 접속 → GitHub로 로그인
2. **New Project** → **Deploy from GitHub repo**
3. 저장소 선택 → **Add Service** → **GitHub Repo**
4. **Settings** → **Root Directory**: `backend` 설정
5. **Variables** 탭에서 환경 변수 추가:

```
MONGODB_URI=mongodb+srv://livejourney:password@cluster0.xxxxx.mongodb.net/livejourney?retryWrites=true&w=majority
JWT_SECRET=랜덤-강력한-문자열-생성-예: abc123xyz789
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-app.vercel.app (나중에 업데이트)
```

6. 배포 완료 후 생성된 URL 복사 (예: `https://livejourney-backend.railway.app`)

### 3️⃣ 프론트엔드 배포 (Vercel) (1분)

1. [Vercel](https://vercel.com) 접속 → GitHub로 로그인
2. **Add New Project** → 저장소 선택
3. 설정:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables** 추가:
   ```
   VITE_API_URL=https://livejourney-backend.railway.app (Railway에서 복사한 URL)
   ```
5. **Deploy** 클릭
6. 배포 완료 후 URL 복사 (예: `https://livejourney.vercel.app`)

### 4️⃣ 백엔드 환경 변수 업데이트

Railway로 돌아가서:
- `FRONTEND_URL`을 Vercel에서 받은 URL로 업데이트
- Railway 서비스 재배포

### 5️⃣ 확인

- 프론트엔드: `https://your-app.vercel.app` 접속
- 백엔드: `https://your-backend.railway.app/health` 접속 → `{"status":"ok"}` 확인

---

## 🔐 소셜 로그인 설정 (선택사항)

소셜 로그인을 사용하려면:

### 카카오
1. [카카오 개발자](https://developers.kakao.com) → 앱 생성
2. Redirect URI: `https://your-backend.railway.app/api/auth/kakao/callback`
3. Railway에 `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET` 추가

### 구글
1. [Google Cloud Console](https://console.cloud.google.com) → 프로젝트 생성
2. OAuth 2.0 클라이언트 ID 생성
3. Redirect URI: `https://your-backend.railway.app/api/auth/google/callback`
4. Railway에 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 추가

---

## ✅ 완료!

이제 다른 사람들도 앱을 사용할 수 있습니다! 🎉

**공유할 URL**: `https://your-app.vercel.app`

---

## 🐛 문제 해결

### 백엔드가 작동하지 않음
- Railway 로그 확인: **Deployments** → **View Logs**
- MongoDB 연결 확인: `MONGODB_URI` 환경 변수 확인

### 프론트엔드가 API를 호출하지 못함
- Vercel 환경 변수 확인: `VITE_API_URL`이 올바른지 확인
- 브라우저 콘솔에서 CORS 에러 확인

### 소셜 로그인이 작동하지 않음
- Redirect URI가 정확한지 확인
- 환경 변수가 올바르게 설정되었는지 확인
