# ⚡ LiveJourney - 빠른 시작 가이드

## 🎯 5분 안에 시작하기

### 1️⃣ 필수 프로그램 설치 확인

```bash
# Node.js 버전 확인 (18 이상 필요)
node --version

# MongoDB 설치 확인
mongod --version
```

아직 설치하지 않았다면:
- **Node.js**: https://nodejs.org/ 에서 다운로드
- **MongoDB**: https://www.mongodb.com/try/download/community 에서 다운로드

### 2️⃣ 프로젝트 의존성 설치

```bash
cd C:\Users\wnd12\Desktop\mvp1

# 백엔드
cd backend
npm install

# 웹
cd ../web
npm install
```

### 3️⃣ 환경 변수 설정

**backend/.env 파일 생성:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/livejourney
JWT_SECRET=livejourney_secret_key_2025
```

**web/.env 파일 생성:**
```env
VITE_API_URL=http://localhost:5000/api
```

### 4️⃣ MongoDB 시작

**Windows:**
```bash
net start MongoDB
```

**Mac/Linux:**
```bash
sudo systemctl start mongod
```

### 5️⃣ 서버 실행

**터미널 1 (백엔드):**
```bash
cd backend
npm start
```

**터미널 2 (웹):**
```bash
cd web
npm start
```

### 6️⃣ 브라우저에서 확인

🌐 **웹 앱**: http://localhost:3000

---

## ✅ 테스트 시나리오

### 1. 회원가입
1. http://localhost:3000 접속
2. "회원가입" 탭 클릭
3. 정보 입력:
   - 이메일: test@test.com
   - 비밀번호: test1234
   - 닉네임: 테스터
4. "회원가입" 버튼 클릭

### 2. 로그인 및 탐색
1. 자동으로 메인 화면으로 이동
2. 하단 네비게이션으로 각 화면 탐색:
   - 🏠 홈
   - 🔍 검색
   - ➕ 업로드
   - 🗺️ 지도
   - 👤 프로필

### 3. 여행 정보 업로드 (테스트)
1. ➕ 업로드 버튼 클릭
2. 사진 선택
3. 위치, 내용, 태그 입력
4. "완료" 버튼 클릭

---

## 🚨 문제 발생 시

### 백엔드가 시작되지 않는다면?
```bash
# MongoDB가 실행 중인지 확인
mongod --version

# 포트 5000이 사용 중인지 확인 (Windows)
netstat -ano | findstr :5000

# 포트 사용 중이면 프로세스 종료 또는 .env에서 다른 포트로 변경
```

### 웹이 API에 연결되지 않는다면?
1. 백엔드가 정상 실행 중인지 확인: http://localhost:5000
2. 브라우저 콘솔(F12)에서 에러 확인
3. `.env` 파일이 `web/` 폴더에 있는지 확인

### MongoDB 연결 오류가 발생한다면?
```bash
# MongoDB 시작
net start MongoDB

# 또는 무료 클라우드 DB 사용 (MongoDB Atlas)
# https://www.mongodb.com/cloud/atlas
# 연결 문자열을 backend/.env의 MONGODB_URI에 입력
```

---

## 📱 모바일 앱 실행 (선택사항)

```bash
cd app
npm install
npm start
```

그런 다음:
1. 스마트폰에 "Expo Go" 앱 설치
2. 터미널에 표시된 QR 코드 스캔

---

## 🎨 디자인 코드 적용 준비 완료!

이제 준비된 HTML/CSS 디자인 코드를 제공해주시면:
- 각 화면 컴포넌트에 적용
- 웹과 앱 모두 동일한 디자인으로 구현

디자인 코드를 제공해주세요! 🙂

