# 🚀 Capacitor 앱 빠른 실행 가이드

웹 디자인을 그대로 사용하는 네이티브 앱을 실행하는 방법입니다.

## ⚡ 빠른 실행 (추천)

### 방법 1: 배치 파일 사용 (가장 쉬움)

**Android Studio로 실행:**
```bash
quick-run.bat
```
→ 빌드 + 동기화 + Android Studio 자동 실행

**디바이스에 직접 설치 (더 빠름):**
```bash
quick-install.bat
```
→ 빌드 + 동기화 + 디바이스에 직접 설치 (디바이스 연결 필요)

**APK만 빌드:**
```bash
quick-build-apk.bat
```
→ 빌드 + 동기화 + APK 생성

### 방법 2: npm 명령어 사용

```bash
# Android Studio 열기
npm run quick:run

# 디바이스에 직접 설치
npm run quick:install

# APK 빌드
npm run quick:apk
```

## 📱 Android Studio에서 실행

1. **Gradle 동기화 대기** (2-5분, 최초 1회만)
2. **Run 버튼 클릭** (또는 `Shift + F10`)
3. **에뮬레이터 또는 실제 디바이스 선택**
4. **앱 실행!**

## 📦 APK 위치

빌드된 APK는 다음 위치에 있습니다:
```
web/android/app/build/outputs/apk/debug/app-debug.apk
```

## 🔄 코드 수정 후

웹 코드를 수정한 후에는 반드시 다시 빌드:
```bash
npm run build:android
```
또는
```bash
quick-run.bat
```

## ✨ 주요 특징

- ✅ **웹 디자인 그대로 사용** - Tailwind CSS, React Router 등 모든 웹 기술 사용
- ✅ **코드 중복 없음** - 웹 코드를 그대로 재사용
- ✅ **유지보수 용이** - 웹만 수정하면 앱도 자동 반영
- ✅ **네이티브 기능 접근** - GPS, 카메라 등 네이티브 기능 사용 가능

## 📝 주의사항

- Android Studio가 설치되어 있어야 합니다
- 디바이스에 직접 설치하려면 USB 디버깅이 활성화되어 있어야 합니다
- 최초 실행 시 Gradle 동기화에 시간이 걸립니다 (2-5분)
