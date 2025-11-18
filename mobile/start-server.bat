@echo off
echo ========================================
echo LiveJourney Mobile Server 시작
echo ========================================
echo.
echo Expo 터널 모드로 서버를 시작합니다...
echo 핸드폰에서 QR 코드를 스캔하여 연결하세요.
echo.
echo 종료하려면 Ctrl+C를 누르세요.
echo ========================================
echo.

cd /d %~dp0
npm run tunnel

pause



