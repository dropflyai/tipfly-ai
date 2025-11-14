# App Store Submission Guide

## What We're Building

✅ **Android APK** - Currently building (5-15 minutes)
⏳ **iOS IPA** - Will build after Android completes

## After Builds Complete

### Android (Google Play Store)

1. **Download the APK** from the EAS build page
2. **Go to Google Play Console**: https://play.google.com/console
3. **Create a new app** (if not already created):
   - App name: TipFly AI
   - Default language: English (US)
   - App type: App
   - Free or paid: Free
4. **Set up your app**:
   - **Store listing**: Description, screenshots, icon
   - **Content rating**: Fill out questionnaire
   - **Target audience**: Set age groups
   - **Privacy policy**: Required for apps with user data
5. **Create a release**:
   - Go to Production → Create new release
   - Upload the APK
   - Release notes: "Initial release of TipFly AI - Track Your Tips, Master Your Money"
6. **Submit for review** (usually 2-7 days)

### iOS (Apple App Store)

1. **App Store Connect**: https://appstoreconnect.apple.com
2. **Create a new app**:
   - Platform: iOS
   - Name: TipFly AI
   - Primary language: English (US)
   - Bundle ID: com.tipflyai.app
   - SKU: tipflyai-001
3. **App Information**:
   - Category: Finance or Productivity
   - Content rights
4. **Pricing and Availability**: Free
5. **Prepare for Submission**:
   - Screenshots (required sizes)
   - App preview video (optional)
   - Description
   - Keywords
   - Support URL
   - Privacy policy URL
6. **Build**:
   - Upload the IPA using Transporter app or EAS Submit
7. **Submit for review** (usually 1-3 days)

## Required Assets

### App Store Screenshots
You'll need screenshots for:
- **iPhone 6.7"** (iPhone 14 Pro Max): 1290 x 2796 pixels
- **iPhone 5.5"** (iPhone 8 Plus): 1242 x 2208 pixels
- **iPad Pro 12.9"**: 2048 x 2732 pixels (if supporting iPad)

### Android Screenshots
- **Phone**: At least 2 screenshots, 1080 x 1920 pixels
- **Tablet**: Optional, 1920 x 1080 pixels

### App Icon
- Already have: `assets/icon.png` (1024 x 1024)

### Privacy Policy
You need a privacy policy URL. Options:
1. Create one using a generator: https://app-privacy-policy-generator.firebaseapp.com/
2. Host on your website
3. Use GitHub Pages

## What's Already Configured

✅ App icons and splash screens
✅ Bundle identifiers (iOS: com.tipflyai.app, Android: com.tipflyai.app)
✅ App name: TipFly AI
✅ Version: 1.0.0
✅ All permissions properly set
✅ Environment variables configured for production

## Next Steps After This Session

1. ✅ Download APK from EAS build link
2. ✅ Download IPA from EAS build link
3. Create Google Play Developer account ($25 one-time fee)
4. Create Apple Developer account ($99/year)
5. Create privacy policy
6. Take screenshots using your device or simulator
7. Write app description (see template below)
8. Submit to both stores!

## App Description Template

**Short Description (80 chars):**
"Track tips, manage earnings, and maximize your income as a service worker."

**Full Description:**

**Track Your Tips, Master Your Money**

TipFly AI is the ultimate tip tracking app designed specifically for service workers. Whether you're a server, bartender, delivery driver, or any tipped employee, TipFly AI helps you track, analyze, and maximize your earnings.

**Features:**
• 📊 Smart Analytics - See your earnings by day, week, month, and year
• 💰 Tip Tracking - Quickly log cash and credit card tips
• 🤖 AI-Powered Insights - Get personalized recommendations to boost earnings
• 📅 Shift Management - Track which shifts earn you the most
• 👥 Team Pools - Split tips fairly with clock-in integration
• 📱 Multiple Jobs - Manage tips across different workplaces
• 💡 Goals - Set and track earnings goals
• 📄 Reports - Export data for tax season
• 🔒 Secure - Your data is private and encrypted

**Perfect For:**
• Servers & Waitstaff
• Bartenders
• Delivery Drivers
• Hair Stylists & Barbers
• Ride-share Drivers
• Hotel Staff
• Any tipped employee!

**Premium Features:**
• Unlimited tip history
• Receipt scanning with OCR
• Advanced analytics
• Tax tracking
• Bill split calculator
• Priority support

Download TipFly AI today and take control of your earnings!

---

**Support:** support@tipflyai.com
**Privacy Policy:** [Your privacy policy URL]
**Terms of Service:** [Your terms URL]

## Build Status

Check build status at: https://expo.dev/accounts/dropfly/projects/tipflyai-app/builds

Current builds:
- Android: In progress...
- iOS: Pending...
