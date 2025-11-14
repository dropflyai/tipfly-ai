# Screenshot Fix - No More "Could Not Process Image" Errors

## The Problem

When using `adb screencap -p` to capture screenshots directly to stdout, the binary PNG data often gets corrupted when piped through the terminal (especially on Windows). This causes Claude Code to fail with:

```
API Error: 400 {"type":"error","error":{"type":"invalid_request_error","message":"Could not process image"}}
```

## The Solution

We've created helper scripts that capture screenshots properly by:
1. Saving screenshot to device storage first (`/sdcard/screenshot.png`)
2. Pulling the file to your computer
3. Cleaning up the temporary file on device

This avoids binary data corruption completely.

## Quick Start

### Option 1: Use the Screenshot Script (Recommended)

```bash
# From project root
.\capture-screen.bat
```

Screenshots are automatically saved to `./screenshots/tipgenius_TIMESTAMP.png`

### Option 2: Use the Dev Tools Menu

```bash
# From project root
.\scripts\dev-tools.bat
```

This gives you an interactive menu with:
1. Capture Screenshot
2. Launch App on Device
3. View Device Logs
4. Restart App
5. Clear App Data

### Option 3: Manual Commands

If you prefer to run commands manually:

```bash
# Step 1: Capture to device
adb shell screencap -p /sdcard/screenshot.png

# Step 2: Pull to computer
adb pull /sdcard/screenshot.png C:/Users/escot/tip-genius-app/screenshots/screenshot.png

# Step 3: Clean up
adb shell rm /sdcard/screenshot.png
```

## Integration with Claude Code

When Claude Code asks for a screenshot or you want to show the current app state:

1. Run `.\capture-screen.bat`
2. Note the output path (e.g., `screenshots/tipgenius_20250111_143025.png`)
3. Reference that path in your conversation

**No more errors!** The screenshots are properly saved as files and can be read without corruption.

## Files Created

- **capture-screen.bat** - Main screenshot utility (project root)
- **scripts/dev-tools.bat** - Interactive development menu
- **scripts/README.md** - Detailed documentation
- **screenshots/** - Directory where screenshots are saved (auto-created)

## Benefits

✅ No more "Could not process image" errors
✅ Timestamps prevent overwriting
✅ Clean, organized screenshot storage
✅ Easy to use - just one command
✅ Works reliably on Windows with ADB

## Troubleshooting

### "adb is not recognized"
Add Android SDK platform-tools to your PATH:
```
C:\Users\escot\AppData\Local\Android\Sdk\platform-tools
```

### "device not found"
1. Check device is connected: `adb devices`
2. Enable USB debugging on device
3. Authorize computer on device

### Permission denied on device
```bash
# Give write permissions
adb shell chmod 777 /sdcard
```

## Next Steps

You can now safely use screenshots in your Claude Code sessions without worrying about corruption errors. The scripts handle all the complexity for you!

For more details, see [scripts/README.md](./scripts/README.md)
