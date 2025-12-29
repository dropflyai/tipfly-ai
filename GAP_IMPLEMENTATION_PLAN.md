# TipFly AI - Gap Implementation Plan

## Executive Summary

Based on our comprehensive gap analysis comparing TipFly AI to top competitors (ServerLife 4.8★, Just The Tips 4.5★, TipSee 3.2★), this document outlines the implementation plan to close critical gaps before launch.

**Current State (Updated December 29, 2025):**
- ✅ Push Notifications: BUILT (notificationService.ts, notificationStore.ts, NotificationSettingsScreen.tsx)
- ✅ Referral Program: BUILT (referralStore.ts, referrals.ts, ReferralScreen.tsx, deepLinkHandler.ts)
- ✅ Offline Mode: BUILT (offlineStore.ts, syncService.ts, tipsOffline.ts, SyncStatusBadge.tsx, useNetworkStatus.ts)
- ✅ Analytics Integration: BUILT (analytics.ts, events.ts - ready for Mixpanel SDK)
- ✅ Gamification (Streaks/Badges): BUILT (gamificationStore.ts, gamification.ts, StreakDisplay.tsx, AchievementsScreen.tsx, BadgeCelebrationModal.tsx)
- ✅ Receipt Photo Capture: BUILT (receiptService.ts, ReceiptCapture.tsx)
- ✅ Weekly Email Summary: BUILT (send-weekly-summary Edge Function, weeklySummaryService.ts)

**ALL GAP FEATURES IMPLEMENTED!**

---

## Phase 1: Critical Pre-Launch (Week 1)

### 1.1 Referral Program ⏱️ 8-12 hours
**Priority:** 🔴 CRITICAL - Viral growth multiplier

**Database Schema:**
```sql
-- Add to Supabase
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'rewarded'
  reward_type TEXT, -- 'free_week', 'free_month', 'discount'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  rewarded_at TIMESTAMPTZ
);

-- Add referral tracking to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

-- Generate referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.referral_code := UPPER(SUBSTR(MD5(NEW.id::TEXT || NOW()::TEXT), 1, 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_referral_code
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();
```

**Files to Create:**
- [ ] `src/services/api/referrals.ts` - API functions
- [ ] `src/screens/referral/ReferralScreen.tsx` - Main referral screen
- [ ] `src/components/ReferralCard.tsx` - Dashboard card
- [ ] `src/store/referralStore.ts` - State management

**Features:**
- [ ] Generate unique referral code per user
- [ ] Share referral link via native share sheet
- [ ] Deep link handling: `tipflyai://referral/ABC123`
- [ ] Track referral status (pending → completed → rewarded)
- [ ] Reward tiers:
  - 1 referral = 1 week free premium
  - 3 referrals = 1 month free premium
  - 10 referrals = 6 months free premium
- [ ] Friend gets 7-day free trial + 20% off first month
- [ ] Dashboard showing referral stats

**Checklist:**
- [ ] Create database tables and triggers
- [ ] Create referralStore.ts
- [ ] Create referrals.ts API service
- [ ] Create ReferralScreen.tsx
- [ ] Add referral card to Dashboard
- [ ] Add "Invite Friends" to Settings
- [ ] Implement deep link handling in AppNavigator
- [ ] Create share functionality
- [ ] Test referral flow end-to-end

---

### 1.2 Offline Mode ⏱️ 10-12 hours
**Priority:** 🔴 CRITICAL - Competitors have it, restaurant wifi is bad

**Architecture:**
- Queue tip entries locally when offline
- Sync when connection restored
- Show sync status indicator

**Files to Create:**
- [ ] `src/services/offline/offlineQueue.ts` - Queue management
- [ ] `src/services/offline/syncService.ts` - Background sync
- [ ] `src/store/offlineStore.ts` - Offline state
- [ ] `src/hooks/useNetworkStatus.ts` - Network monitoring
- [ ] `src/components/SyncStatusBadge.tsx` - UI indicator

