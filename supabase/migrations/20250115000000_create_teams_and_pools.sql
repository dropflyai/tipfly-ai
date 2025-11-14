-- ============================================================================
-- TIP POOLING & TEAMS FEATURE
-- ============================================================================
-- This migration adds support for workplace teams and collaborative tip pooling
-- Users can join teams, create shared tip pools, and split earnings

-- ============================================================================
-- WORKPLACES/TEAMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.workplaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT workplaces_name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
  CONSTRAINT workplaces_invite_code_format CHECK (invite_code ~ '^[A-Z0-9]{6}$')
);

-- Index for faster lookups
CREATE INDEX idx_workplaces_invite_code ON public.workplaces(invite_code);
CREATE INDEX idx_workplaces_created_by ON public.workplaces(created_by);

-- ============================================================================
-- WORKPLACE MEMBERSHIPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.workplace_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workplace_id UUID NOT NULL REFERENCES public.workplaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(workplace_id, user_id)
);

-- Indexes for faster queries
CREATE INDEX idx_workplace_memberships_workplace ON public.workplace_memberships(workplace_id);
CREATE INDEX idx_workplace_memberships_user ON public.workplace_memberships(user_id);

-- ============================================================================
-- TIP POOLS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tip_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workplace_id UUID NOT NULL REFERENCES public.workplaces(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  shift_type TEXT CHECK (shift_type IN ('breakfast', 'lunch', 'dinner', 'late_night')),
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  split_type TEXT NOT NULL DEFAULT 'equal_hours' CHECK (split_type IN ('equal_hours', 'custom_percentage')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT tip_pools_total_amount_max CHECK (total_amount <= 100000)
);

-- Indexes
CREATE INDEX idx_tip_pools_workplace ON public.tip_pools(workplace_id);
CREATE INDEX idx_tip_pools_date ON public.tip_pools(date);
CREATE INDEX idx_tip_pools_status ON public.tip_pools(status);
CREATE INDEX idx_tip_pools_created_by ON public.tip_pools(created_by);

-- ============================================================================
-- POOL PARTICIPANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pool_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES public.tip_pools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hours_worked DECIMAL(5, 2) CHECK (hours_worked > 0 AND hours_worked <= 24),
  percentage DECIMAL(5, 2) CHECK (percentage >= 0 AND percentage <= 100),
  share_amount DECIMAL(10, 2) NOT NULL CHECK (share_amount >= 0),
  confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(pool_id, user_id),
  CONSTRAINT pool_participants_share_amount_max CHECK (share_amount <= 100000)
);

-- Indexes
CREATE INDEX idx_pool_participants_pool ON public.pool_participants(pool_id);
CREATE INDEX idx_pool_participants_user ON public.pool_participants(user_id);
CREATE INDEX idx_pool_participants_confirmed ON public.pool_participants(confirmed);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.workplaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workplace_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tip_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_participants ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- WORKPLACES POLICIES
-- ============================================================================

-- Anyone can view workplaces they're a member of
CREATE POLICY "Users can view their workplaces"
  ON public.workplaces FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.workplace_memberships
      WHERE workplace_id = id
    )
  );

-- Authenticated users can create workplaces
CREATE POLICY "Authenticated users can create workplaces"
  ON public.workplaces FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Only workspace creators can update
CREATE POLICY "Owners can update their workplaces"
  ON public.workplaces FOR UPDATE
  USING (auth.uid() = created_by);

-- Only workspace creators can delete
CREATE POLICY "Owners can delete their workplaces"
  ON public.workplaces FOR DELETE
  USING (auth.uid() = created_by);

-- ============================================================================
-- WORKPLACE MEMBERSHIPS POLICIES
-- ============================================================================

-- Users can view memberships for workplaces they're in
CREATE POLICY "Users can view workplace memberships"
  ON public.workplace_memberships FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.workplace_memberships
      WHERE workplace_id = workplace_memberships.workplace_id
    )
  );

-- Authenticated users can join workplaces
CREATE POLICY "Users can join workplaces"
  ON public.workplace_memberships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can leave workplaces they're in
CREATE POLICY "Users can leave workplaces"
  ON public.workplace_memberships FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TIP POOLS POLICIES
-- ============================================================================

-- Team members can view pools for their workplaces
CREATE POLICY "Team members can view tip pools"
  ON public.tip_pools FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.workplace_memberships
      WHERE workplace_id = tip_pools.workplace_id
    )
  );

-- Team members can create pools
CREATE POLICY "Team members can create tip pools"
  ON public.tip_pools FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    auth.uid() IN (
      SELECT user_id FROM public.workplace_memberships
      WHERE workplace_id = tip_pools.workplace_id
    )
  );

-- Pool creators can update their pools (only if status = 'draft')
CREATE POLICY "Pool creators can update draft pools"
  ON public.tip_pools FOR UPDATE
  USING (auth.uid() = created_by AND status = 'draft');

-- Pool creators can delete their pools (only if status = 'draft')
CREATE POLICY "Pool creators can delete draft pools"
  ON public.tip_pools FOR DELETE
  USING (auth.uid() = created_by AND status = 'draft');

-- ============================================================================
-- POOL PARTICIPANTS POLICIES
-- ============================================================================

-- Team members can view participants for pools in their workplaces
CREATE POLICY "Team members can view pool participants"
  ON public.pool_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tip_pools tp
      JOIN public.workplace_memberships wm ON tp.workplace_id = wm.workplace_id
      WHERE tp.id = pool_participants.pool_id AND wm.user_id = auth.uid()
    )
  );

-- Pool creators can add participants
CREATE POLICY "Pool creators can add participants"
  ON public.pool_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tip_pools
      WHERE id = pool_id AND created_by = auth.uid() AND status = 'draft'
    )
  );

-- Participants can update their own confirmation status
CREATE POLICY "Participants can confirm their share"
  ON public.pool_participants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Pool creators can delete participants (only from draft pools)
CREATE POLICY "Pool creators can remove participants from draft pools"
  ON public.pool_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tip_pools
      WHERE id = pool_id AND created_by = auth.uid() AND status = 'draft'
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude confusing chars (0,O,1,I)
  code TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for workplaces updated_at
CREATE TRIGGER update_workplaces_updated_at
  BEFORE UPDATE ON public.workplaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for tip_pools updated_at
CREATE TRIGGER update_tip_pools_updated_at
  BEFORE UPDATE ON public.tip_pools
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workplaces TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workplace_memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tip_pools TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pool_participants TO authenticated;
