@echo off
chcp 65001 > nul
echo ========================================
echo 📱 LiveJourney - 실행 방법 선택
echo ========================================
echo.
echo 실행 방법을 선택하세요:
echo.
echo [1] Android Studio로 실행 (독립적인 네이티브 앱)
echo [2] Expo Go로 실행 (빠른 개발 확인)
echo [3] Android 에뮬레이터로 실행
echo [4] 웹 브라우저로 실행
echo.
set /p choice="선택 (1-4): "

cd /d "%~dp0"

if "%choice%"=="1" (
    call RUN_ANDROID_STUDIO.bat
) else if "%choice%"=="2" (
    echo Expo 개발 서버 시작 중...
    call npm start
) else if "%choice%"=="3" (
    echo Android 에뮬레이터에서 실행 중...
    call npm run android
) else if "%choice%"=="4" (
    echo 웹 브라우저에서 실행 중...
    call npm run web
) else (
    echo 잘못된 선택입니다.
    pause
    exit /b 1
)
















