@echo off
cd /d "%~dp0"
echo.
echo ========================================
echo   Capacitor APK 빌드
echo ========================================
echo.

echo [1/3] 웹 앱 빌드...
npm run build
if errorlevel 1 goto error

echo.
echo [2/3] Capacitor 동기화...
npx cap sync android
if errorlevel 1 goto error

echo.
echo [3/3] APK 빌드...
cd android
call gradlew assembleDebug
if errorlevel 1 goto error

cd ..
echo.
echo ========================================
echo   APK 빌드 완료!
echo ========================================
echo.
echo APK 위치:
echo   android\app\build\outputs\apk\debug\app-debug.apk
echo.
pause
exit /b 0

:error
cd ..
echo.
echo 오류가 발생했습니다!
pause
exit /b 1
