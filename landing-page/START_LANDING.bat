@echo off
echo ========================================
echo 라이브 저니 랜딩 페이지 시작
echo ========================================
echo.

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Python 발견! 로컬 서버를 시작합니다...
    echo.
    echo 브라우저에서 http://localhost:8000 을 열어주세요
    echo.
    echo 종료하려면 Ctrl+C를 누르세요
    echo.
    python -m http.server 8000
) else (
    echo Python이 설치되어 있지 않습니다.
    echo 브라우저에서 index.html 파일을 직접 여세요.
    echo.
    pause
    start index.html
)




























































