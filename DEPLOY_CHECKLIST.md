# 배포 전 체크리스트

## 데이터 정리

### 1. 로컬 데이터 삭제

웹 앱에서:
1. 설정 화면 → "모든 데이터 삭제 (배포 전)" 클릭
2. 또는 개발자 콘솔에서:
```javascript
localStorage.clear();
```

### 2. 테스트 데이터 확인

- [ ] localStorage의 `uploadedPosts` 삭제 확인
- [ ] localStorage의 `savedRoutes` 삭제 확인
- [ ] 기타 테스트 데이터 삭제 확인

## 데이터베이스 설정

### 1. MongoDB 연결

- [ ] MongoDB 설치 또는 Atlas 계정 생성
- [ ] `.env` 파일에 `MONGODB_URI` 설정
- [ ] 데이터베이스 연결 테스트

### 2. 환경 변수

필수 환경 변수:
- [ ] `MONGODB_URI`
- [ ] `JWT_SECRET`
- [ ] `NODE_ENV=production`
- [ ] `FRONTEND_URL` (프로덕션 URL)
- [ ] `PORT` (또는 기본값 5000)

## 백엔드 배포

### 1. 서버 준비

- [ ] Node.js 18+ 설치 확인
- [ ] `npm install` 실행
- [ ] 환경 변수 설정
- [ ] 서버 시작 테스트

### 2. API 엔드포인트 확인

- [ ] `/health` - 헬스 체크
- [ ] `/api/feedback` - 피드백 API
- [ ] `/api/posts` - 게시물 API
- [ ] `/api/upload` - 업로드 API

## 프론트엔드 배포

### 1. 빌드

```bash
cd web
npm run build
```

- [ ] 빌드 성공 확인
- [ ] `dist` 폴더 생성 확인

### 2. 환경 변수

`.env.production` 파일:
```bash
VITE_API_URL=https://your-api-domain.com
```

## 피드백 기능 확인

### 1. 피드백 제출 테스트

- [ ] 설정 화면에서 "피드백 보내기" 버튼 클릭
- [ ] 피드백 모달 표시 확인
- [ ] 피드백 제출 성공 확인
- [ ] 데이터베이스에 저장 확인

### 2. 관리자 기능 (선택)

- [ ] 피드백 목록 조회 API 테스트
- [ ] 피드백 상태 업데이트 테스트
- [ ] 피드백 통계 조회 테스트

## 보안 체크

- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] 프로덕션 환경에서 디버그 로그 비활성화
- [ ] CORS 설정 확인
- [ ] 파일 업로드 크기 제한 확인

## 성능 체크

- [ ] 이미지 최적화 확인
- [ ] 데이터베이스 인덱스 확인
- [ ] API 응답 시간 확인
- [ ] 프론트엔드 번들 크기 확인

## 문서화

- [ ] API 문서 업데이트
- [ ] README 업데이트
- [ ] 배포 가이드 작성
