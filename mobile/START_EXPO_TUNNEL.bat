@echo off
chcp 65001 >nul
@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════╗
echo ║   LiveJourney - Expo 터널 모드        ║
echo ║   🌟 다른 Wi-Fi에서도 작동!          ║
echo ╚════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo [1/2] 패키지 설치 확인 중...
if not exist "node_modules" (
    echo 패키지를 설치합니다...
    call npm install
)

echo.
echo [2/2] Expo 터널 모드 시작 중...
echo.
echo ╔════════════════════════════════════════╗
echo ║   터널 모드 사용법                    ║
echo ╚════════════════════════════════════════╝
echo.
echo 📱 폰에서 보기:
echo    1. Expo Go 앱 설치 (Play Store에서 "Expo Go" 검색)
echo    2. 터미널에 나타나는 QR 코드를 스캔
echo    3. ✅ 다른 Wi-Fi에 있어도 작동합니다!
echo    4. ✅ 어디서든 접속 가능합니다!
echo.
echo ✨ 장점:
echo    - PC와 폰이 다른 Wi-Fi에 있어도 OK
echo    - 네트워크 설정 걱정 없음
echo    - 원격으로도 접속 가능
echo.
echo ⚠️  참고:
echo    - 일반 모드보다 조금 느릴 수 있습니다
echo    - 하지만 어디서든 사용 가능합니다!
echo.
echo ════════════════════════════════════════
echo.

call npm run tunnel

pause

