@echo off
REM TipGenius Development Tools Menu

:menu
echo ========================================
echo   TipGenius Development Tools
echo ========================================
echo.
echo 1. Capture Screenshot
echo 2. Launch App on Device
echo 3. View Device Logs
echo 4. Restart App
echo 5. Clear App Data
echo 6. Exit
echo.
set /p choice="Select an option (1-6): "

if "%choice%"=="1" goto screenshot
if "%choice%"=="2" goto launch
if "%choice%"=="3" goto logs
if "%choice%"=="4" goto restart
if "%choice%"=="5" goto clear
if "%choice%"=="6" goto end
echo Invalid choice. Please try again.
goto menu

:screenshot
echo.
echo Capturing screenshot...
call "%~dp0..\capture-screen.bat"
echo.
pause
goto menu

:launch
echo.
echo Launching TipGenius app...
adb shell monkey -p com.tipflyai.app -c android.intent.category.LAUNCHER 1
if %errorlevel% neq 0 (
    echo [ERROR] Failed to launch app. Is it installed?
) else (
    echo [SUCCESS] App launched successfully
)
echo.
pause
goto menu

:logs
echo.
echo Viewing app logs (Press Ctrl+C to stop)...
echo.
adb logcat -s ReactNativeJS:* ReactNative:* *:E
pause
goto menu

:restart
echo.
echo Restarting TipGenius app...
adb shell am force-stop com.tipflyai.app
timeout /t 2 /nobreak >nul
adb shell monkey -p com.tipflyai.app -c android.intent.category.LAUNCHER 1
echo [SUCCESS] App restarted
echo.
pause
goto menu

:clear
echo.
echo WARNING: This will clear all app data!
set /p confirm="Are you sure? (y/n): "
if /i "%confirm%"=="y" (
    adb shell pm clear com.tipflyai.app
    echo [SUCCESS] App data cleared
) else (
    echo Operation cancelled
)
echo.
pause
goto menu

:end
echo.
echo Goodbye!
exit /b 0
