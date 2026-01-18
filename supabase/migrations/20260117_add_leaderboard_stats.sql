-- =====================================================
-- LEADERBOARD & PERSONAL BESTS MIGRATION
-- Anonymous percentile rankings + personal records
-- =====================================================

-- Personal bests table - tracks user's record performances
CREATE TABLE IF NOT EXISTS user_personal_bests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  best_day_amount DECIMAL(10,2) DEFAULT 0,
  best_day_date DATE,
  best_week_amount DECIMAL(10,2) DEFAULT 0,
  best_week_start DATE,
  best_month_amount DECIMAL(10,2) DEFAULT 0,
  best_month_date DATE, -- First of the month
  best_hourly_rate DECIMAL(10,2) DEFAULT 0,
  best_hourly_date DATE,
  longest_streak INTEGER DEFAULT 0,
  total_lifetime_tips DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly aggregates for percentile calculation (anonymized)
CREATE TABLE IF NOT EXISTS weekly_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL, -- Monday of the week
  total_tips DECIMAL(10,2) DEFAULT 0,
  total_hours DECIMAL(6,2) DEFAULT 0,
  avg_hourly_rate DECIMAL(10,2) DEFAULT 0,
  tip_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- RLS Policies
ALTER TABLE user_personal_bests ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_aggregates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own personal bests" ON user_personal_bests;
CREATE POLICY "Users can view own personal bests"
  ON user_personal_bests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own personal bests" ON user_personal_bests;
CREATE POLICY "Users can update own personal bests"
  ON user_personal_bests FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own personal bests" ON user_personal_bests;
CREATE POLICY "Users can insert own personal bests"
  ON user_personal_bests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own weekly aggregates" ON weekly_aggregates;
