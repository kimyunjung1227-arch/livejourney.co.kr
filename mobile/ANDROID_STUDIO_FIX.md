# 🔧 Android Studio 실행 설정 가이드

## 문제: "No run configurations added" 오류

Android Studio에서 Run Configuration이 설정되지 않아 발생하는 문제입니다.

---

## ✅ 해결 방법

### 방법 1: 자동으로 Configuration 추가하기

1. **Android Studio에서 프로젝트 열기**
   - `mobile/android` 폴더를 열어야 합니다

2. **Run Configuration 창에서:**
   - 왼쪽 상단의 **`+` (플러스)** 버튼 클릭
   - **"Android App"** 선택

3. **설정:**
   - **Name**: `app` (또는 원하는 이름)
   - **Module**: `LiveJourney.app` 선택
   - **Launch**: `Default Activity` 선택
   - **OK** 클릭

4. **에뮬레이터 선택:**
   - 상단 툴바에서 디바이스 선택 드롭다운 클릭
   - 에뮬레이터가 없다면 **"Device Manager"** 클릭하여 생성

5. **실행:**
   - **▶️ Run** 버튼 클릭 (또는 `Shift + F10`)

---

### 방법 2: Gradle로 직접 실행

**터미널에서:**
```bash
cd C:\Users\wnd12\Desktop\mvp1\mobile\android
gradlew installDebug
```

**또는 Android Studio의 Terminal 탭에서:**
```bash
./gradlew installDebug
```

---

### 방법 3: Expo로 실행 (가장 간단)

**새 터미널 창에서:**
```bash
cd C:\Users\wnd12\Desktop\mvp1\mobile
npm start
```

그 다음:
- `a` 키를 눌러 Android 에뮬레이터에서 실행
- 또는 QR 코드를 스캔하여 Expo Go 앱에서 실행

---

## 🔍 문제 해결

### 문제 1: Module을 찾을 수 없음

**해결:**
1. **File → Sync Project with Gradle Files** 클릭
2. Gradle 동기화 완료 대기
3. 다시 Run Configuration 추가

### 문제 2: 에뮬레이터가 없음

**해결:**
1. **Tools → Device Manager** 클릭
2. **Create Device** 클릭
3. 디바이스 선택 (예: Pixel 5)
4. 시스템 이미지 선택 (API 33 이상 권장)
5. **Finish** 클릭
6. 에뮬레이터 실행 (▶️ 버튼)

### 문제 3: Gradle 빌드 실패

**해결:**
```bash
cd C:\Users\wnd12\Desktop\mvp1\mobile\android
gradlew clean
gradlew build
```

### 문제 4: Metro Bundler 연결 실패

**해결:**
1. **새 터미널 창**에서:
```bash
cd C:\Users\wnd12\Desktop\mvp1\mobile
npm start
```

2. Metro Bundler가 실행된 상태에서 Android Studio에서 앱 실행

---

## 📝 단계별 체크리스트

### Android Studio 설정
- [ ] Android Studio에서 `mobile/android` 폴더 열기
- [ ] Gradle 동기화 완료
- [ ] Run Configuration 추가 (Android App)
- [ ] Module 선택 (`LiveJourney.app`)

### 에뮬레이터 설정
- [ ] Device Manager에서 에뮬레이터 생성
- [ ] 에뮬레이터 실행
- [ ] Android Studio에서 에뮬레이터 선택

### 실행
- [ ] Metro Bundler 실행 (`npm start`)
- [ ] Run 버튼 클릭
- [ ] 앱이 에뮬레이터에서 실행되는지 확인

---

## 🚀 빠른 실행 (권장)

가장 간단한 방법:

1. **터미널 1** (Metro Bundler):
```bash
cd C:\Users\wnd12\Desktop\mvp1\mobile
npm start
```

2. **터미널 2** (앱 실행):
```bash
cd C:\Users\wnd12\Desktop\mvp1\mobile
npm run android
```

이렇게 하면 자동으로 에뮬레이터가 실행되고 앱이 설치됩니다!

---

## 💡 팁

- **Expo Go 앱 사용**: 가장 빠르고 간단합니다
- **실제 디바이스**: USB 디버깅 활성화 후 연결
- **Hot Reload**: 코드 변경 시 자동으로 앱이 업데이트됩니다


