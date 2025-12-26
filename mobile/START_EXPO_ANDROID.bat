@echo off
echo ========================================
echo LiveJourney - Expo Android 실행
echo ========================================
echo.

cd /d "%~dp0"

echo 현재 디렉토리: %CD%
echo.

echo Android 기기/에뮬레이터에서 앱을 실행합니다...
echo.
echo 참고:
echo   - Android 에뮬레이터가 실행 중이어야 합니다
echo   - 또는 USB로 연결된 Android 기기가 있어야 합니다
echo   - 또는 Expo Go 앱이 설치된 기기가 같은 Wi-Fi에 연결되어 있어야 합니다
echo.

call npm run android

pause

















































