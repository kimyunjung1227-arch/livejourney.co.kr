# 📱 Expo로 앱 실행하기

## 🚀 빠른 시작

### **방법 1: 배치 파일 사용** (가장 쉬움)

1. **Expo 개발 서버 시작**
   - `START_EXPO.bat` 파일을 더블클릭
   - 터미널이 열리고 Expo 개발 서버가 시작됩니다

2. **Android에서 실행**
   - `START_EXPO_ANDROID.bat` 파일을 더블클릭
   - Android 에뮬레이터나 연결된 기기에서 자동으로 실행됩니다

### **방법 2: 명령줄 사용**

#### **Expo 개발 서버 시작**
```powershell
cd C:\Users\wnd12\Desktop\mvp1\mobile
npm start
```

또는:
```powershell
npx expo start
```

#### **Android에서 실행**
```powershell
cd C:\Users\wnd12\Desktop\mvp1\mobile
npm run android
```

또는:
```powershell
npx expo run:android
```

---

## 📲 실행 방법

### **옵션 1: Expo Go 앱 사용** (가장 빠름)

1. **스마트폰에 Expo Go 앱 설치**
   - Android: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **Expo 서버 시작**
   ```powershell
   cd C:\Users\wnd12\Desktop\mvp1\mobile
   npm start
   ```

3. **QR 코드 스캔**
   - 터미널에 표시된 QR 코드를 Expo Go 앱으로 스캔
   - 또는 Expo Go 앱에서 "Scan QR code" 선택

4. **앱 실행**
   - 스캔 후 앱이 자동으로 로드됩니다
   - **중요**: PC와 스마트폰이 같은 Wi-Fi 네트워크에 연결되어 있어야 합니다

### **옵션 2: Android 에뮬레이터 사용**

1. **Android Studio에서 에뮬레이터 실행**
   - Android Studio → `Tools` → `Device Manager`
   - 에뮬레이터 선택 → 실행

2. **Expo로 앱 실행**
   ```powershell
   cd C:\Users\wnd12\Desktop\mvp1\mobile
   npm run android
   ```
   - 에뮬레이터가 실행 중이면 자동으로 앱이 설치되고 실행됩니다

### **옵션 3: 실제 Android 기기 (USB)**

1. **개발자 옵션 활성화**
   - 설정 → 휴대전화 정보 → 빌드 번호 7번 탭

2. **USB 디버깅 활성화**
   - 설정 → 개발자 옵션 → USB 디버깅 켜기

3. **USB로 기기 연결**
   - USB 케이블로 PC에 연결

4. **기기 확인**
   ```powershell
   adb devices
   ```
   - 기기가 목록에 나타나야 합니다

5. **앱 실행**
   ```powershell
   cd C:\Users\wnd12\Desktop\mvp1\mobile
   npm run android
   ```

### **옵션 4: 웹 브라우저에서 실행**

```powershell
cd C:\Users\wnd12\Desktop\mvp1\mobile
npm run web
```

또는 Expo 서버 실행 후 `w` 키를 누르세요.

---

## ⌨️ Expo 개발 서버 단축키

Expo 서버가 실행 중일 때:

- **`a`** - Android 에뮬레이터/기기에서 실행
- **`i`** - iOS 시뮬레이터에서 실행 (Mac만)
- **`w`** - 웹 브라우저에서 실행
- **`r`** - 앱 새로고침 (Reload)
- **`m`** - 개발자 메뉴 열기
- **`j`** - 디버거 열기
- **`c`** - Metro 번들러 캐시 지우기

---

## 🔧 문제 해결

### **"Unable to resolve module" 오류**
```powershell
cd C:\Users\wnd12\Desktop\mvp1\mobile
npm install
```

### **Metro 번들러 캐시 문제**
```powershell
cd C:\Users\wnd12\Desktop\mvp1\mobile
npx expo start --clear
```

### **Android 에뮬레이터가 인식되지 않음**
```powershell
adb devices
```
기기가 목록에 없으면:
1. Android Studio에서 에뮬레이터 재시작
2. USB 디버깅 확인 (실제 기기인 경우)

### **QR 코드가 작동하지 않음**
- PC와 스마트폰이 같은 Wi-Fi에 연결되어 있는지 확인
- 방화벽이 Expo 서버를 차단하지 않는지 확인
- 터널 모드 사용:
  ```powershell
  npm run tunnel
  ```

---

## 📝 참고

- **개발 모드**: 코드를 수정하면 자동으로 새로고침됩니다 (Hot Reload)
- **빌드 모드**: `npm run android`는 네이티브 빌드를 생성합니다 (더 느림)
- **Expo Go**: 네이티브 모듈이 제한적일 수 있습니다
- **개발 빌드**: 모든 네이티브 기능을 사용하려면 `npx expo run:android` 사용

---

끝! 🎉

















































