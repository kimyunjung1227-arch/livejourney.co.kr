# ⚡ 빠른 배포 가이드 (5분 버전)

## 🎯 목표
가장 빠르게 배포하여 실제로 작동하는 앱 만들기

## 📝 체크리스트

### 1. MongoDB Atlas 설정 (2분)
- [ ] https://www.mongodb.com/cloud/atlas 접속
- [ ] 무료 계정 생성
- [ ] 클러스터 생성 (M0 Free)
- [ ] Database Access에서 사용자 생성
- [ ] Network Access에서 0.0.0.0/0 허용
- [ ] 연결 문자열 복사

### 2. Render 백엔드 배포 (3분)
- [ ] https://render.com 접속
- [ ] GitHub 로그인
- [ ] New Web Service
- [ ] 저장소 선택
- [ ] 설정:
  - Name: `livejourney-backend`
  - Root Directory: `backend`
  - Build Command: `npm install`
  - Start Command: `npm start`
- [ ] 환경 변수 추가:
  ```
  NODE_ENV=production
  PORT=10000
  MONGODB_URI=(1단계에서 복사한 연결 문자열)
  FRONTEND_URL=(3단계 후 업데이트)
  JWT_SECRET=(랜덤 문자열)
  SESSION_SECRET=(랜덤 문자열)
  ```
- [ ] Deploy 클릭

### 3. Vercel 프론트엔드 배포 (2분)
- [ ] https://vercel.com 접속
- [ ] GitHub 로그인
- [ ] Add New Project
- [ ] 저장소 선택
- [ ] 설정:
  - Root Directory: `web`
  - Framework: Vite
- [ ] 환경 변수 추가:
  ```
  VITE_API_URL=https://livejourney-backend.onrender.com/api
  ```
- [ ] Deploy 클릭
- [ ] 배포 완료 후 URL 복사

### 4. 백엔드 CORS 업데이트 (1분)
- [ ] Render 대시보드로 돌아가기
- [ ] Environment Variables 수정
- [ ] `FRONTEND_URL`을 Vercel URL로 업데이트
- [ ] Manual Deploy 실행

## ✅ 완료!

이제 앱이 작동합니다! 🎉

**프론트엔드 URL**: https://your-app.vercel.app
**백엔드 URL**: https://livejourney-backend.onrender.com

## 🔍 확인 방법

1. 프론트엔드 URL 접속
2. 브라우저 개발자 도구 (F12) → Network 탭
3. API 요청이 성공하는지 확인

## ❗ 주의사항

- Render 무료 플랜은 15분 비활성 시 슬립 모드 (첫 요청 시 깨어나는데 30초 소요)
- MongoDB Atlas 무료 플랜은 충분합니다
- Vercel 무료 플랜도 충분합니다

## 🆘 문제 해결

**백엔드가 안 되면?**
- Render Logs 탭 확인
- MongoDB 연결 문자열 확인

**프론트엔드가 안 되면?**
- Vercel Logs 확인
- `VITE_API_URL` 환경 변수 확인

**API 호출 실패?**
- CORS 에러인지 확인
- `FRONTEND_URL`이 올바른지 확인

---

더 자세한 내용은 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) 참고
