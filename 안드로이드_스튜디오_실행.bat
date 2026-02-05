@echo off
chcp 65001 > nul
title LiveJourney 안드로이드 스튜디오 실행기

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║                                                      ║
echo ║   📱 LiveJourney 안드로이드 스튜디오를 실행합니다      ║
echo ║                                                      ║
echo ╚══════════════════════════════════════════════════════╝
echo.

set "PROJECT_ROOT=%~dp0"
set "ANDROID_PATH=%~dp0mobile\android"

echo [1/3] 안드로이드 프로젝트 확인 중...
if not exist "%ANDROID_PATH%" (
    echo ❌ 안드로이드 프로젝트 폴더를 찾을 수 없습니다: %ANDROID_PATH%
    echo    'mobile' 폴더 안에 'android' 폴더가 있는지 확인해주세요.
    pause
    exit /b 1
)
echo ✅ 안드로이드 프로젝트 확인됨
echo.

echo [2/3] 안드로이드 스튜디오 설치 경로 찾는 중...
set "STUDIO_PATH="

REM 일반적인 설치 경로 확인
if exist "C:\Program Files\Android\Android Studio\bin\studio64.exe" (
    set "STUDIO_PATH=C:\Program Files\Android\Android Studio\bin\studio64.exe"
) else if exist "C:\Program Files (x86)\Android\Android Studio\bin\studio64.exe" (
    set "STUDIO_PATH=C:\Program Files (x86)\Android\Android Studio\bin\studio64.exe"
) else if exist "%LOCALAPPDATA%\Programs\Android Studio\bin\studio64.exe" (
    set "STUDIO_PATH=%LOCALAPPDATA%\Programs\Android Studio\bin\studio64.exe"
)

if "%STUDIO_PATH%"=="" (
    echo ⚠️  안드로이드 스튜디오를 자동으로 찾을 수 없습니다.
    echo    수동으로 실행한 뒤 '%ANDROID_PATH%' 폴더를 열어주세요.
    pause
    exit /b 1
)
echo ✅ 안드로이드 스튜디오 발견: %STUDIO_PATH%
echo.

echo [3/3] 안드로이드 스튜디오 실행 및 프로젝트 로딩...
start "" "%STUDIO_PATH%" "%ANDROID_PATH%"

echo.
echo 🚀 실행 명령을 보냈습니다!
echo    안드로이드 스튜디오가 켜지면 하단의 Gradle Sync가 끝날 때까지 기다려주세요.
echo.
timeout /t 5
exit
