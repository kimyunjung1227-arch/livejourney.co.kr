# LiveJourney API 문서

## 기본 정보
- Base URL: `http://localhost:5000/api`
- 인증: Bearer Token (JWT)
- Content-Type: `application/json`

## 인증

### 회원가입
```http
POST /users/signup
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "사용자이름"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "username": "사용자이름",
    "points": 100,
    "profileImage": ""
  }
}
```

### 로그인
```http
POST /users/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Google 소셜 로그인
```http
POST /users/login/google
```

**Request Body:**
```json
{
  "email": "user@gmail.com",
  "name": "사용자이름",
  "googleId": "google-user-id",
  "profileImage": "https://..."
}
```

### Kakao 소셜 로그인
```http
POST /users/login/kakao
```

---

## 사용자 프로필

### 내 정보 조회
```http
GET /users/me
Authorization: Bearer {token}
```

### 프로필 수정
```http
PUT /users/me
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "username": "새이름",
  "bio": "자기소개",
  "profileImage": "/uploads/image.jpg",
  "notificationSettings": {
    "push": true,
    "email": true,
    "likes": true,
    "comments": true,
    "follows": true
  }
}
```

### 비밀번호 변경
```http
PUT /users/password
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

### 계정 삭제
```http
DELETE /users/me
Authorization: Bearer {token}
```

---

## 게시물 (Posts)

### 게시물 목록 조회
```http
GET /posts?page=1&limit=20&region=서울&isRealtime=true
```

**Query Parameters:**
- `page`: 페이지 번호 (기본: 1)
- `limit`: 페이지당 항목 수 (기본: 20)
- `region`: 지역 필터 (선택)
- `isRealtime`: 실시간 게시물 필터 (선택)
- `userId`: 특정 사용자 게시물 (선택)

### 게시물 상세 조회
```http
GET /posts/:postId
```

### 게시물 작성
```http
POST /posts
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "images": ["/uploads/image1.jpg", "/uploads/image2.jpg"],
  "content": "게시물 내용",
  "location": {
    "name": "서울 명동",
    "lat": 37.5636,
    "lon": 126.9838,
    "region": "서울",
    "country": "한국"
  },
  "tags": ["여행", "맛집"],
  "isRealtime": true
}
```

**Response:**
```json
{
  "success": true,
  "post": { ... },
  "pointsEarned": 50
}
```

### 좋아요
```http
POST /posts/:postId/like
Authorization: Bearer {token}
```

### 댓글 작성
```http
POST /posts/:postId/comment
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "content": "댓글 내용"
}
```

### 질문 작성
```http
POST /posts/:postId/question
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "question": "질문 내용"
}
```

### 질문 답변
```http
POST /posts/questions/:questionId/answer
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "answer": "답변 내용"
}
```

---

## 포인트

### 포인트 잔액 조회
```http
GET /points/balance
Authorization: Bearer {token}
```

### 포인트 내역 조회
```http
GET /points/history?type=earn&period=month&page=1&limit=20
Authorization: Bearer {token}
```

**Query Parameters:**
- `type`: earn | spend (선택)
- `period`: today | week | month | year (선택)
- `page`: 페이지 번호
- `limit`: 페이지당 항목 수

---

## 보상 (Rewards)

### 보상 목록 조회
```http
GET /rewards?category=voucher&page=1&limit=20
```

### 보상 상세 조회
```http
GET /rewards/:rewardId
```

### 보상 교환
```http
POST /rewards/:rewardId/exchange
Authorization: Bearer {token}
```

### 내 교환 내역
```http
GET /rewards/my/history?page=1&limit=20
Authorization: Bearer {token}
```

---

## 검색

### 통합 검색
```http
GET /search?q=제주도&type=all&page=1&limit=20
```

**Query Parameters:**
- `q`: 검색어 (필수)
- `type`: all | posts | users | locations (기본: all)

### 인기 검색어
```http
GET /search/trending
```

### 자동완성
```http
GET /search/autocomplete?q=제주
```

---

## 위치 기반

### 주변 게시물 조회
```http
GET /locations/nearby?lat=37.5636&lon=126.9838&radius=5000
```

**Query Parameters:**
- `lat`: 위도 (필수)
- `lon`: 경도 (필수)
- `radius`: 반경 (미터, 기본: 5000)

### 지역별 인기 장소
```http
GET /locations/popular?region=서울&limit=10
```

### 지역별 게시물
```http
GET /locations/region/:region?page=1&limit=20
```

### 모든 지역 목록
```http
GET /locations/regions
```

---

## 지도

### 지도 마커 데이터
```http
GET /map/markers?bounds=37.5,126.9,37.6,127.0&region=서울
```

**Query Parameters:**
- `bounds`: minLat,minLon,maxLat,maxLon (선택)
- `region`: 지역 필터 (선택)

### 클러스터링 데이터
```http
GET /map/clusters?zoom=10&bounds=37.5,126.9,37.6,127.0
```

### 실시간 밀집 지역
```http
GET /map/crowded
```

---

## 파일 업로드

### 단일 이미지 업로드
```http
POST /upload/image
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
- `image`: 이미지 파일

### 다중 이미지 업로드
```http
POST /upload/images
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
- `images`: 이미지 파일 배열 (최대 10개)

### 프로필 이미지 업로드
```http
POST /upload/profile
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
- `profile`: 프로필 이미지 파일

---

## 정책

### 서비스 이용약관
```http
GET /policies/terms
```

### 개인정보 처리방침
```http
GET /policies/privacy
```

### 위치 기반 서비스 이용약관
```http
GET /policies/location
```

### FAQ
```http
GET /policies/faq
```

---

## 포인트 적립 규칙

| 활동 | 포인트 |
|------|--------|
| 회원가입 | 100P |
| 게시물 작성 | 50P |
| 댓글 작성 | 10P |
| 질문 답변 | 15P |
| 좋아요 | 5P |
| 질문 작성 | 5P |

---

## 에러 응답

모든 에러는 다음 형식으로 반환됩니다:

```json
{
  "error": "에러 메시지",
  "message": "상세 메시지 (선택)"
}
```

### HTTP 상태 코드
- `200`: 성공
- `201`: 생성 성공
- `400`: 잘못된 요청
- `401`: 인증 실패
- `404`: 리소스 없음
- `500`: 서버 오류






