**Implementation:**
```typescript
// offlineStore.ts structure
interface OfflineState {
  pendingTips: PendingTip[];
  pendingEdits: PendingEdit[];
  pendingDeletes: string[];
  lastSyncAt: Date | null;
  isSyncing: boolean;
  syncError: string | null;
}
```

**Checklist:**
- [ ] Create offlineStore with AsyncStorage persistence
- [ ] Create offlineQueue service
- [ ] Modify tips.ts to queue entries when offline
- [ ] Create syncService for background sync
- [ ] Add useNetworkStatus hook using NetInfo
- [ ] Create SyncStatusBadge component
- [ ] Add sync indicator to Dashboard header
- [ ] Test offline → online sync flow
- [ ] Handle sync conflicts (server wins)

---

### 1.3 Analytics Integration ⏱️ 4-6 hours
**Priority:** 🟡 HIGH - Can't improve what you can't measure

**Recommended:** Mixpanel (generous free tier) or Amplitude

**Files to Create:**
- [ ] `src/services/analytics/analytics.ts` - Analytics wrapper
- [ ] `src/services/analytics/events.ts` - Event definitions

**Events to Track:**
```typescript
// Core Events
'app_opened'
'user_signed_up' { method: 'email' | 'google' | 'apple' }
'user_logged_in'
'onboarding_completed'

// Tip Events
'tip_added' { amount, shift_type, is_offline }
'tip_edited'
'tip_deleted'

// Engagement Events
'feature_used' { feature: string }
'premium_feature_blocked' { feature: string }
'upgrade_screen_viewed'
'subscription_started' { plan: 'monthly' | 'annual' }
'subscription_cancelled'

// Referral Events
'referral_link_shared'
'referral_code_entered'
'referral_completed'

// Retention Events
'streak_achieved' { days: number }
'goal_created'
'goal_completed'
```

**Checklist:**
- [ ] Sign up for Mixpanel/Amplitude
- [ ] Install SDK: `npm install mixpanel-react-native`
- [ ] Create analytics.ts wrapper
- [ ] Define all events in events.ts
- [ ] Add tracking to key screens
- [ ] Add user properties (job_type, subscription_tier)
- [ ] Test event tracking
- [ ] Set up basic funnels in dashboard

---

## Phase 2: High Priority (Week 2)

### 2.1 Gamification - Streaks & Badges ⏱️ 6-8 hours
**Priority:** 🟡 HIGH - Drives daily engagement

**Database Schema:**
```sql
-- User streaks table
CREATE TABLE user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_logged_date DATE,
  streak_started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User badges table
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);
```

**Badge Definitions:**
```typescript
const BADGES = {
  // Milestone Badges
  FIRST_TIP: { id: 'first_tip', name: 'First Steps', icon: '🎯', desc: 'Logged your first tip' },
  TEN_TIPS: { id: 'ten_tips', name: 'Getting Started', icon: '📝', desc: 'Logged 10 tips' },
  HUNDRED_TIPS: { id: 'hundred_tips', name: 'Pro Logger', icon: '📊', desc: 'Logged 100 tips' },

  // Streak Badges
  STREAK_7: { id: 'streak_7', name: 'On Fire', icon: '🔥', desc: '7-day logging streak' },
  STREAK_30: { id: 'streak_30', name: 'Unstoppable', icon: '⚡', desc: '30-day logging streak' },
  STREAK_100: { id: 'streak_100', name: 'Legend', icon: '🏆', desc: '100-day logging streak' },

  // Earnings Badges
  FIRST_500: { id: 'first_500', name: 'Money Maker', icon: '💰', desc: 'Earned $500 in a week' },
  FIRST_1000: { id: 'first_1000', name: 'Big Earner', icon: '💵', desc: 'Earned $1,000 in a week' },

  // Goal Badges
  GOAL_CRUSHER: { id: 'goal_crusher', name: 'Goal Crusher', icon: '🎯', desc: 'Hit your first goal' },

  // Tax Badges
  TAX_READY: { id: 'tax_ready', name: 'Tax Pro', icon: '📋', desc: 'Tracked all quarterly taxes' },
};
```

