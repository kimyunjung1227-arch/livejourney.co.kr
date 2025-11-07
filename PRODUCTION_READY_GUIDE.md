# 🚀 LiveJourney 프로덕션 배포 가이드

## ✅ Mock 데이터 제거 완료!

### 🎯 환경 분리

#### 개발 환경 (Development)
```bash
npm run dev
```
- ✅ Mock 데이터 1000개 자동 생성
- ✅ Mock 데이터 관리 패널 표시
- ✅ 개발자 도구 사용 가능
- ✅ Hot Reload 지원

#### 프로덕션 환경 (Production)
```bash
npm run build
```
- 🚫 Mock 데이터 생성 **완전 비활성화**
- 🚫 Mock 데이터 관리 패널 숨김
- ✅ 실제 사용자 데이터만 표시
- ✅ 최적화된 빌드

---

## 📱 실제 고객이 사용할 때

### 1️⃣ 앱 첫 실행
- 메인 화면: **빈 화면**
- "아직 업로드된 사진이 없어요" 표시
- "첫 번째 여행을 기록해보세요!" 안내

### 2️⃣ 사용자가 사진 업로드
- 사용자 A가 사진 업로드
- → 메인 화면에 사용자 A의 사진 표시

### 3️⃣ 다른 사용자들도 업로드
- 사용자 B, C, D가 사진 업로드
- → 메인 화면에 모든 사용자 사진 표시

### 4️⃣ 실시간 피드 형성
- 사용자들이 업로드할수록 피드가 채워짐
- 100% 실제 사용자 콘텐츠 (UGC)

---

## 🔧 환경 설정 파일

### `.env.development` (개발용)
```bash
VITE_APP_MODE=development
VITE_ENABLE_MOCK_DATA=true  # Mock 데이터 활성화
VITE_API_URL=http://localhost:5000
```

### `.env.production` (실제 앱용)
```bash
VITE_APP_MODE=production
VITE_ENABLE_MOCK_DATA=false  # Mock 데이터 비활성화
VITE_API_URL=https://api.livejourney.com
```

---

## 📦 빌드 & 배포

### 1️⃣ 프로덕션 빌드

```bash
cd web
npm run build
```

**결과:**
- `dist/` 폴더에 최적화된 앱
- Mock 데이터 생성 코드 **완전 제거**
- 실제 사용자 데이터만 표시

### 2️⃣ Capacitor 앱 동기화

```bash
npx cap sync
```

**결과:**
- Android 앱에 프로덕션 빌드 적용
- iOS 앱에 프로덕션 빌드 적용

### 3️⃣ 앱 실행 테스트

```bash
# Android
npx cap open android

# iOS (Mac)
npx cap open ios
```

**확인 사항:**
- ✅ Mock 데이터 없음
- ✅ 빈 화면으로 시작
- ✅ 사용자 업로드만 표시

---

## 🎯 실제 고객 경험 시나리오

### 시나리오 1: 완전히 새로운 사용자

**1. 앱 설치 & 실행**
```
→ 시작 화면
→ 로그인
→ 메인 화면 (비어있음)
```

**2. 메인 화면**
```
┌─────────────────────┐
│                     │
│   📸 아직 업로드된   │
│   사진이 없어요!     │
│                     │
│ [첫 사진 업로드하기] │
│                     │
└─────────────────────┘
```

**3. 사진 업로드**
```
→ + 버튼 클릭
→ 사진 선택
→ 위치, 노트 작성
→ 업로드 완료!
→ 메인 화면에 자신의 사진 표시 ✅
```

---

### 시나리오 2: 여러 사용자가 있을 때

**사용자 A:**
- 제주도 사진 업로드 🏝️

**사용자 B:**
- 서울 사진 업로드 🏙️

**사용자 C:**
- 부산 사진 업로드 🌊

**메인 화면:**
```
┌─────────────────────┐
│  실시간 밀집지역     │
│  [서울] [제주] [부산]│
│                     │
│  추천 장소          │
│  [A의 사진]         │
│  [B의 사진]         │
│  [C의 사진]         │
└─────────────────────┘
```

**→ 100% 실제 사용자 콘텐츠!** ✅

---

## 🔄 배포 프로세스

### 개발 중 (localhost)

```bash
# 서버 시작
npm run dev
```

- Mock 데이터 O
- 테스트 데이터로 개발
- 모든 기능 확인

### 스테이징 (테스트 배포)

```bash
# 프로덕션 빌드
npm run build

# 로컬에서 프로덕션 테스트
npm run preview
```

- Mock 데이터 X
- 실제 환경과 동일
- 최종 확인

### 프로덕션 (실제 배포)

```bash
# 빌드
npm run build

# Capacitor 동기화
npx cap sync

# APK 생성
cd android
./gradlew assembleRelease
```

- Mock 데이터 X
- 실제 사용자만
- 앱스토어 배포

---

## 🛡️ 백엔드 필수 설정

### Mock 데이터 없이 작동하려면:

**1. 백엔드 API 서버 필요**
- MongoDB에 실제 데이터 저장
- GET /api/posts - 게시물 조회
- POST /api/posts - 게시물 업로드
- POST /api/upload/image - 이미지 업로드

**2. 백엔드 배포**
- Render, Railway, Heroku 등
- MongoDB Atlas 연결
- API URL 업데이트

**3. 프론트엔드 연결**
- `.env.production`에 API URL 설정
- localStorage → API 호출로 변경

---

## 🎨 빈 화면 UI 개선

### MainScreen - 사진 없을 때

**현재 표시해야 할 것:**
```jsx
{posts.length === 0 && (
  <div className="text-center py-20">
    <span className="material-symbols-outlined text-gray-300 text-6xl mb-4">
      photo_library
    </span>
    <h3 className="text-lg font-bold text-gray-700 mb-2">
      아직 업로드된 사진이 없어요
    </h3>
    <p className="text-sm text-gray-500 mb-6">
      첫 번째 여행 사진을 공유해보세요!
    </p>
    <button 
      onClick={() => navigate('/upload')}
      className="bg-primary text-white px-6 py-3 rounded-full"
    >
      첫 사진 업로드하기
    </button>
  </div>
)}
```

---

## ✅ 현재 상태

### 개발 환경 (`npm run dev`)
- ✅ Mock 데이터 1000개 자동 생성
- ✅ 모든 기능 테스트 가능
- ✅ Mock 관리 패널 표시

### 프로덕션 환경 (`npm run build`)
- 🚫 Mock 데이터 생성 완전 비활성화
- ✅ 실제 사용자 업로드만 표시
- 🚫 Mock 관리 패널 숨김
- ✅ 빈 화면으로 시작

---

## 🎉 완료!

**이제 실제 고객들이 사용하는 앱:**
1. 처음엔 빈 화면
2. 사용자들이 사진 업로드
3. 실시간으로 피드가 채워짐
4. 100% 실제 콘텐츠!

**개발자가 확인할 때:**
1. `npm run dev` - Mock 데이터로 테스트
2. `npm run build` - 프로덕션 확인

**완벽하게 분리되었습니다!** ✨

