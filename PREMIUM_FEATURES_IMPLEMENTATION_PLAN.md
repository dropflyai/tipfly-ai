# Premium Features Implementation Plan

## Current Status
- ✅ Fixed `isPremium()` to check `subscription_tier === 'premium'`
- ✅ Database has all necessary tables (users, tip_entries, goals, deductions)
- ✅ Upgrade screen lists all 8 premium features

## What Works Now
1. **Unlimited History** - Free users see upgrade prompt after 30 days
2. **Premium Check** - `useUserStore().isPremium()` works correctly

## What Needs To Be Built (Priority Order)

### HIGH PRIORITY - Week 1

#### 1. Bill Split Calculator (2-3 hours)
**Why:** Simple, useful, quick win

**Create:** `src/screens/premium/BillSplitScreen.tsx`

**Features:**
- Input: Total bill amount
- Input: Number of people
- Input: Tip percentage (15%, 18%, 20%, custom)
- Output: Each person's share
- Output: Total with tip
- Tip Pool Mode: Distribute tips among staff

**Navigation:** Add to Main tab or Settings

---

#### 2. Tax Tracking Dashboard (4-5 hours)
**Why:** Users need this for tax season (urgent)

**Create:** `src/screens/premium/TaxTrackingScreen.tsx`

**Features:**
- Quarterly earnings summary (Q1, Q2, Q3, Q4)
- Estimated tax owed (15.3% self-employment)
- Deductions tracker (add/edit/delete from `deductions` table)
- Categories: Gas, Uniform, Supplies, Other
- Tax export button (links to Export Reports)

**API:** `src/services/api/tax.ts`
```typescript
export const getTaxSummary = async (year: number)
export const addDeduction = async (deduction: Deduction)
export const getDeductions = async (userId: string, year?: number)
```

---

#### 3. Export Reports (3-4 hours)
**Why:** Critical for tax filing

**Create:** `src/screens/premium/ExportReportsScreen.tsx`

**Features:**
- Date range picker (start date, end date)
- Export format options: CSV, PDF, JSON
- Report types:
  - Earnings Summary (total tips, hours, avg/hour)
  - Detailed Tip Log (all entries)
  - Tax Report (tips + deductions)
- Share via email/messaging apps

**Libraries needed:**
```bash
npx expo install react-native-share
npm install papaparse  # for CSV
npm install jspdf       # for PDF
```

**API:** Enhance `src/services/api/user.ts`
```typescript
export const exportTipEntries = async (startDate, endDate, format: 'csv' | 'pdf' | 'json')
```

---

### MEDIUM PRIORITY - Week 2

#### 4. Goals Management (3-4 hours)
**Why:** Users want to track savings goals

**Create:** `src/screens/premium/GoalsScreen.tsx`

**Features:**
- List all active goals
- Create new goal (daily/weekly/monthly)
- Progress bars for each goal
- Edit/delete goals
- Goal completion celebration (confetti animation!)

**API:** `src/services/api/goals.ts`
```typescript
export const getGoals = async (userId: string)
export const createGoal = async (goal: Goal)
export const updateGoal = async (goalId: string, updates: Partial<Goal>)
export const deleteGoal = async (goalId: string)
```

---

#### 5. Advanced Analytics (4-5 hours)
**Why:** Premium feature, visual appeal

**Enhance:** `src/screens/main/StatsScreen.tsx`

**New Premium Charts:**
- Line chart: Tips over time (last 30 days)
- Bar chart: Best earning days of week
- Pie chart: Shift type performance
- Comparison: This month vs last month

**Libraries needed:**
```bash
npx expo install react-native-chart-kit
# OR
npx expo install victory-native
```

**Premium Lock:** Show "Upgrade to Premium" overlay for free users

---

### LOW PRIORITY - Week 3+

#### 6. Receipt Scanner (6-8 hours - COMPLEX)
**Why:** Most complex feature, can wait

**Create:** `src/screens/premium/ReceiptScannerScreen.tsx`

