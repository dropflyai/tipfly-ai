# Fix Email Verification 401 Error & Scrolling Issues

## Issue 1: 401 Error on Email Verification

### Problem
Clicking "Verify Email Address" in the email shows "401 missing authorization header"

### Root Cause
The Supabase Auth redirect URL configuration is pointing to the Edge Function, but Supabase's built-in verification flow doesn't work that way. We need to use Supabase's default email confirmation flow.

### Solution: Use Supabase's Built-in Email Confirmation

**Step 1: Update Supabase Email Templates**

1. Go to Supabase Dashboard → Authentication → Email Templates
2. Select "Confirm signup" template
3. Update the template to use your branding but keep Supabase's `{{ .ConfirmationURL }}` variable
4. Supabase will handle the verification automatically

**Step 2: Simplify the Flow (Remove Custom Edge Function for Verification)**

The issue is we're trying to customize too much. Supabase's built-in email confirmation works perfectly. Here's the simpler approach:

### Option A: Use Supabase's Default Email (Simplest)

Just use Supabase's built-in email confirmation:
1. Dashboard → Authentication → Email Templates
2. Customize the "Confirm signup" template
3. It will use `{{ .ConfirmationURL }}` which works automatically
4. Remove the custom Edge Function approach

### Option B: Keep Custom Emails but Fix the Link

If you want to keep the beautiful Resend emails, we need to fix the verification link:

**Update `send-verification-email/index.ts`:**

Change line 43-46 from:
```typescript
const { data: otpData, error: otpError } = await supabaseClient.auth.admin.generateLink({
  type: 'magiclink',
  email: email,
});
```

To:
```typescript
const { data: otpData, error: otpError } = await supabaseClient.auth.admin.generateLink({
  type: 'signup',
  email: email,
  options: {
    redirectTo: 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/verify-success'
  }
});
```

### Recommended: Test with Supabase Default First

For now, let's use Supabase's built-in email to verify it works, then we can customize later.

**In Supabase Dashboard:**
1. Go to Authentication → Email Templates
2. Click "Confirm signup"
3. Make sure it's enabled
4. The default template will work

**Then test:**
1. Sign up a new user
2. Check email
3. Click the verification link
4. Should work without 401 error

---

## Issue 2: Home & Profile Tabs - Scrolling to See All Content

### Problem
Content at the bottom of Home and Profile tabs is cut off by the tab bar and can't be seen when scrolling.

### Solution: Add Proper Content Padding

We need to add bottom padding to ScrollView content so it can scroll past the tab bar.

### Fix for DashboardScreen (Home Tab)

**File:** `src/screens/main/DashboardScreen.tsx`

**Find the scrollContent style (around line 382):**
```typescript
scrollContent: {
  padding: 16,
  gap: 16,
},
```

**Change to:**
```typescript
scrollContent: {
  padding: 16,
  paddingBottom: 120, // Add space for tab bar + FAB
  gap: 16,
},
```

### Fix for SettingsScreen (Profile Tab)

**File:** `src/screens/main/SettingsScreen.tsx`

**Find the scrollContent or container style, add:**
```typescript
scrollContent: {
  padding: 16,
  paddingBottom: 120, // Add space for tab bar
},
```

Or if using a different structure, wrap the ScrollView content with proper padding.

### Fix for StatsScreen (Analytics Tab)

**File:** `src/screens/main/StatsScreen.tsx`

**Find scrollContent style, update:**
```typescript
scrollContent: {
  padding: 16,
  paddingBottom: 120,
  gap: 16,
},
```

### Fix for TeamsScreen

**File:** `src/screens/teams/TeamsScreen.tsx`

Same approach - add `paddingBottom: 120` to contentContainerStyle or scrollContent.

### Quick Fix Script

```javascript
// Run this in Node to apply padding fixes
const fs = require('fs');

const files = {
  'src/screens/main/DashboardScreen.tsx': /scrollContent: \{([^}]+)\}/,
  'src/screens/main/SettingsScreen.tsx': /scrollContent: \{([^}]+)\}/,
  'src/screens/main/StatsScreen.tsx': /scrollContent: \{([^}]+)\}/,
  'src/screens/teams/TeamsScreen.tsx': /scrollContent: \{([^}]+)\}/,
};

Object.entries(files).forEach(([file, pattern]) => {
  let content = fs.readFileSync(file, 'utf8');

  // Add paddingBottom if not present
  content = content.replace(pattern, (match) => {
    if (match.includes('paddingBottom')) {
      // Already has paddingBottom, update it
      return match.replace(/paddingBottom:\s*\d+/, 'paddingBottom: 120');
    } else {
      // Add paddingBottom
      return match.replace(/scrollContent: \{/, 'scrollContent: {\n    paddingBottom: 120,');
    }
  });

  fs.writeFileSync(file, content);
  console.log(`Fixed: ${file}`);
});
```

### Manual Approach (If Script Doesn't Work)

For each screen file, find the `ScrollView` component and add to its `contentContainerStyle`:

```typescript
<ScrollView
  style={styles.scrollView}
  contentContainerStyle={[
    styles.scrollContent,
    { paddingBottom: 120 } // Add this
  ]}
  refreshControl={...}
>
```

Or update the stylesheet:

```typescript
const styles = StyleSheet.create({
  // ... other styles
  scrollContent: {
    padding: 16,
    paddingBottom: 120, // ADD THIS LINE
    gap: 16,
  },
});
```

### Testing Checklist

After applying fixes:
- [ ] Open Home tab
- [ ] Scroll all the way to bottom
- [ ] Can see "Upgrade to Premium" button completely (if not premium)
- [ ] No content hidden behind tab bar
- [ ] Open Profile tab
- [ ] Scroll to bottom
- [ ] Can see all settings options
- [ ] No content cut off
- [ ] Test on both iOS and Android (different tab bar heights)

### Why 120px?

- Tab bar height: 70px
- Extra buffer: 20px
- FAB button space: 30px
- **Total: 120px** ensures comfortable scrolling

### Alternative: Dynamic Padding

For a more robust solution, calculate padding dynamically:

```typescript
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function MyScreen() {
  const insets = useSafeAreaInsets();
  const bottomPadding = 70 + insets.bottom + 50; // tab bar + safe area + buffer

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: bottomPadding }}
    >
      {/* content */}
    </ScrollView>
  );
}
```

This accounts for different device safe areas automatically.

---

## Summary

**Email Verification 401:**
- Issue: Custom redirect URL not configured correctly
- Quick Fix: Use Supabase's default email templates
- Advanced Fix: Configure redirectTo option in generateLink

**Scrolling Issues:**
- Issue: Content hidden behind tab bar
- Fix: Add `paddingBottom: 120` to all ScrollView contentContainerStyle
- Affects: Home, Profile, Analytics, Teams tabs

**Priority:**
1. Fix scrolling first (easier, immediate visual improvement)
2. Test email verification with default Supabase emails
3. Customize email branding later once flow works

