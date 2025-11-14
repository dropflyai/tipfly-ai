-- ============================================================================
-- FIX: Infinite Recursion in workplace_memberships RLS Policy
-- ============================================================================
-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view workplace memberships" ON public.workplace_memberships;

-- Create a non-recursive policy
-- Users can view memberships where they are the user OR where they're in the same workplace
CREATE POLICY "Users can view workplace memberships"
  ON public.workplace_memberships FOR SELECT
  USING (
    -- Users can see their own memberships
    auth.uid() = user_id
    OR
    -- Users can see other memberships in workplaces where they're a member
    workplace_id IN (
      SELECT workplace_id FROM public.workplace_memberships AS wm
      WHERE wm.user_id = auth.uid()
    )
  );
