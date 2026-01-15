# 🚀 Android Studio 빠른 시작 가이드

안드로이드 스튜디오에서 LiveJourney 앱을 실행하는 가장 간단한 방법입니다.

---

## ⚡ 한 번에 실행하기

### Windows 사용자

1. **배치 파일 실행**
   ```powershell
   cd mobile
   RUN_ANDROID_STUDIO.bat
   ```

2. **Android Studio가 자동으로 열립니다!**

3. **Gradle 동기화 대기** (2-5분)
   - 하단 상태바에서 "Gradle Sync" 완료 확인

4. **앱 실행**
   - 상단 메뉴: `Run` → `Run 'app'`
   - 또는 녹색 재생 버튼 ▶ 클릭
   - 또는 `Shift + F10` 단축키

---

## 📋 수동으로 실행하기

### 1단계: Android Studio 열기

1. **Android Studio 실행**

2. **프로젝트 열기**
   - `File` → `Open`
   - **중요**: 다음 경로를 선택하세요
     ```
     C:\Users\wnd12\Desktop\mvp1\mobile\android
     ```
   - ⚠️ **주의**: `mobile` 폴더가 아닌 `android` 폴더를 직접 열어야 합니다!

### 2단계: Gradle 동기화

1. **자동 동기화 대기**
   - Android Studio가 자동으로 Gradle 동기화를 시작합니다
   - 하단 상태바에서 진행 상황 확인
   - "Build finished" 메시지가 나타날 때까지 대기 (2-5분)

2. **동기화 실패 시**
   - `File` → `Sync Project with Gradle Files`
   - 또는 `File` → `Invalidate Caches / Restart...` → `Invalidate and Restart`

### 3단계: 에뮬레이터 또는 디바이스 준비

#### 에뮬레이터 사용 (권장)

1. **에뮬레이터 생성**
   - `Tools` → `Device Manager`
   - `Create Device` 클릭
   - 디바이스 선택 (예: Pixel 5)
   - 시스템 이미지 선택 (API 33 이상 권장)
   - `Finish` 클릭

2. **에뮬레이터 실행**
   - Device Manager에서 생성한 에뮬레이터 선택
   - 재생 버튼 ▶ 클릭
   - 에뮬레이터가 부팅될 때까지 대기

#### 실제 디바이스 사용

1. **개발자 옵션 활성화**
   - 설정 → 휴대전화 정보 → 빌드 번호 7번 연속 터치

2. **USB 디버깅 활성화**
   - 설정 → 개발자 옵션 → USB 디버깅 켜기

3. **USB 연결**
   - USB 케이블로 컴퓨터에 연결
   - "USB 디버깅 허용" 확인

4. **Android Studio에서 확인**
   - 상단 디바이스 선택 드롭다운에서 연결된 디바이스 확인

### 4단계: 앱 실행

1. **디바이스 선택**
   - 상단 툴바에서 에뮬레이터 또는 실제 디바이스 선택

2. **앱 실행**
   - 상단 메뉴: `Run` → `Run 'app'`
   - 또는 녹색 재생 버튼 ▶ 클릭
   - 또는 `Shift + F10` 단축키

3. **빌드 및 설치 대기**
   - Android Studio가 자동으로 APK를 빌드하고 설치합니다
   - 첫 빌드는 3-5분 정도 소요될 수 있습니다

4. **앱 실행 확인**
   - 에뮬레이터/디바이스에 "LiveJourney" 앱 아이콘 표시
   - 앱이 자동으로 실행됩니다
   - ✅ **Expo Go 없이 독립적으로 실행됩니다!**

---

## ✅ 실행 확인

앱이 성공적으로 실행되면:

- ✅ 에뮬레이터/디바이스에 "LiveJourney" 앱 아이콘 표시
- ✅ 앱이 자동으로 실행됨
- ✅ Expo Go 앱이 필요 없음
- ✅ 완전히 독립적인 네이티브 앱으로 실행됨

---

## 🐛 문제 해결

### 문제 1: Android Studio가 열리지 않음

**해결:**
- Android Studio가 설치되어 있는지 확인
- 없으면 [다운로드](https://developer.android.com/studio)
- 배치 파일 대신 수동으로 Android Studio 실행 후 `File` → `Open` → `mobile\android` 폴더 선택

### 문제 2: Gradle 동기화 실패

**해결:**
```powershell
cd mobile\android
.\gradlew clean
.\gradlew --refresh-dependencies
```

그 다음 Android Studio에서:
- `File` → `Sync Project with Gradle Files`
- `File` → `Invalidate Caches / Restart...` → `Invalidate and Restart`

### 문제 3: SDK 경로 오류

**해결:**
- `mobile\android\local.properties` 파일 확인
- SDK 경로가 올바른지 확인:
  ```
  sdk.dir=C\:\\Users\\wnd12\\AppData\\Local\\Android\\Sdk
  ```
- Android Studio → `File` → `Project Structure` → `SDK Location` 확인

### 문제 4: 빌드 에러

**해결:**
```powershell
cd mobile
npm install
npx expo prebuild --platform android --clean
```

그 다음 Android Studio에서 다시 시도

### 문제 5: 에뮬레이터 실행 오류

**해결:**
- `Tools` → `SDK Manager` → Android SDK 확인
- 필요한 API 레벨 설치 (API 33 이상 권장)
- 에뮬레이터 재생성

### 문제 6: 디바이스가 인식되지 않음

**해결:**
1. USB 디버깅 활성화 확인
2. USB 케이블 교체
3. `adb devices` 명령어로 확인:
   ```powershell
   adb devices
   ```
4. 디바이스 드라이버 설치 확인

---

## 📚 추가 정보

### 앱 정보

- **앱 이름**: LiveJourney
- **패키지명**: `com.livejourney.app`
- **버전**: 1.0.0

### 빌드 파일 위치

- **Debug APK**: `mobile\android\app\build\outputs\apk\debug\app-debug.apk`
- **Release APK**: `mobile\android\app\build\outputs\apk\release\app-release.apk`

### 관련 문서

- [상세 가이드](ANDROID_STUDIO_NATIVE_GUIDE.md) - 더 자세한 정보
- [빌드 가이드](../../ANDROID_BUILD_GUIDE.md) - APK 빌드 방법
- [모바일 README](README.md) - 전체 앱 정보

---

## 💡 팁

1. **빠른 실행**: `Shift + F10` 단축키로 빠르게 실행
2. **로그 확인**: Logcat에서 앱 로그 확인 가능
3. **Hot Reload**: 코드 변경 시 자동으로 앱이 업데이트됨
4. **디바이스 선택**: 여러 디바이스에서 동시에 테스트 가능

---

**✅ 핵심**: Android Studio에서 실행하면 **완전히 독립적인 네이티브 앱**으로 실행됩니다!
































