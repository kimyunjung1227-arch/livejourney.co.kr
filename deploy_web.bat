@echo off
echo ===========================================
echo Live Journey Web Deployment Script
echo ===========================================
echo.

:: Move to the web directory
cd /d "%~dp0\web"

if errorlevel 1 (
    echo Error: Could not find 'web' directory.
    echo Please make sure this file is inside the 'mvp1' folder.
    pause
    exit /b 1
)

echo Current Directory: %CD%
echo.
echo Installing dependencies (just in case)...
call npm install
echo.

echo Starting Deployment...
echo [NOTE] If a GitHub login window appears, please sign in.
echo.
call npm run deploy

if errorlevel 1 (
    echo.
    echo [ERROR] Deployment failed. Please check the error messages above.
) else (
    echo.
    echo [SUCCESS] Deployment completed successfully!
    echo The site should be live in a few minutes at:
    echo https://kimyunjung1227-arch.github.io/livejourney.co.kr/
)

echo.
pause
