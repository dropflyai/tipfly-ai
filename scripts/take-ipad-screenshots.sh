#!/bin/bash

# TipFly iPad Screenshot Automation Script
# Run this on a Mac with Xcode installed
# Usage: ./take-ipad-screenshots.sh

set -e

# Configuration
SCREENSHOT_DIR="$HOME/Desktop/TipFly-iPad-Screenshots"
SIMULATOR_NAME="iPad Pro (12.9-inch) (6th generation)"
BUNDLE_ID="com.tipflyai.app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   TipFly iPad Screenshot Generator    ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Create screenshot directory
mkdir -p "$SCREENSHOT_DIR"
echo -e "${GREEN}✓ Screenshot directory created: $SCREENSHOT_DIR${NC}"

# Function to take a screenshot
take_screenshot() {
    local name=$1
    local filename="${SCREENSHOT_DIR}/${name}.png"
    xcrun simctl io booted screenshot "$filename"
    echo -e "${GREEN}✓ Saved: ${name}.png${NC}"
}

# Function to wait for user
wait_for_input() {
    local message=$1
    echo ""
    echo -e "${YELLOW}► $message${NC}"
    echo -e "${YELLOW}  Press ENTER when ready...${NC}"
    read -r
}

# Check if Xcode is installed
if ! command -v xcrun &> /dev/null; then
    echo -e "${RED}✗ Error: Xcode command line tools not found${NC}"
    echo "  Please install Xcode from the App Store"
    exit 1
fi

echo -e "${GREEN}✓ Xcode found${NC}"

# List available iPad simulators
echo ""
echo -e "${BLUE}Available iPad Simulators:${NC}"
xcrun simctl list devices available | grep -i "ipad" | head -10

# Try to find the iPad Pro 12.9" simulator
DEVICE_ID=$(xcrun simctl list devices available | grep "$SIMULATOR_NAME" | head -1 | grep -oE '[A-F0-9-]{36}')

if [ -z "$DEVICE_ID" ]; then
    echo ""
    echo -e "${YELLOW}Could not find '$SIMULATOR_NAME'${NC}"
    echo "Available iPad devices:"
    xcrun simctl list devices available | grep -i "ipad"
    echo ""
    echo -e "${YELLOW}Enter the name of an iPad simulator to use:${NC}"
    read -r SIMULATOR_NAME
    DEVICE_ID=$(xcrun simctl list devices available | grep "$SIMULATOR_NAME" | head -1 | grep -oE '[A-F0-9-]{36}')

    if [ -z "$DEVICE_ID" ]; then
        echo -e "${RED}✗ Could not find simulator: $SIMULATOR_NAME${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}✓ Using simulator: $SIMULATOR_NAME${NC}"
echo -e "${GREEN}  Device ID: $DEVICE_ID${NC}"

# Boot the simulator
echo ""
echo -e "${BLUE}Booting iPad simulator...${NC}"
xcrun simctl boot "$DEVICE_ID" 2>/dev/null || true

# Open Simulator app
open -a Simulator

# Wait for simulator to boot
echo "Waiting for simulator to boot..."
sleep 5

# Check if simulator is booted
xcrun simctl bootstatus "$DEVICE_ID" -b

echo -e "${GREEN}✓ Simulator is ready${NC}"

# Instructions
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   SCREENSHOT INSTRUCTIONS             ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "The iPad simulator is now running."
echo ""
echo -e "${YELLOW}STEP 1: Start Expo${NC}"
echo "  In another terminal, run: npx expo start"
echo "  Then press 'i' to open in iOS Simulator"
echo ""
echo -e "${YELLOW}STEP 2: Navigate & Screenshot${NC}"
echo "  This script will guide you through each screen."
echo ""

wait_for_input "Make sure the app is running in the iPad simulator"

# Take screenshots for each screen
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   TAKING SCREENSHOTS                  ${NC}"
echo -e "${BLUE}========================================${NC}"

# Screenshot 1: Landing/Welcome Screen
wait_for_input "Navigate to the LANDING SCREEN (first screen users see)"
take_screenshot "01-landing-screen"

# Screenshot 2: Home Dashboard
wait_for_input "Log in and navigate to the HOME DASHBOARD"
take_screenshot "02-home-dashboard"

# Screenshot 3: Add Tip Screen
wait_for_input "Open the ADD TIP screen (tap the + button)"
take_screenshot "03-add-tip"

# Screenshot 4: Stats Screen
wait_for_input "Navigate to the STATS tab"
take_screenshot "04-stats"

# Screenshot 5: Teams Screen
wait_for_input "Navigate to the TEAMS tab"
take_screenshot "05-teams"

# Screenshot 6: Settings Screen
wait_for_input "Navigate to the SETTINGS tab"
take_screenshot "06-settings"

# Optional additional screenshots
echo ""
echo -e "${YELLOW}Would you like to take additional screenshots? (y/n)${NC}"
read -r ADDITIONAL

if [ "$ADDITIONAL" = "y" ] || [ "$ADDITIONAL" = "Y" ]; then
    # Screenshot 7: Tip History
    wait_for_input "Navigate to TIP HISTORY"
    take_screenshot "07-tip-history"

    # Screenshot 8: Goals
    wait_for_input "Navigate to GOALS screen"
    take_screenshot "08-goals"

    # Screenshot 9: Premium/Upgrade
    wait_for_input "Navigate to UPGRADE/PREMIUM screen"
    take_screenshot "09-premium"
fi

# Done!
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   SCREENSHOTS COMPLETE!               ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}Screenshots saved to:${NC}"
echo -e "${BLUE}$SCREENSHOT_DIR${NC}"
echo ""
echo "Files created:"
ls -la "$SCREENSHOT_DIR"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the screenshots in: $SCREENSHOT_DIR"
echo "2. Upload to App Store Connect"
echo ""
echo -e "${GREEN}Required size for iPad Pro 12.9\": 2048 x 2732 pixels${NC}"
echo ""

# Open the screenshot folder
open "$SCREENSHOT_DIR"
