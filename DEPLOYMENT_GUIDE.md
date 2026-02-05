# 🚀 LiveJourney 실제 배포 가이드

이 가이드는 **실제로 작동하는** 프로덕션 배포를 위한 완전한 가이드입니다.

## 📋 배포 전 준비사항

### 1. 필요한 계정
- [ ] GitHub 계정
- [ ] Render 계정 (백엔드용) - https://render.com
- [ ] Vercel 계정 (프론트엔드용) - https://vercel.com
- [ ] MongoDB Atlas 계정 (데이터베이스용) - https://www.mongodb.com/cloud/atlas

### 2. 소셜 로그인 설정 (선택사항)
- [ ] 카카오 개발자 계정
- [ ] 네이버 개발자 계정
- [ ] 구글 클라우드 콘솔

---

## 🗄️ 1단계: MongoDB Atlas 설정

### 1.1 MongoDB Atlas 계정 생성
1. https://www.mongodb.com/cloud/atlas 접속
2. 무료 계정 생성 (M0 Free Tier)
3. 클러스터 생성 (약 5분 소요)

### 1.2 데이터베이스 접근 설정
1. **Database Access** → **Add New Database User**
   - Username: `livejourney`
   - Password: 강력한 비밀번호 생성 (저장해두세요!)
   - Database User Privileges: **Read and write to any database**

2. **Network Access** → **Add IP Address**
   - **Allow Access from Anywhere** 선택 (0.0.0.0/0)
   - 또는 Render IP만 허용 (더 안전)

### 1.3 연결 문자열 가져오기
1. **Database** → **Connect** 클릭
2. **Connect your application** 선택
3. Connection String 복사:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/livejourney?retryWrites=true&w=majority
   ```
4. `<username>`과 `<password>`를 실제 값으로 교체

---

## 🔧 2단계: 백엔드 배포 (Render)

### 2.1 Render 계정 생성 및 프로젝트 연결
1. https://render.com 접속
2. GitHub 계정으로 로그인
3. **New +** → **Web Service** 선택
4. GitHub 저장소 연결

### 2.2 서비스 설정
- **Name**: `livejourney-backend`
- **Environment**: `Node`
- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && npm start`
- **Root Directory**: `backend` (중요!)

### 2.3 환경 변수 설정
Render 대시보드에서 **Environment** 탭에 다음 변수 추가:

```env
# 서버 설정
NODE_ENV=production
PORT=10000

# MongoDB (1단계에서 복사한 연결 문자열)
MONGODB_URI=mongodb+srv://livejourney:비밀번호@cluster0.xxxxx.mongodb.net/livejourney?retryWrites=true&w=majority

# JWT 설정
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-랜덤문자열
JWT_EXPIRES_IN=7d
SESSION_SECRET=another-random-secret-key-랜덤문자열

# 프론트엔드 URL (3단계에서 배포 후 업데이트)
FRONTEND_URL=https://your-app.vercel.app

# 소셜 로그인 (선택사항)
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret
KAKAO_CALLBACK_URL=https://livejourney-backend.onrender.com/auth/kakao/callback

NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
NAVER_CALLBACK_URL=https://livejourney-backend.onrender.com/auth/naver/callback

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://livejourney-backend.onrender.com/auth/google/callback

# AI 태그 생성 (선택사항)
GEMINI_API_KEY=your_gemini_api_key
USE_AI_TAG_GENERATION=false

# Cloudinary (이미지 업로드용, 선택사항)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2.4 배포 확인
1. **Manual Deploy** → **Deploy latest commit** 클릭
2. 배포 완료까지 약 5-10분 대기
3. 배포 완료 후 URL 확인: `https://livejourney-backend.onrender.com`
4. 브라우저에서 접속하여 "Cannot GET /" 메시지 확인 (정상입니다!)

---

## 🌐 3단계: 프론트엔드 배포 (Vercel)

### 3.1 Vercel 계정 생성 및 프로젝트 연결
1. https://vercel.com 접속
2. GitHub 계정으로 로그인
3. **Add New Project** 클릭
4. 저장소 선택

