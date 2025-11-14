# TipFly AI - Complete Feature List

## Core Features (All Users)

### Authentication & Onboarding
- ✅ Welcome screen with app introduction
- ✅ Job type selection (Server, Bartender, Delivery Driver, etc.)
- ✅ Email/password signup and login
- ✅ Secure authentication with Supabase
- ✅ Auto-create user profiles with database triggers

### Dashboard & Tip Tracking
- ✅ Add tips with date, amount, hours worked, shift type
- ✅ View today's tips summary
- ✅ Quick stats cards (weekly total, best day)
- ✅ Tip history list (limited to 30 days for free users)
- ✅ Edit and delete tip entries
- ✅ Date picker for historical entries
- ✅ Shift type tracking (Day, Night, Double, Other)

### Analytics & Charts
- ✅ Weekly earnings bar chart (last 7 days)
- ✅ Monthly trend line chart (last 6 months)
- ✅ Week summary statistics
- ✅ Best earning day identification
- ✅ Average hourly rate calculation
- ✅ Pull-to-refresh functionality

### Settings
- ✅ Profile card with user info
- ✅ Subscription status display
- ✅ Edit profile (name, email view-only, job type)
- ✅ Privacy Policy screen
- ✅ Terms of Service screen
- ✅ Help and support links
- ✅ Export user data (GDPR compliance)
- ✅ Delete account with confirmation
- ✅ Sign out functionality

---

## Premium Features (Subscription Required)

### 1. Bill Split Calculator
**Location:** Settings → Premium Features → Bill Split Calculator

**Features:**
- **Bill Split Mode:**
  - Split total bill among multiple people
  - Calculate tip percentage (15%, 18%, 20%, 25%, custom)
  - Show per-person amount
  - Display total with tip
- **Tip Pool Mode:**
  - Distribute tips between Front of House (FOH) and Back of House (BOH)
  - Adjustable percentage split
  - Staff count input for each group
  - Per-person breakdown

**Files:** [src/screens/premium/BillSplitScreen.tsx](src/screens/premium/BillSplitScreen.tsx:155)

---

### 2. Tax Tracking Dashboard
**Location:** Settings → Premium Features → Tax Tracking

**Features:**
- Year selector for viewing different tax years
- **Year Summary Card:**
  - Total earnings
  - Total deductions
  - Net income
  - Estimated tax (15.3% self-employment tax)
- **Quarterly Breakdown:**
  - Q1, Q2, Q3, Q4 individual summaries
  - Per-quarter tax calculations
- **Deductions Management:**
  - Add deductions (Mileage, Supplies, Phone Bill, Other)
  - View all deductions with categories
  - Delete deductions
  - Category-based filtering
- **Tax Tips Section:**
  - IRS requirements
  - Quarterly payment reminders
  - Record-keeping advice

**Files:**
- [src/screens/premium/TaxTrackingScreen.tsx](src/screens/premium/TaxTrackingScreen.tsx:1)
- [src/services/api/tax.ts](src/services/api/tax.ts:1)

---

### 3. Goals Management
**Location:** Settings → Premium Features → Goals

**Features:**
- Create goals (Daily, Weekly, Monthly)
- Set target amounts
- **Automatic Progress Tracking:**
  - Updates based on tip entries
  - Progress bars
  - Completion percentage
- **Goal States:**
  - Active (in progress)
  - Completed (target reached)
  - Failed (time expired without reaching target)
- Goal deletion
- Historical goal tracking
- Goal completion celebrations

**Files:**
- [src/screens/premium/GoalsScreen.tsx](src/screens/premium/GoalsScreen.tsx:1)
- [src/services/api/goals.ts](src/services/api/goals.ts:1)

---

### 4. Export Reports
**Location:** Settings → Premium Features → Export Reports

**Features:**
- **Date Range Selection:**
  - Last week, month, quarter, year
  - Custom date range
- **Export Formats:**
  - CSV (for Excel/Google Sheets)
  - JSON (for developers/data analysis)
- **Report Contents:**
  - Summary (total tips, hours, average hourly rate)
  - Detailed tip log (all entries with date, amount, hours, shift type)
  - Tax deductions (optional)
- **Sharing:**
  - Share via email, messaging apps
  - Save to cloud storage
  - Auto-generated filenames with date ranges

**Files:**
- [src/screens/premium/ExportReportsScreen.tsx](src/screens/premium/ExportReportsScreen.tsx:1)
- [src/services/api/export.ts](src/services/api/export.ts:1)

**Required Packages:**
- `expo-file-system` (installed)
- `expo-sharing` (installed)

---

### 5. Advanced Analytics
**Location:** Stats Tab (visible to premium users only)

**Premium Charts:**
- **Shift Performance Pie Chart:**
  - Earnings breakdown by shift type (Day, Night, Double, Other)
  - Color-coded visualization
  - Percentage distribution
- **Best Earning Times Analysis:**
  - Morning (6am-12pm)
  - Afternoon (12pm-5pm)
  - Evening (5pm-11pm)
  - Night (11pm-6am)
  - Ranked bar chart with amounts
- **Personalized Insights:**
  - Top earning time percentage
  - Average hourly rate
  - Best earning day identification
  - Trend recommendations

**Files:** [src/screens/main/StatsScreen.tsx](src/screens/main/StatsScreen.tsx:250)

---

### 6. Edit Profile & Job Type
**Location:** Settings → Edit Profile (or Job Type)

