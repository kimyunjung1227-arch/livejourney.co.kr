# 📱 LiveJourney Mobile App (메인)

> **이것은 실제 사용자를 위한 메인 앱입니다.**

과거의 정보가 아닌, 지금 당신의 눈 앞에 펼쳐진 여정(Journey)을 가장 스마트하고 즐겁게 완성합니다.

React Native + Expo로 개발된 독립적인 네이티브 앱으로, Android/iOS 스토어 배포 대상입니다.

## 🎯 역할

- ✅ **실제 사용자를 위한 메인 서비스**
- ✅ 완전한 기능과 최적화된 UX
- ✅ 앱 스토어 배포 준비 완료
- ✅ 프로덕션 환경용

> 💡 **참고**: 웹 앱(`web/`)은 개발 확인용이며, 실제 서비스는 이 모바일 앱입니다.

## 설치 및 실행

### 1. 의존성 설치

```bash
cd mobile
npm install
```

### 2. 실행 방법 선택

#### 방법 A: Android Studio로 독립적인 네이티브 앱 실행 (권장)

**완전히 독립적인 앱으로 실행됩니다 (Expo Go 불필요!)**

1. **배치 파일 실행** (가장 쉬운 방법)
   ```bash
   mobile\start.bat
   ```
   또는 직접:
   ```bash
   mobile\RUN_ANDROID_STUDIO.bat
   ```
   이 스크립트가 자동으로:
   - 의존성 확인 및 설치
   - Android 네이티브 코드 확인
   - Android Studio 자동 실행

2. **Android Studio에서 실행**
   - Gradle 동기화 대기 (2-5분)
   - `Run` → `Run 'app'` 클릭 (또는 `Shift + F10`)
   - 에뮬레이터 또는 실제 디바이스 선택
   - 앱이 독립적으로 설치되고 실행됩니다!

📖 **빠른 시작 가이드**: [ANDROID_STUDIO_QUICK_START.md](./ANDROID_STUDIO_QUICK_START.md)

#### 방법 B: Expo Go로 빠르게 확인

**Expo Go 앱이 필요합니다**

```bash
npm start
```

그 다음:
- Expo Go 앱 설치 후 QR 코드 스캔
- 또는 `npm run android` (에뮬레이터/디바이스 필요)

#### 방법 C: 명령줄로 직접 실행

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

## 📱 Android Studio vs Expo Go

| 항목 | Expo Go | Android Studio |
|------|---------|----------------|
| **앱 형태** | Expo Go 앱 내에서 실행 | ✅ 독립적인 네이티브 앱 |
| **필수 앱** | Expo Go 설치 필요 | ❌ 필요 없음 |
| **앱 아이콘** | Expo Go 아이콘 | ✅ LiveJourney 아이콘 |
| **네이티브 기능** | 제한적 | ✅ 완전 지원 |
| **배포** | 불가능 | ✅ APK/AAB 생성 가능 |

**권장**: Android Studio에서 실행하면 완전히 독립적인 앱으로 테스트할 수 있습니다!

## 참고

- 백엔드 API 서버가 실행 중이어야 합니다
- 이미지 선택을 위해서는 권한이 필요합니다
- 지도 기능을 위해서는 Google Maps API 키가 필요할 수 있습니다

## 📚 추가 문서

- [Android Studio 네이티브 앱 가이드](./ANDROID_STUDIO_NATIVE_GUIDE.md) - 독립적인 앱으로 실행하기
- [Expo 실행 가이드](./EXPO_RUN_GUIDE.md) - Expo Go로 빠르게 확인
- [Android 빌드 가이드](../ANDROID_BUILD_GUIDE.md) - 전체 빌드 프로세스


