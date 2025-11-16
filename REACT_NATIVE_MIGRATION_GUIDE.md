# 📱 React Native 마이그레이션 가이드

현재 Capacitor 하이브리드 앱을 완전히 독립적인 React Native 네이티브 앱으로 전환하는 가이드입니다.

**목표**: 모든 디자인과 기능을 그대로 유지하면서 완전한 네이티브 앱으로 전환

---

## 📋 목차

1. [마이그레이션 전략](#마이그레이션-전략)
2. [프로젝트 구조](#프로젝트-구조)
3. [단계별 마이그레이션](#단계별-마이그레이션)
4. [주요 변경사항](#주요-변경사항)
5. [코드 변환 예시](#코드-변환-예시)

---

## 🎯 마이그레이션 전략

### 현재 상태
- **기술 스택**: React + Vite + Capacitor
- **앱 타입**: 하이브리드 앱 (웹뷰 기반)
- **디자인**: Tailwind CSS
- **라우팅**: React Router

### 목표 상태
- **기술 스택**: React Native + Expo (또는 React Native CLI)
- **앱 타입**: 완전 네이티브 앱
- **디자인**: React Native StyleSheet (Tailwind 대체)
- **라우팅**: React Navigation

### 선택: Expo vs React Native CLI

#### ✅ 추천: Expo (Managed Workflow)
- **장점**:
  - 빠른 개발 시작
  - OTA 업데이트 지원
  - 많은 네이티브 모듈 제공
  - 빌드 서비스 제공 (EAS Build)
- **단점**:
  - 일부 네이티브 모듈 제한
  - 커스텀 네이티브 코드 제한

#### 🔄 대안: React Native CLI
- **장점**:
  - 완전한 네이티브 코드 제어
  - 모든 네이티브 모듈 사용 가능
- **단점**:
  - 설정이 복잡
  - 빌드 환경 직접 관리 필요

**초기에는 Expo로 시작, 필요 시 eject 권장**

---

## 📁 프로젝트 구조

### 현재 구조
```
mvp1/
├── web/                    # React 웹 앱
│   ├── src/
│   │   ├── pages/          # 화면 컴포넌트
│   │   ├── components/     # 공통 컴포넌트
│   │   ├── contexts/       # Context API
│   │   ├── api/            # API 호출
│   │   └── utils/          # 유틸리티
│   └── android/            # Capacitor Android
└── backend/                # 백엔드 API
```

### 새로운 구조 (React Native)
```
mvp1/
├── mobile/                 # React Native 앱 (새로 생성)
│   ├── src/
│   │   ├── screens/        # 화면 컴포넌트 (pages → screens)
│   │   ├── components/     # 공통 컴포넌트
│   │   ├── contexts/       # Context API
│   │   ├── services/       # API 호출 (api → services)
│   │   ├── utils/          # 유틸리티
│   │   └── navigation/     # React Navigation 설정
│   ├── android/            # 네이티브 Android 코드
│   ├── ios/                # 네이티브 iOS 코드
│   └── app.json            # Expo 설정
├── web/                    # 기존 웹 앱 (유지 또는 제거)
└── backend/                # 백엔드 API (변경 없음)
```

---

## 🚀 단계별 마이그레이션

### Phase 1: 프로젝트 초기 설정 (1일)

#### 1.1 React Native 프로젝트 생성

```bash
# Expo로 프로젝트 생성
npx create-expo-app mobile --template blank

# 또는 React Native CLI
npx react-native init LiveJourneyMobile
```

#### 1.2 필수 패키지 설치

```bash
cd mobile

# 네비게이션
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs

# 네이티브 의존성
npx expo install react-native-screens react-native-safe-area-context

# 상태 관리 (기존 Context API 유지 가능)
# 또는 Redux, Zustand 등

# 스타일링 (Tailwind 대체)
npm install react-native-paper  # Material Design
# 또는
npm install nativewind  # Tailwind for React Native

# 이미지/카메라
npx expo install expo-image-picker expo-camera

# 위치 정보
npx expo install expo-location

# 지도 (Kakao Map 대체)
npm install react-native-maps
# 또는 Kakao Map SDK 직접 연동

# 저장소
npx expo install @react-native-async-storage/async-storage

# 네트워크 (axios는 그대로 사용 가능)
npm install axios

# 기타
npx expo install expo-status-bar expo-splash-screen
```

#### 1.3 프로젝트 구조 생성

```bash
cd mobile/src
mkdir screens components contexts services utils navigation
```

---

### Phase 2: 공통 코드 마이그레이션 (2-3일)

#### 2.1 API 서비스 (api → services)

**기존**: `web/src/api/posts.js`
```javascript
import api from './axios';

export const getPosts = async () => {
  const response = await api.get('/posts');
  return response.data;
};
```

**변경**: `mobile/src/services/posts.js`
```javascript
// axios는 그대로 사용 가능
import api from './axios';

export const getPosts = async () => {
  const response = await api.get('/posts');
  return response.data;
};
```

**변경사항**: 거의 없음 (axios는 React Native에서도 동작)

#### 2.2 유틸리티 함수

**기존**: `web/src/utils/timeUtils.js`
```javascript
export const getTimeAgo = (date) => {
  // ... 로직
};
```

**변경**: `mobile/src/utils/timeUtils.js`
```javascript
// 로직은 그대로 유지
export const getTimeAgo = (date) => {
  // ... 동일한 로직
};
```

**변경사항**: 거의 없음 (순수 JavaScript 함수)

#### 2.3 Context API

**기존**: `web/src/contexts/AuthContext.jsx`
```javascript
import { createContext, useState, useContext } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // ...
};
```

**변경**: `mobile/src/contexts/AuthContext.jsx`
```javascript
// React Native에서도 동일하게 동작
import { createContext, useState, useContext } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // ... 동일한 로직
};
```

**변경사항**: 거의 없음

---

### Phase 3: 화면 컴포넌트 마이그레이션 (5-7일)

#### 3.1 라우팅 변경

**기존**: React Router
```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<Route path="/main" element={<MainScreen />} />
```

**변경**: React Navigation
```javascript
// mobile/src/navigation/AppNavigator.js
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Main" component={MainScreen} />
        {/* ... */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

#### 3.2 스타일링 변경

**기존**: Tailwind CSS
```jsx
<div className="flex items-center justify-center bg-white">
  <h1 className="text-2xl font-bold">제목</h1>
</div>
```

**변경**: React Native StyleSheet
```jsx
import { View, Text, StyleSheet } from 'react-native';

<View style={styles.container}>
  <Text style={styles.title}>제목</Text>
</View>

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
```

**또는 NativeWind 사용** (Tailwind 유지)
```bash
npm install nativewind
```

```jsx
import { View, Text } from 'react-native';

<View className="flex-1 items-center justify-center bg-white">
  <Text className="text-2xl font-bold">제목</Text>
</View>
```

#### 3.3 HTML 요소 → React Native 컴포넌트

| 웹 (HTML) | React Native |
|-----------|--------------|
| `<div>` | `<View>` |
| `<span>`, `<p>`, `<h1>` | `<Text>` |
| `<img>` | `<Image>` |
| `<input>` | `<TextInput>` |
| `<button>` | `<Pressable>` 또는 `<TouchableOpacity>` |
| `<a>` | `<Pressable>` + `navigation.navigate()` |
| `<ul>`, `<li>` | `<FlatList>` 또는 `<ScrollView>` |

---

### Phase 4: 네이티브 기능 통합 (3-5일)

#### 4.1 이미지 선택/촬영

**기존**: Capacitor Camera
```javascript
import { Camera } from '@capacitor/camera';
```

**변경**: Expo Image Picker
```javascript
import * as ImagePicker from 'expo-image-picker';

const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });
  
  if (!result.canceled) {
    return result.assets[0].uri;
  }
};
```

#### 4.2 위치 정보

**기존**: 브라우저 Geolocation API
```javascript
navigator.geolocation.getCurrentPosition(...)
```

**변경**: Expo Location
```javascript
import * as Location from 'expo-location';

const getLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return;
  }
  
  const location = await Location.getCurrentPositionAsync({});
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
};
```

#### 4.3 지도 (Kakao Map)

**옵션 1**: React Native Maps (Google Maps)
```bash
npm install react-native-maps
```

**옵션 2**: Kakao Map SDK 직접 연동
- Android: Kakao Map SDK for Android
- iOS: Kakao Map SDK for iOS
- React Native Bridge로 연결

**옵션 3**: WebView로 Kakao Map 임베드 (임시)

---

### Phase 5: 스타일링 및 디자인 (3-5일)

#### 5.1 Tailwind → React Native StyleSheet 변환

**자동 변환 도구 사용**:
```bash
# Tailwind 클래스를 React Native StyleSheet로 변환
# 수동 변환 필요 (자동화 도구 제한적)
```

**수동 변환 가이드**:

| Tailwind | React Native |
|----------|--------------|
| `flex` | `flex: 1` |
| `flex-row` | `flexDirection: 'row'` |
| `items-center` | `alignItems: 'center'` |
| `justify-center` | `justifyContent: 'center'` |
| `bg-white` | `backgroundColor: '#ffffff'` |
| `text-2xl` | `fontSize: 24` |
| `font-bold` | `fontWeight: 'bold'` |
| `p-4` | `padding: 16` |
| `m-4` | `margin: 16` |
| `rounded-lg` | `borderRadius: 8` |
| `shadow-md` | `elevation: 5` (Android), `shadowColor`, `shadowOffset` (iOS) |

#### 5.2 공통 스타일 정의

```javascript
// mobile/src/utils/styles.js
export const colors = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  background: '#F9FAFB',
  text: '#111827',
  // ... 기존 Tailwind 색상 매핑
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = {
  h1: { fontSize: 32, fontWeight: 'bold' },
  h2: { fontSize: 24, fontWeight: 'bold' },
  body: { fontSize: 16 },
  // ...
};
```

---

## 📝 주요 변경사항 요약

### 1. 라우팅
- ❌ `react-router-dom` → ✅ `@react-navigation/native`

### 2. 스타일링
- ❌ Tailwind CSS → ✅ StyleSheet 또는 NativeWind

### 3. HTML 요소
- ❌ `<div>`, `<span>` → ✅ `<View>`, `<Text>`

### 4. 이미지
- ❌ `<img>` → ✅ `<Image>`

### 5. 입력
- ❌ `<input>`, `<textarea>` → ✅ `<TextInput>`

### 6. 버튼
- ❌ `<button>` → ✅ `<Pressable>` 또는 `<TouchableOpacity>`

### 7. 리스트
- ❌ `<ul>`, `<li>` → ✅ `<FlatList>` 또는 `<ScrollView>`

### 8. 네이티브 기능
- ❌ Capacitor Plugins → ✅ Expo Modules 또는 React Native Modules

---

## 💻 코드 변환 예시

### 예시 1: MainScreen

**기존 (React + Tailwind)**:
```jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const MainScreen = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="p-4 bg-white">
        <h1 className="text-2xl font-bold">메인 화면</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        {/* 콘텐츠 */}
      </div>
    </div>
  );
};
```

**변경 (React Native)**:
```jsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const MainScreen = () => {
  const navigation = useNavigation();
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>메인 화면</Text>
      </View>
      <ScrollView style={styles.content}>
        {/* 콘텐츠 */}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
});
```

### 예시 2: BottomNavigation

**기존**:
```jsx
<div className="fixed bottom-0 left-0 right-0 flex justify-around bg-white border-t">
  <button onClick={() => navigate('/main')}>홈</button>
  <button onClick={() => navigate('/map')}>지도</button>
  <button onClick={() => navigate('/upload')}>업로드</button>
  <button onClick={() => navigate('/profile')}>프로필</button>
