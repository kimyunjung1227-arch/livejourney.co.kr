@echo off
chcp 65001 >nul
echo ========================================
echo   백엔드 서버 시작 (포트 정리 포함)
echo ========================================
echo.

echo 포트 5000 정리 중...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo   PID %%a 프로세스 종료 중...
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul

echo.
echo 서버 시작 중...
echo.
node server.js

pause
