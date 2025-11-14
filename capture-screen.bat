@echo off
REM TipGenius App Screenshot Tool
REM Captures screenshots from Android device/emulator without corruption

setlocal enabledelayedexpansion

REM Get timestamp for unique filename
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%

REM Define output path
set OUTPUT_DIR=%~dp0screenshots
set OUTPUT_FILE=%OUTPUT_DIR%\tipgenius_%TIMESTAMP%.png

REM Create screenshots directory if it doesn't exist
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

echo [TipGenius] Capturing screenshot...

REM Step 1: Capture screenshot to device storage
adb shell screencap -p /sdcard/screenshot.png

REM Check if capture was successful
if %errorlevel% neq 0 (
    echo [ERROR] Failed to capture screenshot on device
    exit /b 1
)

echo [TipGenius] Screenshot captured on device

REM Step 2: Pull screenshot from device to computer
adb pull /sdcard/screenshot.png "%OUTPUT_FILE%"

REM Check if pull was successful
if %errorlevel% neq 0 (
    echo [ERROR] Failed to pull screenshot from device
    exit /b 1
)

echo [TipGenius] Screenshot saved to: %OUTPUT_FILE%

REM Step 3: Clean up temporary file on device
adb shell rm /sdcard/screenshot.png

echo [TipGenius] Screenshot complete!
echo.
echo File saved: %OUTPUT_FILE%

endlocal
