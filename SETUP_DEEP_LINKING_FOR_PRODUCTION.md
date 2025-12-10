# Deep Linking Setup for Production

## Current Status: ❌ NOT CONFIGURED

Deep linking is **NOT** set up yet. When users click the verification link in their email, the success page will show but won't automatically open the app.

## What Works Now:
- ✅ Email verification sends successfully
- ✅ Success page displays beautifully
- ✅ Store download buttons show as fallback
- ❌ Deep link (`tipgenius://verify-success`) won't open the app

## To Enable Deep Linking:

### 1. Update app.json

Add the following changes to `app.json`:

```json
{
  "expo": {
    "scheme": "tipgenius",   // ADD THIS LINE after "userInterfaceStyle"

    "android": {
      // ... existing android config ...
      "intentFilters": [       // ADD THIS ENTIRE BLOCK
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "tipgenius",
              "host": "verify-success"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### 2. Create Deep Link Handler

Create file: `src/hooks/useDeepLinking.ts`

```typescript
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';

export function useDeepLinking() {
  useEffect(() => {
    // Handle initial URL (app opened from deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Handle URLs when app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);
}

function handleDeepLink(url: string) {
  console.log('[DeepLink] Received URL:', url);

  const { hostname, path, queryParams } = Linking.parse(url);

  if (hostname === 'verify-success' || path === 'verify-success') {
    Alert.alert(
      '✅ Email Verified!',
      'Your email has been successfully verified. You now have access to all premium features including tax exports, advanced analytics, and team pooling.',
      [{ text: 'Great!', style: 'default' }]
    );
  }
}
```

### 3. Add Hook to App.tsx

Update `App.tsx`:

```typescript
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import AppNavigator from './src/navigation/AppNavigator';
import { useSubscriptionStore } from './src/store/subscriptionStore';
import { useDeepLinking } from './src/hooks/useDeepLinking';  // ADD THIS

SplashScreen.preventAutoHideAsync();

export default function App() {
  const initializeSubscriptions = useSubscriptionStore((state) => state.initialize);

  useDeepLinking();  // ADD THIS LINE

  useEffect(() => {
    initializeSubscriptions().catch((error) => {
      console.warn('[App] RevenueCat initialization failed:', error);
    });

    const timer = setTimeout(async () => {
      await SplashScreen.hideAsync();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
```

## Installation & Testing

### Step 1: Install Required Package

```bash
cd /c/Users/escot/tip-genius-app
npx expo install expo-linking
```

### Step 2: Apply the Changes Above

1. Update `app.json` with the scheme and intentFilters
2. Create `src/hooks/useDeepLinking.ts`
3. Update `App.tsx` to use the hook

### Step 3: Rebuild the App

**IMPORTANT:** You must rebuild the app for deep linking to work. Deep linking config requires a native rebuild.

```bash
# For Android
eas build --platform android --profile production

# For iOS
eas build --platform ios --profile production
```

Or for development builds:
```bash
npx expo prebuild
npx expo run:android
# or
npx expo run:ios
```

### Step 4: Test Deep Linking

#### Test in Development:

```bash
# Android
adb shell am start -W -a android.intent.action.VIEW -d "tipgenius://verify-success"

# iOS (in simulator)
xcrun simctl openurl booted "tipgenius://verify-success"
```

#### Test Complete Flow:

1. Send verification email from Supabase Dashboard
2. Open email on your phone
3. Click "Verify Email Address" button
4. Success page should show
5. App should automatically open (if installed)
6. Alert should show "Email Verified!"

## Why Rebuild is Required

Deep linking configuration requires changes to:
- **Android**: `AndroidManifest.xml` (intent filters)
- **iOS**: `Info.plist` (URL schemes)

These are native files that only get updated during a build, not during development reload.

## Production Checklist

Before going to production with deep linking:

- [ ] Update `app.json` with scheme and intentFilters
- [ ] Create `src/hooks/useDeepLinking.ts`
- [ ] Update `App.tsx` to use the hook
- [ ] Install `expo-linking` package
- [ ] Rebuild the app (both iOS and Android)
- [ ] Test deep link manually
- [ ] Test complete email verification flow
- [ ] Verify fallback to store buttons works if app not installed

## Current Workaround (No Rebuild Required)

**If you don't want to rebuild yet:**

The success page already has a great fallback:
- Shows "Couldn't open the app?" after 2 seconds
- Displays App Store and Google Play download buttons
- Users can manually reopen the app
- Email is still verified successfully

This works perfectly fine for production! Deep linking is nice-to-have, not required.

## Recommendation

**Option 1: Skip Deep Linking for Now**
- Email verification works perfectly without it
- Success page has good UX with store buttons
- Add deep linking in next app update

**Option 2: Add Deep Linking Now**
- Better UX (automatic app open)
- Requires rebuilding both iOS and Android
- Takes ~15-20 minutes to set up
- Worth it if pushing new builds anyway

## Summary

Deep linking is **NOT required** for email verification to work. The current implementation:
- ✅ Emails send successfully via Resend
- ✅ Users can verify their email
- ✅ Success page looks professional
- ✅ Fallback to store buttons works great
- ❌ App won't auto-open (user must manually reopen)

Choose based on your current development timeline!
