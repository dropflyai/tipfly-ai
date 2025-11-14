# TipFly AI - Quick Start Guide

## 🚀 Get Running in 10 Minutes

### Step 1: Set Up Supabase (5 minutes)

1. **Go to [supabase.com](https://supabase.com)**
   - Sign up or log in
   - Click "New Project"

2. **Create Project:**
   - Name: `TipFly AI`
   - Database Password: (save this!)
   - Region: Closest to you
   - Click "Create"
   - ⏰ Wait 2-3 minutes for project to spin up

3. **Get Your Credentials:**
   - Go to Settings → API
   - Copy:
     - **Project URL** (looks like: `https://xxx.supabase.co`)
     - **anon/public key** (starts with `eyJ...`)

4. **Run Database Migrations:**
   - Go to SQL Editor
   - Copy entire SQL from `SUPABASE_SETUP.md`
   - Paste and click "Run"
   - Should see "Success" messages

### Step 2: Configure App (2 minutes)

1. **Create `.env` file:**
```bash
cd tipflyai-app
```

Create a `.env` file with:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ_your_key_here
```

2. **Update App.tsx:**

Replace contents with:
```typescript
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
```

### Step 3: Run the App (3 minutes)

1. **Start development server:**
```bash
npm run start
```

2. **Choose platform:**
   - Press `w` for web (fastest for testing)
   - Press `a` for Android emulator
   - Press `i` for iOS simulator (Mac only)
   - Or scan QR code with Expo Go app

3. **Test the flow:**
   - See Welcome screen ✅
   - Click "Get Started Free"
   - Select job type
   - Complete quick setup
   - Sign up with email/password
   - Should redirect to Dashboard!

---

## 🎯 What You'll See

### 1. Welcome Screen
Beautiful hero section with:
- "Track Your Tips, Master Your Money"
- Feature list
- "Get Started Free" button

### 2. Job Selection
Grid of job types:
- 🍽️ Waiter/Server
- 🍸 Bartender
- ✂️ Hair Stylist
- 💅 Nail Tech
- 🚗 Rideshare Driver
- 📦 Delivery Driver

### 3. Quick Setup
Choose:
- Hours per shift (4-12)
- Shifts per week (1-7)

### 4. Signup
- Full name
- Email
- Password

### 5. Dashboard
Shows:
- Today's earnings (currently $0)
- This week summary
- This month summary
- Upgrade prompt (if free user)

---

## 🐛 Troubleshooting

### "Can't connect to Supabase"
- Check `.env` file has correct credentials
- Make sure keys start with `EXPO_PUBLIC_`
- Restart dev server (`r` in terminal)

### "Navigation not working"
- Make sure you updated `App.tsx`
- Check `SafeAreaProvider` is imported
- Restart dev server

### "White screen / blank app"
- Check terminal for error messages
- Try web first (`w`) for better debugging
- Check browser console for errors

### "Database errors"
- Make sure you ran ALL SQL migrations
- Check Supabase dashboard → Table Editor
- Should see: users, tip_entries, goals, deductions, insights_cache

---

## 🎨 Current Features Working

✅ **Complete:**
- Welcome screen
- Job selection
- Quick setup
- Login/Signup
- Dashboard with earnings cards
- Navigation (tabs)
- User authentication
- Supabase integration

🚧 **Placeholder (not functional yet):**
- Add Tip screen (shows placeholder)
- Stats screen (shows placeholder)
- Settings screen (shows placeholder)

---

## 📝 Next: Build Remaining Screens

### 1. Add Tip Screen
**What it needs:**
- Date picker (default: today)
- Hours worked input
- Tips earned input ($)
- Shift type dropdown (lunch/dinner/brunch)
- Notes field (optional)
- "Save" button → calls `createTipEntry()` API

### 2. Stats Screen
**What it needs:**
- Weekly bar chart (tips by day)
- Monthly line chart (tips by month)
- Shift performance breakdown
- Uses `getWeeklyTips()` and `getMonthlyTips()` APIs

### 3. Settings Screen
**What it needs:**
- User profile (edit name, email)
- Job type
- Subscription status
- "Upgrade to Premium" button
- "Sign Out" button → calls `signOut()` API

### 4. Upgrade Screen
**What it needs:**
- Feature comparison table
- Pricing cards ($4.99/mo vs $39.99/yr)
- "Start Free Trial" button
- (RevenueCat integration - later)

---

## 🛠️ Available APIs

All in `src/services/api/`:

### Authentication
```typescript
import { supabase } from './services/api/supabase';

// Sign up
await supabase.auth.signUp({ email, password });

// Sign in
await supabase.auth.signInWithPassword({ email, password });

// Sign out
await supabase.auth.signOut();
```

### Tips
```typescript
import {
  createTipEntry,
  getTipEntries,
  getTodaysTips,
  getWeeklyTips,
  getMonthlyTips,
  updateTipEntry,
  deleteTipEntry
} from './services/api/tips';

// Create tip
await createTipEntry({
  date: '2025-11-03',
  hours_worked: 6,
  tips_earned: 87.50,
  shift_type: 'dinner',
  notes: 'Busy Saturday night'
});

// Get tips
const tips = await getTodaysTips();
```

### Utilities
```typescript
import { formatCurrency, formatHourlyRate, formatHours } from './utils/formatting';
import { calculateHourlyRate, calculateTaxEstimate } from './utils/calculations';

formatCurrency(87.50); // "$87.50"
formatHourlyRate(15.50); // "$15.50/hr"
calculateTaxEstimate(1000); // 153 (15.3% tax)
```

---

## 📊 Test Data

### Create Test User
1. Sign up in app: `test@tipgenius.com` / `password123`
2. Or use Supabase dashboard → Authentication → Users → "Invite user"

### Add Sample Tips (SQL)
```sql
-- After signing up, get your user_id from Supabase Auth
INSERT INTO tip_entries (user_id, date, hours_worked, tips_earned, shift_type)
VALUES
  ('your-user-id', '2025-11-03', 6, 87.50, 'dinner'),
  ('your-user-id', '2025-11-02', 5, 65.00, 'lunch'),
  ('your-user-id', '2025-11-01', 7, 105.00, 'dinner');
```

Then refresh dashboard to see data!

---

## 🎯 Development Workflow

### 1. Make Changes
Edit files in `src/`

### 2. Hot Reload
App updates automatically (no restart needed)

### 3. Check Errors
- Terminal shows bundler errors
- Expo Go app shows runtime errors
- Supabase dashboard shows database errors

### 4. Test on Multiple Platforms
- Web is fastest for UI testing
- iOS/Android for mobile-specific features

---

## 📚 Resources

### Documentation
- [Expo Docs](https://docs.expo.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [React Navigation](https://reactnavigation.org/)

### Project Docs
- `README.md` - Project overview
- `SUPABASE_SETUP.md` - Full database setup
- `TIP_GENIUS_BUILD_SUMMARY.md` - What's built
- `PAIN_POINTS_AND_GTM_STRATEGY.md` - Market strategy
- `MISSING_FEATURES_TO_ADD.md` - Feature roadmap

### Get Help
- Check terminal for errors
- Check Supabase logs (Dashboard → Logs)
- Check browser console (if using web)

---

## ✅ Checklist

Before you start building:
- [ ] Supabase project created
- [ ] Database migrations run
- [ ] `.env` file configured
- [ ] `App.tsx` updated
- [ ] App runs successfully
- [ ] Can sign up / log in
- [ ] Dashboard shows (even with $0)

Ready to build:
- [ ] Read `MISSING_FEATURES_TO_ADD.md`
- [ ] Start with AddTipScreen
- [ ] Then StatsScreen
- [ ] Then SettingsScreen
- [ ] Then UpgradeScreen

---

## 🚀 You're Ready!

The foundation is complete. Now build the remaining screens and launch!

**Estimated time to MVP:** 1-2 weeks

**Good luck building TipFly AI!** 💰

---

**Questions?** Check the other documentation files or review the code in `src/`
