# 📱 웹 앱 + APK 배포 가이드

웹 앱과 안드로이드 APK를 함께 배포하여 다운로드할 수 있도록 설정하는 방법입니다.

## 🎯 목표

- ✅ 웹 앱: 브라우저에서 바로 사용
- ✅ APK: 안드로이드 폰에 설치 가능
- ✅ 다운로드 페이지: `/download.html`에서 모두 제공

---

## 📋 방법 1: GitHub Pages + Releases (추천)

### 1단계: APK 빌드

```powershell
cd C:\Users\wnd12\Desktop\mvp1\web
.\BUILD_APK.bat
```

APK 파일 위치:
```
web/android/app/build/outputs/apk/debug/app-debug.apk
```

### 2단계: GitHub Releases에 APK 업로드

1. **GitHub 저장소로 이동**
   - https://github.com/kimyunjung1227-arch/app 접속

2. **Releases 페이지**
   - 저장소 우측 상단 "Releases" 클릭
   - 또는 직접: https://github.com/kimyunjung1227-arch/app/releases

3. **새 릴리스 생성**
   - "Create a new release" 클릭
   - Tag: `v1.0.0`
   - Title: `LiveJourney v1.0.0`
   - Description: 간단한 설명 추가

4. **APK 파일 업로드**
   - "Attach binaries" 클릭
   - `web/android/app/build/outputs/apk/debug/app-debug.apk` 선택
   - 또는 파일을 드래그 앤 드롭

5. **릴리스 발행**
   - "Publish release" 클릭

### 3단계: 웹 빌드에 APK 포함 (선택사항)

GitHub Pages에 APK를 직접 포함하려면:

1. **APK를 dist 폴더로 복사**
   ```powershell
   copy web\android\app\build\outputs\apk\debug\app-debug.apk web\dist\app-debug.apk
   ```

2. **빌드 및 배포**
   - GitHub Actions가 자동으로 배포합니다
   - 또는 수동으로: `npm run build` 후 `dist` 폴더 업로드

### 4단계: 다운로드 페이지 링크 수정

`web/public/download.html` 파일의 GitHub Releases URL을 실제 저장소 주소로 변경:

```javascript
const githubReleasesUrl = 'https://github.com/YOUR_USERNAME/YOUR_REPO/releases';
```

---

## 📋 방법 2: Netlify 배포 (APK 포함)

### 1단계: APK 빌드 및 복사

```powershell
cd C:\Users\wnd12\Desktop\mvp1\web
.\BUILD_APK.bat

# APK를 public 폴더로 복사 (빌드 시 dist에 포함됨)
copy android\app\build\outputs\apk\debug\app-debug.apk public\app-debug.apk
```

### 2단계: Netlify 배포 설정

1. **Netlify 설정**
   - `netlify.toml` 파일 확인 (이미 존재)
   - 또는 Netlify 대시보드에서 설정

2. **배포**
   - Git에 푸시하면 자동 배포
   - 또는 수동으로 드래그 앤 드롭 배포

### 3단계: 다운로드 링크 확인

배포 완료 후:
```
https://your-site.netlify.app/download.html
https://your-site.netlify.app/app-debug.apk
```

---

## 📋 방법 3: 로컬 서버로 테스트

### 1단계: APK 빌드

```powershell
cd C:\Users\wnd12\Desktop\mvp1\web
.\BUILD_APK.bat
```

### 2단계: APK를 public 폴더로 복사

```powershell
copy android\app\build\outputs\apk\debug\app-debug.apk public\app-debug.apk
```

### 3단계: 개발 서버 실행

```powershell
npm run dev
```

### 4단계: 테스트

브라우저에서:
- http://localhost:5173/download.html 접속
- APK 다운로드 테스트

---

## 🔄 자동화: 빌드 스크립트 수정

APK 빌드 후 자동으로 public 폴더에 복사하도록 스크립트를 수정할 수 있습니다:

### `BUILD_APK.bat` 수정

```batch
@echo off
chcp 65001 >nul
echo ====================================
echo   LiveJourney APK 빌드
echo ====================================
echo.

cd /d "%~dp0"

echo [1/3] 웹 앱 빌드 중...
call npm run build

echo.
echo [2/3] Capacitor Android 동기화 중...
call npx cap sync android

echo.
echo [3/3] APK 빌드 중...
cd android
call gradlew.bat assembleDebug
cd ..

echo.
echo [4/4] APK를 public 폴더로 복사 중...
if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "public\app-debug.apk"
    echo APK가 public 폴더에 복사되었습니다.
) else (
    echo 경고: APK 파일을 찾을 수 없습니다.
)

echo.
echo ====================================
echo   빌드 완료!
echo ====================================
echo.
echo APK 위치:
echo   android\app\build\outputs\apk\debug\app-debug.apk
echo   public\app-debug.apk (웹 배포용)
echo.
pause
```

---

## 🌐 다운로드 페이지 접속

배포 완료 후:
- **웹 앱**: `https://your-site.com/`
- **다운로드 페이지**: `https://your-site.com/download.html`
- **APK 직접 다운로드**: `https://your-site.com/app-debug.apk`

---

## 📱 사용자 가이드

### 웹 앱 사용
1. 브라우저에서 웹사이트 접속
2. 바로 사용 가능 (설치 불필요)

### 안드로이드 앱 설치
1. 다운로드 페이지에서 APK 다운로드
2. 핸드폰 설정 → 보안 → "알 수 없는 출처" 허용
3. 다운로드한 APK 파일 탭하여 설치
4. 앱 아이콘 클릭하여 실행

---

## 🔄 업데이트 방법

### APK 업데이트

1. **APK 재빌드**
   ```powershell
   .\BUILD_APK.bat
   ```

2. **버전 업데이트**
   - `web/android/app/build.gradle` 파일에서 `versionCode`와 `versionName` 수정

3. **GitHub Releases 업로드**
   - 새 릴리스 생성
   - 새 APK 업로드

4. **웹 배포 업데이트** (APK 포함한 경우)
   - `public/app-debug.apk` 파일 교체
   - Git에 푸시하여 재배포

---

## ⚠️ 주의사항

1. **APK 파일 크기**
   - Debug APK: 약 15-20MB
   - Release APK: 약 10-15MB (최적화됨)
   - GitHub Pages: 100MB 파일 크기 제한
   - Netlify: 무료 플랜 100MB 제한

2. **보안**
   - Debug APK는 개발용입니다
   - 배포용은 Release APK를 사용하세요
   - Google Play Store 배포 시 서명 필요

3. **버전 관리**
   - GitHub Releases를 사용하면 버전 관리가 쉬워집니다
   - 각 릴리스마다 변경사항 문서화

---

## 🎉 완료!

이제 사용자들이 웹 앱과 안드로이드 앱을 모두 다운로드할 수 있습니다!













