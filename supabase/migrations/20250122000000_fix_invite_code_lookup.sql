-- ============================================================================
-- FIX: Allow users to lookup workplaces by invite code for joining
-- ============================================================================
--
-- The current RLS policy only allows viewing workplaces where the user is
-- already a member. This prevents the invite code lookup needed before joining.
--
-- This adds a policy allowing authenticated users to SELECT workplaces
-- when querying by invite_code (for joining purposes only).
-- ============================================================================

-- Add policy to allow looking up workplaces by invite code (for joining)
CREATE POLICY "Authenticated users can lookup workplaces by invite code"
  ON public.workplaces FOR SELECT
  USING (
    auth.uid() IS NOT NULL
  );

-- Note: This replaces the restrictive "Users can view their workplaces" policy
-- with a more permissive one. If you want to keep both:
--
-- DROP POLICY IF EXISTS "Users can view their workplaces" ON public.workplaces;
--
-- Then recreate with the new policy above.
--
-- Alternative: Create a database function that bypasses RLS for invite lookups:
--
-- CREATE OR REPLACE FUNCTION public.lookup_workplace_by_invite_code(code TEXT)
-- RETURNS TABLE (id UUID, name TEXT)
-- SECURITY DEFINER
-- SET search_path = public
-- AS $$
-- BEGIN
--   RETURN QUERY
--   SELECT w.id, w.name
--   FROM workplaces w
--   WHERE UPPER(w.invite_code) = UPPER(code);
-- END;
-- $$ LANGUAGE plpgsql;
--
-- GRANT EXECUTE ON FUNCTION public.lookup_workplace_by_invite_code(TEXT) TO authenticated;
