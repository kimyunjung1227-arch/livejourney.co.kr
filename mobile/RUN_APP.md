# 🚀 앱 실행하기

## ✅ 준비 완료
- ✅ npm install 완료
- ✅ Android 프로젝트 준비 완료
- ✅ Expo 개발 서버 실행 중

## 📱 Android Studio에서 실행하기

### 방법 1: 배치 파일 사용
1. `START_ANDROID_STUDIO.bat` 파일을 더블클릭
2. Android Studio가 자동으로 열립니다

### 방법 2: 수동으로 열기
1. **Android Studio 실행**
2. **File → Open** 선택
3. 다음 경로 선택:
   ```
   C:\Users\wnd12\Desktop\mvp1\mobile\android
   ```
4. **Gradle 동기화** 대기 (처음에는 몇 분 소요)
5. **Tools → Device Manager**에서 에뮬레이터 생성/실행
6. 상단 툴바에서 **에뮬레이터 선택**
7. **▶️ Run 'app'** 버튼 클릭 (또는 `Shift + F10`)

## 📱 명령줄에서 실행하기

### Expo로 실행 (가장 간단)
```bash
cd C:\Users\wnd12\Desktop\mvp1\mobile
npm run android
```

### Gradle로 직접 빌드
```bash
cd C:\Users\wnd12\Desktop\mvp1\mobile\android
gradlew assembleDebug
gradlew installDebug
```

## 📱 Expo Go 앱 사용 (스마트폰)

1. 스마트폰에 **Expo Go** 앱 설치
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. 터미널에 표시된 **QR 코드 스캔**
3. 앱이 자동으로 로드됨

## ⚠️ 문제 해결

### Gradle 동기화 실패
```bash
cd C:\Users\wnd12\Desktop\mvp1\mobile\android
gradlew clean
```

### SDK 경로 오류
- `android/local.properties` 파일 확인
- Android Studio → File → Project Structure → SDK Location 확인

### 에뮬레이터가 없다면
- Android Studio → Tools → Device Manager → Create Device
- Pixel 5, API 33 이상 권장

### Metro Bundler 연결 실패
```bash
cd C:\Users\wnd12\Desktop\mvp1\mobile
npm start -- --reset-cache
```

## 🎯 다음 단계

앱이 실행되면:
1. ✅ 환영 화면 확인
2. ✅ 로그인/회원가입 테스트
3. ✅ 각 화면 네비게이션 확인
4. ✅ 기능 테스트


