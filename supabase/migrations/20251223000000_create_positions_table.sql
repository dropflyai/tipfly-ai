-- Create positions table for job roles (Server, Bartender, Host, etc.)
CREATE TABLE IF NOT EXISTS public.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_positions_user_id ON public.positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_job_id ON public.positions(job_id);
CREATE INDEX IF NOT EXISTS idx_positions_user_job ON public.positions(user_id, job_id);

-- Enable Row Level Security
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own positions
CREATE POLICY "Users can view their own positions"
  ON public.positions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own positions"
  ON public.positions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own positions"
  ON public.positions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own positions"
  ON public.positions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add position_id column to tip_entries if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tip_entries' AND column_name = 'position_id'
  ) THEN
    ALTER TABLE public.tip_entries
    ADD COLUMN position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for position_id in tip_entries
CREATE INDEX IF NOT EXISTS idx_tip_entries_position_id ON public.tip_entries(position_id);

-- Grant permissions
GRANT ALL ON public.positions TO authenticated;
GRANT ALL ON public.positions TO service_role;
