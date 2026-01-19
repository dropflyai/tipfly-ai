-- =====================================================
-- FIX: Add missing INSERT/UPDATE RLS policies for weekly_aggregates
-- The trigger update_personal_bests() needs to insert/update this table
-- =====================================================

-- Add INSERT policy for weekly_aggregates
DROP POLICY IF EXISTS "Users can insert own weekly aggregates" ON weekly_aggregates;
CREATE POLICY "Users can insert own weekly aggregates"
  ON weekly_aggregates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add UPDATE policy for weekly_aggregates
DROP POLICY IF EXISTS "Users can update own weekly aggregates" ON weekly_aggregates;
CREATE POLICY "Users can update own weekly aggregates"
  ON weekly_aggregates FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- DONE!
-- =====================================================
