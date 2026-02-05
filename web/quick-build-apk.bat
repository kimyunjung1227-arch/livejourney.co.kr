@echo off
chcp 65001 >nul
echo ========================================
echo 📦 Capacitor APK 빠른 빌드
echo ========================================
echo.

echo [1/3] 웹 앱 빌드 중...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 빌드 실패!
    pause
    exit /b 1
)
echo ✅ 빌드 완료!

echo.
echo [2/3] Capacitor 동기화 중...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ❌ 동기화 실패!
    pause
    exit /b 1
)
echo ✅ 동기화 완료!

echo.
echo [3/3] APK 빌드 중...
cd android
call gradlew assembleDebug
if %errorlevel% neq 0 (
    echo ❌ APK 빌드 실패!
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo ✅ APK 빌드 완료!
echo ========================================
echo.
echo APK 위치:
echo   web\android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo 이 파일을 디바이스로 전송하여 설치할 수 있습니다.
echo.
pause
