# LiveJourney Backend API 🗺️

여행지 실시간 정보 공유 플랫폼 LiveJourney의 백엔드 API 서버입니다.

## 📋 목차
- [기술 스택](#기술-스택)
- [설치 및 실행](#설치-및-실행)
- [API 문서](#api-문서)
- [주요 기능](#주요-기능)
- [프로젝트 구조](#프로젝트-구조)

## 🛠 기술 스택

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **인증**: JWT (JSON Web Tokens)
- **파일 업로드**: Multer
- **소셜 로그인**: Passport (Google, Kakao)

## 🚀 설치 및 실행

### 1. MongoDB 설치 (필수)

**Windows:**
```bash
# MongoDB Community Edition 다운로드
# https://www.mongodb.com/try/download/community

# 또는 MongoDB Atlas (클라우드) 사용
# https://www.mongodb.com/cloud/atlas
```

### 2. 의존성 설치
```bash
cd backend
npm install
```

### 3. 환경 변수 설정
```bash
# env.example 파일을 .env로 복사
copy env.example .env

# .env 파일을 열어서 설정 수정
PORT=5000
MONGODB_URI=mongodb://localhost:27017/livejourney
JWT_SECRET=your-super-secret-key
```

### 4. 서버 실행
```bash
# 개발 모드 (nodemon)
npm run dev

# 프로덕션 모드
npm start
```

서버가 정상적으로 실행되면:
```
✅ MongoDB 연결 성공
🚀 서버가 포트 5000에서 실행 중입니다.
📍 http://localhost:5000
```

### 5. API 테스트
브라우저에서 http://localhost:5000 접속 시:
```json
{
  "message": "🗺️ LiveJourney API Server",
  "status": "running",
  "version": "1.0.0"
}
```

## 📚 API 문서

자세한 API 문서는 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)를 참고하세요.

### 주요 엔드포인트

| 카테고리 | 엔드포인트 | 설명 |
|---------|-----------|------|
| 인증 | `POST /api/users/signup` | 회원가입 |
| 인증 | `POST /api/users/login` | 로그인 |
| 게시물 | `GET /api/posts` | 게시물 목록 |
| 게시물 | `POST /api/posts` | 게시물 작성 |
| 포인트 | `GET /api/points/balance` | 포인트 조회 |
| 보상 | `GET /api/rewards` | 보상 목록 |
| 검색 | `GET /api/search` | 통합 검색 |
| 위치 | `GET /api/locations/nearby` | 주변 정보 |
| 지도 | `GET /api/map/markers` | 지도 마커 |

## ✨ 주요 기능

### A. 사용자 & 인증 ✅
- [x] 회원가입 / 로그인
- [x] JWT 토큰 인증
- [x] Google 소셜 로그인
- [x] Kakao 소셜 로그인
- [x] 프로필 관리
- [x] 비밀번호 변경
- [x] 계정 삭제

### B. 콘텐츠 (CRUD) ✅
- [x] 게시물 작성/조회/수정/삭제
- [x] 이미지 업로드
- [x] 댓글 작성
- [x] 좋아요 기능
- [x] 질문/답변 시스템
- [x] 실시간 정보 필터

### C. 파일 스토리지 ✅
- [x] 이미지 업로드 (Multer)
- [x] 다중 파일 업로드
- [x] 프로필 이미지 업로드
- [ ] AWS S3 연동 (선택사항)

### D. 검색 & 위치 기반 ✅
- [x] 통합 검색 (게시물, 사용자, 위치)
- [x] 위치 기반 주변 정보
- [x] 지역별 게시물 조회
- [x] 지도 마커 데이터
- [x] 실시간 밀집 지역
- [ ] 외부 지도 API 연동 (프론트엔드)

### E. 보상 시스템 ✅
- [x] 포인트 적립/사용
- [x] 포인트 내역 조회
- [x] 보상 목록 조회
- [x] 보상 교환
- [x] 뱃지 시스템
- [x] 활동별 포인트 부여

### F. 푸시 알림 🔜
- [ ] FCM 연동 (향후 추가 예정)

## 📁 프로젝트 구조

```
backend/
├── models/           # MongoDB 스키마
│   ├── User.js      # 사용자 모델
│   ├── Post.js      # 게시물 모델
│   ├── Point.js     # 포인트 모델
│   └── Reward.js    # 보상 모델
│
├── routes/          # API 라우트
│   ├── users.js     # 사용자 API
│   ├── posts.js     # 게시물 API
│   ├── points.js    # 포인트 API
│   ├── rewards.js   # 보상 API
│   ├── search.js    # 검색 API
│   ├── locations.js # 위치 API
│   ├── map.js       # 지도 API
│   ├── upload.js    # 파일 업로드 API
│   └── policies.js  # 정책 API
│
├── middleware/      # 미들웨어
│   └── auth.js      # JWT 인증
│
├── uploads/         # 업로드된 파일 저장
│
├── server.js        # 서버 진입점
├── package.json
├── env.example      # 환경 변수 예시
└── README.md
```

## 🔐 인증

API 요청 시 JWT 토큰을 사용합니다:

```http
Authorization: Bearer {your-jwt-token}
```

토큰은 로그인 또는 회원가입 시 발급됩니다.

## 💰 포인트 시스템

| 활동 | 포인트 |
|------|--------|
| 회원가입 | 100P |
| 게시물 작성 | 50P |
| 댓글 작성 | 10P |
| 질문 답변 | 15P |
| 좋아요 | 5P |
| 질문 작성 | 5P |

## 🗺️ 위치 기반 기능

### 주변 정보 조회
```http
GET /api/locations/nearby?lat=37.5636&lon=126.9838&radius=5000
```

### 실시간 밀집 지역
최근 1시간 이내 게시물이 많은 지역을 자동으로 분석합니다.

## 🐛 문제 해결

### MongoDB 연결 오류
```bash
# MongoDB가 실행 중인지 확인
mongod --version

# MongoDB 서비스 시작 (Windows)
net start MongoDB
```

### 포트 충돌
`.env` 파일에서 `PORT` 번호를 변경하세요.

### 파일 업로드 오류
`uploads/` 폴더가 존재하는지 확인하세요. 없으면 자동 생성됩니다.

## 📝 개발 팁

### 데이터베이스 초기화
```bash
# MongoDB 콘솔 접속
mongo

# 데이터베이스 선택
use livejourney

# 모든 컬렉션 삭제
db.dropDatabase()
```

### API 테스트
Postman, Insomnia 또는 Thunder Client 사용을 권장합니다.

## 🚀 배포

### Heroku
```bash
heroku create livejourney-api
heroku config:set MONGODB_URI=your-mongodb-atlas-uri
heroku config:set JWT_SECRET=your-secret-key
git push heroku main
```

### AWS / Azure
Docker를 사용하거나 직접 Node.js 환경 구성

## 📄 라이선스

MIT License

## 👥 기여

버그 리포트나 기능 제안은 이슈로 남겨주세요!











