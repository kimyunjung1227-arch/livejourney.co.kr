# 📱 React Native 앱 초기 설정 가이드

독립적인 네이티브 앱을 만들기 위한 초기 설정 단계입니다.

---

## 🎯 목표

현재 React + Capacitor 하이브리드 앱을 **완전히 독립적인 React Native 네이티브 앱**으로 전환

**모든 디자인과 기능은 그대로 유지**

---

## 📋 사전 준비

### 1. Node.js 설치 확인
```bash
node --version  # v18 이상 필요
npm --version
```

### 2. Expo CLI 설치
```bash
npm install -g expo-cli
```

### 3. Android Studio 설치 (Android 개발용)
- [Android Studio 다운로드](https://developer.android.com/studio)
- Android SDK 설치

### 4. Xcode 설치 (iOS 개발용, Mac만)
- App Store에서 Xcode 설치

---

## 🚀 Step 1: React Native 프로젝트 생성

### 1.1 프로젝트 생성

```bash
# 프로젝트 루트에서
cd C:\Users\wnd12\Desktop\mvp1

# Expo로 React Native 프로젝트 생성
npx create-expo-app mobile --template blank

# 또는 TypeScript 사용 시
npx create-expo-app mobile --template blank-typescript
```

### 1.2 프로젝트 구조 확인

생성된 구조:
```
mobile/
├── App.js              # 메인 앱 파일
├── app.json            # Expo 설정
├── package.json
├── android/            # Android 네이티브 코드
├── ios/                # iOS 네이티브 코드
└── assets/             # 이미지, 폰트 등
```

---

## 📦 Step 2: 필수 패키지 설치

### 2.1 네비게이션

```bash
cd mobile

# React Navigation
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs

# 네이티브 의존성
npx expo install react-native-screens react-native-safe-area-context
```

### 2.2 스타일링 (선택)

**옵션 1: NativeWind (Tailwind 유지)**
```bash
npm install nativewind
npm install --save-dev tailwindcss
```

**옵션 2: React Native Paper (Material Design)**
```bash
npm install react-native-paper react-native-vector-icons
```

**옵션 3: 순수 StyleSheet (권장 - 더 가벼움)**

### 2.3 네이티브 기능

```bash
# 이미지/카메라
npx expo install expo-image-picker expo-camera

# 위치 정보
npx expo install expo-location

# 저장소 (localStorage 대체)
npx expo install @react-native-async-storage/async-storage

# 상태바
npx expo install expo-status-bar

# 스플래시 스크린
npx expo install expo-splash-screen
```

### 2.4 네트워크 및 유틸리티

```bash
# HTTP 클라이언트 (기존 axios 그대로 사용)
npm install axios

# 지도 (Kakao Map 대체 또는 추가)
npm install react-native-maps

# 날짜/시간 처리
npm install date-fns

# 아이콘
npm install @expo/vector-icons
# 또는
npm install react-native-vector-icons
```

### 2.5 개발 도구

```bash
# 개발 모드
npm install --save-dev @babel/core
```

---

## 📁 Step 3: 프로젝트 구조 생성

```bash
cd mobile

# 디렉토리 생성
mkdir -p src/screens
mkdir -p src/components
mkdir -p src/contexts
mkdir -p src/services
mkdir -p src/utils
mkdir -p src/navigation
mkdir -p src/constants
mkdir -p src/assets/images
```

최종 구조:
```
mobile/
├── App.js
├── app.json
├── package.json
├── src/
│   ├── screens/          # 화면 컴포넌트 (기존 pages)
│   ├── components/       # 공통 컴포넌트
│   ├── contexts/        # Context API
│   ├── services/         # API 호출 (기존 api)
│   ├── utils/            # 유틸리티 함수
│   ├── navigation/       # React Navigation 설정
│   ├── constants/        # 상수 (색상, 간격 등)
│   └── assets/           # 이미지, 폰트
├── android/
└── ios/
```

---

## ⚙️ Step 4: 기본 설정 파일

### 4.1 app.json 설정

```json
{
  "expo": {
    "name": "LiveJourney",
    "slug": "livejourney",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.livejourney.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.livejourney.app",
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "앱에서 사진을 선택하기 위해 사진 권한이 필요합니다."
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "앱에서 위치 정보를 사용하기 위해 위치 권한이 필요합니다."
        }
      ]
    ]
  }
}
```

### 4.2 Babel 설정 (NativeWind 사용 시)

`babel.config.js`:
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // NativeWind 사용 시
      'nativewind/babel',
    ],
  };
};
```

### 4.3 Tailwind 설정 (NativeWind 사용 시)

`tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

