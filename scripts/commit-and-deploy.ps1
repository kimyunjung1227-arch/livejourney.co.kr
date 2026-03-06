# 커밋 + 푸시 + 웹 배포 한 번에 실행
#
# 사용법 (프로젝트 루트에서):
#   npm run ship                    → 기본 메시지로 커밋 후 푸시·배포
#   npm run ship -- "fix: 버그 수정"  → 커밋 메시지 지정
#   .\scripts\commit-and-deploy.ps1 "feat: 새 기능"
param(
  [string]$Message
)
if (-not $Message -and $args.Count -gt 0) { $Message = $args[0] }
if (-not $Message) { $Message = "chore: update and deploy" }

$ErrorActionPreference = "Stop"
$root = if (Test-Path ".git") { (Get-Location).Path } else { Split-Path -Parent (Split-Path -Parent $PSScriptRoot) }
Set-Location $root

Write-Host "=== 1. Git add ===" -ForegroundColor Cyan
git add -A
git status --short

$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
  Write-Host "변경 사항 없음. 배포만 진행 (y/N): " -NoNewline
  $ans = Read-Host
  if ($ans -ne "y" -and $ans -ne "Y") { exit 0 }
} else {
  Write-Host "`n=== 2. Git commit ===" -ForegroundColor Cyan
  git commit -m $Message
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "`n=== 3. Git push ===" -ForegroundColor Cyan
git push
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n=== 4. Web build & deploy ===" -ForegroundColor Cyan
Push-Location "web"
npm run deploy
$deployExit = $LASTEXITCODE
Pop-Location
if ($deployExit -ne 0) {
  Write-Host "배포 단계 실패 (푸시는 완료됨)." -ForegroundColor Yellow
  exit $deployExit
}

Write-Host "`n완료." -ForegroundColor Green
