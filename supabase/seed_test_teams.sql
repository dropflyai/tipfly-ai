-- ============================================================================
-- TEST DATA FOR TEAMS/WORKPLACES FEATURE
-- ============================================================================
-- This script creates sample workplaces and memberships for testing
-- Run this in your Supabase SQL Editor

-- NOTE: Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users
-- You can find it by running: SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- ============================================================================
-- STEP 1: Get your user ID (update email)
-- ============================================================================
-- Run this first to get your user ID:
-- SELECT id, email FROM auth.users WHERE email = 'escott1188@gmail.com';

-- Replace this with your actual UUID:
DO $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get the user ID for escott1188@gmail.com
  SELECT id INTO current_user_id
  FROM auth.users
  WHERE email = 'escott1188@gmail.com';

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found. Please update the email in this script.';
  END IF;

  -- ============================================================================
  -- WORKSPACE 1: "Downtown Restaurant Team"
  -- ============================================================================
  INSERT INTO public.workplaces (id, name, invite_code, created_by)
  VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
    'Downtown Restaurant Team',
    'DRT123',
    current_user_id
  )
  ON CONFLICT (id) DO NOTHING;

  -- Add yourself as owner
  INSERT INTO public.workplace_memberships (workplace_id, user_id, role)
  VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
    current_user_id,
    'owner'
  )
  ON CONFLICT (workplace_id, user_id) DO NOTHING;

  -- ============================================================================
  -- WORKSPACE 2: "Weekend Crew"
  -- ============================================================================
  INSERT INTO public.workplaces (id, name, invite_code, created_by)
  VALUES (
    'a1b2c3d4-e5f6-4789-a123-456789abcdef'::uuid,
    'Weekend Crew',
    'WKND42',
    current_user_id
  )
  ON CONFLICT (id) DO NOTHING;

  -- Add yourself as owner
  INSERT INTO public.workplace_memberships (workplace_id, user_id, role)
  VALUES (
    'a1b2c3d4-e5f6-4789-a123-456789abcdef'::uuid,
    current_user_id,
    'owner'
  )
  ON CONFLICT (workplace_id, user_id) DO NOTHING;

  -- ============================================================================
  -- WORKSPACE 3: "The Bistro Team"
  -- ============================================================================
  INSERT INTO public.workplaces (id, name, invite_code, created_by)
  VALUES (
    'b2c3d4e5-f6a7-4890-b234-567890bcdefg'::uuid,
    'The Bistro Team',
    'BISTR9',
    current_user_id
  )
  ON CONFLICT (id) DO NOTHING;

  -- Add yourself as member (not owner)
  INSERT INTO public.workplace_memberships (workplace_id, user_id, role)
  VALUES (
    'b2c3d4e5-f6a7-4890-b234-567890bcdefg'::uuid,
    current_user_id,
    'member'
  )
  ON CONFLICT (workplace_id, user_id) DO NOTHING;

  RAISE NOTICE 'Test data created successfully for user: %', current_user_id;
  RAISE NOTICE '✅ Created 3 workplaces:';
  RAISE NOTICE '   1. Downtown Restaurant Team (Owner) - Code: DRT123';
  RAISE NOTICE '   2. Weekend Crew (Owner) - Code: WKND42';
  RAISE NOTICE '   3. The Bistro Team (Member) - Code: BISTR9';

END $$;

-- ============================================================================
-- VERIFY THE DATA
-- ============================================================================
-- Run this to see your workplaces:
SELECT
  w.id,
  w.name,
  w.invite_code,
  wm.role,
  w.created_at
FROM public.workplaces w
JOIN public.workplace_memberships wm ON w.id = wm.workplace_id
WHERE wm.user_id IN (SELECT id FROM auth.users WHERE email = 'escott1188@gmail.com')
ORDER BY w.created_at DESC;
