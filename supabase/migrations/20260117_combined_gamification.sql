-- =====================================================
-- COMBINED GAMIFICATION MIGRATION
-- Run this in Supabase SQL Editor to fix the errors
-- =====================================================

-- =====================================================
-- PART 1: USER STREAKS & BADGES
-- =====================================================

-- User streaks table
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_logged_date DATE,
  streak_started_at TIMESTAMPTZ,
  total_tips_logged INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- RLS Policies for streaks/badges
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own streaks" ON user_streaks;
CREATE POLICY "Users can view own streaks"
  ON user_streaks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
CREATE POLICY "Users can view own badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

-- =====================================================
-- PART 2: REFERRAL SYSTEM
-- =====================================================

-- Add referral columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

-- Create referrals tracking table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  reward_type TEXT,
  reward_granted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create referral rewards table
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL,
  referral_count_at_reward INTEGER NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  redeemed BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMPTZ
);

-- RLS Policies for referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

DROP POLICY IF EXISTS "Users can view own rewards" ON referral_rewards;
CREATE POLICY "Users can view own rewards"
  ON referral_rewards FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes for referrals
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_user_id ON referral_rewards(user_id);

-- =====================================================
-- PART 3: HELPER FUNCTIONS
-- =====================================================

-- Function to generate a unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral code for new users
CREATE OR REPLACE FUNCTION set_user_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  IF NEW.referral_code IS NULL THEN
    LOOP
      new_code := generate_referral_code();
      SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    NEW.referral_code := new_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_referral_code ON users;
CREATE TRIGGER trigger_set_referral_code
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_user_referral_code();

-- =====================================================
-- PART 4: STREAK UPDATE FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  v_streak_record user_streaks%ROWTYPE;
  v_tip_date DATE;
BEGIN
  v_tip_date := DATE(NEW.date);

  SELECT * INTO v_streak_record
  FROM user_streaks
  WHERE user_id = NEW.user_id;

  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_logged_date, streak_started_at, total_tips_logged)
    VALUES (NEW.user_id, 1, 1, v_tip_date, NOW(), 1);
  ELSE
    IF v_streak_record.last_logged_date IS NULL THEN
      UPDATE user_streaks
      SET current_streak = 1,
          longest_streak = 1,
          last_logged_date = v_tip_date,
          streak_started_at = NOW(),
          total_tips_logged = total_tips_logged + 1,
          updated_at = NOW()
      WHERE user_id = NEW.user_id;
    ELSIF v_tip_date = v_streak_record.last_logged_date THEN
      UPDATE user_streaks
      SET total_tips_logged = total_tips_logged + 1,
          updated_at = NOW()
      WHERE user_id = NEW.user_id;
    ELSIF v_tip_date = v_streak_record.last_logged_date + INTERVAL '1 day' THEN
      UPDATE user_streaks
      SET current_streak = current_streak + 1,
          longest_streak = GREATEST(longest_streak, current_streak + 1),
          last_logged_date = v_tip_date,
          total_tips_logged = total_tips_logged + 1,
          updated_at = NOW()
      WHERE user_id = NEW.user_id;
    ELSIF v_tip_date > v_streak_record.last_logged_date + INTERVAL '1 day' THEN
      UPDATE user_streaks
      SET current_streak = 1,
          last_logged_date = v_tip_date,
          streak_started_at = NOW(),
          total_tips_logged = total_tips_logged + 1,
          updated_at = NOW()
      WHERE user_id = NEW.user_id;
    ELSE
      UPDATE user_streaks
      SET total_tips_logged = total_tips_logged + 1,
          updated_at = NOW()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_streak ON tip_entries;
CREATE TRIGGER trigger_update_streak
  AFTER INSERT ON tip_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streak();

-- =====================================================
-- PART 5: INITIALIZE DATA FOR EXISTING USERS
-- =====================================================

-- Generate referral codes for existing users without one
UPDATE users
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;

-- Initialize streaks for existing users based on their tip history
INSERT INTO user_streaks (user_id, total_tips_logged)
SELECT DISTINCT user_id, COUNT(*) as total
FROM tip_entries
GROUP BY user_id
ON CONFLICT (user_id) DO UPDATE
SET total_tips_logged = EXCLUDED.total_tips_logged;

-- =====================================================
-- DONE! The gamification errors should now be fixed.
-- =====================================================
