# 📱 안드로이드 APK 빌드 가이드

웹 앱을 안드로이드 APK로 빌드하는 방법입니다.

## 🚀 빠른 시작 (명령줄)

### 방법 1: 배치 파일 사용 (가장 쉬움)

1. `BUILD_APK.bat` 파일을 더블클릭
2. 빌드 완료 후 APK 위치 확인:
   ```
   web/android/app/build/outputs/apk/debug/app-debug.apk
   ```

### 방법 2: 수동 실행

```powershell
# 1. web 폴더로 이동
cd C:\Users\wnd12\Desktop\mvp1\web

# 2. 웹 앱 빌드 + Android 동기화
npm run build:android

# 3. APK 빌드
cd android
.\gradlew assembleDebug
```

APK 파일 위치:
```
web/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📲 핸드폰에 설치하기

### 방법 A: USB 케이블 사용 (ADB)

1. **핸드폰 설정**
   - 설정 → 휴대전화 정보 → 빌드 번호 7번 탭 (개발자 모드 활성화)
   - 설정 → 개발자 옵션 → USB 디버깅 켜기

2. **USB로 연결 후 설치**
   ```powershell
   adb install web/android/app/build/outputs/apk/debug/app-debug.apk
   ```

### 방법 B: 파일 전송 (간단)

1. APK 파일을 핸드폰으로 전송 (카카오톡, 이메일, USB 등)
2. 핸드폰에서 APK 파일 클릭
3. "알 수 없는 출처" 허용 (보안 설정에서)
4. 설치 완료!

---

## 🛠️ Android Studio 사용 (선택사항)

### Android Studio에서 빌드

1. **프로젝트 열기**
   - Android Studio 실행
   - `File` → `Open`
   - `C:\Users\wnd12\Desktop\mvp1\web\android` 폴더 선택

2. **Gradle 동기화**
   - `File` → `Sync Project with Gradle Files`
   - 동기화 완료 대기

3. **APK 빌드**
   - `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`

4. **APK 위치**
   - 빌드 완료 후 "locate" 클릭
   - 또는: `web/android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🔧 상세 명령어

### 웹 앱만 빌드
```powershell
npm run build
```

### 웹 앱 빌드 + Android 동기화
```powershell
npm run build:android
```

### Debug APK 빌드 (개발용)
```powershell
npm run apk:debug
```

### Release APK 빌드 (배포용)
```powershell
npm run apk:release
```

### Android Studio 열기
```powershell
npm run open:android
```

---

## ⚠️ 문제 해결

### Gradle 빌드 실패

```powershell
cd web/android
.\gradlew clean
.\gradlew assembleDebug
```

### Capacitor 동기화 오류

```powershell
cd web
npm run build
npx cap sync android
```

### Java 버전 오류

- Android Studio의 내장 JDK 사용 권장
- `File` → `Project Structure` → `SDK Location`에서 확인

### APK 설치 실패

- 핸드폰 "알 수 없는 출처" 허용 확인
- 이전 버전 삭제 후 재설치
- `adb install -r app-debug.apk` (재설치)

---

## 📝 참고사항

- **Debug APK**: 개발/테스트용 (파일 크기 큼, 서명 불필요)
- **Release APK**: 배포용 (최적화, 서명 필요)
- APK 파일은 약 10-20MB 크기입니다
- 첫 빌드는 5-10분 정도 소요됩니다

---

## 🎯 빠른 재빌드 (코드 수정 후)

```powershell
cd C:\Users\wnd12\Desktop\mvp1\web
npm run apk:debug
```

빌드 완료 후 APK를 다시 설치하면 됩니다!

