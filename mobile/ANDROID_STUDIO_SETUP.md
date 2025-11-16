# 📱 Android Studio에서 앱 실행하기

Android Studio를 사용해서 LiveJourney 앱을 빌드하고 실행하는 방법입니다.

---

## 📋 사전 준비

### 1. Android Studio 설치
- [Android Studio 다운로드](https://developer.android.com/studio)
- 설치 후 Android SDK 설치

### 2. Node.js 및 npm 설치 확인
```bash
node --version  # v18 이상
npm --version
```

### 3. Expo CLI 설치
```bash
npm install -g expo-cli
```

---

## 🚀 Step 1: 프로젝트 설정

### 1.1 의존성 설치

```bash
cd mobile
npm install
```

### 1.2 Android 프로젝트 준비

```bash
# Expo prebuild 실행 (Android 폴더 생성)
npx expo prebuild --platform android

# 또는 직접 Android Studio에서 열기
```

---

## 🔧 Step 2: Android Studio에서 열기

### 2.1 Android Studio 실행

1. **Android Studio 실행**
2. **"Open an Existing Project"** 선택
3. `mobile/android` 폴더 선택
4. 프로젝트 로딩 대기 (Gradle 동기화)

### 2.2 SDK 설정 확인

**File → Project Structure → SDK Location**에서:
- Android SDK Location이 올바르게 설정되어 있는지 확인
- `local.properties` 파일이 자동 생성되는지 확인

**없다면 수동 생성:**
```bash
# mobile/android/local.properties 파일 생성
sdk.dir=C\:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
```

---

## 📱 Step 3: 에뮬레이터 설정

### 3.1 AVD (Android Virtual Device) 생성

1. **Tools → Device Manager**
2. **Create Device** 클릭
3. 디바이스 선택 (예: Pixel 5)
4. 시스템 이미지 선택 (API 33 이상 권장)
5. **Finish** 클릭

### 3.2 에뮬레이터 실행

- Device Manager에서 생성한 에뮬레이터의 **▶️ Play** 버튼 클릭
- 에뮬레이터가 부팅될 때까지 대기

---

## 🏃 Step 4: 앱 실행

### 방법 1: Android Studio에서 실행 (권장)

1. 상단 툴바에서 **디바이스 선택** (에뮬레이터 또는 실제 디바이스)
2. **▶️ Run 'app'** 버튼 클릭 (또는 `Shift + F10`)
3. 빌드 완료 후 앱이 자동으로 실행됩니다

### 방법 2: 명령줄에서 실행

```bash
cd mobile/android
./gradlew assembleDebug

# APK 생성 위치:
# mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

### 방법 3: Expo로 실행

```bash
cd mobile
npm start
# 그 다음 'a' 키를 눌러 Android 에뮬레이터에서 실행
```

---

## 🔨 Step 5: APK 빌드

### 5.1 Debug APK 빌드

**Android Studio에서:**
1. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. 빌드 완료 후 **locate** 클릭
3. APK 위치: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`

**명령줄에서:**
```bash
cd mobile/android
./gradlew assembleDebug
```

### 5.2 Release APK 빌드

**Android Studio에서:**
1. **Build → Generate Signed Bundle / APK**
2. **APK** 선택
3. 키스토어 생성 또는 기존 키스토어 사용
4. 빌드 타입: **release** 선택
5. **Finish** 클릭

**명령줄에서:**
```bash
cd mobile/android
./gradlew assembleRelease
```

---

## ⚙️ Step 6: 설정 및 권한

### 6.1 네트워크 설정 (로컬 서버 연결)

**AndroidManifest.xml**에 이미 설정되어 있음:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<application android:usesCleartextTraffic="true">
```

**실제 디바이스에서 테스트 시:**
- 컴퓨터와 디바이스가 같은 Wi-Fi에 연결되어 있어야 함
- `axios.js`에서 `localhost`를 컴퓨터의 IP 주소로 변경:
```javascript
const API_URL = __DEV__ 
  ? 'http://192.168.0.100:5000/api'  // 컴퓨터의 IP 주소
  : 'https://your-api-server.com/api';
```

### 6.2 권한 확인

앱 실행 시 다음 권한들이 요청됩니다:
- 📷 카메라 (이미지 촬영)
- 📁 저장소 (이미지 선택)
- 📍 위치 (지도 기능)

---

## 🐛 문제 해결

### 문제 1: Gradle 동기화 실패

**해결:**
```bash
cd mobile/android
./gradlew clean
./gradlew --refresh-dependencies
```

### 문제 2: SDK 경로 오류

**해결:**
- `local.properties` 파일 확인
- Android Studio → File → Project Structure → SDK Location 확인

### 문제 3: 빌드 에러

**해결:**
```bash
cd mobile/android
./gradlew clean
cd ../..
npm install
npx expo prebuild --clean
```

### 문제 4: Metro Bundler 연결 실패

**해결:**
```bash
# Metro 캐시 클리어
npm start -- --reset-cache
```

### 문제 5: 실제 디바이스에서 연결 안 됨

**해결:**
1. USB 디버깅 활성화 (설정 → 개발자 옵션)
2. 디바이스가 Android Studio에 표시되는지 확인
3. `adb devices` 명령어로 확인

---

## 📝 체크리스트

### 초기 설정
- [ ] Android Studio 설치
- [ ] Android SDK 설치
- [ ] Node.js 및 npm 설치
- [ ] 프로젝트 의존성 설치 (`npm install`)
- [ ] Expo prebuild 실행

### Android Studio 설정
- [ ] Android Studio에서 프로젝트 열기
- [ ] Gradle 동기화 완료
- [ ] SDK 경로 설정 확인
- [ ] 에뮬레이터 생성

### 앱 실행
- [ ] 에뮬레이터 실행
- [ ] 앱 빌드 및 실행 성공
- [ ] 권한 요청 확인
- [ ] 네트워크 연결 확인

### APK 빌드
- [ ] Debug APK 빌드 성공
- [ ] Release APK 빌드 (선택사항)

---

## 🎯 다음 단계

1. **앱 실행 확인**: 모든 화면이 정상적으로 표시되는지 확인
2. **기능 테스트**: 로그인, 업로드, 지도 등 기능 테스트
3. **성능 최적화**: 필요 시 성능 개선
4. **APK 배포**: Google Play Store에 업로드 준비

---

## 💡 팁

1. **빠른 실행**: Android Studio에서 `Shift + F10`으로 빠르게 실행
2. **로그 확인**: Logcat에서 앱 로그 확인 가능
3. **Hot Reload**: 코드 변경 시 자동으로 앱이 업데이트됨
4. **디바이스 선택**: 여러 디바이스에서 테스트 가능

---

## 📚 참고 자료

- [Android Studio 공식 문서](https://developer.android.com/studio)
- [React Native Android 가이드](https://reactnative.dev/docs/signed-apk-android)
- [Expo Android 가이드](https://docs.expo.dev/workflow/android-studio/)


