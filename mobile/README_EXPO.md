# 📱 Expo로 폰에서 앱 보기

## 🚀 가장 쉬운 방법 (터널 모드 - 3단계)

### 1️⃣ Expo Go 앱 설치

**안드로이드 폰에서:**
- Google Play Store 열기
- "Expo Go" 검색 후 설치
- 또는 직접 링크: https://play.google.com/store/apps/details?id=host.exp.exponent

### 2️⃣ PC에서 터널 모드로 서버 시작

**배치 파일 실행 (추천!):**
- **`START_EXPO_TUNNEL.bat`** 파일을 더블클릭
- 다른 Wi-Fi에서도 작동합니다!

**또는 명령어:**
```powershell
cd C:\Users\wnd12\Desktop\mvp1\mobile
npm run tunnel
```

### 3️⃣ QR 코드 스캔

- 터미널에 나타나는 QR 코드를 Expo Go 앱으로 스캔
- 앱이 자동으로 로드됩니다! 🎉
- 다른 Wi-Fi에 있어도 작동합니다!

---

## 📂 배치 파일 안내

### `START_EXPO_TUNNEL.bat` ⭐ 추천!
- 터널 모드: 다른 Wi-Fi에서도 작동
- 어디서든 접속 가능
- QR 코드 표시
- 가장 편리한 방법!

### `START_EXPO.bat`
- 일반 모드: 같은 Wi-Fi에서 빠르게 작동
- QR 코드 표시
- 같은 네트워크에서만 작동

### `START_EXPO_ANDROID.bat`
- USB로 연결된 폰이나 에뮬레이터에서 자동 실행
- APK 빌드 후 직접 설치

---

## ⚡ 빠른 명령어

```powershell
# Expo 서버 시작
npm start

# 터널 모드 (다른 Wi-Fi에서도 작동)
npm run tunnel

# Android에서 직접 실행 (USB 연결 필요)
npm run android

# 웹 브라우저에서 실행
npm run web

# 캐시 지우고 시작
npm run clear
```

---

## 🔧 문제 해결

### QR 코드가 작동하지 않음
- ✅ **`START_EXPO_TUNNEL.bat` 사용 (터널 모드 추천!)**
  - 다른 Wi-Fi에서도 작동합니다
  - 네트워크 설정 걱정 없이 사용 가능
- ✅ PC와 폰이 같은 Wi-Fi에 연결되어 있는지 확인 (일반 모드 사용 시)

### "Unable to resolve module" 오류
```powershell
npm install
```

### 앱이 로드되지 않음
```powershell
npm run clear
npm start
```

### Expo Go 앱이 없음
- Google Play Store에서 "Expo Go" 검색하여 설치

---

## 💡 팁

- **Hot Reload**: 코드를 수정하면 자동으로 앱이 새로고침됩니다
- **개발자 메뉴**: 폰에서 흔들면 개발자 메뉴가 열립니다
- **로그 확인**: Expo 개발 서버 터미널에서 로그를 확인할 수 있습니다

---

## 🎯 요약 (터널 모드 사용!)

1. **Expo Go 설치** (폰)
   - Play Store에서 "Expo Go" 설치

2. **`START_EXPO_TUNNEL.bat` 실행** (PC)
   - 더블클릭만 하면 됩니다!

3. **QR 코드 스캔** (폰)
   - Expo Go 앱에서 QR 코드 스캔

4. **완료!** 🎉
   - 다른 Wi-Fi에서도 작동합니다!

자세한 내용은 `EXPO_QUICK_START.md` 참고

