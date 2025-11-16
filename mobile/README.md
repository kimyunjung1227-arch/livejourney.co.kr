# LiveJourney Mobile App

React Native로 개발된 독립적인 네이티브 앱입니다.

## 설치 및 실행

### 1. 의존성 설치

```bash
cd mobile
npm install
```

### 2. 개발 서버 시작

```bash
npm start
```

### 3. 플랫폼별 실행

**Android:**
```bash
npm run android
```

**iOS (Mac만):**
```bash
npm run ios
```

**웹 (테스트용):**
```bash
npm run web
```

## 프로젝트 구조

```
mobile/
├── App.js                    # 메인 앱 파일
├── app.json                  # Expo 설정
├── package.json
├── src/
│   ├── screens/              # 화면 컴포넌트
│   ├── components/           # 공통 컴포넌트
│   ├── contexts/            # Context API
│   ├── services/            # API 호출
│   ├── utils/               # 유틸리티 함수
│   ├── navigation/          # React Navigation 설정
│   └── constants/           # 상수 (색상, 간격 등)
├── android/                 # Android 네이티브 코드
└── ios/                     # iOS 네이티브 코드
```

## 주요 기능

- ✅ 인증 (이메일, 소셜 로그인)
- ✅ 홈 화면
- ✅ 검색
- ✅ 업로드 (이미지 선택)
- ✅ 지도
- ✅ 프로필

## 환경 변수

개발 환경에서는 `http://localhost:5000/api`를 사용합니다.
실제 디바이스에서는 컴퓨터의 IP 주소를 사용해야 합니다.

Android 에뮬레이터: `10.0.2.2`
iOS 시뮬레이터: `localhost`
실제 디바이스: 컴퓨터의 로컬 IP 주소

## 빌드

### Android APK

```bash
expo build:android
```

### iOS IPA

```bash
expo build:ios
```

## 참고

- 백엔드 API 서버가 실행 중이어야 합니다
- 이미지 선택을 위해서는 권한이 필요합니다
- 지도 기능을 위해서는 Google Maps API 키가 필요할 수 있습니다


