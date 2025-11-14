-- Multi-Job Support Migration
-- Allows users to track tips from multiple jobs/workplaces

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  job_type VARCHAR(50), -- 'restaurant', 'bar', 'delivery', 'rideshare', 'other'
  color VARCHAR(7) DEFAULT '#10b981', -- Hex color for UI (default: emerald-500)
  is_primary BOOLEAN DEFAULT false, -- Mark one job as default/primary
  is_active BOOLEAN DEFAULT true,
  hourly_wage DECIMAL(10, 2), -- Optional base wage
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT jobs_name_length CHECK (char_length(name) >= 2),
  CONSTRAINT jobs_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Add job_id column to tip_entries table (nullable for backward compatibility)
ALTER TABLE tip_entries
ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;

-- Create index for faster job filtering
CREATE INDEX IF NOT EXISTS idx_tip_entries_job_id ON tip_entries(job_id);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);

-- Function to ensure only one primary job per user
CREATE OR REPLACE FUNCTION ensure_single_primary_job()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    -- Unset all other jobs as primary for this user
    UPDATE jobs
    SET is_primary = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain single primary job
DROP TRIGGER IF EXISTS trigger_ensure_single_primary_job ON jobs;
CREATE TRIGGER trigger_ensure_single_primary_job
  BEFORE INSERT OR UPDATE OF is_primary ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_job();

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_jobs_updated_at ON jobs;
CREATE TRIGGER trigger_update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_jobs_updated_at();

-- Row Level Security (RLS) Policies
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own jobs
CREATE POLICY "Users can view own jobs"
  ON jobs FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own jobs
CREATE POLICY "Users can create own jobs"
  ON jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own jobs
CREATE POLICY "Users can update own jobs"
  ON jobs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own jobs
CREATE POLICY "Users can delete own jobs"
  ON jobs FOR DELETE
  USING (auth.uid() = user_id);

-- Create a view for job statistics
CREATE OR REPLACE VIEW job_statistics AS
SELECT
  j.id,
  j.user_id,
  j.name,
  j.color,
  j.job_type,
  j.is_primary,
  COUNT(te.id) AS total_entries,
  COALESCE(SUM(te.tips_earned), 0) AS total_tips,
  COALESCE(SUM(te.hours_worked), 0) AS total_hours,
  CASE
    WHEN SUM(te.hours_worked) > 0
    THEN COALESCE(SUM(te.tips_earned) / SUM(te.hours_worked), 0)
    ELSE 0
  END AS avg_hourly_rate,
  MAX(te.date) AS last_shift_date
FROM jobs j
LEFT JOIN tip_entries te ON j.id = te.job_id
GROUP BY j.id, j.user_id, j.name, j.color, j.job_type, j.is_primary;

-- Grant access to the view
GRANT SELECT ON job_statistics TO authenticated;

-- Helper function to migrate existing tips to a default job
-- (User can call this if they want to assign all existing tips to their first job)
CREATE OR REPLACE FUNCTION migrate_tips_to_default_job()
RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_job_id UUID;
BEGIN
  FOR v_user_id IN SELECT DISTINCT user_id FROM tip_entries WHERE job_id IS NULL
  LOOP
    -- Get or create a default job for this user
    SELECT id INTO v_job_id
    FROM jobs
    WHERE user_id = v_user_id
    ORDER BY is_primary DESC, created_at ASC
    LIMIT 1;

    IF v_job_id IS NULL THEN
      -- Create a default job
      INSERT INTO jobs (user_id, name, is_primary, job_type)
      VALUES (v_user_id, 'Main Job', true, 'other')
      RETURNING id INTO v_job_id;
    END IF;

    -- Migrate tips
    UPDATE tip_entries
    SET job_id = v_job_id
    WHERE user_id = v_user_id AND job_id IS NULL;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE jobs IS 'Stores user job/workplace information for multi-job tip tracking';
COMMENT ON COLUMN jobs.color IS 'Hex color code for visual distinction in UI';
COMMENT ON COLUMN jobs.is_primary IS 'Designates the default job for quick tip entry';
COMMENT ON COLUMN jobs.hourly_wage IS 'Optional base wage for earnings calculations';
COMMENT ON COLUMN tip_entries.job_id IS 'Reference to the job where tips were earned';
