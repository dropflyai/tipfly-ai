-- Migration: Add Referral System
-- Run this in Supabase SQL Editor

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
  reward_type TEXT, -- 'free_week', 'free_month', 'free_6months'
  reward_granted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create referral rewards table (tracks what rewards users have earned)
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL, -- 'free_week', 'free_month', 'free_6months'
  referral_count_at_reward INTEGER NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  redeemed BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMPTZ
);

-- Function to generate a unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Removed ambiguous chars (0,O,1,I)
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
  -- Only generate if no code exists
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

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_set_referral_code ON users;
CREATE TRIGGER trigger_set_referral_code
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_user_referral_code();

-- Function to process a referral when a new user signs up with a referral code
CREATE OR REPLACE FUNCTION process_referral(
  p_referred_user_id UUID,
  p_referral_code TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_referrer_id UUID;
  v_referrer_count INTEGER;
  v_reward_type TEXT;
BEGIN
  -- Find the referrer by code
  SELECT id, referral_count INTO v_referrer_id, v_referrer_count
  FROM users
  WHERE referral_code = UPPER(p_referral_code);

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
  END IF;

  -- Don't allow self-referral
  IF v_referrer_id = p_referred_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot use your own referral code');
  END IF;

  -- Check if this user was already referred
  IF EXISTS (SELECT 1 FROM users WHERE id = p_referred_user_id AND referred_by IS NOT NULL) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User already has a referrer');
  END IF;

  -- Create the referral record
  INSERT INTO referrals (referrer_id, referred_id, referral_code, status)
  VALUES (v_referrer_id, p_referred_user_id, UPPER(p_referral_code), 'completed');

  -- Update the referred user
  UPDATE users
  SET referred_by = UPPER(p_referral_code)
  WHERE id = p_referred_user_id;

  -- Increment referrer's count
  UPDATE users
  SET referral_count = referral_count + 1
  WHERE id = v_referrer_id
  RETURNING referral_count INTO v_referrer_count;

  -- Determine reward based on new count
  v_reward_type := CASE
    WHEN v_referrer_count >= 10 AND NOT EXISTS (
      SELECT 1 FROM referral_rewards WHERE user_id = v_referrer_id AND reward_type = 'free_6months'
    ) THEN 'free_6months'
    WHEN v_referrer_count >= 3 AND NOT EXISTS (
      SELECT 1 FROM referral_rewards WHERE user_id = v_referrer_id AND reward_type = 'free_month'
    ) THEN 'free_month'
    WHEN v_referrer_count >= 1 AND NOT EXISTS (
      SELECT 1 FROM referral_rewards WHERE user_id = v_referrer_id AND reward_type = 'free_week'
    ) THEN 'free_week'
    ELSE NULL
  END;

  -- Grant reward if earned
  IF v_reward_type IS NOT NULL THEN
    INSERT INTO referral_rewards (user_id, reward_type, referral_count_at_reward, expires_at)
    VALUES (
      v_referrer_id,
      v_reward_type,
      v_referrer_count,
      NOW() + INTERVAL '30 days' -- Reward must be claimed within 30 days
    );

    -- Update referral status
    UPDATE referrals
    SET status = 'rewarded', reward_type = v_reward_type, reward_granted_at = NOW()
    WHERE referrer_id = v_referrer_id AND referred_id = p_referred_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'referrer_id', v_referrer_id,
    'referral_count', v_referrer_count,
    'reward_earned', v_reward_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for referrals table
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referrals (as referrer or referred)
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- RLS Policies for referral_rewards table
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- Users can view their own rewards
CREATE POLICY "Users can view own rewards"
  ON referral_rewards FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_user_id ON referral_rewards(user_id);

-- Grant function execution to authenticated users
GRANT EXECUTE ON FUNCTION process_referral(UUID, TEXT) TO authenticated;

-- Update existing users to have referral codes
UPDATE users
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;

-- Add comments
COMMENT ON TABLE referrals IS 'Tracks referral relationships between users';
COMMENT ON TABLE referral_rewards IS 'Tracks rewards earned from referrals';
COMMENT ON COLUMN users.referral_code IS 'Unique 8-character code for sharing';
COMMENT ON COLUMN users.referred_by IS 'Referral code used when signing up';
COMMENT ON COLUMN users.referral_count IS 'Number of successful referrals';
