# TipFly AI - iPad Screenshot Instructions

## Setup Steps

### 1. Pull Latest Code
```bash
git pull origin main
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Expo Dev Server
```bash
npx expo start
```

### 4. Open iOS Simulator
- Press `i` in the terminal to open iOS Simulator
- **OR** Open Xcode → Open Developer Tool → Simulator
- Select **iPad Pro 12.9-inch (6th generation)**

### 5. Run the App
- The app should automatically load on the iPad simulator
- If not, press `i` again in the terminal

## Taking Screenshots

### Required Screenshots (5 total):

1. **AI Prediction Screen** (Main/Dashboard)
   - Shows earnings prediction with confidence level
   - File name: `TipFly-iPad-1-AI-Prediction.png`

2. **Analytics Screen** (Stats Tab)
   - Shows weekly earnings chart and monthly trends
   - File name: `TipFly-iPad-2-Analytics.png`

3. **Goals Screen** (Premium feature)
   - Shows goal tracking and progress
   - File name: `TipFly-iPad-3-Goals.png`

4. **Tip History Screen** (History Tab)
   - Shows list of recent tip entries
   - File name: `TipFly-iPad-4-History.png`

5. **Settings/Profile Screen**
   - Shows user profile and settings
   - File name: `TipFly-iPad-5-Settings.png`

### How to Take Screenshots:

**Method 1: Keyboard Shortcut**
```bash
Cmd + S
```
Screenshots save to Desktop automatically.

**Method 2: Menu**
- File → New Screen Shot
- Or: File → Save Screen

### Screenshot Requirements:

- ✅ Device: iPad Pro 12.9-inch (6th generation)
- ✅ Orientation: Portrait
- ✅ Resolution: 2048 x 2732 pixels (automatic from simulator)
- ✅ No device frame - just the app content
- ✅ Clean UI - no keyboard, no popups

## Verify Screenshot Dimensions

After taking screenshots, verify they're the correct size:

```bash
# On Mac terminal
cd ~/Desktop
file *.png | grep "2048 x 2732"
```

Should show: `PNG image data, 2048 x 2732, 8-bit/color RGBA`

## Send Screenshots

Send all 5 PNG files via:
- Email
- Slack
- Dropbox/Google Drive link
- Or upload directly to App Store Connect

## Need Test Data?

If the app is empty, you can:

1. **Create an account** - Use any email (doesn't need verification for simulator)
2. **Add sample tips** - Go to Add Tip screen and enter some tips
3. **Navigate screens** - Make sure each screen has content before taking screenshot

## Troubleshooting

**App won't load?**
```bash
# Clear cache and restart
npx expo start --clear
```

**Wrong device?**
- In Simulator: Hardware → Device → iPad Pro 12.9-inch (6th generation)

**Need to reset app data?**
- Device → Erase All Content and Settings

## What's Been Fixed

- ✅ Camera button bug fixed (was unresponsive on iPad)
- ✅ Build number incremented to 5
- ✅ expo-image-picker installed
- ✅ All code changes committed

## Questions?

Contact me and I can help troubleshoot!
