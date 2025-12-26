@echo off
echo ========================================
echo LiveJourney - Expo 앱 실행
echo ========================================
echo.

cd /d "%~dp0"

echo 현재 디렉토리: %CD%
echo.

echo Expo 서버를 시작합니다...
echo.
echo 옵션:
echo   - 'a' 키를 누르면 Android 에뮬레이터/기기에서 실행
echo   - 'w' 키를 누르면 웹 브라우저에서 실행
echo   - QR 코드를 스캔하면 Expo Go 앱에서 실행
echo.

call npm start

pause

















































