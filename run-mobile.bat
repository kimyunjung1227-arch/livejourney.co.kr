@echo off
chcp 65001 >nul
title LiveJourney Mobile Runner

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║                                                      ║
echo ║   🚀 Starting LiveJourney Mobile (Expo)...            ║
echo ║                                                      ║
echo ╚══════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"
cd mobile

echo 📱 [1/3] Navigating to mobile folder...
echo.

echo 📦 [2/3] Checking dependencies...
if not exist "node_modules" (
    echo ⚠️  Dependencies not found. Installing... (takes 1-2 mins)
    call npm install
)

echo.
echo 🌐 [3/3] Starting Expo with Tunnel...
echo.
echo 💡 [Instruction]
echo    1. Install 'Expo Go' app on your phone.
echo    2. Scan the QR code that will appear shortly.
echo    3. Works even if PC and phone are on different Wi-Fi!
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

call npm run tunnel

pause
