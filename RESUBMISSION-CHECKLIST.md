# TipFly AI - App Store Resubmission Checklist

## Status: Ready for Screenshots & Build

### ✅ Completed

1. **Camera Button Bug Fixed**
   - Added `onPress` handler to camera button in EditProfileScreen.tsx
   - Installed expo-image-picker@17.0.8
   - Implemented iOS ActionSheet + Android picker
   - Added proper permission requests
   - File: [src/screens/settings/EditProfileScreen.tsx:32-160](src/screens/settings/EditProfileScreen.tsx)

2. **Build Configuration Updated**
   - Build number incremented: 4 → 5
   - File: [app.json:17](app.json)

3. **Code Pushed to GitHub**
   - Repository: https://github.com/dropflyai/tipfly-ai
   - Branch: main
   - Latest commit: "Fix camera button bug and prepare for iPad screenshots"

4. **Business Model Answers Prepared**
   - All 5 questions answered
   - File: [APPLE_BUSINESS_MODEL_ANSWERS.md](APPLE_BUSINESS_MODEL_ANSWERS.md)

---

## 🔄 In Progress

### Partner Tasks (Mac Required)

**1. Pull Latest Code**
```bash
cd tip-genius-app
git pull origin main
npm install
```

**2. Take iPad Screenshots**
Follow instructions in: [README-FOR-SCREENSHOTS.md](README-FOR-SCREENSHOTS.md)

**Required Screenshots (5 total):**
- ✅ iPad Pro 12.9" (6th generation)
- ✅ Portrait orientation
- ✅ 2048 x 2732 pixels
- ✅ No device frame

**Screens to Capture:**
1. AI Prediction (Dashboard)
2. Analytics (Stats screen)
3. Goals (Premium feature)
4. Tip History
5. Settings/Profile

---

## ⏳ Pending

### Your Tasks (After Getting Screenshots)

**1. Upload iPad Screenshots to App Store Connect**
   - Go to: https://appstoreconnect.apple.com
   - Navigate to: Apps → TipFly AI → App Store → iPad Screenshots
   - Replace existing screenshots with new ones (5 files)
   - Must be 2048x2732 PNG files

**2. Answer Business Model Questions**
   - Go to: App Store Connect → Resolution Center
   - Find: Guideline 2.1 questions
   - Copy answers from: [APPLE_BUSINESS_MODEL_ANSWERS.md](APPLE_BUSINESS_MODEL_ANSWERS.md)
   - Submit responses

**3. Build and Submit New Version**
   ```bash
   # Login to EAS
   eas login

   # Build for iOS
   eas build --platform ios --profile production

   # Wait for build to complete (~15-20 minutes)

   # Submit to App Store
   eas submit --platform ios --latest
   ```

**4. Update Build in App Store Connect**
   - Go to: App Store Connect → TipFly AI
   - Select new Build 5
   - Save
   - Submit for Review

---

## 📋 Apple's 3 Rejection Issues

### Issue #1: iPad Screenshots ❌ → 🔄 In Progress
**Problem:** Screenshots show iPhone device frame
**Solution:** Partner taking proper iPad Pro 12.9" simulator screenshots
**Status:** Waiting for partner

### Issue #2: Business Model Questions ❌ → ✅ Ready
**Problem:** Need to answer 5 IAP questions
**Solution:** Answers prepared in APPLE_BUSINESS_MODEL_ANSWERS.md
**Status:** Ready to submit

### Issue #3: Camera Button Bug ✅ Fixed
**Problem:** Camera button unresponsive on iPad
**Solution:** Added onPress handler + image picker integration
**Status:** Fixed in Build 5

---

## 🚀 Final Steps Summary

1. **Partner:** Take 5 iPad screenshots → Send to you
2. **You:** Upload screenshots to App Store Connect
3. **You:** Answer business questions in Resolution Center
4. **You:** Run `eas build` → `eas submit`
5. **You:** Select Build 5 in App Store Connect
6. **You:** Submit for review

---

## 📁 Important Files

- **Camera Fix:** [src/screens/settings/EditProfileScreen.tsx](src/screens/settings/EditProfileScreen.tsx)
- **Build Config:** [app.json](app.json)
- **Business Answers:** [APPLE_BUSINESS_MODEL_ANSWERS.md](APPLE_BUSINESS_MODEL_ANSWERS.md)
- **Partner Guide:** [README-FOR-SCREENSHOTS.md](README-FOR-SCREENSHOTS.md)
- **This Checklist:** RESUBMISSION-CHECKLIST.md

---

## 🔗 Links

- **GitHub Repo:** https://github.com/dropflyai/tipfly-ai
- **App Store Connect:** https://appstoreconnect.apple.com
- **App ID:** 6755552157
- **Bundle ID:** com.tipflyai.app

---

**Last Updated:** 2025-01-29
**Current Build:** 5
**App Version:** 1.0.1