**Features:**
- Change full name
- View email (read-only, cannot change for security)
- Change job type from dropdown:
  - Server
  - Bartender
  - Delivery Driver
  - Barista
  - Hair Stylist
  - Uber/Lyft Driver
  - Valet
  - Hotel Staff
  - Other
- Profile picture placeholder (camera icon for future implementation)
- Save button with loading state
- Privacy information display

**Files:** [src/screens/settings/EditProfileScreen.tsx](src/screens/settings/EditProfileScreen.tsx:1)

---

## Planned Features (Not Built Yet)

### Receipt Scanner (Premium)
**Complexity:** High
**Estimated Time:** 6-8 hours

**Features:**
- Camera integration (expo-camera)
- Capture receipt photos
- OCR with Google Cloud Vision or OpenAI Vision
- Auto-parse: date, hours, tips
- Pre-fill Add Tip screen
- Receipt image storage with entries

**Required:**
- `expo-camera`
- `expo-image-picker`
- Google Cloud Vision API or OpenAI Vision API
- Supabase Storage configuration
- New `receipts` table in database

---

## Navigation Structure

```
AppNavigator
├── Onboarding & Auth Stack (if not logged in)
│   ├── Welcome
│   ├── JobSelection
│   ├── Login
│   └── Signup
│
└── Main App Stack (if logged in and onboarded)
    ├── MainTabNavigator (Bottom Tabs)
    │   ├── Dashboard (Home)
    │   ├── Stats (Analytics)
    │   ├── Add Tip
    │   └── Settings
    │
    └── Modal Screens
        ├── Upgrade (Subscription)
        ├── TermsOfService
        ├── PrivacyPolicy
        ├── BillSplit (Premium)
        ├── TaxTracking (Premium)
        ├── Goals (Premium)
        ├── ExportReports (Premium)
        └── EditProfile
```

---

## Database Schema

### Users Table
```sql
- id (UUID, primary key)
- email (text, unique)
- full_name (text)
- job_title (text)
- subscription_tier ('free' | 'premium')
- onboarding_completed (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

### Tip Entries Table
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key)
- date (timestamp)
- amount (numeric)
- hours_worked (numeric)
- shift_type ('day' | 'night' | 'double' | 'other')
- notes (text)
- created_at (timestamp)
- updated_at (timestamp)
```

### Goals Table
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key)
- goal_type ('daily' | 'weekly' | 'monthly')
- target_amount (numeric)
- current_amount (numeric)
- start_date (timestamp)
- end_date (timestamp)
- status ('active' | 'completed' | 'failed')
- created_at (timestamp)
- updated_at (timestamp)
```

### Deductions Table
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key)
- date (timestamp)
- category (text)
- amount (numeric)
- description (text)
- created_at (timestamp)
- updated_at (timestamp)
```

---

## Key Fixes Applied

1. **Database Trigger:** Auto-creates user profiles during signup
2. **Navigation:** Fixed Login screen not in incomplete onboarding stack
3. **Add Tip:** Fixed shift_type constraint error (changed 'dinner' to 'day')
4. **Config:** Updated SHIFT_TYPES to match database constraints
5. **Premium Check:** Fixed isPremium() to check `subscription_tier === 'premium'`
6. **Settings:** All buttons now functional, no more "Coming Soon" alerts

---

## Testing Instructions

### Free User Testing
1. Create new account
2. Add some tips (limited to last 30 days)
3. View analytics (basic charts only)
4. Try to access premium features (should show upgrade prompt)
5. Test all Settings options

### Premium User Testing
1. Set account to premium in Supabase:
   ```sql
   UPDATE users
   SET subscription_tier = 'premium'
   WHERE email = 'your-email@example.com';
   ```
2. **Bill Split Calculator:**
   - Test bill split mode with different amounts
   - Test tip pool mode with FOH/BOH split
3. **Tax Tracking:**
   - Add deductions in different categories
   - View quarterly breakdown
   - Check year summary calculations
4. **Goals:**
   - Create daily, weekly, monthly goals
   - Add tips and watch progress update
   - Verify goal completion logic
5. **Export Reports:**
   - Export last week, month as CSV
   - Export last quarter as JSON
   - Check file contents
6. **Advanced Analytics:**
   - Verify shift performance pie chart
   - Check best earning times analysis
   - View personalized insights
7. **Edit Profile:**
   - Change name
   - Update job type
   - Verify changes persist

---

## Build Information

**Current Build:** Production Release APK
**Location:** `android/app/build/outputs/apk/release/app-release.apk`

**Installed Packages:**
- React Native 0.81.5
- Expo SDK 54
- Supabase JS 2.79.0
- React Navigation 7.x
- Zustand 5.0.8
- date-fns 4.1.0
- react-native-chart-kit 6.12.0
- expo-file-system 19.0.17
- expo-sharing (latest)

---

## Next Steps

1. **Testing:** Comprehensive testing of all premium features
2. **Revenue Cat Integration:** Set up actual payment processing
3. **Receipt Scanner:** Implement camera & OCR functionality
4. **App Store Submission:**
   - Build with EAS
   - Create app store listings
   - Submit to Google Play & Apple App Store
5. **Supabase Rate Limiting:** Enable API protection
6. **Analytics:** Add user behavior tracking
7. **Push Notifications:** Implement goal reminders

---

## Support & Documentation

- **Help Center:** tipgenius.com/help
- **Support Email:** support@tipgenius.com
- **Privacy Policy:** In-app + tipgenius.com/privacy
- **Terms of Service:** In-app + tipgenius.com/terms

Made with ❤️ for service workers
