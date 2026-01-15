@echo off
chcp 65001 >nul
echo ========================================
echo   LiveJourney - Expo 앱 실행
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] 패키지 설치 확인 중...
if not exist "node_modules" (
    echo 패키지를 설치합니다...
    call npm install
)

echo.
echo [2/2] Expo 서버 시작 중...
echo.
echo ========================================
echo   사용 방법:
echo ========================================
echo.
echo 📱 폰에서 보기:
echo    1. Expo Go 앱 설치 (Play Store에서 "Expo Go" 검색)
echo    2. 터미널에 나타나는 QR 코드를 스캔
echo    3. PC와 폰이 같은 Wi-Fi에 연결되어 있어야 합니다
echo.
echo ⚠️  다른 Wi-Fi에 있다면:
echo    START_EXPO_TUNNEL.bat 파일을 사용하세요!
echo    (터널 모드: 어디서든 접속 가능)
echo.
echo 💻 키보드 단축키:
echo    [a] - Android 에뮬레이터/기기에서 실행
echo    [w] - 웹 브라우저에서 실행
echo    [r] - 앱 새로고침
echo.
echo ========================================
echo.

call npm start

pause





















































