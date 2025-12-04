# iPad Screenshots for App Store

## Quick Start (for Mac)

### Option 1: Use the Automated Script

1. Open Terminal on your Mac
2. Navigate to the project folder:
   ```bash
   cd path/to/tip-genius-app
   ```
3. Make the script executable and run it:
   ```bash
   chmod +x scripts/take-ipad-screenshots.sh
   ./scripts/take-ipad-screenshots.sh
   ```
4. Follow the on-screen prompts

---

### Option 2: Manual Steps

#### Step 1: Open iPad Simulator
```bash
open -a Simulator
```

Then in Simulator menu: **File** → **Open Simulator** → **iPad Pro (12.9-inch) (6th generation)**

#### Step 2: Start the App
In another terminal:
```bash
cd path/to/tip-genius-app
npx expo start
```
Press `i` to open in iOS Simulator

#### Step 3: Take Screenshots
For each screen, use keyboard shortcut: **Cmd + S**

Screenshots will save to your Desktop.

---

## Required Screenshots

Take screenshots of these screens (in order of importance):

| # | Screen | Description |
|---|--------|-------------|
| 1 | Home Dashboard | Main screen showing today's tips and stats |
| 2 | Add Tip | The tip entry form |
| 3 | Stats | Charts and analytics |
| 4 | Teams | Team management screen |
| 5 | Landing | Welcome/login screen |
| 6 | Settings | App settings |

---

## App Store Requirements

### iPad Pro 12.9" Screenshots
- **Resolution**: 2048 x 2732 pixels
- **Format**: PNG or JPEG
- **Quantity**: 1-10 screenshots

The simulator automatically generates the correct resolution.

---

## Troubleshooting

### "No iPad simulators available"
Make sure Xcode is installed:
```bash
xcode-select --install
```

### "App won't load in simulator"
1. Make sure Expo is running (`npx expo start`)
2. Press `i` to open in iOS
3. If the wrong simulator opens, close it and manually open iPad simulator first

### Screenshots are wrong size
Make sure you're using **iPad Pro (12.9-inch)** - this is the required size for App Store.

---

## After Taking Screenshots

1. Find screenshots on Desktop or in `~/Desktop/TipFly-iPad-Screenshots/`
2. Go to [App Store Connect](https://appstoreconnect.apple.com)
3. Navigate to your app → App Information → Screenshots
4. Upload under "iPad Pro (6th Gen) 12.9" Display"
