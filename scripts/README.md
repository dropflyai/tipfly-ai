# TipGenius Development Scripts

This directory contains helper scripts for developing and testing the TipGenius app.

## Available Scripts

### capture-screen.bat
Captures screenshots from Android device/emulator without corruption issues.

**Usage:**
```bash
# From project root
.\capture-screen.bat
```

**What it does:**
1. Captures screenshot on device to `/sdcard/screenshot.png`
2. Pulls screenshot to `./screenshots/tipgenius_TIMESTAMP.png`
3. Cleans up temporary file on device

**Output:** Screenshots are saved in `./screenshots/` directory with timestamps.

### dev-tools.bat
Interactive menu with common development tasks.

**Usage:**
```bash
# From project root
.\scripts\dev-tools.bat
```

**Features:**
1. **Capture Screenshot** - Take a screenshot of the current app state
2. **Launch App** - Start the app on connected device/emulator
3. **View Logs** - Stream React Native and error logs
4. **Restart App** - Force stop and relaunch the app
5. **Clear App Data** - Reset app to fresh state (with confirmation)

## Why These Scripts?

### Screenshot Issues
The standard `adb screencap -p` command outputs binary PNG data directly to stdout, which can get corrupted when piped through the terminal (especially on Windows). This causes Claude Code to fail with "Could not process image" errors.

**Solution:** These scripts save the screenshot to device storage first, then pull it to your computer - avoiding corruption.

### Common Pain Points
- Manually typing long ADB commands
- Remembering package names
- Cleaning up temporary files
- Finding screenshot files

## Prerequisites

- Android SDK Platform Tools (adb) installed
- Device/emulator connected and authorized
- TipGenius app installed on device

## Troubleshooting

### "adb is not recognized"
Add Android SDK platform-tools to your PATH:
```
C:\Users\YourName\AppData\Local\Android\Sdk\platform-tools
```

### "device not found"
1. Check device is connected: `adb devices`
2. Enable USB debugging on device
3. Authorize computer on device

### App won't launch
1. Check app is installed: `adb shell pm list packages | findstr tipflyai`
2. Install app first: `npm run android`

## Integration with Claude Code

When Claude Code needs screenshots during development, simply run:
```bash
.\capture-screen.bat
```

Then reference the screenshot file path in your conversation. No more "Could not process image" errors!

## Tips

- **Timestamps**: All screenshots are timestamped, so you won't overwrite previous captures
- **Clean workspace**: Delete old screenshots from `./screenshots/` periodically
- **Quick access**: Add these to npm scripts in package.json for even faster access

## Future Improvements

- [ ] Add iOS screenshot support
- [ ] Compress screenshots automatically
- [ ] Upload directly to cloud storage
- [ ] Record video demos
- [ ] Automated screenshot comparison for visual regression testing
