@echo off
echo ========================================
echo   백엔드 서버 시작 스크립트
echo ========================================
echo.

REM 포트 5000을 사용하는 프로세스 확인 및 종료
echo [1/3] 포트 5000 확인 중...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo   포트 5000 사용 중인 프로세스 발견: PID %%a
    echo   프로세스 종료 중...
    taskkill /F /PID %%a >nul 2>&1
    if errorlevel 1 (
        echo   프로세스 종료 실패 (이미 종료되었을 수 있음)
    ) else (
        echo   프로세스 종료 완료
    )
    timeout /t 1 /nobreak >nul
)

REM .env 파일 확인
echo [2/3] .env 파일 확인 중...
if not exist .env (
    echo   .env 파일이 없습니다. env.example을 복사합니다...
    copy env.example .env >nul
    echo   .env 파일 생성 완료. API 키를 설정해주세요!
    pause
    exit /b 1
) else (
    echo   .env 파일 존재 확인
)

REM 서버 시작
echo [3/3] 서버 시작 중...
echo.
node server.js

if errorlevel 1 (
    echo.
    echo ========================================
    echo   서버 시작 실패!
    echo ========================================
    pause
)
