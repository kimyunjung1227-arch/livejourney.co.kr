@echo off
echo ========================================
echo LiveJourney Android Studio 실행 가이드
echo ========================================
echo.
echo 1. Android Studio를 실행하세요
echo 2. "Open an Existing Project" 선택
echo 3. 다음 경로를 선택하세요:
echo    %CD%\android
echo.
echo 또는 Android Studio가 설치되어 있다면:
echo.
start "" "C:\Program Files\Android\Android Studio\bin\studio64.exe" "%CD%\android"
echo.
echo Android Studio가 열리면:
echo - Gradle 동기화 대기
echo - Tools ^> Device Manager에서 에뮬레이터 생성/실행
echo - Run 버튼(Shift+F10) 클릭
echo.
pause


