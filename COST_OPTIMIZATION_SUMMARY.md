# 💰 비용 최소화 전략 요약

LiveJourney 앱의 데이터베이스, 서버, API 비용을 최소화하는 단계별 전략 요약입니다.

---

## 📊 단계별 비용 요약

| 단계 | 사용자 수 | 월 예상 비용 | 일회성/연간 비용 | 주요 서비스 |
|------|-----------|-------------|----------------|-------------|
| **초기** | ~1,000명 | **$0** | **$25** (Google Play 등록) | MongoDB Atlas Free, Render Free, FCM |
| **중반** | 1,000~10,000명 | **$14~$19** | - | MongoDB Atlas M2, Railway Hobby, FCM |
| **후반** | 10,000명 이상 | **$168~$183** | **$99/년** (iOS) | MongoDB Atlas M10, AWS EC2, S3+CloudFront, FCM |

---

## 🚀 초기 전략 (MVP ~ 1,000명)

### 목표: 완전 무료

#### 데이터베이스
- **MongoDB Atlas Free Tier (M0)**
  - 비용: $0
  - 제한: 512MB 스토리지
  - 장점: 클라우드 기반, 자동 백업 없음

#### 서버
- **Render Free Tier**
  - 비용: $0
  - 제한: 512MB RAM, 15분 슬리프 모드
  - 대안: Railway ($5 무료 크레딧), Fly.io (무료)

#### 파일 스토리지
- **로컬 파일 시스템**
  - 비용: $0
  - 최적화: 이미지 압축, 리사이징

#### 외부 API
- **날씨**: 기상청 공공데이터 (무료) ✅
- **지도**: Kakao Map API (무료, 일일 300,000건) ✅
- **AI 분석**: 로컬 분석 (무료) ✅

#### 앱 스토어
- **Google Play Store**
  - 비용: $25 (일회성 등록비)
  - 장점: 한 번만 결제하면 영구 사용
  - 초기 전략: Android만 배포

#### 푸시 알림
- **Firebase Cloud Messaging (FCM)**
  - 비용: 완전 무료
  - 제한: 없음 (무제한)
  - Android/iOS 모두 지원

**총 비용: $0/월 + $25 (초기 1회, Google Play 등록)**

---

## 📈 중반 전략 (1,000 ~ 10,000명)

### 목표: 월 $15~$20

#### 데이터베이스
- **MongoDB Atlas M2**
  - 비용: $9/월
  - 제한: 2GB 스토리지

#### 서버
- **Railway Hobby Plan**
  - 비용: $5~$10/월
  - 제한: 512MB~1GB RAM

#### 파일 스토리지
- **Cloudinary Free** (유지)
  - 비용: $0

#### 외부 API
- 기상청 + Kakao Map (무료 유지)

#### 앱 스토어
- Android: Google Play (이미 등록됨, $0)
- iOS: 선택사항 ($99/년, 사용자 5,000명 이상 시 고려)

**총 비용: $14~$19/월**

---

## 🚀 후반 전략 (10,000명 이상)

### 목표: 월 $170~$180

#### 데이터베이스
- **MongoDB Atlas M10**
  - 비용: $57/월
  - 제한: 10GB 스토리지, 전용 클러스터

#### 서버
- **AWS EC2 t3.small**
  - 비용: $20~$30/월

#### 파일 스토리지
- **AWS S3 + CloudFront**
  - 비용: $45~$50/월 (100GB 스토리지 + 500GB 대역폭)

#### 모니터링
- **Sentry + Logtail**
  - 비용: $46/월

#### 앱 스토어
- Android: Google Play ($0, 일회성 $25는 초기 지불)
- iOS: Apple App Store ($99/년, 사용자 10,000명 이상 시 필수)

**총 비용: $168~$183/월 + $99/년 (iOS)**

---

## 💡 핵심 최적화 전략

### 1. 무료 티어 최대한 활용
- MongoDB Atlas Free Tier
- Render/Railway 무료 티어
- Firebase Cloud Messaging (FCM) - 완전 무료
- 기상청 공공데이터 (무료)

### 2. 캐싱으로 API 호출 감소
- 메모리 캐시 (초기/중반)
- Redis 캐시 (후반)
- 정적 파일 캐싱

### 3. 이미지 최적화
- 서버 사이드 리사이징 (Sharp)
- 클라이언트 사이드 압축
- WebP 포맷 사용

### 4. 데이터베이스 쿼리 최적화
- 인덱스 적절히 설정
- lean() 사용으로 오버헤드 제거
- populate로 N+1 문제 해결

### 5. 불필요한 API 사용 안 함
- Google Vision API 사용 안 함 (로컬 분석 사용)
- 무료 API 우선 사용

---

## 📝 구현 체크리스트

### 초기 단계
- [x] MongoDB Atlas Free Tier 설정
- [x] Render/Railway 무료 티어 설정
- [ ] Google Play Store 등록 ($25 일회성)
- [ ] Firebase Cloud Messaging (FCM) 설정
- [ ] 이미지 최적화 적용 (Sharp 설치)
- [ ] 캐싱 미들웨어 적용
- [ ] 정적 파일 캐싱 설정

### 중반 단계
- [ ] MongoDB Atlas M2 업그레이드
- [ ] 서버 유료 플랜 전환
- [ ] 모니터링 도구 도입
- [ ] iOS 앱 배포 고려 (선택사항, $99/년)

### 후반 단계
- [ ] MongoDB Atlas M10 업그레이드
- [ ] AWS 인프라로 마이그레이션
- [ ] Redis 캐싱 도입
- [ ] CDN 설정
- [ ] iOS 앱 배포 (필수, $99/년)

---

## 🔗 관련 문서

1. **[COST_OPTIMIZATION_STRATEGY.md](./COST_OPTIMIZATION_STRATEGY.md)** - 상세 전략 문서
2. **[COST_OPTIMIZATION_IMPLEMENTATION.md](./COST_OPTIMIZATION_IMPLEMENTATION.md)** - 구현 가이드
3. **[backend/utils/cache.js](./backend/utils/cache.js)** - 캐싱 유틸리티
4. **[backend/utils/imageOptimizer.js](./backend/utils/imageOptimizer.js)** - 이미지 최적화 유틸리티
5. **[backend/middleware/cacheMiddleware.js](./backend/middleware/cacheMiddleware.js)** - 캐싱 미들웨어

---

## 🎯 다음 단계

1. **초기 단계 시작**:
   ```bash
   # Sharp 설치 (이미지 최적화)
   cd backend
   npm install sharp
   ```

2. **캐싱 적용**:
   - `backend/routes/posts.js`에 캐싱 미들웨어 추가
   - 게시물 생성/수정/삭제 시 캐시 무효화

3. **이미지 최적화 적용**:
   - `backend/routes/upload.js`에 이미지 최적화 로직 추가

4. **모니터링 설정**:
   - MongoDB Atlas 대시보드 확인
   - 서버 리소스 사용량 모니터링

---

## ⚠️ 주의사항

1. **무료 티어 한도**: 주기적으로 사용량 확인
2. **서버 슬리프 모드**: Render 무료 티어는 15분 비활성 시 슬리프
3. **스토리지 관리**: 오래된 데이터 정리로 스토리지 절약
4. **API 호출 제한**: Kakao Map API 일일 300,000건 제한 확인
5. **앱 스토어 등록**: Google Play는 $25 일회성, iOS는 $99/년
6. **Android 우선 전략**: 초기에는 Android만 배포하여 비용 절감

---

## 📞 문의

비용 최적화 관련 질문이나 도움이 필요하시면 이슈를 등록해주세요.

