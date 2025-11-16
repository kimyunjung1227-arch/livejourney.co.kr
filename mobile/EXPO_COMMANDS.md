# 📱 Expo 실행 명령어 가이드

## 🚀 기본 명령어

### 개발 서버 시작
```bash
cd C:\Users\wnd12\Desktop\mvp1\mobile
npm start
```

### Android 에뮬레이터에서 실행
```bash
npm run android
# 또는
npm start
# 그 다음 터미널에서 'a' 키 누르기
```

### iOS 시뮬레이터에서 실행 (Mac만)
```bash
npm run ios
# 또는
npm start
# 그 다음 터미널에서 'i' 키 누르기
```

### 웹 브라우저에서 실행
```bash
npm run web
# 또는
npm start
# 그 다음 터미널에서 'w' 키 누르기
```

---

## 📱 Expo Go 앱 사용 (가장 빠름)

### 1. 스마트폰에 Expo Go 설치
- **Android**: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS**: [App Store](https://apps.apple.com/app/expo-go/id982107779)

### 2. 개발 서버 시작
```bash
cd C:\Users\wnd12\Desktop\mvp1\mobile
npm start
```

### 3. QR 코드 스캔
- 터미널에 표시된 QR 코드를 Expo Go 앱으로 스캔
- 앱이 자동으로 로드됨

---

## ⌨️ 터미널 단축키

개발 서버 실행 중 (`npm start`) 다음 키를 사용할 수 있습니다:

- **`a`** - Android 에뮬레이터에서 실행
- **`i`** - iOS 시뮬레이터에서 실행 (Mac만)
- **`w`** - 웹 브라우저에서 실행
- **`r`** - 앱 리로드
- **`m`** - 메뉴 열기
- **`j`** - 디버거 열기
- **`c`** - 캐시 클리어 후 재시작

---

## 🔧 유용한 명령어

### 캐시 클리어 후 시작
```bash
npm start -- --clear
```

### 프로덕션 모드로 시작
```bash
npm start -- --no-dev --minify
```

### 특정 포트로 시작
```bash
npm start -- --port 8081
```

### 안드로이드만 실행 (에뮬레이터 자동 실행)
```bash
npm run android
```

---

## 🐛 문제 해결

### Metro Bundler가 시작되지 않을 때
```bash
npm start -- --reset-cache
```

### 포트가 이미 사용 중일 때
```bash
# 포트 변경
npm start -- --port 8082
```

### 에뮬레이터가 자동으로 실행되지 않을 때
1. Android Studio에서 수동으로 에뮬레이터 실행
2. `npm start` 실행
3. 터미널에서 `a` 키 누르기

---

## 📝 실행 순서

### 방법 1: Expo Go 앱 (권장)
```bash
# 1. 개발 서버 시작
cd C:\Users\wnd12\Desktop\mvp1\mobile
npm start

# 2. 스마트폰에서 Expo Go 앱 실행
# 3. QR 코드 스캔
```

### 방법 2: Android 에뮬레이터
```bash
# 1. 개발 서버 시작
cd C:\Users\wnd12\Desktop\mvp1\mobile
npm start

# 2. 새 터미널에서
npm run android
```

### 방법 3: 한 번에 실행
```bash
cd C:\Users\wnd12\Desktop\mvp1\mobile
npm run android
# 이 명령어는 자동으로 Metro Bundler를 시작하고 에뮬레이터에서 실행합니다
```

---

## 💡 팁

- **Hot Reload**: 코드 변경 시 자동으로 앱이 업데이트됩니다
- **Fast Refresh**: React 컴포넌트 변경 시 즉시 반영됩니다
- **디버깅**: Chrome DevTools로 디버깅 가능합니다
- **로그 확인**: 터미널에서 실시간 로그 확인 가능


