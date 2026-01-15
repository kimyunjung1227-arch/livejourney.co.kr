@echo off
chcp 65001 >nul
echo ========================================
echo GitHub Pages 배포 준비
echo ========================================
echo.

echo [1/3] 필수 파일 확인 중...
if not exist "web\package.json" (
    echo ❌ 오류: web\package.json 파일이 없습니다!
    pause
    exit /b 1
)

if not exist ".github\workflows\deploy.yml" (
    echo ❌ 오류: .github\workflows\deploy.yml 파일이 없습니다!
    pause
    exit /b 1
)

if not exist "web\public\404.html" (
    echo ❌ 오류: web\public\404.html 파일이 없습니다!
    pause
    exit /b 1
)

echo ✅ 필수 파일 확인 완료
echo.

echo [2/3] Git 상태 확인 중...
git status --short
echo.

echo [3/3] 배포할 파일 추가 중...
echo.
echo 다음 파일들을 추가합니다:
echo   - web/ 폴더 전체
echo   - .github/workflows/deploy.yml
echo   - .gitignore
echo   - README.md (있는 경우)
echo   - GITHUB_DEPLOY_GUIDE.md (있는 경우)
echo   - 카페_공유_가이드.md (있는 경우)
echo.

git add web/
git add .github/
git add .gitignore

if exist "README.md" git add README.md
if exist "GITHUB_DEPLOY_GUIDE.md" git add GITHUB_DEPLOY_GUIDE.md
if exist "카페_공유_가이드.md" git add "카페_공유_가이드.md"

echo.
echo ✅ 파일 추가 완료
echo.
echo ========================================
echo 다음 단계:
echo ========================================
echo 1. git commit -m "Deploy to GitHub Pages"
echo 2. git push origin master
echo.
echo 또는 이 스크립트를 계속 실행하면 자동으로 커밋하고 푸시합니다.
echo.
set /p choice="자동으로 커밋하고 푸시하시겠습니까? (Y/N): "

if /i "%choice%"=="Y" (
    echo.
    echo 커밋 중...
    git commit -m "Deploy web app to GitHub Pages"
    
    if %errorlevel% equ 0 (
        echo.
        echo 푸시 중...
        git push origin master
        
        if %errorlevel% equ 0 (
            echo.
            echo ========================================
            echo ✅ 배포 완료!
            echo ========================================
            echo.
            echo GitHub Actions에서 배포가 자동으로 시작됩니다.
            echo 배포 완료 후 다음 URL로 접속하세요:
            echo https://kimyunjung1227-arch.github.io/app/
            echo.
        ) else (
            echo.
            echo ❌ 푸시 실패. 수동으로 푸시해주세요:
            echo git push origin master
        )
    ) else (
        echo.
        echo ❌ 커밋 실패. 변경사항이 없거나 오류가 발생했습니다.
    )
) else (
    echo.
    echo 수동으로 커밋하고 푸시하세요:
    echo   git commit -m "Deploy to GitHub Pages"
    echo   git push origin master
)

echo.
pause
