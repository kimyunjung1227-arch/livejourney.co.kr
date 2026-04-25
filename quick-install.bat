@echo off
chcp 65001 >nul
echo ========================================
echo 📱 Capacitor 앱 빠른 설치 (디바이스 연결 필요)
echo ========================================
echo.

echo [1/4] 웹 앱 빌드 중...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 빌드 실패!
    pause
    exit /b 1
)
echo ✅ 빌드 완료!

echo.
echo [2/4] Capacitor 동기화 중...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ❌ 동기화 실패!
    pause
    exit /b 1
)
echo ✅ 동기화 완료!

echo.
echo [3/4] 디바이스 확인 중...
cd android
call gradlew devices
if %errorlevel% neq 0 (
    echo ⚠️  디바이스가 연결되지 않았거나 adb가 설정되지 않았습니다.
    echo Android Studio를 열어서 실행하세요.
    cd ..
    call npx cap open android
    pause
    exit /b 1
)

echo.
echo [4/4] APK 빌드 및 설치 중...
call gradlew installDebug
if %errorlevel% neq 0 (
    echo ❌ 설치 실패!
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo ✅ 앱 설치 완료!
echo ========================================
echo.
echo 디바이스에서 LiveJourney 앱을 실행하세요.
echo.
pause
