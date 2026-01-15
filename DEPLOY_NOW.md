# 🚀 지금 바로 배포하기

## ✅ 배포 준비 완료!

모든 설정이 완료되었습니다. 아래 단계를 따라 배포하세요.

---

## 📝 배포 체크리스트

### ✅ 완료된 항목
- [x] 프론트엔드 빌드 테스트 완료
- [x] 배포 설정 파일 생성 (vercel.json, railway.json)
- [x] 배포 가이드 작성
- [x] 환경 변수 템플릿 준비

### ⏳ 사용자가 해야 할 항목
- [ ] MongoDB Atlas 계정 생성 및 클러스터 설정
- [ ] Railway에 백엔드 배포
- [ ] Vercel에 프론트엔드 배포
- [ ] 환경 변수 설정

---

## 🎯 빠른 배포 (5분)

### 1️⃣ MongoDB Atlas (2분)
1. https://www.mongodb.com/cloud/atlas 접속
2. 무료 계정 생성 → 클러스터 생성
3. Database Access → 사용자 생성
4. Network Access → `0.0.0.0/0` 추가
5. Connect → Connection String 복사

### 2️⃣ Railway 백엔드 (2분)
1. https://railway.app 접속 → GitHub 로그인
2. New Project → Deploy from GitHub
3. 저장소 선택
4. Settings → Root Directory: `backend`
5. Variables에 환경 변수 추가:
   ```
   MONGODB_URI=복사한-연결-문자열
   JWT_SECRET=랜덤-강력한-문자열
   SESSION_SECRET=랜덤-강력한-문자열
   NODE_ENV=production
   PORT=5000
   FRONTEND_URL=https://your-app.vercel.app (나중에 업데이트)
   ```
6. 배포 완료 후 URL 복사

### 3️⃣ Vercel 프론트엔드 (1분)
1. https://vercel.com 접속 → GitHub 로그인
2. Add New Project → 저장소 선택
3. Root Directory: `web`
4. Environment Variables:
   ```
   VITE_API_URL=Railway에서-복사한-백엔드-URL
   ```
5. Deploy 클릭
6. 배포 완료 후 URL 복사

### 4️⃣ 환경 변수 업데이트
Railway로 돌아가서 `FRONTEND_URL`을 Vercel URL로 업데이트

---

## 📚 상세 가이드

- **AUTO_DEPLOY.md** - 자동 배포 가이드 (상세)
- **QUICK_DEPLOY.md** - 빠른 배포 가이드
- **DEPLOY_GUIDE.md** - 전체 배포 가이드

---

## 🎉 완료!

배포가 완료되면 다른 사람들도 앱을 사용할 수 있습니다!

**공유 URL**: Vercel에서 받은 URL
