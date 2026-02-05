@echo off
echo ========================================
echo Capacitor Android 앱 실행
echo ========================================
echo.

echo [1/3] 웹 앱 빌드 중...
call npm run build
if %errorlevel% neq 0 (
    echo 빌드 실패!
    pause
    exit /b 1
)

echo.
echo [2/3] Capacitor 동기화 중...
call npx cap sync android
if %errorlevel% neq 0 (
    echo 동기화 실패!
    pause
    exit /b 1
)

echo.
echo [3/3] Android Studio 열기...
call npx cap open android

echo.
echo ========================================
echo 완료! Android Studio가 열렸습니다.
echo ========================================
echo.
echo Android Studio에서:
echo 1. Gradle 동기화 대기 (2-5분)
echo 2. Run 버튼 클릭 (또는 Shift+F10)
echo 3. 에뮬레이터 또는 실제 디바이스 선택
echo.
pause