**Files to Create:**
- [ ] `src/services/api/streaks.ts` - Streak API
- [ ] `src/services/api/badges.ts` - Badge API
- [ ] `src/store/gamificationStore.ts` - State
- [ ] `src/components/StreakDisplay.tsx` - Streak counter UI
- [ ] `src/components/BadgeGrid.tsx` - Badge display
- [ ] `src/screens/profile/AchievementsScreen.tsx` - Full achievements view

**Checklist:**
- [ ] Create database tables
- [ ] Create streak tracking logic (update on tip add)
- [ ] Create badge checking logic
- [ ] Create StreakDisplay component (🔥 15)
- [ ] Add streak to Dashboard header
- [ ] Create AchievementsScreen
- [ ] Add achievements to Settings menu
- [ ] Show badge unlock celebrations
- [ ] Test streak break scenarios

---

### 2.2 Receipt Photo Capture ⏱️ 6-8 hours
**Priority:** 🟡 HIGH - ServerLife has it

**Note:** Camera permissions already configured in app.json

**Database Schema:**
```sql
-- Add receipt storage
ALTER TABLE tip_entries ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE tip_entries ADD COLUMN IF NOT EXISTS receipt_uploaded_at TIMESTAMPTZ;

-- Create storage bucket in Supabase
-- Go to Storage → Create bucket "receipts" (private)
```

**Files to Create:**
- [ ] `src/services/receipt/receiptService.ts` - Upload/download
- [ ] `src/components/ReceiptCapture.tsx` - Camera capture
- [ ] `src/components/ReceiptPreview.tsx` - Image preview

**Implementation:**
```typescript
// Basic flow (no OCR yet)
1. User taps "Add Receipt" on AddTipScreen
2. Open camera or photo picker
3. Upload to Supabase Storage
4. Save URL with tip entry
5. Display thumbnail in tip history
```

**Checklist:**
- [ ] Configure Supabase Storage bucket
- [ ] Create receiptService.ts (upload, delete, getUrl)
- [ ] Create ReceiptCapture component
- [ ] Add "Add Receipt" button to AddTipScreen
- [ ] Show receipt thumbnail on tip entry cards
- [ ] Add receipt viewer modal
- [ ] Test photo capture flow
- [ ] Test storage limits (compress images)

---

### 2.3 Weekly Email Summary ⏱️ 4-6 hours
**Priority:** 🟡 HIGH - Re-engagement mechanism

**Implementation:** Supabase Edge Function + Resend

**Files to Create:**
- [ ] `supabase/functions/weekly-summary/index.ts` - Edge function
- [ ] Email template (HTML)

**Email Template:**
```
Subject: You made $[AMOUNT] this week! 🎉

Hey [NAME],

Here's your week in review:

💰 This Week: $420 (+12% vs last week)
⭐ Best Day: Saturday ($95)
📊 Avg Hourly: $16.80/hr
🎯 Monthly Progress: $1,850 / $2,000 (92%)
🔥 Streak: 15 days!

💡 Pro Tip: You earn 23% more on dinner shifts

📅 Tax Reminder: Set aside $64 from this week

[View Full Report] [Upgrade to Premium]

Keep crushing it!
- The TipFly AI Team
```

**Checklist:**
- [ ] Sign up for Resend (free tier: 3K/month)
- [ ] Create edge function
- [ ] Create email template
- [ ] Add email preference to notification settings
- [ ] Set up cron job (every Monday 9 AM)
- [ ] Test email delivery
- [ ] Add unsubscribe link

---

## Phase 3: Nice-to-Have (Week 3+)

### 3.1 Comparison Analytics (Premium) ⏱️ 4-6 hours
- [ ] Calculate city/job averages from user data
- [ ] Show "You vs Average" comparison
- [ ] Add to Stats screen (premium only)

### 3.2 Shift Scheduler Integration ⏱️ 8-12 hours
- [ ] Research 7shifts API
- [ ] Create integration settings
- [ ] Auto-import scheduled shifts

### 3.3 Cash Flow Forecasting (Premium) ⏱️ 6-8 hours
- [ ] AI prediction based on historical data
- [ ] "Predicted earnings next week/month"
- [ ] Add to Dashboard