CREATE POLICY "Users can view own weekly aggregates"
  ON weekly_aggregates FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_personal_bests_user_id ON user_personal_bests(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_aggregates_user_id ON weekly_aggregates(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_aggregates_week_start ON weekly_aggregates(week_start);

-- =====================================================
-- FUNCTION: Calculate user's percentile for a given week
-- Returns what percentage of users they outperformed
-- =====================================================
CREATE OR REPLACE FUNCTION get_weekly_percentile(
  p_user_id UUID,
  p_week_start DATE DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_week_start DATE;
  v_user_total DECIMAL;
  v_total_users INTEGER;
  v_users_below INTEGER;
  v_percentile INTEGER;
BEGIN
  -- Default to current week (Monday)
  v_week_start := COALESCE(p_week_start, date_trunc('week', CURRENT_DATE)::DATE);

  -- Get user's total for this week
  SELECT total_tips INTO v_user_total
  FROM weekly_aggregates
  WHERE user_id = p_user_id AND week_start = v_week_start;

  IF v_user_total IS NULL THEN
    -- Calculate from tip_entries if not aggregated yet
    SELECT COALESCE(SUM(tips_earned), 0) INTO v_user_total
    FROM tip_entries
    WHERE user_id = p_user_id
    AND date >= v_week_start
    AND date < v_week_start + INTERVAL '7 days';
  END IF;

  -- Count total users with data this week
  SELECT COUNT(DISTINCT user_id) INTO v_total_users
  FROM tip_entries
  WHERE date >= v_week_start
  AND date < v_week_start + INTERVAL '7 days';

  IF v_total_users <= 1 THEN
    RETURN jsonb_build_object(
      'percentile', 50,
      'total_users', v_total_users,
      'user_total', v_user_total,
      'week_start', v_week_start
    );
  END IF;

  -- Count users with less earnings
  SELECT COUNT(DISTINCT user_id) INTO v_users_below
  FROM (
    SELECT user_id, SUM(tips_earned) as total
    FROM tip_entries
    WHERE date >= v_week_start
    AND date < v_week_start + INTERVAL '7 days'
    GROUP BY user_id
    HAVING SUM(tips_earned) < v_user_total
  ) sub;

  -- Calculate percentile (0-100)
  v_percentile := ROUND((v_users_below::DECIMAL / v_total_users::DECIMAL) * 100);

  RETURN jsonb_build_object(
    'percentile', v_percentile,
    'total_users', v_total_users,
    'user_total', v_user_total,
    'week_start', v_week_start
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Get streak percentile
-- =====================================================
CREATE OR REPLACE FUNCTION get_streak_percentile(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_streak INTEGER;
  v_total_users INTEGER;
  v_users_below INTEGER;
  v_percentile INTEGER;
BEGIN
  -- Get user's current streak
  SELECT current_streak INTO v_user_streak
  FROM user_streaks
  WHERE user_id = p_user_id;

  IF v_user_streak IS NULL OR v_user_streak = 0 THEN
    RETURN jsonb_build_object(
      'percentile', 0,
      'current_streak', 0,
      'total_users', 0
    );
  END IF;

  -- Count total users with streaks
  SELECT COUNT(*) INTO v_total_users
  FROM user_streaks
  WHERE current_streak > 0;

  -- Count users with lower streaks
  SELECT COUNT(*) INTO v_users_below
  FROM user_streaks
  WHERE current_streak < v_user_streak AND current_streak > 0;

  IF v_total_users <= 1 THEN
    v_percentile := 50;
  ELSE
    v_percentile := ROUND((v_users_below::DECIMAL / v_total_users::DECIMAL) * 100);
  END IF;

  RETURN jsonb_build_object(
    'percentile', v_percentile,
    'current_streak', v_user_streak,
    'total_users', v_total_users
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Update personal bests after tip entry
-- =====================================================
CREATE OR REPLACE FUNCTION update_personal_bests()
RETURNS TRIGGER AS $$
DECLARE
  v_day_total DECIMAL;
  v_week_total DECIMAL;
  v_week_start DATE;
  v_month_total DECIMAL;
  v_month_start DATE;
  v_hourly_rate DECIMAL;
  v_pb RECORD;
BEGIN
  -- Calculate today's total
  SELECT COALESCE(SUM(tips_earned), 0) INTO v_day_total
  FROM tip_entries
  WHERE user_id = NEW.user_id AND date = NEW.date;

  -- Calculate week total
  v_week_start := date_trunc('week', NEW.date::TIMESTAMP)::DATE;
  SELECT COALESCE(SUM(tips_earned), 0) INTO v_week_total
  FROM tip_entries
  WHERE user_id = NEW.user_id
  AND date >= v_week_start
  AND date < v_week_start + INTERVAL '7 days';

  -- Calculate month total
  v_month_start := date_trunc('month', NEW.date::TIMESTAMP)::DATE;
  SELECT COALESCE(SUM(tips_earned), 0) INTO v_month_total
  FROM tip_entries
  WHERE user_id = NEW.user_id
  AND date >= v_month_start
  AND date < v_month_start + INTERVAL '1 month';

  -- Calculate hourly rate for this entry
  IF NEW.hours_worked > 0 THEN
    v_hourly_rate := NEW.tips_earned / NEW.hours_worked;
  ELSE
    v_hourly_rate := 0;
  END IF;

  -- Get or create personal bests record
  SELECT * INTO v_pb FROM user_personal_bests WHERE user_id = NEW.user_id;

  IF NOT FOUND THEN
    INSERT INTO user_personal_bests (
      user_id,
      best_day_amount, best_day_date,
      best_week_amount, best_week_start,
      best_month_amount, best_month_date,
      best_hourly_rate, best_hourly_date,
      total_lifetime_tips
    ) VALUES (
      NEW.user_id,
      v_day_total, NEW.date,
      v_week_total, v_week_start,
      v_month_total, v_month_start,
      v_hourly_rate, NEW.date,
      NEW.tips_earned
    );
  ELSE
    UPDATE user_personal_bests
    SET
      best_day_amount = CASE WHEN v_day_total > best_day_amount THEN v_day_total ELSE best_day_amount END,
      best_day_date = CASE WHEN v_day_total > best_day_amount THEN NEW.date ELSE best_day_date END,
      best_week_amount = CASE WHEN v_week_total > best_week_amount THEN v_week_total ELSE best_week_amount END,
      best_week_start = CASE WHEN v_week_total > best_week_amount THEN v_week_start ELSE best_week_start END,
      best_month_amount = CASE WHEN v_month_total > best_month_amount THEN v_month_total ELSE best_month_amount END,
      best_month_date = CASE WHEN v_month_total > best_month_amount THEN v_month_start ELSE best_month_date END,
      best_hourly_rate = CASE WHEN v_hourly_rate > best_hourly_rate THEN v_hourly_rate ELSE best_hourly_rate END,
      best_hourly_date = CASE WHEN v_hourly_rate > best_hourly_rate THEN NEW.date ELSE best_hourly_date END,
      total_lifetime_tips = total_lifetime_tips + NEW.tips_earned,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  -- Update weekly aggregate
  INSERT INTO weekly_aggregates (user_id, week_start, total_tips, total_hours, tip_count, avg_hourly_rate)
  VALUES (
    NEW.user_id,
    v_week_start,
    NEW.tips_earned,
    NEW.hours_worked,
    1,
    v_hourly_rate
  )
  ON CONFLICT (user_id, week_start) DO UPDATE
  SET
    total_tips = weekly_aggregates.total_tips + NEW.tips_earned,
    total_hours = weekly_aggregates.total_hours + NEW.hours_worked,
    tip_count = weekly_aggregates.tip_count + 1,
    avg_hourly_rate = (weekly_aggregates.total_tips + NEW.tips_earned) / NULLIF(weekly_aggregates.total_hours + NEW.hours_worked, 0),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_personal_bests ON tip_entries;
CREATE TRIGGER trigger_update_personal_bests
  AFTER INSERT ON tip_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_personal_bests();

-- =====================================================
-- FUNCTION: Get user's personal bests with comparison to current
-- =====================================================
CREATE OR REPLACE FUNCTION get_personal_bests_with_progress(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_pb RECORD;
  v_current_week DECIMAL;
  v_current_month DECIMAL;
  v_week_start DATE;
  v_month_start DATE;
BEGIN
  -- Get personal bests
  SELECT * INTO v_pb FROM user_personal_bests WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'has_data', false
    );
  END IF;

  -- Calculate current week total
  v_week_start := date_trunc('week', CURRENT_DATE)::DATE;
  SELECT COALESCE(SUM(tips_earned), 0) INTO v_current_week
  FROM tip_entries
  WHERE user_id = p_user_id
  AND date >= v_week_start
  AND date < v_week_start + INTERVAL '7 days';

  -- Calculate current month total
  v_month_start := date_trunc('month', CURRENT_DATE)::DATE;
  SELECT COALESCE(SUM(tips_earned), 0) INTO v_current_month
  FROM tip_entries
  WHERE user_id = p_user_id
  AND date >= v_month_start
  AND date < v_month_start + INTERVAL '1 month';

  RETURN jsonb_build_object(
    'has_data', true,
    'best_day', jsonb_build_object(
      'amount', v_pb.best_day_amount,
      'date', v_pb.best_day_date
    ),
    'best_week', jsonb_build_object(
      'amount', v_pb.best_week_amount,
      'date', v_pb.best_week_start,
      'current', v_current_week,
      'progress_percent', CASE WHEN v_pb.best_week_amount > 0
        THEN ROUND((v_current_week / v_pb.best_week_amount) * 100)
        ELSE 0 END,
      'amount_to_beat', v_pb.best_week_amount - v_current_week
    ),
    'best_month', jsonb_build_object(
      'amount', v_pb.best_month_amount,
      'date', v_pb.best_month_date,
      'current', v_current_month,
      'progress_percent', CASE WHEN v_pb.best_month_amount > 0
        THEN ROUND((v_current_month / v_pb.best_month_amount) * 100)
        ELSE 0 END,
      'amount_to_beat', v_pb.best_month_amount - v_current_month
    ),
    'best_hourly', jsonb_build_object(
      'rate', v_pb.best_hourly_rate,
      'date', v_pb.best_hourly_date
    ),
    'lifetime_total', v_pb.total_lifetime_tips
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_weekly_percentile(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_streak_percentile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_personal_bests_with_progress(UUID) TO authenticated;

-- =====================================================
-- Initialize personal bests for existing users
-- =====================================================
INSERT INTO user_personal_bests (user_id, total_lifetime_tips)
SELECT DISTINCT user_id, COALESCE(SUM(tips_earned), 0)
FROM tip_entries
GROUP BY user_id
ON CONFLICT (user_id) DO UPDATE
SET total_lifetime_tips = EXCLUDED.total_lifetime_tips;

-- Backfill weekly aggregates for existing data
INSERT INTO weekly_aggregates (user_id, week_start, total_tips, total_hours, tip_count, avg_hourly_rate)
SELECT
  user_id,
  date_trunc('week', date::TIMESTAMP)::DATE as week_start,
  SUM(tips_earned) as total_tips,
  SUM(hours_worked) as total_hours,
  COUNT(*) as tip_count,
  SUM(tips_earned) / NULLIF(SUM(hours_worked), 0) as avg_hourly_rate
FROM tip_entries
GROUP BY user_id, date_trunc('week', date::TIMESTAMP)::DATE
ON CONFLICT (user_id, week_start) DO UPDATE
SET
  total_tips = EXCLUDED.total_tips,
  total_hours = EXCLUDED.total_hours,
  tip_count = EXCLUDED.tip_count,
  avg_hourly_rate = EXCLUDED.avg_hourly_rate;

-- =====================================================
-- DONE!
-- =====================================================
