@echo off
chcp 65001 > nul
cls
echo.
echo ========================================
echo   Capacitor 앱 웹 브라우저에서 실행
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] 개발 서버 시작...
echo.
echo 브라우저가 자동으로 열립니다.
echo 포트: http://localhost:3000
echo.
echo 종료하려면: Ctrl + C
echo.

call npm run dev

pause
