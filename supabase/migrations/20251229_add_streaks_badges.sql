-- Migration: Add Streaks and Badges System
-- Run this in Supabase SQL Editor

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

-- Function to update streak when a tip is logged
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  v_streak_record user_streaks%ROWTYPE;
  v_tip_date DATE;
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  -- Get the date from the tip entry
  v_tip_date := DATE(NEW.date);

  -- Get or create streak record
  SELECT * INTO v_streak_record
  FROM user_streaks
  WHERE user_id = NEW.user_id;

  IF NOT FOUND THEN
    -- Create new streak record
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_logged_date, streak_started_at, total_tips_logged)
    VALUES (NEW.user_id, 1, 1, v_tip_date, NOW(), 1);
  ELSE
    -- Update existing streak
    IF v_streak_record.last_logged_date IS NULL THEN
      -- First tip ever
      UPDATE user_streaks
      SET current_streak = 1,
          longest_streak = 1,
          last_logged_date = v_tip_date,
          streak_started_at = NOW(),
          total_tips_logged = total_tips_logged + 1,
          updated_at = NOW()
      WHERE user_id = NEW.user_id;
    ELSIF v_tip_date = v_streak_record.last_logged_date THEN
      -- Same day, just increment total
      UPDATE user_streaks
      SET total_tips_logged = total_tips_logged + 1,
          updated_at = NOW()
      WHERE user_id = NEW.user_id;
    ELSIF v_tip_date = v_streak_record.last_logged_date + INTERVAL '1 day' THEN
      -- Consecutive day, increment streak
      UPDATE user_streaks
      SET current_streak = current_streak + 1,
          longest_streak = GREATEST(longest_streak, current_streak + 1),
          last_logged_date = v_tip_date,
          total_tips_logged = total_tips_logged + 1,
          updated_at = NOW()
      WHERE user_id = NEW.user_id;
    ELSIF v_tip_date > v_streak_record.last_logged_date + INTERVAL '1 day' THEN
      -- Streak broken, reset
      UPDATE user_streaks
      SET current_streak = 1,
          last_logged_date = v_tip_date,
          streak_started_at = NOW(),
          total_tips_logged = total_tips_logged + 1,
          updated_at = NOW()
      WHERE user_id = NEW.user_id;
    ELSE
      -- Backdated entry, just increment total
      UPDATE user_streaks
      SET total_tips_logged = total_tips_logged + 1,
          updated_at = NOW()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;

  -- Check and award badges
  PERFORM check_and_award_badges(NEW.user_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check and award badges
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_streak user_streaks%ROWTYPE;
  v_weekly_total NUMERIC;
  v_monthly_total NUMERIC;
  v_goals_completed INTEGER;
BEGIN
  -- Get streak data
  SELECT * INTO v_streak FROM user_streaks WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Badge: first_tip (First Steps)
  IF v_streak.total_tips_logged >= 1 THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, 'first_tip')
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  -- Badge: ten_tips (Getting Started)
  IF v_streak.total_tips_logged >= 10 THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, 'ten_tips')
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  -- Badge: fifty_tips (Regular Logger)
  IF v_streak.total_tips_logged >= 50 THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, 'fifty_tips')
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  -- Badge: hundred_tips (Pro Logger)
  IF v_streak.total_tips_logged >= 100 THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, 'hundred_tips')
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  -- Badge: streak_7 (On Fire)
  IF v_streak.current_streak >= 7 THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, 'streak_7')
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  -- Badge: streak_30 (Unstoppable)
  IF v_streak.current_streak >= 30 THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, 'streak_30')
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  -- Badge: streak_100 (Legend)
  IF v_streak.current_streak >= 100 THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, 'streak_100')
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  -- Check weekly earnings for money badges
  SELECT COALESCE(SUM(amount), 0) INTO v_weekly_total
  FROM tip_entries
  WHERE user_id = p_user_id
    AND date >= CURRENT_DATE - INTERVAL '7 days';

  -- Badge: first_500 (Money Maker)
  IF v_weekly_total >= 500 THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, 'first_500')
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  -- Badge: first_1000 (Big Earner)
  IF v_weekly_total >= 1000 THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, 'first_1000')
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  -- Check for goal completion badge
  SELECT COUNT(*) INTO v_goals_completed
  FROM goals
  WHERE user_id = p_user_id AND status = 'completed';

  IF v_goals_completed >= 1 THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, 'goal_crusher')
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

END;
$$ LANGUAGE plpgsql;

-- Create trigger for streak updates
DROP TRIGGER IF EXISTS trigger_update_streak ON tip_entries;
CREATE TRIGGER trigger_update_streak
  AFTER INSERT ON tip_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streak();

-- RLS Policies
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Users can view their own streaks
CREATE POLICY "Users can view own streaks"
  ON user_streaks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view their own badges
CREATE POLICY "Users can view own badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

-- Initialize streaks for existing users
INSERT INTO user_streaks (user_id, total_tips_logged)
SELECT DISTINCT user_id, COUNT(*) as total
FROM tip_entries
GROUP BY user_id
ON CONFLICT (user_id) DO UPDATE
SET total_tips_logged = EXCLUDED.total_tips_logged;

-- Comments
COMMENT ON TABLE user_streaks IS 'Tracks user tip logging streaks';
COMMENT ON TABLE user_badges IS 'Tracks badges/achievements earned by users';
COMMENT ON COLUMN user_streaks.current_streak IS 'Current consecutive days of logging';
COMMENT ON COLUMN user_streaks.longest_streak IS 'All-time longest streak';
