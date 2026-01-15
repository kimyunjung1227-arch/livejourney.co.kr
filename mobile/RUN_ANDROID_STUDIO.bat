@echo off
chcp 65001 > nul
echo ========================================
echo 📱 LiveJourney - Android Studio 실행
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] 프로젝트 확인 중...
if not exist "package.json" (
    echo ❌ package.json을 찾을 수 없습니다.
    echo    올바른 디렉토리에서 실행해주세요.
    pause
    exit /b 1
)
echo ✅ 프로젝트 확인됨

echo.
echo [2/4] 의존성 확인 중...
if not exist "node_modules" (
    echo ⚠️  node_modules가 없습니다. 설치를 시작합니다...
    call npm install
    if errorlevel 1 (
        echo ❌ npm install 실패
        pause
        exit /b 1
    )
) else (
    echo ✅ node_modules 확인됨
)

echo.
echo [3/4] Android 네이티브 코드 확인 중...
if not exist "android" (
    echo ⚠️  android 폴더가 없습니다. 생성 중...
    call npx expo prebuild --platform android --clean
    if errorlevel 1 (
        echo ❌ Expo prebuild 실패
        pause
        exit /b 1
    )
) else (
    echo ✅ android 폴더 확인됨
)

echo.
echo [4/4] Android Studio 실행 중...
echo.

REM Android Studio 경로 찾기
set "STUDIO_PATH="
set "STUDIO_FOUND=0"

echo Android Studio 경로 검색 중...
REM 일반적인 설치 경로 확인
if exist "C:\Program Files\Android\Android Studio\bin\studio64.exe" (
    set "STUDIO_PATH=C:\Program Files\Android\Android Studio\bin\studio64.exe"
    set "STUDIO_FOUND=1"
    goto :studio_found
)
if exist "C:\Program Files (x86)\Android\Android Studio\bin\studio64.exe" (
    set "STUDIO_PATH=C:\Program Files (x86)\Android\Android Studio\bin\studio64.exe"
    set "STUDIO_FOUND=1"
    goto :studio_found
)
if exist "%LOCALAPPDATA%\Programs\Android Studio\bin\studio64.exe" (
    set "STUDIO_PATH=%LOCALAPPDATA%\Programs\Android Studio\bin\studio64.exe"
    set "STUDIO_FOUND=1"
    goto :studio_found
)

REM 환경 변수에서 찾기
where studio64.exe >nul 2>&1
if not errorlevel 1 (
    for /f "delims=" %%i in ('where studio64.exe 2^>nul') do (
        set "STUDIO_PATH=%%i"
        set "STUDIO_FOUND=1"
        goto :studio_found
    )
)

:studio_found

REM Android Studio 실행
if %STUDIO_FOUND%==1 (
    echo ✅ Android Studio 찾음: %STUDIO_PATH%
    echo.
    echo 📁 다음 경로를 열고 있습니다:
    echo    %cd%\android
    echo.
    
    REM 현재 디렉토리 저장
    set "ANDROID_PROJECT_PATH=%cd%\android"
    
    REM Android Studio 실행 (여러 방법 시도)
    echo Android Studio 실행 시도 중...
    
    REM 방법 1: start 명령어 사용 (백그라운드 실행)
    start "" "%STUDIO_PATH%" "%ANDROID_PROJECT_PATH%"
    
    REM 실행 확인을 위해 잠시 대기
    timeout /t 3 /nobreak >nul
    
    REM 프로세스 확인
    tasklist /FI "IMAGENAME eq studio64.exe" 2>NUL | find /I /N "studio64.exe">NUL
    if "%ERRORLEVEL%"=="0" (
        echo ✅ Android Studio가 실행되었습니다!
        echo.
        echo Gradle 동기화가 완료될 때까지 기다려주세요 (2-5분).
    ) else (
        echo ⚠️  Android Studio 프로세스를 확인할 수 없습니다.
        echo.
        echo PowerShell 스크립트로 재시도합니다...
        echo.
        REM PowerShell 스크립트 실행
        powershell -ExecutionPolicy Bypass -File "%~dp0RUN_ANDROID_STUDIO.ps1"
        if errorlevel 1 (
            echo.
            echo ❌ 실행 실패
            echo.
            echo 수동으로 열어주세요:
            echo   1. Android Studio 실행
            echo   2. File → Open
            echo   3. 다음 경로 선택: %ANDROID_PROJECT_PATH%
            echo.
            echo 💡 경로가 클립보드에 복사되었습니다.
            echo %ANDROID_PROJECT_PATH% | clip
        )
    )
) else (
    echo ⚠️  Android Studio를 자동으로 찾을 수 없습니다.
    echo.
    echo 다음 방법 중 하나를 시도해주세요:
    echo.
    echo [방법 1] Android Studio가 설치되어 있는지 확인
    echo    - 설치되어 있지 않다면: https://developer.android.com/studio
    echo.
    echo [방법 2] 수동으로 Android Studio 열기
    echo    1. Android Studio 실행
    echo    2. File → Open
    echo    3. 다음 경로 선택: %cd%\android
    echo.
    echo [방법 3] Android Studio를 PATH에 추가
    echo    - Android Studio 설치 경로의 bin 폴더를 시스템 PATH에 추가
    echo.
    echo 📁 프로젝트 경로: %cd%\android
    echo.
    REM 경로를 클립보드에 복사
    echo %cd%\android | clip
    echo 💡 경로가 클립보드에 복사되었습니다. Ctrl+V로 붙여넣기 하세요.
    echo.
)

echo.
echo ========================================
echo ✅ 준비 완료!
echo ========================================
echo.
echo 📋 Android Studio에서 다음 단계를 진행하세요:
echo.
echo    1. ⏳ Gradle 동기화 대기 (2-5분 소요)
echo       - 하단 상태바에서 "Gradle Sync" 완료 확인
echo       - "Build finished" 메시지 확인
echo.
echo    2. 📱 에뮬레이터 또는 디바이스 준비
echo       - Tools → Device Manager → Create Device (에뮬레이터)
echo       - 또는 USB로 실제 디바이스 연결
echo.
echo    3. ▶️  앱 실행
echo       - 상단 메뉴: Run → Run 'app'
echo       - 또는 녹색 재생 버튼 ▶ 클릭
echo       - 또는 Shift + F10 단축키
echo.
echo    4. 🎉 앱이 독립적으로 설치되고 실행됩니다!
echo       - Expo Go 없이 완전히 독립적인 네이티브 앱
echo       - 앱 이름: LiveJourney
echo.
echo 💡 팁:
echo    - Gradle 동기화가 오래 걸리면 File → Sync Project with Gradle Files
echo    - 빌드 오류가 있으면 File → Invalidate Caches / Restart
echo.
pause
































