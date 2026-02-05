@echo off
chcp 65001 > nul
cls
echo.
echo ========================================
echo   Android 에뮬레이터 문제 해결 가이드
echo ========================================
echo.

echo [문제 진단]
echo.
echo 1. AVD(에뮬레이터)가 생성되어 있나요?
echo    → Android Studio → Tools → Device Manager 확인
echo.
echo 2. 시스템 이미지가 다운로드되어 있나요?
echo    → SDK Manager → SDK Platforms → API 33/34 체크
echo.
echo 3. 하이퍼바이저가 활성화되어 있나요?
echo    → BIOS에서 Virtualization 활성화 필요
echo.

echo ========================================
echo   추천 해결 방법
echo ========================================
echo.
echo [방법 1] 실제 안드로이드 폰 사용 (가장 빠름!)
echo.
echo   1. 안드로이드 폰 설정:
echo      - 설정 → 휴대전화 정보 → 빌드 번호 7번 탭
echo      - 설정 → 개발자 옵션 → USB 디버깅 활성화
echo.
echo   2. USB로 PC에 연결
echo.
echo   3. Android Studio에서 Run → 실제 폰 선택
echo.
echo [방법 2] 에뮬레이터 생성
echo.
echo   1. Android Studio → Tools → Device Manager
echo   2. Create Device 클릭
echo   3. Pixel 5 또는 Pixel 6 선택
echo   4. 시스템 이미지 다운로드 (API 33 또는 34)
echo   5. Finish
echo.

echo ========================================
echo   자세한 가이드
echo ========================================
echo.
echo   - 에뮬레이터_설정가이드.md 파일 참고
echo   - 실제디바이스_연결가이드.md 파일 참고
echo.

pause
