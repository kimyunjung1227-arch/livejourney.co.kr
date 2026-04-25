@echo off
cd /d "%~dp0"

echo.
echo ========================================
echo   Capacitor 앱 실행
echo ========================================
echo.

echo [1/3] 웹 앱 빌드...
npm run build
if %errorlevel% neq 0 (
    echo.
    echo 빌드 실패!
    pause
    exit /b 1
)

echo.
echo [2/3] Capacitor 동기화...
npx cap sync android
if %errorlevel% neq 0 (
    echo.
    echo 동기화 실패!
    pause
    exit /b 1
)

echo.
echo [3/3] Android Studio 열기...
npx cap open android

echo.
echo ========================================
echo   완료! Android Studio가 열렸습니다.
echo ========================================
echo.
echo Android Studio에서:
echo   1. Gradle 동기화 대기 (2-5분)
echo   2. Run 버튼 클릭 (Shift+F10)
echo   3. 디바이스 선택
echo.
pause
