# TipFly AI - Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in:
   - **Project Name**: TipFly AI
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users
5. Click "Create new project"

## 2. Get Your API Credentials

Once your project is created:

1. Go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (`EXPO_PUBLIC_SUPABASE_URL`)
   - **Project API Key** (anon public) (`EXPO_PUBLIC_SUPABASE_ANON_KEY`)

3. Create a `.env` file in the root of your project:
```env
EXPO_PUBLIC_SUPABASE_URL=your_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 3. Run Database Migrations

Go to **SQL Editor** in your Supabase dashboard and run the following SQL:

### Create Tables

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  job_title TEXT,

  -- Settings
  average_hourly_wage DECIMAL(10,2) DEFAULT 0,
  state TEXT,
  currency TEXT DEFAULT 'USD',

  -- Subscription
  subscription_status TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_end_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT false
);

-- Tip Entries Table
CREATE TABLE tip_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Core Data
  date DATE NOT NULL,
  hours_worked DECIMAL(4,2) NOT NULL,
  tips_earned DECIMAL(10,2) NOT NULL,
  base_pay DECIMAL(10,2) DEFAULT 0,

  -- Optional Metadata
  shift_type TEXT,
  location TEXT,
  notes TEXT,

  -- Receipt Data (Premium)
  receipt_image_url TEXT,
  receipt_scanned_at TIMESTAMPTZ,

  -- Calculated Fields
  hourly_rate DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE WHEN hours_worked > 0
    THEN tips_earned / hours_worked
    ELSE 0 END
  ) STORED,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals Table
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Goal Details
  goal_type TEXT NOT NULL,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,

  -- Timeline
  start_date DATE NOT NULL,
  end_date DATE,

  -- Metadata
  goal_name TEXT,
  is_active BOOLEAN DEFAULT true,
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deductions Table (Tax tracking - Premium)
CREATE TABLE deductions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Deduction Data
  date DATE NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  receipt_image_url TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insights Cache (Pre-calculated analytics)
CREATE TABLE insights_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Cached Insights
  best_earning_day TEXT,
  best_shift_type TEXT,
  average_hourly_rate DECIMAL(10,2),
  monthly_projection DECIMAL(10,2),

  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Create Indexes

```sql
-- Indexes for performance
CREATE INDEX idx_tip_entries_user_date ON tip_entries(user_id, date DESC);
CREATE INDEX idx_tip_entries_date ON tip_entries(date DESC);
CREATE INDEX idx_goals_user ON goals(user_id, is_active);
CREATE INDEX idx_deductions_user_date ON deductions(user_id, date DESC);
```

### Create Updated At Trigger

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for tip_entries
CREATE TRIGGER update_tip_entries_updated_at
    BEFORE UPDATE ON tip_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 4. Set Up Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tip_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_cache ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own data"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
    ON users FOR UPDATE
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

-- Insights cache policies
CREATE POLICY "Users can view own insights"
    ON insights_cache FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights"
    ON insights_cache FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
    ON insights_cache FOR UPDATE
    USING (auth.uid() = user_id);
```

## 5. Set Up Authentication

1. Go to **Authentication** > **Settings**
2. Configure the following:

### Email Auth
- Enable Email provider
- Disable "Confirm email" for faster testing (enable in production)
- Set "Site URL" to your app URL

### Social Auth (Optional)
- Enable Apple Sign In (required for iOS App Store)
- Enable Google Sign In

## 6. Set Up Storage (for receipt images)

1. Go to **Storage**
2. Create a new bucket called `receipts`
3. Set it to **Private** (users can only access their own receipts)
4. Add the following policy:

```sql
-- Storage policy for receipts
CREATE POLICY "Users can upload own receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own receipts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## 7. Test Your Setup

Run this query in SQL Editor to verify:

```sql
-- Test data
SELECT * FROM users;
SELECT * FROM tip_entries;
SELECT * FROM goals;
```

## 8. Next Steps

After completing this setup:

1. Update your `.env` file with the Supabase credentials
2. Run the app: `npm run start`
3. Test authentication and data creation

## Troubleshooting

### Issue: Can't connect to Supabase
- Verify your `.env` file has correct credentials
- Make sure you're using `EXPO_PUBLIC_` prefix for env vars
- Restart your Expo dev server

### Issue: RLS policies blocking access
- Check that you're authenticated
- Verify policies in Supabase dashboard
- Check that `auth.uid()` matches `user_id` in queries

### Issue: Images not uploading
- Verify storage bucket is created
- Check storage policies are applied
- Ensure bucket is set to private with correct policies