</div>
```

**변경**:
```jsx
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const BottomNavigation = () => {
  const navigation = useNavigation();
  
  return (
    <View style={styles.container}>
      <Pressable onPress={() => navigation.navigate('Main')}>
        <Text>홈</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('Map')}>
        <Text>지도</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('Upload')}>
        <Text>업로드</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('Profile')}>
        <Text>프로필</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 12,
  },
});
```

**또는 React Navigation Tab Navigator 사용**:
```jsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

<Tab.Navigator>
  <Tab.Screen name="Main" component={MainScreen} />
  <Tab.Screen name="Map" component={MapScreen} />
  <Tab.Screen name="Upload" component={UploadScreen} />
  <Tab.Screen name="Profile" component={ProfileScreen} />
</Tab.Navigator>
```

---

## 🎨 디자인 유지 전략

### 1. 색상 팔레트 유지
```javascript
// mobile/src/constants/colors.js
export const COLORS = {
  // 기존 Tailwind 색상 그대로 사용
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  background: '#F9FAFB',
  // ...
};
```

### 2. 컴포넌트 재사용
- 공통 컴포넌트는 로직 그대로 유지
- 스타일만 React Native로 변환

### 3. 레이아웃 구조 유지
- Flexbox는 React Native에서도 동일하게 동작
- Grid는 `flexWrap`과 `flexDirection`으로 구현

---

## 📦 패키지 매핑

| 웹 패키지 | React Native 패키지 |
|-----------|-------------------|
| `react-router-dom` | `@react-navigation/native` |
| `tailwindcss` | `nativewind` 또는 `StyleSheet` |
| `@capacitor/camera` | `expo-image-picker` |
| `@capacitor/geolocation` | `expo-location` |
| `axios` | `axios` (그대로 사용) |
| `localStorage` | `@react-native-async-storage/async-storage` |

---

## ⚠️ 주의사항

1. **비동기 처리**: React Native는 비동기 처리가 더 중요 (네이티브 모듈 호출)
2. **성능**: `FlatList` 사용 권장 (긴 리스트)
3. **이미지 최적화**: `expo-image` 사용 권장
4. **플랫폼 차이**: Android/iOS 스타일 차이 고려
5. **테스트**: 실제 디바이스에서 테스트 필수

---

## 🚀 다음 단계

1. **프로젝트 생성**: Expo 프로젝트 생성
2. **공통 코드 마이그레이션**: API, utils, contexts
3. **화면 하나씩 마이그레이션**: MainScreen부터 시작
4. **네이티브 기능 통합**: 카메라, 위치, 지도
5. **스타일링 완성**: 디자인 정확히 매칭
6. **테스트**: 실제 디바이스에서 테스트
7. **빌드**: APK/IPA 생성

---

## 📚 참고 자료

- [React Native 공식 문서](https://reactnative.dev/)
- [Expo 문서](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [NativeWind (Tailwind for RN)](https://www.nativewind.dev/)

---

## 💡 팁

1. **점진적 마이그레이션**: 한 화면씩 마이그레이션
2. **공통 코드 우선**: API, utils 먼저 마이그레이션
3. **스타일 변환 도구**: 수동 변환이 더 정확
4. **디자인 시스템**: 색상, 간격 등 상수로 정의
5. **컴포넌트 재사용**: 가능한 한 재사용 가능한 컴포넌트로


