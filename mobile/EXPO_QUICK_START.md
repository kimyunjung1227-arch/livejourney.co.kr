# 📱 Expo로 폰에서 앱 보기 (3분 안에!)

안드로이드 폰에서 LiveJourney 앱을 바로 볼 수 있는 가장 쉬운 방법입니다.

## 🚀 가장 쉬운 방법: Expo Go 사용

### 1단계: Expo Go 앱 설치 (한 번만)

**안드로이드 폰에서:**
1. Google Play Store 열기
2. "Expo Go" 검색
3. 설치: https://play.google.com/store/apps/details?id=host.exp.exponent

### 2단계: 앱 실행

**PC에서:**
```powershell
# mobile 폴더로 이동
cd C:\Users\wnd12\Desktop\mvp1\mobile

# Expo 서버 시작
npm start
```

또는 **더블클릭으로 실행:**
- `START_EXPO.bat` 파일을 더블클릭

### 3단계: QR 코드 스캔

1. **터미널에 QR 코드가 나타납니다**
2. **안드로이드 폰에서:**
   - Expo Go 앱 열기
   - "Scan QR code" 선택
   - 터미널의 QR 코드 스캔
3. **앱이 자동으로 로드됩니다!** 🎉

---

## ⚡ 빠른 실행 배치 파일

### 방법 1: 터널 모드로 실행 (추천! 🌟)
- **`START_EXPO_TUNNEL.bat`** 실행 (더블클릭)
- 다른 Wi-Fi에서도 작동합니다!
- 폰에서 Expo Go로 QR 코드 스캔

### 방법 2: 일반 모드로 실행 (같은 Wi-Fi)
- `START_EXPO.bat` 실행
- PC와 폰이 같은 Wi-Fi에 있어야 합니다
- 폰에서 Expo Go로 QR 코드 스캔

### 방법 3: 자동으로 안드로이드에서 실행 (USB 연결)
- `START_EXPO_ANDROID.bat` 실행
- USB로 연결된 폰이나 에뮬레이터에서 자동 실행

---

## 🔧 문제 해결

### ❌ QR 코드가 작동하지 않을 때

**✅ 터널 모드 사용 (추천! 다른 Wi-Fi에서도 작동):**
- **`START_EXPO_TUNNEL.bat`** 파일을 실행하세요!
- 또는 명령어:
```powershell
cd C:\Users\wnd12\Desktop\mvp1\mobile
npm run tunnel
```

**같은 Wi-Fi인지 확인 (일반 모드 사용 시):**
- PC와 폰이 같은 Wi-Fi에 연결되어 있어야 합니다

### ❌ "Unable to resolve module" 오류
```powershell
cd C:\Users\wnd12\Desktop\mvp1\mobile
npm install
```

### ❌ 앱이 로드되지 않을 때
```powershell
# 캐시 지우고 다시 시작
cd C:\Users\wnd12\Desktop\mvp1\mobile
npx expo start --clear
```

---

## 📲 다른 실행 방법

### USB로 직접 연결해서 실행

1. **폰 설정**
   - 설정 → 휴대전화 정보 → 빌드 번호 7번 탭 (개발자 모드)
   - 설정 → 개발자 옵션 → USB 디버깅 켜기

2. **USB로 연결 후 실행**
   ```powershell
   cd C:\Users\wnd12\Desktop\mvp1\mobile
   npm run android
   ```

### 웹 브라우저에서 테스트
```powershell
cd C:\Users\wnd12\Desktop\mvp1\mobile
npm run web
```

---

## ✨ 장점

- ✅ **즉시 실행**: 설치 없이 바로 볼 수 있음
- ✅ **Hot Reload**: 코드 수정하면 자동으로 반영
- ✅ **무료**: Expo Go는 완전 무료
- ✅ **간편**: APK 빌드 필요 없음

---

## 🎯 요약 (터널 모드 - 가장 쉽습니다!)

1. **Expo Go 앱 설치** (폰)
   - Play Store에서 "Expo Go" 검색 후 설치

2. **`START_EXPO_TUNNEL.bat` 실행** (PC)
   - 더블클릭만 하면 됩니다!

3. **QR 코드 스캔** (폰)
   - Expo Go 앱에서 QR 코드 스캔
   - 다른 Wi-Fi에 있어도 작동합니다!

4. **완료!** 🎉

---

**자세한 내용**: `EXPO_RUN_GUIDE.md` 참고

