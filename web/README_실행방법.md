# 🚀 Capacitor 앱 실행 방법

## ⚡ 가장 쉬운 방법

### 1. 배치 파일 실행 (더블클릭)

**`실행.bat`** 파일을 더블클릭하세요!

→ 자동으로 빌드 → 동기화 → Android Studio 열기

### 2. 또는 npm 명령어

```bash
cd web
npm run quick:run
```

## 📱 Android Studio에서

1. **Gradle 동기화 대기** (최초 1회만, 2-5분)
2. **Run 버튼 클릭** (또는 `Shift + F10`)
3. **에뮬레이터 또는 실제 디바이스 선택**
4. **앱 실행!**

## 🔄 코드 수정 후

웹 코드를 수정한 후에는 반드시:

```bash
cd web
npm run build:android
```

그 다음 Android Studio에서 다시 실행하세요.

## ✨ 완료된 설정

- ✅ Capacitor 플러그인 설치 완료
- ✅ Android 권한 설정 완료
- ✅ 웹 앱 빌드 및 동기화 완료
- ✅ 실행 스크립트 준비 완료

이제 **`실행.bat`** 파일을 더블클릭하면 바로 실행됩니다!