**Features:**
- Camera integration (expo-camera)
- Capture receipt photo
- Upload to Supabase Storage
- OCR with Google Cloud Vision or OpenAI Vision API
- Parse: date, hours worked, tip amount
- Pre-fill Add Tip screen with parsed data
- Save receipt image linked to tip_entry

**Libraries needed:**
```bash
npx expo install expo-camera expo-image-picker
```

**API Setup:**
- Google Cloud Vision API OR
- OpenAI Vision API (easier, pay-per-use)
- Supabase Storage bucket for receipt images

**Database:** Add `receipts` table (see PREMIUM_FEATURES_STATUS.md)

---

## Navigation Changes Needed

### Add Premium Tab to Main Navigation

**Option A:** Add "Premium" tab to bottom nav
```typescript
// In MainTabNavigator.tsx
<Tab.Screen name="Premium" component={PremiumFeaturesScreen} />
```

**Option B:** Add to Settings menu
- Settings → Premium Features
- Shows all premium feature links

**Recommended:** Option B (keep bottom nav clean)

---

## Quick Wins (Do These First)

### 1. Enable Premium for Testing (5 minutes)

Run this SQL in Supabase to make your account premium:
```sql
UPDATE users
SET subscription_tier = 'premium'
WHERE email = 'erik.scott.life@gmail.com';
```

### 2. Create Premium Features Menu (30 minutes)

**Create:** `src/screens/premium/PremiumFeaturesScreen.tsx`

Simple menu screen with buttons:
- 📊 Advanced Analytics
- 💰 Tax Tracking
- 🎯 Goals
- 🧮 Bill Split Calculator
- 📄 Export Reports
- 📸 Receipt Scanner (Coming Soon)

Add to Settings or Main navigation.

---

## Testing Strategy

### Free Tier
1. Verify upgrade prompts show correctly
2. Verify premium features are locked
3. Verify 30-day history limit

### Premium Tier
1. Make your account premium in Supabase
2. Verify all features unlock
3. Test each feature thoroughly

---

## Implementation Order (Recommended)

**Day 1:**
1. Fix isPremium() ✅ (DONE)
2. Make test account premium in database
3. Create PremiumFeaturesScreen menu
4. Build Bill Split Calculator

**Day 2-3:**
5. Build Tax Tracking Dashboard
6. Build Export Reports (CSV + PDF)

**Day 4-5:**
7. Build Goals Management
8. Enhance Analytics with charts

**Day 6+:**
9. Build Receipt Scanner (if time allows)

---

## Files to Create

```
src/screens/premium/
  ├── PremiumFeaturesScreen.tsx      (menu/hub)
  ├── BillSplitScreen.tsx            (calculator)
  ├── TaxTrackingScreen.tsx          (tax dashboard)
  ├── GoalsScreen.tsx                (goals management)
  ├── ExportReportsScreen.tsx        (export functionality)
  └── ReceiptScannerScreen.tsx       (camera + OCR)

src/services/api/
  ├── tax.ts                         (tax calculations)
  ├── goals.ts                       (goals CRUD)
  ├── export.ts                      (CSV/PDF generation)
  └── receipts.ts                    (OCR + image upload)
```

---

## Revenue Cat Integration (Later)

After features are built, integrate payment processing:

```bash
npx expo install react-native-purchases
```

1. Create Revenue Cat account
2. Set up products: `premium_monthly`, `premium_annual`
3. Update UpgradeScreen.tsx to use real purchases
4. Add subscription check on app start

**For now:** Manually set users to premium in database for testing

---

## Summary

**Easiest to build first:**
1. Bill Split Calculator (2-3 hours)
2. Tax Tracking (4-5 hours)
3. Export Reports (3-4 hours)

**Total for MVP:** ~10-12 hours of development

**Can skip for now:**
- Receipt Scanner (complex, 6-8 hours)
- Advanced Analytics can use basic version

**Next Step:** Build Bill Split Calculator first (quick win!)