### 3.2 프로젝트 설정
- **Framework Preset**: `Vite`
- **Root Directory**: `web`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3.3 환경 변수 설정
Vercel 대시보드에서 **Environment Variables**에 추가:

```env
# 백엔드 API URL (2단계에서 배포한 URL)
VITE_API_URL=https://livejourney-backend.onrender.com/api

# 카카오 맵 API (선택사항)
VITE_KAKAO_MAP_API_KEY=your_kakao_map_api_key
```

### 3.4 배포 확인
1. **Deploy** 클릭
2. 배포 완료까지 약 2-3분 대기
3. 배포 완료 후 URL 확인: `https://your-app.vercel.app`

### 3.5 백엔드 CORS 업데이트
프론트엔드 URL을 받은 후, Render 대시보드에서:
1. **Environment Variables** 수정
2. `FRONTEND_URL`을 실제 Vercel URL로 업데이트
3. **Save Changes** → **Manual Deploy** 실행

---

## ✅ 4단계: 배포 확인 및 테스트

### 4.1 API 연결 확인
1. 프론트엔드 URL 접속
2. 브라우저 개발자 도구 (F12) → **Network** 탭
3. API 요청이 성공하는지 확인

### 4.2 기능 테스트
- [ ] 회원가입/로그인
- [ ] 게시물 작성
- [ ] 이미지 업로드
- [ ] 게시물 조회
- [ ] 검색 기능

---

## 🔄 업데이트 배포

### 백엔드 업데이트
```bash
git add .
git commit -m "업데이트 내용"
git push origin master
```
→ Render가 자동으로 재배포합니다.

### 프론트엔드 업데이트
```bash
git add .
git commit -m "업데이트 내용"
git push origin master
```
→ Vercel이 자동으로 재배포합니다.

---

## 🛠️ 문제 해결

### 백엔드가 시작되지 않는 경우
1. Render **Logs** 탭에서 에러 확인
2. 환경 변수 확인 (특히 `MONGODB_URI`)
3. `package.json`의 `start` 스크립트 확인

### 프론트엔드에서 API 호출 실패
1. 브라우저 콘솔에서 에러 확인
2. `VITE_API_URL` 환경 변수 확인
3. CORS 에러인 경우, 백엔드 `FRONTEND_URL` 확인

### MongoDB 연결 실패
1. MongoDB Atlas **Network Access**에서 IP 허용 확인
2. 연결 문자열의 username/password 확인
3. 클러스터가 완전히 생성되었는지 확인 (5-10분 소요)

---

## 📱 모바일 앱 배포 (선택사항)

### Android APK 빌드
```bash
cd web
npm run build:android
cd android
./gradlew assembleRelease
```

### iOS 빌드 (Mac 필요)
```bash
cd web
npm run build
npx cap sync ios
npx cap open ios
```

---

## 💰 비용

### 무료 플랜으로 사용 가능
- **Render**: 무료 플랜 (15분 비활성 시 슬립 모드)
- **Vercel**: 무료 플랜 (충분한 트래픽 제공)
- **MongoDB Atlas**: 무료 M0 플랜 (512MB 저장공간)

### 업그레이드 권장 시점
- 사용자가 많아질 때
- 더 빠른 응답이 필요할 때
- 24/7 서비스가 필요할 때

---

## 🔐 보안 체크리스트

- [ ] `JWT_SECRET`과 `SESSION_SECRET`을 강력한 랜덤 문자열로 변경
- [ ] MongoDB 비밀번호를 강력하게 설정
- [ ] 소셜 로그인 콜백 URL을 실제 배포 URL로 업데이트
- [ ] 환경 변수에 실제 API 키 입력
- [ ] `.env` 파일을 `.gitignore`에 포함 확인

---

## 📞 지원

문제가 발생하면:
1. 각 플랫폼의 로그 확인
2. 브라우저 개발자 도구 확인
3. GitHub Issues에 문제 보고

---

**축하합니다! 🎉 이제 LiveJourney가 전 세계에서 접근 가능합니다!**