---

## 🔄 Step 5: 기존 코드 마이그레이션 시작

### 5.1 API 서비스 마이그레이션

**기존**: `web/src/api/axios.js`
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  // ...
});

export default api;
```

**새로운**: `mobile/src/services/axios.js`
```javascript
import axios from 'axios';

// 개발 환경에서는 localhost 사용
// 프로덕션에서는 실제 서버 URL 사용
const BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api'  // Android 에뮬레이터: 10.0.2.2
  : 'https://your-api-server.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 토큰 인터셉터 (기존과 동일)
api.interceptors.request.use((config) => {
  // AsyncStorage에서 토큰 가져오기
  // ...
  return config;
});

export default api;
```

### 5.2 Context 마이그레이션

**기존**: `web/src/contexts/AuthContext.jsx`
**새로운**: `mobile/src/contexts/AuthContext.jsx`

변경사항:
- `localStorage` → `@react-native-async-storage/async-storage`
- 나머지는 거의 동일

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// localStorage.getItem → AsyncStorage.getItem
// localStorage.setItem → AsyncStorage.setItem
```

### 5.3 유틸리티 함수

대부분의 유틸리티 함수는 그대로 사용 가능:
- `timeUtils.js` - 그대로 사용
- `dateUtils.js` - 그대로 사용
- `badgeSystem.js` - 그대로 사용
- 등등...

---

## 🎨 Step 6: 스타일 상수 정의

`mobile/src/constants/styles.js`:
```javascript
// 기존 Tailwind 색상을 React Native 색상으로 매핑
export const COLORS = {
  // Primary
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#60A5FA',
  
  // Background
  background: '#F9FAFB',
  backgroundLight: '#FFFFFF',
  backgroundDark: '#111827',
  
  // Text
  text: '#111827',
  textSecondary: '#6B7280',
  textSubtle: '#9CA3AF',
  
  // Border
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // Status
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
  },
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
```

---

## 🧪 Step 7: 첫 번째 화면 마이그레이션 테스트

### 7.1 WelcomeScreen 마이그레이션

간단한 화면부터 시작하여 마이그레이션 프로세스 확인

### 7.2 실행 및 테스트

```bash
# 개발 서버 시작
npm start

# Android 에뮬레이터에서 실행
npm run android

# iOS 시뮬레이터에서 실행 (Mac만)
npm run ios

# 실제 디바이스에서 실행
# Expo Go 앱 설치 후 QR 코드 스캔
```

---

## 📝 체크리스트

### 초기 설정
- [ ] React Native 프로젝트 생성
- [ ] 필수 패키지 설치
- [ ] 프로젝트 구조 생성
- [ ] app.json 설정
- [ ] 스타일 상수 정의

### 코드 마이그레이션
- [ ] API 서비스 마이그레이션
- [ ] Context 마이그레이션
- [ ] 유틸리티 함수 마이그레이션
- [ ] 첫 번째 화면 마이그레이션 (WelcomeScreen)
- [ ] 네비게이션 설정
- [ ] 나머지 화면 마이그레이션

### 네이티브 기능
- [ ] 이미지 선택/촬영
- [ ] 위치 정보
- [ ] 지도 연동
- [ ] 푸시 알림

### 테스트 및 배포
- [ ] Android 빌드
- [ ] iOS 빌드
- [ ] 앱 스토어 등록

---

## 🚀 다음 단계

1. **REACT_NATIVE_MIGRATION_GUIDE.md** 참고하여 상세 마이그레이션 진행
2. 한 화면씩 점진적으로 마이그레이션
3. 공통 컴포넌트부터 시작
4. 디자인 정확히 매칭

---

## 💡 팁

1. **점진적 마이그레이션**: 한 번에 모든 것을 바꾸지 말고 단계적으로
2. **공통 코드 우선**: API, utils, contexts 먼저 마이그레이션
3. **실제 디바이스 테스트**: 에뮬레이터와 실제 디바이스 차이 확인
4. **성능 최적화**: `FlatList` 사용, 이미지 최적화
5. **에러 처리**: 네이티브 모듈 에러 처리 중요

---

## 📚 참고 문서

- [REACT_NATIVE_MIGRATION_GUIDE.md](./REACT_NATIVE_MIGRATION_GUIDE.md) - 상세 마이그레이션 가이드
- [React Native 공식 문서](https://reactnative.dev/)
- [Expo 문서](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)


