-- ============================================================================
-- COMPLETE FIX: Remove recursive policies and use proper approach
-- ============================================================================

-- Step 1: Drop all problematic policies
DROP POLICY IF EXISTS "Users can view their workplaces" ON public.workplaces;
DROP POLICY IF EXISTS "Users can view workplace memberships" ON public.workplace_memberships;
DROP POLICY IF EXISTS "Users can join workplaces" ON public.workplace_memberships;
DROP POLICY IF EXISTS "Users can leave workplaces" ON public.workplace_memberships;

-- Step 2: Create a helper function (runs with elevated privileges to avoid recursion)
CREATE OR REPLACE FUNCTION public.user_is_workplace_member(workplace_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workplace_memberships
    WHERE workplace_id = workplace_uuid
      AND user_id = user_uuid
  );
$$;

-- Step 3: Create simple, non-recursive policies

-- WORKPLACES POLICIES
CREATE POLICY "Users can view workplaces they are members of"
  ON public.workplaces FOR SELECT
  USING (
    auth.uid() = created_by
    OR
    public.user_is_workplace_member(id, auth.uid())
  );

-- WORKPLACE MEMBERSHIPS POLICIES
CREATE POLICY "Users can view all memberships in their workplaces"
  ON public.workplace_memberships FOR SELECT
  USING (
    -- Users can see their own memberships
    auth.uid() = user_id
    OR
    -- Users can see other members in workplaces they belong to
    public.user_is_workplace_member(workplace_id, auth.uid())
  );

CREATE POLICY "Users can create their own memberships"
  ON public.workplace_memberships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memberships"
  ON public.workplace_memberships FOR DELETE
  USING (auth.uid() = user_id);
