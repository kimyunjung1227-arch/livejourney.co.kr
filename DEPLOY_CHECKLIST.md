# ✅ 배포 체크리스트

배포 전에 이 체크리스트를 따라하세요!

## 📋 사전 준비

### 계정 생성
- [ ] GitHub 계정 (이미 있음)
- [ ] Render 계정 생성: https://render.com
- [ ] Vercel 계정 생성: https://vercel.com
- [ ] MongoDB Atlas 계정 생성: https://www.mongodb.com/cloud/atlas

---

## 🗄️ MongoDB Atlas 설정

### 클러스터 생성
- [ ] 무료 M0 클러스터 생성
- [ ] 클러스터 생성 완료 대기 (5-10분)

### 데이터베이스 사용자 생성
- [ ] Database Access → Add New Database User
- [ ] Username: `livejourney`
- [ ] Password: 강력한 비밀번호 생성 및 저장
- [ ] Database User Privileges: Read and write to any database

### 네트워크 접근 설정
- [ ] Network Access → Add IP Address
- [ ] Allow Access from Anywhere (0.0.0.0/0) 선택
- [ ] 또는 Render IP만 허용 (더 안전)

### 연결 문자열 가져오기
- [ ] Database → Connect → Connect your application
- [ ] Connection String 복사
- [ ] `<username>`과 `<password>`를 실제 값으로 교체
- [ ] 연결 문자열 저장 (나중에 사용)

---

## 🔧 Render 백엔드 배포

### 프로젝트 생성
- [ ] Render 대시보드 → New + → Web Service
- [ ] GitHub 저장소 연결
- [ ] 저장소 선택

### 서비스 설정
- [ ] Name: `livejourney-backend`
- [ ] Environment: `Node`
- [ ] Region: `Singapore` (또는 가장 가까운 지역)
- [ ] Branch: `master` (또는 `main`)
- [ ] Root Directory: `backend`
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] Plan: `Free`

### 환경 변수 설정
- [ ] Environment Variables 탭 클릭
- [ ] 다음 변수들 추가:

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=(MongoDB Atlas에서 복사한 연결 문자열)
JWT_SECRET=(랜덤 문자열 생성 - 예: openssl rand -hex 32)
SESSION_SECRET=(랜덤 문자열 생성 - 예: openssl rand -hex 32)
FRONTEND_URL=(Vercel 배포 후 업데이트)
```

### 선택적 환경 변수 (나중에 추가 가능)
```env
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GEMINI_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 배포 실행
- [ ] Create Web Service 클릭
- [ ] 배포 완료 대기 (5-10분)
- [ ] 배포 완료 후 URL 확인: `https://livejourney-backend.onrender.com`
- [ ] 브라우저에서 접속하여 "Cannot GET /" 또는 JSON 응답 확인

---

## 🌐 Vercel 프론트엔드 배포

### 프로젝트 생성
- [ ] Vercel 대시보드 → Add New Project
- [ ] GitHub 저장소 연결
- [ ] 저장소 선택

### 프로젝트 설정
- [ ] Framework Preset: `Vite`
- [ ] Root Directory: `web`
- [ ] Build Command: `npm run build` (자동 감지됨)
- [ ] Output Directory: `dist` (자동 감지됨)
- [ ] Install Command: `npm install` (자동 감지됨)

### 환경 변수 설정
- [ ] Environment Variables 탭 클릭
- [ ] 다음 변수 추가:

```env
VITE_API_URL=https://livejourney-backend.onrender.com/api
```

### 선택적 환경 변수
```env
VITE_KAKAO_MAP_API_KEY=(카카오 맵 API 키)
```

### 배포 실행
- [ ] Deploy 클릭
- [ ] 배포 완료 대기 (2-3분)
- [ ] 배포 완료 후 URL 확인: `https://your-app.vercel.app`
- [ ] URL 복사 및 저장

---

## 🔄 백엔드 CORS 업데이트

### Render 환경 변수 업데이트
- [ ] Render 대시보드로 돌아가기
- [ ] Environment Variables 수정
- [ ] `FRONTEND_URL`을 Vercel URL로 업데이트
- [ ] Save Changes 클릭
- [ ] Manual Deploy → Deploy latest commit 실행

---

## ✅ 배포 확인

### API 연결 테스트
- [ ] 프론트엔드 URL 접속
- [ ] 브라우저 개발자 도구 (F12) 열기
- [ ] Network 탭 확인
- [ ] API 요청이 성공하는지 확인

### 기능 테스트
- [ ] 회원가입/로그인 테스트
- [ ] 게시물 작성 테스트
- [ ] 이미지 업로드 테스트
- [ ] 게시물 조회 테스트
- [ ] 검색 기능 테스트

### 에러 확인
- [ ] 브라우저 콘솔에 에러가 없는지 확인
- [ ] Network 탭에서 실패한 요청 확인
- [ ] Render Logs에서 백엔드 에러 확인
- [ ] Vercel Logs에서 프론트엔드 에러 확인

---

## 🔐 보안 확인

- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] GitHub에 민감한 정보가 커밋되지 않았는지 확인
- [ ] `JWT_SECRET`과 `SESSION_SECRET`이 강력한 랜덤 문자열인지 확인
- [ ] MongoDB 비밀번호가 강력한지 확인

---

## 📱 추가 설정 (선택사항)

### 커스텀 도메인
- [ ] Vercel에서 도메인 추가
- [ ] DNS 설정
- [ ] SSL 인증서 자동 발급 확인

### 모니터링
- [ ] Render에서 로그 확인 방법 숙지
- [ ] Vercel에서 로그 확인 방법 숙지
- [ ] MongoDB Atlas에서 모니터링 설정

---

## 🎉 완료!

모든 체크리스트를 완료했다면 배포가 성공적으로 완료된 것입니다!

**프론트엔드 URL**: ________________
**백엔드 URL**: ________________

---

## 🆘 문제 발생 시

1. **Render 로그 확인**: Render 대시보드 → Logs 탭
2. **Vercel 로그 확인**: Vercel 대시보드 → Deployments → 해당 배포 → Logs
3. **브라우저 콘솔 확인**: F12 → Console 탭
4. **Network 탭 확인**: F12 → Network 탭

---

**다음 단계**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) 참고
