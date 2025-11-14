-- Fix RLS Policy for User Signup
-- Run this in Supabase SQL Editor

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create a new policy that allows authenticated users to insert their own profile
-- This works because after signUp(), the user is authenticated but their profile doesn't exist yet
CREATE POLICY "Users can insert own profile during signup"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Alternative: If the above doesn't work, we can make the insert less restrictive during signup
-- DROP POLICY IF EXISTS "Users can insert own profile during signup" ON users;
-- CREATE POLICY "Enable insert for authenticated users during signup"
--   ON users FOR INSERT
--   TO authenticated
--   WITH CHECK (true);