### 3.4 Income Verification Export ⏱️ 4-6 hours
- [ ] Generate professional PDF report
- [ ] Include monthly/annual summaries
- [ ] Add verification badge/watermark

---

## Implementation Priority Order

### Week 1 (Critical - Do First)
| # | Task | Est. Hours | Owner |
|---|------|------------|-------|
| 1 | Referral Program | 10 hrs | - |
| 2 | Offline Mode | 12 hrs | - |
| 3 | Analytics Integration | 5 hrs | - |

### Week 2 (High Priority)
| # | Task | Est. Hours | Owner |
|---|------|------------|-------|
| 4 | Gamification (Streaks/Badges) | 8 hrs | - |
| 5 | Receipt Photo Capture | 6 hrs | - |
| 6 | Weekly Email Summary | 5 hrs | - |

### Week 3+ (Nice-to-Have)
| # | Task | Est. Hours | Owner |
|---|------|------------|-------|
| 7 | Comparison Analytics | 5 hrs | - |
| 8 | Cash Flow Forecasting | 6 hrs | - |
| 9 | Income Verification | 4 hrs | - |

---

## Already Complete (No Work Needed)

✅ **Push Notifications** - Full implementation exists:
- `src/services/notifications/notificationService.ts`
- `src/store/notificationStore.ts`
- `src/screens/settings/NotificationSettingsScreen.tsx`
- `src/types/notifications.ts`
- Weekly summary, streak reminders, tax reminders, goal notifications

✅ **Voice Input** - expo-speech-recognition configured

✅ **Camera Permissions** - Already in app.json

✅ **Haptic Feedback** - expo-haptics implemented

✅ **RevenueCat** - react-native-purchases installed

---

## Testing Checklist

### Before Launch
- [ ] Test referral flow (share → sign up → reward)
- [ ] Test offline mode (airplane mode → add tip → go online → sync)
- [ ] Verify analytics events firing
- [ ] Test push notifications on physical device
- [ ] Test streak tracking across days
- [ ] Test receipt upload/view
- [ ] Test weekly email (manual trigger)

### Devices to Test
- [ ] iPhone 15 (iOS 18)
- [ ] iPhone SE (small screen)
- [ ] iPad (tablet layout)
- [ ] Pixel 7 (Android 14)
- [ ] Samsung Galaxy (Android 13)

---

## Success Metrics

### Launch Week Targets
| Metric | Target | How to Measure |
|--------|--------|----------------|
| Downloads | 1,000 | App Store Connect |
| D1 Retention | 40% | Analytics |
| Referral Share Rate | 20% | referral_link_shared events |
| Tip Logged | 70% of users | tip_added events |

### Month 1 Targets
| Metric | Target | How to Measure |
|--------|--------|----------------|
| MAU | 5,000 | Analytics |
| D7 Retention | 25% | Analytics |
| Premium Conversion | 10% | RevenueCat |
| Avg Tips/User | 15 | Database query |

---

## Dependencies to Install

```bash
# Analytics
npm install mixpanel-react-native

# Network status for offline mode
npm install @react-native-community/netinfo

# Deep linking for referrals
npx expo install expo-linking

# Image compression for receipts
npm install react-native-image-resizer
```

---

## Quick Start Commands

```bash
# Start development
cd /Users/dropfly/Projects/tipfly-ai
npx expo start

# Run on iOS Simulator
npx expo start --ios

# Run on Android Emulator
npx expo start --android

# Build for testing
eas build --profile preview --platform ios

# Deploy Supabase functions
supabase functions deploy weekly-summary
```

---

## Notes

1. **Notifications are DONE** - Don't rebuild, just verify they work on physical devices
2. **Start with referrals** - Biggest growth lever
3. **Offline mode is critical** - Restaurant staff have bad wifi
4. **Analytics first** - Need data before optimizing
5. **Ship gamification early** - Drives daily engagement

---

*Last Updated: December 29, 2025*
*Generated from competitive analysis of ServerLife, TipSee, Just The Tips*
