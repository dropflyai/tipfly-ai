# Set Up Your TipFly AI Database (5 Minutes)

## ✅ What's Done:
- Project created
- Dependencies installed
- `.env` file created with your Supabase credentials
- All source code is ready

## 🎯 What You Need to Do NOW:

### Step 1: Open Supabase SQL Editor (2 minutes)

1. Go to: https://supabase.com/dashboard/project/qzdulxkdfjhgcazfnwvb
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"**

### Step 2: Run the Database Migration (3 minutes)

**Copy and paste this ENTIRE SQL script into the SQL Editor:**

```sql
-- TipFly AI Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  job_title TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tip Entries table
CREATE TABLE IF NOT EXISTS tip_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours_worked DECIMAL(4,2) NOT NULL CHECK (hours_worked > 0 AND hours_worked <= 24),
  tips_earned DECIMAL(10,2) NOT NULL CHECK (tips_earned >= 0 AND tips_earned <= 10000),
  shift_type TEXT DEFAULT 'day' CHECK (shift_type IN ('day', 'night', 'double', 'other')),
  notes TEXT CHECK (length(notes) <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly')),
  target_amount DECIMAL(10,2) NOT NULL CHECK (target_amount > 0),
  current_amount DECIMAL(10,2) DEFAULT 0 CHECK (current_amount >= 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deductions table
CREATE TABLE IF NOT EXISTS deductions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('gas', 'uniform', 'supplies', 'other')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0 AND amount <= 10000),
  description TEXT CHECK (length(description) <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tip_entries_user_date ON tip_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_deductions_user_date ON deductions(user_id, date DESC);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tip_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deductions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON users FOR DELETE
  USING (auth.uid() = id);

-- Tip entries policies
CREATE POLICY "Users can view own tip entries"
  ON tip_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tip entries"
  ON tip_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tip entries"
  ON tip_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tip entries"
  ON tip_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Goals policies
CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON goals FOR DELETE
  USING (auth.uid() = user_id);

-- Deductions policies
CREATE POLICY "Users can view own deductions"
  ON deductions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deductions"
  ON deductions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deductions"
  ON deductions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own deductions"
  ON deductions FOR DELETE
  USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tip_entries_updated_at BEFORE UPDATE ON tip_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deductions_updated_at BEFORE UPDATE ON deductions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Then click the "RUN" button (or press Ctrl+Enter)**

### Step 3: Verify Tables Were Created

After running the script, check the left sidebar:
- Click **"Table Editor"**
- You should see 4 tables:
  - ✅ users
  - ✅ tip_entries
  - ✅ goals
  - ✅ deductions

### Step 4: Enable Rate Limiting (Optional but Recommended)

1. Go to **Settings** → **API** → **Rate Limiting**
2. Enable: **100 requests per minute per IP**
3. Enable: **200 requests per minute per authenticated user**
4. Click **Save**

---

## ✅ Done! Now Test the App

Once you've completed the database setup, run:

```bash
cd /c/Users/escot/tipflyai-app
npx expo start
```

**Press 'a' for Android or 'i' for iOS**

### Test Flow:
1. **Sign Up** with: test@tipgenius.com / TestPass123!
2. **Complete onboarding** (select your job, set up profile)
3. **Add a tip entry** (date, hours, amount)
4. **View dashboard** (see your earnings)
5. **Check stats** (view charts and analytics)
6. **Test settings** (export data, account deletion)

---

## If You See Any Errors:

**"Supabase client error"**
- Check your `.env` file has the correct URL and API key
- Restart the Expo server: Ctrl+C, then `npx expo start` again

**"Table does not exist"**
- Go back to Supabase SQL Editor and re-run the migration script
- Make sure you clicked "RUN"

**"RLS policy error"**
- The RLS policies are working! This means you need to be authenticated
- Sign up first, then try again

---

## 🎉 You're Ready to Launch!

After testing locally and everything works:

**Next Steps:**
1. Generate privacy policy (10 min) - Use https://www.privacypolicygenerator.info/
2. Generate terms of service (10 min) - Use https://www.termsofservicegenerator.net/
3. Build with EAS (30 min) - `eas build --platform all`
4. Submit to App Stores (2 hours) - Apple + Google
5. Launch marketing! 🚀

**Questions? Check:**
- [START_HERE_LAUNCH.md](START_HERE_LAUNCH.md) - Complete launch guide
- [LAUNCH_PLAN.md](LAUNCH_PLAN.md) - 7-day detailed plan
- [COMPETITIVE_ANALYSIS.md](COMPETITIVE_ANALYSIS.md) - Why you'll win

---

**Go set up your database now! It takes 5 minutes! 💪**
