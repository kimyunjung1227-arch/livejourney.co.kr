# LiveJourney - Android Studio 실행 (PowerShell)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📱 LiveJourney - Android Studio 실행" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 현재 디렉토리로 이동
Set-Location $PSScriptRoot

# 프로젝트 확인
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json을 찾을 수 없습니다." -ForegroundColor Red
    Write-Host "   올바른 디렉토리에서 실행해주세요." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "✅ 프로젝트 확인됨" -ForegroundColor Green

# Android 폴더 확인
if (-not (Test-Path "android")) {
    Write-Host "⚠️  android 폴더가 없습니다. 생성 중..." -ForegroundColor Yellow
    npx expo prebuild --platform android --clean
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Expo prebuild 실패" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}
Write-Host "✅ android 폴더 확인됨" -ForegroundColor Green

# Android Studio 경로 찾기
$studioPaths = @(
    "C:\Program Files\Android\Android Studio\bin\studio64.exe",
    "C:\Program Files (x86)\Android\Android Studio\bin\studio64.exe",
    "$env:LOCALAPPDATA\Programs\Android Studio\bin\studio64.exe"
)

$studioPath = $null
foreach ($path in $studioPaths) {
    if (Test-Path $path) {
        $studioPath = $path
        break
    }
}

# 환경 변수에서 찾기
if ($null -eq $studioPath) {
    $studioPath = Get-Command studio64.exe -ErrorAction SilentlyContinue
    if ($studioPath) {
        $studioPath = $studioPath.Source
    }
}

if ($null -eq $studioPath) {
    Write-Host "❌ Android Studio를 찾을 수 없습니다." -ForegroundColor Red
    Write-Host ""
    Write-Host "다음 방법을 시도해주세요:" -ForegroundColor Yellow
    Write-Host "  1. Android Studio 설치 확인"
    Write-Host "  2. 수동으로 Android Studio 실행 후 File → Open"
    Write-Host "  3. 프로젝트 경로: $PWD\android" -ForegroundColor Cyan
    Write-Host ""
    Set-Clipboard "$PWD\android"
    Write-Host "💡 경로가 클립보드에 복사되었습니다." -ForegroundColor Green
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Android Studio 찾음: $studioPath" -ForegroundColor Green
Write-Host ""
Write-Host "📁 프로젝트 경로: $PWD\android" -ForegroundColor Cyan
Write-Host ""

# Android Studio 실행
Write-Host "Android Studio 실행 중..." -ForegroundColor Yellow
try {
    $projectPath = "$PWD\android"
    Start-Process -FilePath $studioPath -ArgumentList $projectPath -ErrorAction Stop
    Write-Host "✅ Android Studio가 실행되었습니다!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Gradle 동기화가 완료될 때까지 기다려주세요 (2-5분)." -ForegroundColor Yellow
} catch {
    Write-Host "❌ Android Studio 실행 실패: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "수동으로 실행해주세요:" -ForegroundColor Yellow
    Write-Host "  1. Android Studio 실행"
    Write-Host "  2. File → Open"
    Write-Host "  3. 경로: $PWD\android" -ForegroundColor Cyan
    Write-Host ""
    Set-Clipboard "$PWD\android"
    Write-Host "💡 경로가 클립보드에 복사되었습니다." -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ 준비 완료!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Android Studio에서 다음 단계를 진행하세요:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. ⏳ Gradle 동기화 대기 (2-5분 소요)"
Write-Host "  2. 📱 에뮬레이터 또는 디바이스 준비"
Write-Host "  3. ▶️  Run → Run 'app' 클릭"
Write-Host "  4. 🎉 앱이 독립적으로 설치되고 실행됩니다!"
Write-Host ""
Read-Host "Press Enter to exit"
































