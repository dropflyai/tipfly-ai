-- Add notification_preferences column to profiles for weekly summary settings
-- This migration adds user preferences for email notifications

-- Add notification_preferences JSONB column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'notification_preferences'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN notification_preferences JSONB DEFAULT '{"weekly_summary": true, "streak_reminders": true, "goal_alerts": true}'::jsonb;
  END IF;
END $$;

-- Add email_verified column if not exists (used to gate email sending)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN email_verified BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create index for efficient querying of users with weekly summary enabled
CREATE INDEX IF NOT EXISTS idx_profiles_weekly_summary_enabled
ON profiles ((notification_preferences->>'weekly_summary'))
WHERE (notification_preferences->>'weekly_summary')::boolean = true;

-- Create a table to track sent summaries (prevent duplicates)
CREATE TABLE IF NOT EXISTS weekly_summary_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_id TEXT, -- Resend email ID
  stats JSONB, -- Summary stats sent
  CONSTRAINT unique_user_week_summary UNIQUE (user_id, week_start)
);

-- Enable RLS
ALTER TABLE weekly_summary_log ENABLE ROW LEVEL SECURITY;

-- Users can only view their own summary logs
CREATE POLICY "Users can view own summary logs" ON weekly_summary_log
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update (Edge Function)
-- No policies for INSERT/UPDATE means only service role can do it

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_weekly_summary_log_user ON weekly_summary_log(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_summary_log_week ON weekly_summary_log(week_start);

-- Comment
COMMENT ON TABLE weekly_summary_log IS 'Tracks sent weekly email summaries to prevent duplicates';
COMMENT ON COLUMN profiles.notification_preferences IS 'User notification preferences: weekly_summary, streak_reminders, goal_alerts';
