# 🚀 빠른 시작 가이드

## 현재 상태
✅ npm install 완료
✅ Expo 개발 서버 실행 중

## 다음 단계

### 방법 1: Android Studio에서 실행 (권장)

1. **Android Studio 실행**
2. **File → Open** 선택
3. `C:\Users\wnd12\Desktop\mvp1\mobile\android` 폴더 선택
4. Gradle 동기화 대기
5. 에뮬레이터 실행 (Tools → Device Manager)
6. **▶️ Run** 버튼 클릭

### 방법 2: 명령줄에서 실행

```bash
cd C:\Users\wnd12\Desktop\mvp1\mobile
npm run android
```

### 방법 3: Expo Go 앱 사용 (가장 빠름)

1. 스마트폰에 **Expo Go** 앱 설치
2. 터미널에 표시된 QR 코드 스캔
3. 앱이 자동으로 로드됨

## 문제 해결

### Android 프로젝트가 없다면:
```bash
cd C:\Users\wnd12\Desktop\mvp1\mobile
npx expo prebuild --platform android
```

### 에뮬레이터가 없다면:
- Android Studio → Tools → Device Manager → Create Device

### 빌드 에러가 발생하면:
```bash
cd C:\Users\wnd12\Desktop\mvp1\mobile\android
gradlew clean
```


