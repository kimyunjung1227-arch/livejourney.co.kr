# 🔧 Android Studio 실행 문제 해결

## 현재 문제
- Run/Debug Configurations 창에 "No run configurations added" 표시
- 에뮬레이터에서 앱 실행 불가

---

## ✅ 즉시 해결 방법

### 방법 1: Run Configuration 수동 추가 (가장 확실)

1. **Run/Debug Configurations 창에서:**
   - 왼쪽 상단 **`+` (플러스)** 버튼 클릭
   - **"Android App"** 선택

2. **설정 입력:**
   ```
   Name: app
   Module: LiveJourney.app (드롭다운에서 선택)
   Launch: Default Activity
   ```

3. **Apply** → **OK** 클릭

4. **에뮬레이터 선택:**
   - 상단 툴바의 디바이스 선택 드롭다운 클릭
   - 에뮬레이터 선택 (없으면 Device Manager에서 생성)

5. **▶️ Run** 버튼 클릭

---

### 방법 2: Gradle 동기화 후 재시도

1. **File → Sync Project with Gradle Files** 클릭
2. 동기화 완료 대기 (몇 분 소요)
3. 다시 Run Configuration 추가 시도

---

### 방법 3: 명령줄에서 직접 실행 (가장 빠름)

**새 PowerShell 창에서:**

```powershell
cd C:\Users\wnd12\Desktop\mvp1\mobile
npm run android
```

이 명령어는:
- Metro Bundler 자동 시작
- 에뮬레이터 자동 실행 (없으면 생성)
- 앱 자동 빌드 및 설치

---

### 방법 4: Expo Go 앱 사용 (가장 간단)

1. **스마트폰에 Expo Go 설치**
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **터미널에서:**
```powershell
cd C:\Users\wnd12\Desktop\mvp1\mobile
npm start
```

3. **QR 코드 스캔**
   - Expo Go 앱에서 QR 코드 스캔
   - 앱이 자동으로 로드됨

---

## 🔍 추가 문제 해결

### Module을 찾을 수 없을 때

**해결:**
```powershell
cd C:\Users\wnd12\Desktop\mvp1\mobile\android
.\gradlew clean
```

그 다음 Android Studio에서:
- **File → Invalidate Caches / Restart**
- **Invalidate and Restart** 선택

### Gradle 빌드 에러

**해결:**
```powershell
cd C:\Users\wnd12\Desktop\mvp1\mobile\android
.\gradlew clean
.\gradlew build --stacktrace
```

### SDK 경로 오류

**해결:**
1. `mobile/android/local.properties` 파일 확인
2. 없다면 생성:
```properties
sdk.dir=C\:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
```

---

## 🎯 권장 실행 순서

### 1단계: Metro Bundler 시작
```powershell
cd C:\Users\wnd12\Desktop\mvp1\mobile
npm start
```

### 2단계: 새 터미널에서 앱 실행
```powershell
cd C:\Users\wnd12\Desktop\mvp1\mobile
npm run android
```

이렇게 하면 Android Studio 설정 없이도 바로 실행됩니다!

---

## 💡 팁

- **Expo Go 사용**: 개발 중에는 가장 빠르고 편리합니다
- **실제 디바이스**: USB 디버깅 활성화 후 `adb devices`로 확인
- **Hot Reload**: 코드 변경 시 자동 반영됩니다


