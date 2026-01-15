@echo off
chcp 65001 >nul
echo ====================================
echo   LiveJourney APK 빌드
echo ====================================
echo.

cd /d "%~dp0"

echo [1/3] 웹 앱 빌드 중...
call npm run build
if errorlevel 1 (
    echo 오류: 웹 앱 빌드 실패
    pause
    exit /b 1
)

echo.
echo [2/3] Capacitor Android 동기화 중...
call npx cap sync android
if errorlevel 1 (
    echo 오류: Capacitor 동기화 실패
    pause
    exit /b 1
)

echo.
echo [3/3] APK 빌드 중...
cd android
call gradlew.bat assembleDebug
if errorlevel 1 (
    echo 오류: APK 빌드 실패
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo [4/4] APK를 public 폴더로 복사 중...
if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "public\app-debug.apk"
    echo APK가 public 폴더에 복사되었습니다. (웹 배포용)
) else (
    echo 경고: APK 파일을 찾을 수 없습니다.
)

echo.
echo ====================================
echo   빌드 완료!
echo ====================================
echo.
echo APK 위치:
echo   android\app\build\outputs\apk\debug\app-debug.apk
echo   public\app-debug.apk (웹 배포용)
echo.
echo 이 파일을 핸드폰으로 전송하여 설치하거나 웹에서 다운로드할 수 있습니다.
echo.
pause

